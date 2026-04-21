(function () {
  function closeModal(layer, value, resolve) {
    layer.classList.add("modal-leaving");
    window.setTimeout(function () {
      layer.remove();
      resolve(value);
    }, 210);
  }

  window.openModal = async function openModal(title, text) {
    return new Promise(function (resolve) {
      var layer = document.createElement("div");
      layer.className = "modal-layer";

      var box = document.createElement("div");
      box.className = "modal-box";

      var close = document.createElement("button");
      close.className = "modal-close";
      close.type = "button";
      close.setAttribute("aria-label", "关闭");
      close.textContent = "×";

      var titleEl = document.createElement("h2");
      titleEl.className = "modal-title";
      titleEl.textContent = title;

      var textEl = document.createElement("p");
      textEl.className = "modal-text";
      textEl.textContent = text;

      var actions = document.createElement("div");
      actions.className = "modal-actions";

      var cancel = document.createElement("button");
      cancel.className = "modal-button modal-cancel";
      cancel.type = "button";
      cancel.textContent = "取消";

      var confirm = document.createElement("button");
      confirm.className = "modal-button modal-confirm";
      confirm.type = "button";
      confirm.textContent = "确认";

      actions.append(cancel, confirm);
      box.append(close, titleEl, textEl, actions);
      layer.append(box);
      document.body.append(layer);

      close.addEventListener("click", function () {
        closeModal(layer, false, resolve);
      }, { once: true });

      cancel.addEventListener("click", function () {
        closeModal(layer, false, resolve);
      }, { once: true });

      confirm.addEventListener("click", function () {
        closeModal(layer, true, resolve);
      }, { once: true });
    });
  };

  window.Showbubble = function Showbubble(text, bgColor, textColor) {
    var stack = document.querySelector(".bubble-stack");
    if (!stack) {
      stack = document.createElement("div");
      stack.className = "bubble-stack";
      document.body.append(stack);
    }

    var item = document.createElement("div");
    item.className = "bubble-item";
    item.textContent = text;
    item.style.backgroundColor = bgColor || "#000000";
    item.style.color = textColor || "#ffffff";
    stack.append(item);

    window.setTimeout(function () {
      item.classList.add("bubble-leaving");
      window.setTimeout(function () {
        item.remove();
        if (!stack.children.length) {
          stack.remove();
        }
      }, 300);
    }, 3000);
  };

  document.addEventListener("DOMContentLoaded", function () {
    var tooltip = document.createElement("div");
    tooltip.className = "custom-tooltip";
    document.body.append(tooltip);

    function showTip(target) {
      var text = target.getAttribute("data-tip");
      if (!text) {
        return;
      }

      tooltip.textContent = text;
      tooltip.classList.add("is-visible");

      var rect = target.getBoundingClientRect();
      var tipRect = tooltip.getBoundingClientRect();
      var top = rect.top - tipRect.height - 10;
      var left = rect.left + (rect.width - tipRect.width) / 2;

      if (top < 8) {
        top = rect.bottom + 10;
      }

      left = Math.max(8, Math.min(left, window.innerWidth - tipRect.width - 8));
      tooltip.style.top = top + "px";
      tooltip.style.left = left + "px";
    }

    function hideTip() {
      tooltip.classList.remove("is-visible");
    }

    document.addEventListener("mouseover", function (event) {
      var target = event.target.closest("[data-tip]");
      if (target) {
        showTip(target);
      }
    });

    document.addEventListener("mouseout", function (event) {
      if (event.target.closest("[data-tip]")) {
        hideTip();
      }
    });

    document.addEventListener("focusin", function (event) {
      var target = event.target.closest("[data-tip]");
      if (target) {
        showTip(target);
      }
    });

    document.addEventListener("focusout", function (event) {
      if (event.target.closest("[data-tip]")) {
        hideTip();
      }
    });
  });
})();
