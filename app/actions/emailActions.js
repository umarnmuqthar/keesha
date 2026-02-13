'use server';

export async function sendOTPEmail(email, otp) {
  if (!email || !otp) return { success: false, error: 'Email and OTP are required.' };



  try {
    const nodemailer = (await import('nodemailer')).default;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Your Keesha Verification Code',
      text: `Your Keesha verification code is ${otp}. It expires in 10 minutes. Do not share this code with anyone.`,
      html: `
        <div style="margin:0; padding:24px 12px; background:#f5f6f8; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
          <div style="max-width:620px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:16px; overflow:hidden;">
            <div style="padding:18px 24px; border-bottom:1px solid #eef0f3; background:#ffffff;">
              <div style="font-size:22px; line-height:1.1; font-weight:800; color:#0f766e; letter-spacing:-0.02em;">Keesha</div>
              <div style="margin-top:4px; font-size:12px; color:#6b7280;">Finance Tracker</div>
            </div>

            <div style="padding:24px;">
              <div style="font-size:18px; line-height:1.35; font-weight:700; color:#111827; margin-bottom:8px;">
                Verify your email
              </div>
              <div style="font-size:14px; line-height:1.6; color:#4b5563; margin-bottom:18px;">
                Use the one-time verification code below to continue.
              </div>

              <div style="border:1px solid #dbe3df; background:#f8fcfa; border-radius:12px; padding:16px; text-align:center; margin-bottom:16px;">
                <div style="font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#6b7280; margin-bottom:8px;">
                  Verification Code
                </div>
                <div style="font-size:34px; line-height:1; font-weight:800; letter-spacing:10px; color:#0f172a;">
                  ${otp}
                </div>
              </div>

              <div style="font-size:13px; line-height:1.6; color:#6b7280; margin-bottom:12px;">
                This code expires in <strong style="color:#111827;">10 minutes</strong>.
              </div>
              <div style="font-size:13px; line-height:1.6; color:#6b7280;">
                If you didn't request this code, you can safely ignore this email.
              </div>
            </div>

            <div style="padding:14px 24px; border-top:1px solid #eef0f3; background:#fafafa; font-size:12px; color:#9ca3af;">
              For security reasons, never share this code with anyone.
            </div>
          </div>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: 'Failed to send email: ' + error.message };
  }
}
