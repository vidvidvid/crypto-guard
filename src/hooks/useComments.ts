import { useState, useEffect, useCallback } from "react";
import { useAttestations } from "./useAttestations";
import { useCommentVotes } from "./useCommentVotes";
import { useToast } from "@chakra-ui/react";
import { useWeb3AuthContext } from "../contexts/Web3AuthContext";

export function useComments(currentUrl: string) {
  const [comments, setComments] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [voteLoading, setVoteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { createAttestation, getAttestations } = useAttestations();
  const { getVotesForComments, voteOnComment } = useCommentVotes();
  const { ethAddress } = useWeb3AuthContext();
  const toast = useToast();

  const COMMENT_SCHEMA_ID = import.meta.env.VITE_ATTESTATION_COMMENT_ID;

  const loadComments = useCallback(async () => {
    if (!COMMENT_SCHEMA_ID || !currentUrl) return;
    setInitialLoading(true);
    setError(null);
    try {
      const attestations = await getAttestations(
        COMMENT_SCHEMA_ID,
        currentUrl.toLowerCase()
      );

      // Group attestations by user
      const userComments = attestations.reduce((acc, attestation) => {
        const attester = attestation.attester.toLowerCase();
        if (!acc[attester]) {
          acc[attester] = [];
        }
        acc[attester].push(attestation);
        return acc;
      }, {} as Record<string, any[]>);

      // Get the latest comment for each user and mark as edited if necessary
      const latestComments = Object.entries(userComments).map(
        ([attester, userAttestations]) => {
          const sortedAttestations = userAttestations.sort(
            (a, b) =>
              new Date(b.attestTimestamp).getTime() -
              new Date(a.attestTimestamp).getTime()
          );
          const latestAttestation = sortedAttestations[0];
          return {
            ...latestAttestation,
            isEdited: sortedAttestations.length > 1,
            attester,
          };
        }
      );

      const commentIds = latestComments.map((comment) => comment.id);
      const votesMap = await getVotesForComments(commentIds);

      const commentsWithVotes = latestComments.map((comment) => ({
        ...comment,
        votes: votesMap[comment.id] || {
          upvotes: 0,
          downvotes: 0,
          userVote: null,
        },
      }));

      // Sort comments to ensure logged-in user's comment is first, then sort by timestamp
      const sortedComments = commentsWithVotes.sort((a, b) => {
        if (a.attester.toLowerCase() === ethAddress?.toLowerCase()) return -1;
        if (b.attester.toLowerCase() === ethAddress?.toLowerCase()) return 1;
        return (
          new Date(b.attestTimestamp).getTime() -
          new Date(a.attestTimestamp).getTime()
        );
      });

      setComments(sortedComments);
    } catch (error) {
      console.error("Error loading comments:", error);
      setError("Failed to load comments");
    } finally {
      setInitialLoading(false);
    }
  }, [
    COMMENT_SCHEMA_ID,
    currentUrl,
    getAttestations,
    getVotesForComments,
    ethAddress,
  ]);

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

      await loadComments();
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  };

  const handleVote = async (commentId: string, isUpvote: boolean) => {
    setVoteLoading(true);
    try {
      await voteOnComment(commentId, isUpvote);
      await loadComments();
    } catch (error) {
      console.error("Error voting on comment:", error);
      toast({
        title: "Error",
        description: "Failed to vote on comment",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setVoteLoading(false);
    }
  };

  return {
    comments,
    addComment,
    handleVote,
    initialLoading,
    voteLoading,
    error,
  };
}
