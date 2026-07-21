"use client";
import { useOps } from "@/lib/ops/store";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import s from "./Shell.module.css";

import TodayScreen from "./screens/TodayScreen";
import AttendanceScreen from "./screens/AttendanceScreen";
import ScheduleScreen from "./screens/ScheduleScreen";
import CoachesScreen from "./screens/CoachesScreen";
import SubscriptionsScreen from "./screens/SubscriptionsScreen";
import LeadsScreen from "./screens/LeadsScreen";
import GroupsScreen from "./screens/GroupsScreen";
import ClientsScreen from "./screens/ClientsScreen";
import ReportsScreen from "./screens/ReportsScreen";
import NotificationsScreen from "./screens/NotificationsScreen";
import SettingsScreen from "./screens/SettingsScreen";
import CoachTodayScreen from "./screens/CoachTodayScreen";
import CoachPhoneScreen from "./screens/CoachPhoneScreen";

import CommandPalette from "./modals/CommandPalette";
import CoachEditor from "./modals/CoachEditor";
import ConfirmDialog from "./modals/ConfirmDialog";
import GroupEditor from "./modals/GroupEditor";
import SubEditor from "./modals/SubEditor";
import ClientEditor from "./modals/ClientEditor";
import PlanEditor from "./modals/PlanEditor";
import CashOutModal from "./modals/CashOutModal";
import IntakeModal from "./modals/IntakeModal";
import ClientProfileDrawer from "./modals/ClientProfileDrawer";
import Toasts from "./modals/Toasts";

export default function Shell() {
  const v = useOps();
  return (
    <div className={`mv-scroll ${s.shell}`}>
      <Sidebar />
      <div className={s.main}>
        <Topbar />
        <main className={`mv-scroll ${s.content}`}>
          <div className={s.contentInner}>
            {v.isTodayView && <TodayScreen />}
            {v.isAttendanceView && <AttendanceScreen />}
            {v.isScheduleView && <ScheduleScreen />}
            {v.isCoachesView && <CoachesScreen />}
            {v.isSubsView && <SubscriptionsScreen />}
            {v.isLeadsView && <LeadsScreen />}
            {v.isGroupsView && <GroupsScreen />}
            {v.isClientsView && <ClientsScreen />}
            {v.isReportsView && <ReportsScreen />}
            {v.isNotifView && <NotificationsScreen />}
            {v.isSettingsView && <SettingsScreen />}
            {v.isCoachTodayView && <CoachTodayScreen />}
            {v.isCoachPhoneView && <CoachPhoneScreen />}
          </div>
        </main>
      </div>

      <CommandPalette />
      <CoachEditor />
      <ConfirmDialog />
      <GroupEditor />
      <SubEditor />
      <ClientEditor />
      <PlanEditor />
      <CashOutModal />
      <IntakeModal />
      <ClientProfileDrawer />
      <Toasts />
    </div>
  );
}
