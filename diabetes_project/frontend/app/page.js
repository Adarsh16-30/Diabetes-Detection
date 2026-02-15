"use client";

import { useEffect, useState, useRef } from 'react';
import Scene from '../components/Scene';
import HUD from '../components/HUD';
import { StitchLayout, StitchCard, ThemeToggle } from '../components/StitchUI';
import { AnimatePresence, motion } from 'framer-motion';

export default function Home() {
    const [theme, setTheme] = useState('dark');
    const [vitals, setVitals] = useState({ gfr: 90, retina: 250, hrv: 50 });
    const [drifts, setDrifts] = useState({ kidney: 0, heart: 0, retina: 0 });
    const [blockchain, setBlockchain] = useState([]);
    const [alert, setAlert] = useState(null);
    const [ragContext, setRagContext] = useState(null);
    const [processing, setProcessing] = useState(false);


    const ws = useRef(null);

    useEffect(() => {
        // Connect to Python Backend
        ws.current = new WebSocket("ws://localhost:8000/ws/stream");

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("Stream Data:", data);

            // 1. Update Vitals
            setVitals(data.vitals);

            // 2. Update Drift & Design Mode
            // Mock mapping from alert/propagation to drift 0-1
            if (data.propagation) {
                setDrifts({
                    kidney: data.propagation.kidney || 0,
                    heart: data.propagation.heart || 0,
                    retina: data.propagation.retina || 0
                });
                // Trigger Antigravity Animation
                setProcessing(true);
                setTimeout(() => setProcessing(false), 800);
            }



            // 3. Update Blockchain (Prepend new block)
            if (data.latest_block_hash && data.latest_block_hash !== "0") {
                setBlockchain(prev => {
                    // Avoid dupes
                    if (prev.length > 0 && prev[0].hash === data.latest_block_hash) return prev;
                    return [{
                        index: prev.length,
                        hash: data.latest_block_hash,
                        data: { zk_proof: data.zk_proof }
                    }, ...prev].slice(0, 10);
                });
            }

            // 4. Handle Alerts (Trigger RAG)
            if (data.alert && data.alert.alert) {
                setAlert(data.alert);
                fetchExplanation(data.propagation);
            } else {
                setAlert(null);
            }
        };

        return () => ws.current?.close();
    }, []);

    const fetchExplanation = async (propagationData) => {
        try {
            const res = await fetch("http://localhost:8000/api/explain", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ patient_id: "P001", organ_drifts: propagationData })
            });
            const context = await res.json();
            setRagContext(context);
        } catch (e) {
            console.error("RAG Failed", e);
        }
    };

    return (
        <StitchLayout theme={theme}>
            <div className="absolute top-6 right-6 z-50">
                <ThemeToggle theme={theme} toggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')} />
            </div>

            <Scene vitals={vitals} drifts={drifts} onOrganClick={(organ) => console.log(organ)} />

            <AnimatePresence>
                {alert && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-40">
                        <motion.line
                            x1="10%" y1="10%"
                            x2="90%" y2="10%"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            exit={{ opacity: 0 }}
                            stroke="url(#beamGradient)"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                        />
                        <defs>
                            <linearGradient id="beamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#a855f7" />
                                <stop offset="100%" stopColor="#ef4444" />
                            </linearGradient>
                        </defs>
                    </svg>
                )}
            </AnimatePresence>

            <HUD vitals={vitals} drifts={drifts} blockchain={blockchain} />

            <AnimatePresence>
                {alert && ragContext && (
                    <div className="absolute bottom-10 right-10 z-50">
                        <StitchCard className="w-[30rem] border-cyan-500/50">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-cyan-400">CAUSAL PROPAGATION DETECTED</h2>
                                    <p className="text-xs text-cyan-200/70 font-mono mt-1">AI AGENT: DIAGNOSTIC COUNCIL</p>
                                </div>
                                <button onClick={() => setAlert(null)} className="text-gray-400 hover:text-white transition-colors">x</button>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-cyan-900/20 p-3 rounded border-l-2 border-cyan-500">
                                    <p className="text-sm text-gray-300">{ragContext.explanation}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-white/5 p-2 rounded">
                                        <span className="text-gray-400 block mb-1">SIMILAR CASE</span>
                                        <span className="text-white font-mono">{ragContext.similar_case?.outcome || "Analyzing..."}</span>
                                    </div>
                                    <div className="bg-white/5 p-2 rounded">
                                        <span className="text-gray-400 block mb-1">SOURCE</span>
                                        <span className="text-white font-mono italic truncate">{ragContext.source?.title}</span>
                                    </div>
                                </div>
                            </div>
                        </StitchCard>
                    </div>
                )}
            </AnimatePresence>
        </StitchLayout>
    );
}
