import pdfParse from "pdf-parse";
import { Readable } from "stream";
import * as mime from "mime-types";
import { promisify } from "util";
import textract from "textract";
import Tesseract from "tesseract.js";

const extractWithTextract = promisify(textract.fromBufferWithMime);

// Main function
export const extractFileContent = async (fileBuffer, mimeType) => {
  try {
    if (!mimeType) throw new Error("MIME type is required.");

    // Handle PDF
    if (mimeType === "application/pdf") {
      const data = await pdfParse(fileBuffer);
      return data.text;
    }

    // Handle plain text
    if (mimeType === "text/plain") {
      return fileBuffer.toString("utf-8");
    }

    // Handle DOCX, DOC, etc. using textract
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

    // Handle images (OCR)
    if (mimeType.startsWith("image/")) {
      const result = await Tesseract.recognize(fileBuffer, "eng");
      return result.data.text;
    }

    return "Unsupported file type for content extraction.";
  } catch (err) {
    console.error("❌ Error extracting file content:", err.message);
    return "Error extracting file content.";
  }
};
