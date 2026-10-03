import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import {
    Users,
    Video,
    Calendar,
    Clock,
    Shield,
    CheckCircle2,
    Send,
    MessageSquare,
    BookOpen,
    AlertCircle,
    ArrowLeft,
    ExternalLink,
    Copy,
    Check,
    Lock,
    Sparkles,
    CreditCard,
    DollarSign,
    Ticket,
    MessageCircle,
    X,
} from "lucide-react";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import api from "../api.js";
import toast, { Toaster } from "react-hot-toast";

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

const CommunityDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const tabParam = searchParams.get("tab");
    const [community, setCommunity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(
        tabParam === "chat" ? "chat" : tabParam === "sessions" ? "sessions" : "overview"
    );
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [sessions, setSessions] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [copiedSessionId, setCopiedSessionId] = useState(null);

    // Payment modal state for community subscription
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("Demo Razorpay / UPI");
    const [processingPayment, setProcessingPayment] = useState(false);

    // Session ticket payment modal state
    const [selectedSessionForPay, setSelectedSessionForPay] = useState(null);
    const [showSessionPayModal, setShowSessionPayModal] = useState(false);
    const [sessionPaymentMethod, setSessionPaymentMethod] = useState("UPI / Google Pay / PhonePe");
    const [payingSession, setPayingSession] = useState(false);

    const chatEndRef = useRef(null);
    const wsRef = useRef(null);

    const hasUserToken = !!localStorage.getItem("userToken");
    const userId = localStorage.getItem("userId") || localStorage.getItem("userEmail") || "";
    const userName = localStorage.getItem("userName") || "Mentee";
    const userEmail = localStorage.getItem("userEmail") || "";

    // The current viewer is ONLY the host mentor if they do NOT have a userToken,
    // DO have a mentorToken, and their mentorId matches this community's mentor_id
    const mentorToken = localStorage.getItem("mentorToken");
    const mentorId = localStorage.getItem("mentorId");
    const isMentor = !hasUserToken && !!mentorToken && !!mentorId && (!community || String(community.mentor_id) === String(mentorId));

    /* =========================================================
       FETCH COMMUNITY & SUBSCRIPTION STATUS
    ========================================================= */
    useEffect(() => {
        fetchCommunityData();


        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [id]);

    const fetchCommunityData = async () => {
        try {
            setLoading(true);
            let targetId = id;

            // If ID is missing or invalid placeholder, find user's joined community or fallback
            if (!targetId || targetId === "undefined" || targetId === "default") {
                if (userId || userEmail) {
                    try {
                        const subRes = await api.get(`/subscriptions/my?user_id=${encodeURIComponent(userId)}&email=${encodeURIComponent(userEmail)}`);
                        const mySubs = subRes.data?.data || [];
                        const activeSub = mySubs.find((s) => s.status === "active") || mySubs[0];
                        if (activeSub?.community_id) {
                            targetId = activeSub.community_id;
                        }
                    } catch (subErr) {
                        console.error("Error looking up active subscription:", subErr);
                    }
                }
                if (!targetId || targetId === "undefined") {
                    targetId = "default";
                }
            }

            const res = await api.get(`/communities/${targetId}`);
            if (res.data?.data) {
                const comm = res.data.data;
                setCommunity(comm);

                // Check if current user is the host mentor
                if (mentorId && (String(comm.mentor_id) === String(mentorId) || isMentor)) {
                    setIsSubscribed(true);
                } else if (userId || userEmail) {
                    // Check subscription status
                    try {
                        const subRes = await api.get(`/subscriptions/my?user_id=${encodeURIComponent(userId)}&email=${encodeURIComponent(userEmail)}`);
                        const mySubs = subRes.data?.data || [];
                        const hasActive = mySubs.some(
                            (s) => (String(s.community_id) === String(targetId) || String(s.community_id) === String(comm._id)) && s.status === "active"
                        );
                        const hasPending = mySubs.some(
                            (s) => (String(s.community_id) === String(targetId) || String(s.community_id) === String(comm._id)) && s.status === "pending"
                        );
                        setIsSubscribed(hasActive);
                        setIsPending(hasPending);
                    } catch (e) {
                        console.error("Error checking subscription:", e);
                    }
                }
            }
        } catch (err) {
            console.error("Error fetching community:", err);
            toast.error("Failed to load community details");
        } finally {
            setLoading(false);
        }
    };

    const handleJoinCommunityRequest = async () => {
        const token = localStorage.getItem("userToken");
        if (!token) {
            toast.error("Please log in as a mentee to join this community");
            navigate("/login");
            return;
        }
        try {
            const commId = community?._id || id;
            await api.post(`/communities/${commId}/join`, {
                mentee_id: userId,
                mentee_name: userName,
                mentee_email: userEmail
            });
            setIsPending(true);
            toast.success("Join request submitted! Pending mentor approval.");
        } catch (err) {
            console.error("Error joining community:", err);
            toast.error(err.response?.data?.detail || "Failed to submit join request");
        }
    };

    // When subscription is active or user enters, fetch sessions & messages
    useEffect(() => {
        if (community && (isSubscribed || isMentor)) {
            fetchCommunitySessions();
            fetchMessages();
            setupWebSocket();
        }
    }, [community, isSubscribed, isMentor]);

    const fetchCommunitySessions = async () => {
        try {
            const commId = community?._id || id;
            if (!commId || commId === "undefined") return;
            const res = await api.get(`/communities/${commId}/sessions?user_id=${userId}&user_email=${userEmail}`);
            if (res.data?.data) {
                setSessions(res.data.data);
            }
        } catch (err) {
            console.error("Error fetching community sessions:", err);
        }
    };


    const handlePayForSession = async () => {
        if (!selectedSessionForPay) return;
        const token = localStorage.getItem("userToken");
        if (!token) {
            toast.error("Please log in as a mentee to purchase session tickets");
            navigate("/login");
            return;
        }

        try {
            setPayingSession(true);
            const ticketPrice = selectedSessionForPay.price ?? 199;
            await api.post(`/sessions/${selectedSessionForPay._id}/pay`, {
                mentee_id: userId,
                mentee_name: userName,
                mentee_email: userEmail,
                amount: ticketPrice,
                payment_method: sessionPaymentMethod,
            });

            toast.success(`Ticket confirmed for "${selectedSessionForPay.title}"! Starts strictly on time.`);
            setShowSessionPayModal(false);
            fetchCommunitySessions();
        } catch (err) {
            console.error("Error paying for session ticket:", err);
            toast.error(err.response?.data?.detail || "Session ticket payment failed. Please try again.");
        } finally {
            setPayingSession(false);
        }
    };

    const fetchMessages = async () => {
        try {
            const commId = community?._id || id;
            if (!commId || commId === "undefined") return;
            const res = await api.get(`/communities/${commId}/messages`);
            if (res.data?.data) {
                setMessages(res.data.data);
                scrollToBottom();
            }
        } catch (err) {
            console.error("Error fetching community messages:", err);
        }
    };

    // Real-time polling fallback to ensure community messages stay in sync
    useEffect(() => {
        if (!community?._id || (!isSubscribed && !isMentor)) return;
        const interval = setInterval(() => {
            fetchMessages();
        }, 2500);
        return () => clearInterval(interval);
    }, [community?._id, isSubscribed, isMentor]);

    const setupWebSocket = () => {
        if (wsRef.current) wsRef.current.close();

        const commId = community?._id || id;
        if (!commId || commId === "undefined") return;

        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host = window.location.hostname === "localhost" ? "localhost:8000" : window.location.host;
        const socket = new WebSocket(`${protocol}//${host}/ws/community/${commId}`);

        socket.onopen = () => {
            console.log("Connected to Community Chat WebSocket");
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setMessages((prev) => [...prev, data]);
                scrollToBottom();
            } catch (err) {
                console.error("WebSocket message parse error:", err);
            }
        };

        socket.onerror = (err) => {
            console.error("WebSocket error:", err);
        };

        wsRef.current = socket;
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    /* =========================================================
       HANDLE SUBSCRIBE & PAYMENT
    ========================================================= */
    const handleSubscribe = async () => {
        const token = localStorage.getItem("userToken");
        if (!token) {
            toast.error("Please login as a mentee to join this community");
            navigate("/login");
            return;
        }

        try {
            setProcessingPayment(true);
            const payload = {
                community_id: id,
                mentee_id: userId || userEmail,
                mentee_name: userName || "Mentee",
                mentee_email: userEmail || "mentee@example.com",
                payment_method: paymentMethod,
                amount: community.monthly_fee || 0,
            };

            const res = await api.post(`/communities/${id}/subscribe`, payload);
            toast.success(res.data?.message || "Successfully enrolled in community!");
            setIsSubscribed(true);
            setShowPaymentModal(false);
            // Refresh community stats
            fetchCommunityData();
        } catch (err) {
            console.error("Subscription error:", err);
            const msg = err.response?.data?.detail || "Failed to complete subscription";
            toast.error(msg);
        } finally {
            setProcessingPayment(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const commId = community?._id || id;
        const role = isMentor ? "mentor" : "mentee";
        const sender = isMentor
            ? (localStorage.getItem("mentorName") || community?.mentor_name || "Mentor")
            : (localStorage.getItem("userName") || userName || "Mentee");
        const sId = isMentor
            ? (mentorId || "")
            : (localStorage.getItem("userId") || userEmail || userId);

        const msgPayload = {
            community_id: commId,
            sender_id: sId,
            sender_name: sender,
            sender_role: role,
            message: newMessage.trim(),
        };

        // Try WebSocket first
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(msgPayload));
            setNewMessage("");
        } else {
            // Fallback to REST API
            try {
                const res = await api.post(`/communities/${commId}/messages`, msgPayload);
                if (res.data?.data) {
                    setMessages((prev) => [...prev, res.data.data]);
                    setNewMessage("");
                    scrollToBottom();
                }
            } catch (err) {
                console.error("Failed to send message:", err);
                toast.error("Failed to send message");
            }
        }
    };

    const handleCopyGMeet = (sessionId, link) => {
        if (!link) {
            toast.error("No Google Meet link yet");
            return;
        }
        navigator.clipboard.writeText(link);
        setCopiedSessionId(sessionId);
        toast.success("Google Meet link copied!");
        setTimeout(() => setCopiedSessionId(null), 2500);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#fbfaf6] flex flex-col justify-between">
                <Navbar />
                <div className="flex-1 flex items-center justify-center py-20">
                    <div className="text-center space-y-3">
                        <div className="animate-spin w-10 h-10 border-4 border-[#177fc0] border-t-transparent rounded-full mx-auto" />
                        <p className="text-sm font-semibold text-gray-500">Loading community workspace...</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (!community) {
        return (
            <div className="min-h-screen bg-[#fbfaf6] flex flex-col justify-between">
                <Navbar />
                <div className="flex-1 flex items-center justify-center py-20">
                    <div className="text-center space-y-4 max-w-md mx-auto p-6 bg-white rounded-3xl border border-gray-200">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                        <h2 className="text-2xl font-bold text-[#082f2b]">Community Not Found</h2>
                        <p className="text-sm text-gray-500">This community may have been archived or removed.</p>
                        <Link
                            to="/mentors"
                            className="inline-block px-6 py-2.5 rounded-full bg-[#082f2b] text-white text-sm font-bold"
                        >
                            Back to Mentors
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    const capacity = community.capacity || 20;
    const currentMembers = community.current_members || 0;
    const slotsAvailable = Math.max(0, capacity - currentMembers);
    const capacityPercent = Math.min(100, Math.round((currentMembers / capacity) * 100));
    const isFull = currentMembers >= capacity;

    return (
        <div className="min-h-screen bg-[#fbfaf6] text-[#123b38]">
            <Toaster position="top-right" />
            <Navbar />

            <div className="w-[92%] max-w-[1200px] mx-auto py-8 lg:py-12 space-y-8">
                {/* Back Link */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#082f2b] transition"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                            {community.category || "Mentorship"}
                        </span>
                        {isFull ? (
                            <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                                Capacity Full
                            </span>
                        ) : (
                            <span className="px-3 py-1 bg-sky-100 text-[#177fc0] text-xs font-bold rounded-full">
                                {slotsAvailable} Slots Available
                            </span>
                        )}
                    </div>
                </div>

                {/* Hero Header Card */}
                <div className="bg-white rounded-3xl border border-[#123b38]/10 p-6 sm:p-10 shadow-sm space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-3 max-w-2xl">
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#082f2b] tracking-tight">
                                {community.name}
                            </h1>
                            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                                {community.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500 pt-1">
                                <div className="flex items-center gap-2">
                                    {community.mentor?.profilePic ? (
                                        <img
                                            src={`data:${community.mentor.profilePicType || "image/jpeg"};base64,${community.mentor.profilePic}`}
                                            alt={community.mentor_name}
                                            className="w-7 h-7 rounded-full object-cover border border-emerald-600/30"
                                        />
                                    ) : (
                                        <div className="w-7 h-7 rounded-full bg-emerald-800 text-white flex items-center justify-center text-[10px] font-bold">
                                            {community.mentor_name ? community.mentor_name.charAt(0).toUpperCase() : "M"}
                                        </div>
                                    )}
                                    <span>Hosted by <strong className="text-[#082f2b]">{community.mentor_name || "Verified Mentor"}</strong></span>
                                </div>
                                <span>•</span>
                                <span>{community.mentor_role || "Senior Mentor"}</span>
                                <span>•</span>
                                <span>{community.start_date || "Continuous"} to {community.end_date || "Ongoing"}</span>
                            </div>
                        </div>

                        {/* Subscription & Action Box */}
                        <div className="bg-[#fbfaf6] border border-[#123b38]/10 rounded-2xl p-6 sm:w-80 shrink-0 text-center space-y-4">
                            <div className="space-y-1">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Membership Fee
                                </span>
                                <p className="text-3xl font-extrabold text-[#082f2b]">
                                    {community.monthly_fee ? `₹${community.monthly_fee}` : "Free"}
                                    <span className="text-xs font-normal text-gray-500"> / month</span>
                                </p>
                            </div>

                            {/* Capacity Bar */}
                            <div className="space-y-1.5 text-left">
                                <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                                    <span className="flex items-center gap-1">
                                        <Users className="w-3.5 h-3.5 text-[#177fc0]" /> Capacity
                                    </span>
                                    <span>{currentMembers} / {capacity} members</span>
                                </div>
                                <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${
                                            capacityPercent >= 100
                                                ? "bg-red-500"
                                                : capacityPercent > 80
                                                ? "bg-amber-500"
                                                : "bg-emerald-500"
                                        }`}
                                        style={{ width: `${capacityPercent}%` }}
                                    />
                                </div>
                                <p className="text-[11px] text-gray-400 text-center">
                                    {isFull ? "Maximum slots reached" : `${slotsAvailable} spots remaining`}
                                </p>
                            </div>

                            {isSubscribed ? (
                                <div className="flex flex-col sm:flex-row items-center gap-2">
                                    <div className="w-full sm:flex-1 py-3 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-extrabold flex items-center justify-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                                        Active Member
                                    </div>
                                    {community.mentor_id && (
                                        <button
                                            onClick={() => navigate(`/messages?tab=direct&mentor_id=${community.mentor_id}`)}
                                            className="w-full sm:w-auto py-3 px-4 rounded-xl bg-[#082f2b] hover:bg-[#103d35] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                                            title="Chat 1-on-1 with mentor for free"
                                        >
                                            <MessageCircle className="w-4 h-4 text-sky-400" />
                                            <span>1-on-1 Chat</span>
                                        </button>
                                    )}
                                </div>
                            ) : isPending ? (
                                <div className="w-full py-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center justify-center gap-2 shadow-xs">
                                    <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                                    <span>Requested • Pending Mentor Approval</span>
                                </div>
                            ) : isFull ? (
                                <button
                                    disabled
                                    className="w-full py-3 rounded-xl bg-gray-200 text-gray-400 text-xs font-bold cursor-not-allowed"
                                >
                                    Community Full (Waitlist Only)
                                </button>
                            ) : (
                                <button
                                    onClick={handleJoinCommunityRequest}
                                    className="w-full py-3.5 rounded-xl bg-[#082f2b] hover:bg-[#103d35] text-white text-sm font-bold shadow-lg shadow-[#082f2b]/15 transition flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <Sparkles className="w-4 h-4 text-emerald-300" />
                                    Join His Community
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Skill Tags */}
                    {community.skills && (
                        <div className="border-t border-gray-100 pt-4 flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-gray-500">Skills Covered:</span>
                            {community.skills.split(",").map((s, i) => (
                                <span
                                    key={i}
                                    className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg"
                                >
                                    {s.trim()}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Main Interactive Tab Navigation */}
                <div className="flex border-b border-gray-200 space-x-6 text-sm font-bold">
                    <button
                        onClick={() => setActiveTab("overview")}
                        className={`pb-3 border-b-2 transition flex items-center gap-2 ${
                            activeTab === "overview"
                                ? "border-[#082f2b] text-[#082f2b]"
                                : "border-transparent text-gray-500 hover:text-[#082f2b]"
                        }`}
                    >
                        <BookOpen className="w-4 h-4" />
                        Overview & Rules
                    </button>

                    <button
                        onClick={() => setActiveTab("sessions")}
                        className={`pb-3 border-b-2 transition flex items-center gap-2 ${
                            activeTab === "sessions"
                                ? "border-[#082f2b] text-[#082f2b]"
                                : "border-transparent text-gray-500 hover:text-[#082f2b]"
                        }`}
                    >
                        <Video className="w-4 h-4" />
                        Live Google Meet Sessions ({sessions.length})
                    </button>

                    <button
                        onClick={() => setActiveTab("chat")}
                        className={`pb-3 border-b-2 transition flex items-center gap-2 ${
                            activeTab === "chat"
                                ? "border-[#082f2b] text-[#082f2b]"
                                : "border-transparent text-gray-500 hover:text-[#082f2b]"
                        }`}
                    >
                        <MessageSquare className="w-4 h-4" />
                        Community Chat
                        {isSubscribed && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                    </button>
                </div>

                {/* TAB CONTENT: OVERVIEW */}
                {activeTab === "overview" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white rounded-3xl border border-[#123b38]/10 p-6 sm:p-8 space-y-4">
                                <h3 className="text-xl font-bold text-[#082f2b] flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-[#177fc0]" /> About This Mentorship Program
                                </h3>
                                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                                    {community.description}
                                </p>
                            </div>

                            {community.rules && (
                                <div className="bg-white rounded-3xl border border-[#123b38]/10 p-6 sm:p-8 space-y-4">
                                    <h3 className="text-xl font-bold text-[#082f2b] flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-emerald-600" /> Community Rules & Expectations
                                    </h3>
                                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                                        {community.rules}
                                    </p>
                                </div>
                            )}

                            {/* Community Benefits & Perks */}
                            <div className="bg-white rounded-3xl border border-[#123b38]/10 p-6 sm:p-8 space-y-4">
                                <h3 className="text-xl font-bold text-[#082f2b] flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-amber-500" /> What You Get in This Community
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                    <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-3">
                                        <Video className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                                        <div>
                                            <h5 className="text-xs font-bold text-[#082f2b]">Live Interactive Sessions</h5>
                                            <p className="text-[11px] text-gray-500">Scheduled Google Meet calls starting strictly on time.</p>
                                        </div>
                                    </div>
                                    <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-100 flex items-start gap-3">
                                        <MessageSquare className="w-5 h-5 text-[#177fc0] shrink-0 mt-0.5" />
                                        <div>
                                            <h5 className="text-xs font-bold text-[#082f2b]">Active Group Discussion</h5>
                                            <p className="text-[11px] text-gray-500">Collaborate and chat in real-time with fellow community members.</p>
                                        </div>
                                    </div>
                                    <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100 flex items-start gap-3">
                                        <MessageCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                        <div>
                                            <h5 className="text-xs font-bold text-[#082f2b]">Free 1-on-1 Chat</h5>
                                            <p className="text-[11px] text-gray-500">Send direct personal messages to your mentor.</p>
                                        </div>
                                    </div>
                                    <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-start gap-3">
                                        <Shield className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                                        <div>
                                            <h5 className="text-xs font-bold text-[#082f2b]">Career & Code Guidance</h5>
                                            <p className="text-[11px] text-gray-500">Industry-standard mentorship and learning resources.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar: Mentor Card */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-3xl border border-[#123b38]/10 p-6 space-y-4">
                                <h3 className="text-lg font-bold text-[#082f2b]">Program Mentor</h3>
                                <div className="flex items-center gap-4">
                                    {community.mentor?.profilePic ? (
                                        <img
                                            src={`data:${community.mentor.profilePicType || "image/jpeg"};base64,${community.mentor.profilePic}`}
                                            alt={community.mentor_name}
                                            className="w-14 h-14 rounded-2xl object-cover border border-emerald-600/20 shadow-xs"
                                        />
                                    ) : (
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#082f2b] to-[#176b5c] text-white flex items-center justify-center text-xl font-bold shadow-xs">
                                            {community.mentor_name ? community.mentor_name.charAt(0).toUpperCase() : "M"}
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="font-bold text-[#082f2b]">{community.mentor_name}</h4>
                                        <p className="text-xs text-gray-500">{community.mentor_role || "Industry Expert"}</p>
                                        {community.mentor?.company && (
                                            <p className="text-[11px] text-emerald-700 font-semibold">{community.mentor.company}</p>
                                        )}
                                    </div>
                                </div>
                                {community.mentor?.bio && (
                                    <p className="text-xs text-gray-600 line-clamp-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        {community.mentor.bio}
                                    </p>
                                )}
                                <button
                                    onClick={() => setActiveTab("chat")}
                                    className="w-full py-2.5 px-4 rounded-xl bg-[#082f2b] hover:bg-[#103d35] text-white text-xs font-bold text-center transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                                >
                                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                                    Open Community Chat
                                </button>
                                <Link
                                    to={`/mentor-profile?mentor_id=${community.mentor_id}`}
                                    className="block text-center py-2 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-semibold transition text-gray-600"
                                >
                                    View Full Mentor Profile & Reviews
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB CONTENT: LIVE SESSIONS */}
                {activeTab === "sessions" && (
                    <div className="space-y-6">
                        {!isSubscribed && !isMentor ? (
                            <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-4 max-w-xl mx-auto">
                                <Lock className="w-12 h-12 text-gray-400 mx-auto" />
                                <h3 className="text-xl font-bold text-[#082f2b]">Sessions Protected for Members Only</h3>
                                <p className="text-sm text-gray-500">
                                    Join this community to get access to scheduled live Google Meet sessions and private mentorship links.
                                </p>
                                <button
                                    onClick={() => setShowPaymentModal(true)}
                                    className="px-6 py-2.5 rounded-full bg-[#082f2b] text-white text-xs font-bold shadow"
                                >
                                    Subscribe to Unlock Sessions
                                </button>
                            </div>
                        ) : sessions.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {sessions.map((sess) => (
                                    <div
                                        key={sess._id}
                                        className="bg-white rounded-3xl border border-[#123b38]/10 p-6 shadow-sm flex flex-col justify-between space-y-4"
                                    >
                                        <div className="space-y-3">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-[#177fc0] flex items-center gap-1">
                                                        <Video className="w-3.5 h-3.5" /> Google Meet
                                                    </span>
                                                    <SessionCountdown date={sess.date} time={sess.time} status={sess.status} />
                                                </div>
                                                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                    {sess.price ? `₹${sess.price}` : "FREE"}
                                                </span>
                                            </div>
                                            <h4 className="text-lg font-bold text-[#082f2b]">{sess.title}</h4>
                                            <p className="text-xs text-gray-500 line-clamp-2">{sess.description}</p>

                                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-xl">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5 text-[#177fc0]" />
                                                    <span>{sess.date}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5 text-[#177fc0]" />
                                                    <span>{sess.time} ({sess.duration})</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                                            {sess.gmeet_link ? (
                                                <>
                                                    <a
                                                        href={sess.gmeet_link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold text-center transition flex items-center justify-center gap-2"
                                                    >
                                                        <Video className="w-4 h-4" />
                                                        Join Google Meet
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                    <button
                                                        onClick={() => handleCopyGMeet(sess._id, sess.gmeet_link)}
                                                        className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600 transition"
                                                        title="Copy Link"
                                                    >
                                                        {copiedSessionId === sess._id ? (
                                                            <Check className="w-4 h-4 text-emerald-600" />
                                                        ) : (
                                                            <Copy className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </>
                                            ) : sess.price > 0 && !sess.is_paid && !isMentor ? (
                                                <button
                                                    onClick={() => {
                                                        setSelectedSessionForPay(sess);
                                                        setShowSessionPayModal(true);
                                                    }}
                                                    className="w-full py-2.5 px-4 rounded-xl bg-[#177fc0] hover:bg-[#146ba3] text-white text-xs font-bold text-center transition flex items-center justify-center gap-2 shadow-sm"
                                                >
                                                    <Ticket className="w-4 h-4" />
                                                    Pay ₹{sess.price} to Join Session
                                                </button>
                                            ) : (
                                                <span className="w-full py-2.5 px-4 rounded-xl bg-gray-100 text-gray-400 text-xs font-semibold text-center">
                                                    Starts strictly on time • Link unlocks before call
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center text-gray-500">
                                No sessions scheduled for this community yet. Check back soon!
                            </div>
                        )}
                    </div>
                )}

                {/* TAB CONTENT: COMMUNITY GROUP CHAT */}
                {activeTab === "chat" && (
                    <div className="bg-white rounded-3xl border border-[#123b38]/10 shadow-sm overflow-hidden flex flex-col h-[600px]">
                        {!isSubscribed && !isMentor ? (
                            <div className="flex-1 flex items-center justify-center p-8 text-center">
                                <div className="max-w-md space-y-4">
                                    <Lock className="w-12 h-12 text-gray-400 mx-auto" />
                                    <h3 className="text-xl font-bold text-[#082f2b]">Community Chat is Locked</h3>
                                    <p className="text-sm text-gray-500">
                                        Active subscribers can discuss topics, share project code, and ask questions directly to {community.mentor_name || "the mentor"}.
                                    </p>
                                    <button
                                        onClick={() => setShowPaymentModal(true)}
                                        className="px-6 py-2.5 rounded-full bg-[#082f2b] text-white text-xs font-bold shadow"
                                    >
                                        Subscribe to Join Chat
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-[#082f2b] text-white flex items-center justify-center font-bold text-sm">
                                            #
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-[#082f2b]">{community.name}</h4>
                                            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                Live community discussion channel
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-100">
                                            {messages.length} message{messages.length === 1 ? "" : "s"}
                                        </span>
                                    </div>
                                </div>

                                {/* Messages Feed */}
                                <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#fbfaf6]/40">
                                    {messages.length === 0 ? (
                                        <div className="text-center py-20 text-gray-400 text-xs space-y-2">
                                            <MessageSquare className="w-10 h-10 text-[#082f2b]/20 mx-auto" />
                                            <p className="font-bold text-gray-700 text-sm">No messages yet in this community chat</p>
                                            <p className="text-gray-400 max-w-sm mx-auto">
                                                Start the conversation! Say hello or ask a question to {community.mentor_name || "the mentor"} and fellow members.
                                            </p>
                                        </div>
                                    ) : (
                                        messages.map((m, idx) => {
                                            const isMe =
                                                (userId && String(m.sender_id) === String(userId)) ||
                                                (userEmail && (String(m.sender_id) === String(userEmail) || String(m.sender_email) === String(userEmail))) ||
                                                (!isMentor && userName && m.sender_name === userName && m.sender_role !== "mentor");

                                            const isMsgHostMentor =
                                                m.sender_role === "mentor" ||
                                                (community && (String(m.sender_id) === String(community.mentor_id) || m.sender_name === community.mentor_name));

                                            const time = m.created_at
                                                ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                                : "";
                                            const displayName = isMe ? "You" : (m.sender_name || "Community Member");
                                            const initial = (isMe ? (userName || "Y") : (m.sender_name || "M")).charAt(0).toUpperCase();

                                            return (
                                                <div
                                                    key={m._id || idx}
                                                    className={`flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                                                >
                                                    {/* Avatar */}
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs ${
                                                        isMe
                                                            ? "bg-[#082f2b] text-white"
                                                            : isMsgHostMentor
                                                            ? "bg-gradient-to-br from-[#103d35] to-[#176b5c] text-white"
                                                            : "bg-gray-200 text-gray-700"
                                                    }`}>
                                                        {initial}
                                                    </div>

                                                    {/* Bubble & Meta */}
                                                    <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[80%]`}>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs font-bold text-gray-700">
                                                                {displayName}
                                                            </span>
                                                            {!isMe && isMsgHostMentor && (
                                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold border border-emerald-200">
                                                                    ★ Host Mentor
                                                                </span>
                                                            )}
                                                            {!isMe && !isMsgHostMentor && (
                                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">
                                                                    Member
                                                                </span>
                                                            )}
                                                            <span className="text-[10px] text-gray-400">{time}</span>
                                                        </div>
                                                        <div
                                                            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-xs ${
                                                                isMe
                                                                    ? "bg-[#082f2b] text-white rounded-tr-none"
                                                                    : isMsgHostMentor
                                                                    ? "bg-emerald-50 text-[#082f2b] border border-emerald-200 rounded-tl-none font-medium"
                                                                    : "bg-white text-gray-800 border border-gray-200 rounded-tl-none"
                                                            }`}
                                                        >
                                                            {m.message}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Send Input */}
                                <form
                                    onSubmit={handleSendMessage}
                                    className="p-4 border-t border-gray-100 bg-white flex items-center gap-3"
                                >
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Send a message to the community..."
                                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#177fc0] focus:ring-2 focus:ring-[#177fc0]/20 text-sm outline-none transition"
                                    />
                                    <button
                                        type="submit"
                                        className="p-2.5 rounded-xl bg-[#082f2b] hover:bg-[#103d35] text-white transition shrink-0"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* PAYMENT & SUBSCRIPTION CHECKOUT MODAL */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <h3 className="text-xl font-bold text-[#082f2b]">Join Mentorship Community</h3>
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="text-gray-400 hover:text-gray-600 text-lg"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Order Summary */}
                        <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Community</span>
                                <span className="font-bold text-[#082f2b]">{community.name}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Mentor</span>
                                <span className="font-semibold text-gray-700">{community.mentor_name}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Capacity Status</span>
                                <span className="font-semibold text-emerald-600">{slotsAvailable} slots remaining</span>
                            </div>
                            <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                                <span className="font-bold text-gray-800">Monthly Plan Total</span>
                                <span className="text-2xl font-extrabold text-[#082f2b]">
                                    {community.monthly_fee ? `₹${community.monthly_fee}` : "Free"}
                                </span>
                            </div>
                        </div>

                        {/* Payment Method Selector */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Payment Method (Simulated Checkout)
                            </label>
                            <div className="space-y-2">
                                {[
                                    { id: "upi", name: "UPI / Google Pay / PhonePe" },
                                    { id: "card", name: "Credit / Debit Card (Razorpay Test)" },
                                    { id: "instant", name: "Instant Test Verification" },
                                ].map((m) => (
                                    <label
                                        key={m.id}
                                        className={`flex items-center justify-between p-3 rounded-xl border text-sm font-medium cursor-pointer transition ${
                                            paymentMethod === m.name
                                                ? "border-[#177fc0] bg-sky-50/50 text-[#082f2b]"
                                                : "border-gray-200 hover:bg-gray-50"
                                        }`}
                                    >
                                        <span>{m.name}</span>
                                        <input
                                            type="radio"
                                            name="payment"
                                            checked={paymentMethod === m.name}
                                            onChange={() => setPaymentMethod(m.name)}
                                            className="text-[#177fc0]"
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="space-y-3 pt-2">
                            <button
                                onClick={handleSubscribe}
                                disabled={processingPayment}
                                className="w-full py-3.5 rounded-xl bg-[#082f2b] hover:bg-[#103d35] text-white font-bold text-sm shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <CreditCard className="w-4 h-4 text-emerald-400" />
                                {processingPayment ? "Verifying Payment & Enrolling..." : "Confirm & Subscribe"}
                            </button>
                            <p className="text-[11px] text-gray-400 text-center">
                                Atomic capacity check ensures you will only be charged if a seat is guaranteed.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Session Ticket Payment Modal */}
            {showSessionPayModal && selectedSessionForPay && (
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
                                    date={selectedSessionForPay.date}
                                    time={selectedSessionForPay.time}
                                    status={selectedSessionForPay.status}
                                />
                                <span className="text-xs font-extrabold text-[#082f2b]">
                                    ₹{selectedSessionForPay.price ?? 199}
                                </span>
                            </div>
                            <h4 className="font-bold text-sm text-[#082f2b]">
                                {selectedSessionForPay.title}
                            </h4>
                            <p className="text-xs text-gray-500">
                                📅 {selectedSessionForPay.date} at {selectedSessionForPay.time} ({selectedSessionForPay.duration || "60 min"})
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
                                            name="commSessionPayMethod"
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
                                {payingSession ? "Processing..." : `Pay ₹${selectedSessionForPay.price ?? 199} & Confirm Seat`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default CommunityDetail;
