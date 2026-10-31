const params=new URLSearchParams(location.search);
const storage={get(key,fallback){try{return JSON.parse(sessionStorage.getItem('liyoxi-'+key))??fallback}catch{return fallback}},set(key,value){try{sessionStorage.setItem('liyoxi-'+key,JSON.stringify(value))}catch{}},remove(key){try{sessionStorage.removeItem('liyoxi-'+key)}catch{}}};
const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sources=['official_account','website','direct'];
const source=sources.includes(params.get('source'))?params.get('source'):storage.get('source','direct');
storage.set('source',sources.includes(source)?source:'direct');
const receipt=storage.get('receipt',null);
const validReceipt=receipt&&typeof receipt.registrationId==='string'&&typeof receipt.createdAt==='string';
const view=params.get('view')==='success'&&!validReceipt?'advisor':(params.get('view')||'home');
const groups=[
 {name:'音乐与模版创作',items:[[1,'音频+AIGC：MV带货'],[2,'混剪模版带货'],[3,'口播+特效模版带货']]},
 {name:'剧情与影像创作',items:[[4,'短剧带货'],[5,'TVC短片'],[6,'短片带货'],[8,'高质量实拍带货']]},
 {name:'人物与信息流内容',items:[[7,'信息流带货'],[9,'访谈带货'],[10,'KOL带货']]},
 {name:'海外流程与实践',items:[[11,'海外带货流程和实践']]},
 {name:'图文与视频 GEO',items:[[12,'图文GEO'],[13,'视频GEO']]}
];
const all=groups.flatMap(g=>g.items);
let selected=new Set((Array.isArray(storage.get('intents',[]))?storage.get('intents',[]):[]).filter(id=>all.some(([value])=>id===value)));
const selectedNames=()=>all.filter(([id])=>selected.has(id)).map(([,name])=>name);
const url=v=>'./?view='+encodeURIComponent(v)+'&source='+encodeURIComponent(sources.includes(source)?source:'direct');
const header=()=>`<header class="masthead"><a class="brand" href="${url('home')}" aria-label="狸有戏首页"><img src="assets/logo-horizontal.png" alt="狸有戏"><sup>™</sup></a><button class="menu-trigger" id="menu"><span>课程导航</span><i class="menu-lines" aria-hidden="true"></i></button></header>`;
const footer=(text,target,note='',extra='')=>`<div class="bottom-action">${extra}<a class="primary" href="${url(target)}"><span>${text}</span><span class="arrow" aria-hidden="true">↗</span></a>${note?`<p class="bottom-note">${note}</p>`:''}</div>`;
const home=()=>`${header()}<section class="hero"><img class="hero-photo" src="assets/studio-hero.png" alt="片场灯光照亮产品的品牌概念场景"><div class="hero-shade"></div><div class="hero-copy"><div class="eyebrow">带货内容创作 · 线下系列课</div><h1><span>一个周末，</span><span>入门带货创作。</span></h1><p class="intro">选择一种创作方向，<br>把你的想法，变成看得见的内容。</p></div><div class="view-corner" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="hero-caption"><span>好内容，自带好戏。</span><small>AI 概念场景</small></div></section><section class="facts"><div class="fact"><strong>2</strong><em>天</em><p>单门课程初步培训</p></div><div class="fact"><strong>13</strong><em>门</em><p>独立创作课程</p></div><div class="fact"><strong>3</strong><em>期</em><p>可预约复听</p></div></section><div class="home-meta"><div class="location"><i class="pin" aria-hidden="true"></i>长沙 · 中南大学科技园</div><p>面向在校学生，也欢迎探索副业、重新出发<br>或兼顾育儿的你。</p></div>${footer('选课并填写意向','courses')}`;
const courses=()=>`${header()}<section class="page-head"><div class="eyebrow">选择你的创作方向</div><h1>从感兴趣的内容开始。</h1><p>13 门独立课程，可多选意向。</p></section><div class="pad"><div class="section-line"><h2>课程目录</h2><span>按创作方向浏览</span></div>${groups.map((g,i)=>`<details class="course-group" ${i===0||params.has('expanded')?'open':''}><summary class="group-title"><span class="group-name">${g.name}<small>${g.items.length} 门</small></span><span class="group-arrow" aria-hidden="true">›</span></summary><div class="course-options">${g.items.map(([id,name])=>`<label class="course-row"><span class="course-num">${String(id).padStart(2,'0')}</span><span class="course-label">${name}</span><input type="checkbox" data-id="${id}" ${selected.has(id)?'checked':''} aria-label="${name}"></label>`).join('')}</div></details>`).join('')}<label class="undecided"><input id="undecided" type="checkbox" ${!selected.size?'checked':''}><span>还没想好，请顾问推荐</span></label><p class="help-copy">这里选择的是学习意向，提交后可与顾问调整。</p></div>${footer('继续填写意向','form','',`<div class="selection-summary"><span>已选 <b id="count">${selected.size}</b> 门意向课程</span><span>可随时调整</span></div>`)}`;
const schedule=()=>`${header()}<section class="page-head schedule-head"><div class="eyebrow">关于这次学习</div><h1>先入门，<br>再持续练习。</h1><p>每种带货内容创作，都是一门独立课程。<br>选一个方向，用周末开始。</p></section><div class="pad"><section class="big-stat"><div class="stat-number">02<span>天</span></div><div class="stat-info"><div class="eyebrow">单门课程 · 周末线下</div><h2>完成初步培训</h2><p>围绕一种内容创作方式学习。<br>具体课程班次由顾问确认。</p></div></section><section class="big-stat"><div class="stat-number">03<span>期</span></div><div class="stat-info"><div class="eyebrow">后续学习 · 需预约</div><h2>可以复听，再巩固</h2><p>可预约复听 3 期。<br>复听安排请与课程顾问确认。</p></div></section><section class="location-card"><div class="location-art" aria-hidden="true"></div><div class="eyebrow">线下上课地点</div><h2>中南大学科技园</h2><p>湖南 · 长沙<br>面向长沙及周边城市学习者</p></section><p class="schedule-foot">班期、具体教室和到场安排，<br>添加微信课程顾问后确认。</p></div>${footer('填写报名意向','form')}`;
const form=()=>`${header()}<div class="stage-track"><span class="active">01 填写意向</span><i></i><span>02 添加课程顾问</span></div><section class="form-head"><h1>你的创作，<br>从这一步开始。</h1><p>留下联系方式，<br>让课程顾问帮你确认适合的课程与班期。</p></section><form class="pad" id="intent-form" novalidate><div class="honeypot" aria-hidden="true"><label for="website">网站</label><input id="website" name="website" tabindex="-1" autocomplete="off"></div><div class="field"><label class="field-label" for="phone">手机号<em>必填</em></label><input class="text-input" id="phone" name="phone" type="tel" inputmode="numeric" maxlength="11" placeholder="请输入用于联系的手机号" autocomplete="tel" required><p class="field-note">用于本次课程咨询与报名联系</p></div><div class="field"><label class="field-label" for="name">怎么称呼你<em>选填</em></label><input class="text-input" id="name" name="name" placeholder="方便顾问与你沟通" autocomplete="name" maxlength="50"></div><section class="intent-box"><div class="intent-top"><span>意向课程 · 选填</span><a class="text-link" href="${url('courses')}">修改选择</a></div><div class="chips">${(selectedNames().length?selectedNames():['还没想好，请顾问推荐']).map(n=>`<span class="chip">${n}</span>`).join('')}</div></section><label class="privacy"><input id="consent" type="checkbox"><span>我已阅读并同意<button type="button" id="privacy-link">《隐私说明》</button>，同意顾问为本次课程咨询与报名联系我。</span></label><div class="form-context"><strong>周末线下 · 单门课程 2 天初步培训</strong><br>中南大学科技园 · 可预约复听 3 期</div><p class="form-error" id="form-error" role="alert" tabindex="-1"></p><div class="bottom-action"><button class="primary" type="submit"><span>提交意向，添加课程顾问</span><span class="arrow" aria-hidden="true">↗</span></button><p class="bottom-note">提交意向后，与顾问确认课程和班期</p></div></form>`;
const advisorCard=()=>`<section class="advisor-card"><h2>狸有戏 · 李老师</h2><p class="advisor-subtitle">个人微信 · 课程咨询与报名</p><a class="qr-image-link" href="assets/advisor-wechat.jpg" target="_blank" rel="noopener" aria-label="查看微信二维码原图"><img class="advisor-qr" src="assets/advisor-wechat.jpg" alt="李老师的个人微信二维码，扫码添加好友" width="888" height="1128"></a><p class="qr-help">微信内可尝试长按识别二维码，<br>或打开原图保存后，在微信扫一扫中选择图片。</p><a class="text-link qr-original" href="assets/advisor-wechat.jpg" target="_blank" rel="noopener">查看 / 保存二维码原图 ↗</a></section>`;
const success=()=>`${header()}<div class="stage-track"><span>01 填写意向 ✓</span><i></i><span class="active">02 添加课程顾问</span></div><section class="success-head"><div class="success-sign" aria-hidden="true">✓</div><h1>报名意向已收到。</h1><p>再添加李老师微信，<br>确认适合你的课程、班次和费用。</p></section>${advisorCard()}<div class="success-summary"><div class="summary-row"><span class="title">你的意向</span><span class="value">${(Array.isArray(receipt?.courseIds)?all.filter(([id])=>receipt.courseIds.includes(id)).map(([,name])=>name):selectedNames()).join('<br>')||'请顾问推荐课程'}</span></div><div class="summary-row"><span class="title">上课地点</span><span class="value">中南大学科技园</span></div></div><p class="success-bottom">意向已记录，顾问将后续跟进。<br>具体课程与班期，以双方确认的信息为准。</p>${footer('返回查看课程','courses')}`;
const advisor=()=>`${header()}<section class="success-head"><h1>和李老师聊聊。</h1><p>了解课程、班次和费用，<br>一起确认适合你的学习方向。</p></section>${advisorCard()}${footer('填写报名意向','form')}`;
const views={home,courses,schedule,form,success,advisor};
document.querySelector('#app').innerHTML=`<article class="screen ${Object.hasOwn(views,view)?view:'home'}-screen">${(views[view]||home)()}</article>`;
function modal(content){
 const priorFocus=document.activeElement,wrap=document.createElement('div');wrap.className='modal-backdrop';
 wrap.innerHTML=`<section class="modal" role="dialog" aria-modal="true" aria-label="课程信息">${content}<button class="secondary close" type="button">关闭</button></section>`;
 const close=()=>{wrap.remove();document.removeEventListener('keydown',onKey);priorFocus?.focus()};
 const onKey=e=>{if(e.key==='Escape')close();if(e.key==='Tab'){const focusable=[...wrap.querySelectorAll('a,button,input')];const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}};
 document.body.append(wrap);wrap.querySelector('.close').onclick=close;wrap.onclick=e=>{if(e.target===wrap)close()};document.addEventListener('keydown',onKey);wrap.querySelector('a,button')?.focus();
}
document.querySelector('#menu').onclick=()=>modal(`<h2>课程导航</h2><a href="${url('home')}">课程首页</a><a href="${url('courses')}">选择课程方向</a><a href="${url('schedule')}">了解学习安排</a><a href="${url('form')}">填写报名意向</a><a href="${url('advisor')}">添加微信课程顾问</a>`);
function save(){storage.set('intents',[...selected]);const count=document.querySelector('#count');if(count)count.textContent=selected.size;}
document.querySelectorAll('[data-id]').forEach(el=>el.onchange=()=>{const id=Number(el.dataset.id);el.checked?selected.add(id):selected.delete(id);document.querySelector('#undecided').checked=!selected.size;save()});
const undecided=document.querySelector('#undecided');if(undecided)undecided.onchange=()=>{if(undecided.checked){selected.clear();document.querySelectorAll('[data-id]').forEach(el=>el.checked=false);save()}else if(!selected.size){undecided.checked=true}};
const privacyLink=document.querySelector('#privacy-link');if(privacyLink)privacyLink.onclick=e=>{e.preventDefault();modal('<h2>隐私说明</h2><p>狸有戏为提供本次课程咨询与报名服务，收集你填写的手机号、选填称呼和意向课程，以及进入页面的来源（公众号、官网或直接访问）。手机号是顾问联系你的必要信息。</p><p>提交后，这些信息会保存在报名服务中，由负责本次招生的顾问查看，用于沟通课程、班期和报名安排。页面不会要求填写身份证、支付信息或微信密码。</p><p>你可以通过本页李老师的微信，提出查询、更正或删除本次报名信息的要求。添加个人微信是独立操作，请在微信中自行确认添加。</p><p>为方便继续填写，页面会在当前浏览器会话中暂存输入和课程选择；成功提交后清除联系方式草稿。</p>')};
const intentForm=document.querySelector('#intent-form');
if(intentForm){
 const phone=document.querySelector('#phone'),name=document.querySelector('#name'),consent=document.querySelector('#consent'),error=document.querySelector('#form-error'),submit=intentForm.querySelector('[type="submit"]');
 const draft=storage.get('draft',{});phone.value=typeof draft.phone==='string'?draft.phone:'';name.value=typeof draft.name==='string'?draft.name:'';
 const saveDraft=()=>storage.set('draft',{phone:phone.value,name:name.value});phone.addEventListener('input',saveDraft);name.addEventListener('input',saveDraft);
 let busy=false;
 intentForm.onsubmit=async e=>{
  e.preventDefault();if(busy)return;error.textContent='';
  if(!/^1[3-9]\d{9}$/.test(phone.value.trim())){error.textContent='请填写有效的 11 位手机号，方便顾问联系。';phone.focus();return}
  if(!consent.checked){error.textContent='请先阅读并同意隐私说明。';consent.focus();return}
  const payload={phone:phone.value.trim(),name:name.value.trim(),courseIds:[...selected].sort((a,b)=>a-b),source:sources.includes(source)?source:'direct',consent:true,website:document.querySelector('#website').value};
  const signature=JSON.stringify(payload),pending=storage.get('pending',null);
  const requestId=pending?.signature===signature?pending.requestId:(crypto.randomUUID?crypto.randomUUID(): '10000000-1000-4000-8000-100000000000'.replace(/[018]/g,c=>(c ^ crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16)));
  storage.set('pending',{requestId,signature});save();busy=true;submit.disabled=true;submit.firstElementChild.textContent='正在提交…';intentForm.setAttribute('aria-busy','true');
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
  try{
   const response=await fetch('./api/enrollments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,requestId}),signal:controller.signal,credentials:'same-origin'});
   const result=await response.json();
   if(!response.ok||result.ok!==true||typeof result.registrationId!=='string'||typeof result.createdAt!=='string')throw new Error(result.error?.message||'暂时未能提交，请稍后重试。');
   storage.set('receipt',{registrationId:result.registrationId,createdAt:result.createdAt,courseIds:payload.courseIds});storage.remove('draft');storage.remove('pending');location.href=url('success');
  }catch(problem){error.textContent=problem.name==='AbortError'?'网络响应较慢，请重试。相同内容重试不会重复报名。':(problem instanceof TypeError?'网络连接未成功，请检查网络后重试。':problem.message||'提交未完成，请稍后重试。');error.focus();}
  finally{clearTimeout(timeout);busy=false;submit.disabled=false;submit.firstElementChild.textContent='提交意向，添加课程顾问';intentForm.removeAttribute('aria-busy');}
 };
}
