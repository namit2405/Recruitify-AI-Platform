from django.urls import path
from . import views

urlpatterns = [
    # Personalised feed
    path('feed/',                                    views.FeedView.as_view(),                  name='feed'),

    # Post CRUD
    path('posts/',                                   views.PostListCreateView.as_view(),         name='post-list-create'),
    path('posts/<slug:slug>/',                       views.PostDetailView.as_view(),             name='post-detail'),

    # Like / unlike (toggle)
    path('posts/<slug:slug>/like/',                  views.PostLikeView.as_view(),               name='post-like'),

    # Comments
    path('posts/<slug:slug>/comments/',              views.PostCommentListCreateView.as_view(),  name='post-comments'),
    path('posts/<slug:slug>/comments/<int:comment_id>/', views.PostCommentDetailView.as_view(), name='post-comment-detail'),

    # Repost
    path('posts/<slug:slug>/repost/',                views.PostRepostView.as_view(),             name='post-repost'),
]
