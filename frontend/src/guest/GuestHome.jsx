import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api.js";

const categories = [
    {
        icon: "⌘",
        title: "Software Development",
        description:
            "Code reviews, system architecture, full-stack web apps and real-world engineering.",
    },
    {
        icon: "◈",
        title: "Design & UX",
        description:
            "Build your portfolio, Figma auto-layouts, UX research, and product thinking.",
    },
    {
        icon: "↗",
        title: "Business & Startup",
        description:
            "Validate early ideas, create realistic roadmaps, and scale with guidance from founders.",
    },
    {
        icon: "◎",
        title: "Career & Interviews",
        description:
            "Practical support for resumes, system design, mock interviews and career promotions.",
    },
];

const GuestHome = () => {
    const navigate = useNavigate();

    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [mobileMenu, setMobileMenu] = useState(false);

    /* =====================================================
       FETCH REAL MENTORS 
    ====================================================== */
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const mentorsRes = await api.get("/accepted-mentors");

                if (mentorsRes.data?.data) {
                    const rawMentors = mentorsRes.data.data;
                    const normalized = rawMentors.map((m) => {
                        const name =
                            `${m.firstName || ""} ${m.lastName || ""}`.trim() ||
                            m.userName ||
                            m.username ||
                            "Mentor";

                        const initials = name
                            .split(" ")
                            .filter(Boolean)
                            .map((word) => word[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase() || "M";

                        const rawSkills = Array.isArray(m.skills)
                            ? m.skills
                            : typeof m.skills === "string"
                            ? m.skills
                                  .split(",")
                                  .map((s) => s.trim())
                                  .filter(Boolean)
                            : [];

                        const role = m.jobTitle
                            ? m.company
                                ? `${m.jobTitle} · ${m.company}`
                                : m.jobTitle
                            : "Verified Industry Mentor";

                        const priceVal = m.monthly_fee
                            ? `₹${m.monthly_fee}`
                            : m.price
                            ? String(m.price).startsWith("₹")
                                ? m.price
                                : `₹${m.price}`
                            : "₹799";

                        return {
                            ...m,
                            name,
                            initials,
                            role,
                            skills:
                                rawSkills.length > 0
                                    ? rawSkills
                                    : ["Mentorship", "Career Strategy"],
                            price: priceVal,
                            rating: m.rating
                                ? Number(m.rating).toFixed(1)
                                : "5.0",
                            description:
                                m.bio ||
                                "Experienced mentor dedicated to guiding mentees in building production-ready skills, interview mastery, and career growth.",
                            keywords: `${name} ${role} ${rawSkills.join(
                                " "
                            )} ${m.category || ""} ${m.location || ""}`.toLowerCase(),
                        };
                    });
                    setMentors(normalized);
                }
            } catch (err) {
                console.error("Failed to load guest data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    /* =====================================================
       FILTERING LOGIC
    ====================================================== */
    const filteredMentors = mentors.filter((mentor) => {
        const query = search.toLowerCase().trim();

        const matchesQuery =
            !query ||
            mentor.keywords.includes(query) ||
            mentor.name.toLowerCase().includes(query) ||
            mentor.role.toLowerCase().includes(query) ||
            mentor.skills.some((skill) =>
                skill.toLowerCase().includes(query)
            );

        const matchesCategory =
            selectedCategory === "All" ||
            (mentor.category &&
                mentor.category
                    .toLowerCase()
                    .includes(selectedCategory.toLowerCase())) ||
            mentor.skills.some((s) =>
                s.toLowerCase().includes(selectedCategory.toLowerCase())
            );

        return matchesQuery && matchesCategory;
    });

    const spotlightMentor = mentors.length > 0 ? mentors[0] : null;

    const quickTags = [
        ...new Set(mentors.flatMap((m) => m.skills)),
    ].slice(0, 4);

    const activeTags =
        quickTags.length > 0
            ? quickTags
            : ["React", "Python", "UI/UX Design", "System Design"];

    const scrollToSearch = () => {
        document.getElementById("search")?.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });
    };

    const searchMentors = () => {
        document.getElementById("mentors")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    };

    const quickSearch = (text) => {
        setSearch(text);
        setSelectedCategory("All");

        setTimeout(() => {
            document.getElementById("mentors")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }, 100);
    };

    const filterByCategory = (categoryTitle) => {
        setSelectedCategory(categoryTitle);
        setSearch("");

        setTimeout(() => {
            document.getElementById("mentors")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }, 100);
    };

    return (
        <div className="min-h-screen bg-[#fbfaf6] text-[#123b38]">
            {/* =====================================================
                NAVBAR
            ====================================================== */}
            <header className="sticky top-0 z-50 border-b border-[#123b38]/10 bg-[#fbfaf6]/90 backdrop-blur-xl">
                <div className="w-[92%] max-w-[1180px] mx-auto h-[76px] flex items-center gap-8">
                    <Link to="/" className="flex items-center gap-2.5 mr-auto">
                        <div className="w-10 h-10 rounded-xl bg-[#082f2b] text-white flex items-center justify-center text-xl font-bold -rotate-3 shadow-md">
                            M
                        </div>
                        <span className="text-[23px] font-extrabold tracking-tight">
                            MentorHub
                        </span>
                    </Link>

                    {/* Desktop navigation */}
                    <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-[#39534e]">
                        <a
                            href="#mentors"
                            className="hover:text-[#177fc0] transition"
                        >
                            Find Mentors
                        </a>

                        <a
                            href="#categories"
                            className="hover:text-[#177fc0] transition"
                        >
                            Explore Skills
                        </a>

                        <a
                            href="#how"
                            className="hover:text-[#177fc0] transition"
                        >
                            How It Works
                        </a>

                        <a
                            href="#about"
                            className="hover:text-[#177fc0] transition"
                        >
                            For Mentors
                        </a>
                    </nav>

                    {/* Desktop buttons */}
                    <div className="hidden sm:flex items-center gap-2.5">
                        <button
                            onClick={() => navigate("/login")}
                            className="px-5 py-3 rounded-full border border-[#b8c9c2] text-sm font-bold hover:bg-white transition cursor-pointer"
                        >
                            Log in
                        </button>

                        <button
                            onClick={() => navigate("/register")}
                            className="px-5 py-3 rounded-full bg-[#177fc0] text-white text-sm font-bold shadow-lg shadow-[#177fc0]/20 hover:-translate-y-0.5 transition cursor-pointer"
                        >
                            Get Started
                        </button>
                    </div>

                    {/* Mobile menu toggle */}
                    <button
                        onClick={() => setMobileMenu(!mobileMenu)}
                        className="lg:hidden text-2xl p-2 cursor-pointer"
                        aria-label="Toggle Navigation Menu"
                    >
                        ☰
                    </button>
                </div>

                {mobileMenu && (
                    <div className="lg:hidden bg-[#fbfaf6] border-t border-[#d8e3dc] px-6 py-5 space-y-4">
                        <a
                            href="#mentors"
                            onClick={() => setMobileMenu(false)}
                            className="block font-semibold"
                        >
                            Find Mentors
                        </a>

                        <a
                            href="#categories"
                            onClick={() => setMobileMenu(false)}
                            className="block font-semibold"
                        >
                            Explore Skills
                        </a>

                        <a
                            href="#how"
                            onClick={() => setMobileMenu(false)}
                            className="block font-semibold"
                        >
                            How It Works
                        </a>

                        <a
                            href="#about"
                            onClick={() => setMobileMenu(false)}
                            className="block font-semibold"
                        >
                            For Mentors
                        </a>

                        <div className="pt-2 flex flex-col gap-2">
                            <button
                                onClick={() => navigate("/login")}
                                className="w-full py-3 rounded-xl border border-[#b8c9c2] font-semibold text-center"
                            >
                                Log in
                            </button>
                            <button
                                onClick={() => navigate("/register")}
                                className="w-full py-3 rounded-xl bg-[#082f2b] text-white font-semibold text-center"
                            >
                                Get Started
                            </button>
                        </div>
                    </div>
                )}
            </header>

            {/* =====================================================
                HERO SECTION
            ====================================================== */}
            <section className="relative overflow-hidden bg-[#082f2b] text-white py-20 sm:py-24">
                <div className="absolute -right-32 -top-20 w-96 h-96 rounded-full bg-[#369d89]/30 blur-3xl pointer-events-none" />
                <div className="absolute -left-40 bottom-0 w-96 h-96 rounded-full bg-[#237168]/25 blur-3xl pointer-events-none" />

                <div className="relative w-[92%] max-w-[1180px] mx-auto grid lg:grid-cols-[1.1fr_.9fr] gap-14 items-center">
                    {/* Hero text */}
                    <div>
                        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-white/20 bg-white/[0.07] text-sm font-semibold text-emerald-100">
                            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                            Real guidance from verified industry mentors
                        </div>

                        <h1 className="mt-6 font-serif text-5xl sm:text-6xl lg:text-7xl leading-[.98] tracking-[-3px] max-w-3xl">
                            Meet the mentor who helps you{" "}
                            <span className="text-[#82d8bc]">
                                move forward.
                            </span>
                        </h1>

                        <p className="mt-6 text-lg leading-7 text-[#d4e3dd] max-w-2xl">
                            MentorHub connects ambitious developers, designers,
                            and builders with experienced leaders. Join live
                            Google Meet sessions, get 1-on-1 code reviews, and
                            turn your goals into measurable progress.
                        </p>

                        {/* Search Bar */}
                        <div
                            id="search"
                            className="mt-8 bg-white p-2 rounded-2xl flex flex-col sm:flex-row gap-2 max-w-2xl shadow-2xl"
                        >
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        searchMentors();
                                    }
                                }}
                                placeholder="Search by skill, company, role (e.g. React, Python, Figma)..."
                                className="flex-1 min-w-0 px-4 py-3.5 outline-none text-[#123b38] rounded-xl font-medium"
                            />

                            <button
                                onClick={searchMentors}
                                className="px-6 py-3.5 rounded-xl bg-[#177fc0] text-white font-bold hover:bg-[#126da6] transition cursor-pointer"
                            >
                                Search mentors
                            </button>
                        </div>

                        {/* Quick filter tags from real skills */}
                        <div className="flex flex-wrap gap-2 mt-4 items-center">
                            <span className="text-xs text-[#b8d5cb] font-semibold mr-1">
                                Popular:
                            </span>
                            {activeTags.map((tag) => (
                                <button
                                    key={tag}
                                    onClick={() => quickSearch(tag)}
                                    className="px-3 py-1.5 rounded-full border border-white/20 text-xs text-[#dceae5] hover:bg-white/10 transition cursor-pointer"
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dynamic Hero Spotlight Card */}
                    <div className="relative min-h-[430px] rounded-[30px] bg-[#dcefe6] p-7 text-[#123b38] overflow-hidden shadow-2xl">
                        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-[#8bcfbb]" />

                        <div className="absolute right-5 top-8 bg-white rounded-2xl px-4 py-2.5 shadow-xl text-xs font-bold z-10 flex items-center gap-1.5">
                            <span className="text-amber-500">★</span>
                            <span>
                                {spotlightMentor?.rating || "5.0"} verified rating
                            </span>
                        </div>

                        {spotlightMentor ? (
                            <div className="relative bg-white rounded-[22px] p-6 w-[88%] sm:w-[84%] mx-auto mt-10 shadow-xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-[18px] overflow-hidden bg-gradient-to-br from-[#b9d9cb] to-[#e9c6a7] flex items-center justify-center text-xl font-extrabold flex-none text-[#082f2b]">
                                        {spotlightMentor.profilePic ? (
                                            <img
                                                src={`data:${
                                                    spotlightMentor.profilePicType ||
                                                    "image/jpeg"
                                                };base64,${
                                                    spotlightMentor.profilePic
                                                }`}
                                                alt={spotlightMentor.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            spotlightMentor.initials
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-xl font-bold truncate">
                                            {spotlightMentor.name}
                                        </h3>
                                        <p className="text-xs text-[#6c7b76] font-medium leading-relaxed">
                                            {spotlightMentor.role}
                                        </p>
                                    </div>
                                </div>

                                <p className="mt-4 text-xs text-[#526660] leading-relaxed line-clamp-2">
                                    {spotlightMentor.description}
                                </p>

                                <div className="flex flex-wrap gap-1.5 mt-3.5">
                                    {spotlightMentor.skills
                                        .slice(0, 3)
                                        .map((skill) => (
                                            <span
                                                key={skill}
                                                className="px-2.5 py-1 rounded-full bg-[#eaf4ef] text-[11px] font-bold text-[#1f634e]"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                </div>

                                <button
                                    onClick={() =>
                                        navigate(
                                            `/mentor-profile/${spotlightMentor._id}`
                                        )
                                    }
                                    className="w-full mt-5 px-4 py-3 rounded-xl bg-[#082f2b] text-white flex items-center justify-between text-sm font-bold hover:bg-[#103d35] transition cursor-pointer"
                                >
                                    <span>View Verified Profile</span>
                                    <span>→</span>
                                </button>
                            </div>
                        ) : (
                            <div className="relative bg-white rounded-[22px] p-8 w-[84%] mx-auto mt-12 shadow-xl text-center">
                                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl font-bold mx-auto mb-3">
                                    ✓
                                </div>
                                <h3 className="text-lg font-bold">
                                    Curated Industry Mentors
                                </h3>
                                <p className="text-xs text-[#6c7b76] mt-1">
                                    Explore verified profiles and start learning.
                                </p>
                            </div>
                        )}

                        <div className="absolute left-6 bottom-6 bg-white/90 backdrop-blur-md rounded-2xl px-4 py-2.5 shadow-xl text-xs font-bold text-[#082f2b] flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            100% Real Mentors from MongoDB
                        </div>
                    </div>
                </div>
            </section>

            {/* =====================================================
                CATEGORIES SECTION
            ====================================================== */}
            <section id="categories" className="py-20 sm:py-24 bg-[#f7f1e5]">
                <div className="w-[92%] max-w-[1180px] mx-auto">
                    <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-5 mb-9">
                        <h2 className="font-serif text-4xl sm:text-5xl tracking-tight max-w-2xl">
                            Find guidance for what comes next.
                        </h2>
                        <p className="text-[#65746f] leading-7 max-w-md">
                            From your first production project to senior system
                            design interviews, choose a discipline and meet
                            someone who has been there.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {categories.map((category) => (
                            <button
                                key={category.title}
                                onClick={() => filterByCategory(category.title)}
                                className={`text-left bg-white border rounded-2xl p-6 min-h-[180px] hover:-translate-y-1 hover:shadow-xl transition cursor-pointer flex flex-col justify-between ${
                                    selectedCategory === category.title
                                        ? "border-[#177fc0] ring-2 ring-[#177fc0]/20"
                                        : "border-[#eadfca]"
                                }`}
                            >
                                <div>
                                    <div className="text-3xl mb-4 text-[#177fc0]">
                                        {category.icon}
                                    </div>
                                    <h3 className="font-bold text-lg mb-2">
                                        {category.title}
                                    </h3>
                                    <p className="text-xs text-[#65746f] leading-relaxed">
                                        {category.description}
                                    </p>
                                </div>
                                <span className="text-xs font-bold text-[#177fc0] mt-4 block">
                                    Explore mentors →
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* =====================================================
                MENTORS SECTION (REAL DATA FROM MONGODB)
            ====================================================== */}
            <section id="mentors" className="py-20 sm:py-24 bg-[#fbfaf6]">
                <div className="w-[92%] max-w-[1180px] mx-auto">
                    <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-5 mb-9">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e7f1eb] text-xs font-bold text-[#217153] mb-3">
                                ✓ Live Verified Profiles
                            </div>
                            <h2 className="font-serif text-4xl sm:text-5xl tracking-tight">
                                People worth learning from.
                            </h2>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <p className="text-[#65746f] leading-6 text-sm max-w-md">
                                Every profile is backed by real industry experience,
                                verified company backgrounds, and practical 1-on-1
                                guidance.
                            </p>
                            {(search || selectedCategory !== "All") && (
                                <button
                                    onClick={() => {
                                        setSearch("");
                                        setSelectedCategory("All");
                                    }}
                                    className="text-xs font-bold px-3 py-1.5 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition whitespace-nowrap cursor-pointer"
                                >
                                    Reset Filters ×
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Loading Skeleton */}
                    {loading ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {[1, 2, 3].map((n) => (
                                <div
                                    key={n}
                                    className="bg-white border border-[#d8e3dc] rounded-[23px] p-6 animate-pulse"
                                >
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-16 h-16 rounded-2xl bg-gray-200" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-gray-200 rounded w-3/4" />
                                            <div className="h-3 bg-gray-100 rounded w-1/2" />
                                        </div>
                                    </div>
                                    <div className="h-12 bg-gray-100 rounded mb-4" />
                                    <div className="flex gap-2 mb-6">
                                        <div className="h-6 bg-gray-200 rounded-full w-16" />
                                        <div className="h-6 bg-gray-200 rounded-full w-20" />
                                    </div>
                                    <div className="h-10 bg-gray-200 rounded-full w-full" />
                                </div>
                            ))}
                        </div>
                    ) : filteredMentors.length === 0 ? (
                        <div className="py-16 text-center bg-white border border-[#d8e3dc] rounded-3xl">
                            <div className="text-4xl mb-4">🔎</div>
                            <h3 className="text-xl font-bold">
                                No mentors match your search
                            </h3>
                            <p className="text-gray-500 mt-2 text-sm">
                                Try searching for another skill like React, Python,
                                Figma, or reset the filters.
                            </p>
                            <button
                                onClick={() => {
                                    setSearch("");
                                    setSelectedCategory("All");
                                }}
                                className="mt-5 px-6 py-2.5 rounded-full bg-[#082f2b] text-white font-bold text-sm cursor-pointer"
                            >
                                Show all mentors
                            </button>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredMentors.map((mentor) => (
                                <article
                                    key={mentor._id}
                                    className="bg-white border border-[#d8e3dc] rounded-[23px] overflow-hidden hover:-translate-y-1 hover:shadow-xl transition flex flex-col justify-between"
                                >
                                    <div>
                                        {/* Card Header */}
                                        <div className="p-5 bg-[#e7f1eb] flex gap-4 items-center">
                                            <div className="w-[74px] h-[74px] rounded-2xl overflow-hidden bg-gradient-to-br from-[#b9d9cb] to-[#e9c6a7] flex items-center justify-center text-xl font-bold flex-none text-[#082f2b] shadow-sm">
                                                {mentor.profilePic ? (
                                                    <img
                                                        src={`data:${
                                                            mentor.profilePicType ||
                                                            "image/jpeg"
                                                        };base64,${
                                                            mentor.profilePic
                                                        }`}
                                                        alt={mentor.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    mentor.initials
                                                )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-bold text-lg truncate">
                                                    {mentor.name}
                                                </h3>
                                                <p className="text-xs text-[#5e726b] leading-5 line-clamp-2">
                                                    {mentor.role}
                                                </p>
                                                {mentor.location && (
                                                    <span className="text-[11px] text-[#718680] block mt-0.5">
                                                        📍 {mentor.location}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="ml-auto bg-white rounded-full px-2.5 py-1.5 text-xs font-bold whitespace-nowrap shadow-xs text-amber-600">
                                                ★ {mentor.rating}
                                            </div>
                                        </div>

                                        {/* Card Body */}
                                        <div className="p-5">
                                            <p className="text-xs text-[#65746f] leading-relaxed mb-4 line-clamp-3">
                                                {mentor.description}
                                            </p>

                                            <div className="flex flex-wrap gap-1.5 mb-5">
                                                {mentor.skills
                                                    .slice(0, 4)
                                                    .map((skill) => (
                                                        <span
                                                            key={skill}
                                                            className="px-2.5 py-1 rounded-full bg-[#eaf4ef] text-[11px] font-bold text-[#1a5b46]"
                                                        >
                                                            {skill}
                                                        </span>
                                                    ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Footer */}
                                    <div className="p-5 pt-0 border-t border-[#f0f4f1] mt-auto">
                                        <div className="flex items-center justify-between pt-4">
                                            <div>
                                                <span className="text-xs text-[#718680] block">
                                                    Monthly Mentorship
                                                </span>
                                                <span className="font-extrabold text-base text-[#082f2b]">
                                                    {mentor.price}
                                                    <small className="text-[#65746f] font-normal text-xs ml-1">
                                                        / mo
                                                    </small>
                                                </span>
                                            </div>

                                            <button
                                                onClick={() =>
                                                    navigate(
                                                        `/mentor-profile/${mentor._id}`
                                                    )
                                                }
                                                className="px-4 py-2.5 rounded-full bg-[#177fc0] text-white text-xs font-bold hover:bg-[#126da6] transition cursor-pointer shadow-sm"
                                            >
                                                View mentor →
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}

                    <div className="text-center mt-10">
                        <button
                            onClick={() => navigate("/mentors")}
                            className="px-7 py-3.5 rounded-full bg-[#082f2b] text-white font-bold hover:-translate-y-0.5 transition cursor-pointer text-sm shadow-md"
                        >
                            Explore all verified mentors →
                        </button>
                    </div>
                </div>
            </section>

            {/* =====================================================
                HOW IT WORKS
            ====================================================== */}
            <section id="how" className="py-20 sm:py-24 bg-[#fbfaf6]">
                <div className="w-[92%] max-w-[1180px] mx-auto">
                    <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-5 mb-9">
                        <h2 className="font-serif text-4xl sm:text-5xl tracking-tight max-w-2xl">
                            Mentorship without the awkwardness.
                        </h2>
                        <p className="text-[#65746f] leading-7 max-w-md">
                            A simple, structured journey built around useful
                            conversations and real-world results.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-5">
                        {[
                            {
                                num: "01 / DISCOVER",
                                title: "Explore real mentors.",
                                text: "Filter by skills, technologies, current companies, or the exact hurdle you want to solve.",
                            },
                            {
                                num: "02 / CONNECT",
                                title: "Join mentor communities.",
                                text: "Subscribe to verified mentor communities to unlock exclusive live Google Meet calls, chat workspaces, and resources.",
                            },
                            {
                                num: "03 / GROW",
                                title: "Level up your craft.",
                                text: "Get real-time code reviews, portfolio teardowns, and continuous accountability until you succeed.",
                            },
                        ].map((step) => (
                            <article
                                key={step.num}
                                className="relative overflow-hidden min-h-[230px] rounded-[22px] bg-[#082f2b] text-white p-7"
                            >
                                <span className="text-sm text-[#89d9bd] font-extrabold">
                                    {step.num}
                                </span>
                                <h3 className="font-serif text-2xl sm:text-3xl mt-8 mb-3">
                                    {step.title}
                                </h3>
                                <p className="text-[#c7d9d2] text-sm leading-6">
                                    {step.text}
                                </p>
                                <div className="absolute -right-8 -bottom-8 w-28 h-28 rounded-full border border-white/10" />
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* =====================================================
                FOR MENTORS & SESSIONS PREVIEW
            ====================================================== */}
            <section id="about" className="py-20 sm:py-24 bg-[#e6f2eb]">
                <div className="w-[92%] max-w-[1180px] mx-auto grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex px-3 py-1.5 rounded-full bg-[#f7fbf8] border border-[#bdd8ca] text-xs font-bold mb-5 text-[#1e604a]">
                            For learners & mentors
                        </div>

                        <h2 className="font-serif text-4xl sm:text-5xl leading-tight tracking-tight">
                            One platform. Real communities. Measurable progress.
                        </h2>

                        <p className="mt-5 text-[#546963] leading-7">
                            MentorHub brings both sides of the mentorship equation
                            together. Mentees gain access to people with battle-tested
                            production experience, while mentors build paid skill
                            communities and share their knowledge without administrative
                            overhead.
                        </p>

                        <div className="grid sm:grid-cols-2 gap-3 mt-7">
                            {[
                                "Google Meet sessions",
                                "Community workspaces",
                                "Real-time chat",
                                "Verified reviews",
                                "Flexible monthly plans",
                                "Progress tracking",
                            ].map((item) => (
                                <div
                                    key={item}
                                    className="flex items-center gap-2 text-sm font-bold text-[#163b35]"
                                >
                                    <span className="w-6 h-6 rounded-full bg-[#c8e8d9] flex items-center justify-center text-xs font-bold">
                                        ✓
                                    </span>
                                    {item}
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => navigate("/mentor/apply")}
                            className="mt-8 px-6 py-3.5 rounded-full bg-[#177fc0] text-white font-bold shadow-lg shadow-[#177fc0]/20 hover:-translate-y-0.5 transition cursor-pointer text-sm"
                        >
                            Become a mentor →
                        </button>
                    </div>

                    {/* Exclusive Community Workspaces & Live Calls Showcase */}
                    <div className="bg-white rounded-[28px] p-7 shadow-2xl rotate-[1deg] border border-[#d8e7df]">
                        <div className="flex items-center justify-between mb-5">
                            <span className="font-extrabold text-[#082f2b] text-base">
                                Community Workspaces & Live Sessions
                            </span>
                            <span className="text-[11px] bg-amber-100 text-amber-900 border border-amber-200 rounded-full px-2.5 py-1 font-bold flex items-center gap-1">
                                🔒 Community Members Only
                            </span>
                        </div>

                        <p className="text-xs text-[#526660] leading-5 mb-5">
                            Live Google Meet video calls are hosted exclusively inside mentor community workspaces. Only mentees who join a mentor's community unlock instant access to live sessions and discussions.
                        </p>

                        <div className="space-y-3">
                            <div className="p-3.5 rounded-xl bg-[#f4f9f6] border border-[#dce8e1] flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-[#082f2b] text-white flex items-center justify-center font-bold text-xs flex-none">
                                    📹
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-xs font-bold text-[#082f2b]">
                                        Private Google Meet Links
                                    </h4>
                                    <p className="text-[11px] text-[#637670]">
                                        Direct room invitations with Q&A and screen sharing
                                    </p>
                                </div>
                            </div>

                            <div className="p-3.5 rounded-xl bg-[#f4f9f6] border border-[#dce8e1] flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-[#177fc0] text-white flex items-center justify-center font-bold text-xs flex-none">
                                    💬
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-xs font-bold text-[#082f2b]">
                                        Real-Time Community Chat
                                    </h4>
                                    <p className="text-[11px] text-[#637670]">
                                        Ongoing peer discussion, questions & code reviews
                                    </p>
                                </div>
                            </div>

                            <div className="p-3.5 rounded-xl bg-[#f4f9f6] border border-[#dce8e1] flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-[#0f5b55] text-white flex items-center justify-center font-bold text-xs flex-none">
                                    ⭐
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-xs font-bold text-[#082f2b]">
                                        Verified Mentor Guidance
                                    </h4>
                                    <p className="text-[11px] text-[#637670]">
                                        1-on-1 feedback from industry professionals
                                    </p>
                                </div>
                            </div>
                        </div>

                        <a
                            href="#mentors"
                            className="mt-6 w-full py-3 rounded-xl bg-[#082f2b] text-white text-xs font-bold text-center block hover:bg-[#103d35] transition shadow-md"
                        >
                            Explore Mentors & Communities →
                        </a>
                    </div>
                </div>
            </section>

            {/* =====================================================
                CTA SECTION
            ====================================================== */}
            <section className="w-[92%] max-w-[1180px] mx-auto py-20">
                <div className="rounded-[32px] bg-[#0f5b55] text-white p-8 sm:p-14 lg:p-16 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10 shadow-2xl">
                    <div>
                        <h2 className="font-serif text-4xl sm:text-5xl leading-tight tracking-tight">
                            Stop figuring everything out alone.
                        </h2>
                        <p className="mt-4 text-[#d0e5de] leading-6 max-w-2xl text-sm sm:text-base">
                            There is someone in our community who has already solved
                            the challenge you are facing. Connect with a mentor today
                            and build with confidence.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3 flex-none">
                        <button
                            onClick={scrollToSearch}
                            className="px-6 py-3.5 rounded-full bg-white text-[#082f2b] font-bold hover:-translate-y-0.5 transition cursor-pointer text-sm shadow-md"
                        >
                            Find a mentor
                        </button>
                        <button
                            onClick={() => navigate("/mentor/apply")}
                            className="px-6 py-3.5 rounded-full border border-white/30 text-white font-bold hover:bg-white/10 transition cursor-pointer text-sm"
                        >
                            I want to mentor
                        </button>
                    </div>
                </div>
            </section>

            {/* =====================================================
                FOOTER
            ====================================================== */}
            <footer className="bg-[#062824] text-[#cfe0db] py-14">
                <div className="w-[92%] max-w-[1180px] mx-auto">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(3,1fr)] gap-10">
                        <div>
                            <Link
                                to="/"
                                className="flex items-center gap-2.5 text-white"
                            >
                                <div className="w-10 h-10 rounded-xl bg-white text-[#082f2b] flex items-center justify-center font-bold">
                                    M
                                </div>
                                <span className="text-xl font-bold">
                                    MentorHub
                                </span>
                            </Link>
                            <p className="mt-4 text-sm text-[#9eb6af] leading-6 max-w-xs">
                                A modern community platform connecting learners
                                with verified mentors through live Google Meet
                                sessions and dedicated community spaces.
                            </p>
                        </div>

                        <div>
                            <h4 className="text-white font-bold mb-4 text-sm">
                                Platform
                            </h4>
                            <div className="grid gap-2.5 text-sm text-[#9eb6af]">
                                <a href="#mentors" className="hover:text-white transition">
                                    Find Mentors
                                </a>
                                <a href="#mentors" className="hover:text-white transition">
                                    Mentor Communities
                                </a>
                                <a href="#categories" className="hover:text-white transition">
                                    Explore Skills
                                </a>
                                <a href="#how" className="hover:text-white transition">
                                    How It Works
                                </a>
                                <button
                                    onClick={() => navigate("/mentor/apply")}
                                    className="text-left hover:text-white transition cursor-pointer"
                                >
                                    Become a Mentor
                                </button>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-white font-bold mb-4 text-sm">
                                Resources
                            </h4>
                            <div className="grid gap-2.5 text-sm text-[#9eb6af]">
                                <a href="#how" className="hover:text-white transition">
                                    Community Features
                                </a>
                                <a href="#categories" className="hover:text-white transition">
                                    Skill Roadmaps
                                </a>
                                <Link to="/mentors" className="hover:text-white transition">
                                    Mentor Directory
                                </Link>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-white font-bold mb-4 text-sm">
                                Account
                            </h4>
                            <div className="grid gap-2.5 text-sm text-[#9eb6af]">
                                <button
                                    onClick={() => navigate("/login")}
                                    className="text-left hover:text-white transition cursor-pointer"
                                >
                                    Sign In
                                </button>
                                <button
                                    onClick={() => navigate("/register")}
                                    className="text-left hover:text-white transition cursor-pointer"
                                >
                                    Register as Mentee
                                </button>
                                <button
                                    onClick={() => navigate("/mentor/apply")}
                                    className="text-left hover:text-white transition cursor-pointer"
                                >
                                    Apply as Mentor
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-white/10 mt-10 pt-5 flex flex-col sm:flex-row justify-between gap-3 text-xs text-[#8ca59e]">
                        <span>
                            © 2026 MentorHub. Built for meaningful mentorship connections.
                        </span>
                        <span>
                            Powered by real community knowledge.
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default GuestHome;