import { useState, useRef, useEffect } from "react";

// ─── System Prompts ───────────────────────────────────────────────────────────
const BASE_SYSTEM_PROMPT = `You are an elite career coach and AI PM job application specialist with 15+ years placing senior PMs and AI PMs at top-tier companies (Google, Meta, OpenAI, Anthropic, Microsoft, etc.).

You specialize in Senior PM, Director of Product, VP of Product, AI PM, and Product Owner roles.
Tone: direct, strategic, executive-level — no fluff.

When tailoring resumes: impact metrics, leadership scope, AI/ML experience, cross-functional influence. Strong action verbs only.
When writing cover letters: bold hook, company knowledge, connect background to role challenges, confident close.
When analyzing job fit: honest score 1-10, gaps, positioning strategy. Consider location/remote preferences and benefits if provided.
When doing interview prep: ask question → evaluate answer → model answer using STAR/CIRCLES. Focus on AI product sense.

When generating AUTO-APPLY PACKETS output these labeled sections:

## RESUME HEADLINE
[Punchy executive headline]

## RESUME SUMMARY
[3-sentence executive summary emphasizing AI PM expertise]

## TOP 5 TAILORED BULLETS
[5 achievement bullets with metrics, matched to JD keywords]

## COVER LETTER
[3 paragraphs: hook + fit + close. Executive tone.]

## LINKEDIN OUTREACH
[Cold message to hiring manager, max 300 chars]

## FOLLOW-UP EMAIL
[Subject line + 3-sentence follow-up for 5 days after applying]

## APPLICATION CHECKLIST
[5-item checklist before submitting]`;

const SALARY_PROMPT = `You are a salary negotiation expert specializing in senior PM and AI PM compensation at top tech companies. Deep knowledge of market rates, equity, RSU vesting, signing bonuses, negotiation psychology, and benefits packages.

Give direct, tactical advice with specific numbers. Help craft exact scripts and emails. Reference current market data for PM roles at FAANG, AI startups, growth-stage companies. When benefits or location are shared, factor them into total compensation analysis (e.g. remote = no commute cost, full benefits = $X value, etc.).`;

const RESEARCH_PROMPT = `You are a company research analyst for tech companies hiring Product Managers. When given a company name or JD, provide:
1. Company overview & recent news
2. Product areas & tech stack relevant to PM
3. Culture & PM team structure
4. Location, remote policy, and office situation
5. Typical hiring process & timeline (how many rounds, what types)
6. Benefits reputation (equity, health, PTO, parental leave)
7. Key challenges/opportunities for a PM joining now
8. Sharp questions to ask in interviews
9. Red flags or green flags for a senior PM

Be specific and actionable.`;

// ─── Constants ────────────────────────────────────────────────────────────────
const TOOLS = [
  { id: "autoapply", label: "Auto Apply",    icon: "⚡", color: "#FF6B35", desc: "Link, screenshot, or paste a JD" },
  { id: "resume",    label: "Resume Tailor", icon: "◈", color: "#00E5FF", desc: "Tailor resume to a role" },
  { id: "cover",     label: "Cover Letter",  icon: "◆", color: "#FF6B6B", desc: "Generate a cover letter" },
  { id: "fit",       label: "Job Fit Score", icon: "◉", color: "#69FF94", desc: "Analyze your fit" },
  { id: "interview", label: "Interview Prep",icon: "◎", color: "#FFD93D", desc: "Practice PM interviews" },
  { id: "salary",    label: "Salary Coach",  icon: "◐", color: "#C084FC", desc: "Negotiate your offer" },
  { id: "research",  label: "Company Intel", icon: "◑", color: "#34D399", desc: "Research any company" },
  { id: "emails",    label: "Email Vault",   icon: "✉", color: "#FB923C", desc: "Ready-to-send templates" },
];

const AUTO_APPLY_SECTIONS = [
  { key: "RESUME HEADLINE",        label: "Resume Headline" },
  { key: "RESUME SUMMARY",         label: "Resume Summary" },
  { key: "TOP 5 TAILORED BULLETS", label: "Tailored Bullets" },
  { key: "COVER LETTER",           label: "Cover Letter" },
  { key: "LINKEDIN OUTREACH",      label: "LinkedIn Outreach" },
  { key: "FOLLOW-UP EMAIL",        label: "Follow-Up Email" },
  { key: "APPLICATION CHECKLIST",  label: "App Checklist" },
];

const DOC_TYPES = [
  { id: "resume",      label: "Resume",       icon: "◈", color: "#00E5FF", accept: ".pdf,.doc,.docx,.txt", hint: "PDF, DOC, or TXT" },
  { id: "coverLetter", label: "Cover Letter", icon: "◆", color: "#FF6B6B", accept: ".pdf,.doc,.docx,.txt", hint: "Base template" },
  { id: "portfolio",   label: "Portfolio",    icon: "◎", color: "#FFD93D", accept: ".pdf,.txt,.md",        hint: "PDF, text, markdown" },
];

const EMAIL_TEMPLATES = [
  { label: "Follow-Up After Apply",    icon: "📬", text: `Subject: Following Up – [Role] Application\n\nHi [Name],\n\nI applied for the [Role] position at [Company] on [Date] and wanted to follow up to reiterate my interest. My background leading AI/ML product initiatives at [Previous Company] maps closely to what you're building.\n\nI'd love the opportunity to connect. Happy to share more context or answer any questions.\n\nBest,\n[Your Name]` },
  { label: "Thank You After Interview", icon: "🙏", text: `Subject: Thank You – [Role] Interview\n\nHi [Name],\n\nThank you for the conversation today about the [Role] position. I especially enjoyed discussing [specific topic] — it reinforced my excitement about the opportunity.\n\nI'm confident my experience with [specific skill] would let me make an immediate impact on [goal discussed]. Looking forward to next steps.\n\nBest,\n[Your Name]` },
  { label: "Offer Negotiation",         icon: "💰", text: `Subject: Re: [Role] Offer\n\nHi [Name],\n\nThank you so much for the offer — I'm genuinely excited about joining [Company] and the opportunity to work on [product area].\n\nBased on my research into market rates for senior AI PM roles and my [X] years of directly relevant experience, I'd like to discuss bringing the base closer to [$X]. I'm also open to exploring additional equity to bridge any gap.\n\nI'm committed to making this work and look forward to your thoughts.\n\nBest,\n[Your Name]` },
  { label: "Cold Outreach to PM",       icon: "🔗", text: `Subject: AI PM at [Company] – Quick Question\n\nHi [Name],\n\nI'm a senior AI PM exploring opportunities at [Company] and came across your profile. I'd love to learn about your experience on the product team — specifically how the AI roadmap is being shaped.\n\nWould you have 15 minutes for a quick chat? Happy to work around your schedule.\n\nThanks,\n[Your Name]` },
  { label: "Recruiter First Response",  icon: "📞", text: `Subject: Re: [Role] Opportunity\n\nHi [Name],\n\nThanks for reaching out — [Company] is definitely on my radar and the [Role] sounds interesting.\n\nI'm currently exploring senior AI PM opportunities where I can [key goal]. The [specific aspect] of this role caught my attention.\n\nI'd be open to a quick call to learn more. What does your timeline look like?\n\nBest,\n[Your Name]` },
  { label: "Withdraw Application",      icon: "🚪", text: `Subject: Withdrawing Application – [Role]\n\nHi [Name],\n\nI wanted to let you know I'd like to withdraw my application for the [Role] position. I've accepted another opportunity that's a strong fit for where I am in my career.\n\nI have a lot of respect for what [Company] is building and hope our paths cross in the future.\n\nThank you for your time throughout the process.\n\nBest,\n[Your Name]` },
];

const WORK_MODES   = ["Remote", "Hybrid", "On-site", "Flexible"];
const BENEFITS_LIST= ["Health / Dental / Vision", "Equity / RSUs", "401k Match", "Unlimited PTO", "Parental Leave", "Learning Budget", "Home Office Stipend", "Relocation Assistance", "Visa Sponsorship"];
const STAGE_COLORS = { "Applied": "#4A6480", "Recruiter Screen": "#00E5FF", "Technical Screen": "#FFD93D", "Hiring Manager": "#C084FC", "Panel / Loop": "#FF6B35", "Final / Exec": "#FB923C", "Offer": "#69FF94", "Rejected": "#FF6B6B" };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const readFileAsText   = f => new Promise((res,rej) => { const r=new FileReader(); r.onload=e=>res(e.target.result); r.onerror=rej; r.readAsText(f); });
const readFileAsBase64 = f => new Promise((res,rej) => { const r=new FileReader(); r.onload=e=>res(e.target.result.split(",")[1]); r.onerror=rej; r.readAsDataURL(f); });

function parseAutoApplyPacket(text) {
  const sections = {};
  AUTO_APPLY_SECTIONS.forEach(({ key }, i) => {
    const nextKey = AUTO_APPLY_SECTIONS[i+1]?.key;
    const rx = nextKey ? new RegExp(`##\\s*${key}\\s*\\n([\\s\\S]*?)(?=##\\s*${nextKey})`,"i") : new RegExp(`##\\s*${key}\\s*\\n([\\s\\S]*)`,"i");
    const m = text.match(rx);
    if (m) sections[key] = m[1].trim();
  });
  return sections;
}

// ─── CopyBtn ──────────────────────────────────────────────────────────────────
function CopyBtn({ text, color, label="COPY" }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),1800); }}
      style={{ fontSize:9, padding:"3px 9px", borderRadius:4, border:`1px solid ${color}44`, color:copied?color:"#4A6480", background:copied?`${color}15`:"transparent", letterSpacing:"0.1em", transition:"all 0.2s", cursor:"pointer" }}>
      {copied ? "COPIED ✓" : label}
    </button>
  );
}

// ─── AutoApplyPacket ──────────────────────────────────────────────────────────
function AutoApplyPacket({ text, color }) {
  const [open, setOpen] = useState("RESUME HEADLINE");
  const sections = parseAutoApplyPacket(text);
  if (Object.keys(sections).length < 3) return <div style={{fontSize:12,color:"#A8B8CC",whiteSpace:"pre-wrap",lineHeight:1.7}}>{text}</div>;
  return (
    <div style={{width:"100%"}}>
      <div style={{fontSize:10,color,letterSpacing:"0.15em",marginBottom:10}}>⚡ PACKET READY — {Object.keys(sections).length} SECTIONS</div>
      {AUTO_APPLY_SECTIONS.map(({key,label}) => {
        if (!sections[key]) return null;
        const isOpen = open===key;
        return (
          <div key={key} style={{marginBottom:5}}>
            <button onClick={()=>setOpen(isOpen?null:key)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",background:isOpen?`${color}18`:"#0A1018",border:`1px solid ${isOpen?color+"55":"#1A2332"}`,borderRadius:isOpen?"7px 7px 0 0":7,color:isOpen?color:"#5A7A9A",fontSize:10,letterSpacing:"0.08em",cursor:"pointer",transition:"all 0.2s"}}>
              <span>{label.toUpperCase()}</span><span style={{fontSize:9,opacity:0.7}}>{isOpen?"▲":"▼"}</span>
            </button>
            {isOpen && <div style={{background:"#060E16",border:`1px solid ${color}33`,borderTop:"none",borderRadius:"0 0 7px 7px",padding:"12px 14px"}}>
              <div style={{fontSize:11,color:"#C0D0E0",whiteSpace:"pre-wrap",lineHeight:1.8,marginBottom:10}}>{sections[key]}</div>
              <CopyBtn text={sections[key]} color={color} />
            </div>}
          </div>
        );
      })}
    </div>
  );
}

// ─── DocumentVault ────────────────────────────────────────────────────────────
function DocumentVault({ docs, onDocsChange, portfolioUrl, onPortfolioUrl, linkedinUrl, onLinkedinUrl, prefs, onPrefs }) {
  const [dragOver, setDragOver] = useState(null);
  const fileRefs = { resume:useRef(), coverLetter:useRef(), portfolio:useRef() };

  const handleFile = async (id, file) => {
    if (!file) return;
    try { const text = await readFileAsText(file); onDocsChange(prev=>({...prev,[id]:{name:file.name,text,size:file.size}})); }
    catch { alert("Could not read file. Save as .txt and try again."); }
  };

  return (
    <div style={{padding:"14px 18px",borderBottom:"1px solid #1A2332",background:"#060A0E",overflowY:"auto",maxHeight:"55vh"}}>
      <div style={{fontSize:9,color:"#FF6B35",letterSpacing:"0.2em",marginBottom:10}}>◈ MY PROFILE — documents, links & preferences</div>

      {/* URLs */}
      <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
        {[
          {val:linkedinUrl, set:onLinkedinUrl, icon:"🔗", ph:"LinkedIn profile URL", col:"#00E5FF"},
          {val:portfolioUrl,set:onPortfolioUrl,icon:"🌐", ph:"Portfolio website URL",col:"#FFD93D"},
        ].map(({val,set,icon,ph,col},i)=>(
          <div key={i} style={{flex:"1 1 200px",display:"flex",alignItems:"center",gap:6,background:"#0D1520",border:`1px solid ${val?col+"44":"#1E2E3E"}`,borderRadius:7,padding:"7px 10px"}}>
            <span style={{fontSize:12}}>{icon}</span>
            <input value={val} onChange={e=>set(e.target.value)} placeholder={ph}
              style={{flex:1,background:"transparent",border:"none",color:"#C0D0E0",fontSize:10,fontFamily:"inherit",outline:"none"}}/>
            {val && <span style={{fontSize:9,color:col}}>✓</span>}
          </div>
        ))}
      </div>

      {/* File uploads */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
        {DOC_TYPES.map(({id,label,icon,color,accept,hint})=>{
          const doc=docs[id];
          return (
            <div key={id}
              onDragOver={e=>{e.preventDefault();setDragOver(id);}}
              onDragLeave={()=>setDragOver(null)}
              onDrop={e=>{e.preventDefault();setDragOver(null);handleFile(id,e.dataTransfer.files[0]);}}
              onClick={()=>fileRefs[id].current?.click()}
              style={{flex:"1 1 120px",minWidth:110,padding:"9px 11px",background:doc?`${color}10`:"#0D1520",border:`1px dashed ${doc?color+"66":"#1E2E3E"}`,borderRadius:9,cursor:"pointer",transition:"all 0.2s"}}>
              <input ref={fileRefs[id]} type="file" accept={accept} style={{display:"none"}} onChange={e=>handleFile(id,e.target.files[0])}/>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
                <div style={{fontSize:10,color:doc?color:"#4A6480"}}>{icon} {label}</div>
                {doc && <button onClick={e=>{e.stopPropagation();onDocsChange(prev=>{const n={...prev};delete n[id];return n;});}} style={{fontSize:10,color:"#4A6480",background:"none",border:"none",cursor:"pointer"}}>✕</button>}
              </div>
              {doc
                ? <div style={{fontSize:9,color:"#4A6480"}}><div style={{color:"#6A8AAA",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:110}}>{doc.name}</div><div style={{color,opacity:0.7}}>✓ {Math.round(doc.size/1024)}KB</div></div>
                : <div style={{fontSize:9,color:"#2A4060",lineHeight:1.5}}><div>Drop or click</div><div style={{opacity:0.6}}>{hint}</div></div>
              }
            </div>
          );
        })}
      </div>

      {/* Work Preferences */}
      <div style={{borderTop:"1px solid #1A2332",paddingTop:12,marginBottom:10}}>
        <div style={{fontSize:9,color:"#C084FC",letterSpacing:"0.15em",marginBottom:8}}>◐ WORK PREFERENCES</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
          {WORK_MODES.map(m=>(
            <button key={m} onClick={()=>onPrefs(p=>({...p,workMode:m}))} style={{fontSize:9,padding:"4px 10px",borderRadius:20,border:`1px solid ${prefs.workMode===m?"#C084FC55":"#1A2332"}`,color:prefs.workMode===m?"#C084FC":"#4A6480",background:prefs.workMode===m?"#C084FC15":"transparent",cursor:"pointer",transition:"all 0.2s"}}>{m}</button>
          ))}
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <div style={{flex:"1 1 150px",display:"flex",alignItems:"center",gap:6,background:"#0D1520",border:"1px solid #1E2E3E",borderRadius:7,padding:"7px 10px"}}>
            <span style={{fontSize:10,color:"#4A6480"}}>📍</span>
            <input value={prefs.location||""} onChange={e=>onPrefs(p=>({...p,location:e.target.value}))} placeholder="Preferred location (city / country)"
              style={{flex:1,background:"transparent",border:"none",color:"#C0D0E0",fontSize:10,fontFamily:"inherit",outline:"none"}}/>
          </div>
          <div style={{flex:"1 1 150px",display:"flex",alignItems:"center",gap:6,background:"#0D1520",border:"1px solid #1E2E3E",borderRadius:7,padding:"7px 10px"}}>
            <span style={{fontSize:10,color:"#4A6480"}}>💰</span>
            <input value={prefs.salaryMin||""} onChange={e=>onPrefs(p=>({...p,salaryMin:e.target.value}))} placeholder="Min salary target (e.g. $200k)"
              style={{flex:1,background:"transparent",border:"none",color:"#C0D0E0",fontSize:10,fontFamily:"inherit",outline:"none"}}/>
          </div>
        </div>
      </div>

      {/* Must-have benefits */}
      <div style={{borderTop:"1px solid #1A2332",paddingTop:10}}>
        <div style={{fontSize:9,color:"#34D399",letterSpacing:"0.15em",marginBottom:7}}>◑ MUST-HAVE BENEFITS</div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {BENEFITS_LIST.map(b=>{
            const on = prefs.benefits?.includes(b);
            return (
              <button key={b} onClick={()=>onPrefs(p=>({...p,benefits:on?(p.benefits||[]).filter(x=>x!==b):[...(p.benefits||[]),b]}))}
                style={{fontSize:9,padding:"3px 9px",borderRadius:20,border:`1px solid ${on?"#34D39955":"#1A2332"}`,color:on?"#34D399":"#4A6480",background:on?"#34D39915":"transparent",cursor:"pointer",transition:"all 0.2s"}}>
                {on?"✓ ":""}{b}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── JD Panel ─────────────────────────────────────────────────────────────────
function JDPanel({ jd, onJDChange }) {
  const [urlInput,setUrlInput]=useState(""); const [fetching,setFetching]=useState(false);
  const [fetchError,setFetchError]=useState(""); const [extracting,setExtracting]=useState(false);
  const [editMode,setEditMode]=useState(false); const [editText,setEditText]=useState("");
  const imgRef=useRef(); const COLOR="#A78BFA";

  const fetchURL = async () => {
    if(!urlInput.trim())return; setFetching(true); setFetchError("");
    try {
      const res=await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(urlInput.trim())}`);
      const data=await res.json(); const tmp=document.createElement("div"); tmp.innerHTML=data.contents||"";
      tmp.querySelectorAll("script,style,nav,footer,header").forEach(el=>el.remove());
      const cleaned=(tmp.innerText||tmp.textContent||"").replace(/\s{3,}/g,"\n\n").trim().slice(0,8000);
      if(cleaned.length<100) throw new Error("Couldn't extract text — paste the JD manually.");
      onJDChange({text:cleaned,source:"url",url:urlInput.trim()}); setUrlInput("");
    } catch(e){setFetchError(e.message||"Fetch failed.");}
    setFetching(false);
  };

  const handleImage = async (file) => {
    if(!file)return;
    const previewURL=URL.createObjectURL(file); setExtracting(true);
    try {
      const b64=await readFileAsBase64(file);
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:[{type:"image",source:{type:"base64",media_type:file.type||"image/png",data:b64}},{type:"text",text:"Extract all text from this job description screenshot. Return only raw text preserving structure. No commentary."}]}]})});
      const data=await res.json();
      const extracted=data.content?.map(b=>b.text||"").join("\n").trim();
      if(extracted) onJDChange({text:extracted,source:"image",imageSrc:previewURL});
      else throw new Error("No text extracted.");
    } catch{setFetchError("Image extraction failed — paste JD manually.");}
    setExtracting(false);
  };

  return (
    <div style={{padding:"13px 18px",borderBottom:"1px solid #1A2332",background:"#06090E"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:9}}>
        <div style={{fontSize:9,color:COLOR,letterSpacing:"0.2em"}}>◎ JOB DESCRIPTION</div>
        <div style={{display:"flex",gap:5}}>
          {jd?.text && !editMode && <>
            <button onClick={()=>{setEditText(jd.text);setEditMode(true);}} style={{fontSize:9,padding:"3px 8px",borderRadius:5,border:`1px solid ${COLOR}44`,color:COLOR,background:`${COLOR}10`,cursor:"pointer"}}>✏ EDIT</button>
            <button onClick={()=>onJDChange(null)} style={{fontSize:9,padding:"3px 8px",borderRadius:5,border:"1px solid #2A3A4A",color:"#4A6480",background:"transparent",cursor:"pointer"}}>✕ CLEAR</button>
          </>}
          {editMode && <>
            <button onClick={()=>{onJDChange({...jd,text:editText});setEditMode(false);}} style={{fontSize:9,padding:"3px 8px",borderRadius:5,border:`1px solid ${COLOR}55`,color:COLOR,background:`${COLOR}15`,cursor:"pointer"}}>✓ SAVE</button>
            <button onClick={()=>setEditMode(false)} style={{fontSize:9,padding:"3px 8px",borderRadius:5,border:"1px solid #2A3A4A",color:"#4A6480",background:"transparent",cursor:"pointer"}}>CANCEL</button>
          </>}
        </div>
      </div>

      {editMode ? (
        <textarea value={editText} onChange={e=>setEditText(e.target.value)} style={{width:"100%",minHeight:140,background:"#0D1520",border:`1px solid ${COLOR}44`,borderRadius:8,color:"#C0D0E0",fontSize:11,lineHeight:1.7,padding:"10px 12px",fontFamily:"inherit",outline:"none",resize:"vertical"}}/>
      ) : jd?.text ? (
        <div style={{background:"#0D1520",border:`1px solid ${COLOR}33`,borderRadius:9,padding:"10px 13px"}}>
          <div style={{fontSize:9,color:COLOR,marginBottom:5}}>{jd.source==="url"?"🔗 URL":jd.source==="image"?"📸 SCREENSHOT":"✎ MANUAL"} {jd.url&&<a href={jd.url} target="_blank" rel="noreferrer" style={{color:"#4A6480",textDecoration:"none",marginLeft:6}}>{jd.url.slice(0,50)}…</a>}</div>
          {jd.imageSrc&&<img src={jd.imageSrc} alt="JD" style={{width:"100%",maxHeight:80,objectFit:"cover",borderRadius:6,marginBottom:6,opacity:0.5}}/>}
          <div style={{fontSize:10,color:"#6A8AAA",lineHeight:1.6,maxHeight:65,overflow:"hidden",maskImage:"linear-gradient(to bottom,black 40%,transparent)"}}>{jd.text.slice(0,300)}</div>
          <div style={{fontSize:9,color:"#2A4060",marginTop:4}}>{jd.text.length} chars · ✏ EDIT to modify</div>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          <div style={{display:"flex",gap:7}}>
            <input value={urlInput} onChange={e=>setUrlInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&fetchURL()} placeholder="Paste job posting URL (LinkedIn, Greenhouse, Lever, Workday…)"
              style={{flex:1,background:"#0D1520",border:`1px solid ${COLOR}33`,borderRadius:7,color:"#C0D0E0",fontSize:11,padding:"8px 11px",fontFamily:"inherit",outline:"none"}}/>
            <button onClick={fetchURL} disabled={fetching||!urlInput.trim()} style={{padding:"8px 14px",borderRadius:7,fontSize:10,background:urlInput.trim()?`${COLOR}22`:"#0D1520",border:`1px solid ${urlInput.trim()?COLOR+"55":"#1A2332"}`,color:urlInput.trim()?COLOR:"#2A4060",cursor:urlInput.trim()?"pointer":"default"}}>{fetching?"…":"FETCH"}</button>
          </div>
          <label style={{display:"flex",alignItems:"center",gap:8,padding:"8px 11px",background:"#0D1520",border:`1px dashed ${COLOR}33`,borderRadius:7,cursor:"pointer"}}>
            <input ref={imgRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>handleImage(e.target.files[0])}/>
            <span style={{fontSize:12}}>📸</span>
            <span style={{fontSize:10,color:"#4A6480"}}>{extracting?"Extracting text from screenshot…":"Upload JD screenshot or photo"}</span>
          </label>
          <textarea placeholder="…or paste the job description text directly here" onBlur={e=>{if(e.target.value.trim().length>50) onJDChange({text:e.target.value.trim(),source:"manual"});}}
            style={{background:"#0D1520",border:`1px solid ${COLOR}22`,borderRadius:7,color:"#C0D0E0",fontSize:11,padding:"8px 11px",fontFamily:"inherit",outline:"none",resize:"none",minHeight:55,lineHeight:1.6}} rows={3}/>
          {fetchError&&<div style={{fontSize:10,color:"#FF6B6B",background:"#FF6B6B10",border:"1px solid #FF6B6B33",borderRadius:6,padding:"6px 10px"}}>{fetchError}</div>}
        </div>
      )}
    </div>
  );
}

// ─── Hiring Timeline / Process Panel ─────────────────────────────────────────
function HiringTimeline({ jobQueue, onJobQueueChange }) {
  const [selected, setSelected] = useState(jobQueue[0]?.id || null);
  const [addingNote, setAddingNote] = useState(false);
  const [note, setNote] = useState({ date: new Date().toISOString().slice(0,10), stage:"Applied", text:"" });
  const job = jobQueue.find(j=>j.id===selected);

  const updateJob = (id, patch) => onJobQueueChange(prev=>prev.map(j=>j.id===id?{...j,...patch}:j));

  const addNote = () => {
    if(!note.text.trim()) return;
    updateJob(selected,{timeline:[...(job.timeline||[]),{...note,id:Date.now()}]});
    setNote({date:new Date().toISOString().slice(0,10),stage:"Applied",text:""});
    setAddingNote(false);
  };

  return (
    <div style={{padding:"13px 18px",borderBottom:"1px solid #1A2332",background:"#060A0E"}}>
      <div style={{fontSize:9,color:"#C084FC",letterSpacing:"0.2em",marginBottom:10}}>◐ HIRING TIMELINE & PROCESS</div>
      <div style={{display:"flex",gap:8,overflowX:"auto",marginBottom:10,paddingBottom:4}}>
        {jobQueue.map(j=>(
          <button key={j.id} onClick={()=>setSelected(j.id)} style={{flexShrink:0,padding:"6px 12px",borderRadius:7,fontSize:10,background:selected===j.id?"#C084FC18":"#0D1520",border:`1px solid ${selected===j.id?"#C084FC55":"#1A2332"}`,color:selected===j.id?"#C084FC":"#4A6480",cursor:"pointer",whiteSpace:"nowrap"}}>
            {j.company} <span style={{opacity:0.6}}>– {j.role.slice(0,18)}</span>
          </button>
        ))}
      </div>

      {job && (
        <div>
          {/* Current stage selector */}
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
            {Object.keys(STAGE_COLORS).map(s=>(
              <button key={s} onClick={()=>updateJob(job.id,{hiringStage:s})} style={{fontSize:9,padding:"3px 9px",borderRadius:20,border:`1px solid ${job.hiringStage===s?STAGE_COLORS[s]+"66":"#1A2332"}`,color:job.hiringStage===s?STAGE_COLORS[s]:"#4A6480",background:job.hiringStage===s?`${STAGE_COLORS[s]}18`:"transparent",cursor:"pointer",transition:"all 0.2s"}}>
                {s}
              </button>
            ))}
          </div>

          {/* Benefits & details for this job */}
          <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
            {[
              {key:"location",ph:"Location / Remote policy",icon:"📍"},
              {key:"salary",  ph:"Salary range offered",   icon:"💰"},
              {key:"equity",  ph:"Equity / RSUs",          icon:"📈"},
            ].map(({key,ph,icon})=>(
              <div key={key} style={{flex:"1 1 160px",display:"flex",alignItems:"center",gap:6,background:"#0D1520",border:"1px solid #1A2332",borderRadius:7,padding:"6px 10px"}}>
                <span style={{fontSize:10}}>{icon}</span>
                <input value={job[key]||""} onChange={e=>updateJob(job.id,{[key]:e.target.value})} placeholder={ph}
                  style={{flex:1,background:"transparent",border:"none",color:"#C0D0E0",fontSize:10,fontFamily:"inherit",outline:"none"}}/>
              </div>
            ))}
          </div>

          {/* Benefits checkboxes for this job */}
          <div style={{marginBottom:10}}>
            <div style={{fontSize:8,color:"#2A4060",letterSpacing:"0.12em",marginBottom:5}}>CONFIRMED BENEFITS</div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {BENEFITS_LIST.map(b=>{
                const on=(job.confirmedBenefits||[]).includes(b);
                return <button key={b} onClick={()=>updateJob(job.id,{confirmedBenefits:on?(job.confirmedBenefits||[]).filter(x=>x!==b):[...(job.confirmedBenefits||[]),b]})}
                  style={{fontSize:8,padding:"2px 7px",borderRadius:20,border:`1px solid ${on?"#34D39944":"#1A2332"}`,color:on?"#34D399":"#3A5470",background:on?"#34D39912":"transparent",cursor:"pointer"}}>{on?"✓ ":""}{b}</button>;
              })}
            </div>
          </div>

          {/* Timeline log */}
          <div style={{fontSize:8,color:"#2A4060",letterSpacing:"0.12em",marginBottom:6}}>PROCESS LOG</div>
          <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:8}}>
            {(job.timeline||[]).length===0 && <div style={{fontSize:9,color:"#1A2332"}}>No entries yet</div>}
            {(job.timeline||[]).map(entry=>(
              <div key={entry.id} style={{display:"flex",gap:10,alignItems:"flex-start",background:"#0D1520",borderRadius:7,padding:"7px 10px",border:`1px solid ${STAGE_COLORS[entry.stage]||"#1A2332"}22`}}>
                <div style={{fontSize:9,color:STAGE_COLORS[entry.stage]||"#4A6480",whiteSpace:"nowrap",minWidth:80}}>{entry.date}</div>
                <div style={{fontSize:9,color:STAGE_COLORS[entry.stage]||"#4A6480",fontWeight:500,minWidth:100,whiteSpace:"nowrap"}}>{entry.stage}</div>
                <div style={{fontSize:9,color:"#6A8AAA",lineHeight:1.5,flex:1}}>{entry.text}</div>
                <button onClick={()=>updateJob(job.id,{timeline:(job.timeline||[]).filter(e=>e.id!==entry.id)})} style={{fontSize:9,color:"#2A4060",background:"none",border:"none",cursor:"pointer",flexShrink:0}}>✕</button>
              </div>
            ))}
          </div>

          {addingNote ? (
            <div style={{display:"flex",gap:6,flexWrap:"wrap",background:"#0D1520",border:"1px solid #1A2332",borderRadius:8,padding:"9px"}}>
              <input type="date" value={note.date} onChange={e=>setNote(p=>({...p,date:e.target.value}))} style={{background:"#060A0E",border:"1px solid #1A2332",borderRadius:6,color:"#C0D0E0",fontSize:9,padding:"5px 8px",fontFamily:"inherit",outline:"none"}}/>
              <select value={note.stage} onChange={e=>setNote(p=>({...p,stage:e.target.value}))} style={{background:"#060A0E",border:"1px solid #1A2332",borderRadius:6,color:STAGE_COLORS[note.stage]||"#C0D0E0",fontSize:9,padding:"5px 8px",fontFamily:"inherit",outline:"none"}}>
                {Object.keys(STAGE_COLORS).map(s=><option key={s} value={s}>{s}</option>)}
              </select>
              <input value={note.text} onChange={e=>setNote(p=>({...p,text:e.target.value}))} placeholder="Notes (interview feedback, next steps, contact…)" style={{flex:1,minWidth:160,background:"#060A0E",border:"1px solid #1A2332",borderRadius:6,color:"#C0D0E0",fontSize:9,padding:"5px 8px",fontFamily:"inherit",outline:"none"}}/>
              <button onClick={addNote} style={{padding:"5px 12px",borderRadius:6,background:"#C084FC22",border:"1px solid #C084FC55",color:"#C084FC",fontSize:9,cursor:"pointer"}}>SAVE</button>
              <button onClick={()=>setAddingNote(false)} style={{padding:"5px 10px",borderRadius:6,background:"transparent",border:"1px solid #1A2332",color:"#4A6480",fontSize:9,cursor:"pointer"}}>CANCEL</button>
            </div>
          ) : (
            <button onClick={()=>setAddingNote(true)} style={{fontSize:9,padding:"5px 12px",borderRadius:6,border:"1px solid #C084FC44",color:"#C084FC",background:"#C084FC10",cursor:"pointer",letterSpacing:"0.08em"}}>+ LOG STAGE / NOTE</button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Benefits Comparison ──────────────────────────────────────────────────────
function BenefitsComparison({ jobQueue, prefs }) {
  const jobs = jobQueue.filter(j=>j.confirmedBenefits?.length>0 || j.salary || j.equity || j.location);
  return (
    <div style={{padding:"13px 18px",borderBottom:"1px solid #1A2332",background:"#060A0E"}}>
      <div style={{fontSize:9,color:"#34D399",letterSpacing:"0.2em",marginBottom:10}}>◑ BENEFITS COMPARISON</div>
      {jobs.length === 0
        ? <div style={{fontSize:10,color:"#2A4060"}}>Add salary, equity, and benefits to jobs in the Hiring Timeline panel to compare here.</div>
        : (
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:9}}>
              <thead>
                <tr>
                  <th style={{textAlign:"left",color:"#4A6480",padding:"4px 8px",borderBottom:"1px solid #1A2332"}}>BENEFIT</th>
                  {jobs.map(j=><th key={j.id} style={{textAlign:"left",color:"#C0D0E0",padding:"4px 8px",borderBottom:"1px solid #1A2332",whiteSpace:"nowrap"}}>{j.company}</th>)}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Location",        j=>j.location||"—"],
                  ["Salary Range",    j=>j.salary||"—"],
                  ["Equity / RSUs",   j=>j.equity||"—"],
                  ...BENEFITS_LIST.map(b=>[b, j=>(j.confirmedBenefits||[]).includes(b)?"✓":"—"]),
                ].map(([label,fn],i)=>(
                  <tr key={i} style={{background:i%2===0?"#0D152010":"transparent"}}>
                    <td style={{color:"#4A6480",padding:"5px 8px",borderBottom:"1px solid #1A233222"}}>{label}</td>
                    {jobs.map(j=>{
                      const val=fn(j);
                      const isMustHave=(prefs.benefits||[]).includes(label);
                      const missing=isMustHave&&val==="—";
                      return <td key={j.id} style={{padding:"5px 8px",borderBottom:"1px solid #1A233222",color:val==="✓"?"#34D399":missing?"#FF6B6B":"#6A8AAA"}}>{val}{missing?" ⚠":""}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {(prefs.benefits||[]).length>0 && <div style={{fontSize:9,color:"#2A4060",marginTop:8}}>⚠ = missing a must-have benefit from your preferences</div>}
          </div>
        )
      }
    </div>
  );
}

// ─── Deadline Tracker ─────────────────────────────────────────────────────────
function DeadlineTracker({ deadlines, onDeadlinesChange }) {
  const [adding,setAdding]=useState(false);
  const [form,setForm]=useState({company:"",role:"",date:"",notes:""});

  const add = () => {
    if(!form.company||!form.date) return;
    onDeadlinesChange(prev=>[...prev,{...form,id:Date.now()}]);
    setForm({company:"",role:"",date:"",notes:""}); setAdding(false);
  };

  const urgency = dateStr => {
    const diff=Math.ceil((new Date(dateStr)-new Date())/86400000);
    if(diff<0)  return {label:"OVERDUE",color:"#FF6B6B"};
    if(diff===0)return {label:"TODAY",  color:"#FF6B35"};
    if(diff<=3) return {label:`${diff}d`,color:"#FFD93D"};
    return          {label:`${diff}d`,  color:"#69FF94"};
  };

  return (
    <div style={{padding:"13px 18px",borderBottom:"1px solid #1A2332",background:"#060A0E"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:9}}>
        <div style={{fontSize:9,color:"#FB923C",letterSpacing:"0.2em"}}>⏰ DEADLINES</div>
        <button onClick={()=>setAdding(!adding)} style={{fontSize:9,padding:"3px 9px",borderRadius:5,border:"1px solid #FB923C44",color:"#FB923C",background:"#FB923C10",cursor:"pointer"}}>+ ADD</button>
      </div>
      {adding&&(
        <div style={{display:"flex",gap:6,marginBottom:9,flexWrap:"wrap",background:"#0D1520",border:"1px solid #1A2332",borderRadius:8,padding:"9px"}}>
          {[["company","Company"],["role","Role"],["notes","Notes"]].map(([k,ph])=>(
            <input key={k} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} placeholder={ph}
              style={{flex:"1 1 100px",background:"#060A0E",border:"1px solid #1A2332",borderRadius:6,color:"#C0D0E0",fontSize:9,padding:"5px 8px",fontFamily:"inherit",outline:"none"}}/>
          ))}
          <input type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} style={{background:"#060A0E",border:"1px solid #1A2332",borderRadius:6,color:"#C0D0E0",fontSize:9,padding:"5px 8px",fontFamily:"inherit",outline:"none"}}/>
          <button onClick={add} style={{padding:"5px 12px",borderRadius:6,background:"#FB923C22",border:"1px solid #FB923C55",color:"#FB923C",fontSize:9,cursor:"pointer"}}>SAVE</button>
        </div>
      )}
      <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:3}}>
        {[...deadlines].sort((a,b)=>new Date(a.date)-new Date(b.date)).map(d=>{
          const u=urgency(d.date);
          return (
            <div key={d.id} style={{background:"#0D1520",border:`1px solid ${u.color}33`,borderRadius:8,padding:"8px 11px",minWidth:145,flexShrink:0}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
                <div style={{fontSize:10,color:"#C0D0E0",fontWeight:500}}>{d.company}</div>
                <div style={{fontSize:8,color:u.color,background:`${u.color}18`,borderRadius:4,padding:"1px 5px"}}>{u.label}</div>
              </div>
              <div style={{fontSize:8,color:"#4A6480",marginBottom:3}}>{d.role}</div>
              <div style={{fontSize:8,color:"#3A5470"}}>{new Date(d.date).toLocaleDateString()}</div>
              {d.notes&&<div style={{fontSize:8,color:"#2A4060",marginTop:2}}>{d.notes}</div>}
              <button onClick={()=>onDeadlinesChange(prev=>prev.filter(x=>x.id!==d.id))} style={{fontSize:8,color:"#2A4060",background:"none",border:"none",cursor:"pointer",marginTop:3}}>remove</button>
            </div>
          );
        })}
        {deadlines.length===0&&<div style={{fontSize:10,color:"#2A4060"}}>No deadlines yet</div>}
      </div>
    </div>
  );
}

// ─── Email Vault ──────────────────────────────────────────────────────────────
function EmailVault() {
  const [sel,setSel]=useState(0); const [copied,setCopied]=useState(false);
  const t=EMAIL_TEMPLATES[sel];
  return (
    <div style={{flex:1,display:"flex",overflow:"hidden"}}>
      <div style={{width:195,borderRight:"1px solid #1A2332",padding:"13px 9px",overflowY:"auto",background:"#060A0E"}}>
        <div style={{fontSize:9,color:"#FB923C",letterSpacing:"0.2em",marginBottom:9}}>✉ EMAIL TEMPLATES</div>
        {EMAIL_TEMPLATES.map((tmpl,i)=>(
          <button key={i} onClick={()=>{setSel(i);setCopied(false);}} style={{width:"100%",textAlign:"left",padding:"7px 9px",borderRadius:7,marginBottom:4,background:sel===i?"#FB923C14":"transparent",border:`1px solid ${sel===i?"#FB923C55":"#1A2332"}`,color:sel===i?"#FB923C":"#4A6480",fontSize:10,cursor:"pointer"}}>
            {tmpl.icon} {tmpl.label}
          </button>
        ))}
      </div>
      <div style={{flex:1,padding:"18px",overflowY:"auto",background:"linear-gradient(rgba(0,229,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,0.015) 1px,transparent 1px)",backgroundSize:"40px 40px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,color:"#FB923C"}}>{t.icon} {t.label}</div>
          <button onClick={()=>{navigator.clipboard.writeText(t.text);setCopied(true);setTimeout(()=>setCopied(false),1800);}}
            style={{fontSize:9,padding:"5px 12px",borderRadius:6,border:"1px solid #FB923C44",color:copied?"#FB923C":"#4A6480",background:copied?"#FB923C15":"transparent",letterSpacing:"0.1em",cursor:"pointer"}}>
            {copied?"COPIED ✓":"COPY TEMPLATE"}
          </button>
        </div>
        <div style={{background:"#0D1520",border:"1px solid #1A2332",borderRadius:10,padding:"15px",fontSize:11,color:"#A8B8CC",lineHeight:1.9,whiteSpace:"pre-wrap",fontFamily:"inherit"}}>{t.text}</div>
        <div style={{marginTop:10,fontSize:10,color:"#2A4060"}}>Replace <span style={{color:"#4A6480"}}>[bracketed]</span> fields before sending.</div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function JobApply() {
  const [activeTool,setActiveTool]   = useState("autoapply");
  const [messages,setMessages]       = useState({});
  const [input,setInput]             = useState("");
  const [loading,setLoading]         = useState(false);
  const [docs,setDocs]               = useState({});
  const [portfolioUrl,setPortfolioUrl] = useState("");
  const [linkedinUrl,setLinkedinUrl]   = useState("");
  const [prefs,setPrefs]             = useState({workMode:"Remote",location:"",salaryMin:"",benefits:[]});
  const [jd,setJd]                   = useState(null);
  const [deadlines,setDeadlines]     = useState([
    {id:1,company:"OpenAI",   role:"AI PM",         date:new Date(Date.now()+2*86400000).toISOString().slice(0,10),notes:""},
    {id:2,company:"Anthropic",role:"Product Manager",date:new Date(Date.now()+7*86400000).toISOString().slice(0,10),notes:""},
  ]);
  const [jobQueue,setJobQueue] = useState([
    {id:1,company:"OpenAI",         role:"AI PM – ChatGPT",   status:"draft",    fit:null,hiringStage:"Applied",  timeline:[],confirmedBenefits:[],location:"Remote",salary:"$220k-$280k",equity:"0.05%"},
    {id:2,company:"Google DeepMind",role:"Senior PM, Gemini", status:"applied",  fit:8,   hiringStage:"Recruiter Screen",timeline:[],confirmedBenefits:["Health / Dental / Vision","401k Match"],location:"Hybrid – London",salary:"£180k-£220k",equity:"GSU"},
    {id:3,company:"Anthropic",      role:"Product Manager",   status:"interview",fit:9,   hiringStage:"Panel / Loop",  timeline:[],confirmedBenefits:["Health / Dental / Vision","Equity / RSUs","Unlimited PTO","Parental Leave"],location:"Remote-friendly",salary:"$240k-$320k",equity:"Meaningful equity"},
  ]);

  const [panel,setPanel] = useState(null); // "docs"|"jd"|"deadlines"|"timeline"|"benefits"|"queue"

  const bottomRef  = useRef(null);
  const textareaRef= useRef(null);
  const activeTool_= TOOLS.find(t=>t.id===activeTool);
  const currentMessages = messages[activeTool]||[];
  const docsLoaded = Object.keys(docs).length;

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[currentMessages,loading]);

  const buildSystemPrompt = () => {
    let sp = activeTool==="salary"?SALARY_PROMPT:activeTool==="research"?RESEARCH_PROMPT:BASE_SYSTEM_PROMPT;
    if(docs.resume)      sp+=`\n\n---\nCANDIDATE RESUME:\n${docs.resume.text}`;
    if(docs.coverLetter) sp+=`\n\n---\nCANDIDATE COVER LETTER:\n${docs.coverLetter.text}`;
    if(docs.portfolio)   sp+=`\n\n---\nCANDIDATE PORTFOLIO:\n${docs.portfolio.text}`;
    if(linkedinUrl)      sp+=`\nLinkedIn: ${linkedinUrl}`;
    if(portfolioUrl)     sp+=`\nPortfolio Site: ${portfolioUrl}`;
    if(prefs.workMode)   sp+=`\nWork preference: ${prefs.workMode}${prefs.location?` in ${prefs.location}`:""}`;
    if(prefs.salaryMin)  sp+=`\nSalary minimum: ${prefs.salaryMin}`;
    if(prefs.benefits?.length) sp+=`\nMust-have benefits: ${prefs.benefits.join(", ")}`;
    if(jd?.text)         sp+=`\n\n---\nJOB DESCRIPTION:\n${jd.text}`;
    if(docsLoaded>0||jd) sp+=`\n\nIMPORTANT: Use uploaded documents and JD as primary source. Do NOT ask candidate to paste content you already have.`;
    return sp;
  };

  const sendMessage = async () => {
    if(!input.trim()||loading) return;
    const userMsg={role:"user",content:input.trim()};
    const updatedMsgs=[...currentMessages,userMsg];
    setMessages(prev=>({...prev,[activeTool]:updatedMsgs}));
    setInput(""); setLoading(true);
    try {
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1500,system:buildSystemPrompt(),messages:updatedMsgs})});
      const data=await res.json();
      const reply=data.content?.map(b=>b.text||"").join("\n")||"No response.";
      setMessages(prev=>({...prev,[activeTool]:[...updatedMsgs,{role:"assistant",content:reply,isPacket:activeTool==="autoapply"}]}));
    } catch {
      setMessages(prev=>({...prev,[activeTool]:[...updatedMsgs,{role:"assistant",content:"Error reaching AI. Please try again."}]}));
    }
    setLoading(false);
  };

  const urgentCount = deadlines.filter(d=>{ const diff=Math.ceil((new Date(d.date)-new Date())/86400000); return diff>=0&&diff<=3; }).length;
  const togglePanel = p => setPanel(prev=>prev===p?null:p);

  const PANELS = [
    {key:"docs",      label: docsLoaded>0?`◈ DOCS (${docsLoaded}/3)`:"◈ MY DOCS",    col: docsLoaded>0?"#69FF94":"#FF6B35"},
    {key:"jd",        label: jd?"◎ JD ✓":"◎ ADD JD",                                 col:"#A78BFA"},
    {key:"deadlines", label: urgentCount>0?`⏰ (${urgentCount}!)`:"⏰ DEADLINES",      col: urgentCount>0?"#FFD93D":"#FB923C"},
    {key:"timeline",  label:"◐ TIMELINE",                                             col:"#C084FC"},
    {key:"benefits",  label:"◑ BENEFITS",                                             col:"#34D399"},
    {key:"queue",     label:`◉ TRACKER (${jobQueue.length})`,                         col:"#FF6B35"},
  ];

  return (
    <div style={{minHeight:"100vh",background:"#080C10",color:"#E8EDF2",fontFamily:"'DM Mono','Fira Code',monospace",display:"flex",flexDirection:"column"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:#0D1117;}::-webkit-scrollbar-thumb{background:#1E2A38;border-radius:2px;}
        textarea,input{outline:none;}button{cursor:pointer;border:none;background:none;}
        .tb{transition:all 0.2s;}.tb:hover{opacity:0.82;}
        .msg-in{animation:fadeUp 0.3s ease;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
        @keyframes pulse{0%,100%{opacity:0.35;}50%{opacity:1;}}
        .dot{animation:pulse 1.2s infinite;}.dot:nth-child(2){animation-delay:0.2s;}.dot:nth-child(3){animation-delay:0.4s;}
        .grid-bg{background-image:linear-gradient(rgba(0,229,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,0.018) 1px,transparent 1px);background-size:40px 40px;}
        select,input{font-family:inherit;}
      `}</style>

      {/* ── Header ── */}
      <div style={{borderBottom:"1px solid #1A2332",padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(8,12,16,0.97)",position:"sticky",top:0,zIndex:20,flexWrap:"wrap",gap:6}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:30,height:30,background:"#FF6B3520",border:"1px solid #FF6B3555",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>⚡</div>
          <div>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:13,letterSpacing:"0.07em"}}>JOB APPLY</div>
            <div style={{fontSize:9,color:"#4A6480",letterSpacing:"0.12em"}}>AI PM · SENIOR · AUTO-APPLY</div>
          </div>
        </div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {PANELS.map(({key,label,col})=>(
            <button key={key} className="tb" onClick={()=>togglePanel(key)} style={{fontSize:9,padding:"4px 9px",borderRadius:6,border:`1px solid ${panel===key?col+"66":"#1A2332"}`,color:panel===key?col:"#4A6480",background:panel===key?`${col}12`:"transparent",letterSpacing:"0.07em"}}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{display:"flex",flex:1,overflow:"hidden",height:"calc(100vh - 57px)"}}>

        {/* ── Sidebar ── */}
        <div style={{width:170,borderRight:"1px solid #1A2332",padding:"11px 8px",display:"flex",flexDirection:"column",gap:4,background:"#060A0E",overflowY:"auto"}}>
          <div style={{fontSize:9,color:"#2A4060",letterSpacing:"0.2em",marginBottom:3,paddingLeft:2}}>TOOLS</div>
          {TOOLS.map(tool=>(
            <button key={tool.id} className="tb" onClick={()=>{setActiveTool(tool.id);setInput("");setPanel(null);}} style={{padding:"7px 8px",borderRadius:7,textAlign:"left",background:activeTool===tool.id?`${tool.color}14`:"transparent",border:`1px solid ${activeTool===tool.id?tool.color+"55":"#1A2332"}`,color:activeTool===tool.id?tool.color:"#4A6480"}}>
              <div style={{fontSize:11,marginBottom:1}}>{tool.icon} {tool.label}</div>
              <div style={{fontSize:8,opacity:0.6,lineHeight:1.4}}>{tool.desc}</div>
            </button>
          ))}

          {/* Status */}
          <div style={{marginTop:8,borderTop:"1px solid #1A2332",paddingTop:9}}>
            <div style={{fontSize:8,color:"#2A4060",letterSpacing:"0.12em",marginBottom:5,paddingLeft:2}}>LOADED</div>
            {DOC_TYPES.map(({id,label,color})=>(
              <div key={id} style={{display:"flex",alignItems:"center",gap:5,paddingLeft:2,marginBottom:3}}>
                <div style={{width:5,height:5,borderRadius:"50%",background:docs[id]?color:"#1A2332"}}/>
                <div style={{fontSize:8,color:docs[id]?color:"#2A4060"}}>{label}</div>
              </div>
            ))}
            {[["LinkedIn",linkedinUrl,"#00E5FF"],["Portfolio URL",portfolioUrl,"#FFD93D"],["JD",jd,"#A78BFA"],["Remote Pref",prefs.workMode,"#C084FC"]].map(([l,v,c])=>(
              <div key={l} style={{display:"flex",alignItems:"center",gap:5,paddingLeft:2,marginBottom:3}}>
                <div style={{width:5,height:5,borderRadius:"50%",background:v?c:"#1A2332"}}/>
                <div style={{fontSize:8,color:v?c:"#2A4060"}}>{l}{l==="Remote Pref"&&v?`: ${v}`:""}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Main ── */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

          {/* Collapsible panels */}
          <div style={{overflowY:"auto",flexShrink:0,maxHeight:"60vh"}}>
            {panel==="docs"     && <DocumentVault docs={docs} onDocsChange={setDocs} portfolioUrl={portfolioUrl} onPortfolioUrl={setPortfolioUrl} linkedinUrl={linkedinUrl} onLinkedinUrl={setLinkedinUrl} prefs={prefs} onPrefs={setPrefs}/>}
            {panel==="jd"       && <JDPanel jd={jd} onJDChange={setJd}/>}
            {panel==="deadlines"&& <DeadlineTracker deadlines={deadlines} onDeadlinesChange={setDeadlines}/>}
            {panel==="timeline" && <HiringTimeline jobQueue={jobQueue} onJobQueueChange={setJobQueue}/>}
            {panel==="benefits" && <BenefitsComparison jobQueue={jobQueue} prefs={prefs}/>}
            {panel==="queue"    && (
              <div style={{padding:"12px 16px",borderBottom:"1px solid #1A2332",background:"#060A0E"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                  <div style={{fontSize:9,color:"#FF6B35",letterSpacing:"0.15em"}}>◉ JOB TRACKER</div>
                  <button className="tb" onClick={()=>{const c=prompt("Company?");const r=prompt("Role?");if(c&&r)setJobQueue(prev=>[...prev,{id:Date.now(),company:c,role:r,status:"draft",fit:null,hiringStage:"Applied",timeline:[],confirmedBenefits:[],location:"",salary:"",equity:""}]);}} style={{fontSize:9,padding:"3px 9px",borderRadius:5,border:"1px solid #FF6B3544",color:"#FF6B35",background:"#FF6B3510",letterSpacing:"0.1em"}}>+ ADD</button>
                </div>
                <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:3}}>
                  {jobQueue.map(job=>(
                    <div key={job.id} style={{background:"#0D1520",border:"1px solid #1A2332",borderRadius:8,padding:"8px 11px",minWidth:150,flexShrink:0}}>
                      <div style={{fontSize:10,color:"#C0D0E0",marginBottom:2,fontWeight:500}}>{job.company}</div>
                      <div style={{fontSize:8,color:"#4A6480",marginBottom:2}}>{job.role}</div>
                      {job.location&&<div style={{fontSize:8,color:"#3A5470",marginBottom:4}}>📍 {job.location}</div>}
                      <select value={job.status} onChange={e=>setJobQueue(prev=>prev.map(j=>j.id===job.id?{...j,status:e.target.value}:j))}
                        style={{fontSize:8,background:"#080C10",border:"none",color:{draft:"#4A6480",applied:"#FFD93D",interview:"#69FF94",offer:"#FF6B35"}[job.status],outline:"none",cursor:"pointer"}}>
                        <option value="draft">DRAFT</option><option value="applied">APPLIED</option><option value="interview">INTERVIEW</option><option value="offer">OFFER</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Email Vault full view */}
          {activeTool==="emails" ? <EmailVault/> : (
            <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}} className="grid-bg">

              {/* Tool bar */}
              <div style={{padding:"9px 16px",borderBottom:"1px solid #1A2332",display:"flex",alignItems:"center",gap:7,background:"rgba(8,12,16,0.85)",flexWrap:"wrap"}}>
                <span style={{color:activeTool_.color,fontSize:13}}>{activeTool_.icon}</span>
                <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,letterSpacing:"0.06em"}}>{activeTool_.label.toUpperCase()}</span>
                {docsLoaded>0   &&<div style={{fontSize:8,color:"#69FF94",background:"#69FF9415",border:"1px solid #69FF9430",borderRadius:4,padding:"2px 6px"}}>{docsLoaded} DOCS</div>}
                {jd?.text       &&<div style={{fontSize:8,color:"#A78BFA",background:"#A78BFA15",border:"1px solid #A78BFA30",borderRadius:4,padding:"2px 6px"}}>JD ✓</div>}
                {linkedinUrl    &&<div style={{fontSize:8,color:"#00E5FF",background:"#00E5FF15",border:"1px solid #00E5FF30",borderRadius:4,padding:"2px 6px"}}>LI ✓</div>}
                {portfolioUrl   &&<div style={{fontSize:8,color:"#FFD93D",background:"#FFD93D15",border:"1px solid #FFD93D30",borderRadius:4,padding:"2px 6px"}}>Portfolio ✓</div>}
                {prefs.workMode &&<div style={{fontSize:8,color:"#C084FC",background:"#C084FC15",border:"1px solid #C084FC30",borderRadius:4,padding:"2px 6px"}}>{prefs.workMode}</div>}
              </div>

              {/* Hero */}
              {activeTool==="autoapply"&&currentMessages.length===0&&(
                <div style={{margin:"13px 16px 0",padding:"12px 14px",background:"#FF6B3510",border:"1px solid #FF6B3530",borderRadius:10}}>
                  <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,color:"#FF6B35",marginBottom:4}}>⚡ {(docsLoaded>0&&jd)?"READY — HIT ⌘+ENTER TO GENERATE":"SET UP PROFILE → ADD JD → GENERATE"}</div>
                  <div style={{fontSize:9,color:"#6A8AAA",lineHeight:1.6,marginBottom:7}}>Use ◈ MY DOCS to upload resume, cover letter, portfolio, LinkedIn & portfolio URLs, work preferences. Use ◎ ADD JD to add any job posting. Then generate instantly.</div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                    {["Headline","Summary","5 Bullets","Cover Letter","LinkedIn DM","Follow-Up","Checklist"].map(t=>(
                      <div key={t} style={{fontSize:8,padding:"2px 7px",borderRadius:20,border:"1px solid #FF6B3530",color:"#FF6B35",background:"#FF6B3508"}}>{t}</div>
                    ))}
                  </div>
                </div>
              )}
              {activeTool==="salary"&&currentMessages.length===0&&(
                <div style={{margin:"13px 16px 0",padding:"12px 14px",background:"#C084FC10",border:"1px solid #C084FC30",borderRadius:10}}>
                  <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,color:"#C084FC",marginBottom:4}}>◐ SALARY NEGOTIATION COACH</div>
                  <div style={{fontSize:9,color:"#6A8AAA",lineHeight:1.6}}>Share your offer: base salary, equity (shares/%), vesting schedule, signing bonus, company stage, level, and location. I'll give you exact counter-offer numbers, scripts, and negotiation tactics.</div>
                </div>
              )}
              {activeTool==="research"&&currentMessages.length===0&&(
                <div style={{margin:"13px 16px 0",padding:"12px 14px",background:"#34D39910",border:"1px solid #34D39930",borderRadius:10}}>
                  <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,color:"#34D399",marginBottom:4}}>◑ COMPANY INTELLIGENCE</div>
                  <div style={{fontSize:9,color:"#6A8AAA",lineHeight:1.6}}>Tell me a company name or paste the JD. I'll research their PM team, culture, hiring process, location/remote policy, benefits reputation, and what questions to ask.</div>
                </div>
              )}

              {/* Messages */}
              <div style={{flex:1,overflowY:"auto",padding:"16px"}}>
                {currentMessages.length===0&&!["autoapply","salary","research"].includes(activeTool)&&(
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:10,opacity:0.4}}>
                    <div style={{fontSize:32,color:activeTool_.color}}>{activeTool_.icon}</div>
                    <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,color:"#4A6480",letterSpacing:"0.1em"}}>{activeTool_.label.toUpperCase()}</div>
                    <div style={{fontSize:10,color:"#2A4060",textAlign:"center",maxWidth:230,lineHeight:1.6}}>{activeTool_.desc}.</div>
                  </div>
                )}
                {currentMessages.map((msg,i)=>(
                  <div key={i} className="msg-in" style={{marginBottom:14,display:"flex",justifyContent:msg.role==="user"?"flex-end":"flex-start"}}>
                    {msg.role==="assistant"&&<div style={{width:22,height:22,minWidth:22,background:`${activeTool_.color}20`,border:`1px solid ${activeTool_.color}44`,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:activeTool_.color,marginRight:6,marginTop:2}}>⬡</div>}
                    <div style={{maxWidth:msg.isPacket?"92%":"72%",width:msg.isPacket?"92%":"auto",padding:"10px 12px",borderRadius:msg.role==="user"?"9px 9px 2px 9px":"9px 9px 9px 2px",background:msg.role==="user"?`linear-gradient(135deg,${activeTool_.color}20,${activeTool_.color}0D)`:"#0D1520",border:`1px solid ${msg.role==="user"?activeTool_.color+"33":"#1A2332"}`,fontSize:12,lineHeight:1.7,color:msg.role==="user"?"#C8D8E8":"#A8B8CC",whiteSpace:msg.isPacket?"normal":"pre-wrap",wordBreak:"break-word"}}>
                      {msg.isPacket?<AutoApplyPacket text={msg.content} color={activeTool_.color}/>:msg.content}
                    </div>
                  </div>
                ))}
                {loading&&(
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}>
                    <div style={{width:22,height:22,background:`${activeTool_.color}20`,border:`1px solid ${activeTool_.color}44`,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:activeTool_.color}}>⬡</div>
                    <div style={{padding:"8px 14px",background:"#0D1520",border:"1px solid #1A2332",borderRadius:"9px 9px 9px 2px",display:"flex",gap:5,alignItems:"center"}}>
                      {[0,1,2].map(i=><div key={i} className="dot" style={{width:5,height:5,borderRadius:"50%",background:activeTool_.color}}/>)}
                    </div>
                  </div>
                )}
                <div ref={bottomRef}/>
              </div>

              {/* Input */}
              <div style={{padding:"10px 16px",borderTop:"1px solid #1A2332",background:"rgba(8,12,16,0.96)"}}>
                <div style={{display:"flex",gap:8,alignItems:"flex-end",background:"#0D1520",border:`1px solid ${input?activeTool_.color+"55":"#1A2332"}`,borderRadius:9,padding:"9px 11px",transition:"border-color 0.2s"}}>
                  <textarea ref={textareaRef} value={input} onChange={e=>setInput(e.target.value)}
                    onKeyDown={e=>{if(e.key==="Enter"&&(e.metaKey||e.ctrlKey))sendMessage();}}
                    placeholder={
                      activeTool==="autoapply" ? (jd?"JD loaded ✓ — add context or hit ⌘+Enter to generate":"Paste JD or use ◎ ADD JD above… (⌘+Enter)") :
                      activeTool==="salary"    ? "Share your offer: base, equity, company stage, level… (⌘+Enter)" :
                      activeTool==="research"  ? "Company name or paste the JD… (⌘+Enter)" :
                      `Ask your ${activeTool_.label.toLowerCase()} assistant… (⌘+Enter)`
                    }
                    rows={3} style={{flex:1,background:"transparent",border:"none",color:"#C8D8E8",fontSize:12,lineHeight:1.6,fontFamily:"inherit",letterSpacing:"0.02em"}}/>
                  <button onClick={sendMessage} disabled={!input.trim()||loading} style={{width:30,height:30,borderRadius:6,background:input.trim()&&!loading?activeTool_.color:"#1A2332",color:input.trim()&&!loading?"#080C10":"#2A4060",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s",flexShrink:0}}>↑</button>
                </div>
                <div style={{fontSize:9,color:"#161E28",marginTop:4,textAlign:"center",letterSpacing:"0.1em"}}>JOB APPLY · POWERED BY CLAUDE · SENIOR AI PM</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
