import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    Calendar,
    BookOpen,
    Shield,
    UserCheck,
    UserX,
    Users,
    Activity,
    CheckCircle2,
    XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api";

const MenteeProfileAdmin = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [mentee, setMentee] = useState(null);
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const fetchMenteeData = async () => {
            try {
                setLoading(true);
                setError("");

                const res = await api.get(`/mentees/${id}`);
                const data = res.data?.data;

                if (!data) {
                    setError("Mentee not found");
                    return;
                }

                setMentee(data);

                // Fetch subscriptions
                try {
                    const subRes = await api.get(
                        `/subscriptions/my?user_id=${id}&email=${data.email}`
                    );
                    if (subRes.data?.data) {
                        setSubscriptions(subRes.data.data);
                    }
                } catch (sErr) {
                    console.error("Failed to load subscriptions:", sErr);
                }
            } catch (err) {
                console.error("Error fetching mentee profile:", err);
                setError(err.response?.data?.detail || "Unable to load mentee profile");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchMenteeData();
        }
    }, [id]);

    const handleBlockToggle = async () => {
        if (!mentee) return;
        const isBlocked = mentee.status === "blocked";
        const endpoint = isBlocked ? `/mentees/${id}/unblock` : `/mentees/${id}/block`;

        try {
            setProcessing(true);
            await api.post(endpoint);
            setMentee((prev) => ({
                ...prev,
                status: isBlocked ? "active" : "blocked",
            }));
            toast.success(
                isBlocked
                    ? "Mentee unblocked successfully"
                    : "Mentee account blocked"
            );
        } catch (err) {
            console.error("Status update error:", err);
            toast.error("Failed to update mentee status");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-green-600"></div>
                    <p className="text-gray-500 font-medium">Loading mentee profile...</p>
                </div>
            </div>
        );
    }

    if (error || !mentee) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl">
                        ⚠️
                    </div>
                    <h2 className="mt-5 text-xl font-bold text-gray-900">Mentee Not Found</h2>
                    <p className="mt-2 text-gray-500 text-sm">{error || "Could not retrieve mentee information."}</p>
                    <button
                        onClick={() => navigate("/admin/Mentees-Admin")}
                        className="mt-6 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700 cursor-pointer"
                    >
                        Return to Mentees
                    </button>
                </div>
            </div>
        );
    }

    const name =
        `${mentee.firstName || ""} ${mentee.lastName || ""}`.trim() ||
        mentee.username ||
        mentee.userName ||
        "Mentee";

    const isBlocked = mentee.status === "blocked";

    const skills = Array.isArray(mentee.skills)
        ? mentee.skills
        : typeof mentee.skills === "string"
        ? mentee.skills.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

    return (
        <div className="min-h-screen bg-gray-50 p-6 sm:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* BACK BUTTON */}
                <button
                    onClick={() => navigate("/admin/Mentees-Admin")}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-green-700 transition cursor-pointer"
                >
                    <ArrowLeft size={18} />
                    Back to Mentees Management
                </button>

                {/* PROFILE HEADER CARD */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#082f2b] via-[#103d35] to-[#16483e] p-8 text-white shadow-xl">
                    <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-20 h-20 rounded-2xl bg-white/15 border-2 border-white/30 flex items-center justify-center text-3xl font-extrabold text-white shadow-inner">
                                {name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl sm:text-3xl font-extrabold">{name}</h1>
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                                            isBlocked
                                                ? "bg-red-500/20 text-red-200 ring-1 ring-red-400"
                                                : "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400"
                                        }`}
                                    >
                                        {isBlocked ? "● Blocked Account" : "✓ Active Mentee"}
                                    </span>
                                </div>
                                <p className="text-sm text-emerald-200/80 mt-1">
                                    Member since{" "}
                                    {mentee.created_at
                                        ? new Date(mentee.created_at).toLocaleDateString("en-US", {
                                              month: "short",
                                              day: "numeric",
                                              year: "numeric",
                                          })
                                        : "Recent"}
                                </p>
                            </div>
                        </div>

                        {/* STATUS TOGGLE ACTION */}
                        <div className="flex items-center gap-3">
                            <button
                                disabled={processing}
                                onClick={handleBlockToggle}
                                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition shadow-sm flex items-center gap-2 cursor-pointer ${
                                    isBlocked
                                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                        : "bg-red-600 hover:bg-red-700 text-white"
                                }`}
                            >
                                {isBlocked ? (
                                    <>
                                        <UserCheck size={16} />
                                        Unblock Mentee
                                    </>
                                ) : (
                                    <>
                                        <UserX size={16} />
                                        Block Mentee
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* DETAILS GRID */}
                <div className="grid md:grid-cols-3 gap-6">
                    {/* LEFT COLUMN: IDENTITY & CONTACT */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
                        <h3 className="text-base font-bold text-gray-900 border-b pb-3">Contact & Identity</h3>

                        <div className="space-y-4 text-sm">
                            <div className="flex items-center gap-3 text-gray-700">
                                <Mail size={16} className="text-gray-400 flex-none" />
                                <span className="font-medium truncate">{mentee.email || "No email provided"}</span>
                            </div>

                            {mentee.phone && (
                                <div className="flex items-center gap-3 text-gray-700">
                                    <Phone size={16} className="text-gray-400 flex-none" />
                                    <span>{mentee.phone}</span>
                                </div>
                            )}

                            {mentee.location && (
                                <div className="flex items-center gap-3 text-gray-700">
                                    <MapPin size={16} className="text-gray-400 flex-none" />
                                    <span>{mentee.location}</span>
                                </div>
                            )}

                            <div className="flex items-center gap-3 text-gray-700">
                                <Calendar size={16} className="text-gray-400 flex-none" />
                                <span>
                                    ID: <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{id}</code>
                                </span>
                            </div>
                        </div>

                        {mentee.bio && (
                            <div className="border-t pt-4">
                                <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">About Mentee</h4>
                                <p className="text-sm text-gray-600 leading-relaxed">{mentee.bio}</p>
                            </div>
                        )}

                        {skills.length > 0 && (
                            <div className="border-t pt-4">
                                <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">Learning Interests</h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {skills.map((s, idx) => (
                                        <span
                                            key={idx}
                                            className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold"
                                        >
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: COMMUNITIES & MEMBERSHIPS */}
                    <div className="md:col-span-2 space-y-6">
                        {/* ENROLLED COMMUNITIES */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">Enrolled Communities</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Mentorship communities joined by this mentee
                                    </p>
                                </div>
                                <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full">
                                    {subscriptions.length} active
                                </span>
                            </div>

                            {subscriptions.length === 0 ? (
                                <div className="py-10 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <Users size={32} className="mx-auto text-gray-300 mb-2" />
                                    <p className="text-sm font-semibold text-gray-600">No community memberships yet</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        This mentee has not subscribed to any mentor community.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {subscriptions.map((sub) => (
                                        <div
                                            key={sub._id}
                                            className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                        >
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-sm text-gray-900">
                                                    {sub.community_name || "Mentorship Community"}
                                                </h4>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Mentor:{" "}
                                                    <span className="font-semibold text-gray-700">
                                                        {sub.mentor_name || "Assigned Mentor"}
                                                    </span>{" "}
                                                    · Fee: ₹{sub.amount || 599}/mo
                                                </p>
                                                <p className="text-[11px] text-gray-400 mt-0.5">
                                                    Period: {sub.start_date || "Active"} – {sub.end_date || "Present"}
                                                </p>
                                            </div>

                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-bold self-start sm:self-center ${
                                                    sub.status === "active"
                                                        ? "bg-emerald-100 text-emerald-800"
                                                        : "bg-gray-100 text-gray-600"
                                                }`}
                                            >
                                                {sub.status || "Active"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* PLATFORM SAFETY & AUDIT LOG */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
                            <h3 className="text-base font-bold text-gray-900 mb-4">Account Security & Verification</h3>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                                    <span className="text-xs text-gray-500 block">Email Verification</span>
                                    <span className="text-sm font-bold text-emerald-700 flex items-center gap-1.5 mt-1">
                                        <CheckCircle2 size={16} />
                                        Verified Member
                                    </span>
                                </div>

                                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                                    <span className="text-xs text-gray-500 block">Role & Permissions</span>
                                    <span className="text-sm font-bold text-gray-800 flex items-center gap-1.5 mt-1">
                                        <Shield size={16} className="text-[#177fc0]" />
                                        Platform Mentee
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MenteeProfileAdmin;
