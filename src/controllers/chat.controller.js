import { Session } from "../models/session.model.js";
import { Message } from "../models/message.model.js";
import {
  generateFileAwareResponse,
  generateTeacherResponse,
} from "../helper/getResponse.helper.js";
import { generateTitleFromMessages } from "../helper/getResponse.helper.js";
import { extractFileContent } from "../helper/extractFileContent.js";

// POST /session
export const createSession = async (req, res) => {
  try {
    const { title } = req.body;
    const session = await Session.create({
      title: title || "Untitled Session",
      userId: req.user._id,
    });
    return res.status(201).json(session);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// GET /sessions
export const getUserSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user._id }).sort({
      updatedAt: -1,
    });
    return res.status(200).json(sessions);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// GET /session/:sessionId/messages
export const getSessionMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const messages = await Message.find({ sessionId }).sort({ createdAt: 1 });

    return res.status(200).json(messages);
  } catch (err) {
    console.error("❌ Error in getSessionMessages:", err);
    return res.status(500).json({ error: err.message });
  }
};



export const sendMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { content, isUser, messageType } = req.body; 

    const userId = req.user._id;

    if (!content) {
      return res.status(400).json({ error: "Message content is required" });
    }

    const newMessage = await Message.create({
      sessionId,
      userId,
      isUser,
      content,
    });

    await Session.findByIdAndUpdate(sessionId, {
      $push: { messages: newMessage._id },
      $set: { updatedAt: new Date() },
    }); 

    if (isUser) {
      const session = await Session.findById(sessionId).lean();
      const messages = await Message.find({ sessionId })
        .sort({ createdAt: 1 })
        .lean();

      const messageHistory = messages.map((msg) => {
        if (msg.messageType === "file") {
          return {
            role: "user",
            content: `Uploaded File: ${msg.file?.originalName || "Unknown"}\n\n${msg.file?.content || ""}`,
          };
        }
        return {
          role: msg.isUser ? "user" : "assistant",
          content: msg.content,
        };
      });

      let fullHistory = [...messageHistory];

      if (session?.latestFile?.content) {
        const fileMemoryPrompt = {
          role: "user",
          content: `
Previously uploaded file: ${session.latestFile.name}

------------------ Begin File Content ------------------
${session.latestFile.content}
------------------- End File Content ------------------

Please use this file as context for this and future questions.`,
        };

        fullHistory = [fileMemoryPrompt, ...fullHistory];
      }

      const aiResponseContent = await generateFileAwareResponse(
        fullHistory,
        session?.latestFile?.content || "",
        session?.latestFile?.name || ""
      );

      const aiMessage = await Message.create({
        sessionId,
        userId,
        isUser: false,
        content: aiResponseContent,
        messageType: "text",
      });

      await Session.findByIdAndUpdate(sessionId, {
        $push: { messages: aiMessage._id },
        $set: { updatedAt: new Date() },
      });

      return res.status(201).json({ userMessage: newMessage, aiMessage });
    } else {
      return res.status(201).json({ aiMessage: newMessage });
    }
  } catch (err) {
    console.error("Error in sendMessage:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const saveMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { content, isUser, messageType } = req.body;

    const userId = req.user._id;

    if (!content) {
      return res.status(400).json({ error: "Message content is required" });
    }

    const newMessage = await Message.create({
      sessionId,
      userId,
      isUser,
      content,
      messageType: messageType || "text",
    });

    await Session.findByIdAndUpdate(sessionId, {
      $push: { messages: newMessage._id },
      $set: { updatedAt: new Date() },
    });

    return res.status(201).json({ message: newMessage });
  } catch (err) {
    console.error("Error in saveMessage:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const sendFileMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const uploadedFile = req.file;
    const message = req.body.message;

    if (!uploadedFile) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // 1. Extract file content
    const contentText = await extractFileContent(
      uploadedFile.buffer,
      uploadedFile.mimetype
    );

    // 2. Save file message to DB
    const fileMessage = await Message.create({
      sessionId,
      userId,
      isUser: true,
      content: message || contentText,
      messageType: "file",
      file: {
        filename: uploadedFile.filename,
        originalName: uploadedFile.originalname,
        path: uploadedFile.path || "in-memory",
        content: contentText,
      },
    });

    // 3. Update session with latest file info
    await Session.findByIdAndUpdate(sessionId, {
      $push: { messages: fileMessage._id },
      $set: {
        updatedAt: new Date(),
        latestFile: {
          name: uploadedFile.originalname,
          content: contentText,
        },
      },
    });

    let aiMessage = null;

    // 4. If user also typed a message, process it as a new text message
    if (message) {
      const userTextMessage = await Message.create({
        sessionId,
        userId,
        isUser: true,
        content: message,
        messageType: "text",
      });

      await Session.findByIdAndUpdate(sessionId, {
        $push: { messages: userTextMessage._id },
        $set: { updatedAt: new Date() },
      });

      // 5. Fetch full session and message history
      const session = await Session.findById(sessionId).lean();
      const allMessages = await Message.find({ sessionId })
        .sort({ createdAt: 1 })
        .lean();

      const messageHistory = allMessages.map((msg) => {
        if (msg.messageType === "file") {
          return {
            role: "user",
            content: `Uploaded File: ${msg.file?.originalName || "Unknown"}\n\n${msg.file?.content || ""}`,
          };
        }
        return {
          role: msg.isUser ? "user" : "assistant",
          content: msg.content,
        };
      });

      // 6. Add memory prompt if file is present
      let fullHistory = [...messageHistory];
      if (session?.latestFile?.content) {
        const fileMemoryPrompt = {
          role: "user",
          content: `
          Previously uploaded file: ${session.latestFile.name}
          
          ------------------ Begin File Content ------------------
          ${session.latestFile.content}
          ------------------- End File Content ------------------
          
          Please use this file as context for this and future questions.`,
        };
        fullHistory = [fileMemoryPrompt, ...fullHistory];
      }

      // 7. Generate AI response
      const aiResponse = await generateFileAwareResponse(
        fullHistory,
        session?.latestFile?.content || "",
        session?.latestFile?.name || ""
      );

      aiMessage = await Message.create({
        sessionId,
        userId,
        isUser: false,
        content: aiResponse,
        messageType: "text",
      });

      await Session.findByIdAndUpdate(sessionId, {
        $push: { messages: aiMessage._id },
        $set: { updatedAt: new Date() },
      });
    }

    // 8. Return response
    return res.status(201).json({
      fileMessage: {
        ...fileMessage.toObject(),
        file: {
          filename: uploadedFile.filename,
          originalName: uploadedFile.originalname,
          path: uploadedFile.path || "in-memory",
          content: contentText,
        },
      },
      aiMessage,
    });
  } catch (err) {
    console.error("❌ Error in sendFileMessage:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal server error" });
  }
};

// POST /session/:sessionId/end
export const endSessionAndGenerateTitle = async (req, res) => {
  try {
    const { sessionId } = req.params;

    // 1. Fetch messages
    const messages = await Message.find({ sessionId })
      .sort({ createdAt: 1 })
      .lean();

    if (messages.length === 0) {
      // Just return early with a friendly message and do NOT error
      return res.status(200).json({
        message: "Session ended. No messages to generate title from.",
        title: "Untitled Session",
        session: await Session.findById(sessionId),
      });
    }

    // 2. Format message history
    const messageHistory = messages.map((msg) => ({
      role: msg.isUser ? "user" : "assistant",
      content: msg.content,
    }));

    // 3. Generate title using AI
    const generatedTitle = await generateTitleFromMessages(messageHistory);

    // 4. Update the session
    const updatedSession = await Session.findByIdAndUpdate(
      sessionId,
      { title: generatedTitle },
      { new: true }
    );

    return res.status(200).json({
      message: "Session ended and title updated",
      title: generatedTitle,
      session: updatedSession,
    });
  } catch (err) {
    console.error("Error in endSessionAndGenerateTitle:", err);
    return res.status(500).json({ error: err.message });
  }
};

// controllers/openai.controller.js
export const getToken = async (req, res) => {
  const voice = req.body.voice;

  console.log("Creating OpenAI session with voice:", voice);

  try {
    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "realtime=v1",
        },
        body: JSON.stringify({
          model: "gpt-4o-realtime-preview-2024-12-17",
          voice: voice,
        }),
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Session creation failed:", err);
    res.status(500).json({ error: "Session creation failed" });
  }
};


