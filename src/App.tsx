import { useEffect } from "react";
import { createBrowserRouter, RouterProvider } from "react-router";
import Login from "./pages/auth/Login";
import VerifyQR from "./pages/auth/Verify";
import Dashboard from "./pages/dashboard/Dashboard";
import AuthWall from "./components/AuthWall";
import Profile from "./pages/account/Profile";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Drawer from "./components/Drawer";
import PageLoader from "./components/PageLoader";
import ToastHost from "./components/ToastHost";
import ErrorPage from "./pages/errors/ErrorPage";
import Employee from "./pages/employees/Employee";
import Products from "./pages/inventory/Products";
import ProductItems from "./pages/inventory/ProductItems";
import Orders from "./pages/orders/Orders";
import { useThemeStore } from "./store/useThemeStore";

const RootLayout = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <PageLoader />
      <div className="flex flex-1">
        <Drawer />
        <div className="flex min-w-0 flex-1 flex-col">
          <AuthWall />
        </div>
      </div>
      <Footer />
    </div>
  );
};

const routes = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      { path: "/login", element: <Login /> },
      { path: "/verify", element: <VerifyQR /> },
      { path: "/profile", element: <Profile /> },
      { path: "/employee", element: <Employee /> },
      { path: "/product-items", element: <ProductItems /> },
      { path: "/product", element: <Products /> },
      { path: "/Products", element: <Products /> },
      { path: "/orders", element: <Orders /> },
      { index: true, element: <Dashboard /> },
    ],
  },
  {
    path: "*",
    element: <ErrorPage />,
  },
]);

const App = () => {
  const syncSystemTheme = useThemeStore((state) => state.syncSystemTheme);

  useEffect(() => {
    const themeMedia = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => syncSystemTheme();

    syncSystemTheme();
    themeMedia.addEventListener("change", handleSystemThemeChange);

    return () =>
      themeMedia.removeEventListener("change", handleSystemThemeChange);
  }, [syncSystemTheme]);

  return (
    <>
      <ToastHost />
      <RouterProvider router={routes} />
    </>
  );
};

export default App;
