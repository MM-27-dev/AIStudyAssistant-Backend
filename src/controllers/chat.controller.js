import { Session } from "../models/session.model.js";
import { Message } from "../models/message.model.js";
import { generateTeacherResponse } from "../helper/getResponse.helper.js";
import { generateTitleFromMessages } from "../helper/getResponse.helper.js";

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
// GET /session/:sessionId/messages
export const getSessionMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Fetch messages for the given sessionId
    const messages = await Message.find({ sessionId }).sort({ createdAt: 1 });

    return res.status(200).json(messages);
  } catch (err) {
    console.error("❌ Error in getSessionMessages:", err);
    return res.status(500).json({ error: err.message });
  }
};

// POST /session/:sessionId/message
export const sendMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { content, isUser, messageType, file } = req.body;

    // 1. Save user message
    const userMessage = await Message.create({
      sessionId,
      userId: req.user._id,
      isUser: isUser,
      content,
      messageType: messageType || "text",
      file,
    });

    // 2. Update session with user message
    await Session.findByIdAndUpdate(sessionId, {
      $push: { messages: userMessage._id },
      $set: { updatedAt: new Date() },
    });

    // 3. Get full message history for this session
    const messages = await Message.find({ sessionId })
      .sort({ createdAt: 1 }) // Sort oldest to newest
      .lean();

    // 4. Prepare messages array for AI (e.g., OpenAI-style prompt array)
    const messageHistory = messages.map((msg) => ({
      role: msg.isUser ? "user" : "assistant",
      content: msg.content,
    }));

    // 5. Generate AI response based on full history
    const aiContent = await generateTeacherResponse(messageHistory); // accepts full history

    // 6. Save AI message
    const aiMessage = await Message.create({
      sessionId,
      userId: req.user._id, // or a system user ID
      isUser: false,
      content: aiContent,
      messageType: "text",
    });

    await Session.findByIdAndUpdate(sessionId, {
      $push: { messages: aiMessage._id },
      $set: { updatedAt: new Date() },
    });

    // 7. Return both messages
    return res.status(201).json({ userMessage, aiMessage });
  } catch (err) {
    console.error("💥 sendMessage error:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const sendFileMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const uploadedFile = req.file;
    if (!uploadedFile) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const contentText = await extractFileContent(
      uploadedFile.buffer,
      uploadedFile.mimetype
    );

    const fileObj = {
      filename: uploadedFile.filename,
      originalName: uploadedFile.originalname,
      path: uploadedFile.path || "in-memory",
      content: contentText,
    };

    // 1. Save file message
    const fileMessage = await Message.create({
      sessionId,
      userId,
      isUser: true,
      content: contentText,
      messageType: "file",
      file: fileObj,
    });

    await Session.findByIdAndUpdate(sessionId, {
      $push: { messages: fileMessage._id },
      $set: { updatedAt: new Date() },
    });

    // 2. Fetch full message history for this session
    const messages = await Message.find({ sessionId })
      .sort({ createdAt: 1 })
      .lean();

    // 3. Format messages for OpenAI
    const messageHistory = messages.map((msg) => ({
      role: msg.isUser ? "user" : "assistant",
      content: msg.content,
    }));

    // 4. Generate AI Response based on full message history
    const aiResponseText = await generateTeacherResponse(messageHistory);

    // 5. Save AI message
    const aiMessage = await Message.create({
      sessionId,
      userId,
      isUser: false,
      content: aiResponseText,
      messageType: "text",
    });

    await Session.findByIdAndUpdate(sessionId, {
      $push: { messages: aiMessage._id },
      $set: { updatedAt: new Date() },
    });

    return res.status(201).json({ fileMessage, aiMessage });
  } catch (err) {
    console.error("❌ Error in sendFileMessage:", err);
    return res.status(500).json({ error: err.message });
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
    console.error("❌ Error in endSessionAndGenerateTitle:", err);
    return res.status(500).json({ error: err.message });
  }
};

// // POST /session/:sessionId/feedback
// export const provideSessionFeedback = async (req, res) => {
//   try {
//     const { sessionId } = req.params;
//     const { feedback } = req.body;

//     const session = await Session.findByIdAndUpdate(
//       sessionId,
//       { feedback },
//       { new: true }
//     );

//     return res.status(200).json(session);
//   } catch (err) {
//     return res.status(500).json({ error: err.message });
//   }
// };
