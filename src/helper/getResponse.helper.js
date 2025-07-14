import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config(); 

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generates a teacher-like response from the AI
export const generateTeacherResponse = async (messageHistory) => {
  const systemPrompt = `
You are an expert educator helping students understand complex topics in a simple and clear manner. 
Always be supportive, explain step-by-step, and adapt to the student's level. 
Use examples, analogies, and visual descriptions when needed.
`;

  const completion = await client.chat.completions.create({
    model: "gpt-4o", 
    messages: [
      { role: "system", content: systemPrompt },
      ...messageHistory, // ✅ Correct way to add the full conversation
    ],
    temperature: 0.7,
    max_tokens: 500,
  });

  return completion.choices[0].message.content;
};


// helper/getResponse.helper.js
export const generateTitleFromMessages = async (messageHistory) => {
  const systemPrompt = `
You are an AI assistant. Based on the following conversation between a user and an AI teacher, generate a short, clear, and meaningful session title (max 8 words). Do NOT explain anything. Just return the title.
`;

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      ...messageHistory,
    ],
    temperature: 0.5,
    max_tokens: 20,
  });

  return completion.choices[0].message.content.trim();
};


export const generateFileAwareResponse = async (
  messageHistory,
  extractedText,
  originalFileName
) => {
  const systemPrompt = `
You are a helpful and knowledgeable assistant.

Users may upload documents (PDFs, text files, scanned notes, Word files, etc.). These files may contain code, structured notes, technical content, or scanned images extracted using OCR.

Your task is to:
1. Carefully read and remember the **entire content** of each uploaded file.
2. Answer the user's follow-up questions accurately **based only on the file content** (unless asked otherwise).
3. If a user refers to “the file,” “uploaded file,” or uses phrases like “what is written,” “explain this,” or “summarize,” assume they are referring to the most recently uploaded document.
4. Maintain the formatting of code, bullet points, and numbered lists while responding.
5. If a question cannot be answered from the file, politely let the user know and avoid hallucinating.

ALWAYS use the extracted content between the markers below:
------------------ Begin File Content ------------------
[file content goes here]
------------------- End File Content -------------------

Do not ignore this content even if the user uploads multiple files. Treat each new file as context for continued questions.
`;

  const fullContextMessage = {
    role: "user",
    content: `Uploaded File: ${originalFileName}\n\n------------------ Begin File Content ------------------\n${extractedText}\n------------------- End File Content -------------------`,
  };

  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      fullContextMessage,
      ...messageHistory,
    ],
    temperature: 0.6,
    max_tokens: 1000,
  });

  return completion.choices[0].message.content;
};
