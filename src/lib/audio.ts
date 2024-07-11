import type { IMediaRecorder, IBlobEvent } from "extendable-media-recorder";

class AudioRecorder {
  private mediaRecorder?: IMediaRecorder;
  private audioBlobs?: Blob[];
  private capturedStream?: MediaStream;

  // Register the extendable-media-recorder-wav-encoder
  public static async connect() {
    const { connect: connectWavEncoder } = await import(
      "extendable-media-recorder-wav-encoder"
    );

    const { register } = await import("extendable-media-recorder");

    const wavEncoder = await connectWavEncoder();
    await register(wavEncoder);
  }

  // Starts recording audio
  public async startRecording() {
    const { MediaRecorder } = await import("extendable-media-recorder");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
        },
      });

      this.audioBlobs = [];
      this.capturedStream = stream;

      // Use the extended MediaRecorder library
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/wav",
      });

      // Add audio blobs while recording
      this.mediaRecorder.addEventListener(
        "dataavailable",
        (event: IBlobEvent) => {
          this.audioBlobs?.push(event.data);
        },
      );

      this.mediaRecorder.start();
    } catch (error) {
      console.error("startRecording error", error);
    }
  }

  public async stopRecording() {
    if (!this.mediaRecorder || !this.capturedStream) {
      throw new Error("Recording has not been started or already stopped.");
    }

    return new Promise<Blob>((resolve) => {
      this.mediaRecorder?.addEventListener("stop", () => {
        const mimeType = this.mediaRecorder?.mimeType ?? "audio/wav";
        const audioBlob = new Blob(this.audioBlobs, { type: mimeType });

        this.capturedStream?.getTracks().forEach((track) => {
          track.stop();
        });

        resolve(audioBlob);
      });

      this.mediaRecorder?.stop();
    });
  }
}

/**
 * @param audioBlob - The audio blob data to play
 */
async function playAudio(audioBlob: Blob) {
  const audio = new Audio();
  audio.src = URL.createObjectURL(audioBlob);
  await audio.play();
}

export { AudioRecorder, playAudio };
