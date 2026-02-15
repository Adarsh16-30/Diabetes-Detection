"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

// --- 1. Micro-Interactions: StitchButton ---
export const StitchButton = ({ children, onClick, variant = "primary", className = "" }) => {
    return (
        <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`relative overflow-hidden px-6 py-3 rounded-xl font-medium transition-all duration-300 ${variant === "primary"
                    ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)] hover:shadow-[0_0_30px_rgba(6,182,212,0.7)]"
                    : "bg-white/10 backdrop-blur-md text-cyan-100 border border-white/10 hover:bg-white/20"
                } ${className}`}
            onClick={onClick}
        >
            <span className="relative z-10">{children}</span>
            {/* Ripple effect could be added here, but framer-motion tap scale covers the tactile feel */}
        </motion.button>
    );
};

// --- 3. Glassmorphism & 6. Card Hover Effects: StitchCard ---
export const StitchCard = ({ children, className = "", delay = 0 }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: delay }}
            whileHover={{
                y: -5,
                boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
            }}
            className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl ${className}`}
        >
            {children}
        </motion.div>
    );
};

// --- 1. Input Field Focus Animation: StitchInput ---
export const StitchInput = ({ label, type = "text", value, onChange, placeholder }) => {
    const [focused, setFocused] = useState(false);

    return (
        <div className="relative mb-6">
            <motion.label
                initial={{ y: 0, color: "#9ca3af" }}
                animate={{
                    y: focused || value ? -24 : 0,
                    color: focused ? "#22d3ee" : "#9ca3af",
                    scale: focused || value ? 0.85 : 1
                }}
                className="absolute left-0 top-3 pointer-events-none origin-left"
            >
                {label}
            </motion.label>
            <input
                type={type}
                value={value}
                onChange={onChange}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className="w-full bg-transparent border-b-2 border-gray-700 py-2 text-white focus:outline-none focus:border-cyan-400 transition-colors duration-300"
                placeholder={focused ? placeholder : ""}
            />
        </div>
    );
};

// --- 9. Smooth Modals: StitchModal ---
export const StitchModal = ({ isOpen, onClose, title, children }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />
                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 m-auto w-full max-w-lg h-fit bg-[#0f172a] border border-cyan-500/30 rounded-2xl p-8 shadow-2xl z-50 overflow-hidden"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                                {title}
                            </h2>
                            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                                ✕
                            </button>
                        </div>
                        {children}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

// --- 14. Subtle Background Motion & 2. Page Transitions: StitchLayout ---
export const StitchLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-[#050505] text-white overflow-hidden relative selection:bg-cyan-500/30">
            {/* Background Blobs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    animate={{
                        x: [0, 100, 0],
                        y: [0, -50, 0],
                        scale: [1, 1.2, 1]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-20%] left-[-10%] w-[50rem] h-[50rem] bg-purple-900/20 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{
                        x: [0, -100, 0],
                        y: [0, 50, 0],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-[-20%] right-[-10%] w-[40rem] h-[40rem] bg-cyan-900/20 rounded-full blur-[100px]"
                />
            </div>

            {/* Content Transition */}
            <motion.main
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} // Custom cubic bezier for smooth feel
                className="relative z-10"
            >
                {children}
            </motion.main>
        </div>
    );
};

// --- 11. Interactive Charts: StitchCounter ---
export const StitchCounter = ({ value, label }) => {
    return (
        <div className="flex flex-col">
            <span className="text-gray-400 text-sm uppercase tracking-wider">{label}</span>
            <div className="flex items-baseline gap-1">
                <motion.span
                    key={value}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-bold font-mono text-white"
                >
                    {value}
                </motion.span>
            </div>
        </div>
    );
};
