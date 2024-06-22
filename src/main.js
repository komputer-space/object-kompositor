import "./styles/global.scss";
import { TransparencyLayer } from "./TransparencyLayer.js";
import { ObjectCompositor } from "./ObjectCompositor.js";
import { SketchManual } from "./SketchManual.js";
import { CanvasExporter } from "./CanvasExporter.js";
// import { SerialInput } from "./SerialInput.js";

const app = {
  viewMode: false,
  transparencyMode: false,
  smallScreen: false,
  touchDevice: false,
  domElement: document.getElementById("app"),
  canvas: document.getElementById("canvas"),
};

function setup() {
  app.sketchManual = new SketchManual();
  app.canvasExporter = new CanvasExporter(app.canvas);
  // app.serialInput = new SerialInput(115200);
  app.objectCompositor = new ObjectCompositor(app.canvas);

  app.transparencyLayer = new TransparencyLayer();
  app.transparencyLayer.addObject(app, "Application");
  app.transparencyLayer.addObject(app.transparencyLayer, "Transparency Layer");
  app.transparencyLayer.addObject(app.sketchManual.settings, "Settings");
  app.transparencyLayer.addObject(app.objectCompositor, "Object Kompositor");
  app.transparencyLayer.addObject(
    app.objectCompositor.gamePadInput,
    "Gamepad Controls"
  );

  setTransparencyMode(true);

  document.onkeydown = processKeyInput;

  window.onresize = resize;
  resize();

  update();
}

function update() {
  app.objectCompositor.update();
  app.transparencyLayer.updateDebug();
  requestAnimationFrame(update);
}

setup();

// ---------

function processKeyInput(e) {
  switch (e.code) {
    case "Space":
      toggleViewMode();
      break;
    case "KeyD":
      toggleTransparencyMode();
      break;
    case "KeyR":
      app.canvasExporter.toggleRecord();
      break;
    case "KeyS":
      if (app.viewMode) app.canvasExporter.saveImage();
      break;
    case "KeyO":
      if (app.viewMode) app.objectCompositor.exportScene();
      break;
  }
}

function toggleViewMode() {
  console.log("toggle view mode");
  app.viewMode = !app.viewMode;
  app.objectCompositor.setViewMode(app.viewMode);
}

function toggleTransparencyMode() {
  console.log("toggle transparency layer");
  const active = !app.transparencyMode;
  setTransparencyMode(active);
}

function setTransparencyMode(val) {
  app.transparencyMode = val;
  app.transparencyLayer.setActive(val);
  app.objectCompositor.setTransparencyMode(val);
}

function resize() {
  const width = window.innerWidth;
  if (width < 600) {
    app.smallScreen = true;
    app.sketchManual.setSmallScreenGuides(true);
  } else {
    app.smallScreen = false;
    app.sketchManual.setSmallScreenGuides(false);
  }
}

// ---------

export function importGlTF(object) {
  replaceObject(object);
}

export function importImage(url) {
  document.getElementById("img").src = url;
}
