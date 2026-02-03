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
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #FF385C; text-align: center; margin-bottom: 24px;">Keesha</h2>
          <p style="color: #374151; font-size: 16px; margin-bottom: 24px; text-align: center;">Here is your verification code:</p>
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111827;">${otp}</span>
          </div>
          <p style="color: #6b7280; font-size: 14px; text-align: center;">This code will expire in 10 minutes.</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: 'Failed to send email: ' + error.message };
  }
}
