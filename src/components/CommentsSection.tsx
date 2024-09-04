import React, { useState } from "react";
import {
  VStack,
  Box,
  Text,
  Textarea,
  Button,
  useToast,
} from "@chakra-ui/react";
import { useComments } from "../hooks/useComments";
import { useWeb3Auth } from "../hooks/useWeb3Auth";
import { useSiteRatings } from "../hooks/useSiteRatings";

function CommentsSection() {
  const { ethAddress } = useWeb3Auth();
  const { currentUrl } = useSiteRatings(ethAddress);
  const { comments, addComment, loading, error } = useComments(currentUrl);
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
      {loading && <Text>Loading comments...</Text>}
      {error && <Text color='red.500'>{error}</Text>}
      {comments.length > 0 ? (
        <VStack align='stretch' spacing={2}>
          {comments.map((comment, index) => (
            <Box key={index} p={2} borderWidth={1} borderRadius='md'>
              <Text>{comment.decodedData.comment}</Text>
              <Text fontSize='sm' color='gray.500'>
                By: {comment.attester.slice(0, 6)}...
                {comment.attester.slice(-4)}
              </Text>
            </Box>
          ))}
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
