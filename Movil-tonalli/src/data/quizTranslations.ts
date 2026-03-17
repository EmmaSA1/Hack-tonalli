import { Lang } from "../i18n/translations";

type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

type Quiz = {
  lessonId: string;
  questions: QuizQuestion[];
};

const QUIZZES_EN: Record<string, Quiz> = {
  l1: {
    lessonId: "l1",
    questions: [
      {
        id: "q1",
        question: "What is a blockchain?",
        options: [
          "A centralized company database",
          "A distributed ledger that records transactions across many computers",
          "A type of cryptocurrency",
          "A governmental financial system",
        ],
        correctIndex: 1,
        explanation: "A blockchain is a distributed, decentralized ledger that records transactions across many computers without a single owner.",
      },
      {
        id: "q2",
        question: "What happens to data once it's recorded on a blockchain?",
        options: [
          "It can be easily edited by admins",
          "It expires after 30 days",
          "It's nearly impossible to change or delete",
          "It's automatically deleted after 1 year",
        ],
        correctIndex: 2,
        explanation: "Data on blockchain is immutable — once recorded, it's cryptographically secured and nearly impossible to alter.",
      },
      {
        id: "q3",
        question: "What does each 'block' in a blockchain contain?",
        options: [
          "A single large file",
          "User passwords",
          "A set of transactions",
          "Browser cookies",
        ],
        correctIndex: 2,
        explanation: "Each block contains a set of validated transactions. When full, it gets chained to the previous block.",
      },
      {
        id: "q4",
        question: "Which is NOT a characteristic of blockchain?",
        options: ["Decentralized", "Transparent", "Owned by banks", "Secure"],
        correctIndex: 2,
        explanation: "Blockchain is NOT owned by banks — it's decentralized, with no single owner, making it open and trustless.",
      },
    ],
  },
  l2: {
    lessonId: "l2",
    questions: [
      {
        id: "q2_1",
        question: "What is needed to authorize a blockchain transaction?",
        options: ["An email password", "A private key signature", "Bank approval", "An SMS code"],
        correctIndex: 1,
        explanation: "Each transaction is signed with a private key — your digital signature proving you authorized it.",
      },
      {
        id: "q2_2",
        question: "Who validates transactions before adding them to a block?",
        options: ["Central banks", "Network validators or miners", "The government", "The sending user"],
        correctIndex: 1,
        explanation: "Validators (or miners in some networks) verify transactions are valid and add them to the next block.",
      },
      {
        id: "q2_3",
        question: "What is a blockchain transaction?",
        options: ["A text message", "A record of value transfer between two parties", "A software update", "A shared file"],
        correctIndex: 1,
        explanation: "A blockchain transaction is a record of value transfer between two parties that must be validated by the network.",
      },
    ],
  },
  l3: {
    lessonId: "l3",
    questions: [
      {
        id: "q3_1",
        question: "What is a consensus mechanism?",
        options: ["A type of cryptocurrency", "The method by which nodes agree on the ledger state", "A legal contract", "A centralized database"],
        correctIndex: 1,
        explanation: "A consensus mechanism is the method by which network nodes agree on the current state of the ledger.",
      },
      {
        id: "q3_2",
        question: "Which consensus mechanism does Bitcoin use?",
        options: ["Proof of Stake (PoS)", "Stellar Consensus Protocol (SCP)", "Proof of Work (PoW)", "Delegated Proof of Stake"],
        correctIndex: 2,
        explanation: "Bitcoin uses Proof of Work (PoW), which is energy-intensive but was the first successful consensus mechanism.",
      },
      {
        id: "q3_3",
        question: "What advantage does the Stellar Consensus Protocol have?",
        options: ["It consumes a lot of energy", "It's fast and low-energy", "It only works with Bitcoin", "It requires specialized hardware"],
        correctIndex: 1,
        explanation: "The Stellar Consensus Protocol (SCP) is fast and low-energy, unlike PoW.",
      },
    ],
  },
  l4: {
    lessonId: "l4",
    questions: [
      {
        id: "q4_1",
        question: "What is the function of a public key?",
        options: ["Sign transactions secretly", "Serve as your address visible to everyone", "Unlock your phone", "Access your email"],
        correctIndex: 1,
        explanation: "Your public key is your address, visible to everyone. It's like your bank account number.",
      },
      {
        id: "q4_2",
        question: "What happens if you lose your private key?",
        options: ["You can reset it with your email", "The bank gives you a new one", "You lose access to your assets forever", "Another one is automatically generated"],
        correctIndex: 2,
        explanation: "If you lose your private key, you lose access to your assets forever. There is no password reset option.",
      },
      {
        id: "q4_3",
        question: "What should you NEVER do with your private key?",
        options: ["Keep it in a safe place", "Share it with someone", "Make a backup", "Memorize it"],
        correctIndex: 1,
        explanation: "Your private key is your password — NEVER share it with anyone. Whoever has it controls your assets.",
      },
    ],
  },
  l5: {
    lessonId: "l5",
    questions: [
      {
        id: "q5_1",
        question: "What does a crypto wallet actually store?",
        options: ["Your cryptocurrencies directly", "Your private keys", "Blockchain files", "Your browsing history"],
        correctIndex: 1,
        explanation: "A wallet doesn't store your crypto — it stores your private keys. The assets live on the blockchain.",
      },
      {
        id: "q5_2",
        question: "What's the difference between a hot wallet and cold wallet?",
        options: ["The design color", "Hot is connected to internet, cold is offline", "Hot is free, cold is paid", "There's no difference"],
        correctIndex: 1,
        explanation: "Hot wallets are connected to the internet (convenient), cold wallets are offline (maximum security).",
      },
      {
        id: "q5_3",
        question: "In a non-custodial wallet, who controls the keys?",
        options: ["The company that created the wallet", "The government", "You", "The miners"],
        correctIndex: 2,
        explanation: "In a non-custodial wallet, you control your own keys. In a custodial one, a third party controls them for you.",
      },
    ],
  },
  l6: {
    lessonId: "l6",
    questions: [
      {
        id: "q6_1",
        question: "How fast does Stellar process transactions?",
        options: ["10 minutes", "1 hour", "3-5 seconds", "24 hours"],
        correctIndex: 2,
        explanation: "Stellar is extremely fast, processing transactions in just 3-5 seconds.",
      },
      {
        id: "q6_2",
        question: "What is Stellar's main focus?",
        options: ["NFTs for gaming", "Fast, low-cost cross-border payments", "Decentralized social networks", "Cloud storage"],
        correctIndex: 1,
        explanation: "Stellar focuses on enabling fast, low-cost cross-border payments and financial inclusion.",
      },
      {
        id: "q6_3",
        question: "What year was Stellar founded?",
        options: ["2009", "2012", "2014", "2020"],
        correctIndex: 2,
        explanation: "Stellar was founded in 2014 by Jed McCaleb and Joyce Kim.",
      },
    ],
  },
  l7: {
    lessonId: "l7",
    questions: [
      {
        id: "q7_1",
        question: "What's the minimum balance to open a Stellar account?",
        options: ["0 XLM", "0.5 XLM", "1 XLM", "10 XLM"],
        correctIndex: 2,
        explanation: "A minimum of 1 XLM is needed to open an account on the Stellar network.",
      },
      {
        id: "q7_2",
        question: "How much does a Stellar transaction cost?",
        options: ["1 XLM", "0.01 XLM", "0.00001 XLM", "It's free"],
        correctIndex: 2,
        explanation: "Stellar transactions cost only 0.00001 XLM, a fraction of a cent.",
      },
      {
        id: "q7_3",
        question: "How were Lumens (XLM) created?",
        options: ["They're mined like Bitcoin", "They were all created at genesis", "They're generated daily", "Users create them"],
        correctIndex: 1,
        explanation: "There's no mining — all 50 billion XLM were created at the genesis of the network.",
      },
    ],
  },
  l8: {
    lessonId: "l8",
    questions: [
      {
        id: "q8_1",
        question: "What does DeFi stand for?",
        options: ["Digital Finance", "Decentralized Finance", "Financial Definition", "International Deflation"],
        correctIndex: 1,
        explanation: "DeFi stands for Decentralized Finance — an ecosystem of financial applications on blockchain without intermediaries.",
      },
      {
        id: "q8_2",
        question: "What replaces banks in DeFi?",
        options: ["Governments", "Code (smart contracts)", "Fintech companies", "Artificial intelligence"],
        correctIndex: 1,
        explanation: "In DeFi, code (smart contracts) replaces traditional intermediaries like banks and brokers.",
      },
      {
        id: "q8_3",
        question: "What do you need to access DeFi?",
        options: ["A bank account and passport", "Just internet and a wallet", "To be a programmer", "Minimum investment of $1000"],
        correctIndex: 1,
        explanation: "DeFi is accessible to everyone — you just need an internet connection and a crypto wallet.",
      },
      {
        id: "q8_4",
        question: "What does it mean that DeFi is 'composable'?",
        options: ["It can break easily", "Protocols connect like LEGO pieces", "It only works on one blockchain", "It's temporary"],
        correctIndex: 1,
        explanation: "Composability means DeFi protocols can connect to each other like LEGO pieces, creating more complex financial services.",
      },
    ],
  },
  l9: {
    lessonId: "l9",
    questions: [
      {
        id: "q9_1",
        question: "What is a smart contract?",
        options: ["A digitally signed legal contract", "A program that auto-executes on blockchain when conditions are met", "An agreement between tech companies", "A mobile app for contracts"],
        correctIndex: 1,
        explanation: "A smart contract is a self-executing program on blockchain that activates when predefined conditions are met.",
      },
      {
        id: "q9_2",
        question: "What is Stellar's smart contract platform called?",
        options: ["Ethereum", "Solana", "Soroban", "Polkadot"],
        correctIndex: 2,
        explanation: "Soroban is Stellar's smart contract platform, designed for security and scalability.",
      },
      {
        id: "q9_3",
        question: "Which characteristic do smart contracts NOT have?",
        options: ["They're self-executing", "They're immutable", "They can be modified after deployment", "They're deterministic"],
        correctIndex: 2,
        explanation: "Smart contracts are immutable — once deployed they CANNOT be modified, making it crucial to audit them before deployment.",
      },
    ],
  },
  l10: {
    lessonId: "l10",
    questions: [
      {
        id: "q10_1",
        question: "What is a liquidity pool?",
        options: ["A swimming pool for traders", "A fund of tokens in a smart contract that facilitates trading", "A shared bank account", "A type of cryptocurrency"],
        correctIndex: 1,
        explanation: "A liquidity pool is a fund of tokens locked in a smart contract that facilitates decentralized trading.",
      },
      {
        id: "q10_2",
        question: "What is an AMM?",
        options: ["Application Mobile Manager", "Automated Market Maker — uses formulas to calculate prices", "Automated Money Machine", "Advanced Mining Method"],
        correctIndex: 1,
        explanation: "An AMM (Automated Market Maker) uses mathematical formulas to determine prices automatically instead of an order book.",
      },
      {
        id: "q10_3",
        question: "What is impermanent loss?",
        options: ["Losing your wallet", "A temporary loss when prices change while providing liquidity", "A protocol hack", "A tax on profits"],
        correctIndex: 1,
        explanation: "Impermanent loss is a temporary loss that occurs when token prices change significantly while you provide liquidity.",
      },
    ],
  },
  l11: {
    lessonId: "l11",
    questions: [
      {
        id: "q11_1",
        question: "What are over-collateralized loans?",
        options: ["Loans without guarantee", "Loans where you deposit more value than you borrow", "Loans with zero interest rates", "Loans only for companies"],
        correctIndex: 1,
        explanation: "In DeFi, loans are over-collateralized: you must deposit more value than you borrow to protect the protocol.",
      },
      {
        id: "q11_2",
        question: "What is a flash loan?",
        options: ["A very high interest loan", "A long-term loan", "An instant loan without collateral that must be repaid in the same transaction", "A government loan"],
        correctIndex: 2,
        explanation: "Flash loans are instant loans without collateral that must be repaid in the same blockchain transaction.",
      },
      {
        id: "q11_3",
        question: "What determines interest rates in DeFi?",
        options: ["The central bank", "User supply and demand", "The government", "They're fixed and never change"],
        correctIndex: 1,
        explanation: "In DeFi, interest rates are dynamic and adjust automatically based on user supply and demand.",
      },
    ],
  },
  l12: {
    lessonId: "l12",
    questions: [
      {
        id: "q12_1",
        question: "What is a stablecoin?",
        options: ["A crypto that always goes up", "A crypto designed to maintain a stable value", "A physical digital coin", "A type of NFT"],
        correctIndex: 1,
        explanation: "Stablecoins are cryptocurrencies designed to maintain a stable value, usually pegged to the dollar.",
      },
      {
        id: "q12_2",
        question: "Which stablecoin is natively available on Stellar?",
        options: ["DAI", "USDT", "USDC", "BUSD"],
        correctIndex: 2,
        explanation: "USDC is natively available on Stellar, maintaining a 1:1 parity with the US dollar.",
      },
      {
        id: "q12_3",
        question: "How does DAI maintain its stability?",
        options: ["Backed by dollars in a bank", "Backed by other cryptocurrencies as collateral", "The government guarantees its value", "It's not stable"],
        correctIndex: 1,
        explanation: "DAI is a crypto-collateralized stablecoin — backed by other cryptocurrencies deposited as collateral in smart contracts.",
      },
    ],
  },
  l13: {
    lessonId: "l13",
    questions: [
      {
        id: "q13_1",
        question: "What is yield farming?",
        options: ["Growing cryptocurrencies on a farm", "Moving crypto between protocols to maximize returns", "Mining Bitcoin", "Buying and selling NFTs"],
        correctIndex: 1,
        explanation: "Yield farming is moving your crypto between different DeFi protocols to get the best possible returns.",
      },
      {
        id: "q13_2",
        question: "What's the difference between APY and APR?",
        options: ["They're the same", "APY includes compound interest, APR doesn't", "APR is always higher than APY", "APY is for crypto and APR is for fiat"],
        correctIndex: 1,
        explanation: "APY (Annual Percentage Yield) includes compound interest, while APR (Annual Percentage Rate) doesn't.",
      },
      {
        id: "q13_3",
        question: "What is staking?",
        options: ["Selling your cryptocurrencies", "Locking tokens to help secure the network and earn rewards", "Taking out a loan", "Creating an NFT"],
        correctIndex: 1,
        explanation: "Staking is locking your tokens to participate in transaction validation and earn rewards in return.",
      },
    ],
  },
  l14: {
    lessonId: "l14",
    questions: [
      {
        id: "q14_1",
        question: "What is the biggest risk in DeFi?",
        options: ["The internet going down", "Smart contract risk — bugs that can cause loss of funds", "Banks closing", "Dollar inflation"],
        correctIndex: 1,
        explanation: "The biggest risk in DeFi is smart contract risk: if the code has a bug, funds can be permanently lost.",
      },
      {
        id: "q14_2",
        question: "What is a rug pull?",
        options: ["A legitimate trading strategy", "A fraudulent project that steals user funds", "A type of smart contract", "A form of staking"],
        correctIndex: 1,
        explanation: "A rug pull is a fraudulent project where creators take user funds and disappear.",
      },
      {
        id: "q14_3",
        question: "What does DYOR mean?",
        options: ["Do Your Own Research — research before investing", "Don't Yield On Returns", "Decentralized Yield Over Risk", "Digital Yield Operating Rules"],
        correctIndex: 0,
        explanation: "DYOR means 'Do Your Own Research' — always research and understand a project before investing your money.",
      },
    ],
  },
  l15: {
    lessonId: "l15",
    questions: [
      {
        id: "q15_1",
        question: "What programming language does Soroban use?",
        options: ["JavaScript", "Python", "Rust", "Solidity"],
        correctIndex: 2,
        explanation: "Soroban uses Rust as its programming language, which reduces common errors and makes smart contracts safer.",
      },
      {
        id: "q15_2",
        question: "What advantage does Soroban have over other platforms?",
        options: ["It's more expensive", "It only works with Bitcoin", "Ultra-low fees and connects with Stellar's native DEX", "It requires permission to use"],
        correctIndex: 2,
        explanation: "Soroban inherits Stellar's low costs and has interoperability with the native DEX on the network.",
      },
      {
        id: "q15_3",
        question: "Why does Rust make smart contracts safer?",
        options: ["Because it's slower", "Because it reduces common programming errors", "Because only experts use it", "Because it doesn't allow complex smart contracts"],
        correctIndex: 1,
        explanation: "Rust has a strict type system and safe memory management that prevents common errors that cause vulnerabilities in smart contracts.",
      },
    ],
  },
};

const QUIZZES_NAH: Record<string, Quiz> = {
  l1: {
    lessonId: "l1",
    questions: [
      {
        id: "q1",
        question: "¿Tlen ce blockchain?",
        options: [
          "Ce tlamatiliztli calli zan ce tlatquitl",
          "Ce amatl tlanauhatilli tlen quipia tlanauhatilizmeh ipan miec tlachihualmeh",
          "Ce tlahtolli crypto",
          "Ce gobierno tominaliztli",
        ],
        correctIndex: 1,
        explanation: "Ce blockchain tlanauhatilli tlen quipia tlanauhatilizmeh ipan miec tlachihualmeh, amo ce tlatquitl.",
      },
      {
        id: "q2",
        question: "¿Tlen mochihua ica datos ihcuac motlalia ipan blockchain?",
        options: [
          "Hueliti mocuepaz ica admins",
          "Tlamiz ipan 30 tonalli",
          "Amo hueliti mocuepaz",
          "Mopolohua ipan ce xihuitl",
        ],
        correctIndex: 2,
        explanation: "Datos ipan blockchain amo mocuepa — ihcuac motlalia, criptográficamente mochihua huan amo hueliti mocuepa.",
      },
      {
        id: "q3",
        question: "¿Tlen quipia ce 'bloque' ipan blockchain?",
        options: [
          "Ce huey archivo",
          "Tlahtolichtacayotl",
          "Ce nechicotiliztli tlanauhatilizmeh",
          "Cookies",
        ],
        correctIndex: 2,
        explanation: "Ce bloque quipia tlanauhatilizmeh. Ihcuac temitoc, motzacua ica in bloque achtopa.",
      },
      {
        id: "q4",
        question: "¿Catli AMO itech blockchain?",
        options: ["Amo centlalia", "Tlanextli", "Bancos itlatqui", "Chipahuac"],
        correctIndex: 2,
        explanation: "Blockchain AMO bancos itlatqui — amo centlalia, amo ce tlatquitl, huan tlanextli.",
      },
    ],
  },
  l2: {
    lessonId: "l2",
    questions: [
      {
        id: "q2_1",
        question: "¿Tlen monequi inic motlanauhatiz ce blockchain tlanauhatiliztli?",
        options: ["Ce email tlahtolichtacayotl", "Ce firma ica llave privada", "Banco tlanauhatiliztli", "Ce SMS código"],
        correctIndex: 1,
        explanation: "Ce tlanauhatiliztli mochihua ica llave privada — mo firma digital.",
      },
      {
        id: "q2_2",
        question: "¿Aquin quicualtilia tlanauhatilizmeh?",
        options: ["Bancos centrales", "Validadores o mineros", "Gobierno", "Aquin quintitlani"],
        correctIndex: 1,
        explanation: "Validadores quicualtilia tlanauhatilizmeh huan quipia ipan niman bloque.",
      },
      {
        id: "q2_3",
        question: "¿Tlen ce blockchain tlanauhatiliztli?",
        options: ["Ce mensaje", "Ce registro tlen valor ome tlacameh", "Ce actualización", "Ce archivo"],
        correctIndex: 1,
        explanation: "Ce blockchain tlanauhatiliztli quipia tlen valor ome tlacameh tlen monequi validación.",
      },
    ],
  },
  l3: {
    lessonId: "l3",
    questions: [
      {
        id: "q3_1",
        question: "¿Tlen ce mecanismo de consenso?",
        options: ["Ce crypto", "In ohtli ica nodos mochihua acuerdo", "Ce contrato", "Ce base de datos"],
        correctIndex: 1,
        explanation: "Ce mecanismo de consenso — in ohtli ica nodos mochihua acuerdo ipan tlanauhatilli.",
      },
      {
        id: "q3_2",
        question: "¿Catli mecanismo quichihua Bitcoin?",
        options: ["Proof of Stake", "Stellar Consensus Protocol", "Proof of Work", "Delegated Proof of Stake"],
        correctIndex: 2,
        explanation: "Bitcoin quichihua Proof of Work (PoW).",
      },
      {
        id: "q3_3",
        question: "¿Tlen cualli Stellar Consensus Protocol?",
        options: ["Quichihua miec tletl", "Iciuhca huan amo miec tletl", "Zan ica Bitcoin", "Monequi hardware"],
        correctIndex: 1,
        explanation: "Stellar Consensus Protocol iciuhca huan amo miec tletl, amo quemeh PoW.",
      },
    ],
  },
  l4: {
    lessonId: "l4",
    questions: [
      {
        id: "q4_1",
        question: "¿Tlen quichihua llave pública?",
        options: ["Firma ichtaca", "Mo dirección tlen mochi quittaz", "Quitzahua mo teléfono", "Quicui mo email"],
        correctIndex: 1,
        explanation: "Mo llave pública — mo dirección, mochi quittaz.",
      },
      {
        id: "q4_2",
        question: "¿Tlen mochihua intla ticpoloa mo llave privada?",
        options: ["Hueliti ticchihuaz reset", "Banco mitzmacaz yancuic", "Ticpoloa mo activos nochipa", "Mochihua occequi"],
        correctIndex: 2,
        explanation: "Intla ticpoloa mo llave privada, ticpoloa mo activos nochipa.",
      },
      {
        id: "q4_3",
        question: "¿Tlen amo niman ticchihuaz ica mo llave privada?",
        options: ["Xicpia ipan cualli lugar", "Xictemaca", "Xicchihua respaldo", "Xicilnamiqui"],
        correctIndex: 1,
        explanation: "Mo llave privada — AMO niman xictemaca. Aquin quipia, quicontroloa mo activos.",
      },
    ],
  },
  l5: {
    lessonId: "l5",
    questions: [
      {
        id: "q5_1",
        question: "¿Tlen quipia ce wallet crypto?",
        options: ["Mo criptomonedas", "Mo llaves privadas", "Blockchain archivos", "Mo historial"],
        correctIndex: 1,
        explanation: "Ce wallet amo quipia mo crypto — quipia mo llaves privadas.",
      },
      {
        id: "q5_2",
        question: "¿Tlen in diferencia hot wallet huan cold wallet?",
        options: ["In color", "Hot moconecta internet, cold amo", "Hot gratis, cold tlaxtlahualli", "Amo onca diferencia"],
        correctIndex: 1,
        explanation: "Hot wallets moconecta internet, cold wallets amo — más seguro.",
      },
      {
        id: "q5_3",
        question: "Ipan non-custodial wallet, ¿aquin quicontroloa llaves?",
        options: ["In empresa", "Gobierno", "Tehuatl", "Mineros"],
        correctIndex: 2,
        explanation: "Ipan non-custodial wallet tehuatl ticcontroloa mo llaves.",
      },
    ],
  },
  l6: {
    lessonId: "l6",
    questions: [
      {
        id: "q6_1",
        question: "¿Quenin iciuhca Stellar quichihua tlanauhatilizmeh?",
        options: ["10 minutos", "1 hora", "3-5 segundos", "24 horas"],
        correctIndex: 2,
        explanation: "Stellar huel iciuhca — 3-5 segundos.",
      },
      {
        id: "q6_2",
        question: "¿Tlen in enfoque Stellar?",
        options: ["NFTs gaming", "Pagos iciuhca huan amo patiyo", "Redes sociales", "Nube almacenamiento"],
        correctIndex: 1,
        explanation: "Stellar quichihua pagos iciuhca, amo patiyo, huan inclusión financiera.",
      },
      {
        id: "q6_3",
        question: "¿Catli xihuitl opeuh Stellar?",
        options: ["2009", "2012", "2014", "2020"],
        correctIndex: 2,
        explanation: "Stellar opeuh ipan 2014 ica Jed McCaleb huan Joyce Kim.",
      },
    ],
  },
  l7: {
    lessonId: "l7",
    questions: [
      {
        id: "q7_1",
        question: "¿Quezqui mínimo inic motzahua ce Stellar cuenta?",
        options: ["0 XLM", "0.5 XLM", "1 XLM", "10 XLM"],
        correctIndex: 2,
        explanation: "Monequi 1 XLM inic motzahua ce cuenta ipan Stellar.",
      },
      {
        id: "q7_2",
        question: "¿Quezqui quicohua ce Stellar tlanauhatiliztli?",
        options: ["1 XLM", "0.01 XLM", "0.00001 XLM", "Gratis"],
        correctIndex: 2,
        explanation: "Stellar tlanauhatilizmeh quicohua 0.00001 XLM.",
      },
      {
        id: "q7_3",
        question: "¿Quenin omochiuhqueh Lumens (XLM)?",
        options: ["Mominan quemeh Bitcoin", "Mochi omochiuhqueh ipan génesis", "Mochihua cecemilhuitl", "Usuarios quichihua"],
        correctIndex: 1,
        explanation: "Amo onca minería — mochi 50 mil millones XLM omochiuhqueh ipan génesis.",
      },
    ],
  },
  l8: {
    lessonId: "l8",
    questions: [
      {
        id: "q8_1",
        question: "¿Tlen quihtoznequi DeFi?",
        options: ["Digital Finance", "Finanzas amo centlalia", "Definición Financiera", "Deflación Internacional"],
        correctIndex: 1,
        explanation: "DeFi quihtoznequi Finanzas amo centlalia — aplicaciones financieras ipan blockchain.",
      },
      {
        id: "q8_2",
        question: "¿Tlen quicuepa bancos ipan DeFi?",
        options: ["Gobiernos", "Código (smart contracts)", "Fintech", "IA"],
        correctIndex: 1,
        explanation: "Ipan DeFi, código quicuepa bancos huan brokers.",
      },
      {
        id: "q8_3",
        question: "¿Tlen ticnequi inic ticchihuaz DeFi?",
        options: ["Banco cuenta huan pasaporte", "Zan internet huan wallet", "Ticmatiz programar", "$1000 mínimo"],
        correctIndex: 1,
        explanation: "DeFi itech mochi — zan ticnequi internet huan wallet.",
      },
      {
        id: "q8_4",
        question: "¿Tlen quihtoznequi 'componible' ipan DeFi?",
        options: ["Hueliti motlapanaz", "Protocolos moconecta quemeh LEGO", "Zan ipan ce blockchain", "Zan temporal"],
        correctIndex: 1,
        explanation: "Componible — protocolos DeFi moconecta quemeh LEGO.",
      },
    ],
  },
  l9: {
    lessonId: "l9",
    questions: [
      {
        id: "q9_1",
        question: "¿Tlen ce smart contract?",
        options: ["Ce contrato legal digital", "Ce programa tlen mochihua ipan blockchain", "Ce acuerdo empresas", "Ce app celular"],
        correctIndex: 1,
        explanation: "Ce smart contract — ce programa tlen mochihua ipan blockchain ihcuac mocaqui condiciones.",
      },
      {
        id: "q9_2",
        question: "¿Quenin motocayotia Stellar smart contracts?",
        options: ["Ethereum", "Solana", "Soroban", "Polkadot"],
        correctIndex: 2,
        explanation: "Soroban — Stellar smart contracts plataforma.",
      },
      {
        id: "q9_3",
        question: "¿Catli AMO quipia smart contracts?",
        options: ["Autoejecutables", "Inmutables", "Hueliti mocuepa", "Deterministas"],
        correctIndex: 2,
        explanation: "Smart contracts inmutables — AMO hueliti mocuepa.",
      },
    ],
  },
  l10: {
    lessonId: "l10",
    questions: [
      {
        id: "q10_1",
        question: "¿Tlen ce pool de liquidez?",
        options: ["Ce atlachinolli", "Tokens ipan smart contract inic trading", "Ce banco cuenta", "Ce crypto"],
        correctIndex: 1,
        explanation: "Ce pool de liquidez — tokens ipan smart contract inic trading.",
      },
      {
        id: "q10_2",
        question: "¿Tlen ce AMM?",
        options: ["App Mobile Manager", "Automated Market Maker", "Automated Money Machine", "Advanced Mining"],
        correctIndex: 1,
        explanation: "AMM (Automated Market Maker) quichihua precios ica matemáticas.",
      },
      {
        id: "q10_3",
        question: "¿Tlen impermanent loss?",
        options: ["Ticpoloa wallet", "Ce polihui ihcuac precios mocuepa", "Ce hack", "Ce impuesto"],
        correctIndex: 1,
        explanation: "Impermanent loss — ce polihui ihcuac precios mocuepa ipan liquidez.",
      },
    ],
  },
  l11: {
    lessonId: "l11",
    questions: [
      {
        id: "q11_1",
        question: "¿Tlen préstamos sobre-colateralizados?",
        options: ["Préstamos amo garantía", "Ticpia más valor tlen ticnequi", "Préstamos 0% interés", "Zan empresas"],
        correctIndex: 1,
        explanation: "Ipan DeFi ticpia más valor tlen ticnequi inic moproteger protocolo.",
      },
      {
        id: "q11_2",
        question: "¿Tlen ce flash loan?",
        options: ["Préstamo alto interés", "Préstamo largo plazo", "Préstamo iciuhca amo colateral ipan sama transacción", "Préstamo gobierno"],
        correctIndex: 2,
        explanation: "Flash loans — préstamos iciuhca amo colateral ipan sama transacción blockchain.",
      },
      {
        id: "q11_3",
        question: "¿Tlen quichihua tasas de interés ipan DeFi?",
        options: ["Banco central", "Oferta huan demanda", "Gobierno", "Amo mocuepa"],
        correctIndex: 1,
        explanation: "Ipan DeFi, tasas de interés mocuepa ica oferta huan demanda.",
      },
    ],
  },
  l12: {
    lessonId: "l12",
    questions: [
      {
        id: "q12_1",
        question: "¿Tlen ce stablecoin?",
        options: ["Crypto tlen nochipa mopatihua", "Crypto tlen quipia valor estable", "Ce moneda física", "Ce NFT"],
        correctIndex: 1,
        explanation: "Stablecoins — crypto tlen quipia valor estable, normalmente dólar.",
      },
      {
        id: "q12_2",
        question: "¿Catli stablecoin onca ipan Stellar?",
        options: ["DAI", "USDT", "USDC", "BUSD"],
        correctIndex: 2,
        explanation: "USDC onca ipan Stellar, 1:1 ica dólar.",
      },
      {
        id: "q12_3",
        question: "¿Quenin DAI quipia estabilidad?",
        options: ["Dólares ipan banco", "Occequi crypto colateral", "Gobierno garantiza", "Amo estable"],
        correctIndex: 1,
        explanation: "DAI — stablecoin ica occequi crypto colateral ipan smart contracts.",
      },
    ],
  },
  l13: {
    lessonId: "l13",
    questions: [
      {
        id: "q13_1",
        question: "¿Tlen yield farming?",
        options: ["Milli crypto", "Mover crypto inic más rendimiento", "Minar Bitcoin", "NFTs"],
        correctIndex: 1,
        explanation: "Yield farming — mover crypto ipan protocolos inic más rendimiento.",
      },
      {
        id: "q13_2",
        question: "¿Tlen diferencia APY huan APR?",
        options: ["Zan ce", "APY quipia interés compuesto, APR amo", "APR nochipa más", "APY crypto, APR fiat"],
        correctIndex: 1,
        explanation: "APY quipia interés compuesto, APR amo.",
      },
      {
        id: "q13_3",
        question: "¿Tlen staking?",
        options: ["Namaca crypto", "Tzacua tokens inic moproteger red", "Préstamo", "NFT"],
        correctIndex: 1,
        explanation: "Staking — tzacua tokens inic validar transacciones huan tlanextia recompensas.",
      },
    ],
  },
  l14: {
    lessonId: "l14",
    questions: [
      {
        id: "q14_1",
        question: "¿Catli in huey riesgo ipan DeFi?",
        options: ["Internet mocahua", "Smart contract bugs", "Bancos motzacua", "Inflación dólar"],
        correctIndex: 1,
        explanation: "In huey riesgo — smart contract bugs hueliti quipoloa fondos.",
      },
      {
        id: "q14_2",
        question: "¿Tlen ce rug pull?",
        options: ["Estrategia trading", "Proyecto fraude tlen quichtequi fondos", "Ce smart contract", "Staking"],
        correctIndex: 1,
        explanation: "Rug pull — proyecto fraude tlen quichtequi fondos huan choloa.",
      },
      {
        id: "q14_3",
        question: "¿Tlen quihtoznequi DYOR?",
        options: ["Do Your Own Research", "Don't Yield On Returns", "Decentralized Yield Over Risk", "Digital Yield Operating Rules"],
        correctIndex: 0,
        explanation: "DYOR — 'Do Your Own Research' — nochipa xicmachti achto.",
      },
    ],
  },
  l15: {
    lessonId: "l15",
    questions: [
      {
        id: "q15_1",
        question: "¿Catli tlahtolli quichihua Soroban?",
        options: ["JavaScript", "Python", "Rust", "Solidity"],
        correctIndex: 2,
        explanation: "Soroban quichihua Rust — amo miec errores huan más seguro.",
      },
      {
        id: "q15_2",
        question: "¿Tlen cualli Soroban?",
        options: ["Más patiyo", "Zan Bitcoin", "Fees amo patiyo huan moconecta Stellar DEX", "Monequi permiso"],
        correctIndex: 2,
        explanation: "Soroban quipia fees amo patiyo huan moconecta ica Stellar DEX.",
      },
      {
        id: "q15_3",
        question: "¿Tleca Rust quichihua smart contracts más seguros?",
        options: ["Porque amo iciuhca", "Porque amo miec errores", "Porque zan expertos", "Porque amo complejos"],
        correctIndex: 1,
        explanation: "Rust quipia sistema de tipos huan memoria segura tlen amo quicahua errores.",
      },
    ],
  },
};

export function getQuizzesForLang(lang: Lang, defaultQuizzes: Record<string, any>): Record<string, any> {
  if (lang === "en") return { ...defaultQuizzes, ...QUIZZES_EN };
  if (lang === "nah") return { ...defaultQuizzes, ...QUIZZES_NAH };
  return defaultQuizzes;
}
