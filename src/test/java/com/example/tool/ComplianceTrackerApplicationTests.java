package com.example.tool;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class ComplianceTrackerApplicationTests {

    @Test
    void contextLoads() {
        // Verifies that the Spring application context starts up without errors
    }
}
