import React from "react";
import { Button, Text, VStack } from "@chakra-ui/react";
import { useWeb3AuthContext } from "../contexts/Web3AuthContext";

function LoginButton() {
  const { login, error } = useWeb3AuthContext();

  return (
    <VStack spacing={4}>
      {error && <Text color='red.500'>{error}</Text>}
      <Button colorScheme='blue' onClick={login}>
        Login
      </Button>
    </VStack>
  );
}

export default LoginButton;
