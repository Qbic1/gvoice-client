class NoiseGateProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'threshold', defaultValue: 0.02, minValue: 0, maxValue: 1 },
      { name: 'attack',    defaultValue: 0.01, minValue: 0, maxValue: 1 },
      { name: 'release',   defaultValue: 0.15, minValue: 0, maxValue: 1 },
      { name: 'enabled',   defaultValue: 1,    minValue: 0, maxValue: 1 }
    ];
  }

  constructor() {
    super();
    this.envelope = 0;
    this.gateGain = 0;
  }

  process(inputs, outputs, parameters) {
    const input  = inputs[0];
    const output = outputs[0];

    if (!input || !input[0] || !output || !output[0]) return true;

    const threshold = parameters.threshold[0];
    const attack    = parameters.attack[0];
    const release   = parameters.release[0];
    const enabled   = parameters.enabled[0];

    const numChannels = Math.min(input.length, output.length);

    // Bypass: pass audio through unchanged when gate is disabled
    if (enabled < 0.5) {
      for (let ch = 0; ch < numChannels; ch++) {
        if (input[ch] && output[ch]) output[ch].set(input[ch]);
      }
      return true;
    }

    const blockSize = input[0].length;

    // FIX: Use block-level RMS for envelope detection instead of per-sample peak.
    // Block RMS is more stable and matches the RMS calculation used in the UI
    // meter, meaning the threshold line position accurately reflects where the
    // gate opens/closes. Per-sample peak detection caused the threshold line to
    // be miscalibrated (peak is ~1.4x higher than RMS for typical signals).
    let sumSq = 0;
    for (let i = 0; i < blockSize; i++) {
      sumSq += input[0][i] * input[0][i];
    }
    const blockRms = Math.sqrt(sumSq / blockSize);

    // Envelope follower with separate attack/release — operates per-block.
    // Per-block time constants are derived from blockSize / sampleRate.
    const blockAttackCoef  = Math.exp(-blockSize / (attack  * sampleRate));
    const blockReleaseCoef = Math.exp(-blockSize / (release * sampleRate));

    if (blockRms > this.envelope) {
      this.envelope = blockAttackCoef  * this.envelope + (1 - blockAttackCoef)  * blockRms;
    } else {
      this.envelope = blockReleaseCoef * this.envelope + (1 - blockReleaseCoef) * blockRms;
    }

    // Binary gate decision based on smoothed envelope
    const targetGain = this.envelope > threshold ? 1.0 : 0.0;

    // Apply gain per-sample with smoothing to avoid clicks at gate open/close.
    // Use per-sample coefficients here so the transition is smooth even within
    // a single block (128 samples ≈ 2.7ms at 48kHz — audible if hard-switched).
    const perSampleAttackCoef  = Math.exp(-1 / (attack  * sampleRate));
    const perSampleReleaseCoef = Math.exp(-1 / (release * sampleRate));

    for (let i = 0; i < blockSize; i++) {
      if (targetGain > this.gateGain) {
        this.gateGain = perSampleAttackCoef  * this.gateGain + (1 - perSampleAttackCoef)  * targetGain;
      } else {
        this.gateGain = perSampleReleaseCoef * this.gateGain + (1 - perSampleReleaseCoef) * targetGain;
      }

      for (let ch = 0; ch < numChannels; ch++) {
        if (input[ch] && output[ch]) {
          output[ch][i] = input[ch][i] * this.gateGain;
        }
      }
    }

    return true;
  }
}

registerProcessor('noise-gate-processor', NoiseGateProcessor);
