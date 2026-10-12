/** Bound a network step without leaving its timer or abort listener behind. */
export function waitForConnectionStep(task, { signal, timeoutMs, message }) {
  if (signal.aborted) return Promise.reject(signal.reason);
  return new Promise((resolve, reject) => {
    const finish = (callback, value) => {
      clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
      callback(value);
    };
    const onAbort = () => finish(reject, signal.reason);
    const timer = setTimeout(() => finish(reject, new Error(message)), timeoutMs);
    signal.addEventListener("abort", onAbort, { once: true });
    // Attach both handlers even if the timeout wins, so late failures are handled.
    Promise.resolve().then(() => {
      if (signal.aborted) throw signal.reason;
      return task();
    }).then(
      (value) => finish(resolve, value),
      (error) => finish(reject, error),
    );
  });
}
