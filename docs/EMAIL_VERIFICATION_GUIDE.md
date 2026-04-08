# Email Verification Implementation Guide

## Overview
This document outlines the email verification system implemented using Nodemailer and Gmail for the Cyberflix application.

## Features Implemented

### 1. **User Registration with Email Verification**
   - When a user registers, a 6-digit verification code is generated
   - Verification code is sent to the user's email
   - Code expires after 10 minutes
   - User receives a professional HTML email with the verification code

### 2. **Email Verification Check-in**
   - Users must verify their email before logging in
   - Only verified emails can access the platform
   - A `/verify-email` endpoint validates the code and marks email as verified
   - Welcome email is sent upon successful verification

### 3. **Resend Verification Email**
   - Users can request a new verification code if not received
   - Rate limited to prevent abuse (1 request per minute)
   - New code is generated with a fresh 10-minute expiration

### 4. **Backend Configuration**

#### Environment Variables (.env)
```
EMAIL_USER=sudarshan.sk180804@gmail.com
EMAIL_PASSWORD=kjyf ssho pyev ygih
EMAIL_FROM_NAME=Cyberflix
EMAIL_FROM_EMAIL=sudarshan.sk180804@gmail.com
VERIFICATION_CODE_EXPIRES=10m
```

#### Database Schema Updates
User model now includes:
- `isEmailVerified`: Boolean (default: false)
- `verificationCode`: String (stores the 6-digit code)
- `verificationCodeExpires`: Date (expiration time)
- `lastVerificationEmailSent`: Date (for rate limiting)

## API Endpoints

### 1. POST `/api/auth/register`
Register a new user. Automatically sends verification email.

**Request:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (201):**
```json
{
  "message": "Registration successful. Please verify your email to complete signup.",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "username": "john_doe",
    "email": "john@example.com",
    "isEmailVerified": false
  }
}
```

### 2. POST `/api/auth/verify-email`
Verify email using the code sent to user's email.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "verificationCode": "123456"
}
```

**Response (200):**
```json
{
  "message": "Email verified successfully!",
  "user": {
    "id": "user_id",
    "username": "john_doe",
    "email": "john@example.com",
    "isEmailVerified": true
  }
}
```

### 3. POST `/api/auth/resend-verification-email`
Request a new verification code.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Verification email sent successfully. Check your inbox."
}
```

### 4. POST `/api/auth/login`
Login with email and password. Checks if email is verified.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response on unverified email (403):**
```json
{
  "error": "Please verify your email before logging in",
  "userId": "user_id",
  "requiresVerification": true
}
```

**Response on success (200):**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "username": "john_doe",
    "email": "john@example.com",
    "isEmailVerified": true
  }
}
```

## Frontend Implementation Steps

### 1. Update Registration Flow
```jsx
// Register and show verification screen
const handleRegister = async (credentials) => {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  
  if (response.ok) {
    const data = await response.json();
    // Store token temporarily
    localStorage.setItem('token', data.token);
    // Navigate to verification page
    navigate('/verify-email');
  }
};
```

### 2. Create Email Verification Page
```jsx
// Pages/VerifyEmail.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function VerifyEmail() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ verificationCode: code })
      });

      const data = await response.json();

      if (response.ok) {
        // Email verified - navigate to home
        navigate('/');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/resend-verification-email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setError('');
        alert('New verification code sent to your email!');
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to resend. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-email-container">
      <h2>Verify Your Email</h2>
      <p>We've sent a 6-digit code to your email. Enter it below:</p>
      
      <form onSubmit={handleVerify}>
        <input
          type="text"
          maxLength="6"
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          className="code-input"
        />
        
        {error && <p className="error">{error}</p>}
        
        <button type="submit" disabled={loading || code.length !== 6}>
          {loading ? 'Verifying...' : 'Verify Email'}
        </button>
      </form>

      <button 
        onClick={handleResend} 
        disabled={loading}
        className="resend-btn"
      >
        Resend Code
      </button>
    </div>
  );
}
```

### 3. Update Login Flow
```jsx
// Update Login.jsx to handle verification requirement
const handleLogin = async (credentials) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });

  const data = await response.json();

  if (response.status === 403 && data.requiresVerification) {
    // Email not verified
    localStorage.setItem('token', data.userId); // Store temp token
    setError('Please verify your email first. Redirecting...');
    setTimeout(() => navigate('/verify-email'), 2000);
  } else if (response.ok) {
    // Verified and logged in
    localStorage.setItem('token', data.token);
    navigate('/');
  } else {
    setError(data.error);
  }
};
```

## Email Templates

### Verification Email
- Professional gradient header with company name
- Clear instructions about verification code
- 6-digit code displayed prominently in a highlighted box
- Security notice warning against sharing
- 10-minute expiration notice
- Footer with company information

### Welcome Email
- Sent after successful verification
- Personalized greeting with username
- Confirmation of email verification
- Call-to-action to start using the platform

## Security Considerations

1. **Rate Limiting**: Resend verification email is limited to once per minute
2. **Code Expiration**: Verification codes expire after 10 minutes
3. **Code Format**: 6-digit random codes are harder to guess than generic tokens
4. **Gmail App Password**: Using app-specific password instead of account password
5. **Email Verification Required**: Login is blocked for unverified emails
6. **Token Expiration**: JWT tokens expire after 7 days

## Troubleshooting

### Email Not Sending
1. Verify Gmail app password is correct (spaces might be needed)
2. Check .env file configuration
3. Ensure "Less secure app access" is enabled (or use App Password)
4. Check server logs for detailed error messages

### Code Expired
- User must request a new code via resend endpoint
- New codes have a fresh 10-minute window

### User Already Verified
- Cannot verify again
- Must login with verified email

## Testing

### With cURL:
```bash
# Register
curl -X POST https://mern-backend-rtvi.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'

# Verify Email (use token from register response)
curl -X POST https://mern-backend-rtvi.onrender.com/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"verificationCode": "123456"}'

# Login
curl -X POST https://mern-backend-rtvi.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## Files Modified/Created

1. **Created**: `/server/services/emailService.js` - Email sending utility
2. **Updated**: `/server/routes/auth.js` - Auth routes with verification
3. **Updated**: `/server/models/User.js` - User schema with verification fields
4. **Updated**: `/server/.env` - Email configuration variables

## Next Steps

1. Update client-side pages (Login, Register) to handle verification flow
2. Create VerifyEmail component
3. Add routes for verification page
4. Test email sending with actual Gmail account
5. Update error handling and user feedback messages
