import { MemberProvider } from '@/integrations';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ScrollToTop } from '@/lib/scroll-to-top';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';
import Layout from '@/components/Layout';
import HomePage from '@/components/pages/HomePage';
import AddExpensePage from '@/components/pages/AddExpensePage';
import BudgetPage from '@/components/pages/BudgetPage';
import TouristPlacesPage from '@/components/pages/TouristPlacesPage';
import ActivitiesPage from '@/components/pages/ActivitiesPage';
import CurrencyConverterPage from '@/components/pages/CurrencyConverterPage';
import AnalyticsPage from '@/components/pages/AnalyticsPage';
import GroupsPage from '@/components/pages/GroupsPage';
import GroupExpensesPage from '@/components/pages/GroupExpensesPage';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "add-expense",
        element: <AddExpensePage />,
      },
      {
        path: "budget",
        element: <BudgetPage />,
      },
      {
        path: "tourist-places",
        element: <TouristPlacesPage />,
      },
      {
        path: "activities",
        element: <ActivitiesPage />,
      },
      {
        path: "currency-converter",
        element: <CurrencyConverterPage />,
      },
      {
        path: "analytics",
        element: <AnalyticsPage />,
      },
      {
        path: "groups",
        element: <GroupsPage />,
      },
      {
        path: "group-expenses",
        element: <GroupExpensesPage />,
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
], {
  basename: import.meta.env.BASE_NAME,
});

export default function AppRouter() {
  return (
    <MemberProvider>
      <RouterProvider router={router} />
    </MemberProvider>
  );
}
