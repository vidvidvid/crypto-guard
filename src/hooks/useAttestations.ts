import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import {
  SignProtocolClient,
  IndexService,
  SpMode,
  EvmChains,
} from "@ethsign/sp-sdk";
import { privateKeyToAccount } from "viem/accounts";
import { useWeb3Auth } from "./useWeb3Auth";

const BASE_URL = "https://testnet-scan.sign.global/api";
const CHAIN_ID = "421614"; // Arbitrum Sepolia

export function useAttestations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<SignProtocolClient | null>(null);
  const [indexService] = useState(new IndexService("testnet"));
  const { provider, ethAddress } = useWeb3Auth();

  useEffect(() => {
    const initializeClient = async () => {
      if (provider && ethAddress) {
        try {
          let privateKey = (await provider.request({
            method: "eth_private_key",
          })) as string;

          if (!privateKey.startsWith("0x")) {
            privateKey = `0x${privateKey}`;
          }

          if (privateKey.length !== 66) {
            throw new Error("Invalid private key length");
          }

          const client = new SignProtocolClient(SpMode.OnChain, {
            chain: EvmChains.arbitrumSepolia,
            account: privateKeyToAccount(privateKey as `0x${string}`),
          });

          setClient(client);
        } catch (error) {
          console.error("Error initializing SignProtocolClient:", error);
        }
      }
    };

    initializeClient();
  }, [provider, ethAddress]);

  const getAttestations = useCallback(async (schemaId: string, url: string) => {
    setLoading(true);
    setError(null);
    try {
      const fullSchemaId = `onchain_evm_${CHAIN_ID}_${schemaId}`;
      console.log("Querying with:", {
        fullSchemaId,
        indexingValue: url.toLowerCase(),
      });

      const response = await axios.get(`${BASE_URL}/index/attestations`, {
        params: {
          schemaId: fullSchemaId,
          indexingValue: url.toLowerCase(),
          page: 1,
          size: 100,
          mode: "onchain",
        },
      });

      console.log("Raw API response:", response.data);

      if (response.data.success) {
        return response.data.data.rows;
      } else {
        throw new Error(
          response.data.message || "Failed to fetch attestations"
        );
      }
    } catch (err) {
      console.error("Error fetching attestations:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createAttestation = useCallback(
    async (schemaId: string, url: string, data: any) => {
      if (!client || !ethAddress) {
        console.error("Client or ethAddress not initialized");
        throw new Error("Client or ethAddress not initialized");
      }

      try {
        const attestation = {
          schemaId,
          data: {
            ...data,
            ethAddress,
          },
          indexingValue: url.toLowerCase(),
        };

        const result = await client.createAttestation(attestation);
        console.log("Attestation Created:", result);
        return result;
      } catch (error) {
        console.error("Error creating attestation:", error);
        throw error;
      }
    },
    [client, ethAddress]
  );

  return {
    getAttestations,
    createAttestation,
    loading,
    error,
  };
}
