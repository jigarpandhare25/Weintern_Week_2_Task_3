/**
 * AuthShield Application Controller
 * Handles UI interactions, forms, password strength calculation, live token countdown,
 * and API tester panels.
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // DOM Elements
  // ==========================================
  
  // Navigation
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const navLoginBtn = document.getElementById('navLoginBtn');
  const navRegisterBtn = document.getElementById('navRegisterBtn');
  const navDashboardBtn = document.getElementById('navDashboardBtn');
  const navApiBtn = document.getElementById('navApiBtn');
  const dashLockBadge = document.getElementById('dashLockBadge');
  const dashboardTabIcon = document.getElementById('dashboardTabIcon');
  const userNavMenu = document.getElementById('userNavMenu');
  const navUserAvatar = document.getElementById('navUserAvatar');
  const navLogoutBtn = document.getElementById('navLogoutBtn');
  const serverStatusText = document.getElementById('serverStatusText');
  const serverStatusDot = document.querySelector('.status-dot');

  // Quick switch links
  const linkToRegister = document.getElementById('linkToRegister');
  const linkToLogin = document.getElementById('linkToLogin');
  const btnGateSignIn = document.getElementById('btnGateSignIn');
  const btnGateRegister = document.getElementById('btnGateRegister');

  // Login Form
  const loginForm = document.getElementById('loginForm');
  const loginIdentifier = document.getElementById('loginIdentifier');
  const loginPassword = document.getElementById('loginPassword');
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');
  const loginAlert = document.getElementById('loginAlert');
  const btnFillDemoUser = document.getElementById('btnFillDemoUser');
  const btnFillWrongPw = document.getElementById('btnFillWrongPw');

  // Register Form
  const registerForm = document.getElementById('registerForm');
  const regUsername = document.getElementById('regUsername');
  const regEmail = document.getElementById('regEmail');
  const regPassword = document.getElementById('regPassword');
  const regFullName = document.getElementById('regFullName');
  const regRole = document.getElementById('regRole');
  const registerSubmitBtn = document.getElementById('registerSubmitBtn');
  const registerAlert = document.getElementById('registerAlert');

  // Password Strength Meter Elements
  const pwMeterFill = document.getElementById('pwMeterFill');
  const pwMeterStatus = document.getElementById('pwMeterStatus');
  const critLength = document.getElementById('critLength');
  const critLower = document.getElementById('critLower');
  const critUpper = document.getElementById('critUpper');
  const critNumber = document.getElementById('critNumber');
  const critSpecial = document.getElementById('critSpecial');

  // Dashboard View Elements
  const unauthGate = document.getElementById('unauthGate');
  const authDashboard = document.getElementById('authDashboard');
  const dashUserAvatar = document.getElementById('dashUserAvatar');
  const dashUserGreeting = document.getElementById('dashUserGreeting');
  const dashUserEmail = document.getElementById('dashUserEmail');
  const dashUserCreatedAt = document.getElementById('dashUserCreatedAt');
  const dashUserRoleBadge = document.getElementById('dashUserRoleBadge');
  const dashLogoutBtn = document.getElementById('dashLogoutBtn');

  // Dashboard Metrics
  const metricSessionStatus = document.getElementById('metricSessionStatus');
  const metricAuthMethod = document.getElementById('metricAuthMethod');
  const metricTokenCountdown = document.getElementById('metricTokenCountdown');
  const metricTokenExpiresAt = document.getElementById('metricTokenExpiresAt');
  const metricTotalUsers = document.getElementById('metricTotalUsers');

  // Profile and Password Forms
  const profileForm = document.getElementById('profileForm');
  const profUsername = document.getElementById('profUsername');
  const profEmail = document.getElementById('profEmail');
  const profFullName = document.getElementById('profFullName');
  const profBio = document.getElementById('profBio');
  const profileAlert = document.getElementById('profileAlert');

  const changePasswordForm = document.getElementById('changePasswordForm');
  const currPassword = document.getElementById('currPassword');
  const newPassword = document.getElementById('newPassword');
  const changePwAlert = document.getElementById('changePwAlert');

  // JWT Inspector & API Tester
  const jwtPayloadViewer = document.getElementById('jwtPayloadViewer');
  const btnCopyJwt = document.getElementById('btnCopyJwt');
  const btnTestProtectedValid = document.getElementById('btnTestProtectedValid');
  const btnTestProtectedInvalid = document.getElementById('btnTestProtectedInvalid');
  const btnTestAdminUsers = document.getElementById('btnTestAdminUsers');
  const testerResponseStatus = document.getElementById('testerResponseStatus');
  const testerResponseTime = document.getElementById('testerResponseTime');
  const testerResponseViewer = document.getElementById('testerResponseViewer');

  // Admin Card
  const adminPanelCard = document.getElementById('adminPanelCard');
  const adminUsersTableBody = document.getElementById('adminUsersTableBody');

  // Countdown timer reference
  let countdownInterval = null;

  // ==========================================
  // Toast Notification System
  // ==========================================
  const toastContainer = document.getElementById('toastContainer');

  function showToast(message, type = 'info', duration = 3500) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
    } else if (type === 'error') {
      iconSvg = `<svg class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    } else {
      iconSvg = `<svg class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }

    toast.innerHTML = `${iconSvg}<div>${message}</div>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // ==========================================
  // Tab Switching
  // ==========================================
  function switchTab(targetTabId) {
    tabPanes.forEach(pane => {
      if (pane.id === targetTabId) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });

    navTabs.forEach(tab => {
      if (tab.getAttribute('data-tab') === targetTabId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // If opening dashboard while authenticated, refresh data
    if (targetTabId === 'dashboardTab' && auth.state.isAuthenticated) {
      loadDashboard();
    }
  }

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchTab(tab.getAttribute('data-tab'));
    });
  });

  if (linkToRegister) linkToRegister.addEventListener('click', (e) => { e.preventDefault(); switchTab('registerTab'); });
  if (linkToLogin) linkToLogin.addEventListener('click', (e) => { e.preventDefault(); switchTab('loginTab'); });
  if (btnGateSignIn) btnGateSignIn.addEventListener('click', () => switchTab('loginTab'));
  if (btnGateRegister) btnGateRegister.addEventListener('click', () => switchTab('registerTab'));

  // ==========================================
  // Password Visibility Toggle
  // ==========================================
  document.querySelectorAll('.btn-toggle-pw').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (!input) return;

      if (input.type === 'password') {
        input.type = 'text';
        btn.innerHTML = `<svg class="eye-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
      } else {
        input.type = 'password';
        btn.innerHTML = `<svg class="eye-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
      }
    });
  });

  // ==========================================
  // Realtime Password Strength Meter
  // ==========================================
  function updatePasswordStrength(val) {
    if (!pwMeterFill || !pwMeterStatus) return;

    const hasMinLen = val.length >= 8;
    const hasLower = /[a-z]/.test(val);
    const hasUpper = /[A-Z]/.test(val);
    const hasNumber = /[0-9]/.test(val);
    const hasSpecial = /[^a-zA-Z0-9]/.test(val);

    // Update criteria indicators
    if (critLength) critLength.classList.toggle('met', hasMinLen);
    if (critLower) critLower.classList.toggle('met', hasLower);
    if (critUpper) critUpper.classList.toggle('met', hasUpper);
    if (critNumber) critNumber.classList.toggle('met', hasNumber);
    if (critSpecial) critSpecial.classList.toggle('met', hasSpecial);

    if (!val) {
      pwMeterFill.style.width = '0%';
      pwMeterFill.style.backgroundColor = 'transparent';
      pwMeterStatus.textContent = 'Enter password';
      pwMeterStatus.style.color = 'var(--text-dim)';
      return;
    }

    let score = 0;
    if (hasMinLen) score++;
    if (hasLower) score++;
    if (hasUpper) score++;
    if (hasNumber) score++;
    if (hasSpecial) score++;

    if (score <= 2) {
      pwMeterFill.style.width = '25%';
      pwMeterFill.style.backgroundColor = 'var(--danger)';
      pwMeterStatus.textContent = 'Weak';
      pwMeterStatus.style.color = 'var(--danger)';
    } else if (score === 3) {
      pwMeterFill.style.width = '50%';
      pwMeterFill.style.backgroundColor = 'var(--warning)';
      pwMeterStatus.textContent = 'Fair';
      pwMeterStatus.style.color = 'var(--warning)';
    } else if (score === 4) {
      pwMeterFill.style.width = '75%';
      pwMeterFill.style.backgroundColor = 'var(--accent-cyan)';
      pwMeterStatus.textContent = 'Good';
      pwMeterStatus.style.color = 'var(--accent-cyan)';
    } else {
      pwMeterFill.style.width = '100%';
      pwMeterFill.style.backgroundColor = 'var(--success)';
      pwMeterStatus.textContent = 'Strong (Excellent)';
      pwMeterStatus.style.color = 'var(--success)';
    }
  }

  if (regPassword) {
    regPassword.addEventListener('input', (e) => {
      updatePasswordStrength(e.target.value);
    });
  }

  // ==========================================
  // Helper: Display Form Alert
  // ==========================================
  function showAlert(alertEl, message, type = 'danger') {
    if (!alertEl) return;
    alertEl.className = `alert-box alert-${type}`;
    alertEl.innerHTML = message;
    alertEl.classList.remove('hidden');
  }

  function hideAlert(alertEl) {
    if (!alertEl) return;
    alertEl.className = 'alert-box hidden';
    alertEl.innerHTML = '';
  }

  function setButtonLoading(btn, isLoading, text = 'Loading...') {
    if (!btn) return;
    const btnText = btn.querySelector('.btn-text');
    const spinner = btn.querySelector('.btn-spinner');
    btn.disabled = isLoading;
    if (isLoading) {
      if (btnText) btnText.textContent = text;
      if (spinner) spinner.classList.remove('hidden');
    } else {
      if (btnText) btnText.textContent = btn.getAttribute('data-original-text') || text;
      if (spinner) spinner.classList.add('hidden');
    }
  }

  // Store original button text
  if (loginSubmitBtn) loginSubmitBtn.setAttribute('data-original-text', 'Sign In');
  if (registerSubmitBtn) registerSubmitBtn.setAttribute('data-original-text', 'Register Account');

  // ==========================================
  // Login Form Submission
  // ==========================================
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert(loginAlert);

      const identifier = loginIdentifier.value.trim();
      const password = loginPassword.value;

      if (!identifier) {
        showAlert(loginAlert, 'Please enter your email or username.');
        loginIdentifier.focus();
        return;
      }

      if (!password) {
        showAlert(loginAlert, 'Please enter your password.');
        loginPassword.focus();
        return;
      }

      setButtonLoading(loginSubmitBtn, true, 'Verifying Credentials...');

      const res = await auth.login(identifier, password);
      setButtonLoading(loginSubmitBtn, false);

      if (res.ok && res.data.success) {
        showToast('Login successful! Welcome back.', 'success');
        loginForm.reset();
        switchTab('dashboardTab');
      } else {
        const errorMsg = res.data && res.data.message 
          ? res.data.message 
          : 'Invalid credentials. Please try again.';
        showAlert(loginAlert, errorMsg, 'danger');
        showToast(errorMsg, 'error');
      }
    });
  }

  // ==========================================
  // Register Form Submission
  // ==========================================
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert(registerAlert);

      const username = regUsername.value.trim();
      const email = regEmail.value.trim();
      const password = regPassword.value;
      const fullName = regFullName.value.trim();
      const role = regRole.value;

      // Basic client-side validation
      if (!username || username.length < 3) {
        showAlert(registerAlert, 'Username must be at least 3 characters long.');
        regUsername.focus();
        return;
      }

      if (!email || !email.includes('@')) {
        showAlert(registerAlert, 'Please enter a valid email address.');
        regEmail.focus();
        return;
      }

      if (password.length < 8) {
        showAlert(registerAlert, 'Password must be at least 8 characters long.');
        regPassword.focus();
        return;
      }

      setButtonLoading(registerSubmitBtn, true, 'Creating Account & Hashing Password...');

      const res = await auth.register({
        username,
        email,
        password,
        fullName,
        role
      });

      setButtonLoading(registerSubmitBtn, false);

      if (res.ok && res.data.success) {
        showToast('Account registered successfully! JWT session active.', 'success');
        registerForm.reset();
        updatePasswordStrength('');
        switchTab('dashboardTab');
      } else {
        let msg = res.data && res.data.message ? res.data.message : 'Registration failed.';
        if (res.data && res.data.errors && res.data.errors.length) {
          msg = res.data.errors.map(err => err.message).join('<br>&bull; ');
          msg = `<strong>Validation Error:</strong><br>&bull; ${msg}`;
        }
        showAlert(registerAlert, msg, 'danger');
        showToast('Registration failed. Check inputs.', 'error');
      }
    });
  }

  // ==========================================
  // Quick Demo Fill Buttons
  // ==========================================
  if (btnFillDemoUser) {
    btnFillDemoUser.addEventListener('click', () => {
      loginIdentifier.value = 'demo_user';
      loginPassword.value = 'SecurePass123!';
      showToast('Demo credentials inserted: demo_user / SecurePass123!', 'info');
    });
  }

  if (btnFillWrongPw) {
    btnFillWrongPw.addEventListener('click', () => {
      loginIdentifier.value = 'demo_user';
      loginPassword.value = 'WrongPassword999!';
      showToast('Wrong password filled. Click "Sign In" to observe authentication rejection!', 'info');
    });
  }

  // ==========================================
  // Logout Actions
  // ==========================================
  async function handleLogout() {
    await auth.logout();
    showToast('Logged out successfully. Token session revoked on server.', 'info');
    switchTab('loginTab');
  }

  if (dashLogoutBtn) dashLogoutBtn.addEventListener('click', handleLogout);
  if (navLogoutBtn) navLogoutBtn.addEventListener('click', handleLogout);

  // Listen for 401 unauthorized event from api.js
  window.addEventListener('auth:unauthorized', (e) => {
    auth.clearSession();
    showToast('Your session has expired or was terminated. Please sign in.', 'error');
    switchTab('loginTab');
  });

  // ==========================================
  // Dashboard & Token Countdown
  // ==========================================
  function updateCountdown() {
    if (!auth.state.sessionExpiresAt) {
      if (metricTokenCountdown) metricTokenCountdown.textContent = '--:--:--';
      return;
    }

    const now = new Date().getTime();
    const distance = auth.state.sessionExpiresAt.getTime() - now;

    if (distance <= 0) {
      if (metricTokenCountdown) metricTokenCountdown.textContent = 'Expired';
      if (countdownInterval) clearInterval(countdownInterval);
      auth.clearSession();
      showToast('Token expired. Please log in again.', 'error');
      switchTab('loginTab');
      return;
    }

    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const pad = n => String(n).padStart(2, '0');
    if (metricTokenCountdown) {
      metricTokenCountdown.textContent = `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
    }
  }

  async function loadDashboard() {
    if (!auth.state.isAuthenticated) return;

    const res = await auth.getDashboardData();
    if (res.ok && res.data.success) {
      const data = res.data.data;
      const user = data.user;

      // Update Greeting and Badges
      if (dashUserGreeting) dashUserGreeting.textContent = user.fullName || user.username;
      if (dashUserEmail) dashUserEmail.textContent = user.email;
      if (dashUserCreatedAt) {
        dashUserCreatedAt.textContent = new Date(user.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }

      const initials = (user.fullName || user.username).slice(0, 2).toUpperCase();
      if (dashUserAvatar) dashUserAvatar.textContent = initials;
      if (navUserAvatar) navUserAvatar.textContent = initials;

      if (dashUserRoleBadge) {
        dashUserRoleBadge.textContent = user.role.toUpperCase();
        dashUserRoleBadge.className = `user-role-badge ${user.role === 'admin' ? 'admin' : ''}`;
      }

      // Profile Form Pre-fill
      if (profUsername) profUsername.value = user.username;
      if (profEmail) profEmail.value = user.email;
      if (profFullName) profFullName.value = user.fullName || '';
      if (profBio) profBio.value = user.bio || '';

      // Metrics
      if (metricAuthMethod) metricAuthMethod.textContent = data.session.authMethod || 'Bearer / Cookie';
      if (metricTotalUsers) metricTotalUsers.textContent = data.systemStats.totalRegisteredUsers;

      // Admin panel handling
      if (user.role === 'admin') {
        if (adminPanelCard) adminPanelCard.classList.remove('hidden');
        loadAdminUsers();
      } else {
        if (adminPanelCard) adminPanelCard.classList.add('hidden');
      }

      // JWT Inspector
      updateJwtInspector();

      // Start countdown
      if (countdownInterval) clearInterval(countdownInterval);
      updateCountdown();
      countdownInterval = setInterval(updateCountdown, 1000);
    }
  }

  function updateJwtInspector() {
    const token = auth.state.token || api.getToken();
    if (!token) {
      if (jwtPayloadViewer) jwtPayloadViewer.textContent = '// No active JWT token in client storage';
      return;
    }

    const decoded = auth.decodeJwt(token);
    if (decoded && jwtPayloadViewer) {
      jwtPayloadViewer.textContent = JSON.stringify(decoded, null, 2);
    }
  }

  if (btnCopyJwt) {
    btnCopyJwt.addEventListener('click', () => {
      const token = auth.state.token || api.getToken();
      if (!token) {
        showToast('No active token to copy', 'error');
        return;
      }
      navigator.clipboard.writeText(token).then(() => {
        showToast('Raw JWT token copied to clipboard!', 'success');
      }).catch(() => {
        showToast('Unable to copy token', 'error');
      });
    });
  }

  // ==========================================
  // Profile Update Form
  // ==========================================
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert(profileAlert);

      const fullName = profFullName.value.trim();
      const bio = profBio.value.trim();

      const res = await auth.updateProfile({ fullName, bio });
      if (res.ok && res.data.success) {
        showAlert(profileAlert, 'Profile updated successfully!', 'success');
        showToast('Profile updated!', 'success');
        if (dashUserGreeting) dashUserGreeting.textContent = fullName || auth.state.user.username;
      } else {
        const msg = res.data && res.data.message ? res.data.message : 'Failed to update profile.';
        showAlert(profileAlert, msg, 'danger');
      }
    });
  }

  // ==========================================
  // Password Change Form
  // ==========================================
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert(changePwAlert);

      const current = currPassword.value;
      const nextPw = newPassword.value;

      if (!current || !nextPw) {
        showAlert(changePwAlert, 'Please enter both current and new password.');
        return;
      }

      if (nextPw.length < 8) {
        showAlert(changePwAlert, 'New password must be at least 8 characters long.');
        return;
      }

      const res = await auth.changePassword(current, nextPw);
      if (res.ok && res.data.success) {
        showAlert(changePwAlert, 'Password updated successfully! Next login requires the new password.', 'success');
        showToast('Password changed successfully!', 'success');
        changePasswordForm.reset();
      } else {
        const msg = res.data && res.data.message ? res.data.message : 'Password update failed.';
        showAlert(changePwAlert, msg, 'danger');
      }
    });
  }

  // ==========================================
  // Admin User List
  // ==========================================
  async function loadAdminUsers() {
    if (!adminUsersTableBody) return;
    const res = await auth.getAdminUsers();
    if (res.ok && res.data.users) {
      adminUsersTableBody.innerHTML = res.data.users.map(u => `
        <tr>
          <td><strong>${u.username}</strong></td>
          <td>${u.email}</td>
          <td><span class="badge-pill ${u.role === 'admin' ? 'badge-admin' : 'badge-jwt'}">${u.role}</span></td>
          <td>${new Date(u.createdAt).toLocaleDateString()}</td>
        </tr>
      `).join('');
    } else {
      adminUsersTableBody.innerHTML = `<tr><td colspan="4" class="text-danger">Failed to load admin user list.</td></tr>`;
    }
  }

  // ==========================================
  // Live Protected API Tester
  // ==========================================
  async function runApiTest(endpoint, options, label) {
    if (testerResponseStatus) testerResponseStatus.textContent = `Testing: ${label}...`;
    if (testerResponseViewer) testerResponseViewer.textContent = 'Sending request to backend...';
    
    const startTime = performance.now();
    const res = await api.request(endpoint, options);
    const duration = Math.round(performance.now() - startTime);

    if (testerResponseTime) testerResponseTime.textContent = `${duration}ms`;

    const statusBadge = res.ok 
      ? `<span class="text-success">[HTTP ${res.status} OK]</span>` 
      : `<span class="text-danger">[HTTP ${res.status} ${res.statusText}]</span>`;

    if (testerResponseStatus) {
      testerResponseStatus.innerHTML = `Response: ${statusBadge}`;
    }

    if (testerResponseViewer) {
      testerResponseViewer.textContent = JSON.stringify(res.data, null, 2);
    }
  }

  if (btnTestProtectedValid) {
    btnTestProtectedValid.addEventListener('click', () => {
      runApiTest('/api/protected/dashboard', { method: 'GET' }, 'GET /api/protected/dashboard (Valid Token)');
    });
  }

  if (btnTestProtectedInvalid) {
    btnTestProtectedInvalid.addEventListener('click', () => {
      runApiTest('/api/protected/dashboard', { method: 'GET', skipAuth: true, ignore401: true }, 'GET /api/protected/dashboard (No Token)');
    });
  }

  if (btnTestAdminUsers) {
    btnTestAdminUsers.addEventListener('click', () => {
      runApiTest('/api/protected/admin/users', { method: 'GET' }, 'GET /api/protected/admin/users (RBAC)');
    });
  }

  // ==========================================
  // Auth State Subscription
  // ==========================================
  auth.subscribe((state) => {
    if (state.isAuthenticated && state.user) {
      // Authenticated View
      if (unauthGate) unauthGate.classList.add('hidden');
      if (authDashboard) authDashboard.classList.remove('hidden');
      if (dashLockBadge) {
        dashLockBadge.textContent = 'Unlocked';
        dashLockBadge.className = 'badge-pill badge-auth';
      }
      if (dashboardTabIcon) {
        dashboardTabIcon.innerHTML = `<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>`;
      }
      if (userNavMenu) userNavMenu.classList.remove('hidden');
      if (navLoginBtn) navLoginBtn.classList.add('hidden');
      if (navRegisterBtn) navRegisterBtn.classList.add('hidden');
    } else {
      // Unauthenticated View
      if (unauthGate) unauthGate.classList.remove('hidden');
      if (authDashboard) authDashboard.classList.add('hidden');
      if (dashLockBadge) {
        dashLockBadge.textContent = 'Locked';
        dashLockBadge.className = 'badge-pill badge-unauth';
      }
      if (dashboardTabIcon) {
        dashboardTabIcon.innerHTML = `<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>`;
      }
      if (userNavMenu) userNavMenu.classList.add('hidden');
      if (navLoginBtn) navLoginBtn.classList.remove('hidden');
      if (navRegisterBtn) navRegisterBtn.classList.remove('hidden');
      if (countdownInterval) clearInterval(countdownInterval);
    }
  });

  // ==========================================
  // Server Health Check & App Init
  // ==========================================
  async function checkServerHealth() {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        if (serverStatusDot) serverStatusDot.classList.add('online');
        if (serverStatusText) serverStatusText.textContent = 'API Online (MongoDB Connected)';
      } else {
        if (serverStatusDot) serverStatusDot.classList.remove('online');
        if (serverStatusText) serverStatusText.textContent = 'API Error';
      }
    } catch (e) {
      if (serverStatusDot) serverStatusDot.classList.remove('online');
      if (serverStatusText) serverStatusText.textContent = 'API Offline';
    }
  }

  // Initialize
  checkServerHealth();
  auth.init();
});
