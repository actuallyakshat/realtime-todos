import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import BackgroundGradients from "../../components/background-gradients";
import { useAuth } from "../../store/auth";

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="relative min-h-screen">
      <BackgroundGradients />

      <div className="relative min-h-screen px-5 text-white z-10 flex items-center justify-center">
        <div className="flex flex-col gap-4 text-center max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight">
            Collaborate on Tasks in Real Time
          </h1>
          <p className="text-lg md:text-xl text-zinc-400">
            With realtime todos, you can create and manage your own private task
            rooms, invite friends, and stay accountable. Boost your productivity
            through collaboration.
          </p>
          <div className="flex gap-4 mt-2 items-center justify-center">
            {user ? (
              <Link
                to="/dashboard"
                className="font-medium px-4  py-2.5 group bg-white text-black hover:bg-zinc-300 rounded-md text-sm transition-all flex justify-center items-center"
              >
                Dashboard
                <ArrowRight className="ml-2 size-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <Link
                to="/register"
                className="font-medium px-4 py-2.5 group bg-white text-black hover:bg-zinc-300 rounded-md text-sm transition-all flex justify-center items-center"
              >
                Get Started Today
                <ArrowRight className="ml-2 size-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
