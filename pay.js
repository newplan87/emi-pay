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

  let tn = ref ? "EMI Pay — " + ref : "EMI Pay";
  if (tn.length > 50) tn = tn.slice(0, 50);

  const q =
    "pa=" + encodeURIComponent(vpa) +
    "&pn=" + encodeURIComponent(pn) +
    "&am=" + encodeURIComponent(am) +
    "&cu=INR&tn=" + encodeURIComponent(tn);
  const upiPay = "upi://pay?" + q;
  const isAndroid = /android/i.test(navigator.userAgent || "");
  const phonepe = isAndroid ? "phonepe://upi/pay?" + q : "phonepe://upi//pay?" + q;
  const paytm =
    "paytmmp://cash_wallet?pa=" + encodeURIComponent(vpa) +
    "&pn=" + encodeURIComponent(pn) +
    "&am=" + encodeURIComponent(am) +
    "&cu=INR&tn=" + encodeURIComponent(tn) +
    "&featuretype=money_transfer";

  document.getElementById("btnPhonepe").href = phonepe;
  document.getElementById("btnPaytm").href = paytm;
  const btnPrimary = document.getElementById("btnPrimary");
  btnPrimary.href = phonepe;
  btnPrimary.textContent = "Pay " + amountLabel + " with PhonePe";
  document.getElementById("btnOpenUpi").href = upiPay;

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
