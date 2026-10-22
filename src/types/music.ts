export interface DesiTrack {
  id: string; // YouTube Video ID
  title: string;
  artist: string;
  origin: 'Pakistani' | 'Indian';
  genre: 'Coke Studio' | '80s Synth Pop' | 'Bollywood Romantic' | 'Sufi & Qawwali' | 'Punjabi Wave' | 'Indie & Lo-Fi';
  year: number;
  duration: string;
  thumbnailUrl: string;
  description: string;
}
