from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count

from accounts.models import Follow, Candidate
from .models import Post, PostLike, PostComment
from .serializers import PostSerializer, PostCreateSerializer, PostCommentSerializer


# ── Helpers ──────────────────────────────────────────────────────────────────

def _annotate(qs):
    return qs.annotate(
        likes_count_db=Count('likes', distinct=True),
        comments_count_db=Count('comments', distinct=True),
        reposts_count_db=Count('reposts', distinct=True),
    ).select_related('author', 'original_post__author')


# ── Feed ─────────────────────────────────────────────────────────────────────

class FeedView(APIView):
    """
    Personalised feed for the authenticated user.

    Ranking factors:
    1. Posts from people the user follows (highest priority)
    2. Posts tagged with skills matching the user's profile
    3. Recent posts from everyone else (discovery)

    Returns paginated results (page / page_size query params).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        page      = max(int(request.query_params.get('page', 1)), 1)
        page_size = min(int(request.query_params.get('page_size', 20)), 50)
        offset    = (page - 1) * page_size

        user = request.user

        # Who does this user follow?
        following_ids = list(
            Follow.objects.filter(follower=user).values_list('following_id', flat=True)
        )

        # What skills does this user have?
        user_skills = []
        if user.user_type == 'candidate':
            try:
                user_skills = [s.lower() for s in (user.candidate_profile.skills or [])]
            except Exception:
                pass

        # Build feed query — union approach via ordering trick
        base_qs = _annotate(Post.objects.all())

        # Tier 1: followed users
        tier1 = base_qs.filter(author_id__in=following_ids)

        # Tier 2: skill-matched posts (not already in tier1)
        skill_q = Q()
        for skill in user_skills[:10]:  # cap to avoid huge queries
            skill_q |= Q(tags__icontains=skill)
        tier2 = base_qs.filter(skill_q).exclude(author_id__in=following_ids) if user_skills else Post.objects.none()

        # Tier 3: everything else (discovery)
        exclude_ids = list(tier1.values_list('id', flat=True)) + list(tier2.values_list('id', flat=True))
        tier3 = base_qs.exclude(id__in=exclude_ids)

        # Merge and paginate
        from itertools import chain
        all_posts = list(chain(
            tier1.order_by('-created_at'),
            tier2.order_by('-created_at'),
            tier3.order_by('-created_at'),
        ))

        total   = len(all_posts)
        page_posts = all_posts[offset: offset + page_size]

        serializer = PostSerializer(page_posts, many=True, context={'request': request})
        return Response({
            'results':   serializer.data,
            'count':     total,
            'page':      page,
            'page_size': page_size,
            'has_next':  offset + page_size < total,
        })


# ── Post CRUD ─────────────────────────────────────────────────────────────────

class PostListCreateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        """List posts by a specific user (profile feed)."""
        user_id = request.query_params.get('user_id')
        if user_id:
            qs = _annotate(Post.objects.filter(author_id=user_id))
        else:
            qs = _annotate(Post.objects.all())
        serializer = PostSerializer(qs.order_by('-created_at')[:30], many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        """Create a new post."""
        serializer = PostCreateSerializer(data=request.data)
        if serializer.is_valid():
            post = serializer.save(author=request.user)
            out  = PostSerializer(
                _annotate(Post.objects.filter(pk=post.pk)).first(),
                context={'request': request}
            )
            return Response(out.data, status=201)
        return Response(serializer.errors, status=400)


class PostDetailView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]

    def get(self, request, slug):
        post = get_object_or_404(_annotate(Post.objects.all()), slug=slug)
        return Response(PostSerializer(post, context={'request': request}).data)

    def patch(self, request, slug):
        post = get_object_or_404(Post, slug=slug, author=request.user)
        serializer = PostCreateSerializer(post, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            out = PostSerializer(
                _annotate(Post.objects.filter(pk=post.pk)).first(),
                context={'request': request}
            )
            return Response(out.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, slug):
        post = get_object_or_404(Post, slug=slug, author=request.user)
        post.delete()
        return Response(status=204)


# ── Like / Unlike ─────────────────────────────────────────────────────────────

class PostLikeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        post = get_object_or_404(Post, slug=slug)
        like, created = PostLike.objects.get_or_create(user=request.user, post=post)
        if not created:
            like.delete()
            return Response({'liked': False, 'likes_count': post.likes.count()})

        # Notify author (skip self-likes)
        if post.author != request.user:
            try:
                from notifications.models import Notification
                author_name = request.user.email
                try:
                    if request.user.user_type == 'candidate':
                        author_name = request.user.candidate_profile.name
                    else:
                        author_name = request.user.organization_profile.name
                except Exception:
                    pass
                Notification.objects.create(
                    user=post.author,
                    notification_type='post_like',
                    title='Someone liked your post',
                    message=f'{author_name} liked your post.',
                )
            except Exception:
                pass

        return Response({'liked': True, 'likes_count': post.likes.count()})


# ── Comments ──────────────────────────────────────────────────────────────────

class PostCommentListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        post     = get_object_or_404(Post, slug=slug)
        comments = post.comments.filter(parent=None).select_related('author').prefetch_related('replies__author')
        serializer = PostCommentSerializer(comments, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, slug):
        post = get_object_or_404(Post, slug=slug)
        serializer = PostCommentSerializer(data={**request.data, 'post': post.id})
        if serializer.is_valid():
            comment = serializer.save(author=request.user, post=post)

            # Notify post author
            if post.author != request.user:
                try:
                    from notifications.models import Notification
                    author_name = request.user.email
                    try:
                        if request.user.user_type == 'candidate':
                            author_name = request.user.candidate_profile.name
                        else:
                            author_name = request.user.organization_profile.name
                    except Exception:
                        pass
                    Notification.objects.create(
                        user=post.author,
                        notification_type='post_comment',
                        title='New comment on your post',
                        message=f'{author_name} commented: "{comment.content[:80]}"',
                    )
                except Exception:
                    pass

            out = PostCommentSerializer(comment, context={'request': request})
            return Response(out.data, status=201)
        return Response(serializer.errors, status=400)


class PostCommentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, slug, comment_id):
        comment = get_object_or_404(PostComment, id=comment_id, post__slug=slug)
        if comment.author != request.user:
            return Response({'detail': 'Permission denied'}, status=403)
        comment.delete()
        return Response(status=204)


# ── Repost ────────────────────────────────────────────────────────────────────

class PostRepostView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        original = get_object_or_404(Post, slug=slug)
        # Prevent double-repost of the same post by the same user
        if Post.objects.filter(author=request.user, original_post=original).exists():
            return Response({'detail': 'Already reposted'}, status=400)

        content = request.data.get('content', '')
        post = Post.objects.create(
            author=request.user,
            content=content,
            original_post=original,
            post_type='update',
        )
        out = PostSerializer(
            _annotate(Post.objects.filter(pk=post.pk)).first(),
            context={'request': request}
        )
        return Response(out.data, status=201)

    def delete(self, request, slug):
        """Undo a repost — deletes the repost the current user made of this post."""
        original = get_object_or_404(Post, slug=slug)
        repost = Post.objects.filter(author=request.user, original_post=original).first()
        if not repost:
            return Response({'detail': 'You have not reposted this post'}, status=404)
        repost.delete()
        return Response({'reposted': False, 'reposts_count': original.reposts.count()}, status=200)
