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

  // ASCII hyphen only — em dash breaks some UPI apps
  let tn = ref ? "EMI Pay - " + ref : "EMI Pay";
  if (tn.length > 50) tn = tn.slice(0, 50);

  const q =
    "pa=" + encodeURIComponent(vpa) +
    "&pn=" + encodeURIComponent(pn) +
    "&am=" + encodeURIComponent(am) +
    "&cu=INR&tn=" + encodeURIComponent(tn);

  const upiPay = "upi://pay?" + q;
  const ua = navigator.userAgent || "";
  const isAndroid = /android/i.test(ua);
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isMobile = isAndroid || isIOS || /mobile/i.test(ua);

  // PhonePe: Chrome Android needs intent:// + package. Custom phonepe:// often does nothing.
  const phonepePay = "phonepe://pay?" + q;
  const phonepeUpi = "phonepe://upi/pay?" + q;
  const phonepeIntent =
    "intent://pay?" + q + "#Intent;scheme=phonepe;package=com.phonepe.app;end";
  const phonepeUpiIntent =
    "intent://pay?" + q + "#Intent;scheme=upi;package=com.phonepe.app;end";

  const paytmDeep =
    "paytmmp://cash_wallet?" + q + "&featuretype=money_transfer";
  const paytmIntent =
    "intent://cash_wallet?" + q +
    "&featuretype=money_transfer#Intent;scheme=paytmmp;package=net.one97.paytm;end";

  const phonepeChain = isAndroid
    ? [phonepeIntent, phonepeUpiIntent, phonepePay, phonepeUpi, upiPay]
    : [phonepePay, phonepeUpi, upiPay];

  const paytmChain = isAndroid
    ? [paytmIntent, paytmDeep, upiPay]
    : [paytmDeep, upiPay];

  const hint = document.getElementById("appHint");
  if (hint && !isMobile) {
    hint.hidden = false;
  }

  function launchChain(urls) {
    var i = 0;
    var started = Date.now();
    function next() {
      if (document.hidden) return;
      if (i >= urls.length) return;
      if (Date.now() - started > 5000) return;
      window.location.href = urls[i++];
      setTimeout(next, 1100);
    }
    next();
  }

  function bindLaunch(el, urls, fallbackHref) {
    el.href = fallbackHref || urls[0];
    el.addEventListener("click", function (e) {
      if (!isMobile) return; // let href try; laptop has no PhonePe
      e.preventDefault();
      launchChain(urls);
    });
  }

  const btnPhonepe = document.getElementById("btnPhonepe");
  const btnPaytm = document.getElementById("btnPaytm");
  const btnPrimary = document.getElementById("btnPrimary");
  const btnOpenUpi = document.getElementById("btnOpenUpi");

  bindLaunch(btnPhonepe, phonepeChain, isAndroid ? phonepeIntent : phonepePay);
  bindLaunch(btnPaytm, paytmChain, isAndroid ? paytmIntent : paytmDeep);
  bindLaunch(btnPrimary, phonepeChain, isAndroid ? phonepeIntent : upiPay);
  btnPrimary.textContent = "Pay " + amountLabel + " with PhonePe";
  btnOpenUpi.href = upiPay;
  bindLaunch(btnOpenUpi, [upiPay], upiPay);

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
