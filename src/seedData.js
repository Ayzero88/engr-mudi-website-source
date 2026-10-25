// Fallback content, identical to supabase/seed.sql.
// Used when Supabase is not configured yet, or if a fetch fails,
// so the public site always renders something real.
export const seedData = {
  hero: {
    full_name: 'Osemudiamen Ayo-Okhiria',
    brand_tag: 'Engr. Mudi',
    shorts_label: 'Watch my dev comedy Shorts',
    shorts_url: 'https://www.youtube.com/@EngrMudi/shorts',
    logo_url: '/assets/logo.png',
  },
  stack: [
    'Java', 'Dart', 'HTML', 'Flutter', 'Python',
    'Motoko', 'React', 'Node.js', 'Next.js',
    'Firebase', 'MongoDB', 'Supabase', 'Postgres',
    'SQLite3', 'Machine Learning',
  ].map((label, i) => ({ id: `seed-stack-${i}`, label })),
  projects: [
    {
      id: 'seed-project-1',
      title: 'Avery Data Professional',
      description:
        'Admin suite for digital authorization and generating, working on, and saving calibration certificates, quotes, invoices, reports, and payment vouchers.',
      tagline: 'Simplifying Document Storage and Data Accuracy.',
      status: 'LIVE',
      image_url: '/assets/avery-data-professional.png',
    },
    {
      id: 'seed-project-2',
      title: 'Flock Tracker',
      description:
        "Church attendance application that takes attendance and tracks each member's attendance across time.",
      tagline: null,
      status: 'LIVE',
      image_url: '/assets/flock-tracker.png',
    },
    {
      id: 'seed-project-3',
      title: 'Weighing Software',
      description:
        'Retrieves weight from weighbridge equipment and scales and stores it.',
      tagline: null,
      status: 'Coming Soon',
      image_url: '/assets/weighing-coming-soon.svg',
    },
  ],
  coaching: {
    body: 'I coach people online or in person through my company, Ayzeroxa Technologies.',
    note: 'Currently training Batch 2026 Batch B students in Front End Development.',
  },
  coachingTopics: [
    'Front End Development', 'Backend Development', 'Fullstack Development',
    'How to Use AI Agents', 'Flutter Development for Mobile',
    'Machine Learning', 'Mathematics',
  ].map((label, i) => ({ id: `seed-topic-${i}`, label })),
  coachingPhotos: [
    { id: 'seed-photo-1', image_url: '/assets/training-1.png', caption: 'Training session' },
    { id: 'seed-photo-2', image_url: '/assets/training-2.png', caption: 'Classroom training session' },
  ],
  books: [
    { id: 'seed-book-1', title: 'Python', description: '15 topics, one page each. 60-second reads.', price_label: '₦2,500', selar_url: 'https://selar.com/m/osemudiamen-ayo-okhiria1', paystack_url: 'https://paystack.shop/engr-mudi', coming_soon: false },
    { id: 'seed-book-2', title: 'JavaScript', description: '15 topics, one page each. 60-second reads.', price_label: '₦2,500', selar_url: 'https://selar.com/m/osemudiamen-ayo-okhiria1', paystack_url: 'https://paystack.shop/engr-mudi', coming_soon: false },
    { id: 'seed-book-3', title: 'React', description: '15 topics, one page each. 60-second reads.', price_label: '₦2,500', selar_url: 'https://selar.com/m/osemudiamen-ayo-okhiria1', paystack_url: 'https://paystack.shop/engr-mudi', coming_soon: false },
    { id: 'seed-book-4', title: 'Git & GitHub', description: '15 topics, one page each. 60-second reads.', price_label: '₦2,500', selar_url: 'https://selar.com/m/osemudiamen-ayo-okhiria1', paystack_url: 'https://paystack.shop/engr-mudi', coming_soon: false },
    { id: 'seed-book-5', title: 'Flutter & Dart', description: '15 topics, one page each. 60-second reads.', price_label: '₦2,500', selar_url: 'https://selar.com/m/osemudiamen-ayo-okhiria1', paystack_url: 'https://paystack.shop/engr-mudi', coming_soon: false },
    { id: 'seed-book-6', title: 'The Complete 60-Second Developer Pack', description: 'All five packs in one. You save ₦5,000.', price_label: '₦7,500', selar_url: null, paystack_url: null, coming_soon: true },
  ],
  services: [
    { id: 'seed-service-1', label: 'Coaching on how to use AI to build things.' },
  ],
  socialLinks: [
    { id: 'seed-link-1', label: 'WhatsApp', url: 'https://wa.me/2348134882178' },
    { id: 'seed-link-2', label: 'YouTube', url: 'https://www.youtube.com/@EngrMudi' },
    { id: 'seed-link-3', label: 'Instagram', url: 'https://www.instagram.com/engr.mudi' },
    { id: 'seed-link-4', label: 'Facebook', url: 'https://www.facebook.com/AyoOsemudiamen' },
  ],
  hire: {
    body: 'I build software the way you want it. It does not have to be a web app. Tell me what you need it to do, and I will build it to your preference.',
  },
}
