package com.example.tool.scheduler;

import com.example.tool.entity.Compliance;
import com.example.tool.repository.ComplianceRepository;
import com.example.tool.repository.UserRepository;
import com.example.tool.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

/**
 * Scheduled compliance notification jobs (Day 7).
 *
 * Cron format: second minute hour day-of-month month day-of-week
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ComplianceScheduler {

    private final ComplianceRepository complianceRepository;
    private final UserRepository       userRepository;
    private final EmailService         emailService;

    /**
     * Daily at 08:00 — email all users with an email address about overdue items.
     */
    @Scheduled(cron = "0 0 8 * * *")
    public void sendDailyOverdueReminder() {
        LocalDate today = LocalDate.now();
        List<Compliance> overdue = complianceRepository
                .findByDueDateBeforeAndStatusNot(today, "COMPLETED");

        if (overdue.isEmpty()) {
            log.info("[SCHEDULER] No overdue items.");
            return;
        }

        log.warn("[SCHEDULER] {} overdue item(s) — sending notifications.", overdue.size());

        // Notify every user who has an email address
        userRepository.findAll().stream()
                .filter(u -> u.getEmail() != null && !u.getEmail().isBlank())
                .forEach(u -> overdue.forEach(c ->
                        emailService.sendOverdueNotification(u.getEmail(), c)));
    }

    /**
     * Daily at 09:00 — alert users about items due within the next 7 days.
     */
    @Scheduled(cron = "0 0 9 * * *")
    public void sendSevenDayDeadlineAlert() {
        LocalDate today    = LocalDate.now();
        LocalDate deadline = today.plusDays(7);
        List<Compliance> upcoming = complianceRepository
                .findByDueDateBetweenAndStatusNot(today, deadline, "COMPLETED");

        if (upcoming.isEmpty()) {
            log.info("[SCHEDULER] No items due in the next 7 days.");
            return;
        }

        log.info("[SCHEDULER] {} item(s) due within 7 days — sending alerts.", upcoming.size());

        userRepository.findAll().stream()
                .filter(u -> u.getEmail() != null && !u.getEmail().isBlank())
                .forEach(u -> upcoming.forEach(c ->
                        emailService.sendOverdueNotification(u.getEmail(), c)));
    }

    /**
     * Every Monday at 07:00 — send weekly summary to admin.
     */
    @Scheduled(cron = "0 0 7 * * MON")
    public void sendWeeklySummaryReport() {
        List<Compliance> all = complianceRepository.findAll();
        log.info("[SCHEDULER] Sending weekly summary ({} items).", all.size());
        emailService.sendWeeklySummary(all);
    }
}
