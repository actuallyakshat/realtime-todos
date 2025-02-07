import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { AddRoomModal } from "../../components/add-room-modal";
import BackgroundGradients from "../../components/background-gradients";
import RedirectToLogin from "../../components/redirect-to-login";
import useFetch from "../../hooks/use-fetch";
import { useAuth } from "../../store/auth";
import { Room } from "../../types/types";
import { DashboardSkeleton } from "../../components/loading-skeletons";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);

  const fetchUrl = useMemo(() => `/api/rooms`, []);
  const { data, loading, error } = useFetch<{
    rooms: Room[];
    error: string;
    loading: boolean;
  }>(fetchUrl);

  useEffect(() => {
    if (data?.rooms) {
      setRooms(data.rooms);
    }
  }, [data?.rooms]);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="h-screen w-full flex justify-center items-center">
        Error: {error}
      </div>
    );
  }

  if (!isLoading && !user) {
    return <RedirectToLogin />;
  }

  return (
    <div className="pt-16 px-5 max-w-screen-xl mx-auto relative">
      <BackgroundGradients />
      <div className="mt-12 flex justify-end">
        {showAddRoomModal && (
          <AddRoomModal
            onClose={() => setShowAddRoomModal(false)}
            onRoomCreated={(newRoom: Room) => {
              setRooms((prevRooms) => [...prevRooms, newRoom]);
            }}
          />
        )}
        <button
          onClick={() => setShowAddRoomModal(true)}
          className="font-medium flex items-center gap-2  text-zinc-400 hover:text-primary hover:transition-colors text-sm cursor-pointer rounded-lg"
        >
          Add Room <Plus className="size-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4 sm:px-8 px-4 max-w-screen-2xl mx-auto">
        {rooms.map((room) => (
          <RoomCard key={room.ID} room={room} />
        ))}
        {rooms.length == 0 && (
          <div className="p-1">
            <p className="text-zinc-400 text-sm">
              No rooms found. Create one now!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function RoomCard({ room }: { room: Room }) {
  return (
    <Link
      to={`/room/${room.ID}`}
      className="flex flex-col gap-4 p-4 rounded-md cursor-pointer hover:border-primary/30 transition-colors duration-500 shadow-lg bg-zinc-800/40 md:bg-zinc-800/10 backdrop-blur-md border border-zinc-600 md:border-zinc-900"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium">{room.name}</h2>
      </div>
      <div>
        <p className="text-sm text-zinc-400 font-medium">
          by {room.admin.username}
        </p>
        <p className="text-sm text-zinc-400">
          {room.users.length} {room.users.length === 1 ? "user" : "users"}
        </p>
      </div>
    </Link>
  );
}
