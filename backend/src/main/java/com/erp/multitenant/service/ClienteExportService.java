package com.erp.multitenant.service;

import com.erp.multitenant.config.TenantContext;
import com.erp.multitenant.model.Cliente;
import com.erp.multitenant.repository.ClienteRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ClienteExportService {

    private final ClienteRepository clienteRepository;

    public ClienteExportService(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
    }

    public byte[] generateTemplate(String formato) throws IOException {
        String[] headers = {"nome_razao_social", "cpf_cnpj", "inscricao_estadual", "telefone", "email", "observacao", "status"};

        if ("xlsx".equalsIgnoreCase(formato) || "xls".equalsIgnoreCase(formato)) {
            try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                Sheet sheet = workbook.createSheet("Modelo Clientes");
                Row headerRow = sheet.createRow(0);
                CellStyle headerStyle = workbook.createCellStyle();
                Font font = workbook.createFont();
                font.setBold(true);
                headerStyle.setFont(font);

                for (int i = 0; i < headers.length; i++) {
                    Cell cell = headerRow.createCell(i);
                    cell.setCellValue(headers[i]);
                    cell.setCellStyle(headerStyle);
                }

                Row sampleRow = sheet.createRow(1);
                sampleRow.createCell(0).setCellValue("Cliente Exemplo Ltda");
                sampleRow.createCell(1).setCellValue("12.345.678/0001-90");
                sampleRow.createCell(2).setCellValue("110.123.456.789");
                sampleRow.createCell(3).setCellValue("(11) 98765-4321");
                sampleRow.createCell(4).setCellValue("contato@exemplo.com");
                sampleRow.createCell(5).setCellValue("Observação de teste");
                sampleRow.createCell(6).setCellValue("ATIVO");

                for (int i = 0; i < headers.length; i++) {
                    sheet.autoSizeColumn(i);
                }

                workbook.write(out);
                return out.toByteArray();
            }
        } else {
            StringBuilder sb = new StringBuilder();
            sb.append(String.join(",", headers)).append("\n");
            sb.append("Cliente Exemplo Ltda,12.345.678/0001-90,110.123.456.789,(11) 98765-4321,contato@exemplo.com,Observação de teste,ATIVO\n");
            return sb.toString().getBytes(StandardCharsets.UTF_8);
        }
    }

    @Transactional(readOnly = true)
    public byte[] exportClientes(String formato, String search) throws IOException {
        String tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null || tenantId.isBlank()) tenantId = "empresa_demo";

        List<Cliente> clientes = clienteRepository.findByTenantId(tenantId);

        if (search != null && !search.trim().isEmpty()) {
            String term = search.trim().toLowerCase();
            clientes = clientes.stream().filter(c ->
                (c.getNome() != null && c.getNome().toLowerCase().contains(term)) ||
                (c.getCpfCnpj() != null && c.getCpfCnpj().toLowerCase().contains(term))
            ).toList();
        }

        if ("xlsx".equalsIgnoreCase(formato) || "xls".equalsIgnoreCase(formato)) {
            try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                Sheet sheet = workbook.createSheet("Clientes");
                Row headerRow = sheet.createRow(0);
                String[] headers = {"ID", "Nome / Razão Social", "CPF / CNPJ", "Inscrição Estadual", "Telefone", "E-mail", "Observação", "Tenant"};

                CellStyle headerStyle = workbook.createCellStyle();
                Font font = workbook.createFont();
                font.setBold(true);
                headerStyle.setFont(font);

                for (int i = 0; i < headers.length; i++) {
                    Cell cell = headerRow.createCell(i);
                    cell.setCellValue(headers[i]);
                    cell.setCellStyle(headerStyle);
                }

                int rowIdx = 1;
                for (Cliente c : clientes) {
                    Row row = sheet.createRow(rowIdx++);
                    row.createCell(0).setCellValue(c.getId() != null ? c.getId() : 0);
                    row.createCell(1).setCellValue(c.getNome() != null ? c.getNome() : "");
                    row.createCell(2).setCellValue(c.getCpfCnpj() != null ? c.getCpfCnpj() : "");
                    row.createCell(3).setCellValue(c.getInscricaoEstadual() != null ? c.getInscricaoEstadual() : "");
                    row.createCell(4).setCellValue(c.getTelefone() != null ? c.getTelefone() : "");
                    row.createCell(5).setCellValue(c.getEmail() != null ? c.getEmail() : "");
                    row.createCell(6).setCellValue(c.getObservacao() != null ? c.getObservacao() : "");
                    row.createCell(7).setCellValue(c.getTenantId() != null ? c.getTenantId() : "");
                }

                for (int i = 0; i < headers.length; i++) {
                    sheet.autoSizeColumn(i);
                }

                workbook.write(out);
                return out.toByteArray();
            }
        } else {
            StringBuilder sb = new StringBuilder();
            sb.append("ID,Nome / Razão Social,CPF / CNPJ,Inscrição Estadual,Telefone,E-mail,Observação,Tenant\n");
            for (Cliente c : clientes) {
                sb.append(c.getId()).append(",")
                  .append(escapeCsv(c.getNome())).append(",")
                  .append(escapeCsv(c.getCpfCnpj())).append(",")
                  .append(escapeCsv(c.getInscricaoEstadual())).append(",")
                  .append(escapeCsv(c.getTelefone())).append(",")
                  .append(escapeCsv(c.getEmail())).append(",")
                  .append(escapeCsv(c.getObservacao())).append(",")
                  .append(escapeCsv(c.getTenantId())).append("\n");
            }
            return sb.toString().getBytes(StandardCharsets.UTF_8);
        }
    }

    public Map<String, Object> importClientes(MultipartFile file) throws IOException {
        String tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null || tenantId.isBlank()) tenantId = "empresa_demo";

        List<Map<String, String>> rows = parseFile(file);
        List<Map<String, Object>> erros = new ArrayList<>();
        List<AbstractMap.SimpleEntry<Cliente, Integer>> clientesSalvar = new ArrayList<>();
        Set<String> cpfCnpjsInFile = new HashSet<>();

        List<Cliente> existingClientes = clienteRepository.findByTenantId(tenantId);
        Set<String> existingDbCpfsClean = existingClientes.stream()
                .map(c -> c.getCpfCnpj() != null ? c.getCpfCnpj().replaceAll("[^0-9]", "") : "")
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());

        Set<String> existingDbCpfsRaw = existingClientes.stream()
                .map(c -> c.getCpfCnpj() != null ? c.getCpfCnpj().trim().toLowerCase() : "")
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());

        int linhaIdx = 1; // Header is line 1
        for (Map<String, String> row : rows) {
            linhaIdx++;
            String nome = getFirstNonEmpty(row, 0, "nome_razao_social", "nome", "razao_social", "nome/razão social", "cliente", "razao social", "nome/razao social", "nome_razao");
            String cpfCnpj = getFirstNonEmpty(row, 1, "cpf_cnpj", "cpf", "cnpj", "cpf/cnpj", "cpf / cnpj", "documento");
            String ie = getFirstNonEmpty(row, 2, "inscricao_estadual", "ie", "inscrição_estadual", "inscricao estadual");
            String telefone = getFirstNonEmpty(row, 3, "telefone", "tel", "celular", "fone");
            String email = getFirstNonEmpty(row, 4, "email", "e-mail");
            String obs = getFirstNonEmpty(row, 5, "observacao", "observação", "obs");

            if (nome.isEmpty()) {
                erros.add(Map.of("linha", linhaIdx, "motivo", "Nome/Razão Social é obrigatório"));
                continue;
            }

            if (cpfCnpj.isEmpty()) {
                erros.add(Map.of("linha", linhaIdx, "motivo", "CPF/CNPJ é obrigatório"));
                continue;
            }

            String cleanCpf = cpfCnpj.replaceAll("[^0-9]", "");
            String lowerCpf = cpfCnpj.trim().toLowerCase();

            if (!cleanCpf.isEmpty() && cpfCnpjsInFile.contains(cleanCpf)) {
                erros.add(Map.of("linha", linhaIdx, "motivo", "CPF/CNPJ duplicado no mesmo arquivo: " + cpfCnpj));
                continue;
            }

            if ((!cleanCpf.isEmpty() && existingDbCpfsClean.contains(cleanCpf)) || existingDbCpfsRaw.contains(lowerCpf)) {
                erros.add(Map.of("linha", linhaIdx, "motivo", "CPF/CNPJ já cadastrado no sistema: " + cpfCnpj));
                continue;
            }

            if (!cleanCpf.isEmpty()) {
                cpfCnpjsInFile.add(cleanCpf);
            }

            Cliente c = new Cliente();
            c.setNome(nome);
            c.setCpfCnpj(cpfCnpj);
            c.setInscricaoEstadual(ie.isEmpty() ? "ISENTO" : ie);
            c.setTelefone(telefone);
            c.setEmail(email);
            c.setObservacao(obs);
            c.setTenantId(tenantId);
            c.setCriadoEm(LocalDateTime.now());
            clientesSalvar.add(new AbstractMap.SimpleEntry<>(c, linhaIdx));
        }

        int importadosCount = 0;
        for (AbstractMap.SimpleEntry<Cliente, Integer> entry : clientesSalvar) {
            Cliente c = entry.getKey();
            int linhaNo = entry.getValue();
            try {
                clienteRepository.saveAndFlush(c);
                importadosCount++;
                String clean = c.getCpfCnpj().replaceAll("[^0-9]", "");
                if (!clean.isEmpty()) existingDbCpfsClean.add(clean);
                existingDbCpfsRaw.add(c.getCpfCnpj().trim().toLowerCase());
            } catch (Exception ex) {
                String causeMsg = ex.getCause() != null ? ex.getCause().getMessage() : ex.getMessage();
                erros.add(Map.of("linha", linhaNo, "motivo", "Erro ao salvar no banco: " + causeMsg));
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("importados", importadosCount);
        result.put("erros", erros);
        return result;
    }

    private List<Map<String, String>> parseFile(MultipartFile file) throws IOException {
        String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
            return parseExcel(file.getInputStream());
        } else {
            return parseCsv(file.getInputStream());
        }
    }

    private List<Map<String, String>> parseCsv(InputStream is) throws IOException {
        List<Map<String, String>> result = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            String line = reader.readLine();
            if (line == null) return result;

            if (line.startsWith("\uFEFF")) {
                line = line.substring(1);
            }

            String[] headers = line.split("[,;]");
            for (int i = 0; i < headers.length; i++) {
                headers[i] = normalizeHeader(headers[i]);
            }

            while ((line = reader.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                String[] values = line.split("[,;]", -1);
                Map<String, String> row = new HashMap<>();
                for (int i = 0; i < values.length; i++) {
                    String cleanVal = values[i].trim().replace("\"", "");
                    row.put("col_" + i, cleanVal);
                    if (i < headers.length) {
                        row.put(headers[i], cleanVal);
                    }
                }
                result.add(row);
            }
        }
        return result;
    }

    private List<Map<String, String>> parseExcel(InputStream is) throws IOException {
        List<Map<String, String>> result = new ArrayList<>();
        try (Workbook workbook = WorkbookFactory.create(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rowIterator = sheet.iterator();
            if (!rowIterator.hasNext()) return result;

            Row headerRow = rowIterator.next();
            List<String> headers = new ArrayList<>();
            DataFormatter formatter = new DataFormatter();
            for (Cell cell : headerRow) {
                headers.add(normalizeHeader(formatter.formatCellValue(cell)));
            }

            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                Map<String, String> rowMap = new HashMap<>();
                boolean hasContent = false;
                for (int i = 0; i < headers.size() || i < row.getLastCellNum(); i++) {
                    Cell cell = row.getCell(i);
                    String val = formatter.formatCellValue(cell).trim();
                    if (!val.isEmpty()) hasContent = true;
                    rowMap.put("col_" + i, val);
                    if (i < headers.size()) {
                        rowMap.put(headers.get(i), val);
                    }
                }
                if (hasContent) {
                    result.add(rowMap);
                }
            }
        }
        return result;
    }

    private String getFirstNonEmpty(Map<String, String> row, int fallbackColIndex, String... keys) {
        for (String key : keys) {
            String val = row.get(key);
            if (val != null && !val.trim().isEmpty()) {
                return val.trim();
            }
        }
        String fallback = row.get("col_" + fallbackColIndex);
        if (fallback != null && !fallback.trim().isEmpty()) {
            return fallback.trim();
        }
        return "";
    }

    private String normalizeHeader(String input) {
        if (input == null) return "";
        return input.trim()
                .toLowerCase()
                .replace("\"", "")
                .replace("\uFEFF", "")
                .replace("ã", "a")
                .replace("ç", "c")
                .replace("õ", "o")
                .replace("á", "a")
                .replace("é", "e")
                .replace("í", "i")
                .replace("ó", "o")
                .replace("ú", "u")
                .replace(" ", "_");
    }

    private String escapeCsv(String input) {
        if (input == null) return "";
        if (input.contains(",") || input.contains("\"") || input.contains("\n")) {
            return "\"" + input.replace("\"", "\"\"") + "\"";
        }
        return input;
    }
}
