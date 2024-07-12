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
 * @param props.className - tailwindcss classes
 * @param props.text - The content of the button
 * @param props.setLyrics - lyrics setter
 * @param props.setTrackName - track name setter
 * @returns The Recorder button component
 */
export default function RecorderButton({
  className,
  text,
  setLyrics,
  setTrackName,
}: {
  className?: string;
  text: string;
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

      const song_name = (await uploadBlob(formData))?.song_name;
      setTrackName(song_name);

      setLyrics((await getLyrics(song_name))?.lyrics ?? "LYRICS NOT FOUND");
    } else {
      await audioRecorder.startRecording();
      setIsRecording(true);
    }
  };

  return (
    <button className={className} onClick={handleRecordingClick}>
      <div className="flex size-full items-center justify-center rounded-full bg-gray-900 text-4xl font-bold text-pink-500">
        {isRecording ? "Stop Recording" : text}
      </div>
    </button>
  );
}
