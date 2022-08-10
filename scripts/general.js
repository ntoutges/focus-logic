import { Key } from "./keys.js";
import { Wire, FocusWire, ReferenceWire, IndicatorLED } from "/components/components.js";
import { MultiComponent } from "/components/componentsExt.js";

const $ = window.$;
const sandbox = $("#sandbox").get(0);
var conn = {
  type: null,
  in: null,
  out: null
}

var allComponents = [];
var allWires = [];

extern.tools = [];
extern.extensions = [];

var keys = {};

const gridStep = 50;
const metaGridStep = 5;

var isSnapping = false;
var isDrawingGrid = true;
var isFullScreen = false;
var isSelecting = false;

function clearConn() {
  conn.in = null;
  conn.out = null;
  conn.type = null;
}

function createFocusWire() {
  let wire = new FocusWire(extern.functions);
  wire.connect(conn.out, conn.in);
  wire.manifest(sandbox);
  allWires.push(wire);
}

function createReferenceWire() {
  let wire = new ReferenceWire(extern.functions);
  wire.connect(conn.out, conn.in);
  wire.manifest(sandbox);
  if (conn.in[1] instanceof IndicatorLED) {
    conn.out[1].attachIndicator(conn.in[1]);
    if (conn.out[1].getData()) { conn.in[1].turnOn(); }
    else { conn.in[1].turnOff(); }
  }
  allWires.push(wire);
}

sandbox.addEventListener("mouseup", function(e) {
  let path = e.composedPath() ?? e.path;
  if (path[0] == this) { clearConn(); } // only clear 'conn' if sandbox clicked directly
});

function focusInClick(element, thisOne) {
  conn.type = "focus";
  conn.in = [element, thisOne];
}

function focusOutClick(element, thisOne) {
  conn.type = "focus";
  conn.out = [element, thisOne];
}

function referenceInClick(element, thisOne) {
  conn.type = "reference";
  conn.in = [element, thisOne];
}

function referenceOutClick(element, thisOne) {
  conn.type = "reference";
  conn.out = [element, thisOne];
}

function focusInRelease(element, thisOne) {
  if (conn.out && conn.type == "focus") {
    if (conn.out[0] == element) { clearConn(); return; }
    conn.in = [element, thisOne]
    createFocusWire();
  }
  clearConn();
}

function focusOutRelease(element, thisOne) {
  if (conn.in && conn.type == "focus") {
    if (conn.in[0] == element) { clearConn(); return; }
    conn.out = [element, thisOne]
    createFocusWire();
  }
  clearConn();
}

function referenceInRelease(element, thisOne) {
  if (conn.out && conn.type == "reference") {
    if (conn.out[0] == element) { clearConn(); return; }
    conn.in = [element, thisOne];
    createReferenceWire();
  }
  clearConn();
}

function referenceOutRelease(element, thisOne) {
  if (conn.in && conn.type == "reference") {
    if (conn.in[0] == element) { clearConn(); return; }
    conn.out = [element, thisOne];
    createReferenceWire();
  }
  clearConn();
}

let overlayExists = false;
function performDragging(component) {
  const threshold = 50;
  let top = component.get().getBoundingClientRect().top;
  if (top < threshold) {
      let opacity = (threshold - top) / threshold + 0.2;
      $("#deletionOverlay").css("opacity", opacity);
      overlayExists = true;
  }
  else if (top >= threshold && overlayExists) {
      $("#deletionOverlay").css("opacity", "0");
      overlayExists = false;
  }
  else if (isSnapping) { snapToGrid(component, false); }
}

function finishDragging(component) {
  const threshold = 50;
  let top = component.get().getBoundingClientRect().top;
  if ( !(component instanceof Wire) && top < threshold) {
      for (let i in allComponents) { if (allComponents[i] == component) { allComponents.splice(i,1); } }
      removeWires(component);
      component.delete();
  }
  else if (isSnapping) { snapToGrid(component, true); }
  $("#deletionOverlay").css("opacity", "0");
}

function snapToGrid(component, changePos) {
  let pos = { left: component.get().offsetLeft, top: component.get().offsetTop };
  if (changePos) { component.setPos(pos.left-extern.globalPos.x, pos.top-extern.globalPos.y); }
  else {
    let center = component.getCenter();
    let activeGridStep = gridStep/2;
    let x = Math.round( (pos.left - extern.globalPos.x + activeGridStep) / activeGridStep ) * activeGridStep + extern.globalPos.x - center.x;
    let y = Math.round( (pos.top - extern.globalPos.y + activeGridStep) / activeGridStep ) * activeGridStep + extern.globalPos.y - center.y;
    component.get().style.left = x + "px";
    component.get().style.top = y + "px";
  }
}

function removeWires(component) { // only meant to remove external wires, going from this component to another; not the internal wires of a MultiComponent
  /* if (component instanceof MultiComponent) { // [component] is made of many other components
    let subComponents = component.getComponents();
    for (let subComponent of subComponents) {
      removeWires(subComponent);
    }
    return;
  } */
  let outs = component.getOutputs();
  let ins = component.getInputs();
  let IO = [];
  if (outs.true) { IO.push(outs.true); }
  if (outs.false) { IO.push(outs.false); }
  IO = IO.concat(outs.reference); // always at least an empty array
  IO = IO.concat(ins.focus);
  if (ins.reference) { IO.push(outs.reference); }
  for (let i = 0; i < allWires.length; i++) {
    for (let j in IO) {
      if (allWires[i] == IO[j]) {
        allWires.splice(i,1);
        i--;
      }
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => { setTimeout(() => { resolve() }, ms); })
}
extern.sleep = sleep;

document.body.addEventListener("keydown", hotkeyPressed);
document.body.addEventListener("mousedown", resetFocus);

function hotkeyPressed(e) {
  if (e.metaKey || e.ctrlKey) {
    switch(e.keyCode) {
      case 83: // ctrl-s
        e.preventDefault();
        $("#saveButton").click();
        break;
      case 79: // ctrl-o
        e.preventDefault();
        $("#loadButton").click();
    }
    return;
  }
  switch(e.keyCode) {
    case 82: // r
      keyRotate(e);
      break;
    case 83: // s
      toggleSnap();
      break;
    case 71: // g
      toggleGrid();
      break;
    case 86: // v
      toggleSelectionMode();
      break;
    case 70: // f
      toggleFullMode();
      break; 
  }
}

var currentFocus = null;
function focusOn(component) {
  if (currentFocus) { currentFocus.get().removeAttribute("data-focus"); }
  if (component) { component.get().setAttribute("data-focus", "1"); }
  currentFocus = component;
}

function addWire(wire) { allWires.push(wire); }

function keyRotate(e) {
  if (!currentFocus) { return; }
  let rotateBy = 45;
  if (e.shiftKey) { rotateBy = 15; }
  if (e.altKey)   { currentFocus.addRotation(-rotateBy); } // rotate counterclockwise by 45 degrees
  else            { currentFocus.addRotation(rotateBy); }  // rotate clockwise by 45 degrees
}

function resetFocus(e) {
  let path = e.composedPath() ?? e.path;
  for (let i = 0; i < path - 4; i++) { if (path[i].classList.contains("components")) { return; } } // prevent propagating clicks coming from component elements // "length - 4" used to ignore window and body elements
  focusOn(null);
}

function toggleSnap() {
  isSnapping = !isSnapping; // toggle whether or not elements snap to grid lines
  keys["S"].setState(isSnapping);
}

extern.functions = {
  FIC: focusInClick,
  FOC: focusOutClick,
  RIC: referenceInClick,
  ROC: referenceOutClick,
  FIR: focusInRelease,
  FOR: focusOutRelease,
  RIR: referenceInRelease,
  ROR: referenceOutRelease,
  play: () => { console.log("Function [play] not implemented") },
  PD: performDragging,
  FD: finishDragging,
  focusOn: focusOn,
  addWire: addWire
}

extern.globalPos = {
  x: 0,
  y: 0,
  iX: -1,
  iY: -1,
}
// global movement stuff
sandbox.addEventListener("mousedown", (e) => {
  if (!isSelecting) {
    extern.globalPos.iX = e.pageX;
    extern.globalPos.iY = e.pageY;
  }
});

sandbox.addEventListener("mousemove", (e) => {
  if (!isSelecting && extern.globalPos.iX >= 0 && extern.globalPos.iY >= 0) {
    let newX = extern.globalPos.x - (extern.globalPos.iX - e.pageX);
    let newY = extern.globalPos.y - (extern.globalPos.iY - e.pageY);
    extern.globalPos.iX = e.pageX;
    extern.globalPos.iY = e.pageY;
    globalSet(newX, newY);
  }
});

sandbox.addEventListener("mouseup", (e) => {
  extern.globalPos.iX = -1;
  extern.globalPos.iY = -1;
});

function globalSet(x,y) {
  if (extern.globalSetOuter) extern.globalSetOuter(x,y);
  extern.globalPos.x = x;
  extern.globalPos.y = y;
  for (let component of allComponents) { component.globalSetPos(x,y); }
  for (let wire of allWires) {
    if (wire.e.parentNode == sandbox) wire.globalSetPos(x,y);
  }
  drawGridlines();
}

const c = document.getElementById("gridlines");
const ctx = c.getContext("2d");
resizeGridlinesCanvas(); 
drawGridlines();
initGlobalPos();

function initGlobalPos() { // center middle of meta-grid in the center of the screen to make initial presentation look nicer
  let midWidth = c.width / 2;
  let midHeight = c.height / 2;
  globalSet(midWidth, midHeight);
}

function drawGridlines() {
  resizeGridlinesCanvas();
  ctx.beginPath();
  ctx.clearRect(0,0, c.width,c.height);
  
  if (!isDrawingGrid) {
    ctx.stroke();
    return;
  }

  let xOff = extern.globalPos.x % gridStep;
  let yOff = extern.globalPos.y % gridStep;
  for (let i = 0; i < c.width + gridStep; i += gridStep) {
    let x = i + xOff;
    ctx.moveTo(x,0);
    ctx.lineTo(x,c.height);
  }
  for (let i = 0; i < c.height + gridStep; i += gridStep) {
    let y = i + yOff;
    ctx.moveTo(0,y);
    ctx.lineTo(c.width,y);
  }
  ctx.lineWidth = 1;
  ctx.stroke();

  // draw meta-grid
  ctx.beginPath();

  let metaXOff = extern.globalPos.x % (gridStep * metaGridStep);
  let metaYOff = extern.globalPos.y % (gridStep * metaGridStep);
  for (let i = 0; i < c.width + gridStep; i += gridStep * metaGridStep ) {
    let x = i + metaXOff;
    ctx.moveTo(x,0);
    ctx.lineTo(x, c.height);
  }
  for (let i = 0; i < c.height + gridStep; i += gridStep * metaGridStep) {
    let y = i + metaYOff;
    ctx.moveTo(0, y);
    ctx.lineTo(c.width, y);
  }
  ctx.lineWidth = 3;
  ctx.stroke();
}

function resizeGridlinesCanvas() {
  if (c.width != window.innerWidth || c.height != window.innerHeight) {
    c.setAttribute("width", window.innerWidth);
    c.setAttribute("height", window.innerHeight);
  }
}

function toggleGrid() {
  setGridlineDraw(!isDrawingGrid);
  keys["G"].setState(isDrawingGrid);
}

function setGridlineDraw(drawGrid) {
  isDrawingGrid = drawGrid;
  drawGridlines();
}

function toggleFullMode() {
  setFullMode(!isFullScreen);
  keys["F"].setState(isFullScreen);
}

function setFullMode(state) {
  isFullScreen = state;
  const hide = isFullScreen ? "1" : "0";
  
  document.getElementById("title").setAttribute("data-hidden", hide);
  document.getElementById("toolbox").setAttribute("data-hidden", hide);
  document.getElementById("extensionBox").setAttribute("data-hidden", hide);
  document.getElementById("keysHolder").setAttribute("data-hidden", hide);
  document.getElementById("simControls").setAttribute("data-hidden", hide);

  if (isFullScreen) {
    let fullScreenPromise = null;
    if (document.documentElement.requestFullscreen) fullScreenPromise = document.documentElement.requestFullscreen(); // modern browsers
    else if (document.documentElement.webkitRequestFullscreen) fullScreenPromise = document.documentElement.webkitRequestFullscreen(); // Safari support
    else if (document.documentElement.msRequestFullscreen) fullScreenPromise = document.documentElement.msRequestFullscreen(); // Internet Explorer 11
    if (fullScreenPromise && fullScreenPromise.finally) { // (should) indicate if this is a promise
      fullScreenPromise.then(() => {
        setTimeout(drawGridlines, 20); // let CSS adjust
      });
    }
    setTimeout(drawGridlines, 100); // let screen enlarge
  }
  else document.exitFullscreen();
}

function toggleSelectionMode() {
  setSelectionMode(!isSelecting)
  keys["V"].setState(isSelecting);
}

function setSelectionMode(state) { // to be further implemented later
  isSelecting = state;
  if (isSelecting)
    sandbox.classList.add("no-drag");
  else 
    sandbox.classList.remove("no-drag");
}

const toolbox = $("#toolbox").get(0);
const extensionBox = $("#extensionBox").get(0);
function fillComponentSlots() {
  if (extern.simulate) extern.functions.play = extern.simulate;
  // fill out toolbox
  toolbox.innerHTML = "";
  for (let i in extern.tools) {
    createSection(extern.tools[i], toolbox);
  }
  if (extern.tools.length == 0) toolbox.style.display = "none";

  // fill out extension box
  extensionBox.innerHTML = "";
  for (let i in extern.extensions) {
    createSection(extern.extensions[i], extensionBox);
  }
  if (extern.extensions.length == 0) extensionBox.style.display = "none";
}
extern.fillComponentSlots = fillComponentSlots;

function createSection(toolObj, parent) {
  let section = document.createElement("div");
  let tool = new toolObj(extern.functions);
  tool.manifest(section, 0,0, false);
  let sectionTitle = document.createElement("h3");
  section.setAttribute("class", "sections");
  sectionTitle.innerText = tool.getName();
  sectionTitle.setAttribute("class", "sectionTitles");
  section.appendChild(sectionTitle);
  
  tool.get().addEventListener("mousedown", (e) => { createNewComponent(e,tool) });
  parent.appendChild(section);

  setTimeout((section, tool) => { // allow time for CSS to work
    let toolHeight = tool.get().offsetHeight;
    let toolWidth = tool.get().offsetWidth;
    // tool.get().style.top = "calc( 60% - " + toolHeight + "px / 2 )";
    tool.get().style.top = "calc( 40% - " + toolHeight + "px / 2 )";
    tool.get().style.left = "calc( 50% - " + toolWidth + "px / 2 )";
  }, 0, section, tool);
}

function createNewComponent(e,component) {
  let newComponent = component.clone();
  newComponent.manifest(sandbox, 100,100);
  newComponent.initDrag(e);
  
  allComponents.push(newComponent);

  let bounds = component.get().getBoundingClientRect();
  newComponent.setPos(bounds.left, bounds.top);
  newComponent.globalSetPos(extern.globalPos.x, extern.globalPos.y);
  newComponent.move(-extern.globalPos.x, -extern.globalPos.y); // counteract 'globalSetPos'
  performDragging(newComponent); // set red box at the top when new component created
}
document.body.addEventListener("mousedown", () => { toolbox.setAttribute("data-active", "0"); });
document.body.addEventListener("mouseup", () => { toolbox.setAttribute("data-active", "1"); });

function fillToggleKeys() {
  const keyTypes = {
    // {letter}: [ x,y, initialState, triggerFunction ] 
    "G": [20, 70, true, setGridlineDraw], // grid
    "S": [20, 20, false, (state) => { isSnapping = state; }], // snap
    "V": [70, 20, false, setSelectionMode],
    "F": [120, 20, false, setFullMode] // fullscreen mode
  }

  const parent = document.getElementById("keysHolder");
  for (let letter in keyTypes) {
    let key = new Key(letter, keyTypes[letter][3]);
    key.manifest(parent, keyTypes[letter][0], keyTypes[letter][1]);
    key.setState(keyTypes[letter][2]);
    keys[letter] = key;
  }
}

function resetPlayarea() {
  allComponents = [];
  allWires = [];
  sandbox.innerHTML = "";
}

function save() {
  let saveString = []
  for (let i in allComponents) {
    saveString.push( allComponents[i].toSaveString(getComponentIndex) );
  }
  return saveString.join(",");
}

function load(saveString) {
  resetPlayarea();
  let strings = saveString.split(",");
  let localComponents = [];
  for (let str of strings) {
    let name = str.substring(0, str.indexOf("("));
    let component = extern.make(name);
    // try { component = eval("new " + name + "(functions)"); }
    // catch(err) {
    //   for (let i in extern.tools) { // cover edge cases for scenarios like the IndicatorLED, which is just called "LED"
    //     let tempTool = new extern.tools[i](extern.functions);
    //     if (tempTool.getName() == name) {
    //       component = tempTool;
    //       break;
    //     }
    //   }
    // }
    component.manifest(sandbox);
    component.e.style.zIndex = 2;
    localComponents.push(component);
  }
  for (let i in strings) {
    let str = strings[i];
    if (str.includes("<")) { loadComponentExt(str,i, localComponents, conn,createFocusWire,createReferenceWire); }
    else { loadComponent(str,i, localComponents, conn,createFocusWire,createReferenceWire); }
  }
  for (let component of localComponents) {
    component.globalSetPos(extern.globalPos.x, extern.globalPos.y);
  }
  allComponents = allComponents.concat(localComponents);
  clearConn();
}

extern.load = load;

function loadComponent(str,i, localComponents, conn,createFocusWire,createReferenceWire) {
  let pos = ( str.split("(")[1].split(")")[0] ).split(";");
  localComponents[i].setPos( parseInt(pos[0],10), parseInt(pos[1],10) );
  if (pos.length > 2)
    localComponents[i].setRotation( parseInt(pos[2], 10) );
  
  let refIds = str.split("[")[1].split("]")[0].split(";");
  for (let j in refIds) {
    if (refIds[j] == "") { continue; }
    let parentNodeId = null;
    let inNodeId = refIds[j];
    if (inNodeId.includes("+")) {
      let inNodeIdList = inNodeId.split("+");
      parentNodeId = inNodeIdList[0];
      inNodeId = inNodeIdList[1];
    }

    let reference = (parentNodeId == null) ? localComponents[inNodeId] : localComponents[parentNodeId].getComponents()[inNodeId];
    let nO = localComponents[i].get().querySelector(".referencesOut");
    let nI = reference.get().querySelector(".referencesIn");
    let nodeOut = [nO, localComponents[i]];
    let nodeIn = [nI, reference];
    conn.out = nodeOut;
    conn.in = nodeIn;
    createReferenceWire();
  }
  let inNodeIds = str.split("]")[1].split("-")[1].split("[")[0].split(":");
  const nodeTypes = ["true", "false"];
  const typeKey = { "s":"set", "r":"reset" }
  for (let j in inNodeIds) {
    if (inNodeIds[j] != "") {
      let parentNodeId = null;
      let inNodeId = inNodeIds[j];
      let inNodeType = "";

      if (inNodeId.includes("+")) {
        let inNodeIdList = inNodeId.split("+");
        parentNodeId = inNodeIdList[0];
        inNodeId = inNodeIdList[1];
      }

      if (isNaN(inNodeId)) {
        inNodeId = inNodeIds[j].substring(0, inNodeIds[j].length-1);
        inNodeType = inNodeIds[j][inNodeIds[j].length-1];
      }

      let inComponent = (parentNodeId == null) ? localComponents[inNodeId] : localComponents[parentNodeId].getComponents()[inNodeId];
      let inNode = inComponent.get().querySelectorAll(".focusesIn");
      if (inNode.length == 0 && inComponent.get()) { inNode = inComponent.get(); } // last ditch effort
      else if (inNode.length > 1) { inNode = inComponent.get().querySelector(".focusesIn[data-type=" + typeKey[inNodeType] + "]"); }
      else { inNode = inNode[0]; }

      let outNode = localComponents[i].getOutputNodes()[nodeTypes[j]];
      
      conn.out = [outNode, localComponents[i]];
      conn.in = [inNode, inComponent];
      createFocusWire();
    }
  }
  let data = getData( str );
  if (Object.keys(data).length > 0)
    localComponents[i].setData(data);
}

function loadComponentExt(str,i, localComponents, conn,createFocusWire,createReferenceWire) {
  let pos = ( str.split("(")[1].split(")")[0] ).split(";");
  localComponents[i].setPos( parseInt(pos[0],10), parseInt(pos[1],10) );
  let posEnd = str.indexOf(")") + 1;
  let connListStart = str.indexOf("<") + 1;
  
  let dataString = str.substring(posEnd,connListStart-1).replace("[[","").replace("]]","");
  if (dataString != "") {
    let dataArr = dataString.split(".");
    let data = {};
    for (let i in dataArr) {
      let datas = dataArr[i].split("=");
      let key = datas[0];
      data[key] = datas[1];
    }
    localComponents[i].setData(data);
  }
  if (pos.length > 2)
  localComponents[i].setRotation( parseInt(pos[2], 10) );
  let connListEnd = str.lastIndexOf(">");
  const re = /(\[(\d*;)*\d*\]-(\d*[rs]*):(\d*[rs]*))/g;
  let connList = str.substring(connListStart, connListEnd).match(re);
  let subComponents = localComponents[i].getComponents();
  for (let j in connList) {
    let refIds = connList[j].split("[")[1].split("]")[0].split(";");
    for (let k in refIds) {
      if (refIds[k] == "") { continue; }
      let parentNodeId = null;
      let refId = refIds[k];
      if (refId.includes("+")) {
        let refIdList = refId.split("+");
        parentNodeId = refIdList[0];
        refId = refIdList[1];
      }

      let reference = null;
      if (parentNodeId == null) { reference = (refId < localComponents.length) ? localComponents[refId] : localComponents[i].getComponents()[refId - localComponents.length]; }
      else { reference = localComponents[parentNodeId].getComponents()[refId] }
      
      let nO = subComponents[j].get().querySelector(".referencesOut");
      let nI = reference.get().querySelector(".referencesIn");
      let nodeOut = [nO, subComponents[j]];
      let nodeIn = [nI, reference];
      conn.out = nodeOut;
      conn.in = nodeIn;
      createReferenceWire();
    }
    let inNodeIds = connList[j].split("]")[1].split("-")[1];
    if (inNodeIds.indexOf("[[") != -1)
      inNodeIds = inNodeIds.substring(0, inNodeIds.indexOf("[["));
    inNodeIds = inNodeIds.split(":");
    const nodeTypes = ["true", "false"];
    const typeKey = { "s":"set", "r":"reset" }
    for (let k in inNodeIds) {
      if (inNodeIds[k] != "") {
        let parentNodeId = null;
        let inNodeId = inNodeIds[k];
        let inNodeType = "";
        
        if (inNodeId.includes("+")) {
          let inNodeIdList = inNodeId.split("+");
          parentNodeId = inNodeIdList[0];
          inNodeId = inNodeIdList[1];
        }
        if (isNaN(inNodeId)) {
          inNodeId = inNodeIds[k].substring(0, inNodeIds[k].length-1);
          inNodeType = inNodeIds[k][inNodeIds[k].length-1];
        }
  
        let inComponent = null;
        if (parentNodeId == null) { inComponent = (inNodeId < localComponents.length) ? localComponents[inNodeId] : localComponents[i].getComponents()[inNodeId - localComponents.length]; }
        else { inComponent = localComponents[parentNodeId].getComponents()[inNodeId] }
        let inNode = inComponent.get().querySelectorAll(".focusesIn");
        if (inNode.length > 1) { inNode = inComponent.get().querySelector(".focusesIn[data-type=" + typeKey[inNodeType] + "]"); }
        else { inNode = inNode[0]; }
        let outComponent = subComponents[j];
        let outNode = outComponent.getOutputNodes()[nodeTypes[k]];
        if ( !document.body.contains(outNode) ) { continue; } // wire already created
        
        conn.out = [outNode, outComponent];
        conn.in = [inNode, inComponent];
        createFocusWire();
      }
    }
    let data = getData( connList[j] );
    if (Object.keys(data).length > 0)
      subComponents[j].setData(data);
  }
  let data = getData( str.substring(0, str.indexOf("<")) );
  if (Object.keys(data).length > 0)
    localComponents[i].setData( data );
}

function getData(str) {
  let dataString = str.substring( str.lastIndexOf("[[")+2, str.lastIndexOf("]]") );
  if (dataString.length > 1) {
    let dataArr = dataString.split(".");
    let data = {};
    for (let subData of dataArr) {
      let info = subData.split("=");
      let key = info[0];
      let val = info[1];
      data[key] = val;
    }
    return data;
  }
  return {};
}

// modal stuff
const modal = $("#modal").get(0);
$("#saveButton").click(() => { 
  modal.showModal();
  modal.setAttribute("data-use", "save");
  
  const saveString = save();
  $("#loadValue").val( saveString );
  const textArea = $("#loadValue").get(0);
  textArea.selectionStart = 0;
  textArea.selectionEnd = saveString.length;
});

$("#loadButton").click(() => {
  modal.showModal();
  modal.setAttribute("data-use", "load");
});

$("#clearButton").click(() => {
  modal.showModal();
  modal.setAttribute("data-use", "clear");
  $("#loadValue").val("Are you sure you want to clear your schematic?");
});

modal.addEventListener("close", (e) => {
  if (modal.getAttribute("data-use") == "load") {
    if (modal.returnValue == "default") {
      try {
        load( $("#loadValue").val() );
      }
      catch(err) {
        if (!modal.getAttribute("open")) modal.showModal();
        $("#loadValue").val("An error occurred\n" + err.toString());
        resetPlayarea(); // reset any damage done by loading an invalid value
        return;
      }
    }
  }
  else if (modal.getAttribute("data-use") == "clear") {
    if (modal.returnValue == "default") {
      resetPlayarea();
    }
  }
  $("#loadValue").val(""); // reset text in textarea
});

$("#loadValue").keydown((e) => {
  if (e.keyCode != 13 || e.shiftKey) return;
  $("#modalConfirm").click();
});

function getComponentIndex(component, extraComponents=[]) {
  for (let i in allComponents) { if (allComponents[i] == component) { return i; } }
  for (let i in extraComponents) { if (extraComponents[i] == component) { return parseInt(i, 10) + allComponents.length; } }
  for (let i in allComponents) {
    if (allComponents[i] instanceof MultiComponent) {
      let subComponents = allComponents[i].getComponents();
      for (let j in subComponents) { if (subComponents[j] == component) { return i + "+" + j }
      }
    }
  }
  return -1;
}

// fillComponentSlots();
fillToggleKeys();