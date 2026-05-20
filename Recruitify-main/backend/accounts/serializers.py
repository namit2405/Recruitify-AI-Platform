from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Organization, Candidate, Employment, TalentPool, UserPreferences

User = get_user_model()


# ==================================================
# USER
# ==================================================

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "user_type", "date_joined")
        read_only_fields = ("id", "date_joined")


# ==================================================
# REGISTER
# ==================================================

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ("email", "password", "user_type")

    def validate_user_type(self, value):
        if value not in ("organization", "candidate"):
            raise serializers.ValidationError("Invalid user type")
        return value

    def create(self, validated_data):
        email = validated_data["email"]
        password = validated_data.pop("password")
        user_type = validated_data["user_type"]
        user = User.objects.create_user(email=email, password=password, user_type=user_type,)

        # 🔴 CRITICAL FIX: auto-create profile
        if user.user_type == "organization":
            Organization.objects.create(
                user=user,
                name="",
                contact_email=user.email,
            )
        else:  # candidate
            Candidate.objects.create(
                user=user,
                name="",
                email=user.email,
            )   

        return user


# ==================================================
# ORGANIZATION
# ==================================================

class OrganizationSerializer(serializers.ModelSerializer):
    profile_picture_url = serializers.SerializerMethodField()
    cover_photo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Organization
        fields = (
            "id",
            "name",
            "description",
            "contact_email",
            "website",
            "location",
            "phone",
            "established",
            "logo_path",
            "profile_picture",
            "profile_picture_url",
            "cover_photo",
            "cover_photo_url",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at", "profile_picture_url", "cover_photo_url", "profile_picture", "cover_photo")
    
    def get_profile_picture_url(self, obj):
        if obj.profile_picture:
            return obj.profile_picture.url
        return None
    
    def get_cover_photo_url(self, obj):
        if obj.cover_photo:
            return obj.cover_photo.url
        return None


# ==================================================
# CANDIDATE
# ==================================================

class CandidateSerializer(serializers.ModelSerializer):
    resume_url = serializers.SerializerMethodField()
    profile_picture_url = serializers.SerializerMethodField()
    cover_photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Candidate
        fields = (
            "id",
            "name",
            "slug",
            "email",
            "phone",
            "address",
            "availability",
            "summary",
            "skills",
            "experience",
            "education",
            "accomplishments",
            "job_preferences",
            "resume",
            "resume_url",
            "profile_picture",
            "profile_picture_url",
            "cover_photo",
            "cover_photo_url",
            "website_url",
            "github_url",
            "linkedin_url",
            "instagram_url",
            "created_at",
        )
        read_only_fields = ("id", "slug", "created_at", "resume_url", "profile_picture_url", "cover_photo_url", "resume", "profile_picture", "cover_photo", "email")

    def get_resume_url(self, obj):
        if obj.resume:
            return obj.resume.url
        return None
    
    def get_profile_picture_url(self, obj):
        if obj.profile_picture:
            return obj.profile_picture.url
        return None
    
    def get_cover_photo_url(self, obj):
        if obj.cover_photo:
            return obj.cover_photo.url
        return None



# ==================================================
# PROFILE (READ-ONLY RESPONSE SERIALIZER)
# ==================================================

class ProfileSerializer(serializers.Serializer):
    """
    Response-only serializer.
    Used to return full profile in one API call.
    """

    user = UserSerializer()
    organization = OrganizationSerializer(allow_null=True)
    candidate = CandidateSerializer(allow_null=True)

class PublicCandidateSerializer(serializers.ModelSerializer):
    resume_url = serializers.SerializerMethodField()
    profile_picture_url = serializers.SerializerMethodField()
    cover_photo_url = serializers.SerializerMethodField()
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()

    class Meta:
        model = Candidate
        fields = (
            "id",
            "slug",
            "user_id",
            "name",
            "email",
            "phone",
            "address",
            "availability",
            "summary",
            "skills",
            "experience",
            "education",
            "accomplishments",
            "resume_url",
            "profile_picture_url",
            "cover_photo_url",
            "website_url",
            "github_url",
            "linkedin_url",
            "instagram_url",
            "followers_count",
            "following_count",
        )

    def get_email(self, obj):
        """Return email only if user allows it or viewing own profile"""
        request = self.context.get("request")
        if not request:
            return None
        
        # Check if viewing own profile
        is_own_profile = False
        if request.user.user_type == 'candidate':
            try:
                is_own_profile = request.user.candidate_profile.id == obj.id
            except AttributeError:
                is_own_profile = False
        
        if is_own_profile:
            return obj.email
        
        # Check preferences
        preferences, _ = UserPreferences.objects.get_or_create(user=obj.user)
        if preferences.show_email:
            return obj.email
        
        return None
    
    def get_phone(self, obj):
        """Return phone only if user allows it or viewing own profile"""
        request = self.context.get("request")
        if not request:
            return None
        
        # Check if viewing own profile
        is_own_profile = False
        if request.user.user_type == 'candidate':
            try:
                is_own_profile = request.user.candidate_profile.id == obj.id
            except AttributeError:
                is_own_profile = False
        
        if is_own_profile:
            return obj.phone
        
        # Check preferences
        preferences, _ = UserPreferences.objects.get_or_create(user=obj.user)
        if preferences.show_phone:
            return obj.phone
        
        return None

    def get_resume_url(self, obj):
        if obj.resume:
            return obj.resume.url
        return None
    
    def get_profile_picture_url(self, obj):
        if obj.profile_picture:
            return obj.profile_picture.url
        return None
    
    def get_cover_photo_url(self, obj):
        if obj.cover_photo:
            return obj.cover_photo.url
        return None
    
    def get_followers_count(self, obj):
        return obj.user.get_followers_count()
    
    def get_following_count(self, obj):
        return obj.user.get_following_count()

class PublicOrganizationSerializer(serializers.ModelSerializer):
    profile_picture_url = serializers.SerializerMethodField()
    cover_photo_url = serializers.SerializerMethodField()
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Organization
        fields = (
            "id",
            "slug",
            "user_id",
            "name",
            "description",
            "location",
            "website",
            "profile_picture_url",
            "cover_photo_url",
            "followers_count",
            "following_count",
        )
    
    def get_profile_picture_url(self, obj):
        if obj.profile_picture:
            return obj.profile_picture.url
        return None
    
    def get_cover_photo_url(self, obj):
        if obj.cover_photo:
            return obj.cover_photo.url
        return None
    
    def get_followers_count(self, obj):
        return obj.user.get_followers_count()
    
    def get_following_count(self, obj):
        return obj.user.get_following_count()



# ==================================================
# EMPLOYMENT SERIALIZER
# ==================================================

class EmploymentSerializer(serializers.ModelSerializer):
    """Serializer for employment relationships"""
    candidate_id = serializers.IntegerField(source='candidate.id', read_only=True)
    candidate_slug = serializers.CharField(source='candidate.slug', read_only=True)
    candidate_name = serializers.CharField(source='candidate.name', read_only=True)
    candidate_email = serializers.EmailField(source='candidate.user.email', read_only=True)
    candidate_profile_picture_url = serializers.SerializerMethodField()
    
    organization_id = serializers.IntegerField(source='organization.id', read_only=True)
    organization_slug = serializers.CharField(source='organization.slug', read_only=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    organization_profile_picture_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Employment
        fields = (
            'id',
            'candidate',
            'candidate_id',
            'candidate_slug',
            'candidate_name',
            'candidate_email',
            'candidate_profile_picture_url',
            'organization',
            'organization_id',
            'organization_slug',
            'organization_name',
            'organization_profile_picture_url',
            'position',
            'is_current',
            'is_visible',
            'start_date',
            'end_date',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_candidate_profile_picture_url(self, obj):
        if obj.candidate.profile_picture:
            return obj.candidate.profile_picture.url
        return None
    
    def get_organization_profile_picture_url(self, obj):
        if obj.organization.profile_picture:
            return obj.organization.profile_picture.url
        return None



# ==================================================
# TALENT POOL SERIALIZER
# ==================================================

class TalentPoolSerializer(serializers.ModelSerializer):
    """Serializer for talent pool memberships"""
    candidate_id = serializers.IntegerField(source='candidate.id', read_only=True)
    candidate_slug = serializers.CharField(source='candidate.slug', read_only=True)
    candidate_name = serializers.CharField(source='candidate.name', read_only=True)
    candidate_email = serializers.EmailField(source='candidate.user.email', read_only=True)
    candidate_profile_picture_url = serializers.SerializerMethodField()
    candidate_skills = serializers.ListField(source='candidate.skills', read_only=True)
    candidate_availability = serializers.CharField(source='candidate.availability', read_only=True)
    
    organization_id = serializers.IntegerField(source='organization.id', read_only=True)
    organization_slug = serializers.CharField(source='organization.slug', read_only=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    organization_profile_picture_url = serializers.SerializerMethodField()
    
    class Meta:
        model = TalentPool
        fields = (
            'id',
            'candidate',
            'candidate_id',
            'candidate_slug',
            'candidate_name',
            'candidate_email',
            'candidate_profile_picture_url',
            'candidate_skills',
            'candidate_availability',
            'organization',
            'organization_id',
            'organization_slug',
            'organization_name',
            'organization_profile_picture_url',
            'joined_at',
            'is_active',
        )
        read_only_fields = ('id', 'joined_at')
    
    def get_candidate_profile_picture_url(self, obj):
        if obj.candidate.profile_picture:
            return obj.candidate.profile_picture.url
        return None
    
    def get_organization_profile_picture_url(self, obj):
        if obj.organization.profile_picture:
            return obj.organization.profile_picture.url
        return None



class UserPreferencesSerializer(serializers.ModelSerializer):
    """Serializer for user preferences"""
    
    class Meta:
        model = UserPreferences
        fields = (
            'email_notifications',
            'job_alerts',
            'message_notifications',
            'application_updates',
            'weekly_digest',
            'profile_visibility',
            'show_email',
            'show_phone',
            'theme',
        )


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change"""
    current_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, min_length=8)
    confirm_password = serializers.CharField(required=True, write_only=True)
    
    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'New passwords do not match'
            })
        return data
