import { useEffect, useState } from "react";
import { getMe } from "../lib/services/authService";
import { Navigate, Outlet, useLocation } from "react-router";
import useAuthStore from "../store/authStore";
import { useTranslation } from "react-i18next";

const AuthWall = () => {
  const { setUser } = useAuthStore();
  const { t } = useTranslation();
  const [isAuth, setIsAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const location = useLocation();
  const isPublicRoute =
    location.pathname === "/login" || location.pathname.includes("/verify");

  useEffect(() => {
    let isActive = true;

    const frame = window.requestAnimationFrame(() => {
      void (async () => {
        if (!isActive) return;

        setIsLoading(true);

        const accessToken = localStorage.getItem("mcflow_access_token");
        const refreshToken = localStorage.getItem("mcflow_refresh_token");

        if (!accessToken || !refreshToken) {
          if (!isActive) return;

          setIsAuth(false);
          setIsLoading(false);
          return;
        }

        try {
          const user = await getMe();

          if (!isActive) return;

          setUser(user);
          setIsAuth(true);
        } catch {
          if (!isActive) return;

          setIsAuth(false);
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
      })();
    });

    return () => {
      isActive = false;
      window.cancelAnimationFrame(frame);
    };
  }, [location.pathname, setUser]);

  if (isLoading) {
    return <div>{t("common.loading")}</div>;
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
