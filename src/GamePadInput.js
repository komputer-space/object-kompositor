import * as THREE from "three";

export class GamePadInput {
  constructor() {
    this.supported =
      (navigator.webkitGetGamepads && navigator.webkitGetGamepads()) ||
      !!navigator.webkitGamepads ||
      !!navigator.mozGamepads ||
      !!navigator.msGamepads ||
      !!navigator.gamepads ||
      (navigator.getGamepads && navigator.getGamepads());

    this.ticking = false;

    // this.pan = new THREE.Vector3(0, 0, 0);
    // this.roll = new THREE.Vector3(0, 0, 0);
    this.control = new THREE.Vector3(0, 0, 0);

    this.rotationMode = false;

    this.lastSwitchButtonState = false;

    // Recommended deadzones for Xbox One controller
    this.RIGHT_AXIS_THRESHOLD = 7849 / 32767.0;
    this.LEFT_AXIS_THRESHOLD = 8689 / 32767.0;
    this.TRIGGER_AXIS_THRESHOLD = 30 / 32767.0;

    this.SPACEMOUSE_THRESHOLD = 5 / 32767.0;

    this.gamepads = [];
    this.prevRawGamepadTypes = [];
    this.prevTimestamps = [];

    this.init();
  }

  init() {
    if (this.supported) {
      // Older Firefox
      window.addEventListener(
        "MozGamepadConnected",
        (e) => this.onGamepadConnect(e),
        false
      );
      window.addEventListener(
        "MozGamepadDisconnected",
        (e) => this.onGamepadDisconnect(e),
        false
      );

      //W3C Specification
      window.addEventListener(
        "gamepadconnected",
        (e) => this.onGamepadConnect(e),
        false
      );
      window.addEventListener(
        "gamepaddisconnected",
        (e) => this.onGamepadDisconnect(e),
        false
      );

      // Chrome
      if (navigator.webkitGetGamepads && navigator.webkitGetGamepads()) {
        this.startPolling();
      }

      //CocoonJS
      if (navigator.getGamepads && navigator.getGamepads()) {
        this.startPolling();
      }
    } else {
      console.log("Gamepad API not supported or not detected!");
    }
  }

  startPolling() {
    console.log("Controller Connected!");
    if (!this.ticking) {
      this.ticking = true;
      this.update();
    }
  }

  stopPolling() {
    console.log("Controller Disconnected!");
    this.ticking = false;
  }

  // Called externally
  update() {
    this.pollStatus();
    if (this.ticking) {
      this.pollJoysticks();
      //requestAnimationFrame(() => this.tick());
    }
  }

  pollStatus() {
    this.pollGamepads();
    for (let i in this.gamepads) {
      let gamepad = this.gamepads[i];
      if (gamepad.timestamp && gamepad.timestamp === this.prevTimestamps[i]) {
        continue;
      }
      this.prevTimestamps[i] = gamepad.timestamp;
    }
  }

  pollGamepads() {
    let rawGamepads =
      (navigator.webkitGetGamepads && navigator.webkitGetGamepads()) ||
      navigator.webkitGamepads ||
      navigator.mozGamepads ||
      navigator.msGamepads ||
      navigator.gamepads ||
      (navigator.getGamepads && navigator.getGamepads());
    if (rawGamepads) {
      this.gamepads = [];
      for (let i = 0, max = rawGamepads.length; i < max; i++) {
        if (typeof rawGamepads[i] !== this.prevRawGamepadTypes[i]) {
          this.prevRawGamepadTypes[i] = typeof rawGamepads[i];
        }
        if (rawGamepads[i]) {
          this.gamepads.push(rawGamepads[i]);
        }
      }
    }
  }

  pollJoysticks() {
    let pad = 0;

    // Reset all input to 0
    this.pan = new THREE.Vector3(0, 0, 0);
    this.roll = new THREE.Vector3(0, 0, 0);
    this.control = new THREE.Vector3(0, 0, 0);

    if (this.gamepads[pad]) {
      const switchButtonState = this.gamepads[pad].buttons[10].pressed;
      if (
        !switchButtonState &&
        switchButtonState != this.lastSwitchButtonState
      ) {
        console.log("switch mode");
        this.rotationMode = !this.rotationMode;
      }
      this.lastSwitchButtonState = switchButtonState;

      if (this.rotationMode) {
        let rollX = this.gamepads[pad].axes[1]; // Roll X || Right Y
        let rollY = this.gamepads[pad].axes[0]; // Roll Y || Trigger Left
        let rollZ = this.gamepads[pad].axes[2]; // Roll Z || Trigger Right

        this.control.x = rollX;
        this.control.y = rollY;
        this.control.z = rollZ;
      } else {
        let panX = this.gamepads[pad].axes[0]; // Pan  X || Left X
        let panY = this.gamepads[pad].axes[1]; // Pan  Y || Left Y
        let panZ = this.gamepads[pad].axes[3]; // Pan  Z || Right X

        this.control.x = panX;
        this.control.y = panY;
        this.control.z = panZ;
      }
    }
  }

  onGamepadConnect(event) {
    console.log(event);
    let gamepad = event.gamepad;
    this.gamepads[event.gamepad.id] = gamepad;
    this.startPolling();
  }

  onGamepadDisconnect(event) {
    this.gamepads[event.gamepad.id] = null;
    if (this.gamepads.length === 0) {
      this.stopPolling();
    }
  }
}
