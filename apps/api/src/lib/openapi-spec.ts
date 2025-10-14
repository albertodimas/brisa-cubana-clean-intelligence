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
    version: "0.2.8",
    description:
      "API para gestión de servicios de limpieza, reservas, propiedades y usuarios",
    contact: {
      name: "Brisa Cubana Support",
      email: "admin@brisacubanaclean.com",
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
            example: "admin@brisacubanaclean.com",
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
            example: { error: "Too many requests" },
          },
        },
      },
    },
  },
} as const;
