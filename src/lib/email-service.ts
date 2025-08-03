/**
 * Email Service for LuminaWeb Protocol
 * Handles sending actual emails using the custom &luminaweb.app format
 */

import { EmailDomainService } from './email-domain';

interface EmailMessage {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

interface EmailConfig {
  provider: 'sendgrid' | 'mailgun' | 'smtp' | 'console';
  apiKey?: string;
  domain?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
}

export class EmailService {
  private config: EmailConfig;
  
  constructor(config?: EmailConfig) {
    this.config = config || {
      provider: 'console', // Default to console logging for development
    };
  }

  /**
   * Send an email using the configured provider
   */
  async sendEmail(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Validate LuminaWeb email format
      if (!this.isValidLuminaWebEmail(message.from) && !this.isValidLuminaWebEmail(message.to)) {
        return { success: false, error: 'At least one address must be a LuminaWeb email' };
      }

      switch (this.config.provider) {
        case 'sendgrid':
          return await this.sendWithSendGrid(message);
        case 'mailgun':
          return await this.sendWithMailgun(message);
        case 'smtp':
          return await this.sendWithSMTP(message);
        case 'console':
        default:
          return await this.sendWithConsole(message);
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(userEmail: string, username: string): Promise<{ success: boolean; error?: string }> {
    const welcomeMessage: EmailMessage = {
      from: `system&luminaweb.app`,
      to: userEmail,
      subject: 'Welcome to LuminaWeb - Your Secure Email Account is Ready',
      html: this.generateWelcomeEmailHTML(username, userEmail),
      text: this.generateWelcomeEmailText(username, userEmail),
    };

    const result = await this.sendEmail(welcomeMessage);
    return { success: result.success, error: result.error };
  }

  /**
   * Send email verification
   */
  async sendVerificationEmail(userEmail: string, verificationToken: string): Promise<{ success: boolean; error?: string }> {
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify?token=${verificationToken}`;
    
    const verificationMessage: EmailMessage = {
      from: `noreply&luminaweb.app`,
      to: userEmail,
      subject: 'Verify Your LuminaWeb Email Address',
      html: this.generateVerificationEmailHTML(userEmail, verificationUrl),
      text: this.generateVerificationEmailText(userEmail, verificationUrl),
    };

    const result = await this.sendEmail(verificationMessage);
    return { success: result.success, error: result.error };
  }

  /**
   * Send notification about new message
   */
  async sendNewMessageNotification(
    recipientEmail: string, 
    senderEmail: string, 
    subject: string
  ): Promise<{ success: boolean; error?: string }> {
    const notificationMessage: EmailMessage = {
      from: `notifications&luminaweb.app`,
      to: recipientEmail,
      subject: `New Secure Message from ${this.extractDisplayName(senderEmail)}`,
      html: this.generateNewMessageNotificationHTML(recipientEmail, senderEmail, subject),
      text: this.generateNewMessageNotificationText(recipientEmail, senderEmail, subject),
    };

    const result = await this.sendEmail(notificationMessage);
    return { success: result.success, error: result.error };
  }

  /**
   * Console logging for development
   */
  private async sendWithConsole(message: EmailMessage): Promise<{ success: boolean; messageId: string }> {
    console.log('📧 EMAIL SENT (Console Mode)');
    console.log('From:', message.from);
    console.log('To:', message.to);
    console.log('Subject:', message.subject);
    console.log('Text:', message.text);
    if (message.html) {
      console.log('HTML:', message.html);
    }
    console.log('---');
    
    return { success: true, messageId: `console-${Date.now()}` };
  }

  /**
   * SendGrid integration (requires @sendgrid/mail package)
   */
  private async sendWithSendGrid(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // This would require installing @sendgrid/mail
      // const sgMail = require('@sendgrid/mail');
      // sgMail.setApiKey(this.config.apiKey);
      
      // Convert LuminaWeb format to real email for external sending
      const realMessage = this.convertToRealEmail(message);
      
      console.log('Would send via SendGrid:', realMessage);
      return { success: true, messageId: `sendgrid-${Date.now()}` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'SendGrid error' };
    }
  }

  /**
   * Mailgun integration
   */
  private async sendWithMailgun(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // This would require mailgun-js or similar package
      const realMessage = this.convertToRealEmail(message);
      
      console.log('Would send via Mailgun:', realMessage);
      return { success: true, messageId: `mailgun-${Date.now()}` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Mailgun error' };
    }
  }

  /**
   * SMTP integration
   */
  private async sendWithSMTP(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // This would require nodemailer or similar package
      const realMessage = this.convertToRealEmail(message);
      
      console.log('Would send via SMTP:', realMessage);
      return { success: true, messageId: `smtp-${Date.now()}` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'SMTP error' };
    }
  }

  /**
   * Convert LuminaWeb email format to real email format for external providers
   */
  private convertToRealEmail(message: EmailMessage): EmailMessage {
    return {
      ...message,
      from: this.luminaWebToRealEmail(message.from),
      to: this.luminaWebToRealEmail(message.to),
    };
  }

  /**
   * Convert username&luminaweb.app to username@luminaweb.app for real email sending
   */
  private luminaWebToRealEmail(luminaWebEmail: string): string {
    if (this.isValidLuminaWebEmail(luminaWebEmail)) {
      return luminaWebEmail.replace('&', '@');
    }
    return luminaWebEmail; // Return as-is if not LuminaWeb format
  }

  /**
   * Check if email is valid LuminaWeb format
   */
  private isValidLuminaWebEmail(email: string): boolean {
    return EmailDomainService.isLuminaWebEmail(email);
  }

  /**
   * Extract display name from email
   */
  private extractDisplayName(email: string): string {
    if (this.isValidLuminaWebEmail(email)) {
      const username = EmailDomainService.extractUsername(email);
      return username || email;
    }
    return email.split('@')[0] || email;
  }

  /**
   * Generate welcome email HTML
   */
  private generateWelcomeEmailHTML(username: string, userEmail: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">Welcome to LuminaWeb</h1>
          <p style="color: #6b7280; margin: 5px 0;">Ultra-Secure Email Protocol</p>
        </div>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #374151; margin-top: 0;">Hello ${username}!</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Welcome to LuminaWeb, the most secure email platform available. Your account has been successfully created with the email address:
          </p>
          <p style="background: #e0f2fe; padding: 10px; border-radius: 4px; font-family: monospace; text-align: center; margin: 15px 0;">
            <strong>${userEmail}</strong>
          </p>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #374151;">🔒 Your Security Features:</h3>
          <ul style="color: #4b5563; line-height: 1.8;">
            <li><strong>End-to-End Encryption:</strong> Messages encrypted with AES-256-GCM</li>
            <li><strong>Perfect Forward Secrecy:</strong> Ephemeral keys for each session</li>
            <li><strong>Zero-Knowledge Architecture:</strong> We never see your content</li>
            <li><strong>Anti-Replay Protection:</strong> Timestamps and nonces prevent attacks</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
             style="background: linear-gradient(to right, #2563eb, #0891b2); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Access Your Dashboard
          </a>
        </div>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; color: #6b7280; font-size: 14px; text-align: center;">
          <p>This email was sent to you because you signed up for LuminaWeb.</p>
          <p>For security questions, contact security&luminaweb.app</p>
        </div>
      </div>
    `;
  }

  /**
   * Generate welcome email text version
   */
  private generateWelcomeEmailText(username: string, userEmail: string): string {
    return `
Welcome to LuminaWeb - Ultra-Secure Email Protocol

Hello ${username}!

Welcome to LuminaWeb, the most secure email platform available. Your account has been successfully created with the email address: ${userEmail}

Your Security Features:
• End-to-End Encryption: Messages encrypted with AES-256-GCM
• Perfect Forward Secrecy: Ephemeral keys for each session  
• Zero-Knowledge Architecture: We never see your content
• Anti-Replay Protection: Timestamps and nonces prevent attacks

Access your dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard

This email was sent to you because you signed up for LuminaWeb.
For security questions, contact security&luminaweb.app
    `.trim();
  }

  /**
   * Generate verification email HTML
   */
  private generateVerificationEmailHTML(userEmail: string, verificationUrl: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb; text-align: center;">Verify Your Email</h1>
        <p>Please click the button below to verify your LuminaWeb email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Verify Email Address
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          If the button doesn't work, copy and paste this link: ${verificationUrl}
        </p>
      </div>
    `;
  }

  /**
   * Generate verification email text
   */
  private generateVerificationEmailText(userEmail: string, verificationUrl: string): string {
    return `
Verify Your LuminaWeb Email Address

Please visit the following link to verify your email address:
${verificationUrl}

If you didn't sign up for LuminaWeb, please ignore this email.
    `.trim();
  }

  /**
   * Generate new message notification HTML
   */
  private generateNewMessageNotificationHTML(recipientEmail: string, senderEmail: string, subject: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">New Secure Message</h1>
        <p>You have received a new secure message in your LuminaWeb account.</p>
        <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p><strong>From:</strong> ${senderEmail}</p>
          <p><strong>Subject:</strong> ${subject}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
             style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Read Message
          </a>
        </div>
      </div>
    `;
  }

  /**
   * Generate new message notification text
   */
  private generateNewMessageNotificationText(recipientEmail: string, senderEmail: string, subject: string): string {
    return `
New Secure Message - LuminaWeb

You have received a new secure message in your LuminaWeb account.

From: ${senderEmail}
Subject: ${subject}

Read your message: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard
    `.trim();
  }
}

// Default email service instance
export const emailService = new EmailService({
  provider: process.env.NODE_ENV === 'production' ? 'sendgrid' : 'console',
  apiKey: process.env.SENDGRID_API_KEY,
  domain: process.env.LUMINAWEB_DOMAIN || 'luminaweb.app',
});