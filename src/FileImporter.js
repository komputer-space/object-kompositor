export class FileImporter {
  constructor(processor) {
    this.dropZone = document.getElementById("dropzone");
    this.processor = processor;

    console.log("init file loader");
    this.dropZone.ondrop = (e) => this.dropHandler(e);
    this.dropZone.ondragover = (e) => this.dragOverHandler(e);
    this.dropZone.ondragleave = (e) => this.dragLeaveHandler(e);
  }

  async dropHandler(e) {
    console.log("File(s) dropped");
    // Prevent default behavior (Prevent file from being opened)
    e.preventDefault();
    this.dropZone.classList.remove("active");
    const file = e.dataTransfer.files[0];
    console.log(file);
    if (file) {
      const fileExtension = file.name.split(".").pop();
      console.log("file extension: " + fileExtension);

      let fileURL;

      switch (fileExtension) {
        case "jpg":
        case "jpeg":
        case "png":
        case "webp":
        case "JPG":
        case "JPEG":
        case "PNG":
        case "WEBP":
          console.log("filetype: image");
          fileURL = await this.readFile(file);
          this.processor.importImage(fileURL);
          break;
        case "gltf":
        case "glb":
          console.log("filetype: gltf");
          fileURL = await this.readFile(file);
          this.processor.importGlTF(fileURL);
          break;
        default:
          console.log("not a valid file");
          return;
      }
    }
  }

  dragOverHandler(e) {
    // console.log("File(s) in drop zone");
    e.preventDefault();
    this.dropZone.classList.add("active");
  }

  dragLeaveHandler(e) {
    console.log("drag end");
    e.preventDefault();
    this.dropZone.classList.remove("active");
  }

  readFile(file) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    return new Promise((resolve) => {
      reader.onload = function (e) {
        let url = e.target.result;
        // console.log(url);
        resolve(url);
      };
    });
  }
}
