"use server";
import { z } from "zod";
import { env } from "@/env.mjs";

console.log(env.SHAZAM_API)

const shazamResponseSchema = z.object({
  song_name: z.string(),
  song_spotify_id: z.string().optional(), // Not yet implemented
});

/**
 * Uploads audio blob to your server
 * @param audioData - The audio blob data
 * @returns A promise that resolves to the server response
 */
export async function uploadBlob(audioData: FormData) {
  const response = await fetch(env.SHAZAM_API, {
    method: "POST",
    cache: "no-store",
    body: audioData,
  });

  if (!response.ok) {
    return undefined;
  }

  return shazamResponseSchema.parse(await response.json());
}
