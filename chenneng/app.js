/* Product data is owned by products.js. The URL is the shareable catalogue state. */
(() => {
  "use strict";

  const products = window.CHENNENG_PRODUCTS || [];
  const topics = window.CHENNENG_TOPICS || [];
  const productById = new Map(products.map(product => [String(product.id), product]));
  const topicById = new Map(topics.map(topic => [topic.id, topic.label]));
  const $ = selector => document.querySelector(selector);
  const escape = value => String(value ?? "").replace(/[&<>"']/g, char =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const icon = name => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const normalize = value => String(value).normalize("NFKC").toLocaleLowerCase("zh-CN").trim();
  const searchIndex = new Map(products.map(product => [String(product.id), normalize([
    product.name, product.displayName, product.materials, product.approval, product.catName,
    ...product.funcs, ...product.topics.map(topic => topicById.get(topic))
  ].join(" "))]));
  const sessionKey = `chenneng-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const grid = $("#product-grid");
  const search = $("#product-search");
  const dialog = $("#product-dialog");
  const dialogContent = $("#dialog-content");
  let state = readLocation();
  let renderedFilters = "";
  let activeProduct = null;
  let returnFocusId = null;
  let savedScrollY = 0;
  let closing = false;

  function readLocation() {
    const params = new URL(window.location.href).searchParams;
    const type = params.get("type");
    const topic = params.get("topic");
    const product = params.get("product");
    return {
      type: ["food", "device"].includes(type) ? type : "all",
      topic: topicById.has(topic) ? topic : "all",
      q: (params.get("q") || "").slice(0, 120),
      product: productById.has(product) ? product : null
    };
  }

  function stateURL(nextState) {
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(nextState)) {
      if (value && value !== "all") url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    return url;
  }

  function writeLocation(push = false) {
    const marker = push ? sessionKey : (state.product ? history.state?.chennengModal : null);
    try {
      history[push ? "pushState" : "replaceState"](
        { ...history.state, chennengModal: marker }, "", stateURL(state)
      );
    } catch {
      // Directly opened local HTML can restrict history updates; browsing still works.
    }
  }

  function filteredProducts() {
    const words = normalize(state.q).split(/\s+/).filter(Boolean);
    return products.filter(product =>
      (state.type === "all" || product.cat === state.type) &&
      (state.topic === "all" || product.topics.includes(state.topic)) &&
      words.every(word => searchIndex.get(String(product.id)).includes(word))
    );
  }

  function renderCard(product) {
    return `<article class="product-card">
      <div class="product-media"><span class="product-index" aria-hidden="true">${escape(product.no)}</span><img src="${escape(product.image)}" alt="${escape(product.name)}产品展示" loading="lazy" decoding="async"></div>
      <div class="product-content">
        <div class="product-meta"><span class="category-label${product.cat === "device" ? " device" : ""}">${escape(product.catName)}</span><span class="product-theme">${escape(topicById.get(product.topics[0]))}</span></div>
        <h3><button type="button" class="product-name" data-product="${escape(product.id)}" aria-label="查看${escape(product.displayName)}详情">${escape(product.displayName)}</button></h3>
        <p class="product-summary">${escape(product.summary)}</p>
        <div class="product-bottom"><span class="product-spec">${escape(product.spec)}</span><span class="card-arrow" aria-hidden="true">${icon("arrow")}</span></div>
      </div>
    </article>`;
  }

  function renderCatalogue() {
    const signature = JSON.stringify([state.type, state.topic, state.q]);
    if (signature === renderedFilters) return;
    renderedFilters = signature;
    const matches = filteredProducts();
    grid.innerHTML = matches.map(renderCard).join("");
    grid.hidden = !matches.length;
    $("#empty-state").hidden = matches.length > 0;
    $("#result-count").innerHTML = `共 <strong>${matches.length}</strong> 款产品${matches.length === products.length ? "" : `，全系 ${products.length} 款`}`;
    $("#reset-filters").hidden = state.type === "all" && state.topic === "all" && !state.q;
    $("#clear-search").hidden = !state.q;
    if (search.value !== state.q) search.value = state.q;
    document.querySelectorAll("[data-type]").forEach(button =>
      button.setAttribute("aria-pressed", String(button.dataset.type === state.type)));
    document.querySelectorAll("[data-topic]").forEach(button =>
      button.setAttribute("aria-pressed", String(button.dataset.topic === state.topic)));
  }

  function updateFilters(patch) {
    state = { ...state, ...patch };
    writeLocation();
    renderCatalogue();
  }

  function resetFilters() {
    updateFilters({ type: "all", topic: "all", q: "" });
  }

  function fact(label, value) {
    return value ? `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>` : "";
  }

  function paragraph(label, value) {
    return value ? `<p><strong>${escape(label)}</strong><br>${escape(value)}</p>` : "";
  }

  function renderDetail(product) {
    const food = product.cat === "food";
    const ingredients = food && product.components.length
      ? `<table class="components"><caption>标志性成分及含量</caption><tbody>${product.components.map(component =>
        `<tr><th scope="row">${escape(component.name)}</th><td>${escape(component.val)} ${escape(component.unit)}</td></tr>`
      ).join("")}</tbody></table>` : "";
    // The source keeps editorial and verification fields; they are not customer copy.
    const caution = product.note.split("宣传仅")[0];
    dialogContent.innerHTML = `<div class="detail-layout">
      <div class="detail-media"><div class="detail-image"><img src="${escape(product.image)}" alt="${escape(product.name)}产品海报"></div><a class="text-link" href="${escape(product.image)}" target="_blank" rel="noopener">查看产品海报 <span aria-hidden="true">↗</span><span class="sr-only">（在新窗口打开）</span></a></div>
      <div class="detail-info">
        <p class="detail-type">${escape(product.catName)} · 产品 ${escape(product.no)}</p>
        <h2 id="detail-title">${escape(product.name)}</h2>
        <div class="detail-topics">${product.topics.map(topic => `<span>${escape(topicById.get(topic))}</span>`).join("")}</div>
        <div class="detail-summary"><span>${food ? "保健功能" : "适用范围"}</span><p>${escape(product.scope || product.summary)}</p></div>
        <dl class="detail-facts">${fact("产品规格", product.spec)}${fact(product.approvalLabel, product.approval)}${fact(food ? "食用方法" : "使用说明", product.usage)}${fact("适宜人群", product.suitable)}${fact("不适宜人群", product.unsuitable)}${fact("禁忌与提示", product.taboo)}</dl>
        <details class="detail-section" open><summary>${food ? "原料与成分" : "产品资料"}</summary><div class="detail-section-content">${paragraph(food ? "主要原料" : (product.id === 11 ? "作用方式" : "主要组成"), product.materials)}${ingredients}${paragraph("生产企业", product.maker)}${paragraph("贮藏方式", product.storage)}${paragraph("保质期", product.shelf)}</div></details>
        <div class="detail-caution"><strong>使用前请阅读</strong><p>${escape(caution)}</p></div>
        <button type="button" class="button detail-share" id="share-product">${icon("copy")}复制产品链接</button>
        <span class="dialog-toast" id="share-status" role="status" aria-live="polite"></span>
      </div>
    </div>`;
    $("#detail-number").textContent = product.no;
    $("#dialog-scroll").scrollTop = 0;
  }

  function showDetail(id) {
    const product = productById.get(id);
    if (!product) return;
    if (activeProduct !== id) renderDetail(product);
    activeProduct = id;
    if (!dialog.open) {
      savedScrollY = window.scrollY;
      document.body.style.top = `-${savedScrollY}px`;
      document.body.classList.add("dialog-open");
      dialog.showModal();
      $("#close-dialog").focus({ preventScroll: true });
    }
  }

  function hideDetail() {
    if (!dialog.open && !activeProduct) return;
    const focusId = returnFocusId || activeProduct;
    activeProduct = null;
    if (dialog.open) dialog.close();
    document.body.classList.remove("dialog-open");
    document.body.style.top = "";
    window.scrollTo({ top: savedScrollY, behavior: "instant" });
    const button = grid.querySelector(`[data-product="${focusId}"]`);
    (button || search).focus({ preventScroll: true });
    returnFocusId = null;
    closing = false;
  }

  function openProduct(id) {
    if (!productById.has(id)) return;
    returnFocusId = id;
    state = { ...state, product: id };
    writeLocation(true);
    showDetail(id);
  }

  function closeProduct() {
    if (closing || !activeProduct) return;
    closing = true;
    if (history.state?.chennengModal === sessionKey) {
      history.back();
    } else {
      state = { ...state, product: null };
      writeLocation();
      hideDetail();
    }
  }

  async function copyProductLink() {
    const id = activeProduct;
    const pageURL = window.location.protocol === "file:"
      ? $('link[rel="canonical"]').href
      : window.location.href;
    const link = new URL(pageURL);
    link.search = "";
    link.hash = "";
    link.searchParams.set("product", id);
    let copied = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link.href);
        copied = true;
      }
    } catch {
      // Older browsers and denied clipboard permission use the selected-text fallback.
    }
    if (!copied && dialog.open && activeProduct === id) {
      const input = document.createElement("textarea");
      input.value = link.href;
      input.setAttribute("aria-label", "产品链接");
      input.style.cssText = "position:fixed;left:0;top:0;width:1px;height:1px;opacity:0";
      dialog.append(input);
      input.focus();
      input.select();
      try { copied = document.execCommand("copy"); } catch { /* Report a usable link below. */ }
      input.remove();
      $("#share-product").focus({ preventScroll: true });
    }
    if (!dialog.open || activeProduct !== id) return;
    const status = $("#share-status");
    if (copied) {
      status.textContent = "产品链接已复制，可发送给需要的人。";
    } else {
      status.innerHTML = `请长按或右键复制：<a href="${escape(link.href)}">${escape(link.href)}</a>`;
    }
  }

  function updateDock() {
    if (dialog.open) return;
    const guideTop = $("#guide").getBoundingClientRect().top;
    const productsTop = $("#products").getBoundingClientRect().top;
    const current = guideTop <= 150 ? "guide" : productsTop <= 150 ? "products" : "home";
    document.querySelectorAll("[data-dock]").forEach(link => {
      if (link.dataset.dock === current) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }

  // Counts and filters are derived from the same data used to render the catalogue.
  $("#topic-filter").innerHTML = [{ id: "all", label: "全部主题" }, ...topics].map(topic =>
    `<button type="button" data-topic="${escape(topic.id)}" aria-pressed="false">${escape(topic.label)}</button>`
  ).join("");
  const counts = { all: products.length, food: products.filter(p => p.cat === "food").length, device: products.filter(p => p.cat === "device").length };
  for (const [selector, value] of Object.entries({
    "[data-total-count]": counts.all, "[data-topic-count]": topics.length,
    "[data-food-count]": counts.food, "[data-device-count]": counts.device
  })) document.querySelectorAll(selector).forEach(node => { node.textContent = value; });
  document.querySelectorAll("[data-type-count]").forEach(node => { node.textContent = counts[node.dataset.typeCount]; });

  $(".type-filter").addEventListener("click", event => {
    const button = event.target.closest("[data-type]");
    if (button) updateFilters({ type: button.dataset.type });
  });
  $("#topic-filter").addEventListener("click", event => {
    const button = event.target.closest("[data-topic]");
    if (button) updateFilters({ topic: button.dataset.topic });
  });
  search.addEventListener("input", event => {
    if (!event.isComposing) updateFilters({ q: search.value });
  });
  search.addEventListener("compositionend", () => updateFilters({ q: search.value }));
  $("#clear-search").addEventListener("click", () => {
    updateFilters({ q: "" });
    search.focus();
  });
  $("#reset-filters").addEventListener("click", () => { resetFilters(); search.focus(); });
  $("#empty-reset").addEventListener("click", () => { resetFilters(); search.focus(); });
  document.querySelectorAll("[data-guide-type]").forEach(link => link.addEventListener("click", resetFilters));
  grid.addEventListener("click", event => {
    const button = event.target.closest("[data-product]");
    if (button) openProduct(button.dataset.product);
  });
  $("#close-dialog").addEventListener("click", closeProduct);
  dialog.addEventListener("cancel", event => { event.preventDefault(); closeProduct(); });
  dialog.addEventListener("click", event => {
    if (event.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeProduct();
    }
    if (event.target.closest("#share-product")) copyProductLink();
  });
  window.addEventListener("popstate", () => {
    state = readLocation();
    closing = false;
    renderCatalogue();
    if (state.product) showDetail(state.product);
    else hideDetail();
  });
  let scrollPending = false;
  window.addEventListener("scroll", () => {
    if (scrollPending) return;
    scrollPending = true;
    requestAnimationFrame(() => { updateDock(); scrollPending = false; });
  }, { passive: true });

  writeLocation();
  renderCatalogue();
  updateDock();
  if (state.product) showDetail(state.product);
})();
