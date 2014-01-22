var canvas=document.getElementById("canvas");
var ctx = canvas.getContext("2d");

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

// for knobs
var arcbase = Math.PI * 0.75;
var arcrange = Math.PI * 1.5;

var getMouse = function (canvas, x, y) {
	var bbox = canvas.getBoundingClientRect();
	return { x: x - bbox.left * (canvas.width  / bbox.width),
			 y: y - bbox.top  * (canvas.height / bbox.height)
		   };
}

var hitTest = function(mx, my) {
	var l = ui_list.length;
    for (var i = l-1; i >= 0; i--) {
    	var o = ui_list[i];
    	// transform to local:
		var tx = mx - o.x;
		var ty = my - o.y;
		// test:
		if (tx >= 0 && tx < o.w && ty >=0 && ty < o.h) {
			return { x: tx, y: ty, target: o }
		}
	}
}

/*

	Want to be able to gradually add controls and panels to build up a ui tree
	Then apply a function to automatically generate the layout
	As a result get the ui items in a linear sorted list
	
	So we have two objects: the ui model (a panel), the ui list
	
*/

// the UI model (a tree structure)
var ui;

// all widgets in a sorted list (panels lower, widgets higher)
var ui_list;

var Slider = function(action) {
	this.type = "slider";
	this.iscontainer = false;
	this.name = paramname();
	this.value = random();
	this.action = action;
	return this;
}

Slider.prototype.setvalue = function(v) {
	//console.log("setvalue", v);
	this.value = clamp(v, 0, 1);
	if (this.action) {
		this.action(this.value);
	}	
}

Slider.prototype.ondrag = function(dx, dy) {
	if (this.type == "hslider") {
		this.setvalue(this.value + keymultiplier * dx / this.w);
    } else if (this.type == "vslider") {
    	this.setvalue(this.value + keymultiplier * -dy / this.h);
    } else if (this.type == "knob") {
    	// just use X and Y directly
    	this.setvalue(this.value + knobinc * keymultiplier * (dx - dy)/(this.radius*this.radius));
    }
}

Slider.prototype.ondblclick = function(o, x, y) {
	if (this.type == "hslider") {
		this.setvalue(x / this.w);
	} else if (this.type == "vslider") {
		this.setvalue(y / this.h);
	} else if (this.type == "knob") {
		var tx = x - o.w/2;
    	var ty = y - o.h/2;
    	// get angle etc.
	}
}

Slider.prototype.draw = function(ctx) {
	if (this.type == "knob") {
		ctx.save();
		ctx.translate(this.x, this.y);
		
		//ctx.fillRect(-this.h, 0, this.h*this.value, this.w);
		
		var lineradius = this.radius * 0.25;
		ctx.lineWidth = lineradius * 2;
		
		ctx.strokeStyle ="#ccc";
		ctx.beginPath();
		ctx.arc(this.w/2, this.h/2, this.radius - lineradius, arcbase, arcbase + arcrange);
		ctx.stroke();
		ctx.strokeStyle ="#333";
		ctx.beginPath();
		ctx.arc(this.w/2, this.h/2, this.radius - lineradius, arcbase, arcbase + this.value * arcrange);
		ctx.stroke();
		
		if (this.name) {
			ctx.fillStyle ="#888";
			ctx.fillText(this.name, this.w/2, this.radius*1.75);
		}
		ctx.restore();
	} else if (this.type == "hslider") {
		var linewidth = this.h * 0.25;
		ctx.fillStyle ="#ccc";
		ctx.fillRect(this.x, this.y, this.w, this.h);
		ctx.fillStyle ="#333";
		ctx.fillRect(this.x, this.y, this.w*this.value, this.h);
		if (this.name) {
			ctx.fillStyle ="#888";
			ctx.fillText(this.name, this.x + this.w/2, this.y + this.h/2);
		}
	} else if (this.type == "vslider") {
		ctx.save();
		ctx.translate(this.x, this.y);
		ctx.rotate(Math.PI/-2);
		
		ctx.fillStyle ="#ccc";
		ctx.fillRect(-this.h, 0, this.h, this.w);
		ctx.fillStyle ="#333";
		ctx.fillRect(-this.h, 0, this.h*this.value, this.w);
		if (this.name) {
			ctx.fillStyle ="#888";
			ctx.fillText(this.name, -this.h/2, this.w/2);
		}
		
		ctx.restore();
	} else {
		ctx.strokeStyle ="#ddd";
		ctx.strokeRect(o.x, o.y, o.w, o.h);
	}
}

var Panel = function() {
	this.type = "panel";
	this.iscontainer = true;
	this.name = paramname();
	this.controls = [];
	// defaults:
	this.x = 0;
	this.y = 0;
	this.w = canvas.width;
	this.h = canvas.height;
	return this;
}

Panel.prototype.ondrag = function() {}

Panel.prototype.setvalue = function() {}

Panel.prototype.draw = function(ctx) {
	ctx.strokeStyle ="#ddd";
	ctx.strokeRect(this.x, this.y, this.w, this.h);
}

// derive new this.minw and this.minh
Panel.prototype.derive_min_size = function() {
	// first derive minimum sizes:
	this.minw = 0;
	this.minh = 0;
	for (i in this.controls) {
		var o = this.controls[i];
		if (o.iscontainer) {
			o.derive_min_size();
		} else {
			// vary by type?
			// have already built-in at constructor time?
			o.minw = 20;
			o.minh = 20;
		} 
		this.minw += o.minw;
		this.minh += o.minh;
	}
	return this;
}

// derive new this.w and this.h
Panel.prototype.derive_size = function() {
	var x = this.x + minpadding, y = this.y + minpadding;
	var innerw = (this.w - minpadding*(this.controls.length+1));
	var innerh = (this.h - minpadding*(this.controls.length+1));
	
	// TODO: decide layout (horizontal or vertical?)
	// depends on ratio of minw/minh
	// (and available space of this)
	
	var aspect = (this.minw*innerw)/(this.minh*innerh);
	var layout = aspect > 1 ? "horizontal" : "vertical";
	
	for (i in this.controls) {
		var o = this.controls[i];
		//console.log(i, o.iscontainer, o);
		if (layout == "horizontal") {		
			o.w = innerw * o.minw / this.minw;
			o.h = this.h - minpadding*2;
			o.x = x;
			o.y = y;
			x += minpadding + o.w;
		} else if (layout == "vertical") {
			o.w = this.w - minpadding*2;
			o.h = innerh * o.minh / this.minh;
			o.x = x;
			o.y = y;
			y += minpadding + o.h;
		}
		
		if (o.iscontainer) {
			o.derive_size();
		} else if (o.type == "slider") {
			var ratio = o.w / o.h;
			//console.log(i, o.w, o.h, ratio);
			if (ratio > 2) {
				o.type = "hslider";
			} else if (ratio < 0.5) {
				o.type = "vslider";
			} else {
				o.type = "knob";
				o.radius = Math.min(o.w, o.h) / 2;
			}
		}
	}
	return this;
}

// sets as root:
Panel.prototype.rebuild = function() {
	// combinable?
	
	//console.log("REBUILD", this.controls);
	
    this.derive_min_size();
    this.derive_size();
	ui_list = this.tolist([]);
	return this;
}

Panel.prototype.tolist = function(list) {
	list.push(this);
	for (i in this.controls) {
		var o = this.controls[i];
		if (o.iscontainer) {
			o.tolist(list);
		} else {
			list.push(o);
		}
	}
	return list;
}

Panel.prototype.add = function(o) {
	this.controls.push(o);	
	//console.log("added", this.controls);
	return o;
}

////////////////////////////////////////////////////////////////////////////////

ui = new Panel();
ui_list = [ ui ];

////////////////////////////////////////////////////////////////////////////////

var draw = function (timestamp) {
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
		for (i in ui_list) {
			ui_list[i].draw(ctx);
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

//fixes a problem where double clicking causes text to get selected on the canvas
canvas.addEventListener('selectstart', function(e) { e.preventDefault(); return false; }, false);

canvas.onmouseout = function(e) { 
	if (hover) { hover = null; dirty = true; }
};

canvas.onmousedown = function(e) {
    var mouse = getMouse(canvas, e.clientX, e.clientY);
    var mx = mouse.x;
    var my = mouse.y;
	var hit = hitTest(mouse.x, mouse.y);
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
};

canvas.addEventListener('mousewheel', function (e) {
	// get object under mouse:
	event.preventDefault(); 
	var mouse = getMouse(canvas, e.clientX, e.clientY);
    var mx = mouse.x;
    var my = mouse.y;
	var hit = hitTest(mouse.x, mouse.y);
	if (hit) {
		// don't change selection, just apply to target:
		var target = hit.target;
		target.setvalue(target.value + wheelinc * keymultiplier * e.wheelDelta);
		
		dirty = true;
	}
	return false; 
}, false);

canvas.addEventListener( "dblclick", function(e) {
    var mouse = getMouse(canvas, e.clientX, e.clientY);
    var mx = mouse.x;
    var my = mouse.y;
	var hit = hitTest(mouse.x, mouse.y);
	if (hit) {
		selection = hit.target;
		
		// jump directly to value
    	selection.ondblclick(hit.x, hit.y);
    	
		dirty = true;
	}
}, true);

// attach to window rather than canvas so that it still works outside
window.addEventListener( "mousemove", function (e) {
	var mouse = getMouse(canvas, e.clientX, e.clientY);
    if (mousedragging && selection){
    	var dx = mouse.x - dragstartx;
    	var dy = mouse.y - dragstarty;
    	
    	selection.ondrag(dx, dy);
    	
    	// reset dragstart for next event:
    	dragstartx = mouse.x;
    	dragstarty = mouse.y;
		dirty = true;
    } else {
    	// might want to handle mouseover condition:
    	var hit = hitTest(mouse.x, mouse.y);
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
}, true);

window.addEventListener( "mouseup", function(e) { mousedragging = false; }, true);

window.addEventListener( "keydown", function (e) {
	
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
					selection.setvalue(selection.value + keyinc * keymultiplier);
					dirty = true;
				}
				break; //Up/Right key
		
			case 37: 
			case 40: 
				if (selection) {
					selection.setvalue(selection.value - keyinc * keymultiplier);
					dirty = true;
				}
				break; //Left/Down key
			
			//default: console.log("keydown", e.keyCode); //Everything else
		}
	}
}, true);

window.addEventListener( "keyup", function (e) {
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
}, true);

// start rendering:
//setInterval(draw, 40);
window.requestAnimationFrame(draw);

////////////////////////////////////////////////////////////////////////////////

