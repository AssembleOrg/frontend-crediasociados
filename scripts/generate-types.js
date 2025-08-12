#!/usr/bin/env node

/**
 * Script para generar tipos TypeScript desde el OpenAPI spec del backend
 * 
 * Usage:
 *   npm run generate-types
 * 
 * Este script:
 *   1. Lee el OpenAPI spec desde railwayendpoints.md
 *   2. Genera tipos TypeScript usando openapi-typescript
 *   3. Los guarda en types/api-generated.ts
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const RAILWAY_ENDPOINTS_FILE = path.join(__dirname, '../../.claude/railwayendpoints.md');
const TEMP_OPENAPI_FILE = path.join(__dirname, '..', 'types', 'openapi-temp.json');
const OUTPUT_FILE = path.join(__dirname, '..', 'types', 'api-generated.ts');

async function generateTypes() {
  try {
    console.log('🔄 Generando tipos TypeScript desde Railway endpoints...');
    
    // Leer el archivo de endpoints de Railway
    if (!fs.existsSync(RAILWAY_ENDPOINTS_FILE)) {
      throw new Error(`No se encuentra el archivo: ${RAILWAY_ENDPOINTS_FILE}`);
    }
    
    const content = fs.readFileSync(RAILWAY_ENDPOINTS_FILE, 'utf8');
    
    // Extraer el objeto swaggerDoc del contenido
    const swaggerMatch = content.match(/"swaggerDoc":\s*({[\s\S]*}),?\s*"customOptions"/);
    
    if (!swaggerMatch) {
      throw new Error('No se pudo extraer swaggerDoc del archivo');
    }
    
    const swaggerDoc = JSON.parse(swaggerMatch[1]);
    
    // Asegurar que el directorio types existe
    const typesDir = path.dirname(TEMP_OPENAPI_FILE);
    if (!fs.existsSync(typesDir)) {
      fs.mkdirSync(typesDir, { recursive: true });
    }
    
    // Crear archivo temporal con el spec OpenAPI
    fs.writeFileSync(TEMP_OPENAPI_FILE, JSON.stringify(swaggerDoc, null, 2));
    console.log('📄 OpenAPI spec extraído exitosamente');
    
    // Generar tipos usando openapi-typescript
    const command = `npx openapi-typescript "${TEMP_OPENAPI_FILE}" --output "${OUTPUT_FILE}"`;
    
    execSync(command, { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..') 
    });
    
    // Limpiar archivo temporal
    fs.unlinkSync(TEMP_OPENAPI_FILE);
    
    console.log(`✅ Tipos generados exitosamente en: ${OUTPUT_FILE}`);
    console.log('\n📝 Próximos pasos:');
    console.log('   1. Revisa los tipos generados');
    console.log('   2. Actualiza tus services para usar los tipos generados');
    console.log('   3. Importa tipos en tu código: import type { paths } from "@/types/api-generated"');
    
  } catch (error) {
    console.error('❌ Error generando tipos:', error.message);
    console.log('\n🔧 Solución de problemas:');
    console.log('   1. Verifica que existe el archivo railwayendpoints.md');
    console.log('   2. Revisa que el formato JSON sea válido');
    console.log('   3. Asegurate que openapi-typescript esté instalado');
    process.exit(1);
  }
}

generateTypes();