export const generateEmailTemplate = (resetPasswordUrl) => {
  return `
     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #000000; color: #ffffff;">
  <h2 style="color: #ffffff; text-align: center;">Reset Your Password</h2>
  <p style="font-size: 16px; color: #cccccc;">Dear User,</p>
  <p style="font-size: 16px; color: #cccccc;">
    You requested to reset your password. Please click the button below to proceed:
  </p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${resetPasswordUrl}"
       style="display: inline-block; font-size: 16px; font-weight: bold; color: #000000; text-decoration: none; padding: 12px 25px; border-radius: 5px; background-color: #ffffff;">
      Reset Password
    </a>
  </div>

  <p style="font-size: 16px; color: #cccccc;">
    If you did not request this, please ignore this email. The link will expire in 15 minutes.
  </p>

  <p style="font-size: 16px; color: #cccccc;">
    If the button above doesn’t work, copy and paste the following URL into your browser:
  </p>

  <p style="font-size: 14px; color: #ffffff; word-wrap: break-word; background-color: #111; padding: 10px; border-radius: 5px;">
    ${resetPasswordUrl}
  </p>

  <footer style="margin-top: 30px; text-align: center; font-size: 14px; color: #888888;">
    <p>Thank you,<br><strong>Ecommerce Team</strong></p>
    <p style="font-size: 12px; color: #555555;">
      This is an automated message. Please do not reply to this email.
    </p>
  </footer>
</div>
    `;
};
