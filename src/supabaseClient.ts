import { createClient } from "@supabase/supabase-js";
import { extractDomain } from "./utils/extractDomain";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function createOrUpdateUser(
  ethAddress: string,
  email: string | undefined
) {
  const { data, error } = await supabase
    .from("users")
    .upsert(
      { eth_address: ethAddress.toLowerCase(), email },
      { onConflict: "eth_address" }
    )
    .select()
    .single();

  if (error) {
    console.error("Error upserting user:", error);
    throw new Error(`Failed to upsert user: ${error.message}`);
  }

  return data;
}

export async function rateSite(
  url: string,
  ethAddress: string,
  isSafe: boolean
): Promise<any> {
  ethAddress = ethAddress.toLowerCase();
  const domain = extractDomain(url);

  // Ensure the user exists
  const { data: userData, error: userCheckError } = await supabase
    .from("users")
    .select("*")
    .eq("eth_address", ethAddress)
    .single();

  if (userCheckError || !userData) {
    console.error("User does not exist in the database:", userCheckError);
    throw new Error("User does not exist in the database.");
  }

  // Proceed to rate the domain
  const { data, error } = await supabase
    .from("flagged_sites")
    .upsert(
      { url: domain, flagged_by: ethAddress, is_safe: isSafe },
      { onConflict: "url,flagged_by" }
    )
    .select()
    .single();

  if (error) {
    console.error("Error rating site:", error);
    throw new Error(`Failed to rate site: ${error.message}`);
  }

  return data;
}

export async function getUserRating(url: string, ethAddress: string) {
  const domain = extractDomain(url);
  const { data, error } = await supabase
    .from("flagged_sites")
    .select("is_safe")
    .eq("url", domain)
    .eq("flagged_by", ethAddress.toLowerCase())
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // No rating found
    }
    console.error("Error getting user rating:", error);
    throw new Error(`Failed to get user rating: ${error.message}`);
  }

  return data.is_safe;
}

export async function getFlaggedSites() {
  const { data, error } = await supabase
    .from("flagged_sites")
    .select("url, flagged_by, is_safe");

  if (error) {
    console.error("Error getting flagged sites:", error);
    throw new Error(`Failed to get flagged sites: ${error.message}`);
  }

  return data;
}

export async function getSiteRatings(url: string) {
  const domain = extractDomain(url);
  const { data, error } = await supabase
    .from("flagged_sites")
    .select("is_safe")
    .eq("url", domain);

  if (error) {
    console.error("Error getting site ratings:", error);
    throw new Error(`Failed to get site ratings: ${error.message}`);
  }

  const safeCount = data.filter((rating) => rating.is_safe === true).length;
  const unsafeCount = data.filter((rating) => rating.is_safe === false).length;
  const totalRatings = data.length;

  return { safeCount, unsafeCount, totalRatings };
}

export async function getUser(userId: string) {
  console.log(`Getting user: ${userId}`);
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error getting user:", error);
    throw new Error(`Failed to get user: ${error.message}`);
  }
  console.log("User retrieved:", data);
  return data;
}
