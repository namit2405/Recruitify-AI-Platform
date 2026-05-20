"""
Migrate data from SQLite (development) to PostgreSQL (production)
Run this script in the DEVELOPMENT environment first to export data
"""
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'recruitify_backend.settings')
django.setup()

from django.core.management import call_command

def export_data():
    """Export all data from SQLite database"""
    
    print("Exporting data from SQLite database...")
    
    # Export all data except contenttypes and permissions (auto-generated)
    with open('exported_data.json', 'w', encoding='utf-8') as f:
        call_command(
            'dumpdata',
            '--natural-foreign',
            '--natural-primary',
            '--exclude=contenttypes',
            '--exclude=auth.Permission',
            '--indent=2',
            stdout=f
        )
    
    print("✓ Data exported to exported_data.json")
    print("\nNext steps:")
    print("1. Copy exported_data.json to production backend folder")
    print("2. Copy media folder to production")
    print("3. Run import script in production")

if __name__ == '__main__':
    export_data()
