import random
import string
from django.db import models
from django.utils.text import slugify
from accounts.models import User


def _rand_slug(n=10):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=n))


class Post(models.Model):
    """
    A professional update post — text + optional image.
    Can be authored by any user (candidate or organization).
    """
    POST_TYPES = [
        ('update',      'Professional Update'),
        ('hiring',      'Hiring Announcement'),
        ('achievement', 'Achievement'),
        ('article',     'Article / Insight'),
        ('question',    'Question'),
    ]

    author      = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    content     = models.TextField()
    image       = models.ImageField(upload_to='feed/images/', blank=True, null=True)
    post_type   = models.CharField(max_length=20, choices=POST_TYPES, default='update')
    slug        = models.SlugField(max_length=60, unique=True, blank=True)

    # Tags / skills for feed personalisation
    tags        = models.JSONField(default=list, blank=True,
                                   help_text='List of skill/topic tags for feed ranking')

    # Repost support
    original_post = models.ForeignKey(
        'self', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='reposts'
    )

    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes  = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['author', '-created_at']),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = _rand_slug(12)
            while Post.objects.filter(slug=self.slug).exists():
                self.slug = _rand_slug(12)
        super().save(*args, **kwargs)

    @property
    def likes_count(self):
        return self.likes.count()

    @property
    def comments_count(self):
        return self.comments.filter(parent=None).count()

    @property
    def reposts_count(self):
        return self.reposts.count()

    def __str__(self):
        return f"{self.author.email} — {self.content[:60]}"


class PostLike(models.Model):
    user    = models.ForeignKey(User, on_delete=models.CASCADE, related_name='post_likes')
    post    = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'post')
        indexes = [models.Index(fields=['post', 'user'])]

    def __str__(self):
        return f"{self.user.email} likes post {self.post.id}"


class PostComment(models.Model):
    author  = models.ForeignKey(User, on_delete=models.CASCADE, related_name='post_comments')
    post    = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    parent  = models.ForeignKey(
        'self', null=True, blank=True,
        on_delete=models.CASCADE, related_name='replies'
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']
        indexes  = [models.Index(fields=['post', 'parent', 'created_at'])]

    def __str__(self):
        return f"{self.author.email} on post {self.post.id}: {self.content[:40]}"
