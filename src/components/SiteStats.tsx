import { StatGroup, Stat, StatLabel, StatNumber } from "@chakra-ui/react";
import { useSiteRatings } from "../contexts/SiteRatingsContext";

function SiteStats() {
  const { siteRatings } = useSiteRatings();

  if (!siteRatings) return null;

  return (
    <StatGroup>
      <Stat>
        <StatLabel>Safe Ratings</StatLabel>
        <StatNumber>{siteRatings.safeCount}</StatNumber>
      </Stat>
      <Stat>
        <StatLabel>Unsafe Ratings</StatLabel>
        <StatNumber>{siteRatings.unsafeCount}</StatNumber>
      </Stat>
      <Stat>
        <StatLabel>Total Ratings</StatLabel>
        <StatNumber>{siteRatings.totalRatings}</StatNumber>
      </Stat>
    </StatGroup>
  );
}

export default SiteStats;
