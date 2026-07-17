// ============================================================
// Skadi — Schedule Data (Routine v4 — Integrated Master Plan)
// Ramp stages 1–4 (Wk 1–8) + Sustained (Wk 9+)
// ============================================================

const SCHEDULE_DATA = {

  // ══════════════════════════════════════════════════════════
  // STAGE 1 — Days 1–2 (Jul 13–14, 2026) — cut short by an 11-week
  // interview-prep sprint (Jul 15–Sep 30, 2026, see js/phases.js),
  // during which UPSC is fully paused. Stage 2 resumes Oct 1, 2026.
  // Evening block 7:15–9:00 PM → UPSC 1h + Tech 45m
  // ══════════════════════════════════════════════════════════

  ramp1_weekday: [
    { time:"06:00",       activity:"Wake",                                              duration:0,    category:"Daily"      },
    { time:"06:00–06:30", activity:"Freshen up",                                        duration:0.5,  category:"Daily"      },
    { time:"06:30–07:00", activity:"Breakfast + household",                             duration:0.5,  category:"Break"      },
    { time:"07:00–08:00", activity:"Commute (current affairs reading on phone)",        duration:1,    category:"Learning"   },
    { time:"08:00–16:15", activity:"Work",                                              duration:8.25, category:"Work"       },
    { time:"16:15–17:15", activity:"Commute home",                                     duration:1,    category:"Daily"      },
    { time:"17:15–17:45", activity:"Exercise",                                          duration:0.5,  category:"Fitness"    },
    { time:"17:45–18:45", activity:"Dinner + household",                                duration:1,    category:"Break"      },
    { time:"18:45–19:05", activity:"Call parents",                                      duration:0.33, category:"Mind"       },
    { time:"19:05–19:15", activity:"Transition",                                        duration:0.17, category:"Daily"      },
    { time:"19:15–20:15", activity:"⭐ UPSC (1h)",                                     duration:1,    category:"Learning"   },
    { time:"20:15–21:00", activity:"Tech study — Docker foundations (45m)",              duration:0.75, category:"Learning"   },
    { time:"21:00–21:10", activity:"Journal",                                           duration:0.17, category:"Reflection" },
    { time:"21:10–23:00", activity:"Wind-down",                                         duration:1.83, category:"Daily"      },
    { time:"23:00",       activity:"Sleep — 7h non-negotiable",                         duration:7,    category:"Health"     }
  ],

  ramp1_saturday: [
    { time:"07:00",       activity:"Wake",                                              duration:0,    category:"Daily"      },
    { time:"07:00–07:30", activity:"Freshen + breakfast",                               duration:0.5,  category:"Break"      },
    { time:"07:30–08:00", activity:"Household",                                         duration:0.5,  category:"Daily"      },
    { time:"08:00–11:00", activity:"⭐ UPSC Block (3h)",                                duration:3,    category:"Learning"   },
    { time:"11:00–13:00", activity:"Tech study — Docker (2h)",                          duration:2,    category:"Learning"   },
    { time:"13:00–14:00", activity:"Lunch + rest",                                      duration:1,    category:"Break"      },
    { time:"14:00 onward",activity:"Personal time",                                     duration:4,    category:"Hobby"      },
    { time:"19:00–19:20", activity:"Call parents",                                      duration:0.33, category:"Mind"       },
    { time:"23:00",       activity:"Sleep",                                             duration:8,    category:"Health"     }
  ],

  ramp1_sunday: [
    { time:"07:00",       activity:"Wake",                                              duration:0,    category:"Daily"      },
    { time:"07:00–07:30", activity:"Freshen + breakfast",                               duration:0.5,  category:"Break"      },
    { time:"07:30–08:00", activity:"Household",                                         duration:0.5,  category:"Daily"      },
    { time:"08:00–11:00", activity:"⭐ UPSC Block (3h)",                                duration:3,    category:"Learning"   },
    { time:"11:00–13:00", activity:"Tech study — Docker (2h)",                          duration:2,    category:"Learning"   },
    { time:"13:00–14:00", activity:"Lunch + rest",                                      duration:1,    category:"Break"      },
    { time:"14:00 onward",activity:"Personal time",                                     duration:4,    category:"Hobby"      },
    { time:"19:00–19:20", activity:"Call parents",                                      duration:0.33, category:"Mind"       },
    { time:"22:30",       activity:"Sleep — protect Monday 6 AM anchor",                duration:7.5,  category:"Health"     }
  ],

  // ══════════════════════════════════════════════════════════
  // STAGE 2 — Weeks 3–4 (Oct 1–14, 2026)
  // Evening block extends to 9:30 PM → UPSC 1.5h + Tech 30m
  // ══════════════════════════════════════════════════════════

  ramp2_weekday: [
    { time:"06:00",       activity:"Wake",                                              duration:0,    category:"Daily"      },
    { time:"06:00–06:30", activity:"Freshen up",                                        duration:0.5,  category:"Daily"      },
    { time:"06:30–07:00", activity:"Breakfast + household",                             duration:0.5,  category:"Break"      },
    { time:"07:00–08:00", activity:"Commute (current affairs reading)",                 duration:1,    category:"Learning"   },
    { time:"08:00–16:15", activity:"Work",                                              duration:8.25, category:"Work"       },
    { time:"16:15–17:15", activity:"Commute home",                                     duration:1,    category:"Daily"      },
    { time:"17:15–17:45", activity:"Exercise",                                          duration:0.5,  category:"Fitness"    },
    { time:"17:45–18:45", activity:"Dinner + household",                                duration:1,    category:"Break"      },
    { time:"18:45–19:05", activity:"Call parents",                                      duration:0.33, category:"Mind"       },
    { time:"19:05–19:15", activity:"Transition",                                        duration:0.17, category:"Daily"      },
    { time:"19:15–20:45", activity:"⭐ UPSC (1.5h)",                                   duration:1.5,  category:"Learning"   },
    { time:"20:50–21:20", activity:"Tech study — Docker/K8s (30m)",                     duration:0.5,  category:"Learning"   },
    { time:"21:20–21:30", activity:"Journal",                                           duration:0.17, category:"Reflection" },
    { time:"21:30–23:00", activity:"Wind-down",                                         duration:1.5,  category:"Daily"      },
    { time:"23:00",       activity:"Sleep — 7h non-negotiable",                         duration:7,    category:"Health"     }
  ],

  ramp2_saturday: [
    { time:"07:00",       activity:"Wake",                                              duration:0,    category:"Daily"      },
    { time:"07:00–07:30", activity:"Freshen + breakfast",                               duration:0.5,  category:"Break"      },
    { time:"07:30–08:00", activity:"Household",                                         duration:0.5,  category:"Daily"      },
    { time:"08:00–12:45", activity:"⭐ UPSC Block (4.75h)",                             duration:4.75, category:"Learning"   },
    { time:"12:45–13:45", activity:"Lunch + rest",                                      duration:1,    category:"Break"      },
    { time:"13:45–15:15", activity:"Tech study — Docker/K8s (1.5h)",                    duration:1.5,  category:"Learning"   },
    { time:"15:15–16:15", activity:"Break / errands",                                   duration:1,    category:"Daily"      },
    { time:"16:15 onward",activity:"Personal time",                                     duration:3,    category:"Hobby"      },
    { time:"19:00–19:20", activity:"Call parents",                                      duration:0.33, category:"Mind"       },
    { time:"23:00",       activity:"Sleep",                                             duration:8,    category:"Health"     }
  ],

  ramp2_sunday: [
    { time:"07:00",       activity:"Wake",                                              duration:0,    category:"Daily"      },
    { time:"07:00–07:30", activity:"Freshen + breakfast",                               duration:0.5,  category:"Break"      },
    { time:"07:30–08:00", activity:"Household",                                         duration:0.5,  category:"Daily"      },
    { time:"08:00–12:45", activity:"⭐ UPSC Block (4.75h)",                             duration:4.75, category:"Learning"   },
    { time:"12:45–13:45", activity:"Lunch + rest",                                      duration:1,    category:"Break"      },
    { time:"13:45–15:15", activity:"Tech study (1.5h)",                                 duration:1.5,  category:"Learning"   },
    { time:"15:15–16:15", activity:"Break",                                             duration:1,    category:"Daily"      },
    { time:"16:15 onward",activity:"Personal time",                                     duration:3,    category:"Hobby"      },
    { time:"19:00–19:20", activity:"Call parents",                                      duration:0.33, category:"Mind"       },
    { time:"22:30",       activity:"Sleep — protect Monday 6 AM anchor",                duration:7.5,  category:"Health"     }
  ],

  // ══════════════════════════════════════════════════════════
  // STAGE 3 — Weeks 5–6 (Oct 15–28, 2026)
  // Evening to 9:55 PM → UPSC 2h + Tech 30m
  // ══════════════════════════════════════════════════════════

  ramp3_weekday: [
    { time:"06:00",       activity:"Wake",                                              duration:0,    category:"Daily"      },
    { time:"06:00–06:30", activity:"Freshen up",                                        duration:0.5,  category:"Daily"      },
    { time:"06:30–07:00", activity:"Breakfast + household",                             duration:0.5,  category:"Break"      },
    { time:"07:00–08:00", activity:"Commute (current affairs reading)",                 duration:1,    category:"Learning"   },
    { time:"08:00–16:15", activity:"Work",                                              duration:8.25, category:"Work"       },
    { time:"16:15–17:15", activity:"Commute home",                                     duration:1,    category:"Daily"      },
    { time:"17:15–17:45", activity:"Exercise",                                          duration:0.5,  category:"Fitness"    },
    { time:"17:45–18:45", activity:"Dinner + household",                                duration:1,    category:"Break"      },
    { time:"18:45–19:05", activity:"Call parents",                                      duration:0.33, category:"Mind"       },
    { time:"19:05–19:15", activity:"Transition",                                        duration:0.17, category:"Daily"      },
    { time:"19:15–21:15", activity:"⭐ UPSC (2h)",                                     duration:2,    category:"Learning"   },
    { time:"21:20–21:50", activity:"Tech study — K8s/CKA (30m)",                        duration:0.5,  category:"Learning"   },
    { time:"22:00–23:00", activity:"Wind-down",                                         duration:1,    category:"Daily"      },
    { time:"23:00",       activity:"Sleep — 7h non-negotiable",                         duration:7,    category:"Health"     }
  ],

  ramp3_saturday: [
    { time:"07:00",       activity:"Wake",                                              duration:0,    category:"Daily"      },
    { time:"07:00–07:30", activity:"Freshen + breakfast",                               duration:0.5,  category:"Break"      },
    { time:"07:30–08:00", activity:"Household",                                         duration:0.5,  category:"Daily"      },
    { time:"08:00–10:00", activity:"⭐ UPSC Block 1 (2h)",                              duration:2,    category:"Learning"   },
    { time:"10:00–10:15", activity:"Break",                                             duration:0.25, category:"Break"      },
    { time:"10:15–12:45", activity:"⭐ UPSC Block 2 (2.5h)",                            duration:2.5,  category:"Learning"   },
    { time:"12:45–13:00", activity:"Break",                                             duration:0.25, category:"Break"      },
    { time:"13:00–15:00", activity:"⭐ UPSC Block 3 (2h)",                              duration:2,    category:"Learning"   },
    { time:"15:00–16:00", activity:"Lunch + rest",                                      duration:1,    category:"Break"      },
    { time:"16:00–17:00", activity:"Tech study — K8s/CKA (1h)",                         duration:1,    category:"Learning"   },
    { time:"17:00–17:30", activity:"Exercise",                                          duration:0.5,  category:"Fitness"    },
    { time:"17:30 onward",activity:"Personal time",                                     duration:3,    category:"Hobby"      },
    { time:"19:00–19:20", activity:"Call parents",                                      duration:0.33, category:"Mind"       },
    { time:"23:00",       activity:"Sleep",                                             duration:8,    category:"Health"     }
  ],

  ramp3_sunday: [
    { time:"07:00",       activity:"Wake",                                              duration:0,    category:"Daily"      },
    { time:"07:00–07:30", activity:"Freshen + breakfast",                               duration:0.5,  category:"Break"      },
    { time:"07:30–08:00", activity:"Household",                                         duration:0.5,  category:"Daily"      },
    { time:"08:00–10:00", activity:"⭐ UPSC Block 1 (2h)",                              duration:2,    category:"Learning"   },
    { time:"10:00–10:15", activity:"Break",                                             duration:0.25, category:"Break"      },
    { time:"10:15–12:45", activity:"⭐ UPSC Block 2 (2.5h)",                            duration:2.5,  category:"Learning"   },
    { time:"12:45–13:00", activity:"Break",                                             duration:0.25, category:"Break"      },
    { time:"13:00–15:00", activity:"⭐ UPSC Block 3 (2h)",                              duration:2,    category:"Learning"   },
    { time:"15:00–16:00", activity:"Lunch + rest",                                      duration:1,    category:"Break"      },
    { time:"16:00–17:00", activity:"Tech study (1h)",                                   duration:1,    category:"Learning"   },
    { time:"17:00–17:30", activity:"Exercise",                                          duration:0.5,  category:"Fitness"    },
    { time:"17:30 onward",activity:"Personal time",                                     duration:3,    category:"Hobby"      },
    { time:"19:00–19:20", activity:"Call parents",                                      duration:0.33, category:"Mind"       },
    { time:"22:30",       activity:"Sleep — protect Monday 6 AM anchor",                duration:7.5,  category:"Health"     }
  ],

  // ══════════════════════════════════════════════════════════
  // STAGE 4 — Weeks 7–8 (Oct 29–Nov 11, 2026)
  // Evening to 10:15 PM → UPSC 2.5h + Tech 30m
  // ══════════════════════════════════════════════════════════

  ramp4_weekday: [
    { time:"06:00",       activity:"Wake",                                              duration:0,    category:"Daily"      },
    { time:"06:00–06:30", activity:"Freshen up",                                        duration:0.5,  category:"Daily"      },
    { time:"06:30–07:00", activity:"Breakfast + household",                             duration:0.5,  category:"Break"      },
    { time:"07:00–08:00", activity:"Commute (current affairs reading)",                 duration:1,    category:"Learning"   },
    { time:"08:00–16:15", activity:"Work",                                              duration:8.25, category:"Work"       },
    { time:"16:15–17:15", activity:"Commute home",                                     duration:1,    category:"Daily"      },
    { time:"17:15–17:45", activity:"Exercise",                                          duration:0.5,  category:"Fitness"    },
    { time:"17:45–18:45", activity:"Dinner + household",                                duration:1,    category:"Break"      },
    { time:"18:45–19:05", activity:"Call parents",                                      duration:0.33, category:"Mind"       },
    { time:"19:05–19:15", activity:"Transition",                                        duration:0.17, category:"Daily"      },
    { time:"19:15–21:45", activity:"⭐ UPSC (2.5h)",                                   duration:2.5,  category:"Learning"   },
    { time:"21:45–22:15", activity:"Tech study — CKA prep (30m)",                       duration:0.5,  category:"Learning"   },
    { time:"22:15–22:25", activity:"Journal",                                           duration:0.17, category:"Reflection" },
    { time:"22:25–23:00", activity:"Wind-down",                                         duration:0.58, category:"Daily"      },
    { time:"23:00",       activity:"Sleep — 7h non-negotiable",                         duration:7,    category:"Health"     }
  ],

  ramp4_saturday: [
    { time:"07:00",       activity:"Wake",                                              duration:0,    category:"Daily"      },
    { time:"07:00–07:30", activity:"Freshen + breakfast",                               duration:0.5,  category:"Break"      },
    { time:"07:30–08:00", activity:"Household",                                         duration:0.5,  category:"Daily"      },
    { time:"08:00–10:00", activity:"⭐ UPSC Block 1 (2h)",                              duration:2,    category:"Learning"   },
    { time:"10:00–10:15", activity:"Break",                                             duration:0.25, category:"Break"      },
    { time:"10:15–12:15", activity:"⭐ UPSC Block 2 (2h)",                              duration:2,    category:"Learning"   },
    { time:"12:15–12:30", activity:"Break",                                             duration:0.25, category:"Break"      },
    { time:"12:30–14:30", activity:"⭐ UPSC Block 3 (2h)",                              duration:2,    category:"Learning"   },
    { time:"14:30–15:00", activity:"Break",                                             duration:0.5,  category:"Break"      },
    { time:"15:00–17:00", activity:"⭐ UPSC Block 4 (2h)",                              duration:2,    category:"Learning"   },
    { time:"17:00–17:30", activity:"Exercise",                                          duration:0.5,  category:"Fitness"    },
    { time:"17:30–18:30", activity:"Dinner + household",                                duration:1,    category:"Break"      },
    { time:"18:30–18:50", activity:"Call parents",                                      duration:0.33, category:"Mind"       },
    { time:"18:50–19:50", activity:"Tech study — CKA (1h)",                             duration:1,    category:"Learning"   },
    { time:"19:50 onward",activity:"Personal time",                                     duration:3,    category:"Hobby"      },
    { time:"23:00",       activity:"Sleep (soft cap 11 PM Sat)",                        duration:8,    category:"Health"     }
  ],

  ramp4_sunday: [
    { time:"07:00",       activity:"Wake",                                              duration:0,    category:"Daily"      },
    { time:"07:00–07:30", activity:"Freshen + breakfast",                               duration:0.5,  category:"Break"      },
    { time:"07:30–08:00", activity:"Household",                                         duration:0.5,  category:"Daily"      },
    { time:"08:00–10:00", activity:"⭐ UPSC Block 1 (2h)",                              duration:2,    category:"Learning"   },
    { time:"10:00–10:15", activity:"Break",                                             duration:0.25, category:"Break"      },
    { time:"10:15–12:15", activity:"⭐ UPSC Block 2 (2h)",                              duration:2,    category:"Learning"   },
    { time:"12:15–12:30", activity:"Break",                                             duration:0.25, category:"Break"      },
    { time:"12:30–14:30", activity:"⭐ UPSC Block 3 (2h)",                              duration:2,    category:"Learning"   },
    { time:"14:30–15:00", activity:"Break",                                             duration:0.5,  category:"Break"      },
    { time:"15:00–17:00", activity:"⭐ UPSC Block 4 (2h)",                              duration:2,    category:"Learning"   },
    { time:"17:00–17:30", activity:"Exercise",                                          duration:0.5,  category:"Fitness"    },
    { time:"17:30–18:30", activity:"Dinner + household",                                duration:1,    category:"Break"      },
    { time:"18:30–18:50", activity:"Call parents",                                      duration:0.33, category:"Mind"       },
    { time:"18:50–19:50", activity:"Tech study (1h)",                                   duration:1,    category:"Learning"   },
    { time:"19:50 onward",activity:"Personal time",                                     duration:2.5,  category:"Hobby"      },
    { time:"22:30",       activity:"Sleep — protect Monday 6 AM anchor",                duration:7.5,  category:"Health"     }
  ],

  // ══════════════════════════════════════════════════════════
  // SUSTAINED — Week 9+ (Nov 12, 2026 onward)
  // 27.5h UPSC + 4.5h Tech + 5h CA per week
  // ══════════════════════════════════════════════════════════

  sustained_weekday: [
    { time:"06:00",       activity:"Wake",                                              duration:0,    category:"Daily"      },
    { time:"06:00–06:30", activity:"Freshen up",                                        duration:0.5,  category:"Daily"      },
    { time:"06:30–07:00", activity:"Breakfast + household",                             duration:0.5,  category:"Break"      },
    { time:"07:00–08:00", activity:"Commute (current affairs reading on phone)",        duration:1,    category:"Learning"   },
    { time:"08:00–16:15", activity:"Work",                                              duration:8.25, category:"Work"       },
    { time:"16:15–17:15", activity:"Commute home",                                     duration:1,    category:"Daily"      },
    { time:"17:15–17:45", activity:"Exercise — 30 min non-negotiable",                  duration:0.5,  category:"Fitness"    },
    { time:"17:45–18:45", activity:"Dinner + household",                                duration:1,    category:"Break"      },
    { time:"18:45–19:05", activity:"Call parents — daily non-negotiable",                duration:0.33, category:"Mind"       },
    { time:"19:05–19:15", activity:"Transition",                                        duration:0.17, category:"Daily"      },
    { time:"19:15–21:45", activity:"⭐ UPSC (2.5h)",                                   duration:2.5,  category:"Learning"   },
    { time:"21:45–22:15", activity:"Tech study (30m)",                                  duration:0.5,  category:"Learning"   },
    { time:"22:15–22:25", activity:"Journal",                                           duration:0.17, category:"Reflection" },
    { time:"22:25–23:00", activity:"Wind-down",                                         duration:0.58, category:"Daily"      },
    { time:"23:00",       activity:"Sleep — 7h non-negotiable",                         duration:7,    category:"Health"     }
  ],

  sustained_saturday: [
    { time:"07:00",       activity:"Wake",                                              duration:0,    category:"Daily"      },
    { time:"07:00–07:30", activity:"Freshen + breakfast",                               duration:0.5,  category:"Break"      },
    { time:"07:30–08:00", activity:"Household",                                         duration:0.5,  category:"Daily"      },
    { time:"08:00–10:00", activity:"⭐ UPSC Block 1 (2h)",                              duration:2,    category:"Learning"   },
    { time:"10:00–10:15", activity:"Break",                                             duration:0.25, category:"Break"      },
    { time:"10:15–12:15", activity:"⭐ UPSC Block 2 (2h)",                              duration:2,    category:"Learning"   },
    { time:"12:15–13:15", activity:"Lunch",                                             duration:1,    category:"Break"      },
    { time:"13:15–15:15", activity:"⭐ UPSC Block 3 (2h)",                              duration:2,    category:"Learning"   },
    { time:"15:15–15:30", activity:"Break",                                             duration:0.25, category:"Break"      },
    { time:"15:30–17:00", activity:"⭐ UPSC Block 4 (1.5h)",                            duration:1.5,  category:"Learning"   },
    { time:"17:00–17:30", activity:"Exercise",                                          duration:0.5,  category:"Fitness"    },
    { time:"17:30–18:30", activity:"Dinner + household",                                duration:1,    category:"Break"      },
    { time:"18:30–18:50", activity:"Call parents",                                      duration:0.33, category:"Mind"       },
    { time:"18:50–19:50", activity:"Tech study (1h)",                                   duration:1,    category:"Learning"   },
    { time:"19:50 onward",activity:"Personal time",                                     duration:3,    category:"Hobby"      },
    { time:"23:00",       activity:"Sleep (Sat night soft cap 11 PM)",                  duration:8,    category:"Health"     }
  ],

  sustained_sunday: [
    { time:"07:00",       activity:"Wake",                                              duration:0,    category:"Daily"      },
    { time:"07:00–07:30", activity:"Freshen + breakfast",                               duration:0.5,  category:"Break"      },
    { time:"07:30–08:00", activity:"Household",                                         duration:0.5,  category:"Daily"      },
    { time:"08:00–10:00", activity:"⭐ UPSC Block 1 (2h)",                              duration:2,    category:"Learning"   },
    { time:"10:00–10:15", activity:"Break",                                             duration:0.25, category:"Break"      },
    { time:"10:15–12:15", activity:"⭐ UPSC Block 2 (2h)",                              duration:2,    category:"Learning"   },
    { time:"12:15–13:15", activity:"Lunch",                                             duration:1,    category:"Break"      },
    { time:"13:15–15:15", activity:"⭐ UPSC Block 3 (2h)",                              duration:2,    category:"Learning"   },
    { time:"15:15–15:30", activity:"Break",                                             duration:0.25, category:"Break"      },
    { time:"15:30–17:00", activity:"⭐ UPSC Block 4 (1.5h)",                            duration:1.5,  category:"Learning"   },
    { time:"17:00–17:30", activity:"Exercise",                                          duration:0.5,  category:"Fitness"    },
    { time:"17:30–18:00", activity:"Weekly review + next week planning",                duration:0.5,  category:"Reflection" },
    { time:"18:00–19:00", activity:"Dinner + household",                                duration:1,    category:"Break"      },
    { time:"19:00–19:20", activity:"Call parents",                                      duration:0.33, category:"Mind"       },
    { time:"19:20–20:20", activity:"Tech study (1h)",                                   duration:1,    category:"Learning"   },
    { time:"20:20 onward",activity:"Personal time",                                     duration:2,    category:"Hobby"      },
    { time:"22:30",       activity:"Wind-down — protect Monday 6 AM anchor",            duration:0,    category:"Daily"      },
    { time:"23:00",       activity:"Sleep",                                             duration:7,    category:"Health"     }
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
    desc:  'Sleep 7h non-negotiable. Phone stays outside the room.',
    expect:'Log tonight\'s sleep hours in the Health tab before marking done.',
    navTab:'health', focusId:'hSleep',
    logHint:'Log sleep hours in Health tab'
  },
  {
    match: /exercise|gym/i,
    desc:  '30 min/day — walk, gym, or outdoor time. Protected floor.',
    expect:'Mark Gym Done in the Health tab.',
    navTab:'health', focusId:'hGym',
    logHint:'Mark Gym Done in Health tab'
  },
  {
    match: /upsc|ncert|revision|mocks/i,
    desc:  'Study session from the UPSC schedule.',
    expect:'Update class progress in the UPSC tab under Subject Progress.',
    navTab:'upsc', focusId:'upscSubjectsGrid',
    logHint:'Update UPSC class progress'
  },
  {
    match: /tech study|docker|k8s|cka|openshift|jenkins|argocd|terraform|aws|python|istio|prometheus|vault|system design|genai|psm/i,
    desc:  'Tech upskilling session — follow the 76-week plan.',
    expect:'Log progress in Growth tab.',
    navTab:'growth', focusId:'techStudyModeToggle',
    logHint:'Log tech study in Growth tab'
  },
  {
    match: /current affairs/i,
    desc:  'Read current affairs — newspaper or Unacademy CA module.',
    expect:'Mark CA Reading Done in the Health tab.',
    navTab:'health', focusId:'hCA',
    logHint:'Mark CA Done in Health tab'
  },
  {
    match: /call parents/i,
    desc:  'Daily parents call — non-negotiable protected floor.',
    expect:'No log needed — just check off after calling.',
    navTab: null
  },
  {
    match: /journal|weekly review/i,
    desc:  'Reflect on the day and plan tomorrow\'s priorities.',
    expect:'No log needed — check off after writing.',
    navTab: null
  },
  {
    match: /book reading|books queue/i,
    desc:  'Read from the current month\'s book (see Growth > Books Queue).',
    expect:'Log pages read in Growth > Books Queue.',
    navTab:'growth', focusId:'booksContainer',
    logHint:'Log pages read in Growth'
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
            UI.setPendingActivity({ key, scheduleKey, activityName: item.activity, meta, cb });
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
