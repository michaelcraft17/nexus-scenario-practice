import { useEffect } from "react";

const TARGET_SELECTOR = "a,button,img,input,select,textarea,[role=button],[aria-label],[title]";

/**
 * Tooltips feature: shows a small label for whatever link/button/image is
 * hovered or focused -- helps anyone who can't tell what an icon-only
 * control does. Ported from the Accessibility Mapper. The accessibility
 * menu itself is skipped (its tiles already describe themselves).
 */
export function useTooltips(enabled) {
  useEffect(() => {
    if (!enabled) return;
    const tip = document.createElement("div");
    tip.className = "a11y-tip";
    tip.setAttribute("aria-hidden", "true");
    document.documentElement.appendChild(tip);

    const hide = () => {
      tip.style.display = "none";
    };
    const show = (e) => {
      const el = e.target.closest?.(TARGET_SELECTOR);
      if (!el || el.closest(".a11y-menu")) {
        hide();
        return;
      }
      const text = (
        el.getAttribute("aria-label") ||
        el.getAttribute("title") ||
        el.getAttribute("alt") ||
        el.getAttribute("placeholder") ||
        el.textContent ||
        ""
      )
        .trim()
        .replace(/\s+/g, " ");
      if (!text) {
        hide();
        return;
      }
      tip.textContent = text.length > 160 ? text.slice(0, 157) + "…" : text;
      tip.style.display = "block";
      const r = el.getBoundingClientRect();
      const t = tip.getBoundingClientRect();
      const left = Math.min(Math.max(8, r.left + r.width / 2 - t.width / 2), window.innerWidth - t.width - 8);
      const top = r.bottom + 8 + t.height > window.innerHeight ? Math.max(8, r.top - t.height - 8) : r.bottom + 8;
      tip.style.left = `${left}px`;
      tip.style.top = `${top}px`;
    };

    document.addEventListener("mouseover", show);
    document.addEventListener("focusin", show);
    document.addEventListener("mouseout", hide);
    document.addEventListener("focusout", hide);
    return () => {
      document.removeEventListener("mouseover", show);
      document.removeEventListener("focusin", show);
      document.removeEventListener("mouseout", hide);
      document.removeEventListener("focusout", hide);
      tip.remove();
    };
  }, [enabled]);
}
