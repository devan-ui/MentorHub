import React, { useEffect, useState } from "react";
import {
    Search,
    Eye,
    Users,
    UserCheck,
    UserX,
    RefreshCw,
    Mail,
    Phone,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api";

const Mentees = () => {
    const navigate = useNavigate();

    const [mentees, setMentees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const [processingId, setProcessingId] = useState(null);

    // =====================================================
    // FETCH MENTEES
    // =====================================================

    const fetchMentees = async () => {
        try {
            setLoading(true);

            const response = await api.get("/mentees");

            console.log("=================================");
            console.log("FULL API RESPONSE:", response.data);
            console.log("=================================");

            const users = response.data?.data || [];

            console.log("USERS:", users);
            console.log("USER COUNT:", users.length);

            setMentees(Array.isArray(users) ? users : []);

        } catch (error) {
            console.error("FETCH ERROR:", error);
            console.error(
                "ERROR RESPONSE:",
                error.response?.data
            );

            toast.error(
                error.response?.data?.detail ||
                    "Failed to load mentees"
            );

            setMentees([]);

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMentees();
    }, []);

    // =====================================================
    // GET STATUS
    // =====================================================

    const getStatus = (mentee) => {
        const status =
            mentee.status ||
            mentee.accountStatus ||
            "active";

        return status.toLowerCase() === "blocked"
            ? "blocked"
            : "active";
    };

    // =====================================================
    // GET NAME
    // =====================================================

    const getName = (mentee) => {

        // firstName + lastName
        if (
            mentee.firstName ||
            mentee.lastName
        ) {
            return `${mentee.firstName || ""} ${
                mentee.lastName || ""
            }`.trim();
        }

        // userName
        if (mentee.userName) {
            return mentee.userName;
        }

        // username
        if (mentee.username) {
            return mentee.username;
        }

        return "Mentee";
    };

    // =====================================================
    // GET PROFILE IMAGE
    // =====================================================

    const getProfileImage = (mentee) => {
        if (!mentee.profilePic) {
            return null;
        }

        return `data:${
            mentee.profilePicType || "image/jpeg"
        };base64,${mentee.profilePic}`;
    };

    // =====================================================
    // BLOCK MENTEE
    // =====================================================

    const handleBlock = async (mentee) => {
        try {
            setProcessingId(mentee._id);

            await api.post(
                `/mentees/${mentee._id}/block`
            );

            setMentees((previous) =>
                previous.map((item) =>
                    item._id === mentee._id
                        ? {
                              ...item,
                              status: "blocked",
                          }
                        : item
                )
            );

            toast.success(
                "Mentee blocked successfully"
            );

        } catch (error) {
            console.error(
                "BLOCK ERROR:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                    "Failed to block mentee"
            );

        } finally {
            setProcessingId(null);
        }
    };

    // =====================================================
    // UNBLOCK MENTEE
    // =====================================================

    const handleUnblock = async (mentee) => {
        try {
            setProcessingId(mentee._id);

            await api.post(
                `/mentees/${mentee._id}/unblock`
            );

            setMentees((previous) =>
                previous.map((item) =>
                    item._id === mentee._id
                        ? {
                              ...item,
                              status: "active",
                          }
                        : item
                )
            );

            toast.success(
                "Mentee unblocked successfully"
            );

        } catch (error) {
            console.error(
                "UNBLOCK ERROR:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                    "Failed to unblock mentee"
            );

        } finally {
            setProcessingId(null);
        }
    };

    // =====================================================
    // SEARCH + FILTER
    // =====================================================

    const filteredMentees = mentees.filter(
        (mentee) => {

            const status =
                getStatus(mentee);

            const name =
                getName(mentee).toLowerCase();

            const email =
                (
                    mentee.email || ""
                ).toLowerCase();

            const phone =
                (
                    mentee.phone || ""
                ).toLowerCase();

            const searchText =
                search.toLowerCase().trim();

            const matchesSearch =
                name.includes(searchText) ||
                email.includes(searchText) ||
                phone.includes(searchText);

            const matchesStatus =
                activeTab === "all" ||
                status === activeTab;

            return (
                matchesSearch &&
                matchesStatus
            );
        }
    );

    // =====================================================
    // COUNTS
    // =====================================================

    const activeCount =
        mentees.filter(
            (mentee) =>
                getStatus(mentee) === "active"
        ).length;

    const blockedCount =
        mentees.filter(
            (mentee) =>
                getStatus(mentee) === "blocked"
        ).length;

    // =====================================================
    // STATUS BADGE
    // =====================================================

    const StatusBadge = ({ status }) => {

        if (status === "blocked") {
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                    <UserX size={13} />
                    Blocked
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                <UserCheck size={13} />
                Active
            </span>
        );
    };

    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatDate = (date) => {

        if (!date) {
            return "—";
        }

        const parsedDate =
            new Date(date);

        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {
            return "—";
        }

        return parsedDate.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
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
                        Loading mentees...
                    </p>

                </div>

            </div>
        );
    }

    // =====================================================
    // PAGE
    // =====================================================

    return (
        <div className="space-y-6">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>

                    <h1 className="text-2xl font-bold text-[#163b35]">
                        Mentee Management
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        View and manage registered
                        mentees on MentorHub.
                    </p>

                </div>

                <button
                    onClick={fetchMentees}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#dce8df] bg-white px-4 py-2.5 text-sm font-semibold text-[#176b5c] transition hover:bg-[#f5f7f2]"
                >
                    <RefreshCw size={17} />
                    Refresh
                </button>

            </div>

            {/* =================================================
                STAT CARDS
            ================================================= */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

                {/* TOTAL */}

                <div className="rounded-2xl border border-[#dce8df] bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="text-sm font-medium text-gray-500">
                                Total Mentees
                            </p>

                            <h2 className="mt-2 text-3xl font-bold text-[#163b35]">
                                {mentees.length}
                            </h2>

                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <Users size={21} />
                        </div>

                    </div>

                </div>

                {/* ACTIVE */}

                <div className="rounded-2xl border border-[#dce8df] bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="text-sm font-medium text-gray-500">
                                Active
                            </p>

                            <h2 className="mt-2 text-3xl font-bold text-green-600">
                                {activeCount}
                            </h2>

                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
                            <UserCheck size={21} />
                        </div>

                    </div>

                </div>

                {/* BLOCKED */}

                <div className="rounded-2xl border border-[#dce8df] bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="text-sm font-medium text-gray-500">
                                Blocked
                            </p>

                            <h2 className="mt-2 text-3xl font-bold text-red-600">
                                {blockedCount}
                            </h2>

                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                            <UserX size={21} />
                        </div>

                    </div>

                </div>

            </div>

            {/* =================================================
                LIST
            ================================================= */}

            <div className="overflow-hidden rounded-2xl border border-[#dce8df] bg-white shadow-sm">

                {/* SEARCH + FILTER */}

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
                                placeholder="Search mentees..."
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100"
                            />

                        </div>

                        {/* TABS */}

                        <div className="flex flex-wrap gap-2">

                            <button
                                onClick={() =>
                                    setActiveTab(
                                        "all"
                                    )
                                }
                                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                                    activeTab ===
                                    "all"
                                        ? "bg-[#103d35] text-white"
                                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                }`}
                            >
                                All ({mentees.length})
                            </button>

                            <button
                                onClick={() =>
                                    setActiveTab(
                                        "active"
                                    )
                                }
                                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                                    activeTab ===
                                    "active"
                                        ? "bg-green-600 text-white"
                                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                }`}
                            >
                                Active ({activeCount})
                            </button>

                            <button
                                onClick={() =>
                                    setActiveTab(
                                        "blocked"
                                    )
                                }
                                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                                    activeTab ===
                                    "blocked"
                                        ? "bg-red-600 text-white"
                                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                }`}
                            >
                                Blocked ({blockedCount})
                            </button>

                        </div>

                    </div>

                </div>

                {/* =================================================
                    EMPTY STATE
                ================================================= */}

                {filteredMentees.length === 0 ? (

                    <div className="flex min-h-[300px] items-center justify-center p-8">

                        <div className="text-center">

                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">

                                <Users
                                    size={28}
                                    className="text-gray-400"
                                />

                            </div>

                            <h3 className="mt-4 text-lg font-semibold text-gray-800">
                                No mentees found
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                                {mentees.length === 0
                                    ? "There are no registered users."
                                    : "Try changing your search or filter."
                                }
                            </p>

                        </div>

                    </div>

                ) : (

                    /* =================================================
                        USERS
                    ================================================= */

                    <div className="divide-y divide-gray-100">

                        {filteredMentees.map(
                            (mentee) => {

                                const status =
                                    getStatus(
                                        mentee
                                    );

                                const isProcessing =
                                    processingId ===
                                    mentee._id;

                                const name =
                                    getName(
                                        mentee
                                    );

                                const profileImage =
                                    getProfileImage(
                                        mentee
                                    );

                                return (
                                    <div
                                        key={
                                            mentee._id
                                        }
                                        className="p-5 transition hover:bg-[#fafcf9]"
                                    >

                                        <div className="flex flex-col gap-5 xl:flex-row xl:items-center">

                                            {/* USER INFO */}

                                            <div className="flex min-w-0 flex-1 items-center gap-4">

                                                {/* PROFILE */}

                                                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">

                                                    {profileImage ? (

                                                        <img
                                                            src={
                                                                profileImage
                                                            }
                                                            alt={
                                                                name
                                                            }
                                                            className="h-full w-full object-cover"
                                                        />

                                                    ) : (

                                                        <div className="flex h-full w-full items-center justify-center text-xl font-bold text-gray-400">
                                                            {name
                                                                .charAt(
                                                                    0
                                                                )
                                                                .toUpperCase()}
                                                        </div>

                                                    )}

                                                </div>

                                                {/* DETAILS */}

                                                <div className="min-w-0">

                                                    <div className="flex flex-wrap items-center gap-2">

                                                        <h3 className="font-bold text-gray-900">
                                                            {
                                                                name
                                                            }
                                                        </h3>

                                                        <StatusBadge
                                                            status={
                                                                status
                                                            }
                                                        />

                                                    </div>

                                                    {mentee.email && (
                                                        <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">

                                                            <Mail
                                                                size={
                                                                    14
                                                                }
                                                            />

                                                            {
                                                                mentee.email
                                                            }

                                                        </p>
                                                    )}

                                                    {mentee.phone && (
                                                        <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">

                                                            <Phone
                                                                size={
                                                                    14
                                                                }
                                                            />

                                                            {
                                                                mentee.phone
                                                            }

                                                        </p>
                                                    )}

                                                    <p className="mt-1 text-xs text-gray-400">

                                                        Joined{" "}

                                                        {formatDate(
                                                            mentee.createdAt ||
                                                                mentee.created_at ||
                                                                mentee.registeredAt
                                                        )}

                                                    </p>

                                                </div>

                                            </div>

                                            {/* ACTIONS */}

                                            <div className="flex flex-wrap items-center gap-2">

                                                {/* VIEW */}

                                                <button
                                                    onClick={() =>
                                                        navigate(
                                                            `/admin/mentees/${mentee._id}`
                                                        )
                                                    }
                                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                                                >
                                                    <Eye
                                                        size={
                                                            16
                                                        }
                                                    />

                                                    View
                                                </button>

                                                {/* BLOCK */}

                                                {status ===
                                                "active" ? (

                                                    <button
                                                        disabled={
                                                            isProcessing
                                                        }
                                                        onClick={() =>
                                                            handleBlock(
                                                                mentee
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >

                                                        <UserX
                                                            size={
                                                                16
                                                            }
                                                        />

                                                        {isProcessing
                                                            ? "Processing..."
                                                            : "Block"}

                                                    </button>

                                                ) : (

                                                    /* UNBLOCK */

                                                    <button
                                                        disabled={
                                                            isProcessing
                                                        }
                                                        onClick={() =>
                                                            handleUnblock(
                                                                mentee
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >

                                                        <UserCheck
                                                            size={
                                                                16
                                                            }
                                                        />

                                                        {isProcessing
                                                            ? "Processing..."
                                                            : "Unblock"}

                                                    </button>

                                                )}

                                            </div>

                                        </div>

                                    </div>
                                );
                            }
                        )}

                    </div>

                )}

            </div>

        </div>
    );
};

export default Mentees;