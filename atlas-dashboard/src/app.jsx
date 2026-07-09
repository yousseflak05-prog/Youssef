import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

/* ------------------------------------------------------------------ */
/*  Données d'exemple                                                  */
/* ------------------------------------------------------------------ */

const CLINICS = [
  {
    id: "exemple",
    name: "Centre Dentaire Exemple",
    city: "Casablanca",
    since: "janvier 2026",
    weekly: [
      { week: "20 avr", leads: 28, rdv: 9 },
      { week: "27 avr", leads: 31, rdv: 10 },
      { week: "4 mai", leads: 26, rdv: 9 },
      { week: "11 mai", leads: 34, rdv: 12 },
      { week: "18 mai", leads: 30, rdv: 11 },
      { week: "25 mai", leads: 38, rdv: 14 },
      { week: "1 juin", leads: 35, rdv: 13 },
      { week: "8 juin", leads: 41, rdv: 15 },
      { week: "15 juin", leads: 37, rdv: 14 },
      { week: "22 juin", leads: 44, rdv: 17 },
      { week: "29 juin", leads: 40, rdv: 15 },
      { week: "6 juil", leads: 46, rdv: 18 },
    ],
    month: {
      label: "1 – 9 juillet 2026",
      leads: 58,
      rdv: 22,
      spend: 5640,
      deltas: { leads: +14, rdv: +18, spend: +6, cpl: -7, cpr: -10, conv: +4 },
      sources: [
        { name: "Meta Ads", leads: 34 },
        { name: "Landing Page", leads: 15 },
        { name: "WhatsApp", leads: 9 },
      ],
    },
    alltime: {
      label: "depuis janvier 2026",
      leads: 1284,
      rdv: 486,
      spend: 118400,
      sources: [
        { name: "Meta Ads", leads: 762 },
        { name: "Landing Page", leads: 331 },
        { name: "WhatsApp", leads: 191 },
      ],
    },
    defaultPatientValue: 1200,
  },
  {
    id: "sourire",
    name: "Clinique Sourire",
    city: "Rabat",
    since: "mars 2026",
    weekly: [
      { week: "20 avr", leads: 14, rdv: 4 },
      { week: "27 avr", leads: 17, rdv: 6 },
      { week: "4 mai", leads: 15, rdv: 5 },
      { week: "11 mai", leads: 19, rdv: 7 },
      { week: "18 mai", leads: 18, rdv: 6 },
      { week: "25 mai", leads: 22, rdv: 8 },
      { week: "1 juin", leads: 20, rdv: 7 },
      { week: "8 juin", leads: 24, rdv: 9 },
      { week: "15 juin", leads: 23, rdv: 8 },
      { week: "22 juin", leads: 26, rdv: 10 },
      { week: "29 juin", leads: 24, rdv: 9 },
      { week: "6 juil", leads: 28, rdv: 11 },
    ],
    month: {
      label: "1 – 9 juillet 2026",
      leads: 34,
      rdv: 13,
      spend: 3480,
      deltas: { leads: +11, rdv: +15, spend: +5, cpl: -5, cpr: -8, conv: +3 },
      sources: [
        { name: "Meta Ads", leads: 21 },
        { name: "Landing Page", leads: 8 },
        { name: "WhatsApp", leads: 5 },
      ],
    },
    alltime: {
      label: "depuis mars 2026",
      leads: 566,
      rdv: 208,
      spend: 56200,
      sources: [
        { name: "Meta Ads", leads: 344 },
        { name: "Landing Page", leads: 138 },
        { name: "WhatsApp", leads: 84 },
      ],
    },
    defaultPatientValue: 1000,
  },
];

/* ------------------------------------------------------------------ */
/*  Formatage (fr-MA)                                                  */
/* ------------------------------------------------------------------ */

const nf = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const fmtN = (n) => nf.format(Math.round(n));
const fmtMAD = (n) => `${fmtN(n)}`;
const fmtPct = (n) => `${Math.round(n)} %`;

/* ------------------------------------------------------------------ */
/*  Thème : lire les jetons CSS et suivre les changements              */
/* ------------------------------------------------------------------ */

function readTokens() {
  const cs = getComputedStyle(document.documentElement);
  const v = (name) => cs.getPropertyValue(name).trim();
  return {
    leads: v("--c-leads"),
    rdv: v("--c-rdv"),
    grid: v("--chart-grid"),
    axis: v("--ink-3"),
    card: v("--card"),
  };
}

function useChartTokens() {
  const [tokens, setTokens] = useState(readTokens);
  useEffect(() => {
    const update = () => setTokens(readTokens());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", update);
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      mq.removeEventListener("change", update);
      mo.disconnect();
    };
  }, []);
  return tokens;
}

/* ------------------------------------------------------------------ */
/*  Composants                                                         */
/* ------------------------------------------------------------------ */

function Delta({ value, suffix }) {
  if (value == null) return null;
  const up = value >= 0;
  return (
    <span className={`delta ${up ? "up" : "down"}`}>
      {up ? "▲" : "▼"} {Math.abs(value)}
      {" %"}
      {suffix ? ` ${suffix}` : ""}
    </span>
  );
}

function Kpi({ label, value, unit, sub, delta, deltaGoodWhenDown, dotColor }) {
  // Pour les coûts, une baisse est une bonne nouvelle : on inverse la couleur.
  let deltaNode = null;
  if (delta != null) {
    const up = delta >= 0;
    const good = deltaGoodWhenDown ? !up : up;
    deltaNode = (
      <span className={`delta ${good ? "up" : "down"}`}>
        {up ? "▲" : "▼"} {Math.abs(delta)}
        {" %"}
      </span>
    );
  }
  return (
    <div className="card kpi">
      <span className="kpi-label">
        {dotColor ? <span className="dot" style={{ background: dotColor }} /> : null}
        {label}
      </span>
      <span className="kpi-value">
        {value}
        {unit ? <span className="unit">{unit}</span> : null}
      </span>
      <span className="kpi-sub">
        {deltaNode}
        {sub}
      </span>
    </div>
  );
}

function TrendTooltip({ active, payload, label, tokens }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="tooltip-box">
      <div className="tt-title">Semaine du {label}</div>
      {payload.map((p) => (
        <div className="tt-row" key={p.dataKey}>
          <span className="swatch" style={{ background: p.color }} />
          {p.dataKey === "leads" ? "Leads reçus" : "RDV confirmés"}
          <b>{p.value}</b>
        </div>
      ))}
    </div>
  );
}

function TrendChart({ data, tokens }) {
  const lastIndex = data.length - 1;
  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }} barCategoryGap="32%">
          <CartesianGrid vertical={false} stroke={tokens.grid} />
          <XAxis
            dataKey="week"
            tickLine={false}
            axisLine={{ stroke: tokens.grid }}
            tick={{ fill: tokens.axis, fontSize: 11.5 }}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fill: tokens.axis, fontSize: 11.5 }}
            width={46}
          />
          <Tooltip
            content={<TrendTooltip tokens={tokens} />}
            cursor={{ fill: "rgba(127, 143, 131, 0.1)" }}
          />
          <Bar dataKey="leads" fill={tokens.leads} radius={[4, 4, 0, 0]} maxBarSize={26} />
          <Line
            type="monotone"
            dataKey="rdv"
            stroke={tokens.rdv}
            strokeWidth={2}
            dot={(props) => {
              const { key, cx, cy, index } = props;
              if (index !== lastIndex) return <g key={key} />;
              return (
                <circle key={key} cx={cx} cy={cy} r={4.5} fill={tokens.rdv} stroke={tokens.card} strokeWidth={2} />
              );
            }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: tokens.card }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function Sources({ sources, total }) {
  const max = Math.max(...sources.map((s) => s.leads));
  return (
    <div className="sources">
      {sources.map((s) => {
        const pct = total ? (s.leads / total) * 100 : 0;
        return (
          <div className="source-row" key={s.name}>
            <div className="source-top">
              <span className="source-name">{s.name}</span>
              <span className="source-val">
                <b>{fmtN(s.leads)}</b> leads · {fmtPct(pct)}
              </span>
            </div>
            <div className="source-bar">
              <span style={{ width: `${max ? (s.leads / max) * 100 : 0}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tableau de bord                                                    */
/* ------------------------------------------------------------------ */

function Dashboard({ clinic, onLogout }) {
  const [period, setPeriod] = useState("month"); // "month" | "alltime"
  const [patientValue, setPatientValue] = useState(clinic.defaultPatientValue);
  const tokens = useChartTokens();

  const d = period === "month" ? clinic.month : clinic.alltime;
  const isMonth = period === "month";

  const cpl = d.spend / d.leads;
  const cpr = d.spend / d.rdv;
  const conv = (d.rdv / d.leads) * 100;
  const revenue = d.rdv * (patientValue || 0);
  const roi = d.spend > 0 ? revenue / d.spend : 0;

  const deltas = isMonth ? d.deltas : {};

  return (
    <div>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="topbar-left">
            <span className="wordmark display">ATLAS</span>
            <span className="portail">Portail client</span>
          </div>
          <button className="btn-logout" onClick={onLogout}>
            Déconnexion
          </button>
        </div>
      </header>

      <main className="page">
        <div className="dash-head">
          <div>
            <p className="eyebrow">Performance marketing · {clinic.city}</p>
            <h1 className="display">{clinic.name}</h1>
            <p className="maj">
              {isMonth ? d.label : `Vue cumulée ${d.label}`} · mise à jour aujourd&apos;hui à 08h00
            </p>
          </div>
          <div className="seg" role="group" aria-label="Période">
            <button aria-pressed={isMonth} onClick={() => setPeriod("month")}>
              Ce mois-ci
            </button>
            <button aria-pressed={!isMonth} onClick={() => setPeriod("alltime")}>
              Depuis le début
            </button>
          </div>
        </div>

        <div className="kpi-grid">
          <Kpi
            label="Leads générés"
            value={fmtN(d.leads)}
            sub={isMonth ? "vs juin à la même date" : `cumul ${d.label}`}
            delta={deltas.leads}
            dotColor={tokens.leads}
          />
          <Kpi
            label="RDV confirmés"
            value={fmtN(d.rdv)}
            sub={isMonth ? "vs juin à la même date" : "rendez-vous obtenus"}
            delta={deltas.rdv}
            dotColor={tokens.rdv}
          />
          <Kpi
            label="Taux de conversion"
            value={fmtPct(conv)}
            sub="des leads deviennent des RDV"
            delta={deltas.conv}
          />
          <Kpi
            label="Dépenses publicitaires"
            value={fmtMAD(d.spend)}
            unit="MAD"
            sub={isMonth ? "budget engagé ce mois" : "investissement total"}
          />
          <Kpi
            label="Coût par lead"
            value={fmtMAD(cpl)}
            unit="MAD"
            sub={isMonth ? "vs juin" : "moyenne globale"}
            delta={deltas.cpl}
            deltaGoodWhenDown
          />
          <Kpi
            label="Coût par RDV"
            value={fmtMAD(cpr)}
            unit="MAD"
            sub={isMonth ? "vs juin" : "moyenne globale"}
            delta={deltas.cpr}
            deltaGoodWhenDown
          />
        </div>

        <div className="charts-row">
          <section className="card panel" aria-label="Évolution des leads et RDV">
            <div className="panel-head">
              <h3>Évolution hebdomadaire</h3>
              <span className="panel-sub">12 dernières semaines</span>
            </div>
            <div className="legend">
              <span className="chip">
                <span className="swatch" style={{ background: tokens.leads }} />
                Leads reçus
              </span>
              <span className="chip">
                <span className="swatch line" style={{ background: tokens.rdv }} />
                RDV confirmés
              </span>
            </div>
            <TrendChart data={clinic.weekly} tokens={tokens} />
          </section>

          <section className="card panel" aria-label="Répartition des leads par canal">
            <div className="panel-head">
              <h3>Leads par canal</h3>
              <span className="panel-sub">{isMonth ? "ce mois-ci" : "depuis le début"}</span>
            </div>
            <Sources sources={d.sources} total={d.leads} />
            <p className="sources-foot">
              Chaque lead est suivi de la publicité jusqu&apos;au rendez-vous, quel que soit le
              canal d&apos;entrée.
            </p>
          </section>
        </div>

        <section className="roi-card" aria-label="Retour sur investissement estimé">
          <div className="roi-intro">
            <h3>Retour sur investissement estimé</h3>
            <p>
              Ajustez la valeur moyenne d&apos;un patient pour votre cabinet — le calcul se met à
              jour instantanément.
            </p>
          </div>
          <div className="roi-field">
            <label htmlFor="patient-value">Valeur moyenne d&apos;un patient</label>
            <div className="roi-input">
              <input
                id="patient-value"
                type="number"
                min="0"
                step="100"
                inputMode="numeric"
                value={patientValue}
                onChange={(e) => setPatientValue(Number(e.target.value))}
              />
              <span className="suffix">MAD</span>
            </div>
          </div>
          <div className="roi-stat">
            <div className="stat-label">Revenu estimé</div>
            <div className="stat-value">
              {fmtMAD(revenue)}
              <span className="unit">MAD</span>
            </div>
            <div className="stat-sub">
              {fmtN(d.rdv)} RDV × {fmtMAD(patientValue || 0)} MAD
            </div>
          </div>
          <div className="roi-stat roi-main">
            <div className="stat-label">ROI estimé</div>
            <div className="stat-value">{roi.toFixed(1).replace(".", ",")}×</div>
            <div className="stat-sub">
              pour chaque dirham investi, {roi.toFixed(1).replace(".", ",")} récupérés
            </div>
          </div>
        </section>

        <footer className="dash-foot">
          <span className="foot-mark">ATLAS</span>
          <span>
            Données synchronisées quotidiennement depuis Meta Ads &amp; WhatsApp · Client Atlas
            depuis {clinic.since}
          </span>
        </footer>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Connexion                                                          */
/* ------------------------------------------------------------------ */

function Login({ onEnter }) {
  const [clinicId, setClinicId] = useState(CLINICS[0].id);
  return (
    <div className="login">
      <form
        className="login-card"
        onSubmit={(e) => {
          e.preventDefault();
          onEnter(clinicId);
        }}
      >
        <div className="login-mark">
          <p className="wordmark display">ATLAS</p>
          <hr className="rule" />
          <p className="tagline">Acquisition de patients</p>
        </div>
        <h2>Espace client — suivez vos résultats en direct</h2>
        <div className="field">
          <label htmlFor="clinic">Votre clinique</label>
          <select id="clinic" value={clinicId} onChange={(e) => setClinicId(e.target.value)}>
            {CLINICS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.city}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="pwd">Mot de passe</label>
          <input id="pwd" type="password" placeholder="••••••••" autoComplete="off" />
        </div>
        <button type="submit" className="btn-entrer">
          Accéder à mon tableau de bord
        </button>
        <p className="demo-note">Version de démonstration — aucun mot de passe requis.</p>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function App() {
  const [clinicId, setClinicId] = useState(null);
  const clinic = CLINICS.find((c) => c.id === clinicId);
  if (!clinic) return <Login onEnter={setClinicId} />;
  return <Dashboard clinic={clinic} onLogout={() => setClinicId(null)} />;
}

createRoot(document.getElementById("root")).render(<App />);
