import { Route, Routes } from "react-router";
import MouseMoveEffect from "./components/mouse-move-effect";
import Navbar from "./components/navbar";
import { LoginPage } from "./pages/auth/login";
import { RegisterPage } from "./pages/auth/register";
import Dashboard from "./pages/dashboard/dashboard";
import Landing from "./pages/landing/landing";
import RoomPageWrapper from "./pages/room/room";
import { AuthProvider } from "./provider/auth-provider";

export default function ApplicationRoutes() {
  return (
    <AuthProvider>
      <MouseMoveEffect />
      <Navbar />
      <div className="text-white">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/room/:roomId" element={<RoomPageWrapper />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}
