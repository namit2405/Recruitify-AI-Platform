# Generated migration to add slugs

from django.db import migrations, models
from django.utils.text import slugify
import random
import string


def generate_unique_slug(name, model_class, existing_slugs):
    """Generate a unique slug for a given name"""
    base_slug = slugify(name)[:50] if name else 'user'
    
    # Add random suffix to ensure uniqueness
    while True:
        random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
        slug = f"{base_slug}-{random_suffix}"
        if slug not in existing_slugs:
            existing_slugs.add(slug)
            return slug


def populate_slugs(apps, schema_editor):
    """Populate slug fields for existing records"""
    Candidate = apps.get_model('accounts', 'Candidate')
    Organization = apps.get_model('accounts', 'Organization')
    
    # Generate slugs for candidates
    candidate_slugs = set()
    for candidate in Candidate.objects.all():
        candidate.slug = generate_unique_slug(candidate.name, Candidate, candidate_slugs)
        candidate.save()
    
    # Generate slugs for organizations
    org_slugs = set()
    for org in Organization.objects.all():
        org.slug = generate_unique_slug(org.name, Organization, org_slugs)
        org.save()


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0011_employment_is_visible'),
    ]

    operations = [
        # Add slug fields as nullable first
        migrations.AddField(
            model_name='candidate',
            name='slug',
            field=models.SlugField(blank=True, help_text='URL-friendly identifier', max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='organization',
            name='slug',
            field=models.SlugField(blank=True, help_text='URL-friendly identifier', max_length=255, null=True),
        ),
        # Populate slugs for existing records
        migrations.RunPython(populate_slugs, reverse_code=migrations.RunPython.noop),
        # Make slug fields unique and non-nullable
        migrations.AlterField(
            model_name='candidate',
            name='slug',
            field=models.SlugField(blank=True, help_text='URL-friendly identifier', max_length=255, unique=True),
        ),
        migrations.AlterField(
            model_name='organization',
            name='slug',
            field=models.SlugField(blank=True, help_text='URL-friendly identifier', max_length=255, unique=True),
        ),
    ]
