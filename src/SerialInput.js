import { SerialPort } from "./SerialPort";

export class SerialInput {
  constructor(baudRate) {
    if ("serial" in navigator) {
      console.log("serial supported");
    } else {
      console.log("serial not supported");
    }

    this.baudRate = baudRate;
    this.connected = false;
    this.serialData;
    this.serial = new SerialPort();
    console.log(this.serial);
    this.portButton = document.getElementById("serial-button");

    if (navigator.serial) {
      this.serial.on("data", (e) => this.serialRead(e));
      this.serial.on("disconnect", (e) => this.disconnect(e));
      this.portButton.addEventListener("click", () => this.openClosePort());
    }
  }

  async openClosePort() {
    // if port is open, close it; if closed, open it:
    console.log(this.serial);
    if (this.serial.port) {
      await this.serial.closePort();
      this.connected = false;
      this.portButton.innerHTML = "Open Port";
    } else {
      await this.serial.openPort(this.baudRate);
      this.connected = true;
      this.portButton.innerHTML = "Close Port";
    }
  }

  serialRead(event) {
    this.serialData = event.detail.data;
  }

  disconnect(event) {
    console.log("disconnect");
    console.log(event);
    this.connected = false;
    this.portButton.innerHTML = "Open Port";
  }
}
