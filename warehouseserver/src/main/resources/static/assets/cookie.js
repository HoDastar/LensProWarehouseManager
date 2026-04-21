(function () {
  var TOKEN_KEY = "token";

  function getCookie(name) {
    var pairs = document.cookie ? document.cookie.split("; ") : [];
    for (var i = 0; i < pairs.length; i += 1) {
      var parts = pairs[i].split("=");
      var key = decodeURIComponent(parts.shift());
      if (key === name) {
        return decodeURIComponent(parts.join("="));
      }
    }
    return "";
  }

  function setCookie(name, value, days) {
    var maxAge = "";
    if (typeof days === "number") {
      maxAge = "; max-age=" + String(Math.max(0, Math.floor(days * 24 * 60 * 60)));
    }
    document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value || "") + maxAge + "; path=/; SameSite=Lax";
  }

  function removeCookie(name) {
    document.cookie = encodeURIComponent(name) + "=; max-age=0; path=/; SameSite=Lax";
  }

  function normalizePath() {
    var path = window.location.pathname || "/";
    return path.substring(path.lastIndexOf("/") + 1).toLowerCase();
  }

  function loginUrl() {
    var current = window.location.pathname + window.location.search + window.location.hash;
    return "/login.html?redirect=" + encodeURIComponent(current);
  }

  function safeRedirectPath(value, fallbackPath) {
    if (!value) {
      return fallbackPath || "/upload.html";
    }

    try {
      var target = new URL(value, window.location.origin);
      if (target.origin !== window.location.origin) {
        return fallbackPath || "/upload.html";
      }
      return target.pathname + target.search + target.hash;
    } catch (error) {
      return fallbackPath || "/upload.html";
    }
  }

  function isPublicPage() {
    var page = normalizePath();
    return page === "login.html" || page === "outbound_report.html";
  }

  async function checkToken(token) {
    if (!token) {
      return false;
    }

    try {
      var response = await fetch(window.location.origin + "/api/config/check_token_web?token=" + encodeURIComponent(token), {
        method: "GET",
        credentials: "same-origin"
      });
      if (!response.ok) {
        return false;
      }
      var data = await response.json();
      return data && data.result === true;
    } catch (error) {
      return false;
    }
  }

  async function requireToken() {
    if (isPublicPage()) {
      return getCookie(TOKEN_KEY);
    }

    var token = getCookie(TOKEN_KEY);
    var valid = await checkToken(token);
    if (!valid) {
      removeCookie(TOKEN_KEY);
      window.location.replace(loginUrl());
      return "";
    }
    return token;
  }

  async function redirectIfAuthenticated(fallbackPath) {
    var token = getCookie(TOKEN_KEY);
    var valid = await checkToken(token);
    if (valid) {
      var params = new URLSearchParams(window.location.search);
      window.location.replace(safeRedirectPath(params.get("redirect"), fallbackPath));
    }
  }

  window.WarehouseCookie = {
    tokenKey: TOKEN_KEY,
    get: getCookie,
    set: setCookie,
    remove: removeCookie,
    getToken: function () {
      return getCookie(TOKEN_KEY);
    },
    setToken: function (token, days) {
      setCookie(TOKEN_KEY, token, days == null ? 30 : days);
    },
    clearToken: function () {
      removeCookie(TOKEN_KEY);
    },
    checkToken: checkToken,
    requireToken: requireToken,
    redirectIfAuthenticated: redirectIfAuthenticated,
    safeRedirectPath: safeRedirectPath
  };

  if (document.currentScript && document.currentScript.dataset.autoCheck === "false") {
    return;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", requireToken);
  } else {
    requireToken();
  }
})();
