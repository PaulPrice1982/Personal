-- F-014: the audit log is append-only; locked billing lines and sent
-- statements can never be edited in place.
CREATE OR REPLACE FUNCTION audit_immutable() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION 'AuditLog is append-only'; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER audit_no_update BEFORE UPDATE OR DELETE ON "AuditLog"
  FOR EACH ROW EXECUTE FUNCTION audit_immutable();

CREATE OR REPLACE FUNCTION row_locked() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION 'Row is locked; post an adjustment in the next open month'; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER billing_line_locked BEFORE UPDATE OR DELETE ON "BillingLine"
  FOR EACH ROW WHEN (OLD."lockedAt" IS NOT NULL) EXECUTE FUNCTION row_locked();
CREATE TRIGGER statement_sent_locked BEFORE UPDATE OR DELETE ON "Statement"
  FOR EACH ROW WHEN (OLD."sentAt" IS NOT NULL) EXECUTE FUNCTION row_locked();
