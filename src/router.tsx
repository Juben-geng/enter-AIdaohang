import { Navigate } from "react-router-dom";
import DashboardAnonymous from "./pages/DashboardAnonymous";
import Auth from "./pages/Auth";
import MemberCenter from "./pages/MemberCenter";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

export const routers = [
    {
      path: "/",
      name: 'home',
      element: <ProtectedRoute><DashboardAnonymous /></ProtectedRoute>,
    },
    {
      path: "/auth",
      name: 'auth',
      element: <Auth />,
    },
    {
      path: "/member",
      name: 'member',
      element: <ProtectedRoute><MemberCenter /></ProtectedRoute>,
    },
    /* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */
    {
      path: "*",
      name: '404',
      element: <NotFound />,
    },
];

declare global {
  interface Window {
    __routers__: typeof routers;
  }
}

window.__routers__ = routers;