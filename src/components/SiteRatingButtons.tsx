import React from "react";
import { Button, HStack } from "@chakra-ui/react";
import { CheckIcon, CloseIcon } from "@chakra-ui/icons";

interface SiteRatingButtonsProps {
  userRating: boolean | null;
  handleRateSite: (isSafe: boolean) => void;
}

export const SiteRatingButtons: React.FC<SiteRatingButtonsProps> = ({
  userRating,
  handleRateSite,
}) => {
  return (
    <HStack justify='center'>
      <Button
        leftIcon={<CheckIcon />}
        colorScheme={userRating === true ? "green" : "gray"}
        onClick={() => handleRateSite(true)}
        isDisabled={userRating === true}
      >
        Safe
      </Button>
      <Button
        leftIcon={<CloseIcon />}
        colorScheme={userRating === false ? "red" : "gray"}
        onClick={() => handleRateSite(false)}
        isDisabled={userRating === false}
      >
        Unsafe
      </Button>
    </HStack>
  );
};
