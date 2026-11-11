import { CATEGORY_SEED } from '@/config/catalog';

/**
 * Platform reference data — the *rules* of the marketplace, not business data.
 *
 * Everything in this file is derived from the decisions approved in phase 1:
 * four roles, permissions for privileged actions, three fulfilment methods
 * (home delivery, pickup point, farm pickup), 0 % platform fee, mandatory
 * product moderation, COD only, Arabic by default.
 */
export const ROLE_SEED = [
  { code: 'buyer', nameAr: 'مشترٍ', nameFr: 'Acheteur', nameEn: 'Buyer' },
  { code: 'farmer', nameAr: 'فلاح', nameFr: 'Agriculteur', nameEn: 'Farmer' },
  { code: 'admin', nameAr: 'مشرف', nameFr: 'Administrateur', nameEn: 'Admin' },
  {
    code: 'super_admin',
    nameAr: 'مشرف عام',
    nameFr: 'Super administrateur',
    nameEn: 'Super admin',
  },
] as const;

export type RoleCode = (typeof ROLE_SEED)[number]['code'];

export const PERMISSION_SEED = [
  [
    'catalog.product.submit',
    'إرسال منتج للمراجعة',
    'Soumettre un produit',
    'Submit a product',
    false,
  ],
  [
    'catalog.product.moderate',
    'مراجعة المنتجات',
    'Modérer les produits',
    'Moderate products',
    false,
  ],
  ['store.manage', 'إدارة المتجر', 'Gérer la boutique', 'Manage the store', false],
  ['stores.verify', 'التحقق من المتاجر', 'Vérifier les boutiques', 'Verify stores', false],
  ['orders.fulfill', 'تنفيذ الطلبات', 'Traiter les commandes', 'Fulfil orders', false],
  ['orders.cancel', 'إلغاء الطلبات', 'Annuler les commandes', 'Cancel orders', false],
  ['reviews.moderate', 'مراجعة التقييمات', 'Modérer les avis', 'Moderate reviews', false],
  ['reports.handle', 'معالجة البلاغات', 'Traiter les signalements', 'Handle reports', false],
  ['disputes.resolve', 'حل النزاعات', 'Résoudre les litiges', 'Resolve disputes', false],
  ['media.moderate', 'مراجعة الوسائط', 'Modérer les médias', 'Moderate media', false],
  ['users.suspend', 'تعليق المستخدمين', 'Suspendre des comptes', 'Suspend users', true],
  ['audit.read', 'قراءة سجل التدقيق', "Consulter le journal d'audit", 'Read the audit log', false],
  [
    'settings.update',
    'تعديل الإعدادات الحساسة',
    'Modifier les réglages critiques',
    'Update critical settings',
    true,
  ],
  ['admin.manage', 'إدارة المشرفين', 'Gérer les administrateurs', 'Manage admins', true],
] as const;

const FARMER_PERMISSIONS = ['catalog.product.submit', 'store.manage', 'orders.fulfill'];

const ADMIN_PERMISSIONS = [
  'catalog.product.moderate',
  'stores.verify',
  'orders.cancel',
  'reviews.moderate',
  'reports.handle',
  'disputes.resolve',
  'media.moderate',
  'users.suspend',
  'audit.read',
];

export const ROLE_PERMISSION_SEED: Record<RoleCode, readonly string[]> = {
  buyer: [],
  farmer: FARMER_PERMISSIONS,
  admin: ADMIN_PERMISSIONS,
  super_admin: [...PERMISSION_SEED.map((permission) => permission[0])],
};

export const DELIVERY_METHOD_SEED = [
  {
    code: 'home_delivery',
    type: 'delivery' as const,
    nameAr: 'توصيل إلى المنزل',
    nameFr: 'Livraison à domicile',
    nameEn: 'Home delivery',
    requiresCarrier: false,
    sortOrder: 10,
  },
  {
    code: 'pickup_point',
    type: 'delivery' as const,
    nameAr: 'نقطة استلام',
    nameFr: 'Point de retrait',
    nameEn: 'Pickup point',
    requiresCarrier: true,
    sortOrder: 20,
  },
  {
    code: 'farm_pickup',
    type: 'pickup' as const,
    nameAr: 'الاستلام من المزرعة',
    nameFr: 'Retrait à la ferme',
    nameEn: 'Farm pickup',
    requiresCarrier: false,
    sortOrder: 30,
  },
];

/** Non-critical platform settings, seeded once and editable by a super admin. */
export const PLATFORM_SETTING_SEED = [
  {
    key: 'platform.default_locale',
    value: 'ar',
    isCritical: false,
    description: 'Default UI locale (Arabic, RTL).',
  },
  {
    key: 'platform.currency',
    value: 'DZD',
    isCritical: true,
    description: 'Single currency for all prices. Never converted.',
  },
  {
    key: 'platform.fee_percent',
    value: 0,
    isCritical: true,
    description: 'Platform commission at launch: 0 %.',
  },
  {
    key: 'catalog.moderation_required',
    value: true,
    isCritical: true,
    description: 'Products must be approved before publishing.',
  },
  {
    key: 'orders.payment_methods',
    value: ['cod'],
    isCritical: true,
    description: 'Cash on delivery is the only payment method.',
  },
  {
    key: 'stores.pickup_enabled',
    value: true,
    isCritical: false,
    description: 'Farm pickup is offered by default.',
  },
];

export const CATEGORY_ROWS = CATEGORY_SEED.map((category, index) => ({
  slug: category.slug,
  nameAr: category.name.ar,
  nameFr: category.name.fr,
  nameEn: category.name.en,
  sortOrder: (index + 1) * 10,
}));
