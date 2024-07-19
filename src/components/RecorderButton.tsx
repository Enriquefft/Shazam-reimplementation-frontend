/* eslint-disable @typescript-eslint/no-magic-numbers */
import { uploadBlob } from "@/lib/shazam";
import {
  useRef,
  useEffect,
  useState,
  type SetStateAction,
  type Dispatch,
} from "react";
import { getLyrics } from "@/lib/lyrics";

// Helper function to write strings to the DataView
const writeString = (view: DataView, offset: number, string: string) => {
  string.split("").forEach((letter, index) => {
    view.setUint8(offset + index, letter.charCodeAt(0));
  });
};

const handleRecordingComplete = (chunks: Float32Array[]) => {
  console.log(chunks);
  const audioData = new Float32Array(
    chunks.reduce((acc, curr) => acc + curr.length, 0),
  );
  let offset = 0;
  for (const chunk of chunks) {
    audioData.set(chunk, offset);
    offset += chunk.length;
  }

  // WAV file settings
  const sampleRate = 44100; // Assuming a sample rate of 44100 Hz, adjust as needed
  const numChannels = 1; // Assuming mono audio, adjust as needed

  // Create WAV header
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  // RIFF chunk descriptor
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + audioData.length * 2, true); // File length - 8
  writeString(view, 8, "WAVE");

  // Fmt sub-chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * numChannels * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  view.setUint16(32, numChannels * 2, true); // BlockAlign (NumChannels * BitsPerSample/8)
  view.setUint16(34, 16, true); // BitsPerSample (16 bits per sample)

  // Data sub-chunk
  writeString(view, 36, "data");
  view.setUint32(40, audioData.length * 2, true); // Subchunk2Size (NumSamples * NumChannels * BitsPerSample/8)

  // Combine header and audio data
  const wavBuffer = new Uint8Array(header.byteLength + audioData.length * 2);
  wavBuffer.set(new Uint8Array(header), 0);

  // Use DataView to write audio data to the buffer
  const wavDataView = new DataView(wavBuffer.buffer, header.byteLength);
  audioData.forEach((audio, index) => {
    const clamp = Math.max(-1, Math.min(1, audio)); // Clamping
    wavDataView.setInt16(
      index * 2,
      clamp < 0 ? clamp * 0x8000 : clamp * 0x7fff,
      true,
    );
  });

  return new Blob([wavBuffer], { type: "audio/wav" });
};

const RECORDING_DURATION_MS = 4000;

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

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioWorkletRef = useRef<AudioWorkletNode | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initializeAudioContext = async () => {
      audioContextRef.current = new AudioContext();
      await audioContextRef.current.audioWorklet.addModule(
        "/AudioRecorderProcessor.js",
      );
    };
    initializeAudioContext().catch((error: unknown) => {
      console.error("Error initializing audio context", error);
    });
  }, []);

  const handleSetters = async (audioBlob: Blob) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append("audio_data", audioBlob, "file");
    formData.append("type", "wav");
    const shazamResponse = await uploadBlob(formData);

    setIsLoading(false);
    if (!shazamResponse) {
      return;
    }

    setTrackName(shazamResponse.song_name);
    setLyrics(
      (await getLyrics(shazamResponse.song_name))?.lyrics ?? "LYRICS NOT FOUND",
    );
  };

  const startRecording = async () => {
    if (!audioContextRef.current) {
      throw new Error("Audio context not initialized");
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = audioContextRef.current.createMediaStreamSource(stream);
    audioWorkletRef.current = new AudioWorkletNode(
      audioContextRef.current,
      "audio-recorder-processor",
    );
    source.connect(audioWorkletRef.current);
    audioWorkletRef.current.connect(audioContextRef.current.destination);
    audioWorkletRef.current.port.onmessage = (
      event: MessageEvent<{ buffer: Float32Array }>,
    ) => {
      const { buffer } = event.data;
      chunksRef.current.push(buffer);
    };
    setIsRecording(true);

    // Start the interval to receive chunks every 4 seconds
    intervalRef.current = setInterval(() => {
      const audioBlob = handleRecordingComplete(chunksRef.current);
      handleSetters(audioBlob).catch((error: unknown) => {
        console.error("Error setting setters", error);
      });
      chunksRef.current = [];
    }, RECORDING_DURATION_MS);
  };

  const stopRecording = () => {
    audioWorkletRef.current?.disconnect();

    setIsRecording(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    const audioBlob = handleRecordingComplete(chunksRef.current);
    handleSetters(audioBlob).catch((error: unknown) => {
      console.error("Error setting setters", error);
    });
    chunksRef.current = [];
  };

  const handleRecordingClick = async () => {
    if (isRecording) {
      stopRecording();
      setIsRecording(false);
    } else {
      await startRecording();
      setIsRecording(true);
    }
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
