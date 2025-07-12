// import pdfParse from "pdf-parse";
// import { promisify } from "util";
// import textract from "textract";
// import Tesseract from "tesseract.js";

// const extractWithTextract = promisify(textract.fromBufferWithMime);

// // Main function
// export const extractFileContent = async (fileBuffer, mimeType) => {
//   try {
//     if (!mimeType) throw new Error("MIME type is required.");

//     // Handle PDF
//     if (mimeType === "application/pdf") {
//       const data = await pdfParse(fileBuffer);
//       return data.text;
//     }

//     // Handle plain text
//     if (mimeType === "text/plain") {
//       return fileBuffer.toString("utf-8");
//     }

//     // Handle DOCX, DOC, etc. using textract
//     if (
//       [
//         "application/msword",
//         "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//         "application/vnd.ms-powerpoint",
//         "application/vnd.ms-excel",
//         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//       ].includes(mimeType)
//     ) {
//       const content = await extractWithTextract(mimeType, fileBuffer);
//       return content;
//     }

//     // Handle images (OCR)
//     if (mimeType.startsWith("image/")) {
//       const result = await Tesseract.recognize(fileBuffer, "eng");
//       return result.data.text;
//     }

//     return "Unsupported file type for content extraction.";
//   } catch (err) {
//     console.error("❌ Error extracting file content:", err.message);
//     return "Error extracting file content.";
//   }
// };

import pdfjs from "pdfjs-dist/legacy/build/pdf.js";
import { promisify } from "util";
import textract from "textract";
import Tesseract from "tesseract.js";

const { getDocument } = pdfjs;
const extractWithTextract = promisify(textract.fromBufferWithMime);

const extractTextFromPDF = async (fileBuffer) => {
  const loadingTask = getDocument({ data: fileBuffer });
  const pdf = await loadingTask.promise;
  let fullText = "";

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const strings = content.items.map((item) => item.str);
    fullText += strings.join(" ") + "\n";
  }

  return fullText;
};

export const extractFileContent = async (fileBuffer, mimeType) => {
  try {
    if (!mimeType) throw new Error("MIME type is required.");

    if (mimeType === "application/pdf") {
      return await extractTextFromPDF(fileBuffer);
    }

    if (mimeType === "text/plain") {
      return fileBuffer.toString("utf-8");
    }

    if (
      [
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-powerpoint",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ].includes(mimeType)
    ) {
      const content = await extractWithTextract(mimeType, fileBuffer);
      return content;
    }

    if (mimeType.startsWith("image/")) {
      const result = await Tesseract.recognize(fileBuffer, "eng");
      return result.data.text;
    }

    return "Unsupported file type for content extraction.";
  } catch (err) {
    console.error("❌ Error extracting file content:", err);
    return "Error extracting file content.";
  }
};
