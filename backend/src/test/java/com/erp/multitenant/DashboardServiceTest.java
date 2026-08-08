package com.erp.multitenant;

import com.erp.multitenant.config.TenantContext;
import com.erp.multitenant.dto.DashboardDTO;
import com.erp.multitenant.service.DashboardService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class DashboardServiceTest {

    @Autowired
    private DashboardService dashboardService;

    @BeforeEach
    public void setUp() {
        TenantContext.setCurrentTenant("empresa_demo");
    }

    @AfterEach
    public void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("Should return valid aggregated dashboard metrics for active tenant")
    public void testGetDashboardData() {
        DashboardDTO dto = dashboardService.getDashboardData();

        assertNotNull(dto);
        assertNotNull(dto.faturamentoMensal());
        assertNotNull(dto.lucroLiquidoMensal());
        assertNotNull(dto.topClientes());
        assertNotNull(dto.alertas());
        assertFalse(dto.topClientes().isEmpty());
    }
}
