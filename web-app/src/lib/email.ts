import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export async function sendOTPEmail(email: string, otp: string) {
  const mailOptions = {
    from: '"Hisab Barabar" <notifications@hisabbarabar.qzz.io>',
    to: email,
    subject: 'Verify Your Email',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0; padding: 0;">
          <tr>
            <td align="center" style="padding: 48px 20px;">
              <table role="presentation" style="max-width: 560px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                
                <!-- Header -->
                <tr>
                  <td style="padding: 48px 40px 32px; text-align: left; border-bottom: 1px solid #e5e7eb;">
                    <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #111827; letter-spacing: -0.02em;">Hisab Barabar</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 12px; font-size: 24px; font-weight: 600; color: #111827; line-height: 1.3;">Verify your email</h2>
                    <p style="margin: 0 0 32px; font-size: 15px; line-height: 1.6; color: #6b7280;">
                      Enter this code to complete your registration:
                    </p>
                    
                    <!-- OTP Code -->
                    <div style="text-align: center; margin: 0 0 32px;">
                      <div style="display: inline-block; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px 32px;">
                        <span style="font-size: 32px; font-weight: 600; color: #111827; letter-spacing: 8px; font-family: 'Courier New', Courier, monospace;">${otp}</span>
                      </div>
                      <p style="margin: 16px 0 0; font-size: 13px; color: #9ca3af;">This code expires in 10 minutes</p>
                    </div>
                    
                    <!-- Divider -->
                    <div style="border-top: 1px solid #e5e7eb; margin: 32px 0;"></div>
                    
                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                      If you didn't request this code, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 32px 40px; background-color: #f9fafb; text-align: center;">
                    <p style="margin: 0 0 8px; font-size: 13px; color: #9ca3af;">
                      © ${new Date().getFullYear()} Hisab Barabar
                    </p>
                    <p style="margin: 0; font-size: 13px; color: #9ca3af;">
                      <a href="mailto:support@hisabbarabar.com" style="color: #6b7280; text-decoration: none;">Contact Support</a>
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error }
  }
}

export async function sendPasswordResetEmail(email: string, otp: string) {
  const mailOptions = {
    from: '"Hisab Barabar" <notifications@hisabbarabar.qzz.io>',
    to: email,
    subject: 'Reset Your Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0; padding: 0;">
          <tr>
            <td align="center" style="padding: 48px 20px;">
              <table role="presentation" style="max-width: 560px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                
                <!-- Header -->
                <tr>
                  <td style="padding: 48px 40px 32px; text-align: left; border-bottom: 1px solid #e5e7eb;">
                    <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #111827; letter-spacing: -0.02em;">Hisab Barabar</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 12px; font-size: 24px; font-weight: 600; color: #111827; line-height: 1.3;">Reset your password</h2>
                    <p style="margin: 0 0 32px; font-size: 15px; line-height: 1.6; color: #6b7280;">
                      Use this code to reset your password and regain access to your account:
                    </p>
                    
                    <!-- OTP Code -->
                    <div style="text-align: center; margin: 0 0 32px;">
                      <div style="display: inline-block; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px 32px;">
                        <span style="font-size: 32px; font-weight: 600; color: #111827; letter-spacing: 8px; font-family: 'Courier New', Courier, monospace;">${otp}</span>
                      </div>
                      <p style="margin: 16px 0 0; font-size: 13px; color: #9ca3af;">This code expires in 10 minutes</p>
                    </div>
                    
                    <!-- Security Notice -->
                    <div style="background-color: #fef2f2; border-left: 3px solid #ef4444; padding: 16px; border-radius: 4px; margin: 0 0 24px;">
                      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #991b1b;">
                        <strong>Security reminder:</strong> Never share this code with anyone. Hisab Barabar will never ask for your verification code.
                      </p>
                    </div>
                    
                    <!-- Divider -->
                    <div style="border-top: 1px solid #e5e7eb; margin: 32px 0;"></div>
                    
                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                      If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 32px 40px; background-color: #f9fafb; text-align: center;">
                    <p style="margin: 0 0 8px; font-size: 13px; color: #9ca3af;">
                      © ${new Date().getFullYear()} Hisab Barabar
                    </p>
                    <p style="margin: 0; font-size: 13px; color: #9ca3af;">
                      <a href="mailto:support@hisabbarabar.com" style="color: #6b7280; text-decoration: none;">Contact Support</a>
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error }
  }
}
