const API = 'api/index.php';
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];

const loader = $('#pageLoader');
window.addEventListener('load', () => setTimeout(() => loader?.classList.add('hide'), 450));

const navbar = $('#navbar');
window.addEventListener('scroll', () => navbar?.classList.toggle('scrolled', window.scrollY > 40));

const menuBtn = $('#menuBtn');
const navLinks = $('#navLinks');
menuBtn?.addEventListener('click', () => navLinks?.classList.toggle('open'));
$$('.nav-links a').forEach(link => link.addEventListener('click', () => navLinks?.classList.remove('open')));

const observer = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
}), {threshold:.12});
$$('.reveal').forEach(el => observer.observe(el));

let toastTimer;
function showToast(message){
  const toast=$('#toast'); if(!toast) return;
  toast.textContent=message; toast.classList.add('show'); clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>toast.classList.remove('show'),3200);
}

async function api(action, data=null, method='POST'){
  const options={method,headers:{'Accept':'application/json'}};
  if(data!==null){options.headers['Content-Type']='application/json';options.body=JSON.stringify(data)}
  const url=`${API}?action=${encodeURIComponent(action)}`;
  const res=await fetch(url,options);
  let json;
  try{json=await res.json()}catch{throw new Error('استجابة غير صالحة من الخادم')}
  if(!json.ok) throw new Error(json.message||'حدث خطأ');
  return json;
}

function roleLabel(role){return ({player:'لاعب',admin:'Admin',stade_owner:'صاحب ملعب'})[role]||role}
function initials(name='BG'){return name.trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'BG'}

const authModal=$('#authModal'), loginView=$('#loginView'), signupView=$('#signupView');
function openAuth(type){authModal?.classList.add('open');authModal?.setAttribute('aria-hidden','false');switchAuth(type);document.body.style.overflow='hidden'}
function closeAuth(){authModal?.classList.remove('open');authModal?.setAttribute('aria-hidden','true');document.body.style.overflow=''}
function switchAuth(type){const login=type==='login';loginView?.classList.toggle('hidden',!login);signupView?.classList.toggle('hidden',login)}
$$('.auth-open').forEach(b=>b.addEventListener('click',()=>openAuth(b.dataset.auth)));
$$('[data-auth-close]').forEach(b=>b.addEventListener('click',closeAuth));
$$('[data-switch-auth]').forEach(b=>b.addEventListener('click',()=>switchAuth(b.dataset.switchAuth)));
$$('.password-toggle').forEach(b=>b.addEventListener('click',()=>{const i=b.parentElement.querySelector('input');i.type=i.type==='password'?'text':'password';b.textContent=i.type==='password'?'إظهار':'إخفاء'}));

document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeAuth();closeDashboard();closeCompose()}});

$('#loginForm')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const inputs=$$('#loginForm .input-wrap input');
  try{
    const r=await api('login',{identifier:inputs[0].value.trim(),password:inputs[1].value});
    closeAuth(); setSession(r.data.user); showToast(`مرحباً ${r.data.user.full_name} — ${roleLabel(r.data.user.role)}`); refreshUserUI();
  }catch(err){showToast(err.message)}
});

$('#signupForm')?.addEventListener('submit',async e=>{
  e.preventDefault(); const f=e.currentTarget;
  const inputs=$$('#signupForm .input-wrap input');
  const password=f.querySelector('[name="password"]').value, confirm=f.querySelector('[name="confirm"]').value;
  if(password!==confirm){showToast('كلمتا المرور غير متطابقتين.');return}
  try{
    await api('register',{full_name:inputs[0].value.trim(),phone:inputs[1].value.trim(),email:inputs[2].value.trim(),password});
    showToast('تم إنشاء الحساب كلاعب. يمكنك الآن تسجيل الدخول.');
    f.reset(); switchAuth('login');
  }catch(err){showToast(err.message)}
});

let currentUser=null;
function setSession(user){currentUser=user;sessionStorage.setItem('bg_user',JSON.stringify(user))}
function clearSession(){currentUser=null;sessionStorage.removeItem('bg_user')}
function storedUser(){try{return JSON.parse(sessionStorage.getItem('bg_user')||'null')}catch{return null}}

const dashboardModal=$('#dashboardModal'),dashboardGrid=$('#dashboardGrid'),dashboardContent=$('#dashboardContent');
function openDashboard(){if(!currentUser){openAuth('login');return}dashboardModal?.classList.add('open');dashboardModal?.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';fillDashboard();}
function closeDashboard(){dashboardModal?.classList.remove('open');dashboardModal?.setAttribute('aria-hidden','true');if(!$('#authModal')?.classList.contains('open')&&!$('#composeModal')?.classList.contains('open'))document.body.style.overflow=''}
$$('[data-dashboard-close]').forEach(b=>b.addEventListener('click',closeDashboard));

function fillDashboard(){
  $('#dashboardName').textContent=currentUser.full_name;
  $('#dashboardRole').textContent=roleLabel(currentUser.role);
  $('#dashboardAvatar').textContent=initials(currentUser.full_name);
  const cards=[
    ['account','حسابي','البيانات والصلاحيات'],
    ['tickets','الرسائل / Tickets','001 · 002 · 003...'],
  ];
  if(currentUser.role==='admin') cards.push(['posts','إضافة منشور','نشر خبر أو إعلان'],['users','إضافة Admin','إدارة الصلاحيات'],['stadium','إضافة ملعب','ربط الملعب بصاحبه']);
  if(currentUser.role==='stade_owner') cards.push(['posts','إضافة منشور','نشر خبر أو إعلان']);
  dashboardGrid.innerHTML=cards.map((c,i)=>`<button class="dash-card ${i===0?'active':''}" data-dash-tab="${c[0]}"><b>${c[1]}</b><span>${c[2]}</span></button>`).join('');
  $$('[data-dash-tab]').forEach(b=>b.addEventListener('click',()=>{$$('[data-dash-tab]').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderDashboardTab(b.dataset.dashTab)}));
  renderDashboardTab('account');
}

async function renderDashboardTab(tab){
  if(tab==='account'){
    dashboardContent.innerHTML=`<div class="dash-section"><h3>ملف الحساب</h3><p>كل الحسابات الجديدة تبدأ كلاعب، ويمكن للـAdmin تغيير الصلاحية.</p><table class="dash-table"><tr><th>الاسم</th><td>${esc(currentUser.full_name)}</td></tr><tr><th>الهاتف</th><td>${esc(currentUser.phone)}</td></tr><tr><th>البريد</th><td>${esc(currentUser.email||'—')}</td></tr><tr><th>الصلاحية</th><td>${roleLabel(currentUser.role)}</td></tr></table></div>`;
    return;
  }
  if(tab==='posts'){renderPostForm();return}
  if(tab==='users'){await renderUsers();return}
  if(tab==='stadium'){await renderStadiumForm();return}
  if(tab==='tickets'){await renderTickets();return}
}

function renderPostForm(){
  dashboardContent.innerHTML=`<div class="dash-section"><h3>إضافة منشور</h3><p>سيظهر المنشور في قسم أخبار النجوم على الموقع.</p><form id="postForm" class="dashboard-form"><label>العنوان<input id="postTitle" required maxlength="180" placeholder="عنوان المنشور"></label><label>التصنيف<input id="postCategory" maxlength="80" value="أخبار الملاعب"></label><label class="full">المحتوى<textarea id="postBody" required rows="6" maxlength="5000" placeholder="اكتب محتوى المنشور..."></textarea></label><label class="full">رابط صورة (اختياري)<input id="postImage" maxlength="500" placeholder="https://..."></label><button class="auth-submit" type="submit">نشر الآن →</button></form></div>`;
  $('#postForm').addEventListener('submit',async e=>{e.preventDefault();try{await api('add_post',{title:$('#postTitle').value,body:$('#postBody').value,category:$('#postCategory').value,image_url:$('#postImage').value});showToast('تم نشر المنشور.');e.currentTarget.reset();loadPublicPosts()}catch(err){showToast(err.message)}});
}

async function renderUsers(){
  dashboardContent.innerHTML='<div class="dash-section"><h3>الحسابات والصلاحيات</h3><p>من هنا يمكنك إعطاء أي لاعب صلاحية Admin أو Stade Owner أو إعادته إلى Player.</p><div id="usersBox">جارِ التحميل...</div></div>';
  try{
    const r=await api('users',null,'GET');
    $('#usersBox').innerHTML=`<div style="overflow:auto"><table class="dash-table"><thead><tr><th>#</th><th>الاسم</th><th>الهاتف</th><th>الدور</th><th>تعديل</th></tr></thead><tbody>${r.data.users.map(u=>`<tr><td>${u.id}</td><td>${esc(u.full_name)}</td><td>${esc(u.phone)}</td><td>${roleLabel(u.role)}</td><td><select class="role-select" data-role-id="${u.id}"><option value="player" ${u.role==='player'?'selected':''}>Player</option><option value="stade_owner" ${u.role==='stade_owner'?'selected':''}>Stade Owner</option><option value="admin" ${u.role==='admin'?'selected':''}>Admin</option></select></td></tr>`).join('')}</tbody></table></div>`;
    $$('.role-select').forEach(s=>s.addEventListener('change',async e=>{try{await api('set_role',{user_id:Number(e.target.dataset.roleId),role:e.target.value});showToast('تم تحديث الصلاحية.');if(Number(e.target.dataset.roleId)===currentUser.id){currentUser.role=e.target.value;setSession(currentUser);fillDashboard()}}catch(err){showToast(err.message)}}));
  }catch(err){$('#usersBox').innerHTML=`<div class="empty-state">${esc(err.message)}</div>`}
}

async function renderStadiumForm(){
  dashboardContent.innerHTML='<div class="dash-section"><h3>إضافة ملعب</h3><p>اختر حساب Stade Owner لربط الملعب به. اللاعبون سيستطيعون مراسلته عبر Ticket.</p><div id="stadiumFormBox">جارِ تحميل أصحاب الملاعب...</div></div>';
  try{
    const r=await api('users',null,'GET'); const owners=r.data.users.filter(u=>u.role==='stade_owner'&&u.status==='active');
    $('#stadiumFormBox').innerHTML=`${owners.length?`<form id="stadiumForm" class="dashboard-form"><label>صاحب الملعب<select id="stadiumOwner" required>${owners.map(o=>`<option value="${o.id}">${esc(o.full_name)} — ${esc(o.phone)}</option>`).join('')}</select></label><label>اسم الملعب<input id="stadiumName" required placeholder="Besbes Arena"></label><label>المدينة<input id="stadiumCity" required value="بسكرة"></label><label>العنوان<input id="stadiumAddress" required placeholder="حي النصر"></label><label>نوع الملعب<input id="stadiumFormat" value="5 ضد 5"></label><label>السعر / الساعة<input id="stadiumPrice" type="number" min="0" step="50" value="1500"></label><label class="full">رابط صورة الملعب<input id="stadiumImage" placeholder="https://..."></label><label class="full">الوصف<textarea id="stadiumDesc" rows="4" placeholder="معلومات عن الملعب..."></textarea></label><button class="auth-submit" type="submit">إضافة الملعب →</button></form>`:`<div class="empty-state">لا يوجد Stade Owner بعد. اذهب إلى «إضافة Admin» وغيّر حساب اللاعب إلى Stade Owner أولاً.</div>`}`;
    $('#stadiumForm')?.addEventListener('submit',async e=>{e.preventDefault();try{await api('add_stadium',{owner_id:Number($('#stadiumOwner').value),name:$('#stadiumName').value,city:$('#stadiumCity').value,address:$('#stadiumAddress').value,format:$('#stadiumFormat').value,price_per_hour:Number($('#stadiumPrice').value),image_url:$('#stadiumImage').value,description:$('#stadiumDesc').value});showToast('تمت إضافة الملعب.');e.currentTarget.reset();loadStadiums()}catch(err){showToast(err.message)}});
  }catch(err){$('#stadiumFormBox').innerHTML=`<div class="empty-state">${esc(err.message)}</div>`}
}

async function renderTickets(){
  dashboardContent.innerHTML='<div class="dash-section"><h3>الرسائل والتذاكر</h3><p>كل رسالة بين اللاعب وصاحب الملعب تحمل رقم Ticket متسلسل.</p><div id="ticketsBox">جارِ التحميل...</div></div>';
  try{
    const r=await api('tickets',null,'GET');
    const list=r.data.tickets;
    $('#ticketsBox').innerHTML=list.length?`<div class="ticket-list">${list.map(t=>`<article class="ticket-item"><div class="ticket-head"><span class="ticket-no">TICKET ${t.ticket_no}</span><span class="ticket-status ${t.status==='closed'?'closed':''}">${t.status==='open'?'مفتوحة':'مغلقة'}</span></div><h4>${esc(t.subject)} ${t.stadium_name?`· ${esc(t.stadium_name)}`:''}</h4><p>${esc(t.message)}</p><div class="ticket-meta">من: ${esc(t.sender_name)} · إلى: ${esc(t.recipient_name)} · ${new Date(t.created_at).toLocaleString('ar-DZ')}</div>${t.status==='open'&&currentUser.role!=='player'?`<div class="ticket-actions"><button class="mini-btn" data-close-ticket="${t.id}">إغلاق التذكرة</button></div>`:''}</article>`).join('')}</div>`:'<div class="empty-state">لا توجد رسائل حتى الآن.</div>';
    $$('[data-close-ticket]').forEach(b=>b.addEventListener('click',async()=>{try{await api('ticket_status',{ticket_id:Number(b.dataset.closeTicket),status:'closed'});renderTickets();showToast('تم إغلاق التذكرة.')}catch(err){showToast(err.message)}}));
  }catch(err){$('#ticketsBox').innerHTML=`<div class="empty-state">${esc(err.message)}</div>`}
}

$('#logoutBtn')?.addEventListener('click',async()=>{try{await api('logout');}catch{}clearSession();closeDashboard();refreshUserUI();showToast('تم تسجيل الخروج.')});

function refreshUserUI(){
  const actions=$('.nav-actions'); if(!actions)return;
  if(currentUser){actions.innerHTML=`<button class="login-link account-open" type="button">${esc(currentUser.full_name)}</button><button class="signup-btn account-open" type="button">${roleLabel(currentUser.role)}</button>`;$$('.account-open',actions).forEach(b=>b.addEventListener('click',openDashboard))}
  else actions.innerHTML='<button class="login-link auth-open" data-auth="login" type="button">تسجيل الدخول</button><button class="signup-btn auth-open" data-auth="signup" type="button">إنشاء حساب</button>';
  updateHeroStats();
}

async function updateHeroStats(){
  try{const r=await api('stats',null,'GET');const c=r.data;const mapping=[c.stadiums||0,c.posts||0,c.players||0];$$('[data-count]').forEach((el,i)=>{const target=Number(mapping[i]??0);el.dataset.count=target;el.textContent=target.toLocaleString('ar-DZ')})}catch{}
}

function esc(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

async function loadStadiums(){
  const grid=$('#stadiumsGrid');if(!grid)return;
  try{
    const r=await api('stadiums',null,'GET'); const stadiums=r.data.stadiums;
    if(!stadiums.length)return;
    grid.innerHTML=stadiums.map((s,i)=>{const img=s.image_url?`style="background-image:url('${esc(s.image_url)}')"`:'';return `<article class="field-card reveal"><div class="card-image" ${img}><span class="badge available">متاح</span><button class="heart" aria-label="إضافة للمفضلة">♡</button></div><div class="card-body"><div class="rating">★ 5.0</div><h3>${esc(s.name)}</h3><p>📍 ${esc(s.city)} · ${esc(s.address)} · ⚽ ${esc(s.format)}</p><div class="card-bottom"><strong>${Number(s.price_per_hour).toLocaleString('ar-DZ')} دج <small>/ الساعة</small></strong><div class="field-actions"><button onclick="showToast('ميزة الحجز قيد التجهيز')">احجز</button><button class="contact-owner" data-contact-stadium="${s.id}" data-contact-name="${esc(s.name)}">Message</button></div></div></div></article>`}).join('');
    $$('.heart').forEach(btn=>btn.addEventListener('click',()=>{btn.classList.toggle('liked');btn.textContent=btn.classList.contains('liked')?'♥':'♡'}));
    $$('[data-contact-stadium]').forEach(btn=>btn.addEventListener('click',()=>openCompose(Number(btn.dataset.contactStadium),btn.dataset.contactName)));
    $$('.reveal',grid).forEach(el=>observer.observe(el));
  }catch{}
}

async function loadPublicPosts(){
  const grid=$('#newsGrid');if(!grid)return;
  try{
    const r=await api('posts',null,'GET');const posts=r.data.posts;if(!posts.length)return;
    let wrap=$('#publicPosts');if(!wrap){wrap=document.createElement('div');wrap.id='publicPosts';wrap.className='public-posts';grid.after(wrap)}
    wrap.innerHTML=posts.map(p=>`<article class="post-card reveal"><div class="post-thumb" ${p.image_url?`style="background-image:url('${esc(p.image_url)}')"`:''}></div><div><small>${esc(p.category)} · ${new Date(p.created_at).toLocaleDateString('ar-DZ')}</small><h4>${esc(p.title)}</h4><p>${esc(p.body)}</p><small>بواسطة ${esc(p.author_name)}</small></div></article>`).join('');
    $$('.reveal',wrap).forEach(el=>observer.observe(el));
  }catch{}
}

const composeModal=$('#composeModal');
function openCompose(stadiumId,name){
  if(!currentUser){openAuth('login');showToast('سجّل الدخول أولاً لإرسال رسالة لصاحب الملعب.');return}
  if(currentUser.role!=='player'){showToast('التواصل مع أصحاب الملاعب من حساب اللاعب.');return}
  $('#ticketStadiumId').value=stadiumId;$('#composeStadiumName').textContent=name;$('#composeModal').classList.add('open');$('#composeModal').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
}
function closeCompose(){composeModal?.classList.remove('open');composeModal?.setAttribute('aria-hidden','true');if(!dashboardModal?.classList.contains('open')&&!authModal?.classList.contains('open'))document.body.style.overflow=''}
$$('[data-compose-close]').forEach(b=>b.addEventListener('click',closeCompose));
$('#ticketForm')?.addEventListener('submit',async e=>{e.preventDefault();try{const r=await api('create_ticket',{stadium_id:Number($('#ticketStadiumId').value),subject:$('#ticketSubject').value,message:$('#ticketMessage').value});showToast(`تم إرسال Ticket ${r.data.ticket_no}.`);e.currentTarget.reset();closeCompose()}catch(err){showToast(err.message)}});

// Search button now filters visible stadium cards by city instead of showing a fake success message.
$('.search-btn')?.addEventListener('click',async()=>{const city=$('.quick-search select')?.value?.trim();await loadStadiums();if(city){$$('#stadiumsGrid .field-card').forEach(card=>{const text=card.innerText||'';card.style.display=(city==='بسكرة'||text.includes(city))?'':'none'});document.querySelector('#fields')?.scrollIntoView({behavior:'smooth'})}});

// Initial state
(async()=>{
  try{const r=await api('me',null,'GET');if(r.data.user){setSession(r.data.user)}}catch{}
  refreshUserUI();
  updateHeroStats();
  loadStadiums();
  loadPublicPosts();
  $$('.heart').forEach(btn=>btn.addEventListener('click',()=>{btn.classList.toggle('liked');btn.textContent=btn.classList.contains('liked')?'♥':'♡'}));
  const sections=document.querySelectorAll('main section[id]'), links=document.querySelectorAll('.nav-links a');
  window.addEventListener('scroll',()=>{let current='home';sections.forEach(section=>{if(window.scrollY>=section.offsetTop-150)current=section.id});links.forEach(link=>link.classList.toggle('active',link.getAttribute('href')==='#'+current))});
})();
