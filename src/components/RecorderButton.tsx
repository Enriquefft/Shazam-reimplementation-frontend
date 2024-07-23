import { AudioRecorder } from "@/lib/audio";
import { uploadBlob } from "@/lib/shazam";
import {
  useRef,
  useEffect,
  useState,
  type SetStateAction,
  type Dispatch,
} from "react";
import { getLyrics } from "@/lib/lyrics";

/**
 *
 * @param props - The component props
 * @param props.isLoading - loading prop
 * @param props.setIsLoading - isLoading setter
 * @param props.setLyrics - lyrics setter
 * @param props.setTrackName - track name setter
 * @returns The Recorder button component
 */
export default function RecorderButton({
  isLoading,
  setIsLoading,
  setLyrics,
  setTrackName,
}: {
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setLyrics: Dispatch<SetStateAction<string>>;
  setTrackName: Dispatch<SetStateAction<string | undefined>>;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioRecorder, setAudioRecorder] = useState<
    AudioRecorder | undefined
  >();

  const connected = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !connected.current) {
      connected.current = true;

      setAudioRecorder(new AudioRecorder());
      AudioRecorder.connect().catch((error: unknown) => {
        console.error(error);
      });
    }
  }, []);

  const handleRecordingClick = async () => {
    if (!audioRecorder) {
      return;
    }
    if (isRecording) {
      const audioBlob = await audioRecorder.stopRecording();
      setIsRecording(false);

      const formData = new FormData();
      formData.append("audio_data", audioBlob, "file");
      formData.append("type", "wav");

      setIsLoading(true);
      const song_name = (await uploadBlob(formData))?.song_name;
      setTrackName(song_name);

      setLyrics((await getLyrics(song_name))?.lyrics ?? "LYRICS NOT FOUND");
    } else {
      await audioRecorder.startRecording();
      setIsRecording(true);
    }
    setIsLoading(false);
  };

  const getButtonText = (): string => {
    if (isRecording) return "Stop Recording";
    if (isLoading) return "Loading";
    return "Speak";
  };

  return (
    <button
      className={`relative size-32 rounded-full bg-gradient-to-br from-pink-500 to-cyan-500 p-1 before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-br before:from-pink-500 before:to-cyan-500 before:opacity-50 before:blur-2xl before:content-[''] after:absolute after:inset-0 after:rounded-full after:bg-gradient-to-br after:from-pink-500 after:to-cyan-500 after:opacity-50 after:blur-2xl after:content-[''] ${
        !isRecording && "motion-safe:animate-pulse"
      }`}
      onClick={handleRecordingClick}
      disabled={isLoading}
    >
      <div className="flex size-full items-center justify-center rounded-full bg-gray-900 text-4xl font-bold text-pink-500">
        {getButtonText()}
      </div>
    </button>
  );
}
