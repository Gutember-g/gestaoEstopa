import api from '../services/api';
import { formatCurrencyBRL } from './money';

export const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  const userAgent = navigator.userAgent || navigator.vendor || window.opera || '';
  const isTouchMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isSmallScreen = window.innerWidth <= 768;
  return isTouchMobile || isSmallScreen;
};

export const cleanPhoneForWhatsApp = (phoneStr) => {
  let digits = String(phoneStr || '').replace(/[^\d]/g, '');
  if (!digits) return '';
  if (digits.length === 10 || digits.length === 11) {
    digits = `55${digits}`;
  }
  return digits;
};

/**
 * Downloads PDF/Document blob for a given sale ID
 */
export const downloadSaleDocument = async (vendaId, formato = 'pdf') => {
  try {
    const res = await api.get(`/vendas/${vendaId}/documento`, {
      params: { formato },
      responseType: 'blob',
    });
    const mime =
      formato === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf';
    const ext = formato === 'xlsx' ? 'xlsx' : 'pdf';
    const url = window.URL.createObjectURL(new Blob([res.data], { type: mime }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `pedido_venda_${vendaId}.${ext}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    try {
      const res = await api.get(`/vendas/${vendaId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `pedido_venda_${vendaId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      return true;
    } catch {
      return false;
    }
  }
};

/**
 * Executes full dispatch flow for Email and/or WhatsApp
 */
export const dispatchSaleDocument = async ({
  vendaId,
  status = 'CONFIRMADA',
  cliente,
  itens = [],
  valorTotal = 0,
  prazoDias = 0,
  enviarEmail = false,
  enviarWhatsapp = false,
  formatoDocumento = 'pdf',
  showSuccess = console.log,
  showError = console.error,
  preOpenedWindow = null,
}) => {
  // CRITICAL FOR POPUP BLOCKER BYPASS:
  // If a preOpenedWindow was opened synchronously on user click, use it! Otherwise try opening placeholder window.
  let waWindow = preOpenedWindow;
  if (enviarWhatsapp && (!waWindow || waWindow.closed)) {
    try {
      waWindow = window.open('about:blank', '_blank');
      if (waWindow && waWindow.document) {
        waWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head><title>Processando WhatsApp...</title></head>
            <body style="font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; color: #334155;">
              <div style="text-align: center; padding: 20px;">
                <h3 style="margin-bottom: 8px;">🔄 Processando envio para WhatsApp...</h3>
                <p style="color: #64748b; font-size: 14px;">O documento PDF está sendo gerado. Você será redirecionado em instantes.</p>
              </div>
            </body>
          </html>
        `);
      }
    } catch {
      waWindow = null;
    }
  }

  try {
    let clienteNome = cliente?.nome || cliente?.clienteNome || 'Cliente';
    let clienteEmail = (cliente?.email || cliente?.clienteEmail || '').trim();
    let clientePhone = (cliente?.telefone || cliente?.clienteTelefone || '').trim();
    const clienteId = cliente?.id || cliente?.clienteId;

    // Resolve client details from API if email or phone is missing
    if ((!clienteEmail || !clientePhone) && (clienteId || clienteNome)) {
      try {
        const resAll = await api.get('/clientes');
        const list = Array.isArray(resAll.data) ? resAll.data : (resAll.data?.content || []);
        const found = list.find(
          (c) => String(c.id) === String(clienteId) || c.nome?.toLowerCase() === clienteNome?.toLowerCase()
        );
        if (found) {
          if (!clienteEmail && found.email) clienteEmail = found.email.trim();
          if (!clientePhone && found.telefone) clientePhone = found.telefone.trim();
          if (!clienteNome && found.nome) clienteNome = found.nome;
        }
      } catch (e) {
        console.warn('Falha ao buscar dados cadastrais do cliente:', e);
      }
    }

    // Resolve sale details from API if items or total is missing
    let finalItens = itens;
    let finalValorTotal = valorTotal;
    let finalPrazoDias = prazoDias;
    let finalStatus = status;

    if (!finalItens || finalItens.length === 0 || !finalValorTotal) {
      try {
        const resVenda = await api.get(`/vendas/${vendaId}`);
        if (resVenda.data) {
          if ((!finalItens || finalItens.length === 0) && resVenda.data.itens) {
            finalItens = resVenda.data.itens;
          }
          if (!finalValorTotal && resVenda.data.valorTotal) {
            finalValorTotal = resVenda.data.valorTotal;
          }
          if (resVenda.data.prazoFaturamentoDias !== undefined) {
            finalPrazoDias = resVenda.data.prazoFaturamentoDias;
          }
          if (resVenda.data.status) {
            finalStatus = resVenda.data.status;
          }
          if (!clienteNome && resVenda.data.clienteNome) {
            clienteNome = resVenda.data.clienteNome;
          }
        }
      } catch (e) {
        console.warn('Falha ao buscar detalhes da venda:', e);
      }
    }

    const tipoStr = finalStatus === 'ORCAMENTO' ? 'Orçamento' : 'Venda Confirmada';
    const valorTotalFormatted = formatCurrencyBRL(finalValorTotal);
    const prazoStr = finalPrazoDias === 0 ? 'À Vista (0 dias)' : `${finalPrazoDias} dias`;

    // Step 1: Download PDF
    if (enviarEmail || enviarWhatsapp) {
      await downloadSaleDocument(vendaId, formatoDocumento);
    }

    // Step 2: Record dispatch log on backend API
    try {
      await api.post(`/vendas/${vendaId}/emissao-envio`, {
        enviarEmail,
        enviarWhatsapp,
        formatoDocumento,
      });
    } catch (e) {
      console.warn('Falha ao gravar log no backend:', e);
    }

    // Build items summary text
    const itensSummary = (finalItens || [])
      .map((it) => `- ${it.quantidade || 1}x ${it.nomeProduto || it.sku || 'Produto'} (${formatCurrencyBRL(it.precoNoMomento || it.precoUnitario || 0)})`)
      .join('\n');

    // Step 3: Handle Email dispatch (mailto:)
    if (enviarEmail && clienteEmail) {
      const subject = `${tipoStr} #${vendaId} - FlowERP`;
      const body = `Olá, ${clienteNome}!

Segue o resumo do seu ${tipoStr} #${vendaId}:

• Cliente: ${clienteNome}
• ID do Pedido: #${vendaId}
• Valor Total: ${valorTotalFormatted}
• Prazo de Faturamento: ${prazoStr}

Itens do Pedido:
${itensSummary || '- Itens conforme discriminado em anexo'}

O documento em PDF foi baixado em seu dispositivo. Por favor, anexe o PDF a este e-mail antes de enviar!

Atenciosamente,
Equipe FlowERP`;

      const mailtoUrl = `mailto:${encodeURIComponent(clienteEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoUrl;
    }

    // Step 4: Handle WhatsApp dispatch
    if (enviarWhatsapp) {
      if (clientePhone) {
        const cleanPhone = cleanPhoneForWhatsApp(clientePhone);

        const waText = `Olá, ${clienteNome}! Segue o resumo do seu *${tipoStr.toUpperCase()} #${vendaId}*:

📋 *Pedido #${vendaId}* (${tipoStr})
👤 *Cliente:* ${clienteNome}
💰 *Valor Total:* ${valorTotalFormatted}
📅 *Prazo:* ${prazoStr}

📦 *Itens:*
${itensSummary || '- Itens conforme discriminado no PDF'}

📄 O documento em PDF acabou de ser baixado no seu dispositivo e será enviado em seguida nesta conversa. Por favor, confirme o recebimento!`;

        const encodedText = encodeURIComponent(waText);
        // Correct WhatsApp URL format: https://wa.me/[numero]?text=[mensagem]
        const waUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;

        console.log('[WhatsApp Dispatch Diagnostic]', {
          isMobile: isMobileDevice(),
          originalPhone: clientePhone,
          cleanPhone,
          waUrl,
          hasWindow: !!waWindow && !waWindow.closed,
        });

        if (waWindow && !waWindow.closed) {
          waWindow.location.href = waUrl;
        } else {
          const fallbackWin = window.open(waUrl, '_blank', 'noopener,noreferrer');
          if (!fallbackWin) {
            // Popup blocker prevented opening new tab, redirect current location as ultimate fallback
            window.location.href = waUrl;
          }
        }
      } else {
        if (waWindow && !waWindow.closed) {
          waWindow.close();
        }
      }
    }

    // Step 5: Show clean notification toasts with clear user instructions
    if (enviarEmail && enviarWhatsapp) {
      showSuccess(
        `PDF baixado! Anexe o arquivo no E-mail e no WhatsApp que foram abertos. 📎✓`
      );
    } else if (enviarEmail) {
      if (clienteEmail) {
        showSuccess(
          `PDF baixado — anexe o arquivo ao e-mail que foi aberto antes de enviar. 📧✓`
        );
      } else {
        showSuccess(
          `PDF baixado! (Cliente sem e-mail cadastrado para envio automático).`
        );
      }
    } else if (enviarWhatsapp) {
      if (clientePhone) {
        showSuccess(
          `PDF baixado — anexe o arquivo na conversa do WhatsApp que foi aberta antes de enviar. 📱✓`
        );
      } else {
        showSuccess(
          `PDF baixado! (Cliente sem telefone cadastrado para envio por WhatsApp).`
        );
      }
    }
  } catch (err) {
    if (waWindow && !waWindow.closed) {
      waWindow.close();
    }
    showError(err.message || 'Falha ao processar envio do documento.');
  }
};
