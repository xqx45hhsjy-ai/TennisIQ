"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
  BarChart, Bar, AreaChart, Area, ScatterChart, Scatter, ZAxis, Cell
} from "recharts";

/* ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
   "Hawkeye Lab" — court surface at night, live data green, burnt clay identity
──────────────────────────────────────────────────────────────────────────────*/
const C = {
  court:    "#080F18",
  deep:     "#0C1621",
  mid:      "#111E2E",
  panel:    "#162435",
  lift:     "#1D2F44",
  border:   "#1F3552",
  clay:     "#D4631E",
  clayDim:  "#7A3610",
  clayGlow: "#D4631E44",
  live:     "#00E5A0",
  liveGlow: "#00E5A022",
  yellow:   "#F5C842",
  red:      "#E84545",
  purple:   "#9B6DFF",
  text:     "#DCE8F2",
  sub:      "#6B8FAD",
  faint:    "#243F5A",
};
const FONT = {
  display: "'Space Grotesk','Inter',system-ui,sans-serif",
  mono:    "'JetBrains Mono','Fira Mono',monospace",
};
const SURFACE_COL = { Hard:"#4A9EFF", Clay:C.clay, Grass:"#00C97F", Indoor:"#9B6DFF" };
const FEEDBACK_CLOSED_KEY = "tennisiq_feedback_closed_at";
const FEEDBACK_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLScubOEWUXdwc0XSq6zIF4BtY9XTJIYtllo8GV8pA9Jd7pl4jw/viewform?usp=publish-editor";
const videoLibrary = {
  firstServe: [
    ["Djokovic serve — slow motion", "https://www.youtube.com/results?search_query=djokovic+serve+slow+motion"],
    ["Mouratoglou — improve first serve", "https://www.youtube.com/results?search_query=mouratoglou+improve+first+serve"],
    ["ATP serve fundamentals", "https://www.youtube.com/results?search_query=ATP+serve+fundamentals"],
  ],
  secondServe: [
    ["Serve placement and kick drills", "https://www.youtube.com/results?search_query=second+serve+drills"],
    ["High-percentage second serve", "https://www.youtube.com/results?search_query=high+percentage+second+serve"],
    ["Pressure second serve training", "https://www.youtube.com/results?search_query=second+serve+pressure+training"],
  ],
  returnWon: [
    ["Djokovic return technique", "https://www.youtube.com/results?search_query=djokovic+return+technique"],
    ["Agassi return masterclass", "https://www.youtube.com/results?search_query=agassi+return+masterclass"],
    ["ATP return basics", "https://www.youtube.com/results?search_query=ATP+return+basics"],
  ],
  unforced: [
    ["Djokovic consistency drill", "https://www.youtube.com/results?search_query=djokovic+consistency+drill"],
    ["Agassi rally tolerance", "https://www.youtube.com/results?search_query=agassi+rally+tolerance"],
    ["ATP consistency training", "https://www.youtube.com/results?search_query=ATP+consistency+training"],
  ],
  netPlay: [
    ["Net play volleys and finishing", "https://www.youtube.com/results?search_query=net+play+volleys"],
    ["Approach shot and volley combos", "https://www.youtube.com/results?search_query=approach+shot+volley+combos"],
    ["Topspin volley drills", "https://www.youtube.com/results?search_query=topspin+volley+drills"],
  ],
};

const coaching = {
  firstServeIn: {
    label: "1st Serve In %",
    problem: "Low first-serve percentage is making service games too defensive.",
    why: "Missing first serves forces more second serves, giving opponents easier return opportunities.",
    drills: ["Target serving", "Serve toss consistency", "Footwork into the court"],
    focus: "Simplify the motion and prioritise first-ball accuracy over power.",
    videoKey: "firstServe",
  },
  firstServeWon: {
    label: "1st Serve Won %",
    problem: "The first serve is not earning enough free points.",
    why: "When the first serve isn’t winning points, opponents stay in the rally and pressure the second serve.",
    drills: ["Wide/body serve patterns", "Serve +1 attack", "High-percentage placement"],
    focus: "Build serve confidence by targeting safer zones and adding variety.",
    videoKey: "firstServe",
  },
  secondServeWon: {
    label: "2nd Serve Won %",
    problem: "The second serve is being attacked too often.",
    why: "A weak second serve invites strong returns and reduces your chance to hold serve.",
    drills: ["Kick serve ladder", "Deep second serve targets", "High net clearance practice"],
    focus: "Increase spin and depth to make the second serve harder to attack.",
    videoKey: "secondServe",
  },
  returnWon: {
    label: "Return Won %",
    problem: "Return points won is below the expected level.",
    why: "A low return win rate means fewer break opportunities and more defensive play.",
    drills: ["Shortening return backswing", "Split-step timing", "Return to the middle"],
    focus: "Improve return position and first strike on the opponent’s serve.",
    videoKey: "returnWon",
  },
  unforced: {
    label: "Unforced Errors",
    problem: "Too many unforced errors are costing free points.",
    why: "High error counts undermine match rhythm and reduce confidence in pressure moments.",
    drills: ["Consistency rally sets", "Deep crosscourt drills", "Pressure tolerance sessions"],
    focus: "Focus on margin and controlled point construction, not power.",
    videoKey: "unforced",
  },
  winners: {
    label: "Winners",
    problem: "Winner production is lower than needed to finish points.",
    why: "Without enough winners, you spend more time in long rallies and give opponents recovery chances.",
    drills: ["Approach shot finishing", "Short-court aggression", "Improved forehand timing"],
    focus: "Find cleaner opportunities to finish inside the court.",
    videoKey: "netPlay",
  },
  doubleFaults: {
    label: "Double Faults",
    problem: "Too many double faults are giving away free points.",
    why: "Double faults kill serve momentum and hand opponents easy breaks.",
    drills: ["Second serve routine", "Toss placement consistency", "Rhythm serving"],
    focus: "Use a repeatable serve routine and avoid rushed motion on second serve.",
    videoKey: "firstServe",
  },
  netPoints: {
    label: "Net Points Won %",
    problem: "Net play success is below benchmark.",
    why: "Weak net finishing reduces your ability to close points when attacking.",
    drills: ["Volleys under pressure", "Approach and volley drills", "Short-court quick hands"],
    focus: "Improve net coverage and decision-making on approach shots.",
    videoKey: "netPlay",
  },
};

function getCoachingSeverity(metric: string, value: number) {
  const config = B[metric as keyof typeof B];
  if (!config) return 0;
  const gap = config.hi ? Math.max(0, config.bench - value) : Math.max(0, value - config.bench);
  return gap / Math.max(config.bench, 1);
}

function getCoachEstimates(metric: string, gap: number) {
  const config = B[metric as keyof typeof B];
  if (!config) return { improvement:"Review match patterns", impact:"0.0 UTR" };
  const points = Math.max(1, Math.round(Math.min(gap * (config.hi ? 0.75 : 0.6), config.hi ? 8 : 6)));
  const impact = Math.round(Math.min(1.0, gap * 0.12) * 10) / 10;
  return {
    improvement: config.hi ? `Increase by ${points}%` : `Reduce by ${points}`,
    impact: `${impact.toFixed(1)} UTR`,
  };
}

function buildCoachingSummary(stats: any, label: string) {
  const keys = ["firstServeIn","firstServeWon","secondServeWon","returnWon","unforced","winners","doubleFaults","netPoints"];
  const candidate = keys
    .map(k => {
      const val = stats[k];
      if (typeof val !== "number") return null;
      const config = coaching[k as keyof typeof coaching];
      const bench = B[k as keyof typeof B].bench;
      const hi = B[k as keyof typeof B].hi;
      const gap = hi ? Math.max(0, bench - val) : Math.max(0, val - bench);
      if (gap <= 0) return null;
      return {
        key: k,
        label: config.label,
        problem: config.problem,
        why: config.why,
        drills: config.drills,
        focus: config.focus,
        videoKey: config.videoKey,
        gap,
        severity: getCoachingSeverity(k, val),
        ...getCoachEstimates(k, gap),
      };
    })
    .filter(Boolean)
    .sort((a,b) => b.severity - a.severity)
    .slice(0, 3);

  if (!candidate.length) {
    return { lines: [`Log more matches to unlock advanced coaching.`], videoMetrics: [] };
  }

  const lines = [`${label} analysis based on real logged match stats:`];
  const videoMetrics = [] as string[];

  candidate.forEach(item => {
    lines.push(`• ${item.label}: ${item.problem}`);
    lines.push(`• Why it matters: ${item.why}`);
    lines.push(`• Suggested drills: ${item.drills.join(", ")}`);
    lines.push(`• Training focus: ${item.focus}`);
    lines.push(`• Expected improvement: ${item.improvement}`);
    lines.push(`• Estimated UTR impact: ${item.impact}`);
    if (item.videoKey) {
      if (!videoMetrics.includes(item.videoKey)) videoMetrics.push(item.videoKey);
      lines.push(`• Review video recommendations for ${item.label}.`);
    }
    lines.push("");
  });
  return { lines, videoMetrics };
}

/* ─── BENCHMARKS ──────────────────────────────────────────────────────────────*/
const B = {
  firstServeIn:   { label:"1st Serve %",     bench:65, unit:"%", hi:true,  weight:2.0 },
  firstServeWon:  { label:"1st Srv Won %",   bench:76, unit:"%", hi:true,  weight:1.8 },
  secondServeWon: { label:"2nd Srv Won %",   bench:55, unit:"%", hi:true,  weight:1.5 },
  returnWon:      { label:"Return Pts Won %",bench:45, unit:"%", hi:true,  weight:1.6 },
  aces:           { label:"Aces",            bench:6,  unit:"",  hi:true,  weight:0.8 },
  doubleFaults:   { label:"Double Faults",   bench:3,  unit:"",  hi:false, weight:1.2 },
  winners:        { label:"Winners",         bench:22, unit:"",  hi:true,  weight:1.4 },
  unforced:       { label:"Unforced Errors", bench:13, unit:"",  hi:false, weight:2.2 },
  netPoints:      { label:"Net Pts Won %",   bench:62, unit:"%", hi:true,  weight:1.0 },
  breakPtsConv:   { label:"Break Pt Conv %", bench:40, unit:"%", hi:true,  weight:1.3 },
};

const emptyTournament = {
  name: "",
  date: "",
  location: "",
  entry: "",
  flight: "",
  hotel: "",
  food: "",
  transport: "",
  notes: "",
};

/* ─── REAL MATCH DATA ─────────────────────────────────────────────────────────*/
// Notes from CSV preserved as tooltips. Missing stats (aces, returnWon, netPoints)
// estimated from available data using typical ratios for the serve/return pattern.
const DEMO = [
  { id:1,  date:"2025-10-11", opp:"UTR 9.32",  oppUTR:9.32,  surface:"Hard", score:"7-6 2-6 10-8", won:true,  firstServeIn:51,firstServeWon:68,secondServeWon:71,returnWon:46,aces:3, doubleFaults:1, winners:30,unforced:21,netPoints:60,breakPtsConv:38, notes:"Good mindset, strong play in tight moments" },
  { id:2,  date:"2025-10-12", opp:"UTR 9.54",  oppUTR:9.54,  surface:"Hard", score:"4-6 3-6",       won:false, firstServeIn:68,firstServeWon:60,secondServeWon:63,returnWon:38,aces:2, doubleFaults:3, winners:9, unforced:19,netPoints:48,breakPtsConv:40, notes:"Too passive, inconsistent" },
  { id:3,  date:"2025-10-18", opp:"UTR 8.61",  oppUTR:8.61,  surface:"Hard", score:"6-0 6-2",       won:true,  firstServeIn:71,firstServeWon:76,secondServeWon:81,returnWon:58,aces:5, doubleFaults:0, winners:35,unforced:8, netPoints:74,breakPtsConv:69, notes:"Good aggression, consistent" },
  { id:4,  date:"2025-10-25", opp:"UTR 11.21", oppUTR:11.21, surface:"Hard", score:"2-6 1-6",       won:false, firstServeIn:63,firstServeWon:48,secondServeWon:46,returnWon:29,aces:1, doubleFaults:2, winners:10,unforced:38,netPoints:38,breakPtsConv:13, notes:"Opponent was better, inconsistent" },
  { id:5,  date:"2025-11-01", opp:"UTR 10.23", oppUTR:10.23, surface:"Hard", score:"7-6 3-6 10-5",  won:true,  firstServeIn:72,firstServeWon:70,secondServeWon:68,returnWon:46,aces:4, doubleFaults:4, winners:25,unforced:28,netPoints:58,breakPtsConv:40, notes:"Good aggression, competitive, better mindset, staying tough" },
  { id:6,  date:"2025-11-01", opp:"UTR 10.42", oppUTR:10.42, surface:"Hard", score:"6-7 7-5 10-7",  won:true,  firstServeIn:67,firstServeWon:68,secondServeWon:72,returnWon:44,aces:3, doubleFaults:2, winners:28,unforced:22,netPoints:62,breakPtsConv:38, notes:"Moderate aggression, playing smart, targeting weakness, solid mentality" },
  { id:7,  date:"2025-11-03", opp:"UTR 9.98",  oppUTR:9.98,  surface:"Hard", score:"3-6 4-6",       won:false, firstServeIn:62,firstServeWon:63,secondServeWon:70,returnWon:39,aces:2, doubleFaults:1, winners:22,unforced:20,netPoints:50,breakPtsConv:20, notes:"Too passive, inconsistent" },
  { id:8,  date:"2025-12-06", opp:"UTR 9.41",  oppUTR:9.41,  surface:"Hard", score:"4-6 6-4 10-3",  won:true,  firstServeIn:64,firstServeWon:65,secondServeWon:70,returnWon:47,aces:3, doubleFaults:2, winners:20,unforced:18,netPoints:58,breakPtsConv:44, notes:"Good aggression, playing smart in tight moments, good presence of mind" },
  { id:9,  date:"2025-12-07", opp:"UTR 9.34",  oppUTR:9.34,  surface:"Hard", score:"6-4 6-4",       won:true,  firstServeIn:72,firstServeWon:68,secondServeWon:65,returnWon:50,aces:4, doubleFaults:0, winners:27,unforced:13,netPoints:65,breakPtsConv:33, notes:"Smart play on return, holding all service games" },
  { id:10, date:"2026-04-01", opp:"UTR 9.50",  oppUTR:9.50,  surface:"Hard", score:"7-5 6-1",       won:true,  firstServeIn:68,firstServeWon:70,secondServeWon:61,returnWon:49,aces:4, doubleFaults:3, winners:28,unforced:12,netPoints:63,breakPtsConv:44, notes:"Good aggression, excellent mindset" },
  { id:11, date:"2026-04-03", opp:"UTR 10.00", oppUTR:10.00, surface:"Hard", score:"4-6 3-6",       won:false, firstServeIn:65,firstServeWon:70,secondServeWon:63,returnWon:37,aces:2, doubleFaults:5, winners:15,unforced:35,netPoints:47,breakPtsConv:38, notes:"Too passive" },
  { id:12, date:"2026-04-05", opp:"UTR 9.80",  oppUTR:9.80,  surface:"Hard", score:"3-6 6-3 10-5",  won:true,  firstServeIn:71,firstServeWon:74,secondServeWon:69,returnWon:46,aces:3, doubleFaults:2, winners:21,unforced:23,netPoints:60,breakPtsConv:45, notes:"Consistent" },
];

/* ─── ENGINE ──────────────────────────────────────────────────────────────────*/
function calcIQ(m: any) {
  const keys = Object.keys(B) as Array<keyof typeof B>;
  let total = 0, maxTotal = 0;
  keys.forEach(k => {
    const { bench, hi, weight } = B[k];
    const val = m[k] ?? 0;
    const ratio = hi ? val / bench : bench / Math.max(val, 0.1);
    total    += Math.min(ratio, 1.5) * weight * 10;
    maxTotal += 1.5 * weight * 10;
  });
  return Math.round(Math.min(100, (total / maxTotal) * 100));
}

function weaknesses(m: any , n = 4) {
  return Object.entries(B).map(([k, { label, bench, unit, hi }]) => {
    const val = m[k] ?? 0;
    const gap = hi ? bench - val : val - bench;
    const pct = Math.max(0, Math.round((gap / bench) * 100));
    return { k, label, val, bench, unit, hi, gap: Math.max(0, gap), pct };
  }).filter(x => x.gap > 0).sort((a,b) => b.pct - a.pct).slice(0, n);
}

function strengths(m: any , n = 3) {
  return Object.entries(B).map(([k, { label, bench, unit, hi }]) => {
    const val = m[k] ?? 0;
    const pct = hi ? Math.round(((val - bench)/bench)*100) : Math.round(((bench - val)/bench)*100);
    return { k, label, val, bench, unit, pct };
  }).filter(x => x.pct > 0).sort((a,b) => b.pct - a.pct).slice(0, n);
}

function utrImpact(ws: any[]) {
  const total = ws.reduce((s, w) => s + w.pct, 0);
  return Math.round((total / 100) * 0.45 * 10) / 10;
}

function winProb(myIQ, oppUTR, myUTR = 10.1) {
  const diff  = myUTR - oppUTR;
  const bonus = (myIQ - 62) / 120;
  const logit = 0.72 * diff + bonus * 0.55;
  return Math.round((1 / (1 + Math.exp(-logit))) * 100);
}

function iqLabel(iq) {
  if (iq >= 82) return ["Elite",    C.live];
  if (iq >= 70) return ["Strong",   C.yellow];
  if (iq >= 57) return ["Solid",    C.clay];
  return              ["Developing",C.red];
}

/* ─── UTR PREDICTOR MODEL ─────────────────────────────────────────────────────
   Weighted rolling model: recent form + IQ trajectory + win rate vs quality
──────────────────────────────────────────────────────────────────────────────*/
function predictUTR(matches, currentUTR = 10.1, futurMatches = 10) {
  if (matches.length < 3) return null;
  const recent = matches.slice(-6);
  const recentIQ = recent.reduce((s,m) => s + m.iq, 0) / recent.length;
  const recentWR = recent.filter(m => m.won).length / recent.length;
  const avgOppUTR = recent.reduce((s,m) => s + m.oppUTR, 0) / recent.length;
  const iqTrend = (matches.slice(-3).reduce((s,m) => s + m.iq, 0)/3) -
                  (matches.slice(-6,-3).reduce((s,m) => s + m.iq, 0)/Math.max(1, Math.min(3, matches.length-3)));

  // IQ-to-UTR conversion factor
  const iqFactor = (recentIQ - 62) / 100 * 0.8;
  const winFactor = (recentWR - 0.5) * 0.6;
  const trendFactor = (iqTrend / 100) * 0.4;
  const qualFactor  = (avgOppUTR - 9.5) * 0.12;
  const deltaPerMatch = (iqFactor + winFactor + trendFactor + qualFactor) / 20;

  const trajectory = [];
  let utr = currentUTR;
  for (let i = 1; i <= futurMatches; i++) {
    utr = Math.round((utr + deltaPerMatch) * 100) / 100;
    trajectory.push({ match: i, utr: Math.round(utr * 10) / 10, label: `M+${i}` });
  }
  return { trajectory, predicted: utr, delta: Math.round((utr - currentUTR) * 100) / 100 };
}

/* ─── AI INSIGHTS ENGINE ──────────────────────────────────────────────────────
   Generates data-driven insight sentences from match patterns
──────────────────────────────────────────────────────────────────────────────*/
function generateInsights(matches) {
  if (matches.length < 4) return [];
  const insights = [];
  const avgOf = (arr, k) => arr.length ? arr.reduce((s,m) => s + (m[k]||0), 0) / arr.length : 0;

  // UE threshold insight
  const highUE = matches.filter(m => m.unforced > 25);
  if (highUE.length >= 2) {
    const lossRate = Math.round((highUE.filter(m => !m.won).length / highUE.length) * 100);
    insights.push({ icon:"⚡", color:C.red,
      text:`You lose ${lossRate}% of matches when Unforced Errors exceed 25`,
      detail:`${highUE.length} matches with UE > 25 · avg IQ in those: ${Math.round(highUE.reduce((s,m) => s+m.iq,0)/highUE.length)}`,
      category:"Pattern" });
  }

  // First serve IQ lift
  const goodServe = matches.filter(m => m.firstServeIn >= 65);
  const badServe  = matches.filter(m => m.firstServeIn < 65);
  if (goodServe.length >= 2 && badServe.length >= 2) {
    const diff = Math.round(avgOf(goodServe, "iq") - avgOf(badServe, "iq"));
    if (diff > 3) insights.push({ icon:"🎯", color:C.live,
      text:`Your TennisIQ jumps +${diff} pts when 1st serve% exceeds 65`,
      detail:`Avg IQ: ${Math.round(avgOf(goodServe,"iq"))} (1st≥65%) vs ${Math.round(avgOf(badServe,"iq"))} (1st<65%)`,
      category:"Leverage" });
  }

  // High UTR second serve weakness
  const highUTR = matches.filter(m => m.oppUTR >= 10);
  if (highUTR.length >= 3) {
    const ws = weaknesses(
      Object.keys(B).reduce((acc, k) => { acc[k] = Math.round(avgOf(highUTR, k)); return acc; }, {}),
      1
    );
    if (ws.length) insights.push({ icon:"🔍", color:C.yellow,
      text:`vs UTR 10+ opponents, ${ws[0].label} is your biggest weakness`,
      detail:`Avg ${ws[0].val}${ws[0].unit} vs benchmark ${ws[0].bench}${ws[0].unit} — ${ws[0].pct}% below`,
      category:"Matchup" });
  }

  // Surface pattern
  const surfaces = ["Hard","Clay","Grass","Indoor"];
  surfaces.forEach(s => {
    const sm = matches.filter(m => m.surface === s);
    if (sm.length >= 3) {
      const wr = Math.round((sm.filter(m => m.won).length / sm.length) * 100);
      const allWR = Math.round((matches.filter(m => m.won).length / matches.length) * 100);
      if (Math.abs(wr - allWR) >= 15) {
        const better = wr > allWR;
        insights.push({ icon: better ? "🏆" : "⚠️", color: better ? C.live : C.clay,
          text:`On ${s} you win ${wr}% — ${better ? `${wr-allWR}% above` : `${allWR-wr}% below`} your overall rate`,
          detail:`${sm.length} ${s} matches · overall win rate ${allWR}%`,
          category:"Surface" });
      }
    }
  });

  // Return game vs serve game
  const avgReturn = avgOf(matches, "returnWon");
  const avgServeWon = avgOf(matches, "firstServeWon");
  const serveLead = avgServeWon - (avgReturn * 100 / 45);
  if (Math.abs(serveLead) > 8) {
    const stronger = serveLead > 0 ? "serve" : "return";
    insights.push({ icon:"📊", color:C.purple,
      text:`Your ${stronger} game is your primary weapon — lean into it`,
      detail:`1st Srv Won ${Math.round(avgServeWon)}% · Return Won ${Math.round(avgReturn)}% vs benchmarks 76%/45%`,
      category:"Style" });
  }

  // Double fault danger
  const highDF = matches.filter(m => m.doubleFaults >= 6);
  if (highDF.length >= 2) {
    const lossRate = Math.round((highDF.filter(m => !m.won).length / highDF.length) * 100);
    insights.push({ icon:"💥", color:C.red,
      text:`Matches with 6+ double faults → ${lossRate}% loss rate`,
      detail:`${highDF.length} matches affected · avg DF: ${Math.round(avgOf(matches,"doubleFaults"))}`,
      category:"Risk" });
  }

  // Win streak / IQ momentum
  const last5 = matches.slice(-5);
  const l5wins = last5.filter(m => m.won).length;
  const l5iq = Math.round(last5.reduce((s,m) => s+m.iq,0)/last5.length);
  if (l5wins >= 4) insights.push({ icon:"🔥", color:C.live,
    text:`Hot streak: ${l5wins}/5 recent wins — avg IQ ${l5iq} in last 5`,
    detail:"Momentum is strong. Now challenge higher-UTR opponents.",
    category:"Form" });
  else if (l5wins <= 1) insights.push({ icon:"📉", color:C.yellow,
    text:`Rough patch: ${l5wins}/5 recent wins — avg IQ ${l5iq} in last 5`,
    detail:"Focus training block recommended before next tournament.",
    category:"Form" });

  return insights.slice(0, 6);
}

/* ─── CSV PARSER ──────────────────────────────────────────────────────────────*/
function parseCSV(text) {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return { matches: [], errors: ["File is empty"] };
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/ /g,""));
  const errors = [];
  const matches = [];
  const fieldMap = {
    "date":"date","opponent":"opp","opp":"opp","oppname":"opp","opponentname":"opp",
    "opputr":"oppUTR","opp_utr":"oppUTR","opponentutr":"oppUTR",
    "surface":"surface","score":"score","result":"won","won":"won",
    "1stserve%":"firstServeIn","firstservein":"firstServeIn","firstserve%":"firstServeIn",
    "1stsrvwon%":"firstServeWon","firstservewon":"firstServeWon",
    "2ndsrvwon%":"secondServeWon","secondservewon":"secondServeWon",
    "returnpts%":"returnWon","returnwon":"returnWon","returnpointswon":"returnWon",
    "aces":"aces","doublefaults":"doubleFaults","df":"doubleFaults",
    "winners":"winners","unforcederrors":"unforced","ue":"unforced","unforced":"unforced",
    "netpts%":"netPoints","netpoints":"netPoints","breakpt%":"breakPtsConv","breakconv":"breakPtsConv",
  };
  lines.slice(1).forEach((line, i) => {
    if (!line.trim()) return;
    const vals = line.split(",").map(v => v.trim());
   const obj: any = {};

headers.forEach((h, idx) => {
  const key = fieldMap[h] || h;
  obj[key] = vals[idx] || "";
});

const m: any = {
  id: Date.now() + i,
  date: obj.date || new Date().toISOString().slice(0, 10),
  opp: obj.opp || "Unknown",
  oppUTR: parseFloat(obj.oppUTR) || 10.0,
  surface: obj.surface || "Hard",
  score: obj.score || "?",
  won:
    obj.won === "true" ||
    obj.won === "1" ||
    obj.won?.toLowerCase() === "w" ||
    obj.won?.toLowerCase() === "win",
};

Object.keys(B).forEach((k: any) => {
  m[k] = parseFloat(obj[k]) || (B as any)[k].bench;
});
    m.iq = calcIQ(m);
    matches.push(m);
  });
  return { matches, errors };
}

/* ─── MICRO COMPONENTS ────────────────────────────────────────────────────────*/
const Pill = ({ v, good }) => {
  const col = good == null ? C.yellow : good ? C.live : C.red;
  return (
    <span style={{ background:col+"22", border:`1px solid ${col}55`, color:col,
      borderRadius:4, padding:"2px 9px", fontSize:11, fontFamily:FONT.mono, fontWeight:700,
      letterSpacing:0.5, display:"inline-block" }}>{v}</span>
  );
};

const SurfaceBadge = ({ s }) => (
  <span style={{ background:(SURFACE_COL[s]||C.sub)+"22", border:`1px solid ${(SURFACE_COL[s]||C.sub)}55`,
    color:SURFACE_COL[s]||C.sub, borderRadius:4, padding:"2px 8px",
    fontSize:11, fontFamily:FONT.mono, fontWeight:700 }}>{s}</span>
);

function Videos({ metric }) {
  const videos = videoLibrary[metric] || videoLibrary.returnWon;
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:12, marginTop:10 }}>
      {videos.map(([title, url], index) => (
        <a key={title} href={url} target="_blank" rel="noreferrer" style={{ display:"block", background:C.lift, border:`1px solid ${C.border}`, borderRadius:10, padding:"14px", color:C.text, textDecoration:"none" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
            <span style={{ width:24, height:24, borderRadius:8, background:C.clay, color:"#fff", display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:12 }}>▶</span>
            <strong style={{ fontSize:13 }}>{title}</strong>
          </div>
          <small style={{ color:C.sub, fontSize:11 }}>Open video</small>
        </a>
      ))}
    </div>
  );
}

const Divider = () => <div style={{ height:1, background:C.border, margin:"0 0 20px" }} />;

function IQRing({ score, size=120 }) {
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const [label, col] = iqLabel(score);
  return (
    <div style={{ position:"relative", width:size, height:size, display:"flex",
      alignItems:"center", justifyContent:"center", borderRadius:"50%",
      background:`radial-gradient(circle at 30% 30%, ${C.live}18, transparent 52%)`,
      boxShadow:`0 0 24px rgba(0,0,0,0.22)`, padding:10, animation:"pulse 3.4s ease-in-out infinite" }}>
      <svg width={size} height={size} style={{ position:"absolute", transform:"rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={size*0.07} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={size*0.07}
          strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
          style={{ transition:"stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)",
            filter:`drop-shadow(0 0 8px ${col})` }} />
      </svg>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:size*0.22, fontWeight:900, fontFamily:FONT.mono, color:col, lineHeight:1 }}>{score}</div>
        <div style={{ fontSize:size*0.09, color:col, letterSpacing:1.5, textTransform:"uppercase", marginTop:3 }}>{label}</div>
      </div>
    </div>
  );
}

function StatRow({ label, val, bench, unit, hi }) {
  const good = hi ? val >= bench : val <= bench;
  const pct  = Math.round(Math.min(100, (Math.min(val, bench*1.4) / (bench*1.4)) * 100));
  const bPct = Math.round((bench / (bench*1.4)) * 100);
  return (
    <div style={{ marginBottom:13 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5, alignItems:"center" }}>
        <span style={{ color:C.sub, fontSize:12 }}>{label}</span>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <span style={{ color:good?C.live:C.clay, fontFamily:FONT.mono, fontWeight:700, fontSize:13 }}>{val}{unit}</span>
          <span style={{ color:C.faint, fontSize:11 }}>/ {bench}{unit}</span>
        </div>
      </div>
      <div style={{ height:5, background:C.lift, borderRadius:3, position:"relative" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:good?C.live:C.clay, borderRadius:3,
          transition:"width 0.9s cubic-bezier(.4,0,.2,1)", boxShadow:good?`0 0 6px ${C.live}88`:"none" }} />
        <div style={{ position:"absolute", top:-3, left:`${bPct}%`,
          width:1.5, height:11, background:C.yellow, borderRadius:1 }} />
      </div>
    </div>
  );
}

function Section({ title, children, action }: any) {
  return (
    <div style={{ marginBottom: 28 }}>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 18,
          flexWrap: "wrap"
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: C.sub,
            letterSpacing: 2,
            textTransform: "uppercase"
          }}
        >
          {title}
        </span>

        {action}

      </div>

      {children}

    </div>
  );
}

function Card({ children, glow, style={} }: any) {
  return (
    <div style={{
      background:`linear-gradient(180deg, ${C.panel} 0%, ${C.deep} 100%)`,
      border:`1px solid ${glow?C.clay+"55":C.border}`,
      borderRadius:18,
      boxShadow: glow
        ? `0 22px 60px rgba(212,99,30,0.18)`
        : "0 24px 60px rgba(0,0,0,0.28)",
      padding:"22px 24px",
      ...style
    }}>
      {children}
    </div>
  );
}

const btn = (
  primary: any,
  disabled: any = false,
  sm: any = false
) => ({
  background: primary ? `linear-gradient(135deg, ${C.clay}, ${C.purple})` : C.lift,
  color: "#fff",
  border: primary ? "1px solid transparent" : `1px solid ${C.border}`,
  borderRadius: 14,
  padding: sm ? "8px 16px" : "10px 20px",
  fontSize: sm ? 12 : 13,
  fontWeight: 700,
  cursor: disabled ? "not-allowed" : "pointer",
  letterSpacing: 0.5,
  fontFamily: FONT.display,
  transition: "all 220ms cubic-bezier(.4,0,.2,1)",
  opacity: disabled ? 0.78 : 1,
  boxShadow: primary
    ? "0 16px 35px rgba(212,99,30,0.22)"
    : "0 10px 24px rgba(0,0,0,0.16)",
  minHeight: sm ? undefined : 42,
});

const inp = {
  background:C.mid,
  border:`1px solid ${C.border}`,
  color:C.text,
  borderRadius:14,
  padding:"12px 14px",
  fontSize:13,
  width:"100%",
  fontFamily:FONT.display,
  outline:"none",
  boxShadow:"inset 0 1px 2px rgba(0,0,0,0.18)",
  transition:"border-color 0.2s, box-shadow 0.2s",
};

/* ─── AI PANEL ────────────────────────────────────────────────────────────────*/
function AIBlock({ loading, text }) {
  if (!loading && !text) return null;
  return (
    <div style={{ background:`linear-gradient(135deg, ${C.deep}, ${C.mid})`,
      border:`1px solid ${C.clay}44`, borderRadius:18, padding:"20px 22px", marginTop:20,
      boxShadow:"0 22px 60px rgba(0,0,0,0.18)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
        <span style={{ width:10, height:10, borderRadius:"50%",
          background:loading?C.yellow:C.live, display:"inline-block",
          boxShadow:`0 0 12px ${loading?C.yellow:C.live}`,
          animation:loading?"pulse 1s infinite":"none" }} />
        <span style={{ fontSize:11, fontWeight:700, color:C.text, letterSpacing:2, textTransform:"uppercase" }}>AI Coach</span>
      </div>
      {loading ? <span style={{ color:C.sub, fontSize:13 }}>Analysing patterns…</span>
        : text.split("\n").filter(Boolean).map((l,i) => (
          <p key={i} style={{ color:l.startsWith("•")?C.text:C.sub, fontSize:13.5, lineHeight:1.75, margin:"6px 0" }}>{l}</p>
        ))
      }
    </div>
  );
}

const TT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={{ background:C.mid, border:`1px solid ${C.border}`, borderRadius:8,
      padding:"10px 14px", fontSize:12, color:C.text }}>
      <div style={{ fontWeight:700, marginBottom:4 }}>{label}</div>
      {payload.map((p,i) => <div key={i} style={{ color:p.color }}>{p.name}: {p.value}</div>)}
      {d?.opp && <div style={{ color:C.sub, marginTop:4 }}>vs {d.opp} {d.won?"✓":"✗"}</div>}
    </div>
  );
};

/* ─── INSIGHT CARD ────────────────────────────────────────────────────────────*/
function InsightCard({ insight }) {
  const [open, setOpen] = useState(false);
  return (
    <div onClick={() => setOpen(p => !p)} style={{ cursor:"pointer",
      background:C.mid, border:`1px solid ${insight.color}33`,
      borderLeft:`4px solid ${insight.color}`, borderRadius:16,
      padding:"18px 20px", transition:"transform 0.2s, border-color 0.2s, background 0.2s",
      boxShadow:"0 18px 42px rgba(0,0,0,0.16)" }}>
      <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
        <span style={{ fontSize:20, lineHeight:1 }}>{insight.icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10, flexWrap:"wrap" }}>
            <p style={{ margin:0, color:C.text, fontSize:14, fontWeight:700, lineHeight:1.5 }}>{insight.text}</p>
            <span style={{ background:insight.color+"22", color:insight.color,
              fontSize:10, fontWeight:700, letterSpacing:1, padding:"4px 9px",
              borderRadius:999, whiteSpace:"nowrap", flexShrink:0 }}>{insight.category}</span>
          </div>
          {open && <p style={{ margin:"12px 0 0", color:C.sub, fontSize:13, lineHeight:1.7 }}>{insight.detail}</p>}
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN ────────────────────────────────────────────────────────────────────*/
export default function TennisIQ() {
  const [matches, setMatches]     = useState(() => []);
  const [tab, setTab]             = useState("coach");
  const [sel, setSel]             = useState(null);
  const [aiText, setAiText]       = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [scoutUTR, setScoutUTR]   = useState("10.6");
  const [scoutData, setScoutData] = useState(null);
  const [showAdd, setShowAdd]     = useState(false);
  const [showCSV, setShowCSV]     = useState(false);
  const [csvText, setCsvText]     = useState("");
  const [csvErr, setCsvErr]       = useState([]);
  const [predUTR, setPredUTR]     = useState("");
  const [toast, setToast]         = useState("");
  const [coachView, setCoachView] = useState("insights"); // insights | predict | training
  const [mode, setMode]           = useState("quick");
  const [currentUtr, setCurrentUtr] = useState("10.1");
  const [targetUtr, setTargetUtr] = useState("10.8");
  const [timeframe, setTimeframe] = useState("6");
  const [tournaments, setTournaments] = useState([]);
  const [showTournamentForm, setShowTournamentForm] = useState(false);
  const [editingTournamentId, setEditingTournamentId] = useState(null);
  const [newTournament, setNewTournament] = useState({ ...emptyTournament });
  const fileRef = useRef<HTMLInputElement |null>(null);

  const [targetPlan, setTargetPlan] = useState<any>(null);
  const [coachVideoMetrics, setCoachVideoMetrics] = useState<string[]>([]);
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);

  const [nm, setNm] = useState({
    opp:"", oppUTR:"", score:"", won:"true", surface:"Hard",
    date:new Date().toISOString().slice(0,10),
    firstServeIn:65,firstServeWon:76,secondServeWon:55,returnWon:45,
    aces:6,doubleFaults:3,winners:22,unforced:13,netPoints:62,breakPtsConv:40,
   id: Date.now(),
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const closedAt = parseInt(localStorage.getItem(FEEDBACK_CLOSED_KEY) || "", 10);
    if (!closedAt || Number.isNaN(closedAt) || Date.now() - closedAt >= 30 * 24 * 60 * 60 * 1000) {
      const timer = window.setTimeout(() => setShowFeedbackPopup(true), 10000);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, []);

  const closeFeedbackPopup = () => {
    setShowFeedbackPopup(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(FEEDBACK_CLOSED_KEY, String(Date.now()));
    }
  };

  const openFeedbackForm = () => {
    window.open(FEEDBACK_FORM_URL, "_blank", "noopener,noreferrer");
    closeFeedbackPopup();
  };

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(""), 2800); };

  const avgIQ   = matches.length ? Math.round(matches.reduce((s,m) => s+m.iq,0)/matches.length) : 0;
  const wins    = matches.filter(m => m.won).length;
  const winRate = matches.length ? Math.round((wins/matches.length)*100) : 0;
  const recent3 = matches.slice(-3);

const trend =
  recent3.length === 3
    ? recent3[2].iq - recent3[0].iq
    : 0;
 const best =
  matches.length
    ? [...matches].sort((a,b) => b.iq - a.iq)[0]
    : {
        iq: 0,
        opp: "",
        oppUTR: 0,
        score: "",
        surface: "Hard",
      };

  const avgStats = Object.keys(B).reduce((acc,k) => {
    acc[k] = Math.round(matches.reduce((s,m) => s+(m[k]||0),0)/matches.length);
    return acc;
  }, {});

  const radarData = Object.entries(B).slice(0,8).map(([k,{label}]) => ({
    subject:label.split(" ")[0],
    You:Math.round((avgStats[k]/B[k].bench)*100),
    Target:100,
  }));

  const timelineData = matches.map(m => ({
    date:m.date.slice(5), iq:m.iq, opp:m.opp, won:m.won, utr:m.oppUTR,
  }));

  const insights = generateInsights(matches);
  const utrPred  = predictUTR(matches);

  // Surface breakdown
  const surfaceStats = ["Hard","Clay","Grass","Indoor"].map(s => {
    const sm = matches.filter(m => m.surface === s);
    return {
      surface:s, count:sm.length,
      wr: sm.length ? Math.round((sm.filter(m=>m.won).length/sm.length)*100) : 0,
      iq: sm.length ? Math.round(sm.reduce((s,m)=>s+m.iq,0)/sm.length) : 0,
      col:SURFACE_COL[s],
    };
  }).filter(s => s.count > 0);

  const tournamentTotals = tournaments.map(t => ({
    ...t,
    total: ["entry","flight","hotel","food","transport"].reduce((sum, key) => sum + Number(t[key] || 0), 0),
  }));

  const totalSeasonSpend = tournamentTotals.reduce((sum, t) => sum + t.total, 0);
  const avgTournamentCost = tournaments.length ? Math.round(totalSeasonSpend / tournaments.length) : 0;

  const monthlySpend = tournamentTotals.reduce((sum, t) => {
    if (!t.date) return sum;
    const month = t.date.slice(0, 7);
    sum[month] = (sum[month] || 0) + t.total;
    return sum;
  }, {} as Record<string, number>);

  const monthlySpendData = (Object.entries(monthlySpend) as [string, number][]) 
    .sort((a,b) => b[1] - a[1])
    .slice(0, 5);

  const upcomingTournaments = tournamentTotals
    .filter(t => t.date && !isNaN(new Date(t.date).getTime()) && new Date(t.date) >= new Date())
    .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const upcomingExpenses = upcomingTournaments.reduce((sum, t) => sum + t.total, 0);
  const nextTournament = upcomingTournaments[0];

  const expenseCategories = ["entry","flight","hotel","food","transport"];
  const highestExpenseCategory = expenseCategories
    .map(cat => ({ cat, total: tournamentTotals.reduce((sum, t) => sum + Number(t[cat] || 0), 0) }))
    .sort((a,b) => b.total - a.total)[0];

  /* ── AI Calls ────────────────────────────────────────────────────────────── */
  async function callAI(prompt) {
    setAiLoading(true); setAiText("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:1000,
          messages:[{ role:"user", content:prompt }]
        })
      });
      const data = await res.json();
      setAiText(data.content?.map(c=>c.text||"").join("")||"Analysis unavailable.");
    } catch { setAiText("AI unavailable. Check connection."); }
    setAiLoading(false);
  }

  function analyseMatch(m) {
    const { lines, videoMetrics } = buildCoachingSummary(m, "Match");
    setAiText(lines.join("\n"));
    setCoachVideoMetrics(videoMetrics);
  }

  function runCoachReport() {
    const { lines, videoMetrics } = buildCoachingSummary(avgStats, "Season");
    setAiText(lines.join("\n"));
    setCoachVideoMetrics(videoMetrics);
  }
  function runScout() {
    const opp = parseFloat(scoutUTR);
    if (isNaN(opp)) return;
    const hi = matches.filter(m => m.oppUTR >= 10.2);
    const lo = matches.filter(m => m.oppUTR < 10.2);
    const avg = (arr, k) => arr.length ? Math.round(arr.reduce((sum, match) => sum + (match[k] || 0), 0) / arr.length) : 0;
    const patterns = Object.keys(B).map(k => ({
      stat: B[k].label,
      vsHigh: avg(hi, k),
      vsLow: avg(lo, k),
      bench: B[k].bench,
      unit: B[k].unit,
    }));

    setScoutData({ opp, prob: winProb(avgIQ, opp), patterns });
    callAI(`Tennis scout. Player: UTR 10.1, avg IQ ${avgIQ}. Upcoming opponent: UTR ${opp}.
Stats vs HIGH UTR (10.2+): ${patterns.map(p=>`${p.stat} ${p.vsHigh}${p.unit}`).join(", ")}
Stats vs LOWER UTR: ${patterns.map(p=>`${p.stat} ${p.vsLow}${p.unit}`).join(", ")}
Benchmarks: ${patterns.map(p=>`${p.stat} ${p.bench}${p.unit}`).join(", ")}
Write 5 bullets: what drops vs better players, 2 biggest risks, 2 match-day adjustments. Start each with "•".`);
  }

  function addMatch() {
    const m: any = {
      ...nm,
      id: Date.now(),
      oppUTR: parseFloat(nm.oppUTR),
      won: nm.won === "true",
      ...Object.fromEntries(
        Object.keys(B).map(k => [
          k,
          +(nm[k] ?? B[k].bench),
        ])
      ),
    };
    m.iq = calcIQ(m);
    setMatches(prev => [...prev, m]);
    setShowAdd(false);
    showToast(`Match vs ${m.opp} logged — IQ ${m.iq}`);
  }
  function deleteMatch(id) {
    setMatches(p => p.filter(m => m.id !== id));
    showToast("Match deleted");
  }

  function importCSV() {
    const { matches: newM, errors } = parseCSV(csvText);
    if (errors.length) { setCsvErr(errors); return; }
    setMatches(p => [...p, ...newM]);
    setShowCSV(false); setCsvText(""); setCsvErr([]);
    showToast(`Imported ${newM.length} matches from CSV`);
  }

  function saveTournament(event: any) {
    event.preventDefault();
    const payload = {
      ...newTournament,
      id: editingTournamentId || Date.now(),
      entry: Number(newTournament.entry||0),
      flight: Number(newTournament.flight||0),
      hotel: Number(newTournament.hotel||0),
      food: Number(newTournament.food||0),
      transport: Number(newTournament.transport||0),
    };

    if (editingTournamentId) {
      setTournaments(all => all.map(t => t.id === editingTournamentId ? payload : t));
      setEditingTournamentId(null);
      showToast("Tournament updated");
    } else {
      setTournaments(all => [...all, payload]);
      showToast("Tournament added");
    }

    setNewTournament({ ...emptyTournament });
    setShowTournamentForm(false);
  }

  function editTournament(tournament: any) {
    setNewTournament({
      ...tournament,
      entry: String(tournament.entry || ""),
      flight: String(tournament.flight || ""),
      hotel: String(tournament.hotel || ""),
      food: String(tournament.food || ""),
      transport: String(tournament.transport || ""),
    });
    setEditingTournamentId(tournament.id);
    setShowTournamentForm(true);
  }

  function deleteTournament(id: any) {
    setTournaments(all => all.filter(t => t.id !== id));
    showToast("Tournament deleted");
  }

  function cancelTournamentForm() {
    setEditingTournamentId(null);
    setNewTournament({ ...emptyTournament });
    setShowTournamentForm(false);
  }

 function handleFileUpload(e: any) {
  const file = e.target.files?.[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = (ev) => {
    setCsvText((ev.target?.result as string) || "");
  };

  reader.readAsText(file);
}
  /* ── Training Focus Generator ────────────────────────────────────────────── */
  const trainingFocus = (() => {
    const ws = weaknesses(avgStats, 3);
    const drills = {
      firstServeIn:    { drill:"Serve placement targets", time:"45min/day", priority:"Consistency over power" },
      firstServeWon:   { drill:"Serve+1 patterns",         time:"30min/day", priority:"Attack short returns" },
      secondServeWon:  { drill:"Kick serve to backhand",   time:"30min/day", priority:"Spin % over pace" },
      returnWon:       { drill:"Return position +split",   time:"30min/day", priority:"Neutralize first strike" },
      aces:            { drill:"T and wide serve zones",   time:"20min/day", priority:"Mix patterns" },
      doubleFaults:    { drill:"Second serve ritual",      time:"20min/day", priority:"Routine + spin" },
      winners:         { drill:"Approach shot patterns",   time:"30min/day", priority:"Net finish" },
      unforced:        { drill:"Rally consistency drills", time:"45min/day", priority:"Depth + margin" },
      netPoints:       { drill:"Volley + overhead finishing", time:"25min/day", priority:"Positioning" },
      breakPtsConv:    { drill:"Pressure point simulation", time:"20min/day", priority:"Mental reset routine" },
    };
    return ws.map(w => ({ ...w, ...(drills[w.k]||{}) }));
  })();

  /* ── Nav ─────────────────────────────────────────────────────────────────── */
  // Reordered for core workflow: Log first, then Coach, Compare, Target, Planner, Budget, Scout
  const TABS = [
    ["log","📝 Log Match"],
    ["coach","🧠 AI Coach"],
    ["compare","🔍 Compare"],
    ["target","🎯 UTR Target"],
    ["planner","📅 Tournament Planner"],
    ["dashboard","💰 Budget Dashboard"],
    ["scout","🕵️ Scout"],
  ];

  return (
    <div style={{ minHeight:"100vh", background:`radial-gradient(circle at top, ${C.liveGlow}, transparent 22%), ${C.court}`, color:C.text,
      fontFamily:FONT.display, fontSize:14, lineHeight:1.6 }}>

      <style>{`
        @keyframes pulse{0%,100%{opacity:.4;transform:scale(.8)}50%{opacity:1;transform:scale(1.1)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
        *{box-sizing:border-box;}
        button, input, select, textarea, code { font-family: inherit; }
        button{transition:all .22s ease; border-radius:14px;}
        button:hover:not(:disabled){transform:translateY(-1px);}
        button:focus-visible{outline:2px solid ${C.live}; outline-offset:3px;}
        input,select,textarea{outline:none; background:${C.mid}; color:${C.text};}
        input:focus,select:focus,textarea:focus{border-color:${C.live}!important; box-shadow:0 0 0 4px rgba(0,229,160,0.14);}
        table{border-collapse:separate; border-spacing:0 12px; width:100%;}
        th,td{background:${C.deep}; border:none; padding:14px 16px;}
        th{color:${C.sub}; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; font-weight:700;}
        td{font-size:13px; color:${C.text}; vertical-align:middle;}
        tr:hover td{background:${C.lift}88; cursor:pointer;}
        ::-webkit-scrollbar{width:7px;height:7px}
        ::-webkit-scrollbar-track{background:${C.court}}
        ::-webkit-scrollbar-thumb{background:${C.lift};border-radius:999px}
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
          background:C.panel, border:`1px solid ${C.live}66`, borderRadius:10,
          padding:"10px 22px", color:C.live, fontSize:13, fontWeight:600,
          zIndex:9999, animation:"fadeUp .3s ease", boxShadow:"0 8px 32px #0008" }}>
          ✓ {toast}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
          background:C.panel, border:`1px solid ${C.live}66`, borderRadius:10,
          padding:"10px 22px", color:C.live, fontSize:13, fontWeight:600,
          zIndex:9999, animation:"fadeUp .3s ease", boxShadow:"0 8px 32px #0008" }}>
          ✓ {toast}
        </div>
      )}

      {showFeedbackPopup && (
        <div onClick={closeFeedbackPopup} style={{ position:"fixed", inset:0, background:"rgba(8,15,24,0.72)", display:"flex", alignItems:"center", justifyContent:"center", padding:20, zIndex:9998, opacity:1, animation:"fadeUp .25s ease" }}>
          <div onClick={e => e.stopPropagation()} style={{ width:"min(520px,100%)", background:C.panel, border:`1px solid ${C.border}`, borderRadius:24, boxShadow:"0 30px 90px rgba(0,0,0,0.45)", padding:28, position:"relative", transform:"scale(1)", transition:"transform .25s ease, opacity .25s ease", opacity:1 }}>
            <button onClick={closeFeedbackPopup} style={{ position:"absolute", top:16, right:16, width:36, height:36, borderRadius:18, border:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.04)", color:C.text, fontSize:18, cursor:"pointer" }}>
              ×
            </button>
            <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:16 }}>
              <div style={{ width:44, height:44, borderRadius:18, background:C.live, display:"grid", placeItems:"center", color:C.court, fontSize:18, fontWeight:800 }}>
                💬
              </div>
              <div>
                <div style={{ fontSize:18, fontWeight:800, color:C.text, marginBottom:4 }}>Built by a Competitive Junior Player.</div>
                <div style={{ fontSize:13, color:C.sub, lineHeight:1.7 }}>I'm building TennisIQ to help players track matches, improve, and plan their journey.</div>
              </div>
            </div>
            <p style={{ margin:0, color:C.text, fontSize:14, lineHeight:1.8, marginBottom:22 }}>
              I'd love your feedback. It will take you just a minute.
            </p>
            <button onClick={openFeedbackForm} style={{ width:"100%", padding:"14px 18px", background:C.live, color:C.court, border:`1px solid ${C.live}`, fontSize:14, fontWeight:700, borderRadius:14, cursor:"pointer" }}>
              💬 Give Feedback
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background:`linear-gradient(180deg,${C.deep} 0%,${C.court} 100%)`,
        borderBottom:`1px solid ${C.border}`, padding:"18px 28px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        boxShadow:"0 24px 70px rgba(0,0,0,0.24)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <svg width="32" height="32" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="8" fill={C.clay} />
            <rect x="4" y="14" width="24" height="4" rx="1" fill="#fff" opacity=".15" />
            <rect x="14" y="4" width="4" height="24" rx="1" fill="#fff" opacity=".15" />
            <circle cx="16" cy="16" r="5" fill="none" stroke="#fff" strokeWidth="2" />
            <circle cx="16" cy="16" r="2" fill="#fff" />
          </svg>
          <div>
            <span style={{ fontSize:20, fontWeight:900, letterSpacing:-0.5, color:C.text }}>
              Tennis<span style={{ color:C.clay }}>IQ</span>
            </span>
            <span style={{ fontSize:10, color:C.sub, marginLeft:8, letterSpacing:1.5, textTransform:"uppercase" }}>
              Coach
            </span>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:20 }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.clay, fontFamily:FONT.mono }}>UTR 10.1</div>
            <div style={{ fontSize:10, color:C.sub, letterSpacing:1 }}></div>
          </div>
          <Pill v="v4.0" good={null} />
        </div>
      </div>

      {/* Nav */}
      <div style={{ display:"flex", gap:10, padding:"14px 28px",
        borderBottom:`1px solid ${C.border}`, background:C.deep, overflowX:"auto" }}>
        {TABS.map(([id,label]) => (
          <button key={id} onClick={() => { setTab(id); setAiText(""); setSel(null); }}
            style={{ padding:"10px 18px", borderRadius:999, border:"1px solid transparent", cursor:"pointer",
              fontSize:13, fontWeight:700, letterSpacing:0.5,
              background:tab===id?`linear-gradient(135deg, ${C.clay}, ${C.purple})`:C.lift,
              color:tab===id?"#fff":C.sub, transition:"all .25s ease", fontFamily:FONT.display,
              whiteSpace:"nowrap", boxShadow:tab===id?`0 18px 46px rgba(212,99,30,0.18)`:"none" }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ padding:"30px 28px 42px", maxWidth:1180, margin:"0 auto", display:"flex", flexDirection:"column", gap:26 }}>

        {/* Onboarding: show welcome card when no matches logged */}
        {matches.length === 0 && (
          <div style={{ animation: "fadeUp .45s ease" }}>
            <Card glow style={{ display: "flex", gap: 18, alignItems: "center", padding: 24, marginBottom: 18, borderRadius: 18, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: C.text }}>Welcome to TennisIQ 🎾</div>
                <p style={{ color: C.sub, marginTop: 10, lineHeight: 1.6 }}>
                  <strong>Step 1:</strong> Log your first match.
                  <br />
                  Everything else — AI Coach, Compare, UTR Targets and Progress — becomes more useful after you start logging matches.
                </p>
                <div style={{ marginTop: 14 }}>
                  <button style={btn(true)} onClick={() => { setTab("log"); setShowAdd(true); setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 80); }}>
                    Log First Match
                  </button>
                </div>
              </div>
              <div style={{ width: 140, display: 'flex', justifyContent: 'center' }}>
                <IQRing score={10} size={120} />
              </div>
            </Card>
          </div>
        )}

        {/* ══ COACH TAB ══════════════════════════════════════════════════════*/}
        {tab === "coach" && (
          <div style={{ animation:"fadeUp .4s ease" }}>

            {/* Sub-nav */}
            <div style={{ display:"flex", gap:8, marginBottom:22 }}>
              {[["insights","💡 AI Insights"],["predict","📈 UTR Predictor"],["training","🏋️ Training Plan"]].map(([id,label]) => (
                <button key={id} onClick={() => setCoachView(id)}
                  style={{ ...btn(coachView===id, true), borderRadius:8 }}>{label}</button>
              ))}
            </div>

            {/* ── AI Insights ─────────────────────────────────────────────── */}
            {coachView === "insights" && (
              <>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:20 }}>
                  {[
                    { label:"Season TennisIQ",  val:avgIQ,       sub:iqLabel(avgIQ)[0],            col:iqLabel(avgIQ)[1] },
                    { label:"Win Rate",          val:`${winRate}%`,sub:`${wins}W · ${matches.length-wins}L`, col:C.live },
                    { label:"IQ Trend",          val:`${trend>0?"+":""}${trend}`, sub:"last 3 matches", col:trend>=0?C.live:C.red },
                    { label:"Predicted UTR",     val:utrPred?.predicted||"10.1",
                      sub:utrPred?`${utrPred.delta>=0?"+":""}${utrPred.delta} in next 10 matches`:"loading…",
                      col:utrPred?.delta>=0?C.live:C.yellow },
                  ].map(({ label,val,sub,col }) => (
                    <Card key={label} style={{ padding:"16px 18px" }}>
                      <div style={{ fontSize:10, color:C.sub, letterSpacing:1.5, textTransform:"uppercase", marginBottom:5 }}>{label}</div>
                      <div style={{ fontSize:28, fontWeight:900, fontFamily:FONT.mono, color:col, lineHeight:1 }}>{val}</div>
                      <div style={{ fontSize:11, color:C.sub, marginTop:4 }}>{sub}</div>
                    </Card>
                  ))}
                </div>

                <Card style={{ marginBottom:18 }}>
                  <Section title="Data-Driven Insights" action={
                    <button style={btn(true,true)} onClick={runCoachReport}>⚡ Full AI Report</button>
                  }>
                    {insights.length === 0
                      ? <p style={{ color:C.sub, fontSize:13 }}>Add more matches to unlock insights.</p>
                      : <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                          {insights.map((ins, i) => <InsightCard key={i} insight={ins} />)}
                        </div>
                    }
                  </Section>
                </Card>

                <AIBlock loading={aiLoading} text={aiText} />

                {coachVideoMetrics.length > 0 && (
                  <Card style={{ marginTop:18 }}>
                    <Section title="Video Recommendations">
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:14 }}>
                        {coachVideoMetrics.map(metric => (
                          <Videos key={metric} metric={metric} />
                        ))}
                      </div>
                    </Section>
                  </Card>
                )}

                {/* Surface Performance */}
                <Card style={{ marginTop:18 }}>
                  <Section title="Performance by Surface">
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:12 }}>
                      {surfaceStats.map(s => (
                        <div key={s.surface} style={{ background:C.lift, border:`1px solid ${s.col}33`,
                          borderRadius:9, padding:"14px 16px" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                            <SurfaceBadge s={s.surface} />
                            <span style={{ fontSize:10, color:C.sub }}>{s.count} matches</span>
                          </div>
                          <div style={{ fontSize:26, fontWeight:900, fontFamily:FONT.mono, color:s.col }}>{s.wr}%</div>
                          <div style={{ fontSize:11, color:C.sub, marginTop:2 }}>Win rate · avg IQ {s.iq}</div>
                        </div>
                      ))}
                    </div>
                  </Section>
                </Card>
              </>
            )}

            {/* ── UTR Predictor ────────────────────────────────────────────── */}
            {coachView === "predict" && utrPred && (
              <>
                <Card style={{ marginBottom:18 }}>
                  <Section title="UTR Trajectory Model">
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:20 }}>
                      {[
                        { label:"Current UTR",   val:"10.1",              col:C.yellow },
                        { label:"Predicted UTR", val:utrPred.predicted,   col:utrPred.delta>=0?C.live:C.red },
                        { label:"Delta",         val:`${utrPred.delta>=0?"+":""}${utrPred.delta}`, col:utrPred.delta>=0?C.live:C.red },
                      ].map(({ label,val,col }) => (
                        <div key={label} style={{ background:C.lift, borderRadius:9, padding:"16px" }}>
                          <div style={{ fontSize:10, color:C.sub, letterSpacing:1.5, marginBottom:6, textTransform:"uppercase" }}>{label}</div>
                          <div style={{ fontSize:30, fontWeight:900, fontFamily:FONT.mono, color:col }}>{val}</div>
                        </div>
                      ))}
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={[{label:"Now",utr:10.1},...utrPred.trajectory]}>
                        <defs>
                          <linearGradient id="utrGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={C.live} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={C.live} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" tick={{ fill:C.sub, fontSize:10 }} axisLine={false} tickLine={false} />
                        <YAxis domain={[9.5,11]} tick={{ fill:C.sub, fontSize:10 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background:C.mid, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:12 }} />
                        <ReferenceLine y={10.1} stroke={C.yellow} strokeDasharray="4 3"
                          label={{ value:"Current 10.1", fill:C.yellow, fontSize:10, dy:-6 }} />
                        <Area type="monotone" dataKey="utr" name="Predicted UTR"
                          stroke={C.live} strokeWidth={2.5} fill="url(#utrGrad)"
                          dot={{ fill:C.live, r:4, stroke:C.court, strokeWidth:2 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                    <p style={{ fontSize:12, color:C.sub, marginTop:10, lineHeight:1.6 }}>
                      Model uses: recent form (last 6 matches), IQ trajectory, win rate vs opponent quality, and serve/return trends.
                      Based on current trajectory — maintain first serve % above 65 to accelerate.
                    </p>
                  </Section>
                </Card>

                {/* Custom matchup predictor */}
                <Card>
                  <Section title="Custom Matchup Win Probability">
                    <div style={{ display:"flex", gap:12, alignItems:"flex-end", marginBottom:18 }}>
                      <div style={{ flex:1, maxWidth:240 }}>
                        <div style={{ fontSize:11, color:C.sub, marginBottom:6, letterSpacing:1 }}>OPPONENT UTR</div>
                        <input style={inp} value={predUTR} onChange={e => setPredUTR(e.target.value)} placeholder="e.g. 11.0" />
                      </div>
                      {predUTR && !isNaN(parseFloat(predUTR)) && (
                        <div style={{ padding:"10px 22px", background:C.lift, borderRadius:9,
                          textAlign:"center", border:`1px solid ${C.border}` }}>
                          <div style={{ fontSize:11, color:C.sub, marginBottom:3, letterSpacing:1 }}>WIN PROB</div>
                          <div style={{ fontSize:28, fontWeight:900, fontFamily:FONT.mono,
                            color:winProb(avgIQ,parseFloat(predUTR))>=50?C.live:C.red }}>
                            {winProb(avgIQ,parseFloat(predUTR))}%
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10 }}>
                      {[8.5,9.0,9.5,10.0,10.3,10.5,10.8,11.0,11.3,11.6].map(utr => {
                        const p = winProb(avgIQ,utr);
                        const col = p>=65?C.live:p>=48?C.yellow:C.red;
                        return (
                          <div key={utr} style={{ background:C.lift, border:`1px solid ${col}33`,
                            borderRadius:9, padding:"12px 8px", textAlign:"center" }}>
                            <div style={{ color:C.sub, fontSize:10, letterSpacing:0.5, marginBottom:4 }}>vs {utr}</div>
                            <div style={{ fontSize:22, fontWeight:900, fontFamily:FONT.mono, color:col }}>{p}%</div>
                          </div>
                        );
                      })}
                    </div>
                  </Section>
                </Card>
              </>
            )}

            {/* ── Training Plan ─────────────────────────────────────────────── */}
            {coachView === "training" && (
              <Card>
                <Section title="Personalised Training Focus" action={
                  <button style={btn(true,true)} onClick={() => callAI(
                    `Create a detailed 4-week training plan for a UTR 10.1 junior tennis player.
Top 3 weaknesses: ${trainingFocus.map(w=>`${w.label} (${w.pct}% below benchmark)`).join(", ")}.
Surface split: ${surfaceStats.map(s=>`${s.surface} ${s.count} matches`).join(", ")}.
Win rate: ${winRate}%. Avg IQ: ${avgIQ}.
Format as 5 bullets with specific drills, durations, and goals. Start each with "•".`
                  )}>⚡ AI Plan</button>
                }>
                  <p style={{ color:C.sub, fontSize:13, marginBottom:20, lineHeight:1.6 }}>
                    Based on your data, here are the 3 highest-impact areas to train this week.
                    Click a row to see the drill. Use "AI Plan" for a full 4-week programme.
                  </p>
                  {trainingFocus.map((w, i) => (
                    <div key={w.k} style={{ background:C.lift, border:`1px solid ${C.border}`,
                      borderRadius:10, padding:"16px 18px", marginBottom:12 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                            <span style={{ background:C.clay, color:"#fff", borderRadius:5,
                              fontSize:11, fontWeight:800, padding:"2px 8px" }}>#{i+1}</span>
                            <span style={{ fontWeight:700, fontSize:14 }}>{w.label}</span>
                            <Pill v={`${w.pct}% gap`} good={false} />
                          </div>
                          <div style={{ color:C.sub, fontSize:12, lineHeight:1.6 }}>
                            Current <span style={{ color:C.text, fontFamily:FONT.mono }}>{w.val}{w.unit}</span>
                            {" → "} Target <span style={{ color:C.live, fontFamily:FONT.mono }}>{w.bench}{w.unit}</span>
                          </div>
                          {w.drill && (
                            <div style={{ marginTop:10, display:"flex", gap:14 }}>
                              <span style={{ fontSize:12, color:C.text }}>🎾 <strong>Drill:</strong> {w.drill}</span>
                              <span style={{ fontSize:12, color:C.yellow }}>⏱ {w.time}</span>
                            </div>
                          )}
                          {w.priority && (
                            <div style={{ marginTop:6, fontSize:12, color:C.sub }}>
                              🎯 <strong style={{ color:C.text }}>Focus:</strong> {w.priority}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign:"center", minWidth:60 }}>
                          <div style={{ fontSize:10, color:C.sub, marginBottom:3 }}>IMPACT</div>
                          <div style={{ fontSize:22, fontWeight:900, fontFamily:FONT.mono, color:C.clay }}>
                            +{Math.round(w.pct*0.3)}pp
                          </div>
                          <div style={{ fontSize:10, color:C.sub }}>win prob</div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Suggested focus summary */}
                  <div style={{ marginTop:16, padding:"14px 16px",
                    background:`linear-gradient(135deg,${C.mid},${C.panel})`,
                    border:`1px solid ${C.clay}44`, borderRadius:10 }}>
                    <div style={{ fontSize:11, color:C.clay, fontWeight:700, letterSpacing:2,
                      textTransform:"uppercase", marginBottom:8 }}>Suggested Training Focus</div>
                    <div style={{ fontSize:14, color:C.text, fontWeight:600 }}>
                      🎾 {trainingFocus[0]?.label || "Serve"} + {trainingFocus[1]?.label || "Return"}
                    </div>
                    <div style={{ fontSize:12, color:C.sub, marginTop:4 }}>
                      Fixing your top 2 gaps adds an estimated +{Math.round((trainingFocus[0]?.pct||0)*0.3 + (trainingFocus[1]?.pct||0)*0.3)}pp win probability vs UTR 10.5 opponents.
                    </div>
                  </div>
                </Section>
                <AIBlock loading={aiLoading} text={aiText} />
              </Card>
            )}
          </div>
        )}

        {/* ══ DASHBOARD ══════════════════════════════════════════════════════*/}
        {tab === "dashboard" && (
          <div style={{ animation:"fadeUp .4s ease" }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:22 }}>
              {[
                { label:"Avg TennisIQ",  val:avgIQ,         sub:iqLabel(avgIQ)[0],             col:iqLabel(avgIQ)[1] },
                { label:"Win Rate",       val:`${winRate}%`, sub:`${wins}W / ${matches.length-wins}L`, col:C.live },
                { label:"IQ Trend",       val:`${trend>0?"+":""}${trend}`, sub:"last 3 matches",  col:trend>=0?C.live:C.red },
                { label:"Matches Logged", val:matches.length, sub:`Best IQ: ${best.iq}`,         col:C.yellow },
              ].map(({ label,val,sub,col }) => (
                <Card key={label}>
                  <div style={{ fontSize:10.5, color:C.sub, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>{label}</div>
                  <div style={{ fontSize:30, fontWeight:900, fontFamily:FONT.mono, color:col, lineHeight:1 }}>{val}</div>
                  <div style={{ fontSize:11, color:C.sub, marginTop:5 }}>{sub}</div>
                </Card>
              ))}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1.35fr", gap:18, marginBottom:18 }}>
              <Card>
                <Section title="Performance Profile">
                  <div style={{ display:"flex", justifyContent:"center", marginBottom:18 }}>
                    <IQRing score={avgIQ} size={130} />
                  </div>
                  <ResponsiveContainer width="100%" height={190}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke={C.border} />
                      <PolarAngleAxis dataKey="subject" tick={{ fill:C.sub, fontSize:10 }} />
                      <Radar name="You" dataKey="You" stroke={C.clay} fill={C.clay} fillOpacity={0.25} strokeWidth={2} />
                      <Radar name="Target" dataKey="Target" stroke={C.yellow} fill="transparent" strokeWidth={1.2} strokeDasharray="4 3" />
                    </RadarChart>
                  </ResponsiveContainer>
                </Section>
              </Card>

              <Card>
                <Section title="IQ Timeline">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={timelineData}>
                      <defs>
                        <linearGradient id="iqGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={C.clay} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={C.clay} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill:C.sub, fontSize:10 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[35,100]} tick={{ fill:C.sub, fontSize:10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<TT />} />
                      <ReferenceLine y={avgIQ} stroke={C.clay} strokeDasharray="5 4"
                        label={{ value:`avg ${avgIQ}`, fill:C.clay, fontSize:10, dy:-6 }} />
                      <Area type="monotone" dataKey="iq" name="TennisIQ" stroke={C.clay} strokeWidth={2.5}
                        fill="url(#iqGrad)"
                        dot={p => <circle key={p.index} cx={p.cx} cy={p.cy} r={5}
                          fill={p.payload.won?C.live:C.red} stroke={C.court} strokeWidth={2}
                          style={{ filter:`drop-shadow(0 0 4px ${p.payload.won?C.live:C.red})` }} />} />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div style={{ display:"flex", gap:18, justifyContent:"center", marginTop:8 }}>
                    <span style={{ fontSize:11, color:C.sub }}><span style={{ color:C.live }}>●</span> Win</span>
                    <span style={{ fontSize:11, color:C.sub }}><span style={{ color:C.red }}>●</span> Loss</span>
                  </div>
                </Section>
              </Card>
            </div>

            <Card glow>
              <Section title="Peak Performance">
                <div style={{ display:"grid", gridTemplateColumns:"auto 1fr auto", gap:24, alignItems:"start" }}>
                  <IQRing score={best.iq} size={100} />
                  <div>
                    <div style={{ fontWeight:700, fontSize:16, marginBottom:4 }}>
                      vs {best.opp} <Pill v={`UTR ${best.oppUTR}`} good={null} />
                    </div>
                    <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                      <Pill v={`WIN ${best.score}`} good={true} />
                      <SurfaceBadge s={best.surface||"Hard"} />
                    </div>
                    {strengths(best).map(s => (
                      <div key={s.k} style={{ fontSize:13, color:C.sub, marginBottom:5 }}>
                        <span style={{ color:C.live }}>↑ </span>
                        {s.label}: <span style={{ color:C.text, fontWeight:700 }}>{s.val}{s.unit}</span>
                        <span style={{ color:C.sub, fontSize:11 }}> (bench {s.bench}{s.unit})</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:11, color:C.sub, marginBottom:4, letterSpacing:1 }}>WIN PROB vs 10.0</div>
                    <div style={{ fontSize:28, fontWeight:900, fontFamily:FONT.mono, color:C.live }}>
                      {winProb(best.iq, 10.0)}%
                    </div>
                  </div>
                </div>
              </Section>
            </Card>
          </div>
        )}

        {/* ══ TOURNAMENT PLANNER ═══════════════════════════════════════════════*/}
        {tab === "planner" && (
          <div style={{ animation:"fadeUp .4s ease" }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:14, marginBottom:22 }}>
              {[
                { label:"Season Budget", value:`$${totalSeasonSpend.toLocaleString()}`, sub:`${tournaments.length} tournaments`, color:C.live },
                { label:"Average Cost", value:`$${avgTournamentCost.toLocaleString()}`, sub:"Per tournament", color:C.yellow },
                { label:"Upcoming Spend", value:`$${upcomingExpenses.toLocaleString()}`, sub: nextTournament ? `Next: ${nextTournament.name}` : "No upcoming events", color:C.clay },
                { label:"Top Expense", value: highestExpenseCategory?.cat ? highestExpenseCategory.cat : "N/A", sub:`$${highestExpenseCategory?.total||0}`, color:C.purple },
              ].map(item => (
                <Card key={item.label} style={{ padding:"18px 20px", borderRadius:16 }}>
                  <div style={{ fontSize:11, color:C.sub, letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>{item.label}</div>
                  <div style={{ fontSize:28, fontWeight:900, fontFamily:FONT.mono, color:item.color }}>{item.value}</div>
                  <div style={{ fontSize:11, color:C.sub, marginTop:6 }}>{item.sub}</div>
                </Card>
              ))}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1.2fr 0.8fr", gap:18, marginBottom:18, alignItems:"start" }}>
              <Card>
                <Section title="Budget Momentum">
                  {monthlySpendData.length ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={monthlySpendData.map(([month, total]) => ({ month, total }))}>
                        <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" tick={{ fill:C.sub, fontSize:11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill:C.sub, fontSize:11 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background:C.mid, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:12 }} />
                        <Bar dataKey="total" fill={C.clay} radius={[10,10,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p style={{ color:C.sub, fontSize:13, margin:0 }}>Plan tournaments to populate monthly spend and budget trends.</p>
                  )}
                </Section>
              </Card>

              <Card>
                <Section title="Planner Summary" action={
                  <button style={btn(true)} onClick={() => setShowTournamentForm(true)}>
                    Add Event
                  </button>
                }>
                  <div style={{ fontSize:13, color:C.sub, marginBottom:16, lineHeight:1.75 }}>
                    Keep travel, entry and hospitality costs aligned with your season budget.
                    Use the planner to manage upcoming events, compare expenses, and keep next tournament preparation on track.
                  </div>
                  <div style={{ display:"grid", gap:8 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", gap:10 }}>
                      <span style={{ color:C.sub }}>Upcoming tournaments</span>
                      <strong style={{ color:C.text }}>{upcomingTournaments.length}</strong>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", gap:10 }}>
                      <span style={{ color:C.sub }}>Next event</span>
                      <strong style={{ color:C.text }}>{nextTournament ? `${nextTournament.name} · ${nextTournament.date}` : "None"}</strong>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", gap:10 }}>
                      <span style={{ color:C.sub }}>Forecasted spend</span>
                      <strong style={{ color:C.text }}>${upcomingExpenses.toLocaleString()}</strong>
                    </div>
                  </div>
                </Section>

                {showTournamentForm && (
                  <Section title={editingTournamentId ? "Edit Tournament" : "New Tournament"} action={
                    <button style={btn(false,false,true)} onClick={cancelTournamentForm}>Cancel</button>
                  }>
                    <form onSubmit={saveTournament} style={{ display:"grid", gap:12 }}>
                      {[
                        ["name","Tournament"], ["date","Date"], ["location","Location"],
                        ["entry","Entry"], ["flight","Flight"], ["hotel","Hotel"],
                        ["food","Food"], ["transport","Transport"], ["notes","Notes"],
                      ].map(([key,label]) => (
                        <div key={key} style={{ display:"grid", gap:6 }}>
                          <label style={{ fontSize:12, color:C.sub, fontWeight:700 }}>{label}</label>
                          {key === "notes" ? (
                            <textarea
                              name={key}
                              value={newTournament[key]}
                              onChange={e => setNewTournament(prev => ({ ...prev, [key]: e.target.value }))}
                              style={{ ...inp, minHeight:88, resize:"vertical" }}
                            />
                          ) : (
                            <input
                              name={key}
                              type={key === "date" ? "date" : "text"}
                              value={newTournament[key]}
                              onChange={e => setNewTournament(prev => ({ ...prev, [key]: e.target.value }))}
                              style={inp}
                            />
                          )}
                        </div>
                      ))}
                      <button type="submit" style={btn(true)}>
                        {editingTournamentId ? "Save Changes" : "Save Tournament"}
                      </button>
                    </form>
                  </Section>
                )}
              </Card>
            </div>

            <Card>
              <Section title={`Tournament Schedule (${tournaments.length})`} action={
                <button style={btn(true)} onClick={() => setShowTournamentForm(true)}>New Tournament</button>
              }>
                {tournaments.length === 0 ? (
                  <p style={{ color:C.sub, fontSize:13, margin:0 }}>Your planner is empty. Add a tournament to start tracking budget and travel costs.</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Date</th>
                        <th>Location</th>
                        <th>Cost</th>
                        <th style={{ textAlign:"right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tournaments.map(t => {
                        const total = ["entry","flight","hotel","food","transport"].reduce(
                          (sum, key) => sum + Number(t[key] || 0), 0);
                        return (
                          <tr key={t.id}>
                            <td>{t.name || "Untitled"}</td>
                            <td>{t.date}</td>
                            <td>{t.location || "TBD"}</td>
                            <td>${total.toLocaleString()}</td>
                            <td style={{ textAlign:"right", display:"flex", justifyContent:"flex-end", gap:8 }}>
                              <button type="button" onClick={() => editTournament(t)} style={{ ...btn(false,false,true), minWidth:88 }}>Edit</button>
                              <button type="button" onClick={() => deleteTournament(t.id)} style={{ ...btn(false,false,true), background:"#ef4444" }}>Delete</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </Section>
            </Card>
          </div>
        )}

        {/* ══ UTR TARGET ═════════════════════════════════════════════════════─*/}
        {tab === "target" && (
          <div style={{ animation:"fadeUp .4s ease" }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:14, marginBottom:22 }}>
              <Card>
                <Section title="UTR Target Planner">
                  <div style={{ display:"grid", gap:10 }}>
                    <div style={{ display:"grid", gap:6 }}>
                      <label style={{ fontSize:12, color:C.sub, fontWeight:700 }}>Current UTR</label>
                      <input name="currentUtr" value={currentUtr} onChange={e => setCurrentUtr(e.target.value)} placeholder="e.g. 10.1" style={inp} />
                    </div>
                    <div style={{ display:"grid", gap:6 }}>
                      <label style={{ fontSize:12, color:C.sub, fontWeight:700 }}>Target UTR</label>
                      <input name="targetUtr" value={targetUtr} onChange={e => setTargetUtr(e.target.value)} placeholder="e.g. 11.0" style={inp} />
                    </div>
                    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                      <label style={{ fontSize:12, color:C.sub, fontWeight:700, minWidth:90 }}>Timeline</label>
                      <select value={timeframe} onChange={e => setTimeframe(e.target.value)} style={{ ...inp, width:140 }}>
                        <option value="3">3 months</option>
                        <option value="6">6 months</option>
                        <option value="12">12 months</option>
                      </select>
                      <div style={{ marginLeft:"auto" }}>
                        <button style={btn(true)} onClick={() => {
                          if (!currentUtr || !targetUtr) return setTargetPlan(null);
                          const cur = Number(currentUtr);
                          const tgt = Number(targetUtr);
                          if (isNaN(cur) || isNaN(tgt)) return setTargetPlan(null);
                          const gap = Math.max(0, tgt - cur);
                          const mult = ({ "3":1.25, "6":1, "12":0.72 } as any)[timeframe] || 1;
                          const qualityWins = Math.max(0, Math.ceil(gap * 5 * mult));
                          const upsetWins = Math.max(0, Math.ceil(gap * 8 * mult));
                          const months = Number(timeframe) || 1;
                          const tournamentsPerMonth = Math.max(0, Math.ceil((qualityWins + upsetWins) / months / 2));
                          const improvement = Math.ceil(gap * 2);
                          const benchmarks = {
                            firstServeIn: Math.min(95, Math.round(B.firstServeIn.bench + improvement*2)),
                            firstServeWon: Math.min(95, Math.round(B.firstServeWon.bench + improvement*2)),
                            secondServeWon: Math.min(95, Math.round(B.secondServeWon.bench + improvement*1.5)),
                            returnWon: Math.min(95, Math.round(B.returnWon.bench + improvement*2)),
                            unforced: Math.max(0, Math.round(B.unforced.bench - improvement*2)),
                          };
                          setTargetPlan({ gap, qualityWins, upsetWins, tournamentsPerMonth, benchmarks });
                        }}>Generate Plan</button>
                      </div>
                    </div>
                  </div>
                </Section>
              </Card>

              <Card>
                <Section title="Quick Summary">
                  {!currentUtr || !targetUtr ? (
                    <p style={{ color:C.sub }}>Enter your current and target UTR to generate a plan.</p>
                  ) : (!targetPlan) ? (
                    <p style={{ color:C.sub }}>Click "Generate Plan" to calculate suggested wins and benchmarks.</p>
                  ) : (
                    <div style={{ display:"grid", gap:10 }}>
                      <div style={{ display:"flex", justifyContent:"space-between" }}>
                        <div style={{ color:C.sub }}>UTR Gap</div>
                        <div style={{ fontWeight:800 }}>{targetPlan.gap.toFixed(2)}</div>
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between" }}>
                        <div style={{ color:C.sub }}>Suggested quality wins</div>
                        <div style={{ fontWeight:800 }}>{targetPlan.qualityWins}</div>
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between" }}>
                        <div style={{ color:C.sub }}>Suggested upset wins</div>
                        <div style={{ fontWeight:800 }}>{targetPlan.upsetWins}</div>
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between" }}>
                        <div style={{ color:C.sub }}>Tournaments / month</div>
                        <div style={{ fontWeight:800 }}>{targetPlan.tournamentsPerMonth}</div>
                      </div>
                    </div>
                  )}
                </Section>
              </Card>

              <Card>
                <Section title="Target Benchmarks">
                  {!targetPlan ? (
                    <p style={{ color:C.sub }}>Benchmarks will appear after generating a plan.</p>
                  ) : (
                    <div style={{ display:"grid", gap:8 }}>
                      <div style={{ display:"flex", justifyContent:"space-between" }}>
                        <div style={{ color:C.sub }}>1st Serve In %</div>
                        <div style={{ fontWeight:800 }}>{targetPlan.benchmarks.firstServeIn}%</div>
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between" }}>
                        <div style={{ color:C.sub }}>1st Serve Won %</div>
                        <div style={{ fontWeight:800 }}>{targetPlan.benchmarks.firstServeWon}%</div>
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between" }}>
                        <div style={{ color:C.sub }}>2nd Serve Won %</div>
                        <div style={{ fontWeight:800 }}>{targetPlan.benchmarks.secondServeWon}%</div>
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between" }}>
                        <div style={{ color:C.sub }}>Return Won %</div>
                        <div style={{ fontWeight:800 }}>{targetPlan.benchmarks.returnWon}%</div>
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between" }}>
                        <div style={{ color:C.sub }}>Unforced Errors</div>
                        <div style={{ fontWeight:800 }}>{targetPlan.benchmarks.unforced}</div>
                      </div>
                    </div>
                  )}
                </Section>
              </Card>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:18 }}>
              <Card>
                <Section title="Plan Notes">
                  <p style={{ color:C.sub }}>This planner generates suggested targets using simple heuristics based on the UTR gap and timeline. Use it as a guideline — train to improve the benchmarks while increasing quality of competition.</p>
                </Section>
              </Card>
            </div>
          </div>
        )}

        {/* ══ BENCHMARK ══════════════════════════════════════════════════════*/}
        {tab === "compare" && (
          <div style={{ animation:"fadeUp .4s ease" }}>
            <Card style={{ marginBottom:18 }}>
              <Section title="Select Match">
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {matches.map((m) => ( 
  <div key={m.id} style={{ display:"flex", gap:8, alignItems:"center" }}>

    <button
      onClick={() => {
        setSel(m);
        setAiText("");
      }}
      style={btn(sel?.id === m.id, true)}
    >
      vs {m.opp} · <span style={{ fontFamily: FONT.mono }}>{m.iq}</span>
    </button>

    <button
      onClick={() => deleteMatch(m.id)}
      style={{
        background:"#ef4444",
        color:"white",
        border:"none",
        borderRadius:8,
        padding:"6px 12px",
        cursor:"pointer",
        fontWeight:700
      }}
    >
      Delete
    </button>

  </div>
))}
                   
                </div>
              </Section>
            </Card>

            {sel ? (
              <>
                <Card style={{ marginBottom:18 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
                    <div>
                      <div style={{ fontSize:17, fontWeight:800, marginBottom:8 }}>vs {sel.opp}</div>
                      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                        <Pill v={`UTR ${sel.oppUTR}`} good={null} />
                        <Pill v={sel.won?`WIN ${sel.score}`:`LOSS ${sel.score}`} good={sel.won} />
                        <Pill v={sel.date} good={null} />
                        {sel.surface && <SurfaceBadge s={sel.surface} />}
                      </div>
                    </div>
                    <IQRing score={sel.iq} size={100} />
                  </div>
                  <Divider />
                  {Object.entries(B).map(([k,b]) => (
                    <StatRow key={k} label={b.label} val={sel[k]} bench={b.bench} unit={b.unit} hi={b.hi} />
                  ))}
                  <Divider />
                  <Section title="Top Gaps This Match">
                    {weaknesses(sel).map((w,i) => (
                      <div key={w.k} style={{ display:"flex", justifyContent:"space-between",
                        alignItems:"center", padding:"9px 0", borderBottom:`1px solid ${C.border}22` }}>
                        <div>
                          <span style={{ color:C.text, fontWeight:600 }}>#{i+1} {w.label}</span>
                          <span style={{ color:C.sub, fontSize:12, marginLeft:10 }}>
                            {w.val}{w.unit} → need {w.bench}{w.unit}
                          </span>
                        </div>
                        <Pill v={`${w.pct}% below`} good={false} />
                      </div>
                    ))}
                    <div style={{ marginTop:14, padding:"12px 14px", background:C.lift,
                      borderRadius:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ color:C.sub, fontSize:13 }}>Fix these → estimated UTR gain</span>
                      <span style={{ color:C.yellow, fontFamily:FONT.mono, fontWeight:700 }}>
                        +{utrImpact(weaknesses(sel))} UTR pts
                      </span>
                    </div>
                  </Section>
                  <button style={btn(true)} onClick={() => analyseMatch(sel)}>⚡ AI Coaching Report</button>
                </Card>
                <AIBlock loading={aiLoading} text={aiText} />
              </>
            ) : (
              <div style={{ textAlign:"center", color:C.sub, padding:48 }}>
                Select a match above to compare stats against benchmarks
              </div>
            )}
          </div>
        )}

        {/* ══ SCOUT ══════════════════════════════════════════════════════════*/}
        {tab === "scout" && (
          <div style={{ animation:"fadeUp .4s ease" }}>
            <Card style={{ marginBottom:18 }}>
              <Section title="Opponent UTR">
                <div style={{ display:"flex", gap:12, alignItems:"flex-end" }}>
                  <div style={{ flex:1, maxWidth:220 }}>
                    <input style={inp} value={scoutUTR}
                      onChange={e => setScoutUTR(e.target.value)} placeholder="e.g. 10.8" />
                  </div>
                  <button style={btn(true)} onClick={runScout}>Generate Report</button>
                </div>
              </Section>
            </Card>

            {scoutData && (
              <Card style={{ marginBottom:18 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                  <div>
                    <div style={{ fontSize:17, fontWeight:800 }}>vs UTR {scoutData.opp}</div>
                    <div style={{ color:C.sub, fontSize:13, marginTop:4 }}>
                      Based on your last {matches.length} matches
                    </div>
                  </div>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:11, color:C.sub, marginBottom:4, letterSpacing:1 }}>WIN PROBABILITY</div>
                    <div style={{ fontSize:38, fontWeight:900, fontFamily:FONT.mono,
                      color:scoutData.prob>=55?C.live:scoutData.prob>=45?C.yellow:C.red, lineHeight:1 }}>
                      {scoutData.prob}%
                    </div>
                  </div>
                </div>
                <Divider />
                <Section title="Stats: High UTR vs Low UTR Opponents">
                  <ResponsiveContainer width="100%" height={210}>
                    <BarChart data={scoutData.patterns.slice(0,7)} barCategoryGap="30%">
                      <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="stat" tick={{ fill:C.sub, fontSize:10 }}
                        axisLine={false} tickLine={false} tickFormatter={v=>v.split(" ")[0]} />
                      <YAxis tick={{ fill:C.sub, fontSize:10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background:C.mid, border:`1px solid ${C.border}`,
                        borderRadius:8, color:C.text, fontSize:12 }} />
                      <Bar dataKey="vsHigh" name="vs High UTR" fill={C.red}    radius={[3,3,0,0]} />
                      <Bar dataKey="vsLow"  name="vs Low UTR"  fill={C.live}   radius={[3,3,0,0]} />
                      <Bar dataKey="bench"  name="Benchmark"   fill={C.yellow} radius={[3,3,0,0]} opacity={0.6} />
                    </BarChart>
                  </ResponsiveContainer>
                </Section>
              </Card>
            )}
            <AIBlock loading={aiLoading} text={aiText} />
          </div>
        )}

        {/* ══ PROGRESS ═══════════════════════════════════════════════════════*/}
        {tab === "progress" && (
          <div style={{ animation:"fadeUp .4s ease" }}>
            <Card style={{ marginBottom:18 }}>
              <Section title="Stat Averages vs Benchmark">
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 32px" }}>
                  {Object.entries(B).map(([k,{ label,bench,unit,hi }]) => (
                    <StatRow key={k} label={label} val={avgStats[k]} bench={bench} unit={unit} hi={hi} />
                  ))}
                </div>
              </Section>
            </Card>

            <Card style={{ marginBottom:18 }}>
              <Section title="IQ by Opponent UTR Range">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={[
                    { range:"< 9.5",   iq:Math.round(matches.filter(m=>m.oppUTR<9.5).reduce((s,m)=>s+m.iq,0)/Math.max(1,matches.filter(m=>m.oppUTR<9.5).length)) },
                    { range:"9.5–10",  iq:Math.round(matches.filter(m=>m.oppUTR>=9.5&&m.oppUTR<10).reduce((s,m)=>s+m.iq,0)/Math.max(1,matches.filter(m=>m.oppUTR>=9.5&&m.oppUTR<10).length)) },
                    { range:"10–10.5", iq:Math.round(matches.filter(m=>m.oppUTR>=10&&m.oppUTR<10.5).reduce((s,m)=>s+m.iq,0)/Math.max(1,matches.filter(m=>m.oppUTR>=10&&m.oppUTR<10.5).length)) },
                    { range:"10.5+",   iq:Math.round(matches.filter(m=>m.oppUTR>=10.5).reduce((s,m)=>s+m.iq,0)/Math.max(1,matches.filter(m=>m.oppUTR>=10.5).length)) },
                  ]}>
                    <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="range" tick={{ fill:C.sub, fontSize:11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0,100]} tick={{ fill:C.sub, fontSize:11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background:C.mid, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:12 }} />
                    <Bar dataKey="iq" name="Avg TennisIQ" fill={C.clay} radius={[5,5,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Section>
            </Card>

            <Card>
              <Section title="Win/Loss Analysis">
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                  {[
                    { label:"Avg IQ in Wins",    val:Math.round(matches.filter(m=>m.won).reduce((s,m)=>s+m.iq,0)/Math.max(1,wins)), col:C.live },
                    { label:"Avg IQ in Losses",  val:Math.round(matches.filter(m=>!m.won).reduce((s,m)=>s+m.iq,0)/Math.max(1,matches.length-wins)), col:C.red },
                    { label:"Avg Opp UTR (Wins)",val:Math.round(matches.filter(m=>m.won).reduce((s,m)=>s+m.oppUTR,0)/Math.max(1,wins)*10)/10, col:C.live },
                    { label:"Avg Opp UTR (Loss)",val:Math.round(matches.filter(m=>!m.won).reduce((s,m)=>s+m.oppUTR,0)/Math.max(1,matches.length-wins)*10)/10, col:C.red },
                  ].map(({ label,val,col }) => (
                    <div key={label} style={{ background:C.lift, borderRadius:9, padding:"14px 16px" }}>
                      <div style={{ fontSize:11, color:C.sub, letterSpacing:1, marginBottom:6 }}>{label}</div>
                      <div style={{ fontSize:26, fontWeight:900, fontFamily:FONT.mono, color:col }}>{val}</div>
                    </div>
                  ))}
                </div>
              </Section>
            </Card>
          </div>
        )}

        {/* ══ LOG ════════════════════════════════════════════════════════════*/}
        {tab === "log" && (
          <div style={{ animation:"fadeUp .4s ease" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <span style={{ color:C.sub, fontSize:13 }}>{matches.length} matches logged</span>
              <div style={{ display:"flex", gap:8 }}>
                <button style={btn(false,true)} onClick={() => { setShowCSV(p=>!p); setShowAdd(false); }}>
                  📤 Import CSV
                </button>
                <button style={btn(true,true)} onClick={() => { setShowAdd(p=>!p); setShowCSV(false); }}>
                  + Log Match
                </button>
              </div>
            </div>

            {/* CSV Import */}
            {/* Manual add */}


            {showCSV && (
              <Card glow style={{ marginBottom:18 }}>
                <Section title="Import from CSV">
                  <p style={{ color:C.sub, fontSize:12, marginBottom:14, lineHeight:1.6 }}>
                    Required columns: <code style={{ color:C.clay, fontSize:11 }}>date, opponent, oppUTR, surface, score, result (W/L), 1stServe%, 1stSrvWon%, 2ndSrvWon%, ReturnPts%, Aces, DoubleFaults, Winners, Unforced, NetPts%, BreakPt%</code>
                  </p>
                  <div style={{ display:"flex", gap:10, marginBottom:12 }}>
                    <input ref={fileRef} type="file" accept=".csv" style={{ display:"none" }} onChange={handleFileUpload} />
                    <button style={btn(false,true)} onClick={() => fileRef.current?.click()}>
                      📁 Upload File
                    </button>
                    <span style={{ color:C.sub, fontSize:12, alignSelf:"center" }}>or paste CSV below</span>
                  </div>
                  <textarea
                    value={csvText}
                    onChange={e => setCsvText(e.target.value)}
                    placeholder={"date,opponent,oppUTR,surface,score,result,1stServe%,...\n2025-06-01,John Smith,10.2,Hard,6-4 6-3,W,67,..."}
                    style={{ ...inp, height:120, resize:"vertical", fontFamily:FONT.mono, fontSize:11 }}
                  />
                  {csvErr.length > 0 && (
                    <div style={{ color:C.red, fontSize:12, marginTop:8 }}>
                      {csvErr.map((e,i) => <div key={i}>⚠ {e}</div>)}
                    </div>
                  )}
                  <div style={{ display:"flex", gap:10, marginTop:12 }}>
                    <button style={btn(true)} onClick={importCSV}>Import Matches</button>
                    <button style={btn(false)} onClick={() => { setShowCSV(false); setCsvText(""); setCsvErr([]); }}>Cancel</button>
                  </div>
                </Section>
              </Card>
            )}

            {showAdd && (
              <Card glow style={{ marginBottom:18 }}>
                
                  <Section
  title="New Match"
  action={
    <div style={{ display: "flex", gap: 8 }}>
      <button
        style={btn(mode === "quick")}
        onClick={() => setMode("quick")}
      >
        Quick
      </button>

      <button
        style={btn(mode === "deep")}
        onClick={() => setMode("deep")}
      >
        Deep
      </button>
    </div>
  }
>
  <div style={{
    display:"flex",
    gap:8,
    marginBottom:16
  }}>

    <button
      style={btn(mode==="quick")}
      onClick={() => setMode("quick")}
    >
      Quick Mode
    </button>

    <button
      style={btn(mode==="deep")}
      onClick={() => setMode("deep")}
    >
      Deep Analysis
    </button>

  </div>
                   
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                    {[
                      ["opp","Opponent","text"],["oppUTR","Opp UTR","number"],
                      ["date","Date","date"],["score","Score","text"],
                    ].map(([k,label,type]) => (
                      <div key={k}>
                        <div style={{ fontSize:11, color:C.sub, marginBottom:5, letterSpacing:1 }}>{label.toUpperCase()}</div>
                        <input style={inp} type={type} value={nm[k]}
                          onChange={e => setNm(p => ({...p,[k]:e.target.value}))} />
                      </div>
                    ))}
                    <div>
                      <div style={{ fontSize:11, color:C.sub, marginBottom:5, letterSpacing:1 }}>SURFACE</div>
                      <select style={inp} value={nm.surface} onChange={e => setNm(p => ({...p,surface:e.target.value}))}>
                        {['Hard','Clay','Grass','Indoor'].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize:11, color:C.sub, marginBottom:5, letterSpacing:1 }}>RESULT</div>
                      <select style={inp} value={nm.won} onChange={e => setNm(p => ({...p,won:e.target.value}))}>
                        <option value="true">Win</option>
                        <option value="false">Loss</option>
                      </select>
                    </div>
                  </div>

                  {mode === "deep" && (
                    <>
                      <div style={{ marginTop:18, marginBottom:10, fontSize:11, color:C.sub, letterSpacing:1.5, textTransform:"uppercase" }}>
                        Match Statistics
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12 }}>
                        {Object.entries(B).map(([k,{ label }]) => (
                          <div key={k}>
                            <div style={{ fontSize:10, color:C.sub, marginBottom:5 }}>{label}</div>
                            <input style={inp} type="number" value={nm[k]}
                              onChange={e => setNm(p => ({...p,[k]:e.target.value}))} />
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <div style={{ display:"flex", gap:10, marginTop:16 }}>
                    <button style={btn(true)} onClick={addMatch}>Save Match</button>
                    <button style={btn(false)} onClick={() => setShowAdd(false)}>Cancel</button>
                  </div>
                </Section>
              </Card>
            )}


            <Card>
              <table>
                <thead>
                  <tr>
                    <th>Date</th><th>Opponent</th><th>UTR</th><th>Surface</th><th>Score</th>
                    <th>TennisIQ</th><th>1st%</th><th>UE</th><th>Winners</th><th>Return%</th><th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {[...matches].reverse().map(m => {
                    const [,col] = iqLabel(m.iq);
                    return (
                      <tr key={m.id} onClick={() => { setTab("compare"); setSel(m); setAiText(""); }}>
                        <td style={{ color:C.sub, fontFamily:FONT.mono, fontSize:12 }}>{m.date}</td>
                        <td style={{ fontWeight:600 }}>{m.opp}</td>
                        <td><Pill v={m.oppUTR} good={null} /></td>
                        <td><SurfaceBadge s={m.surface||"Hard"} /></td>
                        <td><Pill v={m.score} good={m.won} /></td>
                        <td>
                          <span style={{ color:col, fontFamily:FONT.mono, fontWeight:700,
                            filter:`drop-shadow(0 0 4px ${col}88)` }}>{m.iq}</span>
                        </td>
                        <td style={{ fontFamily:FONT.mono, color:m.firstServeIn>=65?C.live:C.sub }}>{m.firstServeIn}%</td>
                        <td style={{ fontFamily:FONT.mono, color:m.unforced>18?C.red:m.unforced<=13?C.live:C.sub }}>{m.unforced}</td>
                        <td style={{ fontFamily:FONT.mono, color:m.winners>=22?C.live:C.sub }}>{m.winners}</td>
                        <td style={{ fontFamily:FONT.mono, color:m.returnWon>=45?C.live:C.sub }}>{m.returnWon}%</td>
                        <td style={{ color:C.sub, fontSize:11, maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={m.notes}>{m.notes||"—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </div>
        )}

      </div>

      {/* Footer */}
      <div style={{ borderTop:`1px solid ${C.border}`, padding:"14px 28px",
        display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:20 }}>
        <span style={{ fontSize:11, color:C.sub, letterSpacing:0.5 }}>
          TennisIQ Coach · Real Match Data · Oct 2025–Apr 2026 · {matches.length} matches analysed
        </span>
        <span style={{ fontSize:11, color:C.faint }}>v4.0</span>
      </div>
    </div>
  );
}
