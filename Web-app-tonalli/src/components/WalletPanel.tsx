import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  ExternalLink,
  Copy,
  Check,
  LogOut,
  Download,
  Send,
  Link2,
  Smartphone,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { apiService } from "../services/api";
import { useFreighter } from "../hooks/useFreighter";
import type { WalletBalance } from "../types";

interface WalletPanelProps {
  walletAddress?: string;
  externalWalletAddress?: string | null;
  walletType?: string;
  onWalletUpdate?: () => void;
}

export function WalletPanel({
  walletAddress,
  externalWalletAddress,
  onWalletUpdate,
}: WalletPanelProps) {
  const freighter = useFreighter();
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [copied, setCopied] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [connectAddress, setConnectAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [signingXDR, setSigningXDR] = useState(false);
  const [exportPassword, setExportPassword] = useState("");
  const [exportedKey, setExportedKey] = useState("");
  const [showDecaf, setShowDecaf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      const data = await apiService.getWalletBalance();
      setBalance(data);
    } catch {
      // ignore
    }
  };

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnect = async () => {
    if (!connectAddress.startsWith("G") || connectAddress.length !== 56) {
      setMessage({
        text: "Direccion Stellar invalida (debe empezar con G, 56 caracteres)",
        type: "error",
      });
      return;
    }
    setLoading(true);
    try {
      await apiService.connectWallet(connectAddress);
      setMessage({ text: "Wallet externa conectada", type: "success" });
      setShowConnect(false);
      setConnectAddress("");
      loadBalance();
      onWalletUpdate?.();
    } catch (err: any) {
      setMessage({
        text: err.response?.data?.message || "Error al conectar",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await apiService.disconnectWallet();
      setMessage({ text: "Wallet externa desconectada", type: "success" });
      loadBalance();
      onWalletUpdate?.();
    } catch {
      setMessage({ text: "Error al desconectar", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setMessage({ text: "Cantidad invalida", type: "error" });
      return;
    }

    // If external wallet is connected and Freighter is available, use signing flow
    if (
      balance?.externalAddress &&
      freighter.isConnected &&
      freighter.publicKey
    ) {
      return handleWithdrawWithFreighter();
    }

    // Fallback to custodial withdrawal (uses stored secret key)
    setLoading(true);
    try {
      const result = await apiService.withdrawToExternal(withdrawAmount);
      if (result.success) {
        setMessage({
          text: `${withdrawAmount} XLM enviados. TX: ${result.txHash?.substring(0, 12)}...`,
          type: "success",
        });
        setShowWithdraw(false);
        setWithdrawAmount("");
        loadBalance();
      } else {
        setMessage({
          text: result.error || "Error en el retiro",
          type: "error",
        });
      }
    } catch (err: any) {
      setMessage({
        text: err.response?.data?.message || "Error en el retiro",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawWithFreighter = async () => {
    if (!freighter.isConnected || !freighter.publicKey) {
      setMessage({ text: "Freighter no conectado", type: "error" });
      return;
    }

    setSigningXDR(true);
    try {
      // Step 1: Prepare unsigned XDR
      const prepareResult = await apiService.prepareWithdrawal(withdrawAmount);
      if (!prepareResult.success) {
        setMessage({
          text: prepareResult.error || "Error preparando transaccion",
          type: "error",
        });
        setSigningXDR(false);
        return;
      }

      // Step 2: Sign with Freighter
      const signedXDR = await freighter.signTransaction(
        prepareResult.xdr,
        "Test SDF Network ; September 2015",
      );

      // Step 3: Submit signed XDR
      const submitResult = await apiService.submitSignedWithdrawal(signedXDR);
      if (submitResult.success) {
        setMessage({
          text: `${withdrawAmount} XLM enviados. TX: ${submitResult.txHash?.substring(0, 12)}...`,
          type: "success",
        });
        setShowWithdraw(false);
        setWithdrawAmount("");
        loadBalance();
      } else {
        setMessage({
          text: submitResult.error || "Error enviando transaccion",
          type: "error",
        });
      }
    } catch (err: any) {
      setMessage({
        text: err.message || "Error en el retiro con Freighter",
        type: "error",
      });
    } finally {
      setSigningXDR(false);
    }
  };

  const handleExport = async () => {
    if (!exportPassword) {
      setMessage({ text: "Ingresa tu password", type: "error" });
      return;
    }
    setLoading(true);
    try {
      const result = await apiService.exportSecretKey(exportPassword);
      setExportedKey(result.secretKey);
      setMessage({
        text: "Secret key revelada. Guardala en un lugar seguro.",
        type: "success",
      });
    } catch (err: any) {
      setMessage({
        text: err.response?.data?.message || "Password incorrecto",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const xlmBalance = balance?.xlmBalance || "0";
  const tnlBalance = balance?.tnlBalance || 0;
  const hasExternal = !!(balance?.externalAddress || externalWalletAddress);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="card"
      style={{ padding: 20 }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Wallet size={18} color="var(--accent)" />
          Stellar Wallet
        </div>
        <span
          style={{
            fontSize: "0.65rem",
            padding: "2px 8px",
            borderRadius: 12,
            background: hasExternal
              ? "rgba(46,139,63,0.2)"
              : "rgba(155,89,182,0.2)",
            color: hasExternal ? "var(--primary)" : "#9B59B6",
            fontWeight: 700,
          }}
        >
          {hasExternal ? "Hibrida" : "Custodial"}
        </span>
      </div>

      {/* Balances */}
      <div
        style={{
          background:
            "linear-gradient(135deg, rgba(46,139,63,0.1), rgba(245,197,24,0.1))",
          borderRadius: 12,
          padding: "14px 16px",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            XLM
          </span>
          <span
            style={{
              fontSize: "1.2rem",
              fontWeight: 900,
              color: "var(--accent)",
            }}
          >
            {parseFloat(xlmBalance).toFixed(2)}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            TNL
          </span>
          <span
            style={{
              fontSize: "1.2rem",
              fontWeight: 900,
              color: "var(--primary)",
            }}
          >
            {tnlBalance.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Custodial address */}
      {walletAddress && (
        <div style={{ marginBottom: 10 }}>
          <div
            style={{
              fontSize: "0.7rem",
              color: "var(--text-muted)",
              marginBottom: 4,
            }}
          >
            Custodial
          </div>
          <div
            onClick={() => copyAddress(walletAddress)}
            style={{
              background: "var(--background)",
              borderRadius: 8,
              padding: "8px 10px",
              fontSize: "0.65rem",
              fontFamily: "monospace",
              color: "var(--text-muted)",
              wordBreak: "break-all",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{ flex: 1 }}>{walletAddress}</span>
            {copied ? (
              <Check size={12} color="var(--primary)" />
            ) : (
              <Copy size={12} />
            )}
          </div>
        </div>
      )}

      {/* External address */}
      {hasExternal && (
        <div style={{ marginBottom: 10 }}>
          <div
            style={{
              fontSize: "0.7rem",
              color: "var(--text-muted)",
              marginBottom: 4,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>Externa (Decaf/Freighter)</span>
            <button
              onClick={handleDisconnect}
              disabled={loading}
              style={{
                background: "none",
                border: "none",
                color: "#e74c3c",
                fontSize: "0.65rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <LogOut size={10} /> Desconectar
            </button>
          </div>
          <div
            style={{
              background: "rgba(46,139,63,0.08)",
              borderRadius: 8,
              padding: "8px 10px",
              fontSize: "0.65rem",
              fontFamily: "monospace",
              color: "var(--primary)",
              wordBreak: "break-all",
              border: "1px solid rgba(46,139,63,0.2)",
            }}
          >
            {balance?.externalAddress || externalWalletAddress}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
        {!hasExternal && (
          <button
            onClick={() => {
              setShowConnect(!showConnect);
              setShowWithdraw(false);
              setShowExport(false);
            }}
            style={{
              flex: 1,
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--background)",
              color: "var(--text)",
              fontSize: "0.75rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <Link2 size={12} /> Conectar
          </button>
        )}

        {hasExternal && (
          <button
            onClick={() => {
              setShowWithdraw(!showWithdraw);
              setShowConnect(false);
              setShowExport(false);
            }}
            style={{
              flex: 1,
              padding: "8px 10px",
              borderRadius: 8,
              border: "none",
              background: "var(--primary)",
              color: "#fff",
              fontSize: "0.75rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <Send size={12} /> Retirar
          </button>
        )}

        <button
          onClick={() => {
            setShowExport(!showExport);
            setShowConnect(false);
            setShowWithdraw(false);
            setExportedKey("");
          }}
          style={{
            flex: 1,
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--background)",
            color: "var(--text)",
            fontSize: "0.75rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <Download size={12} /> Exportar
        </button>

        <button
          onClick={() => {
            setShowDecaf(!showDecaf);
            setShowConnect(false);
            setShowWithdraw(false);
            setShowExport(false);
          }}
          style={{
            flex: 1,
            padding: "8px 10px",
            borderRadius: 8,
            border: "none",
            background: "linear-gradient(135deg, #6C3CE1, #4A90D9)",
            color: "#fff",
            fontSize: "0.75rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <Smartphone size={12} /> Decaf
        </button>

        {walletAddress && (
          <a
            href={`https://stellar.expert/explorer/testnet/account/${walletAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--background)",
              color: "var(--text)",
              fontSize: "0.75rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              textDecoration: "none",
            }}
          >
            <ExternalLink size={12} />
          </a>
        )}
      </div>

      {/* Connect form */}
      {showConnect && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            background: "var(--background)",
            borderRadius: 8,
          }}
        >
          <div
            style={{ fontSize: "0.75rem", fontWeight: 700, marginBottom: 8 }}
          >
            Conectar wallet externa
          </div>
          <div
            style={{
              fontSize: "0.7rem",
              color: "var(--text-muted)",
              marginBottom: 8,
            }}
          >
            Pega la direccion publica de tu wallet (Decaf, Freighter, Lobstr,
            etc.)
          </div>
          <input
            type="text"
            placeholder="G..."
            value={connectAddress}
            onChange={(e) => setConnectAddress(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: "var(--card)",
              color: "var(--text)",
              fontSize: "0.75rem",
              fontFamily: "monospace",
              boxSizing: "border-box",
            }}
          />
          <button
            onClick={handleConnect}
            disabled={loading || !connectAddress}
            style={{
              width: "100%",
              marginTop: 8,
              padding: "8px",
              borderRadius: 6,
              border: "none",
              background: "var(--primary)",
              color: "#fff",
              fontSize: "0.75rem",
              fontWeight: 700,
              cursor: "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Conectando..." : "Conectar wallet"}
          </button>
        </div>
      )}

      {/* Withdraw form */}
      {showWithdraw && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            background: "var(--background)",
            borderRadius: 8,
          }}
        >
          <div
            style={{ fontSize: "0.75rem", fontWeight: 700, marginBottom: 8 }}
          >
            Retirar XLM a wallet externa
          </div>
          <input
            type="number"
            placeholder="Cantidad en XLM"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            step="0.01"
            min="0.01"
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: "var(--card)",
              color: "var(--text)",
              fontSize: "0.75rem",
              boxSizing: "border-box",
            }}
          />
          <div
            style={{
              fontSize: "0.65rem",
              color: "var(--text-muted)",
              margin: "4px 0",
            }}
          >
            Disponible: {parseFloat(xlmBalance).toFixed(2)} XLM
          </div>
          <button
            onClick={handleWithdraw}
            disabled={loading || signingXDR || !withdrawAmount}
            style={{
              width: "100%",
              marginTop: 4,
              padding: "8px",
              borderRadius: 6,
              border: "none",
              background: "var(--primary)",
              color: "#fff",
              fontSize: "0.75rem",
              fontWeight: 700,
              cursor: "pointer",
              opacity: loading || signingXDR ? 0.6 : 1,
            }}
          >
            {signingXDR
              ? "Firmando con Freighter..."
              : loading
                ? "Enviando..."
                : "Enviar XLM"}
          </button>
        </div>
      )}

      {/* Export secret key */}
      {showExport && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            background: "var(--background)",
            borderRadius: 8,
          }}
        >
          <div
            style={{ fontSize: "0.75rem", fontWeight: 700, marginBottom: 4 }}
          >
            Exportar secret key
          </div>
          <div
            style={{ fontSize: "0.65rem", color: "#e74c3c", marginBottom: 8 }}
          >
            Nunca compartas tu secret key. Cualquiera con acceso puede mover tus
            fondos.
          </div>
          {!exportedKey ? (
            <>
              <input
                type="password"
                placeholder="Confirma tu password"
                value={exportPassword}
                onChange={(e) => setExportPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                  color: "var(--text)",
                  fontSize: "0.75rem",
                  boxSizing: "border-box",
                }}
              />
              <button
                onClick={handleExport}
                disabled={loading || !exportPassword}
                style={{
                  width: "100%",
                  marginTop: 8,
                  padding: "8px",
                  borderRadius: 6,
                  border: "1px solid #e74c3c",
                  background: "transparent",
                  color: "#e74c3c",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? "Verificando..." : "Revelar secret key"}
              </button>
            </>
          ) : (
            <div
              onClick={() => copyAddress(exportedKey)}
              style={{
                background: "rgba(231,76,60,0.1)",
                border: "1px solid rgba(231,76,60,0.3)",
                borderRadius: 6,
                padding: "8px 10px",
                fontSize: "0.6rem",
                fontFamily: "monospace",
                color: "#e74c3c",
                wordBreak: "break-all",
                cursor: "pointer",
              }}
            >
              {exportedKey}
              <div
                style={{
                  fontSize: "0.6rem",
                  color: "var(--text-muted)",
                  marginTop: 4,
                }}
              >
                Click para copiar. Importa esta key en Decaf, Freighter o
                Lobstr.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Decaf Wallet Download */}
      {showDecaf && (
        <div
          style={{
            marginTop: 12,
            padding: 16,
            background: "var(--background)",
            borderRadius: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "linear-gradient(135deg, #6C3CE1, #4A90D9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Smartphone size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 800 }}>
                Decaf Wallet
              </div>
              <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                La wallet mas facil para Stellar
              </div>
            </div>
          </div>

          {/* Download links */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <a
              href="https://play.google.com/store/apps/details?id=so.decaf.wallet"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 8,
                background: "rgba(46,139,63,0.12)",
                border: "1px solid rgba(46,139,63,0.3)",
                color: "var(--primary)",
                fontSize: "0.75rem",
                fontWeight: 700,
                textDecoration: "none",
                textAlign: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Download size={14} />
              Android
            </a>
            <a
              href="https://apps.apple.com/app/decaf-wallet/id1661750583"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 8,
                background: "rgba(155,89,182,0.12)",
                border: "1px solid rgba(155,89,182,0.3)",
                color: "#9B59B6",
                fontSize: "0.75rem",
                fontWeight: 700,
                textDecoration: "none",
                textAlign: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Download size={14} />
              iOS
            </a>
          </div>

          {/* QR Codes */}
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  background: "#fff",
                  borderRadius: 10,
                  padding: 10,
                  display: "inline-block",
                  marginBottom: 6,
                }}
              >
                <QRCodeSVG
                  value="https://play.google.com/store/apps/details?id=so.decaf.wallet"
                  size={100}
                  level="M"
                />
              </div>
              <div
                style={{
                  fontSize: "0.6rem",
                  color: "var(--text-muted)",
                  fontWeight: 600,
                }}
              >
                Android
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  background: "#fff",
                  borderRadius: 10,
                  padding: 10,
                  display: "inline-block",
                  marginBottom: 6,
                }}
              >
                <QRCodeSVG
                  value="https://apps.apple.com/app/decaf-wallet/id1661750583"
                  size={100}
                  level="M"
                />
              </div>
              <div
                style={{
                  fontSize: "0.6rem",
                  color: "var(--text-muted)",
                  fontWeight: 600,
                }}
              >
                iOS
              </div>
            </div>
          </div>

          {/* Video tutorial */}
          <div
            style={{
              background: "rgba(108,60,225,0.08)",
              border: "1px solid rgba(108,60,225,0.2)",
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "10px 12px",
                fontSize: "0.75rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: "#6C3CE1",
              }}
            >
              <ExternalLink size={12} />
              Tutorial: Como configurar Decaf Wallet
            </div>
            <div
              style={{
                position: "relative",
                paddingBottom: "56.25%",
                height: 0,
                overflow: "hidden",
              }}
            >
              {/* TODO: Reemplazar VIDEO_ID con el ID del video tutorial de Decaf */}
              <iframe
                src="https://www.youtube.com/embed/VIDEO_ID"
                title="Tutorial Decaf Wallet"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  border: "none",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div
          style={{
            marginTop: 10,
            padding: "8px 10px",
            borderRadius: 6,
            fontSize: "0.7rem",
            fontWeight: 600,
            background:
              message.type === "success"
                ? "rgba(46,139,63,0.15)"
                : "rgba(231,76,60,0.15)",
            color: message.type === "success" ? "var(--primary)" : "#e74c3c",
          }}
        >
          {message.text}
        </div>
      )}
    </motion.div>
  );
}
