import React, { useState, useEffect, useRef } from "react";
import {
    Search,
    Send,
    Users,
    MessageSquare,
    MessageCircle,
    Building2,
    CheckCircle2,
    Clock,
    User,
    Sparkles,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import api from "../api.js";
import toast, { Toaster } from "react-hot-toast";

const Messages = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = searchParams.get("tab") === "group" ? "group" : "direct";

    const [activeTab, setActiveTab] = useState(initialTab); // "direct" or "group"

    // Direct Messages State
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [directMessages, setDirectMessages] = useState([]);
    const [directInput, setDirectInput] = useState("");
    const [loadingDirect, setLoadingDirect] = useState(true);
    const [sendingDirect, setSendingDirect] = useState(false);
    const [directSearch, setDirectSearch] = useState("");

    // Community Group Chat State
    const [communities, setCommunities] = useState([]);
    const [selectedCommunityIndex, setSelectedCommunityIndex] = useState(0);
    const [groupMessages, setGroupMessages] = useState([]);
    const [groupInput, setGroupInput] = useState("");
    const [loadingGroup, setLoadingGroup] = useState(true);
    const [groupSearch, setGroupSearch] = useState("");

    const chatEndRef = useRef(null);
    const directChatEndRef = useRef(null);
    const wsRef = useRef(null);

    const rawMentorId = localStorage.getItem("mentorId") || "";
    const mentorId = rawMentorId.replace(/['"]+/g, "").trim() || localStorage.getItem("mentorEmail") || "";
    const mentorName = localStorage.getItem("mentorName") || "Mentor";

    /* =========================================================
       FETCH DIRECT CONVERSATIONS
    ========================================================= */
    const fetchDirectConversations = async () => {
        if (!mentorId) return;
        try {
            const res = await api.get(`/direct-messages/conversations/${mentorId}?role=mentor`);
            if (res.data?.data) {
                const list = res.data.data;
                setConversations(list);

                // If URL specifies mentee_id, auto-select
                const targetMenteeId = searchParams.get("mentee_id");
                if (targetMenteeId) {
                    const match = list.find(
                        (c) => c.partner_id === targetMenteeId || c.partner_email === targetMenteeId
                    );
                    if (match) {
                        setSelectedConversation(match);
                    } else if (list.length > 0 && !selectedConversation) {
                        setSelectedConversation(list[0]);
                    }
                } else if (list.length > 0 && !selectedConversation) {
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
    }, [mentorId]);

    // Load direct messages for selected mentee & set up periodic poll
    useEffect(() => {
        if (!selectedConversation?.partner_id || !mentorId) return;

        let isMounted = true;
        const loadDirectMessages = async () => {
            try {
                const res = await api.get(
                    `/direct-messages/conversation?mentor_id=${mentorId}&mentee_id=${selectedConversation.partner_id}`
                );
                if (isMounted && res.data?.data) {
                    setDirectMessages(res.data.data);
                }
            } catch (err) {
                console.error("Error fetching direct conversation:", err);
            }
        };

        loadDirectMessages();

        // Polling interval every 3 seconds for real-time responsiveness
        const interval = setInterval(loadDirectMessages, 3000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [selectedConversation, mentorId]);

    useEffect(() => {
        directChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [directMessages]);

    const handleSendDirectMessage = async (e) => {
        e.preventDefault();
        if (!directInput.trim() || !selectedConversation || sendingDirect) return;

        try {
            setSendingDirect(true);
            const payload = {
                sender_id: mentorId,
                sender_name: mentorName,
                sender_role: "mentor",
                receiver_id: selectedConversation.partner_id,
                receiver_name: selectedConversation.partner_name,
                mentor_id: mentorId,
                mentee_id: selectedConversation.partner_id,
                message: directInput.trim(),
            };

            const res = await api.post("/direct-messages", payload);
            if (res.data?.data) {
                setDirectMessages((prev) => [...prev, res.data.data]);
                setDirectInput("");
                // Refresh conversations list in background
                fetchDirectConversations();
            }
        } catch (err) {
            console.error("Error sending direct message:", err);
            toast.error(err.response?.data?.detail || "Failed to send message");
        } finally {
            setSendingDirect(false);
        }
    };

    /* =========================================================
       COMMUNITY GROUP CHAT LOGIC
    ========================================================= */
    useEffect(() => {
        const fetchCommunities = async () => {
            if (!mentorId) return;
            try {
                setLoadingGroup(true);
                const res = await api.get(`/communities?mentor_id=${mentorId}`);
                if (res.data?.data && res.data.data.length > 0) {
                    setCommunities(res.data.data);
                } else {
                    const cRes = await api.get(`/mentor/${mentorId}/community`);
                    if (cRes.data?.data) {
                        setCommunities([cRes.data.data]);
                    }
                }
            } catch (err) {
                console.error("Error fetching mentor communities:", err);
            } finally {
                setLoadingGroup(false);
            }
        };

        fetchCommunities();
    }, [mentorId]);

    const activeCommunity = communities[selectedCommunityIndex];

    useEffect(() => {
        if (!activeCommunity?._id || activeTab !== "group") return;

        const commId = activeCommunity._id;
        loadGroupMessages(commId);
        connectWebSocket(commId);

        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, [activeCommunity, activeTab]);

    const loadGroupMessages = async (commId) => {
        try {
            const res = await api.get(`/communities/${commId}/messages`);
            if (res.data?.data) {
                setGroupMessages(res.data.data);
                setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
            }
        } catch (err) {
            console.error("Error loading group messages:", err);
        }
    };

    const connectWebSocket = (commId) => {
        if (wsRef.current) wsRef.current.close();

        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host = window.location.hostname === "localhost" ? "localhost:8000" : window.location.host;
        const socket = new WebSocket(`${protocol}//${host}/ws/community/${commId}`);

        socket.onopen = () => {
            console.log(`Mentor connected to WebSocket for ${commId}`);
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setGroupMessages((prev) => [...prev, data]);
                setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
            } catch (err) {
                console.error("Error parsing WS message:", err);
            }
        };

        wsRef.current = socket;
    };

    const handleSendGroupMessage = async (e) => {
        e.preventDefault();
        if (!groupInput.trim() || !activeCommunity) return;

        const payload = {
            community_id: activeCommunity._id,
            sender_id: mentorId,
            sender_name: mentorName,
            sender_role: "mentor",
            message: groupInput.trim(),
        };

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(payload));
            setGroupInput("");
        } else {
            try {
                const res = await api.post(`/communities/${activeCommunity._id}/messages`, payload);
                if (res.data?.data) {
                    setGroupMessages((prev) => [...prev, res.data.data]);
                    setGroupInput("");
                    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
                }
            } catch (err) {
                console.error("Error sending group message:", err);
                toast.error("Failed to send message");
            }
        }
    };

    const filteredDirect = conversations.filter((c) =>
        (c.partner_name || "").toLowerCase().includes(directSearch.toLowerCase()) ||
        (c.partner_email || "").toLowerCase().includes(directSearch.toLowerCase())
    );

    const filteredCommunities = communities.filter((c) =>
        (c.name || "").toLowerCase().includes(groupSearch.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <Toaster position="top-right" />

            {/* Header & Tabs */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-[#163b35]">
                        Messages & Chats
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Chat 1-on-1 with community members for free, or broadcast to community group channels.
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex items-center bg-gray-100 p-1 rounded-2xl gap-1">
                    <button
                        onClick={() => {
                            setActiveTab("direct");
                            setSearchParams({ tab: "direct" });
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === "direct"
                                ? "bg-white text-[#163b35] shadow-xs"
                                : "text-gray-500 hover:text-gray-900"
                            }`}
                    >
                        <MessageCircle size={15} className={activeTab === "direct" ? "text-emerald-700" : ""} />
                        Direct Messages
                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                            Free for Members
                        </span>
                    </button>

                    <button
                        onClick={() => {
                            setActiveTab("group");
                            setSearchParams({ tab: "group" });
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === "group"
                                ? "bg-white text-[#163b35] shadow-xs"
                                : "text-gray-500 hover:text-gray-900"
                            }`}
                    >
                        <Users size={15} className={activeTab === "group" ? "text-emerald-700" : ""} />
                        Community Group Channels
                    </button>
                </div>
            </div>

            {/* =========================================================
                TAB 1: DIRECT MESSAGES (FREE FOR COMMUNITY MEMBERS)
            ========================================================= */}
            {activeTab === "direct" && (
                <div className="grid h-[680px] grid-cols-1 overflow-hidden rounded-3xl border border-[#dce8df] bg-white shadow-sm lg:grid-cols-[340px_1fr]">
                    {/* Left: Direct Conversations List */}
                    <div className="border-r border-[#edf2ee] flex flex-col h-full bg-[#fbfaf6]/40">
                        <div className="border-b border-[#edf2ee] p-4 bg-white">
                            <div className="relative">
                                <Search
                                    size={16}
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                                <input
                                    value={directSearch}
                                    onChange={(e) => setDirectSearch(e.target.value)}
                                    placeholder="Search community mentees..."
                                    className="w-full rounded-xl border border-[#dce8df] py-2 pl-9 pr-3 text-xs outline-none focus:border-[#176b5c]"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto divide-y divide-[#edf2ee]">
                            {loadingDirect ? (
                                <div className="p-8 text-center text-xs text-gray-400">
                                    Loading conversations...
                                </div>
                            ) : filteredDirect.length === 0 ? (
                                <div className="p-8 text-center text-xs text-gray-400 space-y-2">
                                    <MessageCircle size={28} className="mx-auto text-gray-300" />
                                    <p className="font-semibold text-gray-600">No direct messages yet</p>
                                    <p>Community members can send you free personal messages from your profile or community page.</p>
                                </div>
                            ) : (
                                filteredDirect.map((conv) => {
                                    const isSelected = selectedConversation?.partner_id === conv.partner_id;
                                    const initials = (conv.partner_name || "M")
                                        .split(" ")
                                        .map((w) => w[0])
                                        .join("")
                                        .slice(0, 2)
                                        .toUpperCase();

                                    return (
                                        <button
                                            key={conv.partner_id}
                                            onClick={() => setSelectedConversation(conv)}
                                            className={`flex w-full items-start gap-3 p-4 text-left transition ${isSelected ? "bg-[#eaf6ed] border-l-4 border-[#103d35]" : "hover:bg-white"
                                                }`}
                                        >
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#103d35] to-[#176b5c] text-xs font-bold text-white shadow-2xs">
                                                {initials}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-1">
                                                    <p className="truncate text-xs font-bold text-[#163b35]">
                                                        {conv.partner_name}
                                                    </p>
                                                    <span className="text-[10px] text-gray-400 shrink-0">
                                                        {conv.last_timestamp?.slice(0, 10) || "Recent"}
                                                    </span>
                                                </div>

                                                <p className="truncate text-xs text-gray-500 mt-0.5">
                                                    {conv.last_message}
                                                </p>

                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                        Community Member
                                                    </span>
                                                    {conv.unread_count > 0 && (
                                                        <span className="h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                                                            {conv.unread_count}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Right: Direct Chat View */}
                    <div className="flex min-w-0 flex-col h-full bg-white">
                        {selectedConversation ? (
                            <>
                                {/* Conversation Header */}
                                <div className="flex items-center justify-between border-b border-[#edf2ee] p-4 bg-white shadow-2xs">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#103d35] to-[#176b5c] text-xs font-bold text-white shadow-2xs">
                                            {(selectedConversation.partner_name || "M").slice(0, 2).toUpperCase()}
                                        </div>

                                        <div>
                                            <p className="text-sm font-bold text-[#163b35]">
                                                {selectedConversation.partner_name}
                                            </p>
                                            <p className="text-xs text-emerald-700 flex items-center gap-1">
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                Enrolled Community Member • Free Personal Chat
                                            </p>
                                        </div>
                                    </div>

                                    <span className="text-xs font-medium text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                                        {directMessages.length} message{directMessages.length === 1 ? "" : "s"}
                                    </span>
                                </div>

                                {/* Direct Messages History */}
                                <div className="flex-1 space-y-3.5 overflow-y-auto bg-[#fafcf9] p-5">
                                    {directMessages.length === 0 ? (
                                        <div className="text-center py-24 text-gray-400 text-xs space-y-2">
                                            <MessageCircle size={32} className="mx-auto text-gray-300" />
                                            <p className="font-semibold text-gray-600">No messages in this conversation yet</p>
                                            <p>Send a message below to start guiding your community member!</p>
                                        </div>
                                    ) : (
                                        directMessages.map((m, idx) => {
                                            const isMe = m.sender_id === mentorId || m.sender_role === "mentor";
                                            const time = m.created_at
                                                ? new Date(m.created_at).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })
                                                : "";

                                            return (
                                                <div
                                                    key={m._id || idx}
                                                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                                                >
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-bold text-gray-700">
                                                            {isMe ? "You (Mentor)" : m.sender_name}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400">{time}</span>
                                                    </div>

                                                    <div
                                                        className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-xs shadow-xs leading-relaxed ${isMe
                                                                ? "bg-[#103d35] text-white rounded-br-xs"
                                                                : "bg-white text-[#163b35] border border-gray-200 rounded-bl-xs"
                                                            }`}
                                                    >
                                                        {m.message}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={directChatEndRef} />
                                </div>

                                {/* Direct Message Input (Mentor Reply Area) */}
                                <form onSubmit={handleSendDirectMessage} className="border-t border-[#edf2ee] p-4 bg-white">
                                    <div className="flex items-center gap-3">
                                        <input
                                            value={directInput}
                                            onChange={(e) => setDirectInput(e.target.value)}
                                            placeholder={`Reply to ${selectedConversation.partner_name}...`}
                                            className="flex-1 rounded-2xl border border-[#dce8df] px-4 py-3 text-xs outline-none focus:border-[#176b5c] transition"
                                        />
                                        <button
                                            type="submit"
                                            disabled={sendingDirect || !directInput.trim()}
                                            className="flex items-center gap-1.5 rounded-2xl bg-[#103d35] px-5 py-3 text-xs font-bold text-white hover:bg-[#176b5c] transition shadow-xs disabled:opacity-50"
                                        >
                                            <Send size={15} />
                                            Reply
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-2">
                                        💡 Messages are sent 1-on-1 directly to this community member for free.
                                    </p>
                                </form>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center p-8 text-center text-gray-400 text-xs">
                                <div className="space-y-2">
                                    <MessageCircle size={36} className="mx-auto text-gray-300" />
                                    <p className="font-semibold text-gray-600 text-sm">Select a community member</p>
                                    <p>Choose a mentee from the list on the left to review messages and reply.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* =========================================================
                TAB 2: COMMUNITY GROUP CHAT
            ========================================================= */}
            {activeTab === "group" && (
                <div className="grid h-[680px] grid-cols-1 overflow-hidden rounded-3xl border border-[#dce8df] bg-white shadow-sm lg:grid-cols-[320px_1fr]">
                    {/* Left: Community Channels List */}
                    <div className="border-r border-[#edf2ee] flex flex-col h-full bg-[#fbfaf6]/40">
                        <div className="border-b border-[#edf2ee] p-4 bg-white">
                            <div className="relative">
                                <Search
                                    size={16}
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                                <input
                                    value={groupSearch}
                                    onChange={(e) => setGroupSearch(e.target.value)}
                                    placeholder="Search communities..."
                                    className="w-full rounded-xl border border-[#dce8df] py-2 pl-9 pr-3 text-xs outline-none focus:border-[#176b5c]"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto divide-y divide-[#edf2ee]">
                            {filteredCommunities.map((comm, index) => {
                                const isSelected = selectedCommunityIndex === index;
                                return (
                                    <button
                                        key={comm._id || index}
                                        onClick={() => setSelectedCommunityIndex(index)}
                                        className={`flex w-full items-center gap-3 p-4 text-left transition ${isSelected ? "bg-[#eaf6ed]" : "hover:bg-white"
                                            }`}
                                    >
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#103d35] text-xs font-bold text-white">
                                            #
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-bold text-[#163b35]">
                                                {comm.name}
                                            </p>
                                            <p className="truncate text-[11px] text-gray-400">
                                                {comm.category || "Community"} · {comm.current_members || 0} members
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: Active Group Chat View */}
                    <div className="flex min-w-0 flex-col h-full bg-white">
                        <div className="flex items-center justify-between border-b border-[#edf2ee] p-4 bg-white">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#103d35] text-xs font-bold text-white">
                                    #
                                </div>

                                <div>
                                    <p className="text-sm font-bold text-[#163b35]">
                                        {activeCommunity?.name || "Community Group Chat"}
                                    </p>
                                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        Group Channel · {activeCommunity?.current_members || 0} enrolled members
                                    </p>
                                </div>
                            </div>

                            <span className="text-xs text-gray-400">
                                {groupMessages.length} messages
                            </span>
                        </div>

                        {/* Messages Scroll Area */}
                        <div className="flex-1 space-y-3.5 overflow-y-auto bg-[#fafcf9] p-5">
                            {groupMessages.length === 0 ? (
                                <div className="text-center py-24 text-gray-400 text-xs">
                                    No messages in this community yet. Broadcast an announcement to your community!
                                </div>
                            ) : (
                                groupMessages.map((m, idx) => {
                                    const isMe = m.sender_id === mentorId || m.sender_role === "mentor";
                                    return (
                                        <div
                                            key={m._id || idx}
                                            className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-gray-700">
                                                    {m.sender_name} {isMe ? "(You - Mentor)" : ""}
                                                </span>
                                            </div>

                                            <div
                                                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-xs leading-relaxed ${isMe
                                                        ? "bg-[#103d35] text-white rounded-br-xs"
                                                        : "bg-white text-[#163b35] border border-gray-200 rounded-bl-xs"
                                                    }`}
                                            >
                                                {m.message}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSendGroupMessage} className="border-t border-[#edf2ee] p-4 bg-white">
                            <div className="flex items-center gap-3">
                                <input
                                    value={groupInput}
                                    onChange={(e) => setGroupInput(e.target.value)}
                                    placeholder={`Broadcast message to #${activeCommunity?.name || "community"}...`}
                                    className="flex-1 rounded-2xl border border-[#dce8df] px-4 py-3 text-xs outline-none focus:border-[#176b5c] transition"
                                />
                                <button
                                    type="submit"
                                    className="flex items-center gap-1.5 rounded-2xl bg-[#103d35] px-5 py-3 text-xs font-bold text-white hover:bg-[#176b5c] transition shadow-xs"
                                >
                                    <Send size={15} />
                                    Broadcast
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Messages;