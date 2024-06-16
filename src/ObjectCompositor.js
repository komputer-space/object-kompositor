import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { ThreeExporter } from "./ThreeExporter";
import { FileImporter } from "./FileImporter";
import { GamePadInput } from "./GamePadInput";
import { SerialInput } from "./SerialInput";
import { color } from "three/examples/jsm/nodes/Nodes.js";

export class ObjectCompositor {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();

    this.gltfLoader = new GLTFLoader();
    this.textureLoader = new THREE.TextureLoader();

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

    // const geometry = new THREE.BoxGeometry(1, 1, 1);
    // const material = new THREE.MeshBasicMaterial({ map: null });
    // const cube = new THREE.Mesh(geometry, material);
    // this.scene.add(cube);
    // this.objects.push(cube);

    this.exporter = new ThreeExporter();
    this.loader = new FileImporter(this);

    this.importGlTF("/objects/goethe.glb");

    this.gamePadInput = new GamePadInput();
    this.serialInput = new SerialInput(115200);
    document.addEventListener("keydown", (e) => this.processKeyInput(e));
  }

  update() {
    if (this.objects.length > 0) {
      this.gamePadInput.update();
      this.applyGamepadInput();
      this.processSerialData();
    }
    this.orbitControls.update();
    this.renderer.render(this.scene, this.camera);
  }

  setViewMode(value) {}

  setTransparencyMode(value) {
    this.objects.forEach((obj) => {
      obj.traverse((element) => {
        // console.log(element.material)
        if (element.material) {
          element.material.wireframe = value;
          element.material.needsUpdate = true;
        }
      });
    });
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
  }

  addObject(newObject) {
    console.log("add");
    console.log(newObject);
    this.objects.push(newObject);
    this.scene.add(newObject);
  }

  adaptObjectToScene(object) {
    console.log("adapt");
    const box = new THREE.Box3().setFromObject(object);
    const offsetPosition = box.getCenter(new THREE.Vector3());
    const scaleFactor = 2 / box.getSize(new THREE.Vector3()).y;
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
    if (this.serialInput.connected) {
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
    }
  }

  exportScene() {
    this.exporter.exportGlTF(this.scene);
  }

  applyTexture(texture) {
    this.objects.forEach((obj) => {
      obj.traverse((element) => {
        // console.log(element.material)
        if (element.material) {
          element.material.map = texture;
          console.log("update texture");
          console.log(element.material);
          element.material.needsUpdate = true;
        }
      });
    });
  }

  applyMaterial(newMaterial) {
    this.objects.forEach((obj) => {
      obj.traverse((element) => {
        if (element.material) {
          element.material = newMaterial;
          element.material.needsUpdate = true;
        }
      });
    });
  }

  applyMaterialFilter(index) {
    console.log(index);
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
  }

  // --- FILE IMPORTS

  importGlTF(url) {
    this.gltfLoader.load(
      url,
      (gltf) => {
        let importedObject = gltf.scene;
        importedObject = this.adaptObjectToScene(importedObject);
        this.addObject(importedObject);
      },
      undefined,
      function (error) {
        console.log("could not load object");
        console.error(error);
        reject();
      }
    );
  }

  importImage(url) {
    this.textureLoader.load(
      url,
      (texture) => {
        this.applyTexture(texture);
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
