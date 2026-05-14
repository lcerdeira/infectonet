declare module 'react-simple-maps' {
  import { ComponentType, SVGProps, MouseEvent } from 'react';

  interface GeographiesChildrenProps {
    geographies: Geography[];
  }

  interface Geography {
    rsmKey: string;
    properties: Record<string, unknown>;
    geometry: unknown;
  }

  interface GeographiesProps {
    geography: string | object;
    children: (props: GeographiesChildrenProps) => React.ReactNode;
  }

  interface GeographyStyleState {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    outline?: string;
    [key: string]: unknown;
  }

  interface GeographyProps extends SVGProps<SVGPathElement> {
    geography: Geography;
    onMouseEnter?: (event: MouseEvent<SVGPathElement>, geo: Geography) => void;
    onMouseLeave?: (event: MouseEvent<SVGPathElement>, geo: Geography) => void;
    onMouseMove?: (event: MouseEvent<SVGPathElement>, geo: Geography) => void;
    onClick?: (event: MouseEvent<SVGPathElement>, geo: Geography) => void;
    style?: {
      default?: GeographyStyleState;
      hover?: GeographyStyleState;
      pressed?: GeographyStyleState;
    };
  }

  interface ZoomableGroupProps {
    center?: [number, number];
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    children?: React.ReactNode;
    onMoveEnd?: (pos: { x: number; y: number; zoom: number }) => void;
  }

  interface ComposableMapProps extends SVGProps<SVGSVGElement> {
    projection?: string;
    projectionConfig?: Record<string, unknown>;
    width?: number;
    height?: number;
    style?: React.CSSProperties;
    children?: React.ReactNode;
  }

  interface MarkerProps {
    coordinates: [number, number];
    children?: React.ReactNode;
  }

  export const ComposableMap: ComponentType<ComposableMapProps>;
  export const Geographies: ComponentType<GeographiesProps>;
  export const Geography: ComponentType<GeographyProps>;
  export const ZoomableGroup: ComponentType<ZoomableGroupProps>;
  export const Marker: ComponentType<MarkerProps>;
}
