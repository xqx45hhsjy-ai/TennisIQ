"use client";

import { useMemo, useRef, useState } from "react";
import "./TennisIQ-v5-integrated.css";

const benchmarks = {
  firstServe: { label: "First serve", target: 68, unit: "%", group: "Serve" },
  firstWon: { label: "First serve won", target: 74, unit: "%", group: "Serve" },
  secondWon: { label: "Second serve won", target: 55, unit: "%", group: "Serve" },
  returnWon: { label: "Return points won", target: 45, unit: "%", group: "Return" },
  unforced: { label: "Unforced errors", target: 14, unit: "", inverse: true, group: "Mental" },
};

const seedMatches = [
  { id: 1, date: "2026-04-01", opponent: "M. Chen", oppUtr: 9.5, score: "7-5 6-1", won: true, surface: "Hard", firstServe: 68, firstWon: 70, secondWon: 61, returnWon: 49, unforced: 12 },
  { id: 2, date: "2026-04-03", opponent: "A. Brooks", oppUtr: 10.0, score: "4-6 3-6", won: false, surface: "Hard", firstServe: 65, firstWon: 70, secondWon: 53, returnWon: 37, unforced: 35 },
  { id: 3, date: "2026-04-05", opponent: "J. Patel", oppUtr: 9.8, score: "3-6 6-3 10-5", won: true, surface: "Hard", firstServe: 71, firstWon: 74, secondWon: 59, returnWon: 46, unforced: 23 },
  { id: 4, date: "2026-05-10", opponent: "L. Wilson", oppUtr: 10.4, score: "6-7 7-5 10-7", won: true, surface: "Clay", firstServe: 62, firstWon: 71, secondWon: 54, returnWon: 44, unforced: 19 },
  { id: 5, date: "2026-05-24", opponent: "R. Singh", oppUtr: 10.7, score: "4-6 6-4 8-10", won: false, surface: "Hard", firstServe: 53, firstWon: 67, secondWon: 49, returnWon: 34, unforced: 28 },
];

const videoLibrary = {
  firstServe: [
    ["Djokovic serve — slow motion", "https://www.youtube.com/results?search_query=djokovic+serve+slow+motion"],
    ["Mouratoglou — improve first serve", "https://www.youtube.com/results?search_query=mouratoglou+improve+first+serve"],
    ["ATP serve fundamentals", "https://www.youtube.com/results?search_query=ATP+serve+fundamentals"],
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
};

const coaching = {
  firstServe: { problem: "Toss inconsistency and rushed acceleration", ideal: "65–70%", causes: ["Toss drifting left", "Overhitting under pressure", "Rushed loading phase"], drills: ["Basket serving", "Three-zone target serving", "Rhythm serving"] },
  firstWon: { problem: "Serve is starting points, not controlling them", ideal: "74%+", causes: ["Predictable location", "Passive serve +1", "Low body-serve usage"], drills: ["Serve +1 patterns", "Wide/T/body sequences", "First-ball attack"] },
  secondWon: { problem: "Second serve is being attacked", ideal: "55%+", causes: ["Low net clearance", "Insufficient spin", "Defensive first ball"], drills: ["Kick-serve ladder", "Backhand body targets", "Second-serve pressure sets"] },
  returnWon: { problem: "Late contact against pace", ideal: "45%+", causes: ["Late split step", "Backswing too large", "Starting position too deep"], drills: ["Short-backswing returns", "Split-step timing", "Deep-middle return targets"] },
  unforced: { problem: "Error rate rises before point construction is complete", ideal: "14 or fewer", causes: ["Changing direction too early", "Low net margin", "Rushing neutral balls"], drills: ["20-ball consistency", "Crosscourt lock", "Pressure tiebreaks"] },
};

const emptyMatch = {
  date: "2026-06-20", opponent: "", oppUtr: "10.0", score: "", won: true, surface: "Hard",
  firstServe: "65", firstWon: "74", secondWon: "55", returnWon: "45", unforced: "14",
};

const emptyTournament = {
  name: "", date: "2026-07-11", location: "", entry: "60", flight: "180", hotel: "120", food: "40", transport: "25",
};

function mean(items, key) {
  if (!items.length) return 0;
  return Math.round(items.reduce((sum, item) => sum + Number(item[key] || 0), 0) / items.length);
}

function iq(match) {
  let total = 0;
  Object.entries(benchmarks).forEach(([key, value]) => {
    const ratio = value.inverse ? value.target / Math.max(Number(match[key]), 1) : Number(match[key]) / value.target;
    total += Math.min(ratio, 1.25);
  });
  return Math.round((total / Object.keys(benchmarks).length / 1.25) * 100);
}

function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function Card({ children, className = "" }) {
  return <section className={`card ${className}`}>{children}</section>;
}

function Metric({ label, value, note, tone = "" }) {
  return (
    <Card className="metric">
      <span className="eyebrow">{label}</span>
      <strong className={tone}>{value}</strong>
      <small>{note}</small>
    </Card>
  );
}

function Videos({ metric }) {
  const videos = videoLibrary[metric] || videoLibrary.firstServe;
  return (
    <div className="video-grid">
      {videos.map(([title, url], index) => (
        <a className="video-card" href={url} target="_blank" rel="noreferrer" key={title}>
          <span className="video-thumb"><i>▶</i><b>0{index + 1}</b></span>
          <span><strong>{title}</strong><small>Watch training video ↗</small></span>
        </a>
      ))}
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(event) => event.stopPropagation()}>{children}</div>
    </div>
  );
}

export default function App() {
  const [matches, setMatches] = useState(seedMatches);
  const [tab, setTab] = useState("home");
  const [matchMode, setMatchMode] = useState("quick");
  const [newMatch, setNewMatch] = useState(emptyMatch);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [undoMatch, setUndoMatch] = useState(null);
  const undoTimer = useRef(null);
  const [currentUtr, setCurrentUtr] = useState("10.1");
  const [targetUtr, setTargetUtr] = useState("10.8");
  const [timeframe, setTimeframe] = useState("6");
  const [tournaments, setTournaments] = useState([
    { id: 1, name: "UTR College Circuit", date: "2026-07-11", location: "Irvine, CA", entry: 60, flight: 0, hotel: 120, food: 40, transport: 25 },
    { id: 2, name: "J60 San Diego", date: "2026-08-03", location: "San Diego, CA", entry: 90, flight: 0, hotel: 240, food: 80, transport: 35 },
  ]);
  const [newTournament, setNewTournament] = useState(emptyTournament);
  const [compareId, setCompareId] = useState(seedMatches[seedMatches.length - 1].id);

  const stats = useMemo(() => Object.fromEntries(Object.keys(benchmarks).map((key) => [key, mean(matches, key)])), [matches]);
  const weak = useMemo(() => Object.entries(benchmarks).map(([key, item]) => {
    const rawGap = item.inverse ? stats[key] - item.target : item.target - stats[key];
    return { key, ...item, current: stats[key], gap: Math.max(0, rawGap), ...coaching[key] };
  }).filter((item) => item.gap > 0).sort((a, b) => b.gap / b.target - a.gap / a.target), [stats]);
  const wins = matches.filter((match) => match.won).length;
  const averageIq = mean(matches.map((match) => ({ value: iq(match) })), "value");
  const recent = matches[matches.length - 1];
  const compared = matches.find((match) => match.id === Number(compareId)) || recent;
  const budget = tournaments.reduce((sum, tournament) => sum + ["entry", "flight", "hotel", "food", "transport"].reduce((s, key) => s + Number(tournament[key]), 0), 0);

  const nav = [
    ["home", "Overview"], ["analytics", "Analytics"], ["matches", "Matches"], ["coach", "AI Coach"], ["improve", "Improvement"],
    ["target", "Target UTR"], ["tournaments", "Tournaments"], ["report", "Coach Report"],
  ];

  function saveMatch(event) {
    event.preventDefault();
    const match = { ...newMatch, id: Date.now(), oppUtr: Number(newMatch.oppUtr) };
    Object.keys(benchmarks).forEach((key) => { match[key] = Number(newMatch[key]); });
    setMatches((all) => [...all, match]);
    setNewMatch(emptyMatch);
  }

  function confirmDelete() {
    const removed = deleteTarget;
    setMatches((all) => all.filter((match) => match.id !== removed.id));
    setDeleteTarget(null);
    setUndoMatch(removed);
    clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndoMatch(null), 5000);
  }

  function undoDelete() {
    clearTimeout(undoTimer.current);
    setMatches((all) => [...all, undoMatch].sort((a, b) => a.date.localeCompare(b.date)));
    setUndoMatch(null);
  }

  function importCsv(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const [head, ...rows] = String(reader.result).trim().split(/\r?\n/);
      const headers = head.split(",").map((item) => item.trim());
      const imported = rows.map((row, index) => {
        const values = row.split(",");
        const raw = Object.fromEntries(headers.map((header, i) => [header, values[i]?.trim()]));
        return {
          ...emptyMatch, ...raw, id: Date.now() + index,
          opponent: raw.opponent || raw.opp || "Imported player",
          oppUtr: Number(raw.oppUtr || raw.oppUTR || 10),
          won: ["w", "win", "true", "1"].includes(String(raw.won || raw.result).toLowerCase()),
          ...Object.fromEntries(Object.keys(benchmarks).map((key) => [key, Number(raw[key] || emptyMatch[key])])),
        };
      });
      setMatches((all) => [...all, ...imported]);
    };
    reader.readAsText(file);
  }

  function saveTournament(event) {
    event.preventDefault();
    setTournaments((all) => [...all, {
      ...newTournament, id: Date.now(),
      ...Object.fromEntries(["entry", "flight", "hotel", "food", "transport"].map((key) => [key, Number(newTournament[key])])),
    }]);
    setNewTournament(emptyTournament);
  }

  const utrGap = Math.max(0, Number(targetUtr) - Number(currentUtr));
  const multiplier = { 3: 1.25, 6: 1, 12: 0.72 }[timeframe];
  const targetPlan = {
    steady: Math.max(2, Math.ceil(utrGap * 5 * multiplier)),
    stretch: Math.max(1, Math.ceil(utrGap * 2.5 * multiplier)),
    upset: Math.max(1, Math.ceil(utrGap * 1.1 * multiplier)),
  };

  return (
    <div className="app">
      <header>
        <button className="brand" onClick={() => setTab("home")}><span className="logo">TQ</span><span>Tennis<b>IQ</b><small>COMPETITIVE INTELLIGENCE</small></span></button>
        <div className="player-chip"><span><small>PLAYER RATING</small><b>UTR {currentUtr}</b></span><i>SK</i></div>
      </header>

      <nav>
        {nav.map(([id, label]) => <button className={tab === id ? "active" : ""} onClick={() => setTab(id)} key={id}>{label}</button>)}
      </nav>

      <main>
        {tab === "home" && (
          <>
            <div className="hero">
              <div>
                <span className="kicker">PLAYER COMMAND CENTER · JUNE 20, 2026</span>
                <h1>Turn match data into<br/><em>your next level.</em></h1>
                <p>Your game is trending up. The fastest path forward is clearer serve rhythm and earlier return contact.</p>
                <div className="button-row"><button className="primary" onClick={() => setTab("improve")}>Open improvement plan →</button><button onClick={() => setTab("matches")}>Log a match</button></div>
              </div>
              <div className="score-ring"><div><strong>{averageIq}</strong><span>TENNIS IQ</span></div></div>
            </div>
            <div className="metric-grid">
              <Metric label="Current UTR" value={currentUtr} note="+0.2 across last 10 matches" tone="green" />
              <Metric label="Win rate" value={`${Math.round((wins / matches.length) * 100)}%`} note={`${wins} wins · ${matches.length - wins} losses`} />
              <Metric label="Priority" value={weak[0]?.label || "Maintain"} note={weak[0] ? `${weak[0].current}${weak[0].unit} → ${weak[0].target}${weak[0].unit}` : "All benchmarks met"} tone="orange" />
              <Metric label="Tournament budget" value={money(budget)} note={`${tournaments.length} upcoming events`} />
            </div>
            <div className="two-col">
              <Card>
                <div className="section-head"><div><span className="eyebrow">LATEST MATCH</span><h2>{recent.won ? "Strong fight, narrow margins." : "Useful loss, clear lesson."}</h2></div><span className={recent.won ? "result win" : "result loss"}>{recent.won ? "WIN" : "LOSS"}</span></div>
                <div className="latest-match"><div><b>vs {recent.opponent}</b><span>UTR {recent.oppUtr} · {recent.surface}</span></div><strong>{recent.score}</strong><div className="iq-box">{iq(recent)}<small>IQ</small></div></div>
                <div className="coach-note"><span>AI COACH READ</span><p>{coaching[weak[0]?.key || "firstServe"].problem}. Start with {coaching[weak[0]?.key || "firstServe"].drills[0].toLowerCase()} this week.</p></div>
              </Card>
              <Card>
                <div className="section-head"><div><span className="eyebrow">NEXT EVENTS</span><h2>Competition calendar</h2></div><button className="text-button" onClick={() => setTab("tournaments")}>View planner →</button></div>
                <div className="timeline">{tournaments.slice(0, 3).map((item) => <div className="timeline-item" key={item.id}><time>{new Date(`${item.date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "2-digit" })}</time><span><b>{item.name}</b><small>{item.location}</small></span><strong>{money(["entry", "flight", "hotel", "food", "transport"].reduce((sum, key) => sum + item[key], 0))}</strong></div>)}</div>
              </Card>
            </div>
          </>
        )}

        {tab === "matches" && (
          <>
            <div className="page-title"><div><span className="kicker">MATCH LAB</span><h1>Every match becomes evidence.</h1><p>Log quickly on court, or add full stats for deeper analysis.</p></div><label className="upload">Import CSV<input type="file" accept=".csv" onChange={importCsv}/></label></div>
            <Card className="form-card">
              <div className="section-head"><div><span className="eyebrow">NEW MATCH</span><h2>Log performance</h2></div><div className="segmented"><button className={matchMode === "quick" ? "selected" : ""} onClick={() => setMatchMode("quick")}>Quick</button><button className={matchMode === "deep" ? "selected" : ""} onClick={() => setMatchMode("deep")}>Deep analysis</button></div></div>
              <form onSubmit={saveMatch} className="form-grid">
                {["opponent", "oppUtr", "date", "score"].map((key) => <label key={key}><span>{key === "oppUtr" ? "Opponent UTR" : key}</span><input required={key !== "score"} type={key === "date" ? "date" : key === "oppUtr" ? "number" : "text"} step="0.1" value={newMatch[key]} onChange={(e) => setNewMatch({ ...newMatch, [key]: e.target.value })}/></label>)}
                <label><span>Surface</span><select value={newMatch.surface} onChange={(e) => setNewMatch({ ...newMatch, surface: e.target.value })}>{["Hard", "Clay", "Grass", "Indoor"].map((item) => <option key={item}>{item}</option>)}</select></label>
                <label><span>Result</span><select value={String(newMatch.won)} onChange={(e) => setNewMatch({ ...newMatch, won: e.target.value === "true" })}><option value="true">Win</option><option value="false">Loss</option></select></label>
                {matchMode === "deep" && Object.entries(benchmarks).map(([key, item]) => <label key={key}><span>{item.label}</span><input type="number" value={newMatch[key]} onChange={(e) => setNewMatch({ ...newMatch, [key]: e.target.value })}/></label>)}
                <button className="primary form-submit">Save match</button>
              </form>
            </Card>
            <Card className="table-card">
              <div className="section-head"><div><span className="eyebrow">MATCH HISTORY</span><h2>{matches.length} performances</h2></div></div>
              <div className="table-wrap"><table><thead><tr><th>Date</th><th>Opponent</th><th>Result</th><th>Surface</th><th>First serve</th><th>Return</th><th>Errors</th><th>IQ</th><th></th></tr></thead><tbody>{[...matches].reverse().map((match) => <tr key={match.id}><td>{match.date}</td><td><b>{match.opponent}</b><small>UTR {match.oppUtr}</small></td><td><span className={match.won ? "result win" : "result loss"}>{match.won ? "W" : "L"} · {match.score}</span></td><td>{match.surface}</td><td>{match.firstServe}%</td><td>{match.returnWon}%</td><td>{match.unforced}</td><td><b className="green">{iq(match)}</b></td><td><button className="delete" aria-label={`Delete match against ${match.opponent}`} onClick={() => setDeleteTarget(match)}>⌫</button></td></tr>)}</tbody></table></div>
            </Card>
          </>
        )}

        {tab === "analytics" && (
          <>
            <div className="page-title"><div><span className="kicker">PERFORMANCE ANALYTICS</span><h1>See the pattern behind the score.</h1><p>Your original benchmark comparison and match-level analysis, now connected to the v5 improvement plan.</p></div></div>
            <div className="metric-grid">
              <Metric label="Average TennisIQ" value={averageIq} note={`${matches.length} matches analyzed`} tone="green" />
              <Metric label="First serve" value={`${stats.firstServe}%`} note={`Competitive target ${benchmarks.firstServe.target}%`} />
              <Metric label="Return points" value={`${stats.returnWon}%`} note={`Competitive target ${benchmarks.returnWon.target}%`} />
              <Metric label="Unforced errors" value={stats.unforced} note={`Target ${benchmarks.unforced.target} or fewer`} tone="orange" />
            </div>
            <div className="two-col analytics-layout">
              <Card>
                <div className="section-head"><div><span className="eyebrow">SEASON PROFILE</span><h2>Average vs benchmark</h2></div></div>
                <div className="benchmark-bars">
                  {Object.entries(benchmarks).map(([key, item]) => {
                    const score = item.inverse ? Math.min(100, (item.target / Math.max(stats[key], 1)) * 100) : Math.min(100, (stats[key] / item.target) * 100);
                    const good = item.inverse ? stats[key] <= item.target : stats[key] >= item.target;
                    return <div key={key}><span><b>{item.label}</b><small>{stats[key]}{item.unit} / {item.target}{item.unit}</small></span><div><i className={good ? "good" : ""} style={{ width: `${score}%` }}/><em style={{ left: "96%" }}/></div></div>;
                  })}
                </div>
              </Card>
              <Card>
                <div className="section-head"><div><span className="eyebrow">IQ TIMELINE</span><h2>Form across recent matches</h2></div></div>
                <div className="iq-chart">
                  {matches.map((match) => <div key={match.id} title={`${match.date}: IQ ${iq(match)}`}><span style={{ height: `${Math.max(16, iq(match))}%` }} className={match.won ? "won" : "lost"}/><small>{match.date.slice(5)}</small></div>)}
                </div>
                <div className="chart-legend"><span><i className="win-dot"/> Win</span><span><i className="loss-dot"/> Loss</span></div>
              </Card>
            </div>
            <Card className="comparison-card">
              <div className="section-head"><div><span className="eyebrow">MATCH COMPARISON</span><h2>One match against competitive standards</h2></div><select value={compareId} onChange={(event) => setCompareId(event.target.value)}>{[...matches].reverse().map((match) => <option value={match.id} key={match.id}>vs {match.opponent} · {match.date}</option>)}</select></div>
              <div className="comparison-head"><div><h3>vs {compared.opponent}</h3><p>UTR {compared.oppUtr} · {compared.surface} · {compared.won ? "Win" : "Loss"} {compared.score}</p></div><div className="iq-box">{iq(compared)}<small>TENNIS IQ</small></div></div>
              <div className="comparison-grid">
                {Object.entries(benchmarks).map(([key, item]) => {
                  const good = item.inverse ? compared[key] <= item.target : compared[key] >= item.target;
                  return <div key={key}><span>{item.label}</span><strong className={good ? "green" : "orange"}>{compared[key]}{item.unit}</strong><small>Target {item.target}{item.unit}</small></div>;
                })}
              </div>
              <div className="coach-note"><span>NEXT ACTION</span><p>{coaching[weak[0]?.key || "firstServe"].problem}. Open Improvement to follow the linked drill and video plan.</p></div>
            </Card>
          </>
        )}

        {tab === "coach" && (
          <>
            <div className="page-title"><div><span className="kicker">AI COACH v2</span><h1>Your numbers, translated.</h1><p>Specific causes and drills—not generic encouragement.</p></div></div>
            <div className="coach-layout">
              <Card className="weakness-list"><span className="eyebrow">PRIORITY QUEUE</span>{weak.map((item, index) => <button key={item.key} onClick={() => document.getElementById(`coach-${item.key}`)?.scrollIntoView({ behavior: "smooth" })}><i>0{index + 1}</i><span><b>{item.label}</b><small>{item.current}{item.unit} · target {item.target}{item.unit}</small></span><em>{Math.round((item.gap / item.target) * 100)}% gap</em></button>)}</Card>
              <div>{weak.map((item) => <Card className="analysis-card" key={item.key}><div id={`coach-${item.key}`} className="analysis-title"><span>{item.group.toUpperCase()} ANALYSIS</span><h2>{item.problem}</h2><p>Current <b>{item.current}{item.unit}</b> · Competitive target <b className="green">{item.ideal}</b></p></div><div className="analysis-grid"><div><span className="eyebrow">POSSIBLE CAUSES</span>{item.causes.map((cause) => <p className="check muted" key={cause}>— {cause}</p>)}</div><div><span className="eyebrow">RECOMMENDED DRILLS</span>{item.drills.map((drill) => <p className="check" key={drill}>✓ {drill}</p>)}</div></div><Videos metric={item.key}/></Card>)}</div>
            </div>
          </>
        )}

        {tab === "improve" && (
          <>
            <div className="page-title"><div><span className="kicker">IMPROVEMENT CENTER</span><h1>The work between matches.</h1><p>One living plan across technique, tactics, and mentality.</p></div></div>
            {["Serve", "Return", "Mental"].map((group) => {
              const item = weak.find((entry) => entry.group === group) || Object.entries(benchmarks).map(([key, value]) => ({ key, ...value, current: stats[key], ...coaching[key] })).find((entry) => entry.group === group);
              return <Card className="improvement-row" key={group}><div className="improvement-score"><span>{group.toUpperCase()}</span><strong>{item.current}{item.unit}</strong><small>Target {item.ideal}</small><div className="progress"><i style={{ width: `${Math.min(100, item.inverse ? item.target / item.current * 100 : item.current / item.target * 100)}%` }}/></div></div><div><span className="eyebrow">PROBLEM</span><h2>{item.problem}</h2><div className="drill-chips">{item.drills.map((drill) => <span key={drill}>✓ {drill}</span>)}</div></div><div><Videos metric={item.key}/></div></Card>;
            })}
          </>
        )}

        {tab === "target" && (
          <>
            <div className="page-title"><div><span className="kicker">TARGET UTR CALCULATOR</span><h1>Make the rating goal playable.</h1><p>Translate ambition into the match profile you need.</p></div></div>
            <div className="target-layout">
              <Card className="target-form"><span className="eyebrow">SET YOUR TARGET</span><label><span>Current UTR</span><input type="number" step="0.1" value={currentUtr} onChange={(e) => setCurrentUtr(e.target.value)}/></label><label><span>Target UTR</span><input type="number" step="0.1" value={targetUtr} onChange={(e) => setTargetUtr(e.target.value)}/></label><label><span>Timeframe</span><div className="segmented stretch">{["3", "6", "12"].map((month) => <button className={timeframe === month ? "selected" : ""} onClick={() => setTimeframe(month)} key={month}>{month} mo</button>)}</div></label><div className="utr-delta"><small>RATING GAP</small><strong>+{utrGap.toFixed(1)}</strong><span>over {timeframe} months</span></div></Card>
              <Card className="target-report"><div className="section-head"><div><span className="eyebrow">TARGET REPORT</span><h2>{currentUtr} → <em>{targetUtr}</em></h2></div><span className="confidence">ACHIEVABLE</span></div><div className="report-columns"><div><h3>Match profile needed</h3><p className="check">✓ {targetPlan.steady} wins vs {(Number(currentUtr) + 0.2).toFixed(1)}+</p><p className="check">✓ {targetPlan.stretch} wins vs {(Number(currentUtr) + 0.5).toFixed(1)}+</p><p className="check">✓ {targetPlan.upset} upset vs {(Number(targetUtr) + 0.2).toFixed(1)}+</p><p className="check danger">× Avoid losses below {(Number(currentUtr) - 0.5).toFixed(1)}</p></div><div><h3>Recommended events</h3><p className="event-tag">UTR verified events</p><p className="event-tag">ITF J60 / J100</p><p className="event-tag">USTA L3 Nationals</p><small className="fine-print">Directional planning estimate based on current UTR and goal gap. Official ratings use proprietary match-weighting calculations.</small></div></div></Card>
            </div>
          </>
        )}

        {tab === "tournaments" && (
          <>
            <div className="page-title"><div><span className="kicker">TOURNAMENT PLANNER</span><h1>Compete without the chaos.</h1><p>Calendar, logistics, and true trip cost in one place.</p></div><div className="budget-total"><small>PLANNED SPEND</small><strong>{money(budget)}</strong></div></div>
            <div className="two-col tournament-layout">
              <Card className="form-card"><span className="eyebrow">ADD TOURNAMENT</span><form className="form-grid compact" onSubmit={saveTournament}>{Object.keys(emptyTournament).map((key) => <label className={["name", "location"].includes(key) ? "wide" : ""} key={key}><span>{key}</span><input required={["name", "date"].includes(key)} type={key === "date" ? "date" : ["entry", "flight", "hotel", "food", "transport"].includes(key) ? "number" : "text"} value={newTournament[key]} onChange={(e) => setNewTournament({ ...newTournament, [key]: e.target.value })}/></label>)}<button className="primary form-submit">Save tournament</button></form></Card>
              <Card><span className="eyebrow">UPCOMING TIMELINE</span><div className="tournament-list">{[...tournaments].sort((a, b) => a.date.localeCompare(b.date)).map((item) => { const total = ["entry", "flight", "hotel", "food", "transport"].reduce((sum, key) => sum + item[key], 0); return <article key={item.id}><time><b>{new Date(`${item.date}T12:00:00`).toLocaleDateString("en-US", { day: "2-digit" })}</b><span>{new Date(`${item.date}T12:00:00`).toLocaleDateString("en-US", { month: "short" }).toUpperCase()}</span></time><div><h3>{item.name}</h3><p>{item.location}</p><div className="cost-line">{["flight", "hotel", "entry", "food", "transport"].map((key) => <span key={key}>{key} <b>{money(item[key])}</b></span>)}</div></div><strong>{money(total)}</strong></article>; })}</div></Card>
            </div>
          </>
        )}

        {tab === "report" && (
          <>
            <div className="page-title no-print"><div><span className="kicker">COACH REPORT EXPORT</span><h1>A clear story of the player.</h1><p>Built for coaches, parents, and recruiting conversations.</p></div><button className="primary" onClick={() => window.print()}>Export PDF</button></div>
            <article className="player-report">
              <div className="report-cover"><div className="brand"><span className="logo">TQ</span><span>Tennis<b>IQ</b></span></div><span>PLAYER PERFORMANCE REPORT · JUNE 20, 2026</span><h1>Shivraj K.</h1><p>Competitive junior player · United States</p><div><strong>UTR {currentUtr}</strong><strong>{averageIq} TennisIQ</strong><strong>{Math.round((wins / matches.length) * 100)}% win rate</strong></div></div>
              <div className="report-body">
                <section><span className="eyebrow">EXECUTIVE SUMMARY</span><h2>A resilient competitor with a clear upside path.</h2><p>Current match data points to a player who competes well against stronger opposition. The next rating jump depends on stabilizing first-serve rhythm, taking returns earlier, and reducing neutral-ball errors under pressure.</p></section>
                <section><span className="eyebrow">RECENT MATCHES</span><table><thead><tr><th>Date</th><th>Opponent</th><th>Score</th><th>IQ</th></tr></thead><tbody>{matches.slice(-4).reverse().map((match) => <tr key={match.id}><td>{match.date}</td><td>{match.opponent} · {match.oppUtr}</td><td>{match.won ? "W" : "L"} {match.score}</td><td>{iq(match)}</td></tr>)}</tbody></table></section>
                <div className="report-split"><section><span className="eyebrow">STRENGTHS</span><p className="check">✓ Competes through tight scorelines</p><p className="check">✓ Second-serve resilience</p><p className="check">✓ Willingness to challenge higher UTRs</p></section><section><span className="eyebrow">PRIORITY GAPS</span>{weak.slice(0, 3).map((item) => <p className="check danger" key={item.key}>→ {item.label}: {item.current}{item.unit} / {item.target}{item.unit}</p>)}</section></div>
                <section><span className="eyebrow">4-WEEK TRAINING PLAN</span><div className="week-grid">{weak.slice(0, 3).map((item, index) => <div key={item.key}><b>WEEK {index + 1}</b><h3>{item.label}</h3><p>{item.drills.join(" · ")}</p></div>)}<div><b>WEEK 4</b><h3>Pressure transfer</h3><p>Practice sets · Tiebreak starts · Match routine</p></div></div></section>
                <section><span className="eyebrow">TOURNAMENT SCHEDULE</span>{tournaments.map((item) => <div className="report-event" key={item.id}><b>{item.date}</b><span>{item.name}<small>{item.location}</small></span><strong>{money(["entry", "flight", "hotel", "food", "transport"].reduce((sum, key) => sum + item[key], 0))}</strong></div>)}</section>
                <section><span className="eyebrow">RECOMMENDED VIDEO STUDY</span><Videos metric={weak[0]?.key || "firstServe"}/></section>
              </div>
            </article>
          </>
        )}
      </main>

      {deleteTarget && <Modal onClose={() => setDeleteTarget(null)}><span className="modal-icon">⌫</span><h2>Delete this match?</h2><p>vs {deleteTarget.opponent} · {deleteTarget.date}</p><div className="button-row"><button className="danger-button" onClick={confirmDelete}>Yes, delete</button><button onClick={() => setDeleteTarget(null)}>Cancel</button></div></Modal>}
      {undoMatch && <div className="undo-toast"><span>Match deleted</span><button onClick={undoDelete}>Undo</button><i/></div>}
      <footer><span>TennisIQ v5 · Player intelligence platform</span><span>Built for the work between points.</span></footer>
    </div>
  );
}
