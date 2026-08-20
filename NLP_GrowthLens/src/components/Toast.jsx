import { useEffect } from "react";

export function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(onClose, 2600);
    return () => window.clearTimeout(timer);
  }, [message, onClose]);
  return message ? <div className="toast" role="status" aria-live="polite">{message}</div> : null;
}
