package com.example.tool.dto;

import com.example.tool.entity.Compliance;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
public class ComplianceResponse {

    private final Long id;
    private final String title;
    private final String description;
    private final String status;
    private final LocalDate dueDate;
    private final boolean isDeleted;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public ComplianceResponse(Compliance c) {
        this.id          = c.getId();
        this.title       = c.getTitle();
        this.description = c.getDescription();
        this.status      = c.getStatus();
        this.dueDate     = c.getDueDate();
        this.isDeleted   = c.isDeleted();
        this.createdAt   = c.getCreatedAt();
        this.updatedAt   = c.getUpdatedAt();
    }
}
