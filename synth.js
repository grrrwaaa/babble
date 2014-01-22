Gibberish.init(); 
Gibberish.Time.export();
Gibberish.Binops.export();

var apply_lfo = function(synth, ugen) {
	if (synth.inputs.length > 0) {
	
		// get an existing input:
		var index = Math.floor(Math.random() * synth.inputs.length);
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

var root = function(synth) {
	var ugen = modulate(synth);
	
	var delay = new Gibberish.Delay({ input:ugen, time:maxdelay, feedback: 0.1, });
	
	synth.inputs.push({ 
		type: "audible", 
		min: mindelay, max: maxdelay, 
		default: 1,
		replace: function(o) { 
			delay.time = Add(mindelay, Abs(Mul(o, maxdelay-mindelay))); 
			console.log("set time", o, delay.time); 
		},
		ui: new Slider(function(v) { 
			delay.time = mindelay + Math.abs(v) * (maxdelay - mindelay); 
			console.log("set time", v, delay.time); 
		}),
	});
	
	synth.inputs.push({ 
		type: "audible", 
		min: -1, max: 1, 
		default: 1,
		replace: function(o) { 
			console.log("set feedback", o); 
			delay.feedback = new Gibberish.Distortion(o); 
		},
		ui: new Slider(function(v) { 
			console.log("set feedback", v); 
			delay.feedback = v*2-1; 
		}),
	});
	
	return delay;
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

var main = root(synth);

while (synth.inputs.length < 8) {
	modulate(synth);
}

var panels = [];

for (i in synth.inputs) {
	var input = synth.inputs[i];
	input.ui.action(input.ui.value);
	if (i < 3) {
		panels[i] = new Panel();
		ui.add(panels[i]);
		panels[i].add(input.ui);
	} else {
		pick(panels).add(input.ui);
	}
}
ui.rebuild();

/*
var main;
console.log("outputs", synth.outputs.length);
for (i in synth.outputs) {
	if (i == 0) {
		main = synth.outputs[i];
	} else {
		main = Add(main, synth.outputs[i]);
	}
}*/

main.connect();
