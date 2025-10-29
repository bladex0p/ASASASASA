/* -------------------------
   Interactive PDF Voice Notes
   ------------------------- */

const pdfContainer = document.getElementById("pdf-container");
const pdfUrl = "./LBG_Gold_Account_Sales_Script.pdf"; // update per script

// ----- Load PDF using pdf.js -----
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

pdfjsLib.getDocument(pdfUrl).promise.then(async (pdf) => {
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const scale = 1.2;
    const viewport = page.getViewport({ scale });

    // Canvas for rendering
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    canvas.style.display = "block";
    canvas.style.position = "relative";
    pdfContainer.appendChild(canvas);

    // Render the PDF page
    await page.render({ canvasContext: context, viewport }).promise;

    // Add text layer (for clickable hyperlinks)
    const textLayerDiv = document.createElement("div");
    textLayerDiv.className = "textLayer";
    textLayerDiv.style.position = "absolute";
    textLayerDiv.style.top = canvas.offsetTop + "px";
    textLayerDiv.style.left = canvas.offsetLeft + "px";
    textLayerDiv.style.width = viewport.width + "px";
    textLayerDiv.style.height = viewport.height + "px";
    textLayerDiv.style.pointerEvents = "none"; // default pass-through
    pdfContainer.appendChild(textLayerDiv);

    const textContent = await page.getTextContent();
    pdfjsLib.renderTextLayer({
      textContent,
      container: textLayerDiv,
      viewport,
      textDivs: [],
    });

    // Make links clickable
    setTimeout(() => {
      textLayerDiv.querySelectorAll("a").forEach((a) => {
        a.target = "_blank"; // open in new tab
        a.style.pointerEvents = "auto"; // allow clicks
        a.style.color = "blue";
        a.style.textDecoration = "underline";
      });
    }, 500);
  }
});

// ----- Right-click to add controls -----
pdfContainer.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  const x = e.offsetX;
  const y = e.offsetY;
  addAudioControls(x, y);
});

// ----- Function to add draggable audio controls -----
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
      const containerRect = pdfContainer.getBoundingClientRect();
      let newX = e.clientX - offsetX - containerRect.left;
      let newY = e.clientY - offsetY - containerRect.top;
      newX = Math.max(0, Math.min(newX, containerRect.width - div.offsetWidth));
      newY = Math.max(0, Math.min(newY, containerRect.height - div.offsetHeight));
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
  const playBtn   = div.querySelector(".play");
  const pauseBtn  = div.querySelector(".pause");
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
        stream.getTracks().forEach(t => t.stop());
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
