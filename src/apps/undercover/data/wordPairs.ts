/**
 * 誰是臥底 — 詞語對題庫
 * Copyright (c) 2026 Scout System. All rights reserved.
 * civilian = 平民詞；undercover = 臥底詞（相近但不同）
 */
export type WordPair = {
  id: string
  civilian: string
  undercover: string
  category: string
}

export const WORD_PAIRS: WordPair[] = [
  // 食物
  { id: 'wp1', civilian: '菠蘿包', undercover: '雞尾包', category: '食物' },
  { id: 'wp2', civilian: '奶茶', undercover: '咖啡', category: '食物' },
  { id: 'wp3', civilian: '雲吞麵', undercover: '車仔麵', category: '食物' },
  { id: 'wp4', civilian: '燒賣', undercover: '魚蛋', category: '食物' },
  { id: 'wp5', civilian: '蛋撻', undercover: '蛋糕', category: '食物' },
  { id: 'wp6', civilian: '火鍋', undercover: '燒烤', category: '食物' },
  { id: 'wp7', civilian: '雪糕', undercover: '刨冰', category: '食物' },
  { id: 'wp8', civilian: '薯片', undercover: '蝦條', category: '食物' },
  { id: 'wp9', civilian: '壽司', undercover: '刺身', category: '食物' },
  { id: 'wp10', civilian: '豆漿', undercover: '牛奶', category: '食物' },
  { id: 'wp11', civilian: '叉燒飯', undercover: '燒鵝飯', category: '食物' },
  { id: 'wp12', civilian: '腸粉', undercover: '蘿蔔糕', category: '食物' },

  // 童軍
  { id: 'wp20', civilian: '帳篷', undercover: '天幕', category: '童軍' },
  { id: 'wp21', civilian: '指南針', undercover: '地圖', category: '童軍' },
  { id: 'wp22', civilian: '營火', undercover: '篝火晚會', category: '童軍' },
  { id: 'wp23', civilian: '繩結', undercover: '鞋帶', category: '童軍' },
  { id: 'wp24', civilian: '童軍帽', undercover: '方巾', category: '童軍' },
  { id: 'wp25', civilian: '睡袋', undercover: '被鋪', category: '童軍' },
  { id: 'wp26', civilian: '哨子', undercover: '喇叭', category: '童軍' },
  { id: 'wp27', civilian: '露營', undercover: '遠足', category: '童軍' },
  { id: 'wp28', civilian: '急救包', undercover: '藥箱', category: '童軍' },
  { id: 'wp29', civilian: '旗桿', undercover: '木棍', category: '童軍' },

  // 香港
  { id: 'wp40', civilian: '八達通', undercover: '信用卡', category: '香港' },
  { id: 'wp41', civilian: '港鐵', undercover: '巴士', category: '香港' },
  { id: 'wp42', civilian: '叮叮車', undercover: '小巴', category: '香港' },
  { id: 'wp43', civilian: '天星小輪', undercover: '渡輪', category: '香港' },
  { id: 'wp44', civilian: '獅子山', undercover: '太平山', category: '香港' },
  { id: 'wp45', civilian: '茶餐廳', undercover: '大牌檔', category: '香港' },
  { id: 'wp46', civilian: '海洋公園', undercover: '迪士尼', category: '香港' },
  { id: 'wp47', civilian: '維港', undercover: '海灘', category: '香港' },
  { id: 'wp48', civilian: '街市', undercover: '超級市場', category: '香港' },
  { id: 'wp49', civilian: '公屋', undercover: '唐樓', category: '香港' },

  // 日常
  { id: 'wp60', civilian: '牙刷', undercover: '牙膏', category: '日常' },
  { id: 'wp61', civilian: '雨傘', undercover: '雨衣', category: '日常' },
  { id: 'wp62', civilian: '手提電話', undercover: '平板電腦', category: '日常' },
  { id: 'wp63', civilian: '眼鏡', undercover: '隱形眼鏡', category: '日常' },
  { id: 'wp64', civilian: '風扇', undercover: '冷氣機', category: '日常' },
  { id: 'wp65', civilian: '書包', undercover: '行李箱', category: '日常' },
  { id: 'wp66', civilian: '鉛筆', undercover: '原子筆', category: '日常' },
  { id: 'wp67', civilian: '鬧鐘', undercover: '手錶', category: '日常' },
  { id: 'wp68', civilian: '沙發', undercover: '床', category: '日常' },
  { id: 'wp69', civilian: '毛巾', undercover: '紙巾', category: '日常' },

  // 動物
  { id: 'wp80', civilian: '貓', undercover: '狗', category: '動物' },
  { id: 'wp81', civilian: '老虎', undercover: '獅子', category: '動物' },
  { id: 'wp82', civilian: '烏龜', undercover: '蝸牛', category: '動物' },
  { id: 'wp83', civilian: '企鵝', undercover: '海豹', category: '動物' },
  { id: 'wp84', civilian: '蝴蝶', undercover: '蜜蜂', category: '動物' },
  { id: 'wp85', civilian: '鯨魚', undercover: '海豚', category: '動物' },
  { id: 'wp86', civilian: '雞', undercover: '鴨', category: '動物' },
  { id: 'wp87', civilian: '馬', undercover: '驢', category: '動物' },

  // 運動 / 娛樂
  { id: 'wp100', civilian: '籃球', undercover: '排球', category: '運動' },
  { id: 'wp101', civilian: '足球', undercover: '手球', category: '運動' },
  { id: 'wp102', civilian: '游泳', undercover: '潛水', category: '運動' },
  { id: 'wp103', civilian: '跑步', undercover: '競走', category: '運動' },
  { id: 'wp104', civilian: '單車', undercover: '滑板', category: '運動' },
  { id: 'wp105', civilian: '羽毛球', undercover: '乒乓球', category: '運動' },
  { id: 'wp106', civilian: '睇戲', undercover: '睇劇', category: '娛樂' },
  { id: 'wp107', civilian: '卡拉OK', undercover: '演唱會', category: '娛樂' },
  { id: 'wp108', civilian: '打機', undercover: '砌積木', category: '娛樂' },
  { id: 'wp109', civilian: '生日會', undercover: '婚禮', category: '娛樂' },

  // 學校 / 場所
  { id: 'wp120', civilian: '老師', undercover: '教練', category: '人物' },
  { id: 'wp121', civilian: '醫生', undercover: '護士', category: '人物' },
  { id: 'wp122', civilian: '警察', undercover: '消防員', category: '人物' },
  { id: 'wp123', civilian: '校長', undercover: '班長', category: '人物' },
  { id: 'wp124', civilian: '圖書館', undercover: '書店', category: '場所' },
  { id: 'wp125', civilian: '禮堂', undercover: '操場', category: '場所' },
  { id: 'wp126', civilian: '醫院', undercover: '診所', category: '場所' },
  { id: 'wp127', civilian: '機場', undercover: '車站', category: '場所' },

  // 大自然 / 天氣
  { id: 'wp140', civilian: '落雨', undercover: '落雪', category: '天氣' },
  { id: 'wp141', civilian: '打風', undercover: '行雷', category: '天氣' },
  { id: 'wp142', civilian: '日出', undercover: '日落', category: '大自然' },
  { id: 'wp143', civilian: '星星', undercover: '月亮', category: '大自然' },
  { id: 'wp144', civilian: '瀑布', undercover: '溪流', category: '大自然' },
  { id: 'wp145', civilian: '森林', undercover: '草原', category: '大自然' },
]

export const WORD_CATEGORIES = Array.from(new Set(WORD_PAIRS.map((w) => w.category)))
