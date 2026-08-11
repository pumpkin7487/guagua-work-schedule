"use client";

import { useEffect, useState, type FormEvent } from "react";

type OfficeStatus = "office" | "away" | "unset";

type DayPlan = {
  office: OfficeStatus;
  work: string;
  city: string;
};

type Plans = Record<string, DayPlan>;

const START_DATE = "2026-08-12";
const API_BASE = import.meta.env.VITE_API_BASE ?? "";
const MONTHS = Array.from({ length: 13 }, (_, index) => {
  const monthIndex = 7 + index;
  const year = 2026 + Math.floor(monthIndex / 12);
  const month = monthIndex % 12;
  return {
    year,
    month,
    key: `${year}-${String(month + 1).padStart(2, "0")}`,
    label: `${year}/${month + 1}`,
  };
});
const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];
const CITIES = [
  "臺北市", "新北市", "桃園市", "臺中市", "臺南市", "高雄市",
  "基隆市", "新竹市", "嘉義市", "新竹縣", "苗栗縣", "彰化縣",
  "南投縣", "雲林縣", "嘉義縣", "屏東縣", "宜蘭縣", "花蓮縣",
  "臺東縣", "澎湖縣", "金門縣", "連江縣", "其他／海外",
];

const emptyPlan = (): DayPlan => ({ office: "unset", work: "", city: "" });

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function displayDate(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return `${year} 年 ${month} 月 ${day} 日（週${WEEKDAYS[date.getDay()]}）`;
}

function monthDays(year: number, month: number) {
  const count = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: count }, (_, index) => index + 1);
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export default function Home() {
  const [plans, setPlans] = useState<Plans>({});
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [draft, setDraft] = useState<DayPlan>(emptyPlan());
  const [activeMonth, setActiveMonth] = useState<string | "all">("all");
  const [filter, setFilter] = useState<OfficeStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [savedPulse, setSavedPulse] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [passwordDraft, setPasswordDraft] = useState("");
  const [editorPassword, setEditorPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const isEditor = Boolean(editorPassword);

  useEffect(() => {
    let active = true;
    const loadPlans = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/plans`, { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json() as { plans?: Plans };
        if (active && data.plans) setPlans(data.plans);
      } finally {
        if (active) setLoadingPlans(false);
      }
    };
    void loadPlans();
    const timer = window.setInterval(loadPlans, 5000);
    window.addEventListener("focus", loadPlans);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", loadPlans);
    };
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedDate(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedDate]);

  const months = activeMonth === "all"
    ? MONTHS
    : MONTHS.filter((month) => month.key === activeMonth);

  function openEditor(key: string) {
    if (!isEditor) {
      setLoginOpen(true);
      return;
    }
    setSelectedDate(key);
    setDraft(plans[key] ? { ...plans[key] } : emptyPlan());
  }

  async function unlockEditor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError("");
    try {
      const response = await fetch(`${API_BASE}/api/editor`, {
        method: "POST",
        headers: { "x-editor-password": passwordDraft },
      });
      if (!response.ok) {
        setAuthError("密碼不正確，請再試一次");
        return;
      }
      setEditorPassword(passwordDraft);
      setPasswordDraft("");
      setLoginOpen(false);
    } catch {
      setAuthError("目前無法驗證，請稍後再試");
    }
  }

  async function persistPlan(plan: DayPlan) {
    if (!selectedDate || !editorPassword) return;
    setIsSaving(true);
    setSaveError("");
    try {
      const response = await fetch(`${API_BASE}/api/plans`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-editor-password": editorPassword,
        },
        body: JSON.stringify({ date: selectedDate, ...plan }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) {
        if (response.status === 401) setEditorPassword("");
        setSaveError(data.error ?? "無法儲存，請稍後再試");
        return;
      }
      const shouldKeep = plan.office !== "unset" || plan.work.trim() || plan.city.trim();
      setPlans((current) => {
        const next = { ...current };
        if (shouldKeep) next[selectedDate] = { ...plan, city: plan.city.trim(), work: plan.work.trim() };
        else delete next[selectedDate];
        return next;
      });
      setSelectedDate(null);
      setSavedPulse(true);
      window.setTimeout(() => setSavedPulse(false), 1800);
    } catch {
      setSaveError("網路連線失敗，行程尚未儲存");
    } finally {
      setIsSaving(false);
    }
  }

  function savePlan() {
    void persistPlan(draft);
  }

  function clearPlan() {
    void persistPlan(emptyPlan());
  }

  function exportCsv() {
    const rows = Object.entries(plans)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, plan]) => [
        key,
        plan.office === "office" ? "到公司" : plan.office === "away" ? "不在公司" : "未設定",
        plan.city,
        plan.work,
      ]);
    const header = ["日期", "是否前往公司", "縣市", "工作內容"];
    const csv = `\uFEFF${[header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "瓜瓜的工作行程_2026-2027.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function isVisible(plan: DayPlan | undefined) {
    const current = plan ?? emptyPlan();
    const matchesFilter = filter === "all" || current.office === filter;
    const haystack = `${current.work} ${current.city}`.toLowerCase();
    return matchesFilter && (!query.trim() || haystack.includes(query.trim().toLowerCase()));
  }

  return (
    <main>
      <header className="hero">
        <div className="hero-inner">
          <div className="eyebrow"><span className="eyebrow-dot" /> ACETEK · WORK SCHEDULE</div>
          <div className="title-row">
            <div>
              <h1>瓜瓜的工作行程</h1>
              <p>2026 年 8 月 12 日 — 2027 年 8 月 31 日</p>
            </div>
            <div className="title-actions">
              <button className="export-button" type="button" onClick={exportCsv}>
                <span aria-hidden="true">↓</span> 匯出 CSV
              </button>
              <div className="editor-access">
                <button className={isEditor ? "editor-button active" : "editor-button"} type="button" onClick={() => {
                  if (isEditor) setEditorPassword("");
                  else setLoginOpen((current) => !current);
                  setAuthError("");
                }}>
                  <span aria-hidden="true">{isEditor ? "●" : "⌑"}</span> {isEditor ? "編輯模式 · 點此鎖定" : "編輯行程"}
                </button>
                {loginOpen && !isEditor && (
                  <form className="password-panel" onSubmit={unlockEditor}>
                    <label htmlFor="editor-password">編輯密碼</label>
                    <input id="editor-password" type="password" value={passwordDraft} onChange={(event) => setPasswordDraft(event.target.value)} autoFocus autoComplete="current-password" placeholder="輸入密碼" />
                    {authError && <span className="form-error">{authError}</span>}
                    <button type="submit">解鎖編輯</button>
                  </form>
                )}
              </div>
            </div>
          </div>

          <section className="support-list" aria-label="工作支援方式">
            <div><span>01</span><strong>線上隨時支援</strong></div>
            <div><span>02</span><strong>在台北的日期，可機動安排實體工作</strong></div>
            <div><span>03</span><strong>透過 WeChat 預先交代、交辦</strong></div>
            <div className="save-status" aria-live="polite">
              <span className={savedPulse ? "save-dot pulse" : "save-dot"} />
              {loadingPlans ? "正在讀取共用行程" : savedPulse ? "已儲存並同步發布" : "共用行程每 5 秒自動更新"}
            </div>
          </section>
        </div>
      </header>

      <section className="toolbar-wrap">
        <div className="toolbar">
          <nav className="month-tabs" aria-label="選擇月份">
            <button className={activeMonth === "all" ? "active" : ""} onClick={() => setActiveMonth("all")}>全部</button>
            {MONTHS.map((month) => (
              <button key={month.key} className={activeMonth === month.key ? "active" : ""} onClick={() => setActiveMonth(month.key)}>{month.label}</button>
            ))}
          </nav>
          <div className="toolbar-actions">
            <label className="search">
              <span aria-hidden="true">⌕</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜尋工作或縣市" aria-label="搜尋工作或縣市" />
            </label>
            <select value={filter} onChange={(event) => setFilter(event.target.value as OfficeStatus | "all")} aria-label="篩選到公司狀態">
              <option value="all">全部狀態</option>
              <option value="office">到公司</option>
              <option value="away">不在公司</option>
              <option value="unset">未設定</option>
            </select>
          </div>
        </div>
      </section>

      <section className="calendar-section">
        <div className="legend" aria-label="顏色圖例">
          <span><i className="legend-office" /> 到公司</span>
          <span><i className="legend-away" /> 不在公司</span>
          <span><i className="legend-unset" /> 未設定</span>
          <small>{isEditor ? "編輯模式：點選日期即可修改" : "公開瀏覽模式：輸入密碼後可編輯"}</small>
        </div>

        <div className={activeMonth === "all" ? "months-grid" : "months-grid single"}>
          {months.map((month) => {
            const firstWeekday = new Date(month.year, month.month, 1).getDay();
            return (
              <article className="month-card" key={month.key}>
                <div className="month-heading">
                  <div><span>{month.year} · {String(month.month + 1).padStart(2, "0")}</span><h2>{month.month + 1} 月</h2></div>
                  <p>{month.key === "2026-08" ? "12 日起" : `${monthDays(month.year, month.month).length} 天`}</p>
                </div>
                <div className="weekday-row">
                  {WEEKDAYS.map((weekday) => <span key={weekday}>{weekday}</span>)}
                </div>
                <div className="days-grid">
                  {Array.from({ length: firstWeekday }, (_, index) => <span className="day-spacer" key={`spacer-${index}`} />)}
                  {monthDays(month.year, month.month).map((day) => {
                    const key = dateKey(month.year, month.month, day);
                    const disabled = key < START_DATE;
                    const plan = plans[key];
                    const visible = isVisible(plan);
                    const status = plan?.office ?? "unset";
                    return disabled ? (
                      <span className="day-cell disabled" key={key}><span className="day-number">{day}</span></span>
                    ) : (
                      <button
                        type="button"
                        key={key}
                        className={`day-cell ${status} ${visible ? "" : "dimmed"} ${isEditor ? "" : "locked"}`}
                        onClick={() => openEditor(key)}
                        aria-label={`${isEditor ? "編輯" : "查看"} ${displayDate(key)}，${status === "office" ? "到公司" : status === "away" ? "不在公司" : "未設定"}`}
                      >
                        <span className="day-top">
                          <span className="day-number">{day}</span>
                          {status !== "unset" && <span className="status-mark" aria-hidden="true">{status === "office" ? "✓" : "—"}</span>}
                        </span>
                        {plan?.city && <span className="day-city">{plan.city}</span>}
                        {plan?.work && <span className="day-work">{plan.work}</span>}
                        {!plan && <span className="add-hint">{isEditor ? "＋ 填寫縣市／工作" : "尚未安排"}</span>}
                      </button>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {selectedDate && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedDate(null);
        }}>
          <section className="editor-modal" role="dialog" aria-modal="true" aria-labelledby="editor-title">
            <button className="close-button" type="button" onClick={() => setSelectedDate(null)} aria-label="關閉編輯視窗">×</button>
            <div className="modal-date-badge">{selectedDate.slice(5, 7)} / {selectedDate.slice(8, 10)}</div>
            <div className="modal-heading">
              <span>填寫這一格</span>
              <h2 id="editor-title">{displayDate(selectedDate)}</h2>
            </div>

            <fieldset className="form-group">
              <legend>是否前往公司？</legend>
              <div className="status-options">
                <button type="button" className={draft.office === "office" ? "selected office-choice" : "office-choice"} onClick={() => setDraft({ ...draft, office: "office" })}>
                  <span>✓</span><strong>到公司</strong>
                </button>
                <button type="button" className={draft.office === "away" ? "selected away-choice" : "away-choice"} onClick={() => setDraft({ ...draft, office: "away" })}>
                  <span>—</span><strong>不在公司</strong>
                </button>
                <button type="button" className={draft.office === "unset" ? "selected unset-choice" : "unset-choice"} onClick={() => setDraft({ ...draft, office: "unset" })}>
                  <span>?</span><strong>尚未確定</strong>
                </button>
              </div>
            </fieldset>

            <div className="form-group">
              <label htmlFor="city">縣市</label>
              <input id="city" list="city-options" value={draft.city} maxLength={12} onChange={(event) => setDraft({ ...draft, city: event.target.value })} placeholder="例如：臺北市" />
              <datalist id="city-options">
                {CITIES.map((city) => <option key={city} value={city} />)}
              </datalist>
            </div>

            <div className="form-group">
              <label htmlFor="work">簡要工作內容</label>
              <input id="work" value={draft.work} maxLength={60} onChange={(event) => setDraft({ ...draft, work: event.target.value })} placeholder="例如：師大附中研習／公司會議" />
            </div>

            <div className="modal-actions">
              <button className="clear-button" type="button" onClick={clearPlan} disabled={isSaving}>清除當日</button>
              <div>
                <button className="cancel-button" type="button" onClick={() => setSelectedDate(null)}>取消</button>
                <button className="save-button" type="button" onClick={savePlan} disabled={isSaving}>{isSaving ? "正在發布…" : "儲存並發布"}</button>
              </div>
            </div>
            {saveError && <p className="save-error" role="alert">{saveError}</p>}
          </section>
        </div>
      )}
    </main>
  );
}
