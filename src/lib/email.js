import nodemailer from 'nodemailer';

let cachedTransporter = null;

const defaultEmailUser = '2005.kamru@gmail.com';
const defaultEmailPass = 'chlmltkpwyjcdvkj';

/**
 * Creates or reuses a reliable SMTP transporter instance.
 */
function getTransporter() {
  const emailUser = process.env.EMAIL_USER || defaultEmailUser;
  const emailPass = process.env.EMAIL_PASS || defaultEmailPass;

  if (!cachedTransporter && emailUser && emailPass) {
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // Direct SSL/TLS for minimum latency
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
  }
  return cachedTransporter;
}

/**
 * Dispatches an email notification with automatic retry for maximum deliverability.
 */
export async function sendEmail({ to, subject, html, text }) {
  if (!to) return false;

  const transporter = getTransporter();

  if (!transporter) {
    console.log(`[AUlaf Email Notice] (DEV MODE - No SMTP configured)`);
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Preview: ${(text || html || '').substring(0, 120)}...`);
    return true;
  }

  const emailSender = process.env.EMAIL_USER || defaultEmailUser;
  const mailOptions = {
    from: `"AUlaf App" <${emailSender}>`,
    replyTo: emailSender,
    to,
    subject,
    text: text || '',
    html: html || text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[AUlaf Email] Successfully delivered to ${to} (${info.messageId || 'OK'})`);
    return true;
  } catch (error) {
    console.warn(`[AUlaf Email] Initial dispatch attempt failed for ${to}:`, error.message);
    
    // Automatic retry with fresh direct connection
    try {
      const freshTransporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: emailSender,
          pass: process.env.EMAIL_PASS || defaultEmailPass,
        },
      });
      const retryInfo = await freshTransporter.sendMail(mailOptions);
      console.log(`[AUlaf Email] Retry successfully delivered to ${to} (${retryInfo.messageId || 'OK'})`);
      return true;
    } catch (retryErr) {
      console.error(`[AUlaf Email] Final dispatch attempt failed for ${to}:`, retryErr.message);
      return false;
    }
  }
}

/**
 * Pre-formatted transactional notification emails
 */
export async function sendReportCreatedEmail(userEmail, reportTitle, reportType, reportId) {
  const subject = `[AUlaf] Report Submitted: ${reportTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; color: #1e293b;">
      <h2 style="color: #0f172a; margin: 0 0 12px; font-size: 18px;">Your ${reportType} Report is Live</h2>
      <p style="font-size: 14px; color: #475569; margin: 0 0 12px;">Hello,</p>
      <p style="font-size: 14px; color: #475569; margin: 0 0 12px;">
        You have successfully filed a <strong>${reportType}</strong> report for <strong>"${reportTitle}"</strong> on AUlaf.
      </p>
      <p style="font-size: 13px; color: #64748b; margin: 0 0 16px;">Reference ID: <code>${reportId}</code></p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
      <p style="font-size: 11px; color: #94a3b8; margin: 0;">AUlaf Lost &amp; Found</p>
    </div>
  `;
  return sendEmail({ to: userEmail, subject, html, text: `Your ${reportType} report for "${reportTitle}" has been filed on AUlaf (ID: ${reportId}).` });
}

export async function sendHandoverCompleteEmail(userEmail, itemTitle, reportId) {
  const subject = `[AUlaf] Item Recovered: ${itemTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; color: #1e293b;">
      <h2 style="color: #047857; margin: 0 0 12px; font-size: 18px;">Handover Confirmed &amp; Item Recovered!</h2>
      <p style="font-size: 14px; color: #475569; margin: 0 0 12px;">
        The handover verification for <strong>"${itemTitle}"</strong> (ID: <code>${reportId}</code>) was completed successfully via authenticated campus OTP.
      </p>
      <p style="font-size: 14px; color: #475569; margin: 0 0 16px;">
        The report status has officially been marked as <strong>Resolved</strong>.
      </p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
      <p style="font-size: 11px; color: #94a3b8; margin: 0;">Thank you for contributing to our trustworthy campus community &bull; AUlaf</p>
    </div>
  `;
  return sendEmail({ to: userEmail, subject, html, text: `Handover confirmed for "${itemTitle}" on AUlaf. Report marked Resolved.` });
}

export async function sendVerificationCodeEmail(userEmail, code, role = 'Member') {
  const subject = `Your AUlaf code: ${code}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; color: #1e293b;">
      <h2 style="color: #0f172a; font-size: 18px; font-weight: 700; margin: 0 0 12px 0;">AUlaf Lost &amp; Found</h2>
      
      <p style="font-size: 14px; color: #475569; line-height: 1.5; margin: 0 0 16px 0;">
        Hello, here is your one-time verification code to sign in to AUlaf:
      </p>

      <div style="background-color: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; margin: 0 0 16px 0;">
        <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #0f172a; display: inline-block;">
          ${code}
        </span>
        <p style="margin: 6px 0 0 0; font-size: 11px; color: #64748b; font-weight: 500;">
          Valid for 2 minutes
        </p>
      </div>

      <p style="font-size: 12px; color: #64748b; line-height: 1.4; margin: 0 0 16px 0;">
        If you did not request this code, you can safely ignore this email.
      </p>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
      
      <p style="font-size: 11px; color: #94a3b8; margin: 0; line-height: 1.4;">
        AUlaf Student Lost &amp; Found
      </p>
    </div>
  `;
  return sendEmail({
    to: userEmail,
    subject,
    html,
    text: `Your AUlaf verification code is: ${code}. Valid for 2 minutes. Do not share this code.`
  });
}

export async function sendPhoneVerificationEmail(userEmail, code, phone, role = 'Member') {
  const subject = `Your AUlaf phone code: ${code}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; color: #1e293b;">
      <h2 style="color: #0f172a; font-size: 18px; font-weight: 700; margin: 0 0 12px 0;">AUlaf Contact Verification</h2>
      
      <p style="font-size: 14px; color: #475569; line-height: 1.5; margin: 0 0 12px 0;">
        A request was submitted to update your emergency contact number on AUlaf to:
      </p>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; font-size: 15px; font-weight: 600; color: #0f172a; margin-bottom: 16px; font-family: monospace;">
        ${phone}
      </div>

      <p style="font-size: 14px; color: #475569; line-height: 1.5; margin: 0 0 16px 0;">
        Your 6-digit confirmation code is:
      </p>

      <div style="background-color: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; margin: 0 0 16px 0;">
        <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #0f172a; display: inline-block;">
          ${code}
        </span>
        <p style="margin: 6px 0 0 0; font-size: 11px; color: #64748b; font-weight: 500;">
          Valid for 2 minutes
        </p>
      </div>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
      
      <p style="font-size: 11px; color: #94a3b8; margin: 0; line-height: 1.4;">
        AUlaf Student Lost &amp; Found
      </p>
    </div>
  `;
  return sendEmail({
    to: userEmail,
    subject,
    html,
    text: `Your AUlaf phone verification code is: ${code} for updating contact number to ${phone}. Valid for 2 minutes.`
  });
}




