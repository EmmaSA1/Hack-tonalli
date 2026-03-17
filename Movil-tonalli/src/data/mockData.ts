export const MODULES = [
  {
    id: "m1",
    title: "Blockchain Fundamentals",
    emoji: "⛓️",
    description: "Learn the basics of blockchain technology",
    totalLessons: 5,
    completedLessons: 3,
    xpReward: 500,
    locked: false,
    color: "#FF6B35",
  },
  {
    id: "m2",
    title: "Stellar Network",
    emoji: "⭐",
    description: "Deep dive into the Stellar ecosystem",
    totalLessons: 6,
    completedLessons: 1,
    xpReward: 600,
    locked: false,
    color: "#FFD700",
  },
  {
    id: "m3",
    title: "DeFi & Smart Contracts",
    emoji: "📜",
    description: "Decentralized finance concepts",
    totalLessons: 8,
    completedLessons: 0,
    xpReward: 800,
    locked: true,
    color: "#00C896",
  },
  {
    id: "m4",
    title: "NFTs & Digital Assets",
    emoji: "🎨",
    description: "Understanding digital ownership",
    totalLessons: 5,
    completedLessons: 0,
    xpReward: 500,
    locked: true,
    color: "#9B59B6",
  },
];

export const LESSONS: Record<string, any[]> = {
  m1: [
    {
      id: "l1",
      moduleId: "m1",
      title: "What is Blockchain?",
      emoji: "🔗",
      xpReward: 100,
      duration: "5 min",
      completed: true,
      locked: false,
      content: [
        {
          type: "text",
          text: "A blockchain is a distributed, decentralized ledger that records transactions across many computers. Think of it as a shared Google Doc that no single person controls.",
        },
        {
          type: "highlight",
          text: "Key Insight: Once data is recorded on a blockchain, it's nearly impossible to change or delete.",
        },
        {
          type: "text",
          text: "Each 'block' contains a set of transactions. When a block is full, it gets chained to the previous block — hence the name 'blockchain'.",
        },
        {
          type: "bullets",
          items: [
            "Decentralized — no single owner",
            "Transparent — anyone can verify",
            "Immutable — data cannot be altered",
            "Secure — cryptographically protected",
          ],
        },
      ],
    },
    {
      id: "l2",
      moduleId: "m1",
      title: "How Transactions Work",
      emoji: "💸",
      xpReward: 100,
      duration: "6 min",
      completed: true,
      locked: false,
      content: [
        {
          type: "text",
          text: "A blockchain transaction is a record of value transfer between two parties. Before it's added to the blockchain, it must be validated by the network.",
        },
        {
          type: "highlight",
          text: "Every transaction is signed with a private key — your digital signature that proves you authorized it.",
        },
        {
          type: "text",
          text: "Validators (or miners in some networks) check the transaction is valid and add it to the next block.",
        },
      ],
    },
    {
      id: "l3",
      moduleId: "m1",
      title: "Consensus Mechanisms",
      emoji: "🤝",
      xpReward: 100,
      duration: "7 min",
      completed: true,
      locked: false,
      content: [
        {
          type: "text",
          text: "A consensus mechanism is the method by which nodes on a blockchain network agree on the current state of the ledger.",
        },
        {
          type: "bullets",
          items: [
            "Proof of Work (PoW) — used by Bitcoin, energy intensive",
            "Proof of Stake (PoS) — validators stake tokens",
            "Stellar Consensus Protocol (SCP) — fast, low-energy",
          ],
        },
      ],
    },
    {
      id: "l4",
      moduleId: "m1",
      title: "Public & Private Keys",
      emoji: "🔑",
      xpReward: 100,
      duration: "5 min",
      completed: false,
      locked: false,
      content: [
        {
          type: "text",
          text: "Cryptographic key pairs are the foundation of blockchain identity. Your public key is your address, visible to everyone. Your private key is your password — never share it.",
        },
        {
          type: "highlight",
          text: "Warning: If you lose your private key, you lose access to your assets forever. No password reset exists.",
        },
      ],
    },
    {
      id: "l5",
      moduleId: "m1",
      title: "Wallets Explained",
      emoji: "👛",
      xpReward: 100,
      duration: "5 min",
      completed: false,
      locked: false,
      content: [
        {
          type: "text",
          text: "A crypto wallet doesn't actually store your crypto — it stores your private keys. The assets live on the blockchain.",
        },
        {
          type: "bullets",
          items: [
            "Hot wallets — connected to internet, convenient",
            "Cold wallets — offline, maximum security",
            "Custodial — third party holds keys",
            "Non-custodial — you hold your own keys",
          ],
        },
      ],
    },
  ],
  m2: [
    {
      id: "l6",
      moduleId: "m2",
      title: "Stellar Overview",
      emoji: "⭐",
      xpReward: 100,
      duration: "6 min",
      completed: true,
      locked: false,
      content: [
        {
          type: "text",
          text: "Stellar is an open-source, decentralized blockchain network focused on enabling fast, low-cost cross-border payments and financial inclusion.",
        },
        {
          type: "highlight",
          text: "Stellar processes transactions in 3-5 seconds with fees of just 0.00001 XLM (fractions of a cent).",
        },
        {
          type: "text",
          text: "Founded in 2014 by Jed McCaleb and Joyce Kim, Stellar's mission is to provide universal access to the global financial system.",
        },
      ],
    },
    {
      id: "l7",
      moduleId: "m2",
      title: "XLM — The Native Token",
      emoji: "💫",
      xpReward: 100,
      duration: "5 min",
      completed: false,
      locked: false,
      content: [
        {
          type: "text",
          text: "Lumens (XLM) is the native digital currency of the Stellar network. It serves as a bridge currency for cross-asset transactions and pays network fees.",
        },
        {
          type: "bullets",
          items: [
            "Minimum balance: 1 XLM to open an account",
            "Transaction fee: 0.00001 XLM",
            "Total supply: 50 billion XLM",
            "No mining — all XLM was created at genesis",
          ],
        },
      ],
    },
  ],
};

export const QUIZZES: Record<string, any> = {
  l1: {
    lessonId: "l1",
    questions: [
      {
        id: "q1",
        question: "¿Qué es una blockchain?",
        options: [
          "Una base de datos centralizada de una empresa",
          "Un libro contable distribuido que registra transacciones en muchas computadoras",
          "Un tipo de criptomoneda",
          "Un sistema financiero gubernamental",
        ],
        correctIndex: 1,
        explanation:
          "Una blockchain es un libro contable distribuido y descentralizado que registra transacciones en muchas computadoras sin un solo propietario.",
      },
      {
        id: "q2",
        question: "¿Qué sucede con los datos una vez registrados en una blockchain?",
        options: [
          "Pueden ser editados fácilmente por admins",
          "Expiran después de 30 días",
          "Es casi imposible cambiarlos o eliminarlos",
          "Se eliminan automáticamente después de 1 año",
        ],
        correctIndex: 2,
        explanation:
          "Los datos en blockchain son inmutables — una vez registrados, están criptográficamente asegurados y es casi imposible alterarlos.",
      },
      {
        id: "q3",
        question: "¿Qué contiene cada 'bloque' en una blockchain?",
        options: [
          "Un solo archivo grande",
          "Contraseñas de usuarios",
          "Un conjunto de transacciones",
          "Cookies del navegador",
        ],
        correctIndex: 2,
        explanation:
          "Cada bloque contiene un conjunto de transacciones validadas. Cuando está lleno, se encadena al bloque anterior.",
      },
      {
        id: "q4",
        question: "¿Cuál NO es una característica de blockchain?",
        options: ["Descentralizada", "Transparente", "Propiedad de bancos", "Segura"],
        correctIndex: 2,
        explanation:
          "Blockchain NO es propiedad de bancos — es descentralizada, sin un solo propietario, haciéndola abierta y sin necesidad de confianza.",
      },
    ],
  },
  l2: {
    lessonId: "l2",
    questions: [
      {
        id: "q2_1",
        question: "¿Qué se necesita para autorizar una transacción en blockchain?",
        options: [
          "Una contraseña de correo",
          "Una firma con llave privada",
          "Aprobación de un banco",
          "Un código SMS",
        ],
        correctIndex: 1,
        explanation:
          "Cada transacción se firma con una llave privada — tu firma digital que prueba que tú la autorizaste.",
      },
      {
        id: "q2_2",
        question: "¿Quién valida las transacciones antes de añadirlas a un bloque?",
        options: [
          "Los bancos centrales",
          "Los validadores o mineros de la red",
          "El gobierno",
          "El usuario que envía",
        ],
        correctIndex: 1,
        explanation:
          "Los validadores (o mineros en algunas redes) verifican que la transacción sea válida y la añaden al siguiente bloque.",
      },
      {
        id: "q2_3",
        question: "¿Qué es una transacción en blockchain?",
        options: [
          "Un mensaje de texto",
          "Un registro de transferencia de valor entre dos partes",
          "Una actualización de software",
          "Un archivo compartido",
        ],
        correctIndex: 1,
        explanation:
          "Una transacción blockchain es un registro de transferencia de valor entre dos partes que debe ser validado por la red.",
      },
    ],
  },
  l3: {
    lessonId: "l3",
    questions: [
      {
        id: "q3_1",
        question: "¿Qué es un mecanismo de consenso?",
        options: [
          "Un tipo de criptomoneda",
          "El método por el cual los nodos acuerdan el estado del libro contable",
          "Un contrato legal",
          "Una base de datos centralizada",
        ],
        correctIndex: 1,
        explanation:
          "Un mecanismo de consenso es el método por el cual los nodos de la red acuerdan sobre el estado actual del libro contable.",
      },
      {
        id: "q3_2",
        question: "¿Cuál mecanismo de consenso usa Bitcoin?",
        options: [
          "Proof of Stake (PoS)",
          "Stellar Consensus Protocol (SCP)",
          "Proof of Work (PoW)",
          "Delegated Proof of Stake",
        ],
        correctIndex: 2,
        explanation:
          "Bitcoin usa Proof of Work (PoW), que es intensivo en energía pero fue el primer mecanismo de consenso exitoso.",
      },
      {
        id: "q3_3",
        question: "¿Qué ventaja tiene el Stellar Consensus Protocol?",
        options: [
          "Consume mucha energía",
          "Es rápido y de bajo consumo energético",
          "Solo funciona con Bitcoin",
          "Requiere hardware especializado",
        ],
        correctIndex: 1,
        explanation:
          "El Stellar Consensus Protocol (SCP) es rápido y de bajo consumo energético, a diferencia de PoW.",
      },
    ],
  },
  l4: {
    lessonId: "l4",
    questions: [
      {
        id: "q4_1",
        question: "¿Cuál es la función de la llave pública?",
        options: [
          "Firmar transacciones en secreto",
          "Servir como tu dirección visible para todos",
          "Desbloquear tu teléfono",
          "Acceder a tu correo electrónico",
        ],
        correctIndex: 1,
        explanation:
          "Tu llave pública es tu dirección, visible para todos. Es como tu número de cuenta bancaria.",
      },
      {
        id: "q4_2",
        question: "¿Qué pasa si pierdes tu llave privada?",
        options: [
          "Puedes resetearla con tu email",
          "El banco te da una nueva",
          "Pierdes acceso a tus activos para siempre",
          "Se genera automáticamente otra",
        ],
        correctIndex: 2,
        explanation:
          "Si pierdes tu llave privada, pierdes acceso a tus activos para siempre. No existe opción de reseteo de contraseña.",
      },
      {
        id: "q4_3",
        question: "¿Qué NUNCA debes hacer con tu llave privada?",
        options: [
          "Guardarla en un lugar seguro",
          "Compartirla con alguien",
          "Hacer un respaldo",
          "Memorizarla",
        ],
        correctIndex: 1,
        explanation:
          "Tu llave privada es tu contraseña — NUNCA la compartas con nadie. Quien la tenga, controla tus activos.",
      },
    ],
  },
  l5: {
    lessonId: "l5",
    questions: [
      {
        id: "q5_1",
        question: "¿Qué almacena realmente una wallet crypto?",
        options: [
          "Tus criptomonedas directamente",
          "Tus llaves privadas",
          "Archivos del blockchain",
          "Tu historial de navegación",
        ],
        correctIndex: 1,
        explanation:
          "Una wallet no almacena tus cripto — almacena tus llaves privadas. Los activos viven en la blockchain.",
      },
      {
        id: "q5_2",
        question: "¿Cuál es la diferencia entre hot wallet y cold wallet?",
        options: [
          "El color del diseño",
          "Hot está conectada a internet, cold está offline",
          "Hot es gratis, cold es de pago",
          "No hay diferencia",
        ],
        correctIndex: 1,
        explanation:
          "Hot wallets están conectadas a internet (convenientes), cold wallets están offline (máxima seguridad).",
      },
      {
        id: "q5_3",
        question: "En una wallet non-custodial, ¿quién controla las llaves?",
        options: [
          "La empresa que creó la wallet",
          "El gobierno",
          "Tú mismo",
          "Los mineros",
        ],
        correctIndex: 2,
        explanation:
          "En una wallet non-custodial tú controlas tus propias llaves. En una custodial, un tercero las controla por ti.",
      },
    ],
  },
  l6: {
    lessonId: "l6",
    questions: [
      {
        id: "q6_1",
        question: "¿Qué tan rápido procesa transacciones Stellar?",
        options: ["10 minutos", "1 hora", "3-5 segundos", "24 horas"],
        correctIndex: 2,
        explanation:
          "Stellar es extremadamente rápido, procesando transacciones en solo 3-5 segundos.",
      },
      {
        id: "q6_2",
        question: "¿Cuál es el enfoque principal de Stellar?",
        options: [
          "NFTs para gaming",
          "Pagos transfronterizos rápidos y de bajo costo",
          "Redes sociales descentralizadas",
          "Almacenamiento en la nube",
        ],
        correctIndex: 1,
        explanation:
          "Stellar se enfoca en permitir pagos transfronterizos rápidos, de bajo costo, y la inclusión financiera.",
      },
      {
        id: "q6_3",
        question: "¿En qué año se fundó Stellar?",
        options: ["2009", "2012", "2014", "2020"],
        correctIndex: 2,
        explanation:
          "Stellar fue fundada en 2014 por Jed McCaleb y Joyce Kim.",
      },
    ],
  },
  l7: {
    lessonId: "l7",
    questions: [
      {
        id: "q7_1",
        question: "¿Cuál es el balance mínimo para abrir una cuenta Stellar?",
        options: ["0 XLM", "0.5 XLM", "1 XLM", "10 XLM"],
        correctIndex: 2,
        explanation:
          "Se necesita un mínimo de 1 XLM para abrir una cuenta en la red Stellar.",
      },
      {
        id: "q7_2",
        question: "¿Cuánto cuesta una transacción en Stellar?",
        options: ["1 XLM", "0.01 XLM", "0.00001 XLM", "Es gratis"],
        correctIndex: 2,
        explanation:
          "Las transacciones en Stellar cuestan solo 0.00001 XLM, una fracción de centavo.",
      },
      {
        id: "q7_3",
        question: "¿Cómo se crearon los Lumens (XLM)?",
        options: [
          "Se minan como Bitcoin",
          "Se crearon todos al inicio (génesis)",
          "Se generan diariamente",
          "Los crean los usuarios",
        ],
        correctIndex: 1,
        explanation:
          "No hay minería — todos los 50 billones de XLM fueron creados al inicio (génesis) de la red.",
      },
    ],
  },
};

export const CERTIFICATES = [
  {
    id: "cert1",
    title: "Blockchain Pioneer",
    emoji: "🏆",
    description: "Completed all Blockchain Fundamentals lessons",
    dateEarned: "2024-01-15",
    xpAwarded: 500,
    xlmAwarded: 5,
    moduleId: "m1",
    nftHash: "GBXXX...1234",
    color: "#FF6B35",
    rarity: "Rare",
  },
  {
    id: "cert2",
    title: "Stellar Explorer",
    emoji: "⭐",
    description: "First lesson on the Stellar Network",
    dateEarned: "2024-01-20",
    xpAwarded: 100,
    xlmAwarded: 1,
    moduleId: "m2",
    nftHash: "GBYYY...5678",
    color: "#FFD700",
    rarity: "Common",
  },
];

export const LEADERBOARD = [
  { rank: 1, name: "María González", xp: 12500, streak: 45, avatar: "👩‍🎓", badge: "🏆" },
  { rank: 2, name: "Carlos Ruiz", xp: 11200, streak: 38, avatar: "👨‍💻", badge: "🥈" },
  { rank: 3, name: "Ana López", xp: 10800, streak: 32, avatar: "👩‍🚀", badge: "🥉" },
  { rank: 4, name: "Diego Martín", xp: 9500, streak: 28, avatar: "🧑‍🎨", badge: "" },
  { rank: 5, name: "Sofía Herrera", xp: 8900, streak: 25, avatar: "👩‍🔬", badge: "" },
  { rank: 6, name: "Luis Torres", xp: 7800, streak: 20, avatar: "🧑‍💼", badge: "" },
  { rank: 7, name: "Valentina Cruz", xp: 6700, streak: 15, avatar: "👩‍🎤", badge: "" },
  { rank: 8, name: "Tú", xp: 3400, streak: 7, avatar: "😎", badge: "", isCurrentUser: true },
  { rank: 9, name: "Pablo Jiménez", xp: 3100, streak: 5, avatar: "🧑‍🍳", badge: "" },
  { rank: 10, name: "Isabella Moreno", xp: 2800, streak: 4, avatar: "👩‍🏫", badge: "" },
];
