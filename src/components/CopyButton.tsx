"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CopyButton({ text, label = "کپی", small = false }: { text: string; label?: string; small?: boolean }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  if (small) {
    return (
      <button onClick={copy} title="کپی" className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white">
        {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
      </button>
    );
  }

  return (
    <button onClick={copy} className={`btn ${copied ? "btn-success" : "btn-soft"} !py-1.5 !text-xs`}>
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "کپی شد" : label}
    </button>
  );
}
