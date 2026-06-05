"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { useEffect, useRef, useState } from "react"

import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { PAGES } from "@/utils/routes.utils"

import "./bilan-fusion.css"

// Couleurs par canal (DSFR)
const COL = {
  seo: "#000091",
  redir: "#009099",
  autres: "#929299",
  pda: "#2f4077",
  direct: "#00a95f",
  ref: "#37635a",
  ia: "#2f4077",
  social: "#929299",
}

const WEEK_LABELS: [string, string][] = [
  ["S15", "9–15 avr"],
  ["S16", "16–22 avr"],
  ["S17", "23–29 avr"],
  ["S18", "30 avr–6 mai"],
  ["S19", "7–13 mai"],
  ["S20", "14–20 mai"],
  ["S21", "21–27 mai"],
  ["S22", "28–31 mai"],
]
const N_WEEKS = WEEK_LABELS.length

// N (LBA, S15-S22) : totaux hebdo (Notion) × part canal (captures Matomo)
type RawSerie = { url: string; total: number[]; seo: number[]; redir: number[]; autres: number[] }
const DATA: RawSerie[] = [
  {
    url: "/salaire-alternant",
    total: [3354, 6872, 6989, 7482, 7841, 7140, 8663, 7313],
    seo: [44, 59, 59, 62, 57, 61, 61, 65],
    redir: [55, 40, 40, 36, 41, 37, 37, 33],
    autres: [1, 2, 2, 2, 2, 2, 2, 2],
  },
  {
    url: "/guide-alternant/comprendre-la-remuneration",
    total: [1242, 2288, 2268, 2337, 2100, 2298, 2190, 2163],
    seo: [99, 98, 98, 99, 98, 98, 97, 98],
    redir: [0, 0, 0, 0, 0, 0, 0, 0],
    autres: [1, 2, 2, 1, 2, 2, 3, 2],
  },
  {
    url: "/guide/decouvrir-l-alternance",
    total: [432, 543, 222, 180, 213, 186, 187, 145],
    seo: [0, 2, 0, 1, 0, 4, 3, 8],
    redir: [99, 98, 95, 96, 92, 90, 90, 79],
    autres: [1, 1, 5, 3, 8, 6, 7, 13],
  },
  {
    url: "/guide-cfa/la-carte-etudiant-des-metiers",
    total: [124, 147, 82, 104, 610, 640, 191, 139],
    seo: [10, 77, 55, 72, 11, 10, 48, 58],
    redir: [90, 23, 45, 28, 89, 89, 51, 37],
    autres: [0, 0, 0, 0, 0, 0, 1, 5],
  },
  {
    url: "/guide-alternant",
    total: [36, 184, 147, 166, 253, 257, 299, 223],
    seo: [94, 74, 56, 70, 77, 74, 82, 77],
    redir: [0, 0, 0, 0, 0, 0, 0, 0],
    autres: [6, 26, 44, 30, 23, 26, 18, 23],
  },
  {
    url: "/guide-alternant/role-et-missions-du-maitre-d-apprentissage-ou-tuteur",
    total: [160, 118, 78, 58, 76, 141, 235, 194],
    seo: [11, 50, 47, 60, 71, 77, 86, 78],
    redir: [88, 49, 51, 36, 28, 21, 13, 21],
    autres: [1, 1, 2, 4, 1, 2, 1, 1],
  },
  {
    url: "/guide-alternant/les-aides-financieres-et-materielles",
    total: [47, 54, 36, 52, 60, 95, 147, 125],
    seo: [68, 61, 31, 35, 48, 55, 63, 65],
    redir: [0, 0, 0, 0, 0, 0, 0, 0],
    autres: [32, 39, 69, 65, 52, 45, 37, 35],
  },
  {
    url: "/guide-alternant/la-rupture-de-contrat",
    total: [14, 48, 60, 75, 82, 94, 118, 103],
    seo: [100, 98, 88, 83, 79, 73, 73, 71],
    redir: [0, 0, 0, 0, 0, 0, 0, 0],
    autres: [0, 2, 12, 17, 21, 27, 27, 29],
  },
  {
    url: "/guide-alternant/preparer-son-projet-en-alternance",
    total: [44, 98, 26, 36, 31, 42, 50, 31],
    seo: [23, 55, 46, 28, 42, 55, 66, 58],
    redir: [77, 45, 50, 72, 55, 45, 34, 42],
    autres: [0, 0, 4, 0, 3, 0, 0, 0],
  },
  {
    url: "/guide-alternant/comment-signer-un-contrat-en-alternance",
    total: [10, 65, 16, 24, 25, 26, 103, 79],
    seo: [100, 100, 100, 100, 100, 100, 100, 100],
    redir: [0, 0, 0, 0, 0, 0, 0, 0],
    autres: [0, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    url: "/guide-recruteur/je-suis-employeur-public",
    total: [26, 65, 18, 35, 22, 50, 71, 51],
    seo: [0, 52, 56, 83, 68, 82, 85, 92],
    redir: [96, 46, 39, 14, 32, 10, 6, 4],
    autres: [4, 2, 5, 3, 0, 8, 9, 4],
  },
  {
    url: "/guide-recruteur/cerfa-apprentissage-et-professionnalisation",
    total: [12, 23, 18, 27, 15, 37, 69, 62],
    seo: [75, 87, 94, 85, 87, 95, 93, 92],
    redir: [0, 0, 0, 0, 0, 0, 0, 0],
    autres: [25, 13, 6, 15, 13, 5, 7, 8],
  },
  {
    url: "/guide-alternant/se-faire-accompagner",
    total: [27, 45, 20, 17, 15, 28, 41, 22],
    seo: [7, 33, 30, 35, 53, 75, 66, 86],
    redir: [93, 67, 70, 65, 40, 21, 27, 14],
    autres: [0, 0, 0, 0, 7, 4, 7, 0],
  },
  {
    url: "/guide/prevention-des-risques-professionnels-pour-les-apprentis",
    total: [17, 17, 9, 0, 6, 2, 9, 8],
    seo: [0, 24, 56, 0, 0, 0, 44, 50],
    redir: [100, 71, 22, 0, 100, 0, 56, 25],
    autres: [0, 5, 22, 0, 0, 100, 0, 25],
  },
  {
    url: "/guide-alternant/a-propos-des-formations",
    total: [0, 0, 0, 0, 0, 0, 26, 15],
    seo: [0, 0, 0, 0, 0, 0, 100, 100],
    redir: [0, 0, 0, 0, 0, 0, 0, 0],
    autres: [0, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    url: "/guide/apprentissage-et-handicap",
    total: [0, 0, 3, 6, 3, 6, 5, 10],
    seo: [0, 0, 100, 100, 100, 100, 100, 100],
    redir: [0, 0, 0, 0, 0, 0, 0, 0],
    autres: [0, 0, 0, 0, 0, 0, 0, 0],
  },
]

// N-1 (2025) : baseline PdA SEO + recapture, cumul fenêtre (export reprise PdA, GSC + source=pda)
type Cmp = { pda: number | null; seo?: number; redir?: number; note?: string }
const CMP: Record<string, Cmp> = {
  "/salaire-alternant": { pda: 22564, seo: 5846, redir: 16856, note: "À lire avec l’univers salaire (simulateur + page rémunération maillée), où la recapture SEO atteint 78 %." },
  "/guide-alternant/comprendre-la-remuneration": {
    pda: null,
    seo: 11773,
    redir: 0,
    note: "Contenu nouveau, maillé au simulateur : sa recapture est comptée dans l’univers salaire (78 %). Pas de baseline PdA propre.",
  },
  "/guide/decouvrir-l-alternance": {
    pda: 4930,
    seo: 316,
    redir: 1529,
    note: "Son trafic a migré vers les pages rémunération et rupture. À lire via l’univers découvrir (et l’univers salaire pour la rémunération).",
  },
  "/guide-cfa/la-carte-etudiant-des-metiers": { pda: 3098, seo: 418, redir: 251 },
  "/guide-alternant": { pda: 468, seo: 339, redir: 191 },
  "/guide-alternant/role-et-missions-du-maitre-d-apprentissage-ou-tuteur": { pda: 4335, seo: 522, redir: 325 },
  "/guide-alternant/les-aides-financieres-et-materielles": { pda: null, note: "Pas de baseline PdA isolée pour cette page dans l’export N-1." },
  "/guide-alternant/la-rupture-de-contrat": { pda: null, seo: 1787, redir: 0, note: "Contenu issu de l’ancienne page découvrir. À lire via l’univers découvrir." },
  "/guide-alternant/preparer-son-projet-en-alternance": { pda: 540, seo: 101, redir: 110 },
  "/guide-alternant/comment-signer-un-contrat-en-alternance": { pda: 1984, seo: 276, redir: 382 },
  "/guide-recruteur/je-suis-employeur-public": { pda: 583, seo: 241, redir: 72 },
  "/guide-recruteur/cerfa-apprentissage-et-professionnalisation": { pda: null, note: "Pas de baseline PdA isolée pour cette page dans l’export N-1." },
  "/guide-alternant/se-faire-accompagner": { pda: 268, seo: 53, redir: 65 },
  "/guide/prevention-des-risques-professionnels-pour-les-apprentis": { pda: 99, seo: 35, redir: 49, note: "Volume très faible : comparaison indicative." },
  "/guide-alternant/a-propos-des-formations": { pda: null, note: "Pas de baseline PdA isolée pour cette page dans l’export N-1." },
  "/guide/apprentissage-et-handicap": { pda: 2697, seo: 55, redir: 0, note: "Recapture SEO encore très faible sur cette page." },
}

type Serie = RawSerie & { peri?: boolean; cluster?: boolean; absSeo: number[]; absRedir: number[]; absAutres: number[]; cmp?: Cmp }

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)
const frFmt = (x: number) => Math.round(x).toLocaleString("fr-FR")

function aggregate(members: RawSerie[]) {
  const T = Array(N_WEEKS).fill(0) as number[]
  const S = Array(N_WEEKS).fill(0) as number[]
  const R = Array(N_WEEKS).fill(0) as number[]
  const A = Array(N_WEEKS).fill(0) as number[]
  members.forEach((d) => {
    for (let i = 0; i < N_WEEKS; i++) {
      T[i] += d.total[i]
      S[i] += Math.round((d.total[i] * d.seo[i]) / 100)
      R[i] += Math.round((d.total[i] * d.redir[i]) / 100)
      A[i] += Math.round((d.total[i] * d.autres[i]) / 100)
    }
  })
  const pc = (x: number, i: number) => (T[i] ? Math.round((x / T[i]) * 100) : 0)
  return {
    total: T,
    seo: S.map((x, i) => pc(x, i)),
    redir: R.map((x, i) => pc(x, i)),
    autres: A.map((x, i) => pc(x, i)),
    absSeo: S,
    absRedir: R,
    absAutres: A,
  }
}

function buildPerimetre(): Serie {
  return {
    url: "Périmètre complet — toutes les pages",
    peri: true,
    ...aggregate(DATA),
    // Baseline like-for-like (SEO = Search Console)
    cmp: { pda: 35326, seo: 22484, redir: 25787 },
  }
}

type ClusterDef = { url: string; members: string[]; cmp: Cmp }
const CLUSTERS: ClusterDef[] = [
  {
    url: "Univers salaire (salaire-alternant + rémunération)",
    members: ["/salaire-alternant", "/guide-alternant/comprendre-la-remuneration"],
    cmp: {
      pda: 22564,
      seo: 17619,
      redir: 16856,
      note: "Regroupe le simulateur et la page rémunération qui lui est maillée. Baseline PdA = simulateur (22 564). Recapture SEO seule : 78 %.",
    },
  },
  {
    url: "Univers découvrir (découvrir + rupture)",
    members: ["/guide/decouvrir-l-alternance", "/guide-alternant/la-rupture-de-contrat"],
    cmp: {
      pda: 4930,
      seo: 2103,
      redir: 1529,
      note: "Regroupe l’ancienne page découvrir et la page rupture qui en est issue. Une partie du contenu d’origine a aussi nourri la page rémunération (comptée dans l’univers salaire), donc ce regroupement sous-estime encore la recapture réelle.",
    },
  },
]

function buildCluster(def: ClusterDef): Serie {
  const members = def.members.map((u) => DATA.find((d) => d.url === u)).filter((d): d is RawSerie => Boolean(d))
  return { url: def.url, cluster: true, ...aggregate(members), cmp: def.cmp }
}

function withAbs(d: RawSerie): Serie {
  return {
    ...d,
    absSeo: d.total.map((t, i) => Math.round((t * d.seo[i]) / 100)),
    absRedir: d.total.map((t, i) => Math.round((t * d.redir[i]) / 100)),
    absAutres: d.total.map((t, i) => Math.round((t * d.autres[i]) / 100)),
    cmp: CMP[d.url],
  }
}

const ALL: Serie[] = [buildPerimetre(), ...CLUSTERS.map(buildCluster), ...DATA.map(withAbs)]
const GROUPN = 1 + CLUSTERS.length

const getCmp = (d: Serie): Cmp => d.cmp ?? { pda: null }

// --- Vue agrégée « Audience totale » : PdA 2025 vs LBA 2026, empilé par canal (SEO = Search Console) ---
type AggChannel = "seo" | "direct" | "ref" | "ia" | "social" | "redir"
const AGG = {
  pda: { seo: 35326, direct: 0, ref: 36348, ia: 0, social: 0, redir: 0 } as Record<AggChannel, number>,
  lba: { seo: 22484, direct: 29723, ref: 1184, ia: 1079, social: 49, redir: 25787 } as Record<AggChannel, number>,
}
const AGG_TOT_PDA = 71674
const AGG_TOT_LBA = 80306
const AGG_CHANNELS: { key: AggChannel; label: string }[] = [
  { key: "seo", label: "SEO" },
  { key: "direct", label: "Accès direct" },
  { key: "ref", label: "Référents" },
  { key: "ia", label: "IA / LLM" },
  { key: "social", label: "Social" },
  { key: "redir", label: "Redirection 301" },
]

type Mode = "pct" | "abs" | "cmp" | "tot"
const MODES: [Mode, string][] = [
  ["pct", "% du trafic"],
  ["abs", "Visites absolues"],
  ["cmp", "Comparaison 2025"],
  ["tot", "Audience totale"],
]

// --- Échelle / graduations « jolies » pour l'axe Y ---
function niceNum(x: number, round: boolean) {
  const exp = Math.floor(Math.log10(x))
  const f = x / 10 ** exp
  let nf: number
  if (round) {
    nf = f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10
  } else {
    nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10
  }
  return nf * 10 ** exp
}

// --- Géométrie des graphes (système de coordonnées du viewBox) ---
const VB_W = 920
const VB_H = 360
const M = { left: 48, right: 16, top: 26, bottom: 44 }
const PLOT_W = VB_W - M.left - M.right
const PLOT_H = VB_H - M.top - M.bottom

type Tooltip = { left: number; top: number; text: string } | null

function useChartTooltip() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<Tooltip>(null)
  const show = (e: React.MouseEvent, text: string) => {
    const wrap = wrapRef.current
    if (!wrap) return
    const r = wrap.getBoundingClientRect()
    setTooltip({ left: e.clientX - r.left, top: e.clientY - r.top, text })
  }
  const hide = () => setTooltip(null)
  return { wrapRef, tooltip, show, hide }
}

// Graphe hebdomadaire empilé (trafic propre / redirection / autres) pour les modes % et absolu.
function WeeklyChart({ d, mode }: { d: Serie; mode: Mode }) {
  const { wrapRef, tooltip, show, hide } = useChartTooltip()
  const isPct = mode === "pct"

  const segments = [
    { key: "seo", color: COL.seo, label: "Trafic propre", values: isPct ? d.seo : d.absSeo },
    { key: "redir", color: COL.redir, label: "Redirection 301", values: isPct ? d.redir : d.absRedir },
    { key: "autres", color: COL.autres, label: "Autres", values: isPct ? d.autres : d.absAutres },
  ]

  const rawMax = Math.max(...d.total, 1)
  const yStep = isPct ? 20 : niceNum(rawMax / 5, true)
  const yMax = isPct ? 100 : yStep * Math.ceil(rawMax / yStep)
  const ticks: number[] = []
  for (let t = 0; t <= yMax + 0.5; t += yStep) ticks.push(t)

  const y = (v: number) => M.top + PLOT_H * (1 - v / yMax)
  const band = PLOT_W / N_WEEKS
  const barW = band * 0.62
  const minAbsLabel = Math.max(20, sum(d.total) / 120)

  return (
    <div className="chartwrap" ref={wrapRef}>
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label={`Graphe du trafic de ${d.url}`}>
        {ticks.map((t) => (
          <g key={`y${t}`}>
            <line x1={M.left} x2={M.left + PLOT_W} y1={y(t)} y2={y(t)} stroke="rgba(0,0,0,.06)" />
            <text x={M.left - 8} y={y(t) + 4} textAnchor="end" fontSize="12" fill="#666">
              {isPct ? `${t}%` : frFmt(t)}
            </text>
          </g>
        ))}

        {WEEK_LABELS.map((wl, i) => {
          const cx = M.left + band * i + band / 2
          const left = cx - barW / 2
          let acc = 0
          const rects = segments.map((seg) => {
            const v = seg.values[i]
            const y0 = y(acc)
            const y1 = y(acc + v)
            acc += v
            const h = Math.max(0, y0 - y1)
            const showLabel = seg.key !== "autres" && (isPct ? v >= 6 : v >= minAbsLabel)
            const tip = `${seg.label} : ${isPct ? `${v}%` : `${frFmt(v)} visites`}`
            return (
              <g key={seg.key}>
                <rect x={left} y={y1} width={barW} height={h} fill={seg.color} onMouseMove={(e) => show(e, tip)} onMouseLeave={hide}>
                  <title>{tip}</title>
                </rect>
                {showLabel && h >= 14 && (
                  <text x={cx} y={(y0 + y1) / 2 + 4} textAnchor="middle" fontSize="11" fontWeight={500} fill="#fff" pointerEvents="none">
                    {isPct ? `${v}%` : frFmt(v)}
                  </text>
                )}
              </g>
            )
          })
          return (
            <g key={wl[0]}>
              {rects}
              {isPct && (
                <text x={cx} y={y(yMax) - 7} textAnchor="middle" fontSize="11" fontWeight={700} fill="#161616">
                  {frFmt(d.total[i])}
                </text>
              )}
              <text x={cx} y={M.top + PLOT_H + 17} textAnchor="middle" fontSize="12" fontWeight={500} fill="#161616">
                {wl[0]}
              </text>
              <text x={cx} y={M.top + PLOT_H + 32} textAnchor="middle" fontSize="11" fill="#666">
                {wl[1]}
              </text>
            </g>
          )
        })}
      </svg>
      {tooltip && (
        <div className="tooltip" style={{ left: tooltip.left, top: tooltip.top }}>
          {tooltip.text}
        </div>
      )}
    </div>
  )
}

// Graphe 2 barres empilées (PdA vs LBA) — partagé par « Comparaison 2025 » et « Audience totale ».
type BarDataset = { label: string; color: string; data: [number, number] }
function TwoBarChart({ labels, datasets, ariaLabel, minLabel }: { labels: [string, string]; datasets: BarDataset[]; ariaLabel: string; minLabel: number }) {
  const { wrapRef, tooltip, show, hide } = useChartTooltip()

  const totals = [0, 1].map((i) => sum(datasets.map((ds) => ds.data[i])))
  const rawMax = Math.max(...totals, 1)
  const yStep = niceNum(rawMax / 5, true)
  const yMax = yStep * Math.ceil(rawMax / yStep)
  const ticks: number[] = []
  for (let t = 0; t <= yMax + 0.5; t += yStep) ticks.push(t)

  const y = (v: number) => M.top + PLOT_H * (1 - v / yMax)
  const band = PLOT_W / 2
  const barW = Math.min(170, band * 0.5)

  return (
    <div className="chartwrap" ref={wrapRef}>
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label={ariaLabel}>
        {ticks.map((t) => (
          <g key={`y${t}`}>
            <line x1={M.left} x2={M.left + PLOT_W} y1={y(t)} y2={y(t)} stroke="rgba(0,0,0,.06)" />
            <text x={M.left - 8} y={y(t) + 4} textAnchor="end" fontSize="12" fill="#666">
              {frFmt(t)}
            </text>
          </g>
        ))}

        {labels.map((label, i) => {
          const cx = M.left + band * i + band / 2
          const left = cx - barW / 2
          let acc = 0
          const rects = datasets.map((ds) => {
            const v = ds.data[i]
            if (v <= 0) return null
            const y0 = y(acc)
            const y1 = y(acc + v)
            acc += v
            const h = Math.max(0, y0 - y1)
            const tip = `${ds.label} : ${frFmt(v)} visites`
            return (
              <g key={ds.label}>
                <rect x={left} y={y1} width={barW} height={h} fill={ds.color} onMouseMove={(e) => show(e, tip)} onMouseLeave={hide}>
                  <title>{tip}</title>
                </rect>
                {v >= minLabel && h >= 14 && (
                  <text x={cx} y={(y0 + y1) / 2 + 4} textAnchor="middle" fontSize="11" fontWeight={500} fill="#fff" pointerEvents="none">
                    {frFmt(v)}
                  </text>
                )}
              </g>
            )
          })
          return (
            <g key={label}>
              {rects}
              <text x={cx} y={M.top + PLOT_H + 24} textAnchor="middle" fontSize="13" fontWeight={500} fill="#161616">
                {label}
              </text>
            </g>
          )
        })}
      </svg>
      {tooltip && (
        <div className="tooltip" style={{ left: tooltip.left, top: tooltip.top }}>
          {tooltip.text}
        </div>
      )}
    </div>
  )
}

type CardTuple = [string, string, string]
type Info = { cls: string; tag: string; txt: string }

export default function BilanFusionClient() {
  const [current, setCurrent] = useState(0)
  const [mode, setMode] = useState<Mode>("pct")
  const [open, setOpen] = useState(false)
  const ddRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ddRef.current && !ddRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("click", onClick)
    return () => document.removeEventListener("click", onClick)
  }, [])

  const d = ALL[current]
  const cmp = getCmp(d)
  const sumTot = sum(d.total)
  const partSeo = sumTot ? Math.round((sum(d.absSeo) / sumTot) * 100) : 0
  const partRed = sumTot ? Math.round((sum(d.absRedir) / sumTot) * 100) : 0
  const firstSeo = d.seo[0]
  const lastSeo = d.seo[7]
  const trend = lastSeo - firstSeo

  let cards: CardTuple[]
  let info: Info
  let note: React.ReactNode = null

  if (mode === "cmp") {
    if (cmp.pda) {
      const lba = (cmp.seo ?? 0) + (cmp.redir ?? 0)
      const cov = Math.round((lba / cmp.pda) * 100)
      const rec = Math.round(((cmp.seo ?? 0) / cmp.pda) * 100)
      cards = [
        ["Baseline PdA SEO (2025)", frFmt(cmp.pda), ""],
        ["LBA 2026 — SEO + redirection", frFmt(lba), `couverture ${cov} %`],
        ["Recapture SEO seul", `${rec} %`, `${frFmt(cmp.seo ?? 0)} visites GSC`],
        ["Couverture du trafic 2025", `${cov} %`, cov >= 100 ? "critère rempli" : "en cours"],
      ]
      info =
        lba >= cmp.pda
          ? { cls: "ok", tag: "Critère rempli", txt: `Redirection + SEO LBA (${frFmt(lba)}) ≥ baseline PdA SEO 2025 (${frFmt(cmp.pda)}). Le trafic est préservé.` }
          : { cls: "warn", tag: "À consolider", txt: `Redirection + SEO LBA (${frFmt(lba)}) couvre ${cov} % de la baseline PdA SEO 2025 (${frFmt(cmp.pda)}).` }
    } else {
      cards = [
        ["Baseline PdA SEO (2025)", "n/d", ""],
        ["SEO LBA 2026 (GSC)", cmp.seo != null ? frFmt(cmp.seo) : "n/d", ""],
        ["Redirection 301", cmp.redir != null ? frFmt(cmp.redir) : "n/d", ""],
        ["Couverture du trafic 2025", "n/d", ""],
      ]
      info = { cls: "low", tag: "Comparaison indisponible", txt: cmp.note ?? "Pas de baseline PdA isolée pour cette page." }
    }
    note = (
      <div className="note">
        <strong>Lecture :</strong> cette vue compare <strong>uniquement la dimension SEO</strong>, pas le trafic total. Ces pages reçoivent {frFmt(sumTot)} visites tous canaux
        confondus (dont ~30 000 en accès direct — voir les vues % et Visites absolues) ; ici on isole la seule question « a-t-on gardé le SEO du PdA ? ». Le SEO = trafic organique
        mesuré dans Search Console sur le périmètre exact ; il diffère du « trafic propre » des autres vues, qui mélange organique et accès directs.
        {cmp.note && (
          <>
            <br />
            {cmp.note}
          </>
        )}
      </div>
    )
  } else if (mode === "tot") {
    cards = [
      ["Audience totale PdA 2025", frFmt(AGG_TOT_PDA), "SEO + référents"],
      ["Audience totale LBA 2026", frFmt(AGG_TOT_LBA), "toutes sources"],
      ["Socle durable — SEO LBA", frFmt(AGG.lba.seo), "64 % du SEO PdA"],
      ["Redirection (transitoire)", frFmt(AGG.lba.redir), "s’efface"],
    ]
    info = {
      cls: "",
      tag: "À lire",
      txt: `Toutes sources confondues, LBA (~${frFmt(AGG_TOT_LBA)}) est au niveau du PdA (~${frFmt(AGG_TOT_PDA)}). L’écart est porté par le direct et la redirection 301 (transitoire) ; le socle durable, le SEO, est encore en rattrapage (64 %, cf. Comparaison 2025).`,
    }
    note = (
      <div className="note">
        <strong>SEO = Search Console</strong> ; autres canaux = Matomo (~2 k d’écart d’unité assumé). Côté PdA 2025, l’accès direct est quasi nul (Eulerian) ; les référents (liens
        partenaires) arrivent aujourd’hui via la redirection 301.
      </div>
    )
  } else {
    cards = [
      ["Visites sur la période", frFmt(sumTot), ""],
      ["Part trafic propre", `${partSeo} %`, ""],
      ["Part redirection 301", `${partRed} %`, ""],
      ["Tendance trafic propre", `${trend >= 0 ? "+" : ""}${trend} pts`, `S15 ${firstSeo} % → S22 ${lastSeo} %`],
    ]
    if (d.peri) {
      info = {
        cls: "ok",
        tag: "Vue d’ensemble",
        txt: "Sur l’ensemble du périmètre, le trafic propre (organique + direct) prend le pas sur la redirection 301 : la bascule fonctionne sans perte de trafic.",
      }
    } else if (sumTot < 100) {
      info = { cls: "low", tag: "Volume faible", txt: "Trafic trop faible sur la période pour conclure." }
    } else if (partRed < 2) {
      info = { cls: "ok", tag: "Autonome", txt: "Page autonome : trafic quasi exclusivement propre (organique + direct), jamais dépendante de la redirection 301." }
    } else if (lastSeo >= d.redir[7] && firstSeo < 50) {
      info = { cls: "ok", tag: "Bascule réussie", txt: "Le trafic propre a pris le pas sur la redirection : la dépendance au PdA s’efface nettement." }
    } else if (d.redir[7] > lastSeo) {
      info = { cls: "warn", tag: "À accélérer", txt: "Encore dépendante de la redirection 301 en fin de période." }
    } else {
      info = { cls: "", tag: "En transition", txt: "Le trafic propre progresse mais la bascule n’est pas encore stabilisée." }
    }
    if (mode === "pct") {
      note = (
        <div className="note">
          Le « trafic propre » = organique (Google) + accès directs ; il ne s’agit pas du SEO strict (voir la vue Comparaison 2025). En mode %, le nombre au-dessus de chaque barre
          indique <strong>le total de visites</strong> derrière ces 100 %.
        </div>
      )
    }
  }

  const isTot = mode === "tot"
  const cardColor = (k: string) => (k === "Part trafic propre" ? COL.seo : k === "Part redirection 301" ? COL.redir : undefined)

  let legend: React.ReactNode
  if (mode === "cmp") {
    legend = (
      <div className="legend">
        <span>
          <i style={{ background: COL.pda }} />
          SEO PdA 2025 (baseline)
        </span>
        <span>
          <i style={{ background: COL.seo }} />
          SEO LBA 2026 (GSC)
        </span>
        <span>
          <i style={{ background: COL.redir }} />
          Redirection 301
        </span>
      </div>
    )
  } else if (isTot) {
    legend = (
      <div className="legend">
        {AGG_CHANNELS.map((ch) => (
          <span key={ch.key}>
            <i style={{ background: COL[ch.key] }} />
            {ch.label}
          </span>
        ))}
      </div>
    )
  } else {
    legend = (
      <div className="legend">
        <span>
          <i style={{ background: COL.seo }} />
          Trafic propre (organique + direct)
        </span>
        <span>
          <i style={{ background: COL.redir }} />
          Redirection 301 (PdA)
        </span>
        <span>
          <i style={{ background: COL.autres }} />
          Autres
        </span>
      </div>
    )
  }

  let chart: React.ReactNode
  if (mode === "cmp") {
    chart = (
      <TwoBarChart
        labels={["PdA 2025", "LBA 2026"]}
        ariaLabel={`Comparaison SEO 2025 vs 2026 — ${d.url}`}
        minLabel={1}
        datasets={[
          { label: "SEO PdA 2025", color: COL.pda, data: [cmp.pda ?? 0, 0] },
          { label: "SEO LBA 2026", color: COL.seo, data: [0, cmp.seo ?? 0] },
          { label: "Redirection 301", color: COL.redir, data: [0, cmp.redir ?? 0] },
        ]}
      />
    )
  } else if (isTot) {
    chart = (
      <TwoBarChart
        labels={["PdA 2025", "LBA 2026"]}
        ariaLabel="Audience totale PdA 2025 vs LBA 2026 par canal"
        minLabel={900}
        datasets={AGG_CHANNELS.map((ch) => ({ label: ch.label, color: COL[ch.key], data: [AGG.pda[ch.key], AGG.lba[ch.key]] }))}
      />
    )
  } else {
    chart = <WeeklyChart d={d} mode={mode} />
  }

  return (
    <Box>
      <Breadcrumb pages={[PAGES.static.bilanFusionPortail]} />
      <DefaultContainer>
        <Typography id="editorial-content-container" component="h1" variant="h1" sx={{ mb: fr.spacing("4v"), color: fr.colors.decisions.text.default.info.default }}>
          Bilan de la fusion du Portail de l&apos;alternance et de La bonne alternance
        </Typography>
        <Typography sx={{ mb: fr.spacing("8v") }}>
          Page de démonstration — suivi du trafic des pages reprises du Portail de l’alternance après la bascule des redirections vers La bonne alternance. On distingue le
          <strong> trafic propre</strong> (organique + accès directs, qui survit à une coupure du Portail) de la <strong>redirection 301</strong> (qui disparaît à la coupure).
        </Typography>

        <Box className="bilanFusion">
          <div className="bandeau">
            <h2>Trafic par URL — périmètre fusion PdA × LBA</h2>
            <p>Trafic propre / redirection 301 / autres, S15–S22 (avril–mai 2026). Comparaison 2025 : export reprise PdA (GSC + source = pda).</p>
          </div>

          <div className="controls">
            {!isTot && (
              <div className="field">
                <label htmlFor="bilan-dd-btn">Page</label>
                <div className="dd" ref={ddRef}>
                  <button type="button" id="bilan-dd-btn" className="dd-btn" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
                    <span className="lab">{d.url}</span>
                    <span className="vis">{frFmt(sumTot)} visites</span>
                    <span className="car">▾</span>
                  </button>
                  {open && (
                    <div className="dd-panel" role="listbox">
                      {ALL.map((x, i) => (
                        <button
                          type="button"
                          key={x.url}
                          className={`dd-opt${i < GROUPN ? ` grp${i === GROUPN - 1 ? " grp-last" : ""}` : ""}`}
                          role="option"
                          aria-selected={i === current}
                          onClick={() => {
                            setCurrent(i)
                            setOpen(false)
                          }}
                        >
                          <span className="u">{x.url}</span>
                          <span className="n">{frFmt(sum(x.total))} visites</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {!isTot && (
              <div className="nav">
                <button type="button" aria-label="Précédent" onClick={() => setCurrent((c) => (c - 1 + ALL.length) % ALL.length)}>
                  ‹
                </button>
                <button type="button" aria-label="Suivant" onClick={() => setCurrent((c) => (c + 1) % ALL.length)}>
                  ›
                </button>
              </div>
            )}

            <div className="toggle" role="group" aria-label="Mode d’affichage">
              {MODES.map((m) => (
                <button type="button" key={m[0]} className={mode === m[0] ? "on" : ""} onClick={() => setMode(m[0])}>
                  {m[1]}
                </button>
              ))}
            </div>
          </div>

          <div className="cards">
            {cards.map((c) => (
              <div className="card" key={c[0]}>
                <div className="k">{c[0]}</div>
                <div className="v" style={{ color: cardColor(c[0]) }}>
                  {c[1]}
                </div>
                {c[2] && <div className="s">{c[2]}</div>}
              </div>
            ))}
          </div>

          <div className={`insight ${info.cls}`}>
            <span className="tag">{info.tag}</span>
            <span className="txt">{info.txt}</span>
          </div>

          {legend}

          {chart}

          {note}

          <p className="foot">N (2026) : totaux hebdo Notion × part canal Matomo (estimations). N-1 (2025) : export reprise PdA, cumul fenêtre. SEO = Search Console.</p>
        </Box>
      </DefaultContainer>
    </Box>
  )
}
