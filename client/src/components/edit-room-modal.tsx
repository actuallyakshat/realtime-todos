"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import api from "../lib/axios";

interface EditRoomModalProps {
  roomId: string;
  currentName: string;
  onClose: () => void;
  onRoomUpdated: (newName: string) => void;
}

export function EditRoomModal({
  roomId,
  currentName,
  onClose,
  onRoomUpdated,
}: EditRoomModalProps) {
  const [roomName, setRoomName] = useState(currentName);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.patch(`/api/room/${roomId}`, { name: roomName });
      onRoomUpdated(roomName);
      onClose();
    } catch (err) {
      setError("Failed to update room name. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-zinc-950 border-zinc-900 border p-6 rounded-lg w-96"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-zinc-100">Edit Room</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 cursor-pointer hover:text-zinc-100"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Enter new room name"
            className="w-full p-2 mb-4 bg-zinc-800 text-zinc-100 rounded"
            required
            ref={inputRef}
          />
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <button
            type="submit"
            disabled={loading || roomName == currentName}
            className="w-full bg-primary text-zinc-100 p-2 rounded hover:bg-primary/80 transition-colors disabled:opacity-70 disabled:hover:bg-primary cursor-pointer disabled:cursor-default"
          >
            {loading ? "Updating..." : "Update Room Name"}
          </button>
        </form>
      </div>
    </div>
  );
}
