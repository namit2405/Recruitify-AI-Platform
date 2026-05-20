from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Post, PostLike, PostComment

User = get_user_model()


# ── Compact author info ──────────────────────────────────────────────────────

class PostAuthorSerializer(serializers.ModelSerializer):
    name            = serializers.SerializerMethodField()
    avatar_url      = serializers.SerializerMethodField()
    profile_slug    = serializers.SerializerMethodField()
    user_type       = serializers.CharField()

    class Meta:
        model  = User
        fields = ('id', 'email', 'user_type', 'name', 'avatar_url', 'profile_slug')

    def get_name(self, obj):
        if obj.user_type == 'organization':
            try:
                return obj.organization_profile.name
            except Exception:
                return obj.email
        else:
            try:
                return obj.candidate_profile.name
            except Exception:
                return obj.email

    def get_avatar_url(self, obj):
        request = self.context.get('request')
        try:
            if obj.user_type == 'organization':
                pic = obj.organization_profile.profile_picture
            else:
                pic = obj.candidate_profile.profile_picture
            if pic:
                url = pic.url
                return request.build_absolute_uri(url) if request else url
        except Exception:
            pass
        return None

    def get_profile_slug(self, obj):
        try:
            if obj.user_type == 'organization':
                return obj.organization_profile.slug
            else:
                return obj.candidate_profile.slug
        except Exception:
            return None


# ── Comment ──────────────────────────────────────────────────────────────────

class PostCommentSerializer(serializers.ModelSerializer):
    author      = PostAuthorSerializer(read_only=True)
    replies     = serializers.SerializerMethodField()
    reply_count = serializers.SerializerMethodField()

    class Meta:
        model  = PostComment
        fields = ('id', 'author', 'post', 'parent', 'content',
                  'created_at', 'updated_at', 'replies', 'reply_count')
        read_only_fields = ('id', 'author', 'created_at', 'updated_at')

    def get_replies(self, obj):
        if obj.parent is None:
            qs = obj.replies.select_related('author').order_by('created_at')[:5]
            return PostCommentSerializer(qs, many=True, context=self.context).data
        return []

    def get_reply_count(self, obj):
        return obj.replies.count() if obj.parent is None else 0


# ── Post ─────────────────────────────────────────────────────────────────────

class PostSerializer(serializers.ModelSerializer):
    author          = PostAuthorSerializer(read_only=True)
    image_url       = serializers.SerializerMethodField()
    likes_count     = serializers.SerializerMethodField()
    comments_count  = serializers.SerializerMethodField()
    reposts_count   = serializers.SerializerMethodField()
    is_liked        = serializers.SerializerMethodField()
    is_reposted     = serializers.SerializerMethodField()
    original_post   = serializers.SerializerMethodField()

    class Meta:
        model  = Post
        fields = (
            'id', 'slug', 'author', 'content', 'image', 'image_url',
            'post_type', 'tags',
            'likes_count', 'comments_count', 'reposts_count',
            'is_liked', 'is_reposted',
            'original_post', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'slug', 'author', 'created_at', 'updated_at',
                            'is_liked', 'image_url')

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image:
            url = obj.image.url
            return request.build_absolute_uri(url) if request else url
        return None

    def get_likes_count(self, obj):
        # Use DB annotation if available (avoids extra query)
        if hasattr(obj, 'likes_count_db'):
            return obj.likes_count_db
        return obj.likes.count()

    def get_comments_count(self, obj):
        if hasattr(obj, 'comments_count_db'):
            return obj.comments_count_db
        return obj.comments.filter(parent=None).count()

    def get_reposts_count(self, obj):
        if hasattr(obj, 'reposts_count_db'):
            return obj.reposts_count_db
        return obj.reposts.count()

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def get_is_reposted(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Post.objects.filter(author=request.user, original_post=obj).exists()
        return False

    def get_original_post(self, obj):
        if obj.original_post:
            return PostSerializer(obj.original_post, context=self.context).data
        return None


class PostCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Post
        fields = ('content', 'image', 'post_type', 'tags', 'original_post')
