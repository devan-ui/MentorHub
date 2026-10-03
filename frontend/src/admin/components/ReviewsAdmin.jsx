import React, { useState, useEffect } from "react";
import {
    Star,
    Search,
    Trash2,
    Shield,
    CheckCircle2,
    AlertTriangle,
    MessageSquare,
} from "lucide-react";
import api from "../../api.js";
import toast, { Toaster } from "react-hot-toast";

const ReviewsAdmin = () => {
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState({ total_reviews: 0, average_rating: 5.0, five_star_count: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [starFilter, setStarFilter] = useState("all");
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const res = await api.get("/admin/reviews");
            if (res.data) {
                setReviews(res.data.data || []);
                setStats(res.data.stats || { total_reviews: 0, average_rating: 5.0, five_star_count: 0 });
            }
        } catch (err) {
            console.error("Error fetching reviews:", err);
            toast.error("Failed to load reviews from MongoDB");
            setReviews([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteReview = async (id) => {
        if (!window.confirm("Are you sure you want to remove this review for platform moderation?")) {
            return;
        }

        try {
            setDeletingId(id);
            await api.delete(`/admin/reviews/${id}`);
            toast.success("Review deleted successfully from MongoDB");
            fetchReviews();
        } catch (err) {
            console.error(err);
            toast.error("Failed to remove review");
        } finally {
            setDeletingId(null);
        }
    };

    const filtered = reviews.filter((r) => {
        const matchesSearch =
            !search ||
            r.mentee_name?.toLowerCase().includes(search.toLowerCase()) ||
            r.mentor_id?.toLowerCase().includes(search.toLowerCase()) ||
            r.review_text?.toLowerCase().includes(search.toLowerCase());

        const matchesStar =
            starFilter === "all" || Math.round(r.rating || 5) === Number(starFilter);

        return matchesSearch && matchesStar;
    });

    return (
        <div className="space-y-6">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-[#163b35]">
                        Reviews & Reputation Moderation
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Oversee mentee ratings, feedback quality, and moderate inappropriate or flagged reviews.
                    </p>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#dce8df] bg-white p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 uppercase">Average Score</span>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                            <Star size={19} className="fill-amber-400" />
                        </div>
                    </div>
                    <p className="mt-3 text-2xl font-bold text-[#163b35]">
                        {stats.average_rating} / 5.0
                    </p>
                    <p className="text-[11px] text-amber-600 mt-1">Platform satisfaction index</p>
                </div>

                <div className="rounded-2xl border border-[#dce8df] bg-white p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 uppercase">Verified Reviews</span>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                            <CheckCircle2 size={19} />
                        </div>
                    </div>
                    <p className="mt-3 text-2xl font-bold text-[#163b35]">{stats.total_reviews}</p>
                    <p className="text-[11px] text-emerald-700 mt-1">From enrolled subscribers</p>
                </div>

                <div className="rounded-2xl border border-[#dce8df] bg-white p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 uppercase">5-Star Feedback</span>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                            <Shield size={19} />
                        </div>
                    </div>
                    <p className="mt-3 text-2xl font-bold text-[#163b35]">{stats.five_star_count}</p>
                    <p className="text-[11px] text-purple-600 mt-1">Highest tier rating</p>
                </div>
            </div>

            {/* Reviews List & Moderation */}
            <div className="rounded-2xl border border-[#dce8df] bg-white shadow-xs overflow-hidden">
                <div className="p-5 border-b border-[#edf2ee] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="relative max-w-sm w-full">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search review text, mentee name..."
                            className="w-full rounded-xl border border-[#dce8df] py-2 pl-9 pr-3 text-xs outline-none focus:border-[#176b5c]"
                        />
                    </div>

                    <div className="flex items-center gap-1.5 bg-[#f5f7f2] p-1 rounded-xl text-xs font-semibold">
                        <button
                            onClick={() => setStarFilter("all")}
                            className={`px-3 py-1.5 rounded-lg transition ${
                                starFilter === "all" ? "bg-white text-[#163b35] shadow-xs" : "text-gray-500 hover:text-[#163b35]"
                            }`}
                        >
                            All
                        </button>
                        {[5, 4, 3, 2, 1].map((s) => (
                            <button
                                key={s}
                                onClick={() => setStarFilter(String(s))}
                                className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition ${
                                    starFilter === String(s) ? "bg-white text-[#163b35] shadow-xs" : "text-gray-500 hover:text-[#163b35]"
                                }`}
                            >
                                <span>{s}</span>
                                <Star size={11} className="fill-amber-400 text-amber-500" />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="divide-y divide-[#edf2ee]">
                    {loading ? (
                        <div className="py-12 text-center text-gray-400 text-xs">
                            Loading verified reviews from MongoDB...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 text-xs">
                            No reviews found in MongoDB.
                        </div>
                    ) : (
                        filtered.map((r) => (
                            <div key={r._id} className="p-6 hover:bg-[#fafcf9] transition space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#103d35] text-xs font-bold text-white">
                                            {r.mentee_name ? r.mentee_name.charAt(0).toUpperCase() : "M"}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-[#163b35]">
                                                {r.mentee_name || "Mentee"}
                                            </p>
                                            <p className="text-[11px] text-gray-400">
                                                Review for Mentor ID: {r.mentor_id} · {r.created_at ? new Date(r.created_at).toLocaleDateString() : "Recent"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    size={14}
                                                    className={
                                                        star <= (r.rating || 5)
                                                            ? "fill-amber-400 text-amber-400"
                                                            : "text-gray-200"
                                                    }
                                                />
                                            ))}
                                        </div>

                                        <button
                                            disabled={deletingId === r._id}
                                            onClick={() => handleDeleteReview(r._id)}
                                            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                                            title="Delete / Moderate Review"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <p className="text-xs text-gray-700 leading-relaxed pl-13">
                                    "{r.review_text}"
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReviewsAdmin;
