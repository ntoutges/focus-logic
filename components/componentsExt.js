import { Component, FocusWire, Gate, Buffer, Bit, Latch, IndicatorLED } from "./components.js";

// these classes will have no logic connections of their own
export class MultiComponent extends Component {
  constructor(functions) {
    super(functions);
    this.n = "Basic";
    this.components = [];
    this.saveData = {};
  }
  manifest(parent, x,y, active=true) {
    if (!this.e) {
      this.e = document.createElement("div");
      this.e.setAttribute("class", "components multiBasics");
      parent.appendChild(this.e);
    }
    
    for (let component of this.components) {
      component.rebindGlobalPos( this.getGlobalPos.bind(this) );
    }

    super.manifest(parent, x,y, active);
    
  }
  getComponents() { return this.components; }
  clone() { return new MultiComponent(this.f); }
  toSaveString(getComponentId) {
    let name = this.getName();
    let pos = this.getPos();
    let x = Math.round( pos.x, 10 );
    let y = Math.round( pos.y, 10 );
    let conns = [];
    for (let component of this.components) {
      let references = component.getReferences(getComponentId, this.components);
      let io = component.getIO(getComponentId, this.components);
      let dataString = component.getDataString();
      conns.push(`[${references}]-${io}${dataString}`);
    }
    conns = conns.join(";");
    let rot = "";
    let data = "";
    if (this.r != 0)
      rot = `;${this.r}`;
    if (Object.keys( this.saveData ).length > 0) {
      let d = [];
      for (let i in this.saveData) {
        let val = this.saveData[i];
        d.push( `${i}=${val}` )
      }
      data = "[[" + d.join(".") + "]]";
    }
    return `${name}(${x};${y}${rot})${data}<${conns}>`;
  }
  delete() {
    for (let component of this.components) { component.delete(); }
    super.delete();
  }
  getMoveList() {
    let moveList = [];
    for (let component of this.components) { moveList = moveList.concat(component.getMoveList()); }
    return moveList;
  }
}

export class Digit extends MultiComponent {
  constructor(functions) {
    super(functions);
    this.n = "Digit";

    for (let i = 0; i < 4; i++) { // add 4 latches // data storage
      let latch = new Latch(this.f);
      this.components.push(latch);
      latch.attachIndicator(this); // used to update digit display
    }
    for (let i = 0; i < 2; i++) { this.components.push( new Buffer(this.f) ); } // I/O

    const pos = [[0,0],[0,30],[0,60],[0,90],[65,0,90],[65,90,90]];
    for (let i in this.components) {
      this.components[i].setDragability(false);
      this.components[i].setPos(pos[i][0], pos[i][1]);
      this.components[i].addFocusEventListener(this.onFocus, this);
      if (pos[i].length > 2) { this.components[i].setRotation(pos[i][2]); }
    }
  }
  manifest(parent, x,y, active=true) {
    if (!this.e) {
      this.e = document.createElement("div");
      this.e.setAttribute("class", "components digits");
      parent.appendChild(this.e);
    }
    let number = document.createElement("img");
    number.setAttribute("class", "digitNumbers");
    number.setAttribute("src", "graphics/Digits/digit-0.png")
    number.setAttribute("draggable", false)
    number.style.right = "5px";
    number.style.top = "30px";
    this.e.appendChild(number);

    let thisOne = this;
    number.addEventListener("click", () => { thisOne.resetDigit(); });

    const comp = this.components;
    for (let i in comp) {
      comp[i].manifest(this.e, null,null);
      comp[i].setRotation();
      if (comp[i].getName() == "Latch") {
        let focuses = comp[i].get().querySelectorAll(".focusesIn, .focusesOut");
        for (let element of focuses) { element.remove(); }
        let referenceIn = comp[i].get().querySelector(".referencesIn");
        let referenceOut = comp[i].get().querySelector(".referencesOut");
        referenceIn.style.left = "-5px";
        referenceIn.style.top = "5px";
        referenceOut.style.left = "-5px";
        referenceOut.style.bottom = "5px";
      }
    }
    comp[4].get().querySelector(".focusesOut").style.visibility = "hidden";
    comp[5].get().querySelector(".focusesIn").style.visibility = "hidden";
    
    let output = this.components[4];
    let input = this.components[5];
    let nodeOut = [output.get().querySelector(".focusesOut"), output];
    let nodeIn = [input.get().querySelector(".focusesIn"), input];
    let wire = new FocusWire(this.f);
    wire.connect(nodeOut, nodeIn);

    super.manifest(parent, x,y, active);
  }
  triggerInteract(e) {
    let stack = e.detail.stack;
    for (let node of stack) {
      if (node.classList.contains("digitNumbers"))
        node.click();
    }
  }
  turnOn() { this.setDigit(); }
  turnOff() { this.setDigit(); }
  setDigit() {
    if (this.e) {
      let val = this.getValue();
      this.e.querySelector(".digitNumbers").setAttribute("src", "graphics/Digits/digit-" + val + ".png");
    }
  }
  resetDigit() {
    for (let i = 0; i < 4; i++) { this.components[i].resetData(); }
    this.e.querySelector(".digitNumbers").setAttribute("src", "graphics/Digits/digit-0.png");
  }
  getValue() {
      let valStr = "";
      for (let i = 0; i < 4; i++) { valStr += ( this.components[i].getData() ) ? "1" : "0"; }
      return parseInt( valStr, 2 );
  }
  onFocus(thisOne) {
    if (thisOne == this.components[5]) { for (let i = 0; i < 4; i++) { this.components[i].setData(); } }
  }
  move(x,y, updateWires=true) { // intercept movements
    super.move(x,y, updateWires);
    if (updateWires) {
      for (let component of this.components) {
        for (let toMove of component.mL) { toMove[0].call(toMove[1], this); }
        for (let toMove of component.mL) { toMove[0].call(toMove[1], this); }
      }
    }
  }
  clone() { return new Digit(this.f); }
}

export class Counter extends Digit {
  constructor(functions) {
    super(functions);
    this.n = "Counter";
    this.add = true; // true means adding, false means subtracting
  }
  manifest(parent, x,y, active=true) {
    super.manifest(parent, x,y, active);
    for (let i = 0; i < 4; i++) {
      this.components[i].get().querySelector(".referencesIn").style.display = "none";
      this.components[i].get().querySelector(".referencesOut").style.bottom = "10px";
    }
    let plus = document.createElement("div");
    plus.setAttribute("class", "pluses")
    plus.innerText = "+";
    this.changeSign(plus, false);

    let thisOne = this;
    plus.addEventListener("click", function() { thisOne.changeSign.call(thisOne, this); });
    this.components[4].get().appendChild(plus);
  }
  triggerInteract(e) {
    let stack = e.detail.stack;
    for (let node of stack) {
      if (node.classList.contains("pluses"))
        node.click();
    }
    super.triggerInteract(e);
  }
  onFocus(thisOne) {
    if (thisOne == this.components[5]) {
      let setNext = true;
      for (let i = 3; i >= 0; i--) {
        if (setNext) { this.components[i].toggleData(); }
        setNext = setNext && ((this.add && !this.components[i].getData()) || (!this.add && this.components[i].getData()));
      }
    }
  }
  changeSign(thisOne, toggle=true) {
    if (toggle) { this.add = !this.add; }
    thisOne.innerText = (this.add) ? "+" : "-";
  }
  setData(data) { // generalized name
    this.add = (data.d == "1") ? true : false;
    if (this.e) { this.e.querySelector(".pluses").innerText = (this.add) ? "+" : "-"; }
  }
  clone() { return new Counter(this.f); }
  toSaveString(getComponentId) {
    let str = super.toSaveString(getComponentId);
    return `${str}${this.getDataString()}`;
  }
  getDataString() {
    let sign = (this.sign) ? "0" : "1";
    return `[[d=${sign}]]`;
  }
}

export class ShiftRegister extends Digit {
  constructor(functions) {
    super(functions);
    this.n = "Shifter";
    for (let i = 0; i < 5; i++) {
      let indicator = new IndicatorLED(this.f);
      this.components.push(indicator);
      this.components[i].attachIndicator(indicator);
      indicator.setDragability(false);
    }
  }
  manifest(parent, x,y, active=true) {
    super.manifest(parent, x,y, active);
    this.components[0].get().querySelector(".referencesIn").style.left = "22.5px";
    this.components[0].get().querySelector(".referencesIn").style.top = "-5px";
    for (let i = 0; i < 4; i++) { // latches
      let component = this.components[i].get();
      if (i != 0) { component.querySelector(".referencesIn").style.display = "none"; }
      component.querySelector(".referencesOut").style.bottom = "10px";
      component.querySelector(".referencesOut").style.left = "unset";
      component.querySelector(".referencesOut").style.right = "-5px";
      component.style.left = "unset";
      component.style.right = "0px";
    }
    for (let i = 4; i < 6; i++) { // I/O buffers
      this.components[i].get().style.right = "unset";
      this.components[i].get().style.left = "5px";
    }
    for (let i = 6; i < 11; i++) { // indicator LEDs // #11 is a dummy indicator
      let component = this.components[i].get();
      component.style.height = "15px";
      component.style.width = "15px";
      this.components[i].setPos( 30, ((Math.min(i,9) - 6) * 30 + 6) );
      component.querySelector(".referencesIn").style.display = "none";
      component.querySelector(".referencesOut").style.display = "none";
      if (i < 10) { component.style.zIndex = "99"; }
    }
    this.e.querySelector(".digitNumbers").remove();
  }
  setDigit() {} // intercept 'setDigit' call, and do nothing with it
  onFocus(thisOne) {
    if (thisOne == this.components[5]) {
      if (this.components[3].getData()) { this.components[10].turnOn(); }
      else { this.components[10].turnOff(); }
      let oldData = this.components[0].getData();
      this.components[0].setData();
      let newData = this.components[0].getData();
      if (this.components[0].getData() != oldData) { this.components[0].toggleData(); }
      for (let i = 2; i >= 0; i--) {
        if (this.components[i].getData() != this.components[i+1].getData()) { this.components[i+1].toggleData(); }
        this.components[i].resetData();
      }
      const duration = 100;
      for (let i = 7; i < 10; i++) { // skip first case
        let indicator = this.components[i].get();
        let oldTop = (i-6)*30 + 6;
        indicator.style.top = (oldTop - 30) + "px";
        setTimeout((indicator, oldTop) => {
          indicator.style.transition = `top ${duration}ms`;
          indicator.style.top = oldTop + "px";
          setTimeout((indicator) => {
            indicator.style.transition = "";
          }, duration, indicator);
        }, 10, indicator, oldTop);
      }
      if (this.components[0].getData() != newData) { this.components[0].toggleData(); }
    }
  }
  clone() { return new ShiftRegister(this.f); }
}
