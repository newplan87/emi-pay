/**
 * Drop this on YOUR website (same business as EMI Pay).
 * Host emi-pay files, then:
 *
 *   <script src="https://YOUR-EMI-PAY-HOST/checkout.js"></script>
 *   <button data-emipay data-amount="1500" data-ref="ORD-1">Pay ₹1500</button>
 *
 * or: EmiPay.open({ amount: 1500, ref: "ORD-1" })
 */
(function (global) {
  function scriptEl() {
    if (document.currentScript && document.currentScript.src) return document.currentScript;
    var list = document.getElementsByTagName("script");
    for (var i = list.length - 1; i >= 0; i--) {
      if (list[i].src && /checkout\.js(\?|$)/.test(list[i].src)) return list[i];
    }
    return null;
  }

  function baseUrl() {
    var s = scriptEl();
    if (!s || !s.src) return "";
    return s.src.replace(/checkout\.js(\?.*)?$/i, "");
  }

  var BASE = baseUrl();

  function payUrl(opts) {
    opts = opts || {};
    var amount = Number(String(opts.amount != null ? opts.amount : opts.am || "").replace(/,/g, ""));
    if (!amount || amount <= 0) throw new Error("Valid amount required");
    var u = new URL("pay.html", BASE || global.location.href);
    u.searchParams.set("am", amount.toFixed(2));
    if (opts.ref) u.searchParams.set("ref", String(opts.ref));
    if (opts.name) u.searchParams.set("name", String(opts.name));
    return u.toString();
  }

  function openPay(opts) {
    var url = payUrl(opts);
    if (opts && opts.newTab) global.open(url, "_blank", "noopener");
    else global.location.href = url;
  }

  function bindButtons() {
    var nodes = document.querySelectorAll("[data-emipay]");
    for (var i = 0; i < nodes.length; i++) {
      (function (btn) {
        if (btn.getAttribute("data-emipay-bound")) return;
        btn.setAttribute("data-emipay-bound", "1");
        btn.addEventListener("click", function (e) {
          e.preventDefault();
          var from = btn.getAttribute("data-amount-from");
          var raw = btn.getAttribute("data-amount") || btn.getAttribute("data-am");
          if (from) {
            var src = document.querySelector(from);
            if (src) raw = src.value;
          }
          openPay({
            amount: raw,
            ref: btn.getAttribute("data-ref") || "",
            name: btn.getAttribute("data-name") || "",
            newTab: btn.getAttribute("data-newtab") === "1",
          });
        });
      })(nodes[i]);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindButtons);
  } else {
    bindButtons();
  }

  global.EmiPay = { url: payUrl, open: openPay, bind: bindButtons, base: BASE };
})(typeof window !== "undefined" ? window : this);
