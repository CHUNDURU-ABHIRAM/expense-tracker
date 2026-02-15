// Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }

    // Transaction modal
    const modal = document.getElementById('transactionModal');
    const addTransactionBtn = document.getElementById('addTransactionBtn');
    const addFirstTransactionBtn = document.getElementById('addFirstTransaction');
    const cancelTransactionBtn = document.getElementById('cancelTransaction');
    const closeBtn = document.querySelector('.close-modal');
    
    // Open modal
    function openModal() {
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
    
    // Close modal
    function closeModal() {
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            document.getElementById('transactionForm').reset();
        }
    }
    
    // Add event listeners
    if (addTransactionBtn) {
        addTransactionBtn.addEventListener('click', openModal);
    }
    
    if (addFirstTransactionBtn) {
        addFirstTransactionBtn.addEventListener('click', openModal);
    }
    
    if (cancelTransactionBtn) {
        cancelTransactionBtn.addEventListener('click', closeModal);
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    // Close modal on background click
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    // Transaction type toggle
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            toggleBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Transaction form submission
    const transactionForm = document.getElementById('transactionForm');
    if (transactionForm) {
        transactionForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const type = document.querySelector('.toggle-btn.active').dataset.type;
            const amount = document.getElementById('amount').value;
            const category = document.getElementById('category').value;
            const date = document.getElementById('date').value;
            const description = document.getElementById('description').value;
            
            const expenseData = {
                type,
                amount: parseFloat(amount),
                category,
                date,
                description: description || `${category} transaction`
            };
            
            // Add expense using expense manager
            if (window.expenseManager) {
                await window.expenseManager.addExpense(expenseData);
                closeModal();
            }
        });
    }
    
    // Set today's date as default
    const dateInput = document.getElementById('date');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
        dateInput.value = new Date().toISOString().split('T')[0];
    }
});
