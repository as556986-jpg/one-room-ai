require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.static(path.join(__dirname, "public")));

function localBrainReply(data) {
  const budgetNumber = Number(String(data.budget || "").replace(/[^\d]/g, "")) || 0;
  const lowBudget = budgetNumber > 0 && budgetNumber < 30000;

  if (lowBudget) {
    return `老闆您好，我有先看一下資料 🙏

目前這個預算如果要由我們正式承攬完整改造，會比較難做到您想要的效果。

我會比較建議兩個方向：

第一個是可以用分期把預算拉高一點，這樣我們才有辦法幫您把房間整體處理到比較有感。

第二個是先做設計圖，目前優惠價 5800，讓設計師依照您的房型、預算跟想要的感覺，先把家具位置、燈光方向、配色跟軟裝規劃出來。

這樣您後面可以選擇自己 DIY，或是之後預算提高再讓我們協助施工，會比較不會亂花錢。`;
  }

  return `我有先看一下這個案件，這間其實可以談，空間條件不算差。

客人想要的是「${data.style || "有質感"}」的方向，重點不是一直加東西，而是要把錢花在最有感的地方。

我會優先看：
・燈光氣氛
・窗簾跟牆面配色
・床區與生活動線
・收納整潔感
・有沒有需要保留或汰換的大型家具

預算目前抓在 ${data.budget || "未填"}，如果沒有太多拆除、水電重拉或大型木作，應該可以先抓第一階段來做。

但如果有玻璃衣櫃、壁癌、重拉燈線、天花、無電梯搬運，這些就要保守一點，不能一開始答應全部做到滿。

【給客人的 LINE 話術】

老闆您好，我有先看一下照片，這間其實條件不差，整理起來是有機會做出您要的感覺。

我會比較建議不要一開始塞太多東西，因為您要的是乾淨、有質感、住起來舒服的感覺。

這種空間最有感的通常會是燈光、窗簾、牆面配色、收納整理跟家具比例。晚上燈光壓下來，整體氣氛會差很多，也會比較有那種想待在房間裡的感覺。

目前我們可以先依照您的預算幫您抓第一階段，把最有感的地方先處理好。比較吃預算、但不是第一時間必要的項目，可以先放第二階段，這樣比較不會做到一半預算爆掉。

如果您希望方向更準，我會建議可以先做設計圖，先把家具位置、燈光方向、配色跟軟裝抓出來，後續再決定哪些先做、哪些之後做，這樣最安全也比較不會亂花錢。`;
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/analyze", async (req, res) => {
  try {
    const data = req.body || {};
    const result = localBrainReply(data);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`One Room 文慶大腦 V2.1 啟動：http://localhost:${port}`);
});
