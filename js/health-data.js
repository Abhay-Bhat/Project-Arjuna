/**
 * health-data.js — Skadi
 * Blood test data + diet plan constants for Health tab integration.
 * Generated from Redcliffe Labs report dated: 2026-05-10
 *
 * HOW TO USE IN CLAUDE CODE:
 *   1. Drop this file into your project root or /js/ directory.
 *   2. Import with: <script src="health-data.js"></script>
 *      OR use: import { BLOOD_TEST, WEEKLY_MEAL_PLAN, ... } from './health-data.js'
 *   3. Run seedCholesterolLog() ONCE to pre-populate your existing Cholesterol Log.
 *   4. Use WEEKLY_MEAL_PLAN[todayIndex] to render today's meals in the Health tab.
 */

// ─────────────────────────────────────────────
// 1. BLOOD TEST SNAPSHOT — 2026-05-10
// ─────────────────────────────────────────────
const BLOOD_TEST = {
  meta: {
    date: "2026-05-10",
    lab: "Redcliffe Labs, Bangalore",
    patient: "Abhay Bhat",
    age: 25,
    gender: "Male",
    healthScore: 80,
    outOfRange: 11,
    borderline: 7,
    withinRange: 88,
  },

  // CRITICAL — needs immediate dietary + supplementation action
  critical: {
    vitaminD: {
      label: "Vitamin D (25-Hydroxy)",
      value: 9.17,
      unit: "ng/mL",
      refMin: 30,
      refMax: 100,
      status: "DEFICIENT",        // <10 = deficient (most severe category)
      action: "Doctor visit this week. 60,000 IU D3/week (prescription) + 15 min morning sun.",
    },
    vitaminB12: {
      label: "Vitamin B12",
      value: 148,                  // actual value is <148 (below measurable range)
      belowDetectable: true,
      unit: "pg/mL",
      refMin: 187,
      refMax: 883,
      status: "CRITICALLY_LOW",
      action: "Doctor visit this week. Methylcobalamin 1500 mcg/day. 2 eggs daily minimum.",
    },
    ldlCholesterol: {
      label: "LDL Cholesterol",
      value: 155.6,
      unit: "mg/dL",
      refMax: 100,
      status: "HIGH",
      action: "Avoid fried food, ghee, cream curries. Eat oats, fish, walnuts daily.",
    },
    hdlCholesterol: {
      label: "HDL Cholesterol",
      value: 36,
      unit: "mg/dL",
      refMin: 40,
      status: "LOW",              // protective cholesterol — want HIGH
      action: "Fish 3x/week, walnuts daily, 30 min walk daily. This is the most fixable.",
    },
    totalCholesterol: {
      label: "Total Cholesterol",
      value: 221,
      unit: "mg/dL",
      refMax: 200,
      status: "HIGH",
    },
    nonHdlCholesterol: {
      label: "Non-HDL Cholesterol",
      value: 185,
      unit: "mg/dL",
      refMax: 130,
      status: "HIGH",
    },
  },

  // BORDERLINE — monitor closely, fix with lifestyle
  borderline: {
    hba1c: {
      label: "HbA1c (Glycosylated Haemoglobin)",
      value: 5.7,
      unit: "%",
      refMax: 5.6,
      status: "BORDERLINE",      // 5.7–6.4 = pre-diabetic range
      action: "Fix sleep cycle (10:30 PM). Eat dinner before 8 PM. Reduce white rice.",
    },
    esr: {
      label: "ESR (Inflammation)",
      value: 13,
      unit: "mm/hr",
      refMax: 10,
      status: "MILDLY_ELEVATED",
      action: "Turmeric + black pepper daily. More greens. Better sleep.",
    },
    cholHdlRatio: {
      label: "Chol/HDL Ratio",
      value: 6.14,
      unit: "ratio",
      refMin: 3.5,
      refMax: 5.0,
      status: "ELEVATED",
    },
    lymphocytes: {
      label: "Lymphocytes (Absolute)",
      value: 3.96,
      unit: "10³/µL",
      refMax: 3.0,
      status: "HIGH",            // likely transient — recheck in 3 months
    },
    rdwCv: {
      label: "RDW (CV)",
      value: 14.7,
      unit: "%",
      refMax: 14.0,
      status: "SLIGHTLY_HIGH",
    },
  },

  // HEALTHY — all clear, maintain
  healthy: {
    liverScore: 100,
    kidneyScore: 100,
    thyroidScore: 100,
    ironScore: 100,
    urinalysisScore: 100,
    hydrationScore: 100,
    fastingGlucose: { value: 83, unit: "mg/dL", refMin: 70, refMax: 100 },
    egfr: { value: 98.75, unit: "mL/min/1.73m²", status: "NORMAL_OR_HIGH" },
    tsh: { value: 1.4, unit: "mIU/L", refMin: 0.35, refMax: 4.94 },
    hemoglobin: { value: 15, unit: "g/dL", refMin: 13.0, refMax: 17.0 },
    triglycerides: { value: 147, unit: "mg/dL", refMax: 150 },   // borderline but okay
    iron: { value: 82, unit: "µg/dL", refMin: 65, refMax: 175 },
  },

  // 3-MONTH RETEST TARGETS
  retestTargets: {
    retestDate: "2026-08-10",       // 3 months from test date
    vitaminD:   { target: 30, unit: "ng/mL" },
    vitaminB12: { target: 300, unit: "pg/mL" },
    ldl:        { target: 130, unit: "mg/dL" },   // realistic 3-month target
    hdl:        { target: 42, unit: "mg/dL" },
    hba1c:      { target: 5.4, unit: "%" },
  },
};

// ─────────────────────────────────────────────
// 2. SUPPLEMENT SCHEDULE
// ─────────────────────────────────────────────
const SUPPLEMENT_SCHEDULE = [
  {
    id: "vitd3",
    name: "Vitamin D3",
    dose: "60,000 IU",
    frequency: "weekly",               // every Sunday with a fat-containing meal
    dayOfWeek: 0,                       // 0 = Sunday
    durationWeeks: 8,
    startDate: null,                    // set when user starts
    rxRequired: true,
    note: "Take with Sunday lunch (a meal with oil/fat). Prescription required.",
    targetMarker: "vitaminD",
  },
  {
    id: "b12",
    name: "Vitamin B12 (Methylcobalamin)",
    dose: "1500 mcg",
    frequency: "daily",
    durationWeeks: 12,
    startDate: null,
    rxRequired: false,
    note: "Sublingual tablet — dissolve under tongue for best absorption. Morning.",
    targetMarker: "vitaminB12",
  },
  {
    id: "omega3",
    name: "Omega-3 Fish Oil",
    dose: "1000 mg (EPA+DHA)",
    frequency: "daily",
    durationWeeks: null,               // ongoing
    startDate: null,
    rxRequired: false,
    note: "Take with lunch. Raises HDL, lowers triglycerides.",
    targetMarker: "hdlCholesterol",
  },
];

// ─────────────────────────────────────────────
// 3. DAILY NUTRITION CHECKLIST
// Tracked as boolean flags each day in localStorage
// ─────────────────────────────────────────────
const DAILY_NUTRITION_CHECKLIST = [
  { id: "eggs",       label: "2 eggs eaten",              icon: "🥚", targetMarker: "vitaminB12",   streak: true },
  { id: "fish",       label: "Fish meal today",           icon: "🐟", targetMarker: "hdlCholesterol", daysPerWeek: 3 },
  { id: "nuts",       label: "Almonds + walnut",          icon: "🌰", targetMarker: "hdlCholesterol", streak: true },
  { id: "sun",        label: "15 min morning sunlight",   icon: "☀️", targetMarker: "vitaminD",     streak: true },
  { id: "water",      label: "3L water",                  icon: "💧", targetMarker: "kidneys",      streak: true },
  { id: "noFried",    label: "Zero fried food",           icon: "🚫", targetMarker: "ldlCholesterol", streak: true },
  { id: "earlyDinner", label: "Dinner before 8 PM",      icon: "🌙", targetMarker: "hba1c",        streak: true },
];

// ─────────────────────────────────────────────
// 4. WEEKLY MEAL PLAN
// Index 0 = Monday ... 6 = Sunday
// All outside food — Bangalore bachelor context
// ─────────────────────────────────────────────
const WEEKLY_MEAL_PLAN = [
  {
    day: "Monday",
    theme: "Chicken & eggs day",
    fish: false,
    meals: [
      { time: "7:00 AM",  slot: "wake",       item: "Warm water + 5 almonds + 1 walnut",                       where: "Home (keep pre-soaked)",             tags: ["HDL", "VitD"] },
      { time: "8:30 AM",  slot: "breakfast",  item: "2 boiled eggs + multigrain toast / egg dosa",             where: "Darshini / Chai Point / canteen",     tags: ["B12", "Protein"],  swap: "Egg bhurji pav. Avoid plain dosa — no protein." },
      { time: "10:30 AM", slot: "midMorning", item: "Curd cup + 1 banana",                                     where: "Office pantry / Instamart",          tags: ["B12", "Gut"] },
      { time: "1:00 PM",  slot: "lunch",      item: "Grilled chicken rice bowl + salad",                       where: "EatFit / FreshMenu / canteen",        tags: ["B12", "Protein", "Fiber"], swap: "Chicken thali — 1 roti + dal + sabzi. No fried papad." },
      { time: "4:30 PM",  slot: "evening",    item: "Roasted makhana + green tea",                             where: "Keep at desk (buy weekly)",          tags: ["AntiInflam", "HDL"] },
      { time: "7:30 PM",  slot: "dinner",     item: "Chicken tikka (4–5 pcs) + 1 roti + dal",                  where: "Swiggy — tandoori section / dhaba",   tags: ["B12", "Protein"],  swap: "Grilled chicken burger (no cheese, no fries)." },
    ],
  },
  {
    day: "Tuesday",
    theme: "Fish day 🐟",
    fish: true,
    meals: [
      { time: "7:00 AM",  slot: "wake",       item: "Warm water + 5 almonds + 1 walnut",                       where: "Home",                               tags: ["HDL", "VitD"] },
      { time: "8:30 AM",  slot: "breakfast",  item: "Omelette (2 eggs) + 2 idli + sambar",                     where: "Darshini / Udupi / canteen",          tags: ["B12", "Protein", "Fiber"] },
      { time: "10:30 AM", slot: "midMorning", item: "1 orange or guava + buttermilk (chaas)",                  where: "Canteen / buy fruit night before",    tags: ["AntiInflam", "Gut"] },
      { time: "1:00 PM",  slot: "lunch",      item: "Fish curry meal — rice + fish curry + sambar",            where: "Nagarjuna / Meghana's / Andhra mess", tags: ["Omega3", "B12", "HDL"],    swap: "Fish fry (shallow, not deep) + rice + rasam. Avoid fish 65." },
      { time: "4:30 PM",  slot: "evening",    item: "Roasted chana + green tea",                               where: "Keep at desk",                       tags: ["Fiber", "Protein"] },
      { time: "7:30 PM",  slot: "dinner",     item: "Egg curry (2 eggs) + 1 chapati + veg",                    where: "Dhaba / tiffin service / Swiggy",     tags: ["B12", "Protein"] },
    ],
  },
  {
    day: "Wednesday",
    theme: "Veg + eggs day",
    fish: false,
    meals: [
      { time: "7:00 AM",  slot: "wake",       item: "Warm lemon water + almonds + walnut",                     where: "Home",                               tags: ["HDL", "VitD"] },
      { time: "8:30 AM",  slot: "breakfast",  item: "Sprouts / poha with peanuts + 1 boiled egg",              where: "Street stall + pre-boiled egg",       tags: ["B12", "Fiber", "Protein"] },
      { time: "10:30 AM", slot: "midMorning", item: "Curd cup + pumpkin seeds",                                where: "Instamart / canteen",                tags: ["B12", "Gut", "HDL"] },
      { time: "1:00 PM",  slot: "lunch",      item: "Rajma / chole rice + salad + chaas",                      where: "Canteen / EatFit / tiffin",           tags: ["Fiber", "LDL", "Sugar"],   swap: "Dal rice + sabzi thali. No fried items." },
      { time: "4:30 PM",  slot: "evening",    item: "Roasted sweet potato + green tea",                        where: "Street vendor / home",               tags: ["Fiber", "Sugar"] },
      { time: "7:30 PM",  slot: "dinner",     item: "Palak egg curry + 1 multigrain roti",                     where: "Swiggy / dhaba",                     tags: ["B12", "AntiInflam", "Fiber"] },
    ],
  },
  {
    day: "Thursday",
    theme: "Fish day 🐟",
    fish: true,
    meals: [
      { time: "7:00 AM",  slot: "wake",       item: "Warm water + almonds + walnut",                           where: "Home",                               tags: ["HDL", "VitD"] },
      { time: "8:30 AM",  slot: "breakfast",  item: "Egg dosa + coconut chutney + filter coffee (no sugar)",   where: "Darshini / Udupi",                   tags: ["B12", "Protein"] },
      { time: "10:30 AM", slot: "midMorning", item: "1 banana + 3–4 walnuts",                                  where: "Keep at desk",                       tags: ["HDL", "Omega3"] },
      { time: "1:00 PM",  slot: "lunch",      item: "Fish thali / fish biryani (no cream curries)",            where: "Meghana's / Nandhana / Andhra mess",  tags: ["Omega3", "B12", "HDL"],    swap: "Subway tuna sub (no cheese, extra veggies)." },
      { time: "4:30 PM",  slot: "evening",    item: "Makhana + black coffee",                                  where: "Desk",                               tags: ["AntiInflam"] },
      { time: "7:30 PM",  slot: "dinner",     item: "Clear chicken soup + 1 multigrain toast",                 where: "Restaurant / Swiggy clear soups",    tags: ["Protein", "AntiInflam", "LDL"] },
    ],
  },
  {
    day: "Friday",
    theme: "Chicken & legumes day",
    fish: false,
    meals: [
      { time: "7:00 AM",  slot: "wake",       item: "Warm water + almonds + walnut + 1 tsp flaxseed powder",  where: "Home",                               tags: ["HDL", "Omega3", "LDL"] },
      { time: "8:30 AM",  slot: "breakfast",  item: "Omelette sandwich (wheat, no cheese) / masala oats",     where: "Chai Point / café / canteen",         tags: ["B12", "Protein"],          swap: "Upma + boiled egg. Avoid puri-bhaji." },
      { time: "10:30 AM", slot: "midMorning", item: "Buttermilk + 1 seasonal fruit (papaya / guava)",         where: "Canteen chaas + carry fruit",         tags: ["Gut", "AntiInflam", "VitD"] },
      { time: "1:00 PM",  slot: "lunch",      item: "Grilled chicken salad bowl / wrap (no mayo)",            where: "Salad Days / Subway / EatFit",        tags: ["B12", "Protein", "Fiber"],  swap: "Tandoori chicken + dal + 1 roti. Skip butter chicken." },
      { time: "4:30 PM",  slot: "evening",    item: "Sprout chaat (street vendor) + green tea",               where: "Street / canteen",                   tags: ["Protein", "Fiber"] },
      { time: "7:30 PM",  slot: "dinner",     item: "Dal khichdi + curd + seasonal sabzi",                    where: "Tiffin service / Swiggy",             tags: ["Fiber", "Sugar", "LDL", "Gut"] },
    ],
  },
  {
    day: "Saturday",
    theme: "Fish day 🐟 + relax",
    fish: true,
    meals: [
      { time: "7:00 AM",  slot: "wake",       item: "Warm water + almonds + walnut",                           where: "Home",                               tags: ["HDL", "VitD"] },
      { time: "9:00 AM",  slot: "breakfast",  item: "Rava idli + sambar + 2 boiled eggs",                      where: "MTR / Darshini / weekend brunch",     tags: ["B12", "Protein", "Fiber"],  swap: "Pesarattu (moong dal dosa) at Andhra place." },
      { time: "11:00 AM", slot: "midMorning", item: "Tender coconut water + mixed seeds",                      where: "Street vendor",                      tags: ["Gut", "HDL", "Omega3"] },
      { time: "1:30 PM",  slot: "lunch",      item: "Grilled fish + brown rice + rasam + buttermilk",          where: "Fishland / Machali / coastal resto",  tags: ["Omega3", "B12", "HDL", "Gut"], swap: "Fish curry rice from Kerala mess. Avoid fish fry/65." },
      { time: "5:00 PM",  slot: "evening",    item: "Curd + papaya + pomegranate",                             where: "Buy weekend fruit stock",            tags: ["B12", "AntiInflam", "Gut"] },
      { time: "7:30 PM",  slot: "dinner",     item: "Egg bhurji + 2 multigrain toast",                         where: "Order / easy home cook (5 min)",      tags: ["B12", "Protein"],          swap: "Weekend — worth making: scramble 2 eggs, onion, tomato, turmeric." },
    ],
  },
  {
    day: "Sunday",
    theme: "Recovery + prep day",
    fish: false,
    meals: [
      { time: "7:00 AM",  slot: "wake",       item: "Warm lemon water + almonds + walnut + flaxseed",          where: "Home",                               tags: ["HDL", "Omega3", "LDL"] },
      { time: "9:00 AM",  slot: "breakfast",  item: "Masala omelette (2 eggs) + set dosa / appam",             where: "Weekend South Indian brunch",         tags: ["B12", "Protein"],          swap: "Egg uttapam — protein-rich." },
      { time: "11:00 AM", slot: "midMorning", item: "Fresh juice (no sugar) — mosambi / pomegranate",          where: "Juice shop — insist NO sugar",         tags: ["AntiInflam", "VitD"] },
      { time: "1:30 PM",  slot: "lunch",      item: "Non-veg thali — tandoori chicken + dal + roti + sabzi",   where: "Punjabi / North Indian restaurant",   tags: ["B12", "Protein", "Fiber", "Gut"], swap: "Andhra non-veg meals (chicken curry rice). Not cream-based." },
      { time: "5:00 PM",  slot: "evening",    item: "Roasted makhana + masala chai (less sugar)",              where: "Home / café",                        tags: ["AntiInflam"] },
      { time: "7:30 PM",  slot: "dinner",     item: "Clear chicken soup + salad",                              where: "Swiggy / light restaurant",           tags: ["Protein", "AntiInflam", "LDL"], swap: "Light dinner Sunday → better Monday sleep → lower HbA1c." },
    ],
  },
];

// ─────────────────────────────────────────────
// 5. ORDERING RULES (10 smart rules for outside food)
// ─────────────────────────────────────────────
const ORDERING_RULES = [
  { rule: "Grilled / tandoori over fried / butter",   impact: "LDL↓",   example: "Tandoori chicken > Butter chicken" },
  { rule: "Chapati/roti, not naan",                   impact: "LDL↓",   example: "Naan = maida + butter" },
  { rule: "Chaas instead of lassi or soft drinks",    impact: "Sugar",   example: "Lassi has 4–6 tsp sugar" },
  { rule: "Filter by EatFit / Healthy on Swiggy",     impact: "Sugar",   example: "These list macros + use brown rice" },
  { rule: "Idli/dosa/appam over puri/vada/bonda",    impact: "LDL↓",   example: "Steamed > fried, always" },
  { rule: "Tomato-based gravies, skip cream-based",   impact: "LDL↓",   example: "Dal tadka yes, Dal makhani no" },
  { rule: "Write 'less oil' in Swiggy notes",         impact: "LDL↓",   example: "Most apps have order notes field" },
  { rule: "Brown/jeera rice over white rice",         impact: "Sugar",   example: "EatFit + bowl restaurants offer it" },
  { rule: "2 eggs every day, any form",               impact: "B12",    example: "Boiled, bhurji, omelette — all fine" },
  { rule: "Fish 3 days/week — Tue, Thu, Sat",         impact: "HDL↑",   example: "Rohu / surmai / pomfret curry" },
];

// ─────────────────────────────────────────────
// 6. WEEKLY GROCERY LIST (desk + home essentials)
// ─────────────────────────────────────────────
const WEEKLY_GROCERY = [
  { item: "Almonds (250g)",          frequency: "monthly",      cost: 250,  note: "Soak 5 each night" },
  { item: "Walnuts (250g)",          frequency: "monthly",      cost: 300,  note: "1–2 daily" },
  { item: "Roasted makhana (200g)",  frequency: "fortnightly",  cost: 120,  note: "Desk snack" },
  { item: "Mixed seeds (200g)",      frequency: "monthly",      cost: 200,  note: "Sprinkle on curd" },
  { item: "Ground flaxseed (200g)",  frequency: "monthly",      cost: 80,   note: "1 tsp in morning water" },
  { item: "Green tea (25 bags)",     frequency: "monthly",      cost: 150,  note: "Afternoon antioxidant" },
  { item: "Eggs (30-tray)",          frequency: "weekly",       cost: 220,  note: "Boil 6 on Sundays" },
  { item: "Bananas",                 frequency: "weekly",       cost: 50,   note: "Easy grab snack" },
  { item: "Seasonal fruit",          frequency: "weekly",       cost: 100,  note: "Guava / papaya / orange" },
  { item: "Curd (400g × 2)",         frequency: "weekly",       cost: 60,   note: "Mid-morning daily" },
  { item: "Roasted chana (200g)",    frequency: "fortnightly",  cost: 40,   note: "Desk snack alternative" },
];

// ─────────────────────────────────────────────
// 7. localStorage SEED — run ONCE to pre-populate
// existing Cholesterol Log with May 10 test data
// ─────────────────────────────────────────────

/**
 * seedCholesterolLog()
 * Adds the May 10, 2026 blood test results into whatever
 * localStorage key your existing Cholesterol Log uses.
 *
 * INSTRUCTIONS FOR CLAUDE CODE:
 *   1. Find where your cholesterol log is stored in localStorage.
 *      It'll be something like: localStorage.getItem('cholesterol_log')
 *      or similar. Match the key + data shape exactly.
 *   2. Replace 'cholesterol_log' below with your actual key.
 *   3. Match the object shape to your existing log entries.
 *   4. Call seedCholesterolLog() once from your app init (with a guard).
 */
function seedCholesterolLog(storageKey = 'cholesterolLog') {
  const SEED_FLAG = 'arjuna_cholesterol_seeded_v1';
  if (localStorage.getItem(SEED_FLAG)) return; // already seeded

  const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');

  const seedEntry = {
    id: 'seed_20260510',
    date: '2026-05-10',
    ldl: 155.6,
    hdl: 36,
    total: 221,
    triglycerides: 147,              // bonus field — add to your log UI if not present
    nonHdl: 185,                     // bonus field
    hba1c: 5.7,                      // bonus field
    vitaminD: 9.17,                  // bonus field
    vitaminB12: 148,                 // bonus field (actual <148 but stored as 148 for charting)
    notes: 'Redcliffe Labs full body checkup. LDL high, HDL low, Vit D/B12 critical. Starting diet + supplements.',
    source: 'Redcliffe Labs',
  };

  existing.unshift(seedEntry); // add at top (most recent first)
  localStorage.setItem(storageKey, JSON.stringify(existing));
  localStorage.setItem(SEED_FLAG, 'true');
  console.log('[Skadi] Cholesterol log seeded with 2026-05-10 blood test data.');
}

// ─────────────────────────────────────────────
// 8. HELPER FUNCTIONS
// ─────────────────────────────────────────────

/** Returns today's meal plan (0=Mon, 6=Sun). Falls back to Monday. */
function getTodayMealPlan() {
  const d = new Date().getDay(); // 0=Sun, 1=Mon ... 6=Sat
  const idx = d === 0 ? 6 : d - 1; // convert to Mon-indexed
  return WEEKLY_MEAL_PLAN[idx];
}

/** Returns today's nutrition checklist with today's logged state from localStorage. */
function getTodayNutritionLog(dateStr = new Date().toISOString().split('T')[0]) {
  const key = `arjuna_nutrition_${dateStr}`;
  const saved = JSON.parse(localStorage.getItem(key) || '{}');
  return DAILY_NUTRITION_CHECKLIST.map(item => ({
    ...item,
    checked: saved[item.id] || false,
  }));
}

/** Toggle a nutrition checklist item and persist to localStorage. */
function toggleNutritionItem(itemId, dateStr = new Date().toISOString().split('T')[0]) {
  const key = `arjuna_nutrition_${dateStr}`;
  const saved = JSON.parse(localStorage.getItem(key) || '{}');
  saved[itemId] = !saved[itemId];
  localStorage.setItem(key, JSON.stringify(saved));
  return saved[itemId]; // returns new state (true/false)
}

/** Returns number of consecutive days all 7 checklist items were completed. */
function getNutritionStreak() {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 90; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const log = JSON.parse(localStorage.getItem(`arjuna_nutrition_${dateStr}`) || '{}');
    const allDone = DAILY_NUTRITION_CHECKLIST.every(item => log[item.id]);
    if (allDone) streak++;
    else if (i > 0) break;
  }
  return streak;
}

/** Returns status badge for a given marker value vs reference range. */
function getMarkerStatus(value, refMin, refMax) {
  if (refMin !== undefined && value < refMin) return 'LOW';
  if (refMax !== undefined && value > refMax) return 'HIGH';
  return 'NORMAL';
}

/** How many days until retest? */
function getDaysToRetest() {
  const retest = new Date(BLOOD_TEST.retestTargets.retestDate);
  const today = new Date();
  return Math.max(0, Math.ceil((retest - today) / (1000 * 60 * 60 * 24)));
}

// ─────────────────────────────────────────────
// 9. EXPORT (works as ES module OR global script)
// ─────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  // Node / CommonJS (Claude Code environment)
  module.exports = {
    BLOOD_TEST, SUPPLEMENT_SCHEDULE, DAILY_NUTRITION_CHECKLIST,
    WEEKLY_MEAL_PLAN, ORDERING_RULES, WEEKLY_GROCERY,
    seedCholesterolLog, getTodayMealPlan, getTodayNutritionLog,
    toggleNutritionItem, getNutritionStreak, getMarkerStatus, getDaysToRetest,
  };
} else if (typeof window !== 'undefined') {
  // Browser global (script tag import)
  window.ArjunaHealth = {
    BLOOD_TEST, SUPPLEMENT_SCHEDULE, DAILY_NUTRITION_CHECKLIST,
    WEEKLY_MEAL_PLAN, ORDERING_RULES, WEEKLY_GROCERY,
    seedCholesterolLog, getTodayMealPlan, getTodayNutritionLog,
    toggleNutritionItem, getNutritionStreak, getMarkerStatus, getDaysToRetest,
  };
}
