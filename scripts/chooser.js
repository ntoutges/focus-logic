var $ = window.$;

var allIds = [ "classType", "logicType" ]
$("body").mousemove((e) => {
  if (e.pageX > $("#logicType").get(0).getBoundingClientRect().right ) // on right side of screen
    changeSelected( "classType" );
  else // on left side of screen
    changeSelected( "logicType" );
});

$("body").mouseleave((e) => {
  changeSelected("");
});

var prevId = "";
function changeSelected(id) {
  if (prevId != id) {
    if (id != "") {
      $(`#${id}`).attr("data-selected", "1");
      for (let dimId of allIds) {
        $(`#${dimId}`).css("opacity", (dimId == id) ? "" : "0.2");
      }
      $(`#${id}`).attr("data-selected", "2");
      loadBackground(id);
    }
    else {
      clearBackground();
      for (let dimId of allIds) {
        $(`#${dimId}`).css("opacity", "");
      }
    }
    if (prevId != "") {
      $(`#${prevId}`).removeAttr("data-selected");
    }
    prevId = id;
  }
}

var backgroundKey = {
  "logicType": "focusLogic",
  "classType": "focusClass",
}
var backgrounds = [];

function loadBackground(id) {
  clearBackground(false);
  const background = $(`<iframe class=\"backgrounds\" src=\"${backgroundKey[id]}.html?idle\"></iframe>`);
  backgrounds.push(background);
  $("body").append(background);
  background.css("display", "block");
  background.get(0).offsetHeight; // trigger a css "reflow"
  background.css("opacity", "1");
  background.css("left", "0vw");
  background.css("top", "0vh");
}

function clearBackground(all=true) {
  if (all) {
    backgrounds.forEach(() => {
      clearBackground(false);
    });
    return;
  }
  if (backgrounds.length == 0) return;
  const background = backgrounds.splice(0,1)[0]; // remove first background
  background.css("opacity", "");
  setTimeout(() => {
    background.remove();
  }, 1000);
}

for (let id in backgroundKey) {
  const button = $(`#${id}`);
  button.mousedown(function() { $(this).css("opacity", "0.9"); });
  button.mouseleave(function() { $(this).css("opacity", ""); })
  button.click(() => { window.location.href = `/${backgroundKey[id]}.html`; });
}