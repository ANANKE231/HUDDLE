(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ───────────────────── elements ───────────────────── */
  var scrollLine = document.getElementById("scrollLine");
  var lights = document.getElementById("lights");
  var ribbonA = document.getElementById("ribbonA");
  var ribbonB = document.getElementById("ribbonB");
  var spot = document.getElementById("lightSpot");
  var timeline = document.getElementById("timeline");
  var tlItems = timeline ? Array.prototype.slice.call(timeline.querySelectorAll(".tl-item")) : [];

  /* ───────────────────── scroll-driven light ─────────────────────
     The banner's light ribbons live on as a fixed layer behind the page.
     As the visitor scrolls, the white-hot ribbons drift and tilt, the
     right-hand arc swells towards the middle of the page, and a soft
     highlight travels down the edge. Fast scrolling briefly flares them. */
  var target = 0;      // real scroll progress 0..1
  var cur = 0;         // eased progress used for drawing
  var flare = 0;       // 0..1, decays
  var lastY = window.scrollY;
  var running = false;

  function readScroll() {
    var y = window.scrollY;
    var docH = document.documentElement.scrollHeight - window.innerHeight;
    target = docH > 0 ? Math.min(Math.max(y / docH, 0), 1) : 0;

    var dy = Math.abs(y - lastY);
    lastY = y;
    flare = Math.min(1, Math.max(flare, dy / 90));

    scrollLine.style.width = (target * 100) + "%";
    updateTimeline();
    start();
  }

  function draw() {
    var p = cur;
    var f = flare;

    // Ribbon A — sweeps up and tilts
    var ax = -p * 170;
    var ay = -p * 560;
    var ar = -p * 7;
    var aOp = Math.min(1, 0.55 + 0.45 * Math.abs(Math.cos(p * Math.PI)) + f * 0.25);
    ribbonA.setAttribute("transform", "translate(" + ax.toFixed(1) + " " + ay.toFixed(1) + ") rotate(" + ar.toFixed(2) + " 720 450)");
    ribbonA.setAttribute("opacity", aOp.toFixed(3));

    // Ribbon B — rises out of the bottom-right and swells mid-page
    var bx = -p * 240 + 60;
    var by = -p * 420;
    var br = p * 5;
    var bOp = Math.min(1, 0.55 + 0.4 * Math.sin(p * Math.PI) + f * 0.25);
    ribbonB.setAttribute("transform", "translate(" + bx.toFixed(1) + " " + by.toFixed(1) + ") rotate(" + br.toFixed(2) + " 720 450)");
    ribbonB.setAttribute("opacity", bOp.toFixed(3));

    // travelling highlight
    var travel = p * (window.innerHeight * 0.54);
    spot.style.transform = "translate3d(0," + travel.toFixed(1) + "px,0)";

    lights.style.setProperty("--p", p.toFixed(4));
    lights.style.setProperty("--flare", f.toFixed(3));
  }

  function loop() {
    cur += (target - cur) * 0.085;
    flare *= 0.92;
    if (Math.abs(target - cur) < 0.0004) cur = target;
    if (flare < 0.004) flare = 0;
    draw();
    if (cur !== target || flare > 0) {
      requestAnimationFrame(loop);
    } else {
      running = false;
    }
  }
  function start() {
    if (reduce) { cur = target; flare = 0; draw(); return; }
    if (!running) {
      running = true;
      requestAnimationFrame(loop);
    }
  }

  /* ───────────────────── timeline: a thread of light fills as you scroll ───────────────────── */
  function updateTimeline() {
    if (!timeline) return;
    var vh = window.innerHeight || 1;
    var line = vh * 0.6; // the "reading line"
    var rect = timeline.getBoundingClientRect();
    var fill = Math.min(Math.max(line - rect.top - 26, 0), rect.height - 52);
    timeline.style.setProperty("--fill", fill.toFixed(1) + "px");

    tlItems.forEach(function (item) {
      var m = item.querySelector(".tl-marker").getBoundingClientRect();
      item.classList.toggle("lit", m.top + m.height / 2 < line);
    });
  }

  window.addEventListener("scroll", readScroll, { passive: true });
  window.addEventListener("resize", readScroll);
  readScroll();
  // first paint: settle instantly at the current position
  cur = target;
  draw();

  /* ───────────────────── mobile menu ───────────────────── */
  var burger = document.getElementById("burger");
  var mobileMenu = document.getElementById("mobileMenu");
  function closeMenu() {
    mobileMenu.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
  }
  burger.addEventListener("click", function () {
    var isOpen = mobileMenu.classList.toggle("open");
    burger.setAttribute("aria-expanded", String(isOpen));
  });
  mobileMenu.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", closeMenu);
  });

  /* ───────────────────── join by company code → password reveal ─────────────────────
     Front-end only: no backend exists yet. This simulates the flow described in the
     brief — searching a code reveals a password field, since the director supplies
     the password to employees separately. Wire this up to a real lookup later. */
  var codeInput = document.getElementById("companyCode");
  var findBtn = document.getElementById("findCompany");
  var passStep = document.getElementById("joinStepPass");
  var foundName = document.getElementById("foundName");
  var joinBack = document.getElementById("joinBack");
  var passInput = document.getElementById("companyPass");
  var submitJoin = document.getElementById("submitJoin");

  function openPasswordStep() {
    var code = (codeInput.value || "").trim();
    if (!code) {
      codeInput.focus();
      return;
    }
    foundName.textContent = "კომპანია მოიძებნა — " + code.toUpperCase();
    passStep.classList.add("open");
    setTimeout(function () {
      passInput.focus();
    }, 260);
  }
  findBtn.addEventListener("click", openPasswordStep);
  codeInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") openPasswordStep();
  });
  joinBack.addEventListener("click", function () {
    passStep.classList.remove("open");
    passInput.value = "";
  });
  submitJoin.addEventListener("click", function () {
    if (!passInput.value) {
      passInput.focus();
      return;
    }
    // Placeholder: real auth happens once the backend exists.
    submitJoin.textContent = "მოწმდება…";
    setTimeout(function () {
      submitJoin.textContent = "გაწევრიანება";
    }, 900);
  });
})();