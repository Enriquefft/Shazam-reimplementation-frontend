import Script from "next/script";

/**
 * @returns Home page component
 */
export default async function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div
        id="rg_embed_link_378195"
        className="rg_embed_link"
        data-song-id="378195"
      >
        Read{" "}
        <a href="https://genius.com/Sia-chandelier-lyrics">
          “Chandelier” by Sia
        </a>{" "}
        on Genius
      </div>{" "}
      <Script src="//genius.com/songs/378195/embed.js"></Script>
    </main>
  );
}
