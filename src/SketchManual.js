import * as debugLayer from "./TransparencyLayer.js";

export class SketchManual {
  constructor(settings) {
    if (settings == undefined) {
      this.settings = {
        supportsSmallScreen: false,
        supportsTouchDevice: true,
      };
    } else {
      this.settings = settings;
    }

    this.appDomElement = document.getElementById("app");
    this.smallScreenNote = document.getElementById("small-screen-note");
  }

  setSmallScreenGuides(value) {
    if (value && !this.settings.supportsSmallScreen) {
      this.smallScreenNote.style.display = "block";
      this.appDomElement.style.display = "none";
    } else {
      this.smallScreenNote.style.display = "none";
      this.appDomElement.style.display = "flex";
    }
  }
}
