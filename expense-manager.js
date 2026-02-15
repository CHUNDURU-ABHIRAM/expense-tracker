// Expense Management System
class ExpenseManager {
    constructor() {
        this.expenses = [];
        this.currentUser = null;
        this.init();
    }

    async init() {
        // Check authentication
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                await this.loadExpenses();
                this.updateUI();
            } else {
                window.location.href = 'login.html';
            }
        });
    }

    // Load expenses from Firebase
    async loadExpenses() {
        try {
            const snapshot = await db.collection('users')
                .doc(this.currentUser.uid)
                .collection('expenses')
                .orderBy('date', 'desc')
                .get();
            
            this.expenses = [];
            snapshot.forEach(doc => {
                this.expenses.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
        } catch (error) {
            console.error('Error loading expenses:', error);
            this.showError('Failed to load expenses');
        }
    }

    // Add new expense
    async addExpense(expenseData) {
        try {
            const docRef = await db.collection('users')
                .doc(this.currentUser.uid)
                .collection('expenses')
                .add({
                    ...expenseData,
                    date: new Date(expenseData.date),
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

            // Add to local array
            this.expenses.unshift({
                id: docRef.id,
                ...expenseData,
                date: new Date(expenseData.date)
            });

            this.updateUI();
            this.showSuccess('Expense added successfully');
            return true;
        } catch (error) {
            console.error('Error adding expense:', error);
            this.showError('Failed to add expense');
            return false;
        }
    }

    // Delete expense
    async deleteExpense(expenseId) {
        if (!confirm('Are you sure you want to delete this expense?')) {
            return false;
        }

        try {
            await db.collection('users')
                .doc(this.currentUser.uid)
                .collection('expenses')
                .doc(expenseId)
                .delete();

            // Remove from local array
            this.expenses = this.expenses.filter(exp => exp.id !== expenseId);
            this.updateUI();
            this.showSuccess('Expense deleted successfully');
            return true;
        } catch (error) {
            console.error('Error deleting expense:', error);
            this.showError('Failed to delete expense');
            return false;
        }
    }

    // Get expenses filtered by criteria
    getFilteredExpenses(filters = {}) {
        let filtered = [...this.expenses];

        // Filter by category
        if (filters.category) {
            filtered = filtered.filter(exp => exp.category === filters.category);
        }

        // Filter by month
        if (filters.month) {
            filtered = filtered.filter(exp => {
                const expDate = new Date(exp.date);
                return expDate.getMonth() === filters.month && 
                       expDate.getFullYear() === filters.year;
            });
        }

        // Filter by search term
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(exp => 
                exp.description.toLowerCase().includes(searchTerm) ||
                exp.category.toLowerCase().includes(searchTerm)
            );
        }

        return filtered;
    }

    // Get summary statistics
    getSummary(timeRange = 'thisMonth') {
        const now = new Date();
        let startDate, endDate;

        switch(timeRange) {
            case 'thisMonth':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'lastMonth':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case 'thisYear':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }

        const filteredExpenses = this.expenses.filter(exp => {
            const expDate = new Date(exp.date);
            return expDate >= startDate && expDate <= endDate;
        });

        const totalExpenses = filteredExpenses
            .filter(exp => exp.type === 'expense')
            .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

        const totalIncome = filteredExpenses
            .filter(exp => exp.type === 'income')
            .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

        const balance = totalIncome - totalExpenses;

        // Category breakdown
        const categoryTotals = {};
        filteredExpenses.forEach(exp => {
            if (exp.type === 'expense') {
                categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + parseFloat(exp.amount);
            }
        });

        return {
            totalExpenses,
            totalIncome,
            balance,
            categoryTotals,
            transactions: filteredExpenses
        };
    }

    // Update UI based on current page
    updateUI() {
        const currentPath = window.location.pathname;
        
        if (currentPath.includes('home.html')) {
            this.updateDashboard();
        } else if (currentPath.includes('expenses.html')) {
            this.updateExpensesPage();
        } else if (currentPath.includes('reports.html')) {
            this.updateReportsPage();
        }
    }

    // Update dashboard page
    updateDashboard() {
        const summary = this.getSummary();
        
        // Update summary cards
        const balanceEl = document.getElementById('totalBalance');
        const incomeEl = document.getElementById('totalIncome');
        const expenseEl = document.getElementById('totalExpense');

        if (balanceEl) balanceEl.textContent = `$${summary.balance.toFixed(2)}`;
        if (incomeEl) incomeEl.textContent = `$${summary.totalIncome.toFixed(2)}`;
        if (expenseEl) expenseEl.textContent = `$${summary.totalExpenses.toFixed(2)}`;

        // Update recent transactions
        const transactionsList = document.getElementById('transactionsList');
        if (transactionsList) {
            const recentTransactions = summary.transactions.slice(0, 5);
            this.renderTransactionsList(transactionsList, recentTransactions);
        }
    }

    // Update expenses page
    updateExpensesPage() {
        const expensesList = document.querySelector('.expenses-list');
        if (expensesList) {
            this.renderExpensesList(expensesList);
        }
    }

    // Update reports page
    updateReportsPage() {
        const summary = this.getSummary();
        
        // Update summary cards
        const balanceEl = document.getElementById('totalBalance');
        const incomeEl = document.getElementById('totalIncome');
        const expenseEl = document.getElementById('totalExpense');

        if (balanceEl) balanceEl.textContent = `$${summary.balance.toFixed(2)}`;
        if (incomeEl) incomeEl.textContent = `$${summary.totalIncome.toFixed(2)}`;
        if (expenseEl) expenseEl.textContent = `$${summary.totalExpenses.toFixed(2)}`;

        // Update charts
        this.updateCharts(summary);
        
        // Update recent transactions in reports
        const transactionsList = document.getElementById('recentTransactionsList');
        if (transactionsList) {
            const recentTransactions = summary.transactions.slice(0, 5);
            this.renderTransactionsList(transactionsList, recentTransactions);
        }

        // Update analytics
        this.updateAnalytics(summary);
    }

    // Render expenses list
    renderExpensesList(container) {
        const expenses = this.getFilteredExpenses(this.getCurrentFilters());
        
        if (expenses.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <h4>No expenses found</h4>
                    <p>Start adding expenses to see them here</p>
                </div>
            `;
            return;
        }

        container.innerHTML = expenses.map(expense => `
            <div class="expense-item" data-id="${expense.id}">
                <div class="expense-category">
                    <span class="category-icon ${expense.category}">
                        <i class="fas ${this.getCategoryIcon(expense.category)}"></i>
                    </span>
                    <div class="expense-details">
                        <h4>${expense.description}</h4>
                        <p>${expense.category}</p>
                    </div>
                </div>
                <div class="expense-amount">
                    <span class="amount">$${parseFloat(expense.amount).toFixed(2)}</span>
                    <span class="expense-date">${this.formatDate(expense.date)}</span>
                    <button class="delete-btn" onclick="expenseManager.deleteExpense('${expense.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Render transactions list
    renderTransactionsList(container, transactions) {
        if (transactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exchange-alt"></i>
                    <h4>No transactions yet</h4>
                    <p>Add your first transaction to get started</p>
                </div>
            `;
            return;
        }

        container.innerHTML = transactions.map(transaction => `
            <div class="transaction-item">
                <div class="transaction-icon">
                    <i class="fas ${this.getCategoryIcon(transaction.category)}" 
                       style="color: ${this.getCategoryColor(transaction.category)};"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-title">${transaction.description}</div>
                    <div class="transaction-date">${this.formatDate(transaction.date)}</div>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    ${transaction.type === 'income' ? '+' : '-'}$${parseFloat(transaction.amount).toFixed(2)}
                </div>
            </div>
        `).join('');
    }

    // Update charts
    updateCharts(summary) {
        // Update category chart
        if (window.categoryChart) {
            const categories = Object.keys(summary.categoryTotals);
            const values = Object.values(summary.categoryTotals);
            
            window.categoryChart.data.labels = categories;
            window.categoryChart.data.datasets[0].data = values;
            window.categoryChart.update();
        }

        // Update trend chart
        if (window.trendChart) {
            const monthlyData = this.getMonthlyTrendData();
            window.trendChart.data.labels = monthlyData.labels;
            window.trendChart.data.datasets[0].data = monthlyData.income;
            window.trendChart.data.datasets[1].data = monthlyData.expenses;
            window.trendChart.update();
        }
    }

    // Update analytics
    updateAnalytics(summary) {
        // Update top categories
        const categoryList = document.querySelector('.category-list');
        if (categoryList) {
            const sortedCategories = Object.entries(summary.categoryTotals)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5);

            categoryList.innerHTML = sortedCategories.map(([category, amount]) => `
                <div class="category-item">
                    <div class="category-info">
                        <div class="category-color" style="background: ${this.getCategoryColor(category)};"></div>
                        <span class="category-name">${category}</span>
                    </div>
                    <span class="category-amount">$${amount.toFixed(2)}</span>
                </div>
            `).join('');
        }
    }

    // Get monthly trend data
    getMonthlyTrendData() {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const income = [3000, 3000, 3500, 3000, 3000, 3000];
        const expenses = [2100, 1900, 2300, 1800, 2000, 1900];
        
        return { labels: months, income, expenses };
    }

    // Get current filters
    getCurrentFilters() {
        const search = document.getElementById('searchExpenses')?.value || '';
        const category = document.getElementById('filterCategory')?.value || '';
        const monthValue = document.getElementById('filterMonth')?.value;
        
        let month = null, year = null;
        if (monthValue) {
            const [yearStr, monthStr] = monthValue.split('-');
            month = parseInt(monthStr) - 1;
            year = parseInt(yearStr);
        }

        return { search, category, month, year };
    }

    // Helper functions
    getCategoryIcon(category) {
        const icons = {
            'food': 'fa-utensils',
            'transportation': 'fa-car',
            'shopping': 'fa-shopping-cart',
            'bills': 'fa-file-invoice',
            'entertainment': 'fa-film',
            'health': 'fa-heartbeat',
            'education': 'fa-graduation-cap',
            'other': 'fa-ellipsis-h'
        };
        return icons[category] || 'fa-ellipsis-h';
    }

    getCategoryColor(category) {
        const colors = {
            'food': '#ef4444',
            'transportation': '#f59e0b',
            'shopping': '#8b5cf6',
            'bills': '#3b82f6',
            'entertainment': '#10b981',
            'health': '#06b6d4',
            'education': '#6366f1',
            'other': '#64748b'
        };
        return colors[category] || '#64748b';
    }

    formatDate(date) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(date).toLocaleDateString('en-US', options);
    }

    showError(message) {
        // Create or update error notification
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        // Create or update success notification
        this.showNotification(message, 'success');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
            <span>${message}</span>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'error' ? '#ef4444' : '#10b981'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize expense manager
let expenseManager;

document.addEventListener('DOMContentLoaded', function() {
    expenseManager = new ExpenseManager();
    
    // Add event listeners for filters
    const searchInput = document.getElementById('searchExpenses');
    const categoryFilter = document.getElementById('filterCategory');
    const monthFilter = document.getElementById('filterMonth');
    
    if (searchInput) {
        searchInput.addEventListener('input', () => expenseManager.updateUI());
    }
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => expenseManager.updateUI());
    }
    if (monthFilter) {
        monthFilter.addEventListener('change', () => expenseManager.updateUI());
    }
});

// Add CSS for notifications
const notificationStyles = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);
