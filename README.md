# AuthShield — Production-Grade Authentication & Session Management System

A secure user authentication and session management system built with **Node.js**, **Express**, **MongoDB (Mongoose)**, **bcryptjs**, and **JSON Web Tokens (JWT)**.

---

## 🚀 Key Features & Highlights

- **User Registration & Validation**:
  - Secure registration requiring unique username and email.
  - Strict input validation and sanitization using `express-validator`.
  - Real-time password strength meter on the frontend with criteria tracking (length, uppercase, lowercase, numbers, special symbols).
- **Cryptographic Password Hashing**:
  - Uses **bcrypt** with **12 salt rounds** to hash all passwords before saving to the database.
  - Plaintext passwords are never stored in MongoDB or logged.
  - MongoDB `select: false` prevents accidental query leakage of password hashes.
- **Robust Login & Session Management**:
  - Supports login with either **Email** or **Username**.
  - Generic authentication error messages prevent user enumeration attacks.
  - Issues signed **JWT tokens (HMAC-SHA256)** with 24-hour expiration.
  - Hybrid storage: sets secure **HttpOnly cookies** (mitigating XSS theft) and supports **Authorization Bearer** headers.
- **Server-Side Token Revocation & Blacklisting**:
  - Logging out immediately records the active JWT in a MongoDB `RevokedToken` collection.
  - Automatic cleanup using MongoDB **TTL (Time-To-Live) index** when the token reaches its original expiration.
  - Any subsequent attempts to access protected routes with a revoked token are rejected with `401 Unauthorized`.
- **Protected Routes & Role-Based Access Control (RBAC)**:
  - Custom `authenticate` middleware verifies token integrity and revocation status.
  - Role-based authorization (`authorizeRoles('admin')`) protecting administrative resources.
- **Security Hardening**:
  - **Helmet** for HTTP security headers (CSP, XSS filter, Clickjacking protection).
  - **express-rate-limit** to mitigate brute-force and credential stuffing attacks (30 attempts / 15 minutes).
  - Payload size limiter (`10kb`) to prevent memory exhaustion / DoS attacks.
  - **CORS** configured with credentials support.
- **Modern Interactive Web Frontend**:
  - Built with custom Vanilla CSS featuring dark glassmorphism aesthetic.
  - Interactive tabs: Sign In, Create Account, Protected Dashboard, and REST API Documentation.
  - Live JWT Token Inspector & Payload Decoder.
  - Live Protected Route API Tester to evaluate valid vs unauthenticated requests in real time.
  - Session countdown timer and quick demo auto-fill buttons.

---

## 📂 Project Structure

```
Weintern Week-2 Task-3/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection handler
│   ├── controllers/
│   │   ├── authController.js     # Register, Login, Logout, Session check
│   │   └── userController.js     # Protected dashboard, profile, password change, admin
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT verification & role authorization
│   │   ├── validationMiddleware.js # express-validator input sanitization
│   │   └── errorHandler.js       # Centralized error handler & Mongoose error formatter
│   ├── models/
│   │   ├── User.js               # User schema with bcrypt pre-save hook & methods
│   │   └── RevokedToken.js       # Server-side blacklist with MongoDB TTL index
│   ├── routes/
│   │   ├── authRoutes.js         # Public auth routes with rate limiting
│   │   └── protectedRoutes.js    # Authenticated & RBAC routes
│   ├── seed.js                   # Pre-populates demo accounts
│   └── server.js                 # Express server configuration & middleware pipeline
├── frontend/
│   ├── css/
│   │   └── styles.css            # Custom responsive dark-mode styling
│   ├── js/
│   │   ├── api.js                # Fetch abstraction with token & cookie handling
│   │   ├── auth.js               # Client auth state & session manager
│   │   └── app.js                # UI controller, event listeners, form handling
│   └── index.html                # Single-page application template
├── tests/
│   └── auth.test.js              # 17-point automated integration test suite
├── .env.example                  # Environment configuration template
├── .env                          # Local environment variables
├── API_DOCUMENTATION.md          # Comprehensive REST API reference
├── package.json                  # Dependencies and execution scripts
└── README.md                     # Documentation & setup guide
```

---

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** (v18.0.0 or higher recommended, tested on v22.16.0)
- **MongoDB** running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas URI

### 1. Clone or Open Workspace
```bash
cd "Weintern Week-2 Task-3"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create or inspect the `.env` file in the root directory:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/auth_system_db
JWT_SECRET=super_secret_jwt_key_weintern_task3_production_grade_random_key_9823472
JWT_EXPIRE=24h
COOKIE_EXPIRE=1
```

### 4. Seed Demo Accounts
Pre-seed demo accounts into MongoDB:
```bash
npm run seed
```
This generates:
- **Standard User:** `demo_user` / `SecurePass123!`
- **Admin User:** `admin_user` / `AdminSecret123!`

### 5. Start the Application
Run the server:
```bash
npm start
```
Or with auto-restart on file change:
```bash
npm run dev
```

Open your browser and navigate to:
```
http://localhost:5000
```

---

## 🧪 Automated Testing

A complete automated integration test suite covering 17 test cases is included:

```bash
npm test
```

### Test Coverage Highlights:
- [x] Liveness health check (`GET /api/health`)
- [x] User registration with password hashing verification (asserts hash starts with `$2a$` / `$2b$`)
- [x] Prevention of duplicate email and duplicate username (`409 Conflict`)
- [x] Password complexity enforcement (`400 Bad Request`)
- [x] Login credential validation and JWT issuance (`200 OK`)
- [x] Rejection of incorrect passwords and non-existent users (`401 Unauthorized`)
- [x] Access enforcement on protected routes with valid JWT (`200 OK`)
- [x] Rejection of missing and tampered tokens (`401 Unauthorized`)
- [x] Role-Based Access Control: Admin authorized (`200 OK`) vs User forbidden (`403 Forbidden`)
- [x] Server-side token revocation on logout and subsequent reuse rejection (`401 Unauthorized`)

---

## 🔐 Security Best Practices Applied

1. **Password Hashing (bcrypt)**:
   - Utilizes salt rounds of 12 for high resistance against brute-force and rainbow table attacks.
   - Pre-save Mongoose hook ensures password is automatically hashed before database insertion.
2. **Timing-Safe Error Messages**:
   - Authentication errors intentionally use generic messages (`"Invalid email/username or password."`) to eliminate user enumeration vectors.
3. **Defense-in-Depth Session Storage**:
   - HttpOnly cookies are flagged with `SameSite=Lax` and `HttpOnly=true` to mitigate client-side script theft (XSS).
   - Bearer token header support enables programmatic API client integration.
4. **Token Revocation (Blacklist)**:
   - When a user logs out, the JWT is placed into a MongoDB TTL collection, ensuring the token cannot be reused even if intercepted before expiration.
5. **Rate Limiting**:
   - Auth endpoints are throttled to 30 requests per 15-minute window per IP to defend against automated credential stuffing.
6. **HTTP Security Headers**:
   - `helmet` sets secure headers including Content Security Policy, X-Content-Type-Options, Frameguard, and Strict-Transport-Security.
7. **Input Validation & Sanitization**:
   - `express-validator` validates and normalizes all incoming request parameters.

---

## 📖 API Documentation Summary

For full request and response schemas, see [API_DOCUMENTATION.md](file:///c:/Users/Jigar/Downloads/Weintern%20Week-2%20Task-3/API_DOCUMENTATION.md).

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user account |
| `POST` | `/api/auth/login` | Public | Authenticate user & receive JWT/cookie |
| `POST` | `/api/auth/logout` | Private | Revoke active token & clear cookie |
| `GET` | `/api/auth/me` | Private | Retrieve authenticated user profile |
| `GET` | `/api/protected/dashboard` | Private | Retrieve dashboard metrics & session timing |
| `PUT` | `/api/protected/profile` | Private | Update user display name & biography |
| `POST` | `/api/protected/change-password` | Private | Change password with current password verification |
| `GET` | `/api/protected/admin/users` | Admin | Retrieve user directory (RBAC) |
| `GET` | `/api/health` | Public | Service health & uptime indicator |

---

## 📄 License
ISC License &mdash; Created for Weintern Task 3.
