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
 */
export default function ReflectionPanel({ open, status, data, errorMessage, npcName, onClose, onFinish }) {
  if (!open) return null;

  return (
    <div className="reflection-overlay" role="dialog" aria-modal="true" aria-label="Conversation reflection">
      <div className="reflection-panel">
        <div className="reflection-panel__header">
          <h2>Your Reflection</h2>
          <button className="reflection-panel__close" onClick={onClose} aria-label="Close reflection">
            &times;
          </button>
        </div>

        <div className="reflection-panel__body">
          {status === "loading" && <p className="reflection-panel__loading">Looking back over the conversation...</p>}
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
            Return to scenarios
          </button>
        </div>
      </div>
    </div>
  );
}
