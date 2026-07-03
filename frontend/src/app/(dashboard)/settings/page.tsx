"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  Check,
  ChevronRight,
  Clock,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  Monitor,
  Moon,
  Pencil,
  Plus,
  Shield,
  Sun,
  Trash2,
  User,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

type SettingsSection =
  | "profile"
  | "factory"
  | "team"
  | "preferences"
  | "security";

const SECTIONS: {
  id: SettingsSection;
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    id: "profile",
    label: "Profile",
    icon: <User size={15} />,
    description: "Your personal information",
  },
  {
    id: "factory",
    label: "Factory",
    icon: <Building2 size={15} />,
    description: "Facility configuration",
  },
  {
    id: "team",
    label: "Team Members",
    icon: <Users size={15} />,
    description: "Manage your team",
  },
  {
    id: "preferences",
    label: "Preferences",
    icon: <Monitor size={15} />,
    description: "App behavior & theme",
  },
  {
    id: "security",
    label: "Security",
    icon: <Shield size={15} />,
    description: "Passwords & access",
  },
];

const ROLES = [
  "Factory Owner",
  "Production Manager",
  "Supervisor",
  "Worker",
  "Quality Inspector",
  "Dispatch Team",
];

const TIMEZONES = [
  "Asia/Kolkata",
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Dubai",
];

const DEFAULT_VIEWS = [
  "Dashboard",
  "Production Board",
  "Dispatch",
  "Quality Control",
  "Workers",
];

const NOTIF_PREFS = [
  { id: "job_started", label: "Job started by worker" },
  { id: "qc_passed", label: "QC inspection passed" },
  { id: "qc_failed", label: "QC inspection failed" },
  { id: "vehicle_dispatched", label: "Vehicle dispatched" },
  { id: "emergency_created", label: "Emergency order created" },
  { id: "delayed_order", label: "Order delayed past ETA" },
];

const INITIAL_TEAM = [
  {
    id: 1,
    name: "Arjun Mehta",
    email: "arjun.mehta@foxflow.in",
    role: "Factory Owner",
  },
  {
    id: 2,
    name: "Priya Sharma",
    email: "priya.sharma@foxflow.in",
    role: "Production Manager",
  },
  {
    id: 3,
    name: "Rohan Das",
    email: "rohan.das@foxflow.in",
    role: "Supervisor",
  },
  {
    id: 4,
    name: "Kavita Patel",
    email: "kavita.patel@foxflow.in",
    role: "Quality Inspector",
  },
  {
    id: 5,
    name: "Suresh Kumar",
    email: "suresh.kumar@foxflow.in",
    role: "Dispatch Team",
  },
];

const LOGIN_HISTORY = [
  {
    device: "Chrome on Windows",
    ip: "103.21.45.12",
    location: "Mumbai, India",
    time: "Today 09:14 AM",
  },
  {
    device: "Safari on iPhone",
    ip: "103.21.45.12",
    location: "Mumbai, India",
    time: "Yesterday 06:30 PM",
  },
  {
    device: "Chrome on Windows",
    ip: "103.21.45.12",
    location: "Mumbai, India",
    time: "25 May 2026 11:00 AM",
  },
];

function RoleBadge({ userRole }: { userRole: string }) {
  const role = userRole;
  const color =
    role === "Factory Owner"
      ? "bg-primary/10 text-primary border-primary/20"
      : role === "Production Manager"
        ? "bg-warning/10 text-warning border-warning/20"
        : role === "Quality Inspector"
          ? "bg-success/10 text-success border-success/20"
          : role === "Supervisor"
            ? "bg-secondary text-secondary-foreground border-border"
            : "bg-muted text-muted-foreground border-border";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${color}`}
    >
      {role}
    </span>
  );
}

function SectionCard({
  title,
  description,
  children,
}: { title: string; description: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.22 }}
      className="bg-card border border-border rounded-xl shadow-subtle"
    >
      <div className="px-6 pt-5 pb-4">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Separator />
      <div className="px-6 py-5">{children}</div>
    </motion.div>
  );
}

function ProfileSection() {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("Arjun Mehta");
  const [draft, setDraft] = useState(name);
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const save = () => {
    setName(draft);
    setEditing(false);
    toast.success("Profile saved");
  };
  const cancel = () => {
    setDraft(name);
    setEditing(false);
  };

  return (
    <SectionCard
      title="Profile"
      description="Your personal information and role on the platform."
    >
      <div className="flex items-start gap-5">
        <div className="shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground font-semibold font-display text-lg shadow-sm">
          {initials}
        </div>
        <div className="flex-1 min-w-0 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Full Name</Label>
              {editing ? (
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="h-8 text-sm"
                  data-ocid="settings.profile.name_input"
                  autoFocus
                />
              ) : (
                <p
                  className="text-sm font-semibold text-foreground py-1"
                  data-ocid="settings.profile.name_display"
                >
                  {name}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Email</Label>
              <div className="flex items-center gap-1.5 py-1">
                <Mail size={13} className="text-muted-foreground shrink-0" />
                <p className="text-sm text-muted-foreground">
                  arjun.mehta@foxflow.in
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Role</Label>
            <div>
              <RoleBadge userRole="Factory Owner" />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-5 flex items-center gap-2">
        {editing ? (
          <>
            <Button
              size="sm"
              onClick={save}
              data-ocid="settings.profile.save_button"
              className="h-8 text-xs"
            >
              <Check size={13} className="mr-1.5" /> Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={cancel}
              data-ocid="settings.profile.cancel_button"
              className="h-8 text-xs"
            >
              <X size={13} className="mr-1.5" /> Cancel
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditing(true)}
            data-ocid="settings.profile.edit_button"
            className="h-8 text-xs"
          >
            <Pencil size={13} className="mr-1.5" /> Edit Profile
          </Button>
        )}
      </div>
    </SectionCard>
  );
}

function FactorySection() {
  const [facilityName, setFacilityName] = useState(
    "FoxFlow Manufacturing – Mumbai Unit 1",
  );
  const [address, setAddress] = useState(
    "Plot 42, MIDC Industrial Area, Andheri East, Mumbai 400093",
  );
  const [hours, setHours] = useState(
    "Mon–Sat 07:00–20:00, Sunday Emergency Only",
  );
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [departments, setDepartments] = useState([
    "Fabrication",
    "Paint",
    "QC",
    "Dispatch",
    "Stores",
  ]);
  const [newDept, setNewDept] = useState("");

  const addDept = () => {
    const d = newDept.trim();
    if (d && !departments.includes(d)) {
      setDepartments([...departments, d]);
      setNewDept("");
    }
  };
  const removeDept = (d: string) =>
    setDepartments(departments.filter((x) => x !== d));
  const save = () => toast.success("Factory configuration saved");

  return (
    <SectionCard
      title="Factory Configuration"
      description="Set up your facility details and operational parameters."
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Facility Name</Label>
          <Input
            value={facilityName}
            onChange={(e) => setFacilityName(e.target.value)}
            className="h-8 text-sm"
            data-ocid="settings.factory.name_input"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Address</Label>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="h-8 text-sm"
            data-ocid="settings.factory.address_input"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Operating Hours
            </Label>
            <Input
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="h-8 text-sm"
              data-ocid="settings.factory.hours_input"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Time Zone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger
                className="h-8 text-sm text-left"
                data-ocid="settings.factory.timezone_select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground font-medium">Departments</Label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {departments.map((d) => (
              <span
                key={d}
                className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 bg-secondary text-secondary-foreground text-xs rounded-full border border-border"
              >
                {d}
                <button
                  type="button"
                  onClick={() => removeDept(d)}
                  className="hover:text-destructive transition-colors"
                  data-ocid={`settings.factory.dept_remove.${d.toLowerCase()}`}
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2 max-w-sm">
            <Input
              placeholder="Add department…"
              value={newDept}
              onChange={(e) => setNewDept(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addDept()}
              className="h-8 text-xs"
              data-ocid="settings.factory.dept_input"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={addDept}
              type="button"
              className="h-8 shrink-0 px-2"
              data-ocid="settings.factory.dept_add_button"
            >
              <Plus size={13} />
            </Button>
          </div>
        </div>
      </div>
      <div className="mt-5">
        <Button
          size="sm"
          onClick={save}
          data-ocid="settings.factory.save_button"
          className="h-8 text-xs"
        >
          <Check size={13} className="mr-1.5" /> Save Changes
        </Button>
      </div>
    </SectionCard>
  );
}

function TeamSection() {
  const [team, setTeam] = useState(INITIAL_TEAM);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState(ROLES[3]);

  const invite = () => {
    if (!inviteEmail.trim()) return;
    setTeam([
      ...team,
      {
        id: Date.now(),
        name: inviteEmail.split("@")[0],
        email: inviteEmail,
        role: inviteRole,
      },
    ]);
    setInviteEmail("");
    setShowInvite(false);
    toast.success(`Invitation sent to ${inviteEmail}`);
  };
  const remove = (id: number) => {
    setTeam(team.filter((m) => m.id !== id));
    toast.success("Member removed");
  };

  return (
    <SectionCard
      title="Team Members"
      description="Manage who has access to FOXFLOW ERP and their roles."
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground">{team.length} members</p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowInvite(true)}
          className="h-8 text-xs"
          data-ocid="settings.team.invite_button"
        >
          <UserPlus size={13} className="mr-1.5" /> Invite Member
        </Button>
      </div>
      <AnimatePresence>
        {showInvite && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 p-4 bg-muted/50 border border-border rounded-lg space-y-3"
            data-ocid="settings.team.invite_dialog"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-foreground">
                Invite New Member
              </p>
              <button
                type="button"
                onClick={() => setShowInvite(false)}
                className="text-muted-foreground hover:text-foreground"
                data-ocid="settings.team.invite_close_button"
              >
                <X size={14} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                placeholder="Email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="h-8 text-sm"
                data-ocid="settings.team.invite_email_input"
              />
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger
                  className="h-8 text-sm text-left"
                  data-ocid="settings.team.invite_role_select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 mt-1">
              <Button
                size="sm"
                onClick={invite}
                className="h-8 text-xs"
                data-ocid="settings.team.invite_confirm_button"
              >
                Send Invite
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowInvite(false)}
                className="h-8 text-xs"
                data-ocid="settings.team.invite_cancel_button"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="border border-border rounded-lg overflow-hidden shadow-subtle">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                Member
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground hidden sm:table-cell">
                Email
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                Role
              </th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {team.map((m, i) => (
              <tr
                key={m.id}
                className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                data-ocid={`settings.team.item.${i + 1}`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/60 to-primary/90 flex items-center justify-center text-primary-foreground text-xs font-semibold shrink-0 font-display">
                      {m.name[0].toUpperCase()}
                    </div>
                    <span className="font-semibold text-foreground text-sm truncate">
                      {m.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell">
                  {m.email}
                </td>
                <td className="px-4 py-3">
                  <RoleBadge userRole={m.role} />
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => remove(m.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    data-ocid={`settings.team.delete_button.${i + 1}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

function PreferencesSection() {
  const { theme, setTheme } = useTheme();
  const [defaultView, setDefaultView] = useState("Dashboard");
  const [notifs, setNotifs] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIF_PREFS.map((n) => [n.id, true])),
  );

  const toggleNotif = (id: string) =>
    setNotifs((prev) => ({ ...prev, [id]: !prev[id] }));
  const save = () => toast.success("Preferences saved");

  const themes: { value: string; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: "Light", icon: <Sun size={13} /> },
    { value: "dark", label: "Dark", icon: <Moon size={13} /> },
    { value: "system", label: "System", icon: <Monitor size={13} /> },
  ];

  return (
    <SectionCard
      title="Preferences"
      description="Customize your experience and notification settings."
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-foreground">Theme</Label>
          <div className="flex gap-2">
            {themes.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTheme(t.value)}
                data-ocid={`settings.preferences.theme_${t.value}.toggle`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-smooth ${
                  theme === t.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:bg-muted/50"
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-foreground">
            Default View
          </Label>
          <Select value={defaultView} onValueChange={setDefaultView}>
            <SelectTrigger
              className="h-8 text-sm w-48 text-left"
              data-ocid="settings.preferences.default_view_select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEFAULT_VIEWS.map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-foreground">
            Notification Preferences
          </Label>
          <p className="text-xs text-muted-foreground">
            Choose which factory events you want to be notified about.
          </p>
          <div className="mt-2 space-y-2.5">
            {NOTIF_PREFS.map((n) => (
              <div key={n.id} className="flex items-center gap-2.5">
                <Checkbox
                  id={n.id}
                  checked={notifs[n.id]}
                  onCheckedChange={() => toggleNotif(n.id)}
                  data-ocid={`settings.preferences.notif_${n.id}.checkbox`}
                />
                <label
                  htmlFor={n.id}
                  className="text-xs text-foreground cursor-pointer select-none font-medium hover:text-primary"
                >
                  {n.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-5">
        <Button
          size="sm"
          onClick={save}
          className="h-8 text-xs"
          data-ocid="settings.preferences.save_button"
        >
          <Check size={13} className="mr-1.5" /> Save Preferences
        </Button>
      </div>
    </SectionCard>
  );
}

function SecuritySection() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [apiRevealed, setApiRevealed] = useState(false);
  const apiKey = "sk-foxflow-fxw8n2kp4qr1m7jt9lz3vdy6whe0ucs";
  const maskedKey = `${apiKey.slice(0, 12)}••••••••••••••••••••${apiKey.slice(-4)}`;

  const copyKey = useCallback(() => {
    navigator.clipboard.writeText(apiKey);
    toast.success("API key copied to clipboard");
  }, []);

  const changePassword = () => {
    if (!current || !next || !confirm) {
      toast.error("All fields are required");
      return;
    }
    if (next !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setCurrent("");
    setNext("");
    setConfirm("");
    toast.success("Password updated successfully");
  };

  function PwField({
    id,
    value,
    show,
    onChange,
    onToggle,
    placeholder,
    ocid,
  }: {
    id: string;
    value: string;
    show: boolean;
    onChange: (v: string) => void;
    onToggle: () => void;
    placeholder: string;
    ocid: string;
  }) {
    return (
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-8 text-xs pr-9"
          data-ocid={ocid}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {show ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
      </div>
    );
  }

  return (
    <SectionCard
      title="Security"
      description="Manage your password, API access, and review recent login activity."
    >
      <div className="space-y-7">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Lock size={13} className="text-muted-foreground" />
            <p className="text-xs font-semibold text-foreground">
              Change Password
            </p>
          </div>
          <div className="space-y-3 max-w-sm">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Current Password
              </Label>
              <PwField
                id="current"
                value={current}
                show={showCurrent}
                onChange={setCurrent}
                onToggle={() => setShowCurrent(!showCurrent)}
                placeholder="Enter current password"
                ocid="settings.security.current_password_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                New Password
              </Label>
              <PwField
                id="next"
                value={next}
                show={showNext}
                onChange={setNext}
                onToggle={() => setShowNext(!showNext)}
                placeholder="Enter new password"
                ocid="settings.security.new_password_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Confirm New Password
              </Label>
              <PwField
                id="confirm"
                value={confirm}
                show={showConfirm}
                onChange={setConfirm}
                onToggle={() => setShowConfirm(!showConfirm)}
                placeholder="Confirm new password"
                ocid="settings.security.confirm_password_input"
              />
            </div>
            <Button
              size="sm"
              onClick={changePassword}
              type="button"
              className="h-8 text-xs mt-1"
              data-ocid="settings.security.change_password_button"
            >
              <Check size={13} className="mr-1.5" /> Update Password
            </Button>
          </div>
        </div>
        <Separator />
        <div>
          <div className="flex items-center gap-2 mb-3">
            <KeyRound size={13} className="text-muted-foreground" />
            <p className="text-xs font-semibold text-foreground">API Key</p>
          </div>
          <div className="flex items-center gap-2 p-3 bg-muted/40 border border-border rounded-lg font-mono text-xs text-muted-foreground">
            <span
              className="flex-1 truncate select-all"
              data-ocid="settings.security.api_key_display"
            >
              {apiRevealed ? apiKey : maskedKey}
            </span>
            <button
              type="button"
              onClick={() => setApiRevealed(!apiRevealed)}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              data-ocid="settings.security.api_key_reveal_button"
              aria-label={apiRevealed ? "Hide API key" : "Reveal API key"}
            >
              {apiRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
            <button
              type="button"
              onClick={copyKey}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              data-ocid="settings.security.api_key_copy_button"
              aria-label="Copy API key"
            >
              <Copy size={13} />
            </button>
          </div>
        </div>
        <Separator />
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={13} className="text-muted-foreground" />
            <p className="text-xs font-semibold text-foreground">
              Recent Login Activity
            </p>
          </div>
          <div className="border border-border rounded-lg overflow-hidden shadow-subtle">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                    Device
                  </th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">
                    Location
                  </th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {LOGIN_HISTORY.map((l, i) => (
                  <tr
                    key={l.device + l.time}
                    className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors"
                    data-ocid={`settings.security.login_history.item.${i + 1}`}
                  >
                    <td className="px-4 py-2.5 text-foreground font-semibold">{l.device}</td>
                    <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell">
                      {l.location}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground font-mono">
                      {l.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

export default function SettingsPage() {
  const [active, setActive] = useState<SettingsSection>("profile");

  const sectionContent: Record<SettingsSection, React.ReactNode> = {
    profile: <ProfileSection />,
    factory: <FactorySection />,
    team: <TeamSection />,
    preferences: <PreferencesSection />,
    security: <SecuritySection />,
  };

  return (
    <div className="flex h-full min-h-0" data-ocid="settings.page">
      <aside className="hidden md:flex flex-col w-52 shrink-0 border-r border-border bg-card">
        <div className="px-4 pt-6 pb-4">
          <h1 className="text-sm font-semibold text-foreground font-display tracking-tight">
            Settings
          </h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Configure your platform
          </p>
        </div>
        <nav className="px-2 space-y-0.5">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActive(s.id)}
              data-ocid={`settings.nav.${s.id}.link`}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-smooth group ${
                active === s.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <span className="shrink-0">{s.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{s.label}</p>
              </div>
              {active === s.id && (
                <ChevronRight size={12} className="shrink-0 opacity-60" />
              )}
            </button>
          ))}
        </nav>
      </aside>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border flex">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActive(s.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
              active === s.id ? "text-primary" : "text-muted-foreground"
            }`}
            data-ocid={`settings.nav_mobile.${s.id}.link`}
          >
            {s.icon}
            <span className="text-[10px]">{s.label}</span>
          </button>
        ))}
      </div>
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-6">
          <div className="md:hidden mb-5">
            <h1 className="text-xl font-bold font-display text-foreground">
              Settings
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure your platform
            </p>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.18 }}
            >
              {sectionContent[active]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
