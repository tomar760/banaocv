/* ============================================================
   BanaoCV — assets/js/resume-export.js
   PDF + Word (.docx) Export
   ============================================================ */

'use strict';

const ResumeExport = {

  /* ── PDF Download ── */
  async downloadPDF() {
    const paper = document.getElementById('resume-paper');
    if (!paper) { window.RW?.Toast?.error('Resume paper nahi mila!'); return; }

    window.RW?.Toast?.info('PDF generate ho raha hai... ⏳');

    // Style for print
    const style = document.createElement('style');
    style.id = 'print-style';
    style.textContent = `
      @media print {
        body > *:not(#resume-paper-wrap) { display: none !important; }
        #navbar, #footer, .editor-bottom-bar,
        .mobile-tab-bar, .whatsapp-fab,
        .editor-left-panel, .editor-right-panel,
        .canvas-toolbar { display: none !important; }
        .editor-canvas-wrap {
          background: white !important;
          padding: 0 !important;
          overflow: visible !important;
        }
        #resume-paper {
          box-shadow: none !important;
          border-radius: 0 !important;
          transform: none !important;
          max-width: 100% !important;
          width: 100% !important;
          page-break-inside: avoid;
        }
        @page {
          size: A4;
          margin: 15mm;
        }
      }
    `;
    document.head.appendChild(style);

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        const s = document.getElementById('print-style');
        if (s) s.remove();
      }, 1000);
    }, 300);
  },

  /* ── Share Link ── */
  generateShareLink() {
    const code = Math.random().toString(36).substr(2, 8).toUpperCase();
    const link = `https://banaocv.in/r/${code}`;

    // Save to localStorage
    try {
      const links = JSON.parse(localStorage.getItem('rw_share_links') || '[]');
      links.push({ code, link, created: new Date().toISOString() });
      localStorage.setItem('rw_share_links', JSON.stringify(links));
    } catch(e) {}

    return link;
  },

  /* ── Copy resume text ── */
  copyResumeText() {
    const paper = document.getElementById('resume-paper');
    if (!paper) return;
    const text = paper.innerText;
    window.RW?.Clipboard?.copy(text, 'Resume text copy ho gaya!');
  },

  /* ── Get resume data as JSON ── */
  getResumeJSON() {
    return {
      name     : document.getElementById('disp-name')?.textContent?.trim()    || '',
      role     : document.getElementById('disp-role')?.textContent?.trim()    || '',
      summary  : document.getElementById('disp-summary')?.textContent?.trim() || '',
      skills   : window.state?.skills || [],
      exp      : document.getElementById('disp-experience')?.innerText?.trim() || '',
      edu      : document.getElementById('disp-education')?.innerText?.trim()  || '',
      projects : document.getElementById('disp-projects')?.innerText?.trim()   || '',
      exported : new Date().toISOString(),
    };
  },

  /* ── Save resume to localStorage ── */
  saveToLocal() {
    try {
      const data  = this.getResumeJSON();
      const saves = JSON.parse(localStorage.getItem('rw_resumes') || '[]');
      const idx   = saves.findIndex(r => r.name === data.name);
      if (idx >= 0) saves[idx] = { ...saves[idx], ...data, updated: new Date().toISOString() };
      else saves.push({ id: 'r-' + Date.now(), ...data, created: new Date().toISOString() });
      localStorage.setItem('rw_resumes', JSON.stringify(saves));
      return true;
    } catch(e) {
      return false;
    }
  },
};

/* ── Global functions ── */
window.downloadPDF      = () => ResumeExport.downloadPDF();
window.generateShareLink = () => {
  const link = ResumeExport.generateShareLink();
  const el   = document.getElementById('share-link-text');
  if (el) el.textContent = link;
  const wrap = document.getElementById('share-link-wrap');
  if (wrap) wrap.style.display = 'block';
  window.RW?.Toast?.success('Share link ready! 🔗');
  return link;
};

window.ResumeExport = ResumeExport;
window.RW = window.RW || {};
window.RW.Export = ResumeExport;
