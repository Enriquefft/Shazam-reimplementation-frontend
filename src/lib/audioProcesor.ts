const FRAMES_PER_BLOCK = 128; // Frames processed per block
const PUBLISH_RATE_HZ = 60; // Publish rate in Hz

type ProcessorOptions = {
  numberOfChannels: number;
  sampleRate: number;
  maxFrameCount: number;
};

type AudioWorkletProcessorOptions = {
  processorOptions: ProcessorOptions;
};

type RecordingMessage = {
  message: string;
  setRecording?: boolean;
  buffer?: Float32Array[];
  recordingLength?: number;
};

export class RecordingProcessor extends AudioWorkletProcessor {
  public sampleRate: number;
  public maxRecordingFrames: number;
  public numberOfChannels: number;
  public recordedFrames: number;
  public isRecording: boolean;
  public framesSinceLastPublish: number;
  public publishInterval: number;
  private readonly recordingBuffer: Float32Array[];

  public constructor(options?: AudioWorkletProcessorOptions) {
    super();

    this.sampleRate = 0;
    this.maxRecordingFrames = 0;
    this.numberOfChannels = 0;

    if (options?.processorOptions) {
      const { numberOfChannels, sampleRate, maxFrameCount } =
        options.processorOptions;

      this.sampleRate = sampleRate;
      this.maxRecordingFrames = maxFrameCount;
      this.numberOfChannels = numberOfChannels;
    }

    this.recordingBuffer = Array(this.numberOfChannels)
      .fill(null)
      .map(() => new Float32Array(this.maxRecordingFrames));

    this.recordedFrames = 0;
    this.isRecording = false;

    this.framesSinceLastPublish = 0;
    this.publishInterval = this.sampleRate / PUBLISH_RATE_HZ;

    this.port.onmessage = (event: MessageEvent<RecordingMessage>) => {
      if (event.data.message === "UPDATE_RECORDING_STATE") {
        this.isRecording = event.data.setRecording ?? false;

        if (!this.isRecording) {
          this.port.postMessage({
            message: "SHARE_RECORDING_BUFFER",
            buffer: this.recordingBuffer,
          });
        }
      }
    };
  }

  public process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    // Params: Record<string, Float32Array>,
  ): boolean {
    const input = inputs.at(0) ?? [];

    for (let channel = 0; channel < this.numberOfChannels; channel += 1) {
      const inputChannel = input.at(channel) ?? new Float32Array();
      const outputChannel = outputs.at(0)?.at(channel) ?? new Float32Array();

      if (this.recordingBuffer.at(channel) === undefined) {
        this.recordingBuffer[channel] = new Float32Array(
          this.maxRecordingFrames,
        );
      }

      for (let sample = 0; sample < inputChannel.length; sample += 1) {
        const currentSample = inputChannel[sample] ?? 0;

        if (this.isRecording) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          this.recordingBuffer.at(channel)![sample + this.recordedFrames] =
            currentSample;
        }

        outputChannel[sample] = currentSample;
      }
    }

    const shouldPublish = this.framesSinceLastPublish >= this.publishInterval;

    if (this.isRecording) {
      if (this.recordedFrames + FRAMES_PER_BLOCK < this.maxRecordingFrames) {
        this.recordedFrames += FRAMES_PER_BLOCK;

        if (shouldPublish) {
          this.port.postMessage({
            message: "UPDATE_RECORDING_LENGTH",
            recordingLength: this.recordedFrames,
          });
        }
      } else {
        this.isRecording = false;
        this.port.postMessage({
          message: "MAX_RECORDING_LENGTH_REACHED",
          buffer: this.recordingBuffer,
        });

        this.recordedFrames += FRAMES_PER_BLOCK;
        this.port.postMessage({
          message: "UPDATE_RECORDING_LENGTH",
          recordingLength: this.recordedFrames,
        });

        return false;
      }
    }

    if (shouldPublish) {
      this.port.postMessage({
        message: "UPDATE_VISUALIZERS",
      });

      this.framesSinceLastPublish = 0;
    } else {
      this.framesSinceLastPublish += FRAMES_PER_BLOCK;
    }

    return true;
  }
}
registerProcessor("audio-recorder-processor", RecordingProcessor);
