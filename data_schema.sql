-- Create table
CREATE TABLE IF NOT EXISTS "Task" (
  "id"           TEXT PRIMARY KEY,
  "title"        VARCHAR(200) NOT NULL,
  "description"  VARCHAR(1000),
  "due_date"     TIMESTAMP WITH TIME ZONE,
  "priority"     VARCHAR(20) NOT NULL,
  "status"       VARCHAR(20) NOT NULL,
  "transcript"   VARCHAR(2000) NOT NULL,
  "stt_provider" VARCHAR(100) NOT NULL,
  "created_at"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS task_set_updated_at ON "Task";
CREATE TRIGGER task_set_updated_at
BEFORE UPDATE ON "Task"
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- Rollback (drop objects)
-- NOTE: Run only if you intend to remove the schema
-- DROP TRIGGER IF EXISTS task_set_updated_at ON "Task";
-- DROP FUNCTION IF EXISTS set_updated_at();
-- DROP TABLE IF EXISTS "Task";
