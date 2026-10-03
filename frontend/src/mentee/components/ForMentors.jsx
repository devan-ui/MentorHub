import React from "react";
import { useNavigate } from "react-router-dom";

const ForMentors = () => {

    const navigate = useNavigate();

    const features = [
        "1-on-1 sessions",
        "Goal-based matching",
        "Flexible scheduling",
        "Skill communities",
        "Verified profiles",
        "Progress tracking",
    ];

    const sessions = [
        ["AK", "Arjun Kumar", "Product Design · Today, 7:00 PM", "Join →"],
        ["RS", "Riya Shah", "React roadmap · Friday", "View →"],
        ["NK", "Nisha Kapoor", "Startup validation · Next week", "View →"],
    ];

    return (
        <section
            id="about"
            className="py-20 sm:py-24 bg-[#e6f2eb]"
        >

            <div className="w-[92%] max-w-[1180px] mx-auto grid lg:grid-cols-2 gap-16 items-center">

                <div>

                    <div className="inline-flex px-3 py-1.5 rounded-full bg-[#f7fbf8] border border-[#bdd8ca] text-xs font-bold mb-5">
                        For learners & mentors
                    </div>

                    <h2 className="font-serif text-4xl sm:text-5xl leading-tight tracking-tight">
                        One platform. Two people. Real progress.
                    </h2>

                    <p className="mt-5 text-[#546963] leading-7">
                        MentorHub is designed to make mentorship useful
                        on both sides. Mentees get access to people with
                        practical experience, while mentors can share
                        knowledge and build meaningful professional
                        relationships.
                    </p>

                    <div className="grid sm:grid-cols-2 gap-3 mt-7">

                        {features.map((item) => (
                            <div
                                key={item}
                                className="flex items-center gap-2 text-sm font-bold"
                            >
                                <span className="w-6 h-6 rounded-full bg-[#c8e8d9] flex items-center justify-center">
                                    ✓
                                </span>

                                {item}
                            </div>
                        ))}

                    </div>

                    <button
                        onClick={() => navigate("/mentor")}
                        className="mt-8 px-6 py-3 rounded-full bg-[#177fc0] text-white font-bold shadow-lg shadow-[#177fc0]/20 hover:-translate-y-0.5 transition"
                    >
                        Become a mentor →
                    </button>

                </div>

                <div className="bg-white rounded-[28px] p-5 shadow-2xl rotate-[1.5deg]">

                    <div className="flex items-center justify-between mb-4">

                        <span className="font-extrabold">
                            Your mentorship space
                        </span>

                        <span className="text-xs bg-[#e2f5ea] text-[#217153] rounded-full px-3 py-2 font-bold">
                            ● Active
                        </span>

                    </div>

                    {sessions.map(
                        ([initials, name, details, action]) => (
                            <div
                                key={name}
                                className="flex items-center gap-3 py-4 border-t border-[#d8e3dc]"
                            >

                                <div className="w-12 h-12 rounded-xl bg-[#d6e8df] flex items-center justify-center font-bold">
                                    {initials}
                                </div>

                                <div>
                                    <strong className="block text-sm">
                                        {name}
                                    </strong>

                                    <small className="text-[#65746f]">
                                        {details}
                                    </small>
                                </div>

                                <span className="ml-auto text-[#177fc0] text-xs font-bold">
                                    {action}
                                </span>

                            </div>
                        )
                    )}

                    <div className="mt-4 p-4 rounded-xl bg-[#edf6f1]">

                        <strong className="text-sm">
                            Your next milestone
                        </strong>

                        <div className="h-2 bg-[#d3e5dc] rounded-full mt-3 overflow-hidden">

                            <div className="h-full w-[72%] bg-[#177fc0] rounded-full" />

                        </div>

                        <small className="block mt-2 text-[#63766f]">
                            72% of your current goal completed
                        </small>

                    </div>

                </div>

            </div>

        </section>
    );
};

export default ForMentors;