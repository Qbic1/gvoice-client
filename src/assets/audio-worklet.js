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

    // Use the AudioWorkletGlobalScope sampleRate global (always correct)
    const attackCoef  = Math.exp(-1 / (attack  * sampleRate));
    const releaseCoef = Math.exp(-1 / (release * sampleRate));

    const blockSize = input[0].length;

    for (let i = 0; i < blockSize; i++) {
      const absInput = Math.abs(input[0][i]);

      // Envelope follower with separate attack/release smoothing
      if (absInput > this.envelope) {
        this.envelope = attackCoef * this.envelope + (1 - attackCoef) * absInput;
      } else {
        this.envelope = releaseCoef * this.envelope + (1 - releaseCoef) * absInput;
      }

      // Smooth the gate gain to avoid clicks on open/close
      const targetGain = this.envelope > threshold ? 1.0 : 0.0;
      if (targetGain > this.gateGain) {
        this.gateGain = attackCoef  * this.gateGain + (1 - attackCoef)  * targetGain;
      } else {
        this.gateGain = releaseCoef * this.gateGain + (1 - releaseCoef) * targetGain;
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