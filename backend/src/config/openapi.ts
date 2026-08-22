const errorResponse = {
  type: "object",
  properties: {
    success: { type: "boolean", example: false },
    message: { type: "string" },
  },
};

const paginationMeta = {
  type: "object",
  properties: {
    page: { type: "integer" },
    pageSize: { type: "integer" },
    total: { type: "integer" },
    totalPages: { type: "integer" },
  },
};

export const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Sanata Construction API",
    version: "1.0.0",
    description:
      "REST API for the Sanata Construction platform — content, services/products, categories, users, media, dashboard analytics, and public inquiries.",
  },
  servers: [{ url: "/api", description: "API base path" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Error: errorResponse,
      PaginationMeta: paginationMeta,
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["ADMIN", "EDITOR", "USER"] },
          isActive: { type: "boolean" },
          avatarUrl: { type: "string", nullable: true },
        },
      },
      Category: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          slug: { type: "string" },
        },
      },
      Content: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          slug: { type: "string" },
          excerpt: { type: "string", nullable: true },
          body: { type: "string" },
          type: { type: "string", enum: ["PAGE", "POST"] },
          status: { type: "string", enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] },
          coverImage: { type: "string", nullable: true },
          views: { type: "integer" },
          category: { $ref: "#/components/schemas/Category", nullable: true },
        },
      },
      Product: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          slug: { type: "string" },
          description: { type: "string" },
          price: { type: "string" },
          stock: { type: "integer" },
          isActive: { type: "boolean" },
          category: { $ref: "#/components/schemas/Category", nullable: true },
        },
      },
      Inquiry: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          phone: { type: "string", nullable: true },
          service: { type: "string", nullable: true },
          message: { type: "string" },
          marketingConsent: { type: "boolean" },
          preferredChannel: {
            type: "string",
            nullable: true,
            enum: ["EMAIL", "TELEGRAM", "WHATSAPP", "INSTAGRAM", "FACEBOOK"],
          },
        },
        required: ["name", "email", "message"],
      },
      BroadcastConnection: {
        type: "object",
        properties: {
          id: { type: "string" },
          channel: { type: "string", enum: ["EMAIL", "TELEGRAM", "WHATSAPP", "INSTAGRAM", "FACEBOOK"] },
          provider: {
            type: "string",
            enum: [
              "EMAIL_SMTP",
              "TELEGRAM_BOT",
              "WHATSAPP_BAILEYS",
              "WHATSAPP_OFFICIAL",
              "WHATSAPP_WAHA",
              "WHATSAPP_EVOLUTION",
              "INSTAGRAM_META",
              "FACEBOOK_META",
            ],
          },
          mode: { type: "string", enum: ["PRODUCTION", "EXPERIMENTAL"] },
          accountKey: { type: "string" },
          label: { type: "string" },
          senderIdentity: { type: "string", nullable: true },
          isEnabled: { type: "boolean" },
          isPrimary: { type: "boolean" },
          priority: { type: "integer" },
          weight: { type: "integer" },
          dailyLimit: { type: "integer", nullable: true },
          hourlyLimit: { type: "integer", nullable: true },
          status: { type: "string", enum: ["DISCONNECTED", "CONNECTED", "ERROR"] },
          statusMessage: { type: "string", nullable: true },
          config: { type: "object", additionalProperties: true },
          cooldownUntil: { type: "string", format: "date-time", nullable: true },
          lastCheckedAt: { type: "string", format: "date-time", nullable: true },
          lastUsedAt: { type: "string", format: "date-time", nullable: true },
        },
      },
      BroadcastConnectionSession: {
        type: "object",
        properties: {
          connectionId: { type: "string" },
          provider: { type: "string", enum: ["WHATSAPP_BAILEYS"] },
          sessionKey: { type: "string" },
          state: {
            type: "string",
            enum: ["CONNECTED", "QR_READY", "PAIRING", "DISCONNECTED", "ERROR", "UNKNOWN"],
          },
          qrCodeDataUrl: { type: "string", nullable: true },
          qrCodeText: { type: "string", nullable: true },
          phoneNumber: { type: "string", nullable: true },
          displayName: { type: "string", nullable: true },
          message: { type: "string", nullable: true },
          canScanQr: { type: "boolean" },
          lastSyncedAt: { type: "string", format: "date-time" },
        },
      },
      BroadcastCampaign: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          channel: { type: "string", enum: ["EMAIL", "TELEGRAM", "WHATSAPP", "INSTAGRAM", "FACEBOOK"] },
          status: { type: "string", enum: ["DRAFT", "SENDING", "SENT", "PARTIAL", "FAILED", "CANCELLED"] },
          audienceType: { type: "string", enum: ["ALL_CONTACTS", "CONSENTED_ONLY", "TAGGED"] },
          subject: { type: "string", nullable: true },
          message: { type: "string" },
          sentAt: { type: "string", format: "date-time", nullable: true },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/health": {
      get: {
        tags: ["System"],
        summary: "Health check",
        security: [],
        responses: { "200": { description: "API is healthy" } },
      },
    },
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "User registered, tokens issued" },
          "409": { description: "Email already registered", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "429": { description: "Too many registration attempts" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in with email and password",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                  totpCode: { type: "string", description: "Required only if the account has 2FA enabled" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Login successful, access token + user returned" },
          "401": { description: "Invalid credentials or missing/invalid 2FA code", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "429": { description: "Too many login attempts" },
        },
      },
    },
    "/auth/refresh": {
      post: { tags: ["Auth"], summary: "Rotate access token using the httpOnly refresh cookie", security: [], responses: { "200": { description: "New access token issued" }, "401": { description: "Missing/invalid/expired refresh token" } } },
    },
    "/auth/logout": {
      post: { tags: ["Auth"], summary: "Revoke the current refresh token", security: [], responses: { "200": { description: "Logged out" } } },
    },
    "/auth/me": {
      get: { tags: ["Auth"], summary: "Get the current authenticated user", responses: { "200": { description: "Current user" }, "401": { description: "Unauthenticated" } } },
    },
    "/auth/2fa/setup": {
      post: { tags: ["Auth"], summary: "Generate a TOTP secret + QR code for enabling 2FA", responses: { "200": { description: "Secret and QR code data URI" } } },
    },
    "/auth/2fa/enable": {
      post: {
        tags: ["Auth"],
        summary: "Confirm setup and enable 2FA with a verification code",
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["code"], properties: { code: { type: "string" } } } } } },
        responses: { "200": { description: "2FA enabled" }, "400": { description: "Invalid code" } },
      },
    },
    "/auth/2fa/disable": {
      post: {
        tags: ["Auth"],
        summary: "Disable 2FA on the current account",
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["code"], properties: { code: { type: "string" } } } } } },
        responses: { "200": { description: "2FA disabled" }, "400": { description: "Invalid code" } },
      },
    },
    "/categories": {
      get: { tags: ["Categories"], summary: "List all categories", security: [], responses: { "200": { description: "List of categories" } } },
      post: { tags: ["Categories"], summary: "Create a category (admin/editor)", responses: { "201": { description: "Created" } } },
    },
    "/categories/{id}": {
      put: { tags: ["Categories"], summary: "Update a category (admin/editor)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Updated" } } },
      delete: { tags: ["Categories"], summary: "Delete a category (admin only)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Deleted" }, "400": { description: "Category still in use" } } },
    },
    "/contents": {
      get: {
        tags: ["Content"],
        summary: "List content (posts/pages), paginated",
        security: [],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "pageSize", in: "query", schema: { type: "integer" } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] } },
          { name: "type", in: "query", schema: { type: "string", enum: ["PAGE", "POST"] } },
          { name: "categoryId", in: "query", schema: { type: "string" } },
        ],
        responses: { "200": { description: "Paginated content list" } },
      },
      post: { tags: ["Content"], summary: "Create content (admin/editor)", responses: { "201": { description: "Created" } } },
    },
    "/contents/slug/{slug}": {
      get: { tags: ["Content"], summary: "Get published content by slug (increments view count)", security: [], parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Content item" }, "404": { description: "Not found" } } },
    },
    "/contents/{id}": {
      get: { tags: ["Content"], summary: "Get content by id (admin/editor)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Content item" } } },
      put: { tags: ["Content"], summary: "Update content (admin/editor)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Updated" } } },
      delete: { tags: ["Content"], summary: "Delete content (admin only)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Deleted" } } },
    },
    "/products": {
      get: {
        tags: ["Products"],
        summary: "List products/services, paginated",
        security: [],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "pageSize", in: "query", schema: { type: "integer" } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "categoryId", in: "query", schema: { type: "string" } },
          { name: "isActive", in: "query", schema: { type: "string", enum: ["true", "false"] } },
        ],
        responses: { "200": { description: "Paginated product list" } },
      },
      post: { tags: ["Products"], summary: "Create a product/service (admin/editor)", responses: { "201": { description: "Created" } } },
    },
    "/products/slug/{slug}": {
      get: { tags: ["Products"], summary: "Get a product/service by slug", security: [], parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Product item" }, "404": { description: "Not found" } } },
    },
    "/products/{id}": {
      get: { tags: ["Products"], summary: "Get a product by id (admin/editor)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Product item" } } },
      put: { tags: ["Products"], summary: "Update a product (admin/editor)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Updated" } } },
      delete: { tags: ["Products"], summary: "Delete a product (admin only)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Deleted" } } },
    },
    "/users": {
      get: { tags: ["Users"], summary: "List users (admin only), paginated", responses: { "200": { description: "Paginated user list" } } },
    },
    "/users/{id}": {
      put: { tags: ["Users"], summary: "Update a user's role/status (admin only)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Updated" } } },
      delete: { tags: ["Users"], summary: "Delete a user (admin only)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Deleted" } } },
    },
    "/media": {
      post: { tags: ["Media"], summary: "Upload an image (admin/editor)", requestBody: { required: true, content: { "multipart/form-data": { schema: { type: "object", properties: { file: { type: "string", format: "binary" }, productId: { type: "string" } } } } } }, responses: { "201": { description: "Uploaded" } } },
    },
    "/media/{id}": {
      delete: { tags: ["Media"], summary: "Delete a media file (admin/editor)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Deleted" } } },
    },
    "/dashboard/summary": {
      get: { tags: ["Dashboard"], summary: "Aggregate stats for the admin dashboard (admin/editor)", responses: { "200": { description: "Dashboard summary" } } },
    },
    "/inquiries": {
      post: {
        tags: ["Inquiries"],
        summary: "Submit a contact/quotation inquiry (public, rate-limited)",
        security: [],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Inquiry" } } } },
        responses: { "201": { description: "Inquiry received" }, "422": { description: "Validation failed" }, "429": { description: "Too many submissions" } },
      },
      get: { tags: ["Inquiries"], summary: "List inquiries (admin/editor), paginated", responses: { "200": { description: "Paginated inquiry list" } } },
    },
    "/broadcasts/overview": {
      get: {
        tags: ["Broadcasts"],
        summary: "Get broadcast center overview, channels, contacts, and campaigns (admin/editor)",
        responses: { "200": { description: "Broadcast overview" } },
      },
    },
    "/broadcasts/connections": {
      get: {
        tags: ["Broadcasts"],
        summary: "List configured broadcast channel connections (admin/editor)",
        responses: { "200": { description: "Broadcast connections" } },
      },
      post: {
        tags: ["Broadcasts"],
        summary: "Create a broadcast sender account for a channel (admin/editor)",
        responses: { "201": { description: "Broadcast connection created" } },
      },
    },
    "/broadcasts/connections/{id}": {
      patch: {
        tags: ["Broadcasts"],
        summary: "Update a sender account, limits, or provider config (admin/editor)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  provider: { type: "string" },
                  mode: { type: "string", enum: ["PRODUCTION", "EXPERIMENTAL"] },
                  label: { type: "string" },
                  senderIdentity: { type: "string", nullable: true },
                  isEnabled: { type: "boolean" },
                  isPrimary: { type: "boolean" },
                  priority: { type: "integer" },
                  weight: { type: "integer" },
                  dailyLimit: { type: "integer", nullable: true },
                  hourlyLimit: { type: "integer", nullable: true },
                  cooldownUntil: { type: "string", format: "date-time", nullable: true },
                  config: { type: "object", additionalProperties: true },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Updated connection" } },
      },
    },
    "/broadcasts/connections/{id}/test": {
      post: {
        tags: ["Broadcasts"],
        summary: "Test a sender account against SMTP, Telegram, Baileys, WhatsApp Official, or Meta APIs (admin/editor)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Test result" } },
      },
    },
    "/broadcasts/connections/{id}/session": {
      get: {
        tags: ["Broadcasts"],
        summary: "Get the current Baileys QR session state for a sender account (admin/editor)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Session state" } },
      },
      post: {
        tags: ["Broadcasts"],
        summary: "Create or initialize a Baileys QR session for a sender account (admin/editor)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Session initialized" } },
      },
      delete: {
        tags: ["Broadcasts"],
        summary: "Disconnect a Baileys QR session for a sender account (admin/editor)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Session disconnected" } },
      },
    },
    "/broadcasts/connections/{id}/session/refresh": {
      post: {
        tags: ["Broadcasts"],
        summary: "Refresh or regenerate the latest Baileys QR code for a sender account (admin/editor)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "QR refreshed" } },
      },
    },
    "/broadcasts/contacts": {
      get: {
        tags: ["Broadcasts"],
        summary: "List active broadcast contacts with consent and delivery counts (admin/editor)",
        responses: { "200": { description: "Broadcast contacts" } },
      },
    },
    "/broadcasts/campaigns": {
      get: {
        tags: ["Broadcasts"],
        summary: "List recent broadcast campaigns with delivery stats (admin/editor)",
        responses: { "200": { description: "Broadcast campaigns" } },
      },
      post: {
        tags: ["Broadcasts"],
        summary: "Create a broadcast campaign draft (admin/editor)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "channel", "message"],
                properties: {
                  title: { type: "string" },
                  channel: { type: "string", enum: ["EMAIL", "TELEGRAM", "WHATSAPP", "INSTAGRAM", "FACEBOOK"] },
                  connectionId: { type: "string", nullable: true },
                  audienceType: { type: "string", enum: ["ALL_CONTACTS", "CONSENTED_ONLY", "TAGGED"] },
                  tags: { type: "array", items: { type: "string" } },
                  subject: { type: "string", nullable: true },
                  message: { type: "string" },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Draft created" } },
      },
    },
    "/broadcasts/campaigns/{id}": {
      patch: {
        tags: ["Broadcasts"],
        summary: "Update a broadcast campaign draft before sending (admin/editor)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Updated campaign" } },
      },
    },
    "/broadcasts/campaigns/{id}/send": {
      post: {
        tags: ["Broadcasts"],
        summary: "Send a broadcast campaign immediately and persist delivery logs (admin/editor)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  force: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Campaign sent" } },
      },
    },
    "/audit-logs": {
      get: {
        tags: ["Audit"],
        summary: "List audit trail entries (admin only)",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "pageSize", in: "query", schema: { type: "integer" } },
          { name: "entity", in: "query", schema: { type: "string" } },
        ],
        responses: { "200": { description: "Paginated audit log" } },
      },
    },

    // --- Estimasi biaya: Harga Satuan Dasar -> AHSP -> RAB -------------------
    "/price-items": {
      get: {
        tags: ["Estimation"],
        summary: "List basic unit prices / Harga Satuan Dasar (admin/editor)",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "pageSize", in: "query", schema: { type: "integer" } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "type", in: "query", schema: { type: "string", enum: ["LABOR", "MATERIAL", "EQUIPMENT"] } },
          { name: "isActive", in: "query", schema: { type: "boolean" } },
        ],
        responses: { "200": { description: "Paginated price item list" } },
      },
      post: { tags: ["Estimation"], summary: "Create a price item (admin/editor)", responses: { "201": { description: "Created" }, "409": { description: "Code already used" } } },
    },
    "/price-items/{id}": {
      get: { tags: ["Estimation"], summary: "Get a price item", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Price item" } } },
      put: { tags: ["Estimation"], summary: "Update a price item (admin/editor)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Updated" } } },
      delete: { tags: ["Estimation"], summary: "Delete a price item (admin only)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Deleted" }, "400": { description: "Still referenced by an AHSP component" } } },
    },
    "/ahsp": {
      get: {
        tags: ["Estimation"],
        summary: "List AHSP entries with computed unit prices (admin/editor)",
        description:
          "Each entry includes `computed`: biaya langsung = Σ(koefisien × harga satuan), plus overhead & profit, giving the Harga Satuan Pekerjaan.",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "pageSize", in: "query", schema: { type: "integer" } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "isActive", in: "query", schema: { type: "boolean" } },
        ],
        responses: { "200": { description: "Paginated AHSP list with computed unit prices" } },
      },
      post: { tags: ["Estimation"], summary: "Create an AHSP with its components (admin/editor)", responses: { "201": { description: "Created" }, "409": { description: "Code already used" } } },
    },
    "/ahsp/categories": {
      get: { tags: ["Estimation"], summary: "List distinct AHSP work categories (admin/editor)", responses: { "200": { description: "Category names" } } },
    },
    "/ahsp/{id}": {
      get: { tags: ["Estimation"], summary: "Get an AHSP with computed unit price", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "AHSP" }, "404": { description: "Not found" } } },
      put: { tags: ["Estimation"], summary: "Update an AHSP; sending `components` replaces them wholesale (admin/editor)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Updated" } } },
      delete: { tags: ["Estimation"], summary: "Delete an AHSP (admin only)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Deleted" }, "400": { description: "Still referenced by a RAB item" } } },
    },
    "/rab": {
      get: {
        tags: ["Estimation"],
        summary: "List RAB documents (admin/editor)",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "pageSize", in: "query", schema: { type: "integer" } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["DRAFT", "REVIEW", "APPROVED", "REJECTED", "ARCHIVED"] } },
        ],
        responses: { "200": { description: "Paginated RAB list" } },
      },
      post: {
        tags: ["Estimation"],
        summary: "Create a RAB with sections and items (admin/editor)",
        description:
          "Totals are always recomputed server-side with Decimal arithmetic: subtotal → diskon → DPP → PPN → total. `number` is generated automatically (RAB/<year>/<seq>) when omitted.",
        responses: { "201": { description: "Created" }, "409": { description: "RAB number already used" } },
      },
    },
    "/rab/{id}": {
      get: { tags: ["Estimation"], summary: "Get a RAB with sections, items, and section weight summary", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "RAB detail" }, "404": { description: "Not found" } } },
      put: { tags: ["Estimation"], summary: "Update a RAB; sending `sections` replaces the whole structure (admin/editor)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Updated" } } },
      delete: { tags: ["Estimation"], summary: "Delete a RAB and all its sections/items (admin only)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Deleted" } } },
    },
    "/rab/{id}/export.csv": {
      get: {
        tags: ["Estimation"],
        summary: "Export a RAB as CSV (UTF-8 with BOM, opens directly in Excel)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "CSV document", content: { "text/csv": { schema: { type: "string" } } } } },
      },
    },
        "/rab/{id}/takeoff": {
          get: {
            tags: ["Estimation"],
            summary: "Get takeoff / rekap kebutuhan sumber daya dari sebuah RAB",
            description:
              "Menurunkan kebutuhan upah, bahan, dan alat dari volume item RAB berbasis AHSP, sekaligus melaporkan item manual yang belum punya AHSP.",
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: { "200": { description: "Takeoff detail" }, "404": { description: "Not found" } },
          },
        },
        "/rab/{id}/takeoff.csv": {
          get: {
            tags: ["Estimation"],
            summary: "Export takeoff sebuah RAB sebagai CSV",
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: { "200": { description: "CSV document", content: { "text/csv": { schema: { type: "string" } } } } },
          },
        },

    // --- CMS konten situs ---------------------------------------------------
    "/site-content/public": {
      get: {
        tags: ["Site Content"],
        summary: "All editable site content in one payload (public)",
        description:
          "Returns every active collection item grouped by collection, plus the key/value settings. Consumed by the Next.js public pages and cached.",
        security: [],
        responses: { "200": { description: "Collections and settings" } },
      },
    },
    "/site-content/collections": {
      get: { tags: ["Site Content"], summary: "Collection registry: keys, labels, and which fields each uses (admin/editor)", responses: { "200": { description: "Collection definitions" } } },
    },
    "/site-content/items/{collection}": {
      get: { tags: ["Site Content"], summary: "List items in a collection, including hidden ones (admin/editor)", parameters: [{ name: "collection", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Items" }, "400": { description: "Unknown collection" } } },
    },
    "/site-content/items": {
      post: { tags: ["Site Content"], summary: "Create a content item; appended to the end of its collection (admin/editor)", responses: { "201": { description: "Created" } } },
    },
    "/site-content/items/{id}": {
      put: { tags: ["Site Content"], summary: "Update a content item (admin/editor)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Updated" } } },
      delete: { tags: ["Site Content"], summary: "Delete a content item (admin/editor)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Deleted" } } },
    },
    "/site-content/items/{id}/move": {
      post: {
        tags: ["Site Content"],
        summary: "Reorder an item by swapping position with its neighbour (admin/editor)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { direction: { type: "string", enum: ["up", "down"] } } } } } },
        responses: { "200": { description: "Reordered" }, "400": { description: "Invalid direction" } },
      },
    },
    // --- Surat Penawaran Harga ----------------------------------------------
    "/quotations": {
      get: {
        tags: ["Quotations"],
        summary: "List quotations (admin/editor)",
        description: "Each row includes `isExpired`, computed from `validUntil` at read time rather than stored.",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "pageSize", in: "query", schema: { type: "integer" } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "CANCELLED"] } },
        ],
        responses: { "200": { description: "Paginated quotation list" } },
      },
      post: {
        tags: ["Quotations"],
        summary: "Create a quotation from a RAB (admin/editor)",
        description:
          "Copies the RAB's sections, items and totals into an immutable `snapshot`. Editing the RAB afterwards never changes an issued quotation. Number is generated as SPH/<year>/<seq> when omitted.",
        responses: { "201": { description: "Created" }, "404": { description: "RAB not found" }, "409": { description: "Number already used" } },
      },
    },
    "/quotations/defaults": {
      get: {
        tags: ["Quotations"],
        summary: "Suggested letter defaults for a given RAB (admin/editor)",
        parameters: [{ name: "rabId", in: "query", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Defaults for the create form" } },
      },
    },
    "/quotations/{id}": {
      get: { tags: ["Quotations"], summary: "Get a quotation with its frozen snapshot", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Quotation" }, "404": { description: "Not found" } } },
      put: {
        tags: ["Quotations"],
        summary: "Update letter text only — amounts stay frozen (admin/editor)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Updated" }, "400": { description: "Accepted/rejected quotations are locked" } },
      },
      delete: { tags: ["Quotations"], summary: "Delete a quotation (admin only; accepted ones must be cancelled instead)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Deleted" }, "400": { description: "Accepted quotation cannot be deleted" } } },
    },
    "/quotations/{id}/status": {
      patch: {
        tags: ["Quotations"],
        summary: "Advance the quotation status (admin/editor)",
        description: "Only sensible transitions are allowed: DRAFT→SENT/CANCELLED, SENT→ACCEPTED/REJECTED/CANCELLED/DRAFT, ACCEPTED/REJECTED→CANCELLED.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { status: { type: "string", enum: ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "CANCELLED"] } } } } } },
        responses: { "200": { description: "Updated" }, "400": { description: "Transition not allowed" } },
      },
    },

    "/site-content/settings": {
      get: { tags: ["Site Content"], summary: "List site settings, creating any missing defaults (admin/editor)", responses: { "200": { description: "Settings" } } },
      put: {
        tags: ["Site Content"],
        summary: "Update several settings at once (admin/editor)",
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { settings: { type: "array", items: { type: "object", properties: { key: { type: "string" }, value: { type: "string" } } } } } } } } },
        responses: { "200": { description: "Updated settings" }, "400": { description: "Unknown setting key" } },
      },
    },
  },
} as const;
