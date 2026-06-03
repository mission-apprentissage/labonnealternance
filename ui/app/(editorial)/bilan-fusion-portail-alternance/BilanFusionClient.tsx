"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { useEffect, useRef, useState } from "react"

import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { PAGES } from "@/utils/routes.utils"

import "./bilan-fusion.css"

// --- Données source (Matomo, trafic par URL, S15→S22 — avril/mai 2026) ---
type RawSerie = { url: string; total: number[]; propre: number[]; redir: number[]; autres: number[] }

const RAW: RawSerie[] = [
  {
    url: "/guide-alternant",
    total: [36, 184, 147, 166, 253, 257, 299, 223],
    propre: [94, 74, 56, 70, 77, 74, 82, 77],
    redir: [0, 0, 0, 0, 0, 0, 0, 0],
    autres: [6, 26, 44, 30, 23, 26, 18, 23],
  },
  {
    url: "/guide-alternant/a-propos-des-formations",
    total: [0, 0, 0, 0, 0, 0, 26, 15],
    propre: [0, 0, 0, 0, 0, 0, 100, 100],
    redir: [0, 0, 0, 0, 0, 0, 0, 0],
    autres: [0, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    url: "/guide-alternant/comment-signer-un-contrat-en-alternance",
    total: [10, 65, 16, 24, 25, 26, 103, 79],
    propre: [100, 100, 100, 100, 100, 100, 100, 100],
    redir: [0, 0, 0, 0, 0, 0, 0, 0],
    autres: [0, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    url: "/guide-alternant/comprendre-la-remuneration",
    total: [1242, 2288, 2268, 2337, 2100, 2298, 2190, 2163],
    propre: [99, 98, 98, 99, 98, 98, 97, 98],
    redir: [0, 0, 0, 0, 0, 0, 0, 0],
    autres: [1, 2, 2, 1, 2, 2, 3, 2],
  },
  {
    url: "/guide-alternant/conseils-et-astuces-pour-trouver-un-employeur",
    total: [0, 0, 2, 3, 1, 3, 4, 2],
    propre: [0, 0, 0, 0, 0, 0, 0, 0],
    redir: [0, 0, 0, 0, 0, 0, 0, 0],
    autres: [0, 0, 100, 100, 100, 100, 100, 100],
  },
  {
    url: "/guide-alternant/la-rupture-de-contrat",
    total: [14, 48, 60, 75, 82, 94, 118, 103],
    propre: [100, 98, 88, 83, 79, 73, 73, 71],
    redir: [0, 0, 0, 0, 0, 0, 0, 0],
    autres: [0, 2, 12, 17, 21, 27, 27, 29],
  },
  {
    url: "/guide-alternant/les-aides-financieres-et-materielles",
    total: [47, 54, 36, 52, 60, 95, 147, 125],
    propre: [68, 61, 31, 35, 48, 55, 63, 65],
    redir: [0, 0, 0, 0, 0, 0, 0, 0],
    autres: [32, 39, 69, 65, 52, 45, 37, 35],
  },
  {
    url: "/guide-alternant/preparer-son-projet-en-alternance",
    total: [44, 98, 26, 36, 31, 42, 50, 31],
    propre: [23, 55, 46, 28, 42, 55, 66, 58],
    redir: [77, 45, 50, 72, 55, 45, 34, 42],
    autres: [0, 0, 4, 0, 3, 0, 0, 0],
  },
  {
    url: "/guide-alternant/role-et-missions-du-maitre-d-apprentissage-ou-tuteur",
    total: [160, 118, 78, 58, 76, 141, 235, 194],
    propre: [11, 50, 47, 60, 71, 77, 86, 78],
    redir: [88, 49, 51, 36, 28, 21, 13, 21],
    autres: [1, 1, 1, 3, 1, 3, 0, 2],
  },
  {
    url: "/guide-alternant/se-faire-accompagner",
    total: [27, 45, 20, 17, 15, 28, 41, 22],
    propre: [7, 33, 30, 35, 53, 75, 66, 86],
    redir: [93, 67, 70, 65, 40, 21, 27, 14],
    autres: [0, 0, 0, 0, 7, 4, 7, 0],
  },
  {
    url: "/guide-cfa/la-carte-etudiant-des-metiers",
    total: [124, 147, 82, 104, 610, 640, 191, 139],
    propre: [10, 77, 55, 72, 11, 10, 48, 58],
    redir: [90, 23, 45, 28, 89, 89, 51, 37],
    autres: [0, 0, 0, 0, 0, 1, 1, 4],
  },
  {
    url: "/guide-recruteur/cerfa-apprentissage-et-professionnalisation",
    total: [12, 23, 18, 27, 15, 37, 69, 62],
    propre: [75, 87, 94, 85, 87, 95, 93, 92],
    redir: [0, 0, 0, 0, 0, 0, 0, 0],
    autres: [25, 13, 6, 15, 13, 5, 7, 8],
  },
  {
    url: "/guide-recruteur/je-suis-employeur-public",
    total: [26, 65, 18, 35, 22, 50, 71, 51],
    propre: [0, 52, 56, 83, 68, 82, 85, 92],
    redir: [96, 46, 39, 14, 32, 10, 6, 4],
    autres: [4, 2, 6, 3, 0, 8, 10, 4],
  },
  {
    url: "/guide/apprentissage-et-handicap",
    total: [0, 0, 3, 6, 3, 6, 5, 10],
    propre: [0, 0, 100, 100, 100, 100, 100, 100],
    redir: [0, 0, 0, 0, 0, 0, 0, 0],
    autres: [0, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    url: "/guide/decouvrir-l-alternance",
    total: [432, 543, 222, 180, 213, 186, 187, 145],
    propre: [0, 2, 0, 1, 0, 4, 3, 8],
    redir: [99, 98, 95, 96, 92, 90, 90, 79],
    autres: [1, 1, 5, 3, 8, 6, 7, 13],
  },
  {
    url: "/guide/prevention-des-risques-professionnels-pour-les-apprentis",
    total: [17, 17, 9, 0, 6, 2, 9, 8],
    propre: [0, 24, 56, 0, 0, 0, 44, 50],
    redir: [100, 71, 22, 0, 100, 0, 56, 25],
    autres: [0, 6, 22, 0, 0, 100, 0, 25],
  },
  {
    url: "/salaire-alternant",
    total: [3354, 6872, 6989, 7482, 7841, 7140, 8663, 7313],
    propre: [44, 59, 59, 62, 57, 61, 61, 65],
    redir: [55, 40, 40, 36, 41, 37, 37, 33],
    autres: [1, 2, 2, 2, 2, 2, 2, 2],
  },
]

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

const COL = { propre: "#00a95f", redir: "#009099", autres: "#929299" }

type Serie = RawSerie & { peri?: boolean; absP: number[]; absR: number[]; absA: number[] }

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)
const frFmt = (x: number) => Math.round(x).toLocaleString("fr-FR")

function buildPerimetre(): Serie {
  const n = 8
  const T = Array(n).fill(0) as number[]
  const P = Array(n).fill(0) as number[]
  const R = Array(n).fill(0) as number[]
  const A = Array(n).fill(0) as number[]
  RAW.forEach((d) => {
    for (let i = 0; i < n; i++) {
      T[i] += d.total[i]
      P[i] += Math.round((d.total[i] * d.propre[i]) / 100)
      R[i] += Math.round((d.total[i] * d.redir[i]) / 100)
      A[i] += Math.round((d.total[i] * d.autres[i]) / 100)
    }
  })
  const pc = (x: number, i: number) => (T[i] ? Math.round((x / T[i]) * 100) : 0)
  return {
    url: "Périmètre complet — toutes les pages",
    peri: true,
    total: T,
    propre: P.map((x, i) => pc(x, i)),
    redir: R.map((x, i) => pc(x, i)),
    autres: A.map((x, i) => pc(x, i)),
    absP: P,
    absR: R,
    absA: A,
  }
}

function withAbs(d: RawSerie): Serie {
  return {
    ...d,
    absP: d.total.map((t, i) => Math.round((t * d.propre[i]) / 100)),
    absR: d.total.map((t, i) => Math.round((t * d.redir[i]) / 100)),
    absA: d.total.map((t, i) => Math.round((t * d.autres[i]) / 100)),
  }
}

const ALL: Serie[] = [buildPerimetre(), ...RAW.map(withAbs)]

type Mode = "pct" | "abs"
const MODES: [Mode, string][] = [
  ["pct", "% du trafic"],
  ["abs", "Visites absolues"],
]

// --- Échelle / graduations « jolies » pour l'axe Y en mode absolu ---
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

// --- Géométrie du graphe (système de coordonnées du viewBox) ---
const VB_W = 920
const VB_H = 360
const M = { left: 48, right: 16, top: 26, bottom: 44 }
const PLOT_W = VB_W - M.left - M.right
const PLOT_H = VB_H - M.top - M.bottom
const BAND = PLOT_W / 8
const BAR_W = BAND * 0.62

type Tooltip = { left: number; top: number; text: string } | null

function StackedBarChart({ d, mode }: { d: Serie; mode: Mode }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<Tooltip>(null)
  const isPct = mode === "pct"

  const segments = [
    { key: "propre", color: COL.propre, label: "Trafic propre", values: isPct ? d.propre : d.absP },
    { key: "redir", color: COL.redir, label: "Redirection", values: isPct ? d.redir : d.absR },
    { key: "autres", color: COL.autres, label: "Autres", values: isPct ? d.autres : d.absA },
  ]

  const rawMax = Math.max(...d.total, 1)
  const yStep = isPct ? 20 : niceNum(rawMax / 5, true)
  const yMax = isPct ? 100 : yStep * Math.ceil(rawMax / yStep)
  const ticks: number[] = []
  for (let t = 0; t <= yMax + 0.5; t += yStep) ticks.push(t)

  const y = (v: number) => M.top + PLOT_H * (1 - v / yMax)
  const big = sum(d.total) / 120
  const minAbsLabel = Math.max(20, big)

  const showTooltip = (e: React.MouseEvent, text: string) => {
    const wrap = wrapRef.current
    if (!wrap) return
    const r = wrap.getBoundingClientRect()
    setTooltip({ left: e.clientX - r.left, top: e.clientY - r.top, text })
  }

  return (
    <div className="chartwrap" ref={wrapRef}>
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label={`Graphe du trafic de ${d.url}`}>
        {/* Graduations + lignes horizontales */}
        {ticks.map((t) => (
          <g key={`y${t}`}>
            <line x1={M.left} x2={M.left + PLOT_W} y1={y(t)} y2={y(t)} stroke="rgba(0,0,0,.06)" />
            <text x={M.left - 8} y={y(t) + 4} textAnchor="end" fontSize="12" fill="#666">
              {isPct ? `${t}%` : frFmt(t)}
            </text>
          </g>
        ))}

        {/* Barres empilées par semaine */}
        {WEEK_LABELS.map((wl, i) => {
          const cx = M.left + BAND * i + BAND / 2
          const left = cx - BAR_W / 2
          let acc = 0
          const rects = segments.map((seg) => {
            const v = seg.values[i]
            const y0 = y(acc)
            const y1 = y(acc + v)
            acc += v
            const h = Math.max(0, y0 - y1)
            const labelText = isPct ? `${v}%` : frFmt(v)
            const showLabel = seg.key !== "autres" && (isPct ? v >= 6 : v >= minAbsLabel)
            const tip = `${seg.label} : ${isPct ? `${v}%` : `${frFmt(v)} visites`}`
            return (
              <g key={seg.key}>
                <rect x={left} y={y1} width={BAR_W} height={h} fill={seg.color} onMouseMove={(e) => showTooltip(e, tip)} onMouseLeave={() => setTooltip(null)}>
                  <title>{tip}</title>
                </rect>
                {showLabel && h >= 14 && (
                  <text x={cx} y={(y0 + y1) / 2 + 4} textAnchor="middle" fontSize="11" fontWeight={500} fill="#fff" pointerEvents="none">
                    {labelText}
                  </text>
                )}
              </g>
            )
          })
          return (
            <g key={wl[0]}>
              {rects}
              {/* Total au-dessus de la barre (mode %) */}
              {isPct && (
                <text x={cx} y={y(yMax) - 7} textAnchor="middle" fontSize="11" fontWeight={700} fill="#161616">
                  {frFmt(d.total[i])}
                </text>
              )}
              {/* Libellés axe X (sur 2 lignes) */}
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
  const sumTot = sum(d.total)
  const aP = sum(d.absP)
  const aR = sum(d.absR)
  const partP = sumTot ? Math.round((aP / sumTot) * 100) : 0
  const partR = sumTot ? Math.round((aR / sumTot) * 100) : 0
  const firstP = d.propre[0]
  const lastP = d.propre[7]
  const trend = lastP - firstP

  let info: { cls: string; tag: string; txt: string }
  if (d.peri) {
    info = {
      cls: "ok",
      tag: "Vue d’ensemble",
      txt: "Sur l’ensemble du périmètre, le trafic propre (référencement Google + accès directs) prend le pas sur la redirection : la bascule fonctionne sans perte de trafic.",
    }
  } else if (sumTot < 100) {
    info = { cls: "low", tag: "Volume faible", txt: "Trafic trop faible sur la période pour conclure." }
  } else if (partR < 2) {
    info = { cls: "ok", tag: "Autonome", txt: "Page autonome : trafic quasi exclusivement propre, jamais dépendante de la redirection." }
  } else if (lastP >= d.redir[7] && firstP < 50) {
    info = { cls: "ok", tag: "Bascule réussie", txt: "Le trafic propre a pris le pas sur la redirection : la dépendance au Portail s’efface nettement." }
  } else if (d.redir[7] > lastP) {
    info = { cls: "warn", tag: "À accélérer", txt: "Encore dépendante de la redirection en fin de période : à pousser avant la coupure." }
  } else {
    info = { cls: "", tag: "En transition", txt: "Le trafic propre progresse mais la bascule n’est pas encore stabilisée." }
  }

  const cards: [string, string, string][] = [
    ["Visites sur la période", frFmt(sumTot), ""],
    ["Part trafic propre", `${partP} %`, ""],
    ["Part redirection", `${partR} %`, ""],
    ["Tendance trafic propre", `${trend >= 0 ? "+" : ""}${trend} pts`, `S15 ${firstP} % → S22 ${lastP} %`],
  ]
  const cardColor = (k: string) => (k === "Part trafic propre" ? COL.propre : k === "Part redirection" ? COL.redir : undefined)

  return (
    <Box>
      <Breadcrumb pages={[PAGES.static.bilanFusionPortail]} />
      <DefaultContainer>
        <Typography id="editorial-content-container" component="h1" variant="h1" sx={{ mb: fr.spacing("4v"), color: fr.colors.decisions.text.default.info.default }}>
          Bilan de la fusion du Portail de l&apos;alternance et de La bonne alternance
        </Typography>
        <Typography sx={{ mb: fr.spacing("8v") }}>
          Page de démonstration — suivi du trafic des pages reprises du Portail de l’alternance après la bascule des redirections vers La bonne alternance. On distingue le
          <strong> trafic propre</strong> (référencement Google + accès directs, qui survit à une coupure du Portail) de la <strong>redirection</strong> (qui disparaît à la
          coupure).
        </Typography>

        <Box className="bilanFusion">
          <div className="bandeau">
            <h2>Trafic par URL — périmètre fusion PdA × LBA</h2>
            <p>Trafic propre vs redirection, semaine par semaine (S15–S22, avril–mai 2026). Source : Matomo, fichier par URL.</p>
          </div>

          <div className="controls">
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
                        className={`dd-opt${i === 0 ? " grp grp-last" : ""}`}
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

            <div className="nav">
              <button type="button" aria-label="Précédent" onClick={() => setCurrent((c) => (c - 1 + ALL.length) % ALL.length)}>
                ‹
              </button>
              <button type="button" aria-label="Suivant" onClick={() => setCurrent((c) => (c + 1) % ALL.length)}>
                ›
              </button>
            </div>

            <div className="toggle" role="group" aria-label="Mode">
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

          <div className="legend">
            <span>
              <i style={{ background: COL.propre }} />
              Trafic propre (survit à la coupure)
            </span>
            <span>
              <i style={{ background: COL.redir }} />
              Redirection (disparaît à la coupure)
            </span>
            <span>
              <i style={{ background: COL.autres }} />
              Autres
            </span>
          </div>

          <StackedBarChart d={d} mode={mode} />

          {mode === "pct" ? (
            <div className="note">
              <strong>Trafic propre</strong> = référencement Google + accès directs : tout ce qui ne dépend pas du Portail et survit à une coupure des redirections. Le nombre
              au-dessus de chaque barre indique <strong>le total de visites</strong> de la semaine.
            </div>
          ) : (
            <div className="note">
              Visites absolues par semaine. Le <strong>trafic propre</strong> (vert) est ce qui reste si on coupe le Portail ; la <strong>redirection</strong> (turquoise) est ce
              qui disparaît.
            </div>
          )}

          <p className="foot">Source : Matomo, fichier de trafic par URL (organique + direct regroupés en trafic propre). Fenêtre 9 avril – 31 mai 2026.</p>
        </Box>
      </DefaultContainer>
    </Box>
  )
}
