import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { getGeminiChatResponse } from '../services/geminiService';
import { useLanguage } from '../context/LanguageContext';
import { cn } from '../lib/utils';

const SmartAssistantWidget: React.FC = () => {
    const { locale, t } = useLanguage();
    const languageName = locale === 'sw' ? 'Swahili' : 'English';
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatBodyRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMessages([
            { sender: 'bot', text: t('assistant.welcome') || "Habari! Mimi ni msaidizi wako wa AI. Nikupe usaidizi gani leo?" }
        ]);
    }, [locale, t]);

    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSendMessage = async () => {
        if (!userInput.trim() || isLoading) return;

        const newUserMessage: ChatMessage = { sender: 'user', text: userInput };
        const updatedMessages = [...messages, newUserMessage];
        
        setMessages(updatedMessages);
        setUserInput('');
        setIsLoading(true);

        try {
            const botResponse = await getGeminiChatResponse(userInput, messages, languageName);
            const newBotMessage: ChatMessage = { sender: 'bot', text: botResponse };
            setMessages(prev => [...prev, newBotMessage]);
        } catch (error) {
            console.error("Error fetching Gemini response:", error);
            const errorMessage: ChatMessage = { sender: 'bot', text: t('assistant.error') || "Samahani, nimepata shida kidogo. Tafadhali jaribu tena baadaye." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <>
            {/* Launcher Orb - Placed offset so it doesn't overlap mobile BottomNav bar */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "fixed z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-brand-600 to-emerald-500 text-white shadow-xl hover:scale-110 active:scale-95 transition-all duration-300",
                    "bottom-20 right-4 md:bottom-6 md:right-6",
                    isOpen && "rotate-[135deg] from-rose-500 to-red-600 shadow-rose-500/20"
                )}
                aria-label={isOpen ? "Close AI Smart Assistant" : "Open AI Smart Assistant"}
            >
                {isOpen ? (
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                ) : (
                    <div className="relative">
                        <span className="absolute -right-1 -top-1 flex h-3 w-3">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-300"></span>
                        </span>
                        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                    </div>
                )}
            </button>

            {/* Main Chat Drawer */}
            <div
                className={cn(
                    "fixed z-40 w-[calc(100vw-32px)] max-w-[360px] md:w-96 rounded-2xl border border-border/80 dark:border-white/10 bg-surface/90 backdrop-blur-xl shadow-2xl flex flex-col transition-all duration-300 ease-out origin-bottom-right",
                    "bottom-36 right-4 md:bottom-24 md:right-6",
                    isOpen 
                        ? "opacity-100 scale-100 pointer-events-auto" 
                        : "opacity-0 scale-95 pointer-events-none translate-y-4"
                )}
                style={{ height: '480px' }}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-brand-900 to-emerald-950 p-4 text-white flex justify-between items-center rounded-t-2xl border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center text-lg shadow-inner">
                            🤖
                        </div>
                        <div>
                            <h3 className="font-bold text-sm leading-tight text-white">Mkulima Crop Advisor</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-[10px] text-emerald-300 font-semibold uppercase tracking-wider">
                                    {locale === 'sw' ? 'Mtumishi wa Kilimo AI' : 'Active Specialist'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Messages Body */}
                <div 
                    ref={chatBodyRef} 
                    className="flex-grow p-4 overflow-y-auto bg-gradient-to-b from-surface/50 to-bg/50 space-y-3.5 scroll-smooth"
                    style={{ scrollbarWidth: 'thin' }}
                >
                    {messages.map((msg, index) => {
                        const isUser = msg.sender === 'user';
                        return (
                            <div key={index} className={cn("flex", isUser ? 'justify-end' : 'justify-start')}>
                                <div 
                                    className={cn(
                                        "px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                                        isUser 
                                            ? 'bg-brand-600 text-white rounded-2xl rounded-tr-sm' 
                                            : 'bg-surface-2 dark:bg-white/5 text-fg rounded-2xl rounded-tl-sm border border-border/40'
                                    )}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        );
                    })}
                    {isLoading && (
                       <div className="flex justify-start">
                         <div className="bg-surface-2 dark:bg-white/5 text-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5 border border-border/40">
                           <span className="h-2 w-2 rounded-full bg-brand-500/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                           <span className="h-2 w-2 rounded-full bg-brand-500/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                           <span className="h-2 w-2 rounded-full bg-brand-500/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                         </div>
                       </div>
                    )}
                </div>

                {/* Footer Input Form */}
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                    }}
                    className="p-3.5 border-t border-border/50 dark:border-white/5 bg-surface/80 backdrop-blur-md rounded-b-2xl"
                >
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder={locale === 'sw' ? 'Uliza kuhusu mimea, magonjwa...' : 'Ask about crops, pests...'}
                            className="flex-grow bg-surface-2 dark:bg-white/5 border border-border/80 dark:border-white/10 rounded-full px-4 py-2.5 text-sm text-fg outline-none focus:border-brand-500/40 focus:ring-4 focus:ring-brand-500/10 placeholder:text-muted transition-all duration-200"
                            disabled={isLoading}
                        />
                        <button 
                            type="submit"
                            disabled={isLoading || !userInput.trim()} 
                            className="bg-brand-600 text-white rounded-full p-2.5 hover:bg-brand-700 active:scale-95 disabled:bg-muted disabled:scale-100 disabled:opacity-50 transition-all duration-200 shrink-0 shadow-md shadow-brand-600/20"
                            aria-label="Send message"
                        >
                            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                <path d="m22 2-7 20-4-9-9-4Z" />
                                <path d="M22 2 11 13" />
                            </svg>
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default SmartAssistantWidget;