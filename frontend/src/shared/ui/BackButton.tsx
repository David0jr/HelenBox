import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  onClick?: () => void;
  label?: string;
  style?: React.CSSProperties;
}

export const BackButton: React.FC<BackButtonProps> = ({
  onClick,
  label = 'Voltar',
  style,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Voltar à tela anterior"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 14px',
        fontSize: '12.5px',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        borderRadius: 'var(--radius-pill, 9999px)',
        border: '1px solid var(--border-light)',
        background: 'var(--bg-surface, #ffffff)',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
        cursor: 'pointer',
        transition: 'all var(--transition-fast, 0.15s ease)',
        flexShrink: 0,
        lineHeight: 1,
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'var(--helen-red)';
        e.currentTarget.style.borderColor = 'var(--helen-red)';
        e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover, var(--bg-surface))';
        e.currentTarget.style.transform = 'translateX(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--text-secondary)';
        e.currentTarget.style.borderColor = 'var(--border-light)';
        e.currentTarget.style.backgroundColor = 'var(--bg-surface, #ffffff)';
        e.currentTarget.style.transform = 'none';
      }}
    >
      <ArrowLeft size={14} />
      <span>{label}</span>
    </button>
  );
};
