// GTA SAMP Community App
// Data stored in localStorage for GitHub Pages compatibility

const STORAGE_KEYS = {
    users: 'gsamp_users',
    modpacks: 'gsamp_modpacks',
    messages: 'gsamp_messages',
    currentUser: 'gsamp_current',
    isAdmin: 'gsamp_admin',
    banned: 'gsamp_banned',
    background: 'gsamp_bg'
};

// ---------- Helpers ----------
function load(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
        return fallback;
    }
}

function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function nowTime() {
    const d = new Date();
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

// ---------- State ----------
let currentUser = load(STORAGE_KEYS.currentUser, null);
let isAdmin = load(STORAGE_KEYS.isAdmin, false);
let chatPoll = null;

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', () => {
    applyBackground();
    setupNavigation();
    setupAuth();
    setupAdmin();
    setupModpack();
    setupChat();
    setupProfile();
    updateUI();
    renderModpacks();
    if (currentUser) startChatPolling();
});

// ---------- Background ----------
function applyBackground() {
    const bg = load(STORAGE_KEYS.background, null);
    if (!bg) {
        document.body.style.backgroundColor = '#000000';
        document.body.style.backgroundImage = 'none';
        return;
    }
    if (bg.type === 'color') {
        document.body.style.backgroundColor = bg.value;
        document.body.style.backgroundImage = 'none';
    } else if (bg.type === 'image') {
        document.body.style.backgroundImage = `url(${bg.value})`;
        document.body.style.backgroundColor = '#000000';
    }
}

// ---------- Navigation ----------
function setupNavigation() {
    document.querySelectorAll('.nav-btn[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.getAttribute('data-page');
            showPage(page);
        });
    });

    document.getElementById('loginBtn').addEventListener('click', () => {
        document.getElementById('loginModal').classList.add('show');
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        currentUser = null;
        save(STORAGE_KEYS.currentUser, null);
        stopChatPolling();
        updateUI();
        showPage('home');
    });

    // SA Logo = Admin Login
    document.getElementById('saLogo').addEventListener('click', () => {
        if (isAdmin) {
            showPage('admin');
        } else {
            document.getElementById('adminModal').classList.add('show');
        }
    });
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(pageId + 'Page');
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav-btn[data-page]').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-page') === pageId);
    });

    if (pageId === 'chat') renderChat();
    if (pageId === 'modpack') renderModpacks();
    if (pageId === 'profile' && currentUser) loadProfileForm();
    if (pageId === 'admin' && isAdmin) renderAdmin();
}

function updateUI() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const profileBtn = document.getElementById('profileBtn');
    const modForm = document.getElementById('modpackFormArea');
    const chatInput = document.getElementById('chatInput');
    const sendChat = document.getElementById('sendChat');

    if (currentUser) {
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
        profileBtn.style.display = 'inline-block';
        modForm.style.display = 'block';
        chatInput.disabled = false;
        sendChat.disabled = false;
    } else {
        loginBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
        profileBtn.style.display = 'none';
        modForm.style.display = 'none';
        chatInput.disabled = true;
        sendChat.disabled = true;
    }
}

// ---------- Auth ----------
function setupAuth() {
    document.getElementById('closeLogin').addEventListener('click', () => {
        document.getElementById('loginModal').classList.remove('show');
        document.getElementById('authMessage').textContent = '';
    });

    document.getElementById('doLogin').addEventListener('click', doLogin);
    document.getElementById('doRegister').addEventListener('click', doRegister);
}

function doRegister() {
    const username = document.getElementById('authUsername').value.trim();
    const password = document.getElementById('authPassword').value;
    const msg = document.getElementById('authMessage');

    if (!username || !password) {
        msg.textContent = 'Username dan password wajib diisi.';
        return;
    }
    if (username.length < 3) {
        msg.textContent = 'Username minimal 3 karakter.';
        return;
    }

    const users = load(STORAGE_KEYS.users, {});
    const banned = load(STORAGE_KEYS.banned, []);

    if (users[username]) {
        msg.textContent = 'Username sudah terdaftar.';
        return;
    }
    if (banned.includes(username)) {
        msg.textContent = 'Akun ini di-banned.';
        return;
    }

    users[username] = {
        password: password,
        displayName: username,
        bio: '',
        avatar: null,
        created: Date.now()
    };
    save(STORAGE_KEYS.users, users);

    currentUser = username;
    save(STORAGE_KEYS.currentUser, username);
    msg.textContent = 'Berhasil daftar dan login.';
    setTimeout(() => {
        document.getElementById('loginModal').classList.remove('show');
        updateUI();
        startChatPolling();
    }, 600);
}

function doLogin() {
    const username = document.getElementById('authUsername').value.trim();
    const password = document.getElementById('authPassword').value;
    const msg = document.getElementById('authMessage');

    if (!username || !password) {
        msg.textContent = 'Username dan password wajib diisi.';
        return;
    }

    const banned = load(STORAGE_KEYS.banned, []);
    if (banned.includes(username)) {
        msg.textContent = 'Akun ini di-banned oleh admin.';
        return;
    }

    const users = load(STORAGE_KEYS.users, {});
    if (!users[username] || users[username].password !== password) {
        msg.textContent = 'Username atau password salah.';
        return;
    }

    currentUser = username;
    save(STORAGE_KEYS.currentUser, username);
    msg.textContent = 'Login berhasil.';
    setTimeout(() => {
        document.getElementById('loginModal').classList.remove('show');
        updateUI();
        startChatPolling();
    }, 500);
}

// ---------- Admin ----------
function setupAdmin() {
    document.getElementById('closeAdmin').addEventListener('click', () => {
        document.getElementById('adminModal').classList.remove('show');
        document.getElementById('adminMessage').textContent = '';
    });

    document.getElementById('doAdminLogin').addEventListener('click', () => {
        const pw = document.getElementById('adminPassword').value;
        const msg = document.getElementById('adminMessage');
        if (pw === '112233') {
            isAdmin = true;
            save(STORAGE_KEYS.isAdmin, true);
            msg.textContent = 'Admin login berhasil.';
            setTimeout(() => {
                document.getElementById('adminModal').classList.remove('show');
                showPage('admin');
            }, 500);
        } else {
            msg.textContent = 'Password admin salah.';
        }
    });

    document.getElementById('adminLogout').addEventListener('click', () => {
        isAdmin = false;
        save(STORAGE_KEYS.isAdmin, false);
        showPage('home');
    });

    document.getElementById('applyBg').addEventListener('click', applyAdminBg);
    document.getElementById('resetBg').addEventListener('click', () => {
        localStorage.removeItem(STORAGE_KEYS.background);
        applyBackground();
    });
}

function applyAdminBg() {
    const color = document.getElementById('bgColor').value;
    const fileInput = document.getElementById('bgImage');
    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            save(STORAGE_KEYS.background, { type: 'image', value: e.target.result });
            applyBackground();
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        save(STORAGE_KEYS.background, { type: 'color', value: color });
        applyBackground();
    }
}

function renderAdmin() {
    // Modpacks
    const modList = document.getElementById('adminModList');
    const mods = load(STORAGE_KEYS.modpacks, []);
    if (mods.length === 0) {
        modList.innerHTML = '<p>Belum ada modpack.</p>';
    } else {
        modList.innerHTML = mods.map(m => `
            <div class="admin-item">
                <span>${escapeHtml(m.title)} (${m.category}) - ${escapeHtml(m.author)}</span>
                <button onclick="deleteModpack('${m.id}')">Hapus</button>
            </div>
        `).join('');
    }

    // Users
    const userList = document.getElementById('adminUserList');
    const users = load(STORAGE_KEYS.users, {});
    const banned = load(STORAGE_KEYS.banned, []);
    const names = Object.keys(users);
    if (names.length === 0) {
        userList.innerHTML = '<p>Belum ada user.</p>';
    } else {
        userList.innerHTML = names.map(u => {
            const isBanned = banned.includes(u);
            return `
                <div class="admin-item">
                    <span>${escapeHtml(u)} ${isBanned ? '(BANNED)' : ''}</span>
                    ${isBanned
                        ? `<button onclick="unbanUser('${u}')">Unban</button>`
                        : `<button onclick="banUser('${u}')">Ban</button>`
                    }
                </div>
            `;
        }).join('');
    }
}

function deleteModpack(id) {
    let mods = load(STORAGE_KEYS.modpacks, []);
    mods = mods.filter(m => m.id !== id);
    save(STORAGE_KEYS.modpacks, mods);
    renderAdmin();
    renderModpacks();
}

function banUser(username) {
    let banned = load(STORAGE_KEYS.banned, []);
    if (!banned.includes(username)) {
        banned.push(username);
        save(STORAGE_KEYS.banned, banned);
    }
    // Force logout if current
    if (currentUser === username) {
        currentUser = null;
        save(STORAGE_KEYS.currentUser, null);
        updateUI();
    }
    renderAdmin();
}

function unbanUser(username) {
    let banned = load(STORAGE_KEYS.banned, []);
    banned = banned.filter(u => u !== username);
    save(STORAGE_KEYS.banned, banned);
    renderAdmin();
}

// Make available globally for onclick
window.deleteModpack = deleteModpack;
window.banUser = banUser;
window.unbanUser = unbanUser;

// ---------- Modpack ----------
function setupModpack() {
    document.getElementById('uploadMod').addEventListener('click', uploadModpack);

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderModpacks(btn.getAttribute('data-filter'));
        });
    });
}

function uploadModpack() {
    if (!currentUser) return;

    const title = document.getElementById('modTitle').value.trim();
    const category = document.getElementById('modCategory').value;
    const desc = document.getElementById('modDesc').value.trim();
    const link = document.getElementById('modLink').value.trim();
    const fileInput = document.getElementById('modImage');
    const msg = document.getElementById('modMessage');

    if (!title) {
        msg.textContent = 'Judul wajib diisi.';
        return;
    }

    const finish = (imageData) => {
        const mods = load(STORAGE_KEYS.modpacks, []);
        mods.unshift({
            id: uid(),
            title,
            category,
            desc,
            link,
            image: imageData,
            author: currentUser,
            time: Date.now()
        });
        save(STORAGE_KEYS.modpacks, mods);
        msg.textContent = 'Modpack berhasil diupload.';
        document.getElementById('modTitle').value = '';
        document.getElementById('modDesc').value = '';
        document.getElementById('modLink').value = '';
        fileInput.value = '';
        renderModpacks();
    };

    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            finish(e.target.result);
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        finish(null);
    }
}

function renderModpacks(filter) {
    if (!filter) {
        const active = document.querySelector('.filter-btn.active');
        filter = active ? active.getAttribute('data-filter') : 'all';
    }

    const list = document.getElementById('modpackList');
    let mods = load(STORAGE_KEYS.modpacks, []);
    if (filter && filter !== 'all') {
        mods = mods.filter(m => m.category === filter);
    }

    const catNames = {
        skin_baju: 'Skin Baju',
        hit_sound: 'Hit Sound',
        skin_senjata: 'Skin Senjata',
        skin_mobil: 'Skin Mobil',
        monetloader: 'Monetloader',
        ikon: 'Ikon Fast',
        lainnya: 'Lainnya'
    };

    if (mods.length === 0) {
        list.innerHTML = '<p style="color:#888;">Belum ada modpack di kategori ini.</p>';
        return;
    }

    list.innerHTML = mods.map(m => `
        <div class="mod-card">
            ${m.image ? `<img src="${m.image}" alt="preview">` : '<div style="height:150px;background:#222;display:flex;align-items:center;justify-content:center;color:#666;">No Image</div>'}
            <div class="mod-card-body">
                <h4>${escapeHtml(m.title)}</h4>
                <div class="category">${catNames[m.category] || m.category}</div>
                <p>${escapeHtml(m.desc || '-')}</p>
                <div class="author">Oleh: ${escapeHtml(m.author)}</div>
                ${m.link ? `<a href="${escapeHtml(m.link)}" target="_blank" rel="noopener">Download</a>` : ''}
            </div>
        </div>
    `).join('');
}

// ---------- Chat ----------
function setupChat() {
    document.getElementById('sendChat').addEventListener('click', sendMessage);
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

function startChatPolling() {
    if (chatPoll) clearInterval(chatPoll);
    chatPoll = setInterval(renderChat, 2000);
    renderChat();
}

function stopChatPolling() {
    if (chatPoll) {
        clearInterval(chatPoll);
        chatPoll = null;
    }
}

function sendMessage() {
    if (!currentUser) return;
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;

    const users = load(STORAGE_KEYS.users, {});
    const user = users[currentUser] || {};
    const messages = load(STORAGE_KEYS.messages, []);

    messages.push({
        id: uid(),
        user: currentUser,
        displayName: user.displayName || currentUser,
        avatar: user.avatar || null,
        text: text,
        time: nowTime()
    });

    // Keep last 200 messages
    if (messages.length > 200) messages.splice(0, messages.length - 200);
    save(STORAGE_KEYS.messages, messages);
    input.value = '';
    renderChat();
}

function renderChat() {
    const box = document.getElementById('chatMessages');
    const messages = load(STORAGE_KEYS.messages, []);
    const users = load(STORAGE_KEYS.users, {});

    box.innerHTML = messages.map(m => {
        const u = users[m.user] || {};
        const name = u.displayName || m.displayName || m.user;
        const avatar = u.avatar || m.avatar;
        const avatarHtml = avatar
            ? `<img class="chat-avatar" src="${avatar}" alt="">`
            : `<div class="chat-avatar-placeholder">${name.charAt(0).toUpperCase()}</div>`;

        return `
            <div class="chat-msg">
                ${avatarHtml}
                <div class="chat-bubble">
                    <div class="name">${escapeHtml(name)}</div>
                    <div class="text">${escapeHtml(m.text)}</div>
                    <div class="time">${m.time}</div>
                </div>
            </div>
        `;
    }).join('');

    box.scrollTop = box.scrollHeight;
}

// ---------- Profile ----------
function setupProfile() {
    document.getElementById('saveProfile').addEventListener('click', saveProfile);
    document.getElementById('profileImage').addEventListener('change', previewProfileImage);
}

function loadProfileForm() {
    if (!currentUser) return;
    const users = load(STORAGE_KEYS.users, {});
    const u = users[currentUser] || {};
    document.getElementById('profileUsername').value = currentUser;
    document.getElementById('profileDisplayName').value = u.displayName || currentUser;
    document.getElementById('profileBio').value = u.bio || '';
    const preview = document.getElementById('profilePreview');
    if (u.avatar) {
        preview.innerHTML = `<img src="${u.avatar}" alt="avatar">`;
    } else {
        preview.innerHTML = '';
    }
}

function previewProfileImage() {
    const file = document.getElementById('profileImage').files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        document.getElementById('profilePreview').innerHTML = `<img src="${e.target.result}" alt="avatar">`;
    };
    reader.readAsDataURL(file);
}

function saveProfile() {
    if (!currentUser) return;
    const users = load(STORAGE_KEYS.users, {});
    if (!users[currentUser]) return;

    users[currentUser].displayName = document.getElementById('profileDisplayName').value.trim() || currentUser;
    users[currentUser].bio = document.getElementById('profileBio').value.trim();

    const fileInput = document.getElementById('profileImage');
    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            users[currentUser].avatar = e.target.result;
            save(STORAGE_KEYS.users, users);
            document.getElementById('profileMessage').textContent = 'Profil berhasil disimpan.';
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        save(STORAGE_KEYS.users, users);
        document.getElementById('profileMessage').textContent = 'Profil berhasil disimpan.';
    }
}

// ---------- Utility ----------
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
