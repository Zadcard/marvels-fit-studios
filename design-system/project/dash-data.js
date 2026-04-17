// Marvel's Fit Studios — Admin Dashboard Mock Data
const DASH_DATA = {
  user: { name: "Marvel Admin", email: "admin@marvelsfitstudios.com", initials: "MA" },

  stats: [
    { id:"members",  label:"Total members",       value:"248",       change:"+12 this month",   detail:"Active roster across group and private memberships.", tone:"accent"  },
    { id:"coaches",  label:"Active coaches",       value:"6",         change:"Full coverage",    detail:"Every session block this week has a confirmed coach lead.", tone:"success" },
    { id:"sessions", label:"Sessions this week",   value:"34",        change:"+4 vs last week",  detail:"Combined group classes and private coaching appointments.", tone:"neutral" },
    { id:"revenue",  label:"Revenue this month",   value:"EGP 148k",  change:"Under review",     detail:"Monthly revenue trend for the current billing cycle.", tone:"warning" },
  ],

  upcomingSessions: [
    { id:"s1", dayLabel:"Today",    timeLabel:"6:30 PM", name:"Strength Foundations", coachName:"Ahmed Waheed",      location:"Floor A",      type:"Group",   bookedSeats:14, capacity:18, status:"On track" },
    { id:"s2", dayLabel:"Today",    timeLabel:"8:00 PM", name:"Private Progress Check",coachName:"Youssef Abdelatif",location:"Private Zone",  type:"Private", bookedSeats:1,  capacity:1,  status:"On track" },
    { id:"s3", dayLabel:"Tomorrow", timeLabel:"5:00 PM", name:"Conditioning Lab",     coachName:"Ahmed Farouk",      location:"Floor B",       type:"Group",   bookedSeats:20, capacity:20, status:"Waitlist forming" },
    { id:"s4", dayLabel:"Thu",      timeLabel:"7:30 PM", name:"Mobility Reset",       coachName:"Youssef Abdelatif", location:"Recovery Studio",type:"Group",  bookedSeats:4,  capacity:12, status:"On track" },
  ],

  activity: [
    { id:"a1", title:"New member onboarded",           description:"Nour Hassan completed intake and was assigned to Group B.",            timeLabel:"12 min ago", tone:"success" },
    { id:"a2", title:"Capacity alert — Conditioning Lab",description:"Tomorrow's 5:00 PM session is full and may need overflow handling.", timeLabel:"38 min ago", tone:"warning" },
    { id:"a3", title:"Coach update submitted",          description:"Hisham Mostafa added follow-up notes for three private clients.",     timeLabel:"1 hr ago",   tone:"neutral" },
    { id:"a4", title:"Membership renewals pending",     description:"Seven members are due for renewal review before the weekend.",        timeLabel:"2 hr ago",   tone:"warning" },
    { id:"a5", title:"Bulk import completed",           description:"32 session records imported from the April schedule template.",       timeLabel:"3 hr ago",   tone:"success" },
  ],

  quickActions: [
    { id:"qa1", label:"Add new client",  description:"Open the roster and start a new client record.",        ctaLabel:"Open",   href:"clients",  emphasis:"primary"   },
    { id:"qa2", label:"Create session",  description:"Open the session workspace and set the next class.",    ctaLabel:"Launch", href:"sessions", emphasis:"secondary" },
    { id:"qa3", label:"Assign coach",    description:"Review coach capacity and assign the right lead.",      ctaLabel:"Review", href:"clients",  emphasis:"secondary" },
    { id:"qa4", label:"Capture note",    description:"Track schedule notes, flags, and handoff items.",       ctaLabel:"Open",   href:"sessions", emphasis:"secondary" },
  ],

  snapshot: [
    { id:"snap1", label:"Onboarding queue", value:"09",     description:"Members waiting for class placement or first-session confirmation." },
    { id:"snap2", label:"Plan demand",       value:"68%",    description:"Share of current members leaning toward group training this cycle." },
    { id:"snap3", label:"Energy note",       value:"Strong", description:"Attendance and coach coverage are tracking above the weekly baseline." },
    { id:"snap4", label:"Focus next",        value:"Clients",description:"Client management remains the busiest operational surface this week." },
  ],

  clients: [
    { id:"c1", fullName:"Ahmed Kamal",   email:"ahmed.kamal@example.com",  phone:"+20 100 221 3411", membership:"Group Membership",   status:"Active",  joinedDate:"Mar 05, 2026", assignedCoach:"Ahmed Waheed",      nextSession:"Today, 6:30 PM",           progressNote:"Strong attendance across the last three weeks.",        paymentStatus:"Paid",     paymentAmount:"EGP 1,400" },
    { id:"c2", fullName:"Sara Nabil",    email:"sara.nabil@example.com",   phone:"+20 109 882 1145", membership:"Private Coaching",   status:"Active",  joinedDate:"Feb 16, 2026", assignedCoach:"Youssef Abdelatif", nextSession:"Tomorrow, 8:00 PM",        progressNote:"Private program moving into phase-two strength work.",  paymentStatus:"Paid",     paymentAmount:"EGP 2,800" },
    { id:"c3", fullName:"Youssef Hany",  email:"youssef.hany@example.com", phone:"+20 122 734 2210", membership:"Hybrid",             status:"Pending", joinedDate:"Mar 28, 2026", assignedCoach:"Ahmed Farouk",      nextSession:"Awaiting first session",   progressNote:"Intake complete, placement call still pending.",        paymentStatus:"Due soon", paymentAmount:"EGP 2,100" },
    { id:"c4", fullName:"Reham Badawy",  email:"reham.badawy@example.com", phone:"+20 114 522 9087", membership:"Group Membership",   status:"Paused",  joinedDate:"Jan 12, 2026", assignedCoach:"Abdullah Zaki",     nextSession:"On hold",                  progressNote:"Paused due to travel, reactivation expected mid-April.",paymentStatus:"Unpaid",   paymentAmount:"EGP 1,400" },
    { id:"c5", fullName:"Mona Adel",     email:"mona.adel@example.com",    phone:"+20 111 409 3388", membership:"Private Coaching",   status:"Active",  joinedDate:"Mar 02, 2026", assignedCoach:"Hisham Mostafa",    nextSession:"Thu, 5:30 PM",             progressNote:"Tracking well, no missed sessions this cycle.",         paymentStatus:"Paid",     paymentAmount:"EGP 2,800" },
    { id:"c6", fullName:"Karim Samir",   email:"karim.samir@example.com",  phone:"+20 120 500 1192", membership:"Group Membership",   status:"Pending", joinedDate:"Mar 30, 2026", assignedCoach:"Ahmed Waheed",      nextSession:"Placement review tomorrow",progressNote:"Needs final group assignment after onboarding.",        paymentStatus:"Due soon", paymentAmount:"EGP 1,400" },
    { id:"c7", fullName:"Dina Ragab",    email:"dina.ragab@example.com",   phone:"+20 103 847 6690", membership:"Hybrid",             status:"Active",  joinedDate:"Feb 08, 2026", assignedCoach:"Reham Badawy",       nextSession:"Fri, 7:00 PM",             progressNote:"Hybrid plan upgraded after strong February retention.",  paymentStatus:"Paid",     paymentAmount:"EGP 2,100" },
    { id:"c8", fullName:"Nour Hassan",   email:"nour.hassan@example.com",  phone:"+20 101 334 5512", membership:"Group Membership",   status:"Active",  joinedDate:"Apr 17, 2026", assignedCoach:"Ahmed Waheed",      nextSession:"Mon, 6:30 PM",             progressNote:"New member, intake completed today.",                   paymentStatus:"Paid",     paymentAmount:"EGP 1,400" },
    { id:"c9", fullName:"Laila Mansour", email:"laila.m@example.com",      phone:"+20 115 662 7740", membership:"Hybrid",             status:"Active",  joinedDate:"Feb 20, 2026", assignedCoach:"Youssef Abdelatif", nextSession:"Today, 7:00 PM",           progressNote:"Consistently hitting attendance targets.",              paymentStatus:"Paid",     paymentAmount:"EGP 2,100" },
  ],

  groupSessions: [
    { id:"gs1", title:"Strength Foundations", coachName:"Ahmed Waheed",      dayLabel:"Today",    timeLabel:"6:30 PM", location:"Floor A",         status:"Scheduled", capacity:18, enrolled:14 },
    { id:"gs2", title:"Conditioning Lab",      coachName:"Ahmed Farouk",      dayLabel:"Tomorrow", timeLabel:"5:00 PM", location:"Floor B",          status:"Waitlist",  capacity:20, enrolled:20 },
    { id:"gs3", title:"Mobility Reset",        coachName:"Youssef Abdelatif", dayLabel:"Thu",      timeLabel:"7:30 PM", location:"Recovery Studio",  status:"Draft",     capacity:12, enrolled:4  },
    { id:"gs4", title:"Boxing Conditioning",   coachName:"Hisham Mostafa",    dayLabel:"Fri",      timeLabel:"6:00 PM", location:"Floor A",          status:"Scheduled", capacity:16, enrolled:9  },
    { id:"gs5", title:"Core &amp; Cardio Blast",  coachName:"Ahmed Waheed",      dayLabel:"Sat",      timeLabel:"9:00 AM", location:"Floor B",          status:"Scheduled", capacity:20, enrolled:17 },
  ],

  privateSessions: [
    { id:"ps1", title:"Private Progress Check", coachName:"Youssef Abdelatif", dayLabel:"Today",    timeLabel:"8:00 PM", location:"Private Zone",     status:"Scheduled", clientName:"Sara Nabil",    focus:"Phase-two strength block" },
    { id:"ps2", title:"Return to Squat",         coachName:"Hisham Mostafa",    dayLabel:"Tomorrow", timeLabel:"3:00 PM", location:"Private Zone",     status:"Scheduled", clientName:"Mona Adel",     focus:"Knee rehab — week 7"      },
    { id:"ps3", title:"Intake Assessment",        coachName:"Ahmed Waheed",      dayLabel:"Thu",      timeLabel:"10:00 AM",location:"Assessment Room",  status:"Draft",     clientName:"Unassigned",    focus:"Needs client assignment"  },
    { id:"ps4", title:"Athlete Check-in",         coachName:"Abdullah Zaki",     dayLabel:"Fri",      timeLabel:"4:30 PM", location:"Private Zone",     status:"Scheduled", clientName:"Laila Mansour", focus:"Competition prep — week 3" },
  ],

  coaches: [
    { id:"coach1", name:"Ahmed Waheed",      role:"Head Coach",       sessions:14, clients:38, status:"On floor"  },
    { id:"coach2", name:"Youssef Abdelatif", role:"Strength Coach",   sessions:9,  clients:22, status:"Session"   },
    { id:"coach3", name:"Ahmed Farouk",      role:"Conditioning",     sessions:11, clients:28, status:"On floor"  },
    { id:"coach4", name:"Hisham Mostafa",    role:"Private Coach",    sessions:7,  clients:14, status:"Break"     },
    { id:"coach5", name:"Abdullah Zaki",     role:"Group Coach",      sessions:8,  clients:19, status:"Off today" },
    { id:"coach6", name:"Reham Badawy",      role:"Mobility Coach",   sessions:6,  clients:11, status:"On floor"  },
  ],
};
