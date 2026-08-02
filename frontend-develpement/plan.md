# UNESCO FactCheck — Component Plan
# UNESCO FactCheck — ကွန်ပိုနန့်များ စီမံကိန်း

> **Languages / ဘာသာစကားများ:** English 🇬🇧 · မြန်မာဘာသာ 🇲🇲  
> **Stack:** React 18 · TypeScript · Tailwind CSS · Vite  
> **File:** `src/App.tsx` + `src/index.css`

---

## 📁 Project Structure / ပရောဂျက် ဖွဲ့စည်းမှု

```
UNESCO/
├── index.html              ← Entry HTML / ဝင်ပေါက် HTML
├── tailwind.config.js      ← Design tokens / ဒီဇိုင်း ဆက်တင်များ
├── src/
│   ├── main.tsx            ← React root mount / React မူလ ချိတ်ဆက်မှု
│   ├── index.css           ← Global styles + animations / ကမ္ဘာ့ ပုံစံများ
│   └── App.tsx             ← All components (single-file) / ကွန်ပိုနန့်အားလုံး
```

---

## 🗺️ App State Machine / အက်ပ် အခြေအနေ ပြောင်းလဲမှု

The entire app flows through **3 states**:  
အက်ပ်တစ်ခုလုံးသည် **အခြေအနေ ၃ ခု** မှ ဖြတ်သန်းသည်

```
idle  ──[Check button clicked]──▶  checking  ──[2.4s timer]──▶  results
 ▲                                                                    │
 └─────────────────[Reset / "Check Another Claim"]───────────────────┘
```

| State `AppState` | What shows / ဘာပြသသည် |
|---|---|
| `idle` | Input panel + info strip |
| `checking` | Animated loading dots |
| `results` | 3 result cards + action buttons |

---

## 🔤 TypeScript Types / TypeScript အမျိုးအစားများ

### `InputMode`
```ts
type InputMode = 'screenshot' | 'link' | 'youtube';
```
Controls which tab/input is active / မည်သည့် tab မျိုး ဖွင့်ထားသည်ကို ထိန်းချုပ်သည်

### `Verdict`
```ts
type Verdict = 'TRUE' | 'FALSE' | 'MISLEADING';
```
The three possible fact-check outcomes / စစ်ဆေးချက် ရလဒ် ၃ မျိုး

### `AppState`
```ts
type AppState = 'idle' | 'checking' | 'results';
```

### `ResultCard` interface
```ts
interface ResultCard {
  verdict:       Verdict;
  claim:         string;   // Main headline / ခေါင်းစဉ်
  detail:        string;   // Explanation text / ရှင်းလင်းချက်
  scores: {
    sourcesAgree:     number;  // 0–100
    expertConsensus:  number;  // 0–100
    evidenceStrength: number;  // 0–100
  };
  sources:       string[];     // Source names / အရင်းအမြစ်များ
  expertSummary: string;       // Expert quote / ကျွမ်းကျင်သူ ဆိုချက်
}
```

---

## 🧩 Components / ကွန်ပိုနန့်များ

---

### 1. `ProgressBar` — Animated Score Bar / အမှတ် ဘား

**Location / တည်နေရာ:** `src/App.tsx` lines 76–98

**Purpose (EN):** A single animated horizontal bar that starts at 0% and grows to the target `value` when the component mounts.  
**ရည်ရွယ်ချက် (မြန်မာ):** ကွန်ပိုနန့် တင်သောအခါ 0% မှ `value`% သို့ ပြောင်းလဲသည့် animated ဘားဖြစ်သည်။

**Props:**
| Prop | Type | Description (EN) | ဖော်ပြချက် (မြန်မာ) |
|------|------|---|---|
| `value` | `number` | Target % (0–100) | ပစ်မှတ် ရာခိုင်နှုန်း |
| `color` | `string` | CSS color string | ဘားအရောင် |

**How it works / လုပ်ဆောင်ပုံ:**
1. Uses `useRef` to get DOM reference / DOM ကို `useRef` ဖြင့် ရည်ညွှန်းသည်
2. `useEffect` fires 80ms after mount to trigger CSS transition / 80ms နောက်မှ CSS animation ဖြစ်စေသည်
3. CSS class `.progress-bar-fill` has `transition: width 1.4s cubic-bezier(...)` / CSS တွင် `1.4s` animation ထည့်ထားသည်

```tsx
// Usage example / သုံးသောပုံ
<ProgressBar value={92} color="#22c55e" />
```

---

### 2. `ResultCardView` — Result Card / ရလဒ်ကတ်

**Location / တည်နေရာ:** `src/App.tsx` lines 101–176

**Purpose (EN):** Displays a single fact-check result with verdict badge, claim text, three animated progress bars, expert summary, and source chips.  
**ရည်ရွယ်ချက် (မြန်မာ):** စစ်ဆေးချက် ရလဒ်တစ်ခုကို verdict badge, claim စာသား, animated ဘား ၃ ခု, ကျွမ်းကျင်သူ အကျဉ်းချုပ်နှင့် အရင်းအမြစ်ကတ်များဖြင့် ပြသသည်။

**Props:**
| Prop | Type | Description (EN) | ဖော်ပြချက် (မြန်မာ) |
|------|------|---|---|
| `card` | `ResultCard` | The data object | ဒေတာ အရာဝတ္တု |
| `delay` | `number` (opt) | Stagger delay (1, 2, or 3) | Stagger နှောင့်နှေးချိန် |

**Visual anatomy / မြင်ကွင်း ဖွဲ့စည်းမှု:**

```
┌─────────────────────────────┐
│ [VERDICT BADGE]             │  ← green/red/orange pill
│ Claim headline text         │  ← card.claim
│ Short explanation           │  ← card.detail
├─────────────────────────────┤
│ HOW CONFIDENT ARE WE?       │
│  Sources agree    ████ 92%  │  ← ProgressBar × 3
│  Expert consensus ████ 88%  │
│  Evidence strength███ 84%   │
├─────────────────────────────┤
│ WHAT THE EXPERTS SAY        │
│  "Expert summary text..."   │  ← card.expertSummary
├─────────────────────────────┤
│ SOURCES CONSULTED           │
│  ⊙ WHO  ⊙ CDC  ⊙ Reuters   │  ← card.sources (chips)
└─────────────────────────────┘
```

**Verdict CSS classes / Verdict CSS အတန်းများ:**
| Verdict | CSS class | Background | Border |
|---|---|---|---|
| `TRUE` | `.result-card.true` | Green gradient | `#86efac` |
| `FALSE` | `.result-card.false` | Red gradient | `#fca5a5` |
| `MISLEADING` | `.result-card.misleading` | Orange gradient | `#fdba74` |

---

### 3. `CheckingView` — Loading State / တင်နေသော အခြေအနေ

**Location / တည်နေရာ:** `src/App.tsx` lines 179–193

**Purpose (EN):** Shown while fact-checking is in progress. Displays 3 pulsing dots and status text.  
**ရည်ရွယ်ချက် (မြန်မာ):** စစ်ဆေးနေစဉ် ပြသသည်။ လှပ်နေသော အစက် ၃ ခုနှင့် အခြေအနေ စာသား ပြသသည်။

**Animation / animation:**  
`.pulse-dot` uses `@keyframes pulse-anim` with `animation-delay` stagger (0s, 0.2s, 0.4s) for a wave effect.  
wave effect အတွက် delay ပေါင်းထည့်ထားသည်

**No props** — purely presentational / props မလိုအပ်ဘဲ ပြသသာ ကွန်ပိုနန့်

---

### 4. `App` (main) — Root Component / မူလ ကွန်ပိုနန့်

**Location / တည်နေရာ:** `src/App.tsx` lines 198–595

This is the **single parent** that manages all state and renders every section.  
ဤသည်မှာ state အားလုံးကို စီမံပြီး မျက်နှာပြင် section အားလုံးကို ပြသသည့် **မိဘ ကွန်ပိုနန့်** ဖြစ်သည်။

#### State variables / State ပြောင်းလဲမှု အမည်များ

| Variable | Type | Purpose (EN) | ရည်ရွယ်ချက် (မြန်မာ) |
|---|---|---|---|
| `inputMode` | `InputMode` | Which tab is active | မည်သည့် tab ဖွင့်ထားသည် |
| `linkText` | `string` | Text/link input value | link tab ထည့်သွင်းမှု |
| `youtubeUrl` | `string` | YouTube URL value | YouTube URL တန်ဖိုး |
| `freeText` | `string` | Free-type claim text | လက်ဖြင့် ရိုက်ထည့်သော claim |
| `fileName` | `string` | Uploaded file name | တင်ထားသော ဖိုင်အမည် |
| `previewUrl` | `string\|null` | Object URL for preview | ပုံကြိုကြည့်ရှုရန် URL |
| `appState` | `AppState` | Global screen state | မျက်နှာပြင် အခြေအနေ |
| `dragOver` | `boolean` | Drop zone highlight | Drag ဖြင့် ချထားသောအခါ highlight |

#### Event handlers / ဖြစ်ရပ် ထိန်းချုပ်သူများ

| Function | Trigger | Action (EN) | လုပ်ဆောင်ချက် (မြန်မာ) |
|---|---|---|---|
| `handleCheck()` | "Check" button | Sets state to `checking` → after 2.4s → `results` | စစ်ဆေးမှု စတင်သည် |
| `handleReset()` | "Check Another" | Clears all inputs, back to `idle` | ထည့်သွင်းမှုများ ရှင်းလင်းပြီး `idle` ပြန်သည် |
| `handleFileSelect(file)` | File input change | Stores name + creates object URL preview | ဖိုင်အမည်နှင့် preview ပြသသည် |
| `handleDrop(e)` | Drag-and-drop | Validates image type, calls `handleFileSelect` | Drag ဖြင့် ချထားသောအခါ စစ်ဆေးသည် |

#### Rendered sections / ပြသသော ကဏ္ဍများ

```
App
 ├── <header>         Navigation bar
 ├── <main>
 │    ├── Hero title  (always shown)
 │    ├── Input Panel (appState === 'idle')
 │    │    ├── Tab bar (screenshot / link / youtube)
 │    │    ├── Tab content (conditional on inputMode)
 │    │    └── "Check If This is True" button
 │    ├── CheckingView (appState === 'checking')
 │    ├── Results Grid (appState === 'results')
 │    │    ├── ResultCardView × 3
 │    │    └── Action buttons (reset + share)
 │    └── Info Strip   (appState === 'idle')
 └── <footer>
```

---

### 5. Header / ခေါင်းစဉ် Navigation

**Purpose (EN):** Dark blue navigation bar with UNESCO branding, logo shield, and nav links.  
**ရည်ရွယ်ချက် (မြန်မာ):** UNESCO အမှတ်တံဆိပ်ပါ အပြာရောင် navigation bar — logo shield နှင့် nav link များ ပါဝင်သည်။

CSS class: `.app-header` — `background: linear-gradient(135deg, #1e3a5f → #0f2847 → #1a3a6b)`

---

### 6. Tab Selector / Tab ရွေးချယ်ကိရိယာ

Three tabs rendered from a config array:  
Config array မှ tab ၃ ခု ဖန်တီးသည်

| Tab ID | Label (EN) | Label (မြန်မာ) | Icon | Content shown |
|---|---|---|---|---|
| `screenshot` | Screenshot | ဓာတ်ပုံ ရိုက်ကူး/တင် | Image icon | Drag-drop upload zone |
| `link` | Website Link | ဝက်ဘ်ဆိုက် လင့် | Globe icon | Textarea + Paste button |
| `youtube` | Type It In | ရိုက်ထည့်ပါ | YouTube icon | Claim textarea + YouTube URL |

Active tab styling: `.input-tab.active` → blue background `#3b82f6` with glow shadow  
Active tab ပုံစံ: `.input-tab.active` → အပြာရောင် နောက်ခံ `#3b82f6`

---

### 7. Screenshot Drop Zone / ဓာတ်ပုံ Drop Zone

**Purpose (EN):** Supports click-to-upload AND drag-and-drop. Shows image thumbnail preview with a remove button once a file is selected.  
**ရည်ရွယ်ချက် (မြန်မာ):** Click နှိပ်၍ တင်ခြင်း နှင့် drag-and-drop နှစ်မျိုးလုံး ပံ့ပိုးသည်။

**States:**
- **Empty** → Upload icon + instruction text
- **Filled** → `<img>` thumbnail + `✕` remove button + file name

---

### 8. Info Strip / သတင်းအချက်အလက် ကမ်းလမ်းမှု

Three feature cards shown only in `idle` state:

| Icon | Title (EN) | Title (မြန်မာ) |
|---|---|---|
| ⚡ | Instant results | ချက်ချင်း ရလဒ်များ |
| 🔬 | Expert consensus | ကျွမ်းကျင်သူ သဘောထား |
| 🛡️ | Privacy-first | ကိုယ်ရေးကိုယ်တာ ဦးစားပေး |

---

## 🎨 CSS Architecture / CSS တည်ဆောက်မှု

| CSS Class | Purpose (EN) | ရည်ရွယ်ချက် (မြန်မာ) |
|---|---|---|
| `.progress-bar-track` | Grey pill track | မီးခိုးရောင် ဘား နောက်ခံ |
| `.progress-bar-fill` | Animated colored fill | အရောင် ဖြည့် animation |
| `.input-tab` | Tab button base style | Tab ခလုတ် မူလ ပုံစံ |
| `.input-tab.active` | Blue active tab | ဖွင့်ထားသော tab (အပြာ) |
| `.drop-zone` | Dashed upload area | Dashed upload နေရာ |
| `.btn-primary` | Blue CTA button | CTA ခလုတ် (အပြာ) |
| `.result-card` | Base card container | ရလဒ်ကတ် မူလ ပုံသဏ္ဍာန် |
| `.result-card.true` | Green card | အစိမ်းရောင် ကတ် |
| `.result-card.false` | Red card | အနီရောင် ကတ် |
| `.result-card.misleading` | Orange card | လိမ္မော်ရောင် ကတ် |
| `.verdict-badge` | Pill label badge | Verdict pill |
| `.source-chip` | Source pill | အရင်းအမြစ် pill |
| `.app-header` | Dark blue nav bar | Navigation bar |
| `.pulse-dot` | Loading animation dot | Loading animation |

### Color Palette / အရောင် ပါလက်

| Color | Hex | Usage (EN) | အသုံးပြုပုံ (မြန်မာ) |
|---|---|---|---|
| Blue 500 | `#3b82f6` | Tabs, CTA button, focus rings | Tab, ခလုတ်, focus |
| Green 500 | `#22c55e` | TRUE verdict bars | TRUE verdict |
| Red 500 | `#ef4444` | FALSE verdict bars | FALSE verdict |
| Orange 500 | `#f97316` | MISLEADING verdict bars | MISLEADING verdict |
| Navy `#1e3a5f` | — | Header background | Header နောက်ခံ |
| Slate 50–950 | — | Text, borders, backgrounds | စာသား, နယ်နိမိတ် |

---

## 🌐 Myanmar + English Language Support Plan
## မြန်မာ + အင်္ဂလိပ် ဘာသာစကား ထောက်ပံ့မှု စီမံကိန်း

### Strategy / နည်းလမ်း

Use a **React Context + translation dictionary** — no external library needed.  
**React Context + translation dictionary** ကို သုံးသည် — ပြင်ပ library မလိုဘဲ။

### Step 1 — Create `src/i18n.ts`

```ts
export type Lang = 'en' | 'my';

export const translations = {
  en: {
    appName:           'FactCheck',
    appTagline:        'UNESCO Media Literacy',
    navHowItWorks:     'How it works',
    navResources:      'Resources',
    navAbout:          'About',
    heroBadge:         'AI-Powered Fact Checking',
    heroTitle:         'Is this claim actually true?',
    heroSubtitle:      'Upload a screenshot, paste a headline or share a YouTube link...',
    howToCheck:        'How would you like to check?',
    tabScreenshot:     'Screenshot',
    tabScreenshotSub:  'Paste or Upload',
    tabLink:           'Website Link',
    tabLinkSub:        'Paste the URL',
    tabType:           'Type It In',
    tabTypeSub:        'Write the claim',
    dropInstruction:   'Tap to snap or upload image',
    dropSub:           'Upload photo or screenshot',
    dropFormats:       'JPEG, PNG, WEBP accepted · Max 10MB',
    linkLabel:         'Paste texts and the links to the article or video here',
    linkPlaceholder:   'Enter or paste the link or text',
    pasteBtnLabel:     'Paste',
    clearBtnLabel:     'Clear',
    typeLabel:         'Type or paste the claim or headline here',
    youtubeLabel:      'Or paste a YouTube URL',
    youtubePlaceholder:'https://www.youtube.com/watch?v=...',
    checkBtn:          'Check If This is True',
    checkingText:      'Checking sources…',
    checkingSubtext:   'Consulting against verified databases',
    analysisComplete:  'Analysis complete',
    foundResults:      'We found 3 possible interpretations of your claim.',
    checkAnotherBtn:   'Check Another Claim',
    shareBtn:          'Share Results',
    howConfident:      'How confident are we?',
    sourcesAgree:      'Sources agree',
    expertConsensus:   'Expert consensus',
    evidenceStrength:  'Evidence strength',
    whatExpertsSay:    'What the experts say',
    sourcesConsulted:  'Sources consulted',
    verdictTrue:       'TRUE',
    verdictFalse:      'FALSE',
    verdictMisleading: 'MISLEADING',
    infoInstant:       'Instant results',
    infoInstantDesc:   'AI analysis in under 3 seconds',
    infoExpert:        'Expert consensus',
    infoExpertDesc:    'Cross-referenced with 50+ sources',
    infoPrivacy:       'Privacy-first',
    infoPrivacyDesc:   'Your data is never stored',
    footerOrg:         'UNESCO Media & Information Literacy',
    footerPrivacy:     'Privacy Policy',
    footerTerms:       'Terms of Use',
    footerDisclaimer:  'For educational and awareness purposes only.',
  },

  my: {
    appName:           'FactCheck',
    appTagline:        'UNESCO မီဒီယာ မှတ်ဆပ်ပညာ',
    navHowItWorks:     'မည်သို့ အလုပ်လုပ်သနည်း',
    navResources:      'အရင်းအမြစ်များ',
    navAbout:          'အကြောင်းအရာ',
    heroBadge:         'AI အားဖြင့် အချက်အလက် စစ်ဆေးခြင်း',
    heroTitle:         'ဤ claim သည် မှန်ပါသလား?',
    heroSubtitle:      'ဓာတ်ပုံတင်ရန်၊ ခေါင်းစဉ် ကူးထည့်ရန် သို့မဟုတ် YouTube link မျှဝေရန် — claim သည် မှန်ကြောင်း ချက်ချင်း ရှာဖွေပါ။',
    howToCheck:        'မည်သို့ စစ်ဆေးလိုသနည်း?',
    tabScreenshot:     'ဓာတ်ပုံ',
    tabScreenshotSub:  'ကူးထည့် / တင်ပါ',
    tabLink:           'ဝက်ဘ်ဆိုက် လင့်',
    tabLinkSub:        'URL ကူးထည့်ပါ',
    tabType:           'ရိုက်ထည့်ပါ',
    tabTypeSub:        'Claim ရေးပါ',
    dropInstruction:   'ဓာတ်ပုံ ရိုက်ကူး သို့ တင်ရန် နှိပ်ပါ',
    dropSub:           'ဓာတ်ပုံ သို့ screenshot တင်ပါ',
    dropFormats:       'JPEG, PNG, WEBP လက်ခံသည် · အများဆုံး 10MB',
    linkLabel:         'ဆောင်းပါး သို့ ဗီဒီယိုသို့ link နှင့် စာသားများ ကူးထည့်ပါ',
    linkPlaceholder:   'Link သို့ စာသား ထည့်ပါ',
    pasteBtnLabel:     'ကူးထည့်',
    clearBtnLabel:     'ဖယ်ရှားပါ',
    typeLabel:         'Claim သို့ ခေါင်းစဉ် ရိုက် သို့ ကူးထည့်ပါ',
    youtubeLabel:      'သို့မဟုတ် YouTube URL ကူးထည့်ပါ',
    youtubePlaceholder:'https://www.youtube.com/watch?v=...',
    checkBtn:          'မှန်မှားစစ်ဆေးပါ',
    checkingText:      'အရင်းအမြစ်များ စစ်ဆေးနေသည်…',
    checkingSubtext:   'အတည်ပြုထားသော ဒေတာဘေ့စ်များနှင့် နှိုင်းယှဉ်နေသည်',
    analysisComplete:  'စစ်ဆေးမှု ပြီးပြည့်စုံသည်',
    foundResults:      'သင့် claim နှင့် ပတ်သက်၍ ဖြစ်နိုင်ချေ ၃ ခု တွေ့ရှိသည်။',
    checkAnotherBtn:   'အခြား Claim စစ်ဆေးပါ',
    shareBtn:          'ရလဒ်များ မျှဝေပါ',
    howConfident:      'ကျွန်ုပ်တို့ မည်မျှ ယုံကြည်သနည်း?',
    sourcesAgree:      'အရင်းအမြစ်များ သဘောတူသည်',
    expertConsensus:   'ကျွမ်းကျင်သူ သဘောထား',
    evidenceStrength:  'သက်သေ အားကောင်းမှု',
    whatExpertsSay:    'ကျွမ်းကျင်သူများ ဘာဆိုသနည်း',
    sourcesConsulted:  'ကြည့်ရှုထားသော အရင်းအမြစ်များ',
    verdictTrue:       'မှန်သည်',
    verdictFalse:      'မှားသည်',
    verdictMisleading: 'လမ်းလွဲစေသည်',
    infoInstant:       'ချက်ချင်း ရလဒ်',
    infoInstantDesc:   'AI စစ်ဆေးမှု ၃ စက္ကန့်အတွင်း',
    infoExpert:        'ကျွမ်းကျင်သူ သဘောထား',
    infoExpertDesc:    'အရင်းအမြစ် ၅၀ ကျော်နှင့် နှိုင်းယှဉ်သည်',
    infoPrivacy:       'ကိုယ်ရေးကိုယ်တာ ဦးစားပေး',
    infoPrivacyDesc:   'သင့်ဒေတာကို သိမ်းဆည်းမည် မဟုတ်ပါ',
    footerOrg:         'UNESCO မီဒီယာ နှင့် သတင်းအချက်အလက် မှတ်ဆပ်ပညာ',
    footerPrivacy:     'ကိုယ်ရေးကိုယ်တာ မူဝါဒ',
    footerTerms:       'အသုံးပြုမှု သတ်မှတ်ချက်',
    footerDisclaimer:  'ပညာရေး နှင့် သတိပေးမှု ရည်ရွယ်ချက်အတွက် သာ ဖြစ်သည်။',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;
```

---

### Step 2 — Create `src/LangContext.tsx`

```tsx
import { createContext, useContext, useState, ReactNode } from 'react';
import { Lang, translations, TranslationKey } from './i18n';

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LangContext = createContext<LangCtx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');
  const t = (key: TranslationKey) => translations[lang][key];
  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be inside LangProvider');
  return ctx;
}
```

---

### Step 3 — Language Toggle in Header / Header တွင် ဘာသာ ပြောင်းလဲကိရိယာ

```tsx
const { lang, setLang, t } = useLang();

// Inside <header>:
<button
  onClick={() => setLang(lang === 'en' ? 'my' : 'en')}
  className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-sm
             font-medium hover:bg-white/20 transition"
  id="lang-toggle-btn"
>
  {lang === 'en' ? '🇲🇲 မြန်မာ' : '🇬🇧 English'}
</button>
```

---

### Step 4 — Replace strings with `t()` / `t()` ဖြင့် အစားထိုး

```tsx
// Before / မတိုင်မီ
<p>How would you like to check?</p>

// After / ပြီးနောက်
<p>{t('howToCheck')}</p>
```

---

### Step 5 — Wrap in `<LangProvider>` (`src/main.tsx`)

```tsx
import { LangProvider } from './LangContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LangProvider>
      <App />
    </LangProvider>
  </React.StrictMode>
);
```

---

### Step 6 — Myanmar Font / မြန်မာ ဖောင့်

**`index.html` `<head>`:**
```html
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Myanmar:wght@400;500;600;700&display=swap" rel="stylesheet">
```

**`index.css`:**
```css
body {
  font-family: 'Inter', 'Noto Sans Myanmar', sans-serif;
}
```

---

## 🔧 Data Flow Summary / ဒေတာ စီးဆင်းမှု

```
User Action (click / type / drop)
        │
        ▼
  useState setters in App()
        │
        ▼
  Re-render triggers
        │
   ┌────┴─────┐
   │          │
Idle UI   handleCheck()
              │
              ▼
        setAppState('checking')
              │
         setTimeout 2400ms
              │
              ▼
        setAppState('results')
              │
              ▼
    ResultCardView × 3 render
              │
              ▼
    ProgressBar useEffect fires
    → fills bar 0% → value%
```

---

## 📋 i18n Checklist / i18n လုပ်ဆောင်ရမည့် အဆင့်များ

- [ ] Create `src/i18n.ts` with all translation keys
- [ ] Create `src/LangContext.tsx` with `LangProvider` + `useLang`
- [ ] Update `src/main.tsx` → wrap `<App>` in `<LangProvider>`
- [ ] Add language toggle button to `<header>`
- [ ] Replace all hardcoded strings with `t('key')`
- [ ] Add Noto Sans Myanmar font link in `index.html`
- [ ] Update `body` font-family in `index.css`
- [ ] Set `<html lang="my">` or `<html lang="en">` dynamically
- [ ] Test both languages render correctly

---

*Generated for UNESCO FactCheck · React 18 + TypeScript + Tailwind CSS*  
*UNESCO FactCheck အတွက် ဖန်တီးထားသည်*
