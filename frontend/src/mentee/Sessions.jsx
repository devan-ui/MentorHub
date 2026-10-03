import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    CalendarDays,
    Clock,
    Users,
    Video,
    Search,
    Sparkles,
    Copy,
    Check,
    Calendar,
    ExternalLink,
    Radio,
    UserCheck,
    ChevronRight,
    Ticket,
    CreditCard,
} from "lucide-react";
import api from "../api.js";
import toast from "react-hot-toast";

// Real-time Countdown Timer ensuring sessions start strictly on time
const SessionCountdown = ({ date, time, status }) => {
    const [timeLeft, setTimeLeft] = useState("");
    const [isStartingSoon, setIsStartingSoon] = useState(false);

    useEffect(() => {
        const updateCountdown = () => {
            if (status === "live") {
                setTimeLeft("Live Now");
                setIsStartingSoon(true);
                return;
            }

            const now = new Date();
            let targetDate = new Date();

            const timeStr = String(time || "7:00 PM").trim();
            const [rawTime, modifier] = timeStr.split(" ");
            if (rawTime) {
                let [hours, minutes] = rawTime.split(":").map(Number);
                if (modifier?.toUpperCase() === "PM" && hours < 12) hours += 12;
                if (modifier?.toUpperCase() === "AM" && hours === 12) hours = 0;
                targetDate.setHours(hours, minutes || 0, 0, 0);
            }

            const dateStr = String(date || "").toLowerCase();
            if (dateStr.includes("tomorrow")) {
                targetDate.setDate(targetDate.getDate() + 1);
            } else if (dateStr && !dateStr.includes("today")) {
                const parsed = new Date(date);
                if (!isNaN(parsed.getTime())) {
                    targetDate.setFullYear(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
                }
            }

            const diff = targetDate.getTime() - now.getTime();
            if (diff <= 0) {
                setTimeLeft("Starts Now");
                setIsStartingSoon(true);
            } else {
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const secs = Math.floor((diff % (1000 * 60)) / 1000);
                setIsStartingSoon(hours === 0 && mins <= 30);
                if (hours > 24) {
                    const days = Math.floor(hours / 24);
                    setTimeLeft(`Starts in ${days}d ${hours % 24}h`);
                } else {
                    setTimeLeft(`Starts in ${String(hours).padStart(2, "0")}h ${String(mins).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`);
                }
            }
        };

        updateCountdown();
        const timer = setInterval(updateCountdown, 1000);
        return () => clearInterval(timer);
    }, [date, time, status]);

    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
            status === "live"
                ? "bg-red-100 text-red-700 animate-pulse"
                : isStartingSoon
                ? "bg-amber-100 text-amber-900 border border-amber-200"
                : "bg-sky-50 text-sky-800 border border-sky-200"
        }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status === "live" ? "bg-red-600" : isStartingSoon ? "bg-amber-500" : "bg-sky-500"} animate-ping`} />
            {timeLeft} (Starts On Time)
        </span>
    );
};

const MenteeSessions = () => {
    const navigate = useNavigate();

    const [sessions, setSessions] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [activeTab, setActiveTab] = useState("all"); // "all" or "live"
    const [copiedId, setCopiedId] = useState(null);

    // Session Ticket Payment Modal State
    const [selectedSession, setSelectedSession] = useState(null);
    const [showSessionPayModal, setShowSessionPayModal] = useState(false);
    const [sessionPaymentMethod, setSessionPaymentMethod] = useState("UPI / Google Pay / PhonePe");
    const [payingSession, setPayingSession] = useState(false);

    const userToken = localStorage.getItem("userToken");
    const userId = localStorage.getItem("userId") || "";
    const userEmail = localStorage.getItem("userEmail") || "";
    const userName = localStorage.getItem("userName") || "Mentee";

    const categories = [
        "All",
        "Software Development",
        "Design & UX",
        "Business & Startup",
        "Career & Interviews",
        "Code Review",
    ];

    /* =========================================================
       FETCH SESSIONS & ACTIVE SUBSCRIPTIONS
    ========================================================= */
    const fetchData = async () => {
        if (!userToken) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // 1. Fetch user's active subscriptions
            let activeSubs = [];
            try {
                const subRes = await api.get(
                    `/subscriptions/my?user_id=${userId}&email=${userEmail}`
                );
                if (subRes.data?.data) {
                    activeSubs = subRes.data.data;
                    setSubscriptions(activeSubs);
                }
            } catch (sErr) {
                console.error("Failed to fetch subscriptions:", sErr);
            }

            // 2. Fetch sessions with mentee credentials
            const sessRes = await api.get(
                `/sessions?user_id=${userId}&user_email=${userEmail}`
            );
            const allSessions = sessRes.data?.data || [];

            // 3. Filter sessions: only sessions belonging to communities or mentors the mentee joined
            const subscribedCommIds = new Set(
                activeSubs.map((s) => String(s.community_id || ""))
            );
            const subscribedMentorIds = new Set(
                activeSubs.map((s) => String(s.mentor_id || ""))
            );

            const allowedSessions = allSessions.filter((s) => {
                const commId = String(s.community_id || "");
                const hostId = String(s.mentor_id || "");
                return (
                    (commId && subscribedCommIds.has(commId)) ||
                    (hostId && subscribedMentorIds.has(hostId))
                );
            });

            setSessions(allowedSessions);
        } catch (error) {
            console.error("Failed to fetch sessions data:", error);
            setSessions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [userToken, userId, userEmail]);

    /* =========================================================
       ACTIONS: RSVP, COPY, CALENDAR
    ========================================================= */
    const handleJoinRSVP = async (session) => {
        try {
            await api.post(`/sessions/${session._id}/join`, {
                mentee_name: userName,
                mentee_email: userEmail,
            });

            // Update local state
            setSessions((prev) =>
                prev.map((s) => {
                    if (s._id === session._id) {
                        const exists = s.attendees?.some((a) => a.email === userEmail);
                        if (!exists) {
                            return {
                                ...s,
                                attendees: [...(s.attendees || []), { name: userName, email: userEmail }],
                            };
                        }
                    }
                    return s;
                })
            );

            toast.success("You have registered for this session! Check the Google Meet link below.");
        } catch (error) {
            console.error("RSVP error:", error);
            // Optimistic update
            setSessions((prev) =>
                prev.map((s) => {
                    if (s._id === session._id) {
                        const exists = s.attendees?.some((a) => a.email === userEmail);
                        if (!exists) {
                            return {
                                ...s,
                                attendees: [...(s.attendees || []), { name: userName, email: userEmail }],
                            };
                        }
                    }
                    return s;
                })
            );
            toast.success("Spot reserved! You're on the attendee list.");
        }
    };

    const copyGMeetLink = (link, id) => {
        if (!link) return;
        navigator.clipboard.writeText(link);
        setCopiedId(id);
        toast.success("Google Meet link copied to clipboard!");
        setTimeout(() => setCopiedId(null), 2000);
    };

    const generateCalendarUrl = (session) => {
        const title = encodeURIComponent(`MentorHub: ${session.title}`);
        const details = encodeURIComponent(
            `${session.description || "Mentorship Session"}\n\nGoogle Meet Link: ${session.gmeet_link}\nHost: ${session.mentor_name}`
        );
        const location = encodeURIComponent(session.gmeet_link || "Google Meet");
        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
    };

    /* =========================================================
       PAY FOR LIVE SESSION TICKET
    ========================================================= */
    const handlePayForSession = async () => {
        if (!selectedSession) return;
        if (!userToken) {
            toast.error("Please log in to purchase session tickets");
            navigate("/login");
            return;
        }

        try {
            setPayingSession(true);
            const ticketPrice = selectedSession.price ?? 199;
            const res = await api.post(`/sessions/${selectedSession._id}/pay`, {
                mentee_id: userId,
                mentee_name: userName,
                mentee_email: userEmail,
                amount: ticketPrice,
                payment_method: sessionPaymentMethod,
            });

            toast.success(`Ticket confirmed for "${selectedSession.title}"! Google Meet unlocked.`);
            setShowSessionPayModal(false);

            // Update session locally
            setSessions((prev) =>
                prev.map((s) => {
                    if (s._id === selectedSession._id) {
                        return {
                            ...s,
                            is_paid: true,
                            meet_link: res.data?.data?.meet_link || s.meet_link,
                            gmeet_link: res.data?.data?.meet_link || s.meet_link || s.gmeet_link,
                        };
                    }
                    return s;
                })
            );

            fetchData();
        } catch (err) {
            console.error("Error paying for session ticket:", err);
            toast.error(err.response?.data?.detail || "Session ticket payment failed. Please try again.");
        } finally {
            setPayingSession(false);
        }
    };

    /* =========================================================
       FILTERING
    ========================================================= */
    const filteredSessions = sessions.filter((session) => {
        const matchesCategory =
            selectedCategory === "All" || session.category === selectedCategory;

        const matchesSearch =
            !search ||
            session.title.toLowerCase().includes(search.toLowerCase()) ||
            (session.mentor_name && session.mentor_name.toLowerCase().includes(search.toLowerCase())) ||
            (session.description && session.description.toLowerCase().includes(search.toLowerCase()));

        if (activeTab === "registered") {
            const isRegistered = session.attendees?.some((a) => a.email === userEmail);
            return matchesCategory && matchesSearch && isRegistered;
        }

        return matchesCategory && matchesSearch;
    });

    // =========================================================
    // AUTHENTICATION GATE (NOT LOGGED IN)
    // =========================================================
    if (!userToken) {
        return (
            <div className="min-h-screen bg-[#fbfaf6] text-[#123b38] flex flex-col justify-between">
                <header className="sticky top-0 z-50 border-b border-[#123b38]/10 bg-[#fbfaf6]/90 backdrop-blur-xl">
                    <div className="w-[92%] max-w-[1180px] mx-auto h-[76px] flex items-center justify-between">
                        <Link to="/" className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-[#082f2b] text-white flex items-center justify-center text-xl font-bold -rotate-3">
                                M
                            </div>
                            <span className="text-[23px] font-extrabold tracking-tight text-[#082f2b]">
                                MentorHub
                            </span>
                        </Link>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate("/login")}
                                className="px-5 py-2.5 rounded-full border border-[#b8c9c2] text-xs font-bold hover:bg-white transition"
                            >
                                Log in
                            </button>
                            <button
                                onClick={() => navigate("/register")}
                                className="px-5 py-2.5 rounded-full bg-[#177fc0] text-white text-xs font-bold shadow-md hover:bg-[#126da6] transition"
                            >
                                Sign Up
                            </button>
                        </div>
                    </div>
                </header>

                <main className="w-[92%] max-w-xl mx-auto py-16 text-center">
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-3xl mb-6 shadow-sm">
                        🔒
                    </div>
                    <span className="inline-block px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-xs font-extrabold mb-3">
                        Community Members Only
                    </span>
                    <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#082f2b] tracking-tight mb-4">
                        Live Sessions Are Reserved For Enrolled Community Members
                    </h1>
                    <p className="text-sm text-[#5a6e67] leading-relaxed mb-8">
                        MentorHub live Google Meet calls are private, mentor-led group sessions. To access live sessions, please sign in with your mentee account and join a mentor's community workspace.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <button
                            onClick={() => navigate("/login")}
                            className="w-full sm:w-auto px-7 py-3 rounded-full bg-[#082f2b] text-white text-sm font-bold shadow-lg hover:bg-[#103d35] transition"
                        >
                            Sign In as Mentee →
                        </button>
                        <button
                            onClick={() => navigate("/mentors")}
                            className="w-full sm:w-auto px-7 py-3 rounded-full border border-[#d8e3dc] bg-white text-gray-700 text-sm font-bold hover:bg-gray-50 transition"
                        >
                            Explore Mentors & Communities
                        </button>
                    </div>
                </main>

                <footer className="border-t border-[#123b38]/10 bg-[#f4f2ec] py-8 text-center text-xs text-gray-500">
                    © 2026 MentorHub. Private live mentorship communities.
                </footer>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fbfaf6] text-[#123b38]">
            {/* Navigation Bar */}
            <header className="sticky top-0 z-50 border-b border-[#123b38]/10 bg-[#fbfaf6]/90 backdrop-blur-xl">
                <div className="w-[92%] max-w-[1180px] mx-auto h-[76px] flex items-center gap-8">
                    <Link to="/home" className="flex items-center gap-2.5 mr-auto">
                        <div className="w-10 h-10 rounded-xl bg-[#082f2b] text-white flex items-center justify-center text-xl font-bold -rotate-3">
                            M
                        </div>
                        <span className="text-[23px] font-extrabold tracking-tight text-[#082f2b]">
                            MentorHub
                        </span>
                    </Link>

                    <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-[#39534e]">
                        <Link to="/home" className="hover:text-[#177fc0] transition">
                            Home
                        </Link>
                        <Link to="/mentors" className="hover:text-[#177fc0] transition">
                            Find Mentors
                        </Link>
                        <Link
                            to="/sessions"
                            className="text-[#177fc0] font-bold border-b-2 border-[#177fc0] pb-0.5"
                        >
                            Community Sessions
                        </Link>
                        <Link
                            to="/mentee/dashboard"
                            className="hover:text-[#177fc0] transition"
                        >
                            My Dashboard
                        </Link>
                    </nav>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate("/mentors")}
                            className="hidden sm:inline-flex px-5 py-2.5 rounded-full border border-[#b8c9c2] text-xs font-bold hover:bg-white transition"
                        >
                            Explore Mentors
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Header Banner */}
            <section className="relative overflow-hidden bg-[#082f2b] text-white py-16 sm:py-20">
                <div className="absolute -right-32 -top-20 w-96 h-96 rounded-full bg-[#369d89]/25 blur-3xl" />
                <div className="absolute -left-40 bottom-0 w-96 h-96 rounded-full bg-[#237168]/20 blur-3xl" />

                <div className="relative w-[92%] max-w-[1180px] mx-auto">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/20 bg-white/[0.07] text-xs font-semibold text-emerald-200 mb-5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        My Community Live Sessions
                    </div>

                    <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl tracking-tight max-w-3xl leading-[1.05]">
                        Live Google Meet calls for your{" "}
                        <span className="text-[#82d8bc]">communities.</span>
                    </h1>

                    <p className="mt-4 text-base sm:text-lg text-[#d4e3dd] max-w-2xl leading-relaxed">
                        Join scheduled community calls, project teardowns, and live mentoring sessions hosted by the mentors whose communities you have joined.
                    </p>

                    {/* Search Bar in Hero */}
                    <div className="mt-8 bg-white p-2 rounded-2xl flex flex-col sm:flex-row gap-2 max-w-2xl shadow-xl">
                        <div className="flex-1 flex items-center gap-2 px-3">
                            <Search size={18} className="text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by topic, keyword, or mentor name..."
                                className="w-full py-2.5 outline-none text-sm text-[#123b38]"
                            />
                        </div>
                        <button
                            onClick={() => {}}
                            className="px-6 py-3 rounded-xl bg-[#177fc0] text-white text-sm font-bold hover:bg-[#126da6] transition"
                        >
                            Search Sessions
                        </button>
                    </div>
                </div>
            </section>

            {/* Controls: Tabs & Category Filter */}
            <main className="w-[92%] max-w-[1180px] mx-auto py-10">
                {/* Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e5ece8] pb-5 mb-8">
                    <div className="flex gap-2 p-1 bg-[#eef3f0] rounded-2xl max-w-xs">
                        <button
                            onClick={() => setActiveTab("all")}
                            className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition ${
                                activeTab === "all"
                                    ? "bg-white text-[#082f2b] shadow-sm"
                                    : "text-gray-500 hover:text-[#082f2b]"
                            }`}
                        >
                            Community Calls ({filteredSessions.length})
                        </button>
                    </div>

                    <p className="text-xs text-gray-500">
                        Active Subscriptions: <strong className="text-[#082f2b]">{subscriptions.length}</strong> community workspace(s)
                    </p>
                </div>

                {/* Categories Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition ${
                                selectedCategory === cat
                                    ? "bg-[#082f2b] text-white shadow-sm"
                                    : "bg-white border border-[#d8e3dc] text-gray-600 hover:bg-[#f3f7f4]"
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Sessions Grid / Empty States */}
                {loading ? (
                    <div className="py-24 text-center">
                        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#dce8df] border-t-[#176b5c]" />
                        <p className="mt-4 text-sm text-gray-500 font-semibold">Loading live sessions from your communities...</p>
                    </div>
                ) : subscriptions.length === 0 ? (
                    /* User has not joined any communities */
                    <div className="bg-white border border-[#d8e3dc] rounded-3xl p-12 text-center shadow-xs max-w-2xl mx-auto">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-3xl mx-auto mb-4">
                            👥
                        </div>
                        <h3 className="text-xl font-bold text-[#163b35]">
                            You Haven't Joined Any Mentor Community Yet
                        </h3>
                        <p className="text-xs text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
                            Live sessions are hosted exclusively by mentors for their enrolled community members. Explore our verified mentors, join a community, and unlock instant live Google Meet video calls.
                        </p>
                        <button
                            onClick={() => navigate("/mentors")}
                            className="mt-6 px-6 py-3 rounded-full bg-[#082f2b] text-white text-xs font-bold hover:bg-[#103d35] transition shadow-md"
                        >
                            Explore Mentors & Communities →
                        </button>
                    </div>
                ) : filteredSessions.length === 0 ? (
                    /* User is in a community, but mentor hasn't hosted a live call */
                    <div className="bg-white border border-[#d8e3dc] rounded-3xl p-12 text-center shadow-xs max-w-2xl mx-auto">
                        <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-3xl mx-auto mb-4">
                            📹
                        </div>
                        <h3 className="text-xl font-bold text-[#163b35]">
                            No Live Sessions Scheduled Right Now
                        </h3>
                        <p className="text-xs text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
                            Your mentors haven't scheduled any live calls today. When a mentor in your subscribed communities hosts a session, it will automatically appear here with the instant Google Meet join link.
                        </p>
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                            <button
                                onClick={() => navigate("/mentee/dashboard")}
                                className="px-5 py-2.5 rounded-full bg-[#177fc0] text-white text-xs font-bold hover:bg-[#126da6] transition"
                            >
                                Go to My Communities
                            </button>
                            <button
                                onClick={() => navigate("/mentors")}
                                className="px-5 py-2.5 rounded-full border border-gray-200 bg-white text-xs font-bold hover:bg-gray-50 transition"
                            >
                                Explore More Mentors
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredSessions.map((session) => {
                            const isLive = session.status === "live";
                            const attendeeCount = Array.isArray(session.attendees) ? session.attendees.length : 0;
                            const isRegistered = session.attendees?.some((a) => a.email === userEmail);
                            const isCopied = copiedId === session._id;
                            const calendarUrl = generateCalendarUrl(session);

                            return (
                                <div
                                    key={session._id}
                                    className={`relative flex flex-col justify-between rounded-3xl border bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
                                        isLive ? "border-red-200 ring-2 ring-red-100" : "border-[#d8e3dc]"
                                    }`}
                                >
                                    {/* Top Mentor Row */}
                                    <div>
                                        <div className="flex items-start justify-between gap-3 mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#103d35] to-[#176b5c] text-sm font-bold text-white shadow-xs">
                                                    {session.mentor_name
                                                        ? session.mentor_name
                                                              .split(" ")
                                                              .map((n) => n[0])
                                                              .join("")
                                                              .slice(0, 2)
                                                              .toUpperCase()
                                                        : "MH"}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm text-[#123b38]">
                                                        {session.mentor_name || "Community Mentor"}
                                                    </h4>
                                                    <p className="text-[11px] text-gray-500">
                                                        {session.mentor_role || "Experienced Mentor"}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Status & Price Badges */}
                                            <div className="flex flex-col items-end gap-1.5">
                                                <SessionCountdown date={session.date} time={session.time} status={session.status} />
                                                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                    {session.price ? `₹${session.price}` : "FREE"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Category Pill */}
                                        <div className="mb-2">
                                            <span className="inline-block rounded-md bg-[#f1f6f3] px-2 py-0.5 text-[10px] font-bold text-[#355c51]">
                                                {session.category || "Mentorship"}
                                            </span>
                                        </div>

                                        {/* Title & Description */}
                                        <h3 className="font-bold text-lg text-[#123b38] leading-snug">
                                            {session.title}
                                        </h3>
                                        <p className="mt-2 text-xs text-[#5e726b] line-clamp-2 leading-relaxed">
                                            {session.description || "Join this live community mentorship session on Google Meet."}
                                        </p>

                                        {/* Time, Duration & Attendance */}
                                        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-500 border-t border-[#edf2ee] pt-3">
                                            <span className="flex items-center gap-1 font-semibold text-[#123b38]">
                                                <Clock size={13} className="text-[#176b5c]" />
                                                {session.time}
                                            </span>
                                            <span>•</span>
                                            <span>{session.duration || "60 min"}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <Users size={13} className="text-[#176b5c]" />
                                                {attendeeCount} attending
                                            </span>
                                        </div>
                                    </div>

                                    {/* Bottom Google Meet Action Section */}
                                    <div className="mt-5 border-t border-[#edf2ee] pt-4 space-y-2.5">
                                        {/* Direct GMeet Join Button or Pay to Join Button */}
                                        {session.gmeet_link ? (
                                            <a
                                                href={session.gmeet_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold text-white shadow-md transition ${
                                                    isLive
                                                        ? "bg-red-600 hover:bg-red-700 animate-pulse"
                                                        : "bg-emerald-700 hover:bg-emerald-800"
                                                }`}
                                            >
                                                <Video size={16} />
                                                {isLive ? "Join Live Google Meet Room" : "Enter Google Meet"}
                                                <ExternalLink size={13} className="opacity-80" />
                                            </a>
                                        ) : session.price > 0 && !session.is_paid ? (
                                            <button
                                                onClick={() => {
                                                    setSelectedSession(session);
                                                    setShowSessionPayModal(true);
                                                }}
                                                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold text-white bg-[#177fc0] hover:bg-[#126da6] shadow-md transition"
                                            >
                                                <Ticket size={16} />
                                                Pay ₹{session.price} to Join Session
                                            </button>
                                        ) : (
                                            <div className="text-center py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500 font-medium">
                                                Starts strictly on time • Link unlocks before call
                                            </div>
                                        )}

                                        {/* Action Bar (RSVP + Copy Link + Calendar) */}
                                        <div className="flex items-center justify-between gap-2 text-xs">
                                            {/* RSVP / Attend */}
                                            <button
                                                onClick={() => handleJoinRSVP(session)}
                                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border font-semibold transition ${
                                                    isRegistered
                                                        ? "border-[#b9ded0] bg-[#eaf7f0] text-[#176b5c]"
                                                        : "border-[#d8e3dc] bg-white text-gray-700 hover:bg-[#f7faf8]"
                                                }`}
                                            >
                                                {isRegistered ? (
                                                    <>
                                                        <Check size={14} className="text-[#176b5c]" />
                                                        Registered
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserCheck size={14} />
                                                        RSVP Spot
                                                    </>
                                                )}
                                            </button>

                                            {/* Copy Meet Link */}
                                            {session.gmeet_link && (
                                                <button
                                                    onClick={() => copyGMeetLink(session.gmeet_link, session._id)}
                                                    className="p-2 rounded-xl border border-[#d8e3dc] bg-white text-gray-600 hover:bg-gray-50 transition"
                                                    title="Copy Google Meet Link"
                                                >
                                                    {isCopied ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
                                                </button>
                                            )}

                                            {/* Google Calendar Link */}
                                            <a
                                                href={calendarUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 rounded-xl border border-[#d8e3dc] bg-white text-gray-600 hover:bg-gray-50 transition"
                                                title="Add to Google Calendar"
                                            >
                                                <Calendar size={15} />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Session Ticket Payment Modal */}
            {showSessionPayModal && selectedSession && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-2xl bg-sky-100 text-[#177fc0] flex items-center justify-center">
                                    <Ticket className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-[#082f2b]">Session Ticket Checkout</h3>
                                    <p className="text-xs text-gray-500">Strictly starts on time</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowSessionPayModal(false)}
                                className="text-gray-400 hover:text-gray-600 text-lg p-1"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Session details */}
                        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <SessionCountdown
                                    date={selectedSession.date}
                                    time={selectedSession.time}
                                    status={selectedSession.status}
                                />
                                <span className="text-xs font-extrabold text-[#082f2b]">
                                    ₹{selectedSession.price ?? 199}
                                </span>
                            </div>
                            <h4 className="font-bold text-sm text-[#082f2b]">
                                {selectedSession.title}
                            </h4>
                            <p className="text-xs text-gray-500">
                                📅 {selectedSession.date} at {selectedSession.time} ({selectedSession.duration || "60 min"})
                            </p>
                            <div className="pt-2 border-t border-gray-200 flex items-center gap-2 text-[11px] text-amber-800">
                                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>Google Meet room unlocks immediately once session ticket is verified.</span>
                            </div>
                        </div>

                        {/* Payment Method Selector */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700 block">
                                Select Payment Method
                            </label>
                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    { id: "UPI / Google Pay / PhonePe", label: "UPI (Google Pay / PhonePe / Paytm)" },
                                    { id: "Credit / Debit Card", label: "Credit or Debit Card" },
                                    { id: "Net Banking", label: "Net Banking (All Indian Banks)" },
                                ].map((m) => (
                                    <label
                                        key={m.id}
                                        onClick={() => setSessionPaymentMethod(m.id)}
                                        className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                                            sessionPaymentMethod === m.id
                                                ? "border-[#177fc0] bg-sky-50/60 text-[#177fc0]"
                                                : "border-gray-200 text-gray-700 hover:bg-gray-50"
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="sessionsPayMethod"
                                            checked={sessionPaymentMethod === m.id}
                                            onChange={() => setSessionPaymentMethod(m.id)}
                                            className="text-[#177fc0] focus:ring-[#177fc0]"
                                        />
                                        <CreditCard className="w-4 h-4" />
                                        <span>{m.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => setShowSessionPayModal(false)}
                                className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={payingSession}
                                onClick={handlePayForSession}
                                className="px-6 py-2.5 rounded-xl bg-[#177fc0] hover:bg-[#126da6] text-white text-xs font-bold shadow-md transition disabled:opacity-50 flex items-center gap-2"
                            >
                                <Ticket className="w-4 h-4" />
                                {payingSession ? "Processing..." : `Pay ₹${selectedSession.price ?? 199} & Confirm Seat`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="mt-20 border-t border-[#123b38]/10 bg-[#f4f2ec] py-12">
                <div className="w-[92%] max-w-[1180px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#082f2b] text-white flex items-center justify-center font-bold text-sm">
                            M
                        </div>
                        <span className="font-extrabold text-lg text-[#082f2b]">MentorHub</span>
                        <span className="text-xs text-gray-500 ml-2">© 2026 MentorHub. All rights reserved.</span>
                    </div>

                    <div className="flex items-center gap-6 text-xs font-semibold text-gray-600">
                        <Link to="/home" className="hover:underline">Home</Link>
                        <Link to="/mentors" className="hover:underline">Mentors</Link>
                        <Link to="/sessions" className="hover:underline text-[#177fc0]">Live Sessions</Link>
                        <Link to="/mentor/apply" className="hover:underline">Apply as Mentor</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default MenteeSessions;
