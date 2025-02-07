interface User {
  ID: number;
  username: string;
  todos: Todo[];
}

interface Room {
  ID: number;
  name: string;
  users: User[];
  adminId: number;
  admin: User;
}

interface Todo {
  ID: number;
  title: string;
  isCompleted: boolean;
  userId: number;
  roomId: number;
  order: number;
}

export type { User, Room, Todo };
