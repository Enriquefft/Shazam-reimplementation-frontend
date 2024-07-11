"use server";
import { z } from "zod";

const apiUrl = "http://localhost:443/";

const shazamResponseSchema = z
  .object({
    song_name: z.string(),
    song_spotify_id: z.string().optional(), // Not yet implemented
  })
  .or(
    z.object({
      error: z.literal("NOT_FOUND"),
    }),
  );

/**
 * Uploads audio blob to your server
 * @param audioData - The audio blob data
 * @returns A promise that resolves to the server response
 */
export async function uploadBlob(audioData: FormData) {
  // Uncaught (in promise) Error: '' is not a valid HTTP method.
  const response = await fetch(apiUrl, {
    method: "POST",
    cache: "no-store",
    body: audioData,
  });

  return shazamResponseSchema.parse(response.text());
}
