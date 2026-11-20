/* ICP Creative Studio — Core Engine (Auth, AI Provider Center, Ideas, Writing, Library, Brand Brain, Portal) */
const STUDIO_FIREBASE_CONFIG = Object.freeze({
  apiKey: 'AIzaSyA5tQEc0yf544hQ0buVmaNG32rStH0UYHQ',
  authDomain: 'icp-youth-circle-1ce3d.firebaseapp.com',
  projectId: 'icp-youth-circle-1ce3d',
  appId: '1:116078667555:web:7707153d9667bf8fd88e96'
});
const STUDIO_API_URL = 'https://script.google.com/macros/s/AKfycbwfIALyzy8rVPAyIyTj-RkFdjX5f92uaVpESOGHrBIsnsFQLH14uoYeAdggXKNEhQUo/exec';

const STORAGE_KEYS = Object.freeze({
  brand: 'icp_cs_brand_v2',
  library: 'icp_cs_library_v2',
  aiHistory: 'icp_cs_ai_history_v2',
  providerPrefs: 'icp_cs_provider_prefs_v2',
  theme: 'icp_cs_theme_v2'
});

const VIEW_META = Object.freeze({
  dashboard: ['Creative Command Center', 'Real-time portal metrics, AI provider status & creative workflows'],
  ai: ['AI Provider Center', 'Switch between OpenAI and Google Gemini models securely via your backend'],
  ideas: ['Ideas Studio', 'Generate structured campaigns, calendars, headlines & save to library'],
  writing: ['Writing Studio', 'Draft, improve, expand, shorten & publish directly to ICP Youth Circle'],
  design: ['Advanced Design Studio', 'Structured editable canvas, drag-and-drop layers, AI artwork, MCQ & 5-slide carousels'],
  library: ['Creative Library', 'Centralized folders for editable designs, generated images, writing & ideas'],
  brand: ['Brand Brain', 'Central ICP Youth Circle identity automatically injected into AI & templates'],
  pdf: ['Upload Student PDF', 'Direct Google Drive upload & publishing to ICP Resources'],
  portal: ['Portal Manager', 'Search, inspect & archive live Google Sheets records']
});

const StudioApp = {
  auth: null,
  sdk: null,
  session: null,
  studioConfig: null,
  publishingLog: [],
  lastIdeasText: '',
  brandLogoData: 'assets/icp-logo-navy-gold.png',

  // ---------- Helpers ----------
  esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },
  setMsg(id, msg, type = '') {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = 'status-msg' + (type ? ' ' + type : '');
    el.textContent = msg || '';
  },
  async apiPost(action, body = {}, timeoutMs = 90000) {
    if (!this.auth || !this.auth.currentUser) throw new Error('Administrator sign-in required.');
    const idToken = await this.auth.currentUser.getIdToken();
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(STUDIO_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify({ ...body, action, idToken }),
        signal: ctrl.signal,
        redirect: 'follow'
      });
      if (!res.ok) throw new Error('HTTP ' + res.status + ' from portal backend.');
      const json = await res.json();
      if (!json.success) {
        const err = new Error((json.error && json.error.message) || 'Backend request failed.');
        err.code = json.error && json.error.code;
        throw err;
      }
      return json.data;
    } catch (err) {
      if (err.name === 'AbortError') throw new Error('The request timed out. Please retry.');
      throw err;
    } finally { clearTimeout(timer); }
  },
  async apiGetConfig() {
    const res = await fetch(STUDIO_API_URL + '?action=aiAssistantConfig', { cache: 'no-store', redirect: 'follow' });
    if (!res.ok) throw new Error('Could not reach backend.');
    const json = await res.json();
    return json.success ? json.data : null;
  },

  // ---------- Auth ----------
  async signIn() {
    const btn = document.getElementById('signInBtn');
    const st = document.getElementById('authStatus');
    btn.disabled = true;
    st.className = 'auth-status';
    st.textContent = 'Opening Google administrator sign-in...';
    try {
      const [appSDK, authSDK] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js')
      ]);
      const app = appSDK.initializeApp(STUDIO_FIREBASE_CONFIG, 'icp-creative-studio');
      const auth = authSDK.getAuth(app);
      await authSDK.setPersistence(auth, authSDK.inMemoryPersistence);
      this.auth = auth;
      this.sdk = authSDK;
      await authSDK.signInWithPopup(auth, new authSDK.GoogleAuthProvider());
      st.textContent = 'Verifying Active administrator permissions...';
      this.session = await this.apiPost('adminSession');
      document.getElementById('authGate').style.display = 'none';
      document.getElementById('studioShell').classList.add('is-ready');
      this.bootWorkspace();
    } catch (err) {
      if (this.auth && this.sdk) { try { await this.sdk.signOut(this.auth); } catch (_) {} }
      st.className = 'auth-status is-error';
      st.textContent = err.message || 'Administrator sign-in failed.';
      btn.disabled = false;
    }
  },
  async signOut() {
    if (this.auth && this.sdk) await this.sdk.signOut(this.auth);
    location.reload();
  },

  // ---------- Initialization & Theme ----------
  initTheme() {
    const saved = localStorage.getItem(STORAGE_KEYS.theme) || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    const btn = document.getElementById('themeToggleBtn');
    if (btn) btn.textContent = saved === 'dark' ? 'Light Mode' : 'Dark Mode';
  },
  toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(STORAGE_KEYS.theme, next);
    document.getElementById('themeToggleBtn').textContent = next === 'dark' ? 'Light Mode' : 'Dark Mode';
  },
  async bootWorkspace() {
    const email = this.session.email || 'Admin';
    const role = this.session.role || 'Administrator';
    document.getElementById('adminProfileChip').textContent = email + ' · ' + role;
    document.getElementById('dashWelcome').textContent = 'Welcome, ' + email.split('@')[0];
    document.getElementById('dashProfileMeta').textContent = `${email} · ${role} · Connected to ICP Youth Circle Production Backend`;

    this.loadProviderPrefs();
    this.loadBrandBrainLocal();
    this.populatePortalTables();
    this.renderAiHistory();
    this.renderLibrary();
    this.refreshDashboardStats();

    if (window.DesignStudio) window.DesignStudio.init();

    // Non-blocking cloud sync for Studio v2 backend endpoints (if Code.gs has been redeployed)
    this.refreshSystemStatus();
    this.syncBrandFromBackend();
    this.syncLibraryFromBackend(true);
  },

  switchView(viewKey) {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === viewKey));
    document.querySelectorAll('.view-panel').forEach(p => p.classList.toggle('active', p.id === 'view-' + viewKey));
    const meta = VIEW_META[viewKey] || ['ICP Creative Studio', ''];
    document.getElementById('viewTitle').textContent = meta[0];
    document.getElementById('viewSubtitle').textContent = meta[1];
    document.getElementById('studioSidebar').classList.remove('open');

    if (viewKey === 'dashboard') this.refreshDashboardStats();
    if (viewKey === 'library') this.renderLibrary();
    if (viewKey === 'design' && window.DesignStudio) window.DesignStudio.render();
    if (viewKey === 'portal' && !document.getElementById('portalTableWrap').innerHTML) this.loadPortalTable();
  },

  quickWorkflow(kind) {
    if (kind === 'mcq') {
      this.switchView('design');
      document.getElementById('designTemplateSelect').value = 'mcq';
      window.DesignStudio.loadTemplate('mcq');
    } else if (kind === 'carousel') {
      this.switchView('design');
      document.getElementById('designTemplateSelect').value = 'carousel';
      window.DesignStudio.loadTemplate('carousel');
    } else if (kind === 'scholarship') {
      this.switchView('writing');
      document.getElementById('writeFormat').value = 'Scholarship Announcement';
      document.getElementById('writePubTable').value = 'SCHOLARSHIPS';
    }
  },

  // ---------- System & AI Provider Status (Real Data Only) ----------
  async refreshSystemStatus() {
    const pill = document.getElementById('topAiStatusPill');
    const box = document.getElementById('dashSystemStatus');
    try {
      // Try upgraded studioConfig first
      const cfg = await this.apiPost('studioConfig', {}, 25000);
      this.studioConfig = cfg;
      const activeList = cfg.providers || [];
      pill.className = activeList.length ? 'pill pill-green' : 'pill pill-red';
      pill.innerHTML = `<span class="dot"></span> ${activeList.length ? 'AI Live: ' + activeList.join(' + ') : 'AI Keys Not Enabled'}`;
      box.innerHTML = `
        <div style="display:grid;gap:8px;">
          <div><strong>OpenAI:</strong> ${cfg.openai.enabled ? '<span class="pill pill-green">Connected (' + this.esc(cfg.openai.defaultModel) + ')</span>' : '<span class="pill pill-red">Disabled / Missing Key</span>'}</div>
          <div><strong>Google Gemini:</strong> ${cfg.gemini.enabled ? '<span class="pill pill-green">Connected (' + this.esc(cfg.gemini.defaultModel) + ')</span>' : '<span class="pill pill-red">Disabled / Missing Key</span>'}</div>
          <div><strong>Creative Studio Backend:</strong> <span class="pill pill-green">v2 Endpoints Active (Image Gen + Cloud Library)</span></div>
          <div><strong>Firebase &amp; Sheets Auth:</strong> <span class="pill pill-green">Verified (${this.esc(cfg.adminEmail)})</span></div>
        </div>`;
    } catch (_) {
      // Graceful fallback to existing aiAssistantConfig if Code.gs has not been redeployed yet
      try {
        const legacy = await this.apiGetConfig();
        const activeList = (legacy && legacy.availableProviders) || [];
        pill.className = activeList.length ? 'pill pill-green' : 'pill pill-red';
        pill.innerHTML = `<span class="dot"></span> ${activeList.length ? 'AI Live: ' + activeList.join(' + ') : 'AI Not Enabled'}`;
        box.innerHTML = `
          <div style="display:grid;gap:8px;">
            <div><strong>Active AI Providers:</strong> ${activeList.length ? '<span class="pill pill-green">' + this.esc(activeList.join(', ')) + '</span>' : '<span class="pill pill-red">None Configured</span>'}</div>
            <div><strong>Creative Studio Backend:</strong> <span class="pill">Standard Mode (Redeploy backend/Code.gs to unlock AI Image Gen &amp; Cloud Library Sync)</span></div>
            <div><strong>Portal Auth &amp; Publishing:</strong> <span class="pill pill-green">Connected</span></div>
          </div>`;
      } catch (e2) {
        pill.className = 'pill pill-red';
        pill.innerHTML = '<span class="dot"></span> Backend Unreachable';
        box.textContent = 'Unable to reach Apps Script backend: ' + e2.message;
      }
    }
  },

  // ---------- AI Provider Center ----------
  loadProviderPrefs() {
    const prefs = JSON.parse(localStorage.getItem(STORAGE_KEYS.providerPrefs) || '{}');
    if (prefs.provider) document.getElementById('aiProviderSelect').value = prefs.provider;
    if (prefs.textModel) document.getElementById('aiTextModelSelect').value = prefs.textModel;
    if (prefs.imageProvider) document.getElementById('aiImageProviderSelect').value = prefs.imageProvider;
    if (prefs.imageModel) document.getElementById('aiImageModelSelect').value = prefs.imageModel;
  },
  onProviderChange() {
    const p = document.getElementById('aiProviderSelect').value;
    const modelSel = document.getElementById('aiTextModelSelect');
    if (p === 'OpenAI' && modelSel.value.startsWith('gemini')) modelSel.value = 'gpt-5.4-mini';
    if (p === 'Gemini' && modelSel.value.startsWith('gpt')) modelSel.value = 'gemini-3.8-flash';
  },
  saveProviderPrefs() {
    const prefs = {
      provider: document.getElementById('aiProviderSelect').value,
      textModel: document.getElementById('aiTextModelSelect').value,
      imageProvider: document.getElementById('aiImageProviderSelect').value,
      imageModel: document.getElementById('aiImageModelSelect').value
    };
    localStorage.setItem(STORAGE_KEYS.providerPrefs, JSON.stringify(prefs));
    this.setMsg('aiProviderStatusMsg', `Saved: ${prefs.provider} (${prefs.textModel}) · Images: ${prefs.imageProvider} (${prefs.imageModel})`, 'ok');
  },
  getProviderPrefs() {
    return {
      provider: document.getElementById('aiProviderSelect').value || 'Auto',
      textModel: document.getElementById('aiTextModelSelect').value || 'gemini-3.8-flash',
      imageProvider: document.getElementById('aiImageProviderSelect').value || 'Auto',
      imageModel: document.getElementById('aiImageModelSelect').value || 'gpt-image-1'
    };
  },

  async runAiText(prompt, taskType = 'creative', variations = 1) {
    const prefs = this.getProviderPrefs();
    const brandContext = this.getBrandPromptBlock();
    let result;
    try {
      result = await this.apiPost('studioGenerateText', {
        prompt, taskType, variations,
        provider: prefs.provider,
        model: prefs.textModel,
        brandContext
      });
    } catch (err) {
      // Fallback to existing aiChat endpoint if Code.gs hasn't been redeployed yet
      if (err.code === 'BAD_REQUEST' || /Unknown action/i.test(err.message)) {
        const reqId = (crypto && crypto.randomUUID) ? crypto.randomUUID() : ('cs-' + Date.now());
        const chatRes = await this.apiPost('aiChat', {
          message: `Brand Context:\n${brandContext}\n\nTask (${taskType}):\n${prompt}` + (variations > 1 ? `\n\nProvide ${variations} distinct variations.` : ''),
          provider: prefs.provider,
          mode: 'Explain',
          language: 'English',
          verifiedOnly: false,
          requestId: reqId
        });
        result = {
          provider: (chatRes.message && chatRes.message.payload && chatRes.message.payload.provider) || prefs.provider,
          model: prefs.textModel,
          text: (chatRes.message && chatRes.message.content) || '',
          generatedAt: new Date().toISOString()
        };
      } else {
        throw err;
      }
    }
    this.logAiHistory({ taskType, provider: result.provider, model: result.model, prompt: prompt.slice(0, 140), at: result.generatedAt || new Date().toISOString() });
    this.refreshDashboardStats();
    return result;
  },

  async runAiImage(prompt, size = '1024x1024') {
    const prefs = this.getProviderPrefs();
    const res = await this.apiPost('studioGenerateImage', {
      prompt, size,
      provider: prefs.imageProvider,
      model: prefs.imageModel
    }, 120000);
    this.logAiHistory({ taskType: 'image', provider: res.provider, model: res.model, prompt: prompt.slice(0, 140), at: res.generatedAt || new Date().toISOString() });
    this.refreshDashboardStats();
    return res;
  },

  async runPlayground(mode) {
    const rawPrompt = document.getElementById('aiPlaygroundPrompt').value.trim();
    if (!rawPrompt) { this.setMsg('aiPlaygroundMsg', 'Enter a prompt first.', 'err'); return; }
    const variations = Number(document.getElementById('aiPlaygroundVariations').value || 1);
    const prompt = mode === 'enhance'
      ? `Rewrite and enhance this prompt into a vivid, clear, high-impact creative prompt for ICP Youth Circle:\n"${rawPrompt}"`
      : rawPrompt;
    this.setMsg('aiPlaygroundMsg', 'Running live AI request...', 'info');
    try {
      const res = await this.runAiText(prompt, mode === 'enhance' ? 'prompt-enhance' : 'playground', variations);
      document.getElementById('aiPlaygroundOutput').value = res.text;
      if (mode === 'enhance') document.getElementById('aiPlaygroundPrompt').value = res.text;
      this.setMsg('aiPlaygroundMsg', `Completed via ${res.provider} (${res.model}).`, 'ok');
    } catch (err) {
      this.setMsg('aiPlaygroundMsg', 'AI Error: ' + err.message, 'err');
    }
  },

  logAiHistory(entry) {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.aiHistory) || '[]');
    list.unshift(entry);
    localStorage.setItem(STORAGE_KEYS.aiHistory, JSON.stringify(list.slice(0, 50)));
    this.renderAiHistory();
  },
  renderAiHistory() {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.aiHistory) || '[]');
    const el = document.getElementById('aiHistoryList');
    if (!list.length) { el.innerHTML = '<p class="muted">No AI generations recorded yet.</p>'; return; }
    el.innerHTML = list.slice(0, 15).map(item => `
      <div class="layer-item" style="cursor:default;">
        <div style="flex:1;min-width:0;">
          <strong>${this.esc(item.taskType)}</strong> · <span class="pill pill-blue">${this.esc(item.provider)}</span>
          <div class="muted" style="font-size:0.76rem;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${this.esc(item.prompt)}</div>
        </div>
        <span class="muted" style="font-size:0.72rem;">${new Date(item.at).toLocaleTimeString()}</span>
      </div>`).join('');
  },
  clearAiHistory() {
    localStorage.removeItem(STORAGE_KEYS.aiHistory);
    this.renderAiHistory();
    this.refreshDashboardStats();
  },

  // ---------- Ideas Studio ----------
  async generateIdeas() {
    const cat = document.getElementById('ideasCategory').value;
    const topic = document.getElementById('ideasTopic').value.trim() || 'Pakistani FSc, MDCAT & University Students';
    const count = document.getElementById('ideasCount').value;
    const btn = document.getElementById('btnIdeasGenerate');
    btn.disabled = true;
    this.setMsg('ideasStatusMsg', `Generating ${count} ${cat} via live AI...`, 'info');
    try {
      const prompt = `Generate ${count} structured "${cat}" for ICP Youth Circle focused on "${topic}". For each idea include: 1) Title, 2) Why it matters, 3) Target Audience, 4) Suggested Format, 5) Hook/Headline, and 6) Call-to-Action.`;
      const res = await this.runAiText(prompt, 'ideas', 1);
      this.lastIdeasText = res.text;
      document.getElementById('ideasOutput').innerHTML = `
        <div class="item-card">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
            <span class="pill pill-green">${this.esc(res.provider)} · ${this.esc(cat)}</span>
            <div style="display:flex;gap:6px;">
              <button class="btn btn-secondary btn-sm" onclick="StudioApp.sendIdeasToWriting()">Send to Writing →</button>
              <button class="btn btn-outline btn-sm" onclick="StudioApp.saveIdeasBatch()">Save Idea</button>
            </div>
          </div>
          <div style="white-space:pre-wrap;font-size:0.86rem;line-height:1.65;margin-top:8px;">${this.esc(res.text)}</div>
        </div>`;
      this.setMsg('ideasStatusMsg', `Generated via ${res.provider} (${res.model}).`, 'ok');
    } catch (err) {
      this.setMsg('ideasStatusMsg', 'Error: ' + err.message, 'err');
    } finally { btn.disabled = false; }
  },
  sendIdeasToWriting() {
    if (!this.lastIdeasText) return;
    document.getElementById('writeTitle').value = document.getElementById('ideasTopic').value.trim() || document.getElementById('ideasCategory').value;
    document.getElementById('writeBrief').value = this.lastIdeasText.slice(0, 1200);
    this.switchView('writing');
  },
  saveIdeasBatch() {
    if (!this.lastIdeasText) { this.setMsg('ideasStatusMsg', 'Generate ideas first before saving.', 'err'); return; }
    const cat = document.getElementById('ideasCategory').value;
    const topic = document.getElementById('ideasTopic').value.trim() || cat;
    this.saveLibraryItem({
      Type: 'idea',
      Folder: 'Campaigns',
      Title: `${cat}: ${topic}`,
      PayloadJSON: JSON.stringify({ category: cat, topic, text: this.lastIdeasText }),
      PreviewData: ''
    });
    this.setMsg('ideasStatusMsg', 'Saved to Creative Library!', 'ok');
  },

  // ---------- Writing Studio ----------
  async generateWriting(actionType) {
    const format = document.getElementById('writeFormat').value;
    const tone = document.getElementById('writeTone').value;
    const title = document.getElementById('writeTitle').value.trim();
    const brief = document.getElementById('writeBrief').value.trim();
    const current = document.getElementById('writeEditor').value.trim();
    const url = document.getElementById('writeOfficialUrl').value.trim();

    let prompt = '';
    if (actionType === 'create') {
      if (!title && !brief) { this.setMsg('writeStatusMsg', 'Enter a Title or Key Details first.', 'err'); return; }
      prompt = `Write a publication-ready "${format}" in a "${tone}" tone.\nTitle/Topic: ${title}\nKey Details: ${brief}\nOfficial URL: ${url || this.getBrand().url}`;
    } else {
      if (!current) { this.setMsg('writeStatusMsg', 'Write or generate text in the editor first.', 'err'); return; }
      const verb = actionType === 'improve' ? 'Rewrite and elevate the clarity, hook, and professionalism of' : actionType === 'expand' ? 'Expand with helpful structured detail (without inventing unverified dates or facts)' : 'Shorten into a punchy, concise version of';
      prompt = `${verb} this "${format}" using a "${tone}" tone:\n\n${current}`;
    }

    const btn = document.getElementById('btnWriteGenerate');
    btn.disabled = true;
    this.setMsg('writeStatusMsg', 'Generating with live AI...', 'info');
    try {
      const res = await this.runAiText(prompt, 'writing-' + actionType, 1);
      document.getElementById('writeEditor').value = res.text;
      this.setMsg('writeStatusMsg', `Draft ready via ${res.provider} (${res.model}).`, 'ok');
    } catch (err) {
      this.setMsg('writeStatusMsg', 'Error: ' + err.message, 'err');
    } finally { btn.disabled = false; }
  },
  copyWriting() {
    const val = document.getElementById('writeEditor').value;
    if (!val) return;
    navigator.clipboard.writeText(val);
    this.setMsg('writeStatusMsg', 'Copied to clipboard.', 'ok');
  },
  exportWriting(ext) {
    const val = document.getElementById('writeEditor').value;
    if (!val) return;
    const title = (document.getElementById('writeTitle').value.trim() || 'icp-draft').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    const blob = new Blob([val], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${title}.${ext}`;
    a.click();
  },
  saveWritingDraft() {
    const text = document.getElementById('writeEditor').value.trim();
    if (!text) { this.setMsg('writeStatusMsg', 'Nothing to save yet.', 'err'); return; }
    const title = document.getElementById('writeTitle').value.trim() || document.getElementById('writeFormat').value;
    this.saveLibraryItem({
      Type: 'writing',
      Folder: document.getElementById('writePubTable').value === 'SCHOLARSHIPS' ? 'Scholarships' : 'General',
      Title: title,
      PayloadJSON: JSON.stringify({ format: document.getElementById('writeFormat').value, tone: document.getElementById('writeTone').value, title, url: document.getElementById('writeOfficialUrl').value, text }),
      PreviewData: ''
    });
    this.setMsg('writeStatusMsg', 'Writing draft saved to Creative Library.', 'ok');
  },
  sendWritingToDesign() {
    const title = document.getElementById('writeTitle').value.trim() || 'ICP Youth Circle Update';
    const text = document.getElementById('writeEditor').value.trim().slice(0, 260);
    this.switchView('design');
    window.DesignStudio.loadPosterWithText(title, text);
  },
  async publishWritingToPortal() {
    const table = document.getElementById('writePubTable').value;
    const status = document.getElementById('writePubStatus').value;
    const title = document.getElementById('writeTitle').value.trim();
    const content = document.getElementById('writeEditor').value.trim();
    const officialUrl = document.getElementById('writeOfficialUrl').value.trim();
    if (!title || !content) { this.setMsg('writePubMsg', 'Both Title and Editor Content are required to publish.', 'err'); return; }

    const btn = document.getElementById('btnWritePublish');
    btn.disabled = true;
    this.setMsg('writePubMsg', `Publishing to ${table} (${status})...`, 'info');
    try {
      let record = { Title: title, Category: 'Announcement', Summary: content.slice(0, 320), Content: content, OfficialURL: officialUrl, Priority: 'Normal', Status: status };
      if (table === 'SCHOLARSHIPS') record = { Name: title, Provider: 'ICP Youth Circle', Type: 'Scholarship', Country: 'Pakistan', OfficialURL: officialUrl, Description: content, Status: status };
      if (table === 'ADMISSIONS') record = { Institution: 'Official Notice', Program: title, OfficialURL: officialUrl, Description: content, Status: status };
      if (table === 'OPPORTUNITIES') record = { Title: title, Organization: 'ICP Youth Circle', Type: 'Student Program', OfficialURL: officialUrl, Description: content, Status: status };
      await this.apiPost('adminSave', { table, record });
      this.publishingLog.unshift({ action: `Published to ${table} (${status})`, title, at: new Date().toLocaleTimeString() });
      this.session = await this.apiPost('adminSession');
      this.populatePortalTables();
      this.refreshDashboardStats();
      this.setMsg('writePubMsg', `Published to ${table} as ${status}! Public portal caches were refreshed.`, 'ok');
    } catch (err) {
      this.setMsg('writePubMsg', 'Publish failed: ' + err.message, 'err');
    } finally { btn.disabled = false; }
  },

  // ---------- Brand Brain ----------
  getBrand() {
    return {
      orgName: document.getElementById('brandOrgName').value.trim() || 'ICP YOUTH CIRCLE',
      tagline: document.getElementById('brandTagline').value.trim() || 'LEARN • CONNECT • GROW',
      url: document.getElementById('brandUrl').value.trim() || 'https://icp-youth-circle.vercel.app',
      description: document.getElementById('brandDescription').value.trim(),
      writingStyle: document.getElementById('brandWritingStyle').value.trim(),
      primaryColor: document.getElementById('brandPrimaryColor').value || '#0A192F',
      accentColor: document.getElementById('brandAccentColor').value || '#D4AF37',
      textColor: document.getElementById('brandTextColor').value || '#FFFFFF',
      typography: document.getElementById('brandTypography').value || 'Plus Jakarta Sans',
      logoData: this.brandLogoData || 'assets/icp-logo-navy-gold.png'
    };
  },
  getBrandPromptBlock() {
    const b = this.getBrand();
    return `Organization: ${b.orgName} (${b.tagline})\nWebsite: ${b.url}\nDescription: ${b.description}\nWriting Style: ${b.writingStyle}\nColors: Primary ${b.primaryColor}, Accent ${b.accentColor}`;
  },
  applyBrandToUI(b) {
    if (!b) return;
    if (b.orgName) { document.getElementById('brandOrgName').value = b.orgName; document.getElementById('sidebarBrandName').textContent = b.orgName; }
    if (b.tagline) document.getElementById('brandTagline').value = b.tagline;
    if (b.url) document.getElementById('brandUrl').value = b.url;
    if (b.description) document.getElementById('brandDescription').value = b.description;
    if (b.writingStyle) document.getElementById('brandWritingStyle').value = b.writingStyle;
    if (b.primaryColor) document.getElementById('brandPrimaryColor').value = b.primaryColor;
    if (b.accentColor) document.getElementById('brandAccentColor').value = b.accentColor;
    if (b.textColor) document.getElementById('brandTextColor').value = b.textColor;
    if (b.typography) document.getElementById('brandTypography').value = b.typography;
    if (b.logoData) {
      this.brandLogoData = b.logoData;
      document.getElementById('brandLogoPreview').src = b.logoData;
      document.getElementById('sidebarBrandLogo').src = b.logoData;
    }
  },
  loadBrandBrainLocal() {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.brand) || 'null');
    if (saved) this.applyBrandToUI(saved);
  },
  async syncBrandFromBackend() {
    try {
      const res = await this.apiPost('studioBrandGet', {}, 20000);
      if (res && res.saved && res.brand) {
        localStorage.setItem(STORAGE_KEYS.brand, JSON.stringify(res.brand));
        this.applyBrandToUI(res.brand);
      }
    } catch (_) { /* Backend v2 optional */ }
  },
  async saveBrandBrain() {
    const brand = this.getBrand();
    localStorage.setItem(STORAGE_KEYS.brand, JSON.stringify(brand));
    this.applyBrandToUI(brand);
    this.setMsg('brandStatusMsg', 'Saved locally. Syncing to Apps Script backend...', 'info');
    try {
      await this.apiPost('studioBrandSave', { brand });
      this.setMsg('brandStatusMsg', 'Brand Brain saved & synced to cloud backend!', 'ok');
    } catch (_) {
      this.setMsg('brandStatusMsg', 'Brand Brain saved locally in this browser. (Redeploy Code.gs for cloud sync.)', 'ok');
    }
  },
  handleBrandLogoUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      this.brandLogoData = r.result;
      document.getElementById('brandLogoPreview').src = r.result;
      document.getElementById('sidebarBrandLogo').src = r.result;
      if (window.DesignStudio) window.DesignStudio.refreshBrandLogo(r.result);
    };
    r.readAsDataURL(file);
  },
  resetBrandLogo() {
    this.brandLogoData = 'assets/icp-logo-navy-gold.png';
    document.getElementById('brandLogoPreview').src = this.brandLogoData;
    document.getElementById('sidebarBrandLogo').src = this.brandLogoData;
  },

  // ---------- Creative Library ----------
  getLibraryItems() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.library) || '[]'); }
    catch (_) { return []; }
  },
  setLibraryItems(items) {
    localStorage.setItem(STORAGE_KEYS.library, JSON.stringify(items));
    this.renderLibrary();
    this.refreshDashboardStats();
  },
  async saveLibraryItem(item) {
    const list = this.getLibraryItems();
    const now = new Date().toISOString();
    const entry = {
      ID: item.ID || ('STD-' + Date.now() + '-' + Math.floor(Math.random() * 1000)),
      Type: item.Type || 'idea',
      Folder: item.Folder || 'General',
      Title: item.Title || 'Untitled Project',
      Favorite: Boolean(item.Favorite),
      PayloadJSON: item.PayloadJSON || '{}',
      PreviewData: item.PreviewData || '',
      CreatedAt: item.CreatedAt || now,
      UpdatedAt: now
    };
    const idx = list.findIndex(x => x.ID === entry.ID);
    if (idx >= 0) list[idx] = entry; else list.unshift(entry);
    this.setLibraryItems(list);
    try { await this.apiPost('studioLibrarySave', { item: entry }); } catch (_) { /* Local save succeeded */ }
    return entry;
  },
  async syncLibraryFromBackend(silent = false) {
    if (!silent) this.setMsg('libStatusMsg', 'Syncing Creative Library from Google Sheets...', 'info');
    try {
      const res = await this.apiPost('studioLibraryList', {}, 25000);
      if (res && Array.isArray(res.items)) {
        const local = this.getLibraryItems();
        const byId = new Map(local.map(i => [i.ID, i]));
        res.items.forEach(ci => {
          byId.set(ci.ID, { ...ci, Favorite: ci.Favorite === 'Yes' || ci.Favorite === true });
        });
        this.setLibraryItems(Array.from(byId.values()).sort((a, b) => new Date(b.UpdatedAt || 0) - new Date(a.UpdatedAt || 0)));
        if (!silent) this.setMsg('libStatusMsg', 'Synced with cloud Studio_Library.', 'ok');
      }
    } catch (err) {
      if (!silent) this.setMsg('libStatusMsg', 'Cloud sync requires redeploying backend/Code.gs. Using local library.', 'info');
    }
  },
  renderLibrary() {
    const grid = document.getElementById('libraryGrid');
    const q = (document.getElementById('libSearch').value || '').trim().toLowerCase();
    const fType = document.getElementById('libFilterType').value;
    const fFolder = document.getElementById('libFilterFolder').value;
    const favOnly = document.getElementById('libFavOnly').checked;
    const items = this.getLibraryItems().filter(i =>
      (fType === 'all' || i.Type === fType) &&
      (fFolder === 'all' || i.Folder === fFolder) &&
      (!favOnly || i.Favorite) &&
      (!q || (i.Title + ' ' + i.Folder + ' ' + i.Type).toLowerCase().includes(q))
    );
    if (!items.length) {
      grid.innerHTML = '<p class="muted">No matching projects in your Creative Library yet.</p>';
      return;
    }
    grid.innerHTML = items.map(item => `
      <article class="item-card">
        ${item.PreviewData ? `<img class="item-thumb" src="${item.PreviewData}" alt="${this.esc(item.Title)}" />` : ''}
        <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
          <span class="pill">${this.esc(item.Type.toUpperCase())} · ${this.esc(item.Folder)}</span>
          <button class="btn btn-secondary btn-sm" style="padding:3px 8px;" onclick="StudioApp.toggleFavorite('${item.ID}')">${item.Favorite ? '★' : '☆'}</button>
        </div>
        <h4>${this.esc(item.Title)}</h4>
        <div class="muted" style="font-size:0.74rem;">${new Date(item.CreatedAt).toLocaleDateString()}</div>
        <div class="btn-row" style="margin-top:auto;">
          <button class="btn btn-sm" onclick="StudioApp.openLibraryItem('${item.ID}')">${item.Type === 'design' ? 'Edit Design' : item.Type === 'writing' ? 'Open Draft' : 'Preview'}</button>
          <button class="btn btn-secondary btn-sm" onclick="StudioApp.renameLibraryItem('${item.ID}')">Rename</button>
          <button class="btn btn-danger btn-sm" onclick="StudioApp.deleteLibraryItem('${item.ID}')">Delete</button>
        </div>
      </article>`).join('');
  },
  toggleFavorite(id) {
    const list = this.getLibraryItems();
    const item = list.find(x => x.ID === id);
    if (!item) return;
    item.Favorite = !item.Favorite;
    this.setLibraryItems(list);
    this.apiPost('studioLibrarySave', { item }).catch(() => {});
  },
  renameLibraryItem(id) {
    const list = this.getLibraryItems();
    const item = list.find(x => x.ID === id);
    if (!item) return;
    const next = prompt('Rename project:', item.Title);
    if (!next || !next.trim()) return;
    item.Title = next.trim();
    this.setLibraryItems(list);
    this.apiPost('studioLibrarySave', { item }).catch(() => {});
  },
  async deleteLibraryItem(id) {
    if (!confirm('Delete this project from your Creative Library?')) return;
    this.setLibraryItems(this.getLibraryItems().filter(x => x.ID !== id));
    try { await this.apiPost('studioLibraryDelete', { id }); } catch (_) {}
  },
  openLibraryItem(id) {
    const item = this.getLibraryItems().find(x => x.ID === id);
    if (!item) return;
    if (item.Type === 'design' && window.DesignStudio) {
      this.switchView('design');
      window.DesignStudio.loadProjectJSON(item.PayloadJSON, item.Title, item.ID);
      return;
    }
    if (item.Type === 'writing') {
      const data = JSON.parse(item.PayloadJSON || '{}');
      document.getElementById('writeTitle').value = data.title || item.Title;
      document.getElementById('writeEditor').value = data.text || '';
      if (data.url) document.getElementById('writeOfficialUrl').value = data.url;
      this.switchView('writing');
      return;
    }
    // Preview modal for ideas / images
    document.getElementById('previewModalTitle').textContent = item.Title;
    const body = document.getElementById('previewModalBody');
    if (item.PreviewData) {
      body.innerHTML = `<img src="${item.PreviewData}" style="max-width:100%;border-radius:10px;margin-bottom:12px;" /><div class="btn-row"><a class="btn" href="${item.PreviewData}" download="${this.esc(item.Title)}.png">Download PNG</a></div>`;
    } else {
      const data = JSON.parse(item.PayloadJSON || '{}');
      body.innerHTML = `<pre style="white-space:pre-wrap;font-family:inherit;font-size:0.88rem;line-height:1.6;">${this.esc(data.text || item.PayloadJSON)}</pre>`;
    }
    document.getElementById('previewModal').classList.add('open');
  },
  closePreview() { document.getElementById('previewModal').classList.remove('open'); },
  exportLibraryJSON() {
    const blob = new Blob([JSON.stringify(this.getLibraryItems(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'icp-creative-library-backup.json';
    a.click();
  },

  // ---------- Dashboard Real Stats ----------
  refreshDashboardStats() {
    const lib = this.getLibraryItems();
    const hist = JSON.parse(localStorage.getItem(STORAGE_KEYS.aiHistory) || '[]');
    const tables = (this.session && this.session.tables) || [];
    const totalPortal = tables.reduce((s, t) => s + Number(t.rowCount || 0), 0);

    document.getElementById('statProjects').textContent = String(lib.length);
    document.getElementById('statImages').textContent = String(lib.filter(i => i.Type === 'image' || i.Type === 'design').length);
    document.getElementById('statAiRuns').textContent = String(hist.length);
    document.getElementById('statPortalRecords').textContent = tables.length ? String(totalPortal) : '—';

    const recentBox = document.getElementById('dashRecentProjects');
    if (!lib.length) recentBox.innerHTML = '<p class="muted">No saved creative projects yet. Save an idea, draft, or design to see it here.</p>';
    else {
      recentBox.innerHTML = lib.slice(0, 5).map(i => `
        <div class="layer-item" onclick="StudioApp.openLibraryItem('${i.ID}')">
          <span class="layer-name">${this.esc(i.Title)}</span>
          <span class="pill">${this.esc(i.Type)}</span>
        </div>`).join('');
    }

    const pubBox = document.getElementById('dashPublishingActivity');
    if (!this.publishingLog.length) pubBox.innerHTML = '<p class="muted">No portal publishing actions in this session yet.</p>';
    else {
      pubBox.innerHTML = this.publishingLog.slice(0, 6).map(p => `
        <div class="layer-item" style="cursor:default;">
          <span class="layer-name"><strong>${this.esc(p.action)}:</strong> ${this.esc(p.title)}</span>
          <span class="muted" style="font-size:0.74rem;">${p.at}</span>
        </div>`).join('');
    }
  },

  // ---------- Preserved PDF Upload & Portal Manager ----------
  populatePortalTables() {
    const sel = document.getElementById('portalTableSelect');
    sel.replaceChildren();
    ((this.session && this.session.tables) || []).forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.key;
      opt.textContent = `${t.label} (${t.rowCount})`;
      sel.appendChild(opt);
    });
  },
  async archiveExpired() {
    if (!confirm('Archive all expired admissions, scholarships, and announcements?')) return;
    this.setMsg('dashStatusMsg', 'Reviewing deadlines and archiving expired records...', 'info');
    try {
      const res = await this.apiPost('adminArchiveExpired');
      const parts = Object.entries(res.archived || {}).filter(([, c]) => c).map(([k, c]) => `${c} ${k.toLowerCase()}`);
      this.setMsg('dashStatusMsg', parts.length ? 'Archived: ' + parts.join(', ') : 'No expired active records found.', 'ok');
      this.session = await this.apiPost('adminSession');
      this.populatePortalTables();
      this.refreshDashboardStats();
    } catch (err) { this.setMsg('dashStatusMsg', 'Error: ' + err.message, 'err'); }
  },
  async loadPortalTable() {
    const table = document.getElementById('portalTableSelect').value;
    if (!table) return;
    this.setMsg('portalStatusMsg', 'Loading live records...', 'info');
    try {
      const res = await this.apiPost('adminList', { table, query: document.getElementById('portalSearchInput').value, limit: 60 });
      this.setMsg('portalStatusMsg', `Showing ${res.rows.length} of ${res.total} records.`, 'ok');
      const cols = res.headers.slice(0, 6);
      const keyCol = res.headers.includes('ID') ? 'ID' : res.headers[0];
      if (!res.rows.length) { document.getElementById('portalTableWrap').innerHTML = '<p class="muted" style="padding:16px;">No records found.</p>'; return; }
      let html = '<table><thead><tr><th>Action</th>' + cols.map(c => `<th>${this.esc(c)}</th>`).join('') + '</tr></thead><tbody>';
      res.rows.forEach(r => {
        const k = String(r[keyCol] || '');
        html += `<tr><td><button class="btn btn-danger btn-sm" onclick="StudioApp.archivePortalRow('${this.esc(table)}','${this.esc(k).replace(/'/g, '')}')">Archive</button></td>` +
          cols.map(c => `<td>${this.esc(r[c])}</td>`).join('') + '</tr>';
      });
      html += '</tbody></table>';
      document.getElementById('portalTableWrap').innerHTML = html;
    } catch (err) { this.setMsg('portalStatusMsg', 'Error: ' + err.message, 'err'); }
  },
  async archivePortalRow(table, key) {
    if (!confirm(`Archive ${key}? It will be hidden from the public portal.`)) return;
    try {
      await this.apiPost('adminArchive', { table, key });
      this.publishingLog.unshift({ action: `Archived ${table}`, title: key, at: new Date().toLocaleTimeString() });
      this.loadPortalTable();
    } catch (err) { this.setMsg('portalStatusMsg', 'Archive failed: ' + err.message, 'err'); }
  },
  async uploadPdf(e) {
    e.preventDefault();
    const file = document.getElementById('pdfFile').files[0];
    if (!file || file.size > 8 * 1024 * 1024) { this.setMsg('pdfStatusMsg', 'Select a PDF under 8 MB.', 'err'); return; }
    const btn = document.getElementById('btnPdfSubmit');
    btn.disabled = true;
    this.setMsg('pdfStatusMsg', 'Uploading PDF to Google Drive & publishing to Resources...', 'info');
    try {
      const dataBase64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result || '').split(',')[1] || '');
        r.onerror = () => rej(new Error('Could not read PDF file.'));
        r.readAsDataURL(file);
      });
      const out = await this.apiPost('adminUploadPdf', {
        fileName: file.name, mimeType: 'application/pdf', dataBase64,
        title: document.getElementById('pdfTitle').value,
        category: document.getElementById('pdfCategory').value,
        subject: document.getElementById('pdfSubject').value,
        level: document.getElementById('pdfLevel').value,
        institution: document.getElementById('pdfInstitution').value,
        year: document.getElementById('pdfYear').value,
        description: document.getElementById('pdfDescription').value,
        rightsConfirmed: document.getElementById('pdfRights').checked
      }, 120000);
      this.publishingLog.unshift({ action: 'Uploaded PDF', title: document.getElementById('pdfTitle').value, at: new Date().toLocaleTimeString() });
      this.session = await this.apiPost('adminSession');
      this.populatePortalTables();
      this.refreshDashboardStats();
      this.setMsg('pdfStatusMsg', `PDF published successfully as ${out.resourceId}!`, 'ok');
    } catch (err) {
      this.setMsg('pdfStatusMsg', 'Upload failed: ' + err.message, 'err');
    } finally { btn.disabled = false; }
  },
  promotePdf() {
    const title = document.getElementById('pdfTitle').value.trim() || 'New Study PDF Uploaded';
    document.getElementById('writeTitle').value = 'New PDF Uploaded: ' + title;
    document.getElementById('writeFormat').value = 'WhatsApp Channel Announcement';
    document.getElementById('writeBrief').value = document.getElementById('pdfDescription').value.trim() || `Free ${title} PDF is now available in the ICP Youth Circle Study Resources section.`;
    this.switchView('writing');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  StudioApp.initTheme();
  document.getElementById('signInBtn').onclick = () => StudioApp.signIn();
  document.getElementById('signOutBtn').onclick = () => StudioApp.signOut();
  document.getElementById('themeToggleBtn').onclick = () => StudioApp.toggleTheme();
  document.getElementById('mobileMenuBtn').onclick = () => document.getElementById('studioSidebar').classList.toggle('open');
  document.querySelectorAll('.nav-item').forEach(btn => { btn.onclick = () => StudioApp.switchView(btn.dataset.view); });
  document.getElementById('pdfUploadForm').onsubmit = (e) => StudioApp.uploadPdf(e);
});
