export type DjSetTrack = {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  cover_url: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
};

export type DjSetTrackInput = {
  title: string;
  artist: string;
  audio_url: string;
  cover_url?: string | null;
  sort_order?: number;
  is_published?: boolean;
};
