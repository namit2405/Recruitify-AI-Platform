from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Organization, Candidate, OTPVerification, Follow


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'user_type', 'email_verified', 'mfa_enabled', 'is_staff', 'date_joined')
    ordering = ('-date_joined',)
    list_filter = ('user_type', 'email_verified', 'mfa_enabled', 'is_active', 'is_staff')
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Type', {'fields': ('user_type',)}),
        ('Security', {'fields': ('email_verified', 'mfa_enabled')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser')}),
    )
    add_fieldsets = (
        (None, {'fields': ('email', 'password1', 'password2', 'user_type', 'email_verified', 'mfa_enabled')}),
    )
    search_fields = ('email',)


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'contact_email')
    search_fields = ('name', 'contact_email')
    list_filter = ('name',)


@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ('name', 'user_email', 'user')
    search_fields = ('name', 'user__email')
    list_filter = ('name',)

    @admin.display(description='Email')
    def user_email(self, obj):
        return obj.user.email


@admin.register(OTPVerification)
class OTPVerificationAdmin(admin.ModelAdmin):
    list_display = ('email', 'otp_code', 'purpose', 'is_verified', 'created_at', 'expires_at')
    list_filter = ('purpose', 'is_verified', 'created_at')
    search_fields = ('email', 'otp_code')
    readonly_fields = ('created_at', 'verified_at')
    ordering = ('-created_at',)
    
    def has_add_permission(self, request):
        # Prevent manual OTP creation through admin
        return False



@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ('follower_email', 'follower_type', 'following_email', 'following_type', 'created_at')
    list_filter = ('created_at', 'follower__user_type', 'following__user_type')
    search_fields = ('follower__email', 'following__email')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
    
    @admin.display(description='Follower Email')
    def follower_email(self, obj):
        return obj.follower.email
    
    @admin.display(description='Follower Type')
    def follower_type(self, obj):
        return obj.follower.user_type.title()
    
    @admin.display(description='Following Email')
    def following_email(self, obj):
        return obj.following.email
    
    @admin.display(description='Following Type')
    def following_type(self, obj):
        return obj.following.user_type.title()
    
    def has_add_permission(self, request):
        # Prevent manual follow creation through admin (use the API)
        return False
