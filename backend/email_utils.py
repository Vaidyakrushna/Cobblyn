import os
import smtplib
from email.message import EmailMessage
import logging
import asyncio

logger = logging.getLogger(__name__)

def _send_email_sync(to_email: str, subject: str, html_content: str):
    smtp_host = os.environ.get("SMTP_HOST")
    smtp_port = os.environ.get("SMTP_PORT", "587")
    smtp_user = os.environ.get("SMTP_USER")
    smtp_password = os.environ.get("SMTP_PASSWORD")
    smtp_from = os.environ.get("SMTP_FROM_EMAIL")

    if not all([smtp_host, smtp_user, smtp_password, smtp_from]):
        logger.warning(f"SMTP not fully configured. Missing credentials. Would have sent email to {to_email} with subject: '{subject}'")
        return

    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = smtp_from
    msg['To'] = to_email
    msg.set_content("Please enable HTML in your email client to view this message.")
    msg.add_alternative(html_content, subtype='html')

    try:
        # Use SMTP_SSL for port 465, or standard SMTP with starttls for 587
        if str(smtp_port) == "465":
            with smtplib.SMTP_SSL(smtp_host, int(smtp_port)) as server:
                server.login(smtp_user, smtp_password)
                server.send_message(msg)
        else:
            with smtplib.SMTP(smtp_host, int(smtp_port)) as server:
                server.ehlo()
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.send_message(msg)
        logger.info(f"Successfully sent email to {to_email} (Subject: {subject})")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")

async def send_verification_email(to_email: str, token: str):
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    verification_link = f"{frontend_url}/verify-email?token={token}"
    
    subject = "Verify your Cobblyn Account"
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a1a;">Welcome to Cobblyn!</h2>
        <p>Thank you for creating an account. To complete your registration and log in, please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{verification_link}" style="background-color: #1a1a1a; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">Verify Email</a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666; font-size: 0.9em;">{verification_link}</p>
        <p style="margin-top: 40px; font-size: 0.9em; color: #888;">If you didn't create this account, you can safely ignore this email.</p>
      </body>
    </html>
    """
    
    # Run synchronous SMTP code in a background thread to avoid blocking FastAPI
    await asyncio.to_thread(_send_email_sync, to_email, subject, html_content)

async def send_password_reset_email(to_email: str, token: str):
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    reset_link = f"{frontend_url}/reset-password?token={token}"
    
    subject = "Reset your Cobblyn Password"
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a1a;">Password Reset Request</h2>
        <p>We received a request to reset the password for your Cobblyn account. You can reset your password by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{reset_link}" style="background-color: #1a1a1a; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">Reset Password</a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666; font-size: 0.9em;">{reset_link}</p>
        <p style="margin-top: 40px; font-size: 0.9em; color: #888;">If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
      </body>
    </html>
    """
    
    await asyncio.to_thread(_send_email_sync, to_email, subject, html_content)
