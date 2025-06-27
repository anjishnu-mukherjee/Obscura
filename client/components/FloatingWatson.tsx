"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  X, 
  Send,
  Lightbulb,
  Search,
  MessageCircle,
  Loader2,
  Sparkles
} from 'lucide-react';

interface FloatingWatsonProps {
  caseId: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'watson';
  content: string;
  timestamp: Date;
}

const FloatingWatson: React.FC<FloatingWatsonProps> = ({ caseId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuery, setCurrentQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [caseContext, setCaseContext] = useState<any>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Initialize with a welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          type: 'watson',
          content: "Hello! I'm Watson, your AI detective assistant. I've been analyzing this case and I'm here to help you spot details you might have missed. Ask me anything about the investigation, or just say 'help' if you're feeling stuck!",
          timestamp: new Date()
        }
      ]);
    }
  }, [isOpen]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendQuery = async (query?: string) => {
    const queryToSend = query || currentQuery.trim();
    if (!queryToSend || isLoading) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: queryToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentQuery('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/watson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          userQuery: queryToSend
        })
      });

      const result = await response.json();

      if (result.success) {
        const watsonMessage: ChatMessage = {
          id: Date.now().toString() + '_watson',
          type: 'watson',
          content: result.response,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, watsonMessage]);
        setCaseContext(result.context);
      } else {
        throw new Error(result.error || 'Failed to get Watson response');
      }
    } catch (error) {
      console.error('Error getting Watson response:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString() + '_error',
        type: 'watson',
        content: "I'm having trouble analyzing the case right now. Please try again in a moment.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const quickQuestions = [
    "What should I do next?",
    "What patterns do you see?",
    "Who should I interrogate?",
    "Where should I investigate?",
    "Any inconsistencies in the evidence?"
  ];

  return (
    <>
      {/* Floating Watson Button */}
      <motion.button
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8 }}
        onClick={() => setIsOpen(true)}
        className="fixed right-6 bottom-24 z-40 w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 rounded-full shadow-2xl flex items-center justify-center text-white transition-all duration-300 hover:scale-110 border-2 border-blue-500"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        style={{
          boxShadow: '0 8px 32px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
        }}
      >
        <div className="relative">
          <Brain className="w-6 h-6" />
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.button>

      {/* Watson Chat Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            />

            {/* Chat Window */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-2xl h-[80vh] z-50 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col"
              style={{
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 50px rgba(59, 130, 246, 0.2)'
              }}
            >
              {/* Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Brain className="w-8 h-8 text-white" />
                      <Sparkles className="w-4 h-4 text-yellow-400 absolute -top-1 -right-1" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Watson AI Assistant
                      </h2>
                      <p className="text-blue-200 text-sm">
                        Your brilliant detective companion
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Case Context Info */}
              {caseContext && (
                <div className="px-6 py-2 bg-slate-800/50 border-b border-slate-700">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>Locations visited: {caseContext.visitedLocations}</span>
                    <span>Suspects interrogated: {caseContext.interrogatedSuspects}</span>
                    <span>Findings: {caseContext.findingsCount}</span>
                    <span>Notes: {caseContext.notesCount}</span>
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-900 to-slate-800 min-h-0">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.type === 'user' 
                        ? 'bg-blue-600 text-white ml-4' 
                        : 'bg-slate-700 text-slate-100 mr-4 border border-slate-600'
                    }`}>
                      {message.type === 'watson' && (
                        <div className="flex items-center gap-2 mb-2 text-sm text-slate-300">
                          <Brain className="w-4 h-4 text-blue-400" />
                          <span className="font-medium text-blue-400">Watson</span>
                          <span className="text-xs">{formatTime(message.timestamp)}</span>
                        </div>
                      )}
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </p>
                      {message.type === 'user' && (
                        <div className="text-right text-xs text-blue-200 mt-1">
                          {formatTime(message.timestamp)}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-slate-700 rounded-2xl px-4 py-3 border border-slate-600">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                        <span className="text-sm">Watson is analyzing...</span>
                      </div>
                    </div>
                  </motion.div>
                                  )}
                  
                  {/* Scroll anchor */}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Questions */}
              <div className="px-4 py-2 bg-slate-800/50 border-t border-slate-700 flex-shrink-0">
                <div className="flex flex-wrap gap-2">
                  {quickQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendQuery(question)}
                      disabled={isLoading}
                      className="text-xs px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Area */}
              <div className="p-4 bg-slate-800 border-t border-slate-700 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={currentQuery}
                      onChange={(e) => setCurrentQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendQuery()}
                      placeholder="Ask Watson anything about the case..."
                      disabled={isLoading}
                      className="w-full px-4 py-3 bg-slate-700 text-white placeholder-slate-400 rounded-xl border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <MessageCircle className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                  <button
                    onClick={() => handleSendQuery()}
                    disabled={!currentQuery.trim() || isLoading}
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-xl transition-colors disabled:cursor-not-allowed flex items-center gap-2 border border-blue-500 disabled:border-slate-600"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingWatson; 