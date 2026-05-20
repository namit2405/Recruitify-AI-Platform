# Generated migration for conversation requests feature

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('chat', '0003_message_reply_delete'),
    ]

    operations = [
        migrations.AddField(
            model_name='conversation',
            name='status',
            field=models.CharField(
                choices=[('pending', 'Pending'), ('accepted', 'Accepted'), ('rejected', 'Rejected')],
                default='accepted',  # Existing conversations are accepted
                max_length=10
            ),
        ),
        migrations.AddField(
            model_name='conversation',
            name='initiated_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='initiated_conversations',
                to=settings.AUTH_USER_MODEL
            ),
        ),
        migrations.AddIndex(
            model_name='conversation',
            index=models.Index(fields=['status'], name='chat_conver_status_idx'),
        ),
    ]
