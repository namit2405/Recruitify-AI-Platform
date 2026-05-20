import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'recruitify_backend.settings')
django.setup()

from vacancies.views import BrowseOrganizationResumesView
from django.test import RequestFactory
from accounts.models import User

user = User.objects.get(user_type='organization')
factory = RequestFactory()
request = factory.get('/api/resumes/browse/')
request.user = user

view = BrowseOrganizationResumesView()
response = view.get(request)

print(f'Total vacancies: {response.data["total_vacancies"]}')
print(f'Total resumes: {response.data["total_resumes"]}')
print('\nVacancies:')
for v in response.data['vacancies']:
    print(f'  - {v["title"]}: {v["total_resumes"]} resumes')
    for cat in v['categories']:
        print(f'      {cat["name"]}: {cat["count"]} resumes')
