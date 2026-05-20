"""
Email service for sending contact form messages
"""
from django.core.mail import send_mail
from django.conf import settings


def send_contact_email(name, email, message):
    """
    Send contact form email to support
    """
    subject = f"Contact Form Message from {name}"
    
    email_body = f"""
New contact form submission:

From: {name}
Email: {email}

Message:
{message}

---
This email was sent from the Recruitify contact form.
"""
    
    try:
        send_mail(
            subject=subject,
            message=email_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=['recruitify26@gmail.com'],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False
