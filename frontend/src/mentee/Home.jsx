import React, { useState } from "react";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Categories from "./components/Categories";
import MentorsList from "./components/MentorsList";
import ForMentors from "./components/ForMentors";
import CTA from "./components/CTA";
import Footer from "./components/Footer";

const Home = () => {

    const [search, setSearch] = useState("");
    const [mobileMenu, setMobileMenu] = useState(false);

    const scrollToSearch = () => {
        document
            .getElementById("search")
            ?.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
    };

    const searchMentors = () => {
        document
            .getElementById("mentors")
            ?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
    };

    const quickSearch = (text) => {

        setSearch(text);

        setTimeout(() => {
            document
                .getElementById("mentors")
                ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
        }, 100);
    };

    return (
        <div className="min-h-screen bg-[#fbfaf6] text-[#123b38]">

            <Navbar
                mobileMenu={mobileMenu}
                setMobileMenu={setMobileMenu}
                scrollToSearch={scrollToSearch}
            />

            <Hero
                search={search}
                setSearch={setSearch}
                searchMentors={searchMentors}
                quickSearch={quickSearch}
            />

            <Categories
                quickSearch={quickSearch}
            />

            <MentorsList
                search={search}
            />

            <ForMentors />

            <CTA
                scrollToSearch={scrollToSearch}
            />

            <Footer />

        </div>
    );
};

export default Home;