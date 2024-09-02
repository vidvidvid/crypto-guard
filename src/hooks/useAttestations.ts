import { useState, useEffect } from "react";
import {
  EvmChains,
  IndexService,
  SignProtocolClient,
  SpMode,
} from "@ethsign/sp-sdk";
import { useWeb3Auth } from "./useWeb3Auth";

const { privateKeyToAccount } = require("viem/accounts");

export function useAttestations() {
  const [client, setClient] = useState<SignProtocolClient>();
  const [indexService] = useState(new IndexService("testnet"));
  const { provider, ethAddress } = useWeb3Auth();

  useEffect(() => {
    const initializeClient = async () => {
      if (provider) {
        const privateKey = await provider.request({
          method: "eth_private_key",
        });

        const client = new SignProtocolClient(SpMode.OnChain, {
          chain: EvmChains.arbitrumSepolia,
          account: privateKeyToAccount(privateKey),
        });

        setClient(client);
      }
    };

    initializeClient();
  }, [provider]);

  const createSafetyRatingAttestation = async (
    schemaId: string,
    url: string,
    isSafe: boolean
  ) => {
    if (!client || !ethAddress) {
      console.error("Client or ethAddress not initialized");
      return;
    }

    try {
      const attestation = {
        schemaId: schemaId,
        data: {
          url: url,
          isSafe: isSafe,
          ethAddress: ethAddress,
        },
        indexingValue: url.toLowerCase(), // Index by the URL (lowercased)
      };

      const result = await client.createAttestation(attestation);
      console.log("Safety Rating Attestation Created:", result);
    } catch (error) {
      console.error("Error creating Safety Rating attestation:", error);
    }
  };

  const createCommentAttestation = async (
    schemaId: string,
    url: string,
    comment: string
  ) => {
    if (!client || !ethAddress) {
      console.error("Client or ethAddress not initialized");
      return;
    }

    try {
      const attestation = {
        schemaId: schemaId,
        data: {
          url: url,
          comment: comment,
          ethAddress: ethAddress,
        },
        indexingValue: url.toLowerCase(), // Index by the URL (lowercased)
      };

      const result = await client.createAttestation(attestation);
      console.log("Comment Attestation Created:", result);
    } catch (error) {
      console.error("Error creating Comment attestation:", error);
    }
  };

  const getAttestations = async (schemaId: string, url: string) => {
    try {
      const query = {
        schemaId: schemaId,
        indexingValue: url.toLowerCase(), // Ensure consistent indexing
        page: 1,
      };

      const result = await indexService.queryAttestationList(query);
      if (result && result.rows) {
        console.log("Fetched Attestations:", result.rows);
        return result.rows;
      } else {
        console.log("No attestations found.");
        return [];
      }
    } catch (error) {
      console.error("Error fetching attestations:", error);
    }
  };

  return {
    createSafetyRatingAttestation,
    createCommentAttestation,
    getAttestations,
  };
}
