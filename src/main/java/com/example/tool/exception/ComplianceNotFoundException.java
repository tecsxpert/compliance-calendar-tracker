package com.example.tool.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class ComplianceNotFoundException extends RuntimeException {

    public ComplianceNotFoundException(Long id) {
        super("Compliance item not found with id: " + id);
    }
}
