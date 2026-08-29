import { Item } from '../types'

export const DEFAULT_BUILT_IN_ITEMS: Item[] = [
  // === 初級（幼童軍）===
  { id: 'rope', name: '繩索', emoji: '🪢', category: '求生', level: 'easy', builtIn: true },
  { id: 'compass', name: '指南針', emoji: '🧭', category: '定向', level: 'easy', builtIn: true },
  { id: 'whistle', name: '哨子', emoji: '📯', category: '安全', level: 'easy', builtIn: true },
  { id: 'flashlight', name: '手電筒', emoji: '🔦', category: '夜間', level: 'easy', builtIn: true },
  { id: 'backpack', name: '背包', emoji: '🎒', category: '裝備', level: 'easy', builtIn: true },
  { id: 'water', name: '水壺', emoji: '🧴', category: '補給', level: 'easy', builtIn: true },
  { id: 'hat', name: '童軍帽', emoji: '🧢', category: '制服', level: 'easy', builtIn: true },
  { id: 'map', name: '地圖', emoji: '🗺️', category: '定向', level: 'easy', builtIn: true },
  { id: 'notebook', name: '筆記本', emoji: '📒', category: '記錄', level: 'easy', builtIn: true },
  { id: 'pencil', name: '鉛筆', emoji: '✏️', category: '記錄', level: 'easy', builtIn: true },
  { id: 'badge', name: '童軍章', emoji: '🏅', category: '榮譽', level: 'easy', builtIn: true },
  { id: 'watch', name: '手錶', emoji: '⌚', category: '時間', level: 'easy', builtIn: true },
  { id: 'bandana', name: '方巾', emoji: '🟩', category: '制服', level: 'easy', builtIn: true },
  { id: 'socks', name: '厚襪', emoji: '🧦', category: '服裝', level: 'easy', builtIn: true },
  { id: 'soap', name: '肥皂', emoji: '🧼', category: '衛生', level: 'easy', builtIn: true },
  { id: 'spoon', name: '湯匙', emoji: '🥄', category: '炊事', level: 'easy', builtIn: true },
  { id: 'fork', name: '叉子', emoji: '🍴', category: '炊事', level: 'easy', builtIn: true },
  { id: 'duck', name: '小鴨', emoji: '🦆', category: '動物', level: 'easy', builtIn: true },

  // === 中級（童軍）===
  { id: 'firstaid', name: '急救包', emoji: '🩹', category: '醫療', level: 'medium', builtIn: true },
  { id: 'carabiner', name: '扣環', emoji: '🧷', category: '繩結', level: 'medium', builtIn: true },
  { id: 'knife', name: '多功能小刀', emoji: '🔪', category: '工具', level: 'medium', builtIn: true },
  { id: 'mug', name: '露營杯', emoji: '☕', category: '炊事', level: 'medium', builtIn: true },
  { id: 'tent', name: '帳篷', emoji: '⛺', category: '露營', level: 'medium', builtIn: true },
  { id: 'binoculars', name: '望遠鏡', emoji: '🔭', category: '觀察', level: 'medium', builtIn: true },
  { id: 'radio', name: '對講機', emoji: '📻', category: '通訊', level: 'medium', builtIn: true },
  { id: 'gloves', name: '手套', emoji: '🧤', category: '防護', level: 'medium', builtIn: true },
  { id: 'boots', name: '登山鞋', emoji: '🥾', category: '服裝', level: 'medium', builtIn: true },
  { id: 'raincoat', name: '雨衣', emoji: '🧥', category: '天候', level: 'medium', builtIn: true },
  { id: 'lantern', name: '營燈', emoji: '🏮', category: '夜間', level: 'medium', builtIn: true },
  { id: 'thermos', name: '保溫瓶', emoji: '🫙', category: '補給', level: 'medium', builtIn: true },

  // === 高級（深資童軍）===
  { id: 'fire', name: '營火柴', emoji: '🔥', category: '生火', level: 'hard', builtIn: true },
  { id: 'paracord', name: '傘繩', emoji: '🧵', category: '繩結', level: 'hard', builtIn: true },
  { id: 'altimeter', name: '高度計', emoji: '📟', category: '定向', level: 'hard', builtIn: true },
  { id: 'signal', name: '訊號鏡', emoji: '🪞', category: '求救', level: 'hard', builtIn: true },
  { id: 'canteen', name: '軍用水壺', emoji: '🥤', category: '補給', level: 'hard', builtIn: true },
  { id: 'stakes', name: '營釘', emoji: '📌', category: '露營', level: 'hard', builtIn: true },
  { id: 'stove', name: '卡式爐', emoji: '🍳', category: '炊事', level: 'hard', builtIn: true },
  { id: 'tarp', name: '天幕', emoji: '🏕️', category: '露營', level: 'hard', builtIn: true },
  { id: 'pulley', name: '滑輪', emoji: '⚙️', category: '繩結', level: 'hard', builtIn: true },
  { id: 'gps', name: 'GPS定位器', emoji: '📡', category: '定向', level: 'hard', builtIn: true },
  { id: 'whistle2', name: '求生哨', emoji: '📣', category: '求救', level: 'hard', builtIn: true },
  { id: 'mirror', name: '求救鏡', emoji: '🪞', category: '求救', level: 'hard', builtIn: true },

  // ===== 擴充：初級 =====
  { id: 'apple', name: '蘋果', emoji: '🍎', category: '食物', level: 'easy', builtIn: true },
  { id: 'banana', name: '香蕉', emoji: '🍌', category: '食物', level: 'easy', builtIn: true },
  { id: 'bread', name: '麵包', emoji: '🍞', category: '食物', level: 'easy', builtIn: true },
  { id: 'egg', name: '雞蛋', emoji: '🥚', category: '食物', level: 'easy', builtIn: true },
  { id: 'ball2', name: '足球', emoji: '⚽', category: '運動', level: 'easy', builtIn: true },
  { id: 'key', name: '鎖匙', emoji: '🔑', category: '日常', level: 'easy', builtIn: true },
  { id: 'umbrella', name: '雨傘', emoji: '☂️', category: '日常', level: 'easy', builtIn: true },
  { id: 'glasses', name: '眼鏡', emoji: '👓', category: '日常', level: 'easy', builtIn: true },
  { id: 'shoe', name: '行山鞋', emoji: '🥾', category: '服裝', level: 'easy', builtIn: true },
  { id: 'towel', name: '毛巾', emoji: '🧻', category: '衛生', level: 'easy', builtIn: true },
  { id: 'comb', name: '梳', emoji: '🪮', category: '衛生', level: 'easy', builtIn: true },
  { id: 'bell', name: '鈴', emoji: '🔔', category: '訊號', level: 'easy', builtIn: true },
  { id: 'star2', name: '星章', emoji: '⭐', category: '榮譽', level: 'easy', builtIn: true },
  { id: 'scissors', name: '剪刀', emoji: '✂️', category: '工具', level: 'easy', builtIn: true },
  { id: 'ruler', name: '間尺', emoji: '📏', category: '工具', level: 'easy', builtIn: true },
  { id: 'candle', name: '蠟燭', emoji: '🕯️', category: '照明', level: 'easy', builtIn: true },
  { id: 'basket', name: '籃子', emoji: '🧺', category: '裝備', level: 'easy', builtIn: true },

  // ===== 擴充：中級 =====
  { id: 'canteen2', name: '保溫壺', emoji: '🥤', category: '補給', level: 'medium', builtIn: true },
  { id: 'battery', name: '電池', emoji: '🔋', category: '電器', level: 'medium', builtIn: true },
  { id: 'padlock', name: '掛鎖', emoji: '🔒', category: '安全', level: 'medium', builtIn: true },
  { id: 'hammer', name: '鎚仔', emoji: '🔨', category: '工具', level: 'medium', builtIn: true },
  { id: 'wrench', name: '扳手', emoji: '🔧', category: '工具', level: 'medium', builtIn: true },
  { id: 'screwdriver', name: '螺絲批', emoji: '🪛', category: '工具', level: 'medium', builtIn: true },
  { id: 'magnet', name: '磁石', emoji: '🧲', category: '科學', level: 'medium', builtIn: true },
  { id: 'thermometer', name: '溫度計', emoji: '🌡️', category: '科學', level: 'medium', builtIn: true },
  { id: 'matches', name: '火柴', emoji: '🔥', category: '生火', level: 'medium', builtIn: true },
  { id: 'plaster', name: '膠布', emoji: '🩹', category: '醫療', level: 'medium', builtIn: true },
  { id: 'pill', name: '藥丸', emoji: '💊', category: '醫療', level: 'medium', builtIn: true },
  { id: 'syringe', name: '針筒', emoji: '💉', category: '醫療', level: 'medium', builtIn: true },
  { id: 'radio2', name: '無線電', emoji: '📻', category: '通訊', level: 'medium', builtIn: true },
  { id: 'envelope', name: '信封', emoji: '✉️', category: '記錄', level: 'medium', builtIn: true },
  { id: 'clip', name: '萬字夾', emoji: '📎', category: '文具', level: 'medium', builtIn: true },
  { id: 'tape', name: '膠紙', emoji: '🎞️', category: '文具', level: 'medium', builtIn: true },
  { id: 'bucket', name: '水桶', emoji: '🪣', category: '炊事', level: 'medium', builtIn: true },
  { id: 'plate', name: '碟', emoji: '🍽️', category: '炊事', level: 'medium', builtIn: true },
  { id: 'chopsticks', name: '筷子', emoji: '🥢', category: '炊事', level: 'medium', builtIn: true },
  { id: 'saw', name: '手鋸', emoji: '🪚', category: '工具', level: 'medium', builtIn: true },

  // ===== 擴充：高級 =====
  { id: 'sextant', name: '六分儀', emoji: '🧿', category: '定向', level: 'hard', builtIn: true },
  { id: 'crampon', name: '冰爪', emoji: '🥶', category: '登山', level: 'hard', builtIn: true },
  { id: 'harness', name: '安全帶', emoji: '🦺', category: '攀登', level: 'hard', builtIn: true },
  { id: 'helmet', name: '安全帽', emoji: '⛑️', category: '攀登', level: 'hard', builtIn: true },
  { id: 'descender', name: '下降器', emoji: '🔗', category: '攀登', level: 'hard', builtIn: true },
  { id: 'filter', name: '濾水器', emoji: '🚰', category: '求生', level: 'hard', builtIn: true },
  { id: 'flint', name: '打火石', emoji: '⚡', category: '生火', level: 'hard', builtIn: true },
  { id: 'tinder', name: '火絨', emoji: '🪵', category: '生火', level: 'hard', builtIn: true },
  { id: 'splint', name: '夾板', emoji: '🩼', category: '醫療', level: 'hard', builtIn: true },
  { id: 'tourniquet', name: '止血帶', emoji: '🩸', category: '醫療', level: 'hard', builtIn: true },
  { id: 'flare', name: '照明彈', emoji: '🎆', category: '求救', level: 'hard', builtIn: true },
  { id: 'beacon', name: '定位信標', emoji: '🛰️', category: '求救', level: 'hard', builtIn: true },
  { id: 'anemometer', name: '風速計', emoji: '🌬️', category: '氣象', level: 'hard', builtIn: true },
  { id: 'barometer', name: '氣壓計', emoji: '🎚️', category: '氣象', level: 'hard', builtIn: true },
  { id: 'sundial', name: '日晷', emoji: '🕰️', category: '時間', level: 'hard', builtIn: true },
]

export const DISTRACTORS: Item[] = [
  { id: 'fake-rope', name: '細繩', emoji: '🧶', category: '干擾', level: 'easy', builtIn: true },
  { id: 'fake-compass', name: '玩具指南針', emoji: '🧭', category: '干擾', level: 'easy', builtIn: true },
  { id: 'fake-hat', name: '棒球帽', emoji: '🧢', category: '干擾', level: 'easy', builtIn: true },
  { id: 'fake-radio', name: '收音機', emoji: '📻', category: '干擾', level: 'medium', builtIn: true },
  { id: 'fake-lantern', name: '手提燈', emoji: '🏮', category: '干擾', level: 'medium', builtIn: true },
  { id: 'fake-knife', name: '膠刀', emoji: '🔪', category: '干擾', level: 'medium', builtIn: true },
  { id: 'fake-water', name: '膠水樽', emoji: '💧', category: '干擾', level: 'easy', builtIn: true },
  { id: 'fake-map', name: '海報', emoji: '🖼️', category: '干擾', level: 'easy', builtIn: true },
  { id: 'fake-torch', name: '手機電筒', emoji: '📱', category: '干擾', level: 'easy', builtIn: true },
  { id: 'fake-bag', name: '購物袋', emoji: '🛍️', category: '干擾', level: 'easy', builtIn: true },
  { id: 'fake-cup', name: '紙杯', emoji: '🥤', category: '干擾', level: 'easy', builtIn: true },
  { id: 'fake-clock', name: '鬧鐘', emoji: '⏰', category: '干擾', level: 'medium', builtIn: true },
  { id: 'fake-scissors', name: '指甲鉗', emoji: '💅', category: '干擾', level: 'medium', builtIn: true },
  { id: 'fake-band', name: '橡皮筋', emoji: '⭕', category: '干擾', level: 'medium', builtIn: true },
  { id: 'fake-glasses', name: '太陽眼鏡', emoji: '🕶️', category: '干擾', level: 'medium', builtIn: true },
  { id: 'fake-battery', name: '充電寶', emoji: '🔌', category: '干擾', level: 'hard', builtIn: true },
  { id: 'fake-gps', name: '運動手錶', emoji: '⌚', category: '干擾', level: 'hard', builtIn: true },
  { id: 'fake-helmet', name: '單車頭盔', emoji: '🚴', category: '干擾', level: 'hard', builtIn: true },
]

export const STICKER_LIBRARY: { id: string; name: string; emoji: string }[] = [
  { id: 'star', name: '星星', emoji: '⭐' },
  { id: 'heart', name: '心心', emoji: '❤️' },
  { id: 'moon', name: '月亮', emoji: '🌙' },
  { id: 'sun', name: '太陽', emoji: '☀️' },
  { id: 'cloud', name: '雲朵', emoji: '☁️' },
  { id: 'rainbow', name: '彩虹', emoji: '🌈' },
  { id: 'tree', name: '樹木', emoji: '🌳' },
  { id: 'flower', name: '花朵', emoji: '🌸' },
  { id: 'butterfly', name: '蝴蝶', emoji: '🦋' },
  { id: 'bird', name: '小鳥', emoji: '🐦' },
  { id: 'fish', name: '魚兒', emoji: '🐟' },
  { id: 'cat', name: '貓咪', emoji: '🐱' },
  { id: 'dog', name: '狗狗', emoji: '🐶' },
  { id: 'rocket', name: '火箭', emoji: '🚀' },
  { id: 'car', name: '汽車', emoji: '🚗' },
  { id: 'bike', name: '單車', emoji: '🚲' },
  { id: 'ball', name: '球', emoji: '⚽' },
  { id: 'bee', name: '蜜蜂', emoji: '🐝' },
  { id: 'crown', name: '王冠', emoji: '👑' },
  { id: 'gem', name: '寶石', emoji: '💎' },
]

export const shuffleArray = <T,>(arr: T[]): T[] => {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export const normalizeText = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, '')