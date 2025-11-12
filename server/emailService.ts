import { nanoid } from 'nanoid';

export interface EmailService {
  sendVerificationCode(to: string, code: string): Promise<void>;
  sendPasswordResetCode(to: string, code: string, username: string): Promise<void>;
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateResetToken(): string {
  return nanoid(32);
}

class ConsoleEmailService implements EmailService {
  async sendVerificationCode(to: string, code: string): Promise<void> {
    console.log('\n=== EMAIL VERIFICATION CODE ===');
    console.log(`To: ${to}`);
    console.log(`Code: ${code}`);
    console.log(`\nHi there!\n\nYour email verification code is: ${code}\n\nThis code will expire in 15 minutes.\n\nIf you didn't request this code, please ignore this email.`);
    console.log('================================\n');
  }

  async sendPasswordResetCode(to: string, code: string, username: string): Promise<void> {
    console.log('\n=== PASSWORD RESET CODE ===');
    console.log(`To: ${to}`);
    console.log(`Username: ${username}`);
    console.log(`Code: ${code}`);
    console.log(`\nHi ${username},\n\nYour password reset code is: ${code}\n\nThis code will expire in 15 minutes.\n\nIf you didn't request a password reset, please ignore this email and your password will remain unchanged.`);
    console.log('===========================\n');
  }
}

class ResendEmailService implements EmailService {
  private apiKey: string;
  private fromEmail: string;

  constructor(apiKey: string, fromEmail: string = 'onboarding@resend.dev') {
    this.apiKey = apiKey;
    this.fromEmail = fromEmail;
  }

  async sendVerificationCode(to: string, code: string): Promise<void> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.fromEmail,
        to: [to],
        subject: 'Verify Your Email - LunchBox',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Email Verification</h2>
            <p>Hi there!</p>
            <p>Your email verification code is:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
              ${code}
            </div>
            <p>This code will expire in 15 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
            <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">LunchBox - Food Delivery for Amazon Offices</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to send email: ${error}`);
    }
  }

  async sendPasswordResetCode(to: string, code: string, username: string): Promise<void> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.fromEmail,
        to: [to],
        subject: 'Reset Your Password - LunchBox',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>Hi ${username},</p>
            <p>You requested to reset your password. Your password reset code is:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
              ${code}
            </div>
            <p>This code will expire in 15 minutes.</p>
            <p><strong>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</strong></p>
            <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">LunchBox - Food Delivery for Amazon Offices</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to send email: ${error}`);
    }
  }
}

export function createEmailService(): EmailService {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;

  if (resendApiKey) {
    console.log('Using Resend email service');
    return new ResendEmailService(resendApiKey, fromEmail);
  }

  console.log('Using console email service (emails will be logged to console)');
  return new ConsoleEmailService();
}

export const emailService = createEmailService();
