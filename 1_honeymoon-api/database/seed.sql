-- ═══════════════════════════════════════════════════════════════════════════
-- HoneyMoon Platform — Seed Data
-- ═══════════════════════════════════════════════════════════════════════════

-- Admin user (password: Admin@123)
INSERT INTO users (id, full_name, email, phone, password_hash, status, tier, is_verified, verified_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Platform Admin', 'admin@honeymoon.ae', '+97140000000',
   '$2a$10$YkQZ2TG/k1gcOs4h3eTMeODvfQ8F3EGzBUX.sNEuwOPSJgf6OeKCS', 'active', 'diamond', TRUE, NOW());

-- Sample users (password: Test@1234)
INSERT INTO users (id, full_name, email, phone, password_hash, status, tier, loyalty_points, is_verified, verified_at) VALUES
  ('00000000-0000-0000-0000-000000000010', 'Fatima Al-Rashid', 'fatima@example.com', '+971501234567',
   '$2a$10$YkQZ2TG/k1gcOs4h3eTMeODvfQ8F3EGzBUX.sNEuwOPSJgf6OeKCS', 'active', 'gold', 2450, TRUE, NOW()),
  ('00000000-0000-0000-0000-000000000011', 'Mariam Hassan', 'mariam@example.com', '+971507654321',
   '$2a$10$YkQZ2TG/k1gcOs4h3eTMeODvfQ8F3EGzBUX.sNEuwOPSJgf6OeKCS', 'active', 'silver', 800, TRUE, NOW()),
  ('00000000-0000-0000-0000-000000000012', 'Layla Al-Mansoori', 'layla@example.com', '+971509876543',
   '$2a$10$YkQZ2TG/k1gcOs4h3eTMeODvfQ8F3EGzBUX.sNEuwOPSJgf6OeKCS', 'active', 'silver', 350, TRUE, NOW());

-- Sample vendors (password: Honeymoon@123)
INSERT INTO vendors (id, business_name, category, email, phone, password_hash, description, location, city, status, is_verified, rating, review_count) VALUES
  ('00000000-0000-0000-0000-000000000101', 'Al Qasr Palace', 'venues', 'info@alqasrpalace.ae', '+97143001000',
   '$2a$10$YkQZ2TG/k1gcOs4h3eTMeODvfQ8F3EGzBUX.sNEuwOPSJgf6OeKCS',
   'The most prestigious wedding venue in Dubai, offering breathtaking marina views with world-class service.',
   'Dubai Marina', 'Dubai', 'active', TRUE, 4.9, 124),
  ('00000000-0000-0000-0000-000000000102', 'Petals & Gold', 'decor', 'hello@petalsgold.ae', '+97143002000',
   '$2a$10$YkQZ2TG/k1gcOs4h3eTMeODvfQ8F3EGzBUX.sNEuwOPSJgf6OeKCS',
   'Award-winning floral design studio specialising in luxury Arabic and modern wedding décor.',
   'Jumeirah', 'Dubai', 'active', TRUE, 4.8, 89),
  ('00000000-0000-0000-0000-000000000103', 'Lumière Studio', 'photography', 'book@lumierestudio.ae', '+97143003000',
   '$2a$10$YkQZ2TG/k1gcOs4h3eTMeODvfQ8F3EGzBUX.sNEuwOPSJgf6OeKCS',
   'International award-winning wedding photography and cinematography studio.',
   'DIFC', 'Dubai', 'active', TRUE, 4.9, 67),
  ('00000000-0000-0000-0000-000000000104', 'Savoie Catering', 'catering', 'events@savoie.ae', '+97143004000',
   '$2a$10$YkQZ2TG/k1gcOs4h3eTMeODvfQ8F3EGzBUX.sNEuwOPSJgf6OeKCS',
   'Premier wedding catering with Arabic, Continental, and fusion menus.',
   'Downtown Dubai', 'Dubai', 'active', FALSE, 4.7, 45),
  ('00000000-0000-0000-0000-000000000105', 'Glamour Touch', 'makeup', 'glam@glamourtouch.ae', '+97143005000',
   '$2a$10$YkQZ2TG/k1gcOs4h3eTMeODvfQ8F3EGzBUX.sNEuwOPSJgf6OeKCS',
   'Luxury bridal makeup and hair styling for UAE brides.',
   'Jumeirah', 'Dubai', 'active', TRUE, 4.8, 112),
  ('00000000-0000-0000-0000-000000000106', 'Harmony Sounds', 'entertainment', 'info@harmonysounds.ae', '+97143006000',
   '$2a$10$YkQZ2TG/k1gcOs4h3eTMeODvfQ8F3EGzBUX.sNEuwOPSJgf6OeKCS',
   'Live bands, DJs, and traditional Arabic performers for weddings.',
   'Business Bay', 'Dubai', 'active', TRUE, 4.6, 38),
  ('00000000-0000-0000-0000-000000000107', 'Sweet Dreams Cakes', 'cakes', 'orders@sweetdreams.ae', '+97143007000',
   '$2a$10$YkQZ2TG/k1gcOs4h3eTMeODvfQ8F3EGzBUX.sNEuwOPSJgf6OeKCS',
   'Bespoke wedding cakes and dessert tables for luxury UAE weddings.',
   'Al Barsha', 'Dubai', 'active', TRUE, 4.9, 203),
  ('00000000-0000-0000-0000-000000000108', 'Emirates Honeymoon', 'honeymoon', 'travel@emirateshoneymoon.ae', '+97143008000',
   '$2a$10$YkQZ2TG/k1gcOs4h3eTMeODvfQ8F3EGzBUX.sNEuwOPSJgf6OeKCS',
   'Bespoke honeymoon planning for UAE couples. Maldives to European escapes.',
   'Sheikh Zayed Road', 'Dubai', 'active', TRUE, 4.7, 56),
  ('00000000-0000-0000-0000-000000000109', 'Royal Bloom Decor', 'decor', 'info@royalbloom.ae', '+97143009000',
   '$2a$10$YkQZ2TG/k1gcOs4h3eTMeODvfQ8F3EGzBUX.sNEuwOPSJgf6OeKCS',
   'Specialising in large-scale event décor, draping, and lighting installations.',
   'Al Quoz', 'Dubai', 'pending', FALSE, 0.0, 0);

-- Vendor services (packages)
INSERT INTO vendor_services (id, vendor_id, name, description, price, pricing_unit, is_active, sort_order) VALUES
  ('00000000-0000-0001-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'Silver Package', 'Perfect for intimate weddings up to 50 guests', 15000, 'per_event', TRUE, 1),
  ('00000000-0000-0001-0000-000000000002', '00000000-0000-0000-0000-000000000101', 'Gold Package',   'Our most popular — up to 150 guests, full day', 25000, 'per_event', TRUE, 2),
  ('00000000-0000-0001-0000-000000000003', '00000000-0000-0000-0000-000000000101', 'Platinum Package','Multi-day luxury for up to 300 guests',         45000, 'per_event', TRUE, 3),
  ('00000000-0000-0001-0000-000000000004', '00000000-0000-0000-0000-000000000102', 'Essential Bloom', 'Bridal bouquet, centrepieces, arch arrangement',  8500, 'per_event', TRUE, 1),
  ('00000000-0000-0001-0000-000000000005', '00000000-0000-0000-0000-000000000102', 'Grand Floral',   'Full venue florals and bridal party flowers',     18000, 'per_event', TRUE, 2),
  ('00000000-0000-0001-0000-000000000006', '00000000-0000-0000-0000-000000000103', 'Photography Only','8 hrs, 500+ edited images, print album',          12000, 'per_event', TRUE, 1),
  ('00000000-0000-0001-0000-000000000007', '00000000-0000-0000-0000-000000000103', 'Photo + Film',   'Full day photo + cinematic highlight reel + drone',22000, 'per_event', TRUE, 2),
  ('00000000-0000-0001-0000-000000000008', '00000000-0000-0000-0000-000000000104', 'Classic Menu',   '3-course dinner, Arabic meze, soft drinks',          180, 'per_guest', TRUE, 1),
  ('00000000-0000-0001-0000-000000000009', '00000000-0000-0000-0000-000000000104', 'Premium Menu',   '5-course dinner, live stations, premium beverages',  280, 'per_guest', TRUE, 2),
  ('00000000-0000-0001-0000-000000000010', '00000000-0000-0000-0000-000000000105', 'Bridal Essentials','Bridal makeup + hair + trial session',            3500, 'per_event', TRUE, 1),
  ('00000000-0000-0001-0000-000000000011', '00000000-0000-0000-0000-000000000105', 'Bridal Party',   'Bride + 3 bridesmaids, full glam on-site',         6500, 'per_event', TRUE, 2),
  ('00000000-0000-0001-0000-000000000012', '00000000-0000-0000-0000-000000000107', '3-Tier Wedding Cake','Custom 3-tier fondant cake with delivery',    2200, 'per_event', TRUE, 1),
  ('00000000-0000-0001-0000-000000000013', '00000000-0000-0000-0000-000000000107', 'Cake + Dessert Bar','4-tier cake + 60-piece dessert table',          5500, 'per_event', TRUE, 2);

-- User events
INSERT INTO events (id, user_id, name, event_date, guest_count, budget, city, is_primary) VALUES
  ('00000000-0000-0002-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'Our Wedding', '2026-03-15', 200, 330000, 'Dubai', TRUE),
  ('00000000-0000-0002-0000-000000000002', '00000000-0000-0000-0000-000000000010', 'Engagement Party', '2026-02-14', 80, 45000, 'Dubai', FALSE);

-- Sample bookings
INSERT INTO bookings (id, user_id, vendor_id, event_id, service_id, package_name, event_date, guest_count, status, subtotal, platform_fee, total_amount, deposit_amount, paid_amount) VALUES
  ('00000000-0000-0003-0000-000000000001',
   '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000101',
   '00000000-0000-0002-0000-000000000001', '00000000-0000-0001-0000-000000000002',
   'Gold Package', '2026-03-15', 200, 'confirmed',
   25000, 1250, 26250, 7875, 7875),
  ('00000000-0000-0003-0000-000000000002',
   '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000103',
   '00000000-0000-0002-0000-000000000001', '00000000-0000-0001-0000-000000000007',
   'Photo + Film', '2026-03-15', 200, 'confirmed',
   22000, 1100, 23100, 6930, 6930),
  ('00000000-0000-0003-0000-000000000003',
   '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000102',
   '00000000-0000-0002-0000-000000000001', '00000000-0000-0001-0000-000000000005',
   'Grand Floral', '2026-03-14', 200, 'pending',
   18000, 900, 18900, 5670, 0),
  ('00000000-0000-0003-0000-000000000004',
   '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000105',
   '00000000-0000-0002-0000-000000000001', '00000000-0000-0001-0000-000000000011',
   'Bridal Party', '2026-03-15', 4, 'confirmed',
   6500, 325, 6825, 2047, 2047);

-- Sample reviews
INSERT INTO reviews (booking_id, user_id, vendor_id, rating, body, is_visible) VALUES
  ('00000000-0000-0003-0000-000000000001', '00000000-0000-0000-0000-000000000010',
   '00000000-0000-0000-0000-000000000101', 5,
   'Absolutely stunning venue. Every detail was perfect. The team was professional and attentive throughout.', TRUE),
  ('00000000-0000-0003-0000-000000000002', '00000000-0000-0000-0000-000000000010',
   '00000000-0000-0000-0000-000000000103', 5,
   'Best wedding photographers in Dubai. Our photos are breathtaking.', TRUE);

-- Wishlist
INSERT INTO wishlist (user_id, vendor_id) VALUES
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000102'),
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000107');

-- Featured vendors
INSERT INTO featured_vendors (vendor_id, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000101', 1),
  ('00000000-0000-0000-0000-000000000103', 2),
  ('00000000-0000-0000-0000-000000000102', 3),
  ('00000000-0000-0000-0000-000000000105', 4);

-- Notifications
INSERT INTO notifications (user_id, type, title, body, is_read) VALUES
  ('00000000-0000-0000-0000-000000000010', 'booking', 'Booking Confirmed', 'Al Qasr Palace confirmed your booking for Mar 15.', FALSE),
  ('00000000-0000-0000-0000-000000000010', 'booking', 'Quote Received', 'Savoie Catering sent you a custom quote.', FALSE),
  ('00000000-0000-0000-0000-000000000010', 'payment', 'Payment Reminder', 'Balance payment for Lumière Studio due in 30 days.', TRUE);

-- Promotions
INSERT INTO promotions (name, code, discount_type, discount_value, max_uses, is_active, expires_at) VALUES
  ('Spring Wedding', 'SPRING25', 'percent', 25, 100, TRUE, '2026-06-30'),
  ('First Booking',  'FIRST10',  'percent', 10, 500, TRUE, '2026-12-31'),
  ('Loyalty Reward', 'LOYAL500', 'fixed',  500,  50, TRUE, '2026-09-30');

-- Loyalty transactions for seed user
INSERT INTO loyalty_transactions (user_id, points, reason, balance) VALUES
  ('00000000-0000-0000-0000-000000000010', 200, 'Booking confirmed: BK-1000', 200),
  ('00000000-0000-0000-0000-000000000010', 200, 'Booking confirmed: BK-1001', 400),
  ('00000000-0000-0000-0000-000000000010', 200, 'Booking confirmed: BK-1003', 600),
  ('00000000-0000-0000-0000-000000000010', 50,  'Review submitted',           650),
  ('00000000-0000-0000-0000-000000000010', 1800,'Referral bonus x3',         2450);
