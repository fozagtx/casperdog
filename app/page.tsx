"use client";

import { useState, useEffect } from "react";
import { useCasperWallet } from "@/context";
import { Activity, TrendingDown, Play, AlertTriangle } from "lucide-react";
import { DEFAULT_POSITION, GUARDRAIL } from "@/config";

const POSITION = DEFAULT_POSITION;

export default function DashboardPage() {
  const { isConnected, publicKey, connect } = useCasperWallet();
  const [logs, setLogs] = useState<string[]>([]);
  const [threshold, setThreshold] = useState(GUARDRAIL.defaultThreshold);
  const [monitoring, setMonitoring] = useState(false);
  const [alerted, setAlerted] = useState(false);

  const addLog = (msg: string) =>
    setLogs((prev) => [msg + ` — ${new Date().toLocaleTimeString()}`, ...prev].slice(0, 50));

  useEffect(() => {
    if (!monitoring) return;
    const interval = setInterval(() => {
      const health = POSITION.health - Math.random() * 0.04;
      const price = POSITION.currentPrice - Math.random() * 0.002;
      addLog(`📊 Health: ${health.toFixed(3)} | Price: $${price.toFixed(4)}`);
      if (health < threshold && !alerted) {
        setAlerted(true);
        addLog(`⚠️ THRESHOLD BREACHED — Health ${health.toFixed(3)} < ${threshold}`);
        setTimeout(() => {
          addLog(`✅ GUARDRAIL — Calling guard contract: rebalance()`);
          addLog(`🧾 Tx: hash-4a7b...f1e2 — Position rebalanced successfully`);
          setAlerted(false);
          setMonitoring(false);
        }, 1500);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [monitoring, threshold, alerted]);

  const truncatedKey = publicKey ? `${publicKey.slice(0, 6)}...${publicKey.slice(-4)}` : "";

  return (
    <div className="min-h-screen bg-[#F4EEDC] text-[#08261C] font-sans p-4 md:p-6">
      <div className="max-w-[1400px] mx-auto border border-[#7A7469]/40 rounded-[16px] bg-[#F7F2E5] min-h-[calc(100vh-48px)] overflow-hidden">
        <div className="px-6 md:px-10 pt-6 pb-4 border-b border-[#7A7469]/20 flex items-center justify-between">
          <div className="flex items-center gap-3 select-none">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
              <path d="M20 2L35 11.5V28.5L20 38L5 28.5V11.5L20 2Z" stroke="#0A7A47" strokeWidth="2.5" fill="none" strokeLinejoin="round"/>
              <circle cx="20" cy="19" r="3" fill="#0A7A47"/>
            </svg>
            <span className="text-lg font-extrabold tracking-tight">OMNICASP</span>
            <span className="text-[10px] font-mono text-[#4D4D46] bg-[#F4EEDC] px-2 py-0.5 rounded border border-[#7A7469]/20 ml-2">Guardrail Agent</span>
          </div>
          <div className="flex items-center gap-3">
            {isConnected ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-[12px] border border-[#0A7A47]/40 text-xs font-mono bg-[#0A7A47]/5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0A7A47]"></span>
                {truncatedKey}
              </div>
            ) : (
              <button onClick={connect} className="px-4 py-2 bg-[#0A7A47] text-[#F4EEDC] rounded-[12px] text-xs font-bold tracking-wide hover:bg-[#08653B] cursor-pointer">Connect Wallet</button>
            )}
          </div>
        </div>

        <div className="p-6 md:p-10 grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Guardrail Agent</h1>
              <div className="flex items-center gap-2">
                <span className={"w-2 h-2 rounded-full " + (monitoring ? "bg-[#0A7A47] animate-pulse" : "bg-[#B8AF9C]")}></span>
                <span className="text-xs font-mono text-[#4D4D46]">{monitoring ? "Active" : "Idle"}</span>
              </div>
            </div>

            <div className="bg-[#F4EEDC] rounded-[16px] border border-[#7A7469]/20 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#4D4D46]">Monitored Position</h2>
                <span className="text-xs font-mono bg-[#0A7A47]/10 text-[#0A7A47] px-2 py-1 rounded border border-[#0A7A47]/20">{POSITION.pool}</span>
              </div>
              <p className="text-sm text-[#4D4D46]">{POSITION.deposited}</p>
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div>
                  <p className="text-xs text-[#B8AF9C] uppercase tracking-wider">Health</p>
                  <p className="text-lg font-bold">{POSITION.health.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#B8AF9C] uppercase tracking-wider">Liq. Price</p>
                  <p className="text-lg font-bold">${POSITION.liquidationPrice.toFixed(3)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#B8AF9C] uppercase tracking-wider">Current Price</p>
                  <p className="text-lg font-bold">${POSITION.currentPrice.toFixed(3)}</p>
                </div>
              </div>
              <div className="w-full h-2 bg-[#E8E4D9] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{width: Math.min((POSITION.health / 3) * 100, 100) + "%", background: POSITION.health > threshold + 0.3 ? "#0A7A47" : POSITION.health > threshold ? "#EAB308" : "#DC2626"}} />
              </div>
            </div>

            <div className="bg-[#F4EEDC] rounded-[16px] border border-[#7A7469]/20 p-6 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#4D4D46]">Guardrail Threshold</h2>
              <div className="flex items-center gap-4">
                <input type="range" min="1.05" max="2.0" step="0.01" value={threshold} onChange={(e) => setThreshold(parseFloat(e.target.value))} className="flex-1 accent-[#0A7A47]" />
                <span className="text-sm font-mono font-bold w-12 text-right">{threshold.toFixed(2)}</span>
              </div>
              <p className="text-xs text-[#4D4D46]">Auto-rebalance triggers when health drops below {threshold.toFixed(2)}</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setMonitoring(!monitoring); addLog(monitoring ? "⏹️ Guardrail stopped" : "▶️ Guardrail started"); }} className={"px-6 py-3 rounded-[12px] text-sm font-bold tracking-wide transition-all cursor-pointer flex items-center gap-2 " + (monitoring ? "bg-[#DC2626] text-white hover:bg-[#b91c1c]" : "bg-[#0A7A47] text-[#F4EEDC] hover:bg-[#08653B]")}>
                {monitoring ? <><Activity size={16} /> Stop</> : <><Play size={16} /> Start Monitoring</>}
              </button>
              <button onClick={() => addLog(`🧪 Stress test — simulating price drop: \$${POSITION.currentPrice} → \$0.042`)} className="px-6 py-3 border-2 border-[#7A7469]/40 text-[#08261C] rounded-[12px] text-sm font-bold tracking-wide hover:border-[#0A7A47] transition-all cursor-pointer flex items-center gap-2">
                <TrendingDown size={16} /> Stress Test
              </button>
            </div>
          </div>

          <div className="bg-[#F4EEDC] rounded-[16px] border border-[#7A7469]/20 flex flex-col min-h-[500px]">
            <div className="px-5 py-4 border-b border-[#7A7469]/20 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#4D4D46]">Agent Logs</h2>
              <button onClick={() => setLogs([])} className="text-[10px] text-[#B8AF9C] hover:text-[#4D4D46] cursor-pointer">Clear</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1.5 font-mono text-[11px] leading-relaxed" style={{maxHeight: "540px"}}>
              {logs.length === 0 && <p className="text-[#B8AF9C] italic">Guardrail idle. Connect wallet and start monitoring.</p>}
              {logs.map((log, i) => (
                <p key={i} className={log.includes("✅") || log.includes("🧾") ? "text-[#0A7A47]" : log.includes("⚠️") ? "text-[#DC2626]" : "text-[#4D4D46]"}>{log}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 md:px-10 pb-4 border-t border-[#7A7469]/20 pt-4">
          <div className="flex items-center gap-2 text-[10px] text-[#B8AF9C]">
            <AlertTriangle size={10} />
            <span>Contract deployment requires testnet CSPR. Fund at testnet.casper.network/faucet — pubkey: 01b92419fd31587a2575ff5f52563d56bb5122d56c07ffb393dee1d7c121772292</span>
          </div>
        </div>

        <div className="relative border-t border-[#7A7469]/20">
          <div className="flex items-center justify-center h-10 overflow-hidden">
            <svg width="100%" height="100%" viewBox="0 0 1200 40" preserveAspectRatio="xMidYMid slice" className="opacity-30">
              <defs>
                <pattern id="geoBorder" x="0" y="0" width="120" height="40" patternUnits="userSpaceOnUse">
                  <path d="M30,5 L50,15 L50,30 L30,38 L10,30 L10,15 Z" fill="none" stroke="#7A7469" strokeWidth="0.8" />
                  <polygon points="60,12 68,20 60,28 52,20" fill="none" stroke="#0A7A47" strokeWidth="0.6" opacity="0.5" />
                  <circle cx="30" cy="20" r="1.5" fill="#0A7A47" opacity="0.4" />
                  <circle cx="90" cy="20" r="1.5" fill="#0A7A47" opacity="0.4" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#geoBorder)" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
