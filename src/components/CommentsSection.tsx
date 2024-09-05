import React, { useState } from "react";
import {
  VStack,
  Box,
  Text,
  Textarea,
  Button,
  HStack,
  IconButton,
  useToast,
  Alert,
  AlertIcon,
  Spinner,
  Stack,
} from "@chakra-ui/react";
import { ChevronUpIcon, ChevronDownIcon, EditIcon } from "@chakra-ui/icons";
import { useComments } from "../hooks/useComments";
import { useWeb3AuthContext } from "../contexts/Web3AuthContext";
import { useSiteRatings } from "../contexts/SiteRatingsContext";

function CommentsSection() {
  const { ethAddress } = useWeb3AuthContext();
  const { currentUrl } = useSiteRatings();
  const { comments, addComment, handleVote, initialLoading, error } =
    useComments(currentUrl);
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const toast = useToast();

  const userComment = comments.find(
    (comment) => comment.attester.toLowerCase() === ethAddress?.toLowerCase()
  );

  const handleAddOrEditComment = async () => {
    if (!ethAddress || !currentUrl || !newComment.trim()) {
      toast({
        title: "Error",
        description: "Please enter a comment",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await addComment(newComment);
      setNewComment("");
      setEditingComment(null);
      toast({
        title: "Success",
        description: editingComment
          ? "Comment updated successfully!"
          : "Comment added successfully!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error adding/editing comment:", error);
      toast({
        title: "Error",
        description: `Failed to ${editingComment ? "update" : "add"} comment: ${
          (error as Error).message
        }`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEdit = (commentId: string, commentText: string) => {
    setEditingComment(commentId);
    setNewComment(commentText);
  };

  if (initialLoading) {
    return (
      <VStack align='center' justify='center' height='200px'>
        <Spinner />
        <Text>Loading comments...</Text>
      </VStack>
    );
  }

  return (
    <VStack align='stretch' spacing={4}>
      {error && <Text color='red.500'>{error}</Text>}
      {!initialLoading && !userComment && !editingComment && (
        <Box>
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder='Add a comment...'
          />
          <Button mt={2} onClick={handleAddOrEditComment}>
            Add Comment
          </Button>
        </Box>
      )}
      {editingComment && (
        <Box>
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder='Edit your comment...'
          />
          <Alert status='warning' mt={2}>
            <AlertIcon />
            Editing will reset the votes on your comment.
          </Alert>
          <Button mt={2} size='sm' onClick={handleAddOrEditComment}>
            Update Comment
          </Button>
          <Button
            mt={2}
            ml={2}
            size='sm'
            onClick={() => {
              setEditingComment(null);
              setNewComment("");
            }}
          >
            Cancel Edit
          </Button>
        </Box>
      )}
      <VStack align='stretch' spacing={2}>
        {comments.map((comment) => (
          <Box key={comment.id} p={2} borderWidth={1} borderRadius='md'>
            <HStack justify='space-between'>
              <VStack align='start'>
                <Text>{comment.decodedData.comment}</Text>
                <Text fontSize='sm' color='gray.500'>
                  By: {comment.attester.slice(0, 6)}...
                  {comment.attester.slice(-4)}
                  {comment.isEdited && " (edited)"}
                </Text>
              </VStack>
              <Stack align='end' alignContent='space-between'>
                <Box>
                  {comment.attester.toLowerCase() ===
                    ethAddress?.toLowerCase() &&
                    !editingComment && (
                      <IconButton
                        aria-label='Edit'
                        icon={<EditIcon />}
                        size='xs'
                        onClick={() =>
                          handleEdit(comment.id, comment.decodedData.comment)
                        }
                      />
                    )}
                </Box>
                <HStack>
                  <IconButton
                    aria-label='Upvote'
                    icon={<ChevronUpIcon />}
                    size='xs'
                    onClick={() => handleVote(comment.id, true)}
                    isDisabled={comment.votes?.userVote === 1}
                    colorScheme='green'
                  />
                  <Text fontSize='sm'>
                    {(comment.votes?.upvotes || 0) -
                      (comment.votes?.downvotes || 0)}
                  </Text>
                  <IconButton
                    aria-label='Downvote'
                    icon={<ChevronDownIcon />}
                    size='xs'
                    onClick={() => handleVote(comment.id, false)}
                    isDisabled={comment.votes?.userVote === -1}
                    colorScheme='red'
                  />
                </HStack>
              </Stack>
            </HStack>
          </Box>
        ))}
      </VStack>
    </VStack>
  );
}

export default CommentsSection;
