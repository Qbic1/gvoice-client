class NoiseGateProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
      return [
        { name: 'threshold', defaultValue: 0.01, minValue: 0, maxValue: 1 },
        { name: 'enabled', defaultValue: 1, minValue: 0, maxValue: 1 }
      ];
    }
  
    process(inputs, outputs, parameters) {
      const input = inputs[0];
      const output = outputs[0];
      const threshold = parameters.threshold[0];
      const enabled = parameters.enabled[0];
  
      if (enabled < 0.5 || !input || !input[0]) {
        if (input && output && input[0] && output[0]) {
            output[0].set(input[0]);
        }
        return true;
      }
  
      const inputChannel = input[0];
      const outputChannel = output[0];
      
      let sum = 0;
      for (let i = 0; i < inputChannel.length; i++) {
        sum += inputChannel[i] * inputChannel[i];
      }
      const rms = Math.sqrt(sum / inputChannel.length);
  
      if (rms < threshold) {
        outputChannel.fill(0);
      } else {
        outputChannel.set(inputChannel);
      }
  
      return true;
    }
  }
  
  registerProcessor('noise-gate-processor', NoiseGateProcessor);
  