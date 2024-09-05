import React, { useState, useEffect } from "react";
import {
  VStack,
  Box,
  Text,
  Textarea,
  Button,
  HStack,
  IconButton,
  useToast,
} from "@chakra-ui/react";
import { ChevronUpIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { useComments } from "../hooks/useComments";
import { useWeb3AuthContext } from "../contexts/Web3AuthContext";
import { useSiteRatings } from "../contexts/SiteRatingsContext";

function CommentsSection() {
  const { ethAddress } = useWeb3AuthContext();
  const { currentUrl } = useSiteRatings();
  const { comments, addComment, handleVote, loading, error } =
    useComments(currentUrl);
  const [newComment, setNewComment] = useState("");
  const toast = useToast();

  const handleAddComment = async () => {
    if (!ethAddress || !currentUrl || !newComment) {
      toast({
        title: "Error",
        description: "Missing required information to add comment",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await addComment(newComment);
      setNewComment("");
      toast({
        title: "Success",
        description: "Comment added successfully!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: `Failed to add comment: ${(error as Error).message}`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <VStack align='stretch' spacing={4}>
      {error && <Text color='red.500'>{error}</Text>}
      {comments.length > 0 ? (
        <VStack align='stretch' spacing={2}>
          {comments.map((comment) => {
            return (
              <Box key={comment.id} p={2} borderWidth={1} borderRadius='md'>
                <HStack justify='space-between'>
                  <VStack align='start'>
                    <Text>{comment.decodedData.comment}</Text>
                    <Text fontSize='sm' color='gray.500'>
                      By: {comment.attester.slice(0, 6)}...
                      {comment.attester.slice(-4)}
                    </Text>
                  </VStack>
                  <VStack>
                    <IconButton
                      aria-label='Upvote'
                      icon={<ChevronUpIcon />}
                      colorScheme={
                        comment.votes?.userVote === 1 ? "green" : "gray"
                      }
                      onClick={() => handleVote(comment.id, true)}
                    />
                    <Text>
                      {(comment.votes?.upvotes || 0) -
                        (comment.votes?.downvotes || 0)}
                    </Text>
                    <IconButton
                      aria-label='Downvote'
                      icon={<ChevronDownIcon />}
                      colorScheme={
                        comment.votes?.userVote === -1 ? "red" : "gray"
                      }
                      onClick={() => handleVote(comment.id, false)}
                    />
                  </VStack>
                </HStack>
              </Box>
            );
          })}
        </VStack>
      ) : (
        <Text>No comments yet.</Text>
      )}
      <Box>
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder='Add a comment...'
        />
        <Button mt={2} onClick={handleAddComment}>
          Add Comment
        </Button>
      </Box>
    </VStack>
  );
}

export default CommentsSection;
