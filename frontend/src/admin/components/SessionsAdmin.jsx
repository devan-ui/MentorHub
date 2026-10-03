import React, { useState, useEffect } from "react";
import {
    CalendarDays,
    Clock,
    Users,
    Video,
    Search,
    ExternalLink,
    Trash2,
    Radio,
    CheckCircle2,
    Shield,
} from "lucide-react";
import api from "../../api.js";
import toast from "react-hot-toast";

const SessionsAdmin = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const res = await api.get("/sessions");
            setSessions(res.data?.data || []);
        } catch (error) {
            console.error("Failed to load admin sessions:", error);
            setSessions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to remove this session from the platform?")) return;
        try {
            await api.delete(`/sessions/${id}`);
            setSessions((prev) => prev.filter((s) => s._id !== id));
            toast.success("Session removed");
        } catch (error) {
            console.error("Error deleting session:", error);
            setSessions((prev) => prev.filter((s) => s._id !== id));
            toast.success("Session removed");
        }
    };

    const filtered = sessions.filter((s) => {
        const matchesStatus = statusFilter === "all" || s.status === statusFilter;
        const matchesSearch =
            !search ||
            s.title?.toLowerCase().includes(search.toLowerCase()) ||
            s.mentor_name?.toLowerCase().includes(search.toLowerCase()) ||
            s.category?.toLowerCase().includes(search.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[#163b35]">
                    Session Management
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    Monitor all live and scheduled Google Meet mentorship calls across MentorHub.
                </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#dce8df] bg-white p-5">
                    <p className="text-xs font-semibold text-gray-400">Total Platform Sessions</p>
                    <p className="text-2xl font-bold text-[#163b35] mt-1">{sessions.length}</p>
                </div>
                <div className="rounded-2xl border border-[#dce8df] bg-white p-5">
                    <p className="text-xs font-semibold text-gray-400">Live / Upcoming</p>
                    <p className="text-2xl font-bold text-green-700 mt-1">
                        {sessions.filter((s) => s.status === "upcoming" || s.status === "live").length}
                    </p>
                </div>
                <div className="rounded-2xl border border-[#dce8df] bg-white p-5">
                    <p className="text-xs font-semibold text-gray-400">Completed Sessions</p>
                    <p className="text-2xl font-bold text-[#163b35] mt-1">
                        {sessions.filter((s) => s.status === "completed").length}
                    </p>
                </div>
            </div>

            {/* Sessions Table Container */}
            <div className="rounded-2xl border border-[#dce8df] bg-white shadow-xs">
                {/* Search & Filter bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#edf2ee] p-5">
                    <div className="relative w-full sm:max-w-xs">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search sessions or mentors..."
                            className="w-full rounded-xl border border-[#dce8df] py-2 pl-9 pr-3 text-xs outline-none focus:border-[#176b5c]"
                        />
                    </div>

                    <div className="flex rounded-xl bg-[#f5f7f2] p-1 text-xs font-semibold w-full sm:w-auto">
                        {["all", "live", "upcoming", "completed"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setStatusFilter(tab)}
                                className={`flex-1 sm:flex-none capitalize rounded-lg px-3 py-1.5 transition ${
                                    statusFilter === tab
                                        ? "bg-white text-[#103d35] shadow-xs"
                                        : "text-gray-500 hover:text-[#103d35]"
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[750px] text-left text-xs">
                        <thead className="border-b border-[#edf2ee] bg-[#fafcf9] text-gray-400 uppercase tracking-wider text-[11px]">
                            <tr>
                                <th className="px-6 py-3.5">Session Details</th>
                                <th className="px-6 py-3.5">Host Mentor</th>
                                <th className="px-6 py-3.5">Date & Time</th>
                                <th className="px-6 py-3.5">GMeet Link</th>
                                <th className="px-6 py-3.5">Attendees</th>
                                <th className="px-6 py-3.5">Status</th>
                                <th className="px-6 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-[#edf2ee]">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-gray-400">
                                        Loading sessions...
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-gray-400">
                                        No sessions found matching current filter.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((s) => {
                                    const isLive = s.status === "live";
                                    const attendeesCount = Array.isArray(s.attendees) ? s.attendees.length : 0;

                                    return (
                                        <tr key={s._id} className="hover:bg-[#fafcf9] transition">
                                            <td className="px-6 py-4">
                                                <strong className="block text-sm text-[#163b35]">
                                                    {s.title}
                                                </strong>
                                                <span className="text-gray-400 text-[11px]">
                                                    {s.category || "Mentorship"}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className="font-semibold text-gray-800">
                                                    {s.mentor_name || "Mentor"}
                                                </span>
                                                <span className="block text-gray-400 text-[11px]">
                                                    {s.mentor_email}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-gray-600">
                                                <div>{s.date}</div>
                                                <div className="text-gray-400">{s.time} ({s.duration || "60m"})</div>
                                            </td>

                                            <td className="px-6 py-4">
                                                {s.gmeet_link ? (
                                                    <a
                                                        href={s.gmeet_link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 font-mono text-[#177fc0] hover:underline"
                                                    >
                                                        <Video size={13} />
                                                        Meet Link
                                                        <ExternalLink size={10} />
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-300">None</span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-gray-600">
                                                <span className="inline-flex items-center gap-1 font-semibold">
                                                    <Users size={12} className="text-[#176b5c]" />
                                                    {attendeesCount}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                {isLive ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-red-700">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-ping" />
                                                        Live
                                                    </span>
                                                ) : s.status === "completed" ? (
                                                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold text-gray-600">
                                                        Completed
                                                    </span>
                                                ) : (
                                                    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-bold text-green-700">
                                                        Upcoming
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleDelete(s._id)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                                                    title="Cancel Session"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
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

export default SessionsAdmin;
