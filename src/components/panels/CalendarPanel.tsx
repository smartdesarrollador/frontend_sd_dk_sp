import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  Plus,
  X,
  Pencil,
  Trash2,
  Check,
  ChevronRight,
  ChevronDown,
  MapPin,
  Clock,
  AlignLeft,
  Repeat,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://rbac.local.test";

interface CalendarEvent {
  id: string;
  title: string;
  start_datetime: string;
  end_datetime: string;
  is_all_day: boolean;
  description: string;
  location: string;
  color: string;
  rrule: string;
  created_at: string;
  updated_at: string;
}

type EventGroup = "today" | "tomorrow" | "thisWeek" | "nextWeek" | "later";

const GROUP_LABELS: Record<EventGroup, string> = {
  today: "Hoy",
  tomorrow: "Mañana",
  thisWeek: "Esta semana",
  nextWeek: "Próxima semana",
  later: "Más adelante",
};

const GROUP_ORDER: EventGroup[] = ["today", "tomorrow", "thisWeek", "nextWeek", "later"];

const EVENT_COLORS = [
  { value: "blue",   cls: "bg-blue-500" },
  { value: "green",  cls: "bg-green-500" },
  { value: "red",    cls: "bg-red-500" },
  { value: "yellow", cls: "bg-yellow-400" },
  { value: "purple", cls: "bg-purple-500" },
  { value: "pink",   cls: "bg-pink-500" },
  { value: "indigo", cls: "bg-indigo-500" },
  { value: "gray",   cls: "bg-gray-500" },
];

function colorCls(color: string): string {
  return EVENT_COLORS.find((c) => c.value === color)?.cls ?? "bg-blue-500";
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function getEventGroup(dateStr: string): EventGroup {
  const eventDay = startOfDay(new Date(dateStr));
  const today = startOfDay(new Date());
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

  // End of current week (Sunday)
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (7 - today.getDay()));

  // End of next week
  const endOfNextWeek = new Date(endOfWeek);
  endOfNextWeek.setDate(endOfWeek.getDate() + 7);

  const diff = eventDay.getTime() - today.getTime();
  if (diff < 0) return "today"; // past events treated as today
  if (eventDay.getTime() === today.getTime()) return "today";
  if (eventDay.getTime() === tomorrow.getTime()) return "tomorrow";
  if (eventDay <= endOfWeek) return "thisWeek";
  if (eventDay <= endOfNextWeek) return "nextWeek";
  return "later";
}

function formatTime(event: CalendarEvent): string {
  if (event.is_all_day) return "Todo el día";
  const d = new Date(event.start_datetime);
  return d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatRange(event: CalendarEvent): string {
  if (event.is_all_day) return "Todo el día";
  const start = new Date(event.start_datetime);
  const end = new Date(event.end_datetime);
  const fmt = (d: Date) =>
    d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${fmt(start)} – ${fmt(end)}`;
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es", { weekday: "short", day: "numeric", month: "short" });
}

// Convert ISO to datetime-local value (YYYY-MM-DDTHH:MM)
function toDatetimeLocal(iso: string): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}

// Convert ISO to date value (YYYY-MM-DD)
function toDateInput(iso: string): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

// ── Form ──────────────────────────────────────────────────────────────────────

interface FormState {
  title: string;
  start_datetime: string;
  end_datetime: string;
  is_all_day: boolean;
  color: string;
  location: string;
  description: string;
}

function emptyForm(): FormState {
  const now = new Date();
  const later = new Date(now.getTime() + 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return {
    title: "",
    start_datetime: fmt(now),
    end_datetime: fmt(later),
    is_all_day: false,
    color: "blue",
    location: "",
    description: "",
  };
}

function eventToForm(e: CalendarEvent): FormState {
  return {
    title: e.title,
    start_datetime: e.is_all_day ? toDateInput(e.start_datetime) : toDatetimeLocal(e.start_datetime),
    end_datetime: e.is_all_day ? toDateInput(e.end_datetime) : toDatetimeLocal(e.end_datetime),
    is_all_day: e.is_all_day,
    color: e.color || "blue",
    location: e.location || "",
    description: e.description || "",
  };
}

interface EventFormProps {
  initial: FormState;
  isEdit: boolean;
  onSave: (data: FormState) => Promise<void>;
  onCancel: () => void;
}

function EventForm({ initial, isEdit, onSave, onCancel }: EventFormProps) {
  const [form, setForm] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof FormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-3 mb-3 rounded-lg bg-[#1a1a2e] border border-white/10 p-3 space-y-2"
    >
      <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
        {isEdit ? "Editar evento" : "Nuevo evento"}
      </p>

      {/* Title */}
      <input
        type="text"
        placeholder="Título *"
        required
        maxLength={200}
        value={form.title}
        onChange={(e) => set("title", e.target.value)}
        className="w-full rounded bg-[#0d0d1a] border border-white/10 px-2 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-500"
      />

      {/* All day */}
      <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={form.is_all_day}
          onChange={(e) => {
            const allDay = e.target.checked;
            // Convert datetime ↔ date when toggling
            set("is_all_day", allDay);
            if (allDay) {
              set("start_datetime", form.start_datetime.slice(0, 10));
              set("end_datetime", form.end_datetime.slice(0, 10));
            } else {
              set("start_datetime", form.start_datetime + "T00:00");
              set("end_datetime", form.end_datetime + "T01:00");
            }
          }}
          className="accent-purple-500"
        />
        Todo el día
      </label>

      {/* Start */}
      <div>
        <label className="block text-[10px] text-white/40 mb-0.5">Inicio *</label>
        <input
          type={form.is_all_day ? "date" : "datetime-local"}
          required
          value={form.start_datetime}
          onChange={(e) => set("start_datetime", e.target.value)}
          className="w-full rounded bg-[#0d0d1a] border border-white/10 px-2 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* End */}
      <div>
        <label className="block text-[10px] text-white/40 mb-0.5">Fin *</label>
        <input
          type={form.is_all_day ? "date" : "datetime-local"}
          required
          value={form.end_datetime}
          onChange={(e) => set("end_datetime", e.target.value)}
          className="w-full rounded bg-[#0d0d1a] border border-white/10 px-2 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Color swatches */}
      <div>
        <label className="block text-[10px] text-white/40 mb-1">Color</label>
        <div className="flex gap-1.5 flex-wrap">
          {EVENT_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => set("color", c.value)}
              className={`w-5 h-5 rounded-full ${c.cls} transition-transform ${
                form.color === c.value ? "ring-2 ring-white ring-offset-1 ring-offset-[#1a1a2e] scale-110" : "opacity-70 hover:opacity-100"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Location */}
      <input
        type="text"
        placeholder="Ubicación"
        value={form.location}
        onChange={(e) => set("location", e.target.value)}
        className="w-full rounded bg-[#0d0d1a] border border-white/10 px-2 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-500"
      />

      {/* Description */}
      <textarea
        placeholder="Descripción"
        rows={2}
        value={form.description}
        onChange={(e) => set("description", e.target.value)}
        className="w-full rounded bg-[#0d0d1a] border border-white/10 px-2 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-500 resize-none"
      />

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-50 py-1.5 text-xs font-medium text-white transition-colors"
        >
          {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear evento"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded bg-white/5 hover:bg-white/10 py-1.5 text-xs text-white/70 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ── CalendarPanel ─────────────────────────────────────────────────────────────

export default function CalendarPanel() {
  const { accessToken, tenant, isAuthenticated } = useAuthStore();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [formTarget, setFormTarget] = useState<CalendarEvent | null | undefined>(undefined);
  const [spinning, setSpinning] = useState(false);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
    "X-Tenant-Slug": tenant?.slug ?? "",
  };

  const fetchEvents = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError(null);
    try {
      const start = new Date().toISOString();
      const end = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
      const res = await fetch(
        `${API_BASE}/api/v1/app/calendar/?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
        { headers }
      );
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      const list: CalendarEvent[] = data.events ?? data.results ?? [];
      list.sort(
        (a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
      );
      setEvents(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar eventos");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, accessToken, tenant?.slug]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleRefresh = async () => {
    setSpinning(true);
    await fetchEvents();
    setTimeout(() => setSpinning(false), 600);
  };

  // ── CRUD ──────────────────────────────────────────────────────────────────

  const buildBody = (form: FormState) => ({
    title: form.title,
    start_datetime: form.is_all_day ? `${form.start_datetime}T00:00:00` : new Date(form.start_datetime).toISOString(),
    end_datetime: form.is_all_day ? `${form.end_datetime}T23:59:59` : new Date(form.end_datetime).toISOString(),
    is_all_day: form.is_all_day,
    color: form.color,
    location: form.location,
    description: form.description,
  });

  const handleCreate = async (form: FormState) => {
    const res = await fetch(`${API_BASE}/api/v1/app/calendar/`, {
      method: "POST",
      headers,
      body: JSON.stringify(buildBody(form)),
    });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    const created: CalendarEvent = await res.json();
    setEvents((prev) =>
      [...prev, created].sort(
        (a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
      )
    );
    setFormTarget(undefined);
  };

  const handleEdit = async (form: FormState) => {
    if (!formTarget) return;
    const res = await fetch(`${API_BASE}/api/v1/app/calendar/${formTarget.id}/`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(buildBody(form)),
    });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    const updated: CalendarEvent = await res.json();
    setEvents((prev) =>
      prev
        .map((e) => (e.id === updated.id ? updated : e))
        .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())
    );
    setFormTarget(undefined);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`${API_BASE}/api/v1/app/calendar/${id}/`, {
      method: "DELETE",
      headers,
    });
    if (!res.ok && res.status !== 204) throw new Error(`Error ${res.status}`);
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setConfirmId(null);
  };

  // ── Group events ─────────────────────────────────────────────────────────

  const grouped: Partial<Record<EventGroup, CalendarEvent[]>> = {};
  for (const ev of events) {
    const g = getEventGroup(ev.start_datetime);
    if (!grouped[g]) grouped[g] = [];
    grouped[g]!.push(ev);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col bg-[#13131f] text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">Calendario</span>
          {events.length > 0 && (
            <span className="rounded-full bg-purple-600/30 px-1.5 py-0.5 text-[10px] font-medium text-purple-300">
              {events.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            className="rounded p-1 text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors"
          >
            <RefreshCw size={13} className={spinning ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setFormTarget(formTarget === undefined ? null : undefined)}
            className={`rounded p-1 transition-colors ${
              formTarget !== undefined
                ? "text-purple-400 bg-purple-500/10"
                : "text-white/40 hover:text-white/80 hover:bg-white/5"
            }`}
          >
            {formTarget !== undefined ? <X size={13} /> : <Plus size={13} />}
          </button>
        </div>
      </div>

      {/* Create form */}
      {formTarget === null && (
        <div className="pt-3">
          <EventForm
            initial={emptyForm()}
            isEdit={false}
            onSave={handleCreate}
            onCancel={() => setFormTarget(undefined)}
          />
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-4 p-3">
            {[0, 1].map((g) => (
              <div key={g}>
                <div className="h-3 w-24 rounded bg-white/10 animate-pulse mb-2" />
                {[0, 1].map((r) => (
                  <div key={r} className="flex items-center gap-2 py-2">
                    <div className="w-2 h-2 rounded-full bg-white/10 animate-pulse shrink-0" />
                    <div className="h-3 w-12 rounded bg-white/10 animate-pulse" />
                    <div className="h-3 flex-1 rounded bg-white/10 animate-pulse" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 p-6 text-center">
            <p className="text-xs text-red-400">{error}</p>
            <button
              onClick={fetchEvents}
              className="rounded bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs text-white/70 transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <p className="text-xs text-white/40">Sin eventos próximos</p>
            <button
              onClick={() => setFormTarget(null)}
              className="rounded bg-purple-600/20 hover:bg-purple-600/30 px-3 py-1.5 text-xs text-purple-300 transition-colors"
            >
              Crear evento
            </button>
          </div>
        ) : (
          <div className="pb-4">
            {GROUP_ORDER.map((groupKey) => {
              const groupEvents = grouped[groupKey];
              if (!groupEvents || groupEvents.length === 0) return null;
              return (
                <div key={groupKey} className="mt-4">
                  {/* Group header */}
                  <div className="px-3 mb-1 flex items-baseline gap-2">
                    <span className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">
                      {GROUP_LABELS[groupKey]}
                    </span>
                    <span className="text-[10px] text-white/30">
                      {formatDateShort(groupEvents[0].start_datetime)}
                    </span>
                  </div>

                  {/* Events */}
                  {groupEvents.map((ev) => {
                    const isExpanded = expandedId === ev.id;
                    const isConfirming = confirmId === ev.id;
                    const isEditing = formTarget?.id === ev.id;
                    const dot = colorCls(ev.color);

                    return (
                      <div key={ev.id} className="group">
                        {/* Row */}
                        <div
                          className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 cursor-pointer transition-colors"
                          onClick={() => {
                            if (isConfirming || isEditing) return;
                            setExpandedId(isExpanded ? null : ev.id);
                          }}
                        >
                          {/* Expand chevron */}
                          <span className="text-white/20 shrink-0">
                            {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                          </span>

                          {/* Color dot */}
                          <span className={`w-2 h-2 rounded-full ${dot} shrink-0`} />

                          {/* Time */}
                          <span className="text-[10px] text-white/40 w-16 shrink-0">
                            {formatTime(ev)}
                          </span>

                          {/* Title */}
                          <span className="flex-1 truncate text-xs text-white/90">{ev.title}</span>

                          {/* Location */}
                          {ev.location && (
                            <span className="flex items-center gap-0.5 text-[10px] text-white/30 shrink-0 max-w-[60px] truncate">
                              <MapPin size={9} />
                              {ev.location}
                            </span>
                          )}

                          {/* Actions */}
                          {isConfirming ? (
                            <div
                              className="flex items-center gap-1 ml-1 shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="text-[10px] text-white/50 mr-0.5">¿Eliminar?</span>
                              <button
                                onClick={() => handleDelete(ev.id)}
                                className="rounded p-0.5 text-green-400 hover:bg-green-500/20 transition-colors"
                              >
                                <Check size={11} />
                              </button>
                              <button
                                onClick={() => setConfirmId(null)}
                                className="rounded p-0.5 text-white/40 hover:bg-white/10 transition-colors"
                              >
                                <X size={11} />
                              </button>
                            </div>
                          ) : (
                            <div
                              className="flex items-center gap-0.5 ml-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => {
                                  setFormTarget(ev);
                                  setExpandedId(null);
                                }}
                                className="rounded p-1 text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors"
                              >
                                <Pencil size={11} />
                              </button>
                              <button
                                onClick={() => setConfirmId(ev.id)}
                                className="rounded p-1 text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Edit form */}
                        {isEditing && (
                          <div className="pb-1">
                            <EventForm
                              initial={eventToForm(ev)}
                              isEdit={true}
                              onSave={handleEdit}
                              onCancel={() => setFormTarget(undefined)}
                            />
                          </div>
                        )}

                        {/* Expanded detail */}
                        {isExpanded && !isEditing && (
                          <div className="px-3 pb-3 pt-1 bg-white/[0.02] border-t border-white/5 space-y-1.5">
                            {/* Time range */}
                            <div className="flex items-center gap-1.5 text-[10px] text-white/50">
                              <Clock size={10} className="shrink-0" />
                              <span>{formatRange(ev)}</span>
                            </div>

                            {/* Location */}
                            {ev.location && (
                              <div className="flex items-center gap-1.5 text-[10px] text-white/50">
                                <MapPin size={10} className="shrink-0" />
                                <span>{ev.location}</span>
                              </div>
                            )}

                            {/* Description */}
                            {ev.description && (
                              <div className="flex items-start gap-1.5 text-[10px] text-white/50">
                                <AlignLeft size={10} className="shrink-0 mt-0.5" />
                                <span className="whitespace-pre-wrap break-words">{ev.description}</span>
                              </div>
                            )}

                            {/* Recurrence */}
                            {ev.rrule && (
                              <div className="flex items-center gap-1.5 text-[10px] text-purple-400/70">
                                <Repeat size={10} className="shrink-0" />
                                <span>Evento recurrente</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
