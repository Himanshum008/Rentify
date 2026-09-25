import nodemailer from 'nodemailer';

// Create email transporter from environment variables
export const createTransporter = () => {
  const rawUser = process.env.EMAIL_USER || '';
  const rawPass = process.env.EMAIL_PASS || '';

  const user = rawUser.replace(/^["']|["']$/g, '').trim();
  const pass = rawPass.replace(/^["']|["']$/g, '').replace(/\s+/g, '').trim();

  if (user && pass && user !== 'your_email@gmail.com' && pass !== 'your_gmail_app_password') {
    if (process.env.EMAIL_HOST && process.env.EMAIL_HOST !== 'smtp.gmail.com') {
      return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: Number(process.env.EMAIL_PORT) === 465,
        auth: { user, pass }
      });
    }

    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass
      }
    });
  }

  // If credentials are not set, return null (fallback will log to console)
  return null;
};

// @desc    Send Email Verification Link to User
export const sendVerificationEmail = async (toEmail, verificationUrl, userName = 'Friend') => {
  const transporter = createTransporter();

  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 32px 24px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Rentify</h1>
        <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Verify your email to activate your rental account</p>
      </div>
      
      <div style="padding: 32px 24px; color: #1e293b; line-height: 1.6;">
        <h2 style="font-size: 20px; font-weight: 700; margin-top: 0;">Welcome to Rentify, ${userName}! 👋</h2>
        <p style="color: #64748b; font-size: 15px;">
          Thank you for signing up. Please click the button below to verify your email address and activate your account.
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${verificationUrl}" style="background-color: #2563eb; color: #ffffff; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 700; text-decoration: none; display: inline-block; box-shadow: 0 4px 12px rgba(37,99,235,0.3);">
            Verify Email Address →
          </a>
        </div>

        <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
          Or copy and paste this link into your browser:<br/>
          <a href="${verificationUrl}" style="color: #2563eb; word-break: break-all;">${verificationUrl}</a>
        </p>

        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">
          If you didn't create an account with Rentify, you can safely ignore this email.
        </p>
      </div>
    </div>
  `;

  if (transporter) {
    try {
      const cleanUser = (process.env.EMAIL_USER || '').replace(/^["']|["']$/g, '').trim();
      await transporter.sendMail({
        from: `"Rentify Team" <${cleanUser}>`,
        to: toEmail,
        subject: 'Verify your Rentify Account',
        html: htmlContent
      });
      console.log(`✉️ Verification email successfully sent to: ${toEmail}`);
      return { success: true };
    } catch (err) {
      console.error('❌ Failed to send verification email via SMTP:', err.message);
    }
  }

  // Fallback console log for instant testing without SMTP configuration
  console.log('\n============================================================');
  console.log(`✉️ [EMAIL SIMULATION] Verification Email to: ${toEmail}`);
  console.log(`🔗 Verification Link: ${verificationUrl}`);
  console.log('============================================================\n');
  return { success: true, simulated: true };
};

// @desc    Send 6-Digit Password Reset OTP Email
export const sendOtpEmail = async (toEmail, otpCode, userName = 'Friend') => {
  const transporter = createTransporter();

  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 32px 24px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Rentify</h1>
        <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Password Reset Request</p>
      </div>
      
      <div style="padding: 32px 24px; color: #1e293b; line-height: 1.6;">
        <h2 style="font-size: 20px; font-weight: 700; margin-top: 0;">Hello ${userName},</h2>
        <p style="color: #64748b; font-size: 15px;">
          You requested to reset your password. Use the 6-digit verification code below to complete the process.
        </p>

        <div style="background-color: #eff6ff; border: 1.5px dashed #93c5fd; border-radius: 10px; padding: 20px; text-align: center; margin: 28px 0;">
          <div style="font-size: 12px; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Your One-Time Password (OTP)</div>
          <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1e293b; font-family: monospace;">${otpCode}</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 6px;">Valid for 10 minutes</div>
        </div>

        <p style="color: #64748b; font-size: 14px;">
          If you did not request a password reset, please ignore this email or reach out to support if you have concerns.
        </p>

        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">
          © ${new Date().getFullYear()} Rentify Inc. All rights reserved.
        </p>
      </div>
    </div>
  `;

  if (transporter) {
    try {
      const cleanUser = (process.env.EMAIL_USER || '').replace(/^["']|["']$/g, '').trim();
      await transporter.sendMail({
        from: `"Rentify Security" <${cleanUser}>`,
        to: toEmail,
        subject: `Your Rentify Password Reset Code: ${otpCode}`,
        html: htmlContent
      });
      console.log(`✉️ Password reset OTP email sent to: ${toEmail}`);
      return { success: true };
    } catch (err) {
      console.error('❌ Failed to send OTP email via SMTP:', err.message);
    }
  }

  // Fallback console log for instant testing
  console.log('\n============================================================');
  console.log(`✉️ [EMAIL SIMULATION] Password Reset OTP to: ${toEmail}`);
  console.log(`🔑 OTP Code: ${otpCode} (Valid for 10 minutes)`);
  console.log('============================================================\n');
  return { success: true, simulated: true };
};

export default {
  sendVerificationEmail,
  sendOtpEmail
};
