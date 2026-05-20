"""
Export database data with proper UTF-8 encoding
Run this in DEVELOPMENT folder
"""
import os
import sys
import django

# Force UTF-8 encoding
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'recruitify_backend.settings')
django.setup()

from django.core.management import call_command
import io

def export_data():
    """Export data with UTF-8 encoding"""
    
    print("Exporting database data...")
    
    try:
        # Export to file with UTF-8 encoding
        with open('data_export.json', 'w', encoding='utf-8') as f:
            call_command(
                'dumpdata',
                '--natural-foreign',
                '--natural-primary',
                '-e', 'contenttypes',
                '-e', 'auth.Permission',
                stdout=f
            )
        
        # Check file size
        import os
        size = os.path.getsize('data_export.json') / 1024
        print(f"✓ Export successful: {size:.1f} KB")
        print(f"✓ File saved: data_export.json")
        print("\nNext steps:")
        print("1. Copy data_export.json to C:\\inetpub\\recruitify\\backend\\")
        print("2. Run: python manage.py loaddata data_export.json")
        
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    export_data()
