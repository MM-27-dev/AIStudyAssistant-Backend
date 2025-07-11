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
    max_tokens: 100,
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
