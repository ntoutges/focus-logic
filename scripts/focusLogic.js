import { Wire, FocusWire, ReferenceWire, Gate, Bit, Latch, Start, IndicatorLED, Buffer, Timer, Delay, Interactor } from "../components/components.js";
import { MultiComponent, Digit, Counter, ShiftRegister } from "../components/componentsExt.js";

var allFocusRegions = [];

extern.tools = [ Start, Buffer, Gate, Bit, Latch, IndicatorLED, Timer, Delay, Interactor ];
extern.extensions = [Digit, Counter, ShiftRegister];

// function fillSlotTypes() {
//   let editor = editorType.toUpperCase(); // because it looks cooler
//   switch(editor) {
//     case "LOGIC":
      
//       break;
//     case "CLASS":
//       tools = [Block, ProtoDesk, Chair, Label, Desk, Board];
//       extensions = [Table];
//       break;
//   }
// }

var simSpeed = 1000;
var pausedSims = [];
async function simulate(component, wire=null, focusRegion=null) {
  if (!focusRegion) {
    focusRegion = document.createElement("div");
    let focusRegionPoint = document.createElement("div");
    allFocusRegions.push(focusRegion);

    focusRegion.setAttribute("class", "focusRegions");
    focusRegionPoint.setAttribute("class", "focusRegionPoints");
    focusRegionPoint.style.transitionDuration = (simSpeed / 2) + "ms";

    sandbox.appendChild(focusRegion);
    focusRegion.appendChild(focusRegionPoint);
    centerFocusRegion(component.get(), focusRegion);
  }
  if (!wire) {
    wire = null;
    [wire, component] = await simulateStep(component,wire, focusRegion);
  }
  let isPaused = false;
  while (true) {
    if (simSpeed < 0) {
      isPaused = true;
      break;
    }
    await extern.sleep(simSpeed);
    let result = await simulateStep(component,wire, focusRegion);
    wire = result[0];    
    component = result[1];
    if (!wire) {
      let delay = 0;
      if (component instanceof Timer) {
        delay = component.getDelay(simSpeed);
        let focusPoint = focusRegion.querySelector(".focusRegionPoints");
        focusPoint.style.transitionDuration = delay + "ms";
        focusPoint.style.transitionTimingFunction = "linear";
      }
      centerFocusRegion(component.getOutputNode(), focusRegion);
      if (delay > 0) {
        await extern.sleep(delay);
        let focusPoint = focusRegion.querySelector(".focusRegionPoints");
        focusPoint.style.transitionDuration = (simSpeed / 2) + "ms";
        focusPoint.style.transitionTimingFunction = "";
      }
      setTimeout(() => { finishSimulation(focusRegion); }, simSpeed * 0.8);
      break;
    }
  }
  if (isPaused) { pausedSims.push([component,wire, focusRegion]); }
}
extern.simulate = simulate;

function unpauseSim() {
  for (let simData of pausedSims) { simulate.apply(this, simData); }
  pausedSims = [];
}

async function simulateStep(component,wire, focusRegion) {
  if (!component) { return [null, null] }
  wire = component.getOutput(wire);
  if (!wire) { return [null, component]; }

  let isTimer = component instanceof Timer;
  let delay = 0;
  let focusPoint = null;
  
  if (isTimer) {
    delay = component.getDelay(simSpeed);
    focusPoint = focusRegion.querySelector(".focusRegionPoints");
    focusPoint.offsetHeight; // trigger CSS "reflow"
    focusPoint.style.transitionDuration = delay + "ms";
    focusPoint.style.transitionTimingFunction = "linear";
  }

  let nodes = wire.getNodes();
  centerFocusRegion(nodes.out, focusRegion);
   
  if (isTimer) {
    await extern.sleep( delay );
    focusPoint.style.transitionDuration = (simSpeed / 2) + "ms";
    focusPoint.style.transitionTimingFunction = "";
  }

  setTimeout(() => {
    centerFocusRegion(nodes.in, focusRegion);
  }, simSpeed/2);
  
  component = wire.getObjects().in;
  return [wire, component];
}

function centerFocusRegion(centerElement, focusRegion) {
  if (!centerElement) { return; }
  let bounds = centerElement.getBoundingClientRect();
  let x =  (bounds.left + bounds.right) / 2;
  let y = (bounds.top + bounds.bottom) / 2;
  
  // may want to transition to the actual offsetLeft and offsetTop commands
  let offsetX = parseInt( focusRegion.getAttribute("data-left"), 10) || 0;
  let offsetY = parseInt( focusRegion.getAttribute("data-top"), 10) || 0;

  let focusRegionPoint = focusRegion.querySelector(".focusRegionPoints");
  let oldX = parseInt( focusRegionPoint.style.left, 10) || 0;
  let oldY = parseInt( focusRegionPoint.style.top, 10) || 0;

  if (offsetX != 0 || offsetY != 0) {
    focusRegionPoint.classList.add("no-transition");
    focusRegionPoint.style.left = `${oldX + offsetX}px`;
    focusRegionPoint.style.top = `${oldY + offsetY}px`;
    focusRegion.offsetHeight; // trigger a CSS "reflow"
    focusRegionPoint.classList.remove("no-transition");
  }
  focusRegionPoint.style.left = (x - 10) + "px";
  focusRegionPoint.style.top = (y - 10) + "px";

  focusRegion.style.left = "0px";
  focusRegion.style.top = "0px";
  focusRegion.removeAttribute("data-left");
  focusRegion.removeAttribute("data-top");
}

extern.globalSetOuter = (x,y) => moveFocusRegions(x-extern.globalPos.x, y-extern.globalPos.y);

function moveFocusRegions(x,y) {
  for (let i in allFocusRegions) {
    let oldX = parseInt( allFocusRegions[i].getAttribute("data-left"), 10) || 0;
    let oldY = parseInt( allFocusRegions[i].getAttribute("data-top"), 10) || 0;
    allFocusRegions[i].style.left = `${oldX + x}px`;
    allFocusRegions[i].style.top = `${oldY + y}px`;
    allFocusRegions[i].setAttribute("data-left", oldX + x);
    allFocusRegions[i].setAttribute("data-top", oldY + y);
  }
}

function removeFocusRegion(focusRegion) {
  for (let i in allFocusRegions) {
    if (allFocusRegions[i] == focusRegion) {
      allFocusRegions.splice(i,1);
      break;
    }
  }
  focusRegion.remove();
}

function finishSimulation(focusRegion) {
  focusRegion.style.opacity = "0";
  setTimeout(() => {
    removeFocusRegion(focusRegion);
  }, 250);
}

var speedKey = [-1, 2000,1000,500,100,0];
document.getElementById("simSpeed").addEventListener("input", function() {
  if (this.value == 0) { document.getElementById("simSpeedLabel").innerText = "| |"; }
  else { document.getElementById("simSpeedLabel").innerText = this.value; }
  setSpeed(speedKey[this.value]);
});

function setSpeed(newSpeed) {
  if (newSpeed == simSpeed) { return; }
  let oldSpeed = simSpeed;
  simSpeed = newSpeed;
  if (oldSpeed < 0 && newSpeed >= 0) { unpauseSim(); }
  let focuses = document.querySelectorAll(".focusRegions");
  for (let i = 0; i < focuses.length; i++) {
    focuses[i].childNodes[0].style.transitionDuration = (simSpeed / 2) + "ms";
  }
}

extern.make = (name) => {
  let component = null;
  try { component = eval("new " + name + "(extern.functions)"); }
  catch(err) {
    for (let i in extern.tools) { // cover edge cases for scenarios like the IndicatorLED, which is just called "LED"
      let tempTool = new extern.tools[i](extern.functions);
      if (tempTool.getName() == name) {
        component = tempTool;
        break;
      }
    }
    if (component == null) {
      for (let i in extern.extensions) { // cover edge cases for scenarios like the ShiftRegister, which is just called "Shifter"
        let tempExt = new extern.extensions[i](extern.functions);
        if (tempExt.getName() == name) {
          component = tempExt;
          break;
        }
      }
    }
  }
  return component;
}

extern.fillComponentSlots();
if (window.location.search == "?idle") {
  extern.load("Start(-115;-314)[]-1:,Gate(-190;-212;90)[]-2r:2s,Bit(-105;-164)[1;3;12]-3:,Gate(-90;-112;90)[]-21:4,Gate(-140;-87;90)[]-5r:5s,Bit(-55;-39)[4;6;13]-6:,Gate(-40;13;90)[]-22:7,Gate(-90;38;90)[]-8r:8s,Bit(-5;86)[7;9;15]-9:,Gate(10;138;90)[]-23:10,Gate(-40;163;90)[]-11r:11s,Bit(45;211)[10;14]-24:,LED(-192;-166;90)[17]-:,LED(-192;-66;90)[18]-:,LED(-192;209;90)[16]-:,LED(-192;109;90)[19]-:,LED(-342;-166;90)[20+0]-:,LED(-342;209;90)[20+3]-:,LED(-392;84;90)[20+2]-:,LED(-392;-41;90)[20+1]-:,Digit(-600;-9)<[]-:;[]-:;[]-:;[]-:;[]-78:;[]-27:>,Buffer(135;-114)[]-24:,Buffer(135;11)[]-24:,Buffer(135;136)[]-24:,Buffer(185;236;90)[]-25:,Buffer(-490;236;270)[]-26:,Buffer(-515;-39;180)[]-20+4:,Buffer(-565;136;180)[]-28:,Buffer(-640;136;270)[]-29:,Buffer(-640;-289)[]-30:,Timer(-255;-288)[]-1:[[d=1000]],Shifter(0;-259)<[]-:;[]-:;[]-:;[32]-:;[]-78:;[]-34:;[]-:;[]-:;[]-:;[]-:;[]-:>,Gate(135;-237;270)[]-33r:33s,Bit(45;-314)[31+0]-31+4:,Buffer(135;-164;270)[]-32:,Start(-15;-314)[]-31+4:,Counter(350;-109)<[39;48]-:;[42;46;49]-:;[40;45;50]-:;[41;47;51]-:;[]-78:;[]-39:>[[d=1]],Actor(420;-112;180)[]-36+4:,Start(410;-189)[]-36+4:,Gate(260;-137)[]-42:46,Gate(260;-37)[]-41:44,Gate(260;13)[]-43:44,Gate(260;-87)[]-40:44,Buffer(460;11)[]-37:,Buffer(360;-164)[]-36+4:,Gate(210;13)[]-44:47,Gate(210;-37)[]-44:45,Gate(210;63)[]-44:43,LED(508;-141;270)[]-:,LED(508;-91;270)[]-:,LED(508;-41;270)[]-:,LED(508;9;270)[]-:,Buffer(-890;-389)[]-53:,Buffer(-790;-389)[]-54:,Buffer(-690;-389)[]-55:,Buffer(-590;-389)[]-56:,Buffer(-490;-389)[]-57:,Buffer(-390;-389)[]-58:,Buffer(-290;-389)[]-59:,Buffer(-190;-389)[]-60:,Buffer(-90;-389)[]-61:,Buffer(60;-389)[]-62:,Buffer(160;-389)[]-63:,Buffer(285;-389)[]-69:,Buffer(460;-389)[]-65:,Buffer(560;-389)[]-66:,Buffer(660;-389)[]-67:,Buffer(760;-389)[]-68:,Buffer(860;-389)[]-70:,Buffer(360;-389)[]-64:,Buffer(860;-339;180)[]-71:,Buffer(-890;-339;180)[]-52:,Start(-840;-289;135)[]-71:");
  const allStarts = $("#sandbox .components.starts .startButtons");
  allStarts.click();
  const newSpeedLevel = 4;
  $("#simSpeed").val(newSpeedLevel)
  setSpeed(speedKey[newSpeedLevel]);
  // $("#keys-G").click();
}

// use the following string for testing
// load("Bit(222;236)[9;4;12;16+3]-4:,Bit(222;326)[5;6;13;16+2]-6:,Bit(223;420)[7;8;14;16+1]-8:,Bit(225;511)[11;15;16+0]-10:,Gate(213;283)[]-10:5,Gate(262;283)[]-1r:1s,Gate(214;381)[]-10:7,Gate(266;378)[]-2r:2s,Gate(215;474)[]-10:11,Gate(240;190)[]-0r:0s,Buffer(320;300)[]-16+4:,Gate(262;472)[]-3r:3s,LED(287;563)[]-:,LED(249;567)[]-:,LED(212;568)[]-:,LED(174;572)[]-:,Digit(412;399)<[]-:;[]-:;[]-:;[]-:;[]-33:;[]-19+4:>,Start(295;132)[]-23:,Actor(267;118;45)[]-9:,Counter(547;401)<[]-:;[]-:;[]-:;[]-:;[]-33:;[]-:>[[d=1]],Bit(420;210)[23;25]-:,Timer(329;124;270)[]-18:[[d=1000]],Actor(405;193;90)[]-23:,Gate(321;188;180)[]-21:,Start(510;210;180)[]-22:,LED(508;258;270)[]-:,Actor(618;404;180)[]-:,Start(658;465;180)[]-26:")

// seat of shame
// load("Desk(100;200;450)[[x=269.y=95.t=Seat of shame.e=1]]<[]-:;[]-:;[]-17:[[t=Seat of shame.e=1]]>,Surface(0;200)[]-:,Surface(100;100)[]-:,Surface(25;125;45)[]-:,Surface(175;125;45)[]-:,Surface(200;200;90)[]-:,Surface(25;275;45)[]-:,Surface(100;300)[]-:,Surface(175;275;45)[]-:,Chair(105;330)[]-:,Chair(16;294;45)[]-:,Chair(-20;205)[]-:,Chair(16;116;45)[]-:,Chair(105;80)[]-:,Chair(192;118;45)[]-:,Chair(230;205)[]-:,Chair(194;294;45)[]-:")