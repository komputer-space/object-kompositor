import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { ThreeExporter } from "./ThreeExporter";
import { FileImporter } from "./FileImporter";
import { GamePadInput } from "./GamePadInput";
import { SerialInput } from "./SerialInput";
import { InfoLayer } from "./InfoLayer";

export class ObjectCompositor {
  constructor(canvas) {
    this.transparencyMode = false;
    this.freeze = false;
    this.idle = false;

    this.exampleIndex = 0;
    this.examples = ["goethe", "macintosh", "stuhl", "mate"];

    this.exporter = new ThreeExporter();
    this.loader = new FileImporter(this);

    this.infoLayer = new InfoLayer();

    this.gltfLoader = new GLTFLoader();
    this.textureLoader = new THREE.TextureLoader();

    // -------

    this.canvas = canvas;

    this.currentFilter = 0;

    this.gamePadInput = new GamePadInput();
    this.serialInput = new SerialInput(115200);
    document.addEventListener("keydown", (e) => this.processKeyInput(e));

    this.setupScene();

    this.importGlTF("/examples/goethe.glb");
    this.applyMaterialFilter(3);
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      preserveDrawingBuffer: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0x000000, 0);

    // this.mainLight = new THREE.DirectionalLight(0xffffff, 5);
    this.mainLight = new THREE.AmbientLight(0xffffff);
    this.mainLight.position.z = 5;
    this.scene.add(this.mainLight);

    const ambientLight = new THREE.AmbientLight(0x000000);
    this.scene.add(ambientLight);

    const light1 = new THREE.DirectionalLight(0xffffff, 2);
    light1.position.set(0, 10, 0);
    this.scene.add(light1);
    // const helper1 = new THREE.DirectionalLightHelper(light1, 1);
    // this.scene.add(helper1);

    const light2 = new THREE.DirectionalLight(0xffffff, 2);
    light2.position.set(5, 10, 7);
    this.scene.add(light2);
    // const helper2 = new THREE.DirectionalLightHelper(light2, 1);
    // this.scene.add(helper2);
    // const light3 = new THREE.DirectionalLight(0xffffff, 2);
    // light3.position.set(-10, -20, -10);
    // this.scene.add(light3);
    // const helper3 = new THREE.DirectionalLightHelper(light3, 1);
    // this.scene.add(helper3);

    this.orbitControls = new OrbitControls(
      this.camera,
      this.renderer.domElement
    );

    this.objects = [];
  }

  // --- CORE METHODS

  update() {
    if (!this.freeze) {
      if (this.objects.length > 0) {
        this.gamePadInput.update();
        this.applyGamepadInput();
        this.processSerialData();
      }
      this.orbitControls.update();
    }

    this.renderer.render(this.scene, this.camera);
  }

  resize(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  loadNewExample() {
    console.log("loading next example");
    this.exampleIndex++;
    if (this.exampleIndex >= this.examples.length) this.exampleIndex = 0;
    const fileName = this.examples[this.exampleIndex];
    this.importGlTF("/examples/" + fileName + ".glb", true);
  }

  setViewMode(value) {
    this.freeze = value;
  }

  setTransparencyMode(value) {
    this.transparencyMode = value;
    this.setWireframe(value);
  }

  setIdleMode(value) {
    this.idle = value;
    this.orbitControls.autoRotate = value;
  }

  // --- INPUTS

  applyGamepadInput() {
    const activeObject = this.objects[this.objects.length - 1];

    if (this.gamePadInput.rotationMode && !this.serialInput.connected) {
      activeObject.rotation.x +=
        ((5 * Math.PI) / 360) * this.gamePadInput.control.x;
      activeObject.rotation.z -=
        ((5 * Math.PI) / 360) * this.gamePadInput.control.z;
      activeObject.rotation.y +=
        ((5 * Math.PI) / 360) * this.gamePadInput.control.y;
    } else {
      activeObject.position.x += 0.05 * this.gamePadInput.control.x;
      activeObject.position.z += 0.05 * this.gamePadInput.control.z;
      activeObject.position.y -= 0.05 * this.gamePadInput.control.y;
    }
  }

  processSerialData() {
    if (this.serialInput.connected && this.serialInput.serialData) {
      // console.log(this.serialInput.serialData);
      const input = this.serialInput.serialData.slice(1, -1);
      const splitted = input.split(".");
      let data = [];
      data[0] = ((splitted[0] << 8) | splitted[1]) / 16384.0;
      data[1] = ((splitted[2] << 8) | splitted[3]) / 16384.0;
      data[2] = ((splitted[4] << 8) | splitted[5]) / 16384.0;
      data[3] = ((splitted[6] << 8) | splitted[7]) / 16384.0;
      for (let i = 0; i < 4; i++) if (data[i] >= 2) data[i] = -4 + data[i];
      const q = data.slice(0, 4);
      const qTransformed = [q[1], q[3], -q[2], q[0]]; // fix axes

      // q[3] = THREE.MathUtils.degToRad(q[3]) * 0.01;
      const quat = new THREE.Quaternion();
      quat.fromArray(qTransformed);
      quat.normalize();

      const activeObject = this.objects[this.objects.length - 1];
      activeObject.setRotationFromQuaternion(quat);
    }
  }

  processKeyInput(e) {
    if (e.code.includes("Digit")) {
      this.applyMaterialFilter(parseInt(e.code.slice(-1)));
    } else if (e.code == "KeyX") {
      this.resetScene();
    } else if (e.code == "Tab") {
      // TODO: Load example files
    }
  }

  // --- CUSTOM METHODS

  setWireframe(value) {
    this.objects.forEach((obj) => {
      obj.traverse((element) => {
        if (element.material) {
          element.material.wireframe = value;
          // element.material.needsUpdate = true;
        }
      });
    });
  }

  updateObjects() {
    this.setWireframe(this.transparencyMode);
    this.applyMaterialFilter(this.currentFilter);
  }

  replaceObject(newObject) {
    console.log("replace");
    console.log(newObject);
    const oldObject = this.objects[this.objects.length - 1];
    this.scene.remove(oldObject);
    this.objects.pop();
    this.objects.push(newObject);
    if (oldObject) newObject.applyMatrix4(oldObject.matrix);
    this.scene.add(newObject);
    this.updateObjects();
  }

  addObject(newObject) {
    console.log("add");
    console.log(newObject);
    this.objects.push(newObject);
    this.scene.add(newObject);
    this.updateObjects();
  }

  adaptObjectToScene(object) {
    console.log("adapt");
    const box = new THREE.Box3().setFromObject(object);
    const offsetPosition = box.getCenter(new THREE.Vector3());
    const scaleFactor = 2.5 / box.getSize(new THREE.Vector3()).y;
    console.log(scaleFactor);
    const wrapperObject = new THREE.Group();
    wrapperObject.add(object);
    const adaptedPosition = object.position.clone().sub(offsetPosition);
    object.position.copy(adaptedPosition.multiplyScalar(scaleFactor));
    object.scale.multiplyScalar(scaleFactor);
    wrapperObject.traverse((obj) => {
      obj.receiveShadow = false;
      if (obj.isMesh) obj.geometry.computeVertexNormals();
    });

    // wrapperObject.userData = {ogMaterial: }

    console.log(wrapperObject);
    return wrapperObject;
  }

  resetScene() {
    console.log("reset");
    this.objects.forEach((object) => {
      this.scene.remove(object);
    });
    this.objects = [];
  }

  applyTexture(texture) {
    this.objects.forEach((obj) => {
      obj.traverse((element) => {
        // console.log(element.material)
        if (element.material) {
          element.material.map = texture;
          console.log("update texture");
          console.log(element.material);
          // element.material.needsUpdate = true;
        }
      });
    });
  }

  applyMaterial(newMaterial) {
    this.objects.forEach((obj) => {
      obj.traverse((element) => {
        if (element.material) {
          element.material = newMaterial;
          // element.material.needsUpdate = true;
        }
      });
    });
  }

  applyMaterialFilter(index) {
    switch (index) {
      case 1:
        const silhouMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.applyMaterial(silhouMaterial);
        break;
      case 2:
        const normalMaterial = new THREE.MeshNormalMaterial();
        this.applyMaterial(normalMaterial);
        break;
      case 3:
        const matcap = new THREE.MeshMatcapMaterial();
        this.applyMaterial(matcap);
        break;
      case 4:
        const toon = new THREE.MeshToonMaterial({ color: 0xff4500 });
        this.applyMaterial(toon);
        break;
      case 5:
        const shiny = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          emissive: 0x000000,
          roughness: 0.3,
          metalness: 1.1,
        });
        this.applyMaterial(shiny);
        break;
      case 6:
        const shiny2 = new THREE.MeshStandardMaterial({
          color: 0x00ffd5,
          roughness: 0.3,
          metalness: 0.8,
        });
        this.applyMaterial(shiny2);
        break;
      default:
        break;
    }
    this.currentFilter = index;
    this.setWireframe(this.transparencyMode);
  }

  // --- FILE EXPORTS

  exportScene() {
    this.exporter.exportGlTF(this.scene);
  }

  // --- FILE IMPORTS

  importGlTF(url, replace = false) {
    this.infoLayer.setActive(true);
    this.gltfLoader.load(
      url,
      (gltf) => {
        let importedObject = gltf.scene;
        importedObject = this.adaptObjectToScene(importedObject);
        if (replace) {
          this.replaceObject(importedObject);
        } else {
          this.addObject(importedObject);
        }
        this.infoLayer.setActive(false);
      },
      function (xhr) {
        this.infoLayer.showLoadingIndicator(
          Math.round((xhr.loaded / xhr.total) * 100)
        );
      }.bind(this),
      function (error) {
        console.log("could not load object");
        console.error(error);
        reject();
      }
    );
  }

  importImage(url) {
    this.infoLayer.setActive(true);
    this.infoLayer.showInfo("processing …");
    this.textureLoader.load(
      url,
      (texture) => {
        this.applyTexture(texture);
        this.infoLayer.setActive(false);
      },
      undefined,
      function (error) {
        console.log("could not load texture");
        console.error(error);
        reject();
      }
    );
  }
}
