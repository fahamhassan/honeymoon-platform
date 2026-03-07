-- ═══════════════════════════════════════════════════════════════════════════
-- HoneyMoon Platform — PostgreSQL Schema
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop tables if resetting (order matters for foreign keys)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS vendor_packages CASCADE;
DROP TABLE IF EXISTS vendor_services CASCADE;
DROP TABLE IF EXISTS vendor_media CASCADE;
DROP TABLE IF EXISTS wishlist CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS loyalty_transactions CASCADE;
DROP TABLE IF EXISTS otp_codes CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS admin_logs CASCADE;
DROP TABLE IF EXISTS promotions CASCADE;
DROP TABLE IF EXISTS featured_vendors CASCADE;
DROP TABLE IF EXISTS banners CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ─── DROP TYPES ──────────────────────────────────────────────────────────────
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS user_tier CASCADE;
DROP TYPE IF EXISTS vendor_status CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS payment_type CASCADE;
DROP TYPE IF EXISTS payment_gateway CASCADE;
DROP TYPE IF EXISTS notif_type CASCADE;
DROP TYPE IF EXISTS report_status CASCADE;
DROP TYPE IF EXISTS report_priority CASCADE;

-- ─── DROP SEQUENCES ──────────────────────────────────────────────────────────
DROP SEQUENCE IF EXISTS booking_seq CASCADE;
DROP SEQUENCE IF EXISTS report_seq CASCADE;

-- ─── DROP FUNCTIONS ──────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS generate_booking_ref CASCADE;
DROP FUNCTION IF EXISTS update_vendor_rating CASCADE;
DROP FUNCTION IF EXISTS generate_report_ref CASCADE;
DROP FUNCTION IF EXISTS set_updated_at CASCADE;

-- ─── ENUMS ────────────────────────────────────────────────────────────────────
CREATE TYPE user_status     AS ENUM ('active', 'pending', 'suspended', 'deleted');
CREATE TYPE user_tier       AS ENUM ('silver', 'gold', 'diamond');
CREATE TYPE vendor_status   AS ENUM ('pending', 'active', 'suspended', 'rejected');
CREATE TYPE booking_status  AS ENUM ('pending', 'confirmed', 'quote_sent', 'cancelled', 'completed');
CREATE TYPE payment_status  AS ENUM ('pending', 'processing', 'paid', 'failed', 'refunded');
CREATE TYPE payment_type    AS ENUM ('deposit', 'full', 'balance', 'refund');
CREATE TYPE payment_gateway AS ENUM ('stripe', 'payfort', 'cash');
CREATE TYPE notif_type      AS ENUM ('booking', 'payment', 'review', 'system', 'promo', 'reminder');
CREATE TYPE report_status   AS ENUM ('pending', 'investigating', 'resolved', 'escalated');
CREATE TYPE report_priority AS ENUM ('low', 'medium', 'high');

-- ─── USERS ────────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name        VARCHAR(120) NOT NULL,
  email            VARCHAR(200) UNIQUE NOT NULL,
  phone            VARCHAR(20)  UNIQUE,
  password_hash    TEXT,                          -- NULL if UAE Pass only
  uaepass_sub      VARCHAR(200) UNIQUE,           -- UAE Pass subject ID
  avatar_url       TEXT,
  status           user_status  NOT NULL DEFAULT 'pending',
  tier             user_tier    NOT NULL DEFAULT 'silver',
  loyalty_points   INTEGER      NOT NULL DEFAULT 0,
  is_verified      BOOLEAN      NOT NULL DEFAULT FALSE,
  verified_at      TIMESTAMPTZ,
  last_login_at    TIMESTAMPTZ,
  language         VARCHAR(5)   NOT NULL DEFAULT 'en',  -- 'en' | 'ar'
  push_token       TEXT,                          -- FCM / APNs token
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email  ON users(email);
CREATE INDEX idx_users_phone  ON users(phone);
CREATE INDEX idx_users_status ON users(status);

-- ─── VENDORS ──────────────────────────────────────────────────────────────────
CREATE TABLE vendors (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_name        VARCHAR(200) NOT NULL,
  business_name_ar     VARCHAR(200),
  category             VARCHAR(50)  NOT NULL,    -- venues | catering | photography | etc.
  email                VARCHAR(200) UNIQUE NOT NULL,
  phone                VARCHAR(20),
  whatsapp             VARCHAR(20),
  password_hash        TEXT,
  description          TEXT,
  description_ar       TEXT,
  location             VARCHAR(200),
  city                 VARCHAR(100) NOT NULL DEFAULT 'Dubai',
  lat                  DECIMAL(10,7),
  lng                  DECIMAL(10,7),
  logo_url             TEXT,
  cover_url            TEXT,
  trade_license_url    TEXT,
  trade_license_no     VARCHAR(100),
  status               vendor_status NOT NULL DEFAULT 'pending',
  is_verified          BOOLEAN      NOT NULL DEFAULT FALSE,
  rating               DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  review_count         INTEGER      NOT NULL DEFAULT 0,
  booking_count        INTEGER      NOT NULL DEFAULT 0,
  total_revenue        DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  deposit_percent      INTEGER      NOT NULL DEFAULT 30,    -- % required upfront
  cancellation_days    INTEGER      NOT NULL DEFAULT 7,     -- days notice for free cancel
  min_booking_value    DECIMAL(10,2) NOT NULL DEFAULT 1000,
  commission_rate      DECIMAL(5,4) NOT NULL DEFAULT 0.0500, -- platform fee
  stripe_account_id    VARCHAR(200),                        -- Stripe Connect ID
  push_token           TEXT,
  language             VARCHAR(5)   NOT NULL DEFAULT 'en',
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vendors_category ON vendors(category);
CREATE INDEX idx_vendors_status   ON vendors(status);
CREATE INDEX idx_vendors_city     ON vendors(city);
CREATE INDEX idx_vendors_rating   ON vendors(rating DESC);

-- ─── VENDOR SERVICES (packages) ───────────────────────────────────────────────
CREATE TABLE vendor_services (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id    UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name         VARCHAR(200) NOT NULL,
  name_ar      VARCHAR(200),
  description  TEXT,
  category     VARCHAR(50),                    -- package | addon | special
  price        DECIMAL(10,2) NOT NULL,
  pricing_unit VARCHAR(50)   NOT NULL DEFAULT 'per_event', -- per_event|per_guest|per_hour
  max_guests   INTEGER,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_services_vendor ON vendor_services(vendor_id);

-- ─── VENDOR PACKAGES (items within a service) ─────────────────────────────────
CREATE TABLE vendor_packages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES vendor_services(id) ON DELETE CASCADE,
  feature    TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- ─── VENDOR MEDIA ─────────────────────────────────────────────────────────────
CREATE TABLE vendor_media (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id   UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  type        VARCHAR(10) NOT NULL DEFAULT 'image',  -- image | video
  caption     TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── EVENTS (user's wedding/engagement events) ────────────────────────────────
CREATE TABLE events (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         VARCHAR(200) NOT NULL,
  event_date   DATE NOT NULL,
  guest_count  INTEGER NOT NULL DEFAULT 100,
  budget       DECIMAL(12,2),
  venue        VARCHAR(200),
  city         VARCHAR(100),
  notes        TEXT,
  is_primary   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_user ON events(user_id);

-- ─── WISHLIST ─────────────────────────────────────────────────────────────────
CREATE TABLE wishlist (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vendor_id  UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, vendor_id)
);

CREATE INDEX idx_wishlist_user ON wishlist(user_id);

-- ─── BOOKINGS ─────────────────────────────────────────────────────────────────
CREATE TABLE bookings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_ref     VARCHAR(20) UNIQUE NOT NULL,  -- BK-XXXX human readable
  user_id         UUID NOT NULL REFERENCES users(id),
  vendor_id       UUID NOT NULL REFERENCES vendors(id),
  event_id        UUID REFERENCES events(id),
  service_id      UUID REFERENCES vendor_services(id),
  package_name    VARCHAR(200),
  event_date      DATE NOT NULL,
  guest_count     INTEGER,
  status          booking_status NOT NULL DEFAULT 'pending',
  subtotal        DECIMAL(10,2) NOT NULL,        -- before platform fee
  platform_fee    DECIMAL(10,2) NOT NULL,        -- commission amount
  total_amount    DECIMAL(10,2) NOT NULL,        -- subtotal + fee
  deposit_amount  DECIMAL(10,2) NOT NULL,        -- 30% of total
  paid_amount     DECIMAL(10,2) NOT NULL DEFAULT 0,
  remaining       DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  notes           TEXT,
  vendor_notes    TEXT,                          -- vendor's reply/notes
  confirmed_at    TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  cancel_reason   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bookings_user        ON bookings(user_id);
CREATE INDEX idx_bookings_vendor      ON bookings(vendor_id);
CREATE INDEX idx_bookings_status      ON bookings(status);
CREATE INDEX idx_bookings_event_date  ON bookings(event_date);
CREATE INDEX idx_bookings_ref         ON bookings(booking_ref);

-- Auto-generate booking_ref
CREATE SEQUENCE booking_seq START 1000;
CREATE OR REPLACE FUNCTION generate_booking_ref()
RETURNS TRIGGER AS $$
BEGIN
  NEW.booking_ref := 'BK-' || LPAD(nextval('booking_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_booking_ref
  BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION generate_booking_ref();

-- ─── PAYMENTS ─────────────────────────────────────────────────────────────────
CREATE TABLE payments (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id          UUID NOT NULL REFERENCES bookings(id),
  user_id             UUID NOT NULL REFERENCES users(id),
  vendor_id           UUID NOT NULL REFERENCES vendors(id),
  amount              DECIMAL(10,2) NOT NULL,
  platform_fee        DECIMAL(10,2) NOT NULL DEFAULT 0,
  vendor_payout       DECIMAL(10,2) NOT NULL DEFAULT 0,  -- amount - fee
  currency            VARCHAR(3)    NOT NULL DEFAULT 'AED',
  type                payment_type  NOT NULL,
  status              payment_status NOT NULL DEFAULT 'pending',
  gateway             payment_gateway NOT NULL DEFAULT 'stripe',
  gateway_payment_id  VARCHAR(200),   -- Stripe PaymentIntent ID
  gateway_charge_id   VARCHAR(200),   -- Stripe Charge ID
  refund_id           VARCHAR(200),
  payout_id           VARCHAR(200),   -- Stripe Transfer ID
  payout_status       VARCHAR(50)    DEFAULT 'pending',
  payout_at           TIMESTAMPTZ,
  metadata            JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_user    ON payments(user_id);
CREATE INDEX idx_payments_vendor  ON payments(vendor_id);
CREATE INDEX idx_payments_status  ON payments(status);

-- ─── REVIEWS ──────────────────────────────────────────────────────────────────
CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id  UUID UNIQUE NOT NULL REFERENCES bookings(id),
  user_id     UUID NOT NULL REFERENCES users(id),
  vendor_id   UUID NOT NULL REFERENCES vendors(id),
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title       VARCHAR(200),
  body        TEXT NOT NULL,
  photos      TEXT[],       -- array of image URLs
  vendor_reply TEXT,
  replied_at   TIMESTAMPTZ,
  is_visible   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_vendor ON reviews(vendor_id);
CREATE INDEX idx_reviews_user   ON reviews(user_id);

-- Automatically update vendor rating when review inserted/updated
CREATE OR REPLACE FUNCTION update_vendor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE vendors SET
    rating       = (SELECT AVG(rating)::DECIMAL(3,2) FROM reviews WHERE vendor_id = NEW.vendor_id AND is_visible = TRUE),
    review_count = (SELECT COUNT(*) FROM reviews WHERE vendor_id = NEW.vendor_id AND is_visible = TRUE)
  WHERE id = NEW.vendor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recalc_vendor_rating
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_vendor_rating();

-- ─── LOYALTY TRANSACTIONS ─────────────────────────────────────────────────────
CREATE TABLE loyalty_transactions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points      INTEGER NOT NULL,    -- positive = earn, negative = redeem
  reason      VARCHAR(200) NOT NULL,
  ref_id      UUID,                -- booking_id or payment_id
  balance     INTEGER NOT NULL,    -- running total after transaction
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_loyalty_user ON loyalty_transactions(user_id);

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  vendor_id   UUID REFERENCES vendors(id) ON DELETE CASCADE,
  type        notif_type NOT NULL DEFAULT 'system',
  title       VARCHAR(200) NOT NULL,
  body        TEXT NOT NULL,
  data        JSONB,               -- extra payload (booking_id, etc.)
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  read_at     TIMESTAMPTZ,
  sent_push   BOOLEAN NOT NULL DEFAULT FALSE,
  sent_email  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifs_user      ON notifications(user_id);
CREATE INDEX idx_notifs_vendor    ON notifications(vendor_id);
CREATE INDEX idx_notifs_unread    ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- ─── OTP CODES ────────────────────────────────────────────────────────────────
CREATE TABLE otp_codes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone       VARCHAR(20) NOT NULL,
  code        VARCHAR(6)  NOT NULL,
  purpose     VARCHAR(50) NOT NULL DEFAULT 'verify', -- verify | reset | login
  attempts    SMALLINT    NOT NULL DEFAULT 0,
  is_used     BOOLEAN     NOT NULL DEFAULT FALSE,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_otp_phone ON otp_codes(phone);

-- ─── REFRESH TOKENS ───────────────────────────────────────────────────────────
CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  vendor_id   UUID REFERENCES vendors(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  device_info TEXT,
  ip_address  INET,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── REPORTS ──────────────────────────────────────────────────────────────────
CREATE TABLE reports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_ref      VARCHAR(20) UNIQUE NOT NULL,
  user_id         UUID REFERENCES users(id),
  vendor_id       UUID REFERENCES vendors(id),
  booking_id      UUID REFERENCES bookings(id),
  type            VARCHAR(100) NOT NULL,
  description     TEXT,
  status          report_status  NOT NULL DEFAULT 'pending',
  priority        report_priority NOT NULL DEFAULT 'medium',
  admin_notes     TEXT,
  resolved_by     UUID,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE SEQUENCE report_seq START 1;
CREATE OR REPLACE FUNCTION generate_report_ref()
RETURNS TRIGGER AS $$
BEGIN
  NEW.report_ref := 'RP-' || LPAD(nextval('report_seq')::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_report_ref
  BEFORE INSERT ON reports
  FOR EACH ROW EXECUTE FUNCTION generate_report_ref();

-- ─── BANNERS ──────────────────────────────────────────────────────────────────
CREATE TABLE banners (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       VARCHAR(200) NOT NULL,
  image_url   TEXT,
  link_url    TEXT,
  placement   VARCHAR(50) NOT NULL DEFAULT 'hero',  -- hero|sidebar|banner|popup
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  expires_at  DATE,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── FEATURED VENDORS ─────────────────────────────────────────────────────────
CREATE TABLE featured_vendors (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id   UUID UNIQUE NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── PROMOTIONS ───────────────────────────────────────────────────────────────
CREATE TABLE promotions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(200) NOT NULL,
  code          VARCHAR(50)  UNIQUE NOT NULL,
  discount_type VARCHAR(20)  NOT NULL DEFAULT 'percent',  -- percent | fixed
  discount_value DECIMAL(10,2) NOT NULL,
  min_amount    DECIMAL(10,2),
  max_uses      INTEGER,
  used_count    INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at     TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── ADMIN LOGS ───────────────────────────────────────────────────────────────
CREATE TABLE admin_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id    UUID,
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id   UUID,
  details     JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── UPDATED_AT TRIGGER (shared) ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at   BEFORE UPDATE ON users   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER events_updated_at  BEFORE UPDATE ON events  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- Done.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Migration: add stripe_customer_id to users (run once after initial schema) ──
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(200);
ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_users_stripe ON users (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
