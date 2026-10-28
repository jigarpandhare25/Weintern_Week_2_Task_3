/**
 * AuthShield API Client
 * Provides unified fetch abstraction with Bearer header and cookie credentials.
 */

const API_BASE_URL = ''; // Relative to host

const api = {
  // Get stored token from localStorage
  getToken() {
    try {
      return localStorage.getItem('auth_token');
    } catch (e) {
      return null;
    }
  },

  // Set stored token
  setToken(token) {
    try {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    } catch (e) {
      console.error('Storage error:', e);
    }
  },

  // Clear stored token
  clearToken() {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    } catch (e) {}
  },

  // Unified HTTP Request Method
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = options.tokenOverride !== undefined ? options.tokenOverride : this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    // Attach Bearer token if present and not intentionally suppressed
    if (token && !options.skipAuth) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      method: options.method || 'GET',
      headers,
      credentials: 'include', // Include HttpOnly cookies automatically
      ...(options.body ? { body: JSON.stringify(options.body) } : {})
    };

    try {
      const response = await fetch(url, config);
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { success: response.ok, message: text };
      }

      // If token expired or invalid (401), trigger notification event unless suppressed
      if (response.status === 401 && !options.ignore401) {
        window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: data }));
      }

      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        data
      };
    } catch (error) {
      console.error(`[API Request Error] ${options.method || 'GET'} ${url}:`, error);
      return {
        ok: false,
        status: 0,
        statusText: 'Network Error',
        data: {
          success: false,
          message: 'Unable to reach the server. Please check your network connection.'
        }
      };
    }
  },

  // Convenience methods
  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  },

  post(endpoint, body = {}, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  },

  put(endpoint, body = {}, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  },

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
};

window.api = api;
