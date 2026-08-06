import { useEffect, useRef, useState } from "react";
import { startRealtimeSession } from "../services/api.js";
import { useAccessibility } from "../a11y/AccessibilityContext.jsx";

/** Roughly maps a stream's RMS loudness to 0..1 -- typical spoken-voice RMS
 * sits well under 1 (silence is near 0, a raised voice maybe 0.15-0.25), so
 * this is scaled up to actually move the ball a visible amount instead of
 * needing to shout at it. */
function getAmplitude(analyser, buffer) {
  analyser.getByteTimeDomainData(buffer);
  let sumSquares = 0;
  for (let i = 0; i < buffer.length; i++) {
    const v = (buffer[i] - 128) / 128;
    sumSquares += v * v;
  }
  const rms = Math.sqrt(sumSquares / buffer.length);
  return Math.min(1, rms * 4);
}

/** A synthetic stand-in for getAmplitude() when previewMode skips the real
 * mic/NPC audio entirely -- two out-of-phase sine waves multiplied together
 * (rather than one) so it wanders between quiet and animated stretches
 * instead of a metronomic single pulse, plus a little random jitter so it
 * doesn't look too clean/mechanical. */
function fakeAmplitude(t) {
  const wave = ((Math.sin(t * 1.1) + 1) / 2) * ((Math.sin(t * 0.35) + 1) / 2);
  return Math.min(1, Math.max(0, 0.1 + wave * 0.45 + Math.random() * 0.06));
}

/** Cheap, local, zero-token way to catch the NPC signaling it's ready to
 * wrap up (see buildVoiceContinuityAddendum server-side, which tells it to
 * do this once the practice goal seems met) -- just a keyword match against
 * transcript text the call already sends us for free (response.output_
 * audio_transcript.done), not a second model call analyzing the
 * conversation. Deliberately specific, multi-word phrases rather than
 * single words like "good" -- avoids false-positiving on an NPC that's
 * simply being warm mid-conversation. */
const FAREWELL_PATTERN =
  /\b(good luck|take care|have a (great|good|wonderful) (day|one|rest)|talk (to you )?(soon|later)|see you (soon|later|around)|goodbye|bye for now|that(?:'s| is) all for (today|now)|i(?:'ll| will) let you (go|get back)|until next time|good chat)\b/i;

/** Each body-language state's breathing range/tempo for the ring+bloom's
 * radius -- see stepWave() below for how the ring actually moves between
 * these without ever jump-cutting. */
const WAVE_TARGETS = {
  idle: { min: 30, max: 40, period: 4.5 },
  listening: { min: 24, max: 30, period: 3.2 },
  thinking: { min: 32, max: 34, period: 6 },
  speaking: { min: 34, max: 46, period: 3.2 },
  ending: { min: 32, max: 34, period: 6 },
};

/** Advances one continuous breathing wave by dt seconds, easing its
 * range/tempo toward whatever state is currently targeted rather than
 * swapping to a differently-parameterized animation outright (which is
 * what CSS @keyframes name-swapping does, and why the ring used to visibly
 * jump-cut on every body-language transition). `wave.phase` is never reset
 * -- that's the actual key to it reading as one continuous wave instead of
 * a sequence of separate animations: only its amplitude and speed drift. */
function stepWave(wave, bodyState, dt) {
  const target = WAVE_TARGETS[bodyState] || WAVE_TARGETS.idle;
  // ~350ms to mostly settle into the new range/tempo.
  const smoothing = 1 - Math.exp(-dt / 0.35);
  wave.min += (target.min - wave.min) * smoothing;
  wave.max += (target.max - wave.max) * smoothing;
  wave.period += (target.period - wave.period) * smoothing;
  wave.phase += dt * ((2 * Math.PI) / wave.period);
  const mid = (wave.min + wave.max) / 2;
  const half = (wave.max - wave.min) / 2;
  return mid + half * Math.sin(wave.phase);
}

/**
 * A full-screen "phone call" takeover -- a thin, single-stroke wreath-like
 * circle (in the scenario's accent color, on a soft warm-white field) that
 * continuously grows and shrinks and reacts to whoever's actually making
 * sound, rather than a panel with a running transcript or a filled colorful
 * orb. Styling direction is Her (2013)'s OS1 interface -- minimal, no
 * chrome, warm and human rather than mechanical -- adapted to a light
 * rather than the film's red backdrop per the actual brief. Same WebRTC
 * connection approach as before: our server
 * only hands out a scoped, short-lived Realtime API credential (POST
 * /api/realtime-session, pre-configured with this NPC's personality +
 * voice); the browser takes it straight to OpenAI over WebRTC and never
 * routes audio through our server.
 *
 * Mission tracking, Narrator events, and hints are per-turn text mechanics
 * tied to a typed transcript -- this is a self-contained live conversation
 * layered on top, not merged into that pipeline. Ending the call returns to
 * the text chat exactly as it was left.
 *
 * @param {boolean} [previewMode] - Skips the real Realtime API session,
 *   WebRTC connection, and mic/speaker audio entirely -- goes straight to
 *   "connected" and drives the loop's --amp off a synthetic wave instead of
 *   real audio (see fakeAmplitude above), and auto-cycles bodyState through
 *   the whole vocabulary below (see PREVIEW_CYCLE) instead of listening for
 *   real turn-detection events. For iterating on this screen's *art style*
 *   (colors, motion, layout) without spending API calls, asking for mic
 *   permission, or needing a network connection each time -- see
 *   VoiceCallPreview.jsx, the dev-only entry point that sets this. The art
 *   itself is the real production component either way, so changes here
 *   apply identically to real calls.
 * @param {string} [previewBodyState] - Only used with previewMode: pins
 *   bodyState to this value and pauses the auto-cycle, so
 *   VoiceCallPreview.jsx's manual state buttons can hold on one state to
 *   inspect it closely instead of it drifting to the next one mid-look.
 */
export default function VoiceCallScreen({
  open,
  scenarioId,
  npcName,
  voiceIntro,
  accentColor,
  accentContrast,
  onClose,
  previewMode = false,
  previewBodyState = null,
}) {
  const { resolvedMotion } = useAccessibility();
  const [status, setStatus] = useState("idle"); // idle | connecting | connected | error | ended
  const [errorMessage, setErrorMessage] = useState("");
  const [muted, setMuted] = useState(false);
  // The "body language" vocabulary -- only meaningful while status is
  // "connected"; driven by real Realtime API turn-detection events (see
  // handleServerEvent below), not guessed from amplitude alone.
  const [bodyState, setBodyState] = useState("idle"); // idle | listening | thinking | speaking | ending
  // Set once and never cleared for the rest of the call -- once the NPC has
  // signaled closure, that fact stays true even through further exchanges,
  // so the "good stopping point" cue (rendered below) never flickers on and
  // off and never contradicts the live Listening/Speaking status above it.
  const [wrapUpCue, setWrapUpCue] = useState(false);
  // Shown after the ending animation finishes, only if there's actually
  // something to reflect on (see handleClose) -- a deliberate ask rather
  // than auto-triggering the way text mode does, since unlike text mode
  // there's no mission-completion signal here to auto-trigger *from*.
  const [askingReflection, setAskingReflection] = useState(false);
  // tick()/previewTick() keep re-scheduling themselves via rAF using the
  // same closure they started with, so they'd otherwise only ever see
  // bodyState as of whenever the loop began (a stale closure) -- this ref
  // is what lets them read the current value every frame instead.
  const bodyStateRef = useRef("idle");
  // Built up turn-by-turn from the call's own transcription events (see
  // handleServerEvent) -- {role, content} pairs in the same shape
  // ChatScreen's typed `messages` normally take, so it can go straight into
  // the existing /api/reflection call and ReflectionPanel with no
  // translation. Never displayed during the call itself (this app's voice
  // mode is deliberately transcript-free while live); only ever read if the
  // user opts into a reflection after ending.
  const transcriptRef = useRef([]);

  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const micStreamRef = useRef(null);
  const audioRef = useRef(null);
  const loopRef = useRef(null);

  const audioCtxRef = useRef(null);
  const userAnalyserRef = useRef(null);
  const npcAnalyserRef = useRef(null);
  const userBufferRef = useRef(null);
  const npcBufferRef = useRef(null);
  const rafRef = useRef(null);
  const endingTimeoutRef = useRef(null);
  const waveRef = useRef({ min: 30, max: 40, period: 4.5, phase: 0 });
  const lastFrameTimeRef = useRef(null);

  useEffect(() => {
    bodyStateRef.current = bodyState;
  }, [bodyState]);

  /** Real turn-detection events from the Realtime API's own server-side VAD
   * and response lifecycle -- this is what actually drives bodyState, not
   * a guess based on which side's amplitude happens to be louder right now
   * (amplitude still separately drives the *intensity* within a state via
   * --amp, see tick() -- "excited speech" is just loud audio during
   * "speaking", not a separate discrete state). */
  function handleServerEvent(e) {
    let evt;
    try {
      evt = JSON.parse(e.data);
    } catch {
      return;
    }
    switch (evt.type) {
      case "input_audio_buffer.speech_started":
        setBodyState("listening");
        break;
      case "input_audio_buffer.speech_stopped":
        setBodyState("thinking");
        break;
      case "response.created":
        setBodyState("thinking");
        break;
      case "output_audio_buffer.started":
        setBodyState("speaking");
        break;
      case "output_audio_buffer.stopped":
        setBodyState("idle");
        break;
      case "response.done":
        // Safety net: a response that ends without ever producing audio
        // (e.g. cut short) would otherwise leave bodyState stuck on
        // "thinking" forever.
        setBodyState((s) => (s === "thinking" ? "idle" : s));
        break;
      case "response.output_audio_transcript.done":
        // Recorded for a possible post-call reflection (see handleClose)
        // and, separately, pattern-matched to catch the NPC signaling
        // closure per its own instructions server-side
        // (buildVoiceContinuityAddendum) -- no extra model call for either,
        // just text this event already sends us for free.
        if (evt.transcript && evt.transcript.trim()) {
          transcriptRef.current.push({ role: "assistant", content: evt.transcript.trim() });
        }
        if (FAREWELL_PATTERN.test(evt.transcript || "")) {
          setWrapUpCue(true);
        }
        break;
      case "conversation.item.input_audio_transcription.completed":
        if (evt.transcript && evt.transcript.trim()) {
          transcriptRef.current.push({ role: "user", content: evt.transcript.trim() });
        }
        break;
      default:
        break;
    }
  }

  function attachAnalyser(stream, analyserRef, bufferRef) {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const source = audioCtxRef.current.createMediaStreamSource(stream);
    const analyser = audioCtxRef.current.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;
    bufferRef.current = new Uint8Array(analyser.fftSize);
  }

  function tick(timestamp) {
    const dt = Math.min(0.1, (timestamp - (lastFrameTimeRef.current ?? timestamp)) / 1000);
    lastFrameTimeRef.current = timestamp;

    const userAmp = userAnalyserRef.current ? getAmplitude(userAnalyserRef.current, userBufferRef.current) : 0;
    const npcAmp = npcAnalyserRef.current ? getAmplitude(npcAnalyserRef.current, npcBufferRef.current) : 0;
    if (loopRef.current) {
      loopRef.current.style.setProperty("--amp", Math.max(userAmp, npcAmp).toFixed(3));
      loopRef.current.style.setProperty("--r", stepWave(waveRef.current, bodyStateRef.current, dt).toFixed(2));
    }
    rafRef.current = requestAnimationFrame(tick);
  }

  function disconnect() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    dcRef.current?.close();
    pcRef.current?.getSenders().forEach((sender) => sender.track?.stop());
    pcRef.current?.close();
    micStreamRef.current?.getTracks().forEach((track) => track.stop());
    audioCtxRef.current?.close().catch(() => {});
    pcRef.current = null;
    dcRef.current = null;
    micStreamRef.current = null;
    audioCtxRef.current = null;
    userAnalyserRef.current = null;
    npcAnalyserRef.current = null;
  }

  async function connect() {
    setStatus("connecting");
    setErrorMessage("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("This browser doesn't support live voice calls.");
      }

      const session = await startRealtimeSession(scenarioId);

      const pc = new RTCPeerConnection();
      pcRef.current = pc;
      pc.ontrack = (e) => {
        const [stream] = e.streams;
        if (audioRef.current) audioRef.current.srcObject = stream;
        attachAnalyser(stream, npcAnalyserRef, npcBufferRef);
      };

      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = micStream;
      micStream.getTracks().forEach((track) => pc.addTrack(track, micStream));
      attachAnalyser(micStream, userAnalyserRef, userBufferRef);

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      dc.addEventListener("open", () => {
        setStatus("connected");
        // The NPC opens the call by speaking the scenario's opener line --
        // the server's instructions already script this, this just
        // triggers it to actually speak.
        dc.send(JSON.stringify({ type: "response.create" }));
      });
      dc.addEventListener("message", handleServerEvent);
      dc.addEventListener("close", () => {
        setStatus((s) => (s === "error" ? s : "ended"));
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const resp = await fetch(`https://api.openai.com/v1/realtime/calls?model=${encodeURIComponent(session.model)}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.clientSecret}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp,
      });
      if (!resp.ok) {
        throw new Error(`Couldn't connect the voice call (${resp.status}).`);
      }
      const answerSdp = await resp.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

      if (resolvedMotion !== "reduce") {
        rafRef.current = requestAnimationFrame(tick);
      }
    } catch (err) {
      disconnect();
      setStatus("error");
      setErrorMessage(err.message || "Couldn't start the voice call.");
    }
  }

  function toggleMute() {
    setMuted((prev) => {
      const next = !prev;
      micStreamRef.current?.getAudioTracks().forEach((track) => {
        track.enabled = !next;
      });
      return next;
    });
  }

  /** "Goodbye" is its own brief body-language beat, not an instant cut --
   * settle into the ending pose first (see the CSS for what that looks
   * like: everything relaxes and fades toward rest), then actually tear
   * down the connection. If anything was actually said, ask about a
   * reflection next rather than closing immediately -- unlike text mode
   * there's no mission-completion signal here to auto-trigger one from, so
   * this is a deliberate ask instead. */
  function handleClose() {
    if (endingTimeoutRef.current) return; // already ending, ignore repeat clicks
    setBodyState("ending");
    bodyStateRef.current = "ending";
    endingTimeoutRef.current = setTimeout(() => {
      disconnect();
      if (transcriptRef.current.length > 0) {
        setAskingReflection(true);
      } else {
        onClose(null);
      }
    }, 700);
  }

  function respondToReflectionPrompt(wantsReflection) {
    setAskingReflection(false);
    onClose(wantsReflection ? transcriptRef.current : null);
  }

  useEffect(() => {
    if (!open) return undefined;

    // Fresh start every time this opens (it stays mounted across
    // open/close cycles within one ChatScreen session, toggled via the
    // `open` prop -- see ChatScreen.jsx), so any leftover state from a
    // previous call doesn't bleed into this one.
    setBodyState("idle");
    bodyStateRef.current = "idle";
    setWrapUpCue(false);
    setAskingReflection(false);
    transcriptRef.current = [];
    waveRef.current = { min: 30, max: 40, period: 4.5, phase: 0 };
    lastFrameTimeRef.current = null;
    if (endingTimeoutRef.current) {
      clearTimeout(endingTimeoutRef.current);
      endingTimeoutRef.current = null;
    }

    if (previewMode) {
      setStatus("connected");
      const start = performance.now();
      function previewTick(timestamp) {
        const dt = Math.min(0.1, (timestamp - (lastFrameTimeRef.current ?? timestamp)) / 1000);
        lastFrameTimeRef.current = timestamp;
        if (loopRef.current) {
          const t = (performance.now() - start) / 1000;
          loopRef.current.style.setProperty("--amp", fakeAmplitude(t).toFixed(3));
          loopRef.current.style.setProperty("--r", stepWave(waveRef.current, bodyStateRef.current, dt).toFixed(2));
        }
        rafRef.current = requestAnimationFrame(previewTick);
      }
      if (resolvedMotion !== "reduce") {
        rafRef.current = requestAnimationFrame(previewTick);
      }
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      };
    }

    connect();
    return () => {
      disconnect();
      if (endingTimeoutRef.current) {
        clearTimeout(endingTimeoutRef.current);
        endingTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, scenarioId, previewMode]);

  // Preview-only: either auto-cycle through the whole body-language
  // vocabulary on a loop (so opening the preview showcases all of it
  // without touching anything), or -- if VoiceCallPreview.jsx passes a
  // specific previewBodyState -- hold on just that one so it can be
  // inspected closely instead of drifting to the next state mid-look.
  useEffect(() => {
    if (!open || !previewMode) return undefined;

    if (previewBodyState) {
      setBodyState(previewBodyState);
      return undefined;
    }

    const cycle = ["idle", "listening", "thinking", "speaking"];
    const durations = { idle: 2500, listening: 2500, thinking: 1500, speaking: 3500 };
    let index = 0;
    let timeoutId;
    function step() {
      setBodyState(cycle[index]);
      timeoutId = setTimeout(() => {
        index = (index + 1) % cycle.length;
        step();
      }, durations[cycle[index]]);
    }
    step();
    return () => clearTimeout(timeoutId);
  }, [open, previewMode, previewBodyState]);

  if (!open) return null;

  const statusText =
    status === "connecting"
      ? "Connecting..."
      : status === "connected"
      ? muted
        ? "Muted"
        : bodyState === "listening"
        ? "Listening"
        : bodyState === "thinking"
        ? "Thinking"
        : bodyState === "speaking"
        ? "Speaking"
        : "Live"
      : status === "error"
      ? errorMessage || "Something went wrong."
      : "Call ended";

  // The visual state driving the ring/bloom/pulses: bodyState once actually
  // connected (idle/listening/thinking/speaking/ending), otherwise the
  // connection status itself (connecting/error/ended) -- bodyState isn't
  // meaningful before a connection exists.
  const visualState = status === "connected" ? bodyState : status;

  if (askingReflection) {
    return (
      <div
        className="voice-call"
        role="dialog"
        aria-modal="true"
        aria-label="Reflect on this call?"
        style={{ "--scenario-accent": accentColor, "--scenario-accent-contrast": accentContrast }}
      >
        <div className="voice-call__ask">
          <p className="voice-call__ask-title">Want a reflection on this conversation?</p>
          <p className="voice-call__ask-text">
            A warm look back at how it went -- same as text chats get, just based on what was actually said out loud.
          </p>
          <div className="voice-call__ask-buttons">
            <button type="button" className="voice-call__ask-skip" onClick={() => respondToReflectionPrompt(false)}>
              No thanks
            </button>
            <button type="button" className="voice-call__ask-yes" onClick={() => respondToReflectionPrompt(true)}>
              Yes, show me
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="voice-call"
      role="dialog"
      aria-modal="true"
      aria-label={`Live voice call with ${npcName}`}
      style={{ "--scenario-accent": accentColor, "--scenario-accent-contrast": accentContrast }}
    >
      <div className="voice-call__top">
        <p className="voice-call__name">{npcName}</p>
        <p className="voice-call__status" aria-live="polite">
          {statusText}
        </p>
        {/* Brief scene-setting, shown only while connecting -- the closest
            voice mode has to text mode's NarratorIntro, since there's no
            transcript here to establish context otherwise. Fades away once
            the call actually starts so it doesn't compete with the ring. */}
        {status === "connecting" && voiceIntro && <p className="voice-call__intro">{voiceIntro}</p>}
        {/* Persists for the rest of the call once triggered (see
            handleServerEvent) -- an explicit, unambiguous cue that this is a
            good stopping point, so the NPC verbally wrapping up is never the
            *only* signal the user gets that it's okay to end the call. */}
        {wrapUpCue && (
          <p className="voice-call__wrap-up" aria-live="polite">
            This feels like a natural stopping point -- end the call whenever you're ready.
          </p>
        )}
      </div>

      <div className={`voice-call__loop-wrapper voice-call__loop-wrapper--${visualState}`} ref={loopRef}>
        <svg className="voice-call__loop" viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            {/* Deterministic noise (fixed seed, not re-randomized per
                frame) displaces the circle's own outline -- a static
                organic imperfection riding along with the ring's real
                animation (grow/shrink, dash-flow), rather than a
                mathematically perfect curve. This is the "hand-drawn ink
                circle" quality; cheap since the noise field itself never
                re-computes, only the geometry it's warping moves. */}
            <filter id="voice-ink-wobble" x="-30%" y="-30%" width="160%" height="160%">
              <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="7" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
          {/* Soft, wide, low-opacity duplicate behind everything else --
              the "fiber optic" bloom: light diffusing into the space around
              the ring, not just sitting on its surface. */}
          <circle className="voice-call__loop-bloom" cx="50" cy="50" />
          <circle className="voice-call__loop-base" cx="50" cy="50" />
          {/* Two small bright points orbiting the ring clockwise, offset
              from each other in phase -- energy traveling around a
              biological system, rather than one continuous glowing dash
              sweeping around like a loading spinner. */}
          <circle className="voice-call__loop-pulse voice-call__loop-pulse--1" />
          <circle className="voice-call__loop-pulse voice-call__loop-pulse--2" />
          {/* A faint scatter of independently-twinkling points near the
              ring -- "galaxy ring" / "neural network halo" read, without
              literal connecting lines between them (which would look busy
              and fight the "simple lines" brief this screen started from). */}
          <g className="voice-call__loop-nodes">
            <circle className="voice-call__loop-node voice-call__loop-node--1" cx="86" cy="50" r="1.1" />
            <circle className="voice-call__loop-node voice-call__loop-node--2" cx="75.5" cy="75.5" r="0.9" />
            <circle className="voice-call__loop-node voice-call__loop-node--3" cx="50" cy="86" r="1.3" />
            <circle className="voice-call__loop-node voice-call__loop-node--4" cx="24.5" cy="75.5" r="1" />
            <circle className="voice-call__loop-node voice-call__loop-node--5" cx="14" cy="50" r="1.2" />
            <circle className="voice-call__loop-node voice-call__loop-node--6" cx="24.5" cy="24.5" r="0.9" />
            <circle className="voice-call__loop-node voice-call__loop-node--7" cx="50" cy="14" r="1.1" />
            <circle className="voice-call__loop-node voice-call__loop-node--8" cx="75.5" cy="24.5" r="1" />
          </g>
        </svg>
      </div>

      <audio ref={audioRef} autoPlay playsInline style={{ position: "absolute", width: 1, height: 1, opacity: 0 }} />

      <div className="voice-call__controls">
        <button
          type="button"
          className="voice-call__icon-btn"
          onClick={toggleMute}
          disabled={status !== "connected"}
          aria-pressed={muted}
          aria-label={muted ? "Unmute" : "Mute"}
          title={muted ? "Unmute" : "Mute"}
        >
          {muted ? (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
              <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4" />
              <line x1="4" y1="4" x2="20" y2="20" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
              <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4" />
            </svg>
          )}
        </button>
        <button type="button" className="voice-call__icon-btn voice-call__icon-btn--end" onClick={handleClose} aria-label="End call" title="End call">
          {/* A plain phone-handset glyph rotated 135deg -- the universal
              "decline/end call" shape (same silhouette as the red hangup
              icon on any phone dialer), rather than a custom mark that
              needs its own explaining. */}
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: "rotate(135deg)" }}>
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
