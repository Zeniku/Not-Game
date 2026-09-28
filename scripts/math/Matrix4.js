class Matrix4 {
  static identity() {
    return new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);
  }

  static translate(m, x, y, z) {
    const out = new Float32Array(m);
    out[12] = m[0] * x + m[4] * y + m[8] * z + m[12];
    out[13] = m[1] * x + m[5] * y + m[9] * z + m[13];
    out[14] = m[2] * x + m[6] * y + m[10] * z + m[14];
    out[15] = m[3] * x + m[7] * y + m[11] * z + m[15];
    return out;
  }

  static rotateX(m, angle) {
    const c = Math.cos(angle), s = Math.sin(angle);
    const out = new Float32Array(m);
    out[4] = m[4] * c + m[8] * s;   out[5] = m[5] * c + m[9] * s;
    out[6] = m[6] * c + m[10] * s;  out[7] = m[7] * c + m[11] * s;
    out[8] = m[4] * -s + m[8] * c;  out[9] = m[5] * -s + m[9] * c;
    out[10] = m[6] * -s + m[10] * c; out[11] = m[7] * -s + m[11] * c;
    return out;
  }

  static rotateY(m, angle) {
    const c = Math.cos(angle), s = Math.sin(angle);
    const out = new Float32Array(m);
    out[0] = m[0] * c + m[8] * -s;  out[1] = m[1] * c + m[9] * -s;
    out[2] = m[2] * c + m[10] * -s; out[3] = m[3] * c + m[11] * -s;
    out[8] = m[0] * s + m[8] * c;   out[9] = m[1] * s + m[9] * c;
    out[10] = m[2] * s + m[10] * c; out[11] = m[3] * s + m[11] * c;
    return out;
  }

  static multiply(a, b) {
    const out = new Float32Array(16);
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        out[i * 4 + j] =
          a[0 * 4 + j] * b[i * 4 + 0] +
          a[1 * 4 + j] * b[i * 4 + 1] +
          a[2 * 4 + j] * b[i * 4 + 2] +
          a[3 * 4 + j] * b[i * 4 + 3];
      }
    }
    return out;
  }

  static ortho(left, right, bottom, top, near, far) {
    return new Float32Array([
      2 / (right - left), 0, 0, 0,
      0, 2 / (top - bottom), 0, 0,
      0, 0, -2 / (far - near), 0,
      -(right + left) / (right - left), -(top + bottom) / (top - bottom), -(far + near) / (far - near), 1
    ]);
  }

  static perspective(fov, aspect, near, far) {
    const f = 1.0 / Math.tan(fov * Math.PI / 180 / 2);
    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) / (near - far), -1,
      0, 0, (2 * far * near) / (near - far), 0
    ]);
  }
}
