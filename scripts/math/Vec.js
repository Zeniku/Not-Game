function mod(n, m) {
    return ((n % m) + m) % m;
}
class Vec {
    constructor(x = 0, y = 0) {
        // Simple overload: if first arg is an object, copy it.
        if (typeof x === 'object' && x !== null) {
            this.x = x.x;
            this.y = x.y;
        } else {
            this.x = x;
            this.y = y;
        }
    }

    // --- Static Constants ---
    // Using getters to prevent accidental mutation of constants
    static get X() { return new Vec2(1, 0); }
    static get Y() { return new Vec2(0, 1); }
    static get ZERO() { return new Vec2(0, 0); }

    // --- Core Operations ---
    
    set(x, y) {
        if (y === undefined) {
            this.x = x.x;
            this.y = x.y;
        } else {
            this.x = x;
            this.y = y;
        }
        return this;
    }

    cpy() {
        return new Vec2(this.x, this.y);
    }

    add(x, y) {
        if (y === undefined) {
            this.x += x.x;
            this.y += x.y;
        } else {
            this.x += x;
            this.y += y;
        }
        return this;
    }

    sub(x, y) {
        if (y === undefined) {
            this.x -= x.x;
            this.y -= x.y;
        } else {
            this.x -= x;
            this.y -= y;
        }
        return this;
    }

    scl(x, y) {
        if (y === undefined) {
            if (typeof x === 'object') {
                this.x *= x.x;
                this.y *= x.y;
            } else { // Scalar
                this.x *= x;
                this.y *= x;
            }
        } else {
            this.x *= x;
            this.y *= y;
        }
        return this;
    }

    div(other) {
        this.x /= other.x;
        this.y /= other.y;
        return this;
    }

    inv() {
        return this.scl(-1);
    }

    mulAdd(vec, scalarOrVec) {
        if (typeof scalarOrVec === 'object') {
            this.x += vec.x * scalarOrVec.x;
            this.y += vec.y * scalarOrVec.y;
        } else {
            this.x += vec.x * scalarOrVec;
            this.y += vec.y * scalarOrVec;
        }
        return this;
    }

    // --- Length and Distance ---

    len() {
        return Math.hypot(this.x, this.y);
    }

    len2() {
        return this.x * this.x + this.y * this.y;
    }

    nor() {
        const len = this.len();
        if (len !== 0) {
            this.x /= len;
            this.y /= len;
        }
        return this;
    }

    dst(x, y) {
        if (y === undefined) {
            return Math.hypot(x.x - this.x, x.y - this.y);
        }
        return Math.hypot(x - this.x, y - this.y);
    }

    dst2(x, y) {
        if (y === undefined) {
            const dx = x.x - this.x;
            const dy = x.y - this.y;
            return dx * dx + dy * dy;
        }
        const dx = x - this.x;
        const dy = y - this.y;
        return dx * dx + dy * dy;
    }

    // --- Limits and Clamping ---

    limit(limit) {
        return this.limit2(limit * limit);
    }

    limit2(limit2) {
        const len2 = this.len2();
        if (len2 > limit2) {
            return this.scl(Math.sqrt(limit2 / len2));
        }
        return this;
    }

    setLength(len) {
        return this.setLength2(len * len);
    }

    setLength2(len2) {
        const oldLen2 = this.len2();
        return (oldLen2 === 0 || oldLen2 === len2) ? this : this.scl(Math.sqrt(len2 / oldLen2));
    }

    clampLength(min, max) {
        const len2 = this.len2();
        if (len2 >= max * max) return this.limit(max);
        if (len2 <= min * min) return this.setLength(min);
        return this;
    }

    // --- Angles and Rotation ---

    dot(x, y) {
        if (y === undefined) return this.x * x.x + this.y * x.y;
        return this.x * x + this.y * y;
    }

    crs(x, y) {
        if (y === undefined) return this.x * x.y - this.y * x.x;
        return this.x * y - this.y * x;
    }

    angle(reference) {
        if (reference) {
            return Math.atan2(this.crs(reference), this.dot(reference)) * Mathf.radDeg;
        }
        let angle = Math.atan2(this.y, this.x) * Mathf.radDeg; // Note: JS atan2 is (y, x)
        if (angle < 0) angle += 360;
        return angle;
    }

    angleRad(reference) {
        if (reference) return Math.atan2(this.crs(reference), this.dot(reference));
        return Math.atan2(this.y, this.x);
    }

    setAngle(degrees) {
        return this.setAngleRad(degrees * Mathf.degRad);
    }

    setAngleRad(radians) {
        this.set(this.len(), 0);
        return this.rotateRad(radians);
    }

    rotate(degrees) {
        return this.rotateRad(degrees * Mathf.degRad);
    }

    rotateRad(radians) {
        const cos = Mathf.cos(radians);
        const sin = Mathf.sin(radians);
        const newX = this.x * cos - this.y * sin;
        const newY = this.x * sin + this.y * cos;
        this.x = newX;
        this.y = newY;
        return this;
    }

    rotateAround(reference, degrees) {
        return this.sub(reference).rotate(degrees).add(reference);
    }

    rotate90(dir) {
        const x = this.x;
        if (dir >= 0) {
            this.x = -this.y;
            this.y = x;
        } else {
            this.x = this.y;
            this.y = -x;
        }
        return this;
    }

    trns(angle, xOrAmount, y) {
        if (y === undefined) {
            return this.set(xOrAmount, 0).rotate(angle);
        }
        return this.set(xOrAmount, y).rotate(angle);
    }

    // --- Lerping & Interpolation ---
    // NOTE: 'lerpDelta' and 'approachDelta' in Arc use Time.delta. 
    // You MUST pass your game's delta time into these JS functions, 
    // or bind a global Time object to your scope.

    approach(target, alpha) {
        let dx = this.x - target.x;
        let dy = this.y - target.y;
        let alpha2 = alpha * alpha;
        let len2 = dx * dx + dy * dy;

        if (len2 > alpha2) {
            let scl = Math.sqrt(alpha2 / len2);
            return this.sub(dx * scl, dy * scl);
        } else {
            return this.set(target);
        }
    }

    lerp(target, alpha) {
        const invAlpha = 1.0 - alpha;
        this.x = (this.x * invAlpha) + (target.x * alpha);
        this.y = (this.y * invAlpha) + (target.y * alpha);
        return this;
    }

    // --- Equality & Formatting ---

    snap() {
        this.x = Math.trunc(this.x);
        this.y = Math.trunc(this.y);
        return this;
    }

    isZero(margin = 0) {
        if (margin === 0) return this.x === 0 && this.y === 0;
        return this.len2() < margin;
    }
    nearZero(){
        return this.isZero(0.0009)
    }

    epsilonEquals(x, y, epsilon = Mathf.FLOAT_ROUNDING_ERROR) {
        if (typeof x === 'object') {
            epsilon = y !== undefined ? y : Mathf.FLOAT_ROUNDING_ERROR;
            return Math.abs(x.x - this.x) <= epsilon && Math.abs(x.y - this.y) <= epsilon;
        }
        return Math.abs(x - this.x) <= epsilon && Math.abs(y - this.y) <= epsilon;
    }

    toString() {
        return `(${this.x},${this.y})`;
    }
}