
import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import {
    Star, Users, MessageSquare, Plus, Check, Sparkles, BookOpen, Shield,
    MessageCircle, Video, Lock, Clock, Calendar, AlertCircle, CheckCircle2,
    Ticket, ExternalLink, ArrowRight, UserCheck, CreditCard, X, Send
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import api from "../api.js";

// Real-time Countdown Timer ensuring sessions start strictly on time
const SessionCountdown = ({ date, time, status }) => {
    const [timeLeft, setTimeLeft] = useState("");
    const [isStartingSoon, setIsStartingSoon] = useState(false);

    useEffect(() => {
        const updateCountdown = () => {
            if (status === "live") {
                setTimeLeft("Live Now");
                setIsStartingSoon(true);
                return;
            }

            const now = new Date();
            let targetDate = new Date();

            const timeStr = String(time || "7:00 PM").trim();
            const [rawTime, modifier] = timeStr.split(" ");
            if (rawTime) {
                let [hours, minutes] = rawTime.split(":").map(Number);
                if (modifier?.toUpperCase() === "PM" && hours < 12) hours += 12;
                if (modifier?.toUpperCase() === "AM" && hours === 12) hours = 0;
                targetDate.setHours(hours, minutes || 0, 0, 0);
            }

            const dateStr = String(date || "").toLowerCase();
            if (dateStr.includes("tomorrow")) {
                targetDate.setDate(targetDate.getDate() + 1);
            } else if (dateStr && !dateStr.includes("today")) {
                const parsed = new Date(date);
                if (!isNaN(parsed.getTime())) {
                    targetDate.setFullYear(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
                }
            }

            const diff = targetDate.getTime() - now.getTime();
            if (diff <= 0) {
                setTimeLeft("Starts Now");
                setIsStartingSoon(true);
            } else {
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const secs = Math.floor((diff % (1000 * 60)) / 1000);
                setIsStartingSoon(hours === 0 && mins <= 30);
                if (hours > 24) {
                    const days = Math.floor(hours / 24);
                    setTimeLeft(`Starts in ${days}d ${hours % 24}h`);
                } else {
                    setTimeLeft(`Starts in ${String(hours).padStart(2, "0")}h ${String(mins).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`);
                }
            }
        };

        updateCountdown();
        const timer = setInterval(updateCountdown, 1000);
        return () => clearInterval(timer);
    }, [date, time, status]);

    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
            status === "live"
                ? "bg-red-100 text-red-700 animate-pulse"
                : isStartingSoon
                ? "bg-amber-100 text-amber-900 border border-amber-200"
                : "bg-sky-50 text-sky-800 border border-sky-200"
        }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status === "live" ? "bg-red-600" : isStartingSoon ? "bg-amber-500" : "bg-sky-500"} animate-ping`} />
            {timeLeft} (Starts On Time)
        </span>
    );
};

const MentorProfile = () => {
    const { id: paramId } = useParams();
    const [searchParams] = useSearchParams();
    const id = paramId || searchParams.get("mentor_id") || searchParams.get("id");
    const navigate = useNavigate();

    const [mentor, setMentor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedPlan, setSelectedPlan] = useState("standard");
    const [isSaved, setIsSaved] = useState(false);
    const [showFullBio, setShowFullBio] = useState(false);
    const [mentorSessions, setMentorSessions] = useState([]);
    const [mentorCommunities, setMentorCommunities] = useState([]);
    const [reviewsData, setReviewsData] = useState({ reviews: [], average_rating: 5.0, total_reviews: 0 });

    // Community Membership & Join State
    const [isCommunityMember, setIsCommunityMember] = useState(false);
    const [isCommunityRequested, setIsCommunityRequested] = useState(false);
    const [joiningCommunity, setJoiningCommunity] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);

    // Session Ticket Payment Modal State
    const [selectedSession, setSelectedSession] = useState(null);
    const [showSessionPayModal, setShowSessionPayModal] = useState(false);
    const [sessionPaymentMethod, setSessionPaymentMethod] = useState("UPI / Google Pay / PhonePe");
    const [payingSession, setPayingSession] = useState(false);

    const userId = localStorage.getItem("userId") || localStorage.getItem("userEmail") || "";
    const userEmail = localStorage.getItem("userEmail") || "";
    const userName = localStorage.getItem("userName") || "Mentee";
    const userToken = localStorage.getItem("userToken");

    // Review Modal State
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewText, setReviewText] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);

    /* =========================================================
       FETCH MENTOR
    ========================================================= */

    useEffect(() => {
        const fetchMentor = async () => {
            try {
                setLoading(true);
                setError("");

                console.log("Mentor profile ID:", id);

                if (!id) {
                    setError("Mentor ID is missing.");
                    return;
                }

                const response = await api.get("/accepted-mentors");

                console.log("API RESPONSE:", response.data);

                const mentorList = Array.isArray(response.data?.data)
                    ? response.data.data
                    : [];

                console.log("MENTOR LIST:", mentorList);

                const foundMentor = mentorList.find(
                    (item) => String(item?._id) === String(id)
                );

                console.log("FOUND MENTOR:", foundMentor);

                if (!foundMentor) {
                    setError("Mentor not found.");
                    return;
                }

                setMentor(foundMentor);

                // Fetch community for this mentor (check /mentor/${id}/community first, fallback to /communities?mentor_id=${id})
                let primaryComm = null;
                try {
                    const cRes = await api.get(`/mentor/${id}/community`);
                    if (cRes.data?.data) {
                        primaryComm = cRes.data.data;
                        setMentorCommunities([cRes.data.data]);
                    }
                } catch (cErr) {
                    console.log("No community at /mentor/id/community, checking /communities...");
                }

                if (!primaryComm) {
                    try {
                        const commRes = await api.get(`/communities?mentor_id=${id}`);
                        if (commRes.data?.data && commRes.data.data.length > 0) {
                            primaryComm = commRes.data.data[0];
                            setMentorCommunities(commRes.data.data);
                        }
                    } catch (cErr2) {
                        console.error("Failed to load mentor communities:", cErr2);
                    }
                }

                // Check if current user is an active member or has requested this mentor's community
                const curUserId = localStorage.getItem("userId") || localStorage.getItem("userEmail") || "";
                const curUserEmail = localStorage.getItem("userEmail") || "";
                if (curUserId || curUserEmail) {
                    try {
                        const subRes = await api.get(`/subscriptions/my?user_id=${curUserId}&email=${curUserEmail}`);
                        const userSubs = subRes.data?.data || [];
                        const isSubbed = userSubs.some((s) =>
                            s.status === "active" && (
                                (primaryComm && String(s.community_id) === String(primaryComm._id)) ||
                                String(s.mentor_id) === String(id)
                            )
                        );
                        setIsCommunityMember(isSubbed);

                        const isPending = userSubs.some((s) =>
                            s.status === "pending" && (
                                (primaryComm && String(s.community_id) === String(primaryComm._id)) ||
                                String(s.mentor_id) === String(id)
                            )
                        );
                        setIsCommunityRequested(isPending);
                    } catch (subErr) {
                        console.error("Failed to check active subscriptions:", subErr);
                    }
                }

                // Fetch sessions for this mentor with user credentials so paid statuses and Meet links are resolved
                try {
                    const sessRes = await api.get(`/sessions?mentor_id=${id}&user_id=${curUserId}&user_email=${curUserEmail}`);
                    if (sessRes.data?.data) {
                        setMentorSessions(sessRes.data.data);
                    }
                } catch (sErr) {
                    console.error("Failed to load mentor sessions:", sErr);
                }

                // Fetch reviews for this mentor
                try {
                    const revRes = await api.get(`/reviews/mentor/${id}`);
                    if (revRes.data?.data) {
                        setReviewsData(revRes.data.data);
                    }
                } catch (rErr) {
                    console.error("Failed to load mentor reviews:", rErr);
                }
            } catch (err) {
                console.error("MENTOR PROFILE ERROR:", err);
                setError(
                    err?.response?.data?.message ||
                    "Unable to load mentor information."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchMentor();
    }, [id]);

    /* =========================================================
       JOIN HIS COMMUNITY HANDLER (REQUEST BASED)
    ========================================================= */
    const handleJoinCommunity = async (commId) => {
        if (!userToken) {
            toast.error("Please login as a mentee to join this community");
            navigate("/login");
            return;
        }

        const targetComm = mentorCommunities.find((c) => c._id === commId) || mentorCommunities[0];
        const currentMembers = targetComm?.current_members || 0;
        const capacity = targetComm?.capacity || 20;

        if (currentMembers >= capacity) {
            toast.error("This community has reached its capacity limit!");
            return;
        }

        try {
            setJoiningCommunity(true);
            const targetId = commId || targetComm?._id;
            if (!targetId) {
                toast.error("Community ID not found");
                return;
            }

            const joinPayload = {
                community_id: targetId,
                mentee_id: userId,
                mentee_name: userName,
                mentee_email: userEmail,
                payment_method: "Direct Member Join",
                amount: 0,
            };

            const res = await api.post(`/communities/${targetId}/join`, joinPayload);
            toast.success(res.data?.message || "Join request submitted! Pending mentor approval.");
            setIsCommunityRequested(true);
            setShowJoinModal(false);
        } catch (err) {
            console.error("Error joining community:", err);
            toast.error(err.response?.data?.detail || "Failed to submit join request");
        } finally {
            setJoiningCommunity(false);
        }
    };

    /* =========================================================
       PAY FOR LIVE SESSION TICKET HANDLER
    ========================================================= */
    const handlePayForSession = async () => {
        if (!selectedSession) return;
        if (!userToken) {
            toast.error("Please log in as a mentee to purchase session tickets");
            navigate("/login");
            return;
        }

        try {
            setPayingSession(true);
            const ticketPrice = selectedSession.price ?? 199;

            const res = await api.post(`/sessions/${selectedSession._id}/pay`, {
                mentee_id: userId,
                mentee_name: userName,
                mentee_email: userEmail,
                amount: ticketPrice,
                payment_method: sessionPaymentMethod,
            });

            toast.success(`Ticket confirmed for "${selectedSession.title}"! Starts on time on Google Meet.`);
            setShowSessionPayModal(false);

            // Optimistically update local session
            setMentorSessions((prev) =>
                prev.map((s) => {
                    if (s._id === selectedSession._id) {
                        return {
                            ...s,
                            is_paid: true,
                            meet_link: res.data?.data?.meet_link || s.meet_link,
                            gmeet_link: res.data?.data?.meet_link || s.meet_link || s.gmeet_link,
                        };
                    }
                    return s;
                })
            );

            // Re-fetch all sessions to sync
            const sessRes = await api.get(`/sessions?mentor_id=${id}&user_id=${userId}&user_email=${userEmail}`);
            if (sessRes.data?.data) {
                setMentorSessions(sessRes.data.data);
            }
        } catch (err) {
            console.error("Error paying for session:", err);
            toast.error(err.response?.data?.detail || "Session ticket payment failed. Please try again.");
        } finally {
            setPayingSession(false);
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        const menteeToken = localStorage.getItem("userToken");
        const menteeId = localStorage.getItem("userId") || localStorage.getItem("userEmail");
        const menteeName = localStorage.getItem("userName") || "Mentee";

        if (!menteeToken) {
            toast.error("Please log in as a mentee to submit a review");
            navigate("/login");
            return;
        }

        if (!reviewText.trim()) {
            toast.error("Please enter your review feedback");
            return;
        }

        try {
            setSubmittingReview(true);
            await api.post("/reviews", {
                mentor_id: id,
                mentee_id: menteeId,
                mentee_name: menteeName,
                rating: Number(reviewRating),
                review_text: reviewText.trim(),
            });
            toast.success("Thank you! Your verified review has been submitted.");
            setShowReviewModal(false);
            setReviewText("");
            // Refresh reviews
            const revRes = await api.get(`/reviews/mentor/${id}`);
            if (revRes.data?.data) {
                setReviewsData(revRes.data.data);
            }
        } catch (err) {
            console.error("Error submitting review:", err);
            toast.error(err.response?.data?.detail || "Failed to submit review");
        } finally {
            setSubmittingReview(false);
        }
    };

    /* =========================================================
       HELPERS
    ========================================================= */

    const getArrayValues = (value) => {
        if (Array.isArray(value)) {
            return value
                .flat()
                .map((item) => String(item).trim())
                .filter(Boolean);
        }

        if (typeof value === "string") {
            return value
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean);
        }

        return [];
    };

    const getMentorName = () => {
        if (!mentor) return "Mentor";

        const fullName = [
            mentor.firstName,
            mentor.lastName,
        ]
            .filter(Boolean)
            .join(" ")
            .trim();

        return fullName || "Mentor";
    };

    const getInitials = () => {
        const name = getMentorName();

        return name
            .split(" ")
            .filter(Boolean)
            .map((word) => word[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
    };

    /* =========================================================
       PROFILE IMAGE
    ========================================================= */

    const getProfileImage = () => {
        const image = mentor?.profilePic;

        if (!image) {
            return null;
        }

        /*
         * Complete image URL
         */
        if (typeof image === "string") {
            if (
                image.startsWith("http://") ||
                image.startsWith("https://") ||
                image.startsWith("data:image/")
            ) {
                return image;
            }

            /*
             * Base64 string
             */
            return `data:${
                mentor?.profilePicType || "image/png"
            };base64,${image}`;
        }

        /*
         * MongoDB Buffer:
         * { type: "Buffer", data: [...] }
         */
        if (
            typeof image === "object" &&
            Array.isArray(image.data)
        ) {
            try {
                const bytes = new Uint8Array(image.data);

                let binary = "";

                bytes.forEach((byte) => {
                    binary += String.fromCharCode(byte);
                });

                const base64 = btoa(binary);

                return `data:${
                    mentor?.profilePicType || "image/png"
                };base64,${base64}`;
            } catch (err) {
                console.error(
                    "Unable to convert profile image:",
                    err
                );

                return null;
            }
        }

        return null;
    };

    /* =========================================================
       DATABASE VALUES
    ========================================================= */

    const mentorName = getMentorName();

    const skills = getArrayValues(mentor?.skills);

    const categories = getArrayValues(mentor?.category);

    const location = mentor?.location || "";

    const jobTitle = mentor?.jobTitle || "Mentor";

    const company = mentor?.company || "";

    const bio =
        mentor?.bio ||
        "This mentor has not added a biography yet.";

    const whyMentor = mentor?.whyMentor || "";

    const achievement = mentor?.achievement || "";

    const linkedin = mentor?.linkedin || "";

    const website = mentor?.website || "";

    /* =========================================================
       PRICE
       KEEPING YOUR ORIGINAL APPLY AREA
    ========================================================= */

    const baseRate =
        Number(
            mentor?.hourlyRate ??
            mentor?.rate ??
            mentor?.price ??
            mentor?.sessionPrice ??
            0
        ) || 0;

    const planDetails = {
        lite: {
            price:
                baseRate > 0
                    ? Math.round(baseRate * 0.65)
                    : 0,
            calls: "2 × 30-min calls/month",
        },

        standard: {
            price: baseRate,
            calls: "4 × 45-min calls/month",
        },

        pro: {
            price:
                baseRate > 0
                    ? Math.round(baseRate * 1.45)
                    : 0,
            calls: "8 × 45-min calls/month",
        },
    };

    /* =========================================================
       APPLY
       UNCHANGED
    ========================================================= */

    const handleApply = (oneOff = false) => {
        if (!mentor?._id) {
            console.error("Mentor ID missing");
            return;
        }

        navigate(
            `/apply-mentorship/${mentor._id}`,
            {
                state: {
                    mentor,
                    selectedPlan,
                    oneOff,
                },
            }
        );
    };

    /* =========================================================
       LOADING
    ========================================================= */

    if (loading) {
        return (
            <div className="min-h-screen bg-[#fbfaf6] flex items-center justify-center">

                <div className="text-center">

                    <div className="w-12 h-12 border-4 border-[#d8e3dc] border-t-[#177fc0] rounded-full animate-spin mx-auto" />

                    <p className="mt-5 text-[#39534e] font-semibold">
                        Loading mentor profile...
                    </p>

                </div>

            </div>
        );
    }

    /* =========================================================
       ERROR
    ========================================================= */

    if (error || !mentor) {
        return (
            <div className="min-h-screen bg-[#fbfaf6] text-[#123b38]">

                <header className="border-b border-[#123b38]/10 bg-[#fbfaf6]">

                    <div className="w-[92%] max-w-[1180px] mx-auto h-[76px] flex items-center justify-between">

                        <button
                            onClick={() => navigate("/home")}
                            className="flex items-center gap-3"
                        >
                            <div className="w-10 h-10 rounded-xl bg-[#082f2b] text-white flex items-center justify-center text-xl font-bold">
                                M
                            </div>

                            <span className="text-[23px] font-extrabold">
                                MentorHub
                            </span>
                        </button>

                        <button
                            onClick={() => navigate("/mentors")}
                            className="px-5 py-2.5 rounded-full bg-[#177fc0] text-white text-sm font-bold"
                        >
                            ← All Mentors
                        </button>

                    </div>

                </header>

                <main className="w-[92%] max-w-[900px] mx-auto py-24">

                    <div className="bg-white border border-[#d8e3dc] rounded-3xl p-12 text-center">

                        <div className="text-5xl mb-5">
                            ⚠️
                        </div>

                        <h1 className="text-2xl font-bold">
                            Unable to load mentor
                        </h1>

                        <p className="mt-3 text-[#65746f]">
                            {error || "Mentor not found."}
                        </p>

                        <p className="mt-2 text-xs text-[#9aa7a2] break-all">
                            ID: {id}
                        </p>

                        <button
                            onClick={() => navigate("/mentors")}
                            className="mt-7 px-7 py-3 rounded-full bg-[#177fc0] text-white font-bold hover:bg-[#126da6]"
                        >
                            ← Back to Mentors
                        </button>

                    </div>

                </main>

            </div>
        );
    }

    const profileImage = getProfileImage();

    /* =========================================================
       MAIN PAGE
    ========================================================= */

    return (
        <div className="min-h-screen bg-[#fbfaf6] text-[#123b38]">

            {/* =====================================================
                NAVBAR
            ===================================================== */}

            <header className="sticky top-0 z-50 border-b border-[#123b38]/10 bg-[#fbfaf6]/95 backdrop-blur-xl">

                <div className="w-[92%] max-w-[1180px] mx-auto h-[76px] flex items-center justify-between">

                    <button
                        onClick={() => navigate("/home")}
                        className="flex items-center gap-3"
                    >

                        <div className="w-10 h-10 rounded-xl bg-[#082f2b] text-white flex items-center justify-center text-xl font-bold -rotate-3">
                            M
                        </div>

                        <span className="text-[23px] font-extrabold tracking-tight">
                            MentorHub
                        </span>

                    </button>

                    <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#39534e]">

                        <button
                            onClick={() => navigate("/home")}
                            className="hover:text-[#177fc0]"
                        >
                            Home
                        </button>

                        <button
                            onClick={() => navigate("/mentors")}
                            className="text-[#177fc0]"
                        >
                            Find Mentors
                        </button>

                        <button
                            onClick={() => navigate("/mentor")}
                            className="hover:text-[#177fc0]"
                        >
                            Become a Mentor
                        </button>

                    </nav>

                    <button
                        onClick={() => navigate("/mentors")}
                        className="px-5 py-2.5 rounded-full bg-[#177fc0] text-white text-sm font-bold hover:bg-[#126da6] transition"
                    >
                        ← All Mentors
                    </button>

                </div>

            </header>

            {/* =====================================================
                HERO
            ===================================================== */}

            <section className="bg-[#e6f2eb] border-b border-[#d8e3dc]">

                <div className="w-[92%] max-w-[1180px] mx-auto py-10">

                    {/* Breadcrumb */}

                    <div className="flex items-center gap-2 text-xs font-semibold text-[#65746f] mb-7">

                        <button
                            onClick={() => navigate("/home")}
                            className="hover:text-[#123b38]"
                        >
                            Home
                        </button>

                        <span>›</span>

                        <button
                            onClick={() => navigate("/mentors")}
                            className="hover:text-[#123b38]"
                        >
                            Find a Mentor
                        </button>

                        <span>›</span>

                        <span className="text-[#123b38]">
                            {mentorName}
                        </span>

                    </div>

                    <div className="flex flex-col md:flex-row gap-8 items-start">

                        {/* IMAGE */}

                        <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-3xl overflow-hidden bg-white border-2 border-[#bdd8ca] shadow-sm flex items-center justify-center flex-shrink-0">

                            {profileImage ? (
                                <img
                                    src={profileImage}
                                    alt={mentorName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.style.display =
                                            "none";
                                    }}
                                />
                            ) : (
                                <span className="text-5xl font-bold text-[#177fc0]">
                                    {getInitials()}
                                </span>
                            )}

                        </div>

                        {/* INFO */}

                        <div className="flex-1">

                            <div className="flex flex-wrap gap-2 mb-3">

                                {mentor.accepted === "true" && (
                                    <span className="px-3 py-1 rounded-full bg-white border border-[#bdd8ca] text-xs font-bold text-[#217153]">
                                        ✓ Verified Mentor
                                    </span>
                                )}

                                <span className="px-3 py-1 rounded-full bg-[#123b38]/10 text-xs font-bold">
                                    🎓 Mentor
                                </span>

                            </div>

                            <h1 className="font-serif text-4xl sm:text-5xl font-normal">
                                {mentorName}
                            </h1>

                            <p className="mt-2 text-lg text-[#39534e] font-medium">

                                {jobTitle}

                                {company && (
                                    <>
                                        {" "}@{" "}
                                        <strong>
                                            {company}
                                        </strong>
                                    </>
                                )}

                            </p>

                            {location && (
                                <p className="mt-2 text-sm text-[#65746f]">
                                    📍 {location}
                                </p>
                            )}

                            <div className="flex gap-3 mt-5">

                                <button
                                    onClick={() =>
                                        setIsSaved(!isSaved)
                                    }
                                    className={`px-5 py-2 rounded-full text-sm font-bold border ${
                                        isSaved
                                            ? "bg-[#082f2b] text-white"
                                            : "bg-white border-[#cbdad3]"
                                    }`}
                                >
                                    {isSaved
                                        ? "♥ Saved"
                                        : "♡ Save"}
                                </button>
                            </div>

                        </div>

                    </div>

                </div>

            </section>

            {/* =====================================================
                CONTENT
            ===================================================== */}

            <main className="w-[92%] max-w-[1180px] mx-auto py-10">

                <div className="grid lg:grid-cols-[1fr_360px] gap-10 items-start">

                    {/* =================================================
                        LEFT CONTENT
                    ================================================= */}

                    <div className="space-y-8">

                        {/* CATEGORY */}

                        {categories.length > 0 && (
                            <section className="bg-white border border-[#d8e3dc] rounded-3xl p-7">

                                <h2 className="font-serif text-2xl mb-5">
                                    Categories
                                </h2>

                                <div className="flex flex-wrap gap-2">

                                    {categories.map(
                                        (category, index) => (
                                            <span
                                                key={`${category}-${index}`}
                                                className="px-4 py-2 rounded-full bg-[#e6f2eb] border border-[#bdd8ca] text-xs font-bold text-[#217153]"
                                            >
                                                {category}
                                            </span>
                                        )
                                    )}

                                </div>

                            </section>
                        )}

                        {/* SKILLS */}

                        <section className="bg-white border border-[#d8e3dc] rounded-3xl p-7">

                            <h2 className="font-serif text-2xl mb-5">
                                Skills
                            </h2>

                            {skills.length > 0 ? (
                                <div className="flex flex-wrap gap-2">

                                    {skills.map(
                                        (skill, index) => (
                                            <span
                                                key={`${skill}-${index}`}
                                                className="px-4 py-2 rounded-full bg-[#f7f1e5] border border-[#eadfca] text-xs font-bold text-[#6b4a32]"
                                            >
                                                {skill}
                                            </span>
                                        )
                                    )}

                                </div>
                            ) : (
                                <p className="text-sm text-[#65746f]">
                                    No skills listed.
                                </p>
                            )}

                        </section>

                        {/* ABOUT */}

                        <section className="bg-white border border-[#d8e3dc] rounded-3xl p-7">

                            <h2 className="font-serif text-2xl mb-4">
                                About {mentorName}
                            </h2>

                            <div
                                className={`text-sm sm:text-base text-[#44625b] leading-7 ${
                                    showFullBio
                                        ? ""
                                        : "line-clamp-5"
                                }`}
                            >
                                {bio}
                            </div>

                            {bio.length > 250 && (
                                <button
                                    onClick={() =>
                                        setShowFullBio(
                                            !showFullBio
                                        )
                                    }
                                    className="mt-4 text-sm font-bold text-[#177fc0]"
                                >
                                    {showFullBio
                                        ? "Read less"
                                        : "Read more"}
                                </button>
                            )}

                        </section>

                        {/* WHY I MENTOR */}

                        {whyMentor && (
                            <section className="bg-white border border-[#d8e3dc] rounded-3xl p-7">

                                <h2 className="font-serif text-2xl mb-4">
                                    Why I Mentor
                                </h2>

                                <p className="text-sm sm:text-base text-[#44625b] leading-7 whitespace-pre-line">
                                    {whyMentor}
                                </p>

                            </section>
                        )}

                        {/* ACHIEVEMENT */}

                        {achievement && (
                            <section className="bg-white border border-[#d8e3dc] rounded-3xl p-7">

                                <h2 className="font-serif text-2xl mb-4">
                                    Achievements
                                </h2>

                                <p className="text-sm sm:text-base text-[#44625b] leading-7 whitespace-pre-line">
                                    {achievement}
                                </p>

                            </section>
                        )}

                        {/* PROFESSIONAL LINKS */}

                        {(linkedin || website) && (
                            <section className="bg-white border border-[#d8e3dc] rounded-3xl p-7">

                                <h2 className="font-serif text-2xl mb-5">
                                    Professional Links
                                </h2>

                                <div className="space-y-3">

                                    {linkedin && (
                                        <a
                                            href={
                                                linkedin.startsWith(
                                                    "http"
                                                )
                                                    ? linkedin
                                                    : `https://${linkedin}`
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between p-4 rounded-2xl bg-[#f6f9f7] hover:bg-[#eaf2ed] transition"
                                        >
                                            <span className="font-semibold text-sm">
                                                LinkedIn
                                            </span>

                                            <span className="text-[#177fc0] text-sm">
                                                Visit ↗
                                            </span>
                                        </a>
                                    )}

                                    {website && (
                                        <a
                                            href={
                                                website.startsWith(
                                                    "http"
                                                )
                                                    ? website
                                                    : `https://${website}`
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between p-4 rounded-2xl bg-[#f6f9f7] hover:bg-[#eaf2ed] transition"
                                        >
                                            <span className="font-semibold text-sm">
                                                Website
                                            </span>

                                            <span className="text-[#177fc0] text-sm">
                                                Visit ↗
                                            </span>
                                        </a>
                                    )}

                                </div>

                            </section>
                        )}

                        {/* =================================================
                            UPCOMING LIVE SESSIONS (COMMUNITY & PAYMENT GATED)
                        ================================================= */}
                        <section className="bg-white border border-[#d8e3dc] rounded-3xl p-7 shadow-xs">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="font-serif text-2xl text-[#123b38]">
                                            Upcoming Live Sessions
                                        </h2>
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                            Starts On Time
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Live Google Meet workshops & masterclasses hosted by {mentorName}. Each session requires community membership and session ticket payment.
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate("/sessions")}
                                    className="text-xs font-bold text-[#177fc0] hover:underline whitespace-nowrap self-start sm:self-center"
                                >
                                    View All Sessions →
                                </button>
                            </div>

                            {!isCommunityMember ? (
                                /* Locked state for non-members */
                                <div className="p-8 rounded-2xl border-2 border-dashed border-[#edd9be] bg-[#fbf8f2] text-center space-y-4">
                                    <div className="w-14 h-14 rounded-2xl bg-[#f0e4cf] flex items-center justify-center mx-auto text-[#082f2b]">
                                        <Lock className="w-6 h-6" />
                                    </div>
                                    <div className="max-w-md mx-auto">
                                        <h3 className="font-bold text-base text-[#082f2b]">
                                            Live Sessions Protected for Community Members
                                        </h3>
                                        <p className="text-xs text-[#65746f] mt-1.5 leading-relaxed">
                                            Join {mentorName}'s community to unlock live session schedules, view ticket prices, and reserve your seat.
                                        </p>
                                    </div>
                                    {isCommunityRequested ? (
                                        <button
                                            disabled
                                            className="px-6 py-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold transition shadow-xs inline-flex items-center gap-2 cursor-default"
                                        >
                                            <Clock className="w-4 h-4 text-amber-600" />
                                            Requested (Pending Mentor Approval)
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                const comm = mentorCommunities[0];
                                                handleJoinCommunity(comm?._id);
                                            }}
                                            disabled={joiningCommunity}
                                            className="px-6 py-3 rounded-xl bg-[#082f2b] hover:bg-[#103d35] text-white text-xs font-bold transition shadow-sm inline-flex items-center gap-2 cursor-pointer"
                                        >
                                            <Users className="w-4 h-4" />
                                            {joiningCommunity ? "Submitting Request..." : "Join His Community to Unlock Sessions"}
                                        </button>
                                    )}
                                </div>
                            ) : mentorSessions && mentorSessions.length > 0 ? (
                                /* Unlocked state with sessions list */
                                <div className="space-y-4">
                                    {mentorSessions.map((s) => {
                                        const isPaid = s.is_paid || s.price === 0;
                                        const ticketPrice = s.price ?? 199;

                                        return (
                                            <div
                                                key={s._id}
                                                className="p-5 rounded-2xl border border-[#dce8df] bg-[#fafcf9] flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-[#177fc0]/30 transition"
                                            >
                                                <div className="space-y-2 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <SessionCountdown date={s.date} time={s.time} status={s.status} />
                                                        <span className="text-xs text-gray-500 font-medium">
                                                            📅 {s.date || "Scheduled"} • {s.time} ({s.duration || "60 min"})
                                                        </span>
                                                        <span className="ml-auto md:ml-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                            {ticketPrice > 0 ? `Price: ₹${ticketPrice}` : "FREE"}
                                                        </span>
                                                    </div>

                                                    <h4 className="font-bold text-base text-[#163b35]">
                                                        {s.title}
                                                    </h4>

                                                    {s.description && (
                                                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                                            {s.description}
                                                        </p>
                                                    )}

                                                    <div className="flex items-center gap-3 text-[11px] text-gray-500 pt-1">
                                                        <span className="flex items-center gap-1 font-semibold text-emerald-800">
                                                            <Check className="w-3.5 h-3.5" /> Community Access Granted
                                                        </span>
                                                        <span>•</span>
                                                        <span>Google Meet Video Call</span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-2 shrink-0">
                                                    {isPaid ? (
                                                        <div className="flex flex-col items-end gap-1.5 w-full">
                                                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                                Ticket Confirmed
                                                            </span>
                                                            {s.gmeet_link ? (
                                                                <a
                                                                    href={s.gmeet_link}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-sm whitespace-nowrap"
                                                                >
                                                                    <Video className="w-4 h-4" />
                                                                    Join Google Meet ↗
                                                                </a>
                                                            ) : (
                                                                <span className="text-[11px] text-gray-400 font-medium">
                                                                    Starts strictly on time
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-end gap-1 w-full">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedSession(s);
                                                                    setShowSessionPayModal(true);
                                                                }}
                                                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#177fc0] hover:bg-[#126da6] text-white text-xs font-bold transition shadow-sm whitespace-nowrap"
                                                            >
                                                                <Ticket className="w-4 h-4" />
                                                                Pay ₹{ticketPrice} to Join Session
                                                            </button>
                                                            <span className="text-[10px] text-gray-400">
                                                                Payment required to unlock Google Meet
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                                    <Video className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-xs text-gray-500 font-semibold">
                                        No upcoming live sessions currently scheduled by {mentorName}.
                                    </p>
                                    <p className="text-[11px] text-gray-400 mt-1">
                                        New sessions will appear here as soon as {mentorName} schedules them.
                                    </p>
                                </div>
                            )}
                        </section>

                        {/* =================================================
                            COMMUNITIES CREATED BY MENTOR
                        ================================================= */}
                        {mentorCommunities.length > 0 && (
                            <section className="bg-white border border-[#123b38]/10 rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-extrabold text-[#082f2b] flex items-center gap-2">
                                            <Users className="w-5 h-5 text-[#177fc0]" />
                                            Mentorship Communities
                                        </h2>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Join {mentorName}'s learning communities to participate in live calls and group discussions.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {mentorCommunities.map((comm) => {
                                        const cap = comm.capacity || 20;
                                        const cur = comm.current_members || 0;
                                        const slots = Math.max(0, cap - cur);
                                        const isFull = cur >= cap;
                                        return (
                                            <div
                                                key={comm._id}
                                                className="p-5 rounded-2xl border border-gray-200 bg-[#fbfaf6]/60 flex flex-col justify-between space-y-4 hover:border-[#177fc0]/40 transition"
                                            >
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                                            {comm.category || "Community"}
                                                        </span>
                                                        <span className="text-xs font-bold text-[#082f2b]">
                                                            {comm.monthly_fee ? `₹${comm.monthly_fee}/mo` : "Free"}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-bold text-sm text-[#082f2b]">
                                                        {comm.name}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 line-clamp-2">
                                                        {comm.description}
                                                    </p>
                                                </div>

                                                <div className="space-y-2 pt-2 border-t border-gray-100">
                                                    <div className="flex justify-between text-[11px] font-medium text-gray-600">
                                                        <span>Capacity</span>
                                                        <span className={isFull ? "text-red-600 font-bold" : "text-emerald-700"}>
                                                            {cur} / {cap} {isFull ? "(Full)" : `(${slots} slots left)`}
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${isFull ? "bg-red-500" : "bg-emerald-500"}`}
                                                            style={{ width: `${Math.min(100, Math.round((cur / cap) * 100))}%` }}
                                                        />
                                                    </div>
                                                    <Link
                                                        to={`/community/${comm._id}`}
                                                        className="block w-full py-2 rounded-xl bg-[#082f2b] hover:bg-[#103d35] text-white text-xs font-bold text-center transition mt-2"
                                                    >
                                                        {isFull ? "View Details" : "Join Community"}
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* =================================================
                            RATINGS & VERIFIED REVIEWS
                        ================================================= */}
                        <section className="bg-white border border-[#123b38]/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl sm:text-2xl font-extrabold text-[#082f2b]">
                                            Ratings & Reviews
                                        </h2>
                                        <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 rounded-full text-xs font-bold border border-amber-200">
                                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                                            <span>{reviewsData.average_rating || "5.0"}</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Based on {reviewsData.total_reviews || 0} verified mentee reviews
                                    </p>
                                </div>

                                <button
                                    onClick={() => setShowReviewModal(true)}
                                    className="px-4 py-2 rounded-xl bg-[#082f2b] hover:bg-[#103d35] text-white text-xs font-bold shadow transition flex items-center gap-1.5 self-start sm:self-center"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Write a Review
                                </button>
                            </div>

                            {/* Reviews List */}
                            {reviewsData.reviews && reviewsData.reviews.length > 0 ? (
                                <div className="space-y-4">
                                    {reviewsData.reviews.map((r, i) => (
                                        <div
                                            key={r._id || i}
                                            className="p-4 sm:p-5 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-2.5"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">
                                                        {r.mentee_name ? r.mentee_name.charAt(0).toUpperCase() : "M"}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-bold text-[#082f2b]">
                                                            {r.mentee_name || "Verified Mentee"}
                                                        </h4>
                                                        <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5">
                                                            <Check className="w-3 h-3" /> Verified Mentee
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-0.5">
                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                        <Star
                                                            key={s}
                                                            className={`w-3.5 h-3.5 ${
                                                                s <= (r.rating || 5)
                                                                    ? "fill-amber-400 text-amber-500"
                                                                    : "text-gray-300"
                                                            }`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-700 leading-relaxed">
                                                "{r.review_text}"
                                            </p>
                                            <span className="text-[10px] text-gray-400 block">
                                                {r.created_at ? new Date(r.created_at).toLocaleDateString() : "Recent"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center bg-gray-50 rounded-2xl text-gray-500 text-xs">
                                    No reviews submitted yet. Be the first to share your experience with {mentorName}!
                                </div>
                            )}
                        </section>

                    </div>

                    {/* =================================================
                        BOOKING CARD
                        YOUR ORIGINAL APPLY AREA
                    ================================================= */}

                    {/* =================================================
                        RIGHT SIDEBAR: "JOIN HIS COMMUNITY"
                        REPLACING GENERIC SUBSCRIBE / APPLY
                    ================================================= */}
                    <aside className="lg:sticky lg:top-[96px]">
                        {(() => {
                            const primaryComm = mentorCommunities[0] || null;
                            const cap = primaryComm?.capacity || 20;
                            const cur = primaryComm?.current_members || 0;
                            const slots = Math.max(0, cap - cur);
                            const isFull = cur >= cap;
                            const commFee = primaryComm?.monthly_fee || 0;

                            return (
                                <div className="bg-[#fcfaf5] border border-[#ecdcc7] rounded-3xl p-6 sm:p-7 shadow-md space-y-6">
                                    {/* Community Header badge */}
                                    <div>
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                Exclusive Community Space
                                            </span>
                                            <span className="text-xs font-extrabold text-[#082f2b]">
                                                {commFee > 0 ? `₹${commFee}/mo` : "Free to Join"}
                                            </span>
                                        </div>

                                        <h3 className="font-serif text-2xl font-bold text-[#082f2b]">
                                            {primaryComm?.name || `${mentorName}'s Community`}
                                        </h3>
                                        <p className="text-xs text-[#556963] mt-1.5 leading-relaxed">
                                            {primaryComm?.description ||
                                                `Join ${mentorName}'s community for live Google Meet sessions, real-time discussions, and project feedback.`}
                                        </p>
                                    </div>

                                    {/* Community Capacity Indicator */}
                                    <div className="bg-white border border-[#e3dcd1] rounded-2xl p-4 space-y-2.5 shadow-xs">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-gray-700 flex items-center gap-1.5">
                                                <Users className="w-4 h-4 text-emerald-600" />
                                                Community Capacity
                                            </span>
                                            <span className={`font-extrabold ${isFull ? "text-red-600" : "text-emerald-800"}`}>
                                                {cur} / {cap} {isFull ? "(Full)" : `(${slots} slots left)`}
                                            </span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-500 ${
                                                    isFull
                                                        ? "bg-red-500"
                                                        : cur / cap > 0.8
                                                        ? "bg-amber-500"
                                                        : "bg-gradient-to-r from-emerald-500 to-teal-600"
                                                }`}
                                                style={{ width: `${Math.min(100, Math.round((cur / cap) * 100))}%` }}
                                            />
                                        </div>

                                        <p className="text-[11px] text-gray-500">
                                            Seats are limited to {cap} members to guarantee personal interaction and mentorship quality.
                                        </p>
                                    </div>

                                    {/* What's Inside the Community */}
                                    <div className="space-y-3.5 text-xs text-gray-700 pt-1">
                                        <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-[#082f2b] text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                                                ✓
                                            </div>
                                            <div>
                                                <p className="font-bold text-[#082f2b]">Exclusive Live Sessions</p>
                                                <p className="text-[11px] text-gray-500">
                                                    Access all Google Meet sessions hosted by {mentorName}.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-[#082f2b] text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                                                ✓
                                            </div>
                                            <div>
                                                <p className="font-bold text-[#082f2b]">Strict Start-On-Time Guarantee</p>
                                                <p className="text-[11px] text-gray-500">
                                                    Live sessions begin promptly with live countdown timers.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-[#082f2b] text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                                                ✓
                                            </div>
                                            <div>
                                                <p className="font-bold text-[#082f2b]">Community Group Chat & Q&A</p>
                                                <p className="text-[11px] text-gray-500">
                                                    Network with peers and get code guidance directly from {mentorName}.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Primary CTA: "Join His Community" */}
                                    <div className="pt-2">
                                        {isCommunityMember ? (
                                            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3 text-center">
                                                <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-emerald-100 text-emerald-800">
                                                    <CheckCircle2 className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm text-emerald-900">
                                                        You Are an Enrolled Member!
                                                    </h4>
                                                    <p className="text-xs text-emerald-700 mt-0.5">
                                                        Community access is active. Participate in discussions and join live sessions!
                                                    </p>
                                                </div>

                                                {primaryComm && (
                                                    <div className="space-y-2">
                                                        <Link
                                                            to={`/messages?tab=community&community_id=${primaryComm._id}`}
                                                            className="block w-full py-3 rounded-xl bg-[#082f2b] hover:bg-[#103d35] text-white text-xs font-bold text-center transition shadow-xs cursor-pointer"
                                                        >
                                                            Enter Community Group Chat →
                                                        </Link>
                                                        <Link
                                                            to={`/community/${primaryComm._id}`}
                                                            className="block w-full py-2 rounded-xl border border-[#082f2b]/30 bg-white hover:bg-emerald-50 text-[#082f2b] text-xs font-bold text-center transition shadow-2xs cursor-pointer"
                                                        >
                                                            View Community Workspace
                                                        </Link>
                                                        <Link
                                                            to={`/messages?tab=direct&mentor_id=${id}`}
                                                            className="block w-full py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold text-center transition shadow-2xs cursor-pointer"
                                                        >
                                                            💬 1-on-1 Direct Chat with {mentorName}
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        ) : isCommunityRequested ? (
                                            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 space-y-2.5 text-center">
                                                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-800 mx-auto">
                                                    <Clock className="w-4 h-4 text-amber-700" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm text-amber-950">
                                                        Request Sent to Mentor
                                                    </h4>
                                                    <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                                                        Your request to join {primaryComm?.name || `${mentorName}'s community`} has been submitted and is pending mentor approval.
                                                    </p>
                                                </div>
                                                <button
                                                    disabled
                                                    className="w-full py-3 rounded-xl bg-amber-100/90 text-amber-900 border border-amber-300/80 font-extrabold text-xs cursor-default flex items-center justify-center gap-2"
                                                >
                                                    <Clock className="w-4 h-4 text-amber-700" />
                                                    Requested
                                                </button>
                                            </div>
                                        ) : isFull ? (
                                            <button
                                                disabled
                                                className="w-full py-3.5 rounded-2xl bg-gray-200 text-gray-500 font-bold text-sm cursor-not-allowed text-center"
                                            >
                                                Community Capacity Full ({cur}/{cap})
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleJoinCommunity(primaryComm?._id)}
                                                disabled={joiningCommunity}
                                                className="w-full py-3.5 rounded-2xl bg-[#082f2b] hover:bg-[#103d35] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 group cursor-pointer"
                                            >
                                                <Users className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
                                                {joiningCommunity ? "Submitting Request..." : "Join His Community"}
                                            </button>
                                        )}
                                    </div>

                                    {/* 1-on-1 Mentorship fallback option */}
                                    <div className="pt-3 border-t border-[#ecdcc7] text-center">
                                        <button
                                            onClick={() => handleApply(false)}
                                            className="text-xs font-semibold text-gray-600 hover:text-[#082f2b] hover:underline"
                                        >
                                            Need 1-on-1 private mentoring? Book 1-on-1 call →
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}

                        <p className="text-center mt-3 text-xs text-[#65746f]">
                            🔒 Exclusive community space with direct mentor access
                        </p>
                    </aside>

                </div>

            </main>

            <Toaster position="top-right" />

            {/* WRITE REVIEW MODAL */}
            {showReviewModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div>
                                <h3 className="text-xl font-bold text-[#082f2b]">Write a Review</h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    For {mentorName}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowReviewModal(false)}
                                className="text-gray-400 hover:text-gray-600 text-lg"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleReviewSubmit} className="space-y-4">
                            {/* Star Selection */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700">
                                    Your Rating (1-5 stars)
                                </label>
                                <div className="flex items-center gap-2 pt-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            type="button"
                                            key={star}
                                            onClick={() => setReviewRating(star)}
                                            className="p-1 hover:scale-110 transition"
                                        >
                                            <Star
                                                className={`w-7 h-7 ${
                                                    star <= reviewRating
                                                        ? "fill-amber-400 text-amber-500"
                                                        : "text-gray-300 hover:text-amber-300"
                                                }`}
                                            />
                                        </button>
                                    ))}
                                    <span className="text-sm font-extrabold text-[#082f2b] ml-2">
                                        {reviewRating}.0 / 5
                                    </span>
                                </div>
                            </div>

                            {/* Feedback Text */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700">
                                    Your Mentorship Experience & Feedback
                                </label>
                                <textarea
                                    rows={4}
                                    value={reviewText}
                                    onChange={(e) => setReviewText(e.target.value)}
                                    placeholder="Describe how the mentor assisted your goals, code reviews, career trajectory, etc..."
                                    required
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#177fc0] focus:ring-2 focus:ring-[#177fc0]/20 text-xs sm:text-sm outline-none transition"
                                />
                            </div>

                            <p className="text-[11px] text-gray-400">
                                Note: You must be an active community member or session attendee to post verified reviews.
                            </p>

                            {/* Buttons */}
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowReviewModal(false)}
                                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingReview}
                                    className="px-6 py-2.5 rounded-xl bg-[#082f2b] hover:bg-[#103d35] text-white text-xs font-bold shadow transition flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    {submittingReview ? "Submitting..." : "Submit Review"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* =================================================
                MODAL: JOIN HIS COMMUNITY
            ================================================= */}
            {showJoinModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-[#082f2b]">Join His Community</h3>
                                    <p className="text-xs text-gray-500">
                                        {mentorCommunities[0]?.name || `${mentorName}'s Community`}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowJoinModal(false)}
                                className="text-gray-400 hover:text-gray-600 text-lg p-1"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Community Capacity in Modal */}
                        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
                                <span>Community Member Capacity</span>
                                <span>
                                    {mentorCommunities[0]?.current_members || 0} / {mentorCommunities[0]?.capacity || 20} Members
                                </span>
                            </div>
                            <p className="text-[11px] text-emerald-800">
                                Members gain direct access to live Google Meet sessions, community discussions, and mentor updates.
                            </p>
                        </div>

                        <div className="space-y-3 text-xs text-gray-600 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <div className="flex justify-between">
                                <span>Mentor:</span>
                                <span className="font-bold text-[#082f2b]">{mentorName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Membership Fee:</span>
                                <span className="font-bold text-[#082f2b]">
                                    {mentorCommunities[0]?.monthly_fee ? `₹${mentorCommunities[0].monthly_fee}/month` : "Free"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Member Name:</span>
                                <span className="font-semibold text-gray-800">{userName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Email:</span>
                                <span className="font-semibold text-gray-800">{userEmail}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowJoinModal(false)}
                                className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={joiningCommunity}
                                onClick={() => {
                                    const comm = mentorCommunities[0];
                                    handleJoinCommunity(comm?._id, comm?.monthly_fee || 0);
                                }}
                                className="px-6 py-2.5 rounded-xl bg-[#082f2b] hover:bg-[#103d35] text-white text-xs font-bold shadow-md transition disabled:opacity-50 flex items-center gap-2"
                            >
                                <Users className="w-4 h-4" />
                                {joiningCommunity ? "Joining..." : "Confirm & Join Community"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =================================================
                MODAL: LIVE SESSION TICKET PAYMENT
            ================================================= */}
            {showSessionPayModal && selectedSession && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-2xl bg-sky-100 text-[#177fc0] flex items-center justify-center">
                                    <Ticket className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-[#082f2b]">Session Ticket Checkout</h3>
                                    <p className="text-xs text-gray-500">Strictly starts on time</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowSessionPayModal(false)}
                                className="text-gray-400 hover:text-gray-600 text-lg p-1"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Session details */}
                        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <SessionCountdown
                                    date={selectedSession.date}
                                    time={selectedSession.time}
                                    status={selectedSession.status}
                                />
                                <span className="text-xs font-extrabold text-[#082f2b]">
                                    ₹{selectedSession.price ?? 199}
                                </span>
                            </div>
                            <h4 className="font-bold text-sm text-[#082f2b]">
                                {selectedSession.title}
                            </h4>
                            <p className="text-xs text-gray-500">
                                📅 {selectedSession.date} at {selectedSession.time} ({selectedSession.duration || "60 min"})
                            </p>
                            <div className="pt-2 border-t border-gray-200 flex items-center gap-2 text-[11px] text-amber-800">
                                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>Guaranteed to start on time. Google Meet link unlocks immediately upon payment.</span>
                            </div>
                        </div>

                        {/* Payment Method Selector */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700 block">
                                Select Payment Method
                            </label>
                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    { id: "UPI / Google Pay / PhonePe", label: "UPI (Google Pay / PhonePe / Paytm)" },
                                    { id: "Credit / Debit Card", label: "Credit or Debit Card" },
                                    { id: "Net Banking", label: "Net Banking (All Indian Banks)" },
                                ].map((m) => (
                                    <label
                                        key={m.id}
                                        onClick={() => setSessionPaymentMethod(m.id)}
                                        className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                                            sessionPaymentMethod === m.id
                                                ? "border-[#177fc0] bg-sky-50/60 text-[#177fc0]"
                                                : "border-gray-200 text-gray-700 hover:bg-gray-50"
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="sessionPayMethod"
                                            checked={sessionPaymentMethod === m.id}
                                            onChange={() => setSessionPaymentMethod(m.id)}
                                            className="text-[#177fc0] focus:ring-[#177fc0]"
                                        />
                                        <CreditCard className="w-4 h-4" />
                                        <span>{m.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => setShowSessionPayModal(false)}
                                className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={payingSession}
                                onClick={handlePayForSession}
                                className="px-6 py-2.5 rounded-xl bg-[#177fc0] hover:bg-[#126da6] text-white text-xs font-bold shadow-md transition disabled:opacity-50 flex items-center gap-2"
                            >
                                <Ticket className="w-4 h-4" />
                                {payingSession ? "Processing..." : `Pay ₹${selectedSession.price ?? 199} & Confirm Seat`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default MentorProfile;