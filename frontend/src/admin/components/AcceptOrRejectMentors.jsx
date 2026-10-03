
import React, { useEffect, useState } from "react";
import {
    Search,
    Check,
    X,
    Eye,
    Users,
    Clock,
    CheckCircle,
    XCircle,
    RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api";

const AcceptOrRejectMentors = () => {
    const navigate = useNavigate();

    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const [processingId, setProcessingId] = useState(null);

    // =====================================================
    // FETCH PENDING + ACCEPTED + REJECTED MENTORS
    // =====================================================

    const fetchMentors = async () => {
        try {
            setLoading(true);

            console.log("Fetching mentors...");

            // Pending mentors
            const pendingResponse = await api.get("/mentors");

            console.log(
                "Pending mentors:",
                pendingResponse.data
            );

            // Accepted mentors
            const acceptedResponse = await api.get(
                "/accepted-mentors"
            );

            console.log(
                "Accepted mentors:",
                acceptedResponse.data
            );

            // Rejected mentors
            const rejectedResponse = await api.get(
                "/rejected-mentors"
            );

            console.log(
                "Rejected mentors:",
                rejectedResponse.data
            );

            const pendingMentors =
                pendingResponse.data?.data || [];

            const acceptedMentors =
                acceptedResponse.data?.data || [];

            const rejectedMentors =
                rejectedResponse.data?.data || [];

            // Combine all mentors
            const allMentors = [
                ...pendingMentors,
                ...acceptedMentors,
                ...rejectedMentors,
            ];

            // Remove duplicate mentors
            const uniqueMentors = Array.from(
                new Map(
                    allMentors.map((mentor) => [
                        mentor._id,
                        mentor,
                    ])
                ).values()
            );

            console.log(
                "All mentors:",
                uniqueMentors
            );

            setMentors(uniqueMentors);
        } catch (error) {
            console.error(
                "Error fetching mentors:",
                error
            );

            console.error(
                "Error response:",
                error.response?.data
            );

            toast.error(
                error.response?.data?.detail ||
                    "Failed to load mentors"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMentors();
    }, []);

    // =====================================================
    // GET MENTOR STATUS
    // =====================================================

    const getStatus = (mentor) => {
        if (mentor.accepted === "true") {
            return "accepted";
        }

        if (
            typeof mentor.accepted === "string" &&
            mentor.accepted.toLowerCase() === "rejected"
        ) {
            return "rejected";
        }

        return "pending";
    };

    // =====================================================
    // ACCEPT MENTOR
    // =====================================================

    const handleAccept = async (mentor) => {
        try {
            setProcessingId(mentor._id);

            await api.post(
                `/mentors/${mentor._id}/approve`
            );

            toast.success(
                "Mentor approved successfully"
            );

            // Update frontend immediately
            setMentors((prev) =>
                prev.map((item) =>
                    item._id === mentor._id
                        ? {
                              ...item,
                              accepted: "true",
                          }
                        : item
                )
            );
        } catch (error) {
            console.error(
                "Accept mentor error:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                    "Failed to approve mentor"
            );
        } finally {
            setProcessingId(null);
        }
    };

    // =====================================================
    // REJECT MENTOR
    // =====================================================

    const handleReject = async (mentor) => {
        try {
            setProcessingId(mentor._id);

            await api.post(
                `/mentors/${mentor._id}/reject`
            );

            toast.success(
                "Mentor rejected successfully"
            );

            // Update frontend immediately
            setMentors((prev) =>
                prev.map((item) =>
                    item._id === mentor._id
                        ? {
                              ...item,
                              accepted: "rejected",
                          }
                        : item
                )
            );
        } catch (error) {
            console.error(
                "Reject mentor error:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                    "Failed to reject mentor"
            );
        } finally {
            setProcessingId(null);
        }
    };

    // =====================================================
    // SEARCH + TAB FILTER
    // =====================================================

    const filteredMentors = mentors.filter((mentor) => {
        const status = getStatus(mentor);

        const fullName =
            `${mentor.firstName || ""} ${
                mentor.lastName || ""
            }`.toLowerCase();

        const jobTitle =
            mentor.jobTitle?.toLowerCase() || "";

        const category =
            mentor.category?.toLowerCase() || "";

        const company =
            mentor.company?.toLowerCase() || "";

        const searchValue =
            search.toLowerCase();

        const matchesSearch =
            fullName.includes(searchValue) ||
            jobTitle.includes(searchValue) ||
            category.includes(searchValue) ||
            company.includes(searchValue);

        const matchesTab =
            activeTab === "all" ||
            status === activeTab;

        return (
            matchesSearch &&
            matchesTab
        );
    });

    // =====================================================
    // COUNTS
    // =====================================================

    const pendingCount = mentors.filter(
        (mentor) =>
            getStatus(mentor) === "pending"
    ).length;

    const acceptedCount = mentors.filter(
        (mentor) =>
            getStatus(mentor) === "accepted"
    ).length;

    const rejectedCount = mentors.filter(
        (mentor) =>
            getStatus(mentor) === "rejected"
    ).length;

    // =====================================================
    // STATUS BADGE
    // =====================================================

    const StatusBadge = ({ status }) => {
        if (status === "accepted") {
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                    <CheckCircle size={13} />
                    Accepted
                </span>
            );
        }

        if (status === "rejected") {
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                    <XCircle size={13} />
                    Rejected
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">
                <Clock size={13} />
                Pending
            </span>
        );
    };

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-green-600" />

                    <p className="mt-4 text-sm text-gray-500">
                        Loading mentors...
                    </p>
                </div>
            </div>
        );
    }

    // =====================================================
    // UI
    // =====================================================

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>
                    <h1 className="text-2xl font-bold text-[#163b35]">
                        Mentor Management
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Review, approve and manage mentors
                        on MentorHub.
                    </p>
                </div>

                <button
                    onClick={fetchMentors}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#dce8df] bg-white px-4 py-2.5 text-sm font-semibold text-[#176b5c] transition hover:bg-[#f5f7f2]"
                >
                    <RefreshCw size={17} />
                    Refresh
                </button>
            </div>

            {/* STAT CARDS */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                {/* TOTAL */}
                <div className="rounded-2xl border border-[#dce8df] bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-sm font-medium text-gray-500">
                                Total Mentors
                            </p>

                            <h2 className="mt-2 text-3xl font-bold text-[#163b35]">
                                {mentors.length}
                            </h2>
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <Users size={21} />
                        </div>

                    </div>
                </div>

                {/* PENDING */}
                <div className="rounded-2xl border border-[#dce8df] bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-sm font-medium text-gray-500">
                                Pending
                            </p>

                            <h2 className="mt-2 text-3xl font-bold text-orange-600">
                                {pendingCount}
                            </h2>
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                            <Clock size={21} />
                        </div>

                    </div>
                </div>

                {/* ACCEPTED */}
                <div className="rounded-2xl border border-[#dce8df] bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-sm font-medium text-gray-500">
                                Accepted
                            </p>

                            <h2 className="mt-2 text-3xl font-bold text-green-600">
                                {acceptedCount}
                            </h2>
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
                            <CheckCircle size={21} />
                        </div>

                    </div>
                </div>

                {/* REJECTED */}
                <div className="rounded-2xl border border-[#dce8df] bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-sm font-medium text-gray-500">
                                Rejected
                            </p>

                            <h2 className="mt-2 text-3xl font-bold text-red-600">
                                {rejectedCount}
                            </h2>
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                            <XCircle size={21} />
                        </div>

                    </div>
                </div>

            </div>

            {/* MAIN LIST */}
            <div className="overflow-hidden rounded-2xl border border-[#dce8df] bg-white shadow-sm">

                {/* SEARCH + TABS */}
                <div className="border-b border-gray-100 p-5">

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                        {/* SEARCH */}
                        <div className="relative w-full lg:max-w-md">

                            <Search
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />

                            <input
                                type="text"
                                value={search}
                                onChange={(e) =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                                placeholder="Search mentors..."
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100"
                            />

                        </div>

                        {/* TABS */}
                        <div className="flex flex-wrap gap-2">

                            <button
                                onClick={() =>
                                    setActiveTab("all")
                                }
                                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                                    activeTab === "all"
                                        ? "bg-[#103d35] text-white"
                                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                }`}
                            >
                                All ({mentors.length})
                            </button>

                            <button
                                onClick={() =>
                                    setActiveTab("pending")
                                }
                                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                                    activeTab === "pending"
                                        ? "bg-orange-500 text-white"
                                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                }`}
                            >
                                Pending ({pendingCount})
                            </button>

                            <button
                                onClick={() =>
                                    setActiveTab("accepted")
                                }
                                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                                    activeTab === "accepted"
                                        ? "bg-green-600 text-white"
                                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                }`}
                            >
                                Accepted ({acceptedCount})
                            </button>

                            <button
                                onClick={() =>
                                    setActiveTab("rejected")
                                }
                                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                                    activeTab === "rejected"
                                        ? "bg-red-600 text-white"
                                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                }`}
                            >
                                Rejected ({rejectedCount})
                            </button>

                        </div>
                    </div>
                </div>

                {/* NO DATA */}
                {filteredMentors.length === 0 ? (
                    <div className="flex min-h-[300px] items-center justify-center p-8">

                        <div className="text-center">

                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                                <Users
                                    size={28}
                                    className="text-gray-400"
                                />
                            </div>

                            <h3 className="mt-4 text-lg font-semibold text-gray-800">
                                No mentors found
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                                Try changing your search or filter.
                            </p>

                        </div>

                    </div>
                ) : (

                    /* MENTOR LIST */
                    <div className="divide-y divide-gray-100">

                        {filteredMentors.map((mentor) => {

                            const status =
                                getStatus(mentor);

                            const isProcessing =
                                processingId ===
                                mentor._id;

                            return (
                                <div
                                    key={mentor._id}
                                    className="p-5 transition hover:bg-[#fafcf9]"
                                >

                                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center">

                                        {/* MENTOR INFO */}
                                        <div className="flex min-w-0 flex-1 items-center gap-4">

                                            {/* PROFILE IMAGE */}
                                            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">

                                                {mentor.profilePic ? (
                                                    <img
                                                        src={`data:${
                                                            mentor.profilePicType ||
                                                            "image/jpeg"
                                                        };base64,${
                                                            mentor.profilePic
                                                        }`}
                                                        alt={`${mentor.firstName || ""} ${
                                                            mentor.lastName || ""
                                                        }`}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-xl font-bold text-gray-400">
                                                        {mentor.firstName
                                                            ?.charAt(0)
                                                            ?.toUpperCase() ||
                                                            "M"}
                                                    </div>
                                                )}

                                            </div>

                                            {/* DETAILS */}
                                            <div className="min-w-0">

                                                <div className="flex flex-wrap items-center gap-2">

                                                    <h3 className="font-bold text-gray-900">
                                                        {
                                                            mentor.firstName
                                                        }{" "}
                                                        {
                                                            mentor.lastName
                                                        }
                                                    </h3>

                                                    <StatusBadge
                                                        status={
                                                            status
                                                        }
                                                    />

                                                </div>

                                                <p className="mt-1 text-sm font-medium text-green-600">
                                                    {mentor.jobTitle ||
                                                        "Mentor"}
                                                </p>

                                                {mentor.company && (
                                                    <p className="text-sm text-gray-500">
                                                        {
                                                            mentor.company
                                                        }
                                                    </p>
                                                )}

                                                {mentor.category && (
                                                    <p className="mt-1 text-xs text-gray-400">
                                                        {
                                                            mentor.category
                                                        }
                                                    </p>
                                                )}

                                            </div>
                                        </div>

                                        {/* ACTIONS */}
                                        <div className="flex flex-wrap items-center gap-2">

                                            {/* VIEW */}
                                            <button
                                                onClick={() =>
                                                    navigate(
                                                        `/admin/mentors/${mentor._id}`
                                                    )
                                                }
                                                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50"
                                            >
                                                <Eye size={16} />
                                                View
                                            </button>

                                            {/* ACCEPT + REJECT
                                                ONLY PENDING */}
                                            {status === "pending" && (
                                                <>
                                                    <button
                                                        disabled={
                                                            isProcessing
                                                        }
                                                        onClick={() =>
                                                            handleAccept(
                                                                mentor
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        <Check
                                                            size={16}
                                                        />

                                                        {isProcessing
                                                            ? "Processing..."
                                                            : "Accept"}
                                                    </button>

                                                    <button
                                                        disabled={
                                                            isProcessing
                                                        }
                                                        onClick={() =>
                                                            handleReject(
                                                                mentor
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        <X
                                                            size={16}
                                                        />

                                                        {isProcessing
                                                            ? "Processing..."
                                                            : "Reject"}
                                                    </button>
                                                </>
                                            )}

                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                    </div>
                )}
            </div>
        </div>
    );
};

export default AcceptOrRejectMentors;

