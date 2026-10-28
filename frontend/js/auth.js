/**
 * AuthShield Authentication Manager
 * Handles user state, session validation, JWT decoding, and auth transactions.
 */

const auth = {
  state: {
    user: null,
    token: null,
    isAuthenticated: false,
    sessionExpiresAt: null
  },

  listeners: [],

  // Subscribe to auth state updates
  subscribe(fn) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  },

  // Notify all subscribers of state changes
  notify() {
    this.listeners.forEach(fn => fn({ ...this.state }));
  },

  // Decode JWT payload (without needing external libraries)
  decodeJwt(token) {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.warn('Error decoding JWT payload:', e);
      return null;
    }
  },

  // Initialize auth state by verifying existing session
  async init() {
    const savedToken = api.getToken();
    let savedUser = null;
    try {
      const rawUser = localStorage.getItem('auth_user');
      if (rawUser) savedUser = JSON.parse(rawUser);
    } catch (e) {}

    if (savedToken) {
      this.state.token = savedToken;
      this.state.user = savedUser;
      this.state.isAuthenticated = true;

      const decoded = this.decodeJwt(savedToken);
      if (decoded && decoded.exp) {
        this.state.sessionExpiresAt = new Date(decoded.exp * 1000);
      }
      this.notify();

      // Verify token validity with backend
      const res = await api.get('/api/auth/me', { ignore401: true });
      if (res.ok && res.data.user) {
        this.state.user = res.data.user;
        localStorage.setItem('auth_user', JSON.stringify(res.data.user));
        this.notify();
      } else {
        // Token is invalid/expired on backend
        this.clearSession();
      }
    } else {
      // Check if HttpOnly cookie is present by attempting /api/auth/me
      const res = await api.get('/api/auth/me', { ignore401: true });
      if (res.ok && res.data.user) {
        this.state.user = res.data.user;
        this.state.isAuthenticated = true;
        this.notify();
      }
    }
  },

  // Register new user
  async register(userData) {
    const res = await api.post('/api/auth/register', userData);
    if (res.ok && res.data.success) {
      this.setSession(res.data.token, res.data.user);
    }
    return res;
  },

  // Login user
  async login(identifier, password) {
    const res = await api.post('/api/auth/login', { identifier, password });
    if (res.ok && res.data.success) {
      this.setSession(res.data.token, res.data.user);
    }
    return res;
  },

  // Set active session
  setSession(token, user) {
    this.state.token = token;
    this.state.user = user;
    this.state.isAuthenticated = true;

    if (token) {
      api.setToken(token);
      const decoded = this.decodeJwt(token);
      if (decoded && decoded.exp) {
        this.state.sessionExpiresAt = new Date(decoded.exp * 1000);
      }
    }

    if (user) {
      try {
        localStorage.setItem('auth_user', JSON.stringify(user));
      } catch (e) {}
    }

    this.notify();
  },

  // Logout and revoke token
  async logout() {
    try {
      await api.post('/api/auth/logout', {}, { ignore401: true });
    } catch (e) {
      console.warn('Logout request failed:', e);
    } finally {
      this.clearSession();
    }
  },

  // Clear local session state
  clearSession() {
    this.state.token = null;
    this.state.user = null;
    this.state.isAuthenticated = false;
    this.state.sessionExpiresAt = null;
    api.clearToken();
    this.notify();
  },

  // Get protected dashboard data
  async getDashboardData() {
    return await api.get('/api/protected/dashboard');
  },

  // Update profile
  async updateProfile(profileData) {
    const res = await api.put('/api/protected/profile', profileData);
    if (res.ok && res.data.user) {
      this.state.user = { ...this.state.user, ...res.data.user };
      localStorage.setItem('auth_user', JSON.stringify(this.state.user));
      this.notify();
    }
    return res;
  },

  // Change password
  async changePassword(currentPassword, newPassword) {
    return await api.post('/api/protected/change-password', {
      currentPassword,
      newPassword
    });
  },

  // Admin user list
  async getAdminUsers() {
    return await api.get('/api/protected/admin/users');
  }
};

window.auth = auth;
