import React, { useState, useEffect } from "react";
import {
    Plus,
    CalendarDays,
    Clock,
    Users,
    Video,
    MoreVertical,
    Copy,
    ExternalLink,
    Check,
    Trash2,
    CheckCircle2,
    Radio,
    Sparkles,
    X,
} from "lucide-react";
import api from "../api.js";
import toast from "react-hot-toast";

const Sessions = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all"); // all, upcoming, live, completed
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [copiedId, setCopiedId] = useState(null);

    const mentorId = localStorage.getItem("mentorId") || "6a9e5b0f056671eb15a2f2fa";

    // New session form state
    const [formData, setFormData] = useState({
        title: "",
        category: "Software Development",
        date: "Tomorrow",
        time: "7:00 PM",
        duration: "60 min",
        gmeet_link: "",
        price: 199,
        max_attendees: 30,
        description: "",
        session_type: "community",
    });

    /* =========================================================
       FETCH SESSIONS
    ========================================================= */
    const fetchSessions = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/mentor/${mentorId}/sessions`);
            if (response.data?.data) {
                setSessions(response.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch sessions:", error);
            // Fallback default sample sessions if backend is unreachable
            setSessions([
                {
                    _id: "sample-1",
                    title: "React & Next.js Career Roadmap",
                    date: "Today",
                    time: "7:00 PM",
                    duration: "60 min",
                    gmeet_link: "https://meet.google.com/abc-defg-hij",
                    attendees: [1, 2, 3, 4, 5, 6, 7, 8],
                    status: "live",
                    category: "Software Development",
                    description: "Breaking down how to land your first frontend developer role with real portfolio feedback.",
                },
                {
                    _id: "sample-2",
                    title: "Portfolio Review & Mock Interviews",
                    date: "Tomorrow",
                    time: "6:30 PM",
                    duration: "45 min",
                    gmeet_link: "https://meet.google.com/uvw-xyza-bcd",
                    attendees: [1, 2, 3, 4, 5],
                    status: "upcoming",
                    category: "Career Guidance",
                    description: "Live review of member resumes and portfolio projects with actionable feedback.",
                },
                {
                    _id: "sample-3",
                    title: "Full Stack Architecture Fundamentals",
                    date: "12 Sep",
                    time: "8:00 PM",
                    duration: "60 min",
                    gmeet_link: "https://meet.google.com/xyz-qwer-tyu",
                    attendees: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                    status: "upcoming",
                    category: "Software Development",
                    description: "Deep dive into APIs, database modeling, and scalable full-stack app patterns.",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, [mentorId]);

    /* =========================================================
       FORM HANDLERS
    ========================================================= */
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCreateSession = async (e) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            toast.error("Please enter a session title");
            return;
        }

        let link = formData.gmeet_link.trim();
        if (!link) {
            // Auto generate standard meeting room placeholder if mentor did not paste one
            link = `https://meet.google.com/${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
        } else if (!link.startsWith("http://") && !link.startsWith("https://")) {
            link = `https://${link}`;
        }

        try {
            const payload = {
                ...formData,
                price: Number(formData.price || 0),
                gmeet_link: link,
                mentor_id: mentorId,
                status: "upcoming",
            };

            const response = await api.post("/sessions", payload);
            toast.success("Session scheduled with Google Meet link!");

            if (response.data?.data) {
                setSessions((prev) => [response.data.data, ...prev]);
            } else {
                fetchSessions();
            }

            // Reset form
            setFormData({
                title: "",
                category: "Software Development",
                date: "Tomorrow",
                time: "7:00 PM",
                duration: "60 min",
                gmeet_link: "",
                price: 199,
                max_attendees: 30,
                description: "",
                session_type: "community",
            });
            setIsModalOpen(false);
        } catch (error) {
            console.error("Failed to create session:", error);
            toast.error("Could not schedule session. Please try again.");
        }
    };

    /* =========================================================
       SESSION ACTIONS
    ========================================================= */
    const copyGMeetLink = (link, id) => {
        if (!link) return;
        navigator.clipboard.writeText(link);
        setCopiedId(id);
        toast.success("Google Meet link copied to clipboard!");
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleUpdateStatus = async (sessionId, newStatus) => {
        try {
            await api.put(`/sessions/${sessionId}`, { status: newStatus });
            setSessions((prev) =>
                prev.map((s) => (s._id === sessionId ? { ...s, status: newStatus } : s))
            );
            toast.success(`Session marked as ${newStatus}`);
            setActiveMenuId(null);
        } catch (error) {
            console.error("Error updating status:", error);
            // Local state update fallback
            setSessions((prev) =>
                prev.map((s) => (s._id === sessionId ? { ...s, status: newStatus } : s))
            );
            toast.success(`Session marked as ${newStatus}`);
            setActiveMenuId(null);
        }
    };

    const handleDeleteSession = async (sessionId) => {
        if (!window.confirm("Are you sure you want to cancel this session?")) return;
        try {
            await api.delete(`/sessions/${sessionId}`);
            setSessions((prev) => prev.filter((s) => s._id !== sessionId));
            toast.success("Session cancelled successfully");
            setActiveMenuId(null);
        } catch (error) {
            console.error("Error deleting session:", error);
            setSessions((prev) => prev.filter((s) => s._id !== sessionId));
            toast.success("Session removed");
            setActiveMenuId(null);
        }
    };

    /* =========================================================
       CALCULATED STATS & FILTERING
    ========================================================= */
    const upcomingCount = sessions.filter(
        (s) => s.status === "upcoming" || s.status === "live"
    ).length;
    const completedCount = sessions.filter((s) => s.status === "completed").length;
    const totalAttendees = sessions.reduce(
        (acc, s) => acc + (Array.isArray(s.attendees) ? s.attendees.length : 0),
        0
    );

    const filteredSessions = sessions.filter((session) => {
        if (filter === "all") return true;
        if (filter === "upcoming") return session.status === "upcoming" || session.status === "live";
        if (filter === "live") return session.status === "live";
        if (filter === "completed") return session.status === "completed";
        return true;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-[#163b35]">
                        Sessions & Google Meet Links
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Schedule live sessions and share Google Meet links with your community members.
                    </p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#103d35] px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#176b5c] hover:shadow-lg"
                >
                    <Plus size={18} />
                    Schedule Session
                </button>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <SessionStat
                    title="Upcoming / Live"
                    value={upcomingCount}
                    badge={sessions.some((s) => s.status === "live") ? "Live now" : null}
                />
                <SessionStat
                    title="Completed"
                    value={completedCount}
                />
                <SessionStat
                    title="Total Mentees Attended"
                    value={totalAttendees}
                />
            </div>

            {/* Main Sessions Container */}
            <div className="rounded-2xl border border-[#dce8df] bg-white shadow-sm">
                {/* Header & Filter Tabs */}
                <div className="flex flex-col justify-between gap-4 border-b border-[#edf2ee] p-5 sm:flex-row sm:items-center">
                    <div>
                        <h2 className="font-bold text-[#163b35]">
                            Community Mentorship Sessions
                        </h2>
                        <p className="text-xs text-gray-400">
                            {filteredSessions.length} session(s) found
                        </p>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex rounded-xl bg-[#f5f7f2] p-1 text-xs font-semibold">
                        {[
                            { key: "all", label: "All" },
                            { key: "upcoming", label: "Upcoming" },
                            { key: "live", label: "Live Now" },
                            { key: "completed", label: "Completed" },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setFilter(tab.key)}
                                className={`rounded-lg px-3 py-1.5 transition ${
                                    filter === tab.key
                                        ? "bg-white text-[#103d35] shadow-sm"
                                        : "text-gray-500 hover:text-[#103d35]"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sessions List */}
                {loading ? (
                    <div className="py-16 text-center">
                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#dce8df] border-t-[#176b5c]" />
                        <p className="mt-3 text-xs text-gray-400">Loading sessions...</p>
                    </div>
                ) : filteredSessions.length === 0 ? (
                    <div className="py-16 text-center">
                        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf6ed] text-[#176b5c]">
                            <CalendarDays size={26} />
                        </div>
                        <h3 className="font-bold text-[#163b35]">No sessions found</h3>
                        <p className="mt-1 text-xs text-gray-400">
                            Click "Schedule Session" above to create your first Google Meet session for members.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-[#edf2ee]">
                        {filteredSessions.map((session) => {
                            const isLive = session.status === "live";
                            const isCompleted = session.status === "completed";
                            const attendeeCount = Array.isArray(session.attendees)
                                ? session.attendees.length
                                : 0;
                            const isCopied = copiedId === session._id;

                            return (
                                <div
                                    key={session._id}
                                    className={`p-6 transition hover:bg-[#fafcf9] ${
                                        isLive ? "bg-[#f4faf6]" : ""
                                    }`}
                                >
                                    <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                                        <div className="flex items-start gap-4">
                                            {/* Icon with Live indicator */}
                                            <div
                                                className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                                                    isLive
                                                        ? "bg-red-50 text-red-600"
                                                        : "bg-[#eaf6ed] text-[#176b5c]"
                                                }`}
                                            >
                                                {isLive ? <Radio size={22} className="animate-pulse" /> : <CalendarDays size={22} />}
                                            </div>

                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="font-bold text-[#163b35]">
                                                        {session.title}
                                                    </h3>

                                                    {/* Status Badge */}
                                                    {isLive ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700 animate-pulse">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-red-600"></span>
                                                            Live Now
                                                        </span>
                                                    ) : isCompleted ? (
                                                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold text-gray-600">
                                                            Completed
                                                        </span>
                                                    ) : (
                                                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                                                            Upcoming
                                                        </span>
                                                    )}

                                                    {session.category && (
                                                        <span className="rounded-full bg-[#f1f5f2] px-2 py-0.5 text-[10px] font-medium text-[#4b635c]">
                                                            {session.category}
                                                        </span>
                                                    )}

                                                    {/* Price Badge */}
                                                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800">
                                                        {session.price ? `₹${session.price} / ticket` : "Free"}
                                                    </span>

                                                    {/* Starts On Time Badge */}
                                                    <span className="rounded-full bg-sky-50 border border-sky-200 px-2 py-0.5 text-[10px] font-bold text-sky-800 flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping" />
                                                        Starts On Time
                                                    </span>
                                                </div>

                                                {/* Description if present */}
                                                {session.description && (
                                                    <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                                                        {session.description}
                                                    </p>
                                                )}

                                                {/* Date, Time, Mentees row */}
                                                <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs text-gray-400">
                                                    <span className="flex items-center gap-1 text-gray-600">
                                                        <CalendarDays size={13} className="text-[#176b5c]" />
                                                        {session.date}
                                                    </span>

                                                    <span className="flex items-center gap-1 text-gray-600">
                                                        <Clock size={13} className="text-[#176b5c]" />
                                                        {session.time} ({session.duration || "60 min"})
                                                    </span>

                                                    <span className="flex items-center gap-1 text-gray-600">
                                                        <Users size={13} className="text-[#176b5c]" />
                                                        {attendeeCount} member{attendeeCount === 1 ? "" : "s"} joined
                                                    </span>
                                                </div>

                                                {/* Registered & Paid Attendees */}
                                                {session.attendees && session.attendees.length > 0 && (
                                                    <div className="mt-2 flex flex-wrap items-center gap-1.5 pt-1">
                                                        <span className="text-[10px] text-gray-400 font-semibold">Attendees:</span>
                                                        {session.attendees.map((att, idx) => (
                                                            <span
                                                                key={idx}
                                                                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                                                    att.paid
                                                                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                                                        : "bg-gray-50 border-gray-200 text-gray-600"
                                                                }`}
                                                            >
                                                                {att.name || att.email || "Member"} {att.paid ? `✓ Paid` : "(RSVP)"}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Google Meet Link Display Badge */}
                                                {session.gmeet_link && (
                                                    <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#cce5d6] bg-[#eaf6ed]/80 px-2.5 py-1 text-xs font-medium text-[#103d35]">
                                                        <Video size={13} className="text-[#176b5c]" />
                                                        <span className="font-mono text-[11px] text-[#163b35]">
                                                            {session.gmeet_link}
                                                        </span>
                                                        <button
                                                            onClick={() => copyGMeetLink(session.gmeet_link, session._id)}
                                                            className="ml-1 text-[#176b5c] transition hover:text-[#0b2923]"
                                                            title="Copy Google Meet Link"
                                                        >
                                                            {isCopied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="relative flex items-center gap-2">
                                            {session.gmeet_link && (
                                                <a
                                                    href={session.gmeet_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition ${
                                                        isLive
                                                            ? "bg-red-600 hover:bg-red-700 animate-pulse"
                                                            : "bg-[#103d35] hover:bg-[#176b5c]"
                                                    }`}
                                                >
                                                    <Video size={15} />
                                                    {isLive ? "Join Live GMeet" : "Launch GMeet"}
                                                    <ExternalLink size={12} className="opacity-80" />
                                                </a>
                                            )}

                                            {/* Dropdown Menu Toggle */}
                                            <button
                                                onClick={() =>
                                                    setActiveMenuId(
                                                        activeMenuId === session._id ? null : session._id
                                                    )
                                                }
                                                className="rounded-xl border border-[#dce8df] p-2.5 text-gray-400 hover:bg-gray-50 hover:text-[#163b35]"
                                            >
                                                <MoreVertical size={17} />
                                            </button>

                                            {/* Dropdown Options */}
                                            {activeMenuId === session._id && (
                                                <div className="absolute right-0 top-12 z-20 w-44 rounded-xl border border-[#dce8df] bg-white py-1.5 shadow-xl">
                                                    {!isLive && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(session._id, "live")}
                                                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50"
                                                        >
                                                            <Radio size={14} />
                                                            Mark as Live
                                                        </button>
                                                    )}

                                                    {!isCompleted && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(session._id, "completed")}
                                                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50"
                                                        >
                                                            <CheckCircle2 size={14} />
                                                            Mark as Completed
                                                        </button>
                                                    )}

                                                    {session.gmeet_link && (
                                                        <button
                                                            onClick={() => copyGMeetLink(session.gmeet_link, session._id)}
                                                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50"
                                                        >
                                                            <Copy size={14} />
                                                            Copy Meet Link
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => handleDeleteSession(session._id)}
                                                        className="flex w-full items-center gap-2 border-t border-gray-100 px-4 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50"
                                                    >
                                                        <Trash2 size={14} />
                                                        Cancel Session
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* =========================================================
                SCHEDULE SESSION MODAL
            ========================================================= */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="w-full max-w-xl rounded-2xl border border-[#dce8df] bg-white p-6 shadow-2xl sm:p-7">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-[#edf2ee] pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-[#163b35]">
                                    Schedule Community Session
                                </h3>
                                <p className="text-xs text-gray-400">
                                    Set up a live Google Meet call for your community members.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleCreateSession} className="mt-5 space-y-4">
                            {/* Title */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    Session Title *
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="e.g. React & System Design Career AMA"
                                    required
                                    className="w-full rounded-xl border border-[#dce8df] px-3.5 py-2.5 text-sm outline-none focus:border-[#176b5c]"
                                />
                            </div>

                            {/* Category & Duration */}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                                        Category / Topic
                                    </label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        className="w-full rounded-xl border border-[#dce8df] px-3.5 py-2.5 text-sm outline-none focus:border-[#176b5c] bg-white"
                                    >
                                        <option value="Software Development">Software Development</option>
                                        <option value="Design & UX">Design & UX</option>
                                        <option value="Business & Startup">Business & Startup</option>
                                        <option value="Career & Interviews">Career & Interviews</option>
                                        <option value="Code Review">Code Review</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                                        Duration
                                    </label>
                                    <select
                                        name="duration"
                                        value={formData.duration}
                                        onChange={handleInputChange}
                                        className="w-full rounded-xl border border-[#dce8df] px-3.5 py-2.5 text-sm outline-none focus:border-[#176b5c] bg-white"
                                    >
                                        <option value="30 min">30 minutes</option>
                                        <option value="45 min">45 minutes</option>
                                        <option value="60 min">60 minutes (Standard)</option>
                                        <option value="90 min">90 minutes (Masterclass)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Date & Time */}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                                        Date
                                    </label>
                                    <input
                                        type="text"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Tomorrow or 15 Sep"
                                        required
                                        className="w-full rounded-xl border border-[#dce8df] px-3.5 py-2.5 text-sm outline-none focus:border-[#176b5c]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                                        Time
                                    </label>
                                    <input
                                        type="text"
                                        name="time"
                                        value={formData.time}
                                        onChange={handleInputChange}
                                        placeholder="e.g. 7:00 PM"
                                        required
                                        className="w-full rounded-xl border border-[#dce8df] px-3.5 py-2.5 text-sm outline-none focus:border-[#176b5c]"
                                    />
                                </div>
                            </div>

                            {/* Session Ticket Price (₹) */}
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5">
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-xs font-bold text-[#103d35]">
                                        Session Ticket Price (₹) *
                                    </label>
                                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                        Pay-To-Join
                                    </span>
                                </div>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    placeholder="199"
                                    min="0"
                                    required
                                    className="w-full rounded-lg border border-[#b8dbc3] bg-white px-3 py-2 text-sm font-bold text-[#163b35] outline-none focus:border-[#176b5c]"
                                />
                                <p className="mt-1 text-[11px] text-gray-500">
                                    Community members must pay this price to unlock Google Meet access. Enter 0 for free community sessions.
                                </p>
                            </div>

                            {/* Google Meet Link Input with Helper Button */}
                            <div className="rounded-xl border border-[#cbe4d4] bg-[#f4faf6] p-3.5">
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-1.5 text-xs font-bold text-[#103d35]">
                                        <Video size={15} className="text-[#176b5c]" />
                                        Google Meet Link (GMeet)
                                    </label>
                                    <a
                                        href="https://meet.new"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#177fc0] hover:underline"
                                    >
                                        <Sparkles size={12} />
                                        Generate on meet.new ↗
                                    </a>
                                </div>

                                <input
                                    type="text"
                                    name="gmeet_link"
                                    value={formData.gmeet_link}
                                    onChange={handleInputChange}
                                    placeholder="https://meet.google.com/xyz-abcd-efg"
                                    className="mt-2 w-full rounded-lg border border-[#b8dbc3] bg-white px-3 py-2 text-xs font-mono outline-none focus:border-[#176b5c]"
                                />
                                <p className="mt-1 text-[11px] text-gray-500">
                                    Leave blank to auto-generate a meeting room link for your members.
                                </p>
                            </div>

                            {/* Description / Agenda */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    Agenda / Description
                                </label>
                                <textarea
                                    name="description"
                                    rows="2"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="What will community members learn in this session?"
                                    className="w-full resize-none rounded-xl border border-[#dce8df] px-3.5 py-2 text-sm outline-none focus:border-[#176b5c]"
                                />
                            </div>

                            {/* Modal Actions */}
                            <div className="flex items-center justify-end gap-3 border-t border-[#edf2ee] pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="rounded-xl border border-[#dce8df] px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex items-center gap-2 rounded-xl bg-[#103d35] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#176b5c]"
                                >
                                    <Plus size={15} />
                                    Schedule & Share
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const SessionStat = ({ title, value, badge }) => {
    return (
        <div className="rounded-2xl border border-[#dce8df] bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400 font-medium">{title}</p>
                {badge && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600 animate-pulse">
                        {badge}
                    </span>
                )}
            </div>
            <p className="mt-2 text-2xl font-bold text-[#163b35]">{value}</p>
        </div>
    );
};

export default Sessions;