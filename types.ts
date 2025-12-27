
export interface IPTVChannel {
  id: string;
  name: string;
  logo: string | null;
  url: string;
  group: string;
  language: string;
}

export interface PlayerState {
  currentChannelIndex: number;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
}
