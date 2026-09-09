declare module 'react-native-audio-record' {
  export type AudioRecordOptions = {
    sampleRate?: number;
    channels?: number;
    bitsPerSample?: number;
    audioSource?: number;
    wavFile?: string;
  };

  const AudioRecord: {
    init: (options: AudioRecordOptions) => void;
    start: () => void;
    stop: () => Promise<string>;
    on: (event: 'data', callback: (data: string) => void) => void;
  };

  export default AudioRecord;
}

declare module 'react-native-sound' {
  export default class Sound {
    static setCategory(category: string): void;
    constructor(
      filename: string,
      basePath: string | undefined,
      onError: (error: unknown) => void,
    );
    play(onEnd?: (success: boolean) => void): void;
    stop(callback?: () => void): void;
    release(): void;
    getDuration(): number;
    isLoaded(): boolean;
  }
}
