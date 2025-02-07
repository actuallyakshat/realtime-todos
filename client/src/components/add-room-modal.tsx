"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import api from "../lib/axios";
import { Room } from "../types/types";

interface AddRoomModal {
  onClose: () => void;
  onRoomCreated: (newRoom: Room) => void;
}

export function AddRoomModal({ onClose, onRoomCreated }: AddRoomModal) {
  const [name, setName] = useState("");
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
    e.stopPropagation();
    setError("");
    setLoading(true);

    try {
      if (!name) {
        setError("Room name is required.");
        return;
      }
      const response = await api.post(`/api/room`, { name });
      onRoomCreated(response.data.room);
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to create room. Please try again.");
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
          <h2 className="text-xl font-semibold text-zinc-100">Create Room</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter Room Name"
            className="w-full p-2 mb-4 bg-zinc-800 text-zinc-100 rounded"
            required
            ref={inputRef}
          />
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <button
            type="submit"
            disabled={loading || !name}
            className="w-full cursor-pointer disabled:opacity-80 disabled:hover:bg-primary disabled:cursor-default bg-primary text-zinc-100 p-2 rounded hover:bg-primary/80 transition-colors"
          >
            {loading ? "Creating..." : "Create Room"}
          </button>
        </form>
      </div>
    </div>
  );
}
