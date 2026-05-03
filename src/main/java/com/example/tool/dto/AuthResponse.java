package com.example.tool.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

/**
 * Unified response returned by all /auth/* endpoints.
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    private String username;
    private String role;
}
