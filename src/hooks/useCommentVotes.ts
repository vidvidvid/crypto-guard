import { useState, useCallback } from "react";
import { useAttestations } from "./useAttestations";
import { useWeb3AuthContext } from "../contexts/Web3AuthContext";
import { useToast } from "@chakra-ui/react";

export function useCommentVotes(currentUrl: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { createAttestation, getAttestations } = useAttestations();
  const { ethAddress } = useWeb3AuthContext();
  const toast = useToast();

  const VOTE_SCHEMA_ID = import.meta.env.VITE_ATTESTATION_VOTE_ID;

  const getVotesForComments = useCallback(
    async (commentIds: string[]) => {
      if (!VOTE_SCHEMA_ID || !currentUrl) return {};
      setLoading(true);
      setError(null);
      try {
        const attestations = await getAttestations(VOTE_SCHEMA_ID, currentUrl);
        const voteMap = commentIds.reduce((acc, id) => {
          acc[id] = { upvotes: 0, downvotes: 0, userVote: null };
          return acc;
        }, {} as Record<string, { upvotes: number; downvotes: number; userVote: number | null }>);

        attestations.forEach((attestation: any) => {
          const {
            commentId,
            vote,
            ethAddress: voterAddress,
          } = attestation.decodedData;
          if (voteMap[commentId]) {
            const voteValue = typeof vote === "bigint" ? Number(vote) : vote;
            if (voteValue === 1) voteMap[commentId].upvotes++;
            else if (voteValue === 0) voteMap[commentId].downvotes++;

            if (voterAddress.toLowerCase() === ethAddress?.toLowerCase()) {
              voteMap[commentId].userVote = voteValue;
            }
          }
        });

        return voteMap;
      } catch (err) {
        console.error("Error fetching votes:", err);
        setError("Failed to fetch votes");
        return {};
      } finally {
        setLoading(false);
      }
    },
    [VOTE_SCHEMA_ID, currentUrl, getAttestations, ethAddress]
  );

  const voteOnComment = async (commentId: string, isUpvote: boolean) => {
    if (!VOTE_SCHEMA_ID || !currentUrl || !ethAddress) {
      toast({
        title: "Error",
        description: "Cannot vote: missing data",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await createAttestation(VOTE_SCHEMA_ID, currentUrl, {
        commentId,
        vote: isUpvote ? 1 : 0,
        ethAddress,
      });
      toast({
        title: "Success",
        description: "Vote recorded successfully!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error voting on comment:", error);
      toast({
        title: "Error",
        description: `Failed to vote: ${(error as Error).message}`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return { getVotesForComments, voteOnComment, loading, error };
}
