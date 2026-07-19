class VADProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.isSpeaking = false;
    this.silenceFrames = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const channel = input[0];
    let sum = 0;

    // RMS calculation (VERY cheap)
    for (let i = 0; i < channel.length; i++) {
      const s = channel[i];
      sum += s * s;
    }

    const rms = Math.sqrt(sum / channel.length);

    const SPEAK_THRESHOLD = 0.02;
    // 150 blocks * 128 samples / 48000 Hz ≈ 400ms hangover. The previous value
    // of 20 was only ~53ms, which made the speaking indicator flicker on the
    // natural pauses between words.
    const SILENCE_FRAMES = 150;

    if (rms > SPEAK_THRESHOLD) {
      this.silenceFrames = 0;

      if (!this.isSpeaking) {
        this.isSpeaking = true;
        this.port.postMessage(1); // speaking ON
      }
    } else {
      this.silenceFrames++;

      if (this.isSpeaking && this.silenceFrames > SILENCE_FRAMES) {
        this.isSpeaking = false;
        this.port.postMessage(0); // speaking OFF
      }
    }

    return true;
  }
}

registerProcessor('vad-processor', VADProcessor);