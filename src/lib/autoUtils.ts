/**
 * Writes a string to a target Uint8Array at a specified offset.
 * @param str - The string to write.
 * @param targetArray - The target Uint8Array.
 * @param offset - The offset at which to start writing.
 */
function writeStringToArray(
  str: string,
  targetArray: Uint8Array,
  offset: number,
): void {
  for (let idx = 0; idx < str.length; idx += 1) {
    targetArray[offset + idx] = str.charCodeAt(idx);
  }
}

/**
 * Writes a 16-bit integer to a target Uint8Array at a specified offset.
 * @param num - The number to write.
 * @param targetArray - The target Uint8Array.
 * @param offset - The offset at which to start writing.
 */
function writeInt16ToArray(
  num: number,
  targetArray: Uint8Array,
  offset: number,
): void {
  const littleEndian = true;
  new DataView(targetArray.buffer).setInt16(offset, num, littleEndian);
}

/**
 * Writes a 32-bit integer to a target Uint8Array at a specified offset.
 * @param num - The number to write.
 * @param targetArray - The target Uint8Array.
 * @param offset - The offset at which to start writing.
 */
function writeInt32ToArray(
  num: number,
  targetArray: Uint8Array,
  offset: number,
): void {
  const littleEndian = true;
  new DataView(targetArray.buffer).setInt32(offset, num, littleEndian);
}

/**
 * Returns the 32-bit integer representation of a float.
 * ThisProduces the raw bits; no interpretation of the value is done.
 * @param float - The float to convert.
 * @returns The 32-bit integer representation of the float.
 */
function floatBits(float: number): number {
  const bufferOffset = 0;
  return new DataView(new Float32Array([float]).buffer).getInt32(
    bufferOffset,
    true,
  );
}

enum BitDepth {
  Bit16 = 16,
  Bit32 = 32,
}

const PCM_MAX_16BIT = 32767;
const PCM_MIN_16BIT = -32768;
const BITS_PER_BYTE = 8;
const HEADER_BYTE_LENGTH = 44;
const SUBCHUNK1_SIZE = 16;
const AUDIO_FORMAT_PCM = 1;
const AUDIO_FORMAT_FLOAT = 3;
const CHUNK_ID_OFFSET = 0;
const CHUNK_SIZE_OFFSET = 4;
const FORMAT_OFFSET = 8;
const SUBCHUNK1_ID_OFFSET = 12;
const SUBCHUNK1_SIZE_OFFSET = 16;
const AUDIO_FORMAT_OFFSET = 20;
const NUM_CHANNELS_OFFSET = 22;
const SAMPLE_RATE_OFFSET = 24;
const BYTE_RATE_OFFSET = 28;
const BLOCK_ALIGN_OFFSET = 32;
const BITS_PER_SAMPLE_OFFSET = 34;
const SUBCHUNK2_ID_OFFSET = 36;
const SUBCHUNK2_SIZE_OFFSET = 40;
const INT16_SIZE = 2;
const INT32_SIZE = 4;
const RIFF_HEADER_SIZE = 4;
const SUBCHUNK_HEADER_SIZE = 8;

/**
 * Writes the audio buffer data to a target Uint8Array at a specified offset with the given bit depth.
 * @param audioBuffer - The audio buffer containing the audio data.
 * @param targetArray - The target Uint8Array.
 * @param offset - The offset at which to start writing.
 * @param bitDepth - The bit depth of the audio data (16 or 32).
 */
// eslint-disable-next-line @typescript-eslint/max-params
function writeAudioBufferToArray(
  audioBuffer: AudioBuffer,
  targetArray: Uint8Array,
  offset: number,
  bitDepth: BitDepth,
): void {
  const { length, numberOfChannels } = audioBuffer;
  let currentOffset = offset;

  for (let index = 0; index < length; index += 1) {
    for (let channel = 0; channel < numberOfChannels; channel += 1) {
      const channelData = audioBuffer.getChannelData(channel);
      let sample = channelData[index] ?? 0;

      if (bitDepth === BitDepth.Bit16) {
        sample = Math.max(
          PCM_MIN_16BIT,
          Math.min(PCM_MAX_16BIT, sample * PCM_MAX_16BIT),
        );
        writeInt16ToArray(sample, targetArray, currentOffset);
        currentOffset += INT16_SIZE;
      } else {
        sample = floatBits(sample);
        writeInt32ToArray(sample, targetArray, currentOffset);
        currentOffset += INT32_SIZE;
      }
    }
  }
}

/**
 * Creates a WAV file Blob from an AudioBuffer.
 * @param audioBuffer - The audio buffer containing the audio data.
 * @param as32BitFloat - Whether to encode as 32-bit float (true) or 16-bit integer (false).
 * @returns The resulting binary Blob.
 */
function createWaveFileBlobFromAudioBuffer(
  audioBuffer: AudioBuffer,
  as32BitFloat: boolean,
): Blob {
  const frameLength = audioBuffer.length;
  const { numberOfChannels, sampleRate } = audioBuffer;
  const bitsPerSample = as32BitFloat ? BitDepth.Bit32 : BitDepth.Bit16;
  const bytesPerSample = bitsPerSample / BITS_PER_BYTE;
  const byteRate = sampleRate * numberOfChannels * bytesPerSample;
  const blockAlign = numberOfChannels * bytesPerSample;
  const wavDataByteLength = frameLength * numberOfChannels * bytesPerSample;
  const totalLength = HEADER_BYTE_LENGTH + wavDataByteLength;
  const waveFileData = new Uint8Array(totalLength);
  const chunkSize =
    RIFF_HEADER_SIZE +
    SUBCHUNK_HEADER_SIZE +
    SUBCHUNK1_SIZE +
    SUBCHUNK_HEADER_SIZE +
    wavDataByteLength;

  writeStringToArray("RIFF", waveFileData, CHUNK_ID_OFFSET);
  writeInt32ToArray(chunkSize, waveFileData, CHUNK_SIZE_OFFSET);
  writeStringToArray("WAVE", waveFileData, FORMAT_OFFSET);
  writeStringToArray("fmt ", waveFileData, SUBCHUNK1_ID_OFFSET);
  writeInt32ToArray(SUBCHUNK1_SIZE, waveFileData, SUBCHUNK1_SIZE_OFFSET); // SubChunk1Size
  writeInt16ToArray(
    as32BitFloat ? AUDIO_FORMAT_FLOAT : AUDIO_FORMAT_PCM,
    waveFileData,
    AUDIO_FORMAT_OFFSET,
  ); // AudioFormat
  writeInt16ToArray(numberOfChannels, waveFileData, NUM_CHANNELS_OFFSET); // NumChannels
  writeInt32ToArray(sampleRate, waveFileData, SAMPLE_RATE_OFFSET); // SampleRate
  writeInt32ToArray(byteRate, waveFileData, BYTE_RATE_OFFSET); // ByteRate
  writeInt16ToArray(blockAlign, waveFileData, BLOCK_ALIGN_OFFSET); // BlockAlign
  writeInt16ToArray(bitsPerSample, waveFileData, BITS_PER_SAMPLE_OFFSET); // BitsPerSample
  writeStringToArray("data", waveFileData, SUBCHUNK2_ID_OFFSET);
  writeInt32ToArray(wavDataByteLength, waveFileData, SUBCHUNK2_SIZE_OFFSET); // SubChunk2Size

  writeAudioBufferToArray(
    audioBuffer,
    waveFileData,
    HEADER_BYTE_LENGTH,
    bitsPerSample,
  );

  return new Blob([waveFileData], { type: "audio/wave" });
}

/**
 * Creates a URL from an AudioBuffer.
 * @param audioBuffer - The audio buffer containing the audio data.
 * @param as32BitFloat - Whether to encode as 32-bit float (true) or 16-bit integer (false).
 * @returns The file URL.
 */
function createLinkFromAudioBuffer(
  audioBuffer: AudioBuffer,
  as32BitFloat: boolean,
): string {
  const blob = createWaveFileBlobFromAudioBuffer(audioBuffer, as32BitFloat);
  return window.URL.createObjectURL(blob);
}

export default createLinkFromAudioBuffer;
