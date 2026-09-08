export type EmbedMode = 'proxy' | 'direct';

export interface KioskConfig {
  url: string;
  refreshIntervalSeconds: number; // 0 = disabled
  mode: EmbedMode;
  zoom: number; // 0.8 to 1.25 (80% - 125%)
  rotation: 0 | 90 | 180 | 270;
  overscanMargin: number; // 0 to 40 px
  showProgressBar: boolean;
  showReloadBadge: boolean;
  autoFullscreen: boolean;
  stealthCursor: boolean;
}

export interface EmbedCheckResult {
  status: number;
  canEmbedDirectly: boolean;
  xFrameOptions?: string | null;
  csp?: string | null;
  finalUrl?: string;
  error?: string;
}
