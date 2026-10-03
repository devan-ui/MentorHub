
const MainBody = () => {
    return (
        <main className="flex-1 overflow-y-auto bg-gray-100 p-8">

            {/* Welcome */}
            <div className="flex justify-between items-center">

                <div>
                    <h1 className="text-3xl font-bold text-gray-800">
                        Welcome Back 👋
                    </h1>

                    <p className="text-gray-500 mt-2">
                        Track your mentoring sessions and continue learning.
                    </p>
                </div>

                <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl shadow transition">
                    + Book Session
                </button>

            </div>

            {/* Statistics */}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-8">

                <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition">

                    <p className="text-gray-500">
                        Total Mentors
                    </p>

                    <h2 className="text-4xl font-bold text-green-600 mt-3">
                        24
                    </h2>

                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition">

                    <p className="text-gray-500">
                        Sessions Completed
                    </p>

                    <h2 className="text-4xl font-bold text-green-600 mt-3">
                        18
                    </h2>

                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition">

                    <p className="text-gray-500">
                        Communities
                    </p>

                    <h2 className="text-4xl font-bold text-green-600 mt-3">
                        6
                    </h2>

                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition">

                    <p className="text-gray-500">
                        Messages
                    </p>

                    <h2 className="text-4xl font-bold text-green-600 mt-3">
                        15
                    </h2>

                </div>

            </div>

            {/* Content */}

            <div className="grid lg:grid-cols-3 gap-6 mt-8">

                {/* Upcoming Sessions */}

                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">

                    <div className="flex justify-between items-center">

                        <h2 className="text-xl font-semibold">
                            Upcoming Sessions
                        </h2>

                        <button className="text-green-600 hover:underline">
                            View All
                        </button>

                    </div>

                    <div className="mt-6 space-y-4">

                        <div className="border rounded-xl p-5 flex justify-between items-center hover:bg-green-50 transition">

                            <div>

                                <h3 className="font-semibold text-lg">
                                    React Development
                                </h3>

                                <p className="text-gray-500 mt-1">
                                    Mentor: Sarah Johnson
                                </p>

                                <p className="text-sm text-gray-400">
                                    Today • 6:00 PM
                                </p>

                            </div>

                            <button className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg">
                                Join
                            </button>

                        </div>

                        <div className="border rounded-xl p-5 flex justify-between items-center hover:bg-green-50 transition">

                            <div>

                                <h3 className="font-semibold text-lg">
                                    Career Guidance
                                </h3>

                                <p className="text-gray-500 mt-1">
                                    Mentor: David Wilson
                                </p>

                                <p className="text-sm text-gray-400">
                                    Tomorrow • 4:00 PM
                                </p>

                            </div>

                            <button className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg">
                                Join
                            </button>

                        </div>

                    </div>

                </div>

                {/* Recommended Mentors */}

                <div className="bg-white rounded-2xl shadow-sm p-6">

                    <h2 className="text-xl font-semibold">
                        Recommended Mentors
                    </h2>

                    <div className="space-y-5 mt-6">

                        <div className="flex items-center gap-4">

                            <div className="w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                                S
                            </div>

                            <div>

                                <h3 className="font-semibold">
                                    Sarah Johnson
                                </h3>

                                <p className="text-sm text-gray-500">
                                    Web Development
                                </p>

                            </div>

                        </div>

                        <div className="flex items-center gap-4">

                            <div className="w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                                D
                            </div>

                            <div>

                                <h3 className="font-semibold">
                                    David Wilson
                                </h3>

                                <p className="text-sm text-gray-500">
                                    UI / UX
                                </p>

                            </div>

                        </div>

                        <div className="flex items-center gap-4">

                            <div className="w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                                E
                            </div>

                            <div>

                                <h3 className="font-semibold">
                                    Emma Brown
                                </h3>

                                <p className="text-sm text-gray-500">
                                    Data Science
                                </p>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

            {/* Activity */}

            <div className="bg-white rounded-2xl shadow-sm p-6 mt-8">

                <h2 className="text-xl font-semibold mb-5">
                    Recent Activity
                </h2>

                <div className="space-y-4">

                    <div className="flex justify-between border-b pb-4">

                        <div>

                            <p className="font-medium">
                                Completed React Mentoring Session
                            </p>

                            <p className="text-sm text-gray-500">
                                With Sarah Johnson
                            </p>

                        </div>

                        <span className="text-gray-400 text-sm">
                            2 hours ago
                        </span>

                    </div>

                    <div className="flex justify-between border-b pb-4">

                        <div>

                            <p className="font-medium">
                                Joined UI/UX Community
                            </p>

                            <p className="text-sm text-gray-500">
                                Community Membership
                            </p>

                        </div>

                        <span className="text-gray-400 text-sm">
                            Yesterday
                        </span>

                    </div>

                    <div className="flex justify-between">

                        <div>

                            <p className="font-medium">
                                New mentor recommendation received
                            </p>

                            <p className="text-sm text-gray-500">
                                AI Recommendation
                            </p>

                        </div>

                        <span className="text-gray-400 text-sm">
                            3 days ago
                        </span>

                    </div>

                </div>

            </div>

        </main>
    );
};

export default MainBody;

