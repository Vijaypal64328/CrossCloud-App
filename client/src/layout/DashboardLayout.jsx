import {useUser} from "@clerk/clerk-react";
import Navbar from "../components/Navbar.jsx";
import SideMenu from "../components/SideMenu.jsx";

const DashboardLayout = ({children, activeMenu}) => {
    const {user} = useUser();
    return (
        <div>
            {/* Navbar component goes here*/}
            <Navbar activeMenu={activeMenu}/>
            {user && (
                <div className="flex">
                    {/* Sidebar always visible on large screens (laptop/PC) */}
                    <div className="hidden lg:block">
                        <SideMenu activeMenu={activeMenu}/>
                    </div>
                    {/* Main content area, full width on mobile/tablet, with margin on desktop */}
                    <div className="grow mx-2 sm:mx-5">{children}</div>
                </div>
            )}
        </div>
    )
}

export default DashboardLayout;