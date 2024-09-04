import React from "react";
import { Button, Text, VStack } from "@chakra-ui/react";
import { useWeb3Auth } from "../hooks/useWeb3Auth";

function LoginButton() {
  const { login, error } = useWeb3Auth();

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
