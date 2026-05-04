package com.example.tool.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

/**
 * Enables @Scheduled and @Async support.
 * @Async is required by EmailService so mail sending never blocks the caller.
 */
@Configuration
@EnableScheduling
@EnableAsync
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
