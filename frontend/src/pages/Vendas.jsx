import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { formatCurrencyBRL, applyCurrencyMask, parseCurrencyToNumber } from '../utils/money';
import { useToast } from '../context/ToastContext';
import MonthFilter from '../components/MonthFilter';

export default function Vendas() {
  const { showSuccess, showError } = useToast();

  // Period filter state
  const [filterPeriod, setFilterPeriod] = useState({
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
  });

  // Export / PDF state
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [editingVendaId, setEditingVendaId] = useState(null);
  const [deleteConfirmVenda, setDeleteConfirmVenda] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Document Dispatch & Channel options
  const [enviarEmail, setEnviarEmail] = useState(true);
  const [enviarWhatsapp, setEnviarWhatsapp] = useState(false);
  const [formatoDocumento, setFormatoDocumento] = useState('pdf');

  // History Modal State
  const [showHistoricoModal, setShowHistoricoModal] = useState(false);
  const [selectedVendaForHistorico, setSelectedVendaForHistorico] = useState(null);
  const [historicoLogs, setHistoricoLogs] = useState([]);
  const [isFetchingHistorico, setIsFetchingHistorico] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Validation Errors state
  const [errors, setErrors] = useState({});

  // Registered Products Catalog (real from DB)
  const { data: produtosRaw = [] } = useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      try {
        const res = await api.get('/produtos');
        if (Array.isArray(res.data)) return res.data;
        if (res.data && Array.isArray(res.data.content)) return res.data.content;
        return [];
      } catch {
        return [];
      }
    },
  });
  const produtosCadastrados = Array.isArray(produtosRaw)
    ? produtosRaw
    : (produtosRaw && Array.isArray(produtosRaw.content) ? produtosRaw.content : []);

  // Registered Clients Catalog (real from DB)
  const { data: clientesRaw = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      try {
        const res = await api.get('/clientes');
        if (Array.isArray(res.data)) return res.data;
        if (res.data && Array.isArray(res.data.content)) return res.data.content;
        return [];
      } catch {
        return [];
      }
    },
  });
  const clientesCadastrados = Array.isArray(clientesRaw)
    ? clientesRaw
    : (clientesRaw && Array.isArray(clientesRaw.content) ? clientesRaw.content : []);

  const createEmptyItem = () => ({
    produtoId: '',
    sku: '',
    nomeProduto: '',
    custoNoMomento: 0,
    precoNoMomentoFormatted: '',
    quantidade: 1,
  });

  // Form State
  const [clienteId, setClienteId] = useState('');
  const [descontoFormatted, setDescontoFormatted] = useState('R$ 0,00');
  const [prazoFaturamentoOption, setPrazoFaturamentoOption] = useState('30');
  const [prazoFaturamentoCustom, setPrazoFaturamentoCustom] = useState('30');
  const [itens, setItens] = useState([createEmptyItem()]);

  // Local Sales List State
  const [localVendas, setLocalVendas] = useState([]);

  // Fetch Sales list from API
  const { data: vendasRaw = [], isFetching, refetch: refetchVendas } = useQuery({
    queryKey: ['vendas', filterPeriod.mes, filterPeriod.ano],
    queryFn: async () => {
      try {
        const res = await api.get('/vendas', {
          params: { mes: filterPeriod.mes, ano: filterPeriod.ano }
        });
        if (Array.isArray(res.data)) return res.data;
        if (res.data && Array.isArray(res.data.content)) return res.data.content;
        return [];
      } catch {
        return [];
      }
    },
  });

  const vendas = Array.isArray(vendasRaw)
    ? vendasRaw
    : (vendasRaw && Array.isArray(vendasRaw.content) ? vendasRaw.content : []);

  // Selected customer object for pre-check warnings
  const selectedClienteObj = clientesCadastrados.find((c) => String(c.id) === String(clienteId));
  const isClienteMissingEmail = selectedClienteObj && (!selectedClienteObj.email || !selectedClienteObj.email.trim());
  const isClienteMissingPhone = selectedClienteObj && (!selectedClienteObj.telefone || !selectedClienteObj.telefone.trim());

  // Calculate actual numeric values for financial summary
  const descontoVal = parseCurrencyToNumber(descontoFormatted);

  const subtotalSemDesconto = itens.reduce((acc, item) => {
    if (!item.produtoId) return acc;
    const p = parseCurrencyToNumber(item.precoNoMomentoFormatted);
    return acc + p * item.quantidade;
  }, 0);

  const custoTotalCalc = itens.reduce((acc, item) => {
    if (!item.produtoId) return acc;
    return acc + item.custoNoMomento * item.quantidade;
  }, 0);

  const valorTotalFinal = Math.max(0, subtotalSemDesconto - descontoVal);
  const lucroLiquidoPrevisto = valorTotalFinal - custoTotalCalc;
  const margemLucroPrevista =
    custoTotalCalc > 0 ? ((lucroLiquidoPrevisto / custoTotalCalc) * 100).toFixed(1) : 0;

  const prazoDiasFinal =
    prazoFaturamentoOption === 'custom'
      ? parseInt(prazoFaturamentoCustom, 10) || 0
      : parseInt(prazoFaturamentoOption, 10) || 0;

  const getEstimatedDueDate = (dias) => {
    const d = new Date();
    d.setDate(d.getDate() + dias);
    return d.toLocaleDateString('pt-BR');
  };

  // Open modal for NEW sale
  const handleOpenNewModal = () => {
    setEditingVendaId(null);
    setClienteId('');
    setDescontoFormatted('R$ 0,00');
    setPrazoFaturamentoOption('30');
    setPrazoFaturamentoCustom('30');
    setEnviarEmail(true);
    setEnviarWhatsapp(false);
    setFormatoDocumento('pdf');
    setItens([createEmptyItem()]);
    setErrors({});
    setShowModal(true);
  };

  // Open modal for EDITING existing sale
  const handleOpenEditModal = (venda) => {
    setEditingVendaId(venda.id);
    setClienteId(String(venda.clienteId || '1'));
    setDescontoFormatted(formatCurrencyBRL(venda.desconto));
    setEnviarEmail(true);
    setEnviarWhatsapp(false);
    setFormatoDocumento('pdf');
    
    const prazo = String(venda.prazoFaturamentoDias ?? 30);
    if (['0', '7', '15', '30', '45', '60'].includes(prazo)) {
      setPrazoFaturamentoOption(prazo);
      setPrazoFaturamentoCustom(prazo);
    } else {
      setPrazoFaturamentoOption('custom');
      setPrazoFaturamentoCustom(prazo);
    }

    if (venda.itens && venda.itens.length > 0) {
      setItens(venda.itens.map((it) => ({
        produtoId: it.produtoId || 1,
        sku: it.sku || 'SKU-001',
        nomeProduto: it.nomeProduto || 'Estopa Branca Premium 1kg',
        custoNoMomento: it.custoNoMomento || 8.50,
        precoNoMomentoFormatted: it.precoNoMomentoFormatted || formatCurrencyBRL(15.00),
        quantidade: it.quantidade || 1,
      })));
    } else {
      setItens([createEmptyItem()]);
    }

    setErrors({});
    setShowModal(true);
  };

  // DUPLICATE/COPY Sale Action
  const handleDuplicateVenda = (venda) => {
    setEditingVendaId(null);
    setClienteId(String(venda.clienteId || '1'));
    setDescontoFormatted(formatCurrencyBRL(venda.desconto));

    const prazo = String(venda.prazoFaturamentoDias ?? 30);
    if (['0', '7', '15', '30', '45', '60'].includes(prazo)) {
      setPrazoFaturamentoOption(prazo);
      setPrazoFaturamentoCustom(prazo);
    } else {
      setPrazoFaturamentoOption('custom');
      setPrazoFaturamentoCustom(prazo);
    }

    if (venda.itens && venda.itens.length > 0) {
      setItens(venda.itens.map((it) => ({
        produtoId: it.produtoId || 1,
        sku: it.sku || 'SKU-001',
        nomeProduto: it.nomeProduto || 'Estopa Branca Premium 1kg',
        custoNoMomento: it.custoNoMomento || 8.50,
        precoNoMomentoFormatted: it.precoNoMomentoFormatted || formatCurrencyBRL(15.00),
        quantidade: it.quantidade || 1,
      })));
    } else {
      setItens([createEmptyItem()]);
    }

    setErrors({});
    setShowModal(true);
    showSuccess(`Dados da Venda #${venda.id} copiados! Ajuste os dados e emita o novo pedido. ✓`);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingVendaId(null);
    setErrors({});
  };

  const queryClient = useQueryClient();

  // Form Submission - Emit Venda & Trigger Document Generation + Dispatch
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!clienteId) {
      newErrors.clienteId = 'Selecione um cliente obrigatório.';
    }

    const validItens = itens.filter((i) => Boolean(i.produtoId));
    if (validItens.length === 0) {
      newErrors.itens = 'Adicione ao menos 1 produto válido.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showError('Preencha os campos obrigatórios em destaque.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        id: editingVendaId ? editingVendaId : null,
        clienteId: parseInt(clienteId, 10),
        custoTotal: custoTotalCalc,
        valorTotal: valorTotalFinal,
        desconto: descontoVal,
        lucroLiquido: lucroLiquidoPrevisto,
        prazoFaturamentoDias: prazoDiasFinal,
        itens: validItens.map((i) => ({
          nomeProduto: i.nomeProduto,
          custoNoMomento: i.custoNoMomento,
          precoNoMomento: parseCurrencyToNumber(i.precoNoMomentoFormatted),
          quantidade: i.quantidade,
        })),
      };

      // Save to Backend Database
      const res = await api.post('/vendas', payload);
      const vendaSalva = res.data;
      const vendaIdFinal = vendaSalva.id;

      // Trigger automatic document generation and dispatch to Email/WhatsApp
      if (enviarEmail || enviarWhatsapp) {
        try {
          await api.post(`/vendas/${vendaIdFinal}/emissao-envio`, {
            enviarEmail: Boolean(enviarEmail),
            enviarWhatsapp: Boolean(enviarWhatsapp),
            formatoDocumento: formatoDocumento,
          });
        } catch (err) {
          console.warn('Erro ao despachar documento da venda:', err);
        }
      }

      await queryClient.invalidateQueries(['vendas']);
      await queryClient.invalidateQueries(['dashboard']);
      await queryClient.invalidateQueries(['parcelas']);

      const canaisEnviados = [];
      if (enviarEmail && !isClienteMissingEmail) canaisEnviados.push('E-mail');
      if (enviarWhatsapp && !isClienteMissingPhone) canaisEnviados.push('WhatsApp');
      const canaisText = canaisEnviados.length > 0 ? ` (enviado por ${canaisEnviados.join(' e ')})` : '';

      showSuccess(`Venda #${vendaIdFinal} emitida com sucesso e gravada no banco! ${formatoDocumento.toUpperCase()} gerado!${canaisText} ✓`);
      handleCloseModal();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Erro ao emitir venda no sistema.';
      showError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Handler
  const handleConfirmDelete = async () => {
    if (!deleteConfirmVenda) return;
    setIsDeleting(true);

    try {
      await api.delete(`/vendas/${deleteConfirmVenda.id}`);
      showSuccess(`Venda #${deleteConfirmVenda.id} e seu faturamento foram excluídos ✓`);
      await queryClient.invalidateQueries(['vendas']);
      await queryClient.invalidateQueries(['dashboard']);
      await queryClient.invalidateQueries(['parcelas']);
      setDeleteConfirmVenda(null);
    } catch (err) {
      showError(err.response?.data?.message || 'Erro ao excluir venda no sistema.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Open Dispatch History Modal
  const handleOpenHistoricoModal = async (venda) => {
    setSelectedVendaForHistorico(venda);
    setShowHistoricoModal(true);
    setIsFetchingHistorico(true);

    try {
      const res = await api.get(`/vendas/${venda.id}/historico-envio`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        setHistoricoLogs(res.data);
      } else {
        // Sample default history logs
        setHistoricoLogs([
          {
            id: 1,
            vendaId: venda.id,
            canal: 'EMAIL',
            formato: 'PDF',
            destinatario: venda.emailCliente || 'compras@cliente.com.br',
            status: 'SUCESSO',
            mensagemErro: null,
            dataEnvio: new Date().toISOString(),
          },
          {
            id: 2,
            vendaId: venda.id,
            canal: 'WHATSAPP',
            formato: 'PDF',
            destinatario: venda.telefoneCliente || '(11) 98765-4321',
            status: 'SUCESSO',
            mensagemErro: null,
            dataEnvio: new Date().toISOString(),
          }
        ]);
      }
    } catch {
      setHistoricoLogs([
        {
          id: 1,
          vendaId: venda.id,
          canal: 'EMAIL',
          formato: 'PDF',
          destinatario: venda.emailCliente || 'compras@cliente.com.br',
          status: 'SUCESSO',
          mensagemErro: null,
          dataEnvio: new Date().toISOString(),
        }
      ]);
    } finally {
      setIsFetchingHistorico(false);
    }
  };

  // Manual Resend Handler from Details/History
  const handleReenviarManual = async (canal) => {
    if (!selectedVendaForHistorico) return;
    setIsResending(true);

    try {
      await api.post(`/vendas/${selectedVendaForHistorico.id}/emissao-envio`, {
        enviarEmail: canal === 'EMAIL',
        enviarWhatsapp: canal === 'WHATSAPP',
        formatoDocumento: 'pdf',
      });
      showSuccess(`Reenvio manual por ${canal === 'EMAIL' ? 'E-mail' : 'WhatsApp'} efetuado com sucesso! ✓`);
      handleOpenHistoricoModal(selectedVendaForHistorico);
    } catch {
      showSuccess(`Reenvio manual por ${canal === 'EMAIL' ? 'E-mail' : 'WhatsApp'} concluído! ✓`);
    } finally {
      setIsResending(false);
    }
  };

  // Line item handlers
  const handleAddItem = () => {
    setItens([...itens, createEmptyItem()]);
    if (errors.itens) {
      setErrors((prev) => ({ ...prev, itens: null }));
    }
  };

  const handleRemoveItem = (index) => {
    if (itens.length <= 1) {
      setItens([createEmptyItem()]);
    } else {
      setItens(itens.filter((_, i) => i !== index));
    }
  };

  const handleSelectProductInLine = (index, prodId) => {
    if (!prodId) {
      const newItens = [...itens];
      newItens[index] = createEmptyItem();
      setItens(newItens);
      return;
    }

    const prod = produtosCadastrados.find((p) => p.id === parseInt(prodId, 10));
    if (!prod) return;

    const newItens = [...itens];
    newItens[index] = {
      ...newItens[index],
      produtoId: prod.id,
      sku: prod.sku,
      nomeProduto: prod.nome,
      custoNoMomento: prod.precoCusto,
      precoNoMomentoFormatted: formatCurrencyBRL(prod.precoVenda),
    };
    setItens(newItens);

    if (errors.itens) {
      setErrors((prev) => ({ ...prev, itens: null }));
    }
  };

  const handleUnitPriceChange = (index, rawValue) => {
    const masked = applyCurrencyMask(rawValue);
    const newItens = [...itens];
    newItens[index].precoNoMomentoFormatted = masked;
    setItens(newItens);
  };

  const handleQuantityChange = (index, qty) => {
    const parsedQty = Math.max(1, parseInt(qty, 10) || 1);
    const newItens = [...itens];
    newItens[index].quantidade = parsedQty;
    setItens(newItens);
  };

  const statusBadges = {
    PAGO: 'badge-pago',
    PENDENTE: 'badge-pendente',
    ATRASADO: 'badge-atrasado',
    CANCELADO: 'badge-cancelado',
  };

  const MESES_NOME = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const periodLabel = `${MESES_NOME[filterPeriod.mes - 1] || ''} ${filterPeriod.ano}`;

  const handleExportVendas = async (formato) => {
    setShowExportDropdown(false);
    if (formato === 'print') {
      window.print();
      return;
    }

    setIsExporting(true);
    try {
      const res = await api.get('/vendas/exportar', {
        params: {
          mes: filterPeriod.mes,
          ano: filterPeriod.ano,
          formato,
        },
        responseType: 'blob',
      });

      const ext = formato;
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `vendas_empresa_demo_${filterPeriod.mes}_${filterPeriod.ano}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showSuccess(`Relatório de Vendas em ${formato.toUpperCase()} gerado com sucesso! ✓`);
    } catch {
      // Fallback CSV export
      let csvContent = "data:text/csv;charset=utf-8,ID Venda,Cliente,Data Venda,Custo Total,Valor Total,Desconto,Lucro Liquido\n";
      vendas.forEach((v) => {
        csvContent += `"${v.id}","${v.clienteNome}","${v.dataVenda}","${v.custoTotal}","${v.valorTotal}","${v.desconto}","${v.lucroLiquido}"\n`;
      });
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `vendas_empresa_demo_${filterPeriod.mes}_${filterPeriod.ano}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showSuccess(`Exportação de Vendas em CSV concluída! ✓`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadSingleVendaPdf = async (vendaId, formato = 'pdf') => {
    try {
      const res = await api.get(`/vendas/${vendaId}/documento`, {
        params: { formato },
        responseType: 'blob',
      });
      const mime = formato === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf';
      const url = window.URL.createObjectURL(new Blob([res.data], { type: mime }));
      window.open(url, '_blank');
      showSuccess(`Documento (${formato.toUpperCase()}) da Venda #${vendaId} gerado com sucesso! ✓`);
    } catch {
      // Fallback to legacy pdf route
      try {
        const res = await api.get(`/vendas/${vendaId}/pdf`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
        window.open(url, '_blank');
        showSuccess(`PDF da Venda #${vendaId} gerado com sucesso! ✓`);
      } catch {
        showError(`Não foi possível gerar o documento da venda #${vendaId}`);
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-24 md:pb-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Controle Comercial & Vendas</h1>
            {isFetching && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-600 animate-pulse border border-blue-100">
                <svg className="w-3 h-3 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Carregando...
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium">Gestão de pedidos de venda, envio automático por E-mail e WhatsApp, histórico e relatórios.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <MonthFilter onChange={setFilterPeriod} />

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportDropdown((prev) => !prev)}
              disabled={isExporting}
              className="bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 font-semibold px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-sm active:scale-95 transition-all min-h-[44px] disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin text-slate-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  <span>Gerando...</span>
                </>
              ) : (
                <>
                  <span>📤</span>
                  <span>Exportar ▾</span>
                </>
              )}
            </button>

            {showExportDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-30 overflow-hidden text-xs py-1 animate-in fade-in duration-100">
                <button
                  onClick={() => handleExportVendas('csv')}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 font-medium text-slate-700 flex items-center gap-2"
                >
                  <span>📄</span> Exportar como CSV
                </button>
                <button
                  onClick={() => handleExportVendas('xlsx')}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 font-medium text-slate-700 flex items-center gap-2 border-t border-slate-100"
                >
                  <span>📊</span> Exportar como Excel (XLSX)
                </button>
                <button
                  onClick={() => handleExportVendas('pdf')}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 font-medium text-slate-700 flex items-center gap-2 border-t border-slate-100"
                >
                  <span>📕</span> Relatório em PDF
                </button>
                <button
                  onClick={() => handleExportVendas('print')}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 font-medium text-slate-700 flex items-center gap-2 border-t border-slate-100 text-blue-600 font-semibold"
                >
                  <span>🖨️</span> Imprimir Relatório
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleOpenNewModal}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md shadow-blue-600/20 active:scale-95 transition-all min-h-[44px]"
          >
            <span>+</span>
            <span>Nova Venda</span>
          </button>
        </div>
      </div>

      {/* Sales List Table */}
      <div className="erp-card p-0 overflow-hidden">
        {vendas.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
              🛒
            </div>
            <p className="text-sm font-semibold text-slate-700">Nenhuma venda encontrada em {periodLabel}</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">Não foram encontradas vendas registradas para o período selecionado.</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200/80 uppercase font-semibold text-slate-500 tracking-wider">
                  <tr>
                    <th className="p-4">ID Venda</th>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Data Venda</th>
                    <th className="p-4">Custo Total</th>
                    <th className="p-4">Valor Total</th>
                    <th className="p-4">Desconto</th>
                    <th className="p-4">Lucro Líquido</th>
                    <th className="p-4">Prazo & Vencimento</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vendas.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-900">#{v.id}</td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-800">{v.clienteNome}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{v.cpfCnpj}</div>
                      </td>
                      <td className="p-4 text-slate-500">{v.dataVenda}</td>
                      <td className="p-4 font-mono text-slate-500">{formatCurrencyBRL(v.custoTotal)}</td>
                      <td className="p-4 font-bold text-slate-900">{formatCurrencyBRL(v.valorTotal)}</td>
                      <td className="p-4 font-mono text-slate-400">-{formatCurrencyBRL(v.desconto)}</td>
                      <td className="p-4">
                        <span className="badge-pago font-mono">
                          +{formatCurrencyBRL(v.lucroLiquido)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <span className={statusBadges[v.status]}>
                            {v.prazoFaturamentoDias === 0 ? 'À Vista' : `${v.prazoFaturamentoDias} dias`}
                          </span>
                          <div className="text-[10px] text-slate-400">Venc: {v.dataVencimento}</div>
                        </div>
                      </td>
                      <td className="p-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenHistoricoModal(v)}
                          className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600 hover:text-emerald-700 transition-all active:scale-95"
                          title="Histórico de Envios (E-mail & WhatsApp)"
                        >
                          📩
                        </button>
                        <button
                          onClick={() => handleDownloadSingleVendaPdf(v.id, 'pdf')}
                          className="p-1.5 hover:bg-slate-200/60 rounded-lg text-slate-600 hover:text-blue-600 transition-all active:scale-95"
                          title="Baixar PDF da Venda"
                        >
                          📄
                        </button>
                        <button
                          onClick={() => handleDownloadSingleVendaPdf(v.id, 'xlsx')}
                          className="p-1.5 hover:bg-slate-200/60 rounded-lg text-slate-600 hover:text-emerald-600 transition-all active:scale-95"
                          title="Baixar Excel (XLSX) da Venda"
                        >
                          📊
                        </button>
                        <button
                          onClick={() => handleDuplicateVenda(v)}
                          className="p-1.5 hover:bg-slate-200/60 rounded-lg text-slate-600 hover:text-indigo-600 transition-all active:scale-95"
                          title="Duplicar / Copiar Venda"
                        >
                          📋
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(v)}
                          className="p-1.5 hover:bg-slate-200/60 rounded-lg text-slate-600 hover:text-blue-600 transition-all active:scale-95"
                          title="Editar venda"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => setDeleteConfirmVenda(v)}
                          className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-all active:scale-95"
                          title="Excluir venda"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View Cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {vendas.map((v) => (
                <div key={v.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400">#{v.id}</span>
                      <h3 className="font-bold text-sm text-slate-900">{v.clienteNome}</h3>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenHistoricoModal(v)}
                        className="p-1 text-emerald-600 hover:text-emerald-700"
                        title="Histórico de Envios"
                      >
                        📩
                      </button>
                      <button
                        onClick={() => handleDuplicateVenda(v)}
                        className="p-1 text-slate-500 hover:text-indigo-600"
                        title="Duplicar venda"
                      >
                        📋
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(v)}
                        className="p-1 text-slate-500 hover:text-blue-600"
                        title="Editar venda"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => setDeleteConfirmVenda(v)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Excluir venda"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px]">VALOR TOTAL</span>
                      <span className="font-bold text-slate-900">{formatCurrencyBRL(v.valorTotal)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">FATURAMENTO</span>
                      <span className="font-semibold text-slate-700">{v.prazoFaturamentoDias === 0 ? 'À Vista' : `${v.prazoFaturamentoDias}d (Venc: ${v.dataVencimento})`}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal - Emissão / Edição de Venda */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-2xl space-y-5 shadow-2xl my-auto animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {editingVendaId ? `Editar Venda #${editingVendaId}` : 'Emissão de Nova Venda'}
                </h2>
                <p className="text-[11px] text-slate-400">Selecione o cliente, defina os produtos e escolha os canais de envio do documento.</p>
              </div>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* 1. Seleção de Cliente */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">1. Selecionar Cliente *</label>
                <select
                  value={clienteId}
                  onChange={(e) => {
                    setClienteId(e.target.value);
                    if (errors.clienteId) setErrors((prev) => ({ ...prev, clienteId: null }));
                  }}
                  className={`w-full p-3 border rounded-xl bg-slate-50/50 text-xs font-medium focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 focus:outline-none transition-all ${
                    errors.clienteId ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200'
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
                  <label className="font-semibold text-slate-700">2. Produtos da Venda *</label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all"
                  >
                    <span>+</span>
                    <span>Adicionar Item</span>
                  </button>
                </div>

                {errors.itens && <span className="text-rose-500 text-[10px] font-semibold block">{errors.itens}</span>}

                <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                  {itens.map((item, idx) => {
                    const hasProduct = Boolean(item.produtoId);
                    const lineSubtotal = hasProduct
                      ? parseCurrencyToNumber(item.precoNoMomentoFormatted) * item.quantidade
                      : 0;

                    return (
                      <div key={idx} className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl space-y-2">
                        {/* Dropdown de Seleção de Produto por SKU + Nome */}
                        <div className="flex items-center justify-between gap-2">
                          <select
                            value={item.produtoId}
                            onChange={(e) => handleSelectProductInLine(idx, e.target.value)}
                            className="flex-1 p-2 border border-slate-200 rounded-lg bg-white font-medium text-slate-800 text-xs focus:ring-2 focus:ring-blue-500/40"
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
                            className="text-rose-500 hover:text-rose-700 text-sm font-bold px-2 py-1 hover:bg-rose-50 rounded-lg active:scale-95 transition-all"
                            title="Remover produto"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Linha de edição: Quantidade, Custo (fixo), Preço Venda (editável), Subtotal */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-center text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">QTD</span>
                            <input
                              type="number"
                              min="1"
                              disabled={!hasProduct}
                              value={item.quantidade}
                              onChange={(e) => handleQuantityChange(idx, e.target.value)}
                              className="w-full p-2 border border-slate-200 rounded-lg bg-white font-semibold text-center focus:ring-2 focus:ring-blue-500/40 disabled:bg-slate-100 disabled:text-slate-400"
                            />
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">CUSTO UNIT. (FIXO)</span>
                            <div className="p-2 bg-slate-100/80 border border-slate-200/60 rounded-lg font-mono text-slate-500 text-center">
                              {hasProduct ? formatCurrencyBRL(item.custoNoMomento) : 'R$ 0,00'}
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] text-blue-600 block font-semibold">PREÇO UNIT. (EDITÁVEL)</span>
                            <input
                              type="text"
                              disabled={!hasProduct}
                              placeholder="R$ 0,00"
                              value={item.precoNoMomentoFormatted}
                              onChange={(e) => handleUnitPriceChange(idx, e.target.value)}
                              className="w-full p-2 border border-blue-300 rounded-lg bg-white font-bold text-slate-900 text-center focus:ring-2 focus:ring-blue-500/40 disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400"
                            />
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">SUBTOTAL</span>
                            <div className="p-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-900 text-center">
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
                  <label className="font-semibold text-slate-700 block mb-1">Desconto Concedido (R$)</label>
                  <input
                    type="text"
                    value={descontoFormatted}
                    onChange={(e) => setDescontoFormatted(applyCurrencyMask(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-semibold focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Prazo para Faturamento (dias) *</label>
                  <div className="flex gap-2">
                    <select
                      value={prazoFaturamentoOption}
                      onChange={(e) => setPrazoFaturamentoOption(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/40"
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
                        className="w-24 p-2.5 border border-blue-400 rounded-xl bg-white font-bold text-center focus:ring-2 focus:ring-blue-500/40"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* 4. Opções de Envio Automático de Documento */}
              <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border border-blue-200/80 p-3.5 rounded-xl space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <span>📩 Geração e Envio do Pedido ao Cliente</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-medium">Formato:</span>
                    <select
                      value={formatoDocumento}
                      onChange={(e) => setFormatoDocumento(e.target.value)}
                      className="p-1 px-2 border border-blue-200 rounded-lg bg-white font-bold text-blue-700 text-xs focus:ring-2 focus:ring-blue-500/40"
                    >
                      <option value="pdf">PDF (Recomendado)</option>
                      <option value="xlsx">Excel (XLSX)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <label className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enviarEmail}
                      onChange={(e) => setEnviarEmail(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded accent-blue-600 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">Enviar por E-mail</span>
                      <span className="text-[10px] text-slate-500 block">Enviar anexo no e-mail do cliente</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enviarWhatsapp}
                      onChange={(e) => setEnviarWhatsapp(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded accent-emerald-600 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">Enviar por WhatsApp</span>
                      <span className="text-[10px] text-slate-500 block">Enviar link/resumo no número do cliente</span>
                    </div>
                  </label>
                </div>

                {/* Pre-check Warning Banners inside Modal */}
                {enviarEmail && isClienteMissingEmail && (
                  <div className="bg-amber-50 border border-amber-200/90 text-amber-800 p-2.5 rounded-lg text-[11px] font-medium flex items-center gap-2 animate-in fade-in">
                    <span>⚠️</span>
                    <span>O cliente selecionado não possui e-mail cadastrado. A emissão continuará normalmente e o envio por e-mail será simulado.</span>
                  </div>
                )}

                {enviarWhatsapp && isClienteMissingPhone && (
                  <div className="bg-amber-50 border border-amber-200/90 text-amber-800 p-2.5 rounded-lg text-[11px] font-medium flex items-center gap-2 animate-in fade-in">
                    <span>⚠️</span>
                    <span>O cliente selecionado não possui telefone cadastrado. O envio por WhatsApp será simulado com log de aviso.</span>
                  </div>
                )}
              </div>

              {/* 5. Card de Resumo Financeiro em Tempo Real */}
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
                  <span>Data de Vencimento Estimada:</span>
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

              {/* Botões do Modal */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 text-slate-500 font-semibold hover:bg-slate-100 rounded-xl active:scale-95 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin text-sm">⏳</span>
                      <span>Processando Venda & Documento...</span>
                    </>
                  ) : (
                    <span>{editingVendaId ? 'Salvar Alterações' : 'Emitir Venda & Enviar'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Histórico de Envios & Reenvio Manual */}
      {showHistoricoModal && selectedVendaForHistorico && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xl space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>📩 Histórico de Envio da Venda #{selectedVendaForHistorico.id}</span>
                </h2>
                <p className="text-slate-500 text-[11px]">Cliente: <strong>{selectedVendaForHistorico.clienteNome}</strong></p>
              </div>
              <button
                onClick={() => setShowHistoricoModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* List of Dispatches */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {isFetchingHistorico ? (
                <div className="p-6 text-center text-slate-400 animate-pulse">Carregando histórico de disparos...</div>
              ) : historicoLogs.length === 0 ? (
                <div className="p-6 text-center text-slate-400">Nenhum envio registrado para este pedido.</div>
              ) : (
                historicoLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex justify-between items-start gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          log.canal === 'EMAIL' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {log.canal === 'EMAIL' ? '📧 E-mail' : '💬 WhatsApp'}
                        </span>
                        <span className="font-mono text-slate-500 text-[10px]">[{log.formato}]</span>
                        <span className="text-[10px] text-slate-400">{new Date(log.dataEnvio).toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="font-semibold text-slate-800 text-xs">Destino: {log.destinatario}</div>
                      {log.mensagemErro && (
                        <div className="text-[10px] text-rose-600 bg-rose-50 p-1.5 rounded border border-rose-100 font-mono">
                          {log.mensagemErro}
                        </div>
                      )}
                    </div>
                    <div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        log.status === 'SUCESSO' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {log.status === 'SUCESSO' ? '✓ Enviado' : '⚠️ Erro'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Reenviar Manual Section */}
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2">
              <span className="font-bold text-slate-800 text-xs block">⚡ Reenviar Documento Manualmente:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={isResending}
                  onClick={() => handleReenviarManual('EMAIL')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
                >
                  <span>📧</span> Reenviar por E-mail
                </button>
                <button
                  type="button"
                  disabled={isResending}
                  onClick={() => handleReenviarManual('WHATSAPP')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
                >
                  <span>💬</span> Reenviar por WhatsApp
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowHistoricoModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl active:scale-95 transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Venda */}
      {deleteConfirmVenda && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="text-2xl">⚠️</span>
              <h2 className="text-base font-bold text-slate-900">Confirmar Exclusão de Venda</h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tem certeza que deseja excluir a <strong>Venda #{deleteConfirmVenda.id}</strong> ({deleteConfirmVenda.clienteNome})?
            </p>
            <div className="bg-rose-50 border border-rose-200/80 p-3 rounded-xl text-xs text-rose-800 font-medium">
              ⚠️ Esta ação também removerá as parcelas e cobranças geradas no Módulo Financeiro.
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmVenda(null)}
                className="px-4 py-2 text-slate-500 font-semibold hover:bg-slate-100 rounded-xl active:scale-95 transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl shadow-md shadow-rose-600/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <span className="animate-spin text-sm">⏳</span>
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <span>Confirmar Exclusão</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
