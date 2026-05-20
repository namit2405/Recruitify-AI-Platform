# Generated migration for adding social media links

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0012_add_slugs'),
    ]

    operations = [
        migrations.AddField(
            model_name='candidate',
            name='website_url',
            field=models.URLField(blank=True, max_length=500, help_text='Personal website or portfolio'),
        ),
        migrations.AddField(
            model_name='candidate',
            name='github_url',
            field=models.URLField(blank=True, max_length=500, help_text='GitHub profile'),
        ),
        migrations.AddField(
            model_name='candidate',
            name='linkedin_url',
            field=models.URLField(blank=True, max_length=500, help_text='LinkedIn profile'),
        ),
        migrations.AddField(
            model_name='candidate',
            name='instagram_url',
            field=models.URLField(blank=True, max_length=500, help_text='Instagram profile'),
        ),
    ]
