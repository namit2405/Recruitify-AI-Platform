# accounts/otp_manager.py

import random
import string
from datetime import timedelta
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from .models import OTPVerification


def generate_otp(length=6):
    """Generate a random numeric OTP"""
    return ''.join(random.choices(string.digits, k=length))


def create_otp(email, purpose='registration'):
    """
    Create or update OTP for an email.
    Purpose can be 'registration' or 'login'
    """
    # Delete any existing OTPs for this email and purpose
    OTPVerification.objects.filter(email=email, purpose=purpose).delete()
    
    # Generate new OTP
    otp_code = generate_otp()
    expires_at = timezone.now() + timedelta(minutes=10)  # 10 minutes expiry
    
    # Create OTP record
    otp_obj = OTPVerification.objects.create(
        email=email,
        otp_code=otp_code,
        purpose=purpose,
        expires_at=expires_at
    )
    
    return otp_obj


def send_otp_email(email, otp_code, purpose='registration'):
    """Send OTP via email"""
    if purpose == 'registration':
        subject = 'Verify Your Email - Recruitify'
        message = f'''
Hello,

Thank you for registering with Recruitify!

Your verification code is: {otp_code}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

Best regards,
Recruitify Team
        '''
    elif purpose == 'password_reset':
        subject = 'Password Reset Code - Recruitify'
        message = f'''
Hello,

You requested to reset your password for your Recruitify account.

Your password reset code is: {otp_code}

This code will expire in 10 minutes.

If you didn't request a password reset, please ignore this email and your password will remain unchanged.

Best regards,
Recruitify Team
        '''
    else:  # login
        subject = 'Login Verification Code - Recruitify'
        message = f'''
Hello,

Someone is trying to log in to your Recruitify account.

Your verification code is: {otp_code}

This code will expire in 10 minutes.

If you didn't attempt to log in, please secure your account immediately.

Best regards,
Recruitify Team
        '''
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False


def verify_otp(email, otp_code, purpose='registration'):
    """
    Verify OTP code.
    Returns (success: bool, message: str)
    """
    print(f"[DEBUG] Verifying OTP:")
    print(f"  Email: {email}")
    print(f"  OTP Code: {otp_code}")
    print(f"  Purpose: {purpose}")
    
    try:
        otp_obj = OTPVerification.objects.get(
            email=email,
            otp_code=otp_code,
            purpose=purpose,
            is_verified=False
        )
        
        print(f"[DEBUG] OTP found in database")
        print(f"  Created: {otp_obj.created_at}")
        print(f"  Expires: {otp_obj.expires_at}")
        print(f"  Current time: {timezone.now()}")
        
        # Check if expired
        if timezone.now() > otp_obj.expires_at:
            print(f"[DEBUG] OTP expired")
            return False, "OTP has expired. Please request a new one."
        
        # Mark as verified
        otp_obj.is_verified = True
        otp_obj.verified_at = timezone.now()
        otp_obj.save()
        
        print(f"[DEBUG] OTP verified successfully")
        return True, "OTP verified successfully"
        
    except OTPVerification.DoesNotExist:
        print(f"[DEBUG] OTP not found in database")
        # Check if OTP exists at all
        all_otps = OTPVerification.objects.filter(email=email, purpose=purpose)
        print(f"[DEBUG] Found {all_otps.count()} OTP(s) for this email/purpose:")
        for otp in all_otps:
            print(f"  - Code: {otp.otp_code}, Verified: {otp.is_verified}, Expires: {otp.expires_at}")
        return False, "Invalid OTP code"


def is_email_verified(email):
    """Check if email has been verified via OTP"""
    return OTPVerification.objects.filter(
        email=email,
        purpose='registration',
        is_verified=True
    ).exists()
