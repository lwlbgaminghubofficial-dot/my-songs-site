async function loadData() {
  const res = await fetch('./data.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load data.json');
  return res.json();
}

function normalize(s){
  return (s || '').toString().toLowerCase().trim();
}

function platformButtons(links) {
  const entries = Object.entries(links || {});
  const map = {
    youtube: { label: 'YouTube', icon: '▶️' },
    spotify: { label: 'Spotify', icon: '🎧' },
    soundcloud: { label: 'SoundCloud', icon: '☁️' },
    mixcloud: { label: 'Mixcloud', icon: '📻' }
  };

  const buttons = [];
  for (const [key, url] of entries) {
    if (!url) continue;
    const meta = map[key] || { label: key, icon: '🔗' };
    buttons.push({ key, url, label: meta.label, icon: meta.icon });
  }
  return buttons;
}

function createCard(track) {
  const a = document.createElement('a');
  a.className = 'card';
  a.href = `song.html?id=${encodeURIComponent(track.id)}`;

  a.innerHTML = `
    <div class="cover">
      <img src="${track.cover || 'https://picsum.photos/seed/music/600/600'}" alt="">
    </div>
    <div class="card-body">
      <div class="t">${track.title || 'Untitled'}</div>
      <div class="m">${track.artist || 'Unknown artist'}</div>
      <div class="btn-row">
        <span class="btn" role="button" aria-label="Open details">تفاصيل ✨</span>
      </div>
    </div>
  `;
  return a;
}

function renderGrid(tracks) {
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  for (const t of tracks) grid.appendChild(createCard(t));
}

async function initSongsPage() {
  const searchEl = document.getElementById('search');
  const filterEl = document.getElementById('filter');

  const data = await loadData();

  const allArtists = Array.from(new Set(data.map(x => x.artist).filter(Boolean))).sort();
  if (filterEl) {
    const frag = document.createDocumentFragment();
    const opt0 = document.createElement('option');
    opt0.value = '';
    opt0.textContent = 'كل الفنانين';
    frag.appendChild(opt0);

    for (const art of allArtists) {
      const opt = document.createElement('option');
      opt.value = art;
      opt.textContent = art;
      frag.appendChild(opt);
    }
    filterEl.innerHTML = '';
    filterEl.appendChild(frag);
  }

  function apply() {
    const q = normalize(searchEl?.value);
    const artist = filterEl?.value || '';

    const filtered = data.filter(t => {
      const inTitle = normalize(t.title).includes(q);
      const inArtist = normalize(t.artist).includes(q);
      const matchQuery = !q || inTitle || inArtist;
      const matchArtist = !artist || t.artist === artist;
      return matchQuery && matchArtist;
    });

    renderGrid(filtered);
    const count = document.getElementById('count');
    if (count) count.textContent = `${filtered.length} أغنية`;
  }

  if (searchEl) searchEl.addEventListener('input', apply);
  if (filterEl) filterEl.addEventListener('change', apply);

  apply();
}

async function initHomePage() {
  const data = await loadData();

  // اختر أحدث/أو أول 6
  const featured = data.slice(0, 6);
  const grid = document.getElementById('featured-grid');
  if (!grid) return;

  grid.innerHTML = '';
  for (const t of featured) grid.appendChild(createCard(t));
}

async function initSongDetailPage() {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');

  const data = await loadData();
  const track = data.find(x => x.id === id);

  if (!track) {
    const root = document.getElementById('detail-root');
    if (root) root.innerHTML = `<div class="panel">الأغنية غير موجودة.</div>`;
    return;
  }

  const titleEl = document.getElementById('song-title');
  const artistEl = document.getElementById('song-artist');
  const descEl = document.getElementById('song-desc');
  const coverEl = document.getElementById('song-cover');
  const linksEl = document.getElementById('song-links');

  if (titleEl) titleEl.textContent = track.title || '';
  if (artistEl) artistEl.textContent = track.artist || '';
  if (descEl) descEl.textContent = track.description || '';
  if (coverEl) coverEl.src = track.cover || '';

  if (linksEl) {
    linksEl.innerHTML = '';
    const buttons = platformButtons(track.links);

    if (buttons.length === 0) {
      linksEl.innerHTML = `<div class="small-note">لا توجد روابط لهذه الأغنية.</div>`;
      return;
    }

    for (const b of buttons) {
      const btn = document.createElement('a');
      btn.className = 'btn';
      btn.href = b.url;
      btn.target = '_blank';
      btn.rel = 'noopener noreferrer';
      btn.textContent = `${b.icon} ${b.label}`;
      linksEl.appendChild(btn);
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const page = document.body.dataset.page;

  try {
    if (page === 'home') await initHomePage();
    if (page === 'songs') await initSongsPage();
    if (page === 'song') await initSongDetailPage();
  } catch (e) {
    console.error(e);
    const root = document.getElementById('grid');
    if (root) root.innerHTML = `<div class="panel">حدث خطأ أثناء تحميل البيانات.</div>`;
  }
});
