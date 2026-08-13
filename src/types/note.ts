export interface Note {
  id: string;
  text: string;
  title?: string;
  source: string;
  user_id: string;
  created_at: string;
  tags: string[];
  favorite: boolean;
  category: "article" | "research" | "code" | "quote" | "design"
}

export type Category = "All" | "article" | "research" | "code" | "quote" | "design";

export interface Database {
  public: {
    Tables: {
      Notes: {
        Row: Note;
        Insert: {
          id?: string;
          text: string;
          title?: string;
          source?: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          text?: string;
          title?: string;
          source?: string;
          user_id?: string;
          created_at?: string;
        };
      };
    };
  };
}