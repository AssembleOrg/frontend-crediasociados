/**
 * SEED SCRIPT: Create 20 clients for a specific user
 * User ID: cmh8qlkri002ygx2edyufbi35
 * Location: Zona Sur, Buenos Aires
 */

const API_URL = 'https://crediasociados-backend-production.up.railway.app/api/v1';

// Auth token - REPLACE WITH YOUR ACTUAL TOKEN
const AUTH_TOKEN = 'YOUR_TOKEN_HERE';

const USER_ID = 'cmh8qlkri002ygx2edyufbi35';

// Nombres y apellidos argentinos comunes
const nombres = [
  'Juan', 'María', 'Carlos', 'Ana', 'Roberto', 'Laura', 'José',
  'Patricia', 'Miguel', 'Claudia', 'Jorge', 'Silvia', 'Raúl',
  'Mónica', 'Daniel', 'Gabriela', 'Ricardo', 'Liliana', 'Fernando', 'Cristina'
];

const apellidos = [
  'González', 'Rodríguez', 'Fernández', 'López', 'Martínez', 'García',
  'Pérez', 'Sánchez', 'Romero', 'Torres', 'Díaz', 'Álvarez',
  'Castro', 'Moreno', 'Ramos', 'Flores', 'Benítez', 'Herrera', 'Silva', 'Vargas'
];

// Calles de la zona sur de Buenos Aires (Quilmes, Bernal, Lanús, Avellaneda, etc.)
const callesZonaSur = [
  { calle: 'Rivadavia', localidad: 'Quilmes', provincia: 'Buenos Aires' },
  { calle: 'San Martín', localidad: 'Quilmes', provincia: 'Buenos Aires' },
  { calle: 'Mitre', localidad: 'Quilmes', provincia: 'Buenos Aires' },
  { calle: 'Alberdi', localidad: 'Quilmes', provincia: 'Buenos Aires' },
  { calle: 'Avenida Calchaquí', localidad: 'Quilmes', provincia: 'Buenos Aires' },
  { calle: 'Brown', localidad: 'Bernal', provincia: 'Buenos Aires' },
  { calle: 'Belgrano', localidad: 'Bernal', provincia: 'Buenos Aires' },
  { calle: '9 de Julio', localidad: 'Bernal', provincia: 'Buenos Aires' },
  { calle: 'Crámer', localidad: 'Bernal', provincia: 'Buenos Aires' },
  { calle: 'Avenida Hipólito Yrigoyen', localidad: 'Lanús', provincia: 'Buenos Aires' },
  { calle: '29 de Septiembre', localidad: 'Lanús', provincia: 'Buenos Aires' },
  { calle: 'Carlos Tejedor', localidad: 'Lanús', provincia: 'Buenos Aires' },
  { calle: 'Alsina', localidad: 'Avellaneda', provincia: 'Buenos Aires' },
  { calle: 'Mitre', localidad: 'Avellaneda', provincia: 'Buenos Aires' },
  { calle: 'Pavón', localidad: 'Avellaneda', provincia: 'Buenos Aires' },
  { calle: 'Avenida Belgrano', localidad: 'Florencio Varela', provincia: 'Buenos Aires' },
  { calle: 'San Martín', localidad: 'Berazategui', provincia: 'Buenos Aires' },
  { calle: '14 de Julio', localidad: 'Berazategui', provincia: 'Buenos Aires' },
  { calle: 'Avenida Espora', localidad: 'Lomas de Zamora', provincia: 'Buenos Aires' },
  { calle: 'Avenida Meeks', localidad: 'Lomas de Zamora', provincia: 'Buenos Aires' }
];

// Trabajos comunes en zona sur
const trabajos = [
  'Vendedor/a',
  'Empleado/a de comercio',
  'Administrativo/a',
  'Docente',
  'Enfermero/a',
  'Mecánico/a',
  'Electricista',
  'Plomero/a',
  'Cajero/a',
  'Chofer',
  'Seguridad',
  'Cocinero/a',
  'Peluquero/a',
  'Albañil',
  'Repositor/a',
  'Operario/a',
  'Auxiliar de limpieza',
  'Delivery',
  'Técnico/a',
  'Comerciante'
];

function generateDNI(): string {
  // DNI entre 20.000.000 y 45.000.000
  return (20000000 + Math.floor(Math.random() * 25000000)).toString();
}

function generateCUIT(dni: string): string {
  // CUIT simplificado: 20-DNI-X (donde X es un dígito verificador aleatorio)
  const verificador = Math.floor(Math.random() * 10);
  return `20${dni}${verificador}`;
}

function generatePhone(): string {
  // Teléfonos de zona sur: 11 + 8 dígitos
  const numero = Math.floor(10000000 + Math.random() * 90000000);
  return `11${numero}`;
}

function generateEmail(nombre: string, apellido: string): string {
  const random = Math.floor(Math.random() * 1000);
  return `${nombre.toLowerCase()}.${apellido.toLowerCase()}${random}@gmail.com`;
}

function generateAddress(index: number): string {
  const direccion = callesZonaSur[index % callesZonaSur.length];
  const altura = Math.floor(100 + Math.random() * 9900);
  return `${direccion.calle} ${altura}, ${direccion.localidad}, ${direccion.provincia}`;
}

async function createClient(nombre: string, apellido: string, index: number) {
  const dni = generateDNI();
  const clientData = {
    fullName: `${nombre} ${apellido}`,
    email: generateEmail(nombre, apellido),
    phone: generatePhone(),
    address: generateAddress(index),
    dni: dni,
    cuit: generateCUIT(dni),
    job: trabajos[index % trabajos.length],
    countryCode: 'AR',
    createdBy: USER_ID
  };

  try {
    const response = await fetch(`${API_URL}/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      },
      body: JSON.stringify(clientData)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`❌ Error creating ${clientData.fullName}:`, error);
      return null;
    }

    const result = await response.json();
    console.log(`✅ Cliente creado: ${clientData.fullName} - ${clientData.address}`);
    return result.data;
  } catch (error) {
    console.error(`❌ Error de red creando ${clientData.fullName}:`, error);
    return null;
  }
}

async function seedClients() {
  console.log('🌱 INICIANDO SEED DE CLIENTES');
  console.log('================================\n');
  console.log(`Usuario: ${USER_ID}`);
  console.log(`Clientes a crear: 20`);
  console.log(`Zona: Sur de Buenos Aires\n`);
  console.log('================================\n');

  if (AUTH_TOKEN === 'YOUR_TOKEN_HERE') {
    console.error('❌ ERROR: Debes configurar el AUTH_TOKEN en el script');
    console.error('   1. Loguéate en la app');
    console.error('   2. Abre DevTools → Application → localStorage');
    console.error('   3. Copia el token de "auth-storage"');
    console.error('   4. Reemplaza AUTH_TOKEN en este script');
    return;
  }

  const createdClients = [];

  for (let i = 0; i < 20; i++) {
    const nombre = nombres[i];
    const apellido = apellidos[i];
    
    console.log(`\n[${i + 1}/20] Creando: ${nombre} ${apellido}...`);
    const client = await createClient(nombre, apellido, i);
    
    if (client) {
      createdClients.push(client);
    }
    
    // Pequeña pausa entre requests para no sobrecargar el servidor
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n================================');
  console.log('🎉 SEED COMPLETADO');
  console.log('================================\n');
  console.log(`✅ Clientes creados exitosamente: ${createdClients.length}/20`);
  console.log(`❌ Errores: ${20 - createdClients.length}`);
  console.log('\n================================\n');

  if (createdClients.length > 0) {
    console.log('📋 MUESTRA DE CLIENTES CREADOS:\n');
    createdClients.slice(0, 5).forEach((client, idx) => {
      console.log(`${idx + 1}. ${client.fullName}`);
      console.log(`   📍 ${client.address}`);
      console.log(`   📞 ${client.phone}`);
      console.log(`   💼 ${client.job}\n`);
    });
  }
}

// Ejecutar el seed
seedClients().catch(console.error);

