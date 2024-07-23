class AudioRecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 4096;
    this.buffer = new Float32Array(this.bufferSize);
    this.position = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs.at(0)?.at(0);

    if (!input) {
      console.log("No input");
      return true;
    }

    for (const sample of input) {
      this.buffer[this.position] = sample;
      this.position += 1;
      if (this.position === this.bufferSize) {
        this.port.postMessage({ buffer: this.buffer });
        this.position = 0;
      }
    }

    return true;
  }
}

registerProcessor("audio-recorder-processor", AudioRecorderProcessor);
