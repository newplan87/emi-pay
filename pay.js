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

  let tn = ref ? "EMI Pay - " + ref : "EMI Pay";
  if (tn.length > 50) tn = tn.slice(0, 50);
  const tr = String(ref || "EMIPAY").replace(/[^A-Za-z0-9]/g, "").slice(0, 32) || "EMIPAY";

  // NPCI UPI collect (merchant VPA). Do NOT use phonepe://native P2P — PhonePe
  // opens but rejects merchant / @pty collect as a P2P contact payment.
  const q =
    "pa=" + encodeURIComponent(vpa) +
    "&pn=" + encodeURIComponent(pn) +
    "&am=" + encodeURIComponent(am) +
    "&cu=INR" +
    "&tn=" + encodeURIComponent(tn) +
    "&tr=" + encodeURIComponent(tr);

  const upiPay = "upi://pay?" + q;
  const ua = navigator.userAgent || "";
  const isAndroid = /android/i.test(ua);
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isMobile = isAndroid || isIOS || /mobile/i.test(ua);
  const inApp = /FBAN|FBAV|Instagram|Line\/|WhatsApp|; wv|WebView/i.test(ua);

  const phonepeUpi = isIOS ? "phonepe://upi//pay?" + q : "phonepe://upi/pay?" + q;
  const phonepeAndroidIntent =
    "intent://pay?" + q + "#Intent;scheme=upi;package=com.phonepe.app;end";

  const paytmDeep = "paytmmp://cash_wallet?" + q + "&featuretype=money_transfer";
  const paytmIntent =
    "intent://cash_wallet?" + q +
    "&featuretype=money_transfer#Intent;scheme=paytmmp;package=net.one97.paytm;end";

  const phonepeHref = isAndroid ? phonepeAndroidIntent : phonepeUpi;
  const paytmHref = isAndroid ? paytmIntent : paytmDeep;

  const hint = document.getElementById("appHint");
  if (hint) {
    if (!isMobile) {
      hint.hidden = false;
      hint.textContent =
        "PhonePe laptop pe nahi khulti. Phone ke Chrome se kholo, ya Scan QR.";
    } else if (inApp) {
      hint.hidden = false;
      hint.textContent =
        "WhatsApp / Instagram se app nahi khulti. “Open in Chrome” dabao, phir PhonePe.";
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

  document.getElementById("btnPhonepe").href = phonepeHref;
  document.getElementById("btnPaytm").href = paytmHref;
  const btnPrimary = document.getElementById("btnPrimary");
  btnPrimary.href = phonepeHref;
  btnPrimary.textContent = "Pay " + amountLabel + " with PhonePe";
  document.getElementById("btnOpenUpi").href = upiPay;

  const btnPhonepeIntent = document.getElementById("btnPhonepeIntent");
  if (btnPhonepeIntent) {
    btnPhonepeIntent.hidden = false;
    btnPhonepeIntent.style.display = "flex";
    btnPhonepeIntent.href = phonepeUpi;
    btnPhonepeIntent.textContent = "PhonePe (upi/pay)";
  }

  const qrEl = document.getElementById("qr");
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
