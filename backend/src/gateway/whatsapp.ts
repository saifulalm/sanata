/**
 * Baileys Gateway Service
 * WhatsApp Gateway berbasis Baileys untuk Sanata Construction
 */

import { useMultiFileAuthState, makeWASocket, DisconnectReason, proto } from "baileys";
import type { WASocket, AuthenticationState } from "baileys";
import { prisma } from "@/lib/prisma";

export interface GatewaySession {
  id: string;
  state: "CONNECTED" | "QR_READY" | "PAIRING" | "DISCONNECTED" | "ERROR";
  qrCode?: string;
  qrCodeText?: string;
  phoneNumber?: string;
  displayName?: string;
  message?: string;
  lastSyncAt?: Date;
  expiresAt?: Date;
}

export interface SendMessageParams {
  to: string;
  text: string;
}

export interface SessionEntry {
  sock: WASocket | null;
  state: GatewaySession;
  qrInterval?: ReturnType<typeof setInterval>;
}

class BaileysGateway {
  private sessions: Map<string, SessionEntry> = new Map();
  private stateDir: string;

  constructor(stateDir: string = "./whatsapp-sessions") {
    this.stateDir = stateDir;
  }

  async createSession(sessionId: string): Promise<GatewaySession> {
    if (this.sessions.has(sessionId)) {
      const existing = this.sessions.get(sessionId)!;
      if (existing.sock) {
        return existing.state;
      }
    }

    const session: GatewaySession = {
      id: sessionId,
      state: "DISCONNECTED",
    };

    this.sessions.set(sessionId, { sock: null, state: session });

    return this.startSession(sessionId);
  }

  async startSession(sessionId: string): Promise<GatewaySession> {
    const sessionEntry = this.sessions.get(sessionId);
    if (!sessionEntry) {
      throw new Error("Session not found");
    }

    try {
      // Setup auth state - save to files for persistence
      const { state, saveCreds } = await useMultiFileAuthState(
        `${this.stateDir}/${sessionId}`
      );

      // Create socket with Baileys options
      const sock = makeWASocket({
        auth: state as AuthenticationState,
        printQRInTerminal: true,
        version: [2, 2323, 4] as [number, number, number],
        logger: {
          info: console.log,
          error: console.error,
          warn: console.warn,
          debug: () => {},
        } as any,
      });

      sessionEntry.sock = sock;

      // Handle QR code
      (sock as any).ev.on("qr", (qr: string) => {
        console.log(`[Gateway] QR received for session ${sessionId}`);
        sessionEntry.state = {
          ...sessionEntry.state,
          state: "QR_READY",
          qrCode: `data:image/png;base64,${Buffer.from(qr).toString("base64")}`,
          qrCodeText: qr,
          message: "Scan QR ini dari WhatsApp",
          expiresAt: new Date(Date.now() + 45000),
        };
      });

      // Handle connection updates
      sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === "open") {
          console.log(`[Gateway] Session ${sessionId} connected`);

          if (sessionEntry.qrInterval) {
            clearInterval(sessionEntry.qrInterval);
          }

          const info = sock.user;
          sessionEntry.state = {
            ...sessionEntry.state,
            state: "CONNECTED",
            phoneNumber: info?.id?.replace("@s.whatsapp.net", ""),
            displayName: (info as any)?.name || (info as any)?.pushName || "WhatsApp",
            qrCode: undefined,
            qrCodeText: undefined,
            message: "Terhubung ke WhatsApp",
          };

          this.updateConnectionStatus(sessionId, sessionEntry.state);
        }

        if (connection === "close") {
          const err = lastDisconnect?.error as any;
          const reason = err?.output?.statusCode;
          console.log(`[Gateway] Session ${sessionId} disconnected: ${reason}`);

          if (sessionEntry.qrInterval) {
            clearInterval(sessionEntry.qrInterval);
          }

          if (reason === (DisconnectReason as any).loggedOut) {
            sessionEntry.state = {
              ...sessionEntry.state,
              state: "DISCONNECTED",
              message: "Sesi di-logout. Buat sesi baru.",
            };
          } else {
            sessionEntry.state = {
              ...sessionEntry.state,
              state: "DISCONNECTED",
              message: "Koneksi terputus. Mencoba menyambung ulang...",
            };
          }
        }
      });

      // Save auth state on changes
      sock.ev.on("creds.update", saveCreds);

      // Wait for connection with timeout
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Connection timeout"));
        }, 60000);

        sock.ev.on("connection.update", (update) => {
          if (update.connection === "open") {
            clearTimeout(timeout);
            resolve();
          }
          if (update.connection === "close") {
            clearTimeout(timeout);
          }
        });
      });

      return sessionEntry.state;
    } catch (error) {
      console.error(`[Gateway] Error starting session ${sessionId}:`, error);
      sessionEntry.state = {
        ...sessionEntry.state,
        state: "ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      };
      throw error;
    }
  }

  async getSession(sessionId: string): Promise<GatewaySession | null> {
    return this.sessions.get(sessionId)?.state || null;
  }

  async refreshQR(sessionId: string): Promise<GatewaySession> {
    const sessionEntry = this.sessions.get(sessionId);
    if (!sessionEntry) {
      throw new Error("Session not found");
    }

    // Force reconnect to get new QR
    if (sessionEntry.sock) {
      try {
        (sessionEntry.sock as any).end?.();
      } catch (e) {
        // Ignore
      }
    }

    sessionEntry.state = {
      ...sessionEntry.state,
      state: "QR_READY",
      message: "Memperbarui QR...",
    };

    return this.startSession(sessionId);
  }

  async sendMessage(sessionId: string, params: SendMessageParams): Promise<string> {
    const sessionEntry = this.sessions.get(sessionId);
    if (!sessionEntry?.sock) {
      throw new Error("Session not connected");
    }

    if (sessionEntry.state.state !== "CONNECTED") {
      throw new Error("WhatsApp not connected");
    }

    const jid = params.to.includes("@") ? params.to : `${params.to}@s.whatsapp.net`;

    const result = await sessionEntry.sock.sendMessage(jid, { text: params.text });

    return (result as any)?.key?.id || "Message sent";
  }

  async disconnectSession(sessionId: string): Promise<GatewaySession> {
    const sessionEntry = this.sessions.get(sessionId);
    if (!sessionEntry) {
      throw new Error("Session not found");
    }

    if (sessionEntry.qrInterval) {
      clearInterval(sessionEntry.qrInterval);
    }

    if (sessionEntry.sock) {
      try {
        await sessionEntry.sock.logout();
        (sessionEntry.sock as any).end?.();
      } catch (e) {
        // Ignore errors during disconnect
      }
    }

    sessionEntry.state = {
      ...sessionEntry.state,
      state: "DISCONNECTED",
      message: "Sesi diputus",
      qrCode: undefined,
      qrCodeText: undefined,
    };

    this.sessions.delete(sessionId);

    return sessionEntry.state;
  }

  private async updateConnectionStatus(sessionId: string, state: GatewaySession) {
    try {
      const connection = await prisma.broadcastChannelConnection.findFirst({
        where: { accountKey: sessionId },
      });

      if (connection) {
        await prisma.broadcastChannelConnection.update({
          where: { id: connection.id },
          data: {
            status: state.state === "CONNECTED" ? "CONNECTED" : "DISCONNECTED",
            statusMessage: state.message || null,
            lastCheckedAt: new Date(),
          },
        });
      }
    } catch (error) {
      console.error(`[Gateway] Failed to update connection status:`, error);
    }
  }

  async healthCheck(): Promise<{ status: string; sessions: number }> {
    return {
      status: "ok",
      sessions: this.sessions.size,
    };
  }
}

// Singleton instance
export const gateway = new BaileysGateway(
  process.env.WHATSAPP_SESSIONS_DIR || "./whatsapp-sessions"
);

export default gateway;
