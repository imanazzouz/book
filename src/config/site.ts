/**
 * Static, non-business configuration. Business data (products, stores, orders)
 * always comes from the database — never from this file.
 */
export const siteConfig = {
  name: 'AgriDirect',
  tagline: { ar: 'من الحقل إلى مائدتك', fr: 'Du champ à votre table', en: 'From the field to your table' },
  coverage: { wilayas: 69, communes: 1541 },
  launchCommissionRate: 0,
  paymentMethods: ['cod'] as const,
} as const;
