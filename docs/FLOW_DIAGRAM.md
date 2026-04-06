# Email Verification Flow Diagram

## Complete User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER REGISTRATION                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Fill Register   │
                    │   Form           │
                    │ (username, email,│
                    │   password)      │
                    └──────────────────┘
                              │
                              ▼
                    POST /api/auth/register
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼ (Success 201)                 ▼ (Error)
        ┌─────────────────┐            [Show Error]
        │ Backend:        │                 │
        │ 1. Hash pass    │
        │ 2. Save user    │
        │ 3. Gen code     │
        │ 4. Send email   │
        │ 5. Return token │
        └─────────────────┘
              │
              ▼
    ┌──────────────────────────┐
    │ Store token in localStorage
    │ Navigate to /verify-email
    └──────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────┐
│       VERIFY EMAIL PAGE SHOWN                │
│                                              │
│  "We sent a code to your email"              │
│  [Enter 6-digit code] [Verify]               │
│  [Resend Code]                               │
└──────────────────────────────────────────────┘
              │
              ▼
        User checks email
              │
              ▼
  ┌───────────────────────┐
  │ Gmail inbox receives  │
  │ Professional HTML     │
  │ email with code       │
  │ "Your code: 123456"   │
  └───────────────────────┘
              │
              ▼
      User copies code
              │
              ▼
  Enters code in form
              │
              ▼
    POST /api/auth/verify-email
  (with 6-digit code + token)
              │
      ┌───────┴───────┐
      │               │
      ▼ (Success)     ▼ (Error)
   Backend:       [Show Error]
   1. Find user   
   2. Check code  
   3. Check time  
   4. Update DB   
   5. Send welcome
   6. Return msg  
      │
      ▼
┌─────────────────────┐
│ SUCCESS MESSAGE     │
│ "Email verified!"   │
│ Auto-redirect to    │
│ home in 2 sec       │
└─────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────────┐
│                           LOGIN FLOW                             │
└─────────────────────────────────────────────────────────────────┘
              │
              ▼
    ┌──────────────────┐
    │  Fill Login Form │
    │  (email,         │
    │   password)      │
    └──────────────────┘
              │
              ▼
     POST /api/auth/login
              │
  ┌───────────┴───────────┐
  │                       │
  ▼ (Unverified: 403)     ▼ (Verified: 200)
  
┌──────────────────────┐  ┌─────────────────┐
│ Error: "Verify      │  │ SUCCESS!        │
│ your email first"   │  │ Return token    │
│                      │  │ Store token     │
│ Redirect to         │  │ Redirect to     │
│ /verify-email       │  │ home page       │
└──────────────────────┘  └─────────────────┘
              │                   │
              ▼                   ▼
    Can resend code          User logged in
    and verify               Full access
```

---

## API Call Sequence

```
STEP 1: REGISTRATION
├─ POST /api/auth/register
│  ├─ User: sends {username, email, password}
│  ├─ Server: hashes password, generates code, sends email
│  └─ Response: {token, user, message}
│
├─ localStorage.setItem("token", response.token)
└─ navigate("/verify-email")

STEP 2: EMAIL VERIFICATION
├─ User receives email with 6-digit code
├─ User enters code on /verify-email page
│
├─ POST /api/auth/verify-email
│  ├─ Headers: Authorization: Bearer <token>
│  ├─ Body: {verificationCode: "123456"}
│  ├─ Server: checks code validity and expiration
│  └─ Response: {message: "Email verified!", user}
│
└─ navigate("/") - Redirect to home

STEP 3: LOGIN
├─ POST /api/auth/login
│  ├─ User: sends {email, password}
│  ├─ Server: verifies credentials
│  ├─ Server: checks isEmailVerified flag
│  │
│  ├─ If verified: returns {token, user}
│  │   └─ localStorage.setItem("token", token)
│  │   └─ navigate("/")
│  │
│  └─ If not verified: returns {error, requiresVerification: true}
│      └─ navigate("/verify-email")
│      └─ User can resend code from there
```

---

## Database State Changes

```
INITIAL STATE (Right after registration)
├─ User Created ✓
├─ username: "john_doe"
├─ email: "john@example.com"
├─ passwordHash: "$2b$10$..." ✓
├─ isEmailVerified: false ← Not verified yet
├─ verificationCode: "123456" ← Code stored
├─ verificationCodeExpires: 2024-01-16T12:40:00Z ← 10 min from now
└─ lastVerificationEmailSent: 2024-01-16T12:30:45Z

AFTER VERIFICATION (When user enters correct code)
├─ User Updated ✓
├─ isEmailVerified: true ← VERIFIED!
├─ verificationCode: null ← Cleared
├─ verificationCodeExpires: null ← Cleared
└─ lastVerificationEmailSent: (unchanged)

AFTER RESEND REQUEST
├─ User Updated ✓
├─ verificationCode: "654321" ← NEW CODE
├─ verificationCodeExpires: 2024-01-16T12:45:00Z ← NEW 10 min
├─ lastVerificationEmailSent: 2024-01-16T12:41:00Z ← UPDATED
└─ isEmailVerified: false ← Still not verified
```

---

## Code Validation Logic

```
User enters "123456" → POST /verify-email
         │
         ▼
Backend checks:
         │
    ┌────┴────┐
    │          │
    ▼ (User?)  ▼
  [FAIL]    [PASS]
    │          │
    │          ▼
    │    ┌─────────────────┐
    │    │ Already verified? │
    │    └─────────────────┘
    │         │ (Yes)      │ (No)
    │       [FAIL]      [PASS]
    │         │            │
    │         │            ▼
    │         │    ┌──────────────┐
    │         │    │ Code expired? │
    │         │    └──────────────┘
    │         │      │ (Yes)   │ (No)
    │         │    [FAIL]  [PASS]
    │         │      │        │
    │         │      │        ▼
    │         │      │   ┌─────────────┐
    │         │      │   │ Code correct?
    │         │      │   └─────────────┘
    │         │      │     │Yes    │No
    │         │      │   [PASS] [FAIL]
    │         │      │     │        │
    ▼         ▼      ▼     ▼        ▼
   Error   Error   Error Success  Error
```

---

## Email Template Structure

```
┌─────────────────────────────────────────┐
│                                         │
│  ┌─ GRADIENT HEADER (Purple) ──────┐   │
│  │ 📧                              │   │
│  │ Cyberflix - Email Verification  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Hello,                                 │
│                                         │
│  Thank you for creating an account.     │
│  Please verify your email address.      │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ Your verification code is:       │  │
│  │                                  │  │
│  │      1  2  3  4  5  6            │  │
│  │      (Large, Monospace)          │  │
│  └──────────────────────────────────┘  │
│                                         │
│  Enter this code on the verification    │
│  page to confirm your email address.    │
│                                         │
│  ⚠️  Security Notice:                   │
│  Do not share this code with anyone     │
│                                         │
│  Code expires in 10 minutes             │
│                                         │
│  Questions? Contact support...          │
│                                         │
│  © 2024 Cyberflix - All rights reserved │
│                                         │
└─────────────────────────────────────────┘
```

---

## Headers Required for Auth Routes

```
VerifyEmail Endpoint:
├─ POST /api/auth/verify-email
├─ Headers:
│  ├─ Content-Type: application/json
│  └─ Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
└─ Body: {"verificationCode": "123456"}

Resend Endpoint:
├─ POST /api/auth/resend-verification-email
├─ Headers:
│  └─ Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
└─ Body: (empty)

GetMe Endpoint:
├─ GET /api/auth/me
├─ Headers:
│  └─ Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
└─ Body: (empty)
```

---

## Component Hierarchy

```
App
├── BrowserRouter
├── Routes
│   ├── /register → Register.jsx
│   │   └─ handleRegister()
│   │      └─ POST /api/auth/register
│   │         └─ Navigate to /verify-email
│   │
│   ├── /verify-email → VerifyEmail.jsx ← NEW
│   │   ├── useState(code)
│   │   ├── handleVerify()
│   │   │  └─ POST /api/auth/verify-email
│   │   │     └─ Navigate to /
│   │   │
│   │   └── handleResend()
│   │      └─ POST /api/auth/resend-verification-email
│   │
│   ├── /login → Login.jsx
│   │   └─ handleLogin()
│   │      ├─ POST /api/auth/login
│   │      ├─ If 403: Navigate to /verify-email
│   │      └─ If 200: Navigate to /
│   │
│   └── / → Home.jsx (requires verified email)
│
└── AuthContext
    └── Stores: {token, user, isEmailVerified}
```

---

## State Management Flow

```
Registration:
  Register Component
    └─ setState({loading: true})
    └─ POST /api/auth/register
    └─ SAVE: localStorage.setItem("token", response.token)
    └─ NAVIGATE: /verify-email
    └─ setState({loading: false})

Verification:
  VerifyEmail Component
    └─ setState({code: "123456"})
    └─ setState({loading: true})
    └─ POST /api/auth/verify-email
       (uses token from localStorage)
    └─ setState({success: true})
    └─ Auto-redirect to /

Login:
  Login Component
    └─ POST /api/auth/login
    ├─ If verified (200):
    │  ├─ SAVE: localStorage.setItem("token", response.token)
    │  └─ NAVIGATE: /
    │
    └─ If unverified (403):
       ├─ setState({error: "Verify email"})
       └─ NAVIGATE: /verify-email
```

---

## Error Paths

```
Registration Errors:
├─ 400: Missing fields → Show form error
├─ 409: Email exists → "Email already registered"
└─ 500: Server error → "Registration failed"

Verification Errors:
├─ 400: Invalid code → "Invalid verification code"
├─ 400: Code expired → "Code expired, request new one"
├─ 400: Already verified → "Email already verified"
├─ 429: Too fast → "Please wait 1 minute"
└─ 500: Server error → "Verification failed"

Login Errors:
├─ 400: Missing fields → Show form error
├─ 401: Wrong password → "Invalid email or password"
├─ 403: Not verified → "Verify email first"
└─ 500: Server error → "Login failed"

Resend Errors:
├─ 429: Rate limited → "Wait 1 minute"
├─ 400: Already verified → "Email already verified"
└─ 500: Email service → "Failed to send email"
```

This diagram shows the complete flow of the email verification system!
