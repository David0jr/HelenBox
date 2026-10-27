import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Lock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '../features/auth';

export const ForgotPasswordPage: React.FC = () => {
  const { requestPasswordReset, resetPasswordWithCode } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Informe seu e-mail.');
      return;
    }

    if (!isEmailValid) {
      setErrorMessage('Formato de e-mail inválido.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await requestPasswordReset(email);
      if (res.success) {
        setSimulatedCode(res.resetCode || '849201');
        setCode(res.resetCode || '849201');
        setStep(2);
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage('Falha ao enviar código.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!code.trim()) {
      setErrorMessage('Informe o código de 6 dígitos.');
      return;
    }

    if (!newPassword || newPassword.length < 4) {
      setErrorMessage('A nova senha deve ter no mínimo 4 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('As senhas não coincidem.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await resetPasswordWithCode(code, newPassword);
      if (res.success) {
        setStep(3);
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage('Erro ao redefinir senha.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (simulatedCode) {
      navigator.clipboard.writeText(simulatedCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
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
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            userSelect: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', letterSpacing: '-1.8px', lineHeight: 1 }}>
            <span style={{ fontSize: '56px', fontWeight: 900, color: '#111827' }}>helen</span>
            <span style={{ fontSize: '56px', fontWeight: 900, color: 'var(--helen-red)' }}>box</span>
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

      {/* RIGHT COLUMN: Minimalist Form */}
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
        {/* Circular Back Button to /login */}
        <div style={{ position: 'absolute', top: '36px', left: '36px' }}>
          <button
            type="button"
            onClick={() => navigate('/login')}
            title="Voltar ao Login"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#4B5563',
              outline: 'none',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#111827';
              e.currentTarget.style.borderColor = '#D1D5DB';
              e.currentTarget.style.transform = 'translateX(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#4B5563';
              e.currentTarget.style.borderColor = '#E5E7EB';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <ArrowLeft size={17} />
          </button>
        </div>

        {/* Central Container */}
        <div style={{ width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <h1
              style={{
                fontSize: '32px',
                fontWeight: 800,
                color: '#111827',
                letterSpacing: '-0.8px',
                marginBottom: '8px',
                lineHeight: 1.15,
              }}
            >
              {step === 1 && 'Recuperar senha'}
              {step === 2 && 'Validar código'}
              {step === 3 && 'Senha atualizada!'}
            </h1>
            <p style={{ fontSize: '13.5px', color: '#6B7280', lineHeight: 1.4 }}>
              {step === 1 && 'Insira seu e-mail para receber o código de recuperação.'}
              {step === 2 && `Código enviado para ${email}. Digite-o para criar a nova senha.`}
              {step === 3 && 'Sua credencial foi atualizada com sucesso. Acesse novamente sua conta.'}
            </p>
          </div>

          {/* Feedback */}
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
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Step 1: Email Form */}
          {step === 1 && (
            <form onSubmit={handleSendEmail} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div>
                <label
                  htmlFor="reset-email"
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    color: '#6B7280',
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                  }}
                >
                  E-MAIL CADASTRADO
                </label>
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="exemplo@helencolor.com.br"
                  autoFocus
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
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#111827';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E5E7EB';
                  }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
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
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.7 : 1,
                  marginTop: '10px',
                  boxShadow: '0 4px 14px rgba(17, 24, 39, 0.18)',
                  transition: 'all 0.18s ease',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                <span>{isLoading ? 'ENVIANDO...' : 'ENVIAR CÓDIGO'}</span>
                {!isLoading && <ArrowRight size={15} />}
              </button>
            </form>
          )}

          {/* Step 2: Code and New Password */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Simulated Code Helper */}
              {simulatedCode && (
                <div
                  style={{
                    backgroundColor: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
                      Código de Simulação:
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#111827', letterSpacing: '2px' }}>
                      {simulatedCode}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    style={{
                      border: '1px solid #A7F3D0',
                      background: '#FFFFFF',
                      borderRadius: '8px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#059669',
                    }}
                  >
                    {isCopied ? <Check size={12} /> : <Copy size={12} />}
                    <span>{isCopied ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              )}

              <div>
                <label
                  htmlFor="code-input"
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    color: '#6B7280',
                    textTransform: 'uppercase',
                    marginBottom: '6px',
                  }}
                >
                  CÓDIGO (6 DÍGITOS)
                </label>
                <input
                  id="code-input"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="849201"
                  maxLength={6}
                  style={{
                    width: '100%',
                    height: '46px',
                    borderRadius: '14px',
                    border: '1px solid #E5E7EB',
                    backgroundColor: '#FFFFFF',
                    padding: '0 18px',
                    fontSize: '15px',
                    fontWeight: 700,
                    letterSpacing: '3px',
                    color: '#111827',
                    textAlign: 'center',
                    outline: 'none',
                  }}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="new-pwd"
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    color: '#6B7280',
                    textTransform: 'uppercase',
                    marginBottom: '6px',
                  }}
                >
                  NOVA SENHA
                </label>
                <input
                  id="new-pwd"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    height: '46px',
                    borderRadius: '14px',
                    border: '1px solid #E5E7EB',
                    backgroundColor: '#FFFFFF',
                    padding: '0 18px',
                    fontSize: '14px',
                    color: '#111827',
                    outline: 'none',
                  }}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="confirm-pwd"
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    color: '#6B7280',
                    textTransform: 'uppercase',
                    marginBottom: '6px',
                  }}
                >
                  CONFIRMAR NOVA SENHA
                </label>
                <input
                  id="confirm-pwd"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    height: '46px',
                    borderRadius: '14px',
                    border: '1px solid #E5E7EB',
                    backgroundColor: '#FFFFFF',
                    padding: '0 18px',
                    fontSize: '14px',
                    color: '#111827',
                    outline: 'none',
                  }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
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
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.7 : 1,
                  marginTop: '10px',
                  boxShadow: '0 4px 14px rgba(17, 24, 39, 0.18)',
                  transition: 'all 0.18s ease',
                }}
              >
                <span>{isLoading ? 'SALVANDO...' : 'REDEFINIR SENHA'}</span>
                {!isLoading && <ArrowRight size={15} />}
              </button>
            </form>
          )}

          {/* Step 3: Success Confirmation */}
          {step === 3 && (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#ECFDF5',
                  color: '#10B981',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  border: '1px solid #A7F3D0',
                }}
              >
                <CheckCircle2 size={30} />
              </div>

              <p style={{ fontSize: '13.5px', color: '#6B7280', lineHeight: 1.4 }}>
                Sua senha foi redefinida com sucesso. Utilize sua nova senha para acessar a plataforma HelenBox.
              </p>

              <button
                type="button"
                onClick={() => navigate('/login')}
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
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(17, 24, 39, 0.18)',
                }}
              >
                <span>IR PARA O LOGIN</span>
                <ArrowRight size={15} />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
