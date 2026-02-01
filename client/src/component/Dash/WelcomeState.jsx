import React from 'react';
import { MessageSquare } from 'lucide-react';

const WelcomeState = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-100 backdrop-blur-sm">
            <div className="relative mb-8">
                {/* Decorative background glow */}
                <div className="absolute inset-0 bg-blue-300 blur-3xl opacity-20 animate-pulse"></div>

                {/* Welcome Illustration Icon */}
                <div className="relative bg-blue-900/60 p-6 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(217,132,252,0.7)] animate-float">
                    <MessageSquare size={64} className="text-white" />
                </div>
            </div>

            <h1 className="text-4xl font-bold text-gray-500 mb-4 tracking-tight">
                Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-red-300">weChat</span>
            </h1>

            <p className="text-gray-500 text-lg max-w-md mx-auto leading-relaxed">
                Connect with your friends and start a conversation. Select a person from the sidebar to begin messaging.
            </p>

            {/* Quick Stats or Tips (Optional aesthetic touch) */}
            <div className="mt-12 flex gap-4 opacity-90">
                <div className="px-4 py-2 bg-blue-400 rounded-full border border-white/10 text-xs text-purple-100">
                    Encrypted
                </div>
                <div className="px-4 py-2 bg-blue-400 rounded-full border border-white/10 text-xs text-purple-100">
                    Real-time
                </div>
                <div className="px-4 py-2 bg-blue-400 rounded-full border border-white/10 text-xs text-purple-100">
                    Multimedia
                </div>
            </div>
        </div>
    );
};

export default WelcomeState;
