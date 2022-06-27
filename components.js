export class Component {
  constructor(functions) {
    this.x = 0; // distance from left of container to left of component
    this.y = 0; // distance from top of container to top of component
    this.gX = 0;
    this.gY = 0;
    this.gS = false; // global pos set
    this.gF = null; // global pos getter override function
    this.r = 0; // measured in degrees
    this.e = null;
    this.d = false; // is dragging
    this.dM = false; // has been dragged
    this.dX = 0; // dragging x-value
    this.dY = 0; // dragging y-value
    this.f = functions; this.f["getGlobalPos"] = null;
    this.mL = []; // move list
    
    this.i = [];
    this.o1 = null;
    this.o2 = null;
    this.nO1 = null; // node for output 1
    this.nO2 = null; // node for output 2
    this.rI = null; // reference in
    this.rO = []; // reference out
    this.d = false;
    this.dg = true; // draggable
    this.data = null;

    this.inds = []; // indicators hooked up
    this.cb = []; // focus callbacks hooked up

    this.n = "Basic";
  }
  manifest(parent, x,y, active=true, eventParent=null) {
    if (!eventParent) { eventParent = parent; }
    if (!this.e) {
      this.e = document.createElement("div");
      this.e.setAttribute("class", "components basics");
      parent.appendChild(this.e);
    }
    
    if (x != null) { this.x = x; }
    if (y != null) { this.y = y; }
    this.move(0,0);
    this.addRotation(0);
    
    if (active) {
      let thisOne = this;
      this.e.addEventListener("mousedown", (e) => { thisOne.initDrag(e); });
      eventParent.addEventListener("mouseup", this.finishDrag.bind(thisOne) );
      eventParent.addEventListener("mousemove", (e) => { thisOne.performDrag(e); });
      this.e.addEventListener("componentinteract", (e) => { thisOne.triggerInteract(e); });
    }
  }
  initDrag(e) {
    if (this.dg) {
      e.stopPropagation();
      this.d = true;
      this.dX = e.pageX;
      this.dY = e.pageY;
      this.dM = false;
      this.e.style.zIndex = "11";
      if (this.f) { this.f.focusOn(this); }
    }
  }
  finishDrag() {
    if ("FD" in this.f && this.d) { this.f.FD(this) }
    this.d = false;
    if (this.e.style.zIndex != "99") // special case which is not reset
      this.e.style.zIndex = "";
  }
  performDrag(e) {
    if (this.d) {
      e.stopPropagation();
      this.move(e.pageX-this.dX, e.pageY-this.dY, false);
      this.dX = e.pageX;
      this.dY = e.pageY;
      this.dM = true;
      if ("PD" in this.f) // perform dragging
        this.f.PD(this);
      this.updateWires();
    }
  }
  triggerInteract(e) {} // placeholder to be defined by sub-classes
  setDragability(draggable) { this.dg = draggable; }
  getDragability() { return this.dg; }
  move(x,y, updateWires=true) {
    this.x += x;
    this.y += y;
    if (this.e) {
      this.e.style.left = (this.x + this.gX) + "px";
      this.e.style.top = (this.y + this.gY) + "px";
    }
    if (updateWires)
      this.updateWires();
  }
  updateWires() {
    let moveList = this.getMoveList();
    for (let toMove of moveList) {
      if (toMove[1].e.parentNode)
        toMove[0].call(toMove[1], this);
      else // element has fallen through the cracks, and must be removed
        this.removeFromMoveList(toMove[1]);
    }
  }
  setPos(x,y) {
    this.x = x;
    this.y = y;
    this.move(0,0); // don't move, but do run rendering code in 'move' function
  }
  initGlobalPos() {
    this.x -= this.gX;
    this.y -= this.gY;
    this.gS = true;
  }
  globalMovePos(x,y) {
    this.gX += x;
    this.gY += y;
    this.move(0,0,false); // this.move(0,0); // don't move, but do run rendering code in 'move' function (but don't try to re-render wires)
    if (!this.gS) { this.initGlobalPos(); }
  }
  globalSetPos(x,y) {
    this.gX = x;
    this.gY = y;
    this.move(0,0,false); // don't move, but do run rendering code in 'move' function
  }
  setRotation(rotation, updateWires=true) {
    if (rotation != undefined) { this.r = rotation; }
    if (this.e) { this.e.style.transform = "rotate(" + this.r + "deg)"; }
    let moveList = this.getMoveList();
    
    let intId = setInterval(() => { // constantly update as component animates
      if (updateWires)
        for (let toMove of moveList) {
          toMove[0].call(toMove[1], this);
        }
    }, 10);
    setTimeout(() => { clearInterval(intId) }, 100);
  }
  addRotation(rotation) { this.setRotation( rotation + this.getRotation(true), true ); }
  getPos() { return { "x": this.x, "y": this.y, "r": this.getRotation(true) }; }
  getGlobalPos() {
    if (this.gF != null)
      return this.gF();
    return { "x": this.gX, "y": this.gY };
  }
  rebindGlobalPos(globalPosGetter) {
    this.gF = globalPosGetter;
  }
  getRotation(full=false) {
    if (full)
      return this.r;
    let rot = this.r % 360;
    if (rot < 0) { rot += 360; } // keep 'this.r' positive
    return rot;
  }
  addToMoveList(func,thisOne) { this.mL.push([func,thisOne]); }
  removeFromMoveList(thisOne) {
    for (let i in this.mL) {
      if (this.mL[i][1] == thisOne) {
        this.mL.splice(i,1);
      }
    }
  }
  getMoveList() { return this.mL; }
  get() { return this.e; }
  getCenter() { return { "x":(this.e.offsetWidth/2), "y":(this.e.offsetHeight/2) } }
  getName() { return this.n; }
  getOutput() {
    this.onFocus();
    return this.o1; // default value
  }
  onFocus() {
    for (let i in this.cb) {
      this.cb[i][0].call(this.cb[i][1], this);
    }
  }
  setOutputs(outputs) {
    if ("true" in outputs) {
      this.o1 = outputs.true[0];
      this.nO1 = outputs.true[1];
    }
    if ("false" in outputs) {
      this.o2 = outputs.false[0];
      this.nO2 = outputs.false[1];
    }
  }
  getOutputs() {
    return {
      "true": this.o1,
      "false": this.o2,
      "reference": this.rO
    };
  }
  getOutputNode() { return this.nO1; } // default value
  getOutputNodes() {
    return {
      "true": this.nO1,
      "false": this.nO2
    }
  }
  removeClick(outputNode) {
    let elClone = outputNode.cloneNode();
    outputNode.parentNode.replaceChild(elClone, outputNode);
    return elClone;
  }
  unRemoveClick(outputNode, thisOne, mousedownFunction, mouseupFunction) {
    outputNode.addEventListener("mousedown", function (e) { mousedownFunction.call(thisOne, e, this); });
    outputNode.addEventListener("mouseup", function (e) { mouseupFunction.call(thisOne, e, this); });
    outputNode.removeAttribute("disabled");
  }
  setInput(wire) { this.i.push(wire); }
  getInputs() {
    return {
      focus: this.i,
      reference: this.rI
    }
  }
  setTrueOutput(wire) { this.o1= wire; }
  setFalseOutput(wire) { this.o2 = wire; }
  setReferenceInput(wire) { this.rI = wire; }
  setReferenceOutput(wire) {  this.rO.push(wire); }
  clone() { return new Component(this.f); }
  delete() {
    // deal with physical manifestation
    if (this.e) { this.e.remove(); }

    // deal with wired connections
    if (this.rI) { this.rI.delete(); }
    let refsOutCopy = this.rO.splice(0);
    for (let i in refsOutCopy) {
      let obj = refsOutCopy[i].getObjects().in;
      this.unRemoveClick( refsOutCopy[i].getNodes().in, obj, obj.refInClick, obj.refInRelease );
      refsOutCopy[i].delete();
    }
    if (this.o1) { this.o1.delete(); }
    if (this.o2) { this.o2.delete(); }
    
    let inputsCopy = this.i.splice(0);
    for (let i in inputsCopy) {
      let outObject = inputsCopy[i].getObjects().out;
      let outNode = inputsCopy[i].getNodes().out;
      outObject.unRemoveClick(outNode, outObject, outObject.focusOutClick, outObject.focusOutRelease);
      inputsCopy[i].delete.call(inputsCopy[i]);
    }
    this.i = [];
  }
  removeOutput(wire) {
    if (this.o1 == wire) {
      this.o1 = null;
      this.nO1 = wire.getNodes().out;
    }
    else if (this.o2 == wire) {
      this.o2 = null;
      this.nO2 = wire.getNodes().out;
    }
    this.removeFromMoveList(wire);
  }
  removeInput(wire) {
    for (let i in this.i) {
      if (this.i[i] == wire)
        this.i.splice(i,1);
    }
    this.removeFromMoveList(wire);
  }
  removeRefIn() {
    this.removeFromMoveList(this.rI);
    this.rI = null;
  }
  removeRefOut(wire) {
    for (let i in this.rO) {
      if (this.rO[i] == wire) {
        this.rO.splice(i,1);
        return;
      }
    }
    this.removeFromMoveList(wire);
  }
  attachIndicator(indicator) { this.inds.push(indicator); }
  detachIndicator(indicator) { for (let i in this.inds) { if (this.inds[i] == indicator) { this.inds.splice(i,1); } } }
  getData() { return this.data; }
  focusInClick(e,element) {
    e.stopPropagation();
    this.f.FIC(element,this); // Focus In Click
  }
  focusOutClick(e,element) {
    e.stopPropagation();
    this.f.FOC(element,this); // Focus Out Click
  }
  refInClick(e,element) {
    e.stopPropagation();
    this.f.RIC(element,this); // Reference In Click
  }
  refOutClick(e,element) {
    e.stopPropagation();
    this.f.ROC(element,this);
  }
  focusInRelease(e,element) { this.f.FIR(element,this); }
  focusOutRelease(e,element) { this.f.FOR(element,this); }
  refInRelease(e,element) { this.f.RIR(element,this); }
  refOutRelease(e,element) { this.f.ROR(element,this); }
  addFocusEventListener(callback, thisOne) { this.cb.push([callback, thisOne]); }
  removeFocusEventListener(thisOne) {
    for (let i in this.cb) { if (this.cb[i][1] == thisOne) { this.cb.splice(i,1); return; } }
  }
  toSaveString(getComponentId) { // component id is really just its index
    let name = this.getName();
    let pos = this.getPos();
    let [x,y,r] = [Math.round(pos.x), Math.round(pos.y), Math.round(this.getRotation())];    
    let references = this.getReferences(getComponentId);
    let io = this.getIO(getComponentId);
    let rot = "";
    if (r != 0)
      rot = `;${r}`;
    return `${name}(${x};${y}${rot})[${references}]-${io}`;
  }
  getReferences(getComponentId, extraComponents=[]) {
    let outObjects = this.getOutputs();
    let references = [];
    for (let reference of outObjects.reference) {
      let index = getComponentId( reference.getObjects().in, extraComponents );
      if (index != -1) { references.push(index); }
    }
    return references.join(";");
  }
  getIO(getComponentId, extraComponents=[]) {
    let str = "";
    let outObjects = this.getOutputs();
    if (outObjects.true) {
      let index = getComponentId( outObjects.true.getObjects().in, extraComponents );
      let inNode = outObjects.true.getNodes().in;
      let indexType = ""; // unset by default
      if (inNode.getAttribute("data-type") == "set") { indexType = "s" } // set
      else if (inNode.getAttribute("data-type") == "reset") { indexType = "r"; } // reset
      if (index != -1) { str += index + indexType; }
    }
    str += ":";
    if (outObjects.false) {
      let index = getComponentId( outObjects.false.getObjects().in );
      let inNode = outObjects.false.getNodes().in;
      let indexType = ""; // unset by default
      if (inNode.getAttribute("data-type") == "set") { indexType = "s" } // set
      else if (inNode.getAttribute("data-type") == "reset") { indexType = "r"; } // reset
      if (index != -1) { str += index + indexType; }
    }
    return str;
  }
  getDataString() { return ""; } // default
}

export class Wire extends Component {
  constructor(functions) {
    super(functions)
    this.nO = null; // node out
    this.nI = null; // node in
    this.oO = null; // object out
    this.oI = null; // object in
    this.n = "Wire";
  }
  manifest(parent) {
    if (!this.e) {
      this.e = document.createElement("div");
      this.e.setAttribute("class", "components wires");
      this.calculateMeasures(parent);
      
      this.oO.addToMoveList(this.updatePos,this);
      this.oI.addToMoveList(this.updatePos,this);
      
      parent.appendChild(this.e);
    }
    super.manifest(parent);
  }
  calculateMeasures(parent) {
    let bOut = this.nO.getBoundingClientRect();
    let bIn = this.nI.getBoundingClientRect();
    let bParent = parent.getBoundingClientRect();
    
    let globalPos = this.oO.getGlobalPos();

    // "c" stands for centered, but corrected also works in this context
    let cbOut = { top:(bOut.top + bOut.height/2), left:(bOut.left + bOut.width/2) };
    let cbIn = { top:(bIn.top + bIn.height/2), left:(bIn.left + bIn.width/2) }
    
    let rotation = Math.atan( (cbIn.top - cbOut.top) / (cbIn.left - cbOut.left) );
    let yOff = cbOut.top - bParent.top;
    let xOff = cbOut.left - bParent.left;
    let width = Math.sqrt( Math.pow(cbOut.left - cbIn.left, 2) + Math.pow(cbOut.top - cbIn.top, 2) );
    
    if (cbOut.left > cbIn.left)
      rotation += Math.PI;
    
    this.x = xOff - globalPos.x;
    this.y = yOff - globalPos.y;
    this.gX = globalPos.x;
    this.gY = globalPos.y;
    this.r = rotation*180 / Math.PI;

    this.e.style.transform = "rotate(" + rotation + "rad)";
    this.e.style.width = width + "px";
  }
  updatePos() {
    this.calculateMeasures(this.e.parentNode);
    this.move(0,0);
  }
  connect(nodeOut, nodeIn) {
    this.nO = nodeOut[0];
    this.nI = nodeIn[0];
    this.oO = nodeOut[1];
    this.oI = nodeIn[1];
    
    this.updateComponents();
  }
  updateComponents() {
    this.nO = this.oO.removeClick(this.nO);
    this.nO.setAttribute("disabled", "1");
    if (this.nO.getAttribute("data-type") == "false") { this.oO.setFalseOutput(this); }
    else { this.oO.setTrueOutput(this); }
    this.oI.setInput(this);
  }
  getOutput() {
    this.onFocus();
    return this.oI;
  }
  getNodes() {
    return {
      "in": this.nI,
      "out": this.nO 
    };
  }
  getObjects() {
    return {
      "in": this.oI,
      "out": this.oO
    }
  }
  clone() { return new Wire(this.f); }
  delete(skip=false) {
    if (!skip) {
      this.oO.removeOutput(this);
      this.oI.removeInput(this);
    }
    super.delete();
  }
}

export class FocusWire extends Wire {
  constructor(functions) {
    super(functions);
    this.n = "Focus Wire";
  }
  manifest(parent) {
    super.manifest(parent);
    this.e.classList.add("focus");
  }
  clone() { return new FocusWire(this.f); }
}

export class ReferenceWire extends Wire {
  constructor(functions) {
    super(functions);
    this.n = "Reference Wire";
  }
  manifest(parent) {
    super.manifest(parent);
    this.e.classList.add("reference");
  }
  updateComponents() {
    this.nI = this.oI.removeClick(this.nI);
    this.nI.setAttribute("disabled", "1");
    this.oO.setReferenceOutput(this);
    this.oI.setReferenceInput(this);
  }
  clone() { return new ReferenceWire(this.f); }
  delete() {
    this.oO.removeRefOut(this);
    this.oI.removeRefIn();
    super.delete(true);
  }
}

export class Gate extends Component {
  constructor(functions) {
    super(functions);
    this.n = "Gate";
  }
  manifest(parent, x,y, active=true, eventParent=null) {
    if (!this.e) {
      this.e = document.createElement("div");
      this.e.setAttribute("class", "components gates");
      parent.appendChild(this.e);
    }
    let focusIn = document.createElement("div");
    let focusTrueOut = document.createElement("div");
    let focusFalseOut = document.createElement("div");
    let refIn = document.createElement("div");
    
    focusIn.setAttribute("class", "focusesIn");
    focusTrueOut.setAttribute("class", "focusesOut");
    focusTrueOut.setAttribute("data-type", "true");
    focusFalseOut.setAttribute("class", "focusesOut");
    focusFalseOut.setAttribute("data-type", "false");
    refIn.setAttribute("class", "referencesIn");
    
    focusIn.style.left = "-5px";
    focusIn.style.top = "2px";
    focusTrueOut.style.right = "-5px";
    focusTrueOut.style.top = "7.5px";
    focusFalseOut.style.left = "8px";
    focusFalseOut.style.top = "-5px";
    refIn.style.left = "-5px";
    refIn.style.bottom = "2px";
    
    if (active) {
      let thisOne = this;
      focusIn.addEventListener("mousedown", function (e) { thisOne.focusInClick.call(thisOne, e, this); });
      focusTrueOut.addEventListener("mousedown", function (e) { thisOne.focusOutClick.call(thisOne, e, this); });
      focusFalseOut.addEventListener("mousedown", function (e) { thisOne.focusOutClick.call(thisOne, e, this); });
      refIn.addEventListener("mousedown", function (e) { thisOne.refInClick.call(thisOne, e, this); });
      focusIn.addEventListener("mouseup", function (e) { thisOne.focusInRelease.call(thisOne, e, this); });
      focusTrueOut.addEventListener("mouseup", function (e) { thisOne.focusOutRelease.call(thisOne, e, this); });
      focusFalseOut.addEventListener("mouseup", function (e) { thisOne.focusOutRelease.call(thisOne, e, this); });
      refIn.addEventListener("mouseup", function (e) { thisOne.refInRelease.call(thisOne, e, this); });
    }
    
    this.nO1 = focusTrueOut;
    this.nO2 = focusFalseOut;
    
    this.e.appendChild(focusIn);
    this.e.appendChild(focusTrueOut);
    this.e.appendChild(focusFalseOut);
    this.e.appendChild(refIn);
    
    super.manifest(parent, x,y, active, eventParent);
  }
  getOutput() {
    this.onFocus();
    let referenceWire = this.rI;
    if (!referenceWire) { // if reference wire not plugged in, this will give a random output
      if (Math.random() > 0.5) { return this.o1; }
      else { return this.o2; }
    }
    let referencedComponent = referenceWire.oO;
    let data = referencedComponent.getData();
    if (data) { return this.o1; }
    else { return this.o2; }
  }
  getOutputNode() {
    let referenceWire = this.rI;
    if (!referenceWire) { // if reference wire not plugged in, this will give a random output
      if (Math.random() > 0.5) { return this.nO1; }
      else { return this.nO2; }
    }
    let referencedComponent = referenceWire.oO;
    let data = referencedComponent.getData();
    if (data) { return this.nO1; }
    else { return this.nO2; }
  }
  clone() { return new Gate(this.f); }
}

export class Buffer extends Component {
  constructor(functions) {
    super(functions);
    this.n = "Buffer";
  };
  manifest(parent, x,y, active=true, eventParent=null) {
    if (!this.e) {
      this.e = document.createElement("div");
      this.e.setAttribute("class", "components buffers");
      parent.appendChild(this.e);
      let shape = document.createElement("div");
      shape.setAttribute("class", "triangles");
      this.e.appendChild(shape);
    }

    let focusIn = document.createElement("div");
    let focusOut = document.createElement("div");

    focusIn.setAttribute("class", "focusesIn");
    focusOut.setAttribute("class", "focusesOut");

    focusIn.style.left = "-5px";
    focusIn.style.top = "10px";
    focusOut.style.right = "-5px";
    focusOut.style.top = "10px";

    let thisOne = this;
    focusIn.addEventListener("mousedown", function (e) { thisOne.focusInClick.call(thisOne, e,this); });
    focusOut.addEventListener("mousedown", function (e) { thisOne.focusOutClick.call(thisOne, e,this); });
    focusIn.addEventListener("mouseup", function (e) { thisOne.focusInRelease.call(thisOne, e,this); });
    focusOut.addEventListener("mouseup", function (e) { thisOne.focusOutRelease.call(thisOne, e,this); });

    this.nO1 = focusOut;

    this.e.appendChild(focusIn);
    this.e.appendChild(focusOut);

    super.manifest(parent, x,y, active, eventParent);
  }
  clone() {
    return new Buffer(this.f);
  }
}

export class Light extends Buffer {
  constructor(functions) {
    super(functions);
    this.n = "Light";
  }
  manifest(parent, x,y, active=true, eventParent=null) {
    super.manifest(parent, x,y, active, eventParent);

    let light = document.createElement("div");
    light.setAttribute("class", "lights");
    light.setAttribute("data-lighted", "0")
    light.style.left = "11px";
    light.style.top = "11px";

    this.e.appendChild(light);
  }
  getOutput() {
    this.onFocus();
    let light = this.e.querySelector(".lights");
    light.setAttribute("data-lighted", "1");
    light.style.left = "0px";
    light.style.top = "0px";
    setTimeout(() => {
      light.setAttribute("data-lighted", "0")
      light.style.left = "11px";
      light.style.top = "11px";
    }, 500);
    return super.getOutput();
  }
  clone() {
    return new Light(this.f);
  }
}

export class Timer extends Buffer {
  constructor(functions) {
    super(functions);
    this.n = "Timer";
    this.delay = 1000; // 1000ms (1 second) delay
  }
  manifest(parent, x,y, active=true, eventParent=null) {
    if (!this.e) {
      this.e = document.createElement("div");
      this.e.setAttribute("class", "components timers");
      parent.appendChild(this.e);
    }
    let timeSlider = document.createElement("input");
    let timeNumber = document.createElement("div");

    timeSlider.setAttribute("class", "timerInputs");
    timeSlider.setAttribute("type", "range");
    timeSlider.setAttribute("min", "500");
    timeSlider.setAttribute("max", "5000");
    timeSlider.setAttribute("step", "500");
    timeSlider.value = "1000";
    timeNumber.setAttribute("class", "timeNumbers");

    timeSlider.style.left = "0px";
    timeSlider.style.top = "10px";
    timeNumber.style.left = "0px";
    timeNumber.style.top = "5px";

    let thisOne = this;
    timeSlider.addEventListener("mousedown", (e) => { e.stopPropagation(); });
    timeSlider.addEventListener("input", function() { thisOne.changeDelay.call(thisOne, this); });
    this.e.addEventListener("dblclick", function() { thisOne.toggleVisibility.call(thisOne, this); });
    // this.e.addEventListener("mouseout", function() { this.removeAttribute("data-show"); })

    this.e.appendChild(timeSlider);
    this.e.appendChild(timeNumber);
    this.setTimeNumber();

    super.manifest(parent, x,y, active, eventParent)
  }
  triggerInteract(e) {
    this.toggleVisibility(this.e);
  }
  changeDelay(element) {
    this.delay = parseInt(element.value);
    this.setTimeNumber();
  }
  setData(data) { // generalized method name
    this.delay = parseInt(data.d, 10);
    if (this.e) {
      this.e.querySelector(".timerInputs").value = this.delay;
      this.setTimeNumber();
    }
  }
  toggleVisibility(element) {
    if (element.getAttribute("data-show")) { element.removeAttribute("data-show"); }
    else { element.setAttribute("data-show", "1"); }
  }
  setTimeNumber() {
    if (this.e) { this.e.querySelector(".timeNumbers").innerText = ( Math.round(this.delay/100) / 10 ) + "s"; }
  }
  getDelay() { return this.delay; }
  clone() {
    return new Timer(this.f);
  }
  toSaveString(getComponentId) {
    let str = super.toSaveString(getComponentId);
    return `${str}${this.getDataString()}`;
  }
  getDataString() {
    let delay = this.delay;
    return `[[d=${delay}]]`;
  }
}

export class Delay extends Timer {
  constructor(functions) {
    super(functions);
    this.n = "Delay";
    this.delay = 1;
  }
  manifest(parent, x,y, active, eventParent) {
    super.manifest(parent, x,y, active, eventParent);
    let timeSlider = this.e.querySelector(".timerInputs");
    timeSlider.setAttribute("min", "1");
    timeSlider.setAttribute("max", "10");
    timeSlider.setAttribute("step", "1");
    timeSlider.value = "1";
    
    this.setTimeNumber();
  }
  getDelay(defaultDelay) { // timer multiplies by current [defaultDelay]
    return (this.delay - 1) * defaultDelay; // delay of 1 will cause no extra delay
  }
  setTimeNumber() {
    if (this.e)
      this.e.querySelector(".timeNumbers").innerText = "x" + this.delay;
  }
  clone() { return new Delay(this.f); }
}

export class Bit extends Component {
  constructor (functions) {
    super(functions);
    this.n = "Bit";
    this.data = false;
  }
  manifest(parent, x,y, active=true, eventParent=null) {
    if (!this.e) {
      this.e = document.createElement("div");
      this.e.setAttribute("class", "components bits");
      this.e.setAttribute("data-on", "0")
      parent.appendChild(this.e);
    }
    
    let focusInSet = document.createElement("div");
    let focusInReset = document.createElement("div");
    let focusOut = document.createElement("div");
    let refOut = document.createElement("div");
    
    focusInSet.setAttribute("class", "focusesIn");
    focusInSet.setAttribute("data-type", "set");
    focusInReset.setAttribute("class", "focusesIn");
    focusInReset.setAttribute("data-type", "reset");
    focusOut.setAttribute("class", "focusesOut");
    refOut.setAttribute("class", "referencesOut");
    
    focusInSet.style.right = "5px";
    focusInSet.style.top = "-5px";
    focusInReset.style.left = "5px";
    focusInReset.style.top = "-5px";
    focusOut.style.right = "20px";
    focusOut.style.bottom = "-5px";
    refOut.style.left = "20px";
    refOut.style.bottom = "-5px";
    
    if (active) {
      let thisOne = this;
      focusInSet.addEventListener("mousedown", function (e) { thisOne.focusInClick.call(thisOne, e,this); });
      focusInReset.addEventListener("mousedown", function (e) { thisOne.focusInClick.call(thisOne, e,this); });
      focusOut.addEventListener("mousedown", function (e) { thisOne.focusOutClick.call(thisOne, e,this); });
      refOut.addEventListener("mousedown", function (e) { thisOne.refOutClick.call(thisOne, e,this); });
      focusInSet.addEventListener("mouseup", function (e) { thisOne.focusInRelease.call(thisOne, e,this); });
      focusInReset.addEventListener("mouseup", function (e) { thisOne.focusInRelease.call(thisOne, e,this); });
      focusOut.addEventListener("mouseup", function (e) { thisOne.focusOutRelease.call(thisOne, e,this); });
      refOut.addEventListener("mouseup", function (e) { thisOne.refOutRelease.call(thisOne, e,this); });
      this.e.addEventListener("dblclick", thisOne.toggleData.bind(thisOne));
    }

    this.nO1 = focusOut;
    
    this.e.appendChild(focusInSet);
    this.e.appendChild(focusInReset);
    this.e.appendChild(focusOut);
    this.e.appendChild(refOut);
    
    super.manifest(parent, x,y, active, eventParent);
  }
  triggerInteract(e) {
    this.toggleData(this.e);
  }
  setData() {
    this.data = true;
    if (this.e) { this.e.setAttribute("data-on", "1"); }
    for (let i in this.inds) { this.inds[i].turnOn.call(this.inds[i]); }
  }
  resetData() {
    this.data = false;
    if (this.e) { this.e.setAttribute("data-on", "0"); }
    for (let i in this.inds) { this.inds[i].turnOff.call(this.inds[i]); }
  }
  toggleData() {
    if (this.data) { this.resetData(); }
    else { this.setData(); }
  }
  getOutput(wire, skip=false) {
    if (!skip) {
      this.onFocus();
      let node = wire.getNodes().in;
      if (node.getAttribute("data-type") == "set") {
        this.setData();
      }
      else { this.resetData(); }
    }
    return super.getOutput(wire);
  }
  clone() { return new Bit(this.f); }
}

export class Latch extends Bit {
  constructor(functions) {
    super(functions);
    this.n = "Latch";
  }
  manifest(parent, x,y, active=true, eventParent=null) {
    super.manifest(parent, x,y, active, eventParent);
    this.e.setAttribute("class", "components latches");
    this.e.querySelector(".focusesIn").remove(); // remove extra input
    
    let oldFocusIn = this.e.querySelector(".focusesIn");
    let focusIn = oldFocusIn.cloneNode();
    this.e.replaceChild(focusIn, oldFocusIn);
    let refIn = document.createElement("div");

    refIn.setAttribute("class", "referencesIn");

    focusIn.style.left = "unset";
    focusIn.style.right = "20px";
    refIn.style.left = "20px";
    refIn.style.top = "-5px";

    this.e.appendChild(refIn);

    let thisOne = this;
    focusIn.addEventListener("mousedown", function (e) { thisOne.focusInClick.call(thisOne, e,this); });
    refIn.addEventListener("mousedown", function (e) { thisOne.refInClick.call(thisOne, e,this); });
    focusIn.addEventListener("mouseup", function (e) { thisOne.focusInRelease.call(thisOne, e,this); });
    refIn.addEventListener("mouseup", function (e) { thisOne.refInRelease.call(thisOne, e,this); });
  }
  getOutput(wire) {
    this.onFocus();
    this.setData();
    return super.getOutput(wire, true);
  }
  setData() {
    let referenceWire = this.rI;
    if (!referenceWire) { // if reference wire not plugged in, this will give a random output
      if (Math.random() > 0.333333) { super.setData(); } // 2/3 chance of setting to a "1", vs the 1/2 of a gate
      else { super.resetData(); }
    }
    else {
      let referencedComponent = referenceWire.oO;
      let data = referencedComponent.getData();
      if (data) { super.setData(); }
      else { super.resetData(); }
    }
  }
  toggleData() {
    if (this.data) { super.resetData(); }
    else { super.setData(); }
  }
  clone() {
    return new Latch(this.f);
  }
}

export class IndicatorLED extends Component { // TODO: add deletion method to remove this object from bit
  constructor(functions) {
    super(functions);
    this.n = "LED";
  }
  manifest(parent, x,y, active=true, eventParent=null) {
    if (!this.e) {
      this.e = document.createElement("div");
      this.e.setAttribute("class", "components indicatorLEDs");
      this.e.setAttribute("lighted", "0");
      parent.appendChild(this.e);
      if (!active) { this.turnOn(); }
    }
    let referencesIn = document.createElement("div");
    let referencesOut = document.createElement("div");
    referencesIn.setAttribute("class", "referencesIn");
    referencesOut.setAttribute("class", "referencesOut");

    referencesIn.style.left = "10px";
    referencesIn.style.top = "-5px";
    referencesOut.style.left = "10px";
    referencesOut.style.bottom = "-5px";

    let thisOne = this;
    referencesIn.addEventListener("mousedown", function (e) { thisOne.refInClick.call(thisOne, e,this); });
    referencesIn.addEventListener("mouseup", function (e) { thisOne.refInRelease.call(thisOne, e,this); });
    referencesOut.addEventListener("mousedown", function (e) { thisOne.refOutClick.call(thisOne, e,this); });
    referencesOut.addEventListener("mouseup", function (e) { thisOne.refOutRelease.call(thisOne, e,this); });

    this.e.appendChild(referencesIn);
    this.e.appendChild(referencesOut);
    super.manifest(parent, x,y, active, eventParent);
  }
  turnOn() {
    if (this.data) { return; } // help to prevent infinite recursion
    if (this.e) { this.e.setAttribute("lighted", "1"); }
    this.data = true;
    for (let i in this.inds) { this.inds[i].turnOn(); }
  }
  turnOff() {
    if (!this.data) { return; } // help to prevent infinite recursion
    if (this.e) { this.e.setAttribute("lighted", "0"); }
    this.data = false;
    for (let i in this.inds) { this.inds[i].turnOff(); }
  }
  clone() {
    return new IndicatorLED(this.f);
  }
  delete() {
    if (this.rI) {
      let outNode = this.rI.getNodes().out;
      let outObject = this.rI.getObjects().out;
      outObject.unRemoveClick(outNode, outObject, outObject.refOutClick, outObject.refOutRelease);
    }
    super.delete();
  }
}

export class Start extends Component {
  constructor(functions) {
    super(functions);
    this.n = "Start";
  }
  manifest(parent, x,y, active, eventParent=null) {
    if (!this.e) {
      this.e = document.createElement("div");
      this.e.setAttribute("class", "components starts");
      parent.appendChild(this.e);
    }
    
    let focusOut = document.createElement("div");
    let startButton = document.createElement("div");
    
    focusOut.setAttribute("class", "focusesOut");
    startButton.setAttribute("class", "startButtons");
    
    focusOut.style.left = "10px";
    focusOut.style.bottom = "-5px";
    startButton.style.left = "7.5px";
    startButton.style.top = "6px";

    let thisOne = this;
    focusOut.addEventListener("mousedown", function (e) { thisOne.focusOutClick.call(thisOne, e,this); });
    focusOut.addEventListener("mouseup", function(e) { thisOne.focusOutRelease.call(thisOne, e,this); });
    startButton.addEventListener("click", function (e) { thisOne.startClick.call(thisOne, e,this); });
    
    this.nO1 = focusOut;
    
    this.e.appendChild(focusOut);
    this.e.appendChild(startButton);
    
    super.manifest(parent, x,y, active, eventParent);
  }
  triggerInteract(e) {
    let startButton = this.e.querySelector(".startButtons");
    this.startClick(e,startButton, true); // 'true' forces [startClick] to run, no matter what
  }
  startClick(e,element, force=false) {
    if (!this.dM || force) {
      element.setAttribute("data-pressed", "1");
      this.f.play(this);
      setTimeout(() => { element.removeAttribute("data-pressed"); }, 100);
    }
  }
  clone() { return new Start(this.f); }
}

export class Interactor extends Component {
  constructor(functions) {
    super(functions);
    this.n = "Actor";
    this.targetX = 0;
    this.targetY = 0;
    this.timeouts = [];
  }
  manifest(parent, x,y, active) {
    if (!this.e) {
      this.e = document.createElement("div");
      this.e.setAttribute("class", "components interactors");
      parent.appendChild(this.e);
    }
    let target = document.createElement("div");
    let body = document.createElement("div");
    let focusIn = document.createElement("div");
    let focusOut = document.createElement("div");

    target.setAttribute("class", "targets");
    body.setAttribute("class", "actor_bodies");
    focusIn.setAttribute("class", "focusesIn");
    focusOut.setAttribute("class", "focusesOut")

    focusIn.style.left = "7px";
    focusIn.style.top = "-5px";
    focusOut.style.left = "7px";
    focusOut.style.bottom = "-5px";

    this.e.appendChild(target);
    this.e.appendChild(body);
    body.appendChild(focusIn);
    body.appendChild(focusOut);

    let thisOne = this;
    focusIn.addEventListener("mousedown", function (e) { thisOne.focusInClick.call(thisOne, e,this); });
    focusOut.addEventListener("mousedown", function (e) { thisOne.focusOutClick.call(thisOne, e,this); });
    focusIn.addEventListener("mouseup", function (e) { thisOne.focusInRelease.call(thisOne, e,this); });
    focusOut.addEventListener("mouseup", function (e) { thisOne.focusOutRelease.call(thisOne, e,this); });

    this.nO1 = focusOut;

    super.manifest(parent, x,y, active);
  }
  move(x,y, updateWires=true) { // calculate new target (x,y) pos
    super.move(x,y, updateWires);
    this.calculateTargetPos();
  }
  calculateTargetPos() {
    const radius = 18; // (16px + 32px) - (60px / 2) = 18
    const center = this.getCenter();
    
    let pos = this.getPos();
    pos.x += center.x;
    pos.y += center.y;

    let rot = -this.getRotation() * Math.PI / 180; // given in degrees and converted to radians // negative because this measures rotation as clockwise, not counterclockwise (as Math expects)
    let rotModifierX = radius * Math.cos(rot);
    let rotModifierY = radius * Math.sin(rot);
    
    this.targetX = pos.x + rotModifierX;
    this.targetY = pos.y - rotModifierY;
  }
  getOutput() {
    this.triggerEvent();
    return super.getOutput();
  }
  triggerEvent() {
    // adjust target pos for global positioning
    let targetX = this.targetX + this.gX;
    let targetY = this.targetY + this.gY;
    let thisOne = this;
    let elements = document.elementsFromPoint(targetX, targetY);
    
    const interact = new CustomEvent("componentinteract", {
      detail: {
        "x": targetX,
        "y": targetY,
        "trigger": thisOne,
        "stack": elements
      }
    });
    for (let node of elements) {
      if (!node.classList.contains("components") || node == this.e)
        continue;
      node.dispatchEvent(interact);
    }

    for (let timeoutId in this.timeouts) { clearTimeout(timeoutId); }
    this.timeouts = []; // reset

    this.e.style.opacity = "0";
    this.timeouts.push( setTimeout(() => {
      this.e.style.transitionDuration = "500ms";
      this.e.style.opacity = "1";
    }, 10) );
    this.timeouts.push( setTimeout(() => {
      this.e.style.transitionDuration = "";
    }, 500) );
  }
  clone() { return new Interactor(this.f); }
}
