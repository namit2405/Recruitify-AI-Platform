import random
import string
from django.db import migrations, models


def _rand_slug(n=12):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=n))


def populate_application_slugs(apps, schema_editor):
    Application = apps.get_model('vacancies', 'Application')
    used = set()
    for app in Application.objects.all():
        slug = _rand_slug()
        while slug in used:
            slug = _rand_slug()
        used.add(slug)
        app.slug = slug
        app.save(update_fields=['slug'])


def populate_joboffer_slugs(apps, schema_editor):
    JobOffer = apps.get_model('vacancies', 'JobOffer')
    used = set()
    for offer in JobOffer.objects.all():
        slug = _rand_slug()
        while slug in used:
            slug = _rand_slug()
        used.add(slug)
        offer.slug = slug
        offer.save(update_fields=['slug'])


class Migration(migrations.Migration):

    dependencies = [
        ('vacancies', '0012_add_vacancy_slug'),
    ]

    operations = [
        # Add nullable first so existing rows don't conflict
        migrations.AddField(
            model_name='application',
            name='slug',
            field=models.SlugField(blank=True, null=True, unique=False, max_length=50),
        ),
        migrations.AddField(
            model_name='joboffer',
            name='slug',
            field=models.SlugField(blank=True, null=True, unique=False, max_length=50),
        ),
        # Populate slugs for existing rows
        migrations.RunPython(populate_application_slugs, migrations.RunPython.noop),
        migrations.RunPython(populate_joboffer_slugs, migrations.RunPython.noop),
        # Now enforce unique + not null
        migrations.AlterField(
            model_name='application',
            name='slug',
            field=models.SlugField(blank=True, unique=True, max_length=50),
        ),
        migrations.AlterField(
            model_name='joboffer',
            name='slug',
            field=models.SlugField(blank=True, unique=True, max_length=50),
        ),
    ]
