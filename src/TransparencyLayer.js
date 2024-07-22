export class TransparencyLayer {
  constructor() {
    this.transparencyLayerElement =
      document.getElementById("transparency-layer");
    this.debugLayerElement = document.getElementById("debug-layer");
    this.active = false;
    this.debugObjects = [];

    this.setActive(false);
  }

  toggle() {
    console.log("toggle debug layer");
    const value = !this.active;
    this.setActive(value);
  }

  setActive(value) {
    this.transparencyLayerElement.style.display = value ? "flex" : "none";
    this.active = value;
  }

  addObject(object, name) {
    let debugElements = {};
    const debugObjectElement = this.createDebugObjectElement(name);
    Object.entries(object).forEach(([key, value]) => {
      const debugElement = this.createDebugElement(key, value);
      debugElements[key] = debugElement;
      debugObjectElement.appendChild(debugElement);
    });
    const debugObject = { object: object, debugElements: debugElements };
    console.log(debugObject);
    this.debugObjects.push(debugObject);
    this.debugLayerElement.appendChild(debugObjectElement); // add to HTML
  }

  updateDebug() {
    if (this.active) {
      this.debugObjects.forEach((debugObject) => {
        Object.entries(debugObject.object).forEach(([key, value]) => {
          const debugElement = debugObject.debugElements[key];
          if (debugElement) this.updateDebugElement(debugElement, value);
        });
      });
    }
  }

  updateDebugElement(debugElement, value) {
    debugElement.children[0].innerText = value;
  }

  createDebugObjectElement(name) {
    const debugObjectElement = document.createElement("div");
    debugObjectElement.classList.add("debug-object");
    const debugObjectHeadline = document.createElement("h3");
    debugObjectHeadline.innerText = name;
    debugObjectElement.appendChild(debugObjectHeadline);
    return debugObjectElement;
  }

  createDebugElement(name, value) {
    const debugElement = document.createElement("div");
    debugElement.classList.add("debug-prop");
    debugElement.innerText = name + ": ";
    const propertyVal = document.createElement("span");
    propertyVal.classList.add("debug-val");
    propertyVal.innerText = value;
    debugElement.appendChild(propertyVal);
    return debugElement;
  }
}
