import React from "react";

const Categories = ({ quickSearch }) => {

    const categories = [
        {
            icon: "⌘",
            title: "Software Development",
            description:
                "Code reviews, projects, architecture and real-world engineering.",
        },
        {
            icon: "◈",
            title: "Design & UX",
            description:
                "Build your portfolio, improve your process and think like a designer.",
        },
        {
            icon: "↗",
            title: "Business & Startup",
            description:
                "Validate ideas, make decisions and learn from founders.",
        },
        {
            icon: "◎",
            title: "Career & Interviews",
            description:
                "Get practical support for resumes, interviews and career moves.",
        },
    ];

    return (
        <section
            id="categories"
            className="py-20 sm:py-24 bg-[#f7f1e5]"
        >

            <div className="w-[92%] max-w-[1180px] mx-auto">

                <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-5 mb-9">

                    <h2 className="font-serif text-4xl sm:text-5xl tracking-tight max-w-2xl">
                        Find guidance for what comes next.
                    </h2>

                    <p className="text-[#65746f] leading-7 max-w-md">
                        From your first project to your next promotion,
                        choose a direction and meet someone who can help.
                    </p>

                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">

                    {categories.map((category) => (
                        <button
                            key={category.title}
                            onClick={() => quickSearch(category.title)}
                            className="text-left bg-white border border-[#eadfca] rounded-2xl p-6 min-h-[170px] hover:-translate-y-1 hover:shadow-xl transition"
                        >

                            <div className="text-3xl mb-8">
                                {category.icon}
                            </div>

                            <h3 className="font-bold text-lg mb-2">
                                {category.title}
                            </h3>

                            <p className="text-sm text-[#65746f] leading-6">
                                {category.description}
                            </p>

                        </button>
                    ))}

                </div>

            </div>

        </section>
    );
};

export default Categories;