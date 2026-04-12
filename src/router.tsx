import { Navigate } from "react-router-dom";
import DashboardAnonymous from "./pages/DashboardAnonymous";
import Auth from "./pages/Auth";
import MemberCenter from "./pages/MemberCenter";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import SearchLinks from "./pages/SearchLinks";
import OperationHistory from "./pages/OperationHistory";
import NavigationSquare from "./pages/NavigationSquare";
import MyNavigationSubmissions from "./pages/MyNavigationSubmissions";
import EditCategory from "./pages/EditCategory";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import SystemConfig from "./pages/admin/SystemConfig";
import NavigationSquareManagement from "./pages/admin/NavigationSquareManagement";
import AdminDashboard from "./pages/admin/AdminDashboard";
import TestAuth from "./pages/TestAuth";
import AITools from "./pages/ai/AITools";
import CustomerList from "./pages/crm/CustomerList";
import CustomerTrips from "./pages/crm/CustomerTrips";
import OrderManagement from "./pages/crm/OrderManagement";
import TeamManagement from "./pages/crm/TeamManagement";

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
      path: "/profile",
      name: 'profile',
      element: <ProtectedRoute><Profile /></ProtectedRoute>,
    },
    {
      path: "/search",
      name: 'search',
      element: <ProtectedRoute><SearchLinks /></ProtectedRoute>,
    },
    {
      path: "/history",
      name: 'history',
      element: <ProtectedRoute><OperationHistory /></ProtectedRoute>,
    },
    {
      path: "/navigation-square",
      name: 'navigation-square',
      element: <NavigationSquare />,
    },
    {
      path: "/my-submissions",
      name: 'my-submissions',
      element: <ProtectedRoute><MyNavigationSubmissions /></ProtectedRoute>,
    },
    {
      path: "/edit-categories",
      name: 'edit-categories',
      element: <ProtectedRoute><EditCategory /></ProtectedRoute>,
    },
    {
      path: "/test-auth",
      name: 'test-auth',
      element: <TestAuth />,
    },
    {
      path: "/ai-tools",
      name: 'ai-tools',
      element: <ProtectedRoute><AITools /></ProtectedRoute>,
    },
    {
      path: "/crm/customers",
      name: 'crm-customers',
      element: <ProtectedRoute><CustomerList /></ProtectedRoute>,
    },
    {
      path: "/crm/customers/:customerId/trips",
      name: 'customer-trips',
      element: <ProtectedRoute><CustomerTrips /></ProtectedRoute>,
    },
    {
      path: "/crm/orders",
      name: 'crm-orders',
      element: <ProtectedRoute><OrderManagement /></ProtectedRoute>,
    },
    {
      path: "/crm/team",
      name: 'crm-team',
      element: <ProtectedRoute><TeamManagement /></ProtectedRoute>,
    },
    {
      path: "/admin-panel",
      name: 'admin-panel',
      element: <ProtectedRoute><AdminDashboard /></ProtectedRoute>,
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