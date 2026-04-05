// =============================================
// StudyNest — Shared App Utilities (app.js)
// =============================================

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'success', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type] || '📢'}</span><span>${message}</span>`;
  container.appendChild(toast);

if (container.children.length > 4) {
  container.firstChild.remove();
}
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ===== AUTH GUARD =====
// Call this at the top of pages that require login
function requireAuth(redirectTo = 'auth.html') {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (!user) {
        window.location.href = redirectTo;
      } else {
        unsubscribe();
        resolve(user);
      }
    });
  });
}

// ===== CURRENT USER PROFILE =====
async function getCurrentUserProfile() {
  const user = auth.currentUser;
  if (!user) return null;
  const snap = await db.collection('users').doc(user.uid).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

// ===== UPDATE NAV AVATAR =====
function updateNavAvatar(user) {
  const avatarEl = document.getElementById('nav-avatar');
  if (!avatarEl) return;
  if (user && user.photoURL) {
    avatarEl.innerHTML = `<img src="${user.photoURL}" alt="Profile">`;
  } else if (user && user.displayName) {
    avatarEl.textContent = user.displayName.charAt(0).toUpperCase();
  } else {
    avatarEl.textContent = '👤';
  }
}

// ===== CLOUDINARY CONFIG =====
const CLOUDINARY_CLOUD_NAME  = 'dmqatg7jk';
const CLOUDINARY_UPLOAD_PRESET = 'studynest_upload';

// ===== IMAGE UPLOAD TO CLOUDINARY =====
async function uploadImage(file, folder = 'uploads', onProgress = null) {
  if (!auth.currentUser) throw new Error('Must be logged in to upload');
  if (!file) throw new Error('No file selected');
  if (file.size > 5 * 1024 * 1024) throw new Error('Image must be under 5MB');
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) throw new Error('Only JPG, PNG, GIF, WEBP allowed');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', `studynest/${folder}`);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    // যেহেতু এটা শুধুমাত্র ইমেজের ফাংশন, সরাসরি image/upload ব্যবহার করা নিরাপদ
xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`);

    
    xhr.upload.onprogress = e => {
      if (onProgress && e.lengthComputable) {
        onProgress(Math.round(e.loaded / e.total * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status === 200) {
        let res;
try {
  res = JSON.parse(xhr.responseText);
} catch {
  return reject(new Error('Invalid response'));
}
        resolve(res.secure_url);
      } else {
        reject(new Error('Upload failed'));
      }
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(formData);
  });
}

// ===== PDF UPLOAD TO CLOUDINARY =====
async function uploadPDF(file, onProgress = null) {
  if (!auth.currentUser) throw new Error('Must be logged in to upload');
  if (!file) throw new Error('No file selected');
  if (file.size > 10 * 1024 * 1024) throw new Error('PDF must be under 10MB');
  if (file.type !== 'application/pdf') throw new Error('Only PDF files allowed');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'studynest/pdfs');
  formData.append('resource_type', 'raw');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`);
    xhr.upload.onprogress = e => {
      if (onProgress && e.lengthComputable) {
        onProgress(Math.round(e.loaded / e.total * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status === 200) {
        const res = JSON.parse(xhr.responseText);
        resolve(res.secure_url);
      } else {
        reject(new Error('Upload failed'));
      }
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(formData);
  });
}

// ===== TIME FORMATTING =====
function timeAgo(timestamp) {
  if (!timestamp) return '';
  const now = Date.now();
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const seconds = Math.floor((now - date.getTime()) / 1000);
  if (seconds < 60)     return 'এইমাত্র';
  if (seconds < 3600)   return `${Math.floor(seconds / 60)} মিনিট আগে`;
  if (seconds < 86400)  return `${Math.floor(seconds / 3600)} ঘণ্টা আগে`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} দিন আগে`;
  return date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ===== UPVOTE / VOTE SYSTEM =====
async function toggleVote(collection, docId, userId) {
  const ref = db.collection(collection).doc(docId);
  const doc = await ref.get();
  if (!doc.exists) return 0;
  const data = doc.data();
  const voters = data.voters || [];
  const hasVoted = voters.includes(userId);

  if (hasVoted) {
    await ref.update({
      votes: firebase.firestore.FieldValue.increment(-1),
      voters: firebase.firestore.FieldValue.arrayRemove(userId)
    });
    return (data.votes || 0) - 1;
  } else {
    await ref.update({
      votes: firebase.firestore.FieldValue.increment(1),
      voters: firebase.firestore.FieldValue.arrayUnion(userId)
    });
    return (data.votes || 0) + 1;
  }
}

// ===== POINTS SYSTEM =====
async function addPoints(userId, points, reason) {
  try {
    await db.collection('users').doc(userId).set({
      points: firebase.firestore.FieldValue.increment(points)
    }, { merge: true });
    await db.collection('activities').add({
      userId, points, reason,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch(e) {
    console.warn('Points update skipped:', e.message);
  }
}

// ===== ACTIVE NAV LINK =====
function setActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  const links = document.querySelectorAll('.bottom-nav-item');
  links.forEach(link => {
    const href = link.getAttribute('href') || '';
    link.classList.toggle('active', href === page || (page === '' && href === 'index.html'));
  });
}

// ===== SETUP UPLOAD ZONE =====
function setupUploadZone(zoneId, previewId, acceptTypes = 'image/*') {
  const zone = document.getElementById(zoneId);
  const preview = document.getElementById(previewId);
  if (!zone) return null;
  let selectedFile = null;

  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  const input = zone.querySelector('input[type="file"]');
  if (input) input.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  });

    function handleFile(file) {
    selectedFile = file;
    if (window.lastClearedZone === zoneId) window.lastClearedZone = null;
    if (preview && file.type.startsWith('image/')) {

      const reader = new FileReader();
      reader.onload = e => {
        preview.innerHTML = `
          <div class="upload-preview">
            <img src="${e.target.result}" alt="Preview">
            <button class="upload-preview-remove" onclick="clearUpload('${zoneId}','${previewId}')">✕</button>
          </div>`;
      };
      reader.readAsDataURL(file);
    } else if (preview) {
      preview.innerHTML = `<div class="upload-preview" style="padding:12px;background:var(--bg);border-radius:8px;font-size:.85rem;color:var(--text-muted)">📎 ${file.name}</div>`;
    }
  }

  return { getFile: () => (window.lastClearedZone === zoneId) ? null : selectedFile,
          clear: () => {
    selectedFile = null;
    if (preview) preview.innerHTML = '';
    if (input) input.value = '';
  }};
}


// ===== SUBJECTS LIST =====
const SUBJECTS = [
  'সব বিষয়', 'বাংলা', 'English', 'গণিত', 'পদার্থবিজ্ঞান',
  'রসায়ন', 'জীববিজ্ঞান', 'তথ্য ও যোগাযোগ প্রযুক্তি',
  'ইতিহাস', 'ভূগোল', 'অর্থনীতি', 'ধর্ম', 'সাধারণ জ্ঞান', 'অন্যান্য'
];

window.clearUpload = (zoneId, previewId) => {
  const preview = document.getElementById(previewId); if (preview) preview.innerHTML = '';
  const input = document.getElementById(zoneId)?.querySelector('input'); if (input) input.value = '';
  window.lastClearedZone = zoneId; 
};

const CLASSES = [
  'সব ক্লাস', 'ষষ্ঠ শ্রেণী', 'সপ্তম শ্রেণী', 'অষ্টম শ্রেণী',
  'নবম শ্রেণী', 'দশম শ্রেণী', 'একাদশ শ্রেণী', 'দ্বাদশ শ্রেণী',
  'অনার্স', 'মাস্টার্স'
];

// ===== LOADING BUTTON =====
function setButtonLoading(btn, loading, text = '') {
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn._originalText = btn.innerHTML;
    btn.innerHTML = `<div class="spinner spinner-sm"></div> ${text || 'লোড হচ্ছে...'}`;
  } else {
    btn.disabled = false;
    btn.innerHTML = btn._originalText || text;
  }
}

// ===== CONFIRM DIALOG =====
function confirmAction(message, onConfirm) {
  if (window.confirm(message)) onConfirm();
}

// ===== RUN AFTER DOM READY =====
document.addEventListener('DOMContentLoaded', () => {
  setActiveNav();
  auth.onAuthStateChanged(async user => {
    if (user) {
      const profile = await getCurrentUserProfile();
      if (profile) updateNavAvatar({ ...user, photoURL: profile.profileImage || user.photoURL });
      else updateNavAvatar(user);
    }
  });
});

// ===== GLOBAL SEARCH ROUTING =====
function executeGlobalSearch() {
  const query = document.getElementById('global-search-input').value.trim().toLowerCase();
  if (!query) return;
  window.location.href = `search.html?q=${encodeURIComponent(query)}`;
}

// ===== KEYWORD GENERATOR (For Database) =====
function generateKeywords(text) {
  // স্পেশাল ক্যারেক্টার বাদ দিয়ে বাক্যকে ছোট হাতের শব্দে ভেঙে অ্যারে বানাবে
  const cleanText = text.toLowerCase().replace(/[^\w\s\u0980-\u09FF]/g, '');
  return cleanText.split(/\s+/).filter(word => word.length > 1);
}

// ৩২৪ নম্বর লাইন থেকে এই কোডটুকু পেস্ট কর:

// ===== THEME MANAGEMENT (Twitter Style) =====
function setTheme(themeName) {
  const body = document.body;
  
  // আগের সব থিম ক্লাস মুছে ফেলা
  body.classList.remove('theme-dim', 'theme-black');
  
  // নতুন থিম যোগ করা
  if (themeName === 'dim') body.classList.add('theme-dim');
  if (themeName === 'black') body.classList.add('theme-black');
  
  // ইউজারের চয়েস ব্রাউজারে সেভ করে রাখা
  localStorage.setItem('selectedTheme', themeName);
}

// পেজ লোড হওয়ার সময় আগের সেভ করা থিম অটোমেটিক চালু করা
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('selectedTheme');
  if (savedTheme) setTheme(savedTheme);
});

// মেনু টগল ফাংশন
function toggleSideMenu() {
  const menu = document.getElementById('side-dropdown');
  menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
}

// মেনুর বাইরে ক্লিক করলে বন্ধ হবে
window.addEventListener('click', (e) => {
  const menu = document.getElementById('side-dropdown');
  if (menu && !menu.contains(e.target) && !e.target.classList.contains('btn-icon')) {
    menu.style.display = 'none';
  }
});

