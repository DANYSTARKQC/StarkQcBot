/* ── AUTH MANAGER ── */
const Auth = {
  register(username, password, email) {
    if (!username || !password) return { ok: false, msg: 'Remplis tous les champs.' };
    if (username.length < 3) return { ok: false, msg: 'Nom d\'utilisateur: min. 3 caractères.' };
    if (password.length < 6) return { ok: false, msg: 'Mot de passe: min. 6 caractères.' };

    const users = JSON.parse(localStorage.getItem('dsq_users') || '{}');
    if (users[username.toLowerCase()]) return { ok: false, msg: 'Ce nom d\'utilisateur est déjà pris.' };

    users[username.toLowerCase()] = {
      username, password, email: email || '',
      createdAt: Date.now()
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
  }
};

/* ── CONTENT MANAGER ── */
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

/* ── HELPERS ── */
function fmtDate(ts) {
  return new Date(ts).toLocaleDateString('fr-CA', { day: '2-digit', month: 'short', year: 'numeric' });
}

function ytId(url) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/shorts\/))([\w-]{11})/);
  return m ? m[1] : null;
}

function initial(name) { return name ? name.charAt(0).toUpperCase() : '?'; }

/* ── NAV UPDATE ── */
function updateNav() {
  const user = Auth.current();
  const el = document.getElementById('userButtons');
  if (!el) return;

  if (user) {
    el.innerHTML = `
      <a href="profile.html" class="btn-profile">
        <div class="avatar">${initial(user.username)}</div>
        ${user.username}
      </a>
      <button onclick="Auth.logout()" class="btn-secondary" style="border:1px solid var(--border-bright)!important;background:transparent;color:var(--text-secondary);cursor:pointer;font-family:Outfit,sans-serif;font-size:14px;font-weight:600;padding:7px 14px;border-radius:7px;">
        Déco
      </button>`;
  } else {
    el.innerHTML = `
      <a href="signup.html" class="btn-secondary" style="padding:7px 16px;border-radius:7px;border:1px solid var(--border-bright);font-size:14px;font-weight:600;color:var(--text-primary);">Inscription</a>
      <a href="login.html" class="btn-primary" style="padding:7px 16px;border-radius:7px;background:var(--accent);color:white;font-size:14px;font-weight:600;">Connexion</a>`;
  }
}

/* ── MODAL HELPERS ── */
function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('open');
});

/* ── PAGE INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  updateNav();
  const page = document.body.dataset.page;

  // ── LOGIN ──
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

  // ── SIGNUP ──
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

  // ── PROFILE ──
  if (page === 'profile') {
    const user = Auth.current();
    if (!user) { window.location.href = 'login.html'; return; }

    const info = Auth.getUser(user.username);
    const videos = Content.getVideos();
    const photos = Content.getPhotos();
    const projects = Content.getProjects();

    document.getElementById('profileContent').innerHTML = `
      <div class="profile-card">
        <div class="profile-avatar-big">${initial(user.username)}</div>
        <div class="profile-info">
          <h2>${user.username}</h2>
          <p class="member-since">Membre depuis ${fmtDate(info?.createdAt || Date.now())}</p>
          <div class="profile-stats">
            <div class="stat"><div class="num">${videos.length}</div><div class="lbl">Vidéos</div></div>
            <div class="stat"><div class="num">${photos.length}</div><div class="lbl">Photos</div></div>
            <div class="stat"><div class="num">${projects.length}</div><div class="lbl">Projets</div></div>
          </div>
        </div>
      </div>
      <button class="logout-btn" onclick="Auth.logout()">⏻ Se déconnecter</button>
    `;
  }

  // ── VIDEOS ──
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
        html += `
          <div class="video-card" onclick="window.open('${v.url}','_blank')">
            <div class="video-thumbnail">
              ${thumb
                ? `<img src="${thumb}" alt="${v.title}" loading="lazy">`
                : `<div class="thumb-placeholder"><svg viewBox="0 0 24 24"><path d="M21,3H3C2,3,1,3.9,1,5v14c0,1.1,1,2,2,2h18c1.1,0,2-.9,2-2V5C23,3.9,22.1,3,21,3z M10,16V8l7,4L10,16z"/></svg></div>`
              }
              <div class="play-overlay"><div class="play-circle"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div></div>
            </div>
            <div class="video-info">
              <div class="video-title">${v.title}</div>
              <div class="video-meta">${fmtDate(v.createdAt)}</div>
            </div>
          </div>`;
      });
      html += '</div>';
    }
    container.innerHTML = html;

    document.getElementById('addVideoForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      Content.addVideo(
        document.getElementById('vTitle').value.trim(),
        document.getElementById('vUrl').value.trim(),
        document.getElementById('vDesc').value.trim()
      );
      closeModal('addVideoModal');
      location.reload();
    });
  }

  // ── PHOTOS ──
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
      Content.addPhoto(
        document.getElementById('pTitle').value.trim(),
        document.getElementById('pUrl').value.trim()
      );
      closeModal('addPhotoModal');
      location.reload();
    });
  }

  // ── PROJECTS ──
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
        html += `
          <div class="project-card" ${p.link ? `onclick="window.open('${p.link}','_blank')" style="cursor:pointer"` : ''}>
            <h3>${p.title}</h3>
            <p>${p.desc}</p>
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
      Content.addProject(
        document.getElementById('prTitle').value.trim(),
        document.getElementById('prDesc').value.trim(),
        document.getElementById('prTag').value.trim(),
        document.getElementById('prLink').value.trim()
      );
      closeModal('addProjectModal');
      location.reload();
    });
  }

  // ── STREAMING ──
  if (page === 'streaming') {
    initChat();
  }

  // ── HOME ──
  if (page === 'home') {
    renderHomeVideos();
  }
});

/* ── CHAT ── */
function initChat() {
  const messages = document.getElementById('chatMessages');
  const form = document.getElementById('chatForm');
  if (!messages || !form) return;

  const demo = [
    { u: 'Viewer_Alex', msg: 'Salut tout le monde! 👋' },
    { u: 'GamerPro99', msg: 'DANY en live c\'est toujours feu 🔥' },
    { u: 'FanQC', msg: 'Let\'s gooo!! 🎮' },
    { u: 'StreamFan', msg: 'Bonne stream! 🙌' },
  ];

  demo.forEach(m => appendMsg(messages, m.u, m.msg, false));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('chatInput');
    if (!input.value.trim()) return;
    const user = Auth.current();
    appendMsg(messages, user ? user.username : 'Visiteur', input.value.trim(), true);
    input.value = '';
    messages.scrollTop = messages.scrollHeight;
  });
}

function appendMsg(container, username, msg, isOwn) {
  const div = document.createElement('div');
  div.className = 'chat-msg';
  div.innerHTML = `<span class="uname${isOwn ? ' owner' : ''}">${username}</span>: ${escHtml(msg)}`;
  container.appendChild(div);
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ── HOME VIDEOS ── */
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
        return `
          <div class="video-card" onclick="window.open('${v.url}','_blank')">
            <div class="video-thumbnail">
              ${thumb
                ? `<img src="${thumb}" alt="${v.title}" loading="lazy">`
                : `<div class="thumb-placeholder"><svg viewBox="0 0 24 24"><path d="M21,3H3C2,3,1,3.9,1,5v14c0,1.1,1,2,2,2h18c1.1,0,2-.9,2-2V5C23,3.9,22.1,3,21,3z M10,16V8l7,4L10,16z"/></svg></div>`
              }
              <div class="play-overlay"><div class="play-circle"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div></div>
            </div>
            <div class="video-info">
              <div class="video-title">${v.title}</div>
              <div class="video-meta">${fmtDate(v.createdAt)}</div>
            </div>
          </div>`;
      }).join('')}
    </div>`;
}

/* ── UTILS ── */
function showMsg(id, text, isOk) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = 'form-message ' + (isOk ? 'success' : 'error');
  el.textContent = text;
}
