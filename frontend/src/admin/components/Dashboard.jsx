import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api.js";
import toast, { Toaster } from "react-hot-toast";

import {
    Users,
    UserRoundCheck,
    UserRound,
    IndianRupee,
    Flag,
    Clock3,
    CheckCircle,
    XCircle,
    MessageSquare,
    CalendarDays,
    ShieldCheck,
    AlertTriangle,
    TrendingUp,
    Activity,
    Eye,
    ArrowUpRight,
    ArrowDownRight,
    MoreHorizontal,
    RefreshCw,
    ArrowRight,
    Handshake,
    Building2,
    CheckCircle2,
    CreditCard,
} from "lucide-react";

const Dashboard = () => {
    const navigate = useNavigate();

    const [timeframe, setTimeframe] = useState("this_month");
    const [statsData, setStatsData] = useState({
        total_users: 0,
        total_mentors: 0,
        accepted_mentors: 0,
        pending_mentors: 0,
        rejected_mentors: 0,
        total_communities: 0,
        active_subscriptions: 0,
        total_subscriptions: 0,
        total_revenue: 0,
        total_sessions: 0,
        completed_sessions: 0,
        upcoming_sessions: 0,
        open_reports: 0,
        total_reports: 0,
        payments_count: 0,
        pending_applications: [],
        overview: {
            timeframe: "this_month",
            new_users: 0,
            new_users_growth: "",
            new_mentors: 0,
            new_mentors_growth: "",
            sessions_completed: 0,
            sessions_growth: "",
        },
    });
    const [activityList, setActivityList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData(timeframe);
    }, []);

    const fetchDashboardData = async (currentTimeframe = timeframe) => {
        try {
            setLoading(true);
            const [statsRes, actRes] = await Promise.allSettled([
                api.get(`/admin/dashboard/stats?timeframe=${currentTimeframe}`),
                api.get("/admin/activity"),
            ]);
            if (statsRes.status === "fulfilled" && statsRes.value.data?.data) {
                setStatsData(statsRes.value.data.data);
            }
            if (actRes.status === "fulfilled" && actRes.value.data?.data) {
                setActivityList(actRes.value.data.data);
            }
        } catch (err) {
            console.error("Error fetching admin dashboard:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleTimeframeChange = (e) => {
        const newTf = e.target.value;
        setTimeframe(newTf);
        fetchDashboardData(newTf);
    };

    const handleAcceptMentor = async (mentorId) => {
        try {
            await api.post(`/mentor/accept/${mentorId}`);
            toast.success("Mentor application approved!");
            fetchDashboardData(timeframe);
        } catch (err) {
            toast.error("Failed to approve application");
        }
    };

    const handleRejectMentor = async (mentorId) => {
        try {
            await api.post(`/mentor/reject/${mentorId}`);
            toast.success("Mentor application rejected.");
            fetchDashboardData(timeframe);
        } catch (err) {
            toast.error("Failed to reject application");
        }
    };

    const stats = [
        {
            title: "Total Users",
            value: statsData.total_users || 0,
            change: `${statsData.total_users || 0} active`,
            icon: Users,
        },
        {
            title: "Total Mentors",
            value: statsData.total_mentors || 0,
            change: `${statsData.accepted_mentors || statsData.total_mentors || 0} active`,
            icon: UserRoundCheck,
        },
        {
            title: "Active Subscriptions",
            value: statsData.active_subscriptions || statsData.total_subscriptions || 0,
            change: "Enrolled",
            icon: UserRound,
        },
        {
            title: "Total Revenue",
            value: `₹${Number(statsData.total_revenue || 0).toLocaleString()}`,
            change: `${statsData.payments_count || 0} tx`,
            icon: IndianRupee,
        },
    ];

    return (
        <div className="mx-auto max-w-7xl">
            <Toaster position="top-right" />

            {/* ================= HEADER ================= */}
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                <div>
                    <p className="text-sm font-medium text-[#2c8b77]">
                        Thursday, September 10, 2026
                    </p>

                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#163b35] sm:text-3xl">
                        Good morning, Admin 👋
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Here's what's happening across MentorHub today.
                    </p>
                </div>

                <button
                    onClick={() => navigate("/admin/accept-reject-mentors")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#176b5c] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#0f594d]"
                >
                    Manage Mentors
                    <ArrowRight size={17} />
                </button>

            </div>

            {/* ================= STAT CARDS ================= */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                {stats.map((stat) => {
                    const Icon = stat.icon;

                    return (
                        <div
                            key={stat.title}
                            className="rounded-2xl border border-[#dce8df] bg-white p-5 shadow-[0_8px_30px_rgba(15,55,45,0.05)]"
                        >

                            <div className="flex items-start justify-between">

                                <div>
                                    <p className="text-sm font-medium text-gray-500">
                                        {stat.title}
                                    </p>

                                    <h2 className="mt-2 text-2xl font-bold text-[#163b35]">
                                        {stat.value}
                                    </h2>
                                </div>

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf6ed] text-[#176b5c]">
                                    <Icon size={21} />
                                </div>

                            </div>

                            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-emerald-600">

                                <TrendingUp size={14} />

                                {stat.change}

                                <span className="font-normal text-gray-400">
                                    vs last month
                                </span>

                            </div>

                        </div>
                    );
                })}

            </div>

            {/* ================= SECONDARY STATS ================= */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                {/* Pending Applications */}
                <div className="rounded-2xl border border-[#dce8df] bg-white p-5">

                    <div className="flex items-center gap-3">

                        <div className="rounded-xl bg-orange-50 p-3 text-orange-500">
                            <Clock3 size={20} />
                        </div>

                        <div>
                            <p className="text-xs text-gray-400">
                                Pending Applications
                            </p>

                            <p className="text-xl font-bold text-[#163b35]">
                                {statsData.pending_mentors}
                            </p>
                        </div>

                    </div>

                </div>

                {/* Active Mentorships */}
                <div className="rounded-2xl border border-[#dce8df] bg-white p-5">

                    <div className="flex items-center gap-3">

                        <div className="rounded-xl bg-blue-50 p-3 text-blue-500">
                            <Handshake size={20} />
                        </div>

                        <div>
                            <p className="text-xs text-gray-400">
                                Active Subscriptions
                            </p>

                            <p className="text-xl font-bold text-[#163b35]">
                                {statsData.active_subscriptions || statsData.total_subscriptions || 0}
                            </p>
                        </div>

                    </div>

                </div>

                {/* Active Communities */}
                <div className="rounded-2xl border border-[#dce8df] bg-white p-5">

                    <div className="flex items-center gap-3">

                        <div className="rounded-xl bg-purple-50 p-3 text-purple-500">
                            <Building2 size={20} />
                        </div>

                        <div>
                            <p className="text-xs text-gray-400">
                                Active Communities
                            </p>

                            <p className="text-xl font-bold text-[#163b35]">
                                {statsData.total_communities}
                            </p>
                        </div>

                    </div>

                </div>

                {/* Open Reports */}
                <div className="rounded-2xl border border-[#dce8df] bg-white p-5">

                    <div className="flex items-center gap-3">

                        <div className="rounded-xl bg-red-50 p-3 text-red-500">
                            <AlertTriangle size={20} />
                        </div>

                        <div>
                            <p className="text-xs text-gray-400">
                                Open Reports
                            </p>

                            <p className="text-xl font-bold text-[#163b35]">
                                {statsData.open_reports ?? 0}
                            </p>
                        </div>

                    </div>

                </div>

            </div>

            {/* ================= MAIN GRID ================= */}
            <div className="mt-6 grid gap-6 xl:grid-cols-3">

                {/* ================= PENDING APPLICATIONS ================= */}
                <div className="rounded-2xl border border-[#dce8df] bg-white xl:col-span-2">

                    <div className="flex items-center justify-between border-b border-[#edf2ee] px-5 py-5">

                        <div>
                            <h2 className="font-semibold text-[#163b35]">
                                Pending Mentor Applications
                            </h2>

                            <p className="mt-1 text-xs text-gray-400">
                                Applications waiting for your review
                            </p>
                        </div>

                        <button
                            onClick={() => navigate("/admin/accept-reject-mentors")}
                            className="text-xs font-semibold text-[#176b5c] hover:underline"
                        >
                            View all
                        </button>

                    </div>

                    <div className="divide-y divide-[#edf2ee]">
                        {statsData.pending_applications && statsData.pending_applications.length > 0 ? (
                            statsData.pending_applications.map((application) => {
                                const name =
                                    application.name ||
                                    `${application.firstName || ""} ${application.lastName || ""}`.trim() ||
                                    "Applicant";
                                const initials =
                                    name
                                        .split(" ")
                                        .map((w) => w[0])
                                        .join("")
                                        .slice(0, 2)
                                        .toUpperCase() || "M";

                                return (
                                    <div
                                        key={application._id || application.id}
                                        className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between hover:bg-[#fafcf9] transition"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eaf6ed] text-sm font-bold text-[#176b5c]">
                                                {initials}
                                            </div>

                                            <div>
                                                <p className="text-sm font-semibold text-[#163b35]">
                                                    {name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {application.jobTitle || application.role || application.email}
                                                </p>
                                                <span className="mt-1 inline-block rounded-full bg-[#f1f7f2] px-2 py-0.5 text-[10px] font-medium text-[#176b5c]">
                                                    {application.category || "General Mentorship"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleRejectMentor(application._id)}
                                                className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                                            >
                                                <XCircle size={15} />
                                                Reject
                                            </button>

                                            <button
                                                onClick={() => handleAcceptMentor(application._id)}
                                                className="flex items-center gap-1.5 rounded-lg bg-[#176b5c] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#0f594d]"
                                            >
                                                <CheckCircle2 size={15} />
                                                Approve
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-8 text-center text-xs text-gray-400">
                                No pending mentor applications waiting for review.
                            </div>
                        )}
                    </div>

                </div>

                {/* ================= RECENT ACTIVITY ================= */}
                <div className="rounded-2xl border border-[#dce8df] bg-white">

                    <div className="flex items-center justify-between border-b border-[#edf2ee] px-5 py-5">

                        <div>
                            <h2 className="font-semibold text-[#163b35]">
                                Recent Activity
                            </h2>

                            <p className="mt-1 text-xs text-gray-400">
                                Latest platform events & subscriptions
                            </p>
                        </div>

                        <Activity
                            size={18}
                            className="text-gray-400"
                        />

                    </div>

                    <div className="divide-y divide-[#edf2ee]">

                        {(activityList.length > 0 ? activityList : [
                            {
                                title: "Platform Active",
                                description: "MentorHub backend and database connected",
                                time: "Real-time",
                                type: "community",
                            },
                        ]).map((activity, index) => (

                            <div
                                key={index}
                                className="flex gap-3 px-5 py-4"
                            >

                                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eaf6ed] text-xs text-[#176b5c]">
                                    {activity.type === "mentor" && "M"}
                                    {activity.type === "user" && "U"}
                                    {activity.type === "payment" && "₹"}
                                    {activity.type === "community" && "C"}
                                </div>

                                <div className="min-w-0">

                                    <p className="text-xs font-semibold text-[#163b35]">
                                        {activity.title}
                                    </p>

                                    <p className="mt-0.5 text-xs leading-5 text-gray-500">
                                        {activity.description}
                                    </p>

                                    <p className="mt-1 text-[10px] text-gray-400">
                                        {activity.time}
                                    </p>

                                </div>

                            </div>

                        ))}

                    </div>

                </div>

            </div>

            {/* ================= PLATFORM OVERVIEW ================= */}
            <div className="mt-6 rounded-2xl border border-[#dce8df] bg-white">

                <div className="flex flex-col justify-between gap-3 border-b border-[#edf2ee] px-5 py-5 sm:flex-row sm:items-center">

                    <div>
                        <h2 className="font-semibold text-[#163b35]">
                            Platform Overview
                        </h2>

                        <p className="mt-1 text-xs text-gray-400">
                            MentorHub performance {timeframe === "this_month" ? "this month" : timeframe === "last_month" ? "last month" : timeframe === "last_3_months" ? "in the last 3 months" : "all time"}
                        </p>
                    </div>

                    <select
                        value={timeframe}
                        onChange={handleTimeframeChange}
                        className="rounded-lg border border-[#dce8df] bg-white px-3 py-2 text-xs font-medium text-gray-700 outline-none transition focus:border-[#176b5c] cursor-pointer hover:border-gray-300"
                    >
                        <option value="this_month">This month</option>
                        <option value="last_month">Last month</option>
                        <option value="last_3_months">Last 3 months</option>
                        <option value="all_time">All time</option>
                    </select>

                </div>

                <div className="grid gap-6 p-5 md:grid-cols-3">

                    <OverviewItem
                        icon={<Users size={20} />}
                        title="New Users"
                        value={statsData.overview?.new_users ?? statsData.total_users ?? 0}
                        percentage={statsData.overview?.new_users_growth || `${statsData.total_users || 0} active`}
                    />

                    <OverviewItem
                        icon={<UserRoundCheck size={20} />}
                        title="New Mentors"
                        value={statsData.overview?.new_mentors ?? statsData.total_mentors ?? 0}
                        percentage={statsData.overview?.new_mentors_growth || `${statsData.pending_mentors || 0} pending`}
                    />

                    <OverviewItem
                        icon={<CalendarDays size={20} />}
                        title="Sessions Completed"
                        value={statsData.overview?.sessions_completed ?? statsData.completed_sessions ?? 0}
                        percentage={statsData.overview?.sessions_growth || `${statsData.upcoming_sessions || 0} upcoming`}
                    />

                </div>

            </div>

            {/* ================= QUICK ACTIONS ================= */}
            <div className="mt-6">

                <h2 className="mb-4 text-lg font-semibold text-[#163b35]">
                    Quick Actions
                </h2>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    <QuickAction
                        icon={<UserRoundCheck size={21} />}
                        title="Review Mentors"
                        description={
                            statsData.pending_mentors > 0
                                ? `${statsData.pending_mentors} pending application${statsData.pending_mentors > 1 ? "s" : ""}`
                                : "No pending applications"
                        }
                        onClick={() => navigate("/admin/accept-reject-mentors")}
                    />

                    <QuickAction
                        icon={<Users size={21} />}
                        title="Manage Users"
                        description={`${statsData.total_users || 0} registered mentee${(statsData.total_users || 0) === 1 ? "" : "s"}`}
                        onClick={() => navigate("/admin/mentees")}
                    />

                    <QuickAction
                        icon={<CreditCard size={21} />}
                        title="View Payments"
                        description={
                            statsData.total_revenue
                                ? `₹${Number(statsData.total_revenue).toLocaleString()} (${statsData.payments_count || 0} transactions)`
                                : "0 transactions"
                        }
                        onClick={() => navigate("/admin/payments")}
                    />

                    <QuickAction
                        icon={<Flag size={21} />}
                        title="Review Reports"
                        description={
                            statsData.open_reports > 0
                                ? `${statsData.open_reports} open ticket${statsData.open_reports > 1 ? "s" : ""}`
                                : "0 open complaints"
                        }
                        onClick={() => navigate("/admin/reports")}
                    />

                </div>

            </div>

        </div>
    );
};


/* ================= OVERVIEW ITEM ================= */

const OverviewItem = ({
    icon,
    title,
    value,
    percentage,
}) => {
    return (
        <div className="rounded-xl bg-[#f8faf8] p-5">

            <div className="flex items-center justify-between">

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#eaf6ed] text-[#176b5c]">
                    {icon}
                </div>

                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600">
                    {percentage}
                </span>

            </div>

            <p className="mt-4 text-xs text-gray-400">
                {title}
            </p>

            <p className="mt-1 text-2xl font-bold text-[#163b35]">
                {value}
            </p>

        </div>
    );
};


/* ================= QUICK ACTION ================= */

const QuickAction = ({
    icon,
    title,
    description,
    onClick,
}) => {
    return (
        <button
            onClick={onClick}
            className="group flex items-center gap-4 rounded-2xl border border-[#dce8df] bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-[#b9d3c4] hover:shadow-[0_12px_35px_rgba(15,55,45,0.08)]"
        >

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eaf6ed] text-[#176b5c] transition group-hover:bg-[#176b5c] group-hover:text-white">
                {icon}
            </div>

            <div className="min-w-0">

                <p className="text-sm font-semibold text-[#163b35]">
                    {title}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                    {description}
                </p>

            </div>

            <ArrowRight
                size={16}
                className="ml-auto text-gray-300 transition group-hover:text-[#176b5c]"
            />

        </button>
    );
};

export default Dashboard;