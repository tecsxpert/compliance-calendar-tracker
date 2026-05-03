package com.example.tool.service;

import com.example.tool.dto.ComplianceRequest;
import com.example.tool.entity.Compliance;
import com.example.tool.exception.InvalidDataException;
import com.example.tool.exception.ResourceNotFoundException;
import com.example.tool.repository.ComplianceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ComplianceService {

    private final ComplianceRepository complianceRepository;

    public Compliance createRecord(ComplianceRequest request) {
        validate(request);
        Compliance c = new Compliance();
        c.setTitle(request.getTitle());
        c.setDescription(request.getDescription());
        c.setStatus(request.getStatus());
        c.setDueDate(request.getDueDate());
        return complianceRepository.save(c);
    }

    public Page<Compliance> getAllRecords(Pageable pageable) {
        return complianceRepository.findByIsDeletedFalse(pageable);
    }

    public Compliance getRecordById(Long id) {
        return complianceRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Compliance record not found with id: " + id));
    }

    public Compliance updateRecord(Long id, ComplianceRequest request) {
        validate(request);
        Compliance c = getRecordById(id);
        c.setTitle(request.getTitle());
        c.setDescription(request.getDescription());
        c.setStatus(request.getStatus());
        c.setDueDate(request.getDueDate());
        return complianceRepository.save(c);
    }

    public void deleteRecord(Long id) {
        Compliance c = complianceRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Compliance record not found with id: " + id));
        c.setDeleted(true);
        complianceRepository.save(c);
    }

    public List<Compliance> search(String keyword) {
        return complianceRepository.search(keyword);
    }

    public Map<String, Long> getStats() {
        return Map.of(
                "total",     complianceRepository.countByIsDeletedFalse(),
                "pending",   complianceRepository.countByStatusAndIsDeletedFalse("PENDING"),
                "completed", complianceRepository.countByStatusAndIsDeletedFalse("COMPLETED"),
                "overdue",   complianceRepository.countByStatusAndIsDeletedFalse("OVERDUE"),
                "open",      complianceRepository.countByStatusAndIsDeletedFalse("OPEN"),
                "closed",    complianceRepository.countByStatusAndIsDeletedFalse("CLOSED")
        );
    }

    // --- legacy delegates (scheduler + backward compat) ---

    public List<Compliance> getAll() {
        return complianceRepository.findAll();
    }

    public Compliance getById(Long id)                          { return getRecordById(id); }
    public Compliance create(ComplianceRequest r)               { return createRecord(r); }
    public Compliance update(Long id, ComplianceRequest r)      { return updateRecord(id, r); }
    public void delete(Long id)                                 { deleteRecord(id); }

    // --- private ---

    private void validate(ComplianceRequest r) {
        if (r.getTitle() == null || r.getTitle().isBlank())
            throw new InvalidDataException("Title must not be empty");
        if (r.getDueDate() != null && r.getDueDate().isBefore(LocalDate.now()))
            throw new InvalidDataException("Due date must not be in the past");
    }
}
