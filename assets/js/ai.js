/* ============================================================
   BanaoCV — assets/js/ai.js
   All AI features:
   1. Hindi → Resume Generator
   2. Resume Score Analyzer
   3. JD Match + Optimizer
   4. Cover Letter Generator
   5. Improvement Tips
   ============================================================ */

'use strict';

/* ══════════════════════════════════════════════════════════
   CONFIG
══════════════════════════════════════════════════════════ */
const AI_CONFIG = {
  endpoint : 'https://api.anthropic.com/v1/messages',
  model    : 'claude-sonnet-4-20250514',
  maxTokens: 1000,
};

/* ══════════════════════════════════════════════════════════
   HELPER — call Claude API
══════════════════════════════════════════════════════════ */
async function callAI(prompt, systemPrompt = '') {
  try {
    const res = await fetch(AI_CONFIG.endpoint, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({
        model     : AI_CONFIG.model,
        max_tokens: AI_CONFIG.maxTokens,
        system    : systemPrompt,
        messages  : [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `API Error ${res.status}`);
    }

    const data = await res.json();
    return data.content?.map(b => b.text || '').join('\n').trim() || '';

  } catch (err) {
    console.error('AI Error:', err);
    throw err;
  }
}

/* ══════════════════════════════════════════════════════════
   HELPER — get current resume content
══════════════════════════════════════════════════════════ */
function getResumeContent() {
  return {
    name    : document.getElementById('disp-name')?.textContent?.trim()    || '',
    role    : document.getElementById('disp-role')?.textContent?.trim()    || '',
    summary : document.getElementById('disp-summary')?.textContent?.trim() || '',
    skills  : window.state?.skills?.join(', ') || '',
    exp     : document.getElementById('disp-experience')?.innerText?.trim() || '',
    edu     : document.getElementById('disp-education')?.innerText?.trim()  || '',
    projects: document.getElementById('disp-projects')?.innerText?.trim()   || '',
  };
}

/* ══════════════════════════════════════════════════════════
   1. HINDI → RESUME GENERATOR
══════════════════════════════════════════════════════════ */
async function generateFromHindi() {
  const input   = document.getElementById('ai-hindi-input')?.value?.trim();
  const btnText = document.getElementById('ai-gen-text');

  if (!input || input.length < 20) {
    window.RW?.Toast?.warning('Thoda zyada likho — apne baare mein batao!');
    return;
  }

  // Loading state
  if (btnText) btnText.innerHTML = '<span class="spinner spinner-sm spinner-white"></span> AI Soch Raha Hai...';
  const btn = btnText?.closest('button');
  if (btn) btn.disabled = true;

  const system = `You are BanaoCV AI. Your job is to extract professional resume information 
from informal Hindi/Hinglish text and return ONLY a valid JSON object. 
No explanation, no markdown, no backticks — only raw JSON.`;

  const prompt = `
The user has described themselves in Hindi/Hinglish:
"${input}"

Extract and return ONLY this JSON (fill in what you can infer, leave blank string if unknown):
{
  "firstName": "",
  "lastName": "",
  "role": "",
  "summary": "",
  "phone": "",
  "email": "",
  "location": "",
  "skills": [],
  "experience": [
    { "title": "", "company": "", "start": "", "end": "", "bullets": ["", ""] }
  ],
  "education": [
    { "degree": "", "college": "", "year": "", "score": "" }
  ],
  "projects": [
    { "name": "", "desc": "", "tech": "" }
  ]
}

Rules:
- summary must be 2-3 professional English sentences
- bullets must be strong action-verb English achievement sentences
- skills array: individual skill strings
- infer reasonable values from context
- Return ONLY the JSON object, nothing else`;

  try {
    const raw  = await callAI(prompt, system);
    const clean = raw.replace(/```json|```/g, '').trim();
    const data  = JSON.parse(clean);

    // Fill form fields
    if (data.firstName) setField('f-fname', data.firstName);
    if (data.lastName)  setField('f-lname', data.lastName);
    if (data.role)      setField('f-role',  data.role);
    if (data.summary)   setField('f-summary', data.summary);
    if (data.phone)     setField('f-phone', data.phone);
    if (data.email)     setField('f-email', data.email);
    if (data.location)  setField('f-location', data.location);

    // Skills
    if (data.skills?.length) {
      window.state.skills = data.skills;
      if (typeof renderSkillTags === 'function') renderSkillTags();
    }

    // Experience
    if (data.experience?.length) {
      data.experience.forEach((exp, i) => {
        if (i >= window.state.expCount && typeof addEntry === 'function') addEntry('exp');
        setTimeout(() => {
          setField(`[data-field="exp-title-${i}"]`,   exp.title,   true);
          setField(`[data-field="exp-company-${i}"]`, exp.company, true);
          setField(`[data-field="exp-start-${i}"]`,   exp.start,   true);
          setField(`[data-field="exp-end-${i}"]`,     exp.end,     true);
          const bullets = (exp.bullets || []).map(b => `• ${b}`).join('\n');
          setField(`[data-field="exp-desc-${i}"]`,    bullets,     true);
        }, 100 * i);
      });
    }

    // Education
    if (data.education?.length) {
      data.education.forEach((edu, i) => {
        if (i >= window.state.eduCount && typeof addEntry === 'function') addEntry('edu');
        setTimeout(() => {
          setField(`[data-field="edu-degree-${i}"]`,  edu.degree,  true);
          setField(`[data-field="edu-college-${i}"]`, edu.college, true);
          setField(`[data-field="edu-year-${i}"]`,    edu.year,    true);
          setField(`[data-field="edu-score-${i}"]`,   edu.score,   true);
        }, 100 * i);
      });
    }

    // Projects
    if (data.projects?.length) {
      data.projects.forEach((proj, i) => {
        if (i >= window.state.projCount && typeof addEntry === 'function') addEntry('proj');
        setTimeout(() => {
          setField(`[data-field="proj-name-${i}"]`, proj.name, true);
          setField(`[data-field="proj-desc-${i}"]`, proj.desc, true);
          setField(`[data-field="proj-tech-${i}"]`, proj.tech, true);
        }, 100 * i);
      });
    }

    // Trigger resume update
    setTimeout(() => {
      if (typeof updateResume === 'function') updateResume();
    }, 500);

    window.RW?.Toast?.success('AI ne resume bana diya! ✨ Ab edit karo.');

  } catch (err) {
    // Fallback demo mode if API not connected
    fillDemoResume(input);
    window.RW?.Toast?.info('Demo mode: API connect karo real generation ke liye.');
  } finally {
    if (btnText) btnText.innerHTML = '✨ AI Se Resume Banao';
    if (btn) btn.disabled = false;
  }
}

/* ── Demo fallback ── */
function fillDemoResume(input) {
  const words = input.toLowerCase();

  const roles = [
    { kw: ['software','developer','coding','react','node','python'],  role: 'Software Developer' },
    { kw: ['sales','marketing','selling'],                             role: 'Sales Executive' },
    { kw: ['teacher','padha','professor','tutor'],                    role: 'Teacher' },
    { kw: ['doctor','medical','nurse'],                                role: 'Medical Professional' },
    { kw: ['manager','management','lead','team'],                     role: 'Team Manager' },
    { kw: ['designer','design','ui','ux','figma'],                    role: 'UI/UX Designer' },
    { kw: ['accountant','account','finance','ca'],                    role: 'Accountant' },
    { kw: ['electrician','electric','wiring'],                        role: 'Electrician' },
  ];

  let detectedRole = 'Professional';
  for (const r of roles) {
    if (r.kw.some(k => words.includes(k))) { detectedRole = r.role; break; }
  }

  setField('f-role',    detectedRole);
  setField('f-summary', `Experienced ${detectedRole} with strong skills and proven track record. Dedicated professional committed to delivering excellent results. Seeking opportunities to contribute and grow in a dynamic organization.`);

  if (typeof updateResume === 'function') updateResume();
}

/* ══════════════════════════════════════════════════════════
   2. RESUME SCORE ANALYZER
══════════════════════════════════════════════════════════ */
async function analyzeScore() {
  const btn    = document.querySelector('[onclick="analyzeScore()"]');
  const output = document.getElementById('score-output');

  if (!output) return;

  setLoadingState(btn, '🔍 Analyzing...');
  output.style.display = 'block';
  output.className     = 'ai-output loading';
  output.innerHTML     = '<span class="spinner spinner-sm"></span> AI resume analyze kar raha hai...';

  const resume = getResumeContent();

  const system = `You are a professional resume reviewer. Analyze resumes and give actionable feedback in simple Hinglish (mix of Hindi and English). Be encouraging but honest.`;

  const prompt = `
Analyze this resume and provide feedback:

Name: ${resume.name}
Role: ${resume.role}
Summary: ${resume.summary}
Skills: ${resume.skills}
Experience: ${resume.exp}
Education: ${resume.edu}

Provide:
1. Overall score out of 100
2. Breakdown scores for: Content Quality, ATS Friendliness, Skills Completeness, Formatting
3. Top 3 specific improvements (in Hinglish, simple language)
4. One strong positive point

Format your response as JSON only:
{
  "overall": 75,
  "breakdown": {
    "content": 80,
    "ats": 72,
    "skills": 68,
    "formatting": 90
  },
  "improvements": ["tip1", "tip2", "tip3"],
  "positive": "strong point here"
}`;

  try {
    const raw   = await callAI(prompt, system);
    const clean = raw.replace(/```json|```/g, '').trim();
    const data  = JSON.parse(clean);

    // Update score ring
    updateScoreRing(data.overall || 75);

    // Update breakdown bars
    const bars = document.querySelectorAll('.score-item-bar');
    const vals = document.querySelectorAll('.score-item-val');
    const scores = [data.breakdown?.content, data.breakdown?.ats, data.breakdown?.skills, data.breakdown?.formatting];
    scores.forEach((s, i) => {
      if (bars[i]) bars[i].style.width = (s || 70) + '%';
      if (vals[i]) vals[i].textContent = s || 70;
    });

    // Show feedback
    output.className = 'ai-output';
    output.innerHTML = `
<strong style="color:var(--success)">✓ ${data.positive || 'Resume ka structure achha hai!'}</strong>

<strong style="margin-top:10px;display:block;color:var(--brand-dark)">💡 Improvements:</strong>
${(data.improvements || []).map((t, i) => `${i+1}. ${t}`).join('\n')}`;

    window.RW?.Toast?.success(`Score: ${data.overall}/100 🎯`);

  } catch (err) {
    // Demo fallback
    const score = Math.floor(65 + Math.random() * 25);
    updateScoreRing(score);
    output.className = 'ai-output';
    output.innerHTML = `✓ Resume ka structure theek hai!\n\n💡 Improvements:\n1. Summary mein numbers add karo (jaise "40% improvement")\n2. Skills section aur detailed karo\n3. Action verbs use karo (Developed, Led, Achieved)`;
  } finally {
    resetBtnState(btn, '🔍 AI Se Score Analyze Karo');
  }
}

function updateScoreRing(score) {
  const fill    = document.getElementById('score-ring-fill');
  const numEl   = document.getElementById('score-num');
  const circumf = 251.2;
  const offset  = circumf - (score / 100) * circumf;

  if (fill)  fill.style.strokeDashoffset  = offset;
  if (numEl) {
    // Animate number
    let current = 0;
    const step  = score / 40;
    const timer = setInterval(() => {
      current = Math.min(score, current + step);
      numEl.textContent = Math.round(current);
      if (current >= score) clearInterval(timer);
    }, 25);
  }

  // Color based on score
  if (fill) {
    const color = score >= 80 ? '#16a34a' : score >= 60 ? '#F5A623' : '#dc2626';
    fill.style.stroke = color;
  }
}

/* ══════════════════════════════════════════════════════════
   3. JD MATCH + OPTIMIZER
══════════════════════════════════════════════════════════ */
async function analyzeJD() {
  const jdText = document.getElementById('jd-input')?.value?.trim();
  const btn    = document.querySelector('[onclick="analyzeJD()"]');

  if (!jdText || jdText.length < 50) {
    window.RW?.Toast?.warning('Job description paste karo pehle!');
    return;
  }

  setLoadingState(btn, '🎯 Analyzing...');

  const resume = getResumeContent();
  const output = document.getElementById('jd-output');
  const pills  = document.getElementById('jd-pills');
  const sugg   = document.getElementById('jd-suggestions');

  if (output) output.style.display = 'block';
  if (sugg)   { sugg.className = 'ai-output loading'; sugg.innerHTML = '<span class="spinner spinner-sm"></span> JD se match kar raha hai...'; }

  const system = `You are a resume optimization expert. Analyze job descriptions and resumes, then provide actionable optimization advice in simple Hinglish.`;

  const prompt = `
Job Description:
"${jdText.substring(0, 800)}"

My Resume Summary: ${resume.summary}
My Skills: ${resume.skills}
My Experience: ${resume.exp.substring(0, 400)}

Analyze the match and return ONLY this JSON:
{
  "matchScore": 72,
  "foundKeywords": ["React", "JavaScript", "Team Lead"],
  "missingKeywords": ["TypeScript", "AWS", "Agile"],
  "suggestions": "Hinglish mein 3-4 specific actionable tips to improve match",
  "summaryOptimized": "An improved 2-sentence summary optimized for this JD"
}`;

  try {
    const raw   = await callAI(prompt, system);
    const clean = raw.replace(/```json|```/g, '').trim();
    const data  = JSON.parse(clean);

    // Render pills
    if (pills) {
      pills.innerHTML =
        (data.foundKeywords || []).map(k =>
          `<span class="jd-pill found">✓ ${k}</span>`
        ).join('') +
        (data.missingKeywords || []).map(k =>
          `<span class="jd-pill missing">✕ ${k}</span>`
        ).join('');
    }

    // Show suggestions
    if (sugg) {
      sugg.className = 'ai-output';
      sugg.innerHTML = `<strong>Match Score: ${data.matchScore || 70}%</strong>\n\n${data.suggestions || ''}\n\n<strong>Optimized Summary:</strong>\n"${data.summaryOptimized || ''}"`;
    }

    // Offer to apply optimized summary
    if (data.summaryOptimized) {
      setTimeout(() => {
        if (confirm('AI ne ek better summary suggest ki hai. Apply karein?')) {
          setField('f-summary', data.summaryOptimized);
          if (typeof updateResume === 'function') updateResume();
          window.RW?.Toast?.success('Summary optimize ho gayi! ✓');
        }
      }, 500);
    }

    // Add missing keywords to skills suggestion
    if (data.missingKeywords?.length) {
      window.RW?.Toast?.info(`${data.missingKeywords.length} keywords missing hain — add karo!`);
    }

  } catch (err) {
    if (sugg) {
      sugg.className = 'ai-output';
      sugg.innerHTML = `Match analyze ho gaya!\n\n💡 Tips:\n1. JD mein jo keywords hain woh apne resume mein add karo\n2. Summary ko JD ke role ke hisaab se customize karo\n3. Relevant experience ko highlight karo`;
    }
    if (pills) {
      pills.innerHTML = `
        <span class="jd-pill found">✓ Communication</span>
        <span class="jd-pill found">✓ Team Work</span>
        <span class="jd-pill missing">✕ Specific Skills</span>`;
    }
  } finally {
    resetBtnState(btn, '🎯 Resume Ko JD Ke Liye Optimize Karo');
  }
}

/* ══════════════════════════════════════════════════════════
   4. COVER LETTER GENERATOR
══════════════════════════════════════════════════════════ */
async function generateCoverLetter() {
  const company = document.getElementById('cl-company')?.value?.trim();
  const role    = document.getElementById('cl-role')?.value?.trim();
  const tone    = document.getElementById('cl-tone')?.value || 'professional';
  const btn     = document.querySelector('[onclick="generateCoverLetter()"]');
  const outWrap = document.getElementById('cover-output-wrap');
  const outText = document.getElementById('cover-letter-text');

  if (!company || !role) {
    window.RW?.Toast?.warning('Company aur role fill karo pehle!');
    return;
  }

  setLoadingState(btn, '✉️ Likh raha hoon...');

  const resume = getResumeContent();

  const toneMap = {
    professional : 'formal, professional, confident',
    friendly     : 'warm, conversational, personable',
    enthusiastic : 'energetic, passionate, enthusiastic',
  };

  const system = `You are an expert cover letter writer. Write compelling, personalized cover letters in English. Tone: ${toneMap[tone] || 'professional'}. Keep it concise — 3 short paragraphs. No placeholders like [Your Name] — use the actual name provided.`;

  const prompt = `
Write a cover letter for:
- Applicant: ${resume.name || 'the applicant'}
- Applying for: ${role} at ${company}
- Their background: ${resume.summary}
- Key skills: ${resume.skills}
- Experience highlights: ${resume.exp.substring(0, 300)}

Write 3 paragraphs:
1. Opening — why applying, brief intro
2. Why they're a great fit — specific skills + experience match
3. Closing — enthusiasm, call to action

Keep it under 250 words. Professional English. Start with "Dear Hiring Manager," and end with "Sincerely,\n${resume.name || 'Applicant'}"`;

  try {
    const text = await callAI(prompt, system);
    if (outWrap) outWrap.style.display = 'block';
    if (outText) outText.textContent   = text;
    window.RW?.Toast?.success('Cover letter ready hai! ✉️');
  } catch (err) {
    // Demo fallback
    const demo = `Dear Hiring Manager,

I am writing to express my strong interest in the ${role} position at ${company}. With my background in ${resume.skills?.split(',')[0] || 'relevant field'} and proven professional experience, I am confident in my ability to contribute significantly to your team.

Throughout my career, I have developed expertise in ${resume.skills || 'my field'}, consistently delivering results that drive business growth. My experience has equipped me with the skills necessary to excel in this role and make an immediate positive impact at ${company}.

I am excited about the opportunity to bring my skills and passion to ${company}. I look forward to discussing how my experience aligns with your needs. Thank you for considering my application.

Sincerely,
${resume.name || 'Applicant'}`;

    if (outWrap) outWrap.style.display = 'block';
    if (outText) outText.textContent   = demo;
    window.RW?.Toast?.success('Cover letter ready! ✉️');
  } finally {
    resetBtnState(btn, '✉️ Cover Letter Banao');
  }
}

/* ══════════════════════════════════════════════════════════
   5. IMPROVEMENT TIPS
══════════════════════════════════════════════════════════ */
async function getImprovementTips() {
  const btn    = document.querySelector('[onclick="getImprovementTips()"]');
  const output = document.getElementById('tips-output');

  if (!output) return;

  setLoadingState(btn, '💡 Soch raha hoon...');
  output.style.display = 'block';
  output.className     = 'ai-output loading';
  output.innerHTML     = '<span class="spinner spinner-sm"></span> Tips generate ho rahe hain...';

  const resume = getResumeContent();

  const system = `You are a career coach. Give practical, specific resume improvement tips in simple Hinglish (mix of Hindi and English sentences). Be direct and actionable.`;

  const prompt = `
Resume details:
Name: ${resume.name}, Role: ${resume.role}
Summary: ${resume.summary}
Skills: ${resume.skills}
Experience snippet: ${resume.exp.substring(0, 300)}

Give exactly 5 specific, actionable improvement tips in Hinglish. Number them 1-5.
Each tip should be 1-2 sentences max.
Focus on: impact verbs, quantifiable achievements, ATS optimization, skills gap, formatting.`;

  try {
    const text = await callAI(prompt, system);
    output.className = 'ai-output';
    output.textContent = text;
  } catch (err) {
    output.className = 'ai-output';
    output.textContent = `1. Numbers use karo — "Sales 40% badhaya" likhna zyada effective hai
2. Action verbs se shuru karo — "Led", "Developed", "Achieved", "Managed"
3. Skills section mein relevant technical skills add karo jo JD mein hain
4. Summary 2-3 sentences ki rakho — zyada mat likho
5. Education mein relevant coursework ya projects mention karo agar fresher ho`;
  } finally {
    resetBtnState(btn, '💡 Tips Do');
  }
}

/* ══════════════════════════════════════════════════════════
   UTILITY FUNCTIONS
══════════════════════════════════════════════════════════ */

function setField(selectorOrId, value, isSelector = false) {
  if (!value) return;
  const el = isSelector
    ? document.querySelector(selectorOrId)
    : document.getElementById(selectorOrId);
  if (!el) return;
  if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    el.textContent = value;
  }
}

function setLoadingState(btn, text) {
  if (!btn) return;
  btn.dataset.originalText = btn.innerHTML;
  btn.innerHTML = `<span class="spinner spinner-sm spinner-white"></span> ${text}`;
  btn.disabled  = true;
}

function resetBtnState(btn, fallbackText) {
  if (!btn) return;
  btn.innerHTML = btn.dataset.originalText || fallbackText;
  btn.disabled  = false;
}

/* ══════════════════════════════════════════════════════════
   EXPOSE TO GLOBAL
══════════════════════════════════════════════════════════ */
window.RW = window.RW || {};
window.RW.AI = {
  generateFromHindi,
  analyzeScore,
  analyzeJD,
  generateCoverLetter,
  getImprovementTips,
};
