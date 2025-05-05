function util(a = null, b = null, c = null) {
  if (a instanceof HTMLElement) return util.modElement(a);
  if (a && !b && !c) {
    return util.modElement(document.querySelector(a));
  } else if (a && b && !c) {
    if (typeof b == "function")
      return util
        .modElement(document.querySelectorAll(a))
        .forEach((element, index) => {
          b(element, index);
        });
    return util.modElement(document.querySelectorAll(a)[b]);
  }

  return c(util.modElement(document.querySelectorAll(a)[b]));
}

util.VERSION = "0.1.0 beta";

util.PVER = () => {
  console.log(
    `%cutil ${util.VERSION}` + "%c\nLicense: None. Copy as you wish.",
    "color:lightseagreen;text-shadow: 0 2px teal; font-size: 23px;",
    "color: tomato;"
  );
};

util.create = (elm) => {
  return {
    type: elm,
    innerHTML: null,
    classList: [],
    id: null,
    attr: {},
    setInnerHTML(a) {
      this.innerHTML = a;
      return this;
    },
    setClassList(classlist) {
      this.classList = classlist;
      return this;
    },
    addClass(cllass) {
      this.classList.push(cllass);
      return this;
    },
    setId(id) {
      this.id = id;
      return this;
    },
    addAttribute(property, value) {
      this.attr[property] = value;
      return this;
    },
    render() {
      let a = document.createElement(this.type);
      if (this.innerHTML) a.innerHTML = this.innerHTML;
      if (this.classList.length > 0) a.classList = this.classList.join(" ");
      if (this.id) a.id = this.id;
      for (let property in this.attr) {
        a.setAttribute(property, this.attr[property]);
      }

      return util.modElement(a);
    },
  };
};

util.collisionHelper = (element, newX, newY) => {
  const rect = element.getBoundingClientRect();
  if (
    newX < 0 ||
    newY < 0 ||
    newX + rect.width > window.innerWidth ||
    newY + rect.height > window.innerHeight
  ) {
    return true;
  }
  return false;
};

util.MotionManager = class {
  constructor(element, collision = false) {
    this.element = element;
    this.collision = collision;
    this.collisionHelper = util.collisionHelper;
    this.state = {
      move: {
        direction: null,
        speed: 0,
        dx: 0,
        dy: 0,
        followRotation: false,
      },
      rotate: {
        targetAngle: 0,
        currentAngle: 0,
        speed: 0,
      },
      position: {
        x: isNaN(parseFloat(element.style.left))
          ? 0
          : parseFloat(element.style.left),
        y: isNaN(parseFloat(element.style.top))
          ? 0
          : parseFloat(element.style.top),
      },
      lastTimestamp: null,
    };
    this.animationFrame = null;
    this.animate = this.animate.bind(this);
    this.animate();
  }

  moveDirection(direction, speed) {
    const directions = {
      up: -Math.PI / 2,
      "up-right": -Math.PI / 4,
      right: 0,
      "down-right": Math.PI / 4,
      down: Math.PI / 2,
      "down-left": (3 * Math.PI) / 4,
      left: Math.PI,
      "up-left": -(3 * Math.PI) / 4,
    };

    const angle = directions[direction];
    this.state.move.direction = direction;
    this.state.move.speed = speed;
    this.state.move.dx = Math.cos(angle);
    this.state.move.dy = Math.sin(angle);
    this.state.move.followRotation = false;
  }

  // Rotate the element to face a specific coordinate
  rotatePosition(targetX, targetY, rotationSpeed) {
    const rect = this.element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = targetX - centerX;
    const dy = targetY - centerY;
    const targetAngleRad = Math.atan2(dy, dx);
    const targetAngleDeg = targetAngleRad * (180 / Math.PI);

    this.state.rotate.targetAngle = targetAngleDeg;
    this.state.rotate.speed = rotationSpeed;
    this.state.move.followRotation = true; // movement should follow rotation
  }

  // Main animation loop
  animate() {
    const now = performance.now();
    if (!this.state.lastTimestamp) this.state.lastTimestamp = now;
    const deltaTime = (now - this.state.lastTimestamp) / 1000;
    this.state.lastTimestamp = now;

    // Handle rotation
    if (this.state.rotate.targetAngle !== this.state.rotate.currentAngle) {
      const angleDiff =
        this.state.rotate.targetAngle - this.state.rotate.currentAngle;
      const rotationStep =
        Math.sign(angleDiff) * this.state.rotate.speed * deltaTime;
      if (Math.abs(angleDiff) <= Math.abs(rotationStep)) {
        this.state.rotate.currentAngle = this.state.rotate.targetAngle;
      } else {
        this.state.rotate.currentAngle += rotationStep;
      }
    }

    // Update movement direction based on rotation, if enabled
    if (this.state.move.followRotation) {
      const angleRad = (this.state.rotate.currentAngle * Math.PI) / 180;
      this.state.move.dx = Math.cos(angleRad);
      this.state.move.dy = Math.sin(angleRad);
    }

    // Update position
    const moveDistance = this.state.move.speed * deltaTime;
    const newX = this.state.position.x + this.state.move.dx * moveDistance;
    const newY = this.state.position.y + this.state.move.dy * moveDistance;

    if (!this.collisionHelper(this.element, newX, newY) || !this.collision) {
      this.state.position.x = newX;
      this.state.position.y = newY;
    }

    // Apply to DOM
    this.element.style.left = `${this.state.position.x}px`;
    this.element.style.top = `${this.state.position.y}px`;
    this.element.style.transform = `rotate(${this.state.rotate.currentAngle}deg)`;

    // Schedule next frame
    this.animationFrame = requestAnimationFrame(this.animate);
  }

  // Stop animation frame only
  stop() {
    cancelAnimationFrame(this.animationFrame);
    this.animationFrame = null;
  }

  // Stop all motion and reset state
  stopAll() {
    this.stop();
    this.state.move.speed = 0;
    this.state.move.dx = 0;
    this.state.move.dy = 0;
    this.state.move.followRotation = false;
    this.state.rotate.speed = 0;
    this.state.rotate.targetAngle = this.state.rotate.currentAngle;
  }
};

util.modElement = (elm) => {
  if (elm instanceof NodeList) {
    return Array.from(elm).map(util.modElement);
  }

  if (!(elm instanceof HTMLElement)) return elm;

  elm.css = (styles) => {
    for (let property in styles) {
      elm.style[property] = styles[property];
    }
    return elm;
  };

  elm.addClass = (classadd) => {
    if (Array.isArray(classadd)) {
      classadd.forEach((classadd1) => {
        elm.classList.add(classadd1);
      });
    } else {
      elm.classList.add(classadd);
    }
    return elm;
  };

  elm.detectCollision = (elementB, i) => {
    if (_(elementB, i ? i : null) == null)
      throw new TypeError("[UT2L]: detectCollision: elementB is null");
    const rectA = elm.getBoundingClientRect();
    const rectB = _(elementB, i ? i : null).getBoundingClientRect();

    return (
      rectA.left < rectB.right &&
      rectA.right > rectB.left &&
      rectA.top < rectB.bottom &&
      rectA.bottom > rectB.top
    );
  };

  elm.on = (listener, selectorOrCallback, callback, once = false) => {
    const handler = (event) => {
      if (once) elm.removeEventListener(listener, handler);
      if (typeof selectorOrCallback === "function") {
        selectorOrCallback(event);
      } else if (event.target.matches(selectorOrCallback)) {
        callback(event);
      }
    };
    elm.addEventListener(listener, handler);
    return elm;
  };

  elm.clickRedir = (href) => {
    elm.addEventListener("click", () => {
      location.href = href;
    });
    return elm;
  };

  elm.once = (event, handler) => {
    elm.addEventListener(event, handler, { once: true });
    return elm;
  };

  elm.appendTo = (target) => {
    _(target).appendChild(elm);
    return elm;
  };

  elm.prependTo = (target) => {
    _(target).prepend(elm);
    return elm;
  };

  elm.insertAfter = (target) => {
    const ref = _(target);
    ref.parentNode.insertBefore(elm, ref.nextSibling);
    return elm;
  };

  elm.slideDown = (duration = 300) => {
    elm.style.height = "0";
    elm.style.overflow = "hidden";
    elm.style.display = "block";
    let height = elm.scrollHeight + "px";
    setTimeout(() => {
      elm.style.transition = `height ${duration}ms`;
      elm.style.height = height;
    }, 1);
    setTimeout(() => (elm.style.height = ""), duration);
    return elm;
  };

  elm.slideUp = (duration = 300) => {
    elm.style.transition = `height ${duration}ms`;
    elm.style.height = elm.scrollHeight + "px";
    setTimeout(() => {
      elm.style.height = "0";
    }, 1);
    setTimeout(() => {
      elm.style.display = "none";
      elm.style.height = "";
    }, duration);
    return elm;
  };

  elm.hasClass = (cls) => elm.classList.contains(cls);
  elm.removeClass = (cls) => {
    elm.classList.remove(cls);
    return elm;
  };

  elm.hide = (onlyVisibility = false) => {
    if (onlyVisibility) {
      elm.style.visibility = "hidden";
      elm.util_previousDisplay = null;
    } else {
      elm.util_previousDisplay = elm.style.display;
      elm.style.display = "none";
    }
    return elm;
  };

  elm.show = () => {
    if (!elm.util_previousDisplay && elm.util_previousDisplay !== "")
      elm.style.visibility = "visible";
    else {
      elm.style.display = elm.util_previousDisplay;
    }
    return elm;
  };

  elm.parent = () => util.modElement(elm.parentElement);

  elm.children = () => Array.from(elm.children).map(util.modElement);

  elm.siblings = () => {
    return Array.from(elm.parentElement.children)
      .filter((child) => child !== elm)
      .map(util.modElement);
  };

  elm.find = (selector) => util.modElement(elm.querySelector(selector));

  elm.toggleClass = (className) => {
    elm.classList.toggle(className);
    return elm;
  };

  elm.fadeIn = (duration = 500) => {
    elm.style.opacity = 0;
    elm.style.display = elm.util_previousDisplay || "block";
    elm.style.transition = `opacity ${duration}ms`;
    requestAnimationFrame(() => (elm.style.opacity = 1));
    return elm;
  };

  elm.fadeOut = (duration = 500) => {
    elm.style.transition = `opacity ${duration}ms`;
    elm.style.opacity = 0;
    setTimeout(() => elm.hide(), duration);
    return elm;
  };

  elm.text = (newText) => {
    if (newText === undefined) return elm.textContent;
    elm.textContent = newText;
    return elm;
  };

  elm.html = (newHtml) => {
    if (newHtml === undefined) return elm.innerHTML;
    elm.innerHTML = newHtml;
    return elm;
  };

  elm.data = (key, value) => {
    if (value === undefined) return elm.getAttribute(`data-${key}`);
    elm.setAttribute(`data-${key}`, value);
    return elm;
  };

  elm.removeData = (key) => {
    elm.removeAttribute(`data-${key}`);
    return elm;
  };

  elm.serializeForm = () => {
    if (elm.tagName !== "FORM") return null;
    const formData = new FormData(elm);
    return Object.fromEntries(formData.entries());
  };

  elm.resetForm = () => {
    if (elm.tagName === "FORM") elm.reset();
    return elm;
  };

  elm.toggle = (onlyVisibility = false) => {
    if (
      getComputedStyle(elm).display === "none" ||
      elm.style.visibility === "hidden"
    ) {
      elm.show();
    } else {
      elm.hide(onlyVisibility);
    }
    return elm;
  };

  elm.remove = () => {
    elm.parentNode.removeChild(elm);
    return null;
  };

  elm.clone = (deep = true) => {
    return elm.cloneNode(deep);
  };

  elm.attr = (name, value) => {
    if (value === undefined) {
      return elm.getAttribute(name);
    } else {
      elm.setAttribute(name, value);
      return elm;
    }
  };

  elm.triggerEvent = (eventType) => {
    const event = new Event(eventType);
    elm.dispatchEvent(event);
    return elm;
  };

  return elm;
};

util.randInt = (min, max) => {
  if (!max) {
    max = min;
    min = 0;
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

util.randFloat = (min, max, decimalPlaces) => {
  if (!max) {
    max = min;
    min = 0;
  }
  if (decimalPlaces)
    return parseFloat(
      (Math.random() * (max - min + 1) + min).toFixed(decimalPlaces)
    );
  else return Math.random() * (max - min + 1) + min;
};

util.storage = {
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  get(key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch {
      return null;
    }
  },
  remove(key) {
    localStorage.removeItem(key);
  },
  clear() {
    localStorage.clear();
  },
};

util.all = (sel) =>
  Array.from(document.querySelectorAll(sel)).map(util.modElement);
util.first = (sel) => util.modElement(document.querySelector(sel));
util.last = (sel) => {
  const list = document.querySelectorAll(sel);
  return util.modElement(list[list.length - 1]);
};

util.ready = (fn) => {
  if (document.readyState !== "loading") fn();
  else document.addEventListener("DOMContentLoaded", fn);
};

util.randPick = (collection) => {
  if (Array.isArray(collection)) {
    return collection[util.randInt(collection.length - 1)];
  } else if (typeof collection === "object") {
    const keys = Object.keys(collection);
    return collection[keys[util.randInt(keys.length - 1)]];
  }
  return null;
};

util.keydown = {};

let util_mouseposx = 0;
let util_mouseposy = 0;

window.onmousemove = (e) => {
  util_mouseposx = e.clientX;
  util_mouseposy = e.clientY;
};

window.onkeydown = (e) => {
  util.keydown[e.key] = true;
};
window.onkeyup = (e) => {
  util.keydown[e.key] = false;
};

util.getMousePos = () => {
  return [util_mouseposx, util_mouseposy];
};

util.style = {
  setLightCSSReset: () => {
    let stylesheet = util
      .create("style")
      .setInnerHTML(
        "*{margin:0; padding:0; box-sizing:border-box;} html,body{width:100%;height:100vh;}"
      )
      .render();
    document.head.append(stylesheet);
  },

  setHardCSSReset: () => {
    let stylesheet = util
      .create("style")
      .setInnerHTML(
        "html, body, div, span, applet, object, iframe,h1, h2, h3, h4, h5, h6, p, blockquote, pre,a, abbr, acronym, address, big, cite, code,del, dfn, em, img, ins, kbd, q, s, samp,small, strike, strong, sub, sup, tt, var,b, u, i, center,dl, dt, dd, ol, ul, li,fieldset, form, label, legend,table, caption, tbody, tfoot, thead, tr, th, td,article, aside, canvas, details, embed, figure, figcaption, footer, header, hgroup, menu, nav, output, ruby, section, summary,time, mark, audio, video {margin: 0;padding: 0;border: 0;font-size: 100%;font: inherit;vertical-align: baseline;}article, aside, details, figcaption, figure, footer, header, hgroup, menu, nav, section {display: block;}body {line-height: 1;}ol, ul {	list-style: none;}blockquote, q {	quotes: none;}blockquote:before, blockquote:after,q:before, q:after {content: '';content: none;}table {border-collapse: collapse;border-spacing: 0;}"
      )
      .render();
    document.head.append(stylesheet);
  },
};

util.ui = util.ui || {};

util.ui.modal = ({
  title = "Modal Title",
  content = "",
  onConfirm,
  onCancel,
  confirmText = "OK",
  cancelText = "Cancel",
  dismissible = true,
  contentCSS = {},
  titleCSS = {},
} = {}) => {
  const overlay = util
    .create("div")
    .setClassList(["util-modal-overlay"])
    .render()
    .css({
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      "align-items": "center",
      "justify-content": "center",
      "z-index": 10000,
    });

  const modal = util.create("div").setClassList(["util-modal"]).render().css({
    background: "#fff",
    padding: "20px",
    "border-radius": "10px",
    "max-width": "90%",
    width: "400px",
    "box-shadow": "0 2px 10px rgba(0,0,0,0.3)",
  });

  const modalTitle = util
    .create("h2")
    .setInnerHTML(title)
    .render()
    .css({ margin: "0 0 10px" })
    .css(titleCSS);

  const modalContent = util.create("div").setInnerHTML(content).render();
  modalContent.css(contentCSS);

  const buttons = util.create("div").render().css({
    display: "flex",
    "justify-content": "flex-end",
    marginTop: "20px",
    gap: "10px",
  });

  const confirmBtn = util
    .create("button")
    .setInnerHTML(confirmText)
    .render()
    .css({
      padding: "8px 12px",
      background: "#28a745",
      color: "#fff",
      border: "none",
      "border-radius": "5px",
      cursor: "pointer",
    })
    .on("click", () => {
      overlay.remove();
      if (typeof onConfirm === "function") onConfirm();
    });

  const cancelBtn = util
    .create("button")
    .setInnerHTML(cancelText)
    .render()
    .css({
      padding: "8px 12px",
      background: "#ccc",
      color: "#000",
      border: "none",
      "border-radius": "5px",
      cursor: "pointer",
    })
    .on("click", () => {
      overlay.remove();
      if (typeof onCancel === "function") onCancel();
    });

  buttons.append(cancelBtn, confirmBtn);
  modal.append(modalTitle, modalContent, buttons);
  overlay.append(modal);
  document.body.appendChild(overlay);

  if (dismissible) {
    overlay.on("click", (e) => {
      if (e.target === overlay) {
        overlay.remove();
        if (typeof onCancel === "function") onCancel();
      }
    });

    document.addEventListener("keydown", function handler(e) {
      if (e.key === "Escape") {
        overlay.remove();
        document.removeEventListener("keydown", handler);
        if (typeof onCancel === "function") onCancel();
      }
    });
  }

  return overlay;
};

util.ui.toast = (() => {
  const containerId = "util-toast-container";

  const ensureContainer = () => {
    let container = document.getElementById(containerId);
    if (!container) {
      container = util.create("div").setId(containerId).render().css({
        position: "fixed",
        top: "20px",
        right: "20px",
        display: "flex",
        "flex-direction": "column",
        gap: "10px",
        "z-index": "10001",
      });
      document.body.appendChild(container);
    }
    return container;
  };

  return ({
    message = "",
    type = "info",
    duration = 3000,
    color = "#FFFFFF",
    textColor = "#fff",
  } = {}) => {
    const container = ensureContainer();

    const toast = util
      .create("div")
      .setInnerHTML(message)
      .setClassList(["util-toast", `util-toast-${type}`])
      .render()
      .css({
        padding: "10px 15px",
        color: textColor,
        "border-radius": "5px",
        "font-size": "14px",
        "box-shadow": "0 2px 6px rgba(0,0,0,0.2)",
        opacity: 0,
        transition: "opacity 0.3s",
      });

    const colors = {
      success: "#28a745",
      error: "#dc3545",
      warning: "#ffc107",
      info: "#17a2b8",
      custom: color,
    };

    toast.style.background = colors[type] || "#333";

    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = 1;
    });

    setTimeout(() => {
      toast.style.opacity = 0;
      setTimeout(() => toast.remove(), 300);
    }, duration);
  };
})();

util.config = {
  modal: {
    background: "#fff",
    textColor: "#333",
    padding: "20px",
    borderRadius: "8px",
    overlayBg: "rgba(0,0,0,0.5)",
    zIndex: 9999,
    buttonStyle: {
      background: "#007bff",
      color: "#fff",
      padding: "8px 12px",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
    },
  },
  toast: {
    duration: 3000,
    zIndex: 10001,
    types: {
      success: "#28a745",
      error: "#dc3545",
      warning: "#ffc107",
      info: "#17a2b8",
    },
    textColor: "#fff",
    fontSize: "14px",
    borderRadius: "5px",
  },
};

util.ui = util.ui || {};

util.ui.modal = ({
  title = "Modal Title",
  content = "",
  buttons = [], // Array of button objects: { text, onClick, css, defaultAction }
  onOutsideClick = null, // Default callback for clicking outside the modal
  closeOnOutsideClick = true, // Whether clicking outside should close the modal
  dismissible = true, // Whether the modal can be dismissed with Escape key
  titleCSS = {}, // Custom CSS for the title
  contentCSS = {}, // Custom CSS for the content
  modalCSS = {}, // Custom CSS for the modal
  overlayCSS = {}, // Custom CSS for the overlay
} = {}) => {
  const cfg = util.config.modal;

  const overlay = util
    .create("div")
    .setClassList(["util-modal-overlay"])
    .render()
    .css({
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: cfg.overlayBg,
      display: "flex",
      "align-items": "center",
      "justify-content": "center",
      "z-index": cfg.zIndex,
      ...overlayCSS,
    });

  const modal = util
    .create("div")
    .render()
    .css({
      background: cfg.background,
      color: cfg.textColor,
      padding: cfg.padding,
      "border-radius": cfg.borderRadius,
      width: "400px",
      "max-width": "90%",
      "box-shadow": "0 2px 10px rgba(0,0,0,0.3)",
      ...modalCSS,
    });

  const modalTitle = util
    .create("h2")
    .setInnerHTML(title)
    .render()
    .css({ marginBottom: "10px", ...titleCSS });

  const modalContent = util
    .create("div")
    .setInnerHTML(content)
    .render()
    .css(contentCSS);

  const buttonsContainer = util.create("div").render().css({
    display: "flex",
    "justify-content": "flex-end",
    gap: "10px",
    marginTop: "20px",
  });

  let defaultButton;

  // Add custom buttons
  buttons.forEach(
    ({ text = "", onClick = {}, css = {}, defaultAction = false }) => {
      const button = util
        .create("button")
        .setInnerHTML(text)
        .render()
        .css({
          ...cfg.buttonStyle,
          ...css,
        })
        .on("click", () => {
          if (onClick) onClick();
          overlay.remove();
        });
      buttonsContainer.append(button);
      if (defaultAction) defaultButton = onClick;
    }
  );

  modal.append(modalTitle, modalContent, buttonsContainer);
  overlay.append(modal);
  document.body.appendChild(overlay);

  if (closeOnOutsideClick || onOutsideClick) {
    overlay.on("click", (e) => {
      if (e.target === overlay) {
        if (onOutsideClick) onOutsideClick();
        if (closeOnOutsideClick) overlay.remove();

        if (defaultButton) defaultButton();
      }
    });
  }

  if (dismissible) {
    document.addEventListener("keydown", function handler(e) {
      if (e.key === "Escape") {
        overlay.remove();
        document.removeEventListener("keydown", handler);
      }
    });
  }

  return overlay;
};

util.ui.toast = (() => {
  const containerId = "util-toast-container";

  const ensureContainer = () => {
    let container = document.getElementById(containerId);
    if (!container) {
      container = util.create("div").setId(containerId).render().css({
        position: "fixed",
        top: "20px",
        right: "20px",
        display: "flex",
        "flex-direction": "column",
        gap: "10px",
        "z-index": util.config.toast.zIndex,
      });
      document.body.appendChild(container);
    }
    return container;
  };

  return ({ message = "", type = "info", duration } = {}) => {
    const cfg = util.config.toast;
    const container = ensureContainer();

    const toast = util
      .create("div")
      .setInnerHTML(message)
      .render()
      .css({
        padding: "10px 15px",
        color: cfg.textColor,
        background: cfg.types[type] || "#333",
        "border-radius": cfg.borderRadius,
        "font-size": cfg.fontSize,
        opacity: 0,
        transition: "opacity 0.3s",
      });

    container.appendChild(toast);
    requestAnimationFrame(() => (toast.style.opacity = 1));

    setTimeout(() => {
      toast.style.opacity = 0;
      setTimeout(() => toast.remove(), 300);
    }, duration || cfg.duration);
  };
})();

/**
 * @type {typeof util}
 */
const _ = new Proxy(util.bind(util), {
  get(target, prop) {
    return prop in target ? target[prop] : util[prop];
  },
});
