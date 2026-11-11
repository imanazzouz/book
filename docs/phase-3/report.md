# المرحلة 3 — قاعدة البيانات الحقيقية ومسار القراءة الفعلي

**التاريخ:** 2026-11-11 · **الفرع:** `arena/849be64d-book` · **الحالة:** مكتملة ومتحقَّق منها محليًا على Postgres حقيقي — **بانتظار `DATABASE_URL` من Neon لتشغيل نفس الأوامر على قاعدتك**.
**قراراتك السارية:** 69 ولاية (القانون 26-06) · العربية الافتراضية · مراجعة المنتجات قبل النشر · عمولة 0% · الاستلام من المزرعة مفعّل · قاعدة بيانات **فارغة من البيانات التجارية**.

---

## 0. الخلاصة في سطرين

أُنشئت 43 جدولًا و22 نوعًا عدديًا في Postgres عبر **ترحيلات SQL حقيقية** (`drizzle/0000_init.sql` + `0001_extensions_and_integrity.sql`)، وبُذرت الجغرافيا الرسمية (**69 ولاية / 1541 بلدية / 538 دائرة**) والتصنيفات والأدوار والصلاحيات وطرق التسليم وإعدادات المنصة — **ولا يوجد مستخدم/متجر/منتج/طلب واحد**. ثم استُبدلت طبقة القراءة الفارغة بمستودع Drizzle حقيقي، فصارت الصفحات العامة تقرأ من القاعدة **دون تغيير أي واجهة**.

## 1. انحراف معماري معلن عن خطة المرحلة 1 (Prisma → Drizzle)

الخطة الأولى أشارت إلى Prisma. في هذه البيئة **تعذّر تشغيل Prisma نهائيًا**:

```
npx prisma -v
Error: request to https://binaries.prisma.sh/.../schema-engine.gz.sha256 failed
```

محرّك Prisma يُنزَّل من `binaries.prisma.sh` وهو محجوب هنا، فلا `generate` ولا `migrate` ممكنان. البديل المُعتمد والموثَّق في [`adr-0002-drizzle.md`](./adr-0002-drizzle.md): **Drizzle ORM 0.45.4 + drizzle-kit + pg 8** — ترحيلات SQL نصية مفتوحة (قابلة للمراجعة سطرًا سطرًا، نقطة قوة أمنية لا نقطة ضعف)، وعميل خفيف بلا محرّك ثنائي، ويعمل على Neon وVercel Edge/Node بلا مشاكل بناء.

## 2. المخطط: 43 جدولًا و22 نوعًا

| المجال | الجداول |
|---|---|
| الجغرافيا | `wilayas` (مفتاح طبيعي `code` بمنزلتين، الأصفار البادئة محفوظة) · `communes` (رمز 4 خانات + `daira_code` + دائرة/ولاية) |
| الهوية والصلاحيات | `users` · `user_profiles` · `oauth_accounts` · `sessions` · `auth_otp_codes` · `roles` · `permissions` · `role_permissions` · `user_roles` · `audit_logs` |
| المتاجر | `farmer_profiles` · `stores` · `store_verification_requests` · `store_documents` · `store_delivery_zones` |
| الكتالوج | `categories` (شجرة بـ `parent_id`) · `products` · `product_images` · `product_categories` · `inventory_items` · `inventory_movements` |
| التسليم | `delivery_methods` · `shipping_rates` (سعر وطني أو مسار ولاية→ولاية، بفهارس فريدة جزئية) |
| التجارة | `addresses` · `carts` · `cart_items` · `orders` · `seller_orders` (طلب فرعي لكل متجر) · `order_items` · `order_status_events` · `payments` · `idempotency_keys` |
| التفاعل | `reviews` (تقييم واحد لكل سطر طلب — قيد فريد) · `favorites` · `reports` · `disputes` · `dispute_messages` · `notifications` · `notification_preferences` |
| المنصة | `media_assets` · `platform_settings` |

**فرض القيود في القاعدة نفسها، لا في الكود فقط:**

- فهارس فريدة جزئية: `store_delivery_zones` و`shipping_rates` (وطنية مقابل مسار).
- `CHECK` على الأسعار والكميات الموجبة، وتماسك مجموع الطلب، وصيغة الهاتف الجزائري `^\+213[5-7][0-9]{8}$`، وصيغة الـ slug، وبريد بحروف صغيرة، وإلزام سبب الرفض/الإلغاء عند وجودها.
- `products` لقطة سعر واسم ووحدة داخل `order_items` (لا يتغير الطلب إذا عدّل المزارع سعره لاحقًا).
- لقطات أسماء المنتج/المتجر داخل الطلب، فحذف منتج لا يمحو تاريخ طلب.

### ترحيل ثانٍ مكتوب بيد (لا تستطيع drizzle-kit التعبير عنه)

`drizzle/0001_extensions_and_integrity.sql`:

1. `pgcrypto` + `pg_trgm` + `unaccent`.
2. `app_uuid_v7()` — توليد UUIDv7 داخل القاعدة + `DEFAULT` على كل عمود `id`، فالإدخال الخام (psql/سكربتات) لا يحتاج توليد معرّفات؛ والمعرّفات مرتبة زمنيًا فتبقى شجرة btree مضغوطة.
3. `audit_logs` **append-only على مستوى القاعدة**: أي `UPDATE`/`DELETE`/`TRUNCATE` يرفع استثناءً (`42501`). سجل التدقيق ليس نصيحة أخلاقية بل قيد تنفيذي.
4. `updated_at` يُدار بمُشغّل عام لكل جدول فيه هذا العمود (الكود يضبطه أيضًا، والقاعدة تضمنه).
5. `app_normalize()` (unaccent + lower) مع 7 فهارس GIN ثلاثية: بحث عربي/فرنسي **يتجاهل التشكيل والحركات والهمزات والعلامات**: `CÉRÉALES` = `cereales`.

> ملاحظة شفافية: `unaccent` مُعلَّم `STABLE` لأن القاموس قد يُعاد تحميله؛ الغلاف مُعلَّم `IMMUTABLE` كي يُفهرس، والافتراض الموثَّق أن القاموس لا يُعدَّل وقت التشغيل.

## 3. البذر (seed) — بيانات مرجعية فقط، وقابل لإعادة التشغيل

`npm run db:seed` → `src/server/db/seed/`:

| ما يُبذر | العدد | المصدر |
|---|---|---|
| الولايات | **69** | `algeria-geo` (MIT) المنقول عن الجريدة الرسمية |
| البلديات | **1541** | نفسه |
| التصنيفات | 8 | `src/config/catalog.ts` (نفس مصدر الواجهة) |
| الأدوار | 4 (buyer/farmer/admin/super_admin) | قرارات المرحلة 1 |
| الصلاحيات + المنح | 14 صلاحية / 26 منحًا (منها 3 صلاحيات حرجة) | نفسه |
| طرق التسليم | 3 (توصيل، نقطة استلام، استلام من المزرعة) | نفسه |
| إعدادات المنصة | 6 (عمولة 0%، COD فقط، مراجعة إلزامية، عربية افتراضية…) | نفسه |

- كل سطر `INSERT … ON CONFLICT DO UPDATE` → **إعادة التشغيل لا تُكرّر ولا تُفقد تعديلات المشرف** (الإعدادات `DO NOTHING` لأنها قابلة للتحرير).
- 11 ولاية جديدة من القانون 26-06 موسومة `is_new_wilaya` (59 أفلو … 69 الأبيض سيدي الشيخ).
- **بيانات Algiers:** المصدر لا يعطي دائرة لبلديات الجزائر الـ57، فالحقل `daira_code` **قابل لأن يكون NULL** — سجّلنا الفجوة كما هي بدل اختراع رموز.
- السكربت يفشل بصراحة إذا تغيّر عدد الولايات/البلديات في المصدر (حماية من انحدار البيانات).

## 4. مسار القراءة الحقيقي

- `src/server/catalog/drizzle-catalog.repository.ts` ينفّذ نفس الواجهة `CatalogRepository`:
  - `listPublishedProducts` — يُظهر فقط `product.status = published` من متجر `active` غير محذوف؛ بحث ثلاثي، فلترة بالتصنيف/الولاية/السعر الأقصى، ثلاث حالات فرز، ترقيم حقيقي مع `total` منفصل.
  - `findProductBySlug` — التفاصيل + المخزون + الصور + الحد الأدنى للطلب.
  - `findStoreBySlug` — المتجر + البلدية/الولاية بلغة الواجهة + منتجاته المنشورة + شارة التحقق من `farmer_profiles`.
  - `listCategories` — عدد المنتجات المنشورة فعليًا لكل تصنيف (0 عند الفراغ).
  - `listWilayas` — **69 ولاية بلغة الواجهة** لمُصفّي السوق.
- `src/server/container.ts` يختار التنفيذ: `DATABASE_URL` موجود → Drizzle، غائب → المستودع الفارغ (معاينة/تطوير بلا قاعدة) — الصفحات لا تعرف أيّهما.
- الصفحات تمرّر اللغة التي تعرفها أصلًا (`findProductBySlug(slug, locale)`) فتُعرض أسماء الولايات والبلديات بالعربية/الفرنسية/الإنجليزية، **والأسعار لا تتغير**.

## 5. نتائج التحقق — كل ما يلي نُفِّذ فعليًا

### 5.1 بوابات الجودة

| # | الأمر | النتيجة |
|---|---|---|
| 1 | `npm run lint` | ✅ 0 أخطاء / 0 تحذيرات |
| 2 | `npx tsc --noEmit` | ✅ نظيف (strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`) |
| 3 | `npm test` | ✅ **60 اختبارًا في 9 ملفات** (28 وحدة + 32 تكامل) |
| 4 | `npm run build` | ✅ بناء إنتاجي ناجح (35 صفحة ثابتة + المسارات الديناميكية) |
| 5 | `npm run check:images` | ✅ 4 صور موثّقة، WebP، ≤600KB، بلا EXIF |

### 5.2 مخطط القاعدة نفسه

```
$ npm run db:verify:local     # PGlite (Postgres 17 WASM) + ملفات الترحيل الحقيقية
Applying 2 migration file(s) to PGlite
  0000_init.sql … ok (213 statements)
  0001_extensions_and_integrity.sql … ok
✓ 43 application tables created      ✓ 22 enum types created
✓ every uuid id has a database default
✓ updated_at triggers installed      ✓ trigram search indexes installed
✓ app_normalize strips accents + case
✓ app_uuid_v7 returns a v7 uuid
✓ audit_logs rejects UPDATE          ✓ audit_logs rejects DELETE
✓ users.email must be lowercase      ✓ users.phone must be E.164 +213
✓ store slug format enforced
All schema checks passed.
```

### 5.3 على Postgres حقيقي عبر TCP بنفس سائق الإنتاج (`pg` + `drizzle-kit`)

```
$ npm run db:local                      # Postgres (PGlite) على 127.0.0.1:55432
$ npx drizzle-kit migrate               # [✓] migrations applied successfully!
$ npm run db:seed                       # geography: 69 wilayas, 1541 communes
                                        # categories: 8 · roles 4 · permissions 14
                                        # delivery methods: 3 · platform settings: 6
$ npm run db:verify                     # Database looks correct. (25 فحصًا كلها ✓)
$ ADMIN_EMAIL=admin@agridirect.dz npm run admin:create
  Created super admin admin@agridirect.dz   → ثم إعادة التشغيل:
  Promoted existing user admin@agridirect.dz to super_admin   (idempotent)
```

`db:verify` يفحص: 43 جدولًا، 22 نوعًا، افتراضي uuid لكل `id`، مُشغّل append-only، 3 امتدادات، أعداد المرجعيات (69/1541/8/4/14/3)، و**فراغ 13 جدولًا تجاريًا** (users, stores, products, orders, payments, reviews, disputes…). وهو يفشل فورًا بمجرد ظهور بيانات تجارية — أي أن وعد «القاعدة فارغة» **مُتحقَّق آليًا**.

### 5.4 اختبارات التكامل — 32 اختبارًا على محرّكين

`tests/integration/` (بذر، مستودع الكتالوج، كتالوج فارغ، عمليات):

- البذر: 69/1541، لا بلدية يتيمة، 11 ولاية جديدة، فجوة دوائر الجزائر = 57، 8 تصنيفات، 26 منحًا، **0 مستخدم/متجر/منتج/طلب**، **الاستدعاء مرتين لا يغيّر شيئًا**، وإعداد عدّله المشرف يبقى بعد إعادة البذر.
- المستودع: العدّ لكل تصنيف (المسودة لا تُحتسب)، الصورة الأساسية، تعريب اسم الولاية (سطيف/Sétif/Setif) بلا تغيير السعر، بحث `cereales` = `CÉRÉALES` = `ble-dur`، بحث باسم المتجر، فلترة التصنيف/الولاية/السعر، الفرز تصاعديًا وتنازليًا، الترقيم، تقييد حجم الصفحة في الـ use case، تفاصيل المنتج (مخزون 250، حد أدنى 1)، **إخفاء المسودات والـ slug المجهول و`' OR 1=1 --`**، منتجات المتجر، **تعليق المتجر يُخفي كل شيء ثم الرفع يعيده**.
- الكتالوج الفارغ: صفحة فارغة صحيحة، 8 تصنيفات بصفر منتجات، 69 ولاية، `null` للمنتج/المتجر غير الموجود.
- العمليات: تقرير `inspectDatabase` ينجح على قاعدة مبنية، **يفشل عند ظهور بيانات تجارية**، ويفشل عند غياب البيانات المرجعية؛ `ensureSuperAdmin` idempotent، يكتب سجل تدقيق، يرفض بريدًا غير صالح، ويرفض العمل قبل بذر الأدوار، **ولا يوجد عمود كلمة مرور في `users`**.

طريقتا التشغيل (كلتاهما نُفِّذتا):

```bash
npm run test:integration                                   # PGlite داخل العملية (9.7s)
TEST_DATABASE_URL=postgres://… DATABASE_SSL=disable \
  npm run test:integration                                 # نفس السويت على Postgres عبر TCP
```

### 5.5 تطبيق Next نفسه يقرأ من القاعدة

شُغّل `next dev` بـ `DATABASE_URL`، ثم أُدخل مزارع/متجر/منتج اختباري **في قاعدة محلية مؤقتة** وطُلب:

| الطلب | النتيجة |
|---|---|
| `/ar` `/fr` `/en` | 200 |
| `/fr/categories` | 200 — التصنيفات من القاعدة |
| `/fr/market` | 200 — 69 ولاية في المُصفّي (`Adrar … Sétif`) |
| `/fr/market?wilaya=19` | 200 — يظهر منتج سطيف |
| `/fr/market?wilaya=16` | 200 — لا شيء (تصفية حقيقية) |
| `/ar/market?q=TOMATE` | 200 — يطابق «Tomates grappe» |
| `/fr/product/tomates-grappe` | 200 — الاسم، الوصف، **«120 DA»**، «Disponible 250»، البلدية «Sétif» بلغة الواجهة، صورة `alt="Tomates"`، meta description من القاعدة |
| `/ar/store/ferme-hauts-plateaux` | 200 |
| `/ar/product/nope` | **404** |

ثم حُذفت بيانات العرض وأُعيد `db:verify` إلى «Database looks correct».

## 6. حدود وأمانة تقنية

1. **لم يُشغَّل شيء على Neon بعد**: لا يوجد `DATABASE_URL` في مساحة العمل، ولم يُخترع. كل ما سبق نُفِّذ على محرّك Postgres 17 نفسه، لكن **قاعدتك في Neon لم تُلمس**. الخطوات جاهزة في §7.
2. **سعة الاتصال المحلية**: خادم Postgres المحلي يخدم عميلًا واحدًا، لذا `npm run db:local` يتطلب `DATABASE_SSL=disable DATABASE_POOL_MAX=1`. Neon لا يعاني هذا القيد (الافتراضي 5).
3. **اسم المنتج بلغة واحدة حاليًا**: `products.name/description` نص واحد يكتبه المزارع. تعريب المحتوى الذي يكتبه البائع يحتاج جدول ترجمات — مؤجَّل بقرار، وليس مخفيًا.
4. **فجوة دوائر الجزائر** في المصدر (57 بلدية) محفوظة كـ NULL.
5. `db:verify` يقبل `VERIFY_ALLOW_BOOTSTRAP=1` لتجاوز مستخدم المشرف الوحيد بعد التهيئة.

## 7. ما تحتاجه منّي الآن (خطوتان)

```bash
# 1. في Neon: انسخ Connection String (Pooled) والصقه في .env.local
DATABASE_URL=postgresql://…-pooler…neon.tech/neondb?sslmode=require

# 2. نفّذ الأربعة بالترتيب
npx drizzle-kit migrate      # ينشئ 43 جدولًا + الامتدادات + المُشغّلات
npm run db:seed              # 69 ولاية · 1541 بلدية · 8 تصنيفات · الأدوار
npm run db:verify            # يجب أن يطبع: Database looks correct.
ADMIN_EMAIL=بريدك npm run admin:create   # مشرف عام واحد، بسجل تدقيق
```

بمجرد وصول `DATABASE_URL` أُشغّل هذه الأوامر بنفسي على Neon وأُرفق ناتجها الحقيقي هنا، ثم ننتقل للمرحلة 4 (Google OAuth + OTP مُهشَّر + الجلسات).

## 8. خريطة الملفات

```
drizzle/0000_init.sql                 43 جدولًا · 22 enum · قيود CHECK وفهارس جزئية
drizzle/0001_extensions_and_integrity.sql  امتدادات · UUIDv7 · append-only · بحث ثلاثي
src/server/db/schema/*.ts              تعريف Drizzle مقسّم بالمجال (8 ملفات)
src/server/db/client.ts                مجمّع pg واحد + SSL + Drizzle (casing: snake_case)
src/server/db/{admin,verify,types}.ts   تهيئة المشرف · فحص القاعدة · نوع مشترك
src/server/db/seed/{index,geography,reference}.ts   بذر idempotent
src/server/catalog/drizzle-catalog.repository.ts    مسار القراءة الحقيقي
scripts/{verify-schema-local,verify-empty,create-admin,dev-postgres,check-images}.ts
tests/integration/                     32 اختبارًا على Postgres حقيقي
docs/phase-3/adr-0002-drizzle.md       قرار ORM والبديل المرفوض
```
