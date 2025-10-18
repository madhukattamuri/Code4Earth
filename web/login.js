const qs = (s)=>document.querySelector(s);
const title = qs('#title');
const signinForm = qs('#signinForm');
const signupForm = qs('#signupForm');
const okMsg = qs('#okMsg');
const loginErr = qs('#loginErr');
const signupErr = qs('#signupErr');

qs('#goSignup').addEventListener('click',(e)=>{e.preventDefault(); title.textContent='Create account'; signinForm.style.display='none'; signupForm.style.display='block'; okMsg.style.display='none';});
qs('#goSignin').addEventListener('click',(e)=>{e.preventDefault(); title.textContent='Login'; signupForm.style.display='none'; signinForm.style.display='block'; okMsg.style.display='none';});

qs('#btnSignin').addEventListener('click', async ()=>{
  loginErr.textContent='';
  const email = qs('#loginEmail').value.trim();
  const password = qs('#loginPass').value;
  if(!email || !password){ loginErr.textContent='Please enter email & password.'; return; }
  const res = await fetch('/api/auth/login', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({email,password})
  });
  if(!res.ok){ loginErr.textContent='Invalid email or password.'; return; }
  const json = await res.json();
  localStorage.setItem('token', json.access_token);
  okMsg.textContent = 'Logged in ✔ Redirecting…';
  okMsg.style.display='block';
  setTimeout(()=>{ window.location.href='/' }, 600);
});

qs('#btnSignup').addEventListener('click', async ()=>{
  signupErr.textContent='';
  const full_name = qs('#signupName').value.trim() || null;
  const email = qs('#signupEmail').value.trim();
  const password = qs('#signupPass').value;
  if(!email || !password){ signupErr.textContent='Please fill email & password.'; return; }
  const res = await fetch('/api/auth/signup', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({email,password,full_name})
  });
  if(!res.ok){
    const t = await res.text();
    signupErr.textContent = t && t.includes('registered') ? 'Email already registered.' : 'Signup failed.';
    return;
  }
  const json = await res.json();
  localStorage.setItem('token', json.access_token);
  okMsg.textContent = 'Account created ✔ Redirecting…';
  okMsg.style.display='block';
  setTimeout(()=>{ window.location.href='/' }, 600);
});
