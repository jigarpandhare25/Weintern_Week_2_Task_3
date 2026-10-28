const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../backend/models/User');
const RevokedToken = require('../backend/models/RevokedToken');
const { app, server } = require('../backend/server');

const BASE_URL = `http://localhost:${process.env.PORT || 5000}`;

let testUserToken = null;
let adminUserToken = null;

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('   RUNNING AUTOMATED AUTHENTICATION TEST SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail = '') {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName} - ${detail}`);
      failed++;
    }
  }

  try {
    // Wait for server connection to be fully ready
    await new Promise(resolve => setTimeout(resolve, 800));

    // Test 1: Health Check Endpoint
    {
      const res = await fetch(`${BASE_URL}/api/health`);
      const data = await res.json();
      assert(res.status === 200 && data.status === 'healthy', 'GET /api/health returns 200 Healthy');
    }

    // Clean up any existing test accounts
    const testUsername = `testuser_${Date.now()}`;
    const testEmail = `${testUsername}@example.com`;
    const testPassword = 'StrongPassword123!';

    // Test 2: Register New User with Strong Password & Hashing
    {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: testUsername,
          email: testEmail,
          password: testPassword,
          fullName: 'Test Automation'
        })
      });
      const data = await res.json();
      assert(res.status === 201 && data.success === true && !!data.token, 'POST /api/auth/register creates user & returns JWT');
      testUserToken = data.token;

      // Verify in DB that password was hashed with bcrypt ($2a$ or $2b$) and NOT stored in plaintext
      const dbUser = await User.findOne({ username: testUsername }).select('+password');
      const isBcrypt = dbUser.password.startsWith('$2a$') || dbUser.password.startsWith('$2b$');
      assert(isBcrypt && dbUser.password !== testPassword, 'Password is cryptographically hashed with bcrypt (never plaintext)');
    }

    // Test 3: Reject Duplicate Username (409 Conflict)
    {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: testUsername,
          email: `other_${Date.now()}@example.com`,
          password: testPassword
        })
      });
      assert(res.status === 409, 'POST /api/auth/register rejects duplicate username with 409 Conflict');
    }

    // Test 4: Reject Duplicate Email (409 Conflict)
    {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: `user_${Date.now()}`,
          email: testEmail,
          password: testPassword
        })
      });
      assert(res.status === 409, 'POST /api/auth/register rejects duplicate email with 409 Conflict');
    }

    // Test 5: Reject Weak Password (Validation Middleware)
    {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: `weak_${Date.now()}`,
          email: `weak_${Date.now()}@example.com`,
          password: 'weak'
        })
      });
      assert(res.status === 400, 'POST /api/auth/register enforces minimum password strength (400 Bad Request)');
    }

    // Test 6: Login with Valid Credentials
    {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: testUsername,
          password: testPassword
        })
      });
      const data = await res.json();
      assert(res.status === 200 && data.success === true && !!data.token, 'POST /api/auth/login validates credentials and issues JWT');
    }

    // Test 7: Login with Invalid Password (401 Unauthorized)
    {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: testUsername,
          password: 'IncorrectPassword999!'
        })
      });
      assert(res.status === 401, 'POST /api/auth/login rejects incorrect password with 401 Unauthorized');
    }

    // Test 8: Login with Non-Existent User
    {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'ghost_user_does_not_exist',
          password: 'SomePassword123!'
        })
      });
      assert(res.status === 401, 'POST /api/auth/login rejects non-existent identifier with 401 Unauthorized');
    }

    // Test 9: Protected Route - Access with Valid JWT
    {
      const res = await fetch(`${BASE_URL}/api/protected/dashboard`, {
        headers: { 'Authorization': `Bearer ${testUserToken}` }
      });
      const data = await res.json();
      assert(res.status === 200 && data.success === true, 'GET /api/protected/dashboard grants access with valid JWT');
    }

    // Test 10: Protected Route - Access WITHOUT Token (401 Unauthorized)
    {
      const res = await fetch(`${BASE_URL}/api/protected/dashboard`);
      assert(res.status === 401, 'GET /api/protected/dashboard blocks unauthenticated requests (401 Unauthorized)');
    }

    // Test 11: Protected Route - Access with Tampered / Malformed Token (401)
    {
      const res = await fetch(`${BASE_URL}/api/protected/dashboard`, {
        headers: { 'Authorization': 'Bearer invalid.tampered.token' }
      });
      assert(res.status === 401, 'GET /api/protected/dashboard blocks malformed token (401 Unauthorized)');
    }

    // Test 12: Admin Login & Role-Based Access Control (RBAC)
    {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'admin_user',
          password: 'AdminSecret123!'
        })
      });
      const data = await res.json();
      adminUserToken = data.token;
      assert(res.status === 200 && data.user.role === 'admin', 'Login as administrator account');

      // Admin accesses /api/protected/admin/users -> 200 OK
      const adminRes = await fetch(`${BASE_URL}/api/protected/admin/users`, {
        headers: { 'Authorization': `Bearer ${adminUserToken}` }
      });
      assert(adminRes.status === 200, 'Admin role authorized to access /api/protected/admin/users');

      // Standard user accesses /api/protected/admin/users -> 403 Forbidden
      const userRes = await fetch(`${BASE_URL}/api/protected/admin/users`, {
        headers: { 'Authorization': `Bearer ${testUserToken}` }
      });
      assert(userRes.status === 403, 'Standard user blocked from admin route with 403 Forbidden (RBAC)');
    }

    // Test 13: Logout and Server-Side Token Revocation
    {
      const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${testUserToken}` }
      });
      assert(logoutRes.status === 200, 'POST /api/auth/logout invalidates session');

      // Attempt to reuse revoked token -> MUST be rejected with 401
      const reuseRes = await fetch(`${BASE_URL}/api/protected/dashboard`, {
        headers: { 'Authorization': `Bearer ${testUserToken}` }
      });
      assert(reuseRes.status === 401, 'Revoked token rejected on protected routes (Server-Side Blacklist)');
    }

    console.log('\n======================================================');
    console.log(`   TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

  } catch (err) {
    console.error('Fatal error during test suite:', err);
    failed++;
  } finally {
    server.close();
    await mongoose.connection.close();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTestSuite();
