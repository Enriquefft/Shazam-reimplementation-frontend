"use server";

/**
 * Uploads audio blob to your server
 * @param audioBlob - The audio blob data
 * @returns A promise that resolves to the server response
 */
export async function uploadBlob(audioBlob: Blob) {
  const formData = new FormData();
  formData.append("audio_data", audioBlob, "file");
  formData.append("type", "wav");

  console.log("uploading audio blob to server...");

  /*
   * Your server endpoint to upload audio:
   * Const apiUrl = "http://localhost:3000/upload/audio";
   *
   * Const response = await fetch(apiUrl, {
   *   Method: "POST",
   *   Cache: "no-cache",
   *   Body: formData,
   * });
   *
   * Return response.json();
   */
}
