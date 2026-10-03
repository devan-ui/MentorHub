import React, { useState, useEffect } from "react";
import { Star, MessageCircle } from "lucide-react";
import api from "../api.js";

const Reviews = () => {
    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(5.0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [loading, setLoading] = useState(true);

    const mentorId = localStorage.getItem("mentorId");

    useEffect(() => {
        const fetchReviews = async () => {
            if (!mentorId) return;
            try {
                setLoading(true);
                const res = await api.get(`/mentor/${mentorId}/reviews`);
                if (res.data?.data) {
                    setAverageRating(res.data.data.average_rating || 5.0);
                    setTotalReviews(res.data.data.total_reviews || 0);
                    setReviews(res.data.data.reviews || []);
                }
            } catch (err) {
                console.error("Error fetching mentor reviews:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, [mentorId]);

    const countByRating = (star) =>
        reviews.filter((r) => Math.round(r.rating || 5) === star).length;

    const percentByRating = (star) =>
        reviews.length > 0 ? Math.round((countByRating(star) / reviews.length) * 100) : 0;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[#163b35]">
                    Mentee Reviews & Feedback
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    See what your community mentees say about your mentorship sessions.
                </p>
            </div>

            {/* Rating Summary */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-[#dce8df] bg-white p-6 text-center shadow-sm flex flex-col items-center justify-center">
                    <p className="text-4xl font-extrabold text-[#163b35]">
                        {averageRating}
                    </p>

                    <div className="mt-2 flex justify-center gap-1 text-yellow-500">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                                key={s}
                                fill="currentColor"
                                size={18}
                                className={s <= Math.round(averageRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                            />
                        ))}
                    </div>

                    <p className="mt-2 text-xs text-gray-400">
                        Based on {totalReviews || reviews.length} verified reviews
                    </p>
                </div>

                <div className="rounded-2xl border border-[#dce8df] bg-white p-6 md:col-span-2 shadow-sm space-y-2">
                    {[5, 4, 3, 2, 1].map((s) => (
                        <RatingBar
                            key={s}
                            label={`${s} Star${s > 1 ? "s" : ""}`}
                            value={countByRating(s)}
                            width={`${percentByRating(s)}%`}
                        />
                    ))}
                </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="p-10 text-center text-gray-400 text-sm">
                        Loading reviews...
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="p-10 text-center text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
                        No reviews submitted yet.
                    </div>
                ) : (
                    reviews.map((review, idx) => {
                        const name = review.mentee_name || review.name || "Mentee";
                        const initials = name
                            .split(" ")
                            .map((w) => w[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase();

                        return (
                            <div
                                key={review._id || idx}
                                className="rounded-2xl border border-[#dce8df] bg-white p-6 shadow-sm hover:shadow-md transition"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#103d35] text-xs font-bold text-white">
                                        {initials}
                                    </div>

                                    <div className="flex-1 space-y-1.5">
                                        <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                                            <div>
                                                <p className="font-semibold text-[#163b35]">
                                                    {name}
                                                </p>
                                                <div className="flex gap-1 text-yellow-500 pt-0.5">
                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                        <Star
                                                            key={s}
                                                            size={13}
                                                            className={s <= (review.rating || 5) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            <span className="text-xs text-gray-400">
                                                {review.created_at ? new Date(review.created_at).toLocaleDateString() : "Recent"}
                                            </span>
                                        </div>

                                        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                                            "{review.review_text || review.text}"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

const RatingBar = ({ label, value, width }) => {
    return (
        <div className="flex items-center gap-4 text-xs">
            <span className="w-16 font-medium text-gray-500">{label}</span>
            <div className="h-2 flex-1 rounded-full bg-[#edf2ee] overflow-hidden">
                <div
                    className="h-full rounded-full bg-yellow-400 transition-all duration-500"
                    style={{ width }}
                />
            </div>
            <span className="w-8 text-right text-gray-400 font-semibold">{value}</span>
        </div>
    );
};

export default Reviews;
