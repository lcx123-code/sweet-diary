import { Platform } from 'react-native'

// ─── 色板：Together Journal 纸感编辑风格 ─────────────
export const colors = {
  bg: '#FAF8F5',           // Warm Ivory 暖白
  bgSecondary: '#F2EEE8',   // Soft Beige 次背景
  text: '#2B2B2B',          // Deep Charcoal 主文字
  textSecondary: '#7C756D', // Warm Gray 辅助文字
  textMuted: '#A39D96',     // 更淡灰
  textOnAccent: '#FFFFFF',

  accent: '#A8B8A5',        // Sage Green 鼠尾草绿（唯一强调色）
  accentLight: '#E5EDE2',   // 浅鼠尾草（选中态/背景）

  separator: '#E8E4DE',     // 暖灰分割线
  white: '#FFFFFF',

  error: '#D14646',
  success: '#4A9B6A',
} as const

// ─── 字体 ───────────────────────────────────────────
// 标题/日期：宋体；正文：系统无衬线
export const fonts = {
  serif: 'NotoSerifSC_400Regular',
  serifBold: 'NotoSerifSC_700Bold',
  sans: Platform.select({ ios: '-apple-system', default: 'HarmonyOS Sans' }) as string,
} as const

export const fontSizes = {
  h0: 48,           // 首页天数（超大）
  dateTitle: 40,    // 日期
  h1: 24,           // 页面标题
  body: 18,         // 正文
  caption: 14,      // 辅助信息
} as const

export const lineHeights = {
  body: 30,         // 18 × 1.7
  detail: 30,
} as const

// ─── 圆角 ───────────────────────────────────────────
export const radii = {
  card: 16,
  sm: 8,
  full: 9999,
} as const

// ─── 间距：杂志留白感 ──────────────────────────────
export const spacing = {
  xs: 16,     // 最小间隙
  sm: 24,     // 元素间距
  md: 32,     // 区块间距
  lg: 48,     // 页面边距 / 大留白
} as const
