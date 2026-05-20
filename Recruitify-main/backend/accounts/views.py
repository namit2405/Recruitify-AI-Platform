from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from django.conf import settings
import os

from .models import Organization, Candidate, Follow, Employment, TalentPool, UserPreferences
from .serializers import (
    RegisterSerializer,
    OrganizationSerializer,
    CandidateSerializer,
    PublicCandidateSerializer,
    PublicOrganizationSerializer,
    EmploymentSerializer,
    TalentPoolSerializer,
    UserPreferencesSerializer,
    ChangePasswordSerializer,
)
from .otp_manager import create_otp, send_otp_email, verify_otp
from .email_service import send_contact_email

User = get_user_model()


# ==================================================
# JWT HELPER
# ==================================================

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": {
            "id": user.id,
            "email": user.email,
            "user_type": user.user_type,
            "email_verified": user.email_verified,
            "mfa_enabled": user.mfa_enabled,
        },
    }


# ==================================================
# AUTH VIEWS
# ==================================================

class RegisterView(APIView):
    """
    Step 1: Register user and send OTP
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create user but don't activate yet
        user = serializer.save()
        user.is_active = False  # Will be activated after OTP verification
        user.save()
        
        # Generate and send OTP
        otp_obj = create_otp(user.email, purpose='registration')
        email_sent = send_otp_email(user.email, otp_obj.otp_code, purpose='registration')
        
        if not email_sent:
            return Response(
                {"detail": "Failed to send verification email. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        response_data = {
            "message": "Registration successful. Please check your email for verification code.",
            "email": user.email,
            "requires_verification": True
        }

        # In DEBUG mode, include the OTP in the response so local dev works without email
        if settings.DEBUG:
            response_data["dev_otp"] = otp_obj.otp_code

        return Response(response_data, status=status.HTTP_201_CREATED)


class VerifyRegistrationOTPView(APIView):
    """
    Step 2: Verify OTP and activate user
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        otp_code = request.data.get("otp_code")
        
        if not email or not otp_code:
            return Response(
                {"detail": "Email and OTP code required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify OTP
        success, message = verify_otp(email, otp_code, purpose='registration')
        
        if not success:
            return Response({"detail": message}, status=status.HTTP_400_BAD_REQUEST)
        
        # Activate user and mark email as verified
        try:
            user = User.objects.get(email=email)
            user.is_active = True
            user.email_verified = True
            user.save()
            
            # Create profile based on user type
            if user.user_type == 'candidate':
                Candidate.objects.get_or_create(
                    user=user,
                    defaults={
                        'name': user.email.split('@')[0],  # Default name from email
                        'email': user.email
                    }
                )
            elif user.user_type == 'organization':
                Organization.objects.get_or_create(
                    user=user,
                    defaults={
                        'name': user.email.split('@')[0],  # Default name from email
                        'contact_email': user.email
                    }
                )
            
            # Return tokens for immediate login
            return Response(get_tokens_for_user(user), status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )


class ResendOTPView(APIView):
    """
    Resend OTP for registration or login
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        purpose = request.data.get("purpose", "registration")  # 'registration' or 'login'
        
        if not email:
            return Response(
                {"detail": "Email required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user exists
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Generate and send new OTP
        otp_obj = create_otp(email, purpose=purpose)
        email_sent = send_otp_email(email, otp_obj.otp_code, purpose=purpose)
        
        if not email_sent:
            return Response(
                {"detail": "Failed to send verification email. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response({
            "message": "Verification code sent successfully"
        }, status=status.HTTP_200_OK)


class LoginView(APIView):
    """
    Step 1: Authenticate credentials and send MFA OTP if enabled
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        if not email or not password:
            return Response(
                {"detail": "Email and password required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(request, username=email, password=password)
        if not user:
            return Response(
                {"detail": "Invalid email or password"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        
        # Check if email is verified
        if not user.email_verified:
            return Response(
                {"detail": "Email not verified. Please verify your email first."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if MFA is enabled
        if user.mfa_enabled:
            # Generate and send OTP
            otp_obj = create_otp(user.email, purpose='login')
            email_sent = send_otp_email(user.email, otp_obj.otp_code, purpose='login')
            
            if not email_sent:
                return Response(
                    {"detail": "Failed to send verification code. Please try again."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            return Response({
                "message": "Verification code sent to your email",
                "email": user.email,
                "requires_mfa": True
            }, status=status.HTTP_200_OK)
        
        # MFA not enabled, return tokens directly
        return Response(get_tokens_for_user(user))


class VerifyLoginOTPView(APIView):
    """
    Step 2: Verify MFA OTP and return tokens
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        otp_code = request.data.get("otp_code")
        
        print(f"[VIEW DEBUG] VerifyLoginOTPView called")
        print(f"  Email: {email}")
        print(f"  OTP Code: {otp_code}")
        
        if not email or not otp_code:
            print(f"[VIEW DEBUG] Missing email or OTP code")
            return Response(
                {"detail": "Email and OTP code required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify OTP
        print(f"[VIEW DEBUG] Calling verify_otp...")
        success, message = verify_otp(email, otp_code, purpose='login')
        print(f"[VIEW DEBUG] verify_otp returned: success={success}, message={message}")
        
        if not success:
            print(f"[VIEW DEBUG] Verification failed, returning error")
            return Response({"detail": message}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get user and return tokens
        try:
            user = User.objects.get(email=email)
            
            # Ensure profile exists
            if user.user_type == 'candidate':
                Candidate.objects.get_or_create(
                    user=user,
                    defaults={
                        'name': user.email.split('@')[0],
                        'email': user.email
                    }
                )
            elif user.user_type == 'organization':
                Organization.objects.get_or_create(
                    user=user,
                    defaults={
                        'name': user.email.split('@')[0],
                        'contact_email': user.email
                    }
                )
            
            print(f"[VIEW DEBUG] User found, generating tokens")
            return Response(get_tokens_for_user(user), status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            print(f"[VIEW DEBUG] User not found")
            return Response(
                {"detail": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )


# ==================================================
# PROFILE (COMBINED READ)
# ==================================================

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            
            # Get organization profile if exists
            organization_data = None
            if user.user_type == 'organization':
                try:
                    org = user.organization_profile
                    organization_data = OrganizationSerializer(
                        org, 
                        context={"request": request}
                    ).data
                except Organization.DoesNotExist:
                    print(f"Organization profile does not exist for user {user.email}")
                except Exception as e:
                    print(f"Error serializing organization profile: {e}")
                    import traceback
                    traceback.print_exc()
            
            # Get candidate profile if exists
            candidate_data = None
            if user.user_type == 'candidate':
                try:
                    cand = user.candidate_profile
                    candidate_data = CandidateSerializer(
                        cand, 
                        context={"request": request}
                    ).data
                except Candidate.DoesNotExist:
                    print(f"Candidate profile does not exist for user {user.email}")
                except Exception as e:
                    print(f"Error serializing candidate profile: {e}")
                    import traceback
                    traceback.print_exc()
            
            return Response({
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "user_type": user.user_type,
                },
                "organization": organization_data,
                "candidate": candidate_data,
            })
        except Exception as e:
            print(f"ProfileView error: {e}")
            import traceback
            traceback.print_exc()
            return Response(
                {"detail": f"Error fetching profile: {str(e)}"}, 
                status=500
            )


# ==================================================
# ORGANIZATION PROFILE
# ==================================================

class OrganizationProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.user_type != "organization":
            return Response({"detail": "Forbidden"}, status=403)

        org, _ = Organization.objects.get_or_create(user=request.user)
        return Response(OrganizationSerializer(org, context={"request": request}).data)

    def post(self, request):
        if request.user.user_type != "organization":
            return Response({"detail": "Forbidden"}, status=403)

        org, _ = Organization.objects.get_or_create(user=request.user)
        serializer = OrganizationSerializer(org, data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=201)

    def patch(self, request):
        if request.user.user_type != "organization":
            return Response({"detail": "Forbidden"}, status=403)

        org, _ = Organization.objects.get_or_create(user=request.user)
        serializer = OrganizationSerializer(org, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# ==================================================
# CANDIDATE PROFILE
# ==================================================

class CandidateProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.user_type != "candidate":
            return Response({"detail": "Forbidden"}, status=403)

        cand, _ = Candidate.objects.get_or_create(user=request.user)

        serializer = CandidateSerializer(
            cand,
            context={"request": request}
        )

        return Response(serializer.data)

    def post(self, request):
        if request.user.user_type != "candidate":
            return Response({"detail": "Forbidden"}, status=403)

        cand, _ = Candidate.objects.get_or_create(user=request.user)

        serializer = CandidateSerializer(
            cand,
            data=request.data,
            context={"request": request}
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=201)

    def patch(self, request):
        if request.user.user_type != "candidate":
            return Response({"detail": "Forbidden"}, status=403)

        cand, _ = Candidate.objects.get_or_create(user=request.user)

        serializer = CandidateSerializer(
            cand,
            data=request.data,
            partial=True,
            context={"request": request}
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)



# ==================================================
# RESUME UPLOAD (ML-READY)
# ==================================================

class CandidateResumeUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.user_type != "candidate":
            return Response({"detail": "Forbidden"}, status=403)

        cand, _ = Candidate.objects.get_or_create(user=request.user)

        file = request.FILES.get("resume")
        if not file:
            return Response({"detail": "Resume required"}, status=400)

        if not file.name.lower().endswith(".pdf"):
            return Response({"detail": "Only PDF allowed"}, status=400)

        # 🔥 THIS IS THE IMPORTANT PART
        cand.resume = file
        cand.save()

        serializer = CandidateSerializer(
            cand,
            context={"request": request}
        )

        return Response(serializer.data, status=200)

class PublicCandidateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        # Only accept slugs, reject numeric IDs
        if slug.isdigit():
            return Response(
                {"detail": "Please use slug-based URLs instead of numeric IDs"}, 
                status=400
            )
        
        try:
            candidate = Candidate.objects.get(slug=slug)
        except Candidate.DoesNotExist:
            return Response({"detail": "Candidate not found"}, status=404)

        # Check if viewing own profile
        is_own_profile = False
        if request.user.user_type == 'candidate':
            try:
                is_own_profile = request.user.candidate_profile.id == candidate.id
            except AttributeError:
                is_own_profile = False
        
        # If not viewing own profile, check visibility settings
        if not is_own_profile:
            preferences, _ = UserPreferences.objects.get_or_create(user=candidate.user)
            
            if preferences.profile_visibility == 'private':
                return Response(
                    {"detail": "This profile is private"},
                    status=403
                )
            elif preferences.profile_visibility == 'connections':
                # Check if users are connected (following each other)
                from_follow_exists = Follow.objects.filter(
                    follower=request.user,
                    following=candidate.user
                ).exists()
                to_follow_exists = Follow.objects.filter(
                    follower=candidate.user,
                    following=request.user
                ).exists()
                
                if not (from_follow_exists and to_follow_exists):
                    return Response(
                        {"detail": "This profile is only visible to connections"},
                        status=403
                    )

        serializer = PublicCandidateSerializer(
            candidate,
            context={"request": request}
        )
        
        # Add current employment data
        if is_own_profile:
            current_employments = Employment.objects.filter(
                candidate=candidate,
                is_current=True
            ).select_related('organization')
        else:
            current_employments = Employment.objects.filter(
                candidate=candidate,
                is_current=True,
                is_visible=True
            ).select_related('organization')
        
        employment_data = EmploymentSerializer(
            current_employments,
            many=True,
            context={'request': request}
        ).data
        
        response_data = serializer.data
        response_data['current_employments'] = employment_data
        
        return Response(response_data)
    
class PublicOrganizationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        # Only accept slugs, reject numeric IDs
        if slug.isdigit():
            return Response(
                {"detail": "Please use slug-based URLs instead of numeric IDs"}, 
                status=400
            )
        
        try:
            org = Organization.objects.get(slug=slug)
        except Organization.DoesNotExist:
            return Response({"detail": "Organization not found"}, status=404)

        # Check if viewing own profile
        is_own_profile = False
        if request.user.user_type == 'organization':
            try:
                is_own_profile = request.user.organization_profile.id == org.id
            except AttributeError:
                is_own_profile = False
        
        # If not viewing own profile, check visibility settings
        if not is_own_profile:
            preferences, _ = UserPreferences.objects.get_or_create(user=org.user)
            
            if preferences.profile_visibility == 'private':
                return Response(
                    {"detail": "This profile is private"},
                    status=403
                )
            elif preferences.profile_visibility == 'connections':
                # Check if users are connected (following each other)
                from_follow_exists = Follow.objects.filter(
                    follower=request.user,
                    following=org.user
                ).exists()
                to_follow_exists = Follow.objects.filter(
                    follower=org.user,
                    following=request.user
                ).exists()
                
                if not (from_follow_exists and to_follow_exists):
                    return Response(
                        {"detail": "This profile is only visible to connections"},
                        status=403
                    )

        serializer = PublicOrganizationSerializer(org, context={"request": request})
        return Response(serializer.data)




# ==================================================
# PROFILE PICTURE & COVER PHOTO UPLOAD
# ==================================================

class CandidateProfilePictureUploadView(APIView):
    """
    Upload profile picture for candidate
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.user_type != "candidate":
            return Response({"detail": "Forbidden"}, status=403)

        cand, _ = Candidate.objects.get_or_create(user=request.user)

        file = request.FILES.get("profile_picture")
        if not file:
            return Response({"detail": "Profile picture required"}, status=400)

        # Validate image file
        allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
        file_ext = os.path.splitext(file.name)[1].lower()
        if file_ext not in allowed_extensions:
            return Response(
                {"detail": f"Only image files allowed: {', '.join(allowed_extensions)}"},
                status=400
            )

        cand.profile_picture = file
        cand.save()

        serializer = CandidateSerializer(cand, context={"request": request})
        return Response(serializer.data, status=200)


class CandidateCoverPhotoUploadView(APIView):
    """
    Upload cover photo for candidate
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.user_type != "candidate":
            return Response({"detail": "Forbidden"}, status=403)

        cand, _ = Candidate.objects.get_or_create(user=request.user)

        file = request.FILES.get("cover_photo")
        if not file:
            return Response({"detail": "Cover photo required"}, status=400)

        # Validate image file
        allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
        file_ext = os.path.splitext(file.name)[1].lower()
        if file_ext not in allowed_extensions:
            return Response(
                {"detail": f"Only image files allowed: {', '.join(allowed_extensions)}"},
                status=400
            )

        cand.cover_photo = file
        cand.save()

        serializer = CandidateSerializer(cand, context={"request": request})
        return Response(serializer.data, status=200)


class OrganizationProfilePictureUploadView(APIView):
    """
    Upload profile picture for organization
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.user_type != "organization":
            return Response({"detail": "Forbidden"}, status=403)

        org, _ = Organization.objects.get_or_create(user=request.user)

        file = request.FILES.get("profile_picture")
        if not file:
            return Response({"detail": "Profile picture required"}, status=400)

        # Validate image file
        allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
        file_ext = os.path.splitext(file.name)[1].lower()
        if file_ext not in allowed_extensions:
            return Response(
                {"detail": f"Only image files allowed: {', '.join(allowed_extensions)}"},
                status=400
            )

        org.profile_picture = file
        org.save()

        serializer = OrganizationSerializer(org, context={"request": request})
        return Response(serializer.data, status=200)


class OrganizationCoverPhotoUploadView(APIView):
    """
    Upload cover photo for organization
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.user_type != "organization":
            return Response({"detail": "Forbidden"}, status=403)

        org, _ = Organization.objects.get_or_create(user=request.user)

        file = request.FILES.get("cover_photo")
        if not file:
            return Response({"detail": "Cover photo required"}, status=400)

        # Validate image file
        allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
        file_ext = os.path.splitext(file.name)[1].lower()
        if file_ext not in allowed_extensions:
            return Response(
                {"detail": f"Only image files allowed: {', '.join(allowed_extensions)}"},
                status=400
            )

        org.cover_photo = file
        org.save()

        serializer = OrganizationSerializer(org, context={"request": request})
        return Response(serializer.data, status=200)



# ======================================================
# FOLLOW/UNFOLLOW FUNCTIONALITY
# ======================================================

class FollowUserView(APIView):
    """Follow a user (candidate or organization)"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, user_id):
        try:
            user_to_follow = User.objects.get(id=user_id)
            
            if request.user == user_to_follow:
                return Response(
                    {"detail": "Cannot follow yourself"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Follow the user
            request.user.follow(user_to_follow)
            
            # Send notification
            try:
                from notifications.models import Notification
                
                # Get the follower's name
                if request.user.user_type == 'candidate':
                    follower_name = request.user.candidate_profile.name
                else:
                    follower_name = request.user.organization_profile.name
                
                Notification.objects.create(
                    user=user_to_follow,
                    title="New Follower",
                    message=f"{follower_name} started following you",
                    notification_type='follow',
                )
            except Exception as e:
                # Don't fail if notification fails
                print(f"Failed to send follow notification: {e}")
            
            return Response({
                "detail": "Followed successfully",
                "followers_count": user_to_follow.get_followers_count(),
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )


class UnfollowUserView(APIView):
    """Unfollow a user"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, user_id):
        try:
            user_to_unfollow = User.objects.get(id=user_id)
            request.user.unfollow(user_to_unfollow)
            
            return Response({
                "detail": "Unfollowed successfully",
                "followers_count": user_to_unfollow.get_followers_count(),
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )


class FollowStatusView(APIView):
    """Get follow status and counts for a user"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            is_following = request.user.is_following(user)
            followers_count = user.get_followers_count()
            following_count = user.get_following_count()
            
            return Response({
                "is_following": is_following,
                "followers_count": followers_count,
                "following_count": following_count,
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )



class FollowersListView(APIView):
    """Get list of followers for a user"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            
            # Get all followers
            followers = Follow.objects.filter(following=user).select_related(
                'follower'
            ).order_by('-created_at')
            
            followers_data = []
            for follow in followers:
                follower_user = follow.follower
                
                if follower_user.user_type == 'candidate':
                    try:
                        profile = Candidate.objects.get(user=follower_user)
                        followers_data.append({
                            'user_id': follower_user.id,
                            'type': 'candidate',
                            'id': profile.id,
                            'name': profile.name,
                            'email': follower_user.email,
                            'profile_picture_url': request.build_absolute_uri(profile.profile_picture.url) if profile.profile_picture else None,
                        })
                    except Candidate.DoesNotExist:
                        # Skip if candidate profile doesn't exist
                        continue
                    except Exception as e:
                        print(f"Error processing candidate follower {follower_user.id}: {e}")
                        continue
                else:  # organization
                    try:
                        profile = Organization.objects.get(user=follower_user)
                        followers_data.append({
                            'user_id': follower_user.id,
                            'type': 'organization',
                            'id': profile.id,
                            'name': profile.name,
                            'email': follower_user.email,
                            'profile_picture_url': request.build_absolute_uri(profile.profile_picture.url) if profile.profile_picture else None,
                        })
                    except Organization.DoesNotExist:
                        # Skip if organization profile doesn't exist
                        continue
                    except Exception as e:
                        print(f"Error processing organization follower {follower_user.id}: {e}")
                        continue
            
            return Response({
                'followers': followers_data,
                'count': len(followers_data),
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"Error in FollowersListView: {e}")
            import traceback
            traceback.print_exc()
            return Response(
                {"detail": f"Internal server error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FollowingListView(APIView):
    """Get list of users that a user is following"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, user_id):
        try:
            print(f"[DEBUG] FollowingListView called for user_id: {user_id}")
            user = User.objects.get(id=user_id)
            print(f"[DEBUG] User found: {user.email}, type: {user.user_type}")
            
            # Get all following
            following = Follow.objects.filter(follower=user).select_related(
                'following'
            ).order_by('-created_at')
            print(f"[DEBUG] Found {following.count()} following relationships")
            
            following_data = []
            for follow in following:
                following_user = follow.following
                print(f"[DEBUG] Processing following_user: {following_user.email}, type: {following_user.user_type}")
                
                if following_user.user_type == 'candidate':
                    try:
                        profile = Candidate.objects.get(user=following_user)
                        print(f"[DEBUG] Found candidate profile: {profile.name}")
                        following_data.append({
                            'user_id': following_user.id,
                            'type': 'candidate',
                            'id': profile.id,
                            'name': profile.name,
                            'email': following_user.email,
                            'profile_picture_url': request.build_absolute_uri(profile.profile_picture.url) if profile.profile_picture else None,
                        })
                    except Candidate.DoesNotExist:
                        print(f"[DEBUG] Candidate profile not found for user {following_user.id}")
                        continue
                    except Exception as e:
                        print(f"[ERROR] Error processing candidate following {following_user.id}: {e}")
                        import traceback
                        traceback.print_exc()
                        continue
                else:  # organization
                    try:
                        profile = Organization.objects.get(user=following_user)
                        print(f"[DEBUG] Found organization profile: {profile.name}")
                        following_data.append({
                            'user_id': following_user.id,
                            'type': 'organization',
                            'id': profile.id,
                            'name': profile.name,
                            'email': following_user.email,
                            'profile_picture_url': request.build_absolute_uri(profile.profile_picture.url) if profile.profile_picture else None,
                        })
                    except Organization.DoesNotExist:
                        print(f"[DEBUG] Organization profile not found for user {following_user.id}")
                        continue
                    except Exception as e:
                        print(f"[ERROR] Error processing organization following {following_user.id}: {e}")
                        import traceback
                        traceback.print_exc()
                        continue
            
            print(f"[DEBUG] Returning {len(following_data)} following entries")
            return Response({
                'following': following_data,
                'count': len(following_data),
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            print(f"[ERROR] User {user_id} not found")
            return Response(
                {"detail": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"[ERROR] Error in FollowingListView: {e}")
            import traceback
            traceback.print_exc()
            return Response(
                {"detail": f"Internal server error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ==================================================
# PASSWORD RESET
# ==================================================

class RequestPasswordResetView(APIView):
    """
    Step 1: Request password reset - sends OTP to email
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        
        if not email:
            return Response(
                {"detail": "Email required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user exists
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Don't reveal if user exists or not for security
            return Response({
                "message": "If an account exists with this email, you will receive a password reset code."
            }, status=status.HTTP_200_OK)
        
        # Generate and send OTP
        otp_obj = create_otp(email, purpose='password_reset')
        email_sent = send_otp_email(email, otp_obj.otp_code, purpose='password_reset')
        
        if not email_sent:
            return Response(
                {"detail": "Failed to send reset code. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response({
            "message": "If an account exists with this email, you will receive a password reset code.",
            "email": email
        }, status=status.HTTP_200_OK)


class VerifyPasswordResetOTPView(APIView):
    """
    Step 2: Verify OTP for password reset
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        otp_code = request.data.get("otp_code")
        
        if not email or not otp_code:
            return Response(
                {"detail": "Email and OTP code required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify OTP
        success, message = verify_otp(email, otp_code, purpose='password_reset')
        
        if not success:
            return Response({"detail": message}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            "message": "OTP verified successfully. You can now reset your password.",
            "verified": True
        }, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    """
    Step 3: Reset password with verified OTP
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        otp_code = request.data.get("otp_code")
        new_password = request.data.get("new_password")
        
        if not email or not otp_code or not new_password:
            return Response(
                {"detail": "Email, OTP code, and new password required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(new_password) < 8:
            return Response(
                {"detail": "Password must be at least 8 characters"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify OTP one more time
        success, message = verify_otp(email, otp_code, purpose='password_reset')
        
        if not success:
            return Response({"detail": message}, status=status.HTTP_400_BAD_REQUEST)
        
        # Reset password
        try:
            user = User.objects.get(email=email)
            user.set_password(new_password)
            user.save()
            
            return Response({
                "message": "Password reset successfully. You can now login with your new password."
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )



# ==================================================
# EMPLOYMENT MANAGEMENT
# ==================================================

class AddEmployeeView(APIView):
    """
    Add a candidate as an employee (when hired)
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.user_type != 'organization':
            return Response({"detail": "Only organizations can add employees"}, status=403)

        candidate_id = request.data.get('candidate_id')
        position = request.data.get('position')
        start_date = request.data.get('start_date')

        if not candidate_id or not position or not start_date:
            return Response({
                "detail": "candidate_id, position, and start_date required"
            }, status=400)

        try:
            candidate = Candidate.objects.get(id=candidate_id)
            organization = Organization.objects.get(user=request.user)
        except (Candidate.DoesNotExist, Organization.DoesNotExist):
            return Response({"detail": "Candidate or organization not found"}, status=404)

        # Check if already employed
        existing = Employment.objects.filter(
            candidate=candidate,
            organization=organization,
            is_current=True
        ).first()

        if existing:
            return Response({
                "detail": "Candidate is already employed at this organization",
                "employment_id": existing.id
            }, status=400)

        # Create employment
        employment = Employment.objects.create(
            candidate=candidate,
            organization=organization,
            position=position,
            start_date=start_date,
            is_current=True
        )

        # Send notification
        try:
            from notifications.models import Notification
            Notification.objects.create(
                user=candidate.user,
                title="Welcome to the Team!",
                message=f"You've been added as {position} at {organization.name}",
                notification_type='employment',
            )
        except Exception as e:
            print(f"Failed to send notification: {e}")

        serializer = EmploymentSerializer(employment, context={'request': request})
        return Response(serializer.data, status=201)


class EmploymentListView(APIView):
    """
    List employments
    - For organizations: their current and past employees
    - For candidates: their current and past employers
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        current_only = request.query_params.get('current_only', 'false').lower() == 'true'
        
        if request.user.user_type == 'organization':
            employments = Employment.objects.filter(
                organization__user=request.user
            ).select_related('candidate', 'organization')
        else:  # candidate
            employments = Employment.objects.filter(
                candidate__user=request.user
            ).select_related('candidate', 'organization')

        if current_only:
            employments = employments.filter(is_current=True)

        serializer = EmploymentSerializer(employments, many=True, context={'request': request})
        return Response(serializer.data)


class MarkEmploymentEndedView(APIView):
    """
    Mark employment as ended (when someone leaves)
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, employment_id):
        end_date = request.data.get('end_date')
        
        if not end_date:
            return Response({"detail": "end_date required"}, status=400)

        try:
            employment = Employment.objects.get(id=employment_id)
        except Employment.DoesNotExist:
            return Response({"detail": "Employment not found"}, status=404)

        # Check permissions
        if request.user.user_type == 'organization':
            if employment.organization.user != request.user:
                return Response({"detail": "Permission denied"}, status=403)
        else:  # candidate
            if employment.candidate.user != request.user:
                return Response({"detail": "Permission denied"}, status=403)

        # Mark as ended
        employment.is_current = False
        employment.end_date = end_date
        employment.save()

        # Send notification to the other party
        try:
            from notifications.models import Notification
            if request.user.user_type == 'organization':
                # Notify candidate
                Notification.objects.create(
                    user=employment.candidate.user,
                    title="Employment Ended",
                    message=f"Your employment as {employment.position} at {employment.organization.name} has been marked as ended",
                    notification_type='employment',
                )
            else:
                # Notify organization
                Notification.objects.create(
                    user=employment.organization.user,
                    title="Employee Left",
                    message=f"{employment.candidate.name} has left their position as {employment.position}",
                    notification_type='employment',
                )
        except Exception as e:
            print(f"Failed to send notification: {e}")

        serializer = EmploymentSerializer(employment, context={'request': request})
        return Response(serializer.data)


class ToggleEmploymentVisibilityView(APIView):
    """
    Toggle employment visibility on public profiles
    - Candidates can hide their employment from their public profile
    - Organizations can hide employees from their team section
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, employment_id):
        try:
            employment = Employment.objects.get(id=employment_id)
        except Employment.DoesNotExist:
            return Response({"detail": "Employment not found"}, status=404)

        # Check permissions
        if request.user.user_type == 'organization':
            if employment.organization.user != request.user:
                return Response({"detail": "Permission denied"}, status=403)
        else:  # candidate
            if employment.candidate.user != request.user:
                return Response({"detail": "Permission denied"}, status=403)

        # Toggle visibility
        employment.is_visible = not employment.is_visible
        employment.save()

        action = "shown" if employment.is_visible else "hidden"
        serializer = EmploymentSerializer(employment, context={'request': request})
        return Response({
            "message": f"Employment {action} successfully",
            "employment": serializer.data
        })


class TeamStatsView(APIView):
    """
    Get team statistics for an organization
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, organization_id):
        try:
            organization = Organization.objects.get(id=organization_id)
        except Organization.DoesNotExist:
            return Response({"detail": "Organization not found"}, status=404)

        # Get visible current employees for public view
        # If the requester is the organization owner, show all; otherwise show only visible
        is_owner = (request.user.user_type == 'organization' and 
                   request.user.organization_profile.id == organization.id)
        
        if is_owner:
            current_employees = Employment.objects.filter(
                organization=organization,
                is_current=True
            ).select_related('candidate')
        else:
            current_employees = Employment.objects.filter(
                organization=organization,
                is_current=True,
                is_visible=True
            ).select_related('candidate')

        past_employees = Employment.objects.filter(
            organization=organization,
            is_current=False
        ).select_related('candidate')

        current_employees_data = EmploymentSerializer(
            current_employees, 
            many=True, 
            context={'request': request}
        ).data

        return Response({
            'organization_id': organization.id,
            'organization_name': organization.name,
            'current_employees_count': current_employees.count(),
            'total_hired_count': Employment.objects.filter(organization=organization).count(),
            'current_employees': current_employees_data,
        })



# ==================================================
# TALENT POOL / COMMUNITY MANAGEMENT
# ==================================================

class JoinTalentPoolView(APIView):
    """
    Candidate joins an organization's talent pool
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, organization_id):
        user = request.user

        if user.user_type != 'candidate':
            return Response(
                {"detail": "Only candidates can join talent pools"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            candidate = user.candidate_profile
        except Candidate.DoesNotExist:
            return Response(
                {"detail": "Candidate profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            organization = Organization.objects.get(id=organization_id)
        except Organization.DoesNotExist:
            return Response(
                {"detail": "Organization not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if already in talent pool
        existing = TalentPool.objects.filter(
            candidate=candidate,
            organization=organization
        ).first()

        if existing:
            if existing.is_active:
                return Response(
                    {"detail": "Already in talent pool"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            else:
                # Reactivate
                existing.is_active = True
                existing.save()
                talent_pool = existing
        else:
            # Create new
            talent_pool = TalentPool.objects.create(
                candidate=candidate,
                organization=organization,
                is_active=True
            )

        # Send notification to organization
        try:
            from notifications.models import Notification
            Notification.objects.create(
                user=organization.user,
                title="New Talent Pool Member",
                message=f"{candidate.name} joined your talent pool",
                notification_type='talent_pool',
            )
        except Exception as e:
            print(f"Failed to send notification: {e}")

        serializer = TalentPoolSerializer(talent_pool, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class LeaveTalentPoolView(APIView):
    """
    Candidate leaves an organization's talent pool
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, organization_id):
        user = request.user

        if user.user_type != 'candidate':
            return Response(
                {"detail": "Only candidates can leave talent pools"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            candidate = user.candidate_profile
        except Candidate.DoesNotExist:
            return Response(
                {"detail": "Candidate profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            talent_pool = TalentPool.objects.get(
                candidate=candidate,
                organization_id=organization_id,
                is_active=True
            )
        except TalentPool.DoesNotExist:
            return Response(
                {"detail": "Not in talent pool"},
                status=status.HTTP_404_NOT_FOUND
            )

        talent_pool.is_active = False
        talent_pool.save()

        return Response({
            "detail": "Left talent pool successfully"
        }, status=status.HTTP_200_OK)


class TalentPoolStatusView(APIView):
    """
    Check if candidate is in organization's talent pool
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, organization_id):
        user = request.user

        if user.user_type != 'candidate':
            return Response({
                "is_member": False,
                "can_join": False
            })

        try:
            candidate = user.candidate_profile
        except Candidate.DoesNotExist:
            return Response({
                "is_member": False,
                "can_join": False
            })

        is_member = TalentPool.objects.filter(
            candidate=candidate,
            organization_id=organization_id,
            is_active=True
        ).exists()

        return Response({
            "is_member": is_member,
            "can_join": not is_member
        })


class MyCommunitiesView(APIView):
    """
    Get all talent pools the candidate has joined
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.user_type != 'candidate':
            return Response(
                {"detail": "Only candidates can view their communities"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            candidate = user.candidate_profile
        except Candidate.DoesNotExist:
            return Response(
                {"detail": "Candidate profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        talent_pools = TalentPool.objects.filter(
            candidate=candidate,
            is_active=True
        ).select_related('organization').order_by('-joined_at')

        serializer = TalentPoolSerializer(
            talent_pools,
            many=True,
            context={'request': request}
        )

        return Response({
            'communities': serializer.data,
            'count': talent_pools.count()
        })


class TalentPoolMembersView(APIView):
    """
    Get all members of an organization's talent pool
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, organization_id):
        user = request.user

        # Check if user owns this organization
        if user.user_type != 'organization':
            return Response(
                {"detail": "Only organizations can view their talent pool"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            organization = Organization.objects.get(id=organization_id, user=user)
        except Organization.DoesNotExist:
            return Response(
                {"detail": "Organization not found or access denied"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get query parameters for filtering
        search = request.query_params.get('search', '')
        skill = request.query_params.get('skill', '')

        members = TalentPool.objects.filter(
            organization=organization,
            is_active=True
        ).select_related('candidate', 'candidate__user')

        # Apply filters
        if search:
            members = members.filter(
                candidate__name__icontains=search
            )

        if skill:
            # Filter by skill (JSON field)
            members = [m for m in members if skill.lower() in [s.lower() for s in m.candidate.skills]]

        serializer = TalentPoolSerializer(
            members,
            many=True,
            context={'request': request}
        )

        return Response({
            'members': serializer.data,
            'count': len(serializer.data)
        })


class TalentPoolStatsView(APIView):
    """
    Get statistics for an organization's talent pool
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, organization_id):
        try:
            organization = Organization.objects.get(id=organization_id)
        except Organization.DoesNotExist:
            return Response(
                {"detail": "Organization not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        total_members = TalentPool.objects.filter(
            organization=organization,
            is_active=True
        ).count()

        # Members joined in last 30 days
        from datetime import timedelta
        from django.utils import timezone
        thirty_days_ago = timezone.now() - timedelta(days=30)
        
        new_members = TalentPool.objects.filter(
            organization=organization,
            is_active=True,
            joined_at__gte=thirty_days_ago
        ).count()

        return Response({
            'organization_id': organization.id,
            'organization_name': organization.name,
            'total_members': total_members,
            'new_members_30_days': new_members,
        })



# ==================================================
# CONTACT FORM
# ==================================================

class ContactFormView(APIView):
    """
    Handle contact form submissions
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        name = request.data.get('name', '').strip()
        email = request.data.get('email', '').strip()
        message = request.data.get('message', '').strip()
        
        # Validation
        if not name or not email or not message:
            return Response(
                {"detail": "Name, email, and message are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Basic email validation
        if '@' not in email or '.' not in email:
            return Response(
                {"detail": "Invalid email address"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Send email
        success = send_contact_email(name, email, message)
        
        if success:
            return Response(
                {"detail": "Message sent successfully"},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {"detail": "Failed to send message. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



# ==================================================
# USER SETTINGS & PREFERENCES
# ==================================================

class UserPreferencesView(APIView):
    """
    Get and update user preferences
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get user preferences"""
        preferences, created = UserPreferences.objects.get_or_create(user=request.user)
        serializer = UserPreferencesSerializer(preferences)
        return Response(serializer.data)
    
    def put(self, request):
        """Update user preferences"""
        preferences, created = UserPreferences.objects.get_or_create(user=request.user)
        serializer = UserPreferencesSerializer(preferences, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    """
    Change user password
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Change password"""
        serializer = ChangePasswordSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        
        # Check current password
        if not user.check_password(serializer.validated_data['current_password']):
            return Response(
                {'current_password': 'Current password is incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set new password
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response(
            {'detail': 'Password updated successfully'},
            status=status.HTTP_200_OK
        )


class DeleteAccountView(APIView):
    """
    Delete user account (soft delete by deactivating)
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Deactivate user account"""
        password = request.data.get('password')
        
        if not password:
            return Response(
                {'detail': 'Password is required to delete account'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = request.user
        
        # Verify password
        if not user.check_password(password):
            return Response(
                {'detail': 'Incorrect password'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Deactivate account instead of deleting
        user.is_active = False
        user.save()
        
        return Response(
            {'detail': 'Account deactivated successfully'},
            status=status.HTTP_200_OK
        )
