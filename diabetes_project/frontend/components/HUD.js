"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Activity, Radio, ShieldCheck, FileText } from "lucide-react";

export default function HUD({ vitals, drifts, blockchain }) {
    // vitals: { gfr: 90, retina: 250, hrv: 50 }
    // drifts: { kidney: 0.1, ... }

    return (
        <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">

            {/* Top Bar: Patient Status */}
            <header className="flex justify-between items-center pointer-events-auto">
                <div className="bg-black/60 backdrop-blur-md p-4 rounded-xl border border-cyan-500/30">
                    <h1 className="text-2xl font-bold text-cyan-400 font-mono tracking-wider flex items-center gap-2">
                        <Activity className="w-6 h-6 animate-pulse" />
                        NEURO-CAUSAL TWIN
                    </h1>
                    <p className="text-xs text-gray-400">PATIENT ID: <span className="text-white">P-001</span> | STATUS: MONITORING</p>
                </div>

                <div className="flex gap-4">
                    <div className="bg-black/60 backdrop-blur-md p-2 px-4 rounded-lg border border-purple-500/30">
                        <p className="text-xs text-purple-400 font-mono mb-1">KIDNEY (GFR)</p>
                        <p className="text-xl font-bold text-white">{vitals.gfr?.toFixed(1) || '--'}</p>
                    </div>
                    <div className="bg-black/60 backdrop-blur-md p-2 px-4 rounded-lg border border-pink-500/30">
                        <p className="text-xs text-pink-400 font-mono mb-1">RETINA (µm)</p>
                        <p className="text-xl font-bold text-white">{vitals.retina?.toFixed(0) || '--'}</p>
                    </div>
                </div>
            </header>

            {/* Bottom Left: Blockchain Stream */}
            <div className="w-96 bg-black/80 backdrop-blur-md rounded-xl border border-green-500/20 overflow-hidden pointer-events-auto">
                <div className="bg-green-900/20 p-2 border-b border-green-500/20 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-green-400" />
                    <span className="text-xs font-mono text-green-400">ZK-PROOF LEDGER</span>
                </div>
                <div className="h-48 overflow-y-auto p-2 font-mono text-[10px] space-y-1 scrollbar-hide">
                    <AnimatePresence>
                        {blockchain.map((block, i) => (
                            <motion.div
                                key={block.hash || i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="border-l-2 border-green-500/50 pl-2 py-1"
                            >
                                <span className="text-gray-500">[{block.index}]</span>
                                <span className="text-green-300 ml-2">{block.hash?.substring(0, 16)}...</span>
                                {block.data?.zk_proof && (
                                    <div className="text-yellow-500 mt-1 ml-4 flex items-center gap-1">
                                        <ShieldCheck className="w-3 h-3" /> VERIFIED ZK-PROOF
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {blockchain.length === 0 && <p className="text-gray-600 italic">Waiting for blocks...</p>}
                </div>
            </div>

            {/* Right Side: Alerts/RAG (Context) */}
            {/* Implemented as a popup in the main page when clicked */}
        </div>
    );
}
