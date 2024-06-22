import * as debugLayer from "./TransparencyLayer.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";

export class ThreeExporter {
  constructor(settings) {
    this.gltfExporter = new GLTFExporter();
  }

  exportGlTF(scene) {
    this.gltfExporter.parse(
      scene,
      // called when the gltf has been generated
      (gltf) => {
        console.log(gltf);
        this.downloadGLTF("export.glb", gltf);
      },
      // called when there is an error in the generation
      function (error) {
        console.log("An error happened");
      },
      {}
    );
  }

  downloadGLTF(fileName, gltf) {
    const blob = new Blob([JSON.stringify(gltf)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.style = "display: none;";
    a.href = url;
    a.download = fileName;

    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 0);
  }
}
