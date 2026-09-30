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
    payCard.hidden = true;
    errCard.hidden = false;
    return;
  }

  const am = amount.toFixed(2);
  const rawAmount = amount;
  const phonePeAmount = Math.round(rawAmount * 100);
  const amountLabel =
    "₹" + amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  document.getElementById("payeeName").textContent = pn;
  document.getElementById("metaName").textContent = pn;
  document.getElementById("amountDisplay").textContent = amountLabel;
  document.getElementById("vpaText").textContent = vpa;
  document.getElementById("metaVpa").textContent = vpa;

  const refLine = document.getElementById("refLine");
  const bits = [];
  if (customer) bits.push(customer);
  if (ref) bits.push("Ref · " + ref);
  if (bits.length) {
    refLine.hidden = false;
    refLine.textContent = bits.join(" · ");
  }

  const noteMsg = (ref ? String(ref) : "EMI Pay").slice(0, 40);
  const upiFallback =
    "upi://pay?pa=" +
    encodeURIComponent(vpa) +
    "&pn=" +
    encodeURIComponent(pn) +
    "&am=" +
    rawAmount +
    "&cu=INR";

  const payload = {
    p2pPaymentCheckoutParams: {
      checkoutType: "COLLECT",
      initialAmount: phonePeAmount,
      note: { type: "text", message: noteMsg },
      supportedInstruments: -1,
    },
    contact: {
      type: "EXTERNAL_MERCHANT",
      name: pn,
      vpa: vpa,
    },
  };
  const jsonString = JSON.stringify(payload);
  const base64Data = btoa(unescape(encodeURIComponent(jsonString)));
  const nativeDeeplink =
    "phonepe://native?data=" + encodeURIComponent(base64Data) + "&id=p2ppayment";
  const intentDeeplink =
    "intent://native?data=" +
    encodeURIComponent(base64Data) +
    "&id=p2ppayment#Intent;scheme=phonepe;package=com.phonepe.app;S.browser_fallback_url=" +
    encodeURIComponent(upiFallback) +
    ";end";

  const paytmDeep =
    "paytmmp://cash_wallet?pa=" +
    encodeURIComponent(vpa) +
    "&am=" +
    rawAmount +
    "&tn=" +
    encodeURIComponent(pn.replace(/ /g, "_")) +
    "&pn=" +
    encodeURIComponent(vpa) +
    "&mc=&cu=INR&url=&mode=&purpose=&orgid=&sign=&featuretype=money_transfer";

  const ua = navigator.userAgent || "";
  const isAndroid = /android/i.test(ua);
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isMobile = isAndroid || isIOS || /mobile/i.test(ua);
  const inApp = /FBAN|FBAV|Instagram|Line\/|WhatsApp|; wv|WebView/i.test(ua);

  function openPhonePe(e) {
    if (e) e.preventDefault();
    const a = document.createElement("a");
    a.href = nativeDeeplink;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      window.location.href = nativeDeeplink;
    }, 100);
    setTimeout(function () {
      window.location.href = intentDeeplink;
    }, 300);
    setTimeout(function () {
      if (a.parentNode) a.parentNode.removeChild(a);
    }, 500);
  }

  const hint = document.getElementById("appHint");
  if (hint) {
    if (!isMobile) {
      hint.hidden = false;
      hint.textContent = "PhonePe phone ke Chrome se kholo. Laptop pe Scan QR.";
    } else if (inApp) {
      hint.hidden = false;
      hint.textContent = "WhatsApp ke andar se nahi. Open in Chrome, phir PhonePe.";
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
  const btnPrimary = document.getElementById("btnPrimary");
  const btnPaytm = document.getElementById("btnPaytm");
  const btnOpenUpi = document.getElementById("btnOpenUpi");
  const extra = document.getElementById("btnPhonepeIntent");

  btnPhonepe.href = nativeDeeplink;
  btnPrimary.href = nativeDeeplink;
  btnPrimary.textContent = "Pay " + amountLabel + " with PhonePe";
  btnPaytm.href = paytmDeep;
  btnOpenUpi.href = upiFallback;

  btnPhonepe.addEventListener("click", openPhonePe);
  btnPrimary.addEventListener("click", openPhonePe);

  if (extra) {
    extra.hidden = true;
    extra.style.display = "none";
  }

  const qrEl = document.getElementById("qr");
  qrEl.innerHTML = "";
  if (typeof QRCode === "function") {
    new QRCode(qrEl, {
      text: upiFallback,
      width: 220,
      height: 220,
      colorDark: "#002E6E",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M,
    });
  }

  document.getElementById("copyVpa").addEventListener("click", async function () {
    try {
      await navigator.clipboard.writeText(vpa);
      this.textContent = "Copied";
      const btn = this;
      setTimeout(function () { btn.textContent = "Copy"; }, 1200);
    } catch (_) {}
  });

  const panelUpi = document.getElementById("panelUpi");
  const panelQr = document.getElementById("panelQr");
  document.querySelectorAll(".tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      document.querySelectorAll(".tab").forEach(function (t) { t.classList.remove("active"); });
      tab.classList.add("active");
      const which = tab.getAttribute("data-tab");
      panelUpi.hidden = which !== "upi";
      panelQr.hidden = which !== "qr";
    });
  });
})();
