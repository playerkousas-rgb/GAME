/**
 * 文字記憶 — 預設字詞包（一鍵載入，領袖亦可自行加字）
 * Copyright (c) 2026 Scout System. All rights reserved.
 */

export interface TextPack {
  id: string
  name: string
  emoji: string
  desc: string
  words: string[]
}

export const TEXT_PACKS: TextPack[] = [
  {
    id: 'colors',
    name: '顏色字',
    emoji: '🎨',
    desc: '經典 Stroop 訓練，字義與顏色可故意不符',
    words: ['紅', '橙', '黃', '綠', '藍', '靛', '紫', '黑', '白', '灰', '金', '銀'],
  },
  {
    id: 'scout-law',
    name: '童軍規律',
    emoji: '⚜️',
    desc: '童軍規律關鍵詞',
    words: ['誠實', '忠誠', '助人', '友愛', '謙恭', '愛護', '服從', '快樂', '節儉', '純潔'],
  },
  {
    id: 'gear',
    name: '露營裝備',
    emoji: '⛺',
    desc: '常用營具名稱',
    words: ['帳篷', '睡袋', '營釘', '營繩', '天幕', '地蓆', '燃料', '水袋', '頭燈', '爐具', '鍋具', '斧頭'],
  },
  {
    id: 'knots',
    name: '繩結名稱',
    emoji: '🪢',
    desc: '童軍常用繩結',
    words: ['平結', '雙套結', '接繩結', '稱人結', '營繩結', '八字結', '漁人結', '方回綁', '三腳綁', '十字綁'],
  },
  {
    id: 'directions',
    name: '方位詞',
    emoji: '🧭',
    desc: '定向訓練用',
    words: ['東', '南', '西', '北', '東北', '東南', '西北', '西南', '上', '下', '左', '右'],
  },
  {
    id: 'numbers',
    name: '數字大寫',
    emoji: '🔢',
    desc: '中文數字大寫',
    words: ['壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖', '拾', '佰', '仟'],
  },
  {
    id: 'animals',
    name: '動物',
    emoji: '🐾',
    desc: '常見動物名稱',
    words: ['老虎', '獅子', '大象', '熊貓', '狐狸', '海豚', '企鵝', '孔雀', '駱駝', '長頸鹿', '袋鼠', '刺蝟'],
  },
  {
    id: 'food',
    name: '香港美食',
    emoji: '🍜',
    desc: '本地特色食物',
    words: ['蛋撻', '菠蘿包', '雲吞麵', '燒賣', '魚蛋', '雞蛋仔', '碗仔翅', '奶茶', '腸粉', '叉燒', '煲仔飯', '糖水'],
  },
  {
    id: 'hk-places',
    name: '香港地方',
    emoji: '🏙️',
    desc: '十八區與地標',
    words: ['筲箕灣', '中環', '銅鑼灣', '尖沙咀', '旺角', '沙田', '大埔', '西貢', '荃灣', '屯門', '東涌', '赤柱'],
  },
  {
    id: 'firstaid',
    name: '急救詞彙',
    emoji: '🩹',
    desc: '急救訓練用',
    words: ['止血', '包紮', '固定', '心肺復甦', '復原臥式', '燙傷', '骨折', '中暑', '休克', '窒息', '扭傷', '求救'],
  },
  {
    id: 'weather',
    name: '天氣',
    emoji: '🌤️',
    desc: '天氣與氣象',
    words: ['晴天', '陰天', '多雲', '驟雨', '雷暴', '大霧', '颱風', '寒冷', '酷熱', '潮濕', '乾燥', '暴雨'],
  },
  {
    id: 'idioms',
    name: '四字成語',
    emoji: '📖',
    desc: '高難度長詞挑戰',
    words: ['一石二鳥', '守望相助', '同心協力', '全力以赴', '精益求精', '有備無患', '堅持不懈', '知難而進'],
  },
  {
    id: 'virtues',
    name: '品德詞',
    emoji: '💛',
    desc: '品格教育',
    words: ['勇氣', '責任', '尊重', '感恩', '堅毅', '誠信', '關愛', '合作', '自律', '包容', '謙遜', '公平'],
  },
  {
    id: 'signals',
    name: '訊號與通訊',
    emoji: '📡',
    desc: '通訊主題',
    words: ['旗語', '摩斯', '哨子', '手號', '燈號', '對講機', '暗號', '密碼', '訊號彈', '煙霧'],
  },
]

/** 移除意外混入的非中文條目，並去重 */
export function packWords(pack: TextPack): string[] {
  return [...new Set(pack.words.filter((w) => /[\u4e00-\u9fff]/.test(w)))]
}
