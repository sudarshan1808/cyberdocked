# API Response Reference Guide

## Quick Copy-Paste Examples for Frontend

### 1. REGISTER Endpoint
**URL:** `POST /api/auth/register`

**Request:**
```javascript
const response = await fetch("/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    username: "john_doe",
    email: "john@example.com",
    password: "securePass123"
  })
});
const data = await response.json();
```

**Success Response (201):**
```json
{
  "message": "Registration successful. Please verify your email to complete signup.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "65abc123def456",
    "username": "john_doe",
    "email": "john@example.com",
    "profilePicture": "/pic.jpg",
    "watchlist": [],
    "isEmailVerified": false
  }
}
```

**Error Responses:**
```json
// Missing fields
{
  "error": "Username, email and password are required"
}

// Invalid password
{
  "error": "Password must be at least 6 characters"
}

// Email already used
{
  "error": "Email already registered"
}

// Username taken
{
  "error": "Username already taken"
}
```

---

### 2. VERIFY-EMAIL Endpoint
**URL:** `POST /api/auth/verify-email`

**Request:**
```javascript
const response = await fetch("/api/auth/verify-email", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("token")}`
  },
  body: JSON.stringify({
    verificationCode: "123456"  // 6-digit code from email
  })
});
const data = await response.json();
```

**Success Response (200):**
```json
{
  "message": "Email verified successfully!",
  "user": {
    "id": "65abc123def456",
    "username": "john_doe",
    "email": "john@example.com",
    "isEmailVerified": true
  }
}
```

**Error Responses:**
```json
// Code not provided
{
  "error": "Verification code is required"
}

// Code is wrong
{
  "error": "Invalid verification code"
}

// Code expired
{
  "error": "Verification code has expired. Please request a new one."
}

// Already verified
{
  "error": "Email is already verified"
}

// Unauthorized (missing token)
{
  "error": "Unauthorized"
}
```

---

### 3. RESEND-VERIFICATION-EMAIL Endpoint
**URL:** `POST /api/auth/resend-verification-email`

**Request:**
```javascript
const response = await fetch("/api/auth/resend-verification-email", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${localStorage.getItem("token")}`
  }
});
const data = await response.json();
```

**Success Response (200):**
```json
{
  "message": "Verification email sent successfully. Check your inbox."
}
```

**Error Responses:**
```json
// Already verified
{
  "error": "Email is already verified"
}

// Too many requests too fast
{
  "error": "Please wait before requesting another verification email"
}

// Unauthorized
{
  "error": "Unauthorized"
}

// Email service failure
{
  "error": "Failed to send verification email"
}
```

---

### 4. LOGIN Endpoint
**URL:** `POST /api/auth/login`

**Request:**
```javascript
const response = await fetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "john@example.com",
    password: "securePass123"
  })
});
const data = await response.json();
```

**Success Response (200) - Verified Email:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "65abc123def456",
    "username": "john_doe",
    "email": "john@example.com",
    "profilePicture": "/pic.jpg",
    "watchlist": [123, 456, 789],
    "isEmailVerified": true
  }
}
```

**Error Response (403) - Email Not Verified:**
```json
{
  "error": "Please verify your email before logging in",
  "userId": "65abc123def456",
  "requiresVerification": true
}
```

**Error Responses:**
```json
// Missing credentials
{
  "error": "Email and password are required"
}

// Wrong email or password
{
  "error": "Invalid email or password"
}
```

---

### 5. GET /me Endpoint
**URL:** `GET /api/auth/me`

**Request:**
```javascript
const response = await fetch("/api/auth/me", {
  headers: {
    "Authorization": `Bearer ${localStorage.getItem("token")}`
  }
});
const data = await response.json();
```

**Success Response (200):**
```json
{
  "id": "65abc123def456",
  "username": "john_doe",
  "email": "john@example.com",
  "profilePicture": "/pic.jpg",
  "watchlist": [123, 456],
  "isEmailVerified": true
}
```

**Error Responses:**
```json
// Unauthorized
{
  "error": "Unauthorized"
}

// User not found
{
  "error": "User not found"
}
```

---

## Frontend Implementation Examples

### Complete Registration + Verification Flow

```javascript
// Step 1: Register
async function registerUser(username, email, password) {
  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error);
    }

    // Store token (temporary - not verified yet)
    localStorage.setItem("token", data.token);
    return { success: true, user: data.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Step 2: Verify Email
async function verifyEmail(code) {
  try {
    const response = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ verificationCode: code })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error);
    }

    return { success: true, user: data.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Step 3: Resend Code
async function resendVerificationEmail() {
  try {
    const response = await fetch("/api/auth/resend-verification-email", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error);
    }

    return { success: true, message: data.message };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Step 4: Login
async function loginUser(email, password) {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.status === 403 && data.requiresVerification) {
      // Email not verified - needs verification first
      localStorage.setItem("token", data.userId);
      throw new Error("Email verification required");
    }

    if (!response.ok) {
      throw new Error(data.error);
    }

    // Store verified token
    localStorage.setItem("token", data.token);
    return { success: true, user: data.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### Status Codes Reference

| Code | Meaning | Typical Error |
|------|---------|---------------|
| 200 | Success | Email verified, login successful |
| 201 | Created | Account registered |
| 400 | Bad Request | Invalid/missing data |
| 401 | Unauthorized | Invalid credentials |
| 403 | Forbidden | Email not verified |
| 404 | Not Found | User not found |
| 409 | Conflict | Email/username already exists |
| 429 | Too Many Requests | Resend rate limited |
| 500 | Server Error | Something went wrong |
| 503 | Unavailable | Database not configured |

---

## Database Field Reference

**User Model Fields:**

```javascript
{
  // Basic info
  username: String,           // Unique, lowercase
  email: String,              // Unique, lowercase
  passwordHash: String,       // Hashed with bcrypt
  profilePicture: String,     // Default: "/pic.jpg"
  watchlist: [Number],        // Array of content IDs
  
  // Email verification fields
  isEmailVerified: Boolean,   // false until verified
  verificationCode: String,   // 6-digit code
  verificationCodeExpires: Date, // Expires 10 min after generation
  lastVerificationEmailSent: Date, // For rate limiting
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

---

## Troubleshooting HTTP Status Codes

### 400 Bad Request
- Missing required fields
- Invalid data format
- Check request body syntax

### 401 Unauthorized
- Invalid email/password
- Token missing or invalid
- Add Authorization header for protected routes

### 403 Forbidden
- Email not verified when trying to login
- Redirect to verification page
- Show message: "Please verify your email"

### 409 Conflict
- Email already registered
- Username already taken
- Suggest different email/username

### 429 Too Many Requests
- Resend verification email too frequently
- Wait at least 1 minute before resending
- Show error: "Please wait before requesting again"

### 503 Service Unavailable
- Database not connected
- MongoDB offline
- Check server logs

---

## Testing with cURL

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# Verify Email (replace TOKEN and CODE)
curl -X POST http://localhost:5000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_HERE" \
  -d '{"verificationCode":"123456"}'

# Resend
curl -X POST http://localhost:5000/api/auth/resend-verification-email \
  -H "Authorization: Bearer TOKEN_HERE"

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get Current User
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer TOKEN_HERE"
```
