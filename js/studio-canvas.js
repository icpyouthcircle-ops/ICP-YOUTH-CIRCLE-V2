/* ICP Creative Studio — Structured Editable Canvas Engine (Layers, Drag/Drop, Undo/Redo, Crop, AI Art, MCQ, 5-Slide Carousel, PNG & PDF Export) */
const AUTOSAVE_KEY = 'icp_cs_canvas_autosave_v2';

const DesignStudio = {
  canvas: null,
  ctx: null,
  width: 1080,
  height: 1080,
  bg1: '#0A192F',
  bg2: '#050d1a',
  mode: 'mcq',
  projectId: null,
  projectTitle: 'Untitled ICP Design',
  slides: [],
  activeSlide: 0,
  selectedId: null,
  dragging: false,
  dragOffsetX: 0,
  dragOffsetY: 0,
  undoStack: [],
  redoStack: [],
  imageCache: new Map(),

  init() {
    this.canvas = document.getElementById('designCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.bindPointerEvents();
    this.preloadImage('assets/icp-logo-navy-gold.png');

    // Restore autosave if present, otherwise load MCQ template
    try {
      const saved = JSON.parse(localStorage.getItem(AUTOSAVE_KEY) || 'null');
      if (saved && Array.isArray(saved.slides) && saved.slides.length) {
        this.width = saved.width || 1080;
        this.height = saved.height || 1080;
        this.bg1 = saved.bg1 || '#0A192F';
        this.bg2 = saved.bg2 || '#050d1a';
        this.mode = saved.mode || 'mcq';
        this.slides = saved.slides;
        this.activeSlide = Math.min(saved.activeSlide || 0, this.slides.length - 1);
        document.getElementById('canvasSizeSelect').value = `${this.width}x${this.height}`;
        document.getElementById('designTemplateSelect').value = this.mode;
        document.getElementById('bgColor1').value = this.bg1;
        document.getElementById('bgColor2').value = this.bg2;
        this.updateModeUI();
        this.render();
        this.renderLayers();
        return;
      }
    } catch (_) {}
    this.loadTemplate('mcq');
  },

  uid() { return 'obj-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 9999); },
  currentObjects() { return this.slides[this.activeSlide] || []; },

  preloadImage(src) {
    if (!src || this.imageCache.has(src)) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { this.imageCache.set(src, img); this.render(); };
    img.src = src;
  },
  refreshBrandLogo(dataUrl) {
    this.preloadImage(dataUrl);
    this.slides.forEach(objs => objs.forEach(o => { if (o.isBrandLogo) o.src = dataUrl; }));
    this.render();
  },

  pushUndo() {
    this.undoStack.push(JSON.stringify({ width: this.width, height: this.height, bg1: this.bg1, bg2: this.bg2, mode: this.mode, slides: this.slides, activeSlide: this.activeSlide }));
    if (this.undoStack.length > 40) this.undoStack.shift();
    this.redoStack = [];
    this.autosave();
  },
  undo() {
    if (!this.undoStack.length) return;
    this.redoStack.push(JSON.stringify({ width: this.width, height: this.height, bg1: this.bg1, bg2: this.bg2, mode: this.mode, slides: this.slides, activeSlide: this.activeSlide }));
    const prev = JSON.parse(this.undoStack.pop());
    Object.assign(this, prev);
    this.selectedId = null;
    this.render();
    this.renderLayers();
    this.syncInspector();
    this.autosave();
  },
  redo() {
    if (!this.redoStack.length) return;
    this.undoStack.push(JSON.stringify({ width: this.width, height: this.height, bg1: this.bg1, bg2: this.bg2, mode: this.mode, slides: this.slides, activeSlide: this.activeSlide }));
    const next = JSON.parse(this.redoStack.pop());
    Object.assign(this, next);
    this.selectedId = null;
    this.render();
    this.renderLayers();
    this.syncInspector();
    this.autosave();
  },
  autosave() {
    try {
      const data = { width: this.width, height: this.height, bg1: this.bg1, bg2: this.bg2, mode: this.mode, slides: this.slides, activeSlide: this.activeSlide };
      const str = JSON.stringify(data);
      if (str.length < 3500000) localStorage.setItem(AUTOSAVE_KEY, str);
      const note = document.getElementById('canvasAutosaveNote');
      if (note) note.textContent = 'Autosaved at ' + new Date().toLocaleTimeString() + ' · Drag objects to reposition.';
    } catch (_) {}
  },

  // ---------- Templates ----------
  brandDefaults() {
    const b = window.StudioApp ? StudioApp.getBrand() : { orgName: 'ICP YOUTH CIRCLE', tagline: 'LEARN • CONNECT • GROW', url: 'icp-youth-circle.vercel.app', primaryColor: '#0A192F', accentColor: '#D4AF37', textColor: '#FFFFFF', typography: 'Plus Jakarta Sans', logoData: 'assets/icp-logo-navy-gold.png' };
    this.preloadImage(b.logoData);
    return b;
  },
  baseBrandObjects(b, tagText, headline, bodyText) {
    const w = this.width, h = this.height;
    return [
      { id: this.uid(), type: 'rect', name: 'Gold Frame', x: 44, y: 44, w: w - 88, h: h - 88, color: 'transparent', stroke: b.accentColor, strokeWidth: 4, opacity: 1 },
      { id: this.uid(), type: 'image', name: 'ICP Logo', isBrandLogo: true, src: b.logoData, x: 76, y: 74, w: 72, h: 72, opacity: 1, cropZoom: 1, rounded: true },
      { id: this.uid(), type: 'text', name: 'Brand Name', text: b.orgName, x: 164, y: 82, w: 560, h: 36, fontFamily: b.typography, fontSize: 28, color: b.accentColor, bold: true, opacity: 1 },
      { id: this.uid(), type: 'text', name: 'Tagline', text: b.tagline, x: 164, y: 118, w: 560, h: 24, fontFamily: 'Inter', fontSize: 17, color: '#94a3b8', bold: false, opacity: 1 },
      { id: this.uid(), type: 'badge', name: 'Category Badge', text: tagText, x: 76, y: 174, w: 380, h: 46, color: b.accentColor, textColor: '#0A192F', fontFamily: 'Inter', fontSize: 18, opacity: 1 },
      { id: this.uid(), type: 'text', name: 'Headline', text: headline, x: 76, y: 248, w: w - 152, h: 150, fontFamily: b.typography, fontSize: 44, color: b.textColor, bold: true, opacity: 1 },
      { id: this.uid(), type: 'text', name: 'Body / Options', isMcqBody: true, text: bodyText, x: 76, y: 430, w: w - 152, h: 420, fontFamily: 'Inter', fontSize: 30, color: '#e2e8f0', bold: false, opacity: 1 },
      { id: this.uid(), type: 'rect', name: 'Footer Bar', x: 44, y: h - 112, w: w - 88, h: 68, color: b.accentColor, stroke: 'transparent', strokeWidth: 0, opacity: 1 },
      { id: this.uid(), type: 'text', name: 'Footer CTA', text: 'Explore verified resources at ' + b.url.replace(/^https?:\/\//, ''), x: 76, y: h - 92, w: w - 152, h: 36, fontFamily: 'Inter', fontSize: 22, color: '#0A192F', bold: true, opacity: 1 }
    ];
  },
  loadTemplate(tpl) {
    this.pushUndo();
    const b = this.brandDefaults();
    this.bg1 = b.primaryColor;
    this.bg2 = '#050d1a';
    document.getElementById('bgColor1').value = this.bg1;
    document.getElementById('bgColor2').value = this.bg2;
    this.mode = tpl;
    this.activeSlide = 0;

    if (tpl === 'mcq') {
      this.slides = [this.baseBrandObjects(b, 'MDCAT DAILY CHALLENGE', 'Which part of the human brain regulates body temperature and hunger?', 'A) Cerebellum\nB) Hypothalamus\nC) Medulla Oblongata\nD) Thalamus')];
    } else if (tpl === 'poster') {
      this.slides = [this.baseBrandObjects(b, 'OFFICIAL PORTAL UPDATE', 'KPK Class 12 Biology Notes & Past Papers Live', '• Chapter-wise high-yield PDF notes\n• Solved BISE Peshawar past papers\n• Free timed MDCAT practice quizzes')];
    } else if (tpl === 'scholarship') {
      this.slides = [this.baseBrandObjects(b, 'SCHOLARSHIP ALERT 2027', 'Fully Funded Undergraduate Scholarship Opportunities', '• Open for Pakistani FSc & BS students\n• Covers full tuition + monthly stipend\n• Check verified eligibility & official links on our portal')];
    } else if (tpl === 'carousel') {
      this.slides = [
        this.baseBrandObjects(b, 'SLIDE 1 OF 5 • COVER', '5 High-Yield MDCAT Biology Rules', 'Swipe through this quick KPK Board revision deck.\nSave this post for exam week!'),
        this.baseBrandObjects(b, 'SLIDE 2 OF 5 • RULE 1', '1. Enzymes Lower Activation Energy', '• Enzymes do not alter the equilibrium constant.\n• Highly specific and reusable biological catalysts.'),
        this.baseBrandObjects(b, 'SLIDE 3 OF 5 • RULE 2', '2. Photolysis Replaces PS-II Electrons', '• Splitting of H2O occurs in the thylakoid lumen.\n• Releases O2, H+ ions, and replacement electrons.'),
        this.baseBrandObjects(b, 'SLIDE 4 OF 5 • RULE 3', '3. Hypothalamus Controls Homeostasis', '• Regulates body temperature, hunger & thirst.\n• Connects the nervous and endocrine systems.'),
        this.baseBrandObjects(b, 'SLIDE 5 OF 5 • ACTION', 'Test Your Knowledge Now', 'Attempt free timed chapter-wise MCQs and download verified KPK notes on ICP Youth Circle.')
      ];
    } else {
      this.slides = [[
        { id: this.uid(), type: 'rect', name: 'Gold Frame', x: 44, y: 44, w: this.width - 88, h: this.height - 88, color: 'transparent', stroke: b.accentColor, strokeWidth: 4, opacity: 1 }
      ]];
    }
    this.selectedId = null;
    this.updateModeUI();
    this.render();
    this.renderLayers();
    this.syncInspector();
    this.autosave();
  },
  loadPosterWithText(headline, body) {
    document.getElementById('designTemplateSelect').value = 'poster';
    const b = this.brandDefaults();
    this.mode = 'poster';
    this.slides = [this.baseBrandObjects(b, 'ICP PORTAL UPDATE', headline, body)];
    this.activeSlide = 0;
    this.updateModeUI();
    this.render();
    this.renderLayers();
    this.autosave();
  },
  updateModeUI() {
    const isCar = this.mode === 'carousel';
    const isMcq = this.mode === 'mcq';
    document.getElementById('carouselSlideWrap').style.display = isCar ? 'block' : 'none';
    document.getElementById('btnExportCarousel').style.display = isCar ? 'inline-flex' : 'none';
    document.getElementById('mcqControlsWrap').style.display = isMcq ? 'block' : 'none';
    document.getElementById('btnExportMcqPair').style.display = isMcq ? 'inline-flex' : 'none';
    document.querySelectorAll('#carouselSlideBar .slide-pill').forEach((b, i) => b.classList.toggle('active', i === this.activeSlide));
  },
  selectSlide(idx) {
    if (!this.slides[idx]) return;
    this.activeSlide = idx;
    this.selectedId = null;
    this.updateModeUI();
    this.render();
    this.renderLayers();
    this.syncInspector();
  },
  setCanvasSize(val) {
    this.pushUndo();
    const [w, h] = val.split('x').map(Number);
    this.width = w; this.height = h;
    this.render();
    this.autosave();
  },
  updateBackground() {
    this.pushUndo();
    this.bg1 = document.getElementById('bgColor1').value;
    this.bg2 = document.getElementById('bgColor2').value;
    this.render();
    this.autosave();
  },

  // ---------- Add / Edit / Layer Objects ----------
  addText() {
    this.pushUndo();
    const obj = { id: this.uid(), type: 'text', name: 'Text Layer', text: 'Double-edit text in Inspector', x: 140, y: 360, w: 600, h: 80, fontFamily: 'Plus Jakarta Sans', fontSize: 36, color: '#ffffff', bold: true, opacity: 1 };
    this.currentObjects().push(obj);
    this.selectObject(obj.id);
  },
  addShape(kind) {
    this.pushUndo();
    const obj = { id: this.uid(), type: kind, name: kind === 'circle' ? 'Gold Circle' : 'Accent Box', x: 200, y: 260, w: 260, h: 160, color: 'rgba(212,175,55,0.22)', stroke: '#D4AF37', strokeWidth: 3, opacity: 1 };
    this.currentObjects().push(obj);
    this.selectObject(obj.id);
  },
  addBadge() {
    this.pushUndo();
    const obj = { id: this.uid(), type: 'badge', name: 'Pill Badge', text: 'NEW UPDATE', x: 120, y: 200, w: 260, h: 48, color: '#D4AF37', textColor: '#0A192F', fontFamily: 'Inter', fontSize: 18, opacity: 1 };
    this.currentObjects().push(obj);
    this.selectObject(obj.id);
  },
  addLogo() {
    this.pushUndo();
    const b = this.brandDefaults();
    const obj = { id: this.uid(), type: 'image', name: 'ICP Logo', isBrandLogo: true, src: b.logoData, x: 100, y: 100, w: 96, h: 96, opacity: 1, cropZoom: 1, rounded: true };
    this.currentObjects().push(obj);
    this.selectObject(obj.id);
  },
  handleImageUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      this.pushUndo();
      this.preloadImage(r.result);
      const obj = { id: this.uid(), type: 'image', name: file.name.slice(0, 20), src: r.result, x: 140, y: 240, w: 460, h: 340, opacity: 1, cropZoom: 1, rounded: false };
      this.currentObjects().push(obj);
      this.selectObject(obj.id);
    };
    r.readAsDataURL(file);
    e.target.value = '';
  },
  async generateAiArtwork() {
    const prompt = document.getElementById('designAiPrompt').value.trim();
    if (!prompt) { StudioApp.setMsg('designAiMsg', 'Describe the artwork or background first.', 'err'); return; }
    const btn = document.getElementById('btnDesignAiImage');
    btn.disabled = true;
    StudioApp.setMsg('designAiMsg', 'Generating AI artwork via secure backend (may take 15-30s)...', 'info');
    try {
      const size = this.height > this.width ? '1024x1536' : this.width > this.height ? '1536x1024' : '1024x1024';
      const res = await StudioApp.runAiImage(prompt, size);
      this.pushUndo();
      this.preloadImage(res.dataUrl);
      const artObj = { id: this.uid(), type: 'image', name: 'AI Artwork', src: res.dataUrl, x: 0, y: 0, w: this.width, h: this.height, opacity: 0.45, cropZoom: 1, rounded: false };
      this.currentObjects().unshift(artObj);
      this.selectObject(artObj.id);
      // Also save generated image to Creative Library
      StudioApp.saveLibraryItem({ Type: 'image', Folder: 'General', Title: 'AI Art: ' + prompt.slice(0, 45), PayloadJSON: JSON.stringify({ prompt, provider: res.provider, model: res.model }), PreviewData: res.dataUrl });
      StudioApp.setMsg('designAiMsg', `Artwork added as background layer (${res.provider}) & saved to Library!`, 'ok');
    } catch (err) {
      StudioApp.setMsg('designAiMsg', 'Image Gen Error: ' + err.message, 'err');
    } finally { btn.disabled = false; }
  },

  selectObject(id) {
    this.selectedId = id;
    this.render();
    this.renderLayers();
    this.syncInspector();
  },
  getSelected() { return this.currentObjects().find(o => o.id === this.selectedId) || null; },
  syncInspector() {
    const obj = this.getSelected();
    document.getElementById('inspectorEmpty').style.display = obj ? 'none' : 'block';
    document.getElementById('inspectorControls').style.display = obj ? 'block' : 'none';
    if (!obj) return;
    document.getElementById('propText').value = obj.text || '';
    document.getElementById('propFont').value = obj.fontFamily || 'Plus Jakarta Sans';
    document.getElementById('propFontSize').value = obj.fontSize || 28;
    document.getElementById('propColor').value = /^#[0-9a-f]{6}$/i.test(obj.color) ? obj.color : '#D4AF37';
    document.getElementById('propOpacity').value = obj.opacity != null ? obj.opacity : 1;
    document.getElementById('propWidth').value = Math.round(obj.w || 200);
    document.getElementById('propHeight').value = Math.round(obj.h || 80);
    document.getElementById('propImageCropWrap').style.display = obj.type === 'image' ? 'block' : 'none';
    if (obj.type === 'image') document.getElementById('propCropZoom').value = obj.cropZoom || 1;
  },
  updateSelectedProp(prop, value) {
    const obj = this.getSelected();
    if (!obj) return;
    obj[prop] = value;
    this.render();
    this.renderLayers();
    this.autosave();
  },
  moveLayer(delta) {
    const objs = this.currentObjects();
    const idx = objs.findIndex(o => o.id === this.selectedId);
    if (idx < 0) return;
    const next = idx + delta;
    if (next < 0 || next >= objs.length) return;
    this.pushUndo();
    const [item] = objs.splice(idx, 1);
    objs.splice(next, 0, item);
    this.render();
    this.renderLayers();
  },
  deleteSelected() {
    const objs = this.currentObjects();
    const idx = objs.findIndex(o => o.id === this.selectedId);
    if (idx < 0) return;
    this.pushUndo();
    objs.splice(idx, 1);
    this.selectedId = null;
    this.render();
    this.renderLayers();
    this.syncInspector();
  },
  renderLayers() {
    const list = document.getElementById('layersList');
    const objs = this.currentObjects();
    list.innerHTML = objs.slice().reverse().map(o => `
      <div class="layer-item ${o.id === this.selectedId ? 'selected' : ''}" onclick="DesignStudio.selectObject('${o.id}')">
        <span class="layer-name">${StudioApp.esc(o.name || o.type)}</span>
        <span class="muted" style="font-size:0.7rem;">${o.type}</span>
      </div>`).join('');
  },

  // ---------- Pointer Drag & Drop ----------
  canvasCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (this.width / rect.width),
      y: (e.clientY - rect.top) * (this.height / rect.height)
    };
  },
  bindPointerEvents() {
    this.canvas.addEventListener('pointerdown', e => {
      const pt = this.canvasCoords(e);
      const objs = this.currentObjects();
      let hit = null;
      for (let i = objs.length - 1; i >= 0; i--) {
        const o = objs[i];
        if (pt.x >= o.x && pt.x <= o.x + o.w && pt.y >= o.y && pt.y <= o.y + o.h) { hit = o; break; }
      }
      if (hit) {
        this.pushUndo();
        this.selectedId = hit.id;
        this.dragging = true;
        this.dragOffsetX = pt.x - hit.x;
        this.dragOffsetY = pt.y - hit.y;
        this.canvas.setPointerCapture(e.pointerId);
      } else {
        this.selectedId = null;
      }
      this.render();
      this.renderLayers();
      this.syncInspector();
    });
    this.canvas.addEventListener('pointermove', e => {
      if (!this.dragging) return;
      const obj = this.getSelected();
      if (!obj) return;
      const pt = this.canvasCoords(e);
      obj.x = Math.round(pt.x - this.dragOffsetX);
      obj.y = Math.round(pt.y - this.dragOffsetY);
      this.render();
    });
    const endDrag = () => { if (this.dragging) { this.dragging = false; this.autosave(); } };
    this.canvas.addEventListener('pointerup', endDrag);
    this.canvas.addEventListener('pointercancel', endDrag);
  },

  // ---------- Rendering ----------
  wrapLines(ctx, text, maxW) {
    const result = [];
    String(text || '').split('\n').forEach(para => {
      const words = para.split(' ');
      let line = '';
      words.forEach((word, idx) => {
        const test = line ? line + ' ' + word : word;
        if (ctx.measureText(test).width > maxW && idx > 0) { result.push(line); line = word; }
        else line = test;
      });
      result.push(line);
    });
    return result;
  },
  render(forExport = false) {
    if (!this.canvas) return;
    const ctx = this.ctx;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    const grad = ctx.createLinearGradient(0, 0, this.width, this.height);
    grad.addColorStop(0, this.bg1);
    grad.addColorStop(1, this.bg2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    const reveal = document.getElementById('mcqRevealToggle') && document.getElementById('mcqRevealToggle').checked;
    const correctOpt = document.getElementById('mcqCorrectSelect') ? document.getElementById('mcqCorrectSelect').value : 'B';

    this.currentObjects().forEach(o => {
      ctx.save();
      ctx.globalAlpha = o.opacity != null ? o.opacity : 1;

      if (o.type === 'rect') {
        if (o.color && o.color !== 'transparent') { ctx.fillStyle = o.color; ctx.fillRect(o.x, o.y, o.w, o.h); }
        if (o.stroke && o.stroke !== 'transparent' && o.strokeWidth) { ctx.strokeStyle = o.stroke; ctx.lineWidth = o.strokeWidth; ctx.strokeRect(o.x, o.y, o.w, o.h); }
      } else if (o.type === 'circle') {
        ctx.beginPath();
        ctx.ellipse(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, o.h / 2, 0, 0, Math.PI * 2);
        if (o.color && o.color !== 'transparent') { ctx.fillStyle = o.color; ctx.fill(); }
        if (o.stroke && o.stroke !== 'transparent' && o.strokeWidth) { ctx.strokeStyle = o.stroke; ctx.lineWidth = o.strokeWidth; ctx.stroke(); }
      } else if (o.type === 'badge') {
        ctx.fillStyle = o.color || '#D4AF37';
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.fillStyle = o.textColor || '#0A192F';
        ctx.font = `800 ${o.fontSize || 18}px "${o.fontFamily || 'Inter'}", sans-serif`;
        ctx.fillText(String(o.text || '').toUpperCase(), o.x + 18, o.y + (o.h / 2) + ((o.fontSize || 18) * 0.34));
      } else if (o.type === 'image') {
        const img = this.imageCache.get(o.src);
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.beginPath();
          if (o.rounded) ctx.arc(o.x + o.w / 2, o.y + o.h / 2, Math.min(o.w, o.h) / 2, 0, Math.PI * 2);
          else ctx.rect(o.x, o.y, o.w, o.h);
          ctx.clip();
          const zoom = o.cropZoom || 1;
          const sw = img.naturalWidth / zoom, sh = img.naturalHeight / zoom;
          const sx = (img.naturalWidth - sw) / 2, sy = (img.naturalHeight - sh) / 2;
          ctx.drawImage(img, sx, sy, sw, sh, o.x, o.y, o.w, o.h);
        } else {
          this.preloadImage(o.src);
        }
      } else if (o.type === 'text') {
        const fs = o.fontSize || 30;
        const lh = fs * 1.35;
        ctx.font = `${o.bold ? '800' : '600'} ${fs}px "${o.fontFamily || 'Inter'}", sans-serif`;
        const lines = this.wrapLines(ctx, o.text, o.w);
        let cy = o.y + fs;
        lines.forEach(line => {
          const isMcqOpt = this.mode === 'mcq' && o.isMcqBody && /^[ABCD]\)/i.test(line.trim());
          const isAns = isMcqOpt && reveal && line.trim().toUpperCase().startsWith(correctOpt + ')');
          if (isMcqOpt) {
            ctx.fillStyle = isAns ? 'rgba(16,185,129,0.28)' : 'rgba(255,255,255,0.07)';
            ctx.fillRect(o.x, cy - fs * 0.9, o.w, fs * 1.55);
            ctx.strokeStyle = isAns ? '#10b981' : 'rgba(212,175,55,0.35)';
            ctx.lineWidth = isAns ? 3 : 1.5;
            ctx.strokeRect(o.x, cy - fs * 0.9, o.w, fs * 1.55);
            ctx.fillStyle = isAns ? '#6ee7b7' : (o.color || '#e2e8f0');
            ctx.fillText(isAns ? line + '   ✓ CORRECT' : line, o.x + 18, cy + 4);
            cy += lh + 18;
          } else {
            ctx.fillStyle = o.color || '#ffffff';
            ctx.fillText(line, o.x, cy);
            cy += lh;
          }
        });
      }
      ctx.restore();

      // Selection indicator (preview only)
      if (!forExport && o.id === this.selectedId) {
        ctx.save();
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        ctx.strokeRect(o.x - 4, o.y - 4, o.w + 8, o.h + 8);
        ctx.restore();
      }
    });
  },

  // ---------- Save, Load & Export (PNG + Pure-JS Valid PDF) ----------
  saveToLibrary() {
    const title = prompt('Project name for Creative Library:', this.projectTitle);
    if (!title || !title.trim()) return;
    this.projectTitle = title.trim();
    this.render(true);
    const thumb = this.canvas.toDataURL('image/jpeg', 0.65);
    this.render(false);
    const payload = JSON.stringify({ width: this.width, height: this.height, bg1: this.bg1, bg2: this.bg2, mode: this.mode, slides: this.slides, activeSlide: this.activeSlide });
    StudioApp.saveLibraryItem({ ID: this.projectId, Type: 'design', Folder: this.mode === 'mcq' ? 'MDCAT' : 'General', Title: this.projectTitle, PayloadJSON: payload, PreviewData: thumb })
      .then(saved => { this.projectId = saved.ID; alert('Design project saved to Creative Library (remains fully editable)!'); });
  },
  loadProjectJSON(jsonStr, title, id) {
    try {
      const data = JSON.parse(jsonStr);
      this.width = data.width || 1080;
      this.height = data.height || 1080;
      this.bg1 = data.bg1 || '#0A192F';
      this.bg2 = data.bg2 || '#050d1a';
      this.mode = data.mode || 'poster';
      this.slides = data.slides || [[]];
      this.activeSlide = data.activeSlide || 0;
      this.projectId = id || null;
      this.projectTitle = title || 'Loaded Design';
      document.getElementById('canvasSizeSelect').value = `${this.width}x${this.height}`;
      document.getElementById('designTemplateSelect').value = this.mode;
      this.updateModeUI();
      this.render();
      this.renderLayers();
    } catch (err) { alert('Could not load project: ' + err.message); }
  },
  exportPNG(filename) {
    this.render(true);
    const a = document.createElement('a');
    a.download = filename || ('icp-creative-' + Date.now() + '.png');
    a.href = this.canvas.toDataURL('image/png');
    a.click();
    this.render(false);
  },
  exportMCQPair() {
    const cb = document.getElementById('mcqRevealToggle'), prev = cb.checked;
    cb.checked = false; this.exportPNG('icp-mcq-question.png');
    setTimeout(() => { cb.checked = true; this.exportPNG('icp-mcq-answer.png'); cb.checked = prev; this.render(false); }, 450);
  },
  exportAllSlides() {
    const prev = this.activeSlide;
    this.slides.forEach((_, idx) => {
      setTimeout(() => {
        this.selectSlide(idx);
        this.exportPNG(`icp-carousel-slide-${idx + 1}.png`);
        if (idx === this.slides.length - 1) setTimeout(() => this.selectSlide(prev), 350);
      }, idx * 500);
    });
  },
  exportPDF() {
    // Pure-JS valid PDF 1.4 binary generator embedding the high-res JPEG canvas image
    this.render(true);
    const jpegDataUrl = this.canvas.toDataURL('image/jpeg', 0.92);
    this.render(false);
    const binStr = atob(jpegDataUrl.split(',')[1]);
    const imgBytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) imgBytes[i] = binStr.charCodeAt(i);

    const wPt = Math.round(this.width * 0.75);
    const hPt = Math.round(this.height * 0.75);
    const enc = new TextEncoder();
    const parts = [];
    const offsets = [];
    let length = 0;
    const pushBytes = b => { parts.push(b); length += b.length; };
    const pushStr = s => pushBytes(enc.encode(s));

    pushStr('%PDF-1.4\n');
    const obj = (n, str) => { offsets[n] = length; pushStr(`${n} 0 obj\n${str}\nendobj\n`); };
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    obj(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${wPt} ${hPt}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
    offsets[4] = length;
    pushStr(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${this.width} /Height ${this.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgBytes.length} >>\nstream\n`);
    pushBytes(imgBytes);
    pushStr('\nendstream\nendobj\n');
    const contentStream = `q\n${wPt} 0 0 ${hPt} 0 0 cm\n/Im0 Do\nQ\n`;
    obj(5, `<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream`);

    const xrefStart = length;
    pushStr(`xref\n0 6\n0000000000 65535 f \n`);
    for (let i = 1; i <= 5; i++) pushStr(String(offsets[i]).padStart(10, '0') + ' 00000 n \n');
    pushStr(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);

    const blob = new Blob(parts, { type: 'application/pdf' });
    const a = document.createElement('a');
    a.download = 'icp-creative-' + Date.now() + '.pdf';
    a.href = URL.createObjectURL(blob);
    a.click();
  }
};

window.DesignStudio = DesignStudio;
