import React from "react";
import {
  HStack,
  VStack,
  Button,
  Text,
  useToast,
  useDisclosure,
} from "@chakra-ui/react";
import { CheckIcon, CloseIcon } from "@chakra-ui/icons";
import { useWeb3AuthContext } from "../contexts/Web3AuthContext";
import { useSiteRatings } from "../contexts/SiteRatingsContext";
import { ConfirmationDialog } from "./ConfirmationDialog";

function SiteRating() {
  const { ethAddress } = useWeb3AuthContext();
  const { currentUrl, userRating, siteRatings, rateSite, loading } =
    useSiteRatings();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [pendingRating, setPendingRating] = React.useState<boolean | null>(
    null
  );
  const toast = useToast();

  const handleRateSite = async (isSafe: boolean) => {
    if (!ethAddress || !currentUrl) {
      toast({
        title: "Error",
        description: "Cannot rate site: missing data or invalid URL",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (userRating !== null && userRating !== isSafe) {
      setPendingRating(isSafe);
      onOpen();
    } else {
      await submitRating(isSafe);
    }
  };

  const submitRating = async (isSafe: boolean) => {
    try {
      await rateSite(isSafe);
    } catch (error) {
      console.error("Error rating site:", error);
      toast({
        title: "Error",
        description: `Failed to rate site: ${(error as Error).message}`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (!siteRatings) return null;

  const isDisabled = loading || !ethAddress;

  return (
    <HStack spacing={8} justify='center' p={4}>
      <VStack>
        <Button
          leftIcon={<CheckIcon />}
          colorScheme={userRating === true ? "green" : "gray"}
          onClick={() => handleRateSite(true)}
          isDisabled={isDisabled || userRating === true}
          size='lg'
          variant='outline'
        >
          Safe
        </Button>
        <Text fontWeight='bold' fontSize='xl'>
          {siteRatings.safeCount}
        </Text>
      </VStack>
      <VStack>
        <Button
          leftIcon={<CloseIcon />}
          colorScheme={userRating === false ? "red" : "gray"}
          onClick={() => handleRateSite(false)}
          isDisabled={isDisabled || userRating === false}
          size='lg'
          variant='outline'
        >
          Unsafe
        </Button>
        <Text fontWeight='bold' fontSize='xl'>
          {siteRatings.unsafeCount}
        </Text>
      </VStack>
      <ConfirmationDialog
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={() => {
          onClose();
          submitRating(pendingRating!);
        }}
        title='Change Rating'
        message='Are you sure you want to change your rating for this site?'
      />
    </HStack>
  );
}

export default SiteRating;
