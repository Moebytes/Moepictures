class DownSampleProcessor extends AudioWorkletProcessor {
	static get parameterDescriptors() {
		return [{
			name: "down",
			defaultValue: 8,
			minValue: 1,
			maxValue: 1024
		}]
	}

	constructor(){
		super()
		// the frame counter
		this.count = 0
		// sample and hold variable array
		this.sah = []
	}

	process(inputs, outputs, parameters){
		const input = inputs[0]
		const output = outputs[0]

		// if there is anything to process
		if (input.length > 0){
			// for the length of the sample array (generally 128)
			for (let i=0; i<input[0].length; i++){
				// for every channel
				for (let channel=0; channel<input.length; ++channel){
					// if counter equals 0, sample and hold
					if (this.count % parameters.down === 0){
						this.sah[channel] = input[channel][i]
					}
					// output the currently held sample
					output[channel][i] = this.sah[channel]
				}
				// increment sample counter
				this.count++
			}
		}
		return true
	}
}
registerProcessor("downsampler-processor", DownSampleProcessor)