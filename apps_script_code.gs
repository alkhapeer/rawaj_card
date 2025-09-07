/**
 * Google Apps Script backend for Cards PWA
 * Sheets: 'cards', 'affiliates', 'market'
 * Deploy as Web App (execute as you, access: Anyone)
 */

const SHEET_ID = 'PUT_YOUR_GOOGLE_SHEET_ID_HERE'; // e.g. 1AbC... from the sheet URL
const SHEETS = {
  cards: 'cards',
  affiliates: 'affiliates',
  market: 'market',
};

function getSheet(name){
  const ss = SpreadsheetApp.openById(SHEET_ID);
  return ss.getSheetByName(name);
}

function doGet(e){
  const params = e.parameter || {};
  const action = params.action || '';
  try{
    let payload = {ok:true};

    if(action === 'checkCard'){
      const code = (params.code || '').trim();
      payload = checkCard(code);
    }
    else if(action === 'listMarket'){
      payload = listMarket();
    }
    else {
      payload = { ok:false, error: 'Unknown action' };
    }

    return ContentService
      .createTextOutput(JSON.stringify(payload))
      .setMimeType(ContentService.MimeType.JSON);

  }catch(err){
    return ContentService
      .createTextOutput(JSON.stringify({ok:false, error:String(err)}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e){
  try{
    const data = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    const action = data.action || '';

    let payload = {ok:false, error:'Unknown action'};

    if(action === 'newAffiliate'){
      payload = newAffiliate(data);
    }
    else if(action === 'addToMarket'){
      payload = addToMarket(data);
    }

    return ContentService
      .createTextOutput(JSON.stringify(payload))
      .setMimeType(ContentService.MimeType.JSON);

  }catch(err){
    return ContentService
      .createTextOutput(JSON.stringify({ok:false, error:String(err)}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ---------- Actions ----------

function checkCard(code){
  if(!code) return { ok:true, found:false };
  const sh = getSheet(SHEETS.cards);
  const values = sh.getDataRange().getDisplayValues();
  // Expected header: code, holderName, country, status, notes, contact
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
      return {
        ok:true,
        found:true,
        active,
        row: {
          code: row[idx.code],
          holderName: idx.holderName>-1 ? row[idx.holderName] : '',
          country: idx.country>-1 ? row[idx.country] : '',
          notes: idx.notes>-1 ? row[idx.notes] : '',
          contact: idx.contact>-1 ? row[idx.contact] : ''
        }
      };
    }
  }
  return { ok:true, found:false };
}

function newAffiliate({name, email, whatsapp, country}){
  if(!name || !email) return { ok:false, error:'Missing fields' };
  const sh = getSheet(SHEETS.affiliates);
  const header = sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0];
  // Ensure header
  if(!header || header[0].toLowerCase()!=='timestamp'){
    sh.clear();
    sh.appendRow(['timestamp','name','email','whatsapp','country','affiliateId']);
  }
  const affiliateId = genAffiliateId(sh);
  sh.appendRow([new Date(), name, email, whatsapp||'', country||'', affiliateId]);
  return { ok:true, affiliateId };
}

function addToMarket({code, country, contact}){
  if(!code || !contact) return { ok:false, error:'Missing fields' };
  const sh = getSheet(SHEETS.market);
  const header = sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0];
  // Ensure header
  if(!header || header[0].toLowerCase()!=='timestamp'){
    sh.clear();
    sh.appendRow(['timestamp','code','country','contact','isSold']);
  }
  sh.appendRow([new Date(), code, country||'', contact||'', 'FALSE']);
  return { ok:true };
}

function listMarket(){
  const sh = getSheet(SHEETS.market);
  if(!sh) return { ok:true, rows:[] };
  const values = sh.getDataRange().getDisplayValues();
  if(values.length <= 1) return { ok:true, rows:[] };
  const header = values.shift();
  const idx = {
    timestamp: header.indexOf('timestamp'),
    code: header.indexOf('code'),
    country: header.indexOf('country'),
    contact: header.indexOf('contact'),
    isSold: header.indexOf('isSold'),
  };
  const rows = values
    .filter(r => String(r[idx.isSold]).toUpperCase()!=='TRUE')
    .map(r => ({
      timestamp: r[idx.timestamp],
      code: r[idx.code],
      country: r[idx.country],
      contact: r[idx.contact],
    }));
  return { ok:true, rows };
}

// ---------- Helpers ----------

function genAffiliateId(sh){
  // generate unique 6-char id
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const id = () => Array.from({length:6}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
  const existing = new Set((sh.getDataRange().getValues() || []).map(r => r[5]));
  let aid = id();
  let tries = 0;
  while(existing.has(aid) && tries < 100){
    aid = id();
    tries++;
  }
  return aid;
}
