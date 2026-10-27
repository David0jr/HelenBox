import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../features/auth';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('admin@helencolor.com.br');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Por favor, informe seu e-mail.');
      return;
    }

    if (!password) {
      setErrorMessage('Por favor, digite sua senha.');
      return;
    }

    try {
      setIsSubmitting(true);
      await login({ email, password, rememberMe: true });
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Falha na autenticação.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: '#FFFFFF',
        fontFamily: 'var(--font-sans)',
        overflow: 'hidden',
      }}
    >
      {/* LEFT COLUMN: Brand Identity Presentation */}
      <div
        className="login-left-brand"
        style={{
          flex: 1,
          backgroundColor: '#FDFCF7',
          backgroundImage: `
            radial-gradient(circle at 18% 25%, rgba(254, 240, 215, 0.5) 0%, transparent 55%),
            radial-gradient(circle at 80% 80%, rgba(229, 30, 43, 0.03) 0%, transparent 50%)
          `,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: '40px',
          borderRight: '1px solid rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Centered Brand Mark: Clean, bold HelenBox without + sign */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            userSelect: 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              letterSpacing: '-1.8px',
              lineHeight: 1,
            }}
          >
            <span
              style={{
                fontSize: '56px',
                fontWeight: 900,
                color: '#111827',
              }}
            >
              helen
            </span>
            <span
              style={{
                fontSize: '56px',
                fontWeight: 900,
                color: 'var(--helen-red)',
              }}
            >
              box
            </span>
          </div>

          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '3px',
              color: '#9CA3AF',
              textTransform: 'uppercase',
              marginTop: '4px',
            }}
          >
            INVENTÁRIOS HELEN COLOR
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Minimalist & Sophisticated Auth Form */}
      <div
        style={{
          flex: 1,
          backgroundColor: '#FFFFFF',
          backgroundImage: `
            radial-gradient(circle at 85% 15%, rgba(240, 253, 250, 0.6) 0%, transparent 45%),
            radial-gradient(circle at 20% 90%, rgba(249, 250, 251, 0.8) 0%, transparent 50%)
          `,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: '48px 32px',
        }}
      >
        {/* Central Form Container */}
        <div
          style={{
            width: '100%',
            maxWidth: '380px',
            display: 'flex',
            flexDirection: 'column',
            textAlign: 'left',
          }}
        >
          {/* Header Texts: Moved down slightly with comfortable breathing room and left-aligned */}
          <div style={{ marginBottom: '36px', textAlign: 'left' }}>
            <h1
              style={{
                fontSize: '32px',
                fontWeight: 800,
                color: '#111827',
                letterSpacing: '-0.8px',
                marginBottom: '8px',
                lineHeight: 1.15,
                textAlign: 'left',
              }}
            >
              Bem-vindo de volta
            </h1>
            <p
              style={{
                fontSize: '13.5px',
                color: '#6B7280',
                lineHeight: 1.4,
                textAlign: 'left',
              }}
            >
              Insira suas credenciais para acessar sua conta.
            </p>
          </div>

          {/* Error Feedback */}
          {errorMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#EF4444',
                padding: '10px 14px',
                borderRadius: '12px',
                fontSize: '12.5px',
                marginBottom: '20px',
                textAlign: 'left',
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {/* E-MAIL FIELD: Explicitly left-aligned */}
            <div style={{ textAlign: 'left' }}>
              <label
                htmlFor="login-email"
                style={{
                  display: 'block',
                  textAlign: 'left',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                }}
              >
                E-MAIL
              </label>
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="exemplo@helencolor.com.br"
                  style={{
                    width: '100%',
                    height: '48px',
                    borderRadius: '14px',
                    border: '1px solid #E5E7EB',
                    backgroundColor: '#FFFFFF',
                    padding: '0 18px',
                    fontSize: '14px',
                    color: '#111827',
                    outline: 'none',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                    transition: 'all 0.15s ease',
                    fontFamily: 'var(--font-sans)',
                    textAlign: 'left',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#111827';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(17, 24, 39, 0.06)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.02)';
                  }}
                  required
                />
              </div>
            </div>

            {/* SENHA FIELD: Left-aligned label with right-aligned Esqueceu? */}
            <div style={{ textAlign: 'left' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}
              >
                <label
                  htmlFor="login-password"
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    color: '#6B7280',
                    textTransform: 'uppercase',
                    textAlign: 'left',
                  }}
                >
                  SENHA
                </label>
                <Link
                  to="/recuperar-senha"
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--helen-red)',
                    textDecoration: 'none',
                    transition: 'opacity 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.75';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  Esqueceu?
                </Link>
              </div>

              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    height: '48px',
                    borderRadius: '14px',
                    border: '1px solid #E5E7EB',
                    backgroundColor: '#FFFFFF',
                    padding: '0 46px 0 18px',
                    fontSize: '14px',
                    letterSpacing: showPassword ? 'normal' : '2px',
                    color: '#111827',
                    outline: 'none',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                    transition: 'all 0.15s ease',
                    fontFamily: 'var(--font-sans)',
                    textAlign: 'left',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#111827';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(17, 24, 39, 0.06)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.02)';
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: '#9CA3AF',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                    transition: 'color 0.15s ease',
                  }}
                  title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#4B5563';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#9CA3AF';
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* MAIN CTA BUTTON: ENTRAR -> */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '9999px',
                backgroundColor: '#111827',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: 700,
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                marginTop: '10px',
                boxShadow: '0 4px 14px rgba(17, 24, 39, 0.18)',
                transition: 'all 0.18s ease',
                fontFamily: 'var(--font-sans)',
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = '#1F2937';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 18px rgba(17, 24, 39, 0.22)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = '#111827';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(17, 24, 39, 0.18)';
                }
              }}
            >
              <span>{isSubmitting ? 'Acessando...' : 'ENTRAR'}</span>
              {!isSubmitting && <ArrowRight size={15} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
