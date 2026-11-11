CREATE TYPE "public"."role_code" AS ENUM('buyer', 'farmer', 'admin', 'super_admin');--> statement-breakpoint
CREATE TYPE "public"."audit_result" AS ENUM('success', 'failure');--> statement-breakpoint
CREATE TYPE "public"."delivery_type" AS ENUM('delivery', 'pickup');--> statement-breakpoint
CREATE TYPE "public"."dispute_status" AS ENUM('open', 'under_review', 'resolved_buyer', 'resolved_farmer', 'resolved_split', 'closed');--> statement-breakpoint
CREATE TYPE "public"."inventory_reason" AS ENUM('restock', 'manual_adjustment', 'order_placed', 'order_cancelled', 'order_returned', 'damage');--> statement-breakpoint
CREATE TYPE "public"."app_locale" AS ENUM('ar', 'fr', 'en');--> statement-breakpoint
CREATE TYPE "public"."media_purpose" AS ENUM('product', 'store_logo', 'store_cover', 'category', 'editorial', 'dispute_evidence');--> statement-breakpoint
CREATE TYPE "public"."media_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('in_app', 'email');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'in_progress', 'completed', 'partially_cancelled', 'cancelled', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."otp_purpose" AS ENUM('login', 'farmer_application', 'email_change', 'admin_invite');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cod');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('unpaid', 'collected', 'refunded', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('draft', 'pending_review', 'published', 'rejected', 'out_of_stock', 'archived');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('open', 'reviewing', 'actioned', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."report_target" AS ENUM('user', 'store', 'product', 'review', 'order');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('published', 'hidden', 'removed');--> statement-breakpoint
CREATE TYPE "public"."sale_unit" AS ENUM('kg', 'g', 'piece', 'box', 'bunch', 'liter', 'quintal');--> statement-breakpoint
CREATE TYPE "public"."seller_order_status" AS ENUM('pending', 'confirmed', 'preparing', 'ready_for_delivery', 'shipped', 'delivered', 'cancelled', 'rejected', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."store_status" AS ENUM('draft', 'pending_verification', 'active', 'rejected', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'suspended', 'deactivated');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('unsubmitted', 'pending', 'approved', 'rejected', 'needs_info');--> statement-breakpoint
CREATE TABLE "communes" (
	"code" varchar(4) PRIMARY KEY NOT NULL,
	"wilaya_code" varchar(2) NOT NULL,
	"daira_code" varchar(4),
	"name_ar" varchar(160) NOT NULL,
	"name_fr" varchar(160) NOT NULL,
	"name_en" varchar(160) NOT NULL,
	"post_code" varchar(5),
	"latitude" numeric(9, 6),
	"longitude" numeric(9, 6),
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wilayas" (
	"code" varchar(2) PRIMARY KEY NOT NULL,
	"name_ar" varchar(120) NOT NULL,
	"name_fr" varchar(120) NOT NULL,
	"name_en" varchar(120) NOT NULL,
	"phone_code" varchar(6),
	"is_new_wilaya" boolean DEFAULT false NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"actor_user_id" uuid,
	"actor_role" "role_code",
	"action" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text,
	"result" text NOT NULL,
	"reason" text,
	"ip_hash" text,
	"user_agent_hash" text,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_otp_codes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"purpose" "otp_purpose" NOT NULL,
	"code_hash" text NOT NULL,
	"attempts" smallint DEFAULT 0 NOT NULL,
	"max_attempts" smallint DEFAULT 5 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "otp_codes_attempts_non_negative" CHECK ("auth_otp_codes"."attempts" >= 0),
	CONSTRAINT "otp_codes_max_attempts_positive" CHECK ("auth_otp_codes"."max_attempts" > 0)
);
--> statement-breakpoint
CREATE TABLE "oauth_accounts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"email_at_provider" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"code" text PRIMARY KEY NOT NULL,
	"description_ar" text NOT NULL,
	"description_fr" text NOT NULL,
	"description_en" text NOT NULL,
	"is_critical" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_code" "role_code" NOT NULL,
	"permission_code" text NOT NULL,
	CONSTRAINT "role_permissions_role_code_permission_code_pk" PRIMARY KEY("role_code","permission_code")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"code" "role_code" PRIMARY KEY NOT NULL,
	"name_ar" text NOT NULL,
	"name_fr" text NOT NULL,
	"name_en" text NOT NULL,
	"is_system" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"ip_hash" text,
	"user_agent" text,
	"expires_at" timestamp with time zone NOT NULL,
	"last_used_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"rotated_from_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"avatar_url" text,
	"preferred_wilaya_code" text,
	"notification_defaults" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" uuid NOT NULL,
	"role_code" "role_code" NOT NULL,
	"granted_by" uuid,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	CONSTRAINT "user_roles_user_id_role_code_pk" PRIMARY KEY("user_id","role_code")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"email_verified_at" timestamp with time zone,
	"name" text NOT NULL,
	"phone" text,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"default_locale" "app_locale" DEFAULT 'ar' NOT NULL,
	"primary_role" "role_code" DEFAULT 'buyer' NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_email_lowercase" CHECK ("users"."email" = lower("users"."email")),
	CONSTRAINT "users_phone_dz_format" CHECK ("users"."phone" IS NULL OR "users"."phone" ~ '^\+213[5-7][0-9]{8}$'),
	CONSTRAINT "users_name_not_blank" CHECK (length(btrim("users"."name")) > 0)
);
--> statement-breakpoint
CREATE TABLE "delivery_methods" (
	"code" varchar(40) PRIMARY KEY NOT NULL,
	"type" "delivery_type" NOT NULL,
	"name_ar" varchar(120) NOT NULL,
	"name_fr" varchar(120) NOT NULL,
	"name_en" varchar(120) NOT NULL,
	"requires_carrier" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipping_rates" (
	"id" uuid PRIMARY KEY NOT NULL,
	"method_code" varchar(40) NOT NULL,
	"from_wilaya_code" varchar(2),
	"to_wilaya_code" varchar(2) NOT NULL,
	"base_fee" numeric(10, 2) NOT NULL,
	"per_kg_fee" numeric(10, 2) DEFAULT '0' NOT NULL,
	"free_over" numeric(12, 2),
	"min_days" smallint,
	"max_days" smallint,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shipping_rates_base_non_negative" CHECK ("shipping_rates"."base_fee" >= 0),
	CONSTRAINT "shipping_rates_per_kg_non_negative" CHECK ("shipping_rates"."per_kg_fee" >= 0),
	CONSTRAINT "shipping_rates_days_valid" CHECK (("shipping_rates"."min_days" IS NULL OR "shipping_rates"."min_days" >= 0)
          AND ("shipping_rates"."max_days" IS NULL OR "shipping_rates"."min_days" IS NULL OR "shipping_rates"."max_days" >= "shipping_rates"."min_days"))
);
--> statement-breakpoint
CREATE TABLE "farmer_profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"farm_name" varchar(160) NOT NULL,
	"farm_size_ha" numeric(10, 2),
	"production_types" text[] DEFAULT '{}'::text[] NOT NULL,
	"verification_status" "verification_status" DEFAULT 'unsubmitted' NOT NULL,
	"verified_at" timestamp with time zone,
	"verified_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "farmer_profiles_farm_name_not_blank" CHECK (length(btrim("farmer_profiles"."farm_name")) > 0)
);
--> statement-breakpoint
CREATE TABLE "store_delivery_zones" (
	"id" uuid PRIMARY KEY NOT NULL,
	"store_id" uuid NOT NULL,
	"method_code" text NOT NULL,
	"wilaya_code" varchar(2) NOT NULL,
	"commune_code" varchar(4),
	"fee_override" numeric(10, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "store_zones_fee_non_negative" CHECK ("store_delivery_zones"."fee_override" IS NULL OR "store_delivery_zones"."fee_override" >= 0)
);
--> statement-breakpoint
CREATE TABLE "store_documents" (
	"id" uuid PRIMARY KEY NOT NULL,
	"request_id" uuid NOT NULL,
	"doc_type" varchar(40) NOT NULL,
	"file_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_verification_requests" (
	"id" uuid PRIMARY KEY NOT NULL,
	"store_id" uuid NOT NULL,
	"submitted_by" uuid NOT NULL,
	"status" "verification_status" DEFAULT 'pending' NOT NULL,
	"reviewer_id" uuid,
	"reviewer_note" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	CONSTRAINT "store_verifications_rejection_reason" CHECK ("store_verification_requests"."status" <> 'rejected' OR length(btrim(coalesce("store_verification_requests"."reviewer_note", ''))) > 0)
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" uuid PRIMARY KEY NOT NULL,
	"farmer_id" uuid NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name" varchar(160) NOT NULL,
	"description" text NOT NULL,
	"logo_url" text,
	"cover_url" text,
	"wilaya_code" varchar(2) NOT NULL,
	"commune_code" varchar(4) NOT NULL,
	"address_line" text NOT NULL,
	"phone" varchar(16) NOT NULL,
	"status" "store_status" DEFAULT 'draft' NOT NULL,
	"min_order_total" numeric(12, 2) DEFAULT '0' NOT NULL,
	"is_pickup_enabled" boolean DEFAULT true NOT NULL,
	"pickup_instructions" text,
	"delivery_notes" text,
	"suspended_reason" text,
	"suspended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "stores_min_order_non_negative" CHECK ("stores"."min_order_total" >= 0),
	CONSTRAINT "stores_name_not_blank" CHECK (length(btrim("stores"."name")) > 0),
	CONSTRAINT "stores_slug_format" CHECK ("stores"."slug" ~ '^[a-z0-9-]{3,80}$'),
	CONSTRAINT "stores_phone_dz_format" CHECK ("stores"."phone" ~ '^\+213[5-7][0-9]{8}$')
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY NOT NULL,
	"parent_id" uuid,
	"slug" varchar(60) NOT NULL,
	"name_ar" varchar(120) NOT NULL,
	"name_fr" varchar(120) NOT NULL,
	"name_en" varchar(120) NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"image_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "categories_slug_format" CHECK ("categories"."slug" ~ '^[a-z0-9-]{2,60}$')
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"product_id" uuid PRIMARY KEY NOT NULL,
	"quantity_available" numeric(10, 3) DEFAULT '0' NOT NULL,
	"low_stock_threshold" numeric(10, 3) DEFAULT '0' NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_quantity_non_negative" CHECK ("inventory_items"."quantity_available" >= 0),
	CONSTRAINT "inventory_threshold_non_negative" CHECK ("inventory_items"."low_stock_threshold" >= 0)
);
--> statement-breakpoint
CREATE TABLE "inventory_movements" (
	"id" uuid PRIMARY KEY NOT NULL,
	"product_id" uuid NOT NULL,
	"delta" numeric(10, 3) NOT NULL,
	"reason" "inventory_reason" NOT NULL,
	"ref_type" varchar(40),
	"ref_id" uuid,
	"note" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_movements_delta_non_zero" CHECK ("inventory_movements"."delta" <> 0)
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"product_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	CONSTRAINT "product_categories_product_id_category_id_pk" PRIMARY KEY("product_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" uuid PRIMARY KEY NOT NULL,
	"product_id" uuid NOT NULL,
	"url" text NOT NULL,
	"alt_ar" varchar(200) NOT NULL,
	"alt_fr" varchar(200) NOT NULL,
	"alt_en" varchar(200) NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"media_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_images_dimensions_positive" CHECK ("product_images"."width" > 0 AND "product_images"."height" > 0)
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY NOT NULL,
	"store_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"slug" varchar(90) NOT NULL,
	"name" varchar(160) NOT NULL,
	"description" text NOT NULL,
	"unit" "sale_unit" NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"compare_at_price" numeric(12, 2),
	"min_order_qty" numeric(10, 3) DEFAULT '1' NOT NULL,
	"status" "product_status" DEFAULT 'draft' NOT NULL,
	"is_organic" boolean DEFAULT false NOT NULL,
	"supports_delivery" boolean DEFAULT true NOT NULL,
	"supports_pickup" boolean DEFAULT true NOT NULL,
	"harvest_date" date,
	"season_start_month" smallint,
	"season_end_month" smallint,
	"rejection_reason" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "products_price_positive" CHECK ("products"."price" > 0),
	CONSTRAINT "products_compare_at_not_cheaper" CHECK ("products"."compare_at_price" IS NULL OR "products"."compare_at_price" >= "products"."price"),
	CONSTRAINT "products_min_order_positive" CHECK ("products"."min_order_qty" > 0),
	CONSTRAINT "products_fulfillment_available" CHECK ("products"."supports_delivery" OR "products"."supports_pickup"),
	CONSTRAINT "products_season_months_valid" CHECK (("products"."season_start_month" IS NULL OR "products"."season_start_month" BETWEEN 1 AND 12)
          AND ("products"."season_end_month" IS NULL OR "products"."season_end_month" BETWEEN 1 AND 12)),
	CONSTRAINT "products_rejection_reason_required" CHECK ("products"."status" <> 'rejected' OR length(btrim(coalesce("products"."rejection_reason", ''))) > 0)
);
--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"label" varchar(60),
	"contact_name" varchar(120) NOT NULL,
	"phone" varchar(16) NOT NULL,
	"wilaya_code" varchar(2) NOT NULL,
	"commune_code" varchar(4) NOT NULL,
	"address_line" text NOT NULL,
	"notes" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "addresses_phone_dz_format" CHECK ("addresses"."phone" ~ '^\+213[5-7][0-9]{8}$')
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"cart_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" numeric(10, 3) DEFAULT '1' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cart_items_quantity_positive" CHECK ("cart_items"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"buyer_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "idempotency_keys" (
	"user_id" uuid NOT NULL,
	"scope" varchar(40) NOT NULL,
	"key" varchar(100) NOT NULL,
	"request_hash" text NOT NULL,
	"result_ref" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "idempotency_keys_user_id_scope_key_pk" PRIMARY KEY("user_id","scope","key")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"seller_order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"product_name_snapshot" varchar(160) NOT NULL,
	"unit_snapshot" "sale_unit" NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"quantity" numeric(10, 3) NOT NULL,
	"line_total" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_items_quantity_positive" CHECK ("order_items"."quantity" > 0),
	CONSTRAINT "order_items_price_positive" CHECK ("order_items"."unit_price" > 0),
	CONSTRAINT "order_items_line_total_non_negative" CHECK ("order_items"."line_total" >= 0)
);
--> statement-breakpoint
CREATE TABLE "order_status_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"order_id" uuid NOT NULL,
	"seller_order_id" uuid,
	"from_status" text,
	"to_status" text NOT NULL,
	"actor_user_id" uuid,
	"actor_role" "role_code",
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY NOT NULL,
	"order_number" varchar(24) NOT NULL,
	"buyer_id" uuid NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"currency" varchar(3) DEFAULT 'DZD' NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"shipping_total" numeric(12, 2) DEFAULT '0' NOT NULL,
	"discount_total" numeric(12, 2) DEFAULT '0' NOT NULL,
	"grand_total" numeric(12, 2) NOT NULL,
	"payment_method" "payment_method" DEFAULT 'cod' NOT NULL,
	"payment_status" "payment_status" DEFAULT 'unpaid' NOT NULL,
	"contact_name" varchar(120) NOT NULL,
	"contact_phone" varchar(16) NOT NULL,
	"wilaya_code" varchar(2) NOT NULL,
	"commune_code" varchar(4) NOT NULL,
	"address_line" text NOT NULL,
	"delivery_notes" text,
	"placed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"cancelled_at" timestamp with time zone,
	"cancel_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_amounts_non_negative" CHECK ("orders"."subtotal" >= 0 AND "orders"."shipping_total" >= 0 AND "orders"."discount_total" >= 0 AND "orders"."grand_total" >= 0),
	CONSTRAINT "orders_total_consistent" CHECK ("orders"."grand_total" = "orders"."subtotal" + "orders"."shipping_total" - "orders"."discount_total"),
	CONSTRAINT "orders_cancellation_reason" CHECK ("orders"."status" <> 'cancelled' OR length(btrim(coalesce("orders"."cancel_reason", ''))) > 0)
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"order_id" uuid NOT NULL,
	"provider" varchar(40) DEFAULT 'cod' NOT NULL,
	"method" "payment_method" DEFAULT 'cod' NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'DZD' NOT NULL,
	"status" "payment_status" DEFAULT 'unpaid' NOT NULL,
	"reference" text,
	"collected_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_amount_non_negative" CHECK ("payments"."amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "seller_orders" (
	"id" uuid PRIMARY KEY NOT NULL,
	"order_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"farmer_id" uuid NOT NULL,
	"seller_order_number" varchar(28) NOT NULL,
	"status" "seller_order_status" DEFAULT 'pending' NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"shipping_cost" numeric(12, 2) DEFAULT '0' NOT NULL,
	"platform_fee" numeric(12, 2) DEFAULT '0' NOT NULL,
	"fee_rate" numeric(5, 4) DEFAULT '0' NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"delivery_type" "delivery_type" NOT NULL,
	"confirmation_deadline" timestamp with time zone,
	"confirmed_at" timestamp with time zone,
	"shipped_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancel_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "seller_orders_amounts_non_negative" CHECK ("seller_orders"."subtotal" >= 0 AND "seller_orders"."shipping_cost" >= 0 AND "seller_orders"."platform_fee" >= 0 AND "seller_orders"."total" >= 0),
	CONSTRAINT "seller_orders_fee_rate_range" CHECK ("seller_orders"."fee_rate" >= 0 AND "seller_orders"."fee_rate" <= 1),
	CONSTRAINT "seller_orders_total_consistent" CHECK ("seller_orders"."total" = "seller_orders"."subtotal" + "seller_orders"."shipping_cost"),
	CONSTRAINT "seller_orders_cancellation_reason" CHECK ("seller_orders"."status" NOT IN ('cancelled', 'rejected') OR length(btrim(coalesce("seller_orders"."cancel_reason", ''))) > 0)
);
--> statement-breakpoint
CREATE TABLE "dispute_messages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"dispute_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"body" text NOT NULL,
	"attachment_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dispute_messages_body_not_blank" CHECK (length(btrim("dispute_messages"."body")) > 0)
);
--> statement-breakpoint
CREATE TABLE "disputes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"order_id" uuid NOT NULL,
	"seller_order_id" uuid,
	"opened_by" uuid NOT NULL,
	"against_user_id" uuid,
	"reason" varchar(80) NOT NULL,
	"description" text NOT NULL,
	"status" "dispute_status" DEFAULT 'open' NOT NULL,
	"resolution_note" text,
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "disputes_resolution_required" CHECK ("disputes"."status" NOT IN ('resolved_buyer', 'resolved_farmer', 'resolved_split', 'closed')
          OR length(btrim(coalesce("disputes"."resolution_note", ''))) > 0)
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"user_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "favorites_user_id_product_id_pk" PRIMARY KEY("user_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"user_id" uuid NOT NULL,
	"type" varchar(60) NOT NULL,
	"in_app" boolean DEFAULT true NOT NULL,
	"email" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preferences_user_id_type_pk" PRIMARY KEY("user_id","type")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(60) NOT NULL,
	"params" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"link" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY NOT NULL,
	"reporter_id" uuid NOT NULL,
	"target_type" "report_target" NOT NULL,
	"target_id" uuid NOT NULL,
	"reason" varchar(80) NOT NULL,
	"description" text,
	"status" "report_status" DEFAULT 'open' NOT NULL,
	"handled_by" uuid,
	"resolution" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reports_resolution_required" CHECK ("reports"."status" NOT IN ('actioned', 'dismissed') OR length(btrim(coalesce("reports"."resolution", ''))) > 0)
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY NOT NULL,
	"order_item_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"buyer_id" uuid NOT NULL,
	"rating" smallint NOT NULL,
	"comment" text,
	"status" "review_status" DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "reviews_rating_range" CHECK ("reviews"."rating" BETWEEN 1 AND 5)
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"store_id" uuid,
	"product_id" uuid,
	"storage_key" text NOT NULL,
	"url" text NOT NULL,
	"mime_type" varchar(60) NOT NULL,
	"bytes" integer NOT NULL,
	"width" integer,
	"height" integer,
	"checksum_sha256" varchar(64),
	"purpose" "media_purpose" NOT NULL,
	"status" "media_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_bytes_positive" CHECK ("media_assets"."bytes" > 0),
	CONSTRAINT "media_mime_allowed" CHECK ("media_assets"."mime_type" IN ('image/jpeg', 'image/png', 'image/webp', 'image/avif'))
);
--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"key" varchar(80) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"is_critical" boolean DEFAULT false NOT NULL,
	"description" text,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "communes" ADD CONSTRAINT "communes_wilaya_code_wilayas_code_fk" FOREIGN KEY ("wilaya_code") REFERENCES "public"."wilayas"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_code_roles_code_fk" FOREIGN KEY ("role_code") REFERENCES "public"."roles"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_code_permissions_code_fk" FOREIGN KEY ("permission_code") REFERENCES "public"."permissions"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_code_roles_code_fk" FOREIGN KEY ("role_code") REFERENCES "public"."roles"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_rates" ADD CONSTRAINT "shipping_rates_method_code_delivery_methods_code_fk" FOREIGN KEY ("method_code") REFERENCES "public"."delivery_methods"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_rates" ADD CONSTRAINT "shipping_rates_from_wilaya_code_wilayas_code_fk" FOREIGN KEY ("from_wilaya_code") REFERENCES "public"."wilayas"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_rates" ADD CONSTRAINT "shipping_rates_to_wilaya_code_wilayas_code_fk" FOREIGN KEY ("to_wilaya_code") REFERENCES "public"."wilayas"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farmer_profiles" ADD CONSTRAINT "farmer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farmer_profiles" ADD CONSTRAINT "farmer_profiles_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_delivery_zones" ADD CONSTRAINT "store_delivery_zones_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_delivery_zones" ADD CONSTRAINT "store_delivery_zones_method_code_delivery_methods_code_fk" FOREIGN KEY ("method_code") REFERENCES "public"."delivery_methods"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_delivery_zones" ADD CONSTRAINT "store_delivery_zones_wilaya_code_wilayas_code_fk" FOREIGN KEY ("wilaya_code") REFERENCES "public"."wilayas"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_delivery_zones" ADD CONSTRAINT "store_delivery_zones_commune_code_communes_code_fk" FOREIGN KEY ("commune_code") REFERENCES "public"."communes"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_documents" ADD CONSTRAINT "store_documents_request_id_store_verification_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."store_verification_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_verification_requests" ADD CONSTRAINT "store_verification_requests_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_verification_requests" ADD CONSTRAINT "store_verification_requests_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_verification_requests" ADD CONSTRAINT "store_verification_requests_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_farmer_id_users_id_fk" FOREIGN KEY ("farmer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_wilaya_code_wilayas_code_fk" FOREIGN KEY ("wilaya_code") REFERENCES "public"."wilayas"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_commune_code_communes_code_fk" FOREIGN KEY ("commune_code") REFERENCES "public"."communes"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_wilaya_code_wilayas_code_fk" FOREIGN KEY ("wilaya_code") REFERENCES "public"."wilayas"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_commune_code_communes_code_fk" FOREIGN KEY ("commune_code") REFERENCES "public"."communes"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_seller_order_id_seller_orders_id_fk" FOREIGN KEY ("seller_order_id") REFERENCES "public"."seller_orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_events" ADD CONSTRAINT "order_status_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_events" ADD CONSTRAINT "order_status_events_seller_order_id_seller_orders_id_fk" FOREIGN KEY ("seller_order_id") REFERENCES "public"."seller_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_events" ADD CONSTRAINT "order_status_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_wilaya_code_wilayas_code_fk" FOREIGN KEY ("wilaya_code") REFERENCES "public"."wilayas"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_commune_code_communes_code_fk" FOREIGN KEY ("commune_code") REFERENCES "public"."communes"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_orders" ADD CONSTRAINT "seller_orders_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_orders" ADD CONSTRAINT "seller_orders_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_orders" ADD CONSTRAINT "seller_orders_farmer_id_users_id_fk" FOREIGN KEY ("farmer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_messages" ADD CONSTRAINT "dispute_messages_dispute_id_disputes_id_fk" FOREIGN KEY ("dispute_id") REFERENCES "public"."disputes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_messages" ADD CONSTRAINT "dispute_messages_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_seller_order_id_seller_orders_id_fk" FOREIGN KEY ("seller_order_id") REFERENCES "public"."seller_orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_opened_by_users_id_fk" FOREIGN KEY ("opened_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_against_user_id_users_id_fk" FOREIGN KEY ("against_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_handled_by_users_id_fk" FOREIGN KEY ("handled_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_settings" ADD CONSTRAINT "platform_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "communes_wilaya_idx" ON "communes" USING btree ("wilaya_code");--> statement-breakpoint
CREATE INDEX "communes_daira_idx" ON "communes" USING btree ("daira_code");--> statement-breakpoint
CREATE INDEX "wilayas_sort_idx" ON "wilayas" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs" USING btree ("resource_type","resource_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_user_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action","created_at");--> statement-breakpoint
CREATE INDEX "otp_codes_email_purpose_idx" ON "auth_otp_codes" USING btree ("email","purpose","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "oauth_accounts_provider_account_key" ON "oauth_accounts" USING btree ("provider","provider_account_id");--> statement-breakpoint
CREATE INDEX "oauth_accounts_user_idx" ON "oauth_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "sessions_user_active_idx" ON "sessions" USING btree ("user_id","revoked_at","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_roles_role_idx" ON "user_roles" USING btree ("role_code");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_key" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_phone_key" ON "users" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "users_status_role_idx" ON "users" USING btree ("status","primary_role");--> statement-breakpoint
CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "delivery_methods_active_idx" ON "delivery_methods" USING btree ("is_active","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "shipping_rates_unique_national" ON "shipping_rates" USING btree ("method_code","to_wilaya_code") WHERE "shipping_rates"."from_wilaya_code" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "shipping_rates_unique_route" ON "shipping_rates" USING btree ("method_code","from_wilaya_code","to_wilaya_code") WHERE "shipping_rates"."from_wilaya_code" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "shipping_rates_destination_idx" ON "shipping_rates" USING btree ("to_wilaya_code","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "farmer_profiles_user_id_key" ON "farmer_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "farmer_profiles_status_idx" ON "farmer_profiles" USING btree ("verification_status");--> statement-breakpoint
CREATE UNIQUE INDEX "store_zones_unique_wilaya" ON "store_delivery_zones" USING btree ("store_id","method_code","wilaya_code") WHERE "store_delivery_zones"."commune_code" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "store_zones_unique_commune" ON "store_delivery_zones" USING btree ("store_id","method_code","wilaya_code","commune_code") WHERE "store_delivery_zones"."commune_code" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "store_documents_request_idx" ON "store_documents" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "store_verifications_store_idx" ON "store_verification_requests" USING btree ("store_id","submitted_at");--> statement-breakpoint
CREATE INDEX "store_verifications_status_idx" ON "store_verification_requests" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "stores_slug_key" ON "stores" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "stores_farmer_id_key" ON "stores" USING btree ("farmer_id");--> statement-breakpoint
CREATE INDEX "stores_status_wilaya_idx" ON "stores" USING btree ("status","wilaya_code");--> statement-breakpoint
CREATE INDEX "stores_wilaya_idx" ON "stores" USING btree ("wilaya_code");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_key" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "categories_parent_idx" ON "categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "categories_active_sort_idx" ON "categories" USING btree ("is_active","sort_order");--> statement-breakpoint
CREATE INDEX "inventory_available_idx" ON "inventory_items" USING btree ("quantity_available") WHERE "inventory_items"."quantity_available" > 0;--> statement-breakpoint
CREATE INDEX "inventory_movements_product_idx" ON "inventory_movements" USING btree ("product_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "product_images_product_sort_key" ON "product_images" USING btree ("product_id","sort_order");--> statement-breakpoint
CREATE INDEX "product_images_product_idx" ON "product_images" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "products_store_slug_key" ON "products" USING btree ("store_id","slug");--> statement-breakpoint
CREATE INDEX "products_status_published_idx" ON "products" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "products_store_status_idx" ON "products" USING btree ("store_id","status");--> statement-breakpoint
CREATE INDEX "products_category_status_idx" ON "products" USING btree ("category_id","status");--> statement-breakpoint
CREATE INDEX "products_price_idx" ON "products" USING btree ("price");--> statement-breakpoint
CREATE INDEX "addresses_user_idx" ON "addresses" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cart_items_cart_product_key" ON "cart_items" USING btree ("cart_id","product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "carts_buyer_id_key" ON "carts" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "idempotency_created_idx" ON "idempotency_keys" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "order_items_seller_order_idx" ON "order_items" USING btree ("seller_order_id");--> statement-breakpoint
CREATE INDEX "order_items_product_idx" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "order_status_events_order_idx" ON "order_status_events" USING btree ("order_id","created_at");--> statement-breakpoint
CREATE INDEX "order_status_events_seller_order_idx" ON "order_status_events" USING btree ("seller_order_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_number_key" ON "orders" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "orders_buyer_placed_idx" ON "orders" USING btree ("buyer_id","placed_at");--> statement-breakpoint
CREATE INDEX "orders_status_placed_idx" ON "orders" USING btree ("status","placed_at");--> statement-breakpoint
CREATE INDEX "orders_placed_idx" ON "orders" USING btree ("placed_at");--> statement-breakpoint
CREATE INDEX "payments_order_idx" ON "payments" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "seller_orders_number_key" ON "seller_orders" USING btree ("seller_order_number");--> statement-breakpoint
CREATE UNIQUE INDEX "seller_orders_order_store_key" ON "seller_orders" USING btree ("order_id","store_id");--> statement-breakpoint
CREATE INDEX "seller_orders_store_status_idx" ON "seller_orders" USING btree ("store_id","status","created_at");--> statement-breakpoint
CREATE INDEX "seller_orders_farmer_idx" ON "seller_orders" USING btree ("farmer_id","created_at");--> statement-breakpoint
CREATE INDEX "dispute_messages_dispute_idx" ON "dispute_messages" USING btree ("dispute_id","created_at");--> statement-breakpoint
CREATE INDEX "disputes_status_idx" ON "disputes" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "disputes_order_idx" ON "disputes" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "notifications_user_unread_idx" ON "notifications" USING btree ("user_id","read_at","created_at");--> statement-breakpoint
CREATE INDEX "notifications_created_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "reports_status_idx" ON "reports" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "reports_target_idx" ON "reports" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_order_item_key" ON "reviews" USING btree ("order_item_id");--> statement-breakpoint
CREATE INDEX "reviews_product_idx" ON "reviews" USING btree ("product_id","status","created_at");--> statement-breakpoint
CREATE INDEX "reviews_store_idx" ON "reviews" USING btree ("store_id","status");--> statement-breakpoint
CREATE INDEX "reviews_buyer_idx" ON "reviews" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "media_owner_idx" ON "media_assets" USING btree ("owner_user_id","created_at");--> statement-breakpoint
CREATE INDEX "media_store_idx" ON "media_assets" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "media_product_idx" ON "media_assets" USING btree ("product_id");