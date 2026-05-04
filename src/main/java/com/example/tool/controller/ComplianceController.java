package com.example.tool.controller;

import com.example.tool.dto.ComplianceRequest;
import com.example.tool.dto.ComplianceResponse;
import com.example.tool.entity.Compliance;
import com.example.tool.service.ComplianceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

/**
 * REST controller for Compliance CRUD, search, stats, and CSV export.
 *
 * RBAC:
 *   VIEWER  → GET endpoints
 *   MANAGER → GET + POST + PUT
 *   ADMIN   → all including DELETE
 */
@RestController
@RequestMapping("/api/compliance")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ComplianceController {

    private final ComplianceService complianceService;

    // ── GET all (paginated) ───────────────────────────────────────

    /**
     * GET /api/compliance?page=0&size=10&sortBy=id&sortDir=asc
     *
     * Sample response:
     * {
     *   "content": [{ "id":1, "title":"GDPR Review", "status":"PENDING", "dueDate":"2025-12-31" }],
     *   "totalElements": 1, "totalPages": 1, "number": 0, "size": 10
     * }
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('VIEWER','MANAGER','ADMIN')")
    public Page<ComplianceResponse> getAll(
            @RequestParam(defaultValue = "0")   int page,
            @RequestParam(defaultValue = "10")  int size,
            @RequestParam(defaultValue = "id")  String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        return complianceService.getAll(page, size, sortBy, sortDir)
                .map(ComplianceResponse::new);
    }

    // ── POST create ───────────────────────────────────────────────

    /**
     * POST /api/compliance
     * Body: { "title":"GDPR Review", "status":"PENDING", "dueDate":"2025-12-31" }
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public ComplianceResponse create(@Valid @RequestBody ComplianceRequest request) {
        return new ComplianceResponse(complianceService.create(request));
    }

    // ── PUT update ────────────────────────────────────────────────

    /**
     * PUT /api/compliance/{id}
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public ComplianceResponse update(@PathVariable Long id,
                                     @Valid @RequestBody ComplianceRequest request) {
        return new ComplianceResponse(complianceService.update(id, request));
    }

    // ── DELETE ────────────────────────────────────────────────────

    /**
     * DELETE /api/compliance/{id}
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        complianceService.deleteRecord(id);
        return ResponseEntity.noContent().build();
    }

    // GET /api/compliance/search?q=keyword  → 200 OK
    @GetMapping("/search")
    public ResponseEntity<List<ComplianceResponse>> search(@RequestParam String q) {
        List<ComplianceResponse> results = complianceService.search(q)
                .stream().map(ComplianceResponse::new).toList();
        return ResponseEntity.ok(results);
    }

    // GET /api/compliance/stats  → 200 OK
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> stats() {
        return ResponseEntity.ok(complianceService.getStats());
    }
}
