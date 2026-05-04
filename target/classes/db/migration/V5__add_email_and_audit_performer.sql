-- V5: Add email to users and performed_by to audit_log

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email VARCHAR(255);

ALTER TABLE audit_log
    ADD COLUMN IF NOT EXISTS performed_by VARCHAR(100);
