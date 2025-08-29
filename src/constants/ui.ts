/**
 * UI関連の定数定義
 */

// カラーパレット
export const COLORS = {
  // 予想結果の色分け
  RECOMMENDED: '#10b981', // 緑 - 推奨馬
  CAUTION: '#f59e0b', // 黄 - 注意
  AVOID: '#ef4444', // 赤 - 回避
  NEUTRAL: '#6b7280', // グレー - 中立

  // 収支の色分け
  PROFIT: '#10b981', // 緑 - 利益
  LOSS: '#ef4444', // 赤 - 損失
  BREAK_EVEN: '#6b7280', // グレー - 収支トントン

  // 信頼度の色分け
  HIGH_CONFIDENCE: '#10b981', // 緑 - 高信頼度
  MEDIUM_CONFIDENCE: '#f59e0b', // 黄 - 中信頼度
  LOW_CONFIDENCE: '#ef4444', // 赤 - 低信頼度
} as const;

// アニメーション設定
export const ANIMATIONS = {
  DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
  EASING: {
    EASE_IN: 'ease-in',
    EASE_OUT: 'ease-out',
    EASE_IN_OUT: 'ease-in-out',
  },
} as const;

// レスポンシブブレークポイント
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

// フォントサイズ
export const FONT_SIZES = {
  XS: '0.75rem', // 12px
  SM: '0.875rem', // 14px
  BASE: '1rem', // 16px
  LG: '1.125rem', // 18px
  XL: '1.25rem', // 20px
  '2XL': '1.5rem', // 24px
  '3XL': '1.875rem', // 30px
} as const;

// スペーシング
export const SPACING = {
  XS: '0.25rem', // 4px
  SM: '0.5rem', // 8px
  BASE: '1rem', // 16px
  LG: '1.5rem', // 24px
  XL: '2rem', // 32px
  '2XL': '3rem', // 48px
  '3XL': '4rem', // 64px
} as const;

// Z-index階層
export const Z_INDEX = {
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
  TOAST: 1080,
} as const;
