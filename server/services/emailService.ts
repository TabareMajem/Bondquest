import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

// Create reusable transporter object using SMTP transport
let transporter: nodemailer.Transporter | null = null;

/**
 * Initialize the email transporter
 * In production, you would use actual SMTP credentials
 * For development, we create a test account
 */
export const initializeEmailTransporter = async (): Promise<void> => {
  if (process.env.NODE_ENV === 'production' && process.env.SMTP_HOST) {
    // Production email configuration
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  } else {
    // For development, use Ethereal - a fake SMTP service
    // This creates a temporary email account we can use for testing
    const testAccount = await nodemailer.createTestAccount();
    
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    
    console.log('Ethereal email test account created for development:');
    console.log('Username:', testAccount.user);
    console.log('Password:', testAccount.pass);
    console.log('Preview URL will be logged with each email sent');
  }
};

/**
 * Send an email
 * @param options Email options including to, subject, and html content
 * @returns Promise with the message info or error
 */
export const sendEmail = async (options: EmailOptions): Promise<{ success: boolean; messageId?: string; previewUrl?: string; error?: string }> => {
  if (!transporter) {
    await initializeEmailTransporter();
  }

  if (!transporter) {
    return { success: false, error: 'Email transporter not initialized' };
  }

  try {
    const { to, subject, html, from = 'BondQuest <noreply@bondquest.app>' } = options;
    
    // Send mail with defined transport object
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    console.log('Message sent: %s', info.messageId);
    
    // Preview URL only available when sending through Ethereal
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      return { 
        success: true,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info) as string
      };
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown email error'
    };
  }
};

/**
 * Generate HTML email template for partner invitation
 */
export const getPartnerInvitationEmailTemplate = (
  senderName: string,
  inviteLink: string,
  partnerCode: string
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Join BondQuest</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f9f9f9;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #9333ea, #7c3aed);
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background: white;
          padding: 30px;
          border-radius: 0 0 8px 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #ec4899, #db2777);
          color: white;
          text-decoration: none;
          padding: 12px 25px;
          border-radius: 50px;
          font-weight: bold;
          margin: 20px 0;
        }
        .code {
          background-color: #f0f0f0;
          padding: 10px;
          border-radius: 5px;
          font-family: monospace;
          font-size: 18px;
          letter-spacing: 1px;
          text-align: center;
          margin: 15px 0;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          color: #888;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Join BondQuest</h1>
        </div>
        <div class="content">
          <h2>You've Been Invited!</h2>
          <p>Hello there!</p>
          <p><strong>${senderName}</strong> has invited you to join them on BondQuest, an app designed to help strengthen your relationship through interactive games, quizzes, and activities.</p>
          
          <p>To accept this invitation, simply click the button below:</p>
          <div style="text-align: center;">
            <a href="${inviteLink}" class="button">Accept Invitation</a>
          </div>
          
          <p>Or you can enter this partner code when you create your account:</p>
          <div class="code">${partnerCode}</div>
          
          <p>BondQuest helps couples:</p>
          <ul>
            <li>Deepen emotional connections</li>
            <li>Improve communication</li>
            <li>Have fun through relationship-building activities</li>
            <li>Track your relationship growth over time</li>
          </ul>
          
          <p>We're excited for you both to begin your journey!</p>
        </div>
        <div class="footer">
          <p>This email was sent from BondQuest. If you did not expect this invitation, you can safely ignore it.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};