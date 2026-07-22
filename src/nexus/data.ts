export type BlogStatus = 'pending' | 'approved' | 'rejected'

export type NexusBlog = {
  id: string
  title: { en: string; ar: string }
  description: { en: string; ar: string }
  content: { en: string[]; ar: string[] }
  references: string[]
  status: BlogStatus
  generatedAt: string
  model: string
  readMinutes: number
  tag: { en: string; ar: string }
}

export const demoBlogs: NexusBlog[] = [
  {
    id: 'rise-of-agentic-ai',
    title: { en: 'The Rise of Agentic AI', ar: 'صعود الذكاء الاصطناعي الوكيل' },
    description: {
      en: 'Autonomous AI agents are moving from research demos to production systems, reshaping how software gets built and operated across the industry.',
      ar: 'تنتقل وكلاء الذكاء الاصطناعي المستقلة من العروض البحثية إلى أنظمة الإنتاج، معيدةً تشكيل طريقة بناء البرمجيات وتشغيلها في الصناعة.',
    },
    content: {
      en: [
        'For most of the last decade, artificial intelligence lived behind an API call: you sent a prompt, you received a completion, and the loop ended there. Agentic AI breaks that loop open. An agent plans, acts, observes the result, and decides what to do next — often across dozens of steps and multiple tools.',
        'The shift matters because it changes who does the orchestration. Instead of engineers hand-writing every branch of a workflow, the model itself decomposes the goal, calls the tools, and recovers from errors. Early adopters report that tasks like dependency upgrades, test triage, and incident summarization can now run end-to-end with only a human review gate at the finish line.',
        'None of this removes the need for guardrails. Production agent systems succeed when their action space is explicit, their permissions are scoped, and every irreversible step requires approval. The pattern that is emerging — AI drafts, human approves, system publishes — is exactly the pattern this very blog is built on.',
      ],
      ar: [
        'طوال معظم العقد الماضي، عاش الذكاء الاصطناعي خلف استدعاء واجهة برمجية: ترسل طلبًا، وتستقبل إجابة، وتنتهي الحلقة هناك. الذكاء الاصطناعي الوكيل يكسر هذه الحلقة. فالوكيل يخطط، ويتصرف، ويلاحظ النتيجة، ثم يقرر خطوته التالية — غالبًا عبر عشرات الخطوات وأدوات متعددة.',
        'يكمن أثر هذا التحول في تغيير الجهة المسؤولة عن التنسيق. فبدلًا من كتابة المهندسين لكل فرع من سير العمل يدويًا، يقوم النموذج نفسه بتفكيك الهدف واستدعاء الأدوات والتعافي من الأخطاء. ويشير المتبنون الأوائل إلى أن مهام مثل ترقية الاعتماديات وفرز الاختبارات وتلخيص الحوادث يمكن أن تعمل الآن من البداية للنهاية مع بوابة مراجعة بشرية واحدة عند خط النهاية.',
        'كل هذا لا يلغي الحاجة إلى الضوابط. تنجح أنظمة الوكلاء في الإنتاج عندما يكون فضاء أفعالها صريحًا وصلاحياتها محدودة، وكل خطوة لا رجعة فيها تتطلب موافقة. النمط الناشئ — الذكاء الاصطناعي يكتب، والإنسان يوافق، والنظام ينشر — هو بالضبط النمط الذي بُنيت عليه هذه المدونة.',
      ],
    },
    references: [
      'Anthropic (2025). Building Effective Agents.',
      'Yao, S. et al. (2023). ReAct: Synergizing Reasoning and Acting in Language Models.',
      'Kapoor, S. & Narayanan, A. (2024). AI Agents That Matter.',
    ],
    status: 'approved',
    generatedAt: '2026-07-18',
    model: 'Nexus Writer v3',
    readMinutes: 6,
    tag: { en: 'AI Systems', ar: 'أنظمة الذكاء' },
  },
  {
    id: 'design-tokens-at-scale',
    title: { en: 'Design Tokens at Scale', ar: 'رموز التصميم على نطاق واسع' },
    description: {
      en: 'How design tokens let a subdomain inherit the look and feel of its parent site automatically, keeping brands consistent without manual theming work.',
      ar: 'كيف تتيح رموز التصميم لنطاق فرعي أن يرث مظهر الموقع الأم تلقائيًا، محافظًا على اتساق الهوية دون عمل يدوي في التنسيق.',
    },
    content: {
      en: [
        'A design token is a named decision: the brand blue, the base radius, the spacing scale. When every visual choice flows from tokens instead of hard-coded values, a whole product can be rethemed by swapping a small JSON payload.',
        'This is the mechanism that makes "subdomain" products feel native. The child site fetches the parent\'s token set — colors, typography, radii, density — and maps it onto its own component library. Visitors never notice a seam, because there isn\'t one.',
        'The hard part is governance. Tokens need versioning, fallbacks for missing values, and contrast checks so an inherited palette never produces unreadable text. Automate those three things and inheritance becomes safe by default.',
      ],
      ar: [
        'رمز التصميم هو قرار مُسمّى: أزرق العلامة التجارية، نصف القطر الأساسي، سلم المسافات. عندما ينبع كل خيار بصري من الرموز بدلًا من القيم الثابتة، يمكن إعادة تنسيق منتج كامل بتبديل ملف JSON صغير.',
        'هذه هي الآلية التي تجعل منتجات "النطاق الفرعي" تبدو أصلية. يجلب الموقع الفرعي مجموعة رموز الموقع الأم — الألوان والخطوط وأنصاف الأقطار والكثافة — ويطبقها على مكوناته. لا يلاحظ الزوار أي فاصل، لأنه غير موجود أصلًا.',
        'الجزء الصعب هو الحوكمة. تحتاج الرموز إلى إصدارات، وقيم احتياطية للقيم المفقودة، وفحوص تباين حتى لا تنتج اللوحة الموروثة نصًا غير مقروء. أتمِت هذه الأمور الثلاثة وسيصبح الوراثة آمنة افتراضيًا.',
      ],
    },
    references: [
      'W3C Design Tokens Community Group (2025). Design Tokens Format Module.',
      'Salesforce (2014). Living Design Systems — Theo.',
    ],
    status: 'approved',
    generatedAt: '2026-07-15',
    model: 'Nexus Writer v3',
    readMinutes: 4,
    tag: { en: 'Design', ar: 'تصميم' },
  },
  {
    id: 'edge-rendering-2026',
    title: { en: 'Edge Rendering in 2026', ar: 'العرض على الحافة في 2026' },
    description: {
      en: 'Streaming server components from the edge has cut median page latency dramatically. Here is what changed under the hood and why it matters now.',
      ar: 'أدى بث مكونات الخادم من الحافة إلى خفض زمن استجابة الصفحات بشكل كبير. إليك ما تغير خلف الكواليس ولماذا يهم الآن.',
    },
    content: {
      en: [
        'Edge rendering used to mean caching static HTML close to the user. In 2026 it means running the actual rendering pass — server components, data fetches, personalization — inside points of presence a few milliseconds away from the visitor.',
        'The unlock was cheap, fast cold starts. Isolate-based runtimes boot in under a millisecond, which makes it economical to render every request at the edge instead of only cache hits.',
        'The practical guidance: keep your data close to your render, stream early, and treat the origin as a fallback rather than the default path.',
      ],
      ar: [
        'كان العرض على الحافة يعني تخزين HTML ثابت قريبًا من المستخدم. في 2026 أصبح يعني تنفيذ عملية العرض الفعلية — مكونات الخادم وجلب البيانات والتخصيص — داخل نقاط تواجد تبعد أجزاء من الثانية عن الزائر.',
        'كان مفتاح ذلك هو الإقلاع البارد الرخيص والسريع. بيئات التشغيل المعزولة تقلع في أقل من ميلي ثانية، مما يجعل عرض كل طلب على الحافة اقتصاديًا بدلًا من الاكتفاء بالمخزّن مسبقًا.',
        'الإرشاد العملي: أبقِ بياناتك قريبة من العرض، وابدأ البث مبكرًا، وتعامل مع الخادم الأصلي كخيار احتياطي لا كمسار افتراضي.',
      ],
    },
    references: [
      'Vercel (2026). The State of Edge Rendering.',
      'Cloudflare (2025). Workers Isolate Architecture Deep Dive.',
    ],
    status: 'pending',
    generatedAt: '2026-07-21',
    model: 'Nexus Writer v3',
    readMinutes: 5,
    tag: { en: 'Web Platform', ar: 'منصة الويب' },
  },
  {
    id: 'human-in-the-loop-publishing',
    title: { en: 'Human-in-the-Loop Publishing', ar: 'النشر بإشراف بشري' },
    description: {
      en: 'Fully automated content pipelines fail on trust, not technology. A single human approval gate fixes the economics of AI publishing.',
      ar: 'خطوط النشر المؤتمتة بالكامل تفشل في الثقة لا في التقنية. بوابة موافقة بشرية واحدة تصلح اقتصاديات النشر بالذكاء الاصطناعي.',
    },
    content: {
      en: [
        'When language models became good enough to draft publishable prose, the first instinct was to remove humans entirely. The results were fast, cheap, and untrusted.',
        'The pipeline that actually works keeps exactly one human decision: approve or reject. Everything before it — research, drafting, citation gathering — and everything after it — formatting, publishing, distribution — is automated.',
        'Reviewers stay effective because the interface is honest: the full text, the references, and two buttons. No edit surface, no negotiation. Rejected drafts go back to the model with the reviewer\'s note attached.',
      ],
      ar: [
        'عندما أصبحت النماذج اللغوية قادرة على صياغة نصوص صالحة للنشر، كانت الغريزة الأولى هي إزالة البشر تمامًا. كانت النتائج سريعة ورخيصة وغير موثوقة.',
        'خط الأنابيب الذي ينجح فعلًا يحتفظ بقرار بشري واحد بالضبط: الموافقة أو الرفض. كل ما قبله — البحث والصياغة وجمع المراجع — وكل ما بعده — التنسيق والنشر والتوزيع — مؤتمت.',
        'يظل المراجعون فعالين لأن الواجهة صادقة: النص الكامل، والمراجع، وزران. لا مساحة تحرير ولا تفاوض. المسودات المرفوضة تعود إلى النموذج مع ملاحظة المراجع.',
      ],
    },
    references: [
      'Nielsen Norman Group (2025). Trust Signals in AI-Generated Content.',
      'Reuters Institute (2026). Digital News Report.',
    ],
    status: 'pending',
    generatedAt: '2026-07-22',
    model: 'Nexus Writer v3',
    readMinutes: 4,
    tag: { en: 'Editorial', ar: 'تحرير' },
  },
  {
    id: 'sqlite-is-enough',
    title: { en: 'SQLite Is Enough', ar: 'SQLite تكفي' },
    description: {
      en: 'For the vast majority of content sites, a single-file database outperforms a managed cluster on cost, latency, and operational simplicity.',
      ar: 'بالنسبة للغالبية العظمى من مواقع المحتوى، تتفوق قاعدة بيانات بملف واحد على العنقود المُدار في التكلفة والسرعة وبساطة التشغيل.',
    },
    content: {
      en: [
        'The default architecture for a new website still includes a networked database, even when the site serves a few thousand readers a day. That default is worth questioning.',
        'SQLite reads are a memory-mapped file access away — no connection pool, no network hop, no cold-start penalty. For read-heavy content sites, benchmarks routinely show sub-millisecond query times.',
        'The honest limits: heavy concurrent writes and multi-region replication need real infrastructure. But a blog that publishes a handful of posts a day and serves reads from cache is nowhere near those limits.',
      ],
      ar: [
        'لا تزال البنية الافتراضية لموقع جديد تتضمن قاعدة بيانات عبر الشبكة، حتى عندما يخدم الموقع بضعة آلاف من القراء يوميًا. هذا الافتراض يستحق المساءلة.',
        'قراءات SQLite ليست سوى وصول لملف محمّل في الذاكرة — لا مجمع اتصالات، ولا قفزة شبكية، ولا عقوبة إقلاع بارد. في مواقع المحتوى كثيفة القراءة تُظهر القياسات زمن استعلام أقل من ميلي ثانية.',
        'الحدود الصادقة: الكتابات المتزامنة الكثيفة والنسخ متعدد المناطق يحتاجان بنية حقيقية. لكن مدونة تنشر بضع مقالات يوميًا وتخدم القراءات من الذاكرة المؤقتة بعيدة كل البعد عن تلك الحدود.',
      ],
    },
    references: ['Hipp, D. R. (2024). SQLite: Past, Present, and Future.', 'Litestream Documentation (2025).'],
    status: 'rejected',
    generatedAt: '2026-07-10',
    model: 'Nexus Writer v2',
    readMinutes: 5,
    tag: { en: 'Infrastructure', ar: 'بنية تحتية' },
  },
]

export type Lang = 'en' | 'ar'

export const t: Record<string, { en: string; ar: string }> = {
  main: { en: 'Main', ar: 'الرئيسية' },
  adminPanel: { en: 'Admin Panel', ar: 'لوحة الإدارة' },
  settings: { en: 'Settings', ar: 'الإعدادات' },
  aiChat: { en: 'AI Chat', ar: 'محادثة الذكاء' },
  login: { en: 'Log in', ar: 'تسجيل الدخول' },
  logout: { en: 'Log out', ar: 'تسجيل الخروج' },
  search: { en: 'Search', ar: 'بحث' },
  searchPlaceholder: { en: 'Search blogs…', ar: 'ابحث في المدونات…' },
  noResults: { en: 'No blogs match your search.', ar: 'لا توجد مدونات مطابقة لبحثك.' },
  latestBlogs: { en: 'Latest blogs', ar: 'أحدث المدونات' },
  heroTitle: { en: 'Written by AI. Approved by humans.', ar: 'كتبها الذكاء الاصطناعي. واعتمدها البشر.' },
  heroSub: {
    en: 'Nexus drafts every article autonomously. An editor approves it. It publishes itself.',
    ar: 'يكتب نكسس كل مقال ذاتيًا، يعتمده محرر، ثم يُنشر تلقائيًا.',
  },
  readBlog: { en: 'Read blog', ar: 'اقرأ المدونة' },
  references: { en: 'References', ar: 'المراجع' },
  pendingReview: { en: 'Pending review', ar: 'بانتظار المراجعة' },
  approved: { en: 'Approved', ar: 'معتمد' },
  rejected: { en: 'Rejected', ar: 'مرفوض' },
  approve: { en: 'Approve & publish', ar: 'اعتماد ونشر' },
  reject: { en: 'Reject', ar: 'رفض' },
  adminEmpty: { en: 'All caught up — no blogs awaiting review.', ar: 'كل شيء منجز — لا مدونات بانتظار المراجعة.' },
  adminHeading: { en: 'Awaiting your review', ar: 'بانتظار مراجعتك' },
  adminSub: {
    en: 'These drafts were generated by the AI and need a decision before they publish.',
    ar: 'هذه المسودات أنشأها الذكاء الاصطناعي وتحتاج قرارًا قبل النشر.',
  },
  minRead: { en: 'min read', ar: 'دقائق قراءة' },
  generatedBy: { en: 'Generated by', ar: 'أُنشئ بواسطة' },
  loginTitle: { en: 'Welcome back', ar: 'مرحبًا بعودتك' },
  loginSub: { en: 'Choose how you want to enter Nexus.', ar: 'اختر طريقة دخولك إلى نكسس.' },
  loginReader: { en: 'Continue as Reader', ar: 'المتابعة كقارئ' },
  loginAdmin: { en: 'Continue as Admin', ar: 'المتابعة كمسؤول' },
  settingsTitle: { en: 'Appearance & Experience', ar: 'المظهر والتجربة' },
  settingsSub: {
    en: 'Tune every part of the Nexus UI — or inherit it automatically from the parent site.',
    ar: 'تحكم في كل جزء من واجهة نكسس — أو ورّثها تلقائيًا من الموقع الأم.',
  },
  logoName: { en: 'Logo name', ar: 'اسم الشعار' },
  accentColor: { en: 'Accent color', ar: 'اللون الرئيسي' },
  cornerRadius: { en: 'Corner radius', ar: 'استدارة الزوايا' },
  fontSize: { en: 'Font size', ar: 'حجم الخط' },
  density: { en: 'Layout density', ar: 'كثافة التخطيط' },
  comfortable: { en: 'Comfortable', ar: 'مريح' },
  compact: { en: 'Compact', ar: 'مضغوط' },
  animations: { en: 'Scroll animations', ar: 'حركات التمرير' },
  on: { en: 'On', ar: 'مفعّل' },
  off: { en: 'Off', ar: 'معطّل' },
  connectSite: { en: 'Parent site connection', ar: 'الاتصال بالموقع الأم' },
  connectSub: {
    en: 'Nexus runs as a subdomain. Connect it to the parent site to inherit its colors, fonts and spacing automatically.',
    ar: 'يعمل نكسس كنطاق فرعي. اربطه بالموقع الأم ليرث ألوانه وخطوطه ومسافاته تلقائيًا.',
  },
  connect: { en: 'Sync from parent site', ar: 'مزامنة من الموقع الأم' },
  connected: { en: 'Theme inherited from parent site', ar: 'تم توريث المظهر من الموقع الأم' },
  reset: { en: 'Reset to defaults', ar: 'استعادة الافتراضي' },
  aiTitle: { en: 'Nexus Assistant', ar: 'مساعد نكسس' },
  aiSub: { en: 'Ask about any published blog, or anything else.', ar: 'اسأل عن أي مدونة منشورة أو أي شيء آخر.' },
  aiPlaceholder: { en: 'Message Nexus…', ar: 'اكتب رسالة لنكسس…' },
  send: { en: 'Send', ar: 'إرسال' },
  backToMain: { en: 'Back to main', ar: 'العودة للرئيسية' },
  decisionBanner: {
    en: 'You are reviewing this draft as an admin. Decide at the end of the article.',
    ar: 'أنت تراجع هذه المسودة كمسؤول. اتخذ قرارك في نهاية المقال.',
  },
  loggedInAs: { en: 'Signed in as', ar: 'مسجل الدخول باسم' },
  admin: { en: 'Admin', ar: 'مسؤول' },
  reader: { en: 'Reader', ar: 'قارئ' },
  adminOnly: { en: 'Log in as an admin to access this page.', ar: 'سجّل الدخول كمسؤول للوصول إلى هذه الصفحة.' },
  notFoundBlog: { en: 'This blog does not exist.', ar: 'هذه المدونة غير موجودة.' },
}
