const PORTAL_TOUR_KEY='icp-welcome-tour-v1';
let portalInstallPrompt=null;
let portalCountdownTimer=null;

window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();portalInstallPrompt=event;portalUpdateInstallButton();
});
window.addEventListener('appinstalled',()=>{portalInstallPrompt=null;portalUpdateInstallButton(true);});

function portalText(value,maximum=240){return String(value == null ? '' : value).trim().slice(0,maximum);}

function portalShareURL(item){
  const candidate=item && (item.FileURL || item.OfficialURL || item.URL || item.LinkURL || item.WebsiteURL);
  const safe=typeof safePortalURL==='function' ? safePortalURL(candidate) : '';
  return safe || location.href;
}

function appendPortalShareButton(container,item,kind){
  if(!container)return;
  const title=portalText(item && (item.Title || item.Name || item.Program || item.Question) || 'ICP YOUTH CIRCLE',200);
  let actions=Array.from(container.children).find(child=>child.classList && child.classList.contains('portal-card-actions'));
  if(!actions){
    actions=document.createElement('div');actions.className='portal-card-actions';
    Array.from(container.children).filter(child=>child.matches && child.matches('a.resource-button,button.resource-button')).forEach(child=>actions.appendChild(child));
    container.appendChild(actions);
  }
  const button=document.createElement('button');button.type='button';button.className='portal-share-button';
  button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/></svg><span>Share</span>';
  button.setAttribute('aria-label','Share '+title);button.title='Share';
  button.onclick=async()=>{
    const url=portalShareURL(item);const text='View this '+portalText(kind || 'item',40)+' from ICP YOUTH CIRCLE.';
    if(navigator.share){
      try{await navigator.share({title,text,url});return;}catch(error){if(error && error.name==='AbortError')return;}
    }
    const whatsapp='https://wa.me/?text='+encodeURIComponent(title+'\n'+url);
    window.open(whatsapp,'_blank','noopener,noreferrer');
  };
  actions.appendChild(button);
}

function portalInstallButton(){
  let button=document.getElementById('portalInstallButton');
  if(button)return button;
  button=document.createElement('button');button.id='portalInstallButton';button.type='button';button.className='footer-install-button';button.textContent='Install portal app';
  button.onclick=async()=>{
    if(portalInstallPrompt){
      portalInstallPrompt.prompt();await portalInstallPrompt.userChoice;portalInstallPrompt=null;portalUpdateInstallButton();return;
    }
    const message=/iphone|ipad|ipod/i.test(navigator.userAgent)
      ? 'On iPhone or iPad, open the browser Share menu and choose Add to Home Screen.'
      : 'Open your browser menu and choose Install app or Add to Home screen.';
    window.alert(message);
  };
  const footer=document.querySelector('.footer-bottom');if(footer)footer.appendChild(button);
  return button;
}

function portalUpdateInstallButton(installed=false){
  const button=portalInstallButton();if(!button)return;
  const standalone=installed || matchMedia('(display-mode: standalone)').matches || navigator.standalone===true;
  button.hidden=standalone;button.classList.toggle('is-ready',Boolean(portalInstallPrompt));
}

function portalCountdownDate(value){
  if(value instanceof Date)return value;
  const text=String(value || '').trim();if(!text)return new Date(NaN);
  const pakistanLocal=/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?$/.test(text) ? text.replace(' ','T')+'+05:00' : text;
  return new Date(pakistanLocal);
}

function portalCountdownTargetLabel(target){
  try{return new Intl.DateTimeFormat('en-PK',{dateStyle:'long',timeStyle:'short',timeZone:'Asia/Karachi'}).format(target)+' PKT';}
  catch(_){return target.toLocaleString();}
}

function portalDrawCountdown(item){
  const section=document.getElementById('homeTools');if(!section)return;
  if(portalCountdownTimer){clearInterval(portalCountdownTimer);portalCountdownTimer=null;}
  const target=portalCountdownDate(item && item.TargetDateTime);
  if(!item || Number.isNaN(target.getTime())){section.dataset.active='';section.hidden=true;section.replaceChildren();return;}
  section.dataset.active='true';section.hidden=false;
  section.innerHTML='<div class="container"><article class="public-countdown-card"><div class="public-countdown-copy"><span class="home-tool-eyebrow">IMPORTANT UPDATE</span><h2></h2><p class="public-countdown-description"></p><p class="public-countdown-target"></p></div><div class="public-countdown-status"><div class="public-countdown-clock" role="timer" aria-live="off"><div><strong data-unit="days">00</strong><span>Days</span></div><div><strong data-unit="hours">00</strong><span>Hours</span></div><div><strong data-unit="minutes">00</strong><span>Minutes</span></div><div><strong data-unit="seconds">00</strong><span>Seconds</span></div></div><div class="public-countdown-announced" hidden><span aria-hidden="true">✓</span><strong></strong></div></div></article></div>';
  const card=section.querySelector('.public-countdown-card');card.querySelector('h2').textContent=portalText(item.Title,240);
  const description=card.querySelector('.public-countdown-description');description.textContent=portalText(item.Description,1000);description.hidden=!description.textContent;
  card.querySelector('.public-countdown-target').textContent='Scheduled for '+portalCountdownTargetLabel(target);
  const url=typeof safePortalURL==='function' ? safePortalURL(item.OfficialURL) : '';
  if(url){const link=document.createElement('a');link.className='resource-button';link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=portalText(item.ButtonText || 'Official details',80);card.querySelector('.public-countdown-copy').appendChild(link);}
  appendPortalShareButton(card.querySelector('.public-countdown-copy'),item,'update');
  const update=()=>{
    const remaining=target.getTime()-Date.now();const clock=card.querySelector('.public-countdown-clock');const announced=card.querySelector('.public-countdown-announced');
    if(remaining<=0){clock.hidden=true;announced.hidden=false;announced.querySelector('strong').textContent=portalText(item.AfterMessage || 'Result announced',240);card.classList.add('is-announced');if(portalCountdownTimer){clearInterval(portalCountdownTimer);portalCountdownTimer=null;}return;}
    const totalSeconds=Math.floor(remaining/1000);const values={days:Math.floor(totalSeconds/86400),hours:Math.floor((totalSeconds%86400)/3600),minutes:Math.floor((totalSeconds%3600)/60),seconds:totalSeconds%60};
    Object.entries(values).forEach(([unit,value])=>{card.querySelector('[data-unit="'+unit+'"]').textContent=String(value).padStart(2,'0');});
  };
  update();if(target.getTime()>Date.now())portalCountdownTimer=setInterval(update,1000);
}

function portalCreatePublicCountdown(){
  if(document.getElementById('homeTools'))return;
  const section=document.createElement('section');section.id='homeTools';section.className='home-tools';section.hidden=true;
  const hero=document.getElementById('homeHero');if(!hero)return;hero.insertAdjacentElement('afterend',section);
  if(typeof refreshPublicModule!=='function')return;
  refreshPublicModule('countdowns').then(rows=>portalDrawCountdown((rows || [])[0])).catch(()=>{section.hidden=true;});
}

function portalCreateWelcomeTour(){
  if(location.protocol==='file:' && !window.__ICP_TEST_TOUR__)return;
  try{if(localStorage.getItem(PORTAL_TOUR_KEY))return;}catch(_){}
  const steps=[
    ['Welcome to ICP YOUTH CIRCLE','Find study resources, opportunities, guidance and public updates in one student portal.'],
    ['Search and save','Use search to find content quickly. Save useful resources and access them later from My account.'],
    ['Stay updated','Use the notification bell for public announcements and sign in for personal test results, reminders and request tracking.']
  ];
  const overlay=document.createElement('div');overlay.className='welcome-tour';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','welcomeTourTitle');
  const card=document.createElement('div');card.className='welcome-tour-card';const progress=document.createElement('p');progress.className='welcome-tour-progress';const title=document.createElement('h2');title.id='welcomeTourTitle';const text=document.createElement('p');
  const actions=document.createElement('div');actions.className='welcome-tour-actions';const skip=document.createElement('button');skip.type='button';skip.className='secondary-button';skip.textContent='Skip';const next=document.createElement('button');next.type='button';next.className='resource-button';actions.append(skip,next);card.append(progress,title,text,actions);overlay.appendChild(card);document.body.appendChild(overlay);
  let index=0;const finish=()=>{try{localStorage.setItem(PORTAL_TOUR_KEY,'seen');}catch(_){}overlay.remove();};
  const draw=()=>{progress.textContent='STEP '+(index+1)+' OF '+steps.length;title.textContent=steps[index][0];text.textContent=steps[index][1];next.textContent=index===steps.length-1?'Start exploring':'Next';next.focus();};
  skip.onclick=finish;next.onclick=()=>{if(index===steps.length-1)finish();else{index+=1;draw();}};overlay.addEventListener('keydown',event=>{if(event.key==='Escape')finish();});draw();
}

function portalPakistanWeekday(){return new Intl.DateTimeFormat('en-US',{weekday:'long',timeZone:'Asia/Karachi'}).format(new Date());}
function portalReminderIsScheduled(item){
  const now=Date.now();const start=item && item.PublishDate ? new Date(item.PublishDate).getTime() : 0;const end=item && item.ExpiryDate ? new Date(item.ExpiryDate).getTime() : 0;
  return (!Number.isFinite(start) || !start || start<=now) && (!Number.isFinite(end) || !end || end>=now);
}

function portalRenderFridayReminder(){
  if(portalPakistanWeekday()!=='Friday' || typeof loadPublicModule!=='function')return;
  loadPublicModule('announcements').then(rows=>{
    const item=(rows || []).filter(row=>String(row.Category || '').trim().toLowerCase()==='friday reminder' && portalReminderIsScheduled(row)).sort((a,b)=>Number(a.DisplayOrder || 0)-Number(b.DisplayOrder || 0))[0];
    if(!item)return;
    const banner=document.createElement('aside');banner.className='friday-reminder';banner.setAttribute('aria-label','Friday reminder');
    const copy=document.createElement('div');const label=document.createElement('span');label.textContent='FRIDAY REMINDER';const title=document.createElement('strong');title.textContent=portalText(item.Title || 'Friday reminder',200);const message=document.createElement('p');message.textContent=portalText(item.Summary || item.Content,500);copy.append(label,title,message);banner.appendChild(copy);
    const url=typeof safePortalURL==='function'?safePortalURL(item.OfficialURL):'';if(url){const link=document.createElement('a');link.className='resource-button';link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=portalText(item.ButtonText || 'Read reminder',80);banner.appendChild(link);}
    document.querySelector('header').insertAdjacentElement('afterend',banner);
  }).catch(()=>{});
}

function loadPortalFAQs(){
  const content=document.getElementById('dynamicPageContent');const filters=document.getElementById('resourceFilters');const requestVersion=navigationVersion;
  filters.innerHTML='';filters.style.display='none';content.innerHTML='<p>Loading frequently asked questions…</p>';
  loadPublicModule('faqs').then(rows=>{
    if(requestVersion!==navigationVersion)return;
    content.replaceChildren();const panel=document.createElement('section');panel.className='faq-panel';
    const search=document.createElement('input');search.type='search';search.className='faq-search';search.placeholder='Search questions and answers';search.setAttribute('aria-label','Search frequently asked questions');
    const list=document.createElement('div');list.className='faq-list';panel.append(search,list);content.appendChild(panel);
    const draw=()=>{const query=search.value.trim().toLowerCase();const visible=(rows || []).filter(row=>!query || [row.Question,row.Answer,row.Category].join(' ').toLowerCase().includes(query));list.replaceChildren();
      if(!visible.length){const empty=document.createElement('p');empty.textContent='No matching answers found.';list.appendChild(empty);return;}
      visible.forEach(row=>{const details=document.createElement('details');details.className='faq-item';const summary=document.createElement('summary');summary.textContent=portalText(row.Question,500);const category=document.createElement('span');category.className='resource-badge';category.textContent=portalText(row.Category || 'General',120);const answer=document.createElement('p');answer.textContent=portalText(row.Answer,5000);details.append(summary,category,answer);list.appendChild(details);});
    };search.oninput=draw;draw();search.focus({preventScroll:true});
  }).catch(()=>{if(requestVersion===navigationVersion){content.innerHTML='<p>Frequently asked questions are unavailable right now.</p>';const retry=document.createElement('button');retry.type='button';retry.className='resource-button';retry.textContent='Try again';retry.onclick=loadPortalFAQs;content.appendChild(retry);}});
}

let portalLastBackgroundRefresh=0;
function portalRefreshInBackground(){
  if(Date.now()-portalLastBackgroundRefresh<15*60*1000 || typeof warmPublicBundle!=='function')return;
  portalLastBackgroundRefresh=Date.now();warmPublicBundle().catch(()=>{});
}

function initializePortalExtras(){
  portalCreatePublicCountdown();portalUpdateInstallButton();
  setTimeout(portalCreateWelcomeTour,500);
  const startReminder=()=>portalRenderFridayReminder();if('requestIdleCallback'in window)requestIdleCallback(startReminder,{timeout:2500});else setTimeout(startReminder,1200);
  addEventListener('online',portalRefreshInBackground);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')portalRefreshInBackground();});
}

document.addEventListener('DOMContentLoaded',initializePortalExtras);

// A deployment stays on its own domain when shared or installed.
function initializeDeploymentMetadata(){
  if(!/^https?:$/.test(location.protocol))return;
  const home=new URL('./',location.href);home.hash='';home.search='';
  const canonical=document.querySelector('link[rel="canonical"]');if(canonical)canonical.href=home.href;
  for(const selector of ['meta[property="og:image"]','meta[name="twitter:image"]']){const el=document.querySelector(selector);if(el)el.content=new URL('assets/social/portal-share-1200x630.png',home).href;}
  const schema=document.querySelector('script[type="application/ld+json"]');if(schema){try{const data=JSON.parse(schema.textContent);data.url=home.href;schema.textContent=JSON.stringify(data);}catch(_){}}
}

const PREPARATION_KEY='icp-preparation-v2';
function preparationRead(){try{const rows=JSON.parse(localStorage.getItem(PREPARATION_KEY));return Array.isArray(rows)?rows.filter(row=>row&&typeof row.id==='string'&&typeof row.title==='string').slice(0,200):[];}catch(_){return [];}}
function renderPreparationTracker(){
  const content=document.getElementById('dynamicPageContent');
  content.innerHTML=`<div class="study-workspace"><div class="study-intro"><span class="section-eyebrow">ONE SMALL STEP AT A TIME</span><h2>Your preparation, your pace.</h2><p>Turn a big syllabus into manageable tasks. Your plan is saved in this browser on this device.</p></div><div class="study-stats" aria-live="polite"><article><strong id="planTotal">0</strong><span>Planned tasks</span></article><article><strong id="planDone">0</strong><span>Completed</span></article><article><strong id="planPercent">0%</strong><span>Progress</span></article></div><progress id="planProgress" max="100" value="0" aria-label="Study plan completion"></progress><form id="planForm" class="study-task-form"><label>What will you study?<input name="title" maxlength="160" required placeholder="e.g. Revise C++ variables"></label><label>Subject<input name="subject" maxlength="60" placeholder="e.g. Computer Science"></label><label>Target date<input name="due" type="date"></label><button class="resource-button" type="submit">Add task +</button></form><p id="planStatus" role="status"></p><div class="study-toolbar"><label>Show <select id="planFilter"><option value="all">All tasks</option><option value="pending">To do</option><option value="done">Completed</option></select></label><button type="button" id="planExport" class="secondary-button">Export plan</button></div><div id="planTasks"></div><div class="study-utilities"><section class="study-utility"><span class="section-eyebrow">TIME TO FOCUS</span><h3>A little focus goes a long way.</h3><p>Choose a session, settle in, and take a break when you finish.</p><label>Session <select id="focusDuration"><option value="25">25 minutes</option><option value="45">45 minutes</option><option value="5">5 minute break</option></select></label><output id="focusClock" class="focus-clock" aria-label="Time remaining">25:00</output><div class="qa-actions"><button id="focusToggle" class="resource-button" type="button">Start session</button><button id="focusReset" class="secondary-button" type="button">Reset</button></div><p id="focusStatus" role="status"></p></section><section class="study-utility"><span class="section-eyebrow">KNOW WHERE YOU STAND</span><h3>Marks percentage calculator</h3><p>Calculate a percentage from your obtained and total marks.</p><form id="marksForm"><label>Obtained marks<input name="obtained" type="number" min="0" step="any" required></label><label>Total marks<input name="total" type="number" min="0.01" step="any" required></label><button class="resource-button" type="submit">Calculate</button><p id="marksResult" role="status"></p></form></section></div></div>`;
  let tasks=preparationRead();const status=document.getElementById('planStatus');
  const save=()=>{try{localStorage.setItem(PREPARATION_KEY,JSON.stringify(tasks));status.textContent='Plan saved on this device.';}catch(_){status.textContent='Your browser could not save this plan. Export it to keep a copy.';}draw();};
  const draw=()=>{
    const done=tasks.filter(t=>t.done).length;const percent=tasks.length?Math.round(done/tasks.length*100):0;
    document.getElementById('planTotal').textContent=tasks.length;document.getElementById('planDone').textContent=done;document.getElementById('planPercent').textContent=percent+'%';document.getElementById('planProgress').value=percent;
    const list=document.getElementById('planTasks');list.replaceChildren();const filter=document.getElementById('planFilter').value;
    const visible=tasks.filter(t=>filter==='all'||(filter==='done'?t.done:!t.done));
    if(!visible.length){const empty=document.createElement('p');empty.className='study-empty';empty.textContent=tasks.length?'No tasks in this view.':'A fresh start. Add your first study task above.';list.append(empty);}
    visible.forEach(task=>{
      const row=document.createElement('article');row.className='study-task'+(task.done?' is-done':'');
      const label=document.createElement('label');const check=document.createElement('input');check.type='checkbox';check.checked=!!task.done;check.onchange=()=>{task.done=check.checked;save();};
      const copy=document.createElement('span');const title=document.createElement('strong');title.textContent=task.title;const detail=document.createElement('small');detail.textContent=[task.subject,task.due?'Due '+task.due:''].filter(Boolean).join(' · ');copy.append(title,detail);label.append(check,copy);
      const remove=document.createElement('button');remove.type='button';remove.className='secondary-button';remove.textContent='Remove';remove.setAttribute('aria-label','Remove '+task.title);remove.onclick=()=>{tasks=tasks.filter(t=>t.id!==task.id);save();};row.append(label,remove);list.append(row);
    });
  };
  document.getElementById('planFilter').onchange=draw;
  document.getElementById('planForm').onsubmit=event=>{event.preventDefault();const form=event.currentTarget;const values=new FormData(form);const title=String(values.get('title')).trim();if(!title){status.textContent='Enter a study task.';return;}if(tasks.length>=200){status.textContent='Your plan holds up to 200 tasks. Remove a completed task to add another.';return;}tasks.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random(),title,subject:String(values.get('subject')).trim(),due:String(values.get('due')),done:false});form.reset();save();form.elements.title.focus();};
  document.getElementById('planExport').onclick=()=>{const file=new Blob([JSON.stringify({name:'ICP Youth Circle study plan',tasks},null,2)],{type:'application/json'});const url=URL.createObjectURL(file);const a=document.createElement('a');a.href=url;a.download='ICP-study-plan.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  document.getElementById('marksForm').onsubmit=event=>{event.preventDefault();const values=new FormData(event.currentTarget);const obtained=Number(values.get('obtained')),total=Number(values.get('total'));document.getElementById('marksResult').textContent=obtained>total?'Obtained marks cannot exceed total marks.':(obtained/total*100).toFixed(2)+'%';};
  let remaining=25*60,end=0,running=false;const clock=document.getElementById('focusClock'),button=document.getElementById('focusToggle'),focusStatus=document.getElementById('focusStatus');
  const paint=()=>{clock.textContent=Math.floor(remaining/60).toString().padStart(2,'0')+':'+(remaining%60).toString().padStart(2,'0');};
  const stop=()=>{running=false;button.textContent='Start session';};
  document.getElementById('focusDuration').onchange=event=>{stop();remaining=Number(event.target.value)*60;focusStatus.textContent='';paint();};
  button.onclick=()=>{if(running){remaining=Math.max(0,Math.ceil((end-Date.now())/1000));stop();button.textContent='Resume';}else{if(!remaining)remaining=Number(document.getElementById('focusDuration').value)*60;end=Date.now()+remaining*1000;running=true;button.textContent='Pause';focusStatus.textContent='Session running. Keep this page open.';}};
  document.getElementById('focusReset').onclick=()=>{stop();remaining=Number(document.getElementById('focusDuration').value)*60;focusStatus.textContent='Session reset.';paint();};
  const timer=setInterval(()=>{if(!clock.isConnected){clearInterval(timer);return;}if(running){remaining=Math.max(0,Math.ceil((end-Date.now())/1000));paint();if(!remaining){stop();focusStatus.textContent='Session complete. Take a moment to rest.';}}},250);draw();
}

function appendStudyNextSteps(content){
  const aside=document.createElement('aside');aside.className='study-next-steps';
  const title=document.createElement('h3');title.textContent='Keep your learning moving.';
  const copy=document.createElement('p');copy.textContent='Organise your next study session, or contribute a useful resource for other students.';
  const links=document.createElement('div');links.className='qa-actions';
  for(const [label,href] of [['Build a study plan','#/study/prep-tracker'],['Submit a resource','#/community/submit-resource']]){const link=document.createElement('a');link.className='resource-button';link.textContent=label;link.href=href;links.append(link);}
  aside.append(title,copy,links);content.append(aside);
}
