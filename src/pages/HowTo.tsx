// طريقة الاستخدام — دليل شامل ومفصّل لمنهجية التطبيق، التكرار المتباعد، التثبيت، وميزات PWA.
import { useState } from 'react';
import { Icon } from '../components/icons';
import { Badge, Btn, Card, CardBody, CardHead, PageHeader, Tabs } from '../components/ui';
import { INTERVALS } from '../lib/fixation';
import { fmtNum } from '../lib/utils';
import type { Strength } from '../lib/types';
import { STRENGTH_LABEL } from '../lib/types';

type GuideTab = 'quickstart' | 'fixation' | 'wird' | 'tools' | 'pwa' | 'faq';

export function HowTo() {
  const [tab, setTab] = useState<GuideTab>('quickstart');

  const goTo = (hash: string) => {
    window.location.hash = hash;
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        icon="help"
        title="طريقة الاستخدام والدليل الشامل"
        sub="دليلك المفصل لفهم المنهجية العلمية للتثبيت، التكرار المتباعد، تنظيم الورد، وأسرار استخدام التطبيق بأقصى كفاءة."
        actions={
          <div className="flex flex-wrap gap-2">
            <Btn size="sm" variant="outline" onClick={() => goTo('#memorization')}>
              <Icon name="layers" size={14} /> جدول الحفظ
            </Btn>
            <Btn size="sm" variant="soft" onClick={() => goTo('#revision')}>
              <Icon name="repeat" size={14} /> مراجعة اليوم
            </Btn>
          </div>
        }
      />

      <Tabs
        tabs={[
          { id: 'quickstart', label: 'البداية السريعة' },
          { id: 'fixation', label: 'التثبيت والتكرار المتباعد' },
          { id: 'wird', label: 'الورد والختمة' },
          { id: 'tools', label: 'المصحف والتركيز والأخطاء' },
          { id: 'pwa', label: 'ميزات PWA وبدون إنترنت' },
          { id: 'faq', label: 'أسئلة شائعة وتلميحات' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'quickstart' && <QuickstartSection goTo={goTo} />}
      {tab === 'fixation' && <FixationSection goTo={goTo} />}
      {tab === 'wird' && <WirdSection goTo={goTo} />}
      {tab === 'tools' && <ToolsSection goTo={goTo} />}
      {tab === 'pwa' && <PwaSection />}
      {tab === 'faq' && <FaqSection />}

      <div className="rounded-2xl border border-line bg-surface p-4 text-xs leading-relaxed text-muted shadow-soft">
        <p className="flex items-start gap-2">
          <Icon name="shield" size={16} className="mt-0.5 shrink-0 text-primary" />
          <span>
            <b>أمان بياناتك:</b> HifzFlow مبني وفق معمارية <b>محلي أولاً (Local-First)</b>. كل ما تدخله محفوظ في قاعدة بيانات متصفحك (IndexedDB)، ولا يتم إرسال أي حرف إلى أي خادم خارجي. احرص على تصدير نسخة احتياطية دورياً من صفحة «النسخ الاحتياطي».
          </span>
        </p>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 1. Quickstart Section
// -----------------------------------------------------------------------------
function QuickstartSection({ goTo }: { goTo: (h: string) => void }) {
  const steps = [
    {
      num: '١',
      title: 'سجّل محفوظك الفعلي',
      desc: 'التطبيق لا يفترض أي محفوظ مسبقاً. افتح صفحة «الحفظ»، واختر إما إضافة سورة واحدة من تبويب «إضافة ونطاق» أو إدخال نطاق واسع دفعة واحدة (مثلاً من البقرة إلى الإسراء).',
      action: { label: 'انتقل لصفحة الحفظ', target: '#memorization' },
    },
    {
      num: '٢',
      title: 'حدّد مستوى إتقان كل سورة بأمانة',
      desc: 'قسّم محفوظك إلى ٤ مستويات: ضعيف (يتفلت سريعاً وبحاجة لتثبيت مكثف)، متوسط (جيد لكن يحتاج ضبط)، قوي (محفوظ جيداً)، متقن جداً (كالفاتحة). المنهجية مبنية على الأمانة في التقييم.',
      action: { label: 'دليل مستويات القوة', target: '#memorization' },
    },
    {
      num: '٣',
      title: 'راجع ما هو مستحق اليوم فقط',
      desc: 'في كل صباح، افتح «المراجعة» ← «مراجعة اليوم». ستجد السور مرتبة حسب الأولوية الرياضية الذكية: المتأخر أولاً، ثم الأضعف فالأقوى. راجع وقيّم بصدق: (أعد / جيد / سهل).',
      action: { label: 'افتح مراجعة اليوم', target: '#revision' },
    },
    {
      num: '٤',
      title: 'استمر مع ختمة الـ ١٥ يوماً وجدول الورد',
      desc: 'اتبع جدول خطة التثبيت لتغطية كل محفوظك في ١٥ يوماً بالتوازي (ضعيف + متوسط + قوي معاً). أو فعّل جدول الورد الدوري (٧ أو ١٠ أو ١٥ أو ٣٠ يوماً) بترتيب المصحف الشريف.',
      action: { label: 'عرض خطة التثبيت', target: '#revision' },
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-3xl bg-gradient-to-l from-hero1 via-hero2 to-hero3 p-5 text-white shadow-soft">
        <h2 className="text-lg font-bold">مرحباً بك في HifzFlow 🌿</h2>
        <p className="mt-1 text-sm leading-relaxed opacity-95">
          رفيقك المنظم لضبط كتاب الله تعالى. يجمع بين قواعد علم النفس المعرفي في <b>التكرار المتباعد (Spaced Repetition)</b> والمنهج المعتمد لدى كبار حفاظ القرآن في التثبيت بالختمات المتوازية.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {steps.map((s) => (
          <div key={s.num} className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-4 shadow-soft">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primarysoft font-display text-sm font-bold text-primary">
                  {s.num}
                </span>
                <h3 className="text-base font-bold text-ink">{s.title}</h3>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">{s.desc}</p>
            </div>
            <div className="mt-3 pt-2">
              <Btn size="sm" variant="outline" className="w-full" onClick={() => goTo(s.action.target)}>
                {s.action.label} ←
              </Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 2. Fixation & Spaced Repetition Section
// -----------------------------------------------------------------------------
function FixationSection({ goTo }: { goTo: (h: string) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <Card>
        <CardHead
          title="فواصل التكرار المتباعد (Spaced Repetition Intervals)"
          sub="كلما زادت قوة الحفظ، تباعدت فترات المراجعة لتثبيت المعلومة في الذاكرة طويلة المدى"
        />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr className="border-b border-line text-xs text-muted">
                  <th className="px-3 py-2 text-start">مستوى القوة</th>
                  <th className="px-3 py-2 text-start">عدد المراحل</th>
                  <th className="px-3 py-2 text-start">فواصل المراجعة (بالأيام)</th>
                  <th className="px-3 py-2 text-start">طريقة الصعود للمستوى التالي</th>
                </tr>
              </thead>
              <tbody>
                {(Object.keys(INTERVALS) as Strength[]).map((st) => (
                  <tr key={st} className="border-b border-line text-xs last:border-0">
                    <td className="px-3 py-2.5 font-bold">
                      <Badge tone={st === 'weak' ? 'warn' : st === 'medium' ? 'soft' : 'ok'}>
                        {STRENGTH_LABEL[st]}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 font-semibold">{fmtNum(INTERVALS[st].length)} مراحل</td>
                    <td className="px-3 py-2.5 font-mono text-primary font-bold">
                      {INTERVALS[st].map(fmtNum).join(' ← ')}
                    </td>
                    <td className="px-3 py-2.5 text-muted">
                      {st === 'weak' && 'إكمال المراحل الـ ٦ كاملة بنجاح (لا اختصار بـ «سهل» مرتين).'}
                      {st === 'medium' && 'تقييم «سهل» مرتين متتاليتين أو إتمام الدورة.'}
                      {st === 'strong' && 'تقييم «سهل» مرتين متتاليتين أو إتمام الدورة.'}
                      {st === 'veryStrong' && 'أعلى درجة إتقان (مراجعة دورية كل شهرين إلى ٣ أشهر).'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <Card className="border-amber-400/40 bg-amber-50/40 dark:bg-amber-950/20">
        <CardHead
          title="⚠️ القاعدة الجوهرية: قانون تثبيت الضعيف"
          sub="لماذا لا يترقى الضعيف تلقائياً بعد ختمة الـ ١٥ يوماً؟"
        />
        <CardBody className="space-y-2 text-xs leading-relaxed text-ink">
          <p>
            في المنهج الصحيح للحفظ: <b>لا ترقية تلقائية بمجرد قراءة الختمة!</b> السورة الضعيفة تظل ضعيفة حتى تثبت بالتكرار المتباعد الفعلي.
          </p>
          <ul className="list-disc space-y-1.5 ps-5 text-muted">
            <li>
              <b>دورة الـ ٦ مراحل للضعيف:</b> تبدأ بعد يوم، ثم يومين، ثم ٣، ثم ٥، ثم ٧، ثم ١٠ أيام.
            </li>
            <li>
              <b>متى يصبح الضعيف متوسطاً؟</b> فقط عند إكمال هذه المراحل الست كاملة، وتقييمها بـ «جيد» أو «سهل» في المحطة الأخيرة (اليوم العاشر).
            </li>
            <li>
              <b>لماذا لا ينفع «سهل» مرتين؟</b> لأن السورة الضعيفة تخدع صاحبها أحياناً إذا راجعها للتو، لكنها تتفلت سريعاً إن لم تختبر عبر الفواصل الزمنية الطويلة.
            </li>
            <li>
              <b>ماذا يحدث إذا اخترت «أعد»؟</b> تعود السورة فوراً إلى البداية (المرحلة الأولى: مراجعة غداً)، لأن الهدف هو الإتقان الراسخ وليس مجرد المرور السريع.
            </li>
            <li>
              <b>ماذا بعد التثبيت؟</b> عندما تُتم السورة الضعيفة دورتها، تتحول تلقائياً إلى «متوسطة»، وتدخل في دورة مراجعة كل ١٥ يوماً (أو ١٠ أيام حسب اختيارك في إعدادات التثبيت).
            </li>
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardHead title="كيف تختار التقييم المناسب في كل جلسة؟" />
        <CardBody>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-red-200 bg-red-50/70 p-3 text-xs dark:border-red-900/40 dark:bg-red-950/30">
              <p className="font-bold text-red-700 dark:text-red-400">زر «أعد» (Again)</p>
              <p className="mt-1 text-muted">
                اختره إذا تعثرت كثيراً، أو توقفت وفتحت المصحف للتذكر، أو شعرت بتفلت السورة. يعيد السورة ضعيفة من المرحلة الأولى ليضمن استدراكها فوراً.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface2 p-3 text-xs">
              <p className="font-bold text-ink">زر «جيد» (Good)</p>
              <p className="mt-1 text-muted">
                اختره إذا قرأت بسلاسة مع تردد بسيط أو خطأ خفيف استدركته بنفسك. يقدّمك مرحلة واحدة إلى الأمام في فاصل المراجعة القادم.
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs dark:border-emerald-900/40 dark:bg-emerald-950/30">
              <p className="font-bold text-emerald-700 dark:text-emerald-400">زر «سهل» (Easy)</p>
              <p className="mt-1 text-muted">
                اختره إذا سردت الآيات بحضور قلب وانطلاق تام دون أي تردد. للمتوسط والقوي: اختياره مرتين متتاليتين يرفع القوة درجة أعلى.
              </p>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Btn size="sm" variant="soft" onClick={() => goTo('#revision')}>
              انتقل إلى مراجعة اليوم والتثبيت ←
            </Btn>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 3. Wird & Khatma Plan Section
// -----------------------------------------------------------------------------
function WirdSection({ goTo }: { goTo: (h: string) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <Card>
        <CardHead
          title="معادلة ختمة الـ ١٥ يوماً (التثبيت المتوازي)"
          sub="كيف تختم كل محفوظك في أسبوعين بدون نسيان القديم أو إهمال الجديد؟"
        />
        <CardBody className="space-y-3">
          <div className="rounded-2xl bg-surface2 p-3.5 text-xs leading-relaxed text-ink">
            <p className="font-bold text-sm text-primary">المعادلة اليومية القياسية (جزآن / يوم):</p>
            <p className="mt-1 font-mono text-base font-semibold">
              ٥ صفحات ضعيف + ١٥ صفحة متوسط + ٢٠ صفحة قوي (جزء كامل) = ٤٠ صفحة يومياً
            </p>
            <p className="mt-1 text-muted">
              هذه المعادلة تضمن أنك تعالج الضعيف بتركيز دقيق، وتحافظ على المتوسط حاضراً فلا يضعف، وتمر على القوي ليبقى ثابتاً كالفاتحة.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-line p-3 text-xs">
              <p className="font-bold text-ink">ميزة «إدراج الخطة في المهام»</p>
              <p className="mt-1 text-muted">
                في صفحة «المراجعة» ← «التثبيت»، اضغط زر «إدراج الخطة في المهام». سيقوم التطبيق بجدولة جلسات الختمة تلقائياً في قائمة مهامك اليومية بتواريخها الدقيقة.
              </p>
            </div>
            <div className="rounded-xl border border-line p-3 text-xs">
              <p className="font-bold text-ink">ورد التثبيت المنفصل (ضعيف لوحده / متوسط لوحده)</p>
              <p className="mt-1 text-muted">
                إذا أردت جلسة خاصة للضعيف فقط أو المتوسط فقط، ستجد في أسفل صفحة التثبيت جدولين مستقلين مع مربعات اختيار تفاعلية تحفظ إنجازك فوراً.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHead
          title="جدول الورد الدوري وتقسيم الوقت بالدقائق"
          sub="قاعدة إدارة الوقت الذهبية للحافظ: ٥٠٪ / ٣٠٪ / ٢٠٪"
        />
        <CardBody className="space-y-3">
          <p className="text-xs leading-relaxed text-muted">
            يقدّم لك التطبيق أداة ذكية لحساب وردك اليومي بالدقائق، معتمداً على معدل قراءة متقنة مقداره <b>٣ دقائق لكل صفحة</b> مصحف:
          </p>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-xl bg-surface2 p-3">
              <p className="text-lg font-bold text-primary">٥٠٪</p>
              <p className="font-bold text-ink">مراجعة دورية</p>
              <p className="text-[10px] text-muted">للختمة الدورية بترتيب المصحف</p>
            </div>
            <div className="rounded-xl bg-surface2 p-3">
              <p className="text-lg font-bold text-accent">٣٠٪</p>
              <p className="font-bold text-ink">مراجعة حديثة</p>
              <p className="text-[10px] text-muted">لآخر ما حفظته هذا الأسبوع</p>
            </div>
            <div className="rounded-xl bg-surface2 p-3">
              <p className="text-lg font-bold text-ink">٢٠٪</p>
              <p className="font-bold text-ink">حفظ جديد وربط</p>
              <p className="text-[10px] text-muted">للحفظ الجديد مع ربطه بما قبله</p>
            </div>
          </div>
          <p className="text-xs text-muted">
            إذا كان وردك الدوري أكبر من الوقت المتاح، سينبهك التطبيق فوراً لزيادة الوقت أو تعديل أيام الدورة (٧ أو ١٠ أو ١٥ أو ٣٠ يوماً).
          </p>
          <div className="mt-3 flex justify-end">
            <Btn size="sm" variant="soft" onClick={() => goTo('#revision')}>
              عرض جدول الورد وتقسيم الدقائق ←
            </Btn>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 4. Tools Section (Reader, Mistakes, Focus)
// -----------------------------------------------------------------------------
function ToolsSection({ goTo }: { goTo: (h: string) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <Card>
        <CardHead
          title="المصحف الذكي (٦٠٤ صفحات بالرسم العثماني)"
          sub="نص كامل مخزن محلياً على جهازك دون حاجة لأي اتصال بالإنترنت"
        />
        <CardBody className="space-y-2 text-xs leading-relaxed text-muted">
          <ul className="list-disc space-y-1.5 ps-5">
            <li>
              <b>التمييز البصري الذكي:</b> الآيات التي قمت بتسجيلها في جدول الحفظ تظهر تلقائياً مظللة بخلفية خضراء هادئة في المصحف، لترى تقدّمك في كل صفحة.
            </li>
            <li>
              <b>الضغط على الآية:</b> عند النقر على أي آية، تفتح لك لوحة سريعة لحفظها كـ <b>إشارة مرجعية (Bookmark)</b> للرجوع إليها، أو <b>تسجيل خطأ</b> عليها بضغطة زر.
            </li>
            <li>
              <b>أوضاع العرض الأربعة:</b>
              (١) المصحف بالصفحات مع رقم الجزء والحزب،
              (٢) السورة كاملة متصلة،
              (٣) سورة مقسمة بصفحاتها،
              (٤) بحث سريع في ٦٬٢٣٦ آية يتجاهل التشكيل مع إمكانية الانتقال الفوري للصفحة.
            </li>
            <li>
              <b>إبقاء الشاشة مضاءة (Wake Lock):</b> زر مخصص في أعلى صفحة المصحف يمنع إطفاء شاشة الهاتف أو الكمبيوتر أثناء التلاوة.
            </li>
          </ul>
          <div className="mt-2 flex justify-end">
            <Btn size="sm" variant="outline" onClick={() => goTo('#reader')}>
              افتح المصحف الآن ←
            </Btn>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardHead title="مؤقت التركيز وتسجيل المشتتات" sub="توقيت دقيق لا يتوقف مع قفل الشاشة" />
          <CardBody className="space-y-2 text-xs text-muted">
            <p>
              جلسات التركيز مصممة للحفاظ على صفاء ذهنك أثناء الحفظ والمراجعة:
            </p>
            <ul className="list-disc space-y-1 ps-4">
              <li><b>توقيت دقيق ومقاوم للنوم:</b> يحسب الوقت اعتماداً على الطابع الزمني الفعلي، فلا يتأخر أو يقف عند إغلاق الشاشة أو التبديل بين التطبيقات.</li>
              <li><b>تسجيل التشتت بضغطة زر:</b> هاتف، فكرة جانبية، ضوضاء — سجّل التشتت دون قطع جلستك لتعرف أسباب ضياع تركيزك لاحقاً.</li>
              <li><b>تفعيل الشاشة الدائمة تلقائياً:</b> يمنع إغلاق الهاتف أثناء تشغيل المؤقت.</li>
            </ul>
            <div className="mt-2 pt-1">
              <Btn size="sm" variant="soft" className="w-full" onClick={() => goTo('#focus')}>
                بدء جلسة تركيز ←
              </Btn>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHead title="سجل الأخطاء وعدّاد التكرار (+١)" sub="علاج المتشابهات والأخطاء المتكررة" />
          <CardBody className="space-y-2 text-xs text-muted">
            <p>
              صنّف أخطاءك إلى: <b>تجويد</b>، <b>كلمة</b>، <b>ترتيب</b>، أو <b>نسيان</b>.
            </p>
            <ul className="list-disc space-y-1 ps-4">
              <li>عند تكرار نفس الخطأ، اضغط <b>«+١»</b> لرفع عدّاد تكراره.</li>
              <li>الأخطاء المفتوحة ترفع أولوية مراجعة السورة تلقائياً في خوارزمية اليوم.</li>
              <li>عند إتقان الموضع وتثبيته، اضغط <b>«تم الحل ✓»</b> لإغلاق الخطأ وحفظه في الأرشيف.</li>
            </ul>
            <div className="mt-2 pt-1">
              <Btn size="sm" variant="soft" className="w-full" onClick={() => goTo('#mistakes')}>
                عرض سجل الأخطاء ←
              </Btn>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 5. PWA & Offline Section
// -----------------------------------------------------------------------------
function PwaSection() {
  return (
    <div className="flex flex-col gap-3">
      <Card>
        <CardHead
          title="تطبيق ويب تقدمي (PWA) — يعمل مثل التطبيقات الأصلية تماماً"
          sub="تجربة شاشة كاملة، سرعة فائقة، واستهلاك منعدم لبيانات الإنترنت"
        />
        <CardBody className="space-y-3">
          <div className="grid gap-2.5 sm:grid-cols-3">
            <div className="rounded-xl border border-line bg-surface2 p-3 text-xs">
              <p className="flex items-center gap-1.5 font-bold text-ink">
                <Icon name="devices" size={16} className="text-primary" /> التثبيت على Android
              </p>
              <p className="mt-1 text-muted">
                اضغط زر «تثبيت التطبيق» في الشريط الجانبي أو لوحة التحكم، أو من قائمة Chrome (⋮) اختر «تثبيت التطبيق / Install App». سيظهر كأيقونة مستقلة في درج تطبيقاتك.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface2 p-3 text-xs">
              <p className="flex items-center gap-1.5 font-bold text-ink">
                <Icon name="share" size={16} className="text-primary" /> التثبيت على iPhone & iPad
              </p>
              <p className="mt-1 text-muted">
                افتح الرابط في <b>سفاري (Safari)</b> ← اضغط زر المشاركة <Icon name="share" size={12} className="inline" /> في أسفل الشاشة ← اختر <b>«إضافة إلى الشاشة الرئيسية / Add to Home Screen»</b>.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface2 p-3 text-xs">
              <p className="flex items-center gap-1.5 font-bold text-ink">
                <Icon name="monitor" size={16} className="text-primary" /> التثبيت على Windows & Mac
              </p>
              <p className="mt-1 text-muted">
                في Chrome أو Edge اضغط أيقونة التثبيت في شريط العنوان أعلى المتصفح. يفتح التطبيق في نافذة مستقلة دون أشرطة تصفح وبأداء صاروخي.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-primary/25 bg-primarysoft/40 p-3.5 text-xs text-ink">
            <h4 className="font-bold text-primary">المميزات التقنية المتقدمة المتوفرة في HifzFlow PWA:</h4>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <div className="flex items-start gap-2">
                <Icon name="check-circle" size={15} className="mt-0.5 shrink-0 text-primary" />
                <span><b>شارات أيقونة التطبيق (App Badging):</b> يظهر عدد المراجعات المستحقة اليوم مباشرة فوق أيقونة التطبيق على شاشة هاتفك دون الحاجة لفتحه.</span>
              </div>
              <div className="flex items-start gap-2">
                <Icon name="check-circle" size={15} className="mt-0.5 shrink-0 text-primary" />
                <span><b>اختصارات التطبيق (Shortcuts):</b> ضغطة مطولة على أيقونة التطبيق تتيح لك القفز مباشرة لمراجعة اليوم، أو فتح المصحف، أو بدء جلسة تركيز.</span>
              </div>
              <div className="flex items-start gap-2">
                <Icon name="check-circle" size={15} className="mt-0.5 shrink-0 text-primary" />
                <span><b>إبقاء الشاشة نشطة (Wake Lock):</b> شاشتك لن تنطفئ تلقائياً أثناء قراءة القرآن أو تشغيل المؤقت.</span>
              </div>
              <div className="flex items-start gap-2">
                <Icon name="check-circle" size={15} className="mt-0.5 shrink-0 text-primary" />
                <span><b>الاهتزاز التفاعلي اللمسي (Haptic Feedback):</b> لمسات اهتزازية خفيفة تؤكد لك حفظ التقييم أو إنهاء المهمة بسلاسة.</span>
              </div>
              <div className="flex items-start gap-2">
                <Icon name="check-circle" size={15} className="mt-0.5 shrink-0 text-primary" />
                <span><b>المشاركة الأصلية (Web Share API):</b> شارك إنجاز وردك اليومي عبر واتساب وتيليجرام بضغطة واحدة.</span>
              </div>
              <div className="flex items-start gap-2">
                <Icon name="check-circle" size={15} className="mt-0.5 shrink-0 text-primary" />
                <span><b>عمل تام بدون إنترنت (Offline Full Support):</b> يتم تخزين ملفات التطبيق والمصحف محلياً في ذاكرة التخزين المؤقت، ويعمل 100% في وضع الطيران.</span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 6. FAQ & Golden Tips Section
// -----------------------------------------------------------------------------
function FaqSection() {
  const faqs = [
    {
      q: 'هل تنحذف بياناتي إذا مسحت سجل المتصفح (Browser History)؟',
      a: 'مسح سجل التصفح العادي (History) لا يحذف بياناتك المخزنة في IndexedDB. لكن تنظيف «ملفات تعريف الارتباط وبيانات المواقع (Cookies & Site Data)» قد يمسحها. لذلك ننصح دائماً بتحميل نسخة احتياطية من صفحة «النسخ الاحتياطي» بانتظام.',
    },
    {
      q: 'هل يمكنني نقل بياناتي بين الهاتف والكمبيوتر؟',
      a: 'نعم بكل سهولة! اذهب إلى «النسخ الاحتياطي» على هاتفك ← اضغط «تصدير نسخة احتياطية» (سيتم تنزيل ملف JSON صغير). أرسل الملف لكمبيوترك، ثم افتح التطبيق هناك واضغط «استيراد نسخة احتياطية». ستنتقل كل محفوظاتك وسجلاتك وأخطاؤك فوراً.',
    },
    {
      q: 'ماذا أفعل إذا انقطعت عدة أيام وتراكمت علي مراجعات كثيرة؟',
      a: 'لا تقلق أبداً! خوارزمية التطبيق تفرز المراجعات في «الجولة الأولى — المتأخر» حسب الأولوية الرياضية، حيث تضع الأضعف والأكثر أخطاءً أولاً. قسّم المتأخر على يومين أو ثلاثة، ولا تضغط على نفسك دفعة واحدة.',
    },
    {
      q: 'كيف أغيّر مظهر وألوان التطبيق؟',
      a: 'يوفر التطبيق ٥ لوحات ألوان مستوحاة من المصاحف التراثية والطبيعة (المريمية، المحيط، الصحراء، الورد، الليل)، مع دعم الوضع الفاتح والداكن والتلقائي. يمكنك التبديل بينها من أسفل القائمة الجانبية أو من صفحة النسخ الاحتياطي.',
    },
    {
      q: 'لماذا لا يوجد حساب تسجيل دخول؟',
      a: 'هذا تصميم مقصود للحفاظ على خصوصيتك التامة وسرعة التطبيق الخارقة. بياناتك ملكك وحدك ومخزنة على جهازك دون حاجة لخوادم أو كلمات مرور أو إنترنت.',
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <CardHead title="أسئلة شائعة وتلميحات لحفاظ كتاب الله" sub="إجابات سريعة على أهم الاستفسارات" />
        <CardBody className="space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="rounded-xl border border-line bg-surface2/60 p-3.5">
              <h4 className="text-sm font-bold text-ink">❓ {f.q}</h4>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{f.a}</p>
            </div>
          ))}
        </CardBody>
      </Card>

      <div className="rounded-2xl border border-primary/30 bg-primarysoft/60 p-4 text-xs leading-relaxed text-ink shadow-soft">
        <p className="font-bold text-sm text-primary">🌿 وصية ذهبية لحفظ متين:</p>
        <p className="mt-1 text-muted">
          قال الإمام النووي رحمه الله: «ينبغي للمعتني بقراءة القرآن أن يتعاهد قراءته، ويكثر منها، ويحذر كل الحذر من نسيانه». المداومة على قليل دائم، وتقييم النفس بصدق، والتكرار المتباعد المنظم، هو السر وراء بقاء القرآن في الصدور كالفاتحة. نسأل الله أن يجعلك من أهل القرآن الذين هم أهل الله وخاصته.
        </p>
      </div>
    </div>
  );
}
