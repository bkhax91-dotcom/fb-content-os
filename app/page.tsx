"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

/* ULTRA PREMIUM CONTENT OS V4 */

type TabKey = "dashboard" | "team" | "accounts" | "pages" | "videos";

type TeamMemberItem = {
  id?: string;
  name: string;
  email?: string;
  role?: string;
  status?: string;
  created_at?: string;
};

type AccountItem = {
  id?: string;
  team_member_id?: string | null;
  account_name: string;
  login_email?: string;
  login_phone?: string;
  date_of_birth?: string;
  two_factor_status?: string;
  account_status?: string;
  facebook_key?: string | null;
  account_link?: string | null;
  profile_image_url?: string | null;
  profile_image_path?: string | null;
  profile_image_signed_url?: string;
  created_at?: string;
};

type PageItem = {
  id: string;
  facebook_account_id?: string | null;
  team_member_id?: string | null;
  page_name: string;
  page_link: string;
  drive_folder_link?: string | null;
  page_category?: string;
  page_status?: string;
  page_health?: string | null;
  followers_count?: number | null;
  monthly_views?: number | null;
  monthly_reach?: number | null;
  created_at?: string;
};

type VideoItem = {
  id?: string;
  page_id?: string | null;
  video_name: string;
  file_name?: string;
  file_url?: string | null;
  storage_path?: string | null;
  signed_url?: string;
  folder_name?: string | null;
  relative_path?: string | null;
  created_at?: string;
};

type ActivityLogItem = {
  id?: string;
  team_member_id?: string | null;
  action: string;
  table_name?: string | null;
  record_id?: string | null;
  created_at?: string;
};

type VideoGroup = {
  key: string;
  pageId: string;
  pageName: string;
  folderName: string;
  accountName: string;
  videos: VideoItem[];
  latestDate?: string;
};

const pageCategories = [
  "Digital Creator",
  "Video Creator",
  "Entertainment",
  "Gaming Video Creator",
  "Gaming",
  "Food & Drink",
  "Restaurant",
  "Health & Fitness",
  "Beauty",
  "Fashion",
  "Education",
  "News & Media",
  "Sports",
  "Personal Blog",
  "Business",
  "Brand",
  "Product/Service",
  "Shopping & Retail",
  "Musician/Band",
  "Artist",
  "Public Figure",
  "Community",
  "Website",
  "TV Show",
  "Movie",
  "Pet Service",
  "Home & Garden",
  "Travel",
  "Real Estate",
  "Automotive",
  "Finance",
  "Other",
];

const tabPaths: Record<TabKey, string> = {
  dashboard: "/",
  team: "/team",
  accounts: "/accounts",
  pages: "/pages",
  videos: "/videos",
};

function text(value?: string | number | null) {
  return String(value || "").toLowerCase().trim();
}

function searchText(values: Array<string | number | null | undefined>) {
  return values.filter((value) => value !== null && value !== undefined).join(" ").toLowerCase();
}

function cleanPathPart(value: string) {
  return value
    .replace(/\\/g, "/")
    .split("/")
    .map((part) => part.trim().replace(/[^a-zA-Z0-9._-]/g, "-") || "file")
    .join("/");
}

function fileBaseName(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, "");
}

function formatDate(value?: string) {
  if (!value) return "No date";
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

function compactNumber(value?: number | null) {
  const number = Number(value || 0);
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(number);
}

function percent(part: number, total: number) {
  if (total === 0) return 0;
  return Math.min(100, Math.max(0, Math.round((part / total) * 100)));
}

function safeLink(value?: string | null) {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `https://${value}`;
}

function Badge({
  children,
  tone = "blue",
}: {
  children: ReactNode;
  tone?: "blue" | "green" | "purple" | "orange" | "red" | "slate";
}) {
  const tones: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 ring-blue-600/10",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
    purple: "bg-purple-50 text-purple-700 ring-purple-600/10",
    orange: "bg-orange-50 text-orange-700 ring-orange-600/10",
    red: "bg-red-50 text-red-700 ring-red-600/10",
    slate: "bg-slate-100 text-slate-700 ring-slate-600/10",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black ring-1 ${tones[tone]}`}>
      {children}
    </span>
  );
}

function PremiumCard({ children, darkMode, className = "" }: { children: ReactNode; darkMode: boolean; className?: string }) {
  return (
    <div
      className={
        darkMode
          ? `rounded-[1.75rem] border border-slate-800 bg-slate-900/80 p-5 shadow-2xl shadow-black/20 ${className}`
          : `rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 ${className}`
      }
    >
      {children}
    </div>
  );
}

function MetricCard({
  title,
  value,
  note,
  tone = "blue",
  darkMode,
}: {
  title: string;
  value: string | number;
  note?: string;
  tone?: "blue" | "green" | "purple" | "orange" | "red" | "slate";
  darkMode: boolean;
}) {
  const accents: Record<string, string> = {
    blue: "from-blue-500 via-blue-600 to-indigo-700",
    green: "from-emerald-400 via-emerald-600 to-teal-700",
    purple: "from-purple-500 via-fuchsia-600 to-indigo-700",
    orange: "from-orange-400 via-amber-500 to-yellow-600",
    red: "from-rose-500 via-red-600 to-orange-600",
    slate: "from-slate-500 via-slate-700 to-slate-900",
  };

  return (
    <div
      className={
        darkMode
          ? "group overflow-hidden rounded-[1.75rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-black/20"
          : "group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/60"
      }
    >
      <div className={`h-1.5 bg-gradient-to-r ${accents[tone]}`} />
      <div className="p-5">
        <p className={darkMode ? "text-sm font-black text-slate-400" : "text-sm font-black text-slate-500"}>{title}</p>
        <div className="mt-3 flex items-end justify-between gap-3">
          <h3 className="text-4xl font-black tracking-tight">{value}</h3>
          <div className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${accents[tone]} opacity-90 shadow-lg`} />
        </div>
        {note && <p className={darkMode ? "mt-3 text-xs font-semibold text-slate-400" : "mt-3 text-xs font-semibold text-slate-500"}>{note}</p>}
      </div>
    </div>
  );
}

function PageHeader({
  title,
  eyebrow,
  description,
  mutedText,
  right,
}: {
  title: string;
  eyebrow: string;
  description: string;
  mutedText: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <p className={`text-xs font-black uppercase tracking-[0.28em] ${mutedText}`}>{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">{title}</h1>
        <p className={`mt-3 max-w-4xl text-sm leading-6 ${mutedText}`}>{description}</p>
      </div>
      {right && <div className="flex flex-wrap gap-2">{right}</div>}
    </div>
  );
}

function ProgressBar({ label, value, total, mutedText, darkMode }: { label: string; value: number; total: number; mutedText: string; darkMode: boolean }) {
  const width = percent(value, total);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-black">{label}</span>
        <span className={mutedText}>
          {value}/{total} · {width}%
        </span>
      </div>
      <div className={darkMode ? "h-3 rounded-full bg-slate-800" : "h-3 rounded-full bg-slate-200"}>
        <div className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function TabButton({
  tab,
  label,
  short,
  activeTab,
  darkMode,
}: {
  tab: TabKey;
  label: string;
  short: string;
  activeTab: TabKey;
  darkMode: boolean;
}) {
  const active = activeTab === tab;

  return (
    <a
      href={tabPaths[tab]}
      className={
        active
          ? "flex items-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/25"
          : darkMode
            ? "flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm font-bold text-slate-300 hover:border-slate-700 hover:bg-slate-800"
            : "flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50/60"
      }
    >
      <span
        className={
          active
            ? "flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-xs"
            : darkMode
              ? "flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-xs text-slate-300"
              : "flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-700"
        }
      >
        {short}
      </span>
      {label}
    </a>
  );
}

function showActionToast(message: string, tone: "info" | "success" | "error" = "info") {
  if (typeof document === "undefined") return;

  const id = "content-os-action-toast";
  let box = document.getElementById(id);

  if (!box) {
    box = document.createElement("div");
    box.id = id;
    box.style.position = "fixed";
    box.style.left = "50%";
    box.style.bottom = "24px";
    box.style.transform = "translateX(-50%)";
    box.style.zIndex = "99999";
    box.style.borderRadius = "18px";
    box.style.padding = "13px 18px";
    box.style.fontSize = "14px";
    box.style.fontWeight = "900";
    box.style.color = "#ffffff";
    box.style.boxShadow = "0 24px 80px rgba(0,0,0,.35)";
    box.style.backdropFilter = "blur(16px)";
    box.style.transition = "opacity .2s ease, transform .2s ease";
    document.body.appendChild(box);
  }

  box.textContent = message;
  box.style.opacity = "1";
  box.style.transform = "translateX(-50%) translateY(0)";
  box.style.border = "1px solid rgba(255,255,255,.18)";
  box.style.background =
    tone === "success"
      ? "rgba(22,163,74,.96)"
      : tone === "error"
      ? "rgba(220,38,38,.96)"
      : "rgba(15,23,42,.96)";

  window.clearTimeout((window as any).__contentOsToastTimer);
  (window as any).__contentOsToastTimer = window.setTimeout(() => {
    if (box) {
      box.style.opacity = "0";
      box.style.transform = "translateX(-50%) translateY(10px)";
    }
  }, 2400);
}
export default function Home() {
  const pathname = usePathname();

  const activeTab: TabKey =
    pathname === "/team"
      ? "team"
      : pathname === "/accounts"
        ? "accounts"
        : pathname === "/pages"
          ? "pages"
          : pathname === "/videos"
            ? "videos"
            : "dashboard";

  const [darkMode, setDarkMode] = useState(false);
  const [uiReady, setUiReady] = useState(false);
  const [sideMenuOpen, setSideMenuOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [authLoading, setAuthLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [teamMembers, setTeamMembers] = useState<TeamMemberItem[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);

  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [savingMember, setSavingMember] = useState(false);

  const [accountName, setAccountName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountLink, setAccountLink] = useState("");
  const [accountDob, setAccountDob] = useState("");
  const [accountTwoFactor, setAccountTwoFactor] = useState("off");
  const [accountFacebookKey, setAccountFacebookKey] = useState("");
  const [accountTeamMemberId, setAccountTeamMemberId] = useState("");
  const [accountProfileImage, setAccountProfileImage] = useState<File | null>(null);
  const [savingAccount, setSavingAccount] = useState(false);

  const [pageName, setPageName] = useState("");
  const [pageLink, setPageLink] = useState("");
  const [driveFolderLink, setDriveFolderLink] = useState("");
  const [pageCategory, setPageCategory] = useState("");
  const [pageAccountId, setPageAccountId] = useState("");
  const [pageTeamMemberId, setPageTeamMemberId] = useState("");
  const [pageHealth, setPageHealth] = useState("unknown");
  const [pageFollowers, setPageFollowers] = useState("");
  const [pageViews, setPageViews] = useState("");
  const [pageReach, setPageReach] = useState("");
  const [savingPage, setSavingPage] = useState(false);

  const [videoName, setVideoName] = useState("");
  const [selectedPageId, setSelectedPageId] = useState("");
  const [uploadMode, setUploadMode] = useState<"folder" | "files">("folder");
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [savingVideo, setSavingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const mainClass = darkMode
    ? "min-h-screen bg-slate-950 text-slate-100"
    : "min-h-screen bg-slate-100 text-slate-950";

  const shellClass = "mx-auto grid min-h-screen max-w-[1800px] grid-cols-1 gap-6 p-4 md:p-6 xl:grid-cols-[320px_1fr]";

  const sidebarClass = darkMode
    ? "h-fit overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950 p-4 shadow-2xl shadow-black/30 xl:sticky xl:top-6"
    : "h-fit overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/80 xl:sticky xl:top-6";

  const panelClass = darkMode
    ? "rounded-[2rem] border border-slate-800 bg-slate-950/90 p-5 shadow-2xl shadow-black/20 md:p-7"
    : "rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70 md:p-7";

  const inputClass = darkMode
    ? "h-12 rounded-2xl border border-slate-700 bg-slate-950 px-4 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
    : "h-12 rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10";

  const mutedText = darkMode ? "text-slate-400" : "text-slate-600";

  useEffect(() => {
    const saved = window.localStorage.getItem("content-os-dark-mode");
    setDarkMode(saved === "1");
    setUiReady(true);
  }, []);

  useEffect(() => {
    if (uiReady) window.localStorage.setItem("content-os-dark-mode", darkMode ? "1" : "0");
  }, [darkMode, uiReady]);

  useEffect(() => {
    async function checkUser() {
      try {
        const { data } = await supabase.auth.getUser();
        setUser(data.user);
      } catch {
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    }

    checkUser();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setAuthLoading(false);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) loadAll();
  }, [user]);

  async function loadAll() {
    await Promise.all([loadTeamMembers(), loadAccounts(), loadPages(), loadVideos(), loadActivityLogs()]);
  }

  async function loginUser() {
    if (!loginEmail || !loginPassword) {
      alert("Email aur password dono likho");
      return;
    }

    setLoginLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        alert(error.message);
        return;
      }

      setLoginPassword("");
    } catch {
      alert("Login failed. Internet, VPN ya Supabase connection check karo.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function logoutUser() {
    await supabase.auth.signOut();
    setUser(null);
    setTeamMembers([]);
    setAccounts([]);
    setPages([]);
    setVideos([]);
    setActivityLogs([]);
  }

  async function createActivityLog(action: string, tableName: string, recordId?: string | null, teamMemberId?: string | null) {
    await supabase.from("activity_logs").insert({
      action,
      table_name: tableName,
      record_id: recordId || null,
      team_member_id: teamMemberId || null,
    });
    loadActivityLogs();
  }

  async function createSignedUrl(bucketName: string, filePath?: string | null) {
    if (!filePath) return "";

    const { data, error } = await supabase.storage.from(bucketName).createSignedUrl(filePath, 3600);
    if (error) return "";
    return data.signedUrl;
  }

  async function downloadFromStorage(bucketName: string, filePath?: string | null) {
    if (!filePath) {
      alert("File not found");
      return;
    }

    const { data, error } = await supabase.storage.from(bucketName).createSignedUrl(filePath, 300);

    if (error || !data.signedUrl) {
      alert(error?.message || "Download link create nahi hua");
      return;
    }

    try {
      const response = await fetch(data.signedUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filePath.split("/").pop() || "download";
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(data.signedUrl, "_blank");
    }
  }

  async function loadTeamMembers() {
    const { data, error } = await supabase.from("team_members").select("*").order("created_at", { ascending: false });
    if (error) return alert(error.message);
    setTeamMembers((data || []) as TeamMemberItem[]);
  }

  async function loadAccounts() {
    const { data, error } = await supabase.from("facebook_accounts").select("*").order("created_at", { ascending: false });
    if (error) return alert(error.message);

    const finalAccounts = await Promise.all(
      ((data || []) as AccountItem[]).map(async (account) => {
        if (!account.profile_image_path) return account;
        const signedUrl = await createSignedUrl("account-images", account.profile_image_path);
        return { ...account, profile_image_signed_url: signedUrl || account.profile_image_url || "" };
      })
    );

    setAccounts(finalAccounts);
  }

  async function loadPages() {
    const { data, error } = await supabase.from("facebook_pages").select("*").order("created_at", { ascending: false });
    if (error) return alert(error.message);
    setPages((data || []) as PageItem[]);
  }

  async function loadVideos() {
    const { data, error } = await supabase.from("videos").select("*").order("created_at", { ascending: false });
    if (error) return alert(error.message);

    const finalVideos = await Promise.all(
      ((data || []) as VideoItem[]).map(async (video) => {
        if (!video.storage_path) return video;
        const signedUrl = await createSignedUrl("videos", video.storage_path);
        return { ...video, signed_url: signedUrl || video.file_url || "" };
      })
    );

    setVideos(finalVideos);
  }

  async function loadActivityLogs() {
    const { data } = await supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(30);
    setActivityLogs((data || []) as ActivityLogItem[]);
  }

  function getAccount(id?: string | null) {
    return accounts.find((item) => item.id === id);
  }

  function getPage(id?: string | null) {
    return pages.find((item) => item.id === id);
  }

  function getTeamMember(id?: string | null) {
    return teamMembers.find((item) => item.id === id);
  }

  function getTeamMemberName(id?: string | null) {
    return getTeamMember(id)?.name || "No Team";
  }

  function getAccountPages(accountId?: string | null) {
    return pages.filter((page) => page.facebook_account_id === accountId);
  }

  function getPageVideos(pageId?: string | null) {
    return videos.filter((video) => video.page_id === pageId);
  }

  function getAccountVideos(accountId?: string | null) {
    const accountPageIds = getAccountPages(accountId).map((page) => page.id);
    return videos.filter((video) => accountPageIds.includes(video.page_id || ""));
  }

  async function saveTeamMember() {
    if (!memberName || !memberEmail) return alert("Member Name aur Email dono likho");

    setSavingMember(true);
    const { data, error } = await supabase
      .from("team_members")
      .insert({ name: memberName, email: memberEmail, role: "member", status: "active" })
      .select("id")
      .single();
    setSavingMember(false);

    if (error) return alert(error.message);

    setMemberName("");
    setMemberEmail("");
    await createActivityLog(`Team member added: ${memberName}`, "team_members", data?.id);
    loadTeamMembers();
  }

  async function saveAccount() {
    if (!accountName || !accountEmail) return alert("Account Name aur Email dono likho");

    setSavingAccount(true);

    let imagePath: string | null = null;

    if (accountProfileImage) {
      const cleanFileName = cleanPathPart(accountProfileImage.name);
      imagePath = `${Date.now()}-${cleanFileName}`;

      const uploadResult = await supabase.storage.from("account-images").upload(imagePath, accountProfileImage);

      if (uploadResult.error) {
        setSavingAccount(false);
        alert(uploadResult.error.message);
        return;
      }
    }

    const { data, error } = await supabase
      .from("facebook_accounts")
      .insert({
        team_member_id: accountTeamMemberId || null,
        account_name: accountName,
        login_email: accountEmail,
        account_link: accountLink || null,
        date_of_birth: accountDob || null,
        two_factor_status: accountTwoFactor,
        facebook_key: accountFacebookKey || null,
        profile_image_url: null,
        profile_image_path: imagePath,
        account_status: "active",
      })
      .select("id")
      .single();

    setSavingAccount(false);

    if (error) return alert(error.message);

    await createActivityLog(`Facebook account added: ${accountName}`, "facebook_accounts", data?.id, accountTeamMemberId || null);

    setAccountName("");
    setAccountEmail("");
    setAccountLink("");
    setAccountDob("");
    setAccountTwoFactor("off");
    setAccountFacebookKey("");
    setAccountTeamMemberId("");
    setAccountProfileImage(null);

    const imageInput = document.getElementById("accountImageFile") as HTMLInputElement;
    if (imageInput) imageInput.value = "";

    loadAccounts();
  }

  async function savePage() {
    if (!pageName || !pageLink || !pageCategory || !pageAccountId) {
      alert("Page Name, Page Link, Page Category aur Account select karo");
      return;
    }

    setSavingPage(true);

    const { data, error } = await supabase
      .from("facebook_pages")
      .insert({
        facebook_account_id: pageAccountId,
        team_member_id: pageTeamMemberId || null,
        page_name: pageName,
        page_link: pageLink,
        drive_folder_link: driveFolderLink || null,
        page_category: pageCategory,
        page_status: "active",
        page_health: pageHealth,
        followers_count: Number(pageFollowers || 0),
        monthly_views: Number(pageViews || 0),
        monthly_reach: Number(pageReach || 0),
      })
      .select("id")
      .single();

    setSavingPage(false);

    if (error) return alert(error.message);

    await createActivityLog(`Facebook page added: ${pageName}`, "facebook_pages", data?.id, pageTeamMemberId || getAccount(pageAccountId)?.team_member_id || null);

    setPageName("");
    setPageLink("");
    setDriveFolderLink("");
    setPageCategory("");
    setPageAccountId("");
    setPageTeamMemberId("");
    setPageHealth("unknown");
    setPageFollowers("");
    setPageViews("");
    setPageReach("");
    loadPages();
  }

  async function saveVideos() {
    if (!selectedPageId || videoFiles.length === 0) {
      alert("Page aur video file/folder select karo");
      return;
    }

    const selectedPage = getPage(selectedPageId);
    const pageFolder = cleanPathPart(selectedPage?.page_name || selectedPageId);

    setSavingVideo(true);
    setUploadProgress(`Uploading 0/${videoFiles.length}`);

    const rowsToInsert: Partial<VideoItem>[] = [];

    for (let index = 0; index < videoFiles.length; index++) {
      const file = videoFiles[index];
      const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
      const parts = relativePath.replace(/\\/g, "/").split("/");
      const folderName = parts.length > 1 ? parts[0] : "Single Uploads";
      const cleanFolderName = cleanPathPart(folderName);
      const cleanFileName = cleanPathPart(file.name);
      const storagePath = `${pageFolder}/${cleanFolderName}/${Date.now()}-${index + 1}-${cleanFileName}`;

      const uploadResult = await supabase.storage.from("videos").upload(storagePath, file);

      if (uploadResult.error) {
        setSavingVideo(false);
        setUploadProgress("");
        alert(uploadResult.error.message);
        return;
      }

      rowsToInsert.push({
        page_id: selectedPageId,
        video_name: videoName ? `${videoName} ${index + 1}` : fileBaseName(file.name),
        file_name: file.name,
        file_url: null,
        storage_path: storagePath,
        folder_name: folderName,
        relative_path: relativePath,
      });

      setUploadProgress(`Uploading ${index + 1}/${videoFiles.length}`);
    }

    const { error } = await supabase.from("videos").insert(rowsToInsert);

    setSavingVideo(false);

    if (error) return alert(error.message);

    await createActivityLog(`${videoFiles.length} video(s) uploaded to ${selectedPage?.page_name || "page"}`, "videos", selectedPageId, selectedPage?.team_member_id || getAccount(selectedPage?.facebook_account_id)?.team_member_id || null);

    setVideoName("");
    setSelectedPageId("");
    setVideoFiles([]);
    setUploadProgress("");

    const input = document.getElementById("videoUploadInput") as HTMLInputElement;
    if (input) input.value = "";

    loadVideos();
  }

  async function editTeamMember(member: TeamMemberItem) {
    if (!member.id) return;
    const newName = prompt("New member name:", member.name);
    if (newName === null) return;
    const newEmail = prompt("New email:", member.email || "");
    if (newEmail === null) return;

    const { error } = await supabase.from("team_members").update({ name: newName, email: newEmail }).eq("id", member.id);
    if (error) return alert(error.message);

    await createActivityLog(`Team member edited: ${newName}`, "team_members", member.id);
    loadTeamMembers();
  }

  async function editAccount(account: AccountItem) {
    if (!account.id) return;

    const newName = prompt("New account name:", account.account_name);
    if (newName === null) return;
    const newEmail = prompt("New email:", account.login_email || "");
    if (newEmail === null) return;
    const newLink = prompt("Facebook account/profile link:", account.account_link || "");
    if (newLink === null) return;
    const newDob = prompt("New DOB YYYY-MM-DD:", account.date_of_birth || "");
    if (newDob === null) return;
    const newTwoFactor = prompt("2FA status likho: on ya off", account.two_factor_status || "off");
    if (newTwoFactor === null) return;
    const newFacebookKey = prompt("API Key / Token optional:", account.facebook_key || "");
    if (newFacebookKey === null) return;
    const newStatus = prompt("Status active/inactive:", account.account_status || "active");
    if (newStatus === null) return;

    const { error } = await supabase
      .from("facebook_accounts")
      .update({
        account_name: newName,
        login_email: newEmail,
        account_link: newLink || null,
        date_of_birth: newDob || null,
        two_factor_status: newTwoFactor || "off",
        facebook_key: newFacebookKey || null,
        account_status: newStatus || "active",
      })
      .eq("id", account.id);

    if (error) return alert(error.message);

    await createActivityLog(`Facebook account edited: ${newName}`, "facebook_accounts", account.id, account.team_member_id || null);
    loadAccounts();
  }

  async function editPage(page: PageItem) {
    const newName = prompt("New page name:", page.page_name);
    if (newName === null) return;
    const newLink = prompt("New page link:", page.page_link);
    if (newLink === null) return;
    const newDriveLink = prompt("Google Drive folder link:", page.drive_folder_link || "");
    if (newDriveLink === null) return;
    const newCategory = prompt("New page category:", page.page_category || "");
    if (newCategory === null) return;
    const newHealth = prompt("Page health: good / average / red / unknown", page.page_health || "unknown");
    if (newHealth === null) return;
    const newFollowers = prompt("Followers count:", String(page.followers_count || 0));
    if (newFollowers === null) return;
    const newViews = prompt("Monthly views:", String(page.monthly_views || 0));
    if (newViews === null) return;
    const newReach = prompt("Monthly reach:", String(page.monthly_reach || 0));
    if (newReach === null) return;
    const newStatus = prompt("Status active/inactive:", page.page_status || "active");
    if (newStatus === null) return;

    const { error } = await supabase
      .from("facebook_pages")
      .update({
        page_name: newName,
        page_link: newLink,
        drive_folder_link: newDriveLink || null,
        page_category: newCategory,
        page_health: newHealth || "unknown",
        followers_count: Number(newFollowers || 0),
        monthly_views: Number(newViews || 0),
        monthly_reach: Number(newReach || 0),
        page_status: newStatus || "active",
      })
      .eq("id", page.id);

    if (error) return alert(error.message);

    await createActivityLog(`Facebook page edited: ${newName}`, "facebook_pages", page.id, page.team_member_id || getAccount(page.facebook_account_id)?.team_member_id || null);
    loadPages();
  }

  async function editVideo(video: VideoItem) {
    if (!video.id) return;
    const newName = prompt("New video name:", video.video_name);
    if (newName === null) return;

    const { error } = await supabase.from("videos").update({ video_name: newName }).eq("id", video.id);
    if (error) return alert(error.message);

    await createActivityLog(`Video edited: ${newName}`, "videos", video.id);
    loadVideos();
  }

  async function deleteTeamMember(id?: string) {
    if (!id) return;

    showActionToast("Deleting team member...", "info");

    const { error } = await supabase.from("team_members").delete().eq("id", id);
    if (error) {
      showActionToast("Team member delete failed", "error");
      return alert(error.message);
    }

    await createActivityLog("Team member deleted", "team_members", id);
    await loadTeamMembers();
    await loadAccounts();
    await loadPages();

    showActionToast("Team member deleted successfully", "success");
  }
  async function deleteAccount(account: AccountItem) {
    if (!account.id) return;

    showActionToast("Deleting account...", "info");

    if (account.profile_image_path) await supabase.storage.from("account-images").remove([account.profile_image_path]);

    const { error } = await supabase.from("facebook_accounts").delete().eq("id", account.id);
    if (error) {
      showActionToast("Account delete failed", "error");
      return alert(error.message);
    }

    await createActivityLog(`Facebook account deleted: ${account.account_name}`, "facebook_accounts", account.id, account.team_member_id || null);
    await loadAccounts();
    await loadPages();

    showActionToast("Account deleted successfully", "success");
  }
  async function deletePage(id?: string) {
    if (!id) return;
    const page = getPage(id);

    showActionToast("Deleting page...", "info");

    const pageVideos = videos.filter((video) => video.page_id === id);
    const paths = pageVideos.map((video) => video.storage_path).filter(Boolean) as string[];

    if (paths.length > 0) await supabase.storage.from("videos").remove(paths);

    const { error } = await supabase.from("facebook_pages").delete().eq("id", id);
    if (error) {
      showActionToast("Page delete failed", "error");
      return alert(error.message);
    }

    await createActivityLog(`Facebook page deleted: ${page?.page_name || "page"}`, "facebook_pages", id, page?.team_member_id || null);
    await loadPages();
    await loadVideos();

    showActionToast("Page deleted successfully", "success");
  }
  async function deleteVideosList(list: VideoItem[], label: string) {
    if (list.length === 0) return alert("No videos found");

    const paths = list.map((video) => video.storage_path).filter(Boolean) as string[];
    const ids = list.map((video) => video.id).filter(Boolean) as string[];

    showActionToast(`Deleting ${label} in background...`, "info");

    if (ids.length > 0) {
      setVideos((current) => current.filter((video) => !video.id || !ids.includes(video.id)));
    }

    const storagePromise = paths.length > 0
      ? supabase.storage.from("videos").remove(paths)
      : Promise.resolve({ error: null });

    const databasePromise = ids.length > 0
      ? supabase.from("videos").delete().in("id", ids)
      : Promise.resolve({ error: null });

    const [storageResult, databaseResult] = await Promise.all([storagePromise, databasePromise]);

    if (storageResult.error || databaseResult.error) {
      showActionToast("Delete failed, refreshing data...", "error");
      await loadVideos();
      return alert(storageResult.error?.message || databaseResult.error?.message || "Delete failed");
    }

    await createActivityLog(`${label} deleted (${list.length} videos)`, "videos");

    showActionToast(`${label} deleted successfully`, "success");
  }

  async function deleteVideo(video: VideoItem) {
    if (!video.id) return;
    await deleteVideosList([video], `Video ${video.video_name}`);
  }

  const activeAccounts = accounts.filter((item) => (item.account_status || "active") === "active");
  const inactiveAccounts = accounts.filter((item) => (item.account_status || "active") === "inactive");
  const twoFactorOn = accounts.filter((item) => item.two_factor_status === "on");
  const twoFactorOff = accounts.filter((item) => item.two_factor_status !== "on");
  const accountsWithLink = accounts.filter((item) => !!item.account_link);
  const activePages = pages.filter((item) => (item.page_status || "active") === "active");
  const inactivePages = pages.filter((item) => (item.page_status || "active") === "inactive");
  const pagesWithVideos = pages.filter((page) => getPageVideos(page.id).length > 0);
  const redPages = pages.filter((page) => page.page_health === "red");
  const goodPages = pages.filter((page) => page.page_health === "good");
  const pagesWithoutAccount = pages.filter((page) => !page.facebook_account_id);
  const pagesWithoutCategory = pages.filter((page) => !page.page_category);

  const searchResults = useMemo(() => {
    const q = text(searchQuery);

    const team = teamMembers.filter((member) => {
      const haystack = searchText([member.name, member.email, member.role, member.status]);
      return !q || haystack.includes(q);
    });

    const resultAccounts = accounts.filter((account) => {
      const accountPages = getAccountPages(account.id);
      const accountVideos = getAccountVideos(account.id);
      const member = getTeamMember(account.team_member_id);

      const haystack = searchText([
        account.account_name,
        account.login_email,
        account.account_link,
        account.account_status,
        account.two_factor_status,
        member?.name,
        accountPages.map((page) => page.page_name).join(" "),
        accountVideos.map((video) => `${video.video_name} ${video.file_name} ${video.folder_name}`).join(" "),
      ]);

      return !q || haystack.includes(q);
    });

    const resultPages = pages.filter((page) => {
      const account = getAccount(page.facebook_account_id);
      const member = getTeamMember(page.team_member_id || account?.team_member_id);
      const pageVideos = getPageVideos(page.id);

      const haystack = searchText([
        page.page_name,
        page.page_link,
        page.drive_folder_link,
        page.page_category,
        page.page_status,
        page.page_health,
        account?.account_name,
        account?.login_email,
        member?.name,
        pageVideos.map((video) => `${video.video_name} ${video.file_name} ${video.folder_name}`).join(" "),
      ]);

      return !q || haystack.includes(q);
    });

    const resultVideos = videos.filter((video) => {
      const page = getPage(video.page_id);
      const account = getAccount(page?.facebook_account_id);

      const haystack = searchText([
        video.video_name,
        video.file_name,
        video.folder_name,
        video.relative_path,
        page?.page_name,
        page?.page_link,
        account?.account_name,
        account?.login_email,
      ]);

      return !q || haystack.includes(q);
    });

    return { team, accounts: resultAccounts, pages: resultPages, videos: resultVideos };
  }, [searchQuery, teamMembers, accounts, pages, videos]);

  const visibleTeamMembers = useMemo(() => {
    const q = text(searchQuery);
    return teamMembers.filter((member) => {
      const memberAccounts = accounts.filter((account) => account.team_member_id === member.id);
      const memberPages = pages.filter((page) => page.team_member_id === member.id || memberAccounts.some((account) => account.id === page.facebook_account_id));
      const memberVideos = videos.filter((video) => memberPages.some((page) => page.id === video.page_id));
      const haystack = searchText([
        member.name,
        member.email,
        memberAccounts.map((account) => account.account_name).join(" "),
        memberPages.map((page) => page.page_name).join(" "),
        memberVideos.map((video) => video.video_name).join(" "),
      ]);
      return !q || haystack.includes(q);
    });
  }, [teamMembers, accounts, pages, videos, searchQuery]);

  const visibleAccounts = useMemo(() => {
    const q = text(searchQuery);
    return accounts.filter((account) => {
      const accountPages = getAccountPages(account.id);
      const accountVideos = getAccountVideos(account.id);
      const member = getTeamMember(account.team_member_id);
      const haystack = searchText([
        account.account_name,
        account.login_email,
        account.account_link,
        account.account_status,
        account.two_factor_status,
        member?.name,
        accountPages.map((page) => page.page_name).join(" "),
        accountVideos.map((video) => video.video_name).join(" "),
      ]);
      return !q || haystack.includes(q);
    });
  }, [accounts, pages, videos, teamMembers, searchQuery]);

  const visiblePages = useMemo(() => {
    const q = text(searchQuery);
    return pages.filter((page) => {
      const account = getAccount(page.facebook_account_id);
      const member = getTeamMember(page.team_member_id || account?.team_member_id);
      const pageVideos = getPageVideos(page.id);
      const haystack = searchText([
        page.page_name,
        page.page_link,
        page.drive_folder_link,
        page.page_category,
        page.page_health,
        account?.account_name,
        account?.login_email,
        member?.name,
        pageVideos.map((video) => video.video_name).join(" "),
      ]);
      return !q || haystack.includes(q);
    });
  }, [pages, accounts, videos, teamMembers, searchQuery]);

  const videoGroups = useMemo(() => {
    const map = new Map<string, VideoGroup>();

    videos.forEach((video) => {
      const page = getPage(video.page_id);
      const account = getAccount(page?.facebook_account_id);
      const pageId = video.page_id || "no-page";
      const folderName = video.folder_name || "Single Uploads";
      const key = `${pageId}::${folderName}`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          pageId,
          pageName: page?.page_name || "No Page",
          folderName,
          accountName: account?.account_name || "No Account",
          videos: [],
          latestDate: video.created_at,
        });
      }

      const group = map.get(key);
      if (group) {
        group.videos.push(video);
        if (!group.latestDate || (video.created_at && video.created_at > group.latestDate)) {
          group.latestDate = video.created_at;
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => (b.latestDate || "").localeCompare(a.latestDate || ""));
  }, [videos, pages, accounts]);

  const visibleVideoGroups = useMemo(() => {
    const q = text(searchQuery);
    return videoGroups.filter((group) => {
      const haystack = searchText([
        group.pageName,
        group.folderName,
        group.accountName,
        group.videos.map((video) => `${video.video_name} ${video.file_name} ${video.relative_path}`).join(" "),
      ]);
      return !q || haystack.includes(q);
    });
  }, [videoGroups, searchQuery]);

  const teamStats = useMemo(() => {
    return teamMembers
      .map((member) => {
        const memberAccounts = accounts.filter((account) => account.team_member_id === member.id);
        const memberPages = pages.filter((page) => {
          const pageAccount = getAccount(page.facebook_account_id);
          return page.team_member_id === member.id || pageAccount?.team_member_id === member.id;
        });
        const memberPageIds = memberPages.map((page) => page.id);
        const memberVideos = videos.filter((video) => memberPageIds.includes(video.page_id || ""));
        const good = memberPages.filter((page) => page.page_health === "good").length;
        const red = memberPages.filter((page) => page.page_health === "red").length;
        const score = memberAccounts.length * 5 + memberPages.length * 8 + memberVideos.length + good * 10 - red * 8;

        return {
          member,
          accounts: memberAccounts.length,
          pages: memberPages.length,
          videos: memberVideos.length,
          good,
          red,
          score: Math.max(0, score),
          health: red > 0 ? "Needs Attention" : good > 0 || memberVideos.length > 0 ? "Good" : "Starting",
          bestPages: memberPages.filter((page) => page.page_health === "good").slice(0, 3),
          weakPages: memberPages.filter((page) => page.page_health === "red").slice(0, 3),
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [teamMembers, accounts, pages, videos]);

  const categoryStats = useMemo(() => {
    const map = new Map<string, number>();
    pages.forEach((page) => {
      const category = page.page_category || "No Category";
      map.set(category, (map.get(category) || 0) + 1);
    });

    return Array.from(map.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }, [pages]);

  const systemWarnings = [
    { title: "2FA Off Accounts", value: twoFactorOff.length, tone: "orange" as const },
    { title: "Pages Without Videos", value: pages.length - pagesWithVideos.length, tone: "red" as const },
    { title: "Red Health Pages", value: redPages.length, tone: "red" as const },
    { title: "Pages Without Account", value: pagesWithoutAccount.length, tone: "orange" as const },
    { title: "Pages Without Category", value: pagesWithoutCategory.length, tone: "orange" as const },
  ];

  const dashboardHealthScore = percent(twoFactorOn.length + pagesWithVideos.length + activePages.length + accountsWithLink.length, accounts.length + pages.length + pages.length + accounts.length);

  function toggleGroup(key: string) {
    setExpandedGroups((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
          <p className="text-lg font-bold">Loading Content OS...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 p-4">
        <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-white p-1 shadow-2xl">
          <div className="rounded-[1.8rem] bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 p-8 text-white">
            <p className="mb-4 inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-blue-100">Secure Login</p>
            <h1 className="text-4xl font-black">Content OS</h1>
            <p className="mt-3 text-sm text-blue-100">Ultra premium Facebook content management control room.</p>

            <div className="mt-8 space-y-4">
              <input className="h-12 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-sm text-white outline-none placeholder:text-blue-100 focus:border-blue-300 focus:ring-4 focus:ring-blue-300/10" placeholder="Email" value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} />
              <input className="h-12 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-sm text-white outline-none placeholder:text-blue-100 focus:border-blue-300 focus:ring-4 focus:ring-blue-300/10" placeholder="Password" type="password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") loginUser(); }} />
              <button onClick={loginUser} disabled={loginLoading} className="h-12 w-full rounded-2xl bg-white text-sm font-black text-slate-950 shadow-lg hover:bg-blue-50 disabled:opacity-60">
                {loginLoading ? "Logging in..." : "Login"}
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={mainClass}>
      <div className={shellClass}>
        <aside className={sidebarClass}>
          <div className="rounded-[1.75rem] bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 p-5 text-white shadow-2xl shadow-blue-950/20">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-100">Workspace</p>
            <h2 className="mt-2 text-3xl font-black">Content OS</h2>
            <p className="mt-2 text-xs font-semibold leading-5 text-blue-100">Ultra premium control room for accounts, pages, videos and team performance.</p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-xl font-black">{accounts.length}</p>
                <p className="text-[10px] font-bold text-blue-100">Accounts</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-xl font-black">{pages.length}</p>
                <p className="text-[10px] font-bold text-blue-100">Pages</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-xl font-black">{videos.length}</p>
                <p className="text-[10px] font-bold text-blue-100">Videos</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setSideMenuOpen(!sideMenuOpen)}
            className={
              darkMode
                ? "mt-5 flex w-full items-center justify-between rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-left text-sm font-black text-slate-200 hover:bg-slate-800"
                : "mt-5 flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-black text-slate-800 hover:bg-slate-100"
            }
          >
            <span>Menu</span>
            <span>{sideMenuOpen ? "Close" : "Open"}</span>
          </button>

          {sideMenuOpen && (
            <nav className="mt-3 grid gap-2">
              <TabButton tab="dashboard" label="Main Dashboard" short="MD" activeTab={activeTab} darkMode={darkMode} />
              <TabButton tab="team" label="Team Members" short="TM" activeTab={activeTab} darkMode={darkMode} />
              <TabButton tab="accounts" label="Facebook Accounts" short="FA" activeTab={activeTab} darkMode={darkMode} />
              <TabButton tab="pages" label="Facebook Pages" short="FP" activeTab={activeTab} darkMode={darkMode} />
              <TabButton tab="videos" label="Videos" short="VD" activeTab={activeTab} darkMode={darkMode} />
            </nav>
          )}

          <div className="mt-5 grid gap-2">
            <button onClick={() => setSearchOpen(true)} className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-left text-sm font-black text-white shadow-lg shadow-blue-600/20">
              Open Search Panel
            </button>

            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className={darkMode ? "rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-left text-sm font-black text-slate-200" : "rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-black text-slate-800"}>
                Clear Search: {searchQuery}
              </button>
            )}

            <button onClick={() => setDarkMode(!darkMode)} className={darkMode ? "rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-left text-sm font-black text-slate-200 hover:bg-slate-800" : "rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-black text-slate-800 hover:bg-slate-100"}>
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>

            <button onClick={logoutUser} className="rounded-2xl bg-red-600 px-4 py-3 text-left text-sm font-black text-white hover:bg-red-700">
              Logout
            </button>
          </div>

          <div className={`mt-5 rounded-3xl p-4 text-xs ${darkMode ? "bg-slate-900 text-slate-400" : "bg-slate-50 text-slate-600"}`}>
            <p className="font-black">Signed in</p>
            <p className="mt-1 break-all">{user.email}</p>
          </div>
        </aside>

        <div className="min-w-0">
          {activeTab === "dashboard" && (
            <section className={panelClass}>
              <PageHeader title="Main Dashboard" eyebrow="Control Room" description="Overall website analytics, account security, page health, team performance, content progress and recent activity. Forms are kept on dedicated management pages." mutedText={mutedText} />

              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-5">
                <MetricCard title="Team Members" value={teamMembers.length} note="Total saved members" tone="blue" darkMode={darkMode} />
                <MetricCard title="Accounts" value={accounts.length} note={`${activeAccounts.length} active · ${twoFactorOn.length} secured`} tone="green" darkMode={darkMode} />
                <MetricCard title="Pages" value={pages.length} note={`${activePages.length} active · ${goodPages.length} good`} tone="purple" darkMode={darkMode} />
                <MetricCard title="Videos" value={videos.length} note={`${videoGroups.length} grouped folders`} tone="orange" darkMode={darkMode} />
                <MetricCard title="System Health" value={`${dashboardHealthScore}%`} note="Overall process score" tone={dashboardHealthScore > 70 ? "green" : "orange"} darkMode={darkMode} />
              </div>

              <div className="mt-6 grid gap-6 2xl:grid-cols-[1.2fr_0.8fr]">
                <PremiumCard darkMode={darkMode}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-black">Process Progress</h3>
                      <p className={`mt-1 text-sm ${mutedText}`}>Security, activity and content coverage.</p>
                    </div>
                    <Badge tone={dashboardHealthScore > 70 ? "green" : "orange"}>{dashboardHealthScore}% Healthy</Badge>
                  </div>
                  <div className="mt-5 space-y-5">
                    <ProgressBar label="2FA Enabled Accounts" value={twoFactorOn.length} total={accounts.length} mutedText={mutedText} darkMode={darkMode} />
                    <ProgressBar label="Accounts With Facebook Link" value={accountsWithLink.length} total={accounts.length} mutedText={mutedText} darkMode={darkMode} />
                    <ProgressBar label="Active Pages" value={activePages.length} total={pages.length} mutedText={mutedText} darkMode={darkMode} />
                    <ProgressBar label="Pages With Videos" value={pagesWithVideos.length} total={pages.length} mutedText={mutedText} darkMode={darkMode} />
                  </div>
                </PremiumCard>

                <PremiumCard darkMode={darkMode}>
                  <h3 className="text-xl font-black">Priority Alerts</h3>
                  <div className="mt-5 grid gap-3">
                    {systemWarnings.map((item) => (
                      <div key={item.title} className={darkMode ? "flex items-center justify-between rounded-2xl bg-slate-950 p-4" : "flex items-center justify-between rounded-2xl bg-slate-50 p-4"}>
                        <div>
                          <p className="font-black">{item.title}</p>
                          <p className={`text-xs ${mutedText}`}>Needs review</p>
                        </div>
                        <Badge tone={item.tone}>{item.value}</Badge>
                      </div>
                    ))}
                  </div>
                </PremiumCard>
              </div>

              <div className="mt-6 grid gap-6 2xl:grid-cols-2">
                <PremiumCard darkMode={darkMode}>
                  <h3 className="text-xl font-black">Team Performance Leaderboard</h3>
                  <div className="mt-4 space-y-3">
                    {teamStats.length === 0 ? (
                      <p className={mutedText}>No team members yet.</p>
                    ) : (
                      teamStats.slice(0, 8).map((item, index) => (
                        <div key={item.member.id} className={darkMode ? "rounded-2xl bg-slate-950 p-4" : "rounded-2xl bg-slate-50 p-4"}>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="font-black">{index + 1}. {item.member.name}</p>
                              <p className={`break-all text-xs ${mutedText}`}>{item.member.email}</p>
                            </div>
                            <Badge tone={item.red > 0 ? "red" : item.score > 0 ? "green" : "slate"}>{item.health}</Badge>
                          </div>
                          <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                            <div><p className="font-black">{item.accounts}</p><p className={mutedText}>Accounts</p></div>
                            <div><p className="font-black">{item.pages}</p><p className={mutedText}>Pages</p></div>
                            <div><p className="font-black">{item.videos}</p><p className={mutedText}>Videos</p></div>
                            <div><p className="font-black">{item.score}</p><p className={mutedText}>Score</p></div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </PremiumCard>

                <PremiumCard darkMode={darkMode}>
                  <h3 className="text-xl font-black">Page Categories</h3>
                  <div className="mt-5 space-y-4">
                    {categoryStats.length === 0 ? (
                      <p className={mutedText}>No categories yet.</p>
                    ) : (
                      categoryStats.slice(0, 10).map((item) => (
                        <div key={item.category}>
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="font-black">{item.category}</span>
                            <span className={mutedText}>{item.count}</span>
                          </div>
                          <div className={darkMode ? "h-2 rounded-full bg-slate-800" : "h-2 rounded-full bg-slate-200"}>
                            <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600" style={{ width: `${percent(item.count, pages.length)}%` }} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </PremiumCard>
              </div>

              <div className="mt-6">
                <PremiumCard darkMode={darkMode}>
                  <h3 className="text-xl font-black">Recent Activity</h3>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {activityLogs.length === 0 ? (
                      <p className={mutedText}>No activity yet.</p>
                    ) : (
                      activityLogs.slice(0, 10).map((log) => (
                        <div key={log.id} className={darkMode ? "rounded-2xl bg-slate-950 p-4" : "rounded-2xl bg-slate-50 p-4"}>
                          <p className="font-black">{log.action}</p>
                          <p className={`mt-1 text-xs ${mutedText}`}>{log.table_name || "system"} · {formatDate(log.created_at)}</p>
                        </div>
                      ))
                    )}
                  </div>
                </PremiumCard>
              </div>
            </section>
          )}

          {activeTab === "team" && (
            <section className={panelClass}>
              <PageHeader title="Team Members" eyebrow="Team Management" description="Professional team performance view with accounts, pages, videos, best pages, weak pages and overall member health." mutedText={mutedText} right={<button onClick={() => setSearchOpen(true)} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">Search Team</button>} />

              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-5">
                <MetricCard title="Total Members" value={teamMembers.length} note="All team records" tone="blue" darkMode={darkMode} />
                <MetricCard title="Assigned Accounts" value={accounts.filter((item) => item.team_member_id).length} note="Linked to members" tone="green" darkMode={darkMode} />
                <MetricCard title="Assigned Pages" value={pages.filter((item) => item.team_member_id || getAccount(item.facebook_account_id)?.team_member_id).length} note="Owned pages" tone="purple" darkMode={darkMode} />
                <MetricCard title="Uploaded Videos" value={videos.length} note="Content handled" tone="orange" darkMode={darkMode} />
                <MetricCard title="Needs Attention" value={teamStats.filter((item) => item.red > 0).length} note="Red page health" tone="red" darkMode={darkMode} />
              </div>

              <PremiumCard darkMode={darkMode} className="mt-6">
                <h3 className="text-xl font-black">Add Team Member</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                  <input className={inputClass} placeholder="Member Name" value={memberName} onChange={(event) => setMemberName(event.target.value)} />
                  <input className={inputClass} placeholder="Email" value={memberEmail} onChange={(event) => setMemberEmail(event.target.value)} />
                  <button onClick={saveTeamMember} disabled={savingMember} className="h-12 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-60">
                    {savingMember ? "Saving..." : "+ Save Member"}
                  </button>
                </div>
              </PremiumCard>

              <div className="mt-6 grid gap-4 2xl:grid-cols-2">
                {visibleTeamMembers.length === 0 ? (
                  <p className={mutedText}>No team members found.</p>
                ) : (
                  visibleTeamMembers.map((member) => {
                    const stats = teamStats.find((item) => item.member.id === member.id);
                    return (
                      <PremiumCard key={member.id} darkMode={darkMode}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xl font-black">{member.name}</p>
                            <p className={`mt-1 break-all text-sm ${mutedText}`}>{member.email}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => editTeamMember(member)} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white">Edit</button>
                            <button onClick={() => deleteTeamMember(member.id)} className="rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white">Delete</button>
                          </div>
                        </div>

                        <div className="mt-5 grid grid-cols-4 gap-3 text-center text-sm">
                          <div className={darkMode ? "rounded-2xl bg-slate-950 p-3" : "rounded-2xl bg-slate-50 p-3"}><p className="text-xl font-black">{stats?.accounts || 0}</p><p className={mutedText}>Accounts</p></div>
                          <div className={darkMode ? "rounded-2xl bg-slate-950 p-3" : "rounded-2xl bg-slate-50 p-3"}><p className="text-xl font-black">{stats?.pages || 0}</p><p className={mutedText}>Pages</p></div>
                          <div className={darkMode ? "rounded-2xl bg-slate-950 p-3" : "rounded-2xl bg-slate-50 p-3"}><p className="text-xl font-black">{stats?.videos || 0}</p><p className={mutedText}>Videos</p></div>
                          <div className={darkMode ? "rounded-2xl bg-slate-950 p-3" : "rounded-2xl bg-slate-50 p-3"}><p className="text-xl font-black">{stats?.score || 0}</p><p className={mutedText}>Score</p></div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Badge tone={stats?.red ? "red" : "green"}>{stats?.health || "Starting"}</Badge>
                          <Badge tone="green">Good Pages: {stats?.good || 0}</Badge>
                          <Badge tone="red">Red Pages: {stats?.red || 0}</Badge>
                        </div>
                      </PremiumCard>
                    );
                  })
                )}
              </div>
            </section>
          )}

          {activeTab === "accounts" && (
            <section className={panelClass}>
              <PageHeader title="Facebook Accounts" eyebrow="Account Management" description="Premium account view with DP, linked team, status, 2FA, pages, videos and direct Facebook profile/account link." mutedText={mutedText} right={<button onClick={() => setSearchOpen(true)} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">Search Accounts</button>} />

              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-5">
                <MetricCard title="Total Accounts" value={accounts.length} note="Saved IDs" tone="blue" darkMode={darkMode} />
                <MetricCard title="Active" value={activeAccounts.length} note={`${inactiveAccounts.length} inactive`} tone="green" darkMode={darkMode} />
                <MetricCard title="2FA On" value={twoFactorOn.length} note={`${twoFactorOff.length} off`} tone="purple" darkMode={darkMode} />
                <MetricCard title="Profile Links" value={accountsWithLink.length} note="Clickable accounts" tone="orange" darkMode={darkMode} />
                <MetricCard title="With DP" value={accounts.filter((item) => item.profile_image_path).length} note="Profile images saved" tone="slate" darkMode={darkMode} />
              </div>

              <PremiumCard darkMode={darkMode} className="mt-6">
                <h3 className="text-xl font-black">Add Facebook Account</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
                  <input className={inputClass} placeholder="Account Name" value={accountName} onChange={(event) => setAccountName(event.target.value)} />
                  <input className={inputClass} placeholder="Login Email" value={accountEmail} onChange={(event) => setAccountEmail(event.target.value)} />
                  <input className={inputClass} placeholder="Facebook Account/Profile Link" value={accountLink} onChange={(event) => setAccountLink(event.target.value)} />
                  <input className={inputClass} type="date" value={accountDob} onChange={(event) => setAccountDob(event.target.value)} />
                  <select className={inputClass} value={accountTwoFactor} onChange={(event) => setAccountTwoFactor(event.target.value)}><option value="off">2FA Off</option><option value="on">2FA On</option></select>
                  <select className={inputClass} value={accountTeamMemberId} onChange={(event) => setAccountTeamMemberId(event.target.value)}><option value="">Select Team optional</option>{teamMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select>
                  <input id="accountImageFile" className={inputClass} type="file" accept="image/*" onChange={(event) => setAccountProfileImage(event.target.files?.[0] || null)} />
                  <input className={inputClass} type="password" placeholder="API Key / Token optional" value={accountFacebookKey} onChange={(event) => setAccountFacebookKey(event.target.value)} />
                  <button onClick={saveAccount} disabled={savingAccount} className="h-12 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-60">
                    {savingAccount ? "Saving..." : "+ Save Account"}
                  </button>
                </div>
              </PremiumCard>

              <div className="mt-6 grid gap-4 2xl:grid-cols-2">
                {visibleAccounts.length === 0 ? (
                  <p className={mutedText}>No accounts found.</p>
                ) : (
                  visibleAccounts.map((account) => {
                    const accountPages = getAccountPages(account.id);
                    const accountVideos = getAccountVideos(account.id);
                    return (
                      <PremiumCard key={account.id} darkMode={darkMode}>
                        <div className="flex gap-4">
                          {account.profile_image_signed_url ? <img src={account.profile_image_signed_url} alt="Account DP" className="h-20 w-20 rounded-3xl border object-cover" /> : <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-200 text-xs font-bold text-slate-500">No DP</div>}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-xl font-black">{account.account_name}</p>
                                <p className={`break-all text-sm ${mutedText}`}>{account.login_email}</p>
                                <p className={`mt-1 text-xs ${mutedText}`}>Team: {getTeamMemberName(account.team_member_id)}</p>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => editAccount(account)} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white">Edit</button>
                                <button onClick={() => deleteAccount(account)} className="rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white">Delete</button>
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <Badge tone="green">{account.account_status || "active"}</Badge>
                              <Badge tone="blue">Pages: {accountPages.length}</Badge>
                              <Badge tone="purple">Videos: {accountVideos.length}</Badge>
                              <Badge tone="orange">2FA: {account.two_factor_status || "off"}</Badge>
                              <Badge tone="slate">Link: {account.account_link ? "Added" : "Missing"}</Badge>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              {account.account_link && <a href={safeLink(account.account_link)} target="_blank" rel="noreferrer" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">Open Facebook Account</a>}
                              {account.profile_image_signed_url && <button onClick={() => downloadFromStorage("account-images", account.profile_image_path)} className="rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white">Download DP</button>}
                            </div>
                          </div>
                        </div>
                      </PremiumCard>
                    );
                  })
                )}
              </div>
            </section>
          )}

          {activeTab === "pages" && (
            <section className={panelClass}>
              <PageHeader title="Facebook Pages" eyebrow="Page Management" description="Premium page view with connected Facebook ID, account DP, team owner, clickable Facebook page link, health metrics and content progress." mutedText={mutedText} right={<button onClick={() => setSearchOpen(true)} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">Search Pages</button>} />

              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-5">
                <MetricCard title="Total Pages" value={pages.length} note="Saved pages" tone="blue" darkMode={darkMode} />
                <MetricCard title="Active Pages" value={activePages.length} note={`${inactivePages.length} inactive`} tone="green" darkMode={darkMode} />
                <MetricCard title="With Videos" value={pagesWithVideos.length} note="Content attached" tone="purple" darkMode={darkMode} />
                <MetricCard title="Good Health" value={goodPages.length} note={`${redPages.length} red`} tone="orange" darkMode={darkMode} />
                <MetricCard title="Total Reach" value={compactNumber(pages.reduce((sum, page) => sum + Number(page.monthly_reach || 0), 0))} note="Manual metric" tone="slate" darkMode={darkMode} />
              </div>

              <PremiumCard darkMode={darkMode} className="mt-6">
                <h3 className="text-xl font-black">Add Facebook Page</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2 2xl:grid-cols-6">
                  <input className={inputClass} placeholder="Page Name" value={pageName} onChange={(event) => setPageName(event.target.value)} />
                  <input className={inputClass} placeholder="Page Link" value={pageLink} onChange={(event) => setPageLink(event.target.value)} />
                  <input className={inputClass} placeholder="Google Drive Folder Link" value={driveFolderLink} onChange={(event) => setDriveFolderLink(event.target.value)} />
                  <select className={inputClass} value={pageCategory} onChange={(event) => setPageCategory(event.target.value)}><option value="">Select Category</option>{pageCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select>
                  <select className={inputClass} value={pageAccountId} onChange={(event) => setPageAccountId(event.target.value)}><option value="">Select Account</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.account_name}</option>)}</select>
                  <select className={inputClass} value={pageTeamMemberId} onChange={(event) => setPageTeamMemberId(event.target.value)}><option value="">Team optional</option>{teamMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select>
                  <select className={inputClass} value={pageHealth} onChange={(event) => setPageHealth(event.target.value)}><option value="unknown">Health Unknown</option><option value="good">Good</option><option value="average">Average</option><option value="red">Red</option></select>
                  <input className={inputClass} placeholder="Followers" value={pageFollowers} onChange={(event) => setPageFollowers(event.target.value)} />
                  <input className={inputClass} placeholder="Monthly Views" value={pageViews} onChange={(event) => setPageViews(event.target.value)} />
                  <input className={inputClass} placeholder="Monthly Reach" value={pageReach} onChange={(event) => setPageReach(event.target.value)} />
                  <button onClick={savePage} disabled={savingPage} className="h-12 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-60">
                    {savingPage ? "Saving..." : "+ Save Page"}
                  </button>
                </div>
              </PremiumCard>

              <div className="mt-6 grid gap-4 2xl:grid-cols-2">
                {visiblePages.length === 0 ? (
                  <p className={mutedText}>No pages found.</p>
                ) : (
                  visiblePages.map((page) => {
                    const account = getAccount(page.facebook_account_id);
                    const pageVideos = getPageVideos(page.id);
                    return (
                      <PremiumCard key={page.id} darkMode={darkMode}>
                        <div className="flex gap-4">
                          {account?.profile_image_signed_url ? <img src={account.profile_image_signed_url} alt="Account DP" className="h-20 w-20 rounded-3xl border object-cover" /> : <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-200 text-xs font-bold text-slate-500">No ID DP</div>}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-xl font-black">{page.page_name}</p>
                                <p className={`break-all text-sm ${mutedText}`}>{page.page_link}</p>
                                <p className={`mt-1 text-xs ${mutedText}`}>ID: {account?.account_name || "No Account"} · {account?.login_email || "No Email"}</p>
                                <p className={`text-xs ${mutedText}`}>Team: {getTeamMemberName(page.team_member_id || account?.team_member_id)}</p>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => editPage(page)} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white">Edit</button>
                                <button onClick={() => deletePage(page.id)} className="rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white">Delete</button>
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <Badge tone="green">{page.page_status || "active"}</Badge>
                              <Badge tone={page.page_health === "red" ? "red" : page.page_health === "good" ? "green" : "orange"}>Health: {page.page_health || "unknown"}</Badge>
                              <Badge tone="blue">Videos: {pageVideos.length}</Badge>
                              <Badge tone="purple">{page.page_category || "No Category"}</Badge>
                            </div>

                            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                              <div className={darkMode ? "rounded-2xl bg-slate-950 p-3" : "rounded-2xl bg-slate-50 p-3"}><p className="font-black">{compactNumber(page.followers_count)}</p><p className={mutedText}>Followers</p></div>
                              <div className={darkMode ? "rounded-2xl bg-slate-950 p-3" : "rounded-2xl bg-slate-50 p-3"}><p className="font-black">{compactNumber(page.monthly_views)}</p><p className={mutedText}>Views</p></div>
                              <div className={darkMode ? "rounded-2xl bg-slate-950 p-3" : "rounded-2xl bg-slate-50 p-3"}><p className="font-black">{compactNumber(page.monthly_reach)}</p><p className={mutedText}>Reach</p></div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <a href={safeLink(page.page_link)} target="_blank" rel="noreferrer" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">Open Facebook Page</a>
                              {page.drive_folder_link && <a href={safeLink(page.drive_folder_link)} target="_blank" rel="noreferrer" className="rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white">Open Drive Folder</a>}
                              {account?.account_link && <a href={safeLink(account.account_link)} target="_blank" rel="noreferrer" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white">Open Linked ID</a>}
                            </div>
                          </div>
                        </div>
                      </PremiumCard>
                    );
                  })
                )}
              </div>
            </section>
          )}

          {activeTab === "videos" && (
            <section className={panelClass}>
              <PageHeader title="Videos" eyebrow="Video Library" description="Grouped video library by Facebook page and folder. Hundreds of videos stay inside one clean folder card instead of flooding the page." mutedText={mutedText} right={<button onClick={() => setSearchOpen(true)} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">Search Videos</button>} />

              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-5">
                <MetricCard title="Total Videos" value={videos.length} note="Uploaded files" tone="blue" darkMode={darkMode} />
                <MetricCard title="Folders" value={videoGroups.length} note="Grouped batches" tone="green" darkMode={darkMode} />
                <MetricCard title="Pages With Videos" value={pagesWithVideos.length} note="Content pages" tone="purple" darkMode={darkMode} />
                <MetricCard title="Folder Uploads" value={videos.filter((item) => item.folder_name && item.folder_name !== "Single Uploads").length} note="Folder based" tone="orange" darkMode={darkMode} />
                <MetricCard title="Single Uploads" value={videos.filter((item) => !item.folder_name || item.folder_name === "Single Uploads").length} note="Single files" tone="slate" darkMode={darkMode} />
              </div>

              <PremiumCard darkMode={darkMode} className="mt-6">
                <h3 className="text-xl font-black">Upload Videos</h3>
                <p className={`mt-1 text-sm ${mutedText}`}>Folder upload will be stored under Page Name → Folder Name → Original File Name.</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2 2xl:grid-cols-5">
                  <input className={inputClass} placeholder="Video batch name optional" value={videoName} onChange={(event) => setVideoName(event.target.value)} />
                  <select className={inputClass} value={selectedPageId} onChange={(event) => setSelectedPageId(event.target.value)}><option value="">Select Page</option>{pages.map((page) => <option key={page.id} value={page.id}>{page.page_name}</option>)}</select>
                  <select className={inputClass} value={uploadMode} onChange={(event) => { setUploadMode(event.target.value as "folder" | "files"); setVideoFiles([]); }}><option value="folder">Upload Complete Folder</option><option value="files">Upload Multiple Files</option></select>
                  {uploadMode === "folder" ? (
                    <input key="folder" id="videoUploadInput" className={inputClass} type="file" accept="video/*" multiple {...({ webkitdirectory: "true", directory: "true" } as Record<string, string>)} onChange={(event) => setVideoFiles(Array.from(event.target.files || []))} />
                  ) : (
                    <input key="files" id="videoUploadInput" className={inputClass} type="file" accept="video/*" multiple onChange={(event) => setVideoFiles(Array.from(event.target.files || []))} />
                  )}
                  <button onClick={saveVideos} disabled={savingVideo} className="h-12 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-60">
                    {savingVideo ? "Uploading..." : "+ Upload"}
                  </button>
                </div>
                <div className={`mt-3 text-sm ${mutedText}`}>Selected: <span className="font-black">{videoFiles.length}</span> file(s). {uploadProgress && <span className="font-bold text-blue-600">{uploadProgress}</span>}</div>
              </PremiumCard>

              <PremiumCard darkMode={darkMode} className="mt-6">
                <h3 className="text-xl font-black">Bulk Delete Controls</h3>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button onClick={() => deleteVideosList(videos, "All videos")} className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white">Delete All Videos</button>
                  {selectedPageId && <button onClick={() => deleteVideosList(videos.filter((video) => video.page_id === selectedPageId), `Selected page videos`)} className="rounded-2xl bg-orange-600 px-5 py-3 text-sm font-black text-white">Delete Selected Page Videos</button>}
                </div>
              </PremiumCard>

              <div className="mt-6 grid gap-4">
                {visibleVideoGroups.length === 0 ? (
                  <p className={mutedText}>No video folders found.</p>
                ) : (
                  visibleVideoGroups.map((group) => {
                    const expanded = expandedGroups.has(group.key);
                    const page = getPage(group.pageId);
                    return (
                      <PremiumCard key={group.key} darkMode={darkMode}>
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="text-2xl font-black">{group.pageName}</p>
                            <p className={`mt-1 text-sm ${mutedText}`}>Folder: {group.folderName}</p>
                            <p className={`mt-1 text-sm ${mutedText}`}>Account: {group.accountName} · Uploaded: {formatDate(group.latestDate)}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge tone="blue">{group.videos.length} Videos</Badge>
                            <button onClick={() => toggleGroup(group.key)} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white">{expanded ? "Hide Videos" : "Show Videos"}</button>
                            <button onClick={() => deleteVideosList(group.videos, `${group.pageName} / ${group.folderName}`)} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white">Delete Folder</button>
                            {page?.page_link && <a href={safeLink(page.page_link)} target="_blank" rel="noreferrer" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">Open Page</a>}
                          </div>
                        </div>

                        {expanded && (
                          <div className="mt-5 grid gap-3">
                            {group.videos.map((video) => (
                              <div key={video.id} className={darkMode ? "rounded-2xl bg-slate-950 p-4" : "rounded-2xl bg-slate-50 p-4"}>
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="font-black">{video.video_name}</p>
                                    <p className={`break-all text-xs ${mutedText}`}>{video.file_name}</p>
                                    {video.relative_path && <p className={`break-all text-xs ${mutedText}`}>{video.relative_path}</p>}
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {(video.signed_url || video.file_url) && <a href={video.signed_url || video.file_url || undefined} target="_blank" rel="noreferrer" className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white">Open</a>}
                                    {video.storage_path && <button onClick={() => downloadFromStorage("videos", video.storage_path)} className="rounded-xl bg-green-600 px-3 py-2 text-xs font-bold text-white">Download</button>}
                                    <button onClick={() => editVideo(video)} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white">Edit</button>
                                    <button onClick={() => deleteVideo(video)} className="rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white">Delete</button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </PremiumCard>
                    );
                  })
                )}
              </div>
            </section>
          )}
        </div>
      </div>

      {searchOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className={darkMode ? "h-full w-full max-w-xl overflow-y-auto rounded-[2rem] border border-slate-800 bg-slate-950 p-5 text-slate-100 shadow-2xl" : "h-full w-full max-w-xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-5 text-slate-950 shadow-2xl"}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={`text-xs font-black uppercase tracking-[0.28em] ${mutedText}`}>Side Search</p>
                <h2 className="mt-2 text-3xl font-black">Search Panel</h2>
                <p className={`mt-2 text-sm ${mutedText}`}>Search team, accounts, pages and videos from one side panel.</p>
              </div>
              <button onClick={() => setSearchOpen(false)} className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-black text-white">Close</button>
            </div>

            <input className={`${inputClass} mt-5 w-full`} placeholder="Search anything..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />

            <div className="mt-5 grid grid-cols-4 gap-2 text-center text-xs">
              <div className={darkMode ? "rounded-2xl bg-slate-900 p-3" : "rounded-2xl bg-slate-50 p-3"}><p className="text-lg font-black">{searchResults.team.length}</p><p className={mutedText}>Team</p></div>
              <div className={darkMode ? "rounded-2xl bg-slate-900 p-3" : "rounded-2xl bg-slate-50 p-3"}><p className="text-lg font-black">{searchResults.accounts.length}</p><p className={mutedText}>Accounts</p></div>
              <div className={darkMode ? "rounded-2xl bg-slate-900 p-3" : "rounded-2xl bg-slate-50 p-3"}><p className="text-lg font-black">{searchResults.pages.length}</p><p className={mutedText}>Pages</p></div>
              <div className={darkMode ? "rounded-2xl bg-slate-900 p-3" : "rounded-2xl bg-slate-50 p-3"}><p className="text-lg font-black">{searchResults.videos.length}</p><p className={mutedText}>Videos</p></div>
            </div>

            <div className="mt-5 space-y-3">
              {searchResults.accounts.slice(0, 8).map((account) => (
                <div key={account.id} className={darkMode ? "rounded-2xl bg-slate-900 p-4" : "rounded-2xl bg-slate-50 p-4"}>
                  <p className="font-black">{account.account_name}</p>
                  <p className={`break-all text-xs ${mutedText}`}>{account.login_email}</p>
                </div>
              ))}
              {searchResults.pages.slice(0, 8).map((page) => (
                <div key={page.id} className={darkMode ? "rounded-2xl bg-slate-900 p-4" : "rounded-2xl bg-slate-50 p-4"}>
                  <p className="font-black">{page.page_name}</p>
                  <p className={`break-all text-xs ${mutedText}`}>{page.page_link}</p>
                </div>
              ))}
              {searchResults.videos.slice(0, 8).map((video) => (
                <div key={video.id} className={darkMode ? "rounded-2xl bg-slate-900 p-4" : "rounded-2xl bg-slate-50 p-4"}>
                  <p className="font-black">{video.video_name}</p>
                  <p className={`break-all text-xs ${mutedText}`}>{video.file_name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}




