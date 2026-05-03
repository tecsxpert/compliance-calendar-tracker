package com.example.tool.scheduler;

import com.example.tool.entity.Compliance;
import com.example.tool.repository.ComplianceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ComplianceScheduler {

    private final ComplianceRepository complianceRepository;

    /** Runs daily at midnight — marks past-due PENDING records as OVERDUE. */
    @Scheduled(cron = "0 0 0 * * *")
    public void markOverdueRecords() {
        List<Compliance> overdue = complianceRepository
                .findByIsDeletedFalseAndDueDateBetween(LocalDate.of(2000, 1, 1), LocalDate.now().minusDays(1))
                .stream()
                .filter(c -> "PENDING".equals(c.getStatus()))
                .toList();

        overdue.forEach(c -> c.setStatus("OVERDUE"));
        complianceRepository.saveAll(overdue);
        log.info("Marked {} compliance records as OVERDUE", overdue.size());
    }
}
