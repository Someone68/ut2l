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

util.VERSION = "0.1.0 BETA";

util.PVER = () => {
  console.log(
    `%cUT2L ${util.VERSION}` + "%c\nLicense: None. Copy as you wish.",
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
      for (property in this.attr) {
        a.setAttribute(property, this.attr[property]);
      }

      return util.modElement(a);
    },
  };
};

util.modElement = (elm) => {
  if (elm instanceof NodeList) {
    return Array.from(elm).map(util.modElement);
  }

  if (!(elm instanceof HTMLElement)) return elm;

  elm.css = (styles) => {
    for (property in styles) {
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

/**
 * @type {typeof util}
 */
const _ = new Proxy(util.bind(util), {
  get(target, prop) {
    return prop in target ? target[prop] : util[prop];
  },
});
