import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function PostInteractions({ postId }) {
  const [session, setSession] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      loadData(currentSession);
    });

    return () => subscription.unsubscribe();
  }, [postId]);

  async function loadData(currentSession = session) {
    setLoading(true);

    const [{ data: likeData }, { data: commentData }] =
      await Promise.all([
        supabase
          .from("likes")
          .select("id, user_id")
          .eq("post_id", postId),

        supabase
          .from("comments")
          .select("*")
          .eq("post_id", postId)
          .order("created_at", { ascending: true })
      ]);

    setLikes(likeData?.length || 0);
    setComments(commentData || []);

    if (currentSession?.user) {
      setLiked(
        (likeData || []).some(
          (item) => item.user_id === currentSession.user.id
        )
      );
    } else {
      setLiked(false);
    }

    setLoading(false);
  }

  async function toggleLike() {
    if (!session?.user) {
      setError("Sign in to like this post.");
      return;
    }

    setError("");

    if (liked) {
      const { error: deleteError } = await supabase
        .from("likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", session.user.id);

      if (deleteError) {
        setError(deleteError.message);
        return;
      }
    } else {
      const { error: insertError } = await supabase
        .from("likes")
        .insert({
          post_id: postId,
          user_id: session.user.id
        });

      if (insertError) {
        setError(insertError.message);
        return;
      }
    }

    await loadData(session);
  }

  async function addComment(event) {
    event.preventDefault();

    if (!session?.user) {
      setError("Sign in to comment.");
      return;
    }

    if (!comment.trim()) {
      return;
    }

    setSaving(true);
    setError("");

    const { error: insertError } = await supabase
      .from("comments")
      .insert({
        post_id: postId,
        user_id: session.user.id,
        content: comment.trim()
      });

    if (insertError) {
      setError(insertError.message);
    } else {
      setComment("");
      await loadData(session);
    }

    setSaving(false);
  }

  if (loading) {
    return <small>Loading interactions...</small>;
  }

  return (
    <div className="post-interactions">
      <button type="button" onClick={toggleLike}>
        {liked ? "Unlike" : "Like"} ({likes})
      </button>

      <div className="post-comments">
        <strong>Comments ({comments.length})</strong>

        {comments.map((item) => (
          <div key={item.id} className="comment-item">
            <p>{item.content}</p>
          </div>
        ))}

        {session?.user ? (
          <form onSubmit={addComment}>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Write a comment"
              rows="3"
            />

            <button type="submit" disabled={saving}>
              {saving ? "Posting..." : "Comment"}
            </button>
          </form>
        ) : (
          <small>Sign in to comment or like.</small>
        )}
      </div>

      {error && <p className="manager-error">{error}</p>}
    </div>
  );
}
