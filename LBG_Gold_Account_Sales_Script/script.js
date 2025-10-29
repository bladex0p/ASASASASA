/* -------------------------
   Display PDF Natively
   ------------------------- */

const pdfContainer = document.getElementById("pdf-container");
const pdfUrl = "LBG_Gold_Account_Sales_Script.pdf"; // your PDF file

// Load PDF using iframe so that links remain clickable
pdfContainer.innerHTML = `
  <iframe src="${pdfUrl}" width="100%" height="100%" style="border:none;"></iframe>
`;
