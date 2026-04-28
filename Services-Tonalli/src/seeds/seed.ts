import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Lesson, LessonType } from '../lessons/entities/lesson.entity';
import { Quiz } from '../lessons/entities/quiz.entity';
import { Progress } from '../progress/entities/progress.entity';
import { NFTCertificate } from '../progress/entities/nft-certificate.entity';
import { Streak } from '../users/entities/streak.entity';
import { Chapter } from '../chapters/entities/chapter.entity';
import { ChapterModule } from '../chapters/entities/chapter-module.entity';
import { ChapterProgress } from '../chapters/entities/chapter-progress.entity';
import { ChapterQuestion } from '../chapters/entities/chapter-question.entity';
import { WeeklyScore } from '../podium/entities/weekly-score.entity';
import { PodiumReward } from '../podium/entities/podium-reward.entity';
import { ActaCertificate } from '../certificates/entities/acta-certificate.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'postgres',
  database: process.env.DB_NAME || 'tonalli',
  entities: [User, Lesson, Quiz, Progress, NFTCertificate, Streak, Chapter, ChapterModule, ChapterProgress, ChapterQuestion, WeeklyScore, PodiumReward, ActaCertificate],
  synchronize: true,
  logging: false,
});

const MODULE_ID = 'mod-intro-blockchain';
const MODULE_NAME = 'Intro a Blockchain';

// ── Question pools ─────────────────────────────────────────────────────────────

const BLOCKCHAIN_QUESTIONS = [
  { id: 'bq1', question: '¿Qué es una blockchain o cadena de bloques?', options: ['Un tipo de red social', 'Un registro distribuido e inmutable de transacciones', 'Un banco digital centralizado', 'Un lenguaje de programación'], correctIndex: 1, explanation: 'Una blockchain es un registro distribuido donde los datos se almacenan en bloques enlazados de forma criptográfica.' },
  { id: 'bq2', question: '¿Cuál es una característica principal de la blockchain?', options: ['Es controlada por un solo banco', 'Puede ser modificada fácilmente por cualquiera', 'Es descentralizada e inmutable', 'Solo funciona con internet de alta velocidad'], correctIndex: 2, explanation: 'La descentralización e inmutabilidad son pilares fundamentales.' },
  { id: 'bq3', question: '¿Qué significa que la blockchain sea "distribuida"?', options: ['Que está en un solo servidor muy grande', 'Que múltiples nodos almacenan copias del registro', 'Que se distribuye dinero automáticamente', 'Que funciona sin conexión a internet'], correctIndex: 1, explanation: 'Distribuida significa que muchos computadores (nodos) guardan copias del mismo registro.' },
  { id: 'bq4', question: '¿Quién inventó Bitcoin, la primera blockchain pública?', options: ['Elon Musk', 'Mark Zuckerberg', 'Satoshi Nakamoto', 'Bill Gates'], correctIndex: 2, explanation: 'Satoshi Nakamoto publicó el whitepaper de Bitcoin en 2008.' },
  { id: 'bq5', question: '¿Qué hace que los bloques estén "encadenados"?', options: ['Un cable físico entre servidores', 'Cada bloque contiene el hash del bloque anterior', 'Un administrador que los enlaza manualmente', 'Un contrato legal entre nodos'], correctIndex: 1, explanation: 'Cada bloque incluye el hash criptográfico del bloque anterior.' },
  { id: 'bq6', question: '¿Qué es un "hash" en el contexto de blockchain?', options: ['Una contraseña de usuario', 'Una función matemática que genera una huella digital única', 'El nombre del dueño de un bloque', 'Un tipo de criptomoneda'], correctIndex: 1, explanation: 'Un hash es el resultado de una función criptográfica que produce una cadena única.' },
  { id: 'bq7', question: '¿Cuál de estas NO es una blockchain conocida?', options: ['Ethereum', 'Stellar', 'Solana', 'MySQL'], correctIndex: 3, explanation: 'MySQL es un sistema de base de datos relacional, no una blockchain.' },
  { id: 'bq8', question: '¿Qué son los "smart contracts"?', options: ['Contratos físicos digitalizados', 'Abogados con computadoras', 'Código que se ejecuta automáticamente en la blockchain', 'Emails con firma electrónica'], correctIndex: 2, explanation: 'Los smart contracts son programas que se ejecutan solos cuando se cumplen condiciones predefinidas.' },
  { id: 'bq9', question: '¿Para qué sirve el "consenso" en blockchain?', options: ['Para que todos los nodos estén de acuerdo sobre el estado del registro', 'Para elegir al presidente de la red', 'Para conectar múltiples blockchains', 'Para calcular el precio de las criptomonedas'], correctIndex: 0, explanation: 'El mecanismo de consenso asegura que todos los nodos acuerden cuál es la versión correcta.' },
  { id: 'bq10', question: '¿Qué es la "descentralización" en blockchain?', options: ['Que no hay ningún servidor', 'Que ninguna entidad única tiene control total', 'Que los datos están en la nube de Amazon', 'Que solo los gobiernos pueden acceder'], correctIndex: 1, explanation: 'Descentralización significa que el poder se distribuye entre muchos participantes.' },
  { id: 'bq11', question: '¿Qué es una "wallet" o billetera crypto?', options: ['Una app para guardar fotos', 'Un software que almacena claves para acceder a activos digitales', 'Una tarjeta de crédito virtual', 'Un banco en línea'], correctIndex: 1, explanation: 'Una wallet guarda tus claves criptográficas privadas.' },
  { id: 'bq12', question: '¿Qué ventaja tiene blockchain vs bases de datos tradicionales?', options: ['Es más rápida para consultas', 'Es más barata de mantener', 'Ofrece transparencia e inmutabilidad sin autoridad central', 'Puede almacenar más datos'], correctIndex: 2, explanation: 'La transparencia y la imposibilidad de alterar datos sin consenso son ventajas únicas.' },
  { id: 'bq13', question: '¿Qué es "Proof of Work" (PoW)?', options: ['Un contrato de trabajo para mineros', 'Un mecanismo de consenso que requiere resolver puzzles matemáticos', 'Una forma de pago por trabajo freelance', 'Un protocolo de seguridad'], correctIndex: 1, explanation: 'PoW es el mecanismo de consenso de Bitcoin.' },
  { id: 'bq14', question: '¿En qué año se lanzó Bitcoin?', options: ['2004', '2009', '2013', '2017'], correctIndex: 1, explanation: 'Bitcoin fue lanzado en enero de 2009.' },
  { id: 'bq15', question: '¿Qué son los "tokens" en blockchain?', options: ['Monedas físicas digitalizadas', 'Activos digitales creados sobre una blockchain existente', 'Contraseñas de un solo uso', 'Servidores de validación'], correctIndex: 1, explanation: 'Los tokens son activos digitales creados usando protocolos de blockchain existentes.' },
];

const STELLAR_QUESTIONS = [
  { id: 'sq1', question: '¿En qué año fue fundada la red Stellar?', options: ['2009', '2012', '2014', '2018'], correctIndex: 2, explanation: 'Stellar fue fundada en 2014 por Jed McCaleb y Joyce Kim.' },
  { id: 'sq2', question: '¿Cuál es la criptomoneda nativa de Stellar?', options: ['ETH', 'BTC', 'XLM', 'SOL'], correctIndex: 2, explanation: 'XLM (Lumen) es la criptomoneda nativa de Stellar.' },
  { id: 'sq3', question: '¿Cuál es el mecanismo de consenso de Stellar?', options: ['Proof of Work', 'Proof of Stake', 'Stellar Consensus Protocol (SCP)', 'Delegated PoS'], correctIndex: 2, explanation: 'Stellar usa el SCP, basado en Federated Byzantine Agreement.' },
  { id: 'sq4', question: '¿Cuánto tarda una transacción en Stellar?', options: ['10 minutos', '1 hora', '3-5 segundos', '1 día'], correctIndex: 2, explanation: 'Stellar confirma transacciones en 3-5 segundos.' },
  { id: 'sq5', question: '¿Cuál es el costo de una transacción en Stellar?', options: ['$10 USD', '$1 USD', '$0.01 USD', 'Fracciones de centavo'], correctIndex: 3, explanation: 'Las comisiones en Stellar son extremadamente bajas.' },
  { id: 'sq6', question: '¿Para qué está diseñada Stellar?', options: ['NFTs de arte', 'Pagos internacionales y remesas de bajo costo', 'Videojuegos blockchain', 'Almacenamiento descentralizado'], correctIndex: 1, explanation: 'Stellar facilita transferencias de valor entre fronteras.' },
  { id: 'sq7', question: '¿Qué es la Stellar Development Foundation?', options: ['Un banco central cripto', 'Organización sin fines de lucro que desarrolla Stellar', 'Un fondo de inversión', 'El gobierno de la blockchain'], correctIndex: 1, explanation: 'La SDF es una organización sin fines de lucro dedicada a Stellar.' },
  { id: 'sq8', question: '¿Qué permite Stellar además de enviar XLM?', options: ['Solo enviar XLM', 'Crear y negociar activos personalizados (tokens)', 'Minería de datos', 'Hosting de sitios web'], correctIndex: 1, explanation: 'Stellar permite crear tokens que representan cualquier activo.' },
  { id: 'sq9', question: '¿Qué es una "anchor" en Stellar?', options: ['Un nodo validador', 'Una entidad que conecta activos reales con la blockchain', 'El elemento más pesado', 'Un tipo de wallet fría'], correctIndex: 1, explanation: 'Las anchors emiten tokens respaldados por activos reales.' },
  { id: 'sq10', question: '¿Qué es Stellar Horizon?', options: ['El nombre del consenso', 'La API para interactuar con Stellar', 'El explorador de transacciones', 'La wallet oficial'], correctIndex: 1, explanation: 'Horizon es la API HTTP de Stellar.' },
  { id: 'sq11', question: '¿Cuántos XLM se necesitan para activar una cuenta?', options: ['0 XLM', '1 XLM', '10 XLM', '100 XLM'], correctIndex: 1, explanation: 'Se necesita un balance mínimo de 1 XLM.' },
  { id: 'sq12', question: '¿Qué es el "Friendbot" de Stellar?', options: ['Un bot de redes sociales', 'Un servicio que fondea cuentas en testnet', 'Asistente de atención al cliente', 'Un validador automático'], correctIndex: 1, explanation: 'Friendbot fondea cuentas en el testnet con 10,000 XLM de prueba.' },
  { id: 'sq13', question: '¿Qué son los "Soroban smart contracts"?', options: ['Contratos del gobierno', 'La plataforma de smart contracts de Stellar', 'Tokens NFT', 'Wallet multi-firma'], correctIndex: 1, explanation: 'Soroban es la plataforma de smart contracts de Stellar, escrita en Rust.' },
  { id: 'sq14', question: '¿Qué empresa usa Stellar para pagos internacionales?', options: ['PayPal', 'MoneyGram', 'Visa', 'Western Union'], correctIndex: 1, explanation: 'MoneyGram se asoció con Stellar para pagos usando USDC.' },
  { id: 'sq15', question: '¿Qué es una "keypair" en Stellar?', options: ['Un par de wallets', 'Un par de llaves: pública y privada', 'Dos transacciones relacionadas', 'Un tipo de token'], correctIndex: 1, explanation: 'Un keypair es la clave pública (dirección) y la clave privada (secreto).' },
];

const WALLET_QUESTIONS = [
  { id: 'wq1', question: '¿Qué es una clave pública en una wallet?', options: ['Tu contraseña secreta', 'Tu dirección para recibir fondos', 'El PIN de tu tarjeta', 'Tu nombre de usuario'], correctIndex: 1, explanation: 'La clave pública es como tu número de cuenta bancaria.' },
  { id: 'wq2', question: '¿Qué NUNCA debes compartir?', options: ['Tu dirección pública', 'Tu nombre de usuario', 'Tu clave privada o frase semilla', 'Tu blockchain favorita'], correctIndex: 2, explanation: 'Tu clave privada es el acceso total a tus fondos.' },
  { id: 'wq3', question: '¿Qué es una "seed phrase"?', options: ['Contraseña del exchange', '12-24 palabras para recuperar tu wallet', 'Código para cripto gratis', 'Nombre de tu primer NFT'], correctIndex: 1, explanation: 'La seed phrase es un respaldo mnemónico de tu clave privada.' },
  { id: 'wq4', question: '¿Qué wallet es más segura para grandes cantidades?', options: ['Wallet en exchange', 'App del celular', 'Hardware wallet (Ledger, Trezor)', 'Extensión de navegador'], correctIndex: 2, explanation: 'Las hardware wallets guardan claves offline.' },
  { id: 'wq5', question: '¿Qué es una wallet "custodial"?', options: ['Tú controlas tus claves', 'Un tercero guarda tus claves', 'Una wallet para guardar custodios', 'Sin contraseña'], correctIndex: 1, explanation: 'En una wallet custodial, el exchange guarda tus claves.' },
  { id: 'wq6', question: '¿Qué hace Tonalli con la wallet de sus usuarios?', options: ['No crea wallets', 'Crea automáticamente una wallet Stellar', 'Pide comprar XLM primero', 'Usa la misma wallet para todos'], correctIndex: 1, explanation: 'Tonalli crea una wallet Stellar automáticamente al registrarte.' },
  { id: 'wq7', question: '¿Cómo se llama la red de pruebas de Stellar?', options: ['Mainnet', 'Devnet', 'Testnet', 'Sandbox'], correctIndex: 2, explanation: 'El Testnet es la red de pruebas de Stellar.' },
  { id: 'wq8', question: '¿Qué recibes al completar una lección en Tonalli?', options: ['Solo puntos', 'XP, XLM y un NFT certificado', 'Dinero en tu banco', 'Un diploma en papel'], correctIndex: 1, explanation: 'Tonalli recompensa con XP, XLM real y un NFT certificado.' },
  { id: 'wq9', question: '¿Qué es un NFT?', options: ['Una criptomoneda como Bitcoin', 'Un token único e irrepetible en blockchain', 'Un contrato inteligente', 'Una wallet multi-firma'], correctIndex: 1, explanation: 'Un NFT es un token único que prueba propiedad digital.' },
  { id: 'wq10', question: '¿Qué datos tiene una transacción en Stellar?', options: ['Solo el monto', 'Origen, destino, monto, comisión y firma digital', 'Email y contraseña', 'Solo la firma del banco'], correctIndex: 1, explanation: 'Una transacción Stellar incluye cuenta origen, destino, monto, fee y firma.' },
  { id: 'wq11', question: '¿Qué es "manage_data" en Stellar?', options: ['App de datos personales', 'Operación que guarda datos en una cuenta', 'Panel de control', 'Forma de eliminar transacciones'], correctIndex: 1, explanation: 'manage_data permite almacenar hasta 64 bytes de datos en una cuenta.' },
  { id: 'wq12', question: '¿Qué significa "GABC..." al inicio de una dirección Stellar?', options: ['Cuenta de gobierno', 'Formato Base32 de claves públicas Stellar', 'Cuenta verificada', 'Cuenta de empresa'], correctIndex: 1, explanation: 'Las claves públicas Stellar comienzan con "G" y están en Base32.' },
  { id: 'wq13', question: '¿Qué es el "Stellar Expert"?', options: ['Un certificado', 'Un explorador de bloques para Stellar', 'Un asesor financiero', 'La wallet oficial'], correctIndex: 1, explanation: 'Stellar Expert es un explorador de bloques.' },
  { id: 'wq14', question: '¿Qué es el "balance mínimo" en Stellar?', options: ['Mínimo para una transacción', 'Reserva de XLM que siempre debe existir', 'Costo de crear wallet', 'Máximo que puedes guardar'], correctIndex: 1, explanation: 'Stellar requiere una reserva base de ~1 XLM.' },
  { id: 'wq15', question: '¿Qué personaje de Tonalli es un xoloescuincle?', options: ['Chima', 'Alli', 'Xollo', 'Stella'], correctIndex: 2, explanation: 'Xollo es el xoloescuincle mascota de Tonalli.' },
];

// ── Seed function ──────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Starting Tonalli seed...');

  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(User);
  const lessonRepo = AppDataSource.getRepository(Lesson);
  const quizRepo = AppDataSource.getRepository(Quiz);
  const chapterRepo = AppDataSource.getRepository(Chapter);
  const chapterModuleRepo = AppDataSource.getRepository(ChapterModule);
  const questionRepo = AppDataSource.getRepository(ChapterQuestion);

  // ── Users ────────────────────────────────────────────────────────────────────
  const adminEmail = 'admin@tonalli.mx';
  const userEmail = 'demo@tonalli.mx';

  const existingAdmin = await userRepo.findOne({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await userRepo.save(userRepo.create({
      email: adminEmail, username: 'TonalliAdmin', displayName: 'Administrador',
      password: await bcrypt.hash('Admin2024!', 10), city: 'Ciudad de México',
      role: 'admin', xp: 0, totalXp: 0, currentStreak: 0, plan: 'max',
    }));
    console.log('✅ Admin user created: admin@tonalli.mx / Admin2024!');
  }

  const existingUser = await userRepo.findOne({ where: { email: userEmail } });
  if (!existingUser) {
    await userRepo.save(userRepo.create({
      email: userEmail, username: 'CryptoAzteca', displayName: 'Crypto Azteca',
      password: await bcrypt.hash('Demo2024!', 10), city: 'Guadalajara',
      role: 'user', xp: 0, totalXp: 0, currentStreak: 0, plan: 'free',
      dateOfBirth: '2000-05-15',
    }));
    console.log('✅ Demo user created: demo@tonalli.mx / Demo2024!');
  }

  // Create Pro demo user
  const proEmail = 'pro@tonalli.mx';
  const existingPro = await userRepo.findOne({ where: { email: proEmail } });
  if (!existingPro) {
    await userRepo.save(userRepo.create({
      email: proEmail, username: 'ProUser', displayName: 'Usuario Pro',
      password: await bcrypt.hash('Pro2024!', 10), city: 'Monterrey',
      role: 'user', xp: 200, totalXp: 200, currentStreak: 3, plan: 'pro',
      dateOfBirth: '1998-07-10',
    }));
    console.log('✅ Pro user created: pro@tonalli.mx / Pro2024!');
  }

  // Create Max demo user
  const maxEmail = 'max@tonalli.mx';
  const existingMax = await userRepo.findOne({ where: { email: maxEmail } });
  if (!existingMax) {
    await userRepo.save(userRepo.create({
      email: maxEmail, username: 'MaxUser', displayName: 'Usuario Max',
      password: await bcrypt.hash('Max2024!', 10), city: 'Guadalajara',
      role: 'user', xp: 500, totalXp: 500, currentStreak: 5, plan: 'max',
      dateOfBirth: '1995-03-20',
    }));
    console.log('✅ Max user created: max@tonalli.mx / Max2024!');
  }

  // ── Chapters: each has 4 modules ──────────────────────────────────────────
  // Modules 1-3: each has info + video + quiz (5 questions)
  // Module 4: final exam (10 questions from ALL 3 modules combined)

  // Split questions into 3 groups of 5 per module
  const bq1 = BLOCKCHAIN_QUESTIONS.slice(0, 10);
  const bq2 = BLOCKCHAIN_QUESTIONS.slice(3, 13);
  const bq3 = BLOCKCHAIN_QUESTIONS.slice(5, 15);

  const sq1 = STELLAR_QUESTIONS.slice(0, 10);
  const sq2 = STELLAR_QUESTIONS.slice(3, 13);
  const sq3 = STELLAR_QUESTIONS.slice(5, 15);

  const wq1 = WALLET_QUESTIONS.slice(0, 10);
  const wq2 = WALLET_QUESTIONS.slice(3, 13);
  const wq3 = WALLET_QUESTIONS.slice(5, 15);

  // ── CHAPTER 1: Blockchain ──────────────────────────────────────────────
  {
    let ch1 = await chapterRepo.findOne({ where: { title: 'Introducción al Blockchain' } });
    if (!ch1) ch1 = await chapterRepo.save(chapterRepo.create({
      title: 'Introducción al Blockchain',
      description: 'Aprende los conceptos fundamentales de la tecnología blockchain.',
      moduleTag: 'blockchain', order: 1, published: true, estimatedMinutes: 20, xpReward: 140,
      releaseWeek: '2026-W12',
    }));
    const ch1Mods = await chapterModuleRepo.count({ where: { chapterId: ch1.id } });
    if (ch1Mods === 0) {

    // Module 1: ¿Qué es Blockchain?
    const ch1Mod1 = await chapterModuleRepo.save(chapterModuleRepo.create({
      chapterId: ch1.id, type: 'lesson', order: 1, title: '¿Qué es Blockchain?',
      xpReward: 30, passingScore: 80, questionsPerAttempt: 5,
      content: `¿Qué es una Blockchain?

Una blockchain (cadena de bloques) es una base de datos distribuida que registra transacciones de forma permanente y transparente. A diferencia de una base de datos tradicional controlada por una sola empresa (como un banco), la blockchain es mantenida simultáneamente por miles de computadoras alrededor del mundo llamadas "nodos".

Imagina un libro de contabilidad público donde todos pueden escribir, pero nadie puede borrar ni modificar lo que ya se escribió. Cada página nueva hace referencia a la anterior, creando una cadena imposible de romper.

Fuente: ethereum.org/es/learn

¿Cómo funciona?

Los datos se organizan en "bloques". Cada bloque contiene:
• Un conjunto de transacciones verificadas
• Una marca de tiempo (timestamp) exacta
• Un hash criptográfico del bloque anterior
• Un hash propio (su "huella digital" única)

Un hash es como una huella digital matemática: cualquier cambio en los datos produce un hash completamente diferente. Si alguien modifica un bloque antiguo, su hash cambia, rompiendo la cadena y alertando a toda la red.

Este diseño hace que la blockchain sea prácticamente imposible de hackear: tendrías que modificar TODOS los bloques en MÁS del 50% de los nodos simultáneamente.

Las 4 características fundamentales

1. DESCENTRALIZADA: No hay un servidor central. Miles de nodos mantienen copias idénticas del registro.
2. INMUTABLE: Una vez registrada, una transacción no se puede modificar ni eliminar. Es permanente.
3. TRANSPARENTE: Cualquier persona puede verificar cualquier transacción usando un explorador de bloques.
4. SEGURA: La criptografía y los mecanismos de consenso protegen la red contra fraudes y ataques.

¿Por qué importa en tu vida?

Blockchain no es solo Bitcoin. Esta tecnología permite:
• Enviar dinero a tu familia en otro país en segundos y por centavos
• Tener certificados académicos que nadie puede falsificar
• Ser dueño real de tus activos digitales sin intermediarios
• Votar de forma transparente e incorruptible
• Acceder a servicios financieros sin cuenta bancaria

En Latinoamérica, donde 45% de la población no tiene cuenta bancaria (Banco Mundial), blockchain es una herramienta de inclusión financiera real.

Términos clave:
• Blockchain: Base de datos distribuida e inmutable organizada en bloques enlazados criptográficamente
• Bloque: Unidad de datos que contiene transacciones, un timestamp y el hash del bloque anterior
• Hash: Función matemática que genera una huella digital única e irreversible de cualquier dato
• Nodo: Computador que mantiene una copia completa de la blockchain y valida transacciones
• Descentralización: Distribución del control entre muchos participantes sin autoridad central`,
      videoUrl: 'https://youtu.be/VXsmLe8wegU',
    }));
    {
      const existingQs = await questionRepo.count({ where: { moduleId: ch1Mod1.id } });
      if (existingQs < 8) {
        await questionRepo.delete({ moduleId: ch1Mod1.id });
        for (const [idx, q] of bq1.entries()) {
          await questionRepo.save(questionRepo.create({ moduleId: ch1Mod1.id, question: q.question, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation, order: idx }));
        }
      }
    }

    // Module 2: Conceptos avanzados
    const ch1Mod2 = await chapterModuleRepo.save(chapterModuleRepo.create({
      chapterId: ch1.id, type: 'lesson', order: 2, title: 'Conceptos avanzados de Blockchain',
      xpReward: 30, passingScore: 80, questionsPerAttempt: 5,
      content: `Smart Contracts (Contratos Inteligentes)

Un smart contract es un programa almacenado en la blockchain que se ejecuta automáticamente cuando se cumplen condiciones predefinidas. Funciona como una máquina expendedora digital: metes dinero, seleccionas lo que quieres, y la máquina entrega el producto sin necesidad de un empleado.

Ejemplo real: Un seguro de vuelo basado en smart contract puede pagarte automáticamente si tu vuelo se retrasa más de 2 horas, sin que tengas que hacer ningún reclamo.

Ethereum popularizó los smart contracts en 2015. Stellar los incorporó con su plataforma Soroban (escrita en Rust) en 2024. Tonalli usa smart contracts para emitir tus certificados NFT automáticamente.

Fuente: developers.stellar.org

Mecanismos de consenso

¿Cómo se ponen de acuerdo miles de nodos sobre qué transacciones son válidas? Usando mecanismos de consenso:

PROOF OF WORK (PoW) — Bitcoin
Mineros compiten resolviendo puzzles matemáticos complejos. El primero en resolverlo gana el derecho de agregar el siguiente bloque. Consume mucha energía.

PROOF OF STAKE (PoS) — Ethereum (desde 2022)
Validadores "apuestan" sus monedas como garantía. Si validan mal, pierden su apuesta. Consume 99.95% menos energía que PoW.

STELLAR CONSENSUS PROTOCOL (SCP) — Stellar
Nodos votan entre sí para llegar a acuerdo en segundos. No requiere minería ni apuestas. Es el más eficiente y ecológico.

Fuente: stellar.org/learn

Tokens vs Criptomonedas

No son lo mismo:

CRIPTOMONEDAS: Son nativas de su blockchain.
• BTC es nativo de Bitcoin
• ETH es nativo de Ethereum
• XLM es nativo de Stellar

TOKENS: Se crean sobre blockchains existentes.
• USDC (dólar digital) corre sobre Ethereum y Stellar
• Los NFTs son tokens únicos que representan propiedad digital
• Los tokens ERC-20 de Ethereum, los activos Stellar

Tonalli te recompensa con XLM (criptomoneda nativa) y emite NFTs (tokens) como certificados de tus logros.

Términos clave:
• Smart Contract: Programa auto-ejecutable en blockchain que se activa al cumplir condiciones
• Proof of Work: Mecanismo de consenso con puzzles matemáticos (Bitcoin)
• Proof of Stake: Mecanismo de consenso con apuestas de monedas (Ethereum)
• Token: Activo digital creado sobre una blockchain existente
• Soroban: Plataforma de smart contracts de Stellar, escrita en Rust`,
      videoUrl: '',
    }));
    {
      const existingQs = await questionRepo.count({ where: { moduleId: ch1Mod2.id } });
      if (existingQs < 8) {
        await questionRepo.delete({ moduleId: ch1Mod2.id });
        for (const [idx, q] of bq2.entries()) {
          await questionRepo.save(questionRepo.create({ moduleId: ch1Mod2.id, question: q.question, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation, order: idx }));
        }
      }
    }

    // Module 3: Blockchain en el mundo real
    const ch1Mod3 = await chapterModuleRepo.save(chapterModuleRepo.create({
      chapterId: ch1.id, type: 'lesson', order: 3, title: 'Blockchain en el mundo real',
      xpReward: 30, passingScore: 80, questionsPerAttempt: 5,
      content: `Blockchain en Latinoamérica

América Latina lidera la adopción crypto en el mundo en desarrollo:

• MÉXICO: Bitso (exchange más grande de LATAM) procesa más de $1 billón USD en remesas. La Ley Fintech de 2018 regula activos virtuales. Stellar tiene alianzas activas en el país.

• ARGENTINA: Con inflación superior al 100% anual, millones usan stablecoins (USDC, DAI) para proteger sus ahorros. Mercado Libre acepta crypto.

• EL SALVADOR: Primer país en adoptar Bitcoin como moneda legal en 2021.

• BRASIL: Banco Central desarrolla el Real Digital (DREX) sobre tecnología blockchain.

Según Chainalysis, LATAM representa el 7.3% de las transacciones crypto globales, con crecimiento anual del 40%.

Wallets y activos digitales

Una wallet (billetera digital) es el software que te permite interactuar con la blockchain:

CLAVE PÚBLICA (tu dirección): Como tu número de cuenta bancaria. La compartes para recibir pagos. En Stellar empieza con "G...".

CLAVE PRIVADA (tu secreto): Como la contraseña de tu banco, pero MÁS importante. Si alguien la tiene, controla todos tus fondos. NUNCA la compartas. En Stellar empieza con "S...".

SEED PHRASE (frase semilla): 12-24 palabras que son el respaldo maestro de tu wallet. Guárdala en papel, NUNCA en tu celular o computadora.

Regla de oro: "Not your keys, not your coins" — si no controlas tus claves, no controlas tu dinero.

El futuro: Web3 y más allá

Web3 es la evolución del internet:

WEB1 (1990s): Solo leer. Páginas estáticas.
WEB2 (2000s): Leer y escribir. Redes sociales, pero las empresas son dueñas de tus datos.
WEB3 (ahora): Leer, escribir y POSEER. Tú eres dueño de tus datos, identidad y activos digitales.

Aplicaciones de Web3:
• DeFi (Finanzas Descentralizadas): Préstamos, ahorros y seguros sin bancos
• NFTs: Propiedad verificable de arte, música, certificados y más
• DAOs: Organizaciones gobernadas por votación en blockchain
• Identidad descentralizada: Control total sobre tu identidad digital

Tonalli te prepara para este futuro certificando tus conocimientos con NFTs reales en Stellar.

Términos clave:
• Wallet: Software que almacena claves criptográficas para interactuar con la blockchain
• NFT: Non-Fungible Token — token único e irrepetible que prueba propiedad digital
• DeFi: Finanzas Descentralizadas — servicios financieros sin intermediarios, usando smart contracts
• Stablecoin: Criptomoneda con valor estable, generalmente vinculada al dólar (ej. USDC, USDT)
• Web3: La evolución del internet donde los usuarios poseen sus datos y activos digitales`,
      videoUrl: '',
    }));
    {
      const existingQs = await questionRepo.count({ where: { moduleId: ch1Mod3.id } });
      if (existingQs < 8) {
        await questionRepo.delete({ moduleId: ch1Mod3.id });
        for (const [idx, q] of bq3.entries()) {
          await questionRepo.save(questionRepo.create({ moduleId: ch1Mod3.id, question: q.question, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation, order: idx }));
        }
      }
    }

    // Module 4: Examen final (mezcla preguntas de los 3 módulos)
    await chapterModuleRepo.save(chapterModuleRepo.create({
      chapterId: ch1.id, type: 'final_exam', order: 4, title: 'Examen Final: Blockchain',
      xpReward: 50, passingScore: 80, questionsPerAttempt: 10,
    }));

    console.log('✅ Cap 1: Intro Blockchain (3 módulos x [info+video+quiz] + examen final)');
    } else { console.log('✅ Cap 1 ya tiene módulos. Skipping.'); }
  }

  // ── CHAPTER 2: Stellar ─────────────────────────────────────────────────
  {
    let ch2 = await chapterRepo.findOne({ where: { title: 'Stellar Network' } });
    if (!ch2) ch2 = await chapterRepo.save(chapterRepo.create({
      title: 'Stellar Network',
      description: 'Descubre por qué Stellar es la blockchain perfecta para pagos en Latinoamérica.',
      moduleTag: 'stellar', order: 2, published: true, estimatedMinutes: 20, xpReward: 140,
      releaseWeek: '2026-W13',
    }));
    const ch2Mods = await chapterModuleRepo.count({ where: { chapterId: ch2.id } });
    if (ch2Mods === 0) {

    const ch2Mod1 = await chapterModuleRepo.save(chapterModuleRepo.create({
      chapterId: ch2.id, type: 'lesson', order: 1, title: '¿Qué es Stellar?',
      xpReward: 30, passingScore: 80, questionsPerAttempt: 5,
      content: `¿Qué es Stellar?

Stellar es una red blockchain de código abierto fundada en 2014 por Jed McCaleb (cofundador de Ripple) y Joyce Kim. Su misión es facilitar pagos internacionales rápidos, baratos y accesibles para todos.

Su criptomoneda nativa se llama XLM (Lumen). Un Lumen es la unidad básica de la red y se usa para pagar comisiones de transacción y prevenir spam en la red.

A diferencia de Bitcoin (diseñado como "oro digital") o Ethereum (diseñado para smart contracts), Stellar fue diseñada específicamente para PAGOS y REMESAS entre fronteras.

Fuente: stellar.org/learn — documentación oficial de la Stellar Development Foundation.

Velocidad, costo y eficiencia

Comparativa de transacciones:

• BITCOIN: 10-60 minutos, comisión $1-50 USD
• ETHEREUM: 15 segundos-5 minutos, comisión $0.50-50 USD
• STELLAR: 3-5 SEGUNDOS, comisión $0.0000001 USD
• TRANSFERENCIA BANCARIA INTERNACIONAL: 3-5 DÍAS, comisión $25-50 USD

Stellar puede procesar hasta 1,000 transacciones por segundo. Con Soroban (smart contracts), esta capacidad se expande aún más.

Para enviar $200 USD a tu familia en otro país, un banco cobra ~$25 de comisión. Con Stellar, cuesta menos de un centavo y llega en 5 segundos.

Stellar Consensus Protocol (SCP)

Stellar NO usa minería (a diferencia de Bitcoin). Usa el SCP, un protocolo inventado por el Dr. David Mazières de Stanford.

¿Cómo funciona?
1. Cada nodo tiene una lista de nodos en los que confía (quorum slice)
2. Los nodos votan sobre qué transacciones son válidas
3. Cuando suficientes nodos están de acuerdo, se alcanza consenso
4. El bloque se confirma en 3-5 segundos

Ventajas del SCP:
• No consume energía como PoW (ecológico)
• No requiere apostar monedas como PoS
• Resistente a fallas parciales de la red
• Nodos nuevos se pueden unir libremente

Fuente: developers.stellar.org/docs/learn/fundamentals/stellar-consensus-protocol

Términos clave:
• XLM (Lumen): Criptomoneda nativa de Stellar, usada para comisiones y operaciones en la red
• SCP: Stellar Consensus Protocol — mecanismo de votación entre nodos sin minería
• Quorum Slice: Conjunto de nodos en los que un nodo confía para alcanzar consenso`,
      videoUrl: '',
    }));
    {
      const existingQs = await questionRepo.count({ where: { moduleId: ch2Mod1.id } });
      if (existingQs < 8) {
        await questionRepo.delete({ moduleId: ch2Mod1.id });
        for (const [idx, q] of sq1.entries()) {
          await questionRepo.save(questionRepo.create({ moduleId: ch2Mod1.id, question: q.question, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation, order: idx }));
        }
      }
    }

    const ch2Mod2 = await chapterModuleRepo.save(chapterModuleRepo.create({
      chapterId: ch2.id, type: 'lesson', order: 2, title: 'El ecosistema Stellar',
      xpReward: 30, passingScore: 80, questionsPerAttempt: 5,
      content: `Anchors: el puente con el mundo real

Un anchor (ancla) es una entidad de confianza que conecta activos del mundo real con la red Stellar.

Ejemplo: Si un banco en México emite "pesos digitales" en Stellar, ese banco es un anchor. Los pesos digitales están respaldados 1:1 por pesos reales en el banco.

Anchors populares:
• Circle — emite USDC (dólar digital) en Stellar
• Anclap — emite ARS (peso argentino digital) en Stellar
• ClickPesa — servicios financieros en África sobre Stellar

Esto permite que envíes dólares digitales desde EE.UU. y tu familia en México reciba pesos mexicanos reales, todo en segundos y por centavos.

Fuente: stellar.org/learn/anchor-basics

Horizon API y herramientas para desarrolladores

Horizon es la API HTTP de Stellar — la puerta de entrada para que las aplicaciones interactúen con la red.

URL de testnet: https://horizon-testnet.stellar.org
URL de mainnet: https://horizon.stellar.org

Con Horizon puedes:
• Consultar saldos de cualquier cuenta
• Enviar pagos y crear transacciones
• Buscar historial de operaciones
• Monitorear la red en tiempo real

SDKs disponibles: JavaScript, Python, Go, Java, .NET

Tonalli usa Horizon para crear tu wallet, fondearte con XLM y emitir tus certificados NFT. Toda la tecnología detrás de tus recompensas funciona a través de esta API.

Fuente: developers.stellar.org/docs/data/horizon

Stellar Development Foundation (SDF)

La SDF es la organización sin fines de lucro que desarrolla y promueve Stellar. Fue fundada en 2014 con la misión de crear acceso financiero equitativo.

La SDF:
• Desarrolla el software core de Stellar (stellar-core, Horizon, Soroban)
• Otorga grants a proyectos que construyen sobre Stellar
• Organiza eventos como Meridian (conferencia anual)
• Mantiene el Friendbot para testnet
• Promueve la adopción en mercados emergentes

Datos clave:
• +8 millones de cuentas activas en Stellar
• +2 mil millones de operaciones procesadas
• Presente en más de 30 países

Tonalli participa en el ecosistema Stellar a través del Hackathon Código Alebrije de la SDF.

Términos clave:
• Anchor: Entidad que emite activos respaldados por valor real en la red Stellar
• Horizon: API HTTP de Stellar para interactuar con la red desde aplicaciones
• SDF: Stellar Development Foundation — organización sin fines de lucro detrás de Stellar
• USDC: USD Coin — stablecoin del dólar emitido por Circle, disponible en Stellar`,
      videoUrl: '',
    }));
    {
      const existingQs = await questionRepo.count({ where: { moduleId: ch2Mod2.id } });
      if (existingQs < 8) {
        await questionRepo.delete({ moduleId: ch2Mod2.id });
        for (const [idx, q] of sq2.entries()) {
          await questionRepo.save(questionRepo.create({ moduleId: ch2Mod2.id, question: q.question, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation, order: idx }));
        }
      }
    }

    const ch2Mod3 = await chapterModuleRepo.save(chapterModuleRepo.create({
      chapterId: ch2.id, type: 'lesson', order: 3, title: 'Soroban, Keypairs y el futuro',
      xpReward: 30, passingScore: 80, questionsPerAttempt: 5,
      content: `Soroban: Smart Contracts en Stellar

Soroban es la plataforma de smart contracts de Stellar, lanzada oficialmente en 2024. Está escrita en Rust, uno de los lenguajes más seguros.

¿Por qué Soroban es especial?
• Costos predecibles: sabes cuánto costará tu transacción ANTES de ejecutarla
• Modelo de almacenamiento eficiente: los datos tienen "fecha de expiración"
• Seguridad de Rust: previene errores comunes como buffer overflows
• Compatible con el ecosistema Stellar existente

Casos de uso de Soroban:
• DeFi: préstamos, exchanges descentralizados
• NFTs: certificados, arte digital, coleccionables
• DAOs: gobernanza descentralizada
• Identidad: verificación sin intermediarios

Tonalli usa Soroban para crear los certificados NFT que recibes al completar capítulos.

Fuente: soroban.stellar.org

Keypairs, cuentas y Friendbot

Para usar Stellar necesitas un KEYPAIR (par de claves):

CLAVE PÚBLICA (empieza con G): Tu dirección en Stellar. Es como tu correo electrónico — la compartes para que te envíen XLM.
Ejemplo: GCDWF5QNGDW5MQ5OBNWPC3LB5ODVYL73...

CLAVE PRIVADA (empieza con S): Tu contraseña maestra. NUNCA la compartas. Quien la tenga controla tus fondos.
Ejemplo: SCZANGBA5YHTNYVVV2C3CQKQX...

Para activar una cuenta Stellar necesitas un BALANCE MÍNIMO de 1 XLM (la "reserva base"). Cada sub-entrada (trustlines, ofertas, datos) requiere 0.5 XLM adicional.

FRIENDBOT: En testnet, puedes fondear cualquier cuenta gratis con https://friendbot.stellar.org?addr=TU_CLAVE_PUBLICA. Tonalli usa Friendbot para fondear tu wallet automáticamente al registrarte.

Empresas que usan Stellar

Stellar no es solo teoría. Empresas reales mueven millones de dólares sobre la red:

• MONEYGRAM: Alianza con Stellar para remesas internacionales usando USDC. Presente en 200 países.
• CIRCLE: Emite USDC (dólar digital) en Stellar. +$25 mil millones en circulación.
• BITSO: Exchange mexicano que usa Stellar para pagos transfronterizos.
• FLUTTERWAVE: Pagos en África sobre Stellar.
• FRANKLIN TEMPLETON: Fondo de inversión de $1.4 trillones que tokenizó un fondo del mercado monetario en Stellar.

Stellar Expert (stellar.expert) es el explorador de bloques donde puedes verificar cualquier transacción en la red.

Fuente: stellar.org/case-studies

Términos clave:
• Soroban: Plataforma de smart contracts de Stellar, escrita en Rust
• Keypair: Par de clave pública (dirección) y clave privada (secreto) en Stellar
• Friendbot: Servicio gratuito que fondea cuentas en el testnet de Stellar con 10,000 XLM de prueba
• Reserva base: Balance mínimo de 1 XLM necesario para mantener activa una cuenta Stellar`,
      videoUrl: '',
    }));
    {
      const existingQs = await questionRepo.count({ where: { moduleId: ch2Mod3.id } });
      if (existingQs < 8) {
        await questionRepo.delete({ moduleId: ch2Mod3.id });
        for (const [idx, q] of sq3.entries()) {
          await questionRepo.save(questionRepo.create({ moduleId: ch2Mod3.id, question: q.question, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation, order: idx }));
        }
      }
    }

    await chapterModuleRepo.save(chapterModuleRepo.create({
      chapterId: ch2.id, type: 'final_exam', order: 4, title: 'Examen Final: Stellar',
      xpReward: 50, passingScore: 80, questionsPerAttempt: 10,
    }));

    console.log('✅ Cap 2: Stellar Network (3 módulos x [info+video+quiz] + examen final)');
    } else { console.log('✅ Cap 2 ya tiene módulos. Skipping.'); }
  }

  // ── CHAPTER 3: Wallets ─────────────────────────────────────────────────
  {
    let ch3 = await chapterRepo.findOne({ where: { title: 'Wallets y Seguridad' } });
    if (!ch3) ch3 = await chapterRepo.save(chapterRepo.create({
      title: 'Wallets y Seguridad',
      description: 'Aprende cómo funciona tu wallet Stellar y cómo proteger tus activos digitales.',
      moduleTag: 'wallets', order: 3, published: true, estimatedMinutes: 18, xpReward: 140,
      releaseWeek: '2026-W14',
    }));
    const ch3Mods = await chapterModuleRepo.count({ where: { chapterId: ch3.id } });
    if (ch3Mods === 0) {

    const ch3Mod1 = await chapterModuleRepo.save(chapterModuleRepo.create({
      chapterId: ch3.id, type: 'lesson', order: 1, title: 'Tu primera wallet',
      xpReward: 30, passingScore: 80, questionsPerAttempt: 5,
      content: `Tu wallet ya existe

Cuando te registraste en Tonalli, creamos automáticamente una wallet Stellar para ti. No necesitaste descargar nada extra ni saber de criptomonedas.

¿Qué pasó cuando te registraste?
1. Generamos un KEYPAIR (par de claves) único para ti
2. Fondeamos tu cuenta con XLM de testnet usando Friendbot
3. Tu wallet quedó lista para recibir recompensas y certificados NFT

Puedes ver tu dirección de wallet en tu perfil de Tonalli. Cada vez que completes un capítulo, recibirás XLM directamente en esta wallet.

En el futuro, cuando Tonalli migre a mainnet, tus recompensas serán XLM con valor real que podrás intercambiar o enviar a otros.

Clave pública vs clave privada

Tu wallet tiene dos partes esenciales:

CLAVE PUBLICA (empieza con G...):
• Es tu "dirección" en la blockchain
• La puedes compartir libremente
• Cualquiera puede usarla para ENVIARTE fondos
• Es como el número de tu cuenta bancaria

CLAVE PRIVADA (empieza con S...):
• Es tu "contraseña maestra"
• NUNCA JAMAS la compartas con nadie
• Quien la tenga controla TODOS tus fondos
• Es como la contraseña de tu banca en línea + tu token + tu huella dactilar, TODO JUNTO

Regla de oro en crypto: "Not your keys, not your coins" — Si no controlas tu clave privada, no eres realmente dueño de tu dinero.

Seed phrase (frase semilla)

La seed phrase (frase semilla) es un respaldo maestro de tu wallet compuesto por 12 o 24 palabras en inglés, generadas aleatoriamente.

Ejemplo: "apple banana cherry dog elephant fish guitar house ice jam kite lemon"

Si pierdes acceso a tu dispositivo, puedes recuperar tu wallet COMPLETA usando estas palabras.

REGLAS PARA TU SEED PHRASE:
• Escríbela en PAPEL, nunca en tu celular o computadora
• Guárdala en un lugar seguro (caja fuerte, etc.)
• Nunca la fotografíes ni la envíes por WhatsApp
• Nadie legítimo te la pedirá jamás
• Si alguien te la pide, es una ESTAFA

Tonalli guarda tu clave privada de forma segura, pero en wallets personales, la seed phrase es tu responsabilidad total.

Fuente: bitcoin.org/es — documentación oficial sobre seguridad de wallets.

Términos clave:
• Clave pública: Tu dirección en la blockchain. Se comparte para recibir fondos. Empieza con G en Stellar.
• Clave privada: Tu secreto para autorizar transacciones. NUNCA se comparte. Empieza con S en Stellar.
• Seed phrase: 12-24 palabras que son el respaldo maestro de tu wallet. Permite recuperar acceso total.
• Keypair: Par de clave pública y privada que forma tu identidad en la blockchain`,
      videoUrl: '',
    }));
    {
      const existingQs = await questionRepo.count({ where: { moduleId: ch3Mod1.id } });
      if (existingQs < 8) {
        await questionRepo.delete({ moduleId: ch3Mod1.id });
        for (const [idx, q] of wq1.entries()) {
          await questionRepo.save(questionRepo.create({ moduleId: ch3Mod1.id, question: q.question, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation, order: idx }));
        }
      }
    }

    const ch3Mod2 = await chapterModuleRepo.save(chapterModuleRepo.create({
      chapterId: ch3.id, type: 'lesson', order: 2, title: 'Tipos de wallets',
      xpReward: 30, passingScore: 80, questionsPerAttempt: 5,
      content: `Wallets Custodial vs Non-Custodial

CUSTODIAL (Un tercero guarda tus claves):
• Ejemplos: Binance, Bitso, Coinbase
• Ventaja: Si pierdes tu contraseña, puedes recuperarla
• Desventaja: El exchange puede congelarte la cuenta, ser hackeado, o cerrar
• Es como tener tu dinero en un banco: ellos lo "cuidan"

NON-CUSTODIAL (Tú controlas tus claves):
• Ejemplos: MetaMask, Freighter (Stellar), Ledger
• Ventaja: Control total, nadie puede censurarte ni congelarte
• Desventaja: Si pierdes tu seed phrase, pierdes todo PARA SIEMPRE
• Es como guardar efectivo en tu casa: tú eres responsable

¿Cuál elegir?
• Para empezar y aprender: custodial (exchange)
• Para guardar grandes cantidades: non-custodial
• Nunca pongas TODO en un solo lugar

Fuente: academy.binance.com/es — Binance Academy en español.

Hot Wallets vs Cold Wallets

HOT WALLETS (conectadas a internet):
• Apps móviles: Freighter, Trust Wallet, MetaMask
• Extensiones de navegador: Freighter (Stellar), MetaMask (Ethereum)
• Ventaja: Cómodas para uso diario
• Riesgo: Vulnerables a malware, phishing, hackeos

COLD WALLETS (desconectadas de internet):
• Hardware wallets: Ledger Nano, Trezor ($50-150 USD)
• Paper wallets: claves impresas en papel
• Ventaja: Máxima seguridad contra ataques digitales
• Riesgo: Si pierdes el dispositivo sin backup, pierdes todo

RECOMENDACION:
• Guarda en hot wallet solo lo que usarías en tu "bolsillo" (gastos diarios)
• Guarda en cold wallet tus ahorros importantes
• Siempre ten respaldo de tu seed phrase

Freighter: la wallet de Stellar

Freighter es la wallet oficial recomendada para Stellar. Es una extensión de navegador (Chrome, Firefox, Brave).

Características:
• Maneja XLM y cualquier token de Stellar
• Firma transacciones y smart contracts (Soroban)
• Conecta con dApps del ecosistema Stellar
• Gratuita y de código abierto

En Tonalli, tu wallet se gestiona internamente, pero si quieres explorar el ecosistema Stellar por tu cuenta, Freighter es el primer paso.

Para instalarla: busca "Freighter Wallet" en la tienda de extensiones de tu navegador.

Fuente: freighter.app — sitio oficial de Freighter wallet.

Términos clave:
• Custodial wallet: Wallet donde un tercero (exchange) guarda tus claves privadas
• Non-custodial wallet: Wallet donde TU controlas tus claves privadas directamente
• Hot wallet: Wallet conectada a internet. Cómoda pero vulnerable a ataques.
• Cold wallet: Wallet offline (hardware). Máxima seguridad para grandes cantidades.
• Freighter: Wallet oficial de Stellar como extensión de navegador`,
      videoUrl: '',
    }));
    {
      const existingQs = await questionRepo.count({ where: { moduleId: ch3Mod2.id } });
      if (existingQs < 8) {
        await questionRepo.delete({ moduleId: ch3Mod2.id });
        for (const [idx, q] of wq2.entries()) {
          await questionRepo.save(questionRepo.create({ moduleId: ch3Mod2.id, question: q.question, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation, order: idx }));
        }
      }
    }

    const ch3Mod3 = await chapterModuleRepo.save(chapterModuleRepo.create({
      chapterId: ch3.id, type: 'lesson', order: 3, title: 'Seguridad y transacciones',
      xpReward: 30, passingScore: 80, questionsPerAttempt: 5,
      content: `Anatomía de una transacción Stellar

Cada transacción en Stellar contiene:

• CUENTA ORIGEN: Quién envía (tu clave pública)
• OPERACIONES: Qué quieres hacer (pagar, crear oferta, guardar datos)
• COMISION (FEE): ~0.00001 XLM (fracciones de centavo)
• NUMERO DE SECUENCIA: Previene transacciones duplicadas
• FIRMA DIGITAL: Tu clave privada autoriza la operación
• MEMO (opcional): Un mensaje adjunto

Tipos de operaciones comunes:
• payment: Enviar XLM o tokens a otra cuenta
• manage_data: Guardar datos en la cuenta (usado para NFTs/certificados)
• create_account: Crear una cuenta nueva
• change_trust: Aceptar un nuevo tipo de token

Puedes ver cualquier transacción en stellar.expert (explorador de bloques de Stellar).

NFTs y certificados en Stellar

Un NFT (Non-Fungible Token) es un token UNICO en la blockchain que prueba que algo te pertenece o que lograste algo.

En Tonalli, cuando completas un capítulo al 100%:
1. Se ejecuta una transacción en Stellar
2. Se usa la operación manage_data para guardar los datos del certificado
3. Los datos incluyen: tu ID, el capítulo, tu calificación y la fecha
4. La transacción queda registrada PERMANENTEMENTE en la blockchain
5. Cualquiera puede verificar tu certificado con el hash de transacción

Este certificado es:
• INMUTABLE: Nadie puede modificarlo ni eliminarlo
• VERIFICABLE: Cualquier persona o empresa puede confirmar su autenticidad
• TUYO: Está en tu wallet, no depende de que Tonalli exista

Además, con la alianza con ACTA, tus certificados cumplen el estándar W3C Verifiable Credentials 2.0, aceptado internacionalmente.

Fuente: docs.acta.build — documentación oficial de ACTA.

10 reglas de seguridad en crypto

1. NUNCA compartas tu clave privada o seed phrase con nadie
2. NUNCA hagas clic en links de "airdrops gratis" o "duplica tu crypto"
3. SIEMPRE verifica la dirección de destino antes de enviar fondos
4. USA autenticación de 2 factores (2FA) en todos tus exchanges
5. NO guardes grandes cantidades en hot wallets o exchanges
6. DESCONFIA de cualquiera que te pida tu seed phrase (es SIEMPRE estafa)
7. USA contraseñas únicas para cada servicio crypto
8. VERIFICA las URLs antes de conectar tu wallet (phishing)
9. ACTUALIZA siempre el software de tu wallet
10. EMPIEZA con cantidades pequeñas hasta entender bien el sistema

Recuerda: En crypto no hay servicio al cliente que te devuelva fondos perdidos. La seguridad es 100% tu responsabilidad.

Fuente: bitcoin.org/es/seguridad

Términos clave:
• NFT: Non-Fungible Token — token único que prueba propiedad o logro en blockchain
• manage_data: Operación de Stellar que guarda hasta 64 bytes de datos en una cuenta
• Stellar Expert: Explorador de bloques de Stellar donde verificar transacciones: stellar.expert
• 2FA: Autenticación de 2 factores — capa extra de seguridad con código temporal
• Phishing: Estafa que imita sitios legítimos para robar tus credenciales`,
      videoUrl: '',
    }));
    {
      const existingQs = await questionRepo.count({ where: { moduleId: ch3Mod3.id } });
      if (existingQs < 8) {
        await questionRepo.delete({ moduleId: ch3Mod3.id });
        for (const [idx, q] of wq3.entries()) {
          await questionRepo.save(questionRepo.create({ moduleId: ch3Mod3.id, question: q.question, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation, order: idx }));
        }
      }
    }

    await chapterModuleRepo.save(chapterModuleRepo.create({
      chapterId: ch3.id, type: 'final_exam', order: 4, title: 'Examen Final: Wallets',
      xpReward: 50, passingScore: 80, questionsPerAttempt: 10,
    }));

    console.log('✅ Cap 3: Wallets y Seguridad (3 módulos x [info+video+quiz] + examen final)');
    } else { console.log('✅ Cap 3 ya tiene módulos. Skipping.'); }
  }

  // ── CHAPTERS 4 & 5 (add independently if not exist) ────────────────────────

  const ch4Exists = await chapterRepo.findOne({ where: { title: 'DeFi: Finanzas Descentralizadas' } });
  if (!ch4Exists) {
    const ch4 = await chapterRepo.save(chapterRepo.create({
      title: 'DeFi: Finanzas Descentralizadas',
      description: 'Descubre cómo las finanzas descentralizadas están revolucionando el sistema financiero global y qué oportunidades ofrecen para Latinoamérica.',
      moduleTag: 'defi', order: 4, published: true, estimatedMinutes: 22, xpReward: 150,
      releaseWeek: '2026-W14',
    }));

    // Module 1: ¿Qué es DeFi?
    const ch4Mod1 = await chapterModuleRepo.save(chapterModuleRepo.create({
      chapterId: ch4.id, type: 'lesson', order: 1, title: '¿Qué es DeFi?',
      xpReward: 30, passingScore: 80, questionsPerAttempt: 5,
      content: `¿Qué es DeFi?

DeFi, o Finanzas Descentralizadas (Decentralized Finance), es un ecosistema de aplicaciones y servicios financieros construidos sobre redes blockchain que operan sin intermediarios tradicionales como bancos, aseguradoras o corredores de bolsa. En lugar de confiar en una institución central, DeFi usa smart contracts —código autoejecutable en la blockchain— para definir las reglas de cada servicio.

Imagina poder pedir un préstamo, invertir, intercambiar monedas o ganar intereses sin abrir una cuenta bancaria, sin presentar documentos y sin que nadie te rechace. Eso es DeFi: servicios financieros abiertos para cualquier persona con acceso a internet y una wallet.

¿Cómo nació DeFi?

Todo comenzó con Ethereum en 2015. A diferencia de Bitcoin (que es principalmente una moneda digital), Ethereum permitió crear smart contracts: pequeños programas que se ejecutan automáticamente cuando se cumplen ciertas condiciones. Esto abrió la puerta a recrear servicios financieros completos directamente en código.

En 2017 aparecieron los primeros DEX (exchanges descentralizados) y protocolos de lending. Para 2020, durante el llamado "DeFi Summer", el valor total bloqueado en protocolos DeFi pasó de $1,000 millones a más de $15,000 millones de dólares en tan solo meses.

¿Cómo funciona un DEX?

Un DEX (Decentralized Exchange) es una plataforma donde los usuarios intercambian criptomonedas directamente entre sí, sin un intermediario que custodie sus fondos. Los ejemplos más conocidos son Uniswap y SushiSwap en Ethereum, y el DEX integrado de Stellar.

A diferencia de un CEX (Centralized Exchange) como Binance o Coinbase, en un DEX:
• Tus fondos nunca salen de tu wallet hasta que decides hacer el intercambio
• No necesitas registrarte ni verificar tu identidad (KYC)
• Las reglas de precio las determina un algoritmo (AMM: Automated Market Maker)
• No puede ser cerrado por un gobierno ni hackeado como un exchange centralizado

El precio en un DEX se calcula usando fórmulas matemáticas que consideran cuántos tokens hay disponibles en el "pool de liquidez" —un fondo comunitario de tokens que los usuarios aportan voluntariamente.

Las ventajas de DeFi

1. SIN PERMISOS: Cualquier persona en cualquier país puede usar DeFi sin aprobación de nadie.
2. TRANSPARENCIA TOTAL: El código de cada protocolo es público y auditable. No hay letra pequeña.
3. INTEROPERABILIDAD: Los protocolos DeFi se conectan entre sí como bloques de Lego financiero.
4. AUTOGESTIÓN: Tus fondos siempre están en tu wallet. No dependes de que "el banco no quiebre".
5. DISPONIBILIDAD: Opera 24/7/365, sin días festivos, sin horarios de oficina, sin mantenimiento programado.

Ejemplos de protocolos DeFi famosos:
• Uniswap: El DEX más grande de Ethereum para intercambiar tokens
• AAVE: Protocolo de préstamos donde puedes pedir o dar en préstamo cripto
• Compound: Similar a AAVE, pionero en préstamos descentralizados
• Curve: DEX especializado en stablecoins con mínimo deslizamiento de precio
• MakerDAO: Creador de DAI, la primera stablecoin descentralizada importante

Términos clave:
• DeFi: Decentralized Finance — servicios financieros sin intermediarios en blockchain
• DEX: Decentralized Exchange — exchange sin custodia, peer-to-peer
• CEX: Centralized Exchange — exchange tradicional que custodia tus fondos (Binance, Coinbase)
• Liquidez: Fondos disponibles en un pool para facilitar intercambios
• Protocolo: Conjunto de smart contracts que define las reglas de un servicio DeFi`,
      videoUrl: '',
    }));
    {
      const dq1 = [
        { question: '¿Qué significa DeFi?', options: ['Digital Finance', 'Decentralized Finance / Finanzas Descentralizadas', 'Defined Finance', 'Deflation Finance'], correctIndex: 1, explanation: 'DeFi significa Finanzas Descentralizadas, servicios financieros sin intermediarios.' },
        { question: '¿Cuál es la principal diferencia entre DeFi y las finanzas tradicionales?', options: ['DeFi es más lento', 'DeFi no usa dinero real', 'DeFi elimina intermediarios como bancos usando smart contracts', 'DeFi solo funciona en EE.UU.'], correctIndex: 2, explanation: 'DeFi usa smart contracts para ofrecer servicios financieros sin bancos ni intermediarios.' },
        { question: '¿Qué es un DEX?', options: ['Un banco digital', 'Un exchange descentralizado donde los usuarios intercambian tokens directamente', 'Un tipo de wallet', 'Una criptomoneda'], correctIndex: 1, explanation: 'DEX (Decentralized Exchange) permite intercambiar tokens sin intermediarios, directamente entre usuarios.' },
        { question: '¿En qué blockchain nació DeFi?', options: ['Bitcoin', 'Stellar', 'Ethereum', 'Solana'], correctIndex: 2, explanation: 'Ethereum fue la primera blockchain en soportar los smart contracts que hacen posible DeFi.' },
        { question: '¿Qué hace un protocolo DeFi?', options: ['Guarda tus contraseñas', 'Define las reglas de un servicio financiero descentralizado en código', 'Conecta wallets físicas', 'Compra criptomonedas automáticamente'], correctIndex: 1, explanation: 'Un protocolo DeFi es un conjunto de smart contracts que definen las reglas de un servicio financiero.' },
      ];
      const existingQs = await questionRepo.count({ where: { moduleId: ch4Mod1.id } });
      if (existingQs < 8) {
        await questionRepo.delete({ moduleId: ch4Mod1.id });
        for (const [idx, q] of dq1.entries()) {
          await questionRepo.save(questionRepo.create({ moduleId: ch4Mod1.id, question: q.question, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation, order: idx }));
        }
      }
    }

    // Module 2: Lending, Yield y Stablecoins
    const ch4Mod2 = await chapterModuleRepo.save(chapterModuleRepo.create({
      chapterId: ch4.id, type: 'lesson', order: 2, title: 'Lending, Yield y Stablecoins',
      xpReward: 30, passingScore: 80, questionsPerAttempt: 5,
      content: `Préstamos en DeFi

En las finanzas tradicionales, pedir un préstamo requiere visitar un banco, presentar comprobantes de ingresos, esperar días para la aprobación y pagar tasas de interés fijas decididas por el banco. En DeFi, los préstamos funcionan de forma completamente diferente.

Protocolos como AAVE y Compound permiten que cualquier usuario pida prestado criptomonedas de forma instantánea, simplemente depositando un colateral (garantía) mayor al valor del préstamo. El proceso es 100% algorítmico: no hay un gerente de banco revisando tu historial crediticio.

¿Cómo funciona el lending DeFi?
1. Un usuario "prestamista" deposita sus tokens en el protocolo y recibe intereses automáticos
2. Otro usuario "prestatario" deposita un colateral (por ejemplo 150% del valor del préstamo)
3. El smart contract calcula las tasas de interés en tiempo real según oferta y demanda
4. Si el valor del colateral cae demasiado (bajo el umbral de liquidación), el protocolo lo vende automáticamente para proteger a los prestamistas

Yield Farming

El yield farming (agricultura de rendimientos) es una estrategia para maximizar ganancias en DeFi. Consiste en aportar liquidez o prestar activos a diferentes protocolos para obtener recompensas.

Cuando aportas liquidez a un pool de un DEX, recibes:
• Una fracción de las comisiones de cada intercambio que pase por ese pool
• Tokens de recompensa del protocolo (por ejemplo, tokens UNI de Uniswap)
• Posibilidad de usar esos tokens de recompensa en otros protocolos (farming sobre farming)

El rendimiento se mide en APY (Annual Percentage Yield). En DeFi, los APY pueden ir desde un conservador 3% hasta un volátil 500% o más, dependiendo del riesgo del protocolo y del par de tokens.

Stablecoins

Una stablecoin es una criptomoneda diseñada para mantener un valor estable, generalmente anclada 1:1 al dólar estadounidense. Son el puente entre el mundo volátil de las criptomonedas y la estabilidad necesaria para finanzas cotidianas.

Tipos de stablecoins:
• Colateralizadas con fiat: USDC (Circle), USDT (Tether) — respaldadas por dólares reales en cuentas bancarias
• Colateralizadas con crypto: DAI (MakerDAO) — respaldada por ETH y otros tokens, completamente descentralizada
• Algorítmicas: Mantienen el precio mediante algoritmos (mayor riesgo, ejemplos fallidos: Luna/UST en 2022)

USDC es actualmente la stablecoin más usada en DeFi y también en Stellar, donde permite enviar dólares digitales en segundos.

Riesgos en DeFi

DeFi no es sin riesgos. Antes de participar, debes conocer los principales peligros:

• RUG PULL: Los desarrolladores de un proyecto retiran toda la liquidez de repente y desaparecen con los fondos de los usuarios. Siempre investiga el equipo detrás de un protocolo.
• PÉRDIDA IMPERMANENTE (Impermanent Loss): Al aportar liquidez a un pool, si el precio de los tokens cambia mucho, puedes tener menos valor que si simplemente los hubieras guardado.
• BUGS EN SMART CONTRACTS: Un error en el código puede ser explotado por hackers. En 2023 se perdieron más de $1,700 millones en hacks DeFi. Prefiere protocolos auditados por empresas como Trail of Bits o OpenZeppelin.
• VOLATILIDAD: Los rendimientos altos suelen venir con riesgo alto. Un APY del 300% puede desaparecer en horas.

Términos clave:
• Yield Farming: Estrategia de obtener rendimientos prestando o aportando liquidez en DeFi
• Stablecoin: Criptomoneda con valor estable, normalmente vinculada al dólar
• TVL (Total Value Locked): Valor total de activos depositados en un protocolo DeFi — indica su tamaño y confianza
• Rug Pull: Estafa donde los creadores retiran la liquidez y abandonan el proyecto
• AAVE: Protocolo DeFi líder de préstamos y créditos descentralizados`,
      videoUrl: '',
    }));
    {
      const dq2 = [
        { question: '¿Qué es una stablecoin?', options: ['Una moneda que solo sube', 'Una criptomoneda con valor estable, generalmente vinculada al dólar', 'Una wallet segura', 'El nombre de Stellar en México'], correctIndex: 1, explanation: 'Las stablecoins mantienen un valor estable, generalmente 1:1 con el dólar, como USDC o DAI.' },
        { question: '¿Qué es el "yield farming"?', options: ['Cultivar criptomonedas físicamente', 'Estrategia de obtener rendimientos prestando o aportando liquidez en DeFi', 'Un juego blockchain', 'Una forma de minería solar'], correctIndex: 1, explanation: 'Yield farming es aportar activos a protocolos DeFi a cambio de rendimientos o tokens de recompensa.' },
        { question: '¿Qué mide el TVL en DeFi?', options: ['Total de usuarios', 'Total Value Locked — valor total de activos depositados en un protocolo', 'Tiempo de transacción', 'Tokens vendidos en el año'], correctIndex: 1, explanation: 'TVL (Total Value Locked) indica cuánto valor está depositado en un protocolo DeFi.' },
        { question: '¿Qué es un "rug pull"?', options: ['Tipo de NFT', 'Cuando los creadores de un proyecto abandonan y se llevan los fondos', 'Error de transacción', 'Actualización de protocolo'], correctIndex: 1, explanation: 'Un rug pull es una estafa donde los desarrolladores retiran toda la liquidez y abandonan el proyecto.' },
        { question: '¿Para qué sirve AAVE?', options: ['Comprar NFTs', 'Prestar y pedir prestado criptomonedas sin banco intermediario', 'Crear wallets', 'Ver el precio del Bitcoin'], correctIndex: 1, explanation: 'AAVE es un protocolo DeFi que permite prestar y pedir prestado criptomonedas con tasas algorítmicas.' },
      ];
      const existingQs = await questionRepo.count({ where: { moduleId: ch4Mod2.id } });
      if (existingQs < 8) {
        await questionRepo.delete({ moduleId: ch4Mod2.id });
        for (const [idx, q] of dq2.entries()) {
          await questionRepo.save(questionRepo.create({ moduleId: ch4Mod2.id, question: q.question, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation, order: idx }));
        }
      }
    }

    // Module 3: DeFi en Latinoamérica
    const ch4Mod3 = await chapterModuleRepo.save(chapterModuleRepo.create({
      chapterId: ch4.id, type: 'lesson', order: 3, title: 'DeFi en Latinoamérica',
      xpReward: 30, passingScore: 80, questionsPerAttempt: 5,
      content: `DeFi y las remesas en México

México es el tercer receptor de remesas del mundo: en 2023 los mexicanos en el exterior enviaron más de $63,000 millones de dólares a sus familias. Sin embargo, el costo promedio de una remesa bancaria es de $15 a $25 dólares por envío, y puede tardar 2 a 5 días hábiles en llegar.

DeFi ofrece una alternativa radical: usando stablecoins como USDC en redes como Stellar, un trabajador en Los Ángeles puede enviar $500 a su familia en Oaxaca en menos de 10 segundos, pagando menos de un centavo de comisión. La familia recibe los fondos en su wallet y puede convertirlos a pesos en exchanges locales como Bitso o Volabit.

Este no es un futuro distante: ya es posible hoy. Empresas como Bitso, Valiu y MoneyGram (que usa Stellar con USDC) ya están haciendo esto realidad para millones de familias latinoamericanas.

Protección contra la inflación

Argentina y Venezuela han vivido inflaciones devastadoras (en Argentina superó el 200% anual en 2024). Los ciudadanos de estos países han adoptado stablecoins como USDC y DAI masivamente como mecanismo de protección de sus ahorros.

En lugar de ver sus pesos devaluarse semana a semana, convierten sus ahorros a stablecoins en dólares digitales. El proceso es simple: descargan una wallet, compran USDC en un exchange local, y sus ahorros mantienen su poder adquisitivo en dólares sin necesidad de tener una cuenta bancaria en Estados Unidos.

Este fenómeno está transformando la adopción de crypto en Latinoamérica: no como especulación, sino como necesidad económica real.

Stellar y DeFi

Stellar no es solo una red de pagos: tiene su propio DEX integrado y un ecosistema DeFi en crecimiento. Sus ventajas para DeFi en Latinoamérica son:

• VELOCIDAD: 5 segundos de confirmación (vs 15 segundos de Ethereum, minutos en Bitcoin)
• COSTO: Fracciones de centavo por transacción (vs $5-50 de gas en Ethereum en horas pico)
• STABLECOINS: USDC nativo en Stellar, emitido directamente por Circle en la red
• INCLUSIÓN: Diseñado para incluir a los no bancarizados con mínimos requerimientos
• SOROBAN: La nueva plataforma de smart contracts de Stellar, abriendo el camino a DeFi completo

¿Qué son los oráculos?

Un problema de los smart contracts es que viven en la blockchain y no pueden acceder directamente a datos del mundo real (precios de activos, resultados de elecciones, condiciones climáticas). Los oráculos resuelven esto.

Un oráculo es un servicio que lleva datos externos a la blockchain de forma confiable. Por ejemplo, para que un protocolo DeFi sepa el precio actual de ETH/USD, consulta un oráculo como Chainlink, que agrega precios de múltiples fuentes y los publica en la blockchain.

Sin oráculos, DeFi no podría funcionar: los protocolos de lending necesitan saber el precio del colateral, los seguros necesitan datos de eventos reales, y los derivados necesitan precios de referencia.

Flash Loans y Pools de Liquidez

Los flash loans son préstamos instantáneos sin colateral que deben devolverse en la misma transacción blockchain. Si no se devuelven, la transacción completa se revierte como si nunca hubiera ocurrido. Son herramientas poderosas para arbitraje y otras estrategias avanzadas.

Los pools de liquidez son fondos colectivos de tokens que los usuarios aportan para que otros puedan intercambiarlos. A cambio de aportar, los proveedores de liquidez ganan una fracción de cada operación que pasa por el pool.

El futuro de DeFi en México

Con 45 millones de mexicanos sin acceso a servicios bancarios formales, DeFi representa una oportunidad histórica de inclusión financiera. Solo se necesita un smartphone y conexión a internet para acceder a préstamos, ahorros, inversiones y pagos internacionales.

Organizaciones como la Stellar Development Foundation trabajan activamente con gobiernos y empresas de Latinoamérica para construir esta infraestructura. Tonalli es parte de este movimiento: preparando a los mexicanos con el conocimiento para aprovechar estas oportunidades.

Términos clave:
• Oráculo: Servicio que lleva datos del mundo real a la blockchain para los smart contracts
• Flash Loan: Préstamo instantáneo sin colateral que debe devolverse en la misma transacción
• Pool de Liquidez: Fondo colectivo de tokens para facilitar intercambios en un DEX
• Remesa: Dinero enviado por trabajadores migrantes a sus familias en otro país
• Inclusión Financiera: Acceso de toda la población a servicios financieros básicos`,
      videoUrl: '',
    }));
    {
      const dq3 = [
        { question: '¿Qué problema resuelve DeFi para los trabajadores migrantes mexicanos?', options: ['Les da vacaciones pagadas', 'Reduce el costo y tiempo de las remesas internacionales', 'Les enseña inglés', 'Les da ciudadanía americana'], correctIndex: 1, explanation: 'DeFi permite enviar remesas en segundos por centavos, vs días y $25 USD de comisión bancaria.' },
        { question: '¿Por qué los argentinos usan stablecoins?', options: ['Por moda', 'Para proteger sus ahorros contra la inflación superior al 100% anual', 'Son obligatorios por ley', 'Son más coloridas que el peso'], correctIndex: 1, explanation: 'Con inflación récord, los argentinos usan USDC y DAI para proteger su poder adquisitivo.' },
        { question: '¿Qué es un oráculo en DeFi?', options: ['Un adivino del futuro de las cripto', 'Un servicio que lleva datos del mundo real a la blockchain', 'Un tipo de wallet fría', 'El nombre del consenso de Ethereum'], correctIndex: 1, explanation: 'Los oráculos conectan datos externos (precios, clima, resultados deportivos) con los smart contracts.' },
        { question: '¿Cómo puede DeFi ayudar a los 45 millones de mexicanos sin cuenta bancaria?', options: ['No puede ayudarles', 'Dándoles acceso a servicios financieros solo con smartphone y wallet', 'Construyendo más bancos', 'Creando efectivo digital'], correctIndex: 1, explanation: 'DeFi solo requiere un smartphone y una wallet para acceder a préstamos, ahorros y transferencias.' },
        { question: '¿Cuál es la ventaja de Stellar para DeFi en LATAM?', options: ['Es la más cara', 'Transacciones en 5 segundos por fracciones de centavo, ideal para remesas', 'Solo funciona en Estados Unidos', 'Requiere muchos XLM para operar'], correctIndex: 1, explanation: 'Stellar combina velocidad, bajas comisiones y stablecoins para DeFi accesible en Latinoamérica.' },
      ];
      const existingQs = await questionRepo.count({ where: { moduleId: ch4Mod3.id } });
      if (existingQs < 8) {
        await questionRepo.delete({ moduleId: ch4Mod3.id });
        for (const [idx, q] of dq3.entries()) {
          await questionRepo.save(questionRepo.create({ moduleId: ch4Mod3.id, question: q.question, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation, order: idx }));
        }
      }
    }

    // Module 4: Examen Final DeFi
    await chapterModuleRepo.save(chapterModuleRepo.create({
      chapterId: ch4.id, type: 'final_exam', order: 4, title: 'Examen Final: DeFi',
      xpReward: 50, passingScore: 80, questionsPerAttempt: 10,
    }));

    console.log('✅ Cap 4: DeFi: Finanzas Descentralizadas (3 módulos + examen final)');
  } else {
    console.log('✅ Cap 4 already exists. Skipping.');
  }

  const ch5Exists = await chapterRepo.findOne({ where: { title: 'NFTs y Web3 en México' } });
  if (!ch5Exists) {
    const ch5 = await chapterRepo.save(chapterRepo.create({
      title: 'NFTs y Web3 en México',
      description: 'Entiende qué son los NFTs, cómo funcionan los certificados digitales verificables y el impacto de Web3 en la economía creativa mexicana.',
      moduleTag: 'nfts', order: 5, published: true, estimatedMinutes: 20, xpReward: 150,
      releaseWeek: '2026-W15',
    }));

    // Module 1: ¿Qué son los NFTs?
    const ch5Mod1 = await chapterModuleRepo.save(chapterModuleRepo.create({
      chapterId: ch5.id, type: 'lesson', order: 1, title: '¿Qué son los NFTs?',
      xpReward: 30, passingScore: 80, questionsPerAttempt: 5,
      content: `¿Qué son los NFTs?

NFT significa Non-Fungible Token, o Token No Fungible en español. Para entender qué significa "no fungible", primero entendamos qué es "fungible": el dinero es fungible porque un billete de $100 pesos es exactamente igual a otro billete de $100 pesos y puedes intercambiarlos sin diferencia.

Un NFT es lo opuesto: es un token digital único e irrepetible. Aunque existan miles de NFTs de la misma colección, cada uno tiene propiedades únicas codificadas en la blockchain que lo distinguen de todos los demás. Es como un certificado de autenticidad digital que no puede falsificarse.

¿Qué hace único a un NFT?

A diferencia de una imagen JPG que puedes copiar y pegar infinitas veces, un NFT tiene:
• Un ID único registrado permanentemente en la blockchain
• Un historial de propietarios inmutable y verificable
• Metadatos que describen sus propiedades (nombre, imagen, atributos especiales)
• Una dirección de wallet propietaria que solo puede cambiar con una transacción firmada

Cualquiera puede ver o descargar la imagen de un NFT famoso, pero solo una persona puede ser el propietario verificado en blockchain.

Historia de los NFTs

• 2012-2014: Los "Colored Coins" en Bitcoin fueron los primeros intentos de tokens únicos
• 2017: CryptoKitties en Ethereum —gatos digitales coleccionables— se volvieron tan populares que congestionaron toda la red Ethereum. Fue el primer NFT masivo.
• 2017-2020: CryptoPunks, 10,000 personajes pixelados únicos, algunos vendidos por millones de dólares
• 2021: "Everydays: The First 5000 Days" del artista Beeple se vendió en Christie's por $69 millones de dólares, disparando la fiebre NFT mundial
• 2021-2022: Bored Ape Yacht Club, Azuki, Doodles — colecciones que se convirtieron en símbolo de estatus digital
• 2022-presente: El mercado madura, los NFTs evolucionan hacia utilidad real más allá de la especulación

Más allá del arte digital

Los NFTs no son solo imágenes de monos caros. Sus aplicaciones reales incluyen:

MÚSICA: Artistas como 3LAU o Kings of Leon han lanzado álbumes como NFTs, dando a los fans propiedad de contenido exclusivo y acceso especial a conciertos.

GAMING: Juegos como Axie Infinity o Gods Unchained tienen personajes y objetos como NFTs que los jugadores realmente poseen y pueden vender en mercados abiertos.

CERTIFICADOS Y DIPLOMAS: Universidades como MIT ya emiten diplomas como NFTs verificables. No más diplomas falsificados: cualquiera puede verificar la autenticidad en segundos.

TICKETS DE EVENTOS: NFTs como tickets eliminan la reventa fraudulenta y permiten al artista cobrar regalías en el mercado secundario.

IDENTIDAD DIGITAL: NFTs como identificadores únicos para identidad digital soberana.

BIENES RAÍCES: Propiedades tokenizadas que permiten fraccionar la propiedad y comerciarla en mercados globales.

NFTs en Stellar

Stellar permite crear NFTs usando sus activos nativos (Stellar Assets). A diferencia de Ethereum (donde los NFTs usan estándares ERC-721), en Stellar los NFTs son activos con suministro limitado a 1 unidad, con metadatos almacenados usando la operación manage_data.

Tonalli usa esta tecnología para emitir certificados NFT en Stellar cada vez que un usuario completa y aprueba un capítulo. Esto significa que tu certificado de aprendizaje es:
• Verificable por cualquier persona en el explorador de Stellar
• Imposible de falsificar o alterar
• Tuyo para siempre, incluso si Tonalli desaparece
• Transferible si algún día quisieras venderlo o regalarlo

Términos clave:
• NFT: Non-Fungible Token — token único e irrepetible en blockchain
• Fungible: Intercambiable 1:1 por un elemento idéntico (el dinero es fungible)
• Metadatos: Información adicional del NFT como nombre, imagen, atributos especiales
• IPFS: InterPlanetary File System — sistema de archivos descentralizado donde se almacenan los archivos de los NFTs
• Token Standard: Estándar técnico para crear NFTs (ERC-721 en Ethereum, Assets en Stellar)`,
      videoUrl: '',
    }));
    {
      const nq1 = [
        { question: '¿Qué significa NFT?', options: ['New Financial Token', 'Non-Fungible Token (Token No Fungible)', 'Next Future Technology', 'National Finance Transfer'], correctIndex: 1, explanation: 'NFT significa Non-Fungible Token, un token único e irrepetible en la blockchain.' },
        { question: '¿Qué hace a un NFT "no fungible"?', options: ['Que no se puede vender', 'Que es único e irrepetible, no intercambiable por otro idéntico', 'Que no tiene valor', 'Que solo existe en papel'], correctIndex: 1, explanation: 'No fungible significa que cada NFT es único; no puedes intercambiarlo 1:1 por otro NFT idéntico.' },
        { question: '¿Para qué usa Tonalli los NFTs?', options: ['Para vender arte', 'Como certificados verificables de conocimiento en Stellar', 'Para hacer pagos', 'Como contraseñas'], correctIndex: 1, explanation: 'Tonalli emite NFTs en Stellar como certificados que prueban que completaste y aprobaste un capítulo.' },
        { question: '¿Dónde se almacenan los metadatos de un NFT?', options: ['En el celular del usuario', 'En IPFS o en la blockchain, de forma descentralizada', 'En los servidores de Facebook', 'En una USB'], correctIndex: 1, explanation: 'Los metadatos de NFTs generalmente se almacenan en IPFS (sistema de archivos descentralizado).' },
        { question: '¿Cuál fue uno de los primeros NFTs populares masivamente?', options: ['Bitcoin', 'Dogecoin', 'CryptoKitties', 'Ethereum'], correctIndex: 2, explanation: 'CryptoKitties (2017) fue uno de los primeros NFTs en popularizarse, llegando a congestionar Ethereum.' },
      ];
      const existingQs = await questionRepo.count({ where: { moduleId: ch5Mod1.id } });
      if (existingQs < 8) {
        await questionRepo.delete({ moduleId: ch5Mod1.id });
        for (const [idx, q] of nq1.entries()) {
          await questionRepo.save(questionRepo.create({ moduleId: ch5Mod1.id, question: q.question, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation, order: idx }));
        }
      }
    }

    // Module 2: NFTs en la economía creativa mexicana
    const ch5Mod2 = await chapterModuleRepo.save(chapterModuleRepo.create({
      chapterId: ch5.id, type: 'lesson', order: 2, title: 'NFTs en la economía creativa mexicana',
      xpReward: 30, passingScore: 80, questionsPerAttempt: 5,
      content: `Artistas mexicanos y los NFTs

México tiene una de las tradiciones artísticas más ricas del mundo: desde el muralismo de Diego Rivera y José Clemente Orozco hasta el arte contemporáneo de artistas como Dr. Lakra o Carla Rippey. Los NFTs han abierto una nueva dimensión para esta tradición.

Artistas mexicanos como Frida Larios (arte inspirado en cultura precolombina), Ale de la Torre (arte digital interactivo) y colectivos como Aztlan DAO están experimentando con NFTs para llevar el arte mexicano a audiencias globales sin pasar por galerías ni intermediarios.

El mercado NFT ha democratizado el acceso al arte: un artista de Oaxaca puede vender su obra directamente a coleccionistas en Tokio, París o Nueva York, recibiendo el pago en minutos en su wallet.

Regalías automáticas

Una de las ventajas más revolucionarias de los NFTs para los artistas es el sistema de regalías programadas en el smart contract. En el mercado del arte tradicional, cuando alguien compra un cuadro por $1,000 pesos y años después lo revende por $100,000 pesos, el artista original no recibe nada de esa reventa.

Con NFTs, el artista puede programar que reciba automáticamente un porcentaje (tipicamente 5-10%) de CADA reventa futura. Esto crea un flujo de ingresos pasivos perpetuo: si tu NFT se vuelve famoso y cambia de manos muchas veces, siempre recibes tu parte.

NFTs más allá del arte

En México, los NFTs tienen aplicaciones prácticas que van mucho más allá del arte digital:

DIPLOMAS Y CERTIFICADOS ACADÉMICOS: El CONACYT y algunas universidades mexicanas están explorando la emisión de diplomas como NFTs verificables. Esto elimina la falsificación de títulos —un problema real en México— y permite verificación instantánea a cualquier empleador en el mundo.

REGISTRO DE PROPIEDAD INMUEBLE: El Registro Público de la Propiedad de México enfrenta problemas de corrupción y manipulación de registros. Tokenizar propiedades en blockchain haría estos registros inmutables y verificables.

TICKETS DE EVENTOS: Artistas como Bad Bunny, Peso Pluma y Grupo Frontera han tenido problemas masivos con revendedores y tickets falsificados. Los NFT-tickets eliminan la falsificación y permiten al artista controlar el mercado secundario.

ARTE PREHISPÁNICO DIGITAL: Colectivos están creando NFTs inspirados en el arte azteca, maya y zapoteca, preservando y promoviendo esta herencia cultural en el ecosistema digital global.

El mercado NFT en México

Los principales mercados (marketplaces) donde se compran y venden NFTs son:
• OpenSea: El marketplace más grande del mundo para NFTs en Ethereum y Polygon
• Objkt: El marketplace líder para NFTs en Tezos, popular por su bajo costo
• Magic Eden: Popular para NFTs en Solana
• Stellar DEX: Para NFTs y activos nativos en Stellar, con comisiones mínimas

En México, exchanges como Bitso facilitan el onramp (entrada de pesos a crypto) y offramp (de crypto a pesos) necesario para participar en el mercado NFT.

Para comprar tu primer NFT necesitas:
1. Una wallet compatible (MetaMask para Ethereum, LOBSTR o Freighter para Stellar)
2. Fondos en la criptomoneda nativa de la blockchain (ETH, SOL, XLM)
3. Una cuenta en el marketplace elegido
4. Seleccionar el NFT y confirmar la transacción desde tu wallet

El proceso de "mintear" (crear) un NFT también es accesible: plataformas como OpenSea permiten hacerlo sin conocimientos técnicos en minutos.

Términos clave:
• Regalías: Porcentaje que recibe el creador original en cada reventa del NFT
• Marketplace: Plataforma de compra-venta de NFTs (OpenSea, Objkt, Magic Eden)
• OpenSea: El marketplace de NFTs más grande del mundo
• Mint (Mintear): Crear y registrar un NFT por primera vez en la blockchain
• Wallet NFT: Wallet que soporta almacenamiento y visualización de NFTs`,
      videoUrl: '',
    }));
    {
      const nq2 = [
        { question: '¿Qué ventaja dan los NFTs a los artistas sobre los royalties?', options: ['Ninguna ventaja', 'Reciben un porcentaje automático en cada reventa, programado en el smart contract', 'El comprador les paga manualmente', 'Solo el primer comprador paga'], correctIndex: 1, explanation: 'Los smart contracts pueden programar que el artista reciba royalties automáticamente en cada reventa.' },
        { question: '¿Qué es el "mint" (mintear) de un NFT?', options: ['Vender un NFT existente', 'Crear y registrar por primera vez un NFT en la blockchain', 'Copiar un NFT', 'Quemar un NFT'], correctIndex: 1, explanation: 'Mintear es el proceso de crear un NFT por primera vez y registrarlo en la blockchain.' },
        { question: '¿Qué representa un ticket de evento como NFT?', options: ['Solo un archivo JPG', 'Prueba verificable de entrada al evento, transferible e imposible de falsificar', 'Una criptomoneda', 'Un smart contract de seguro'], correctIndex: 1, explanation: 'Los tickets NFT son verificables, no falsificables y pueden transferirse en mercados secundarios.' },
        { question: '¿Por qué Stellar es una buena opción para NFTs en México?', options: ['Porque es la más cara', 'Por sus bajos costos, velocidad y huella de carbono casi cero', 'Porque solo funciona en México', 'Porque no tiene smart contracts'], correctIndex: 1, explanation: 'Stellar ofrece costos de fracción de centavo, confirmación en 5 segundos y es ecológica.' },
        { question: '¿Qué es un marketplace de NFTs?', options: ['Una tienda de ropa digital', 'Plataforma donde se compran, venden e intercambian NFTs', 'Un banco de criptomonedas', 'Un tipo de wallet'], correctIndex: 1, explanation: 'Un marketplace NFT es una plataforma de comercio (como OpenSea, Objkt o el DEX de Stellar).' },
      ];
      const existingQs = await questionRepo.count({ where: { moduleId: ch5Mod2.id } });
      if (existingQs < 8) {
        await questionRepo.delete({ moduleId: ch5Mod2.id });
        for (const [idx, q] of nq2.entries()) {
          await questionRepo.save(questionRepo.create({ moduleId: ch5Mod2.id, question: q.question, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation, order: idx }));
        }
      }
    }

    // Module 3: El futuro de Web3 en México
    const ch5Mod3 = await chapterModuleRepo.save(chapterModuleRepo.create({
      chapterId: ch5.id, type: 'lesson', order: 3, title: 'El futuro de Web3 en México',
      xpReward: 30, passingScore: 80, questionsPerAttempt: 5,
      content: `DAOs: Organizaciones del Futuro

Una DAO (Decentralized Autonomous Organization) es una organización gobernada por reglas codificadas en smart contracts, donde las decisiones se toman mediante votación de sus miembros, no por un director o consejo de administración centralizado.

Imagina una empresa donde:
• No hay CEO ni gerentes que tomen decisiones unilaterales
• Cada miembro tiene tokens de votación proporcionales a su participación
• Todas las transacciones de la tesorería son públicas y verificables
• Las reglas están en código: si la votación pasa el umbral, la acción se ejecuta automáticamente

En México, las DAOs tienen aplicaciones potenciales fascinantes:
• DAO de ejidatarios: Comunidades agrarias gestionando tierras con gobernanza transparente
• DAO de artistas: Colectivos creativos con propiedad compartida de proyectos y distribución automática de ingresos
• DAO de inversión: Grupos que invierten juntos en proyectos blockchain con reglas transparentes
• DAO de servicios públicos: Comunidades organizando proyectos de infraestructura local con fondos verificables

Identidad Digital Descentralizada

La identidad digital descentralizada (DID — Decentralized Identifier) es un nuevo tipo de identificación digital que tú controlas completamente, sin depender de Facebook, Google ni ningún gobierno.

Hoy en día, tu identidad digital está fragmentada entre decenas de empresas:
• Facebook sabe tus amigos, preferencias y vida social
• Google sabe tus búsquedas, emails y ubicaciones
• Tu banco conoce tu historial financiero
• El SAT tiene tu información fiscal

Con DID, tú posees un identificador único en blockchain y decides qué información compartir con quién, sin que ninguna empresa pueda revender tus datos ni cerrar tu cuenta arbitrariamente.

México y la Blockchain

El gobierno mexicano ha comenzado a explorar aplicaciones blockchain:

TRANSPARENCIA GUBERNAMENTAL: La blockchain podría hacer los registros de contratos gubernamentales inmutables y verificables por cualquier ciudadano, combatiendo la corrupción en licitaciones.

REGISTRO CIVIL: Actas de nacimiento, matrimonio y defunción en blockchain serían imposibles de falsificar y accesibles desde cualquier parte del mundo.

SISTEMA DE VOTACIÓN: Varios estados mexicanos han explorado el voto electrónico con registro blockchain para aumentar la transparencia y reducir el fraude electoral.

PESO DIGITAL: Banxico (el Banco de México) está estudiando la emisión de un CBDC (Central Bank Digital Currency) — un peso digital oficial. Aunque centralizado, podría complementar el ecosistema DeFi y facilitar la inclusión financiera.

GameFi y el Metaverso

GameFi (Game + Finance) son videojuegos blockchain donde los jugadores ganan tokens reales que tienen valor fuera del juego. En Axie Infinity durante 2021, jugadores de Filipinas ganaban más jugando que con su salario tradicional.

En México, el modelo Play-to-Earn tiene potencial enorme:
• Jóvenes en zonas rurales podrían generar ingresos jugando
• Los activos del juego (personajes, tierras, objetos) son NFTs que el jugador realmente posee
• Los torneos y competencias tienen premios en criptomonedas reales

El Metaverso amplía esta visión: espacios digitales 3D donde la economía virtual se mezcla con la real. Artistas mexicanos pueden tener galerías virtuales en el Metaverso, vender NFTs y organizar eventos para audiencias globales sin moverse de su ciudad.

La misión de Tonalli

Tonalli existe en la intersección de la riqueza cultural mexicana y la revolución tecnológica Web3. Nuestro nombre viene del náhuatl: "día" y "sol" — iluminando el camino hacia el conocimiento.

Mientras el mundo avanza hacia una economía digital descentralizada, México tiene una oportunidad única: combinar su talento humano, su rica herencia cultural y la tecnología blockchain para crear valor en la economía global.

Cada certificado NFT que emite Tonalli en Stellar no es solo un logro académico: es la primera pieza de tu identidad digital Web3, verificable por cualquier empleador en el mundo, permanente en blockchain y tuyo para siempre.

El futuro de México en Web3 no se va a construir solo: necesita de personas como tú, preparadas, certificadas y listas para liderar la transformación digital.

Términos clave:
• DAO: Decentralized Autonomous Organization — organización gobernada por votación en blockchain sin directivos centrales
• DID: Decentralized Identifier — identidad digital que controlas tú, no empresas ni gobiernos
• CBDC: Central Bank Digital Currency — moneda digital emitida por un banco central (como el peso digital)
• GameFi: Combinación de videojuegos y finanzas descentralizadas donde se ganan tokens reales jugando
• Metaverso: Espacio digital 3D persistente donde la economía virtual y real se integran`,
      videoUrl: '',
    }));
    {
      const nq3 = [
        { question: '¿Qué es una DAO?', options: ['Un banco digital', 'Organización Autónoma Descentralizada gobernada por votación en blockchain', 'Un tipo de NFT', 'Una wallet especial'], correctIndex: 1, explanation: 'Una DAO es una organización donde las decisiones se toman por votación de sus miembros en blockchain, sin directivos centrales.' },
        { question: '¿Qué es la identidad digital descentralizada (DID)?', options: ['Tu contraseña de Facebook', 'Una identidad digital que tú controlas, sin depender de empresas o gobiernos', 'Tu número de CURP digital', 'Un tipo de pasaporte físico'], correctIndex: 1, explanation: 'DID permite tener una identidad digital verificable que controlas tú, no Facebook ni Google.' },
        { question: '¿Cómo podría blockchain ayudar a combatir la corrupción en registros públicos?', options: ['No puede ayudar', 'Haciendo los registros inmutables, transparentes y verificables por cualquier ciudadano', 'Dando dinero a los funcionarios', 'Digitalizando los documentos en PDF'], correctIndex: 1, explanation: 'En una blockchain pública, todos pueden verificar registros de propiedades, contratos o diplomas, eliminando la manipulación.' },
        { question: '¿Qué es GameFi?', options: ['Un juego de cartas tradicional', 'La combinación de videojuegos y DeFi donde puedes ganar criptomonedas jugando', 'Una consola de videojuegos', 'Un tipo de NFT de imagen'], correctIndex: 1, explanation: 'GameFi (Game + Finance) son videojuegos blockchain donde los jugadores ganan tokens reales.' },
        { question: '¿Cuál es la misión de Tonalli para México?', options: ['Vender criptomonedas', 'Preparar a los mexicanos para Web3 con educación certificada en blockchain', 'Crear un banco digital', 'Desarrollar una red social'], correctIndex: 1, explanation: 'Tonalli certifica conocimientos Web3 con NFTs reales en Stellar, preparando a México para la economía digital.' },
      ];
      const existingQs = await questionRepo.count({ where: { moduleId: ch5Mod3.id } });
      if (existingQs < 8) {
        await questionRepo.delete({ moduleId: ch5Mod3.id });
        for (const [idx, q] of nq3.entries()) {
          await questionRepo.save(questionRepo.create({ moduleId: ch5Mod3.id, question: q.question, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation, order: idx }));
        }
      }
    }

    // Module 4: Examen Final NFTs y Web3
    await chapterModuleRepo.save(chapterModuleRepo.create({
      chapterId: ch5.id, type: 'final_exam', order: 4, title: 'Examen Final: NFTs y Web3',
      xpReward: 50, passingScore: 80, questionsPerAttempt: 10,
    }));

    console.log('✅ Cap 5: NFTs y Web3 en México (3 módulos + examen final)');
  } else {
    console.log('✅ Cap 5 already exists. Skipping.');
  }

  // ── Legacy lessons (backward compat) ─────────────────────────────────────────
  const existingLessons = await lessonRepo.count();
  if (existingLessons === 0) {
    const lesson1 = await lessonRepo.save(lessonRepo.create({
      title: '¿Qué es Blockchain?', description: 'Fundamentos de blockchain.',
      moduleId: MODULE_ID, moduleName: MODULE_NAME, order: 1, type: LessonType.READING,
      xpReward: 50, xlmReward: '0.5', character: 'chima',
      characterDialogue: '¡Hola! Soy Chima. ¡Bienvenido a tu primera lección!',
      content: JSON.stringify({ sections: [{ title: 'Blockchain', text: 'Ver capítulo completo para más info.', icon: '🔗' }] }),
    }));
    await quizRepo.save(quizRepo.create({ lessonId: lesson1.id, questionsPool: BLOCKCHAIN_QUESTIONS, questionsPerAttempt: 10, passingScore: 70 }));

    const lesson2 = await lessonRepo.save(lessonRepo.create({
      title: '¿Cómo funciona Stellar?', description: 'Stellar y sus ventajas.',
      moduleId: MODULE_ID, moduleName: MODULE_NAME, order: 2, type: LessonType.READING,
      xpReward: 50, xlmReward: '0.5', character: 'alli',
      characterDialogue: '¡Qué onda! Soy Alli. Stellar es mi favorita.',
      content: JSON.stringify({ sections: [{ title: 'Stellar', text: 'Ver capítulo completo para más info.', icon: '⭐' }] }),
    }));
    await quizRepo.save(quizRepo.create({ lessonId: lesson2.id, questionsPool: STELLAR_QUESTIONS, questionsPerAttempt: 10, passingScore: 70 }));

    const lesson3 = await lessonRepo.save(lessonRepo.create({
      title: 'Tu primera wallet', description: 'Cómo funciona tu wallet Stellar.',
      moduleId: MODULE_ID, moduleName: MODULE_NAME, order: 3, type: LessonType.INTERACTIVE,
      xpReward: 50, xlmReward: '0.5', character: 'xollo',
      characterDialogue: '¡Guau! Soy Xollo 🐕 ¡Ya tienes una wallet Stellar!',
      content: JSON.stringify({ sections: [{ title: 'Wallet', text: 'Ver capítulo completo para más info.', icon: '👛' }] }),
    }));
    await quizRepo.save(quizRepo.create({ lessonId: lesson3.id, questionsPool: WALLET_QUESTIONS, questionsPerAttempt: 10, passingScore: 70 }));

    console.log('✅ 3 legacy lessons created');
  }

  // ── Ensure questions for ALL existing modules ────────────────────────────────
  // This block runs every time regardless of whether modules were just created or
  // already existed. It checks each module's question count and inserts if empty.

  console.log('\n🔍 Ensuring questions exist for all modules...');

  // Question pools per chapter order
  const lessonQuestionPools: Record<number, [typeof bq1, typeof bq1, typeof bq1]> = {
    1: [bq1, bq2, bq3],
    2: [sq1, sq2, sq3],
    3: [wq1, wq2, wq3],
  };

  // Extra final exam questions per chapter (5 per chapter)
  const extraFinalExamQuestions: Record<number, Array<{ question: string; options: string[]; correctIndex: number; explanation: string }>> = {
    1: [
      { question: '¿Cuál es la ventaja principal de blockchain sobre bases de datos tradicionales?', options: ['Mayor velocidad de lectura', 'Transparencia e inmutabilidad sin autoridad central', 'Menor costo de almacenamiento', 'Interfaz más amigable'], correctIndex: 1, explanation: 'La transparencia e inmutabilidad sin autoridad central son ventajas únicas de blockchain.' },
      { question: '¿Qué es la "minería" en blockchain?', options: ['Extraer minerales digitales', 'Proceso de validar transacciones y crear nuevos bloques', 'Hackear la red', 'Crear nuevas criptomonedas desde cero'], correctIndex: 1, explanation: 'La minería es el proceso computacional de validar transacciones y añadir bloques.' },
      { question: '¿Qué sucede si intentas modificar un bloque antiguo en blockchain?', options: ['El bloque se actualiza automáticamente', 'El hash del bloque cambia, invalidando toda la cadena posterior', 'Solo el dueño puede modificarlo', 'La red lo acepta si es pequeño'], correctIndex: 1, explanation: 'Modificar un bloque cambia su hash, rompiendo la cadena y alertando a toda la red.' },
      { question: '¿Cuál es el objetivo principal de los smart contracts?', options: ['Crear documentos legales', 'Ejecutar acuerdos automáticamente sin intermediarios', 'Guardar contraseñas', 'Acelerar el internet'], correctIndex: 1, explanation: 'Los smart contracts se ejecutan automáticamente cuando se cumplen condiciones predefinidas.' },
      { question: '¿Qué es Web3?', options: ['La tercera versión del navegador Chrome', 'La evolución del internet donde los usuarios poseen sus datos y activos', 'Una red social nueva', 'Un protocolo de videollamadas'], correctIndex: 1, explanation: 'Web3 es la evolución del internet basada en blockchain donde los usuarios tienen control real.' },
    ],
    2: [
      { question: '¿Qué ventaja tiene Stellar sobre las transferencias bancarias tradicionales?', options: ['Es más seguro', 'Es 3-5 segundos vs 3-5 días bancarios y cuesta fracciones de centavo', 'Tiene mejor atención al cliente', 'Tiene más sucursales'], correctIndex: 1, explanation: 'Stellar confirma en 3-5 segundos con comisiones de fracciones de centavo vs días y $25-50 bancarios.' },
      { question: '¿Qué empresa global usa Stellar para remesas con USDC?', options: ['PayPal', 'MoneyGram', 'Western Union', 'Revolut'], correctIndex: 1, explanation: 'MoneyGram se asoció con Stellar para procesar pagos internacionales usando USDC.' },
      { question: '¿Qué distingue a Soroban de otras plataformas de smart contracts?', options: ['Es más cara', 'Está escrita en Rust con costos predecibles y almacenamiento eficiente', 'Solo funciona en mainnet', 'Requiere KYC'], correctIndex: 1, explanation: 'Soroban usa Rust para seguridad máxima y tiene un modelo de costos predecibles único.' },
      { question: '¿Cuál es el balance mínimo para mantener activa una cuenta Stellar?', options: ['0 XLM', '0.5 XLM', '1 XLM', '10 XLM'], correctIndex: 2, explanation: 'Se requiere un balance base de 1 XLM para mantener activa una cuenta Stellar.' },
      { question: '¿Qué hace el Friendbot en el testnet de Stellar?', options: ['Te envía mensajes', 'Fondea cuentas con 10,000 XLM de prueba gratuitamente', 'Valida transacciones', 'Es el explorador de bloques'], correctIndex: 1, explanation: 'Friendbot fondea cuentas en testnet con XLM de prueba para desarrollar y aprender.' },
    ],
    3: [
      { question: '¿Cuál es la regla de oro en criptomonedas?', options: ['Compra en baja vende en alta', '"Not your keys, not your coins" — sin claves privadas no hay control', 'Diversifica siempre', 'Invierte solo lo que puedas perder'], correctIndex: 1, explanation: 'Sin control de tus claves privadas, un tercero controla realmente tus fondos.' },
      { question: '¿Dónde NUNCA debes guardar tu seed phrase?', options: ['En papel en un lugar seguro', 'En una caja fuerte', 'En tu celular o computadora conectada a internet', 'Memorizada'], correctIndex: 2, explanation: 'La seed phrase digital puede ser robada por malware. Solo en papel físico seguro.' },
      { question: '¿Qué wallet recomienda Tonalli para interactuar con el ecosistema Stellar?', options: ['MetaMask', 'Ledger', 'Freighter', 'Trust Wallet'], correctIndex: 2, explanation: 'Freighter es la wallet oficial de Stellar como extensión de navegador.' },
      { question: '¿Qué es el phishing en el contexto de crypto?', options: ['Un tipo de pez digital', 'Estafa que imita sitios legítimos para robar credenciales y claves', 'Una técnica de minería', 'Un protocolo de Stellar'], correctIndex: 1, explanation: 'El phishing crea sitios falsos idénticos a los reales para engañarte y robar tus claves.' },
      { question: '¿Cómo crea Tonalli tu wallet automáticamente?', options: ['Pidiéndote que la descargues', 'Usando Friendbot y generando un keypair único al registrarte', 'Conectando con tu banco', 'Comprando XLM primero'], correctIndex: 1, explanation: 'Al registrarte, Tonalli genera un keypair Stellar y usa Friendbot para fondearlo en testnet.' },
    ],
    4: [
      { question: '¿Qué es el "yield farming"?', options: ['Cultivar en blockchain', 'Estrategia para maximizar rendimientos proveyendo liquidez en DeFi', 'Minar criptomonedas', 'Comprar NFTs de granja'], correctIndex: 1, explanation: 'Yield farming es proveer liquidez a protocolos DeFi para ganar recompensas.' },
      { question: '¿Qué es el "slippage" en un DEX?', options: ['Error del sistema', 'Diferencia entre el precio esperado y el precio real de ejecución', 'Comisión del exchange', 'Tiempo de espera'], correctIndex: 1, explanation: 'El slippage ocurre cuando el precio cambia entre que colocas y se ejecuta tu orden.' },
      { question: '¿Qué respaldo tienen las stablecoins colateralizadas?', options: ['Ninguno', 'Algoritmos matemáticos', 'Activos reales (USD, crypto, etc.) en reserva', 'La promesa del emisor'], correctIndex: 2, explanation: 'Las stablecoins colateralizadas tienen activos reales como respaldo en una proporción 1:1 o mayor.' },
      { question: '¿Cuál es el riesgo principal de los préstamos flash (flash loans)?', options: ['Son muy lentos', 'Pueden usarse para manipular mercados en una sola transacción', 'Tienen intereses muy altos', 'Solo están disponibles para bancos'], correctIndex: 1, explanation: 'Los flash loans permiten manipular precios temporalmente dentro de una transacción.' },
      { question: '¿Qué significa "TVL" en DeFi?', options: ['Tiempo de Validación de Ledger', 'Total Value Locked — valor total bloqueado en un protocolo', 'Token Virtual de Liquidez', 'Transacciones Verificadas en el Libro'], correctIndex: 1, explanation: 'TVL mide cuánto capital total está depositado/bloqueado en un protocolo DeFi.' },
    ],
    5: [
      { question: '¿Qué hace que un NFT sea "no fungible"?', options: ['Que no se puede vender', 'Que cada token es único e irrepetible, sin equivalente exacto', 'Que no tiene valor', 'Que solo existe uno en el mundo'], correctIndex: 1, explanation: 'No fungible significa que no puede ser intercambiado 1:1 por otro token idéntico.' },
      { question: '¿Cómo verifica alguien la autenticidad de un NFT?', options: ['Contactando al artista', 'Revisando el contrato inteligente y la transacción en el explorador de bloques', 'Con un certificado físico', 'Por el precio de mercado'], correctIndex: 1, explanation: 'La autenticidad se verifica en el explorador de bloques, donde la transacción es pública e inmutable.' },
      { question: '¿Qué son las "royalties" en NFTs?', options: ['Impuestos del gobierno', 'Porcentaje que recibe el creador en cada reventa secundaria', 'Comisiones del marketplace', 'Precio inicial del NFT'], correctIndex: 1, explanation: 'Las royalties permiten a los creadores ganar automáticamente en cada reventa de su obra.' },
      { question: '¿Qué garantiza un certificado NFT de Tonalli?', options: ['Valor monetario fijo', 'Autenticidad verificable e inmutable del logro académico en blockchain', 'Trabajo garantizado', 'Acceso premium de por vida'], correctIndex: 1, explanation: 'El NFT certifica permanentemente y de forma verificable que completaste el capítulo con la calificación obtenida.' },
      { question: '¿Por qué Web3 es importante para artistas y creadores en México?', options: ['Por los precios en USD', 'Permite recibir pagos globales directos y royalties automáticas sin intermediarios', 'Solo para grandes marcas', 'Porque el gobierno lo exige'], correctIndex: 1, explanation: 'Web3 elimina intermediarios, permitiendo pagos directos y royalties automáticas a cualquier creador.' },
    ],
  };

  // Inline DeFi question pools for chapter 4 (defined inside the if block above, so we redefine here)
  const defiLessonPools: Array<Array<{ question: string; options: string[]; correctIndex: number; explanation: string }>> = [
    [
      { question: '¿Qué significa DeFi?', options: ['Digital Finance', 'Decentralized Finance / Finanzas Descentralizadas', 'Defined Finance', 'Deflation Finance'], correctIndex: 1, explanation: 'DeFi significa Finanzas Descentralizadas, servicios financieros sin intermediarios.' },
      { question: '¿Cuál es la principal diferencia entre DeFi y las finanzas tradicionales?', options: ['DeFi es más lento', 'DeFi no usa dinero real', 'DeFi elimina intermediarios como bancos usando smart contracts', 'DeFi solo funciona en EE.UU.'], correctIndex: 2, explanation: 'DeFi usa smart contracts para ofrecer servicios financieros sin bancos ni intermediarios.' },
      { question: '¿Qué es un DEX?', options: ['Un banco digital', 'Un exchange descentralizado donde los usuarios intercambian tokens directamente', 'Un tipo de wallet', 'Una criptomoneda'], correctIndex: 1, explanation: 'DEX (Decentralized Exchange) permite intercambiar tokens sin intermediarios, directamente entre usuarios.' },
      { question: '¿En qué blockchain nació DeFi?', options: ['Bitcoin', 'Stellar', 'Ethereum', 'Solana'], correctIndex: 2, explanation: 'Ethereum fue la primera blockchain en soportar los smart contracts que hacen posible DeFi.' },
      { question: '¿Qué hace un protocolo DeFi?', options: ['Guarda tus contraseñas', 'Define las reglas de un servicio financiero descentralizado en código', 'Conecta wallets físicas', 'Compra criptomonedas automáticamente'], correctIndex: 1, explanation: 'Un protocolo DeFi es un conjunto de smart contracts que definen las reglas de un servicio financiero.' },
    ],
    [
      { question: '¿Qué es una stablecoin?', options: ['Una moneda que solo sube', 'Una criptomoneda con valor estable, generalmente vinculada al dólar', 'Una wallet segura', 'El nombre de Stellar en México'], correctIndex: 1, explanation: 'Las stablecoins mantienen un valor estable, generalmente 1:1 con el dólar, como USDC o DAI.' },
      { question: '¿Qué es el "yield farming"?', options: ['Cultivar criptomonedas físicamente', 'Estrategia de obtener rendimientos prestando o aportando liquidez en DeFi', 'Un juego blockchain', 'Una forma de minería solar'], correctIndex: 1, explanation: 'Yield farming es aportar activos a protocolos DeFi a cambio de rendimientos o tokens de recompensa.' },
      { question: '¿Qué mide el TVL en DeFi?', options: ['Total de usuarios', 'Total Value Locked — valor total de activos depositados en un protocolo', 'Tiempo de transacción', 'Tokens vendidos en el año'], correctIndex: 1, explanation: 'TVL (Total Value Locked) indica cuánto valor está depositado en un protocolo DeFi.' },
      { question: '¿Qué es un "rug pull"?', options: ['Tipo de NFT', 'Cuando los creadores de un proyecto abandonan y se llevan los fondos', 'Error de transacción', 'Actualización de protocolo'], correctIndex: 1, explanation: 'Un rug pull es una estafa donde los desarrolladores retiran toda la liquidez y abandonan el proyecto.' },
      { question: '¿Para qué sirve AAVE?', options: ['Comprar NFTs', 'Prestar y pedir prestado criptomonedas sin banco intermediario', 'Crear wallets', 'Ver el precio del Bitcoin'], correctIndex: 1, explanation: 'AAVE es un protocolo DeFi que permite prestar y pedir prestado criptomonedas con tasas algorítmicas.' },
    ],
    [
      { question: '¿Qué problema resuelve DeFi para los trabajadores migrantes mexicanos?', options: ['Les da vacaciones pagadas', 'Reduce el costo y tiempo de las remesas internacionales', 'Les enseña inglés', 'Les da ciudadanía americana'], correctIndex: 1, explanation: 'DeFi permite enviar remesas en segundos por centavos, vs días y $25 USD de comisión bancaria.' },
      { question: '¿Por qué los argentinos usan stablecoins?', options: ['Por moda', 'Para proteger sus ahorros contra la inflación superior al 100% anual', 'Son obligatorios por ley', 'Son más coloridas que el peso'], correctIndex: 1, explanation: 'Con inflación récord, los argentinos usan USDC y DAI para proteger su poder adquisitivo.' },
      { question: '¿Qué es un oráculo en DeFi?', options: ['Un adivino del futuro de las cripto', 'Un servicio que lleva datos del mundo real a la blockchain', 'Un tipo de wallet fría', 'El nombre del consenso de Ethereum'], correctIndex: 1, explanation: 'Los oráculos conectan datos externos (precios, clima, resultados deportivos) con los smart contracts.' },
      { question: '¿Cómo puede DeFi ayudar a los 45 millones de mexicanos sin cuenta bancaria?', options: ['No puede ayudarles', 'Dándoles acceso a servicios financieros solo con smartphone y wallet', 'Construyendo más bancos', 'Creando efectivo digital'], correctIndex: 1, explanation: 'DeFi solo requiere un smartphone y una wallet para acceder a préstamos, ahorros y transferencias.' },
      { question: '¿Cuál es la ventaja de Stellar para DeFi en LATAM?', options: ['Es la más cara', 'Transacciones en 5 segundos por fracciones de centavo, ideal para remesas', 'Solo funciona en Estados Unidos', 'Requiere muchos XLM para operar'], correctIndex: 1, explanation: 'Stellar combina velocidad, bajas comisiones y stablecoins para DeFi accesible en Latinoamérica.' },
    ],
  ];

  const nftLessonPools: Array<Array<{ question: string; options: string[]; correctIndex: number; explanation: string }>> = [
    [
      { question: '¿Qué significa NFT?', options: ['New Financial Token', 'Non-Fungible Token (Token No Fungible)', 'Next Future Technology', 'National Finance Transfer'], correctIndex: 1, explanation: 'NFT significa Non-Fungible Token, un token único e irrepetible en la blockchain.' },
      { question: '¿Qué hace a un NFT "no fungible"?', options: ['Que no se puede vender', 'Que es único e irrepetible, no intercambiable por otro idéntico', 'Que no tiene valor', 'Que solo existe en papel'], correctIndex: 1, explanation: 'No fungible significa que cada NFT es único; no puedes intercambiarlo 1:1 por otro NFT idéntico.' },
      { question: '¿Para qué usa Tonalli los NFTs?', options: ['Para vender arte', 'Como certificados verificables de conocimiento en Stellar', 'Para hacer pagos', 'Como contraseñas'], correctIndex: 1, explanation: 'Tonalli emite NFTs en Stellar como certificados que prueban que completaste y aprobaste un capítulo.' },
      { question: '¿Dónde se almacenan los metadatos de un NFT?', options: ['En el celular del usuario', 'En IPFS o en la blockchain, de forma descentralizada', 'En los servidores de Facebook', 'En una USB'], correctIndex: 1, explanation: 'Los metadatos de NFTs generalmente se almacenan en IPFS (sistema de archivos descentralizado).' },
      { question: '¿Cuál fue uno de los primeros NFTs populares masivamente?', options: ['Bitcoin', 'Dogecoin', 'CryptoKitties', 'Ethereum'], correctIndex: 2, explanation: 'CryptoKitties (2017) fue uno de los primeros NFTs en popularizarse, llegando a congestionar Ethereum.' },
    ],
    [
      { question: '¿Qué ventaja dan los NFTs a los artistas sobre los royalties?', options: ['Ninguna ventaja', 'Reciben un porcentaje automático en cada reventa, programado en el smart contract', 'El comprador les paga manualmente', 'Solo el primer comprador paga'], correctIndex: 1, explanation: 'Los smart contracts pueden programar que el artista reciba royalties automáticamente en cada reventa.' },
      { question: '¿Qué es el "mint" (mintear) de un NFT?', options: ['Vender un NFT existente', 'Crear y registrar por primera vez un NFT en la blockchain', 'Copiar un NFT', 'Quemar un NFT'], correctIndex: 1, explanation: 'Mintear es el proceso de crear un NFT por primera vez y registrarlo en la blockchain.' },
      { question: '¿Qué representa un ticket de evento como NFT?', options: ['Solo un archivo JPG', 'Prueba verificable de entrada al evento, transferible e imposible de falsificar', 'Una criptomoneda', 'Un smart contract de seguro'], correctIndex: 1, explanation: 'Los tickets NFT son verificables, no falsificables y pueden transferirse en mercados secundarios.' },
      { question: '¿Por qué Stellar es una buena opción para NFTs en México?', options: ['Porque es la más cara', 'Por sus bajos costos, velocidad y huella de carbono casi cero', 'Porque solo funciona en México', 'Porque no tiene smart contracts'], correctIndex: 1, explanation: 'Stellar ofrece costos de fracción de centavo, confirmación en 5 segundos y es ecológica.' },
      { question: '¿Qué es un marketplace de NFTs?', options: ['Una tienda de ropa digital', 'Plataforma donde se compran, venden e intercambian NFTs', 'Un banco de criptomonedas', 'Un tipo de wallet'], correctIndex: 1, explanation: 'Un marketplace NFT es una plataforma de comercio (como OpenSea, Objkt o el DEX de Stellar).' },
    ],
    [
      { question: '¿Qué es una DAO?', options: ['Un banco digital', 'Organización Autónoma Descentralizada gobernada por votación en blockchain', 'Un tipo de NFT', 'Una wallet especial'], correctIndex: 1, explanation: 'Una DAO es una organización donde las decisiones se toman por votación de sus miembros en blockchain, sin directivos centrales.' },
      { question: '¿Qué es la identidad digital descentralizada (DID)?', options: ['Tu contraseña de Facebook', 'Una identidad digital que tú controlas, sin depender de empresas o gobiernos', 'Tu número de CURP digital', 'Un tipo de pasaporte físico'], correctIndex: 1, explanation: 'DID permite tener una identidad digital verificable que controlas tú, no Facebook ni Google.' },
      { question: '¿Cómo podría blockchain ayudar a combatir la corrupción en registros públicos?', options: ['No puede ayudar', 'Haciendo los registros inmutables, transparentes y verificables por cualquier ciudadano', 'Dando dinero a los funcionarios', 'Digitalizando los documentos en PDF'], correctIndex: 1, explanation: 'En una blockchain pública, todos pueden verificar registros de propiedades, contratos o diplomas, eliminando la manipulación.' },
      { question: '¿Qué es GameFi?', options: ['Un juego de cartas tradicional', 'La combinación de videojuegos y DeFi donde puedes ganar criptomonedas jugando', 'Una consola de videojuegos', 'Un tipo de NFT de imagen'], correctIndex: 1, explanation: 'GameFi (Game + Finance) son videojuegos blockchain donde los jugadores ganan tokens reales.' },
      { question: '¿Cuál es la misión de Tonalli para México?', options: ['Vender criptomonedas', 'Preparar a los mexicanos para Web3 con educación certificada en blockchain', 'Crear un banco digital', 'Desarrollar una red social'], correctIndex: 1, explanation: 'Tonalli certifica conocimientos Web3 con NFTs reales en Stellar, preparando a México para la economía digital.' },
    ],
  ];

  const chapters = await chapterRepo.find({ order: { order: 'ASC' } });

  for (const ch of chapters) {
    const lessonMods = await chapterModuleRepo.find({
      where: { chapterId: ch.id, type: 'lesson' },
      order: { order: 'ASC' },
    });
    const examMod = await chapterModuleRepo.findOne({
      where: { chapterId: ch.id, type: 'final_exam' },
    });

    // Determine the question pools for this chapter
    let chapterLessonPools: Array<Array<{ question: string; options: string[]; correctIndex: number; explanation: string }>> | null = null;

    if (ch.order === 1) {
      chapterLessonPools = [bq1, bq2, bq3];
    } else if (ch.order === 2) {
      chapterLessonPools = [sq1, sq2, sq3];
    } else if (ch.order === 3) {
      chapterLessonPools = [wq1, wq2, wq3];
    } else if (ch.order === 4) {
      chapterLessonPools = defiLessonPools;
    } else if (ch.order === 5) {
      chapterLessonPools = nftLessonPools;
    }

    if (!chapterLessonPools) {
      console.log(`  ⚠️  No question pools defined for chapter order ${ch.order} (${ch.title}), skipping.`);
      continue;
    }

    // Ensure lesson module questions
    for (let i = 0; i < lessonMods.length && i < chapterLessonPools.length; i++) {
      const mod = lessonMods[i];
      const pool = chapterLessonPools[i];
      const count = await questionRepo.count({ where: { moduleId: mod.id } });
      if (count === 0) {
        for (const [idx, q] of pool.entries()) {
          await questionRepo.save(questionRepo.create({
            moduleId: mod.id,
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
            order: idx,
          }));
        }
        console.log(`  ✅ Ch${ch.order} Mod${i + 1}: inserted ${pool.length} questions`);
      } else {
        console.log(`  ✅ Ch${ch.order} Mod${i + 1}: already has ${count} questions`);
      }
    }

    // Ensure final exam extra questions
    if (examMod) {
      // Update questionsPerAttempt to 20 if it's still 10
      if (examMod.questionsPerAttempt !== 20) {
        examMod.questionsPerAttempt = 20;
        await chapterModuleRepo.save(examMod);
        console.log(`  ✅ Ch${ch.order} FinalExam: updated questionsPerAttempt to 20`);
      }

      const extraPool = extraFinalExamQuestions[ch.order];
      if (extraPool) {
        const count = await questionRepo.count({ where: { moduleId: examMod.id } });
        if (count === 0) {
          for (const [idx, q] of extraPool.entries()) {
            await questionRepo.save(questionRepo.create({
              moduleId: examMod.id,
              question: q.question,
              options: q.options,
              correctIndex: q.correctIndex,
              explanation: q.explanation,
              order: idx,
            }));
          }
          console.log(`  ✅ Ch${ch.order} FinalExam: inserted ${extraPool.length} extra questions`);
        } else {
          console.log(`  ✅ Ch${ch.order} FinalExam: already has ${count} extra questions`);
        }
      }
    }
  }

  console.log('\n🎉 Seed completed successfully!');
  console.log('');
  console.log('👤 USUARIOS:');
  console.log('   Admin   → admin@tonalli.mx   / Admin2024!   (role: admin, premium)');
  console.log('   Free    → demo@tonalli.mx    / Demo2024!    (role: user, free)');
  console.log('   Premium → premium@tonalli.mx / Premium2024! (role: user, premium)');
  console.log('');
  console.log('📚 5 Capítulos con 4 módulos cada uno:');
  console.log('   Cap 1: Introducción al Blockchain');
  console.log('   Cap 2: Stellar Network');
  console.log('   Cap 3: Wallets y Seguridad');
  console.log('   Cap 4: DeFi: Finanzas Descentralizadas');
  console.log('   Cap 5: NFTs y Web3 en México');
  console.log('');
  console.log('🎯 Cada capítulo: Info → Video → Quiz (5 preguntas) → Examen Final (20 preguntas = 15 lección + 5 extra)');
  console.log('❤️ Free: 3 vidas, 24h espera | Premium: ilimitadas');
  console.log('🔀 Preguntas y opciones se mezclan en cada intento');

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
