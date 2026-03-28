const { z } = require("zod");

// sendMessage Schema
const sendMessageSchema = z.object({
  roomId: z.string().min(1, "Room ID is required"),
  receiverId: z.string().min(1, "Receiver ID is required"),
  content: z.string().optional(),
  messageType: z.enum(["text", "photo", "video", "audio", "file"]),
  fileName: z.string().optional(),
  fileSize: z.string().optional(),
  fileType: z.string().optional(),
  duration: z.string().optional(),
  caption: z.string().optional(),
  status: z.enum(["sent", "delivered", "seen"]).default("sent"),
  replyTo: z.string().nullable().optional(),
}).refine(data => {
  if (data.messageType === "text" && !data.content) return false;
  return true;
}, {
  message: "Content is required for text messages",
  path: ["content"],
});

// updateStatus Schema
const updateStatusSchema = z.object({
  status: z.literal("seen"),
});

// bulkStatus Schema
const bulkStatusSchema = z.object({
  messageIds: z.array(z.string().min(1)),
  status: z.literal("seen"),
  roomId: z.string().optional(),
});

// reaction Schema
const reactionSchema = z.object({
  emoji: z.string().min(1, "Emoji is required"),
});

module.exports = {
  sendMessageSchema,
  updateStatusSchema,
  bulkStatusSchema,
  reactionSchema,
};
