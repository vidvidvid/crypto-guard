import { useState, useCallback, useEffect } from "react";
import {
  SignProtocolClient,
  SpMode,
  IndexService,
  OffChainSignType,
} from "@ethsign/sp-sdk";
import { privateKeyToAccount } from "viem/accounts";
import { useWeb3AuthContext } from "../contexts/Web3AuthContext";
import { AbiCoder } from "ethers";

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

          const newClient = new SignProtocolClient(SpMode.OffChain, {
            signType: OffChainSignType.EvmEip712,
            account: privateKeyToAccount(privateKey as `0x${string}`),
          });

          setClient(newClient);
          setIndexService(new IndexService("mainnet"));
        } catch (error) {
          console.error("Error initializing SignProtocolClient:", error);
        }
      }
    };

    initializeClient();
  }, [provider, ethAddress]);

  const decodeAttestationData = (encodedData: string, schema: any) => {
    try {
      // If the data is already a JSON string, parse it
      if (typeof encodedData === "string" && encodedData.startsWith("{")) {
        return JSON.parse(encodedData);
      }

      // Otherwise, use AbiCoder to decode
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
    async (schemaId: string, indexingValue: string) => {
      if (!indexService) {
        throw new Error("IndexService not initialized");
      }

      setLoading(true);
      setError(null);
      try {
        const response = await indexService.queryAttestationList({
          schemaId,
          indexingValue,
          page: 1,
          mode: "offchain",
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
    async (schemaId: string, indexingValue: string, data: any) => {
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
          indexingValue,
        };

        const result = await client.createAttestation(attestation);
        return result;
      } catch (error) {
        console.error("Error creating off-chain attestation:", error);
        throw error;
      }
    },
    [client, ethAddress]
  );

  const getLatestAttestationForUser = useCallback(
    async (schemaId: string, indexingValue: string, userAddress: string) => {
      if (!indexService) {
        throw new Error("IndexService not initialized");
      }

      try {
        const response = await indexService.queryAttestationList({
          schemaId,
          indexingValue,
          page: 1,
          mode: "offchain",
        });

        if (response && response.rows.length > 0) {
          // Sort attestations by timestamp in descending order
          const sortedAttestations = response.rows.sort(
            (a, b) =>
              new Date(b.attestTimestamp).getTime() -
              new Date(a.attestTimestamp).getTime()
          );
          // Return the most recent attestation
          return {
            ...sortedAttestations[0],
            decodedData: decodeAttestationData(
              sortedAttestations[0].data,
              sortedAttestations[0].schema
            ),
          };
        }
        return null;
      } catch (err) {
        console.error("Error fetching latest attestation for user:", err);
        return null;
      }
    },
    [indexService]
  );

  return {
    getAttestations,
    createAttestation,
    getLatestAttestationForUser,
    loading,
    error,
  };
}
