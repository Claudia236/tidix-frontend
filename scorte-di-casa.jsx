import { useState, useEffect, useMemo } from "react";
import { Plus, Minus, X, Search, Trash2, AlertTriangle, ShoppingCart, Check, LayoutGrid, Package, ChevronRight } from "lucide-react";

/* ---------- Design tokens ---------- */
const COLORS = {
  bg: "#EDEFE9",
  card: "#FFFFFF",
  ink: "#26332C",
  inkSoft: "#5B695F",
  brand: "#3F6B52",
  warn: "#C4571F",
  warnBg: "#FBEADC",
  danger: "#A33B2B",
  dangerBg: "#F6E2DE",
  gold: "#B98A2E",
  goldBg: "#F5EAD3",
  okBg: "#E4E7DF",
  line: "#DCDFD6",
};

const ZONES = {
  frigo: { label: "Frigo", code: "FR", color: "#2E6E8E", bg: "#E1EDF1", emoji: "🧊" },
  freezer: { label: "Freezer", code: "FZ", color: "#1F7A8C", bg: "#DCEFF1", emoji: "❄️" },
  dispensa: { label: "Dispensa", code: "DI", color: "#96702A", bg: "#F1E8D8", emoji: "🥫" },
  sgabuzzino: { label: "Sgabuzzino", code: "SG", color: "#5B5A52", bg: "#EAE8E2", emoji: "📦" },
};

const CATEGORIES = [
  { key: "latticini", label: "Latticini", short: "Latticini", emoji: "🥛" },
  { key: "carne", label: "Carne e pesce", short: "Carne/Pesce", emoji: "🥩" },
  { key: "frutta_verdura", label: "Frutta e verdura", short: "Frutta/Verdura", emoji: "🥦" },
  { key: "cereali", label: "Pasta e cereali", short: "Pasta/Cereali", emoji: "🍝" },
  { key: "conserve", label: "Conserve", short: "Conserve", emoji: "🥫" },
  { key: "condimenti", label: "Condimenti", short: "Condimenti", emoji: "🧂" },
  { key: "bevande", label: "Bevande", short: "Bevande", emoji: "🧃" },
  { key: "dolci", label: "Dolci e snack", short: "Dolci/Snack", emoji: "🍪" },
  { key: "pulizia", label: "Pulizia e igiene", short: "Pulizia", emoji: "🧴" },
  { key: "altro", label: "Altro", short: "Altro", emoji: "📌" },
];

const UNITS = ["pz", "kg", "g", "l", "ml", "conf"];

const STATUS = {
  critico: { fg: COLORS.danger, bg: COLORS.dangerBg },
  attenzione: { fg: COLORS.warn, bg: COLORS.warnBg },
  presto: { fg: COLORS.gold, bg: COLORS.goldBg },
  ok: { fg: COLORS.inkSoft, bg: COLORS.okBg },
};

const STORAGE_KEY = "inventario-casa";

/* ---------- Helpers ---------- */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  return Math.round((target - today) / 86400000);
}

function formatShortDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
}

function getExpiryInfo(scadenza) {
  if (!scadenza) return null;
  const days = daysUntil(scadenza);
  if (days < 0) return { status: "critico", label: days === -1 ? "Scaduto ieri" : `Scaduto da ${Math.abs(days)} giorni` };
  if (days === 0) return { status: "attenzione", label: "Scade oggi" };
  if (days === 1) return { status: "attenzione", label: "Scade domani" };
  if (days <= 3) return { status: "attenzione", label: `Scade tra ${days} giorni` };
  if (days <= 7) return { status: "presto", label: `Scade tra ${days} giorni` };
  return { status: "ok", label: formatShortDate(scadenza) };
}

/* ---------- Small components ---------- */
function SectionTitle({ children, small }) {
  return (
    <h2
      className={`font-display uppercase tracking-wide font-semibold ${small ? "text-xs" : "text-lg"}`}
      style={{ color: COLORS.ink }}
    >
      {children}
    </h2>
  );
}

function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: COLORS.okBg }}>
        <Icon size={22} style={{ color: COLORS.inkSoft }} />
      </div>
      <p className="font-semibold text-sm" style={{ color: COLORS.ink }}>{title}</p>
      {subtitle && <p className="text-sm mt-1" style={{ color: COLORS.inkSoft }}>{subtitle}</p>}
    </div>
  );
}

function AlertCard({ tone, title, items, onItemClick }) {
  const color = tone === "critico" ? COLORS.danger : COLORS.warn;
  const bg = tone === "critico" ? COLORS.dangerBg : COLORS.warnBg;
  return (
    <div className="rounded-xl p-3" style={{ backgroundColor: bg }}>
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle size={16} style={{ color }} />
        <span className="text-sm font-semibold" style={{ color }}>{title}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.slice(0, 6).map((it) => (
          <button
            key={it.id}
            onClick={() => onItemClick(it)}
            className="text-xs font-medium px-2 py-1 rounded-full bg-white"
            style={{ color }}
          >
            {it.nome}
          </button>
        ))}
        {items.length > 6 && <span className="text-xs px-2 py-1" style={{ color }}>+{items.length - 6}</span>}
      </div>
    </div>
  );
}

function ItemCard({ item, onAdjust, onEdit }) {
  const zone = ZONES[item.zona];
  const cat = CATEGORIES.find((c) => c.key === item.categoria) || CATEGORIES[CATEGORIES.length - 1];
  const qty = Number(item.quantita);
  const needsBuying = qty <= 0;
  const expiry = !needsBuying ? getExpiryInfo(item.scadenza) : null;

  let stripeColor = COLORS.line;
  let noteText = null;
  let noteColor = COLORS.inkSoft;

  if (needsBuying) {
    stripeColor = COLORS.danger;
    noteText = "Da comprare";
    noteColor = COLORS.danger;
  } else if (expiry) {
    stripeColor = STATUS[expiry.status].fg;
    noteText = expiry.label;
    noteColor = STATUS[expiry.status].fg;
  }

  return (
    <div className="flex bg-white rounded-xl border overflow-hidden shadow-sm" style={{ borderColor: COLORS.line }}>
      <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: stripeColor }} />
      <div className="flex-1 py-3 pr-3 flex items-center gap-2 min-w-0">
        <button onClick={() => onEdit(item)} className="flex items-center gap-3 flex-1 min-w-0 pl-3 text-left">
          <span className="text-xl flex-shrink-0" aria-hidden="true">{cat.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-sm truncate" style={{ color: COLORS.ink }}>{item.nome}</span>
              <span
                className="font-display text-xs font-semibold px-1.5 py-0.5 rounded flex-shrink-0"
                style={{ backgroundColor: zone.bg, color: zone.color }}
              >
                {zone.code}
              </span>
            </div>
            {noteText && <div className="text-xs mt-0.5 font-medium" style={{ color: noteColor }}>{noteText}</div>}
          </div>
        </button>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onAdjust(item.id, -1)}
            disabled={qty <= 0}
            className="w-7 h-7 rounded-full flex items-center justify-center border disabled:opacity-30"
            style={{ borderColor: COLORS.line, color: COLORS.ink }}
            aria-label={`Diminuisci quantità di ${item.nome}`}
          >
            <Minus size={14} />
          </button>
          <span className="font-mono font-bold text-sm text-center px-1 whitespace-nowrap" style={{ color: COLORS.ink }}>
            {qty}{item.unita ? ` ${item.unita}` : ""}
          </span>
          <button
            onClick={() => onAdjust(item.id, 1)}
            className="w-7 h-7 rounded-full flex items-center justify-center border"
            style={{ borderColor: COLORS.line, color: COLORS.ink }}
            aria-label={`Aumenta quantità di ${item.nome}`}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Tabs ---------- */
function OverviewTab({ zoneStats, expiredItems, expiringItems, shoppingCount, onGoZone, onGoShopping, onEditItem }) {
  const totalCount = Object.values(zoneStats).reduce((s, z) => s + z.count, 0);

  if (totalCount === 0) {
    return (
      <div className="space-y-5">
        <SectionTitle>Panoramica</SectionTitle>
        <EmptyState
          icon={Package}
          title="Inizia ad aggiungere i tuoi prodotti"
          subtitle="Tocca il pulsante + per registrare cosa hai in frigo, freezer, dispensa e sgabuzzino."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionTitle>Panoramica</SectionTitle>

      {expiredItems.length === 0 && expiringItems.length === 0 ? (
        <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: COLORS.okBg }}>
          <Check size={18} style={{ color: COLORS.brand }} />
          <span className="text-sm" style={{ color: COLORS.ink }}>Nessuna scadenza imminente. Tutto sotto controllo.</span>
        </div>
      ) : (
        <div className="space-y-2">
          {expiredItems.length > 0 && (
            <AlertCard
              tone="critico"
              title={`${expiredItems.length} prodott${expiredItems.length === 1 ? "o" : "i"} scadut${expiredItems.length === 1 ? "o" : "i"}`}
              items={expiredItems}
              onItemClick={onEditItem}
            />
          )}
          {expiringItems.length > 0 && (
            <AlertCard
              tone="attenzione"
              title={`${expiringItems.length} prodott${expiringItems.length === 1 ? "o" : "i"} in scadenza`}
              items={expiringItems}
              onItemClick={onEditItem}
            />
          )}
        </div>
      )}

      <div>
        <SectionTitle small>Le zone</SectionTitle>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {Object.entries(ZONES).map(([key, zone]) => (
            <button
              key={key}
              onClick={() => onGoZone(key)}
              className="text-left rounded-xl border p-3 bg-white active:scale-95 transition-transform"
              style={{ borderColor: COLORS.line }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{zone.emoji}</span>
                {(zoneStats[key].hasExpired || zoneStats[key].hasExpiring) && (
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: zoneStats[key].hasExpired ? COLORS.danger : COLORS.warn }}
                  />
                )}
              </div>
              <div className="font-display uppercase text-sm tracking-wide font-semibold" style={{ color: COLORS.ink }}>
                {zone.label}
              </div>
              <div className="font-mono text-xs mt-0.5" style={{ color: COLORS.inkSoft }}>
                {zoneStats[key].count} prodott{zoneStats[key].count === 1 ? "o" : "i"}
              </div>
            </button>
          ))}
        </div>
      </div>

      {shoppingCount > 0 && (
        <button
          onClick={onGoShopping}
          className="w-full flex items-center justify-between rounded-xl p-4 border-t-2 border-dashed bg-white"
          style={{ borderColor: COLORS.line }}
        >
          <div className="flex items-center gap-3">
            <ShoppingCart size={18} style={{ color: COLORS.brand }} />
            <span className="text-sm font-medium" style={{ color: COLORS.ink }}>
              {shoppingCount} prodott{shoppingCount === 1 ? "o" : "i"} da comprare
            </span>
          </div>
          <ChevronRight size={18} style={{ color: COLORS.inkSoft }} />
        </button>
      )}
    </div>
  );
}

function StockTab({ items, filterZone, setFilterZone, search, setSearch, onAdjust, onEdit }) {
  const filters = [{ key: "tutti", label: "Tutti", emoji: "📋" }, ...Object.entries(ZONES).map(([k, z]) => ({ key: k, label: z.label, emoji: z.emoji }))];

  return (
    <div className="space-y-4">
      <SectionTitle>Le tue scorte</SectionTitle>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.inkSoft }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca un prodotto..."
          className="w-full rounded-xl border pl-9 pr-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          style={{ borderColor: COLORS.line, color: COLORS.ink }}
        />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilterZone(f.key)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium whitespace-nowrap"
            style={
              filterZone === f.key
                ? { backgroundColor: COLORS.brand, borderColor: COLORS.brand, color: "#fff" }
                : { backgroundColor: "#fff", borderColor: COLORS.line, color: COLORS.ink }
            }
          >
            <span>{f.emoji}</span>{f.label}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {items.length === 0 ? (
          <EmptyState icon={Package} title="Nessun prodotto trovato" subtitle="Prova a modificare la ricerca o aggiungi un nuovo prodotto." />
        ) : (
          items.map((item) => <ItemCard key={item.id} item={item} onAdjust={onAdjust} onEdit={onEdit} />)
        )}
      </div>
    </div>
  );
}

function ShoppingTab({ shoppingItems, shoppingNotes, onRestock, onEdit, quickText, setQuickText, onAddNote, onRemoveNote }) {
  const rows = [
    ...shoppingItems.map((it) => ({ type: "item", data: it })),
    ...shoppingNotes.map((n) => ({ type: "note", data: n })),
  ];

  return (
    <div className="space-y-4">
      <SectionTitle>Lista della spesa</SectionTitle>
      <div className="flex gap-2">
        <input
          value={quickText}
          onChange={(e) => setQuickText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onAddNote(); }}
          placeholder="Aggiungi promemoria veloce..."
          className="flex-1 rounded-xl border px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          style={{ borderColor: COLORS.line, color: COLORS.ink }}
        />
        <button
          onClick={onAddNote}
          aria-label="Aggiungi promemoria"
          className="rounded-xl px-4 flex items-center justify-center text-white flex-shrink-0"
          style={{ backgroundColor: COLORS.brand }}
        >
          <Plus size={18} />
        </button>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="La lista è vuota" subtitle="I prodotti finiti vengono aggiunti qui automaticamente." />
      ) : (
        <div className="bg-white rounded-xl overflow-hidden border-t-2 border-dashed" style={{ borderColor: COLORS.line }}>
          {rows.map((row, i) => (
            <div
              key={`${row.type}-${row.data.id}`}
              className={`flex items-center gap-3 px-4 py-3 ${i === 0 ? "" : "border-t"}`}
              style={{ borderColor: COLORS.line }}
            >
              {row.type === "item" ? (
                <>
                  <button
                    onClick={() => onRestock(row.data.id)}
                    className="w-6 h-6 rounded-full border-2 flex-shrink-0"
                    style={{ borderColor: COLORS.brand }}
                    aria-label={`Segna ${row.data.nome} come comprato`}
                  />
                  <button onClick={() => onEdit(row.data)} className="flex-1 text-left min-w-0 flex items-center gap-2">
                    <span className="flex-shrink-0">{(CATEGORIES.find((c) => c.key === row.data.categoria) || CATEGORIES[CATEGORIES.length - 1]).emoji}</span>
                    <span className="font-medium text-sm truncate" style={{ color: COLORS.ink }}>{row.data.nome}</span>
                    <span
                      className="font-display text-xs font-semibold px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{ backgroundColor: ZONES[row.data.zona].bg, color: ZONES[row.data.zona].color }}
                    >
                      {ZONES[row.data.zona].code}
                    </span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onRemoveNote(row.data.id)}
                    className="w-6 h-6 rounded-full border-2 flex-shrink-0"
                    style={{ borderColor: COLORS.brand }}
                    aria-label="Rimuovi promemoria"
                  />
                  <span className="flex-1 min-w-0 truncate text-sm" style={{ color: COLORS.ink }}>{row.data.testo}</span>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Add / edit sheet ---------- */
function AddEditSheet({ initial, isEditing, onSave, onCancel, onDelete }) {
  const [form, setForm] = useState(initial);
  const update = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));
  const canSave = form.nome.trim().length > 0;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} onClick={onCancel} />
      <div className="relative w-full max-w-md bg-white rounded-t-2xl overflow-y-auto" style={{ maxHeight: "88vh" }}>
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: COLORS.line }}>
          <h3 className="font-display uppercase tracking-wide font-semibold text-base" style={{ color: COLORS.ink }}>
            {isEditing ? "Modifica prodotto" : "Nuovo prodotto"}
          </h3>
          <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ color: COLORS.inkSoft }} aria-label="Chiudi">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.inkSoft }}>Nome prodotto</label>
            <input
              autoFocus
              value={form.nome}
              onChange={(e) => update("nome", e.target.value)}
              placeholder="Es. Latte intero"
              className="w-full mt-1.5 rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              style={{ borderColor: COLORS.line, color: COLORS.ink }}
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.inkSoft }}>Dove si trova</label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              {Object.entries(ZONES).map(([key, zone]) => (
                <button
                  key={key}
                  onClick={() => update("zona", key)}
                  className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium"
                  style={
                    form.zona === key
                      ? { backgroundColor: zone.color, borderColor: zone.color, color: "#fff" }
                      : { backgroundColor: "#fff", borderColor: COLORS.line, color: COLORS.ink }
                  }
                >
                  <span>{zone.emoji}</span>{zone.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.inkSoft }}>Categoria</label>
            <div className="flex gap-2 overflow-x-auto mt-1.5 pb-1 no-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => update("categoria", cat.key)}
                  className="flex-shrink-0 flex flex-col items-center gap-1 rounded-xl border px-3 py-2"
                  style={{
                    minWidth: "4rem",
                    ...(form.categoria === cat.key
                      ? { backgroundColor: COLORS.okBg, borderColor: COLORS.brand }
                      : { backgroundColor: "#fff", borderColor: COLORS.line }),
                  }}
                >
                  <span className="text-lg">{cat.emoji}</span>
                  <span className="text-xs" style={{ color: COLORS.ink }}>{cat.short}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.inkSoft }}>Quantità</label>
              <input
                type="number"
                min="0"
                step="any"
                value={form.quantita}
                onChange={(e) => update("quantita", e.target.value)}
                className="w-full mt-1.5 rounded-xl border px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600"
                style={{ borderColor: COLORS.line, color: COLORS.ink }}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.inkSoft }}>Unità</label>
              <select
                value={form.unita}
                onChange={(e) => update("unita", e.target.value)}
                className="w-full mt-1.5 rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                style={{ borderColor: COLORS.line, color: COLORS.ink }}
              >
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.inkSoft }}>Scadenza (opzionale)</label>
            <input
              type="date"
              value={form.scadenza}
              onChange={(e) => update("scadenza", e.target.value)}
              className="w-full mt-1.5 rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              style={{ borderColor: COLORS.line, color: COLORS.ink }}
            />
          </div>

          <div className="flex gap-3 pt-2 pb-2">
            {isEditing && (
              <button
                onClick={onDelete}
                className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium"
                style={{ color: COLORS.danger, backgroundColor: COLORS.dangerBg }}
              >
                <Trash2 size={16} /> Elimina
              </button>
            )}
            <button
              disabled={!canSave}
              onClick={() => onSave(form)}
              className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
              style={{ backgroundColor: COLORS.brand }}
            >
              Salva
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Bottom navigation + FAB ---------- */
function BottomChrome({ active, setActive, shoppingCount, onAdd }) {
  const tabs = [
    { key: "overview", label: "Panoramica", icon: LayoutGrid },
    { key: "stock", label: "Scorte", icon: Package },
    { key: "shopping", label: "Lista Spesa", icon: ShoppingCart, badge: shoppingCount },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30">
      <div className="max-w-md mx-auto relative">
        <button
          onClick={onAdd}
          aria-label="Aggiungi prodotto"
          className="absolute -top-16 right-4 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
          style={{ backgroundColor: COLORS.brand }}
        >
          <Plus size={26} />
        </button>
        <nav className="border-t bg-white flex" style={{ borderColor: COLORS.line }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = active === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActive(tab.key)}
                className="flex-1 flex flex-col items-center gap-1 py-2.5 relative"
              >
                <div className="relative">
                  <Icon size={20} style={{ color: isActive ? COLORS.brand : COLORS.inkSoft }} />
                  {tab.badge > 0 && (
                    <span
                      className="absolute -top-1.5 -right-2 h-4 px-1 rounded-full text-white text-xs font-bold flex items-center justify-center leading-none"
                      style={{ minWidth: "1rem", backgroundColor: COLORS.danger }}
                    >
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="font-display text-xs uppercase tracking-wide font-medium" style={{ color: isActive ? COLORS.brand : COLORS.inkSoft }}>
                  {tab.label}
                </span>
                {isActive && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full" style={{ backgroundColor: COLORS.brand }} />}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

/* ---------- Main app ---------- */
export default function App() {
  const [items, setItems] = useState([]);
  const [shoppingNotes, setShoppingNotes] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [filterZone, setFilterZone] = useState("tutti");
  const [search, setSearch] = useState("");
  const [quickText, setQuickText] = useState("");
  const [sheetState, setSheetState] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY, false);
        if (!cancelled && res && res.value) {
          const parsed = JSON.parse(res.value);
          setItems(Array.isArray(parsed.items) ? parsed.items : []);
          setShoppingNotes(Array.isArray(parsed.shoppingNotes) ? parsed.shoppingNotes : []);
        }
      } catch (e) {
        // nessun dato salvato ancora
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        await window.storage.set(STORAGE_KEY, JSON.stringify({ items, shoppingNotes }), false);
      } catch (e) {
        console.error("Errore nel salvataggio", e);
      }
    })();
  }, [items, shoppingNotes, loaded]);

  const expiredItems = useMemo(() => items.filter((it) => it.scadenza && Number(it.quantita) > 0 && daysUntil(it.scadenza) < 0), [items]);
  const expiringItems = useMemo(() => items.filter((it) => it.scadenza && Number(it.quantita) > 0 && daysUntil(it.scadenza) >= 0 && daysUntil(it.scadenza) <= 3), [items]);
  const shoppingItems = useMemo(() => items.filter((it) => Number(it.quantita) <= 0), [items]);

  const zoneStats = useMemo(() => {
    const stats = {};
    Object.keys(ZONES).forEach((z) => {
      const zi = items.filter((it) => it.zona === z);
      stats[z] = {
        count: zi.length,
        hasExpired: zi.some((it) => it.scadenza && Number(it.quantita) > 0 && daysUntil(it.scadenza) < 0),
        hasExpiring: zi.some((it) => it.scadenza && Number(it.quantita) > 0 && daysUntil(it.scadenza) >= 0 && daysUntil(it.scadenza) <= 3),
      };
    });
    return stats;
  }, [items]);

  const filteredStock = useMemo(() => {
    let list = items;
    if (filterZone !== "tutti") list = list.filter((it) => it.zona === filterZone);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((it) => it.nome.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      const da = a.scadenza ? new Date(a.scadenza).getTime() : Infinity;
      const db = b.scadenza ? new Date(b.scadenza).getTime() : Infinity;
      if (da !== db) return da - db;
      return a.nome.localeCompare(b.nome, "it");
    });
  }, [items, filterZone, search]);

  function handleAdjust(id, delta) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, quantita: Math.max(0, Number(it.quantita) + delta) } : it)));
  }

  function handleRestock(id) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, quantita: 1 } : it)));
  }

  function openNew() { setSheetState({ mode: "new" }); }
  function openEdit(item) { setSheetState({ mode: "edit", item }); }
  function closeSheet() { setSheetState(null); }

  function handleSave(form) {
    const cleaned = {
      nome: form.nome.trim(),
      zona: form.zona,
      categoria: form.categoria,
      quantita: Math.max(0, Number(form.quantita) || 0),
      unita: form.unita,
      scadenza: form.scadenza || null,
    };
    if (sheetState && sheetState.mode === "edit") {
      setItems((prev) => prev.map((it) => (it.id === sheetState.item.id ? { ...it, ...cleaned } : it)));
    } else {
      setItems((prev) => [...prev, { id: uid(), ...cleaned, dataAggiunta: new Date().toISOString() }]);
    }
    closeSheet();
  }

  function handleDelete() {
    if (sheetState && sheetState.mode === "edit") {
      setItems((prev) => prev.filter((it) => it.id !== sheetState.item.id));
    }
    closeSheet();
  }

  function handleAddNote() {
    if (!quickText.trim()) return;
    setShoppingNotes((prev) => [...prev, { id: uid(), testo: quickText.trim() }]);
    setQuickText("");
  }
  function handleRemoveNote(id) {
    setShoppingNotes((prev) => prev.filter((n) => n.id !== id));
  }

  const todayLabel = useMemo(() => new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" }), []);
  const shoppingCount = shoppingItems.length + shoppingNotes.length;

  const globalStyle = `
    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&display=swap');
    .font-display { font-family: 'Oswald', 'Arial Narrow', sans-serif; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    @media (prefers-reduced-motion: reduce) {
      * { transition: none !important; animation: none !important; }
    }
  `;

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.bg }}>
        <style>{globalStyle}</style>
        <div className="font-display uppercase tracking-wide font-semibold animate-pulse" style={{ color: COLORS.brand }}>
          Scorte di Casa
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <style>{globalStyle}</style>

      <div className="max-w-md mx-auto pb-28">
        <header className="px-5 pt-6 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-display font-bold text-sm flex-shrink-0" style={{ backgroundColor: COLORS.brand }}>
              SC
            </div>
            <span className="font-display text-lg font-bold uppercase tracking-wide" style={{ color: COLORS.ink }}>Scorte di Casa</span>
          </div>
          <span className="font-mono text-xs capitalize flex-shrink-0" style={{ color: COLORS.inkSoft }}>{todayLabel}</span>
        </header>

        <main className="px-5 pt-3">
          {activeTab === "overview" && (
            <OverviewTab
              zoneStats={zoneStats}
              expiredItems={expiredItems}
              expiringItems={expiringItems}
              shoppingCount={shoppingCount}
              onGoZone={(z) => { setFilterZone(z); setActiveTab("stock"); }}
              onGoShopping={() => setActiveTab("shopping")}
              onEditItem={openEdit}
            />
          )}
          {activeTab === "stock" && (
            <StockTab
              items={filteredStock}
              filterZone={filterZone}
              setFilterZone={setFilterZone}
              search={search}
              setSearch={setSearch}
              onAdjust={handleAdjust}
              onEdit={openEdit}
            />
          )}
          {activeTab === "shopping" && (
            <ShoppingTab
              shoppingItems={shoppingItems}
              shoppingNotes={shoppingNotes}
              onRestock={handleRestock}
              onEdit={openEdit}
              quickText={quickText}
              setQuickText={setQuickText}
              onAddNote={handleAddNote}
              onRemoveNote={handleRemoveNote}
            />
          )}
        </main>
      </div>

      <BottomChrome active={activeTab} setActive={setActiveTab} shoppingCount={shoppingCount} onAdd={openNew} />

      {sheetState && (
        <AddEditSheet
          isEditing={sheetState.mode === "edit"}
          initial={
            sheetState.mode === "edit"
              ? {
                  nome: sheetState.item.nome,
                  zona: sheetState.item.zona,
                  categoria: sheetState.item.categoria,
                  quantita: String(sheetState.item.quantita),
                  unita: sheetState.item.unita,
                  scadenza: sheetState.item.scadenza || "",
                }
              : { nome: "", zona: "frigo", categoria: "altro", quantita: "1", unita: "pz", scadenza: "" }
          }
          onSave={handleSave}
          onCancel={closeSheet}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
