import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../components/icons/Icons';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { aiChat } from '../lib/api';
import type { FabKind } from '../types';
import './AiChat.scss';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  time: string;
}

const now = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export function AiChat({ fabKind: _fabKind, onBack }: { fabKind: FabKind; onBack?: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: 'assistant', text: 'Olá! Sou seu assistente financeiro. Pergunte sobre seus gastos, orçamento ou dicas de economia.', time: now() },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  const send = async () => {
    const text = input.trim();
    if (!text || typing) return;

    const userMsg: Message = { id: nextId.current++, role: 'user', text, time: now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    try {
      const { reply } = await aiChat(text);
      const aiMsg: Message = { id: nextId.current++, role: 'assistant', text: reply, time: now() };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const canSend = input.trim() && !typing;

  return (
    <div className="ai-chat">
      <IOSStatusBar />

      {/* Header */}
      <div className="ai-chat__header">
        {onBack && (
          <button onClick={onBack} className="ai-chat__back-btn">
            <Icons.chevL size={20} color="var(--text-2)" />
          </button>
        )}
        <Icons.alert size={20} color="var(--pos)" />
        <span className="ai-chat__title">
          Assistente
        </span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="ai-chat__messages">
        {messages.map(msg => (
          <div key={msg.id} className={`ai-chat__msg-wrapper ai-chat__msg-wrapper--${msg.role}`}>
            <div className={`ai-chat__msg-bubble ai-chat__msg-bubble--${msg.role}`}>
              <div className="ai-chat__msg-text">
                {msg.text}
              </div>
              <div className="ai-chat__msg-time">
                {msg.time}
              </div>
            </div>
          </div>
        ))}

        {typing && (
          <div className="ai-chat__typing">
            <div className="ai-chat__typing-bubble">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="ai-chat__typing-dot"
                  style={{ animation: `typingDot 1.2s ${i * 0.2}s infinite ease-in-out` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="ai-chat__input-bar">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pergunte sobre suas finanças..."
          className="ai-chat__input"
        />
        <button
          onClick={send}
          disabled={!canSend}
          className={`ai-chat__send-btn ${canSend ? 'ai-chat__send-btn--active' : 'ai-chat__send-btn--disabled'}`}
        >
          <Icons.arrowUp size={18} color={canSend ? 'var(--bg-0)' : 'var(--text-4)'} stroke={2.2} />
        </button>
      </div>
    </div>
  );
}
