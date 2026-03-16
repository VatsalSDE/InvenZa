import React, { useState } from "react";
import { MessageCircle, Bot, X, Sparkles } from "lucide-react";

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat Window - Coming Soon */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[400px] bg-[#1A1A1A] rounded-2xl shadow-2xl border border-[#2A2A2A] flex flex-col z-50">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">AI Assistant</h3>
                <p className="text-sm text-green-100">Powered by AI</p>
              </div>
            </div>
          </div>

          {/* Coming Soon Message */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500/20 to-emerald-500/10 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="w-10 h-10 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">AI Features Coming Soon</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Our intelligent assistant is being trained to help you with inventory management, 
              sales insights, and business analytics. Stay tuned for updates!
            </p>
            <div className="mt-6 flex gap-2 flex-wrap justify-center">
              <span className="px-3 py-1 text-xs bg-[#222222] text-zinc-400 rounded-full border border-[#2A2A2A]">
                Smart Inventory Analysis
              </span>
              <span className="px-3 py-1 text-xs bg-[#222222] text-zinc-400 rounded-full border border-[#2A2A2A]">
                Sales Predictions
              </span>
              <span className="px-3 py-1 text-xs bg-[#222222] text-zinc-400 rounded-full border border-[#2A2A2A]">
                Business Insights
              </span>
            </div>
          </div>

          {/* Disabled Input */}
          <div className="p-4 border-t border-[#2A2A2A]">
            <div className="flex gap-2">
              <input
                type="text"
                disabled
                placeholder="AI chat coming soon..."
                className="flex-1 px-4 py-2 bg-[#222222] border border-[#2A2A2A] text-zinc-500 rounded-xl focus:outline-none cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatbot;
