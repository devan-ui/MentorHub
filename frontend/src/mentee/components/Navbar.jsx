import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Video,
    MessageSquare,
    User,
    LogOut,
    ChevronDown,
    Sparkles,
} from "lucide-react";
import api from "../../api.js";

const Navbar = ({
    mobileMenu,
    setMobileMenu,
    scrollToSearch,
}) => {
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const isUserLoggedIn = !!localStorage.getItem("userToken");
    const storedName = localStorage.getItem("userName");
    const [realUserName, setRealUserName] = useState(
        storedName && storedName.toLowerCase() !== "mentee" ? storedName : ""
    );
    const userEmail = localStorage.getItem("userEmail") || "";

    // Fetch user's real name from profile if not yet loaded or if it's "Mentee"
    useEffect(() => {
        if (!isUserLoggedIn) return;

        const cached = localStorage.getItem("userName");
        if (cached && cached.toLowerCase() !== "mentee") {
            setRealUserName(cached);
            return;
        }

        const uid = localStorage.getItem("userId") || localStorage.getItem("userEmail");
        if (!uid) return;

        api.get(`/mentee/profile/${uid}`)
            .then((res) => {
                const u = res.data?.data;
                const fetchedName =
                    u?.name ||
                    u?.userName ||
                    u?.username ||
                    (u?.email ? u.email.split("@")[0] : null);
                if (fetchedName && fetchedName.toLowerCase() !== "mentee") {
                    localStorage.setItem("userName", fetchedName);
                    setRealUserName(fetchedName);
                }
            })
            .catch((err) => {
                console.error("Failed to fetch mentee profile in Navbar:", err);
                const email = localStorage.getItem("userEmail");
                if (email) {
                    setRealUserName(email.split("@")[0]);
                }
            });
    }, [isUserLoggedIn]);

    // Keep in sync with storage changes
    useEffect(() => {
        const syncName = () => {
            const cached = localStorage.getItem("userName");
            if (cached && cached.toLowerCase() !== "mentee") {
                setRealUserName(cached);
            }
        };
        window.addEventListener("storage", syncName);
        return () => window.removeEventListener("storage", syncName);
    }, []);

    const displayName =
        realUserName ||
        (storedName && storedName.toLowerCase() !== "mentee" ? storedName : null) ||
        (userEmail ? userEmail.split("@")[0] : "User");

    const userInitial = displayName ? displayName.charAt(0).toUpperCase() : "U";

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("userToken");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userName");
        localStorage.removeItem("userId");
        setRealUserName("");
        setDropdownOpen(false);
        navigate("/login");
    };

    return (
        <header className="sticky top-0 z-50 border-b border-[#123b38]/10 bg-[#fbfaf6]/90 backdrop-blur-xl">

            <div className="w-[92%] max-w-[1180px] mx-auto h-[76px] flex items-center gap-8">

                <Link
                    to="/home"
                    className="flex items-center gap-2.5 mr-auto"
                >
                    <div className="w-10 h-10 rounded-xl bg-[#082f2b] text-white flex items-center justify-center text-xl font-bold -rotate-3">
                        M
                    </div>

                    <span className="text-[23px] font-extrabold tracking-tight">
                        MentorHub
                    </span>
                </Link>

                <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-[#39534e]">

                    <Link
                        to="/mentors"
                        className="hover:text-[#177fc0] transition"
                    >
                        Find Mentors
                    </Link>

                    <Link
                        to="/sessions"
                        className="flex items-center gap-1.5 hover:text-[#177fc0] transition"
                    >
                        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        Live Sessions
                    </Link>

                    {isUserLoggedIn && (
                        <Link
                            to="/messages"
                            className="flex items-center gap-1.5 hover:text-[#177fc0] transition"
                        >
                            <MessageSquare className="w-4 h-4 text-[#177fc0]" />
                            Messages & Chats
                        </Link>
                    )}

                    <a
                        href="/home#categories"
                        className="hover:text-[#177fc0] transition"
                    >
                        Explore Skills
                    </a>

                    <Link
                        to="/mentor/apply"
                        className="hover:text-[#177fc0] transition"
                    >
                        For Mentors
                    </Link>

                </nav>

                <div className="hidden sm:flex items-center gap-3">

                    {isUserLoggedIn ? (
                        /* USER PROFILE DROPDOWN - CONSOLIDATES DASHBOARD, SESSIONS, MESSAGES, PROFILE, LOGOUT */
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen((prev) => !prev)}
                                className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-[#b8c9c2] hover:border-[#082f2b] hover:bg-white bg-white/70 transition shadow-xs cursor-pointer select-none"
                                aria-expanded={dropdownOpen}
                                aria-label="User profile menu"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#082f2b] to-[#177fc0] text-white flex items-center justify-center text-xs font-extrabold shadow-xs">
                                    {userInitial}
                                </div>
                                <span className="text-xs font-bold text-[#082f2b] max-w-[120px] truncate">
                                    {displayName}
                                </span>
                                <ChevronDown
                                    size={15}
                                    className={`text-[#39534e] transition-transform duration-200 ${
                                        dropdownOpen ? "rotate-180" : ""
                                    }`}
                                />
                            </button>

                            {dropdownOpen && (
                                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-[#123b38]/10 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                    {/* User header info */}
                                    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#082f2b] to-[#177fc0] text-white flex items-center justify-center text-sm font-bold shadow-xs">
                                            {userInitial}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-[#082f2b] truncate">
                                                {displayName}
                                            </p>
                                            <p className="text-[11px] text-gray-400 truncate">
                                                {userEmail || "Mentee Account"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Navigation Dropdown Links */}
                                    <div className="py-1">
                                        <Link
                                            to="/mentee/dashboard"
                                            onClick={() => setDropdownOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-[#fbfaf6] hover:text-[#082f2b] transition"
                                        >
                                            <LayoutDashboard size={15} className="text-[#177fc0]" />
                                            <span>Dashboard</span>
                                        </Link>

                                        <Link
                                            to="/sessions"
                                            onClick={() => setDropdownOpen(false)}
                                            className="flex items-center justify-between px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-[#fbfaf6] hover:text-[#082f2b] transition"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Video size={15} className="text-emerald-600" />
                                                <span>Live Sessions</span>
                                            </div>
                                            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                        </Link>

                                        <Link
                                            to="/messages"
                                            onClick={() => setDropdownOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-[#fbfaf6] hover:text-[#082f2b] transition"
                                        >
                                            <MessageSquare size={15} className="text-[#177fc0]" />
                                            <span>Messages & Chats</span>
                                        </Link>

                                        <Link
                                            to="/mentee/profile"
                                            onClick={() => setDropdownOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-[#fbfaf6] hover:text-[#082f2b] transition"
                                        >
                                            <User size={15} className="text-gray-500" />
                                            <span>My Profile</span>
                                        </Link>
                                    </div>

                                    <div className="border-t border-gray-100 pt-1 mt-1">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition cursor-pointer"
                                        >
                                            <LogOut size={15} />
                                            <span>Log out</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* GUEST STATE: LOG IN & GET STARTED BUTTONS */
                        <>
                            <button
                                onClick={() => navigate("/login")}
                                className="px-5 py-2.5 rounded-full border border-[#b8c9c2] text-sm font-bold hover:bg-white transition"
                            >
                                Log in
                            </button>

                            <button
                                onClick={scrollToSearch || (() => navigate("/sessions"))}
                                className="px-5 py-2.5 rounded-full bg-[#177fc0] text-white text-sm font-bold shadow-lg shadow-[#177fc0]/20 hover:-translate-y-0.5 transition"
                            >
                                Get Started
                            </button>
                        </>
                    )}

                </div>

                <button
                    onClick={() => setMobileMenu(!mobileMenu)}
                    className="lg:hidden text-2xl"
                    aria-label="Toggle mobile menu"
                >
                    ☰
                </button>

            </div>

            {/* Mobile Menu */}
            {mobileMenu && (
                <div className="lg:hidden bg-[#fbfaf6] border-t border-[#d8e3dc] px-6 py-5 space-y-4">

                    <Link
                        to="/mentors"
                        onClick={() => setMobileMenu(false)}
                        className="block font-semibold"
                    >
                        Find Mentors
                    </Link>

                    <Link
                        to="/sessions"
                        onClick={() => setMobileMenu(false)}
                        className="block font-semibold text-[#177fc0] flex items-center gap-2"
                    >
                        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        Live Google Meet Sessions
                    </Link>

                    <a
                        href="/home#categories"
                        onClick={() => setMobileMenu(false)}
                        className="block font-semibold"
                    >
                        Explore Skills
                    </a>

                    <Link
                        to="/mentor/apply"
                        onClick={() => setMobileMenu(false)}
                        className="block font-semibold"
                    >
                        For Mentors
                    </Link>

                    {isUserLoggedIn ? (
                        <div className="border-t border-gray-200 pt-3 space-y-3">
                            <div className="flex items-center gap-3 py-1">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#082f2b] to-[#177fc0] text-white flex items-center justify-center text-xs font-extrabold">
                                    {userInitial}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-[#082f2b] truncate">{displayName}</p>
                                    <p className="text-[11px] text-gray-400 truncate">{userEmail}</p>
                                </div>
                            </div>

                            <Link
                                to="/mentee/dashboard"
                                onClick={() => setMobileMenu(false)}
                                className="flex items-center gap-2.5 font-semibold text-xs text-[#082f2b]"
                            >
                                <LayoutDashboard size={15} className="text-[#177fc0]" />
                                Dashboard
                            </Link>

                            <Link
                                to="/sessions"
                                onClick={() => setMobileMenu(false)}
                                className="flex items-center gap-2.5 font-semibold text-xs text-[#082f2b]"
                            >
                                <Video size={15} className="text-emerald-600" />
                                Live Sessions
                            </Link>

                            <Link
                                to="/messages"
                                onClick={() => setMobileMenu(false)}
                                className="flex items-center gap-2.5 font-semibold text-xs text-[#082f2b]"
                            >
                                <MessageSquare size={15} className="text-[#177fc0]" />
                                Messages & Chats
                            </Link>

                            <Link
                                to="/mentee/profile"
                                onClick={() => setMobileMenu(false)}
                                className="flex items-center gap-2.5 font-semibold text-xs text-[#082f2b]"
                            >
                                <User size={15} className="text-gray-500" />
                                Mentee Profile
                            </Link>

                            <button
                                onClick={handleLogout}
                                className="w-full py-2.5 rounded-xl bg-red-50 text-red-600 font-semibold text-xs flex items-center justify-center gap-2 mt-2"
                            >
                                <LogOut size={14} />
                                Log out
                            </button>
                        </div>
                    ) : (
                        <div className="border-t border-gray-200 pt-4 space-y-2">
                            <button
                                onClick={() => {
                                    setMobileMenu(false);
                                    navigate("/login");
                                }}
                                className="w-full py-3 rounded-xl border border-[#b8c9c2] font-semibold text-sm"
                            >
                                Log in
                            </button>
                            <button
                                onClick={() => {
                                    setMobileMenu(false);
                                    navigate("/sessions");
                                }}
                                className="w-full py-3 rounded-xl bg-[#177fc0] text-white font-semibold text-sm shadow-md"
                            >
                                Get Started
                            </button>
                        </div>
                    )}

                </div>
            )}

        </header>
    );
};

export default Navbar;