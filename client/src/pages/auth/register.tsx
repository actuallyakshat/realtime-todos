import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../../store/auth";
import { FormInput } from "../../components/form-input";
import BackgroundGradients from "../../components/background-gradients";

export function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const { register, user } = useAuth();
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
    if (password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await register(username, password);
      setErrors({});
      navigate("/login");
    } catch (err) {
      setErrors({
        form: err instanceof Error ? err.message : "Registration failed",
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-background relative flex min-h-screen items-center justify-center px-4">
      <BackgroundGradients />
      <div className="w-full relative z-10 max-w-lg border border-zinc-800 rounded-lg p-8 shadow-lg">
        <h1 className="text-3xl font-bold text-white">Register</h1>
        <p className="text-white text-sm mt-1 mb-3">
          Create an account to start collaborating on tasks in real time.
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
          <FormInput
            label="Confirm Password"
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            error={errors.confirmPassword}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md cursor-pointer bg-primary p-2 text-white transition-colors hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-800 disabled:cursor-not-allowed disabled:opacity-80"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
        <p className="mt-4 text-center text-gray-400">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
