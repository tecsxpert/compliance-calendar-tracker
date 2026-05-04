package com.example.tool.controller;

import com.example.tool.dto.LoginRequest;
import com.example.tool.dto.RegisterRequest;
import com.example.tool.entity.Compliance;
import com.example.tool.repository.ComplianceRepository;
import com.example.tool.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ComplianceIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired ComplianceRepository complianceRepository;
    @Autowired UserRepository userRepository;

    private static String adminToken;
    private static String viewerToken;
    private static Long createdId;

    @Test @Order(1)
    void registerAdmin() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("admin_test");
        req.setPassword("admin123");
        req.setEmail("admin@test.com");
        req.setRole("ADMIN");

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username", is("admin_test")))
                .andExpect(jsonPath("$.role", is("ADMIN")))
                .andExpect(jsonPath("$.accessToken", notNullValue()));
    }

    @Test @Order(2)
    void registerViewer() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("viewer_test");
        req.setPassword("viewer123");
        req.setEmail("viewer@test.com");

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role", is("VIEWER")));
    }

    @Test @Order(3)
    void loginAdmin() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setUsername("admin_test");
        req.setPassword("admin123");

        MvcResult result = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken", notNullValue()))
                .andReturn();

        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        adminToken = body.get("accessToken").asText();
    }

    @Test @Order(4)
    void loginViewer() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setUsername("viewer_test");
        req.setPassword("viewer123");

        MvcResult result = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        viewerToken = body.get("accessToken").asText();
    }

    @Test @Order(5)
    void adminCanCreateCompliance() throws Exception {
        String body = """
                {
                  "title": "GDPR Annual Review",
                  "description": "Annual GDPR compliance review",
                  "status": "PENDING",
                  "dueDate": "2025-12-31"
                }
                """;

        MvcResult result = mockMvc.perform(post("/api/compliance")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title", is("GDPR Annual Review")))
                .andExpect(jsonPath("$.status", is("PENDING")))
                .andExpect(jsonPath("$.id", notNullValue()))
                .andReturn();

        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        createdId = node.get("id").asLong();
    }

    @Test @Order(6)
    void viewerCannotCreateCompliance() throws Exception {
        String body = """
                {
                  "title": "Unauthorized Item",
                  "status": "PENDING",
                  "dueDate": "2025-12-31"
                }
                """;

        mockMvc.perform(post("/api/compliance")
                        .header("Authorization", "Bearer " + viewerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden());
    }

    @Test @Order(7)
    void viewerCanGetAllCompliance() throws Exception {
        mockMvc.perform(get("/api/compliance")
                        .header("Authorization", "Bearer " + viewerToken)
                        .param("page", "0")
                        .param("size", "10")
                        .param("sortBy", "id")
                        .param("sortDir", "asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", isA(java.util.List.class)))
                .andExpect(jsonPath("$.totalElements", greaterThanOrEqualTo(1)));
    }

    @Test @Order(8)
    void unauthenticatedCannotGetCompliance() throws Exception {
        mockMvc.perform(get("/api/compliance"))
                .andExpect(status().isUnauthorized());
    }

    @Test @Order(9)
    void adminCanUpdateCompliance() throws Exception {
        String body = """
                {
                  "title": "GDPR Annual Review - Updated",
                  "description": "Updated description",
                  "status": "IN_PROGRESS",
                  "dueDate": "2025-11-30"
                }
                """;

        mockMvc.perform(put("/api/compliance/" + createdId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("GDPR Annual Review - Updated")))
                .andExpect(jsonPath("$.status", is("IN_PROGRESS")));
    }

    @Test @Order(10)
    void viewerCannotUpdateCompliance() throws Exception {
        String body = """
                {
                  "title": "Hacked",
                  "status": "PENDING",
                  "dueDate": "2025-12-31"
                }
                """;

        mockMvc.perform(put("/api/compliance/" + createdId)
                        .header("Authorization", "Bearer " + viewerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden());
    }

    @Test @Order(11)
    void searchByKeyword() throws Exception {
        mockMvc.perform(get("/api/compliance/search")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("q", "GDPR"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.content[0].title", containsString("GDPR")));
    }

    @Test @Order(12)
    void adminCanGetStats() throws Exception {
        mockMvc.perform(get("/api/compliance/stats")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total", greaterThanOrEqualTo(1)));
    }

    @Test @Order(13)
    void viewerCannotGetStats() throws Exception {
        mockMvc.perform(get("/api/compliance/stats")
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isForbidden());
    }

    @Test @Order(14)
    void csvExportReturnsFile() throws Exception {
        mockMvc.perform(get("/api/compliance/export")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "text/csv"))
                .andExpect(content().string(containsString("ID,Title")))
                .andExpect(content().string(containsString("GDPR")));
    }

    @Test @Order(15)
    void createWithMissingTitleReturns400() throws Exception {
        String body = """
                {
                  "status": "PENDING",
                  "dueDate": "2025-12-31"
                }
                """;

        mockMvc.perform(post("/api/compliance")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.title", notNullValue()));
    }

    @Test @Order(16)
    void viewerCannotDelete() throws Exception {
        mockMvc.perform(delete("/api/compliance/" + createdId)
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isForbidden());
    }

    @Test @Order(17)
    void adminCanDelete() throws Exception {
        mockMvc.perform(delete("/api/compliance/" + createdId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());
    }

    @Test @Order(18)
    void deleteNonExistentReturns404() throws Exception {
        mockMvc.perform(delete("/api/compliance/999999")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }

    @AfterAll
    static void cleanup(@Autowired UserRepository userRepo) {
        userRepo.findByUsername("admin_test").ifPresent(userRepo::delete);
        userRepo.findByUsername("viewer_test").ifPresent(userRepo::delete);
    }
}
