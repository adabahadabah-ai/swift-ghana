export type DirectoryUserRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  roles: ("admin" | "agent" | "user")[];
};
