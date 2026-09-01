// // -- fetch() adapter --
// var fetch = async function(url, opts) {
//   opts = opts || {};
//   var reqOpts = { method: opts.method || 'GET', uri: url, headers: opts.headers || {}, resolveWithFullResponse: true, encoding: null };
//   if (opts.body !== undefined) reqOpts.body = opts.body;
//   try {
//     var r = await helpers.request(reqOpts);
//     var b = r.body ? (Buffer.isBuffer(r.body) ? r.body.toString('utf8') : String(r.body)) : (typeof r === 'string' ? r : JSON.stringify(r));
//     var sc = r.statusCode || 200;
//     return { ok: sc >= 200 && sc < 300, status: sc, json: function() { if (!b || !b.trim()) return {}; return JSON.parse(b); }, text: function() { return b; } };
//   } catch(e) {
//     var sc2 = (e.response && (e.response.status || e.response.statusCode)) || (e.statusCode) || 0;
//     var eb  = e.response ? (typeof e.response.data === 'string' ? e.response.data : JSON.stringify(e.response.data||{})) : String(e.error||e.message||e);
//     return { ok: false, status: sc2, json: function() { try { return JSON.parse(eb); } catch(x) { return {}; } }, text: function() { return eb; } };
//   }
// };

// const PORTAL_ID          = '896030705';
// const REPO               = 'mohamed-ash/Daily-Report';
// const GITHUB_TOKEN       = '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';
// const ZOHO_CLIENT_ID     = '1000.23HWAS28T44DOKPL663UI50SDT9MFJ';
// const ZOHO_CLIENT_SECRET = 'facae8fe26f48f75f0405ee54059e011cb9839e445';
// const ZOHO_REFRESH_TOKEN = '1000.407fb0cf245074fb12341d2c134c30ae.ca437329c01ca7e24bf57c02d287742a';
// const SHEET_ID           = '11P7XJlm19FMGwgEv5OvyETpjK8qef-Vt6amrCru9bKY';
// const CACHE_VERSION          = 7;
// const TTL_MS                 = 12 * 60 * 60 * 1000;
// const AM_ORDER = ['Esraa Ellwaa','Jenna Ellwaa','fatema ellwaa','pola ellwaa','Youssef Mellwaa','Mostafa Ellwaa', 'Mohmed sobih'];
// const EXCLUDE  = new Set(['Walid Mohsen']);
// const AM_MAP   = {
//   'Esraa Ellwaa':'\u0625\u0633\u0631\u0627\u0621','Jenna Ellwaa':'\u062c\u0646\u0629','fatema ellwaa':'\u0641\u0627\u0637\u0645\u0629',
//   'pola ellwaa':'\u0628\u0648\u0644\u0627','Youssef Mellwaa':'\u064a\u0648\u0633\u0641','Mostafa Ellwaa':'\u0645\u0635\u0637\u0641\u0649',
//   'Mohmed sobih':'\u0645\u062d\u0645\u062f \u0635\u0628\u064a\u062d',
// };

// var reqCount = 0, windowStart = Date.now();
// async function rateLimit() {
//   reqCount++;
//   var now2 = Date.now();
//   if (now2 - windowStart > 1000) { reqCount = 1; windowStart = now2; return; }
//   if (reqCount >= 3) { await new Promise(function(r){ setTimeout(r, 1100-(now2-windowStart)); }); reqCount = 1; windowStart = Date.now(); }
// }

// var _zohoToken = null;
// async function getZohoToken() {
//   if (_zohoToken) return _zohoToken;
//   var p = 'grant_type=refresh_token&client_id='+encodeURIComponent(ZOHO_CLIENT_ID)+'&client_secret='+encodeURIComponent(ZOHO_CLIENT_SECRET)+'&refresh_token='+encodeURIComponent(ZOHO_REFRESH_TOKEN);
//   var r = await fetch('https://accounts.zoho.com/oauth/v2/token', { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:p });
//   _zohoToken = (await r.json()).access_token;
//   return _zohoToken;
// }
// async function zohoGet(url) {
//   await rateLimit();
//   var tk = await getZohoToken();
//   var r = await fetch(url, { headers:{ Authorization:'Zoho-oauthtoken '+tk } });
//   if (!r.ok) return null;
//   return r.json();
// }
// async function ghGet(path) {
//   var r = await fetch('https://api.github.com/repos/'+REPO+'/contents/'+path, { headers:{ Authorization:'token '+GITHUB_TOKEN, Accept:'application/vnd.github+json', 'User-Agent':'n8n-bot' } });
//   if (!r.ok) return null;
//   return r.json();
// }
// async function ghPush(path, content, msg) {
//   var existing = await ghGet(path);
//   var b64 = Buffer.from(content, 'utf8').toString('base64');
//   var body = { message:msg, content:b64, branch:'main' };
//   if (existing && existing.sha) body.sha = existing.sha;
//   var r = await fetch('https://api.github.com/repos/'+REPO+'/contents/'+path, { method:'PUT', headers:{ Authorization:'token '+GITHUB_TOKEN, Accept:'application/vnd.github+json', 'Content-Type':'application/json', 'User-Agent':'n8n-bot' }, body:JSON.stringify(body) });
//   return r.ok;
// }

// // Fetch projects by Zoho status slug (active / on_hold / completed)
// async function fetchByStatus(status) {
//   var all = [], idx = 1, data;
//   while (true) {
//     data = await zohoGet('https://projectsapi.zoho.com/restapi/portal/'+PORTAL_ID+'/projects/?status='+status+'&index='+idx+'&range=100');
//     if (!data || !data.projects || !data.projects.length) break;
//     all = all.concat(data.projects);
//     if (data.projects.length < 100) break;
//     idx += 100;
//   }
//   return all;
// }
// async function fetchAllProjects() {
//   var active = await fetchByStatus('active');
//   var hold   = await fetchByStatus('on_hold');
//   var done   = await fetchByStatus('completed');
//   return active.concat(hold).concat(done);
// }

// // Single ?status=all call ??? returns every task regardless of status
// async function fetchTasksAll(pid) {
//   var all = [], idx = 1, data;
//   while (true) {
//     data = await zohoGet('https://projectsapi.zoho.com/restapi/portal/'+PORTAL_ID+'/projects/'+pid+'/tasks/?status=all&index='+idx+'&range=100');
//     if (!data || !data.tasks || !data.tasks.length) break;
//     all = all.concat(data.tasks);
//     if (data.tasks.length < 100) break;
//     idx += 100;
//   }
//   return all;
// }
// // -- Safe CSV parser: handles quoted cells with embedded line breaks (Alt+Enter headers) --
// function parseCsvProper(text) {
//   var rows = [], row = [], cur = '', inQ = false, i = 0;
//   while (i < text.length) {
//     var ch = text[i];
//     if (inQ) {
//       if (ch === '"' && text[i+1] === '"') { cur += '"'; i += 2; continue; }
//       if (ch === '"') { inQ = false; i++; continue; }
//       cur += ch; i++; continue;
//     }
//     if (ch === '"') { inQ = true; i++; continue; }
//     if (ch === ',') { row.push(cur); cur = ''; i++; continue; }
//     if (ch === '\r' && text[i+1] === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; i += 2; continue; }
//     if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; i++; continue; }
//     cur += ch; i++;
//   }
//   if (row.length || cur) { row.push(cur); rows.push(row); }
//   return rows;
// }

// var SALES_SHEET_ID = '1jLBqnbHc1ej2wnMSQiw5V6L6Xwltx4pVwO9E_aYr6IQ';
// var GID_BRANCH   = '1078209926';
// var GID_COMPLETE = '699409480';

// function gvizUrl(gid) {
//   var base = 'https://docs.google.com/spreadsheets/d/'+SALES_SHEET_ID+'/export?format=csv';
//   return gid ? (base+'&gid='+gid) : base;
// }

// async function fetchSalesRows(gid) {
//   var r = await fetch(gvizUrl(gid));
//   if (!r.ok) throw new Error('gviz fetch failed: status '+r.status);
//   return parseCsvProper(r.text());
// }

// function parseSalesTab(rows) {
//   var dataStart = 1;
//   for (var i = 0; i < Math.min(rows.length, 5); i++) {
//     if ((rows[i][0]||'').indexOf('\u0627\u0633\u0645 \u0627\u0644\u0633\u064a\u0644\u0632') !== -1) { dataStart = i+1; break; }
//   }
//   var salesRows = [], totalBig = 0;
//   for (var i2 = dataStart; i2 < rows.length; i2++) {
//     var row = rows[i2];
//     var name = (row[0]||'').trim();
//     if (!name) continue;
//     var small = parseInt((row[1]||'').replace(/[^\d]/g,'')) || 0;
//     var big   = parseInt((row[2]||'').replace(/[^\d]/g,'')) || 0;
//     var total = small + big;
//     var isTotal = name.indexOf('\u0627\u0644\u0627\u062c\u0645\u0627\u0644\u064a')!==-1 || name.indexOf('\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a')!==-1;
//     if (isTotal) totalBig = big;
//     salesRows.push({ name:name, small:small, big:big, total:total, isTotal:isTotal });
//   }
//   return { rows: salesRows, totalBig: totalBig };
// }

// function parseTeamsTab(rows) {
//   var hdrs = ['\u0646\u0648\u0631\u0627 \u0648 \u0645\u0646\u0627\u0631 \u0648\u0645\u062d\u0645\u062f \u0628\u064a\u0648\u0645\u064a','\u0646\u062f\u064a \u0648\u0639\u0645\u0631 \u0648 \u0627\u0633\u0631\u0627\u0621 \u0627\u062d\u0645\u062f','\u0631\u062d\u0645\u0647 \u0648\u0647\u0628\u0629 \u0648 \u0627\u0628\u0631\u0627\u0647\u064a\u0645 \u062f\u0631\u0648\u064a\u0634','\u0627\u0644\u0645\u062c\u0645\u0648\u0639'];
//   var vals = null;
//   for (var i=0;i<rows.length;i++) {
//     var row = rows[i];
//     if (row.length < 9) continue;
//     var f=(row[5]||'').trim(), g=(row[6]||'').trim();
//     if (f!=='' && g!=='' && !isNaN(parseFloat(f)) && !isNaN(parseFloat(g))) {
//       vals = [f, g, (row[7]||'').trim(), (row[8]||'').trim()];
//       break;
//     }
//   }
//   return { headers: hdrs, values: vals || ['0','0','0','0'] };
// }

// function parseGenericSalesTable(rows) {
//   if (!rows.length) return { headers: [], rows: [] };
//   var headers = rows[0];
//   var dataRows = [];
//   for (var i=1;i<rows.length;i++) {
//     var row = rows[i];
//     if (row.some(function(c){return c.trim();})) dataRows.push(row);
//   }
//   return { headers: headers, rows: dataRows };
// }
// function parseCSV(text) {
//   var rows = [], lines = text.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n');
//   for (var li = 0; li < lines.length; li++) {
//     var line = lines[li]; if (!line.trim()) continue;
//     var cells = [], i = 0;
//     while (i <= line.length) {
//       if (i === line.length) { cells.push(''); break; }
//       if (line[i] === '"') {
//         var j = i+1, val = '';
//         while (j < line.length) { if (line[j]==='"' && line[j+1]==='"') { val+='"'; j+=2; } else if (line[j]==='"') { j++; break; } else { val+=line[j++]; } }
//         cells.push(val); i = j; if (line[i]===',') i++;
//       } else {
//         var end = line.indexOf(',', i); if (end===-1) end=line.length;
//         cells.push(line.slice(i,end)); i=end+1;
//       }
//     }
//     rows.push(cells);
//   }
//   return rows;
// }

// function getCS(p)    { return p.custom_status_name || ''; }
// function getOwner(p) { return p.owner_name || ''; }
// function disp(owner) { return AM_MAP[owner] || owner || '???'; }

// // Compute full entry for a project: milestones + all tasks ??? boolean flags.
// // Accepts both n8n v5 cache format {_v,_upd,...} and generate.js format {u,...,rv}.
// async function getEntry(pid, projUpd, cache) {
//   var c = cache[pid];
//   if (c && ((c._v===CACHE_VERSION && c._upd===projUpd && (Date.now()-(c._ts||0))<TTL_MS) || (c.u!==undefined && c.u===projUpd && c.rv!==undefined))) return c;

//   var msRes = await zohoGet('https://projectsapi.zoho.com/restapi/portal/'+PORTAL_ID+'/projects/'+pid+'/milestones/');
//   var msList = msRes && msRes.milestones ? msRes.milestones : [];
//   var m2=null, m3=null;
//   for (var i=0; i<msList.length; i++) {
//     if (msList[i].name==='\u0627\u0644\u062f\u0641\u0639\u0629 \u0627\u0644\u062b\u0627\u0646\u064a\u0629') m2=msList[i];
//     else if (msList[i].name==='\u0627\u0644\u062f\u0641\u0639\u0629 \u0627\u0644\u062b\u0627\u0644\u062b\u0629') m3=msList[i];
//   }

//   var tasks = await fetchTasksAll(pid);
//   function st(t) { return ((t.status && t.status.name) ? t.status.name : (t.status||'')).toLowerCase(); }

//   var licTask=null, sijilOpen=null, ovOpen=null;
//   var rv=false, co=false, ap=false, am=false, sj=false;
//   for (var j=0; j<tasks.length; j++) {
//     var t=tasks[j], tn=t.name||'', ts=st(t);
//     if (tn==='\u0635\u062f\u0648\u0631 \u0627\u0644\u062a\u0631\u062e\u064a\u0635') licTask=t;
//     if (tn==='\u0627\u0633\u062a\u0644\u0627\u0645 \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u062a\u0631\u062e\u064a\u0635' && ts==='open') rv=true;
//     if (tn==='\u062c\u0645\u0639 \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u062a\u0631\u062e\u064a\u0635' && ts==='open') co=true;
//     if (tn==='\u0645\u0648\u0627\u0641\u0642\u0629 \u0627\u0644\u0639\u0645\u064a\u0644 \u0639\u0644\u0649 \u0627\u0644\u0627\u0648\u0641\u0631 \u0641\u064a\u0648' && ts==='open') ap=true;
//     if (tn.indexOf('\u0639\u0645\u0644 \u0634\u0631\u0643\u0629  \u0627\u0645\u0631\u064a\u0643\u0627')!==-1 && ts==='open') am=true;
//     if (tn.indexOf('\u062a\u0633\u0644\u064a\u0645 \u0646\u0633\u062e\u0629 \u0645\u0646 \u0627\u0644\u0633\u062c\u0644 \u0627\u0644\u062a\u062c\u0627\u0631\u0649')!==-1 && ts==='finished') sj=true;
//     if (tn.indexOf('\u062a\u0633\u0644\u064a\u0645 \u0646\u0633\u062e\u0629 \u0645\u0646 \u0627\u0644\u0633\u062c\u0644 \u0627\u0644\u062a\u062c\u0627\u0631\u0649')!==-1 && ts==='open' && !sijilOpen) sijilOpen=t;
//     if (tn.indexOf('\u0639\u0645\u0644 \u0627\u0644\u0627\u0648\u0641\u0631 \u0641\u064a\u0648')!==-1 && ts==='open' && !ovOpen) ovOpen=t;
//   }

//   var licFin = licTask && (st(licTask) === 'finished' || st(licTask) === 'cancelled');
//   var m2st = m2 ? (m2.status||'').toLowerCase() : null;
//   var m3st = m3 ? (m3.status||'').toLowerCase() : null;
//   var m3t  = (m3st==='completed') ? (m3.completed_time_long||m3.end_date_long||0) : null;

//   var entry = {
//     _v:CACHE_VERSION, _upd:projUpd, _ts:Date.now(),
//     lic: licFin ? (licTask.completed_time_long||0) : null,
//     rv:rv, co:co, ap:ap, am:am, sj:sj,
//     sjE: sijilOpen ? (sijilOpen.end_date_long||null) : null,
//     ovE: ovOpen    ? (ovOpen.end_date_long||null)    : null,
//     m2:m2st, m3:m3st, m3t:m3t
//   };
//   cache[pid] = entry;
//   return entry;
// }

// // Lightweight: fetch only ???????????? ?????????????? milestone for done-project secondary loop.
// // Reuses full entry from cache if available (avoid re-fetching tasks).
// async function getEntryM3(pid, projUpd, cache) {
//   var full = cache[pid];
//   if (full) {
//     if ((full._v===CACHE_VERSION && full._upd===projUpd) || (full.u!==undefined && full.u===projUpd))
//       return { m3t: full.m3t!==undefined ? full.m3t : null };
//   }
//   var mini = cache['ms_'+pid];
//   if (mini && mini._v===CACHE_VERSION && mini._upd===projUpd) return mini;

//   var msRes = await zohoGet('https://projectsapi.zoho.com/restapi/portal/'+PORTAL_ID+'/projects/'+pid+'/milestones/');
//   var msList = msRes && msRes.milestones ? msRes.milestones : [];
//   var m3=null;
//   for (var i=0; i<msList.length; i++) { if (msList[i].name==='\u0627\u0644\u062f\u0641\u0639\u0629 \u0627\u0644\u062b\u0627\u0644\u062b\u0629') { m3=msList[i]; break; } }
//   var m3st = m3 ? (m3.status||'').toLowerCase() : null;
//   var m3t  = (m3st==='completed') ? (m3.completed_time_long||m3.end_date_long||0) : null;

//   var entry = { _v:CACHE_VERSION, _upd:projUpd, m3t:m3t };
//   cache['ms_'+pid] = entry;
//   return entry;
// }

// // ????????? MAIN ????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
// try {
//   var now = Date.now();
//   var d = new Date(now);
//   var dateKey = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
//   var updatedAt = dateKey+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');

//   var monthStart = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
//   var monthEnd   = new Date(d.getFullYear(), d.getMonth()+1, 1).getTime();
//   function isThisMonth(ts) { return ts!==null && ts!==undefined && ts>0 && ts>=monthStart && ts<monthEnd; }
//   function is112(name)     { return (name||'').indexOf('-112-')!==-1; }
//   function projCompletedThisMonth(p) {
//     if (p.completed_on_long && p.completed_on_long > 0) return isThisMonth(p.completed_on_long);
//     if (p.completed_on) {
//       var pts = p.completed_on.split('-');
//       if (pts.length === 3) {
//         var pm = parseInt(pts[0])-1, py = parseInt(pts[2]);
//         return py === d.getFullYear() && pm === d.getMonth();
//       }
//     }
//     return false;
//   }

//   // Load cache from GitHub
//   var cacheFile = await ghGet('task_cache.json');
//   var taskCache = {};
//   if (cacheFile && cacheFile.content) {
//     try { taskCache = JSON.parse(Buffer.from(cacheFile.content.replace(/\n/g,''),'base64').toString('utf8')); } catch(e) {}
//   }

//   var allProjects    = await fetchAllProjects();
//   var activeProjects = allProjects.filter(function(p){ return getCS(p)==='Active'; });
//   var doneProjects   = allProjects.filter(function(p){ return getCS(p)==='Completed'; });
//   var onHoldProjects = allProjects.filter(function(p){ return getCS(p)==='On Hold'; });

//   var kpi = {
//     p2:[], p3:[], recv:[], coll:[], licMonth:[],
//     sijilSaudi:[], clientApproval:[], overDue:[], sijilDelay:[],
//     sijilAmer:[], amer:[], completedMonth:[], completed112:[], onHold:[], p1Delayed:[]
//   };
//   var amActive={}, amOnHold={};
//   AM_ORDER.forEach(function(n){ amActive[n]=0; amOnHold[n]=0; });

//   // ?????? Active projects ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
//   for (var i=0; i<activeProjects.length; i++) {
//     var p=activeProjects[i], pid=String(p.id_string||p.id);
//     var owner=getOwner(p);
//     if (EXCLUDE.has(owner)) continue;
//     var pname=p.name||pid;
//     var projUpd=p.last_updated_time_long||p.updated_date_long||0;
//     if (amActive[owner]===undefined) amActive[owner]=0;
//     amActive[owner]++;

//     var e = await getEntry(pid, projUpd, taskCache);

//     // p2: license issued, ???????? ?????????? not yet collected
//     if (e.lic!==null && e.m2!==null && e.m2!=='completed')
//       kpi.p2.push({name:pname, owner:disp(owner)});
//     // p3: ???????? ?????????? collected, ???????? ?????????? not yet collected
//     if (e.m2==='completed' && e.m3!==null && e.m3!=='completed')
//       kpi.p3.push({name:pname, owner:disp(owner)});
//     // ???????????? ???????????? ?????????????? open
//     if (e.rv) kpi.recv.push({name:pname, owner:disp(owner)});
//     // ?????? AND ???????????? both open
//     if (e.co && e.rv) kpi.coll.push({name:pname, owner:disp(owner)});
//     // ???????? ?????????????? completed this month
//     if (isThisMonth(e.lic)) kpi.licMonth.push({name:pname, owner:disp(owner)});
//     // ?????????? ???????? ?????????? ?????????????? finished
//     if (e.sj) kpi.sijilSaudi.push({name:pname, owner:disp(owner)});
//     // ???????????? ???????????? ?????? ???????????? ?????? open
//     if (e.sj && e.ap) kpi.clientApproval.push({name:pname, owner:disp(owner)});
//     // ?????? ???????????? ?????? end_date is in the past
//     if (e.ovE!==null && e.ovE<now) kpi.overDue.push({name:pname, owner:disp(owner)});
//     // ?????????? ?????????? end_date is in the past
//     if (e.sjE!==null && e.sjE<now) kpi.sijilDelay.push({name:pname, owner:disp(owner)});
//     // ?????????? finished AND ???????? ???????????? open
//     if (e.sj && e.am) kpi.sijilAmer.push({name:pname, owner:disp(owner)});
//     // ???????? ???????????? open
//     if (e.am) kpi.amer.push({name:pname, owner:disp(owner)});
//   }

//   // ?????? On Hold ???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
//   for (var i=0; i<onHoldProjects.length; i++) {
//     var p=onHoldProjects[i], owner=getOwner(p);
//     if (EXCLUDE.has(owner)) continue;
//     var pid=String(p.id_string||p.id);
//     var pname=p.name||pid;
//     var projUpd=p.last_updated_time_long||p.updated_date_long||0;
//     kpi.onHold.push({name:pname, owner:disp(owner)});
//     if (amOnHold[owner]===undefined) amOnHold[owner]=0;
//     amOnHold[owner]++;
//     var e = await getEntry(pid, projUpd, taskCache);
//     if (isThisMonth(e.lic)) kpi.licMonth.push({name:pname, owner:disp(owner)});
//   }

//   // ?????? Done projects: secondary loop for completedMonth + licMonth ??????????????????????????????
//   for (var i=0; i<doneProjects.length; i++) {
//     var p=doneProjects[i], pid=String(p.id_string||p.id);
//     var owner=getOwner(p);
//     if (EXCLUDE.has(owner)) continue;
//     var pname=p.name||pid;
//     var projUpd=p.last_updated_time_long||p.updated_date_long||0;

//     if (!projCompletedThisMonth(p)) continue;

//     if (is112(pname)) kpi.completed112.push({name:pname, owner:disp(owner)});
//     else kpi.completedMonth.push({name:pname, owner:disp(owner)});

//     // Also check if license was issued this month for this done project
//     var fullE = await getEntry(pid, projUpd, taskCache);
//     if (isThisMonth(fullE.lic)) {
//       var already=false;
//       for (var li=0; li<kpi.licMonth.length; li++) { if (kpi.licMonth[li].name===pname) { already=true; break; } }
//       if (!already) kpi.licMonth.push({name:pname, owner:disp(owner)});
//     }
//   }

//   // ?????? P1 from Google Sheet (READ-ONLY) ????????????????????????????????????????????????????????????????????????????????????????????????????????????
//   var p1Rows = [];
//   var sheetR = await fetch('https://docs.google.com/spreadsheets/d/'+SHEET_ID+'/export?format=csv&gid=0');
//   if (sheetR.ok) {
//     var rows = parseCSV(sheetR.text());
//     if (rows.length > 1) {
//       var hdrs = rows[0].map(function(h){ return String(h).trim().toLowerCase(); });
//       var iN=hdrs.indexOf('project name'),iO=hdrs.indexOf('owner'),iS=hdrs.indexOf('status'),iP=hdrs.indexOf('payment method'),iF=hdrs.indexOf('1st'),iT=hdrs.indexOf('tax'),iR=hdrs.indexOf('the rest');
//       for (var ri=1; ri<rows.length; ri++) {
//         var row=rows[ri]; if (!row[iN]) continue;
//         if (iS>=0 && (row[iS]||'').trim().toLowerCase()!=='active') continue;
//         function pn(s){ return parseFloat(String(s||'').replace(/,/g,''))||0; }
//         if (iT>=0 && pn(row[iT])!==0) continue;
//         var theRest=pn(row[iR]);
//         if (!theRest) continue;
//         p1Rows.push({name:row[iN]||'',owner:row[iO]||'',paymentMethod:row[iP]||'',first:pn(row[iF]),tax:0,theRest:theRest});
//       }
//     }
//   }
//   kpi.p1Delayed = p1Rows;

//   // ?????? Metrics ???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
//   var kkeys = ['p2','p3','recv','coll','licMonth','sijilSaudi','clientApproval','overDue','sijilDelay','sijilAmer','amer','completedMonth','completed112','onHold','p1Delayed'];
//   var metrics = {};
//   for (var ki=0; ki<kkeys.length; ki++) metrics[kkeys[ki]] = kpi[kkeys[ki]].length;

//   var amData = { active:amActive, onHold:amOnHold };
//   var payload = { updatedAt:updatedAt, dateKey:dateKey, metrics:metrics, details:kpi, amData:amData };

//   // ?????? Patch index.html with new embedded data ??????????????????????????????????????????????????????????????????????????????????????????
//   var htmlFile = await ghGet('index.html');
//   if (htmlFile && htmlFile.content) {
//     var html = Buffer.from(htmlFile.content.replace(/\n/g,''),'base64').toString('utf8');
//     var dData = JSON.parse(JSON.stringify(kpi));
//     dData.amData = amData;
//     html = html.replace(/^const _D\s*=\s*.*$/m, 'const _D   = '+JSON.stringify(dData)+';');
//     html = html.replace(/^const _M\s*=\s*.*$/m, 'const _M   = '+JSON.stringify(metrics)+';');
//     html = html.replace(/^const _TODAY\s*=\s*'[^']*';$/m, "const _TODAY = '"+dateKey+"';");
//     html = html.replace(/^const _A\s*=\s*.*$/m, 'const _A   = '+JSON.stringify(amData)+';');
//     html = html.replace(/^const _P1D\s*=\s*\[.*$/m, 'const _P1D = '+JSON.stringify(kpi.p1Delayed)+';');
//     var updStr;
//     try { updStr = new Intl.DateTimeFormat('ar-EG',{weekday:'long',year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:true,timeZone:'Africa/Cairo'}).format(new Date(now)); } catch(e) { updStr = updatedAt; }
//     html = html.replace(/getElementById\('upd-at'\)\.textContent\s*=\s*'[^']*';/, "getElementById('upd-at').textContent = '"+updStr.replace(/'/g,"\\'")+"';");
//     html = html.replace(/id="upd-at">[^<]*<\/span>/, 'id="upd-at">'+updStr+'</span>');
//     await ghPush('index.html', html, 'data: '+updatedAt);
//   }

//   // ?????? Push supporting files ????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
//   var debugInfo = {
//     ts:updatedAt,
//     total:allProjects.length, active:activeProjects.length,
//     onHold:onHoldProjects.length, completed:doneProjects.length,
//     cacheSize:Object.keys(taskCache).length, metrics:metrics,
//     p2_sample:(kpi.p2||[]).slice(0,5).map(function(x){return x.name;}),
//     p3_sample:(kpi.p3||[]).slice(0,5).map(function(x){return x.name;}),
//     recv_sample:(kpi.recv||[]).slice(0,5).map(function(x){return x.name;}),
//     firstDone: null
//   };
//   await ghPush('debug.json', JSON.stringify(debugInfo,null,2), 'debug: '+updatedAt);
//   await ghPush('data.json', JSON.stringify(payload), 'data: '+updatedAt);
//   await ghPush('task_cache.json', JSON.stringify(taskCache), 'cache: '+updatedAt);
//   await ghPush('history/'+dateKey+'.json', JSON.stringify(payload), 'history: '+dateKey);

//   var idxFile = await ghGet('history/index.json');
//   var histIdx = [];
//   if (idxFile && idxFile.content) { try { histIdx = JSON.parse(Buffer.from(idxFile.content.replace(/\n/g,''),'base64').toString('utf8')); } catch(e) {} }
//   if (!histIdx.includes(dateKey)) { histIdx.unshift(dateKey); if (histIdx.length>90) histIdx=histIdx.slice(0,90); }
//   await ghPush('history/index.json', JSON.stringify(histIdx), 'idx: '+dateKey);

//   // â”€â”€ Sales / Branches / Completed archiving
//   var salesArchiveErr = null;
//   try {
//     var salesRaw    = await fetchSalesRows(null);
//     var branchRaw    = await fetchSalesRows(GID_BRANCH);
//     var completeRaw  = await fetchSalesRows(GID_COMPLETE);

//     var salesData     = parseSalesTab(salesRaw);
//     var teamsData      = parseTeamsTab(salesRaw);
//     var branchesData   = parseGenericSalesTable(branchRaw);
//     var completedData  = parseGenericSalesTable(completeRaw);

//     var salesUpdatedAt;
//     try { salesUpdatedAt = new Intl.DateTimeFormat('ar-EG',{weekday:'long',year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:true,timeZone:'Africa/Cairo'}).format(new Date(now)); }
//     catch(fe) { salesUpdatedAt = updatedAt; }

//     var salesSnapshot = { date:dateKey, updatedAt:salesUpdatedAt, sales:salesData, branches:branchesData, completed:completedData, teams:teamsData };
//     await ghPush('history/sales-'+dateKey+'.json', JSON.stringify(salesSnapshot), 'sales-history: '+dateKey);

//     var salesIdxFile = await ghGet('history/sales-index.json');
//     var salesHistIdx = [];
//     if (salesIdxFile && salesIdxFile.content) { try { salesHistIdx = JSON.parse(Buffer.from(salesIdxFile.content.replace(/\n/g,''),'base64').toString('utf8')); } catch(pe) {} }
//     if (salesHistIdx.indexOf(dateKey) === -1) { salesHistIdx.unshift(dateKey); if (salesHistIdx.length>90) salesHistIdx = salesHistIdx.slice(0,90); }
//     await ghPush('history/sales-index.json', JSON.stringify(salesHistIdx), 'sales-idx: '+dateKey);
//   } catch (salesEx) {
//     salesArchiveErr = String(salesEx);
//   }
  
//   // \u2500\u2500 EMAIL: once daily at 11 AM Cairo (UTC+3 = 08:00 UTC) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
//   var emailSent = false, emailErr = '';
//   var cairoHour = (new Date().getUTCHours() + 3) % 24;
//   if (cairoHour === 11) {
//     var sentFile = await ghGet('email_sent.json');
//     var lastSent = '', threadMessageId = null;
//     if (sentFile && sentFile.content) {
//       try { var sd=JSON.parse(Buffer.from(sentFile.content.replace(/\n/g,''),'base64').toString('utf8')); lastSent=sd.lastSent||''; threadMessageId=sd.threadMessageId||null; } catch(ee) {}
//     }
//     if (lastSent !== dateKey) {
//       var MS_TENANT='01ly6.onmicrosoft.com', MS_CLIENT='d3590ed6-52b3-4102-aeff-aad2292ab01c';
//       var MS_USER='ameeremad@01ly6.onmicrosoft.com', MS_PASS='Newdawn@1';
//       try {
//         var tb2='grant_type=password&client_id='+encodeURIComponent(MS_CLIENT)+'&username='+encodeURIComponent(MS_USER)+'&password='+encodeURIComponent(MS_PASS)+'&scope=https%3A%2F%2Fgraph.microsoft.com%2FMail.Send';
//         var tr2=await fetch('https://login.microsoftonline.com/'+MS_TENANT+'/oauth2/v2.0/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:tb2});
//         var td2=await tr2.json();
//         if(!td2.access_token) throw new Error('No token: '+JSON.stringify(td2));
//         var AM_EN=['Esraa Ellwaa','Jenna Ellwaa','fatema ellwaa','pola ellwaa','Youssef Mellwaa','Mostafa Ellwaa','Mohmed sobih'];
//         var AM_AR=['\u0625\u0633\u0631\u0627\u0621','\u062c\u0646\u0629','\u0641\u0627\u0637\u0645\u0629','\u0628\u0648\u0644\u0627','\u064a\u0648\u0633\u0641','\u0645\u0635\u0637\u0641\u0649','\u0645\u062d\u0645\u062f \u0635\u0628\u064a\u062d'];
//         var aP2={}, aP3={};
//         AM_AR.forEach(function(n){aP2[n]=0;aP3[n]=0;});
//         (kpi.p2||[]).forEach(function(x){if(aP2[x.owner]!==undefined)aP2[x.owner]++;});
//         (kpi.p3||[]).forEach(function(x){if(aP3[x.owner]!==undefined)aP3[x.owner]++;});
//         var amRows='';
//         for(var ai=0;ai<AM_EN.length;ai++){
//           var en=AM_EN[ai],ar=AM_AR[ai];
//           var act=amData.active[en]||0,hld=amData.onHold[en]||0,p2n=aP2[ar]||0,p3n=aP3[ar]||0;
//           var rbg=ai%2===0?'#0f1523':'#111827';
//           amRows+='<tr>'
//             +'<td width="110" bgcolor="'+rbg+'" style="background:'+rbg+';padding:10px 12px;color:#e8e8f0;font-family:Arial,sans-serif;font-size:14px;font-weight:600;border-bottom:1px solid #1e2535;">'+ar+'</td>'
//             +'<td align="center" bgcolor="'+rbg+'" style="background:'+rbg+';padding:10px 8px;color:#c9a84c;font-family:Arial,sans-serif;font-size:15px;font-weight:700;border-bottom:1px solid #1e2535;">'+act+'</td>'
//             +'<td align="center" bgcolor="'+rbg+'" style="background:'+rbg+';padding:10px 8px;color:#c8d0dc;font-family:Arial,sans-serif;font-size:14px;border-bottom:1px solid #1e2535;">'+hld+'</td>'
//             +'<td align="center" bgcolor="'+rbg+'" style="background:'+rbg+';padding:10px 8px;color:#ff7070;font-family:Arial,sans-serif;font-size:15px;font-weight:700;border-bottom:1px solid #1e2535;">'+p2n+'</td>'
//             +'<td align="center" bgcolor="'+rbg+'" style="background:'+rbg+';padding:10px 8px;color:#ff7070;font-family:Arial,sans-serif;font-size:15px;font-weight:700;border-bottom:1px solid #1e2535;">'+p3n+'</td>'
//             +'</tr>';
//         }
//         function kpiCard(num,lbl,bg,nc){return '<td width="50%" bgcolor="'+bg+'" style="background:'+bg+';padding:14px 16px;border:1px solid #1e2535;"><div style="font-size:30px;font-weight:700;color:'+nc+';font-family:Arial,sans-serif;line-height:1;">'+num+'</div><div style="font-size:13px;color:#8892a4;font-family:Arial,sans-serif;margin-top:6px;">'+lbl+'</div></td>';}
//         var eHtml='<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"></head>'
//           +'<body style="margin:0;padding:0;background:#0a0c14;direction:rtl;font-family:Arial,sans-serif;">'
//           +'<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#0a0c14"><tr><td align="center" style="padding:20px 12px;">'
//           +'<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#0d1117;border:1px solid #1e2535;">'
//           +'<tr><td bgcolor="#1a1a2e" align="center" style="background:#1a1a2e;padding:28px 24px 22px;border-bottom:3px solid #c9a84c;">'
//           +'<div style="font-size:10px;letter-spacing:4px;color:#c9a84c;font-family:Arial,sans-serif;margin-bottom:8px;">EL LWAA LAW FIRM</div>'
//           +'<div style="font-size:22px;font-weight:700;color:#ffffff;font-family:Arial,sans-serif;margin-bottom:8px;">\u0627\u0644\u062a\u0642\u0631\u064a\u0631 \u0627\u0644\u064a\u0648\u0645\u064a</div>'
//           +'<div style="font-size:13px;color:#8892a4;font-family:Arial,sans-serif;">'+updatedAt+'</div></td></tr>'
//           +'<tr><td style="padding:16px 24px 8px;"><div style="font-size:10px;letter-spacing:3px;color:#4a5568;font-family:Arial,sans-serif;border-bottom:1px solid #1e2535;padding-bottom:8px;">\u0627\u0644\u0645\u0624\u0634\u0631\u0627\u062a \u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629</div></td></tr>'
//           +'<tr><td style="padding:0 24px 16px;"><table width="100%" cellpadding="0" cellspacing="6">'
//           +'<tr><td colspan="2" bgcolor="#1a0d0d" style="background:#1a0d0d;padding:18px 20px;border:1px solid #5c1a1a;"><div style="font-size:38px;font-weight:700;color:#ff5555;font-family:Arial,sans-serif;line-height:1;">'+metrics.p1Delayed+'</div><div style="font-size:13px;color:#ff8888;font-family:Arial,sans-serif;margin-top:6px;">\u0627\u0644\u062f\u0641\u0639\u0629 \u0627\u0644\u0627\u0648\u0644\u0649 \u0627\u0644\u0645\u062a\u0627\u062e\u0631\u0629</div></td></tr>'
//           +'<tr>'+kpiCard(metrics.onHold,'\u0639\u0645\u0644\u0627\u0621 \u0627\u0648\u0646 \u0647\u0648\u0644\u062f','#131929','#c9a84c')+kpiCard(metrics.p2,'\u0627\u0644\u062f\u0641\u0639\u0629 \u0627\u0644\u062b\u0627\u0646\u064a\u0629 \u0627\u0644\u0645\u062a\u0627\u062e\u0631\u0629','#131929','#c9a84c')+'</tr>'
//           +'<tr>'+kpiCard(metrics.p3,'\u0627\u0644\u062f\u0641\u0639\u0629 \u0627\u0644\u062b\u0627\u0644\u062b\u0629 \u0627\u0644\u0645\u062a\u0627\u062e\u0631\u0629','#131929','#c9a84c')+kpiCard(metrics.licMonth,'\u0635\u062f\u0648\u0631 \u0627\u0644\u062a\u0631\u062e\u064a\u0635 \u0641\u064a \u0627\u0644\u0634\u0647\u0631','#131929','#c9a84c')+'</tr>'
//           +'<tr>'+kpiCard(metrics.completedMonth,'\u0627\u0644\u0645\u0646\u062a\u0647\u0648\u0646 \u0641\u064a \u0627\u0644\u0634\u0647\u0631','#131929','#c9a84c')+kpiCard(metrics.completed112,'\u0645\u0635\u0631 \u0641\u0642\u0637','#131929','#c9a84c')+'</tr>'
//           +'<tr>'+kpiCard(metrics.overDue,'\u062a\u0627\u062e\u064a\u0631 \u0627\u0644\u0627\u0648\u0641\u0631 \u0641\u064a\u0648','#131929','#c9a84c')+kpiCard(metrics.sijilDelay,'\u062a\u0627\u062e\u064a\u0631 \u0627\u0644\u0633\u062c\u0644','#131929','#c9a84c')+'</tr>'
//           +'</table></td></tr>'
//           +'<tr><td style="padding:4px 24px 8px;"><div style="font-size:10px;letter-spacing:3px;color:#4a5568;font-family:Arial,sans-serif;border-bottom:1px solid #1e2535;padding-bottom:8px;">\u0627\u062f\u0627\u0621 \u0645\u062f\u064a\u0631\u064a \u0627\u0644\u062d\u0633\u0627\u0628\u0627\u062a</div></td></tr>'
//           +'<tr><td style="padding:0 24px 20px;"><table width="100%" cellpadding="0" cellspacing="0">'
//           +'<tr bgcolor="#1a1a2e"><td style="padding:10px 12px;color:#c9a84c;font-family:Arial,sans-serif;font-size:12px;font-weight:700;border-bottom:2px solid #c9a84c;">\u0627\u0644\u0627\u0633\u0645</td>'
//           +'<td align="center" style="padding:10px 8px;color:#c9a84c;font-family:Arial,sans-serif;font-size:12px;font-weight:700;border-bottom:2px solid #c9a84c;">\u0646\u0634\u0637</td>'
//           +'<td align="center" style="padding:10px 8px;color:#c9a84c;font-family:Arial,sans-serif;font-size:12px;font-weight:700;border-bottom:2px solid #c9a84c;">\u0647\u0648\u0644\u062f</td>'
//           +'<td align="center" style="padding:10px 8px;color:#c9a84c;font-family:Arial,sans-serif;font-size:12px;font-weight:700;border-bottom:2px solid #c9a84c;">\u062f\u0641\u0639\u0629 2</td>'
//           +'<td align="center" style="padding:10px 8px;color:#c9a84c;font-family:Arial,sans-serif;font-size:12px;font-weight:700;border-bottom:2px solid #c9a84c;">\u062f\u0641\u0639\u0629 3</td></tr>'
//           +amRows+'</table></td></tr>'
//           +'<tr><td align="center" bgcolor="#0d1117" style="background:#0d1117;padding:20px 24px;border-top:1px solid #1e2535;">'
//           +'<a href="https://projects.zoho.com/portal/896030705/bizwoheader.do?theme=%7B%22zpPrimary%22%3A%2284%2C100%2C242%22%7D&frameorigin=https://crm.zoho.com&_iam_orgtype=5&_iam_zid=888010751#globalwebtab/2533013000003165002" style="background:#c9a84c;color:#0d1117;text-decoration:none;padding:12px 28px;font-family:Arial,sans-serif;font-size:14px;font-weight:700;display:inline-block;">\u0641\u062a\u062d \u0627\u0644\u062f\u0627\u0634 \u0628\u0648\u0631\u062f \u0627\u0644\u0643\u0627\u0645\u0644</a>'
//           +'<div style="font-size:11px;color:#3a4455;font-family:Arial,sans-serif;margin-top:12px;">\u0627\u0644\u062a\u0642\u0631\u064a\u0631 \u0627\u0644\u064a\u0648\u0645\u064a \u0627\u0644\u062a\u0644\u0642\u0627\u0626\u064a - EL LWAA Law Firm</div>'
//           +'</td></tr></table></td></tr></table></body></html>';
//         var msgObj={subject:'\u0627\u0644\u062a\u0642\u0631\u064a\u0631 \u0627\u0644\u064a\u0648\u0645\u064a - EL LWAA',body:{contentType:'HTML',content:eHtml},toRecipients:[{emailAddress:{address:'CRM@01ly6.onmicrosoft.com'}},{emailAddress:{address:'ahmedshoukryhamed@gmail.com'}},{emailAddress:{address:'amir.emad43210@gmail.com'}}]};

//         var mc=await fetch('https://graph.microsoft.com/v1.0/me/messages',{method:'POST',headers:{'Authorization':'Bearer '+td2.access_token,'Content-Type':'application/json'},body:JSON.stringify(msgObj)});
//         if(!mc.ok){emailErr='create-HTTP '+mc.status;}
//         else{var mcj=await mc.json();var newMid=mcj.internetMessageId||null;var mcId=mcj.id;var ms=await fetch('https://graph.microsoft.com/v1.0/me/messages/'+mcId+'/send',{method:'POST',headers:{'Authorization':'Bearer '+td2.access_token}});emailSent=ms.ok;if(!ms.ok){emailErr='send-HTTP '+ms.status;}else{await ghPush('email_sent.json',JSON.stringify({lastSent:dateKey,threadMessageId:threadMessageId||newMid}),'email-log: '+dateKey);}}
//       } catch(emailEx){emailErr=String(emailEx);}
//     } else { emailErr='already-sent-today'; }
//   }
//   // \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
//       return [{ json: { ok:true, updatedAt:updatedAt, metrics:metrics, emailSent:emailSent, emailErr:emailErr, salesArchiveErr:salesArchiveErr } }];
// } catch(e) {
//   return [{ json: { ok:false, error:String(e), stack:(e&&e.stack)?String(e.stack):'no stack' } }];
// }

