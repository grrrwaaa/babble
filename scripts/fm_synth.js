/**#Gibberish.FMSynth - Synth
Classic 2-op FM synthesis with an attached attack / decay envelope.
  
## Example Usage##
`Gibberish.init();  
a = new Gibberish.FMSynth({ cmRatio:5, index:3 }).connect();
a.note(880);`  
## Constructor   
**param** *properties*: Object. A dictionary of property values (see below) to set for the synth on initialization.
- - - -
**/
/**###Gibberish.FMSynth.frequency : property  
Number. The frequency for the carrier oscillator. This is normally set using the note method but can also be modulated.
**/
/**###Gibberish.FMSynth.cmRatio : property  
Number. The carrier-to-modulation ratio. A cmRatio of 2 means that the carrier frequency will be twice the frequency of the modulator.
**/
/**###Gibberish.FMSynth.attack : property  
Number. The length of the attack portion of the envelope in samples. Note that the synth's envelope affects both amplitude and the index of the synth.
**/
/**###Gibberish.FMSynth.decay : property  
Number. The length of the decay portion of the envelope in samples. Note that the synth's envelope affects both amplitude and the index of the synth.
**/
/**###Gibberish.FMSynth.glide : property  
Number. The synth has a one-pole filter attached to the carrier frequency. Set glide to a value between .999 and 1 to get pitch sweep between notes.
**/
/**###Gibberish.FMSynth.amp : property  
Number. The relative amplitude level of the synth.
**/
/**###Gibberish.FMSynth.channels : property  
Number. Default 2. Mono or Stereo synthesis.
**/
/**###Gibberish.FMSynth.pan : property  
Number. Default 0. If the synth has two channels, this determines its position in the stereo spectrum.
**/
Gibberish.FMSynth = function(properties) {
	this.name =	"fmSynth";

	this.properties = {
	  frequency:0,
	  cmRatio:	2,
	  index:		5,			
	  attack:		22050,
	  decay:		22050,
    sustain:  22050,
    release:  22050,
    attackLevel: 1,
    sustainLevel: .5,
    releaseTrigger: 0,
    glide:    .15,
    amp:		  .25,
    channels: 2,
	  pan:		  0,
  };
/**###Gibberish.FMSynth.note : method  
Generate an enveloped note at the provided frequency  
  
param **frequency** Number. The frequency for the carrier oscillator. The modulator frequency will be calculated automatically from this value in conjunction with the synth's carrier to modulation ratio  
param **amp** Number. Optional. The volume to use.  
**/
	this.note = function(frequency, amp) {
    var noteoff = false;
		if(typeof this.frequency !== 'object'){
      if( useADSR && frequency === lastFrequency && amp === 0) {
        this.releaseTrigger = 1;
        noteoff = true;
        return;
      }
      
      this.frequency = lastFrequency = frequency;
    }else{
      this.frequency[0] = lastFrequency = frequency;
      Gibberish.dirty(this);
    }
					
		if(typeof amp !== 'undefined' && !noteoff ) this.amp = amp;
					
    _envelope.run();
	};
  
  properties = properties || {}
  
	var useADSR     = typeof properties.useADSR === 'undefined' ? false : properties.useADSR,
      _envelope   = useADSR ? new Gibberish.ADSR() : new Gibberish.AD(),
      envstate    = _envelope.getState,
      envelope    = _envelope.callback,
	    carrier     = new Gibberish.Sine().callback,
	    modulator   = new Gibberish.Sine().callback,
      lag         = new Gibberish.OnePole().callback,
    	panner      = Gibberish.makePanner(),
    	out         = [0,0],
      obj         = this,
      lastFrequency = 0,
      phase = 0,
      check = false;

  _envelope.requireReleaseTrigger = properties.requireReleaseTrigger || false;

  this.callback = function(frequency, cmRatio, index, attack, decay, sustain, release, attackLevel, sustainLevel, releaseTrigger, glide, amp, channels, pan) {
    var env, val, mod
        
    if(glide >= 1) glide = .9999;
    frequency = lag(frequency, 1-glide, glide);
    
    if( useADSR ) {
      env = envelope( attack, decay, sustain, release, attackLevel, sustainLevel, releaseTrigger );
      if( releaseTrigger ) {
        obj.releaseTrigger = 0
      }

      if( envstate() < 4 ) {
        mod = modulator(frequency * cmRatio, frequency * index) * env;
  			val = carrier( frequency + mod, 1 ) * env * amp;
    
  			return channels === 1 ? val : panner(val, pan, out);
      }else{
  		  val = out[0] = out[1] = 0;
        return channels === 1 ? val : out
      }
    }else{
      if( envstate() < 2 ) {
  			env = envelope(attack, decay);
  			mod = modulator(frequency * cmRatio, frequency * index) * env;
          
  			val = carrier( frequency + mod, 1 ) * env * amp;

  			out[0] = out[1] = val;
    
  			return channels === 1 ? val : panner(val, pan, out);
      }else{
  		  val = out[0] = out[1] = 0;
        return channels === 1 ? val : panner(val, pan, out);
      }
    }
	};
  
  this.init();
  this.oscillatorInit();
	this.processProperties(arguments);
};
Gibberish.FMSynth.prototype = Gibberish._synth;
/**#Gibberish.PolyFM - Synth
A polyphonic version of [FMSynth](javascript:displayDocs('Gibberish.FMSynth'\)). There are two additional properties for the polyphonic version of the synth. The polyphonic version consists of multiple FMSynths being fed into a single [Bus](javascript:displayDocs('Gibberish.Bus'\)) object.
  
## Example Usage ##
`Gibberish.init();  
a = new Gibberish.PolyFM({ cmRatio:5, index:3, attack:88200, decay:88200 }).connect();  
a.note(880);  
a.note(1320);  
`  
## Constructor   
One important property to pass to the constructor is the maxVoices property, which defaults to 5. This controls how many voices are allocated to the synth and cannot be changed after initialization.  
  
**param** *properties*: Object. A dictionary of property values (see below) to set for the synth on initialization.
- - - -
**/
/**###Gibberish.PolyFM.children : property  
Array. Read-only. An array holding all of the child FMSynth objects.
**/
/**###Gibberish.PolyFM.maxVoices : property  
Number. The number of voices of polyphony the synth has. May only be set in initialization properties passed to constrcutor.
**/


Gibberish.PolyFM = function() {
  this.__proto__ = new Gibberish.Bus2();
  
	Gibberish.extend(this, {
    name:     "polyfm",
		maxVoices:		5,
		voiceCount:		0,
    children: [],
    frequencies: [],
    
    polyProperties : {
      glide:		 0,
      attack: 22050,
      decay:  22050,
      index:  5,
      cmRatio:2,
    },
/**###Gibberish.PolyFM.note : method  
Generate an enveloped note at the provided frequency using a simple voice allocation system where if all children are active, the one active the longest cancels its current note and begins playing a new one.    
  
param **frequency** Number. The frequency for the carrier oscillator. The modulator frequency will be calculated automatically from this value in conjunction with the synth's  
param **amp** Number. Optional. The volume to use.  
**/
    note : function(_frequency, amp) {
      var lastNoteIndex = this.frequencies.indexOf( _frequency ),
          idx = lastNoteIndex > -1 ? lastNoteIndex : this.voiceCount++,
          synth = this.children[ idx ];
      
      synth.note(_frequency, amp);
            
      this.frequencies[ idx ] = _frequency;
      
      if(this.voiceCount >= this.maxVoices) this.voiceCount = 0;
    },
	}); 
     
  this.amp = 1 / this.maxVoices;
  
  Gibberish.polyInit(this);
  
  this.children = [];
  
  if(typeof arguments[0] === 'object') {
    this.maxVoices = arguments[0].maxVoices ? arguments[0].maxVoices : this.maxVoices
    this.useADSR = typeof arguments[0].useADSR !== 'undefined' ? arguments[ 0 ].useADSR : false    
    this.requireReleaseTrigger = typeof arguments[0].requireReleaseTrigger !== 'undefined' ? arguments[ 0 ].requireReleaseTrigger : false    
  }
  
	for(var i = 0; i < this.maxVoices; i++) {
		var props = {
			attack: 	this.attack,
			decay:		this.decay,
			cmRatio:	this.cmRatio,
			index:		this.index,
      channels: 2,
      useADSR : this.useADSR || false,      
      requireReleaseTrigger: this.requireReleaseTrigger || false,
			amp: 		  1,
		};
		var synth = new Gibberish.FMSynth(props);
		synth.connect(this);

		this.children.push(synth);
	}
  
	this.processProperties(arguments);
  Gibberish._synth.oscillatorInit.call(this);
};