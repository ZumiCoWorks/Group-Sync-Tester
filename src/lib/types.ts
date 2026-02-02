export type Participant = {
  id: string;
  name: string;
  avatar: string;
  joinedAt: number;
};

export type Group = {
  name: string;
  avatar: string;
}[];

export type Session = {
  hostId: string;
  status: 'lobby' | 'grouped';
  createdAt: number;
  groups: Group[];
};
