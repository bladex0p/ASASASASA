/* -------------------------
   Interactive PDF Voice Notes
   ------------------------- */

const pdfContainer = document.getElementById("pdf-container");
const pdfUrl = "LBG_Gold_Account_Sales_Script.pdf"; // your PDF file

// Load PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

// Render PDF
pdfjsLib.getDocument(pdfUrl).promise.then(async (pdf) => {
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const scale = 1.2;
    const viewport = page.getViewport({ scale });

    // Canvas for PDF page
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    canvas.style.display = "block";
    canvas.style.marginBottom = "10px";
    pdfContainer.appendChild(canvas);

    // Render PDF page
    await page.render({ canvasContext: context, viewport }).promise;

    // Render links only
    const annotations = await page.getAnnotations({ intent: "display" });
    annotations.forEach((annotation) => {
      if (annotation.subtype === "Link" && annotation.url) {
        const link = document.createElement("a");
        link.href = annotation.url;
        link.target = "_blank";
        link.style.position = "absolute";
        link.style.left = `${annotation.rect[0] * scale}px`;
        link.style.top = `${canvas.offsetTop + (viewport.height - annotation.rect[3] * scale)}px`;
        link.style.width = `${(annotation.rect[2] - annotation.rect[0]) * scale}px`;
        link.style.height = `${(annotation.rect[3] - annotation.rect[1]) * scale}px`;
        link.style.zIndex = 50;
        link.style.background = "rgba(0,0,255,0.1)"; // optional: temporary highlight
        pdfContainer.appendChild(link);
      }
    });
  }
});

// ----- Right-click to add controls -----
pdfContainer.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  const rect = pdfContainer.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  addAudioControls(x, y);
});

// ----- Draggable audio controls function -----
function addAudioControls(x, y) {
  const div = document.createElement("div");
  div.className = "audio-controls";
  div.style.position = "absolute";
  div.style.left = `${x}px`;
  div.style.top = `${y}px`;
  div.style.background = "rgba(255,255,255,0.9)";
  div.style.padding = "6px";
  div.style.borderRadius = "8px";
  div.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
  div.style.zIndex = 1000;
  div.style.cursor = "move";
  div.style.display = "inline-block";

  div.innerHTML = `
    <button class="record">🎙️ Record</button>
    <button class="play">▶️</button>
    <button class="pause">⏸️</button>
    <button class="delete">🗑️</button>
    <button class="remove-bar">❌</button>
    <audio controls style="display:none; width:180px;"></audio>
  `;

  pdfContainer.appendChild(div);

  // --- Dragging logic ---
  let offsetX = 0, offsetY = 0, isDragging = false;
  div.addEventListener("mousedown", (e) => {
    if (e.target.tagName === "BUTTON" || e.target.tagName === "AUDIO") return;
    isDragging = true;
    offsetX = e.clientX - div.offsetLeft;
    offsetY = e.clientY - div.offsetTop;
    div.style.opacity = 0.8;
  });

  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      const rect = pdfContainer.getBoundingClientRect();
      let newX = e.clientX - offsetX - rect.left;
      let newY = e.clientY - offsetY - rect.top;
      newX = Math.max(0, Math.min(newX, rect.width - div.offsetWidth));
      newY = Math.max(0, Math.min(newY, rect.height - div.offsetHeight));
      div.style.left = `${newX}px`;
      div.style.top = `${newY}px`;
    }
  });

  document.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      div.style.opacity = 1;
    }
  });

  // --- Audio recording logic ---
  let mediaRecorder, audioChunks = [], audioBlobUrl = null;
  let recording = false;

  const recordBtn = div.querySelector(".record");
  const playBtn = div.querySelector(".play");
  const pauseBtn = div.querySelector(".pause");
  const deleteBtn = div.querySelector(".delete");
  const removeBarBtn = div.querySelector(".remove-bar");
  const audioElem = div.querySelector("audio");

  recordBtn.onclick = async () => {
    if (!recording) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];
      mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: "audio/webm" });
        audioBlobUrl = URL.createObjectURL(blob);
        audioElem.src = audioBlobUrl;
        audioElem.style.display = "block";
        stream.getTracks().forEach((t) => t.stop());
        recordBtn.textContent = "🎙️ Record";
        recording = false;
      };
      mediaRecorder.start();
      recording = true;
      recordBtn.textContent = "⏹️ Stop";
    } else {
      mediaRecorder.stop();
    }
  };

  playBtn.onclick = () => {
    if (audioBlobUrl) audioElem.play();
    else alert("No recording yet!");
  };

  pauseBtn.onclick = () => {
    audioElem.pause();
  };

  deleteBtn.onclick = () => {
    audioBlobUrl = null;
    audioElem.src = "";
    audioElem.style.display = "none";
  };

  removeBarBtn.onclick = () => {
    if (recording) mediaRecorder?.stop();
    div.remove();
  };
}
