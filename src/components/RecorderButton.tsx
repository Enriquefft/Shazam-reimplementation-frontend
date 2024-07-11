"use client";
import { AudioRecorder } from "@/lib/audio";
import { uploadBlob } from "@/lib/shazam";
import { useRef, useEffect, useState } from "react";

/**
 *
 * @param props - The component props
 * @param props.className - tailwindcss classes
 * @param props.text - The content of the button
 * @returns The Recorder button component
 */
export default function RecorderButton({
  className,
  text,
}: {
  className?: string;
  text: string;
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

      const formData = new FormData();
      formData.append("audio_data", audioBlob, "file");
      formData.append("type", "wav");
      const res = await uploadBlob(formData);
      console.log("response: ", res);

      setIsRecording(false);
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
