import React, { useState, useEffect, useRef } from 'react';
import { getCoachResponse } from '../services/gemini';
import { getChatHistory, saveChatHistory } from '../services/storage';
import { ChatMessage } from '../types';
import { Send, User, Bot, AlertTriangle, Loader2, Gamepad2, Brain, Wind, Smile, Sparkles, Newspaper } from 'lucide-react';

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
            className={`underline break-all font-medium ${isUser ? 'text-teal-200 hover:text-white' : 'text-teal-600 hover:text-teal-800'}`}
          >
            {part}
          </a>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-xl shadow-md overflow-hidden">
      <div className="bg-teal-600 p-4 text-white flex flex-col gap-3">
        <div className="flex justify-between items-center">
            <h2 className="font-bold text-lg flex items-center gap-2">
                <Bot size={20} /> Coach Gemini
            </h2>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button 
                onClick={() => handleSend("Distract me with a quick mental game (like 5-4-3-2-1 or alphabet game)!")}
                className="bg-teal-500 hover:bg-teal-400 text-white text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1 transition-colors border border-teal-400 whitespace-nowrap"
            >
                <Gamepad2 size={14} /> Game
            </button>
            <button 
                onClick={() => handleSend("Give me a fun trivia question to guess. Don't tell me the answer yet!")}
                className="bg-indigo-500 hover:bg-indigo-400 text-white text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1 transition-colors border border-indigo-400 whitespace-nowrap"
            >
                <Brain size={14} /> Trivia
            </button>
            <button 
                onClick={() => handleSend("Guide me through a quick breathing exercise to kill a craving.")}
                className="bg-sky-500 hover:bg-sky-400 text-white text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1 transition-colors border border-sky-400 whitespace-nowrap"
            >
                <Wind size={14} /> Breathe
            </button>
            <button 
                onClick={() => handleSend("Tell me a funny joke to distract me.")}
                className="bg-yellow-500 hover:bg-yellow-400 text-white text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1 transition-colors border border-yellow-400 whitespace-nowrap"
            >
                <Smile size={14} /> Joke
            </button>
            <button 
                onClick={() => handleSend("Tell me one interesting news story from this week (any topic) to distract me.")}
                className="bg-blue-500 hover:bg-blue-400 text-white text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1 transition-colors border border-blue-400 whitespace-nowrap"
            >
                <Newspaper size={14} /> News
            </button>
            <button 
                onClick={() => handleSend("Describe my future self in July 2026 at 53kg to motivate me.")}
                className="bg-purple-500 hover:bg-purple-400 text-white text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1 transition-colors border border-purple-400 whitespace-nowrap"
            >
                <Sparkles size={14} /> Future Me
            </button>
            <button 
                onClick={() => handleSend("I am about to binge eat snacks right now! Help me stop!")}
                className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded-full font-bold animate-pulse flex items-center gap-1 whitespace-nowrap"
            >
                <AlertTriangle size={14} /> SOS
            </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] p-3 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-teal-600 text-white rounded-br-none' 
                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {renderMessageText(msg.text, msg.role === 'user')}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 p-3 rounded-2xl rounded-bl-none flex items-center gap-2 text-gray-500 text-sm">
              <Loader2 className="animate-spin" size={16} /> Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type here..."
          className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
        />
        <button 
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="bg-teal-600 text-white p-2 rounded-lg hover:bg-teal-700 disabled:bg-gray-300"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default AICoach;