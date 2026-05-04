-- ============================================================
-- V4: Create roles reference table and normalize existing data
-- ============================================================

-- Roles reference table
CREATE TABLE roles (
    id   BIGSERIAL    PRIMARY KEY,
    name VARCHAR(50)  NOT NULL UNIQUE
);

-- Seed default roles
INSERT INTO roles (name) VALUES ('ADMIN'), ('MANAGER'), ('VIEWER');

-- Ensure any existing users have a valid role value
UPDATE users SET role = 'VIEWER'
WHERE role NOT IN ('ADMIN', 'MANAGER', 'VIEWER');
