export function safeNumber(value) {
  const normalized = typeof value === "string"
    ? value
      .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
      .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
      .replace(/[\s,_٬]/g, "")
      .replace("٫", ".")
    : value;
  const number = Number(normalized);
  return value !== null && value !== "" && Number.isFinite(number) ? number : null;
}
export function money(value, digits = 0) {
  const number = safeNumber(value);
  if (number === null) return "—";
  return new Intl.NumberFormat("en-US-u-nu-latn", {
    style: "currency", currency: "USD", maximumFractionDigits: digits, minimumFractionDigits: digits,
  }).format(number);
}
export function compactMoney(value) {
  const number = safeNumber(value);
  if (number === null) return "—";
  return new Intl.NumberFormat("en-US-u-nu-latn", {
    style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1,
  }).format(number);
}

export function integer(value) {
  return new Intl.NumberFormat("en-US-u-nu-latn", { maximumFractionDigits: 0 }).format(Number(value) || 0);
}

export function metricPercent(value, digits = 1) {
  const number = safeNumber(value);
  if (number === null) return "—";
  if (number > 999) return ">999%";
  if (number < -999) return "<−999%";
  return `${number > 0 ? "+" : ""}${number.toFixed(digits)}%`;
}

export function probabilityPercent(value) {
  const number = safeNumber(value);
  return number === null ? "—" : `${Math.round(number * 100)}%`;
}

export function displayDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

export function human(value) {
  return String(value || "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function activityLabel(value) {
  const number = safeNumber(value);
  if (number === null) return "Activity unavailable";
  if (number >= 5_000_000) return "High activity";
  if (number >= 500_000) return "Active trading";
  if (number >= 100_000) return "Moderate activity";
  return "Lower activity";
}

export function toneLabel(tone) {
  if (!tone?.available) return "Filing outlook unavailable";
  return `Filing outlook: ${String(tone.label || "available").toLowerCase()}`;
}

export function opportunityLabel(item) {
  const status = item.opportunity?.signal_status;
  if (status === "above_threshold" || item.opportunity?.label === "Above opportunity threshold") return "Strong research candidate";
  if (status === "below_threshold" || item.opportunity?.label === "Below opportunity threshold") return "Broader research candidate";
  return item.opportunity?.label || "Comparative research score";
}
