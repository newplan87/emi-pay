(function () {
  const cfg = window.EMI_PAY || {};
  const vpa = cfg.vpa || "paytm.s4710fj@pty";
  const pn = cfg.merchantName || "EMI Pay";

  const params = new URLSearchParams(window.location.search);
  const amount = Number(String(params.get("am") || params.get("amount") || "").replace(/,/g, ""));
  const ref = (params.get("ref") || params.get("note") || "").trim();
  const customer = (params.get("name") || "").trim();

  const payCard = document.getElementById("payCard");
  const errCard = document.getElementById("errCard");
  if (!amount || amount <= 0) {
    payCard.classList.add("is-off");
    errCard.classList.remove("is-off");
    return;
  }

  const rawAmount = amount;
  const amountLabel =
    "₹" + amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function twelveDigitRef() {
    if (/^\d{12}$/.test(ref)) return ref;
    const key = "ep12:" + String(amount) + ":" + (ref || "") + ":" + customer;
    try {
      const saved = sessionStorage.getItem(key);
      if (saved && /^\d{12}$/.test(saved)) return saved;
    } catch (e) {}
    const n = String(Math.floor(1e11 + Math.random() * 9e11));
    try {
      sessionStorage.setItem(key, n);
    } catch (e) {}
    return n;
  }
  const displayRef = twelveDigitRef();

  document.getElementById("payeeName").textContent = pn;
  document.getElementById("amountDisplay").textContent = amountLabel;
  document.getElementById("vpaText").textContent = vpa;
  const vpaQr = document.getElementById("vpaTextQr");
  if (vpaQr) vpaQr.textContent = vpa;
  function setRefEls(id) {
    const el = document.getElementById(id);
    if (el) el.textContent = displayRef;
  }
  setRefEls("refText");
  setRefEls("refTextQr");

  const refLine = document.getElementById("refLine");
  const bits = [];
  if (customer) bits.push(customer);
  if (ref) bits.push("Ref · " + ref);
  if (bits.length) {
    refLine.hidden = false;
    refLine.textContent = bits.join(" · ");
  }

  const amStr = rawAmount.toFixed(2);
  const pnSafe = encodeURIComponent(
    (pn.replace(/[^a-zA-Z0-9 ]/g, "").trim().slice(0, 25) || "EMI Pay")
  );
  const trSafe = String(displayRef).replace(/[^a-zA-Z0-9]/g, "") || displayRef;
  // Same query shape as BallyPay checkout (pa raw, then pn, mc, am, cu, tr, tn)
  const Se =
    "pa=" + vpa +
    "&pn=" + pnSafe +
    "&mc=7372" +
    "&am=" + amStr +
    "&cu=INR" +
    "&tr=" + trSafe +
    "&tn=OrderPayment";

  const upiPay = "upi://pay?" + Se;
  const phonepePay = "phonepe://pay?" + Se;
  const paytmPay = "paytmmp://pay?" + Se;

  const ua = navigator.userAgent || "";
  const isAndroid = /android/i.test(ua);
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isMobile = isAndroid || isIOS || /mobile/i.test(ua);
  const inApp = /FBAN|FBAV|Instagram|Line\/|WhatsApp|; wv|WebView/i.test(ua);

  const hint = document.getElementById("appHint");
  if (hint) {
    if (!isMobile) {
      hint.hidden = false;
      hint.textContent = "Open this page in Chrome on your phone to use PhonePe or Paytm. On a computer, scan the QR code.";
    } else if (inApp) {
      hint.hidden = false;
      hint.textContent = "UPI apps cannot open inside this browser. Tap Continue in Chrome, then pay.";
    }
  }

  const chromeOpen = document.getElementById("chromeOpen");
  if (chromeOpen && inApp && isAndroid) {
    chromeOpen.hidden = false;
    chromeOpen.style.display = "flex";
    const here = location.href.replace(/^https?:\/\//, "");
    chromeOpen.href =
      "intent://" + here + "#Intent;scheme=https;package=com.android.chrome;end";
  }

  const btnPhonepe = document.getElementById("btnPhonepe");
  const btnPaytm = document.getElementById("btnPaytm");
  const btnOpenUpi = document.getElementById("btnOpenUpi");

  btnPhonepe.href = phonepePay;
  btnPaytm.href = paytmPay;
  if (btnOpenUpi) btnOpenUpi.href = upiPay;

  function goPay(url) {
    window.location.href = url;
  }
  btnPhonepe.addEventListener("click", function () {
    goPay(phonepePay);
  });
  btnPaytm.addEventListener("click", function () {
    goPay(paytmPay);
  });
  if (btnOpenUpi) {
    btnOpenUpi.addEventListener("click", function () {
      goPay(upiPay);
    });
  }

  const panelUpi = document.getElementById("panelUpi");
  const panelQr = document.getElementById("panelQr");
  const qrNote = document.getElementById("qrNote");

  function showQr(note) {
    document.querySelectorAll(".tab").forEach(function (t) {
      t.classList.toggle("active", t.getAttribute("data-tab") === "qr");
    });
    panelUpi.classList.add("is-off");
    panelQr.classList.remove("is-off");
    if (qrNote) qrNote.textContent = note || "Scan with any UPI app";
    requestAnimationFrame(function () {
      requestAnimationFrame(drawQr);
    });
  }

  function drawQr() {
    const qrEl = document.getElementById("qr");
    if (!qrEl) return;
    qrEl.innerHTML = "";
    if (typeof QRCode === "function") {
      new QRCode(qrEl, {
        text: upiPay,
        width: 220,
        height: 220,
        colorDark: "#002E6E",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M,
      });
    }
    if (!qrEl.querySelector("canvas, img, table")) {
      const img = document.createElement("img");
      img.width = 220;
      img.height = 220;
      img.alt = "UPI QR";
      img.src =
        "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" +
        encodeURIComponent(upiPay);
      qrEl.appendChild(img);
    }
  }

  function copyText(text, btn) {
    const done = function () {
      if (!btn) return;
      const prev = btn.textContent;
      btn.textContent = "Copied";
      setTimeout(function () { btn.textContent = prev; }, 1200);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () {
        window.prompt("Copy", text);
      });
      return;
    }
    window.prompt("Copy", text);
  }

  const copyA = document.getElementById("copyVpa");
  const copyB = document.getElementById("copyVpaQr");
  const copyR = document.getElementById("copyRef");
  const copyRq = document.getElementById("copyRefQr");
  if (copyA) copyA.addEventListener("click", function () { copyText(vpa, copyA); });
  if (copyB) copyB.addEventListener("click", function () { copyText(vpa, copyB); });
  if (copyR) copyR.addEventListener("click", function () { copyText(displayRef, copyR); });
  if (copyRq) copyRq.addEventListener("click", function () { copyText(displayRef, copyRq); });

  document.querySelectorAll(".tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      const which = tab.getAttribute("data-tab");
      if (which === "qr") showQr("Scan with any UPI app");
      else {
        document.querySelectorAll(".tab").forEach(function (t) { t.classList.remove("active"); });
        tab.classList.add("active");
        panelUpi.classList.remove("is-off");
        panelQr.classList.add("is-off");
      }
    });
  });
})();
