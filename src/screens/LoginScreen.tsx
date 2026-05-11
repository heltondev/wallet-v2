import React, { useState } from 'react';
import { signIn, signUp, confirmSignUp } from '../lib/auth';

type Mode = 'signin' | 'signup' | 'confirm';

interface LoginScreenProps {
  onAuthenticated: () => void;
}

export function LoginScreen({ onAuthenticated }: LoginScreenProps) {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(email, password);
        onAuthenticated();
      } else if (mode === 'signup') {
        if (password !== confirmPw) {
          setError('As senhas não coincidem');
          setLoading(false);
          return;
        }
        await signUp(email, password);
        setMode('confirm');
      } else if (mode === 'confirm') {
        await confirmSignUp(email, code);
        await signIn(email, password);
        onAuthenticated();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 12,
    border: '1px solid var(--border-2)',
    background: 'var(--bg-1)',
    color: 'var(--text-1)',
    fontFamily: 'var(--font-sans)',
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '10px 0',
    border: 'none',
    borderBottom: active ? '2px solid var(--pos)' : '2px solid transparent',
    background: 'none',
    color: active ? 'var(--text-1)' : 'var(--text-3)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    letterSpacing: 0.3,
  });

  return (
    <div className="phone-surface" style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 28px',
    }}>
      <div style={{ width: '100%', maxWidth: 320 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: -1.5,
            color: 'var(--text-1)',
            margin: 0,
          }}>
            Wallet
          </h1>
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            color: 'var(--text-3)',
            margin: '6px 0 0',
          }}>
            Controle financeiro pessoal
          </p>
        </div>

        {/* Tabs (only show for signin/signup, not confirm) */}
        {mode !== 'confirm' && (
          <div style={{ display: 'flex', marginBottom: 24, borderBottom: '1px solid var(--border-1)' }}>
            <button
              type="button"
              style={tabStyle(mode === 'signin')}
              onClick={() => { setMode('signin'); setError(''); }}
            >
              Entrar
            </button>
            <button
              type="button"
              style={tabStyle(mode === 'signup')}
              onClick={() => { setMode('signup'); setError(''); }}
            >
              Criar conta
            </button>
          </div>
        )}

        {mode === 'confirm' && (
          <div style={{
            textAlign: 'center',
            marginBottom: 24,
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            color: 'var(--text-2)',
          }}>
            Verifique seu email e insira o codigo de confirmacao
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'confirm' ? (
            <input
              type="text"
              placeholder="Codigo de verificacao"
              value={code}
              onChange={e => setCode(e.target.value)}
              style={inputStyle}
              autoComplete="one-time-code"
            />
          ) : (
            <>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={inputStyle}
                autoComplete="email"
              />
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={inputStyle}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
              {mode === 'signup' && (
                <input
                  type="password"
                  placeholder="Confirmar senha"
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  style={inputStyle}
                  autoComplete="new-password"
                />
              )}
            </>
          )}

          {error && (
            <div style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              color: 'var(--neg)',
              textAlign: 'center',
              padding: '4px 0',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 0',
              borderRadius: 12,
              border: 'none',
              background: loading ? 'var(--bg-3)' : 'var(--pos)',
              color: loading ? 'var(--text-3)' : 'var(--bg-0)',
              fontFamily: 'var(--font-sans)',
              fontWeight: 700,
              fontSize: 15,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 4,
              letterSpacing: 0.3,
            }}
          >
            {loading
              ? 'Aguarde...'
              : mode === 'signin'
                ? 'Entrar'
                : mode === 'signup'
                  ? 'Criar conta'
                  : 'Confirmar'}
          </button>
        </form>
      </div>
    </div>
  );
}
