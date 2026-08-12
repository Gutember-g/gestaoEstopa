package com.erp.multitenant.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.erp.multitenant.model.Parcela;
import com.erp.multitenant.model.Venda;
import com.erp.multitenant.repository.ParcelaRepository;
import com.erp.multitenant.repository.VendaRepository;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.text.DecimalFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class VendaExportService {

    private final VendaRepository vendaRepository;
    private final ParcelaRepository parcelaRepository;
    private final String defaultTenant = "empresa_demo";
    private final DecimalFormat fmtCurrency = new DecimalFormat("R$ #,##0.00");
    private final DateTimeFormatter fmtDate = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public VendaExportService(VendaRepository vendaRepository, ParcelaRepository parcelaRepository) {
        this.vendaRepository = vendaRepository;
        this.parcelaRepository = parcelaRepository;
    }

    @Transactional(readOnly = true)
    public byte[] exportVendasMes(Integer mes, Integer ano, String formato) throws IOException {
        LocalDate hoje = LocalDate.now();
        int targetMes = (mes != null) ? mes : hoje.getMonthValue();
        int targetAno = (ano != null) ? ano : hoje.getYear();

        List<Venda> vendas = vendaRepository.findByMesEAno(defaultTenant, targetMes, targetAno);

        if ("xlsx".equalsIgnoreCase(formato)) {
            return generateVendasXlsx(vendas, targetMes, targetAno);
        } else if ("pdf".equalsIgnoreCase(formato)) {
            return generateVendasPdf(vendas, targetMes, targetAno);
        } else {
            return generateVendasCsv(vendas);
        }
    }

    @Transactional(readOnly = true)
    public byte[] exportVendaIndividualPdf(Long id) {
        Venda venda = vendaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Venda não encontrada com o ID: " + id));

        List<Parcela> parcelas = parcelaRepository.findByMesEAno(defaultTenant,
                venda.getDataVenda().getMonthValue(), venda.getDataVenda().getYear())
                .stream().filter(p -> p.getVenda() != null && p.getVenda().getId().equals(id)).toList();

        Document doc = new Document(PageSize.A4, 36, 36, 36, 36);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(doc, out);
            doc.open();

            // Header Title Box
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Color.DARK_GRAY);
            Font subFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.GRAY);
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.BLACK);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.DARK_GRAY);

            Paragraph header = new Paragraph("FlowERP — Comprovante de Pedido de Venda", titleFont);
            header.setSpacingAfter(4);
            doc.add(header);

            Paragraph tenantInfo = new Paragraph("Empresa / Tenant: " + defaultTenant + "  |  Venda #" + venda.getId(), subFont);
            tenantInfo.setSpacingAfter(15);
            doc.add(tenantInfo);

            // Client & Sale Info Section
            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(100);
            infoTable.setSpacingAfter(15);

            PdfPCell cellLeft = new PdfPCell();
            cellLeft.setBorder(Rectangle.NO_BORDER);
            cellLeft.addElement(new Paragraph("DADOS DO CLIENTE", boldFont));
            String clienteNome = (venda.getCliente() != null) ? venda.getCliente().getNome() : "Cliente N/A";
            String cpfCnpj = (venda.getCliente() != null) ? venda.getCliente().getCpfCnpj() : "-";
            String telefone = (venda.getCliente() != null) ? venda.getCliente().getTelefone() : "-";
            cellLeft.addElement(new Paragraph("Nome: " + clienteNome, normalFont));
            cellLeft.addElement(new Paragraph("CPF/CNPJ: " + cpfCnpj, normalFont));
            cellLeft.addElement(new Paragraph("Telefone: " + telefone, normalFont));
            infoTable.addCell(cellLeft);

            PdfPCell cellRight = new PdfPCell();
            cellRight.setBorder(Rectangle.NO_BORDER);
            cellRight.addElement(new Paragraph("DETALHES DA VENDA", boldFont));
            cellRight.addElement(new Paragraph("Data da Venda: " + (venda.getDataVenda() != null ? venda.getDataVenda().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) : "-"), normalFont));
            cellRight.addElement(new Paragraph("Valor Total: " + fmtCurrency.format(venda.getValorTotal() != null ? venda.getValorTotal() : BigDecimal.ZERO), boldFont));
            cellRight.addElement(new Paragraph("Desconto: " + fmtCurrency.format(venda.getDesconto() != null ? venda.getDesconto() : BigDecimal.ZERO), normalFont));
            cellRight.addElement(new Paragraph("Lucro Líquido: " + fmtCurrency.format(venda.getLucroLiquido() != null ? venda.getLucroLiquido() : BigDecimal.ZERO), normalFont));
            infoTable.addCell(cellRight);

            doc.add(infoTable);

            // Financial Installments Section
            Paragraph parcelasHeader = new Paragraph("PARCELAS FINANCEIRAS", boldFont);
            parcelasHeader.setSpacingAfter(8);
            doc.add(parcelasHeader);

            PdfPTable pTable = new PdfPTable(4);
            pTable.setWidthPercentage(100);
            pTable.setWidths(new float[]{1, 2, 2, 2});
            pTable.setSpacingAfter(20);

            addTableHeader(pTable, new String[]{"Nº", "Vencimento", "Valor", "Status"});

            if (parcelas.isEmpty()) {
                PdfPCell emptyCell = new PdfPCell(new Phrase("Nenhuma parcela avulsa registrada para esta venda.", normalFont));
                emptyCell.setColspan(4);
                emptyCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                emptyCell.setPadding(8);
                pTable.addCell(emptyCell);
            } else {
                for (Parcela p : parcelas) {
                    pTable.addCell(new Phrase(String.valueOf(p.getNumeroSequencial()), normalFont));
                    pTable.addCell(new Phrase(p.getDataVencimento() != null ? p.getDataVencimento().format(fmtDate) : "-", normalFont));
                    pTable.addCell(new Phrase(fmtCurrency.format(p.getValor() != null ? p.getValor() : BigDecimal.ZERO), normalFont));
                    pTable.addCell(new Phrase(p.getStatus() != null ? p.getStatus().name() : "-", boldFont));
                }
            }
            doc.add(pTable);

            // Footer / Signatures
            Paragraph footer = new Paragraph("Gerado automaticamente pelo sistema FlowERP em " + LocalDate.now().format(fmtDate), subFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            doc.add(footer);

            doc.close();
            return out.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Erro ao gerar PDF da venda #" + id, e);
        }
    }

    private byte[] generateVendasPdf(List<Venda> vendas, int mes, int ano) {
        Document doc = new Document(PageSize.A4.rotate(), 20, 20, 20, 20);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        String[] MESES = {"Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"};
        String nomeMes = (mes >= 1 && mes <= 12) ? MESES[mes - 1] : String.valueOf(mes);

        try {
            PdfWriter.getInstance(doc, out);
            doc.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, Color.BLACK);
            Font subFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.GRAY);
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.BLACK);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 8, Color.DARK_GRAY);

            Paragraph header = new Paragraph("FlowERP — Relatório Consolidado de Vendas", titleFont);
            header.setSpacingAfter(4);
            doc.add(header);

            Paragraph sub = new Paragraph("Período: " + nomeMes + " / " + ano + "  |  Tenant: " + defaultTenant + "  |  Total Registros: " + vendas.size(), subFont);
            sub.setSpacingAfter(12);
            doc.add(sub);

            PdfPTable table = new PdfPTable(7);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1, 3, 2, 2, 2, 2, 2});
            table.setSpacingAfter(15);

            addTableHeader(table, new String[]{"ID", "Cliente", "Data Venda", "Custo Total", "Valor Total", "Desconto", "Lucro Líquido"});

            BigDecimal totalCusto = BigDecimal.ZERO;
            BigDecimal totalValor = BigDecimal.ZERO;
            BigDecimal totalLucro = BigDecimal.ZERO;

            for (Venda v : vendas) {
                table.addCell(new Phrase("#" + v.getId(), normalFont));
                table.addCell(new Phrase(v.getCliente() != null ? v.getCliente().getNome() : "Cliente N/A", normalFont));
                table.addCell(new Phrase(v.getDataVenda() != null ? v.getDataVenda().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) : "-", normalFont));
                table.addCell(new Phrase(fmtCurrency.format(v.getCustoTotal() != null ? v.getCustoTotal() : BigDecimal.ZERO), normalFont));
                table.addCell(new Phrase(fmtCurrency.format(v.getValorTotal() != null ? v.getValorTotal() : BigDecimal.ZERO), normalFont));
                table.addCell(new Phrase(fmtCurrency.format(v.getDesconto() != null ? v.getDesconto() : BigDecimal.ZERO), normalFont));
                table.addCell(new Phrase(fmtCurrency.format(v.getLucroLiquido() != null ? v.getLucroLiquido() : BigDecimal.ZERO), boldFont));

                if (v.getCustoTotal() != null) totalCusto = totalCusto.add(v.getCustoTotal());
                if (v.getValorTotal() != null) totalValor = totalValor.add(v.getValorTotal());
                if (v.getLucroLiquido() != null) totalLucro = totalLucro.add(v.getLucroLiquido());
            }

            // Totals Row
            PdfPCell totalLabelCell = new PdfPCell(new Phrase("TOTAIS DO PERÍODO", boldFont));
            totalLabelCell.setColspan(3);
            totalLabelCell.setBackgroundColor(new Color(240, 240, 240));
            table.addCell(totalLabelCell);

            PdfPCell c1 = new PdfPCell(new Phrase(fmtCurrency.format(totalCusto), boldFont));
            c1.setBackgroundColor(new Color(240, 240, 240));
            table.addCell(c1);

            PdfPCell c2 = new PdfPCell(new Phrase(fmtCurrency.format(totalValor), boldFont));
            c2.setBackgroundColor(new Color(240, 240, 240));
            table.addCell(c2);

            PdfPCell c3 = new PdfPCell(new Phrase("-", boldFont));
            c3.setBackgroundColor(new Color(240, 240, 240));
            table.addCell(c3);

            PdfPCell c4 = new PdfPCell(new Phrase(fmtCurrency.format(totalLucro), boldFont));
            c4.setBackgroundColor(new Color(240, 240, 240));
            table.addCell(c4);

            doc.add(table);
            doc.close();
            return out.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Erro ao gerar PDF de vendas", e);
        }
    }

    private byte[] generateVendasXlsx(List<Venda> vendas, int mes, int ano) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Vendas " + mes + "-" + ano);
            Row headerRow = sheet.createRow(0);
            String[] headers = {"ID Venda", "Cliente", "CPF / CNPJ", "Data Venda", "Custo Total", "Valor Total", "Desconto", "Lucro Líquido"};

            CellStyle headerStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (Venda v : vendas) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(v.getId() != null ? v.getId() : 0);
                row.createCell(1).setCellValue(v.getCliente() != null ? v.getCliente().getNome() : "");
                row.createCell(2).setCellValue(v.getCliente() != null ? v.getCliente().getCpfCnpj() : "");
                row.createCell(3).setCellValue(v.getDataVenda() != null ? v.getDataVenda().toString() : "");
                row.createCell(4).setCellValue(v.getCustoTotal() != null ? v.getCustoTotal().doubleValue() : 0.0);
                row.createCell(5).setCellValue(v.getValorTotal() != null ? v.getValorTotal().doubleValue() : 0.0);
                row.createCell(6).setCellValue(v.getDesconto() != null ? v.getDesconto().doubleValue() : 0.0);
                row.createCell(7).setCellValue(v.getLucroLiquido() != null ? v.getLucroLiquido().doubleValue() : 0.0);
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    private byte[] generateVendasCsv(List<Venda> vendas) {
        StringBuilder sb = new StringBuilder();
        sb.append("ID Venda,Cliente,CPF/CNPJ,Data Venda,Custo Total,Valor Total,Desconto,Lucro Liquido\n");
        for (Venda v : vendas) {
            String cliente = v.getCliente() != null ? v.getCliente().getNome() : "";
            String cpfCnpj = v.getCliente() != null ? v.getCliente().getCpfCnpj() : "";
            sb.append(v.getId()).append(",")
              .append(escapeCsv(cliente)).append(",")
              .append(escapeCsv(cpfCnpj)).append(",")
              .append(v.getDataVenda()).append(",")
              .append(v.getCustoTotal()).append(",")
              .append(v.getValorTotal()).append(",")
              .append(v.getDesconto()).append(",")
              .append(v.getLucroLiquido()).append("\n");
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private void addTableHeader(PdfPTable table, String[] columnTitles) {
        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE);
        for (String columnTitle : columnTitles) {
            PdfPCell headerCell = new PdfPCell();
            headerCell.setBackgroundColor(new Color(51, 65, 85)); // Slate 700
            headerCell.setPadding(6);
            headerCell.setPhrase(new Phrase(columnTitle, headerFont));
            table.addCell(headerCell);
        }
    }

    private String escapeCsv(String input) {
        if (input == null) return "";
        if (input.contains(",") || input.contains("\"") || input.contains("\n")) {
            return "\"" + input.replace("\"", "\"\"") + "\"";
        }
        return input;
    }
}
