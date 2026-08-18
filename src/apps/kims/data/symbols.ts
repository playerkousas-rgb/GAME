/**
 * 圖形記憶卡 — 幾何符號 / 顏色卡池
 * Copyright (c) 2026 Scout System. All rights reserved.
 * 用於文字記憶（圖案模式），可考「形狀 + 顏色」記憶。
 */

export type ShapeKind =
  | 'circle' | 'square' | 'triangle' | 'diamond' | 'star' | 'heart'
  | 'hexagon' | 'cross' | 'arrow-up' | 'arrow-down' | 'arrow-left' | 'arrow-right'
  | 'ring' | 'half' | 'pentagon' | 'lightning'

export const SHAPES: { kind: ShapeKind; name: string }[] = [
  { kind: 'circle', name: '圓形' },
  { kind: 'square', name: '正方形' },
  { kind: 'triangle', name: '三角形' },
  { kind: 'diamond', name: '菱形' },
  { kind: 'star', name: '星形' },
  { kind: 'heart', name: '心形' },
  { kind: 'hexagon', name: '六邊形' },
  { kind: 'pentagon', name: '五邊形' },
  { kind: 'cross', name: '十字' },
  { kind: 'ring', name: '圓環' },
  { kind: 'half', name: '半圓' },
  { kind: 'lightning', name: '閃電' },
  { kind: 'arrow-up', name: '上箭嘴' },
  { kind: 'arrow-down', name: '下箭嘴' },
  { kind: 'arrow-left', name: '左箭嘴' },
  { kind: 'arrow-right', name: '右箭嘴' },
]

export const SHAPE_COLORS: { name: string; value: string }[] = [
  { name: '紅', value: '#EF4444' },
  { name: '橙', value: '#F97316' },
  { name: '黃', value: '#FACC15' },
  { name: '綠', value: '#22C55E' },
  { name: '青', value: '#06B6D4' },
  { name: '藍', value: '#3B82F6' },
  { name: '紫', value: '#A855F7' },
  { name: '粉紅', value: '#EC4899' },
  { name: '白', value: '#F8FAFC' },
]

/** 圖案主題卡池 — 大 Emoji 圖案，適合投影 */
export type EmojiPack = { id: string; name: string; emoji: string; items: { e: string; n: string }[] }

export const EMOJI_PACKS: EmojiPack[] = [
  {
    id: 'scout', name: '童軍裝備', emoji: '⚜️',
    items: [
      { e: '⛺', n: '帳篷' }, { e: '🧭', n: '指南針' }, { e: '🔦', n: '手電筒' }, { e: '🪢', n: '繩索' },
      { e: '🎒', n: '背包' }, { e: '🥾', n: '登山鞋' }, { e: '🧢', n: '童軍帽' }, { e: '🗺️', n: '地圖' },
      { e: '🔥', n: '營火' }, { e: '🩹', n: '急救' }, { e: '🔪', n: '小刀' }, { e: '🏕️', n: '天幕' },
      { e: '📯', n: '哨子' }, { e: '🧤', n: '手套' }, { e: '🏮', n: '營燈' }, { e: '🪓', n: '斧頭' },
    ],
  },
  {
    id: 'animal', name: '動物', emoji: '🦁',
    items: [
      { e: '🦁', n: '獅子' }, { e: '🐯', n: '老虎' }, { e: '🐻', n: '熊' }, { e: '🦊', n: '狐狸' },
      { e: '🐼', n: '熊貓' }, { e: '🐨', n: '樹熊' }, { e: '🐸', n: '青蛙' }, { e: '🐧', n: '企鵝' },
      { e: '🦉', n: '貓頭鷹' }, { e: '🐢', n: '烏龜' }, { e: '🐬', n: '海豚' }, { e: '🦋', n: '蝴蝶' },
      { e: '🐝', n: '蜜蜂' }, { e: '🦅', n: '老鷹' }, { e: '🐺', n: '狼' }, { e: '🦖', n: '恐龍' },
    ],
  },
  {
    id: 'food', name: '食物', emoji: '🍔',
    items: [
      { e: '🍎', n: '蘋果' }, { e: '🍌', n: '香蕉' }, { e: '🍇', n: '提子' }, { e: '🍉', n: '西瓜' },
      { e: '🍔', n: '漢堡' }, { e: '🍕', n: '薄餅' }, { e: '🍜', n: '拉麵' }, { e: '🍣', n: '壽司' },
      { e: '🍦', n: '雪糕' }, { e: '🍰', n: '蛋糕' }, { e: '🍞', n: '麵包' }, { e: '🥚', n: '雞蛋' },
      { e: '🧋', n: '珍奶' }, { e: '☕', n: '咖啡' }, { e: '🍟', n: '薯條' }, { e: '🥗', n: '沙律' },
    ],
  },
  {
    id: 'daily', name: '日常物品', emoji: '🔑',
    items: [
      { e: '🔑', n: '鎖匙' }, { e: '☂️', n: '雨傘' }, { e: '👓', n: '眼鏡' }, { e: '⌚', n: '手錶' },
      { e: '📱', n: '電話' }, { e: '💡', n: '燈泡' }, { e: '✂️', n: '剪刀' }, { e: '📚', n: '書本' },
      { e: '✏️', n: '鉛筆' }, { e: '🧴', n: '水樽' }, { e: '🪥', n: '牙刷' }, { e: '🧦', n: '襪' },
      { e: '🎧', n: '耳機' }, { e: '💰', n: '錢包' }, { e: '🪑', n: '椅' }, { e: '🕯️', n: '蠟燭' },
    ],
  },
  {
    id: 'transport', name: '交通工具', emoji: '🚌',
    items: [
      { e: '🚌', n: '巴士' }, { e: '🚇', n: '港鐵' }, { e: '🚕', n: '的士' }, { e: '🚲', n: '單車' },
      { e: '🚢', n: '輪船' }, { e: '✈️', n: '飛機' }, { e: '🚁', n: '直升機' }, { e: '🚑', n: '救護車' },
      { e: '🚒', n: '消防車' }, { e: '🛵', n: '電單車' }, { e: '🚂', n: '火車' }, { e: '⛵', n: '帆船' },
      { e: '🚜', n: '拖拉機' }, { e: '🛴', n: '滑板車' }, { e: '🚓', n: '警車' }, { e: '🚠', n: '纜車' },
    ],
  },
  {
    id: 'nature', name: '大自然', emoji: '🌳',
    items: [
      { e: '🌳', n: '樹' }, { e: '🌸', n: '花' }, { e: '🍁', n: '楓葉' }, { e: '🌵', n: '仙人掌' },
      { e: '⛰️', n: '山' }, { e: '🌊', n: '海浪' }, { e: '☀️', n: '太陽' }, { e: '🌙', n: '月亮' },
      { e: '⭐', n: '星' }, { e: '☁️', n: '雲' }, { e: '⚡', n: '閃電' }, { e: '🌈', n: '彩虹' },
      { e: '❄️', n: '雪花' }, { e: '🔥', n: '火' }, { e: '💧', n: '水滴' }, { e: '🍄', n: '蘑菇' },
    ],
  },
  {
    id: 'sport', name: '運動', emoji: '⚽',
    items: [
      { e: '⚽', n: '足球' }, { e: '🏀', n: '籃球' }, { e: '🏐', n: '排球' }, { e: '🎾', n: '網球' },
      { e: '🏸', n: '羽毛球' }, { e: '🏓', n: '乒乓' }, { e: '🏊', n: '游泳' }, { e: '🚴', n: '單車' },
      { e: '🏃', n: '跑步' }, { e: '🧗', n: '攀石' }, { e: '⛷️', n: '滑雪' }, { e: '🤸', n: '體操' },
      { e: '🥋', n: '柔道' }, { e: '🏹', n: '射箭' }, { e: '⛸️', n: '溜冰' }, { e: '🛶', n: '獨木舟' },
    ],
  },
  {
    id: 'symbol', name: '符號圖形', emoji: '🔷',
    items: [
      { e: '🔴', n: '紅圓' }, { e: '🔵', n: '藍圓' }, { e: '🟡', n: '黃圓' }, { e: '🟢', n: '綠圓' },
      { e: '🟣', n: '紫圓' }, { e: '🟠', n: '橙圓' }, { e: '🔺', n: '紅三角' }, { e: '🔻', n: '倒三角' },
      { e: '🔷', n: '藍菱' }, { e: '🔶', n: '橙菱' }, { e: '⬛', n: '黑方' }, { e: '⬜', n: '白方' },
      { e: '⭐', n: '星' }, { e: '❤️', n: '心' }, { e: '➕', n: '加號' }, { e: '❌', n: '交叉' },
    ],
  },
]
