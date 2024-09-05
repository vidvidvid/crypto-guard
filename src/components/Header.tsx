import React from "react";
import {
  Flex,
  Heading,
  Avatar,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Button,
} from "@chakra-ui/react";
import { useWeb3AuthContext } from "../contexts/Web3AuthContext";

function Header() {
  const { userData, logout } = useWeb3AuthContext();

  return (
    <Flex
      as='header'
      width='100%'
      justifyContent='space-between'
      alignItems='center'
      p={4}
      borderBottom='1px'
      borderColor='gray.200'
    >
      <Heading as='h1' size='md'>
        🛡️ CryptoGuard
      </Heading>
      <Popover>
        <PopoverTrigger>
          <Avatar
            size='sm'
            name={userData?.name || userData?.email}
            src={userData?.profileImage}
            cursor='pointer'
          />
        </PopoverTrigger>
        <PopoverContent width='auto'>
          <PopoverBody>
            <Button onClick={logout} size='sm'>
              Logout
            </Button>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </Flex>
  );
}

export default Header;
