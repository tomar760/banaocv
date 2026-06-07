/* ============================================================
   BanaoCV — backend/controllers/aiController.js
   AI Features Controller
   ============================================================ */

const { openai } = require('../config/openai');

const SYSTEM = `You are BanaoCV AI — an expert resume writer for Indian job seekers.
You understand Hindi and Hinglish input. Always return professional English output.
Be concise, ATS-friendly, and use strong action verbs.`;

exports.generateResume = async (req, res) => {
  try {
    const { hindiInput } = req.body;
    if (!hindiInput?.trim()) return res.status(400).json({ success: false, message: 'Input required' });

    const completion = await openai.chat.completions.create({
      model    : 'gpt-4o-mini',
      messages : [
        { role: 'system', content: SYSTEM },
        { role: 'user',   content: `Extract resume data from this Hindi/Hinglish description and return ONLY valid JSON:\n"${hindiInput}"\n\nJSON format: { firstName, lastName, role, summary, phone, email, location, skills[], experience[{title,company,start,end,bullets[]}], education[{degree,college,year,score}], projects[{name,desc,tech}] }` },
      ],
      max_tokens      : 1000,
      response_format : { type: 'json_object' },
    });

    const data = JSON.parse(completion.choices[0].message.content);
    res.json({ success: true, data });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.scoreResume = async (req, res) => {
  try {
    const { resumeText } = req.body;
    const completion = await openai.chat.completions.create({
      model    : 'gpt-4o-mini',
      messages : [
        { role: 'system', content: SYSTEM },
        { role: 'user',   content: `Score this resume and return ONLY JSON: { overall:75, breakdown:{content:80,ats:72,skills:68,formatting:90}, improvements:["tip1","tip2","tip3"], positive:"strong point" }\n\nResume:\n${resumeText}` },
      ],
      max_tokens      : 500,
      response_format : { type: 'json_object' },
    });
    const data = JSON.parse(completion.choices[0].message.content);
    res.json({ success: true, data });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.jdMatch = async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;
    const completion = await openai.chat.completions.create({
      model    : 'gpt-4o-mini',
      messages : [
        { role: 'system', content: SYSTEM },
        { role: 'user',   content: `Analyze JD match. Return ONLY JSON: { matchScore:72, foundKeywords:[], missingKeywords:[], suggestions:"Hinglish tips", summaryOptimized:"better summary" }\n\nResume: ${resumeText?.substring(0,500)}\nJD: ${jobDescription?.substring(0,800)}` },
      ],
      max_tokens      : 600,
      response_format : { type: 'json_object' },
    });
    const data = JSON.parse(completion.choices[0].message.content);
    res.json({ success: true, data });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.coverLetter = async (req, res) => {
  try {
    const { company, role, tone, resumeText } = req.body;
    const completion = await openai.chat.completions.create({
      model    : 'gpt-4o-mini',
      messages : [
        { role: 'system', content: `Write a ${tone || 'professional'} cover letter. Under 250 words. Start with "Dear Hiring Manager," End with "Sincerely,"` },
        { role: 'user',   content: `Company: ${company}, Role: ${role}\nResume context: ${resumeText?.substring(0,400)}` },
      ],
      max_tokens: 500,
    });
    res.json({ success: true, coverLetter: completion.choices[0].message.content });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.improvementTips = async (req, res) => {
  try {
    const { resumeText } = req.body;
    const completion = await openai.chat.completions.create({
      model    : 'gpt-4o-mini',
      messages : [
        { role: 'system', content: SYSTEM },
        { role: 'user',   content: `Give exactly 5 specific resume improvement tips in simple Hinglish. Number 1-5. Resume:\n${resumeText?.substring(0,500)}` },
      ],
      max_tokens: 400,
    });
    res.json({ success: true, tips: completion.choices[0].message.content });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
