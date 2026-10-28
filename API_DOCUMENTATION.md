# AuthShield API Documentation

## Overview
AuthShield provides a secure, production-grade RESTful API for user authentication, registration, session lifecycle management, and role-based access control (RBAC).

- **Base URL:** `http://localhost:5000/api`
- **Authentication Method:** JSON Web Tokens (JWT) via `Authorization: Bearer <token>` or `HttpOnly` Cookie (`jwt_token`).
- **Data Exchange Format:** `application/json`

---

## Authentication & Authorization Architecture

### Password Security
- Passwords are never stored in plaintext.
- Passwords are salt-hashed using **bcrypt** with **12 salt rounds** before committing to MongoDB.
- MongoDB schema enforces `select: false` on the password attribute to prevent accidental exposure in query projections.

### Session & Token Handling
- Tokens are signed with **HMAC-SHA256 (HS256)** using a server-side secret key.
- Tokens encode user metadata: `{ id, username, email, role }` with 24-hour expiration (`24h`).
- **Server-Side Token Revocation:** Upon logout, tokens are persisted in a MongoDB `RevokedToken` collection with a TTL (Time-To-Live) index that automatically cleans up expired tokens while immediately blacklisting them from further use.

### Input Sanitization & Validation
- Validated with `express-validator` across all endpoints.
- Email normalization and RFC-compliant validation.
- Password complexity requirements:
  - Minimum 8 characters
  - At least 1 lowercase letter (`a-z`)
  - At least 1 uppercase letter (`A-Z`)
  - At least 1 number (`0-9`)
  - At least 1 special character (`!@#$%^&*` etc.)
- Usernames restricted to alphanumeric characters and underscores (`3-30` characters).

---

## Endpoint Reference

### 1. Register User
Creates a new user account, cryptographically hashes the password, issues a JWT, and sets an HttpOnly cookie.

- **Route:** `POST /api/auth/register`
- **Access:** Public (Rate-limited: 30 requests / 15 minutes)
- **Headers:** `Content-Type: application/json`

#### Request Body
```json
{
  "username": "sarah_connor",
  "email": "sarah@example.com",
  "password": "StrongPassword123!",
  "fullName": "Sarah Connor",
  "role": "user"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `username` | String | Yes | 3-30 chars, alphanumeric + underscore. Unique. |
| `email` | String | Yes | Valid email address. Unique. |
| `password` | String | Yes | Minimum 8 chars with lower, upper, digit, symbol. |
| `fullName` | String | No | Max 60 characters. |
| `role` | String | No | `'user'` (default) or `'admin'`. |

#### Success Response (`201 Created`)
```json
{
  "success": true,
  "message": "User account registered successfully.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "6648b29f0f8a914210a5e2f1",
    "username": "sarah_connor",
    "email": "sarah@example.com",
    "fullName": "Sarah Connor",
    "role": "user",
    "bio": "",
    "lastLogin": null,
    "createdAt": "2026-10-26T09:20:00.000Z"
  }
}
```

#### Error Responses
- `400 Bad Request`: Validation failure (e.g. password too weak, malformed email).
- `409 Conflict`: Username or email already in use.

---

### 2. Login
Authenticates credentials against the database, records login time, issues a JWT token, and sets the `jwt_token` HttpOnly cookie.

- **Route:** `POST /api/auth/login`
- **Access:** Public (Rate-limited: 30 requests / 15 minutes)
- **Headers:** `Content-Type: application/json`

#### Request Body
```json
{
  "identifier": "sarah_connor",
  "password": "StrongPassword123!"
}
```
*Note: `identifier` accepts either the registered username or email.*

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Login successful.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "6648b29f0f8a914210a5e2f1",
    "username": "sarah_connor",
    "email": "sarah@example.com",
    "fullName": "Sarah Connor",
    "role": "user",
    "bio": "",
    "lastLogin": "2026-10-26T09:25:00.000Z",
    "createdAt": "2026-10-26T09:20:00.000Z"
  }
}
```

#### Error Response (`401 Unauthorized`)
```json
{
  "success": false,
  "message": "Invalid email/username or password."
}
```
*Note: Generic message intentionally masks whether the username or password was incorrect, preventing user enumeration.*

---

### 3. Logout
Invalidates the current session by recording the token in the server revocation blacklist and clearing the client's HttpOnly cookie.

- **Route:** `POST /api/auth/logout`
- **Access:** Private
- **Headers:** `Authorization: Bearer <token>` or HttpOnly cookie

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Successfully logged out and session revoked."
}
```

---

### 4. Current User Session
Returns authenticated user details verified from the active token.

- **Route:** `GET /api/auth/me`
- **Access:** Private
- **Headers:** `Authorization: Bearer <token>`

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "user": {
    "id": "6648b29f0f8a914210a5e2f1",
    "username": "sarah_connor",
    "email": "sarah@example.com",
    "fullName": "Sarah Connor",
    "role": "user",
    "bio": "",
    "lastLogin": "2026-10-26T09:25:00.000Z",
    "createdAt": "2026-10-26T09:20:00.000Z"
  }
}
```

---

### 5. Protected Dashboard Data
Retrieves protected dashboard statistics, session timing, and server security state.

- **Route:** `GET /api/protected/dashboard`
- **Access:** Private
- **Headers:** `Authorization: Bearer <token>`

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Access granted to protected dashboard resources.",
  "data": {
    "user": { ... },
    "session": {
      "authenticated": true,
      "authMethod": "Bearer Token (Header)",
      "issuedAt": "2026-10-26T09:25:00.000Z",
      "expiresAt": "2026-10-27T09:25:00.000Z",
      "remainingSeconds": 86395
    },
    "systemStats": {
      "totalRegisteredUsers": 3,
      "serverTime": "2026-10-26T09:25:05.000Z",
      "uptime": "120 seconds",
      "nodeVersion": "v22.16.0",
      "environment": "development"
    },
    "securityInsights": [
      { "status": "secure", "label": "Password Encryption", "detail": "bcrypt (12 salt rounds)" },
      { "status": "secure", "label": "Session Integrity", "detail": "JWT with cryptographic signature" },
      { "status": "secure", "label": "Transport Security", "detail": "HttpOnly cookie + Bearer header support" },
      { "status": "secure", "label": "Token Revocation", "detail": "Server-side blacklist on logout" }
    ]
  }
}
```

#### Error Response (`401 Unauthorized`)
```json
{
  "success": false,
  "message": "Access denied. No authentication token provided. Please log in."
}
```

---

### 6. Update Profile
Updates authenticated user's profile details.

- **Route:** `PUT /api/protected/profile`
- **Access:** Private
- **Headers:** `Authorization: Bearer <token>`

#### Request Body
```json
{
  "fullName": "Sarah Connor",
  "bio": "Cybersecurity researcher and defense engineer."
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Profile updated successfully.",
  "user": { ... }
}
```

---

### 7. Change Password
Verifies current password with bcrypt, and sets a new password with 12-round bcrypt hash.

- **Route:** `POST /api/protected/change-password`
- **Access:** Private
- **Headers:** `Authorization: Bearer <token>`

#### Request Body
```json
{
  "currentPassword": "StrongPassword123!",
  "newPassword": "NewStrongPassword456@"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Password changed successfully."
}
```

#### Error Responses
- `400 Bad Request`: Incorrect current password or new password fails complexity rules.

---

### 8. Admin User Directory (RBAC)
Demonstrates Role-Based Access Control. Only accounts with `role: "admin"` are authorized.

- **Route:** `GET /api/protected/admin/users`
- **Access:** Private (Admin only)
- **Headers:** `Authorization: Bearer <token>`

#### Success Response (`200 OK` for admin role)
```json
{
  "success": true,
  "count": 3,
  "users": [
    {
      "_id": "...",
      "username": "admin_user",
      "email": "admin@authshield.io",
      "role": "admin",
      "createdAt": "2026-10-26T09:00:00.000Z"
    }
  ]
}
```

#### Error Response (`403 Forbidden` for standard user)
```json
{
  "success": false,
  "message": "Forbidden: User role 'user' does not have permission."
}
```

---

### 9. Health Check
System liveness check.

- **Route:** `GET /api/health`
- **Access:** Public

#### Success Response (`200 OK`)
```json
{
  "status": "healthy",
  "timestamp": "2026-10-26T09:30:00.000Z",
  "uptime": 185.32
}
```
