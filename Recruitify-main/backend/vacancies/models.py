from django.db import models
from django.utils.text import slugify
from accounts.models import Organization, Candidate
import random
import string


def _rand_suffix(n=8):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=n))


class Vacancy(models.Model):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='vacancies'
    )

    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=300, unique=True, blank=True)
    description = models.TextField()

    # --- ML-relevant structured fields
    required_skills = models.JSONField(default=list)
    education_required = models.JSONField(default=list)
    job_title_aliases = models.JSONField(default=list)
    keywords = models.JSONField(default=list)

    min_experience_years = models.FloatField(default=0)
    max_experience_years = models.FloatField(null=True, blank=True)

    # --- General vacancy fields
    location = models.CharField(max_length=255, blank=True, null=True)
    salary_range = models.CharField(max_length=255, blank=True, null=True)
    benefits = models.TextField(blank=True, null=True)
    experience_level = models.CharField(max_length=100, blank=True, null=True)

    is_public = models.BooleanField(default=True)
    passcode = models.CharField(max_length=10, blank=True, null=True)  # For private vacancies
    status = models.CharField(
        max_length=20,
        default='open',
        choices=[('open', 'Open'), ('closed', 'Closed')]
    )

    allowed_candidates = models.JSONField(default=list)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(f"{self.title}-{self.organization.name}")[:270]
            slug = base
            n = 1
            while Vacancy.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{n}"
                n += 1
            self.slug = slug
        super().save(*args, **kwargs)


class Application(models.Model):
    STATUS_CHOICES = (
        ('applied', 'Applied'),
        ('reviewing', 'Reviewing'),
        ('shortlisted', 'Shortlisted'),
        ('interview_scheduled', 'Interview Scheduled'),
        ('interview_completed', 'Interview Completed'),
        ('rejected', 'Rejected'),
        ('hired', 'Hired'),
    )
    
    INTERVIEW_TYPE_CHOICES = (
        ('online', 'Online Interview'),
        ('physical', 'Physical Interview'),
    )

    CATEGORY_CHOICES = (
        ('highly_preferred', 'Highly Preferred (60-100)'),
        ('mid_preference', 'Mid Preference (50-60)'),
        ('low_preference', 'Low Preference (25-50)'),
        ('no_visit', "Don't Need to Visit (0-25)"),
    )

    vacancy = models.ForeignKey(
        Vacancy,
        on_delete=models.CASCADE,
        related_name='applications'
    )
    candidate = models.ForeignKey(
        Candidate,
        on_delete=models.CASCADE,
        related_name='applications'
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='applied'
    )

    # 🔥 ML OUTPUT FIELDS (CRITICAL)
    final_score = models.FloatField(default=0.0)
    category = models.CharField(
        max_length=32,
        choices=CATEGORY_CHOICES,
        default='no_visit'
    )
    
    ml_result = models.JSONField(null=True, blank=True)
    
    # Self-test field
    is_self_test = models.BooleanField(default=False)
    self_test_number = models.IntegerField(null=True, blank=True)
    
    # Interview fields
    interview_type = models.CharField(
        max_length=20,
        choices=INTERVIEW_TYPE_CHOICES,
        null=True,
        blank=True
    )
    interview_datetime = models.DateTimeField(null=True, blank=True)
    interview_location = models.CharField(max_length=500, null=True, blank=True)  # For physical interviews
    interview_meet_link = models.URLField(max_length=500, null=True, blank=True)  # For online interviews
    interview_panel = models.JSONField(default=list, blank=True)  # List of interviewer names/emails
    interview_notes = models.TextField(blank=True, null=True)  # Internal notes
    google_calendar_event_id = models.CharField(max_length=255, null=True, blank=True)  # For updating/canceling

    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    slug = models.SlugField(max_length=50, unique=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = _rand_suffix(12)
            while Application.objects.filter(slug=self.slug).exists():
                self.slug = _rand_suffix(12)
        super().save(*args, **kwargs)

    class Meta:
        # Allow multiple applications from same candidate only for self-tests
        # For regular applications, enforce uniqueness
        constraints = [
            models.UniqueConstraint(
                fields=['vacancy', 'candidate'],
                condition=models.Q(is_self_test=False),
                name='unique_application_per_candidate'
            )
        ]

    def __str__(self):
        if self.is_self_test:
            return f"Self Test #{self.self_test_number} - {self.vacancy.title}"
        return f"{self.candidate.name} - {self.vacancy.title}"



class JobOffer(models.Model):
    """
    Job offers sent by organizations to candidates
    """
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('withdrawn', 'Withdrawn'),
    )

    vacancy = models.ForeignKey(
        Vacancy,
        on_delete=models.CASCADE,
        related_name='job_offers'
    )
    candidate = models.ForeignKey(
        Candidate,
        on_delete=models.CASCADE,
        related_name='job_offers'
    )
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='sent_offers'
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    
    message = models.TextField(blank=True, null=True)  # Optional message from organization
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    slug = models.SlugField(max_length=50, unique=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = _rand_suffix(12)
            while JobOffer.objects.filter(slug=self.slug).exists():
                self.slug = _rand_suffix(12)
        super().save(*args, **kwargs)

    class Meta:
        unique_together = ('vacancy', 'candidate')  # One offer per vacancy-candidate pair
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.organization.name} → {self.candidate.name} for {self.vacancy.title}"
