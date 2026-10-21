/* 臣能产品资料：从原产品总览提取，保留原始字段，未新增医疗宣称。
 * displayName 与 summary 仅供界面展示；产品说明以注册/备案资料及说明书为准。
 * topics 为浏览主题，不构成诊断或推荐。
 * 使用普通 script 标签加载，无构建依赖。
 */
window.CHENNENG_TOPICS = [
  { id: "heart", label: "心脑健康" },
  { id: "sleep", label: "睡眠管理" },
  { id: "bone", label: "骨骼关节" },
  { id: "digest", label: "肝胃养护" },
  { id: "glucose", label: "血糖管理" },
  { id: "vision", label: "视力养护" },
  { id: "immune", label: "免疫与营养" },
  { id: "pain", label: "疼痛护理" },
  { id: "women", label: "女性健康" }
];

window.CHENNENG_PRODUCT_SOURCE = {
  description: "产品名称、图片、批准或备案号、使用方法及提示来自原产品清单，保留原始资料，未新增医疗宣称。",
  usageNote: "浏览主题用于查找产品资料，不构成诊断或推荐；产品信息以注册、备案资料及产品说明书为准。"
};

window.CHENNENG_PRODUCTS = [
  {
    "id": 1,
    "no": "01",
    "short": "天麻酸枣仁泽泻杜仲胶囊",
    "name": "臣能牌天麻酸枣仁泽泻杜仲胶囊",
    "cat": "food",
    "catName": "保健食品",
    "dim": "心脑与睡眠",
    "funcs": [
      "辅助降血压",
      "改善睡眠"
    ],
    "hot": [
      1
    ],
    "spec": "0.5g/粒 × 66粒/盒",
    "dose": "每日2次 · 每次3粒",
    "doseIcon": "capsule",
    "image": "assets/01-tianma.webp",
    "imgPos": "50% 38%",
    "components": [
      {
        "name": "天麻素",
        "val": "43.0",
        "unit": "mg/100g"
      },
      {
        "name": "粗多糖",
        "val": "4.4",
        "unit": "g/100g"
      }
    ],
    "materials": "天麻粉、酸枣仁提取物、泽泻提取物、杜仲提取物、五味子提取物",
    "approval": "国食健注G20100054",
    "approvalLabel": "批准文号",
    "usage": "每日2次，每次3粒，早晚各1次",
    "note": "保健食品不是药物，不能代替药物治疗疾病。",
    "topics": ["heart", "sleep"],
    "displayName": "天麻酸枣仁泽泻杜仲胶囊",
    "summary": "辅助降血压 · 改善睡眠"
  },
  {
    "id": 2,
    "no": "02",
    "short": "辅酶Q10软胶囊",
    "name": "臣能牌辅酶Q10软胶囊",
    "cat": "food",
    "catName": "保健食品",
    "dim": "心脑与睡眠",
    "funcs": [
      "增强免疫力",
      "抗氧化"
    ],
    "hot": [
      0
    ],
    "spec": "0.25g/粒 × 66粒/盒",
    "dose": "每日1次 · 每次1粒",
    "doseIcon": "capsule",
    "image": "assets/02-coq10.webp",
    "imgPos": "50% 36%",
    "components": [
      {
        "name": "辅酶Q10",
        "val": "17.6",
        "unit": "g/100g"
      }
    ],
    "materials": "辅酶Q10",
    "approval": "食健备G202333003475",
    "approvalLabel": "备案号",
    "usage": "每日1次，每次1粒，温水送服",
    "unsuitable": "少年儿童、孕妇、乳母、过敏体质人群",
    "note": "保健食品不是药物，不能代替药物治疗疾病。",
    "topics": ["immune"],
    "displayName": "辅酶Q10软胶囊",
    "summary": "增强免疫力 · 抗氧化"
  },
  {
    "id": 3,
    "no": "03",
    "short": "牦牛骨粉氨糖软骨素胶囊",
    "name": "臣能牌牦牛骨粉氨糖软骨素胶囊",
    "cat": "food",
    "catName": "保健食品",
    "dim": "骨骼关节",
    "funcs": [
      "增加骨密度"
    ],
    "hot": [
      0
    ],
    "spec": "0.4g/粒 × 66粒/盒",
    "dose": "每日2次 · 每次3粒",
    "doseIcon": "capsule",
    "image": "assets/03-maoniu.webp",
    "imgPos": "50% 38%",
    "components": [
      {
        "name": "钙",
        "val": "20.52",
        "unit": "g/100g"
      },
      {
        "name": "盐酸氨基葡萄糖",
        "val": "16",
        "unit": "g/100g"
      },
      {
        "name": "硫酸软骨素",
        "val": "10",
        "unit": "g/100g"
      }
    ],
    "materials": "牦牛骨粉、碳酸钙、硫酸软骨素、D-氨基葡萄糖盐酸盐",
    "approval": "国食健注G20250236",
    "approvalLabel": "批准文号",
    "usage": "每日2次，每次3粒",
    "note": "保健食品不是药物，不能代替药物治疗疾病。",
    "topics": ["bone"],
    "displayName": "牦牛骨粉氨糖软骨素胶囊",
    "summary": "增加骨密度"
  },
  {
    "id": 4,
    "no": "04",
    "short": "葛根枳椇五味子片",
    "name": "臣能牌葛根枳椇五味子片",
    "cat": "food",
    "catName": "保健食品",
    "dim": "肝胃养护",
    "funcs": [
      "辅助保护化学性肝损伤"
    ],
    "hot": [
      0
    ],
    "spec": "0.6g/片 × 66片/盒",
    "dose": "每日1次 · 每次2片",
    "doseIcon": "tablet",
    "image": "assets/04-gegen.webp",
    "imgPos": "50% 38%",
    "components": [
      {
        "name": "葛根素",
        "val": "4",
        "unit": "g/100g"
      },
      {
        "name": "维生素E",
        "val": "2.5",
        "unit": "g/100g"
      },
      {
        "name": "维生素B12",
        "val": "0.15",
        "unit": "mg/100g"
      }
    ],
    "materials": "葛根提取物、枳椇子提取物、香附提取物、黑芝麻提取物、五味子提取物、维生素E、维生素B12",
    "approval": "国食健注G20151039",
    "approvalLabel": "批准文号",
    "usage": "每日1次，每次2片，温水吞服",
    "note": "保健食品不是药物，不能代替药物治疗疾病。",
    "topics": ["digest"],
    "displayName": "葛根枳椇五味子片",
    "summary": "辅助保护化学性肝损伤"
  },
  {
    "id": 5,
    "no": "05",
    "short": "蒲公英党参麦冬片",
    "name": "臣能牌蒲公英党参麦冬片",
    "cat": "food",
    "catName": "保健食品",
    "dim": "肝胃养护",
    "funcs": [
      "辅助保护胃粘膜"
    ],
    "hot": [
      0
    ],
    "spec": "0.8g/片 × 66片/盒",
    "dose": "每日1次 · 每次2片",
    "doseIcon": "tablet",
    "image": "assets/05-pugongying.webp",
    "imgPos": "50% 38%",
    "components": [
      {
        "name": "粗多糖",
        "val": "7.0",
        "unit": "g/100g"
      },
      {
        "name": "黄芪甲苷",
        "val": "0.025",
        "unit": "g/100g"
      }
    ],
    "materials": "蒲公英提取物、党参提取物、黄芪提取物、麦冬提取物",
    "approval": "国食健注G20240206",
    "approvalLabel": "批准文号",
    "usage": "每日1次，每次2片",
    "note": "保健食品不是药物，不能代替药物治疗疾病。",
    "topics": ["digest"],
    "displayName": "蒲公英党参麦冬片",
    "summary": "辅助保护胃粘膜"
  },
  {
    "id": 6,
    "no": "06",
    "short": "灵芝铬桑叶片",
    "name": "臣能牌灵芝铬桑叶片",
    "cat": "food",
    "catName": "保健食品",
    "dim": "血糖管理",
    "funcs": [
      "维持血糖健康水平"
    ],
    "hot": [
      0
    ],
    "spec": "0.8g/片 × 66片/盒",
    "dose": "每日2次 · 每次3片",
    "doseIcon": "tablet",
    "image": "assets/06-lingzhi-ge.webp",
    "imgPos": "50% 38%",
    "components": [
      {
        "name": "总黄酮",
        "val": "700",
        "unit": "mg/100g"
      },
      {
        "name": "吡啶甲酸铬",
        "val": "27",
        "unit": "mg/100g"
      }
    ],
    "materials": "苦瓜提取物、灵芝提取物、桑叶提取物、吡啶甲酸铬",
    "approval": "国食健注G20141029",
    "approvalLabel": "批准文号",
    "usage": "每日2次，每次3片",
    "note": "保健食品不是药物，不能代替药物治疗疾病。",
    "topics": ["glucose"],
    "displayName": "灵芝铬桑叶片",
    "summary": "维持血糖健康水平"
  },
  {
    "id": 7,
    "no": "07",
    "short": "越橘叶黄素胶囊",
    "name": "臣能牌越橘叶黄素胶囊",
    "cat": "food",
    "catName": "保健食品",
    "dim": "视力养护",
    "funcs": [
      "缓解视觉疲劳"
    ],
    "hot": [
      0
    ],
    "spec": "450mg/粒 × 66粒/盒",
    "dose": "每日1次 · 每次2粒",
    "doseIcon": "capsule",
    "image": "assets/07-yueju.webp",
    "imgPos": "50% 38%",
    "components": [
      {
        "name": "原花青素",
        "val": "12.2",
        "unit": "g/100g"
      },
      {
        "name": "叶黄素",
        "val": "2.48",
        "unit": "g/100g"
      }
    ],
    "materials": "越橘提取物、叶黄素、枸杞子提取物",
    "approval": "国食健注G20250340",
    "approvalLabel": "批准文号",
    "usage": "每日1次，每次2粒",
    "unsuitable": "少年儿童、孕妇、乳母",
    "note": "保健食品不是药物，不能代替药物治疗疾病。",
    "topics": ["vision"],
    "displayName": "越橘叶黄素胶囊",
    "summary": "缓解视觉疲劳"
  },
  {
    "id": 8,
    "no": "08",
    "short": "远红外磁疗镇痛贴",
    "name": "美德臣® 远红外磁疗镇痛贴",
    "cat": "device",
    "catName": "二类医疗器械",
    "dim": "疼痛管理",
    "funcs": [
      "疼痛物理治疗"
    ],
    "hot": [
      0
    ],
    "spec": "90mm×120mm · 8贴/盒",
    "dose": "每6-8小时 · 更换一次",
    "doseIcon": "patch",
    "image": "assets/08-hongwaitie.webp",
    "imgPos": "50% 40%",
    "components": [
      {
        "name": "远红外陶瓷粉",
        "val": "",
        "unit": "核心组成"
      },
      {
        "name": "磁片/磁粉",
        "val": "",
        "unit": "核心组成"
      },
      {
        "name": "医用热熔压敏胶",
        "val": "",
        "unit": "核心组成"
      }
    ],
    "materials": "远红外陶瓷粉、薄荷油、磁片或磁粉、医用热熔压敏胶、无纺布、硅油纸",
    "approval": "赣械注准20182090052",
    "approvalLabel": "注册证编号",
    "usage": "清洁皮肤后贴于患处，每6-8小时更换一次",
    "scope": "颈椎病、肩周炎、骨性关节炎、软组织损伤、腰肌劳损等疼痛的物理治疗",
    "taboo": "皮肤破损、孕妇下腹部、心脏起搏器佩戴者等禁用",
    "note": "本产品为二类医疗器械，请仔细阅读产品说明书，在医务人员指导下购买和使用。",
    "topics": ["pain"],
    "displayName": "远红外磁疗镇痛贴",
    "summary": "疼痛物理治疗"
  },
  {
    "id": 9,
    "no": "09",
    "short": "灵芝孢子油软胶囊",
    "name": "臣能牌灵芝孢子油软胶囊",
    "cat": "food",
    "catName": "保健食品",
    "dim": "免疫提升",
    "funcs": [
      "增强免疫力"
    ],
    "hot": [
      0
    ],
    "spec": "250mg/粒 × 80粒/瓶 · 3瓶/盒",
    "dose": "每日2次 · 每次4粒",
    "doseIcon": "capsule",
    "image": "assets/09-lingzhi-baoziyou.webp",
    "imgPos": "50% 44%",
    "components": [
      {
        "name": "灵芝总三萜",
        "val": "39.4",
        "unit": "g/100g"
      },
      {
        "name": "麦角甾醇",
        "val": "111",
        "unit": "mg/100g"
      }
    ],
    "materials": "灵芝孢子油（原料来自国家地理标志产品冠县灵芝）",
    "approval": "国食健注G20140168",
    "approvalLabel": "批准文号",
    "usage": "每日2次，每次4粒，口服",
    "unsuitable": "少年儿童、孕妇、乳母",
    "quality": "灵芝总三萜实测 39.4g/100g · 麦角甾醇 111mg/100g",
    "note": "保健食品不是药物，不能代替药物治疗疾病。",
    "topics": ["immune"],
    "displayName": "灵芝孢子油软胶囊",
    "summary": "增强免疫力"
  },
  {
    "id": 10,
    "no": "10",
    "short": "臣能蛋白粉",
    "name": "臣能蛋白粉（成人蛋白粉）",
    "cat": "food",
    "catName": "保健食品",
    "dim": "免疫提升",
    "funcs": [
      "增强免疫力"
    ],
    "hot": [
      0
    ],
    "spec": "400g/罐",
    "dose": "每日1次 · 每次10g",
    "doseIcon": "powder",
    "image": "assets/10-danbaifen.webp",
    "imgPos": "50% 44%",
    "components": [
      {
        "name": "蛋白质",
        "val": "90",
        "unit": "g/100g"
      }
    ],
    "materials": "大豆分离蛋白、乳清蛋白",
    "approval": "食健备G202633000078",
    "approvalLabel": "备案号",
    "usage": "每日1次，每次10g，冲食，加温开水适量，搅拌均匀即可食用",
    "suitable": "因蛋白质摄入不足而致免疫低下的成人",
    "unsuitable": "少年儿童",
    "storage": "密闭，置阴凉干燥处",
    "shelf": "24个月",
    "note": "本品不能代替药物。适宜人群外的人群不推荐食用本产品。成人每日蛋白质总体食用量推荐为60g，可酌情根据个人每日食用量在用量范围内食用。无明显缺乏蛋白质的人群不推荐食用。植物蛋白过敏者不宜食用；动物蛋白过敏者不宜食用。肾功能不全者慎用。孕妇、乳母建议咨询临床医生、营养专业人员等。",
    "topics": ["immune"],
    "displayName": "臣能蛋白粉",
    "summary": "增强免疫力"
  },
  {
    "id": 11,
    "no": "11",
    "short": "低频电子脉冲睡眠治疗仪",
    "name": "美德臣低频电子脉冲睡眠治疗仪",
    "cat": "device",
    "catName": "二类医疗器械",
    "dim": "心脑与睡眠",
    "funcs": [
      "失眠辅助治疗",
      "改善睡眠质量"
    ],
    "hot": [
      0
    ],
    "spec": "家用护理设备 · 礼盒装",
    "dose": "物理疗法 · 非药物",
    "doseIcon": "device",
    "image": "assets/11-shuimianyi.webp",
    "imgPos": "50% 40%",
    "components": [
      {
        "name": "入睡更快",
        "val": "",
        "unit": "功效验证"
      },
      {
        "name": "夜醒减少",
        "val": "",
        "unit": "功效验证"
      },
      {
        "name": "睡眠连续性提升",
        "val": "",
        "unit": "功效验证"
      }
    ],
    "materials": "低频电子脉冲物理疗法（非药物干预）",
    "approval": "湘械注准20252091006",
    "approvalLabel": "注册证编号",
    "usage": "用于失眠的辅助治疗，改善睡眠质量（低频电子脉冲物理疗法）",
    "scope": "用于失眠的辅助治疗，改善睡眠质量",
    "maker": "魔卡威健康科技（湖南）有限公司",
    "proof": "飞凡检测功效证书实测：失眠受试人群规范使用后，睡眠显著改善——入睡更快、夜醒减少、睡眠连续性明显提升",
    "taboo": "孕妇及哺乳期妇女、体内有植入式电子装置者（如心脏起搏器）、体内有金属植入物者、癫痫病患者、严重心脏病或心律失常者、恶性肿瘤患者、有出血倾向者、刺激区域皮肤破损或对电极片过敏者",
    "note": "本产品为二类医疗器械，请仔细阅读产品说明书，在医务人员指导下购买和使用。个体使用有差异，产品适用范围以医疗器械注册证及产品说明书为准。",
    "topics": ["sleep"],
    "displayName": "低频电子脉冲睡眠治疗仪",
    "summary": "失眠辅助治疗 · 改善睡眠质量"
  },
  {
    "id": 12,
    "no": "12",
    "short": "抗HPV凝胶敷料",
    "name": "古芳美尔盛® 抗人乳头瘤病毒（HPV）凝胶敷料",
    "cat": "device",
    "catName": "二类医疗器械",
    "dim": "女性防护",
    "funcs": [
      "阻断HPV感染",
      "降低病毒载量"
    ],
    "hot": [
      0
    ],
    "spec": "4g/支",
    "dose": "每日1支 · 10天一疗程",
    "doseIcon": "gel",
    "image": "assets/12-hpv.webp",
    "imgPos": "50% 46%",
    "components": [
      {
        "name": "酸酐化牛β-乳球蛋白",
        "val": "",
        "unit": "核心成分"
      },
      {
        "name": "卡波姆",
        "val": "",
        "unit": "核心成分"
      },
      {
        "name": "甘油",
        "val": "",
        "unit": "核心成分"
      }
    ],
    "materials": "酸酐化牛β-乳球蛋白、卡波姆、甘油、三乙醇胺",
    "approval": "湘械注准20232180154",
    "approvalLabel": "注册证编号",
    "usage": "每日1支，10天一疗程。清洁双手与私处，取出凝胶器，拔开无菌顶盖，放入推进器后部，插入阴道约3公分，轻轻将凝胶推入",
    "scope": "通过在阴道壁形成一层保护性凝胶膜，将阴道壁与外界细菌物理隔离，从而阻止病原微生物定植。阻断生殖道高危HPV感染，用于降低HPV病毒载量",
    "maker": "湖南臣能生物医药科技发展有限公司（生产许可：湘药监械生产许20180018号）",
    "taboo": "请在医生指导下使用",
    "note": "本品为二类医疗器械，请仔细阅读产品说明书。孕妇、哺乳期妇女使用前请咨询医生。宣传仅可使用注册证批准的「阻断感染」「降低病毒载量」等表述，不得宣称「治疗」「治愈」。",
    "topics": ["women"],
    "displayName": "抗HPV凝胶敷料",
    "summary": "阻断HPV感染 · 降低病毒载量"
  }
];
