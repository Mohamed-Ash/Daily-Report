# n8n — Generate Dashboard

الكود اللي بيولّد التقرير اليومي مش موجود في الـ repo — هو جوه n8n نفسه.
المجلد ده نسخة منه تحت version control، عشان نعرف مين غيّر إيه وامتى.

## الملفات

| الملف | إيه هو |
|---|---|
| `generate-dashboard.js` | نسخة من كود node "Generate Dashboard" — **الأسرار مستبدلة بـ placeholders** |
| `HANDOVER.md` | كل حاجة محتاجة تستلمها مع المشروع (حسابات، صلاحيات، قواعد شغل) |

## أين يعمل الكود فعليًا

- **n8n:** `https://n8n-automation.ellwaa.com`
- **Workflow:** `EL LWAA - Law Firm Dashboard` — ID `4OJnvS68f0N8WhWP`
- **Node:** `Generate Dashboard` (id: `code-1`) — نوعه Function (النسخة القديمة، مش Code)
- **Triggers:** Schedule Trigger (2 م / 5 م بتوقيت القاهرة) + Manual Webhook

⚠️ **n8n instance مشتركة** — ماتلمسش أي workflow تاني غير `4OJnvS68f0N8WhWP`.

## طريقة التعديل (مهمة)

الكود بيعيش في n8n، والملف هنا نسخة للمراجعة. الترتيب الصح:

1. عدّل `generate-dashboard.js` هنا
2. `git commit` برسالة بتوضح التغيير
3. انسخ الكود، **بدّل الـ placeholders بالقيم الحقيقية**، والصقه في n8n
4. اعمل Execute step للتجربة، وشوف `ok` و `salesArchiveErr` في الـ output
5. اعمل **Publish** — من غير ده الجدولة هتفضل شغالة على النسخة القديمة

### الـ placeholders اللي لازم تتملى قبل اللصق في n8n

```
<<GITHUB_TOKEN>>          توكن GitHub (classic PAT) — له تاريخ انتهاء!
<<ZOHO_CLIENT_ID>>        من Zoho API Console
<<ZOHO_CLIENT_SECRET>>    من Zoho API Console
<<ZOHO_REFRESH_TOKEN>>    refresh token دائم
<<MS_PASSWORD>>           باسورد ameeremad@01ly6.onmicrosoft.com
```

> الأفضل على المدى الطويل: تنقل دول لـ **n8n Credentials** بدل ما يكونوا في الكود.
> الـ repo ده **public** — أي سر يتكتب فيه بيتنشر على الإنترنت.

## اللي الكود بيعمله كل تشغيل

```
1. يقرا task_cache.json من GitHub (كاش عشان يقلل نداءات Zoho)
2. يجيب المشاريع من Zoho (3 نداءات: active / on_hold / completed)
3. لكل مشروع Active: يجيب milestones + tasks ← ده 90% من التكلفة
4. يحسب المؤشرات (دفعة 2، دفعة 3، صدور الترخيص، ...)
5. يقرا الدفعة الأولى من Google Sheet
6. يعدّل index.html على GitHub (بيبدّل سطور const _D/_M/_A/_P1D بس)
7. يدفع: data.json · debug.json · task_cache.json · history/DATE.json · history/index.json
8. يأرشف السيلز والفروع: history/sales-DATE.json · history/sales-index.json
9. لو الساعة 11 صباحًا القاهرة: يبعت الإيميل اليومي
```

## ملاحظات فنية لازم تعرفها

**النصوص العربية مكتوبة `\uXXXX`** — مش تجميل. PowerShell `ConvertTo-Json` كان بيبوّظ الحروف العربية لـ `?` وقت عمل PUT للـ workflow. لو بتعدل من المتصفح مباشرة العربي العادي يشتغل، بس خليك على نفس الأسلوب للاتساق.

**بارسرين CSV في نفس الملف:**
- `parseCsvProper()` — سليم، بيتعامل مع خلايا فيها أسطر جوه quotes
- `parseCSV()` — قديم وفيه bug الـ multiline headers، **لسه مستخدم في جزء الدفعة الأولى**

**الكاش بيبطل بـ 3 شروط:** `CACHE_VERSION` يتغير · `last_updated_time_long` للمشروع يتغير · مرور 12 ساعة (`TTL_MS`).
لو عايز تجبر إعادة حساب كاملة فورًا: زوّد `CACHE_VERSION` واحد.

**Google Sheets: استخدم `/export?format=csv` مش `/gviz/tq`** — الـ gviz بيرجع نسخة قديمة (cached) للخلايا اللي فيها معادلات، فالأرقام تطلع غلط.
