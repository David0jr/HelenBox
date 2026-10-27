import React from 'react';

interface HashtagSwatchProps {
  collectionCode?: string; // e.g. "#861"
  colorCode?: string;      // e.g. "#50"
  hexColor?: string;       // e.g. "#B76E79"
  colorName?: string;      // e.g. "Olho de Gato Ouro Rosa"
  size?: 'sm' | 'md' | 'lg';
}

export const HashtagSwatch: React.FC<HashtagSwatchProps> = ({
  collectionCode,
  colorCode,
  hexColor = '#E51E2B',
  colorName,
  size = 'md',
}) => {
  if (!collectionCode && !colorCode) {
    return null;
  }

  const circleSizes = { sm: 12, md: 16, lg: 20 };
  const fontSizes = { sm: '11px', md: '12px', lg: '13.5px' };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-light)',
        padding: size === 'sm' ? '2px 6px' : '3px 8px',
        borderRadius: 'var(--radius-sm)',
        fontSize: fontSizes[size],
        fontFamily: 'var(--font-mono)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      }}
      title={`Esmalte Helen Color ${collectionCode || ''} ${colorCode || ''} - ${colorName || ''}`}
    >
      {/* Color Swatch Circle */}
      <span
        style={{
          width: `${circleSizes[size]}px`,
          height: `${circleSizes[size]}px`,
          borderRadius: '50%',
          backgroundColor: hexColor,
          display: 'inline-block',
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.15)',
          flexShrink: 0,
        }}
      />

      {/* Collection Code */}
      {collectionCode && (
        <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>
          {collectionCode.startsWith('#') ? collectionCode : `#${collectionCode}`}
        </span>
      )}

      {/* Color Code */}
      {colorCode && (
        <span
          style={{
            fontWeight: 800,
            color: 'var(--helen-red)',
            background: 'var(--helen-red-light)',
            padding: '1px 4px',
            borderRadius: '4px',
          }}
        >
          {colorCode.startsWith('#') ? colorCode : `#${colorCode}`}
        </span>
      )}

      {/* Color Name */}
      {colorName && (
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            color: 'var(--text-secondary)',
            fontWeight: 500,
            marginLeft: '2px',
          }}
        >
          {colorName}
        </span>
      )}
    </div>
  );
};
