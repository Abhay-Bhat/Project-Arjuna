// ============================================================
// Skadi — Schedule Data (Unified Daily Routine)
// Weekday = office days (Mon–Fri), Weekend = study days (Sat–Sun).
// Holiday toggle flips: weekday holiday → weekend schedule, and vice versa.
// ============================================================

const SCHEDULE_DATA = {

  weekday: [
    { time:"06:30",       activity:"Wake up",                                             duration:0,    category:"Daily"      },
    { time:"06:30–06:45", activity:"Freshen up",                                          duration:0.25, category:"Daily"      },
    { time:"06:45–07:00", activity:"Sunlight + light stretch",                            duration:0.25, category:"Fitness"    },
    { time:"07:00–07:10", activity:"Meditation",                                          duration:0.17, category:"Mind"       },
    { time:"07:10–07:30", activity:"Newspaper / current affairs",                         duration:0.33, category:"Learning"   },
    { time:"07:30–07:40", activity:"Day planning (top 3 priorities)",                     duration:0.17, category:"Reflection" },
    { time:"07:40–08:10", activity:"Breakfast + Medicines",                               duration:0.5,  category:"Break"      },
    { time:"08:10–08:30", activity:"Get ready",                                           duration:0.33, category:"Daily"      },
    { time:"08:30–09:30", activity:"Commute to office",                                   duration:1,    category:"Daily"      },
    { time:"09:30–12:30", activity:"Office work",                                         duration:3,    category:"Work"       },
    { time:"12:30–13:15", activity:"Lunch",                                               duration:0.75, category:"Break"      },
    { time:"13:15–17:00", activity:"Office work",                                         duration:3.75, category:"Work"       },
    { time:"17:00–18:00", activity:"Commute home",                                        duration:1,    category:"Daily"      },
    { time:"18:00–18:30", activity:"Decompress (change, water, sit)",                     duration:0.5,  category:"Break"      },
    { time:"18:30–19:15", activity:"Technical upskilling",                                duration:0.75, category:"Learning"   },
    { time:"19:15–19:30", activity:"Job application / LinkedIn",                          duration:0.25, category:"Work"       },
    { time:"19:30–20:15", activity:"Dinner + Medicines",                                  duration:0.75, category:"Break"      },
    { time:"20:15–20:45", activity:"Exercise / walk",                                     duration:0.5,  category:"Fitness"    },
    { time:"20:45–21:15", activity:"Light UPSC revision",                                 duration:0.5,  category:"Learning"   },
    { time:"21:15–22:00", activity:"Family/friends/personal",                             duration:0.75, category:"Hobby"      },
    { time:"22:00–22:30", activity:"Wind down, screens off",                              duration:0.5,  category:"Daily"      },
    { time:"22:30",       activity:"Sleep",                                               duration:8,    category:"Health"     }
  ],

  weekend: [
    { time:"06:30",       activity:"Wake up",                                             duration:0,    category:"Daily"      },
    { time:"06:30–06:45", activity:"Freshen up",                                          duration:0.25, category:"Daily"      },
    { time:"06:45–07:00", activity:"Sunlight + light stretch",                            duration:0.25, category:"Fitness"    },
    { time:"07:00–07:10", activity:"Meditation",                                          duration:0.17, category:"Mind"       },
    { time:"07:10–07:30", activity:"Newspaper / current affairs",                         duration:0.33, category:"Learning"   },
    { time:"07:30–07:40", activity:"Day planning (top 3 priorities)",                     duration:0.17, category:"Reflection" },
    { time:"07:40–08:10", activity:"Breakfast + Medicines",                               duration:0.5,  category:"Break"      },
    { time:"08:10–08:30", activity:"Get ready",                                           duration:0.33, category:"Daily"      },
    { time:"08:30–09:30", activity:"Study Block 1",                                       duration:1,    category:"Learning"   },
    { time:"09:30–12:30", activity:"Study Block 2",                                       duration:3,    category:"Learning"   },
    { time:"12:30–13:15", activity:"Lunch",                                               duration:0.75, category:"Break"      },
    { time:"13:15–17:00", activity:"Study Block 3",                                       duration:3.75, category:"Learning"   },
    { time:"17:00–18:00", activity:"Break / errands",                                     duration:1,    category:"Break"      },
    { time:"18:00–18:30", activity:"Decompress (change, water, sit)",                     duration:0.5,  category:"Break"      },
    { time:"18:30–19:15", activity:"Technical upskilling",                                duration:0.75, category:"Learning"   },
    { time:"19:15–19:30", activity:"Job application / LinkedIn",                          duration:0.25, category:"Work"       },
    { time:"19:30–20:15", activity:"Dinner + Medicines",                                  duration:0.75, category:"Break"      },
    { time:"20:15–20:45", activity:"Exercise / walk",                                     duration:0.5,  category:"Fitness"    },
    { time:"20:45–21:15", activity:"Light UPSC revision",                                 duration:0.5,  category:"Learning"   },
    { time:"21:15–22:00", activity:"Family/friends/personal",                             duration:0.75, category:"Hobby"      },
    { time:"22:00–22:30", activity:"Wind down, screens off",                              duration:0.5,  category:"Daily"      },
    { time:"22:30",       activity:"Sleep",                                               duration:8,    category:"Health"     }
  ]
};

const CATEGORY_COLORS = {
  Learning:   '#0ea5e9',
  Work:       '#64748b',
  Fitness:    '#00d47c',
  Health:     '#00d4c8',
  Break:      '#ffb230',
  Daily:      '#697098',
  Hobby:      '#ff5c80',
  Mind:       '#00d4c8',
  Reflection: '#a78bfa'
};

const ACTIVITY_META = [
  {
    match: /sleep/i,
    desc:  'Sleep 8h non-negotiable. Phone stays outside the room.',
    expect:'Log tonight\'s sleep hours in the Health tab before marking done.',
    navTab:'health', focusId:'hSleep',
    logHint:'Log sleep hours in Health tab'
  },
  {
    match: /exercise|walk|stretch/i,
    desc:  '30 min/day — walk, gym, or outdoor time. Protected floor.',
    expect:'Mark Gym Done in the Health tab.',
    navTab:'health', focusId:'hGym',
    logHint:'Mark Gym Done in Health tab'
  },
  {
    match: /upsc|revision|mocks|study block/i,
    desc:  'Study session from the UPSC schedule.',
    expect:'Update class progress in the UPSC tab under Subject Progress.',
    navTab:'upsc', focusId:'upscSubjectsGrid',
    logHint:'Update UPSC class progress'
  },
  {
    match: /tech|upskilling|docker|k8s|cka|openshift|jenkins|argocd|terraform|aws|python|istio|prometheus|vault|system design|genai|psm/i,
    desc:  'Tech upskilling session — follow the 76-week plan.',
    expect:'Log progress in Growth tab.',
    navTab:'growth', focusId:'techStudyModeToggle',
    logHint:'Log tech study in Growth tab'
  },
  {
    match: /current affairs|newspaper/i,
    desc:  'Read current affairs — newspaper or Unacademy CA module.',
    expect:'Log your CA reading in the UPSC tab under Current Affairs.',
    navTab:'upsc', focusId:'caTitle',
    logHint:'Log CA reading in UPSC tab'
  },
  {
    match: /meditation/i,
    desc:  'Morning meditation — clear the mind before the day starts.',
    expect:'No log needed — check off after completing.',
    navTab: null
  },
  {
    match: /day planning/i,
    desc:  'Plan top 3 priorities for the day.',
    expect:'No log needed — check off after planning.',
    navTab: null
  },
  {
    match: /job application|linkedin/i,
    desc:  'Apply to roles or update LinkedIn profile.',
    expect:'No log needed — check off after completing.',
    navTab: null
  },
  {
    match: /family|friends|personal/i,
    desc:  'Quality time with family and friends.',
    expect:'No log needed — check off after spending time.',
    navTab: null
  },
  {
    match: /dinner|breakfast|lunch/i,
    desc:  'Meal time — cholesterol-safe, low oil, high fibre.',
    expect:'No log needed.',
    navTab: null
  }
];

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

      const cb = slot.querySelector('input[type=checkbox]');
      cb.addEventListener('change', e => {
        if (e.target.checked && meta?.navTab) {
          e.target.checked = false;

          if (typeof UI !== 'undefined') {
            const ctx = { key, scheduleKey, activityName: item.activity, meta, cb };
            // Inline quick-log first — the data lands in AppState so the
            // target tab shows it. Falls back to tab navigation for
            // activities without a quick-log form.
            if (UI.openQuickLog(ctx)) return;
            UI.setPendingActivity(ctx);
            UI._setActiveTab(meta.navTab);
            UI._renderTab(meta.navTab);

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

        AppState.toggleActivity(key, e.target.checked);
        slot.classList.toggle('completed', e.target.checked);
        this.updateProgress(scheduleKey);
      });

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

    if (pct === 100 && total > 0) {
      const card = document.getElementById('progressBar')?.closest('.stat-card, .pane-card');
      if (card && !card.classList.contains('celebrating')) {
        card.classList.add('celebrating');
        setTimeout(() => card.classList.remove('celebrating'), 2500);
      }
    }

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
