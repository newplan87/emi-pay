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
  const phonePeAmount = Math.round(rawAmount * 100);
  const amountLabel =
    "₹" + amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const displayRef = ref || ("EP" + Date.now().toString(36).toUpperCase());

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

  const upiID = vpa;
  const upiID2 = vpa;
  const bankName = pn;

  function b64(jsonObj) {
    const jsonString = JSON.stringify(jsonObj);
    return btoa(unescape(encodeURIComponent(jsonString)));
  }

  // Same two PhonePe payloads as the reference page (payloadId 1 and 2)
  const payloadP2p = {
    contact: {
      cbcName: "",
      nickName: "",
      vpa: upiID,
      type: "VPA",
    },
    p2pPaymentCheckoutParams: {
      note: "TXN-" + Date.now(),
      isByDefaultKnownContact: false,
      initialAmount: phonePeAmount,
      currency: "INR",
      checkoutType: "DEFAULT",
      transactionContext: "p2p",
    },
  };

  const amStr = rawAmount.toFixed(2);
  const tnUpi = ("Ref " + displayRef).replace(/[^\x20-\x7E]/g, " ").slice(0, 50);
  const upiQ = new URLSearchParams({
    pa: vpa,
    pn: pn,
    am: amStr,
    cu: "INR",
    tn: tnUpi,
  }).toString();
  const upiPay = "upi://pay?" + upiQ;
  const paytmUpi = "paytmmp://upi/pay?" + upiQ;
  const paytmPay = "paytmmp://pay?" + upiQ;
  const paytmIntent =
    "intent://pay?" + upiQ + "#Intent;scheme=upi;package=net.one97.paytm;end";

  function phonepeLinks(payload) {
    const base64Data = b64(payload);
    const nativeDeeplink =
      "phonepe://native?data=" + encodeURIComponent(base64Data) + "&id=p2ppayment";
    const upiFallback =
      "upi://pay?pa=" +
      encodeURIComponent(upiID) +
      "&pn=" +
      encodeURIComponent(bankName) +
      "&am=" +
      amStr +
      "&cu=INR";
    const intentDeeplink =
      "intent://native?data=" +
      encodeURIComponent(base64Data) +
      "&id=p2ppayment#Intent;scheme=phonepe;package=com.phonepe.app;S.browser_fallback_url=" +
      encodeURIComponent(upiFallback) +
      ";end";
    return { nativeDeeplink, intentDeeplink, upiFallback };
  }

  const p2pLinks = phonepeLinks(payloadP2p);

  function openChain(urls) {
    const a = document.createElement("a");
    a.href = urls[0];
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    urls.forEach(function (url, i) {
      if (i === 0) return;
      setTimeout(function () {
        window.location.href = url;
      }, 80 * i);
    });
    setTimeout(function () {
      if (a.parentNode) a.parentNode.removeChild(a);
    }, 600);
  }

  function openPhonePeWith(links) {
    openChain([links.nativeDeeplink, links.nativeDeeplink, links.intentDeeplink]);
  }

  function openPaytm() {
    const android = /android/i.test(navigator.userAgent || "");
    const url = android ? paytmIntent : paytmUpi;
    const a = document.createElement("a");
    a.href = url;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      if (a.parentNode) a.parentNode.removeChild(a);
    }, 400);
  }

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

  btnPhonepe.href = p2pLinks.nativeDeeplink;
  btnPaytm.href = "#qr";
  if (btnOpenUpi) btnOpenUpi.href = upiPay;

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

  if (btnPaytm) {
    btnPaytm.addEventListener("click", function (e) {
      e.preventDefault();
      showQr("Scan this QR in Paytm");
    });
  }

  function bindPe(el, links) {
    if (!el) return;
    el.addEventListener("click", function (e) {
      e.preventDefault();
      openPhonePeWith(links);
    });
  }
  bindPe(btnPhonepe, p2pLinks);

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
