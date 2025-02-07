import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../../store/auth";
import { FormInput } from "../../components/form-input";
import BackgroundGradients from "../../components/background-gradients";

export function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { login, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!username) newErrors.username = "Username is required";
    if (!password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await login(username, password);
      setErrors({});
      navigate("/");
    } catch (err) {
      console.log(err);
      setErrors({ form: "Invalid username or password" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-background relative flex min-h-screen items-center justify-center px-4">
      <BackgroundGradients />
      <div className="w-full relative z-10 max-w-lg bg-zinc-800/10 border border-zinc-800 rounded-lg p-8 shadow-lg">
        <h1 className="text-3xl font-semibold text-white">Login</h1>
        <p className="text-white text-sm mt-1 mb-3">
          Log back in to your account to continue.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          {errors.form && (
            <div className="text-sm font-medium text-red-500">
              {errors.form}
            </div>
          )}
          <FormInput
            label="Username"
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            error={errors.username}
          />
          <FormInput
            label="Password"
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            error={errors.password}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md cursor-pointer bg-primary p-2 text-white transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-zinc-800 disabled:cursor-not-allowed disabled:opacity-80"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="mt-4 text-center text-zinc-400">
          Don't have an account?{" "}
          <Link to="/register" className="text-primary hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
