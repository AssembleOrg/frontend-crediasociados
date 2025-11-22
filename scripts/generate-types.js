#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const RAILWAY_FILE = path.join(__dirname, '../../.claude/railwayendpoints.json');
const OUTPUT_FILE = path.join(__dirname, '..', 'types', 'api-generated.ts');

try {
  
  
  const content = fs.readFileSync(RAILWAY_FILE, 'utf8');
  const spec = JSON.parse(content);
  
  
  // Add missing schema definitions to avoid $ref resolution errors
  if (!spec.components) {
    spec.components = { schemas: {} };
  }
  if (!spec.components.schemas) {
    spec.components.schemas = {};
  }
  
  // Add missing schemas that are referenced but not defined
  const missingSchemas = {
    CreateClientDto: {
      type: "object",
      properties: {
        fullName: { type: "string" },
        dni: { type: "string" },
        cuit: { type: "string" },
        phone: { type: "string" },
        email: { type: "string" },
        address: { type: "string" },
        job: { type: "string" }
      },
      required: ["fullName"]
    },
    ClientResponseDto: {
      type: "object",
      properties: {
        id: { type: "string" },
        fullName: { type: "string" },
        dni: { type: "string", nullable: true },
        cuit: { type: "string", nullable: true },
        phone: { type: "string", nullable: true },
        email: { type: "string", nullable: true },
        address: { type: "string", nullable: true },
        job: { type: "string", nullable: true },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" }
      },
      required: ["id", "fullName", "createdAt", "updatedAt"]
    },
    ClientWithManagersDto: {
      type: "object",
      allOf: [
        { "$ref": "#/components/schemas/ClientResponseDto" },
        {
          type: "object",
          properties: {
            managers: {
              type: "array",
              items: { "$ref": "#/components/schemas/UserResponseDto" }
            }
          }
        }
      ]
    },
    ClientWithDetailsDto: {
      type: "object",
      allOf: [
        { "$ref": "#/components/schemas/ClientResponseDto" },
        {
          type: "object",
          properties: {
            loans: {
              type: "array",
              items: { type: "object" }
            },
            managers: {
              type: "array", 
              items: { "$ref": "#/components/schemas/UserResponseDto" }
            }
          }
        }
      ]
    },
    PaginationMeta: {
      type: "object",
      properties: {
        page: { type: "number" },
        limit: { type: "number" },
        total: { type: "number" },
        totalPages: { type: "number" },
        hasNextPage: { type: "boolean" },
        hasPreviousPage: { type: "boolean" }
      },
      required: ["page", "limit", "total", "totalPages", "hasNextPage", "hasPreviousPage"]
    }
  };
  
  // Add missing schemas to the spec
  Object.assign(spec.components.schemas, missingSchemas);
  
  // Crear archivo temporal
  const TEMP_FILE = path.join(__dirname, '..', 'types', 'temp-openapi.json');
  fs.writeFileSync(TEMP_FILE, JSON.stringify(spec, null, 2));
  
  // Generar tipos desde archivo temporal
  const command = `npx openapi-typescript "${TEMP_FILE}" --output "${OUTPUT_FILE}"`;
  execSync(command, { stdio: 'inherit' });
  
  // Limpiar archivo temporal
  fs.unlinkSync(TEMP_FILE);
  
} catch (error) {
  
  process.exit(1);
}