package com.example.tool.entity;

/**
 * Application roles used for Role-Based Access Control (RBAC).
 *
 * <ul>
 *   <li><b>ADMIN</b>   – Full access: manage users, delete compliance items, view stats</li>
 *   <li><b>MANAGER</b> – Create, update compliance items; view stats</li>
 *   <li><b>VIEWER</b>  – Read-only access to compliance data</li>
 * </ul>
 */
public enum Role {
    ADMIN,
    MANAGER,
    VIEWER
}
