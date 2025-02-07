"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import debounce from "lodash/debounce";
import {
  Check,
  Edit,
  GripVertical,
  LoaderCircle,
  Plus,
  Trash,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { AddUserModal } from "../../components/add-user-modal";
import { DeleteRoomModal } from "../../components/delete-room-modal";
import { EditRoomModal } from "../../components/edit-room-modal";
import RedirectToLogin from "../../components/redirect-to-login";
import useFetch from "../../hooks/use-fetch";
import api from "../../lib/axios";
import { WebSocketProvider } from "../../provider/web-socket-provider";
import { useAuth } from "../../store/auth";
import { useWebSocketMessage } from "../../store/websocket";
import type { Room, Todo, User } from "../../types/types";

export default function RoomPageWrapper() {
  return (
    <WebSocketProvider>
      <RoomPage />
    </WebSocketProvider>
  );
}

function RoomPage() {
  const { roomId } = useParams();
  const newTodoInputRef = useRef<HTMLInputElement>(null);
  const { user, isLoading } = useAuth();

  const fetchUrl = useMemo(() => `/api/room/${roomId}`, [roomId]);

  const { data, loading, error } = useFetch<{
    message: string;
    room: Room;
  }>(fetchUrl);

  const [todos, setTodos] = useState<Todo[]>([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditRoomModal, setShowEditRoomModal] = useState(false);
  const [showDeleteRoomModal, setShowDeleteRoomModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [roomName, setRoomName] = useState(data?.room.name);

  const navigate = useNavigate();

  useEffect(() => {
    if (data?.room.users) {
      const allTodos = data.room.users.flatMap((user) =>
        user.todos.filter((todo) => todo.roomId === data.room.ID)
      );
      setTodos(allTodos);
      setUsers(data.room.users);
      setRoomName(data.room.name);
    }
  }, [data?.room]);

  useWebSocketMessage("todos_updated", (payload: Room) => {
    setTodos(
      payload.users.flatMap((user) =>
        user.todos.filter((todo) => todo.roomId == Number(roomId))
      )
    );
  });

  useWebSocketMessage("user_joined", (payload: Room) => {
    setTodos(
      payload.users.flatMap((user) =>
        user.todos.filter((todo) => todo.roomId == Number(roomId))
      )
    );
    setUsers(payload.users);
  });

  useWebSocketMessage("user_left", (payload: Room) => {
    const isCurrentUserPresent = payload.users.find(
      (u) => u.ID === Number(user!.ID)
    );
    if (!isCurrentUserPresent) {
      navigate("/dashboard");
    }
    setUsers(payload.users);
  });

  useWebSocketMessage("room_name_updated", (payload: Room) => {
    setRoomName(payload.name);
  });

  useWebSocketMessage("room_deleted", () => {
    navigate("/dashboard");
  });

  const addTodoHandler = useCallback(
    async (newTodoItem: string) => {
      if (!newTodoItem || !newTodoItem.trim() || !user) return;

      try {
        const newTodo: Todo = {
          ID: Date.now(),
          title: newTodoItem,
          isCompleted: false,
          userId: user.ID,
          roomId: Number(roomId),
          order: todos.filter((t) => t.userId === user.ID).length,
        };

        setTodos((prevTodos) => [...prevTodos, newTodo]);

        if (newTodoInputRef && newTodoInputRef.current) {
          newTodoInputRef.current.value = "";
        }

        await api.post(`/api/room/${roomId}/todo`, {
          title: newTodoItem,
          order: newTodo.order,
        });
      } catch (error) {
        console.error(error as Error);
        setTodos((prevTodos) =>
          prevTodos.filter((todo) => todo.ID !== Date.now())
        );
      }
    },
    [roomId, todos, user]
  );

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        delay: 10,
        tolerance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const debouncedUpdateTodoOrder = useMemo(
    () =>
      debounce(async (updatedTodos: Todo[]) => {
        try {
          const updates = updatedTodos.map((todo) => ({
            id: todo.ID,
            order: todo.order,
          }));

          await api.patch(`/api/room/${roomId}/todos`, { todos: updates });
        } catch (error) {
          console.error("Failed to update todo order:", error);
          // Optionally revert the UI state here if the API call fails
        }
      }, 500),
    [roomId]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) return;

      setTodos((items) => {
        // Get current user's todos only
        const userTodos = items.filter((todo) => todo.userId === user?.ID);
        const otherTodos = items.filter((todo) => todo.userId !== user?.ID);

        const oldIndex = userTodos.findIndex((item) => item.ID === active.id);
        const newIndex = userTodos.findIndex((item) => item.ID === over.id);

        const reorderedUserTodos = arrayMove(userTodos, oldIndex, newIndex);

        // Update order values only for the current user's todos
        const updatedUserTodos = reorderedUserTodos.map((todo, index) => ({
          ...todo,
          order: index,
        }));

        // Combine reordered user todos with other users' todos
        const newTodos = [...updatedUserTodos, ...otherTodos];

        debouncedUpdateTodoOrder(updatedUserTodos);

        return newTodos;
      });
    },
    [debouncedUpdateTodoOrder, user?.ID]
  );

  const debouncedUpdateTodoComplete = useMemo(
    () =>
      debounce((todoId: number, isCompleted: boolean) => {
        api.patch(`/api/room/${roomId}/todo/${todoId}`, {
          isCompleted: isCompleted,
        });
      }, 500),
    [roomId]
  );

  const toggleTodoComplete = useCallback(
    (todoId: number) => {
      setTodos((prevTodos) => {
        const newTodos = prevTodos.map((todo) =>
          todo.ID === todoId
            ? { ...todo, isCompleted: !todo.isCompleted }
            : todo
        );

        const updatedTodo = newTodos.find((t) => t.ID === todoId);
        if (updatedTodo) {
          debouncedUpdateTodoComplete(todoId, updatedTodo.isCompleted);
        }

        return newTodos;
      });
    },
    [debouncedUpdateTodoComplete]
  );

  const handleLeaveRoom = useCallback(() => {
    try {
      const username = user?.username;
      api.delete(`/api/room/${roomId}/user/leave`, {
        data: { username },
      });
      navigate("/dashboard");
    } catch (error) {
      console.error(error as Error);
    }
  }, [roomId, user, navigate]);

  const handleRoomUpdated = useCallback((newName: string) => {
    setRoomName(newName);
  }, []);

  const handleRemoveUser = useCallback(
    (username: string) => {
      try {
        api.delete(`/api/room/${roomId}/user/remove`, {
          data: { username: username },
        });
        setUsers((prevUsers) =>
          prevUsers.filter((user) => user.username !== username)
        );
      } catch (error) {
        console.error(error as Error);
      }
    },
    [roomId]
  );

  if (loading || isLoading)
    return (
      <div className="h-screen w-full flex justify-center items-center">
        Loading...
      </div>
    );
  if (error)
    return (
      <div className="h-screen w-full flex justify-center items-center">
        Error: {error}
      </div>
    );
  if (!data)
    return (
      <div className="h-screen w-full flex justify-center items-center">
        No data
      </div>
    );

  if (!user) return <RedirectToLogin />;

  const otherUsers = users.filter((u) => u.ID !== user.ID);

  return (
    <div className="pt-18 pb-2 px-2 relative h-screen overflow-hidden flex flex-col-reverse xl:flex-row gap-2">
      <div className="flex-1 xl:flex-[5] h-full border overflow-y-auto rounded-lg p-3 border-zinc-800 noscrollbar">
        <div className="flex p-1 items-center justify-between">
          <h2 className="text-zinc-400 text-xl font-medium hover:text-primary transition-colors duration-700">
            {roomName}
          </h2>
          {data.room.adminId == user.ID ? (
            <div className="flex items-center gap-10 md:gap-6">
              <button
                className="font-medium flex items-center gap-2 text-zinc-400 text-sm cursor-pointer rounded-lg hover:text-primary transition-colors"
                onClick={() => setShowAddUserModal(true)}
              >
                <span className="hidden md:block">Add User</span>
                <Plus className="size-4" />
              </button>
              <button
                className="font-medium flex items-center gap-2 text-zinc-400 text-sm cursor-pointer rounded-lg hover:text-primary transition-colors"
                onClick={() => setShowEditRoomModal(true)}
              >
                <span className="hidden md:block">Edit Room</span>
                <Edit className="size-4" />
              </button>
              <button
                className="font-medium flex items-center gap-2 text-zinc-400 text-sm cursor-pointer rounded-lg hover:text-primary transition-colors"
                onClick={() => setShowDeleteRoomModal(true)}
              >
                <span className="hidden md:block">Delete Room</span>{" "}
                <Trash className="size-4" />
              </button>
            </div>
          ) : (
            <div>
              <button
                className="font-medium flex items-center gap-2 text-zinc-400 text-sm cursor-pointer rounded-lg"
                onClick={() => handleLeaveRoom()}
              >
                Leave Room
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
          {otherUsers.map((otherUser) => (
            <div
              key={otherUser.ID}
              className="flex flex-col px-5 py-4 h-[300px] gap-3 overflow-y-auto bg-zinc-900/25 rounded-lg border border-zinc-800 noscrollbar"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl text-zinc-300 font-medium">
                  {otherUser.username}
                </h2>
                {user.ID == data.room.adminId && (
                  <button
                    className="text-zinc-400 hover:text-primary transition-colors cursor-pointer"
                    onClick={() => handleRemoveUser(otherUser.username)}
                  >
                    <Trash className="size-4" />
                  </button>
                )}
              </div>

              {todos
                .filter((todo) => todo.userId === otherUser.ID)
                .filter((todo) => todo.roomId === data.room.ID)
                .sort((a, b) => a.order - b.order)
                .map((todo) => (
                  <div key={todo.ID} className="flex gap-3 items-center">
                    <div
                      className={`size-5 flex items-center justify-center rounded-full ${
                        todo.isCompleted ? "bg-primary" : "bg-zinc-800/30"
                      }`}
                    >
                      {todo.isCompleted && <Check className="size-3" />}
                    </div>
                    <p
                      className={`text-sm text-zinc-400 ${
                        todo.isCompleted ? "line-through" : ""
                      }`}
                    >
                      {todo.title}
                    </p>
                  </div>
                ))}
            </div>
          ))}
          {otherUsers.length == 0 && (
            <div className="p-1">
              <p className="text-zinc-400 text-sm">
                No other users in this room. Go ahead and add some!
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 xl:flex-[2] h-full border rounded-lg border-zinc-800 overflow-y-auto p-3 noscrollbar">
        <form
          className="flex items-center gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            addTodoHandler(newTodoInputRef.current?.value || "");
          }}
        >
          <input
            className="w-full h-10 rounded-lg px-3 border-zinc-800 border focus:outline-0"
            placeholder="What are your plans for today?"
            type="text"
            ref={newTodoInputRef}
            maxLength={50}
          />
          <button
            type="submit"
            className="bg-primary cursor-pointer text-sm font-medium hover:bg-primary/80 transition-colors w-20 h-10 text-zinc-300 rounded-lg px-3 py-1"
          >
            Add
          </button>
        </form>

        <div className="flex flex-col gap-2 py-3">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={todos.filter((t) => t.userId === user.ID).map((t) => t.ID)}
              strategy={verticalListSortingStrategy}
            >
              {todos
                .filter((t) => t.userId === user.ID)
                .sort((a, b) => a.order - b.order)
                .map((todo) => (
                  <SortableTodoCard
                    key={todo.ID}
                    todo={todo}
                    roomId={roomId!}
                    onToggleComplete={toggleTodoComplete}
                  />
                ))}
            </SortableContext>
          </DndContext>
        </div>
      </div>
      {showAddUserModal && (
        <AddUserModal
          roomId={roomId!}
          onClose={() => setShowAddUserModal(false)}
        />
      )}
      {showEditRoomModal && (
        <EditRoomModal
          roomId={roomId!}
          currentName={roomName || ""}
          onRoomUpdated={handleRoomUpdated}
          onClose={() => setShowEditRoomModal(false)}
        />
      )}
      {showDeleteRoomModal && (
        <DeleteRoomModal
          roomId={roomId!}
          onClose={() => setShowDeleteRoomModal(false)}
        />
      )}
    </div>
  );
}

interface SortableTodoCardProps {
  todo: Todo;
  roomId: string;
  onToggleComplete: (todoId: number) => void;
}

function SortableTodoCard({
  todo,
  roomId,
  onToggleComplete,
}: SortableTodoCardProps) {
  const [loading, setLoading] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.ID });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    touchAction: "none", // Important for touch devices
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await api.delete(`/api/room/${roomId}/todo/${todo.ID}`);
      setLoading(false);
    } catch (error) {
      console.error(error as Error);
      setLoading(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex gap-3 items-center bg-zinc-800/20 p-2 rounded-lg touch-none"
    >
      <button
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
        onTouchStart={(e) => {
          console.log(e);
        }}
      >
        <GripVertical className="size-5 text-zinc-500" />
      </button>
      <div
        className={`size-5 aspect-square flex items-center justify-center rounded-full ${
          todo.isCompleted ? "bg-primary" : "bg-zinc-800/30"
        }`}
        onClick={() => onToggleComplete(todo.ID)}
      >
        {todo.isCompleted && <Check className="size-3" />}
      </div>
      <div className="flex w-full items-center justify-between">
        <p
          className={`text-zinc-400 text-sm ${
            todo.isCompleted ? "line-through" : ""
          }`}
        >
          {todo.title}
        </p>
        <button
          onClick={handleDelete}
          className="text-zinc-400 hover:text-primary transition-colors cursor-pointer"
        >
          {loading ? (
            <LoaderCircle className="animate-spin size-4" />
          ) : (
            <X className="size-4" />
          )}
        </button>
      </div>
    </div>
  );
}
