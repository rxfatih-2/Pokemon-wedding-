(() => {
  "use strict";

  const WEDDING_DATE = new Date("2026-12-19T08:00:00+07:00").getTime();
  const WHATSAPP_NUMBER = "6288226621362";
  const WISHES_STORAGE_KEY = "rxfatih_pikachu_wedding_wishes_v1";
  const AUDIO_CANDIDATES = ["musik.mp3", "assets/musik.mp3", "assets/music.mp3"];
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let sharedAudioCtx = null;
  let backsoundPlaying = false;
  let allMp3Failed = false;
  let candidateIndex = 0;
  let synthLoopTimer = null;

  const DEFAULT_WISHES = [
    {
      name: "Raka & Keluarga",
      status: "Hadir",
      guests: "2 Orang",
      message: "Selamat menempuh hidup baru Dimas & Nabila! Semoga selalu penuh kebahagiaan dan energi positif seperti tema undangannya.",
      timestamp: "28 Nov 2026"
    },
    {
      name: "Nadia Putri",
      status: "Hadir",
      guests: "1 Orang",
      message: "Barakallahu lakuma wa baraka 'alaikuma. Sampai bertemu di hari bahagia nanti!",
      timestamp: "28 Nov 2026"
    }
  ];

  function getAudioContext() {
    if (!sharedAudioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx && sharedAudioCtx.state === "suspended") {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  }

  function playCharacterChirp(voice = "pikachu") {
    const ctx = getAudioContext();
    if (!ctx) return;

    const profiles = {
      pikachu: [784, 1046.5, 1318.5],
      eevee: [659.25, 880, 1174.66],
      pichu: [987.77, 1318.5, 1567.98],
      togepi: [587.33, 739.99, 987.77]
    };

    const notes = profiles[voice] || profiles.pikachu;
    const now = ctx.currentTime;

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + index * 0.065;

      osc.type = voice === "eevee" ? "sine" : "triangle";
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.08, start + 0.09);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.16, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0008, start + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.18);
    });
  }

  function playMusicBoxBeat(step) {
    if (document.hidden) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const progression = [
      { chord: [261.63, 329.63, 392.0], melody: [659.25, 783.99, 659.25, 523.25] },
      { chord: [220.0, 261.63, 329.63], melody: [587.33, 659.25, 523.25, 440.0] },
      { chord: [174.61, 220.0, 261.63], melody: [440.0, 523.25, 698.46, 659.25] },
      { chord: [196.0, 246.94, 293.66], melody: [587.33, 493.88, 392.0, 587.33] }
    ];

    const barIndex = Math.floor(step / 4) % progression.length;
    const beatInBar = step % 4;
    const bar = progression[barIndex];
    const now = ctx.currentTime;

    if (beatInBar === 0) {
      bar.chord.forEach((freq) => {
        const padOsc = ctx.createOscillator();
        const padGain = ctx.createGain();
        padOsc.type = "sine";
        padOsc.frequency.setValueAtTime(freq, now);

        padGain.gain.setValueAtTime(0.001, now);
        padGain.gain.linearRampToValueAtTime(0.075, now + 0.12);
        padGain.gain.exponentialRampToValueAtTime(0.001, now + 1.65);

        padOsc.connect(padGain);
        padGain.connect(ctx.destination);
        padOsc.start(now);
        padOsc.stop(now + 1.7);
      });
    }

    const leadFreq = bar.melody[beatInBar];
    const bellOsc = ctx.createOscillator();
    const bellGain = ctx.createGain();

    bellOsc.type = "triangle";
    bellOsc.frequency.setValueAtTime(leadFreq, now);

    bellGain.gain.setValueAtTime(0.001, now);
    bellGain.gain.linearRampToValueAtTime(0.24, now + 0.025);
    bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    bellOsc.connect(bellGain);
    bellGain.connect(ctx.destination);
    bellOsc.start(now);
    bellOsc.stop(now + 0.45);
  }

  function startRomanticMusicBox() {
    backsoundPlaying = true;
    if (synthLoopTimer) return;
    let step = 0;
    playMusicBoxBeat(step);
    step += 1;
    synthLoopTimer = window.setInterval(() => {
      playMusicBoxBeat(step);
      step += 1;
    }, 440);
  }

  function triggerBacksound() {
    const bgMusic = document.getElementById("bg-music");
    getAudioContext();

    if (allMp3Failed || !bgMusic) {
      startRomanticMusicBox();
      return;
    }

    if (!bgMusic.paused) {
      backsoundPlaying = true;
      return;
    }

    bgMusic.volume = 0.85;
    const playPromise = bgMusic.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          backsoundPlaying = true;
        })
        .catch(() => {
          // Akan dicoba lagi saat tap/klik penuh berikutnya atau saat fallback error aktif
        });
    } else {
      backsoundPlaying = true;
    }
  }

  function initBacksoundSystem() {
    const bgMusic = document.getElementById("bg-music");
    if (!bgMusic) {
      allMp3Failed = true;
    } else {
      bgMusic.addEventListener("error", () => {
        candidateIndex += 1;
        if (candidateIndex < AUDIO_CANDIDATES.length) {
          bgMusic.src = AUDIO_CANDIDATES[candidateIndex];
          bgMusic.load();
          if (backsoundPlaying) {
            bgMusic.play().catch(() => {});
          }
        } else {
          allMp3Failed = true;
          if (backsoundPlaying) {
            startRomanticMusicBox();
          }
        }
      });
    }

    const handleUserGesture = () => {
      if (backsoundPlaying && bgMusic && !bgMusic.paused) return;
      triggerBacksound();
    };

    ["pointerdown", "touchstart", "click", "keydown"].forEach((evt) => {
      document.addEventListener(evt, handleUserGesture, { passive: true });
    });

    document.addEventListener("visibilitychange", () => {
      if (!bgMusic || allMp3Failed || !backsoundPlaying) return;
      if (document.hidden) {
        bgMusic.pause();
      } else {
        bgMusic.play().catch(() => {});
      }
    });
  }

  function initHamburgerMenu() {
    const toggleBtn = document.getElementById("nav-toggle");
    const drawer = document.getElementById("mobile-drawer");
    if (!toggleBtn || !drawer) return;

    const closeDrawer = () => {
      toggleBtn.setAttribute("aria-expanded", "false");
      toggleBtn.setAttribute("aria-label", "Buka menu navigasi");
      drawer.hidden = true;
    };

    const openDrawer = () => {
      toggleBtn.setAttribute("aria-expanded", "true");
      toggleBtn.setAttribute("aria-label", "Tutup menu navigasi");
      drawer.hidden = false;
    };

    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isExpanded = toggleBtn.getAttribute("aria-expanded") === "true";
      if (isExpanded) closeDrawer();
      else openDrawer();
    });

    drawer.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeDrawer);
    });

    document.addEventListener("click", (e) => {
      if (drawer.hidden) return;
      if (!drawer.contains(e.target) && !toggleBtn.contains(e.target)) {
        closeDrawer();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !drawer.hidden) {
        closeDrawer();
        toggleBtn.focus();
      }
    });
  }

  function initGuestPersonalization() {
    const params = new URLSearchParams(window.location.search);
    const guestParam = params.get("to");
    if (!guestParam) return;

    const cleanName = guestParam.trim().slice(0, 60);
    if (!cleanName) return;

    const displayEl = document.getElementById("guest-name-display");
    const rsvpInput = document.getElementById("rsvp-name");
    if (displayEl) displayEl.textContent = cleanName;
    if (rsvpInput) rsvpInput.value = cleanName;
  }

  function spawnDomParticleBurst(x, y, mode = "electric") {
    if (prefersReducedMotion) return;
    const palette =
      mode === "heart"
        ? ["#E11D48", "#FB7185", "#FACC15"]
        : mode === "star"
        ? ["#F59E0B", "#FACC15", "#78350F"]
        : ["#FACC15", "#E11D48", "#1C1917"];

    for (let i = 0; i < 12; i += 1) {
      const el = document.createElement("span");
      el.className = "dom-spark-burst";
      const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.35;
      const dist = 42 + Math.random() * 48;
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.color = palette[i % palette.length];
      el.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
      el.style.setProperty("--dy", `${Math.sin(angle) * dist - 18}px`);
      el.textContent = mode === "heart" ? "♥" : mode === "star" ? "✦" : "⚡";
      document.body.appendChild(el);
      window.setTimeout(() => el.remove(), 740);
    }
  }

  function triggerCharacterExcitement(el, clientX, clientY) {
    const mode = el.getAttribute("data-spark") || "electric";
    const voice = el.getAttribute("data-voice") || "pikachu";

    el.classList.remove("is-bouncing", "is-excited");
    void el.offsetWidth;
    el.classList.add("is-bouncing", "is-excited");

    playCharacterChirp(voice);

    const rect = el.getBoundingClientRect();
    const cx = clientX || rect.left + rect.width / 2;
    const cy = clientY || rect.top + rect.height / 2;
    spawnDomParticleBurst(cx, cy, mode);

    window.clearTimeout(el._bubbleTimeout);
    el._bubbleTimeout = window.setTimeout(() => {
      el.classList.remove("is-excited");
    }, 2000);
  }

  function initCharacterInteractions() {
    document.querySelectorAll("[data-spark]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        triggerCharacterExcitement(btn, e.clientX, e.clientY);
      });
    });

    const cheerAllBtn = document.getElementById("cheer-all-btn");
    if (cheerAllBtn) {
      cheerAllBtn.addEventListener("click", () => {
        const actors = document.querySelectorAll(".full-char-actor");
        actors.forEach((actor, idx) => {
          window.setTimeout(() => {
            triggerCharacterExcitement(actor);
          }, idx * 140);
        });
      });
    }
  }

  function initOpeningGate() {
    const gate = document.getElementById("opening-gate");
    const openBtn = document.getElementById("open-invitation-btn");
    if (!gate || !openBtn) return;

    document.body.classList.add("gate-locked");

    openBtn.addEventListener("click", (e) => {
      const rect = openBtn.getBoundingClientRect();
      spawnDomParticleBurst(
        e.clientX || rect.left + rect.width / 2,
        e.clientY || rect.top + rect.height / 2,
        "electric"
      );

      gate.classList.add("is-opened");
      document.body.classList.remove("gate-locked");
      triggerBacksound();
    });
  }

  function initGateSparks() {
    if (prefersReducedMotion) return;
    const canvas = document.getElementById("gate-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let width = 0;
    let height = 0;
    const motes = [];
    const trail = [];

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 42; i += 1) {
      motes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 2 + Math.random() * 4.5,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -0.35 - Math.random() * 0.85,
        color: i % 4 === 0 ? "#E11D48" : i % 2 === 0 ? "#FEF9C3" : "#78350F"
      });
    }

    window.addEventListener("pointermove", (e) => {
      if (document.getElementById("opening-gate")?.classList.contains("is-opened")) return;
      trail.push({
        x: e.clientX,
        y: e.clientY,
        life: 1,
        vx: (Math.random() - 0.5) * 2.4,
        vy: (Math.random() - 0.5) * 2.4
      });
    });

    const render = () => {
      if (document.getElementById("opening-gate")?.classList.contains("is-opened")) return;
      ctx.clearRect(0, 0, width, height);

      for (const m of motes) {
        m.x += m.vx;
        m.y += m.vy;
        if (m.y < -12) m.y = height + 12;
        if (m.x < -12) m.x = width + 12;
        if (m.x > width + 12) m.x = -12;

        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fillStyle = m.color;
        ctx.globalAlpha = 0.34;
        ctx.fill();
      }

      for (let i = trail.length - 1; i >= 0; i -= 1) {
        const t = trail[i];
        t.x += t.vx;
        t.y += t.vy;
        t.life -= 0.045;
        if (t.life <= 0) {
          trail.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(t.x, t.y, 4 * t.life, 0, Math.PI * 2);
        ctx.fillStyle = "#E11D48";
        ctx.globalAlpha = t.life * 0.65;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
  }

  function initHeroAmbientCanvas() {
    if (prefersReducedMotion) return;
    const canvas = document.getElementById("hero-ambient-canvas");
    const heroSection = document.getElementById("hero");
    if (!canvas || !heroSection) return;

    const ctx = canvas.getContext("2d");
    let width = 0;
    let height = 0;
    const orbs = [];

    const resize = () => {
      const rect = heroSection.getBoundingClientRect();
      width = canvas.width = rect.width;
      height = canvas.height = rect.height;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 28; i += 1) {
      orbs.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 2.5 + Math.random() * 5,
        vx: (Math.random() - 0.5) * 0.45,
        vy: -0.25 - Math.random() * 0.55,
        phase: Math.random() * Math.PI * 2,
        color: i % 5 === 0 ? "#E11D48" : i % 2 === 0 ? "#F59E0B" : "#78350F"
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      for (const orb of orbs) {
        orb.phase += 0.025;
        orb.x += orb.vx + Math.sin(orb.phase) * 0.25;
        orb.y += orb.vy;
        if (orb.y < -12) orb.y = height + 12;
        if (orb.x < -12) orb.x = width + 12;
        if (orb.x > width + 12) orb.x = -12;

        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
        ctx.fillStyle = orb.color;
        ctx.globalAlpha = 0.22 + Math.sin(orb.phase) * 0.1;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
  }

  function initCountdown() {
    const daysEl = document.getElementById("cd-days");
    const hoursEl = document.getElementById("cd-hours");
    const minsEl = document.getElementById("cd-minutes");
    const secsEl = document.getElementById("cd-seconds");
    if (!daysEl || !hoursEl || !minsEl || !secsEl) return;

    const pad = (n) => String(Math.max(0, n)).padStart(2, "0");

    const tick = () => {
      const diff = Math.max(0, WEDDING_DATE - Date.now());
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);

      daysEl.textContent = pad(days);
      hoursEl.textContent = pad(hours);
      minsEl.textContent = pad(mins);
      secsEl.textContent = pad(secs);
    };

    tick();
    window.setInterval(tick, 1000);
  }

  function initInteractiveCards() {
    const affinityBtn = document.getElementById("spark-affinity-btn");
    const affinityCount = document.getElementById("affinity-count");
    if (affinityBtn && affinityCount) {
      let count = 999;
      affinityBtn.addEventListener("click", (e) => {
        count += 1;
        affinityCount.textContent = String(count);
        const rect = affinityBtn.getBoundingClientRect();
        spawnDomParticleBurst(
          e.clientX || rect.left + rect.width / 2,
          e.clientY || rect.top + rect.height / 2,
          "heart"
        );
      });
    }

    if (prefersReducedMotion) return;

    document.querySelectorAll("[data-spotlight]").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const rect = el.getBoundingClientRect();
        el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
        el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
      });
    });

    document.querySelectorAll("[data-tilt]").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(950px) rotateX(${(-y * 6.5).toFixed(2)}deg) rotateY(${(x * 6.5).toFixed(2)}deg)`;
      });
      card.addEventListener("pointerleave", () => {
        card.style.transform = "perspective(950px) rotateX(0deg) rotateY(0deg)";
      });
    });
  }

  function initScrollReveal() {
    const items = document.querySelectorAll(".reveal");
    if (!items.length || prefersReducedMotion) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14 }
    );

    items.forEach((el) => observer.observe(el));
  }

  /* ==========================================================================
     PIKA-SPARK: CATCH THE LOVE
     ========================================================================== */
  function initPikaSparkGame() {
    const canvas = document.getElementById("pika-game-canvas");
    const overlay = document.getElementById("game-overlay");
    const overlayTitle = document.getElementById("overlay-title");
    const overlayText = document.getElementById("overlay-text");
    const startBtn = document.getElementById("start-game-btn");
    const scoreEl = document.getElementById("game-score");
    const comboEl = document.getElementById("game-combo");
    const timerEl = document.getElementById("game-timer");
    const vipBanner = document.getElementById("vip-reward-banner");

    if (!canvas || !startBtn) return;
    const ctx = canvas.getContext("2d");

    let width = 0;
    let height = 0;
    let dpr = 1;
    let animId = 0;
    let timerInterval = 0;

    const state = {
      running: false,
      score: 0,
      combo: 1,
      timeLeft: 30,
      magnetTimer: 0,
      hopOffset: 0,
      cheekFlash: 0,
      shake: 0,
      playerX: 0,
      targetX: 0,
      vx: 0,
      items: [],
      particles: [],
      bolts: [],
      shockwaves: [],
      floatingTexts: [],
      spawnCooldown: 0
    };

    const resizeCanvas = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!state.running) {
        state.playerX = width / 2;
        state.targetX = width / 2;
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const setPointerTarget = (clientX) => {
      const rect = canvas.getBoundingClientRect();
      const relX = clientX - rect.left;
      state.targetX = Math.max(46, Math.min(width - 46, relX));
    };

    canvas.addEventListener("pointermove", (e) => {
      if (state.running) setPointerTarget(e.clientX);
    });

    canvas.addEventListener("pointerdown", (e) => {
      if (state.running) setPointerTarget(e.clientX);
    });

    window.addEventListener("keydown", (e) => {
      if (!state.running) return;
      if (e.key === "ArrowLeft" || e.key === "a") {
        state.targetX = Math.max(46, state.targetX - 48);
      } else if (e.key === "ArrowRight" || e.key === "d") {
        state.targetX = Math.min(width - 46, state.targetX + 48);
      }
    });

    const spawnParticles = (x, y, color, count = 16) => {
      for (let i = 0; i < count; i += 1) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const speed = 2.2 + Math.random() * 4.8;
        state.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          color,
          size: 3 + Math.random() * 3.8
        });
      }
    };

    const spawnLightningBolt = (x1, y1, x2, y2) => {
      const segments = [];
      const steps = 6;
      for (let i = 0; i <= steps; i += 1) {
        const t = i / steps;
        const jitter = i === 0 || i === steps ? 0 : (Math.random() - 0.5) * 28;
        segments.push({
          x: x1 + (x2 - x1) * t + jitter,
          y: y1 + (y2 - y1) * t + jitter * 0.45
        });
      }
      state.bolts.push({ segments, life: 1 });
    };

    const spawnItem = () => {
      const roll = Math.random();
      let type = "heart";
      if (roll > 0.84) type = "thunder";
      else if (roll > 0.67) type = "static";

      state.items.push({
        type,
        x: 38 + Math.random() * (width - 76),
        y: -28,
        vy: 2.7 + Math.random() * 2 + (30 - state.timeLeft) * 0.05,
        wobble: Math.random() * Math.PI * 2,
        radius: type === "thunder" ? 21 : 18
      });
    };

    const updateHud = () => {
      scoreEl.textContent = String(state.score);
      comboEl.textContent = `x${state.combo}`;
      timerEl.textContent = `${state.timeLeft}s`;
    };

    const drawPikachuCharacter = (x, y) => {
      const now = Date.now();
      const tilt = Math.max(-0.22, Math.min(0.22, state.vx * 0.018));
      const tailSwing = Math.sin(now * 0.012) * 0.22 - tilt * 1.4;
      const earWiggle = Math.sin(now * 0.015) * 0.07;

      ctx.save();
      ctx.translate(x, y - state.hopOffset);

      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.beginPath();
      ctx.ellipse(0, 38 + state.hopOffset, 30 - state.hopOffset * 0.4, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      if (state.magnetTimer > 0) {
        ctx.save();
        ctx.rotate(now * 0.005);
        ctx.beginPath();
        ctx.arc(0, 0, 62 + Math.sin(now * 0.02) * 4, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(250, 204, 21, 0.6)";
        ctx.lineWidth = 3;
        ctx.setLineDash([12, 8]);
        ctx.stroke();
        ctx.restore();
      }

      ctx.rotate(tilt);

      ctx.save();
      ctx.translate(16, 14);
      ctx.rotate(tailSwing);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(14, -12);
      ctx.lineTo(8, -20);
      ctx.lineTo(28, -36);
      ctx.lineTo(20, -46);
      ctx.lineTo(38, -60);
      ctx.lineTo(14, -52);
      ctx.lineTo(18, -42);
      ctx.lineTo(0, -26);
      ctx.lineTo(6, -16);
      ctx.lineTo(-6, -4);
      ctx.closePath();
      ctx.fillStyle = "#FACC15";
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#1C1917";
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(-16, -20);
      ctx.rotate(-0.42 + earWiggle - tilt * 0.8);
      ctx.beginPath();
      ctx.moveTo(0, 4);
      ctx.quadraticCurveTo(-8, -22, 0, -40);
      ctx.quadraticCurveTo(8, -22, 4, 4);
      ctx.closePath();
      ctx.fillStyle = "#FACC15";
      ctx.fill();
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = "#1C1917";
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-4.5, -24);
      ctx.quadraticCurveTo(-5, -33, 0, -40);
      ctx.quadraticCurveTo(5, -33, 4.5, -24);
      ctx.closePath();
      ctx.fillStyle = "#1C1917";
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(16, -20);
      ctx.rotate(0.42 - earWiggle - tilt * 0.8);
      ctx.beginPath();
      ctx.moveTo(-4, 4);
      ctx.quadraticCurveTo(-8, -22, 0, -40);
      ctx.quadraticCurveTo(8, -22, 0, 4);
      ctx.closePath();
      ctx.fillStyle = "#FACC15";
      ctx.fill();
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = "#1C1917";
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-4.5, -24);
      ctx.quadraticCurveTo(-5, -33, 0, -40);
      ctx.quadraticCurveTo(5, -33, 4.5, -24);
      ctx.closePath();
      ctx.fillStyle = "#1C1917";
      ctx.fill();
      ctx.restore();

      const bodyGrad = ctx.createRadialGradient(-4, 10, 4, 0, 14, 28);
      bodyGrad.addColorStop(0, "#FEF08A");
      bodyGrad.addColorStop(0.65, "#FACC15");
      bodyGrad.addColorStop(1, "#EAB308");

      ctx.beginPath();
      ctx.ellipse(0, 16, 22, 20, 0, 0, Math.PI * 2);
      ctx.fillStyle = bodyGrad;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#1C1917";
      ctx.stroke();

      ctx.fillStyle = "#FACC15";
      ctx.beginPath();
      ctx.ellipse(-11, 34, 7, 4, -0.2, 0, Math.PI * 2);
      ctx.ellipse(11, 34, 7, 4, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      const headGrad = ctx.createRadialGradient(-6, -14, 4, 0, -8, 28);
      headGrad.addColorStop(0, "#FEF9C3");
      headGrad.addColorStop(0.55, "#FACC15");
      headGrad.addColorStop(1, "#EAB308");

      ctx.beginPath();
      ctx.ellipse(0, -8, 25, 21, 0, 0, Math.PI * 2);
      ctx.fillStyle = headGrad;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#1C1917";
      ctx.stroke();

      ctx.fillStyle = "#1C1917";
      ctx.beginPath();
      ctx.arc(-10, -11, 4.4, 0, Math.PI * 2);
      ctx.arc(10, -11, 4.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(-8.6, -12.4, 1.7, 0, Math.PI * 2);
      ctx.arc(11.4, -12.4, 1.7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#1C1917";
      ctx.beginPath();
      ctx.ellipse(0, -6, 1.8, 1.2, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#1C1917";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-5, -2);
      ctx.quadraticCurveTo(-2.5, 1.5, 0, -2);
      ctx.quadraticCurveTo(2.5, 1.5, 5, -2);
      ctx.stroke();

      ctx.save();
      if (state.cheekFlash > 0 || state.combo >= 3) {
        ctx.shadowColor = "#FACC15";
        ctx.shadowBlur = 14;
      }
      ctx.fillStyle = state.cheekFlash > 0 ? "#FB7185" : "#E11D48";
      ctx.beginPath();
      ctx.arc(-17, -3, 5.6, 0, Math.PI * 2);
      ctx.arc(17, -3, 5.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = "#FACC15";
      ctx.strokeStyle = "#1C1917";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(-18, 9, 5.5, 4.2, -0.5, 0, Math.PI * 2);
      ctx.ellipse(18, 9, 5.5, 4.2, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    };

    const drawItem = (item) => {
      ctx.save();
      ctx.translate(item.x, item.y);

      if (item.type === "heart") {
        ctx.fillStyle = "#E11D48";
        ctx.shadowColor = "rgba(225, 29, 72, 0.8)";
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(0, 11);
        ctx.bezierCurveTo(-17, -2, -15, -16, 0, -6);
        ctx.bezierCurveTo(15, -16, 17, -2, 0, 11);
        ctx.fill();
        ctx.strokeStyle = "#FFE4E6";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (item.type === "thunder") {
        ctx.fillStyle = "#FACC15";
        ctx.shadowColor = "rgba(250, 204, 21, 0.95)";
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.moveTo(4, -17);
        ctx.lineTo(-11, 2);
        ctx.lineTo(0, 2);
        ctx.lineTo(-4, 17);
        ctx.lineTo(11, -2);
        ctx.lineTo(0, -2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#FEFCE8";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        ctx.fillStyle = "#7E22CE";
        ctx.shadowColor = "rgba(168, 85, 247, 0.8)";
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#F3E8FF";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.restore();
    };

    const finishGame = () => {
      state.running = false;
      window.clearInterval(timerInterval);
      cancelAnimationFrame(animId);

      const unlocked = state.score >= 1500;
      if (unlocked && vipBanner) {
        vipBanner.hidden = false;
      }

      overlayTitle.textContent = unlocked
        ? `Hebat! Pikachu Meraih ${state.score} Poin!`
        : `Waktu Habis! Skor ${state.score} Poin`;
      overlayText.innerHTML = unlocked
        ? "Kode suvenir VIP <strong>PIKA-VIP26</strong> berhasil dibuka. Main lagi untuk memecahkan rekor tertinggi!"
        : "Kumpulkan minimal <strong>1.500 poin</strong> untuk membuka kode suvenir VIP pernikahan kami. Coba lagi!";
      startBtn.textContent = "Main Lagi";
      overlay.classList.remove("is-hidden");
    };

    const loop = () => {
      if (!state.running) return;

      ctx.save();
      if (state.shake > 0.2) {
        ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
        state.shake *= 0.84;
      }

      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, "#1C1917");
      bgGrad.addColorStop(1, state.combo >= 3 ? "#2E2110" : "#12100E");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "rgba(250, 204, 21, 0.12)";
      ctx.fillRect(0, height - 24, width, 24);

      const prevX = state.playerX;
      state.playerX += (state.targetX - state.playerX) * 0.22;
      state.vx = state.playerX - prevX;
      const playerY = height - 56;

      if (state.magnetTimer > 0) state.magnetTimer -= 1;
      if (state.hopOffset > 0) state.hopOffset = Math.max(0, state.hopOffset - 1.4);
      if (state.cheekFlash > 0) state.cheekFlash -= 1;

      state.spawnCooldown -= 1;
      if (state.spawnCooldown <= 0) {
        spawnItem();
        state.spawnCooldown = Math.max(18, 33 - (30 - state.timeLeft) * 0.45);
      }

      for (let i = state.items.length - 1; i >= 0; i -= 1) {
        const item = state.items[i];
        item.wobble += 0.06;
        item.y += item.vy;
        item.x += Math.sin(item.wobble) * 0.9;

        if (state.magnetTimer > 0 && item.type !== "static") {
          item.x += (state.playerX - item.x) * 0.1;
          item.y += (playerY - item.y) * 0.06;
        }

        const dist = Math.hypot(item.x - state.playerX, item.y - playerY);
        if (dist < item.radius + 32) {
          if (item.type === "heart") {
            const pts = 100 * state.combo;
            state.score += pts;
            state.combo = Math.min(5, state.combo + 1);
            state.hopOffset = 14;
            state.cheekFlash = 14;
            spawnParticles(item.x, item.y, "#E11D48", 16);
            spawnLightningBolt(state.playerX, playerY - 8, item.x, item.y);
            state.shockwaves.push({ x: item.x, y: item.y, r: 8, life: 1, color: "#FACC15" });
            state.floatingTexts.push({ x: item.x, y: item.y, text: `+${pts}`, life: 1, color: "#FACC15" });
          } else if (item.type === "thunder") {
            const pts = 250 * state.combo;
            state.score += pts;
            state.combo = Math.min(5, state.combo + 1);
            state.magnetTimer = 250;
            state.hopOffset = 18;
            state.cheekFlash = 24;
            state.shake = 8;
            spawnParticles(item.x, item.y, "#FACC15", 24);
            spawnLightningBolt(state.playerX, playerY - 8, item.x, item.y);
            state.shockwaves.push({ x: item.x, y: item.y, r: 10, life: 1, color: "#FEF9C3" });
            state.floatingTexts.push({ x: item.x, y: item.y, text: `MAGNET +${pts}`, life: 1, color: "#FEF9C3" });
          } else {
            state.combo = 1;
            state.shake = 12;
            spawnParticles(item.x, item.y, "#A855F7", 18);
            state.floatingTexts.push({ x: item.x, y: item.y, text: "STATIC!", life: 1, color: "#E9D5FF" });
          }
          updateHud();
          state.items.splice(i, 1);
          continue;
        }

        if (item.y > height + 30) {
          state.items.splice(i, 1);
          continue;
        }

        drawItem(item);
      }

      for (let i = state.shockwaves.length - 1; i >= 0; i -= 1) {
        const sw = state.shockwaves[i];
        sw.r += 3.5;
        sw.life -= 0.06;
        if (sw.life <= 0) {
          state.shockwaves.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
        ctx.strokeStyle = sw.color;
        ctx.globalAlpha = sw.life * 0.7;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      for (let i = state.bolts.length - 1; i >= 0; i -= 1) {
        const b = state.bolts[i];
        b.life -= 0.085;
        if (b.life <= 0) {
          state.bolts.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        b.segments.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.strokeStyle = `rgba(250, 204, 21, ${b.life})`;
        ctx.lineWidth = 3.2;
        ctx.stroke();
      }

      for (let i = state.particles.length - 1; i >= 0; i -= 1) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.life -= 0.034;
        if (p.life <= 0) {
          state.particles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      ctx.font = '700 15px "JetBrains Mono", monospace';
      ctx.textAlign = "center";
      for (let i = state.floatingTexts.length - 1; i >= 0; i -= 1) {
        const ft = state.floatingTexts[i];
        ft.y -= 1.4;
        ft.life -= 0.025;
        if (ft.life <= 0) {
          state.floatingTexts.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = ft.life;
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
      }
      ctx.globalAlpha = 1;

      drawPikachuCharacter(state.playerX, playerY);
      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    startBtn.addEventListener("click", () => {
      resizeCanvas();
      state.running = true;
      state.score = 0;
      state.combo = 1;
      state.timeLeft = 30;
      state.magnetTimer = 0;
      state.hopOffset = 0;
      state.cheekFlash = 0;
      state.items = [];
      state.particles = [];
      state.bolts = [];
      state.shockwaves = [];
      state.floatingTexts = [];
      state.playerX = width / 2;
      state.targetX = width / 2;

      updateHud();
      overlay.classList.add("is-hidden");

      window.clearInterval(timerInterval);
      timerInterval = window.setInterval(() => {
        state.timeLeft -= 1;
        updateHud();
        if (state.timeLeft <= 0) finishGame();
      }, 1000);

      cancelAnimationFrame(animId);
      animId = requestAnimationFrame(loop);
    });
  }

  function loadSavedWishes() {
    try {
      const raw = window.localStorage.getItem(WISHES_STORAGE_KEY);
      if (!raw) return [...DEFAULT_WISHES];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length ? parsed : [...DEFAULT_WISHES];
    } catch {
      return [...DEFAULT_WISHES];
    }
  }

  function saveWishesList(wishes) {
    try {
      window.localStorage.setItem(WISHES_STORAGE_KEY, JSON.stringify(wishes.slice(0, 100)));
    } catch {
      // Abaikan jika penyimpanan dibatasi
    }
  }

  function renderWishesWall(wishes) {
    const wishesList = document.getElementById("wishes-list");
    const countBadge = document.getElementById("wishes-count");
    if (!wishesList) return;

    if (countBadge) {
      countBadge.textContent = `${wishes.length} Ucapan`;
    }

    wishesList.innerHTML = "";
    wishes.forEach((item) => {
      const card = document.createElement("article");
      card.className = "wish-item";

      const top = document.createElement("div");
      top.className = "wish-top";

      const author = document.createElement("strong");
      author.textContent = `${item.name} (${item.guests})`;

      const badge = document.createElement("span");
      badge.className = "wish-badge";
      badge.textContent = item.status;

      const body = document.createElement("p");
      body.textContent = item.message;

      const timeEl = document.createElement("span");
      timeEl.className = "wish-time";
      timeEl.textContent = item.timestamp || "Tersimpan";

      top.append(author, badge);
      card.append(top, body, timeEl);
      wishesList.appendChild(card);
    });
  }

  function initGiftAndRsvp() {
    const feedback = document.getElementById("copy-feedback");
    document.querySelectorAll("[data-copy-target]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const targetId = btn.getAttribute("data-copy-target");
        const el = targetId ? document.getElementById(targetId) : null;
        if (!el) return;

        try {
          await navigator.clipboard.writeText(el.textContent.trim());
          if (feedback) feedback.textContent = `Nomor rekening ${el.textContent.trim()} berhasil disalin.`;
        } catch {
          if (feedback) feedback.textContent = `Silakan salin manual: ${el.textContent.trim()}`;
        }
      });
    });

    let wishes = loadSavedWishes();
    renderWishesWall(wishes);

    const form = document.getElementById("rsvp-form");
    const errorEl = document.getElementById("form-error");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("rsvp-name").value.trim();
      const status = document.getElementById("rsvp-status").value;
      const guests = document.getElementById("rsvp-guests").value;
      const message = document.getElementById("rsvp-message").value.trim();

      if (!name || !message) {
        if (errorEl) errorEl.textContent = "Mohon isi nama lengkap dan ucapan doa terlebih dahulu.";
        return;
      }
      if (errorEl) errorEl.textContent = "";

      const nowLabel = new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date());

      wishes.unshift({
        name,
        status,
        guests,
        message,
        timestamp: nowLabel
      });

      saveWishesList(wishes);
      renderWishesWall(wishes);

      const waText = [
        `Halo Dimas & Nabila, saya *${name}* ingin mengonfirmasi kehadiran pernikahan:`,
        `• Status: *${status}* (${guests})`,
        `• Doa & Ucapan: "${message}"`
      ].join("\n");

      const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waText)}`;
      window.open(waUrl, "_blank", "noopener,noreferrer");
      form.reset();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initBacksoundSystem();
    initHamburgerMenu();
    initGuestPersonalization();
    initCharacterInteractions();
    initOpeningGate();
    initGateSparks();
    initHeroAmbientCanvas();
    initCountdown();
    initInteractiveCards();
    initScrollReveal();
    initPikaSparkGame();
    initGiftAndRsvp();
  });
})();
