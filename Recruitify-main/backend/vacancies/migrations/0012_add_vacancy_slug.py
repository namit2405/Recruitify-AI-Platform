from django.db import migrations, models
from django.utils.text import slugify


def backfill_slugs(apps, schema_editor):
    Vacancy = apps.get_model('vacancies', 'Vacancy')
    seen = set()
    for v in Vacancy.objects.select_related('organization').order_by('id'):
        base = slugify(f"{v.title}-{v.organization.name}")[:270] or f"vacancy-{v.id}"
        slug = base
        n = 1
        while slug in seen:
            slug = f"{base}-{n}"
            n += 1
        seen.add(slug)
        v.slug = slug
        v.save(update_fields=['slug'])


class Migration(migrations.Migration):

    dependencies = [
        ('vacancies', '0011_application_google_calendar_event_id_and_more'),
    ]

    operations = [
        # Step 1: add without unique constraint so existing rows get empty string
        migrations.AddField(
            model_name='vacancy',
            name='slug',
            field=models.SlugField(max_length=300, blank=True, default=''),
            preserve_default=False,
        ),
        # Step 2: backfill slugs for all existing vacancies
        migrations.RunPython(backfill_slugs, migrations.RunPython.noop),
        # Step 3: now add the unique constraint
        migrations.AlterField(
            model_name='vacancy',
            name='slug',
            field=models.SlugField(max_length=300, unique=True, blank=True),
        ),
    ]
