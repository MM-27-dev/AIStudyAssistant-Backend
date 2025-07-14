import pdfjs from "pdfjs-dist/legacy/build/pdf.js";
import { createCanvas } from "canvas";
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
    const strings = content.items.map((item) => item.str).filter(Boolean);

    if (strings.length > 0) {
      fullText += strings.join(" ") + "\n";
    } else {
      // If no selectable text, perform OCR on rendered image
      const viewport = page.getViewport({ scale: 2 });
      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext("2d");

      await page.render({ canvasContext: context, viewport }).promise;

      const imageBuffer = canvas.toBuffer("image/png");
      const ocrResult = await Tesseract.recognize(imageBuffer, "eng");

      fullText += ocrResult.data.text + "\n";
    }
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
