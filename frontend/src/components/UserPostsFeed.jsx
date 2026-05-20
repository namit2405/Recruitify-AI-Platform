import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { fetchApi } from "@/lib/api";
import { useGetCallerUserProfile } from "../hooks/useQueries";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Heart, MessageCircle, Repeat2, MoreHorizontal, Trash2,
  Loader2, TrendingUp, Briefcase, Trophy, HelpCircle, Newspaper, Send,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const POST_TYPES = {
  update:      { label: "Update",      icon: TrendingUp,  color: "text-blue-500" },
  hiring:      { label: "Hiring",       icon: Briefcase,   color: "text-green-500" },
  achievement: { label: "Achievement",  icon: Trophy,      color: "text-yellow-500" },
  article:     { label: "Article",      icon: Newspaper,   color: "text-purple-500" },
  question:    { label: "Question",     icon: HelpCircle,  color: "text-orange-500" },
};

function AuthorAvatar({ author, size = "h-9 w-9" }) {
  return (
    <Avatar className={`${size} flex-shrink-0`}>
      <AvatarImage src={author?.avatar_url} />
      <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-bold text-sm">
        {author?.name?.charAt(0) || "?"}
      </AvatarFallback>
    </Avatar>
  );
}

function MiniCommentSection({ postSlug, userProfile }) {
  const [text, setText] = useState("");
  const qc = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", postSlug],
    queryFn: () => fetchApi(`/posts/${postSlug}/comments/`),
  });

  const addComment = useMutation({
    mutationFn: (data) => fetchApi(`/posts/${postSlug}/comments/`, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["comments", postSlug] }); qc.invalidateQueries({ queryKey: ["user-posts"] }); setText(""); },
    onError: () => toast.error("Failed to post comment."),
  });

  const name = userProfile?.organization?.name || userProfile?.candidate?.name || "You";
  const avatar = userProfile?.organization?.profile_picture_url || userProfile?.candidate?.profile_picture_url;

  return (
    <div className="mt-3 space-y-2 border-t border-gray-100 dark:border-gray-800 pt-3">
      <div className="flex gap-2">
        <Avatar className="h-7 w-7 flex-shrink-0">
          <AvatarImage src={avatar} />
          <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 text-xs font-bold">{name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 flex gap-2">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && text.trim()) { e.preventDefault(); addComment.mutate({ content: text.trim() }); } }}
            placeholder="Add a comment…"
            className="flex-1 text-xs px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {text.trim() && (
            <button onClick={() => addComment.mutate({ content: text.trim() })} disabled={addComment.isPending} className="text-blue-600 dark:text-blue-400">
              <Send className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      {comments.slice(0, 3).map(c => (
        <div key={c.id} className="flex gap-2">
          <AuthorAvatar author={c.author} size="h-6 w-6" />
          <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-1.5">
            <span className="text-xs font-semibold text-gray-900 dark:text-white mr-1">{c.author?.name}</span>
            <span className="text-xs text-gray-600 dark:text-gray-400">{c.content}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function PostCard({ post, userProfile, onDeleted }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [repostOpen, setRepostOpen] = useState(false);
  const [repostText, setRepostText] = useState("");

  const isOwn = post.author?.id === userProfile?.user?.id;
  const typeInfo = POST_TYPES[post.post_type] || POST_TYPES.update;
  const TypeIcon = typeInfo.icon;

  const like = useMutation({
    mutationFn: () => fetchApi(`/posts/${post.slug}/like/`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-posts"] }),
  });

  const deletePost = useMutation({
    mutationFn: () => fetchApi(`/posts/${post.slug}/`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["user-posts"] }); toast.success("Post deleted."); onDeleted?.(); },
  });

  const repost = useMutation({
    mutationFn: () =>
      post.is_reposted
        ? fetchApi(`/posts/${post.slug}/repost/`, { method: "DELETE" })
        : fetchApi(`/posts/${post.slug}/repost/`, { method: "POST", body: JSON.stringify({ content: repostText }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-posts"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
      setRepostOpen(false);
      setRepostText("");
      toast.success(post.is_reposted ? "Repost removed." : "Reposted!");
    },
    onError: (e) => toast.error(e?.body?.detail || "Action failed."),
  });

  const goToProfile = () => {
    if (!post.author?.profile_slug) return;
    navigate({ to: `/public/${post.author.user_type}/${post.author.profile_slug}` });
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-2">
        <div className="flex gap-2.5 cursor-pointer" onClick={goToProfile}>
          <AuthorAvatar author={post.author} />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-gray-900 dark:text-white text-sm hover:underline">{post.author?.name}</span>
              <Badge variant="outline" className="text-[10px] px-1 py-0 border-gray-300 dark:border-gray-600 text-gray-400">{post.author?.user_type}</Badge>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
              <TypeIcon className={`h-3 w-3 ${typeInfo.color}`} />
              <span>{typeInfo.label}</span>
              <span>·</span>
              <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
            </div>
          </div>
        </div>
        {isOwn && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <DropdownMenuItem onClick={() => deletePost.mutate()} className="text-red-600 dark:text-red-400 cursor-pointer">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-2">
        {post.original_post && (
          <div className="mb-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center gap-1.5 mb-1">
              <AuthorAvatar author={post.original_post.author} size="h-5 w-5" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{post.original_post.author?.name}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{post.original_post.content}</p>
          </div>
        )}
        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{post.content}</p>
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {post.tags.map((t, i) => <span key={i} className="text-xs text-blue-600 dark:text-blue-400">#{t}</span>)}
          </div>
        )}
      </div>

      {post.image_url && <img src={post.image_url} alt="post" className="w-full max-h-72 object-cover" />}

      {/* Stats */}
      {(post.likes_count > 0 || post.comments_count > 0 || post.reposts_count > 0) && (
        <div className="flex items-center justify-between px-4 py-1.5 text-xs text-gray-400 border-t border-gray-100 dark:border-gray-800">
          <span>{post.likes_count > 0 && `${post.likes_count} like${post.likes_count !== 1 ? "s" : ""}`}</span>
          <div className="flex gap-3">
            {post.comments_count > 0 && (
              <button onClick={() => setShowComments(v => !v)} className="hover:underline">
                {post.comments_count} comment{post.comments_count !== 1 ? "s" : ""}
              </button>
            )}
            {post.reposts_count > 0 && <span>{post.reposts_count} repost{post.reposts_count !== 1 ? "s" : ""}</span>}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex border-t border-gray-100 dark:border-gray-800">
        {[
          { icon: Heart,          label: post.is_liked ? "Liked" : "Like",     active: post.is_liked,    activeClass: "text-red-500",   onClick: () => like.mutate() },
          { icon: MessageCircle,  label: "Comment",                             active: showComments,     activeClass: "text-blue-500",  onClick: () => setShowComments(v => !v) },
          { icon: Repeat2,        label: post.is_reposted ? "Reposted" : "Repost", active: post.is_reposted, activeClass: "text-green-500", onClick: () => post.is_reposted ? repost.mutate() : setRepostOpen(true) },
        ].map(({ icon: Icon, label, active, activeClass, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${active ? activeClass : "text-gray-500 dark:text-gray-400"}`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {showComments && userProfile && (
        <div className="px-4 pb-3">
          <MiniCommentSection postSlug={post.slug} userProfile={userProfile} />
        </div>
      )}

      {/* Repost dialog */}
      <Dialog open={repostOpen} onOpenChange={setRepostOpen}>
        <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 max-w-md">
          <DialogHeader><DialogTitle className="text-gray-900 dark:text-white">Repost</DialogTitle></DialogHeader>
          <Textarea value={repostText} onChange={e => setRepostText(e.target.value)} placeholder="Add your thoughts (optional)…" rows={3} className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 resize-none text-sm" />
          <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{post.content}</div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRepostOpen(false)} className="border-gray-300 dark:border-gray-700">Cancel</Button>
            <Button onClick={() => repost.mutate()} disabled={repost.isPending} className="bg-green-600 hover:bg-green-700 text-white">
              {repost.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Repost"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function UserPostsFeed({ userId }) {
  const { data: userProfile } = useGetCallerUserProfile();
  const qc = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["user-posts", userId],
    queryFn: () => fetchApi(`/posts/?user_id=${userId}`),
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400 dark:text-gray-500">
        <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No posts yet.</p>
      </div>
    );
  }

  const originalPosts = posts.filter(p => !p.original_post);
  const reposts      = posts.filter(p =>  p.original_post);

  const renderGrid = (items) => (
    <div className="space-y-4">
      {items.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          userProfile={userProfile}
          onDeleted={() => qc.invalidateQueries({ queryKey: ["user-posts", userId] })}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Original posts */}
      {originalPosts.length > 0 && (
        <div>
          {reposts.length > 0 && (
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Posts
            </h3>
          )}
          {renderGrid(originalPosts)}
        </div>
      )}

      {/* Reposts */}
      {reposts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Repeat2 className="h-3.5 w-3.5" />
            Reposts
          </h3>
          {renderGrid(reposts)}
        </div>
      )}
    </div>
  );
}
