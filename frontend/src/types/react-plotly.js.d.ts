declare module 'react-plotly.js' {
  import { Component } from 'react';
  import { Data, Layout, Config } from 'plotly.js';

  interface PlotParams {
    data: Data[];
    layout?: Partial<Layout>;
    config?: Partial<Config>;
    style?: React.CSSProperties;
    className?: string;
    onClick?: (data: any) => void;
    onSelected?: (data: any) => void;
    onHover?: (data: any) => void;
    onUnhover?: (data: any) => void;
    onRelayout?: (data: any) => void;
    onRedraw?: () => void;
    onUpdate?: (data: any) => void;
    onPurge?: () => void;
    onError?: (err: Error) => void;
    debug?: boolean;
    useResizeHandler?: boolean;
    revision?: number;
    onInitialized?: (figure: any, graphDiv: HTMLElement) => void;
    onUpdate?: (figure: any, graphDiv: HTMLElement) => void;
    onBeforePlot?: (figure: any) => boolean;
    onAfterPlot?: (figure: any, graphDiv: HTMLElement) => void;
    onAnimatingFrame?: (figure: any, frame: any) => void;
    onAnimationInterrupted?: (figure: any) => void;
  }

  export default class Plot extends Component<PlotParams> {}
}
