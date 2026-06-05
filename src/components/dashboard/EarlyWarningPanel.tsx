'use client';

/**
 * EarlyWarningPanel — SENTINEL-Φ pilot early-warning display.
 * Shows the composite Spillover/Amplification Index (SAI), the alert tier,
 * and the three fused signal channels (ecological / genomic / event).
 */

import { useEffect, useState } from 'react';
import { RefreshCw, Siren, ShieldCheck, Info } from 'lucide-react';

interface Channel { value: number; elevated: boolean; detail: string; }
interface EWData {
  algorithm: string; virus: string; label: string;
  sai: number; tier: string; tierColor: string; tierLabel: string;
  recommendedAction: string;
  channels: { ecological: Channel; genomic: Channel; event: Channel };
  fusion: string;
  integrity: { algorithm: string; digest: string; seq?: number | null; chainHash?: string | null };
  signature?: { algorithm: string; keyId?: string; value?: string; signed?: boolean };
  generated: string;
  note: string;
}

function ChannelBar({ name, letter, role, ch }: { name: string; letter: string; role: string; ch: Channel }) {
  const color = ch.elevated ? '#d62728' : ch.value >= 30 ? '#f5c518' : '#9ca3af';
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{ backgroundColor: color }}>{letter}</span>
        <span className="text-xs font-semibold text-gray-800">{name}</span>
        <span className="ml-auto text-xs font-bold" style={{ color }}>{ch.value}/100</span>
      </div>
      <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">{role}</p>
      <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${ch.value}%`, backgroundColor: color }} />
      </div>
      <p className="mt-1.5 text-[11px] text-gray-500 leading-snug">{ch.detail}</p>
    </div>
  );
}

export function EarlyWarningPanel({ virusId }: { virusId: string }) {
  const [data, setData] = useState<EWData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/earlywarning?virus=${virusId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [virusId]);

  if (loading) return (
    <div className="flex items-center gap-2 py-6 text-gray-400 text-sm">
      <RefreshCw className="h-4 w-4 animate-spin" /> Computing SENTINEL-Φ early-warning index…
    </div>
  );
  if (!data) return null;

  return (
    <div className="rounded-2xl border-2 bg-white p-5 shadow-sm" style={{ borderColor: `${data.tierColor}55` }}>
      {/* Header + tier */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Siren className="h-5 w-5" style={{ color: data.tierColor }} />
        <h3 className="text-base font-bold text-gray-900">SENTINEL-Φ Early-Warning</h3>
        <span className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white"
              style={{ backgroundColor: data.tierColor }}>
          {data.tier === 'NONE' ? 'No alert' : data.tier}
        </span>
        <span className="text-xs text-gray-500">{data.tierLabel}</span>
      </div>

      {/* SAI gauge */}
      <div className="flex items-center gap-4 mb-4">
        <div className="text-center min-w-[90px]">
          <p className="text-4xl font-extrabold" style={{ color: data.tierColor }}>{data.sai}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wide">SAI / 100</p>
        </div>
        <div className="flex-1">
          <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
                 style={{ width: `${data.sai}%`, backgroundColor: data.tierColor }} />
          </div>
          <p className="mt-2 text-xs text-gray-600">
            <span className="font-semibold">Recommended action:</span> {data.recommendedAction}
          </p>
        </div>
      </div>

      {/* Three channels */}
      <div className="grid gap-3 sm:grid-cols-3">
        <ChannelBar name="Ecological" letter="E" role="Driver" ch={data.channels.ecological} />
        <ChannelBar name="Genomic"    letter="G" role="Response" ch={data.channels.genomic} />
        <ChannelBar name="Event news" letter="N" role="Corroboration" ch={data.channels.event} />
      </div>

      <p className="mt-3 text-[10px] text-gray-400 font-mono">{data.fusion}</p>

      {/* Integrity / provenance */}
      <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
        <ShieldCheck className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
        <p className="text-[10px] text-gray-500 break-all">
          <span className="font-semibold text-gray-600">Verifiable forecast (SHA-256):</span>{' '}
          <span className="font-mono">{data.integrity.digest.slice(0, 32)}…</span>
          {data.integrity.seq != null && (
            <span className="text-gray-400"> · chain #{data.integrity.seq}</span>
          )}
          {data.signature?.value && (
            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-bold text-green-700">
              Ed25519 signed
            </span>
          )}
          <br />Each prediction is hashed (CAP-format), Ed25519-signed, and appended to a
          tamper-evident hash-chained log. Verify via <span className="font-mono">/api/earlywarning/pubkey</span>.
        </p>
      </div>

      <p className="mt-2 flex items-start gap-1.5 text-[10px] text-gray-400 italic">
        <Info className="h-3 w-3 shrink-0 mt-0.5" />
        {data.note} SENTINEL-Φ fuses ecological forcing (driver) + genomic amplification
        (response) + event news (corroboration). Pilot — see Documentation for methodology.
      </p>
    </div>
  );
}
