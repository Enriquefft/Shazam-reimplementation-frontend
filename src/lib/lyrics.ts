"use server";
import { z } from "zod";

const LYRICS_BASE_URL = "https://lyrist.vercel.app/api";

const lyricsResponseSchema = z
  .object({
    lyrics: z.string(),
    title: z.string(),
    artist: z.string(),
    image: z.string().url(),
  })
  .or(
    z
      .object({})
      .strict()
      .transform(() => undefined),
  )
  .optional();
type LyricsResponse = z.infer<typeof lyricsResponseSchema>;

/**
 * @param songName - The name of the song to search for
 * @returns The lyrics of the song
 */
export async function getLyrics(
  songName?: string,
): Promise<LyricsResponse | undefined> {
  const res = await fetch(encodeURI(`${LYRICS_BASE_URL}/${songName}`));
  if (!res.ok) {
    return {
      lyrics: `no lyrics found for ${songName}`,
      title: "",
      artist: "",
      image:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRRHDUlqwP_tjALz6i1-M6DXlC416ZUKB9LcQ&s",
    };
  }

  return lyricsResponseSchema.parse(await res.json());
}
