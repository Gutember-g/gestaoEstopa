import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { formatCurrencyBRL, applyCurrencyMask, parseCurrencyToNumber } from '../utils/money';
import { useToast } from '../context/ToastContext';
import ActionButton from './ActionButton';

const createEmptyItem = () => ({
  produtoId: '',
  sku: '',
  nomeProduto: '',
  custoNoMomento: 0,
  precoNoMomentoFormatted: '',
  quantidade: 1,
});

export default function VendaModal({ isOpen, onClose, initialData = null }) {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const [clienteId, setClienteId] = useState('');
  const [descontoFormatted, setDescontoFormatted] = useState('R$ 0,00');
  const [prazoFaturamentoOption, setPrazoFaturamentoOption] = useState('30');
  const [prazoFaturamentoCustom, setPrazoFaturamentoCustom] = useState('30');
  const [itens, setItens] = useState([createEmptyItem()]);

  const [enviarEmail, setEnviarEmail] = useState(true);
  const [enviarWhatsapp, setEnviarWhatsapp] = useState(false);
  const [formatoDocumento, setFormatoDocumento] = useState('pdf');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Registered Clients Catalog
  const { data: clientesCadastrados = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const res = await api.get('/clientes');
      return Array.isArray(res.data) ? res.data : (res.data?.content || []);
    },
  });

  // Registered Products Catalog
  const { data: produtosCadastrados = [] } = useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      const res = await api.get('/produtos');
      return Array.isArray(res.data) ? res.data : (res.data?.content || []);
    },
  });

  // Populate prefilled data if initialData is provided
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setClienteId(String(initialData.clienteId || ''));
        setDescontoFormatted(initialData.descontoFormatted || (initialData.desconto ? formatCurrencyBRL(initialData.desconto) : 'R$ 0,00'));
        setPrazoFaturamentoOption(String(initialData.prazoFaturamentoOption || initialData.prazoFaturamentoDias || '30'));
        setPrazoFaturamentoCustom(String(initialData.prazoFaturamentoCustom || '30'));

        if (initialData.itens && initialData.itens.length > 0) {
          setItens(
            initialData.itens.map((it) => ({
              produtoId: String(it.produtoId || ''),
              sku: it.sku || '',
              nomeProduto: it.nomeProduto || '',
              custoNoMomento: it.custoNoMomento || 0,
              precoNoMomentoFormatted: it.precoNoMomentoFormatted || formatCurrencyBRL(it.precoNoMomento || 0),
              quantidade: it.quantidade || 1,
            }))
          );
        } else {
          setItens([createEmptyItem()]);
        }
      } else {
        // Reset form for fresh sale
        setClienteId('');
        setDescontoFormatted('R$ 0,00');
        setPrazoFaturamentoOption('30');
        setPrazoFaturamentoCustom('30');
        setItens([createEmptyItem()]);
        setEnviarEmail(true);
        setEnviarWhatsapp(false);
        setFormatoDocumento('pdf');
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItens((prev) => [...prev, createEmptyItem()]);
  };

  const handleRemoveItem = (index) => {
    if (itens.length <= 1) {
      setItens([createEmptyItem()]);
      return;
    }
    setItens((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSelectProductInLine = (index, produtoIdSelected) => {
    const prodObj = produtosCadastrados.find((p) => String(p.id) === String(produtoIdSelected));
    setItens((prev) =>
      prev.map((item, idx) => {
        if (idx === index) {
          if (!prodObj) {
            return createEmptyItem();
          }
          return {
            ...item,
            produtoId: String(prodObj.id),
            sku: prodObj.sku || '',
            nomeProduto: prodObj.nome,
            custoNoMomento: prodObj.precoCusto || 0,
            precoNoMomentoFormatted: formatCurrencyBRL(prodObj.precoVenda || 0),
          };
        }
        return item;
      })
    );
  };

  const handleUnitPriceChange = (index, rawValue) => {
    const masked = applyCurrencyMask(rawValue);
    setItens((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, precoNoMomentoFormatted: masked } : item))
    );
  };

  const handleQuantityChange = (index, val) => {
    const q = Math.max(1, parseInt(val, 10) || 1);
    setItens((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, quantidade: q } : item))
    );
  };

  // Financial calculations
  const validItens = itens.filter((it) => Boolean(it.produtoId));

  const subtotalSemDesconto = validItens.reduce((acc, it) => {
    const unitPrice = parseCurrencyToNumber(it.precoNoMomentoFormatted);
    return acc + unitPrice * it.quantidade;
  }, 0);

  const custoTotalCalc = validItens.reduce((acc, it) => {
    return acc + (it.custoNoMomento || 0) * it.quantidade;
  }, 0);

  const descontoVal = parseCurrencyToNumber(descontoFormatted);
  const valorTotalFinal = Math.max(0, subtotalSemDesconto - descontoVal);
  const lucroLiquidoPrevisto = valorTotalFinal - custoTotalCalc;

  const margemLucroPrevista = custoTotalCalc > 0
    ? ((lucroLiquidoPrevisto / custoTotalCalc) * 100).toFixed(1)
    : '0.0';

  const prazoDiasFinal = prazoFaturamentoOption === 'custom'
    ? Math.max(0, parseInt(prazoFaturamentoCustom, 10) || 0)
    : parseInt(prazoFaturamentoOption, 10) || 0;

  const getEstimatedDueDate = (dias) => {
    const d = new Date();
    d.setDate(d.getDate() + dias);
    return d.toLocaleDateString('pt-BR');
  };

  const selectedCliente = clientesCadastrados.find((c) => String(c.id) === String(clienteId));
  const isClienteMissingEmail = selectedCliente && !selectedCliente.email;
  const isClienteMissingPhone = selectedCliente && !selectedCliente.telefone;

  const validateForm = () => {
    const errs = {};
    if (!clienteId) {
      errs.clienteId = 'Selecione um cliente para emitir a venda.';
    }
    if (validItens.length === 0) {
      errs.itens = 'Adicione pelo menos um produto válido à venda.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (targetStatus) => {
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const payload = {
        clienteId: parseInt(clienteId, 10),
        custoTotal: custoTotalCalc,
        valorTotal: valorTotalFinal,
        desconto: descontoVal,
        lucroLiquido: lucroLiquidoPrevisto,
        prazoFaturamentoDias: prazoDiasFinal,
        status: targetStatus,
        itens: validItens.map((it) => ({
          produtoId: parseInt(it.produtoId, 10),
          nomeProduto: it.nomeProduto,
          custoNoMomento: it.custoNoMomento || 0,
          precoNoMomento: parseCurrencyToNumber(it.precoNoMomentoFormatted),
          quantidade: it.quantidade,
        })),
      };

      const res = await api.post('/vendas', payload);
      const salvaId = res.data?.id;

      // Disparo automático de e-mail / whatsapp se selecionado
      if (salvaId && (enviarEmail || enviarWhatsapp)) {
        try {
          await api.post(`/vendas/${salvaId}/emissao-envio`, {
            enviarEmail,
            enviarWhatsapp,
            formatoDocumento,
          });
        } catch {
          // Log visual sem travar a venda
        }
      }

      const statusDesc = targetStatus === 'ORCAMENTO' ? 'Orçamento de Venda' : 'Venda Confirmada';
      showSuccess(`${statusDesc} salvo(a) com sucesso! ✓`);

      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['parcelas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      onClose();
    } catch (err) {
      showError(err.response?.data?.message || 'Falha ao gravar registro no banco de dados.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl my-auto animate-in zoom-in-95 duration-150 border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 p-4 sm:px-6 sm:py-4 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {initialData ? 'Duplicar / Lançar Venda' : 'Emissão de Nova Venda ou Orçamento'}
            </h2>
            <p className="text-[11px] text-slate-400">Selecione o cliente, produtos e escolha entre Orçamento ou Venda Confirmada.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold p-1">
            ✕
          </button>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {/* 1. Seleção de Cliente */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">1. Selecionar Cliente *</label>
            <select
              value={clienteId}
              onChange={(e) => {
                setClienteId(e.target.value);
                if (errors.clienteId) setErrors((prev) => ({ ...prev, clienteId: null }));
              }}
              className={`w-full p-3 border rounded-xl bg-slate-50/50 dark:bg-slate-800 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-blue-500/40 focus:outline-none transition-all ${
                errors.clienteId ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <option value="">Escolha um cliente cadastrado...</option>
              {clientesCadastrados.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} (CNPJ/CPF: {c.cpfCnpj}) {c.email ? `[${c.email}]` : '[Sem e-mail]'}
                </option>
              ))}
            </select>
            {errors.clienteId && <span className="text-rose-500 text-[10px] font-semibold mt-1 block">{errors.clienteId}</span>}
          </div>

          {/* 2. Seleção e Edição de Produtos */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-slate-700 dark:text-slate-300">2. Produtos *</label>
              <ActionButton
                label="Adicionar Item"
                icon="+"
                variant="secondary"
                size="xs"
                onClick={handleAddItem}
              />
            </div>

            {errors.itens && <span className="text-rose-500 text-[10px] font-semibold block">{errors.itens}</span>}

            <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
              {itens.map((item, idx) => {
                const hasProduct = Boolean(item.produtoId);
                const lineSubtotal = hasProduct
                  ? parseCurrencyToNumber(item.precoNoMomentoFormatted) * item.quantidade
                  : 0;

                return (
                  <div key={idx} className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 p-3 rounded-xl space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <select
                        value={item.produtoId}
                        onChange={(e) => handleSelectProductInLine(idx, e.target.value)}
                        className="flex-1 p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-medium text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500/40"
                      >
                        <option value="">Selecione um produto...</option>
                        {produtosCadastrados.map((p) => (
                          <option key={p.id} value={p.id}>
                            [{p.sku}] {p.nome} — Preço Sugerido: {formatCurrencyBRL(p.precoVenda)}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-rose-500 hover:text-rose-700 text-sm font-bold px-2 py-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg active:scale-95 transition-all"
                        title="Remover produto"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">QTD</span>
                        <input
                          type="number"
                          min="1"
                          disabled={!hasProduct}
                          value={item.quantidade}
                          onChange={(e) => handleQuantityChange(idx, e.target.value)}
                          className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-semibold text-center focus:ring-2 focus:ring-blue-500/40 disabled:bg-slate-100 dark:disabled:bg-slate-900 text-slate-900 dark:text-slate-100"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">CUSTO UNIT.</span>
                        <div className="p-2 bg-slate-100/80 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700 rounded-lg font-mono text-slate-500 text-center">
                          {hasProduct ? formatCurrencyBRL(item.custoNoMomento) : 'R$ 0,00'}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 block font-semibold">PREÇO UNIT.</span>
                        <input
                          type="text"
                          disabled={!hasProduct}
                          placeholder="R$ 0,00"
                          value={item.precoNoMomentoFormatted}
                          onChange={(e) => handleUnitPriceChange(idx, e.target.value)}
                          className="w-full p-2 border border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-slate-100 text-center focus:ring-2 focus:ring-blue-500/40"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">SUBTOTAL</span>
                        <div className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-900 dark:text-slate-100 text-center">
                          {formatCurrencyBRL(lineSubtotal)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Desconto e Prazo para Faturamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Desconto Concedido (R$)</label>
              <input
                type="text"
                value={descontoFormatted}
                onChange={(e) => setDescontoFormatted(applyCurrencyMask(e.target.value))}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 font-semibold focus:ring-2 focus:ring-blue-500/40 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Prazo para Faturamento (dias) *</label>
              <div className="flex gap-2">
                <select
                  value={prazoFaturamentoOption}
                  onChange={(e) => setPrazoFaturamentoOption(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="0">À Vista (0 dias)</option>
                  <option value="7">7 dias</option>
                  <option value="15">15 dias</option>
                  <option value="30">30 dias</option>
                  <option value="45">45 dias</option>
                  <option value="60">60 dias</option>
                  <option value="custom">Personalizado...</option>
                </select>

                {prazoFaturamentoOption === 'custom' && (
                  <input
                    type="number"
                    min="0"
                    placeholder="Ex: 90"
                    value={prazoFaturamentoCustom}
                    onChange={(e) => setPrazoFaturamentoCustom(e.target.value)}
                    className="w-24 p-2.5 border border-blue-400 dark:border-blue-700 rounded-xl bg-white dark:bg-slate-800 font-bold text-center text-slate-900 dark:text-slate-100"
                  />
                )}
              </div>
            </div>
          </div>

          {/* 4. Opções de Envio Automático */}
          <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/70 dark:from-slate-800 dark:to-slate-800/80 border border-blue-200/80 dark:border-slate-700 p-3.5 rounded-xl space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                <span>📩 Envio do Documento</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Formato:</span>
                <select
                  value={formatoDocumento}
                  onChange={(e) => setFormatoDocumento(e.target.value)}
                  className="p-1 px-2 border border-blue-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 font-bold text-blue-700 dark:text-blue-300 text-xs focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="pdf">PDF (Recomendado)</option>
                  <option value="xlsx">Excel (XLSX)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="flex items-center gap-2.5 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enviarEmail}
                  onChange={(e) => setEnviarEmail(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded accent-blue-600 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">Enviar por E-mail</span>
                  <span className="text-[10px] text-slate-500 block">Enviar anexo no e-mail do cliente</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enviarWhatsapp}
                  onChange={(e) => setEnviarWhatsapp(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded accent-emerald-600 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">Enviar por WhatsApp</span>
                  <span className="text-[10px] text-slate-500 block">Enviar resumo no número do cliente</span>
                </div>
              </label>
            </div>

            {enviarEmail && isClienteMissingEmail && (
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 p-2.5 rounded-lg text-[11px] font-medium flex items-center gap-2">
                <span>⚠️</span>
                <span>Cliente sem e-mail cadastrado. O envio por e-mail será simulado.</span>
              </div>
            )}

            {enviarWhatsapp && isClienteMissingPhone && (
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 p-2.5 rounded-lg text-[11px] font-medium flex items-center gap-2">
                <span>⚠️</span>
                <span>Cliente sem telefone cadastrado. O envio por WhatsApp será simulado.</span>
              </div>
            )}
          </div>

          {/* 5. Card de Resumo Financeiro */}
          <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2 shadow-inner">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Subtotal sem Desconto:</span>
              <span className="font-mono">{formatCurrencyBRL(subtotalSemDesconto)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Custo Total dos Produtos:</span>
              <span className="font-mono">{formatCurrencyBRL(custoTotalCalc)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Valor do Desconto:</span>
              <span className="font-mono text-amber-400">-{formatCurrencyBRL(descontoVal)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2">
              <span>Vencimento Estimado:</span>
              <span className="font-semibold text-blue-300">{getEstimatedDueDate(prazoDiasFinal)} ({prazoDiasFinal} dias)</span>
            </div>
            <div className="border-t border-slate-800 pt-2 flex justify-between items-center">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Valor Total Final</div>
                <div className="text-lg font-bold text-white">{formatCurrencyBRL(valorTotalFinal)}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-emerald-400 uppercase font-semibold">Lucro Líquido Previsto</div>
                <div className="text-lg font-bold text-emerald-400">
                  {formatCurrencyBRL(lucroLiquidoPrevisto)} <span className="text-xs font-normal">({margemLucroPrevista}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Actions: TWO distinct submit options (Item 3.4) */}
          <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <ActionButton
              label="Cancelar"
              variant="secondary"
              size="sm"
              onClick={onClose}
            />

            <ActionButton
              label={isSubmitting ? 'Salvando...' : 'Salvar como Orçamento'}
              icon="📝"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={() => handleSave('ORCAMENTO')}
            />

            <ActionButton
              label={isSubmitting ? 'Processando...' : 'Confirmar Venda & Emitir'}
              icon="✓"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              onClick={() => handleSave('CONFIRMADA')}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
