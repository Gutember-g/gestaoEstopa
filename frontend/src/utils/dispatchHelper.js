import api from '../services/api';
import { formatCurrencyBRL } from './money';

export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    typeof navigator !== 'undefined' ? navigator.userAgent : ''
  );
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
}) => {
  const tipoStr = status === 'ORCAMENTO' ? 'Orçamento' : 'Venda Confirmada';
  const clienteNome = cliente?.nome || 'Cliente';
  const clienteEmail = cliente?.email?.trim();
  const clientePhone = cliente?.telefone?.trim();
  const valorTotalFormatted = formatCurrencyBRL(valorTotal);
  const prazoStr = prazoDias === 0 ? 'À Vista (0 dias)' : `${prazoDias} dias`;

  // Step 1: Trigger PDF Download if Email or WhatsApp is selected
  if (enviarEmail || enviarWhatsapp) {
    await downloadSaleDocument(vendaId, formatoDocumento);
  }

  // Record dispatch log on backend
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
  const itensSummary = itens
    .map((it) => `- ${it.quantidade}x ${it.nomeProduto || it.sku || 'Produto'} (${formatCurrencyBRL(it.precoNoMomento || it.precoUnitario || 0)})`)
    .join('\n');

  // Step 2: Handle Email dispatch
  if (enviarEmail && clienteEmail) {
    const subject = `${tipoStr} #${vendaId} - FlowERP`;
    const body = `Olá, ${clienteNome}!

Segue o resumo do seu ${tipoStr} #${vendaId}:

• Cliente: ${clienteNome}
• ID do Pedido: #${vendaId}
• Valor Total: ${valorTotalFormatted}
• Prazo de Faturamento: ${prazoStr}

Itens do Pedido:
${itensSummary}

O documento em PDF foi baixado em seu dispositivo. Por favor, anexe o PDF a este e-mail antes de enviar!

Atenciosamente,
Equipe FlowERP`;

    const mailtoUrl = `mailto:${encodeURIComponent(clienteEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  }

  // Step 3: Handle WhatsApp dispatch
  if (enviarWhatsapp && clientePhone) {
    const cleanPhone = cleanPhoneForWhatsApp(clientePhone);

    const waText = `Olá, ${clienteNome}! Segue o resumo do seu *${tipoStr.toUpperCase()} #${vendaId}*:

📋 *Pedido #${vendaId}* (${tipoStr})
👤 *Cliente:* ${clienteNome}
💰 *Valor Total:* ${valorTotalFormatted}
📅 *Prazo:* ${prazoStr}

📦 *Itens:*
${itensSummary}

📄 O documento em PDF acabou de ser baixado no seu dispositivo e será enviado em seguida nesta conversa. Por favor, confirme o recebimento!`;

    const encodedText = encodeURIComponent(waText);
    const isMobile = isMobileDevice();

    let waUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;
    if (isMobile) {
      waUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodedText}`;
    } else {
      waUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
    }

    // Small delay if email was also opened to prevent pop-up blocking
    const delay = enviarEmail ? 600 : 100;
    setTimeout(() => {
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }, delay);
  }

  // Step 4: Show clear, friendly user notifications with attachment instructions
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
};
