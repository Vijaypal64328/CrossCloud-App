import {useContext, useEffect, useState} from "react";
import {Menu, Share2, Wallet, X} from "lucide-react";
import {Link} from "react-router-dom";
import {SignedIn, UserButton} from "@clerk/clerk-react";
import SideMenu from "./SideMenu.jsx";
import CreditsDisplay from "./CreditsDisplay.jsx";
import {UserCreditsContext} from "../context/UserCreditsContext.jsx";

const Navbar = ({activeMenu}) => {
    const [openSideMenu, setOpenSideMenu] = useState(false);
    const {credits, fetchUserCredits} = useContext(UserCreditsContext);

    useEffect(() => {
        fetchUserCredits();
    }, [fetchUserCredits]);

    return (
        <div className="flex items-center justify-between gap-5 bg-white/90 shadow-md backdrop-blur-lg py-4 px-4 sm:px-7 sticky top-0 z-40">
            {/* Left side - menu button and title*/}
            <div className="flex items-center gap-5">
                {/* Show menu icon on mobile, tablet, and iPad (below lg) */}
                <button
                    onClick={() => setOpenSideMenu(!openSideMenu)}
                    className="block lg:hidden text-black hover:bg-gray-100 p-1 rounded transition-colors">
                    {openSideMenu ? (
                        <X className="text-2xl" />
                    ): (
                        <Menu className="text-2xl" />
                    )}
                </button>

                <div className="flex items-center gap-2">
                    <Share2 className="text-blue-500" />
                    <span className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500 tracking-tight" style={{letterSpacing:'-1px'}}>
                       CrossCloud
                    </span>
                </div>
            </div>

            {/* Right side - credits and user button*/}
            <SignedIn>
                <div className="flex items-center gap-4">
                    {/* Show icon only on mobile, icon+text on sm and up */}
                    <Link to="/subscriptions">
                        <span className="flex items-center px-2 py-1 rounded-full bg-blue-50 text-blue-600 font-semibold shadow-sm border border-blue-100 hover:bg-blue-100 transition-all">
                            <Wallet className="w-5 h-5 text-blue-400" />
                            <span className="ml-1">{credits}</span>
                            <span className="hidden sm:inline"> Credits</span>
                        </span>
                    </Link>
                    <div className="relative">
                        <UserButton appearance={{elements:{avatarBox:'ring-2 ring-purple-400'}}} />
                    </div>
                </div>
            </SignedIn>

            {/* Mobile side menu */}
            {/* Slide-in menu for mobile, tablet, and iPad (below lg) */}
            {openSideMenu && (
                <div className="fixed top-[73px] left-0 right-0 bg-white border-b border-gray-200 lg:hidden z-20">
                    <SideMenu activeMenu={activeMenu}/>
                </div>
            )}
        </div>
    )
}

export default Navbar;