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
          {status === "loading" && (
            <div className="reflection-panel__loading">
              <p>Looking back over the conversation...</p>
              <p className="reflection-panel__loading-note">
                This usually takes a few seconds -- the report will appear here once it's ready.
              </p>
            </div>
          )}
          {status === "error" && <p className="reflection-panel__error">{errorMessage}</p>}

          {status === "done" && data && (
            <>
              <section className="reflection-section">
                <h3>Strengths You Showed</h3>
                <ul>
                  {(data.strengths ?? []).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </section>

              <section className="reflection-section">
                <h3>What {npcName} Learned About You</h3>
                <p>{data.npcPerspective}</p>
              </section>

              <section className="reflection-section">
                <h3>Connection Moments</h3>
                <ul>
                  {(data.connectionMoments ?? []).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </section>

              <section className="reflection-section">
                <h3>Your Conversation Style</h3>
                <p className="reflection-style-label">{data.styleLabel}</p>
                <p>{data.styleDescription}</p>
              </section>

              <section className="reflection-section">
                <h3>Growth Opportunities</h3>
                <ul>
                  {(data.growthOpportunities ?? []).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </section>

              <section className="reflection-section">
                <h3>Overall Echo</h3>
                <p>{data.overallEcho}</p>
              </section>

              {data.balance && (
                <section className="reflection-section">
                  <h3>Conversation Balance</h3>
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
                </section>
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
