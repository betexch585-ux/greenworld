import React from 'react';
import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
  whatsappNumber?: string;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({ whatsappNumber = '+923008829102' }) => {
  const cleanNumber = whatsappNumber.replace(/[^\d+]/g, '').replace(/^\+/, '');

  const handleClick = () => {
    const defaultMsg = encodeURIComponent('Hello GreenWorld Support, I need assistance with my account.');
    const waUrl = `https://wa.me/${cleanNumber}?text=${defaultMsg}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 animate-bounce-subtle">
      <button
        onClick={handleClick}
        title="Contact Official WhatsApp Customer Support"
        className="group relative flex items-center gap-2.5 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-emerald-400/50 hover:scale-105 active:scale-95"
      >
        {/* Animated Green Pulse Indicator */}
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>

        {/* WhatsApp Icon */}
        <MessageCircle className="w-5 h-5 text-white" />

        <span className="hidden sm:inline font-semibold tracking-wide text-xs">
          WhatsApp Support
        </span>

        {/* Tooltip on Hover */}
        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block whitespace-nowrap bg-slate-900 text-white text-[10px] px-2.5 py-1 rounded-lg shadow-md font-mono">
          Click to chat on WhatsApp ({whatsappNumber})
        </div>
      </button>
    </div>
  );
};
