(() => {
  "use strict";

  const WEDDING_DATE = new Date("2026-12-19T08:00:00+07:00").getTime();
  const WHATSAPP_NUMBER = "6281234567890";
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  function playSynthFallbackChime() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
    let step = 0;

    const triggerNote = () => {
      if (ctx.state === "suspended") ctx.resume();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(notes[step % notes.length], now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.055, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.58);
      step += 1;
    };

    triggerNote();
    window.setInterval(triggerNote, 900);
  }

  function initOpeningGate() {
    const gate = document.getElementById("opening-gate");
    const openBtn = document.getElementById("open-invitation-btn");
    const bgMusic = document.getElementById("bg-music");
    if (!gate || !openBtn) return;

    document.body.classList.add("gate-locked");

    openBtn.addEventListener("click", () => {
      gate.classList.add("is-opened");
      document.body.classList.remove("gate-locked");

      if (bgMusic) {
        bgMusic.volume = 0.55;
        bgMusic.play().catch(() => {
          playSynthFallbackChime();
        });
      } else {
        playSynthFallbackChime();
      }
    });
  }

  function initGateSparks() {
    if (prefersReducedMotion) return;
    const canvas = document.getElementById("gate-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let width = 0;
    let height = 0;
    const sparks = [];

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 34; i += 1) {
      sparks.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 2 + Math.random() * 4,
        vx: (Math.random() - 0.5) * 0.9,
        vy: -0.4 - Math.random() * 0.9,
        color: i % 5 === 0 ? "#EF233C" : "#18181B"
      });
    }

    const render = () => {
      if (document.getElementById("opening-gate")?.classList.contains("is-opened")) return;
      ctx.clearRect(0, 0, width, height);

      for (const s of sparks) {
        s.x += s.vx;
        s.y += s.vy;
        if (s.y < -10) s.y = height + 10;
        if (s.x < -10) s.x = width + 10;
        if (s.x > width + 10) s.x = -10;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = 0.25;
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
      affinityBtn.addEventListener("click", () => {
        count += 1;
        affinityCount.textContent = String(count);
      });
    }

    if (prefersReducedMotion) return;
    document.querySelectorAll("[data-tilt]").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 7).toFixed(2)}deg)`;
      });
      card.addEventListener("pointerleave", () => {
        card.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
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
     PIKA-SPARK: CATCH THE LOVE (60FPS Modern Canvas Arcade Engine)
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
      shake: 0,
      playerX: 0,
      targetX: 0,
      items: [],
      particles: [],
      bolts: [],
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
      state.targetX = Math.max(36, Math.min(width - 36, relX));
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
        state.targetX = Math.max(36, state.targetX - 42);
      } else if (e.key === "ArrowRight" || e.key === "d") {
        state.targetX = Math.min(width - 36, state.targetX + 42);
      }
    });

    const spawnParticles = (x, y, color, count = 14) => {
      for (let i = 0; i < count; i += 1) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const speed = 2 + Math.random() * 4.5;
        state.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          color,
          size: 3 + Math.random() * 3.5
        });
      }
    };

    const spawnLightningBolt = (x1, y1, x2, y2) => {
      const segments = [];
      const steps = 6;
      for (let i = 0; i <= steps; i += 1) {
        const t = i / steps;
        const jitter = i === 0 || i === steps ? 0 : (Math.random() - 0.5) * 26;
        segments.push({
          x: x1 + (x2 - x1) * t + jitter,
          y: y1 + (y2 - y1) * t + jitter * 0.5
        });
      }
      state.bolts.push({ segments, life: 1 });
    };

    const spawnItem = () => {
      const roll = Math.random();
      let type = "heart";
      if (roll > 0.84) type = "thunder";
      else if (roll > 0.66) type = "static";

      state.items.push({
        type,
        x: 34 + Math.random() * (width - 68),
        y: -26,
        vy: 2.7 + Math.random() * 2.1 + (30 - state.timeLeft) * 0.05,
        wobble: Math.random() * Math.PI * 2,
        radius: type === "thunder" ? 20 : 17
      });
    };

    const updateHud = () => {
      scoreEl.textContent = String(state.score);
      comboEl.textContent = `x${state.combo}`;
      timerEl.textContent = `${state.timeLeft}s`;
    };

    const drawCollector = (x, y) => {
      ctx.save();
      ctx.translate(x, y);

      if (state.magnetTimer > 0) {
        ctx.beginPath();
        ctx.arc(0, 0, 52 + Math.sin(Date.now() * 0.015) * 5, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 214, 10, 0.45)";
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // Telinga khas Pikachu
      ctx.fillStyle = "#FFD60A";
      ctx.beginPath();
      ctx.moveTo(-22, -12);
      ctx.lineTo(-32, -40);
      ctx.lineTo(-10, -20);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(22, -12);
      ctx.lineTo(32, -40);
      ctx.lineTo(10, -20);
      ctx.closePath();
      ctx.fill();

      // Ujung telinga hitam
      ctx.fillStyle = "#18181B";
      ctx.beginPath();
      ctx.moveTo(-27, -27);
      ctx.lineTo(-32, -40);
      ctx.lineTo(-21, -30);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(27, -27);
      ctx.lineTo(32, -40);
      ctx.lineTo(21, -30);
      ctx.closePath();
      ctx.fill();

      // Inti energi kuning
      const grad = ctx.createRadialGradient(0, 0, 6, 0, 0, 32);
      grad.addColorStop(0, "#FFFBEB");
      grad.addColorStop(0.55, "#FFD60A");
      grad.addColorStop(1, "#F59E0B");

      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#FFFFFF";
      ctx.stroke();

      // Pipi merah bercahaya
      ctx.fillStyle = "#EF233C";
      ctx.beginPath();
      ctx.arc(-14, 5, 5.5, 0, Math.PI * 2);
      ctx.arc(14, 5, 5.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const drawItem = (item) => {
      ctx.save();
      ctx.translate(item.x, item.y);

      if (item.type === "heart") {
        ctx.fillStyle = "#EF233C";
        ctx.shadowColor = "rgba(239, 35, 60, 0.75)";
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(0, 10);
        ctx.bezierCurveTo(-16, -2, -14, -15, 0, -6);
        ctx.bezierCurveTo(14, -15, 16, -2, 0, 10);
        ctx.fill();
      } else if (item.type === "thunder") {
        ctx.fillStyle = "#FFD60A";
        ctx.shadowColor = "rgba(255, 214, 10, 0.9)";
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.moveTo(4, -16);
        ctx.lineTo(-10, 2);
        ctx.lineTo(0, 2);
        ctx.lineTo(-4, 16);
        ctx.lineTo(10, -2);
        ctx.lineTo(0, -2);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = "#9333EA";
        ctx.shadowColor = "rgba(147, 51, 234, 0.7)";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#E9D5FF";
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
        ? `Luar Biasa! Skor ${state.score} Poin!`
        : `Waktu Habis! Skor ${state.score} Poin`;
      overlayText.innerHTML = unlocked
        ? "Anda berhasil membuka kode suvenir VIP <strong>PIKA-VIP26</strong>. Main lagi untuk memecahkan rekor tertinggi!"
        : "Kumpulkan minimal <strong>1.500 poin</strong> untuk membuka kode suvenir VIP pernikahan kami. Coba lagi!";
      startBtn.textContent = "Main Lagi";
      overlay.classList.remove("is-hidden");
    };

    const loop = () => {
      if (!state.running) return;

      ctx.save();
      if (state.shake > 0.2) {
        ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
        state.shake *= 0.85;
      }

      // Latar arena gelap dengan grid halus
      ctx.fillStyle = "#09090B";
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = "rgba(255, 214, 10, 0.08)";
      ctx.lineWidth = 1;
      for (let gx = 0; gx < width; gx += 40) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
        ctx.stroke();
      }

      // Interpolasi posisi pemain (spring smoothing)
      state.playerX += (state.targetX - state.playerX) * 0.22;
      const playerY = height - 52;

      if (state.magnetTimer > 0) state.magnetTimer -= 1;

      state.spawnCooldown -= 1;
      if (state.spawnCooldown <= 0) {
        spawnItem();
        state.spawnCooldown = Math.max(18, 34 - (30 - state.timeLeft) * 0.45);
      }

      // Update & gambar item jatuh
      for (let i = state.items.length - 1; i >= 0; i -= 1) {
        const item = state.items[i];
        item.wobble += 0.06;
        item.y += item.vy;
        item.x += Math.sin(item.wobble) * 0.9;

        if (state.magnetTimer > 0 && item.type !== "static") {
          item.x += (state.playerX - item.x) * 0.09;
          item.y += (playerY - item.y) * 0.06;
        }

        const dx = item.x - state.playerX;
        const dy = item.y - playerY;
        const dist = Math.hypot(dx, dy);

        if (dist < item.radius + 28) {
          if (item.type === "heart") {
            const pts = 100 * state.combo;
            state.score += pts;
            state.combo = Math.min(5, state.combo + 1);
            spawnParticles(item.x, item.y, "#EF233C", 14);
            spawnLightningBolt(state.playerX, playerY, item.x, item.y);
            state.floatingTexts.push({ x: item.x, y: item.y, text: `+${pts}`, life: 1, color: "#FFD60A" });
          } else if (item.type === "thunder") {
            const pts = 250 * state.combo;
            state.score += pts;
            state.combo = Math.min(5, state.combo + 1);
            state.magnetTimer = 240;
            state.shake = 8;
            spawnParticles(item.x, item.y, "#FFD60A", 22);
            spawnLightningBolt(state.playerX, playerY, item.x, item.y);
            state.floatingTexts.push({ x: item.x, y: item.y, text: `MAGNET +${pts}`, life: 1, color: "#FFFBEB" });
          } else {
            state.combo = 1;
            state.shake = 12;
            spawnParticles(item.x, item.y, "#A855F7", 16);
            state.floatingTexts.push({ x: item.x, y: item.y, text: "STATIC!", life: 1, color: "#D8B4FE" });
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

      // Sambaran petir prosedural
      for (let i = state.bolts.length - 1; i >= 0; i -= 1) {
        const b = state.bolts[i];
        b.life -= 0.09;
        if (b.life <= 0) {
          state.bolts.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        b.segments.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.strokeStyle = `rgba(255, 214, 10, ${b.life})`;
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Partikel ledakan
      for (let i = state.particles.length - 1; i >= 0; i -= 1) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.life -= 0.035;
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

      // Floating score text
      ctx.font = '700 15px "JetBrains Mono", monospace';
      ctx.textAlign = "center";
      for (let i = state.floatingTexts.length - 1; i >= 0; i -= 1) {
        const ft = state.floatingTexts[i];
        ft.y -= 1.3;
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

      drawCollector(state.playerX, playerY);
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
      state.items = [];
      state.particles = [];
      state.bolts = [];
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

    const form = document.getElementById("rsvp-form");
    const errorEl = document.getElementById("form-error");
    const wishesList = document.getElementById("wishes-list");
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

      if (wishesList) {
        const card = document.createElement("article");
        card.className = "wish-item";

        const top = document.createElement("div");
        top.className = "wish-top";

        const author = document.createElement("strong");
        author.textContent = `${name} (${guests})`;

        const badge = document.createElement("span");
        badge.className = "wish-badge";
        badge.textContent = status;

        const body = document.createElement("p");
        body.textContent = message;

        top.append(author, badge);
        card.append(top, body);
        wishesList.prepend(card);
      }

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
    initGuestPersonalization();
    initOpeningGate();
    initGateSparks();
    initCountdown();
    initInteractiveCards();
    initScrollReveal();
    initPikaSparkGame();
    initGiftAndRsvp();
  });
})();
