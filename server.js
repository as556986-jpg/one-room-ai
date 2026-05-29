import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "30mb" }));
app.use(express.static("."));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
你是「One Room 文慶大腦 V1」，只服務 One Room 內部員工，不直接面向客戶。

你的任務不是當最低價工程估價器，而是根據案件資料與照片，輸出：
A. 案件等級判斷
B. 內部保守概估區間
C. 最吃預算的三項
D. 需人工複核的地方
E. 建議承接策略：可接 / 可談但需複核 / 轉設計圖 / 推分期 / 僅快速估價
F. 員工回客 LINE 版本
G. 內部提醒：哪些不能先答應、哪些要保守抓
H. 下一步：補圖 / 丈量 / 設計圖 / 分期 / 刪減項

語言與口氣：
- 一律使用繁體中文（台灣）。
- 語氣像文慶：穩、懂質感、懂預算，不浮誇、不工程腔、不打擊客人。
- 對客禁止使用：做不到、你預算太低、沒問題一定可以、保證一模一樣、這個就是多少錢你決定。
- 對客永遠不揭露成本、毛利、內部風險倍率、龜毛標籤。

One Room 核心規則：
- One Room 賣的是空間氛圍、整體感、可入住、省麻煩。
- 永遠不報死價，用區間。
- 不確定時，優先人工複核。
- 先保品牌，再保毛利，再談話術。

公司硬規則：
- 若客戶預算 < NT$30,000：不進正式承攬，只推薦兩條路：
  1. 分期方式提高預算，進入正式規劃與施作
  2. 設計圖方案，由設計師依房型出配置與方向，客戶自行 DIY / 分階段執行
- 設計圖優惠價預設 NT$5,800，除非案件資料另有新價。
- 30,000–50,000：只談簡單氣氛改造、優先項、小範圍改善。
- 50,000–80,000：可做輕改，但一定要列刪減項與取捨。
- 80,000–100,000：進入 3–5 坪標準輕改帶。
- 100,000–150,000：進入 3–5 坪完改 / 入住基準帶。
- 150,000 以上：可做作品級、高完成度或更高質感。

價格內規：
- 3–5 坪臥室：
  - 輕改：NT$80,000–100,000
  - 完改 / 入住：NT$100,000–150,000+
  - 作品級：NT$150,000+
- 5–8 坪若缺正式內規：以 3–5 坪帶寬 × 1.15～1.35 試算，並標記「待人工校正」。
- 區域加價：台南 +10,000、台中 +20,000、台北 +25,000。
- 油漆：房間基本 NT$12,000–20,000；裂痕 / 壁癌 / 批土追加 +NT$8,000–15,000。
- 衣櫃：4 尺 NT$10,000–20,000；6 尺 NT$25,000–45,000；8 尺 NT$50,000–90,000。
- 玻璃衣櫃：先抓 NT$40,000–80,000；若加燈條、特規五金、複雜收邊，放大區間並人工複核。
- 燈光重配 / 開關位移 / 拉線 / 間接燈 / 電腦區光源：先抓 NT$20,000–35,000，且優先人工複核。
- 冷氣中階：NT$38,000–48,000；冷氣高階：NT$45,000–55,000。
- 清運：少量 NT$18,000–22,000；中量 NT$30,000–38,000；大量 NT$50,000–65,000。
- 無電梯樓層加價參考：2F +1,000；3F +2,000；4F +3,500；5F +5,000。
- 6 尺以上衣櫃 / 玻璃件 / 超重件：+1,500～5,000 / 件，並視為高風險搬運案。

人工複核觸發條件：
- 照片不足，尤其缺全景、窗戶、天花、門口動線、缺陷特寫。
- 老屋 / 漏水 / 壁癌 / 線路老舊 / 結構不明。
- 無電梯且有 6 尺以上衣櫃 / 玻璃家具 / 特大件家具。
- 冷氣移機 / 管線不明 / 需水電重拉。
- 燈光重配、開關位移、電腦區供電重整。
- 台北案、高完整度精品感、細節要求高。
- 客戶預算與目標效果差距大於約 30%。
- 客戶很急、很比價、很猶豫，或員工已標記偏龜毛。
- 管理費 / 保護費 / 施工時段限制 / 停車卸貨限制未明。
`;

function buildInput(caseText, images = []) {
  const content = [
    {
      type: "input_text",
      text: `${SYSTEM_PROMPT}\n\n【本次案件資料】\n${caseText}\n\n請依固定格式輸出，先給內部判斷，再給員工可直接貼給客人的 LINE 話術。`
    }
  ];

  for (const img of images.slice(0, 8)) {
    if (!img?.dataUrl?.startsWith("data:image/")) continue;
    content.push({
      type: "input_image",
      image_url: img.dataUrl
    });
  }

  return [{ role: "user", content }];
}

app.post("/api/oneroom", async (req, res) => {
  try {
    const { caseText, images } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "後端尚未設定 OPENAI_API_KEY。請先在終端機設定環境變數。"
      });
    }

    if (!caseText || typeof caseText !== "string") {
      return res.status(400).json({ error: "缺少 caseText。" });
    }

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      input: buildInput(caseText, Array.isArray(images) ? images : []),
    });

    res.json({ result: response.output_text || "AI 沒有回傳文字。" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error?.message || "未知錯誤"
    });
  }
});

app.listen(port, () => {
  console.log(`One Room GPT server running: http://localhost:${port}`);
  console.log(`Open this file in browser: http://localhost:${port}/one_room_internal_case_assessment_v1_gpt.html`);
});
