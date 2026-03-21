class NoiseGateProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'threshold', defaultValue: 0.02, minValue: 0, maxValue: 1 },
      { name: 'attack', defaultValue: 0.01, minValue: 0, maxValue: 1 },
      { name: 'release', defaultValue: 0.15, minValue: 0, maxValue: 1 },
      { name: 'enabled', defaultValue: 1, minValue: 0, maxValue: 1 }
    ];
  }

  constructor() {
    super();
    this.envelope = 0;
    this.state = 0; // 0 = closed, 1 = open
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    const threshold = parameters.threshold[0];
    const attack = parameters.attack[0];
    const release = parameters.release[0];
    const enabled = parameters.enabled[0];

    if (enabled < 0.5 || !input || !input[0]) {
      if (input && output && input[0] && output[0]) {
        for (let channel = 0; channel < input.length; channel++) {
          if (output[channel]) output[channel].set(input[channel]);
        }
      }
      return true;
    }

    const inputChannel = input[0];
    const outputChannel = output[0];
    const sampleRate = 48000; // Default fallback, should be refined

    // Smoothing constants
    const attackCoef = Math.exp(-1 / (attack * sampleRate));
    const releaseCoef = Math.exp(-1 / (release * sampleRate));

    for (let i = 0; i < inputChannel.length; i++) {
      const absInput = Math.abs(inputChannel[i]);
      
      // Simple peak follower
      if (absInput > this.envelope) {
        this.envelope = absInput;
      } else {
        this.envelope = this.envelope * releaseCoef + absInput * (1 - releaseCoef);
      }

      if (this.envelope > threshold) {
        this.state = 1;
      } else {
        this.state = this.state * releaseCoef; // gradual close
      }

      // Apply gain based on state with smoothing
      const gain = this.state;
      for (let channel = 0; channel < input.length; channel++) {
        if (input[channel] && output[channel]) {
          output[channel][i] = input[channel][i] * gain;
        }
      }
    }

    return true;
  }
}

registerProcessor('noise-gate-processor', NoiseGateProcessor);
