import "./styles/global.scss";
import { TransparencyLayer } from "./TransparencyLayer.js";
import { ObjectCompositor } from "./ObjectCompositor.js";
import { SketchManual } from "./SketchManual.js";
import { CanvasExporter } from "./CanvasExporter.js";

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
  app.tool = new ObjectCompositor(app.canvas);

  app.transparencyLayer = new TransparencyLayer();
  app.transparencyLayer.addObject(app, "Application");
  app.transparencyLayer.addObject(app.transparencyLayer, "Transparency Layer");
  app.transparencyLayer.addObject(app.sketchManual.settings, "Settings");
  app.transparencyLayer.addObject(app.tool, "Object Kompositor");
  app.transparencyLayer.addObject(app.tool.gamePadInput, "Gamepad Controls");

  setTransparencyMode(true);

  document.onkeydown = processKeyInput;

  window.onresize = resize;
  resize();
  update();
}

function update() {
  app.tool.update();
  app.transparencyLayer.updateDebug();
  requestAnimationFrame(update);
}

setup();

// ---------

function processKeyInput(e) {
  document.activeElement.blur();
  switch (e.code) {
    case "Space":
      toggleViewMode();
      break;
    case "KeyF":
      toggleTransparencyMode();
      break;
    case "KeyR":
      app.canvasExporter.toggleRecord();
      break;
    case "KeyS":
      if (app.viewMode) app.canvasExporter.saveImage();
      break;
    case "KeyO":
      if (app.viewMode) app.tool.exportScene();
      break;
    case "Escape":
      window.location.replace("https://toolbox.komputer.space");
      break;
  }
}

function toggleViewMode() {
  console.log("toggle view mode");
  app.viewMode = !app.viewMode;
  const viewModeIndicator = document.getElementById("view-mode-indicator");
  viewModeIndicator.style.display = app.viewMode ? "flex" : "none";
  app.tool.setViewMode(app.viewMode);
}

function toggleTransparencyMode() {
  console.log("toggle transparency layer");
  const active = !app.transparencyMode;
  setTransparencyMode(active);
}

function setTransparencyMode(val) {
  app.transparencyMode = val;
  app.transparencyLayer.setActive(val);
  app.tool.setTransparencyMode(val);
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  app.tool.resize(width, height);
  if (width < 600) {
    app.smallScreen = true;
    app.sketchManual.setSmallScreenGuides(true);
  } else {
    app.smallScreen = false;
    app.sketchManual.setSmallScreenGuides(false);
  }
}
