"""
Seed script — adds 10 rows of realistic fake data to every table.
Run with:  python manage.py shell < seed_data.py
"""
import os, django, random
from datetime import date, timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'recruitify_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from accounts.models import (
    Organization, Candidate, Follow, Employment,
    TalentPool, UserPreferences, OTPVerification
)
from vacancies.models import Vacancy, Application, JobOffer
from chat.models import Conversation, Message, UserStatus
from notifications.models import Notification

User = get_user_model()

# ── helpers ──────────────────────────────────────────────────────────────────

def rdate(start_years_ago=5, end_years_ago=0):
    start = date.today() - timedelta(days=start_years_ago * 365)
    end   = date.today() - timedelta(days=end_years_ago * 365)
    return start + timedelta(days=random.randint(0, (end - start).days))

SKILLS_POOL = [
    ["Python", "Django", "REST APIs", "PostgreSQL"],
    ["React", "TypeScript", "Tailwind CSS", "Node.js"],
    ["Machine Learning", "scikit-learn", "pandas", "NumPy"],
    ["Java", "Spring Boot", "Microservices", "Docker"],
    ["DevOps", "Kubernetes", "CI/CD", "AWS"],
    ["Flutter", "Dart", "Firebase", "Android"],
    ["Data Analysis", "SQL", "Power BI", "Excel"],
    ["Cybersecurity", "Penetration Testing", "SIEM", "Networking"],
    ["UI/UX Design", "Figma", "Adobe XD", "Prototyping"],
    ["Project Management", "Agile", "Scrum", "JIRA"],
]

ORG_NAMES = [
    "TechNova Solutions", "BrightPath Consulting", "Apex Digital",
    "CloudSphere Inc", "InnovateTech", "DataBridge Corp",
    "NexGen Systems", "PrimeSoft Labs", "Velocity Ventures", "CodeCraft Studio"
]

CANDIDATE_NAMES = [
    "Arjun Sharma", "Priya Patel", "Rahul Verma", "Sneha Gupta",
    "Amit Joshi", "Kavya Nair", "Rohan Mehta", "Divya Singh",
    "Vikram Rao", "Ananya Iyer"
]

JOB_TITLES = [
    "Software Engineer", "Frontend Developer", "Data Scientist",
    "DevOps Engineer", "Product Manager", "Backend Developer",
    "ML Engineer", "QA Engineer", "UI/UX Designer", "Full Stack Developer"
]

LOCATIONS = [
    "Mumbai, India", "Bangalore, India", "Delhi, India", "Hyderabad, India",
    "Pune, India", "Chennai, India", "Kolkata, India", "Ahmedabad, India",
    "Jaipur, India", "Remote"
]

print("=" * 60)
print("Starting seed...")
print("=" * 60)

# ── 1. Organization Users + Profiles ─────────────────────────────────────────
print("\n[1/10] Creating Organizations...")
org_users = []
orgs = []
for i, name in enumerate(ORG_NAMES):
    email = f"org{i+1}@recruitify.dev"
    user, created = User.objects.get_or_create(
        email=email,
        defaults=dict(user_type='organization', is_active=True, email_verified=True)
    )
    if created:
        user.set_password("Test@1234")
        user.save()
    org_users.append(user)

    org, _ = Organization.objects.get_or_create(
        user=user,
        defaults=dict(
            name=name,
            description=f"{name} is a leading technology company focused on innovation.",
            contact_email=email,
            website=f"https://www.{name.lower().replace(' ', '')}.com",
            location=random.choice(LOCATIONS),
            phone=f"+91 9{random.randint(100000000, 999999999)}",
            established=random.randint(2005, 2020),
        )
    )
    orgs.append(org)
    print(f"  ✓ {name}")

# ── 2. Candidate Users + Profiles ────────────────────────────────────────────
print("\n[2/10] Creating Candidates...")
cand_users = []
cands = []
for i, name in enumerate(CANDIDATE_NAMES):
    email = f"candidate{i+1}@recruitify.dev"
    user, created = User.objects.get_or_create(
        email=email,
        defaults=dict(user_type='candidate', is_active=True, email_verified=True)
    )
    if created:
        user.set_password("Test@1234")
        user.save()
    cand_users.append(user)

    cand, _ = Candidate.objects.get_or_create(
        user=user,
        defaults=dict(
            name=name,
            email=email,
            phone=f"+91 9{random.randint(100000000, 999999999)}",
            address=random.choice(LOCATIONS),
            availability="Immediate",
            summary=f"Experienced professional with expertise in {', '.join(random.choice(SKILLS_POOL)[:2])}.",
            skills=random.choice(SKILLS_POOL),
            experience=[{
                "title": random.choice(JOB_TITLES),
                "company": random.choice(ORG_NAMES),
                "years": random.randint(1, 5)
            }],
            education=[{
                "degree": "B.Tech Computer Science",
                "institution": "IIT " + random.choice(["Bombay", "Delhi", "Madras", "Kanpur"]),
                "year": random.randint(2015, 2022)
            }],
            accomplishments=[f"Led a team of {random.randint(3,10)} engineers", "Reduced deployment time by 40%"],
            job_preferences=[random.choice(JOB_TITLES)],
            github_url=f"https://github.com/{name.lower().replace(' ', '')}",
            linkedin_url=f"https://linkedin.com/in/{name.lower().replace(' ', '-')}",
        )
    )
    cands.append(cand)
    print(f"  ✓ {name}")

# ── 3. UserPreferences ────────────────────────────────────────────────────────
print("\n[3/10] Creating UserPreferences...")
all_users = org_users + cand_users
for user in all_users:
    pref, created = UserPreferences.objects.get_or_create(
        user=user,
        defaults=dict(
            email_notifications=random.choice([True, False]),
            job_alerts=random.choice([True, False]),
            message_notifications=True,
            application_updates=True,
            weekly_digest=random.choice([True, False]),
            profile_visibility=random.choice(['public', 'public', 'connections']),
            show_email=random.choice([True, False]),
            show_phone=False,
            theme=random.choice(['light', 'dark', 'system']),
        )
    )
    if created:
        print(f"  ✓ Preferences for {user.email}")

# ── 4. Follow relationships ───────────────────────────────────────────────────
print("\n[4/10] Creating Follow relationships...")
follow_count = 0
for cand_user in cand_users:
    targets = random.sample(org_users, k=3)
    for target in targets:
        _, created = Follow.objects.get_or_create(follower=cand_user, following=target)
        if created:
            follow_count += 1
# Some orgs follow candidates too
for org_user in org_users[:5]:
    targets = random.sample(cand_users, k=2)
    for target in targets:
        _, created = Follow.objects.get_or_create(follower=org_user, following=target)
        if created:
            follow_count += 1
print(f"  ✓ {follow_count} follow relationships created")

# ── 5. Vacancies ──────────────────────────────────────────────────────────────
print("\n[5/10] Creating Vacancies...")
vacancies = []
for i in range(10):
    org = orgs[i % len(orgs)]
    title = JOB_TITLES[i]
    v, created = Vacancy.objects.get_or_create(
        title=title,
        organization=org,
        defaults=dict(
            description=f"We are looking for a talented {title} to join our team at {org.name}. "
                        f"You will work on cutting-edge projects and collaborate with a world-class team.",
            required_skills=random.choice(SKILLS_POOL),
            education_required=["B.Tech", "B.Sc Computer Science", "MCA"],
            job_title_aliases=[title, title.lower(), title.replace(" ", "_")],
            keywords=random.choice(SKILLS_POOL)[:3],
            min_experience_years=random.choice([0, 1, 2, 3]),
            max_experience_years=random.choice([5, 7, 10]),
            location=random.choice(LOCATIONS),
            salary_range=f"₹{random.randint(5,15)}L - ₹{random.randint(16,40)}L per annum",
            benefits="Health insurance, flexible hours, remote work options, annual bonus",
            experience_level=random.choice(["Entry Level", "Mid Level", "Senior Level"]),
            is_public=True,
            status='open',
        )
    )
    vacancies.append(v)
    if created:
        print(f"  ✓ {title} @ {org.name}")

# ── 6. Applications ───────────────────────────────────────────────────────────
print("\n[6/10] Creating Applications...")
app_count = 0
used_pairs = set()
statuses = ['applied', 'reviewing', 'shortlisted', 'interview_scheduled', 'rejected', 'hired']
for i, cand in enumerate(cands):
    # Each candidate applies to 1 vacancy
    vac = vacancies[i % len(vacancies)]
    pair = (vac.id, cand.id)
    if pair not in used_pairs:
        used_pairs.add(pair)
        score = round(random.uniform(20, 95), 2)
        if score >= 60:
            cat = 'highly_preferred'
        elif score >= 50:
            cat = 'mid_preference'
        elif score >= 25:
            cat = 'low_preference'
        else:
            cat = 'no_visit'
        Application.objects.get_or_create(
            vacancy=vac,
            candidate=cand,
            is_self_test=False,
            defaults=dict(
                status=random.choice(statuses),
                final_score=score,
                category=cat,
                ml_result={"score": score, "matched_skills": random.choice(SKILLS_POOL)[:2]},
            )
        )
        app_count += 1
        print(f"  ✓ {cand.name} → {vac.title}")

# ── 7. JobOffers ──────────────────────────────────────────────────────────────
print("\n[7/10] Creating JobOffers...")
offer_count = 0
used_offers = set()
for i in range(10):
    cand = cands[i]
    vac  = vacancies[i]
    org  = vac.organization
    pair = (vac.id, cand.id)
    if pair not in used_offers:
        used_offers.add(pair)
        JobOffer.objects.get_or_create(
            vacancy=vac,
            candidate=cand,
            defaults=dict(
                organization=org,
                status=random.choice(['pending', 'accepted', 'rejected']),
                message=f"Hi {cand.name}, we'd love to have you join {org.name} as {vac.title}.",
            )
        )
        offer_count += 1
        print(f"  ✓ Offer: {org.name} → {cand.name}")

# ── 8. Conversations + Messages ───────────────────────────────────────────────
print("\n[8/10] Creating Conversations & Messages...")
conv_count = 0
msg_count = 0
used_convs = set()
for i in range(10):
    u1 = cand_users[i]
    u2 = org_users[i]
    # unique_together requires p1 < p2 by id
    p1, p2 = (u1, u2) if u1.id < u2.id else (u2, u1)
    pair = (p1.id, p2.id)
    if pair not in used_convs:
        used_convs.add(pair)
        conv, created = Conversation.objects.get_or_create(
            participant1=p1,
            participant2=p2,
            defaults=dict(status='accepted', initiated_by=u1)
        )
        if created:
            conv_count += 1
        # Add 3 messages per conversation
        sample_msgs = [
            "Hi, I saw your job posting and I'm very interested!",
            "Thanks for reaching out. Can you share your resume?",
            "Sure, I'll send it right away. Looking forward to hearing from you.",
        ]
        for txt in sample_msgs:
            sender = random.choice([p1, p2])
            Message.objects.create(
                conversation=conv,
                sender=sender,
                content=txt,
                message_type='text',
                is_read=random.choice([True, False]),
            )
            msg_count += 1
        print(f"  ✓ Conversation: {u1.email} ↔ {u2.email}")

print(f"  ✓ {msg_count} messages created")

# ── 9. UserStatus ─────────────────────────────────────────────────────────────
print("\n[9/10] Creating UserStatus...")
for user in all_users:
    UserStatus.objects.get_or_create(
        user=user,
        defaults=dict(is_online=random.choice([True, False]))
    )
print(f"  ✓ {len(all_users)} user statuses created")

# ── 10. Notifications ─────────────────────────────────────────────────────────
print("\n[10/10] Creating Notifications...")
notif_types = [
    ('new_application', 'New Application', 'A new candidate has applied to your job posting.'),
    ('application_status', 'Application Update', 'Your application status has been updated.'),
    ('new_vacancy', 'New Job Posted', 'A new vacancy matching your skills has been posted.'),
    ('vacancy_closed', 'Vacancy Closed', 'A vacancy you applied to has been closed.'),
    ('application_submitted', 'Application Submitted', 'Your application was successfully submitted.'),
]
notif_count = 0
for i, user in enumerate(all_users):
    ntype, title, msg = notif_types[i % len(notif_types)]
    Notification.objects.create(
        user=user,
        notification_type=ntype,
        title=title,
        message=msg,
        is_read=random.choice([True, False]),
    )
    notif_count += 1
print(f"  ✓ {notif_count} notifications created")

# ── Employment (bonus) ────────────────────────────────────────────────────────
print("\n[Bonus] Creating Employment records...")
for i, cand in enumerate(cands):
    org = orgs[i % len(orgs)]
    start = rdate(3, 1)
    Employment.objects.get_or_create(
        candidate=cand,
        organization=org,
        position=JOB_TITLES[i],
        defaults=dict(
            is_current=random.choice([True, False]),
            is_visible=True,
            start_date=start,
            end_date=None if random.choice([True, False]) else rdate(1, 0),
        )
    )
    print(f"  ✓ {cand.name} @ {org.name}")

# ── TalentPool ────────────────────────────────────────────────────────────────
print("\n[Bonus] Creating TalentPool entries...")
for i, cand in enumerate(cands):
    org = orgs[(i + 2) % len(orgs)]
    TalentPool.objects.get_or_create(
        candidate=cand,
        organization=org,
        defaults=dict(is_active=True)
    )
    print(f"  ✓ {cand.name} in {org.name}'s pool")

print("\n" + "=" * 60)
print("✅ Seed complete!")
print("=" * 60)
print("\nLogin credentials for all seeded users:")
print("  Organizations : org1@recruitify.dev … org10@recruitify.dev")
print("  Candidates    : candidate1@recruitify.dev … candidate10@recruitify.dev")
print("  Password      : Test@1234")
