import React from "react";
import { useNavigate } from "react-router-dom";

const CTA = ({ scrollToSearch }) => {

    const navigate = useNavigate();

    return (
        <section className="w-[92%] max-w-[1180px] mx-auto py-20">

            <div className="rounded-[32px] bg-[#0f5b55] text-white p-8 sm:p-14 lg:p-16 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">

                <div>

                    <h2 className="font-serif text-4xl sm:text-5xl leading-tight tracking-tight">
                        Stop figuring everything out alone.
                    </h2>

                    <p className="mt-4 text-[#d0e5de] leading-6 max-w-2xl">
                        There is someone out there who has already faced
                        the problem you're facing. Start a conversation
                        and take the next step.
                    </p>

                </div>

                <div className="flex flex-wrap gap-3 flex-none">

                    <button
                        onClick={scrollToSearch}
                        className="px-6 py-3 rounded-full bg-white text-[#082f2b] font-bold hover:-translate-y-0.5 transition"
                    >
                        Find a mentor
                    </button>

                    <button
                        onClick={() => navigate("/mentor")}
                        className="px-6 py-3 rounded-full border border-white/30 text-white font-bold hover:bg-white/10 transition"
                    >
                        I want to mentor
                    </button>

                </div>

            </div>

        </section>
    );
};

export default CTA;