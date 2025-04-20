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

/**
 * Generate HTML email template for reward notification
 */
export const getRewardWinnerEmailTemplate = (
  coupleNames: string,
  rewardName: string,
  rewardDescription: string,
  rewardImageUrl: string,
  redemptionCode: string,
  redemptionUrl: string,
  expirationDate: string,
  competitionName?: string,
  locationRestrictions?: string[]
): string => {
  const competitionSection = competitionName ? `
    <p>Congratulations on your performance in the <strong>${competitionName}</strong> competition!</p>
  ` : '';

  const locationSection = locationRestrictions && locationRestrictions.length > 0 ? `
    <div style="background-color: #fffde7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffd600;">
      <p style="margin-top: 0;"><strong>Location Restrictions:</strong> This reward is only available in the following locations:</p>
      <ul style="margin-bottom: 0;">
        ${locationRestrictions.map(location => `<li>${location}</li>`).join('')}
      </ul>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>You've Won a Reward! - BondQuest</title>
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
          padding: 25px;
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
          padding: 14px 28px;
          border-radius: 50px;
          font-weight: bold;
          margin: 20px 0;
          font-size: 16px;
        }
        .reward-image {
          width: 100%;
          max-height: 250px;
          object-fit: cover;
          border-radius: 8px;
          margin: 20px 0;
        }
        .code {
          background-color: #f0f0f0;
          padding: 12px;
          border-radius: 5px;
          font-family: monospace;
          font-size: 18px;
          letter-spacing: 1px;
          text-align: center;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          color: #888;
          font-size: 12px;
        }
        .reward-card {
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          overflow: hidden;
          margin: 25px 0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        .reward-header {
          background: linear-gradient(135deg, #4a148c, #7b1fa2);
          padding: 15px;
          color: white;
        }
        .reward-content {
          padding: 20px;
        }
        .expiration {
          background-color: #f8f9fa;
          padding: 12px;
          border-radius: 5px;
          font-size: 14px;
          text-align: center;
          margin: 20px 0 0;
          border-top: 1px solid #e0e0e0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Congratulations! 🎉</h1>
        </div>
        <div class="content">
          <h2>You've Won a Reward!</h2>
          <p>Hello <strong>${coupleNames}</strong>!</p>
          
          ${competitionSection}
          
          <p>We're excited to inform you that you've earned the following reward:</p>
          
          <div class="reward-card">
            <div class="reward-header">
              <h3 style="margin: 0;">${rewardName}</h3>
            </div>
            <div class="reward-content">
              ${rewardImageUrl ? `<img src="${rewardImageUrl}" alt="${rewardName}" class="reward-image" />` : ''}
              <p>${rewardDescription}</p>
              
              ${redemptionCode ? `
                <p><strong>Your Redemption Code:</strong></p>
                <div class="code">${redemptionCode}</div>
              ` : ''}
              
              <div style="text-align: center; margin-top: 15px;">
                <a href="${redemptionUrl}" class="button">Claim Your Reward</a>
              </div>
              
              <div class="expiration">
                <p style="margin: 0;"><strong>Expires:</strong> ${expirationDate}</p>
              </div>
            </div>
          </div>
          
          ${locationSection}
          
          <p>Don't forget to claim your reward before it expires! Visit the Rewards section in your BondQuest app for more details.</p>
          
          <p>Thank you for being part of the BondQuest community!</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} BondQuest. All rights reserved.</p>
          <p>This email was sent to you because you won a reward on BondQuest. If you think this was a mistake, please contact support.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate HTML email template for reward reminder
 */
export const getRewardReminderEmailTemplate = (
  coupleNames: string,
  rewardName: string,
  expirationDate: string,
  daysLeft: number,
  redemptionUrl: string
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reminder: Your Reward Expires Soon - BondQuest</title>
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
        .warning {
          background-color: #fef9c3;
          border-left: 4px solid #eab308;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
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
          <h1>Reminder: Your Reward</h1>
        </div>
        <div class="content">
          <h2>Don't Miss Out!</h2>
          <p>Hello <strong>${coupleNames}</strong>,</p>
          
          <div class="warning">
            <p><strong>Time is running out!</strong> Your reward "${rewardName}" expires in <strong>${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong> (${expirationDate}).</p>
          </div>
          
          <p>We noticed you haven't claimed your reward yet. Don't miss this opportunity!</p>
          
          <div style="text-align: center;">
            <a href="${redemptionUrl}" class="button">Claim Now</a>
          </div>
          
          <p>If you have any questions about redeeming your reward, please contact our support team.</p>
          
          <p>Thanks for being part of BondQuest!</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} BondQuest. All rights reserved.</p>
          <p>This email was sent to you because you have an unclaimed reward. If you've already claimed your reward, please disregard this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};