(function () {
  const archive = window.AI_WEEK_ARCHIVE || { weeks: [] };

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getLatestWeek() {
    return archive.weeks[0] || null;
  }

  function getAllEvents() {
    return archive.weeks.flatMap((week) =>
      week.events.map((event) => ({
        ...event,
        weekId: week.id,
        weekRange: week.range,
        weekTitle: week.title
      }))
    );
  }

  function sortEvents(events) {
    return [...events].sort((a, b) => {
      const byDate = b.date.localeCompare(a.date);
      if (byDate !== 0) return byDate;
      return (a.priority || 99) - (b.priority || 99);
    });
  }

  function renderEvent(event, options = {}) {
    const meta = [event.org, event.category].filter(Boolean);
    const date = options.showWeek
      ? `${event.displayDate}<br>${escapeHtml(event.weekRange)}`
      : `${event.displayDate}<br>${event.weekday}`;
    const sourceName = event.sourceName || "Source";

    return `
      <article class="ai-event">
        <div class="ai-event-date">${date}</div>
        <div class="ai-event-card">
          <div class="ai-event-meta">
            ${meta.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
          </div>
          <h3 class="ai-event-headline">${escapeHtml(event.headline)}</h3>
          <p class="ai-event-body">${escapeHtml(event.body)}</p>
          ${event.tags && event.tags.length ? `
            <div class="ai-event-tags">
              ${event.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
            </div>
          ` : ""}
          <a class="ai-event-link" href="${escapeHtml(event.sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(sourceName)} →</a>
        </div>
      </article>
    `;
  }

  function renderTimeline(container, events, options = {}) {
    container.innerHTML = events.length
      ? events.map((event) => renderEvent(event, options)).join("")
      : `<div class="ai-week-empty">没有找到匹配的 AI 大事。</div>`;
  }

  function renderLatestHome() {
    const week = getLatestWeek();
    const timeline = document.querySelector("[data-ai-week-timeline]");
    if (!week || !timeline) return;

    const range = document.querySelector("[data-ai-week-range]");
    const note = document.querySelector("[data-ai-week-note]");
    const archiveLink = document.querySelector("[data-ai-week-archive-link]");

    if (range) range.textContent = week.range;
    if (note) note.textContent = week.summary;
    if (archiveLink) archiveLink.href = `ai-week/?week=${encodeURIComponent(week.id)}`;
    renderTimeline(timeline, week.events);
  }

  function uniqueValues(events, key) {
    return [...new Set(events.map((event) => event[key]).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }

  function uniqueTags(events) {
    return [...new Set(events.flatMap((event) => event.tags || []))].sort((a, b) => a.localeCompare(b));
  }

  function fillSelect(select, values, label) {
    if (!select) return;
    select.innerHTML = `<option value="">${label}</option>` +
      values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
  }

  function matchesQuery(event, query) {
    if (!query) return true;
    const haystack = [
      event.headline,
      event.body,
      event.org,
      event.category,
      event.sourceName,
      event.weekRange,
      event.weekTitle,
      ...(event.tags || [])
    ].join(" ").toLowerCase();
    return query.toLowerCase().trim().split(/\s+/).every((token) => haystack.includes(token));
  }

  function filterEvents(events, filters) {
    return events.filter((event) => {
      if (filters.week && event.weekId !== filters.week) return false;
      if (filters.org && event.org !== filters.org) return false;
      if (filters.category && event.category !== filters.category) return false;
      if (filters.tag && !(event.tags || []).includes(filters.tag)) return false;
      if (!matchesQuery(event, filters.q)) return false;
      return true;
    });
  }

  function syncQueryString(filters) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const query = params.toString();
    const nextUrl = query ? `${location.pathname}?${query}` : location.pathname;
    history.replaceState(null, "", nextUrl);
  }

  function readFilters(form) {
    return {
      q: form.querySelector("[name='q']")?.value.trim() || "",
      week: form.querySelector("[name='week']")?.value || "",
      org: form.querySelector("[name='org']")?.value || "",
      category: form.querySelector("[name='category']")?.value || "",
      tag: form.querySelector("[name='tag']")?.value || ""
    };
  }

  function applyFilters(form, events, resultTarget, countTarget) {
    const filters = readFilters(form);
    const filtered = sortEvents(filterEvents(events, filters));
    renderTimeline(resultTarget, filtered, { showWeek: true });
    if (countTarget) countTarget.textContent = `${filtered.length} events`;
    syncQueryString(filters);
  }

  function renderArchivePage() {
    const form = document.querySelector("[data-ai-week-filters]");
    const resultTarget = document.querySelector("[data-ai-week-results]");
    if (!form || !resultTarget) return;

    const events = getAllEvents();
    const countTarget = document.querySelector("[data-ai-week-count]");
    const updatedTarget = document.querySelector("[data-ai-week-updated]");
    const latest = getLatestWeek();

    fillSelect(form.querySelector("[name='week']"), archive.weeks.map((week) => week.id), "All weeks");
    const weekSelect = form.querySelector("[name='week']");
    if (weekSelect) {
      weekSelect.innerHTML = `<option value="">All weeks</option>` +
        archive.weeks.map((week) => `<option value="${escapeHtml(week.id)}">${escapeHtml(week.range)}</option>`).join("");
    }
    fillSelect(form.querySelector("[name='org']"), uniqueValues(events, "org"), "All organizations");
    fillSelect(form.querySelector("[name='category']"), uniqueValues(events, "category"), "All categories");
    fillSelect(form.querySelector("[name='tag']"), uniqueTags(events), "All tags");

    if (updatedTarget) updatedTarget.textContent = archive.updatedAt || "";

    const params = new URLSearchParams(location.search);
    const initial = {
      q: params.get("q") || "",
      week: params.get("week") || latest?.id || "",
      org: params.get("org") || "",
      category: params.get("category") || "",
      tag: params.get("tag") || ""
    };

    Object.entries(initial).forEach(([key, value]) => {
      const input = form.querySelector(`[name='${key}']`);
      if (input) input.value = value;
    });

    applyFilters(form, events, resultTarget, countTarget);

    form.addEventListener("input", () => applyFilters(form, events, resultTarget, countTarget));
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      applyFilters(form, events, resultTarget, countTarget);
    });

    const resetButton = form.querySelector("[data-ai-week-reset]");
    if (resetButton) {
      resetButton.addEventListener("click", () => {
        form.reset();
        const weekInput = form.querySelector("[name='week']");
        if (weekInput && latest) weekInput.value = latest.id;
        applyFilters(form, events, resultTarget, countTarget);
      });
    }
  }

  function init() {
    renderLatestHome();
    renderArchivePage();
  }

  window.AIWeek = {
    getAllEvents,
    getLatestWeek,
    renderLatestHome,
    renderArchivePage
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
