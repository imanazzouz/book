import { pgEnum } from 'drizzle-orm/pg-core';

/**
 * Database enums. Keeping them in PostgreSQL (not just TypeScript) prevents
 * invalid states from being written by any client, migration or manual fix.
 */
export const userStatusEnum = pgEnum('user_status', ['active', 'suspended', 'deactivated']);

export const localeEnum = pgEnum('app_locale', ['ar', 'fr', 'en']);

export const adminRoleEnum = pgEnum('role_code', ['buyer', 'farmer', 'admin', 'super_admin']);

export const otpPurposeEnum = pgEnum('otp_purpose', [
  'login',
  'farmer_application',
  'email_change',
  'admin_invite',
]);

export const verificationStatusEnum = pgEnum('verification_status', [
  'unsubmitted',
  'pending',
  'approved',
  'rejected',
  'needs_info',
]);

export const storeStatusEnum = pgEnum('store_status', [
  'draft',
  'pending_verification',
  'active',
  'rejected',
  'suspended',
]);

export const productStatusEnum = pgEnum('product_status', [
  'draft',
  'pending_review',
  'published',
  'rejected',
  'out_of_stock',
  'archived',
]);

export const saleUnitEnum = pgEnum('sale_unit', [
  'kg',
  'g',
  'piece',
  'box',
  'bunch',
  'liter',
  'quintal',
]);

export const inventoryReasonEnum = pgEnum('inventory_reason', [
  'restock',
  'manual_adjustment',
  'order_placed',
  'order_cancelled',
  'order_returned',
  'damage',
]);

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'in_progress',
  'completed',
  'partially_cancelled',
  'cancelled',
  'disputed',
]);

export const sellerOrderStatusEnum = pgEnum('seller_order_status', [
  'pending',
  'confirmed',
  'preparing',
  'ready_for_delivery',
  'shipped',
  'delivered',
  'cancelled',
  'rejected',
  'disputed',
]);

export const deliveryTypeEnum = pgEnum('delivery_type', ['delivery', 'pickup']);

export const paymentMethodEnum = pgEnum('payment_method', ['cod']);

export const paymentStatusEnum = pgEnum('payment_status', [
  'unpaid',
  'collected',
  'refunded',
  'failed',
  'cancelled',
]);

export const reviewStatusEnum = pgEnum('review_status', ['published', 'hidden', 'removed']);

export const reportTargetEnum = pgEnum('report_target', [
  'user',
  'store',
  'product',
  'review',
  'order',
]);

export const reportStatusEnum = pgEnum('report_status', [
  'open',
  'reviewing',
  'actioned',
  'dismissed',
]);

export const disputeStatusEnum = pgEnum('dispute_status', [
  'open',
  'under_review',
  'resolved_buyer',
  'resolved_farmer',
  'resolved_split',
  'closed',
]);

export const mediaPurposeEnum = pgEnum('media_purpose', [
  'product',
  'store_logo',
  'store_cover',
  'category',
  'editorial',
  'dispute_evidence',
]);

export const mediaStatusEnum = pgEnum('media_status', ['pending', 'approved', 'rejected']);

export const auditResultEnum = pgEnum('audit_result', ['success', 'failure']);

export const notificationChannelEnum = pgEnum('notification_channel', ['in_app', 'email']);
