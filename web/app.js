// ------------ i18n dictionary ------------
const I18N = {
  en:{upload_prompt:"Drop a leaf image here or click to upload",detect_btn:"Detect Crop Regions",disease_btn:"Check Disease",image_loaded:"Image loaded. Click a button to run.",crop_regions_detected:"Crop regions detected",image_size:"Image size",first_box:"First box",disease:"Disease",confidence:"Confidence",top_matches:"Top matches",what_it_means:"What it means",precautions:"Precautions",cultural_controls:"Cultural Controls",organic_options:"Organic/Low-residue Options",chemical_options:"Chemical Options (Actives)",note_label:"Note",diseases_local:{"Healthy":"Healthy","Leaf Rust":"Leaf Rust","Leaf Blight":"Leaf Blight","Powdery Mildew":"Powdery Mildew"}},
  hi:{upload_prompt:"यहाँ पत्ती की तस्वीर छोड़ें या अपलोड करने के लिए क्लिक करें",detect_btn:"फसल क्षेत्र पहचानें",disease_btn:"रोग जाँचें",image_loaded:"तस्वीर लोड हो गई। आगे बढ़ने के लिए बटन दबाएँ।",crop_regions_detected:"पहचाने गए फसल क्षेत्र",image_size:"छवि आकार",first_box:"पहला बॉक्स",disease:"रोग",confidence:"विश्वास",top_matches:"शीर्ष मिलान",what_it_means:"इसका मतलब",precautions:"सावधानियाँ",cultural_controls:"सांस्कृतिक नियंत्रण",organic_options:"ऑर्गेनिक/कम-अवशेष विकल्प",chemical_options:"रासायनिक विकल्प (सक्रिय द्रव्य)",note_label:"टिप्पणी",diseases_local:{"Healthy":"स्वस्थ","Leaf Rust":"लीफ रस्ट","Leaf Blight":"पत्ती झुलसा","Powdery Mildew":"पाउडरी फफूंदी"}},
  te:{upload_prompt:"ఆకు చిత్రాన్ని ఇక్కడ వదలండి లేదా అప్‌లోడ్ కోసం క్లిక్ చేయండి",detect_btn:"పంట ప్రాంతాలు గుర్తించు",disease_btn:"వ్యాధి పరిశీలించు",image_loaded:"చిత్రం లోడ్ అయ్యింది. బటన్ నొక్కండి.",crop_regions_detected:"గుర్తించిన పంట ప్రాంతాలు",image_size:"చిత్ర పరిమాణం",first_box:"మొదటి బాక్స్",disease:"వ్యాధి",confidence:"నమ్మకం",top_matches:"టాప్ మ్యాచ్‌లు",what_it_means:"దీనర్థం",precautions:"జాగ్రత్తలు",cultural_controls:"సాంస్కృతిక నియంత్రణలు",organic_options:"సేంద్రీయ/తక్కువ అవశేష ఎంపికలు",chemical_options:"రసాయనిక ఎంపికలు (సక్రియ పదార్థాలు)",note_label:"గమనిక",diseases_local:{"Healthy":"ఆరోగ్యంగా","Leaf Rust":"ఆకు తుప్పు","Leaf Blight":"ఆకు ఎండు/బ్లైట్","Powdery Mildew":"పౌడరీ మిల్డ్యూ"}}
};
function t(k){return (I18N[window.currentLang]&&I18N[window.currentLang][k])||I18N.en[k]||k;}
function diseaseName(k){const d=I18N[window.currentLang]?.diseases_local||{};return d[k]||k;}

// ------------ state / refs ------------
const fileInput=document.getElementById('file');
const drop=document.getElementById('drop');
const fileLabel=document.getElementById('fileLabel');
const btnDetect=document.getElementById('btnDetect');
const btnDisease=document.getElementById('btnDisease');
const langSel=document.getElementById('lang');
const canvas=document.getElementById('canvas');
const ctx=canvas.getContext('2d');
const output=document.getElementById('output');
const loginLink=document.getElementById('loginLink');
const userInfo=document.getElementById('userInfo');
const userEmailSpan=document.getElementById('userEmail');
const logoutBtn=document.getElementById('logoutBtn');

let imageBlob=null,imageBitmap=null;
window.currentLang=localStorage.getItem('lang')||'en';
if(langSel) langSel.value=window.currentLang;

// ------------ i18n apply ------------
function applyI18n(){
  if(fileLabel) fileLabel.textContent=t('upload_prompt');
  if(btnDetect) btnDetect.textContent=t('detect_btn');
  if(btnDisease) btnDisease.textContent=t('disease_btn');
}
applyI18n();
if(langSel) langSel.addEventListener('change',()=>{window.currentLang=langSel.value;localStorage.setItem('lang',window.currentLang);applyI18n();});

// ------------ auth helpers ------------
function getToken(){return localStorage.getItem('token')||"";}
async function refreshAuthUI(){
  const tok=getToken();
  if(!loginLink || !userInfo) return;
  if(!tok){
    loginLink.style.display="";
    userInfo.style.display="none";
    return;
  }
  try{
    const res=await fetch('/api/auth/me',{headers:{Authorization:'Bearer '+tok}});
    if(!res.ok) throw new Error();
    const me=await res.json();
    userEmailSpan.textContent=me.email;
    loginLink.style.display="none";
    userInfo.style.display="";
  }catch{
    // invalid token
    localStorage.removeItem('token');
    loginLink.style.display="";
    userInfo.style.display="none";
  }
}
if(logoutBtn){logoutBtn.addEventListener('click',()=>{localStorage.removeItem('token');refreshAuthUI();});}
refreshAuthUI();

// ------------ drag & drop ------------
drop?.addEventListener('click',()=>fileInput.click());
drop?.addEventListener('dragover',(e)=>{e.preventDefault();drop.classList.add('hover');});
drop?.addEventListener('dragleave',()=>drop.classList.remove('hover'));
drop?.addEventListener('drop',async(e)=>{e.preventDefault();drop.classList.remove('hover');const f=e.dataTransfer.files[0];if(f)await loadImage(f);});
fileInput?.addEventListener('change',async(e)=>{const f=e.target.files[0];if(f)await loadImage(f);});

async function loadImage(file){
  imageBlob=file;
  const bm=await createImageBitmap(file);
  imageBitmap=bm;
  canvas.width=bm.width;canvas.height=bm.height;
  ctx.drawImage(bm,0,0);
  setOutputHtml(`<i>${t('image_loaded')}</i>`);
  fileLabel.textContent=file.name;
}

async function postImage(url){
  if(!imageBlob){ setOutputHtml('<i>'+t('image_loaded')+'</i>'); return null; }
  const fd=new FormData(); fd.append('file',imageBlob,'image.png');
  const headers={}; const tok=getToken(); if(tok) headers['Authorization']='Bearer '+tok;
  const res=await fetch(url+`?lang=${encodeURIComponent(window.currentLang)}`,{method:'POST',body:fd,headers});
  if(!res.ok){ setOutputHtml('Request failed: '+res.status); return null; }
  return await res.json();
}
function setOutputHtml(html){ output.innerHTML=html; }
function drawTag(text){
  ctx.save(); ctx.font='16px Segoe UI, Roboto, Arial';
  const padX=10, w=ctx.measureText(text).width+padX*2, h=26;
  ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(8,8,w,h);
  ctx.fillStyle='#fff'; ctx.fillText(text,8+padX,8+18);
  ctx.restore();
}

// ------------ buttons ------------
btnDetect?.addEventListener('click',async()=>{
  const json=await postImage('/api/detect-crops'); if(!json) return;
  ctx.drawImage(imageBitmap,0,0); ctx.lineWidth=3; ctx.strokeStyle='#00c853';
  json.boxes.forEach(b=>{const [x1,y1,x2,y2]=b; ctx.strokeRect(x1,y1,x2-x1,y2-y1);});
  const n=json.boxes.length;
  setOutputHtml(n>0?
    `<b>${t('crop_regions_detected')}:</b> ${n}
     <div class="kv">
       <span class="label">${t('image_size')}</span><span>${json.image_size[0]} × ${json.image_size[1]} px</span>
       <span class="label">${t('first_box')}</span><span>[${json.boxes[0].join(', ')}]</span>
     </div>` :
    `<b>${t('crop_regions_detected')}:</b> 0`
  );
});

btnDisease?.addEventListener('click',async()=>{
  const json=await postImage('/api/detect-disease'); if(!json) return;
  ctx.drawImage(imageBitmap,0,0);
  const pct=(json.confidence*100).toFixed(1);
  const localDiseaseName=diseaseName(json.label);
  drawTag(`${localDiseaseName} • ${pct}%`);
  const top3=Object.entries(json.scores).sort((a,b)=>b[1]-a[1]).slice(0,3);
  const top3Html=top3.map(([k,v],i)=>`${i+1}. ${diseaseName(k)} — ${(v*100).toFixed(1)}%`).join('<br>');
  const adv=json.advice||{}; const list=(arr)=>Array.isArray(arr)?`<ul>${arr.map(x=>`<li>${x}</li>`).join('')}</ul>`:'<ul><li>—</li></ul>';
  setOutputHtml(`
    <div class="disease-head"><b>${t('disease')}:</b> ${localDiseaseName} <span class="sep"></span><b>${t('confidence')}:</b> ${pct}%</div>
    <div class="kv" style="margin-top:6px"><span class="label">${t('top_matches')}</span><span>${top3Html}</span></div>
    <div class="advice">
      ${adv.summary?`<h4>${t('what_it_means')}</h4><p>${adv.summary}</p>`:''}
      <h4>${t('precautions')}</h4>${list(adv.precautions)}
      <h4>${t('cultural_controls')}</h4>${list(adv.cultural_controls)}
      <h4>${t('organic_options')}</h4>${list(adv.organic_options)}
      <h4>${t('chemical_options')}</h4>${list(adv.chemical_options)}
      ${adv.note?`<div class="note">${adv.note}</div>`:''}
    </div>`);
});
