import React from 'react';
import { MessageSquare } from 'lucide-react';

const WelcomeState = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-purple-950/20 backdrop-blur-sm">
            <div className="relative mb-8">
                {/* Decorative background glow */}
                <div className="absolute inset-0 bg-purple-500 blur-3xl opacity-20 animate-pulse"></div>

                {/* Welcome Illustration Icon */}
                <div className="relative bg-purple-900/40 p-6 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(192,132,252,0.2)] animate-float">
                    <MessageSquare size={64} className="text-white" />
                </div>
            </div>

            <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
                Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-white">ChatWave</span>
            </h1>

            <p className="text-purple-200/70 text-lg max-w-md mx-auto leading-relaxed">
                Connect with your friends and start a conversation. Select a person from the sidebar to begin messaging.
            </p>

            {/* Quick Stats or Tips (Optional aesthetic touch) */}
            <div className="mt-12 flex gap-4 opacity-70">
                <div className="px-4 py-2 bg-purple-900/30 rounded-full border border-white/10 text-xs text-purple-100">
                    Encrypted
                </div>
                <div className="px-4 py-2 bg-purple-900/30 rounded-full border border-white/10 text-xs text-purple-100">
                    Real-time
                </div>
                <div className="px-4 py-2 bg-purple-900/30 rounded-full border border-white/10 text-xs text-purple-100">
                    Multimedia
                </div>
            </div>
        </div>
    );
};

export default WelcomeState;
