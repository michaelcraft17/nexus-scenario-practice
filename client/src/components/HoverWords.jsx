/**
 * Text split into one span per word, so whichever word the mouse is over can
 * grow on its own (see .hover-word in index.css) -- a reading aid for
 * following a line word by word. The spaces stay plain text between the
 * spans, so the line still wraps, copies and reads aloud as a normal
 * sentence.
 */
export default function HoverWords({ text }) {
  if (!text) return null;
  return (
    <span className="hover-words">
      {text.split(/(\s+)/).map((part, i) =>
        /^\s+$/.test(part) || !part ? part : (
          <span key={i} className="hover-word">
            {part}
          </span>
        )
      )}
    </span>
  );
}
