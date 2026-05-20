#!/usr/bin/env python
"""
Test script for OTP functionality
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

from accounts.otp_manager import create_otp, verify_otp, send_otp_email


def test_otp_creation():
    print("=" * 50)
    print("Testing OTP Creation")
    print("=" * 50)
    
    email = "test@example.com"
    otp_obj = create_otp(email, purpose='registration')
    
    print(f"✅ OTP Created:")
    print(f"   Email: {otp_obj.email}")
    print(f"   Code: {otp_obj.otp_code}")
    print(f"   Purpose: {otp_obj.purpose}")
    print(f"   Expires: {otp_obj.expires_at}")
    print()
    
    return otp_obj


def test_otp_verification(email, otp_code):
    print("=" * 50)
    print("Testing OTP Verification")
    print("=" * 50)
    
    success, message = verify_otp(email, otp_code, purpose='registration')
    
    if success:
        print(f"✅ {message}")
    else:
        print(f"❌ {message}")
    print()
    
    return success


def test_invalid_otp(email):
    print("=" * 50)
    print("Testing Invalid OTP")
    print("=" * 50)
    
    success, message = verify_otp(email, "000000", purpose='registration')
    
    if not success:
        print(f"✅ Correctly rejected invalid OTP: {message}")
    else:
        print(f"❌ Should have rejected invalid OTP")
    print()


def test_email_sending(email, otp_code):
    print("=" * 50)
    print("Testing Email Sending")
    print("=" * 50)
    
    success = send_otp_email(email, otp_code, purpose='registration')
    
    if success:
        print(f"✅ Email sent successfully")
        print(f"   Check Django console for email content")
    else:
        print(f"❌ Failed to send email")
    print()


def main():
    print("\n🔐 OTP System Test Suite\n")
    
    # Test 1: Create OTP
    otp_obj = test_otp_creation()
    
    # Test 2: Send Email
    test_email_sending(otp_obj.email, otp_obj.otp_code)
    
    # Test 3: Verify with correct OTP
    test_otp_verification(otp_obj.email, otp_obj.otp_code)
    
    # Test 4: Try to verify again (should fail - already used)
    print("=" * 50)
    print("Testing Already Used OTP")
    print("=" * 50)
    success, message = verify_otp(otp_obj.email, otp_obj.otp_code, purpose='registration')
    if not success:
        print(f"✅ Correctly rejected already used OTP: {message}")
    else:
        print(f"❌ Should have rejected already used OTP")
    print()
    
    # Test 5: Invalid OTP
    test_invalid_otp(otp_obj.email)
    
    print("=" * 50)
    print("✅ All tests completed!")
    print("=" * 50)


if __name__ == "__main__":
    main()
