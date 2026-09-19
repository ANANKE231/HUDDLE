(function () {
  "use strict";

  /* ══════════════════════════════════════════════════════════════
     BACKEND HOOKS — front-end only for now.
     Replace the bodies of these functions with real API calls and
     the rest of the page keeps working unchanged.
     ══════════════════════════════════════════════════════════════ */
  var demoCode = null;

  var api = {
    // Should email a fresh 6-digit code to `email`.
    sendCode: function (email) {
      demoCode = String(Math.floor(100000 + Math.random() * 900000));
      console.info("[demo] verification code for " + email + ": " + demoCode);
      return delay(700);
    },
    // Should resolve true/false. The real check belongs on the server.
    verifyCode: function (email, code) {
      return delay(500).then(function () { return code === demoCode; });
    },
    // Should create the company and return its unique code.
    registerDirector: function (data) {
      return delay(500).then(function () { return { companyCode: makeCompanyCode(data.company) }; });
    },
    // Should check the company code, then create the employee.
    // Reject with {field:"code", message:"..."} if the code does not exist.
    registerEmployee: function (data) {
      return delay(700).then(function () { return { ok: true }; });
    }
  };

  function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function makeCompanyCode(name) {
    var letters = (name || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
    while (letters.length < 3) letters += "HDL"[letters.length];
    return letters + "-" + Math.floor(1000 + Math.random() * 9000);
  }

  /* ───────────────────── home page link ─────────────────────
     Change this one value if your home page has a different file name
     (e.g. "home.html" or "/"). Every "back to home" link uses it. */
  var HOME_URL = "main.html";
  Array.prototype.forEach.call(document.querySelectorAll("[data-home]"), function (a) {
    a.setAttribute("href", HOME_URL);
  });

  /* ───────────────────── helpers ───────────────────── */
  var $ = function (id) { return document.getElementById(id); };

  var rules = {
    company: function (v) { return v.length >= 2 ? "" : "შეიყვანეთ კომპანიის სახელი"; },
    level:   function (v) { return v ? "" : "აირჩიეთ პოზიციის დონე"; },
    first:   function (v) { return v.length >= 2 ? "" : "შეიყვანეთ სახელი"; },
    last:    function (v) { return v.length >= 2 ? "" : "შეიყვანეთ გვარი"; },
    email:   function (v) {
      if (!v) return "შეიყვანეთ Gmail მისამართი";
      return /^[a-z0-9._%+-]+@gmail\.com$/i.test(v) ? "" : "გამოიყენეთ Gmail მისამართი, მაგ. name@gmail.com";
    },
    phone:   function (v) {
      var digits = v.replace(/\D/g, "");
      if (!v) return "შეიყვანეთ ტელეფონის ნომერი";
      return /^\+?[\d\s\-()]+$/.test(v) && digits.length >= 9 && digits.length <= 15 ? "" : "ნომერი არასწორია — მინიმუმ 9 ციფრი";
    },
    password: function (v) {
      if (!v) return "შექმენით პაროლი";
      return v.length >= 8 ? "" : "პაროლი უნდა შეიცავდეს მინიმუმ 8 სიმბოლოს";
    },
    confirm: function (v, form) {
      if (!v) return "გაიმეორეთ პაროლი";
      return v === form.password.value ? "" : "პაროლები არ ემთხვევა";
    },
    code: function (v) {
      return /^[A-Z0-9]{2,6}-?[A-Z0-9]{3,8}$/i.test(v) ? "" : "შეიყვანეთ კომპანიის კოდი, მაგ. ORB-4471";
    }
  };

  function valueOf(input) {
    return (input.name === "password" || input.name === "confirm") ? input.value : input.value.trim();
  }

  function setError(form, name, msg) {
    var field = form.querySelector('[data-field="' + name + '"]');
    if (!field) return;
    field.classList.toggle("invalid", !!msg);
    field.querySelector(".field-error").textContent = msg || "";
    var input = field.querySelector("input, select");
    if (input) input.setAttribute("aria-invalid", msg ? "true" : "false");
  }

  function validateForm(form) {
    var firstBad = null;
    Array.prototype.forEach.call(form.querySelectorAll("[data-field]"), function (f) {
      var name = f.getAttribute("data-field");
      var input = form.elements[name];
      var msg = rules[name](valueOf(input), form);
      setError(form, name, msg);
      if (msg && !firstBad) firstBad = input;
    });
    if (firstBad) firstBad.focus();
    return !firstBad;
  }

  function liveValidate(form) {
    Array.prototype.forEach.call(form.querySelectorAll("[data-field] input, [data-field] select"), function (input) {
      function check() { setError(form, input.name, rules[input.name](valueOf(input), form)); }
      input.addEventListener("blur", function () { if (input.value) check(); });
      input.addEventListener("input", function () {
        if (input.closest(".field").classList.contains("invalid")) check();
      });
      input.addEventListener("change", function () {
        if (input.tagName === "SELECT") check();
      });
    });
  }

  function showStep(hideEl, showEl) {
    hideEl.hidden = true;
    showEl.hidden = false;
    showEl.classList.remove("enter");
    void showEl.offsetWidth;
    showEl.classList.add("enter");
    var h = showEl.querySelector("h1");
    if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // password show/hide
  Array.prototype.forEach.call(document.querySelectorAll(".toggle-pass"), function (btn) {
    btn.addEventListener("click", function () {
      var input = $(btn.getAttribute("data-target"));
      var show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.textContent = show ? "დამალვა" : "ჩვენება";
      btn.setAttribute("aria-label", show ? "პაროლის დამალვა" : "პაროლის ჩვენება");
    });
  });

  /* ═════════════════════ DIRECTOR ═════════════════════ */
  var directorForm = $("directorForm");
  if (directorForm) {
    var stepForm = $("stepForm"), stepDone = $("stepDone");
    var sendBtn = $("sendCodeBtn"), sendNote = $("sendNote");
    var registerBtn = $("registerBtn");
    var verifyBlock = $("verifyBlock");
    var resendBtn = $("resendBtn"), resendTimer = $("resendTimer");
    var otp = $("otp"), otpInputs = Array.prototype.slice.call(otp.querySelectorAll("input"));
    var otpMsg = $("otpMsg");
    var codeSent = false, sentEmail = "", timerId = null, busy = false;
    var COOLDOWN = 30;

    liveValidate(directorForm);

    /* ── send code → reveals the code field below the fields ── */
    sendBtn.addEventListener("click", function () {
      if (busy || !validateForm(directorForm)) return;
      var email = directorForm.email.value.trim().toLowerCase();

      busy = true;
      sendBtn.disabled = true;
      sendBtn.textContent = "იგზავნება…";
      api.sendCode(email).then(function () {
        codeSent = true;
        sentEmail = email;
        $("sentTo").textContent = email;
        clearOtp();
        verifyBlock.classList.add("open");
        sendBtn.hidden = true;
        sendNote.hidden = true;
        registerBtn.disabled = false;
        otpInputs[0].focus({ preventScroll: true });
        startCooldown();
        setTimeout(function () { registerBtn.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, 520);
      }).catch(function () {
        setError(directorForm, "email", "კოდის გაგზავნა ვერ მოხერხდა. სცადეთ ხელახლა.");
      }).then(function () {
        busy = false;
        sendBtn.disabled = false;
        sendBtn.textContent = "კოდის გაგზავნა";
      });
    });

    // Enter before the code is sent = send the code
    directorForm.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !codeSent && e.target.tagName === "INPUT") {
        e.preventDefault();
        sendBtn.click();
      }
    });

    // changing the email after sending invalidates the code
    directorForm.email.addEventListener("input", function () {
      if (codeSent && directorForm.email.value.trim().toLowerCase() !== sentEmail) resetCode();
    });

    function resetCode() {
      codeSent = false;
      clearInterval(timerId);
      clearOtp();
      verifyBlock.classList.remove("open");
      sendBtn.hidden = false;
      sendNote.hidden = false;
      registerBtn.disabled = true;
      resendTimer.textContent = "";
    }

    /* ── six boxes: type, backspace, arrows, paste ── */
    function clearOtp() {
      otpInputs.forEach(function (i) { i.value = ""; i.classList.remove("filled"); });
      otp.classList.remove("invalid");
      otpMsg.textContent = "";
    }
    function otpValue() { return otpInputs.map(function (i) { return i.value; }).join(""); }

    otpInputs.forEach(function (input, idx) {
      input.addEventListener("input", function () {
        input.value = input.value.replace(/\D/g, "").slice(-1);
        input.classList.toggle("filled", !!input.value);
        otp.classList.remove("invalid");
        otpMsg.textContent = "";
        if (input.value && idx < otpInputs.length - 1) otpInputs[idx + 1].focus();
      });
      input.addEventListener("keydown", function (e) {
        if (e.key === "Backspace" && !input.value && idx > 0) {
          otpInputs[idx - 1].value = "";
          otpInputs[idx - 1].classList.remove("filled");
          otpInputs[idx - 1].focus();
        } else if (e.key === "ArrowLeft" && idx > 0) {
          otpInputs[idx - 1].focus();
        } else if (e.key === "ArrowRight" && idx < otpInputs.length - 1) {
          otpInputs[idx + 1].focus();
        }
      });
      input.addEventListener("focus", function () { input.select(); });
      input.addEventListener("paste", function (e) {
        var text = (e.clipboardData || window.clipboardData).getData("text").replace(/\D/g, "").slice(0, 6);
        if (!text) return;
        e.preventDefault();
        text.split("").forEach(function (ch, i) {
          otpInputs[i].value = ch;
          otpInputs[i].classList.add("filled");
        });
        otpInputs[Math.min(text.length, 5)].focus();
      });
    });

    /* ── resend with cooldown ── */
    function startCooldown() {
      var left = COOLDOWN;
      resendBtn.disabled = true;
      clearInterval(timerId);
      function tick() {
        if (left <= 0) {
          clearInterval(timerId);
          resendBtn.disabled = false;
          resendTimer.textContent = "";
          return;
        }
        resendTimer.textContent = "(" + left + " წმ)";
        left--;
      }
      tick();
      timerId = setInterval(tick, 1000);
    }

    resendBtn.addEventListener("click", function () {
      if (resendBtn.disabled || !codeSent) return;
      resendBtn.disabled = true;
      api.sendCode(sentEmail).then(function () {
        clearOtp();
        otpInputs[0].focus();
        resendTimer.textContent = "";
        var note = document.createElement("span");
        note.className = "sent-note";
        note.textContent = "ახალი კოდი გაიგზავნა";
        resendTimer.appendChild(note);
        setTimeout(startCooldown, 1400);
      }).catch(function () {
        otpMsg.textContent = "კოდის გაგზავნა ვერ მოხერხდა. სცადეთ ხელახლა.";
        resendBtn.disabled = false;
      });
    });

    /* ── register ── */
    directorForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (busy || !codeSent) return;
      if (!validateForm(directorForm)) return;

      var email = directorForm.email.value.trim().toLowerCase();
      if (email !== sentEmail) { resetCode(); return; }

      var code = otpValue();
      if (code.length < 6) {
        otp.classList.add("invalid");
        otpMsg.textContent = "შეიყვანეთ სრული 6-ნიშნა კოდი";
        (otpInputs.filter(function (i) { return !i.value; })[0] || otpInputs[0]).focus();
        return;
      }

      var data = {
        company: directorForm.company.value.trim(),
        level: directorForm.level.value,
        email: email,
        phone: directorForm.phone.value.trim(),
        password: directorForm.password.value
      };

      busy = true;
      registerBtn.disabled = true;
      registerBtn.textContent = "მოწმდება…";
      api.verifyCode(email, code).then(function (ok) {
        if (!ok) {
          otp.classList.add("invalid", "shake");
          otpMsg.textContent = "კოდი არასწორია. შეამოწმეთ და სცადეთ ხელახლა.";
          setTimeout(function () { otp.classList.remove("shake"); }, 450);
          otpInputs[0].focus();
          return;
        }
        return api.registerDirector(data).then(function (res) {
          clearInterval(timerId);
          $("doneCompany").textContent = data.company;
          $("companyCodeOut").textContent = res.companyCode;
          showStep(stepForm, stepDone);
        });
      }).catch(function () {
        otpMsg.textContent = "დაფიქსირდა შეცდომა. სცადეთ ხელახლა.";
      }).then(function () {
        busy = false;
        registerBtn.disabled = !codeSent;
        registerBtn.textContent = "რეგისტრაცია";
      });
    });

    $("copyCode").addEventListener("click", function () {
      var btn = $("copyCode"), text = $("companyCodeOut").textContent;
      var done = function () {
        btn.textContent = "დაკოპირდა";
        setTimeout(function () { btn.textContent = "კოპირება"; }, 1600);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, done);
      else done();
    });
  }

  /* ═════════════════════ EMPLOYEE ═════════════════════ */
  var employeeForm = $("employeeForm");
  if (employeeForm) {
    var eBtn = $("employeeSubmit");
    liveValidate(employeeForm);

    employeeForm.code.addEventListener("input", function () {
      employeeForm.code.value = employeeForm.code.value.toUpperCase();
    });

    employeeForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validateForm(employeeForm)) return;

      var data = {
        first: employeeForm.first.value.trim(),
        last: employeeForm.last.value.trim(),
        phone: employeeForm.phone.value.trim(),
        email: employeeForm.email.value.trim().toLowerCase(),
        password: employeeForm.password.value,
        code: employeeForm.code.value.trim().toUpperCase()
      };

      eBtn.disabled = true;
      eBtn.textContent = "მოწმდება…";
      api.registerEmployee(data).then(function () {
        showStep($("stepForm"), $("stepDone"));
      }).catch(function (err) {
        if (err && err.field) setError(employeeForm, err.field, err.message);
        else setError(employeeForm, "code", "რეგისტრაცია ვერ მოხერხდა. სცადეთ ხელახლა.");
      }).then(function () {
        eBtn.disabled = false;
        eBtn.textContent = "რეგისტრაცია";
      });
    });
  }
})();