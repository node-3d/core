import { webgl } from "@node-3d/webgl";
import { Image as image_Image } from "@node-3d/image";
import { Document as glfw_Document, Window, glfw } from "@node-3d/glfw";
import { Blob } from "node:buffer";
import node_fs from "node:fs";
import { download, getLogger } from "@node-3d/addon-tools";
import node_events from "node:events";
const location_location = {
    href: 'https://www.google.com/_/chrome/newtab?ie=UTF-8',
    ancestorOrigins: {},
    origin: 'https://www.google.com',
    protocol: 'https:',
    host: 'www.google.com',
    hostname: 'www.google.com',
    port: '',
    pathname: '/_/chrome/newtab',
    search: '?ie=UTF-8',
    hash: ''
};
const navigator_navigator = {
    appCodeName: 'Mozilla',
    appName: 'Netscape',
    appVersion: 'Node3D',
    bluetooth: {},
    clipboard: {},
    connection: {
        onchange: null,
        effectiveType: '4g',
        rtt: 50,
        downlink: 3.3,
        saveData: false
    },
    cookieEnabled: false,
    credentials: {},
    deviceMemory: 8,
    doNotTrack: null,
    geolocation: {},
    hardwareConcurrency: 4,
    keyboard: {},
    language: 'en',
    languages: [
        'en',
        'en-US'
    ],
    locks: {},
    maxTouchPoints: 0,
    mediaCapabilities: {},
    mediaDevices: {
        ondevicechange: null
    },
    mimeTypes: {
        length: 0
    },
    onLine: false,
    permissions: {},
    platform: 'Any',
    plugins: {
        length: 0
    },
    presentation: {
        defaultRequest: null,
        receiver: null
    },
    product: 'Node3D',
    productSub: '1',
    serviceWorker: {
        ready: Promise.resolve(false),
        controller: null,
        oncontrollerchange: null,
        onmessage: null
    },
    storage: {},
    usb: {
        onconnect: null,
        ondisconnect: null
    },
    userAgent: 'Mozilla/Node3D',
    vendor: 'Node3D',
    vendorSub: '',
    webkitPersistentStorage: {},
    webkitTemporaryStorage: {}
};
class WebVRManager {
    get enabled() {
        return false;
    }
    isPresenting() {
        return false;
    }
    dispose() {}
    setAnimationLoop() {}
    getCamera() {
        return {};
    }
    submitFrame() {}
}
const logger = getLogger('3d-core');
const finishLoad = (responseType, mimeType, onLoad, buffer)=>{
    if (!onLoad) return;
    if ('arraybuffer' === responseType) return void onLoad(new Uint8Array(buffer).buffer);
    if ('blob' === responseType) return void onLoad(new Blob([
        buffer
    ]));
    if ('document' === responseType) return void onLoad({});
    if ('json' === responseType) {
        try {
            onLoad(JSON.parse(buffer.toString()));
        } catch  {
            onLoad({});
        }
        return;
    }
    if (!mimeType) return void onLoad(buffer.toString());
    const re = /charset="?([^;"\s]*)"?/iu;
    const exec = re.exec(mimeType);
    const label = exec && exec[1] ? exec[1].toLowerCase() : void 0;
    const decoder = new TextDecoder(label);
    onLoad(decoder.decode(buffer));
};
const addThreeHelpers = (three)=>{
    const fileLoaderPrototype = three.FileLoader.prototype;
    fileLoaderPrototype.load = function(url, onLoad, _onProgress, onError) {
        if (url.startsWith('data:')) {
            const [head, body] = url.split(',');
            const isBase64 = head.includes('base64');
            const data = isBase64 ? Buffer.from(body, 'base64') : Buffer.from(unescape(body));
            finishLoad(this.responseType, this.mimeType, onLoad, data);
            return this;
        }
        if (/^https?:\/\//iu.test(url)) {
            (async ()=>{
                try {
                    const data = await download(url);
                    finishLoad(this.responseType, this.mimeType, onLoad, data);
                } catch (error) {
                    if ('function' == typeof onError) onError(error);
                    else logger.error(error);
                }
            })();
            return this;
        }
        const fsUrl = void 0 === this.path ? url : this.path + url;
        node_fs.readFile(fsUrl, (error, data)=>{
            if (error) {
                if ('function' == typeof onError) onError(error);
                else logger.error(error);
                return;
            }
            finishLoad(this.responseType, this.mimeType, onLoad, data);
        });
        return this;
    };
    const Texture = three.Texture;
    Texture.fromId = (id, renderer)=>{
        const rawTexture = {
            _: id
        };
        const texture = new three.Texture();
        const properties = renderer.properties?.get(texture) ?? texture;
        properties['__webglTexture'] = rawTexture;
        properties['__webglInit'] = true;
        return texture;
    };
};
const hasXY = (value)=>'x' in value && 'y' in value && 'number' == typeof value.x && 'number' == typeof value.y;
class Vec2 extends Array {
    constructor(x, y){
        super();
        this.x = 0;
        this.y = 0;
        if (null == x) return;
        if ('number' == typeof x) {
            if (Number.isNaN(x)) return;
            this.x = x;
            this.y = 'number' == typeof y ? y : x;
            return;
        }
        if (Array.isArray(x) || x instanceof Vec2) {
            this.x = x[0];
            this.y = x[1];
            return;
        }
        if (hasXY(x)) {
            this.x = x.x;
            this.y = x.y;
        }
    }
    get x() {
        return this[0];
    }
    set x(value) {
        this[0] = value;
    }
    get y() {
        return this[1];
    }
    set y(value) {
        this[1] = value;
    }
    get clone() {
        return new this.constructor(this);
    }
    get xy() {
        return new Vec2(this);
    }
    set xy(value) {
        this[0] = value[0];
        this[1] = value[1];
    }
    get yx() {
        return new Vec2([
            this[1],
            this[0]
        ]);
    }
    set yx(value) {
        this[0] = value[1];
        this[1] = value[0];
    }
    plused(other) {
        this[0] += other[0];
        this[1] += other[1];
        return this;
    }
    plus(other) {
        return this.clone.plused(other);
    }
    added(other) {
        return this.plused(other);
    }
    add(other) {
        return this.clone.plused(other);
    }
    minused(other) {
        this[0] -= other[0];
        this[1] -= other[1];
        return this;
    }
    minus(other) {
        return this.clone.minused(other);
    }
    subed(other) {
        return this.minused(other);
    }
    sub(other) {
        return this.clone.minused(other);
    }
    subtracted(other) {
        return this.minused(other);
    }
    subtract(other) {
        return this.clone.minused(other);
    }
    substracted() {
        throw new Error('Use subtract instead of sub-S-tract.');
    }
    substract() {
        throw new Error('Use subtract instead of sub-S-tract.');
    }
    muled(other) {
        this[0] *= other[0];
        this[1] *= other[1];
        return this;
    }
    mul(other) {
        return this.clone.muled(other);
    }
    multiplied(other) {
        return this.muled(other);
    }
    multiply(other) {
        return this.clone.muled(other);
    }
    crossed(other) {
        return this.muled(other);
    }
    cross(other) {
        return this.clone.crossed(other);
    }
    dived(other) {
        this[0] /= other[0];
        this[1] /= other[1];
        return this;
    }
    div(other) {
        return this.clone.dived(other);
    }
    divided(other) {
        return this.dived(other);
    }
    divide(other) {
        return this.clone.dived(other);
    }
    maxed(other) {
        this[0] = Math.max(this[0], other[0]);
        this[1] = Math.max(this[1], other[1]);
        return this;
    }
    max(other) {
        return this.clone.maxed(other);
    }
    mined(other) {
        this[0] = Math.min(this[0], other[0]);
        this[1] = Math.min(this[1], other[1]);
        return this;
    }
    min(other) {
        return this.clone.mined(other);
    }
    get neged() {
        this[0] = -this[0];
        this[1] = -this[1];
        return this;
    }
    get neg() {
        return this.clone.neged;
    }
    scaled(scalar) {
        this[0] *= scalar;
        this[1] *= scalar;
        return this;
    }
    scale(scalar) {
        return this.clone.scaled(scalar);
    }
    get rounded() {
        this[0] = Math.round(this[0]);
        this[1] = Math.round(this[1]);
        return this;
    }
    get round() {
        return this.clone.rounded;
    }
    get floored() {
        this[0] = Math.floor(this[0]);
        this[1] = Math.floor(this[1]);
        return this;
    }
    get floor() {
        return this.clone.floored;
    }
    get ceiled() {
        this[0] = Math.ceil(this[0]);
        this[1] = Math.ceil(this[1]);
        return this;
    }
    get ceil() {
        return this.clone.ceiled;
    }
    fracted(scalar) {
        this[0] /= scalar;
        this[1] /= scalar;
        return this;
    }
    fract(scalar) {
        return this.clone.fracted(scalar);
    }
    get isZero() {
        return 0 === this[0] && 0 === this[1];
    }
    cmp(cb) {
        return cb(this[0], 0) && cb(this[1], 1);
    }
    dot(other) {
        return this[0] * other[0] + this[1] * other[1];
    }
    get sqLen() {
        return this.dot(this);
    }
    get sqLength() {
        return this.sqLen;
    }
    get squareLength() {
        return this.sqLen;
    }
    get len() {
        return Math.sqrt(this.sqLen);
    }
    get length() {
        return this.len;
    }
    get size() {
        return this.len;
    }
    dist(other) {
        return new Vec2(other).minused(this).len;
    }
    distance(other) {
        return this.dist(other);
    }
    sqDist(other) {
        return new Vec2(other).minused(this).sqLen;
    }
    sqDistance(other) {
        return this.sqDist(other);
    }
    squareDistance(other) {
        return this.sqDist(other);
    }
    copy(other) {
        this[0] = other[0];
        this[1] = other[1];
        return this;
    }
    toString() {
        return `Vec2(${this[0]}, ${this[1]})`;
    }
    get ortho() {
        return new Vec2(this[1], -this[0]);
    }
    get orthoCw() {
        return this.ortho;
    }
    get orthoClockwise() {
        return this.ortho;
    }
    get orthoCcw() {
        return new Vec2(-this[1], this[0]);
    }
    get orthoCounterClockwise() {
        return this.orthoCcw;
    }
    crossLen(other) {
        return this[0] * other[1] - this[1] * other[0];
    }
    crossLength(other) {
        return this.crossLen(other);
    }
    rotated(angle) {
        if (0 === angle) return this;
        const x = this[0];
        const y = this[1];
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        this[0] = c * x - s * y;
        this[1] = s * x + c * y;
        return this;
    }
    rotate(angle) {
        return this.clone.rotated(angle);
    }
    centroid(b, c) {
        return this.clone.plused(b).plused(c).scaled(1 / 3);
    }
    get normed() {
        const sqLen = this.sqLen;
        return sqLen > 0 ? this.scaled(1 / Math.sqrt(sqLen)) : this;
    }
    get norm() {
        return this.clone.normed;
    }
    get normalized() {
        return this.normed;
    }
    get normalize() {
        return this.clone.normed;
    }
    lerped(other, t) {
        return this.plused(new Vec2(other).minused(this).scaled(t));
    }
    lerp(other, t) {
        return this.clone.lerped(other, t);
    }
    reflected(normal) {
        return this.minused(normal.scale(2 * this.dot(normal)));
    }
    reflect(normal) {
        return this.clone.reflected(normal);
    }
    getLineSegmentsIntersection(p0, p1, p2, p3) {
        return Vec2.getLineSegmentsIntersection(p0, p1, p2, p3);
    }
    getLineSegmentsIntersectionFraction(p0, p1, p2, p3) {
        return Vec2.getLineSegmentsIntersectionFraction(p0, p1, p2, p3);
    }
    static getLineSegmentsIntersection(p0, p1, p2, p3) {
        const t = Vec2.getLineSegmentsIntersectionFraction(p0, p1, p2, p3);
        if (t < 0) return null;
        return new Vec2(p0[0] + t * (p1[0] - p0[0]), p0[1] + t * (p1[1] - p0[1]));
    }
    static getLineSegmentsIntersectionFraction(p0, p1, p2, p3) {
        const s1X = p1[0] - p0[0];
        const s1Y = p1[1] - p0[1];
        const s2X = p3[0] - p2[0];
        const s2Y = p3[1] - p2[1];
        const denominator = -s2X * s1Y + s1X * s2Y;
        const s = (-s1Y * (p0[0] - p2[0]) + s1X * (p0[1] - p2[1])) / denominator;
        const t = (s2X * (p0[1] - p2[1]) - s2Y * (p0[0] - p2[0])) / denominator;
        return s >= 0 && s <= 1 && t >= 0 && t <= 1 ? t : -1;
    }
}
const hasXYZ = (value)=>'x' in value && 'y' in value && 'z' in value && 'number' == typeof value.x && 'number' == typeof value.y && 'number' == typeof value.z;
class Vec3 extends Vec2 {
    constructor(x, y, z){
        super(x, 'number' == typeof y ? y : void 0);
        this.z = 0;
        if (null == x) return;
        if ('number' == typeof x) {
            if (!Number.isNaN(x)) this.z = 'number' == typeof z ? z : x;
            return;
        }
        if (Array.isArray(x) || x instanceof Vec3) {
            this.z = x[2];
            return;
        }
        if (hasXYZ(x)) {
            this.z = x.z;
            return;
        }
        if (x instanceof Vec2) {
            if (Array.isArray(y) || y instanceof Vec2) this.z = y[0];
            else if ('number' == typeof y) this.z = y;
        }
    }
    get z() {
        return this[2];
    }
    set z(value) {
        this[2] = value;
    }
    get xyz() {
        return new Vec3(this);
    }
    set xyz(value) {
        this[0] = value[0];
        this[1] = value[1];
        this[2] = value[2];
    }
    get yxz() {
        return new Vec3([
            this[1],
            this[0],
            this[2]
        ]);
    }
    set yxz(value) {
        this[1] = value[0];
        this[0] = value[1];
        this[2] = value[2];
    }
    get zyx() {
        return new Vec3([
            this[2],
            this[1],
            this[0]
        ]);
    }
    set zyx(value) {
        this[2] = value[0];
        this[1] = value[1];
        this[0] = value[2];
    }
    get yzx() {
        return new Vec3([
            this[1],
            this[2],
            this[0]
        ]);
    }
    set yzx(value) {
        this[0] = value[0];
        this[1] = value[1];
        this[2] = value[2];
    }
    get xzy() {
        return new Vec3([
            this[0],
            this[2],
            this[1]
        ]);
    }
    set xzy(value) {
        this[0] = value[0];
        this[2] = value[1];
        this[1] = value[2];
    }
    plused(other) {
        super.plused(other);
        this[2] += other[2];
        return this;
    }
    minused(other) {
        super.minused(other);
        this[2] -= other[2];
        return this;
    }
    muled(other) {
        super.muled(other);
        this[2] *= other[2];
        return this;
    }
    dived(other) {
        super.dived(other);
        this[2] /= other[2];
        return this;
    }
    maxed(other) {
        super.maxed(other);
        this[2] = Math.max(this[2], other[2]);
        return this;
    }
    mined(other) {
        super.mined(other);
        this[2] = Math.min(this[2], other[2]);
        return this;
    }
    get neged() {
        this[0] = -this[0];
        this[1] = -this[1];
        this[2] = -this[2];
        return this;
    }
    scaled(scalar) {
        super.scaled(scalar);
        this[2] *= scalar;
        return this;
    }
    fracted(scalar) {
        super.fracted(scalar);
        this[2] /= scalar;
        return this;
    }
    get rounded() {
        this[2] = Math.round(this[2]);
        return super.rounded;
    }
    get floored() {
        this[2] = Math.floor(this[2]);
        return super.floored;
    }
    get ceiled() {
        this[2] = Math.ceil(this[2]);
        return super.ceiled;
    }
    get isZero() {
        return super.isZero && 0 === this[2];
    }
    cmp(cb) {
        return super.cmp(cb) && cb(this[2], 2);
    }
    dot(other) {
        return super.dot(other) + this[2] * other[2];
    }
    toString() {
        return `Vec3(${this[0]}, ${this[1]}, ${this[2]})`;
    }
}
const hasXYZW = (value)=>'x' in value && 'y' in value && 'z' in value && 'w' in value && 'number' == typeof value.x && 'number' == typeof value.y && 'number' == typeof value.z && 'number' == typeof value.w;
class Vec4 extends Vec3 {
    constructor(x, y, z, w){
        super(x, y, z);
        this.w = 1;
        if (null == x) return;
        if ('number' == typeof x) {
            if (!Number.isNaN(x)) this.w = 'number' == typeof w ? w : x;
            return;
        }
        this.w = Vec4.wFromObject(x, y);
    }
    static wFromObject(source, next) {
        if (null == source || 'number' == typeof source) return 1;
        if (Array.isArray(source) || source instanceof Vec4) return source[3];
        if (hasXYZW(source)) return source.w;
        if (source instanceof Vec3) return 'number' == typeof next ? next : 1;
        if (source instanceof Vec2) {
            if (Array.isArray(next) || next instanceof Vec2 || next instanceof Vec3) return next[1];
            if ('number' == typeof next) return next;
        }
        return 1;
    }
    get w() {
        return this[3];
    }
    set w(value) {
        this[3] = value;
    }
    get xyzw() {
        return new Vec4(this);
    }
    set xyzw(value) {
        this[0] = value[0];
        this[1] = value[1];
        this[2] = value[2];
        this[3] = value[3];
    }
    get yxzw() {
        return new Vec4([
            this[1],
            this[0],
            this[2],
            this[3]
        ]);
    }
    set yxzw(value) {
        this[1] = value[0];
        this[0] = value[1];
        this[2] = value[2];
        this[3] = value[3];
    }
    get zyxw() {
        return new Vec4([
            this[2],
            this[1],
            this[0],
            this[3]
        ]);
    }
    set zyxw(value) {
        this[2] = value[0];
        this[1] = value[1];
        this[0] = value[2];
        this[3] = value[3];
    }
    get yzxw() {
        return new Vec4([
            this[1],
            this[2],
            this[0],
            this[3]
        ]);
    }
    set yzxw(value) {
        this[0] = value[0];
        this[1] = value[1];
        this[2] = value[2];
        this[3] = value[3];
    }
    get xzyw() {
        return new Vec4([
            this[0],
            this[2],
            this[1],
            this[3]
        ]);
    }
    set xzyw(value) {
        this[0] = value[0];
        this[2] = value[1];
        this[1] = value[2];
        this[3] = value[3];
    }
    plused(other) {
        super.plused(other);
        this[3] += other[3];
        return this;
    }
    minused(other) {
        super.minused(other);
        this[3] -= other[3];
        return this;
    }
    muled(other) {
        super.muled(other);
        this[3] *= other[3];
        return this;
    }
    dived(other) {
        super.dived(other);
        this[3] /= other[3];
        return this;
    }
    maxed(other) {
        super.maxed(other);
        this[3] = Math.max(this[3], other[3]);
        return this;
    }
    mined(other) {
        super.mined(other);
        this[3] = Math.min(this[3], other[3]);
        return this;
    }
    get neged() {
        this[0] = -this[0];
        this[1] = -this[1];
        this[2] = -this[2];
        this[3] = -this[3];
        return this;
    }
    scaled(scalar) {
        super.scaled(scalar);
        this[3] *= scalar;
        return this;
    }
    fracted(scalar) {
        super.fracted(scalar);
        this[3] /= scalar;
        return this;
    }
    get rounded() {
        this[3] = Math.round(this[3]);
        return super.rounded;
    }
    get floored() {
        this[3] = Math.floor(this[3]);
        return super.floored;
    }
    get ceiled() {
        this[3] = Math.ceil(this[3]);
        return super.ceiled;
    }
    get isZero() {
        return super.isZero && 0 === this[3];
    }
    cmp(cb) {
        return super.cmp(cb) && cb(this[3], 3);
    }
    dot(other) {
        return super.dot(other) + this[3] * other[3];
    }
    toString() {
        return `Vec4(${this[0]}, ${this[1]}, ${this[2]}, ${this[3]})`;
    }
}
const hasRgb = (value)=>'r' in value && 'g' in value && 'b' in value && 'number' == typeof value.r && 'number' == typeof value.g && 'number' == typeof value.b;
class Color extends Vec4 {
    constructor(source, g, b, a){
        const { r, g: green, b: blue, a: alpha } = Color.rgbaFrom(source, g, b, a);
        super(r, green, blue, alpha);
    }
    static clampTo1(value) {
        return value > 1 ? value / 255 : value;
    }
    static rgbaFrom(source, g, b, a) {
        if (void 0 === source) return Color.rgbaFromEmpty();
        if ('object' == typeof source) return Color.rgbaFromObject(source, g);
        if ('number' == typeof source && source < 256) return Color.rgbaFromFloats(source, g, b, a);
        return Color.rgbaFromString(source);
    }
    static rgbaFromEmpty() {
        return {
            r: 0,
            g: 0,
            b: 0,
            a: 1
        };
    }
    static rgbaFromObject(source, alpha) {
        let r = 0;
        let g = 0;
        let b = 0;
        let a = 1;
        if (null === source) return {
            r,
            g,
            b,
            a
        };
        if (Array.isArray(source) || source instanceof Color) {
            r = source[0];
            g = source[1];
            b = source[2];
            a = 'number' == typeof source[3] ? source[3] : 1;
        } else if (hasRgb(source)) {
            r = source.r;
            g = source.g;
            b = source.b;
            a = 'number' == typeof source.a ? source.a : 1;
        } else if (source instanceof Vec3) {
            r = source.x;
            g = source.y;
            b = source.z;
            a = 'number' == typeof alpha ? alpha : 1;
        }
        return {
            r: Color.clampTo1(r),
            g: Color.clampTo1(g),
            b: Color.clampTo1(b),
            a: Color.clampTo1(a)
        };
    }
    static rgbaFromFloats(rRaw, gRaw, bRaw, aRaw) {
        let r = 0;
        let g = 0;
        let b = 0;
        let a = 1;
        if (Number.isNaN(rRaw)) return {
            r,
            g,
            b,
            a
        };
        r = rRaw;
        g = 'number' == typeof gRaw && 'number' == typeof bRaw ? gRaw : rRaw;
        b = 'number' == typeof bRaw ? bRaw : rRaw;
        if ('number' == typeof aRaw) a = aRaw;
        else if ('number' == typeof bRaw) a = 1;
        else if ('number' == typeof gRaw) a = gRaw;
        return {
            r: Color.clampTo1(r),
            g: Color.clampTo1(g),
            b: Color.clampTo1(b),
            a: Color.clampTo1(a)
        };
    }
    static rgbaFromString(source) {
        let r = 0;
        let g = 0;
        let b = 0;
        let a = 1;
        let rest = 'string' == typeof source ? Number.parseInt(source, 16) : source;
        if (Number.isNaN(rest)) return {
            r,
            g,
            b,
            a
        };
        if (rest > 16777216) {
            a = rest % 256;
            rest = Math.floor(rest / 256);
        }
        b = rest % 256;
        rest = Math.floor(rest / 256);
        g = rest % 256;
        rest = Math.floor(rest / 256);
        r = rest % 256;
        return {
            r: Color.clampTo1(r),
            g: Color.clampTo1(g),
            b: Color.clampTo1(b),
            a: Color.clampTo1(a)
        };
    }
    get r() {
        return this.x;
    }
    set r(value) {
        this.x = value;
    }
    get g() {
        return this.y;
    }
    set g(value) {
        this.y = value;
    }
    get b() {
        return this.z;
    }
    set b(value) {
        this.z = value;
    }
    get a() {
        return this.w;
    }
    set a(value) {
        this.w = value;
    }
    get rgb() {
        return new Color(this.r, this.g, this.b);
    }
    set rgb(value) {
        this.xyz = value;
    }
    get rgba() {
        return new Color(this.r, this.g, this.b, this.a);
    }
    set rgba(value) {
        this.xyzw = value;
    }
    get opacity() {
        return this.a;
    }
    get hex() {
        const scaled = this.scale(255).rounded;
        return scaled.b + 256 * scaled.g + 65536 * scaled.r;
    }
    toHex() {
        return this.hex;
    }
    get hexA() {
        return Math.round(255 * this.a) + 256 * this.toHex();
    }
    toHexA() {
        return this.hexA;
    }
    toString() {
        const r = Math.round(255 * this.r);
        return (r > 15 ? '' : '0') + this.hex.toString(16);
    }
    toStringA() {
        const r = Math.round(255 * this.r);
        return (r > 15 ? '' : '0') + this.hexA.toString(16);
    }
}
const DEFAULT_FOV = 90;
const DEFAULT_NEAR = 0.2;
const DEFAULT_FAR = 400;
const GL_POINT_SPRITE = 0x8861;
const GL_VERTEX_PROGRAM_POINT_SIZE = 0x8642;
const GL_COORD_REPLACE = 0x8862;
class Screen extends node_events {
    _three;
    _gl;
    _doc;
    _Image;
    _camera;
    _scene;
    _renderer;
    _autoRenderer = false;
    constructor(opts = {}){
        super();
        const { three, gl, doc, Image } = Screen.resolveImplementations(opts);
        this._three = three;
        this._gl = gl;
        this._doc = doc;
        this._Image = Image;
        if (opts.title) this.title = opts.title;
        this._camera = this._createCamera(opts);
        this._scene = opts.scene ?? new this._three.Scene();
        if (opts.renderer) {
            this._autoRenderer = false;
            this._renderer = opts.renderer;
        }
        this._reinitRenderer();
        this._renderer.setSize(this._doc.width, this._doc.height, false);
        this._bindDocumentEvents();
        this._bindEvents();
        this.draw();
    }
    get context() {
        return this._gl;
    }
    get three() {
        return this._three;
    }
    get renderer() {
        return this._renderer;
    }
    get scene() {
        return this._scene;
    }
    get camera() {
        return this._camera;
    }
    get document() {
        return this._doc;
    }
    get canvas() {
        return this._doc;
    }
    get width() {
        return this._doc.width;
    }
    get height() {
        return this._doc.height;
    }
    get w() {
        return this._doc.width;
    }
    get h() {
        return this._doc.height;
    }
    get size() {
        return new this._three.Vector2(this.w, this.h);
    }
    get title() {
        return this._doc.title;
    }
    set title(value) {
        this._doc.title = value || 'Untitled';
    }
    get icon() {
        return this._doc.icon;
    }
    set icon(value) {
        this._doc.icon = value || null;
    }
    get fov() {
        return this._camera.fov;
    }
    set fov(value) {
        this._camera.fov = value;
        this._camera.updateProjectionMatrix();
    }
    get mode() {
        return this._doc.mode;
    }
    set mode(value) {
        this._doc.mode = value;
    }
    draw() {
        this._renderer.render(this._scene, this._camera);
    }
    snapshot(name = `${Date.now()}.jpg`) {
        const memSize = this.w * this.h * 4;
        const storage = {
            data: Buffer.allocUnsafeSlow(memSize)
        };
        this._gl.readPixels(0, 0, this.w, this.h, this._gl.RGBA, this._gl.UNSIGNED_BYTE, storage);
        const img = this._Image.fromPixels(this.w, this.h, 32, storage.data);
        img.save(name);
    }
    static deepAssign(src, dest) {
        for (const [key, value] of Object.entries(src)){
            if (value && 'object' == typeof value) {
                Screen.deepAssign(value, dest[key]);
                continue;
            }
            dest[key] = value;
        }
    }
    _bindEvents() {
        for (const type of [
            'keydown',
            'keyup',
            'mousedown',
            'mouseup',
            'mousemove',
            'mousewheel'
        ])this._doc.on(type, (event)=>this.emit(type, event));
    }
    _reinitRenderer() {
        const old = this._renderer;
        const renderProps = old ? {
            shadowMap: {
                enabled: old.shadowMap.enabled,
                type: old.shadowMap.type
            },
            debug: {
                checkShaderErrors: old.debug_checkShaderErrors,
                onShaderError: old.debug_onShaderError
            },
            autoClear: old.autoClear,
            autoClearColor: old.autoClearColor,
            autoClearDepth: old.autoClearDepth,
            autoClearStencil: old.autoClearStencil,
            clippingPlanes: old.clippingPlanes,
            outputColorSpace: old.outputColorSpace,
            sortObjects: old.sortObjects,
            toneMapping: old.toneMapping,
            toneMappingExposure: old.toneMappingExposure,
            transmissionResolutionScale: old.transmissionResolutionScale
        } : null;
        if (this._autoRenderer && old) old.dispose();
        this._autoRenderer = true;
        this._renderer = new this._three.WebGLRenderer({
            context: this._gl,
            canvas: this.canvas
        });
        this._camera.aspect = this.w / this.h;
        this._camera.updateProjectionMatrix();
        this._renderer.setSize(this.w, this.h, false);
        if (renderProps) Screen.deepAssign(renderProps, this._renderer);
        const gl = this._gl;
        gl.enable(GL_POINT_SPRITE);
        gl.enable(GL_VERTEX_PROGRAM_POINT_SIZE);
        gl.enable(GL_COORD_REPLACE);
    }
    static resolveImplementations(opts) {
        const nodeGlobal = globalThis;
        const three = opts.three ?? opts.THREE ?? nodeGlobal.THREE;
        const gl = opts.gl ?? nodeGlobal['_gl'];
        const doc = opts.doc ?? opts.document ?? nodeGlobal.document;
        const Image = opts.Image ?? nodeGlobal.Image;
        if (!three || !gl || !doc || !Image) throw new Error('Screen requires three, webgl, document, and Image implementations.');
        return {
            three,
            gl,
            doc,
            Image
        };
    }
    _createCamera(opts) {
        if (opts.camera) return opts.camera;
        const { fov, near, far, z } = opts;
        if (0 === fov) {
            const camera = new this._three.OrthographicCamera(0.5 * -this.w, 0.5 * this.w, 0.5 * this.h, 0.5 * -this.h, near ?? -10, far ?? 10);
            camera.position.z = z ?? 5;
            return camera;
        }
        const camera = new this._three.PerspectiveCamera(fov ?? DEFAULT_FOV, this.w / this.h, near ?? DEFAULT_NEAR, far ?? DEFAULT_FAR);
        camera.position.z = z ?? 10;
        return camera;
    }
    _bindDocumentEvents() {
        this._doc.on('mode', (event)=>{
            this._reinitRenderer();
            this.emit('mode', event);
        });
        this._doc.on('resize', ({ width, height })=>{
            const width16 = Math.max(16, width);
            const height16 = Math.max(16, height);
            this._camera.aspect = width16 / height16;
            this._camera.updateProjectionMatrix();
            this._renderer.setSize(width16, height16, false);
            this.emit('resize', {
                width,
                height
            });
        });
    }
}
class Drawable {
    _screen;
    _three;
    _pos;
    _z;
    _visible;
    _mesh;
    _color;
    constructor(opts){
        this._screen = opts.screen;
        this._three = this._screen.three;
        this._pos = new Vec2(opts.pos || [
            0,
            0
        ]);
        this._z = 0;
        this._visible = true;
        this._mesh = this._build(opts);
        this.screen.scene.add(this._mesh);
        this.color = Drawable.makeColor(opts.color);
        this.pos = this._pos;
        this.z = opts.z || 0;
    }
    get three() {
        return this._three;
    }
    get screen() {
        return this._screen;
    }
    set screen(_value) {}
    get mat() {
        return this._mesh.material;
    }
    get geo() {
        return this._mesh.geometry;
    }
    get mesh() {
        return this._mesh;
    }
    get z() {
        return this._z;
    }
    set z(value) {
        this._z = value;
        this._mesh.position.z = this._z;
    }
    get visible() {
        return this._visible;
    }
    set visible(value) {
        this._visible = value;
        this._mesh.visible = this._visible;
    }
    get pos() {
        return this._pos.xy;
    }
    set pos(value) {
        this._pos.copy(value);
        this._mesh.position.x = this._pos.x;
        this._mesh.position.y = this._pos.y;
    }
    get color() {
        return this._color;
    }
    set color(value) {
        this._color = value;
        if (this.mat.color) this.mat.color.setHex(this._color.toHex());
        if (void 0 !== this.mat.opacity) this.mat.opacity = this._color.a;
    }
    _build(opts) {
        return new this.screen.three.Mesh(this._geo(opts), this._mat(opts));
    }
    _geo(_opts) {
        return new this.screen.three.PlaneGeometry(2, 2);
    }
    updateGeo() {
        this._mesh.geometry = this._geo(this);
        this._mesh.geometry.needsUpdate = true;
    }
    _mat(_opts) {
        return new this.screen.three.MeshBasicMaterial({
            transparent: true,
            side: this.screen.three.DoubleSide,
            depthWrite: true,
            depthTest: true
        });
    }
    remove() {
        this.screen.scene.remove(this._mesh);
    }
    static makeColor(source) {
        return source instanceof Color ? source : new Color(source ?? 0xFFFFFF);
    }
}
class Cloud extends Drawable {
    constructor(opts){
        super(opts);
    }
    get color() {
        return null;
    }
    set color(_value) {}
    buildAttr(source, count) {
        return new this.screen.three.GLBufferAttribute(source.vbo, this.screen.context.FLOAT, source.items, 4, count);
    }
    _geo(opts) {
        const geo = new this.screen.three.BufferGeometry();
        for (const key of Object.keys(opts.attrs)){
            const attr = opts.attrs[key];
            if (attr && 'object' == typeof attr) geo.setAttribute(key, this.buildAttr(attr, opts.count));
        }
        geo.boundingSphere = new this.screen.three.Sphere(new this.screen.three.Vector3(), 1 / 0);
        return geo;
    }
    _mat(opts) {
        const uniforms = {
            ...opts.uniforms,
            winh: {
                value: this.screen.height
            }
        };
        this.screen.on('resize', ({ height })=>{
            uniforms.winh.value = height;
        });
        return new this.screen.three.ShaderMaterial({
            blending: this.screen.three.NormalBlending,
            depthTest: true === opts.depthTest,
            transparent: true,
            uniforms,
            vertexShader: this.buildVert(opts),
            fragmentShader: this.buildFrag(opts)
        });
    }
    buildVert(opts) {
        return opts.vert || `
			attribute vec3  color;
			varying   vec3  varColor;
			
			${opts.inject?.vert?.vars ?? ''}
			
			void main() {
				
				${opts.inject?.vert?.before ?? ''}
				
				varColor        = color;
				vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
				gl_Position     = projectionMatrix * mvPosition;
				
				${opts.inject?.vert?.after ?? ''}
				
			}
		`;
    }
    buildFrag(opts) {
        return opts.frag || `
			varying vec3  varColor;
			
			${opts.inject?.frag?.vars ?? ''}
			
			void main() {
				
				${opts.inject?.frag?.before ?? ''}
				
				// gl_FragColor = vec4(varColor, 1.0);
				gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
				
				${opts.inject?.frag?.after ?? ''}
				
			}
		`;
    }
    _build(opts) {
        const points = new this.screen.three.Points(this._geo(opts), this._mat(opts));
        points.frustumCulled = false;
        points.boundingSphere = new this.screen.three.Sphere(new this.screen.three.Vector3(), 1 / 0);
        return points;
    }
}
class Points extends Cloud {
    buildVert(opts) {
        return opts.vert || `
			${'number' == typeof opts.attrs.size && opts.attrs.size > 0 ? 'attribute float size' : `float size = ${opts?.size || '10.0'}`};
			attribute vec3  color;
			varying   vec3  varColor;
			varying   vec2  varTcoord;
			varying   float varSize;
			
			uniform   float winh;
			
			${opts.inject && opts.inject.vert && opts.inject.vert.vars ? opts.inject.vert.vars : ''}
			
			void main() {
				
				${opts.inject && opts.inject.vert && opts.inject.vert.before ? opts.inject.vert.before : ''}
				
				varColor        = color;
				vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
				gl_Position     = projectionMatrix * mvPosition;
				varSize         = size;
				gl_PointSize    = max(2.0, 2.0 * winh * varSize / length( mvPosition.xyz ));
				varTcoord       = position.xy;
				
				${opts.inject && opts.inject.vert && opts.inject.vert.after ? opts.inject.vert.after : ''}
				
			}
		`;
    }
    buildFrag(opts) {
        return opts.frag || `
			varying vec3  varColor;
			varying vec2  varTcoord;
			varying float varSize;
			
			${opts.inject && opts.inject.frag && opts.inject.frag.vars ? opts.inject.frag.vars : ''}
			
			void main() {
				
				${opts.inject && opts.inject.frag && opts.inject.frag.before ? opts.inject.frag.before : ''}
				
				float offs = length(gl_PointCoord.xy - vec2(0.5, 0.5));
				float dist = clamp(1.0 - 2.0 * offs, 0.0, 1.0) * 0.2 * varSize;
				dist = pow(dist, 5.0);
				gl_FragColor = vec4(varColor, dist);
				
				${opts.inject && opts.inject.frag && opts.inject.frag.after ? opts.inject.frag.after : ''}
				
			}
		`;
    }
}
class Lines extends Cloud {
    buildFrag(opts) {
        return opts.frag || `
			varying vec3  varColor;
			varying vec2  varTcoord;
			varying float varSize;
			
			${opts.inject && opts.inject.frag && opts.inject.frag.vars ? opts.inject.frag.vars : ''}
			
			void main() {
				
				${opts.inject && opts.inject.frag && opts.inject.frag.before ? opts.inject.frag.before : ''}
				
				gl_FragColor = vec4(varColor, 1.0);
				
				${opts.inject && opts.inject.frag && opts.inject.frag.after ? opts.inject.frag.after : ''}
				
			}
		`;
    }
    _build(opts) {
        const Ctor = (()=>{
            switch(opts.mode){
                case 'segments':
                    return this.screen.three.LineSegments;
                case 'loop':
                    return this.screen.three.LineLoop;
                default:
                    return this.screen.three.Line;
            }
        })();
        const lines = new Ctor(this._geo(opts), this._mat(opts));
        lines.frustumCulled = false;
        lines.boundingSphere = new this.screen.three.Sphere(new this.screen.three.Vector3(), 1 / 0);
        return lines;
    }
}
class Tris extends Cloud {
    buildFrag(opts) {
        return opts.frag || `
			varying vec3  varColor;
			varying vec2  varTcoord;
			varying float varSize;
			
			${opts.inject && opts.inject.frag && opts.inject.frag.vars ? opts.inject.frag.vars : ''}
			
			void main() {
				
				${opts.inject && opts.inject.frag && opts.inject.frag.before ? opts.inject.frag.before : ''}
				
				gl_FragColor = vec4(varColor, 1.0);
				
				${opts.inject && opts.inject.frag && opts.inject.frag.after ? opts.inject.frag.after : ''}
				
			}
		`;
    }
    _build(opts) {
        const tris = new this.screen.three.Mesh(this._geo(opts), this._mat(opts));
        tris.frustumCulled = false;
        tris.boundingSphere = new this.screen.three.Sphere(new this.screen.three.Vector3(), 1 / 0);
        return tris;
    }
}
const DEFAULT_SIZE = 600;
class Rect extends Drawable {
    _size;
    _radius;
    constructor(opts){
        const vecSize = void 0 === opts.size ? new Vec2(DEFAULT_SIZE, DEFAULT_SIZE) : new Vec2(opts.size);
        const sizeOffs = vecSize.scale(-0.5);
        const rectOpts = {
            ...opts,
            pos: opts.pos ?? sizeOffs,
            size: vecSize,
            radius: opts.radius ?? 0
        };
        super(rectOpts);
        this._size = vecSize;
        this._radius = rectOpts.radius ?? 0;
    }
    _build(opts) {
        const geometry = this._geo(opts);
        const material = this._mat(opts);
        if (opts.wire) return new this.screen.three.Line(geometry, material);
        return new this.screen.three.Mesh(geometry, material);
    }
    _mat(opts) {
        const matOpts = {
            transparent: true,
            side: this.screen.three.DoubleSide,
            depthWrite: false,
            depthTest: false
        };
        if (opts.wire) return new this.screen.three.LineBasicMaterial({
            ...matOpts,
            linewidth: 1
        });
        return new this.screen.three.MeshBasicMaterial(matOpts);
    }
    get size() {
        return this._size.xy;
    }
    set size(value) {
        this._size.xy = value;
        this.updateGeo();
    }
    get width() {
        return this._size.x;
    }
    get height() {
        return this._size.y;
    }
    get w() {
        return this._size.x;
    }
    get h() {
        return this._size.y;
    }
    get radius() {
        return this._radius;
    }
    set radius(value) {
        this._radius = value;
        this.updateGeo();
    }
    get texture() {
        return this._mesh.material.map;
    }
    set texture(tex) {
        this._mesh.material.map = tex;
        this._mesh.material.needsUpdate = true;
    }
    _geo(opts) {
        const size = void 0 === opts.size ? new Vec2(100, 100) : new Vec2(opts.size);
        const radius = opts.radius || 0;
        const width = size.x;
        const height = size.y;
        const geometry = radius ? (()=>{
            const shape = new this.screen.three.Shape();
            shape.moveTo(0, radius);
            shape.lineTo(0, height - radius);
            shape.quadraticCurveTo(0, height, radius, height);
            shape.lineTo(width - radius, height);
            shape.quadraticCurveTo(width, height, width, height - radius);
            shape.lineTo(width, radius);
            shape.quadraticCurveTo(width, 0, width - radius, 0);
            shape.lineTo(radius, 0);
            shape.quadraticCurveTo(0, 0, 0, radius);
            const shapeGeometry = new this.screen.three.ShapeGeometry(shape);
            shapeGeometry.translate(0.5 * -width, 0.5 * -height, 0);
            return shapeGeometry;
        })() : new this.screen.three.PlaneGeometry(width, height);
        geometry.rotateX(Math.PI);
        geometry.translate(0.5 * width, 0.5 * height, 0);
        geometry.computeBoundingBox();
        return geometry;
    }
}
class Brush extends Drawable {
    _size;
    constructor(opts){
        super({
            screen: opts.screen,
            color: opts.color
        });
        this._size = opts.size || 100;
        this._pos = opts.pos ? new Vec2(opts.pos) : new Vec2();
        if (void 0 !== opts.visible && !opts.visible) this.visible = false;
        this.screen.on('resize', ()=>{
            const uniforms = this.shaderMaterial.uniforms;
            uniforms.aspect.value = this.screen.w / this.screen.h;
            uniforms.size.value = this._size / this.screen.h;
        });
    }
    get size() {
        return this._size;
    }
    set size(value) {
        this._size = value;
        if (this.visible) this.shaderMaterial.uniforms.size.value = this._size;
    }
    get pos() {
        return this._pos;
    }
    set pos(value) {
        this._pos.copy(value);
        if (this.visible) this.shaderMaterial.uniforms.pos.value = new this.screen.three.Vector2((this._pos.x / this.screen.w - 0.5) * 2, (-this._pos.y / this.screen.h + 0.5) * 2);
    }
    get visible() {
        return super.visible;
    }
    set visible(value) {
        super.visible = value;
        if (this.visible) {
            const uniforms = this.shaderMaterial.uniforms;
            uniforms.pos.value = new this.screen.three.Vector2(this._pos.x, this._pos.y);
            uniforms.size.value = this._size / this.screen.h;
            uniforms.color.value = new this.screen.three.Vector3(this._color.r, this._color.g, this._color.b);
        }
    }
    get color() {
        return this._color;
    }
    set color(value) {
        this._color = value;
        if (this.visible) this.shaderMaterial.uniforms.color.value = new this.screen.three.Vector3(this._color.r, this._color.g, this._color.b);
    }
    _geo() {
        const geo = new this.screen.three.PlaneGeometry(2, 2);
        geo.computeBoundingSphere = ()=>{
            geo.boundingSphere = new this.screen.three.Sphere(void 0, 1 / 0);
        };
        geo.computeBoundingSphere();
        geo.computeBoundingBox = ()=>{
            geo.boundingBox = new this.screen.three.Box3();
        };
        geo.computeBoundingBox();
        return geo;
    }
    _mat() {
        return new this.screen.three.ShaderMaterial({
            side: this.screen.three.DoubleSide,
            uniforms: {
                aspect: {
                    value: this.screen.w / this.screen.h
                },
                size: {
                    value: 100 / this.screen.h
                },
                pos: {
                    value: new this.screen.three.Vector2(0, 0)
                },
                color: {
                    value: new this.screen.three.Vector3(0, 1, 1)
                }
            },
            vertexShader: `
				varying vec3 projPos;
				
				void main() {
					projPos  = position.xyz;
					
					gl_Position = vec4(position.xyz, 1.0);
				}
			`,
            fragmentShader: `
				varying vec3 projPos;
				
				uniform vec2  pos;
				uniform float size;
				uniform vec3  color;
				uniform float aspect;
				
				void main() {
					vec2 diff = projPos.xy - pos;
					diff.x *= aspect;
					float dist = length(diff);
					
					float opacity = pow(1.0 - min(1.0, abs(dist - size)), 100.0);
					gl_FragColor = vec4(color, opacity);
				}
			`,
            blending: this.screen.three.AdditiveBlending,
            depthTest: false,
            transparent: true
        });
    }
    _build(opts) {
        return new this.screen.three.Mesh(this._geo(), this._mat());
    }
    get shaderMaterial() {
        return this._mesh.material;
    }
}
const surface_DEFAULT_SIZE = 600;
const surface_DEFAULT_FOV = 90;
const surface_DEFAULT_NEAR = 0.2;
const surface_DEFAULT_FAR = 400;
class Surface extends Rect {
    _events;
    _camera;
    _scene;
    _target;
    constructor(opts){
        const vecSize = void 0 === opts.size ? new Vec2(surface_DEFAULT_SIZE, surface_DEFAULT_SIZE) : new Vec2(opts.size);
        const sizeOffs = vecSize.scale(-0.5);
        const surfaceOpts = {
            ...opts,
            pos: opts.pos ?? sizeOffs,
            size: vecSize
        };
        super(surfaceOpts);
        this._events = new node_events();
        if (opts.camera) this._camera = opts.camera;
        else {
            this._camera = new this.screen.three.PerspectiveCamera(surface_DEFAULT_FOV, this.width / this.height, surface_DEFAULT_NEAR, surface_DEFAULT_FAR);
            this._camera.position.z = 10;
        }
        this._scene = opts.scene ?? new this.screen.three.Scene();
        this._target = this._newTarget();
        this.draw();
        this.mesh.material = new this.screen.three.ShaderMaterial({
            side: this.screen.three.DoubleSide,
            uniforms: {
                t: {
                    value: this._target.texture
                }
            },
            vertexShader: `
				varying vec2 tc;
				void main() {
					tc = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
				}
			`,
            fragmentShader: `
				varying vec2 tc;
				uniform sampler2D t;
				void main() {
					gl_FragColor = texture2D(t, tc);
				}
			`,
            depthWrite: true,
            depthTest: true,
            transparent: true
        });
        this.mesh.onBeforeRender = ()=>{
            setTimeout(()=>this.draw(), 0);
        };
        this.mesh.geometry.computeBoundingSphere = ()=>{
            this.mesh.geometry.boundingSphere = new this.screen.three.Sphere(void 0, 1 / 0);
        };
        this.mesh.geometry.computeBoundingSphere();
        this.mesh.geometry.computeBoundingBox = ()=>{
            this.mesh.geometry.boundingBox = new this.screen.three.Box3();
        };
        this.mesh.geometry.computeBoundingBox();
        this.mesh.material.needsUpdate = true;
    }
    on(event, cb) {
        if ('resize' === event) return void this._events.on(event, cb);
        this.screen.on(event, cb);
    }
    get canvas() {
        return this.screen.canvas;
    }
    get camera() {
        return this._camera;
    }
    get scene() {
        return this._scene;
    }
    get renderer() {
        return this.screen.renderer;
    }
    get context() {
        return this.screen.context;
    }
    get document() {
        return this.screen.document;
    }
    get title() {
        return this.screen.title;
    }
    set title(value) {
        this.screen.title = value;
    }
    get fov() {
        return this.screen.fov;
    }
    set fov(value) {
        this.screen.fov = value;
    }
    get size() {
        return super.size;
    }
    set size(value) {
        super.size = value;
        this.reset();
        this._events.emit('resize', {
            w: this.width,
            h: this.height
        });
    }
    get texture() {
        return this._target.texture;
    }
    reset() {
        this._target = this._newTarget();
        this.draw();
        this.shaderMaterial.uniforms.t.value = this._target.texture;
        this._events.emit('reset', this._target.texture);
    }
    draw() {
        const rt = this.renderer.getRenderTarget();
        this.renderer.setRenderTarget(this._target);
        this.screen.renderer.render(this._scene, this._camera);
        this.renderer.setRenderTarget(rt);
    }
    _newTarget() {
        return new this.screen.three.WebGLRenderTarget(2 * this.w, 2 * this.h, {
            minFilter: this.screen.three.LinearFilter,
            magFilter: this.screen.three.NearestFilter,
            format: this.screen.three.RGBAFormat
        });
    }
    get shaderMaterial() {
        return this.mesh.material;
    }
}
const ts_glfw = {
    ...glfw,
    Document: glfw_Document,
    Window: Window
};
const ts_gl = webgl;
const initCore = (_opts = {})=>{
    const opts = {
        mode: 'windowed',
        vsync: true,
        ..._opts
    };
    const { isWebGL2, isGles3, isVisible, ...optsDoc } = opts;
    const { Document } = ts_glfw;
    Document.setWebgl(ts_gl);
    Document.setImage(image_Image);
    const imagePrototype = image_Image.prototype;
    if (!imagePrototype.fillRect) imagePrototype.fillRect = ()=>{};
    if (isWebGL2) ts_gl.useWebGL2();
    const onBeforeWindow = (window, glfwRaw)=>{
        const currentGlfw = glfwRaw;
        if (isGles3) {
            currentGlfw.windowHint(currentGlfw.OPENGL_PROFILE, currentGlfw.OPENGL_ANY_PROFILE);
            currentGlfw.windowHint(currentGlfw.CONTEXT_VERSION_MAJOR, 3);
            currentGlfw.windowHint(currentGlfw.CONTEXT_VERSION_MINOR, 2);
            currentGlfw.windowHint(currentGlfw.CLIENT_API, currentGlfw.OPENGL_ES_API);
        }
        if (false === isVisible) currentGlfw.windowHint(currentGlfw.VISIBLE, currentGlfw.FALSE);
        if (optsDoc.onBeforeWindow) optsDoc.onBeforeWindow(window, currentGlfw);
    };
    if (!isGles3) {
        const mutableWebgl = ts_gl;
        const shaderSource = mutableWebgl.shaderSource;
        mutableWebgl.shaderSource = (shader, code)=>shaderSource(shader, code.replaceAll(/^\s*?(#version|precision).*?($|;)/gmu, '').replace(/^/u, '#extension GL_ARB_shading_language_420pack : require\n').replace(/^/u, '#extension GL_ARB_explicit_attrib_location : enable\n').replace(/^/u, '#version 140\n').replaceAll('gl_FragDepthEXT', 'gl_FragDepth').replace('#extension GL_EXT_frag_depth : enable', '').replaceAll(/\bhighp\s+/gu, ''));
    }
    const doc = new Document({
        ...optsDoc,
        onBeforeWindow
    });
    const nodeGlobal = globalThis;
    if (!nodeGlobal.self) nodeGlobal.self = nodeGlobal;
    if (!nodeGlobal.globalThis) nodeGlobal.globalThis = nodeGlobal;
    nodeGlobal.document = doc;
    nodeGlobal.window = doc;
    nodeGlobal.body = doc;
    nodeGlobal.cwrap = null;
    nodeGlobal.addEventListener = doc.addEventListener.bind(doc);
    nodeGlobal.removeEventListener = doc.removeEventListener.bind(doc);
    nodeGlobal.requestAnimationFrame = doc.requestAnimationFrame;
    nodeGlobal.cancelAnimationFrame = doc.cancelAnimationFrame;
    if (!nodeGlobal.location) nodeGlobal.location = location_location;
    doc.location = nodeGlobal.location;
    if (!nodeGlobal.navigator) nodeGlobal.navigator = navigator_navigator;
    nodeGlobal.WebVRManager = WebVRManager;
    nodeGlobal.Image = image_Image;
    nodeGlobal._gl = ts_gl;
    ts_gl.canvas = doc;
    const core3d = {
        doc,
        loop: doc.loop,
        raf: doc.requestAnimationFrame
    };
    return core3d;
};
let inited = null;
const init = (opts = {})=>{
    if (inited) return inited;
    inited = initCore(opts);
    return inited;
};
export { Brush, Cloud, Color, Drawable, Lines, Points, Rect, Screen, Surface, Tris, Vec2, Vec3, Vec4, Window, addThreeHelpers, glfw_Document as Document, image_Image as Image, init, ts_gl as gl, ts_glfw as glfw };
