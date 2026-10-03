import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Handshake,
    Search,
    CheckCircle2,
    PauseCircle,
    XCircle,
    RotateCcw,
    Users,
    Calendar,
    ArrowUpDown,
    ExternalLink,
    Eye,
} from "lucide-react";
import api from "../../api.js";
import toast, { Toaster } from "react-hot-toast";

const MentorshipsAdmin = () => {
    const navigate = useNavigate();
    const [mentorships, setMentorships] = useState([]);
    const [stats, setStats] = useState({ total: 0, active: 0, paused: 0, cancelled: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        fetchMentorships();
    }, []);

    const fetchMentorships = async () => {
        try {
            setLoading(true);
            const res = await api.get("/admin/mentorships");
            if (res.data) {
                setMentorships(res.data.data || []);
                setStats(res.data.stats || { total: 0, active: 0, paused: 0, cancelled: 0 });
            }
        } catch (err) {
            console.error("Error fetching mentorships:", err);
            toast.error("Failed to load mentorship enrollments from MongoDB");
            setMentorships([]);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            setUpdatingId(id);
            await api.put(`/admin/mentorships/${id}/status`, { status: newStatus });
            toast.success(`Mentorship status updated to ${newStatus}`);
            fetchMentorships();
        } catch (err) {
            console.error(err);
            toast.error("Failed to update mentorship status");
        } finally {
            setUpdatingId(null);
        }
    };

    const filtered = mentorships.filter((m) => {
        const matchesSearch =
            !search ||
            m.mentee_name?.toLowerCase().includes(search.toLowerCase()) ||
            m.mentee_email?.toLowerCase().includes(search.toLowerCase()) ||
            m.mentor_name?.toLowerCase().includes(search.toLowerCase()) ||
            m.community_name?.toLowerCase().includes(search.toLowerCase());

        const matchesStatus = filterStatus === "all" || (m.status || "active") === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-[#163b35]">
                        Mentorships & Subscriptions
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Oversee active mentee enrollments, community subscriptions, and program commitments.
                    </p>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-[#dce8df] bg-white p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 uppercase">Total Enrolled</span>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                            <Handshake size={19} />
                        </div>
                    </div>
                    <p className="mt-3 text-2xl font-bold text-[#163b35]">{stats.total}</p>
                    <p className="text-[11px] text-gray-400 mt-1">Platform subscriptions</p>
                </div>

                <div className="rounded-2xl border border-[#dce8df] bg-white p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 uppercase">Active Now</span>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                            <CheckCircle2 size={19} />
                        </div>
                    </div>
                    <p className="mt-3 text-2xl font-bold text-[#163b35]">{stats.active}</p>
                    <p className="text-[11px] text-green-600 mt-1">In good standing</p>
                </div>

                <div className="rounded-2xl border border-[#dce8df] bg-white p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 uppercase">Paused</span>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                            <PauseCircle size={19} />
                        </div>
                    </div>
                    <p className="mt-3 text-2xl font-bold text-[#163b35]">{stats.paused}</p>
                    <p className="text-[11px] text-amber-600 mt-1">Temporarily hold</p>
                </div>

                <div className="rounded-2xl border border-[#dce8df] bg-white p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 uppercase">Cancelled</span>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                            <XCircle size={19} />
                        </div>
                    </div>
                    <p className="mt-3 text-2xl font-bold text-[#163b35]">{stats.cancelled}</p>
                    <p className="text-[11px] text-red-600 mt-1">Expired / Terminated</p>
                </div>
            </div>

            {/* Table Container */}
            <div className="rounded-2xl border border-[#dce8df] bg-white shadow-xs overflow-hidden">
                {/* Search and Tabs */}
                <div className="p-5 border-b border-[#edf2ee] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="relative max-w-sm w-full">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by mentee, mentor, or community..."
                            className="w-full rounded-xl border border-[#dce8df] py-2 pl-9 pr-3 text-xs outline-none focus:border-[#176b5c]"
                        />
                    </div>

                    <div className="flex items-center gap-1.5 bg-[#f5f7f2] p-1 rounded-xl text-xs font-semibold">
                        {["all", "active", "paused", "cancelled"].map((st) => (
                            <button
                                key={st}
                                onClick={() => setFilterStatus(st)}
                                className={`px-3 py-1.5 rounded-lg capitalize transition ${
                                    filterStatus === st ? "bg-white text-[#163b35] shadow-xs" : "text-gray-500 hover:text-[#163b35]"
                                }`}
                            >
                                {st}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[750px] text-left text-xs">
                        <thead className="border-b border-[#edf2ee] bg-[#fafcf9] text-gray-400 uppercase tracking-wider text-[11px]">
                            <tr>
                                <th className="px-6 py-3.5">Mentee Subscriber</th>
                                <th className="px-6 py-3.5">Mentorship Community</th>
                                <th className="px-6 py-3.5">Mentor Host</th>
                                <th className="px-6 py-3.5">Subscribed Date</th>
                                <th className="px-6 py-3.5">Status</th>
                                <th className="px-6 py-3.5 text-right">Admin Action</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-[#edf2ee]">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center text-gray-400">
                                        Loading mentorship subscriptions from MongoDB...
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center text-gray-400">
                                        No mentorship records found in MongoDB.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((item) => {
                                    const isUpdating = updatingId === item._id;
                                    const currentStatus = item.status || "active";

                                    return (
                                        <tr key={item._id} className="hover:bg-[#fafcf9] transition">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <button
                                                        onClick={() => navigate(`/admin/mentees/${item.mentee_id || item.user_id || item._id}`)}
                                                        className="font-semibold text-[#163b35] hover:text-green-700 hover:underline inline-flex items-center gap-1.5 transition text-left"
                                                        title="View Mentee Profile"
                                                    >
                                                        {item.mentee_name}
                                                        <Eye size={13} className="text-gray-400" />
                                                    </button>
                                                    <p className="text-[11px] text-gray-400">{item.mentee_email}</p>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 font-semibold text-[#163b35]">
                                                {item.community_name || "Community Mentorship"}
                                            </td>

                                            <td className="px-6 py-4 text-gray-600">
                                                {item.mentor_name || "Assigned Mentor"}
                                            </td>

                                            <td className="px-6 py-4 text-gray-500">
                                                {item.created_at ? new Date(item.created_at).toLocaleDateString() : "Active"}
                                            </td>

                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                        currentStatus === "active"
                                                            ? "bg-green-50 text-green-700 border border-green-200"
                                                            : currentStatus === "paused"
                                                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                                                            : "bg-red-50 text-red-700 border border-red-200"
                                                    }`}
                                                >
                                                    <span
                                                        className={`h-1.5 w-1.5 rounded-full ${
                                                            currentStatus === "active"
                                                                ? "bg-green-500"
                                                                : currentStatus === "paused"
                                                                ? "bg-amber-500"
                                                                : "bg-red-500"
                                                        }`}
                                                    />
                                                    {currentStatus}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {currentStatus === "active" ? (
                                                        <button
                                                            disabled={isUpdating}
                                                            onClick={() => handleUpdateStatus(item._id, "paused")}
                                                            className="px-2.5 py-1 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 text-[11px] font-semibold transition disabled:opacity-50"
                                                        >
                                                            Pause
                                                        </button>
                                                    ) : (
                                                        <button
                                                            disabled={isUpdating}
                                                            onClick={() => handleUpdateStatus(item._id, "active")}
                                                            className="px-2.5 py-1 rounded-lg border border-green-200 text-green-700 hover:bg-green-50 text-[11px] font-semibold transition disabled:opacity-50"
                                                        >
                                                            Activate
                                                        </button>
                                                    )}

                                                    {currentStatus !== "cancelled" && (
                                                        <button
                                                            disabled={isUpdating}
                                                            onClick={() => handleUpdateStatus(item._id, "cancelled")}
                                                            className="px-2.5 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-semibold transition disabled:opacity-50"
                                                        >
                                                            Terminate
                                                        </button>
                                                    )}
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
        </div>
    );
};

export default MentorshipsAdmin;
