class DownsamplerProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {name: "bitcrush", defaultValue: 16, minValue: 1, maxValue: 16}, 
      {name: "downsample", defaultValue: 0.5, minValue: 0, maxValue: 1},
    ]
  }

  constructor() {
    super()
    this.phase_ = 0
    this.lastSampleValue_ = 0
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]
    const output = outputs[0]

    const bitDepth = parameters.bitcrush
    const frequencyReduction = parameters.downsample
    const isBitDepthConstant = bitDepth.length === 1

    for (let channel = 0; channel < input.length; ++channel) {
      const inputChannel = input[channel]
      const outputChannel = output[channel]
      let step = Math.pow(0.5, bitDepth[0])
      for (let i = 0; i < inputChannel.length; ++i) {
        if (!isBitDepthConstant) {
          step = Math.pow(0.5, bitDepth[i])
        }
        this.phase_ += frequencyReduction[i]
        if (this.phase_ >= 1.0) {
          this.phase_ -= 1.0;
          this.lastSampleValue_ =
              step * Math.floor(inputChannel[i] / step + 0.5)
        }
        outputChannel[i] = this.lastSampleValue_;
      }
    }
    return true
  }
}

registerProcessor("downsampler", DownsamplerProcessor)