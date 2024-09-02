import React from "react";
import { Box, Heading, List, ListItem } from "@chakra-ui/react";

interface FlaggedSitesListProps {
  flaggedSites: any[];
}

export const FlaggedSitesList: React.FC<FlaggedSitesListProps> = ({
  flaggedSites,
}) => {
  return (
    <Box>
      <Heading as='h2' size='md'>
        Recently Rated Sites:
      </Heading>
      <List spacing={2}>
        {flaggedSites.map((site, index) => (
          <ListItem key={index}>
            {site.url} (rated{" "}
            {site.is_safe === true
              ? "safe"
              : site.is_safe === false
              ? "unsafe"
              : "unrated"}{" "}
            by: {site.flagged_by})
          </ListItem>
        ))}
      </List>
    </Box>
  );
};
