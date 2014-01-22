Gibberish.init(); 
Gibberish.Time.export();
Gibberish.Binops.export();

var apply_lfo = function(synth, ugen) {
	if (synth.inputs.length > 0) {
	
		// get an existing input:
		var index = Math.floor(random() * synth.inputs.length);
		var input = synth.inputs[index];
	
		// apply to this input:
		input.replace(ugen);
	
		// now remove it:
		synth.inputs.splice(index, 1);
		
	} else {
	
		// use it as output:
		synth.outputs.push(ugen);
	}
	
	return ugen;
}

var standard_osc = function(synth, ugen) {
	// must add ugen before adding inputs
	var ugen = apply_lfo(synth, ugen);
	
	synth.inputs.push({ 
		type: "control", 
		min: 0, max: 3200,
		replace: function(o) { ugen.frequency = Mul(o, 3200); },
		ui: new Slider(function(v) { ugen.frequency = v; }),
	});
	
	synth.inputs.push({ 
		type: "audible", 
		min: -1, max: 1, 
		default: 1,
		replace: function(o) { ugen.amp = Add(-1, Mul(o, 2)); },
		ui: new Slider(function(v) { ugen.amp = v; }),
	});
	
	return ugen;
}

// modulators (oscillators):

var sine = function(synth) {	
	var ugen = new Gibberish.Sine();
	return standard_osc(synth, ugen);
}

var saw = function(synth) {
	var ugen = new Gibberish.Saw();
	return standard_osc(synth, ugen);
}


var saw3 = function(synth) {
	var ugen = new Gibberish.Saw3();
	return standard_osc(synth, ugen);
}

var tri = function(synth) {
	var ugen = new Gibberish.Triangle();
	return standard_osc(synth, ugen);
}

// seems really noisy
var pwm = function(synth) {
	var ugen = new Gibberish.PWM();
	standard_osc(synth, ugen);
	synth.inputs.push({ 
		type: "audible", 
		min: 0, max: 1, 
		default: 1,
		replace: function(o) { ugen.pulsewidth = o; },
		ui: new Slider(function(v) { ugen.pulsewidth = v; }),
	});
	return ugen;
}

var noise = function(synth) {
	var ugen = new Gibberish.Noise();
	apply_lfo(synth, ugen);
	synth.inputs.push({ 
		type: "audible", 
		min: -1, max: 1, 
		default: 1,
		replace: function(o) { ugen.amp = Add(-1, Mul(o, 2)); },
		ui: new Slider(function(v) { ugen.amp = v; }),
	});
	return ugen;
}

var modulators = [
	sine, 
	sine, saw, saw3, tri, 
	sine, saw, saw3, tri, 
	pwm, 
	//noise,
];

var modulate = function(synth) {
	return pick(modulators)(synth);
}

// Add, Mul, Sub, Div, Mod, Abs, Sqrt, Pow
// check issues of div/mod 0)
// check issues of sqrt(-ve) -> sqrt(abs(x))
// also non-integer power issues of negatives. pow(abs(x), e)

// Synth, PolySynth, Synth2, PolySynth2, FMSynth, PolyFM, MonoSynth, KarplusStrong: all triggered by .note() events.

////////////////////////////////////////////////////////////////////////////////

var maxdelay = 44100 / 2;
var mindelay = maxdelay / 128;

var fx_delay = function(synth, input) {
	console.log("delay");
	var ugen = new Gibberish.Delay({ input:input, time:maxdelay, feedback: 0.1, });
	
	synth.inputs.push({ 
		type: "audible", 
		min: mindelay, max: maxdelay, 
		default: 1,
		replace: function(o) { 
			ugen.time = Add(mindelay, Abs(Mul(o, maxdelay-mindelay))); 
		},
		ui: new Slider(function(v) { 
			ugen.time = mindelay + Math.abs(v) * (maxdelay - mindelay); 
		}),
	});
	
	synth.inputs.push({ 
		type: "audible", 
		min: -1, max: 1, 
		default: 1,
		replace: function(o) { 
			ugen.feedback = new Gibberish.Distortion({ input: Add(0.5, Mul(o, 0.5)), }); 
		},
		ui: new Slider(function(v) { ugen.feedback = v; }),
	});
	
	return ugen;
}

var fx_distortion = function(synth, input) {
	console.log("distortion");
	var ugen = new Gibberish.Distortion({ input:input, amount:1, });
	
	synth.inputs.push({ 
		type: "audible", 
		min: 2, max: 100, 
		default: 1,
		replace: function(o) { 
			ugen.amount = Add(2, Abs(Mul(o, 100-2))); 
		},
		ui: new Slider(function(v) { 
			ugen.amount = 2 + Math.abs(v) * (100-2); 
		}),
	});
	
	return ugen;
}

var fx_decimator = function(synth, input) {
	console.log("decimator");
	var ugen = new Gibberish.Decimator({ input:input, });
	
	synth.inputs.push({ 
		type: "audible", 
		min: 0, max: 16, 
		default: 1,
		replace: function(o) { 
			ugen.bitDepth = Abs(Mul(o, 16)); 
		},
		ui: new Slider(function(v) { 
			ugen.bitDepth = Math.abs(v) * 16; 
		}),
	});
	
	synth.inputs.push({ 
		type: "audible", 
		min: 0, max: 1, 
		default: 1,
		replace: function(o) { 
			ugen.sampleRate = Abs(o); 
		},
		ui: new Slider(function(v) { 
			ugen.sampleRate = v; 
		}),
	});
	
	return ugen;
}

var fx_ringmod = function(synth, input) {
	console.log("ringmod");
	var ugen = new Gibberish.RingModulation({ input:input, });
	
	synth.inputs.push({ 
		type: "control", 
		min: 0, max: 3200,
		replace: function(o) { ugen.frequency = Mul(o, 3200); },
		ui: new Slider(function(v) { ugen.frequency = v; }),
	});
	
	synth.inputs.push({ 
		type: "audible", 
		min: -1, max: 1, 
		default: 1,
		replace: function(o) { ugen.amp = Add(-1, Mul(o, 2)); },
		ui: new Slider(function(v) { ugen.amp = v; }),
	});
	
	synth.inputs.push({ 
		type: "audible", 
		min: 0, max: 1, 
		default: 1,
		replace: function(o) { ugen.mix = Abs(o); },
		ui: new Slider(function(v) { ugen.mix = v; }),
	});
	
	return ugen;
}

var maxflange = maxdelay / 16;

var fx_flanger = function(synth, input) {
	console.log("flanger");
	var ugen = new Gibberish.Flanger({ input:input, });
	
	synth.inputs.push({ 
		type: "audible", 
		min: -20, max: 20, 
		default: 1,
		replace: function(o) { ugen.rate = Add(-20, Mul(o, 40)); },
		ui: new Slider(function(v) { ugen.rate = v*40-20; }),
	});
	
	synth.inputs.push({ 
		type: "audible", 
		min: 0, max: maxflange, 
		default: 1,
		replace: function(o) { ugen.amount = Mul(o, maxflange); },
		ui: new Slider(function(v) { ugen.amount = v * maxflange; }),
	});
	
	synth.inputs.push({ 
		type: "audible", 
		min: 0, max: maxflange, 
		default: 1,
		replace: function(o) { ugen.offset = Mul(o, maxflange); },
		ui: new Slider(function(v) { ugen.offset = v * maxflange; }),
	});
	
	synth.inputs.push({ 
		type: "audible", 
		min: -1, max: 1, 
		default: 1,
		replace: function(o) { ugen.feedback = new Gibberish.Distortion({ input: o }); },
		ui: new Slider(function(v) { ugen.feedback = v*2-1; }),
	});
	
	return ugen;
}

var fx_vibrato = function(synth, input) {
	console.log("vibrato");
	var ugen = new Gibberish.Vibrato({ input:input, });
	
	synth.inputs.push({ 
		type: "audible", 
		min: -20, max: 20, 
		default: 1,
		replace: function(o) { ugen.rate = Add(-20, Mul(o, 40)); },
		ui: new Slider(function(v) { ugen.rate = v*40-20; }),
	});
	
	synth.inputs.push({ 
		type: "audible", 
		min: 0, max: maxflange, 
		default: 1,
		replace: function(o) { ugen.amount = Mul(o, maxflange); },
		ui: new Slider(function(v) { ugen.amount = v * maxflange; }),
	});
	
	synth.inputs.push({ 
		type: "audible", 
		min: 0, max: maxflange, 
		default: 1,
		replace: function(o) { ugen.offset = Mul(o, maxflange); },
		ui: new Slider(function(v) { ugen.offset = v * maxflange; }),
	});
	
	return ugen;
}

var fx_reverb = function(synth, input) {
	console.log("reverb");
	var ugen = new Gibberish.Reverb({ 
		input:input, 
		roomSize: random(),
		damping: random(),
		wet: 1,
		dry: 1,
	});
	
	synth.inputs.push({ 
		type: "audible", 
		min: 0, max: 1, 
		default: 1,
		replace: function(o) { 
			var mix = Abs(o); 
			ugen.wet = mix;
			ugen.dry = Sub(1, mix);
		},
		ui: new Slider(function(v) { 
			ugen.wet = v; 
			ugen.dry = 1-v; 
		}),
	});
	
	synth.inputs.push({ 
		type: "audible", 
		min: 0, max: 1, 
		default: 1,
		replace: function(o) { ugen.damping = Abs(o); },
		ui: new Slider(function(v) { ugen.damping = v; }),
	});
	
	return ugen;
}

var fxs = [ 

	fx_delay, fx_delay, 
	fx_delay, fx_delay, 
	fx_distortion, 
	fx_decimator,
	fx_ringmod, 
	fx_flanger, 
	//fx_vibrato,
	
	fx_reverb,
	// BufferShuffler
];

var fx = function(synth, ugen) {
	return pick(fxs)(synth, ugen);
}

var root = function(synth) {
	var ugen = modulate(synth);
	synth.outputs = [];
	
	ugen = fx(synth, ugen);
	ugen = fx(synth, ugen);
	
	synth.outputs.push(ugen);
	
	return ugen;
}


////////////////////////////////////////////////////////////////////////////////

var synth = {
	// list of all available inputs to connect to:
	inputs: [],
	
	// current output:
	outputs: [],
	
	// code fragments:
	fragments: [],
};

/*
	Figure we could go for a two-pronged attack here.
	Create a bunch of LFO panels, and a bunch of FX panels.
	Apply some fx to 
*/

root(synth);
while (synth.inputs.length < 14) {
	modulate(synth);
}

var panels = [];

for (i in synth.inputs) {
	var input = synth.inputs[i];
	input.ui.action(input.ui.value);
	if (i < 5) {
		var p = new Panel();
		panels[i] = p;
		if (i < 3) {
			ui.add(p);
		} else {
			pick(panels).add(p);
		}
		p.add(input.ui);
	} else {
		pick(panels).add(input.ui);
	}
}
ui.rebuild();

var main;
console.log("outputs", synth.outputs.length);
for (i in synth.outputs) {
	if (i == 0) {
		main = synth.outputs[i];
	} else {
		main = Add(main, synth.outputs[i]); //Mul(Add(main, synth.outputs[i]), 0.7);
	}
}

// ear protection
main = new Gibberish.Distortion({ input: Mul(0.5, main) });
main.connect();
