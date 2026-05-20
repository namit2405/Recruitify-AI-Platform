import requests
import json

BASE_URL = 'http://127.0.0.1:8000/api'
AUTH_URL = f'{BASE_URL}/auth'

# 1. Register/Login as Organization
org_email = "test_org@example.com"
password = "password123"

print(f"Logging in as {org_email}...")
login_response = requests.post(f'{AUTH_URL}/login/', json={
    "email": org_email,
    "password": password
})

if login_response.status_code != 200:
    print("Login failed, trying to register...")
    reg_response = requests.post(f'{AUTH_URL}/register/', json={
        "email": org_email,
        "password": password,
        "user_type": "organization"
    })
    if reg_response.status_code == 201:
        print("Registration successful!")
        token = reg_response.json()['access']
        
        # Create Organization Profile
        print("Creating Organization Profile...")
        headers = {'Authorization': f'Bearer {token}'}
        profile_response = requests.post(f'{AUTH_URL}/profile/organization/', headers=headers, json={
            "name": "Test Corp",
            "contact_email": org_email
        })
        print(f"Profile creation status: {profile_response.status_code}")
    else:
        print(f"Registration failed: {reg_response.text}")
        exit(1)
else:
    print("Login successful!")
    token = login_response.json()['access']

headers = {'Authorization': f'Bearer {token}'}

# 2. Post a Vacancy
print("\nPosting a vacancy...")
vacancy_data = {
    "title": "Senior Developer",
    "description": "We need a developer.",
    "requirements": ["Python", "Django", "React"],
    "location": "Remote",
    "salary_range": "$100k - $120k",
    "is_public": True,
    "status": "open"
}

response = requests.post(f'{BASE_URL}/vacancies/', headers=headers, json=vacancy_data)

print(f"Status Code: {response.status_code}")
print(f"Response: {response.text}")

if response.status_code == 201:
    print("\nVacancy created successfully!")
    vacancy_id = response.json()['id']
    
    # 3. Verify it exists in the list
    print("\nVerifying vacancy in list...")
    list_response = requests.get(f'{BASE_URL}/vacancies/', headers=headers)
    print(f"List Response Status: {list_response.status_code}")
    vacancies = list_response.json()
    print(f"Total vacancies found: {len(vacancies)}")
    
    found = any(v['id'] == vacancy_id for v in vacancies)
    if found:
        print("SUCCESS: Vacancy found in the list.")
    else:
        print("FAILURE: Vacancy NOT found in the list.")
else:
    print("Failed to create vacancy.")
