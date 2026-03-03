import { Navigate } from "react-router-dom";
import DashboardAnonymous from "./pages/DashboardAnonymous";
import Auth from "./pages/Auth";
import MemberCenter from "./pages/MemberCenter";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import SystemConfig from "./pages/admin/SystemConfig";
import NavigationSquareManagement from "./pages/admin/NavigationSquareManagement";

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
    {
      path: "/admin",
      name: 'admin',
      element: <ProtectedRoute><AdminLayout /></ProtectedRoute>,
      children: [
        {
          index: true,
          element: <Dashboard />,
        },
        {
          path: "system-config",
          element: <SystemConfig />,
        },
        {
          path: "navigation-square",
          element: <NavigationSquareManagement />,
        },
      ],
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