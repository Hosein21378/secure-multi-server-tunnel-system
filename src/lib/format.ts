const nf0 = new Intl.NumberFormat("fa-IR");
const nf1 = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 1 });

export const faNum = (n: number) => nf0.format(Math.round(n));
export const faNum1 = (n: number) => nf1.format(n);

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function faDate(d: Date | string | number) {
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(new Date(d));
}

export function faDateTime(d: Date | string | number) {
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(d));
}

export function faTime(d: Date | string | number) {
  return new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(d));
}

export function faRel(d: Date | string | number) {
  const diff = (new Date(d).getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat("fa-IR", { numeric: "auto" });
  if (abs < 60) return rtf.format(Math.trunc(diff), "second");
  if (abs < 3600) return rtf.format(Math.trunc(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.trunc(diff / 3600), "hour");
  return rtf.format(Math.trunc(diff / 86400), "day");
}

export function faGb(gb: number) {
  if (gb >= 1024) return `${faNum1(gb / 1024)} ترابایت`;
  return `${faNum1(gb)} گیگابایت`;
}

export function faMb(mb: number) {
  return `${faNum1(mb)} مگابایت`;
}

/** Latin digit version for technical values (versions, IPs...) */
export const ltr = (s: string | number) => String(s);
