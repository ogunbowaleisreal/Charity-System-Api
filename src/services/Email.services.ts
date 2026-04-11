import nodemailer from "nodemailer";
import formData from "form-data";
import Mailgun from "mailgun.js";
import logger from "../logger";
import { EnquiryDocument } from "../models/clientEnquiries";
import { IBids } from "../models/Bids";
//import { IUser } from "../models/Accounts";
//import { IUser, IVendor } from "@/types";
// import { IWedding } from "@/models/Wedding";
// import { IGuest } from "@/models/Guest";
// import { IQuote } from "@/models/Quotes";
// import { BusinessInfo, IListing } from "@/models/Listing";
// import { IReview } from "@/models/Review";

// Interface for email transport
interface EmailTransport {
  sendMail(options: {
    from: string;
    to: string;
    subject: string;
    html: string;
  }): Promise<any>;
}

// SMTP Transport (your current nodemailer)
class SMTPTransport implements EmailTransport {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendMail(options: {
    from: string;
    to: string;
    subject: string;
    html: string;
  }) {
    return await this.transporter.sendMail(options);
  }
}

class MailgunTransport implements EmailTransport {
  private mailgun: any;
  private domain: string;

  constructor() {
    const mailgun = new Mailgun(formData);
    this.mailgun = mailgun.client({
      username: "api",
      key: process.env.MAILGUN_API_KEY || process.env.EMAIL_PASSWORD || "",
    });
    this.domain = process.env.MAILGUN_DOMAIN || "mg.pelbliss.com";
  }

  async sendMail(options: {
    from: string;
    to: string;
    subject: string;
    html: string;
  }) {
    const messageData = {
      from: options.from,
      to: [options.to],
      subject: options.subject,
      html: options.html,
    };

    return await this.mailgun.messages.create(this.domain, messageData);
  }
}

// Transport Factory
class TransportFactory {
  static createTransport(): EmailTransport {
    const service = process.env.EMAIL_SERVICE?.toLowerCase();

    switch (service) {
      case "mailgun":
        return new MailgunTransport();
      case "gmail":
      case "smtp":
      default:
        return new SMTPTransport();
    }
  }
}

class EmailService {
  private transport: EmailTransport;

  constructor() {
    this.transport = TransportFactory.createTransport();
  }

  async sendForm(
    fullName: string,
    email: string,
    phoneNumber: string,
    message: string
  ) {
    try {
      const subject = `New Contact Form Submission from ${fullName}`;

      const html = this.getSendFormEmailTemplate(
        fullName,
        email,
        phoneNumber,
        message
      );

      await this.transport.sendMail({
        from: process.env.EMAIL_FROM || "Pelbliss <no-reply@pelbliss.com>",
        to:
          process.env.ADMIN_EMAIL ||
          process.env.EMAIL_USER ||
          "thepelbliss@gmail.com",
        subject,
        html,
      });

      logger.info("New contact form submitted Successfully", { fullName });
      return;
    } catch (error) {
      logger.error("Failed to Submit contact form", { fullName });
      throw new Error("Failed to Send");
    }
  }

  async sendOTPEmail(
    email: string,
    otp: string,
    type: "registration" | "password_reset" | "2fa"
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

      const html = this.getOTPEmailTemplate(otp, type);

      await this.transport.sendMail({
        from: process.env.MAILGUN_SENDER || "Pelbliss <no-reply@pelbliss.com>",
        to: email,
        subject,
        html,
      });

      logger.info("OTP email sent successfully", { email, type });
    } catch (error) {
      logger.error("Failed to send OTP email", { email, type, error });
      throw new Error("Failed to send OTP email");
    }
  }

  async sendWelcomeEmail(
    email: string,
    firstName: string,
    role: string
  ): Promise<void> {
    try {
      let html: string;
      let subject: string;

      if (role === "vendor") {
        html = this.getVendorWelcomeEmailTemplate(firstName);
        subject = "Welcome to the Pelbliss experience!";
      } else if (role === "couple") {
        html = this.getUserWelcomeEmailTemplate(firstName);
        subject = "Welcome to Pelbliss – Start Planning Your Big Day Today!";
      } else {
        // Default to couple template for any other role
        html = this.getUserWelcomeEmailTemplate(firstName);
        subject = "Welcome to Pelbliss – Start Planning Your Big Day Today!";
      }

      await this.transport.sendMail({
        from: process.env.EMAIL_FROM || "Pelbliss <no-reply@pelbliss.com>",
        to: email,
        subject,
        html,
      });

      logger.info("Welcome email sent successfully", { email, role });
    } catch (error) {
      logger.error("Failed to send welcome email", { email, role, error });
    }
  }

  async sendAdminWelcomeEmail(
    email: string,
    firstName: string,
    adminLevel: string,
    password: string
  ): Promise<void> {
    try {
      const html = this.getAdminWelcomeEmailTemplate(
        firstName,
        adminLevel,
        password
      );

      await this.transport.sendMail({
        from: process.env.MAILGUN_SENDER || "softweb Admin <admin@yourdomain.com>",
        to: email,
        subject: "Welcome to the Soft-Web Digital Admin Team!",
        html,
      });

      logger.info("Admin welcome email sent successfully", {
        email,
        adminLevel,
      });
    } catch (error) {
      logger.error("Failed to send admin welcome email", { email, error });
    }
  }

  async sendAssignmentEmail(client: any, consultant: any): Promise<void> {
    try {
      const html = this.getClientConsultantAssignmentTemplate(client, consultant);
      const email = client.email
      console.log(client)
      await this.transport.sendMail({
        from: `Floatthr <${process.env.MAILGUN_SENDER}>` || "Pelbliss <no-reply@pelbliss.com>",
        to: email,
        subject: "Assignment Notification",
        html,
      });

      logger.info("Assignment email sent successfully", { email });
    }
    catch (error: any) {
      logger.error("Failed to send assignment email", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    }
  }



  async sendJobCreationNotification(job: any, email: string): Promise<void> {
    try {
      const html = this.getJobCreationNotificationTemplate(job);
      await this.transport.sendMail({
        from: process.env.MAILGUN_SENDER || "softweb <no-reply@softweb.com>",
        to: process.env.JOB_NOTIFICATION_EMAIL || email,
        subject: "New Job Created - Notification",
        html,
      });
    } catch (error) {
      logger.error("Failed to send job creation notification", { jobId: job._id, error });
    }
  }

  async sendClientNewJobAlert(job: any, email: any, phone1?: string, phone2?: string): Promise<void> {
    try {
      const clientName = `${job.firstName} ${job.lastName}`
      const html = this.getClientThankYouTemplate(clientName, email, phone1, phone2);
      await this.transport.sendMail({
        from: process.env.MAILGUN_SENDER || "softweb <no-reply@softweb.com>",
        to: job.email,
        subject: "Your Job Has Been Created - Confirmation",
        html,
      });
    } catch (error) {
      logger.error("Failed to send client new job alert", { jobId: job._id, error });
    }
  }

  async sendJobStatusUpdateNotification(job: any, email: string, status: string): Promise<void> {
    try {
      const html = this.getJobStatusUpdateNotificationTemplate(job, status);
      await this.transport.sendMail({
        from: process.env.EMAIL_FROM || "softweb <no-reply@softweb.com",
        to: process.env.JOB_NOTIFICATION_EMAIL || email,
        subject: "Job Status Updated - Notification",
        html,
      });
    } catch (error) {
      logger.error("Failed to send job status update notification", { jobId: job._id, error });
    }
  }

  async sendNewEnquiryEmail(enquiry: any, email: string): Promise<void> {
    try {
      const html = this.getNewEnquiryTemplate(enquiry);
      await this.transport.sendMail({
        from: process.env.EMAIL_FROM || "softweb <no-reply@softweb.com",
        to: email,
        subject: "New Consultant Approval - Notification",
        html,
      });

    } catch (err: any) {
      logger.error("Failed to send consultant approval notification", { err });
    }
  }


  getNewEnquiryTemplate(enquiry: EnquiryDocument): string {
    return `
    <div style="font-family: Arial, sans-serif; background-color: #f3f4f6; padding: 24px;">
      <div style="max-width: 640px; margin: auto; background: #ffffff; padding: 24px; border-radius: 6px;">
        
        <h2 style="margin-bottom: 8px; color: #111827;">
          New Enquiry Received
        </h2>

        <p style="color: #374151;">
          A new enquiry has been submitted on the FloatHR platform.
        </p>

        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <tbody>
            <tr>
              <td style="padding: 8px; font-weight: 600;">Full Name</td>
              <td style="padding: 8px;">${enquiry.fullName}</td>
            </tr>

            <tr>
              <td style="padding: 8px; font-weight: 600;">Company Name</td>
              <td style="padding: 8px;">${enquiry.companyName || "N/A"}</td>
            </tr>

            <tr>
              <td style="padding: 8px; font-weight: 600;">Email</td>
              <td style="padding: 8px;">${enquiry.email}</td>
            </tr>

            <tr>
              <td style="padding: 8px; font-weight: 600;">Phone Number</td>
              <td style="padding: 8px;">${enquiry.phoneNumber || "N/A"}</td>
            </tr>

            <tr>
              <td style="padding: 8px; font-weight: 600;">Company Size</td>
              <td style="padding: 8px;">${enquiry.numberOfEmployees}</td>
            </tr>

            <tr>
              <td style="padding: 8px; font-weight: 600;">Preferred Contact Method</td>
              <td style="padding: 8px; text-transform: capitalize;">
                ${enquiry.preferredContactMethod}
              </td>
            </tr>

            <tr>
              <td style="padding: 8px; font-weight: 600; vertical-align: top;">
                HR Challenges
              </td>
              <td style="padding: 8px;">
                ${enquiry.hrChallenges || "Not provided"}
              </td>
            </tr>
          </tbody>
        </table>

        <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
          Submitted on ${new Date(enquiry.createdAt).toLocaleString()}
        </p>

        <hr style="margin: 24px 0;" />

        <p style="color: #9ca3af; font-size: 12px;">
          This is an automated notification from FloatHR.
        </p>
      </div>
    </div>
  `;
  }

  async sendAccountUnsuspendedEmail(account: any): Promise<void> {
    try {
      const html = this.getAccountUnSuspendedTemplate(account);
      await this.transport.sendMail({
        from: process.env.EMAIL_FROM || "softweb <no-reply@softweb.com>",
        to: account.email,
        subject: "Account Unsuspended - Notification",
        html,
      });
    } catch (error) {
      logger.error("Failed to send account unsuspended notification", { error });
    }
  }

  private getAccountUnSuspendedTemplate(account: any): string {
    return `
    <div style="font-family: Arial, sans-serif; background-color: #f3f4f6; padding: 24px;">
      <div style="max-width: 640px; margin: auto; background: #ffffff; padding: 24px; border-radius: 6px;">
        
        <h2 style="margin-bottom: 8px; color: #111827;">
          Account Unsuspended
        </h2>

        <p style="color: #374151;">
          Your ${account.role} account has been unsuspended on the FloatHR platform.
          Please log in to access your account.
        </p>

        <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
          This is an automated notification from FloatHR.
        </p>
      </div>
    </div>
  `;
  }

  async sendBidApprovalOrDenialEmail(consultant: any, bid: any, email: string, status: "approved" | "declined"): Promise<void> {
    try {
      const html = this.getBidApprovalOrDeclineTemplate(consultant, bid, status);
      await this.transport.sendMail({
        from: `Floatthr <${process.env.MAILGUN_SENDER}>` || "softweb <no-reply@softweb.com",
        to: email,
        subject: "Bid Approval or Denial - Notification",
        html,
      });
    } catch (error) {
      logger.error("Failed to send bid approval or denial notification", { bidId: bid._id, error });
    }
  }


  private getBidApprovalOrDeclineTemplate(
    consultant: any,
    bid: IBids,
    status: "approved" | "declined"
  ): string {
    const fullName = `${consultant.firstName} ${consultant.lastName}`;
    const bidDate = bid.createdAt.toDateString();
    const year = new Date().getFullYear();

    const isApproved = status === "approved";

    return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Bid ${isApproved ? "Approved" : "Declined"}</title>
    </head>
    <body style="margin:0; padding:0; background-color:#f4f8fc; font-family:Arial, Helvetica, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding:40px 16px;">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden;">

              <!-- Header -->
              <tr>
                <td style="background:#0a66c2; padding:24px; text-align:center;">
                  <h1 style="margin:0; color:#ffffff; font-size:22px;">
                    Floatthr
                  </h1>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:32px; color:#1f2937;">
                  <h2 style="margin-top:0; color:#0a66c2; font-size:20px;">
                    Bid ${isApproved ? "Approved" : "Declined"}
                  </h2>

                  <p style="font-size:15px; line-height:1.6;">
                    Hello <strong>${fullName}</strong>,
                  </p>

                  <p style="font-size:15px; line-height:1.6;">
                    Your bid submitted on <strong>${bidDate}</strong>
                    has been <strong style="color:#0a66c2;">
                      ${isApproved ? "approved" : "declined"}
                    </strong>.
                  </p>

                  ${isApproved
        ? `
                      <p style="font-size:15px; line-height:1.6;">
                        This approval confirms that your bid has met the requirements.
                        Please note that approval does <strong>not</strong> mean you have
                        been assigned to the client yet.
                      </p>
                      <p style="font-size:15px; line-height:1.6;">
                        You will receive a separate notification once an assignment
                        decision is made.
                      </p>
                      `
        : `
                      <p style="font-size:15px; line-height:1.6;">
                        Unfortunately, your bid was not selected at this time.
                        You are encouraged to continue submitting bids for other requests.
                      </p>
                      `
      }

                  <p style="font-size:14px; line-height:1.6; color:#4b5563;">
                    Thank you for being part of Floatthr.
                  </p>

                  <p style="font-size:14px; line-height:1.6;">
                    Regards,<br />
                    <strong>The Floatthr Team</strong>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f1f5f9; padding:16px; text-align:center; font-size:12px; color:#64748b;">
                  © ${year} Floatthr. All rights reserved.
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
  }
  // async sendSubscriptionCreatedEmail(user: any): Promise<void> {
  //   try {
  //     const html = this.getSubscriptionCreatedTemplate(user);
  //     await this.transport.sendMail({
  //       from: `Floatthr <${process.env.MAILGUN_SENDER}>` || "softweb <no-reply@softweb.com",
  //       to: user.email,
  //       subject: "Subscription Created - Notification",
  //       html,
  //     });
  //   } catch (error) {
  //     logger.error("Failed to send subscription created notification", { userId: user._id, error });
  //   }
  // }


  async sendConsultantApprovedEmail(consultant: any): Promise<void> {
    try {
      const html = this.getConsultantApprovalNotificationTemplate(consultant);
      await this.transport.sendMail({
        from: `Floatthr <${process.env.MAILGUN_SENDER}>` || "softweb <no-reply@softweb.com",
        to: consultant.email,
        subject: "New Consultant Approval - Notification",
        html,
      });
    } catch (error) {
      logger.error("Failed to send consultant approval notification", { consultantId: consultant._id, error });
    }
  }

  private getConsultantApprovalNotificationTemplate(consultant: any): string {
    const fullName = `${consultant.firstName} ${consultant.lastName}`;

    return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Consultant Approval Notification</title>
  </head>
  <body style="font-family: Arial, sans-serif; margin:0; padding:0; background-color:#f4f6f8;">
      <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
              <td align="center" style="padding: 20px 0;">
                  <!-- Header / Logo Placeholder -->
                  <h1 style="color:#0056b3;">Floatthr</h1>
              </td>
          </tr>
          <tr>
              <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
                      <tr>
                          <td style="padding: 30px;">
                              <h2 style="color:#0056b3;">Congratulations, ${fullName}!</h2>
                              <p style="color:#333333; font-size:16px; line-height:1.5;">
                                  We are pleased to inform you that your consultant profile has been <strong>approved</strong> on Floatthr. 
                                  You can now access your dashboard and start connecting with clients.
                              </p>

                              <p style="color:#333333; font-size:16px; line-height:1.5;">
                                  To get started, please log in to your account and complete any remaining setup steps.
                                  Then you can start bidding for jobs.
                              </p>

                              <!-- Call to Action Button -->
                              <p style="text-align:center; margin:30px 0;">
                                  <a href="https://app.floatthr.com" style="background-color:#0056b3; color:#ffffff; text-decoration:none; padding:12px 25px; border-radius:5px; font-weight:bold;">Go to Dashboard</a>
                              </p>

                              <p style="color:#666666; font-size:14px; line-height:1.4;">
                                  If you have any questions or need assistance, please contact our support team.
                              </p>

                              <p style="color:#666666; font-size:14px; line-height:1.4;">
                                  Best regards,<br>
                                  <strong>Floatthr Team</strong>
                              </p>
                          </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                          <td style="background-color:#f4f6f8; padding:20px; text-align:center; font-size:12px; color:#999999;">
                              <p>Follow us on:</p>
                              <p>
                                  <a href="#" style="color:#0056b3; text-decoration:none; margin:0 5px;">Facebook</a> |
                                  <a href="#" style="color:#0056b3; text-decoration:none; margin:0 5px;">LinkedIn</a> |
                                  <a href="#" style="color:#0056b3; text-decoration:none; margin:0 5px;">Twitter</a>
                              </p>
                              <p>© 2025 Floatthr. All rights reserved.</p>
                          </td>
                      </tr>
                  </table>
              </td>
          </tr>
      </table>
  </body>
  </html>
  `;
  }


  // private getJobCreationNotificationTemplate(
  //   job: any,

  // ): string {
  //   return `
  // <!DOCTYPE html>
  // <html lang="en">
  // <head>
  //     <meta charset="UTF-8">
  //     <meta name="viewport" content="width=device-width, initial-scale=1.0">
  //     <title>New Job Created</title>
  //     <style>
  //         body {
  //             font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  //             background-color: #f8f9fc;
  //             color: #333;
  //             margin: 0;
  //             padding: 0;
  //         }
  //         .container {
  //             max-width: 600px;
  //             margin: 40px auto;
  //             background: #ffffff;
  //             border-radius: 12px;
  //             box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  //             overflow: hidden;
  //         }
  //         .header {
  //             background-color: #007BFF;
  //             color: #fff;
  //             text-align: center;
  //             padding: 20px;
  //         }
  //         .header h1 {
  //             margin: 0;
  //             font-size: 22px;
  //         }
  //         .content {
  //             padding: 30px;
  //         }
  //         .content h2 {
  //             color: #007BFF;
  //             font-size: 18px;
  //         }
  //         .content p {
  //             line-height: 1.6;
  //             font-size: 15px;
  //             color: #555;
  //         }
  //         .details {
  //             background: #f4f6fb;
  //             padding: 15px;
  //             border-radius: 8px;
  //             margin-top: 15px;
  //             font-size: 14px;
  //         }
  //         .details strong {
  //             color: #333;
  //         }
  //         .footer {
  //             background: #f1f3f8;
  //             text-align: center;
  //             padding: 15px;
  //             font-size: 13px;
  //             color: #777;
  //         }
  //         @media (max-width: 600px) {
  //             .container { margin: 20px; }
  //         }
  //     </style>
  // </head>
  // <body>
  //     <div class="container">
  //         <div class="header">
  //             <h1>🎉 New Job Created!</h1>
  //         </div>
  //         <div class="content">
  //             <p>Hello Team,</p>
  //             <p>A new job has just been created on <strong>Softweb</strong>. Below are the details:</p>

  //             <div class="details">
  //                 <p><strong>Job Title:</strong> ${job.title || "N/A"}</p>
  //                 <p><strong>Category:</strong> ${job.serviceType || "N/A"}</p>
  //                 <p><strong>Client Name:</strong> ${job.firstName} ${job.lastName}</p>
  //                 <p><strong>Email:</strong> ${job.email || "N/A"}</p>
  //                 <p><strong>Budget:</strong> ${job.budget ? `$${job.budget}` : "N/A"}</p>
  //                 <p><strong>Phone number:</strong> ${job.phone || "N/A"}</p>
  //                 <p><strong>Description:</strong> ${job.featurePreferences || "No description provided."}</p>
  //             </div>

  //             <p style="margin-top:20px;">Please log in to the admin panel to review and manage this job.</p>
  //             <p>Best regards,<br><strong>The Softweb Team</strong></p>
  //         </div>
  //         <div class="footer">
  //             © ${new Date().getFullYear()} Softweb. All rights reserved.
  //         </div>
  //     </div>
  // </body>
  // </html>
  // `;
  // }

  private getClientThankYouTemplate(
    clientName: string,
    email: string,
    phone1?: string,
    phone2?: string
  ): string {
    return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Project Questionnaire Received</title>
      <style>
          body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #f8f9fc;
              color: #333;
              margin: 0;
              padding: 0;
          }
          .container {
              max-width: 600px;
              margin: 40px auto;
              background: #ffffff;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.05);
              overflow: hidden;
          }
          .header {
              background-color: #007BFF;
              color: #fff;
              text-align: center;
              padding: 25px;
          }
          .header h1 {
              margin: 0;
              font-size: 22px;
              font-weight: 600;
          }
          .content {
              padding: 30px;
          }
          .content p {
              line-height: 1.7;
              font-size: 15px;
              color: #555;
              margin: 12px 0;
          }
          .content strong {
              color: #000;
          }
          .footer {
              background: #f1f3f8;
              text-align: center;
              padding: 20px;
              font-size: 13px;
              color: #555;
              line-height: 1.5;
          }
          .footer a {
              color: #007BFF;
              text-decoration: none;
          }
          @media (max-width: 600px) {
              .container { margin: 20px; }
              .content { padding: 20px; }
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <h1>We’ve Received Your Project Details</h1>
          </div>
          <div class="content">
              <p>Hello ${clientName || "there"},</p>

              <p>Thank you for taking the time to fill out our project questionnaire. We’ve received your responses and our team at <strong>Soft-Web Digital</strong> is already reviewing your details to understand your goals and how best we can bring your idea to life.</p>

              <p>Our project team will reach out shortly to schedule a quick discovery call or send you a detailed proposal tailored to your requirements.</p>

              <p>In the meantime, if you’d like to share any additional documents, references, or examples of similar apps, simply reply to this email. It will go directly to our project desk.</p>

              <p>We’re excited to collaborate with you and build something exceptional!</p>

              <p>Warm regards,<br>
              <strong>The Soft-Web Digital Team</strong></p>
          </div>
          <div class="footer">
              <p>
                <strong>Soft-Web Digital</strong><br>
                <a href="mailto:${email}">${email}</a><br>
                <a href="https://softwebdigital.com">softwebdigital.com</a><br>
                ${phone1} • ${phone2}
              </p>
          </div>
      </div>
  </body>
  </html>
  `;
  }

  private getClientConsultantAssignmentTemplate(client: any, data: any): string {
    return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Consultant Assigned</title>
      <style>
          body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #f8f9fc;
              color: #333;
              margin: 0;
              padding: 0;
          }
          .container {
              max-width: 650px;
              margin: 40px auto;
              background: #ffffff;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.05);
              overflow: hidden;
          }
          .header {
              background-color: #007BFF;
              color: #fff;
              text-align: center;
              padding: 20px;
          }
          .header h1 {
              margin: 0;
              font-size: 22px;
              font-weight: 600;
          }
          .content {
              padding: 30px;
          }
          .content p {
              line-height: 1.7;
              font-size: 15px;
              color: #555;
              margin: 12px 0;
          }
          .content strong {
              color: #000;
          }
          .footer {
              background: #f1f3f8;
              text-align: center;
              padding: 20px;
              font-size: 13px;
              color: #555;
              line-height: 1.5;
          }
          .footer a {
              color: #007BFF;
              text-decoration: none;
          }
          @media (max-width: 600px) {
              .container { margin: 20px; }
              .content { padding: 20px; }
          }
      </style>
  </head>

  <body>
      <div class="container">
          <div class="header">
              <h1>Your Consultant Has Been Assigned</h1>
          </div>

          <div class="content">
              <p>Hello <strong>${client.firstName} ${client.lastName}</strong>,</p>

              <p>
                A consultant has been successfully assigned to your account on 
                <strong>Floatthr</strong>.
              </p>

              <p>Here are the details of your assigned consultant:</p>

              <p><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
              <p><strong>Email:</strong> ${data.email}</p>
              <p><strong>Phone:</strong> +${data.phoneCountryCode}${data.phone}</p>

              ${data.experienceLevel
        ? `<p><strong>Experience Level:</strong> ${data.experienceLevel}</p>`
        : ""
      }

              <p>
                Your consultant will reach out to you soon. You can also view their details by 
                logging into your dashboard at 
                <a href="https://floatthr.com">floatthr.com</a>.
              </p>

              <p>
                If you have any questions, feel free to contact our support team.
              </p>

              <p>Warm regards,<br>
              <strong>The Floatthr Team</strong></p>
          </div>

          <div class="footer">
              <p>
                <strong>Floatthr</strong><br>
                <a href="https://floatthr.com">floatthr.com</a>
              </p>
          </div>
      </div>
  </body>
  </html>
  `;
  }




  // private getConsultantApprovalEmailTemplate(data: any): string {
  //   return `
  // <!DOCTYPE html>
  // <html lang="en">
  // <head>
  //     <meta charset="UTF-8">
  //     <meta name="viewport" content="width=device-width, initial-scale=1.0">
  //     <title>Bid Approval Notification</title>
  //     <style>
  //         body {
  //             font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  //             background-color: #f8f9fc;
  //             color: #333;
  //             margin: 0;
  //             padding: 0;
  //         }
  //         .container {
  //             max-width: 650px;
  //             margin: 40px auto;
  //             background: #ffffff;
  //             border-radius: 12px;
  //             box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  //             overflow: hidden;
  //         }
  //         .header {
  //             background-color: #007BFF;
  //             color: #fff;
  //             text-align: center;
  //             padding: 20px;
  //         }
  //         .header h1 {
  //             margin: 0;
  //             font-size: 22px;
  //             font-weight: 600;
  //         }
  //         .content {
  //             padding: 30px;
  //         }
  //         .content p {
  //             line-height: 1.7;
  //             font-size: 15px;
  //             color: #555;
  //             margin: 12px 0;
  //         }
  //         .content strong {
  //             color: #000;
  //         }
  //         .footer {
  //             background: #f1f3f8;
  //             text-align: center;
  //             padding: 20px;
  //             font-size: 13px;
  //             color: #555;
  //             line-height: 1.5;
  //         }
  //         .footer a {
  //             color: #007BFF;
  //             text-decoration: none;
  //         }
  //         @media (max-width: 600px) {
  //             .container { margin: 20px; }
  //             .content { padding: 20px; }
  //         }
  //     </style>
  // </head>
  // <body>
  //     <div class="container">
  //         <div class="header">
  //             <h1>Your Application Has Been Approved</h1>
  //         </div>
  //         <div class="content">
  //             <p>Hello ${data.consultantName || "Consultant"},</p>

  //             <p>Good news! Your bid for the role listed below has been <strong>approved</strong> by our admin team on <strong>Floatthr</strong>.</p>

  //             <p><strong>Role Title:</strong> ${data.roleTitle}</p>
  //             <p><strong>Client Name:</strong> ${data.clientName}</p>
  //             <p><strong>Client Email:</strong> ${data.clientEmail}</p>
  //             <p><strong>Client Phone:</strong> ${data.clientPhone}</p>
  //             <p><strong>Project Overview:</strong> ${data.projectDescription}</p>
  //             <p><strong>Budget:</strong> ${data.projectBudget}</p>
  //             <p><strong>Due Date:</strong> ${data.projectDueDate}</p>

  //             <p>Please log in to your dashboard on <a href="https://floatthr.com">floatthr.com</a> to review the details and take the next steps.</p>

  //             <p>We’re excited to have you on board for this assignment!</p>

  //             <p>Warm regards,<br>
  //             <strong>The ${data.companyName || "Floatthr"} Team</strong></p>
  //         </div>
  //         <div class="footer">
  //             <p>
  //               <strong>${data.companyName || "Floatthr"}</strong><br>
  //               <a href="mailto:${data.supportEmail}">${data.supportEmail}</a><br>
  //               <a href="https://floatthr.com">floatthr.com</a><br>
  //               ${data.phone1} • ${data.phone2}
  //             </p>
  //         </div>
  //     </div>
  // </body>
  // </html>
  // `;
  // }



  private getJobCreationNotificationTemplate(job: any): string {
    return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Job Created</title>
      <style>
          body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #f8f9fc;
              color: #333;
              margin: 0;
              padding: 0;
          }
          .container {
              max-width: 650px;
              margin: 40px auto;
              background: #ffffff;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.05);
              overflow: hidden;
          }
          .header {
              background-color: #007BFF;
              color: #fff;
              text-align: center;
              padding: 20px;
          }
          .header h1 {
              margin: 0;
              font-size: 22px;
              font-weight: 600;
          }
          .content {
              padding: 25px 30px;
          }
          .qa-item {
              margin-bottom: 12px;
              font-size: 15px;
          }
          .qa-item strong {
              color: #000;
              display: inline-block;
              width: 100%;
              font-weight: 600;
          }
          .qa-item span {
              color: #555;
              display: block;
              margin-top: 2px;
              padding-left: 10px;
          }
          .footer {
              background: #f1f3f8;
              text-align: center;
              padding: 15px;
              font-size: 13px;
              color: #777;
          }
          @media (max-width: 600px) {
              .container { margin: 20px; }
              .content { padding: 20px; }
              .qa-item strong { font-size: 14px; }
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <h1>📝 New Job Submission Received</h1>
          </div>
          <div class="content">
              <div class="qa-item"><strong>Full Name:</strong> <span>${job.firstName || "N/A"} ${job.lastName || "N/A"}</span></div>
              <div class="qa-item"><strong>Phone Number:</strong> <span>${job.phone || "N/A"}</span></div>
              <div class="qa-item"><strong>Email Address:</strong> <span>${job.email || "N/A"}</span></div>
              <div class="qa-item"><strong>Company Name:</strong> <span>${job.businessName || "N/A"}</span></div>
              <div class="qa-item"><strong>What does your company do?</strong> <span>${job.companyDescription || "N/A"}</span></div>
              <div class="qa-item"><strong>How many employees or team members do you have?</strong> <span>${job.employeeSize || "N/A"}</span></div>
              <div class="qa-item"><strong>What makes your company different?</strong> <span>${job.companyDifference || "N/A"}</span></div>
              <div class="qa-item"><strong>What kind of app do you need?</strong> <span>${job.serviceType || "N/A"}</span></div>
              <div class="qa-item"><strong>Deadline for delivery:</strong> <span>${job.deadline || "N/A"}</span></div>
              <div class="qa-item"><strong>Budget:</strong> <span>${job.budget ? `${job.budget}` : "N/A"}</span></div>
              <div class="qa-item"><strong>Business stage:</strong> <span>${job.companyOperationTime || "N/A"}</span></div>
              <div class="qa-item"><strong>How long have you been in operation?</strong> <span>${job.businessStartTime || "N/A"} years</span></div>
              <div class="qa-item"><strong>What features would you like to have in your new application?</strong> <span>${job.featurePreferences || "N/A"}</span></div>
              <div class="qa-item"><strong>Would you like us to handle your application maintenance and updates?</strong> <span>${job.maintenancePreference || "N/A"}</span></div>
              <div class="qa-item"><strong>If yes, what is your monthly maintenance budget?</strong> <span>${job.monthlyMaintenanceBudget || "N/A"}</span></div>
              <div class="qa-item"><strong>Does your company already have a website?</strong> <span>${job.alreadyHaveWebsite || "N/A"}</span></div>
              <div class="qa-item"><strong>If no, would you like us to create one for you?</strong> <span>${job.createWebsite || "N/A"}</span></div>
              <div class="qa-item"><strong>Any additional comments about your new application?</strong> <span>${job.notes || "N/A"}</span></div>

              <p style="margin-top: 25px;">Please log in to the admin panel to review this submission and proceed with the next steps.</p>
              <p>Best regards,<br><strong>The Softweb Team</strong></p>
          </div>
          <div class="footer">
              © ${new Date().getFullYear()} Softweb. All rights reserved.
          </div>
      </div>
  </body>
  </html>
  `;
  }

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

      await this.transport.sendMail({
        from: process.env.EMAIL_FROM || "Pelbliss <no-reply@pelbliss.com>",
        to: email,
        subject: "Password Reset Successful",
        html,
      });

      logger.info("Password reset confirmation email sent", { email });
    } catch (error) {
      logger.error("Failed to send password reset confirmation", {
        email,
        error,
      });
      // Don't throw error for confirmation email failure
    }
  }

  //wedding functions
  // async sendWeddingCreatedEmail(user: IUser, wedding: IWedding): Promise<void> {
  //   try {
  //     const template = this.getWeddingCreatedTemplate(wedding);

  //     await this.transport.sendMail({
  //       from: process.env.EMAIL_FROM || "Pelbliss <no-reply@pelbliss.com>",
  //       to: user.email,
  //       subject: `Wedding Created - ${wedding.brideName} & ${wedding.groomName}`,
  //       html: template,
  //     });

  //     logger.info("Wedding created email sent successfully", {
  //       userId: user._id,
  //       weddingId: wedding._id,
  //     });
  //   } catch (error) {
  //     logger.error("Failed to send wedding created email", {
  //       userId: user._id,
  //       weddingId: wedding._id,
  //       error,
  //     });
  //     throw new Error("Failed to send wedding created email");
  //   }
  // }

  // async sendWeddingUpdatedEmail(user: IUser, wedding: IWedding): Promise<void> {
  //   try {
  //     const template = this.getWeddingUpdatedTemplate(wedding);

  //     await this.transport.sendMail({
  //       from: process.env.EMAIL_FROM || "Pelbliss <no-reply@pelbliss.com>",
  //       to: user.email,
  //       subject: `Wedding Updated - ${wedding.brideName} & ${wedding.groomName}`,
  //       html: template,
  //     });

  //     logger.info("Wedding updated email sent successfully", {
  //       userId: user._id,
  //       weddingId: wedding._id,
  //     });
  //   } catch (error) {
  //     logger.error("Failed to send wedding updated email", {
  //       userId: user._id,
  //       weddingId: wedding._id,
  //       error,
  //     });
  //     throw new Error("Failed to send wedding updated email");
  //   }
  // }

  // async sendVendorNotificationEmail(
  //   vendorEmail: any = {},
  //   type: string,
  //   data: any
  // ): Promise<void> {
  //   try {
  //     let template = "";
  //     let subject = "";

  //     switch (type) {
  //       case "new_review":
  //         template = this.getNewReviewTemplate(data);
  //         subject = "New Review Received";
  //         break;
  //       case "booking_request":
  //         template = this.getBookingRequestTemplate(data);
  //         subject = "New Booking Request";
  //         break;
  //       case "listing_approved":
  //         template = this.getListingApprovedTemplate(data);
  //         subject = "Your Listing Has Been Approved";
  //         break;
  //       default:
  //         logger.warn("Unknown vendor notification type", { type });
  //         return;
  //     }

  //     await this.transport.sendMail({
  //       from: process.env.EMAIL_FROM || "Pelbliss <no-reply@pelbliss.com>",
  //       to: vendorEmail,
  //       subject,
  //       html: template,
  //     });

  //     logger.info("Vendor notification sent successfully", {
  //       vendorId: vendorEmail,
  //       type,
  //     });
  //   } catch (error) {
  //     logger.error("Failed to send vendor notification", {
  //       vendorId: vendorEmail,
  //       type,
  //       error,
  //     });
  //     throw new Error("Failed to send vendor notification");
  //   }
  // }

  async sendBulkEmail(
    recipients: string[],
    subject: string,
    template: string
  ): Promise<{
    sent: number;
    failed: number;
    errors: string[];
  }> {
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const email of recipients) {
      try {
        await this.transport.sendMail({
          from: `Floatthr <${process.env.MAILGUN_SENDER}>` || "Pelbliss <no-reply@pelbliss.com>",//process.env.EMAIL_FROM || "Pelbliss <no-reply@pelbliss.com>",
          to: email.trim(),
          subject,
          html: template,
        });
        sent++;
      } catch (error: any) {
        failed++;
        errors.push(`${email}: ${error.message}`);
      }
    }

    logger.info("Bulk email completed", {
      sent,
      failed,
      total: recipients.length,
    });
    return { sent, failed, errors };
  }



  //payment
  //   async sendSubscriptionConfirmationEmail(
  //     vendor: IVendor,
  //     plan: any,
  //     subscription: any
  //   ) {
  //     try {
  //       const subject = `Subscription Confirmed - Welcome to ${plan.name} Plan!`;

  //       const html = this.getSubscriptionConfirmationEmailTemplate(
  //         vendor,
  //         plan,
  //         subscription
  //       );

  //       await this.transport.sendMail({
  //         from: process.env.EMAIL_FROM || "Pelbliss <no-reply@pelbliss.com>",
  //         to: vendor.email,
  //         subject,
  //         html,
  //       });

  //       logger.info("Subscription confirmation email sent successfully", {
  //         vendorEmail: vendor.email,
  //         planName: plan.name,
  //       });
  //       return;
  //     } catch (error: any) {
  //       logger.error("Failed to send subscription confirmation email", {
  //         vendorEmail: vendor.email,
  //         error: error.message,
  //       });
  //       throw new Error("Failed to send subscription confirmation email");
  //     }
  //   }

  //   async sendSubscriptionCancellationEmail(vendor: IVendor, subscription: any) {
  //     try {
  //       const subject = `Subscription Cancelled - We're Sorry to See You Go`;

  //       const html = this.getSubscriptionCancellationEmailTemplate(
  //         vendor,
  //         subscription
  //       );

  //       await this.transport.sendMail({
  //         from: process.env.EMAIL_FROM || "Pelbliss <no-reply@pelbliss.com>",
  //         to: vendor.email,
  //         subject,
  //         html,
  //       });

  //       logger.info("Subscription cancellation email sent successfully", {
  //         vendorEmail: vendor.email,
  //         subscriptionId: subscription.id,
  //       });
  //       return;
  //     } catch (error: any) {
  //       logger.error("Failed to send subscription cancellation email", {
  //         vendorEmail: vendor.email,
  //         error: error.message,
  //       });
  //       throw new Error("Failed to send subscription cancellation email");
  //     }
  //   }

  //   async sendExpirationWarningEmail(
  //     vendor: IVendor,
  //     subscription: any,
  //     daysRemaining: number
  //   ) {
  //     try {
  //       const subject = `Subscription Expiring Soon - ${daysRemaining} Days Remaining`;

  //       const html = this.getExpirationWarningEmailTemplate(
  //         vendor,
  //         subscription,
  //         daysRemaining
  //       );

  //       await this.transport.sendMail({
  //         from: process.env.EMAIL_FROM || "Pelbliss <no-reply@pelbliss.com>",
  //         to: vendor.email,
  //         subject,
  //         html,
  //       });

  //       logger.info("Expiration warning email sent successfully", {
  //         vendorEmail: vendor.email,
  //         daysRemaining,
  //       });
  //       return;
  //     } catch (error: any) {
  //       logger.error("Failed to send expiration warning email", {
  //         vendorEmail: vendor.email,
  //         error: error.message,
  //       });
  //       throw new Error("Failed to send expiration warning email");
  //     }
  //   }

  //   async sendSubscriptionExpiredEmail(vendor: IVendor, subscription: any) {
  //     try {
  //       const subject = `Subscription Expired - Renew to Continue Your Benefits`;

  //       const html = this.getSubscriptionExpiredEmailTemplate(
  //         vendor,
  //         subscription
  //       );

  //       await this.transport.sendMail({
  //         from: process.env.EMAIL_FROM || "Pelbliss <no-reply@pelbliss.com>",
  //         to: vendor.email,
  //         subject,
  //         html,
  //       });

  //       logger.info("Subscription expired email sent successfully", {
  //         vendorEmail: vendor.email,
  //         subscriptionId: subscription.id,
  //       });
  //       return;
  //     } catch (error: any) {
  //       logger.error("Failed to send subscription expired email", {
  //         vendorEmail: vendor.email,
  //         error: error.message,
  //       });
  //       throw new Error("Failed to send subscription expired email");
  //     }
  //   }

  // async sendAdminReportNotification(listing: BusinessInfo, review: IReview) {
  //   try {
  //     const subject = `New Review Reported - Action Required`;

  //     const html = this.sendAdminReportNotificationTemplate(listing, review);

  //     await this.transport.sendMail({
  //       from: process.env.EMAIL_FROM || "Pelbliss <no-reply@pelbliss.com>",
  //       to: process.env.ADMIN_EMAIL || "thepelbliss@gmail.com",
  //       subject,
  //       html,
  //     });

  //     logger.info("Review Reported", {
  //       vendorEmail: listing.businessEmail,
  //       businessName: listing.businessName,
  //     });
  //     return;
  //   } catch (error: any) {
  //     logger.error("Failed to send subscription expired email", {
  //       vendorEmail: listing.businessEmail,
  //       error: error.message,
  //     });
  //     throw new Error("Failed to send subscription expired email");
  //   }
  // }

  //quotes
  // async sendQuoteToVendor(
  //   quote: IQuote,
  //   vendorEmail: string,
  //   businessName: string,
  //   serviceName?: string
  // ) {
  //   try {
  //     const subject = `New Quote Request: ${quote.quoteDetails.subject}`;

  //     const html = this.getQuoteEmailTemplate(quote, businessName, serviceName);

  //     await this.transport.sendMail({
  //       from: process.env.EMAIL_FROM || "Pelbliss <no-reply@pelbliss.com>",
  //       to: vendorEmail,
  //       subject,
  //       html,
  //     });

  //     logger.info("Quote email sent successfully", {
  //       quoteId: quote._id,
  //       vendorEmail,
  //       customerEmail: quote.customerInfo.email,
  //     });

  //     return true;
  //   } catch (error: any) {
  //     logger.error("Failed to send quote email", {
  //       quoteId: quote._id,
  //       vendorEmail,
  //       error: error.message,
  //     });
  //     throw new Error("Failed to send quote email");
  //   }
  // }

  //admin emails services
  async sendAccountStatusNotification(
    email: string,
    status:
      | "active"
      | "pending_verification"
      | "suspended"
      | "deactivated"
      | "incomplete_profile"
      | "deleted",
    reason?: string
  ) {
    try {
      const subject = this.getAccountStatusSubject(status);
      const html = this.getAccountStatusTemplate(status, reason);

      //this.sendAccountUnsuspendedEmail

      await this.transport.sendMail({
        from: process.env.EMAIL_FROM || "Pelbliss <no-reply@pelbliss.com>",
        to: email,
        subject,
        html,
      });

      logger.info(`Account ${status} notification sent successfully`, {
        email,
      });
    } catch (error) {
      logger.error(`Failed to send account ${status} notification`, {
        email,
        error,
      });
      throw new Error(`Failed to send ${status} notification`);
    }
  }

  async sendAccountVerifiedNotification(email: string) {
    return this.sendAccountStatusNotification(email, "active");
  }
  async sendAccountUnsuspendedNotification(
    email: string,
    reason?: string,
    duration?: number
  ) {
    try {
      const subject = "Account unSuspended - Floatthr";
      const html = this.getAccountUnSuspendedTemplate(reason);
      await this.transport.sendMail({
        from: process.env.MAILGUN_SENDER || "softweb <no-reply@softweb.com>",
        to: email,
        subject: "Account Suspension - Notification",
        html,
      });

      // await this.transport.sendMail({
      //   from: process.env.EMAIL_FROM || "Pelbliss <no-reply@pelbliss.com>",
      //   to: email,
      //   subject,
      //   html,
      // });

      logger.info("Account suspended notification sent successfully", {
        email,
      });
    } catch (error) {
      logger.error("Failed to send account suspended notification", {
        email,
        error,
      });
      throw new Error("Failed to send suspension notification");
    }
  }

  async sendAccountSuspendedNotification(
    email: string,
    reason?: string,
    duration?: number
  ) {
    try {
      const subject = "Account Suspended - Floatthr";
      const html = this.getAccountSuspendedTemplate(reason, duration);
      await this.transport.sendMail({
        from: process.env.MAILGUN_SENDER || "softweb <no-reply@softweb.com>",
        to: email,
        subject: "Account Suspension - Notification",
        html,
      });

      // await this.transport.sendMail({
      //   from: process.env.EMAIL_FROM || "Pelbliss <no-reply@pelbliss.com>",
      //   to: email,
      //   subject,
      //   html,
      // });

      logger.info("Account suspended notification sent successfully", {
        email,
      });
    } catch (error) {
      logger.error("Failed to send account suspended notification", {
        email,
        error,
      });
      throw new Error("Failed to send suspension notification");
    }
  }

  async sendAccountReactivatedNotification(email: string, reason?: string) {
    return this.sendAccountStatusNotification(email, "active", reason);
  }

  async sendSubscriptionUpdateNotification(
    email: string,
    subscriptionPlan: string
  ) {
    try {
      const subject = "Subscription Plan Updated - Pelbliss";
      const html = this.getSubscriptionUpdateTemplate(subscriptionPlan);

      await this.transport.sendMail({
        from: process.env.EMAIL_FROM || "Pelbliss <no-reply@pelbliss.com>",
        to: email,
        subject,
        html,
      });

      logger.info("Subscription update notification sent successfully", {
        email,
        subscriptionPlan,
      });
    } catch (error) {
      logger.error("Failed to send subscription update notification", {
        email,
        error,
      });
      throw new Error("Failed to send subscription update notification");
    }
  }

  async sendPasswordResetByAdmin(email: string, password: string) {
    try {
      const subject = "Password Reset by Administrator - Pelbliss";
      const html = this.getPasswordResetByAdminTemplate(password);

      await this.transport.sendMail({
        from: process.env.EMAIL_FROM || "Pelbliss <no-reply@pelbliss.com>",
        to: email,
        subject,
        html,
      });

      logger.info("Password reset by admin notification sent successfully", {
        email,
      });
    } catch (error) {
      logger.error("Failed to send password reset by admin notification", {
        email,
        error,
      });
      throw new Error("Failed to send password reset notification");
    }
  }

  //announcement
  async sendAnnouncement(
    email: string,
    fullName: string,
    title: string,
    message: string
  ) {
    try {
      const subject = title;

      const html = this.getAnnouncementEmailTemplate(fullName, title, message);

      await this.transport.sendMail({
        from: process.env.EMAIL_FROM || "Pelbliss <no-reply@pelbliss.com>",
        to: email,
        subject,
        html,
      });

      logger.info("Announcement email sent successfully", {
        email: email.replace(/(.{2})(.*)(.{2})/, "$1***$3"),
        title,
      });
      return;
    } catch (error) {
      logger.error("Failed to send announcement email", {
        email: email.replace(/(.{2})(.*)(.{2})/, "$1***$3"),
        title,
      });
      throw new Error("Failed to send announcement email");
    }
  }

  private getSendFormEmailTemplate(
    fullName: string,
    email: string,
    phoneNumber: string,
    message: string
  ): string {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Contact Form Submission - Pelbliss</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
          <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #a65f00;">
            <h1 style="color: #333; margin: 0;">New Contact Form Submission</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Pelbliss</p>
          </div>
          
          <div style="padding: 30px 20px;">
            <h2 style="color: #333; margin-bottom: 20px;">Contact Details</h2>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                    <strong style="color: #495057; display: inline-block; width: 120px;">Full Name:</strong>
                    <span style="color: #212529;">${fullName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                    <strong style="color: #495057; display: inline-block; width: 120px;">Email:</strong>
                    <a href="mailto:${email}" style="color: #a65f00; text-decoration: none;">${email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <strong style="color: #495057; display: inline-block; width: 120px;">Phone:</strong>
                    <a href="tel:${phoneNumber}" style="color: #a65f00; text-decoration: none;">${phoneNumber}</a>
                  </td>
                </tr>
              </table>
            </div>
            
            <h3 style="color: #333; margin-bottom: 15px;">Message</h3>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #a65f00;">
              <p style="color: #495057; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message}</p>
            </div>
            
            <div style="margin-top: 30px; padding: 20px; background-color: #e7f3ff; border-radius: 8px; text-align: center;">
              <p style="color: #0056b3; margin: 0; font-size: 14px;">
                <strong>Quick Actions:</strong>
              </p>
              <div style="margin-top: 15px;">
                <a href="mailto:${email}" style="background-color: #a65f00; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 0 5px; font-size: 14px;">
                  Reply via Email
                </a>
                <a href="tel:${phoneNumber}" style="background-color: #e60076; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 0 5px; font-size: 14px;">
                  Call Now
                </a>
              </div>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px 0; color: #888; font-size: 12px; border-top: 1px solid #e9ecef;">
            <p style="margin: 0;">This message was sent from the Pelbliss contact form</p>
            <p style="margin: 5px 0 0 0;">© 2024 Pelbliss. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
  }

  private getOTPEmailTemplate(
    otp: string,
    type: "registration" | "password_reset" | "2fa"
  ): string {
    const getTemplateContent = (type: string) => {
      switch (type) {
        case "registration":
          return {
            title: "Verify Your Account",
            message:
              "Thank you for registering with Help Me Nigeria. Please use the OTP below to verify your account.",
          };
        case "password_reset":
          return {
            title: "Reset Your Password",
            message:
              "You have requested to reset your password. Please use the OTP below to proceed.",
          };
        case "2fa":
          return {
            title: "Two-Factor Authentication",
            message:
              "Please use the OTP below to complete your two-factor authentication and secure your account.",
          };
        default:
          return {
            title: "Verification Required",
            message: "Please use the OTP below to proceed with verification.",
          };
      }
    };

    const { title, message } = getTemplateContent(type);

    return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #e8f5e9; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
        
        <!-- Header -->
        <div style="text-align: center; padding: 20px 0;">
          <h1 style="color: #2e7d32; margin: 0;">Help Me Nigeria</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 20px; background-color: #f1f8f4; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #2e7d32; margin-top: 0;">${title}</h2>
          <p style="color: #555; line-height: 1.6;">${message}</p>
          
          <!-- OTP Box -->
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #2e7d32; color: white; padding: 15px 30px; border-radius: 4px; font-size: 24px; font-weight: bold; letter-spacing: 3px; display: inline-block;">
              ${otp}
            </div>
          </div>
          
          <p style="color: #555; font-size: 14px;">
            This OTP will expire in 10 minutes. If you didn't request this, please ignore this email.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 20px 0; color: #888; font-size: 12px;">
          <p>© 2026 Help Me Nigeria. All rights reserved.</p>
        </div>
      </div>
    </body>
  </html>
`;
  }
  //   private getOTPEmailTemplate(
  //     otp: string,
  //     type: "registration" | "password_reset" | "2fa"
  //   ): string {
  //     const getTemplateContent = (type: string) => {
  //       switch (type) {
  //         case "registration":
  //           return {
  //             title: "Verify Your Account",
  //             message:
  //               "Thank you for registering with Floathr. Please use the OTP below to verify your account.",
  //           };
  //         case "password_reset":
  //           return {
  //             title: "Reset Your Password",
  //             message:
  //               "You have requested to reset your password. Please use the OTP below to proceed.",
  //           };
  //         case "2fa":
  //           return {
  //             title: "Two-Factor Authentication",
  //             message:
  //               "Please use the OTP below to complete your two-factor authentication and secure your account.",
  //           };
  //         default:
  //           return {
  //             title: "Verification Required",
  //             message: "Please use the OTP below to proceed with verification.",
  //           };
  //       }
  //     };

  //     const { title, message } = getTemplateContent(type);

  //     return `
  //   <!DOCTYPE html>
  //   <html>
  //     <head>
  //       <meta charset="utf-8">
  //       <meta name="viewport" content="width=device-width, initial-scale=1.0">
  //       <title>${title}</title>
  //     </head>
  //     <body style="margin: 0; padding: 0; background-color: #e6f0fa; font-family: Arial, sans-serif;">
  //       <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
  //         <div style="text-align: center; padding: 20px 0;">
  //           <h1 style="color: #1a73e8; margin: 0;">Floathr</h1>
  //         </div>

  //         <div style="padding: 20px; background-color: #f0f6ff; border-radius: 8px; margin: 20px 0;">
  //           <h2 style="color: #1a73e8; margin-top: 0;">${title}</h2>
  //           <p style="color: #555; line-height: 1.6;">${message}</p>

  //           <div style="text-align: center; margin: 30px 0;">
  //             <div style="background-color: #1a73e8; color: white; padding: 15px 30px; border-radius: 4px; font-size: 24px; font-weight: bold; letter-spacing: 3px; display: inline-block;">
  //               ${otp}
  //             </div>
  //           </div>

  //           <p style="color: #555; font-size: 14px;">
  //             This OTP will expire in 10 minutes. If you didn't request this, please ignore this email.
  //           </p>
  //         </div>

  //         <div style="text-align: center; padding: 20px 0; color: #888; font-size: 12px;">
  //           <p>© 2024 Floathr. All rights reserved.</p>
  //         </div>
  //       </div>
  //     </body>
  //   </html>
  // `;
  //   }


  // private getOTPEmailTemplate(
  //   otp: string,
  //   type: "registration" | "password_reset" | "2fa"
  // ): string {
  //   const getTemplateContent = (type: string) => {
  //     switch (type) {
  //       case "registration":
  //         return {
  //           title: "Verify Your Account",
  //           message:
  //             "Thank you for registering with Pelbliss. Please use the OTP below to verify your account.",
  //         };
  //       case "password_reset":
  //         return {
  //           title: "Reset Your Password",
  //           message:
  //             "You have requested to reset your password. Please use the OTP below to proceed.",
  //         };
  //       case "2fa":
  //         return {
  //           title: "Two-Factor Authentication",
  //           message:
  //             "Please use the OTP below to complete your two-factor authentication and secure your account.",
  //         };
  //       default:
  //         return {
  //           title: "Verification Required",
  //           message: "Please use the OTP below to proceed with verification.",
  //         };
  //     }
  //   };

  //   const { title, message } = getTemplateContent(type);

  //   return `
  //   <!DOCTYPE html>
  //   <html>
  //     <head>
  //       <meta charset="utf-8">
  //       <meta name="viewport" content="width=device-width, initial-scale=1.0">
  //       <title>${title}</title>
  //     </head>
  //     <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
  //       <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
  //         <div style="text-align: center; padding: 20px 0;">
  //           <h1 style="color: #333; margin: 0;">Pelbliss</h1>
  //         </div>

  //         <div style="padding: 20px; background-color: #f9f9f9; border-radius: 8px; margin: 20px 0;">
  //           <h2 style="color: #333; margin-top: 0;">${title}</h2>
  //           <p style="color: #666; line-height: 1.6;">${message}</p>

  //           <div style="text-align: center; margin: 30px 0;">
  //             <div style="background-color: #a65f00; color: white; padding: 15px 30px; border-radius: 4px; font-size: 24px; font-weight: bold; letter-spacing: 3px; display: inline-block;">
  //               ${otp}
  //             </div>
  //           </div>

  //           <p style="color: #666; font-size: 14px;">
  //             This OTP will expire in 10 minutes. If you didn't request this, please ignore this email.
  //           </p>
  //         </div>

  //         <div style="text-align: center; padding: 20px 0; color: #888; font-size: 12px;">
  //           <p>© 2024 Pelbliss. All rights reserved.</p>
  //         </div>
  //       </div>
  //     </body>
  //   </html>
  // `;
  // }

  private getJobStatusUpdateNotificationTemplate(job: any, status: string): string {
    const statusColors: Record<string, string> = {
      pending: "#ffc107",
      in_progress: "#007bff",
      completed: "#28a745",
      cancelled: "#dc3545",
    };

    const statusColor = statusColors[status.toLowerCase()] || "#007bff";
    const formattedStatus = status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Job Status Update</title>
      <style>
          body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #f8f9fc;
              color: #333;
              margin: 0;
              padding: 0;
          }
          .container {
              max-width: 600px;
              margin: 40px auto;
              background: #ffffff;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.05);
              overflow: hidden;
          }
          .header {
              background-color: ${statusColor};
              color: #fff;
              text-align: center;
              padding: 20px;
          }
          .header h1 {
              margin: 0;
              font-size: 22px;
          }
          .content {
              padding: 30px;
          }
          .content p {
              line-height: 1.6;
              font-size: 15px;
              color: #555;
          }
          .status-box {
              background: #f4f6fb;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
              text-align: center;
          }
          .status-label {
              display: inline-block;
              padding: 8px 16px;
              border-radius: 20px;
              background-color: ${statusColor};
              color: #fff;
              font-weight: bold;
              font-size: 14px;
              letter-spacing: 0.5px;
              text-transform: uppercase;
          }
          .footer {
              background: #f1f3f8;
              text-align: center;
              padding: 15px;
              font-size: 13px;
              color: #777;
          }
          @media (max-width: 600px) {
              .container { margin: 20px; }
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <h1>📢 Job Status Update</h1>
          </div>
          <div class="content">
              <p>Hi ${job.clientName || "there"},</p>
              <p>We wanted to let you know that the status of your job has been updated to: ${status}:</p>

              <div class="status-box">
                  <span class="status-label">${formattedStatus}</span>
              </div>

              <p><strong>Job Title:</strong> ${job.title || "N/A"}</p>
              <p><strong>Description:</strong> ${job.description || "No description provided."}</p>

              <p style="margin-top:20px;">
                  You can log in to your account to view more details or contact our team if you have any questions.
              </p>

              <p>Thank you for working with <strong>Softweb</strong>!<br>We’re committed to keeping you updated every step of the way.</p>

              <p>Best regards,<br><strong>The Softweb Team</strong></p>
          </div>
          <div class="footer">
              © ${new Date().getFullYear()} Softweb. All rights reserved.
          </div>
      </div>
  </body>
  </html>
  `;
  }


  private getVendorWelcomeEmailTemplate(firstName: string): string {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to the Pelbliss experience!</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #333; margin: 0;">Welcome to the Pelbliss experience!</h1>
          </div>
          
          <div style="padding: 20px;">
            <h2 style="color: #333;">Hi ${firstName},</h2>
            <p style="color: #666; line-height: 1.6;">
              We're excited to have you on board! You're now part of our trusted wedding ecosystem where couples come to find, book, and connect with credible service providers like you.
            </p>
            
            <p style="color: #666; line-height: 1.6;">
              By joining us, you've taken a step towards growing your visibility and reaching more clients who are actively planning their big day.
            </p>
            
            <h3 style="color: #333; margin-top: 30px;">Here's what you can do next:</h3>
            
            <ul style="color: #666; line-height: 1.6; margin-bottom: 30px;">
              <li><strong>Complete your profile:</strong> Add good quality photos, descriptions, and services that showcase your best work.</li>
              <li><strong>Stay responsive:</strong> Couples love vendors who reply quickly — it increases your chances of booking.</li>
              <li><strong>Build trust:</strong> Well detailed profiles stand out. Ensure your details and media are updated.</li>
            </ul>
            
            <p style="color: #666; line-height: 1.6;">
              We're here to support your business growth every step of the way.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL}/auth/signin" style="background-color: #a65f00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Login to Your Dashboard
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; text-align: center; margin-top: 30px;">
              Welcome aboard,<br>
              <strong>The Pelbliss Team</strong>
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px 0; color: #888; font-size: 12px;">
            <p>© 2024 Pelbliss. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
  }

  private getUserWelcomeEmailTemplate(firstName: string): string {
    return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Pelbliss – Start Planning Your Big Day Today!</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
        <div style="text-align: center; padding: 20px 0;">
          <h1 style="color: #333; margin: 0;">Welcome to Pelbliss – Start Planning Your Big Day Today!</h1>
        </div>
        
        <div style="padding: 20px;">
          <h2 style="color: #333;">Hi ${firstName},</h2>
          <p style="color: #666; line-height: 1.6;">
            Congratulations on your upcoming wedding! You've just joined Pelbliss, Nigeria's trusted platform to discover, compare, and connect with verified wedding vendors who will bring your dream celebration to life.
          </p>
          
          <h3 style="color: #333; margin-top: 30px;">With Pelbliss, you can:</h3>
          
          <ul style="color: #666; line-height: 1.6; margin-bottom: 30px;">
            <li><strong>Browse & bookmark vendors you love</strong> for easy access later.</li>
            <li><strong>Create your guest list</strong> and keep everything organized in one place.</li>
            <li><strong>Share your digital wedding invitation</strong> with family and friends in seconds.</li>
            <li><strong>Plan stress-free</strong> knowing all your tools and vendors are just a click away.</li>
          </ul>
          
          <p style="color: #666; line-height: 1.6;">
            We're here to make your wedding journey easier, more exciting, and truly magical.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/auth/signin" style="background-color: #a65f00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Start Planning Your Wedding
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; text-align: center; margin-top: 30px;">
            Wishing you love and joy on this journey,<br>
            <strong>The Pelbliss Team</strong>
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px 0; color: #888; font-size: 12px;">
          <p>© 2024 Pelbliss. All rights reserved.</p>
        </div>
      </div>
    </body>
  </html>
`;
  }

  private getAdminWelcomeEmailTemplate(
    firstName: string,
    adminLevel: string,
    password: string
  ): string {
    const adminLevelDisplay = adminLevel
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());

    return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Soft-Web Digital Admin Team!</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5faff; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); padding: 20px;">
        
        <div style="text-align: center; padding: 25px 0; background-color: #007BFF; border-radius: 8px 8px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Welcome to the Admin Team!</h1>
        </div>
        
        <div style="padding: 25px;">
          <h2 style="color: #007BFF;">Hello ${firstName},</h2>
          <p style="color: #555; line-height: 1.6;">
            Welcome to the <strong>Floatthr</strong> administration team! Your admin account has been successfully created and activated.
            You now have access to the admin dashboard as a <strong>${adminLevelDisplay}</strong>.
          </p>

          <div style="background-color: #f0f6ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="color: #333; font-size: 14px; margin: 0;">
              <strong>Access Password:</strong> ${password}
            </p>
          </div>

          <h3 style="color: #007BFF; margin-top: 25px;">Your Admin Responsibilities:</h3>
          <ul style="color: #555; line-height: 1.7; margin-bottom: 25px;">
            <li><strong>Platform Management:</strong> Help maintain the quality and performance of the Floatthr platform.</li>
            <li><strong>User Support:</strong> Assist with client and user inquiries when needed.</li>
            <li><strong>Quality Control:</strong> Oversee and review platform activities for accuracy and integrity.</li>
            <li><strong>Team Collaboration:</strong> Work closely with fellow admins to ensure smooth workflow and coordination.</li>
          </ul>

          <p style="color: #555; line-height: 1.6;">
            Your role comes with specific permissions and access levels. If you have any questions about your responsibilities or require assistance, please contact your team lead or system administrator.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/admin/dashboard" 
               style="background-color: #007BFF; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
              Access Admin Dashboard
            </a>
          </div>

          <p style="color: #555; line-height: 1.6; text-align: center; margin-top: 30px;">
            We’re thrilled to have you onboard!<br>
            <strong>The Soft-Web Digital Team</strong>
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px 0; color: #888; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Soft-Web Digital. All rights reserved.</p>
        </div>
      </div>
    </body>
  </html>
  `;
  }


  // private getAdminWelcomeEmailTemplate(
  //   firstName: string,
  //   adminLevel: string,
  //   password: string
  // ): string {
  //   const adminLevelDisplay = adminLevel
  //     .replace(/_/g, " ")
  //     .replace(/\b\w/g, (l) => l.toUpperCase());

  //   return `
  //   <!DOCTYPE html>
  //   <html>
  //     <head>
  //       <meta charset="utf-8">
  //       <meta name="viewport" content="width=device-width, initial-scale=1.0">
  //       <title>Welcome to Pelbliss Admin Team!</title>
  //     </head>
  //     <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
  //       <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
  //         <div style="text-align: center; padding: 20px 0;">
  //           <h1 style="color: #a65f00; margin: 0;">Welcome to the Admin Team!</h1>
  //         </div>

  //         <div style="padding: 20px;">
  //           <h2 style="color: #333;">Hello ${firstName},</h2>
  //           <p style="color: #666; line-height: 1.6;">
  //             Welcome to the Pelbliss administration team! Your account has been successfully activated and you now have access to the admin dashboard as a <strong>${adminLevelDisplay}</strong>.

  //             <br></br>

  //             <p>Your Access Password is: ${password}</p>
  //           </p>



  //           <h3 style="color: #333; margin-top: 30px;">Your Admin Responsibilities:</h3>

  //           <ul style="color: #666; line-height: 1.6; margin-bottom: 30px;">
  //             <li><strong>Platform Management:</strong> Help maintain the quality and integrity of the Pelbliss platform.</li>
  //             <li><strong>User Support:</strong> Assist with user inquiries and resolve platform issues.</li>
  //             <li><strong>Quality Control:</strong> Monitor and review platform content and user activities.</li>
  //             <li><strong>Team Collaboration:</strong> Work with other admins to ensure smooth operations.</li>
  //           </ul>

  //           <p style="color: #666; line-height: 1.6;">
  //             Your role comes with specific permissions and access levels. If you have any questions about your responsibilities or need assistance, don't hesitate to reach out to your team lead.
  //           </p>

  //           <div style="text-align: center; margin: 30px 0;">
  //             <a href="${process.env.CLIENT_URL}/admin/dashboard" style="background-color: #a65f00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
  //               Access Admin Dashboard
  //             </a>
  //           </div>

  //           <p style="color: #666; line-height: 1.6; text-align: center; margin-top: 30px;">
  //             Thank you for joining our team!<br>
  //             <strong>The Pelbliss Admin Team</strong>
  //           </p>
  //         </div>

  //         <div style="text-align: center; padding: 20px 0; color: #888; font-size: 12px;">
  //           <p>© 2024 Pelbliss. All rights reserved.</p>
  //         </div>
  //       </div>
  //     </body>
  //   </html>
  //   `;
  // }

  private getPasswordResetConfirmationTemplate(
    firstName: string,
    password: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset Successful</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
            <div style="text-align: center; padding: 20px 0;">
              <h1 style="color: #333; margin: 0;">Password Reset Successful</h1>
            </div>
            
            <div style="padding: 20px;">
              <h2 style="color: #333;">Hello ${firstName}!</h2>
              <p style="color: #666; line-height: 1.6;">
                Your password has been successfully reset. You can now log in to your account using your new password. <strong>${password}</strong>
              </p>
              
              <p style="color: #666; line-height: 1.6;">
                If you didn't request this password reset, please contact our support team immediately.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.CLIENT_URL}/login" style="background-color: #a65f00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                  Login to Your Account
                </a>
              </div>
            </div>
            
            <div style="text-align: center; padding: 20px 0; color: #888; font-size: 12px;">
              <p>© 2024 Pelbliss. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  // private getWeddingCreatedTemplate(wedding: IWedding): string {
  //   return `
  //     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  //       <h1 style="color: #8B5A83;">Congratulations on Your Wedding!</h1>
  //       <p>Your wedding for <strong>${wedding.brideName} & ${wedding.groomName
  //     }</strong> has been created successfully.</p>
  //       <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
  //         <h3>Wedding Details:</h3>
  //         <p><strong>Date:</strong> ${new Date(
  //       wedding.eventDate
  //     ).toLocaleDateString()}</p>
  //         <p><strong>Time:</strong> ${wedding.eventTime}</p>
  //         <p><strong>Location:</strong> ${wedding.location.address}, ${wedding.location.city
  //     }, ${wedding.location.state}</p>
  //       </div>
  //       <p>Start planning your perfect day with our comprehensive wedding management tools!</p>
  //       <a href="${process.env.FRONTEND_URL}/weddings/${wedding._id
  //     }" style="background: #8B5A83; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">View Your Wedding</a>
  //     </div>
  //   `;
  // }

  // private getWeddingUpdatedTemplate(wedding: IWedding): string {
  //   return `
  //     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  //       <h1 style="color: #8B5A83;">Wedding Details Updated</h1>
  //       <p>Your wedding details for <strong>${wedding.brideName} & ${wedding.groomName}</strong> have been updated.</p>
  //       <a href="${process.env.FRONTEND_URL}/weddings/${wedding._id}" style="background: #8B5A83; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">View Updated Details</a>
  //     </div>
  //   `;
  // }

  // private getNewReviewTemplate(data: any): string {
  //   return `
  //     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  //       <h1 style="color: #8B5A83;">New Review Received</h1>
  //       <p>You have received a new ${data.rating}-star review!</p>
  //       <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
  //         <p>${data.content}</p>
  //       </div>
  //       <a href="${process.env.FRONTEND_URL}/dashboard" style="background: #8B5A83; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">View All Reviews</a>
  //     </div>
  //   `;
  // }

  private getBookingRequestTemplate(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #8B5A83;">New Booking Request</h1>
        <p>You have received a new booking request for <strong>${data.listingTitle}</strong></p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Client:</strong> ${data.clientName}</p>
          <p><strong>Event Date:</strong> ${data.eventDate}</p>
          <p><strong>Message:</strong> ${data.message}</p>
        </div>
        <a href="${process.env.FRONTEND_URL}/vendor/bookings" style="background: #8B5A83; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">View Booking Requests</a>
      </div>
    `;
  }

  private getListingApprovedTemplate(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #8B5A83;">Listing Approved!</h1>
        <p>Congratulations! Your listing <strong>${data.title}</strong> has been approved and is now live on our platform.</p>
        <a href="${process.env.FRONTEND_URL}/listings/${data.id}" style="background: #8B5A83; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">View Your Listing</a>
      </div>
    `;
  }

  // private getQuoteEmailTemplate(
  //   quote: IQuote,
  //   businessName: string,
  //   serviceName?: string
  // ): string {
  //   const formatCurrency = (amount: number, currency = "NGN") => {
  //     const symbol =
  //       currency === "NGN" ? "₦" : currency === "USD" ? "$" : currency;
  //     return `${symbol}${amount.toLocaleString()}`;
  //   };

  //   const formatDate = (date: Date) => {
  //     return new Date(date).toLocaleDateString("en-GB", {
  //       weekday: "long",
  //       year: "numeric",
  //       month: "long",
  //       day: "numeric",
  //     });
  //   };

  //   const budgetDisplay = quote.quoteDetails.budget
  //     ? quote.quoteDetails.budget.min && quote.quoteDetails.budget.max
  //       ? `${formatCurrency(
  //         quote.quoteDetails.budget.min,
  //         quote.quoteDetails.budget.currency
  //       )} - ${formatCurrency(
  //         quote.quoteDetails.budget.max,
  //         quote.quoteDetails.budget.currency
  //       )}`
  //       : quote.quoteDetails.budget.min
  //         ? `From ${formatCurrency(
  //           quote.quoteDetails.budget.min,
  //           quote.quoteDetails.budget.currency
  //         )}`
  //         : `Up to ${formatCurrency(
  //           quote.quoteDetails.budget.max!,
  //           quote.quoteDetails.budget.currency
  //         )}`
  //     : "Not specified";

  //   return `
  //   <!DOCTYPE html>
  //   <html>
  //     <head>
  //       <meta charset="utf-8">
  //       <meta name="viewport" content="width=device-width, initial-scale=1.0">
  //       <title>New Quote Request</title>
  //     </head>
  //     <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
  //       <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
  //         <!-- Header -->
  //         <div style="text-align: center; padding: 20px 0; background-color: #a65f00; color: white;">
  //           <h1 style="margin: 0; font-size: 24px;">Pelbliss</h1>
  //           <p style="margin: 5px 0 0 0; font-size: 16px;">New Quote Request</p>
  //         </div>

  //         <!-- Main Content -->
  //         <div style="padding: 30px;">
  //           <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
  //             <h2 style="color: #333; margin-top: 0; font-size: 20px;">Hello ${businessName}!</h2>
  //             <p style="color: #666; line-height: 1.6; margin-bottom: 0;">
  //               You have received a new quote request for your ${serviceName
  //       ? `service: <strong>${serviceName}</strong>`
  //       : "business listing"
  //     }.
  //             </p>
  //           </div>

  //           <!-- Customer Information -->
  //           <div style="margin-bottom: 25px;">
  //             <h3 style="color: #333; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #a65f00; padding-bottom: 5px;">
  //               Customer Information
  //             </h3>
  //             <table style="width: 100%; border-collapse: collapse;">
  //               <tr>
  //                 <td style="padding: 8px 0; color: #666; font-weight: bold; width: 120px;">Name:</td>
  //                 <td style="padding: 8px 0; color: #333;">${quote.customerInfo.name
  //     }</td>
  //               </tr>
  //               <tr>
  //                 <td style="padding: 8px 0; color: #666; font-weight: bold;">Email:</td>
  //                 <td style="padding: 8px 0; color: #333;">
  //                   <a href="mailto:${quote.customerInfo.email
  //     }" style="color: #a65f00; text-decoration: none;">
  //                     ${quote.customerInfo.email}
  //                   </a>
  //                 </td>
  //               </tr>
  //               <tr>
  //                 <td style="padding: 8px 0; color: #666; font-weight: bold;">Phone:</td>
  //                 <td style="padding: 8px 0; color: #333;">
  //                   <a href="tel:${quote.customerInfo.phone
  //     }" style="color: #a65f00; text-decoration: none;">
  //                     ${quote.customerInfo.phone}
  //                   </a>
  //                 </td>
  //               </tr>
  //             </table>
  //           </div>

  //           <!-- Quote Details -->
  //           <div style="margin-bottom: 25px;">
  //             <h3 style="color: #333; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #a65f00; padding-bottom: 5px;">
  //               Quote Details
  //             </h3>

  //             <div style="margin-bottom: 20px;">
  //               <h4 style="color: #333; margin: 0 0 10px 0; font-size: 16px;">Subject:</h4>
  //               <p style="color: #333; margin: 0; background-color: #f8f9fa; padding: 10px; border-radius: 4px;">
  //                 ${quote.quoteDetails.subject}
  //               </p>
  //             </div>

  //             <div style="margin-bottom: 20px;">
  //               <h4 style="color: #333; margin: 0 0 10px 0; font-size: 16px;">Message:</h4>
  //               <div style="color: #333; background-color: #f8f9fa; padding: 15px; border-radius: 4px; border-left: 4px solid #a65f00;">
  //                 ${quote.quoteDetails.message.replace(/\n/g, "<br>")}
  //               </div>
  //             </div>

  //             ${quote.quoteDetails.eventDate
  //       ? `
  //             <div style="margin-bottom: 15px;">
  //               <h4 style="color: #333; margin: 0 0 8px 0; font-size: 16px;">Event Date:</h4>
  //               <p style="color: #333; margin: 0; font-weight: bold;">
  //                 ${formatDate(quote.quoteDetails.eventDate)}
  //               </p>
  //             </div>
  //             `
  //       : ""
  //     }

  //             <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
  //               ${quote.quoteDetails.budget
  //       ? `
  //               <tr>
  //                 <td style="padding: 8px 0; color: #666; font-weight: bold; width: 120px;">Budget:</td>
  //                 <td style="padding: 8px 0; color: #333; font-weight: bold;">${budgetDisplay}</td>
  //               </tr>
  //               `
  //       : ""
  //     }
  //               ${quote.quoteDetails.guestCount
  //       ? `
  //               <tr>
  //                 <td style="padding: 8px 0; color: #666; font-weight: bold;">Guest Count:</td>
  //                 <td style="padding: 8px 0; color: #333;">${quote.quoteDetails.guestCount} guests</td>
  //               </tr>
  //               `
  //       : ""
  //     }
  //               ${quote.quoteDetails.location
  //       ? `
  //               <tr>
  //                 <td style="padding: 8px 0; color: #666; font-weight: bold;">Location:</td>
  //                 <td style="padding: 8px 0; color: #333;">${quote.quoteDetails.location}</td>
  //               </tr>
  //               `
  //       : ""
  //     }
  //             </table>
  //           </div>

  //           <!-- Call to Action -->
  //           <div style="text-align: center; margin: 30px 0;">
  //             <div style="background-color: #e8f4fd; padding: 20px; border-radius: 8px;">
  //               <h3 style="color: #333; margin-top: 0;">Ready to Respond?</h3>
  //               <p style="color: #666; margin-bottom: 20px;">
  //                 Reply directly to this email to get in touch with ${quote.customerInfo.name
  //     } and provide your quote.
  //               </p>
  //               <a href="mailto:${quote.customerInfo.email}?subject=Re: ${quote.quoteDetails.subject
  //     }" 
  //                  style="background-color: #a65f00; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
  //                 Reply to Customer
  //               </a>
  //             </div>
  //           </div>

  //           <!-- Footer Note -->
  //           <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 25px;">
  //             <p style="color: #666; font-size: 14px; margin: 0; text-align: center;">
  //               <strong>Quote ID:</strong> ${quote._id} | 
  //               <strong>Received:</strong> ${formatDate(quote.createdAt)}
  //             </p>
  //           </div>
  //         </div>

  //         <!-- Email Footer -->
  //         <div style="text-align: center; padding: 20px 0; color: #888; font-size: 12px; background-color: #f8f9fa;">
  //           <p style="margin: 0;">© 2024 Pelbliss. All rights reserved.</p>
  //           <p style="margin: 5px 0 0 0;">
  //             This email was sent because you received a quote request through our platform.
  //           </p>
  //         </div>
  //       </div>
  //     </body>
  //   </html>
  //   `;
  // }

  //   private getSubscriptionConfirmationEmailTemplate(
  //     vendor: IVendor,
  //     plan: any,
  //     subscription: any
  //   ): string {
  //     const formatDate = (date: Date) => {
  //       return new Date(date).toLocaleDateString("en-US", {
  //         year: "numeric",
  //         month: "long",
  //         day: "numeric",
  //       });
  //     };

  //     return `
  //   <!DOCTYPE html>
  //   <html>
  //     <head>
  //       <meta charset="utf-8">
  //       <meta name="viewport" content="width=device-width, initial-scale=1.0">
  //       <title>Subscription Confirmed - Pelbliss</title>
  //     </head>
  //     <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
  //       <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
  //         <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #e60076;">
  //           <h1 style="color: #333; margin: 0;">🎉 Subscription Confirmed!</h1>
  //           <p style="color: #666; margin: 5px 0 0 0;">Welcome to ${plan.name
  //       } Plan</p>
  //         </div>

  //         <div style="padding: 30px 20px;">
  //           <h2 style="color: #333; margin-bottom: 20px;">Hi ${vendor.firstName || vendor.lastName
  //       },</h2>
  //           <p style="color: #555; line-height: 1.6; margin-bottom: 25px;">
  //             Thank you for subscribing to our <strong>${plan.name
  //       }</strong> plan! Your subscription is now active and you have access to all the premium features.
  //           </p>

  //           <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
  //             <h3 style="color: #333; margin-bottom: 20px; margin-top: 0;">Subscription Details</h3>
  //             <table style="width: 100%; border-collapse: collapse;">
  //               <tr>
  //                 <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef;">
  //                   <strong style="color: #495057; display: inline-block; width: 140px;">Plan:</strong>
  //                   <span style="color: #212529;">${plan.name}</span>
  //                 </td>
  //               </tr>
  //               <tr>
  //                 <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef;">
  //                   <strong style="color: #495057; display: inline-block; width: 140px;">Price:</strong>
  //                   <span style="color: #212529;">$${plan.price}/${plan.interval
  //       }</span>
  //                 </td>
  //               </tr>
  //               <tr>
  //                 <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef;">
  //                   <strong style="color: #495057; display: inline-block; width: 140px;">Started:</strong>
  //                   <span style="color: #212529;">${formatDate(
  //         subscription.startDate
  //       )}</span>
  //                 </td>
  //               </tr>
  //               <tr>
  //                 <td style="padding: 10px 0;">
  //                   <strong style="color: #495057; display: inline-block; width: 140px;">Next Billing:</strong>
  //                   <span style="color: #212529;">${formatDate(
  //         subscription.nextBillingDate
  //       )}</span>
  //                 </td>
  //               </tr>
  //             </table>
  //           </div>

  //           <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; border-left: 4px solid #e60076; margin-bottom: 25px;">
  //             <h4 style="color: #a65f00; margin: 0 0 10px 0;">What's included in your plan:</h4>
  //             <ul style="color: #a65f00; margin: 0; padding-left: 20px;">
  //               ${plan.features
  //         ? plan.features
  //           .map((feature: string) => `<li>${feature}</li>`)
  //           .join("")
  //         : "<li>Premium vendor features</li><li>Priority support</li><li>Advanced analytics</li>"
  //       }
  //             </ul>
  //           </div>

  //           <div style="text-align: center; margin: 30px 0;">
  //             <a href="${process.env.FRONTEND_URL
  //       }/vendor/dashboard" style="background-color: #e60076; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 16px; font-weight: bold;">
  //               Go to Dashboard
  //             </a>
  //           </div>

  //           <p style="color: #666; font-size: 14px; line-height: 1.5;">
  //             If you have any questions about your subscription, please don't hesitate to contact our support team.
  //           </p>
  //         </div>

  //         <div style="text-align: center; padding: 20px 0; color: #888; font-size: 12px; border-top: 1px solid #e9ecef;">
  //           <p style="margin: 0;">© 2024 Pelbliss. All rights reserved.</p>
  //         </div>
  //       </div>
  //     </body>
  //   </html>
  //   `;
  //   }

  //   private getSubscriptionCancellationEmailTemplate(
  //     vendor: IVendor,
  //     subscription: any
  //   ): string {
  //     const formatDate = (date: Date) => {
  //       return new Date(date).toLocaleDateString("en-US", {
  //         year: "numeric",
  //         month: "long",
  //         day: "numeric",
  //       });
  //     };

  //     return `
  //   <!DOCTYPE html>
  //   <html>
  //     <head>
  //       <meta charset="utf-8">
  //       <meta name="viewport" content="width=device-width, initial-scale=1.0">
  //       <title>Subscription Cancelled - Pelbliss</title>
  //     </head>
  //     <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
  //       <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
  //         <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #dc3545;">
  //           <h1 style="color: #333; margin: 0;">Subscription Cancelled</h1>
  //           <p style="color: #666; margin: 5px 0 0 0;">We're sorry to see you go</p>
  //         </div>

  //         <div style="padding: 30px 20px;">
  //           <h2 style="color: #333; margin-bottom: 20px;">Hi ${vendor.firstName || vendor.firstName
  //       },</h2>
  //           <p style="color: #555; line-height: 1.6; margin-bottom: 25px;">
  //             Your subscription has been successfully cancelled as requested. We're sad to see you go, but we understand.
  //           </p>

  //           <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
  //             <h3 style="color: #333; margin-bottom: 15px; margin-top: 0;">Important Information</h3>
  //             <ul style="color: #555; margin: 0; padding-left: 20px; line-height: 1.6;">
  //               <li>Your subscription will remain active until <strong>${formatDate(
  //         subscription.endDate
  //       )}</strong></li>
  //               <li>You'll continue to have access to premium features until then</li>
  //               <li>No further charges will be made to your account</li>
  //               <li>You can reactivate your subscription at any time</li>
  //             </ul>
  //           </div>

  //           <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #fda5d6; margin-bottom: 25px;">
  //             <p style="color: #856404; margin: 0; font-weight: bold;">
  //               💡 Changed your mind? You can reactivate your subscription anytime from your dashboard.
  //             </p>
  //           </div>

  //           <div style="text-align: center; margin: 30px 0;">
  //             <a href="${process.env.FRONTEND_URL
  //       }/vendor/subscription" style="background-color: #a65f00; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 16px; font-weight: bold; margin: 0 10px 10px 0;">
  //               Reactivate Subscription
  //             </a>
  //             <a href="${process.env.FRONTEND_URL
  //       }/contact" style="background-color: #6c757d; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 16px; font-weight: bold;">
  //               Contact Support
  //             </a>
  //           </div>

  //           <p style="color: #666; font-size: 14px; line-height: 1.5;">
  //             We'd love to hear your feedback about why you cancelled. Your input helps us improve our service for everyone.
  //           </p>
  //         </div>

  //         <div style="text-align: center; padding: 20px 0; color: #888; font-size: 12px; border-top: 1px solid #e9ecef;">
  //           <p style="margin: 0;">© 2024 Pelbliss. All rights reserved.</p>
  //         </div>
  //       </div>
  //     </body>
  //   </html>
  //   `;
  //   }

  //   private getExpirationWarningEmailTemplate(
  //     vendor: IVendor,
  //     subscription: any,
  //     daysRemaining: number
  //   ): string {
  //     const formatDate = (date: Date) => {
  //       return new Date(date).toLocaleDateString("en-US", {
  //         year: "numeric",
  //         month: "long",
  //         day: "numeric",
  //       });
  //     };

  //     const urgencyColor =
  //       daysRemaining <= 3
  //         ? "#dc3545"
  //         : daysRemaining <= 7
  //           ? "#fda5d6"
  //           : "#fd7e14";
  //     const urgencyBg =
  //       daysRemaining <= 3
  //         ? "#f8d7da"
  //         : daysRemaining <= 7
  //           ? "#fff3cd"
  //           : "#ffeaa7";

  //     return `
  //   <!DOCTYPE html>
  //   <html>
  //     <head>
  //       <meta charset="utf-8">
  //       <meta name="viewport" content="width=device-width, initial-scale=1.0">
  //       <title>Subscription Expiring Soon - Pelbliss</title>
  //     </head>
  //     <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
  //       <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
  //         <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid ${urgencyColor};">
  //           <h1 style="color: #333; margin: 0;">⚠️ Subscription Expiring Soon</h1>
  //           <p style="color: #666; margin: 5px 0 0 0;">${daysRemaining} days remaining</p>
  //         </div>

  //         <div style="padding: 30px 20px;">
  //           <h2 style="color: #333; margin-bottom: 20px;">Hi ${vendor.firstName || vendor.firstName
  //       },</h2>
  //           <p style="color: #555; line-height: 1.6; margin-bottom: 25px;">
  //             This is a friendly reminder that your subscription will expire in <strong>${daysRemaining} ${daysRemaining === 1 ? "day" : "days"
  //       }</strong>.
  //           </p>

  //           <div style="background-color: ${urgencyBg}; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid ${urgencyColor};">
  //             <h3 style="color: #333; margin-bottom: 15px; margin-top: 0;">📅 Subscription Details</h3>
  //             <table style="width: 100%; border-collapse: collapse;">
  //               <tr>
  //                 <td style="padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.1);">
  //                   <strong style="color: #495057; display: inline-block; width: 140px;">Current Plan:</strong>
  //                   <span style="color: #212529;">${subscription.planName || "Premium Plan"
  //       }</span>
  //                 </td>
  //               </tr>
  //               <tr>
  //                 <td style="padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.1);">
  //                   <strong style="color: #495057; display: inline-block; width: 140px;">Expires On:</strong>
  //                   <span style="color: #212529;">${formatDate(
  //         subscription.endDate
  //       )}</span>
  //                 </td>
  //               </tr>
  //               <tr>
  //                 <td style="padding: 8px 0;">
  //                   <strong style="color: #495057; display: inline-block; width: 140px;">Days Remaining:</strong>
  //                   <span style="color: ${urgencyColor}; font-weight: bold;">${daysRemaining} ${daysRemaining === 1 ? "day" : "days"
  //       }</span>
  //                 </td>
  //               </tr>
  //             </table>
  //           </div>

  //           <div style="background-color: #e8f4f8; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
  //             <h4 style="color: #e60076; margin: 0 0 10px 0;">Don't lose access to:</h4>
  //             <ul style="color: #e60076; margin: 0; padding-left: 20px;">
  //               <li>Premium vendor dashboard</li>
  //               <li>Advanced booking management</li>
  //               <li>Priority customer support</li>
  //               <li>Detailed analytics and insights</li>
  //               <li>Enhanced profile visibility</li>
  //             </ul>
  //           </div>

  //           <div style="text-align: center; margin: 30px 0;">
  //             <a href="${process.env.FRONTEND_URL
  //       }/vendor/subscription/renew" style="background-color: #e60076; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 16px; font-weight: bold; margin-bottom: 10px;">
  //               Renew Subscription Now
  //             </a>
  //             <p style="color: #666; font-size: 14px; margin: 10px 0 0 0;">
  //               Renew now to avoid any interruption in service
  //             </p>
  //           </div>

  //           <p style="color: #666; font-size: 14px; line-height: 1.5;">
  //             Questions about renewal? Our support team is here to help you choose the best plan for your business.
  //           </p>
  //         </div>

  //         <div style="text-align: center; padding: 20px 0; color: #888; font-size: 12px; border-top: 1px solid #e9ecef;">
  //           <p style="margin: 0;">© 2024 Pelbliss. All rights reserved.</p>
  //         </div>
  //       </div>
  //     </body>
  //   </html>
  //   `;
  //   }

  //   private getSubscriptionExpiredEmailTemplate(
  //     vendor: IVendor,
  //     subscription: any
  //   ): string {
  //     const formatDate = (date: Date) => {
  //       return new Date(date).toLocaleDateString("en-US", {
  //         year: "numeric",
  //         month: "long",
  //         day: "numeric",
  //       });
  //     };

  //     return `
  //   <!DOCTYPE html>
  //   <html>
  //     <head>
  //       <meta charset="utf-8">
  //       <meta name="viewport" content="width=device-width, initial-scale=1.0">
  //       <title>Subscription Expired - Pelbliss</title>
  //     </head>
  //     <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
  //       <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
  //         <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #dc3545;">
  //           <h1 style="color: #333; margin: 0;">⏰ Subscription Expired</h1>
  //           <p style="color: #666; margin: 5px 0 0 0;">Renew to restore your benefits</p>
  //         </div>

  //         <div style="padding: 30px 20px;">
  //           <h2 style="color: #333; margin-bottom: 20px;">Hi ${vendor.firstName || vendor.firstName
  //       },</h2>
  //           <p style="color: #555; line-height: 1.6; margin-bottom: 25px;">
  //             Your subscription expired on <strong>${formatDate(
  //         subscription.endDate
  //       )}</strong>. Your account has been switched to the free tier, which means you now have limited access to our platform features.
  //           </p>

  //           <div style="background-color: #f8d7da; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #dc3545;">
  //             <h3 style="color: #721c24; margin-bottom: 15px; margin-top: 0;">⚠️ What's Changed</h3>
  //             <ul style="color: #721c24; margin: 0; padding-left: 20px; line-height: 1.6;">
  //               <li>Limited to basic vendor profile</li>
  //               <li>Reduced booking management features</li>
  //               <li>Standard customer support only</li>
  //               <li>Limited analytics access</li>
  //               <li>Decreased profile visibility</li>
  //             </ul>
  //           </div>

  //           <div style="background-color: #d1ecf1; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
  //             <h4 style="color: #e60076; margin: 0 0 10px 0;">🚀 Restore Full Access With Premium:</h4>
  //             <ul style="color: #e60076; margin: 0; padding-left: 20px;">
  //               <li>Advanced booking and calendar management</li>
  //               <li>Detailed business analytics</li>
  //               <li>Priority customer support</li>
  //               <li>Enhanced marketing tools</li>
  //               <li>Higher search ranking</li>
  //             </ul>
  //           </div>

  //           <div style="text-align: center; margin: 30px 0;">
  //             <a href="${process.env.FRONTEND_URL
  //       }/vendor/subscription/plans" style="background-color: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 18px; font-weight: bold; margin-bottom: 15px;">
  //               Renew Your Subscription
  //             </a>
  //             <p style="color: #666; font-size: 14px; margin: 10px 0 0 0;">
  //               Choose from our flexible plans and get back to growing your business
  //             </p>
  //           </div>

  //           <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #fda5d6;">
  //             <p style="color: #856404; margin: 0; font-weight: bold;">
  //               💬 Need help choosing a plan? Our team is ready to assist you in finding the perfect subscription for your business needs.
  //             </p>
  //           </div>

  //           <div style="text-align: center; margin: 25px 0;">
  //             <a href="${process.env.FRONTEND_URL
  //       }/contact" style="background-color: #6c757d; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 14px;">
  //               Contact Support
  //             </a>
  //           </div>
  //         </div>

  //         <div style="text-align: center; padding: 20px 0; color: #888; font-size: 12px; border-top: 1px solid #e9ecef;">
  //           <p style="margin: 0;">© 2024 Pelbliss. All rights reserved.</p>
  //         </div>
  //       </div>
  //     </body>
  //   </html>
  //   `;
  //   }

  //admin email service templates
  private getAccountStatusSubject(status: string): string {
    switch (status) {
      case "active":
        return "Account Activated - Pelbliss";
      case "pending_verification":
        return "Account Pending Verification - Pelbliss";
      case "suspended":
        return "Account Suspended - Pelbliss";
      case "deactivated":
        return "Account Deactivated - Pelbliss";
      case "incomplete_profile":
        return "Profile Completion Required - Pelbliss";
      case "deleted":
        return "Account Deleted - Pelbliss";
      default:
        return "Account Status Update - Pelbliss";
    }
  }

  //   private sendAdminReportNotificationTemplate(
  //     listing: BusinessInfo,
  //     review: IReview
  //   ): string {
  //     const formatDate = (date: Date) => {
  //       return new Date(date).toLocaleDateString("en-US", {
  //         year: "numeric",
  //         month: "long",
  //         day: "numeric",
  //         hour: "2-digit",
  //         minute: "2-digit",
  //       });
  //     };

  //     const getRatingStars = (rating: number): string => {
  //       return "★".repeat(rating) + "☆".repeat(5 - rating);
  //     };

  //     const getSeverityColor = (rating: number): string => {
  //       if (rating <= 2) return "#dc3545";
  //       if (rating === 3) return "#ffc107";
  //       return "#28a745";
  //     };

  //     return `
  // <!DOCTYPE html>
  // <html>
  //   <head>
  //     <meta charset="utf-8">
  //     <meta name="viewport" content="width=device-width, initial-scale=1.0">
  //     <title>Review Report Alert - Pelbliss Admin</title>
  //   </head>
  //   <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
  //     <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
  //       <div style="text-align: center; padding: 20px 0; border-bottom: 3px solid #dc3545; background-color: #fff3cd;">
  //         <h1 style="color: #333; margin: 0;">⚠️ Review Reported</h1>
  //         <p style="color: #856404; margin: 5px 0 0 0; font-weight: bold;">Admin attention required</p>
  //       </div>

  //       <div style="padding: 30px 20px;">
  //         <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 5px solid #dc3545;">
  //           <h2 style="color: #721c24; margin: 0 0 10px 0;">🚨 Report Summary</h2>
  //           <p style="color: #721c24; margin: 0; line-height: 1.6;">
  //             A review has been flagged for <strong>${listing.businessName
  //       }</strong>.
  //           </p>
  //         </div>

  //         <div style="background-color: #ffffff; padding: 25px; border: 2px solid #e9ecef; border-radius: 8px; margin-bottom: 25px;">
  //           <h3 style="color: #333; margin: 0 0 20px 0; border-bottom: 2px solid #e60076; padding-bottom: 10px;">📍 Business Details</h3>

  //           <table style="width: 100%; border-collapse: collapse;">
  //             <tr>
  //               <td style="padding: 10px 0; color: #666; font-weight: bold; width: 35%;">Business Name:</td>
  //               <td style="padding: 10px 0; color: #333;">${listing.businessName
  //       }</td>
  //             </tr>
  //             <tr>
  //               <td style="padding: 10px 0; color: #666; font-weight: bold;">Category:</td>
  //               <td style="padding: 10px 0; color: #333;">${listing.businessCategory
  //       }</td>
  //             </tr>
  //             <tr>
  //               <td style="padding: 10px 0; color: #666; font-weight: bold;">Location:</td>
  //               <td style="padding: 10px 0; color: #333;">${listing.state}</td>
  //             </tr>
  //           </table>
  //         </div>

  //         <div style="background-color: #fff3cd; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 5px solid ${getSeverityColor(
  //         review.rating
  //       )};">
  //           <h3 style="color: #856404; margin: 0 0 15px 0; border-bottom: 2px solid #e60076; padding-bottom: 10px;">⭐ Reported Review</h3>

  //           <div style="margin-bottom: 15px;">
  //             <p style="color: #856404; margin: 0 0 5px 0; font-weight: bold;">Rating:</p>
  //             <div style="font-size: 24px; color: ${getSeverityColor(
  //         review.rating
  //       )};">
  //               ${getRatingStars(
  //         review.rating
  //       )} <span style="font-size: 18px; color: #333;">(${review.rating
  //       }/5)</span>
  //             </div>
  //           </div>

  //           <div style="margin-bottom: 15px;">
  //             <p style="color: #856404; margin: 0 0 5px 0; font-weight: bold;">Content:</p>
  //             <div style="background-color: #ffffff; padding: 15px; border-radius: 6px; border: 1px solid #fda5d6;">
  //               <p style="color: #333; margin: 0; line-height: 1.6; font-style: italic;">
  //                 "${review.content}"
  //               </p>
  //             </div>
  //           </div>

  //           <div>
  //             <p style="color: #856404; margin: 0 0 5px 0; font-weight: bold;">Reported On:</p>
  //             <p style="color: #333; margin: 0;">${formatDate(new Date())}</p>
  //           </div>
  //         </div>

  //         <div style="text-align: center; margin: 30px 0;">
  //           <a href="${process.env.ADMIN_DASHBOARD_URL || process.env.FRONTEND_URL
  //       }/admin/reports/reviews/${review._id || review.id}" 
  //              style="background-color: #dc3545; color: white; padding: 15px 35px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 18px; font-weight: bold;">
  //             View Report
  //           </a>
  //         </div>
  //       </div>

  //       <div style="text-align: center; padding: 20px 0; color: #888; font-size: 12px; border-top: 1px solid #e9ecef; background-color: #f8f9fa;">
  //         <p style="margin: 0 0 5px 0;">© 2024 Pelbliss Admin System. All rights reserved.</p>
  //         <p style="margin: 0; color: #999;">This is an automated notification.</p>
  //       </div>
  //     </div>
  //   </body>
  // </html>
  // `;
  //   }

  private getAccountStatusTemplate(
    status:
      | "active"
      | "pending_verification"
      | "suspended"
      | "deactivated"
      | "incomplete_profile"
      | "deleted",
    reason?: string
  ): string {
    const getStatusContent = (status: string) => {
      switch (status) {
        case "active":
          return {
            title: "Account Active",
            message: "Your account is now active and ready to use.",
            color: "#e60076",
            icon: "✓",
            action: "You can now access all features of Pelbliss.",
          };
        case "pending_verification":
          return {
            title: "Account Pending Verification",
            message: "Your account is currently under review by our team.",
            color: "#fda5d6",
            icon: "⏳",
            action: "Please wait while we verify your account details.",
          };
        case "suspended":
          return {
            title: "Account Suspended",
            message: "Your account has been temporarily suspended.",
            color: "#dc3545",
            icon: "⚠️",
            action:
              "Please contact support for more information about reactivating your account.",
          };
        case "deactivated":
          return {
            title: "Account Deactivated",
            message: "Your account has been deactivated.",
            color: "#6c757d",
            icon: "❌",
            action: "Contact support if you wish to reactivate your account.",
          };
        case "incomplete_profile":
          return {
            title: "Profile Incomplete",
            message: "Your account profile needs to be completed.",
            color: "#fd7e14",
            icon: "📝",
            action:
              "Please complete your profile to access all platform features.",
          };
        case "deleted":
          return {
            title: "Account Deleted",
            message: "Your account has been permanently deleted.",
            color: "#dc3545",
            icon: "🗑️",
            action:
              "This action cannot be reversed. Contact support if you believe this is an error.",
          };
        default:
          return {
            title: "Account Status Update",
            message: "Your account status has been updated.",
            color: "#a65f00",
            icon: "ℹ️",
            action: "Please check your account for more details.",
          };
      }
    };

    const { title, message, color, icon, action } = getStatusContent(status);

    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #333; margin: 0;">Pelbliss</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${color};">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="font-size: 48px; margin-bottom: 10px;">${icon}</div>
              <h2 style="color: #333; margin: 0;">${title}</h2>
            </div>
            
            <p style="color: #666; line-height: 1.6; text-align: center;">${message}</p>
            
            <p style="color: #666; line-height: 1.6; text-align: center; font-weight: 500;">${action}</p>
            
            ${reason
        ? `
            <div style="background-color: #e9ecef; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="color: #666; margin: 0; font-size: 14px;"><strong>Additional Information:</strong></p>
              <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">${reason}</p>
            </div>
            `
        : ""
      }
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL
      }" style="background-color: ${color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Access Your Account
              </a>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px 0; color: #888; font-size: 12px;">
            <p>© 2024 Pelbliss. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
  }
  private getAccountSuspendedTemplate(
    reason?: string,
    duration?: number
  ): string {
    return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Suspended</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
        <div style="text-align: center; padding: 20px 0;">
          <h1 style="color: #333; margin: 0;">Floatthr</h1>
        </div>
        
        <div style="padding: 20px; background-color: #d0e7ff; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3399ff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
            <h2 style="color: #0056b3; margin: 0;">Account Suspended</h2>
          </div>
          
          <p style="color: #0056b3; line-height: 1.6; text-align: center;">
            Your account has been temporarily suspended by our administrators.
          </p>
          
          ${duration
        ? `
          <div style="background-color: #cce5ff; padding: 15px; border-radius: 4px; margin: 20px 0; border: 1px solid #99ccff;">
            <p style="color: #004085; margin: 0; font-size: 14px; text-align: center;"><strong>Suspension Duration:</strong></p>
            <p style="color: #004085; margin: 10px 0 0 0; font-size: 14px; text-align: center; font-weight: 500;">${duration}</p>
          </div>
          `
        : ""
      }
          
          ${reason
        ? `
          <div style="background-color: #e6f0ff; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="color: #003366; margin: 0; font-size: 14px;"><strong>Reason for Suspension:</strong></p>
            <p style="color: #003366; margin: 10px 0 0 0; font-size: 14px;">${reason}</p>
          </div>
          `
        : ""
      }
          
          <p style="color: #0056b3; font-size: 14px; text-align: center; margin-top: 20px;">
            If you believe this suspension is in error, please contact our support team for assistance.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:${process.env.ADMIN_EMAIL || "support@floatthr.com"}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Contact Support
            </a>
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px 0; color: #888; font-size: 12px;">
          <p>© 2024 Floatthr. All rights reserved.</p>
        </div>
      </div>
    </body>
  </html>
`;
  }

  private getAccountUnsuspendedTemplate(
    reason?: string
  ): string {
    return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Reactivated</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
        <div style="text-align: center; padding: 20px 0;">
          <h1 style="color: #333; margin: 0;">Floatthr</h1>
        </div>
        
        <div style="padding: 20px; background-color: #d0e7ff; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3399ff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
            <h2 style="color: #0056b3; margin: 0;">Account Reactivated</h2>
          </div>
          
          <p style="color: #0056b3; line-height: 1.6; text-align: center;">
            Your account has been successfully reactivated. You can now log in and access all features.
          </p>
          
          ${reason
        ? `
          <div style="background-color: #e6f0ff; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="color: #003366; margin: 0; font-size: 14px;"><strong>Note:</strong></p>
            <p style="color: #003366; margin: 10px 0 0 0; font-size: 14px;">${reason}</p>
          </div>
          `
        : ""
      }
          
          <p style="color: #0056b3; font-size: 14px; text-align: center; margin-top: 20px;">
            If you have any questions, feel free to reach out to our support team.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:${process.env.ADMIN_EMAIL || "support@floatthr.com"}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Contact Support
            </a>
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px 0; color: #888; font-size: 12px;">
          <p>© 2024 Floatthr. All rights reserved.</p>
        </div>
      </div>
    </body>
  </html>
`;
  }



  // private getAccountSuspendedTemplate(
  //   reason?: string,
  //   duration?: number
  // ): string {
  //   return `
  //   <!DOCTYPE html>
  //   <html>
  //     <head>
  //       <meta charset="utf-8">
  //       <meta name="viewport" content="width=device-width, initial-scale=1.0">
  //       <title>Account Suspended</title>
  //     </head>
  //     <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
  //       <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
  //         <div style="text-align: center; padding: 20px 0;">
  //           <h1 style="color: #333; margin: 0;">Pelbliss</h1>
  //         </div>

  //         <div style="padding: 20px; background-color: #fff3cd; border-radius: 8px; margin: 20px 0; border-left: 4px solid #fda5d6;">
  //           <div style="text-align: center; margin-bottom: 20px;">
  //             <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
  //             <h2 style="color: #856404; margin: 0;">Account Suspended</h2>
  //           </div>

  //           <p style="color: #856404; line-height: 1.6; text-align: center;">
  //             Your account has been temporarily suspended by our administrators.
  //           </p>

  //           ${duration
  //       ? `
  //           <div style="background-color: #f8d7da; padding: 15px; border-radius: 4px; margin: 20px 0; border: 1px solid #f5c6cb;">
  //             <p style="color: #721c24; margin: 0; font-size: 14px; text-align: center;"><strong>Suspension Duration:</strong></p>
  //             <p style="color: #721c24; margin: 10px 0 0 0; font-size: 14px; text-align: center; font-weight: 500;">${duration}</p>
  //           </div>
  //           `
  //       : ""
  //     }

  //           ${reason
  //       ? `
  //           <div style="background-color: #e9ecef; padding: 15px; border-radius: 4px; margin: 20px 0;">
  //             <p style="color: #666; margin: 0; font-size: 14px;"><strong>Reason for Suspension:</strong></p>
  //             <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">${reason}</p>
  //           </div>
  //           `
  //       : ""
  //     }

  //           <p style="color: #856404; font-size: 14px; text-align: center; margin-top: 20px;">
  //             If you believe this suspension is in error, please contact our support team for assistance.
  //           </p>

  //           <div style="text-align: center; margin: 30px 0;">
  //             <a href="mailto:${process.env.ADMIN_EMAIL || "support@pelbliss.com"
  //     }" style="background-color: #6c757d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
  //               Contact Support
  //             </a>
  //           </div>
  //         </div>

  //         <div style="text-align: center; padding: 20px 0; color: #888; font-size: 12px;">
  //           <p>© 2024 Pelbliss. All rights reserved.</p>
  //         </div>
  //       </div>
  //     </body>
  //   </html>
  // `;
  // }

  private getSubscriptionUpdateTemplate(subscriptionPlan: string): string {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Subscription Plan Updated</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #333; margin: 0;">Pelbliss</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17a2b8;">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="font-size: 48px; margin-bottom: 10px;">📈</div>
              <h2 style="color: #333; margin: 0;">Subscription Plan Updated</h2>
            </div>
            
            <p style="color: #666; line-height: 1.6; text-align: center;">
              Your subscription plan has been successfully updated by our administrators.
            </p>
            
            <div style="background-color: #d1ecf1; padding: 20px; border-radius: 4px; margin: 20px 0; text-align: center; border: 1px solid #bee5eb;">
              <p style="color: #e60076; margin: 0; font-size: 16px;"><strong>New Subscription Plan:</strong></p>
              <p style="color: #e60076; margin: 10px 0 0 0; font-size: 18px; font-weight: bold; text-transform: capitalize;">${subscriptionPlan}</p>
            </div>
            
            <p style="color: #666; line-height: 1.6; text-align: center;">
              Your new plan features are now active and ready to use. Visit your vendor dashboard to explore the updated capabilities.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL}/vendor/subscription" style="background-color: #17a2b8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                View Subscription Details
              </a>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px 0; color: #888; font-size: 12px;">
            <p>© 2024 Pelbliss. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
  }

  private getPasswordResetByAdminTemplate(password: string): string {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset by Administrator</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #333; margin: 0;">Pelbliss</h1>
          </div>
          
          <div style="padding: 20px; background-color: #fff3cd; border-radius: 8px; margin: 20px 0; border-left: 4px solid #fda5d6;">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="font-size: 48px; margin-bottom: 10px;">🔑</div>
              <h2 style="color: #856404; margin: 0;">Password Reset by Administrator</h2>
            </div>
            
            <p style="color: #856404; line-height: 1.6; text-align: center;">
              Your password has been reset by an administrator. Please use the temporary password below to log in.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #dc3545; color: white; padding: 15px 30px; border-radius: 4px; font-size: 18px; font-weight: bold; letter-spacing: 1px; display: inline-block; font-family: 'Courier New', monospace;">
                ${password}
              </div>
            </div>
            
            <div style="background-color: #f8d7da; padding: 15px; border-radius: 4px; margin: 20px 0; border: 1px solid #f5c6cb;">
              <p style="color: #721c24; margin: 0; font-size: 14px; text-align: center;"><strong>Important Security Notice:</strong></p>
              <p style="color: #721c24; margin: 10px 0 0 0; font-size: 14px; text-align: center;">
                Please change this temporary password immediately after logging in for security purposes.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL}/login" style="background-color: #a65f00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin-right: 10px;">
                Log In Now
              </a>
              <a href="${process.env.CLIENT_URL}/change-password" style="background-color: #e60076; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Change Password
              </a>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px 0; color: #888; font-size: 12px;">
            <p>© 2024 Pelbliss. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
  }

  private getAnnouncementEmailTemplate(
    fullName: string,
    title: string,
    message: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px; background-color: #ffffff; border: 1px solid #e9ecef; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 14px; }
          h1 { color: #495057; margin: 0; }
          .message { margin: 20px 0; white-space: pre-line; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${title}</h1>
          </div>
          <div class="content">
            <p>Dear ${fullName},</p>
            <div class="message">${message}</div>
            <p>Thank you for your attention.</p>
            <p>Best regards,<br>The Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export default EmailService;
