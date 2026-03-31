require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/quizmaster";

const QuestionSchema = new mongoose.Schema({
  question: String,
  options: [String],
  correctIndex: Number,
  explanation: String,
  points: Number,
});

const QuizSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  difficulty: String,
  questions: [QuestionSchema],
  timePerQuestion: Number,
  isPremium: Boolean,
  entryFee: Number,
  maxReward: Number,
  playCount: Number,
  emoji: String,
  isActive: Boolean,
});

const Quiz = mongoose.models.Quiz || mongoose.model("Quiz", QuizSchema);

const quizData = [
  {
    title: "地球科学大挑战",
    description: "测试你对地球科学的了解！",
    category: "science",
    difficulty: "easy",
    emoji: "🌍",
    timePerQuestion: 20,
    isPremium: false,
    entryFee: 0,
    maxReward: 50,
    playCount: 1234,
    isActive: true,
    questions: [
      {
        question: "地球离太阳最近的行星是哪个？",
        options: ["金星", "火星", "水星", "地球"],
        correctIndex: 2,
        explanation: "水星是距离太阳最近的行星，平均距离约5790万千米。",
        points: 10,
      },
      {
        question: "地球上最深的海沟是？",
        options: ["波多黎各海沟", "马里亚纳海沟", "日本海沟", "秘鲁-智利海沟"],
        correctIndex: 1,
        explanation: "马里亚纳海沟深约11034米，是地球上最深的海沟。",
        points: 10,
      },
      {
        question: "哪种气体在地球大气中含量最多？",
        options: ["氧气", "二氧化碳", "氮气", "氩气"],
        correctIndex: 2,
        explanation: "氮气约占地球大气的78%。",
        points: 10,
      },
      {
        question: "地球绕太阳公转一圈需要多少天？",
        options: ["364天", "365.25天", "366天", "360天"],
        correctIndex: 1,
        explanation: "地球绕太阳公转周期约365.25天，因此每4年有一个闰年。",
        points: 10,
      },
      {
        question: "地球上最大的洋是？",
        options: ["大西洋", "印度洋", "北冰洋", "太平洋"],
        correctIndex: 3,
        explanation: "太平洋是世界上最大的海洋，面积约1.65亿平方千米。",
        points: 10,
      },
    ],
  },
  {
    title: "中国历史知识竞赛",
    description: "走进中国五千年历史长河！",
    category: "history",
    difficulty: "medium",
    emoji: "🏯",
    timePerQuestion: 25,
    isPremium: false,
    entryFee: 0,
    maxReward: 80,
    playCount: 987,
    isActive: true,
    questions: [
      {
        question: "中国历史上第一个统一的封建王朝是？",
        options: ["汉朝", "周朝", "秦朝", "夏朝"],
        correctIndex: 2,
        explanation: "秦朝（公元前221年-公元前206年）是中国历史上第一个统一的中央集权封建国家。",
        points: 15,
      },
      {
        question: "万里长城最初建于哪个朝代？",
        options: ["明朝", "汉朝", "秦朝", "宋朝"],
        correctIndex: 2,
        explanation: "长城最初由秦始皇于公元前221年下令修建，用于抵御北方游牧民族。",
        points: 15,
      },
      {
        question: "中国四大发明中，哪一项发明于东汉时期？",
        options: ["印刷术", "指南针", "造纸术", "火药"],
        correctIndex: 2,
        explanation: "东汉蔡伦于公元105年改良造纸术，大大降低了造纸成本。",
        points: 15,
      },
      {
        question: "唐朝最繁盛的时期被称为？",
        options: ["开元盛世", "永乐盛世", "康乾盛世", "仁宣之治"],
        correctIndex: 0,
        explanation: "唐玄宗开元年间（713-741年）是唐朝最繁荣的时期，史称'开元盛世'。",
        points: 15,
      },
      {
        question: "北京故宫始建于哪个朝代？",
        options: ["元朝", "明朝", "清朝", "宋朝"],
        correctIndex: 1,
        explanation: "故宫始建于明朝永乐四年（1406年），永乐十八年（1420年）建成。",
        points: 15,
      },
    ],
  },
  {
    title: "体育明星大搜查",
    description: "你对体育世界了解多少？",
    category: "sports",
    difficulty: "easy",
    emoji: "⚽",
    timePerQuestion: 20,
    isPremium: false,
    entryFee: 0,
    maxReward: 40,
    playCount: 2156,
    isActive: true,
    questions: [
      {
        question: "足球世界杯多少年举办一次？",
        options: ["2年", "3年", "4年", "5年"],
        correctIndex: 2,
        explanation: "FIFA世界杯每4年举办一次。",
        points: 10,
      },
      {
        question: "奥运会游泳比赛标准泳池长多少米？",
        options: ["25米", "50米", "75米", "100米"],
        correctIndex: 1,
        explanation: "奥运会游泳比赛使用50米标准泳池。",
        points: 10,
      },
      {
        question: "篮球比赛每队上场几名球员？",
        options: ["4名", "5名", "6名", "7名"],
        correctIndex: 1,
        explanation: "篮球比赛每队上场5名球员。",
        points: 10,
      },
      {
        question: "网球四大满贯赛事中，哪个是草地球场？",
        options: ["法国网球公开赛", "美国网球公开赛", "澳大利亚网球公开赛", "温布尔登网球锦标赛"],
        correctIndex: 3,
        explanation: "温布尔登是唯一一个在草地上举行的大满贯赛事。",
        points: 10,
      },
      {
        question: "马拉松的标准距离是多少？",
        options: ["40公里", "42.195公里", "44公里", "45公里"],
        correctIndex: 1,
        explanation: "马拉松的标准距离为42.195公里。",
        points: 10,
      },
    ],
  },
  {
    title: "科技前沿探索",
    description: "带你了解最新科技知识！",
    category: "technology",
    difficulty: "medium",
    emoji: "💻",
    timePerQuestion: 25,
    isPremium: false,
    entryFee: 0,
    maxReward: 80,
    playCount: 3421,
    isActive: true,
    questions: [
      {
        question: "HTTP状态码404表示什么？",
        options: ["服务器错误", "请求成功", "页面未找到", "请求重定向"],
        correctIndex: 2,
        explanation: "HTTP 404状态码表示服务器无法找到请求的资源（页面未找到）。",
        points: 15,
      },
      {
        question: "CPU全称是什么？",
        options: ["中央处理器", "中央编程单元", "计算机电源单元", "通用处理器"],
        correctIndex: 0,
        explanation: "CPU (Central Processing Unit) 即中央处理器，是计算机的核心部件。",
        points: 15,
      },
      {
        question: "第一个商业搜索引擎是哪个？",
        options: ["Google", "Yahoo", "Baidu", "Ask Jeeves"],
        correctIndex: 3,
        explanation: "Ask Jeeves（现更名为Ask.com）于1996年推出，是较早的商业搜索引擎之一。",
        points: 15,
      },
      {
        question: "Wi-Fi是以下哪种技术的商标名称？",
        options: ["蓝牙", "无线局域网", "卫星通信", "光纤通信"],
        correctIndex: 1,
        explanation: "Wi-Fi是无线局域网（WLAN）技术的商标名称，遵循IEEE 802.11标准。",
        points: 15,
      },
      {
        question: "比特币是哪年创立的？",
        options: ["2005年", "2007年", "2009年", "2011年"],
        correctIndex: 2,
        explanation: "比特币由中本聪于2009年1月推出，是世界上第一个去中心化数字货币。",
        points: 15,
      },
    ],
  },
  {
    title: "美食文化之旅",
    description: "探索全球美食文化！",
    category: "food",
    difficulty: "easy",
    emoji: "🍜",
    timePerQuestion: 20,
    isPremium: false,
    entryFee: 0,
    maxReward: 40,
    playCount: 1876,
    isActive: true,
    questions: [
      {
        question: "寿司发源于哪个国家？",
        options: ["中国", "韩国", "日本", "泰国"],
        correctIndex: 2,
        explanation: "寿司起源于日本，是日本最具代表性的传统料理之一。",
        points: 10,
      },
      {
        question: "比萨（Pizza）起源于哪个国家？",
        options: ["法国", "意大利", "西班牙", "希腊"],
        correctIndex: 1,
        explanation: "比萨起源于意大利那不勒斯，是世界上最受欢迎的食物之一。",
        points: 10,
      },
      {
        question: "中国四大菜系中哪个以辛辣著称？",
        options: ["粤菜", "淮扬菜", "鲁菜", "川菜"],
        correctIndex: 3,
        explanation: "川菜以麻辣为主要特色，是中国最具代表性的菜系之一。",
        points: 10,
      },
      {
        question: "法式长棍面包（Baguette）是哪国的代表食品？",
        options: ["德国", "法国", "英国", "比利时"],
        correctIndex: 1,
        explanation: "法式长棍面包是法国的标志性食品，在法国文化中具有重要地位。",
        points: 10,
      },
      {
        question: "以下哪种香料最贵？",
        options: ["肉桂", "黑胡椒", "藏红花", "姜黄"],
        correctIndex: 2,
        explanation: "藏红花是世界上最昂贵的香料，每克价格可达数十美元。",
        points: 10,
      },
    ],
  },
  {
    title: "动物王国秘密",
    description: "了解奇妙的动物世界！",
    category: "animals",
    difficulty: "easy",
    emoji: "🦁",
    timePerQuestion: 20,
    isPremium: false,
    entryFee: 0,
    maxReward: 50,
    playCount: 2890,
    isActive: true,
    questions: [
      {
        question: "哪种动物是地球上体型最大的？",
        options: ["非洲象", "蓝鲸", "长颈鹿", "河马"],
        correctIndex: 1,
        explanation: "蓝鲸是地球上有史以来体型最大的动物，体长可达33米，重达200吨。",
        points: 10,
      },
      {
        question: "蝙蝠用什么方式导航？",
        options: ["视觉", "嗅觉", "回声定位", "磁场感应"],
        correctIndex: 2,
        explanation: "蝙蝠通过回声定位（Echolocation）导航，发出超声波并接收回声。",
        points: 10,
      },
      {
        question: "哪种鸟不会飞但跑得很快？",
        options: ["企鹅", "鸵鸟", "鸬鹚", "鸡"],
        correctIndex: 1,
        explanation: "鸵鸟是世界上最大的鸟类，虽然不能飞，但奔跑速度可达70km/h。",
        points: 10,
      },
      {
        question: "章鱼有几个心脏？",
        options: ["1个", "2个", "3个", "4个"],
        correctIndex: 2,
        explanation: "章鱼有3个心脏：1个主心脏负责向全身泵血，2个鳃心脏负责向鳃泵血。",
        points: 10,
      },
      {
        question: "哪种动物睡眠时间最长？",
        options: ["北极熊", "树懒", "考拉", "猫"],
        correctIndex: 2,
        explanation: "考拉每天睡眠时间约18-22小时，是睡眠时间最长的动物之一。",
        points: 10,
      },
    ],
  },
  {
    title: "世界地理精英赛",
    description: "探索世界各地的地理知识！",
    category: "geography",
    difficulty: "medium",
    emoji: "🗺️",
    timePerQuestion: 25,
    isPremium: false,
    entryFee: 0,
    maxReward: 80,
    playCount: 1543,
    isActive: true,
    questions: [
      {
        question: "世界上面积最大的国家是？",
        options: ["中国", "美国", "俄罗斯", "加拿大"],
        correctIndex: 2,
        explanation: "俄罗斯是世界上面积最大的国家，面积约1709万平方千米。",
        points: 15,
      },
      {
        question: "尼罗河流经哪个大洲？",
        options: ["亚洲", "欧洲", "非洲", "南美洲"],
        correctIndex: 2,
        explanation: "尼罗河是非洲最长的河流，流经11个国家。",
        points: 15,
      },
      {
        question: "世界上最高的山峰是？",
        options: ["K2", "珠穆朗玛峰", "乞力马扎罗山", "麦金利山"],
        correctIndex: 1,
        explanation: "珠穆朗玛峰海拔8848.86米，是世界上最高的山峰。",
        points: 15,
      },
      {
        question: "亚马逊雨林主要分布在哪个国家？",
        options: ["秘鲁", "哥伦比亚", "巴西", "委内瑞拉"],
        correctIndex: 2,
        explanation: "约60%的亚马逊雨林位于巴西境内。",
        points: 15,
      },
      {
        question: "哪个国家拥有最多的自然世界遗产？",
        options: ["澳大利亚", "中国", "美国", "巴西"],
        correctIndex: 0,
        explanation: "澳大利亚拥有约20处自然世界遗产，是全球最多的国家之一。",
        points: 15,
      },
    ],
  },
  {
    title: "影视娱乐大考验",
    description: "你是娱乐达人吗？",
    category: "entertainment",
    difficulty: "easy",
    emoji: "🎬",
    timePerQuestion: 20,
    isPremium: true,
    entryFee: 30,
    maxReward: 150,
    playCount: 456,
    isActive: true,
    questions: [
      {
        question: "《哈利·波特》系列中，霍格沃兹有几个学院？",
        options: ["3个", "4个", "5个", "6个"],
        correctIndex: 1,
        explanation: "霍格沃兹有4个学院：格兰芬多、斯莱特林、赫奇帕奇和拉文克劳。",
        points: 10,
      },
      {
        question: "《泰坦尼克号》是哪年上映的？",
        options: ["1995年", "1996年", "1997年", "1998年"],
        correctIndex: 2,
        explanation: "《泰坦尼克号》由詹姆斯·卡梅隆执导，1997年12月上映。",
        points: 10,
      },
      {
        question: "以下哪部电影获得了最多的奥斯卡奖？",
        options: ["泰坦尼克号", "指环王：王者无敌", "宾虚", "全部三部都一样"],
        correctIndex: 3,
        explanation: "以上三部电影都赢得了11项奥斯卡奖，并列最高纪录。",
        points: 10,
      },
      {
        question: "哪位导演执导了《星球大战》原三部曲？",
        options: ["史蒂文·斯皮尔伯格", "乔治·卢卡斯", "克里斯托弗·诺兰", "詹姆斯·卡梅隆"],
        correctIndex: 1,
        explanation: "乔治·卢卡斯执导了1977年的《星球大战》，并创作了整个星战宇宙。",
        points: 10,
      },
      {
        question: "《狮子王》中辛巴的父亲叫什么名字？",
        options: ["穆法萨", "刀疤", "拉菲奇", "彭彭"],
        correctIndex: 0,
        explanation: "辛巴的父亲是荣耀岩的王穆法萨，他被弟弟刀疤谋杀。",
        points: 10,
      },
    ],
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    await Quiz.deleteMany({});
    console.log("Cleared existing quizzes");

    await Quiz.insertMany(quizData);
    console.log(`Seeded ${quizData.length} quizzes`);

    await mongoose.disconnect();
    console.log("Done! Disconnected from MongoDB");
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

seed();
