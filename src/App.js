import { useState, useEffect, useCallback } from "react";

// ======================================================
// LOCAL STORAGE
// ======================================================
const LS = {
  get: (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } },
  set: (k, v)  => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del: (k)     => { try { localStorage.removeItem(k); } catch {} },
};

function hashPass(p) {
  const key = 83;
  const b = p.split("").map(c => c.charCodeAt(0) ^ key);
  return btoa(String.fromCharCode(...b));
}
function checkPass(plain, hashed) { return hashPass(plain) === hashed; }

// ======================================================
// DATABASE
// ======================================================
const DB = {
  adminName:    LS.get("bs_name",   ""),
  adminPhone:   LS.get("bs_phone",  ""),
  pwHash:       LS.get("bs_pw",     ""),
  secQ1ans:     LS.get("bs_sq1",    ""),
  secQ2ans:     LS.get("bs_sq2",    ""),
  bills:        LS.get("bs_bills",  []),
  logins:       LS.get("bs_logs",   []),
  ctr:          LS.get("bs_ctr",    0),
  deleteAt:     LS.get("bs_delat",  null), // timestamp for scheduled delete
};

function persist() {
  LS.set("bs_name",  DB.adminName);
  LS.set("bs_phone", DB.adminPhone);
  LS.set("bs_pw",    DB.pwHash);
  LS.set("bs_sq1",   DB.secQ1ans);
  LS.set("bs_sq2",   DB.secQ2ans);
  LS.set("bs_bills", DB.bills);
  LS.set("bs_logs",  DB.logins);
  LS.set("bs_ctr",   DB.ctr);
  LS.set("bs_delat", DB.deleteAt);
}

function wipeAccount() {
  ["bs_name","bs_phone","bs_pw","bs_sq1","bs_sq2","bs_bills","bs_logs","bs_ctr","bs_delat"].forEach(k => LS.del(k));
  DB.adminName=""; DB.adminPhone=""; DB.pwHash=""; DB.secQ1ans=""; DB.secQ2ans="";
  DB.bills=[]; DB.logins=[]; DB.ctr=0; DB.deleteAt=null;
}

function nextBill() {
  DB.ctr++;
  persist();
  return "BILL" + String(DB.ctr).padStart(3, "0");
}

function now() {
  return new Date().toLocaleString("en-IN", { hour12: false });
}

const V = {
  phone:    v => /^[0-9]{10}$/.test(String(v).trim()),
  name:     v => /^[a-zA-Z\s]+$/.test(String(v).trim()) && String(v).trim().length > 0,
  qty:      v => Number.isInteger(Number(v)) && Number(v) > 0,
  price:    v => !isNaN(parseFloat(v)) && parseFloat(v) > 0,
  discount: v => !isNaN(parseFloat(v)) && parseFloat(v) >= 0 && parseFloat(v) <= 100,
};

// ======================================================
// THEME
// ======================================================
const F = "'Courier New',Courier,monospace";
const T = {
  bg:"#0a0e0f", surface:"#111618", card:"#161c1e", border:"#1e2c2f",
  accent:"#00e5c0", adim:"#007a66", danger:"#ff4d6d", warn:"#f4a832",
  text:"#d4eae7", muted:"#4a6b68", white:"#f0fafa",
};
const CS = { background:"linear-gradient(135deg,#161c1e,#0f1a1c)", border:"1px solid #1e2c2f", borderRadius:"4px" };

// ======================================================
// UI COMPONENTS
// ======================================================
function Btn({ label, onClick, variant, full, small, style }) {
  const [h, setH] = useState(false);
  const vs = {
    primary:{ bg:T.accent,  hbg:"#00ffd5", col:"#000", bdr:"none" },
    danger: { bg:T.danger,  hbg:"#ff6b85", col:"#fff", bdr:"none" },
    ghost:  { bg:"transparent", hbg:T.adim, col:T.accent, bdr:"1px solid "+T.accent },
    warn:   { bg:T.warn,    hbg:"#f7be5e", col:"#000", bdr:"none" },
    info:   { bg:"#1a3a5c", hbg:"#1e4a7a", col:"#7eb8ff", bdr:"1px solid #7eb8ff" },
  };
  const s = vs[variant||"primary"];
  return (
    <button onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{ fontFamily:F, fontSize:small?"11px":"12px", fontWeight:"700", letterSpacing:"0.08em",
        padding:small?"4px 10px":"9px 18px", background:h?s.hbg:s.bg, color:s.col, border:s.bdr,
        borderRadius:"2px", cursor:"pointer", textTransform:"uppercase", transition:"all 0.15s",
        width:full?"100%":undefined, marginTop:full?"6px":undefined, ...style }}>
      {label}
    </button>
  );
}

function TIn({ label, value, onChange, type, placeholder, error }) {
  return (
    <div style={{ marginBottom:"12px" }}>
      {label && <div style={{ color:error?T.danger:T.muted, fontSize:"11px", letterSpacing:"0.1em", marginBottom:"4px", fontFamily:F, textTransform:"uppercase" }}>{label}</div>}
      <input type={type||"text"} value={value} placeholder={placeholder||""} onChange={e=>onChange(e.target.value)}
        style={{ width:"100%", boxSizing:"border-box", background:T.bg, border:"1px solid "+(error?T.danger:T.border),
          borderRadius:"2px", color:T.white, fontFamily:F, fontSize:"13px", padding:"8px 12px", outline:"none" }}
        onFocus={e=>{e.target.style.borderColor=error?T.danger:T.accent;}}
        onBlur={e=>{e.target.style.borderColor=error?T.danger:T.border;}} />
      {error && <div style={{ color:T.danger, fontSize:"11px", marginTop:"3px", fontFamily:F }}>{error}</div>}
    </div>
  );
}

function Msg({ type, text }) {
  if (!text) return null;
  const col = { success:T.accent, error:T.danger, warn:T.warn, info:"#7eb8ff" }[type]||T.text;
  return (
    <div style={{ fontFamily:F, fontSize:"12px", color:col, background:col+"18", border:"1px solid "+col,
      padding:"8px 12px", borderRadius:"2px", marginBottom:"12px" }}>
      [{(type||"info").toUpperCase()}] {text}
    </div>
  );
}

function PT({ title, sub }) {
  return (
    <div style={{ borderBottom:"1px solid "+T.border, paddingBottom:"12px", marginBottom:"24px" }}>
      <div style={{ color:T.muted, fontSize:"10px", letterSpacing:"0.2em", fontFamily:F }}>// {sub}</div>
      <div style={{ color:T.accent, fontSize:"20px", fontFamily:F, fontWeight:"700", marginTop:"2px" }}>{title}</div>
    </div>
  );
}

function BTag({ text }) {
  return <span style={{ fontFamily:F, fontSize:"10px", letterSpacing:"0.1em", textTransform:"uppercase",
    padding:"2px 8px", background:T.accent+"22", color:T.accent, border:"1px solid "+T.accent, borderRadius:"2px" }}>{text}</span>;
}

function RowLine({ l, c, v }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", color:c||T.muted, fontSize:"12px", marginBottom:"3px" }}>
      <span>{l}</span><span>{v}</span>
    </div>
  );
}

// ======================================================
// PRINT INVOICE
// ======================================================
function printInvoice(bill) {
  const items = bill.items.map(it => {
    const discTxt = it.discount > 0 ? ` (-${it.discount}%)` : "";
    return `<tr>
      <td>${it.name}</td>
      <td align="center">${it.qty}</td>
      <td align="right">&#8377;${Number(it.price).toFixed(2)}</td>
      <td align="center">${it.discount > 0 ? it.discount+"%" : "—"}</td>
      <td align="right">&#8377;${Number(it.total).toFixed(2)}${discTxt}</td>
    </tr>`;
  }).join("");

  const w = window.open("","_blank");
  if (!w) { alert("Allow popups to print!"); return; }
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${bill.billNumber}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Courier New',monospace;padding:30px;max-width:700px;margin:auto;color:#111}
.hdr{text-align:center;border-bottom:2px solid #111;padding-bottom:14px;margin-bottom:18px}
.hdr h1{font-size:26px;letter-spacing:4px}
.hdr p{font-size:12px;color:#555;margin-top:4px}
.meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:18px;font-size:13px}
.meta div{padding:6px;background:#f5f5f5;border-radius:2px}
.meta span{color:#555;font-size:11px;display:block}
table{width:100%;border-collapse:collapse;margin-bottom:14px;font-size:13px}
th{background:#111;color:#fff;padding:8px 12px;text-align:left;font-size:11px;letter-spacing:.08em}
td{padding:8px 12px;border-bottom:1px solid #e0e0e0}
.tot{margin-left:auto;width:280px}
.grand td{font-weight:700;font-size:15px;border-top:2px solid #111}
.foot{text-align:center;margin-top:24px;font-size:11px;color:#888;border-top:1px solid #ddd;padding-top:12px}
@media print{button{display:none}}
</style></head><body>
<div class="hdr">
  <h1>BILLING_SYS</h1>
  <p>Tax Invoice &nbsp;|&nbsp; Developed by Satyam Kumar Singh</p>
</div>
<div class="meta">
  <div><span>Bill Number</span>${bill.billNumber}</div>
  <div><span>Date &amp; Time</span>${bill.dateTime}</div>
  <div><span>Customer Name</span>${bill.customerName}</div>
  <div><span>Phone Number</span>${bill.phone}</div>
</div>
<table>
  <thead><tr>
    <th>Item Name</th><th>Qty</th><th align="right">MRP</th><th align="center">Disc%</th><th align="right">Total</th>
  </tr></thead>
  <tbody>${items}</tbody>
</table>
<table class="tot">
  <tr><td>Base Price (excl. GST)</td><td align="right">&#8377;${Number(bill.subtotal).toFixed(2)}</td></tr>
  <tr><td>GST 18% (included)</td><td align="right">&#8377;${Number(bill.gst).toFixed(2)}</td></tr>
  <tr class="grand"><td>GRAND TOTAL</td><td align="right">&#8377;${Number(bill.grandTotal).toFixed(2)}</td></tr>
</table>
<div class="foot">
  <p>Thank you for your business!</p>
  <p style="margin-top:6px">This is a computer-generated invoice. GST is included in MRP.</p>
</div>
<script>window.onload=()=>window.print();</script>
</body></html>`);
  w.document.close();
}

// ======================================================
// WELCOME / LANDING SCREEN
// ======================================================
function WelcomeScreen({ onSignUp, onSignIn }) {
  const [hov1, setHov1] = useState(false);
  const [hov2, setHov2] = useState(false);

  return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:F, padding:"20px", boxSizing:"border-box", position:"relative", overflow:"hidden" }}>

      {/* Animated grid bg */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", opacity:0.2,
        backgroundImage:"linear-gradient(#1e2c2f 1px,transparent 1px),linear-gradient(90deg,#1e2c2f 1px,transparent 1px)",
        backgroundSize:"40px 40px" }} />

      {/* Glow effect */}
      <div style={{ position:"fixed", top:"30%", left:"50%", transform:"translateX(-50%)", width:"600px", height:"300px",
        background:"radial-gradient(ellipse,rgba(0,229,192,0.06) 0%,transparent 70%)", pointerEvents:"none" }} />

      <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:"480px", textAlign:"center" }}>

        {/* Badge */}
        <div style={{ display:"inline-block", background:T.accent+"18", border:"1px solid "+T.accent+"44",
          borderRadius:"20px", padding:"4px 16px", marginBottom:"24px" }}>
          <span style={{ color:T.accent, fontSize:"11px", letterSpacing:"0.2em" }}>// PROFESSIONAL BILLING SOLUTION</span>
        </div>

        {/* Logo */}
        <div style={{ marginBottom:"8px" }}>
          <span style={{ color:T.white, fontSize:"42px", fontWeight:"700", letterSpacing:"0.05em" }}>BILLING</span>
          <span style={{ color:T.accent, fontSize:"42px", fontWeight:"700" }}>_SYS</span>
        </div>
        <div style={{ color:T.muted, fontSize:"13px", letterSpacing:"0.05em", marginBottom:"8px" }}>
          Smart Billing &amp; Invoice Management
        </div>

        {/* Developer credit */}
        <div style={{ color:T.accent+"99", fontSize:"11px", letterSpacing:"0.1em", marginBottom:"40px" }}>
          Designed &amp; Developed by <span style={{ color:T.accent, fontWeight:"700" }}>Satyam Kumar Singh</span>
        </div>

        {/* Feature highlights */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px", marginBottom:"40px" }}>
          {[
            { icon:"🧾", label:"Smart Billing" },
            { icon:"📊", label:"GST Reports" },
            { icon:"🖨️", label:"PDF Invoice" },
          ].map(f => (
            <div key={f.label} style={{ ...CS, padding:"12px 8px" }}>
              <div style={{ fontSize:"20px", marginBottom:"4px" }}>{f.icon}</div>
              <div style={{ color:T.muted, fontSize:"10px", letterSpacing:"0.1em", textTransform:"uppercase" }}>{f.label}</div>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
          <button
            onClick={onSignUp}
            onMouseEnter={()=>setHov1(true)} onMouseLeave={()=>setHov1(false)}
            style={{ width:"100%", padding:"14px", background:hov1?"#00ffd5":T.accent,
              color:"#000", border:"none", borderRadius:"3px", cursor:"pointer",
              fontFamily:F, fontSize:"13px", fontWeight:"700", letterSpacing:"0.1em",
              textTransform:"uppercase", transition:"all 0.2s" }}>
            🚀 Create New Account
          </button>
          <button
            onClick={onSignIn}
            onMouseEnter={()=>setHov2(true)} onMouseLeave={()=>setHov2(false)}
            style={{ width:"100%", padding:"14px", background:"transparent",
              color:hov2?T.white:T.accent, border:"1px solid "+T.accent,
              borderRadius:"3px", cursor:"pointer",
              fontFamily:F, fontSize:"13px", fontWeight:"700", letterSpacing:"0.1em",
              textTransform:"uppercase", transition:"all 0.2s" }}>
            🔐 Sign In to Account
          </button>
        </div>

        {/* Footer note */}
        <div style={{ marginTop:"32px", color:T.muted, fontSize:"11px" }}>
          v2.0 &nbsp;•&nbsp; GST Inclusive &nbsp;•&nbsp; Local Storage &nbsp;•&nbsp; PDF Export
        </div>
      </div>
    </div>
  );
}

// ======================================================
// SIGN UP SCREEN
// ======================================================
function SignUpScreen({ onBack, onDone }) {
  const [msg, setMsg] = useState(null);
  const [rN,  setRN]  = useState("");
  const [rP,  setRP]  = useState("");
  const [rPw, setRPw] = useState("");
  const [rC,  setRC]  = useState("");
  const [sq1, setSq1] = useState("");
  const [sq2, setSq2] = useState("");
  const [rE,  setRE]  = useState({});

  function doSignUp() {
    const e = {};
    if (!V.name(rN))           e.n   = "Only alphabets and spaces!";
    if (!V.phone(rP))          e.p   = "Exactly 10 digits required!";
    if (rPw.trim().length < 4) e.pw  = "Minimum 4 characters!";
    if (rPw.trim() !== rC.trim()) e.c = "Passwords do not match!";
    if (!sq1.trim())           e.sq1 = "Answer is required!";
    if (!sq2.trim())           e.sq2 = "Answer is required!";
    if (Object.keys(e).length) { setRE(e); return; }

    DB.adminName  = rN.trim();
    DB.adminPhone = rP.trim();
    DB.pwHash     = hashPass(rPw.trim());
    DB.secQ1ans   = sq1.trim().toLowerCase();
    DB.secQ2ans   = sq2.trim().toLowerCase();
    DB.deleteAt   = null;
    persist();
    setMsg({ type:"success", text:"Account created! Redirecting to login..." });
    setTimeout(() => onDone(), 1400);
  }

  return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:F, padding:"20px", boxSizing:"border-box" }}>
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", opacity:0.2,
        backgroundImage:"linear-gradient(#1e2c2f 1px,transparent 1px),linear-gradient(90deg,#1e2c2f 1px,transparent 1px)", backgroundSize:"40px 40px" }} />

      <div style={{ width:"100%", maxWidth:"440px", position:"relative", zIndex:1 }}>
        <div style={{ textAlign:"center", marginBottom:"24px" }}>
          <div style={{ color:T.accent, fontSize:"11px", letterSpacing:"0.3em" }}>// CREATE ACCOUNT</div>
          <div style={{ color:T.white, fontSize:"26px", fontWeight:"700", marginTop:"4px" }}>Sign Up</div>
          <div style={{ color:T.muted, fontSize:"11px", marginTop:"4px" }}>BILLING_SYS — by Satyam Kumar Singh</div>
        </div>

        <div style={{ ...CS, padding:"28px" }}>
          <Msg type={msg?.type} text={msg?.text} />

          {/* Account info */}
          <div style={{ color:T.accent, fontSize:"10px", letterSpacing:"0.15em", marginBottom:"12px" }}>ACCOUNT DETAILS</div>
          <TIn label="Full Name" value={rN} onChange={v=>{setRN(v);setRE(e=>({...e,n:""}));}} placeholder="Alphabets only" error={rE.n} />
          <TIn label="Phone Number (10 digits)" value={rP} onChange={v=>{setRP(v);setRE(e=>({...e,p:""}));}} placeholder="e.g. 9876543210" error={rE.p} />
          <TIn label="Password (min 4 chars)" value={rPw} onChange={v=>{setRPw(v);setRE(e=>({...e,pw:""}));}} type="password" placeholder="Enter password" error={rE.pw} />
          <TIn label="Confirm Password" value={rC} onChange={v=>{setRC(v);setRE(e=>({...e,c:""}));}} type="password" placeholder="Re-enter password" error={rE.c} />

          {/* Security questions */}
          <div style={{ borderTop:"1px solid "+T.border, marginTop:"8px", paddingTop:"16px" }}>
            <div style={{ color:T.accent, fontSize:"10px", letterSpacing:"0.15em", marginBottom:"12px" }}>SECURITY QUESTIONS (for password recovery)</div>
            <TIn label="What is your favorite pet's name?" value={sq1} onChange={v=>{setSq1(v);setRE(e=>({...e,sq1:""}));}} placeholder="Your answer" error={rE.sq1} />
            <TIn label="What is your mother's maiden name?" value={sq2} onChange={v=>{setSq2(v);setRE(e=>({...e,sq2:""}));}} placeholder="Your answer" error={rE.sq2} />
          </div>

          <Btn label="🚀 Create Account" onClick={doSignUp} full />
          <div style={{ textAlign:"center", marginTop:"14px" }}>
            <span onClick={onBack} style={{ color:T.accent, fontSize:"12px", cursor:"pointer", fontFamily:F }}>
              ← Back to Welcome
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ======================================================
// SIGN IN SCREEN
// ======================================================
function SignInScreen({ onBack, onLogin }) {
  const [msg,    setMsg]    = useState(null);
  const [phase,  setPhase]  = useState("login"); // login | forgot_q | forgot_r
  const [lP,     setLP]     = useState("");
  const [lPw,    setLPw]    = useState("");
  const [fails,  setFails]  = useState(0);
  const [locked, setLocked] = useState(false);
  const [secs,   setSecs]   = useState(0);
  const [fA1,    setFA1]    = useState("");
  const [fA2,    setFA2]    = useState("");
  const [fNew,   setFNew]   = useState("");

  useEffect(() => {
    if (!locked || secs <= 0) { if (locked && secs===0) { setLocked(false); setMsg(null); } return; }
    const t = setTimeout(() => setSecs(s => s-1), 1000);
    return () => clearTimeout(t);
  }, [locked, secs]);

  // Check if scheduled delete has expired (no login within 24h)
  useEffect(() => {
    if (DB.deleteAt && Date.now() > DB.deleteAt) {
      wipeAccount();
      setMsg({ type:"warn", text:"Account was deleted (24h timer expired). Please sign up." });
    }
  }, []);

  function doLogin() {
    if (!V.phone(lP)) return setMsg({ type:"error", text:"Phone must be exactly 10 digits!" });
    if (lP.trim() !== DB.adminPhone) return setMsg({ type:"error", text:"Phone number not found!" });
    if (checkPass(lPw.trim(), DB.pwHash)) {
      // Cancel delete timer if user logs in
      if (DB.deleteAt) {
        DB.deleteAt = null;
        persist();
      }
      setMsg(null);
      DB.logins.push({ name:DB.adminName, phone:lP.trim(), time:now() });
      persist();
      onLogin({ name:DB.adminName, phone:lP.trim() });
    } else {
      const f = fails+1; setFails(f); setLPw("");
      if (f%3===0) { setLocked(true); setSecs(120); setMsg({ type:"error", text:"Too many attempts! Locked 2 minutes." }); }
      else setMsg({ type:"error", text:"Wrong password! "+(3-(f%3))+" attempt(s) left." });
    }
  }

  function doForgotVerify() {
    if (!DB.secQ1ans || !DB.secQ2ans) return setMsg({ type:"error", text:"Security questions not set up!" });
    const ok1 = fA1.trim().toLowerCase() === DB.secQ1ans;
    const ok2 = fA2.trim().toLowerCase() === DB.secQ2ans;
    if (ok1 && ok2) { setPhase("forgot_r"); setMsg(null); }
    else setMsg({ type:"error", text:"Incorrect answers! Please try again." });
  }

  function doForgotReset() {
    if (fNew.trim().length < 4) return setMsg({ type:"error", text:"Password must be at least 4 characters!" });
    DB.pwHash = hashPass(fNew.trim());
    persist();
    setMsg({ type:"success", text:"Password reset! Please login." });
    setTimeout(() => { setPhase("login"); setFA1(""); setFA2(""); setFNew(""); setMsg(null); }, 1400);
  }

  const noAccount = DB.pwHash === "";

  return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:F, padding:"20px", boxSizing:"border-box" }}>
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", opacity:0.2,
        backgroundImage:"linear-gradient(#1e2c2f 1px,transparent 1px),linear-gradient(90deg,#1e2c2f 1px,transparent 1px)", backgroundSize:"40px 40px" }} />

      <div style={{ width:"100%", maxWidth:"400px", position:"relative", zIndex:1 }}>
        <div style={{ textAlign:"center", marginBottom:"24px" }}>
          <div style={{ color:T.accent, fontSize:"11px", letterSpacing:"0.3em" }}>{phase==="login" ? "// SIGN IN" : "// PASSWORD RECOVERY"}</div>
          <div style={{ color:T.white, fontSize:"26px", fontWeight:"700", marginTop:"4px" }}>
            {phase==="login" ? "Sign In" : "Forgot Password"}
          </div>
          <div style={{ color:T.muted, fontSize:"11px", marginTop:"4px" }}>BILLING_SYS — by Satyam Kumar Singh</div>
        </div>

        <div style={{ ...CS, padding:"28px" }}>
          <Msg type={msg?.type} text={msg?.text} />

          {noAccount && phase==="login" && (
            <div style={{ background:T.warn+"18", border:"1px solid "+T.warn, borderRadius:"2px", padding:"10px 14px", marginBottom:"16px" }}>
              <div style={{ color:T.warn, fontSize:"12px" }}>No account found. Please sign up first.</div>
            </div>
          )}

          {/* LOGIN */}
          {phase==="login" && !noAccount && (
            <>
              {locked ? (
                <div style={{ textAlign:"center", padding:"20px 0" }}>
                  <div style={{ fontSize:"40px" }}>🔒</div>
                  <div style={{ color:T.danger, fontSize:"13px", marginTop:"10px" }}>SYSTEM LOCKED</div>
                  <div style={{ color:T.warn, fontSize:"30px", fontWeight:"700", marginTop:"8px" }}>
                    {String(Math.floor(secs/60)).padStart(2,"0")}:{String(secs%60).padStart(2,"0")}
                  </div>
                </div>
              ) : (
                <>
                  <TIn label="Phone Number" value={lP} onChange={setLP} placeholder="Your registered phone" />
                  <TIn label="Password" value={lPw} onChange={setLPw} type="password" placeholder="Your password" />
                  <div style={{ color:T.muted, fontSize:"11px", marginBottom:"12px" }}>
                    Attempts left: <span style={{ color:fails%3>0?T.warn:T.accent }}>{3-(fails%3)}/3</span>
                  </div>
                  <Btn label="🔐 Sign In" onClick={doLogin} full />
                  <div style={{ textAlign:"center", marginTop:"16px", paddingTop:"14px", borderTop:"1px solid "+T.border }}>
                    <span onClick={()=>{setPhase("forgot_q");setMsg(null);}}
                      style={{ color:T.accent, fontSize:"12px", cursor:"pointer", fontFamily:F }}>
                      🔑 Forgot Password?
                    </span>
                  </div>
                </>
              )}
            </>
          )}

          {/* FORGOT - Questions */}
          {phase==="forgot_q" && (
            <>
              <div style={{ color:T.muted, fontSize:"12px", marginBottom:"16px" }}>Answer your security questions:</div>
              <TIn label="What is your favorite pet's name?" value={fA1} onChange={setFA1} placeholder="Your answer" />
              <TIn label="What is your mother's maiden name?" value={fA2} onChange={setFA2} placeholder="Your answer" />
              <div style={{ display:"flex", gap:"10px" }}>
                <Btn label="Verify" onClick={doForgotVerify} />
                <Btn label="← Back" variant="ghost" onClick={()=>{setPhase("login");setMsg(null);}} />
              </div>
            </>
          )}

          {/* FORGOT - Reset */}
          {phase==="forgot_r" && (
            <>
              <div style={{ background:T.accent+"15", border:"1px solid "+T.accent+"44", borderRadius:"2px", padding:"10px 14px", marginBottom:"16px" }}>
                <div style={{ color:T.accent, fontSize:"12px" }}>✓ Identity verified! Set your new password.</div>
              </div>
              <TIn label="New Password (min 4 chars)" value={fNew} onChange={setFNew} type="password" placeholder="Enter new password" />
              <Btn label="Reset Password" onClick={doForgotReset} full />
            </>
          )}

          <div style={{ textAlign:"center", marginTop:"14px" }}>
            <span onClick={onBack} style={{ color:T.muted, fontSize:"11px", cursor:"pointer", fontFamily:F }}>
              ← Back to Welcome
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ======================================================
// APP SHELL
// ======================================================
function App() {
  const hasAccount = DB.pwHash !== "";
  const [screen,   setScreen]   = useState("welcome"); // welcome | signup | signin
  const [loggedIn, setLoggedIn] = useState(false);
  const [operator, setOperator] = useState(null);
  const [page,     setPage]     = useState("dashboard");
  const [notif,    setNotif]    = useState(null);
  const [sideOpen, setSideOpen] = useState(window.innerWidth >= 768);
  const [mob,      setMob]      = useState(window.innerWidth < 768);

  useEffect(() => {
    const fn = () => {
      const m = window.innerWidth < 768;
      setMob(m);
      setSideOpen(!m);
    };
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  const notify = useCallback((type, text) => {
    setNotif({type,text});
    setTimeout(() => setNotif(null), 3500);
  }, []);

  function handleLogin(op) {
    setOperator(op);
    setLoggedIn(true);
  }

  function handleLogout() {
    setLoggedIn(false);
    setOperator(null);
    setPage("dashboard");
    setScreen("welcome");
  }

  function handleAccountDeleted() {
    wipeAccount();
    handleLogout();
  }

  if (!loggedIn) {
    if (screen==="welcome") return <WelcomeScreen onSignUp={()=>setScreen("signup")} onSignIn={()=>setScreen("signin")} />;
    if (screen==="signup")  return <SignUpScreen onBack={()=>setScreen("welcome")} onDone={()=>setScreen("signin")} />;
    if (screen==="signin")  return <SignInScreen onBack={()=>setScreen("welcome")} onLogin={handleLogin} />;
  }

  const nav = [
    {id:"dashboard",     icon:"▦", label:"Dashboard"},
    {id:"new-bill",      icon:"✚", label:"New Bill"},
    {id:"bills",         icon:"≡", label:"Bills"},
    {id:"products",      icon:"◈", label:"Products"},
    {id:"login-history", icon:"⊙", label:"Login Log"},
    {id:"password",      icon:"⚿", label:"Settings"},
  ];

  return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", fontFamily:F }}>
      {mob && sideOpen && (
        <div onClick={()=>setSideOpen(false)} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:10 }} />
      )}

      {/* Sidebar */}
      <div style={{ width:"220px", flexShrink:0, background:T.surface, borderRight:"1px solid "+T.border,
        display:"flex", flexDirection:"column",
        position:mob?"fixed":"relative", top:0, left:0, height:mob?"100vh":undefined, zIndex:mob?20:1,
        transform:mob&&!sideOpen?"translateX(-100%)":"translateX(0)", transition:"transform 0.25s ease" }}>
        <div style={{ padding:"20px", borderBottom:"1px solid "+T.border, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ color:T.accent, fontSize:"15px", fontWeight:"700" }}>BILLING_SYS</div>
            <div style={{ color:T.muted, fontSize:"10px", marginTop:"2px" }}>v2.0</div>
          </div>
          {mob && <button onClick={()=>setSideOpen(false)} style={{ background:"none",border:"none",color:T.muted,fontSize:"18px",cursor:"pointer" }}>✕</button>}
        </div>
        <div style={{ flex:1, padding:"12px 0", overflowY:"auto" }}>
          {nav.map(n => (
            <div key={n.id} onClick={()=>{setPage(n.id);if(mob)setSideOpen(false);}} style={{
              padding:"10px 20px", cursor:"pointer", display:"flex", alignItems:"center", gap:"10px",
              background:page===n.id?T.accent+"15":"transparent",
              borderLeft:"2px solid "+(page===n.id?T.accent:"transparent"),
              color:page===n.id?T.accent:T.muted,
              fontSize:"12px", letterSpacing:"0.05em", transition:"all 0.15s" }}>
              <span style={{ fontSize:"14px" }}>{n.icon}</span>{n.label}
            </div>
          ))}
        </div>
        <div style={{ padding:"16px 20px", borderTop:"1px solid "+T.border }}>
          <div style={{ color:T.muted, fontSize:"10px" }}>OPERATOR</div>
          <div style={{ color:T.text, fontSize:"12px", marginTop:"2px" }}>{operator?.name}</div>
          <div style={{ color:T.muted, fontSize:"10px", marginTop:"2px" }}>{operator?.phone}</div>
          <div style={{ marginTop:"10px" }}>
            <Btn label="Logout" variant="ghost" small onClick={handleLogout} />
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex:1, overflow:"auto", padding:mob?"16px":"28px", minWidth:0 }}>
        {mob && (
          <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"20px" }}>
            <button onClick={()=>setSideOpen(true)} style={{ background:"none",border:"1px solid "+T.border,color:T.accent,borderRadius:"2px",padding:"6px 10px",cursor:"pointer",fontFamily:F,fontSize:"16px" }}>☰</button>
            <div style={{ color:T.accent, fontSize:"14px", fontWeight:"700" }}>BILLING_SYS</div>
          </div>
        )}

        {notif && (
          <div style={{ position:"fixed",top:"20px",right:"20px",zIndex:999,...CS,padding:"14px 20px",maxWidth:"300px" }}>
            <Msg type={notif.type} text={notif.text} />
          </div>
        )}

        {page==="dashboard"     && <Dashboard bills={DB.bills} operator={operator} mob={mob} />}
        {page==="new-bill"      && <NewBill onSave={b=>{DB.bills.push(b);persist();notify("success","Bill "+b.billNumber+" saved!");setPage("bills");}} notify={notify} mob={mob} />}
        {page==="bills"         && <BillsPage bills={DB.bills} onDelete={bn=>{const i=DB.bills.findIndex(b=>b.billNumber===bn);if(i>-1){DB.bills.splice(i,1);persist();}notify("warn",bn+" deleted.");}} mob={mob} />}
        {page==="products"      && <ProductsPage bills={DB.bills} />}
        {page==="login-history" && <LoginHistory records={DB.logins} />}
        {page==="password"      && <SettingsPage notify={notify} onAccountDeleted={handleAccountDeleted} />}
      </div>
    </div>
  );
}

// ======================================================
// DASHBOARD
// ======================================================
function Dashboard({ bills, operator, mob }) {
  const totalRev   = bills.reduce((s,b) => s+b.grandTotal, 0);
  const todayStr   = new Date().toLocaleDateString("en-IN");
  const todayCt    = bills.filter(b => b.dateTime.startsWith(todayStr)).length;
  const itemsSold  = bills.reduce((s,b) => s+b.items.reduce((a,it)=>a+it.qty,0), 0);

  const stats = [
    {label:"Total Revenue", val:"₹"+totalRev.toFixed(2), color:T.accent},
    {label:"Total Bills",   val:String(bills.length),    color:T.warn},
    {label:"Today's Bills", val:String(todayCt),         color:"#7eb8ff"},
    {label:"Items Sold",    val:String(itemsSold),        color:"#ff9eb5"},
  ];

  return (
    <div>
      <PT title="Dashboard" sub="system overview" />
      <div style={{ color:T.muted, fontSize:"12px", marginBottom:"24px" }}>
        Welcome, <span style={{ color:T.accent }}>{operator?.name}</span> — {now()}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:mob?"1fr 1fr":"repeat(4,1fr)", gap:"12px", marginBottom:"28px" }}>
        {stats.map(s => (
          <div key={s.label} style={{ ...CS, padding:"18px" }}>
            <div style={{ color:T.muted, fontSize:"10px", textTransform:"uppercase", letterSpacing:"0.1em" }}>{s.label}</div>
            <div style={{ color:s.color, fontSize:mob?"20px":"24px", fontWeight:"700", marginTop:"8px" }}>{s.val}</div>
          </div>
        ))}
      </div>
      <div style={{ ...CS, padding:"20px", overflowX:"auto" }}>
        <div style={{ color:T.accent, fontSize:"12px", letterSpacing:"0.1em", marginBottom:"16px" }}>// RECENT BILLS</div>
        {bills.length===0 ? (
          <div style={{ color:T.muted, textAlign:"center", padding:"20px", fontSize:"12px" }}>No bills yet. Create your first bill!</div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"12px", minWidth:"500px" }}>
            <thead>
              <tr style={{ color:T.muted, borderBottom:"1px solid "+T.border }}>
                {["Bill No","Customer","Phone","Items","Total","Date"].map(h=>(
                  <th key={h} style={{ textAlign:"left", padding:"6px 8px", fontWeight:"normal" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...bills].reverse().slice(0,8).map(b=>(
                <tr key={b.billNumber} style={{ borderBottom:"1px solid "+T.border, color:T.text }}>
                  <td style={{ padding:"8px" }}><BTag text={b.billNumber}/></td>
                  <td style={{ padding:"8px" }}>{b.customerName}</td>
                  <td style={{ padding:"8px", color:T.muted }}>{b.phone}</td>
                  <td style={{ padding:"8px" }}>{b.items.length}</td>
                  <td style={{ padding:"8px", color:T.accent }}>₹{b.grandTotal.toFixed(2)}</td>
                  <td style={{ padding:"8px", color:T.muted, fontSize:"11px" }}>{b.dateTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ======================================================
// NEW BILL — Per-item discount
// ======================================================
function NewBill({ onSave, notify, mob }) {
  const [cN,  setCN]  = useState("");
  const [cP,  setCP]  = useState("");
  const [rows, setRows] = useState([{ name:"", qty:"", price:"", discount:"0" }]);
  const [showSave, setShowSave] = useState(false);
  const [fe, setFe]   = useState({});
  const [re, setRe]   = useState([]);

  const addRow    = ()              => { setRows(p=>[...p,{name:"",qty:"",price:"",discount:"0"}]); setShowSave(false); };
  const delRow    = n               => { setRows(p=>p.filter((_,i)=>i!==n)); setShowSave(false); };
  const editRow   = (n, field, val) => { setRows(p=>p.map((r,i)=>i===n?{...r,[field]:val}:r)); setShowSave(false); };

  // GST INCLUSIVE per item, per-item discount
  function getCalc() {
    const valid = rows.filter(r =>
      r.name.trim() !== "" &&
      parseFloat(r.qty) > 0 &&
      parseFloat(r.price) > 0
    );
    if (!valid.length) return null;

    const calcItems = valid.map(r => {
      const qty    = parseInt(r.qty);
      const price  = parseFloat(r.price);
      const disc   = Math.min(100, Math.max(0, parseFloat(r.discount)||0));
      const mrp    = qty * price;
      const dAmt   = mrp * disc / 100;
      const total  = mrp - dAmt;
      return { ...r, qty, price, disc, mrp, dAmt, total };
    });

    const grand  = calcItems.reduce((s,it) => s+it.total, 0);
    const base   = grand / 1.18;
    const gst    = grand - base;
    return { calcItems, grand, base, gst };
  }

  const C = getCalc();

  function doPreview() {
    const e = {};
    if (!V.name(cN))   e.name  = "Only alphabets and spaces!";
    if (!V.phone(cP))  e.phone = "Must be exactly 10 digits!";
    setFe(e);

    const re2 = rows.map(r => {
      const err = {};
      if (!r.name.trim())         err.name  = "Required";
      else if (!V.name(r.name))   err.name  = "Alphabets only";
      if (!r.qty||!V.qty(r.qty))        err.qty   = "> 0";
      if (!r.price||!V.price(r.price))  err.price = "> 0";
      if (!V.discount(r.discount))      err.disc  = "0-100";
      return err;
    });
    setRe(re2);

    if (Object.keys(e).length || re2.some(x=>Object.keys(x).length))
      return notify("error","Please fix the errors shown!");
    if (!C) return notify("error","Add at least one valid item!");
    setShowSave(true);
  }

  function doSave() {
    if (!C) return;
    const bill = {
      billNumber:   nextBill(),
      customerName: cN.trim(),
      phone:        cP.trim(),
      dateTime:     now(),
      subtotal:     C.base,
      gst:          C.gst,
      grandTotal:   C.grand,
      items: C.calcItems.map(it => ({
        name:     it.name.trim(),
        qty:      it.qty,
        price:    it.price,
        discount: it.disc,
        total:    it.total,
      })),
    };
    onSave(bill);
    setCN(""); setCP("");
    setRows([{name:"",qty:"",price:"",discount:"0"}]);
    setShowSave(false); setFe({}); setRe([]);
  }

  const iSt = { background:T.bg, borderRadius:"2px", color:T.white, fontFamily:F, fontSize:"13px", padding:"7px 8px", outline:"none", width:"100%", boxSizing:"border-box" };

  return (
    <div>
      <PT title="New Bill" sub="create invoice" />
      <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 320px", gap:"20px" }}>

        {/* Form */}
        <div>
          <div style={{ ...CS, padding:"20px", marginBottom:"16px" }}>
            <div style={{ color:T.accent, fontSize:"11px", marginBottom:"16px" }}>// CUSTOMER INFO</div>
            <TIn label="Customer Name" value={cN} onChange={v=>{setCN(v);setFe(e=>({...e,name:""}));}} placeholder="Alphabets only" error={fe.name} />
            <TIn label="Phone Number"  value={cP} onChange={v=>{setCP(v);setFe(e=>({...e,phone:""}));}} placeholder="10-digit number" error={fe.phone} />
          </div>

          <div style={{ ...CS, padding:"20px", marginBottom:"16px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px", flexWrap:"wrap", gap:"8px" }}>
              <div style={{ color:T.accent, fontSize:"11px" }}>
                // ITEMS <span style={{ color:T.muted, fontSize:"10px" }}>(MRP — GST included · per-item discount)</span>
              </div>
              <Btn label="+ Add Item" variant="ghost" small onClick={addRow} />
            </div>

            {/* Column headers */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 55px 80px 70px 34px", gap:"5px", marginBottom:"6px" }}>
              {["Item Name","Qty","Price(₹)","Disc%",""].map((h,i)=>(
                <div key={i} style={{ color:T.muted, fontSize:"10px", textTransform:"uppercase" }}>{h}</div>
              ))}
            </div>

            {rows.map((row, n) => (
              <div key={n}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 55px 80px 70px 34px", gap:"5px", marginBottom:"3px", alignItems:"center" }}>
                  <input value={row.name} onChange={e=>editRow(n,"name",e.target.value)} placeholder="Name"
                    style={{ ...iSt, border:"1px solid "+(re[n]?.name?T.danger:T.border) }}
                    onFocus={e=>{e.target.style.borderColor=T.accent;}} onBlur={e=>{e.target.style.borderColor=re[n]?.name?T.danger:T.border;}} />
                  <input value={row.qty} onChange={e=>editRow(n,"qty",e.target.value)} placeholder="0" type="number" min="1"
                    style={{ ...iSt, border:"1px solid "+(re[n]?.qty?T.danger:T.border) }}
                    onFocus={e=>{e.target.style.borderColor=T.accent;}} onBlur={e=>{e.target.style.borderColor=re[n]?.qty?T.danger:T.border;}} />
                  <input value={row.price} onChange={e=>editRow(n,"price",e.target.value)} placeholder="0.00" type="number" min="0" step="0.01"
                    style={{ ...iSt, border:"1px solid "+(re[n]?.price?T.danger:T.border) }}
                    onFocus={e=>{e.target.style.borderColor=T.accent;}} onBlur={e=>{e.target.style.borderColor=re[n]?.price?T.danger:T.border;}} />
                  <input value={row.discount} onChange={e=>editRow(n,"discount",e.target.value)} placeholder="0" type="number" min="0" max="100" step="0.1"
                    style={{ ...iSt, border:"1px solid "+(re[n]?.disc?T.danger:T.border) }}
                    onFocus={e=>{e.target.style.borderColor=T.accent;}} onBlur={e=>{e.target.style.borderColor=re[n]?.disc?T.danger:T.border;}} />
                  <button onClick={()=>delRow(n)} style={{ background:T.danger+"22", border:"1px solid "+T.danger, color:T.danger, borderRadius:"2px", cursor:"pointer", height:"34px", width:"34px", fontSize:"14px" }}>✕</button>
                </div>
                {(re[n]?.name||re[n]?.qty||re[n]?.price||re[n]?.disc) && (
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 55px 80px 70px 34px", gap:"5px", marginBottom:"4px" }}>
                    <div style={{ color:T.danger, fontSize:"10px" }}>{re[n]?.name}</div>
                    <div style={{ color:T.danger, fontSize:"10px" }}>{re[n]?.qty}</div>
                    <div style={{ color:T.danger, fontSize:"10px" }}>{re[n]?.price}</div>
                    <div style={{ color:T.danger, fontSize:"10px" }}>{re[n]?.disc}</div>
                    <div></div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
            <Btn label="Preview Bill" onClick={doPreview} />
            {showSave && C && <Btn label="Save Bill ✓" variant="warn" onClick={doSave} />}
          </div>
        </div>

        {/* Live Preview */}
        <div style={{ ...CS, padding:"20px" }}>
          <div style={{ color:T.accent, fontSize:"11px", marginBottom:"16px" }}>// LIVE PREVIEW</div>
          {C ? (
            <div style={{ fontFamily:F, fontSize:"12px", color:T.text, lineHeight:"1.8" }}>
              <div style={{ borderBottom:"1px solid "+T.border, paddingBottom:"10px", marginBottom:"10px" }}>
                <div><span style={{ color:T.muted }}>Customer: </span>{cN||"—"}</div>
                <div><span style={{ color:T.muted }}>Phone: </span>{cP||"—"}</div>
                <div><span style={{ color:T.muted }}>Date: </span>{now()}</div>
              </div>

              {/* Items breakdown */}
              {C.calcItems.map((it,i) => (
                <div key={i} style={{ marginBottom:"8px", paddingBottom:"8px", borderBottom:"1px dashed "+T.border+"66" }}>
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ color:T.text }}>{it.name} × {it.qty}</span>
                    <span style={{ color:T.muted }}>₹{it.mrp.toFixed(2)}</span>
                  </div>
                  {it.disc > 0 && (
                    <div style={{ display:"flex", justifyContent:"space-between", color:T.danger, fontSize:"11px" }}>
                      <span>  Discount ({it.disc}%)</span>
                      <span>-₹{it.dAmt.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display:"flex", justifyContent:"space-between", color:T.accent, fontSize:"11px" }}>
                    <span>  Item Total</span>
                    <span>₹{it.total.toFixed(2)}</span>
                  </div>
                </div>
              ))}

              <div style={{ paddingTop:"4px" }}>
                <RowLine l="Base Price (excl. GST)" c={T.muted} v={"₹"+C.base.toFixed(2)} />
                <RowLine l="GST 18% (included)"     c={T.muted} v={"₹"+C.gst.toFixed(2)} />
                <div style={{ display:"flex", justifyContent:"space-between", color:T.accent, fontSize:"15px", fontWeight:"700", marginTop:"8px", paddingTop:"8px", borderTop:"1px solid "+T.border }}>
                  <span>GRAND TOTAL</span><span>₹{C.grand.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color:T.muted, textAlign:"center", padding:"40px 0", fontSize:"12px" }}>
              Add items to see live preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ======================================================
// BILLS PAGE
// ======================================================
function BillsPage({ bills, onDelete, mob }) {
  const [search, setSearch] = useState("");
  const [sel,    setSel]    = useState(null);

  const filtered = bills.filter(b =>
    b.customerName.toLowerCase().includes(search.toLowerCase()) ||
    b.phone.includes(search) ||
    b.billNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PT title="Bill History" sub="view and manage invoices" />
      <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 380px", gap:"20px" }}>
        <div>
          <TIn value={search} onChange={setSearch} placeholder="Search by name, phone, or bill number..." />
          <div style={{ ...CS }}>
            {filtered.length===0 ? (
              <div style={{ color:T.muted, textAlign:"center", padding:"32px", fontSize:"12px" }}>No bills found</div>
            ) : filtered.map(b => (
              <div key={b.billNumber} onClick={()=>setSel(b)} style={{
                padding:"12px 16px", borderBottom:"1px solid "+T.border, cursor:"pointer",
                background:sel?.billNumber===b.billNumber?T.accent+"10":"transparent",
                display:"flex", justifyContent:"space-between", alignItems:"center", transition:"background 0.15s" }}>
                <div>
                  <div style={{ display:"flex", gap:"8px", alignItems:"center", flexWrap:"wrap" }}>
                    <BTag text={b.billNumber}/><span style={{ color:T.text, fontSize:"13px" }}>{b.customerName}</span>
                  </div>
                  <div style={{ color:T.muted, fontSize:"11px", marginTop:"4px" }}>{b.phone} • {b.dateTime}</div>
                </div>
                <div style={{ color:T.accent, fontSize:"14px", fontWeight:"700", marginLeft:"8px" }}>₹{b.grandTotal.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          {sel ? (
            <div style={{ ...CS, padding:"20px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px", flexWrap:"wrap", gap:"8px" }}>
                <BTag text={sel.billNumber}/>
                <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
                  <Btn label="🖨 Print" variant="info" small onClick={()=>printInvoice(sel)} />
                  <Btn label="Delete" variant="danger" small onClick={()=>{onDelete(sel.billNumber);setSel(null);}} />
                </div>
              </div>
              <div style={{ fontFamily:F, fontSize:"12px", color:T.text, lineHeight:"1.8" }}>
                <div style={{ paddingBottom:"10px", marginBottom:"10px", borderBottom:"1px solid "+T.border }}>
                  <div><span style={{ color:T.muted }}>Customer: </span>{sel.customerName}</div>
                  <div><span style={{ color:T.muted }}>Phone: </span>{sel.phone}</div>
                  <div><span style={{ color:T.muted }}>Date: </span>{sel.dateTime}</div>
                </div>
                {sel.items.map((it,i) => (
                  <div key={i} style={{ marginBottom:"6px", paddingBottom:"6px", borderBottom:"1px dashed "+T.border+"55" }}>
                    <div style={{ display:"flex", justifyContent:"space-between" }}>
                      <span>{it.name} × {it.qty} @ ₹{Number(it.price).toFixed(2)}</span>
                      <span style={{ color:T.muted }}>₹{(it.qty*it.price).toFixed(2)}</span>
                    </div>
                    {Number(it.discount)>0 && (
                      <div style={{ display:"flex", justifyContent:"space-between", color:T.danger, fontSize:"11px" }}>
                        <span>  Discount ({it.discount}%)</span>
                        <span>-₹{(it.qty*it.price*it.discount/100).toFixed(2)}</span>
                      </div>
                    )}
                    <div style={{ display:"flex", justifyContent:"space-between", color:T.accent, fontSize:"11px" }}>
                      <span>  Item Total</span><span>₹{Number(it.total).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop:"8px", paddingTop:"8px", borderTop:"1px solid "+T.border }}>
                  <RowLine l="Base Price (excl. GST)" c={T.muted} v={"₹"+Number(sel.subtotal).toFixed(2)} />
                  <RowLine l="GST 18% (included)"     c={T.muted} v={"₹"+Number(sel.gst).toFixed(2)} />
                  <div style={{ display:"flex", justifyContent:"space-between", color:T.accent, fontWeight:"700", fontSize:"14px", marginTop:"8px", paddingTop:"8px", borderTop:"1px solid "+T.border }}>
                    <span>GRAND TOTAL</span><span>₹{Number(sel.grandTotal).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ ...CS, padding:"40px", textAlign:"center", color:T.muted, fontSize:"12px" }}>
              {mob?"Tap":"Click"} a bill to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ======================================================
// PRODUCTS PAGE
// ======================================================
function ProductsPage({ bills }) {
  const map = {};
  bills.forEach(b => b.items.forEach(it => {
    if (!map[it.name]) map[it.name]={qty:0,rev:0,ct:0};
    map[it.name].qty += Number(it.qty);
    map[it.name].rev += Number(it.total);
    map[it.name].ct  += 1;
  }));
  const rows = Object.entries(map).sort((a,b)=>b[1].rev-a[1].rev);

  return (
    <div>
      <PT title="Product Sales" sub="inventory and revenue analysis" />
      {rows.length===0 ? (
        <div style={{ ...CS, padding:"40px", textAlign:"center", color:T.muted }}>No product data yet.</div>
      ) : (
        <div style={{ ...CS, overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"13px", minWidth:"400px" }}>
            <thead>
              <tr style={{ borderBottom:"1px solid "+T.border }}>
                {["#","Product Name","Qty Sold","In Bills","Revenue (after disc.)"].map(h=>(
                  <th key={h} style={{ padding:"12px 16px", textAlign:"left", color:T.muted, fontWeight:"normal", fontSize:"11px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([name,d],i) => (
                <tr key={name} style={{ borderBottom:"1px solid "+T.border, color:T.text }}>
                  <td style={{ padding:"12px 16px", color:T.muted }}>{i+1}</td>
                  <td style={{ padding:"12px 16px", fontWeight:"700" }}>{name}</td>
                  <td style={{ padding:"12px 16px" }}>{d.qty}</td>
                  <td style={{ padding:"12px 16px" }}>{d.ct}</td>
                  <td style={{ padding:"12px 16px", color:T.accent, fontWeight:"700" }}>₹{d.rev.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ======================================================
// LOGIN HISTORY
// ======================================================
function LoginHistory({ records }) {
  return (
    <div>
      <PT title="Login History" sub="operator access log" />
      <div style={{ ...CS, overflowX:"auto" }}>
        {records.length===0 ? (
          <div style={{ color:T.muted, textAlign:"center", padding:"40px", fontSize:"12px" }}>No login records yet</div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"13px", minWidth:"360px" }}>
            <thead>
              <tr style={{ borderBottom:"1px solid "+T.border }}>
                {["#","Operator Name","Phone","Login Time"].map(h=>(
                  <th key={h} style={{ padding:"12px 16px", textAlign:"left", color:T.muted, fontWeight:"normal", fontSize:"11px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...records].reverse().map((r,i) => (
                <tr key={i} style={{ borderBottom:"1px solid "+T.border, color:T.text }}>
                  <td style={{ padding:"12px 16px", color:T.muted }}>{records.length-i}</td>
                  <td style={{ padding:"12px 16px", fontWeight:"700", color:T.accent }}>{r.name}</td>
                  <td style={{ padding:"12px 16px" }}>{r.phone}</td>
                  <td style={{ padding:"12px 16px", color:T.muted }}>{r.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ======================================================
// SETTINGS PAGE — Password + Delete Account
// ======================================================
function SettingsPage({ notify, onAccountDeleted }) {
  const [tab, setTab]       = useState("password");

  // Password change
  const [oP,  setOP]        = useState("");
  const [nP,  setNP]        = useState("");
  const [cP,  setCP]        = useState("");
  const [pErr, setPErr]     = useState({});

  // Security questions change
  const [sqVerPass, setSqVerPass] = useState("");
  const [sqVerified, setSqVerified] = useState(false);
  const [oldSq1, setOldSq1] = useState("");
  const [oldSq2, setOldSq2] = useState("");
  const [newSq1, setNewSq1] = useState("");
  const [newSq2, setNewSq2] = useState("");
  const [sqErr, setSqErr]   = useState({});

  // Delete account
  const [delPass, setDelPass] = useState("");
  const [delConfirm, setDelConfirm] = useState(false);
  const [deleteTimer, setDeleteTimer] = useState(DB.deleteAt);
  const [remaining, setRemaining] = useState(0);

  function verifySqPass() {
    if (!checkPass(sqVerPass.trim(), DB.pwHash))
      return setSqErr(e => ({...e, verPass:"Wrong password!"}));
    setSqVerified(true);
    setSqErr({});
  }

  function updateSecurityQ() {
    const e = {};
    if (oldSq1.trim().toLowerCase() !== DB.secQ1ans) e.old1 = "Incorrect current answer!";
    if (oldSq2.trim().toLowerCase() !== DB.secQ2ans) e.old2 = "Incorrect current answer!";
    if (!newSq1.trim()) e.new1 = "New answer is required!";
    if (!newSq2.trim()) e.new2 = "New answer is required!";
    if (Object.keys(e).length) { setSqErr(e); return; }
    DB.secQ1ans = newSq1.trim().toLowerCase();
    DB.secQ2ans = newSq2.trim().toLowerCase();
    persist();
    setSqVerPass(""); setSqVerified(false);
    setOldSq1(""); setOldSq2(""); setNewSq1(""); setNewSq2(""); setSqErr({});
    notify("success", "Security questions updated successfully!");
  }

  // Countdown for delete timer
  useEffect(() => {
    if (!deleteTimer) return;
    const update = () => {
      const left = deleteTimer - Date.now();
      if (left <= 0) { onAccountDeleted(); return; }
      setRemaining(left);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [deleteTimer]);

  function changePass() {
    const e = {};
    if (!checkPass(oP.trim(), DB.pwHash)) e.o = "Current password is incorrect!";
    if (nP.trim().length < 4)            e.n = "Minimum 4 characters!";
    if (nP.trim() !== cP.trim())         e.c = "Passwords do not match!";
    if (Object.keys(e).length) { setPErr(e); return; }
    DB.pwHash = hashPass(nP.trim());
    persist();
    setOP(""); setNP(""); setCP(""); setPErr({});
    notify("success","Password changed successfully!");
  }

  function scheduleDelete() {
    if (!checkPass(delPass.trim(), DB.pwHash)) {
      return notify("error","Wrong password! Account not scheduled for deletion.");
    }
    const deleteTime = Date.now() + 24*60*60*1000; // 24 hours
    DB.deleteAt = deleteTime;
    persist();
    setDeleteTimer(deleteTime);
    setDelPass("");
    setDelConfirm(false);
    notify("warn","Account scheduled for deletion in 24 hours. Login to cancel.");
  }

  function cancelDelete() {
    DB.deleteAt = null;
    persist();
    setDeleteTimer(null);
    setRemaining(0);
    notify("success","Account deletion cancelled!");
  }

  function formatTime(ms) {
    if (ms <= 0) return "00:00:00";
    const h = Math.floor(ms/3600000);
    const m = Math.floor((ms%3600000)/60000);
    const s = Math.floor((ms%60000)/1000);
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  }

  return (
    <div>
      <PT title="Settings" sub="account management" />

      {/* Tabs */}
      <div style={{ display:"flex", gap:"8px", marginBottom:"24px", flexWrap:"wrap" }}>
        <Btn label="Change Password"       variant={tab==="password" ?"primary":"ghost"} onClick={()=>setTab("password")}  small />
        <Btn label="Security Questions"    variant={tab==="security" ?"primary":"ghost"} onClick={()=>setTab("security")}  small />
        <Btn label="Delete Account"        variant={tab==="delete"   ?"danger" :"ghost"} onClick={()=>setTab("delete")}    small />
      </div>

      {/* Password tab */}
      {tab==="password" && (
        <div style={{ ...CS, padding:"24px", maxWidth:"400px" }}>
          <div style={{ color:T.muted, fontSize:"11px", marginBottom:"16px", fontFamily:F }}>
            Password is hashed and stored securely in localStorage.
          </div>
          <TIn label="Current Password"       value={oP} onChange={v=>{setOP(v);setPErr(e=>({...e,o:""}));}} type="password" placeholder="Current password" error={pErr.o} />
          <TIn label="New Password (min 4)"   value={nP} onChange={v=>{setNP(v);setPErr(e=>({...e,n:""}));}} type="password" placeholder="New password" error={pErr.n} />
          <TIn label="Confirm New Password"   value={cP} onChange={v=>{setCP(v);setPErr(e=>({...e,c:""}));}} type="password" placeholder="Re-enter new password" error={pErr.c} />
          <Btn label="Update Password" onClick={changePass} full />
        </div>
      )}

      {/* Security Questions tab */}
      {tab==="security" && (
        <div style={{ ...CS, padding:"24px", maxWidth:"440px" }}>
          <div style={{ color:T.muted, fontSize:"11px", marginBottom:"16px", fontFamily:F }}>
            Update your password recovery security questions.
          </div>

          {!sqVerified ? (
            <>
              <div style={{ color:T.accent, fontSize:"10px", letterSpacing:"0.15em", marginBottom:"12px" }}>
                VERIFY YOUR PASSWORD FIRST
              </div>
              <TIn
                label="Enter Current Password"
                value={sqVerPass}
                onChange={v=>{setSqVerPass(v); setSqErr(e=>({...e,verPass:""}));}}
                type="password"
                placeholder="Your current password"
                error={sqErr.verPass}
              />
              <Btn label="Verify Password" onClick={verifySqPass} />
            </>
          ) : (
            <>
              <div style={{ color:T.accent, fontSize:"10px", letterSpacing:"0.15em", marginBottom:"16px" }}>
                ✓ VERIFIED — UPDATE SECURITY QUESTIONS
              </div>

              <div style={{ background:T.border+"44", borderRadius:"3px", padding:"14px", marginBottom:"16px" }}>
                <div style={{ color:T.muted, fontSize:"10px", letterSpacing:"0.1em", marginBottom:"10px", textTransform:"uppercase" }}>
                  Current Answers (enter to verify)
                </div>
                <TIn
                  label="Current answer — What is your favorite pet's name?"
                  value={oldSq1}
                  onChange={v=>{setOldSq1(v); setSqErr(e=>({...e,old1:""}));}}
                  placeholder="Your current answer"
                  error={sqErr.old1}
                />
                <TIn
                  label="Current answer — What is your mother's maiden name?"
                  value={oldSq2}
                  onChange={v=>{setOldSq2(v); setSqErr(e=>({...e,old2:""}));}}
                  placeholder="Your current answer"
                  error={sqErr.old2}
                />
              </div>

              <div style={{ background:T.accent+"10", borderRadius:"3px", padding:"14px", marginBottom:"16px" }}>
                <div style={{ color:T.accent, fontSize:"10px", letterSpacing:"0.1em", marginBottom:"10px", textTransform:"uppercase" }}>
                  New Answers
                </div>
                <TIn
                  label="New answer — What is your favorite pet's name?"
                  value={newSq1}
                  onChange={v=>{setNewSq1(v); setSqErr(e=>({...e,new1:""}));}}
                  placeholder="New answer"
                  error={sqErr.new1}
                />
                <TIn
                  label="New answer — What is your mother's maiden name?"
                  value={newSq2}
                  onChange={v=>{setNewSq2(v); setSqErr(e=>({...e,new2:""}));}}
                  placeholder="New answer"
                  error={sqErr.new2}
                />
              </div>

              <div style={{ display:"flex", gap:"10px" }}>
                <Btn label="Update Security Questions" onClick={updateSecurityQ} />
                <Btn label="Cancel" variant="ghost" small onClick={()=>{setSqVerified(false); setSqVerPass(""); setOldSq1(""); setOldSq2(""); setNewSq1(""); setNewSq2(""); setSqErr({});}} />
              </div>
            </>
          )}
        </div>
      )}

      {/* Delete Account tab */}
      {tab==="delete" && (
        <div style={{ maxWidth:"440px" }}>
          {deleteTimer ? (
            /* Timer active */
            <div style={{ ...CS, padding:"24px" }}>
              <div style={{ textAlign:"center", padding:"10px 0 20px" }}>
                <div style={{ fontSize:"40px" }}>⏳</div>
                <div style={{ color:T.danger, fontSize:"14px", fontWeight:"700", marginTop:"10px", letterSpacing:"0.1em" }}>
                  ACCOUNT DELETION SCHEDULED
                </div>
                <div style={{ color:T.warn, fontSize:"36px", fontWeight:"700", marginTop:"12px", fontFamily:F }}>
                  {formatTime(remaining)}
                </div>
                <div style={{ color:T.muted, fontSize:"12px", marginTop:"8px" }}>
                  Account will be permanently deleted when timer reaches 00:00:00
                </div>
                <div style={{ color:T.muted, fontSize:"12px", marginTop:"4px" }}>
                  Login again before time expires to cancel deletion
                </div>
              </div>
              <Btn label="✕ Cancel Deletion" variant="ghost" onClick={cancelDelete} full />
            </div>
          ) : (
            /* Schedule delete */
            <div style={{ ...CS, padding:"24px" }}>
              <div style={{ background:T.danger+"15", border:"1px solid "+T.danger, borderRadius:"2px", padding:"12px 16px", marginBottom:"20px" }}>
                <div style={{ color:T.danger, fontSize:"11px", letterSpacing:"0.15em", marginBottom:"6px" }}>⚠ DANGER ZONE</div>
                <div style={{ color:T.text, fontSize:"12px", lineHeight:"1.6" }}>
                  Deleting your account will permanently remove all bills, history, and data after 24 hours.
                  If you log in before the timer expires, deletion will be cancelled automatically.
                </div>
              </div>

              {!delConfirm ? (
                <Btn label="Request Account Deletion" variant="danger" full onClick={()=>setDelConfirm(true)} />
              ) : (
                <>
                  <div style={{ color:T.warn, fontSize:"12px", marginBottom:"12px", fontFamily:F }}>
                    Enter your password to confirm:
                  </div>
                  <TIn label="Your Password" value={delPass} onChange={setDelPass} type="password" placeholder="Enter password to confirm" />
                  <div style={{ display:"flex", gap:"10px" }}>
                    <Btn label="Confirm Delete" variant="danger" onClick={scheduleDelete} />
                    <Btn label="Cancel" variant="ghost" onClick={()=>{setDelConfirm(false);setDelPass("");}} />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
