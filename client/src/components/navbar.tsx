import { Link } from "react-router";
import { useAuth } from "../store/auth";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="fixed top-0 text-white left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-lg font-bold text-zinc-200">
              Realtime Todos
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <p className="text-zinc-400 pr-2 hidden md:block">
                  Hey, <span className="font-medium">{user.username}!</span>
                </p>
                <Link
                  to="/dashboard"
                  className="font-medium bg-gradient-to-r hover:text-primary px-2 py-2.5 transition-colors text-zinc-400"
                >
                  Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="cursor-pointer font-medium bg-gradient-to-r hover:text-primary px-2 py-2.5 transition-colors text-zinc-400"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm bg-gradient-to-r px-2 hover:text-primary transition-colors py-2.5 text-zinc-400 "
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-sm bg-gradient-to-r px-2 hover:text-primary transition-colors py-2.5 text-zinc-400 "
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
