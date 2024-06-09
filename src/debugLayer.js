const debugLayerElement = document.getElementById("debug-layer");

const debug = {
  debugActive: false,
};

const debugObjects = [];

export function initDebugLayer() {
  addObject(debug);
  setDebugLayerActive(false);
}

export function isDebugActive() {
  return debug.debugActive;
}

export function toggleDebugLayer() {
  console.log("toggle debug layer");
  const value = !debug.debugActive;
  setDebugLayerActive(value);
}

export function setDebugLayerActive(value) {
  debugLayerElement.style.display = value ? "flex" : "none";
  debug.debugActive = value;
}

export function addObject(object) {
  let debugElements = {};
  Object.entries(object).forEach(([key, value]) => {
    const debugElement = createDebugElement(key, value);
    debugElements[key] = debugElement;
  });
  const debugObject = { object: object, debugElements: debugElements };
  console.log(debugObject);
  debugObjects.push(debugObject);
}

export function updateDebug() {
  if (debug.debugActive) {
    debugObjects.forEach((debugObject) => {
      Object.entries(debugObject.object).forEach(([key, value]) => {
        const debugElement = debugObject.debugElements[key];
        updateDebugElement(debugElement, value);
      });
    });
  }
}

function updateDebugElement(debugElement, value) {
  debugElement.children[0].innerText = value;
}

function createDebugElement(name, value) {
  const debugElement = document.createElement("div");
  debugElement.classList.add("debug-prop");
  debugElement.innerText = name + ": ";
  const propertyVal = document.createElement("span");
  propertyVal.classList.add("debug-val");
  propertyVal.innerText = value;
  debugElement.appendChild(propertyVal);
  debugLayerElement.appendChild(debugElement);
  return debugElement;
}
