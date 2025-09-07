/* global fetch */
// === إعداد عنوان الويب لتطبيق Google Apps Script ===
// بعد النشر كـ Web App انسخ الرابط وضعه هنا:
const GAS_URL = localStorage.getItem('https://script.google.com/macros/s/AKfycbyUfVDIqxhHO3bwo2FZXxj25JPjZZWitYXeUS93uFAL1Q80OXeo9UhZjVlONpTeOkI/exec') || 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

// خيار سريع لتغيير الرابط من الواجهة (للاختبار دون إعادة بناء)
window.setGASUrl = function (url){
  if(!url) return;
  localStorage.setItem('GAS_URL', url);
  alert('تم حفظ رابط Apps Script مؤقتًا في المتصفح.');
};

// عناصر الواجهة
const tabs = document.querySelectorAll('.tab-btn');
const sections = document.querySelectorAll('.tab-section');

tabs.forEach(btn=>{
  btn.addEventListener('click',()=>{
    sections.forEach(s=>s.classList.remove('active'));
    document.getElementById(btn.dataset.target).classList.add('active');
  });
});

// أدوات عامة
const jsonHeaders = { 'Content-Type':'application/json;charset=utf-8' };

async function apiGet(params){
  const url = new URL(GAS_URL);
  Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { method:'GET' });
  if(!res.ok) throw new Error('GET failed: '+res.status);
  return res.json();
}

async function apiPost(action, payload){
  const res = await fetch(GAS_URL, {
    method:'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ action, ...payload })
  });
  if(!res.ok) throw new Error('POST failed: '+res.status);
  return res.json();
}

// --- التحقق من رمز البطاقة ---
const formCheck = document.getElementById('form-check');
const checkResult = document.getElementById('check-result');

formCheck.addEventListener('submit', async (e)=>{
  e.preventDefault();
  checkResult.textContent = 'جاري التحقق...';
  try {
    const code = document.getElementById('check-code').value.trim();
    const data = await apiGet({ action:'checkCard', code });
    if(!data.found){
      checkResult.innerHTML = '<span class="warn">لم يتم العثور على البطاقة.</span>';
      return;
    }
    const badge = data.active ? '<span class="ok">مفعّلة</span>' : '<span class="warn">غير مفعّلة</span>';
    checkResult.innerHTML = `
      <div>
        <div>الحالة: ${badge}</div>
        ${data.row.holderName ? `<div>الاسم: <b>${data.row.holderName}</b></div>` : ''}
        ${data.row.country ? `<div>الدولة: ${data.row.country}</div>` : ''}
        ${data.row.notes ? `<div>ملاحظات: ${data.row.notes}</div>` : ''}
      </div>
    `;
  } catch(err){
    console.error(err);
    checkResult.innerHTML = '<span class="err">تعذّر الاتصال بالخادم.</span>';
  }
});

// --- التسويق بالعمولة ---
const formAff = document.getElementById('form-affiliate');
const affResult = document.getElementById('aff-result');

formAff.addEventListener('submit', async (e)=>{
  e.preventDefault();
  affResult.textContent = 'جاري الحفظ...';
  try {
    const name = document.getElementById('aff-name').value.trim();
    const email = document.getElementById('aff-email').value.trim();
    const whatsapp = document.getElementById('aff-whatsapp').value.trim();
    const country = document.getElementById('aff-country').value.trim();
    const data = await apiPost('newAffiliate',{ name, email, whatsapp, country });
    if(data.ok){
      affResult.innerHTML = `
        <div class="ok">تم التسجيل بنجاح.</div>
        <div>رمز المُسوق الخاص بك: <b>${data.affiliateId}</b></div>
      `;
      formAff.reset();
    }else{
      affResult.innerHTML = `<span class="err">خطأ: ${data.error||'تعذّر الحفظ'}</span>`;
    }
  } catch(err){
    console.error(err);
    affResult.innerHTML = '<span class="err">تعذّر الاتصال بالخادم.</span>';
  }
});

// --- إضافة للسوق + عرض القائمة ---
const formMarket = document.getElementById('form-market');
const marketList = document.getElementById('market-list');
const btnRefresh = document.getElementById('btn-refresh-market');

formMarket.addEventListener('submit', async (e)=>{
  e.preventDefault();
  try {
    const code = document.getElementById('mkt-code').value.trim();
    const country = document.getElementById('mkt-country').value.trim();
    const contact = document.getElementById('mkt-contact').value.trim();
    const data = await apiPost('addToMarket',{ code, country, contact });
    if(data.ok){
      alert('تمت إضافة البطاقة إلى السوق.');
      formMarket.reset();
      await loadMarket();
    }else{
      alert('خطأ: '+(data.error||'تعذّر الإضافة'));
    }
  } catch(err){
    console.error(err);
    alert('تعذّر الاتصال بالخادم.');
  }
});

btnRefresh.addEventListener('click', loadMarket);

async function loadMarket(){
  marketList.innerHTML = '<div class="card">جاري التحميل...</div>';
  try{
    const data = await apiGet({ action:'listMarket' });
    if(!data.rows || data.rows.length===0){
      marketList.innerHTML = '<div class="card warn">لا توجد بطاقات حالياً.</div>';
      return;
    }
    marketList.innerHTML = data.rows.map(r => (`
      <div class="market-card">
        <h4>رمز: ${r.code}</h4>
        <small>الدولة: ${r.country||'-'}</small><br/>
        <small>تواصل: ${r.contact||'-'}</small><br/>
        <small>أضيفت بتاريخ: ${r.timestamp||'-'}</small>
      </div>
    `)).join('');
  }catch(err){
    console.error(err);
    marketList.innerHTML = '<div class="card err">تعذّر تحميل القائمة.</div>';
  }
}

// حمّل السوق مبدئياً
loadMarket();
