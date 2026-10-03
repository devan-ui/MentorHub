import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Footer = () => {

    const navigate = useNavigate();

    return (
        <footer className="bg-[#062824] text-[#cfe0db] py-14">

            <div className="w-[92%] max-w-[1180px] mx-auto">

                <div className="grid sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(3,1fr)] gap-10">

                    <div>

                        <Link
                            to="/home"
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
                            A modern platform for connecting learners
                            with experienced mentors who can help turn
                            goals into progress.
                        </p>

                    </div>

                    <div>

                        <h4 className="text-white font-bold mb-4">
                            Platform
                        </h4>

                        <div className="grid gap-3 text-sm text-[#9eb6af]">

                            <a href="#mentors" className="hover:text-white">
                                Find Mentors
                            </a>

                            <a href="#categories" className="hover:text-white">
                                Explore Skills
                            </a>

                            <a href="#how" className="hover:text-white">
                                How It Works
                            </a>

                            <button
                                onClick={() => navigate("/mentor")}
                                className="text-left hover:text-white"
                            >
                                Become a Mentor
                            </button>

                        </div>

                    </div>

                    <div>

                        <h4 className="text-white font-bold mb-4">
                            Resources
                        </h4>

                        <div className="grid gap-3 text-sm text-[#9eb6af]">

                            <span>Career Guides</span>
                            <span>Learning Paths</span>
                            <span>Community</span>
                            <span>Success Stories</span>

                        </div>

                    </div>

                    <div>

                        <h4 className="text-white font-bold mb-4">
                            Company
                        </h4>

                        <div className="grid gap-3 text-sm text-[#9eb6af]">

                            <span>About MentorHub</span>
                            <span>Contact</span>
                            <span>Privacy</span>
                            <span>Terms</span>

                        </div>

                    </div>

                </div>

                <div className="border-t border-white/10 mt-10 pt-5 flex flex-col sm:flex-row justify-between gap-3 text-xs text-[#8ca59e]">

                    <span>
                        © 2026 MentorHub. Built for meaningful connections.
                    </span>

                    <span>
                        Made with purpose for learners & mentors.
                    </span>

                </div>

            </div>

        </footer>
    );
};

export default Footer;