/* ══════════════════════════════════════
   AUTH MANAGER
══════════════════════════════════════ */
const Auth = {
  register(username, password, email) {
    if (!username || !password) return { ok: false, msg: 'Remplis tous les champs.' };
    if (username.length < 3) return { ok: false, msg: 'Nom d\'utilisateur: min. 3 caractères.' };
    if (password.length < 6) return { ok: false, msg: 'Mot de passe: min. 6 caractères.' };

    const users = JSON.parse(localStorage.getItem('dsq_users') || '{}');
    if (users[username.toLowerCase()]) return { ok: false, msg: 'Ce nom d\'utilisateur est déjà pris.' };

    users[username.toLowerCase()] = {
      username, password, email: email || '',
      createdAt: Date.now(),
      avatar: '', banner: '', offlineBg: ''
    };
    localStorage.setItem('dsq_users', JSON.stringify(users));
    return { ok: true, msg: 'Compte créé! Redirection...' };
  },

  login(username, password) {
    const users = JSON.parse(localStorage.getItem('dsq_users') || '{}');
    const user = users[username.toLowerCase()];
    if (!user || user.password !== password) return { ok: false, msg: 'Identifiants incorrects.' };
    localStorage.setItem('dsq_session', JSON.stringify({ username: user.username, loginAt: Date.now() }));
    return { ok: true, user };
  },

  logout() {
    localStorage.removeItem('dsq_session');
    window.location.href = 'index.html';
  },

  current() {
    const s = localStorage.getItem('dsq_session');
    return s ? JSON.parse(s) : null;
  },

  getUser(username) {
    const users = JSON.parse(localStorage.getItem('dsq_users') || '{}');
    return users[username.toLowerCase()] || null;
  },

  updateProfile(username, fields) {
    const users = JSON.parse(localStorage.getItem('dsq_users') || '{}');
    const key = username.toLowerCase();
    if (!users[key]) return { ok: false, msg: 'Utilisateur introuvable.' };
    Object.assign(users[key], fields);
    localStorage.setItem('dsq_users', JSON.stringify(users));
    return { ok: true };
  }
};

/* ══════════════════════════════════════
   CONTENT MANAGER
══════════════════════════════════════ */
const Content = {
  addVideo(title, url, desc) {
    const list = JSON.parse(localStorage.getItem('dsq_videos') || '[]');
    list.unshift({ id: Date.now(), title, url, desc: desc || '', createdAt: Date.now() });
    localStorage.setItem('dsq_videos', JSON.stringify(list));
  },
  getVideos() { return JSON.parse(localStorage.getItem('dsq_videos') || '[]'); },
  deleteVideo(id) {
    const list = JSON.parse(localStorage.getItem('dsq_videos') || '[]').filter(v => v.id !== id);
    localStorage.setItem('dsq_videos', JSON.stringify(list));
  },
  addPhoto(title, url) {
    const list = JSON.parse(localStorage.getItem('dsq_photos') || '[]');
    list.unshift({ id: Date.now(), title, url, createdAt: Date.now() });
    localStorage.setItem('dsq_photos', JSON.stringify(list));
  },
  getPhotos() { return JSON.parse(localStorage.getItem('dsq_photos') || '[]'); },
  addProject(title, desc, tag, link) {
    const list = JSON.parse(localStorage.getItem('dsq_projects') || '[]');
    list.unshift({ id: Date.now(), title, desc, tag, link: link || '', createdAt: Date.now() });
    localStorage.setItem('dsq_projects', JSON.stringify(list));
  },
  getProjects() { return JSON.parse(localStorage.getItem('dsq_projects') || '[]'); }
};

/* ══════════════════════════════════════
   HELPERS
══════════════════════════════════════ */
function fmtDate(ts) {
  return new Date(ts).toLocaleDateString('fr-CA', { day: '2-digit', month: 'short', year: 'numeric' });
}
function ytId(url) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/shorts\/))([\w-]{11})/);
  return m ? m[1] : null;
}
function initial(name) { return name ? name.charAt(0).toUpperCase() : '?'; }
function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ══════════════════════════════════════
   NAV UPDATE
══════════════════════════════════════ */
function updateNav() {
  const session = Auth.current();
  const el = document.getElementById('userButtons');
  if (!el) return;

  if (session) {
    const info = Auth.getUser(session.username);
    const av = info?.avatar;
    el.innerHTML = `
      <a href="profile.html" class="btn-profile">
        ${av
          ? `<img src="${av}" alt="${session.username}" style="width:26px;height:26px;border-radius:50%;object-fit:cover;flex-shrink:0;" onerror="this.outerHTML='<div class=avatar>${initial(session.username)}</div>'">`
          : `<div class="avatar">${initial(session.username)}</div>`
        }
        ${session.username}
      </a>
      <button onclick="Auth.logout()" class="btn-secondary" style="border:1.5px solid var(--border-bright)!important;background:transparent;color:var(--text-secondary);cursor:pointer;font-family:Inter,sans-serif;font-size:13px;font-weight:600;padding:7px 14px;border-radius:50px;">
        Déco
      </button>`;
  } else {
    el.innerHTML = `
      <a href="signup.html" class="btn-secondary">Inscription</a>
      <a href="login.html" class="btn-primary">Connexion</a>`;
  }
}

/* ══════════════════════════════════════
   MODAL HELPERS
══════════════════════════════════════ */
function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('open');
});

/* ══════════════════════════════════════
   PAGE INIT
══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  updateNav();
  const page = document.body.dataset.page;

  if (page === 'login') {
    document.getElementById('loginForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const u = document.getElementById('loginUsername').value.trim();
      const p = document.getElementById('loginPassword').value;
      const res = Auth.login(u, p);
      showMsg('loginMessage', res.msg || (res.ok ? 'Connexion réussie! Redirection...' : ''), res.ok);
      if (res.ok) setTimeout(() => window.location.href = 'index.html', 900);
    });
  }

  if (page === 'signup') {
    document.getElementById('signupForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const u = document.getElementById('username').value.trim();
      const p = document.getElementById('password').value;
      const em = document.getElementById('email')?.value.trim() || '';
      const res = Auth.register(u, p, em);
      showMsg('signupMessage', res.msg, res.ok);
      if (res.ok) setTimeout(() => window.location.href = 'login.html', 1400);
    });
  }

  if (page === 'profile') renderProfile();

  if (page === 'videos') {
    const user = Auth.current();
    const videos = Content.getVideos();
    const container = document.getElementById('videoContent');
    let html = '';
    if (user) html += `<button class="add-btn" onclick="openModal('addVideoModal')">＋ Ajouter une vidéo</button>`;
    if (!videos.length) {
      html += `<div class="empty-state"><div class="empty-icon">🎬</div><h3>Aucune vidéo pour l'instant</h3><p>Les vidéos publiées apparaîtront ici.</p></div>`;
    } else {
      html += '<div class="content-grid">';
      videos.forEach(v => {
        const id = ytId(v.url);
        const thumb = id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
        html += `<div class="video-card" onclick="window.open('${v.url}','_blank')">
          <div class="video-thumbnail">
            ${thumb ? `<img src="${thumb}" alt="${v.title}" loading="lazy">` : `<div class="thumb-placeholder"><svg viewBox="0 0 24 24"><path d="M21,3H3C2,3,1,3.9,1,5v14c0,1.1,1,2,2,2h18c1.1,0,2-.9,2-2V5C23,3.9,22.1,3,21,3z M10,16V8l7,4L10,16z"/></svg></div>`}
            <div class="play-overlay"><div class="play-circle"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div></div>
          </div>
          <div class="video-info"><div class="video-title">${v.title}</div><div class="video-meta">${fmtDate(v.createdAt)}</div></div>
        </div>`;
      });
      html += '</div>';
    }
    container.innerHTML = html;
    document.getElementById('addVideoForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      Content.addVideo(document.getElementById('vTitle').value.trim(), document.getElementById('vUrl').value.trim(), document.getElementById('vDesc').value.trim());
      closeModal('addVideoModal'); location.reload();
    });
  }

  if (page === 'photos') {
    const user = Auth.current();
    const photos = Content.getPhotos();
    const container = document.getElementById('photoContent');
    let html = '';
    if (user) html += `<button class="add-btn" onclick="openModal('addPhotoModal')">＋ Ajouter une photo</button>`;
    if (!photos.length) {
      html += `<div class="empty-state"><div class="empty-icon">🖼️</div><h3>Aucune photo pour l'instant</h3><p>Les photos publiées apparaîtront ici.</p></div>`;
    } else {
      html += '<div class="photo-grid">';
      photos.forEach(p => {
        html += `<div class="photo-card" title="${p.title}"><img src="${p.url}" alt="${p.title}" loading="lazy" onerror="this.parentElement.style.background='#222'"></div>`;
      });
      html += '</div>';
    }
    container.innerHTML = html;
    document.getElementById('addPhotoForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      Content.addPhoto(document.getElementById('pTitle').value.trim(), document.getElementById('pUrl').value.trim());
      closeModal('addPhotoModal'); location.reload();
    });
  }

  if (page === 'projects') {
    const user = Auth.current();
    const projects = Content.getProjects();
    const container = document.getElementById('projectContent');
    let html = '';
    if (user) html += `<button class="add-btn" onclick="openModal('addProjectModal')">＋ Ajouter un projet</button>`;
    if (!projects.length) {
      html += `<div class="empty-state"><div class="empty-icon">🚀</div><h3>Aucun projet pour l'instant</h3><p>Les projets publiés apparaîtront ici.</p></div>`;
    } else {
      html += '<div class="content-grid">';
      projects.forEach(p => {
        html += `<div class="project-card" ${p.link ? `onclick="window.open('${p.link}','_blank')" style="cursor:pointer"` : ''}>
          <h3>${p.title}</h3><p>${p.desc}</p>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            ${p.tag ? `<span class="tag">${p.tag}</span>` : ''}
            <span style="color:var(--text-muted);font-size:12px">${fmtDate(p.createdAt)}</span>
          </div>
        </div>`;
      });
      html += '</div>';
    }
    container.innerHTML = html;
    document.getElementById('addProjectForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      Content.addProject(document.getElementById('prTitle').value.trim(), document.getElementById('prDesc').value.trim(), document.getElementById('prTag').value.trim(), document.getElementById('prLink').value.trim());
      closeModal('addProjectModal'); location.reload();
    });
  }

  if (page === 'streaming') { initStreamPage(); initChat(); }
  if (page === 'home') renderHomeVideos();
});

/* ══════════════════════════════════════
   PROFILE PAGE
══════════════════════════════════════ */
function renderProfile() {
  const session = Auth.current();
  if (!session) { window.location.href = 'login.html'; return; }

  const info = Auth.getUser(session.username);
  const videos = Content.getVideos();
  const photos = Content.getPhotos();
  const projects = Content.getProjects();

  const avatarUrl  = info?.avatar    || '';
  const bannerUrl  = info?.banner    || '';
  const offlineBg  = info?.offlineBg || '';

  const avatarInner = avatarUrl
    ? `<img src="${avatarUrl}" alt="${session.username}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
    : `<span>${initial(session.username)}</span>`;

  const bannerStyle = bannerUrl
    ? `background-image:url('${bannerUrl}');background-size:cover;background-position:center;`
    : `background:linear-gradient(135deg,#1a0830 0%,#0e0e18 50%,#150820 100%);`;

  document.getElementById('profileContent').innerHTML = `
    <div class="profile-banner" style="${bannerStyle}">
      <div class="profile-banner-overlay"></div>
      <button class="edit-banner-btn" onclick="openModal('editImagesModal')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        Modifier la bannière
      </button>
    </div>

    <div class="profile-header-row">
      <div class="profile-avatar-wrap">
        <div class="profile-avatar-big">${avatarInner}</div>
        <button class="edit-avatar-btn" onclick="openModal('editImagesModal')" title="Modifier">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px;"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
        </button>
      </div>
      <div class="profile-info">
        <h2>${session.username}</h2>
        <p class="member-since">Membre depuis ${fmtDate(info?.createdAt || Date.now())}</p>
        <div class="profile-stats">
          <div class="stat"><div class="num">${videos.length}</div><div class="lbl">Vidéos</div></div>
          <div class="stat"><div class="num">${photos.length}</div><div class="lbl">Photos</div></div>
          <div class="stat"><div class="num">${projects.length}</div><div class="lbl">Projets</div></div>
        </div>
      </div>
      <div style="margin-left:auto;display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap;padding-top:4px;">
        <button class="edit-profile-action-btn" onclick="openModal('editImagesModal')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;flex-shrink:0;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Modifier le profil
        </button>
        <button class="logout-btn" onclick="Auth.logout()">⏻ Déconnexion</button>
      </div>
    </div>
  `;

  // Build edit modal
  if (document.getElementById('editImagesModal')) {
    document.getElementById('editImagesModal').remove();
  }

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'editImagesModal';
  modal.innerHTML = `
    <div class="modal" style="max-width:520px;">
      <div class="modal-header">
        <h2>🎨 Modifier le profil</h2>
        <button class="modal-close" onclick="closeModal('editImagesModal')">×</button>
      </div>

      <div style="margin-bottom:18px;">
        <div class="modal-label" style="margin-bottom:8px;">Aperçu bannière</div>
        <div id="bannerPreview" style="width:100%;height:80px;border-radius:10px;border:1.5px solid var(--border);${bannerUrl ? `background-image:url('${bannerUrl}');background-size:cover;background-position:center;` : 'background:linear-gradient(135deg,#1a0830,#0e0e18,#150820);'}overflow:hidden;transition:all 0.3s;position:relative;">
          <div style="position:absolute;inset:0;background:rgba(0,0,0,0.15);border-radius:10px;"></div>
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">
        <div>
          <div class="modal-label" style="margin-bottom:8px;">Aperçu avatar</div>
          <div id="avatarPreview" style="width:64px;height:64px;border-radius:50%;border:3px solid var(--bg-primary);background:linear-gradient(135deg,var(--accent),var(--accent-purple));display:flex;align-items:center;justify-content:center;font-family:Barlow,sans-serif;font-size:24px;font-weight:900;color:white;overflow:hidden;flex-shrink:0;">
            ${avatarUrl ? `<img src="${avatarUrl}" style="width:100%;height:100%;object-fit:cover;">` : initial(session.username)}
          </div>
        </div>
        <div style="flex:1;font-size:12px;color:var(--text-secondary);line-height:1.65;">
          Colle une URL d'image directe (.jpg, .png, .gif).<br>
          Hébergement gratuit: <strong style="color:var(--text-primary)">imgur.com</strong>, <strong style="color:var(--text-primary)">postimages.org</strong>, <strong style="color:var(--text-primary)">imgbb.com</strong>
        </div>
      </div>

      <form id="editImagesForm">
        <div style="margin-bottom:14px;">
          <label class="modal-label">🖼️ Photo de profil (URL)</label>
          <input class="modal-form-input" id="inputAvatar" type="url" placeholder="https://i.imgur.com/xxxx.jpg" value="${avatarUrl}" oninput="previewAvatar(this.value)">
        </div>
        <div style="margin-bottom:14px;">
          <label class="modal-label">🏞️ Bannière de profil (URL)</label>
          <input class="modal-form-input" id="inputBanner" type="url" placeholder="https://i.imgur.com/xxxx.jpg" value="${bannerUrl}" oninput="previewBanner(this.value)">
        </div>
        <div>
          <label class="modal-label">📺 Image hors-ligne Live (URL)</label>
          <input class="modal-form-input" id="inputOfflineBg" type="url" placeholder="https://i.imgur.com/xxxx.jpg" value="${offlineBg}">
          <div style="font-size:11px;color:var(--text-muted);margin-top:5px;line-height:1.5;">S'affiche sur la page Live comme fond quand le stream est hors ligne.</div>
        </div>
        <button class="modal-submit" type="submit" style="margin-top:18px;">💾 Sauvegarder les modifications</button>
      </form>
      <p class="form-message" id="editImagesMsg" style="margin-top:10px;"></p>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal('editImagesModal'); });

  document.getElementById('editImagesForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const avatar    = document.getElementById('inputAvatar').value.trim();
    const banner    = document.getElementById('inputBanner').value.trim();
    const offlineBg = document.getElementById('inputOfflineBg').value.trim();
    const res = Auth.updateProfile(session.username, { avatar, banner, offlineBg });
    if (res.ok) {
      showMsg('editImagesMsg', '✅ Profil mis à jour!', true);
      setTimeout(() => { closeModal('editImagesModal'); renderProfile(); updateNav(); }, 900);
    } else {
      showMsg('editImagesMsg', res.msg, false);
    }
  });
}

function previewAvatar(url) {
  const el = document.getElementById('avatarPreview');
  if (!el) return;
  const session = Auth.current();
  el.innerHTML = url
    ? `<img src="${url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.parentElement.innerHTML='${initial(session?.username||'?')}'">` 
    : initial(session?.username || '?');
}

function previewBanner(url) {
  const el = document.getElementById('bannerPreview');
  if (!el) return;
  if (url) {
    el.style.backgroundImage = `url('${url}')`;
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
    el.style.background = '';
  } else {
    el.style.backgroundImage = 'none';
    el.style.background = 'linear-gradient(135deg,#1a0830,#0e0e18,#150820)';
  }
}

/* ══════════════════════════════════════
   STREAMING PAGE
══════════════════════════════════════ */
function initStreamPage() {
  const users = JSON.parse(localStorage.getItem('dsq_users') || '{}');
  const creator = users['danystarkqc'] || Object.values(users).find(u => u.offlineBg || u.banner || u.avatar) || null;

  const offlineBg  = creator?.offlineBg || '';
  const bannerUrl  = creator?.banner    || '';
  const avatarUrl  = creator?.avatar    || '';

  // Offline background image
  const playerWrap = document.querySelector('.stream-player-wrap');
  const offlineEl  = document.querySelector('.stream-offline');
  if (offlineBg && playerWrap && offlineEl) {
    playerWrap.style.backgroundImage = `url('${offlineBg}')`;
    playerWrap.style.backgroundSize  = 'cover';
    playerWrap.style.backgroundPosition = 'center';
    offlineEl.style.background    = 'rgba(0,0,0,0.6)';
    offlineEl.style.backdropFilter = 'blur(2px)';
    offlineEl.style.borderRadius   = '0';
    offlineEl.style.position       = 'absolute';
    offlineEl.style.inset          = '0';
  }

  // Channel info panel — avatar
  const infoAvatarEl = document.getElementById('streamInfoAvatar');
  if (infoAvatarEl) {
    if (avatarUrl) {
      infoAvatarEl.style.backgroundImage = `url('${avatarUrl}')`;
      infoAvatarEl.style.backgroundSize = 'cover';
      infoAvatarEl.style.backgroundPosition = 'center';
      infoAvatarEl.textContent = '';
    }
  }

  // Channel banner strip
  const channelBanner = document.getElementById('streamChannelBanner');
  if (channelBanner && bannerUrl) {
    channelBanner.style.backgroundImage = `url('${bannerUrl}')`;
    channelBanner.style.backgroundSize = 'cover';
    channelBanner.style.backgroundPosition = 'center';
    channelBanner.style.opacity = '1';
  }
}

/* ══════════════════════════════════════
   CHAT
══════════════════════════════════════ */
function initChat() {
  const messages = document.getElementById('chatMessages');
  const form = document.getElementById('chatForm');
  if (!messages || !form) return;

  [
    { u: 'Viewer_Alex', msg: 'Salut tout le monde! 👋' },
    { u: 'GamerPro99',  msg: "DANY en live c'est toujours feu 🔥" },
    { u: 'FanQC',       msg: "Let's gooo!! 🎮" },
    { u: 'StreamFan',   msg: 'Bonne stream! 🙌' },
  ].forEach(m => appendMsg(messages, m.u, m.msg, false));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('chatInput');
    if (!input.value.trim()) return;
    const user = Auth.current();
    appendMsg(messages, user ? user.username : 'Visiteur', input.value.trim(), true);
    input.value = '';
  });
}

function appendMsg(container, username, msg, isOwn) {
  const div = document.createElement('div');
  div.className = 'chat-msg';
  div.innerHTML = `<span class="uname${isOwn?' owner':''}">${username}</span>: ${escHtml(msg)}`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

/* ══════════════════════════════════════
   HOME VIDEOS
══════════════════════════════════════ */
function renderHomeVideos() {
  const container = document.getElementById('homeVideos');
  if (!container) return;
  const videos = Content.getVideos().slice(0, 4);
  if (!videos.length) { container.innerHTML = ''; return; }

  container.innerHTML = `
    <div class="section-header">
      <div class="section-title"><span class="icon">🎬</span> Dernières vidéos</div>
      <a href="videos.html" class="section-see-all">Tout voir →</a>
    </div>
    <div class="content-grid">
      ${videos.map(v => {
        const id = ytId(v.url);
        const thumb = id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
        return `<div class="video-card" onclick="window.open('${v.url}','_blank')">
          <div class="video-thumbnail">
            ${thumb ? `<img src="${thumb}" alt="${v.title}" loading="lazy">` : `<div class="thumb-placeholder"><svg viewBox="0 0 24 24"><path d="M21,3H3C2,3,1,3.9,1,5v14c0,1.1,1,2,2,2h18c1.1,0,2-.9,2-2V5C23,3.9,22.1,3,21,3z M10,16V8l7,4L10,16z"/></svg></div>`}
            <div class="play-overlay"><div class="play-circle"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div></div>
          </div>
          <div class="video-info"><div class="video-title">${v.title}</div><div class="video-meta">${fmtDate(v.createdAt)}</div></div>
        </div>`;
      }).join('')}
    </div>`;
}

/* ══════════════════════════════════════
   UTILS
══════════════════════════════════════ */
function showMsg(id, text, isOk) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = 'form-message ' + (isOk ? 'success' : 'error');
  el.textContent = text;
}
