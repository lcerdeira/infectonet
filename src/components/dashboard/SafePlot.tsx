'use client';

/**
 * SafePlot — a thin Plotly wrapper that avoids the
 * "_scrollZoom undefined" error in react-plotly.js.
 *
 * Root cause: react-plotly.js calls Plotly.update() during React re-renders.
 * When a key change unmounts the component simultaneously, _fullLayout is
 * already null when updateFx reads _fullLayout._scrollZoom → TypeError.
 *
 * Fix: use Plotly.react() for every render (the idempotent API that does a
 * safe full re-render) + call Plotly.purge() on unmount with a mounted guard
 * so any in-flight async work is a no-op after the div is gone.
 */

import { useEffect, useRef } from 'react';
import type Plotly from 'plotly.js';

interface Props {
  data:   Plotly.Data[];
  layout: Partial<Plotly.Layout>;
  config?: Partial<Plotly.Config>;
  style?: React.CSSProperties;
}

export function SafePlot({ data, layout, config, style }: Props) {
  const divRef    = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const div = divRef.current;
    if (!div) return;

    // Dynamically import Plotly so it stays out of the SSR bundle.
    let cancelled = false;
    import('plotly.js').then((PlotlyModule) => {
      if (cancelled || !mountedRef.current || !div) return;
      const PlotlyLib = (PlotlyModule as unknown as { default: typeof Plotly }).default ?? PlotlyModule;
      // Plotly.react() is safe to call both on first mount and subsequent
      // updates — it re-uses the existing WebGL/SVG context when possible.
      (PlotlyLib as typeof Plotly).react(div, data, layout, config ?? {}).catch(() => {
        // Ignore errors that fire after unmount
      });
    });

    return () => {
      cancelled = true;
      mountedRef.current = false;
      if (!div) return;
      // Purge in a microtask so any in-flight Plotly promise can resolve
      // first (avoids "graph div is already being updated" warnings).
      Promise.resolve().then(() => {
        try {
          // Plotly attaches itself to the div as ._fullData etc.
          // purge() removes those references and the resize observer.
          import('plotly.js').then((PlotlyModule) => {
            const PlotlyLib = (PlotlyModule as unknown as { default: typeof Plotly }).default ?? PlotlyModule;
            try { (PlotlyLib as typeof Plotly).purge(div); } catch { /* ignore */ }
          });
        } catch { /* ignore */ }
      });
    };
    // Re-run whenever the data changes. stringify is intentionally avoided —
    // the parent components already use key= to force a full remount when the
    // virus changes, so update here only happens within the same virus.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, layout, config]);

  return <div ref={divRef} style={{ width: '100%', ...style }} />;
}
