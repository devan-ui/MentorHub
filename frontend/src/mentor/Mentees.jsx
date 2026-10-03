import React, { useState, useEffect } from "react";
import {
    Search,
    UserPlus,
    MessageCircle,
    Eye,
    Users,
    Mail,
    CheckCircle2,
    UserCheck,
    Clock,
    X,
    GraduationCap,
    Briefcase,
    Phone,
    MapPin,
    Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";
import toast, { Toaster } from "react-hot-toast";

const Mentees = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all"); // "all", "active", "pending"
    const [mentees, setMentees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [acceptingId, setAcceptingId] = useState(null);
    const [viewingProfile, setViewingProfile] = useState(null);

    const mentorId = localStorage.getItem("mentorId");

    const fetchMentees = async () => {
        if (!mentorId) return;
        try {
            setLoading(true);
            const res = await api.get(`/mentor/${mentorId}/mentees`);
            if (res.data?.data) {
                setMentees(res.data.data);
            } else {
                setMentees([]);
            }
        } catch (err) {
            console.error("Error fetching mentees:", err);
            toast.error("Failed to load mentees");
            setMentees([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMentees();
    }, [mentorId]);

    /* =========================================================
       ACCEPT MENTEE TO COMMUNITY HANDLER
    ========================================================= */
    const handleAcceptMentee = async (mentee) => {
        const idKey = mentee._id || mentee.email || mentee.mentee_id;
        try {
            setAcceptingId(idKey);
            const payload = {
                mentee_id: mentee.mentee_id || mentee._id,
                mentee_name: mentee.name || mentee.mentee_name,
                mentee_email: mentee.email || mentee.mentee_email,
                application_id: mentee.application_id,
                subscription_id: mentee.subscription_id,
            };

            const res = await api.post(`/mentor/${mentorId}/mentees/accept`, payload);
            toast.success(res.data?.message || `${payload.mentee_name} accepted to community!`);
            await fetchMentees();
        } catch (err) {
            console.error("Failed to accept mentee:", err);
            toast.error(err.response?.data?.detail || "Failed to accept mentee into community");
        } finally {
            setAcceptingId(null);
        }
    };

    // Filter by search & tab
    const filtered = mentees.filter((m) => {
        const name = (m.name || m.mentee_name || "").toLowerCase();
        const email = (m.email || m.mentee_email || "").toLowerCase();
        const comm = (m.community || m.community_name || "").toLowerCase();
        const query = search.toLowerCase();

        const matchesSearch = name.includes(query) || email.includes(query) || comm.includes(query);

        const isAct = m.status === "active";
        const isPend = m.status === "pending" || m.status === "pending_invite";

        if (statusFilter === "active") return matchesSearch && isAct;
        if (statusFilter === "pending") return matchesSearch && isPend;
        return matchesSearch;
    });

    const activeCount = mentees.filter((m) => m.status === "active").length;
    const pendingCount = mentees.filter(
        (m) => m.status === "pending" || m.status === "pending_invite"
    ).length;

    return (
        <div className="space-y-6">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-[#163b35]">
                        My Mentees & Requests
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Review community applications, accept mentees, and manage active members.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate("/mentor/community")}
                        className="flex items-center justify-center gap-2 rounded-xl border border-[#dce8df] bg-white px-4 py-2.5 text-xs font-bold text-[#163b35] hover:bg-gray-50 transition shadow-2xs"
                    >
                        <Users size={16} className="text-[#176b5c]" />
                        Community Space
                    </button>
                    <button
                        onClick={() => navigate("/mentor/sessions")}
                        className="flex items-center justify-center gap-2 rounded-xl bg-[#103d35] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#176b5c] transition shadow-2xs"
                    >
                        <UserPlus size={16} />
                        Schedule Session
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Stat
                    icon={<Users size={20} />}
                    title="Total Mentees"
                    value={mentees.length}
                    subtitle="Platform mentees & applicants"
                />
                <Stat
                    icon={<CheckCircle2 size={20} className="text-emerald-600" />}
                    title="Active Community Members"
                    value={activeCount}
                    subtitle="Enrolled in community space"
                />
                <Stat
                    icon={<Clock size={20} className="text-amber-500" />}
                    title="Pending Community Requests"
                    value={pendingCount}
                    subtitle="Waiting for your acceptance"
                />
            </div>

            {/* Main Card Container */}
            <div className="rounded-2xl border border-[#dce8df] bg-white shadow-xs">
                {/* Search & Tabs Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#edf2ee] p-5 gap-4">
                    {/* Search Input */}
                    <div className="relative flex-1 max-w-md">
                        <Search
                            size={18}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by mentee name, email, or community..."
                            className="w-full rounded-xl border border-[#dce8df] py-2.5 pl-10 pr-4 text-xs sm:text-sm outline-none focus:border-[#176b5c]"
                        />
                    </div>

                    {/* Status Filter Tabs */}
                    <div className="flex items-center bg-gray-100/80 p-1 rounded-xl gap-1 self-start sm:self-auto">
                        <button
                            onClick={() => setStatusFilter("all")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                statusFilter === "all"
                                    ? "bg-white text-[#163b35] shadow-xs"
                                    : "text-gray-500 hover:text-gray-900"
                            }`}
                        >
                            All ({mentees.length})
                        </button>
                        <button
                            onClick={() => setStatusFilter("active")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                statusFilter === "active"
                                    ? "bg-white text-emerald-800 shadow-xs"
                                    : "text-gray-500 hover:text-gray-900"
                            }`}
                        >
                            Active ({activeCount})
                        </button>
                        <button
                            onClick={() => setStatusFilter("pending")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                statusFilter === "pending"
                                    ? "bg-white text-amber-800 shadow-xs"
                                    : "text-gray-500 hover:text-gray-900"
                            }`}
                        >
                            Pending ({pendingCount})
                        </button>
                    </div>
                </div>

                {/* Mentees Table */}
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[750px]">
                        <thead>
                            <tr className="border-b border-[#edf2ee] text-left text-xs uppercase tracking-wide text-gray-400 bg-gray-50/50">
                                <th className="px-6 py-4">Mentee</th>
                                <th className="px-6 py-4">Enrolled / Target Community</th>
                                <th className="px-6 py-4">Request / Joined Date</th>
                                <th className="px-6 py-4">Community Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-12 text-gray-400 text-sm">
                                        <div className="animate-spin w-6 h-6 border-2 border-[#103d35] border-t-transparent rounded-full mx-auto mb-2" />
                                        Loading mentees and requests...
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-14 text-gray-400 text-sm space-y-2">
                                        <Users size={32} className="mx-auto text-gray-300" />
                                        <p className="font-semibold text-gray-600">No mentees found</p>
                                        <p className="text-xs text-gray-400">
                                            {statusFilter === "pending"
                                                ? "There are no pending requests to join your community."
                                                : statusFilter === "active"
                                                ? "No active community members enrolled yet."
                                                : "When mentees apply or register, they will appear here for your review."}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((mentee, index) => {
                                    const name = mentee.name || mentee.mentee_name || "Mentee";
                                    const email = mentee.email || mentee.mentee_email || "";
                                    const initials = mentee.initials ||
                                        name
                                            .split(" ")
                                            .map((w) => w[0])
                                            .join("")
                                            .slice(0, 2)
                                            .toUpperCase() || "M";

                                    const isActive = mentee.status === "active";
                                    const isPending = mentee.status === "pending" || mentee.status === "pending_invite";
                                    const isAccepting = acceptingId === (mentee._id || mentee.email || mentee.mentee_id);

                                    return (
                                        <tr
                                            key={mentee.subscription_id || mentee.application_id || mentee._id || mentee.email || index}
                                            className="border-b border-[#edf2ee] last:border-0 hover:bg-[#fafcf9] transition"
                                        >
                                            {/* Mentee Column */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#103d35] to-[#176b5c] text-xs font-bold text-white shadow-xs">
                                                        {initials}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-[#163b35]">
                                                            {name}
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            {email}
                                                        </p>
                                                        {mentee.message && (
                                                            <p className="text-[11px] text-gray-500 italic mt-0.5 line-clamp-1">
                                                                "{mentee.message}"
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Community Name */}
                                            <td className="px-6 py-4 text-xs font-semibold text-[#163b35]">
                                                {mentee.community || mentee.community_name || "Mentorship Community"}
                                            </td>

                                            {/* Date */}
                                            <td className="px-6 py-4 text-xs text-gray-500">
                                                {mentee.joined || "Recently"}
                                            </td>

                                            {/* Status Badge */}
                                            <td className="px-6 py-4">
                                                {isActive ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-100">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                        Active Member
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-200">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                        {mentee.status === "pending" ? "Pending Request" : "Pending Approval"}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {isPending && (
                                                        <button
                                                            disabled={isAccepting}
                                                            onClick={() => handleAcceptMentee(mentee)}
                                                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#103d35] hover:bg-[#176b5c] px-3.5 py-1.5 text-xs font-bold text-white transition shadow-xs disabled:opacity-50"
                                                            title="Click to accept this mentee into your community"
                                                        >
                                                            <UserCheck size={14} />
                                                            {isAccepting ? "Accepting..." : "Accept to Community"}
                                                        </button>
                                                    )}

                                                    {/* Direct 1-on-1 Message */}
                                                    <button
                                                        onClick={() => navigate(`/mentor/messages?tab=direct&mentee_id=${mentee.mentee_id || mentee._id || mentee.email}`)}
                                                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-900 hover:bg-emerald-100 transition shadow-2xs cursor-pointer"
                                                        title="Send 1-on-1 Direct Message"
                                                    >
                                                        <MessageCircle size={14} className="text-emerald-700" />
                                                        <span>1-on-1 Chat</span>
                                                    </button>

                                                    {/* View Profile */}
                                                    <button
                                                        onClick={() => setViewingProfile(mentee)}
                                                        className="rounded-xl border border-gray-200 p-2 text-gray-500 hover:bg-gray-100 hover:text-[#176b5c] transition shadow-2xs"
                                                        title="View Profile Details"
                                                    >
                                                        <Eye size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* =========================================================
                VIEW PROFILE MODAL
            ========================================================= */}
            {viewingProfile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#103d35] to-[#176b5c] text-sm font-bold text-white shadow-xs">
                                    {viewingProfile.initials || "M"}
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-[#163b35]">
                                        {viewingProfile.name || viewingProfile.mentee_name}
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        {viewingProfile.email || viewingProfile.mentee_email}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewingProfile(null)}
                                className="rounded-xl p-1 text-gray-400 hover:bg-gray-100"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Status Ribbon */}
                        <div className="flex items-center justify-between text-xs bg-gray-50 p-3 rounded-xl">
                            <span className="text-gray-500">Community Status:</span>
                            {viewingProfile.status === "active" ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                                    ✓ Active Community Member
                                </span>
                            ) : (
                                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                                    Pending Acceptance
                                </span>
                            )}
                        </div>

                        {/* Bio */}
                        <div className="space-y-1">
                            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">About Mentee</h4>
                            <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl leading-relaxed">
                                {viewingProfile.bio || viewingProfile.message || "Mentee has registered to connect and grow skills."}
                            </p>
                        </div>

                        {/* Skills */}
                        {viewingProfile.skills && (
                            <div className="space-y-1.5">
                                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Skills</h4>
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
                            <div className="space-y-2 text-xs">
                                {viewingProfile.education && (
                                    <div className="p-3 bg-gray-50 rounded-xl space-y-0.5">
                                        <span className="font-bold text-gray-700 flex items-center gap-1">
                                            <GraduationCap size={13} className="text-[#176b5c]" /> Education
                                        </span>
                                        <p className="text-gray-600">{viewingProfile.education}</p>
                                    </div>
                                )}
                                {viewingProfile.experience && (
                                    <div className="p-3 bg-gray-50 rounded-xl space-y-0.5">
                                        <span className="font-bold text-gray-700 flex items-center gap-1">
                                            <Briefcase size={13} className="text-[#176b5c]" /> Experience
                                        </span>
                                        <p className="text-gray-600">{viewingProfile.experience}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Modal Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2 pt-2">
                            <button
                                onClick={() => {
                                    const targetId = viewingProfile.mentee_id || viewingProfile._id || viewingProfile.email;
                                    navigate(`/mentor/messages?tab=direct&mentee_id=${targetId}`);
                                }}
                                className="flex-1 py-2.5 rounded-xl bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-900 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <MessageCircle size={14} className="text-emerald-700" />
                                1-on-1 Chat
                            </button>

                            {viewingProfile.status !== "active" && (
                                <button
                                    onClick={() => {
                                        handleAcceptMentee(viewingProfile);
                                        setViewingProfile(null);
                                    }}
                                    className="flex-1 py-2.5 rounded-xl bg-[#103d35] hover:bg-[#176b5c] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                                >
                                    <UserCheck size={14} />
                                    Accept
                                </button>
                            )}
                            <button
                                onClick={() => setViewingProfile(null)}
                                className="px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-600 transition cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const Stat = ({ icon, title, value, subtitle }) => {
    return (
        <div className="rounded-2xl border border-[#dce8df] bg-white p-5 shadow-xs">
            <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf6ed] text-[#176b5c]">
                    {icon}
                </div>
                <div>
                    <p className="text-xs text-gray-400 font-medium">{title}</p>
                    <p className="text-xl font-bold text-[#163b35] mt-0.5">{value}</p>
                    {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
                </div>
            </div>
        </div>
    );
};

export default Mentees;