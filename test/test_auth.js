(async () => {
  const base = 'http://localhost:8000';
  const email = `testuser+${Date.now()}@example.com`;
  const password = 'TestPass123!';
  const name = 'Test User';

  function log(...args) { console.log(...args); }

  try {
    log('TEST 1: Signing up new user:', email);
    let res = await fetch(base + '/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    let json = await res.json().catch(() => ({}));
    log('Signup response status:', res.status);
    log('Signup response:', JSON.stringify(json, null, 2));
    
    if (!res.ok) {
      throw new Error(`Signup failed: ${json.error || JSON.stringify(json)}`);
    }

    const token = json.token;
    if (!token) throw new Error('No token returned from signup: ' + JSON.stringify(json));
    log('\nTEST 1 PASSED: Signup successful, got token');

    log('\nTEST 2: Logging in with same credentials');
    res = await fetch(base + '/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    json = await res.json().catch(() => ({}));
    log('Login response status:', res.status);
    log('Login response:', JSON.stringify(json, null, 2));

    if (!res.ok) {
      throw new Error(`Login failed: ${json.error || JSON.stringify(json)}`);
    }

    log('\nTEST 2 PASSED: Login successful');
    console.log('\n✅ All tests passed: Signup and Login working correctly!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test failed:', err.message);
    process.exit(1);
  }
})();
