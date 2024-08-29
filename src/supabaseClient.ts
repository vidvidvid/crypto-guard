import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function createOrUpdateUser(userId: string, email: string) {
  console.log(`Creating/updating user: ${userId}, email: ${email}`);
  const { data, error } = await supabase
    .from("users")
    .upsert({ id: userId, email }, { onConflict: "id" });

  if (error) {
    console.error("Error creating/updating user:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    throw new Error(`Failed to create/update user: ${error.message}`);
  }
  console.log("User created/updated successfully:", data);
  return data;
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

export async function flagSite(url: string, userId: string) {
  console.log(`Flagging site: ${url} by user: ${userId}`);
  const { data, error } = await supabase
    .from("flagged_sites")
    .upsert(
      { url, flagged_by: userId, is_flagged: true },
      { onConflict: "url,flagged_by" }
    )
    .select();

  if (error) {
    console.error("Error flagging site:", error);
    throw new Error(`Failed to flag site: ${error.message}`);
  }
  console.log("Site flagged successfully:", data);
  return data;
}

export async function unflagSite(url: string, userId: string) {
  console.log(`Unflagging site: ${url} by user: ${userId}`);
  const { data, error } = await supabase
    .from("flagged_sites")
    .update({ is_flagged: false })
    .match({ url, flagged_by: userId })
    .select();

  if (error) {
    console.error("Error unflagging site:", error);
    throw new Error(`Failed to unflag site: ${error.message}`);
  }
  console.log("Site unflagged successfully:", data);
  return data;
}

export async function getFlaggedSites() {
  console.log("Getting flagged sites from Supabase...");
  const { data, error } = await supabase
    .from("flagged_sites")
    .select("url, flagged_by")
    .eq("is_flagged", true);

  if (error) {
    console.error("Error getting flagged sites:", error);
    throw new Error(`Failed to get flagged sites: ${error.message}`);
  }
  console.log("Flagged sites retrieved:", data);
  return data;
}

export async function getFlagCount(url: string) {
  console.log(`Getting flag count for: ${url}`);
  const { data, error } = await supabase
    .from("flagged_sites")
    .select("url")
    .eq("url", url)
    .eq("is_flagged", true);

  if (error) {
    console.error("Error getting flag count:", error);
    throw new Error(`Failed to get flag count: ${error.message}`);
  }
  console.log("Flag count retrieved:", data?.length);
  return data?.length || 0;
}
