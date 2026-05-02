package com.example.tool.controller;

import com.example.tool.dto.ComplianceRequest;
import com.example.tool.entity.Compliance;
import com.example.tool.service.ComplianceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/compliance")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ComplianceController {

    private final ComplianceService complianceService;

    @GetMapping
    public List<Compliance> getAll() {
        return complianceService.getAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Compliance create(@Valid @RequestBody ComplianceRequest request) {
        return complianceService.create(request);
    }

    @PutMapping("/{id}")
    public Compliance update(@PathVariable Long id, @Valid @RequestBody ComplianceRequest request) {
        return complianceService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        complianceService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public List<Compliance> search(@RequestParam String q) {
        return complianceService.search(q);
    }

    @GetMapping("/stats")
    public Map<String, Long> stats() {
        return complianceService.getStats();
    }
}

