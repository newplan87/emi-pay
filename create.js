(function () {
  const form = document.getElementById("form");
  const amountEl = document.getElementById("amount");
  const refEl = document.getElementById("ref");
  const err = document.getElementById("err");
  const result = document.getElementById("result");
  const outUrl = document.getElementById("outUrl");
  const amtLabel = document.getElementById("amtLabel");
  const copyBtn = document.getElementById("copyBtn");
  const previewBtn = document.getElementById("previewBtn");

  function rupees(n) {
    return "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    err.hidden = true;
    const am = Number(String(amountEl.value || "").trim().replace(/,/g, ""));
    if (!am || am <= 0) {
      err.textContent = "Valid amount enter karo";
      err.hidden = false;
      return;
    }
    const u = new URL("pay.html", window.location.href);
    u.searchParams.set("am", am.toFixed(2));
    const ref = String(refEl.value || "").trim();
    if (ref) u.searchParams.set("ref", ref);
    amtLabel.textContent = rupees(am);
    outUrl.textContent = u.toString();
    previewBtn.href = u.toString();
    result.hidden = false;
    copyBtn.textContent = "Copy link";
  });

  (function showEmbed() {
    var origin = window.location.origin + window.location.pathname.replace(/[^/]+$/, "");
    document.getElementById("embedBox").textContent =
      '<script src="' + origin + 'checkout.js"><\/script>\n' +
      '<input id="amt" placeholder="Amount">\n' +
      '<button data-emipay data-amount-from="#amt" data-ref="ORD-1">Pay</button>\n\n' +
      '// ya JS se koi bhi amount:\n' +
      'EmiPay.open({ amount: 799.50, ref: "EMI-88" });';
  })();

  copyBtn.addEventListener("click", async function () {
    try {
      await navigator.clipboard.writeText(outUrl.textContent);
      copyBtn.textContent = "Copied";
      setTimeout(function () { copyBtn.textContent = "Copy link"; }, 1500);
    } catch (_) {}
  });
})();
