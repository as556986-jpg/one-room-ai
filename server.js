const express=require("express");const path=require("path");const app=express();app.use(express.json({limit:"30mb"}));app.use(express.static(path.join(__dirname,"public")));
function numberFromBudget(raw=""){const n=String(raw).replace(/[^\d]/g,"");return n?Number(n):0}
app.get("/legacy",(req,res)=>res.sendFile(path.join(__dirname,"one_room_internal_case_assessment_v1_gpt.html")));
app.post("/analyze",(req,res)=>{const d=req.body||{};const budget=numberFromBudget(d.budget);const riskTags=d.riskTags||[];const needTags=d.needTags||[];const highRisk=riskTags.some(x=>["無電梯","壁癌","老屋","重拉燈線","玻璃衣櫃","大型家具搬運"].includes(x));const lowBudget=budget&&budget<30000;const designPush=lowBudget||highRisk||String(d.clientWords||"").includes("高級")||String(d.style||"").includes("精品");let level="輕改～完改";if(budget>=200000)level="完改／作品級潛力";if(highRisk)level="可接但需人工複核";if(lowBudget)level="低預算分流案";
const reply=lowBudget?`【One Room 文慶大腦 VIP 分析】

案件等級：低預算分流案
是否值得接：不建議正式承攬完整改造
預算判斷：目前預算低於 3 萬，若客戶期待完整效果，不能硬接。

【員工處理】
1. 不要直接說做不到。
2. 推分期提高預算。
3. 推 5800 設計圖，讓客人先拿到方向。
4. 可以建議客人依設計圖 DIY 或分階段做。

【可直接貼給客人的 LINE 話術】

老闆您好，我有先看一下您的需求，方向是可以整理的。

不過我先跟您說實話，以目前這個預算，如果要由我們完整承攬，會比較難做到您想要的效果。

我會比較建議兩個方向：

第一個是可以用分期把預算拉高一點，這樣我們才有辦法幫您把房間整體處理到比較有感。

第二個是先做設計圖，目前優惠價 5800，讓設計師依照您的房型、預算跟想要的感覺，先把家具位置、燈光方向、配色跟軟裝規劃出來。

這樣您後面可以選擇自己 DIY，或是之後預算提高再讓我們協助施工，會比較不會亂花錢。`:`【One Room 文慶大腦 VIP 分析】

案件等級：${level}
是否值得接：${highRisk?"可接，但要文慶複核，不要先報死價":"可接，可以先往設計圖或第一階段引導"}
預算判斷：${d.budget||"未填"}，目前先以保守區間處理，不要一次承諾全部做到滿。

【最有感項目】
${needTags.includes("燈光")?"・燈光：這案最有機會直接拉出高級感。\n":""}・窗簾／牆面配色：能快速讓空間乾淨、有氣氛。
・床區／主要視覺牆：帶人回家時最有感。
・收納整潔感：客人如果怕亂，這是核心。

【最容易爆預算】
${riskTags.includes("無電梯")?"・無電梯：搬運與大型家具成本要保守。\n":""}${riskTags.includes("玻璃衣櫃")?"・玻璃衣櫃：不能亂低估，做不好容易廉價。\n":""}${riskTags.includes("壁癌")?"・壁癌：不能只做表面漂亮，要先確認狀況。\n":""}${riskTags.includes("重拉燈線")?"・重拉燈線：牽涉工錢與現場條件，要保守。\n":""}・大型家具與清運：若照片顯示東西多，要另外抓。

【建議策略】
1. 不要一開始塞太多東西。
2. 先把錢放在最有感的地方：燈光、窗簾、配色、整潔感。
3. 高風險項目先拆第二階段。
4. ${designPush?"建議推 5800 設計圖，先把配置與方向定下來。":"可以先用第一階段方案切入。"}

【員工下一步】
・補問：是否保留現有家具？
・補問：照片是否有全景、天花、地板、樓梯？
・補問：預算是否可小幅上修？
・不要先承諾玻璃衣櫃、重拉線、壁癌處理都包在內。

【可直接貼給客人的 LINE 話術】

老闆您好，我有先看一下照片跟需求，這個空間其實條件不差，是有機會做出您要的感覺。

我會比較建議不要一開始塞太多東西，因為您要的是乾淨、有質感、住起來舒服的感覺。

這種空間最有感的通常會是燈光、窗簾、牆面配色、收納整理跟家具比例。晚上燈光壓下來，整體氣氛會差很多，也會比較有那種想待在房間裡的感覺。

目前我們可以先依照您的預算幫您抓第一階段，把最有感的地方先處理好。比較吃預算、但不是第一時間必要的項目，可以先放第二階段，這樣比較不會做到一半預算爆掉。

如果您希望方向更準，我會建議可以先做設計圖，先把家具位置、燈光方向、配色跟軟裝抓出來，後續再決定哪些先做、哪些之後做，這樣最安全也比較不會亂花錢。`;res.json({reply})});
const PORT=process.env.PORT||3000;app.listen(PORT,()=>console.log("One Room VIP 完整最終版啟動：http://localhost:"+PORT));