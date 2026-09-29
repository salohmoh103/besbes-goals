const loader = document.getElementById("pageLoader");
window.addEventListener("load", () => setTimeout(() => loader.classList.add("hide"), 500));

const navbar = document.getElementById("navbar");
window.addEventListener("scroll", () => {
  navbar.classList.toggle("scrolled", window.scrollY > 40);
});

const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");
menuBtn.addEventListener("click", () => navLinks.classList.toggle("open"));
document.querySelectorAll(".nav-links a").forEach(link => {
  link.addEventListener("click", () => navLinks.classList.remove("open"));
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, {threshold: .12});
document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

const counters = document.querySelectorAll("[data-count]");
const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = Number(el.dataset.count);
    let start = 0;
    const duration = 1000;
    const startTime = performance.now();
    function update(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(start + (target - start) * eased).toLocaleString("ar-DZ");
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
    counterObserver.unobserve(el);
  });
}, {threshold: .7});
counters.forEach(c => counterObserver.observe(c));

document.querySelectorAll(".heart").forEach(btn => {
  btn.addEventListener("click", () => {
    btn.classList.toggle("liked");
    btn.textContent = btn.classList.contains("liked") ? "♥" : "♡";
  });
});

let toastTimer;
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

const sections = document.querySelectorAll("main section[id]");
const links = document.querySelectorAll(".nav-links a");
window.addEventListener("scroll", () => {
  let current = "home";
  sections.forEach(section => {
    if (window.scrollY >= section.offsetTop - 150) current = section.id;
  });
  links.forEach(link => link.classList.toggle("active", link.getAttribute("href") === "#" + current));
});

const authModal=document.getElementById("authModal"),loginView=document.getElementById("loginView"),signupView=document.getElementById("signupView");function openAuth(type){authModal.classList.add("open");authModal.setAttribute("aria-hidden","false");switchAuth(type);document.body.style.overflow="hidden"}function closeAuth(){authModal.classList.remove("open");authModal.setAttribute("aria-hidden","true");document.body.style.overflow=""}function switchAuth(type){const login=type==="login";loginView.classList.toggle("hidden",!login);signupView.classList.toggle("hidden",login)}document.querySelectorAll(".auth-open").forEach(b=>b.addEventListener("click",()=>openAuth(b.dataset.auth)));document.querySelectorAll("[data-auth-close]").forEach(b=>b.addEventListener("click",closeAuth));document.querySelectorAll("[data-switch-auth]").forEach(b=>b.addEventListener("click",()=>switchAuth(b.dataset.switchAuth)));document.addEventListener("keydown",e=>{if(e.key==="Escape")closeAuth()});document.querySelectorAll(".password-toggle").forEach(b=>b.addEventListener("click",()=>{const i=b.parentElement.querySelector("input");i.type=i.type==="password"?"text":"password";b.textContent=i.type==="password"?"إظهار":"إخفاء"}));document.getElementById("loginForm").addEventListener("submit",e=>{e.preventDefault();showToast("واجهة الدخول جاهزة للربط بقاعدة البيانات.")});document.getElementById("signupForm").addEventListener("submit",e=>{e.preventDefault();const f=e.currentTarget;if(f.querySelector('[name="password"]').value!==f.querySelector('[name="confirm"]').value){showToast("كلمتا المرور غير متطابقتين.");return}showToast("واجهة إنشاء الحساب جاهزة للربط بالـBackend.")});
