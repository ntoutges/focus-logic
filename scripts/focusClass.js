import { Block, ProtoDesk, Chair, Label, Desk, Table, Wall } from "../components/classComponents.js";

extern.tools = [Block, ProtoDesk, Chair, Label, Desk, Wall];
// extern.extensions = [Table]; // the table is (for some unknown reason) broken
extern.extensions = [];

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
  extern.load("Desk(-350;-198;270)[[x=-354.y=-240.t=Another.e=0]]<[]-:;[]-:;[]-61:[[t=Another.e=0]]>,Desk(-450;-198;270)[[x=-461.y=-240.t=Person.e=0]]<[]-:;[]-:;[]-61:[[t=Person.e=0]]>,Desk(-450;-98;270)[[x=-454.y=-140.t=What.e=0]]<[]-:;[]-:;[]-61:[[t=What.e=0]]>,Desk(-350;-98;270)[[x=-350.y=-137.t=Where.e=0]]<[]-:;[]-:;[]-61:[[t=Where.e=0]]>,Desk(-250;-98;270)[[x=-250.y=-137.t=When.e=0]]<[]-:;[]-:;[]-61:[[t=When.e=0]]>,Desk(-250;-198;270)[[x=-250.y=-237.t=Who.e=1]]<[]-:;[]-:;[]-61:[[t=Who.e=1]]>,Wall(-550;-329)[]-:[[w=13]],Wall(-550;121)[]-:[[w=11]],Wall(-675;-204;90)[]-:[[w=3]],Wall(25;-154;90)[]-:[[w=5]],Wall(75;71;135)[]-:,Wall(-600;71;90)[]-:[[w=0]],Block(-435;66)[]-:,Block(-435;66;45)[]-:,Surface(-250;27)[]-:,Surface(-200;27)[]-:,Chair(-219;44)[]-:,Desk(0;-99;270)[[x=0.y=-138.t=Maxwell.e=0]]<[]-:;[]-:;[]-61:[[t=Maxwell.e=0]]>,Desk(0;-199;-90)[[x=0.y=-238.t=How.e=1]]<[]-:;[]-:;[]-61:[[t=How.e=1]]>,Desk(100;-199;-90)[[x=100.y=-238.t=Baseball!.e=0]]<[]-:;[]-:;[]-61:[[t=Baseball!.e=0]]>,Desk(100;-99;-90)[[x=59.y=-140.t=Maxamillion.e=1]]<[]-:;[]-:;[]-61:[[t=Maxamillion.e=1]]>,Wall(75;171;45)[]-:,Label(-321;-390)[]-:[[t=Room of SPY.e=1]],Wall(200;221)[]-:[[w=7]],Wall(600;121;315)[]-:[[w=4]],Wall(675;-154;270)[]-:[[w=5]],Wall(200;-329)[]-:[[w=2]],Wall(475;-329)[]-:[[w=5]],Wall(700;-329)[]-:,Label(484;-390)[]-:[[t=Room of SPI.e=1]],Desk(725;-274;360)[[x=725.y=-314.t=Honey.e=0]]<[]-:;[]-:;[]-61:[[t=Honey.e=0]]>,Desk(725;-224)[[x=725.y=-264.t=Tony.e=1]]<[]-:;[]-:;[]-61:[[t=Tony.e=1]]>,Desk(675;-274;180)[[x=675.y=-314.t=Jony.e=1]]<[]-:;[]-:;[]-61:[[t=Jony.e=1]]>,Desk(675;-224;180)[[x=675.y=-264.t=Foney.e=0]]<[]-:;[]-:;[]-61:[[t=Foney.e=0]]>,Desk(675;-124;180)[[x=675.y=-164.t=Math.e=0]]<[]-:;[]-:;[]-61:[[t=Math.e=0]]>,Desk(725;-124)[[x=740.y=-162.t=Myth.e=0]]<[]-:;[]-:;[]-61:[[t=Myth.e=0]]>,Desk(675;-74;180)[[x=675.y=-114.t=Matt.e=1]]<[]-:;[]-:;[]-61:[[t=Matt.e=1]]>,Desk(725;-74)[[x=743.y=-114.t=Mytt?.e=0]]<[]-:;[]-:;[]-61:[[t=Mytt?.e=0]]>,Desk(475;-74)[[x=475.y=-114.t=Bunnee.e=0]]<[]-:;[]-:;[]-61:[[t=Bunnee.e=0]]>,Desk(475;-124)[[x=475.y=-164.t=Bon-e.e=0]]<[]-:;[]-:;[]-61:[[t=Bon-e.e=0]]>,Desk(475;-174)[[x=475.y=-214.t=Bonnie.e=0]]<[]-:;[]-:;[]-61:[[t=Bonnie.e=0]]>,Desk(475;-24)[[x=475.y=-64.t=Burner.e=0]]<[]-:;[]-:;[]-61:[[t=Burner.e=0]]>,Desk(425;-24;180)[[x=425.y=-64.t=Bunsen.e=0]]<[]-:;[]-:;[]-61:[[t=Bunsen.e=0]]>,Desk(425;-74;180)[[x=425.y=-114.t=Bunny.e=0]]<[]-:;[]-:;[]-61:[[t=Bunny.e=0]]>,Desk(425;-124;180)[[x=425.y=-164.t=Bon-ee.e=0]]<[]-:;[]-:;[]-61:[[t=Bon-ee.e=0]]>,Desk(425;-174;180)[[x=425.y=-214.t=Bonny.e=0]]<[]-:;[]-:;[]-61:[[t=Bonny.e=0]]>,Wall(200;71;90)[]-:[[w=4]],Wall(250;-79)[]-:[[w=0]],Block(215;166)[]-:,Block(215;166;45)[]-:,Block(265;166)[]-:,Block(265;166;45)[]-:,Block(240;141)[]-:,Block(240;141;45)[]-:,Surface(525;101)[]-:,Surface(575;101)[]-:,Chair(557;120)[]-:,Desk(250;-274;225)[[x=234.y=-315.t=Tommy.e=1]]<[]-:;[]-:;[]-61:[[t=Tommy.e=1]]>,Block(490;-9;45)[]-:,Label(-202;-23;15)[]-16:[[t=Instructor Guy.e=1]],Label(382;64;345)[]-56:[[t=Someone?.e=1]]");
}
