import React, { useState, useEffect, useRef } from 'react';
import { getCoachResponse } from '../services/gemini';
import { getChatHistory, saveChatHistory } from '../services/storage';
import { ChatMessage } from '../types';
import { Send, User, Bot, AlertTriangle, Loader2 } from 'lucide-react';

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
        text: "Hi! I'm your accountability coach. I know you want to stop snacking before/after dinner. If you feel an urge right now, tell me. I'm here to help you ride the wave.",
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

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
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

  const handleEmergency = () => {
    setInput("I am about to binge eat snacks right now! Help me stop!");
    // Auto submit in a real app, but here we just populate to let user confirm or just send
    // Let's auto send for urgency
    setTimeout(() => {
        // Need to hook into the logic, easiest is to just set state and trigger effect or call function
        // For simplicity in this component structure, we'll just set input and let user hit send 
        // OR call handleSend logic directly if we extract it.
    }, 100);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-xl shadow-md overflow-hidden">
      <div className="bg-teal-600 p-4 text-white flex justify-between items-center">
        <h2 className="font-bold text-lg flex items-center gap-2">
            <Bot size={20} /> Coach Gemini
        </h2>
        <button 
            onClick={() => {
                setInput("I am feeling the urge to snack!");
            }}
            className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded-full font-bold animate-pulse flex items-center gap-1"
        >
            <AlertTriangle size={12} /> SOS
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] p-3 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-teal-600 text-white rounded-br-none' 
                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
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
            onClick={handleSend}
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
