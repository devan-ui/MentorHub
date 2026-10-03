import React, { useEffect, useState } from "react";
import api from "../api";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    UserRoundCheck,
    Handshake,
    Building2,
    CalendarDays,
    CreditCard,
    Flag,
    Star,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronDown,
} from "lucide-react";

const Admin = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [pendingMentors, setPendingMentors] = useState(0);

    const menuItems = [
        {
            title: "Dashboard",
            icon: LayoutDashboard,
            path: "/Admin",
        },
        {
            title: "Mentors",
            icon: UserRoundCheck,
            path: "/admin/accept-reject-mentors",
        },
        {
            title: "Mentees",
            icon: Users,
            path: "/admin/Mentees-Admin",
        },
        {
            title: "Mentorships",
            icon: Handshake,
            path: "/admin/mentorships",
        },
        {
            title: "Communities",
            icon: Building2,
            path: "/admin/communities",
        },
        {
            title: "Sessions",
            icon: CalendarDays,
            path: "/admin/sessions",
        },
        {
            title: "Payments",
            icon: CreditCard,
            path: "/admin/payments",
        },
        {
            title: "Reports",
            icon: Flag,
            path: "/admin/reports",
        },
        {
            title: "Reviews",
            icon: Star,
            path: "/admin/reviews",
        },
    ];

    const handleLogout = () => {
        localStorage.removeItem("adminToken");
        navigate("/login");
    };

    const isActive = (path) => {
        if (path === "/admin") {
            return location.pathname === "/admin";
        }

        return location.pathname.startsWith(path);
    };

    useEffect(() => {
        const fetchPendingMentors = async () => {
            try {
                const response = await api.get("/mentors/pending/count");

                setPendingMentors(response.data?.count || 0);
            } catch (error) {
                console.error("Failed to fetch pending mentors:", error);
                setPendingMentors(0);
            }
        };

        fetchPendingMentors();
    }, []);

    return (
        <div className="min-h-screen bg-[#f5f7f2] text-[#163b35]">

            {/* ================= MOBILE OVERLAY ================= */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ================= SIDEBAR ================= */}
            <aside
                className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-[#dce8df] bg-white transition-transform duration-300
                ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
                lg:translate-x-0`}
            >

                {/* LOGO */}
                <div className="flex h-20 items-center justify-between border-b border-[#edf2ee] px-6">

                    <button
                        onClick={() => navigate("/admin")}
                        className="flex items-center gap-3"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#103d35] text-lg font-bold text-white">
                            M
                        </div>

                        <div className="text-left">
                            <h1 className="text-lg font-bold tracking-tight text-[#163b35]">
                                Mentor<span className="text-[#2c8b77]">Hub</span>
                            </h1>

                            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                                Admin Panel
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


                {/* MENU */}
                <div className="flex-1 overflow-y-auto px-4 py-6">

                    <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                        Overview
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
                                    className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition
                                    ${active
                                            ? "bg-[#eaf6ed] text-[#176b5c]"
                                            : "text-gray-500 hover:bg-[#f5f7f2] hover:text-[#176b5c]"
                                        }`}
                                >

                                    <Icon
                                        size={19}
                                        className={
                                            active
                                                ? "text-[#176b5c]"
                                                : "text-gray-400 group-hover:text-[#176b5c]"
                                        }
                                    />

                                    <span>{item.title}</span>

                                    {item.title === "Mentors" && pendingMentors > 0 && (
                                        <span className="ml-auto rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-600">
                                            {pendingMentors}
                                        </span>
                                    )}

                                </button>
                            );
                        })}

                    </nav>


                    {/* MANAGEMENT */}
                    <p className="mb-3 mt-8 px-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                        Management
                    </p>

                    <button
                        onClick={() => navigate("/admin/settings")}
                        className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition
                        ${isActive("/admin/settings")
                                ? "bg-[#eaf6ed] text-[#176b5c]"
                                : "text-gray-500 hover:bg-[#f5f7f2] hover:text-[#176b5c]"
                            }`}
                    >
                        <Settings size={19} className="text-gray-400" />
                        Settings
                    </button>

                </div>


                {/* ADMIN PROFILE */}
                <div className="border-t border-[#edf2ee] p-4">

                    <div className="flex items-center gap-3 rounded-xl bg-[#f5f7f2] p-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#103d35] text-sm font-bold text-white">
                            A
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-[#163b35]">
                                Administrator
                            </p>

                            <p className="text-xs text-gray-500">
                                Super Admin
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


            {/* ================= MAIN ================= */}
            <div className="lg:ml-64">

                {/* ================= TOP NAVBAR ================= */}
                <header className="sticky top-0 z-30 h-20 border-b border-[#dce8df] bg-[#f5f7f2]/95 backdrop-blur-md">

                    <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">

                        <div className="flex items-center gap-3">

                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="rounded-xl border border-[#dce8df] bg-white p-2.5 text-[#176b5c] lg:hidden"
                            >
                                <Menu size={20} />
                            </button>

                            <div>
                                <p className="text-xs text-gray-400">
                                    MentorHub
                                </p>

                                <h2 className="text-lg font-semibold text-[#163b35]">
                                    Administration
                                </h2>
                            </div>

                        </div>


                        <div className="flex items-center gap-3">

                            {/* NOTIFICATION */}
                            <button
                                className="relative rounded-xl border border-[#dce8df] bg-white p-2.5 text-gray-500 transition hover:text-[#176b5c]"
                            >
                                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500"></span>

                                <svg
                                    width="19"
                                    height="19"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                </svg>
                            </button>


                            {/* PROFILE */}
                            <div className="relative">

                                <button
                                    onClick={() => setProfileOpen(!profileOpen)}
                                    className="flex items-center gap-2 rounded-xl border border-[#dce8df] bg-white px-3 py-2 transition hover:border-[#b9d3c4]"
                                >

                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#103d35] text-xs font-bold text-white">
                                        A
                                    </div>

                                    <div className="hidden text-left sm:block">
                                        <p className="text-xs font-semibold text-[#163b35]">
                                            Admin
                                        </p>

                                        <p className="text-[10px] text-gray-400">
                                            Super Admin
                                        </p>
                                    </div>

                                    <ChevronDown
                                        size={15}
                                        className="text-gray-400"
                                    />

                                </button>


                                {profileOpen && (
                                    <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-[#dce8df] bg-white p-1 shadow-xl">

                                        <button
                                            onClick={() => {
                                                setProfileOpen(false);
                                                navigate("/admin/settings");
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


                {/* ================= PAGE CONTENT ================= */}
                <main className="p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </main>

            </div>

        </div>
    );
};

export default Admin;