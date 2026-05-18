// ============================================================
// Skadi — Schedule Data (All Phases)
// ============================================================

const SCHEDULE_DATA = {

  // ── 1. Notice Period Weekday (May–Jun 2026) ──────────────
  notice_weekday: [
    { time:"06:30–06:50", activity:"Wake, drink water, no phone for 20 min",        duration:0.33, category:"Daily"      },
    { time:"06:50–07:10", activity:"20-minute morning walk",                          duration:0.33, category:"Fitness"    },
    { time:"07:10–07:40", activity:"UPSC — Syllabus read / Laxmikanth light",         duration:0.5,  category:"Learning"   },
    { time:"07:40–08:00", activity:"Breakfast + prep",                                duration:0.33, category:"Break"      },
    { time:"08:00–18:00", activity:"Office — KT, handover, exit with full reputation", duration:10,   category:"Work"       },
    { time:"18:30–19:00", activity:"Cook / prep a simple cholesterol-safe dinner",    duration:0.5,  category:"Daily"      },
    { time:"19:30–20:00", activity:"Book reading (30 min, see books queue)",          duration:0.5,  category:"Hobby"      },
    { time:"20:30–21:00", activity:"Journal 3 lines + plan next day",                 duration:0.5,  category:"Reflection" },
    { time:"21:00–21:30", activity:"Grooming / wind-down — no screens",               duration:0.5,  category:"Daily"      },
    { time:"22:30",       activity:"Sleep — 7 hrs non-negotiable, phone outside room",duration:7,    category:"Health"     }
  ],

  notice_weekend: [
    { time:"07:00–07:30", activity:"Wake, water, light stretch",                      duration:0.5,  category:"Daily"      },
    { time:"07:30–09:00", activity:"UPSC — Laxmikanth or NCERT reading block",        duration:1.5,  category:"Learning"   },
    { time:"09:00–09:30", activity:"Breakfast",                                        duration:0.5,  category:"Break"      },
    { time:"10:00–11:30", activity:"Household chores batch / errands",                 duration:1.5,  category:"Daily"      },
    { time:"12:00–13:00", activity:"Cook + lunch",                                     duration:1,    category:"Break"      },
    { time:"14:00–16:00", activity:"UPSC revision or books reading",                   duration:2,    category:"Learning"   },
    { time:"17:00–18:30", activity:"Family time / outing / rest",                      duration:1.5,  category:"Hobby"      },
    { time:"19:30–20:30", activity:"Dinner + light chores",                            duration:1,    category:"Break"      },
    { time:"21:00–21:30", activity:"Journal + plan next week",                         duration:0.5,  category:"Reflection" },
    { time:"22:30",       activity:"Sleep",                                             duration:7.5,  category:"Health"     }
  ],

  // ── 2. Dubai Settle Weekday (Jul–Sep 2026) ───────────────
  settle_weekday: [
    { time:"05:30–06:00", activity:"Wake, water, quick freshen up — no phone",        duration:0.5,  category:"Daily"      },
    { time:"06:00–07:00", activity:"Morning walk or gym (start Day 3, not Day 10!)",  duration:1,    category:"Fitness"    },
    { time:"07:00–07:30", activity:"Breakfast — Indian home-cooked meal",             duration:0.5,  category:"Break"      },
    { time:"07:30–08:30", activity:"Commute + settle in",                              duration:1,    category:"Daily"      },
    { time:"08:30–18:30", activity:"Emirates NBD — onboard, build relationships, deliver", duration:10, category:"Work"   },
    { time:"18:45–19:15", activity:"Walk outside — no phone, decompression ritual",   duration:0.5,  category:"Fitness"    },
    { time:"19:15–20:00", activity:"Cook Indian dinner (cholesterol-safe)",            duration:0.75, category:"Daily"      },
    { time:"20:00–20:30", activity:"DevOps/AI reading — 3–4 days/week",               duration:0.5,  category:"Learning"   },
    { time:"20:30–21:00", activity:"Book reading (from Books Queue)",                  duration:0.5,  category:"Hobby"      },
    { time:"21:00–21:30", activity:"Pastime check-in + journal if needed",            duration:0.5,  category:"Mind"       },
    { time:"21:30–22:15", activity:"Wind down — no screens, light stretch",           duration:0.75, category:"Daily"      },
    { time:"22:30",       activity:"Sleep — 7 hrs. Everything depends on this.",       duration:7,    category:"Health"     }
  ],

  settle_weekend: [
    { time:"06:00–07:00", activity:"Longer walk or outdoor time — mental reset",      duration:1,    category:"Fitness"    },
    { time:"07:00–07:30", activity:"Breakfast",                                        duration:0.5,  category:"Break"      },
    { time:"08:00–10:00", activity:"Flat search / errands / laundry / groceries",     duration:2,    category:"Daily"      },
    { time:"10:00–12:00", activity:"Explore one Dubai area — Metro adventure",        duration:2,    category:"Hobby"      },
    { time:"12:00–14:00", activity:"Cook proper Indian meal + rest / power nap",      duration:2,    category:"Break"      },
    { time:"15:00–17:00", activity:"DevOps reading or Unacademy orientation (no study pressure)", duration:2, category:"Learning" },
    { time:"18:00–19:00", activity:"📞 Video call — parents (every Saturday)",        duration:1,    category:"Mind"       },
    { time:"19:00–21:00", activity:"Free — movie, read, social if available",         duration:2,    category:"Hobby"      },
    { time:"21:30–22:00", activity:"Journal — what is working (not just what isn't)", duration:0.5,  category:"Reflection" },
    { time:"22:30",       activity:"Sleep",                                             duration:7.5,  category:"Health"     }
  ],

  // ── 3. Dubai Foundation Weekday (Oct 2026–Mar 2027) ─────
  dubai_weekday: [
    { time:"05:30–05:35", activity:"Wake. Drink water. No phone.",                     duration:0.08, category:"Daily"      },
    { time:"05:35–05:45", activity:"4-7-8 breathing + intention setting (3 min each)", duration:0.17, category:"Mind"       },
    { time:"05:45–07:15", activity:"⭐ UPSC Study — Unacademy / notes (core block)",   duration:1.5,  category:"Learning"   },
    { time:"07:15–08:00", activity:"Gym / walk + shower",                              duration:0.75, category:"Fitness"    },
    { time:"08:00–08:30", activity:"Breakfast + The Hindu audio editorial",            duration:0.5,  category:"Break"      },
    { time:"09:00–18:30", activity:"Emirates NBD — full professional focus",           duration:9.5,  category:"Work"       },
    { time:"18:45–19:15", activity:"Walk outside — no phone, brain decompression",    duration:0.5,  category:"Fitness"    },
    { time:"19:15–20:00", activity:"Cook + eat dinner (Indian, low oil)",              duration:0.75, category:"Daily"      },
    { time:"20:00–20:30", activity:"DevOps / AI reading — 3–4 days/week",             duration:0.5,  category:"Learning"   },
    { time:"20:30–21:00", activity:"Book 10 pages OR gratitude journal",               duration:0.5,  category:"Hobby"      },
    { time:"21:00–21:30", activity:"Pastime check — log in Mind tab if needed",        duration:0.5,  category:"Mind"       },
    { time:"21:30–22:15", activity:"Wind down — no screens, light stretch",           duration:0.75, category:"Daily"      },
    { time:"22:30",       activity:"Sleep — 7 hrs. Non-negotiable.",                  duration:7,    category:"Health"     }
  ],

  dubai_saturday: [
    { time:"06:00–07:00", activity:"Longer walk or outdoor time — mental reset",      duration:1,    category:"Fitness"    },
    { time:"07:30–11:30", activity:"⭐ UPSC — 4 hrs: revision, mocks, notes + Soc",  duration:4,    category:"Learning"   },
    { time:"12:00–14:00", activity:"Cook proper Indian meal + rest / power nap",      duration:2,    category:"Break"      },
    { time:"15:00–17:00", activity:"Explore Dubai / errands / laundry / groceries",   duration:2,    category:"Daily"      },
    { time:"18:00–19:00", activity:"📞 Video call — parents (non-negotiable)",        duration:1,    category:"Mind"       },
    { time:"19:00–21:00", activity:"Free — movie, read, social if available",         duration:2,    category:"Hobby"      },
    { time:"21:30–22:00", activity:"Weekly review (20 min, see Reviews tab)",         duration:0.5,  category:"Reflection" },
    { time:"22:30",       activity:"Sleep",                                             duration:7.5,  category:"Health"     }
  ],

  dubai_sunday: [
    { time:"07:00–07:30", activity:"Wake, slower morning",                             duration:0.5,  category:"Daily"      },
    { time:"08:00–09:30", activity:"UPSC short review (1.5 hrs)",                      duration:1.5,  category:"Learning"   },
    { time:"10:00–11:00", activity:"Walk + laundry / light chores",                    duration:1,    category:"Daily"      },
    { time:"11:00–13:00", activity:"Batch cook meals for the week",                    duration:2,    category:"Daily"      },
    { time:"13:00–14:00", activity:"Lunch + rest",                                     duration:1,    category:"Break"      },
    { time:"14:00–16:00", activity:"DevOps reading / cert prep",                       duration:2,    category:"Learning"   },
    { time:"16:00–18:00", activity:"Free time — book, walk, explore",                  duration:2,    category:"Hobby"      },
    { time:"18:00–18:30", activity:"📞 Call parents if not called Saturday",           duration:0.5,  category:"Mind"       },
    { time:"19:00–20:00", activity:"Dinner + wind down",                               duration:1,    category:"Break"      },
    { time:"21:00–21:30", activity:"Weekly check-in / plan upcoming week",             duration:0.5,  category:"Reflection" },
    { time:"22:30",       activity:"Sleep — same wake time keeps Sunday sleep strong", duration:7,    category:"Health"     }
  ],

  // ── 4. Prelims Sprint Weekday (Apr–May 2027) ─────────────
  sprint_weekday: [
    { time:"05:30–05:45", activity:"Wake, water, breathing + intention",               duration:0.25, category:"Mind"       },
    { time:"05:45–07:45", activity:"⭐ UPSC Mock Test — full 2-hr timed session",     duration:2,    category:"Learning"   },
    { time:"07:45–08:30", activity:"Gym + shower",                                     duration:0.75, category:"Fitness"    },
    { time:"08:30–09:00", activity:"Breakfast + The Hindu scan (headlines only)",      duration:0.5,  category:"Break"      },
    { time:"09:00–18:30", activity:"Emirates NBD — steady, no overload",               duration:9.5,  category:"Work"       },
    { time:"18:45–19:15", activity:"Walk — mental decompression",                      duration:0.5,  category:"Fitness"    },
    { time:"19:15–20:00", activity:"Cook + dinner",                                    duration:0.75, category:"Daily"      },
    { time:"20:00–21:00", activity:"CSAT 30 min + mock analysis 30 min",               duration:1,    category:"Learning"   },
    { time:"21:00–22:00", activity:"Wind down — book, no reels, reduce caffeine",     duration:1,    category:"Hobby"      },
    { time:"22:00",       activity:"Sleep — max sleep mode. Protect this.",            duration:7.5,  category:"Health"     }
  ],

  sprint_weekend: [
    { time:"06:00–07:00", activity:"Walk + breathing — pre-exam calm protocol",        duration:1,    category:"Mind"       },
    { time:"07:30–10:30", activity:"⭐ 3-hr Prelims mock under exam conditions",       duration:3,    category:"Learning"   },
    { time:"10:30–12:00", activity:"Mock analysis — wrong answers + weak areas",       duration:1.5,  category:"Learning"   },
    { time:"12:00–14:00", activity:"Lunch + full rest",                                duration:2,    category:"Break"      },
    { time:"14:00–16:00", activity:"CSAT practice set + CA quick revision",            duration:2,    category:"Learning"   },
    { time:"17:00–18:00", activity:"Walk / light exercise — no screens",               duration:1,    category:"Fitness"    },
    { time:"18:00–19:00", activity:"📞 Video call — parents",                          duration:1,    category:"Mind"       },
    { time:"19:00–21:00", activity:"Light reading / free time",                        duration:2,    category:"Hobby"      },
    { time:"22:00",       activity:"Sleep",                                             duration:7.5,  category:"Health"     }
  ],

  // ── 5. India Full-time (Jul 2027 onwards) ────────────────
  india_weekday: [
    { time:"05:30–05:45", activity:"Wake, water, breathing",                           duration:0.25, category:"Mind"       },
    { time:"05:45–09:45", activity:"⭐ UPSC deep study — primary block (4 hrs)",      duration:4,    category:"Learning"   },
    { time:"09:45–10:30", activity:"Exercise + shower",                                duration:0.75, category:"Fitness"    },
    { time:"10:30–11:00", activity:"Breakfast + The Hindu",                            duration:0.5,  category:"Break"      },
    { time:"11:00–13:30", activity:"UPSC secondary block — notes + revision",         duration:2.5,  category:"Learning"   },
    { time:"13:30–14:30", activity:"Lunch + rest / power nap",                        duration:1,    category:"Break"      },
    { time:"14:30–17:00", activity:"UPSC tertiary block — answer writing / mocks",    duration:2.5,  category:"Learning"   },
    { time:"17:00–18:30", activity:"Walk + family time / errands",                    duration:1.5,  category:"Daily"      },
    { time:"19:00–20:00", activity:"Book reading / DevOps light (keep skills fresh)", duration:1,    category:"Hobby"      },
    { time:"20:00–21:00", activity:"Dinner + journal + mind check-in",                duration:1,    category:"Reflection" },
    { time:"22:00",       activity:"Sleep",                                             duration:7.5,  category:"Health"     }
  ],

  india_weekend: [
    { time:"06:00–07:00", activity:"Longer walk / outdoor reset",                      duration:1,    category:"Fitness"    },
    { time:"07:30–12:00", activity:"⭐ UPSC — deep revision, mocks, essay writing",   duration:4.5,  category:"Learning"   },
    { time:"12:00–14:00", activity:"Lunch + rest",                                     duration:2,    category:"Break"      },
    { time:"14:00–17:00", activity:"UPSC continued — answer writing or Sociology",    duration:3,    category:"Learning"   },
    { time:"17:00–19:00", activity:"Family time / outing",                             duration:2,    category:"Hobby"      },
    { time:"19:00–20:00", activity:"Dinner",                                           duration:1,    category:"Break"      },
    { time:"20:00–21:00", activity:"Weekly review + plan",                             duration:1,    category:"Reflection" },
    { time:"22:00",       activity:"Sleep",                                             duration:7.5,  category:"Health"     }
  ]
};

// Category → color mapping
const CATEGORY_COLORS = {
  Learning:   '#4d79ff',
  Work:       '#a56eff',
  Fitness:    '#00d47c',
  Health:     '#00d4c8',
  Break:      '#ffb230',
  Daily:      '#697098',
  Hobby:      '#ff5c80',
  Mind:       '#00d4c8',
  Reflection: '#a56eff'
};

// Smart navigation: match activity text → description + tab link
// desc = what is expected; navTab = tab to switch to; focusId = element to highlight; logHint = reminder after check
const ACTIVITY_META = [
  {
    match: /sleep/i,
    desc:  'Sleep 7 hrs non-negotiable. Phone stays outside the room.',
    expect:'Log tonight\'s sleep hours in the Health tab before marking done.',
    navTab:'health', focusId:'hSleep',
    logHint:'📝 Log sleep hours in Health tab'
  },
  {
    match: /gym|morning walk|walk or gym|longer walk/i,
    desc:  'Complete your fitness activity — walk, gym, or outdoor time.',
    expect:'Mark Gym Done ✓ in the Health tab.',
    navTab:'health', focusId:'hGym',
    logHint:'🏋️ Mark Gym Done in Health tab'
  },
  {
    match: /upsc|laxmikanth|ncert|unacademy|revision|mocks/i,
    desc:  'Study session from the UPSC schedule. Use Unacademy or notes.',
    expect:'Update class progress in the UPSC tab under Subject Progress.',
    navTab:'upsc', focusId:'upscSubjectsGrid',
    logHint:'📚 Update UPSC class progress in UPSC tab'
  },
  {
    match: /book reading|books queue|book 10 pages/i,
    desc:  'Read from the current month\'s book (see Growth → Books Queue).',
    expect:'Log pages read in Growth → Books Queue.',
    navTab:'growth', focusId:'booksContainer',
    logHint:'📖 Log pages read in Growth → Books'
  },
  {
    match: /pastime check|mind check|journal|check-in.*mind/i,
    desc:  'Daily Pastime check-in. Log your status in the Mind tab.',
    expect:'Log your check-in in the Mind tab.',
    navTab:'mind', focusId:'mindTodayForm',
    logHint:'🧠 Log Mind check-in'
  },
  {
    match: /parents|video call.*parent/i,
    desc:  'Scheduled call with parents — non-negotiable Saturday ritual.',
    expect:'Log the call in Mind → Parents tracking after you hang up.',
    navTab:'mind', focusId:'mParents',
    logHint:'☎️ Log parents call in Mind tab'
  },
  {
    match: /ca reading|current affairs/i,
    desc:  'Read current affairs — newspaper or Unacademy CA module.',
    expect:'Mark CA Reading Done ✓ in the Health tab.',
    navTab:'health', focusId:'hCA',
    logHint:'📰 Mark CA Done in Health tab'
  },
  {
    match: /journal|plan next day|plan next week/i,
    desc:  'Write 3 lines in your journal and plan tomorrow\'s priorities.',
    expect:'No log needed — just check this off after writing.',
    navTab: null
  },
  {
    match: /devops|ai reading|cert prep/i,
    desc:  'Read DevOps / AI articles or work on certification prep.',
    expect:'No log needed — mark done after reading.',
    navTab: null
  },
  {
    match: /weekly review/i,
    desc:  'Complete the Sunday weekly review — 10 questions, 1–5 score each.',
    expect:'Fill in the Weekly Review form in the Growth tab.',
    navTab:'growth', focusId:'weeklyReviewForm',
    logHint:'📋 Complete Weekly Review in Growth tab'
  },
  {
    match: /cholesterol|dinner/i,
    desc:  'Cook a simple, cholesterol-safe Indian meal — low oil, high fibre.',
    expect:'No log needed. If you had a cheat meal, note it in Health → Cholesterol.',
    navTab: null
  }
];

// ── Scheduler ──────────────────────────────────────────────
const Scheduler = {

  renderSchedule(scheduleKey, containerId) {
    const schedule = SCHEDULE_DATA[scheduleKey];
    const container = document.getElementById(containerId);
    const dateKey = AppState.getDateKey();

    if (!container) { console.error(`Container #${containerId} not found`); return; }
    if (!schedule)  { container.innerHTML = `<div class="empty-state">No schedule defined for key: ${scheduleKey}</div>`; return; }

    container.innerHTML = '';

    schedule.forEach((item, index) => {
      const key       = `${dateKey}-${index}`;
      const isChecked = AppState.checkedItems[key] || false;
      const color     = CATEGORY_COLORS[item.category] || '#697098';
      const meta      = ACTIVITY_META.find(m => m.match.test(item.activity));

      const slot = document.createElement('div');
      slot.className = `time-slot${isChecked ? ' completed' : ''}`;

      const navBtn = meta?.navTab
        ? `<button class="slot-nav-btn" data-tab="${meta.navTab}" data-focus="${meta.focusId || ''}"
              title="Go to ${meta.navTab} tab" style="
              background:none;border:none;cursor:pointer;padding:2px 6px;
              border-radius:4px;font-size:11px;color:${color};opacity:0.7;
              border:1px solid ${color}44;white-space:nowrap;margin-top:4px;
              font-family:inherit;display:inline-flex;align-items:center;gap:4px;">
              ↗ ${meta.navTab.charAt(0).toUpperCase()+meta.navTab.slice(1)}
           </button>`
        : '';

      const descHtml = meta
        ? `<div class="slot-desc" style="font-size:11px;color:var(--text-muted);margin-top:4px;line-height:1.5;">
             ${meta.desc}${navBtn ? '<br>' + navBtn : ''}
           </div>`
        : '';

      slot.innerHTML = `
        <div class="slot-accent" style="background:${color}"></div>
        <div class="slot-time">${item.time}</div>
        <div class="slot-body">
          <div class="slot-activity">${item.activity}</div>
          <div class="slot-meta">
            <span class="slot-cat" style="color:${color}">${item.category}</span>
            <span class="slot-dur">${item.duration < 1 ? Math.round(item.duration*60)+'m' : item.duration+'h'}</span>
          </div>
          ${descHtml}
        </div>
        <label class="slot-check">
          <input type="checkbox" ${isChecked ? 'checked' : ''} data-key="${key}" data-index="${index}">
          <span class="checkmark"></span>
        </label>`;

      // Checkbox: for navTab activities, block and navigate; otherwise toggle normally
      const cb = slot.querySelector('input[type=checkbox]');
      cb.addEventListener('change', e => {
        if (e.target.checked && meta?.navTab) {
          // Prevent the check — user must log data first
          e.target.checked = false;

          if (typeof UI !== 'undefined') {
            // Store pending state
            UI.setPendingActivity({ key, scheduleKey, activityName: item.activity, meta, cb });

            // Navigate to the relevant tab
            UI._setActiveTab(meta.navTab);
            UI._renderTab(meta.navTab);

            // Scroll to / focus the target element
            if (meta.focusId) {
              setTimeout(() => {
                const el = document.getElementById(meta.focusId);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  if (typeof el.focus === 'function') el.focus();
                  el.style.transition = 'box-shadow 0.3s';
                  el.style.boxShadow  = '0 0 0 3px var(--accent-green)';
                  setTimeout(() => { el.style.boxShadow = ''; }, 2500);
                }
              }, 250);
            }
          }
          return;
        }

        // Normal toggle (no navTab, or unchecking)
        AppState.toggleActivity(key, e.target.checked);
        slot.classList.toggle('completed', e.target.checked);
        this.updateProgress(scheduleKey);
      });

      // Nav button: switch tab + highlight target
      const navBtnEl = slot.querySelector('.slot-nav-btn');
      if (navBtnEl) {
        navBtnEl.addEventListener('click', e => {
          e.preventDefault();
          const tab = navBtnEl.dataset.tab;
          const focusId = navBtnEl.dataset.focus;
          if (typeof UI !== 'undefined') {
            UI._setActiveTab(tab);
            UI._renderTab(tab);
            if (focusId) {
              setTimeout(() => {
                const el = document.getElementById(focusId);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  if (el.focus) el.focus();
                  // Brief highlight pulse
                  el.style.transition = 'box-shadow 0.3s';
                  el.style.boxShadow = `0 0 0 3px var(--accent-blue)`;
                  setTimeout(() => { el.style.boxShadow = ''; }, 2000);
                }
              }, 200);
            }
          }
        });
      }

      container.appendChild(slot);
    });

    this.updateProgress(scheduleKey);
  },

  updateProgress(scheduleKey) {
    const sched   = SCHEDULE_DATA[scheduleKey];
    if (!sched) return;
    const dateKey = AppState.getDateKey();

    let completed = 0;
    let doneHours = 0;

    sched.forEach((item, i) => {
      const key = `${dateKey}-${i}`;
      if (AppState.checkedItems[key]) { completed++; doneHours += item.duration; }
    });

    const total      = sched.length;
    const pct        = total > 0 ? Math.round((completed / total) * 100) : 0;
    const remaining  = total - completed;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    const setW = (id, w) => { const el = document.getElementById(id); if (el) el.style.width = w + '%'; };

    set('progressPct', pct + '%');
    set('completedCount', completed);
    set('completedCount2', completed);
    set('totalCount', total);
    set('totalCount2', total);
    set('remainingCount', remaining);
    set('completedHours', doneHours.toFixed(1) + 'h');
    setW('progressBar', pct);

    AppState.setDailyHistory(dateKey, completed, total);
  },

  resetToday() {
    const dateKey = AppState.getDateKey();
    const scheduleKey = AppState.getScheduleKey();
    const sched = SCHEDULE_DATA[scheduleKey];
    if (!sched) return;

    sched.forEach((_, i) => delete AppState.checkedItems[`${dateKey}-${i}`]);
    AppState.save();
    this.renderSchedule(scheduleKey, 'scheduleContainer');
  }
};
