
import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import api from "../api.js";

import {
    LayoutDashboard,
    Users,
    Building2,
    CalendarDays,
    MessageCircle,
    CreditCard,
    Star,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronDown,
    Bell,
} from "lucide-react";

const Mentor = () => {

    const navigate = useNavigate();
    const location = useLocation();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    const [mentor, setMentor] = useState(null);
    const [loading, setLoading] = useState(true);


    /* =================================================
                        FETCH MENTOR
       ================================================= */

    useEffect(() => {

        const fetchMentor = async () => {
            const rawId = localStorage.getItem("mentorId") || "";
            const mentorId = rawId.replace(/['"]+/g, "").trim();
            const token = localStorage.getItem("mentorToken");
            const mentorEmail = localStorage.getItem("mentorEmail");

            if (!token) {
                navigate("/login");
                return;
            }

            let mentorData = null;
            try {
                const targetQuery = mentorId || mentorEmail;
                if (targetQuery) {
                    const response = await api.get(`/mentors/${targetQuery}`);
                    if (response.data?.data) {
                        mentorData = response.data.data;
                    }
                }
            } catch (error) {
                console.warn("Primary mentor fetch attempt failed, trying email fallback:", error);
                if (mentorEmail && mentorEmail !== mentorId) {
                    try {
                        const fallbackRes = await api.get(`/mentors/${mentorEmail}`);
                        if (fallbackRes.data?.data) {
                            mentorData = fallbackRes.data.data;
                            localStorage.setItem("mentorId", mentorData._id);
                        }
                    } catch (e2) {
                        console.error("Fallback fetch failed:", e2);
                    }
                }
            }

            if (mentorData) {
                setMentor(mentorData);
                if (!mentorId && mentorData._id) {
                    localStorage.setItem("mentorId", mentorData._id);
                }
            } else {
                // If token exists but network/profile is slow, keep mentor logged in with stored state
                const storedName = localStorage.getItem("mentorName") || "Mentor";
                setMentor({
                    firstName: storedName.split(" ")[0] || "Mentor",
                    lastName: storedName.split(" ").slice(1).join(" ") || "",
                    email: mentorEmail || "",
                    jobTitle: "Verified Mentor",
                    _id: mentorId || "",
                });
            }

            setLoading(false);
        };

        fetchMentor();

    }, [navigate]);


    /* =================================================
                        MENTOR NAME
       ================================================= */

    const mentorName = mentor
        ? `${mentor.firstName || ""} ${mentor.lastName || ""}`.trim()
        : "Mentor";


    /* =================================================
                        PROFILE IMAGE
       ================================================= */

    const profileImage = mentor?.profilePic
        ? `data:${mentor.profilePicType || "image/jpeg"};base64,${mentor.profilePic}`
        : null;


    /* =================================================
                        INITIAL
       ================================================= */

    const mentorInitial =
        mentorName !== "Mentor"
            ? mentorName.charAt(0).toUpperCase()
            : "M";


    /* =================================================
                        MENU ITEMS
       ================================================= */

    const menuItems = [

        {
            title: "Dashboard",
            icon: LayoutDashboard,
            path: "/mentor",
        },

        {
            title: "My Mentees",
            icon: Users,
            path: "/mentor/mentees",
        },

        {
            title: "My Community",
            icon: Building2,
            path: "/mentor/community",
        },

        {
            title: "Sessions",
            icon: CalendarDays,
            path: "/mentor/sessions",
        },

        {
            title: "1-on-1 Direct Chat",
            icon: MessageCircle,
            path: "/mentor/messages",
        },

        {
            title: "Payments",
            icon: CreditCard,
            path: "/mentor/payments",
        },

        {
            title: "Reviews",
            icon: Star,
            path: "/mentor/reviews",
        },

    ];


    /* =================================================
                        LOGOUT
       ================================================= */

    const handleLogout = () => {

        localStorage.removeItem("mentorToken");
        localStorage.removeItem("mentorId");

        navigate("/login");

    };


    /* =================================================
                        ACTIVE MENU
       ================================================= */

    const isActive = (path) => {

        if (path === "/mentor") {
            return location.pathname === "/mentor";
        }

        return location.pathname.startsWith(path);

    };


    /* =================================================
                        LOADING
       ================================================= */

    if (loading) {

        return (
            <div className="flex min-h-screen items-center justify-center bg-[#f5f7f2]">

                <div className="text-center">

                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#dce8df] border-t-[#176b5c]" />

                    <p className="mt-4 text-sm text-gray-500">
                        Loading mentor...
                    </p>

                </div>

            </div>
        );

    }


    /* =================================================
                        NO MENTOR
       ================================================= */

    if (!mentor) {

        return (
            <div className="flex min-h-screen items-center justify-center bg-[#f5f7f2]">

                <div className="text-center">

                    <p className="text-lg font-semibold text-[#163b35]">
                        Mentor information not found
                    </p>

                    <button
                        onClick={() => navigate("/login")}
                        className="mt-4 rounded-xl bg-[#103d35] px-5 py-2.5 text-sm font-semibold text-white"
                    >
                        Go to Login
                    </button>

                </div>

            </div>
        );

    }


    return (

        <div className="min-h-screen bg-[#f5f7f2] text-[#163b35]">


            {/* =================================================
                            MOBILE OVERLAY
               ================================================= */}

            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}


            {/* =================================================
                                SIDEBAR
               ================================================= */}

            <aside
                className={`
                    fixed left-0 top-0 z-50
                    flex h-screen w-64 flex-col
                    border-r border-[#dce8df]
                    bg-white
                    transition-transform duration-300
                    ${
                        sidebarOpen
                            ? "translate-x-0"
                            : "-translate-x-full"
                    }
                    lg:translate-x-0
                `}
            >


                {/* LOGO */}

                <div className="flex h-20 items-center justify-between border-b border-[#edf2ee] px-6">

                    <button
                        onClick={() => navigate("/mentor")}
                        className="flex items-center gap-3"
                    >

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#103d35] text-lg font-bold text-white">
                            M
                        </div>

                        <div className="text-left">

                            <h1 className="text-lg font-bold tracking-tight text-[#163b35]">
                                Mentor
                                <span className="text-[#2c8b77]">
                                    Hub
                                </span>
                            </h1>

                            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                                Mentor Panel
                            </p>

                        </div>

                    </button>


                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
                    >
                        <X size={20} />
                    </button>

                </div>


                {/* NAVIGATION */}

                <div className="flex-1 overflow-y-auto px-4 py-6">

                    <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                        Workspace
                    </p>

                    <nav className="space-y-1">

                        {menuItems.map((item) => {

                            const Icon = item.icon;
                            const active = isActive(item.path);

                            return (
                                <button
                                    key={item.title}
                                    onClick={() => {

                                        navigate(item.path);
                                        setSidebarOpen(false);

                                    }}
                                    className={`
                                        group flex w-full
                                        items-center gap-3
                                        rounded-xl px-3 py-3
                                        text-sm font-medium
                                        transition
                                        ${
                                            active
                                                ? "bg-[#eaf6ed] text-[#176b5c]"
                                                : "text-gray-500 hover:bg-[#f5f7f2] hover:text-[#176b5c]"
                                        }
                                    `}
                                >

                                    <Icon
                                        size={19}
                                        className={
                                            active
                                                ? "text-[#176b5c]"
                                                : "text-gray-400 group-hover:text-[#176b5c]"
                                        }
                                    />

                                    <span>
                                        {item.title}
                                    </span>

                                    {item.title === "Messages" && (
                                        <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                                            3
                                        </span>
                                    )}

                                </button>
                            );

                        })}

                    </nav>


                    {/* ACCOUNT */}

                    <p className="mb-3 mt-8 px-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                        Account
                    </p>

                    <button
                        onClick={() =>
                            navigate("/mentor/settings")
                        }
                        className={`
                            group flex w-full
                            items-center gap-3
                            rounded-xl px-3 py-3
                            text-sm font-medium
                            transition
                            ${
                                isActive("/mentor/settings")
                                    ? "bg-[#eaf6ed] text-[#176b5c]"
                                    : "text-gray-500 hover:bg-[#f5f7f2] hover:text-[#176b5c]"
                            }
                        `}
                    >

                        <Settings
                            size={19}
                            className="text-gray-400 group-hover:text-[#176b5c]"
                        />

                        Settings

                    </button>

                </div>


                {/* SIDEBAR PROFILE */}

                <div className="border-t border-[#edf2ee] p-4">

                    <div className="flex items-center gap-3 rounded-xl bg-[#f5f7f2] p-3">

                        {profileImage ? (

                            <img
                                src={profileImage}
                                alt={mentorName}
                                className="h-10 w-10 rounded-full object-cover"
                            />

                        ) : (

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#103d35] text-sm font-bold text-white">
                                {mentorInitial}
                            </div>

                        )}

                        <div className="min-w-0 flex-1">

                            <p className="truncate text-sm font-semibold text-[#163b35]">
                                {mentorName}
                            </p>

                            <p className="truncate text-xs text-gray-500">
                                {mentor.jobTitle || "Mentor"}
                            </p>

                        </div>

                        <button
                            onClick={handleLogout}
                            title="Logout"
                            className="rounded-lg p-2 text-gray-400 transition hover:bg-white hover:text-red-500"
                        >
                            <LogOut size={17} />
                        </button>

                    </div>

                </div>

            </aside>


            {/* =================================================
                            MAIN CONTENT
               ================================================= */}

            <div className="lg:ml-64">


                {/* TOP NAVBAR */}

                <header className="sticky top-0 z-30 h-20 border-b border-[#dce8df] bg-[#f5f7f2]/95 backdrop-blur-md">

                    <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">


                        {/* LEFT */}

                        <div className="flex items-center gap-3">

                            <button
                                onClick={() =>
                                    setSidebarOpen(true)
                                }
                                className="rounded-xl border border-[#dce8df] bg-white p-2.5 text-[#176b5c] lg:hidden"
                            >
                                <Menu size={20} />
                            </button>

                            <div>

                                <p className="text-xs text-gray-400">
                                    MentorHub
                                </p>

                                <h2 className="text-lg font-semibold text-[#163b35]">
                                    Mentor Workspace
                                </h2>

                            </div>

                        </div>


                        {/* RIGHT */}

                        <div className="flex items-center gap-3">


                            {/* 1-on-1 DIRECT CHAT */}
                            <button
                                onClick={() => navigate("/mentor/messages?tab=direct")}
                                className="relative rounded-xl border border-[#dce8df] bg-white p-2.5 text-gray-500 transition hover:text-[#176b5c] hover:border-[#176b5c]"
                                title="1-on-1 Direct Chat"
                            >
                                <MessageCircle size={19} />
                            </button>

                            {/* NOTIFICATION */}
                            <button
                                onClick={() =>
                                    alert(
                                        "You have 3 new notifications"
                                    )
                                }
                                className="relative rounded-xl border border-[#dce8df] bg-white p-2.5 text-gray-500 transition hover:text-[#176b5c]"
                            >
                                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
                                <Bell size={19} />
                            </button>


                            {/* PROFILE */}

                            <div className="relative">

                                <button
                                    onClick={() =>
                                        setProfileOpen(
                                            !profileOpen
                                        )
                                    }
                                    className="flex items-center gap-2 rounded-xl border border-[#dce8df] bg-white px-3 py-2 transition hover:border-[#b9d3c4]"
                                >

                                    {profileImage ? (

                                        <img
                                            src={profileImage}
                                            alt={mentorName}
                                            className="h-8 w-8 rounded-full object-cover"
                                        />

                                    ) : (

                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#103d35] text-xs font-bold text-white">
                                            {mentorInitial}
                                        </div>

                                    )}

                                    <div className="hidden text-left sm:block">

                                        <p className="text-xs font-semibold text-[#163b35]">
                                            {mentorName}
                                        </p>

                                        <p className="text-[10px] text-gray-400">
                                            {mentor.jobTitle || "Mentor"}
                                        </p>

                                    </div>

                                    <ChevronDown
                                        size={15}
                                        className="text-gray-400"
                                    />

                                </button>


                                {/* PROFILE DROPDOWN */}

                                {profileOpen && (

                                    <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-[#dce8df] bg-white p-1 shadow-xl">

                                        <div className="border-b border-[#edf2ee] px-3 py-3">

                                            <p className="text-sm font-semibold text-[#163b35]">
                                                {mentorName}
                                            </p>

                                            <p className="mt-1 text-xs text-gray-400">
                                                {mentor.email}
                                            </p>

                                            <p className="mt-1 text-xs text-gray-400">
                                                {mentor.jobTitle}
                                                {mentor.company
                                                    ? ` • ${mentor.company}`
                                                    : ""}
                                            </p>

                                            <p className="mt-1 text-xs text-gray-400">
                                                {mentor.category}
                                            </p>

                                        </div>


                                        <button
                                            onClick={() => {

                                                setProfileOpen(false);

                                                navigate(
                                                    "/mentor/settings"
                                                );

                                            }}
                                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-600 hover:bg-[#f5f7f2]"
                                        >

                                            <Settings size={16} />

                                            Settings

                                        </button>


                                        <button
                                            onClick={handleLogout}
                                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-500 hover:bg-red-50"
                                        >

                                            <LogOut size={16} />

                                            Logout

                                        </button>

                                    </div>

                                )}

                            </div>

                        </div>

                    </div>

                </header>


                {/* PAGE CONTENT */}

                <main className="p-4 sm:p-6 lg:p-8">

                    <Outlet />

                </main>

            </div>

        </div>

    );
};

export default Mentor;