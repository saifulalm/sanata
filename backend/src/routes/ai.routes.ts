/**
 * AI Chat Routes - Blueprint Chatbot API
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import { aiService } from "@/services/ai.service";
import { env } from "@/config/env";
import { ApiError } from "@/utils/ApiError";

const router = Router();

/**
 * Schema untuk chat request
 */
const chatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant"]),
      content: z.string(),
    })
  ),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  maxTokens: z.number().min(100).max(4000).optional().default(800),
});

/**
 * POST /api/ai/chat
 * Kirim pesan ke AI chatbot dan dapatkan respons
 */
router.post("/chat", async (req: Request, res: Response) => {
  try {
    // Check if AI is enabled
    if (!aiService.isEnabled()) {
      throw ApiError.serviceUnavailable("AI chatbot sedang tidak tersedia. Silakan hubungi tim kami via WhatsApp.");
    }

    // Validate request
    const validation = chatRequestSchema.safeParse(req.body);
    if (!validation.success) {
      throw ApiError.badRequest(`Request tidak valid: ${validation.error.message}`);
    }

    const { messages, temperature, maxTokens } = validation.data;

    // Add page context if available
    const lastUserMessage = messages.filter((m) => m.role === "user").pop();
    if (lastUserMessage) {
      // Extract page context from headers or add default context
      const pageTitle = req.headers["x-page-title"] as string || "Sanata Construction";
      const pageUrl = req.headers["x-page-url"] as string || "";

      if (pageUrl) {
        lastUserMessage.content += `\n\n[Konteks: Pengguna melihat halaman "${pageTitle}" - ${pageUrl}]`;
      }
    }

    // Get AI response
    const response = await aiService.chat({
      messages,
      temperature,
      max_tokens: maxTokens,
    });

    res.json({
      success: true,
      data: {
        id: response.id,
        content: response.content,
        model: response.model,
        usage: response.usage,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error("[AI Chat Error]", error);
    throw ApiError.internal("Gagal memproses pesan. Silakan coba lagi.");
  }
});

/**
 * GET /api/ai/status
 * Cek status AI service
 */
router.get("/status", (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      enabled: aiService.isEnabled(),
      model: env.bluepack.model,
      provider: "bluepack",
    },
  });
});

/**
 * POST /api/ai/chat/stream
 * Streaming chat response (SSE)
 */
router.post("/chat/stream", async (req: Request, res: Response) => {
  // Set headers for SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    if (!aiService.isEnabled()) {
      res.write(`data: ${JSON.stringify({ type: "error", error: "AI chatbot tidak tersedia" })}\n\n`);
      res.end();
      return;
    }

    const validation = chatRequestSchema.safeParse(req.body);
    if (!validation.success) {
      res.write(`data: ${JSON.stringify({ type: "error", error: `Request tidak valid` })}\n\n`);
      res.end();
      return;
    }

    const { messages, temperature, maxTokens } = validation.data;

    // Send initial event
    res.write(`data: ${JSON.stringify({ type: "start", model: env.bluepack.model })}\n\n`);

    let fullContent = "";

    for await (const chunk of aiService.streamChat({
      messages,
      temperature,
      max_tokens: maxTokens,
    })) {
      if (chunk.done) {
        res.write(`data: ${JSON.stringify({ type: "done", content: fullContent })}\n\n`);
        break;
      }

      fullContent += chunk.delta;
      res.write(`data: ${JSON.stringify({ type: "chunk", delta: chunk.delta, content: fullContent })}\n\n`);
    }

    // Send completion
    res.write(`data: ${JSON.stringify({ type: "complete", content: fullContent })}\n\n`);
    res.end();
  } catch (error) {
    console.error("[AI Stream Error]", error);
    const errorMessage = error instanceof Error ? error.message : "Stream error";
    res.write(`data: ${JSON.stringify({ type: "error", error: errorMessage })}\n\n`);
    res.end();
  }
});

export default router;
