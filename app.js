(function () {
  "use strict";
  var API = "https://hn.algolia.com/api/v1/search_by_date";
  var SETTLE_HOURS = 48;
  var WANT = 1000;
  var BUCKETS = [[1, 1], [2, 2], [3, 4], [5, 9], [10, 19], [20, 49], [50, 99], [100, 199], [200, 499], [500, Infinity]];
  var DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  function $(id) { return document.getElementById(id); }
  function pct(x) { return (Math.round(x * 1000) / 10).toFixed(1) + "%"; }
  function median(a) {
    var s = a.slice().sort(function (x, y) { return x - y; });
    var m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }
  function fmtDate(sec) { return new Date(sec * 1000).toISOString().slice(0, 10); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  async function fetchPosts(cutoff) {
    var hits = [];
    var page = 0;
    while (hits.length < WANT && page < 20) {
      var url = API + "?tags=show_hn&hitsPerPage=1000&page=" + page +
        "&numericFilters=" + encodeURIComponent("created_at_i<" + cutoff);
      var res = await fetch(url, { credentials: "omit" });
      if (!res.ok) throw new Error("API returned HTTP " + res.status);
      var data = await res.json();
      if (!data.hits || !data.hits.length) break;
      hits = hits.concat(data.hits);
      page++;
      if (page >= data.nbPages) break;
    }
    return hits.slice(0, WANT);
  }

  function bars(el, rows, opts) {
    // rows: [{label, value, text}]
    var W = Math.max(280, Math.min(720, (el.clientWidth || 720) - 16)), rowH = opts.rowH || 26, left = opts.left || 70, right = 96;
    var H = rows.length * rowH + 8;
    var max = Math.max.apply(null, rows.map(function (r) { return r.value; })) || 1;
    var s = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(opts.title) + '">';
    rows.forEach(function (r, i) {
      var y = 4 + i * rowH;
      var w = Math.max(r.value > 0 ? 2 : 0, (W - left - right) * r.value / max);
      s += '<text x="' + (left - 8) + '" y="' + (y + rowH * 0.65) + '" text-anchor="end">' + esc(r.label) + "</text>";
      s += '<rect x="' + left + '" y="' + (y + 3) + '" width="' + w.toFixed(1) + '" height="' + (rowH - 8) + '" fill="' + (r.color || "#ff6600") + '" rx="2"></rect>';
      s += '<text x="' + (left + w + 6) + '" y="' + (y + rowH * 0.65) + '">' + esc(r.text) + "</text>";
    });
    el.innerHTML = s + "</svg>";
  }

  var lastRender = null;
  function render(posts, fetchedAt) {
    $("status").hidden = true;
    $("results").hidden = false;
    lastRender = function () { render(posts, fetchedAt); };
    var pts = posts.map(function (h) { return h.points || 0; });
    var n = pts.length;
    if (!n) throw new Error("The API returned no posts.");
    var share = function (k) { return pts.filter(function (p) { return p >= k; }).length / n; };
    var times = posts.map(function (h) { return h.created_at_i; });
    var comments = posts.map(function (h) { return h.num_comments || 0; });

    $("median").textContent = median(pts);
    $("p10").textContent = pct(share(10));
    $("p50").textContent = pct(share(50));
    $("p100").textContent = pct(share(100));
    $("meta").textContent = "Based on " + n + " Show HN posts from " + fmtDate(Math.min.apply(null, times)) +
      " to " + fmtDate(Math.max.apply(null, times)) + " (UTC). Median comments: " + median(comments) +
      ". Fetched " + fetchedAt.toISOString().replace("T", " ").slice(0, 16) + " UTC. Posts younger than " +
      SETTLE_HOURS + " hours are excluded so their points can settle.";

    bars($("hist"), BUCKETS.map(function (b) {
      var c = pts.filter(function (p) { return p >= b[0] && p <= b[1]; }).length;
      var label = b[1] === Infinity ? b[0] + "+" : (b[0] === b[1] ? String(b[0]) : b[0] + "-" + b[1]);
      return { label: label + " pts", value: c, text: c + " (" + pct(c / n) + ")", color: b[0] >= 10 ? "#ff6600" : "#bbb" };
    }), { title: "Histogram of points" });

    var wd = DAYS.map(function () { return [0, 0]; });
    var hr = []; for (var i = 0; i < 24; i++) hr.push([0, 0]);
    posts.forEach(function (h) {
      var d = new Date(h.created_at_i * 1000);
      var ok = (h.points || 0) >= 10 ? 1 : 0;
      var w = (d.getUTCDay() + 6) % 7;
      wd[w][0]++; wd[w][1] += ok;
      hr[d.getUTCHours()][0]++; hr[d.getUTCHours()][1] += ok;
    });
    function rate(c) { return c[0] ? c[1] / c[0] : 0; }
    bars($("weekday"), wd.map(function (c, i) {
      return { label: DAYS[i], value: rate(c), text: pct(rate(c)) + " of " + c[0] };
    }), { title: "Share reaching 10+ by weekday" });
    bars($("hour"), hr.map(function (c, i) {
      return { label: (i < 10 ? "0" : "") + i + ":00", value: rate(c), text: pct(rate(c)) + " of " + c[0] };
    }), { title: "Share reaching 10+ by hour", rowH: 22, left: 70 });

    $("status").hidden = true;
    $("results").hidden = false;
  }

  async function main() {
    var fetchedAt = new Date();
    var cutoff = Math.floor(fetchedAt.getTime() / 1000) - SETTLE_HOURS * 3600;
    try {
      var posts = await fetchPosts(cutoff);
      render(posts, fetchedAt);
      var t; window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(lastRender, 200); });
    } catch (err) {
      var st = $("status");
      st.hidden = false;
      $("results").hidden = true;
      st.className = "status error";
      st.innerHTML = "Could not load data from the HN Algolia API (" + esc(err.message || err) +
        "). It may be down or blocked on your network. Please try again later, or " +
        '<a href="">reload the page</a>.';
    }
  }
  main();
})();
