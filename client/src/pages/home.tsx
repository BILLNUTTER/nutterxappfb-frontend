import { useState } from "react";
import { usePosts, useCreatePost, useLikePost, useCreateComment, useComments } from "@/hooks/use-posts";
import { useAuth } from "@/hooks/use-auth";
import { Card, Button, Avatar, TimeAgo } from "@/components/ui/shared";
import { Heart, MessageCircle, Send } from "lucide-react";
import type { Post } from "@shared/schema";

export default function HomeFeed() {
  const { data, isLoading, isError } = usePosts();
  const { user } = useAuth();

  const posts = Array.isArray(data)
    ? data
    : Array.isArray((data as any)?.posts)
    ? (data as any).posts
    : [];

  if (isLoading) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        Loading NX Connect feed...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-10 text-red-500">
        Failed to load feed
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">

      <h2 className="text-2xl font-bold text-center">NX Connect</h2>

      <CreatePostBox />

      {posts.length === 0 && (
        <Card className="text-center py-16">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-muted-foreground" />
          </div>

          <h3 className="text-xl font-bold mb-2">No posts yet</h3>

          <p className="text-muted-foreground">
            Be the first to share something on NX Connect!
          </p>
        </Card>
      )}

      {posts.map((post: Post) => {
        if (!post?.id || !post?.content) return null;

        return (
          <PostItem
            key={post.id}
            post={post}
            currentUserId={user?.id}
          />
        );
      })}
    </div>
  );
}

function CreatePostBox() {
  const [content, setContent] = useState("");
  const createPost = useCreatePost();
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!content.trim()) return;

    try {
      await createPost.mutateAsync({ content });
      setContent("");
    } catch (err) {
      console.error("Post failed:", err);
    }
  };

  return (
    <Card className="mb-8">
      <div className="flex gap-4">
        <Avatar url={user?.profilePicture} name={user?.name || "U"} />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share something on NX Connect..."
          className="flex-1 bg-transparent resize-none outline-none text-lg placeholder:text-muted-foreground min-h-[80px]"
        />
      </div>

      <div className="flex justify-end mt-4 pt-4 border-t border-border/50">
        <Button
          onClick={handleSubmit}
          disabled={!content.trim() || createPost.isPending}
        >
          {createPost.isPending ? "Posting..." : "Share Post"}
        </Button>
      </div>
    </Card>
  );
}

function PostItem({ post, currentUserId }: { post: Post; currentUserId?: string }) {
  const [showComments, setShowComments] = useState(false);
  const likePost = useLikePost();

  const likes = Array.isArray(post.likes) ? post.likes : [];

  const hasLiked =
    currentUserId && likes.length > 0
      ? likes.includes(currentUserId)
      : false;

  return (
    <Card className="transition-all hover:shadow-xl hover:border-border">
      
      <div className="flex items-center gap-3 mb-4">
        <Avatar
          url={post.author?.profilePicture}
          name={post.author?.name || "User"}
        />

        <div>
          <div className="font-bold text-foreground">
            {post.author?.name || "Unknown User"}
          </div>

          <div className="text-xs text-muted-foreground flex gap-1">
            @{post.author?.username || "user"} •{" "}
            {post.createdAt ? <TimeAgo date={post.createdAt} /> : "now"}
          </div>
        </div>
      </div>

      <p className="text-lg whitespace-pre-wrap mb-6">{post.content}</p>

      <div className="flex items-center gap-4 pt-4 border-t border-border/50">
        
        <button
          onClick={() => likePost.mutate(post.id)}
          className={`flex items-center gap-2 text-sm font-medium transition-colors ${
            hasLiked
              ? "text-pink-500"
              : "text-muted-foreground hover:text-pink-500"
          }`}
        >
          <Heart className={`w-5 h-5 ${hasLiked ? "fill-current" : ""}`} />
          {likes.length}
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          Comment
        </button>
      </div>

      {showComments && <CommentSection postId={post.id} />}
    </Card>
  );
}

function CommentSection({ postId }: { postId: string }) {
  const { data, isLoading } = useComments(postId);
  const createComment = useCreateComment();
  const [content, setContent] = useState("");
  const { user } = useAuth();

  const comments = Array.isArray(data) ? data : [];

  const handleSend = async () => {
    if (!content.trim()) return;

    try {
      await createComment.mutateAsync({ postId, content });
      setContent("");
    } catch (err) {
      console.error("Comment failed:", err);
    }
  };

  return (
    <div className="mt-6 pt-6 border-t border-border/50 space-y-4">
      
      {isLoading ? (
        <div className="text-sm text-muted-foreground">
          Loading comments...
        </div>
      ) : (
        comments.map((c: any) => (
          <div
            key={c.id}
            className="flex gap-3 bg-secondary/30 p-3 rounded-2xl"
          >
            <Avatar
              url={c.author?.profilePicture}
              name={c.author?.name || "U"}
              size="sm"
            />

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">
                  {c.author?.name || "User"}
                </span>

                {c.createdAt && <TimeAgo date={c.createdAt} />}
              </div>

              <p className="text-sm text-foreground mt-0.5">
                {c.content}
              </p>
            </div>
          </div>
        ))
      )}

      <div className="flex items-center gap-3 pt-2">
        <Avatar
          url={user?.profilePicture}
          name={user?.name || "U"}
          size="sm"
        />

        <div className="flex-1 flex items-center bg-secondary rounded-full px-4 py-2">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 bg-transparent border-none outline-none text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />

          <button
            onClick={handleSend}
            disabled={!content.trim() || createComment.isPending}
            className="text-primary disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
