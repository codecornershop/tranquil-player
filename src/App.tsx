import { Component, createSignal, onMount, onCleanup, For, Show } from 'solid-js';
import { LIQUID_GLASS_VERTEX_SHADER, LIQUID_GLASS_FRAGMENT_SHADER } from './LG_shader';
import { attachGlassShader } from './glassCanvas';
import './style.css';

const tracks = [
  { name: 'trial1', src: `${import.meta.env.BASE_URL}audio/trial1.mp3`},
  { name: 'nostalgia for a time that never was', src: `${import.meta.env.BASE_URL}audio/nostalgia for a time that never was.mp3`}
];

const App: Component = () => {
  let audioRef: HTMLAudioElement | undefined;
  let barRef: HTMLDivElement | undefined;
  let barCanvasRef: HTMLCanvasElement | undefined;
  let playlistBtnRef: HTMLButtonElement | undefined;
  let playlistCanvasRef: HTMLCanvasElement | undefined;

  const [isPlaying, setIsPlaying] = createSignal(false);
  const [currentTrack, setCurrentTrack] = createSignal(0);
  const [currentTime, setCurrentTime] = createSignal(0);
  const [duration, setDuration] = createSignal(0);
  const [volume, setVolume] = createSignal(0.8);
  const [volumeOpen, setVolumeOpen] = createSignal(false);
  const [playlistOpen, setPlaylistOpen] = createSignal(false);

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

    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = 512;
    bgCanvas.height = 512;
    const ctx = bgCanvas.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#1c1c1c');
    grad.addColorStop(0.5, '#3b3b3b');
    grad.addColorStop(1, '#1c1c1c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    const cleanups: Array<() => void> = [];

    if (barRef && barCanvasRef) {
      const gl = barCanvasRef.getContext('webgl', { alpha: true, premultipliedAlpha: true });
      if (gl) {
        const tex = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bgCanvas);
        cleanups.push(attachGlassShader(barCanvasRef, barRef, tex, LIQUID_GLASS_VERTEX_SHADER, LIQUID_GLASS_FRAGMENT_SHADER));
      }
    }

    if (playlistBtnRef && playlistCanvasRef) {
      const gl = playlistCanvasRef.getContext('webgl', { alpha: true, premultipliedAlpha: true });
      if (gl) {
        const tex = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bgCanvas);
        cleanups.push(attachGlassShader(playlistCanvasRef, playlistBtnRef, tex, LIQUID_GLASS_VERTEX_SHADER, LIQUID_GLASS_FRAGMENT_SHADER));
      }
    }
    onCleanup(() => cleanups.forEach((fn) => fn()));
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
        <div class="now-playing">
          <div class="track-info">
            <span class="track-name">{tracks[currentTrack()].name}</span>
          </div>

          <div class="progress-wrap">
            <span class="time">{formatTime(currentTime())}</span>
            <div class="progress-bar" onClick={handleSeek}>
              <div class="progress-fill" style={{ width: `${progress()}%`}}/>
            </div>
            <span class="time">{formatTime(duration())}</span>
          </div>
        </div>

        
        <Show when={playlistOpen()}>
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
        </Show>
      </main>

      <audio ref={audioRef} src={tracks[currentTrack()].src}/>

      <div ref={barRef} class="glass-bar">
        <canvas ref={barCanvasRef} class="glass-bg-canvas" />
        <div class="player-content">
          <div class="player-controls-row">
            <button
              ref={playlistBtnRef}
              type="button"
              class="playlist-toggle"
              onClick={() => setPlaylistOpen(!playlistOpen())}
              aria-label={playlistOpen() ? 'Hide playlist' : 'Show playlist'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
              </svg>
            </button>

            <div class="controls">
              <button onClick={prev} class="ctrl-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                </svg>
              </button>
              <button onClick={togglePlay} class="play-btn">
                {isPlaying() 
                  ?
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                  : 
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg> 
                }
              </button>
              <button onClick={next} class="ctrl-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                </svg>
              </button>
            </div>

            <div class="volume-control">
              <button
                type="button"
                class="ctrl-btn vol-toggle"
                onClick={() => setVolumeOpen(!volumeOpen())}
                aria-label="Toggle volume"
              >
                <span class="vol-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                  </svg>
                </span>
              </button>
              <Show when={volumeOpen()}>
                <div class="volume-modal" role="dialog" aria-label="Volume">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume()}
                    onInput={handleVolume}
                    class="volume-slider--vertical"
                  />
                </div>
              </Show>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
};

export default App;
