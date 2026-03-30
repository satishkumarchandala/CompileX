"""
Email Service — Gmail SMTP
Provides a simple send_email() function used across the backend.

Environment variables:
  SMTP_HOST   = smtp.gmail.com        (default)
  SMTP_PORT   = 587                   (default)
  SMTP_USER   = your-gmail@gmail.com
  SMTP_PASS   = your-app-password     (Gmail App Password, NOT normal password)
  FROM_EMAIL  = your-gmail@gmail.com  (optional, falls back to SMTP_USER)
"""

import os
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)


def send_email(to_email: str, subject: str, body: str) -> bool:
    """
    Send a plain-text email via Gmail SMTP.

    Returns:
        True  — email sent successfully
        False — email failed (error is logged; caller should handle gracefully)
    """
    smtp_host = os.getenv('SMTP_HOST', 'smtp.gmail.com')
    smtp_port = int(os.getenv('SMTP_PORT', '587'))
    smtp_user = os.getenv('SMTP_USER', '')
    smtp_pass = os.getenv('SMTP_PASS', '')
    from_email = os.getenv('FROM_EMAIL', smtp_user)

    if not smtp_user or not smtp_pass:
        logger.warning(
            "Email not sent: SMTP_USER or SMTP_PASS is not configured. "
            "Set these in your .env file to enable email notifications."
        )
        return False

    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = from_email
        msg['To'] = to_email

        # Plain-text part
        text_part = MIMEText(body, 'plain', 'utf-8')
        msg.attach(text_part)

        # HTML part (simple styled version of the same body)
        html_body = f"""
        <html>
          <body style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: #f9f9f9; 
                        border-radius: 8px; padding: 30px; border: 1px solid #e0e0e0;">
              <h2 style="color: #667eea; margin-top: 0;">CompileX Platform</h2>
              <p style="white-space: pre-wrap; line-height: 1.6;">{body}</p>
              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
              <p style="color: #888; font-size: 12px;">
                This is an automated message from the CompileX e-learning platform.
              </p>
            </div>
          </body>
        </html>
        """
        html_part = MIMEText(html_body, 'html', 'utf-8')
        msg.attach(html_part)

        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(smtp_user, smtp_pass)
            server.sendmail(from_email, to_email, msg.as_string())

        logger.info("Email sent to %s | Subject: %s", to_email, subject)
        return True

    except smtplib.SMTPAuthenticationError:
        logger.error(
            "SMTP authentication failed for user '%s'. "
            "Make sure SMTP_PASS is a Gmail App Password, not your normal password.",
            smtp_user
        )
    except smtplib.SMTPException as exc:
        logger.error("SMTP error while sending email to %s: %s", to_email, exc)
    except Exception as exc:
        logger.error("Unexpected error sending email to %s: %s", to_email, exc)

    return False
