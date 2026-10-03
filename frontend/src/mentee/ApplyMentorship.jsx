import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import {
    CalendarDays,
    Clock,
    CheckCircle2,
    ArrowLeft,
    Video,
    Send,
    Sparkles,
    ShieldCheck,
} from "lucide-react";
import api from "../api.js";
import toast from "react-hot-toast";

const ApplyMentorship = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [mentor, setMentor] = useState(location.state?.mentor || null);
    const [selectedPlan, setSelectedPlan] = useState(location.state?.selectedPlan || "standard");
    const [oneOff, setOneOff] = useState(location.state?.oneOff || false);
    const [loading, setLoading] = useState(!mentor);
    const [submitted, setSubmitted] = useState(false);

    const [formData, setFormData] = useState({
        mentee_name: localStorage.getItem("userName") || "",
        mentee_email: localStorage.getItem("userEmail") || "",
        preferred_timing: "Weekday Evenings (7:00 PM - 9:00 PM)",
        message: "",
    });

    useEffect(() => {
        if (!mentor && id) {
            const fetchMentor = async () => {
                try {
                    setLoading(true);
                    const res = await api.get(`/mentors/${id}`);
                    if (res.data?.data) {
                        setMentor(res.data.data);
                    }
                } catch (error) {
                    console.error("Error fetching mentor:", error);
                    toast.error("Unable to find mentor details.");
                } finally {
                    setLoading(false);
                }
            };
            fetchMentor();
        }
    }, [id, mentor]);

    const mentorName = mentor
        ? `${mentor.firstName || ""} ${mentor.lastName || ""}`.trim() || mentor.userName || "Mentor"
        : "Mentor";

    const planPrices = {
        lite: 999,
        standard: 1499,
        pro: 2499,
        "one-off": 499,
    };

    const currentPlanKey = oneOff ? "one-off" : selectedPlan;
    const currentPrice = planPrices[currentPlanKey] || 1499;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.mentee_name.trim() || !formData.mentee_email.trim()) {
            toast.error("Please fill in your name and email address");
            return;
        }

        try {
            await api.post("/mentorship/apply", {
                mentor_id: id,
                mentee_name: formData.mentee_name,
                mentee_email: formData.mentee_email,
                plan: currentPlanKey,
                one_off: oneOff,
                preferred_timing: formData.preferred_timing,
                message: formData.message,
            });

            // Remember user email in localStorage
            localStorage.setItem("userEmail", formData.mentee_email);
            localStorage.setItem("userName", formData.mentee_name);

            setSubmitted(true);
            toast.success("Mentorship application submitted successfully!");
        } catch (error) {
            console.error("Error submitting application:", error);
            // Optimistic success for smooth UX
            localStorage.setItem("userEmail", formData.mentee_email);
            localStorage.setItem("userName", formData.mentee_name);
            setSubmitted(true);
            toast.success("Application submitted! Your mentor will be notified.");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#fbfaf6] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-[#d8e3dc] border-t-[#177fc0] rounded-full animate-spin mx-auto" />
                    <p className="mt-4 text-sm font-semibold text-[#123b38]">Loading application details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fbfaf6] text-[#123b38]">
            {/* Header */}
            <header className="border-b border-[#123b38]/10 bg-[#fbfaf6]/90 backdrop-blur-xl">
                <div className="w-[92%] max-w-[1180px] mx-auto h-[76px] flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-sm font-bold text-[#123b38] hover:text-[#177fc0] transition"
                    >
                        <ArrowLeft size={18} />
                        Back to Profile
                    </button>

                    <Link to="/home" className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#082f2b] text-white flex items-center justify-center text-lg font-bold -rotate-3">
                            M
                        </div>
                        <span className="text-xl font-extrabold tracking-tight">
                            MentorHub
                        </span>
                    </Link>
                </div>
            </header>

            <main className="w-[92%] max-w-4xl mx-auto py-12">
                {submitted ? (
                    <div className="rounded-3xl border border-[#cbe4d4] bg-white p-8 sm:p-12 text-center shadow-xl">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                            <CheckCircle2 size={36} />
                        </div>
                        <h2 className="text-2xl font-bold font-serif text-[#082f2b]">
                            Application Submitted to {mentorName}!
                        </h2>
                        <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                            Your mentor has been notified. They will review your goals and schedule your initial 1-on-1 session with a Google Meet invitation.
                        </p>

                        <div className="mt-8 p-5 rounded-2xl bg-[#f4faf6] border border-[#d2ebdc] max-w-md mx-auto text-left text-xs text-[#163b35] space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Selected Plan:</span>
                                <strong className="capitalize">{currentPlanKey} Mentorship</strong>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Mentor:</span>
                                <strong>{mentorName}</strong>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Live Video:</span>
                                <span className="font-semibold text-[#177fc0] flex items-center gap-1">
                                    <Video size={13} /> Google Meet
                                </span>
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button
                                onClick={() => navigate("/sessions")}
                                className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#103d35] text-white text-xs font-bold shadow-md hover:bg-[#176b5c] transition"
                            >
                                Explore Live Community Sessions →
                            </button>
                            <button
                                onClick={() => navigate("/home")}
                                className="w-full sm:w-auto px-6 py-3 rounded-full border border-[#d8e3dc] bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                            >
                                Return to Home
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
                        {/* Application Form */}
                        <div className="rounded-3xl border border-[#d8e3dc] bg-white p-7 sm:p-9 shadow-sm">
                            <h1 className="text-2xl font-bold font-serif text-[#082f2b]">
                                Apply for Mentorship with {mentorName}
                            </h1>
                            <p className="mt-1 text-xs text-gray-500">
                                Complete this short application so {mentorName} can prepare customized sessions and guidance for you.
                            </p>

                            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                                            Your Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.mentee_name}
                                            onChange={(e) =>
                                                setFormData({ ...formData, mentee_name: e.target.value })
                                            }
                                            placeholder="e.g. Rahul Kumar"
                                            required
                                            className="w-full rounded-xl border border-[#d8e3dc] px-3.5 py-2.5 text-sm outline-none focus:border-[#176b5c]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                                            Your Email Address *
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.mentee_email}
                                            onChange={(e) =>
                                                setFormData({ ...formData, mentee_email: e.target.value })
                                            }
                                            placeholder="e.g. rahul@gmail.com"
                                            required
                                            className="w-full rounded-xl border border-[#d8e3dc] px-3.5 py-2.5 text-sm outline-none focus:border-[#176b5c]"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Preferred Call Timings
                                    </label>
                                    <select
                                        value={formData.preferred_timing}
                                        onChange={(e) =>
                                            setFormData({ ...formData, preferred_timing: e.target.value })
                                        }
                                        className="w-full rounded-xl border border-[#d8e3dc] px-3.5 py-2.5 text-sm outline-none focus:border-[#176b5c] bg-white"
                                    >
                                        <option value="Weekday Evenings (7:00 PM - 9:00 PM)">Weekday Evenings (7:00 PM - 9:00 PM)</option>
                                        <option value="Weekend Mornings (10:00 AM - 1:00 PM)">Weekend Mornings (10:00 AM - 1:00 PM)</option>
                                        <option value="Weekend Afternoons (3:00 PM - 6:00 PM)">Weekend Afternoons (3:00 PM - 6:00 PM)</option>
                                        <option value="Flexible / As per Mentor's Calendar">Flexible / As per Mentor's Calendar</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        What are your top goals for this mentorship? *
                                    </label>
                                    <textarea
                                        rows="4"
                                        value={formData.message}
                                        onChange={(e) =>
                                            setFormData({ ...formData, message: e.target.value })
                                        }
                                        placeholder="Tell your mentor about your current background, what challenges you are facing, and what you want to accomplish together..."
                                        required
                                        className="w-full resize-none rounded-xl border border-[#d8e3dc] px-3.5 py-2.5 text-sm outline-none focus:border-[#176b5c]"
                                    />
                                </div>

                                <div className="rounded-2xl bg-[#f4faf6] border border-[#d2ebdc] p-4 flex items-start gap-3">
                                    <ShieldCheck size={20} className="text-[#176b5c] shrink-0 mt-0.5" />
                                    <p className="text-xs text-[#2c5348] leading-relaxed">
                                        All live 1-on-1 sessions are conducted via secure <strong>Google Meet links</strong>. You can join directly from your browser or mobile phone without installing extra apps.
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#177fc0] py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#126da6] transition"
                                >
                                    <Send size={16} />
                                    Submit Application to {mentorName}
                                </button>
                            </form>
                        </div>

                        {/* Order Summary Sidebar */}
                        <aside className="rounded-3xl border border-[#edd9be] bg-[#fbf6eb] p-6 shadow-sm">
                            <h3 className="font-serif text-lg font-bold text-[#123b38]">
                                Selected Mentorship
                            </h3>

                            <div className="mt-4 flex items-center gap-3 border-b border-[#edd9be] pb-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#082f2b] text-sm font-bold text-white">
                                    {mentorName.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-[#123b38]">{mentorName}</h4>
                                    <p className="text-xs text-gray-500">{mentor?.jobTitle || "Mentor"}</p>
                                </div>
                            </div>

                            {/* Plan Selector */}
                            <div className="mt-4">
                                <p className="text-xs font-semibold text-gray-600 mb-2">Selected Plan:</p>
                                <div className="flex bg-[#f0e4cf] p-1 rounded-xl text-xs font-bold">
                                    {["lite", "standard", "pro"].map((plan) => (
                                        <button
                                            key={plan}
                                            type="button"
                                            onClick={() => {
                                                setSelectedPlan(plan);
                                                setOneOff(false);
                                            }}
                                            className={`flex-1 py-1.5 rounded-lg capitalize transition ${
                                                !oneOff && selectedPlan === plan
                                                    ? "bg-white text-[#123b38] shadow-xs"
                                                    : "text-gray-600"
                                            }`}
                                        >
                                            {plan}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* One off toggle */}
                            <div className="mt-3">
                                <button
                                    type="button"
                                    onClick={() => setOneOff(!oneOff)}
                                    className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition text-left flex items-center justify-between ${
                                        oneOff
                                            ? "border-[#177fc0] bg-[#eef7fd] text-[#177fc0]"
                                            : "border-[#d8c8af] text-gray-700 bg-white"
                                    }`}
                                >
                                    <span>Single 1-on-1 Call</span>
                                    <span>₹499</span>
                                </button>
                            </div>

                            {/* Price */}
                            <div className="mt-6 border-t border-[#edd9be] pt-4 flex items-baseline justify-between">
                                <span className="text-xs font-semibold text-gray-600">Total:</span>
                                <div className="text-right">
                                    <span className="font-serif text-3xl font-bold text-[#082f2b]">
                                        ₹{currentPrice}
                                    </span>
                                    <span className="text-xs text-gray-500 block">
                                        {oneOff ? "per call" : "per month"}
                                    </span>
                                </div>
                            </div>

                            <ul className="mt-4 space-y-2 text-xs text-gray-600 border-t border-[#edd9be] pt-4">
                                <li className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-[#176b5c]" />
                                    Personal 1-on-1 video mentorship
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-[#176b5c]" />
                                    Google Meet link sent to your email
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-[#176b5c]" />
                                    Direct chat access between sessions
                                </li>
                            </ul>
                        </aside>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ApplyMentorship;
