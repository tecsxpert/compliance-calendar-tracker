package com.example.tool.controller;

import com.example.tool.dto.ComplianceRequest;
import com.example.tool.entity.Compliance;
import com.example.tool.service.ComplianceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/compliance")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ComplianceController {

    private final ComplianceService complianceService;

    /**
     * List all compliance items.
     * Accessible by: VIEWER, MANAGER, ADMIN
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('VIEWER', 'MANAGER', 'ADMIN')")
    public List<Compliance> getAll() {
        return complianceService.getAll();
    }

    /**
     * Create a new compliance item.
     * Accessible by: MANAGER, ADMIN
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public Compliance create(@Valid @RequestBody ComplianceRequest request) {
        return complianceService.create(request);
    }

    /**
     * Update an existing compliance item.
     * Accessible by: MANAGER, ADMIN
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public Compliance update(@PathVariable Long id, @Valid @RequestBody ComplianceRequest request) {
        return complianceService.update(id, request);
    }

    /**
     * Delete a compliance item.
     * Accessible by: ADMIN only
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        complianceService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Search compliance items by title keyword.
     * Accessible by: VIEWER, MANAGER, ADMIN
     */
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('VIEWER', 'MANAGER', 'ADMIN')")
    public List<Compliance> search(@RequestParam String q) {
        return complianceService.search(q);
    }

    /**
     * Get compliance statistics.
     * Accessible by: MANAGER, ADMIN
     */
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public Map<String, Long> stats() {
        return complianceService.getStats();
    }
}
