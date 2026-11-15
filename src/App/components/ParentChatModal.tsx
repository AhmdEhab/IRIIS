import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Brain, User, Sparkles } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';

interface ParentChatModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ParentChatModal({ isOpen, onClose }: ParentChatModalProps) {
    const { parentChatHistory, sendParentMessage, childProfile } = useApp();
    const { language } = useLanguage();
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [parentChatHistory]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const message = input;
        setInput('');
        setIsTyping(true);
        await sendParentMessage(message);
        setIsTyping(false);
    };

    if (!isOpen) return null;

    return createPortal((
        <AnimatePresence>
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-surface w-full max-w-2xl h-[80vh] rounded-brand-xl shadow-brand-lg overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="p-6 bg-brand-purple-wash text-white flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="size-12 bg-surface/20 rounded-full flex items-center justify-center">
                                <Brain className="size-7" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">IRIS Parent Assistant</h2>
                                <p className="text-xs opacity-70">
                                    {language === 'ar' ? 'مساعدك الذكي لمعرفة تقدم طفلك' : 'Your AI assistant for child progress insights'}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-surface/10 rounded-full transition-colors">
                            <X className="size-6" />
                        </button>
                    </div>

                    {/* Chat Body */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-surface-sunk">
                        {parentChatHistory.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                                <Sparkles className="size-16 text-brand-purple-ink" />
                                <p className="text-lg font-medium max-w-xs">
                                    {language === 'ar'
                                        ? `أهلاً بك! يمكنك سؤالي عن نقاط قوة ${childProfile?.name} أو مهاراته أو التحديات التي يواجهها.`
                                        : `Welcome! You can ask me about ${childProfile?.name}'s strengths, skills, or challenges.`}
                                </p>
                            </div>
                        )}

                        {parentChatHistory.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`size-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-brand-blue' : 'bg-brand-purple'
                                        } text-white`}>
                                        {msg.role === 'user' ? <User className="size-4" /> : <Brain className="size-4" />}
                                    </div>
                                    <div className={`p-4 rounded-brand shadow-brand-sm ${msg.role === 'user'
                                            ? 'bg-brand-blue-ink text-white rounded-ee-none'
                                            : 'bg-surface text-ink rounded-ss-none border border-hairline-soft'
                                        }`}>
                                        <p className="text-sm leading-relaxed">{msg.text}</p>
                                        <p className="text-[10px] opacity-40 mt-1">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-surface border border-hairline-soft p-4 rounded-brand rounded-ss-none shadow-brand-sm flex gap-1">
                                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="size-1.5 bg-hairline rounded-full" />
                                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="size-1.5 bg-hairline rounded-full" />
                                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="size-1.5 bg-hairline rounded-full" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="p-6 bg-surface border-t border-hairline-soft">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder={language === 'ar' ? 'اسأل IRIS عن طفلك...' : 'Ask IRIS about your child...'}
                                className="flex-1 bg-surface-sunk border-none rounded-brand px-6 py-4 focus:ring-2 focus:ring-brand-purple transition-all outline-none"
                            />
                            <Button
                                onClick={handleSend}
                                disabled={!input.trim() || isTyping}
                                className="rounded-brand w-14 h-14 bg-brand-purple hover:bg-brand-purple p-0"
                            >
                                <Send className="size-6 text-white" />
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    ), document.body);
}
