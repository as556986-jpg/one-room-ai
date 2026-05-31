require("dotenv").config();

const express=require("express");
const path=require("path");
const fs=require("fs");

const app=express();
app.use(express.json({limit:"80mb"}));
app.use(express.static(path.join(__dirname,"public")));

function readJson(file, fallback){
  try{return JSON.parse(fs.readFileSync(path.join(__dirname,"data",file),"utf8"))}
  catch(e){return fallback}
}
const pricing=readJson("pricing_rules.json",{});
const riskRules=readJson("risk_rules.json",{});

function extractText(json){
 if(json.output_text)return json.output_text;
 try{return json.output.flatMap(o=>o.content||[]).map(c=>c.text||"").join("\n").trim()}
 catch(e){return JSON.stringify(json,null,2)}
}

function estimateText(d){
 return `系統參考：本案預算區間=${d.budgetBand||""}，空間=${d.spaceType||""}，坪數=${d.sizeBand||""}，電梯=${d.elevator||""}，屋況=${d.houseCondition||""}，搬運風險=${d.movingRisk||""}，清運量=${d.clearanceLevel||""}。`;
}

app.get("/legacy",(req,res)=>res.sendFile(path.join(__dirname,"one_room_internal_case_assessment_v1_gpt.html")));

app.post("/analyze-vision",async(req,res)=>{
 try{
   const d=req.body||{};
   const images=d.images||[];

   if(!images.length){
     return res.status(400).json({error:"請先上傳現場照片，文慶大腦才能評估。"});
   }

   if(!process.env.OPENAI_API_KEY){
     return res.status(400).json({error:"尚未設定 OPENAI_API_KEY。請先在 .env 或 Vercel Environment Variables 設定 API Key。"});
   }

   const systemPrompt=`你是 One Room 文慶大腦 V4.2。你必須根據表單與上傳照片做判斷，不可以套固定模板。

你是員工內部案件評估助手，不是客戶自助估價器。
你要看照片，指出照片中可見的空間問題，例如：採光、牆面、地板、天花、燈具、家具比例、動線、雜物量、是否疑似老屋或壁癌、是否適合客戶想要的風格。

文慶邏輯：
- 報區間，不報死價。
- 預算低時，不直接打擊，要引導優先順序、分階段、5800 設計圖。
- One Room 的核心是生活感、氣氛感、入住感。
- 最有感通常是燈光、窗簾、牆面配色、整潔感、床區氛圍、家具比例。
- 老屋、無電梯、大衣櫃、壁癌、重拉燈線、清運多、龜毛客、比價客、資訊不足，必須提醒人工複核。
- 對客話術要像文慶 LINE 回客人，少工程腔，多生活畫面。
- 不能說「我有看照片」卻沒有指出照片中實際看到的元素。`;

   const userText=`以下是員工案件資料，請你看照片後回覆。

${d.report||""}

${estimateText(d)}

請固定用這些段落：
A. 案件等級判斷
B. 概估區間
C. 照片看到的問題
D. 最影響預算的三項
E. 需人工複核風險
F. 員工下一步
G. 可直接貼給客人的 LINE 話術
H. 文慶內部備註

請依這個案件的照片與資料動態回答，不要每案回一樣。`;

   const content=[
     {type:"input_text",text:userText},
     ...images.slice(0,8).map(img=>({type:"input_image",image_url:img.dataUrl}))
   ];

   const response=await fetch("https://api.openai.com/v1/responses",{
     method:"POST",
     headers:{
       "Authorization":`Bearer ${process.env.OPENAI_API_KEY}`,
       "Content-Type":"application/json"
     },
     body:JSON.stringify({
       model:process.env.OPENAI_MODEL||"gpt-4.1-mini",
       input:[
         {role:"system",content:[{type:"input_text",text:systemPrompt}]},
         {role:"user",content}
       ]
     })
   });

   const json=await response.json();

   if(!response.ok){
     return res.status(response.status).json({error:json.error?.message||JSON.stringify(json,null,2)});
   }

   res.json({reply:extractText(json)});
 }catch(err){
   res.status(500).json({error:err.message});
 }
});

app.post("/analyze",(req,res)=>{
 res.status(400).json({error:"此版本不提供模板分析。請上傳照片並使用 /analyze-vision。"});
});

const PORT=process.env.PORT||3000;
app.listen(PORT,()=>console.log("One Room 文慶大腦 V4.2 強制 GPT Vision 版啟動：http://localhost:"+PORT));