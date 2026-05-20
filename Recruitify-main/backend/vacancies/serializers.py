from rest_framework import serializers
from .models import Vacancy, Application, JobOffer
from accounts.serializers import CandidateSerializer


# ==================================================
# ORGANIZATION NESTED SERIALIZER
# ==================================================

class OrganizationNestedSerializer(serializers.Serializer):
    """Nested serializer for organization data in vacancy"""
    id = serializers.IntegerField()
    slug = serializers.CharField()
    name = serializers.CharField()


# ==================================================
# VACANCY SERIALIZER (ML-AWARE)
# ==================================================

class VacancySerializer(serializers.ModelSerializer):
    """
    Serializer used by organizations to create/update vacancies.
    Fully aligned with ML v3 JD structure.
    """

    organization = serializers.SerializerMethodField()
    passcode = serializers.CharField(read_only=True)  # Only readable, auto-generated
    application_count = serializers.SerializerMethodField()

    class Meta:
        model = Vacancy
        fields = (
            'id',
            'organization',

            # Core JD
            'title',
            'slug',
            'description',

            # ML-STRUCTURED FIELDS
            'required_skills',
            'education_required',
            'job_title_aliases',
            'keywords',
            'min_experience_years',
            'max_experience_years',

            # Optional metadata
            'location',
            'salary_range',
            'benefits',
            'experience_level',

            'is_public',
            'passcode',
            'status',
            'allowed_candidates',

            'created_at',
            'updated_at',
            'application_count',
        )

        read_only_fields = (
            'id',
            'organization',
            'slug',
            'passcode',
            'created_at',
            'updated_at',
        )

    def get_organization(self, obj):
        """Return organization id, slug and name"""
        if obj.organization:
            return {
                'id': obj.organization.id,
                'slug': obj.organization.slug,
                'name': obj.organization.name,
            }
        return None

    def get_application_count(self, obj):
        """Return the total number of applications for this vacancy"""
        return obj.applications.count()

    def validate_required_skills(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("required_skills must be a list")
        return value

    def validate_education_required(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("education_required must be a list")
        return value


# ==================================================
# APPLICATION SERIALIZER (ML OUTPUT SAFE)
# ==================================================

class ApplicationSerializer(serializers.ModelSerializer):

    candidate_details = serializers.SerializerMethodField()
    candidate_name = serializers.SerializerMethodField()

    vacancy_title = serializers.CharField(
        source='vacancy.title',
        read_only=True
    )

    organization_name = serializers.CharField(
        source='vacancy.organization.name',
        read_only=True
    )

    organization_id = serializers.IntegerField(
        source='vacancy.organization.id',
        read_only=True
    )

    organization_slug = serializers.CharField(
        source='vacancy.organization.slug',
        read_only=True
    )

    class Meta:
        model = Application
        fields = (
            'id',
            'vacancy',
            'candidate',
            'candidate_name',
            'status',
            'final_score',
            'category',
            'ml_result',
            'applied_at',
            'updated_at',
            'candidate_details',
            'vacancy_title',
            'organization_name',
            'organization_id',
            'organization_slug',
            'is_self_test',
            'self_test_number',
            # Interview fields
            'interview_type',
            'interview_datetime',
            'interview_location',
            'interview_meet_link',
            'interview_panel',
            'interview_notes',
            'google_calendar_event_id',
        )

        read_only_fields = (
            'id',
            'candidate',
            'final_score',
            'category',
            'ml_result',
            'applied_at',
            'updated_at',
            'is_self_test',
            'self_test_number',
        )

    def get_candidate_name(self, obj):
        if obj.is_self_test:
            return f"Self Test #{obj.self_test_number}"
        return obj.candidate.name

    def get_candidate_details(self, obj):
        request = self.context.get("request")
        data = CandidateSerializer(
            obj.candidate,
            context={"request": request}
        ).data
        
        # Override name for self-tests
        if obj.is_self_test:
            data['name'] = f"Self Test #{obj.self_test_number}"
        
        return data



# ==================================================
# JOB OFFER SERIALIZER
# ==================================================

class JobOfferSerializer(serializers.ModelSerializer):
    """Serializer for job offers"""
    vacancy_title = serializers.CharField(source='vacancy.title', read_only=True)
    vacancy_id = serializers.IntegerField(source='vacancy.id', read_only=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    organization_id = serializers.IntegerField(source='organization.id', read_only=True)
    organization_slug = serializers.CharField(source='organization.slug', read_only=True)
    candidate_name = serializers.CharField(source='candidate.name', read_only=True)
    candidate_id = serializers.IntegerField(source='candidate.id', read_only=True)
    candidate_slug = serializers.CharField(source='candidate.slug', read_only=True)
    candidate_email = serializers.EmailField(source='candidate.user.email', read_only=True)

    class Meta:
        model = JobOffer
        fields = (
            'id',
            'vacancy',
            'vacancy_id',
            'vacancy_title',
            'candidate',
            'candidate_id',
            'candidate_slug',
            'candidate_name',
            'candidate_email',
            'organization',
            'organization_id',
            'organization_slug',
            'organization_name',
            'status',
            'message',
            'created_at',
            'updated_at',
            'responded_at',
        )
        read_only_fields = ('id', 'organization', 'created_at', 'updated_at', 'responded_at')
