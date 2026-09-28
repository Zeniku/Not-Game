class Angles {
  static rv = new Vec();
  static rand = new Rand();
 
    static forwardDistance(angle1, angle2) {
        return Math.abs(angle1 - angle2);
    }

    static backwardDistance(angle1, angle2) {
        return 360 - Math.abs(angle1 - angle2);
    }

    static within(a, b, margin) {
        return Angles.angleDist(a, b) <= margin;
    }

    static angleDist(a, b) {
        a = mod(a, 360);
        b = mod(b, 360);
        return Math.min(a - b < 0 ? a - b + 360 : a - b, b - a < 0 ? b - a + 360 : b - a);
    }

    static near(a, b, range) {
        return Angles.angleDist(a, b) < range;
    }

    static clampRange(angle, dest, range) {
        const dst = Angles.angleDist(angle, dest);
        return dst <= range ? angle : Angles.moveToward(angle, dest, dst - range);
    }

    static moveToward(angle, to, speed) {
        if (Math.abs(Angles.angleDist(angle, to)) < speed) return to;
        angle = mod(angle, 360);
        to = mod(to, 360);

        if ((angle > to) === (Angles.backwardDistance(angle, to) > Angles.forwardDistance(angle, to))) {
            angle -= speed;
        } else {
            angle += speed;
        }

        return angle;
    }

    // Overloaded angle() methods combined
    static angle(x, y, x2 = null, y2 = null) {
        if (x2 === null || y2 === null) {
            return Angles.angle(0, 0, x, y);
        }
        // In standard JS Math, atan2 takes (dy, dx).
        let ang = Math.atan2(y2 - y, x2 - x) * radDeg;
        if (ang < 0) ang += 360;
        return ang;
    }

    static angleRad(x, y, x2, y2) {
        return Math.atan2(y2 - y, x2 - x);
    }

    // Handles both trnsx(angle, len) AND trnsx(angle, x, y)
    static trnsx(angle, lenOrX, y = null) {
        if (y === null) {
            return lenOrX * Mathf.cosDeg(angle);
        }
        return this.rv.set(lenOrX, y).rotate(angle).x;
    }

    // Handles both trnsy(angle, len) AND trnsy(angle, x, y)
    static trnsy(angle, lenOrX, y = null) {
        if (y === null) {
            return lenOrX * Mathf.sinDeg(angle);
        }
        return this.rv.set(lenOrX, y).rotate(angle).y;
    }

    // NOTE: Adapted to require explicit passing of standard core dependencies
    static mouseAngle(cx, cy, cameraProjectCallback, mouseX, mouseY) {
        const avector = cameraProjectCallback(cx, cy); // Should return a vector object {x, y}
        return Angles.angle(avector.x, avector.y, mouseX, mouseY);
    }

    // --- Vector/Particle Iterators ---
    // Note: Java's Floatc2 is translated to a standard callback function: (x, y) => { ... }
    
    static circleVectors(points, length, offsetOrCallback, posCallback) {
        const hasOffset = typeof offsetOrCallback === "number";
        const offset = hasOffset ? offsetOrCallback : 0;
        const callback = hasOffset ? posCallback : offsetOrCallback;

        for (let i = 0; i < points; i++) {
            let f = (i * 360 / points) + offset;
            callback(Angles.trnsx(f, length), Angles.trnsy(f, length));
        }
    }

    static randVectors(seed, amount, length, cons) {
        this.rand.setSeed(seed);
        for (let i = 0; i < amount; i++) {
            this.rv.trns(this.rand.random(360), length);
            cons(this.rv.x, this.rv.y);
        }
    }

    static randLenVectors(seed, amount, length, cons) {
        this.rand.setSeed(seed);
        for (let i = 0; i < amount; i++) {
            this.rv.trns(this.rand.random(360), this.rand.random(length));
            cons(this.rv.x, this.rv.y);
        }
    }

    static randLenVectorsMin(seed, amount, minLength, length, cons) {
        this.rand.setSeed(seed);
        for (let i = 0; i < amount; i++) {
            this.rv.trns(this.rand.random(360), minLength + this.rand.random(length));
            cons(this.rv.x, this.rv.y);
        }
    }

    static randLenVectorsAngle(seed, amount, length, angle, range, cons) {
        this.rand.setSeed(seed);
        for (let i = 0; i < amount; i++) {
            this.rv.trns(angle + this.rand.range(range), this.rand.random(length));
            cons(this.rv.x, this.rv.y);
        }
    }

    static randLenVectorsSpread(seed, amount, length, angle, range, spread, cons) {
        this.rand.setSeed(seed);
        for (let i = 0; i < amount; i++) {
            this.rv.trns(angle + this.rand.range(range), this.rand.random(length));
            cons(this.rv.x + this.rand.range(spread), this.rv.y + this.rand.range(spread));
        }
    }

    // ParticleConsumer equivalents: callback looks like (x, y, fin, fout) => { ... }

    static randParticleVectors(seed, fin, amount, length, cons) {
        this.rand.setSeed(seed);
        for (let i = 0; i < amount; i++) {
            let l = this.rand.nextFloat();
            this.rv.trns(this.rand.random(360), length * l * fin);
            cons(this.rv.x, this.rv.y, fin * l, (1 - fin) * l);
        }
    }

    static randParticleVectorsAngle(seed, fin, amount, length, angle, range, cons) {
        this.rand.setSeed(seed);
        for (let i = 0; i < amount; i++) {
            this.rv.trns(angle + this.rand.range(range), this.rand.random(length * fin));
            cons(this.rv.x, this.rv.y, fin * this.rand.nextFloat(), 0);
        }
    }
};
