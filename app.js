/* global fetch */
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwU-13v59BGFVMabeTuGLQIaZZh6Jnax-fNkauA7FURR8e3WMnunkSMZnE3cVdvd_ZL/exec';

const I18N = {
  ar: {
    title: "متجر البطاقات - PWA",
    appName: "متجر البطاقات",
    tab: { check:"التحقق من رمز البطاقة", aff:"التسويق بالعمولة", market:"البطاقات المعروضة للبيع", guide:"إرشادات" },
    check: { title:"التحقق من رمز البطاقة", codeLabel:"رمز البطاقة", codePh:"مثال: ABC123", btn:"تحقق", ping:"تشخيص الاتصال (Ping)",
             notFound:"لم يتم العثور على البطاقة.", active:"مفعّلة", inactive:"غير مفعّلة", checking:"جاري التحقق..." },
    aff: { title:"التسويق بالعمولة - تسجيل جديد", name:"الاسم", email:"البريد الإلكتروني", whatsapp:"واتساب", country:"الدولة", btn:"تسجيل",
           saving:"جاري الحفظ...", ok:"تم التسجيل بنجاح.", yourId:"رمز المُسوق الخاص بك:" },
    market: {
      addTitle:"إضافة بطاقة للبيع", code:"رمز البطاقة (غير مفعّل)", country:"الدولة", contact:"وسيلة التواصل",
      price:"السعر", addBtn:"إضافة",
      filterTitle:"تصفية البطاقات", fCountry:"الدولة", fMin:"أدنى سعر", fMax:"أقصى سعر", applyFilter:"تطبيق",
      listTitle:"قائمة البطاقات المعروضة", refresh:"تحديث القائمة",
      soldTitle:"وضع بطاقة مباعة", soldCode:"رمز البطاقة", soldBtn:"تعيين كمباعة",
      loading:"جاري التحميل...", empty:"لا توجد بطاقات حالياً.", added:"تمت إضافة البطاقة إلى السوق.",
      listErr:"تعذّر تحميل القائمة.", postErr:"تعذّر الاتصال بالخادم."
    },
    guide: {
      title:"إرشادات البيع والشراء",
      p1:"هذا التطبيق يعتمد على Google Sheets لحفظ واسترجاع البيانات عبر Google Apps Script.",
      li1:"أضف بطاقة غير مفعّلة مع وسيلة تواصل واضحة.",
      li2:"تواصل مباشرة بين البائع والمشتري وتحقق من الرمز.",
      li3:"استخدم تبويب التحقق للتأكد من الرمز.",
      p2:"لا يوجد نظام دفع داخل التطبيق."
    }
  },
  en: {
    title: "Cards Marketplace - PWA",
    appName: "Cards Marketplace",
    tab: { check:"Check Card Code", aff:"Affiliate Signup", market:"Cards for Sale", guide:"Guide" },
    check: { title:"Check Card Code", codeLabel:"Card Code", codePh:"e.g., ABC123", btn:"Check", ping:"Ping Backend",
             notFound:"Card not found.", active:"Active", inactive:"Inactive", checking:"Checking..." },
    aff: { title:"Affiliate — New Signup", name:"Name", email:"Email", whatsapp:"WhatsApp", country:"Country", btn:"Register",
           saving:"Saving...", ok:"Registered successfully.", yourId:"Your affiliate ID:" },
    market: {
      addTitle:"Add Card to Market", code:"Card code (inactive)", country:"Country", contact:"Contact",
      price:"Price", addBtn:"Add",
      filterTitle:"Filter Cards", fCountry:"Country", fMin:"Min price", fMax:"Max price", applyFilter:"Apply",
      listTitle:"Available Cards", refresh:"Refresh list",
      soldTitle:"Mark Card as Sold", soldCode:"Card code", soldBtn:"Mark Sold",
      loading:"Loading...", empty:"No cards yet.", added:"Card added to market.",
      listErr:"Failed to load list.", postErr:"Server connection failed."
    },
    guide: {
      title:"Buying & Selling Guide",
      p1:"This app uses Google Sheets via Apps Script for data storage.",
      li1:"Sellers: add an inactive card with clear contact.",
      li2:"Buyers: contact seller directly and verify the code.",
      li3:"Use the Check tab to validate codes.",
      p2:"No payment system inside the app."
    }
  }
};

function applyI18n(lang){
  const dict = I18N[lang] || I18N.ar;
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = el.getAttribute('data-i18n').split('.').reduce((o,k)=>o&&o[k], dict);
    if(typeof key === 'string') el.textContent = key;
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el=>{
    const key = el.getAttribute('data-i18n-ph').split('.').reduce((o,k)=>o&&o[k], dict);
    if(typeof key === 'string') el.placeholder = key;
  });
  const titleEl = document.querySelector('title[data-i18n="title"]');
  if(titleEl) titleEl.textContent = dict.title;
  document.documentElement.lang = (lang==='en'?'en':'ar');
  document.documentElement.dir = (lang==='en'?'ltr':'rtl');
  localStorage.setItem('lang', lang);
}

const initialLang = localStorage.getItem('lang') || 'ar';
applyI18n(initialLang);
document.getElementById('btn-ar').addEventListener('click', ()=>applyI18n('ar'));
document.getElementById('btn-en').addEventListener('click', ()=>applyI18n('en'));

window.setGASUrl = function (url){
  if(!url) return;
  localStorage.setItem('GAS_URL', url);
  alert('Saved GAS URL in this browser.');
};

async function apiGet(params){
  const url = new URL(GAS_URL);
  Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { method:'GET' });
  if(!res.ok){
    const txt = await res.text().catch(()=>'');
    throw new Error(`GET ${res.status} ${res.statusText} — ${txt.slice(0,200)}`);
  }
  return res.json();
}

async function apiPost(action, payload){
  const body = new URLSearchParams({ action, ...payload });
  const res = await fetch(GAS_URL, {
    method:'POST',
    headers: { 'Content-Type':'application/x-www-form-urlencoded;charset=utf-8' },
    body
  });
  if(!res.ok){
    const txt = await res.text().catch(()=>'');
    throw new Error(`POST ${res.status} ${res.statusText} — ${txt.slice(0,200)}`);
  }
  return res.json();
}

// Tabs
const tabs = document.querySelectorAll('.tab-btn');
const sections = document.querySelectorAll('.tab-section');
tabs.forEach(btn=>btn.addEventListener('click',()=>{
  sections.forEach(s=>s.classList.remove('active'));
  document.getElementById(btn.dataset.target).classList.add('active');
}));

// Ping
document.getElementById('btn-ping').addEventListener('click', async ()=>{
  try{
    const r = await apiGet({ action:'ping' });
    alert('Ping => ' + JSON.stringify(r));
  }catch(err){ alert('Ping error: ' + err); }
});

// Check
const formCheck = document.getElementById('form-check');
const checkResult = document.getElementById('check-result');
formCheck.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const dict = I18N[localStorage.getItem('lang')||'ar'];
  checkResult.textContent = dict.check.checking;
  try {
    const code = document.getElementById('check-code').value.trim();
    const data = await apiGet({ action:'checkCard', code });
    if(!data.found){
      checkResult.innerHTML = `<span class="warn">${dict.check.notFound}</span>`;
      return;
    }
    const badge = data.active ? `<span class="ok">${dict.check.active}</span>` : `<span class="warn">${dict.check.inactive}</span>`;
    checkResult.innerHTML = `<div><div>${badge}</div>${
      data.row.holderName ? `<div><b>${data.row.holderName}</b></div>` : ''}${
      data.row.country ? `<div>${data.row.country}</div>` : ''}${
      data.row.notes ? `<div>${data.row.notes}</div>` : ''}</div>`;
  } catch(err){
    console.error(err);
    checkResult.innerHTML = '<span class="err">Server error</span>';
  }
});

// Affiliate
const formAff = document.getElementById('form-affiliate');
const affResult = document.getElementById('aff-result');
formAff.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const dict = I18N[localStorage.getItem('lang')||'ar'];
  affResult.textContent = dict.aff.saving;
  try {
    const name = document.getElementById('aff-name').value.trim();
    const email = document.getElementById('aff-email').value.trim();
    const whatsapp = document.getElementById('aff-whatsapp').value.trim();
    const country = document.getElementById('aff-country').value.trim();
    const data = await apiPost('newAffiliate',{ name, email, whatsapp, country });
    if(data.ok){
      affResult.innerHTML = `<div class="ok">${dict.aff.ok}</div><div>${dict.aff.yourId} <b>${data.affiliateId}</b></div>`;
      formAff.reset();
    }else{
      affResult.innerHTML = `<span class="err">Error: ${data.error||'Failed'}</span>`;
    }
  } catch(err){
    console.error(err);
    affResult.innerHTML = '<span class="err">Server error</span>';
  }
});

// Market
const formMarket = document.getElementById('form-market');
const marketList = document.getElementById('market-list');
const btnRefresh = document.getElementById('btn-refresh-market');
const btnApplyFilter = document.getElementById('btn-apply-filter');
let marketData = [];

formMarket.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const dict = I18N[localStorage.getItem('lang')||'ar'];
  try {
    const code = document.getElementById('mkt-code').value.trim();
    const country = document.getElementById('mkt-country').value.trim();
    const contact = document.getElementById('mkt-contact').value.trim();
    const price = document.getElementById('mkt-price').value.trim();
    const data = await apiPost('addToMarket',{ code, country, contact, price });
    if(data.ok){
      alert(dict.market.added);
      formMarket.reset();
      await loadMarket();
    }else{
      alert('Error: '+(data.error||'Failed'));
    }
  } catch(err){
    console.error(err);
    alert(I18N[localStorage.getItem('lang')||'ar'].market.postErr);
  }
});

btnRefresh.addEventListener('click', loadMarket);
btnApplyFilter.addEventListener('click', ()=>renderMarket());

async function loadMarket(){
  const dict = I18N[localStorage.getItem('lang')||'ar'];
  marketList.innerHTML = `<div class="card">${dict.market.loading}</div>`;
  try{
    const data = await apiGet({ action:'listMarket' });
    marketData = data.rows || [];
    renderMarket();
  }catch(err){
    console.error(err);
    marketList.innerHTML = `<div class="card err">${dict.market.listErr}</div>`;
  }
}

function renderMarket(){
  const dict = I18N[localStorage.getItem('lang')||'ar'];
  const fc = document.getElementById('flt-country').value.trim().toLowerCase();
  const fmin = parseFloat(document.getElementById('flt-min').value);
  const fmax = parseFloat(document.getElementById('flt-max').value);
  let rows = [...marketData];
  if(fc) rows = rows.filter(r => String(r.country||'').toLowerCase().includes(fc));
  if(!isNaN(fmin)) rows = rows.filter(r => parseFloat(r.price||0) >= fmin);
  if(!isNaN(fmax)) rows = rows.filter(r => parseFloat(r.price||0) <= fmax);
  if(rows.length===0){
    marketList.innerHTML = `<div class="card warn">${dict.market.empty}</div>`;
    return;
  }
  marketList.innerHTML = rows.map(r => (`
    <div class="market-card">
      <h4>${r.code}</h4>
      <small>${r.country||'-'}</small><br/>
      <small>${r.contact||'-'}</small><br/>
      <small>${(r.price!=null && r.price!=='')? r.price : '-'}</small><br/>
      <small>${r.timestamp||'-'}</small>
    </div>
  `)).join('');
}

// mark sold
const formSold = document.getElementById('form-sold');
formSold.addEventListener('submit', async (e)=>{
  e.preventDefault();
  try{
    const code = document.getElementById('sold-code').value.trim();
    const data = await apiPost('markSold', { code });
    if(data.ok){
      alert('Marked as sold.');
      formSold.reset();
      await loadMarket();
    }else{
      alert('Error: '+(data.error||'Failed'));
    }
  }catch(err){
    console.error(err);
    alert('Server error');
  }
});

loadMarket();
