import { useEffect, useRef, useState } from 'react';

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────
type InputMode = 'screenshot' | 'link' | 'youtube';
type Verdict   = 'TRUE' | 'FALSE' | 'MISLEADING';
type AppState  = 'idle' | 'checking' | 'results';

interface ResultCard {
  verdict:  Verdict;
  claim:    string;
  detail:   string;
  scores: {
    sourcesAgree:      number;
    expertConsensus:   number;
    evidenceStrength:  number;
  };
  sources:       string[];
  expertSummary: string;
}

// ────────────────────────────────────────────────────────────
// Demo result data (mirrors the design screenshots)
// ────────────────────────────────────────────────────────────
const DEMO_RESULTS: ResultCard[] = [
  {
    verdict: 'FALSE',
    claim:   'This is False- vaccines do not contain microchips.',
    detail:  'The claim has no scientific basis. Microchips are far too large to fit through vaccine needles, and official ingredients are publicly tracked.',
    scores:  { sourcesAgree: 98, expertConsensus: 100, evidenceStrength: 85 },
    sources: ['World Health Organization (WHO)', 'Centers for Disease Control (CDC)', 'Reuters Fact Check'],
    expertSummary:
      'COVID-19 vaccines contain mRNA or viral vectors, lipids, salts, and sugars. None of the FDA- or WHO-approved vaccine components include nanotechnology or tracking equipment.',
  },
  {
    verdict: 'TRUE',
    claim:   'This is True- Washing hands with soap prevents the spreas of illness',
    detail:  'This is correct. Washing your hands regularly is one of the most effective ways to stay healthy.',
    scores:  { sourcesAgree: 98, expertConsensus: 100, evidenceStrength: 85 },
    sources: ['World Health Organization (WHO)', 'Centers for Disease Control (CDC)', 'NHS (UK)'],
    expertSummary:
      'The CDC and WHO both confirm that washing hands with soap and water for at least 20 seconds removes germs including bacteria and viruses that cause disease.',
  },
  {
    verdict: 'MISLEADING',
    claim:   'This is Misleading- coffee does not clearly cause cancer.',
    detail:  'This claim is partly true but missing important context. Be careful before sharing it.',
    scores:  { sourcesAgree: 98, expertConsensus: 100, evidenceStrength: 85 },
    sources: ['World Health Organization (WHO)', 'Centers for Disease Control (CDC)', 'NHS (UK)'],
    expertSummary:
      'The World Health Organization removed coffee from its list of possible carcinogens in 2016 after reviewing hundreds of studies.',
  },
];

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────
const verdictMeta: Record<Verdict, { color: string; barColor: string }> = {
  TRUE:       { color: '#16a34a', barColor: '#22c55e' },
  FALSE:      { color: '#dc2626', barColor: '#ef4444' },
  MISLEADING: { color: '#d97706', barColor: '#f97316' },
};

const progressFields: { key: keyof ResultCard['scores']; label: string }[] = [
  { key: 'sourcesAgree',     label: 'Sources agree'     },
  { key: 'expertConsensus',  label: 'Expert consensus'  },
  { key: 'evidenceStrength', label: 'Evidence strength' },
];

// ────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────

/** Animated progress bar that fills on mount */
function ProgressBar({ value, color }: { value: number; color: string }) {
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = fillRef.current;
    if (!el) return;
    // Small delay so CSS transition triggers
    const id = setTimeout(() => {
      el.style.width = `${value}%`;
    }, 80);
    return () => clearTimeout(id);
  }, [value]);

  return (
    <div className="progress-bar-track">
      <div
        ref={fillRef}
        className="progress-bar-fill"
        style={{ background: color, width: '0%' }}
      />
    </div>
  );
}

/** Single result card — matches the mobile design */
function ResultCardView({
  card,
  delay = 0,
  submittedPreview,
  submittedText,
  submittedMode,
  submittedLink,
}: {
  card: ResultCard;
  delay?: number;
  submittedPreview: string | null;
  submittedText: string;
  submittedMode: InputMode;
  submittedLink: string;
}) {
  const meta = verdictMeta[card.verdict];
  const delayStyle = { animationDelay: `${delay * 0.12}s` };
  const [showPopup, setShowPopup] = useState(false);

  const showImage = submittedMode === 'screenshot' && !!submittedPreview;
  const showLink  = submittedMode === 'link' && submittedLink.trim().startsWith('http');
  const previewText = submittedText ||
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';
  const previewLink = submittedLink || 'https://www.youtube.com/';
  const isYoutube   = previewLink.includes('youtube.com') || previewLink.includes('youtu.be');

  return (
    <>
      {/* Full-text pop-up */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowPopup(false)}>
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="relative bg-blue-50 rounded-2xl p-5 max-w-sm w-full max-h-72 overflow-y-auto shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 w-7 h-7 rounded-full border border-slate-300 bg-white flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors text-sm"
              onClick={() => setShowPopup(false)}
            >
              ✕
            </button>
            <p className="text-sm text-slate-700 leading-relaxed pr-6">{previewText}</p>
          </div>
        </div>
      )}

      <article className="result-card" style={delayStyle}>

        {/* Verdict + Claim */}
        <div className="p-5 pb-4">
          <p className="text-sm font-black uppercase tracking-widest mb-2" style={{ color: meta.color }}>
            {card.verdict}
          </p>
          <h3 className="text-base font-bold text-gray-900 leading-snug mb-3">
            {card.claim}
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            {card.detail}
          </p>
        </div>

        {/* You asked us to check */}
        <div className="mx-4 mb-4 bg-gray-100 rounded-2xl p-4">
          <p className="text-sm text-gray-500 text-center mb-3">You asked us to check.</p>

          {showImage && (
            <div className="flex justify-center">
              <img
                src={submittedPreview!}
                alt="Submitted screenshot"
                className="rounded-xl max-h-44 object-cover shadow-sm"
              />
            </div>
          )}

          {showLink && (
            <>
              {isYoutube ? (
                <div
                  className="h-28 flex items-center justify-center rounded-xl mb-3"
                  style={{ background: 'linear-gradient(135deg, #fef08a, #fda4af, #e879f9)' }}
                >
                  <svg viewBox="0 0 90 20" width="120" height="27" xmlns="http://www.w3.org/2000/svg">
                    <path d="M27.9727 3.12324C27.6435 1.89323 26.6768 0.926623 25.4468 0.597366C23.2197 2.24288e-07 14.285 0 14.285 0C14.285 0 5.35042 2.24288e-07 3.12323 0.597366C1.89323 0.926623 0.926623 1.89323 0.597366 3.12324C2.24288e-07 5.35042 0 10 0 10C0 10 2.24288e-07 14.6496 0.597366 16.8768C0.926623 18.1068 1.89323 19.0734 3.12323 19.4026C5.35042 20 14.285 20 14.285 20C14.285 20 23.2197 20 25.4468 19.4026C26.6768 19.0734 27.6435 18.1068 27.9727 16.8768C28.5701 14.6496 28.5701 10 28.5701 10C28.5701 10 28.5677 5.35042 27.9727 3.12324Z" fill="#FF0000"/>
                    <path d="M11.4253 14.2854L18.8477 10.0004L11.4253 5.71533V14.2854Z" fill="white"/>
                    <path d="M34.6024 13.0036L31.3945 1.41846H34.1932L35.3174 6.6701C35.6043 7.96361 35.8136 9.06662 35.95 9.97913H36.0323C36.1264 9.32532 36.3381 8.22937 36.665 6.68892L37.8291 1.41846H40.6278L37.3799 13.0036V18.561H34.6001V13.0036H34.6024Z" fill="black"/>
                    <path d="M41.4697 18.1937C40.9016 17.8127 40.496 17.2636 40.2527 16.5458C40.007 15.8269 39.8854 14.8764 39.8854 13.6912V11.3282C39.8854 10.1288 40.0235 9.16788 40.2996 8.44956C40.5758 7.73124 41.0015 7.20056 41.5743 6.85754C42.1483 6.51452 42.9056 6.34301 43.8461 6.34301C44.7701 6.34301 45.5109 6.51452 46.0695 6.85754C46.6269 7.20056 47.0409 7.73124 47.3101 8.44956C47.5804 9.16788 47.7138 10.1288 47.7138 11.3282V13.6912C47.7138 14.8764 47.5816 15.8292 47.3183 16.5458C47.0551 17.2636 46.6446 17.8127 46.0861 18.1937C45.5264 18.5747 44.7772 18.7651 43.8296 18.7651C42.8655 18.7651 42.1014 18.5747 41.4697 18.1937ZM44.9282 16.2457C45.0969 15.8162 45.1801 15.1136 45.1801 14.1378V10.8626C45.1801 9.91194 45.0969 9.21694 44.9282 8.78337C44.7595 8.35217 44.4539 8.13657 44.0115 8.13657C43.5857 8.13657 43.2895 8.35217 43.1161 8.78337C42.9439 9.21694 42.857 9.91194 42.857 10.8626V14.1378C42.857 15.1136 42.9415 15.8162 43.1078 16.2457C43.2764 16.6763 43.5786 16.8916 44.0115 16.8916C44.4539 16.8916 44.7595 16.6763 44.9282 16.2457Z" fill="black"/>
                  </svg>
                </div>
              ) : (
                <div className="h-20 rounded-xl bg-gradient-to-r from-blue-100 to-purple-100 mb-3 flex items-center justify-center">
                  <span className="text-2xl">🌐</span>
                </div>
              )}
              <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 text-xs text-gray-500">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                <span className="truncate">{previewLink}</span>
              </div>
            </>
          )}

          {!showImage && !showLink && (
            <div
              className="relative bg-blue-100 rounded-xl p-3 cursor-pointer"
              onClick={() => setShowPopup(true)}
            >
              <p className="text-sm text-gray-700 leading-relaxed line-clamp-5 pr-6">
                {previewText}
              </p>
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                onClick={(e) => { e.stopPropagation(); setShowPopup(true); }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                  <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Confidence bars */}
        <div className="mx-4 mb-4 bg-gray-100 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-4 leading-snug">
            These bars show how strongly trusted sources agree on this claim.
          </p>
          <div className="space-y-3">
            {progressFields.map((field) => {
              const val = card.scores[field.key];
              return (
                <div key={field.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-700">{field.label}</span>
                    <span className="text-xs font-semibold text-gray-700">{val}%</span>
                  </div>
                  <ProgressBar value={val} color={meta.barColor} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Sources */}
        <div className="mx-4 mb-5 bg-gray-100 rounded-2xl p-4">
          <p className="text-sm text-gray-700 mb-3">Sources consulted:</p>
          <div className="flex flex-col gap-2">
            {card.sources.map((src) => (
              <span
                key={src}
                className="px-4 py-2 rounded-xl bg-gray-200 text-sm text-gray-600 font-medium"
              >
                {src}
              </span>
            ))}
          </div>
        </div>
      </article>
    </>
  );
}

// ────────────────────────────────────────────────────────────
// Main App
// ────────────────────────────────────────────────────────────
export default function App() {
  const [inputMode,    setInputMode]    = useState<InputMode>('screenshot');
  const [linkText,     setLinkText]     = useState('');
  const [youtubeUrl,   setYoutubeUrl]   = useState('');
  const [freeText,     setFreeText]     = useState('');
  const [fileName,     setFileName]     = useState('');
  const [previewUrl,   setPreviewUrl]   = useState<string | null>(null);
  const [appState,     setAppState]     = useState<AppState>('idle');
  const [dragOver,     setDragOver]     = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Snapshot of what was submitted (for result card previews)
  const [submittedPreview, setSubmittedPreview] = useState<string | null>(null);
  const [submittedText,    setSubmittedText]    = useState('');
  const [submittedLink,    setSubmittedLink]    = useState('');
  const [submittedMode,    setSubmittedMode]    = useState<InputMode>('screenshot');

  // Simulate a check — 2-second mock API (preserved exactly)
  function handleCheck() {
    setSubmittedPreview(previewUrl);
    setSubmittedText(freeText || linkText);
    setSubmittedLink(youtubeUrl || linkText);
    setSubmittedMode(inputMode);
    setAppState('checking');
    setTimeout(() => setAppState('results'), 2400);
  }

  function handleReset() {
    setAppState('idle');
    setLinkText('');
    setYoutubeUrl('');
    setFreeText('');
    setFileName('');
    setPreviewUrl(null);
    setSubmittedPreview(null);
    setSubmittedText('');
    setSubmittedLink('');
  }

  function handleFileSelect(file: File) {
    setFileName(file.name);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFileSelect(file);
  }

  const canSubmit =
    (inputMode === 'screenshot' && !!fileName) ||
    (inputMode === 'link'       && linkText.trim().length > 0) ||
    (inputMode === 'youtube'    && youtubeUrl.trim().length > 0);

  // The active text value for the Link or Text tab
  const activeText    = inputMode === 'link' ? linkText    : freeText;
  const setActiveText = (v: string) => inputMode === 'link' ? setLinkText(v) : setFreeText(v);

  // Shared tab UI (used in idle + checking)
  const TabRow = ({ activeId }: { activeId: InputMode }) => (
    <div className="flex gap-3 mb-5">
      <div
        className={`flex-1 flex flex-col items-center gap-1.5 py-4 rounded-2xl border-2 ${
          activeId === 'screenshot'
            ? 'bg-blue-200 border-blue-400 text-gray-800'
            : 'bg-white border-blue-300 text-gray-600'
        }`}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <span className="text-sm font-semibold">Screenshot</span>
        <span className="text-xs text-gray-500">Paste or Upload</span>
      </div>
      <div
        className={`flex-1 flex flex-col items-center gap-1.5 py-4 rounded-2xl border-2 ${
          activeId !== 'screenshot'
            ? 'bg-blue-200 border-blue-400 text-gray-800'
            : 'bg-white border-blue-300 text-gray-600'
        }`}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/>
          <line x1="12" y1="4" x2="12" y2="20"/>
        </svg>
        <span className="text-sm font-semibold">Link or Text</span>
        <span className="text-xs text-gray-500">Write the claim</span>
      </div>
    </div>
  );

  // ── Render ───────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: '#e5e7eb' }}>

      {/* ── Top Nav Bar ── */}
      <header className="app-header">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none" style={{ fontFamily: 'Outfit, sans-serif' }}>FactCheck</p>
            <p className="text-blue-200 text-xs mt-0.5 opacity-80">UNESCO Media Literacy</p>
          </div>
        </div>
        <nav className="hidden sm:flex items-center gap-6 text-sm text-blue-100">
          <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
          <a href="#resources"    className="hover:text-white transition-colors">Resources</a>
          <a href="#about"        className="hover:text-white transition-colors">About</a>
        </nav>
      </header>

      <main className="max-w-md mx-auto px-4 py-8">

        {/* ══════════════════════════════════════
            IDLE STATE
        ══════════════════════════════════════ */}
        {appState === 'idle' && (
          <>
            {/* Tab selector — clickable */}
            <div className="flex gap-3 mb-5">
              <button
                id="tab-screenshot"
                onClick={() => setInputMode('screenshot')}
                className={`flex-1 flex flex-col items-center gap-1.5 py-4 rounded-2xl border-2 transition-all ${
                  inputMode === 'screenshot'
                    ? 'bg-blue-200 border-blue-400 text-gray-800'
                    : 'bg-white border-blue-300 text-gray-600'
                }`}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <span className="text-sm font-semibold">Screenshot</span>
                <span className="text-xs text-gray-500">Paste or Upload</span>
              </button>

              <button
                id="tab-link"
                onClick={() => setInputMode('link')}
                className={`flex-1 flex flex-col items-center gap-1.5 py-4 rounded-2xl border-2 transition-all ${
                  inputMode !== 'screenshot'
                    ? 'bg-blue-200 border-blue-400 text-gray-800'
                    : 'bg-white border-blue-300 text-gray-600'
                }`}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/>
                  <line x1="12" y1="4" x2="12" y2="20"/>
                </svg>
                <span className="text-sm font-semibold">Link or Text</span>
                <span className="text-xs text-gray-500">Write the claim</span>
              </button>
            </div>

            {/* Screenshot panel */}
            {inputMode === 'screenshot' && (
              <div className="bg-white rounded-2xl shadow-sm p-4 mb-5">
                <div
                  className={`drop-zone flex flex-col items-center justify-center text-center cursor-pointer py-12 ${
                    dragOver ? 'drag-over' : ''
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  id="screenshot-dropzone"
                >
                  {previewUrl ? (
                    <div className="relative w-full max-w-xs">
                      <img src={previewUrl} alt="Uploaded screenshot" className="w-full rounded-xl object-cover max-h-52 shadow-sm" />
                      <button
                        className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full border border-gray-200 shadow-sm flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors text-sm"
                        onClick={(e) => { e.stopPropagation(); setPreviewUrl(null); setFileName(''); }}
                        id="remove-image-btn"
                      >
                        ✕
                      </button>
                      <p className="mt-3 text-sm font-medium text-gray-600 truncate">{fileName}</p>
                    </div>
                  ) : (
                    <>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mb-3">
                        <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                      </svg>
                      <p className="font-semibold text-gray-800 text-base mb-1">Tap to snap or upload image</p>
                      <p className="text-sm text-gray-500">Upload photo or screenshot</p>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    id="file-input"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />
                </div>
              </div>
            )}

            {/* Link / Text panel */}
            {(inputMode === 'link' || inputMode === 'youtube') && (
              <div className="bg-white rounded-2xl shadow-sm p-4 mb-5">
                <p className="text-base font-semibold text-gray-800 mb-3 leading-snug">
                  Paste texts and the links to the article or video here
                </p>
                <div className="relative mb-3">
                  <textarea
                    id="link-input"
                    value={activeText}
                    onChange={(e) => setActiveText(e.target.value)}
                    placeholder="Enter or paste the link or text"
                    rows={5}
                    className="w-full rounded-xl bg-blue-100 px-4 py-3 text-sm text-gray-800 outline-none resize-none placeholder-gray-400 border-0"
                  />
                  {activeText && (
                    <button
                      className="absolute top-2 right-3 text-xs text-gray-400 hover:text-red-400 transition-colors"
                      onClick={() => setActiveText('')}
                      id="clear-link-btn"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="flex justify-end">
                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors shadow-sm"
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        setActiveText(text);
                      } catch {
                        // Clipboard read not permitted — no-op
                      }
                    }}
                    id="paste-btn"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                    Paste
                  </button>
                </div>
              </div>
            )}

            {/* CTA Button */}
            <button
              id="check-btn"
              className="btn-primary"
              onClick={handleCheck}
              disabled={false /* allow demo for any state */}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Check If This is True
            </button>
          </>
        )}

        {/* ══════════════════════════════════════
            CHECKING STATE
        ══════════════════════════════════════ */}
        {appState === 'checking' && (
          <>
            <TabRow activeId={submittedMode} />

            <div className="bg-white rounded-2xl shadow-sm p-4 mb-5">
              {submittedMode === 'screenshot' && submittedPreview ? (
                <div className="flex justify-center">
                  <img src={submittedPreview} alt="Submitted" className="rounded-xl max-h-52 object-cover" />
                </div>
              ) : (
                <>
                  <p className="text-base font-semibold text-gray-800 mb-3 leading-snug">
                    Paste texts and the links to the article or video here
                  </p>
                  <div className="bg-blue-100 rounded-xl px-4 py-3 text-sm text-gray-800 min-h-[100px] mb-3 relative overflow-hidden">
                    <p className="leading-relaxed">{submittedText || submittedLink}</p>
                    <span className="absolute top-2 right-2 text-gray-400">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                        <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
                      </svg>
                    </span>
                  </div>
                  <div className="flex justify-end">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold opacity-60 cursor-not-allowed">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                      Paste
                    </div>
                  </div>
                </>
              )}
            </div>

            <button className="btn-primary cursor-not-allowed opacity-90" disabled>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Checking...
            </button>
          </>
        )}

        {/* ══════════════════════════════════════
            RESULTS STATE
        ══════════════════════════════════════ */}
        {appState === 'results' && (
          <>
            <div className="space-y-4">
              {DEMO_RESULTS.map((card, i) => (
                <ResultCardView
                  key={card.verdict}
                  card={card}
                  delay={i + 1}
                  submittedPreview={submittedPreview}
                  submittedText={submittedText}
                  submittedMode={submittedMode}
                  submittedLink={submittedLink}
                />
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <button
                id="check-another-btn"
                className="btn-primary"
                onClick={handleReset}
              >
                Check Another Claim
              </button>
              <button
                id="share-btn"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border-2 border-gray-300 bg-white text-gray-700 font-semibold text-sm hover:border-blue-300 hover:text-blue-600 transition-all"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: 'FactCheck Result', url: window.location.href });
                  }
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                Share Results
              </button>
            </div>
          </>
        )}
      </main>

      {/* ════════════════════════════════════════════════
          HOW IT WORKS SECTION
      ════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-blue-500 mb-3">The process</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
              How it works
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-base leading-relaxed">
              Three simple steps to instantly verify any claim, headline, or social-media post.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                step: '01',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                  </svg>
                ),
                iconBg: '#eff6ff',
                iconColor: '#3b82f6',
                title: 'Submit your claim',
                desc: 'Upload a screenshot, paste a news headline or article link, type a claim directly, or share a YouTube video URL — whatever format works for you.',
              },
              {
                step: '02',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                ),
                iconBg: '#f0fdf4',
                iconColor: '#22c55e',
                title: 'AI cross-references sources',
                desc: 'Our AI engine scans verified databases, academic journals, fact-checking organisations, and trusted news agencies to evaluate the claim from multiple angles.',
              },
              {
                step: '03',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                ),
                iconBg: '#fff7ed',
                iconColor: '#f97316',
                title: 'Get a clear verdict',
                desc: 'Receive a colour-coded result — TRUE, FALSE, or MISLEADING — with confidence scores, expert summaries, and a list of sources so you can judge for yourself.',
              },
            ].map((item, i) => (
              <div
                key={item.step}
                className="relative flex flex-col gap-5 rounded-3xl border border-slate-100 bg-slate-50/60 p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: item.iconBg, color: item.iconColor }}
                  >
                    {item.icon}
                  </div>
                  <span className="text-5xl font-black text-slate-100 select-none" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {item.step}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden sm:block absolute -right-5 top-1/2 -translate-y-1/2 z-10">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Tips callout */}
          <div className="mt-12 rounded-3xl border border-blue-100 bg-blue-50/50 p-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              <strong className="text-slate-700">Tips for best results:</strong>{' '}
              Use <strong>Screenshot</strong> when you spot a suspicious image or post on social media.
              Use <strong>Link or Text</strong> for articles, YouTube videos, or specific claims you've heard.
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          RESOURCES SECTION
      ════════════════════════════════════════════════ */}
      <section id="resources" className="py-20 px-4 sm:px-6 lg:px-8" style={{ background: 'linear-gradient(160deg, #f8fafc 0%, #f0f4f8 100%)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-orange-500 mb-3">Learn more</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Resources
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-base leading-relaxed">
              Build your media literacy skills with curated guides and tools from UNESCO and global partners.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                tag: 'UNESCO Guide', tagColor: '#3b82f6', tagBg: '#eff6ff', icon: '📘',
                title: 'Media & Information Literacy Curriculum',
                desc: "UNESCO's official MIL curriculum for educators — covering source evaluation, digital citizenship, and critical thinking.",
                link: 'https://www.unesco.org/en/media-information-literacy',
              },
              {
                tag: 'Fact-Check Tool', tagColor: '#16a34a', tagBg: '#f0fdf4', icon: '🔍',
                title: 'How to Spot Fake News',
                desc: 'A step-by-step IFLA guide: check the source, read beyond the headline, verify the author, and check the date.',
                link: 'https://www.ifla.org/publications/node/11174',
              },
              {
                tag: 'Interactive', tagColor: '#ea580c', tagBg: '#fff7ed', icon: '🎮',
                title: 'Bad News — The Game',
                desc: 'An award-winning game where you learn manipulation techniques by playing the role of a fake-news producer.',
                link: 'https://www.getbadnews.com/',
              },
              {
                tag: 'Research', tagColor: '#7c3aed', tagBg: '#f5f3ff', icon: '📊',
                title: 'Reuters Institute Digital News Report',
                desc: 'Annual global report on how people access, engage with, and trust news across 46 countries.',
                link: 'https://reutersinstitute.politics.ox.ac.uk/',
              },
              {
                tag: 'Checklist', tagColor: '#0891b2', tagBg: '#ecfeff', icon: '✅',
                title: 'SIFT Method',
                desc: 'Stop · Investigate the source · Find better coverage · Trace claims — a four-move framework for quick verification.',
                link: 'https://hapgood.us/2019/06/19/sift-the-four-moves/',
              },
              {
                tag: 'Video Series', tagColor: '#dc2626', tagBg: '#fff1f2', icon: '🎬',
                title: 'Crash Course Media Literacy',
                desc: 'A free 12-episode YouTube series exploring how media shapes our understanding of the world, from PBS.',
                link: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtM6jSpzb5gLYbgLixxIeKv4',
              },
            ].map((res) => (
              <a
                key={res.title}
                href={res.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-3xl">{res.icon}</span>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0" style={{ color: res.tagColor, background: res.tagBg }}>
                    {res.tag}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">{res.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{res.desc}</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-blue-500">
                  Visit resource
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
                  </svg>
                </div>
              </a>
            ))}
          </div>

          {/* Misinformation alert banner */}
          <div className="mt-12 rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 100%)' }}>
            <div className="p-8 flex flex-col sm:flex-row items-center gap-6 text-white">
              <div className="flex-shrink-0 text-4xl">⚠️</div>
              <div className="flex-1">
                <p className="font-bold text-lg mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>Common false claims circulating now</p>
                <p className="text-blue-200 text-sm leading-relaxed">
                  Health misinformation, election fraud claims, and AI-generated images are among the most shared false content globally.
                  Always verify before sharing — misinformation spreads 6× faster than accurate news.
                </p>
              </div>
              <a
                href="https://www.poynter.org/ifcn/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-white text-slate-900 text-sm font-semibold hover:bg-blue-50 transition-colors whitespace-nowrap"
              >
                Explore fact-checks →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          ABOUT SECTION
      ════════════════════════════════════════════════ */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid gap-12 lg:grid-cols-2 items-center">

            {/* Left — text */}
            <div>
              <span className="inline-block text-xs font-semibold uppercase tracking-widest text-green-600 mb-3">Our mission</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-5" style={{ fontFamily: 'Outfit, sans-serif' }}>
                About this project
              </h2>
              <p className="text-slate-600 text-base leading-relaxed mb-4">
                This tool is part of <strong>UNESCO's Media and Information Literacy (MIL)</strong> initiative — a global effort to equip citizens
                with the critical thinking skills needed to navigate today's complex information landscape.
              </p>
              <p className="text-slate-600 text-base leading-relaxed mb-6">
                Misinformation causes real harm: it drives vaccine hesitancy, fuels conflict, and undermines democracy.
                Our goal is to make professional-grade fact-checking accessible to everyone, in any language.
              </p>
              <div className="flex flex-wrap gap-3">
                {['Open source', 'Non-commercial', 'Privacy-first', 'Multilingual'].map((badge) => (
                  <span key={badge} className="px-4 py-1.5 rounded-full text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-600">
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — stats + partners */}
            <div className="flex flex-col gap-5">
              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: '50+',  label: 'Verified sources',      color: '#3b82f6' },
                  { value: '195',  label: 'UNESCO member states',   color: '#22c55e' },
                  { value: '<3s',  label: 'Average check time',     color: '#f97316' },
                  { value: '100%', label: 'Free to use',            color: '#7c3aed' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-center">
                    <p className="text-3xl font-black mb-1" style={{ color: stat.color, fontFamily: 'Outfit, sans-serif' }}>
                      {stat.value}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Knowledge partners */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">Knowledge partners</p>
                <div className="flex flex-wrap gap-2">
                  {['UNESCO', 'WHO', 'Reuters', 'AP', 'Snopes', 'FactCheck.org', 'Poynter / IFCN', 'BBC'].map((p) => (
                    <span key={p} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-600 shadow-sm">
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* Contact card */}
              <div className="rounded-2xl border border-green-100 bg-green-50 p-5 flex gap-4 items-start">
                <span className="text-2xl flex-shrink-0">✉️</span>
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-0.5">Get in touch</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Interested in integrating this tool into your school or newsroom?{' '}
                    <a href="mailto:mil@unesco.org" className="text-blue-500 hover:underline font-medium">mil@unesco.org</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-4 text-xs text-slate-400 border-t border-slate-100 bg-white/50">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            Built for{' '}
            <span className="font-semibold text-slate-600">UNESCO Media &amp; Information Literacy</span>
          </p>
          <nav className="flex flex-wrap items-center justify-center gap-4">
            <a href="#how-it-works" className="hover:text-blue-500 transition-colors">How it works</a>
            <a href="#resources"    className="hover:text-blue-500 transition-colors">Resources</a>
            <a href="#about"        className="hover:text-blue-500 transition-colors">About</a>
            <span className="text-slate-200">·</span>
            <a href="#" className="hover:text-blue-500 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Terms of Use</a>
          </nav>
        </div>
        <p className="text-center mt-3 opacity-70">For educational and awareness purposes only.</p>
      </footer>
    </div>
  );
}

