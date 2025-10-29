/* -------------------------
   Interactive PDF Voice Notes (Overlay + Add Button)
   ------------------------- */

const pdfContainer = document.getElementById("pdf-container");
const pdfUrl = "LBG_Gold_Account_Sales_Script.pdf"; // your PDF file

// Step 1: Load PDF natively using iframe
pdfContainer.style.position = "relative"; // allow absolute positioning of overlays
pdfContainer.innerHTML = `
  <iframe src="${pdfUrl}" width="100%" height="100%" style="border:none;"></iframe>
  <button id="add-audio-btn" 
    style="
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 1000;
      font-size: 24px;
      cursor: pointer;
      background: rgba(255,255,255,0.8);
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
    "
    title="Add Audio Controls"
  >+</button>
`;

// Step 2: Add overlay div on top of PDF for dragging
const overlay = document.createElement("div");
overlay.style.position = "absolute";
overlay.style.top = "0";
overlay.style.left = "0";
overlay.style.width = "100%";
overlay.style.height = "100%";
overlay.style.background = "transparent";
overlay.style.zIndex = "999"; // on top of PDF but below the + button
pdfContainer.appendChild(overlay);

// Step 3: Click the "+" button to add a draggable audio bar
const addAudioBtn = document.getElementById("add-audio-btn");
addAudioBtn.addEventListener("click", () => {
  // Add it somewhere near the top-left initially
  addAudioControls(50, 50);
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
