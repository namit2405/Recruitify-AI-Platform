# Generated migration for adding accomplishments field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0013_add_social_links'),
    ]

    operations = [
        migrations.AddField(
            model_name='candidate',
            name='accomplishments',
            field=models.JSONField(default=list, help_text='List of accomplishments and achievements'),
        ),
    ]
