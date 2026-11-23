(() => {
  'use strict';

  const CONFIG = {
    weddingDate: '2026-12-20T08:00:00+07:00',
    whatsappNumber: '6288226621362',
    groomName: 'Rizki Fatih',
    brideName: 'Ayu Lestari'
  };

  class PokemonAudioEngine {
    constructor() {
      this.ctx = null;
      this.isPlaying = false;
      this.sfxEnabled = true;
      this.bgmTimer = null;
      this.step = 0;
      this.usingMp3 = false;
      this.lastScrollChime = 0;
      this.bgAudioEl = document.getElementById('bgMusic');
    }

    ensureContext() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    playTone(freq, duration = 0.14, type = 'triangle', gainVal = 0.08, delay = 0) {
      if (!this.sfxEnabled) return;
      this.ensureContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(gainVal, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    }

    playGateOpenFanfare() {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((n, idx) => {
        this.playTone(n, 0.22, 'square', 0.06, idx * 0.09);
      });
    }

    playPikachuChirp() {
      this.ensureContext();
      if (!this.ctx || !this.sfxEnabled) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.exponentialRampToValueAtTime(1180, now + 0.11);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.22);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.32);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.11, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.36);
    }

    playScrollTick() {
      const now = Date.now();
      if (now - this.lastScrollChime < 360) return;
      this.lastScrollChime = now;
      this.playTone(740, 0.055, 'sine', 0.024, 0);
    }

    startSynthLoop() {
      if (this.bgmTimer) return;
      const melody = [
        523.25, 659.25, 783.99, 659.25,
        587.33, 698.46, 880.00, 698.46,
        523.25, 659.25, 783.99, 1046.5,
        987.77, 783.99, 659.25, 587.33
      ];

      this.bgmTimer = window.setInterval(() => {
        if (!this.isPlaying || this.usingMp3) return;
        this.ensureContext();
        if (!this.ctx) return;

        const freq = melody[this.step % melody.length];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.045, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.38);
        this.step += 1;
      }, 420);
    }

    async startBgm() {
      if (this.isPlaying) return;
      this.ensureContext();
      this.isPlaying = true;
      this.updateUi();

      if (this.bgAudioEl) {
        try {
          this.bgAudioEl.volume = 0.45;
          await this.bgAudioEl.play();
          this.usingMp3 = true;
          return;
        } catch (_) {
          this.usingMp3 = false;
        }
      }
      this.startSynthLoop();
    }

    stopBgm() {
      this.isPlaying = false;
      if (this.bgAudioEl && !this.bgAudioEl.paused) {
        this.bgAudioEl.pause();
      }
      if (this.bgmTimer) {
        clearInterval(this.bgmTimer);
        this.bgmTimer = null;
      }
      this.updateUi();
    }

    toggleBgm() {
      if (this.isPlaying) {
        this.stopBgm();
      } else {
        this.startBgm();
      }
    }

    toggleSfx() {
      this.sfxEnabled = !this.sfxEnabled;
      const btn = document.getElementById('toggleSfxBtn');
      if (btn) {
        btn.textContent = this.sfxEnabled ? 'SFX ON' : 'SFX OFF';
        btn.setAttribute('aria-pressed', String(this.sfxEnabled));
      }
      if (this.sfxEnabled) {
        this.playTone(880, 0.09, 'square', 0.05);
      }
    }

    updateUi() {
      const btn = document.getElementById('toggleMusicBtn');
      const label = document.getElementById('musicStatusText');
      if (btn && label) {
        btn.classList.toggle('is-playing', this.isPlaying);
        btn.setAttribute('aria-pressed', String(this.isPlaying));
        label.textContent = this.isPlaying ? 'BGM ON' : 'BGM OFF';
      }
    }
  }

  const audioEngine = new PokemonAudioEngine();

  const trailCanvas = document.getElementById('sparkTrailCanvas');
  const trailCtx = trailCanvas ? trailCanvas.getContext('2d') : null;
  const trailParticles = [];

  function resizeTrailCanvas() {
    if (!trailCanvas) return;
    trailCanvas.width = window.innerWidth;
    trailCanvas.height = window.innerHeight;
  }

  if (trailCanvas && trailCtx) {
    resizeTrailCanvas();
    window.addEventListener('resize', resizeTrailCanvas);

    window.addEventListener('pointermove', (e) => {
      if (trailParticles.length > 65) return;
      trailParticles.push({
        x: e.clientX,
        y: e.clientY,
        vx: (Math.random() - 0.5) * 2.2,
        vy: -0.6 - Math.random() * 1.5,
        size: 3 + Math.random() * 3.5,
        alpha: 0.95,
        color: Math.random() > 0.4 ? '#FACC15' : '#38BDF8'
      });
    }, { passive: true });

    const renderTrailLoop = () => {
      trailCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
      for (let i = trailParticles.length - 1; i >= 0; i -= 1) {
        const p = trailParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.032;
        if (p.alpha <= 0) {
          trailParticles.splice(i, 1);
          continue;
        }
        trailCtx.save();
        trailCtx.globalAlpha = p.alpha;
        trailCtx.fillStyle = p.color;
        trailCtx.fillRect(p.x, p.y, p.size, p.size);
        trailCtx.restore();
      }
      requestAnimationFrame(renderTrailLoop);
    };
    requestAnimationFrame(renderTrailLoop);
  }

  const params = new URLSearchParams(window.location.search);
  const guestParam = params.get('to');
  if (guestParam && guestParam.trim()) {
    const cleanGuest = guestParam.trim().slice(0, 60);
    const guestEl = document.getElementById('guestNameDisplay');
    const senderInput = document.getElementById('senderName');
    if (guestEl) guestEl.textContent = cleanGuest;
    if (senderInput) senderInput.value = cleanGuest;
  }

  const gateEl = document.getElementById('gate');
  const openGateBtn = document.getElementById('openGateBtn');
  const gateFlashBurst = document.getElementById('gateFlashBurst');
  let gateOpened = false;

  if (gateEl && !window.location.hash) {
    document.body.classList.add('gate-locked');
  } else if (gateEl && window.location.hash) {
    gateEl.classList.add('is-opened');
    gateOpened = true;
  }

  function openSanctuaryGate() {
    if (gateOpened) return;
    gateOpened = true;
    document.body.classList.remove('gate-locked');

    if (gateFlashBurst) {
      gateFlashBurst.classList.add('is-flashing');
    }
    if (gateEl) {
      gateEl.classList.add('is-opened');
    }
    audioEngine.playGateOpenFanfare();
    audioEngine.startBgm();
  }

  openGateBtn?.addEventListener('click', openSanctuaryGate);

  let audioBootstrapped = false;
  function bootstrapAudioOnGesture() {
    if (!audioBootstrapped) {
      audioBootstrapped = true;
      audioEngine.startBgm();
    }
  }

  const progressFill = document.getElementById('journeyProgressFill');
  function updateScrollProgress() {
    if (!progressFill) return;
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = docHeight > 0 ? Math.min(1, Math.max(0, scrollTop / docHeight)) : 0;
    progressFill.style.transform = `scaleX(${ratio})`;
  }

  window.addEventListener('pointerdown', bootstrapAudioOnGesture, { once: true });
  window.addEventListener('scroll', () => {
    bootstrapAudioOnGesture();
    audioEngine.playScrollTick();
    updateScrollProgress();
  }, { passive: true });
  updateScrollProgress();

  document.getElementById('toggleMusicBtn')?.addEventListener('click', () => {
    audioBootstrapped = true;
    audioEngine.toggleBgm();
  });

  document.getElementById('toggleSfxBtn')?.addEventListener('click', () => {
    audioEngine.toggleSfx();
  });

  const heroCanvas = document.getElementById('heroWorldCanvas');
  const heroCtx = heroCanvas ? heroCanvas.getContext('2d') : null;
  const heroParticles = [];

  function resizeHeroCanvas() {
    if (!heroCanvas) return;
    heroCanvas.width = heroCanvas.offsetWidth;
    heroCanvas.height = heroCanvas.offsetHeight;
  }

  function spawnHeroSparks(count = 14, originX = null, originY = null) {
    if (!heroCanvas) return;
    for (let i = 0; i < count; i += 1) {
      heroParticles.push({
        x: originX !== null ? originX : Math.random() * heroCanvas.width,
        y: originY !== null ? originY : Math.random() * heroCanvas.height,
        vx: (Math.random() - 0.5) * (originX !== null ? 6.5 : 0.7),
        vy: originY !== null ? (Math.random() - 0.85) * 6 : -0.4 - Math.random() * 0.8,
        size: 3 + Math.random() * 4.5,
        alpha: 1,
        color: Math.random() > 0.35 ? '#FACC15' : '#FFFFFF'
      });
    }
  }

  if (heroCanvas && heroCtx) {
    resizeHeroCanvas();
    window.addEventListener('resize', resizeHeroCanvas);
    spawnHeroSparks(32);

    const renderHeroLoop = () => {
      heroCtx.clearRect(0, 0, heroCanvas.width, heroCanvas.height);

      if (heroParticles.length < 30) {
        spawnHeroSparks(1);
      }

      for (let i = heroParticles.length - 1; i >= 0; i -= 1) {
        const p = heroParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.008;

        if (p.alpha <= 0 || p.y < -10) {
          heroParticles.splice(i, 1);
          continue;
        }

        heroCtx.save();
        heroCtx.globalAlpha = p.alpha;
        heroCtx.fillStyle = p.color;
        heroCtx.fillRect(p.x, p.y, p.size, p.size);
        heroCtx.restore();
      }
      requestAnimationFrame(renderHeroLoop);
    };
    requestAnimationFrame(renderHeroLoop);
  }

  const pikachuBtn = document.getElementById('pikachuTrigger');
  const pikaBubble = document.getElementById('pikaSpeechBubble');
  const pikaEmoteLayer = document.getElementById('pikaEmoteLayer');
  const rpgDialogueBtn = document.getElementById('rpgDialogueBtn');
  const rpgTypewriterText = document.getElementById('rpgTypewriterText');

  const pikaLines = [
    'Pika-Pika! Selamat menempuh hidup baru untuk Fatih & Ayu!',
    '⚡ 100.000 Volt Cinta siap menerangi perjalanan mereka!',
    'Pika-Chu! Jangan lupa lihat foto prewedding & mainkan mini-game!',
    'Pokéball Cinta tertangkap! Sampai jumpa di arena resepsi!'
  ];
  let pikaLineIdx = 0;

  function spawnPikachuEmotes() {
    if (!pikaEmoteLayer) return;
    const symbols = ['⚡', '♥', '+LOVE', '★'];
    symbols.forEach((sym, i) => {
      const span = document.createElement('span');
      span.className = 'floating-emote';
      span.textContent = sym;
      const spreadX = (i - 1.5) * 44;
      span.style.setProperty('--dx', `${spreadX}px`);
      pikaEmoteLayer.appendChild(span);
      setTimeout(() => span.remove(), 1100);
    });
  }

  pikachuBtn?.addEventListener('click', (e) => {
    audioEngine.playPikachuChirp();
    pikachuBtn.classList.remove('is-excited');
    void pikachuBtn.offsetWidth;
    pikachuBtn.classList.add('is-excited');

    if (rpgDialogueBtn) {
      rpgDialogueBtn.classList.remove('is-shaking');
      void rpgDialogueBtn.offsetWidth;
      rpgDialogueBtn.classList.add('is-shaking');
    }

    pikaLineIdx = (pikaLineIdx + 1) % pikaLines.length;
    if (pikaBubble) {
      pikaBubble.textContent = pikaLines[pikaLineIdx];
    }

    spawnPikachuEmotes();

    if (heroCanvas) {
      const rect = heroCanvas.getBoundingClientRect();
      spawnHeroSparks(26, e.clientX - rect.left, e.clientY - rect.top);
    }
  });

  const rpgDialogues = [
    'Assalamu’alaikum Warahmatullahi Wabarakatuh. Dengan memohon rahmat Allah SWT, kami mengundang Anda hadir dalam momen sakral pernikahan kami.',
    '“Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan hidup agar kamu cenderung dan merasa tenteram kepadanya.” (QS. Ar-Rum: 21)',
    'Siapkan tim terbaikmu! Hadiri Akad & Resepsi di Kanto Sanctuary, lalu uji ketangkasanmu di Arcade Mini-Game di bawah!'
  ];
  let dialogueIdx = 0;
  let typewriterTimer = null;

  function runTypewriter(text) {
    if (!rpgTypewriterText) return;
    if (typewriterTimer) clearInterval(typewriterTimer);
    rpgTypewriterText.textContent = '';
    let i = 0;
    typewriterTimer = window.setInterval(() => {
      rpgTypewriterText.textContent += text.charAt(i);
      i += 1;
      if (i >= text.length) {
        clearInterval(typewriterTimer);
        typewriterTimer = null;
      }
    }, 18);
  }

  rpgDialogueBtn?.addEventListener('click', () => {
    dialogueIdx = (dialogueIdx + 1) % rpgDialogues.length;
    audioEngine.playTone(987.77, 0.08, 'square', 0.045);
    runTypewriter(rpgDialogues[dialogueIdx]);
  });

  const targetTimestamp = new Date(CONFIG.weddingDate).getTime();

  function updateCountdown() {
    const diff = Math.max(0, targetTimestamp - Date.now());
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);

    const pad = (v) => String(v).padStart(2, '0');
    const dEl = document.getElementById('cdDays');
    const hEl = document.getElementById('cdHours');
    const mEl = document.getElementById('cdMins');
    const sEl = document.getElementById('cdSecs');

    if (dEl) dEl.textContent = pad(days);
    if (hEl) hEl.textContent = pad(hours);
    if (mEl) mEl.textContent = pad(mins);
    if (sEl) sEl.textContent = pad(secs);
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  document.querySelectorAll('.tilt-card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(750px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
    });
    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });
  });

  document.querySelectorAll('.stamp-pass-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.gym-pass-card');
      if (!card) return;
      card.classList.add('is-stamped');
      btn.textContent = 'Badge Terkumpul ✓';
      audioEngine.playGateOpenFanfare();
    });
  });

  const gameCanvas = document.getElementById('pikaGameCanvas');
  const gCtx = gameCanvas ? gameCanvas.getContext('2d') : null;
  const startGameBtn = document.getElementById('startGameBtn');
  const gameOverlay = document.getElementById('gameOverlayScreen');
  const gameOverlayTitle = document.getElementById('gameOverlayTitle');
  const gameOverlayMsg = document.getElementById('gameOverlayMsg');
  const scoreEl = document.getElementById('gameScore');
  const comboEl = document.getElementById('gameCombo');
  const livesEl = document.getElementById('gameLives');
  const rewardBanner = document.getElementById('rewardBanner');
  const rewardText = document.getElementById('rewardText');

  const gameState = {
    running: false,
    score: 0,
    combo: 1,
    lives: 3,
    playerX: 320,
    moveDir: 0,
    items: [],
    popups: [],
    bursts: [],
    spawnTimer: 0,
    shakeTimer: 0,
    cloudOffset: 0,
    rewardUnlocked: false
  };

  function updateGameHud() {
    if (scoreEl) scoreEl.textContent = String(gameState.score);
    if (comboEl) comboEl.textContent = `x${gameState.combo}`;
    if (livesEl) {
      livesEl.textContent = '♥'.repeat(Math.max(0, gameState.lives)) || '0';
    }

    if (gameState.score >= 100 && !gameState.rewardUnlocked) {
      gameState.rewardUnlocked = true;
      if (rewardBanner && rewardText) {
        rewardBanner.classList.add('unlocked');
        const badge = rewardBanner.querySelector('.reward-badge');
        if (badge) badge.textContent = 'UNLOCKED!';
        rewardText.textContent = 'Selamat! Kamu mendapat gelar "Master Wedding Trainer" — tunjukkan layar ini di meja tamu untuk souvenir spesial!';
      }
      audioEngine.playGateOpenFanfare();
    }
  }

  function addGamePopup(x, y, text, color) {
    gameState.popups.push({ x, y, text, color, alpha: 1 });
  }

  function addGameBurst(x, y, color) {
    for (let i = 0; i < 12; i += 1) {
      const angle = (Math.PI * 2 * i) / 12;
      const speed = 2 + Math.random() * 3.5;
      gameState.bursts.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        alpha: 1
      });
    }
  }

  function startPikaGame() {
    gameState.running = true;
    gameState.score = 0;
    gameState.combo = 1;
    gameState.lives = 3;
    gameState.playerX = 320;
    gameState.items = [];
    gameState.popups = [];
    gameState.bursts = [];
    gameState.spawnTimer = 0;
    gameState.shakeTimer = 0;
    updateGameHud();

    if (gameOverlay) gameOverlay.classList.add('is-hidden');
    audioEngine.playTone(660, 0.12, 'square', 0.06);
  }

  function endPikaGame() {
    gameState.running = false;
    if (gameOverlay && gameOverlayTitle && gameOverlayMsg && startGameBtn) {
      gameOverlayTitle.textContent = `SKOR AKHIR: ${gameState.score}`;
      gameOverlayMsg.textContent = gameState.score >= 100
        ? 'Luar biasa! Kamu berhasil membuka Kartu Ucapan Rahasia Pikachu!'
        : 'Ayo coba lagi dan raih 100 poin untuk membuka hadiah rahasia!';
      startGameBtn.textContent = 'MAIN LAGI';
      gameOverlay.classList.remove('is-hidden');
    }
  }

  function spawnFallingItem() {
    const roll = Math.random();
    let type = 'pokeball';
    if (roll > 0.78) type = 'bomb';
    else if (roll > 0.56) type = 'ring';

    gameState.items.push({
      x: 36 + Math.random() * (640 - 72),
      y: -24,
      vy: 2.6 + Math.min(3.5, gameState.score * 0.015) + Math.random() * 1.3,
      wobblePhase: Math.random() * Math.PI * 2,
      type
    });
  }

  function drawGamePlayer(ctx, x, y, tiltDir, combo) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tiltDir * 0.12);

    if (combo >= 3) {
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.75)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -4, 38, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = '#FACC15';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-20, -18);
    ctx.lineTo(-30, -42);
    ctx.lineTo(-8, -24);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(20, -18);
    ctx.lineTo(30, -42);
    ctx.lineTo(8, -24);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.roundRect(-26, -24, 52, 44, 18);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(-11, -5, 4, 0, Math.PI * 2);
    ctx.arc(11, -5, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(-18, 5, 5, 0, Math.PI * 2);
    ctx.arc(18, 5, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawFallingItem(ctx, item) {
    ctx.save();
    ctx.translate(item.x, item.y);

    if (item.type === 'pokeball') {
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(0, 0, 15, Math.PI, 0);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (item.type === 'ring') {
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 2, 12, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(7, -9);
      ctx.lineTo(0, -3);
      ctx.lineTo(-7, -9);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = '#6B21A8';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FEF08A';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('!', 0, 5);
    }

    ctx.restore();
  }

  function gameLoop() {
    if (gCtx && gameCanvas) {
      gCtx.save();
      if (gameState.shakeTimer > 0) {
        gameState.shakeTimer -= 1;
        gCtx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
      }

      const grad = gCtx.createLinearGradient(0, 0, 0, 360);
      grad.addColorStop(0, '#1e3a8a');
      grad.addColorStop(0.82, '#38bdf8');
      grad.addColorStop(0.82, '#16a34a');
      grad.addColorStop(1, '#15803d');
      gCtx.fillStyle = grad;
      gCtx.fillRect(0, 0, 640, 360);

      gameState.cloudOffset = (gameState.cloudOffset + 0.4) % 720;
      gCtx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      gCtx.fillRect(gameState.cloudOffset - 80, 44, 72, 18);
      gCtx.fillRect(((gameState.cloudOffset + 340) % 720) - 80, 84, 58, 15);

      if (gameState.running) {
        gameState.playerX += gameState.moveDir * 7.5;
        gameState.playerX = Math.max(42, Math.min(640 - 42, gameState.playerX));

        gameState.spawnTimer += 1;
        if (gameState.spawnTimer >= 36) {
          gameState.spawnTimer = 0;
          spawnFallingItem();
        }

        for (let i = gameState.items.length - 1; i >= 0; i -= 1) {
          const item = gameState.items[i];
          item.y += item.vy;
          item.wobblePhase += 0.08;
          item.x += Math.sin(item.wobblePhase) * 0.6;

          const hitX = Math.abs(item.x - gameState.playerX) < 38;
          const hitY = Math.abs(item.y - 306) < 28;

          if (hitX && hitY) {
            if (item.type === 'bomb') {
              gameState.lives -= 1;
              gameState.combo = 1;
              gameState.shakeTimer = 14;
              addGameBurst(item.x, item.y, '#A855F7');
              addGamePopup(item.x, item.y - 14, '-1 HP!', '#FCA5A5');
              audioEngine.playTone(150, 0.24, 'sawtooth', 0.09);
            } else {
              const basePts = item.type === 'ring' ? 25 : 10;
              const gained = basePts * gameState.combo;
              gameState.score += gained;
              gameState.combo = Math.min(4, gameState.combo + 1);
              addGameBurst(item.x, item.y, item.type === 'ring' ? '#38BDF8' : '#FACC15');
              addGamePopup(item.x, item.y - 14, `+${gained}`, '#FEF08A');
              audioEngine.playTone(item.type === 'ring' ? 1046.5 : 880, 0.11, 'triangle', 0.08);
            }
            gameState.items.splice(i, 1);
            updateGameHud();

            if (gameState.lives <= 0) {
              endPikaGame();
              break;
            }
            continue;
          }

          if (item.y > 380) {
            if (item.type !== 'bomb') {
              gameState.combo = 1;
              updateGameHud();
            }
            gameState.items.splice(i, 1);
            continue;
          }

          drawFallingItem(gCtx, item);
        }
      }

      for (let i = gameState.bursts.length - 1; i >= 0; i -= 1) {
        const b = gameState.bursts[i];
        b.x += b.vx;
        b.y += b.vy;
        b.alpha -= 0.04;
        if (b.alpha <= 0) {
          gameState.bursts.splice(i, 1);
          continue;
        }
        gCtx.save();
        gCtx.globalAlpha = b.alpha;
        gCtx.fillStyle = b.color;
        gCtx.fillRect(b.x, b.y, 5, 5);
        gCtx.restore();
      }

      for (let i = gameState.popups.length - 1; i >= 0; i -= 1) {
        const pop = gameState.popups[i];
        pop.y -= 1.2;
        pop.alpha -= 0.028;
        if (pop.alpha <= 0) {
          gameState.popups.splice(i, 1);
          continue;
        }
        gCtx.save();
        gCtx.globalAlpha = pop.alpha;
        gCtx.fillStyle = pop.color;
        gCtx.font = 'bold 15px monospace';
        gCtx.textAlign = 'center';
        gCtx.fillText(pop.text, pop.x, pop.y);
        gCtx.restore();
      }

      drawGamePlayer(gCtx, gameState.playerX, 308, gameState.moveDir, gameState.combo);
      gCtx.restore();
    }
    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);

  startGameBtn?.addEventListener('click', startPikaGame);

  gameCanvas?.addEventListener('pointermove', (e) => {
    if (!gameState.running) return;
    const rect = gameCanvas.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * 640;
    gameState.playerX = Math.max(42, Math.min(640 - 42, relX));
  });

  const leftBtn = document.getElementById('btnMoveLeft');
  const rightBtn = document.getElementById('btnMoveRight');

  leftBtn?.addEventListener('pointerdown', () => { gameState.moveDir = -1; });
  leftBtn?.addEventListener('pointerup', () => { gameState.moveDir = 0; });
  leftBtn?.addEventListener('pointerleave', () => { gameState.moveDir = 0; });

  rightBtn?.addEventListener('pointerdown', () => { gameState.moveDir = 1; });
  rightBtn?.addEventListener('pointerup', () => { gameState.moveDir = 0; });
  rightBtn?.addEventListener('pointerleave', () => { gameState.moveDir = 0; });

  window.addEventListener('keydown', (e) => {
    if (!gameState.running) return;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') gameState.moveDir = -1;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') gameState.moveDir = 1;
  });

  window.addEventListener('keyup', (e) => {
    if (['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D'].includes(e.key)) {
      gameState.moveDir = 0;
    }
  });

  const rsvpForm = document.getElementById('rsvpForm');
  const formErrorMsg = document.getElementById('formErrorMsg');

  rsvpForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('senderName');
    const wishInput = document.getElementById('wishMessage');
    const countSelect = document.getElementById('guestCount');
    const attendanceRadio = rsvpForm.querySelector('input[name="attendance"]:checked');

    const name = nameInput?.value.trim() || '';
    const wish = wishInput?.value.trim() || '';
    const count = countSelect?.value || '1 Orang';
    const status = attendanceRadio?.value || 'Hadir';

    if (!name) {
      if (formErrorMsg) formErrorMsg.textContent = 'Mohon isi nama Trainer / Tamu terlebih dahulu.';
      nameInput?.focus();
      return;
    }

    if (!wish) {
      if (formErrorMsg) formErrorMsg.textContent = 'Mohon tuliskan ucapan atau doa restu.';
      wishInput?.focus();
      return;
    }

    if (formErrorMsg) formErrorMsg.textContent = '';

    const message =
      `Halo ${CONFIG.groomName} & ${CONFIG.brideName}!%0A%0A` +
      `*KONFIRMASI KEHADIRAN (KANTO WEDDING PASS)*%0A` +
      `• Nama: ${encodeURIComponent(name)}%0A` +
      `• Status: ${encodeURIComponent(status)}%0A` +
      `• Rombongan: ${encodeURIComponent(count)}%0A` +
      `• Ucapan: ${encodeURIComponent(wish)}`;

    audioEngine.playGateOpenFanfare();
    window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${message}`, '_blank', 'noopener');
  });

  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.getAttribute('data-copy') || '';
      try {
        await navigator.clipboard.writeText(text);
        const orig = btn.textContent;
        btn.textContent = 'Tersalin!';
        audioEngine.playTone(987.77, 0.1, 'triangle', 0.06);
        setTimeout(() => {
          btn.textContent = orig;
        }, 1800);
      } catch (_) {
        btn.textContent = text;
      }
    });
  });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal-on-scroll').forEach((el) => {
    revealObserver.observe(el);
  });

  const sections = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('.main-nav .nav-link');
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach((link) => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, { rootMargin: '-40% 0px -50% 0px' });

  sections.forEach((sec) => navObserver.observe(sec));
})();
