package com.example.tool.dto;

import com.example.tool.entity.Compliance;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Read-only DTO returned by all Compliance API endpoints.
 * Decouples the API contract from the JPA entity.
 */
@Getter
public class ComplianceResponse {

    private final Long id;
    private final String title;
    private final String description;
    private final String status;
    private final LocalDate dueDate;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public ComplianceResponse(Compliance c) {
        this.id          = c.getId();
        this.title       = c.getTitle();
        this.description = c.getDescription();
        this.status      = c.getStatus();
        this.dueDate     = c.getDueDate();
        this.createdAt   = c.getCreatedAt();
        this.updatedAt   = c.getUpdatedAt();
    }
}
