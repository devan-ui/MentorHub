import React, { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import {
    Users,
    CalendarDays,
    IndianRupee,
    Star,
    Plus,
    ArrowRight,
    Clock,
    Video,
    UserPlus,
    MessageCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";

const MentorDashboard = () => {
    const navigate = useNavigate();

    const [mentor, setMentor] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [stats, setStats] = useState({
        total_communities: 0,
        active_mentees: 0,
        upcoming_sessions: 0,
        total_earnings: 0,
        average_rating: 5.0,
        total_reviews: 0,
        community: null,
        recent_mentees: [],
    });

    useEffect(() => {
        const fetchMentor = async () => {
            const rawId = localStorage.getItem("mentorId") || "";
            const mentorId = rawId.replace(/['"]+/g, "").trim();
            const mentorEmail = localStorage.getItem("mentorEmail");
            const token = localStorage.getItem("mentorToken");

            if (!token) {
                navigate("/login");
                return;
            }

            let mentorData = null;
            try {
                const targetQuery = mentorId || mentorEmail;
                if (targetQuery) {
                    const response = await api.get(`/mentors/${targetQuery}`);
                    if (response.data?.data) {
                        mentorData = response.data.data;
                    }
                }
            } catch (error) {
                console.warn("Primary fetch in MentorDashboard failed, trying email fallback:", error);
                if (mentorEmail && mentorEmail !== mentorId) {
                    try {
                        const fallbackRes = await api.get(`/mentors/${mentorEmail}`);
                        if (fallbackRes.data?.data) {
                            mentorData = fallbackRes.data.data;
                            localStorage.setItem("mentorId", mentorData._id);
                        }
                    } catch (e2) {
                        console.error("Fallback fetch failed:", e2);
                    }
                }
            }

            if (mentorData) {
                setMentor(mentorData);
                const activeId = mentorData._id || mentorId;

                // Fetch dashboard stats from MongoDB
                try {
                    const dashRes = await api.get(`/mentor/${activeId}/dashboard`);
                    if (dashRes.data?.data) {
                        setStats(dashRes.data.data);
                        if (dashRes.data.data.upcoming_sessions && dashRes.data.data.upcoming_sessions.length > 0) {
                            setSessions(dashRes.data.data.upcoming_sessions);
                        }
                    }
                } catch (dErr) {
                    console.error("Failed to load dashboard stats:", dErr);
                }

                // Also fetch mentor sessions
                try {
                    const sessionRes = await api.get(`/mentor/${activeId}/sessions`);
                    if (sessionRes.data?.data && sessionRes.data.data.length > 0) {
                        setSessions(sessionRes.data.data);
                    }
                } catch (sErr) {
                    console.error("Failed to load mentor sessions:", sErr);
                }
            } else {
                const storedName = localStorage.getItem("mentorName") || "Mentor";
                setMentor({
                    firstName: storedName.split(" ")[0] || "Mentor",
                    lastName: storedName.split(" ").slice(1).join(" ") || "",
                    email: mentorEmail || "",
                    jobTitle: "Verified Mentor",
                    _id: mentorId || "",
                });
            }
        };

        fetchMentor();
    }, [navigate]);


    const mentorName = mentor
        ? `${mentor.firstName || ""} ${mentor.lastName || ""}`.trim()
        : "Mentor";

    const firstName = mentorName.split(" ")[0];

    return (
        <div className="space-y-8">

            {/* ================= WELCOME ================= */}

            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

                <div>

                    <p className="text-sm font-medium text-[#2c8b77]">
                        Mentor Dashboard
                    </p>

                    <h1 className="mt-1 text-2xl font-bold text-[#163b35] sm:text-3xl">
                        Good morning, {firstName} 👋
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Here's what's happening with your mentorship today.
                    </p>

                </div>

                <button
                    onClick={() => navigate("/mentor/sessions")}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#103d35] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#176b5c]"
                >
                    <Plus size={18} />
                    Schedule Session
                </button>

            </div>

            {/* ================= STATISTICS ================= */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                {/* Mentees */}

                <div className="rounded-2xl border border-[#dce8df] bg-white p-5">

                    <div className="flex items-center justify-between">

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <Users size={21} />
                        </div>

                        <span className="text-xs font-semibold text-green-600">
                            Active
                        </span>

                    </div>

                    <p className="mt-5 text-sm text-gray-500">
                        Total Mentees
                    </p>

                    <h2 className="mt-1 text-2xl font-bold text-[#163b35]">
                        {stats.active_mentees}
                    </h2>

                </div>

                {/* Sessions */}

                <div className="rounded-2xl border border-[#dce8df] bg-white p-5">

                    <div className="flex items-center justify-between">

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                            <CalendarDays size={21} />
                        </div>

                        <span className="text-xs font-semibold text-gray-400">
                            Scheduled
                        </span>

                    </div>

                    <p className="mt-5 text-sm text-gray-500">
                        Upcoming Sessions
                    </p>

                    <h2 className="mt-1 text-2xl font-bold text-[#163b35]">
                        {Array.isArray(stats.upcoming_sessions) ? stats.upcoming_sessions.length : (sessions.length || stats.total_sessions || 0)}
                    </h2>

                </div>

                {/* Earnings */}

                <div className="rounded-2xl border border-[#dce8df] bg-white p-5">

                    <div className="flex items-center justify-between">

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
                            <IndianRupee size={21} />
                        </div>

                        <span className="text-xs font-semibold text-green-600">
                            Verified
                        </span>

                    </div>

                    <p className="mt-5 text-sm text-gray-500">
                        Earnings
                    </p>

                    <h2 className="mt-1 text-2xl font-bold text-[#163b35]">
                        ₹{Number(stats.total_earnings || 0).toLocaleString()}
                    </h2>

                </div>

                {/* Rating */}

                <div className="rounded-2xl border border-[#dce8df] bg-white p-5">

                    <div className="flex items-center justify-between">

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-50 text-yellow-500">
                            <Star size={21} />
                        </div>

                        <span className="text-xs text-gray-400">
                            {stats.total_reviews} Reviews
                        </span>

                    </div>

                    <p className="mt-5 text-sm text-gray-500">
                        Average Rating
                    </p>

                    <h2 className="mt-1 text-2xl font-bold text-[#163b35]">
                        {stats.average_rating} ⭐
                    </h2>

                </div>

            </div>

            {/* ================= MAIN GRID ================= */}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

                {/* ================= UPCOMING SESSIONS ================= */}

                <div className="rounded-2xl border border-[#dce8df] bg-white xl:col-span-2">

                    <div className="flex items-center justify-between border-b border-[#edf2ee] px-6 py-5">

                        <div>

                            <h2 className="font-bold text-[#163b35]">
                                Upcoming Sessions
                            </h2>

                            <p className="mt-1 text-xs text-gray-400">
                                Your scheduled mentorship sessions
                            </p>

                        </div>

                        <button
                            onClick={() =>
                                navigate("/mentor/sessions")
                            }
                            className="flex items-center gap-1 text-xs font-semibold text-[#176b5c] hover:underline"
                        >
                            View All
                            <ArrowRight size={14} />
                        </button>

                    </div>

                    <div className="divide-y divide-[#edf2ee]">
                        {sessions && sessions.length > 0 ? (
                            sessions.slice(0, 5).map((s) => {
                                const isLive = s.status === "live";
                                const attendeeCount = Array.isArray(s.attendees) ? s.attendees.length : 0;

                                return (
                                    <div key={s._id || s.title} className="p-6 transition hover:bg-[#fafcf9]">
                                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                            <div className="flex items-start gap-4">
                                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${isLive ? "bg-red-50 text-red-600" : "bg-[#eaf6ed] text-[#176b5c]"}`}>
                                                    <Video size={21} className={isLive ? "animate-pulse" : ""} />
                                                </div>

                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`h-2 w-2 rounded-full ${isLive ? "bg-red-500 animate-ping" : "bg-green-500"}`} />
                                                        <span className={`text-xs font-bold uppercase tracking-wide ${isLive ? "text-red-600" : "text-green-600"}`}>
                                                            {isLive ? "Live Now" : s.date || "Upcoming"}
                                                        </span>
                                                    </div>

                                                    <h3 className="mt-1 font-semibold text-[#163b35]">
                                                        {s.title}
                                                    </h3>

                                                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-400">
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={13} />
                                                            {s.time}
                                                        </span>
                                                        <span>{s.duration || "60 min"}</span>
                                                        <span>{attendeeCount} member{attendeeCount === 1 ? "" : "s"}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {s.gmeet_link && (
                                                    <a
                                                        href={s.gmeet_link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1.5 rounded-xl bg-[#103d35] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#176b5c]"
                                                    >
                                                        <Video size={14} />
                                                        Join GMeet
                                                    </a>
                                                )}
                                                <button
                                                    onClick={() => navigate("/mentor/sessions")}
                                                    className="rounded-xl border border-[#dce8df] px-3.5 py-2.5 text-xs font-semibold text-[#176b5c] hover:bg-[#f5f7f2]"
                                                >
                                                    Manage
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-8 text-center">
                                <p className="text-sm font-medium text-gray-500">No upcoming sessions scheduled yet.</p>
                                <button
                                    onClick={() => navigate("/mentor/sessions")}
                                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#103d35] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#176b5c]"
                                >
                                    <Plus size={14} />
                                    Schedule a Session
                                </button>
                            </div>
                        )}
                    </div>

                </div>

                {/* ================= QUICK ACTIONS ================= */}

                <div className="rounded-2xl border border-[#dce8df] bg-white">

                    <div className="border-b border-[#edf2ee] px-6 py-5">

                        <h2 className="font-bold text-[#163b35]">
                            Quick Actions
                        </h2>

                        <p className="mt-1 text-xs text-gray-400">
                            Manage your mentorship quickly
                        </p>

                    </div>

                    <div className="space-y-2 p-4">

                        {/* Schedule */}

                        <button
                            onClick={() =>
                                navigate("/mentor/sessions")
                            }
                            className="flex w-full items-center gap-4 rounded-xl p-4 text-left transition hover:bg-[#f5f7f2]"
                        >

                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#eaf6ed] text-[#176b5c]">
                                <CalendarDays size={19} />
                            </div>

                            <div>

                                <p className="text-sm font-semibold text-[#163b35]">
                                    Schedule Session
                                </p>

                                <p className="text-xs text-gray-400">
                                    Create a new session
                                </p>

                            </div>

                            <ArrowRight
                                size={16}
                                className="ml-auto text-gray-300"
                            />

                        </button>

                        {/* Community */}

                        <button
                            onClick={() =>
                                navigate("/mentor/community")
                            }
                            className="flex w-full items-center gap-4 rounded-xl p-4 text-left transition hover:bg-[#f5f7f2]"
                        >

                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                <Building2 size={19} />
                            </div>

                            <div>

                                <p className="text-sm font-semibold text-[#163b35]">
                                    Manage Community
                                </p>

                                <p className="text-xs text-gray-400">
                                    Manage your members
                                </p>

                            </div>

                            <ArrowRight
                                size={16}
                                className="ml-auto text-gray-300"
                            />

                        </button>

                        {/* Mentees */}

                        <button
                            onClick={() =>
                                navigate("/mentor/mentees")
                            }
                            className="flex w-full items-center gap-4 rounded-xl p-4 text-left transition hover:bg-[#f5f7f2]"
                        >

                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                                <UserPlus size={19} />
                            </div>

                            <div>

                                <p className="text-sm font-semibold text-[#163b35]">
                                    Manage Mentees
                                </p>

                                <p className="text-xs text-gray-400">
                                    View your mentees
                                </p>

                            </div>

                            <ArrowRight
                                size={16}
                                className="ml-auto text-gray-300"
                            />

                        </button>

                        {/* 1-on-1 Direct Chat */}
                        <button
                            onClick={() =>
                                navigate("/mentor/messages?tab=direct")
                            }
                            className="flex w-full items-center gap-4 rounded-xl p-4 text-left transition hover:bg-[#f5f7f2] cursor-pointer"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-[#176b5c]">
                                <MessageCircle size={19} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-[#163b35]">
                                    1-on-1 Direct Chat
                                </p>
                                <p className="text-xs text-gray-400">
                                    Message your community mentees
                                </p>
                            </div>
                            <ArrowRight
                                size={16}
                                className="ml-auto text-gray-300"
                            />
                        </button>

                    </div>

                </div>

            </div>

            {/* ================= COMMUNITY ================= */}

            <div className="rounded-2xl border border-[#dce8df] bg-white">

                <div className="flex flex-col justify-between gap-3 border-b border-[#edf2ee] px-6 py-5 sm:flex-row sm:items-center">

                    <div>

                        <h2 className="font-bold text-[#163b35]">
                            My Community
                        </h2>

                        <p className="mt-1 text-xs text-gray-400">
                            Your paid mentorship community
                        </p>

                    </div>

                    <button
                        onClick={() =>
                            navigate("/mentor/community")
                        }
                        className="text-xs font-semibold text-[#176b5c] hover:underline"
                    >
                        Manage Community →
                    </button>

                </div>

                <div className="p-6">

                    {stats.community ? (
                        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">

                            <div className="flex items-start gap-4">

                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#103d35] text-xl text-white">
                                    🚀
                                </div>

                                <div>

                                    <h3 className="text-lg font-bold text-[#163b35]">
                                        {stats.community.name}
                                    </h3>

                                    <p className="mt-1 max-w-xl text-sm text-gray-500 line-clamp-2">
                                        {stats.community.description ? stats.community.description.replace(/[*#]/g, "") : "Official mentorship community for live sessions and guidance."}
                                    </p>

                                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">

                                        <span>
                                            👥 {stats.community.current_members || 0} / {stats.community.capacity || 30} members
                                        </span>

                                        <span>
                                            💰 ₹{stats.community.monthly_fee || 0} / month
                                        </span>

                                        <span className="font-semibold text-green-600">
                                            ● {stats.community.status === "active" ? "Active" : "Inactive"}
                                        </span>

                                    </div>

                                </div>

                            </div>

                            <div className="w-full lg:w-64">

                                <div className="mb-2 flex justify-between text-xs">

                                    <span className="font-medium text-gray-500">
                                        Community capacity
                                    </span>

                                    <span className="font-bold text-[#176b5c]">
                                        {Math.round(((stats.community.current_members || 0) / (stats.community.capacity || 30)) * 100)}%
                                    </span>

                                </div>

                                <div className="h-2 overflow-hidden rounded-full bg-gray-100">

                                    <div
                                        className="h-full rounded-full bg-[#176b5c]"
                                        style={{
                                            width: `${Math.min(100, Math.round(((stats.community.current_members || 0) / (stats.community.capacity || 30)) * 100))}%`,
                                        }}
                                    />

                                </div>

                                <p className="mt-2 text-right text-[11px] text-gray-400">
                                    {Math.max(0, (stats.community.capacity || 30) - (stats.community.current_members || 0))} slots remaining
                                </p>

                            </div>

                        </div>
                    ) : (
                        <div className="p-4 text-center">
                            <p className="text-sm text-gray-500">No community workspace created yet.</p>
                            <button
                                onClick={() => navigate("/mentor/community")}
                                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#176b5c] hover:underline"
                            >
                                Launch your mentorship community →
                            </button>
                        </div>
                    )}

                </div>

            </div>

            {/* ================= RECENT MENTEES ================= */}

            <div className="rounded-2xl border border-[#dce8df] bg-white">

                <div className="flex items-center justify-between border-b border-[#edf2ee] px-6 py-5">

                    <div>

                        <h2 className="font-bold text-[#163b35]">
                            Recent Mentees
                        </h2>

                        <p className="mt-1 text-xs text-gray-400">
                            Recently joined mentees
                        </p>

                    </div>

                    <button
                        onClick={() =>
                            navigate("/mentor/mentees")
                        }
                        className="flex items-center gap-1 text-xs font-semibold text-[#176b5c] hover:underline"
                    >

                        View All

                        <ArrowRight size={14} />

                    </button>

                </div>

                <div className="overflow-x-auto">

                    <table className="w-full min-w-[600px]">

                        <thead>

                            <tr className="border-b border-[#edf2ee] text-left text-xs uppercase tracking-wide text-gray-400">

                                <th className="px-6 py-4 font-semibold">
                                    Mentee
                                </th>

                                <th className="px-6 py-4 font-semibold">
                                    Joined
                                </th>

                                <th className="px-6 py-4 font-semibold">
                                    Community
                                </th>

                                <th className="px-6 py-4 font-semibold">
                                    Status
                                </th>

                                <th className="px-6 py-4 font-semibold text-right">
                                    Action
                                </th>

                            </tr>

                        </thead>

                        <tbody>
                            {stats.recent_mentees && stats.recent_mentees.length > 0 ? (
                                stats.recent_mentees.map((m, idx) => (
                                    <MenteeRow
                                        key={m._id || idx}
                                        name={m.name}
                                        initials={m.initials || "M"}
                                        joined={m.joined || "Recent"}
                                        community={m.community || (stats.community?.name || "Mentorship Community")}
                                        onChat={() =>
                                            navigate(
                                                `/mentor/messages?tab=direct&mentee_id=${
                                                    m._id || m.mentee_id || m.email
                                                }`
                                            )
                                        }
                                    />
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-xs text-gray-400">
                                        No mentees have joined your community yet. When mentees subscribe, they will appear here.
                                    </td>
                                </tr>
                            )}
                        </tbody>

                    </table>

                </div>

            </div>

        </div>
    );
};

const MenteeRow = ({
    name,
    initials,
    joined,
    community,
    onChat,
}) => {

    return (

        <tr className="border-b border-[#edf2ee] last:border-0 hover:bg-[#fafcf9]">

            <td className="px-6 py-4">

                <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#103d35] text-xs font-bold text-white">
                        {initials}
                    </div>

                    <div>

                        <p className="text-sm font-semibold text-[#163b35]">
                            {name}
                        </p>

                        <p className="text-xs text-gray-400">
                            Mentee
                        </p>

                    </div>

                </div>

            </td>

            <td className="px-6 py-4 text-sm text-gray-500">
                {joined}
            </td>

            <td className="px-6 py-4 text-sm text-gray-500">
                {community}
            </td>

            <td className="px-6 py-4">

                <span className="rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold text-green-700">
                    Active
                </span>

            </td>

            <td className="px-6 py-4 text-right">

                <button
                    onClick={onChat}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-900 hover:bg-emerald-100 transition shadow-2xs cursor-pointer"
                    title="Start 1-on-1 Direct Chat"
                >
                    <MessageCircle size={14} className="text-emerald-700" />
                    <span>1-on-1 Chat</span>
                </button>

            </td>

        </tr>

    );
};

export default MentorDashboard;