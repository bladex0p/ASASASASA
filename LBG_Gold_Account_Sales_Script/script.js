console.log("script.js loaded");
const addAudioBtn = document.getElementById("add-audio-btn");
console.log("Button:", addAudioBtn);


const pdfContainer = document.getElementById("pdf-container");
const pdfUrl = "LBG_Gold_Account_Sales_Script.pdf"; // your PDF file

pdfContainer.innerHTML = `
  <iframe src="${pdfUrl}" width="100%" height="100%" style="border:none;"></iframe>
`;

// Reference to the + button
const addAudioBtn = document.getElementById("add-audio-btn");

// Event listener: when clicked, it will eventually create the draggable audio controls
addAudioBtn.addEventListener("click", () => {
  // For now, just log to confirm the click works
  console.log("Add audio control clicked!");
  
  // Later: call addAudioControls(x, y) function here
});
