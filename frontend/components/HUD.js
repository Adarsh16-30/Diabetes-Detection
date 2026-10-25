"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Activity, Radio, ShieldCheck, FileText } from "lucide-react";
import { StitchCard, StitchCounter } from "./StitchUI";

export default function HUD({ vitals, drifts, blockchain, patientId }) {
    return (
        <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between z-30">

            {/* Top Bar: Patient Status */}
            <header className="flex justify-between items-center pointer-events-auto">
                <StitchCard className="!p-4 border-cyan-500/30">
                    <h1 className="text-2xl font-bold text-cyan-400 font-mono tracking-wider flex items-center gap-2">
                        <Activity className="w-6 h-6 animate-pulse" />
                        NEURO-CAUSAL TWIN
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">
                        PATIENT ID: <span className="text-white font-bold">{patientId || 'CONNECTING...'}</span> | STATUS: <span className="text-green-400">MONITORING</span>
                    </p>
                </StitchCard>

                <div className="flex gap-4">
                    <StitchCard className="!p-2 !px-4 border-purple-500/30" delay={0.1} title="Glomerular Filtration Rate (Kidney Health)">
                        <StitchCounter value={vitals.gfr?.toFixed(1) || '--'} label="KIDNEY (GFR)" />
                    </StitchCard>
                    <StitchCard className="!p-2 !px-4 border-pink-500/30" delay={0.2} title="Retina Thickness in Micrometers">
                        <StitchCounter value={vitals.retina?.toFixed(0) || '--'} label="RETINA (µm)" />
                    </StitchCard>
                    <StitchCard className="!p-2 !px-4 border-yellow-500/30" delay={0.3} title="Blood Glucose Level">
                        <StitchCounter value={vitals.glucose?.toFixed(0) || '--'} label="GLUCOSE (mg/dL)" />
                    </StitchCard>
                </div>
            </header>

            {/* Bottom Left: Blockchain Stream */}
            <StitchCard className="w-96 !p-0 border-green-500/20 overflow-hidden pointer-events-auto" delay={0.3}>
                <div className="bg-green-900/20 p-2 border-b border-green-500/20 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-green-400" />
                    <span className="text-xs font-mono text-green-400">ZK-PROOF LEDGER</span>
                </div>
                <div className="h-48 overflow-y-auto p-3 font-mono text-[10px] space-y-2 scrollbar-hide">
                    <AnimatePresence>
                        {blockchain.map((block, i) => (
                            <motion.div
                                key={block.hash || i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="border-l-2 border-green-500/50 pl-2 py-1 bg-white/5 rounded-r"
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
            </StitchCard>
        </div>
    );
}
