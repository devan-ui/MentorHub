import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api.js";

const MentorsList = ({ search }) => {

    const navigate = useNavigate();

    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {

        const fetchMentors = async () => {

            try {

                const response = await api.get("/accepted-mentors");

                setMentors(response.data.data || []);

            } catch (err) {

                console.error(err);
                setError("Failed to load mentors");

            } finally {

                setLoading(false);

            }
        };

        fetchMentors();

    }, []);

    const query = search.toLowerCase().trim();

    const filteredMentors = mentors.filter((mentor) => {

        if (!query) return true;

        const fullName =
            `${mentor.firstName || ""} ${mentor.lastName || ""}`
                .toLowerCase();

        const skills = Array.isArray(mentor.skills)
            ? mentor.skills
            : typeof mentor.skills === "string"
                ? mentor.skills.split(",").map(skill => skill.trim())
                : [];

        return (
            fullName.includes(query) ||
            (mentor.jobTitle || "").toLowerCase().includes(query) ||
            (mentor.company || "").toLowerCase().includes(query) ||
            (mentor.category || "").toLowerCase().includes(query) ||
            skills.some(skill =>
                skill.toLowerCase().includes(query)
            )
        );
    });

    if (loading) {
        return (
            <section
                id="mentors"
                className="py-20 sm:py-24 bg-[#fbfaf6]"
            >
                <div className="w-[92%] max-w-[1180px] mx-auto text-center">
                    <p className="text-[#65746f]">
                        Loading mentors...
                    </p>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section
                id="mentors"
                className="py-20 sm:py-24 bg-[#fbfaf6]"
            >
                <div className="w-[92%] max-w-[1180px] mx-auto text-center">
                    <p className="text-red-500">
                        {error}
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section
            id="mentors"
            className="py-20 sm:py-24 bg-[#fbfaf6]"
        >

            <div className="w-[92%] max-w-[1180px] mx-auto">

                <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-5 mb-9">

                    <h2 className="font-serif text-4xl sm:text-5xl tracking-tight">
                        People worth learning from.
                    </h2>

                    <p className="text-[#65746f] leading-7 max-w-md">
                        Browse mentors available on MentorHub. Every
                        profile is built around experience, skills and
                        practical guidance.
                    </p>

                </div>

                {filteredMentors.length === 0 ? (

                    <div className="py-16 text-center bg-white border border-[#d8e3dc] rounded-3xl">

                        <div className="text-4xl mb-4">
                            🔎
                        </div>

                        <h3 className="text-xl font-bold">
                            No mentors found
                        </h3>

                        <p className="text-gray-500 mt-2">
                            Try a broader skill or role.
                        </p>

                    </div>

                ) : (

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">

                        {filteredMentors.map((mentor) => {

                            const fullName =
                                `${mentor.firstName || ""} ${mentor.lastName || ""}`.trim()
                                || mentor.userName
                                || mentor.username
                                || "Mentor";

                            const skills = Array.isArray(mentor.skills)
                                ? mentor.skills
                                : typeof mentor.skills === "string"
                                    ? mentor.skills
                                        .split(",")
                                        .map(skill => skill.trim())
                                    : [];

                            return (
                                <article
                                    key={mentor._id}
                                    className="bg-white border border-[#d8e3dc] rounded-[23px] overflow-hidden hover:-translate-y-1 hover:shadow-xl transition"
                                >

                                    <div className="p-5 bg-[#e7f1eb] flex gap-4 items-center">

                                        <div className="w-[74px] h-[74px] rounded-2xl overflow-hidden bg-gradient-to-br from-[#b9d9cb] to-[#e9c6a7] flex items-center justify-center text-xl font-bold flex-none">

                                            {mentor.profilePic ? (
                                                <img
                                                    src={`data:${mentor.profilePicType || "image/jpeg"};base64,${mentor.profilePic}`}
                                                    alt={fullName}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                fullName
                                                    .split(" ")
                                                    .map(word => word[0])
                                                    .join("")
                                                    .slice(0, 2)
                                                    .toUpperCase()
                                            )}

                                        </div>

                                        <div className="min-w-0">

                                            <h3 className="font-bold text-lg truncate">
                                                {fullName}
                                            </h3>

                                            <p className="text-xs text-[#5e726b] leading-5">
                                                {mentor.jobTitle || "Mentor"}
                                            </p>

                                            {mentor.company && (
                                                <p className="text-xs text-[#5e726b]">
                                                    {mentor.company}
                                                </p>
                                            )}

                                        </div>

                                    </div>

                                    <div className="p-5">

                                        {mentor.location && (
                                            <p className="text-xs text-[#65746f] mb-3">
                                                📍 {mentor.location}
                                            </p>
                                        )}

                                        <p className="text-sm text-[#65746f] leading-6 mb-4 line-clamp-3">
                                            {mentor.bio ||
                                                "Experienced mentor ready to help you grow your skills and career."}
                                        </p>

                                        <div className="flex flex-wrap gap-2 mb-5">

                                            {skills.slice(0, 5).map((skill, index) => (
                                                <span
                                                    key={`${skill}-${index}`}
                                                    className="px-2.5 py-1.5 rounded-full bg-[#eaf4ef] text-[11px] font-bold"
                                                >
                                                    {skill}
                                                </span>
                                            ))}

                                        </div>

                                        <div className="flex justify-end">

                                            <button
                                                onClick={() =>
                                                    navigate(
                                                        `/MentorProfile/${mentor._id}`,
                                                        {
                                                            state: {
                                                                mentor,
                                                            },
                                                        }
                                                    )
                                                }
                                                className="px-4 py-2.5 rounded-full bg-[#177fc0] text-white text-sm font-bold hover:bg-[#126da6] transition"
                                            >
                                                View Profile
                                            </button>

                                        </div>

                                    </div>

                                </article>
                            );
                        })}

                    </div>

                )}

                <div className="text-center mt-8">

                    <button
                        onClick={() => navigate("/mentors")}
                        className="px-6 py-3 rounded-full bg-[#082f2b] text-white font-bold hover:-translate-y-0.5 transition"
                    >
                        Explore all mentors →
                    </button>

                </div>

            </div>

        </section>
    );
};

export default MentorsList;