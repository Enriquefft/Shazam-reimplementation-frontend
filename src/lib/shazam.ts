"use server";

const apiUrl = "http://localhost:443/";

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

  return response.text();
}
