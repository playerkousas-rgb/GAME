/**
 * 誰是臥底 — 詞語對題庫
 * Copyright (c) 2026 Scout System. All rights reserved.
 *
 * ── 出題原則（重要）────────────────────────────────────
 * 兩個詞必須係「同一類、同一層級」嘅嘢，只差一個細節。
 *   ✅ 好： 可樂 / 芬達      — 都係汽水，只差味道
 *   ✅ 好： 雪櫃 / 冷氣機    — 都係製冷電器，只差用途
 *   ❌ 差： 水 / 麵包        — 完全唔同類，一講就穿崩
 *   ❌ 差： 貓 / 狗          — 太經典，但差異太明顯易中伏
 *
 * 檢查標準：形容其中一個嘅句子，要有一半以上都適用於另一個。
 */
export type WordPair = {
  id: string
  civilian: string
  undercover: string
  category: string
}

export const WORD_PAIRS: WordPair[] = [
  /* ===== 飲品：同類飲品，只差牌子／味道 ===== */
  { id: 'd1', civilian: '可樂', undercover: '芬達', category: '飲品' },
  { id: 'd2', civilian: '可口可樂', undercover: '百事可樂', category: '飲品' },
  { id: 'd3', civilian: '雪碧', undercover: '七喜', category: '飲品' },
  { id: 'd4', civilian: '凍檸茶', undercover: '凍檸水', category: '飲品' },
  { id: 'd5', civilian: '奶茶', undercover: '鴛鴦', category: '飲品' },
  { id: 'd6', civilian: '珍珠奶茶', undercover: '芋圓奶茶', category: '飲品' },
  { id: 'd7', civilian: '豆漿', undercover: '杏仁霜', category: '飲品' },
  { id: 'd8', civilian: '維他奶', undercover: '朱古力奶', category: '飲品' },
  { id: 'd9', civilian: '橙汁', undercover: '芒果汁', category: '飲品' },
  { id: 'd10', civilian: '運動飲品', undercover: '能量飲品', category: '飲品' },
  { id: 'd11', civilian: '齋啡', undercover: '齋茶', category: '飲品' },
  { id: 'd12', civilian: '梳打水', undercover: '蒸餾水', category: '飲品' },

  /* ===== 食物：同類食物，只差材料／做法 ===== */
  { id: 'f1', civilian: '菠蘿包', undercover: '雞尾包', category: '食物' },
  { id: 'f2', civilian: '蛋撻', undercover: '椰撻', category: '食物' },
  { id: 'f3', civilian: '燒賣', undercover: '魚蛋', category: '食物' },
  { id: 'f4', civilian: '雲吞麵', undercover: '水餃麵', category: '食物' },
  { id: 'f5', civilian: '叉燒飯', undercover: '燒肉飯', category: '食物' },
  { id: 'f6', civilian: '腸粉', undercover: '蘿蔔糕', category: '食物' },
  { id: 'f7', civilian: '薯條', undercover: '薯格', category: '食物' },
  { id: 'f8', civilian: '薯片', undercover: '蝦條', category: '食物' },
  { id: 'f9', civilian: '漢堡包', undercover: '雞腿包', category: '食物' },
  { id: 'f10', civilian: '壽司', undercover: '飯糰', category: '食物' },
  { id: 'f11', civilian: '拉麵', undercover: '烏冬', category: '食物' },
  { id: 'f12', civilian: '雪糕', undercover: '雪條', category: '食物' },
  { id: 'f13', civilian: '蛋糕', undercover: '蛋卷', category: '食物' },
  { id: 'f14', civilian: '公仔麵', undercover: '米粉', category: '食物' },
  { id: 'f15', civilian: '炒飯', undercover: '炒麵', category: '食物' },
  { id: 'f16', civilian: '雞翼', undercover: '雞髀', category: '食物' },
  { id: 'f17', civilian: '朱古力', undercover: '軟糖', category: '食物' },
  { id: 'f18', civilian: '曲奇', undercover: '威化餅', category: '食物' },
  { id: 'f19', civilian: '芝士', undercover: '牛油', category: '食物' },
  { id: 'f20', civilian: '番茄醬', undercover: '茄汁豆', category: '食物' },

  /* ===== 水果：同為水果，形態接近 ===== */
  { id: 'r1', civilian: '橙', undercover: '柑', category: '水果' },
  { id: 'r2', civilian: '西瓜', undercover: '蜜瓜', category: '水果' },
  { id: 'r3', civilian: '提子', undercover: '藍莓', category: '水果' },
  { id: 'r4', civilian: '香蕉', undercover: '芭蕉', category: '水果' },
  { id: 'r5', civilian: '士多啤梨', undercover: '車厘子', category: '水果' },
  { id: 'r6', civilian: '芒果', undercover: '木瓜', category: '水果' },

  /* ===== 童軍：同為裝備，用途相近 ===== */
  { id: 's1', civilian: '帳篷', undercover: '天幕', category: '童軍' },
  { id: 's2', civilian: '睡袋', undercover: '睡墊', category: '童軍' },
  { id: 's3', civilian: '指南針', undercover: '地圖', category: '童軍' },
  { id: 's4', civilian: '手電筒', undercover: '營燈', category: '童軍' },
  { id: 's5', civilian: '童軍帽', undercover: '方巾', category: '童軍' },
  { id: 's6', civilian: '營釘', undercover: '營繩', category: '童軍' },
  { id: 's7', civilian: '平結', undercover: '雙套結', category: '童軍' },
  { id: 's8', civilian: '露營', undercover: '野餐', category: '童軍' },
  { id: 's9', civilian: '遠足', undercover: '定向', category: '童軍' },
  { id: 's10', civilian: '營火會', undercover: '晚會', category: '童軍' },
  { id: 's11', civilian: '升旗禮', undercover: '降旗禮', category: '童軍' },
  { id: 's12', civilian: '小隊長', undercover: '副小隊長', category: '童軍' },
  { id: 's13', civilian: '急救包', undercover: '藥箱', category: '童軍' },
  { id: 's14', civilian: '水壺', undercover: '保溫壺', category: '童軍' },
  { id: 's15', civilian: '背囊', undercover: '腰包', category: '童軍' },
  { id: 's16', civilian: '哨子', undercover: '訊號鏡', category: '童軍' },

  /* ===== 香港：同類地方／事物 ===== */
  { id: 'h1', civilian: '八達通', undercover: '信用卡', category: '香港' },
  { id: 'h2', civilian: '港鐵', undercover: '輕鐵', category: '香港' },
  { id: 'h3', civilian: '小巴', undercover: '巴士', category: '香港' },
  { id: 'h4', civilian: '叮叮車', undercover: '山頂纜車', category: '香港' },
  { id: 'h5', civilian: '天星小輪', undercover: '街渡', category: '香港' },
  { id: 'h6', civilian: '茶餐廳', undercover: '冰室', category: '香港' },
  { id: 'h7', civilian: '大牌檔', undercover: '街頭小食店', category: '香港' },
  { id: 'h8', civilian: '海洋公園', undercover: '迪士尼樂園', category: '香港' },
  { id: 'h9', civilian: '獅子山', undercover: '大帽山', category: '香港' },
  { id: 'h10', civilian: '街市', undercover: '超級市場', category: '香港' },
  { id: 'h11', civilian: '公屋', undercover: '居屋', category: '香港' },
  { id: 'h12', civilian: '維多利亞港', undercover: '吐露港', category: '香港' },
  { id: 'h13', civilian: '中環', undercover: '金鐘', category: '香港' },
  { id: 'h14', civilian: '旺角', undercover: '銅鑼灣', category: '香港' },
  { id: 'h15', civilian: '便利店', undercover: '士多', category: '香港' },

  /* ===== 電器／科技：功能相近 ===== */
  { id: 'e1', civilian: '雪櫃', undercover: '冷氣機', category: '電器' },
  { id: 'e2', civilian: '風扇', undercover: '抽氣扇', category: '電器' },
  { id: 'e3', civilian: '微波爐', undercover: '焗爐', category: '電器' },
  { id: 'e4', civilian: '洗衣機', undercover: '乾衣機', category: '電器' },
  { id: 'e5', civilian: '手提電話', undercover: '平板電腦', category: '電器' },
  { id: 'e6', civilian: '手提電腦', undercover: '桌上電腦', category: '電器' },
  { id: 'e7', civilian: '耳機', undercover: '喇叭', category: '電器' },
  { id: 'e8', civilian: '智能手錶', undercover: '運動手環', category: '電器' },
  { id: 'e9', civilian: '電視機', undercover: '投影機', category: '電器' },
  { id: 'e10', civilian: '吸塵機', undercover: '掃地機械人', category: '電器' },
  { id: 'e11', civilian: '相機', undercover: '攝錄機', category: '電器' },
  { id: 'e12', civilian: '充電器', undercover: '尿袋', category: '電器' },

  /* ===== 日常用品：功能重疊 ===== */
  { id: 'n1', civilian: '牙刷', undercover: '牙線', category: '日常' },
  { id: 'n2', civilian: '洗頭水', undercover: '沐浴露', category: '日常' },
  { id: 'n3', civilian: '雨傘', undercover: '雨衣', category: '日常' },
  { id: 'n4', civilian: '眼鏡', undercover: '隱形眼鏡', category: '日常' },
  { id: 'n5', civilian: '鉛筆', undercover: '原子筆', category: '日常' },
  { id: 'n6', civilian: '擦膠', undercover: '塗改液', category: '日常' },
  { id: 'n7', civilian: '毛巾', undercover: '面紙', category: '日常' },
  { id: 'n8', civilian: '梳', undercover: '髮夾', category: '日常' },
  { id: 'n9', civilian: '書包', undercover: '行李箱', category: '日常' },
  { id: 'n10', civilian: '銀包', undercover: '散紙包', category: '日常' },
  { id: 'n11', civilian: '鬧鐘', undercover: '手錶', category: '日常' },
  { id: 'n12', civilian: '沙發', undercover: '床褥', category: '日常' },
  { id: 'n13', civilian: '窗簾', undercover: '百葉簾', category: '日常' },
  { id: 'n14', civilian: '拖鞋', undercover: '涼鞋', category: '日常' },
  { id: 'n15', civilian: '口罩', undercover: '頸巾', category: '日常' },

  /* ===== 動物：同科／同棲地，形態接近 ===== */
  { id: 'a1', civilian: '老虎', undercover: '豹', category: '動物' },
  { id: 'a2', civilian: '狼', undercover: '狐狸', category: '動物' },
  { id: 'a3', civilian: '海豚', undercover: '鯨魚', category: '動物' },
  { id: 'a4', civilian: '烏龜', undercover: '水魚', category: '動物' },
  { id: 'a5', civilian: '青蛙', undercover: '蟾蜍', category: '動物' },
  { id: 'a6', civilian: '蜜蜂', undercover: '黃蜂', category: '動物' },
  { id: 'a7', civilian: '企鵝', undercover: '海獅', category: '動物' },
  { id: 'a8', civilian: '鴨', undercover: '鵝', category: '動物' },
  { id: 'a9', civilian: '烏鴉', undercover: '八哥', category: '動物' },
  { id: 'a10', civilian: '兔仔', undercover: '倉鼠', category: '動物' },
  { id: 'a11', civilian: '駱駝', undercover: '羊駝', category: '動物' },
  { id: 'a12', civilian: '鱷魚', undercover: '蜥蜴', category: '動物' },

  /* ===== 運動：規則／場地接近 ===== */
  { id: 'p1', civilian: '籃球', undercover: '排球', category: '運動' },
  { id: 'p2', civilian: '足球', undercover: '手球', category: '運動' },
  { id: 'p3', civilian: '羽毛球', undercover: '網球', category: '運動' },
  { id: 'p4', civilian: '乒乓球', undercover: '壁球', category: '運動' },
  { id: 'p5', civilian: '游泳', undercover: '浮潛', category: '運動' },
  { id: 'p6', civilian: '跑步', undercover: '競步', category: '運動' },
  { id: 'p7', civilian: '單車', undercover: '滑板', category: '運動' },
  { id: 'p8', civilian: '攀石', undercover: '繩降', category: '運動' },
  { id: 'p9', civilian: '瑜伽', undercover: '普拉提', category: '運動' },
  { id: 'p10', civilian: '獨木舟', undercover: '直立板', category: '運動' },
  { id: 'p11', civilian: '跳繩', undercover: '跳橡筋', category: '運動' },
  { id: 'p12', civilian: '保齡球', undercover: '桌球', category: '運動' },

  /* ===== 學校／人物：角色相近 ===== */
  { id: 'u1', civilian: '班主任', undercover: '科任老師', category: '人物' },
  { id: 'u2', civilian: '校長', undercover: '副校長', category: '人物' },
  { id: 'u3', civilian: '醫生', undercover: '護士', category: '人物' },
  { id: 'u4', civilian: '警察', undercover: '消防員', category: '人物' },
  { id: 'u5', civilian: '廚師', undercover: '侍應', category: '人物' },
  { id: 'u6', civilian: '司機', undercover: '機長', category: '人物' },
  { id: 'u7', civilian: '教練', undercover: '裁判', category: '人物' },
  { id: 'u8', civilian: '歌手', undercover: '演員', category: '人物' },

  /* ===== 場所：用途接近 ===== */
  { id: 'l1', civilian: '圖書館', undercover: '書店', category: '場所' },
  { id: 'l2', civilian: '禮堂', undercover: '演講廳', category: '場所' },
  { id: 'l3', civilian: '醫院', undercover: '診所', category: '場所' },
  { id: 'l4', civilian: '機場', undercover: '火車站', category: '場所' },
  { id: 'l5', civilian: '酒店', undercover: '青年旅舍', category: '場所' },
  { id: 'l6', civilian: '戲院', undercover: '劇院', category: '場所' },
  { id: 'l7', civilian: '公園', undercover: '遊樂場', category: '場所' },
  { id: 'l8', civilian: '泳池', undercover: '沙灘', category: '場所' },

  /* ===== 天氣／大自然：現象相近 ===== */
  { id: 'w1', civilian: '落雨', undercover: '落雪', category: '天氣' },
  { id: 'w2', civilian: '打風', undercover: '行雷', category: '天氣' },
  { id: 'w3', civilian: '大霧', undercover: '煙霞', category: '天氣' },
  { id: 'w4', civilian: '日出', undercover: '日落', category: '大自然' },
  { id: 'w5', civilian: '星星', undercover: '螢火蟲', category: '大自然' },
  { id: 'w6', civilian: '瀑布', undercover: '溪澗', category: '大自然' },
  { id: 'w7', civilian: '森林', undercover: '竹林', category: '大自然' },
  { id: 'w8', civilian: '彩虹', undercover: '極光', category: '大自然' },

  /* ===== 娛樂：活動形式接近 ===== */
  { id: 'g1', civilian: '卡拉OK', undercover: '演唱會', category: '娛樂' },
  { id: 'g2', civilian: '睇戲', undercover: '睇劇', category: '娛樂' },
  { id: 'g3', civilian: '手機遊戲', undercover: '電視遊戲', category: '娛樂' },
  { id: 'g4', civilian: '砌積木', undercover: '砌拼圖', category: '娛樂' },
  { id: 'g5', civilian: '生日會', undercover: '謝師宴', category: '娛樂' },
  { id: 'g6', civilian: '桌上遊戲', undercover: '紙牌遊戲', category: '娛樂' },
  { id: 'g7', civilian: '露天音樂會', undercover: '街頭表演', category: '娛樂' },
  { id: 'g8', civilian: '扭蛋', undercover: '夾公仔', category: '娛樂' },
]

export const WORD_CATEGORIES = Array.from(new Set(WORD_PAIRS.map((w) => w.category)))
