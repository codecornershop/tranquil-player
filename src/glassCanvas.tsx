export function attachGlassShader(
  canvas: HTMLCanvasElement,
  target: HTMLElement,
  bgTexture: WebGLTexture,
  vsSource: string,
  fsSource: string
) {
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true });
  if (!gl) return () => {};

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s
  };

  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, vsSource));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fsSource));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  const aPos = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  let raf = 0;
  const start = performance.now();

  const draw = (now: number) => {
    const rect = target.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, bgTexture);
    gl.uniform1i(gl.getUniformLocation(prog, 'u_bg'), 0);
    gl.uniform2f(gl.getUniformLocation(prog, 'u_res'), window.innerWidth, window.innerHeight);
    gl.uniform2f(gl.getUniformLocation(prog, 'u_element_pos'), rect.left, rect.top);
    gl.uniform2f(gl.getUniformLocation(prog, 'u_element_size'), rect.width, rect.height);
    gl.uniform1f(gl.getUniformLocation(prog, 'u_radius'), parseFloat(getComputedStyle(target).borderRadius) || 0);
    gl.uniform1f(gl.getUniformLocation(prog, 'u_time'), (now - start) * 0.001);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    raf = requestAnimationFrame(draw);
  };

  raf = requestAnimationFrame(draw);
  return () => cancelAnimationFrame(raf);
}
