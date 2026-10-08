import { useEffect, useState } from "react";
import ScenarioCard from "./ScenarioCard.jsx";
import AccessibilityButton from "./AccessibilityButton.jsx";
import ReflectionHistoryPanel from "./ReflectionHistoryPanel.jsx";
import ReflectionPanel from "./ReflectionPanel.jsx";
import TutorialOverlay from "./TutorialOverlay.jsx";
import { useAccessibility } from "../a11y/AccessibilityContext.jsx";
import { getReflectionHistory } from "../services/reflectionHistory.js";
import HoverWords from "./HoverWords.jsx";

/** querySelector always returns the first match, so each target here
 * naturally lands on the leftmost/first scenario card -- one representative
 * example rather than needing an nth-child selector. */
const PICKER_TUTORIAL_STEPS = [
  {
    target: ".scenario-card__image",
    title: "Pick a scenario",
    text: "Each card is a short, scripted social situation to practice -- read the setup, then jump in whenever you're ready.",
  },
  {
    target: ".scenario-card__practice",
    title: "See what you'll practice",
    text: "This tag tells you the specific skill this scenario focuses on.",
  },
  {
    target: ".scenario-card__difficulty-button",
    title: "Start when you're ready",
    text: "Tap here to begin -- you'll choose between typing or talking live next.",
  },
  {
    // Opens the menu itself for a moment rather than just pointing at the
    // button -- seeing what's inside is what makes people come back to it.
    target: ".a11y-menu",
    opensAccessibilityMenu: true,
    placement: "left",
    title: "Make it comfortable",
    text: "The Accessibility menu has bigger text, calmer colors, reduced motion, read-aloud and more. Open it any time from the Accessibility button, or press Ctrl + U.",
  },
  {
    target: ".picker__feedback-link",
    title: "Tell us what you think",
    text: "Something confusing, or an idea? Share Feedback opens a short form -- it helps us shape Nexus.",
  },
];

export default function ScenarioPicker({ scenarios, loadError, onSelect }) {
  const { registerReadableContent, stopSpeech, favorites, resolvedMotion } = useAccessibility();
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  // The side-rail dot last clicked; its card gets scrolled to and briefly
  // lit up once it's on the page (see the effect below).
  const [jumpTarget, setJumpTarget] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyEntries, setHistoryEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [tutorialKey, setTutorialKey] = useState(0);

  // The Favorites button in the header narrows the list to starred
  // scenarios; the stars on the cards are what feed it.
  const favoriteCount = scenarios.filter((s) => favorites.includes(s.id)).length;
  const visibleScenarios = showFavoritesOnly ? scenarios.filter((s) => favorites.includes(s.id)) : scenarios;

  // A rail dot takes you to its scenario's card. If the Favorites filter is
  // hiding that card, the filter comes off first and the jump happens once
  // the card has rendered. Focus lands on the card's Start button, so a
  // keyboard user arrives where they can act on it.
  function jumpToScenario(id) {
    if (!visibleScenarios.some((s) => s.id === id)) setShowFavoritesOnly(false);
    setJumpTarget({ id, at: Date.now() });
  }

  useEffect(() => {
    if (!jumpTarget) return undefined;
    const card = document.querySelector(`.scenario-card[data-scenario="${jumpTarget.id}"]`);
    if (!card) return undefined;
    // Focus before scrolling: focusing mid-way through a smooth scroll
    // cancels it, even with preventScroll.
    card.querySelector(".scenario-card__difficulty-button")?.focus({ preventScroll: true });
    card.scrollIntoView({ block: "center", behavior: resolvedMotion === "reduce" ? "auto" : "smooth" });
    card.classList.remove("scenario-card--jumped");
    void card.offsetWidth; // restart the glow if the same dot is clicked again
    card.classList.add("scenario-card--jumped");
    const timer = setTimeout(() => card.classList.remove("scenario-card--jumped"), 1600);
    return () => clearTimeout(timer);
  }, [jumpTarget, showFavoritesOnly, resolvedMotion]);

  // "Read aloud" on this screen reads the list of scenario cards -- the
  // picker's "resource list" equivalent -- as currently shown (so, only the
  // favorites while that filter is on).
  useEffect(() => {
    return registerReadableContent(() =>
      visibleScenarios.map((s) => `${s.title}. ${s.preview} ${s.teachingPoint}`)
    );
  }, [visibleScenarios, registerReadableContent]);

  // Don't keep reading this list aloud after moving on to another screen.
  useEffect(() => stopSpeech, [stopSpeech]);

  function openHistory() {
    setHistoryEntries(getReflectionHistory());
    setHistoryOpen(true);
  }

  function selectEntry(entry) {
    setSelectedEntry(entry);
    setHistoryOpen(false);
  }

  // The "x" on a selected entry's detail view goes back to the list (it's
  // one step of navigation, not a full exit); the footer "Close" button
  // closes the whole history flow, mirroring the live in-scenario
  // Reflection's own x-vs-footer-button distinction.
  function backToList() {
    setSelectedEntry(null);
    setHistoryOpen(true);
  }

  function closeHistoryFlow() {
    setSelectedEntry(null);
    setHistoryOpen(false);
  }

  // Removing the localStorage flag plus remounting (via the key bump) is
  // what actually replays it -- TutorialOverlay only ever reads its
  // "seen?" flag once, at its own mount, via useState's lazy initializer.
  function replayTutorial() {
    try {
      localStorage.removeItem("nexus-tutorial-picker");
    } catch {
      // Ignore -- storage may be unavailable (private browsing etc.).
    }
    setTutorialKey((k) => k + 1);
  }

  return (
    <div className="picker">
      <div className="picker__background" aria-hidden="true" />

      {/* Desktop-only rail (hidden below 1180px via CSS) -- fills the empty
          gutters either side of the centered content column. The lines are
          decoration; the dots, one per scenario in its accent color, jump
          to that scenario's card. */}
      <div className="picker__rails" aria-hidden="true">
        <div className="picker__rail picker__rail--left" />
        <div className="picker__rail picker__rail--right" />
      </div>
      {scenarios.length > 0 && (
        <nav className="picker__rail-dots" aria-label="Jump to a scenario">
          {scenarios.map((s) => (
            <button
              key={s.id}
              type="button"
              className="picker__rail-dot"
              style={{ "--dot-color": s.color }}
              onClick={() => jumpToScenario(s.id)}
              aria-label={`Go to ${s.title}`}
              title={s.title}
            />
          ))}
        </nav>
      )}

      <div className="picker__content">
        <div className="picker__left">
          <a
            className="picker__feedback-link"
            href="https://docs.google.com/forms/d/e/1FAIpQLSeOQX7N0Xs7XWItzUE6zYQa6qRlpnooBnryST7SeiG7ub4Edw/viewform?usp=header"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            Share Feedback
          </a>
          <button
            type="button"
            className="tutorial-replay-button"
            onClick={replayTutorial}
            aria-label="Replay the getting-started walkthrough"
            title="Getting started"
          >
            <span aria-hidden="true">?</span> Tutorial
          </button>
        </div>

        <div className="picker__a11y">
          <button className="picker__history-button" onClick={openHistory}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3.5 2" />
            </svg>
            Past Reflections
          </button>
          <button
            type="button"
            className={`picker__favorites-button ${showFavoritesOnly ? "picker__favorites-button--active" : ""}`}
            onClick={() => setShowFavoritesOnly((on) => !on)}
            aria-pressed={showFavoritesOnly}
            aria-label={
              showFavoritesOnly
                ? "Showing favorites only. Show all scenarios"
                : `Show favorites only, ${favoriteCount} saved`
            }
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill={showFavoritesOnly ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z" />
            </svg>
            Favorites
            {favoriteCount > 0 && (
              <span className="picker__favorites-count" aria-hidden="true">{favoriteCount}</span>
            )}
          </button>
          <AccessibilityButton />
        </div>

        <header className="picker__header">
          <div className="picker__hero">
            <div className="picker__hero-boxes" aria-hidden="true">
              <span className="picker__hero-box" style={{ background: "radial-gradient(ellipse at 30% 25%, #fbe98f 0%, #eec344 55%, #d9a52e 100%)", top: "2%", left: "7%", width: "32%", height: "52%", borderRadius: "78% 22% 51% 49% / 24% 63% 37% 76%", transform: "rotate(-12deg) skew(-4deg, 2deg)" }} />
              <span className="picker__hero-box" style={{ background: "radial-gradient(ellipse at 45% 40%, #d9f0a3 0%, #a4d94a 55%, #8ec132 100%)", top: "9%", left: "31%", width: "25%", height: "43%", borderRadius: "23% 77% 65% 35% / 68% 30% 70% 32%", transform: "rotate(11deg) skew(3deg, -3deg)" }} />
              <span className="picker__hero-box" style={{ background: "radial-gradient(ellipse at 30% 22%, #b9ecea 0%, #5fc7c4 55%, #3fa9a6 100%)", top: "-2%", left: "51%", width: "29%", height: "56%", borderRadius: "82% 18% 30% 70% / 20% 45% 55% 80%", transform: "rotate(-6deg) skew(-2deg, 4deg)" }} />
              <span className="picker__hero-box" style={{ background: "radial-gradient(ellipse at 45% 28%, #fcd2a0 0%, #f0964a 55%, #d97a30 100%)", top: "13%", left: "71%", width: "31%", height: "45%", borderRadius: "34% 66% 74% 26% / 71% 25% 62% 38%", transform: "rotate(13deg) skew(4deg, -2deg)" }} />
              <span className="picker__hero-box" style={{ background: "radial-gradient(ellipse at 28% 40%, #97e0cb 0%, #3fae8f 55%, #2c8a70 100%)", top: "47%", left: "1%", width: "25%", height: "51%", borderRadius: "64% 36% 22% 78% / 32% 74% 26% 68%", transform: "rotate(9deg) skew(-3deg, -2deg)" }} />
              <span className="picker__hero-box" style={{ background: "radial-gradient(ellipse at 46% 25%, #f7a8c4 0%, #e8598a 55%, #cc3d6d 100%)", top: "53%", left: "26%", width: "24%", height: "42%", borderRadius: "27% 73% 78% 22% / 66% 20% 72% 34%", transform: "rotate(-11deg) skew(2deg, 3deg)" }} />
              <span className="picker__hero-box" style={{ background: "radial-gradient(ellipse at 30% 22%, #f9e4a8 0%, #f2c14e 55%, #d9a52e 100%)", top: "51%", left: "49%", width: "23%", height: "47%", borderRadius: "72% 28% 40% 60% / 22% 68% 32% 78%", transform: "rotate(8deg) skew(-4deg, 2deg)" }} />
              <span className="picker__hero-box" style={{ background: "radial-gradient(ellipse at 46% 40%, #d9c4f0 0%, #9b6fd6 55%, #7d4fc0 100%)", top: "44%", left: "69%", width: "31%", height: "54%", borderRadius: "20% 80% 60% 40% / 76% 28% 65% 24%", transform: "rotate(-14deg) skew(3deg, -4deg)" }} />
            </div>
            <img className="picker__hero-hands picker__hero-hands--light" src="/logo-light.png" alt="" aria-hidden="true" />
            <img className="picker__hero-hands picker__hero-hands--dark" src="/logo-dark.png" alt="" aria-hidden="true" />
            <h1 className="picker__hero-title">Nexus</h1>
          </div>
          <p className="picker__tagline">
            AI-powered social scenario practice, designed for the neurodivergent community.
          </p>
          <p>Practice everyday conversations in a low-stakes, judgment-free space. Pick a scenario to start.</p>
          <p className="picker__framing">
            <HoverWords text={'You\'re playing as a neurodivergent person navigating everyday situations -- the goal is to understand your needs, not to act "normal."'} />
          </p>
        </header>

        {loadError && (
          <p className="picker__error">
            Couldn't load scenarios: {loadError}. Is the server running?
          </p>
        )}

        {!loadError && scenarios.length === 0 && (
          <p className="picker__loading">Loading scenarios...</p>
        )}

        {showFavoritesOnly && scenarios.length > 0 && visibleScenarios.length === 0 && (
          <div className="picker__empty" role="status">
            <p>
              No favorites yet. Tap the star on a scenario to save it here.
            </p>
            <button type="button" className="picker__empty-button" onClick={() => setShowFavoritesOnly(false)}>
              Show all scenarios
            </button>
          </div>
        )}

        <div className="picker__grid">
          {visibleScenarios.map((scenario) => (
            <ScenarioCard key={scenario.id} scenario={scenario} onSelect={onSelect} />
          ))}
        </div>
      </div>

      <ReflectionHistoryPanel
        open={historyOpen}
        entries={historyEntries}
        onSelect={selectEntry}
        onClose={() => setHistoryOpen(false)}
      />

      {selectedEntry && (
        <ReflectionPanel
          open
          status="done"
          data={selectedEntry.data}
          npcName={selectedEntry.npcName}
          subtitle={`${selectedEntry.scenarioTitle} -- ${new Date(selectedEntry.completedAt).toLocaleDateString()}`}
          finishLabel="Close"
          onClose={backToList}
          onFinish={closeHistoryFlow}
        />
      )}

      <TutorialOverlay
        key={tutorialKey}
        storageKey="nexus-tutorial-picker"
        active={scenarios.length > 0}
        steps={PICKER_TUTORIAL_STEPS}
      />
    </div>
  );
}
