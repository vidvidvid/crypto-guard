import React from "react";
import { Flex, Text, Stat, StatLabel, StatNumber } from "@chakra-ui/react";
import { useSiteRatings } from "../contexts/SiteRatingsContext";

function RatingSummary() {
  const { siteRatings } = useSiteRatings();

  if (!siteRatings) return null;

  return (
    <Flex
      width='100%'
      justifyContent='space-around'
      p={2}
      borderBottom='1px'
      borderColor='gray.200'
    >
      <Stat textAlign='center'>
        <StatLabel>Safe</StatLabel>
        <StatNumber>{siteRatings.safeCount}</StatNumber>
      </Stat>
      <Stat textAlign='center'>
        <StatLabel>Unsafe</StatLabel>
        <StatNumber>{siteRatings.unsafeCount}</StatNumber>
      </Stat>
      <Stat textAlign='center'>
        <StatLabel>Total</StatLabel>
        <StatNumber>{siteRatings.totalRatings}</StatNumber>
      </Stat>
    </Flex>
  );
}

export default RatingSummary;
