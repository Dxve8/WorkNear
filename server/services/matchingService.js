const natural = require("natural");
const TfIdf = natural.TfIdf;
const PorterStemmer = natural.PorterStemmer;

// ═══════════════════════════════════════════════════════════════════════════════
//  UTILITY HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Haversine distance between two [lng, lat] GeoJSON coordinate pairs (km).
 */
function calculateDistance(coord1, coord2) {
  if (!coord1 || !coord2 || coord1.length < 2 || coord2.length < 2) return null;
  if (coord1[0] === 0 && coord1[1] === 0) return null;
  if (coord2[0] === 0 && coord2[1] === 0) return null;

  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

/**
 * "HH:MM" → minutes since midnight.  Returns null if unparseable.
 */
function timeToMinutes(str) {
  if (!str || !str.includes(":")) return null;
  const [h, m] = str.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

/**
 * Lowercase, strip punctuation, Porter-stem each token.
 * Improves TF-IDF recall (e.g. "billing" and "billed" both → "bill").
 */
function normalizeText(text) {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => PorterStemmer.stem(w))
    .join(" ");
}

// ═══════════════════════════════════════════════════════════════════════════════
//  INDIVIDUAL SCORING FUNCTIONS  (each returns 0–1)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * TF-IDF cosine similarity on Porter-stemmed text.
 */
function textSimilarity(text1, text2) {
  const t1 = normalizeText(text1);
  const t2 = normalizeText(text2);
  if (!t1 || !t2) return 0;

  const tfidf = new TfIdf();
  tfidf.addDocument(t1);
  tfidf.addDocument(t2);

  const vec1 = {};
  const vec2 = {};
  tfidf.listTerms(0).forEach(({ term, tfidf: v }) => { vec1[term] = v; });
  tfidf.listTerms(1).forEach(({ term, tfidf: v }) => { vec2[term] = v; });

  const allTerms = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);
  let dot = 0, mag1 = 0, mag2 = 0;
  allTerms.forEach((t) => {
    const v1 = vec1[t] || 0;
    const v2 = vec2[t] || 0;
    dot += v1 * v2;
    mag1 += v1 ** 2;
    mag2 += v2 ** 2;
  });
  return mag1 === 0 || mag2 === 0 ? 0 : dot / (Math.sqrt(mag1) * Math.sqrt(mag2));
}

/**
 * Exact + stem-fuzzy skill overlap.
 * Returns an object so the caller can build detailed reason strings.
 *
 * Fix vs old code:
 *  - No required skills → 0.7 (neutral-positive, job is open to all)
 *    Old code returned 0.5 which gave an undeserved 25/50 points to every
 *    zero-skills job even when the worker was clearly unrelated.
 */
function skillScore(jobSkills = [], workerSkills = []) {
  if (!jobSkills.length) {
    return { score: 0.7, matchedNames: [], missedNames: [], matchedCount: 0, totalRequired: 0 };
  }

  const stem = (s) => PorterStemmer.stem(s.toLowerCase().trim());
  const workerStemmed = workerSkills.map(stem);

  const matchedNames = [];
  const missedNames  = [];

  jobSkills.forEach((js) => {
    const jsn = stem(js);
    const hit = workerStemmed.some((ws) => ws.includes(jsn) || jsn.includes(ws));
    if (hit) matchedNames.push(js);
    else      missedNames.push(js);
  });

  return {
    score: matchedNames.length / jobSkills.length,
    matchedNames,
    missedNames,
    matchedCount: matchedNames.length,
    totalRequired: jobSkills.length,
  };
}

/**
 * Availability score with REAL per-day time-overlap check.
 *
 * Fix vs old code:
 *  Lines 104-109 in the original always incremented matchingDays regardless
 *  of whether times actually overlapped — the time check was a TODO stub.
 *  Now we compute actual minute overlap and score proportionally:
 *    - Available on day AND full shift covered → 1.0 per day
 *    - Available on day, partial shift covered → 0.4 + coverage * 0.6
 *    - Available on day, zero time overlap     → 0.15 (tried but wrong hours)
 *    - Not available on day                    → 0.0
 */
function availabilityScore(jobHours, workerAvailability = []) {
  if (!jobHours || !jobHours.from || !jobHours.to) return 0.5;
  if (!workerAvailability.length) return 0.3;

  const jobDays =
    Array.isArray(jobHours.days) && jobHours.days.length
      ? jobHours.days
      : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  const jobFrom = timeToMinutes(jobHours.from);
  const jobTo   = timeToMinutes(jobHours.to);

  let total = 0;

  jobDays.forEach((day) => {
    const wd = workerAvailability.find((a) => a.day === day);

    if (!wd || !wd.available) {
      total += 0;
      return;
    }

    const wFrom = timeToMinutes(wd.from);
    const wTo   = timeToMinutes(wd.to);

    // If either side lacks hour info → available on day, hours unknown
    if (wFrom === null || wTo === null || jobFrom === null || jobTo === null) {
      total += 0.7;
      return;
    }

    // Check overlap: ranges [A,B] and [C,D] overlap when A < D && C < B
    const overlaps = wFrom < jobTo && jobFrom < wTo;
    if (!overlaps) {
      total += 0.15; // on the right day but wrong shift
      return;
    }

    // Proportional coverage of the job shift by the worker's window
    const overlapMinutes = Math.min(wTo, jobTo) - Math.max(wFrom, jobFrom);
    const shiftLength    = jobTo - jobFrom;
    const coverage       = shiftLength > 0 ? Math.min(1, overlapMinutes / shiftLength) : 1;
    total += 0.4 + coverage * 0.6; // 0.4 base + up to 0.6 for full coverage
  });

  return jobDays.length > 0 ? total / jobDays.length : 0.5;
}

/**
 * Salary compatibility with proper symmetric gap calculation.
 *
 * Fix vs old code:
 *  Old: `jobMax >= wMin * 0.8 || jobMin <= wMax * 1.2` used OR, so almost
 *  any pair passed as "close enough". Now we compute a gap ratio and bucket it.
 */
function salaryScore(jobMin = 0, jobMax = 0, workerExpected) {
  if (!workerExpected || (!workerExpected.min && !workerExpected.max)) return 0.5;

  const wMin = workerExpected.min || 0;
  const wMax = workerExpected.max || wMin * 1.5 || Infinity;

  // Full overlap → perfect
  if (jobMax >= wMin && jobMin <= wMax) return 1;

  // Gap: how far are the ranges from touching?
  const gap      = jobMax < wMin ? wMin - jobMax : jobMin - wMax;
  const reference = Math.max(jobMax, wMax, 1);
  const gapRatio  = gap / reference;

  if (gapRatio <= 0.15) return 0.75;
  if (gapRatio <= 0.30) return 0.50;
  if (gapRatio <= 0.50) return 0.25;
  return 0.08;
}

/**
 * Experience score (0-1).
 * Fresh jobs (0 required) slightly prefer fresher workers — an overqualified
 * candidate is still fine but less likely to stay.
 */
function experienceScore(requiredYears = 0, workerYears = 0) {
  if (requiredYears === 0) return workerYears === 0 ? 1 : 0.9;
  if (workerYears >= requiredYears)        return 1.00;
  if (workerYears >= requiredYears * 0.75) return 0.75;
  if (workerYears >= requiredYears * 0.50) return 0.50;
  if (workerYears >= requiredYears * 0.25) return 0.25;
  return 0.10;
}

/**
 * Distance score (0-1) with a sharper gradient.
 * Rewards very close jobs strongly; penalises far ones harder than before.
 */
function distanceScore(distanceKm, preferredRadius = 5) {
  if (distanceKm === null) return 0.5;
  if (distanceKm <= preferredRadius * 0.33) return 1.00;
  if (distanceKm <= preferredRadius * 0.66) return 0.90;
  if (distanceKm <= preferredRadius)         return 0.75;
  if (distanceKm <= preferredRadius * 1.5)   return 0.45;
  if (distanceKm <= preferredRadius * 2.0)   return 0.20;
  if (distanceKm <= preferredRadius * 3.0)   return 0.08;
  return 0.02;
}

/**
 * Job-type preference alignment (0-1).
 *
 * New in this version — was completely missing before.
 * A PART_TIME seeker seeing FULL_TIME jobs was scored identically to
 * PART_TIME jobs. Now the matrix captures real preference compatibility.
 */
const JOB_TYPE_MATRIX = {
  FULL_TIME:  { FULL_TIME: 1.0, CONTRACT: 0.7, DAILY_WAGE: 0.4, PART_TIME: 0.3, INTERNSHIP: 0.2 },
  PART_TIME:  { PART_TIME: 1.0, DAILY_WAGE: 0.8, INTERNSHIP: 0.5, CONTRACT: 0.5, FULL_TIME:  0.4 },
  INTERNSHIP: { INTERNSHIP: 1.0, PART_TIME: 0.7, DAILY_WAGE: 0.5, CONTRACT: 0.4, FULL_TIME:  0.3 },
  DAILY_WAGE: { DAILY_WAGE: 1.0, PART_TIME: 0.8, CONTRACT:   0.6, FULL_TIME: 0.3, INTERNSHIP: 0.4 },
  CONTRACT:   { CONTRACT:   1.0, FULL_TIME: 0.7, PART_TIME:  0.5, DAILY_WAGE: 0.6, INTERNSHIP: 0.3 },
};

function jobTypeScore(workerPreference, jobType) {
  if (!workerPreference || workerPreference === "ANY") return 0.75;
  if (!jobType) return 0.6;
  const row = JOB_TYPE_MATRIX[workerPreference] || {};
  return row[jobType] !== undefined ? row[jobType] : 0.4;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  WEIGHTS  (must sum to 100)
// ═══════════════════════════════════════════════════════════════════════════════
//
//  Skills (exact overlap + TF-IDF semantic): 40
//  Distance:                                 20
//  Job-type preference:                      15   ← NEW
//  Experience:                               10
//  Salary:                                   10
//  Availability (with real time overlap):     5
//                                           ---
//                                           100
//
const W = { skills: 40, distance: 20, jobType: 15, experience: 10, salary: 10, availability: 5 };

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

function calculateMatch(job, workerProfile, workerUser) {
  const reasons = [];
  let total = 0;

  // ── 1. SKILLS (40%) ────────────────────────────────────────────────────────
  const jobText    = `${job.title || ""} ${job.description || ""} ${(job.skills || []).join(" ")}`;
  const workerText = `${(workerProfile.skills || []).join(" ")} ${workerProfile.experience || ""} ${workerProfile.bio || ""}`;

  const tfidfSim   = textSimilarity(jobText, workerText);
  const skillResult = skillScore(job.skills, workerProfile.skills);

  // 65% exact overlap + 35% semantic TF-IDF
  const blendedSkill = skillResult.score * 0.65 + tfidfSim * 0.35;
  total += blendedSkill * W.skills;

  if (skillResult.totalRequired === 0) {
    reasons.push("✓ Open to all skill levels");
  } else if (skillResult.matchedCount > 0) {
    reasons.push(`✓ ${skillResult.matchedCount}/${skillResult.totalRequired} required skills matched`);
  } else {
    reasons.push("⚠ Few required skills matched");
  }

  // ── 2. DISTANCE (20%) ──────────────────────────────────────────────────────
  const workerCoords = workerUser?.location?.coordinates;
  const jobCoords    = job.location?.coordinates;
  const distance     = calculateDistance(workerCoords, jobCoords);
  const distScore    = distanceScore(distance, workerProfile.preferredRadius || 5);
  total += distScore * W.distance;

  if (distance !== null) {
    if (distance <= (workerProfile.preferredRadius || 5)) {
      reasons.push(`✓ Within preferred distance (${distance} km)`);
    } else {
      reasons.push(`⚠ ${distance} km away (preferred: ${workerProfile.preferredRadius || 5} km)`);
    }
  } else {
    reasons.push("• Location not set — distance unknown");
  }

  // ── 3. JOB TYPE PREFERENCE (15%) ───────────────────────────────────────────
  const jtScore = jobTypeScore(workerProfile.jobPreference, job.jobType);
  total += jtScore * W.jobType;

  if (jtScore >= 0.9) {
    reasons.push("✓ Matches your job type preference");
  } else if (jtScore >= 0.65) {
    reasons.push("• Job type is compatible");
  } else if (workerProfile.jobPreference && workerProfile.jobPreference !== "ANY") {
    reasons.push(`⚠ Job type differs from your preference (${workerProfile.jobPreference.replace("_", " ")})`);
  }

  // ── 4. EXPERIENCE (10%) ────────────────────────────────────────────────────
  const expScore = experienceScore(job.experienceRequired || 0, workerProfile.experienceYears || 0);
  total += expScore * W.experience;

  if (expScore >= 0.9) {
    reasons.push(
      (job.experienceRequired || 0) === 0
        ? "✓ No experience required"
        : "✓ Experience requirement satisfied"
    );
  } else if (expScore >= 0.5) {
    reasons.push("⚠ Experience slightly below requirement");
  } else {
    reasons.push(`⚠ Needs ${job.experienceRequired || 0}yr experience`);
  }

  // ── 5. SALARY (10%) ────────────────────────────────────────────────────────
  const salScore = salaryScore(job.salaryMin, job.salaryMax, workerProfile.expectedSalary);
  total += salScore * W.salary;

  if (salScore >= 0.9) {
    reasons.push("✓ Salary expectation matches");
  } else if (salScore >= 0.65) {
    reasons.push("• Salary range is close");
  } else if (salScore >= 0.35) {
    reasons.push("⚠ Salary range partially compatible");
  } else {
    reasons.push("⚠ Salary may not meet your expectation");
  }

  // ── 6. AVAILABILITY (5%) ───────────────────────────────────────────────────
  const availScore = availabilityScore(job.workingHours, workerProfile.availability);
  total += availScore * W.availability;

  if (availScore >= 0.8) {
    reasons.push("✓ Working hours match your availability");
  } else if (availScore >= 0.5) {
    reasons.push("• Partial availability match");
  } else {
    reasons.push("⚠ Working hours may not match your schedule");
  }

  // ── BONUSES (capped at 100) ─────────────────────────────────────────────────
  if (job.urgent && workerProfile.availableToday) {
    total = Math.min(100, total + 5);
    reasons.push("✓ Available for urgent hiring");
  }

  if (workerProfile.isStudent && job.jobType === "INTERNSHIP") {
    total = Math.min(100, total + 3);
    reasons.push("✓ Great fit — internship for a student");
  }

  return {
    score: Math.round(Math.min(100, Math.max(0, total))),
    reasons,
    distance,
  };
}

module.exports = { calculateMatch, calculateDistance, textSimilarity, skillScore };
