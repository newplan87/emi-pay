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

  document.getElementById("payeeName").textContent = pn;
  document.getElementById("amountDisplay").textContent = amountLabel;
  document.getElementById("vpaText").textContent = vpa;
  const vpaQr = document.getElementById("vpaTextQr");
  if (vpaQr) vpaQr.textContent = vpa;

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
      rawAmount +
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

  // Exact Paytm string from that page (only VPA/amount swapped)
  const note = bankName.replace(/ /g, "_");
  const paytmDeep =
    "paytmmp://cash_wallet?pa=" +
    encodeURIComponent(upiID2) +
    "&am=" +
    rawAmount +
    "&tn=" +
    encodeURIComponent(note) +
    "&pn=" +
    encodeURIComponent(upiID2) +
    "&mc=&cu=INR&url=&mode=&purpose=&orgid=&sign=&featuretype=money_transfer";

  function openPhonePeWith(links) {
    const a = document.createElement("a");
    a.href = links.nativeDeeplink;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      window.location.href = links.nativeDeeplink;
    }, 100);
    setTimeout(function () {
      window.location.href = links.intentDeeplink;
    }, 300);
    setTimeout(function () {
      if (a.parentNode) a.parentNode.removeChild(a);
    }, 500);
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
  btnPaytm.href = paytmDeep;
  if (btnOpenUpi) btnOpenUpi.href = p2pLinks.upiFallback;

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
        text: p2pLinks.upiFallback,
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
        encodeURIComponent(p2pLinks.upiFallback);
      qrEl.appendChild(img);
    }
  }

  function copyUpi(btn) {
    const text = vpa;
    const done = function () {
      if (!btn) return;
      const prev = btn.textContent;
      btn.textContent = "Copied";
      setTimeout(function () { btn.textContent = prev; }, 1200);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () {
        window.prompt("UPI ID", text);
      });
      return;
    }
    window.prompt("UPI ID", text);
  }

  const copyA = document.getElementById("copyVpa");
  const copyB = document.getElementById("copyVpaQr");
  if (copyA) copyA.addEventListener("click", function () { copyUpi(copyA); });
  if (copyB) copyB.addEventListener("click", function () { copyUpi(copyB); });

  const panelUpi = document.getElementById("panelUpi");
  const panelQr = document.getElementById("panelQr");
  document.querySelectorAll(".tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      document.querySelectorAll(".tab").forEach(function (t) { t.classList.remove("active"); });
      tab.classList.add("active");
      const which = tab.getAttribute("data-tab");
      panelUpi.classList.toggle("is-off", which !== "upi");
      panelQr.classList.toggle("is-off", which !== "qr");
      if (which === "qr") {
        requestAnimationFrame(function () {
          requestAnimationFrame(drawQr);
        });
      }
    });
  });
})();
