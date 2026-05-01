package com.example.tool.service;

import com.example.tool.dto.ComplianceRequest;
import com.example.tool.entity.Compliance;
import com.example.tool.exception.InvalidDataException;
import com.example.tool.exception.ResourceNotFoundException;
import com.example.tool.repository.ComplianceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ComplianceService {

    private final ComplianceRepository complianceRepository;

    public Compliance createRecord(ComplianceRequest request) {
        validate(request);
        Compliance compliance = new Compliance();
        compliance.setTitle(request.getTitle());
        compliance.setDescription(request.getDescription());
        compliance.setStatus(request.getStatus());
        compliance.setDueDate(request.getDueDate());
        return complianceRepository.save(compliance);
    }

    public List<Compliance> getAllRecords() {
        return complianceRepository.findAll();
    }

    public Compliance getRecordById(Long id) {
        return complianceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Compliance record not found with id: " + id));
    }

    public Compliance updateRecord(Long id, ComplianceRequest request) {
        validate(request);
        Compliance existing = getRecordById(id);
        existing.setTitle(request.getTitle());
        existing.setDescription(request.getDescription());
        existing.setStatus(request.getStatus());
        existing.setDueDate(request.getDueDate());
        return complianceRepository.save(existing);
    }

    public void deleteRecord(Long id) {
        if (!complianceRepository.existsById(id)) {
            throw new ResourceNotFoundException("Compliance record not found with id: " + id);
        }
        complianceRepository.deleteById(id);
    }

    // --- kept for controller compatibility ---

    public List<Compliance> getAll() {
        return getAllRecords();
    }

    public Compliance getById(Long id) {
        return getRecordById(id);
    }

    public Compliance create(ComplianceRequest request) {
        return createRecord(request);
    }

    public Compliance update(Long id, ComplianceRequest request) {
        return updateRecord(id, request);
    }

    public void delete(Long id) {
        deleteRecord(id);
    }

    public List<Compliance> search(String keyword) {
        return complianceRepository.searchByTitle(keyword);
    }

    public Map<String, Long> getStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("total", complianceRepository.count());
        stats.put("pending", (long) complianceRepository.findByStatus("PENDING").size());
        stats.put("completed", (long) complianceRepository.findByStatus("COMPLETED").size());
        stats.put("overdue", (long) complianceRepository.findByStatus("OVERDUE").size());
        return stats;
    }

    private void validate(ComplianceRequest request) {
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new InvalidDataException("Title must not be empty");
        }
        if (request.getDueDate() != null && request.getDueDate().isBefore(LocalDate.now())) {
            throw new InvalidDataException("Due date must not be in the past");
        }
    }
}
