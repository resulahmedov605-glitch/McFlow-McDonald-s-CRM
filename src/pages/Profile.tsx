import { LogOut, Mail, Shield, User } from "lucide-react";
import { useNavigate } from "react-router";
import useAuthStore from "../store/authStore";
import { useThemeStore } from "../store/useThemeStore";

const Profile = () => {
  const { user, setUser } = useAuthStore();
  const theme = useThemeStore((state) => state.theme);
  const navigate = useNavigate();
  const isLight = theme === "light";

  const handleLogout = () => {
    localStorage.removeItem("mcflow_access_token");
    localStorage.removeItem("mcflow_refresh_token");
    setUser(null);
    navigate("/login", { replace: true });
  };

  const profileRows = [
    {
      label: "Username",
      value: user?.username ?? "-",
      icon: User,
    },
    {
      label: "Email",
      value: user?.email ?? "-",
      icon: Mail,
    },
    {
      label: "Role",
      value: user?.role ?? "-",
      icon: Shield,
    }
  ];

  return (
    <main
      className={`flex flex-1 items-center justify-center px-4 py-10 transition-colors duration-300 ${
        isLight ? "bg-gray-50" : "bg-gray-900"
      }`}
    >
      <section
        className={`w-full max-w-xl rounded-lg border p-6 shadow-lg transition-colors duration-300 ${
          isLight
            ? "border-gray-200 bg-white text-gray-900 shadow-gray-900/10"
            : "border-gray-700 bg-gray-800 text-gray-100 shadow-gray-950/30"
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-red-500 text-white shadow-md shadow-red-950/20">
            <User size={28} />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold">
              {user?.fullName ?? "Profile"}
            </h1>
            <p
              className={`truncate text-sm font-medium ${
                isLight ? "text-gray-500" : "text-gray-400"
              }`}
            >
              {user?.email ?? "Account details"}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          {profileRows.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className={`flex items-center gap-3 rounded-md border p-3 ${
                isLight
                  ? "border-gray-200 bg-gray-50"
                  : "border-gray-700 bg-gray-900"
              }`}
            >
              <Icon size={18} className="shrink-0 text-red-500" />

              <div className="min-w-0">
                <p
                  className={`text-xs font-bold uppercase ${
                    isLight ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  {label}
                </p>
                <p className="break-words font-semibold">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-red-500 px-4 font-bold text-white shadow-md shadow-red-950/20 transition-all duration-200 ease-in-out hover:cursor-pointer hover:bg-red-600 active:scale-98"
        >
          <LogOut size={18} />
          Logout
        </button>
      </section>
    </main>
  );
};

export default Profile;
