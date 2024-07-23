"use client";
import { Slider } from "@/components/ui/slider";

import {
  RewindIcon,
  PlayIcon,
  ForwardIcon,
  PauseIcon,
} from "@/components/icons";

import RecorderButton from "@/components/RecorderButton";
import { useRef, useState, type Dispatch, type SetStateAction } from "react";

/**
 * @param props - Speak button props
 * @param props.setLyrics - lyrics setter
 * @param props.setTrackName - trackName setter
 * @param props.setIsLoading - loading setter
 * @param props.isLoading - loading
 * @returns Speak button component
 */
function SpeakButton({
  setLyrics,
  setTrackName,
  setIsLoading,
  isLoading,
}: {
  setTrackName: Dispatch<SetStateAction<string | undefined>>;
  setLyrics: Dispatch<SetStateAction<string>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  isLoading: boolean;
}) {
  return (
    <section className="flex min-w-40 flex-col items-center justify-center gap-6 px-16 py-20 transition duration-500 hover:scale-150">
      <RecorderButton
        setLyrics={setLyrics}
        setTrackName={setTrackName}
        setIsLoading={setIsLoading}
        isLoading={isLoading}
      />
      <p className="text-center text-lg font-medium text-gray-400">
        Touch the button to start speaking
      </p>
    </section>
  );
}

/**
 * @param props - Lyrics section props
 * @param props.songName - songName value
 * @param props.lyrics - Lyrics content
 * @param props.isLoading - isLoading prop
 * @returns Lyrics section component
 */
function LyricsSection({
  songName,
  lyrics,
  isLoading,
}: {
  songName?: string;
  lyrics: string;
  isLoading: boolean;
}) {
  return (
    <section className="flex w-full flex-col items-start justify-start gap-6 rounded-lg bg-gray-800 p-6 shadow-2xl 2xl:max-w-[80%]">
      <header className="mx-4 w-full">
        <h2 className="text-2xl font-bold text-white">
          Lyrics {songName === undefined ? "" : `- ${songName}`}
        </h2>
        <div className="mt-4 max-h-[350px] overflow-y-auto text-gray-400">
          <p className="whitespace-pre-line">
            {isLoading ? "Loading..." : lyrics}
          </p>
        </div>
      </header>
    </section>
  );
}

/**
 * @param props - Control button props
 * @param props.icon - Control button icon
 * @param props.onClick - Click handler for the button
 * @returns Control button component
 */
function ControlButton({
  icon,
  onClick,
}: {
  icon: JSX.Element;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-full bg-gradient-to-br from-pink-500 to-cyan-500 p-2 text-gray-900"
    >
      {icon}
    </button>
  );
}

/**
 * @param props - component props
 * @param props.songUrl - song to play
 * @returns Audio controls component
 */
function AudioControls({ songUrl }: { songUrl?: string }) {
  console.log("songUrl", songUrl);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {
          console.error("couldn't start playling");
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleRewind = () => {
    if (audioRef.current) {
      audioRef.current.currentTime -= 10;
    }
  };

  const handleForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime += 10;
    }
  };

  return (
    <section className="flex w-full max-w-md flex-col items-start justify-start gap-6 rounded-lg bg-gray-800 p-6 shadow-2xl">
      <h2 className="text-2xl font-bold text-white">Audio</h2>
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-4">
          <ControlButton icon={<RewindIcon />} onClick={handleRewind} />
          <ControlButton
            icon={isPlaying ? <PauseIcon /> : <PlayIcon />}
            onClick={handlePlayPause}
          />
          <ControlButton icon={<ForwardIcon />} onClick={handleForward} />
        </div>
      </div>
      <Slider
        className="[&>span:first-child]:h-2 [&>span:first-child]:bg-pink-500 [&>span:first-child_span]:bg-cyan-500 [&_[role=slider]:focus-visible]:scale-105 [&_[role=slider]:focus-visible]:ring-0 [&_[role=slider]:focus-visible]:ring-offset-0 [&_[role=slider]:focus-visible]:transition-transform [&_[role=slider]]:size-4 [&_[role=slider]]:border-0 [&_[role=slider]]:bg-cyan-500"
        defaultValue={[0]}
      />
      <audio ref={audioRef}>
        <track kind="captions" src={songUrl} />
      </audio>
      <track />
    </section>
  );
}

/**
 * @returns Add to Shazam component
 */
/*
 *Function AddToShazam() {
 *return (
 *  <section className="flex w-full max-w-md flex-col items-start justify-start gap-6 rounded-lg bg-gray-800 p-6 shadow-2xl">
 *    <header className="w-full">
 *      <h2 className="text-2xl font-bold text-white">Add Song to Shazam</h2>
 *      <p className="mt-4 text-gray-400">
 *        Add the current song to your Shazam playlist.
 *      </p>
 *      <div className="mt-4 flex flex-col gap-4">
 *        <div className="flex items-center gap-2">
 *          <Label htmlFor="playlist-id" className="text-gray-400">
 *            Playlist ID:
 *          </Label>
 *          <Input
 *            id="playlist-id"
 *            type="text"
 *            placeholder="Enter playlist ID"
 *            className="w-full rounded-lg bg-gray-900 px-4 py-2 text-gray-400 focus:outline-none"
 *          />
 *        </div>
 *        <Button className="w-full rounded-lg bg-gradient-to-br from-pink-500 to-cyan-500 px-4 py-2 text-gray-900">
 *          Add to Shazam
 *        </Button>
 *      </div>
 *    </header>
 *  </section>
 *);
 *}
 */

/**
 * @returns Main page component
 */
export default function MainPage() {
  const [trackName, setTrackName] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [lyrics, setLyrics] = useState<string>("");

  return (
    <main className="flex min-h-96 w-full flex-col items-center justify-center gap-32 px-4 md:gap-36">
      <div className="xxl:flex-row flex w-full flex-col items-center justify-center gap-8 px-4 md:gap-4">
        <SpeakButton
          setLyrics={setLyrics}
          setTrackName={setTrackName}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
        {Boolean(trackName) && (
          <div className="flex flex-col items-center gap-4">
            <LyricsSection
              lyrics={lyrics}
              isLoading={isLoading}
              songName={trackName}
            />
            <AudioControls songUrl={`http://0.0.0.0:8000/${trackName}.wav`} />
          </div>
        )}
      </div>
      {/* <AddToShazam /> */}
    </main>
  );
}
