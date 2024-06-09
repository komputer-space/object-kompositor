export class CanvasExporter {
  constructor(canvas) {
    this.canvas = canvas;
    this.mediaRecorder;
    this.recording = false;
  }

  saveImage() {
    const imageURL = this.canvas.toDataURL();
    this.downloadFile("image.png", imageURL);
  }

  toggleRecord() {
    if (this.recording) {
      this.mediaRecorder.stop();
      this.recording = false;
    } else {
      this.startRecord();
      this.recording = true;
    }
  }

  startRecord() {
    console.log("start recording");
    let chunks = [];
    let canvasStrem = this.canvas.captureStream(30); // fps
    // Create media recorder from canvas stream
    // Record data in chunks array when data is available
    this.mediaRecorder = new MediaRecorder(canvasStrem);
    this.mediaRecorder.ondataavailable = (e) => {
      console.log("data");
      chunks.push(e.data);
    };
    // Provide recorded data when recording stops
    this.mediaRecorder.onstop = () => {
      this.onRecorderStop(chunks);
    };
    // Start recording using a 1s timeslice [ie data is made available every 1s)
    this.mediaRecorder.start();
  }

  onRecorderStop(chunks) {
    console.log("stop recording");
    // Gather chunks of video data into a blob and create an object URL
    var blob = new Blob(chunks, { type: "video/mp4" });
    const recordingURL = URL.createObjectURL(blob);
    this.downloadFile("video.webm", recordingURL);
  }

  downloadFile(fileName, url) {
    // Attach the object URL to an <a> element, setting the download file name
    const a = document.createElement("a");
    a.style = "display: none;";
    a.href = url;
    a.download = fileName;

    document.body.appendChild(a);
    // Trigger the file download
    a.click();
    setTimeout(() => {
      // Clean up - see https://stackoverflow.com/a/48968694 for why it is in a timeout
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 0);
  }
}
