/**
 * AI Assistant Service - Blueprint Chatbot
 * Menggunakan BluePack API (OpenAI-compatible) untuk percakapan interaktif
 */

import axios from "axios";
import { env } from "@/config/env";

export interface AIChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIChatRequest {
  messages: AIChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface AIChatResponse {
  id: string;
  model: string;
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface AIStreamChunk {
  delta: string;
  done: boolean;
}

/**
 * Blueprint system prompt untuk AI asisten konstruksi Sanata
 */
const SYSTEM_PROMPT = `Anda adalah asisten virtual SANATA CONSTRUCTION - perusahaan konstruksi dan renovasi profesional di Indonesia.

Tentang SANATA:
- Spesialisasi: renovasi rumah, interior, eksterior, penambahan struktur, dan proyek konstruksi skala besar
- Layanan: konsultasi gratis, survei lokasi, penawaran RAB (Rencana Anggaran Biaya), pelaksanaan proyek
- Area layanan: Jakarta, Tangerang, Bekasi, dan sekitarnya
- Nilai: transparansi harga, kualitas craftsmanship,准时 (tepat waktu), komunikasi jelas

Aturan respons:
1. SELALU jawab dalam Bahasa Indonesia yang sopan dan profesional
2. Untuk pertanyaan biaya: "Untuk estimasi akurat, kami perlu survei lokasi terlebih dahulu. Silakan hubungi tim kami via WhatsApp untuk jadwal survei."
3. Untuk pertanyaan teknis: berikan jawaban informatif yang menunjukkan keahlian
4. Untuk pertanyaan di luar keahlian: "Pertanyaan yang bagus! Untuk detail lebih lanjut, tim engineering kami bisa membantu."
5. TANYAKAN kebutuhan mereka: "Bisa cerita lebih lanjut tentang proyek yang Anda rencanakan?"
6. JANGAN promessa harga pasti tanpa survei
7. JANGAN klaim layanan yang tidak tersedia

Format respons:
- Gunakan bahasa yang ramah namun profesional
- Pisahkan poin penting dengan baris baru
- Akhiri dengan ajakan tindakan jika relevan`;

class AIService {
  private get baseUrl(): string {
    return env.bluepack.apiUrl;
  }

  private get apiKey(): string {
    return env.bluepack.apiKey;
  }

  private get model(): string {
    return env.bluepack.model;
  }

  isEnabled(): boolean {
    return Boolean(this.apiKey && this.baseUrl);
  }

  private getHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  /**
   * Kirim pesan chat ke AI dan dapatkan respons
   */
  async chat(request: AIChatRequest): Promise<AIChatResponse> {
    if (!this.isEnabled()) {
      throw new Error("AI service tidak dikonfigurasi. Tambahkan BLUEPACK_API_KEY dan BLUEPACK_API_URL ke environment.");
    }

    try {
      // Format messages dengan system prompt di awal
      const messages = [
        { role: "system" as const, content: SYSTEM_PROMPT },
        ...request.messages.filter((m) => m.role !== "system"),
      ];

      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.max_tokens ?? 1000,
          stream: false,
        },
        {
          headers: this.getHeaders(),
          timeout: 30000,
        }
      );

      const choice = response.data?.choices?.[0];
      if (!choice) {
        throw new Error("Respons AI tidak valid");
      }

      return {
        id: response.data.id || `chatcmpl-${Date.now()}`,
        model: response.data.model || this.model,
        content: choice.message?.content || "Maaf, saya tidak dapat memproses pertanyaan Anda saat ini.",
        usage: response.data.usage,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("API key BluePack tidak valid");
        }
        if (error.response?.status === 429) {
          throw new Error("Batas penggunaan API tercapai. Silakan coba lagi nanti.");
        }
        throw new Error(`AI service error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Streaming chat - untuk respons real-time
   */
  async *streamChat(
    request: AIChatRequest
  ): AsyncGenerator<AIStreamChunk, void, unknown> {
    if (!this.isEnabled()) {
      throw new Error("AI service tidak dikonfigurasi");
    }

    const messages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...request.messages.filter((m) => m.role !== "system"),
    ];

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.max_tokens ?? 1000,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI service error: ${response.status}`);
    }

    if (!response.body) {
      throw new Error("Stream response body is null");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              yield { delta: "", done: true };
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content || "";
              if (delta) {
                yield { delta, done: false };
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

// Singleton instance
export const aiService = new AIService();

export default aiService;
