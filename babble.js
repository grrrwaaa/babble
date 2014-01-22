	

//@ http://jsfromhell.com/array/shuffle [v1.0]
function shuffle(o){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

var canvas=document.getElementById("canvas");
var ctx = canvas.getContext("2d");

// see http://simonsarris.com/project/canvasdemo/shapes.js

var mousedragging = false;
var dragstartx = 0, dragstarty = 0;
var dirty = true;
var selection = null;
var hover = null;	// which object is currently under the mouse?
var shift = false, ctrl = false, alt = false;
var keymultiplier = 1;	// shift/alt for bigger jumps, ctrl for more sensitive ones
var knobinc = 8;
var keyinc = 1/128;
var wheelinc = 1/1024;
var TWOPI = Math.PI * 2;
var minpadding = 5;

//fixes a problem where double clicking causes text to get selected on the canvas
canvas.addEventListener('selectstart', function(e) { e.preventDefault(); return false; }, false);

/*
	How to map sliders to synths?
*/

function clamp(v, min, max) {
    return (v < min) ? min : (v > max) ? max : v;
};

function getMouse(canvas, x, y) {
	var bbox = canvas.getBoundingClientRect();
	return { x: x - bbox.left * (canvas.width  / bbox.width),
			 y: y - bbox.top  * (canvas.height / bbox.height)
		   };
}


var hslider = {
	ondraw: function(o, ctx) {
		var linewidth = o.h * 0.25;
		ctx.fillStyle ="#ccc";
		ctx.fillRect(o.x, o.y, o.w, o.h);
		ctx.fillStyle ="#333";
		ctx.fillRect(o.x, o.y, o.w*o.value, o.h);
		if (o.name) {
			ctx.fillStyle ="#888";
			ctx.fillText(o.name, o.x + o.w/2, o.y + o.h/2);
		}
	},
	
	ondrag: function(o, dx, dy) {
    	o.mode.setvalue(o, o.value + keymultiplier * dx / o.w);
    },
	
	ondblclick: function(o, x, y) {
    	o.mode.setvalue(o, o.value + x / o.w);
    },
    
    setvalue: function(o, v) {
    	o.value = clamp(v, 0, 1);
    	if (o.onvaluechanged) {
    		o.onvaluechanged(o.value);
    	}	
    },
};

var vslider = {
	ondraw: function(o, ctx) {
		ctx.save();
		ctx.translate(o.x, o.y);
		ctx.rotate(Math.PI/-2);
		
		ctx.fillStyle ="#ccc";
		ctx.fillRect(-o.h, 0, o.h, o.w);
		ctx.fillStyle ="#333";
		ctx.fillRect(-o.h, 0, o.h*o.value, o.w);
		if (o.name) {
			ctx.fillStyle ="#888";
			ctx.fillText(o.name, -o.h/2, o.w/2);
		}
		
		ctx.restore();
	},
	
	ondrag: function(o, dx, dy) {
    	o.mode.setvalue(o, o.value + keymultiplier * -dy / o.h);
    },
	
	ondblclick: function(o, x, y) {
    	o.mode.setvalue(o, o.value + y / o.h);
    },
    
    setvalue: function(o, v) {
    	o.value = clamp(v, 0, 1);
    	if (o.onvaluechanged) {
    		o.onvaluechanged(o.value);
    	}	
    },
};

var arcbase = Math.PI * 0.75;
var arcrange = Math.PI * 1.5;
var knob = {
	ondraw: function(o, ctx) {
		ctx.save();
		ctx.translate(o.x, o.y);
		
		//ctx.fillRect(-o.h, 0, o.h*o.value, o.w);
		
		var lineradius = o.radius * 0.25;
		ctx.lineWidth = lineradius * 2;
		
		ctx.strokeStyle ="#ccc";
		ctx.beginPath();
		ctx.arc(o.w/2, o.h/2, o.radius - lineradius, arcbase, arcbase + arcrange);
		ctx.stroke();
		ctx.strokeStyle ="#333";
		ctx.beginPath();
		ctx.arc(o.w/2, o.h/2, o.radius - lineradius, arcbase, arcbase + o.value * arcrange);
		ctx.stroke();
		
		if (o.name) {
			ctx.fillStyle ="#888";
			ctx.fillText(o.name, o.w/2, o.radius*1.75);
		}
		ctx.restore();
	},
	
	ondrag: function(o, dx, dy) {
		// just use X and Y directly
    	o.mode.setvalue(o, o.value + knobinc * keymultiplier * (dx - dy)/(o.radius*o.radius), 0, 1);
    },
	
	ondblclick: function(o, x, y) {
    	var tx = x - o.w/2;
    	var ty = y - o.h/2;
    	// get angle etc.
    	//o.value = clamp(o.value + y / o.h, 0, 1);
    },
    
    setvalue: function(o, v) {
    	o.value = clamp(v, 0, 1);
    	if (o.onvaluechanged) {
    		o.onvaluechanged(o.value);
    	}	
    },
};

function uiFromGroup(ui, group) {
	ui.push(group);
	for (i in group.controls) {
		var o = group.controls[i];
		if (o.type == "panel") {
			uiFromGroup(ui, o);
		} else {
			if (o.type == "slider") {
				// check size ratio:
				var ratio = o.w / o.h;
				if (ratio > 2) {
					// hslider
					o.mode = hslider;
				} else if (ratio < 0.5) {
					// vslider
					o.mode = vslider;
				} else {
					// knob
					o.mode = knob;
					o.radius = Math.min(o.w, o.h) / 2;
				}
			}
			ui.push(o);
		}
	}
}

function annotateModelMinSizes(group) {
	// first derive minimum sizes:
	var w = 0, h = 0;
	for (i in group.controls) {
		var o = group.controls[i];
		if (o.type == "slider") {
			o.minw = 20;
			o.minh = 20;
		} else if (o.type == "panel") {
			annotateModelMinSizes(o);
		}
		w += o.minw;
		h += o.minh;
	}
	group.minw = w;
	group.minh = h;
}

function annotateModelSizes(group) {	
	var x = group.x + minpadding, y = group.y + minpadding;
	var innerw = (group.w - minpadding*(group.controls.length+1));
	var innerh = (group.h - minpadding*(group.controls.length+1));
	
	// TODO: decide layout (horizontal or vertical?)
	// depends on ratio of minw/minh
	// (and available space of group)
	
	var aspect = (group.minw*innerw)/(group.minh*innerh);
	var layout = aspect > 1 ? "horizontal" : "vertical";
	
	
	console.log(group.w, group.minw, group.h, group.minh, aspect, layout);
	
	for (i in group.controls) {
		var o = group.controls[i];
		if (layout == "horizontal") {		
			o.w = innerw * o.minw / group.minw;
			o.h = group.h - minpadding*2;
			o.x = x;
			o.y = y;
			x += minpadding + o.w;
		} else if (layout == "vertical") {
			o.w = group.w - minpadding*2;
			o.h = innerh * o.minh / group.minh;
			o.x = x;
			o.y = y;
			y += minpadding + o.h;
		}
		if (o.type == "panel") {
			annotateModelSizes(o);
		}
	}
}

function uiFromModel(model) {
	var ui = [];
	
	// derive minimum sizes:
	annotateModelMinSizes(model);
	
	// now position & scale according to available areas:
	model.x = 0;
	model.y = 0;
	model.w = canvas.width;
	model.h = canvas.height;
	annotateModelSizes(model);
	
	console.log(model);

	uiFromGroup(ui, model);
	return ui;
}

function genGroupModel(self) {
	var elements = 1+Math.min(self.count, Math.ceil(Math.random()*5));
	var group = {
		type:"panel", 
		name:paramname(), 
		controls:[],
	};
	for (i=0; i<elements; i++) {
		var o = { type:"slider", name:paramname(), value:Math.random(), };
		group.controls.push(o);
		self.count--;
	}
	return group;
}

function genModel(count) {
	var self = { count: count };
	var group = genGroupModel(self);
	// keep dividing until we reach our goal:
	while (self.count > 0) {
		group = {
			type:"panel", 
			name:paramname(), 
			controls:[group],
		};
		var elements = 2+Math.ceil(Math.random()*4);
		for (i=0; i<elements && self.count > 0; i++) {
			var o = genGroupModel(self);
			if (Math.random() < 0.5) {
				group.controls.push(o);		// push_back
			} else {
				group.controls.unshift(o);	// push_front
			}
		}
		group.controls = shuffle(group.controls);
	}
	return group;
}

model = genModel(16);


// object model of interface:
var ui = uiFromModel(model);

function draw(timestamp) {
	if (dirty) {
		// Store the current transformation matrix
		ctx.save();
		// Use the identity matrix while clearing the canvas
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		// Restore the transform
		ctx.restore();

		// setup style:
		ctx.fillStyle ="#666";
		ctx.strokeStyle ="#336";
		ctx.lineWidth = 1;
		ctx.lineJoin = "round";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.font = '9pt Arial';
		
		// draw widgets:
		for (i in ui) {
			var o = ui[i];
			
			
			
			if (o.mode) {
				o.mode.ondraw(o, ctx);
			} else {
				// panel
				ctx.strokeStyle ="#ddd";
				ctx.strokeRect(o.x, o.y, o.w, o.h);
			}
		}
		
		if (hover) {
			ctx.strokeStyle ="#ff3";
			ctx.strokeRect(hover.x, hover.y, hover.w, hover.h);
		}
		if (selection) {
			ctx.strokeStyle ="#f33";
			ctx.strokeRect(selection.x, selection.y, selection.w, selection.h);
		} 
		dirty = false;
	}
	window.requestAnimationFrame(draw);
}

function hitTest(ui, mx, my) {
	var l = ui.length;
    for (var i = l-1; i >= 0; i--) {
    	var o = ui[i];
    	// transform to local:
		var tx = mx - o.x;
		var ty = my - o.y;
		// test:
		if (tx >= 0 && tx < o.w && ty >=0 && ty < o.h) {
			return { x: tx, y: ty, target: o }
		}
	}
}

function mousedown(e) {
    var mouse = getMouse(canvas, e.clientX, e.clientY);
    var mx = mouse.x;
    var my = mouse.y;
	var hit = hitTest(ui, mouse.x, mouse.y);
	if (hit) {
		selection = hit.target;
		// Keep track of where in the object we clicked
		// so we can move it smoothly (see mousemove)
		dragstartx = mouse.x;
		dragstarty = mouse.y;
		mousedragging = true;
		dirty = true;
		return;
	}

    // haven't returned means we have failed to select anything.
    // If there was an object selected, deselect it
    if (selection) {
      	selection = null;
      	dirty = true;
    }
}

function mousemove(e) {
	var mouse = getMouse(canvas, e.clientX, e.clientY);
    if (mousedragging && selection){
    	var dx = mouse.x - dragstartx;
    	var dy = mouse.y - dragstarty;
    	
    	selection.mode.ondrag(selection, dx, dy);
    	
    	// reset dragstart for next event:
    	dragstartx = mouse.x;
    	dragstarty = mouse.y;
		dirty = true;
    } else {
    	// might want to handle mouseover condition:
    	var hit = hitTest(ui, mouse.x, mouse.y);
		if (hit) {
			if (hit.target != hover) {
				hover = hit.target;
				dirty = true;
			}
		} else {
			hover = null;
			dirty = true;
		}
    }
}

// force a value?
function dblclick(e) {
    var mouse = getMouse(canvas, e.clientX, e.clientY);
    var mx = mouse.x;
    var my = mouse.y;
	var hit = hitTest(ui, mouse.x, mouse.y);
	if (hit) {
		selection = hit.target;
		
		// jump directly to value
    	selection.mode.setvalue(selection, hit.x / selection.w);
    	
		dirty = true;
	}
}

function mousewheel(e) {
	// get object under mouse:
	event.preventDefault(); 
	var mouse = getMouse(canvas, e.clientX, e.clientY);
    var mx = mouse.x;
    var my = mouse.y;
	var hit = hitTest(ui, mouse.x, mouse.y);
	if (hit) {
		// don't change selection, just apply to target:
		var target = hit.target;
		target.mode.setvalue(target, target.value + wheelinc * keymultiplier * e.wheelDelta);
		
		dirty = true;
	}
	return false; 
}

function keydown(e) {
	
	// nice, but doesn't work on all browsers...
	if (e.shiftKey) {
		shift = true; keymultiplier = 0.25;
	} else if (e.ctrlKey) {
		ctrl = true; keymultiplier = 0.25;
	} else if (e.altKey) {
		alt = true; keymultiplier = 4;
	} else {
		var code = e.keyCode;
		switch (code) {
			// ...so repeat it here too
			case 16: shift = true; keymultiplier = 0.25; break; //Shift key
			case 17: ctrl = true; keymultiplier = 0.25; break; //Ctrl key
			case 18: alt = true; keymultiplier = 4; break; //Alt key
		
			case 38: 
			case 39: 
				if (selection) {
					selection.mode.setvalue(selection, selection.value + keyinc * keymultiplier);
					dirty = true;
				}
				break; //Up/Right key
		
			case 37: 
			case 40: 
				if (selection) {
					selection.mode.setvalue(selection, selection.value - keyinc * keymultiplier);
					dirty = true;
				}
				break; //Left/Down key
			
			//default: console.log("keydown", e.keyCode); //Everything else
		}
	}
}

function keyup(e) {
	// nice, but doesn't work on all browsers...
	if (e.shiftKey) {
		shift = false; keymultiplier = 1;
	} else if (e.ctrlKey) {
		ctrl = false; keymultiplier = 1;
	} else if (e.altKey) {
		alt = false; keymultiplier = 1;
	} else {
		var code = e.keyCode;
		switch (code) {
			// ...so repeat it here too
			case 16: shift = false; keymultiplier = 1; break; //Shift key
			case 17: ctrl = false; keymultiplier = 1; break; //Ctrl key
			case 18: alt = false; keymultiplier = 1; break; //Alt key
		
			//default: console.log("keyup", e.keyCode); //Everything else
		}
	}
}

function initui() {
	// build UI:
	
	console.log("model", model);
	console.log("ui", ui);

	// add callbacks:
	canvas.onmousedown = mousedown;
	canvas.onmouseout = function(e) { 
		if (hover) { hover = null; dirty = true; }
	};
	canvas.addEventListener('mousewheel', mousewheel, false);
	//window.onscroll = function(e) {	console.log("scroll", e);}
	canvas.addEventListener( "dblclick", dblclick, true);
	// attach to window rather than canvas so that it still works outside
	window.addEventListener( "mousemove", mousemove, true);
	window.addEventListener( "mouseup", function(e) { mousedragging = false; }, true);
	window.addEventListener( "keydown", keydown, true);
	window.addEventListener( "keyup", keyup, true);
	
	
	// start rendering:
	//setInterval(draw, 40);
	window.requestAnimationFrame(draw);
}

function synth_core() {
	return { 
		name: gensym("sine"),
		dsp: function(self) {
			self.value = "new Gibberish.Sine(" 
						+ self.controls[0].value + ", " 
						+ self.controls[1].value + ")";
		},
		controls: [
			{ name:"frequency", min: 0, max: 3200, value: 200 },
			{ name:"amp", min: 0, max: 1, value: 1 },
		],
	};
}

function initsynth() {
	
	Gibberish.init(); 
	Gibberish.Time.export();
	Gibberish.Binops.export();

	
	
	mod1 = new Gibberish.Sine(4, 0);
	mod2 = new Gibberish.Sine(.1, 50); 
	mod1.amp = mod2
	sin = new Gibberish.Sine( Add(mod1, 440), .25 ).connect()      
	
	for (i in ui) {
		var w = ui[i];
		w.onvaluechanged = function(v) {
			console.log("valuechanged");
			mod1.frequency = 10 * v;
		};
	}	           
	
}

// convert canvas to image
//http://www.informit.com/articles/article.aspx?p=1903884&seqNum=9

initui();

// audio:

document.getElementById("begin").onclick = function() {
	initsynth();
};
  