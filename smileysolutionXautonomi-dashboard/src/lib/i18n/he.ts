// Hebrew UI strings — the single source of truth for all translated text.
// Analytics page uses its own inline Hebrew strings and is NOT imported here.

export const t = {
  brand: {
    name: "Content OS",
    studio: "Smiley Solution",
    live: "חי",
  },

  nav: {
    inbox:     { label: "תיבה נכנסת",  description: "עריכת תוכן נכנס"    },
    board:     { label: "לוח עבודה",   description: "צינור הפקה"          },
    gallery:   { label: "גלריה",       description: "תצוגת פיד"           },
    analytics: { label: "אנליטיקס",   description: "תובנות ביצועים"      },
    personas:  { label: "פרסונות",     description: "פרופילי לקוח"        },
  },

  inbox: {
    heading:       "תיבה נכנסת",
    subheading:    "עריכת תוכן נכנס · A אישור · R דחייה · S סימון · J/K ניווט",
    tabAll:        "הכל",
    tabStarred:    "מסומנים",
    tabToday:      "היום",
    addManually:   "הוסף ידנית",
    emptyTitle:    "תיבת הדואר ריקה",
    emptyBody:     "ScoutBot ימלא תוכן חדש אוטומטית",
    toastNew:      "תוכן חדש הגיע",
    toastApproved: "אושר — הועבר ללוח",
    toastRejected: "נדחה",
    toastAdded:    "תוכן נוסף — עיבוד AI בתהליך...",
    toastAddFail:  "שגיאה בהוספת תוכן",
    promptTitle:   "כותרת המאמר:",
    promptExcerpt: "הדבק קטע מהמאמר:",
  },

  inboxCard: {
    whyViral:     "למה זה ויראלי",
    engagements:  (n: number) => `${n} אינטרקציות`,
    match:        (n: number) => `${n}% התאמה`,
    reject:       "דחייה",
    approve:      "אישור",
    toastStarred: "סומן — חפש בפילטר המסומנים",
    toastFailed:  "הפעולה נכשלה — נסה שוב",
  },

  viralSignals: {
    high_engagement: { label: "מעורבות גבוהה",   emoji: "🔥" },
    trending_topic:  { label: "נושא טרנדי",      emoji: "📈" },
    thought_leader:  { label: "מוביל דעה",        emoji: "💡" },
    contrarian_take: { label: "דעה נגדית",        emoji: "⚡" },
    timely_news:     { label: "חדשות עדכניות",    emoji: "📰" },
  },

  board: {
    heading:         "לוח הפקה",
    subheading:      "תוכן מאושר בלבד · גרור להתקדמות",
    dropHere:        "גרור לכאן",
    toastMoveFailed: "שגיאה בהזזת הכרטיס — נסה שוב",
    columns: {
      draft:     "טיוטה",
      approved:  "מאושר",
      produced:  "הופק",
      published: "פורסם",
    },
  },

  gallery: {
    heading:    "גלריית פיד",
    subheading: (n: number) => `${n} פוסטים פורסמו · תצוגת אינסטגרם`,
    emptyTitle: "אין פוסטים שפורסמו עדיין",
    emptyBody:  "פרסם תוכן מהלוח כדי לראות תצוגה מקדימה",
  },

  personas: {
    heading:     "פרסונות לקוח",
    subheading:  "משמשות את ה-AI לכוון טון ומיקוד תוכן",
    toneProfile: "פרופיל טון",
    corePain:    "כאב מרכזי",
    exampleHook: "דוגמת הוק",
    loading:     "טוען...",
  },

  personaLabels: {
    analytical_ceo:      'מנכ"ל אנליטי',
    dreamer_founder:     "מייסד חולם",
    creative_director:   "מנהל קריאטיבי",
    growth_hacker:       "מומחה גדילה",
    lifestyle_visionary: "חוזה אורח חיים",
  } as Record<string, string>,

  statusLabels: {
    inbox:     "נכנסים",
    starred:   "מסומנים",
    draft:     "טיוטה",
    approved:  "מאושר",
    produced:  "הופק",
    published: "פורסם",
    archived:  "בארכיון",
  } as Record<string, string>,

  editor: {
    sourceLink:         "← מקור",
    moveTo:             "העבר ל...",
    save:               "שמור",
    saving:             "שומר...",
    feedCaptionLabel:   "כיתוב פיד (EN)",
    storiesLabel:       "תסריט סטוריז (HE)",
    visualLabel:        "כיוון ויזואלי",
    feedPlaceholder:    "כיתוב פיד לאינסטגרם באנגלית...",
    visualPlaceholder:  "הנחיית ויז'ואל לפוסט זה...",
    tabFeed:            "פיד",
    tabStories:         "סטוריז",
    captionPlaceholder: "הכיתוב יופיע כאן...",
    toastSaved:         "נשמר",
    toastSaveFailed:    "שמירה נכשלה",
    toastStatusUpdated: "סטטוס עודכן",
  },

  login: {
    title:            "Content OS",
    subtitle:         "Smiley Solution · פנימי",
    emailLabel:       "כתובת אימייל",
    emailPlaceholder: "you@smiley.studio",
    sendButton:       "שלח קישור כניסה",
    sending:          "שולח...",
    sentTitle:        "בדוק את תיבת הדואר",
    sentBody:         (email: string) => `שלחנו קישור כניסה ל-${email}`,
    wrongEmail:       "אימייל שגוי? נסה שוב",
    errors: {
      otp_expired:  "הקישור פג תוקף. הזן את האימייל שלך כדי לקבל קישור חדש.",
      access_denied: "קישור לא תקין או כבר נוצל. בקש קישור חדש.",
      fallback:     "משהו השתבש. בקש קישור חדש.",
    } as Record<string, string>,
  },

  actions: {
    edit: "← ערוך",
  },
} as const;
