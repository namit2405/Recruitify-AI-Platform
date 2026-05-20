import { useState, useRef, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { useGetCallerUserProfile } from "../hooks/useQueries";
import { usePageTitle } from "../hooks/usePageTitle";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Heart, MessageCircle, Repeat2, Send, Image, X, MoreHorizontal,
  Trash2, Edit3, Loader2, Briefcase, Trophy, HelpCircle, Newspaper,
  TrendingUp, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const POST_TYPES = [
  { value: "update",      label: "Update",      icon: TrendingUp,  color: "text-blue-500" },
  { value: "hiring",      label: "Hiring",       icon: Briefcase,   color: "text-green-500" },
  { value: "achievement", label: "Achievement",  icon: Trophy,      color: "text-yellow-500" },
  { value: "article",     label: "Article",      icon: Newspaper,   color: "text-purple-500" },
  { value: "question",    label: "Question",     icon: HelpCircle,  color: "text-orange-500" },
];

// ── Author avatar helper ─────────────────────────────────────────────────────
function AuthorAvatar({ author, size = "h-10 w-10" }) {
  return (
    <Avatar className={`${size} flex-shrink-0`}>
      <AvatarImage src={author?.avatar_url} />
      <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-bold">
        {author?.name?.charAt(0) || "?"}
      </AvatarFallback>
    </Avatar>
  );
}

// ── Create Post Box ──────────────────────────────────────────────────────────
function CreatePostBox({ userProfile, onCreated }) {
  const [open, setOpen]       = useState(false);
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState("update");
  const [tags, setTags]       = useState("");
  const [image, setImage]     = useState(null);
  const [preview, setPreview] = useState(null);
  const fileRef               = useRef();
  const qc                    = useQueryClient();

  const create = useMutation({
    mutationFn: (fd) => fetchApi("/posts/", { method: "POST", body: fd }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["user-posts"] });
      setContent(""); setImage(null); setPreview(null); setTags(""); setOpen(false);
      toast.success("Post published!");
      onCreated?.();
    },
    onError: () => toast.error("Failed to publish post."),
  });

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = () => {
    if (!content.trim()) return toast.error("Write something first.");
    const fd = new FormData();
    fd.append("content", content.trim());
    fd.append("post_type", postType);
    const tagList = tags.split(",").map(t => t.trim()).filter(Boolean);
    fd.append("tags", JSON.stringify(tagList));
    if (image) fd.append("image", image);
    create.mutate(fd);
  };

  const name = userProfile?.organization?.name || userProfile?.candidate?.name || "You";
  const avatar = userProfile?.organization?.profile_picture_url || userProfile?.candidate?.profile_picture_url;
  const TypeIcon = POST_TYPES.find(t => t.value === postType)?.icon || TrendingUp;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
      <div className="flex gap-3 items-center">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={avatar} />
          <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 font-bold">
            {name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <button
          onClick={() => setOpen(true)}
          className="flex-1 text-left px-4 py-2.5 rounded-full border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
        >
          Share a professional update, {name.split(" ")[0]}…
        </button>
      </div>

      <div className="flex gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
        {POST_TYPES.slice(0, 4).map(({ value, label, icon: Icon, color }) => (
          <button
            key={value}
            onClick={() => { setPostType(value); setOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Icon className={`h-4 w-4 ${color}`} />
            {label}
          </button>
        ))}
      </div>

      {/* Compose dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Create Post</DialogTitle>
          </DialogHeader>

          <div className="flex gap-3 mb-3">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={avatar} />
              <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 font-bold">{name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{name}</p>
              {/* Post type selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mt-0.5">
                    <TypeIcon className="h-3.5 w-3.5" />
                    {POST_TYPES.find(t => t.value === postType)?.label}
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                  {POST_TYPES.map(({ value, label, icon: Icon, color }) => (
                    <DropdownMenuItem key={value} onClick={() => setPostType(value)} className="cursor-pointer">
                      <Icon className={`mr-2 h-4 w-4 ${color}`} />
                      {label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="What's on your mind? Share an update, insight, or question…"
            rows={5}
            className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 resize-none text-sm"
            autoFocus
          />

          {/* Tags */}
          <input
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="Tags (comma-separated): React, Python, Hiring…"
            className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Image preview */}
          {preview && (
            <div className="relative rounded-lg overflow-hidden">
              <img src={preview} alt="preview" className="w-full max-h-48 object-cover" />
              <button
                onClick={() => { setImage(null); setPreview(null); }}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <Image className="h-5 w-5" />
              Photo
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />

            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || create.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Comment section ──────────────────────────────────────────────────────────
function CommentSection({ postSlug, userProfile }) {
  const [text, setText] = useState("");
  const qc = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["comments", postSlug],
    queryFn: () => fetchApi(`/posts/${postSlug}/comments/`),
  });

  const addComment = useMutation({
    mutationFn: (data) => fetchApi(`/posts/${postSlug}/comments/`, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", postSlug] });
      qc.invalidateQueries({ queryKey: ["feed"] });
      setText("");
    },
    onError: () => toast.error("Failed to post comment."),
  });

  const deleteComment = useMutation({
    mutationFn: (id) => fetchApi(`/posts/${postSlug}/comments/${id}/`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", postSlug] }),
  });

  const name = userProfile?.organization?.name || userProfile?.candidate?.name || "You";
  const avatar = userProfile?.organization?.profile_picture_url || userProfile?.candidate?.profile_picture_url;

  return (
    <div className="mt-3 space-y-3">
      {/* Input */}
      <div className="flex gap-2">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={avatar} />
          <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 text-xs font-bold">{name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 flex gap-2">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && text.trim()) { e.preventDefault(); addComment.mutate({ content: text.trim() }); } }}
            placeholder="Add a comment…"
            className="flex-1 text-sm px-3 py-2 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {text.trim() && (
            <button
              onClick={() => addComment.mutate({ content: text.trim() })}
              disabled={addComment.isPending}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Comments list */}
      {isLoading ? (
        <div className="flex justify-center py-2"><Loader2 className="h-4 w-4 animate-spin text-gray-400" /></div>
      ) : (
        <div className="space-y-2">
          {comments.map(c => (
            <div key={c.id} className="flex gap-2 group">
              <AuthorAvatar author={c.author} size="h-7 w-7" />
              <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-2xl px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-900 dark:text-white">{c.author?.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                    {c.author?.id === userProfile?.user?.id && (
                      <button
                        onClick={() => deleteComment.mutate(c.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Single Post Card ─────────────────────────────────────────────────────────
function PostCard({ post, userProfile }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [repostOpen, setRepostOpen] = useState(false);
  const [repostText, setRepostText] = useState("");

  const isOwn = post.author?.id === userProfile?.user?.id;
  const typeInfo = POST_TYPES.find(t => t.value === post.post_type) || POST_TYPES[0];
  const TypeIcon = typeInfo.icon;

  const like = useMutation({
    mutationFn: () => fetchApi(`/posts/${post.slug}/like/`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed"] }),
  });

  const deletePost = useMutation({
    mutationFn: () => fetchApi(`/posts/${post.slug}/`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["feed"] }); toast.success("Post deleted."); },
  });

  const repost = useMutation({
    mutationFn: () =>
      post.is_reposted
        ? fetchApi(`/posts/${post.slug}/repost/`, { method: "DELETE" })
        : fetchApi(`/posts/${post.slug}/repost/`, { method: "POST", body: JSON.stringify({ content: repostText }) }),
    onSuccess: () => {
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
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-3">
        <div className="flex gap-3 cursor-pointer" onClick={goToProfile}>
          <AuthorAvatar author={post.author} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-white text-sm hover:underline">
                {post.author?.name}
              </span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400">
                {post.author?.user_type}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
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
              <DropdownMenuItem
                onClick={() => deletePost.mutate()}
                className="text-red-600 dark:text-red-400 cursor-pointer"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        {/* Repost original */}
        {post.original_post && (
          <div className="mb-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center gap-2 mb-1">
              <AuthorAvatar author={post.original_post.author} size="h-6 w-6" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{post.original_post.author?.name}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{post.original_post.content}</p>
          </div>
        )}

        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{post.content}</p>

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {post.tags.map((tag, i) => (
              <span key={i} className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Image */}
      {post.image_url && (
        <img
          src={post.image_url}
          alt="post"
          className="w-full max-h-96 object-cover"
        />
      )}

      {/* Stats */}
      {(post.likes_count > 0 || post.comments_count > 0 || post.reposts_count > 0) && (
        <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-400 border-t border-gray-100 dark:border-gray-800">
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

      {/* Action buttons */}
      <div className="flex border-t border-gray-100 dark:border-gray-800">
        {[
          {
            icon: Heart,
            label: post.is_liked ? "Liked" : "Like",
            active: post.is_liked,
            activeClass: "text-red-500",
            onClick: () => like.mutate(),
          },
          {
            icon: MessageCircle,
            label: "Comment",
            active: showComments,
            activeClass: "text-blue-500",
            onClick: () => setShowComments(v => !v),
          },
          {
            icon: Repeat2,
            label: post.is_reposted ? "Reposted" : "Repost",
            active: post.is_reposted,
            activeClass: "text-green-500",
            onClick: () => post.is_reposted ? repost.mutate() : setRepostOpen(true),
          },
        ].map(({ icon: Icon, label, active, activeClass, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
              active ? activeClass : "text-gray-500 dark:text-gray-400"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Comments */}
      {showComments && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800 pt-3">
          <CommentSection postSlug={post.slug} userProfile={userProfile} />
        </div>
      )}

      {/* Repost dialog */}
      <Dialog open={repostOpen} onOpenChange={setRepostOpen}>
        <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Repost</DialogTitle>
          </DialogHeader>
          <Textarea
            value={repostText}
            onChange={e => setRepostText(e.target.value)}
            placeholder="Add your thoughts (optional)…"
            rows={3}
            className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 resize-none text-sm"
          />
          <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
            {post.content}
          </div>
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

// ── Main Feed Page ────────────────────────────────────────────────────────────
export default function FeedPage() {
  usePageTitle("Feed");
  const { data: userProfile } = useGetCallerUserProfile();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: ({ pageParam = 1 }) => fetchApi(`/feed/?page=${pageParam}&page_size=15`),
    getNextPageParam: (last) => last.has_next ? last.page + 1 : undefined,
    initialPageParam: 1,
  });

  const posts = data?.pages.flatMap(p => p.results) ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-2xl">
        {/* Create post */}
        {userProfile && (
          <div className="mb-5">
            <CreatePostBox userProfile={userProfile} onCreated={refetch} />
          </div>
        )}

        {/* Feed */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <TrendingUp className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">Your feed is empty</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Follow people and organizations to see their updates here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <PostCard key={post.id} post={post} userProfile={userProfile} />
            ))}

            {hasNextPage && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                >
                  {isFetchingNextPage ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Load more
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
