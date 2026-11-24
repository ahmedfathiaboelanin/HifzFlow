// ضبط المتشابهات — native port of the standalone "الماهر بالقرآن" app:
// browse/filter 596 entries and take a 10-question quiz, inside HifzFlow.
import { useState } from 'react';
import { Badge, PageHeader, Tabs } from '../components/ui';
import { Icon } from '../components/icons';
import { fmtNum } from '../lib/utils';
import {
  ENTRY_COUNT, SECTIONS, SECTION_COUNTS, UNVERIFIED_COUNT, VERIFIED_ENTRY_COUNT, VERSE_COUNT,
} from '../lib/mutashabihat';
import { BrowseTab } from '../components/mutashabihat/BrowseTab';
import { QuizTab } from '../components/mutashabihat/QuizTab';

type TabId = 'browse' | 'quiz';

export function Mutashabihat() {
  const [tab, setTab] = useState<TabId>('browse');

  return (
    <div>
      <PageHeader
        icon="copy"
        title="ضبط المتشابهات"
        sub="متشابهات القرآن من سلسلة «الماهر بالقرآن»: فوائد الضبط، ومتشابهات قصص الأنبياء، والمجموعة الكاملة مرتبة بالأجزاء. ابحث بالآية أو القاعدة أو السورة أو الجزء أو قصة النبي، واختبر نفسك."
        meta={
          <>
            {SECTIONS.map((s) => (
              <Badge key={s.key} tone="soft">
                {s.label} · {fmtNum(SECTION_COUNTS[s.key] ?? 0)}
              </Badge>
            ))}
            <Badge tone="ok" dot>المجموع {fmtNum(ENTRY_COUNT)} مدخلًا</Badge>
          </>
        }
      />

      <Tabs<TabId>
        tabs={[
          { id: 'browse', label: 'البحث والتصفح' },
          { id: 'quiz', label: 'وضع الاختبار' },
        ]}
        value={tab}
        onChange={setTab}
        label="أقسام ضبط المتشابهات"
      />

      <div className="mt-3 rounded-2xl border border-amber-300/80 bg-amber-50 p-3.5 text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-100">
        <p className="flex items-center gap-1.5 text-[13px] font-bold">
          <Icon name="alert" size={16} />
          تنبيه مهم قبل الاستخدام
        </p>
        <p className="mt-1 text-[12px] leading-relaxed">
          رُوجعت الآيات المستخرجة وقورنت بالنص القرآني الأصلي: طابَق ٧٦٫٥٪ من المقاطع،
          و{fmtNum(VERIFIED_ENTRY_COUNT)} من {fmtNum(ENTRY_COUNT)} مدخلًا موثّقة آياتها بالكامل —
          {' '}{fmtNum(VERSE_COUNT)} آية معروضة بنص المصحف حرفيًا وبأرقامها المصححة. لكن{' '}
          {fmtNum(UNVERIFIED_COUNT)} مدخلات ما زالت تحمل مقاطع غير موثوقة، وهي معروضة كما استُخرجت
          ومُعلَّمة بعلامة «غير موثوق — راجع المصحف». راجع أي نص غير موثوق مع المصحف قبل الاعتماد عليه.
        </p>
      </div>

      <div className="mt-4">
        {tab === 'browse' ? <BrowseTab /> : <QuizTab />}
      </div>

      <p className="mt-5 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted">
        <Icon name="book" size={13} className="mt-0.5 shrink-0" />
        <span>
          المصدر: ثلاثة ملفات من سلسلة «الماهر بالقرآن» (فوائد في ضبط المتشابهات — ٧٠ فائدة،
          متشابهات قصص الأنبياء، المجموعة الكاملة بالأجزاء ١–٣٠). الآيات الموثّقة معروضة بنص
          المصحف الأصلي حرفيًا، وما لم يُوثَّق معلَّم «غير موثوق» — المرجع دائمًا هو المصحف.
        </span>
      </p>
    </div>
  );
}
