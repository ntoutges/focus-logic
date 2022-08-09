import { Component, FocusWire, Gate, Buffer, Bit, Latch, IndicatorLED } from "./components.js";
import { MultiComponent } from "./componentsExt.js";

export class Block extends Component {
  constructor(functions) {
    super(functions);
    this.n = "Block";
}
  manifest(parent, x,y, active=true, eventParent=null) {
    if (!this.e) {
      this.e = document.createElement("div");
      this.e.setAttribute("class", "components blocks focusesIn atyp");
      parent.appendChild(this.e);
    }
    let thisOne = this;
    this.e.addEventListener("mouseup", function (e) { thisOne.focusInRelease.call(thisOne, e,this); });
    super.manifest(parent, x,y, active, eventParent);
  }
  clone() { return new Block(this.f); }
}

export class Wall extends Block {
  constructor(functions) {
    super(functions);
    this.n = "Wall";
    this.resizeOb = null;
    this.width = 1;
  }
  manifest(parent, x,y, active=true) {
    if (!this.e) {
      this.e = document.createElement("div");
      let longerButton = document.createElement("button");
      let shorterButton = document.createElement("button");

      this.e.setAttribute("class", "components walls focusesIn atyp");
      longerButton.setAttribute("class", "lengthButtons longerButtons");
      shorterButton.setAttribute("class", "lengthButtons shorterButtons");
      
      longerButton.innerText = ">";
      shorterButton.innerText = "<";

      longerButton.addEventListener("click", this.incWidth.bind(this, 1));
      shorterButton.addEventListener("click", this.incWidth.bind(this, -1));
      longerButton.addEventListener("mousedown", (e) => { e.stopPropagation(); });
      shorterButton.addEventListener("mousedown", (e) => { e.stopPropagation(); });

      parent.appendChild(this.e);
      this.e.appendChild(shorterButton);
      this.e.appendChild(longerButton);
    }
    super.manifest(parent, x,y, active);
  }
  incWidth(dir) {
    this.width += 1 * dir;
    if (this.width < 0) this.width = 0;
    const width = (this.width * 50) + 100;
    this.e.style.width = `${width}px`;
  }
  getWidth() { return this.width; }
  toSaveString(getComponentId) {
    let str = super.toSaveString(getComponentId);
    return `${str}${this.getDataString()}`;
  }
  getDataString() {
    let width = this.getWidth();
    return (width == 1) ? "" : `[[w=${width}]]`;
  }
  setData(data) {
    if ("w" in data) this.width = parseInt(data.w,10);
    this.incWidth(0); // update HTML width
  }
  clone() { return new Wall(this.f); }
}

export class ProtoDesk extends Block {
  constructor(functions) {
    super(functions);
    this.n = "Surface";
    this.dblClickFunction = null;
  }
  manifest(parent, x,y, active=true, eventParent=null) {
    if (!this.e) {
      this.e = document.createElement("div");
      this.e.setAttribute("class", "components protodesks focusesIn atyp"); // atypical focusesIn
      this.e.setAttribute("data-curved", "1");
      parent.appendChild(this.e);
    }
    this.e.addEventListener("dblclick", this.toggleDeskRadius.bind(this));
    super.manifest(parent, x,y, active, eventParent);
  }
  toggleDeskRadius() {
    if (this.dblClickFunction) {
      this.dblClickFunction.call(null, this);
      return;
    }
    let curved = this.e.getAttribute("data-curved") == "1";
    if (!curved) { this.e.setAttribute("data-curved", "1"); }
    else { this.e.setAttribute("data-curved", "0"); }
  }
  getCurved() { return this.e.getAttribute("data-curved") == "1"; }
  redirectDblClick(newFunction) {
    this.dblClickFunction = newFunction;
  }
  clone() { return new ProtoDesk(this.f); }
}

export class Label extends Block {
  constructor(functions) {
    super(functions);
    this.n = "Label";
    this.textBuffer = "";
    this.expand = true;
  }
  manifest(parent, x,y, active=true, eventParent=null) {
    if (!this.e) {
      this.e = document.createElement("div");
      this.e.setAttribute("class", "components labels");
      parent.appendChild(this.e);
    }
    let input = document.createElement("input");
    let widthGetter = document.createElement("div");
    let focusOut = document.createElement("div");
    
    input.setAttribute("class", "labelInputs");
    widthGetter.setAttribute("class", "widthGetters");
    focusOut.setAttribute("class", "focusesOut");
    
    if (active) { this.e.appendChild(input); }
    this.e.appendChild(widthGetter);
    this.e.appendChild(focusOut);
    
    focusOut.style.left = "calc(50% - 5px)";
    focusOut.style.bottom = "-5px";

    input.value = this.textBuffer;
    
    let thisOne = this;
    input.addEventListener("keydown", (e) => { e.stopPropagation(); });
    input.addEventListener("input", function() { thisOne.resizeInput.call(thisOne, this, widthGetter); });
    input.addEventListener("dblclick", function() { thisOne.changeExpansion.call(thisOne, this); });
    focusOut.addEventListener("mousedown", function (e) { thisOne.focusOutClick.call(thisOne, e,this); });
    focusOut.addEventListener("mouseup", function (e) { thisOne.focusOutRelease.call(thisOne, e,this); });
    
    super.manifest(parent, x,y, active, eventParent);
    
    this.nO1 = focusOut;

    if (this.expand)
      thisOne.resizeInput(input, widthGetter);
  }
  resizeInput(thisOne, widthGetter) {
    if (this.expand) { this.performExpansion(thisOne, widthGetter); }
    else {
      let newWidth = this.getWidth(widthGetter, thisOne.value);
      let newFontSize = Math.min( 24 * (50 / newWidth), 24);
      this.e.style.fontSize = newFontSize + "px";
    }
    this.move(0,0); // update wire positions
  }
  changeExpansion(thisOne) {
    this.expand = !this.expand;
    if (this.expand) { this.e.style.fontSize = ""; } // reset any resizing 
    else { this.e.style.width = ""; } // reset any expansion
    this.resizeInput(thisOne, this.e.querySelector(".widthGetters"));
  }
  performExpansion(thisOne, widthGetter) {
    let newWidth = this.getWidth(widthGetter, thisOne.value);
    this.e.style.width = (newWidth + 6) + "px";
  }
  getWidth(widthGetter, text) {
    widthGetter.innerText = text;
    widthGetter.innerHTML = widthGetter.innerHTML.replace(/ /g, "&nbsp")
    let width = widthGetter.offsetWidth;
    widthGetter.innerHTML = ""; // reset to reduce lag due to millions of (possible) characters
    return width;
  }
  setData(data) {
    if ("t" in data) {
      let text = data.t.replace(/&#91/g, "[").replace(/&#93/g, "]").replace(/&#61/g, "=").replace(/&#46/g, ".").replace(/&#44/g, ",").replace(/&#59/g, ";");
      this.textBuffer = text;
      if (this.e)
        this.e.querySelector("input").value = this.textBuffer;
    }
    if ("e"in data)
      this.expand = data.e == "1";
    if (this.e)
      this.resizeInput( this.e.querySelector("input"), this.e.querySelector(".widthGetters"));
  }
  getText() { return this.e.querySelector("input").value.replace(/\[/g, "&#91").replace(/\]/g, "&#93").replace(/=/g, "&#61").replace(/\./g, "&#46").replace(/,/g, "&#44").replace(/;/g, "&#59"); }
  getExpansion() { return this.expand; }
  clone() { return new Label(this.f); }
  toSaveString(getComponentId) {
    let str = super.toSaveString(getComponentId);
    return `${str}${this.getDataString()}`;
  }
  getDataString() {
    let text = this.getText();
    let expansion = (this.expand) ? "1" : "0";    
    return `[[t=${text}.e=${expansion}]]`;
  }
  setRotation(r, bypass=false) { // ignore any rotation settings -- make label *unpossible* to rotate
    if (bypass)
      super.setRotation(r);
  }
  setPos(x,y) { super.setPos(x,y); }
  move(x,y) {
    let rotation = this.r * Math.PI / 180;
    let newX = x*Math.cos(-rotation) + y*Math.sin(-rotation);
    let newY = y*Math.cos(rotation) + x*Math.sin(rotation);

    super.move(newX,newY);
  }
}

export class Chair extends Block {
  constructor(functions) {
      super(functions);
      this.n = "Chair";
  }
  manifest(parent, x,y, active=true, eventParent=null) {
    if (!this.e) {
        this.e = document.createElement("div");
        this.e.setAttribute("class", "components chairs");
        parent.appendChild(this.e);
    }
    let thisOne = this;

    super.manifest(parent, x,y, active, eventParent);
  }
  clone() { return new Chair(this.f); }
}

export class Desk extends MultiComponent {
  constructor(functions) {
    super(functions);
    this.n = "Desk";
    
    this.components.push( new ProtoDesk(this.f) );
    this.components.push( new Chair(this.f) );
    this.components.push( new Label(this.f) );
  }
  manifest(parent, x,y, active=true, eventParent=null, topParent=null) {
    if (!this.e) {
      this.e = document.createElement("div");
      this.e.setAttribute("class", "components desks");
      parent.appendChild(this.e);
    }
    
    let yOffset = -40;
    if (!active)
      yOffset = 40
    
    this.components[0].manifest(this.e, 0,0, active);
    this.components[1].manifest(this.e, 25,5, active);
    this.components[2].manifest(parent, x,y+yOffset, active, eventParent);
    this.components[0].setDragability(false);
    this.components[1].setDragability(false);
    
    let output = this.components[2];
    let input = this.components[0];
    let nodeOut = [output.get().querySelector(".focusesOut"), output];
    let nodeIn = [input.get(), input];
    let wire = new FocusWire(this.f);
    wire.connect(nodeOut, nodeIn);
    wire.manifest(topParent || parent); // manifest to [topParent], and if that does not exit, manifest to [parent]
    this.f.addWire(wire);
    
    super.manifest(parent, x,y, active, eventParent);
  }
  toggleDeskRadius() { this.components[0].toggleDeskRadius(); }
  getCurved() { return this.components[0].getCurved(); }
  redirectDblClick(newFunction) { this.components[0].redirectDblClick( newFunction.bind(null, this) ); }
  getLabel() { return this.components[2]; }
  move(x,y, updateWires=true) {
    this.components[2].move(x,y);
    super.move(x,y, updateWires);
  }
  setPos(x,y, updateWires=true) {
    let diffY = y - this.y;
    let diffX = x - this.x;
    this.move(diffX, diffY, updateWires);
  }
  setData(data) {
    let x = parseInt(data.x, 10);
    let y = parseInt(data.y, 10);
    this.components[2].setPos(x,y);
    this.components[2].setData(data);
  }
  globalSetPos(x,y) {
    this.components[2].globalSetPos(x,y);
    super.globalSetPos(x,y);
  }
  getCenter() { return { "x":25, "y":25 }; }
  clone() { return new Desk(this.f); }
  toSaveString(getComponentId) {
    let str = super.toSaveString(getComponentId);
    let superComp = str.substring(0, str.indexOf("<"));
    let components = str.substring(str.indexOf("<"));
    return `${superComp}${this.getDataString()}${components}`
  }
  getDataString() {
    let labelPos = this.components[2].getPos();
    let [x,y] = [Math.round(labelPos.x), Math.round(labelPos.y)]
    let text = this.components[2].getText();
    let expansion = this.components[2].getExpansion() ? "1" : "0";

    if (text != "")
      text = `.t=${text}`;
    if (expansion != "")
      expansion = `.e=${expansion}`;

    return `[[x=${x}.y=${y}${text}${expansion}]]`;
  }
}

export class Table extends MultiComponent { // note to future self - fix the wierd behaviour resulting from moving a label when the table is tilted // also, fix the left-over wires
  constructor(functions) {
    super(functions);
    this.n = "Table";
    this.saveData = { "w":2, "h":2 };
    this.updateTableSize(); // minimum size
  }
  manifest(parent, x,y, active=true) {
    if (!this.e) {
      this.e = document.createElement("div");
      this.e.setAttribute("class", "components tables");
      parent.appendChild(this.e);
    }
    
    this.e.style.width = (this.saveData.w*50) + "px";
    this.e.style.height = (this.saveData.h*50) + "px";
    
    if (active) {
      this.e.addEventListener("mouseenter", this.showControls.bind(this));
      this.e.addEventListener("mouseleave", this.hideControls.bind(this));

      // create table controls
      let controls = document.createElement("div");
      let widthControl = document.createElement("div");
      let heightControl = document.createElement("div");
      let incWidth = document.createElement("button");
      let decWidth = document.createElement("button");
      let incHeight = document.createElement("button");
      let decHeight = document.createElement("button");

      controls.setAttribute("class", "tableControls");
      widthControl.setAttribute("class", "tableWidths");
      heightControl.setAttribute("class", "tableHeights");
      incWidth.innerText = ">";
      incHeight.innerText = ">";
      decWidth.innerText = "<";
      decHeight.innerText = "<";

      this.e.appendChild(controls);
      controls.appendChild(widthControl);
      controls.appendChild(heightControl);
      widthControl.appendChild(decWidth);
      widthControl.appendChild(incWidth);
      heightControl.appendChild(decHeight);
      heightControl.appendChild(incHeight);

      controls.addEventListener("mousedown", (e) => { e.stopPropagation(); })
      incWidth.addEventListener("click", this.incWidth.bind(this,1));
      decWidth.addEventListener("click", this.incWidth.bind(this,-1));
      incHeight.addEventListener("click", this.incHeight.bind(this,1));
      decHeight.addEventListener("click", this.incHeight.bind(this,-1));
    }
    else
      this.setRotation(90); // rotate to look nicer

    let desksHolder = document.createElement("div");
    desksHolder.setAttribute("class", "desksHolder");
    this.e.appendChild(desksHolder);

    let noRotation = document.createElement("div");
    noRotation.setAttribute("class", "no-rotations");
    this.e.appendChild(noRotation);
    const absPos = this.e.querySelector(".no-rotations");
    absPos.style.width = (this.saveData.w*50) + "px";
    absPos.style.height = (this.saveData.h*50) + "px";

    this.manifestDesks(active);
    super.manifest(parent, x,y, active);
  }
  updateTableSize(oldWidth=null,oldHeight=null) {
    let oldTextW = []; // save text to transfer to resized table
    let oldTextH = []; // save text to transfer to resized table
    if (oldWidth && oldHeight) {
      let mul = 2;
      if (this.saveData.h <= 1)
        mul = 1;
      for (let i = 0; i < oldWidth*mul; i++)
        oldTextW.push( this.components[i].getLabel().getText() );
      for (let i = 0; i < (oldHeight-2)*2; i++)
        oldTextH.push( this.components[oldWidth*2 + i].getLabel().getText() );
    }
    this.components = []; // reset
    let mul = 2;
    if (this.saveData.h <= 1)
      mul = 1;
    for (let i = 0; i < this.saveData.w * mul; i++) {
      let rot = 0;
      if (i < this.saveData.w)
        rot = 270;
      else
        rot = 90;
      let desk = new Desk(this.f);
      this.components.push( desk );
      desk.setRotation(rot);

      let modI = i % this.saveData.w; // modified i, or modulo i
      if (modI < oldWidth) {
        modI += (i >= oldWidth) ? oldWidth : 0;
        if (modI in oldTextW)
          desk.getLabel().setData( {"t": oldTextW[modI]} );
      }
    }
    for (let i = 0; i < (this.saveData.h-2) * 2; i++) {
      let rot = 0;
      if (i < (this.saveData.h-2))
        rot = 180;
      else
        rot = 0;
      let desk = new Desk(this.f);
      this.components.push( desk );
      desk.setRotation(rot);

      let modI = i % (this.saveData.h-2); // modified i, or modulo i
      if (modI < oldHeight-2) {
        modI += (i >= oldHeight-2) ? oldHeight-2 : 0;
        // console.log(modI, i >= oldHeight, oldHeight)
        if (modI in oldTextH)
          desk.getLabel().setData( {"t": oldTextH[modI]} );
      }
    }
    if (this.e) {
      this.e.style.width = (this.saveData.w*50) + "px";
      this.e.style.height = (this.saveData.h*50) + "px";
      const absPos = this.e.querySelector(".no-rotations");
      if (absPos) {
        absPos.style.width = (this.saveData.w*50) + "px";
        absPos.style.height = (this.saveData.h*50) + "px";
      }
    }
  }
  manifestDesks(active) {
    const parent = this.e.parentNode;
    const absPos = this.e.querySelector(".no-rotations");
    
    // "unfold" components list
    let container = this.e.querySelector(".desksHolder");
    container.innerHTML = ""; // reset desks and Labels
    absPos.innerHTML = ""; // reset wires
    // [0,this.width*2) <- range for left-right desks
    let mul = 2;
    if (this.saveData.h <= 1)
      mul = 1;
    for (let i = 0; i < this.saveData.w; i++) {
      for (let j = 0; j < mul; j++) {
        let [left,top] = [i*50, j*(this.saveData.h-1)*50];
        let k = i + (j*this.saveData.w);
        this.components[k].manifest(container, left,top, active, parent,absPos);
        this.components[k].setDragability(false);
        this.components[k].toggleDeskRadius();
        this.components[k].redirectDblClick( this.rotateDesk.bind(this, i,j*(this.saveData.h-1)) );
      }
    }
    // [this.width*2, this.width*2 + this.height*2) <- range for top-bottom desks
    for (let i = 0; i < this.saveData.h-2; i++) {
      for (let j = 0; j < 2; j++) {
        let [left,top] = [j*(this.saveData.w-1)*50, (i+1)*50];
        let k = this.saveData.w*2 + i + (j*(this.saveData.h-2));
        this.components[k].manifest(container, left,top, active, parent,absPos);
        this.components[k].setDragability(false);
        this.components[k].toggleDeskRadius();
        this.components[k].redirectDblClick( this.rotateDesk.bind(this, j*(this.saveData.w-1), (i+1)) );
      }
    }
    if (this.e)
      this.addRotation(0); // update label rotation
  }
  rotateDesk(x,y, desk) { // advance rotation to one of all valid values
    let rots = [];
    if (x == this.saveData.w-1)
      rots.push(0);
    if (y == this.saveData.h-1)
      rots.push(90);
    if (x == 0)
      rots.push(180);
    if (y == 0)
      rots.push(270);
    
    let rot = desk.getRotation(false);
    let rotIndex = rots.indexOf(rot);
    
    if (rotIndex == -1)
      return;
    rotIndex = (rotIndex + 1) % rots.length;
    desk.setRotation( rots[rotIndex] ); // advance rotation
  }
  showControls(e) {
    if (!this.e)
      return;
    this.e.querySelector(".tableControls").style.display = "block";
  }
  hideControls(e) {
    if (!this.e)
      return;
    this.e.querySelector(".tableControls").style.display = ""; // reset to default value
  }
  incWidth(step) {
    let oldWidth = this.saveData.w;
    this.saveData.w += step;
    if (this.saveData.w < 1)
      this.saveData.w = 1;
    this.updateTableSize(oldWidth, this.saveData.h);
    this.manifestDesks();
  }
  incHeight(step) {
    let oldHeight = this.saveData.h
    this.saveData.h += step;
    if (this.saveData.h < 1)
      this.saveData.h = 1;
    this.updateTableSize(this.saveData.w, oldHeight);
    this.manifestDesks();
  }
  clone() { return new Table(this.f); }
  setRotation(r) {
    super.setRotation(r,false);
    for (let desk of this.components) {
      let label = desk.getLabel();
      label.setRotation(-r, true);
      setTimeout((desk) => {
        if (desk.e.parentNode) // ensure that desk still actually exists
          desk.move(0,0); // update wire positions
      }, 100, desk);
    }
    const absPos = this.e.querySelector(".no-rotations");
    if (absPos)
      absPos.style.transform = `rotate(${-r}deg)`;
  }
  setData(data) {
    let oldWidth = this.saveData.w;
    let oldHeight = this.saveData.h;
    let width = parseInt(data.w, 10) || 2;
    let height = parseInt(data.h, 10) || 2;

    this.saveData.w = width;
    this.saveData.h = height;

    if (oldWidth == width && oldHeight == height)
      return;
    this.updateTableSize(oldWidth, oldHeight);
    if (this.e)
      this.manifestDesks();
  }
}