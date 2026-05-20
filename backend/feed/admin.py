from django.contrib import admin
from .models import Post, PostLike, PostComment

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display  = ('author', 'post_type', 'likes_count', 'comments_count', 'created_at')
    list_filter   = ('post_type',)
    search_fields = ('author__email', 'content')

@admin.register(PostLike)
class PostLikeAdmin(admin.ModelAdmin):
    list_display = ('user', 'post', 'created_at')

@admin.register(PostComment)
class PostCommentAdmin(admin.ModelAdmin):
    list_display  = ('author', 'post', 'parent', 'created_at')
    search_fields = ('author__email', 'content')
