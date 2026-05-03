package com.example.tool.controller;

import com.example.tool.dto.ComplianceRequest;
import com.example.tool.dto.ComplianceResponse;
import com.example.tool.service.ComplianceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/compliance")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ComplianceController {

    private final ComplianceService complianceService;

    // GET /api/compliance?page=0&size=10&sort=dueDate,asc  → 200 OK
    @GetMapping
    public ResponseEntity<Page<ComplianceResponse>> getAll(
            @PageableDefault(size = 10, sort = "dueDate", direction = Sort.Direction.ASC) Pageable pageable) {
        return ResponseEntity.ok(complianceService.getAllRecords(pageable).map(ComplianceResponse::new));
    }

    // GET /api/compliance/{id}  → 200 OK | 404 NOT FOUND
    @GetMapping("/{id}")
    public ResponseEntity<ComplianceResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(new ComplianceResponse(complianceService.getRecordById(id)));
    }

    // POST /api/compliance  → 201 CREATED | 400 BAD REQUEST
    @PostMapping
    public ResponseEntity<ComplianceResponse> create(@Valid @RequestBody ComplianceRequest request) {
        ComplianceResponse body = new ComplianceResponse(complianceService.createRecord(request));
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(body.getId()).toUri();
        return ResponseEntity.created(location).body(body);
    }

    // PUT /api/compliance/{id}  → 200 OK | 400 BAD REQUEST | 404 NOT FOUND
    @PutMapping("/{id}")
    public ResponseEntity<ComplianceResponse> update(
            @PathVariable Long id, @Valid @RequestBody ComplianceRequest request) {
        return ResponseEntity.ok(new ComplianceResponse(complianceService.updateRecord(id, request)));
    }

    // DELETE /api/compliance/{id}  → 204 NO CONTENT | 404 NOT FOUND  (soft delete)
    @DeleteMapping("/{id}")
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
