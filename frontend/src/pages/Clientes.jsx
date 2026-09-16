import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import api from '../services/api';
import { formatCurrencyBRL } from '../utils/money';
import { useToast } from '../context/ToastContext';
import ActionButton from '../components/ActionButton';
import { useVendaModal } from '../context/VendaModalContext';

export default function Clientes() {
  const { showSuccess, showError } = useToast();
  const { openVendaModal } = useVendaModal();
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [editingClienteId, setEditingClienteId] = useState(null);
  const [deleteConfirmCliente, setDeleteConfirmCliente] = useState(null);
  const [historicoCliente, setHistoricoCliente] = useState(null);
  const [vendaDetalheModal, setVendaDetalheModal] = useState(null);
  const [selectedClienteDetails, setSelectedClienteDetails] = useState(null);
  const [expandedObsId, setExpandedObsId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    nome: '',
    cpfCnpj: '',
    inscricaoEstadual: '',
    telefone: '',
    email: '',
    observacao: '',
    status: 'ATIVO',
  });

  // Import / Export State
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState([]);
  const [isImporting, setIsImporting] = useState(false);

  // Sales database for client history
  const salesDatabase = {};

  // Local Clients state
  const [localClientes, setLocalClientes] = useState([]);

  const { data: clientesRaw = [], isLoading, refetch } = useQuery({
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

  const clientes = Array.isArray(clientesRaw)
    ? clientesRaw
    : (clientesRaw && Array.isArray(clientesRaw.content) ? clientesRaw.content : []);

  // Resilient search function (ignores case, dots, slashes, dashes, spaces)
  const normalizeStr = (str) =>
    String(str || '')
      .toLowerCase()
      .replace(/[^\w]/g, '');

  const cleanSearchTerm = normalizeStr(searchTerm);

  const filteredClientes = clientes.filter(
    (c) =>
      normalizeStr(c.nome).includes(cleanSearchTerm) ||
      normalizeStr(c.cpfCnpj).includes(cleanSearchTerm)
  );

  const handleExportClientes = async (formato) => {
    setShowExportDropdown(false);
    setIsExporting(true);
    try {
      const res = await api.get('/clientes/exportar', {
        params: { formato, search: searchTerm },
        responseType: 'blob',
      });
      const ext = formato === 'xlsx' ? 'xlsx' : 'csv';
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `clientes_empresa_demo_${new Date().toISOString().substring(0, 10)}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showSuccess(`Exportação em ${formato.toUpperCase()} gerada com sucesso! ✓`);
    } catch {
      // Fallback export
      const ext = formato === 'xlsx' ? 'csv' : formato;
      let csvContent = "data:text/csv;charset=utf-8,ID,Nome,CPF/CNPJ,Inscricao Estadual,Telefone,Email,Observacao\n";
      filteredClientes.forEach((c) => {
        csvContent += `"${c.id}","${c.nome}","${c.cpfCnpj}","${c.inscricaoEstadual || ''}","${c.telefone || ''}","${c.email || ''}","${c.observacao || ''}"\n`;
      });
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `clientes_empresa_demo_${new Date().toISOString().substring(0, 10)}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showSuccess(`Exportação em ${formato.toUpperCase()} gerada com sucesso! ✓`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadTemplate = async (formato) => {
    try {
      const res = await api.get('/clientes/modelo', {
        params: { formato },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `modelo_importacao_clientes.${formato}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      const csvContent = "data:text/csv;charset=utf-8,nome_razao_social,cpf_cnpj,inscricao_estadual,telefone,email,observacao,status\n" +
        "Cliente Exemplo Ltda,12.345.678/0001-90,110.123.456.789,(11) 98765-4321,contato@exemplo.com,Observacao exemplo,ATIVO\n";
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `modelo_importacao_clientes.${formato}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportFile(file);

    const fileName = file.name.toLowerCase();

    // Excel Parsing (XLSX / XLS)
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

          if (!jsonRows || jsonRows.length <= 1) {
            setImportPreview([]);
            return;
          }

          const rawHeaders = jsonRows[0].map((h) => String(h).trim().toLowerCase().replace(/"/g, ''));
          const existingCpfs = new Set(clientes.map((c) => (c.cpfCnpj || '').replace(/[^\d]/g, '')));
          const previewData = [];

          const findHeaderIdx = (keys) => {
            for (const key of keys) {
              const idx = rawHeaders.findIndex((h) => h.includes(key));
              if (idx !== -1) return idx;
            }
            return -1;
          };

          const nomeIdx = findHeaderIdx(['nome', 'razao']);
          const cpfIdx = findHeaderIdx(['cpf', 'cnpj', 'documento']);
          const ieIdx = findHeaderIdx(['inscricao', 'ie']);
          const telIdx = findHeaderIdx(['telefone', 'tel', 'celular', 'fone']);
          const emailIdx = findHeaderIdx(['email', 'e-mail']);

          for (let i = 1; i < jsonRows.length; i++) {
            const cols = jsonRows[i].map((c) => String(c).trim());
            const hasContent = cols.some((c) => Boolean(c));
            if (!hasContent) continue;

            const nome = nomeIdx !== -1 && cols[nomeIdx] ? cols[nomeIdx] : (cols[0] || '');
            const cpfCnpj = cpfIdx !== -1 && cols[cpfIdx] ? cols[cpfIdx] : (cols[1] || '');
            const ie = ieIdx !== -1 && cols[ieIdx] ? cols[ieIdx] : (cols[2] || '');
            const tel = telIdx !== -1 && cols[telIdx] ? cols[telIdx] : (cols[3] || '');
            const em = emailIdx !== -1 && cols[emailIdx] ? cols[emailIdx] : (cols[4] || '');

            let statusRow = 'VALIDO';
            let motivo = 'Pronto para importar';

            if (!nome) {
              statusRow = 'INVALIDO';
              motivo = 'Nome/Razão Social obrigatório';
            } else if (!cpfCnpj) {
              statusRow = 'INVALIDO';
              motivo = 'CPF/CNPJ obrigatório';
            } else {
              const cleanCpf = cpfCnpj.replace(/[^\d]/g, '');
              if (existingCpfs.has(cleanCpf)) {
                statusRow = 'INVALIDO';
                motivo = 'CPF/CNPJ já cadastrado no sistema';
              }
            }

            previewData.push({
              linha: i + 1,
              nome,
              cpfCnpj,
              ie,
              tel,
              em,
              statusRow,
              motivo,
            });
          }

          setImportPreview(previewData);
        } catch (err) {
          console.error('Erro ao ler XLSX:', err);
          showError('Falha ao ler o arquivo Excel.');
        }
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    // CSV Parsing
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length <= 1) {
        setImportPreview([]);
        return;
      }

      const headers = lines[0].split(/[,;]/).map((h) => h.trim().replace(/"/g, '').toLowerCase());
      const nomeIdx = headers.indexOf('nome_razao_social') !== -1 ? headers.indexOf('nome_razao_social') : headers.indexOf('nome');
      const cpfIdx = headers.indexOf('cpf_cnpj') !== -1 ? headers.indexOf('cpf_cnpj') : headers.indexOf('cpf');
      const ieIdx = headers.indexOf('inscricao_estadual');
      const telIdx = headers.indexOf('telefone');
      const emailIdx = headers.indexOf('email');

      const existingCpfs = new Set(clientes.map((c) => (c.cpfCnpj || '').replace(/[^\d]/g, '')));
      const previewData = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(/[,;]/).map((c) => c.trim().replace(/"/g, ''));
        const nome = nomeIdx !== -1 && cols[nomeIdx] ? cols[nomeIdx] : (cols[0] || '');
        const cpfCnpj = cpfIdx !== -1 && cols[cpfIdx] ? cols[cpfIdx] : (cols[1] || '');
        const ie = ieIdx !== -1 && cols[ieIdx] ? cols[ieIdx] : (cols[2] || '');
        const tel = telIdx !== -1 && cols[telIdx] ? cols[telIdx] : (cols[3] || '');
        const em = emailIdx !== -1 && cols[emailIdx] ? cols[emailIdx] : (cols[4] || '');

        let statusRow = 'VALIDO';
        let motivo = 'Pronto para importar';

        if (!nome) {
          statusRow = 'INVALIDO';
          motivo = 'Nome/Razão Social obrigatório';
        } else if (!cpfCnpj) {
          statusRow = 'INVALIDO';
          motivo = 'CPF/CNPJ obrigatório';
        } else {
          const cleanCpf = cpfCnpj.replace(/[^\d]/g, '');
          if (existingCpfs.has(cleanCpf)) {
            statusRow = 'INVALIDO';
            motivo = 'CPF/CNPJ já cadastrado no sistema';
          }
        }

        previewData.push({
          linha: i + 1,
          nome,
          cpfCnpj,
          ie,
          tel,
          em,
          statusRow,
          motivo,
        });
      }

      setImportPreview(previewData);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (!importFile || isImporting) return;
    setIsImporting(true);

    try {
      const formData = new FormData();
      formData.append('file', importFile);
      const res = await api.post('/clientes/importar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { importados, erros } = res.data;
      await queryClient.invalidateQueries(['clientes']);

      const errosCount = erros ? erros.length : 0;
      if (errosCount > 0) {
        showSuccess(`${importados} importado(s), ${errosCount} com erro/duplicado ignorado(s) ✓`);
      } else {
        showSuccess(`${importados} cliente(s) importado(s) com sucesso! ✓`);
      }

      // Always close modal & reset selection state upon completed import
      setShowImportModal(false);
      setImportFile(null);
      setImportPreview([]);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Erro ao importar arquivo no servidor.';
      showError(msg);
    } finally {
      setIsImporting(false);
    }
  };

  const handleOpenNewModal = () => {
    setEditingClienteId(null);
    setFormData({
      nome: '',
      cpfCnpj: '',
      inscricaoEstadual: '',
      telefone: '',
      email: '',
      observacao: '',
      status: 'ATIVO',
    });
    setErrors({});
    setShowModal(true);
  };

  const handleOpenEditModal = (cliente) => {
    setEditingClienteId(cliente.id);
    setFormData({
      nome: cliente.nome,
      cpfCnpj: cliente.cpfCnpj,
      inscricaoEstadual: cliente.inscricaoEstadual || '',
      telefone: cliente.telefone || '',
      email: cliente.email || '',
      observacao: cliente.observacao || '',
      status: cliente.status || 'ATIVO',
    });
    setErrors({});
    setShowModal(true);
  };

  const handleOpenHistorico = (cliente) => {
    const list = salesDatabase[cliente.id] || [];
    const totalComprado = list.reduce((acc, v) => acc + v.valorTotal, 0);
    const count = list.length;
    const ticketMedio = count > 0 ? totalComprado / count : 0;

    setHistoricoCliente({
      cliente,
      vendas: list,
      totalComprado,
      vendasCount: count,
      ticketMedio,
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClienteId(null);
    setErrors({});
  };

  const queryClient = useQueryClient();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome / Razão Social é obrigatório.';
    }

    if (!formData.cpfCnpj.trim()) {
      newErrors.cpfCnpj = 'CPF / CNPJ é obrigatório.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showError('Preencha os campos obrigatórios em destaque.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        nome: formData.nome.trim(),
        cpfCnpj: formData.cpfCnpj.trim(),
        inscricaoEstadual: formData.inscricaoEstadual.trim() || 'ISENTO',
        telefone: formData.telefone.trim(),
        email: formData.email.trim(),
        observacao: formData.observacao.trim(),
        status: formData.status,
      };

      if (editingClienteId) {
        await api.put(`/clientes/${editingClienteId}`, payload);
        showSuccess(`Cliente "${formData.nome}" atualizado com sucesso! ✓`);
      } else {
        await api.post('/clientes', payload);
        showSuccess(`Cliente "${formData.nome}" cadastrado com sucesso! ✓`);
      }

      await queryClient.invalidateQueries(['clientes']);
      handleCloseModal();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Erro ao salvar cliente no banco de dados.';
      showError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Inactivate Action
  const handleInativarCliente = async (cliente) => {
    try {
      await api.put(`/clientes/${cliente.id}`, {
        ...cliente,
        status: 'INATIVO',
      });
      showSuccess(`Cliente "${cliente.nome}" foi marcado como INATIVO ✓`);
      await queryClient.invalidateQueries(['clientes']);
    } catch (err) {
      showError(err.response?.data?.message || 'Erro ao inativar cliente.');
    } finally {
      setDeleteConfirmCliente(null);
    }
  };

  // Confirm Delete Action
  const handleConfirmDelete = async () => {
    if (!deleteConfirmCliente) return;
    setIsDeleting(true);

    try {
      await api.delete(`/clientes/${deleteConfirmCliente.id}`);
      showSuccess(`Cadastro de "${deleteConfirmCliente.nome}" excluído definitivamente ✓`);
      await queryClient.invalidateQueries(['clientes']);
      setDeleteConfirmCliente(null);
    } catch (err) {
      showError(err.response?.data?.message || 'Erro ao excluir cliente do banco de dados.');
    } finally {
      setIsDeleting(false);
    }
  };

  const statusBadges = {
    PAGO: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    PENDENTE: 'bg-amber-50 text-amber-600 border-amber-200',
    ATRASADO: 'bg-red-50 text-red-600 border-red-200',
    CANCELADO: 'bg-slate-100 text-slate-400 border-slate-200',
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-24 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Gestão de Clientes</h1>
          <p className="text-xs text-slate-500 font-medium">Clique no cliente para abrir o histórico de compras, ticket médio e atalhos de vendas.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Import Button */}
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 font-semibold px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-sm active:scale-95 transition-all min-h-[44px]"
          >
            <span>📥</span>
            <span>Importar</span>
          </button>

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
                  <span>Exportando...</span>
                </>
              ) : (
                <>
                  <span>📤</span>
                  <span>Exportar ▾</span>
                </>
              )}
            </button>

            {showExportDropdown && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-30 overflow-hidden text-xs py-1 animate-in fade-in duration-100">
                <button
                  onClick={() => handleExportClientes('csv')}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 font-medium text-slate-700 flex items-center gap-2"
                >
                  <span>📄</span> Exportar como CSV
                </button>
                <button
                  onClick={() => handleExportClientes('xlsx')}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 font-medium text-slate-700 flex items-center gap-2 border-t border-slate-100"
                >
                  <span>📊</span> Exportar como XLSX
                </button>
              </div>
            )}
          </div>

          {/* New Client Button */}
          <button
            onClick={handleOpenNewModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md shadow-blue-600/20 active:scale-95 transition-all min-h-[44px]"
          >
            <span>+</span>
            <span>Novo Cliente</span>
          </button>
        </div>
      </div>

      {/* Real-time Search Input with Clear Button */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-3 focus-within:ring-2 focus-within:ring-blue-500/40 focus-within:border-blue-500 transition-all">
        <div className="flex items-center gap-3 w-full">
          <span className="text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="Buscar por nome ou CPF/CNPJ (ex: 12345678 ou Silva)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-slate-400 hover:text-slate-600 font-bold text-xs p-1 rounded-lg hover:bg-slate-100 transition-colors"
            title="Limpar busca"
          >
            ✕
          </button>
        )}
      </div>

      {/* Content: Responsive Cards Mobile & Table Desktop */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Carregando clientes...</div>
      ) : filteredClientes.length === 0 ? (
        /* Friendly Empty Search State */
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3 shadow-sm">
          <div className="text-3xl">🔎</div>
          <h3 className="font-bold text-slate-800 text-sm">Nenhum cliente encontrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Não encontramos nenhum resultado para "<strong className="text-slate-700">{searchTerm}</strong>". Verifique a grafia ou limpe o filtro.
          </p>
          <button
            onClick={() => setSearchTerm('')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-xl text-xs active:scale-95 transition-all"
          >
            Limpar Busca
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="hidden md:block overflow-x-auto pr-2">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200/80 uppercase font-bold text-slate-500 tracking-wider">
                <tr>
                  <th className="p-4">Nome / Razão Social</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Contato</th>
                  <th className="p-4 pr-6 text-right w-28">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClientes.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedClienteDetails(c)}
                    className="hover:bg-blue-50/50 transition-colors group cursor-pointer h-auto"
                  >
                    <td className="p-4 font-bold text-slate-900">{c.nome}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        c.status === 'ATIVO' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {c.status || 'ATIVO'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div>{c.telefone || '-'}</div>
                      <div className="text-[11px] text-slate-400">{c.email || '-'}</div>
                    </td>
                    <td className="p-4 pr-6 text-right w-28">
                      <div className="flex justify-end">
                        <ActionButton
                          label="Editar"
                          icon="✏️"
                          variant="outline"
                          size="xs"
                          title="Editar cliente"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(c);
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredClientes.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedClienteDetails(c)}
                className="p-4 space-y-2 hover:bg-blue-50/30 cursor-pointer transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-sm text-slate-800">{c.nome}</div>
                    <div className="mt-0.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        c.status === 'ATIVO' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {c.status || 'ATIVO'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditModal(c);
                      }}
                      className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100"
                      title="Editar cliente"
                    >
                      ✏️
                    </button>
                  </div>
                </div>
                <div className="text-xs text-blue-600 font-medium">{c.telefone || '-'} | {c.email || '-'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal / Drawer de Detalhes do Cliente */}
      {selectedClienteDetails && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl my-auto animate-in zoom-in-95 duration-150 overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 p-4 sm:px-6 sm:py-4 flex-shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Detalhes do Cliente
                </h2>
                <p className="text-[11px] text-slate-500">{selectedClienteDetails.nome}</p>
              </div>
              <button
                onClick={() => setSelectedClienteDetails(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl space-y-3">
                <h3 className="font-bold text-slate-800 text-xs border-b border-slate-200/60 pb-2">Informações Cadastrais</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Nome / Razão Social</span>
                    <span className="font-bold text-slate-800">{selectedClienteDetails.nome}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Status</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-block mt-0.5 ${
                      selectedClienteDetails.status === 'ATIVO' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {selectedClienteDetails.status || 'ATIVO'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">CPF / CNPJ</span>
                    <span className="font-mono font-medium text-slate-700">{selectedClienteDetails.cpfCnpj || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Inscrição Estadual</span>
                    <span className="font-mono font-medium text-slate-700">{selectedClienteDetails.inscricaoEstadual || 'Isento'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl space-y-3">
                <h3 className="font-bold text-slate-800 text-xs border-b border-slate-200/60 pb-2">Contato</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Telefone</span>
                    <span className="font-medium text-slate-700">{selectedClienteDetails.telefone || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">E-mail</span>
                    <span className="font-medium text-slate-700">{selectedClienteDetails.email || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl space-y-2">
                <h3 className="font-bold text-slate-800 text-xs border-b border-slate-200/60 pb-2">Observações</h3>
                <p className="text-slate-600 whitespace-normal break-words leading-relaxed">
                  {selectedClienteDetails.observacao || 'Nenhuma observação cadastrada.'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap justify-between items-center gap-2 p-4 sm:px-6 border-t border-slate-100 flex-shrink-0">
              <div className="flex flex-wrap gap-2">
                <ActionButton
                  label="Histórico de Compras"
                  icon="📊"
                  variant="subtle"
                  size="sm"
                  title="Ver histórico de compras"
                  onClick={() => {
                    const c = selectedClienteDetails;
                    setSelectedClienteDetails(null);
                    handleOpenHistorico(c);
                  }}
                />
                <ActionButton
                  label="Editar"
                  icon="✏️"
                  variant="outline"
                  size="sm"
                  title="Editar cliente"
                  onClick={() => {
                    const c = selectedClienteDetails;
                    setSelectedClienteDetails(null);
                    handleOpenEditModal(c);
                  }}
                />
                <ActionButton
                  label="Excluir"
                  icon="🗑️"
                  variant="dangerSubtle"
                  size="sm"
                  title="Excluir cliente"
                  onClick={() => {
                    const c = selectedClienteDetails;
                    setSelectedClienteDetails(null);
                    setDeleteConfirmCliente(c);
                  }}
                />
              </div>

              <button
                onClick={() => setSelectedClienteDetails(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs active:scale-95 transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Drawer de Histórico de Vendas do Cliente */}
      {historicoCliente && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl my-auto animate-in zoom-in-95 duration-150 overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 p-4 sm:px-6 sm:py-4 flex-shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Histórico Comercial — {historicoCliente.cliente.nome}
                </h2>
                <p className="text-[11px] text-slate-400">CPF/CNPJ: {historicoCliente.cliente.cpfCnpj}</p>
              </div>
              <button
                onClick={() => setHistoricoCliente(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
              {/* KPI Cards Header Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total de Vendas</span>
                  <span className="text-base font-extrabold text-slate-800">{historicoCliente.vendasCount} pedidos</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Valor Acumulado</span>
                  <span className="text-base font-extrabold text-blue-600">{formatCurrencyBRL(historicoCliente.totalComprado)}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Ticket Médio</span>
                  <span className="text-base font-extrabold text-emerald-600">{formatCurrencyBRL(historicoCliente.ticketMedio)}</span>
                </div>
              </div>

              {/* Sales Timeline List (Descending date) */}
              <div className="space-y-2 text-xs">
                <h3 className="font-bold text-slate-700">Histórico de Pedidos de Venda:</h3>
                {historicoCliente.vendas.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-400">
                    Nenhuma venda cadastrada para este cliente até o momento.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {historicoCliente.vendas.map((v) => (
                      <div
                        key={v.id}
                        onClick={() => setVendaDetalheModal(v)}
                        className="bg-white border border-slate-200 p-3 rounded-xl flex items-center justify-between hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer transition-all"
                      >
                        <div>
                          <div className="font-bold text-slate-800 flex items-center gap-2">
                            <span>Venda #{v.id}</span>
                            <span className="text-slate-400 text-[10px] font-mono">({v.dataVenda})</span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {v.itens.length} item(ns) | Prazo: {v.prazoFaturamentoDias} dias
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-extrabold text-slate-900">{formatCurrencyBRL(v.valorTotal)}</div>
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border ${statusBadges[v.status]}`}>
                              {v.status}
                            </span>
                          </div>
                          <span className="text-slate-400 text-xs">🔍</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Quick Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 p-4 sm:px-6 border-t border-slate-100 flex-shrink-0">
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    const cId = historicoCliente.cliente.id;
                    setHistoricoCliente(null);
                    openVendaModal({ clienteId: cId });
                  }}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs active:scale-95 transition-all shadow-sm"
                >
                  + Nova Venda para este Cliente
                </button>

                {historicoCliente.vendas.length > 0 && (
                  <button
                    onClick={() => {
                      setHistoricoCliente(null);
                      showSuccess(`Venda #${historicoCliente.vendas[0].id} pronta para duplicação em Vendas ✓`);
                      navigate('/vendas');
                    }}
                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold rounded-xl text-xs active:scale-95 transition-all"
                  >
                    📋 Duplicar Última Venda
                  </button>
                )}
              </div>

              <button
                onClick={() => setHistoricoCliente(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs active:scale-95 transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-modal Detalhes da Venda Selecionada no Histórico */}
      {vendaDetalheModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-xl space-y-4 shadow-2xl my-auto animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900">Detalhes da Venda #{vendaDetalheModal.id}</h3>
                <p className="text-[11px] text-slate-400">Data: {vendaDetalheModal.dataVenda}</p>
              </div>
              <button onClick={() => setVendaDetalheModal(null)} className="text-slate-400 text-lg font-bold">✕</button>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-700">Produtos Comprados:</h4>
              <div className="bg-slate-50 border rounded-xl divide-y overflow-hidden">
                {vendaDetalheModal.itens.map((it, idx) => (
                  <div key={idx} className="p-3 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-800">[{it.sku}] {it.nomeProduto}</div>
                      <div className="text-[10px] text-slate-400">Qtd: {it.quantidade}x | Valor Unit.: {formatCurrencyBRL(it.precoUnitario)}</div>
                    </div>
                    <div className="font-bold text-slate-900">{formatCurrencyBRL(it.precoUnitario * it.quantidade)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 text-white p-3.5 rounded-xl flex justify-between items-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Valor Total</span>
                <span className="text-base font-bold">{formatCurrencyBRL(vendaDetalheModal.valorTotal)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-emerald-400 block uppercase">Lucro Líquido</span>
                <span className="text-base font-bold text-emerald-400">{formatCurrencyBRL(vendaDetalheModal.lucroLiquido)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={() => setVendaDetalheModal(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs active:scale-95"
              >
                Voltar ao Histórico
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Form Novo / Editar Cliente */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden">
            <div className="flex justify-between items-center border-b p-4 sm:px-6 flex-shrink-0">
              <h2 className="text-base font-bold text-slate-800">
                {editingClienteId ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nome Razão Social *</label>
                <input
                  value={formData.nome}
                  onChange={(e) => {
                    setFormData({ ...formData, nome: e.target.value });
                    if (errors.nome) setErrors({ ...errors, nome: null });
                  }}
                  className={`w-full p-2.5 border rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all ${
                    errors.nome ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200'
                  }`}
                />
                {errors.nome && <span className="text-rose-500 text-[10px] font-semibold block mt-1">{errors.nome}</span>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">CPF / CNPJ *</label>
                  <input
                    value={formData.cpfCnpj}
                    onChange={(e) => {
                      setFormData({ ...formData, cpfCnpj: e.target.value });
                      if (errors.cpfCnpj) setErrors({ ...errors, cpfCnpj: null });
                    }}
                    className={`w-full p-2.5 border rounded-lg font-mono text-slate-800 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all ${
                      errors.cpfCnpj ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200'
                    }`}
                  />
                  {errors.cpfCnpj && <span className="text-rose-500 text-[10px] font-semibold block mt-1">{errors.cpfCnpj}</span>}
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Inscrição Estadual</label>
                  <input
                    value={formData.inscricaoEstadual}
                    onChange={(e) => setFormData({ ...formData, inscricaoEstadual: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg font-mono text-slate-800 focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Telefone</label>
                  <input
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">E-mail</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Observações</label>
                <textarea
                  rows="2"
                  value={formData.observacao}
                  onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="ATIVO">ATIVO</option>
                  <option value="INATIVO">INATIVO</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl active:scale-95 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin text-sm">⏳</span>
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>{editingClienteId ? 'Salvar Alterações' : 'Salvar Cliente'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmação de Exclusão de Cliente */}
      {deleteConfirmCliente && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="text-2xl">⚠️</span>
              <h2 className="text-base font-bold text-slate-900">Excluir Cliente</h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Deseja excluir o cadastro do cliente <strong>"{deleteConfirmCliente.nome}"</strong>?
            </p>

            {deleteConfirmCliente.temVendas && (
              <div className="bg-amber-50 border border-amber-200/80 p-3 rounded-xl text-xs text-amber-800 space-y-1">
                <strong className="font-semibold block">⚠️ Cliente possui {deleteConfirmCliente.vendasCount} venda(s) registrada(s):</strong>
                <span>
                  Recomendamos apenas inativar o cadastro para preservar o histórico comercial dos relatórios.
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmCliente(null)}
                className="px-3 py-2 text-slate-500 font-semibold hover:bg-slate-100 rounded-xl active:scale-95 transition-all text-xs"
              >
                Cancelar
              </button>

              {deleteConfirmCliente.temVendas && (
                <button
                  type="button"
                  onClick={() => handleInativarCliente(deleteConfirmCliente)}
                  className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl shadow-md shadow-amber-500/20 active:scale-95 transition-all text-xs"
                >
                  Inativar Cadastro
                </button>
              )}

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl shadow-md shadow-rose-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs"
              >
                {isDeleting ? (
                  <>
                    <span className="animate-spin text-sm">⏳</span>
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <span>Excluir Definitivamente</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Importar Clientes */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>📥</span> Importar Clientes (CSV / XLSX)
                </h2>
                <p className="text-xs text-slate-500">Selecione uma planilha para importar registros de clientes no sistema.</p>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1">
              {/* Template Download Links */}
              <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-800 block">Precisa do modelo padrão?</span>
                  <span className="text-slate-500 text-[11px]">Baixe o arquivo de exemplo com as colunas corretas.</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadTemplate('csv')}
                    className="text-blue-600 hover:text-blue-700 font-bold underline text-xs"
                  >
                    Modelo CSV
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    onClick={() => handleDownloadTemplate('xlsx')}
                    className="text-blue-600 hover:text-blue-700 font-bold underline text-xs"
                  >
                    Modelo XLSX
                  </button>
                </div>
              </div>

              {/* Upload Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Selecionar arquivo (.csv ou .xlsx)</label>
                <input
                  type="file"
                  accept=".csv, .xlsx"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-600 border border-slate-200 rounded-xl p-2.5 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all"
                />
              </div>

              {/* Preview Table */}
              {importPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800">Pré-visualização dos Registros ({importPreview.length})</span>
                    <div className="flex gap-2 text-[11px]">
                      <span className="text-emerald-600 font-semibold">✓ {importPreview.filter((r) => r.statusRow === 'VALIDO').length} Válidos</span>
                      <span className="text-rose-600 font-semibold">⚠ {importPreview.filter((r) => r.statusRow === 'INVALIDO').length} Com erro</span>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b text-[10px] uppercase font-bold text-slate-500">
                        <tr>
                          <th className="p-2">Linha</th>
                          <th className="p-2">Nome / Razão Social</th>
                          <th className="p-2">CPF / CNPJ</th>
                          <th className="p-2">Validação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importPreview.map((r, i) => (
                          <tr key={i} className={r.statusRow === 'VALIDO' ? 'bg-emerald-50/30' : 'bg-rose-50/40'}>
                            <td className="p-2 font-mono font-bold text-slate-600">#{r.linha}</td>
                            <td className="p-2 font-medium text-slate-800">{r.nome || '-'}</td>
                            <td className="p-2 font-mono text-slate-600">{r.cpfCnpj || '-'}</td>
                            <td className="p-2">
                              {r.statusRow === 'VALIDO' ? (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                  ✓ Válido
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full" title={r.motivo}>
                                  ⚠ {r.motivo}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl active:scale-95 transition-all text-xs"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={isImporting || !importFile || importPreview.filter((r) => r.statusRow === 'VALIDO').length === 0}
                onClick={handleConfirmImport}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/20 active:scale-95 transition-all text-xs flex items-center gap-2 disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <span className="animate-spin text-sm">⏳</span>
                    <span>Importando...</span>
                  </>
                ) : (
                  <span>Confirmar Importação</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
