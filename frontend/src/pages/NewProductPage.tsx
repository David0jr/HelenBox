import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Barcode,
  MapPin,
  Box,
  Check,
  Upload,
  Image as ImageIcon,
  Trash2,
  Hash,
  Calendar,
} from 'lucide-react';
import { useApp } from '../app/context/AppContext';
import { BackButton } from '../shared/ui/BackButton';
import type { Product, ProductVariant, ProductUom } from '../shared/types';

export const NewProductPage: React.FC = () => {
  const navigate = useNavigate();
  const { addProduct } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Dados do Produto
  const [category, setCategory] = useState('');
  const [namePt, setNamePt] = useState('');
  const [description, setDescription] = useState('');
  const [colorCode, setColorCode] = useState('');
  const [pieceType, setPieceType] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Verifica se categoria é esmalte (para exibir campo de cor)
  const isEsmalte = category.trim().toLowerCase().includes('esmalte');

  // 2. Caixa Master & Embalagens
  const [masterBoxQty, setMasterBoxQty] = useState<string>(''); // Peças por Cx Master
  const [masterBoxesCount, setMasterBoxesCount] = useState<string>(''); // Qtd de Caixas Master
  const [boxQty, setBoxQty] = useState<string>('');
  const [packageQty, setPackageQty] = useState<string>('');
  const [sellByUnit, setSellByUnit] = useState<boolean>(true);

  // 3. Validade & Lote
  const [hasExpiry, setHasExpiry] = useState<boolean>(false);
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [lotNumber, setLotNumber] = useState<string>('');

  // 4. SKUs
  const [chineseSku, setChineseSku] = useState('');
  const [newSku, setNewSku] = useState('');

  // 5. Local onde vai ficar
  const [warehouse, setWarehouse] = useState('DEP1');
  const [aisle, setAisle] = useState('A');
  const [shelf, setShelf] = useState('01');
  const [level, setLevel] = useState('N1');

  // UI state
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Upload de Imagem real do computador
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Cálculo visual amigável de caixinhas se ambos forem preenchidos
  const boxCalculationHint = () => {
    const total = parseFloat(masterBoxQty);
    const perBox = parseFloat(boxQty);
    if (total > 0 && perBox > 0) {
      const boxes = Math.floor(total / perBox);
      const rest = total % perBox;
      return `${boxes} boxes por caixa master${rest > 0 ? ` (+ ${rest} un avulsas)` : ''}`;
    }
    return null;
  };

  // Cálculo automático do total de peças (Peças por Caixa × Quantidade de Caixas)
  const totalCalculationSummary = () => {
    const piecesPerBox = parseFloat(masterBoxQty) || 0;
    const countBoxes = parseFloat(masterBoxesCount) || 0;

    if (piecesPerBox > 0 && countBoxes > 0) {
      const totalPieces = piecesPerBox * countBoxes;
      let text = `${countBoxes} cx master × ${piecesPerBox.toLocaleString('pt-BR')} un = ${totalPieces.toLocaleString('pt-BR')} peças no total`;

      const bQty = parseFloat(boxQty) || 0;
      if (bQty > 0) {
        const totalBoxes = Math.floor(totalPieces / bQty);
        text += ` • (${totalBoxes.toLocaleString('pt-BR')} boxes no total)`;
      }

      return text;
    }
    return null;
  };

  // Salvar Produto
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const productId = `prod-custom-${Date.now()}`;
    const finalSku = newSku.trim() || chineseSku.trim() || `HB-PRD-${Date.now().toString().slice(-5)}`;
    const finalName = namePt.trim() || 'Produto sem nome';
    const finalCategory = category.trim() || 'Diversos';

    const piecesPerBox = parseFloat(masterBoxQty) || 0;
    const countBoxes = parseFloat(masterBoxesCount) || 1;
    const totalUnits = piecesPerBox > 0 ? piecesPerBox * countBoxes : 0;

    // Gerar UOMs
    const uoms: ProductUom[] = [];

    if (sellByUnit) {
      uoms.push({
        id: `uom-${productId}-un`,
        variant_id: `var-${productId}-0`,
        uom_type: 'UN',
        description: pieceType.trim() ? `${pieceType.trim()} Individual` : 'Unidade Avulsa',
        multiplier: 1,
        barcode: `UN-${finalSku}`,
        is_default_sale: true,
      });
    }

    if (boxQty.trim() && parseFloat(boxQty) > 0) {
      const bQty = parseFloat(boxQty);
      uoms.push({
        id: `uom-${productId}-box`,
        variant_id: `var-${productId}-0`,
        uom_type: bQty === 12 ? 'DZ' : 'CX',
        description: `Box / Caixinha (${bQty} un)`,
        multiplier: bQty,
        barcode: `BOX-${finalSku}`,
        is_default_sale: false,
      });
    }

    if (packageQty.trim() && parseFloat(packageQty) > 0) {
      const pQty = parseFloat(packageQty);
      uoms.push({
        id: `uom-${productId}-pct`,
        variant_id: `var-${productId}-0`,
        uom_type: 'PCT',
        description: `Pacote (${pQty} un)`,
        multiplier: pQty,
        barcode: `PCT-${finalSku}`,
        is_default_sale: false,
      });
    }

    if (masterBoxQty.trim() && totalUnits > 0) {
      uoms.push({
        id: `uom-${productId}-cxm`,
        variant_id: `var-${productId}-0`,
        uom_type: 'CXM',
        description: `Caixa Master (${totalUnits} un)`,
        multiplier: totalUnits,
        barcode: `CXM-${finalSku}`,
        is_default_sale: false,
      });
    }

    const variants: ProductVariant[] = [
      {
        id: `var-${productId}-0`,
        product_id: productId,
        variant_sku: finalSku,
        color_code: isEsmalte && colorCode.trim() ? colorCode.trim() : undefined,
        color_name: isEsmalte && colorCode.trim() ? `Cor ${colorCode.trim()}` : undefined,
        volume: pieceType.trim() || 'Padrão',
        packaging_info: `Cx Master: ${piecesPerBox || '0'} un (${countBoxes} cx) • Box: ${boxQty || '-'} • Pct: ${packageQty || '-'}`,
        unit_label: pieceType.trim() || 'Unidade',
        units_per_box: piecesPerBox,
        boxes_count: countBoxes,
        stock_units: totalUnits,
        warehouse_code: warehouse,
        aisle,
        shelf,
        level,
        image_url: imagePreview || '/products/CMJD-001PK.jpg',
        uoms,
      },
    ];

    const newProduct: Product & { variants: ProductVariant[] } = {
      id: productId,
      sku_helenbox: finalSku,
      supplier_code: chineseSku.trim() || finalSku,
      name_pt: finalName,
      brand: 'Helen Color',
      category: finalCategory,
      has_expiry: hasExpiry,
      image_url: imagePreview || '/products/CMJD-001PK.jpg',
      variants_count: 1,
      total_stock_units: totalUnits,
      location_summary: `${warehouse === 'DEP1' ? 'Galpão 1' : 'Galpão 2'} • Rua ${aisle}-${shelf}`,
      created_at: new Date().toLocaleDateString('pt-BR'),
      variants,
    };

    setIsSubmitting(true);
    addProduct(newProduct);
    setSuccessMsg(`Produto "${finalName}" (${finalSku}) cadastrado com sucesso!`);

    setTimeout(() => {
      navigate('/produtos');
    }, 900);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '880px', margin: '0 auto', width: '100%', textAlign: 'left' }}>
      
      {/* 1. Header do Topo */}
      <div
        className="card"
        style={{
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          borderRadius: '16px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-hover)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'left' }}>
          <BackButton onClick={() => navigate('/produtos')} />
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', textAlign: 'left' }}>
              PRODUTOS / NOVO CADASTRO
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '2px 0 0', color: 'var(--text-primary)', textAlign: 'left' }}>
              Cadastrar Produto
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/produtos')}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Check size={16} />
            <span>{isSubmitting ? 'Salvando...' : 'Salvar Produto'}</span>
          </button>
        </div>
      </div>

      {/* Notificação de Sucesso */}
      {successMsg && (
        <div
          style={{
            background: 'var(--color-success-bg)',
            color: 'var(--color-success)',
            border: '1px solid var(--color-success-border)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 700,
            fontSize: '13.5px',
            textAlign: 'left',
          }}
        >
          <Check size={18} />
          <span>{successMsg} Redirecionando...</span>
        </div>
      )}

      {/* Formulário Principal */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', textAlign: 'left' }}>
        
        {/* Bloco 1: Dados do Produto */}
        <div className="card" style={{ padding: '24px 28px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-hover)' }}>
          
          {/* Cabeçalho do Card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '14px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'var(--helen-red-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--helen-red)', flexShrink: 0 }}>
              <Package size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', textAlign: 'left' }}>
                Dados do Produto
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', textAlign: 'left', marginTop: '1px' }}>
                Identificação básica do item no catálogo Helen Color
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
            
            {/* Categoria */}
            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Categoria:
              </label>
              <input
                type="text"
                list="category-suggestions"
                placeholder="Ex: Esmalte, Gel Construtor, Lixas & Brocas, Cabines & Equipamentos..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-hover)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: '13.5px',
                  textAlign: 'left',
                }}
              />
              <datalist id="category-suggestions">
                <option value="Esmalte" />
                <option value="Gel Construtor" />
                <option value="Lixas & Brocas" />
                <option value="Cabines & Equipamentos" />
                <option value="Acessórios & Preparadores" />
                <option value="Líquidos & Cuidados" />
                <option value="Kits & Coleções" />
              </datalist>
            </div>

            {/* Produto (Nome) */}
            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Produto:
              </label>
              <input
                type="text"
                placeholder="Ex: Esmalte em Gel Helen Color Coleção Nude"
                value={namePt}
                onChange={(e) => setNamePt(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-hover)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  textAlign: 'left',
                }}
              />
            </div>

            {/* Descrição */}
            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Descrição:
              </label>
              <textarea
                placeholder="Ex: Secagem em cabine LED/UV, alta cobertura, durabilidade prolongada..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-hover)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontFamily: 'var(--font-sans)',
                  resize: 'vertical',
                  textAlign: 'left',
                }}
              />
            </div>

            {/* Cor (# da Cor) - exibido após a Descrição quando for Esmalte */}
            {isEsmalte && (
              <div
                style={{
                  textAlign: 'left',
                  background: 'var(--bg-surface-hover)',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-hover)',
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  <Hash size={14} color="var(--helen-red)" />
                  <span>Cor (# da Cor do Esmalte):</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: #01, #50, #861..."
                  value={colorCode}
                  onChange={(e) => setColorCode(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-hover)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    textAlign: 'left',
                  }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block', textAlign: 'left' }}>
                  Digite a hashtag do tom do esmalte para identificação visual e pedidos
                </span>
              </div>
            )}

            {/* Tipo de Peça */}
            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Tipo de Peça:
              </label>
              <input
                type="text"
                list="piecetype-suggestions"
                placeholder="Ex: Frasco, Pote, Pacote, Peça, Unidade..."
                value={pieceType}
                onChange={(e) => setPieceType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-hover)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: '13.5px',
                  textAlign: 'left',
                }}
              />
              <datalist id="piecetype-suggestions">
                <option value="Frasco" />
                <option value="Pote" />
                <option value="Pacote" />
                <option value="Peça" />
                <option value="Unidade" />
              </datalist>
            </div>

            {/* Imagem do Produto */}
            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Imagem do Produto:
              </label>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              {imagePreview ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface-hover)',
                    border: '1px solid var(--border-hover)',
                    textAlign: 'left',
                  }}
                >
                  <img
                    src={imagePreview}
                    alt="Prévia do Produto"
                    style={{
                      width: '76px',
                      height: '76px',
                      objectFit: 'cover',
                      borderRadius: '10px',
                      border: '1px solid var(--border-hover)',
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Check size={14} />
                      <span>Imagem pronta para salvar</span>
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                      >
                        <Upload size={13} />
                        <span>Trocar Imagem</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="btn btn-danger btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                      >
                        <Trash2 size={13} />
                        <span>Remover</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '22px',
                    borderRadius: 'var(--radius-md)',
                    border: '2px dashed var(--border-hover)',
                    background: 'var(--bg-surface-hover)',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '13px',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--helen-red)';
                    e.currentTarget.style.color = 'var(--helen-red)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-hover)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  <ImageIcon size={18} />
                  <span>Carregar Imagem do Produto</span>
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Bloco 2: Caixa Master & Embalagens */}
        <div className="card" style={{ padding: '24px 28px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-hover)' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '14px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'var(--helen-red-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--helen-red)', flexShrink: 0 }}>
              <Box size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', textAlign: 'left' }}>
                Caixa Master & Embalagens
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', textAlign: 'left', marginTop: '1px' }}>
                Defina a quantidade de peças da caixa e embalagens fracionadas
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
            
            {/* Linha 1: Peças por Caixa Master + Qtd de Caixas Master (LADO A LADO) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ textAlign: 'left' }}>
                <label style={{ display: 'block', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Cx Master (Quantidade total de peças):
                </label>
                <input
                  type="number"
                  placeholder="Ex: 120, 240, 500..."
                  value={masterBoxQty}
                  onChange={(e) => setMasterBoxQty(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-hover)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: 700,
                    textAlign: 'left',
                  }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block', textAlign: 'left' }}>
                  Total de peças dentro de 1 caixa master
                </span>
              </div>

              <div style={{ textAlign: 'left' }}>
                <label style={{ display: 'block', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Quantidade de Caixas Master:
                </label>
                <input
                  type="number"
                  placeholder="Ex: 5, 10, 20 caixas..."
                  value={masterBoxesCount}
                  onChange={(e) => setMasterBoxesCount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-hover)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: 700,
                    textAlign: 'left',
                  }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block', textAlign: 'left' }}>
                  Quantas caixas master chegaram
                </span>
              </div>
            </div>

            {/* Linha 2: Box e Pacote editáveis lado a lado */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ textAlign: 'left' }}>
                <label style={{ display: 'block', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Box (Quantidade editável):
                </label>
                <input
                  type="number"
                  placeholder="Ex: 12 un por caixinha"
                  value={boxQty}
                  onChange={(e) => setBoxQty(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-hover)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '13.5px',
                    textAlign: 'left',
                  }}
                />
                {boxCalculationHint() && (
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '4px', display: 'block', textAlign: 'left' }}>
                    ↳ {boxCalculationHint()}
                  </span>
                )}
              </div>

              <div style={{ textAlign: 'left' }}>
                <label style={{ display: 'block', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Pacote (Quantidade editável):
                </label>
                <input
                  type="number"
                  placeholder="Ex: 80 pacotes ou un por pacote"
                  value={packageQty}
                  onChange={(e) => setPackageQty(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-hover)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '13.5px',
                    textAlign: 'left',
                  }}
                />
              </div>
            </div>

            {/* Linha 3: Opção Por Unidade */}
            <div style={{ textAlign: 'left', paddingTop: '4px', borderTop: '1px dashed var(--border-light)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={sellByUnit}
                  onChange={(e) => setSellByUnit(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span>Por Unidade (Permitir movimentação e venda avulsa por peça)</span>
              </label>
            </div>

            {/* Linha 4 (Lá embaixo): Cálculo Automático do Total de Peças - TOTALMENTE NEUTRO SEM VERMELHO */}
            {totalCalculationSummary() && (
              <div
                style={{
                  background: 'var(--bg-surface-hover)',
                  border: '1px solid var(--border-hover)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  textAlign: 'left',
                  marginTop: '4px',
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Total Calculado:
                </span>
                <span style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {totalCalculationSummary()}
                </span>
              </div>
            )}

          </div>
        </div>

        {/* Bloco 3: Validade & Lote */}
        <div className="card" style={{ padding: '24px 28px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-hover)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: hasExpiry ? '18px' : '0', borderBottom: hasExpiry ? '1px solid var(--border-light)' : 'none', paddingBottom: hasExpiry ? '14px' : '0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'var(--bg-surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', flexShrink: 0 }}>
                <Calendar size={18} />
              </div>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', textAlign: 'left' }}>
                  Validade & Lote
                </h2>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', textAlign: 'left', marginTop: '1px' }}>
                  Controle de data de validade e lote do produto
                </span>
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={hasExpiry}
                onChange={(e) => setHasExpiry(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span>Produto possui validade</span>
            </label>
          </div>

          {hasExpiry && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', textAlign: 'left', marginTop: '14px' }}>
              <div style={{ textAlign: 'left' }}>
                <label style={{ display: 'block', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Data de Validade (Mês/Ano ou DD/MM/AAAA):
                </label>
                <input
                  type="text"
                  placeholder="Ex: 10/2028 ou 31/10/2028"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-hover)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '13.5px',
                    fontFamily: 'var(--font-mono)',
                    textAlign: 'left',
                  }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block', textAlign: 'left' }}>
                  Data de validade registrada na embalagem
                </span>
              </div>

              <div style={{ textAlign: 'left' }}>
                <label style={{ display: 'block', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Lote do Fabricante:
                </label>
                <input
                  type="text"
                  placeholder="Ex: LOTE-202610-01"
                  value={lotNumber}
                  onChange={(e) => setLotNumber(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-hover)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '13.5px',
                    fontFamily: 'var(--font-mono)',
                    textAlign: 'left',
                  }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block', textAlign: 'left' }}>
                  Código do lote impresso na embalagem ou fatura
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Bloco 3: SKUs (Chinês ao lado do Novo SKU) */}
        <div className="card" style={{ padding: '24px 28px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-hover)' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '14px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'var(--helen-red-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--helen-red)', flexShrink: 0 }}>
              <Barcode size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', textAlign: 'left' }}>
                SKU Chinês & Novo SKU
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', textAlign: 'left', marginTop: '1px' }}>
                Associe o código de importação ao novo SKU HelenBox
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', textAlign: 'left' }}>
            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                SKU Chinês (Antigo / Fornecedor / Invoice):
              </label>
              <input
                type="text"
                placeholder="Ex: HYYY-001, CGJ-1503..."
                value={chineseSku}
                onChange={(e) => setChineseSku(e.target.value.toUpperCase())}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-hover)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: '13.5px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  textAlign: 'left',
                }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block', textAlign: 'left' }}>
                Usado para identificar o produto automaticamente nas invoices
              </span>
            </div>

            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Novo SKU (HelenBox):
              </label>
              <input
                type="text"
                placeholder="Ex: HB-ESM-001..."
                value={newSku}
                onChange={(e) => setNewSku(e.target.value.toUpperCase())}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-hover)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: '13.5px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  textAlign: 'left',
                }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block', textAlign: 'left' }}>
                Código interno do sistema HelenBox para estocagem e separação
              </span>
            </div>
          </div>
        </div>

        {/* Bloco 4: Local onde vai ficar (Alocação) */}
        <div className="card" style={{ padding: '24px 28px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-hover)' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '14px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'var(--helen-red-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--helen-red)', flexShrink: 0 }}>
              <MapPin size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', textAlign: 'left' }}>
                Local onde vai ficar
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', textAlign: 'left', marginTop: '1px' }}>
                Endereçamento físico de armazenamento no galpão
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', textAlign: 'left' }}>
            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Galpão:
              </label>
              <input
                type="text"
                list="warehouse-suggestions"
                placeholder="DEP1"
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value.toUpperCase())}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-hover)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 700,
                  textAlign: 'left',
                }}
              />
              <datalist id="warehouse-suggestions">
                <option value="DEP1" />
                <option value="DEP2" />
              </datalist>
            </div>

            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Rua:
              </label>
              <input
                type="text"
                placeholder="Ex: A, B, R01..."
                value={aisle}
                onChange={(e) => setAisle(e.target.value.toUpperCase())}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-hover)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 700,
                  textAlign: 'left',
                }}
              />
            </div>

            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Prateleira:
              </label>
              <input
                type="text"
                placeholder="Ex: 01, 02..."
                value={shelf}
                onChange={(e) => setShelf(e.target.value.toUpperCase())}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-hover)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 700,
                  textAlign: 'left',
                }}
              />
            </div>

            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Nível:
              </label>
              <input
                type="text"
                placeholder="Ex: N1, N2..."
                value={level}
                onChange={(e) => setLevel(e.target.value.toUpperCase())}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-hover)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 700,
                  textAlign: 'left',
                }}
              />
            </div>
          </div>
        </div>

        {/* Botões Finais de Ação */}
        <div
          className="card"
          style={{
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: '16px',
            marginBottom: '40px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-hover)',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/produtos')}
            disabled={isSubmitting}
          >
            Cancelar e Voltar
          </button>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', fontSize: '13.5px' }}
          >
            <Check size={18} />
            <span>{isSubmitting ? 'Salvando...' : 'Salvar Produto no HelenBox'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
