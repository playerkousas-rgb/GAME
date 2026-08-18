/**
 * 全站品牌與版權設定（單一事實來源）
 * Copyright (c) 2026 Scout System. All rights reserved.
 */

export const BRAND = {
  /** 平台名稱 */
  name: 'Scout System',
  /** 中文平台名稱 */
  nameZh: '童軍遊戲系統',
  /** 平台副標 */
  tagline: '集會遊戲一站式平台',
  /** 版本 */
  version: 'v1.0.0',
} as const

/** 版權年份 */
export const COPYRIGHT_YEAR = 2026

/** 標準版權字串 — 全站統一使用此字串 */
export const COPYRIGHT = `© ${COPYRIGHT_YEAR} Scout System`

/** 全大寫版本（適用於角落浮水印） */
export const COPYRIGHT_UPPER = `COPYRIGHT ${COPYRIGHT_YEAR} SCOUT SYSTEM`
