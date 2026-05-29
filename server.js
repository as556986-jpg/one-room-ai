import express from "express";
import OpenAI from "openai";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "one_room_internal_case_assessment_v1_gpt.html"));
});

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/api/oneroom", async (req, res) => {
  try {
    const { caseText } = req.body;

    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: `
你是 One Room 文慶大腦 V1。

請依照以下案件資料輸出：
1. 案件等級判斷
2. 內部保守概估區間
3. 最吃預算的項目
4. 是否需要人工複核
5. 是否建議承接
6. 員工回覆客人的 LINE 話術

案件資料：
${caseText}
`
    });

    res.json({ result: response.output_text });
  } catch (err) {
    res.status(500).json({
      error: err.message || "GPT 分析失敗"
    });
  }
});

if (!process.env.VERCEL) {
  app.listen(3000, () => {
    console.log("One Room AI server running on http://localhost:3000");
  });
}

export default app;
