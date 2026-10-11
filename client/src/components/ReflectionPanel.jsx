import { useEffect, useState } from "react";
import { useAccessibility } from "../a11y/AccessibilityContext.jsx";
import "./Reflection.css";

/** Little line icons for each section, so a new section is easy to spot. */
// Each section's icon: a soft filled shape (".soft", a light wash of the
// section color) under a crisp outline, with one small solid accent -- the
// same two-tone feel as the watercolor art, still simple at 20px.
const SECTION_ICONS = {
  // A sprout pushing up from the soil, a little sparkle beside it.
  strengths: (
    <>
      <path className="soft" d="M12 13.5c0-4 2.8-6.6 7-6.6 0 4-2.8 6.6-7 6.6z" />
      <path className="soft" d="M12 15.6c0-3.3-2.5-5.6-6-5.6 0 3.3 2.5 5.6 6 5.6z" />
      <path d="M12 13.5c0-4 2.8-6.6 7-6.6 0 4-2.8 6.6-7 6.6zM12 15.6c0-3.3-2.5-5.6-6-5.6 0 3.3 2.5 5.6 6 5.6z" />
      <path d="M12 20.5v-7M7.5 20.5h9" />
      <path className="solid" d="M5.5 3.2l.55 1.45L7.5 5.2l-1.45.55L5.5 7.2l-.55-1.45L3.5 5.2l1.45-.55z" />
    </>
  ),
  // You, as they now see you: a portrait with a spark of recognition.
  learned: (
    <>
      <circle className="soft" cx="11" cy="8.5" r="3.6" />
      <path className="soft" d="M4 20.5c0-3.9 3.1-6.5 7-6.5s7 2.6 7 6.5z" />
      <circle cx="11" cy="8.5" r="3.6" />
      <path d="M4 20.5c0-3.9 3.1-6.5 7-6.5s7 2.6 7 6.5" />
      <path className="solid" d="M18.5 2.8l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6z" />
    </>
  ),
  // Two circles overlapping; the shared part is where you connected.
  moments: (
    <>
      <circle className="soft" cx="8.8" cy="13" r="5.3" />
      <circle className="soft" cx="15.2" cy="13" r="5.3" />
      <path className="solid" d="M12 8.6a5.3 5.3 0 0 1 0 8.8 5.3 5.3 0 0 1 0-8.8z" />
      <circle cx="8.8" cy="13" r="5.3" />
      <circle cx="15.2" cy="13" r="5.3" />
      <path d="M12 2.8v2M8.6 4l.8 1.2M15.4 4l-.8 1.2" />
    </>
  ),
  // A painter's palette: your conversation's own mix of colors.
  style: (
    <>
      <path
        className="soft"
        d="M12 3.5a8.5 8.5 0 1 0 0 17c1 0 1.5-.7 1.5-1.5 0-1-.9-1.4-.9-2.3 0-.9.7-1.5 1.6-1.5h1.8a4.6 4.6 0 0 0 4.6-4.6C20.6 6.6 16.8 3.5 12 3.5z"
      />
      <path d="M12 3.5a8.5 8.5 0 1 0 0 17c1 0 1.5-.7 1.5-1.5 0-1-.9-1.4-.9-2.3 0-.9.7-1.5 1.6-1.5h1.8a4.6 4.6 0 0 0 4.6-4.6C20.6 6.6 16.8 3.5 12 3.5z" />
      <circle className="solid" cx="7.4" cy="11.2" r="1.25" />
      <circle className="solid" cx="9.6" cy="7.4" r="1.25" />
      <circle className="solid" cx="14.2" cy="7.2" r="1.25" />
      <circle cx="7.8" cy="15.6" r="1.25" />
    </>
  ),
  // A winding path with a little flag waiting further along.
  growth: (
    <>
      <path className="soft" d="M17 4.2l4 1.8-4 1.8z" />
      <path d="M17 11V3.5M17 4.2l4 1.8-4 1.8" />
      <path d="M3.5 20.5c3 0 4.5-1.6 4.5-3.3S9.6 14 12.5 14 17 13 17 11" strokeDasharray="2.2 2.4" />
      <circle className="solid" cx="3.8" cy="20.3" r="1.5" />
    </>
  ),
  // Your words in a bubble, carrying on as ripples.
  echo: (
    <>
      <path className="soft" d="M3.5 6.5a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3H8l-3 2.3v-2.6a3 3 0 0 1-1.5-2.7z" />
      <path d="M3.5 6.5a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3H8l-3 2.3v-2.6a3 3 0 0 1-1.5-2.7z" />
      <path d="M15.5 13.5a4 4 0 0 1 0 5M18 11.5a7 7 0 0 1 0 9" />
      <circle className="solid" cx="13" cy="16" r="1.4" />
    </>
  ),
  // Two bubbles taking turns: one speaking, one listening.
  balance: (
    <>
      <path className="soft" d="M20 8a4 4 0 0 0-4-4h-2a4 4 0 0 0 0 8h2l3 2v-2.6A4 4 0 0 0 20 8z" />
      <path d="M4 16a4 4 0 0 1 4-4h2a4 4 0 0 1 0 8H8l-3 2v-2.6A4 4 0 0 1 4 16z" />
      <path d="M20 8a4 4 0 0 0-4-4h-2a4 4 0 0 0 0 8h2l3 2v-2.6A4 4 0 0 0 20 8z" />
      <circle className="solid" cx="7" cy="16" r=".9" />
      <circle className="solid" cx="9" cy="16" r=".9" />
      <circle className="solid" cx="11" cy="16" r=".9" />
    </>
  ),
};

function Section({ kind, title, index, children }) {
  return (
    <section className={`reflection-section reflection-section--${kind}`} style={{ "--i": index }}>
      <h3>
        <span className="reflection-section__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            {SECTION_ICONS[kind]}
          </svg>
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

/**
 * While the reflection is being written: two speech bubbles (you and the
 * character) murmuring, little motes drifting up from each into a page whose
 * lines write themselves in, and a line underneath naming what's being looked
 * at. Under Reduce motion it's a still picture and a single line. Screen
 * readers get one steady status message, not each rotating line.
 */
function ReflectionLoading({ npcName }) {
  const { resolvedMotion } = useAccessibility();
  const still = resolvedMotion === "reduce";
  const name = npcName || "they";
  const lines = [
    "Gathering the moments that mattered...",
    `Noticing what ${name} learned about you...`,
    "Finding a name for your conversation style...",
    "Listening for the echo of what you said...",
    "Almost there — tidying up the page...",
  ];
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    if (still) return undefined;
    const id = setInterval(() => setLineIndex((i) => Math.min(i + 1, lines.length - 1)), 2600);
    return () => clearInterval(id);
  }, [still, lines.length]);

  return (
    <div className="reflection-loading" role="status">
      <span className="visually-hidden">Writing your reflection. This usually takes a few seconds.</span>
      <svg className="reflection-loading__scene" viewBox="0 0 220 128" aria-hidden="true">
        <g className="reflection-loading__page">
          <rect x="86" y="10" width="48" height="58" rx="7" />
          <path className="reflection-loading__line reflection-loading__line--1" d="M95 25h30" />
          <path className="reflection-loading__line reflection-loading__line--2" d="M95 34h30" />
          <path className="reflection-loading__line reflection-loading__line--3" d="M95 43h30" />
          <path className="reflection-loading__line reflection-loading__line--4" d="M95 52h18" />
        </g>
        <path className="reflection-loading__sparkle" d="M146 14l1.6 4.4 4.4 1.6-4.4 1.6-1.6 4.4-1.6-4.4-4.4-1.6 4.4-1.6z" />
        <circle className="reflection-loading__mote reflection-loading__mote--user-1" cx="50" cy="66" r="2.6" />
        <circle className="reflection-loading__mote reflection-loading__mote--user-2" cx="58" cy="66" r="2" />
        <circle className="reflection-loading__mote reflection-loading__mote--npc-1" cx="170" cy="66" r="2.6" />
        <circle className="reflection-loading__mote reflection-loading__mote--npc-2" cx="162" cy="66" r="2" />
        <g className="reflection-loading__bubble reflection-loading__bubble--user">
          <path d="M28 72h44a14 14 0 0 1 14 14v4a14 14 0 0 1-14 14H40l-10 8v-8.6A14 14 0 0 1 14 90v-4a14 14 0 0 1 14-14z" />
          <circle className="reflection-loading__dot" cx="38" cy="88" r="3" />
          <circle className="reflection-loading__dot" cx="50" cy="88" r="3" />
          <circle className="reflection-loading__dot" cx="62" cy="88" r="3" />
        </g>
        <g className="reflection-loading__bubble reflection-loading__bubble--npc">
          <path d="M192 72h-44a14 14 0 0 0-14 14v4a14 14 0 0 0 14 14h32l10 8v-8.6A14 14 0 0 0 206 90v-4a14 14 0 0 0-14-14z" />
          <circle className="reflection-loading__dot" cx="158" cy="88" r="3" />
          <circle className="reflection-loading__dot" cx="170" cy="88" r="3" />
          <circle className="reflection-loading__dot" cx="182" cy="88" r="3" />
        </g>
      </svg>
      <p key={lineIndex} className="reflection-loading__line-text" aria-hidden="true">
        {lines[lineIndex]}
      </p>
      <p className="reflection-panel__loading-note" aria-hidden="true">
        This usually takes a few seconds.
      </p>
    </div>
  );
}

/**
 * The end-of-conversation Reflection -- a warm, observational look at the
 * conversation, never a score or grade. Replaces the old simple-prose
 * feedback panel with 7 structured sections (see services/api.js
 * getReflection for the exact shape); "Conversation Balance" is the only
 * section computed deterministically server-side rather than judged by
 * the model. Since this only ever opens once the mission is fully complete
 * (see ChatScreen.jsx), it's also where the scenario actually ends -- the
 * "×" just dismisses the panel if someone wants to linger in the
 * conversation a little longer, while "Return to scenarios" is the real
 * exit, closing the scenario along with the panel.
 * @param {string} [subtitle] - Shown under the "Your Reflection" heading --
 *   used when reviewing a past reflection from history (see
 *   ReflectionHistoryPanel.jsx) to remind which scenario/when, since it's
 *   no longer obvious from context the way a just-finished one is.
 * @param {string} [finishLabel] - Footer button text, "Return to scenarios"
 *   by default; history review passes "Close" instead since there's no
 *   active scenario to exit.
 */
export default function ReflectionPanel({
  open,
  status,
  data,
  errorMessage,
  npcName,
  onClose,
  onFinish,
  subtitle,
  finishLabel = "Return to scenarios",
}) {
  if (!open) return null;

  return (
    <div className="reflection-overlay" role="dialog" aria-modal="true" aria-label="Conversation reflection">
      <div className="reflection-panel">
        <div className="reflection-panel__header">
          <div>
            <h2>Your Reflection</h2>
            {subtitle && <p className="reflection-panel__subtitle">{subtitle}</p>}
          </div>
          <button className="reflection-panel__close" onClick={onClose} aria-label="Close reflection">
            &times;
          </button>
        </div>

        <div className="reflection-panel__body">
          {status === "loading" && <ReflectionLoading npcName={npcName} />}
          {status === "error" && <p className="reflection-panel__error">{errorMessage}</p>}

          {status === "done" && data && (
            <>
              <Section kind="strengths" title="Strengths You Showed" index={0}>
                <ul>
                  {(data.strengths ?? []).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </Section>

              <Section kind="learned" title={`What ${npcName} Learned About You`} index={1}>
                <p>{data.npcPerspective}</p>
              </Section>

              <Section kind="moments" title="Connection Moments" index={2}>
                <ul>
                  {(data.connectionMoments ?? []).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </Section>

              <Section kind="style" title="Your Conversation Style" index={3}>
                <p className="reflection-style-label">{data.styleLabel}</p>
                <p>{data.styleDescription}</p>
              </Section>

              <Section kind="growth" title="Growth Opportunities" index={4}>
                <ul>
                  {(data.growthOpportunities ?? []).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </Section>

              <Section kind="echo" title="Overall Echo" index={5}>
                <p>{data.overallEcho}</p>
              </Section>

              {data.balance && (
                <Section kind="balance" title="Conversation Balance" index={6}>
                  <div className="reflection-balance">
                    <div className="reflection-balance__bar">
                      <div
                        className="reflection-balance__segment reflection-balance__segment--user"
                        style={{ width: `${data.balance.userPercent}%` }}
                      />
                      <div
                        className="reflection-balance__segment reflection-balance__segment--npc"
                        style={{ width: `${data.balance.npcPercent}%` }}
                      />
                    </div>
                    <p className="reflection-balance__label">
                      {data.balance.userLabel}: {data.balance.userPercent}% / {data.balance.npcLabel}: {data.balance.npcPercent}%
                    </p>
                  </div>
                </Section>
              )}
            </>
          )}
        </div>

        <div className="reflection-panel__footer">
          <button className="reflection-panel__finish" onClick={onFinish}>
            {finishLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
