export type GetUserResponse = {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  picture: string | null;
  bio: string | null;
  streak: number;
  rank_rating: number;
  created_at: string;
};
