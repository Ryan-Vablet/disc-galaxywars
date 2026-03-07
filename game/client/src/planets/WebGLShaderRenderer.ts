type UniformValue =
  | { type: "1f"; value: number }
  | { type: "2f"; value: [number, number] }
  | { type: "3f"; value: [number, number, number] }
  | { type: "4f"; value: [number, number, number, number] }
  | { type: "1i"; value: number }
  | { type: "color"; value: [number, number, number, number] }
  | { type: "colorArray"; value: number[] };

const VERTEX_SHADER_SOURCE = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export class WebGLShaderRenderer {
  public readonly canvas: OffscreenCanvas | HTMLCanvasElement;
  private readonly gl: WebGL2RenderingContext | null;
  private quadVAO: WebGLVertexArrayObject | null = null;
  private quadBuffer: WebGLBuffer | null = null;

  public constructor(width: number, height: number) {
    this.canvas =
      typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(width, height) : document.createElement("canvas");
    if ("width" in this.canvas) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.gl = this.canvas.getContext("webgl2");
    if (!this.gl) {
      return;
    }
    const gl = this.gl;
    const vao = gl.createVertexArray();
    const buffer = gl.createBuffer();
    if (!vao || !buffer) {
      return;
    }
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    this.quadVAO = vao;
    this.quadBuffer = buffer;
  }

  public isAvailable(): boolean {
    return this.gl !== null;
  }

  public compileShader(fragmentSource: string): WebGLProgram {
    if (!this.gl) {
      return {} as WebGLProgram;
    }
    const gl = this.gl;
    const vertex = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertex, VERTEX_SHADER_SOURCE);
    gl.compileShader(vertex);
    const fragment = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragment, fragmentSource);
    gl.compileShader(fragment);
    const program = gl.createProgram()!;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.bindAttribLocation(program, 0, "a_position");
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    return program;
  }

  public render(program: WebGLProgram, uniforms: Record<string, UniformValue>): void {
    if (!this.gl) {
      const ctx = this.getCanvas2D();
      if (ctx) {
        ctx.fillStyle = "#2a3b4d";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }
      return;
    }
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(program);
    this.applyUniforms(program, uniforms);
    gl.bindVertexArray(this.quadVAO);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindVertexArray(null);
  }

  public async getImageBitmap(): Promise<ImageBitmap> {
    if ("transferToImageBitmap" in this.canvas) {
      return (this.canvas as OffscreenCanvas).transferToImageBitmap();
    }
    return createImageBitmap(this.canvas as HTMLCanvasElement);
  }

  public getCanvasSnapshot(): HTMLCanvasElement {
    const out = document.createElement("canvas");
    out.width = this.canvas.width;
    out.height = this.canvas.height;
    const ctx = out.getContext("2d");
    if (ctx) {
      ctx.drawImage(this.canvas as CanvasImageSource, 0, 0);
    }
    return out;
  }

  public destroy(): void {
    if (!this.gl) {
      return;
    }
    if (this.quadBuffer) {
      this.gl.deleteBuffer(this.quadBuffer);
    }
    if (this.quadVAO) {
      this.gl.deleteVertexArray(this.quadVAO);
    }
  }

  private applyUniforms(program: WebGLProgram, uniforms: Record<string, UniformValue>): void {
    if (!this.gl) {
      return;
    }
    const gl = this.gl;
    for (const [name, entry] of Object.entries(uniforms)) {
      const loc = gl.getUniformLocation(program, name);
      if (!loc) {
        continue;
      }
      if (entry.type === "1f") gl.uniform1f(loc, entry.value);
      if (entry.type === "2f") gl.uniform2f(loc, entry.value[0], entry.value[1]);
      if (entry.type === "3f") gl.uniform3f(loc, entry.value[0], entry.value[1], entry.value[2]);
      if (entry.type === "4f") gl.uniform4f(loc, entry.value[0], entry.value[1], entry.value[2], entry.value[3]);
      if (entry.type === "1i") gl.uniform1i(loc, entry.value);
      if (entry.type === "color") gl.uniform4f(loc, entry.value[0], entry.value[1], entry.value[2], entry.value[3]);
      if (entry.type === "colorArray") gl.uniform4fv(loc, new Float32Array(entry.value));
    }
  }

  private getCanvas2D(): CanvasRenderingContext2D | null {
    if (this.canvas instanceof HTMLCanvasElement) {
      return this.canvas.getContext("2d");
    }
    return null;
  }
}

export type { UniformValue };
