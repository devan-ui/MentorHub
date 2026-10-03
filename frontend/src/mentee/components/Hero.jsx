import React from "react";

const Hero = ({
    search,
    setSearch,
    searchMentors,
    quickSearch,
}) => {
    return (
        <section className="relative overflow-hidden bg-[#082f2b] text-white py-20 sm:py-24">

            <div className="absolute -right-32 -top-20 w-96 h-96 rounded-full bg-[#369d89]/30 blur-3xl" />

            <div className="absolute -left-40 bottom-0 w-96 h-96 rounded-full bg-[#237168]/25 blur-3xl" />

            <div className="relative w-[92%] max-w-[1180px] mx-auto grid lg:grid-cols-[1.1fr_.9fr] gap-14 items-center">

                <div>

                    <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-white/20 bg-white/[0.07] text-sm font-semibold text-emerald-100">

                        <span className="w-2 h-2 rounded-full bg-emerald-300" />

                        Real guidance from people who have been there

                    </div>

                    <h1 className="mt-6 font-serif text-5xl sm:text-6xl lg:text-7xl leading-[.98] tracking-[-3px] max-w-3xl">

                        Meet the mentor who helps you{" "}

                        <span className="text-[#82d8bc]">
                            move forward.
                        </span>

                    </h1>

                    <p className="mt-6 text-lg leading-7 text-[#d4e3dd] max-w-2xl">

                        MentorHub makes meaningful mentorship simple.
                        Discover experienced people, ask better questions,
                        build useful skills, and turn your next goal into
                        a clear plan.

                    </p>

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
                            placeholder="What do you want help with?"
                            className="flex-1 min-w-0 px-4 py-3.5 outline-none text-[#123b38] rounded-xl"
                        />

                        <button
                            onClick={searchMentors}
                            className="px-6 py-3.5 rounded-xl bg-[#177fc0] text-white font-bold hover:bg-[#126da6] transition"
                        >
                            Search mentors
                        </button>

                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">

                        {[
                            "Web Development",
                            "Career Growth",
                            "UI/UX Design",
                            "Entrepreneurship",
                        ].map((tag) => (
                            <button
                                key={tag}
                                onClick={() => quickSearch(tag)}
                                className="px-3 py-2 rounded-full border border-white/20 text-sm text-[#dceae5] hover:bg-white/10 transition"
                            >
                                {tag}
                            </button>
                        ))}

                    </div>

                </div>

                <div className="relative min-h-[430px] rounded-[30px] bg-[#dcefe6] p-7 text-[#123b38] overflow-hidden shadow-2xl">

                    <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-[#8bcfbb]" />

                    <div className="absolute right-5 top-32 bg-white rounded-2xl px-4 py-3 shadow-xl text-xs font-bold z-10">
                        ★ 4.9 average rating
                    </div>

                    <div className="relative bg-white rounded-[22px] p-6 w-[82%] mx-auto mt-8 shadow-xl">

                        <div className="w-16 h-16 rounded-[18px] bg-gradient-to-br from-[#d6b78b] to-[#8ebcae] flex items-center justify-center text-xl font-extrabold">
                            AK
                        </div>

                        <h3 className="mt-4 text-xl font-bold">
                            Arjun Kumar
                        </h3>

                        <p className="text-sm text-[#6c7b76]">
                            Senior Product Designer · 9 years experience
                        </p>

                        <div className="flex flex-wrap gap-2 mt-4">

                            {[
                                "Product Design",
                                "Portfolio Review",
                                "Career Strategy",
                            ].map((skill) => (
                                <span
                                    key={skill}
                                    className="px-2.5 py-1.5 rounded-full bg-[#eaf4ef] text-[11px] font-bold"
                                >
                                    {skill}
                                </span>
                            ))}

                        </div>

                        <div className="mt-5 px-4 py-3 rounded-xl bg-[#082f2b] text-white flex justify-between text-sm">
                            <span>Strong match for your goals</span>
                            <b>92%</b>
                        </div>

                    </div>

                    <div className="absolute left-5 bottom-8 bg-white rounded-2xl px-4 py-3 shadow-xl text-xs font-bold">
                        ● 120+ mentees supported
                    </div>

                </div>

            </div>

        </section>
    );
};

export default Hero;