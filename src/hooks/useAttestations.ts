import { useState, useCallback, useEffect } from "react";
import {
  SignProtocolClient,
  SpMode,
  EvmChains,
  IndexService,
} from "@ethsign/sp-sdk";
import { privateKeyToAccount } from "viem/accounts";
import { useWeb3AuthContext } from "../contexts/Web3AuthContext";
import { AbiCoder } from "ethers";

const CHAIN_ID = "421614";

export function useAttestations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<SignProtocolClient | null>(null);
  const [indexService, setIndexService] = useState<IndexService | null>(null);
  const { provider, ethAddress } = useWeb3AuthContext();

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

          const newClient = new SignProtocolClient(SpMode.OnChain, {
            chain: EvmChains.arbitrumSepolia,
            account: privateKeyToAccount(privateKey as `0x${string}`),
          });

          setClient(newClient);
          setIndexService(new IndexService("testnet"));
        } catch (error) {
          console.error("Error initializing SignProtocolClient:", error);
        }
      }
    };

    initializeClient();
  }, [provider, ethAddress]);

  const decodeAttestationData = (encodedData: string, schema: any) => {
    try {
      const abiCoder = new AbiCoder();
      const types = schema.data.map((field: any) => field.type);
      const decoded = abiCoder.decode(types, encodedData);
      return schema.data.reduce((acc: any, field: any, index: number) => {
        acc[field.name] = decoded[index];
        return acc;
      }, {});
    } catch (error) {
      console.error("Error decoding attestation data:", error);
      return { error: "Failed to decode attestation data" };
    }
  };

  const getAttestations = useCallback(
    async (schemaId: string, url: string) => {
      if (!indexService) {
        throw new Error("IndexService not initialized");
      }

      setLoading(true);
      setError(null);
      try {
        const fullSchemaId = `onchain_evm_${CHAIN_ID}_${schemaId}`;
        const response = await indexService.queryAttestationList({
          schemaId: fullSchemaId,
          indexingValue: url.toLowerCase(),
          page: 1,
          mode: "onchain",
        });

        if (response) {
          return response.rows.map((attestation) => ({
            ...attestation,
            decodedData: decodeAttestationData(
              attestation.data,
              attestation.schema
            ),
          }));
        } else {
          throw new Error("Failed to fetch attestations");
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
    },
    [indexService]
  );

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
