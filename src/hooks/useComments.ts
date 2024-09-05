import { useState, useEffect, useCallback } from "react";
import { useAttestations } from "./useAttestations";
import { useCommentVotes } from "./useCommentVotes";
import { useToast } from "@chakra-ui/react";
import { useWeb3AuthContext } from "../contexts/Web3AuthContext";

export function useComments(currentUrl: string) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { createAttestation, getAttestations } = useAttestations();
  const { getVotesForComments, voteOnComment } = useCommentVotes();
  const { ethAddress } = useWeb3AuthContext();
  const toast = useToast();

  const COMMENT_SCHEMA_ID = import.meta.env.VITE_ATTESTATION_COMMENT_ID;

  const loadComments = useCallback(async () => {
    if (!COMMENT_SCHEMA_ID || !currentUrl) return;
    setLoading(true);
    setError(null);
    try {
      // Use toLowerCase only for the URL, not for comment IDs
      const attestations = await getAttestations(
        COMMENT_SCHEMA_ID,
        currentUrl.toLowerCase()
      );

      const commentIds = attestations.map((att: any) => att.id);
      const votesMap = await getVotesForComments(commentIds);

      const commentsWithVotes = attestations.map((att: any) => ({
        ...att,
        votes: votesMap[att.id] || { upvotes: 0, downvotes: 0, userVote: null },
      }));

      setComments(commentsWithVotes);
    } catch (error) {
      console.error("Error loading comments:", error);
      setError("Failed to load comments");
    } finally {
      setLoading(false);
    }
  }, [COMMENT_SCHEMA_ID, currentUrl, getAttestations, getVotesForComments]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const addComment = async (newComment: string) => {
    if (!COMMENT_SCHEMA_ID || !currentUrl || !ethAddress) {
      throw new Error("Missing required information to add comment");
    }

    try {
      await createAttestation(COMMENT_SCHEMA_ID, currentUrl, {
        url: currentUrl,
        comment: newComment,
      });

      toast({
        title: "Success",
        description: "Comment added successfully!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      await loadComments();
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  };

  const handleVote = async (commentId: string, isUpvote: boolean) => {
    await voteOnComment(commentId, isUpvote);
    await loadComments();
  };

  return { comments, addComment, handleVote, loading, error };
}
