export type Gender = "male" | "female" | "prefer_not_to_say";
export type Skill = "beginner" | "intermediate" | "advanced" | "pro";

export interface Player {
  id: string;
  name: string;
  mobile: string | null;
  gender: Gender | null;
  skill: Skill | null;
  notes: string | null;
  is_guest: boolean;
  created_at: string;
  deleted_at: string | null;
}

export interface PlayerWithBalance extends Player {
  balance: number;
  last_played: string | null;
}