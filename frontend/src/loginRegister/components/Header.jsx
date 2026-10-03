import MenuIcon from "@mui/icons-material/Menu";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import MailOutlineOutlinedIcon from "@mui/icons-material/MailOutlineOutlined";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";

const Header = ({ showSideBar, setShowSideBar }) => {
    const navigate = useNavigate();
    return (
        <header className={` sticky top-0 h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8
            shadow-sm z-40 `}>
            {/* Left */}
        
            <div className="flex items-center gap-5">
        
                <button onClick={()=> setShowSideBar(!showSideBar)}
                    className="
                    h-11
                    w-11
                    rounded-xl
                    bg-green-600
                    hover:bg-green-700
                    text-white
                    flex
                    items-center
                    justify-center
                    transition
                    "
                    >
                    <MenuIcon />
                </button>
        
                <div className="relative">
        
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        
                    <input type="text" placeholder="Search mentors, sessions..." className="
                                    w-80
                                    h-11
                                    pl-12
                                    pr-4
                                    rounded-xl
                                    border
                                    border-gray-300
                                    bg-gray-50
                                    focus:bg-white
                                    focus:border-green-600
                                    focus:ring-4
                                    focus:ring-green-100
                                    outline-none
                                    transition
                                " />
        
                </div>
        
            </div>
        
            {/* Right */}
        
            <div className="flex items-center gap-5">
        
                <button className="
                                relative
                                h-11
                                w-11
                                rounded-xl
                                hover:bg-gray-100
                                flex
                                items-center
                                justify-center
                                transition
                            ">
                    <MailOutlineOutlinedIcon />
        
                    <span className="
                                    absolute
                                    -top-1
                                    -right-1
                                    w-5
                                    h-5
                                    rounded-full
                                    bg-green-600
                                    text-white
                                    text-xs
                                    flex
                                    items-center
                                    justify-center
                                ">
                        2
                    </span>
        
                </button>
        
                <button className="
                                relative
                                h-11
                                w-11
                                rounded-xl
                                hover:bg-gray-100
                                flex
                                items-center
                                justify-center
                                transition
                            ">
                    <NotificationsNoneOutlinedIcon />
        
                    <span className="
                                    absolute
                                    -top-1
                                    -right-1
                                    w-5
                                    h-5
                                    rounded-full
                                    bg-red-500
                                    text-white
                                    text-xs
                                    flex
                                    items-center
                                    justify-center
                                ">
                        5
                    </span>
        
                </button>
        
                <div className="flex items-center gap-3 cursor-pointer">
        
                    <button className="
                                    w-24
                                    h-10
                                    rounded-md
                                    bg-green-600
                                    text-white
                                    flex
                                    items-center
                                    justify-center
                                    font-bold
                                    text-lg
                                    hover:bg-green-700
                                    transition-all
                                    duration-300
                                " onClick={()=> navigate('/login')}
                        >
                        Sign In
                    </button>
        
                    <button className="
                                    w-24
                                    h-10
                                    rounded-md
                                    bg-green-600
                                    text-white
                                    flex
                                    items-center
                                    justify-center
                                    font-bold
                                    text-lg
                                    hover:bg-green-700
                                    transition-all
                                    duration-300
                                " onClick={()=> navigate('register')}
                        >
                        Sign Up
                    </button>
        
        
                </div>
        
            </div>
        
        </header>
    );
};

export default Header;