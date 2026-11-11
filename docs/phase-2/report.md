# المرحلة 2 — الأساس، نظام التصميم، والواجهات العامة

**التاريخ:** 2026-11-11 · **الفرع:** `arena/849be64d-book` · **الحالة:** مكتملة، مع نتائج تحقق فعلية أدناه
**قرارات معتمدة منك:** 69 ولاية (القانون 26-06) · العربية الافتراضية + الفرنسية والإنجليزية · مراجعة المنتجات قبل النشر · عمولة 0% عند الإطلاق · الاستلام من المزرعة مفعّل.

---

## 1. ما تم بناؤه فعليًا

| المجال | المنجز |
|---|---|
| الأساس | Next.js 16.4.6 (App Router + Turbopack) · React 19.3.1 · TypeScript 5.9.3 strict · Tailwind CSS 4.3.5 |
| نظام التصميم | رموز ألوان الهوية في `@theme`، خطوط محلية، نصف قطر/ظلال/حركة، مكوّنات `ui/*` (Button, Card, Field, Badge, EmptyState, ErrorState, Skeleton, Pagination, Price, ProductCard, CategoryCard, Notice) |
| الهوية | شعار SVG مرسوم (سنبلة + ورقة، بلا كائنات حيّة)، أيقونات Lucide خطية، ألوان `#244A35 / #6B9A62 / #D9E5CF / #F5F0E5 / #1F2D24` |
| التعددية اللغوية | `next-intl` 4.15، مسارات `/{locale}`، `ar` (RTL افتراضي) · `fr` · `en`، 3 ملفات ترجمة كاملة (≈180 مفتاحًا)، `hreflang`، تنسيق أسعار/تواريخ بـ `Intl` |
| الصفحات العامة | الرئيسية، السوق (بحث + فلاتر + فرز + ترقيم)، التصنيفات، صفحة تصنيف، صفحة منتج، صفحة متجر، من نحن، التواصل، الأسئلة الشائعة، انضم كمزارع، الخصوصية، الشروط، الدخول، 404، خطأ |
| الحالات | `loading.tsx` للسوق، `error.tsx`، `not-found.tsx`، Empty State حقيقية، Skeleton، Notice للحالات غير المفعّلة |
| الصور | 4 صور فوتوغرافية حقيقية من Unsplash (بلا أشخاص/حيوانات) محوّلة إلى WebP ومسجّلة في [`asset-licenses.md`](../asset-licenses.md) |
| طبقة البيانات | `CatalogRepository` + تنفيذ فارغ صريح (`emptyCatalogRepository`) + Use Case يتحقق من مدخلات URL؛ جاهزة للاستبدال بـ Prisma في المرحلة 3 |
| الحماية | Security Headers + CSP، `noindex` لصفحة الدخول، تنقية معاملات البحث، عدم كشف أي سر في العميل |
| CI | `.github/workflows/ci.yml`: lint → typecheck → tests → build → `npm audit` |

### ما لم يُبنَ بعد (مقصود وموثّق)
المصادقة، قاعدة البيانات، السلة، الـ Checkout، لوحات المزارع/الإدارة، رفع الصور، الإشعارات، التقييمات.
**بدلًا من عرض واجهات وهمية:** صفحة الدخول تُظهر الأزرار **معطّلة** مع سبب صريح، ونموذج التواصل معطّل مع سبب، والسوق/الرئيسية تعرضان حالة فراغ صادقة («لا توجد منتجات بعد»).

---

## 2. نتائج التحقق (مُشغَّلة فعليًا)

| # | الأمر / الفحص | النتيجة |
|---|---|---|
| 1 | `npx tsc --noEmit` | ✅ بلا أخطاء (strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`) |
| 2 | `npx eslint .` | ✅ بلا أخطاء ولا تحذيرات |
| 3 | `npx vitest run` | ✅ **28 اختبارًا ناجحًا / 5 ملفات** (وحدة) |
| 4 | `npx next build` | ✅ نجح — 20 مسارًا (SSG للصفحات العامة × 3 لغات، dynamic للسوق/المنتج/المتجر) |
| 5 | `GET /` | 307 → توجيه تلقائي إلى اللغة (locale detection) |
| 6 | `GET /ar` `/fr` `/en` | 200، `<html lang="ar" dir="rtl">` و `<html lang="fr" dir="ltr">` مؤكدان |
| 7 | `GET /ar/product/abc` · `/ar/store/xyz` · `/ar/category/nope` | **404** فعلي |
| 8 | `GET /ar/market?category=dates` | 200 مع حالة فراغ صحيحة |
| 9 | رؤوس الأمان | CSP + HSTS + nosniff + Referrer-Policy + X-Frame-Options + Permissions-Policy موجودة |
| 10 | الخطوط | 6 `@font-face` محلية (Tajawal 400/500/700 عربي، Inter 400/500/600 لاتيني)، تُخدم من `/_next/static/media` |
| 11 | الصور | `/_next/image` يولّد 9 أحجام WebP؛ الملف الأصلي 200 `image/webp` |
| 12 | فحص HTML | الشعار، القائمة، البحث، مبدّل اللغة (SSR)، التذييل، نصوص الترجمة — كلها في الـ HTML الأولي |

**ما لم أفعله:** لا توجد لقطات شاشة أو اختبار متصفح حقيقي (لا يوجد headless browser في هذه البيئة)، ولا فحص axe آلي. المراجعة البصرية عليك عبر المعاينة الحيّة، وسأضيف Playwright + axe في المرحلة 6.

---

## 3. قرارات ومكتشفات هندسية (موثّقة لأنها غيّرت التنفيذ)

1. **الخطوط محليّة لا عبر Google Fonts.** شبكة البناء تحجب `fonts.googleapis.com`، والحل الصحيح هندسيًا هو `@fontsource/tajawal` و `@fontsource/inter` (ملفات woff2 داخل الحزمة): لا طلب خارجي، لا CLS، خصوصية أفضل، واستقلال عن المزوّد.
2. **الصور: جودة حقيقية + ترخيص موثّق.** حُجبت `images.unsplash.com` مباشرة، فاستخدمت البحث لجلب الصور مع **رابط صفحة المصدر**، ثم تحققت بصريًا من كل صورة (بلا أشخاص/حيوانات)، وحوّلتها بـ `sharp` (1600px، WebP q78، إزالة EXIF)، وسجّلتها في `docs/asset-licenses.md`. **رُفضت** نتائج من Dreamstime (غير مجانية) ونتيجة موسومة صراحة «AI generated».
3. **لا بيانات تجريبية إطلاقًا.** `emptyCatalogRepository` يُرجع فراغًا حقيقيًا، والاختبارات تؤكد أنه لا يوجد أي منتج/متجر/تقييم. التصنيفات الثمانية في `src/config/catalog.ts` هي **تهيئة نظام** يُبذرها seed المرحلة 3 نفسه، ليست بيانات وهمية.
4. **مشكلة 404 المكتشفة والمصلحة:** وجود `app/[locale]/loading.tsx` ينشئ حدّ Suspense يُفلش الهيكل بحالة 200 قبل تنفيذ `notFound()`، فكانت صفحة منتج غير موجود تُرجع **200**. بعد إزالة هذا الملف (وإبقاء loading خاص بالسوق فقط) صارت الاستجابة **404** في الإنتاج. أُبقيت ملاحظة في الكود تشرح السبب لتجنب تكرار الخطأ.
5. **تحصين مدخلات URL:** `parseMarketSearchParams` يقصّ النص إلى 80 حرفًا، يتجاهل `sort` غير المعروف، يرفض الأسعار غير الموجبة، ويثبّت `pageSize` في الخادم. 8 اختبارات وحدة تغطي هذه الحالات (منع أي تمرير خام إلى قاعدة البيانات لاحقًا).
6. **i18n مُتحقَّق آليًا:** تعريف `AppConfig` بنوع الرسائل يعطي تحققًا وقت الكتابة، واختبار Parity يضمن تطابق المفاتيح بين `ar/fr/en` وعدم وجود نص فارغ أو اختلاف في متغيّرات ICU.
7. **مبدّل اللغة يُصيَّر على الخادم:** أُزيل `useSearchParams` (الذي كان يفرض fallback) واستُبدل بقراءة `window.location.search` داخل معالج الحدث فقط.
8. **أزرار غير كاذبة:** كل ما هو غير منفّذ يظهر معطّلًا مع سبب (الدخول، نموذج التواصل، إضافة للسلة، فلتر الولاية). لا زر «يعمل» بلا نتيجة.

---

## 4. هيكل ما أُضيف

```
src/
├─ app/[locale]/{page,market,categories,category,product,store,about,contact,faq,join-farmer,login,legal,error,not-found}.tsx
├─ app/{robots.ts,sitemap.ts,icon.svg}
├─ components/{ui,layout,home,market}/
├─ config/{site.ts,catalog.ts}
├─ i18n/{routing.ts,navigation.ts,request.ts,messages/{ar,fr,en}.json}
├─ lib/{format.ts,direction.ts,cn.ts,page-metadata.ts,i18n-helpers.ts}
├─ server/{container.ts,catalog/{types,catalog.repository,empty-catalog.repository,use-cases}.ts}
├─ styles/globals.css
├─ middleware.ts
└─ global.d.ts
tests/unit/{format,i18n-parity,catalog,direction,catalog-taxonomy}.test.ts
```

---

## 5. القيود والمخاطر المتبقية لهذه المرحلة

| # | القيد | الأثر | المعالجة |
|---|---|---|---|
| 1 | لا قاعدة بيانات بعد | الصفحات تعرض فراغًا حقيقيًا | المرحلة 3 (Neon + Prisma) |
| 2 | لا مصادقة | لا سلة/طلبات/لوحات | المرحلة 4 |
| 3 | CSP تسمح بـ `unsafe-inline` للسكربتات | حماية أقل من المستهدف | nonce في المرحلة 4 بعد إزالة السكربتات المضمّنة |
| 4 | لا اختبار متصفح/وصول آلي | مخاطر تخطيط أو a11y غير مكتشفة | Playwright + axe في المرحلة 6 |
| 5 | الصور التحريرية 4 فقط | تغطية بصرية محدودة | تُوسَّع عند إضافة صور مرخّصة إضافية (بلا AI) |
| 6 | `APP_URL` افتراضي `localhost` | روابط canonical/sitemap خاطئة في الإنتاج | يُضبط في Vercel Env (المرحلة 7) |

---

## 6. الخطوة التالية — المرحلة 3 (قاعدة البيانات والطبقات)

1. مشروع Neon + فرع `dev` + Pooler، وضبط `DATABASE_URL`/`DIRECT_URL` (بيانات الاعتماد تبقى خارج المستودع).
2. `prisma/schema.prisma` كاملًا حسب `docs/phase-1/02-data-model.md` (UUID v7، enums، علاقات، فهارس، soft delete).
3. أول migration + قيود `CHECK` وفهارس GIN عبر SQL خام + `REVOKE` على `audit_logs`.
4. طبقة Repositories + `PrismaCatalogRepository` واستبدالها في `container.ts` (دون تغيير أي صفحة).
5. بذور مرجعية idempotent: **69 ولاية + 1541 بلدية** + التصنيفات الثمانية + طرق التوصيل + الإعدادات.
6. `scripts/verify-empty.ts` لإثبات خلّو بيانات النشاط التجاري، و`scripts/create-admin.ts` بدون أي بيانات اعتماد مسبقة.
7. اختبارات تكامل على فرع Neon معزول.

**ما أحتاجه منك للبدء:** رابط اتصال Neon (Pooled + Direct) عبر إعدادات المشروع/env، أو إنشاء المشروع وربطه. لن أختلق أي بيانات اعتماد ولن أطلب أسرارًا في المحادثة.
