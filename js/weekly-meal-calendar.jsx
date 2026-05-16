import { useState } from "react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const TAG_COLORS = {
  "B12": { bg: "#FDE8E8", color: "#991B1B" },
  "Vit D": { bg: "#FEF3C7", color: "#92400E" },
  "HDL": { bg: "#D1FAE5", color: "#065F46" },
  "LDL↓": { bg: "#DBEAFE", color: "#1E40AF" },
  "Sugar": { bg: "#F3E8FF", color: "#6B21A8" },
  "Anti-inflam": { bg: "#FFE4E6", color: "#9F1239" },
  "Omega-3": { bg: "#CCFBF1", color: "#134E4A" },
  "Protein": { bg: "#F0EDEA", color: "#44403C" },
  "Fiber": { bg: "#ECFCCB", color: "#3F6212" },
  "Gut": { bg: "#EDE9FE", color: "#5B21B6" },
};

const C = {
  bg: "#FAFAF7", card: "#FFFFFF", green: "#2D6A4F", greenLight: "#D8F3DC",
  red: "#C1292E", redLight: "#FDE8E8", amber: "#B8860B", amberLight: "#FFF8E1",
  text: "#1A1A1A", sub: "#6B7280", border: "#E8E6E1", tagBg: "#F0EDEA",
  fish: "#0E7490", fishBg: "#ECFEFF",
};

const weekPlan = [
  {
    day: "Monday",
    theme: "Egg & chicken day",
    meals: {
      wake: { time: "7:00 AM", item: "Warm water + 5 soaked almonds + 1 walnut", where: "Keep at home (buy weekly)", tags: ["HDL", "Vit D"], cost: "₹10" },
      breakfast: { time: "8:30 AM", item: "2 boiled egg + 1 multigrain toast OR egg dosa", where: "Any South Indian joint / Chai Point / office canteen", tags: ["B12", "Protein"], cost: "₹60–80", swap: "Egg bhurji pav works too. Avoid plain dosa — no protein." },
      midMorning: { time: "10:30 AM", item: "1 cup curd + 1 banana", where: "Office pantry / Swiggy Instamart curd cup", tags: ["B12", "Gut", "Vit D"], cost: "₹30", swap: "Buttermilk (chaas) from any South Indian restaurant if curd unavailable." },
      lunch: { time: "1:00 PM", item: "Grilled chicken rice bowl (brown/jeera rice) + side salad", where: "FreshMenu / EatFit / Behrouz (tandoori option) / office canteen", tags: ["B12", "Protein", "Fiber"], cost: "₹180–220", swap: "Chicken thali with 1 roti + dal + sabzi. Ask for less oil. Skip the fried papad." },
      evening: { time: "4:30 PM", item: "Green tea + handful of roasted makhana or mixed nuts", where: "Keep at desk (buy weekly from DMart/BigBasket)", tags: ["Anti-inflam", "HDL"], cost: "₹15" },
      dinner: { time: "7:30 PM", item: "Chicken tikka (4-5 pcs) + 1 roti + dal", where: "Any North Indian restaurant / Swiggy — tandoori section", tags: ["B12", "Protein", "LDL↓"], cost: "₹180–220", swap: "Grilled chicken burger (skip cheese, skip fries) from a healthier chain if craving fast food." },
    },
  },
  {
    day: "Tuesday",
    theme: "🐟 Fish day",
    fish: true,
    meals: {
      wake: { time: "7:00 AM", item: "Warm water + 5 almonds + 1 walnut", where: "Home", tags: ["HDL", "Vit D"], cost: "₹10" },
      breakfast: { time: "8:30 AM", item: "Omelette (2 eggs) + 2 idli with sambar", where: "Any Darshini / Udupi restaurant / office canteen", tags: ["B12", "Protein", "Fiber"], cost: "₹50–70", swap: "Anda pav / Egg roll from street stall also works. Avoid maida paratha." },
      midMorning: { time: "10:30 AM", item: "1 orange or guava + buttermilk (chaas)", where: "Buy fruit night before / chaas from canteen", tags: ["Anti-inflam", "Gut"], cost: "₹25" },
      lunch: { time: "1:00 PM", item: "Fish curry meal (rice + fish curry + sambar + veggie)", where: "Any Andhra/Kerala mess — Nagarjuna, Meghana's fish meals", tags: ["Omega-3", "B12", "HDL", "Protein"], cost: "₹200–250", swap: "Fish fry (shallow fried, not deep fried) + rice + rasam is also fine. Avoid fish 65 (deep fried)." },
      evening: { time: "4:30 PM", item: "Roasted chana + green tea", where: "Keep at desk", tags: ["Fiber", "Protein"], cost: "₹15" },
      dinner: { time: "7:30 PM", item: "Egg curry (2 eggs) + 1 chapati + veg side", where: "Any dhaba / tiffin service / Swiggy", tags: ["B12", "Protein", "Fiber"], cost: "₹120–150", swap: "Boiled egg with roti-sabzi combo from any North Indian place." },
    },
  },
  {
    day: "Wednesday",
    theme: "Vegetarian + eggs day",
    meals: {
      wake: { time: "7:00 AM", item: "Warm lemon water + 5 almonds + 1 walnut + 3 soaked raisins", where: "Home", tags: ["HDL", "Vit D"], cost: "₹12" },
      breakfast: { time: "8:30 AM", item: "Sprouts plate / poha with peanuts + 1 boiled egg", where: "Street stall poha + keep boiled eggs at home (boil 6 on Sunday)", tags: ["B12", "Fiber", "Protein"], cost: "₹40–60", swap: "Masala oats from Chai Point / office pantry with a boiled egg." },
      midMorning: { time: "10:30 AM", item: "Curd cup + a handful of pumpkin seeds", where: "Swiggy Instamart / office fridge", tags: ["B12", "Gut", "HDL"], cost: "₹35" },
      lunch: { time: "1:00 PM", item: "Rajma/chole rice combo + salad + chaas", where: "Any North Indian canteen / EatFit / tiffin service", tags: ["Fiber", "LDL↓", "Sugar", "Protein"], cost: "₹120–160", swap: "Dal rice + sabzi thali (no fried items). Legume-based curries are key today — they lower LDL." },
      evening: { time: "4:30 PM", item: "1 sweet potato (many street vendors sell roasted ones) + green tea", where: "Street vendor / keep at home", tags: ["Fiber", "Sugar"], cost: "₹20" },
      dinner: { time: "7:30 PM", item: "Palak egg curry + 1 roti (multigrain/bajra if available)", where: "Swiggy — filter 'healthy' / any dhaba", tags: ["B12", "Anti-inflam", "Fiber"], cost: "₹130–170", swap: "Egg fried rice (ask for less oil) with a side of dal works in a pinch." },
    },
  },
  {
    day: "Thursday",
    theme: "🐟 Fish day",
    fish: true,
    meals: {
      wake: { time: "7:00 AM", item: "Warm water + almonds + walnut", where: "Home", tags: ["HDL", "Vit D"], cost: "₹10" },
      breakfast: { time: "8:30 AM", item: "Egg dosa + coconut chutney + filter coffee (no sugar)", where: "Any Darshini / Udupi joint", tags: ["B12", "Protein"], cost: "₹60–80", swap: "Ragi mudde + sambar at a Karnataka-style restaurant if adventurous." },
      midMorning: { time: "10:30 AM", item: "1 banana + handful of walnuts (3-4)", where: "Keep at desk", tags: ["HDL", "Omega-3"], cost: "₹20" },
      lunch: { time: "1:00 PM", item: "Fish thali / fish biryani (avoid heavy cream-based curries)", where: "Meghana's / Nandhana / any Andhra mess", tags: ["Omega-3", "B12", "HDL", "Protein"], cost: "₹200–280", swap: "Grilled fish plate from a café. Even Subway's tuna sub (no cheese, extra veggies) works." },
      evening: { time: "4:30 PM", item: "Makhana + black coffee or green tea", where: "Keep at desk", tags: ["Anti-inflam"], cost: "₹15" },
      dinner: { time: "7:30 PM", item: "Chicken soup (clear, not cream-based) + 1 multigrain roti/toast", where: "Any restaurant / Swiggy — look for clear soups", tags: ["Protein", "Anti-inflam", "LDL↓"], cost: "₹150–180", swap: "Tom yum soup (chicken) from a Thai place — turmeric + lemongrass = anti-inflammatory bonus." },
    },
  },
  {
    day: "Friday",
    theme: "Chicken & legumes day",
    meals: {
      wake: { time: "7:00 AM", item: "Warm water + almonds + walnut + 1 tsp flaxseed powder (mix in water)", where: "Home", tags: ["HDL", "Omega-3", "LDL↓"], cost: "₹12" },
      breakfast: { time: "8:30 AM", item: "Omelette sandwich (wheat bread, no cheese) OR masala oats", where: "Chai Point / café near office / canteen", tags: ["B12", "Protein", "LDL↓"], cost: "₹70–100", swap: "Upma + boiled egg from a South Indian joint. Avoid puri-bhaji." },
      midMorning: { time: "10:30 AM", item: "Buttermilk + 1 seasonal fruit (papaya/guava/orange)", where: "Canteen chaas + carry fruit from home", tags: ["Gut", "Anti-inflam", "Vit D"], cost: "₹25" },
      lunch: { time: "1:00 PM", item: "Chicken breast salad bowl / grilled chicken wrap (no mayo)", where: "Salad Days / Subway / EatFit / any café with bowls", tags: ["B12", "Protein", "Fiber", "LDL↓"], cost: "₹200–250", swap: "Tandoori chicken + dal + 1 roti from any North Indian place. Skip butter chicken — it's cream-loaded." },
      evening: { time: "4:30 PM", item: "Sprout chaat from a street vendor + green tea", where: "Street food / canteen", tags: ["Protein", "Fiber"], cost: "₹20–30" },
      dinner: { time: "7:30 PM", item: "Dal khichdi + curd + any seasonal sabzi", where: "Any home-style tiffin service / Swiggy", tags: ["Fiber", "Sugar", "LDL↓", "Gut"], cost: "₹100–140", swap: "Dal tadka + 1 roti + raita. Light dinner = better sleep = better HbA1c." },
    },
  },
  {
    day: "Saturday",
    theme: "🐟 Fish day + meal prep light",
    fish: true,
    meals: {
      wake: { time: "7:00 AM", item: "Warm water + almonds + walnut", where: "Home", tags: ["HDL", "Vit D"], cost: "₹10" },
      breakfast: { time: "9:00 AM", item: "Rava idli + sambar + 2 boiled eggs", where: "Weekend brunch at any Darshini / MTR / Vidyarthi Bhavan type", tags: ["B12", "Protein", "Fiber"], cost: "₹70–90", swap: "Pesarattu (moong dal dosa) at an Andhra place — protein-rich." },
      midMorning: { time: "11:00 AM", item: "Tender coconut water + handful of mixed seeds", where: "Street vendor coconut", tags: ["Gut", "HDL", "Omega-3"], cost: "₹40" },
      lunch: { time: "1:30 PM", item: "Grilled fish + brown rice + rasam + buttermilk", where: "Fish restaurant — Fishland, Machali, or any coastal restaurant in Bangalore", tags: ["Omega-3", "B12", "HDL", "Protein", "Gut"], cost: "₹250–350", swap: "Fish curry rice from a Kerala mess (Kairali, Kerala Kitchen type). Avoid fish fry/65." },
      evening: { time: "5:00 PM", item: "1 cup curd + mixed fruits (papaya + pomegranate)", where: "Buy from BigBasket/Zepto — weekend fruit stock", tags: ["B12", "Anti-inflam", "Gut"], cost: "₹50" },
      dinner: { time: "7:30 PM", item: "Egg bhurji + 2 multigrain toast", where: "Easy to make even for a non-cook! Or order", tags: ["B12", "Protein"], cost: "₹50–80", swap: "This is one meal worth making at home on weekends — just scramble 2 eggs with onion, tomato, turmeric in 5 min." },
    },
  },
  {
    day: "Sunday",
    theme: "Recovery & prep day",
    meals: {
      wake: { time: "7:00 AM", item: "Warm lemon water + almonds + walnut + flaxseed powder", where: "Home", tags: ["HDL", "Omega-3", "LDL↓"], cost: "₹12" },
      breakfast: { time: "9:00 AM", item: "Masala omelette (2 eggs) + set dosa or appam", where: "Any South Indian restaurant — weekend relaxed breakfast", tags: ["B12", "Protein"], cost: "₹80–100", swap: "Egg uttapam if available — filling and protein-rich." },
      midMorning: { time: "11:00 AM", item: "Fresh fruit juice (no sugar added) — mosambi/orange/pomegranate", where: "Juice shop — insist on no sugar", tags: ["Anti-inflam", "Vit D"], cost: "₹40–60" },
      lunch: { time: "1:30 PM", item: "Non-veg thali (tandoori chicken + dal + roti + sabzi + salad + chaas)", where: "Any Punjabi/North Indian restaurant", tags: ["B12", "Protein", "Fiber", "Gut"], cost: "₹200–280", swap: "Andhra non-veg meals (chicken curry rice) — spicy is fine, just not cream-based." },
      evening: { time: "5:00 PM", item: "Roasted makhana + masala chai (less sugar or sugar-free)", where: "Home / café", tags: ["Anti-inflam"], cost: "₹20" },
      dinner: { time: "7:30 PM", item: "Clear chicken soup + salad OR moong dal chilla (if feeling light)", where: "Swiggy / make soup at home (packet soups are fine occasionally)", tags: ["Protein", "Anti-inflam", "LDL↓"], cost: "₹120–160", swap: "Light dinner on Sunday is crucial — sets the tone for your Monday. Avoid ordering biryani." },
    },
  },
];

const mealEmoji = { wake: "🌅", breakfast: "🍳", midMorning: "🥤", lunch: "🍽️", evening: "🫖", dinner: "🌙" };
const mealLabels = { wake: "Wake-up ritual", breakfast: "Breakfast", midMorning: "Mid-morning", lunch: "Lunch", evening: "Evening snack", dinner: "Dinner" };

const groceryList = [
  { item: "Almonds (250g bag)", freq: "Monthly", cost: "₹250", note: "Soak 5 every night in water" },
  { item: "Walnuts (250g bag)", freq: "Monthly", cost: "₹300", note: "1–2 daily with almonds" },
  { item: "Roasted makhana (200g)", freq: "Fortnightly", cost: "₹120", note: "Evening desk snack" },
  { item: "Mixed seeds (pumpkin, sunflower, chia) 200g", freq: "Monthly", cost: "₹200", note: "Sprinkle on curd" },
  { item: "Ground flaxseed powder (200g)", freq: "Monthly", cost: "₹80", note: "1 tsp in morning water" },
  { item: "Green tea bags (25 pack)", freq: "Monthly", cost: "₹150", note: "Afternoon antioxidant" },
  { item: "Eggs (tray of 30)", freq: "Weekly", cost: "₹200–240", note: "Boil 6 on Sunday for the week" },
  { item: "Bananas (dozen)", freq: "Weekly", cost: "₹50", note: "Easy grab-and-go snack" },
  { item: "Seasonal fruit (guava/papaya/orange)", freq: "Weekly", cost: "₹80–100", note: "Vitamin C for immunity" },
  { item: "Curd cups (400g × 2)", freq: "Weekly", cost: "₹60", note: "Daily mid-morning or with lunch" },
  { item: "Roasted chana (200g)", freq: "Fortnightly", cost: "₹40", note: "Desk snack alternative" },
];

const orderingTips = [
  { tip: "Always pick 'grilled' or 'tandoori' over 'fried' or 'butter'", impact: "LDL↓", example: "Tandoori chicken > Butter chicken. Grilled fish > Fish 65." },
  { tip: "Ask for chapati/roti, not naan or butter naan", impact: "LDL↓", example: "Naan is maida + butter. Roti is whole wheat." },
  { tip: "Order chaas/buttermilk instead of lassi or soft drinks", impact: "Gut", example: "Lassi has 4–6 tsp sugar. Chaas has zero." },
  { tip: "On Swiggy/Zomato, filter by 'Healthy' or search 'EatFit' / 'Calorie-counted meals'", impact: "Sugar", example: "These restaurants list macros and use brown rice, less oil." },
  { tip: "At South Indian joints, prefer idli/dosa/appam over puri/vada/bonda", impact: "LDL↓", example: "Steamed > fried. Always." },
  { tip: "Skip cream-based gravies entirely — pick tomato-based or dry preparations", impact: "LDL↓", example: "Dal makhani has cream. Plain dal tadka doesn't." },
  { tip: "Carry a small box of mixed nuts + makhana to office every Monday", impact: "HDL", example: "Saves you from samosa runs at 4 PM." },
  { tip: "Order 'less oil' when placing orders — most apps have a notes section", impact: "LDL↓", example: "Write: 'Less oil please, no extra butter/cream'" },
  { tip: "Choose brown/jeera rice over white rice when available", impact: "Sugar", example: "EatFit and most bowl-restaurants offer this option." },
  { tip: "2 eggs a day is your B12 lifeline — don't skip them", impact: "B12", example: "Boiled, omelette, bhurji — any form. Just eat them daily." },
];

function Tag({ label }) {
  const c = TAG_COLORS[label] || { bg: C.tagBg, color: C.sub };
  return <span style={{ display: "inline-block", fontSize: 10, padding: "1px 6px", borderRadius: 3, background: c.bg, color: c.color, fontWeight: 500, marginRight: 3 }}>{label}</span>;
}

function MealRow({ type, meal, isLast }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: isLast ? "none" : `1px solid ${C.border}`, padding: "10px 0" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: meal.swap ? "pointer" : "default" }} onClick={() => meal.swap && setOpen(!open)}>
        <span style={{ fontSize: 16, minWidth: 22, textAlign: "center" }}>{mealEmoji[type]}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: C.sub, fontWeight: 500 }}>{mealLabels[type]} · {meal.time}</span>
            <span style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>{meal.cost}</span>
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 500, color: C.text, marginTop: 3, lineHeight: 1.4 }}>{meal.item}</div>
          <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2 }}>📍 {meal.where}</div>
          <div style={{ marginTop: 4 }}>{meal.tags.map(t => <Tag key={t} label={t} />)}</div>
          {open && meal.swap && (
            <div style={{ marginTop: 8, fontSize: 12, color: "#4B5563", background: "#F9FAFB", padding: "8px 10px", borderRadius: 6, borderLeft: `3px solid ${C.green}`, lineHeight: 1.5 }}>
              <strong>Swap option:</strong> {meal.swap}
            </div>
          )}
        </div>
        {meal.swap && <span style={{ fontSize: 10, color: C.sub, marginTop: 14 }}>{open ? "▲" : "▼"}</span>}
      </div>
    </div>
  );
}

function DayCard({ plan, isActive, onClick }) {
  const mealKeys = ["wake", "breakfast", "midMorning", "lunch", "evening", "dinner"];
  const totalMin = mealKeys.reduce((sum, k) => sum + parseInt((plan.meals[k]?.cost || "₹0").replace(/[₹,–].*/g, "")), 0);
  const totalMax = mealKeys.reduce((sum, k) => {
    const c = plan.meals[k]?.cost || "₹0";
    const parts = c.replace("₹", "").split("–");
    return sum + parseInt(parts[parts.length - 1] || parts[0]);
  }, 0);

  if (!isActive) {
    return (
      <div onClick={onClick} style={{ background: plan.fish ? C.fishBg : C.card, border: `1px solid ${plan.fish ? "#A5F3FC" : C.border}`, borderRadius: 10, padding: "12px 16px", cursor: "pointer", transition: "all 0.15s" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{plan.day}</div>
            <div style={{ fontSize: 12, color: plan.fish ? C.fish : C.sub }}>{plan.theme}</div>
          </div>
          <span style={{ fontSize: 12, color: C.sub }}>₹{totalMin}–{totalMax}/day →</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: C.card, border: `2px solid ${C.green}`, borderRadius: 14, overflow: "hidden" }}>
      <div style={{ background: plan.fish ? "linear-gradient(135deg,#0E7490,#06B6D4)" : `linear-gradient(135deg,${C.green},#40916C)`, padding: "14px 18px", color: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>{plan.day}</div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>{plan.theme}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, opacity: 0.7 }}>Est. daily cost</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>₹{totalMin}–{totalMax}</div>
          </div>
        </div>
      </div>
      <div style={{ padding: "8px 18px 14px" }}>
        {mealKeys.map((k, i) => (
          <MealRow key={k} type={k} meal={plan.meals[k]} isLast={i === mealKeys.length - 1} />
        ))}
      </div>
    </div>
  );
}

export default function WeeklyPlan() {
  const [activeDay, setActiveDay] = useState(0);
  const [tab, setTab] = useState("calendar");

  const tabs = [
    { id: "calendar", label: "Weekly calendar" },
    { id: "ordering", label: "Ordering smart" },
    { id: "grocery", label: "Weekly grocery" },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", maxWidth: 680, margin: "0 auto", color: C.text }}>
      <div style={{ background: "linear-gradient(135deg,#1B4332,#2D6A4F)", borderRadius: 16, padding: "24px 22px", marginBottom: 18, color: "#fff" }}>
        <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, opacity: 0.7 }}>Bachelor-friendly · Bangalore · No cooking required</div>
        <div style={{ fontSize: 21, fontWeight: 700, marginTop: 6 }}>Weekly meal calendar</div>
        <div style={{ fontSize: 12.5, opacity: 0.8, marginTop: 6, lineHeight: 1.5 }}>
          Every meal is orderable from Swiggy/Zomato, available at canteens, or from a nearby eatery. Tap any meal for swap options.
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 14, fontSize: 11, flexWrap: "wrap" }}>
          <span style={{ background: "rgba(255,255,255,0.15)", padding: "3px 10px", borderRadius: 20 }}>🐟 Fish 3×/week</span>
          <span style={{ background: "rgba(255,255,255,0.15)", padding: "3px 10px", borderRadius: 20 }}>🥚 Eggs daily</span>
          <span style={{ background: "rgba(255,255,255,0.15)", padding: "3px 10px", borderRadius: 20 }}>💰 ₹400–600/day</span>
          <span style={{ background: "rgba(255,255,255,0.15)", padding: "3px 10px", borderRadius: 20 }}>🚫 Zero cooking</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "7px 14px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer",
            background: tab === t.id ? C.green : C.tagBg, color: tab === t.id ? "#fff" : C.sub, transition: "all 0.15s", whiteSpace: "nowrap"
          }}>{t.label}</button>
        ))}
      </div>

      {tab === "calendar" && (
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 4 }}>
            {DAYS.map((d, i) => (
              <button key={d} onClick={() => setActiveDay(i)} style={{
                padding: "6px 12px", borderRadius: 6, border: activeDay === i ? `2px solid ${C.green}` : `1px solid ${C.border}`,
                fontSize: 12, fontWeight: activeDay === i ? 600 : 400, cursor: "pointer", whiteSpace: "nowrap",
                background: weekPlan[i].fish ? (activeDay === i ? C.fishBg : "#F0FDFA") : (activeDay === i ? C.greenLight : C.card),
                color: activeDay === i ? (weekPlan[i].fish ? C.fish : C.green) : C.sub,
              }}>{d.slice(0, 3)}{weekPlan[i].fish ? " 🐟" : ""}</button>
            ))}
          </div>

          <DayCard plan={weekPlan[activeDay]} isActive={true} onClick={() => {}} />

          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: C.sub, fontWeight: 500, marginBottom: 8 }}>Other days (tap to switch)</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {weekPlan.map((p, i) => i !== activeDay && <DayCard key={p.day} plan={p} isActive={false} onClick={() => setActiveDay(i)} />)}
            </div>
          </div>
        </div>
      )}

      {tab === "ordering" && (
        <div>
          <p style={{ fontSize: 13, color: C.sub, marginBottom: 14, lineHeight: 1.5 }}>
            These ordering rules will make the biggest difference. Print these or screenshot them — they're your cheat sheet when staring at a menu.
          </p>
          {orderingTips.map((t, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ fontSize: 14, color: C.green, fontWeight: 700, minWidth: 20 }}>{i + 1}.</span>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: C.text, lineHeight: 1.4 }}>{t.tip}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
                    <Tag label={t.impact} />
                    <span style={{ fontSize: 12, color: C.sub }}>→ {t.example}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "grocery" && (
        <div>
          <p style={{ fontSize: 13, color: C.sub, marginBottom: 6, lineHeight: 1.5 }}>
            This is the only "cooking" you need — soaking almonds at night and keeping snacks at your desk. Order everything once via BigBasket/Zepto/DMart.
          </p>
          <div style={{ background: C.amberLight, borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 12.5, color: C.amber, lineHeight: 1.5 }}>
            <strong>Sunday ritual (15 min):</strong> Boil 6 eggs for the week. Portion out almonds + walnuts into a small box for each day. Refill your desk makhana/chana jar. That's it.
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 65px", padding: "10px 16px", background: C.tagBg, fontSize: 11, fontWeight: 600, color: C.sub }}>
              <span>Item</span><span>Frequency</span><span>Cost</span>
            </div>
            {groceryList.map((g, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 70px 65px", padding: "10px 16px", borderBottom: i < groceryList.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "start" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{g.item}</div>
                  <div style={{ fontSize: 11, color: C.sub }}>{g.note}</div>
                </div>
                <span style={{ fontSize: 11.5, color: C.sub }}>{g.freq}</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: C.green }}>{g.cost}</span>
              </div>
            ))}
            <div style={{ padding: "12px 16px", background: C.greenLight, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1B4332" }}>Estimated monthly grocery</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.green }}>~₹1,800–2,200</span>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 20, padding: "14px 18px", background: "#F7F6F3", borderRadius: 12, fontSize: 12, color: C.sub, lineHeight: 1.6 }}>
        <strong style={{ color: C.text }}>Non-negotiables — even with outside food:</strong>
        <div style={{ marginTop: 6 }}>☀️ 15 min morning sunlight (7–9 AM) before heading to office — walk, don't cab</div>
        <div style={{ marginTop: 3 }}>🥚 2 eggs every single day — this is your primary B12 source</div>
        <div style={{ marginTop: 3 }}>🐟 Fish 3 days a week (Tue/Thu/Sat) — your HDL depends on it</div>
        <div style={{ marginTop: 3 }}>💧 3L water daily — keep a bottle at your desk, refill 3 times</div>
        <div style={{ marginTop: 3 }}>😴 Dinner by 8 PM, sleep by 10:30 PM — this alone can fix your HbA1c</div>
        <div style={{ marginTop: 3 }}>💊 Doctor visit this week for Vit D + B12 supplements — diet alone won't recover these</div>
        <div style={{ marginTop: 10, fontStyle: "italic", fontSize: 11, color: "#9CA3AF" }}>
          This plan is informational and not medical advice. Please consult your doctor for supplementation.
        </div>
      </div>
    </div>
  );
}
