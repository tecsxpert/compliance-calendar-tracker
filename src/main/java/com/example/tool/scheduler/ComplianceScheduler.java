package com.example.tool.scheduler;

import com.example.tool.entity.Compliance;
import com.example.tool.repository.ComplianceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Scheduled tasks for the Compliance Calendar Tracker.
 *
 * All tasks use Spring's @Scheduled annotation with cron expressions.
 *
 * Cron expression format (6 fields):
 *   ┌─────────── second       (0–59)
 *   │ ┌───────── minute       (0–59)
 *   │ │ ┌─────── hour         (0–23)
 *   │ │ │ ┌───── day-of-month (1–31)
 *   │ │ │ │ ┌─── month        (1–12 or JAN-DEC)
 *   │ │ │ │ │ ┌─ day-of-week  (0–7, 0 and 7 = Sunday, or MON-SUN)
 *   │ │ │ │ │ │
 *   * * * * * *
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ComplianceScheduler {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd-MM-yyyy");

    private final ComplianceRepository complianceRepository;

    // ─────────────────────────────────────────────────────────────────────────
    // Task 1 – Daily Overdue Reminder
    //
    // Cron:  "0 0 8 * * *"
    //   0   → at second 0
    //   0   → at minute 0
    //   8   → at hour 8  (08:00 AM every day)
    //   *   → every day of the month
    //   *   → every month
    //   *   → every day of the week
    //
    // Fires once every day at 08:00 AM.
    // ─────────────────────────────────────────────────────────────────────────
    @Scheduled(cron = "0 0 8 * * *")
    public void sendDailyOverdueReminder() {
        LocalDate today = LocalDate.now();

        // Fetch items whose due date has passed AND are still not completed
        List<Compliance> overdueItems = complianceRepository
                .findByDueDateBeforeAndStatusNot(today, "COMPLETED");

        if (overdueItems.isEmpty()) {
            log.info("[SCHEDULER] Daily Overdue Reminder — No overdue items found. ✅");
            return;
        }

        log.warn("[SCHEDULER] ⚠️  Daily Overdue Reminder — {} overdue compliance item(s) detected:",
                overdueItems.size());

        overdueItems.forEach(c ->
                log.warn("  ► [ID: {}] '{}' — Due: {} | Status: {}",
                        c.getId(), c.getTitle(),
                        c.getDueDate().format(DATE_FMT), c.getStatus()));

        /*
         * TODO: Replace log statements with an actual notification mechanism,
         *       e.g. JavaMailSender, Slack webhook, or push notification service.
         */
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Task 2 – 7-Day Deadline Alert
    //
    // Cron:  "0 0 9 * * *"
    //   0   → at second 0
    //   0   → at minute 0
    //   9   → at hour 9  (09:00 AM every day)
    //   *   → every day of the month
    //   *   → every month
    //   *   → every day of the week
    //
    // Fires once every day at 09:00 AM.
    // It looks ahead exactly 7 days from today to alert users about
    // compliance items approaching their deadline.
    // ─────────────────────────────────────────────────────────────────────────
    @Scheduled(cron = "0 0 9 * * *")
    public void sendSevenDayDeadlineAlert() {
        LocalDate today    = LocalDate.now();
        LocalDate deadline = today.plusDays(7);

        // Items due within the next 7 days that are not yet completed
        List<Compliance> upcomingItems = complianceRepository
                .findByDueDateBetweenAndStatusNot(today, deadline, "COMPLETED");

        if (upcomingItems.isEmpty()) {
            log.info("[SCHEDULER] 7-Day Deadline Alert — No upcoming deadlines in the next 7 days. ✅");
            return;
        }

        log.info("[SCHEDULER] 📅 7-Day Deadline Alert — {} compliance item(s) due within 7 days:",
                upcomingItems.size());

        upcomingItems.forEach(c ->
                log.info("  ► [ID: {}] '{}' — Due: {} | Status: {} | Days left: {}",
                        c.getId(), c.getTitle(),
                        c.getDueDate().format(DATE_FMT), c.getStatus(),
                        today.until(c.getDueDate()).getDays()));

        /*
         * TODO: Integrate with email/notification service to alert
         *       the responsible users about these upcoming deadlines.
         */
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Task 3 – Weekly Summary Report
    //
    // Cron:  "0 0 7 * * MON"
    //   0   → at second 0
    //   0   → at minute 0
    //   7   → at hour 7  (07:00 AM)
    //   *   → every day of the month (don't restrict)
    //   *   → every month
    //   MON → only on Monday
    //
    // Fires once every Monday at 07:00 AM.
    // Generates a summary of all compliance items grouped by status.
    // ─────────────────────────────────────────────────────────────────────────
    @Scheduled(cron = "0 0 7 * * MON")
    public void sendWeeklySummaryReport() {
        List<Compliance> allItems = complianceRepository.findAll();

        if (allItems.isEmpty()) {
            log.info("[SCHEDULER] Weekly Summary — No compliance items in the system.");
            return;
        }

        // Group items by their status
        Map<String, Long> statusCounts = allItems.stream()
                .collect(Collectors.groupingBy(Compliance::getStatus, Collectors.counting()));

        // Items due in the coming week (next 7 days)
        LocalDate today   = LocalDate.now();
        LocalDate nextWeek = today.plusDays(7);

        long dueThisWeek = allItems.stream()
                .filter(c -> c.getDueDate() != null
                        && !c.getDueDate().isBefore(today)
                        && !c.getDueDate().isAfter(nextWeek))
                .count();

        log.info("╔══════════════════════════════════════════════╗");
        log.info("║       WEEKLY COMPLIANCE SUMMARY REPORT       ║");
        log.info("║  Week of: {}                       ║", today.format(DATE_FMT));
        log.info("╠══════════════════════════════════════════════╣");
        log.info("║  Total Items      : {}", allItems.size());
        log.info("║  Due This Week    : {}", dueThisWeek);
        log.info("╠══════════════════════════════════════════════╣");
        log.info("║  Breakdown by Status:                        ║");
        statusCounts.forEach((status, count) ->
                log.info("║    • {} : {}", status, count));
        log.info("╚══════════════════════════════════════════════╝");

        /*
         * TODO: Send this formatted summary as an email report or
         *       post to a Slack/Teams channel using a webhook.
         */
    }
}
