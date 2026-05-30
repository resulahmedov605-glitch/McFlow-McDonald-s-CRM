import { createBrowserRouter, RouterProvider } from "react-router";
import Login from "./pages/Login";
import VerifyQR from "./pages/Verify";
import Dashboard from "./pages/Dashboard";
import AuthWall from "./components/AuthWall";
import Profile from "./pages/Profile";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Drawer from "./components/Drawer";
import PageLoader from "./components/PageLoader";
import ErrorPage from "./pages/ErrorPage";

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
      { index: true, element: <Dashboard /> },
    ],
  },
  {
    path: "*",
    element: <ErrorPage />,
  },
]);

const App = () => {
  return <RouterProvider router={routes} />;
};

export default App;
