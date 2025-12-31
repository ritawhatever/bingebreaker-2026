import React, { useState, useEffect, useRef } from 'react';
import { getCoachResponse } from '../services/gemini';
import { getChatHistory, saveChatHistory } from '../services/storage';
import { ChatMessage } from '../types';
import { Send, User, Bot, AlertTriangle, Loader2, Gamepad2, Brain, Wind, Smile, Sparkles, Newspaper, Quote } from 'lucide-react';

const AICoach: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load initial history or start fresh
    const history = getChatHistory();
    if (history.length === 0) {
      const initial: ChatMessage = {
        id: 'init',
        role: 'model',
        text: "Hi! I'm here to distract you from cravings. Want to play a quick game or answer some trivia to get your mind off food?",
        timestamp: Date.now()
      };
      setMessages([initial]);
    } else {
      setMessages(history);
    }
  }, []);

  useEffect(() => {
    saveChatHistory(messages);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Prepare history for Gemini API (convert internal ChatMessage to API format)
      // We only take the last 10 messages to save context/tokens contextually
      const apiHistory = messages.slice(-10).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const responseText = await getCoachResponse(userMsg.text, apiHistory);

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderMessageText = (text: string, isUser: boolean) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a 
            key={i} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={`underline break-all font-medium ${isUser ? 'text-cyan-200 hover:text-white' : 'text-cyan-600 hover:text-cyan-800'}`}
          >
            {part}
          </a>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-xl shadow-md overflow-hidden border border-slate-100">
      <div className="bg-cyan-600 p-4 text-white flex flex-col gap-3 shadow-sm z-10">
        <div className="flex justify-between items-center">
            <h2 className="font-bold text-lg flex items-center gap-2">
                <Bot size={20} /> Coach Gemini
            </h2>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button 
                onClick={() => handleSend("Distract me with a quick mental game (like 5-4-3-2-1 or alphabet game)!")}
                className="bg-cyan-500 hover:bg-cyan-400 text-white text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1 transition-colors border border-cyan-400 whitespace-nowrap shadow-sm"
            >
                <Gamepad2 size={14} /> Game
            </button>
            <button 
                onClick={() => handleSend("Give me a fun trivia question to guess. Don't tell me the answer yet!")}
                className="bg-sky-500 hover:bg-sky-400 text-white text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1 transition-colors border border-sky-400 whitespace-nowrap shadow-sm"
            >
                <Brain size={14} /> Trivia
            </button>
            <button 
                onClick={() => handleSend("Guide me through a quick breathing exercise to kill a craving.")}
                className="bg-teal-500 hover:bg-teal-400 text-white text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1 transition-colors border border-teal-400 whitespace-nowrap shadow-sm"
            >
                <Wind size={14} /> Breathe
            </button>
            <button 
                onClick={() => handleSend("Tell me a funny joke to distract me.")}
                className="bg-blue-400 hover:bg-blue-300 text-white text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1 transition-colors border border-blue-300 whitespace-nowrap shadow-sm"
            >
                <Smile size={14} /> Joke
            </button>
            <button 
                onClick={() => handleSend("Tell me one interesting news story from this week (any topic) to distract me.")}
                className="bg-indigo-400 hover:bg-indigo-300 text-white text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1 transition-colors border border-indigo-300 whitespace-nowrap shadow-sm"
            >
                <Newspaper size={14} /> News
            </button>
            <button 
                onClick={() => handleSend("Give me an inspiring quote that encourages me to lose weight and achieve my goals.")}
                className="bg-violet-400 hover:bg-violet-300 text-white text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1 transition-colors border border-violet-300 whitespace-nowrap shadow-sm"
            >
                <Quote size={14} /> Quote
            </button>
            <button 
                onClick={() => handleSend("Pretend to be my future self from July 2026 (53kg). Talk to me about the choice I'm about to make right now. Be compassionate but firm.")}
                className="bg-fuchsia-400 hover:bg-fuchsia-300 text-white text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1 transition-colors border border-fuchsia-300 whitespace-nowrap shadow-sm"
            >
                <Sparkles size={14} /> Future Me
            </button>
            <button 
                onClick={() => handleSend("I am about to binge eat snacks right now! Help me stop!")}
                className="bg-rose-500 hover:bg-rose-600 text-white text-xs px-3 py-1.5 rounded-full font-bold animate-pulse flex items-center gap-1 whitespace-nowrap shadow-sm"
            >
                <AlertTriangle size={14} /> SOS
            </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm ${
              msg.role === 'user' 
                ? 'bg-cyan-600 text-white rounded-br-none' 
                : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {renderMessageText(msg.text, msg.role === 'user')}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-200 p-3 rounded-2xl rounded-bl-none flex items-center gap-2 text-slate-500 text-sm">
              <Loader2 className="animate-spin" size={16} /> Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type here..."
          className="flex-1 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none text-sm"
        />
        <button 
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="bg-cyan-600 text-white p-2 rounded-lg hover:bg-cyan-700 disabled:bg-slate-300"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default AICoach;