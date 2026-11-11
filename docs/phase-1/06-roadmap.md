# 06 — خطة التنفيذ المرحلية (قابلة للاختبار)

> قاعدة الانتقال: **لا مرحلة تُعدّ منتهية إلا إذا شُغّلت اختباراتها ورأينا نتيجتها.** كل مرحلة تنتهي بـ «بوابة خروج» (Exit Gate) مكتوبة، وإن فشلت لا ننتقل.

---

## 1. نظرة عامة على المراحل

| المرحلة | الموضوع | المخرجات الرئيسية | بوابة الخروج |
|---|---|---|---|
| **1** | التحليل والتخطيط | مستندات `docs/phase-1/*` | اعتمادك للخطة (الحالية) |
| **2** | الأساس + Design System + الواجهات العامة | مشروع يعمل، Tokens، Header/Footer، الرئيسية، السوق، المنتج، المتجر، الصفحات الثابتة، i18n/RTL | Build + Lint + Typecheck أخضر، جولة بصرية بـ `ar`/`fr`، لا أزرار كاذبة |
| **3** | قاعدة البيانات + الطبقات | Prisma schema + migrations + بذور مرجعية + repositories + use-cases أساس + DTO | `migrate deploy` على فرع Neon، استعلامات السوق تعمل على DB فارغة، اختبارات وحدات للـ domain |
| **4** | المصادقة والأمان | Google + OTP + جلسات + RBAC + Rate limit + Audit + Headers + رفع آمن | اختبارات المصادقة والصلاحيات ورفض الوصول خضراء |
| **5** | وظائف المنصة | متجر، منتجات، مخزون، سلة، checkout متعدد المزارعين، COD، توصيل، إشعارات، تقييمات، نزاعات، تقارير، لوحات ثلاث | E2E للرحلات الثلاث + اختبارات تكامل للمخزون والحالات |
| **6** | الاختبار الشامل | Unit/Integration/E2E/Security + إصلاح + تدقيق وصول | تقرير اختبار فعلي (عدد، نجاح، فشل، متبقٍ) |
| **7** | النشر | GitHub/Vercel/Neon + Env + migrations إنتاجية + اختبار Production + Runbook | فحص Post-Deploy أخضر + استعادة احتياطية مجرّبة |

**تقدير الحجم:** المراحل 2–5 هي الجزء الأكبر. سأعمل شريحة رأسية (vertical slice) قابلة للتشغيل في كل مرة، وأعرض نتائج فعلية بعد كل شريحة، لا «ملفات كثيرة بلا تشغيل».

---

## 2. المرحلة 2 — الأساس والتصميم والواجهات العامة

### المهام
1. تهيئة المشروع: `package.json` (إصدارات مثبتة)، `tsconfig` strict، ESLint 9 flat، Prettier، `next.config.ts`، `postcss`، `pnpm-lock`.
2. `tokens.css` + `globals.css`: ألوان الهوية، الخطوط (Tajawal/Inter)، المقياس الطباعي، الظلال، الزوايا.
3. مكوّنات `src/components/ui/*` الأساسية + `feedback/*` (Skeleton/Empty/Error) + `ProductCard`/`Price`/`Badge`/`Pagination`.
4. `src/i18n/*`: routing (ar/fr/en)، `messages/*.json`، `LocaleSwitcher`، `dir` من الخادم، تنسيق العملات والتواريخ.
5. Layout عام: Header (شعار، بحث، تصنيفات، سلة، حساب)، Footer (سياسات، تواصل)، Mobile nav/drawer.
6. الصفحات: `/` (بحالة فراغ حقيقية عند غياب البيانات)، `/market` (فلاتر وPagination بواجهة تعمل على بيانات حقيقية لاحقًا)، `/category/[slug]`، `/product/[slug]`، `/store/[slug]`، `/about`، `/contact`، `/faq`، `/legal/privacy`، `/legal/terms`، `/join-farmer`.
7. صور تحريرية: تنزيل صور حقيقية مرخّصة للـ Hero/التصنيفات فقط + `docs/asset-licenses.md` + `next.config` `remotePatterns`. **لا صور مولَّدة ولا كائنات حيّة.**
8. `loading.tsx` / `error.tsx` / `not-found.tsx` لكل مجموعة مسارات.
9. سكربتات: `verify-i18n`, `check-images`.

### الملفات الأبرز
`src/app/[locale]/**`, `src/components/{ui,layout,product,feedback}/**`, `src/styles/*`, `src/i18n/**`, `src/lib/format*.ts`, `next.config.ts`, `docs/asset-licenses.md`, `tests/e2e/public.spec.ts`, `tests/unit/format.spec.ts`.

### الاختبارات
- Unit: تنسيق السعر/التاريخ لكل لغة، منطق `dir`، منطق التصنيفات الشجرية.
- E2E: تحميل الرئيسية/السوق/المنتج بلغتين، تبديل اللغة يحفظ المسار، تنقّل بلوحة المفاتيح، حالات الفراغ.
- يدوي: مراجعة بصرية RTL/LTR + تباين + موبايل.

### بوابة الخروج
`pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test` خضراء + لقطات شاشة للصفحات. المتغيرات الخارجية غير مطلوبة في هذه المرحلة.

---

## 3. المرحلة 3 — قاعدة البيانات والطبقات

### المهام
1. Neon: مشروع + فرع `dev` + Pooler؛ `DATABASE_URL`/`DIRECT_URL` في `.env.local` (غير ملتزَم).
2. `prisma/schema.prisma` كاملًا حسب `02-data-model.md` (UUID v7، enums، علاقات، unique، soft delete).
3. Migration أولى + ملف SQL خام للقيود (CHECK) والفهارس (GIN/partial) و`REVOKE` على `audit_logs`.
4. `src/server/db/client.ts` (singleton) + `transaction.ts` + `statement_timeout`.
5. Repositories: users, stores, products, categories, inventory, carts, orders, reviews — بدوال مقيّدة بالمالك.
6. Domain نقي + اختبارات: `money.ts`, `pricing.ts`, `order-state-machine.ts`, `inventory-policy.ts`.
7. بذور مرجعية idempotent: الولايات + البلديات + التصنيفات + طرق التوصيل + الإعدادات. `verify-empty` لتأكيد خلّو بيانات النشاط.
8. `scripts/create-admin.ts` (بدون أي بيانات اعتماد مسبقة في الكود).

### الاختبارات
- Unit للـ domain (≈15 حالة: تقريب الأموال، الحد الأدنى للطلب، انتقالات الحالة المسموحة/المرفوضة، سياسة المخزون).
- Integration (على فرع Neon اختباري معزول): CRUD، قيود uniqueness، استعلامات السوق على قاعدة فارغة، أداء فهارس أساسي.

### بوابة الخروج
`prisma migrate deploy` ناجح على فرع نظيف + `pnpm test:integration` أخضر + `verify-empty` يؤكد صفر بيانات تجارية.

---

## 4. المرحلة 4 — المصادقة والأمان

### المهام
1. Better Auth: Prisma adapter، Google Provider، Email OTP (جدولنا المُهشَّر + محاولات + تهدئة)، `trustedOrigins`.
2. `src/server/auth/session.ts` + `getSession` مُخزَّن لكل طلب + `requireUser`.
3. RBAC: كتالوج الصلاحيات كمصدر واحد (`src/config/permissions.ts`) يُبذر في DB، `requirePermission`, `assertOwnership`, `requireStoreActive`.
4. Rate limiting (Upstash أو fallback Postgres) على مسارات المصادقة والكتابة.
5. Security headers + CSP nonce في middleware، منع الفهرسة للصفحات الخاصة.
6. رفع آمن: token → Blob → finalize + Magic bytes + حدود.
7. Audit log helper + تنقيح الحقول + `authorization.denied`.
8. صفحات: `/login`, `/verify`, تسجيل الخروج، `/account/sessions`، إبطال كل الأجهزة.

### الاختبارات
- Integration: طلب OTP، تحقق صحيح/خاطئ، انتهاء الصلاحية، إعادة استخدام، تجاوز المحاولات، Google callback (بمحاكاة IdP)، إبطال الجلسة، تعليق الحساب.
- Security: جدول `03-rbac.md §8` كاملًا (13 حالة).
- E2E: دخول OTP كامل، خروج من كل الأجهزة.

### بوابة الخروج
كل اختبارات المصادقة/الصلاحيات خضراء + محاولة الوصول إلى `/admin` بدور مشترٍ تفشل من الخادم + رؤوس الأمان مؤكدة على Preview.

### ما أحتاجه منك في هذه المرحلة
- **Google Cloud OAuth Client** (`GOOGLE_CLIENT_ID/SECRET` + redirect URIs).
- **Resend API Key** + بريد مُتحقَّق للنطاق (أو SMTP بديل).
- **Upstash Redis** (اختياري؛ بدونه نستخدم الـ fallback).
- **Neon** مشروع قاعدة البيانات.
> لن أختلق أي بيانات اعتماد؛ حتى تُربط، أعمل بمسار تطوير معطّل بخيار "OTP يُطبع في سجل التطوير فقط" **خلف feature flag لا يعمل في الإنتاج**، أو أتوقف عند هذا الحد.

---

## 5. المرحلة 5 — وظائف المنصة (شرائح رأسية)

| الشريحة | ما يُبنى | اختبار الخروج |
|---|---|---|
| 5.1 المتجر والتحقق | `/farmer/apply`, إعداد المتجر، رفع الشعار/الغلاف، إرسال التحقق، لوحة الإدارة للمراجعة | مزارع ينشئ متجرًا ⇒ يظهر في `/admin/verifications` ⇒ قبول ⇒ `active` + إشعار |
| 5.2 المنتجات | إنشاء/تعديل/أرشفة، صور، تصنيف، وحدة، حد أدنى، أوضاع المراجعة، فلاتر الإدارة | منتج جديد ⇒ `pending_review` ⇒ قبول ⇒ يظهر في السوق؛ مزارع آخر لا يستطيع تعديله (404) |
| 5.3 المخزون | `inventory_items` + حركات + تنبيه انخفاض + `out_of_stock` آلي | تعديل كمية ⇒ حركة مسجّلة؛ بيع آخر قطعة بالتوازي ⇒ لا Overselling |
| 5.4 السلة | إضافة/تعديل/حذف، تجميع حسب المتجر، تحقق مخزون حي، حد أدنى | تغيير المخزون بعد الإضافة يُنبّه ويمنع الطلب |
| 5.5 Checkout COD | العنوان، الولاية/البلدية، التوصيل لكل متجر، ملخص، Idempotency، تقسيم الطلبات | سلة من متجرين ⇒ `orders` واحد + `seller_orders` اثنان + مخزون صحيح؛ إعادة إرسال ⇒ طلب واحد فقط |
| 5.6 إدارة المزارع للطلبات | قبول/رفض/تجهيز/شحن/تسليم + Timeline + إشعارات | انتقال غير مسموح يُرفض (409/403) ورسالة مفهومة |
| 5.7 الإلغاء والنزاعات | إلغاء وفق الحالة + إرجاع مخزون + فتح نزاع + رسائل + قرار إداري | إلغاء يعيد المخزون بدقة؛ نزاع لا يُغلق إلا بقرار موثّق |
| 5.8 التقييمات | تقييم بعد تسليم + واحد لكل سطر + إخفاء إداري | كل حالات `04-ux-i18n-flows.md §2.4` مغطّاة باختبارات |
| 5.9 الإشعارات | داخل التطبيق + بريد للحدث الحرج + تفضيلات + عدّاد غير المقروء | إشعار لكل طرف عند الحدث الصحيح فقط |
| 5.10 لوحة الإدارة | مستخدمون، مزارعون، منتجات، طلبات، تصنيفات، جغرافيا، توصيل، بلاغات، نزاعات، تدقيق، إعدادات، مشرفون | كل رقم في اللوحة يأتي من استعلام DB (اختبار يقارن العدّاد بالاستعلام) |
| 5.11 التقارير | مبيعات/طلبات/مزارعون/منتجات/ولايات/نمو بفترات + تصدير CSV | تقرير شهر معروف البيانات يطابق الحساب اليدوي |
| 5.12 الملف الشخصي والجلسات | بيانات، عناوين، مفضلة، إشعارات، جلسات | كل تعديل يخص صاحبه فقط |

**قاعدة:** كل شريحة تُسلّم مع: Validation (Zod) + Guard + Audit إن حسّاس + ترجمة `ar/fr/en` + حالات Loading/Empty/Error + اختبارات.

---

## 6. المرحلة 6 — الاختبار وضمان الجودة

| النوع | الأداة | التغطية المستهدفة |
|---|---|---|
| Unit | Vitest | Money، التسعير، التوصيل، آلة الحالات، الصلاحيات، التنسيق، المخزون |
| Integration | Vitest + Neon فرع اختباري | 14 حالة مذكورة في `03-rbac.md` و`05-security.md` + دورة الطلب كاملة |
| E2E | Playwright | 3 رحلات: مشتري (بحث→تسليم→تقييم)، مزارع (تسجيل→متجر→منتج→طلب)، إدارة (مراجعة مزارع+منتج+تدخل) |
| Security | Vitest + Playwright | IDOR، تجاوز أدوار، تلاعب بالأسعار، OTP، رفع ملفات، تجاوز حدود المعدل |
| A11y | axe في Playwright + يدوي | التدفقات الحرجة بلغتين |
| Performance | Lighthouse + استعلامات `EXPLAIN` | LCP ≤ 2.5s على 4G، لا N+1، Pagination إلزامية |

**التقرير:** جدول فعلي بعدد الاختبارات ونتائجها وأي فشل متبقٍ بأسبابه. لا ادعاء نجاح بدون مخرجات.

---

## 7. المرحلة 7 — النشر (GitHub → Vercel → Neon)

1. **GitHub:** فرع `main` محمي، PR إلزامي، CI (lint/typecheck/test/build)، Conventional Commits، `CODEOWNERS`، `SECURITY.md`.
2. **Neon:** مشروع `production` + فرع `preview` لكل PR (اختياري)، Pooler، فرض SSL، نسخة احتياطية قبل migrate.
3. **Vercel:** مشروع متصل بالـ repo، بيئات Production/Preview/Development منفصلة، متغيرات مشفّرة، Node runtime، دومين + HTTPS.
4. **Migrations:** `prisma migrate deploy` في خطوة منفصلة قبل النشر، مع مراجعة يدوية لأي تغيير هدّام.
5. **اختبار Production:** فحص رؤوس، OTP حقيقي، رفع صورة، إنشاء طلب COD من حساب اختباري **يُحذف/يُؤرشف بعد الاختبار** (لا بيانات وهمية دائمة)، Rollback مجرّب.
6. **Runbook:** نشر، تراجع، استعادة، تدوير أسرار، إضافة ولاية/تصنيف، معالجة نزاع، تعليق متجر.
7. **ما أحتاجه:** تفعيل تكامل **Vercel** (هو متوقف حاليًا في هذه الجلسة) + بيانات Neon/Vercel/Google/Resend/BloB في لوحة المزود — لا تُرسل أسرارًا في المحادثة.

---

## 8. سير العمل في Git

- فروع: `main` (محمي) → `feat/<scope>` → PR مع وصف وقيود الاختبار.
- Commits بصيغة Conventional: `feat(catalog): add product publish policy`.
- PR Template يتضمن: ماذا، لماذا، كيف اختُبر، أثر أمني، أثر على DB، لقطات.
- لا `--force` على `main`، ولا أسرار، ولا ملفات `.env`.
- أنا أعمل على الفرع الحالي `arena/849be64d-book` وأدفع إليه فقط.

---

## 9. متغيرات البيئة (أسماء فقط — تُوثَّق في `.env.example`)

```env
# Database (Neon)
DATABASE_URL=            # pooled
DIRECT_URL=              # direct, for migrations

# Auth
BETTER_AUTH_URL=
BETTER_AUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
OTP_HASH_PEPPER=

# Email
RESEND_API_KEY=
EMAIL_FROM=

# Media
BLOB_READ_WRITE_TOKEN=

# Rate limiting (optional in dev)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Observability (optional)
SENTRY_DSN=

# Runtime
NODE_ENV=
APP_URL=
```

---

## 10. Definition of Done لأي شريحة
- [ ] الكود يبنى ويمر `typecheck` و`lint` بلا تحذيرات جديدة.
- [ ] Validation على الخادم (Zod) + رسائل مترجمة.
- [ ] Guard صلاحية + فحص ملكية في الاستعلام.
- [ ] Audit إن كان الإجراء حسّاسًا، مع سبب.
- [ ] لا بيانات ثابتة بدل DB، ولا أزرار بلا وظيفة.
- [ ] حالات Loading/Empty/Error/Success.
- [ ] ترجمة `ar/fr/en` + `dir` صحيح + فحص وصول أساسي.
- [ ] اختبارات الوحدة/التكامل/الـ E2E الخاصة بالشريحة مكتوبة و**مُشغّلة**.
- [ ] تحديث المستندات ذات الصلة (`docs/`).

---

## 11. القرارات المفتوحة المطلوب اعتمادها قبل المرحلة 2

| # | السؤال | توصيتي | الأثر إن تغيّر |
|---|---|---|---|
| 1 | **عدد الولايات**: وصفك يقول 69، والتقسيم الرسمي 58 ولاية + 1541 بلدية | نبذر 58 رسميًا (قابل للتوسع كبيانات) | تغيير ملف البذور فقط، لا الكود |
| 2 | لغة الواجهة الافتراضية | **العربية (RTL)** مع الفرنسية جاهزة والإنجليزية خلف Flag | تغيير `defaultLocale` وإعداد التوجيه |
| 3 | وضع مراجعة المنتجات عند الإطلاق | `review` (مراجعة قبل النشر) | إعداد `product_moderation_mode` |
| 4 | رسوم المنصة (عمولة) | **0%** عند الإطلاق، قابلة للضبط | حقل `platform_fee_rate` + عرض منفصل في المبيعات |
| 5 | تخزين الصور | **Vercel Blob** | بديل Cloudinary يغيّر مزود التخزين فقط |
| 6 | مشغّل البريد | Resend | بديل SMTP لا يغيّر البنية |
| 7 | هل تريد إتاحة «الاستلام من المزرعة» في v1؟ | نعم (مفعّل افتراضيًا وقابل للإيقاف لكل متجر) | يضيف عنوان الاستلام وخيارًا في الـ checkout |

> **لا أبدأ المرحلة 2 قبل موافقتك.** الموافقة تعني: «اعتمدت المعمارية والمخطط والصلاحيات والتدفقات، انتقل إلى المرحلة 2».
