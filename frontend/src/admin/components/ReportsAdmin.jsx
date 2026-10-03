import React, { useState, useEffect } from "react";
import {
    Flag,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Plus,
    Search,
    ShieldAlert,
    BarChart3,
    FileText,
} from "lucide-react";
import api from "../../api.js";
import toast, { Toaster } from "react-hot-toast";

const ReportsAdmin = () => {
    const [reports, setReports] = useState([]);
    const [analytics, setAnalytics] = useState({
        total_users: 0,
        total_mentors: 0,
        total_communities: 0,
        open_tickets: 0,
        resolved_tickets: 0,
    });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newReport, setNewReport] = useState({
        title: "",
        description: "",
        category: "Community Guidelines",
        priority: "medium",
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const res = await api.get("/admin/reports");
            if (res.data) {
                setReports(res.data.data || []);
                setAnalytics(
                    res.data.analytics || {
                        total_users: 0,
                        total_mentors: 0,
                        total_communities: 0,
                        open_tickets: 0,
                        resolved_tickets: 0,
                    }
                );
            }
        } catch (err) {
            console.error("Error fetching admin reports:", err);
            toast.error("Failed to load reports from MongoDB");
            setReports([]);
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (id) => {
        try {
            await api.put(`/admin/reports/${id}/resolve`);
            toast.success("Ticket resolved successfully!");
            fetchReports();
        } catch (err) {
            console.error(err);
            toast.error("Failed to resolve ticket");
        }
    };

    const handleCreateReport = async (e) => {
        e.preventDefault();
        if (!newReport.title.trim()) return;

        try {
            setSubmitting(true);
            await api.post("/admin/reports", newReport);
            toast.success("Incident report logged in MongoDB!");
            setShowCreateModal(false);
            setNewReport({
                title: "",
                description: "",
                category: "Community Guidelines",
                priority: "medium",
            });
            fetchReports();
        } catch (err) {
            console.error(err);
            toast.error("Failed to create report");
        } finally {
            setSubmitting(false);
        }
    };

    const filtered = reports.filter(
        (r) =>
            !search ||
            r.title?.toLowerCase().includes(search.toLowerCase()) ||
            r.description?.toLowerCase().includes(search.toLowerCase()) ||
            r.category?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-[#163b35]">
                        Reports & Incident Management
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Platform compliance tickets, reported user conduct, and security audits from MongoDB.
                    </p>
                </div>

                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 rounded-xl bg-[#103d35] px-5 py-3 text-sm font-semibold text-white hover:bg-[#176b5c] transition shadow-xs"
                >
                    <Plus size={17} />
                    Log Incident Ticket
                </button>
            </div>

            {/* Platform Analytics Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-[#dce8df] bg-white p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 uppercase">Registered Users</span>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <BarChart3 size={19} />
                        </div>
                    </div>
                    <p className="mt-3 text-2xl font-bold text-[#163b35]">{analytics.total_users}</p>
                    <p className="text-[11px] text-blue-600 mt-1">Total platform learners</p>
                </div>

                <div className="rounded-2xl border border-[#dce8df] bg-white p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 uppercase">Active Mentors</span>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                            <CheckCircle2 size={19} />
                        </div>
                    </div>
                    <p className="mt-3 text-2xl font-bold text-[#163b35]">{analytics.total_mentors}</p>
                    <p className="text-[11px] text-emerald-700 mt-1">Verified industry leaders</p>
                </div>

                <div className="rounded-2xl border border-[#dce8df] bg-white p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 uppercase">Open Incidents</span>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                            <AlertTriangle size={19} />
                        </div>
                    </div>
                    <p className="mt-3 text-2xl font-bold text-[#163b35]">{analytics.open_tickets}</p>
                    <p className="text-[11px] text-red-600 mt-1">Pending resolution</p>
                </div>

                <div className="rounded-2xl border border-[#dce8df] bg-white p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 uppercase">Resolved Cases</span>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                            <ShieldAlert size={19} />
                        </div>
                    </div>
                    <p className="mt-3 text-2xl font-bold text-[#163b35]">{analytics.resolved_tickets}</p>
                    <p className="text-[11px] text-green-600 mt-1">Audited & closed</p>
                </div>
            </div>

            {/* Reports List */}
            <div className="rounded-2xl border border-[#dce8df] bg-white shadow-xs overflow-hidden">
                <div className="p-5 border-b border-[#edf2ee]">
                    <div className="relative max-w-sm">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search incident reports..."
                            className="w-full rounded-xl border border-[#dce8df] py-2 pl-9 pr-3 text-xs outline-none focus:border-[#176b5c]"
                        />
                    </div>
                </div>

                <div className="divide-y divide-[#edf2ee]">
                    {loading ? (
                        <div className="py-12 text-center text-gray-400 text-xs">
                            Loading platform reports from MongoDB...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 text-xs">
                            No incident reports filed in MongoDB. The platform is running smoothly!
                        </div>
                    ) : (
                        filtered.map((r) => {
                            const isOpen = r.status !== "resolved";
                            return (
                                <div key={r._id} className="p-6 hover:bg-[#fafcf9] transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="space-y-1.5 max-w-xl">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                    r.priority === "high"
                                                        ? "bg-red-100 text-red-700"
                                                        : "bg-amber-100 text-amber-800"
                                                }`}
                                            >
                                                {r.priority || "Normal"}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {r.category || "General"} · {r.created_at ? new Date(r.created_at).toLocaleDateString() : "Recent"}
                                            </span>
                                        </div>

                                        <h3 className="text-sm font-bold text-[#163b35]">
                                            {r.title}
                                        </h3>
                                        <p className="text-xs text-gray-600 leading-relaxed">
                                            {r.description || "No description provided."}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {isOpen ? (
                                            <button
                                                onClick={() => handleResolve(r._id)}
                                                className="px-3.5 py-1.5 rounded-lg bg-[#103d35] hover:bg-[#176b5c] text-white text-xs font-bold shadow-xs transition"
                                            >
                                                Mark Resolved
                                            </button>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-green-700 text-xs font-bold bg-green-50 px-3 py-1 rounded-full border border-green-200">
                                                <CheckCircle2 size={13} />
                                                Resolved
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Create Report Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-5">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <h3 className="text-lg font-bold text-[#163b35]">Log Incident / Issue</h3>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-gray-400 hover:text-gray-600 text-lg"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateReport} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-700">Incident Title</label>
                                <input
                                    type="text"
                                    required
                                    value={newReport.title}
                                    onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                                    placeholder="e.g. Session link dispute / payment query"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#176b5c]"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-700">Category</label>
                                <select
                                    value={newReport.category}
                                    onChange={(e) => setNewReport({ ...newReport, category: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#176b5c] bg-white"
                                >
                                    <option value="Community Guidelines">Community Guidelines</option>
                                    <option value="Payment / Refund Dispute">Payment / Refund Dispute</option>
                                    <option value="Session GMeet Issue">Session GMeet Issue</option>
                                    <option value="Content Moderation">Content Moderation</option>
                                    <option value="Security Audit">Security Audit</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-700">Priority Level</label>
                                <select
                                    value={newReport.priority}
                                    onChange={(e) => setNewReport({ ...newReport, priority: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#176b5c] bg-white"
                                >
                                    <option value="low">Low Priority</option>
                                    <option value="medium">Medium Priority</option>
                                    <option value="high">High / Urgent</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-700">Detailed Description</label>
                                <textarea
                                    rows={3}
                                    required
                                    value={newReport.description}
                                    onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                                    placeholder="Provide incident notes and actions required..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#176b5c]"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2 rounded-xl bg-[#103d35] hover:bg-[#176b5c] text-white text-xs font-bold transition disabled:opacity-50"
                                >
                                    {submitting ? "Logging..." : "Submit Report"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportsAdmin;
