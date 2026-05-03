package com.example.tool.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

/**
 * Enables Spring's @Scheduled annotation support and configures a dedicated
 * thread pool so scheduled tasks do not block each other.
 *
 * Without a custom TaskScheduler, all @Scheduled tasks share a single thread,
 * meaning one long-running task can delay the others.
 */
@Configuration
@EnableScheduling
public class SchedulerConfig {

    /**
     * Creates a thread pool with 5 threads for running scheduled tasks.
     *
     * Pool size guidance:
     *  - We currently have 3 tasks; 5 threads gives room to add more without
     *    configuration changes.
     *  - Increase pool size if you add CPU-intensive or I/O-heavy tasks.
     */
    @Bean
    public ThreadPoolTaskScheduler taskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(5);
        scheduler.setThreadNamePrefix("compliance-scheduler-");
        scheduler.setAwaitTerminationSeconds(60);
        scheduler.setWaitForTasksToCompleteOnShutdown(true);
        scheduler.initialize();
        return scheduler;
    }
}
