import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";

const Mentors = () => {
    const navigate = useNavigate();

    const [mentors, setMentors] = useState([]);
    const [search, setSearch] = useState("");

    const [selectedSkills, setSelectedSkills] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showFilters, setShowFilters] = useState(false);
    const [showAllSkills, setShowAllSkills] = useState(false);
    const [showAllCategories, setShowAllCategories] = useState(false);

    useEffect(() => {
        fetchMentors();
    }, []);

    /* ============================================================
       FETCH MENTORS
    ============================================================ */

    const fetchMentors = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/accepted-mentors");

            const mentorData = response.data?.data || [];

            setMentors(mentorData);
        } catch (err) {
            console.error("Error fetching mentors:", err);
            setError("Unable to load mentors.");
        } finally {
            setLoading(false);
        }
    };

    /* ============================================================
       HELPER FUNCTIONS
    ============================================================ */

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

    const getMentorName = (mentor) => {
        return (
            `${mentor.firstName || ""} ${mentor.lastName || ""}`.trim() ||
            mentor.userName ||
            mentor.username ||
            "Mentor"
        );
    };

    const getSkills = (mentor) => {
        return getArrayValues(mentor.skills);
    };

    const getCategories = (mentor) => {
        return getArrayValues(mentor.category);
    };

    /* ============================================================
       UNIQUE SKILLS
    ============================================================ */

    const allSkills = [
        ...new Set(
            mentors.flatMap((mentor) => getSkills(mentor))
        ),
    ].sort((a, b) => a.localeCompare(b));

    /* ============================================================
       UNIQUE CATEGORIES
    ============================================================ */

    const allCategories = [
        ...new Set(
            mentors.flatMap((mentor) => getCategories(mentor))
        ),
    ].sort((a, b) => a.localeCompare(b));

    /* ============================================================
       TOGGLE SKILL
    ============================================================ */

    const toggleSkill = (skill) => {
        setSelectedSkills((prev) => {
            const exists = prev.some(
                (item) =>
                    item.toLowerCase() === skill.toLowerCase()
            );

            if (exists) {
                return prev.filter(
                    (item) =>
                        item.toLowerCase() !== skill.toLowerCase()
                );
            }

            return [...prev, skill];
        });
    };

    /* ============================================================
       TOGGLE CATEGORY
    ============================================================ */

    const toggleCategory = (category) => {
        setSelectedCategories((prev) => {
            const exists = prev.some(
                (item) =>
                    item.toLowerCase() === category.toLowerCase()
            );

            if (exists) {
                return prev.filter(
                    (item) =>
                        item.toLowerCase() !== category.toLowerCase()
                );
            }

            return [...prev, category];
        });
    };

    /* ============================================================
       CLEAR FILTERS
    ============================================================ */

    const clearFilters = () => {
        setSearch("");
        setSelectedSkills([]);
        setSelectedCategories([]);
    };

    /* ============================================================
       FILTER MENTORS
    ============================================================ */

    const filteredMentors = mentors.filter((mentor) => {
        const fullName =
            `${mentor.firstName || ""} ${mentor.lastName || ""}`
                .toLowerCase();

        const jobTitle =
            String(mentor.jobTitle || "").toLowerCase();

        const company =
            String(mentor.company || "").toLowerCase();

        const location =
            String(mentor.location || "").toLowerCase();

        const bio =
            String(mentor.bio || "").toLowerCase();

        const mentorCategories = getCategories(mentor);

        const categoryText = mentorCategories
            .join(" ")
            .toLowerCase();

        const mentorSkills = getSkills(mentor);

        const skillsText = mentorSkills
            .join(" ")
            .toLowerCase();

        const searchText = search
            .toLowerCase()
            .trim();

        /* SEARCH */

        const matchesSearch =
            !searchText ||
            fullName.includes(searchText) ||
            jobTitle.includes(searchText) ||
            company.includes(searchText) ||
            location.includes(searchText) ||
            bio.includes(searchText) ||
            categoryText.includes(searchText) ||
            skillsText.includes(searchText);

        /* SKILLS */

        const matchesSkills =
            selectedSkills.length === 0 ||
            selectedSkills.every((selectedSkill) =>
                mentorSkills.some(
                    (skill) =>
                        skill.toLowerCase() ===
                        selectedSkill.toLowerCase()
                )
            );

        /* CATEGORIES */

        const matchesCategories =
            selectedCategories.length === 0 ||
            selectedCategories.every((selectedCategory) =>
                mentorCategories.some(
                    (category) =>
                        category.toLowerCase() ===
                        selectedCategory.toLowerCase()
                )
            );

        return (
            matchesSearch &&
            matchesSkills &&
            matchesCategories
        );
    });

    /* ============================================================
       VISIBLE FILTER ITEMS
    ============================================================ */

    const visibleSkills = showAllSkills
        ? allSkills
        : allSkills.slice(0, 8);

    const visibleCategories = showAllCategories
        ? allCategories
        : allCategories.slice(0, 8);

    /* ============================================================
       OPEN MENTOR PROFILE
       
       IMPORTANT:
       Only send the mentor ID.
       MentorProfile.jsx will fetch the latest data from MongoDB.
    ============================================================ */

    const openMentorProfile = (mentor) => {
        if (!mentor?._id) {
            console.error("Mentor ID is missing:", mentor);
            return;
        }

        navigate(`/MentorProfile/${mentor._id}`);
    };

    /* ============================================================
       UI
    ============================================================ */

    return (
        <div className="min-h-screen bg-[#fbfaf6] text-[#123b38]">

            {/* =====================================================
                NAVBAR
            ====================================================== */}

            <header className="sticky top-0 z-50 border-b border-[#123b38]/10 bg-[#fbfaf6]/95 backdrop-blur-xl">

                <div className="w-[92%] max-w-[1180px] mx-auto h-[76px] flex items-center">

                    <button
                        onClick={() => navigate("/home")}
                        className="flex items-center gap-2.5 mr-auto"
                    >
                        <div className="w-10 h-10 rounded-xl bg-[#082f2b] text-white flex items-center justify-center text-xl font-bold -rotate-3">
                            M
                        </div>

                        <span className="text-[23px] font-extrabold tracking-tight">
                            MentorHub
                        </span>
                    </button>

                    <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-[#39534e]">

                        <button
                            onClick={() => navigate("/home")}
                            className="hover:text-[#177fc0] transition"
                        >
                            Home
                        </button>

                        <span className="text-[#177fc0]">
                            Find Mentors
                        </span>

                        <button
                            onClick={() => navigate("/mentor")}
                            className="hover:text-[#177fc0] transition"
                        >
                            Become a Mentor
                        </button>

                    </nav>

                    <button
                        onClick={() => navigate("/home")}
                        className="ml-6 px-5 py-3 rounded-full bg-[#177fc0] text-white text-sm font-bold hover:bg-[#126da6] transition"
                    >
                        Back to Home
                    </button>

                </div>

            </header>

            {/* =====================================================
                PAGE HEADER
            ====================================================== */}

            <section className="bg-[#e6f2eb] border-b border-[#d8e3dc]">

                <div className="w-[92%] max-w-[1180px] mx-auto py-12">

                    <div className="max-w-3xl">

                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#bdd8ca] text-xs font-bold mb-4">
                            ✦ MentorHub mentors
                        </div>

                        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl tracking-tight">
                            Find the right mentor for you.
                        </h1>

                        <p className="mt-4 text-[#65746f] leading-7 max-w-2xl">
                            Explore experienced mentors, discover their
                            skills, and find someone who can help you take
                            your next step.
                        </p>

                    </div>

                </div>

            </section>

            {/* =====================================================
                MAIN
            ====================================================== */}

            <main className="w-[92%] max-w-[1180px] mx-auto py-10">

                {/* SEARCH */}

                <div className="flex flex-col lg:flex-row gap-4 mb-8">

                    <div className="relative flex-1">

                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl text-[#65746f]">
                            ⌕
                        </span>

                        <input
                            type="text"
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                            placeholder="Search by skill, role, company or mentor name"
                            className="w-full bg-white border border-[#cbdad3] rounded-2xl pl-14 pr-5 py-4 outline-none focus:border-[#177fc0] focus:ring-2 focus:ring-[#177fc0]/10 transition"
                        />

                    </div>

                    <button
                        onClick={() =>
                            setShowFilters(!showFilters)
                        }
                        className="lg:hidden px-6 py-4 rounded-2xl bg-[#082f2b] text-white font-bold"
                    >
                        ☰ Filters
                    </button>

                </div>

                <div className="grid lg:grid-cols-[270px_1fr] gap-8">

                    {/* =================================================
                        FILTER SIDEBAR
                    ================================================== */}

                    <aside
                        className={`
                            ${showFilters ? "block" : "hidden"}
                            lg:block
                        `}
                    >

                        <div className="bg-white border border-[#d8e3dc] rounded-3xl overflow-hidden sticky top-[95px]">

                            {/* FILTER HEADER */}

                            <div className="p-5 border-b border-[#d8e3dc] flex items-center justify-between">

                                <h2 className="font-bold text-lg">
                                    Filters
                                </h2>

                                <button
                                    onClick={clearFilters}
                                    className="text-xs font-bold text-[#177fc0]"
                                >
                                    Clear all
                                </button>

                            </div>

                            {/* SKILLS */}

                            <div className="p-5">

                                <h3 className="font-bold mb-4">
                                    Skills
                                </h3>

                                {allSkills.length === 0 ? (

                                    <p className="text-sm text-[#65746f]">
                                        No skills available
                                    </p>

                                ) : (

                                    <div className="space-y-3">

                                        {visibleSkills.map((skill) => (

                                            <label
                                                key={skill}
                                                className="flex items-center gap-3 cursor-pointer text-sm"
                                            >

                                                <input
                                                    type="checkbox"
                                                    checked={selectedSkills.some(
                                                        (item) =>
                                                            item.toLowerCase() ===
                                                            skill.toLowerCase()
                                                    )}
                                                    onChange={() =>
                                                        toggleSkill(skill)
                                                    }
                                                    className="w-4 h-4 accent-[#177fc0]"
                                                />

                                                <span className="flex-1">
                                                    {skill}
                                                </span>

                                            </label>

                                        ))}

                                    </div>

                                )}

                                {allSkills.length > 8 && (

                                    <button
                                        onClick={() =>
                                            setShowAllSkills(
                                                !showAllSkills
                                            )
                                        }
                                        className="mt-4 text-sm font-bold text-[#177fc0]"
                                    >
                                        {showAllSkills
                                            ? "Show less"
                                            : "Show more"}
                                    </button>

                                )}

                            </div>

                            {/* CATEGORIES */}

                            <div className="border-t border-[#d8e3dc] p-5">

                                <h3 className="font-bold mb-4">
                                    Categories
                                </h3>

                                {allCategories.length === 0 ? (

                                    <p className="text-sm text-[#65746f]">
                                        No categories available
                                    </p>

                                ) : (

                                    <div className="space-y-3">

                                        {visibleCategories.map(
                                            (category) => (

                                                <label
                                                    key={category}
                                                    className="flex items-center gap-3 cursor-pointer text-sm"
                                                >

                                                    <input
                                                        type="checkbox"
                                                        checked={selectedCategories.some(
                                                            (item) =>
                                                                item.toLowerCase() ===
                                                                category.toLowerCase()
                                                        )}
                                                        onChange={() =>
                                                            toggleCategory(
                                                                category
                                                            )
                                                        }
                                                        className="w-4 h-4 accent-[#177fc0]"
                                                    />

                                                    <span className="flex-1">
                                                        {category}
                                                    </span>

                                                </label>

                                            )
                                        )}

                                    </div>

                                )}

                                {allCategories.length > 8 && (

                                    <button
                                        onClick={() =>
                                            setShowAllCategories(
                                                !showAllCategories
                                            )
                                        }
                                        className="mt-4 text-sm font-bold text-[#177fc0]"
                                    >
                                        {showAllCategories
                                            ? "Show less"
                                            : "Show more"}
                                    </button>

                                )}

                            </div>

                            {/* EXPERIENCE */}

                            <div className="border-t border-[#d8e3dc] p-5">

                                <h3 className="font-bold mb-3">
                                    Experience
                                </h3>

                                <div className="space-y-2 text-sm text-[#65746f]">

                                    <div>1–3 years</div>
                                    <div>3–5 years</div>
                                    <div>5–10 years</div>
                                    <div>10+ years</div>

                                </div>

                            </div>

                        </div>

                    </aside>

                    {/* =================================================
                        RESULTS
                    ================================================== */}

                    <section>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">

                            <div>

                                <h2 className="text-2xl font-bold">
                                    Find your mentor
                                </h2>

                                <p className="text-sm text-[#65746f] mt-1">
                                    {filteredMentors.length} mentor
                                    {filteredMentors.length !== 1
                                        ? "s"
                                        : ""}{" "}
                                    found
                                </p>

                            </div>

                            {(search ||
                                selectedSkills.length > 0 ||
                                selectedCategories.length > 0) && (

                                <button
                                    onClick={clearFilters}
                                    className="text-sm font-bold text-[#177fc0]"
                                >
                                    Reset filters
                                </button>

                            )}

                        </div>

                        {/* ACTIVE FILTERS */}

                        {(selectedSkills.length > 0 ||
                            selectedCategories.length > 0) && (

                            <div className="flex flex-wrap gap-2 mb-6">

                                {selectedCategories.map(
                                    (category) => (

                                        <button
                                            key={`category-${category}`}
                                            onClick={() =>
                                                toggleCategory(
                                                    category
                                                )
                                            }
                                            className="px-3 py-1.5 rounded-full bg-[#e6f2eb] border border-[#bdd8ca] text-xs font-bold text-[#217153]"
                                        >
                                            {category} ×
                                        </button>

                                    )
                                )}

                                {selectedSkills.map((skill) => (

                                    <button
                                        key={`skill-${skill}`}
                                        onClick={() =>
                                            toggleSkill(skill)
                                        }
                                        className="px-3 py-1.5 rounded-full bg-[#f7f1e5] border border-[#eadfca] text-xs font-bold text-[#6b4a32]"
                                    >
                                        {skill} ×
                                    </button>

                                ))}

                            </div>

                        )}

                        {/* =================================================
                            LOADING
                        ================================================== */}

                        {loading && (

                            <div className="bg-white border border-[#d8e3dc] rounded-3xl p-16 text-center">

                                <div className="text-3xl mb-3">
                                    ⏳
                                </div>

                                <p className="text-[#65746f]">
                                    Finding mentors...
                                </p>

                            </div>

                        )}

                        {/* =================================================
                            ERROR
                        ================================================== */}

                        {!loading && error && (

                            <div className="bg-white border border-red-200 rounded-3xl p-16 text-center">

                                <div className="text-3xl mb-3">
                                    ⚠️
                                </div>

                                <p className="text-red-500">
                                    {error}
                                </p>

                                <button
                                    onClick={fetchMentors}
                                    className="mt-5 px-5 py-2.5 rounded-full bg-[#177fc0] text-white font-bold"
                                >
                                    Try again
                                </button>

                            </div>

                        )}

                        {/* =================================================
                            NO RESULTS
                        ================================================== */}

                        {!loading &&
                            !error &&
                            filteredMentors.length === 0 && (

                                <div className="bg-white border border-[#d8e3dc] rounded-3xl p-16 text-center">

                                    <div className="text-4xl mb-4">
                                        🔎
                                    </div>

                                    <h3 className="text-xl font-bold">
                                        No mentors found
                                    </h3>

                                    <p className="text-[#65746f] mt-2">
                                        Try another skill, category,
                                        role or company.
                                    </p>

                                    <button
                                        onClick={clearFilters}
                                        className="mt-5 px-5 py-2.5 rounded-full bg-[#082f2b] text-white font-bold"
                                    >
                                        Clear filters
                                    </button>

                                </div>

                            )}

                        {/* =================================================
                            MENTOR CARDS
                        ================================================== */}

                        {!loading &&
                            !error &&
                            filteredMentors.map((mentor) => {

                                const name =
                                    getMentorName(mentor);

                                const skills =
                                    getSkills(mentor);

                                const categories =
                                    getCategories(mentor);

                                return (

                                    <article
                                        key={mentor._id}
                                        className="bg-white border border-[#d8e3dc] rounded-[28px] p-5 sm:p-6 mb-5 hover:shadow-xl hover:-translate-y-0.5 transition"
                                    >

                                        <div className="flex flex-col sm:flex-row gap-5">

                                            {/* PROFILE */}

                                            <div className="flex-none">

                                                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden bg-[#e7f1eb] flex items-center justify-center">

                                                    {mentor.profilePic ? (

                                                        <img
                                                            src={`data:${mentor.profilePicType || "image/jpeg"};base64,${mentor.profilePic}`}
                                                            alt={name}
                                                            className="w-full h-full object-cover"
                                                        />

                                                    ) : (

                                                        <span className="text-3xl font-bold text-[#177fc0]">

                                                            {name
                                                                .split(" ")
                                                                .map(
                                                                    (word) =>
                                                                        word[0]
                                                                )
                                                                .join("")
                                                                .slice(
                                                                    0,
                                                                    2
                                                                )
                                                                .toUpperCase()}

                                                        </span>

                                                    )}

                                                </div>

                                            </div>

                                            {/* INFORMATION */}

                                            <div className="flex-1 min-w-0">

                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">

                                                    <div>

                                                        <h3 className="font-serif text-2xl sm:text-3xl text-[#123b38]">
                                                            {name}
                                                        </h3>

                                                        <p className="mt-1 text-sm text-[#65746f]">

                                                            {mentor.jobTitle ||
                                                                "Experienced Mentor"}

                                                            {mentor.company && (
                                                                <>
                                                                    {" "}·{" "}

                                                                    <strong>
                                                                        {
                                                                            mentor.company
                                                                        }
                                                                    </strong>
                                                                </>
                                                            )}

                                                        </p>

                                                    </div>

                                                    <div className="flex items-center gap-2">

                                                        <span className="px-3 py-1.5 rounded-full bg-[#eaf4ef] text-sm font-bold text-[#217153]">
                                                            ✓ Verified
                                                        </span>

                                                    </div>

                                                </div>

                                                {/* META */}

                                                <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 text-sm text-[#39534e]">

                                                    {mentor.location && (

                                                        <span>
                                                            📍{" "}
                                                            {mentor.location}
                                                        </span>

                                                    )}

                                                    {categories.length > 0 && (

                                                        <span>
                                                            ◈{" "}
                                                            {categories.join(
                                                                ", "
                                                            )}
                                                        </span>

                                                    )}

                                                </div>

                                                {/* BIO */}

                                                <p className="mt-4 text-sm text-[#65746f] leading-6 line-clamp-3">

                                                    {mentor.bio ||
                                                        "Experienced mentor ready to help you grow your skills and career."}

                                                </p>

                                                {/* SKILLS */}

                                                <div className="flex flex-wrap gap-2 mt-4">

                                                    {skills
                                                        .slice(0, 7)
                                                        .map(
                                                            (
                                                                skill,
                                                                index
                                                            ) => (

                                                                <span
                                                                    key={`${skill}-${index}`}
                                                                    className="px-3 py-1.5 rounded-full bg-[#f7f1e5] border border-[#eadfca] text-xs font-bold text-[#6b4a32]"
                                                                >
                                                                    {skill}
                                                                </span>

                                                            )
                                                        )}

                                                </div>

                                                {/* BOTTOM */}

                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-5 border-t border-[#edf0ed]">

                                                    <div>

                                                        <span className="text-xs text-[#65746f]">
                                                            Available for
                                                            mentorship
                                                        </span>

                                                        <div className="flex items-center gap-2 mt-1">

                                                            <span className="w-2 h-2 rounded-full bg-[#39a67e]" />

                                                            <span className="text-sm font-bold">
                                                                Open to mentees
                                                            </span>

                                                        </div>

                                                    </div>

                                                    {/* VIEW PROFILE */}

                                                    <button
                                                        onClick={() =>
                                                            openMentorProfile(
                                                                mentor
                                                            )
                                                        }
                                                        className="px-6 py-3 rounded-full bg-[#177fc0] text-white text-sm font-bold hover:bg-[#126da6] transition"
                                                    >
                                                        View Profile →
                                                    </button>

                                                </div>

                                            </div>

                                        </div>

                                    </article>

                                );
                            })}

                    </section>

                </div>

            </main>

        </div>
    );
};

export default Mentors;