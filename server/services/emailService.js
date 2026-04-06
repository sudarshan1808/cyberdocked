import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create reusable transporter with Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Test transporter on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("Email transporter error:", error);
  } else {
    console.log("✓ Email transporter is ready");
  }
});

// Generate random 6-digit verification code
export function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Email verification template
function getVerificationEmailTemplate(verificationCode, companyName = "Cyberflix") {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            padding: 0;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 30px;
          }
          .greeting {
            font-size: 16px;
            margin-bottom: 20px;
            color: #333;
          }
          .message {
            margin: 20px 0;
            font-size: 14px;
            color: #666;
          }
          .code-box {
            background-color: #f9f9f9;
            border: 2px solid #667eea;
            border-radius: 6px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
          }
          .code {
            font-size: 36px;
            font-weight: 700;
            letter-spacing: 4px;
            color: #667eea;
            font-family: 'Courier New', monospace;
          }
          .expiry {
            margin-top: 20px;
            font-size: 12px;
            color: #999;
            text-align: center;
          }
          .footer {
            background-color: #f9f9f9;
            border-top: 1px solid #e0e0e0;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          .button {
            display: inline-block;
            background-color: #667eea;
            color: #ffffff;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 600;
          }
          .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 13px;
            color: #856404;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${companyName}</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px;">Email Verification</p>
          </div>
          
          <div class="content">
            <p class="greeting">Hello,</p>
            
            <p class="message">
              Thank you for creating an account with ${companyName}! To complete your registration and secure your account, please verify your email address.
            </p>
            
            <p class="message">
              <strong>Your verification code is:</strong>
            </p>
            
            <div class="code-box">
              <div class="code">${verificationCode}</div>
            </div>
            
            <p class="message">
              Enter the code above in the verification field to confirm your email address. This code is valid for 10 minutes.
            </p>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong> Do not share this code with anyone. ${companyName} team members will never ask you for this code.
            </div>
            
            <p class="message">
              If you didn't create this account, please ignore this email and your account will remain unverified.
            </p>
            
            <p class="message">
              Questions? Contact our support team.
            </p>
            
            <div class="expiry">
              This verification code expires in 10 minutes.
            </div>
          </div>
          
          <div class="footer">
            <p>© 2026 ${companyName}. All rights reserved.</p>
            <p>This is an automated email. Please do not reply directly to this message.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Send verification email
export async function sendVerificationEmail(recipientEmail, verificationCode) {
  try {
    console.log(`[EMAIL] Sending verification email to ${recipientEmail}...`);
    
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_EMAIL}>`,
      to: recipientEmail,
      subject: `${process.env.EMAIL_FROM_NAME} - Email Verification Code`,
      html: getVerificationEmailTemplate(verificationCode, process.env.EMAIL_FROM_NAME),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] ✓ Verification email sent to ${recipientEmail}`);
    console.log(`[EMAIL] Response:`, info.response);
    console.log(`[EMAIL] Message ID:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EMAIL] ✗ Error sending to ${recipientEmail}:`, error.message);
    console.error(`[EMAIL] Full error:`, error);
    return { success: false, error: error.message };
  }
}

// Send welcome email (optional - after email verification)
async function sendWelcomeEmail(recipientEmail, username) {
  try {
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_EMAIL}>`,
      to: recipientEmail,
      subject: `Welcome to ${process.env.EMAIL_FROM_NAME}!`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
              }
              .container {
                max-width: 600px;
                margin: 20px auto;
                background-color: #ffffff;
                padding: 0;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                overflow: hidden;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #ffffff;
                padding: 30px;
                text-align: center;
              }
              .content {
                padding: 30px;
              }
              .footer {
                background-color: #f9f9f9;
                border-top: 1px solid #e0e0e0;
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>${process.env.EMAIL_FROM_NAME}</h1>
              </div>
              <div class="content">
                <h2>Welcome, ${username}!</h2>
                <p>Your email has been verified successfully. You now have full access to ${process.env.EMAIL_FROM_NAME}.</p>
                <p>Start exploring and enjoy your experience!</p>
              </div>
              <div class="footer">
                <p>© 2026 ${process.env.EMAIL_FROM_NAME}. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Welcome email sent:", info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return { success: false, error: error.message };
  }
}

export { sendWelcomeEmail };
