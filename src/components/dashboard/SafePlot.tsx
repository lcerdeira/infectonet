'use client';

/**
 * SafePlot — wraps react-plotly.js to prevent the
 * "_scrollZoom undefined" error.
 *
 * Root cause: react-plotly.js calls Plotly.update() when props change.
 * Plotly.update() internally calls Fx.update() which reads
 * _fullLayout._scrollZoom. If the component is being unmounted at the
 * same time (key change when switching viruses), _fullLayout is already
 * null → TypeError.
 *
 * Fix: pass `revision` prop to react-plotly.js.  When revision changes,
 * the library routes through Plotly.react() instead of Plotly.update().
 * Plotly.react() does not call Fx.update(), so _scrollZoom is never
 * touched.  We increment revision on every data reference change so the
 * safe path is always taken.
 *
 * We also set useResizeHandler={false} to prevent a second race condition
 * where the window-resize handler fires after the plot has been purged.
 */

import dynamic from 'next/dynamic';
import { useRef } from 'react';
import type Plotly from 'plotly.js';

// Load react-plotly.js client-side only (no SSR, avoids buffer/canvas issues)
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface Props {
  data:   Plotly.Data[];
  layout: Partial<Plotly.Layout>;
  config?: Partial<Plotly.Config>;
  style?: React.CSSProperties;
}

let _rev = 0;

export function SafePlot({ data, layout, config, style }: Props) {
  // Increment revision whenever the data array reference changes.
  // This ensures react-plotly.js always calls Plotly.react() (safe)
  // rather than Plotly.update() (unsafe during unmount).
  const prevData = useRef<Plotly.Data[]>(data);
  const revision  = useRef(++_rev);
  if (prevData.current !== data) {
    prevData.current = data;
    revision.current = ++_rev;
  }

  return (
    <Plot
      data={data}
      layout={layout}
      config={config ?? { displayModeBar: false, responsive: true }}
      style={{ width: '100%', ...style }}
      revision={revision.current}
      useResizeHandler={false}
    />
  );
}
