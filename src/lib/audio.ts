const SAMPLE_RATE = 44100;

import createLinkFromAudioBuffer from "@/lib/autoUtils";
import { RecordingProcessor } from "@/lib/audioProcesor";

enum RecorderStates {
  UNINITIALIZED = 0,
  RECORDING = 1,
  PAUSED = 2,
  FINISHED = 3,
}

class AudioRecorder {
  private recordingState = RecorderStates.UNINITIALIZED;
  private recordingNode: AudioWorkletNode | null = null;
  private processorPort: MessagePort | null = null;
  private recordingLength = 0;
  private micSourceNode: MediaStreamAudioSourceNode | null = null;
  private readonly context = new AudioContext({ sampleRate: SAMPLE_RATE });

  public async connect() {
    registerProcessor("recording-processor", RecordingProcessor);

    if (this.context.state === "suspended") {
      await this.context.resume();
    }

    await this.context.audioWorklet.addModule("/recording-processor.js");
  }

  public async startRecording() {
    if (this.recordingState === RecorderStates.UNINITIALIZED) {
      await this.initializeAudio();
      this.recordingState = RecorderStates.RECORDING;
      this.processorPort?.postMessage({
        message: "UPDATE_RECORDING_STATE",
        setRecording: true,
      });
    } else if (this.recordingState === RecorderStates.PAUSED) {
      this.recordingState = RecorderStates.RECORDING;
      this.processorPort?.postMessage({
        message: "UPDATE_RECORDING_STATE",
        setRecording: true,
      });
    }
  }

  public async stopRecording(): Promise<Blob | undefined> {
    if (this.recordingState === RecorderStates.RECORDING) {
      this.recordingState = RecorderStates.PAUSED;
      this.processorPort?.postMessage({
        message: "UPDATE_RECORDING_STATE",
        setRecording: false,
      });
      if (this.processorPort) {
        const buffer = await new Promise<Float32Array[]>((resolve) => {
          this.processorPort?.addEventListener(
            "message",
            function handler(event: MessageEvent) {
              if (event.data.message === "SHARE_RECORDING_BUFFER") {
                this.removeEventListener("message", handler);
                resolve(event.data.buffer);
              }
            },
          );
          this.processorPort?.postMessage({
            message: "REQUEST_RECORDING_BUFFER",
          });
        });
        return this.createRecord(buffer);
      }
    }
    return undefined;
  }

  private async initializeAudio() {
    const micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        autoGainControl: false,
        noiseSuppression: false,
      },
    });

    this.micSourceNode = new MediaStreamAudioSourceNode(this.context, {
      mediaStream: micStream,
    });
    const gainNode = new GainNode(this.context);
    const analyserNode = new AnalyserNode(this.context);

    const recordingProperties = {
      numberOfChannels: this.micSourceNode.channelCount,
      sampleRate: this.context.sampleRate,
      maxFrameCount: this.context.sampleRate * 300,
    };

    this.recordingNode = new AudioWorkletNode(
      this.context,
      "recording-processor",
      {
        processorOptions: recordingProperties,
      },
    );
    this.processorPort = this.recordingNode.port;
    this.processorPort.onmessage = this.handleRecordingEvents.bind(this);

    gainNode.gain.value = 0;

    this.micSourceNode
      .connect(analyserNode)
      .connect(this.recordingNode)
      .connect(gainNode)
      .connect(this.context.destination);
  }

  private handleRecordingEvents(event: MessageEvent) {
    console.log("type of event.", typeof event);
    console.log("type of event.data", typeof event.data);

    if (event.data.message === "MAX_RECORDING_LENGTH_REACHED") {
      this.recordingState = RecorderStates.FINISHED;
      this.createRecord(event.data.buffer);
    }
    if (event.data.message === "UPDATE_RECORDING_LENGTH") {
      this.recordingLength = event.data.recordingLength;
    }
    if (event.data.message === "SHARE_RECORDING_BUFFER") {
      this.createRecord(event.data.buffer);
    }
  }

  private createRecord(dataBuffer: Float32Array[]) {
    if (!this.micSourceNode) return undefined;
    const recordingBuffer = this.context.createBuffer(
      this.micSourceNode.channelCount,
      this.recordingLength,
      this.context.sampleRate,
    );

    for (
      let channel = 0;
      channel < this.micSourceNode.channelCount;
      channel += 1
    ) {
      if (dataBuffer[channel] === undefined) {
        throw new Error("No data buffer for channel");
      }

      recordingBuffer.copyToChannel(
        dataBuffer[channel] ?? new Float32Array(),
        channel,
        0,
      );
    }

    const audioFileUrl = createLinkFromAudioBuffer(recordingBuffer, true);
    return new Blob([audioFileUrl], { type: "audio/wav" });
  }
}

export { AudioRecorder };
