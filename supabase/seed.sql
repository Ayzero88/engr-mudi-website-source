-- ============================================================
-- Engr Mudi website — seed data (exact content, nothing invented)
-- Run AFTER schema.sql. Safe to re-run: single-row tables upsert,
-- list tables are cleared and re-inserted in order.
-- ============================================================

-- Hero
insert into hero (id, full_name, brand_tag, shorts_label, shorts_url, logo_url)
values (
  1,
  'Osemudiamen Ayo-Okhiria',
  'Engr. Mudi',
  'Watch my dev comedy Shorts',
  'https://www.youtube.com/@EngrMudi/shorts',
  '/assets/logo.png'
)
on conflict (id) do update set
  full_name = excluded.full_name,
  brand_tag = excluded.brand_tag,
  shorts_label = excluded.shorts_label,
  shorts_url = excluded.shorts_url,
  logo_url = excluded.logo_url;

-- Stack (15 items, in order)
delete from stack_items;
insert into stack_items (label, position) values
  ('Java', 1), ('Dart', 2), ('HTML', 3), ('Flutter', 4), ('Python', 5),
  ('Motoko', 6), ('React', 7), ('Node.js', 8), ('Next.js', 9),
  ('Firebase', 10), ('MongoDB', 11), ('Supabase', 12), ('Postgres', 13),
  ('SQLite3', 14), ('Machine Learning', 15);

-- Projects
delete from projects;
insert into projects (title, description, tagline, status, image_url, position) values
  (
    'Avery Data Professional',
    'Admin suite for digital authorization and generating, working on, and saving calibration certificates, quotes, invoices, reports, and payment vouchers.',
    'Simplifying Document Storage and Data Accuracy.',
    'LIVE',
    '/assets/avery-data-professional.png',
    1
  ),
  (
    'Flock Tracker',
    'Church attendance application that takes attendance and tracks each member''s attendance across time.',
    null,
    'LIVE',
    '/assets/flock-tracker.png',
    2
  ),
  (
    'Weighing Software',
    'Retrieves weight from weighbridge equipment and scales and stores it.',
    null,
    'Coming Soon',
    '/assets/weighing-coming-soon.svg',
    3
  );

-- Coaching
insert into coaching (id, body, note)
values (
  1,
  'I coach people online or in person through my company, Ayzeroxa Technologies.',
  'Currently training Batch 2026 Batch B students in Front End Development.'
)
on conflict (id) do update set body = excluded.body, note = excluded.note;

delete from coaching_photos;
insert into coaching_photos (image_url, caption, position) values
  ('/assets/training-1.png', 'Training session', 1),
  ('/assets/training-2.png', 'Classroom training session', 2);

-- Coaching topics (7 subjects, in order)
delete from coaching_topics;
insert into coaching_topics (label, position) values
  ('Front End Development', 1), ('Backend Development', 2), ('Fullstack Development', 3),
  ('How to Use AI Agents', 4), ('Flutter Development for Mobile', 5),
  ('Machine Learning', 6), ('Mathematics', 7);

-- Books (heading is plain "Books" — no "cheat" wording in heading/subtitle)
delete from books;
insert into books (title, description, price_ngn, price_label, selar_url, paystack_url, coming_soon, position) values
  ('Python', '15 topics, one page each. 60-second reads.', 2500, '₦2,500',
   'https://selar.com/m/osemudiamen-ayo-okhiria1', 'https://paystack.shop/engr-mudi', false, 1),
  ('JavaScript', '15 topics, one page each. 60-second reads.', 2500, '₦2,500',
   'https://selar.com/m/osemudiamen-ayo-okhiria1', 'https://paystack.shop/engr-mudi', false, 2),
  ('React', '15 topics, one page each. 60-second reads.', 2500, '₦2,500',
   'https://selar.com/m/osemudiamen-ayo-okhiria1', 'https://paystack.shop/engr-mudi', false, 3),
  ('Git & GitHub', '15 topics, one page each. 60-second reads.', 2500, '₦2,500',
   'https://selar.com/m/osemudiamen-ayo-okhiria1', 'https://paystack.shop/engr-mudi', false, 4),
  ('Flutter & Dart', '15 topics, one page each. 60-second reads.', 2500, '₦2,500',
   'https://selar.com/m/osemudiamen-ayo-okhiria1', 'https://paystack.shop/engr-mudi', false, 5),
  ('The Complete 60-Second Developer Pack', 'All five packs in one. You save ₦5,000.', 7500, '₦7,500',
   null, null, true, 6);

-- Services
delete from services;
insert into services (label, position) values
  ('Coaching on how to use AI to build things.', 1);

-- Social links
delete from social_links;
insert into social_links (label, url, position) values
  ('WhatsApp', 'https://wa.me/2348134882178', 1),
  ('YouTube', 'https://www.youtube.com/@EngrMudi', 2),
  ('Instagram', 'https://www.instagram.com/engr.mudi', 3),
  ('Facebook', 'https://www.facebook.com/AyoOsemudiamen', 4);

-- Hire text
insert into hire_text (id, body)
values (
  1,
  'I build software the way you want it. It does not have to be a web app. Tell me what you need it to do, and I will build it to your preference.'
)
on conflict (id) do update set body = excluded.body;
