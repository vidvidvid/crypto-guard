// fix this up eventually

import { SignProtocolClient, SpMode, OffChainSignType } from "@ethsign/sp-sdk";
import { privateKeyToAccount } from "viem/accounts";

const BASE_URL = "https://scan.sign.global/api";
const SAFETY_RATING_SCHEMA_ID = import.meta.env
  .VITE_ATTESTATION_SAFETY_RATING_ID;

let client: SignProtocolClient | null = null;

export async function initializeClient() {
  if (!client) {
    // Note: You'll need to securely store and retrieve the private key
    // This is just a placeholder and should be replaced with a secure method
    const privateKey = import.meta.env.VITE_PRIVATE_KEY;
    client = new SignProtocolClient(SpMode.OffChain, {
      signType: OffChainSignType.EvmEip712,
      account: privateKeyToAccount(privateKey as `0x${string}`),
    });
  }
  return client;
}

export async function getAttestations(url: string) {
  try {
    const response = await fetch(
      `${BASE_URL}/index/attestations?schemaId=${SAFETY_RATING_SCHEMA_ID}&indexingValue=${url.toLowerCase()}&page=1&size=100&mode=onchain`
    );
    const data = await response.json();

    if (data.success) {
      return data.data.rows;
    } else {
      throw new Error(data.message || "Failed to fetch attestations");
    }
  } catch (error) {
    console.error("Error fetching attestations:", error);
    return [];
  }
}
