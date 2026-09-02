export type GetUserResponse = {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  picture: string | null;
  bio: string | null;
  streak: number;
  rankRating: number;
  createdAt: string;
};
