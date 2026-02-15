"use client";

import { useEffect, useState } from 'react';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import { StitchLayout, StitchCard, ThemeToggle, StitchInput, StitchButton, StitchModal } from '../components/StitchUI';
import { AnimatePresence, motion } from 'framer-motion';

export default function Home() {
    const [patientId, setPatientId] = useState(null); // User must enter this
    const [theme, setTheme] = useState('light');
    const [analysisData, setAnalysisData] = useState(null);

    // Auth Input State
    const [inputId, setInputId] = useState("P001");
    const [showGuide, setShowGuide] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);

    // Fetch Full Analysis when Patient ID is set
    useEffect(() => {
        if (patientId) {
            runAnalysis(patientId);
        }
    }, [patientId]);

    const runAnalysis = async (id) => {
        setLoadingAnalysis(true);
        try {
            const res = await fetch(`http://localhost:8000/api/analyze/${id}`, { method: 'POST' });
            const data = await res.json();
            setAnalysisData(data);
        } catch (e) {
            console.error("Analysis Failed", e);
            alert("Failed to load diagnostic analysis.");
        } finally {
            setLoadingAnalysis(false);
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !inputId) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch(`http://localhost:8000/api/upload_data/${inputId}`, {
                method: "POST",
                body: formData
            });
            const result = await res.json();
            if (result.status === "success") {
                alert(`Data uploaded! ${result.rows} records loaded. Starting Analysis...`);
                setPatientId(inputId); // Triggers useEffect -> runAnalysis
            } else {
                alert("Upload failed: " + result.message);
            }
        } catch (err) {
            console.error(err);
            alert("Upload Error");
        } finally {
            setUploading(false);
        }
    };

    if (!patientId) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center relative overflow-hidden bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center">
                <div className="absolute inset-0 bg-white/70 backdrop-blur-sm" />

                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500/20 blur-[100px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[100px]" />
                </div>

                <StitchCard className="w-full max-w-lg border-white/40 bg-white/60 backdrop-blur-md shadow-2xl relative z-10 p-8">
                    <div className="text-center mb-10">
                        <div className="inline-block px-3 py-1 mb-4 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 text-cyan-600 text-xs font-mono tracking-wider">
                            MEDICAL DIGITAL TWIN v2.0
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2 tracking-tight">
                            Diabetes Detection
                        </h1>
                        <p className="text-gray-600 text-sm font-light">
                            Advanced Diabetic Complication Modeling & Analytics
                        </p>
                    </div>

                    <div className="space-y-6">
                        {/* Patient ID Input */}
                        <div className="relative group">
                            <StitchInput
                                label="PATIENT ID"
                                placeholder="Enter P001, P002..."
                                value={inputId}
                                onChange={(e) => setInputId(e.target.value)}
                                className="bg-white/50 border-gray-200 focus:border-cyan-500/50 transition-all text-lg tracking-wider text-gray-900 placeholder-gray-400"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-4">
                            <StitchButton
                                className="w-full bg-white/30 hover:bg-white/50 border border-gray-200 text-gray-700"
                                onClick={() => setShowGuide(true)}
                            >
                                📜 Patent Info
                            </StitchButton>

                            <label className="cursor-pointer relative group block w-full">
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-all duration-500" />
                                <div className="relative bg-white/30 border border-gray-200 rounded-xl p-3 text-center text-cyan-700 hover:text-cyan-900 transition-colors h-full flex items-center justify-center font-medium text-sm gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                    {uploading ? "Uploading..." : "Upload CSV"}
                                </div>
                                <input type="file" accept=".csv" className="hidden" onChange={handleUpload} disabled={!inputId} />
                            </label>
                        </div>

                        <StitchButton
                            className="w-full py-4 text-lg font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border-none shadow-lg shadow-cyan-900/20 text-white"
                            onClick={() => setPatientId(inputId)}
                        >
                            Data Dashboard &rarr;
                        </StitchButton>
                    </div>
                </StitchCard>

                {/* Guide Modal */}
                <StitchModal isOpen={showGuide} onClose={() => setShowGuide(false)} title="Implemented Patents">
                    <div className="space-y-4 text-sm text-gray-600">
                        <div className="p-4 bg-white/40 rounded-xl border border-gray-200">
                            <h3 className="text-cyan-600 font-bold mb-1 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-600" /> Patent 1: Propagation
                            </h3>
                            <p className="leading-relaxed">Analyzes the dependency pathways between organs (e.g. Kidney &rarr; Heart axis) to predict secondary complications using Causal Inference Models.</p>
                        </div>
                        <div className="p-4 bg-white/40 rounded-xl border border-gray-200">
                            <h3 className="text-red-600 font-bold mb-1 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-600" /> Patent 2: Physiological Drift
                            </h3>
                            <p className="leading-relaxed">Detects latent tissue degeneration by measuring the Mean Squared Error (MSE) deviation from a personalized healthy baseline over time.</p>
                        </div>
                    </div>
                </StitchModal>
            </div>
        );
    }

    return (
        <StitchLayout theme={theme}>
            {/* Header / Nav */}
            <div className={`fixed top-0 left-0 right-0 h-16 backdrop-blur-xl border-b flex justify-between items-center px-6 z-50 ${theme === 'light' ? 'bg-white/60 border-gray-200 text-gray-900' : 'bg-black/60 border-white/5 text-white'}`}>
                <div className="flex items-center gap-6">
                    <div className={`text-xl font-bold tracking-tight flex items-center gap-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-mono text-xs">DD</div>
                        Diabetes Detection
                    </div>
                    <div className={`h-6 w-px ${theme === 'light' ? 'bg-gray-300' : 'bg-white/10'}`} />
                    <div className="flex items-center gap-3">
                        <div className={`px-3 py-1 border rounded-full text-xs font-mono ${theme === 'light' ? 'bg-gray-100 border-gray-300 text-gray-600' : 'bg-white/5 border-white/10 text-gray-300'}`}>
                            ID: <span className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{patientId}</span>
                        </div>
                        {loadingAnalysis && (
                            <div className="flex items-center gap-2 text-xs text-cyan-600">
                                <div className="w-2 h-2 rounded-full bg-cyan-600 animate-pulse" />
                                Processing Neural Networks...
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <ThemeToggle theme={theme} toggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')} />
                    <button onClick={() => setPatientId(null)} className="px-4 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-medium border border-red-500/20 transition-colors">
                        Disconnect
                    </button>
                </div>
            </div>

            {/* Main Dashboard Content */}
            <div className={`pt-20 min-h-screen box-border ${theme === 'light' ? 'bg-gray-50' : 'bg-[#050505]'}`}>
                <AnalyticsDashboard analysisData={analysisData} patientId={patientId} theme={theme} />
            </div>

        </StitchLayout>
    );
}
