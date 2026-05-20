from .models import Notification


def create_notification(user, notification_type, title, message, application_id=None, vacancy_id=None):
    """
    Helper function to create a notification
    """
    return Notification.objects.create(
        user=user,
        notification_type=notification_type,
        title=title,
        message=message,
        application_id=application_id,
        vacancy_id=vacancy_id,
    )


def notify_application_status_change(application, old_status, new_status):
    """
    Notify candidate when their application status changes
    """
    candidate_user = application.candidate.user
    vacancy_title = application.vacancy.title
    
    status_messages = {
        'reviewing': f'Your application for {vacancy_title} is now being reviewed.',
        'shortlisted': f'Congratulations! You have been shortlisted for {vacancy_title}.',
        'rejected': f'Unfortunately, your application for {vacancy_title} was not successful.',
        'hired': f'Congratulations! You have been hired for {vacancy_title}!',
    }
    
    message = status_messages.get(new_status, f'Your application status for {vacancy_title} has been updated to {new_status}.')
    
    return create_notification(
        user=candidate_user,
        notification_type='application_status',
        title=f'Application Status Updated',
        message=message,
        application_id=application.id,
        vacancy_id=application.vacancy.id,
    )


def notify_new_application(application):
    """
    Notify organization when a new application is received
    """
    org_user = application.vacancy.organization.user
    candidate_name = application.candidate.name
    vacancy_title = application.vacancy.title
    
    return create_notification(
        user=org_user,
        notification_type='new_application',
        title='New Application Received',
        message=f'{candidate_name} has applied for {vacancy_title}.',
        application_id=application.id,
        vacancy_id=application.vacancy.id,
    )


def notify_application_submitted(application):
    """
    Notify candidate when they successfully submit an application
    """
    candidate_user = application.candidate.user
    vacancy_title = application.vacancy.title
    org_name = application.vacancy.organization.name
    
    return create_notification(
        user=candidate_user,
        notification_type='application_submitted',
        title='Application Submitted Successfully',
        message=f'Your application for {vacancy_title} at {org_name} has been submitted successfully.',
        application_id=application.id,
        vacancy_id=application.vacancy.id,
    )


def notify_new_vacancy(vacancy, candidate_users=None):
    """
    Notify candidates when a new vacancy is posted
    Can notify specific candidates or all candidates
    """
    notifications = []
    
    if candidate_users is None:
        # Notify all candidates
        from accounts.models import User
        candidate_users = User.objects.filter(user_type='candidate')
    
    for user in candidate_users:
        notification = create_notification(
            user=user,
            notification_type='new_vacancy',
            title='New Job Posted',
            message=f'A new position for {vacancy.title} has been posted by {vacancy.organization.name}.',
            vacancy_id=vacancy.id,
        )
        notifications.append(notification)
    
    return notifications


def notify_vacancy_closed(vacancy):
    """
    Notify candidates with pending applications when a vacancy is closed
    """
    from vacancies.models import Application
    
    applications = Application.objects.filter(
        vacancy=vacancy,
        status__in=['applied', 'reviewing']
    )
    
    notifications = []
    for application in applications:
        notification = create_notification(
            user=application.candidate.user,
            notification_type='vacancy_closed',
            title='Vacancy Closed',
            message=f'The position for {vacancy.title} has been closed. Your application status: {application.status}.',
            application_id=application.id,
            vacancy_id=vacancy.id,
        )
        notifications.append(notification)
    
    return notifications
