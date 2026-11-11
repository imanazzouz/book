# 02 — تصميم قاعدة البيانات (ERD + المواصفات)

> PostgreSQL 16 على Neon · Prisma 7 · UUID v7 · `numeric(12,2)` للمال · DZD
> **لا بيانات نشاط تجاري في البذور.** البذور = بيانات مرجعية فقط.

---

## 1. المخطط الكلي (نظرة سريعة)

| المجموعة | الجداول |
|---|---|
| الهوية والصلاحيات | `users` · `user_profiles` · `oauth_accounts` · `sessions` · `auth_otp_codes` · `roles` · `permissions` · `role_permissions` · `user_roles` |
| الجغرافيا والتوصيل | `wilayas` · `communes` · `addresses` · `delivery_methods` · `shipping_rates` · `store_delivery_zones` |
| المزارع والمتجر | `farmer_profiles` · `stores` · `store_verification_requests` · `store_documents` |
| الكتالوج والمخزون | `categories` · `products` · `product_images` · `product_categories` · `inventory_items` · `inventory_movements` |
| التجارة | `carts` · `cart_items` · `orders` · `seller_orders` · `order_items` · `order_status_events` · `payments` · `idempotency_keys` |
| الثقة والإشراف | `reviews` · `favorites` · `reports` · `disputes` · `dispute_messages` |
| المنصة | `notifications` · `notification_preferences` · `media_assets` · `platform_settings` · `audit_logs` |

---

## 2. ERD — الهوية والصلاحيات

```mermaid
erDiagram
    USERS ||--o{ SESSIONS : owns
    USERS ||--o{ OAUTH_ACCOUNTS : links
    USERS ||--|| USER_PROFILES : has
    USERS ||--o{ USER_ROLES : granted
    ROLES ||--o{ USER_ROLES : contains
    ROLES ||--o{ ROLE_PERMISSIONS : has
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : granted_to
    USERS ||--o{ AUTH_OTP_CODES : receives
    USERS ||--o{ AUDIT_LOGS : performs

    USERS {
      uuid id PK
      text email UK
      timestamptz email_verified_at
      text name
      text phone UK
      text status
      text default_locale
      text primary_role
      timestamptz last_login_at
      timestamptz deleted_at
    }
    USER_PROFILES {
      uuid id PK
      uuid user_id FK
      text avatar_url
      text preferred_wilaya
      jsonb notification_defaults
    }
    OAUTH_ACCOUNTS {
      uuid id PK
      uuid user_id FK
      text provider
      text provider_account_id UK
      text email_at_provider
    }
    SESSIONS {
      uuid id PK
      uuid user_id FK
      text token_hash UK
      text ip_hash
      text user_agent
      timestamptz expires_at
      timestamptz last_used_at
      timestamptz revoked_at
      uuid rotated_from
    }
    AUTH_OTP_CODES {
      uuid id PK
      text email
      text purpose
      text code_hash
      smallint attempts
      timestamptz expires_at
      timestamptz consumed_at
      text ip_hash
    }
    ROLES {
      uuid id PK
      text code UK
      text name_ar
      text name_fr
      text name_en
    }
    PERMISSIONS {
      text code PK
      text description_ar
      text description_fr
      boolean is_critical
    }
    ROLE_PERMISSIONS {
      uuid role_id FK
      text permission_code FK
    }
    USER_ROLES {
      uuid user_id FK
      uuid role_id FK
      uuid granted_by
      timestamptz expires_at
    }
    AUDIT_LOGS {
      uuid id PK
      uuid actor_user_id FK
      text actor_role
      text action
      text resource_type
      text resource_id
      text result
      text reason
      text ip_hash
      jsonb metadata
      timestamptz created_at
    }
```

**قرار:** `users.primary_role` عمود مساعد للتوجيه والعرض السريع، لكن **الصلاحيات تُقرأ من `user_roles` → `role_permissions`** فقط. لا يُعتمد العمود في أي قرار أمني (يمنع التلاعب ويسمح بأدوار متعددة).

---

## 3. ERD — المزارع، الكتالوج، المخزون

```mermaid
erDiagram
    USERS ||--o| FARMER_PROFILES : owns
    USERS ||--o| STORES : operates
    STORES ||--o{ STORE_VERIFICATION_REQUESTS : submits
    STORE_VERIFICATION_REQUESTS ||--o{ STORE_DOCUMENTS : includes
    STORES ||--o{ PRODUCTS : sells
    CATEGORIES ||--o{ CATEGORIES : parent_of
    CATEGORIES ||--o{ PRODUCTS : classifies
    PRODUCTS ||--o{ PRODUCT_IMAGES : has
    PRODUCTS ||--o{ PRODUCT_CATEGORIES : tagged
    PRODUCTS ||--|| INVENTORY_ITEMS : stock
    PRODUCTS ||--o{ INVENTORY_MOVEMENTS : history
    MEDIA_ASSETS ||--o{ PRODUCT_IMAGES : file
    WILAYAS ||--o{ COMMUNES : contains
    WILAYAS ||--o{ STORES : located_in
    STORES ||--o{ STORE_DELIVERY_ZONES : covers

    STORES {
      uuid id PK
      uuid farmer_id FK
      text slug UK
      text name
      text status
      text wilaya_code FK
      uuid commune_id FK
      uuid logo_media_id
      uuid cover_media_id
      numeric min_order_total
      boolean is_pickup_enabled
      timestamptz deleted_at
    }
    FARMER_PROFILES {
      uuid id PK
      uuid user_id FK
      text farm_name
      numeric farm_size_ha
      text verification_status
      timestamptz verified_at
    }
    PRODUCTS {
      uuid id PK
      uuid store_id FK
      uuid category_id FK
      text slug
      text name
      text description
      text unit
      numeric price
      numeric min_order_qty
      text status
      boolean is_organic
      boolean supports_delivery
      boolean supports_pickup
      timestamptz published_at
      timestamptz deleted_at
    }
    INVENTORY_ITEMS {
      uuid product_id PK
      numeric quantity_available
      numeric low_stock_threshold
      integer version
    }
    INVENTORY_MOVEMENTS {
      uuid id PK
      uuid product_id FK
      numeric delta
      text reason
      uuid ref_id
      uuid created_by
    }
    CATEGORIES {
      uuid id PK
      uuid parent_id FK
      text slug UK
      text name_ar
      text name_fr
      boolean is_active
    }
```

### حالات الكيانات (Enums)

| Enum | القيم | ملاحظة |
|---|---|---|
| `user_status` | `active` · `suspended` · `deactivated` | التعليق يمنع الدخول والبيع فورًا |
| `store_status` | `draft` · `pending_verification` · `active` · `rejected` · `suspended` | النشر والطلبات تتطلب `active` |
| `verification_status` | `unsubmitted` · `pending` · `approved` · `rejected` · `needs_info` | مع سبب إلزامي عند الرفض |
| `product_status` | `draft` · `pending_review` · `published` · `rejected` · `out_of_stock` · `archived` | `out_of_stock` مشتق من المخزون ويُضبط آليًا |
| `inventory_reason` | `restock` · `manual_adjustment` · `order_placed` · `order_cancelled` · `order_returned` · `damage` | كل تغيير مخزون له حركة |
| `media_purpose` | `product` · `store_logo` · `store_cover` · `category` · `editorial` · `dispute_evidence` | يحدد قواعد الوصول |
| `media_status` | `pending` · `approved` · `rejected` | لا يُعرض غير المعتمد |

---

## 4. ERD — الطلبات، التوصيل، الدفع

```mermaid
erDiagram
    USERS ||--o{ ORDERS : places
    ORDERS ||--o{ SELLER_ORDERS : splits_into
    STORES ||--o{ SELLER_ORDERS : fulfills
    SELLER_ORDERS ||--o{ ORDER_ITEMS : contains
    PRODUCTS ||--o{ ORDER_ITEMS : referenced
    ORDERS ||--o{ ORDER_STATUS_EVENTS : timeline
    ORDERS ||--o{ PAYMENTS : paid_by
    ORDERS ||--o{ IDEMPOTENCY_KEYS : guarded
    SELLER_ORDERS ||--o{ DISPUTES : disputed
    ORDERS ||--o{ DISPUTES : disputed
    ORDER_ITEMS ||--o| REVIEWS : reviewed
    USERS ||--o{ REVIEWS : writes

    ORDERS {
      uuid id PK
      text order_number UK
      uuid buyer_id FK
      text status
      text currency
      numeric subtotal
      numeric shipping_total
      numeric grand_total
      text payment_method
      text payment_status
      text contact_name
      text contact_phone
      text wilaya_code
      uuid commune_id
      text address_line
      timestamptz placed_at
      timestamptz cancelled_at
    }
    SELLER_ORDERS {
      uuid id PK
      uuid order_id FK
      uuid store_id FK
      uuid farmer_id FK
      text seller_order_number UK
      text status
      numeric subtotal
      numeric shipping_cost
      numeric platform_fee
      numeric total
      text delivery_method
      timestamptz confirmation_deadline
      timestamptz delivered_at
      timestamptz cancelled_at
    }
    ORDER_ITEMS {
      uuid id PK
      uuid seller_order_id FK
      uuid product_id FK
      text product_name_snapshot
      text unit_snapshot
      numeric unit_price
      numeric quantity
      numeric line_total
    }
    ORDER_STATUS_EVENTS {
      uuid id PK
      uuid order_id FK
      uuid seller_order_id FK
      text from_status
      text to_status
      uuid actor_user_id
      text actor_role
      text reason
      timestamptz created_at
    }
    PAYMENTS {
      uuid id PK
      uuid order_id FK
      text provider
      numeric amount
      text currency
      text status
      timestamptz collected_at
    }
    REVIEWS {
      uuid id PK
      uuid order_item_id FK
      uuid product_id FK
      uuid buyer_id FK
      smallint rating
      text comment
      text status
    }
```

---

## 5. مواصفات الجداول الحرجة

### 5.1 `products`
- `slug` فريد **داخل المتجر**: `UNIQUE (store_id, slug)` — يمنع أيضًا تصادم روابط المنتجات بين مزارعين.
- `price` `NUMERIC(12,2) CHECK (price > 0)` — لا سعر صفر أو سالب.
- `min_order_qty` `NUMERIC(10,3) CHECK (min_order_qty > 0)` — يدعم 0.5 كغ.
- `CHECK (supports_delivery OR supports_pickup)` — يجب توفير طريقة استلام واحدة على الأقل.
- `FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE RESTRICT` — لا حذف متجر له منتجات نشطة، بل أرشفة.
- `FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT` — يمنع حذف تصنيف مستخدم.
- `deleted_at` Soft delete + `status = 'archived'`، والمنتج المحذوف يبقى ظاهرًا في الطلبات التاريخية عبر Snapshot.

### 5.2 `inventory_items` + `inventory_movements`
- المخزون في جدول منفصل عن المنتج: يفصل بيانات العرض عن حالة التوفر، ويمنع فقدان تاريخ الحركة.
- `quantity_available NUMERIC(10,3) NOT NULL CHECK (quantity_available >= 0)` — قيد قاعدة بيانات يمنع السالب حتى في حال خطأ برمجي.
- كل تغيير يمر بـ Use Case واحد يكتب سجل حركة في نفس Transaction.

### 5.3 `orders` / `seller_orders` / `order_items`
- `orders` = الاتفاقية التجارية الكاملة للمشتري (عنوان، توصيل، دفع).
- `seller_orders` = وحدة العمل للمزارع (قبول، تجهيز، شحن، إلغاء مستقل).
- `order_items` تحمل **Snapshot** للاسم والوحدة والسعر، فلا يتغير الطلب التاريخي إذا عدّل المزارع منتجه لاحقًا.
- `UNIQUE (order_id, store_id)` في `seller_orders` يضمن طلبًا فرعيًا واحدًا لكل متجر.
- `seller_order_number` = `AD-YYYY-NNNNNN-S` (S = ترتيب المتجر داخل الطلب) فريد.
- `CHECK (grand_total = subtotal + shipping_total - discount_total)` كطبقة أمان إضافية بعد حساب الخادم.
- السجلات المالية والطلبات: **لا حذف، لا Soft delete**. الإلغاء = حالة + سبب + حدث.

### 5.4 `reviews`
- `order_item_id UUID UNIQUE NOT NULL` — **تقييم واحد لكل سطر شراء** (يمنع التقييمات الوهمية والمكررة بنيويًا).
- `CHECK (rating BETWEEN 1 AND 5)`.
- لا يُنشأ إلا إذا كانت `seller_orders.status = 'delivered'` وكان `order_items` يخص المشتري — يُتحقق في Use Case أيضًا لا في القيد فقط.
- `status`: `published` · `hidden` (مخفي إداريًا بسبب) — لا حذف فعلي إلا بحذف المستخدم لرأيه وفق السياسة (`deleted_at`).

### 5.5 `media_assets`
- `storage_key` عشوائي (`uuid` + امتداد مشتق من MIME)، `checksum_sha256` لمنع التكرار العبثي.
- `owner_user_id` + `store_id`/`product_id` لفرض الملكية عند العرض والحذف.
- `status` يبدأ `pending`؛ لا يُعرض للعامة قبل التحقق من النوع والحجم.

### 5.6 `platform_settings`
- `key` (مثل `product_moderation_mode`, `platform_fee_rate`, `order_confirmation_hours`, `max_upload_bytes`) و`value jsonb`.
- `is_critical = true` ⇒ التعديل يتطلب `super:settings:write_critical` **و**سببًا في Audit Log.

---

## 6. الفهارس (Indexes) — مبرَّرة بكل استعلام متوقع

| # | الفهرس | الاستعلام المخدوم |
|---|---|---|
| 1 | `users (email)` UQ | الدخول بـ OTP/Google |
| 2 | `users (status, primary_role)` | فلاتر إدارة المستخدمين |
| 3 | `sessions (user_id, revoked_at, expires_at)` | «جلساتي النشطة» + التحقق |
| 4 | `sessions (token_hash)` UQ | التحقق من كل طلب مصادق |
| 5 | `auth_otp_codes (email, purpose, created_at DESC)` | آخر رمز + حد المحاولات |
| 6 | `products (status, deleted_at, published_at DESC)` | السوق والصفحة الرئيسية |
| 7 | `products (store_id, status)` | لوحة المزارع + صفحة المتجر |
| 8 | `products (category_id, status)` | تصفية التصنيف |
| 9 | `products (slug)` UQ | صفحة المنتج |
| 10 | `products` GIN على `to_tsvector(name, description)` | البحث النصي (بدل `LIKE %…%`) |
| 11 | `products (price)` | ترتيب/تصفية بالسعر |
| 12 | `inventory_items (quantity_available)` WHERE > 0 | «المتوفر فقط» |
| 13 | `orders (buyer_id, placed_at DESC)` | طلباتي |
| 14 | `orders (status, placed_at DESC)` | لوحة الإدارة + الطلبات المتأخرة |
| 15 | `orders (order_number)` UQ | البحث برقم الطلب |
| 16 | `seller_orders (store_id, status, created_at DESC)` | طلبات المزارع |
| 17 | `order_items (product_id)` | الأكثر طلبًا + تقييمات المنتج |
| 18 | `reviews (product_id, status, created_at DESC)` | تقييمات المنتج |
| 19 | `audit_logs (resource_type, resource_id, created_at DESC)` | سجل كيان |
| 20 | `audit_logs (actor_user_id, created_at DESC)` | سجل مشرف |
| 21 | `notifications (user_id, read_at, created_at DESC)` | مركز الإشعارات |
| 22 | `shipping_rates (method_id, to_wilaya_code)` | حساب التوصيل |
| 23 | `communes (wilaya_code)` | قوائم البلديات |
| 24 | `disputes (status, created_at DESC)` | صندوق النزاعات |

**قاعدة:** كل استعلام متكرر جديد ⇒ يُنشأ فهرسه في نفس PR، ويُتحقق بـ `EXPLAIN (ANALYZE, BUFFERS)` على بيانات اختبار ضخمة قبل الإنتاج.

---

## 7. التزامن ومنع Overselling

### 7.1 قرار: خفض ذرّي شرطي (Conditional Atomic Update) لا قفل على مستوى الجلسة
```sql
UPDATE inventory_items
   SET quantity_available = quantity_available - $1,
       version = version + 1,
       updated_at = now()
 WHERE product_id = $2
   AND quantity_available >= $1
RETURNING quantity_available, version;
```
- إن عاد صف واحد ⇒ نجح الحجز. إن عاد **صفر** ⇒ المخزون غير كافٍ ⇒ نرجع الطلب كاملًا (`409`) مع قائمة المنتجات الناقصة.
- لا `SELECT` ثم `UPDATE` (سباق). لا `NOWAIT` يدوي. القيد `CHECK (>= 0)` هو الحاجز الأخير.
- عند الإلغاء/الرفض: حركة عكسية `+qty` في نفس معاملة تغيير الحالة.

### 7.2 قرار: الطلب متعدد المتاجر = معاملة واحدة All-or-Nothing
```
BEGIN
  1. تحقّق الجلسة + الحساب النشط + الإعدادات
  2. حجز idempotency_key (فريد) — إن موجود مسبقًا: أعد نفس استجابة الطلب (200)
  3. تحميل المنتجات + المتاجر + حالة المتجر + حالة المنتج + الحد الأدنى للطلب
  4. منع المنتج غير المنشور/الحساب المعلّق/المنتج المحذوف
  5. حساب لكل متجر: subtotal، توصيل (منطقة/سعر)، عمولة، total   ← كله في الخادم
  6. مقارنة الإجمالي المُرسل من العميل (اختياري) — إن اختلف: 409 PRICE_CHANGED
  7. خفض المخزون ذرّيًا لكل سطر — فشل أي سطر ⇒ ROLLBACK كامل
  8. INSERT orders + seller_orders + order_items + order_status_events
  9. INSERT payments (COD, unpaid)
 10. Audit + Notifications (داخل المعاملة أو Outbox بعدها)
COMMIT
```
> **قرار مقصود:** لا نقبل «الطلب الجزئي» (تجاهل منتج ناقص) في v1 لتجنّب مفاجآت للمشتري. الرسالة تُظهر بدقة المنتجات غير المتوفرة ليعيد المحاولة.

### 7.3 Idempotency
`idempotency_keys (user_id, scope, key)` Unique + `request_hash`. إعادة الإرسال تعيد **نفس** الطلب لا تنشئ آخر. تُنظَّف المفاتيح الأقدم من 24 ساعة بمهمة مجدولة.

---

## 8. آلة حالات الطلب (Domain State Machine)

**مستوى الطلب الرئيسي `orders.status`:** `pending` · `in_progress` · `completed` · `partially_cancelled` · `cancelled` · `disputed`
**مستوى المزارع `seller_orders.status`:** `pending` · `confirmed` · `preparing` · `ready_for_delivery` · `shipped` · `delivered` · `cancelled` · `rejected` · `disputed`

| من | إلى | الفاعل المسموح | الشروط |
|---|---|---|---|
| `pending` | `confirmed` | Farmer (المتجر) | متجر `active`، مخزون محجوز، داخل `confirmation_deadline` |
| `pending` | `rejected` | Farmer | سبب إلزامي ⇒ إرجاع مخزون |
| `pending` | `cancelled` | Farmer · Buyer · Admin | سبب؛ Admin يوثّق السبب في Audit |
| `confirmed` | `preparing` | Farmer | — |
| `preparing` | `ready_for_delivery` | Farmer | طريقة التوصيل محددة |
| `ready_for_delivery` | `shipped` | Farmer | توصيل فقط |
| `ready_for_delivery` | `delivered` | Buyer (تأكيد الاستلام) · Farmer · Admin | استلام من المزرعة أو توصيل |
| `shipped` | `delivered` | Buyer · Farmer (مع رقم تتبع) · Admin | — |
| `*` | `cancelled` | Admin فقط | قبل `delivered`؛ بسبب مسجَّل |
| `delivered` | — | — | نهائي (المسار الوحيد: نزاع ثم معالجة إدارية) |
| `pending/confirmed` | `disputed` | Buyer | مسموح فقط قبل الشحن |
| `shipped/delivered` | `disputed` | Buyer | خلال 7 أيام من التسليم |

- الانتقالات تُنفَّذ من `domain/order-state-machine.ts` (دالة نقية `canTransition(from, to, actor)`)، ويُختبر كل مسار مسموح وممنوع.
- كل انتقال يكتب `order_status_events` (من، إلى، الفاعل، الدور، السبب، الوقت).
- حالة `orders` الرئيسية **تُشتق** من حالات `seller_orders` (كلها cancelled ⇒ cancelled؛ كلها delivered ⇒ completed؛ خليط ⇒ partially_cancelled/in_progress)، وتُحدَّث في نفس المعاملة.

---

## 9. حسابات المال والعمولة

- كل العمليات في `src/server/domain/money.ts` باستخدام `Decimal` (لا `number`).
- `line_total = round(unit_price × quantity, 2)` — التقريب نصف-للأعلى فقط في الدالة الواحدة المشتركة.
- `platform_fee = round(subtotal × fee_rate, 2)`، وتُحفظ `fee_rate` **Snapshot** في `seller_orders` حتى لا يتغير تاريخيًا إذا عدّلت الإدارة النسبة.
- `total = subtotal + shipping_cost` (رسوم المنصة تُحسم من مستحقات المزارع، ولا تُضاف على المشتري — قرار قابل للتغيير من الإعدادات).
- العرض: `Intl.NumberFormat(locale, { style: 'currency', currency: 'DZD' })` — الأرقام تُخزَّن كأرقام، والتنسيق للعرض فقط.

---

## 10. الجغرافيا والتوصيل

```mermaid
flowchart LR
    W["wilayas"] --> C["communes"]
    W --> SR["shipping_rates<br/>to_wilaya + base_fee"]
    DM["delivery_methods<br/>delivery | pickup"] --> SR
    S["stores"] --> SDZ["store_delivery_zones<br/>fee_override للمزارع"]
    SDZ --> W
    SDZ --> DM
    SR --> SDZ
    A["addresses"] --> W
    A --> C
```

- **قاعدة الحساب:** إن وُجد `store_delivery_zones` مطابق ⇒ استخدم `fee_override` أو سعر الجدول. وإلا ⇒ `shipping_rates` العامة. وإلا ⇒ التوصيل غير متاح لهذه الولاية (لا نخترع سعرًا).
- الاستلام من المزرعة: `stores.is_pickup_enabled` + عنوان الاستلام، وتكلفته صفر مع إظهار ذلك صراحةً.
- `UNIQUE` على `(method_id, from_wilaya_code, to_wilaya_code)` يُدار بفهرسين جزئيين لتفادي مشكلة `NULL` في Postgres.

---

## 11. الترحيلات (Migrations) والبذور

| البند | السياسة |
|---|---|
| التطوير | `prisma migrate dev` على فرع Neon مستقل (Branch لكل مطور إن أمكن) |
| الإنتاج | `prisma migrate deploy` فقط ضمن CI، مع نسخة/فرع احتياطي قبل الترحيل |
| `db push` | **ممنوع** على أي بيئة مشتركة أو إنتاج |
| قيود لا يدعمها Prisma | `CHECK`, `REVOKE`, `CREATE EXTENSION`, فهارس GIN ⇒ ملف SQL خام داخل نفس مجلد الـ migration |
| البيانات المرجعية | `prisma/seed/` idempotent: **69 ولاية و1541 بلدية** (القانون 26-06) + تصنيفات أساسية + طرق توصيل + إعدادات افتراضية |
| حماية «قاعدة فارغة» | `scripts/verify-empty.ts` يفشل إذا وُجد أي سجل في `users/products/orders/reviews` خارج حساب الأدمن الذي أنشأه المالك |
| حساب الأدمن الأول | `scripts/create-admin.ts` تفاعلي: يطلب البريد، ينشئ المستخدم ويُسند `super_admin`، ثم يُرسل OTP/دعوة. **لا كلمة مرور افتراضية، ولا بيانات دخول في الكود أو المستودع** |
| التراجع | كل migration قابلة للتراجع يدويًا بملف `down.sql` موثّق للعمليات الخطرة فقط |

**محسوم:** 69 ولاية وفق القانون 26-06 (أفريل 2026)؛ البذور ستُبنى على قائمة رسمية مصدرها الجريدة الرسمية. التصميم لا يتغير مهما تغيّر العدد.
