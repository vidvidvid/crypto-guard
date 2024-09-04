import { useState, useEffect, useCallback } from "react";
import { useAttestations } from "./useAttestations";

export function useComments(currentUrl: string) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { createAttestation, getAttestations } = useAttestations();

  const COMMENT_SCHEMA_ID = import.meta.env.VITE_ATTESTATION_COMMENT_ID;

  const loadComments = useCallback(async () => {
    if (!COMMENT_SCHEMA_ID || !currentUrl) return;
    setLoading(true);
    setError(null);
    try {
      const attestations = await getAttestations(COMMENT_SCHEMA_ID, currentUrl);
      setComments(
        attestations.filter(
          (att: any) => att.decodedData && !att.decodedData.error
        )
      );
    } catch (error) {
      console.error("Error loading comments:", error);
      setError("Failed to load comments");
    } finally {
      setLoading(false);
    }
  }, [COMMENT_SCHEMA_ID, currentUrl, getAttestations]);

  useEffect(() => {
    if (currentUrl && COMMENT_SCHEMA_ID) {
      loadComments();
    }
  }, [currentUrl, COMMENT_SCHEMA_ID, loadComments]);

  const addComment = async (newComment: string) => {
    if (!COMMENT_SCHEMA_ID || !currentUrl) {
      throw new Error("Missing required information to add comment");
    }

    try {
      await createAttestation(COMMENT_SCHEMA_ID, currentUrl, {
        comment: newComment,
      });
      await loadComments();
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  };

  return { comments, addComment, loading, error };
}
