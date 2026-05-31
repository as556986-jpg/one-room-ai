let latestReport="";
let latestImages=[];

function getChecked(name){return[...document.querySelectorAll(`input[name="${name}"]:checked`)].map(x=>x.value)}
function getFormDataObject(){
  const form=document.getElementById("caseForm");
  const data=Object.fromEntries(new FormData(form).entries());
  data.modules=getChecked("modules");
  data.customerRisk=getChecked("customerRisk");
  data.photoNames=[...document.getElementById("photos").files].map(f=>f.name);
  return data;
}
function fileToDataURL(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file)})}

document.getElementById("photos").addEventListener("change",async function(){
  const box=document.getElementById("photoPreview");
  const status=document.getElementById("photoStatus");
  box.innerHTML="";
  latestImages=[];
  const files=[...this.files];
  if(files.length===0){status.textContent="尚未上傳照片。";return}
  status.textContent=`已上傳 ${files.length} 張照片。`;
  for(const file of files){
    const url=URL.createObjectURL(file);
    const dataUrl=await fileToDataURL(file);
    latestImages.push({name:file.name,type:file.type,size:file.size,dataUrl});
    const card=document.createElement("div");
    card.className="photo-card";
    card.innerHTML=`<img src="${url}" alt=""><small>${file.name}</small>`;
    box.appendChild(card);
  }
});

function buildReport(){
 const d=getFormDataObject();
 latestReport=`【One Room V5 內部案件報表｜決策樹強化版】

一、案件基本資料
案件編號：${d.caseId||""}
填表員工：${d.staffName||""}
客戶暱稱：${d.customerAlias||""}
來源管道：${d.leadSource||""}
地區：${d.region||""} ${d.district||""}
樓層／電梯：${d.floorNumber||""}樓／${d.elevator||""}
確切預算：${d.budgetExact||"未填"}
預算區間：${d.budgetBand||""}
急迫程度：${d.urgency||""}

二、空間資料
空間類型：${d.spaceType||""}
坪數區間：${d.sizeBand||""}
屋況：${d.houseCondition||""}
大樓限制：${d.buildingRules||""}

三、客戶需求
客戶原話：${d.clientWords||""}
風格偏好：${d.stylePreference||""}
需求模組：${(d.modules||[]).join("、")||"未勾選"}
優先順序：${d.priorityNote||""}

四、員工判斷
牆面狀況：${d.wallCondition||""}
地板判斷：${d.floorCondition||""}
燈光判斷：${d.lightCondition||""}
家具可保留：${d.keepFurniture||""}
清運量：${d.clearanceLevel||""}
搬運風險：${d.movingRisk||""}
客戶風險：${(d.customerRisk||[]).join("、")||"無"}
內部備註：${d.internalNote||""}

五、照片清單
${(d.photoNames||[]).map((n,i)=>`${i+1}. ${n}`).join("\n")||"尚未上傳照片"}

請 GPT Vision 看照片後，先做預算閘門與接案策略判斷，再回覆：
A. 案件等級判斷
B. 內部保守概估區間
C. 照片看到的問題
D. 最吃預算的三項
E. 需人工複核的地方
F. 建議承接策略：可接 / 可談但需複核 / 轉設計圖 / 推分期 / 僅快速估價
G. 員工回客 LINE 版本
H. 內部提醒
I. 下一步
`;
 document.getElementById("reportOutput").textContent=latestReport;
 return latestReport;
}

async function copyReport(){const text=latestReport||buildReport();await navigator.clipboard.writeText(text);alert("已複製案件報告")}
function downloadReport(){const text=latestReport||buildReport();const blob=new Blob([text],{type:"text/plain;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`one-room-v5-report-${Date.now()}.txt`;a.click();URL.revokeObjectURL(url)}

async function sendToBrain(){
 const d=getFormDataObject();
 const report=latestReport||buildReport();
 const output=document.getElementById("aiOutput");

 if(latestImages.length===0){
   output.textContent="請先上傳現場照片，文慶大腦才能評估。至少建議上傳：房間全景、天花/燈具、地板/牆面。";
   return;
 }

 output.textContent="正在送出 GPT Vision 分析中，請稍候...";
 try{
   const res=await fetch("/analyze-vision",{
     method:"POST",
     headers:{"Content-Type":"application/json"},
     body:JSON.stringify({...d,report,images:latestImages})
   });
   const json=await res.json();
   if(!res.ok || json.error){
     output.textContent="GPT 分析失敗：\n" + (json.error || JSON.stringify(json,null,2));
     return;
   }
   output.textContent=json.reply||JSON.stringify(json,null,2);
 }catch(err){
   output.textContent="連線錯誤：" + err.message;
 }
}