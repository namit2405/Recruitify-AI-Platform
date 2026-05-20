from django.core.mail import send_mail
from django.conf import settings

STATUS_CONFIG = {
    'reviewing': {
        'subject': 'Your application is under review',
        'color': '#3B82F6',
        'icon': '🔍',
        'headline': 'Application Under Review',
        'body': 'Great news! Your application is currently being reviewed by the hiring team. We will keep you updated on any further developments.',
    },
    'shortlisted': {
        'subject': 'Congratulations! You have been shortlisted',
        'color': '#8B5CF6',
        'icon': '⭐',
        'headline': 'You\'ve Been Shortlisted!',
        'body': 'Excellent news! You have been shortlisted for this position. The hiring team was impressed with your profile and will be in touch soon regarding next steps.',
    },
    'interview_scheduled': {
        'subject': 'Interview scheduled for your application',
        'color': '#F59E0B',
        'icon': '📅',
        'headline': 'Interview Scheduled',
        'body': 'An interview has been scheduled for your application. Please log in to your Recruitify account to view the interview details including date, time, and location.',
    },
    'interview_completed': {
        'subject': 'Your interview has been completed',
        'color': '#06B6D4',
        'icon': '✅',
        'headline': 'Interview Completed',
        'body': 'Thank you for attending the interview. The hiring team is now evaluating all candidates and will get back to you with a decision soon.',
    },
    'rejected': {
        'subject': 'Update on your application',
        'color': '#EF4444',
        'icon': '📋',
        'headline': 'Application Status Update',
        'body': 'Thank you for your interest and the time you invested in applying. After careful consideration, the hiring team has decided to move forward with other candidates for this role. We encourage you to apply for future openings.',
    },
    'hired': {
        'subject': '🎉 Congratulations! You have been hired!',
        'color': '#10B981',
        'icon': '🎉',
        'headline': 'You\'re Hired!',
        'body': 'Congratulations! We are thrilled to inform you that you have been selected for this position. The organization will be in touch with you shortly regarding onboarding details.',
    },
}


def send_status_update_email(application, new_status):
    """Send a styled HTML email to the candidate when their application status changes."""
    config = STATUS_CONFIG.get(new_status)
    if not config:
        return  # No email for unknown statuses

    candidate_email = application.candidate.user.email
    candidate_name = application.candidate.name or 'Candidate'
    vacancy_title = application.vacancy.title
    org_name = application.vacancy.organization.name
    color = config['color']
    icon = config['icon']
    headline = config['headline']
    body_text = config['body']
    subject = f"{config['subject']} — {vacancy_title}"
    profile_url = f"{settings.FRONTEND_URL}/candidate/applications"

    html_message = f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:600px;width:100%;">
        <!-- Header -->
        <tr><td style="background:{color};padding:32px 40px;text-align:center;">
          <div style="font-size:48px;margin-bottom:8px;">{icon}</div>
          <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">{headline}</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px;">
          <p style="color:#374151;font-size:16px;margin:0 0 16px;">Hi <strong>{candidate_name}</strong>,</p>
          <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">{body_text}</p>
          <!-- Job Card -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:28px;">
            <tr><td style="padding:20px;">
              <p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Position</p>
              <p style="margin:0 0 12px;color:#111827;font-size:18px;font-weight:700;">{vacancy_title}</p>
              <p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Company</p>
              <p style="margin:0;color:#374151;font-size:15px;">{org_name}</p>
            </td></tr>
          </table>
          <!-- CTA Button -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="{profile_url}" style="display:inline-block;background:{color};color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">View Application Status</a>
            </td></tr>
          </table>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="color:#9ca3af;font-size:13px;margin:0;">This email was sent by <strong>Recruitify</strong> on behalf of {org_name}.</p>
          <p style="color:#9ca3af;font-size:12px;margin:8px 0 0;">© 2026 Recruitify AI Technologies Inc.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
"""

    plain_message = f"Hi {candidate_name},\n\n{body_text}\n\nPosition: {vacancy_title}\nCompany: {org_name}\n\nView your application: {profile_url}\n\n— Recruitify Team"

    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[candidate_email],
            html_message=html_message,
            fail_silently=False,
        )
        print(f"[Email] Status update sent to {candidate_email} — {new_status}")
    except Exception as e:
        print(f"[Email] Failed to send status update email: {e}")


def send_interview_scheduled_email(application, is_reminder=False):
    """Send interview details email to candidate. Pass is_reminder=True for 24h reminder."""
    candidate_email = application.candidate.user.email
    candidate_name = application.candidate.name or 'Candidate'
    vacancy_title = application.vacancy.title
    org_name = application.vacancy.organization.name
    profile_url = f"{settings.FRONTEND_URL}/candidate/applications"

    interview_type = application.interview_type or 'online'
    interview_dt = application.interview_datetime
    date_str = interview_dt.strftime('%A, %B %d, %Y at %I:%M %p') if interview_dt else 'TBD'

    if interview_type == 'online':
        location_html = f'<p style="margin:0;color:#374151;font-size:15px;"><a href="{application.interview_meet_link}" style="color:#3B82F6;">{application.interview_meet_link or "Link will be shared"}</a></p>'
        location_label = 'Meeting Link'
    else:
        location_html = f'<p style="margin:0;color:#374151;font-size:15px;">{application.interview_location or "Location TBD"}</p>'
        location_label = 'Location'

    if is_reminder:
        subject = f"⏰ Reminder: Interview tomorrow for {vacancy_title}"
        headline = "Interview Reminder — Tomorrow!"
        body_text = f"This is a friendly reminder that your interview for <strong>{vacancy_title}</strong> at <strong>{org_name}</strong> is scheduled for tomorrow."
    else:
        subject = f"📅 Interview Scheduled — {vacancy_title}"
        headline = "Your Interview is Scheduled"
        body_text = f"Great news! An interview has been scheduled for your application to <strong>{vacancy_title}</strong> at <strong>{org_name}</strong>. Please review the details below."

    html_message = f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:600px;width:100%;">
        <tr><td style="background:#F59E0B;padding:32px 40px;text-align:center;">
          <div style="font-size:48px;margin-bottom:8px;">📅</div>
          <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">{headline}</h1>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="color:#374151;font-size:16px;margin:0 0 16px;">Hi <strong>{candidate_name}</strong>,</p>
          <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">{body_text}</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:28px;">
            <tr><td style="padding:20px;">
              <p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;">Position</p>
              <p style="margin:0 0 16px;color:#111827;font-size:18px;font-weight:700;">{vacancy_title}</p>
              <p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;">Company</p>
              <p style="margin:0 0 16px;color:#374151;font-size:15px;">{org_name}</p>
              <p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;">Date & Time</p>
              <p style="margin:0 0 16px;color:#374151;font-size:15px;font-weight:600;">{date_str}</p>
              <p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;">{location_label}</p>
              {location_html}
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="{profile_url}" style="display:inline-block;background:#F59E0B;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">View Interview Details</a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="color:#9ca3af;font-size:13px;margin:0;">This email was sent by <strong>Recruitify</strong> on behalf of {org_name}.</p>
          <p style="color:#9ca3af;font-size:12px;margin:8px 0 0;">© 2026 Recruitify AI Technologies Inc.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
"""
    plain_message = f"Hi {candidate_name},\n\n{body_text}\n\nPosition: {vacancy_title}\nCompany: {org_name}\nDate & Time: {date_str}\n\nView details: {profile_url}\n\n— Recruitify Team"

    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[candidate_email],
            html_message=html_message,
            fail_silently=False,
        )
        print(f"[Email] Interview {'reminder' if is_reminder else 'scheduled'} sent to {candidate_email}")
    except Exception as e:
        print(f"[Email] Failed to send interview email: {e}")
