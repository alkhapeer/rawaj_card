/**
 * Google Apps Script backend for Cards PWA (v3)
 * Sheets: 'cards', 'affiliates', 'market'
 * Deploy as Web App (execute as you, access: Anyone)
 */
const SHEET_ID = 'PUT_YOUR_GOOGLE_SHEET_ID_HERE'; // e.g. 1AbC... from the sheet URL
const SHEETS = { cards:'cards', affiliates:'affiliates', market:'market' };

function getSheet(name){
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sh = ss.getSheetByName(name);
  if(!sh) throw new Error('Missing sheet: ' + name);
  return sh;
}

function doGet(e){
  const params = e.parameter || {};
  const action = params.action || '';
  try{
    let payload = {ok:true};
    if(action === 'ping'){
      payload = { ok:true, msg:'pong', ts: new Date().toISOString() };
    } else if(action === 'checkCard'){
      payload = checkCard((params.code||'').trim());
    } else if(action === 'listMarket'){
      payload = listMarket();
    } else {
      payload = { ok:false, error: 'Unknown action' };
    }
    return ContentService.createTextOutput(JSON.stringify(payload))
      .setMimeType(ContentService.MimeType.JSON);
  }catch(err){
    return ContentService.createTextOutput(JSON.stringify({ok:false, error:String(err)}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e){
  try{
    let data = {};
    if(e.postData){
      const t = (e.postData.type || '').toLowerCase();
      if(t.indexOf('application/json')>-1){
        data = JSON.parse(e.postData.contents || '{}');
      }else{
        data = e.parameter || {};
      }
    }
    const action = data.action || '';
    let payload = {ok:false, error:'Unknown action'};
    if(action === 'newAffiliate'){
      payload = newAffiliate(data);
    } else if(action === 'addToMarket'){
      payload = addToMarket(data);
    } else if(action === 'markSold'){
      payload = markSold(data);
    }
    return ContentService.createTextOutput(JSON.stringify(payload))
      .setMimeType(ContentService.MimeType.JSON);
  }catch(err){
    return ContentService.createTextOutput(JSON.stringify({ok:false, error:String(err)}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Actions
function checkCard(code){
  if(!code) return { ok:true, found:false };
  const sh = getSheet(SHEETS.cards);
  const values = sh.getDataRange().getDisplayValues();
  if(values.length === 0) return { ok:true, found:false };
  const header = values.shift() || [];
  const idx = {
    code: header.indexOf('code'),
    holderName: header.indexOf('holderName'),
    country: header.indexOf('country'),
    status: header.indexOf('status'),
    notes: header.indexOf('notes'),
    contact: header.indexOf('contact'),
  };
  for(const row of values){
    if(String(row[idx.code]).trim().toLowerCase() === code.toLowerCase()){
      const active = String(row[idx.status]).trim().toLowerCase() === 'active' || String(row[idx.status]).trim() === 'مفعلة';
      return { ok:true, found:true, active,
        row:{ code:row[idx.code],
          holderName: idx.holderName>-1 ? row[idx.holderName] : '',
          country: idx.country>-1 ? row[idx.country] : '',
          notes: idx.notes>-1 ? row[idx.notes] : '',
          contact: idx.contact>-1 ? row[idx.contact] : '' } };
    }
  }
  return { ok:true, found:false };
}

function newAffiliate({name, email, whatsapp, country}){
  if(!name || !email) return { ok:false, error:'Missing fields' };
  const sh = getSheet(SHEETS.affiliates);
  ensureHeader_(sh, ['timestamp','name','email','whatsapp','country','affiliateId']);
  const affiliateId = genAffiliateId_(sh);
  sh.appendRow([new Date(), name, email, whatsapp||'', country||'', affiliateId]);
  return { ok:true, affiliateId };
}

function addToMarket({code, country, contact, price}){
  if(!code || !contact) return { ok:false, error:'Missing fields' };
  const sh = getSheet(SHEETS.market);
  ensureHeader_(sh, ['timestamp','code','country','contact','price','isSold','soldAt']);
  const p = price ? Number(price) : '';
  sh.appendRow([new Date(), code, country||'', contact||'', p, 'FALSE', '']);
  return { ok:true };
}

function listMarket(){
  const sh = getSheet(SHEETS.market);
  const values = sh.getDataRange().getDisplayValues();
  if(values.length <= 1) return { ok:true, rows:[] };
  const header = values.shift();
  const idx = {
    timestamp: header.indexOf('timestamp'),
    code: header.indexOf('code'),
    country: header.indexOf('country'),
    contact: header.indexOf('contact'),
    price: header.indexOf('price'),
    isSold: header.indexOf('isSold'),
  };
  const rows = values
    .filter(r => String(r[idx.isSold]).toUpperCase()!=='TRUE')
    .map(r => ({ timestamp:r[idx.timestamp], code:r[idx.code], country:r[idx.country], contact:r[idx.contact], price:r[idx.price] }));
  return { ok:true, rows };
}

function markSold({ code }){
  if(!code) return { ok:false, error:'Missing code' };
  const sh = getSheet(SHEETS.market);
  const range = sh.getDataRange();
  const values = range.getValues();
  const header = values[0];
  const idxMap = {
    code: header.indexOf('code'),
    isSold: header.indexOf('isSold'),
    soldAt: header.indexOf('soldAt')
  };
  for(let i=1;i<values.length;i++){
    const row = values[i];
    if(String(row[idxMap.code]).trim().toLowerCase() === String(code).trim().toLowerCase()){
      if(String(row[idxMap.isSold]).toUpperCase()!=='TRUE'){
        sh.getRange(i+1, idxMap.isSold+1).setValue('TRUE');
        sh.getRange(i+1, idxMap.soldAt+1).setValue(new Date());
      }
      return { ok:true };
    }
  }
  return { ok:false, error:'Code not found' };
}

// Helpers
function ensureHeader_(sh, wanted){
  const lastCol = Math.max(sh.getLastColumn(), wanted.length);
  const existing = (sh.getRange(1,1,1,lastCol).getDisplayValues()[0] || []);
  if (String(existing[0]||'').toLowerCase() !== String(wanted[0]).toLowerCase()) {
    sh.clear(); sh.appendRow(wanted);
  }
}

function genAffiliateId_(sh){
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const make = () => Array.from({length:6}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
  const existing = new Set((sh.getDataRange().getValues() || []).map(r => r[5]));
  let id = make(), i=0; while(existing.has(id) && i++<100) id = make();
  return id;
}
