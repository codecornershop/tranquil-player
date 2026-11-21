import { Component, createSignal, onMount, For } from 'solid-js';
import './style.css';

const tracks = [
  { name: 'trial1', src: `${import.meta.env.BASE_URL}audio/trial1.mp3`},
  { name: 'nostalgia for a time that never was', src: `${import.meta.env.BASE_URL}audio/nostalgia for a time that never was.mp3`}
];

const App: Component = () => {
  let audioRef: HTMLAudioElement | undefined;
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [currentTrack, setCurrentTrack] = createSignal(0);
  const [currentTime, setCurrentTime] = createSignal(0);
  const [duration, setDuration] = createSignal(0);
  const [volume, setVolume] = createSignal(0.8);

  const togglePlay = () => {
    if (!audioRef) return;
    if (isPlaying()) {
      audioRef.pause();
    } else {
      audioRef.play();
    }
    setIsPlaying(!isPlaying());
  };

  const playTrack = (index: number) => {
    setCurrentTrack(index);
    setIsPlaying(false);
    if (audioRef) {
      audioRef.load();
      audioRef.play();
      setIsPlaying(true);
    }
  };

  const next = () => {
    const nextIndex = (currentTrack() + 1) % tracks.length;
    playTrack(nextIndex);
  };

  const prev = () => {
    const prevIndex = (currentTrack() - 1 + tracks.length) % tracks.length;
    playTrack(prevIndex);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  const handleSeek = (e: MouseEvent) => {
    if (!audioRef) return;
    const bar = e.currentTarget as HTMLDivElement;
    const rect = bar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioRef.currentTime = percent * audioRef.duration;
  };

  const handleVolume = (e: Event) => {
    const val = parseFloat((e.currentTarget as HTMLInputElement).value);
    setVolume(val);
    if (audioRef) audioRef.volume = val;
  };

  onMount(() => {
    if (!audioRef) return;
    audioRef.addEventListener('timeupdate', () => {
      setCurrentTime(audioRef!.currentTime);
    });
    audioRef.addEventListener('loadedmetadata', () => {
      setDuration(audioRef!.duration);
    });
    audioRef.addEventListener('ended', () => next());
  });

  const progress = () => duration() ? (currentTime() / duration()) * 100 : 0;

  return (
    <div class="page">
      <main class="content">
        <img
          src={`${import.meta.env.BASE_URL}images/logo.png`}
          alt="tranquil"
          class="logo"
        />

        <ul class="track-list">
          <For each={tracks}>
            {(track, i) => (
              <li
                classList={{ 'track-item': true, 'active': i() === currentTrack() }}
                onClick={() => playTrack(i())}
              >
                {track.name}
              </li>
            )}
          </For>
        </ul>
      </main>

      <audio ref={audioRef} src={tracks[currentTrack()].src}/>

      <div class="glass-bar">
        <div class="player-content">
          <div class="track-info">
            <span class="track-name">{tracks[currentTrack()].name}</span>
          </div>

          <div class="player-controls-row">
            <div class="progress-wrap">
              <span class="time">{formatTime(currentTime())}</span>
              <div class="progress-bar" onClick={handleSeek}>
                <div class="progress-fill" style={{ width: `${progress()}%`}}/>
              </div>
              <span class="time">{formatTime(duration())}</span>
            </div>

            <div class="controls">
              <button onClick={prev} class="ctrl-btn">⏮</button>
              <button onClick={togglePlay} class="play-btn">
                {isPlaying() ? '⏸' : '▶'}
              </button>
              <button onClick={next} class="ctrl-btn">⏭</button>
            </div>

            <div class="volume-control">
              <span class="vol-icon">󰕾</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume()}
                onInput={handleVolume}
                class="volume-slider"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
};

export default App;
