import { useEffect, useState } from "react";
import { getMe } from "../lib/services/authService";
import { Navigate, Outlet, useLocation } from "react-router";
import useAuthStore from "../store/authStore";

const AuthWall = () => {
  const { setUser } = useAuthStore();
  const [isAuth, setIsAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const location = useLocation();
  const isPublicRoute =
    location.pathname === "/login" || location.pathname.includes("/verify");

  const checkAuth = async () => {
    setIsLoading(true);

    const accessToken = localStorage.getItem("mcflow_access_token");
    const refreshToken = localStorage.getItem("mcflow_refresh_token");

    if (!accessToken || !refreshToken) {
      setIsAuth(false);
      setIsLoading(false);
      return;
    }

    try {
      const user = await getMe();
      setUser(user);
      setIsAuth(true);
    } catch (error) {
      setIsAuth(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [location.pathname]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isAuth && !isPublicRoute) {
    return <Outlet />;
  }

  if (isAuth && isPublicRoute) {
    return <Navigate to="/" />;
  }

  // console.log(path)

  if (!isAuth && isPublicRoute) {
    return <Outlet />;
  }

  if (!isAuth && !isPublicRoute) {
    return <Navigate to="/login" />;
  }

  return <Outlet />;
};

export default AuthWall;
