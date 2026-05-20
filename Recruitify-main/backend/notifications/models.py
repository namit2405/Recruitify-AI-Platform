from django.db import models
from accounts.models import User


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('application_status', 'Application Status Changed'),
        ('new_application', 'New Application Received'),
        ('new_vacancy', 'New Vacancy Posted'),
        ('vacancy_closed', 'Vacancy Closed'),
        ('application_submitted', 'Application Submitted'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    
    # Optional references
    application_id = models.IntegerField(null=True, blank=True)
    vacancy_id = models.IntegerField(null=True, blank=True)
    
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.title}"
