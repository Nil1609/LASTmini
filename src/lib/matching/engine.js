/**
 * AUlaf AI Matching Engine
 * Campus Lost & Found - Adamas University
 *
 * Implements 19 pure functions for fuzzy text + attribute matching
 * between lost and found reports, plus a factory createMatchingEngine().
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'the','a','an','and','or','of','to','in','on','at','near','with','for',
  'my','was','is','it','this','that','item','lost','missing','found',
  'report','containing','contains'
]);

const PHRASE_ALIASES = {
  'student identity card':'identitycard','student id card':'identitycard',
  'college identity card':'identitycard','college id card':'identitycard',
  'adamas university id card':'identitycard','university id card':'identitycard',
  'identity card':'identitycard','adamas id card':'identitycard',
  'prescription glasses':'eyewear','spectacles':'eyewear','eye glasses':'eyewear',
  'eyeglasses':'eyewear','reading glasses':'eyewear','sunglasses':'eyewear',
  'sneakers':'footwear','trainers':'footwear','running shoes':'footwear','shoes':'footwear',
  'portable hard drive':'storagedrive','external hard drive':'storagedrive','external drive':'storagedrive',
  'wristwatch':'watch','wrist watch':'watch','analog watch':'watch','smart watch':'watch',
  'keychain':'keys','key chain':'keys','key ring':'keys','locker keys':'keys',
  'mobile phone':'phone','cell phone':'phone','smartphone':'phone','iphone':'phone',
  'laptop computer':'laptop','notebook computer':'laptop','macbook':'laptop',
  'backpack':'bag','rucksack':'bag','college bag':'bag','school bag':'bag',
  'water flask':'bottle','thermos flask':'bottle','water bottle':'bottle',
  'scientific calculator':'calculator','casio calculator':'calculator',
  'airdopes':'earbuds','airpods':'earbuds'
};

const CATEGORY_ALIASES = {
  'electronics': ['electronic','mobile','phone','smartphone','laptop','tablet','gadget'],
  'academic tools': ['study tools','stationery','calculator','geometry box','lab kit'],
  'bags & wallets': ['bag','backpack','rucksack','handbag','purse','wallet'],
  'keys & identity': ['id card','identity card','student id','keys','keychain'],
  'clothing & apparel': ['clothing','jacket','shirt','coat','sweater','hoodie'],
  'books & documents': ['book','notebook','document','notes','papers'],
  'sports & fitness': ['sports','gym','yoga','fitness','mat','equipment'],
  'personal belongings': ['personal','belongings','accessories','misc']
};

const DEFAULT_THRESHOLD = 80;
const DEFAULT_DISPLAY_THRESHOLD = 65;
const DATE_WINDOW_DAYS = 30;

// Pre-sort phrase aliases keys longest-first for greedy matching
const SORTED_ALIAS_KEYS = Object.keys(PHRASE_ALIASES).sort((a, b) => b.length - a.length);

// ─── 1. normalizeText ─────────────────────────────────────────────────────────

/**
 * Unicode NFKD → lowercase → remove boilerplate words →
 * apply PHRASE_ALIASES (longest match first) → remove non-alphanumeric →
 * trim/collapse whitespace.
 */
export function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';

  // Unicode NFKD normalization + lowercase
  let t = text.normalize('NFKD').toLowerCase();

  // Remove boilerplate standalone words (whole-word match)
  for (const word of ['lost','found','missing','recovered','item','report']) {
    t = t.replace(new RegExp(`\\b${word}\\b`, 'g'), ' ');
  }

  // Apply PHRASE_ALIASES (longest first, greedy)
  for (const phrase of SORTED_ALIAS_KEYS) {
    // Escape special chars in phrase for regex
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    t = t.replace(new RegExp(escaped, 'g'), PHRASE_ALIASES[phrase]);
  }

  // Remove non-alphanumeric (keep spaces)
  t = t.replace(/[^a-z0-9 ]/g, ' ');

  // Trim and collapse whitespace
  return t.replace(/\s+/g, ' ').trim();
}

// ─── 2. tokenize ─────────────────────────────────────────────────────────────

/**
 * Split normalizeText(text) on whitespace → filter STOP_WORDS → array of tokens.
 */
export function tokenize(text) {
  const normalized = normalizeText(text);
  if (!normalized) return [];
  return normalized.split(' ').filter(t => t && !STOP_WORDS.has(t));
}

// ─── 3. tokenCounts ──────────────────────────────────────────────────────────

/**
 * Return Map of token → count (raw frequency).
 */
export function tokenCounts(tokens) {
  const map = new Map();
  for (const t of tokens) {
    map.set(t, (map.get(t) || 0) + 1);
  }
  return map;
}

// ─── 4. buildIdfMap ──────────────────────────────────────────────────────────

/**
 * Build IDF map from an array of report objects.
 * IDF = ln((N+1)/(df+1)) + 1  (smoothed)
 */
export function buildIdfMap(reports) {
  const N = reports.length;
  const df = new Map(); // token → document frequency

  for (const report of reports) {
    const corpus = [
      report.item_name   || '',
      report.description || '',
      report.brand       || '',
      report.color       || '',
      report.category    || ''
    ].join(' ');

    const tokens = new Set(tokenize(corpus));
    for (const t of tokens) {
      df.set(t, (df.get(t) || 0) + 1);
    }
  }

  const idfMap = new Map();
  for (const [token, freq] of df) {
    idfMap.set(token, Math.log((N + 1) / (freq + 1)) + 1);
  }
  return idfMap;
}

// ─── 5. cosineSimilarity ─────────────────────────────────────────────────────

/**
 * TF-IDF cosine similarity between two token count maps.
 * Returns 0–1.
 */
export function cosineSimilarity(countsA, countsB, idfMap) {
  if (!countsA.size || !countsB.size) return 0;

  const getIdf = t => idfMap && idfMap.has(t) ? idfMap.get(t) : 1;

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (const [t, tf] of countsA) {
    const idf = getIdf(t);
    const w = tf * idf;
    magA += w * w;
    if (countsB.has(t)) {
      dot += w * (countsB.get(t) * idf);
    }
  }
  for (const [t, tf] of countsB) {
    const idf = getIdf(t);
    const w = tf * idf;
    magB += w * w;
  }

  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// ─── 6. tokenF1 ──────────────────────────────────────────────────────────────

/**
 * Set-intersection harmonic mean (F1).
 * (2 * |A∩B|) / (|A| + |B|)
 * Returns 0–1.
 */
export function tokenF1(tokensA, tokensB) {
  if (!tokensA.length || !tokensB.length) return 0;
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  let intersection = 0;
  for (const t of setA) {
    if (setB.has(t)) intersection++;
  }
  return (2 * intersection) / (setA.size + setB.size);
}

// ─── 7. textSimilarity ───────────────────────────────────────────────────────

/**
 * Combined: cosine * 0.45 + f1 * 0.55
 * Returns 0–1.
 */
export function textSimilarity(textA, textB, idfMap) {
  const tA = tokenize(textA);
  const tB = tokenize(textB);
  if (!tA.length && !tB.length) return 1; // both empty → identical
  if (!tA.length || !tB.length) return 0;

  const cosine = cosineSimilarity(tokenCounts(tA), tokenCounts(tB), idfMap);
  const f1     = tokenF1(tA, tB);
  return cosine * 0.45 + f1 * 0.55;
}

// ─── 8. textScore ────────────────────────────────────────────────────────────

/**
 * Compare item_name (65%) + description (35%) using textSimilarity.
 * Returns 0–100.
 */
export function textScore(reportA, reportB, idfMap) {
  const nameSim = textSimilarity(
    reportA.item_name   || '',
    reportB.item_name   || '',
    idfMap
  );
  const descSim = textSimilarity(
    reportA.description || '',
    reportB.description || '',
    idfMap
  );
  return (nameSim * 0.65 + descSim * 0.35) * 100;
}

// ─── 9. canonicalCategory ────────────────────────────────────────────────────

/**
 * Normalize category string using CATEGORY_ALIASES.
 * Returns canonical key or normalized original string.
 */
export function canonicalCategory(cat) {
  if (!cat || typeof cat !== 'string') return '';
  const normalized = cat.toLowerCase().trim();

  // Direct key match
  if (CATEGORY_ALIASES[normalized] !== undefined) return normalized;

  // Check if any alias list contains the normalized value
  for (const [canonical, aliases] of Object.entries(CATEGORY_ALIASES)) {
    if (canonical === normalized) return canonical;
    for (const alias of aliases) {
      if (normalized.includes(alias) || alias.includes(normalized)) {
        return canonical;
      }
    }
  }

  return normalized;
}

// ─── 10. attributeScore ──────────────────────────────────────────────────────

/**
 * Score a single attribute (brand, color, category).
 * Both present: exact → 100, else textSimilarity*100.
 * Either missing → 0.
 */
export function attributeScore(valA, valB, idfMap) {
  if (!valA || !valB || typeof valA !== 'string' || typeof valB !== 'string') return 0;
  const nA = normalizeText(valA);
  const nB = normalizeText(valB);
  if (!nA || !nB) return 0;
  if (nA === nB) return 100;
  return textSimilarity(nA, nB, idfMap) * 100;
}

// ─── 11. parseDateStrict ─────────────────────────────────────────────────────

/**
 * Parse YYYY-MM-DD strictly. Return Date or null.
 */
export function parseDateStrict(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!m) return null;
  const year  = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  const day   = parseInt(m[3], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null;
  return d;
}

// ─── 12. dateScore ───────────────────────────────────────────────────────────

/**
 * Linear decay over DATE_WINDOW_DAYS.
 * max(0, 1 - |delta_days| / DATE_WINDOW_DAYS) * 100.
 * Missing → 0.
 */
export function dateScore(dateA, dateB) {
  const dA = dateA instanceof Date ? dateA : parseDateStrict(dateA);
  const dB = dateB instanceof Date ? dateB : parseDateStrict(dateB);
  if (!dA || !dB) return 0;
  const deltaDays = Math.abs((dA - dB) / (1000 * 60 * 60 * 24));
  return Math.max(0, 1 - deltaDays / DATE_WINDOW_DAYS) * 100;
}

// ─── 13. normalizeWeights ────────────────────────────────────────────────────

const DEFAULT_WEIGHTS = { text: 0.45, category: 0.20, date: 0.15, brand: 0.10, color: 0.10 };

/**
 * Validate that weights sum ≈ 1.0 (±0.01).
 * Return default if invalid.
 */
export function normalizeWeights(weights) {
  if (!weights || typeof weights !== 'object') return { ...DEFAULT_WEIGHTS };
  const keys = ['text', 'category', 'date', 'brand', 'color'];
  for (const k of keys) {
    if (typeof weights[k] !== 'number' || weights[k] < 0) return { ...DEFAULT_WEIGHTS };
  }
  const sum = keys.reduce((acc, k) => acc + weights[k], 0);
  if (Math.abs(sum - 1.0) > 0.01) return { ...DEFAULT_WEIGHTS };
  return { ...weights };
}

// ─── 14. isExplicitlyIneligible ──────────────────────────────────────────────

const INELIGIBLE_STATUSES = new Set([
  'closed','recovered','resolved','deleted','inactive',
  'cancelled','archived','hidden','blocked','removed'
]);

/**
 * Returns true if report.status is one of the ineligible statuses (case-insensitive).
 */
export function isExplicitlyIneligible(report) {
  if (!report || !report.status) return false;
  return INELIGIBLE_STATUSES.has(String(report.status).toLowerCase().trim());
}

// ─── 15. sanitizeReport ──────────────────────────────────────────────────────

/**
 * Return only allowed fields from a report.
 */
export function sanitizeReport(report) {
  if (!report || typeof report !== 'object') return {};
  const allowed = ['id','item_name','category','brand','color','location',
                   'date','status','image','type','score','matchStrength'];
  const out = {};
  for (const k of allowed) {
    if (k in report) out[k] = report[k];
  }
  return out;
}

// ─── 16. scoreReportPair ─────────────────────────────────────────────────────

/**
 * Compute weighted score for a lost/found pair.
 * S = T*0.45 + C*0.20 + D*0.15 + B*0.10 + Co*0.10
 * Returns 0–100 rounded to 2 decimals.
 */
export function scoreReportPair(lostReport, foundReport, idfMap, weights) {
  const w = normalizeWeights(weights);

  const T  = textScore(lostReport, foundReport, idfMap);
  const C  = attributeScore(
    canonicalCategory(lostReport.category),
    canonicalCategory(foundReport.category),
    idfMap
  );
  const D  = dateScore(lostReport.date, foundReport.date);
  const B  = attributeScore(lostReport.brand, foundReport.brand, idfMap);
  const Co = attributeScore(lostReport.color, foundReport.color, idfMap);

  const S = T * w.text + C * w.category + D * w.date + B * w.brand + Co * w.color;
  return Math.round(S * 100) / 100;
}

// ─── 17. matchReport ─────────────────────────────────────────────────────────

/**
 * Find matches for a single source report against a pool of candidates.
 * Returns array sorted by score desc, with matchStrength classification.
 */
export function matchReport(sourceReport, candidates, idfMap, options = {}) {
  const displayThreshold = options.displayThreshold ?? DEFAULT_DISPLAY_THRESHOLD;
  const weights          = options.weights ?? null;

  const results = [];

  for (const candidate of candidates) {
    if (isExplicitlyIneligible(candidate)) continue;
    if (candidate.id === sourceReport.id) continue;

    const score = scoreReportPair(sourceReport, candidate, idfMap, weights);
    if (score < displayThreshold) continue;

    const matchStrength = score >= DEFAULT_THRESHOLD ? 'strong' : 'possible';
    results.push({
      ...sanitizeReport(candidate),
      score,
      matchStrength
    });
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}

// ─── 18. findMatchingReports ─────────────────────────────────────────────────

/**
 * Cross-match all lost vs found reports.
 * Build combined idfMap once. Deduplicate pairs.
 * Returns { lostMatches, foundMatches, pairs }.
 */
export function findMatchingReports(lostReports, foundReports, options = {}) {
  const combined = [...(lostReports || []), ...(foundReports || [])];
  const idfMap   = buildIdfMap(combined);
  const weights  = options.weights ?? null;

  const lostMatches  = {};
  const foundMatches = {};
  const pairSet      = new Set();
  const pairs        = [];

  // Lost → Found
  for (const lost of (lostReports || [])) {
    const matches = matchReport(lost, foundReports || [], idfMap, { ...options, weights });
    lostMatches[lost.id] = { report: sanitizeReport(lost), matches };

    for (const m of matches) {
      const key = `${lost.id}::${m.id}`;
      if (!pairSet.has(key)) {
        pairSet.add(key);
        pairs.push({ lost: sanitizeReport(lost), found: m, score: m.score, matchStrength: m.matchStrength });
      }
    }
  }

  // Found → Lost (populate foundMatches; pairs already deduplicated)
  for (const found of (foundReports || [])) {
    const matches = matchReport(found, lostReports || [], idfMap, { ...options, weights });
    foundMatches[found.id] = { report: sanitizeReport(found), matches };
  }

  pairs.sort((a, b) => b.score - a.score);

  return { lostMatches, foundMatches, pairs, idfMap };
}

// ─── 19. createMatchingEngine ────────────────────────────────────────────────

/**
 * Factory: returns engine bound with custom weights.
 */
export function createMatchingEngine(customWeights) {
  const weights = normalizeWeights(customWeights);

  return {
    scoreReportPair: (lostReport, foundReport, idfMap) =>
      scoreReportPair(lostReport, foundReport, idfMap, weights),

    matchReport: (sourceReport, candidates, idfMap, options = {}) =>
      matchReport(sourceReport, candidates, idfMap, { ...options, weights }),

    findMatchingReports: (lostReports, foundReports, options = {}) =>
      findMatchingReports(lostReports, foundReports, { ...options, weights })
  };
}

// ─── Default export ───────────────────────────────────────────────────────────

export default createMatchingEngine;
