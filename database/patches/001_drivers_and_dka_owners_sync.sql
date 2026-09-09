-- =============================================================================
-- Patch 001: Drivers & Fleet Owners (dka_owners <-> cr_owners) Synchronization
-- File: database/patches/001_drivers_and_dka_owners_sync.sql
-- Description:
--   public.cr_owners already exists in the database with 10 columns:
--   (owner_id, full_name, phone_number, whatsapp_number, email,
--    citizenship_or_id_no, status, created_at, citizenship_doc_id, license_doc_id)
--
--   This patch creates:
--   1. dka_owners table matching the exact 10 columns of cr_owners
--   2. Bidirectional synchronization triggers (cr_owners <-> dka_owners)
--   3. Unified cr_drivers view
--   4. Initial backfill from public.cr_owners into dka_owners
-- =============================================================================

-- 1. Create dka_owners table with the EXACT same 10 columns as cr_owners
CREATE TABLE IF NOT EXISTS dka_owners (
    owner_id SERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    phone_number VARCHAR(30) UNIQUE NOT NULL,
    whatsapp_number VARCHAR(30),
    email VARCHAR(120),
    citizenship_or_id_no VARCHAR(50),
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    citizenship_doc_id VARCHAR(100),
    license_doc_id VARCHAR(100)
);

-- If dka_owners was previously created with updated_at, safely drop it to stay 1:1 identical to cr_owners
ALTER TABLE dka_owners DROP COLUMN IF EXISTS updated_at;

CREATE INDEX IF NOT EXISTS idx_dka_owners_phone ON dka_owners(phone_number);
CREATE INDEX IF NOT EXISTS idx_dka_owners_status ON dka_owners(status);
CREATE INDEX IF NOT EXISTS idx_dka_owners_created_at ON dka_owners(created_at DESC);

-- 2. Drop any outdated updated_at trigger/function on dka_owners
DROP TRIGGER IF EXISTS trigger_dka_owners_updated_at ON dka_owners;
DROP FUNCTION IF EXISTS update_dka_owners_timestamp();

-- 3. Bidirectional Sync: cr_owners -> dka_owners
CREATE OR REPLACE FUNCTION sync_cr_owners_to_dka_owners()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent infinite recursion between bidirectional triggers
    IF pg_trigger_depth() > 1 THEN
        IF (TG_OP = 'DELETE') THEN
            RETURN OLD;
        ELSE
            RETURN NEW;
        END IF;
    END IF;

    IF (TG_OP = 'INSERT') THEN
        INSERT INTO dka_owners (
            owner_id, full_name, phone_number, whatsapp_number, email,
            citizenship_or_id_no, status, created_at, citizenship_doc_id, license_doc_id
        ) VALUES (
            NEW.owner_id, NEW.full_name, NEW.phone_number, NEW.whatsapp_number, NEW.email,
            NEW.citizenship_or_id_no, NEW.status, COALESCE(NEW.created_at, NOW()),
            NEW.citizenship_doc_id, NEW.license_doc_id
        )
        ON CONFLICT (owner_id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            phone_number = EXCLUDED.phone_number,
            whatsapp_number = EXCLUDED.whatsapp_number,
            email = EXCLUDED.email,
            citizenship_or_id_no = EXCLUDED.citizenship_or_id_no,
            status = EXCLUDED.status,
            citizenship_doc_id = EXCLUDED.citizenship_doc_id,
            license_doc_id = EXCLUDED.license_doc_id;
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        UPDATE dka_owners SET
            full_name = NEW.full_name,
            phone_number = NEW.phone_number,
            whatsapp_number = NEW.whatsapp_number,
            email = NEW.email,
            citizenship_or_id_no = NEW.citizenship_or_id_no,
            status = NEW.status,
            citizenship_doc_id = NEW.citizenship_doc_id,
            license_doc_id = NEW.license_doc_id
        WHERE owner_id = NEW.owner_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        DELETE FROM dka_owners WHERE owner_id = OLD.owner_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_cr_to_dka_owners ON cr_owners;
CREATE TRIGGER trg_sync_cr_to_dka_owners
    AFTER INSERT OR UPDATE OR DELETE ON cr_owners
    FOR EACH ROW
    EXECUTE FUNCTION sync_cr_owners_to_dka_owners();

-- 4. Bidirectional Sync: dka_owners -> cr_owners
CREATE OR REPLACE FUNCTION sync_dka_owners_to_cr_owners()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent infinite recursion between bidirectional triggers
    IF pg_trigger_depth() > 1 THEN
        IF (TG_OP = 'DELETE') THEN
            RETURN OLD;
        ELSE
            RETURN NEW;
        END IF;
    END IF;

    IF (TG_OP = 'INSERT') THEN
        INSERT INTO cr_owners (
            owner_id, full_name, phone_number, whatsapp_number, email,
            citizenship_or_id_no, status, created_at, citizenship_doc_id, license_doc_id
        ) VALUES (
            NEW.owner_id, NEW.full_name, NEW.phone_number, NEW.whatsapp_number, NEW.email,
            NEW.citizenship_or_id_no, NEW.status, COALESCE(NEW.created_at, NOW()),
            NEW.citizenship_doc_id, NEW.license_doc_id
        )
        ON CONFLICT (owner_id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            phone_number = EXCLUDED.phone_number,
            whatsapp_number = EXCLUDED.whatsapp_number,
            email = EXCLUDED.email,
            citizenship_or_id_no = EXCLUDED.citizenship_or_id_no,
            status = EXCLUDED.status,
            citizenship_doc_id = EXCLUDED.citizenship_doc_id,
            license_doc_id = EXCLUDED.license_doc_id;
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        UPDATE cr_owners SET
            full_name = NEW.full_name,
            phone_number = NEW.phone_number,
            whatsapp_number = NEW.whatsapp_number,
            email = NEW.email,
            citizenship_or_id_no = NEW.citizenship_or_id_no,
            status = NEW.status,
            citizenship_doc_id = NEW.citizenship_doc_id,
            license_doc_id = NEW.license_doc_id
        WHERE owner_id = NEW.owner_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        DELETE FROM cr_owners WHERE owner_id = OLD.owner_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_dka_to_cr_owners ON dka_owners;
CREATE TRIGGER trg_sync_dka_to_cr_owners
    AFTER INSERT OR UPDATE OR DELETE ON dka_owners
    FOR EACH ROW
    EXECUTE FUNCTION sync_dka_owners_to_cr_owners();

-- 5. Unified cr_drivers VIEW (mirrors public.cr_owners / dka_owners)
CREATE OR REPLACE VIEW cr_drivers AS SELECT * FROM public.cr_owners;

-- 6. Initial backfill: copies existing cr_owners into dka_owners
INSERT INTO dka_owners (
    owner_id, full_name, phone_number, whatsapp_number, email,
    citizenship_or_id_no, status, created_at, citizenship_doc_id, license_doc_id
)
SELECT 
    owner_id, full_name, phone_number, whatsapp_number, email,
    citizenship_or_id_no, status, created_at, citizenship_doc_id, license_doc_id
FROM public.cr_owners
ON CONFLICT (owner_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone_number = EXCLUDED.phone_number,
    whatsapp_number = EXCLUDED.whatsapp_number,
    email = EXCLUDED.email,
    citizenship_or_id_no = EXCLUDED.citizenship_or_id_no,
    status = EXCLUDED.status,
    citizenship_doc_id = EXCLUDED.citizenship_doc_id,
    license_doc_id = EXCLUDED.license_doc_id;

-- Align sequence for dka_owners
SELECT setval(pg_get_serial_sequence('dka_owners', 'owner_id'), COALESCE(MAX(owner_id), 1)) FROM dka_owners;
