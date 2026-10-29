import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ai = GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: GEMINI_API_KEY })
  : null;

app.get("/health", (req, res) => {
  res.json({
    status: "online",
    name: "NEXA AI",
    message: "NEXA AI backend is running."
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    if (!ai) {
      return res.status(500).json({
        error: "The AI service has not been configured yet."
      });
    }

    const { messages, message } = req.body;

    let conversation = "";

    if (Array.isArray(messages)) {
      conversation = messages
        .filter(item =>
          item &&
          ["user", "assistant", "model"].includes(item.role) &&
          typeof item.content === "string"
        )
        .slice(-20)
        .map(item => {
          const role =
            item.role === "assistant" || item.role === "model"
              ? "NEXA"
              : "User";

          return `${role}: ${item.content}`;
        })
        .join("\n\n");
    } else if (typeof message === "string") {
      conversation = `User: ${message}`;
    }

    if (!conversation.trim()) {
      return res.status(400).json({
        error: "Please enter a message."
      });
    }

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: conversation,
      config: {
        systemInstruction:
          "You are NEXA AI, a helpful, friendly, intelligent AI assistant created by MR_WAYNE. Give clear, accurate, useful answers. Do not claim to have performed actions you have not performed."
      }
    });

    res.json({
      reply: result.text || "Sorry, I couldn't generate a response."
    });

  } catch (error) {
    console.error("NEXA chat error:", error.message);

    res.status(500).json({
      error: "NEXA AI could not respond. Please try again."
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`NEXA AI backend running on port ${PORT}`);
});
