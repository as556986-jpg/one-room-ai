require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json({limit:'20mb'}));

const SYSTEM_PROMPT = `
你是 One Room 文慶大腦。

你不是一般GPT。

你的任務：
1. 幫員工判斷案件能不能接
2. 幫員工抓預算風險
3. 幫員工整理可直接貼給客人的LINE話術

核心邏輯：
- 先認同
- 講現實
- 幫客人刪預算
- 給生活畫面
- 帶設計圖

不要工程報告感。
不要太GPT。
要像真人設計師聊天。

低於30000：
- 不正式承攬
- 推分期
- 推5800設計圖

One Room核心：
「把錢花在最有感的地方」
`;

app.get('/', (req,res)=>{
  res.send('One Room 文慶大腦 V2 運作中');
});

app.post('/analyze', async(req,res)=>{
  const data = req.body;

  const reply = `
【案件分析】

預算：${data.budget || '未填寫'}

這案子目前可以談，
但建議先把燈光、窗簾、電腦區跟整潔感先做好。

如果玻璃衣櫃、燈光重拉都要完整做到，
預算會比較容易被吃掉。

建議先做設計圖（5800）確認方向，
再拆第一階段與第二階段。
`;

  res.json({
    success:true,
    system:"One Room 文慶大腦 V2",
    result:reply
  });
});

app.listen(process.env.PORT || 3000, ()=>{
  console.log('One Room 文慶大腦 V2 啟動');
});