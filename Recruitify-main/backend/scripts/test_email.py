#!/usr/bin/env python
"""
Test email sending with Gmail SMTP
"""
import sys
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'recruitify_backend.settings')

import django
django.setup()

from django.core.mail import send_mail
from django.conf import settings

def test_email():
    print("=" * 50)
    print("Testing Email Configuration")
    print("=" * 50)
    print(f"Email Backend: {settings.EMAIL_BACKEND}")
    print(f"Email Host: {settings.EMAIL_HOST}")
    print(f"Email User: {settings.EMAIL_HOST_USER}")
    print(f"From Email: {settings.DEFAULT_FROM_EMAIL}")
    print()
    
    # Get recipient email
    recipient = input("Enter your email to receive test OTP: ").strip()
    
    if not recipient:
        print("❌ No email provided")
        return
    
    print(f"\nSending test email to: {recipient}")
    print("Please wait...")
    
    try:
        send_mail(
            subject='Test Email - Recruitify OTP System',
            message='''
Hello!

This is a test email from Recruitify.

Your test verification code is: 123456

If you received this email, your email configuration is working correctly!

Best regards,
Recruitify Team
            ''',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            fail_silently=False,
        )
        
        print("\n✅ Email sent successfully!")
        print(f"   Check your inbox: {recipient}")
        print("   (Also check spam folder)")
        
    except Exception as e:
        print(f"\n❌ Failed to send email:")
        print(f"   Error: {e}")
        print("\nTroubleshooting:")
        print("1. Check EMAIL_HOST_USER in .env")
        print("2. Check EMAIL_HOST_PASSWORD in .env")
        print("3. Make sure 2-Step Verification is enabled")
        print("4. Make sure you're using App Password, not regular password")


if __name__ == "__main__":
    test_email()
