-- Phase 10: extend StaffRole before membership tables that use the new values.
-- Enum values cannot be used in the same PostgreSQL transaction that adds them.

ALTER TYPE "StaffRole" ADD VALUE IF NOT EXISTS 'host_admin';
ALTER TYPE "StaffRole" ADD VALUE IF NOT EXISTS 'host_viewer';
ALTER TYPE "StaffRole" ADD VALUE IF NOT EXISTS 'fleet_admin';
ALTER TYPE "StaffRole" ADD VALUE IF NOT EXISTS 'fleet_viewer';
