(async () => {
  const base = 'http://localhost:8000';
  const email = `testuser+${Date.now()}@example.com`;
  const password = 'TestPass123!';
  const name = 'Test User';

  function log(...args) { console.log(...args); }

  try {
    log('Signing up test user:', email);
    let res = await fetch(base + '/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    let json = await res.json().catch(() => ({}));
    if (!res.ok) {
      // if user exists or signup failed, try login
      log('Signup failed or user exists, trying login:', json);
      res = await fetch(base + '/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error('Login failed: ' + JSON.stringify(json));
    }

    const token = json.token;
    if (!token) throw new Error('No token returned from signup/login: ' + JSON.stringify(json));
    log('Got token, sending PUT /api/budgets');

    const budgetBody = {
      monthlyBudget: 200,
      categoryBudgets: { Food: 50, Transport: 30, Shopping: 70 }
    };

    res = await fetch(base + '/api/budgets', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(budgetBody)
    });
    const saveResp = await res.json().catch(() => ({}));
    log('PUT /api/budgets status:', res.status, 'body:', saveResp);
    if (!res.ok) throw new Error('PUT budgets failed: ' + JSON.stringify(saveResp));

    log('Now GET /api/budgets to verify');
    res = await fetch(base + '/api/budgets', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const getResp = await res.json().catch(() => ({}));
    log('GET /api/budgets status:', res.status, 'body:', getResp);

    if (res.ok) {
      console.log('Test completed: budgets saved and retrieved successfully.');
      console.log(JSON.stringify(getResp, null, 2));
      process.exit(0);
    } else {
      console.error('GET budgets failed:', getResp);
      process.exit(2);
    }
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
})();
