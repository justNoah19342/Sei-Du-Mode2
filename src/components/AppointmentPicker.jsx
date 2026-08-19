import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarBlank, CaretLeft, CaretRight } from "@phosphor-icons/react";
import styles from "./AppointmentPicker.module.css";

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(a, b) {
  return Boolean(a) && Boolean(b) && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function buildMonthGrid(viewMonth) {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // getDay(): 0=Sun..6=Sat — shift to a Monday-first index (0=Mon..6=Sun).
  const leadingBlanks = (new Date(year, month, 1).getDay() + 6) % 7;

  const cells = Array.from({ length: leadingBlanks }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }
  return cells;
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatDate(date) {
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

export function formatAppointmentLine({ date, start, end }) {
  return `Wunschtermin: ${formatDate(date)}, ${start}–${end} Uhr`;
}

function defaultDraft(value) {
  return {
    date: value?.date ?? startOfDay(new Date()),
    start: value?.start ?? "10:00",
    end: value?.end ?? "11:00",
  };
}

export default function AppointmentPicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(() => defaultDraft(value));
  const [viewMonth, setViewMonth] = useState(() => {
    const base = defaultDraft(value).date;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);

    // Locks background scroll while the calendar overlay is open — same
    // mechanism as CategoryCoverflow's enlarged-card overlay. Reuses that
    // same "product-overlay-open" body class (hides chrome, and — via
    // global.css — blurs #root as a backdrop-filter-independent fallback)
    // so the blurred page behind can't be scrolled or clicked through.
    document.body.style.overflow = "hidden";
    document.body.classList.add("product-overlay-open");

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      document.body.classList.remove("product-overlay-open");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, draft]);

  const openPicker = () => {
    const next = defaultDraft(value);
    setDraft(next);
    setViewMonth(new Date(next.date.getFullYear(), next.date.getMonth(), 1));
    setIsOpen(true);
  };

  const handleCheckboxChange = (e) => {
    if (e.target.checked) {
      openPicker();
    } else {
      onChange(null);
      setIsOpen(false);
    }
  };

  const handleClose = () => {
    onChange(draft);
    setIsOpen(false);
  };

  const changeMonth = (delta) => {
    setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  };

  const today = startOfDay(new Date());
  const cells = buildMonthGrid(viewMonth);

  return (
    <div className={styles.field}>
      <label className={styles.checkboxRow}>
        <input type="checkbox" checked={isOpen || Boolean(value)} onChange={handleCheckboxChange} />
        <CalendarBlank size={18} weight="bold" />
        <span>Bestimmten Termin vorschlagen</span>
      </label>

      {value && !isOpen && (
        <button type="button" className={styles.summary} onClick={openPicker}>
          {formatDate(value.date)}, {value.start}–{value.end} Uhr · Ändern
        </button>
      )}

      {isOpen &&
        createPortal(
          <div className={styles.overlay} onClick={handleClose}>
            <div className={styles.overlayCard} onClick={(e) => e.stopPropagation()}>
              <div className={styles.calendarHeader}>
                <button type="button" className={styles.navBtn} onClick={() => changeMonth(-1)} aria-label="Vorheriger Monat">
                  <CaretLeft size={16} weight="bold" />
                </button>
                <span>{viewMonth.toLocaleDateString("de-DE", { month: "long", year: "numeric" })}</span>
                <button type="button" className={styles.navBtn} onClick={() => changeMonth(1)} aria-label="Nächster Monat">
                  <CaretRight size={16} weight="bold" />
                </button>
              </div>

              <div className={styles.weekdays}>
                {WEEKDAYS.map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>

              <div className={styles.days}>
                {cells.map((day, i) => {
                  if (!day) return <span key={`blank-${i}`} />;
                  const isPast = day < today;
                  const isSelected = isSameDay(day, draft.date);
                  const isToday = isSameDay(day, today);
                  const dayClass = [
                    styles.day,
                    isSelected ? styles.daySelected : "",
                    !isSelected && isToday ? styles.dayToday : "",
                    isPast ? styles.dayDisabled : "",
                  ]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      className={dayClass}
                      disabled={isPast}
                      onClick={() => setDraft((d) => ({ ...d, date: day }))}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>

              <div className={styles.times}>
                <label className={styles.timeField}>
                  <span>Start</span>
                  <input
                    type="time"
                    value={draft.start}
                    onChange={(e) => setDraft((d) => ({ ...d, start: e.target.value }))}
                  />
                </label>
                <label className={styles.timeField}>
                  <span>Ende</span>
                  <input
                    type="time"
                    value={draft.end}
                    onChange={(e) => setDraft((d) => ({ ...d, end: e.target.value }))}
                  />
                </label>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
