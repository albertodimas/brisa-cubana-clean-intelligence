/**
 * OpenAPI 3.1 Specification for Brisa Cubana Clean Intelligence API
 *
 * This file defines the complete API specification including:
 * - All endpoints and operations
 * - Request/response schemas
 * - Authentication requirements
 * - Error responses
 */

export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Brisa Cubana Clean Intelligence API",
    version: "0.4.2",
    description:
      "API para gestión de servicios de limpieza, reservas, propiedades y usuarios",
    contact: {
      name: "Brisa Cubana Support",
      email: "admin@brisacubanacleanintelligence.com",
    },
  },
  servers: [
    {
      url: "https://brisa-cubana-clean-intelligence-api.vercel.app",
      description: "Production",
    },
    {
      url: "http://localhost:3001",
      description: "Development",
    },
  ],
  tags: [
    {
      name: "Authentication",
      description: "Autenticación y gestión de sesión",
    },
    { name: "Users", description: "Gestión de usuarios (ADMIN only)" },
    { name: "Services", description: "Catálogo de servicios de limpieza" },
    { name: "Properties", description: "Gestión de propiedades" },
    { name: "Bookings", description: "Reservas de servicios" },
    { name: "Customers", description: "Clientes del sistema" },
    {
      name: "Notifications",
      description: "Alertas operativas para usuarios autenticados",
    },
    {
      name: "Payments",
      description: "Integraciones con Stripe (webhooks e intents)",
    },
    {
      name: "Portal",
      description: "Flujos de acceso del portal cliente",
    },
    {
      name: "Calendar",
      description: "Vista operativa de reservas y disponibilidad",
    },
    {
      name: "Marketing",
      description: "Contenido comercial (stats, testimonios, precios, FAQs)",
    },
    { name: "Health", description: "Health checks y monitoreo" },
  ],
  paths: {
    "/api": {
      get: {
        tags: ["Health"],
        summary: "API root endpoint",
        responses: {
          "200": {
            description: "API information",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    service: { type: "string" },
                    status: { type: "string" },
                    version: { type: "string" },
                    timestamp: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Health check endpoint",
        responses: {
          "200": {
            description: "System is healthy",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthCheck" },
              },
            },
          },
          "500": {
            description: "System is unhealthy",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthCheckFailed" },
              },
            },
          },
        },
      },
    },
    "/api/payments/stripe/intent": {
      post: {
        tags: ["Payments"],
        summary: "Crear PaymentIntent de Stripe para checkout público",
        description:
          "Recibe un client_secret listo para usar con Stripe Payment Element. Valida que el servicio esté activo y adjunta metadatos para el webhook.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StripeIntentRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "PaymentIntent creado correctamente",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StripeIntentResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "404": { $ref: "#/components/responses/NotFound" },
          "503": {
            description: "Stripe no está configurado en el entorno",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { error: { type: "string" } },
                },
              },
            },
          },
        },
      },
    },
    "/api/payments/stripe/webhook": {
      post: {
        tags: ["Payments"],
        summary: "Webhook de Stripe para eventos críticos",
        description:
          "Procesa eventos de Checkout y PaymentIntent. Verifica la firma con STRIPE_WEBHOOK_SECRET.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object" },
            },
          },
        },
        responses: {
          "200": {
            description: "Evento recibido",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    received: { type: "boolean", example: true },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "503": {
            description: "Stripe no está configurado en el entorno",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { error: { type: "string" } },
                },
              },
            },
          },
        },
      },
    },
    "/api/portal/auth/request": {
      post: {
        tags: ["Portal"],
        summary: "Solicitar enlace mágico para portal cliente",
        description:
          "Genera un enlace de acceso temporal para clientes registrados. En entornos QA puede devolver el token en la respuesta; en producción el enlace se entrega exclusivamente por correo.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MagicLinkRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Solicitud aceptada",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/MagicLinkRequestResponse",
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
        },
      },
    },
    "/api/portal/auth/verify": {
      post: {
        tags: ["Portal"],
        summary: "Validar enlace mágico y obtener token de sesión",
        description:
          "Valida el token recibido y emite un JWT de portal (cookie httpOnly) para acceder al dashboard.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MagicLinkVerifyRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Token válido",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/MagicLinkVerifyResponse",
                },
              },
            },
          },
          "400": {
            description: "Token inválido o expirado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/portal/auth/logout": {
      post: {
        tags: ["Portal"],
        summary: "Cerrar sesión en el portal cliente",
        description:
          "Invalida la sesión asociada al token de portal del cliente.",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "Sesión cerrada",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PortalLogoutResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/portal/bookings": {
      get: {
        tags: ["Portal"],
        summary: "Listar reservas visibles para el portal cliente",
        description:
          "Devuelve las reservas del cliente autenticado mediante el token de portal.",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: [
                "PENDING",
                "CONFIRMED",
                "IN_PROGRESS",
                "COMPLETED",
                "CANCELLED",
              ],
            },
            description: "Filtra por estado de reserva",
          },
          {
            name: "limit",
            in: "query",
            schema: {
              type: "integer",
              minimum: 1,
              maximum: 50,
              default: 20,
            },
            description: "Límite de elementos por página",
          },
          {
            name: "cursor",
            in: "query",
            schema: { type: "string" },
            description: "Cursor de paginación",
          },
        ],
        responses: {
          "200": {
            description: "Reservas encontradas",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PortalBookingsList" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/authentication/login": {
      post: {
        tags: ["Authentication"],
        summary: "User login",
        description:
          "Authenticate user and receive JWT token. Rate limited to 5 attempts per 60 seconds per IP (configurable via LOGIN_RATE_LIMIT env var).",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/AccountDeactivated" },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },
    "/api/authentication/logout": {
      post: {
        tags: ["Authentication"],
        summary: "User logout",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "Logout successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { success: { type: "boolean" } },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/authentication/me": {
      get: {
        tags: ["Authentication"],
        summary: "Get current user",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "Current user information",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { data: { $ref: "#/components/schemas/User" } },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/users": {
      get: {
        tags: ["Users"],
        summary: "List all users",
        description: "Admin only. Returns all system users.",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "List of users",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/User" },
                    },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
      post: {
        tags: ["Users"],
        summary: "Create new user",
        description: "Admin only. Creates a new user in the system.",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateUserRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "User created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { data: { $ref: "#/components/schemas/User" } },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "409": {
            description: "Email already registered",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/users/{userId}": {
      patch: {
        tags: ["Users"],
        summary: "Update user",
        description:
          "Admin only. Update user details. Cannot change own role or deactivate own account.",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "User ID (CUID)",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateUserRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "User updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { data: { $ref: "#/components/schemas/User" } },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Users"],
        summary: "Soft delete user",
        description:
          "Admin only. Performs a logical delete by setting `deletedAt`. It is not possible to delete the authenticated admin account.",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "User ID (CUID)",
          },
        ],
        responses: {
          "200": {
            description: "User soft deleted",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
                example: { message: "User deleted successfully" },
              },
            },
          },
          "400": {
            description:
              "Invalid operation (e.g. attempting to delete yourself)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: { error: "No puedes eliminar tu propia cuenta" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/notifications": {
      get: {
        tags: ["Notifications"],
        summary: "List notifications for the authenticated user",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100 },
            description: "Number of notifications to return (default 25)",
          },
          {
            name: "cursor",
            in: "query",
            schema: { type: "string" },
            description: "Cursor for pagination (notification ID)",
          },
          {
            name: "unreadOnly",
            in: "query",
            schema: { type: "string", enum: ["true", "false"] },
            description: "Return only unread notifications when set to true",
          },
        ],
        responses: {
          "200": {
            description: "List of notifications",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/NotificationList" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/notifications/{notificationId}/read": {
      patch: {
        tags: ["Notifications"],
        summary: "Mark a notification as read",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "notificationId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Notification ID",
          },
        ],
        responses: {
          "200": {
            description: "Notification marked as read",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Notification" },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/notifications/read-all": {
      patch: {
        tags: ["Notifications"],
        summary: "Mark all notifications for the user as read",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "Number of notifications updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        updatedCount: {
                          type: "integer",
                          example: 5,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/services": {
      get: {
        tags: ["Services"],
        summary: "List all services",
        responses: {
          "200": {
            description: "List of services",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Service" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Services"],
        summary: "Create new service",
        description: "Admin/Coordinator only. Creates a new cleaning service.",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateServiceRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Service created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Service" },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/services/{serviceId}": {
      patch: {
        tags: ["Services"],
        summary: "Update service",
        description: "Admin/Coordinator only. Update service details.",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "serviceId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Service ID (CUID)",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateServiceRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Service updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Service" },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Services"],
        summary: "Soft delete service",
        description:
          "Admin only. Performs a logical delete by setting `deletedAt`.",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "serviceId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Service ID (CUID)",
          },
        ],
        responses: {
          "200": {
            description: "Service soft deleted",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
                example: { message: "Service deleted successfully" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/properties": {
      get: {
        tags: ["Properties"],
        summary: "List all properties",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "List of properties",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Property" },
                    },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      post: {
        tags: ["Properties"],
        summary: "Create new property",
        description: "Admin/Coordinator only. Register a new property.",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreatePropertyRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Property created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Property" },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/properties/{propertyId}": {
      patch: {
        tags: ["Properties"],
        summary: "Update property",
        description: "Admin/Coordinator only. Update property details.",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "propertyId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Property ID (CUID)",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdatePropertyRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Property updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Property" },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Properties"],
        summary: "Soft delete property",
        description:
          "Admin only. Performs a logical delete by setting `deletedAt`.",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "propertyId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Property ID (CUID)",
          },
        ],
        responses: {
          "200": {
            description: "Property soft deleted",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
                example: { message: "Property deleted successfully" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/bookings": {
      get: {
        tags: ["Bookings"],
        summary: "List bookings",
        description:
          "Returns bookings filtered by query parameters. Admin/Coordinator see all, Staff/Client see assigned only.",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "from",
            in: "query",
            schema: { type: "string", format: "date-time" },
            description: "Filter by scheduledAt >= from",
          },
          {
            name: "to",
            in: "query",
            schema: { type: "string", format: "date-time" },
            description: "Filter by scheduledAt <= to",
          },
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: [
                "PENDING",
                "CONFIRMED",
                "IN_PROGRESS",
                "COMPLETED",
                "CANCELLED",
              ],
            },
            description: "Filter by booking status",
          },
          {
            name: "propertyId",
            in: "query",
            schema: { type: "string" },
            description: "Filter by property ID",
          },
          {
            name: "serviceId",
            in: "query",
            schema: { type: "string" },
            description: "Filter by service ID",
          },
          {
            name: "customerId",
            in: "query",
            schema: { type: "string" },
            description: "Filter by customer ID",
          },
        ],
        responses: {
          "200": {
            description: "List of bookings",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Booking" },
                    },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      post: {
        tags: ["Bookings"],
        summary: "Create new booking",
        description: "Admin/Coordinator only. Create a new service booking.",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateBookingRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Booking created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Booking" },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/bookings/{bookingId}": {
      patch: {
        tags: ["Bookings"],
        summary: "Update booking",
        description:
          "Admin/Coordinator can update all fields. Staff can only update status.",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "bookingId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Booking ID (CUID)",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateBookingRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Booking updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Booking" },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Bookings"],
        summary: "Soft delete booking",
        description:
          "Admin/Coordinator only. Performs a logical delete by setting `deletedAt`.",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "bookingId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Booking ID (CUID)",
          },
        ],
        responses: {
          "200": {
            description: "Booking soft deleted",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
                example: { message: "Booking deleted successfully" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/calendar": {
      get: {
        tags: ["Calendar"],
        summary: "Obtener calendario operacional",
        description:
          "Devuelve reservas agrupadas por fecha dentro de un rango máximo de 90 días con métricas resumidas.",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "from",
            in: "query",
            required: true,
            schema: { type: "string", format: "date-time" },
            description: "Fecha de inicio (inclusive) del rango a consultar.",
          },
          {
            name: "to",
            in: "query",
            required: true,
            schema: { type: "string", format: "date-time" },
            description:
              "Fecha de término (inclusive). No debe superar 90 días desde `from`.",
          },
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: [
                "PENDING",
                "CONFIRMED",
                "IN_PROGRESS",
                "COMPLETED",
                "CANCELLED",
              ],
            },
            description: "Filtrar por estado de la reserva.",
          },
          {
            name: "propertyId",
            in: "query",
            schema: { type: "string" },
            description: "Filtrar por propiedad.",
          },
          {
            name: "serviceId",
            in: "query",
            schema: { type: "string" },
            description: "Filtrar por servicio.",
          },
          {
            name: "assignedStaffId",
            in: "query",
            schema: { type: "string" },
            description: "Filtrar por miembro de staff asignado.",
          },
        ],
        responses: {
          "200": {
            description: "Calendario agrupado por fecha",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CalendarResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/calendar/availability": {
      get: {
        tags: ["Calendar"],
        summary: "Consultar disponibilidad diaria",
        description:
          "Calcula intervalos disponibles para una propiedad y duración específica usando las reservas existentes del día.",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "date",
            in: "query",
            required: true,
            schema: { type: "string", format: "date-time" },
            description:
              "Fecha del día a consultar (se usa la zona horaria del servidor).",
          },
          {
            name: "propertyId",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "Identificador de la propiedad a consultar.",
          },
          {
            name: "durationMin",
            in: "query",
            schema: { type: "integer", minimum: 30, default: 60 },
            description:
              "Duración estimada en minutos. Debe ser >= 30 (por defecto 60).",
          },
        ],
        responses: {
          "200": {
            description: "Slots disponibles y reservas actuales del día",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CalendarAvailabilityResponse",
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/marketing/stats/portfolio": {
      get: {
        tags: ["Marketing"],
        summary: "Obtener métricas de portafolio",
        description:
          "Devuelve la última captura de métricas públicas mostradas en la landing (propiedades activas, rating promedio, turnovers).",
        responses: {
          "200": {
            description: "Métricas vigentes",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/PortfolioStats" },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Marketing"],
        summary: "Registrar nueva métrica de portafolio",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PortfolioStatsRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Métrica registrada",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/PortfolioStats" },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/marketing/testimonials": {
      get: {
        tags: ["Marketing"],
        summary: "Listar testimonios publicados",
        parameters: [
          {
            name: "showAll",
            in: "query",
            schema: { type: "boolean" },
            description:
              "Cuando es true devuelve todos los registros (requiere autenticación).",
          },
        ],
        responses: {
          "200": {
            description: "Listado de testimonios",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Testimonial" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Marketing"],
        summary: "Crear testimonio",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TestimonialRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Testimonio creado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Testimonial" },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/marketing/testimonials/{id}": {
      patch: {
        tags: ["Marketing"],
        summary: "Actualizar testimonio",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TestimonialRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Testimonio actualizado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Testimonial" },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Marketing"],
        summary: "Eliminar testimonio",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Testimonio eliminado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
                example: { message: "Testimonio eliminado exitosamente" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/marketing/faqs": {
      get: {
        tags: ["Marketing"],
        summary: "Listar FAQs públicas",
        parameters: [
          {
            name: "showAll",
            in: "query",
            schema: { type: "boolean" },
            description:
              "Cuando es true devuelve todos los registros (requiere autenticación).",
          },
        ],
        responses: {
          "200": {
            description: "Listado de preguntas frecuentes",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/FAQ" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Marketing"],
        summary: "Crear FAQ",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/FAQRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "FAQ creada",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/FAQ" },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/marketing/faqs/{id}": {
      patch: {
        tags: ["Marketing"],
        summary: "Actualizar FAQ",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/FAQRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "FAQ actualizada",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/FAQ" },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Marketing"],
        summary: "Eliminar FAQ",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "FAQ eliminada",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
                example: { message: "FAQ eliminado exitosamente" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/marketing/pricing": {
      get: {
        tags: ["Marketing"],
        summary: "Listar planes comerciales",
        parameters: [
          {
            name: "showAll",
            in: "query",
            schema: { type: "boolean" },
            description:
              "Cuando es true devuelve todos los registros (requiere autenticación).",
          },
        ],
        responses: {
          "200": {
            description: "Listado de planes",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/PricingTier" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Marketing"],
        summary: "Crear plan comercial",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PricingTierRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Plan creado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/PricingTier" },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/marketing/pricing/{id}": {
      patch: {
        tags: ["Marketing"],
        summary: "Actualizar plan comercial",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PricingTierRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Plan actualizado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/PricingTier" },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Marketing"],
        summary: "Eliminar plan comercial",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Plan eliminado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
                example: { message: "Pricing tier eliminado exitosamente" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/marketing/stats/market": {
      get: {
        tags: ["Marketing"],
        summary: "Obtener indicadores de mercado",
        description:
          "Devuelve los indicadores públicos del mercado consumidos por la landing.",
        responses: {
          "200": {
            description: "Listado de métricas",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/MarketStat" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Marketing"],
        summary: "Crear o actualizar indicador de mercado",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MarketStatRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Indicador registrado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/MarketStat" },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/customers": {
      get: {
        tags: ["Customers"],
        summary: "List all customers",
        description:
          "Admin/Coordinator only. Returns all customers in the system.",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "List of customers",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/User" },
                    },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          "JWT token obtained from /api/authentication/login. Include as: Authorization: Bearer <token>",
      },
    },
    schemas: {
      HealthCheck: {
        type: "object",
        properties: {
          status: { type: "string", example: "pass" },
          checks: {
            type: "object",
            properties: {
              uptime: { type: "integer", example: 12345 },
              environment: { type: "string", example: "production" },
              database: { type: "string", example: "ok" },
            },
          },
        },
      },
      HealthCheckFailed: {
        type: "object",
        properties: {
          status: { type: "string", example: "fail" },
          checks: {
            type: "object",
            properties: {
              uptime: { type: "integer", example: 12345 },
              environment: { type: "string", example: "production" },
              database: { type: "string", example: "error" },
            },
          },
          error: { type: "string", example: "Connection timeout" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "admin@brisacubanacleanintelligence.com",
          },
          password: {
            type: "string",
            format: "password",
            example: "Brisa123!",
          },
        },
      },
      LoginResponse: {
        type: "object",
        properties: {
          token: {
            type: "string",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          },
          user: { $ref: "#/components/schemas/User" },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", example: "clxyz123456789" },
          email: {
            type: "string",
            format: "email",
            example: "user@example.com",
          },
          fullName: { type: "string", example: "John Doe" },
          role: {
            type: "string",
            enum: ["ADMIN", "COORDINATOR", "STAFF", "CLIENT"],
            example: "COORDINATOR",
          },
          isActive: { type: "boolean", example: true },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2025-10-09T12:00:00.000Z",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2025-10-09T12:00:00.000Z",
          },
        },
      },
      Notification: {
        type: "object",
        properties: {
          id: { type: "string", example: "clnotif123" },
          type: {
            type: "string",
            enum: [
              "BOOKING_CREATED",
              "BOOKING_CANCELLED",
              "USER_DEACTIVATED",
              "SERVICE_UPDATED",
            ],
            example: "BOOKING_CREATED",
          },
          message: {
            type: "string",
            example:
              "Se agendó BRISA-0003 – Amenity Refresh Express en Azure Villa Key Biscayne.",
          },
          readAt: {
            type: "string",
            format: "date-time",
            nullable: true,
            example: null,
          },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2025-10-15T14:30:00.000Z",
          },
        },
      },
      NotificationList: {
        type: "object",
        properties: {
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/Notification" },
          },
          pagination: {
            type: "object",
            properties: {
              limit: { type: "integer", example: 25 },
              cursor: { type: "string", nullable: true, example: null },
              nextCursor: {
                type: "string",
                nullable: true,
                example: "clnotif789",
              },
              hasMore: { type: "boolean", example: true },
            },
          },
        },
      },
      PortalBookingsList: {
        type: "object",
        properties: {
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/Booking" },
          },
          customer: {
            type: "object",
            properties: {
              id: { type: "string", example: "user_123" },
              email: {
                type: "string",
                format: "email",
                example: "client@portal.test",
              },
              fullName: {
                type: "string",
                nullable: true,
                example: "Cliente Portal",
              },
            },
          },
          pagination: {
            type: "object",
            properties: {
              limit: { type: "integer", example: 20 },
              cursor: { type: "string", nullable: true, example: null },
              nextCursor: { type: "string", nullable: true, example: null },
              hasMore: { type: "boolean", example: false },
            },
          },
        },
      },
      PortalLogoutResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
        },
      },
      StripeIntentRequest: {
        type: "object",
        required: ["serviceId", "customerEmail"],
        properties: {
          serviceId: {
            type: "string",
            example: "srv_123",
            description: "Identificador del servicio activo a reservar",
          },
          scheduledFor: {
            type: "string",
            format: "date-time",
            nullable: true,
            description: "Fecha propuesta por el cliente",
            example: "2025-10-20T14:00:00.000Z",
          },
          customerEmail: {
            type: "string",
            format: "email",
            example: "cliente@correo.com",
          },
          customerFullName: {
            type: "string",
            nullable: true,
            example: "Laura Pérez",
          },
          notes: {
            type: "string",
            nullable: true,
            maxLength: 500,
            example: "Favor de traer productos hipoalergénicos.",
          },
        },
      },
      StripeIntentResponse: {
        type: "object",
        properties: {
          data: {
            type: "object",
            required: ["clientSecret", "paymentIntentId", "amount", "currency"],
            properties: {
              clientSecret: {
                type: "string",
                example: "pi_123_secret_456",
              },
              paymentIntentId: { type: "string", example: "pi_123" },
              amount: { type: "integer", example: 14500 },
              currency: { type: "string", example: "usd" },
            },
          },
        },
      },
      MagicLinkRequest: {
        type: "object",
        required: ["email"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "cliente@brisacubanacleanintelligence.com",
          },
        },
      },
      MagicLinkRequestResponse: {
        type: "object",
        properties: {
          message: {
            type: "string",
            example: "Enlace de acceso enviado.",
          },
          expiresAt: {
            type: "string",
            format: "date-time",
            example: "2025-10-16T15:00:00.000Z",
          },
          debugToken: {
            type: "string",
            nullable: true,
            description:
              "Incluido solo en QA cuando PORTAL_MAGIC_LINK_EXPOSE_DEBUG=true",
            example: "9c3e5b8d...",
          },
        },
      },
      MagicLinkVerifyRequest: {
        type: "object",
        required: ["token"],
        properties: {
          token: {
            type: "string",
            example: "9c3e5b8d...",
          },
        },
      },
      MagicLinkVerifyResponse: {
        type: "object",
        properties: {
          data: {
            type: "object",
            properties: {
              portalToken: {
                type: "string",
                description: "JWT válido por 1 hora con scope portal-client",
              },
              email: {
                type: "string",
                format: "email",
              },
              customerId: {
                type: "string",
                description: "Identificador del cliente asociado al portal",
              },
              expiresAt: {
                type: "string",
                format: "date-time",
                description: "Fecha de expiración del token de portal",
              },
            },
          },
        },
      },
      CreateUserRequest: {
        type: "object",
        required: ["email", "fullName", "password", "role"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "newuser@example.com",
          },
          fullName: {
            type: "string",
            minLength: 3,
            maxLength: 120,
            example: "Jane Smith",
          },
          password: {
            type: "string",
            format: "password",
            minLength: 8,
            maxLength: 64,
            example: "SecurePass123",
          },
          role: {
            type: "string",
            enum: ["ADMIN", "COORDINATOR", "STAFF", "CLIENT"],
            example: "STAFF",
          },
        },
      },
      UpdateUserRequest: {
        type: "object",
        minProperties: 1,
        properties: {
          fullName: {
            type: "string",
            minLength: 3,
            maxLength: 120,
            example: "Jane Updated",
          },
          role: {
            type: "string",
            enum: ["ADMIN", "COORDINATOR", "STAFF", "CLIENT"],
            example: "COORDINATOR",
          },
          password: {
            type: "string",
            format: "password",
            minLength: 8,
            maxLength: 64,
            example: "NewPassword456",
          },
          isActive: { type: "boolean", example: false },
        },
      },
      Service: {
        type: "object",
        properties: {
          id: { type: "string", example: "clxyz123456789" },
          name: { type: "string", example: "Limpieza Profunda" },
          description: {
            type: "string",
            nullable: true,
            example: "Servicio completo de limpieza",
          },
          basePrice: { type: "number", format: "float", example: 75.0 },
          durationMin: { type: "integer", example: 120 },
          active: { type: "boolean", example: true },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2025-10-09T12:00:00.000Z",
          },
        },
      },
      CreateServiceRequest: {
        type: "object",
        required: ["name", "basePrice", "durationMin"],
        properties: {
          name: {
            type: "string",
            minLength: 3,
            maxLength: 100,
            example: "Limpieza Express",
          },
          description: {
            type: "string",
            example: "Servicio rápido de limpieza",
          },
          basePrice: {
            type: "number",
            format: "float",
            minimum: 0,
            example: 50.0,
          },
          durationMin: { type: "integer", minimum: 1, example: 60 },
          active: { type: "boolean", example: true },
        },
      },
      UpdateServiceRequest: {
        type: "object",
        minProperties: 1,
        properties: {
          name: {
            type: "string",
            minLength: 3,
            maxLength: 100,
            example: "Limpieza Express Updated",
          },
          description: { type: "string", example: "Descripción actualizada" },
          basePrice: {
            type: "number",
            format: "float",
            minimum: 0,
            example: 55.0,
          },
          durationMin: { type: "integer", minimum: 1, example: 90 },
          active: { type: "boolean", example: false },
        },
      },
      Property: {
        type: "object",
        properties: {
          id: { type: "string", example: "clxyz123456789" },
          label: { type: "string", example: "Casa Miami Beach" },
          addressLine: { type: "string", example: "123 Ocean Drive" },
          city: { type: "string", example: "Miami Beach" },
          state: { type: "string", example: "FL" },
          zipCode: { type: "string", example: "33139" },
          type: {
            type: "string",
            enum: ["RESIDENTIAL", "VACATION_RENTAL", "OFFICE"],
            example: "RESIDENTIAL",
          },
          ownerId: { type: "string", example: "clxyz987654321" },
          bedrooms: { type: "integer", nullable: true, example: 3 },
          bathrooms: { type: "number", nullable: true, example: 2.5 },
          sqft: { type: "integer", nullable: true, example: 1800 },
          notes: {
            type: "string",
            nullable: true,
            example: "Parking en la entrada",
          },
          owner: {
            type: "object",
            nullable: true,
            properties: {
              id: { type: "string" },
              email: { type: "string", format: "email" },
              fullName: { type: "string", nullable: true },
            },
          },
        },
      },
      CreatePropertyRequest: {
        type: "object",
        required: [
          "label",
          "addressLine",
          "city",
          "state",
          "zipCode",
          "type",
          "ownerId",
        ],
        properties: {
          label: {
            type: "string",
            minLength: 3,
            maxLength: 100,
            example: "Nuevo Apartamento Downtown",
          },
          addressLine: { type: "string", example: "456 Main St Apt 5B" },
          city: { type: "string", example: "Miami" },
          state: { type: "string", example: "FL" },
          zipCode: { type: "string", example: "33130" },
          type: {
            type: "string",
            enum: ["RESIDENTIAL", "VACATION_RENTAL", "OFFICE"],
            example: "VACATION_RENTAL",
          },
          ownerId: { type: "string", example: "clxyz987654321" },
          bedrooms: { type: "integer", example: 2 },
          bathrooms: { type: "number", example: 1.0 },
          sqft: { type: "integer", example: 950 },
          notes: { type: "string", example: "Ascensor disponible" },
        },
      },
      UpdatePropertyRequest: {
        type: "object",
        minProperties: 1,
        properties: {
          label: { type: "string", minLength: 3, maxLength: 100 },
          addressLine: { type: "string" },
          city: { type: "string" },
          state: { type: "string" },
          zipCode: { type: "string" },
          type: {
            type: "string",
            enum: ["RESIDENTIAL", "VACATION_RENTAL", "OFFICE"],
          },
          ownerId: { type: "string" },
          bedrooms: { type: "integer" },
          bathrooms: { type: "number" },
          sqft: { type: "integer" },
          notes: { type: "string" },
        },
      },
      CalendarSummary: {
        type: "object",
        properties: {
          totalBookings: { type: "integer", example: 12 },
          statusCounts: {
            type: "object",
            additionalProperties: { type: "integer" },
            example: {
              CONFIRMED: 6,
              IN_PROGRESS: 2,
              COMPLETED: 3,
              CANCELLED: 1,
            },
          },
          totalRevenue: {
            type: "string",
            example: "1249.00",
            description:
              "Ingresos estimados del rango (formateado con 2 decimales).",
          },
        },
      },
      CalendarResponse: {
        type: "object",
        properties: {
          data: {
            type: "object",
            properties: {
              bookingsByDate: {
                type: "object",
                additionalProperties: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Booking" },
                },
              },
              dateRange: {
                type: "array",
                items: { type: "string", format: "date" },
                example: ["2025-11-07", "2025-11-08"],
              },
              summary: { $ref: "#/components/schemas/CalendarSummary" },
            },
          },
        },
      },
      CalendarTimeSlot: {
        type: "object",
        properties: {
          time: {
            type: "string",
            format: "date-time",
            example: "2025-11-07T10:00:00.000Z",
          },
          available: { type: "boolean", example: true },
          bookingId: {
            type: "string",
            nullable: true,
            example: "clbooking123",
          },
        },
      },
      CalendarAvailabilityResponse: {
        type: "object",
        properties: {
          data: {
            type: "object",
            properties: {
              date: { type: "string", format: "date-time" },
              propertyId: { type: "string" },
              durationMin: { type: "integer" },
              timeSlots: {
                type: "array",
                items: { $ref: "#/components/schemas/CalendarTimeSlot" },
              },
              bookings: {
                type: "array",
                items: { $ref: "#/components/schemas/Booking" },
              },
            },
          },
        },
      },
      PortfolioStats: {
        type: "object",
        properties: {
          activeProperties: { type: "integer", example: 42 },
          averageRating: { type: "string", example: "4.9" },
          totalTurnovers: { type: "integer", example: 128 },
          period: { type: "string", example: "Q4 2025" },
          lastUpdated: {
            type: "string",
            format: "date-time",
            example: "2025-11-06T09:30:00.000Z",
          },
        },
      },
      PortfolioStatsRequest: {
        type: "object",
        required: [
          "activeProperties",
          "averageRating",
          "totalTurnovers",
          "period",
        ],
        properties: {
          activeProperties: { type: "integer", minimum: 1, example: 42 },
          averageRating: {
            type: "number",
            minimum: 0,
            maximum: 5,
            example: 4.9,
          },
          totalTurnovers: { type: "integer", minimum: 0, example: 128 },
          period: { type: "string", example: "Q4 2025" },
        },
      },
      Testimonial: {
        type: "object",
        properties: {
          id: { type: "string", example: "cltest123" },
          author: { type: "string", example: "Gabriela B." },
          role: { type: "string", example: "Propietaria" },
          quote: {
            type: "string",
            example:
              "Brisa Cubana mantuvo nuestro inventario listo cada fin de semana.",
          },
          status: {
            type: "string",
            enum: ["PENDING", "APPROVED", "REJECTED"],
            example: "APPROVED",
          },
          order: { type: "integer", example: 1 },
          isActive: { type: "boolean", example: true },
        },
      },
      TestimonialRequest: {
        type: "object",
        required: ["author", "role", "quote"],
        properties: {
          author: { type: "string" },
          role: { type: "string" },
          quote: { type: "string" },
          status: {
            type: "string",
            enum: ["PENDING", "APPROVED", "REJECTED"],
          },
          order: { type: "integer" },
          isActive: { type: "boolean" },
        },
      },
      FAQ: {
        type: "object",
        properties: {
          id: { type: "string", example: "clfaq123" },
          question: {
            type: "string",
            example: "¿Cuánto tardan en entregar un reporte completo?",
          },
          answer: {
            type: "string",
            example: "En menos de 4 horas hábiles después del servicio.",
          },
          order: { type: "integer", example: 3 },
          isActive: { type: "boolean", example: true },
        },
      },
      FAQRequest: {
        type: "object",
        required: ["question", "answer"],
        properties: {
          question: { type: "string" },
          answer: { type: "string" },
          order: { type: "integer" },
          isActive: { type: "boolean" },
        },
      },
      PricingTier: {
        type: "object",
        properties: {
          id: { type: "string", example: "clplan123" },
          tierCode: { type: "string", example: "pilot-pro" },
          name: { type: "string", example: "Operativo" },
          headline: { type: "string", example: "Recorridos semanales" },
          description: {
            type: "string",
            nullable: true,
            example: "Para carteras con 5-10 propiedades activas.",
          },
          price: { type: "string", example: "$369" },
          priceSuffix: { type: "string", nullable: true, example: "/mes" },
          features: {
            type: "array",
            items: { type: "string" },
            example: ["Coadministrador dedicado", "Reportes 24/7"],
          },
          addons: {
            type: "array",
            nullable: true,
            items: { type: "string" },
            example: ["Turnos express bajo demanda"],
          },
          highlighted: { type: "boolean", example: true },
          order: { type: "integer", example: 2 },
          isActive: { type: "boolean", example: true },
        },
      },
      PricingTierRequest: {
        type: "object",
        required: ["tierCode", "name", "headline", "price", "features"],
        properties: {
          tierCode: { type: "string" },
          name: { type: "string" },
          headline: { type: "string" },
          description: { type: "string" },
          price: { type: "string" },
          priceSuffix: { type: "string" },
          features: {
            type: "array",
            items: { type: "string" },
          },
          addons: {
            type: "array",
            items: { type: "string" },
          },
          highlighted: { type: "boolean" },
          order: { type: "integer" },
          isActive: { type: "boolean" },
        },
      },
      MarketStat: {
        type: "object",
        properties: {
          metricId: { type: "string", example: "turnover-time" },
          label: { type: "string", example: "Tiempo promedio de turnover" },
          value: { type: "number", example: 3.2 },
          valueMax: { type: "number", nullable: true, example: 5 },
          source: { type: "string", example: "Datos internos" },
          sourceUrl: {
            type: "string",
            nullable: true,
            format: "uri",
            example: "https://example.com/datos-turnover",
          },
          period: { type: "string", nullable: true, example: "Q3 2025" },
          notes: {
            type: "string",
            nullable: true,
            example: "Incluye inventario piloto Miami",
          },
          presentation: {
            type: "object",
            properties: {
              format: { type: "string", enum: ["single", "range"] },
              decimals: { type: "integer", nullable: true },
              prefix: { type: "string", nullable: true },
              suffix: { type: "string", nullable: true },
            },
          },
          lastUpdated: {
            type: "string",
            format: "date-time",
            example: "2025-11-05T15:00:00.000Z",
          },
        },
      },
      MarketStatRequest: {
        type: "object",
        required: [
          "metricId",
          "label",
          "value",
          "source",
          "presentation",
          "lastUpdated",
        ],
        properties: {
          metricId: { type: "string" },
          label: { type: "string" },
          value: { type: "number" },
          valueMax: { type: "number" },
          source: { type: "string" },
          sourceUrl: { type: "string", format: "uri" },
          period: { type: "string" },
          notes: { type: "string" },
          presentation: {
            type: "object",
            properties: {
              format: { type: "string", enum: ["single", "range"] },
              decimals: { type: "integer" },
              prefix: { type: "string" },
              suffix: { type: "string" },
            },
          },
          lastUpdated: { type: "string", format: "date-time" },
        },
      },
      Booking: {
        type: "object",
        properties: {
          id: { type: "string", example: "clxyz123456789" },
          code: { type: "string", example: "BRS-2025-001" },
          scheduledAt: {
            type: "string",
            format: "date-time",
            example: "2025-10-15T10:00:00.000Z",
          },
          durationMin: { type: "integer", example: 120 },
          totalAmount: { type: "number", format: "float", example: 75.0 },
          status: {
            type: "string",
            enum: [
              "PENDING",
              "CONFIRMED",
              "IN_PROGRESS",
              "COMPLETED",
              "CANCELLED",
            ],
            example: "CONFIRMED",
          },
          notes: {
            type: "string",
            nullable: true,
            example: "Llegó con llaves",
          },
          service: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              basePrice: { type: "number" },
            },
          },
          property: {
            type: "object",
            properties: {
              id: { type: "string" },
              label: { type: "string" },
              city: { type: "string" },
            },
          },
          customer: {
            type: "object",
            nullable: true,
            properties: {
              id: { type: "string" },
              fullName: { type: "string", nullable: true },
              email: { type: "string", format: "email" },
            },
          },
          assignedStaff: {
            type: "object",
            nullable: true,
            properties: {
              id: { type: "string" },
              fullName: { type: "string", nullable: true },
              email: { type: "string", format: "email" },
            },
          },
        },
      },
      CreateBookingRequest: {
        type: "object",
        required: [
          "serviceId",
          "propertyId",
          "customerId",
          "scheduledAt",
          "durationMin",
          "totalAmount",
        ],
        properties: {
          serviceId: { type: "string", example: "clxyz111111111" },
          propertyId: { type: "string", example: "clxyz222222222" },
          customerId: { type: "string", example: "clxyz333333333" },
          scheduledAt: {
            type: "string",
            format: "date-time",
            example: "2025-10-20T14:00:00.000Z",
          },
          durationMin: { type: "integer", minimum: 1, example: 90 },
          totalAmount: {
            type: "number",
            format: "float",
            minimum: 0,
            example: 65.0,
          },
          status: {
            type: "string",
            enum: [
              "PENDING",
              "CONFIRMED",
              "IN_PROGRESS",
              "COMPLETED",
              "CANCELLED",
            ],
            example: "PENDING",
          },
          notes: {
            type: "string",
            example: "Cliente prefiere horario matutino",
          },
        },
      },
      UpdateBookingRequest: {
        type: "object",
        minProperties: 1,
        properties: {
          serviceId: { type: "string" },
          propertyId: { type: "string" },
          customerId: { type: "string" },
          scheduledAt: { type: "string", format: "date-time" },
          durationMin: { type: "integer", minimum: 1 },
          totalAmount: { type: "number", format: "float", minimum: 0 },
          status: {
            type: "string",
            enum: [
              "PENDING",
              "CONFIRMED",
              "IN_PROGRESS",
              "COMPLETED",
              "CANCELLED",
            ],
          },
          notes: { type: "string" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: {
            type: "string",
            example: "Descripción del error",
          },
        },
      },
      MessageResponse: {
        type: "object",
        properties: {
          message: {
            type: "string",
            example: "Operación realizada correctamente",
          },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: "No autenticado - token faltante o inválido",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: { error: "Unauthorized" },
          },
        },
      },
      AccountDeactivated: {
        description: "Cuenta desactivada",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: { error: "Account has been deactivated" },
          },
        },
      },
      Forbidden: {
        description:
          "No autorizado - permisos insuficientes para esta operación",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: { error: "Requiere rol ADMIN" },
          },
        },
      },
      NotFound: {
        description: "Recurso no encontrado",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: { error: "Recurso no encontrado" },
          },
        },
      },
      ValidationError: {
        description: "Error de validación - datos de entrada inválidos",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: { error: "Validación fallida: email es requerido" },
          },
        },
      },
      RateLimited: {
        description: "Demasiadas peticiones - límite de tasa excedido",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              error: "Demasiadas solicitudes. Intenta nuevamente más tarde.",
            },
          },
        },
      },
    },
  },
} as const;
