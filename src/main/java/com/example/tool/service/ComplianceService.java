package com.example.tool.service;

import com.example.tool.dto.ComplianceRequest;
import com.example.tool.entity.Compliance;
import com.example.tool.exception.InvalidDataException;
import com.example.tool.exception.ResourceNotFoundException;
import com.example.tool.repository.ComplianceRepository;
import com.example.tool.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ComplianceService {

    private final ComplianceRepository complianceRepository;
    private final EmailService emailService;
    private final UserRepository userRepository;

    public Page<Compliance> getAll(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name()) ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        return complianceRepository.findAll(PageRequest.of(page, size, sort));
    }

    public List<Compliance> exportAll() {
        return complianceRepository.findAll();
    }

    @Cacheable(value = "complianceRecords", key = "#pageable.pageNumber + '-' + #pageable.pageSize + '-' + #pageable.sort", unless = "#result == null")
    public Page<Compliance> getAllRecords(Pageable pageable) {
        log.info("Cache MISS - fetching complianceRecords from DB for page: {}", pageable.getPageNumber());
        return complianceRepository.findByIsDeletedFalse(pageable);
    }

    public Compliance create(ComplianceRequest request) {
        Compliance compliance = new Compliance();
        compliance.setTitle(request.getTitle());
        compliance.setDescription(request.getDescription());
        compliance.setStatus(request.getStatus());
        compliance.setDueDate(request.getDueDate());
        Compliance saved = complianceRepository.save(compliance);

        // Notify the currently authenticated user via email (if they have one)
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        userRepository.findByUsername(username)
                .filter(u -> u.getEmail() != null && !u.getEmail().isBlank())
                .ifPresent(u -> emailService.sendCreationNotification(u.getEmail(), saved));

        return saved;
    }

    @Caching(evict = {
            @CacheEvict(value = "complianceRecords", allEntries = true),
            @CacheEvict(value = "complianceById",    key = "#id")
    })
    public Compliance updateRecord(Long id, ComplianceRequest request) {
        validate(request);
        log.info("Cache evicted on updateRecord - id: {}", id);
        Compliance c = complianceRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Compliance record not found with id: " + id));
        c.setTitle(request.getTitle());
        c.setDescription(request.getDescription());
        c.setStatus(request.getStatus());
        c.setDueDate(request.getDueDate());
        return complianceRepository.save(c);
    }

    @Caching(evict = {
            @CacheEvict(value = "complianceRecords", allEntries = true),
            @CacheEvict(value = "complianceById",    key = "#id")
    })
    public void deleteRecord(Long id) {
        log.info("Cache evicted on deleteRecord - id: {}", id);
        Compliance c = complianceRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Compliance record not found with id: " + id));
        c.setDeleted(true);
        complianceRepository.save(c);
    }

    public Page<Compliance> search(String keyword, int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name()) ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        return complianceRepository.searchByTitle(keyword, PageRequest.of(page, size, sort));
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

    // --- legacy delegates ---
    public List<Compliance> getAll()                            { return complianceRepository.findAll(); }
    public Compliance getById(Long id)                          { return getRecordById(id); }
    public Compliance create(ComplianceRequest r)               { return createRecord(r); }
    public Compliance update(Long id, ComplianceRequest r)      { return updateRecord(id, r); }
    public void delete(Long id)                                 { deleteRecord(id); }

    private void validate(ComplianceRequest r) {
        if (r.getTitle() == null || r.getTitle().isBlank())
            throw new InvalidDataException("Title must not be empty");
        if (r.getDueDate() != null && r.getDueDate().isBefore(LocalDate.now()))
            throw new InvalidDataException("Due date must not be in the past");
    }
}
