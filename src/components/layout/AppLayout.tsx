import { Outlet, useLocation } from "react-router-dom";
import TabBar from "./TabBar";

const noTabRoutes = ["/", "/connexion", "/inscription", "/splash"];

export default function AppLayout() {
  const location = useLocation();
  const showTabs = !noTabRoutes.includes(location.pathname);

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-background overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
      {showTabs && <TabBar />}
    </div>
  );
}