export type UserResponse = {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  picture: string | null;
  bio: string;
  streak: number;
  rankRating: number;
  createdAt: string;
};
