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
      </head>
      <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f5f3ff 0%, #fce7f3 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 60px 20px;">
              <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 20px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); overflow: hidden;">
                
                <!-- Brand Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #6200EE 0%, #E91E63 100%); padding: 48px 40px; text-align: center;">
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td align="center">
                          <h1 style="margin: 0 0 8px; font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Hisab Barabar</h1>
                          <p style="margin: 0; font-size: 15px; color: rgba(255, 255, 255, 0.9); font-weight: 500;">Split bills, not friendships</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 48px 40px;">
                    <h2 style="margin: 0 0 16px; font-size: 26px; font-weight: 700; background: linear-gradient(135deg, #6200EE 0%, #E91E63 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Welcome aboard! 🎉</h2>
                    <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.6; color: #4b5563;">
                      Thank you for signing up. To get started and verify your email address, please use the verification code below:
                    </p>
                    
                    <!-- OTP Code Box -->
                    <div style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border-radius: 16px; padding: 32px; text-align: center; margin: 0 0 32px; border: 2px solid #e5e7eb;">
                      <p style="margin: 0 0 16px; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; color: #6b7280;">Your Verification Code</p>
                      <div style="background-color: #ffffff; border: 3px solid transparent; background-image: linear-gradient(white, white), linear-gradient(135deg, #6200EE 0%, #E91E63 100%); background-origin: border-box; background-clip: padding-box, border-box; border-radius: 12px; padding: 24px; display: inline-block; margin: 0 auto;">
                        <span style="font-size: 40px; font-weight: 700; background: linear-gradient(135deg, #6200EE 0%, #E91E63 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; letter-spacing: 12px; font-family: 'Courier New', Courier, monospace;">${otp}</span>
                      </div>
                      <p style="margin: 16px 0 0; font-size: 14px; color: #9ca3af;">⏰ Expires in 10 minutes</p>
                    </div>
                    
                    <!-- Info Box -->
                    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 8px; margin: 0 0 32px;">
                      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #78350f;">
                        <strong>💡 Tip:</strong> Keep this code private and never share it with anyone.
                      </p>
                    </div>
                    
                    <div style="border-top: 2px solid #f3f4f6; padding-top: 24px;">
                      <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #6b7280;">
                        Didn't request this? You can safely ignore this email.
                      </p>
                      <p style="margin: 0; font-size: 14px; color: #6b7280;">
                        Need help? <a href="mailto:support@hisabbarabar.com" style="color: #6200EE; text-decoration: none; font-weight: 600;">Contact our support team</a>
                      </p>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); padding: 32px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 12px; font-size: 14px; color: #6b7280;">
                      © ${new Date().getFullYear()} Hisab Barabar. All rights reserved.
                    </p>
                    <div style="margin: 16px 0 0;">
                      <a href="#" style="display: inline-block; margin: 0 8px; color: #9ca3af; text-decoration: none; font-size: 12px;">Privacy Policy</a>
                      <span style="color: #d1d5db;">•</span>
                      <a href="#" style="display: inline-block; margin: 0 8px; color: #9ca3af; text-decoration: none; font-size: 12px;">Terms of Service</a>
                    </div>
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
      </head>
      <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f5f3ff 0%, #fce7f3 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 60px 20px;">
              <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 20px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); overflow: hidden;">
                
                <!-- Brand Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #6200EE 0%, #E91E63 100%); padding: 48px 40px; text-align: center;">
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td align="center">
                          <h1 style="margin: 0 0 8px; font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Hisab Barabar</h1>
                          <p style="margin: 0; font-size: 15px; color: rgba(255, 255, 255, 0.9); font-weight: 500;">Split bills, not friendships</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 48px 40px;">
                    <h2 style="margin: 0 0 16px; font-size: 26px; font-weight: 700; background: linear-gradient(135deg, #6200EE 0%, #E91E63 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Reset Your Password 🔐</h2>
                    <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.6; color: #4b5563;">
                      We received a request to reset your password. Use the verification code below to create a new password:
                    </p>
                    
                    <!-- OTP Code Box -->
                    <div style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border-radius: 16px; padding: 32px; text-align: center; margin: 0 0 32px; border: 2px solid #e5e7eb;">
                      <p style="margin: 0 0 16px; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; color: #6b7280;">Password Reset Code</p>
                      <div style="background-color: #ffffff; border: 3px solid transparent; background-image: linear-gradient(white, white), linear-gradient(135deg, #6200EE 0%, #E91E63 100%); background-origin: border-box; background-clip: padding-box, border-box; border-radius: 12px; padding: 24px; display: inline-block; margin: 0 auto;">
                        <span style="font-size: 40px; font-weight: 700; background: linear-gradient(135deg, #6200EE 0%, #E91E63 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; letter-spacing: 12px; font-family: 'Courier New', Courier, monospace;">${otp}</span>
                      </div>
                      <p style="margin: 16px 0 0; font-size: 14px; color: #9ca3af;">⏰ Expires in 10 minutes</p>
                    </div>
                    
                    <!-- Security Warning -->
                    <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border-left: 4px solid #ef4444; padding: 16px 20px; border-radius: 8px; margin: 0 0 32px;">
                      <p style="margin: 0 0 8px; font-size: 14px; font-weight: 700; color: #991b1b;">
                        🔒 Security Alert
                      </p>
                      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #991b1b;">
                        Never share this code with anyone, including Hisab Barabar staff. We will never ask for your verification code.
                      </p>
                    </div>
                    
                    <div style="border-top: 2px solid #f3f4f6; padding-top: 24px;">
                      <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #6b7280;">
                        Didn't request a password reset? You can safely ignore this email and your password won't be changed.
                      </p>
                      <p style="margin: 0; font-size: 14px; color: #6b7280;">
                        Need help? <a href="mailto:support@hisabbarabar.com" style="color: #6200EE; text-decoration: none; font-weight: 600;">Contact our support team</a>
                      </p>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); padding: 32px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 12px; font-size: 14px; color: #6b7280;">
                      © ${new Date().getFullYear()} Hisab Barabar. All rights reserved.
                    </p>
                    <div style="margin: 16px 0 0;">
                      <a href="#" style="display: inline-block; margin: 0 8px; color: #9ca3af; text-decoration: none; font-size: 12px;">Privacy Policy</a>
                      <span style="color: #d1d5db;">•</span>
                      <a href="#" style="display: inline-block; margin: 0 8px; color: #9ca3af; text-decoration: none; font-size: 12px;">Terms of Service</a>
                    </div>
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
