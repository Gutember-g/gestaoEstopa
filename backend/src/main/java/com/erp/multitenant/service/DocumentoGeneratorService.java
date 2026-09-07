package com.erp.multitenant.service;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;

import com.erp.multitenant.model.Cliente;
import com.erp.multitenant.model.ItemVenda;
import com.erp.multitenant.model.Venda;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class DocumentoGeneratorService {

    private final DecimalFormat fmtCurrency = new DecimalFormat("R$ #,##0.00");
    private final DateTimeFormatter fmtDateTime = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private final DateTimeFormatter fmtDate = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    // Company Header Info (Default / Tenant)
    private static final String COMPANY_NAME = "Gestão Estopa Comercial Ltda";
    private static final String COMPANY_FANTASIA = "Estopas & Panos Premium";
    private static final String COMPANY_CNPJ = "12.345.678/0001-90";
    private static final String COMPANY_PHONE = "(11) 3456-7890";
    private static final String COMPANY_EMAIL = "comercial@gestaoestopa.com.br";
    private static final String COMPANY_ADDRESS = "Rua das Indústrias, 1000 - São Paulo, SP";

    public byte[] gerarDocumentoVenda(Venda venda, String formato) {
        if ("xlsx".equalsIgnoreCase(formato)) {
            return gerarXlsxVenda(venda);
        }
        return gerarPdfVenda(venda);
    }

    public byte[] gerarPdfVenda(Venda venda) {
        Document doc = new Document(PageSize.A4, 36, 36, 36, 36);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(doc, out);
            doc.open();

            // Fonts
            com.lowagie.text.Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, new Color(30, 41, 59));
            com.lowagie.text.Font subTitleFont = FontFactory.getFont(FontFactory.HELVETICA, 10, new Color(100, 116, 139));
            com.lowagie.text.Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, new Color(30, 41, 59));
            com.lowagie.text.Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.BLACK);
            com.lowagie.text.Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 9, new Color(51, 65, 85));
            com.lowagie.text.Font footerFont = FontFactory.getFont(FontFactory.HELVETICA, 8, new Color(148, 163, 184));

            // 1. Company Header Box
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[]{3, 2});
            headerTable.setSpacingAfter(15);

            PdfPCell companyCell = new PdfPCell();
            companyCell.setBorder(Rectangle.NO_BORDER);
            companyCell.addElement(new Paragraph("🏢 " + COMPANY_NAME, titleFont));
            companyCell.addElement(new Paragraph(COMPANY_FANTASIA + "  |  CNPJ: " + COMPANY_CNPJ, subTitleFont));
            companyCell.addElement(new Paragraph("Endereço: " + COMPANY_ADDRESS, subTitleFont));
            companyCell.addElement(new Paragraph("Contato: " + COMPANY_PHONE + " | " + COMPANY_EMAIL, subTitleFont));
            headerTable.addCell(companyCell);

            PdfPCell orderMetaCell = new PdfPCell();
            orderMetaCell.setBorder(Rectangle.NO_BORDER);
            orderMetaCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            String titleText = "ORCAMENTO".equalsIgnoreCase(venda.getStatus()) ? "ORÇAMENTO DE VENDA" : "PEDIDO DE VENDA";
            Paragraph pOrder = new Paragraph(titleText, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, new Color(37, 99, 235)));
            pOrder.setAlignment(Element.ALIGN_RIGHT);
            orderMetaCell.addElement(pOrder);

            Paragraph pNum = new Paragraph("#" + (venda.getId() != null ? venda.getId() : "0000"), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, Color.DARK_GRAY));
            pNum.setAlignment(Element.ALIGN_RIGHT);
            orderMetaCell.addElement(pNum);

            String dataEmissaoStr = venda.getDataVenda() != null ? venda.getDataVenda().format(fmtDateTime) : LocalDateTimeNowFormatted();
            Paragraph pDate = new Paragraph("Emissão: " + dataEmissaoStr, subTitleFont);
            pDate.setAlignment(Element.ALIGN_RIGHT);
            orderMetaCell.addElement(pDate);

            headerTable.addCell(orderMetaCell);
            doc.add(headerTable);

            // Divider line
            PdfPTable divider = new PdfPTable(1);
            divider.setWidthPercentage(100);
            PdfPCell dCell = new PdfPCell();
            dCell.setFixedHeight(2f);
            dCell.setBackgroundColor(new Color(226, 232, 240));
            dCell.setBorder(Rectangle.NO_BORDER);
            divider.addCell(dCell);
            divider.setSpacingAfter(15);
            doc.add(divider);

            // 2. Customer & Billing Info Grid
            Cliente cliente = venda.getCliente();
            PdfPTable infoGrid = new PdfPTable(2);
            infoGrid.setWidthPercentage(100);
            infoGrid.setWidths(new float[]{1, 1});
            infoGrid.setSpacingAfter(15);

            // Customer Block
            PdfPCell custCell = new PdfPCell();
            custCell.setBackgroundColor(new Color(248, 250, 252));
            custCell.setPadding(10);
            custCell.setBorderColor(new Color(226, 232, 240));
            custCell.addElement(new Paragraph("👤 DADOS DO CLIENTE", sectionFont));
            custCell.addElement(new Paragraph("Nome: " + (cliente != null ? cliente.getNome() : "Cliente Balcão"), boldFont));
            custCell.addElement(new Paragraph("CPF/CNPJ: " + (cliente != null && cliente.getCpfCnpj() != null ? cliente.getCpfCnpj() : "-"), normalFont));
            custCell.addElement(new Paragraph("E-mail: " + (cliente != null && cliente.getEmail() != null ? cliente.getEmail() : "-"), normalFont));
            custCell.addElement(new Paragraph("Telefone: " + (cliente != null && cliente.getTelefone() != null ? cliente.getTelefone() : "-"), normalFont));
            custCell.addElement(new Paragraph("Endereço: " + (cliente != null && cliente.getEndereco() != null ? cliente.getEndereco() : "Não informado"), normalFont));
            infoGrid.addCell(custCell);

            // Billing Terms Block
            PdfPCell billCell = new PdfPCell();
            billCell.setBackgroundColor(new Color(248, 250, 252));
            billCell.setPadding(10);
            billCell.setBorderColor(new Color(226, 232, 240));
            billCell.addElement(new Paragraph("💳 CONDIÇÕES DE FATURAMENTO", sectionFont));
            Integer prazoDias = venda.getPrazoFaturamentoDias() != null ? venda.getPrazoFaturamentoDias() : 30;
            String prazoText = prazoDias == 0 ? "À Vista (0 dias)" : prazoDias + " dias";
            billCell.addElement(new Paragraph("Prazo para Pagamento: " + prazoText, boldFont));

            LocalDate dtVenc = venda.getDataVencimento();
            if (dtVenc == null && venda.getDataVenda() != null) {
                dtVenc = venda.getDataVenda().toLocalDate().plusDays(prazoDias);
            } else if (dtVenc == null) {
                dtVenc = LocalDate.now().plusDays(prazoDias);
            }
            billCell.addElement(new Paragraph("Vencimento Estimado: " + dtVenc.format(fmtDate), boldFont));
            billCell.addElement(new Paragraph("Status do Pedido: PENDENTE DE FATURAMENTO", normalFont));
            billCell.addElement(new Paragraph("Moeda: BRL (R$)", normalFont));
            infoGrid.addCell(billCell);

            doc.add(infoGrid);

            // 3. Products Table Section
            Paragraph pItensHead = new Paragraph("📦 ITENS DO PEDIDO DE VENDA", sectionFont);
            pItensHead.setSpacingAfter(8);
            doc.add(pItensHead);

            PdfPTable itemsTable = new PdfPTable(5);
            itemsTable.setWidthPercentage(100);
            itemsTable.setWidths(new float[]{0.8f, 3.5f, 1f, 1.5f, 1.5f});
            itemsTable.setSpacingAfter(15);

            addTableHeaderCell(itemsTable, "Item", boldFont);
            addTableHeaderCell(itemsTable, "Descrição do Produto", boldFont);
            addTableHeaderCell(itemsTable, "Qtd", boldFont);
            addTableHeaderCell(itemsTable, "Preço Unit. (R$)", boldFont);
            addTableHeaderCell(itemsTable, "Subtotal (R$)", boldFont);

            List<ItemVenda> itens = venda.getItens();
            BigDecimal subtotalCalculado = BigDecimal.ZERO;

            if (itens == null || itens.isEmpty()) {
                // If no items list, add default row based on sale total
                BigDecimal unitPrice = venda.getValorTotal() != null ? venda.getValorTotal() : BigDecimal.ZERO;
                addTableRowCell(itemsTable, "1", normalFont, Element.ALIGN_CENTER);
                addTableRowCell(itemsTable, "Estopa Branca Premium / Lote Comercial", normalFont, Element.ALIGN_LEFT);
                addTableRowCell(itemsTable, "1", normalFont, Element.ALIGN_CENTER);
                addTableRowCell(itemsTable, fmtCurrency.format(unitPrice), normalFont, Element.ALIGN_RIGHT);
                addTableRowCell(itemsTable, fmtCurrency.format(unitPrice), boldFont, Element.ALIGN_RIGHT);
                subtotalCalculado = unitPrice;
            } else {
                int itemIdx = 1;
                for (ItemVenda item : itens) {
                    BigDecimal sub = item.getPrecoNoMomento().multiply(BigDecimal.valueOf(item.getQuantidade()));
                    subtotalCalculado = subtotalCalculado.add(sub);

                    addTableRowCell(itemsTable, String.valueOf(itemIdx++), normalFont, Element.ALIGN_CENTER);
                    addTableRowCell(itemsTable, item.getNomeProduto(), normalFont, Element.ALIGN_LEFT);
                    addTableRowCell(itemsTable, String.valueOf(item.getQuantidade()), normalFont, Element.ALIGN_CENTER);
                    addTableRowCell(itemsTable, fmtCurrency.format(item.getPrecoNoMomento()), normalFont, Element.ALIGN_RIGHT);
                    addTableRowCell(itemsTable, fmtCurrency.format(sub), boldFont, Element.ALIGN_RIGHT);
                }
            }
            doc.add(itemsTable);

            // 4. Totals Summary Box
            BigDecimal desconto = venda.getDesconto() != null ? venda.getDesconto() : BigDecimal.ZERO;
            BigDecimal totalFinal = venda.getValorTotal() != null ? venda.getValorTotal() : subtotalCalculado.subtract(desconto);

            PdfPTable totalsTable = new PdfPTable(2);
            totalsTable.setWidthPercentage(45);
            totalsTable.setHorizontalAlignment(Element.ALIGN_RIGHT);
            totalsTable.setSpacingAfter(25);

            addTotalRow(totalsTable, "Subtotal dos Produtos:", fmtCurrency.format(subtotalCalculado), normalFont, normalFont);
            addTotalRow(totalsTable, "Desconto Concedido:", "-" + fmtCurrency.format(desconto), normalFont, normalFont);

            com.lowagie.text.Font bigTotalFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, new Color(37, 99, 235));
            addTotalRow(totalsTable, "VALOR TOTAL FINAL:", fmtCurrency.format(totalFinal), bigTotalFont, bigTotalFont);

            doc.add(totalsTable);

            // 5. Footer & Terms
            Paragraph termsHead = new Paragraph("OBSERVAÇÕES E CONDIÇÕES GERAIS", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.DARK_GRAY));
            termsHead.setSpacingAfter(4);
            doc.add(termsHead);

            Paragraph termsBody = new Paragraph(
                    "• O pagamento deste pedido deverá ser efetuado de acordo com o prazo de faturamento acordado.\n" +
                    "• Quaisquer divergências nos itens entregues devem ser notificadas em até 48 horas após o recebimento.\n" +
                    "• Documento gerado automaticamente pelo ERP Gestão Estopa em " + LocalDate.now().format(fmtDate) + ".",
                    footerFont
            );
            termsBody.setSpacingAfter(20);
            doc.add(termsBody);

            doc.close();
            return out.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Erro ao gerar PDF detalhado da venda #" + venda.getId(), e);
        }
    }

    public byte[] gerarXlsxVenda(Venda venda) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Pedido Venda #" + (venda.getId() != null ? venda.getId() : "0"));

            // Styles
            CellStyle headerStyle = workbook.createCellStyle();
            Font hFont = workbook.createFont();
            hFont.setBold(true);
            hFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(hFont);
            headerStyle.setFillForegroundColor(IndexedColors.ROYAL_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            CellStyle boldStyle = workbook.createCellStyle();
            Font bFont = workbook.createFont();
            bFont.setBold(true);
            boldStyle.setFont(bFont);

            // Title Block
            int rowNum = 0;
            Row r0 = sheet.createRow(rowNum++);
            r0.createCell(0).setCellValue("EMPRESA EMISSORA:");
            r0.getCell(0).setCellStyle(boldStyle);
            r0.createCell(1).setCellValue(COMPANY_NAME + " (CNPJ: " + COMPANY_CNPJ + ")");

            Row r1 = sheet.createRow(rowNum++);
            String labelDoc = "ORCAMENTO".equalsIgnoreCase(venda.getStatus()) ? "ORÇAMENTO DE VENDA:" : "PEDIDO DE VENDA:";
            r1.createCell(0).setCellValue(labelDoc);
            r1.getCell(0).setCellStyle(boldStyle);
            r1.createCell(1).setCellValue("#" + (venda.getId() != null ? venda.getId() : 0));

            Row r2 = sheet.createRow(rowNum++);
            r2.createCell(0).setCellValue("DATA EMISSÃO:");
            r2.getCell(0).setCellStyle(boldStyle);
            r2.createCell(1).setCellValue(venda.getDataVenda() != null ? venda.getDataVenda().format(fmtDateTime) : LocalDateTimeNowFormatted());

            rowNum++; // Spacer

            // Customer Block
            Cliente cliente = venda.getCliente();
            Row rCust = sheet.createRow(rowNum++);
            rCust.createCell(0).setCellValue("CLIENTE:");
            rCust.getCell(0).setCellStyle(boldStyle);
            rCust.createCell(1).setCellValue(cliente != null ? cliente.getNome() : "Cliente Balcão");

            Row rCpf = sheet.createRow(rowNum++);
            rCpf.createCell(0).setCellValue("CPF/CNPJ:");
            rCpf.getCell(0).setCellStyle(boldStyle);
            rCpf.createCell(1).setCellValue(cliente != null && cliente.getCpfCnpj() != null ? cliente.getCpfCnpj() : "-");

            Row rMail = sheet.createRow(rowNum++);
            rMail.createCell(0).setCellValue("E-MAIL:");
            rMail.getCell(0).setCellStyle(boldStyle);
            rMail.createCell(1).setCellValue(cliente != null && cliente.getEmail() != null ? cliente.getEmail() : "-");

            Row rTel = sheet.createRow(rowNum++);
            rTel.createCell(0).setCellValue("TELEFONE:");
            rTel.getCell(0).setCellStyle(boldStyle);
            rTel.createCell(1).setCellValue(cliente != null && cliente.getTelefone() != null ? cliente.getTelefone() : "-");

            rowNum++; // Spacer

            // Line Items Table Header
            Row tableHeader = sheet.createRow(rowNum++);
            String[] headers = {"Item", "Descrição do Produto", "Quantidade", "Custo Unit. (R$)", "Preço Unit. (R$)", "Subtotal (R$)"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = tableHeader.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Line Items Content
            List<ItemVenda> itens = venda.getItens();
            BigDecimal subtotal = BigDecimal.ZERO;

            if (itens == null || itens.isEmpty()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(1);
                row.createCell(1).setCellValue("Estopa Branca Premium / Lote Comercial");
                row.createCell(2).setCellValue(1);
                row.createCell(3).setCellValue(venda.getCustoTotal() != null ? venda.getCustoTotal().doubleValue() : 0.0);
                row.createCell(4).setCellValue(venda.getValorTotal() != null ? venda.getValorTotal().doubleValue() : 0.0);
                row.createCell(5).setCellValue(venda.getValorTotal() != null ? venda.getValorTotal().doubleValue() : 0.0);
                subtotal = venda.getValorTotal() != null ? venda.getValorTotal() : BigDecimal.ZERO;
            } else {
                int itemIdx = 1;
                for (ItemVenda item : itens) {
                    BigDecimal lineSub = item.getPrecoNoMomento().multiply(BigDecimal.valueOf(item.getQuantidade()));
                    subtotal = subtotal.add(lineSub);

                    Row row = sheet.createRow(rowNum++);
                    row.createCell(0).setCellValue(itemIdx++);
                    row.createCell(1).setCellValue(item.getNomeProduto());
                    row.createCell(2).setCellValue(item.getQuantidade());
                    row.createCell(3).setCellValue(item.getCustoNoMomento() != null ? item.getCustoNoMomento().doubleValue() : 0.0);
                    row.createCell(4).setCellValue(item.getPrecoNoMomento() != null ? item.getPrecoNoMomento().doubleValue() : 0.0);
                    row.createCell(5).setCellValue(lineSub.doubleValue());
                }
            }

            rowNum++; // Spacer

            // Totals Row
            BigDecimal desconto = venda.getDesconto() != null ? venda.getDesconto() : BigDecimal.ZERO;
            BigDecimal totalFinal = venda.getValorTotal() != null ? venda.getValorTotal() : subtotal.subtract(desconto);

            Row rSub = sheet.createRow(rowNum++);
            rSub.createCell(4).setCellValue("SUBTOTAL:");
            rSub.getCell(4).setCellStyle(boldStyle);
            rSub.createCell(5).setCellValue(subtotal.doubleValue());

            Row rDesc = sheet.createRow(rowNum++);
            rDesc.createCell(4).setCellValue("DESCONTO:");
            rDesc.getCell(4).setCellStyle(boldStyle);
            rDesc.createCell(5).setCellValue(desconto.doubleValue());

            Row rTot = sheet.createRow(rowNum++);
            rTot.createCell(4).setCellValue("TOTAL FINAL:");
            rTot.getCell(4).setCellStyle(boldStyle);
            rTot.createCell(5).setCellValue(totalFinal.doubleValue());

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();

        } catch (IOException e) {
            throw new RuntimeException("Erro ao gerar planilha XLSX da venda #" + venda.getId(), e);
        }
    }

    private void addTableHeaderCell(PdfPTable table, String text, com.lowagie.text.Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(new Color(241, 245, 249));
        cell.setPadding(6);
        cell.setBorderColor(new Color(226, 232, 240));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(cell);
    }

    private void addTableRowCell(PdfPTable table, String text, com.lowagie.text.Font font, int align) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(6);
        cell.setBorderColor(new Color(226, 232, 240));
        cell.setHorizontalAlignment(align);
        table.addCell(cell);
    }

    private void addTotalRow(PdfPTable table, String label, String value, com.lowagie.text.Font fontLabel, com.lowagie.text.Font fontValue) {
        PdfPCell cellLabel = new PdfPCell(new Phrase(label, fontLabel));
        cellLabel.setBorder(Rectangle.NO_BORDER);
        cellLabel.setHorizontalAlignment(Element.ALIGN_LEFT);
        cellLabel.setPadding(4);
        table.addCell(cellLabel);

        PdfPCell cellVal = new PdfPCell(new Phrase(value, fontValue));
        cellVal.setBorder(Rectangle.NO_BORDER);
        cellVal.setHorizontalAlignment(Element.ALIGN_RIGHT);
        cellVal.setPadding(4);
        table.addCell(cellVal);
    }

    private String LocalDateTimeNowFormatted() {
        return java.time.LocalDateTime.now().format(fmtDateTime);
    }
}
