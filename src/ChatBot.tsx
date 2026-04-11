import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GoogleGenAI } from '@google/genai';
import { PRODUCTS, CATEGORIES } from './constants';

// Use a safer way to access the API key that works in both dev and production
const getApiKey = () => {
  try {
    return process.env.GEMINI_API_KEY || '';
  } catch {
    return '';
  }
};

interface Message {
  role: 'user' | 'bot';
  content: string;
}

export const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', content: 'Namaste! I am your Manbhari Assistant. How can I help you today? I can tell you about our organic masalas, snacks, or our referral program!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        setMessages(prev => [...prev, { role: 'bot', content: 'The AI Assistant is not configured yet. Please set the GEMINI_API_KEY in the environment variables.' }]);
        setIsLoading(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });

      const systemPrompt = `
        You are the Manbhari Assistant, a friendly and helpful AI for "Manbhari", an Indian e-commerce store specializing in pure organic masalas, homemade snacks, and puja items.
        
        Store Context:
        - Products: ${JSON.stringify(PRODUCTS)}
        - Categories: ${JSON.stringify(CATEGORIES)}
        - Referral Program: Users get ₹25 in their wallet for each friend who makes their first purchase. The friend also gets ₹25.
        - Contact: Mobile 7870820251, Email manbhari555a@gmail.com
        - Values: 100% Organic, Traditional Methods, Health First.
        - Certification: FSSAI Certified for Masala and Snacks.
        - Rewards: Users get ₹20 for every product review they write.
        
        Guidelines:
        - Be polite, warm, and use "Namaste" occasionally.
        - If asked about products, recommend specific masalas or snacks from the list.
        - If asked about the referral program, explain the ₹25 reward for both parties.
        - If asked about reviews, mention the ₹20 reward.
        - Keep responses concise and helpful.
        - If you don't know something, suggest contacting customer care.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          ...messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }],
          })),
          { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction: systemPrompt,
        }
      });

      const text = response.text || 'I apologize, I could not generate a response.';
      setMessages(prev => [...prev, { role: 'bot', content: text }]);
    } catch (error) {
      console.error('Chat Error:', error);
      setMessages(prev => [...prev, { role: 'bot', content: 'I apologize, I am having a bit of trouble connecting right now. Please try again in a moment or contact our support team.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center group"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!isOpen && (
          <span className="absolute -top-2 -right-2 h-5 w-5 bg-accent text-accent-foreground text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
            1
          </span>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 left-6 z-50 w-[350px] md:w-[400px] h-[500px] bg-white rounded-[32px] shadow-2xl border border-border overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 bg-primary text-primary-foreground flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-serif font-bold">Manbhari Assistant</h4>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-[10px] text-primary-foreground/70 uppercase tracking-widest font-bold">Online</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10 rounded-full" onClick={() => setIsOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-secondary/10">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[80%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-white border border-border text-primary'}`}>
                      {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div className={`p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-white text-foreground rounded-tl-none shadow-sm'}`}>
                      {m.content}
                    </div>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2 items-center bg-white p-3 rounded-2xl rounded-tl-none shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground italic">Assistant is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-border">
              <form 
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
              >
                <Input 
                  placeholder="Ask me anything..." 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="rounded-full border-primary/10 bg-secondary/20 focus:ring-primary/20"
                />
                <Button type="submit" size="icon" className="rounded-full h-10 w-10 shrink-0" disabled={isLoading || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              <p className="text-[10px] text-center text-muted-foreground mt-2 flex items-center justify-center gap-1">
                Powered by AI <Sparkles className="h-2 w-2" />
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
