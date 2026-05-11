import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../components/icons/Icons';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { aiChat } from '../utils/api';
import type { FabKind } from '../types';

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

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-0)' }}>
      <IOSStatusBar />

      {/* Header */}
      <div style={{
        padding: '8px 16px 12px',
        display: 'flex', alignItems: 'center', gap: 10,
        borderBottom: '1px solid var(--border-1)',
        background: 'var(--bg-1)',
      }}>
        {onBack && (
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <Icons.chevL size={20} color="var(--text-2)" />
          </button>
        )}
        <Icons.alert size={20} color="var(--pos)" />
        <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 17, color: 'var(--text-1)' }}>
          Assistente
        </span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{
        flex: 1, overflowY: 'auto', padding: '16px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {messages.map(msg => (
          <div key={msg.id} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            <div style={{
              maxWidth: '80%',
              padding: '12px 16px',
              borderRadius: 16,
              background: msg.role === 'user' ? 'var(--bg-2)' : 'var(--bg-1)',
              border: msg.role === 'assistant' ? '1px solid var(--border-1)' : 'none',
            }}>
              <div style={{
                fontFamily: 'var(--font-sans)', fontSize: 14,
                color: 'var(--text-1)', lineHeight: 1.5,
              }}>
                {msg.text}
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 11,
                color: 'var(--text-4)', marginTop: 6, textAlign: 'right',
              }}>
                {msg.time}
              </div>
            </div>
          </div>
        ))}

        {typing && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '12px 20px', borderRadius: 16,
              background: 'var(--bg-1)', border: '1px solid var(--border-1)',
              display: 'flex', gap: 4, alignItems: 'center',
            }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  width: 6, height: 6, borderRadius: 3,
                  background: 'var(--text-3)',
                  animation: `typingDot 1.2s ${i * 0.2}s infinite ease-in-out`,
                }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div style={{
        padding: '10px 12px 28px',
        background: 'var(--bg-1)',
        borderTop: '1px solid var(--border-1)',
        display: 'flex', gap: 8, alignItems: 'center',
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pergunte sobre suas finanças..."
          style={{
            flex: 1, padding: '10px 14px',
            borderRadius: 20, border: '1px solid var(--border-2)',
            background: 'var(--bg-0)', color: 'var(--text-1)',
            fontFamily: 'var(--font-sans)', fontSize: 14,
            outline: 'none',
          }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || typing}
          style={{
            width: 38, height: 38, borderRadius: 19,
            background: input.trim() && !typing ? 'var(--pos)' : 'var(--bg-3)',
            border: 'none', cursor: input.trim() && !typing ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icons.arrowUp size={18} color={input.trim() && !typing ? 'var(--bg-0)' : 'var(--text-4)'} stroke={2.2} />
        </button>
      </div>

      <style>{`
        @keyframes typingDot {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
