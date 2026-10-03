import React, { useState, useEffect, useRef } from "react";
import {
    Users,
    IndianRupee,
    Edit,
    Settings,
    UserMinus,
    UserX,
    Eye,
    Plus,
    CalendarDays,
    CheckCircle2,
    X,
    Video,
    TrendingUp,
    MessageCircle,
    MessageSquare,
    Send,
    Shield,
    Phone,
    Mail,
    MapPin,
    Briefcase,
    GraduationCap,
    ExternalLink,
    AlertTriangle,
    Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";
import toast from "react-hot-toast";

const Community = () => {
    const navigate = useNavigate();
    const mentorId = localStorage.getItem("mentorId") || "6a9e5b0f056671eb15a2f2fa";
    const mentorName = localStorage.getItem("mentorName") || "Mentor";

    const [community, setCommunity] = useState({
        name: "Full Stack Career Community",
        description: "Help aspiring developers become job-ready through practical mentorship, projects, and live Google Meet sessions.",
        category: "Software Development",
        monthly_fee: 499,
        capacity: 50,
        status: "Active",
        members: [],
    });

    // Active View Tab: "chat" or "members"
    const [activeTab, setActiveTab] = useState("chat");

    // Community Chat State
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [sendingMessage, setSendingMessage] = useState(false);
    const chatEndRef = useRef(null);
    const wsRef = useRef(null);

    // 1-on-1 Direct Chat State
    const [selectedDirectMember, setSelectedDirectMember] = useState(null);
    const [directMessages, setDirectMessages] = useState([]);
    const [newDirectMessage, setNewDirectMessage] = useState("");
    const [sendingDirectMessage, setSendingDirectMessage] = useState(false);
    const directChatEndRef = useRef(null);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        name: "",
        description: "",
        monthly_fee: 499,
        capacity: 50,
        rules: "",
    });
    const [loading, setLoading] = useState(true);

    // View Profile Modal State
    const [viewingProfile, setViewingProfile] = useState(null);

    // Kick Out Confirmation Modal State
    const [memberToKick, setMemberToKick] = useState(null);
    const [kickingMember, setKickingMember] = useState(false);

    /* =========================================================
       FETCH COMMUNITY
    ========================================================= */
    const fetchCommunity = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/mentor/${mentorId}/community`);
            if (res.data?.data) {
                const comm = res.data.data;
                comm.members = comm.members || [];
                setCommunity(comm);
                setEditForm({
                    name: comm.name || "",
                    description: comm.description || "",
                    monthly_fee: comm.monthly_fee || 499,
                    capacity: comm.capacity || 50,
                    rules: comm.rules || "",
                });
                if (comm._id) {
                    fetchCommunityMessages(comm._id);
                }
            }
        } catch (error) {
            console.error("Failed to fetch community:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCommunityMessages = async (commId) => {
        const targetId = commId || community._id;
        if (!targetId) return;
        try {
            const res = await api.get(`/communities/${targetId}/messages`);
            if (res.data?.data) {
                setMessages(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch community messages:", error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sendingMessage || !community._id) return;

        const payload = {
            community_id: community._id,
            sender_id: mentorId,
            sender_name: mentorName,
            sender_role: "mentor",
            message: newMessage.trim(),
        };

        try {
            setSendingMessage(true);
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify(payload));
                setNewMessage("");
            } else {
                const res = await api.post(`/communities/${community._id}/messages`, payload);
                if (res.data?.data) {
                    setMessages((prev) => [...prev, res.data.data]);
                    setNewMessage("");
                    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
                }
            }
        } catch (err) {
            console.error("Failed to send community message:", err);
            toast.error("Failed to send message");
        } finally {
            setSendingMessage(false);
        }
    };

    // Real-time polling & WebSocket for community chat
    useEffect(() => {
        if (!community?._id) return;

        fetchCommunityMessages(community._id);

        const interval = setInterval(() => {
            fetchCommunityMessages(community._id);
        }, 2500);

        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host = window.location.hostname === "localhost" ? "localhost:8000" : window.location.host;
        const socket = new WebSocket(`${protocol}//${host}/ws/community/${community._id}`);

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setMessages((prev) => [...prev, data]);
                setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
            } catch (err) {
                console.error("WS parse error:", err);
            }
        };

        wsRef.current = socket;

        return () => {
            clearInterval(interval);
            if (socket) socket.close();
        };
    }, [community?._id]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages.length]);

    // Auto-select first member when switching to 1-on-1 direct tab
    useEffect(() => {
        if (activeTab === "direct" && !selectedDirectMember && community.members?.length > 0) {
            setSelectedDirectMember(community.members[0]);
        }
    }, [activeTab, community.members, selectedDirectMember]);

    // Load 1-on-1 direct messages for selected member
    useEffect(() => {
        if (activeTab !== "direct" || !selectedDirectMember) return;
        const targetMenteeId = selectedDirectMember.mentee_id || selectedDirectMember._id || selectedDirectMember.email;
        if (!targetMenteeId) return;

        let isMounted = true;
        const loadDirectMessages = async () => {
            try {
                const res = await api.get(
                    `/direct-messages/conversation?mentor_id=${mentorId}&mentee_id=${targetMenteeId}`
                );
                if (isMounted && res.data?.data) {
                    setDirectMessages(res.data.data);
                }
            } catch (err) {
                console.error("Failed to load direct messages:", err);
            }
        };

        loadDirectMessages();
        const poll = setInterval(loadDirectMessages, 2500);

        return () => {
            isMounted = false;
            clearInterval(poll);
        };
    }, [activeTab, selectedDirectMember, mentorId]);

    useEffect(() => {
        directChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [directMessages]);

    const handleSendDirectMessage = async (e) => {
        e.preventDefault();
        const text = newDirectMessage.trim();
        const targetMenteeId = selectedDirectMember?.mentee_id || selectedDirectMember?._id || selectedDirectMember?.email;
        if (!text || !targetMenteeId || sendingDirectMessage) return;

        try {
            setSendingDirectMessage(true);
            const payload = {
                sender_id: mentorId,
                sender_name: mentorName,
                sender_role: "mentor",
                receiver_id: targetMenteeId,
                receiver_name: selectedDirectMember.name || "Mentee",
                mentor_id: mentorId,
                mentee_id: targetMenteeId,
                message: text,
            };

            const res = await api.post("/direct-messages", payload);
            if (res.data?.data) {
                setDirectMessages((prev) => [...prev, res.data.data]);
                setNewDirectMessage("");
            }
        } catch (err) {
            console.error("Error sending direct message:", err);
            toast.error(err.response?.data?.detail || "Failed to send message");
        } finally {
            setSendingDirectMessage(false);
        }
    };

    useEffect(() => {
        fetchCommunity();
    }, [mentorId]);

    /* =========================================================
       SAVE COMMUNITY
    ========================================================= */
    const handleSaveCommunity = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                name: editForm.name,
                description: editForm.description,
                monthly_fee: Number(editForm.monthly_fee),
                capacity: Number(editForm.capacity),
                rules: editForm.rules,
                status: "Active",
            };

            await api.put(`/mentor/${mentorId}/community`, payload);
            setCommunity((prev) => ({ ...prev, ...payload }));
            toast.success("Community settings updated!");
            setIsEditModalOpen(false);
        } catch (error) {
            console.error("Failed to update community:", error);
            setCommunity((prev) => ({ ...prev, ...editForm }));
            toast.success("Community updated locally!");
            setIsEditModalOpen(false);
        }
    };

    /* =========================================================
       KICK OUT MEMBER
    ========================================================= */
    const handleConfirmKick = async () => {
        if (!memberToKick) return;

        try {
            setKickingMember(true);
            const payload = {
                member_email: memberToKick.email,
                member_id: memberToKick.mentee_id,
            };

            // Call backend kick endpoint
            try {
                await api.post(`/mentor/${mentorId}/community/kick`, payload);
            } catch (apiErr) {
                // If specific route failed, try community id route
                if (community._id) {
                    await api.post(`/communities/${community._id}/kick`, payload);
                }
            }

            // Update local state atomically
            setCommunity((prev) => {
                const updatedMembers = prev.members.filter(
                    (m) => m.email !== memberToKick.email
                );
                return {
                    ...prev,
                    members: updatedMembers,
                    current_members: Math.max(0, (prev.current_members || updatedMembers.length + 1) - 1),
                };
            });

            toast.success(`${memberToKick.name} has been kicked out of the community.`);
            setMemberToKick(null);
        } catch (error) {
            console.error("Failed to kick member:", error);
            // Optimistic local update
            setCommunity((prev) => ({
                ...prev,
                members: prev.members.filter((m) => m.email !== memberToKick.email),
            }));
            toast.success(`${memberToKick.name} removed from community.`);
            setMemberToKick(null);
        } finally {
            setKickingMember(false);
        }
    };

    const memberCount = community.members?.length || 0;
    const capacity = community.capacity || 50;
    const slotsRemaining = Math.max(0, capacity - memberCount);
    const capacityPercent = Math.min(Math.round((memberCount / capacity) * 100), 100);
    const isFull = memberCount >= capacity;
    const monthlyRevenue = memberCount * (community.monthly_fee || 499);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                            <MessageCircle size={14} className="text-emerald-600 fill-emerald-500" />
                            Community Space
                        </span>
                        {isFull ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                                Capacity Full
                            </span>
                        ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-[#177fc0] text-xs font-bold">
                                {slotsRemaining} Slots Left
                            </span>
                        )}
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#163b35] mt-1.5 tracking-tight">
                        My Community Hub
                    </h1>
                    <p className="mt-1 text-xs sm:text-sm text-gray-500">
                        View enrolled community members, kick out members, view detailed mentee profiles, and manage member capacity.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate("/mentor/sessions")}
                        className="flex items-center gap-2 rounded-xl border border-[#dce8df] bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#163b35] hover:bg-gray-50 transition"
                    >
                        <Video size={16} className="text-[#176b5c]" />
                        Manage Live Sessions
                    </button>
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex items-center gap-2 rounded-xl bg-[#103d35] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-[#176b5c] transition"
                    >
                        <Edit size={16} />
                        Edit Community Settings
                    </button>
                </div>
            </div>

            {/* Community Banner */}
            <div className="rounded-3xl bg-gradient-to-br from-[#0c3932] via-[#103d35] to-[#176b5c] p-6 text-white shadow-md sm:p-8 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-80 h-80 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
                
                <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center relative z-10">
                    <div className="space-y-3 max-w-2xl">
                        <div className="flex items-center gap-3">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-2xl shadow-inner border border-white/20">
                                💬
                            </div>
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                                    Official Mentorship Community
                                </span>
                                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                    {community.name}
                                </h2>
                            </div>
                        </div>

                        <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                            {community.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-white/70">
                            <span className="flex items-center gap-1">
                                <Shield size={14} className="text-emerald-300" />
                                Community Moderation & Member Controls
                            </span>
                            <span>•</span>
                            <span>Category: <strong className="text-white">{community.category || "Software Development"}</strong></span>
                        </div>
                    </div>

                    {/* Community Capacity Card */}
                    <div className="rounded-2xl bg-white/10 p-5 md:min-w-64 backdrop-blur-md border border-white/15 space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-white/70">Community Capacity</p>
                            <span className="text-xs font-extrabold text-emerald-300">
                                {capacityPercent}% Filled
                            </span>
                        </div>

                        <div>
                            <p className="text-2xl font-black text-white">
                                {memberCount} <span className="text-sm font-normal text-white/70">/ {capacity} members</span>
                            </p>
                            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-black/20">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        isFull ? "bg-red-400" : capacityPercent > 80 ? "bg-amber-400" : "bg-emerald-400"
                                    }`}
                                    style={{ width: `${capacityPercent}%` }}
                                />
                            </div>
                            <p className="mt-1.5 text-[11px] text-emerald-200 font-medium">
                                {isFull ? "Community is at full capacity" : `${slotsRemaining} slots left for new mentees`}
                            </p>
                        </div>

                        <button
                            onClick={() => navigate("/mentor/sessions")}
                            className="block w-full rounded-xl bg-white/20 py-2 text-center text-xs font-bold text-white transition hover:bg-white/30"
                        >
                            + Host Live Session
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <CommunityStat
                    icon={<Users size={20} />}
                    title="Enrolled Members"
                    value={`${memberCount} / ${capacity}`}
                    subtitle={`Capacity limit: ${capacity} members`}
                />

                <CommunityStat
                    icon={<IndianRupee size={20} />}
                    title="Community Fee"
                    value={community.monthly_fee ? `₹${community.monthly_fee}` : "Free"}
                    subtitle="Per member monthly"
                />

                <CommunityStat
                    icon={<TrendingUp size={20} />}
                    title="Est. Monthly Revenue"
                    value={`₹${monthlyRevenue.toLocaleString("en-IN")}`}
                    subtitle={`${memberCount} active subscriber(s)`}
                />
            </div>

            {/* Community Workspace Tab Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dce8df] pb-3">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <button
                        onClick={() => setActiveTab("chat")}
                        className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-xs cursor-pointer ${
                            activeTab === "chat"
                                ? "bg-[#103d35] text-white"
                                : "bg-white text-gray-600 hover:bg-gray-50 border border-[#dce8df]"
                        }`}
                    >
                        <MessageSquare size={16} />
                        Community Chat
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            activeTab === "chat" ? "bg-emerald-400 text-[#103d35]" : "bg-emerald-100 text-emerald-800"
                        }`}>
                            {messages.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab("direct")}
                        className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-xs cursor-pointer ${
                            activeTab === "direct"
                                ? "bg-[#103d35] text-white"
                                : "bg-white text-gray-600 hover:bg-gray-50 border border-[#dce8df]"
                        }`}
                    >
                        <MessageCircle size={16} />
                        1-on-1 Direct Chat
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            activeTab === "direct" ? "bg-emerald-400 text-[#103d35]" : "bg-emerald-100 text-emerald-800"
                        }`}>
                            Private
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab("members")}
                        className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-xs cursor-pointer ${
                            activeTab === "members"
                                ? "bg-[#103d35] text-white"
                                : "bg-white text-gray-600 hover:bg-gray-50 border border-[#dce8df]"
                        }`}
                    >
                        <Users size={16} />
                        Members & Capacity ({memberCount} / {capacity})
                    </button>
                </div>

                <button
                    onClick={() => navigate("/mentor/messages?tab=direct")}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#176b5c] hover:underline cursor-pointer"
                >
                    Open Messages Hub <ExternalLink size={13} />
                </button>
            </div>

            {/* TAB 1: COMMUNITY CHAT */}
            {activeTab === "chat" && (
                <div className="rounded-2xl border border-[#dce8df] bg-white shadow-xs overflow-hidden flex flex-col h-[640px]">
                    {/* Chat Header */}
                    <div className="p-4 sm:p-5 border-b border-[#edf2ee] bg-gray-50/70 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#103d35] text-white font-bold text-base shadow-xs">
                                #
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-sm sm:text-base text-[#163b35]">
                                        {community.name}
                                    </h3>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Live Community Discussion
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Broadcast announcements, answer questions, and engage with all {memberCount} enrolled member{memberCount === 1 ? "" : "s"}.
                                </p>
                            </div>
                        </div>
                        <div className="text-xs text-gray-500 font-semibold hidden sm:block">
                            {messages.length} message{messages.length === 1 ? "" : "s"}
                        </div>
                    </div>

                    {/* Messages Feed */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#fbfaf6]/50">
                        {messages.length === 0 ? (
                            <div className="text-center py-28 text-gray-400 text-xs space-y-3">
                                <MessageSquare size={40} className="mx-auto text-gray-300" />
                                <p className="font-bold text-gray-600 text-sm sm:text-base">No messages yet in your community chat</p>
                                <p className="max-w-md mx-auto text-gray-400">
                                    Welcome your community members! Send a welcoming message to introduce yourself and kick off group discussions.
                                </p>
                            </div>
                        ) : (
                            messages.map((m, idx) => {
                                const isMe = m.sender_role === "mentor" || m.sender_id === mentorId;
                                const time = m.created_at
                                    ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                    : "";
                                const initial = (m.sender_name || "U").charAt(0).toUpperCase();

                                return (
                                    <div
                                        key={m._id || idx}
                                        className={`flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                                    >
                                        <div
                                            className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-bold shrink-0 shadow-xs ${
                                                isMe
                                                    ? "bg-[#103d35] text-white"
                                                    : "bg-gradient-to-br from-emerald-100 to-teal-100 text-[#163b35] border border-emerald-200"
                                            }`}
                                        >
                                            {initial}
                                        </div>

                                        <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[80%]`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-gray-700">
                                                    {isMe ? `${m.sender_name || "Mentor"} (You)` : m.sender_name}
                                                </span>
                                                {isMe ? (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold border border-emerald-200">
                                                        ★ Mentor
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-bold">
                                                        Member
                                                    </span>
                                                )}
                                                <span className="text-[10px] text-gray-400">{time}</span>
                                            </div>
                                            <div
                                                className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                                                    isMe
                                                        ? "bg-[#103d35] text-white rounded-tr-none"
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

                    {/* Chat Input */}
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-[#edf2ee] bg-white flex items-center gap-3">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Broadcast a message to your community..."
                            className="flex-1 rounded-xl border border-[#dce8df] px-4 py-2.5 text-xs sm:text-sm outline-none focus:border-[#176b5c] transition"
                        />
                        <button
                            type="submit"
                            disabled={sendingMessage || !newMessage.trim()}
                            className="flex items-center gap-2 rounded-xl bg-[#103d35] px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#176b5c] transition shadow-xs disabled:opacity-50 shrink-0"
                        >
                            <Send size={15} />
                            Send
                        </button>
                    </form>
                </div>
            )}

            {/* TAB 2: 1-ON-1 DIRECT CHAT */}
            {activeTab === "direct" && (
                <div className="rounded-2xl border border-[#dce8df] bg-white shadow-xs overflow-hidden flex flex-col md:flex-row h-[660px]">
                    {/* Left: Community Member Picker */}
                    <div className="w-full md:w-80 border-r border-[#edf2ee] flex flex-col bg-[#fbfaf6]/40">
                        <div className="p-4 border-b border-[#edf2ee] bg-white">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                Select Member to Message
                            </h4>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                                Free 1-on-1 mentorship chat with your community members
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto divide-y divide-[#edf2ee]">
                            {community.members && community.members.length > 0 ? (
                                community.members.map((member) => {
                                    const isSelected =
                                        selectedDirectMember &&
                                        (selectedDirectMember.email === member.email ||
                                         selectedDirectMember.mentee_id === member.mentee_id ||
                                         selectedDirectMember.name === member.name);

                                    return (
                                        <button
                                            key={member.email || member.mentee_id || member.name}
                                            onClick={() => setSelectedDirectMember(member)}
                                            className={`w-full p-3.5 text-left flex items-center gap-3 transition cursor-pointer ${
                                                isSelected
                                                    ? "bg-[#eaf6ed] border-l-4 border-[#103d35]"
                                                    : "hover:bg-gray-50"
                                            }`}
                                        >
                                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#103d35] to-[#176b5c] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                                                {member.initials || member.name?.slice(0, 2).toUpperCase() || "M"}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-[#163b35] truncate">
                                                    {member.name}
                                                </p>
                                                <p className="text-[11px] text-gray-400 truncate">
                                                    {member.email}
                                                </p>
                                                <span className="text-[10px] text-emerald-700 font-semibold">
                                                    Enrolled Member
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="p-8 text-center text-xs text-gray-400 space-y-2">
                                    <Users size={28} className="mx-auto text-gray-300" />
                                    <p className="font-semibold text-gray-600">No community members yet</p>
                                    <p>When mentees join your community, you can message them directly here.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: 1-on-1 Chat View */}
                    <div className="flex-1 flex flex-col bg-white min-w-0">
                        {selectedDirectMember ? (
                            <>
                                {/* Direct Chat Header */}
                                <div className="p-4 border-b border-[#edf2ee] bg-gray-50/70 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-[#103d35] text-white flex items-center justify-center text-sm font-bold shadow-xs">
                                            {selectedDirectMember.name?.charAt(0).toUpperCase() || "M"}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-[#163b35]">
                                                {selectedDirectMember.name}
                                            </h4>
                                            <p className="text-xs text-gray-500">
                                                1-on-1 Mentorship Chat • {selectedDirectMember.email}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setViewingProfile(selectedDirectMember)}
                                        className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-[#176b5c] hover:bg-gray-50 transition shadow-2xs cursor-pointer"
                                    >
                                        View Profile
                                    </button>
                                </div>

                                {/* Direct Messages History */}
                                <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3 bg-[#fafcf9]">
                                    {directMessages.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400 space-y-2">
                                            <MessageCircle size={36} className="text-gray-300 mx-auto" />
                                            <p className="font-bold text-gray-700 text-sm">
                                                Direct Chat with {selectedDirectMember.name}
                                            </p>
                                            <p className="text-xs text-gray-400 max-w-sm">
                                                Send a welcome message, ask about their learning goals, or share private guidance.
                                            </p>
                                        </div>
                                    ) : (
                                        directMessages.map((msg, index) => {
                                            const isMe = msg.sender_role === "mentor" || msg.sender_id === mentorId;

                                            return (
                                                <div
                                                    key={msg._id || index}
                                                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                                                >
                                                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-gray-400 font-medium">
                                                        <span>{isMe ? "You" : selectedDirectMember.name}</span>
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
                                                                ? "bg-[#103d35] text-white rounded-tr-xs shadow-xs"
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

                                {/* Direct Composer */}
                                <form
                                    onSubmit={handleSendDirectMessage}
                                    className="p-3 border-t border-[#edf2ee] bg-white flex items-center gap-2"
                                >
                                    <input
                                        type="text"
                                        value={newDirectMessage}
                                        onChange={(e) => setNewDirectMessage(e.target.value)}
                                        placeholder={`Message ${selectedDirectMember.name} directly...`}
                                        className="flex-1 py-2.5 px-4 rounded-xl border border-[#dce8df] text-xs sm:text-sm outline-none focus:border-[#176b5c] bg-gray-50/40 focus:bg-white transition"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newDirectMessage.trim() || sendingDirectMessage}
                                        className="px-4 py-2.5 rounded-xl bg-[#103d35] hover:bg-[#176b5c] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-40 shadow-xs cursor-pointer"
                                    >
                                        <Send size={15} />
                                        <span>Send</span>
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400 space-y-2">
                                <MessageCircle size={36} className="text-gray-300 mx-auto" />
                                <p className="font-bold text-gray-600">Select a member to start 1-on-1 chat</p>
                                <p className="text-xs text-gray-400">Choose a community mentee from the left list.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 3: MEMBERS & CAPACITY */}
            {activeTab === "members" && (
                <div className="space-y-6">
                    {/* Community Capacity Progress Card */}
                    <div className="rounded-2xl border border-[#dce8df] bg-white p-6 shadow-xs">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-[#163b35] text-base sm:text-lg">
                                        Community Capacity & Member Limits
                                    </h3>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        Member Cap
                                    </span>
                                </div>
                                <p className="mt-1 text-xs text-gray-400">
                                    Capped community capacity ensures focused group attention during live Google Meet video sessions.
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="text-xs font-bold text-[#177fc0] hover:underline"
                                >
                                    Change Limit ({capacity}) →
                                </button>
                            </div>
                        </div>

                        <div className="mt-5 h-3 overflow-hidden rounded-full bg-gray-100">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                    isFull ? "bg-red-500" : capacityPercent > 80 ? "bg-amber-500" : "bg-[#176b5c]"
                                }`}
                                style={{ width: `${capacityPercent}%` }}
                            />
                        </div>

                        <div className="mt-2.5 flex justify-between items-center text-xs font-medium">
                            <span className="text-gray-500">
                                {memberCount} Active Members
                            </span>
                            <span className={isFull ? "text-red-600 font-bold" : "text-emerald-700 font-bold"}>
                                {isFull
                                    ? "Full capacity reached"
                                    : `${slotsRemaining} slot${slotsRemaining === 1 ? "" : "s"} available out of ${capacity}`}
                            </span>
                        </div>
                    </div>

            {/* Community Members List with View Profile and Kick Out Options */}
            <div className="rounded-2xl border border-[#dce8df] bg-white shadow-xs overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#edf2ee] p-5 gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base sm:text-lg text-[#163b35]">
                                Community Members ({memberCount})
                            </h3>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">
                                Live Roster
                            </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-400">
                            Mentees in your community workspace. You can inspect their profiles or kick out members.
                        </p>
                    </div>

                    <button
                        onClick={() => navigate("/mentor/sessions")}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#eaf6ed] px-4 py-2 text-xs font-bold text-[#176b5c] hover:bg-[#d8edd9] transition self-start sm:self-auto"
                    >
                        <Plus size={15} />
                        Share Live Session
                    </button>
                </div>

                <div className="divide-y divide-[#edf2ee]">
                    {community.members && community.members.length > 0 ? (
                        community.members.map((member) => (
                            <MemberRow
                                key={member.email || member.mentee_id || member.name}
                                member={member}
                                onDirectChat={() => {
                                    setSelectedDirectMember(member);
                                    setActiveTab("direct");
                                }}
                                onViewProfile={() => setViewingProfile(member)}
                                onKick={() => setMemberToKick(member)}
                            />
                        ))
                    ) : (
                        <div className="p-12 text-center text-xs text-gray-400 space-y-2">
                            <Users size={32} className="mx-auto text-gray-300" />
                            <p className="font-semibold text-gray-500">No community members have joined yet.</p>
                            <p>Once mentees join your community from your mentor profile, they will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
        )}

            {/* =========================================================
                VIEW PROFILE MODAL
            ========================================================= */}
            {viewingProfile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="w-full max-w-lg rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                            <div className="flex items-center gap-4">
                                {viewingProfile.profilePic ? (
                                    <img
                                        src={`data:${viewingProfile.profilePicType || "image/png"};base64,${viewingProfile.profilePic}`}
                                        alt={viewingProfile.name}
                                        className="w-16 h-16 rounded-2xl object-cover border border-emerald-200 shadow-sm"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#103d35] to-[#176b5c] text-white flex items-center justify-center text-xl font-bold shadow-sm">
                                        {viewingProfile.initials || viewingProfile.name?.slice(0, 2).toUpperCase() || "M"}
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-xl font-extrabold text-[#163b35]">
                                        {viewingProfile.name}
                                    </h3>
                                    <p className="text-xs text-gray-500 font-medium">
                                        {viewingProfile.jobTitle || "Community Member"}
                                    </p>
                                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                        Active Community Member
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewingProfile(null)}
                                className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Contact info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50/70 p-4 rounded-2xl border border-gray-100 text-xs">
                            <div className="flex items-center gap-2 text-gray-600">
                                <Mail size={14} className="text-[#176b5c]" />
                                <span className="font-semibold text-gray-800 truncate">{viewingProfile.email}</span>
                            </div>
                            {viewingProfile.phone && (
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Phone size={14} className="text-[#176b5c]" />
                                    <span>{viewingProfile.phone}</span>
                                </div>
                            )}
                            {viewingProfile.location && (
                                <div className="flex items-center gap-2 text-gray-600">
                                    <MapPin size={14} className="text-[#176b5c]" />
                                    <span>{viewingProfile.location}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-gray-600">
                                <CalendarDays size={14} className="text-[#176b5c]" />
                                <span>Joined: {viewingProfile.joined || "Recently"}</span>
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="space-y-1.5">
                            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                About / Bio
                            </h4>
                            <p className="text-xs text-gray-600 leading-relaxed bg-white border border-gray-100 p-3 rounded-xl whitespace-pre-line">
                                {viewingProfile.bio || "No biography provided yet."}
                            </p>
                        </div>

                        {/* Skills */}
                        {viewingProfile.skills && (
                            <div className="space-y-1.5">
                                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Skills & Technologies
                                </h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {viewingProfile.skills.split(",").map((s, i) => (
                                        <span
                                            key={i}
                                            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-100"
                                        >
                                            {s.trim()}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Education & Experience */}
                        {(viewingProfile.education || viewingProfile.experience) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                {viewingProfile.education && (
                                    <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                                        <span className="font-bold text-gray-700 flex items-center gap-1">
                                            <GraduationCap size={13} className="text-[#176b5c]" /> Education
                                        </span>
                                        <p className="text-gray-600">{viewingProfile.education}</p>
                                    </div>
                                )}
                                {viewingProfile.experience && (
                                    <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                                        <span className="font-bold text-gray-700 flex items-center gap-1">
                                            <Briefcase size={13} className="text-[#176b5c]" /> Experience
                                        </span>
                                        <p className="text-gray-600">{viewingProfile.experience}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Interests */}
                        {viewingProfile.interests && (
                            <div className="space-y-1.5 text-xs">
                                <h4 className="font-bold text-gray-700 uppercase tracking-wider">
                                    Learning Goals & Interests
                                </h4>
                                <p className="text-gray-600">{viewingProfile.interests}</p>
                            </div>
                        )}

                        {/* Modal Footer Actions */}
                        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                            <button
                                onClick={() => {
                                    setMemberToKick(viewingProfile);
                                    setViewingProfile(null);
                                }}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition"
                            >
                                <UserX size={15} />
                                Kick Out Member
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setSelectedDirectMember(viewingProfile);
                                        setViewingProfile(null);
                                        setActiveTab("direct");
                                    }}
                                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-[#103d35] text-xs font-bold hover:bg-emerald-100 transition cursor-pointer"
                                >
                                    <MessageCircle size={14} className="text-[#176b5c]" />
                                    1-on-1 Chat
                                </button>

                                <button
                                    onClick={() => setViewingProfile(null)}
                                    className="px-5 py-2.5 rounded-xl bg-[#103d35] hover:bg-[#176b5c] text-white text-xs font-bold transition cursor-pointer"
                                >
                                    Close Profile
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================
                KICK OUT CONFIRMATION MODAL
            ========================================================= */}
            {memberToKick && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-6 sm:p-7 shadow-2xl space-y-5 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto text-2xl shadow-xs">
                            <AlertTriangle size={28} />
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-gray-900">
                                Kick Out {memberToKick.name}?
                            </h3>
                            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                                Are you sure you want to kick <strong>{memberToKick.name}</strong> ({memberToKick.email}) out of this community?
                            </p>
                        </div>

                        <div className="bg-red-50/70 border border-red-100 p-3 rounded-xl text-left text-xs text-red-800 space-y-1">
                            <p className="font-bold flex items-center gap-1">
                                ⚠️ Consequences of removal:
                            </p>
                            <ul className="list-disc list-inside space-y-0.5 text-red-700">
                                <li>Member loses access to community live sessions and Google Meet links.</li>
                                <li>Their community subscription is deactivated immediately.</li>
                                <li>Community capacity slot ({slotsRemaining + 1}) is instantly freed up for other mentees.</li>
                            </ul>
                        </div>

                        <div className="flex items-center justify-center gap-3 pt-2">
                            <button
                                type="button"
                                disabled={kickingMember}
                                onClick={() => setMemberToKick(null)}
                                className="w-full py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                disabled={kickingMember}
                                onClick={handleConfirmKick}
                                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                                <UserX size={15} />
                                {kickingMember ? "Kicking out..." : "Yes, Kick Out"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================
                EDIT COMMUNITY MODAL (WITH CAPACITY CONTROLS)
            ========================================================= */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="w-full max-w-lg rounded-3xl border border-[#dce8df] bg-white p-6 shadow-2xl sm:p-7 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-[#edf2ee] pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-[#163b35]">
                                    Edit Community Settings
                                </h3>
                                <p className="text-xs text-gray-400">
                                    Configure member capacity and community details.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveCommunity} className="mt-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    Community Name *
                                </label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) =>
                                        setEditForm({ ...editForm, name: e.target.value })
                                    }
                                    required
                                    className="w-full rounded-xl border border-[#dce8df] px-3.5 py-2.5 text-sm outline-none focus:border-[#176b5c]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    Description & Value Proposition
                                </label>
                                <textarea
                                    rows="3"
                                    value={editForm.description}
                                    onChange={(e) =>
                                        setEditForm({ ...editForm, description: e.target.value })
                                    }
                                    required
                                    className="w-full resize-none rounded-xl border border-[#dce8df] px-3.5 py-2 text-sm outline-none focus:border-[#176b5c]"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                                        Monthly Community Fee (₹)
                                    </label>
                                    <input
                                        type="number"
                                        value={editForm.monthly_fee}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, monthly_fee: e.target.value })
                                        }
                                        min="0"
                                        className="w-full rounded-xl border border-[#dce8df] px-3.5 py-2.5 text-sm outline-none focus:border-[#176b5c]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                                        Community Member Capacity
                                    </label>
                                    <input
                                        type="number"
                                        value={editForm.capacity}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, capacity: e.target.value })
                                        }
                                        min="5"
                                        max="1024"
                                        className="w-full rounded-xl border border-[#dce8df] px-3.5 py-2.5 text-sm outline-none focus:border-[#176b5c]"
                                    />
                                </div>
                            </div>

                            {/* Capacity Presets */}
                            <div className="space-y-1.5 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                                    Capacity Presets
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    {[20, 50, 100, 256, 512, 1024].map((preset) => (
                                        <button
                                            type="button"
                                            key={preset}
                                            onClick={() => setEditForm({ ...editForm, capacity: preset })}
                                            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                                                Number(editForm.capacity) === preset
                                                    ? "bg-[#103d35] text-white shadow-xs"
                                                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                                            }`}
                                        >
                                            {preset} Members {preset === 256 || preset === 1024 ? "★" : ""}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    Community Rules & Guidelines
                                </label>
                                <textarea
                                    rows="2"
                                    value={editForm.rules}
                                    onChange={(e) =>
                                        setEditForm({ ...editForm, rules: e.target.value })
                                    }
                                    placeholder="e.g. Respect peers, join live calls on time, no spam."
                                    className="w-full resize-none rounded-xl border border-[#dce8df] px-3.5 py-2 text-sm outline-none focus:border-[#176b5c]"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 border-t border-[#edf2ee] pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="rounded-xl border border-[#dce8df] px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-xl bg-[#103d35] px-5 py-2 text-xs font-semibold text-white hover:bg-[#176b5c] transition"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const CommunityStat = ({ icon, title, value, subtitle }) => {
    return (
        <div className="rounded-2xl border border-[#dce8df] bg-white p-5 shadow-xs">
            <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf6ed] text-[#176b5c]">
                    {icon}
                </div>

                <div>
                    <p className="text-xs text-gray-400 font-medium">{title}</p>
                    <p className="text-xl font-bold text-[#163b35] mt-0.5">{value}</p>
                    {subtitle && (
                        <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const MemberRow = ({ member, onDirectChat, onViewProfile, onKick }) => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 hover:bg-[#fafcf9] transition gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
                {member.profilePic ? (
                    <img
                        src={`data:${member.profilePicType || "image/png"};base64,${member.profilePic}`}
                        alt={member.name}
                        className="h-11 w-11 rounded-2xl object-cover border border-emerald-200 shadow-xs shrink-0"
                    />
                ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#103d35] to-[#176b5c] text-xs font-bold text-white shadow-xs shrink-0">
                        {member.initials || member.name?.slice(0, 2).toUpperCase() || "M"}
                    </div>
                )}

                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-[#163b35] truncate">{member.name}</p>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            Member
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{member.email}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                        Joined: {member.joined || "Recently"} • {member.location || "Community Mentee"}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {/* 1-on-1 Direct Chat Button */}
                <button
                    onClick={onDirectChat}
                    className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-[#103d35] hover:bg-emerald-100 transition shadow-2xs cursor-pointer"
                    title="Start 1-on-1 Direct Chat"
                >
                    <MessageCircle size={14} className="text-[#176b5c]" />
                    1-on-1 Chat
                </button>

                {/* View Profile Button */}
                <button
                    onClick={onViewProfile}
                    className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-[#176b5c] transition shadow-2xs cursor-pointer"
                    title="View Member Full Profile"
                >
                    <Eye size={14} className="text-[#176b5c]" />
                    View Profile
                </button>

                {/* Kick Out Button */}
                <button
                    onClick={onKick}
                    className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/50 px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-100 hover:border-red-300 transition cursor-pointer"
                    title="Kick Out from Community"
                >
                    <UserX size={14} />
                    Kick Out
                </button>
            </div>
        </div>
    );
};

export default Community;