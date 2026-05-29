// EmailService.ts

import { Resend } from "resend";
import logger from "../logger";


/**
 * Interface for email payload
 * Keeps your service strongly typed and reusable
 */
interface SendEmailOptions {
    to: string | string[]; // single or multiple recipients
    subject: string;
    html: string;
    // react?: React.ReactNode;
    from?: string;
}

/**
 * Interface for bulk email items
 */
interface BulkEmailItem {
    to: string;
    subject: string;
    html?: string;
    //react?: React.ReactNode;
}

/**
 * Centralized Email Service using Resend
 * Handles all email-related operations in your app
 */
export class EmailService {
    private client: Resend;
    private defaultFrom: string;

    constructor() {
        /**
         * Initialize Resend client using API key from env
         */
        this.client = new Resend(process.env.RESEND_API_KEY);

        /**
         * Default sender email (must be verified in Resend)
         */
        this.defaultFrom = process.env.EMAIL_FROM || process.env.EMAIL_FROM as string;

        if (!this.defaultFrom) {
            throw new Error("EMAIL_FROM is not defined in environment variables");
        }
    }

    /**
     * Send a single email
     * Used for OTP, verification, password reset, etc.
     */
    async sendEmail(options: SendEmailOptions) {
        try {
            const response = await this.client.emails.send({
                from: options.from || this.defaultFrom,
                to: options.to,
                subject: options.subject,
                html: options.html,
                // react: options.react,
            });

            return response;
        } catch (error) {
            console.error("Error sending email:", error);
            throw error;
        }
    }

    /**
     * Send bulk emails (multiple recipients with different content)
     * Useful for personalized notifications
     */
    async sendBulkEmails(emails: BulkEmailItem[]) {
        try {
            /**
             * Resend supports batch sending
             */
            const response = await this.client.batch.send(
                emails.map((email) => ({
                    from: this.defaultFrom,
                    to: email.to,
                    subject: email.subject,
                    html: email.html,
                    // react: email.react,
                }))
            );

            return response;
        } catch (error) {
            console.error("Error sending bulk emails:", error);
            throw error;
        }
    }

    /**
     * Broadcast email (same content to many users)
     * Useful for announcements, newsletters
     */
    async sendBroadcastEmail(recipients: string[], subject: string, html: string) {
        try {
            /**
             * Sends same content to multiple recipients
             */
            const response = await this.client.emails.send({
                from: this.defaultFrom,
                to: recipients,
                subject,
                html,
            });

            return response;
        } catch (error) {
            console.error("Error sending broadcast email:", error);
            throw error;
        }
    }

    /**
     * Send OTP Email
     * Common auth use case
     */
    async sendOtpEmail(email: string, otp: string) {
        const html = Templates.otpTemplate(otp);

        return this.sendEmail({
            to: email,
            subject: "Your OTP Code",
            html,
        });
    }

    /**
     * Send Verification Email
     */
    async sendVerificationEmail(email: string, link: string) {
        const html = Templates.verificationTemplate(link);

        return this.sendEmail({
            to: email,
            subject: "Verify Your Email",
            html,
        });
    }

    /**
     * Send Password Reset Email
     */
    async sendPasswordResetEmail(email: string, link: string) {
        const html = Templates.resetPasswordTemplate(link);

        return this.sendEmail({
            to: email,
            subject: "Reset Your Password",
            html,
        });
    }
}

// ResendEmailService.ts

//import { Resend } from "resend";

/**
 * Supported OTP types
 */
type OTPType = "registration" | "password_reset" | "2fa";

/**
 * Centralized Resend Email Service
 */
export class ResendEmailService {
    private client: Resend;
    private defaultFrom: string;

    constructor() {
        /**
         * Initialize Resend client using API key from env
         */
        this.client = new Resend(process.env.RESEND_API_KEY);

        /**
         * Default sender (must be verified in Resend)
         */
        this.defaultFrom =
            process.env.EMAIL_FROM || "Help me Nigeria <no-reply@helpmenigeria.com>";
    }

    /**
     * Core send method (internal use)
     */
    private async sendEmail(
        to: string,
        subject: string,
        html: string
    ): Promise<void> {
        try {
            const res = await this.client.emails.send({
                from: this.defaultFrom,
                to,
                subject,
                html,
            });
            console.log(res)
        } catch (error) {
            logger.error("Resend email failed", { to, subject, error });
            throw new Error("Email sending failed");
        }
    }

    /**
     * Send OTP Email
     * Supports registration, password reset, and 2FA
     */
    async sendOTPEmail(
        email: string,
        otp: string,
        type: OTPType
    ): Promise<void> {
        try {
            let subject: string;

            switch (type) {
                case "registration":
                    subject = "Verify Your Account - OTP Code";
                    break;
                case "password_reset":
                    subject = "Password Reset - OTP Code";
                    break;
                case "2fa":
                    subject = "Two-Factor Authentication - OTP Code";
                    break;
                default:
                    subject = "Verification Code";
            }

            const html = this.getOTPTemplate(otp, type);

            const res = await this.sendEmail(email, subject, html);

            console.log(res)

            logger.info("OTP email sent successfully", { email, type });
        } catch (error) {
            logger.error("Failed to send OTP email", { email, type, error });
            throw new Error("Failed to send OTP email");
        }
    }

    /**
     * Send Admin Welcome Email
     */
    async sendAdminWelcomeEmail(
        email: string,
        firstName: string,
        adminLevel: string,
        password: string
    ): Promise<void> {
        try {
            const subject = "Welcome to Help me Nigeria Admin Team";

            const html = this.getAdminWelcomeTemplate(
                firstName,
                adminLevel,
                password
            );

            await this.sendEmail(email, subject, html);

            logger.info("Admin welcome email sent successfully", {
                email,
                adminLevel,
            });
        } catch (error) {
            logger.error("Failed to send admin welcome email", {
                email,
                error,
            });
        }
    }

    /**
 * Send Password Reset Confirmation Email
 * NOTE: Does NOT throw error if it fails (non-critical email)
 */
    async sendPasswordResetConfirmation(
        email: string,
        firstName: string,
        password: string
    ): Promise<void> {
        try {
            const html = this.getPasswordResetConfirmationTemplate(
                firstName,
                password
            );

            await this.sendEmail(email, "Password Reset Successful", html);

            logger.info("Password reset confirmation email sent", { email });
        } catch (error) {
            logger.error("Failed to send password reset confirmation", {
                email,
                error,
            });
            // intentionally not throwing
        }
    }

    /**
     * Send Account Unsuspended Notification
     */
    async sendAccountUnsuspendedNotification(email: string): Promise<void> {
        try {
            const html = this.getAccountUnsuspendedTemplate();

            await this.sendEmail(email, "Account Unsuspended", html);

            logger.info("Account unsuspended email sent", { email });
        } catch (error) {
            logger.error("Failed to send account unsuspended email", {
                email,
                error,
            });
            throw new Error("Failed to send unsuspended notification");
        }
    }

    /**
     * Send Account Suspended Notification
     */
    async sendAccountSuspendedNotification(
        email: string,
        reason?: string,
        duration?: number
    ): Promise<void> {
        try {
            const html = this.getAccountSuspendedTemplate(reason, duration);

            await this.sendEmail(email, "Account Suspended", html);

            logger.info("Account suspended email sent", { email });
        } catch (error) {
            logger.error("Failed to send account suspended email", {
                email,
                error,
            });
            throw new Error("Failed to send suspension notification");
        }
    }
    async sendAccountDeletedNotification(
        email: string,
        reason?: string
    ): Promise<void> {
        try {
            const html = this.getAccountDeletedTemplate(reason);

            await this.sendEmail(email, "Account Deleted", html);

            logger.info("Account deleted email sent", { email });
        } catch (error) {
            logger.error("Failed to send account deleted email", {
                email,
                error,
            });

            throw new Error("Failed to send account deletion notification");
        }
    }


    // ============================
    // 📧 TEMPLATES (GREEN PALETTE)
    // ============================

    /**
     * OTP Email Template
     */


    private getAccountDeletedTemplate(reason?: string): string {
        return `
  <div style="background:#f0fdf4;padding:24px;font-family:Arial;">
    <div style="max-width:600px;margin:auto;background:#fff;padding:24px;border-radius:8px;">
      
      <h2 style="color:#065f46;">Help me Nigeria</h2>

      <h3 style="color:#b91c1c;">Account Deleted</h3>

      <p style="color:#374151;">
        Your account has been deleted from our platform.
      </p>

      ${reason
                ? `<p style="color:#374151;">
                    <strong>Reason:</strong> ${reason}
                 </p>`
                : ""
            }

      <p style="color:#6b7280;margin-top:20px;">
        If you believe this action was taken in error or need further assistance,
        please contact support.
      </p>

      <div style="text-align:center;margin:30px 0;">
        <a href="mailto:${process.env.ADMIN_EMAIL || "support@helpmenigeria.com"}"
          style="background:#047857;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;">
          Contact Support
        </a>
      </div>

      <p style="font-size:12px;color:#9ca3af;text-align:center;">
        © ${new Date().getFullYear()} Help me Nigeria
      </p>
    </div>
  </div>
  `;
    }

    private getOTPTemplate(otp: string, type: OTPType): string {
        return `
    <div style="font-family: Arial, sans-serif; background-color: #f0fdf4; padding: 24px;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 24px; border-radius: 8px;">
        
        <h2 style="color: #065f46;">Help me Nigeria</h2>

        <h3 style="color: #111827;">
          ${type === "registration"
                ? "Verify Your Account"
                : type === "password_reset"
                    ? "Reset Your Password"
                    : "Two-Factor Authentication"
            }
        </h3>

        <p style="color: #374151;">
          Use the OTP code below to proceed:
        </p>

        <div style="margin: 20px 0; text-align: center;">
          <span style="font-size: 32px; font-weight: bold; color: #047857;">
            ${otp}
          </span>
        </div>

        <p style="color: #6b7280; font-size: 14px;">
          This code will expire shortly. Do not share it with anyone.
        </p>

        <hr style="margin: 24px 0;" />

        <p style="color: #9ca3af; font-size: 12px;">
          © ${new Date().getFullYear()} Help me Nigeria. All rights reserved.
        </p>
      </div>
    </div>
    `;
    }

    private getAccountUnsuspendedTemplate(): string {
        return `
  <div style="font-family:Arial,sans-serif;background:#f0fdf4;padding:24px;">
    <div style="max-width:600px;margin:auto;background:#fff;padding:24px;border-radius:8px;">
      
      <h2 style="color:#065f46;">Help me Nigeria</h2>

      <h3 style="color:#111827;">Account Restored</h3>

      <p style="color:#374151;">
        Your account has been successfully restored. You can now log in and continue using the platform.
      </p>

      <div style="text-align:center;margin:30px 0;">
        <a href="${process.env.CLIENT_URL}/login"
          style="background:#047857;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;">
          Login
        </a>
      </div>

      <p style="font-size:12px;color:#9ca3af;text-align:center;">
        © ${new Date().getFullYear()} Help me Nigeria
      </p>
    </div>
  </div>
  `;
    }


    private getPasswordResetConfirmationTemplate(
        firstName: string,
        password: string
    ): string {
        return `
  <div style="margin:0;padding:0;background-color:#f0fdf4;font-family:Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;padding:24px;border-radius:8px;">
      
      <h2 style="color:#065f46;margin-bottom:10px;">Help me Nigeria</h2>

      <h3 style="color:#111827;">Password Reset Successful</h3>

      <p style="color:#374151;">Hello ${firstName},</p>

      <p style="color:#374151;line-height:1.6;">
        Your password has been successfully reset. You can now log in using your new password:
      </p>

      <div style="background:#ecfdf5;padding:16px;border-radius:6px;margin:20px 0;">
        <p style="margin:0;font-size:18px;color:#047857;font-weight:bold;">
          ${password}
        </p>
      </div>

      <p style="color:#6b7280;">
        If you did not request this, please contact support immediately.
      </p>

      <div style="text-align:center;margin:30px 0;">
        <a href="${process.env.CLIENT_URL}/login"
          style="background:#047857;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;">
          Login to Your Account
        </a>
      </div>

      <p style="font-size:12px;color:#9ca3af;text-align:center;">
        © ${new Date().getFullYear()} Help me Nigeria
      </p>
    </div>
  </div>
  `;
    }

    private getAccountSuspendedTemplate(
        reason?: string,
        duration?: number
    ): string {
        return `
  <div style="background:#f0fdf4;padding:24px;font-family:Arial;">
    <div style="max-width:600px;margin:auto;background:#fff;padding:24px;border-radius:8px;">
      
      <h2 style="color:#065f46;">Help me Nigeria</h2>

      <h3 style="color:#b91c1c;">Account Suspended</h3>

      <p style="color:#374151;">
        Your account has been temporarily suspended.
      </p>

      ${duration
                ? `<p style="color:#374151;"><strong>Duration:</strong> ${duration}</p>`
                : ""
            }

      ${reason
                ? `<p style="color:#374151;"><strong>Reason:</strong> ${reason}</p>`
                : ""
            }

      <p style="color:#6b7280;margin-top:20px;">
        If you believe this is a mistake, contact support.
      </p>

      <div style="text-align:center;margin:30px 0;">
        <a href="mailto:${process.env.ADMIN_EMAIL || "support@helpmenigeria.com"}"
          style="background:#047857;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;">
          Contact Support
        </a>
      </div>

      <p style="font-size:12px;color:#9ca3af;text-align:center;">
        © ${new Date().getFullYear()} Help me Nigeria
      </p>
    </div>
  </div>
  `;
    }

    /**
     * Admin Welcome Template
     */
    private getAdminWelcomeTemplate(
        firstName: string,
        adminLevel: string,
        password: string
    ): string {
        return `
    <div style="font-family: Arial, sans-serif; background-color: #f0fdf4; padding: 24px;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 24px; border-radius: 8px;">
        
        <h2 style="color: #065f46;">Help me Nigeria</h2>

        <h3 style="color: #111827;">
          Welcome to the Admin Team
        </h3>

        <p style="color: #374151;">
          Hello ${firstName},
        </p>

        <p style="color: #374151;">
          You have been onboarded as a <strong>${adminLevel}</strong> administrator on Help me Nigeria.
        </p>

        <div style="margin: 20px 0; padding: 16px; background: #ecfdf5; border-radius: 6px;">
          <p style="margin: 0;"><strong>Temporary Password:</strong></p>
          <p style="font-size: 18px; color: #047857; font-weight: bold;">
            ${password}
          </p>
        </div>

        <p style="color: #6b7280;">
          Please log in and change your password immediately.
        </p>

        <hr style="margin: 24px 0;" />

        <p style="color: #9ca3af; font-size: 12px;">
          © ${new Date().getFullYear()} Help me Nigeria. All rights reserved.
        </p>
      </div>
    </div>
    `;
    }
}


export class AnnouncementTemplates {

    // =========================================
    // BASE TEMPLATE
    // =========================================
    static baseTemplate(content: string, title?: string) {

        return `
        <!DOCTYPE html>
        <html lang="en">

        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />

            <title>${title || "Help me Nigeria"}</title>
        </head>

        <body
            style="
                margin:0;
                padding:0;
                background:#f0fdf4;
                font-family:Arial,sans-serif;
            "
        >

            <div
                style="
                    max-width:600px;
                    margin:40px auto;
                    background:#ffffff;
                    border-radius:12px;
                    overflow:hidden;
                    box-shadow:0 2px 10px rgba(0,0,0,0.05);
                "
            >

                <!-- HEADER -->
                <div
                    style="
                        background:linear-gradient(135deg,#047857,#065f46);
                        padding:32px 24px;
                        text-align:center;
                    "
                >

                    <h1
                        style="
                            margin:0;
                            color:white;
                            font-size:28px;
                        "
                    >
                        Help me Nigeria
                    </h1>

                    <p
                        style="
                            color:#d1fae5;
                            margin-top:10px;
                            font-size:14px;
                        "
                    >
                        Empowering Communities Through Support
                    </p>

                </div>

                <!-- BODY -->
                <div
                    style="
                        padding:32px 24px;
                        color:#374151;
                        line-height:1.7;
                        font-size:15px;
                    "
                >
                    ${content}
                </div>

                <!-- FOOTER -->
                <div
                    style="
                        background:#ecfdf5;
                        border-top:1px solid #d1fae5;
                        padding:20px;
                        text-align:center;
                    "
                >

                    <p
                        style="
                            margin:0;
                            color:#6b7280;
                            font-size:13px;
                        "
                    >
                        © ${new Date().getFullYear()} Help me Nigeria
                    </p>

                    <p
                        style="
                            margin-top:8px;
                            color:#9ca3af;
                            font-size:12px;
                        "
                    >
                        This email was sent automatically by Help me Nigeria.
                    </p>

                </div>

            </div>

        </body>

        </html>
        `;
    }

    // =========================================
    // ANNOUNCEMENT TEMPLATE
    // =========================================
    static announcementTemplate(data: {
        title: string;
        message: string;
        ctaText?: string;
        ctaLink?: string;
    }) {

        return this.baseTemplate(
            `
            <h2
                style="
                    color:#065f46;
                    margin-top:0;
                "
            >
                ${data.title}
            </h2>

            <p>
                ${data.message}
            </p>

            ${data.ctaText && data.ctaLink
                ? `
                <div
                    style="
                        margin-top:30px;
                        text-align:center;
                    "
                >

                    <a
                        href="${data.ctaLink}"

                        style="
                            background:#047857;
                            color:white;
                            text-decoration:none;
                            padding:12px 24px;
                            border-radius:6px;
                            display:inline-block;
                            font-weight:bold;
                        "
                    >
                        ${data.ctaText}
                    </a>

                </div>
                `
                : ""
            }
            `,
            data.title
        );
    }
}



/**
 * Simple Template System
 * You can later replace this with:
 * - Handlebars
 * - React Email
 * - Or external template files
 */
class Templates {

    /**
     * OTP Email Template
     */
    static otpTemplate(otp: string): string {
        return `
            <div style="font-family: Arial, sans-serif;">
                <h2>Your OTP Code</h2>
                <p>Use the code below to continue:</p>
                <h1>${otp}</h1>
                <p>This code will expire shortly.</p>
            </div>
        `;
    }

    /**
     * Email Verification Template
     */
    static verificationTemplate(link: string): string {
        return `
            <div style="font-family: Arial, sans-serif;">
                <h2>Verify Your Email</h2>
                <p>Click the button below to verify your account:</p>
                <a href="${link}" style="padding:10px 20px;background:black;color:white;text-decoration:none;">
                    Verify Email
                </a>
            </div>
        `;
    }

    /**
     * Password Reset Template
     */
    static resetPasswordTemplate(link: string): string {
        return `
            <div style="font-family: Arial, sans-serif;">
                <h2>Reset Password</h2>
                <p>Click below to reset your password:</p>
                <a href="${link}" style="padding:10px 20px;background:red;color:white;text-decoration:none;">
                    Reset Password
                </a>
            </div>
        `;
    }
}