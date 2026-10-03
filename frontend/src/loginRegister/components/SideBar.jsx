import {
    FaHome,
    FaUserFriends,
    FaComments,
    FaCalendarAlt,
    FaUsers,
    FaCog,
    FaSignOutAlt,
    FaChalkboardTeacher,
} from "react-icons/fa";

const SideBar = ({ showSideBar }) => {
    const menu = [
        {
            name: "Dashboard",
            icon: <FaHome />,
        },
        {
            name: "Find Mentors",
            icon: <FaChalkboardTeacher />,
        },
        {
            name: "Community",
            icon: <FaUsers />,
        },
        {
            name: "Messages",
            icon: <FaComments />,
        },
        {
            name: "Sessions",
            icon: <FaCalendarAlt />,
        },
        {
            name: "Profile",
            icon: <FaUserFriends />,
        },
        {
            name: "Settings",
            icon: <FaCog />,
        },
    ];

    return (
        <aside
            className={`
                ${showSideBar ? "w-64" : "w-20"}
                h-screen
                bg-white
                border-r
                border-gray-200
                shadow-lg
                transition-all
                duration-300
                flex
                flex-col
                flex-shrink-0
            `}
        >
            {/* Logo */}

            <div className="h-20 flex items-center justify-center border-b">

                <h1 className="text-3xl font-bold text-gray-800">

                    {showSideBar ? (
                        <>
                            Mentor
                            <span className="text-green-600">Hub</span>
                        </>
                    ) : (
                        <span className="text-green-600">M</span>
                    )}

                </h1>

            </div>

            {/* Navigation */}

            <div className="flex-1 px-3 py-6">

                {showSideBar && (
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-4 px-2">
                        Navigation
                    </p>
                )}

                <div className="space-y-2">

                    {menu.map((item, index) => (
                        <button
                            key={index}
                            className="
                                w-full
                                flex
                                items-center
                                gap-4
                                px-4
                                py-3
                                rounded-xl
                                text-gray-700
                                hover:bg-green-50
                                hover:text-green-600
                                transition-all
                            "
                        >
                            <span className="text-xl">
                                {item.icon}
                            </span>

                            {showSideBar && (
                                <span className="font-medium">
                                    {item.name}
                                </span>
                            )}
                        </button>
                    ))}

                </div>

            </div>

            {/* User */}

            <div className="border-t p-4">

                {/* <div className="flex items-center gap-3">

                    <div className="w-11 h-11 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                        D
                    </div>

                    {showSideBar && (
                        <div>

                            <h3 className="font-semibold text-gray-800">
                                Devanandan
                            </h3>

                            <p className="text-sm text-gray-500">
                                Mentee
                            </p>

                        </div>
                    )}

                </div> */}

                {/* <button
                    className="
                        mt-5
                        w-full
                        flex
                        items-center
                        justify-center
                        gap-3
                        bg-red-50
                        text-red-600
                        py-3
                        rounded-xl
                        hover:bg-red-100
                        transition-all
                    "
                >
                    <FaSignOutAlt />

                    {showSideBar && <span>Logout</span>}
                </button> */}

            </div>

        </aside>
    );
};

export default SideBar;
