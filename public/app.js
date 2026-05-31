let latestReport="";
function getChecked(name){return[...document.querySelectorAll(`input[name="${name}"]:checked`)].map(x=>x.value)}
function getFormDataObject(){const form=document.getElementById("caseForm");const data=Object.fromEntries(new FormData(form).entries());data.riskTags=getChecked("riskTags");data.needTags=getChecked("needTags");data.photoNames=[...document.getElementById("photos").files].map(f=>f.name);return data}
document.getElementById("photos").addEventListener("change",function(){const box=document.getElementById("photoPreview");box.innerHTML="";[...this.files].forEach(file=>{const url=URL.createObjectURL(file);const card=document.createElement("div");card.className="photo-card";card.innerHTML=`<img src="${url}" alt=""><small>${file.name}</small>`;box.appendChild(card)})});
function buildReport(){const d=getFormDataObject();latestReport=`【One Room VIP 內部案件報表 V1】

一、案件基本資料
案件名稱：${d.caseName||""}
來源管道：${d.leadSource||""}
地區：${d.area||""}
坪數：${d.size||""}
樓層／電梯：${d.floor||""}／${d.elevator||""}
客戶預算：${d.budget||""}
急迫程度：${d.urgency||""}

二、空間與屋況
空間類型：${d.spaceType||""}
屋況：${d.houseCondition||""}
現場限制／風險：${d.siteRisk||""}
風險標籤：${(d.riskTags||[]).join("、")||"無"}

三、客戶需求
客戶原話：${d.clientWords||""}
想做風格：${d.style||""}
需求項目：${(d.needTags||[]).join("、")||"未勾選"}
員工直覺：${d.staffNote||""}

四、照片清單
${(d.photoNames||[]).map((n,i)=>`${i+1}. ${n}`).join("\n")||"尚未上傳照片"}

五、請文慶大腦依 One Room 邏輯輸出
1. 案件等級：輕改／完改／作品級／高風險
2. 是否值得接
3. 預算是否合理
4. 保守報價區間
5. 最有感項目
6. 最容易爆預算項目
7. 可刪減項目
8. 是否推 5800 設計圖
9. 是否建議分期
10. 員工下一步怎麼問
11. 可直接貼給客人的 LINE 話術
12. 文慶內部備註

文慶核心節奏：
先認同 → 講現實 → 幫客人刪預算 → 給生活畫面 → 帶設計圖。
`;document.getElementById("reportOutput").textContent=latestReport;return latestReport}
async function copyReport(){const text=latestReport||buildReport();await navigator.clipboard.writeText(text);alert("已複製案件報告")}
function downloadReport(){const text=latestReport||buildReport();const blob=new Blob([text],{type:"text/plain;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`one-room-case-report-${Date.now()}.txt`;a.click();URL.revokeObjectURL(url)}
async function sendToBrain(){const d=getFormDataObject();const report=latestReport||buildReport();document.getElementById("aiOutput").textContent="文慶大腦分析中...";try{const res=await fetch("/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...d,report})});const json=await res.json();document.getElementById("aiOutput").textContent=json.reply||json.result||JSON.stringify(json,null,2)}catch(err){document.getElementById("aiOutput").textContent="錯誤："+err.message}}