"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type TeamMemberItem = {
  id?: string;
  name: string;
  email?: string;
  role?: string;
  status?: string;
};

type PageItem = {
  id: string;
  page_name: string;
  page_link: string;
  page_status?: string;
};

type AccountItem = {
  id?: string;
  account_name: string;
  login_email?: string;
  date_of_birth?: string;
  two_factor_status?: string;
  account_status?: string;
};

type VideoItem = {
  id?: string;
  page_id?: string;
  video_name: string;
  file_name?: string;
  file_url?: string;
};

export default function Home() {
  const [teamMembers, setTeamMembers] = useState<TeamMemberItem[]>([]);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);

  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [savingMember, setSavingMember] = useState(false);

  const [pageName, setPageName] = useState("");
  const [pageLink, setPageLink] = useState("");
  const [loadingPage, setLoadingPage] = useState(false);

  const [accountName, setAccountName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountDob, setAccountDob] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);

  const [videoName, setVideoName] = useState("");
  const [selectedPageId, setSelectedPageId] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [savingVideo, setSavingVideo] = useState(false);

  async function loadTeamMembers() {
    const { data, error } = await supabase
      .from("team_members")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    if (data) setTeamMembers(data as TeamMemberItem[]);
  }

  async function loadPages() {
    const { data, error } = await supabase
      .from("facebook_pages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    if (data) setPages(data as PageItem[]);
  }

  async function loadAccounts() {
    const { data, error } = await supabase
      .from("facebook_accounts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    if (data) setAccounts(data as AccountItem[]);
  }

  async function loadVideos() {
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    if (data) setVideos(data as VideoItem[]);
  }

  useEffect(() => {
    loadTeamMembers();
    loadPages();
    loadAccounts();
    loadVideos();
  }, []);

  async function saveTeamMember() {
    if (!memberName || !memberEmail) {
      alert("Member Name aur Email dono likho");
      return;
    }

    setSavingMember(true);

    const { error } = await supabase.from("team_members").insert({
      name: memberName,
      email: memberEmail,
      role: "member",
      status: "active",
    });

    setSavingMember(false);

    if (error) {
      alert(error.message);
      return;
    }

    setMemberName("");
    setMemberEmail("");
    loadTeamMembers();
  }

  async function savePage() {
    if (!pageName || !pageLink) {
      alert("Page Name aur Page Link dono likho");
      return;
    }

    setLoadingPage(true);

    const { error } = await supabase.from("facebook_pages").insert({
      page_name: pageName,
      page_link: pageLink,
      page_status: "active",
    });

    setLoadingPage(false);

    if (error) {
      alert(error.message);
      return;
    }

    setPageName("");
    setPageLink("");
    loadPages();
  }

  async function saveAccount() {
    if (!accountName || !accountEmail) {
      alert("Account Name aur Email dono likho");
      return;
    }

    setSavingAccount(true);

    const { error } = await supabase.from("facebook_accounts").insert({
      account_name: accountName,
      login_email: accountEmail,
      date_of_birth: accountDob || null,
      two_factor_status: "off",
      account_status: "active",
    });

    setSavingAccount(false);

    if (error) {
      alert(error.message);
      return;
    }

    setAccountName("");
    setAccountEmail("");
    setAccountDob("");
    loadAccounts();
  }

  async function saveVideo() {
    if (!videoName || !selectedPageId || !videoFile) {
      alert("Video Name, Facebook Page aur Video File select karo");
      return;
    }

    setSavingVideo(true);

    const cleanFileName = videoFile.name.replaceAll(" ", "-");
    const filePath = `${Date.now()}-${cleanFileName}`;

    const uploadResult = await supabase.storage
      .from("videos")
      .upload(filePath, videoFile);

    if (uploadResult.error) {
      setSavingVideo(false);
      alert(uploadResult.error.message);
      return;
    }

    const publicUrlResult = supabase.storage
      .from("videos")
      .getPublicUrl(filePath);

    const fileUrl = publicUrlResult.data.publicUrl;

    const { error } = await supabase.from("videos").insert({
      page_id: selectedPageId,
      video_name: videoName,
      file_name: videoFile.name,
      file_url: fileUrl,
    });

    setSavingVideo(false);

    if (error) {
      alert(error.message);
      return;
    }

    setVideoName("");
    setSelectedPageId("");
    setVideoFile(null);

    const fileInput = document.getElementById("videoFile") as HTMLInputElement;
    if (fileInput) fileInput.value = "";

    loadVideos();
  }

  function getPageName(pageId?: string) {
    const page = pages.find((item) => item.id === pageId);
    return page ? page.page_name : "No Page";
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-gray-900">FB Content OS</h1>
      <p className="mt-2 text-gray-600">Facebook pages management dashboard</p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Team Members</p>
          <h2 className="text-3xl font-bold">{teamMembers.length}</h2>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Facebook Accounts</p>
          <h2 className="text-3xl font-bold">{accounts.length}</h2>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Facebook Pages</p>
          <h2 className="text-3xl font-bold">{pages.length}</h2>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Total Videos</p>
          <h2 className="text-3xl font-bold">{videos.length}</h2>
        </div>
      </div>

      <div className="mt-8 rounded-xl bg-white p-5 shadow">
        <h2 className="text-xl font-bold">Add Team Member</h2>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input
            className="rounded-lg border p-3"
            placeholder="Member Name"
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
          />

          <input
            className="rounded-lg border p-3"
            placeholder="Email"
            value={memberEmail}
            onChange={(e) => setMemberEmail(e.target.value)}
          />

          <button
            onClick={saveTeamMember}
            disabled={savingMember}
            className="rounded-lg bg-black px-4 py-2 text-white"
          >
            {savingMember ? "Saving..." : "Save Member"}
          </button>
        </div>

        <div className="mt-6">
          {teamMembers.length === 0 ? (
            <p className="text-gray-500">No team members added yet.</p>
          ) : (
            <div className="space-y-3">
              {teamMembers.map((member, index) => (
                <div key={member.id || index} className="rounded-lg border p-4">
                  <p className="font-bold">{member.name}</p>
                  <p className="text-sm text-gray-600">{member.email}</p>
                  <p className="mt-1 text-sm text-green-600">
                    {member.status || "active"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-xl bg-white p-5 shadow">
        <h2 className="text-xl font-bold">Add Facebook Account</h2>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <input
            className="rounded-lg border p-3"
            placeholder="Account Name"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
          />

          <input
            className="rounded-lg border p-3"
            placeholder="Email"
            value={accountEmail}
            onChange={(e) => setAccountEmail(e.target.value)}
          />

          <input
            className="rounded-lg border p-3"
            type="date"
            value={accountDob}
            onChange={(e) => setAccountDob(e.target.value)}
          />

          <button
            onClick={saveAccount}
            disabled={savingAccount}
            className="rounded-lg bg-black px-4 py-2 text-white"
          >
            {savingAccount ? "Saving..." : "Save Account"}
          </button>
        </div>

        <div className="mt-6">
          {accounts.length === 0 ? (
            <p className="text-gray-500">No accounts added yet.</p>
          ) : (
            <div className="space-y-3">
              {accounts.map((account, index) => (
                <div key={account.id || index} className="rounded-lg border p-4">
                  <p className="font-bold">{account.account_name}</p>
                  <p className="text-sm text-gray-600">{account.login_email}</p>
                  <p className="mt-1 text-sm text-green-600">
                    {account.account_status || "active"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-xl bg-white p-5 shadow">
        <h2 className="text-xl font-bold">Add Facebook Page</h2>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input
            className="rounded-lg border p-3"
            placeholder="Page Name"
            value={pageName}
            onChange={(e) => setPageName(e.target.value)}
          />

          <input
            className="rounded-lg border p-3"
            placeholder="Facebook Page Link"
            value={pageLink}
            onChange={(e) => setPageLink(e.target.value)}
          />

          <button
            onClick={savePage}
            disabled={loadingPage}
            className="rounded-lg bg-black px-4 py-2 text-white"
          >
            {loadingPage ? "Saving..." : "Save Page"}
          </button>
        </div>

        <div className="mt-6">
          {pages.length === 0 ? (
            <p className="text-gray-500">No pages added yet.</p>
          ) : (
            <div className="space-y-3">
              {pages.map((page, index) => (
                <div key={page.id || index} className="rounded-lg border p-4">
                  <p className="font-bold">{page.page_name}</p>
                  <p className="text-sm text-gray-600">{page.page_link}</p>
                  <p className="mt-1 text-sm text-green-600">
                    {page.page_status || "active"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-xl bg-white p-5 shadow">
        <h2 className="text-xl font-bold">Add Video</h2>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <input
            className="rounded-lg border p-3"
            placeholder="Video Name"
            value={videoName}
            onChange={(e) => setVideoName(e.target.value)}
          />

          <select
            className="rounded-lg border p-3"
            value={selectedPageId}
            onChange={(e) => setSelectedPageId(e.target.value)}
          >
            <option value="">Select Facebook Page</option>
            {pages.map((page) => (
              <option key={page.id} value={page.id}>
                {page.page_name}
              </option>
            ))}
          </select>

          <input
            id="videoFile"
            className="rounded-lg border p-3"
            type="file"
            accept="video/*"
            onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
          />

          <button
            onClick={saveVideo}
            disabled={savingVideo}
            className="rounded-lg bg-black px-4 py-2 text-white"
          >
            {savingVideo ? "Uploading..." : "Save Video"}
          </button>
        </div>

        <div className="mt-6">
          {videos.length === 0 ? (
            <p className="text-gray-500">No videos added yet.</p>
          ) : (
            <div className="space-y-3">
              {videos.map((video, index) => (
                <div key={video.id || index} className="rounded-lg border p-4">
                  <p className="font-bold">{video.video_name}</p>
                  <p className="text-sm text-gray-600">
                    Page: {getPageName(video.page_id)}
                  </p>
                  <p className="text-sm text-gray-600">
                    File: {video.file_name}
                  </p>
                  {video.file_url && (
                    <a
                      className="mt-2 inline-block text-sm text-blue-600 underline"
                      href={video.file_url}
                      target="_blank"
                    >
                      Open Video
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}