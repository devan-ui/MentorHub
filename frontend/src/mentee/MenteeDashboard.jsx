import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Users,
    Video,
    Calendar,
    Clock,
    Sparkles,
    Bell,
    ArrowRight,
    Search,
    ExternalLink,
    Copy,
    Check,
    Compass,
    BookOpen,
    MessageSquare,
    MessageCircle,
    UserCheck,
    TrendingUp,
    Building2,
} from "lucide-react";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import api from "../api.js";
import toast, { Toaster } from "react-hot-toast";

const MenteeDashboard = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState({
        joined_communities_count: 0,
        communities: [],
        upcoming_sessions_count: 0,
        sessions: [],
        notifications: [],
        unread_notifications: 0,
    });
    const [copiedSessionId, setCopiedSessionId] = useState(null);

    const userId = localStorage.getItem("userId") || localStorage.getItem("userEmail");
    const storedName = localStorage.getItem("userName");
    const [userName, setUserName] = useState(
        storedName && storedName.toLowerCase() !== "mentee" ? storedName : ""
    );
    const userEmail = localStorage.getItem("userEmail") || "";

    useEffect(() => {
        const token = localStorage.getItem("userToken");
        if (!token) {
            navigate("/login");
            return;
        }
        fetchDashboard();

        const stored = localStorage.getItem("userName");
        if (stored && stored.toLowerCase() !== "mentee") {
            setUserName(stored);
        } else if (userId) {
            api.get(`/mentee/profile/${userId}`).then((res) => {
                const u = res.data?.data;
                const fetchedName = u?.name || u?.userName || u?.username || (u?.email ? u.email.split("@")[0] : null);
                if (fetchedName && fetchedName.toLowerCase() !== "mentee") {
                    localStorage.setItem("userName", fetchedName);
                    setUserName(fetchedName);
                }
            }).catch(() => {});
        }
    }, []);

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/mentee/${userId || userEmail}/dashboard?email=${encodeURIComponent(userEmail)}&user_id=${encodeURIComponent(userId)}`);
            if (res.data?.data) {
                setDashboardData(res.data.data);
                const u = res.data.data.user;
                if (u?.name || u?.username || u?.userName) {
                    const real = u.name || u.username || u.userName;
                    localStorage.setItem("userName", real);
                    setUserName(real);
                }
            }
        } catch (err) {
            console.error("Error loading dashboard:", err);
            // Fallback gracefully
        } finally {
            setLoading(false);
        }
    };

    const displayUserName = userName || (storedName && storedName.toLowerCase() !== "mentee" ? storedName : null) || (userEmail ? userEmail.split("@")[0] : "Learner");

    const handleCopyLink = (sessionId, link) => {
        if (!link) {
            toast.error("No Google Meet link available yet");
            return;
        }
        navigator.clipboard.writeText(link);
        setCopiedSessionId(sessionId);
        toast.success("Google Meet link copied to clipboard!");
        setTimeout(() => setCopiedSessionId(null), 2500);
    };

    const markNotificationRead = async (notifId) => {
        try {
            await api.put(`/notifications/${notifId}/read`);
            setDashboardData((prev) => ({
                ...prev,
                notifications: prev.notifications.map((n) =>
                    n._id === notifId ? { ...n, read: true } : n
                ),
                unread_notifications: Math.max(0, prev.unread_notifications - 1),
            }));
            toast.success("Marked as read");
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-[#fbfaf6] text-[#123b38]">
            <Toaster position="top-right" />
            <Navbar />

            {/* Main Content Area */}
            <main className="w-[92%] max-w-[1200px] mx-auto py-8 lg:py-12 space-y-10">
                {/* Welcome Header */}
                <div className="relative overflow-hidden bg-gradient-to-r from-[#082f2b] via-[#103d35] to-[#163b35] text-white rounded-3xl p-8 sm:p-10 shadow-xl">
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Mentee Learning Hub</span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                                Welcome back, {displayUserName}! 👋
                            </h1>
                            <p className="text-emerald-100/80 text-sm sm:text-base max-w-xl">
                                Track your joined communities, upcoming live Google Meet sessions, and connect with top industry mentors.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            {dashboardData.communities && dashboardData.communities.length > 0 && (
                                <Link
                                    to={`/community/${dashboardData.communities[0].community_id || dashboardData.communities[0]._id}`}
                                    className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
                                >
                                    <Building2 className="w-4 h-4 text-emerald-200" />
                                    <span>Community Workspace</span>
                                </Link>
                            )}
                            <Link
                                to="/messages"
                                className="px-5 py-2.5 rounded-full bg-white text-[#082f2b] font-semibold text-sm shadow-md transition flex items-center gap-2 hover:bg-emerald-50 cursor-pointer"
                            >
                                <MessageSquare className="w-4 h-4 text-[#177fc0]" />
                                <span>Messages & Chats</span>
                            </Link>
                            <Link
                                to="/sessions"
                                className="px-5 py-2.5 rounded-full bg-[#177fc0] hover:bg-[#146ba3] text-white font-semibold text-sm shadow-md transition flex items-center gap-2"
                            >
                                <Video className="w-4 h-4" />
                                <span>Live Sessions Hub</span>
                            </Link>
                            <Link
                                to="/mentee/profile"
                                className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition flex items-center gap-2"
                            >
                                <UserCheck className="w-4 h-4" />
                                <span>My Profile</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* 4 Top Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="bg-white border border-[#123b38]/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Joined Communities
                            </span>
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                                <Users className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-3xl font-extrabold text-[#082f2b] mt-3">
                            {dashboardData.joined_communities_count}
                        </p>
                        <p className="text-xs text-emerald-700 mt-1 font-medium flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5" /> Active Mentorships
                        </p>
                    </div>

                    <div className="bg-white border border-[#123b38]/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Live & Upcoming Sessions
                            </span>
                            <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#177fc0] flex items-center justify-center">
                                <Video className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-3xl font-extrabold text-[#082f2b] mt-3">
                            {dashboardData.upcoming_sessions_count}
                        </p>
                        <p className="text-xs text-sky-600 mt-1 font-medium flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Scheduled with Google Meet
                        </p>
                    </div>

                    <div className="bg-white border border-[#123b38]/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Unread Updates
                            </span>
                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                <Bell className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-3xl font-extrabold text-[#082f2b] mt-3">
                            {dashboardData.unread_notifications}
                        </p>
                        <p className="text-xs text-amber-700 mt-1 font-medium">
                            Notifications & Reminders
                        </p>
                    </div>

                    <div className="bg-white border border-[#123b38]/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Explore Mentors
                            </span>
                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                <Compass className="w-5 h-5" />
                            </div>
                        </div>
                        <Link
                            to="/mentors"
                            className="inline-flex items-center gap-1 text-sm font-bold text-[#177fc0] hover:underline mt-4"
                        >
                            Browse All Mentors <ArrowRight className="w-4 h-4" />
                        </Link>
                        <p className="text-xs text-gray-400 mt-1">
                            Find top industry leaders
                        </p>
                    </div>
                </div>

                {/* Subscribed Communities Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-extrabold text-[#082f2b]">
                                My Subscribed Communities
                            </h2>
                            <p className="text-sm text-gray-500">
                                Communities you have active access to participate in chats and attend sessions
                            </p>
                        </div>
                        <Link
                            to="/mentors"
                            className="text-sm font-bold text-[#177fc0] hover:underline flex items-center gap-1"
                        >
                            Discover More <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="bg-white rounded-2xl p-12 text-center border border-[#123b38]/10">
                            <div className="animate-spin w-8 h-8 border-4 border-[#177fc0] border-t-transparent rounded-full mx-auto" />
                            <p className="text-sm text-gray-500 mt-3">Loading your communities...</p>
                        </div>
                    ) : dashboardData.communities.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {dashboardData.communities.map((sub) => (
                                <div
                                    key={sub._id}
                                    className="bg-white rounded-2xl border border-[#123b38]/10 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                                Active Member
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                Joined {new Date(sub.created_at || Date.now()).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-[#082f2b]">
                                            {sub.community_name || "Mentorship Community"}
                                        </h3>
                                        <p className="text-xs text-gray-500 line-clamp-2">
                                            {sub.category || "General Mentorship"} · Mentored by {sub.mentor_name || "Industry Expert"}
                                        </p>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col gap-2.5">
                                        <Link
                                            to={`/community/${sub.community_id || sub._id}`}
                                            className="w-full py-2.5 px-3 rounded-xl bg-[#082f2b] hover:bg-[#103d35] text-white text-xs font-bold text-center transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                                            title="Open Community Workspace"
                                        >
                                            <Building2 className="w-3.5 h-3.5 text-emerald-300" />
                                            <span>Enter Community Workspace</span>
                                        </Link>
                                        <div className="flex items-center gap-2">
                                            <Link
                                                to={`/messages?tab=community&community_id=${sub.community_id || sub._id}`}
                                                className="flex-1 py-2 px-3 rounded-xl border border-emerald-600/30 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 text-xs font-bold text-center transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                                                title="Open Community Group Chat"
                                            >
                                                <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                                                <span>Group Chat</span>
                                            </Link>
                                            {sub.mentor_id && (
                                                <Link
                                                    to={`/messages?tab=direct&mentor_id=${sub.mentor_id}`}
                                                    className="py-2 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                                                    title="Direct 1-on-1 Chat with Mentor"
                                                >
                                                    <MessageCircle className="w-3.5 h-3.5 text-[#177fc0]" />
                                                    <span>1-on-1</span>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center space-y-4">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                                <Users className="w-7 h-7" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-[#082f2b]">
                                    You haven't joined any communities yet
                                </h3>
                                <p className="text-sm text-gray-500 max-w-md mx-auto">
                                    Browse verified mentors, find communities matching your learning goals, and subscribe to unlock live Google Meet sessions and group chat!
                                </p>
                            </div>
                            <Link
                                to="/mentors"
                                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#177fc0] text-white text-sm font-bold shadow hover:bg-[#146ba3] transition"
                            >
                                <Compass className="w-4 h-4" /> Browse Mentors & Communities
                            </Link>
                        </div>
                    )}
                </div>

                {/* Upcoming Live Sessions Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-extrabold text-[#082f2b] flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                                Upcoming Google Meet Sessions
                            </h2>
                            <p className="text-sm text-gray-500">
                                Live interactive sessions scheduled by your mentors
                            </p>
                        </div>
                        <Link
                            to="/sessions"
                            className="text-sm font-bold text-[#177fc0] hover:underline flex items-center gap-1"
                        >
                            View All Sessions <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {dashboardData.sessions.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {dashboardData.sessions.map((session) => (
                                <div
                                    key={session._id}
                                    className="bg-white rounded-2xl border border-[#123b38]/10 p-6 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 flex items-center gap-1">
                                                <Video className="w-3 h-3 text-[#177fc0]" /> Google Meet
                                            </span>
                                            {session.status === "live" && (
                                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 animate-pulse">
                                                    LIVE NOW
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-lg font-bold text-[#082f2b]">
                                            {session.title}
                                        </h3>
                                        <p className="text-xs text-gray-500 line-clamp-2">
                                            {session.description || "Interactive mentorship discussion and live Q&A."}
                                        </p>

                                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-xl">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-[#177fc0]" />
                                                <span>{session.date || "Scheduled"}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 text-[#177fc0]" />
                                                <span>{session.time || "TBA"} ({session.duration || "45 min"})</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                                        {session.gmeet_link ? (
                                            <>
                                                <a
                                                    href={session.gmeet_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#177fc0] hover:bg-[#146ba3] text-white text-xs font-bold text-center transition flex items-center justify-center gap-2 shadow-sm"
                                                >
                                                    <Video className="w-4 h-4" />
                                                    Join Google Meet
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                                <button
                                                    onClick={() => handleCopyLink(session._id, session.gmeet_link)}
                                                    className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600 transition"
                                                    title="Copy GMeet Link"
                                                >
                                                    {copiedSessionId === session._id ? (
                                                        <Check className="w-4 h-4 text-emerald-600" />
                                                    ) : (
                                                        <Copy className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </>
                                        ) : (
                                            <span className="w-full py-2.5 px-4 rounded-xl bg-gray-100 text-gray-500 text-xs font-semibold text-center">
                                                Link available before call
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-500">
                            No upcoming sessions scheduled right now. Check back soon or visit the{" "}
                            <Link to="/sessions" className="text-[#177fc0] font-bold hover:underline">
                                Live Sessions Hub
                            </Link>
                            .
                        </div>
                    )}
                </div>

                {/* Notifications & Announcements Feed */}
                {dashboardData.notifications && dashboardData.notifications.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-extrabold text-[#082f2b]">
                            Recent Updates & Notifications
                        </h2>
                        <div className="bg-white rounded-2xl border border-[#123b38]/10 divide-y divide-gray-100 overflow-hidden">
                            {dashboardData.notifications.map((notif) => (
                                <div
                                    key={notif._id}
                                    className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition ${
                                        notif.read ? "bg-white" : "bg-emerald-50/40"
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                                            <Bell className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-[#082f2b]">
                                                {notif.title || notif.message}
                                            </p>
                                            {notif.title && (
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {notif.message}
                                                </p>
                                            )}
                                            <span className="text-[11px] text-gray-400 mt-1 block">
                                                {new Date(notif.created_at || Date.now()).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    {!notif.read && (
                                        <button
                                            onClick={() => markNotificationRead(notif._id)}
                                            className="text-xs font-semibold text-[#177fc0] hover:underline shrink-0"
                                        >
                                            Mark read
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default MenteeDashboard;
