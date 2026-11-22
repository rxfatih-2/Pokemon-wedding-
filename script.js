'use strict';

// Nomor WhatsApp tujuan konfirmasi RSVP (format kode negara tanpa +, contoh: 6281234567890)
const WHATSAPP_NUMBER = '6288226621362';

// Tanggal & waktu acara (Sabtu, 12 Desember 2026 pukul 08:00 WIB)
const WEDDING_DATE_TARGET = new Date('2026-12-12T08:00:00+07:00').getTime();

document.addEventListener('DOMContentLoaded', () => {
  // ========================================================================
  // 1. Opening Gate Pokéball + Kontrol Audio BGM
  // ========================================================================
  const openingGate = document.getElementById('opening-gate');
  const openGateBtn = document.getElementById('open-gate-btn');
  const bgMusic = document.getElementById('bg-music');
  const audioToggle = document.getElementById('audio-toggle');
  const iconSoundOn = document.getElementById('icon-sound-on');
  const iconSoundOff = document.getElementById('icon-sound-off');

  let isMusicPlaying = false;
  let manuallyPaused = false;

  if (openingGate && !openingGate.classList.contains('is-opened')) {
    document.body.classList.add('gate-locked');
  }

  function syncAudioUI(playing) {
    isMusicPlaying = playing;
    if (audioToggle) {
      audioToggle.setAttribute('aria-pressed', String(playing));
    }
    if (iconSoundOn && iconSoundOff) {
      iconSoundOn.classList.toggle('hidden', !playing);
      iconSoundOff.classList.toggle('hidden', playing);
    }
  }

  function startMusic() {
    if (!bgMusic || isMusicPlaying || manuallyPaused) return;
    bgMusic.volume = 0.7;
    const playPromise = bgMusic.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          syncAudioUI(true);
        })
        .catch(() => {
          // Menunggu interaksi sentuh/klik berikutnya jika browser memblokir autoplay
        });
    }
  }

  function stopMusic() {
    if (!bgMusic) return;
    bgMusic.pause();
    syncAudioUI(false);
  }

  if (bgMusic) {
    bgMusic.addEventListener('play', () => syncAudioUI(true));
    bgMusic.addEventListener('pause', () => syncAudioUI(false));
  }

  if (openGateBtn && openingGate) {
    openGateBtn.addEventListener('click', () => {
      manuallyPaused = false;
      startMusic();

      openingGate.classList.add('is-opening');
      document.body.classList.remove('gate-locked');

      window.setTimeout(() => {
        openingGate.classList.add('is-opened');
      }, 880);
    });
  }

  // Nyalakan musik otomatis saat pengguna klik atau scroll jika belum dinyalakan
  ['click', 'touchstart', 'scroll'].forEach((evtName) => {
    window.addEventListener(
      evtName,
      (event) => {
        if (manuallyPaused || isMusicPlaying) return;
        if (audioToggle && event.target && audioToggle.contains(event.target)) return;
        startMusic();
      },
      { passive: true }
    );
  });

  if (audioToggle) {
    audioToggle.addEventListener('click', (event) => {
      event.stopPropagation();
      if (isMusicPlaying) {
        manuallyPaused = true;
        stopMusic();
      } else {
        manuallyPaused = false;
        startMusic();
      }
    });
  }

  // ========================================================================
  // 2. Hitung Mundur Menuju Hari Pernikahan
  // ========================================================================
  const cdDays = document.getElementById('cd-days');
  const cdHours = document.getElementById('cd-hours');
  const cdMinutes = document.getElementById('cd-minutes');
  const cdSeconds = document.getElementById('cd-seconds');

  function padZero(num) {
    return String(Math.max(0, num)).padStart(2, '0');
  }

  function updateCountdown() {
    const now = Date.now();
    const diff = Math.max(0, WEDDING_DATE_TARGET - now);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    if (cdDays) cdDays.textContent = padZero(days);
    if (cdHours) cdHours.textContent = padZero(hours);
    if (cdMinutes) cdMinutes.textContent = padZero(minutes);
    if (cdSeconds) cdSeconds.textContent = padZero(seconds);
  }

  updateCountdown();
  window.setInterval(updateCountdown, 1000);

  // ========================================================================
  // 3. Fallback Ilustrasi SVG Otomatis Jika File Foto Belum Diisi
  // ========================================================================
  function createFallbackSvgDataUri(type) {
    const presets = {
      groom: {
        bg: '#DBEAFE',
        accent: '#1E3A8A',
        badge: 'TRAINER #001',
        title: 'ARYA PRATAMA',
        sub: 'assets/img/pengantin-pria.jpg'
      },
      bride: {
        bg: '#FCE7F3',
        accent: '#BE185D',
        badge: 'TRAINER #002',
        title: 'NADIA KUSUMA',
        sub: 'assets/img/pengantin-wanita.jpg'
      },
      couple1: {
        bg: '#FEF9C3',
        accent: '#DC2626',
        badge: 'CHAPTER 01',
        title: 'ARYA & NADIA',
        sub: 'assets/img/foto-bersama-1.jpg'
      },
      couple2: {
        bg: '#DCFCE7',
        accent: '#15803D',
        badge: 'CHAPTER 02',
        title: 'HALL OF FAME 2026',
        sub: 'assets/img/foto-bersama-2.jpg'
      }
    };
    const cfg = presets[type] || presets.couple1;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
      <rect width="600" height="600" fill="${cfg.bg}"/>
      <circle cx="300" cy="255" r="96" fill="#FFFFFF" stroke="#111827" stroke-width="10"/>
      <path d="M204 255A96 96 0 0 1 396 255Z" fill="${cfg.accent}" stroke="#111827" stroke-width="10"/>
      <circle cx="300" cy="255" r="26" fill="#FFFFFF" stroke="#111827" stroke-width="10"/>
      <rect x="130" y="390" width="340" height="118" rx="18" fill="#FFFFFF" stroke="#111827" stroke-width="6"/>
      <text x="300" y="430" text-anchor="middle" font-family="monospace" font-weight="bold" font-size="18" fill="${cfg.accent}">${cfg.badge}</text>
      <text x="300" y="464" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="24" fill="#111827">${cfg.title}</text>
      <text x="300" y="490" text-anchor="middle" font-family="monospace" font-size="13" fill="#475569">${cfg.sub}</text>
    </svg>`;
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

  document.querySelectorAll('img[data-fallback]').forEach((img) => {
    const applyFallback = () => {
      if (img.dataset.fallbackApplied === 'true') return;
      img.dataset.fallbackApplied = 'true';
      img.src = createFallbackSvgDataUri(img.dataset.fallback);
    };
    img.addEventListener('error', applyFallback);
    if (img.complete && img.naturalWidth === 0) {
      applyFallback();
    }
  });

  // ========================================================================
  // 4. RSVP via WhatsApp & Papan Doa Restu
  // ========================================================================
  const rsvpForm = document.getElementById('rsvp-form');
  const wishList = document.getElementById('wish-list');
  const wishCounter = document.getElementById('wish-counter');
  const STORAGE_WISHES_KEY = 'poke_wedding_wishes_2026';

  function updateWishCount() {
    if (!wishList || !wishCounter) return;
    const total = wishList.querySelectorAll('.wish-item').length;
    wishCounter.textContent = `${total} Pesan`;
  }

  function appendWishToBoard(name, status, message, prepend = true) {
    if (!wishList) return;
    const li = document.createElement('li');
    li.className = 'wish-item';

    const meta = document.createElement('div');
    meta.className = 'wish-meta';

    const strong = document.createElement('strong');
    strong.textContent = name;

    const tag = document.createElement('span');
    tag.className = 'wish-tag';
    tag.textContent = status;

    const p = document.createElement('p');
    p.textContent = message;

    meta.appendChild(strong);
    meta.appendChild(tag);
    li.appendChild(meta);
    li.appendChild(p);

    if (prepend && wishList.firstChild) {
      wishList.insertBefore(li, wishList.firstChild);
    } else {
      wishList.appendChild(li);
    }
    updateWishCount();
  }

  try {
    const savedWishes = JSON.parse(localStorage.getItem(STORAGE_WISHES_KEY) || '[]');
    if (Array.isArray(savedWishes)) {
      savedWishes.forEach((item) => {
        if (item && item.name && item.message) {
          appendWishToBoard(item.name, item.status || 'Hadir di Acara', item.message, true);
        }
      });
    }
  } catch (e) {
    // Abaikan jika localStorage tidak tersedia
  }
  updateWishCount();

  if (rsvpForm) {
    rsvpForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const nameInput = document.getElementById('guest-name');
      const statusInput = document.getElementById('guest-status');
      const countInput = document.getElementById('guest-count');
      const messageInput = document.getElementById('guest-message');

      const guestName = nameInput ? nameInput.value.trim() : '';
      const guestStatus = statusInput ? statusInput.value : 'Hadir di Acara';
      const guestCount = countInput ? countInput.value : '1';
      const guestMessage = messageInput ? messageInput.value.trim() : '';

      if (!guestName || !guestMessage) return;

      appendWishToBoard(guestName, guestStatus, guestMessage, true);

      try {
        const existing = JSON.parse(localStorage.getItem(STORAGE_WISHES_KEY) || '[]');
        existing.push({ name: guestName, status: guestStatus, message: guestMessage });
        localStorage.setItem(STORAGE_WISHES_KEY, JSON.stringify(existing.slice(-30)));
      } catch (e) {
        // Abaikan jika penyimpanan penuh
      }

      const waLines = [
        'Halo Arya & Nadia! Saya ingin konfirmasi RSVP Poké-Wedding:',
        '',
        `*Nama Trainer:* ${guestName}`,
        `*Kehadiran:* ${guestStatus}`,
        `*Jumlah Tamu:* ${guestCount} orang`,
        `*Doa Restu:* ${guestMessage}`
      ];

      const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waLines.join('\n'))}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');

      rsvpForm.reset();
      if (countInput) countInput.value = '1';
    });
  }

  // ========================================================================
  // 5. Mini-Game Interaktif: Tangkap Love Ball!
  // ========================================================================
  const canvas = document.getElementById('love-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const gameOverlay = document.getElementById('game-overlay');
  const overlayBadge = document.getElementById('overlay-badge');
  const overlayHeading = document.getElementById('overlay-heading');
  const overlayText = document.getElementById('overlay-text');
  const startGameBtn = document.getElementById('start-game-btn');

  const scoreEl = document.getElementById('game-score');
  const timerEl = document.getElementById('game-timer');
  const livesEl = document.getElementById('game-lives');
  const bestEl = document.getElementById('game-best');

  const btnLeft = document.getElementById('btn-move-left');
  const btnRight = document.getElementById('btn-move-right');

  const STORAGE_BEST_KEY = 'poke_wedding_best_score_2026';
  let bestScore = 0;
  try {
    bestScore = Number(localStorage.getItem(STORAGE_BEST_KEY) || 0);
  } catch (e) {
    bestScore = 0;
  }
  if (bestEl) bestEl.textContent = String(bestScore);

  if (canvas && ctx) {
    const W = canvas.width;
    const H = canvas.height;

    let isRunning = false;
    let score = 0;
    let lives = 3;
    let timeLeft = 30;
    let lastTimestamp = 0;
    let spawnAccumulator = 0;
    let timerAccumulator = 0;
    let flashRedAlpha = 0;

    const player = {
      x: W / 2,
      y: H - 56,
      width: 68,
      height: 54,
      speed: 460
    };

    const keys = { left: false, right: false };
    let items = [];
    let popups = [];

    function updateHud() {
      if (scoreEl) scoreEl.textContent = String(score);
      if (timerEl) timerEl.textContent = `${Math.ceil(timeLeft)}s`;
      if (livesEl) livesEl.textContent = String(lives);
      if (bestEl) bestEl.textContent = String(bestScore);
    }

    function spawnItem() {
      const roll = Math.random();
      let type = 'love';
      let radius = 19;
      let speed = 185 + Math.random() * 95 + (30 - timeLeft) * 3.2;

      if (roll > 0.78) {
        type = 'bomb';
        radius = 20;
        speed += 25;
      } else if (roll > 0.56) {
        type = 'gold';
        radius = 18;
        speed += 35;
      }

      items.push({
        type,
        x: 36 + Math.random() * (W - 72),
        y: -26,
        radius,
        speed
      });
    }

    function addPopup(x, y, text, color) {
      popups.push({ x, y, text, color, life: 0.75 });
    }

    function drawArenaBackground() {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.78);
      skyGrad.addColorStop(0, '#BFDBFE');
      skyGrad.addColorStop(1, '#EFF6FF');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      ctx.arc(130, 74, 24, 0, Math.PI * 2);
      ctx.arc(158, 70, 30, 0, Math.PI * 2);
      ctx.arc(188, 76, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(560, 96, 22, 0, Math.PI * 2);
      ctx.arc(588, 92, 28, 0, Math.PI * 2);
      ctx.arc(616, 98, 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#86EFAC';
      ctx.fillRect(0, H - 46, W, 46);
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, H - 48, W, 3);
    }

    function drawMascotPlayer() {
      const px = player.x;
      const py = player.y;

      ctx.save();
      ctx.translate(px, py);

      ctx.fillStyle = 'rgba(17, 24, 39, 0.22)';
      ctx.beginPath();
      ctx.ellipse(0, 36, 32, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = 3;
      ctx.strokeStyle = '#111827';
      ctx.fillStyle = '#FACC15';

      ctx.beginPath();
      ctx.moveTo(-16, -6);
      ctx.lineTo(-30, -32);
      ctx.lineTo(-6, -14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(16, -6);
      ctx.lineTo(30, -32);
      ctx.lineTo(6, -14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.roundRect(-24, -14, 48, 44, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.arc(-10, 3, 3.5, 0, Math.PI * 2);
      ctx.arc(10, 3, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(-16, 12, 4.5, 0, Math.PI * 2);
      ctx.arc(16, 12, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, 12, 5, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();

      ctx.restore();
    }

    function drawFallingItem(item) {
      ctx.save();
      ctx.translate(item.x, item.y);
      const r = item.radius;

      if (item.type === 'love' || item.type === 'gold') {
        const topColor = item.type === 'gold' ? '#FACC15' : '#F43F5E';

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = topColor;
        ctx.beginPath();
        ctx.arc(0, 0, r, Math.PI, 0);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-r, 0);
        ctx.lineTo(r, 0);
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillStyle = '#1E293B';
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.lineTo(6, -r - 8);
        ctx.stroke();

        ctx.fillStyle = '#F97316';
        ctx.beginPath();
        ctx.arc(7, -r - 9, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#EF4444';
        ctx.fillRect(-8, -3, 5, 4);
        ctx.fillRect(3, -3, 5, 4);
      }

      ctx.restore();
    }

    function drawPopups() {
      popups.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life / 0.75);
        ctx.font = 'bold 16px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#111827';
        ctx.fillText(p.text, p.x + 1.5, p.y + 1.5);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, p.x, p.y);
        ctx.restore();
      });
    }

    function endGame() {
      isRunning = false;
      if (score > bestScore) {
        bestScore = score;
        try {
          localStorage.setItem(STORAGE_BEST_KEY, String(bestScore));
        } catch (e) {
          // Abaikan jika gagal menyimpan
        }
      }
      updateHud();

      if (gameOverlay) {
        gameOverlay.classList.remove('hidden');
      }

      if (score >= 100) {
        if (overlayBadge) {
          overlayBadge.textContent = 'HALL OF FAME CERTIFICATE';
          overlayBadge.classList.add('badge-gold');
        }
        if (overlayHeading) {
          overlayHeading.textContent = `Selamat! Skor Anda ${score} Poin!`;
        }
        if (overlayText) {
          overlayText.textContent =
            'Luar biasa! Anda resmi meraih Sertifikat Kehormatan Tamu Arya & Nadia. Tunjukkan layar ini saat resepsi untuk ucapan terima kasih spesial!';
        }
      } else {
        if (overlayBadge) {
          overlayBadge.textContent = 'WAKTU HABIS!';
          overlayBadge.classList.remove('badge-gold');
        }
        if (overlayHeading) {
          overlayHeading.textContent = `Skor Akhir: ${score} Poin`;
        }
        if (overlayText) {
          overlayText.textContent =
            'Kumpulkan minimal 100 poin untuk membuka Sertifikat Hall of Fame. Ayo coba lagi!';
        }
      }

      if (startGameBtn) {
        startGameBtn.textContent = 'Main Lagi';
      }
    }

    function gameLoop(timestamp) {
      if (!isRunning) return;

      const dt = Math.min(0.05, (timestamp - lastTimestamp) / 1000 || 0.016);
      lastTimestamp = timestamp;

      timeLeft -= dt;
      timerAccumulator += dt;
      spawnAccumulator += dt;

      if (timerAccumulator >= 0.2) {
        timerAccumulator = 0;
        updateHud();
      }

      if (spawnAccumulator >= 0.55) {
        spawnAccumulator = 0;
        spawnItem();
      }

      if (keys.left) player.x -= player.speed * dt;
      if (keys.right) player.x += player.speed * dt;
      player.x = Math.max(36, Math.min(W - 36, player.x));

      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        it.y += it.speed * dt;

        const dx = it.x - player.x;
        const dy = it.y - player.y;
        const hitDist = it.radius + 26;

        if (dx * dx + dy * dy <= hitDist * hitDist) {
          if (it.type === 'love') {
            score += 10;
            addPopup(it.x, it.y - 12, '+10', '#F43F5E');
          } else if (it.type === 'gold') {
            score += 25;
            addPopup(it.x, it.y - 12, '+25', '#D97706');
          } else {
            lives -= 1;
            flashRedAlpha = 0.35;
            addPopup(it.x, it.y - 12, '-1 NYAWA', '#DC2626');
          }
          items.splice(i, 1);
          updateHud();
          continue;
        }

        if (it.y > H + 30) {
          items.splice(i, 1);
        }
      }

      for (let i = popups.length - 1; i >= 0; i--) {
        popups[i].y -= 38 * dt;
        popups[i].life -= dt;
        if (popups[i].life <= 0) {
          popups.splice(i, 1);
        }
      }

      drawArenaBackground();
      items.forEach(drawFallingItem);
      drawMascotPlayer();
      drawPopups();

      if (flashRedAlpha > 0) {
        ctx.fillStyle = `rgba(220, 38, 38, ${flashRedAlpha})`;
        ctx.fillRect(0, 0, W, H);
        flashRedAlpha = Math.max(0, flashRedAlpha - dt * 1.4);
      }

      if (lives <= 0 || timeLeft <= 0) {
        timeLeft = Math.max(0, timeLeft);
        endGame();
        return;
      }

      window.requestAnimationFrame(gameLoop);
    }

    function startNewGame() {
      score = 0;
      lives = 3;
      timeLeft = 30;
      items = [];
      popups = [];
      player.x = W / 2;
      spawnAccumulator = 0;
      timerAccumulator = 0;
      flashRedAlpha = 0;
      isRunning = true;

      updateHud();
      if (gameOverlay) {
        gameOverlay.classList.add('hidden');
      }

      lastTimestamp = performance.now();
      window.requestAnimationFrame(gameLoop);
    }

    drawArenaBackground();
    drawMascotPlayer();

    if (startGameBtn) {
      startGameBtn.addEventListener('click', startNewGame);
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keys.left = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keys.right = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keys.left = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keys.right = false;
      }
    });

    function bindHoldButton(btn, dirKey) {
      if (!btn) return;
      const startMove = (e) => {
        e.preventDefault();
        keys[dirKey] = true;
      };
      const stopMove = () => {
        keys[dirKey] = false;
      };
      btn.addEventListener('pointerdown', startMove);
      btn.addEventListener('pointerup', stopMove);
      btn.addEventListener('pointerleave', stopMove);
      btn.addEventListener('pointercancel', stopMove);
    }

    bindHoldButton(btnLeft, 'left');
    bindHoldButton(btnRight, 'right');

    function movePlayerToClientX(clientX) {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width) return;
      const ratioX = (clientX - rect.left) / rect.width;
      player.x = Math.max(36, Math.min(W - 36, ratioX * W));
    }

    canvas.addEventListener('pointermove', (e) => {
      if (!isRunning) return;
      if (e.pointerType === 'touch' || e.buttons === 1) {
        movePlayerToClientX(e.clientX);
      }
    });

    canvas.addEventListener('pointerdown', (e) => {
      if (!isRunning) return;
      movePlayerToClientX(e.clientX);
    });
  }

  // ========================================================================
  // 6. Animasi Scroll Reveal (.reveal)
  // ========================================================================
  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealItems.forEach((el) => observer.observe(el));
  } else {
    revealItems.forEach((el) => el.classList.add('is-visible'));
  }
});
