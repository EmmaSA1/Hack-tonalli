import { Lang } from "../i18n/translations";

// Translated lesson content (title + content blocks) per language
// Only title and content are translated; id, moduleId, emoji, xpReward, duration, locked stay the same

type ContentBlock = { type: string; text?: string; items?: string[] };

interface LessonTranslation {
  title: string;
  content: ContentBlock[];
}

const EN: Record<string, LessonTranslation> = {
  l1: {
    title: "What is Blockchain?",
    content: [
      { type: "text", text: "A blockchain is a distributed, decentralized ledger that records transactions across many computers. Think of it as a shared Google Doc that no single person controls." },
      { type: "highlight", text: "Key Insight: Once data is recorded on a blockchain, it's nearly impossible to change or delete." },
      { type: "text", text: "Each 'block' contains a set of transactions. When a block is full, it gets chained to the previous block — hence the name 'blockchain'." },
      { type: "bullets", items: ["Decentralized — no single owner", "Transparent — anyone can verify", "Immutable — data cannot be altered", "Secure — cryptographically protected"] },
    ],
  },
  l2: {
    title: "How Transactions Work",
    content: [
      { type: "text", text: "A blockchain transaction is a record of value transfer between two parties. Before it's added to the blockchain, it must be validated by the network." },
      { type: "highlight", text: "Every transaction is signed with a private key — your digital signature that proves you authorized it." },
      { type: "text", text: "Validators (or miners in some networks) check the transaction is valid and add it to the next block." },
    ],
  },
  l3: {
    title: "Consensus Mechanisms",
    content: [
      { type: "text", text: "A consensus mechanism is the method by which nodes on a blockchain network agree on the current state of the ledger." },
      { type: "bullets", items: ["Proof of Work (PoW) — used by Bitcoin, energy intensive", "Proof of Stake (PoS) — validators stake tokens", "Stellar Consensus Protocol (SCP) — fast, low-energy"] },
    ],
  },
  l4: {
    title: "Public & Private Keys",
    content: [
      { type: "text", text: "Cryptographic key pairs are the foundation of blockchain identity. Your public key is your address, visible to everyone. Your private key is your password — never share it." },
      { type: "highlight", text: "Warning: If you lose your private key, you lose access to your assets forever. No password reset exists." },
    ],
  },
  l5: {
    title: "Wallets Explained",
    content: [
      { type: "text", text: "A crypto wallet doesn't actually store your crypto — it stores your private keys. The assets live on the blockchain." },
      { type: "bullets", items: ["Hot wallets — connected to internet, convenient", "Cold wallets — offline, maximum security", "Custodial — third party holds keys", "Non-custodial — you hold your own keys"] },
    ],
  },
  l6: {
    title: "Stellar Overview",
    content: [
      { type: "text", text: "Stellar is an open-source, decentralized blockchain network focused on enabling fast, low-cost cross-border payments and financial inclusion." },
      { type: "highlight", text: "Stellar processes transactions in 3-5 seconds with fees of just 0.00001 XLM (fractions of a cent)." },
      { type: "text", text: "Founded in 2014 by Jed McCaleb and Joyce Kim, Stellar's mission is to provide universal access to the global financial system." },
    ],
  },
  l7: {
    title: "XLM — The Native Token",
    content: [
      { type: "text", text: "Lumens (XLM) is the native digital currency of the Stellar network. It serves as a bridge currency for cross-asset transactions and pays network fees." },
      { type: "bullets", items: ["Minimum balance: 1 XLM to open an account", "Transaction fee: 0.00001 XLM", "Total supply: 50 billion XLM", "No mining — all XLM was created at genesis"] },
    ],
  },
  l8: {
    title: "What is DeFi?",
    content: [
      { type: "text", text: "DeFi (Decentralized Finance) is an ecosystem of financial applications built on blockchain that operate without intermediaries like banks or brokers." },
      { type: "highlight", text: "DeFi aims to recreate traditional financial services (lending, savings, trading) in an open, transparent, and accessible way for everyone." },
      { type: "bullets", items: ["No intermediaries — code instead of banks", "Accessible — you just need internet and a wallet", "Transparent — all code is public and auditable", "Composable — protocols connect like LEGO pieces"] },
    ],
  },
  l9: {
    title: "Smart Contracts",
    content: [
      { type: "text", text: "A smart contract is a program that automatically executes on the blockchain when predefined conditions are met." },
      { type: "highlight", text: "Think of a smart contract like a vending machine: insert money, select a product, and the machine delivers it automatically without a seller." },
      { type: "bullets", items: ["Self-executing — activate when conditions are met", "Immutable — cannot be modified once deployed", "Deterministic — always produce the same result", "Soroban — Stellar's smart contract platform"] },
    ],
  },
  l10: {
    title: "Liquidity Pools & AMMs",
    content: [
      { type: "text", text: "A liquidity pool is a fund of tokens locked in a smart contract that facilitates decentralized trading. AMMs (Automated Market Makers) use these pools to determine prices automatically." },
      { type: "highlight", text: "Instead of a traditional order book, AMMs use mathematical formulas to calculate prices. Anyone can be a liquidity provider and earn fees." },
      { type: "bullets", items: ["Liquidity providers earn fees on every trade", "No direct buyer/seller needed", "Stellar DEX has its own native liquidity system", "Risk: impermanent loss when prices change significantly"] },
    ],
  },
  l11: {
    title: "Lending & Borrowing",
    content: [
      { type: "text", text: "DeFi lending protocols allow lending and borrowing crypto without intermediaries. Lenders earn interest and borrowers must provide collateral." },
      { type: "highlight", text: "Unlike a bank, in DeFi loans are over-collateralized: you must deposit more value than you borrow, protecting the protocol." },
      { type: "bullets", items: ["Permissionless loans — anyone can participate", "Dynamic interest rates based on supply and demand", "Flash loans — instant loans without collateral (must be repaid in the same transaction)", "Automatic liquidation if collateral drops in value"] },
    ],
  },
  l12: {
    title: "Stablecoins",
    content: [
      { type: "text", text: "Stablecoins are cryptocurrencies designed to maintain a stable value, usually pegged to a fiat currency like the US dollar. They are fundamental in DeFi." },
      { type: "highlight", text: "USDC is a popular stablecoin on Stellar that maintains a 1:1 parity with the US dollar, backed by real reserves." },
      { type: "bullets", items: ["Fiat-collateralized (USDC, USDT) — backed by real dollars", "Crypto-collateralized (DAI) — backed by other cryptos", "Algorithmic — use algorithms to maintain price", "On Stellar: USDC is natively available on the network"] },
    ],
  },
  l13: {
    title: "Yield Farming & Staking",
    content: [
      { type: "text", text: "Yield farming is the practice of moving your crypto between different DeFi protocols to maximize returns. Staking is locking tokens to help secure the network and earn rewards." },
      { type: "highlight", text: "Yield farming can offer high returns, but also carries risks like smart contract bugs, impermanent loss, and market volatility." },
      { type: "bullets", items: ["Staking — lock tokens to validate transactions", "Yield farming — seek best returns across protocols", "APY vs APR — APY includes compound interest, APR doesn't", "DYOR (Do Your Own Research) — always research before investing"] },
    ],
  },
  l14: {
    title: "Risks in DeFi",
    content: [
      { type: "text", text: "DeFi offers great opportunities but also significant risks. It's crucial to understand them before participating." },
      { type: "highlight", text: "The biggest risk in DeFi is smart contract risk: if the code has a bug, funds can be permanently lost." },
      { type: "bullets", items: ["Smart contract risk — bugs or vulnerabilities in code", "Rug pulls — fraudulent projects that steal funds", "Impermanent loss — temporary loss when providing liquidity", "Regulation — legal changes can affect protocols"] },
    ],
  },
  l15: {
    title: "DeFi on Stellar (Soroban)",
    content: [
      { type: "text", text: "Soroban is Stellar's smart contract platform, designed to be secure, scalable, and developer-friendly. It enables building DeFi applications on the Stellar network." },
      { type: "highlight", text: "Soroban uses Rust as its programming language, which reduces common errors and makes smart contracts safer than on other platforms." },
      { type: "bullets", items: ["Written in Rust — safe and efficient language", "Ultra-low fees — inherits Stellar's low costs", "Interoperability — connects with Stellar's native DEX", "Scalable — designed to handle thousands of transactions per second"] },
    ],
  },
};

const NAH: Record<string, LessonTranslation> = {
  l1: {
    title: "¿Tlen ce Blockchain?",
    content: [
      { type: "text", text: "Ce blockchain ce amatl tlanauhatilli tlen quipia tlanauhatilizmeh ipan miec tlachihualmeh. Xicnemili quemeh ce Google Doc tlen mochi quittaz huan amo aquin ce quicontroloa." },
      { type: "highlight", text: "Huey Tlamatiliztli: Ihcuac datos motlalia ipan blockchain, amo hueliti mocuepa o mopolohua." },
      { type: "text", text: "Ce 'bloque' quipia tlanauhatilizmeh. Ihcuac temitoc, motzacua ica in bloque achtopa — ic motocayotia 'blockchain'." },
      { type: "bullets", items: ["Amo centlalia — amo ce tlatquitl", "Tlanextli — mochi hueliti quittaz", "Amo mocuepa — datos amo mocuepa", "Chipahuac — criptográficamente mochihua"] },
    ],
  },
  l2: {
    title: "Quenin Mochihua Tlanauhatilizmeh",
    content: [
      { type: "text", text: "Ce blockchain tlanauhatiliztli ce registro tlen valor ome tlacameh. Achto monequi validación ica red." },
      { type: "highlight", text: "Ce tlanauhatiliztli mochihua ica llave privada — mo firma digital tlen quimatiltia tehuatl oticchiuh." },
      { type: "text", text: "Validadores quicualtilia tlanauhatilizmeh huan quipia ipan niman bloque." },
    ],
  },
  l3: {
    title: "Mecanismos de Consenso",
    content: [
      { type: "text", text: "Ce mecanismo de consenso — in ohtli ica nodos mochihua acuerdo ipan tlanauhatilli." },
      { type: "bullets", items: ["Proof of Work (PoW) — Bitcoin quichihua, miec tletl", "Proof of Stake (PoS) — validadores tzacua tokens", "Stellar Consensus Protocol (SCP) — iciuhca, amo miec tletl"] },
    ],
  },
  l4: {
    title: "Llaves Públicas huan Privadas",
    content: [
      { type: "text", text: "Llaves criptográficas — fundamento blockchain identidad. Mo llave pública mo dirección, mochi quittaz. Mo llave privada mo tlahtolichtacayotl — amo xictemaca." },
      { type: "highlight", text: "Tlamaniliztli: Intla ticpoloa mo llave privada, ticpoloa mo activos nochipa. Amo onca reset." },
    ],
  },
  l5: {
    title: "Wallets Tlahtolchihualli",
    content: [
      { type: "text", text: "Ce wallet crypto amo quipia mo crypto — quipia mo llaves privadas. Mo activos ipan blockchain." },
      { type: "bullets", items: ["Hot wallets — moconecta internet, cualli", "Cold wallets — amo internet, más seguro", "Custodial — occequi quipia llaves", "Non-custodial — tehuatl ticpia mo llaves"] },
    ],
  },
  l6: {
    title: "Stellar Tlachihualli",
    content: [
      { type: "text", text: "Stellar ce blockchain red tlen quichihua pagos iciuhca, amo patiyo, huan inclusión financiera." },
      { type: "highlight", text: "Stellar quichihua tlanauhatilizmeh ipan 3-5 segundos ica fees 0.00001 XLM." },
      { type: "text", text: "Opeuh ipan 2014 ica Jed McCaleb huan Joyce Kim, Stellar quichihua acceso universal ipan sistema financiero global." },
    ],
  },
  l7: {
    title: "XLM — In Nativo Token",
    content: [
      { type: "text", text: "Lumens (XLM) in nativo moneda digital ipan Stellar red. Quichihua puente inic tlanauhatilizmeh huan quixtlahua fees." },
      { type: "bullets", items: ["Mínimo balance: 1 XLM inic motzahua cuenta", "Fee tlanauhatiliztli: 0.00001 XLM", "Mochi supply: 50 mil millones XLM", "Amo minería — mochi XLM omochiuh ipan génesis"] },
    ],
  },
  l8: {
    title: "¿Tlen DeFi?",
    content: [
      { type: "text", text: "DeFi (Finanzas amo centlalia) ce ecosistema aplicaciones financieras ipan blockchain tlen mochihua amo intermediarios quemeh bancos." },
      { type: "highlight", text: "DeFi quichihua occeppa servicios financieros (préstamos, ahorro, trading) tlanextli huan accesible inic mochi." },
      { type: "bullets", items: ["Amo intermediarios — código amo bancos", "Accesible — zan ticnequi internet huan wallet", "Tlanextli — mochi código público", "Componible — protocolos moconecta quemeh LEGO"] },
    ],
  },
  l9: {
    title: "Smart Contracts",
    content: [
      { type: "text", text: "Ce smart contract ce programa tlen mochihua automáticamente ipan blockchain ihcuac mocaqui condiciones." },
      { type: "highlight", text: "Xicnemili ce smart contract quemeh ce máquina expendedora: ticpia tomin, tiquixti producto, huan máquina quitemaca automáticamente." },
      { type: "bullets", items: ["Autoejecutables — mochihua ihcuac condiciones", "Inmutables — amo mocuepa ihcuac motlalia", "Deterministas — nochipa sama resultado", "Soroban — Stellar smart contracts plataforma"] },
    ],
  },
  l10: {
    title: "Pools de Liquidez huan AMMs",
    content: [
      { type: "text", text: "Ce pool de liquidez — tokens ipan smart contract inic trading. AMMs quichihua precios automáticamente." },
      { type: "highlight", text: "Amo quemeh libro de órdenes, AMMs quichihua precios ica matemáticas. Mochi hueliti quichihua proveedor de liquidez." },
      { type: "bullets", items: ["Proveedores tlanextia fees", "Amo monequi comprador/vendedor directo", "Stellar DEX quipia liquidez nativo", "Riesgo: impermanent loss ihcuac precios mocuepa"] },
    ],
  },
  l11: {
    title: "Préstamos huan Tetlaneuhtiliztli",
    content: [
      { type: "text", text: "Protocolos DeFi préstamos quicahua tetlaneuhtiaz huan titlaneuhtiaz crypto amo intermediarios." },
      { type: "highlight", text: "Amo quemeh banco, ipan DeFi préstamos sobre-colateralizados: ticpia más valor tlen ticnequi." },
      { type: "bullets", items: ["Préstamos amo permisos", "Tasas de interés dinámicas", "Flash loans — préstamos iciuhca ipan sama transacción", "Liquidación automática intla colateral huetzi"] },
    ],
  },
  l12: {
    title: "Stablecoins",
    content: [
      { type: "text", text: "Stablecoins — crypto tlen quipia valor estable, normalmente dólar. Fundamentales ipan DeFi." },
      { type: "highlight", text: "USDC ce stablecoin ipan Stellar tlen quipia 1:1 ica dólar, ica reservas reales." },
      { type: "bullets", items: ["Fiat-colateralizadas (USDC, USDT) — dólares reales", "Crypto-colateralizadas (DAI) — occequi crypto", "Algorítmicas — algoritmos inic precio", "Ipan Stellar: USDC onca nativamente"] },
    ],
  },
  l13: {
    title: "Yield Farming huan Staking",
    content: [
      { type: "text", text: "Yield farming — mover crypto ipan protocolos inic más rendimiento. Staking — tzacua tokens inic asegurar red huan tlanextia recompensas." },
      { type: "highlight", text: "Yield farming hueliti quichihua rendimientos altos, pero quipia riesgos quemeh bugs, impermanent loss huan volatilidad." },
      { type: "bullets", items: ["Staking — tzacua tokens inic validar", "Yield farming — tlahtemohua más rendimiento", "APY vs APR — APY quipia interés compuesto", "DYOR — nochipa xicmachti achto"] },
    ],
  },
  l14: {
    title: "Riesgos ipan DeFi",
    content: [
      { type: "text", text: "DeFi quipia oportunidades pero nohuan riesgos. Monequi ticmatiz achto." },
      { type: "highlight", text: "In huey riesgo ipan DeFi — smart contract risk: intla código quipia bug, fondos hueliti mopolohua nochipa." },
      { type: "bullets", items: ["Smart contract risk — bugs ipan código", "Rug pulls — proyectos fraude", "Impermanent loss — polihui temporal ipan liquidez", "Regulación — leyes hueliti quicuepa protocolos"] },
    ],
  },
  l15: {
    title: "DeFi ipan Stellar (Soroban)",
    content: [
      { type: "text", text: "Soroban — Stellar smart contracts plataforma, seguro, escalable huan cualli inic desarrolladores." },
      { type: "highlight", text: "Soroban quichihua Rust, tlen amo miec errores huan más seguro." },
      { type: "bullets", items: ["Rust — tlahtolli seguro huan eficiente", "Fees amo patiyo — Stellar fees", "Interoperabilidad — moconecta Stellar DEX", "Escalable — miec tlanauhatilizmeh por segundo"] },
    ],
  },
};

export function getLessonsForLang(lang: Lang, defaultLessons: Record<string, any[]>): Record<string, any[]> {
  if (lang === "es") return defaultLessons;

  const translations = lang === "en" ? EN : NAH;
  const result: Record<string, any[]> = {};

  for (const moduleId in defaultLessons) {
    result[moduleId] = defaultLessons[moduleId].map((lesson) => {
      const tr = translations[lesson.id];
      if (tr) {
        return { ...lesson, title: tr.title, content: tr.content };
      }
      return lesson;
    });
  }

  return result;
}
