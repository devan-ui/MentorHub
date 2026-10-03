import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import {
    Search,
    Send,
    Users,
    MessageCircle,
    Building2,
    CheckCircle2,
    Clock,
    User,
    Sparkles,
    ArrowLeft,
    Video,
    ExternalLink,
    ShieldCheck,
    MessageSquare,
    Compass,
} from "lucide-react";
import Navbar from "./components/Navbar.jsx";
import api from "../api.js";
import toast, { Toaster } from "react-hot-toast";

const UserMessages = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const paramTab = searchParams.get("tab");
    const targetCommunityId = searchParams.get("community_id");
    const targetMentorId = searchParams.get("mentor_id");

    const [activeTab, setActiveTab] = useState(paramTab === "direct" ? "direct" : "community"); // "community" or "direct"

    // Joined Communities State
    const [communities, setCommunities] = useState([]);
    const [selectedCommunity, setSelectedCommunity] = useState(null);
    const [communityMessages, setCommunityMessages] = useState([]);
    const [communityInput, setCommunityInput] = useState("");
    const [loadingCommunities, setLoadingCommunities] = useState(true);
    const [communitySearch, setCommunitySearch] = useState("");
    const [sendingCommunity, setSendingCommunity] = useState(false);

    // 1-on-1 Direct Messages State
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [directMessages, setDirectMessages] = useState([]);
    const [directInput, setDirectInput] = useState("");
    const [loadingDirect, setLoadingDirect] = useState(true);
    const [sendingDirect, setSendingDirect] = useState(false);
    const [directSearch, setDirectSearch] = useState("");

    // Mobile view toggle (show list or active chat)
    const [showChatMobile, setShowChatMobile] = useState(false);

    const communityChatEndRef = useRef(null);
    const directChatEndRef = useRef(null);
    const wsRef = useRef(null);

    const userId = localStorage.getItem("userId") || localStorage.getItem("userEmail") || "";
    const userName = localStorage.getItem("userName") || "Mentee";
    const userEmail = localStorage.getItem("userEmail") || "";

    // Redirect to login if user not logged in
    useEffect(() => {
        const token = localStorage.getItem("userToken");
        if (!token) {
            toast.error("Please login to access messages and communities");
            navigate("/login");
        }
    }, [navigate]);

    /* =========================================================
       1. FETCH JOINED COMMUNITIES
    ========================================================= */
    const fetchJoinedCommunities = async () => {
        if (!userId && !userEmail) return;
        try {
            setLoadingCommunities(true);
            const res = await api.get(`/subscriptions/my?user_id=${userId}&email=${userEmail}`);
            if (res.data?.data) {
                const subs = res.data.data.filter((s) => s.status === "active");
                // Normalize community records
                const commList = subs.map((s) => ({
                    _id: s.community_id,
                    community_id: s.community_id,
                    name: s.community_name || "Mentorship Community",
                    mentor_id: s.mentor_id,
                    mentor_name: s.mentor_name || "Mentor",
                    category: s.category || "General",
                    joined_at: s.created_at || s.start_date,
                    status: s.status,
                }));
                setCommunities(commList);

                // Auto-select target community from URL if present
                if (targetCommunityId) {
                    const match = commList.find(
                        (c) => c._id === targetCommunityId || c.community_id === targetCommunityId
                    );
                    if (match) {
                        setSelectedCommunity(match);
                        setShowChatMobile(true);
                    } else if (commList.length > 0 && !selectedCommunity) {
                        setSelectedCommunity(commList[0]);
                    }
                } else if (commList.length > 0 && !selectedCommunity && activeTab === "community") {
                    setSelectedCommunity(commList[0]);
                }
            }
        } catch (err) {
            console.error("Error fetching joined communities:", err);
        } finally {
            setLoadingCommunities(false);
        }
    };

    useEffect(() => {
        fetchJoinedCommunities();
    }, [userId, userEmail]);

    /* =========================================================
       2. FETCH 1-ON-1 DIRECT CONVERSATIONS
    ========================================================= */
    const fetchDirectConversations = async () => {
        if (!userId) return;
        try {
            setLoadingDirect(true);
            const res = await api.get(`/direct-messages/conversations/${userId}?role=mentee`);
            if (res.data?.data) {
                const list = res.data.data;
                setConversations(list);

                // Auto-select target mentor if URL specified
                if (targetMentorId) {
                    const match = list.find((c) => c.partner_id === targetMentorId);
                    if (match) {
                        setSelectedConversation(match);
                        setShowChatMobile(true);
                    } else if (list.length > 0 && !selectedConversation) {
                        setSelectedConversation(list[0]);
                    }
                } else if (list.length > 0 && !selectedConversation && activeTab === "direct") {
                    setSelectedConversation(list[0]);
                }
            }
        } catch (err) {
            console.error("Error fetching direct conversations:", err);
        } finally {
            setLoadingDirect(false);
        }
    };

    useEffect(() => {
        fetchDirectConversations();
    }, [userId]);

    /* =========================================================
       3. COMMUNITY GROUP CHAT - LOAD MESSAGES & WEBSOCKET
    ========================================================= */
    useEffect(() => {
        const commId = selectedCommunity?._id || selectedCommunity?.community_id;
        if (!commId || activeTab !== "community") return;

        let isMounted = true;
        const loadMessages = async () => {
            try {
                const res = await api.get(`/communities/${commId}/messages`);
                if (isMounted && res.data?.data) {
                    setCommunityMessages(res.data.data);
                }
            } catch (err) {
                console.error("Error loading community messages:", err);
            }
        };

        loadMessages();
        const pollInterval = setInterval(loadMessages, 2500);

        // WebSocket connection
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host = window.location.hostname === "localhost" ? "localhost:8000" : window.location.host;
        try {
            const socket = new WebSocket(`${protocol}//${host}/ws/community/${commId}`);
            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    setCommunityMessages((prev) => [...prev, data]);
                } catch (e) {
                    console.error("WS parse error:", e);
                }
            };
            wsRef.current = socket;
        } catch (e) {
            console.error("WS error:", e);
        }

        return () => {
            isMounted = false;
            clearInterval(pollInterval);
            if (wsRef.current) wsRef.current.close();
        };
    }, [selectedCommunity, activeTab]);

    useEffect(() => {
        communityChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [communityMessages]);

    /* =========================================================
       4. DIRECT 1-ON-1 CHAT - LOAD MESSAGES & POLLING
    ========================================================= */
    useEffect(() => {
        const partnerId = selectedConversation?.partner_id;
        if (!partnerId || !userId || activeTab !== "direct") return;

        let isMounted = true;
        const loadDirectMessages = async () => {
            try {
                const res = await api.get(
                    `/direct-messages/conversation?mentor_id=${partnerId}&mentee_id=${userId}`
                );
                if (isMounted && res.data?.data) {
                    setDirectMessages(res.data.data);
                }
            } catch (err) {
                console.error("Error loading direct messages:", err);
            }
        };

        loadDirectMessages();
        const interval = setInterval(loadDirectMessages, 2500);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [selectedConversation, userId, activeTab]);

    useEffect(() => {
        directChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [directMessages]);

    /* =========================================================
       5. SEND HANDLERS
    ========================================================= */
    const handleSendCommunityMessage = async (e) => {
        e.preventDefault();
        const text = communityInput.trim();
        const commId = selectedCommunity?._id || selectedCommunity?.community_id;
        if (!text || !commId || sendingCommunity) return;

        try {
            setSendingCommunity(true);
            const payload = {
                community_id: commId,
                sender_id: userId,
                sender_name: userName,
                sender_role: "mentee",
                message: text,
            };

            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify(payload));
                setCommunityInput("");
            } else {
                const res = await api.post(`/communities/${commId}/messages`, payload);
                if (res.data?.data) {
                    setCommunityMessages((prev) => [...prev, res.data.data]);
                    setCommunityInput("");
                }
            }
        } catch (err) {
            console.error("Error sending community message:", err);
            toast.error(err.response?.data?.detail || "Failed to send message");
        } finally {
            setSendingCommunity(false);
        }
    };

    const handleSendDirectMessage = async (e) => {
        e.preventDefault();
        const text = directInput.trim();
        if (!text || !selectedConversation || sendingDirect) return;

        try {
            setSendingDirect(true);
            const payload = {
                sender_id: userId,
                sender_name: userName,
                sender_role: "mentee",
                receiver_id: selectedConversation.partner_id,
                receiver_name: selectedConversation.partner_name,
                mentor_id: selectedConversation.partner_id,
                mentee_id: userId,
                message: text,
            };

            const res = await api.post("/direct-messages", payload);
            if (res.data?.data) {
                setDirectMessages((prev) => [...prev, res.data.data]);
                setDirectInput("");
                fetchDirectConversations();
            }
        } catch (err) {
            console.error("Error sending direct message:", err);
            toast.error(err.response?.data?.detail || "Failed to send message");
        } finally {
            setSendingDirect(false);
        }
    };

    /* Switch to 1-on-1 direct chat with this mentor */
    const switchToDirectChatWithMentor = (mentorId, mentorName) => {
        setActiveTab("direct");
        setSearchParams({ tab: "direct", mentor_id: mentorId });
        const existing = conversations.find((c) => c.partner_id === mentorId);
        if (existing) {
            setSelectedConversation(existing);
        } else {
            const tempConv = {
                partner_id: mentorId,
                partner_name: mentorName || "Mentor",
                partner_role: "mentor",
                last_message: "Start 1-on-1 chat",
                unread_count: 0,
            };
            setConversations((prev) => [tempConv, ...prev]);
            setSelectedConversation(tempConv);
        }
        setShowChatMobile(true);
    };

    /* Filters */
    const filteredCommunities = communities.filter(
        (c) =>
            c.name?.toLowerCase().includes(communitySearch.toLowerCase()) ||
            c.mentor_name?.toLowerCase().includes(communitySearch.toLowerCase()) ||
            c.category?.toLowerCase().includes(communitySearch.toLowerCase())
    );

    const filteredConversations = conversations.filter(
        (c) =>
            c.partner_name?.toLowerCase().includes(directSearch.toLowerCase()) ||
            c.last_message?.toLowerCase().includes(directSearch.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#fbfaf6] text-[#123b38] flex flex-col">
            <Toaster position="top-right" />
            <Navbar />

            {/* Main Chat Hub Container */}
            <main className="flex-1 w-[95%] max-w-[1300px] mx-auto py-5 flex flex-col h-[calc(100vh-96px)]">

                {/* Top Hub Header */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <div>
                        <h1 className="text-2xl font-extrabold text-[#082f2b] tracking-tight flex items-center gap-2">
                            <MessageSquare className="w-6 h-6 text-[#177fc0]" />
                            Mentee Chat Hub
                        </h1>
                        <p className="text-xs text-gray-500">
                            Join live discussions in your communities or message your mentors directly 1-on-1 for free
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            to="/mentors"
                            className="px-4 py-2 rounded-full border border-[#b8c9c2] hover:bg-white text-xs font-bold text-[#082f2b] transition flex items-center gap-1.5"
                        >
                            <Compass className="w-3.5 h-3.5 text-[#177fc0]" />
                            Explore Mentors & Communities
                        </Link>
                    </div>
                </div>

                {/* Dual Panel Chat Card */}
                <div className="flex-1 bg-white border border-[#123b38]/10 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row min-h-0">

                    {/* =========================================================
                       LEFT SIDEBAR: CHAT DIRECTORY & TABS
                    ========================================================= */}
                    <aside
                        className={`w-full md:w-80 lg:w-96 border-r border-gray-100 flex flex-col bg-[#fdfdfd] ${
                            showChatMobile ? "hidden md:flex" : "flex"
                        }`}
                    >
                        {/* Tab Switch Buttons */}
                        <div className="p-3 border-b border-gray-100 bg-white">
                            <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-xl gap-1">
                                <button
                                    onClick={() => {
                                        setActiveTab("community");
                                        setSearchParams({ tab: "community" });
                                        if (communities.length > 0 && !selectedCommunity) {
                                            setSelectedCommunity(communities[0]);
                                        }
                                    }}
                                    className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                        activeTab === "community"
                                            ? "bg-[#082f2b] text-white shadow-xs"
                                            : "text-gray-600 hover:text-gray-900"
                                    }`}
                                >
                                    <Building2 className="w-3.5 h-3.5" />
                                    <span>Communities</span>
                                    <span
                                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                                            activeTab === "community"
                                                ? "bg-white/20 text-white"
                                                : "bg-gray-200 text-gray-700"
                                        }`}
                                    >
                                        {communities.length}
                                    </span>
                                </button>

                                <button
                                    onClick={() => {
                                        setActiveTab("direct");
                                        setSearchParams({ tab: "direct" });
                                        if (conversations.length > 0 && !selectedConversation) {
                                            setSelectedConversation(conversations[0]);
                                        }
                                    }}
                                    className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                        activeTab === "direct"
                                            ? "bg-[#082f2b] text-white shadow-xs"
                                            : "text-gray-600 hover:text-gray-900"
                                    }`}
                                >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    <span>1-on-1 Direct</span>
                                    <span
                                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                                            activeTab === "direct"
                                                ? "bg-white/20 text-white"
                                                : "bg-gray-200 text-gray-700"
                                        }`}
                                    >
                                        {conversations.length}
                                    </span>
                                </button>
                            </div>

                            {/* Search Box */}
                            <div className="relative mt-2.5">
                                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={activeTab === "community" ? communitySearch : directSearch}
                                    onChange={(e) =>
                                        activeTab === "community"
                                            ? setCommunitySearch(e.target.value)
                                            : setDirectSearch(e.target.value)
                                    }
                                    placeholder={
                                        activeTab === "community"
                                            ? "Search joined communities..."
                                            : "Search mentor conversations..."
                                    }
                                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs bg-gray-50/50 focus:bg-white focus:border-[#082f2b] outline-none transition"
                                />
                            </div>
                        </div>

                        {/* List Area */}
                        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                            {/* TAB 1: JOINED COMMUNITIES */}
                            {activeTab === "community" && (
                                <>
                                    {loadingCommunities ? (
                                        <div className="p-8 text-center text-gray-400 text-xs space-y-2">
                                            <div className="animate-spin w-5 h-5 border-2 border-[#082f2b] border-t-transparent rounded-full mx-auto" />
                                            <p>Loading your communities...</p>
                                        </div>
                                    ) : filteredCommunities.length === 0 ? (
                                        <div className="p-6 text-center text-gray-400 text-xs space-y-3">
                                            <Building2 className="w-8 h-8 mx-auto text-gray-300" />
                                            <div>
                                                <p className="font-bold text-gray-600">No communities found</p>
                                                <p className="text-[11px] text-gray-400 mt-1">
                                                    You haven't joined any mentor communities yet.
                                                </p>
                                            </div>
                                            <Link
                                                to="/mentors"
                                                className="inline-block px-4 py-2 rounded-xl bg-[#082f2b] text-white font-bold text-xs shadow-xs"
                                            >
                                                Find Mentors
                                            </Link>
                                        </div>
                                    ) : (
                                        filteredCommunities.map((comm) => {
                                            const isSelected =
                                                selectedCommunity?._id === comm._id ||
                                                selectedCommunity?.community_id === comm.community_id;
                                            const commInitials = comm.name
                                                .split(" ")
                                                .map((w) => w[0])
                                                .join("")
                                                .slice(0, 2)
                                                .toUpperCase() || "C";

                                            return (
                                                <button
                                                    key={comm._id || comm.community_id}
                                                    onClick={() => {
                                                        setSelectedCommunity(comm);
                                                        setSearchParams({
                                                            tab: "community",
                                                            community_id: comm._id || comm.community_id,
                                                        });
                                                        setShowChatMobile(true);
                                                    }}
                                                    className={`w-full p-3.5 text-left flex items-start gap-3 transition cursor-pointer ${
                                                        isSelected
                                                            ? "bg-[#eef7f4] border-l-4 border-[#082f2b]"
                                                            : "hover:bg-gray-50"
                                                    }`}
                                                >
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#082f2b] to-[#177fc0] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                                                        {commInitials}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-1">
                                                            <h4 className="text-xs font-bold text-[#082f2b] truncate">
                                                                {comm.name}
                                                            </h4>
                                                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold shrink-0">
                                                                Member
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] text-gray-500 truncate mt-0.5">
                                                            By {comm.mentor_name}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                                            <Users className="w-3 h-3 text-[#177fc0]" />
                                                            {comm.category} Group Chat
                                                        </p>
                                                    </div>
                                                </button>
                                            );
                                        })
                                    )}
                                </>
                            )}

                            {/* TAB 2: 1-ON-1 DIRECT CHATS */}
                            {activeTab === "direct" && (
                                <>
                                    {loadingDirect ? (
                                        <div className="p-8 text-center text-gray-400 text-xs space-y-2">
                                            <div className="animate-spin w-5 h-5 border-2 border-[#082f2b] border-t-transparent rounded-full mx-auto" />
                                            <p>Loading mentor conversations...</p>
                                        </div>
                                    ) : filteredConversations.length === 0 ? (
                                        <div className="p-6 text-center text-gray-400 text-xs space-y-3">
                                            <MessageCircle className="w-8 h-8 mx-auto text-gray-300" />
                                            <div>
                                                <p className="font-bold text-gray-600">No 1-on-1 chats yet</p>
                                                <p className="text-[11px] text-gray-400 mt-1">
                                                    Join a mentor's community to unlock free personal 1-on-1 messaging!
                                                </p>
                                            </div>
                                            <Link
                                                to="/mentors"
                                                className="inline-block px-4 py-2 rounded-xl bg-[#082f2b] text-white font-bold text-xs shadow-xs"
                                            >
                                                Browse Mentors
                                            </Link>
                                        </div>
                                    ) : (
                                        filteredConversations.map((conv) => {
                                            const isSelected = selectedConversation?.partner_id === conv.partner_id;
                                            const initials = conv.partner_name
                                                .split(" ")
                                                .map((w) => w[0])
                                                .join("")
                                                .slice(0, 2)
                                                .toUpperCase() || "M";

                                            return (
                                                <button
                                                    key={conv.partner_id}
                                                    onClick={() => {
                                                        setSelectedConversation(conv);
                                                        setSearchParams({
                                                            tab: "direct",
                                                            mentor_id: conv.partner_id,
                                                        });
                                                        setShowChatMobile(true);
                                                    }}
                                                    className={`w-full p-3.5 text-left flex items-start gap-3 transition cursor-pointer ${
                                                        isSelected
                                                            ? "bg-[#eef7f4] border-l-4 border-[#082f2b]"
                                                            : "hover:bg-gray-50"
                                                    }`}
                                                >
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#103d35] to-[#176b5c] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                                                        {initials}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-1">
                                                            <h4 className="text-xs font-bold text-[#082f2b] truncate flex items-center gap-1">
                                                                {conv.partner_name}
                                                                <ShieldCheck className="w-3 h-3 text-sky-600 inline" />
                                                            </h4>
                                                            {conv.unread_count > 0 && (
                                                                <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center shrink-0">
                                                                    {conv.unread_count}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-gray-500 truncate mt-0.5">
                                                            {conv.last_message || "Start a 1-on-1 direct chat"}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 mt-1">
                                                            Verified Mentor · Free Messaging
                                                        </p>
                                                    </div>
                                                </button>
                                            );
                                        })
                                    )}
                                </>
                            )}
                        </div>
                    </aside>

                    {/* =========================================================
                       RIGHT MAIN PANEL: ACTIVE CHAT VIEW
                    ========================================================= */}
                    <div
                        className={`flex-1 flex flex-col bg-white min-w-0 ${
                            !showChatMobile ? "hidden md:flex" : "flex"
                        }`}
                    >
                        {/* =========================================================
                           CASE A: COMMUNITY GROUP CHAT
                        ========================================================= */}
                        {activeTab === "community" && selectedCommunity && (
                            <>
                                {/* Active Community Header */}
                                <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3 bg-white">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <button
                                            onClick={() => setShowChatMobile(false)}
                                            className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
                                        >
                                            <ArrowLeft size={18} />
                                        </button>

                                        <div className="w-10 h-10 rounded-xl bg-[#082f2b] text-white flex items-center justify-center text-sm font-bold shrink-0">
                                            {selectedCommunity.name.charAt(0).toUpperCase()}
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-bold text-[#082f2b] truncate">
                                                    {selectedCommunity.name}
                                                </h3>
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
                                                    Live Group
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 truncate">
                                                Mentored by {selectedCommunity.mentor_name}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Shortcuts */}
                                    <div className="flex items-center gap-2">
                                        {/* Direct message mentor shortcut */}
                                        {selectedCommunity.mentor_id && (
                                            <button
                                                onClick={() =>
                                                    switchToDirectChatWithMentor(
                                                        selectedCommunity.mentor_id,
                                                        selectedCommunity.mentor_name
                                                    )
                                                }
                                                className="px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-[#fbfaf6] text-xs font-bold text-[#082f2b] transition flex items-center gap-1.5 shadow-2xs"
                                                title="Direct 1-on-1 message with this mentor"
                                            >
                                                <MessageCircle size={14} className="text-[#177fc0]" />
                                                <span className="hidden sm:inline">1-on-1 Chat</span>
                                            </button>
                                        )}

                                        <Link
                                            to={`/community/${selectedCommunity._id || selectedCommunity.community_id}`}
                                            className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 transition flex items-center gap-1.5 shadow-2xs"
                                        >
                                            <Video size={14} className="text-emerald-600" />
                                            <span className="hidden sm:inline">Sessions Hub</span>
                                            <ExternalLink size={12} className="text-gray-400" />
                                        </Link>
                                    </div>
                                </div>

                                {/* Community Chat Messages Area */}
                                <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#fafcfb]/60">
                                    {communityMessages.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400 space-y-2">
                                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                                                <MessageSquare className="w-6 h-6" />
                                            </div>
                                            <p className="font-bold text-gray-700 text-sm">
                                                Welcome to #{selectedCommunity.name}!
                                            </p>
                                            <p className="text-xs text-gray-400 max-w-sm">
                                                Be the first to say hello to your mentor and community peers. All joined members can participate.
                                            </p>
                                        </div>
                                    ) : (
                                        communityMessages.map((msg, index) => {
                                            const isMe =
                                                (userId && String(msg.sender_id) === String(userId)) ||
                                                (userEmail && (String(msg.sender_id) === String(userEmail) || String(msg.sender_email) === String(userEmail))) ||
                                                (userName && msg.sender_name === userName && msg.sender_role !== "mentor");

                                            const isHostMentor =
                                                msg.sender_role === "mentor" ||
                                                (selectedCommunity &&
                                                    (String(msg.sender_id) === String(selectedCommunity.mentor_id) ||
                                                     msg.sender_name === selectedCommunity.mentor_name));

                                            return (
                                                <div
                                                    key={msg._id || index}
                                                    className={`flex flex-col ${
                                                        isMe ? "items-end" : "items-start"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-gray-500 font-medium">
                                                        <span>{isMe ? "You" : (msg.sender_name || "Member")}</span>
                                                        {!isMe && isHostMentor && (
                                                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                                                Host Mentor
                                                            </span>
                                                        )}
                                                        {!isMe && !isHostMentor && (
                                                            <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-gray-100 text-gray-600">
                                                                Member
                                                            </span>
                                                        )}
                                                        <span className="text-[10px] text-gray-400">
                                                            {msg.created_at
                                                                ? new Date(msg.created_at).toLocaleTimeString([], {
                                                                      hour: "2-digit",
                                                                      minute: "2-digit",
                                                                  })
                                                                : ""}
                                                        </span>
                                                    </div>

                                                    <div
                                                        className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                                                            isMe
                                                                ? "bg-[#082f2b] text-white rounded-tr-xs shadow-xs"
                                                                : isHostMentor
                                                                ? "bg-amber-50/70 border border-amber-200/60 text-[#123b38] rounded-tl-xs shadow-xs"
                                                                : "bg-white border border-gray-200 text-gray-800 rounded-tl-xs shadow-xs"
                                                        }`}
                                                    >
                                                        {msg.message}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={communityChatEndRef} />
                                </div>

                                {/* Community Chat Composer */}
                                <form
                                    onSubmit={handleSendCommunityMessage}
                                    className="p-3 border-t border-gray-100 bg-white flex items-center gap-2"
                                >
                                    <input
                                        type="text"
                                        value={communityInput}
                                        onChange={(e) => setCommunityInput(e.target.value)}
                                        placeholder={`Message #${selectedCommunity.name}...`}
                                        className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-xs sm:text-sm outline-none focus:border-[#082f2b] bg-gray-50/40 focus:bg-white transition"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!communityInput.trim() || sendingCommunity}
                                        className="p-2.5 sm:px-4 sm:py-2.5 rounded-xl bg-[#082f2b] hover:bg-[#103d35] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-40 shadow-xs cursor-pointer"
                                    >
                                        <Send size={15} />
                                        <span className="hidden sm:inline">Send</span>
                                    </button>
                                </form>
                            </>
                        )}

                        {/* =========================================================
                           CASE B: 1-ON-1 DIRECT CHAT
                        ========================================================= */}
                        {activeTab === "direct" && selectedConversation && (
                            <>
                                {/* Active 1-on-1 Header */}
                                <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3 bg-white">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <button
                                            onClick={() => setShowChatMobile(false)}
                                            className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
                                        >
                                            <ArrowLeft size={18} />
                                        </button>

                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#103d35] to-[#176b5c] text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-xs">
                                            {selectedConversation.partner_name?.charAt(0).toUpperCase() || "M"}
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <h3 className="text-sm font-bold text-[#082f2b] truncate">
                                                    {selectedConversation.partner_name}
                                                </h3>
                                                <ShieldCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                                            </div>
                                            <p className="text-xs text-emerald-700 font-medium truncate flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                1-on-1 Personal Mentorship Chat
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action shortcut to mentor's profile */}
                                    <Link
                                        to={`/mentor-profile?mentor_id=${selectedConversation.partner_id}`}
                                        className="px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-[#fbfaf6] text-xs font-bold text-[#082f2b] transition flex items-center gap-1.5 shadow-2xs"
                                    >
                                        <User size={13} />
                                        <span className="hidden sm:inline">Mentor Profile</span>
                                        <ExternalLink size={12} className="text-gray-400" />
                                    </Link>
                                </div>

                                {/* Direct Messages History Area */}
                                <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#fafcfb]/60">
                                    {directMessages.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400 space-y-2">
                                            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                                                <MessageCircle className="w-6 h-6" />
                                            </div>
                                            <p className="font-bold text-gray-700 text-sm">
                                                Direct 1-on-1 Chat with {selectedConversation.partner_name}
                                            </p>
                                            <p className="text-xs text-gray-400 max-w-sm">
                                                As an enrolled community member, you can send private questions, ask for guidance, and receive 1-on-1 answers for free.
                                            </p>
                                        </div>
                                    ) : (
                                        directMessages.map((msg, index) => {
                                            const isMe =
                                                msg.sender_id === userId ||
                                                msg.sender_id === userEmail ||
                                                msg.sender_role === "mentee";

                                            return (
                                                <div
                                                    key={msg._id || index}
                                                    className={`flex flex-col ${
                                                        isMe ? "items-end" : "items-start"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-gray-400 font-medium">
                                                        <span>{isMe ? "You" : selectedConversation.partner_name}</span>
                                                        <span className="text-[10px]">
                                                            {msg.created_at
                                                                ? new Date(msg.created_at).toLocaleTimeString([], {
                                                                      hour: "2-digit",
                                                                      minute: "2-digit",
                                                                  })
                                                                : ""}
                                                        </span>
                                                    </div>

                                                    <div
                                                        className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                                                            isMe
                                                                ? "bg-[#082f2b] text-white rounded-tr-xs shadow-xs"
                                                                : "bg-white border border-gray-200 text-gray-800 rounded-tl-xs shadow-xs"
                                                        }`}
                                                    >
                                                        {msg.message}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={directChatEndRef} />
                                </div>

                                {/* Direct Message Composer */}
                                <form
                                    onSubmit={handleSendDirectMessage}
                                    className="p-3 border-t border-gray-100 bg-white flex items-center gap-2"
                                >
                                    <input
                                        type="text"
                                        value={directInput}
                                        onChange={(e) => setDirectInput(e.target.value)}
                                        placeholder={`Message ${selectedConversation.partner_name} directly...`}
                                        className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-xs sm:text-sm outline-none focus:border-[#082f2b] bg-gray-50/40 focus:bg-white transition"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!directInput.trim() || sendingDirect}
                                        className="p-2.5 sm:px-4 sm:py-2.5 rounded-xl bg-[#082f2b] hover:bg-[#103d35] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-40 shadow-xs cursor-pointer"
                                    >
                                        <Send size={15} />
                                        <span className="hidden sm:inline">Send</span>
                                    </button>
                                </form>
                            </>
                        )}

                        {/* =========================================================
                           EMPTY STATE (NO CHAT SELECTED)
                        ========================================================= */}
                        {((activeTab === "community" && !selectedCommunity) ||
                            (activeTab === "direct" && !selectedConversation)) && (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400 space-y-3">
                                <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center">
                                    <MessageSquare className="w-8 h-8" />
                                </div>
                                <h3 className="text-base font-bold text-[#082f2b]">
                                    Select a chat to begin
                                </h3>
                                <p className="text-xs text-gray-400 max-w-sm">
                                    Choose a joined community group chat or a 1-on-1 mentor conversation from the left directory.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UserMessages;
