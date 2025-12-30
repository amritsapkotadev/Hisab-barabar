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
    subject: 'Verify Your Email - Hisab Barabar',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header with Gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #6200EE 0%, #E91E63 100%); padding: 40px; text-align: center; border-radius: 16px 16px 0 0;">
                    <div style="background-color: rgba(255, 255, 255, 0.2); width: 80px; height: 80px; border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                      <span style="font-size: 48px; color: #ffffff;">रु</span>
                    </div>
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Hisab Barabar</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 48px 40px;">
                    <h2 style="color: #1a1a1a; margin: 0 0 16px; font-size: 24px; font-weight: 600;">Verify Your Email Address</h2>
                    <p style="color: #666666; margin: 0 0 32px; font-size: 16px; line-height: 1.6;">
                      Thank you for signing up! To complete your registration, please use the verification code below:
                    </p>
                    
                    <!-- OTP Box -->
                    <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 12px; padding: 32px; text-align: center; margin: 0 0 32px;">
                      <p style="color: #666666; margin: 0 0 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Your Verification Code</p>
                      <div style="background-color: #ffffff; border: 2px solid #6200EE; border-radius: 8px; padding: 20px; display: inline-block;">
                        <span style="color: #6200EE; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</span>
                      </div>
                    </div>
                    
                    <!-- Info Box -->
                    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; border-radius: 4px; margin: 0 0 32px;">
                      <p style="color: #856404; margin: 0; font-size: 14px; line-height: 1.6;">
                        <strong>⏰ Important:</strong> This code will expire in 10 minutes for security reasons.
                      </p>
                    </div>
                    
                    <p style="color: #666666; margin: 0 0 8px; font-size: 14px; line-height: 1.6;">
                      If you didn't create an account with Hisab Barabar, you can safely ignore this email.
                    </p>
                    <p style="color: #666666; margin: 0; font-size: 14px; line-height: 1.6;">
                      Need help? Contact us at <a href="mailto:support@hisabbarabar.com" style="color: #6200EE; text-decoration: none;">support@hisabbarabar.com</a>
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 32px 40px; border-radius: 0 0 16px 16px; text-align: center;">
                    <p style="color: #9ca3af; margin: 0 0 12px; font-size: 12px;">
                      © ${new Date().getFullYear()} Hisab Barabar. All rights reserved.
                    </p>
                    <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                      Split bills, not friendships.
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
    subject: 'Reset Your Password - Hisab Barabar',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header with Gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #6200EE 0%, #E91E63 100%); padding: 40px; text-align: center; border-radius: 16px 16px 0 0;">
                    <div style="background-color: rgba(255, 255, 255, 0.2); width: 80px; height: 80px; border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                      <span style="font-size: 48px; color: #ffffff;">🔐</span>
                    </div>
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Password Reset Request</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 48px 40px;">
                    <h2 style="color: #1a1a1a; margin: 0 0 16px; font-size: 24px; font-weight: 600;">Reset Your Password</h2>
                    <p style="color: #666666; margin: 0 0 32px; font-size: 16px; line-height: 1.6;">
                      We received a request to reset your password. Use the verification code below to proceed:
                    </p>
                    
                    <!-- OTP Box -->
                    <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 12px; padding: 32px; text-align: center; margin: 0 0 32px;">
                      <p style="color: #666666; margin: 0 0 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Your Reset Code</p>
                      <div style="background-color: #ffffff; border: 2px solid #E91E63; border-radius: 8px; padding: 20px; display: inline-block;">
                        <span style="color: #E91E63; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</span>
                      </div>
                    </div>
                    
                    <!-- Warning Box -->
                    <div style="background-color: #fee; border-left: 4px solid #dc3545; padding: 16px; border-radius: 4px; margin: 0 0 32px;">
                      <p style="color: #721c24; margin: 0 0 8px; font-size: 14px; line-height: 1.6;">
                        <strong>⚠️ Security Notice:</strong>
                      </p>
                      <p style="color: #721c24; margin: 0; font-size: 14px; line-height: 1.6;">
                        This code will expire in 10 minutes. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
                      </p>
                    </div>
                    
                    <p style="color: #666666; margin: 0 0 8px; font-size: 14px; line-height: 1.6;">
                      For your security, never share this code with anyone, including Hisab Barabar staff.
                    </p>
                    <p style="color: #666666; margin: 0; font-size: 14px; line-height: 1.6;">
                      Need help? Contact us at <a href="mailto:support@hisabbarabar.com" style="color: #6200EE; text-decoration: none;">support@hisabbarabar.com</a>
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 32px 40px; border-radius: 0 0 16px 16px; text-align: center;">
                    <p style="color: #9ca3af; margin: 0 0 12px; font-size: 12px;">
                      © ${new Date().getFullYear()} Hisab Barabar. All rights reserved.
                    </p>
                    <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                      Split bills, not friendships.
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
