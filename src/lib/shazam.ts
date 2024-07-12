"use server";
import { z } from "zod";

const apiUrl = "http://localhost:443/";

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
  const response = await fetch(apiUrl, {
    method: "POST",
    cache: "no-store",
    body: audioData,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return shazamResponseSchema.parse(await response.json());
}
