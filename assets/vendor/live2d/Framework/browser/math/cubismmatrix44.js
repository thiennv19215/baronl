/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
import { CubismMath } from './cubismmath.js';
/**
 * 4x4ã®è¡Œåˆ—
 *
 * 4x4è¡Œåˆ—ã®ä¾¿åˆ©ã‚¯ãƒ©ã‚¹ã€‚
 */
export class CubismMatrix44 {
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    constructor() {
        this._tr = new Float32Array(16); // 4 * 4ã®ã‚µã‚¤ã‚º
        this.loadIdentity();
    }
    /**
     * å—ã‘å–ã£ãŸï¼’ã¤ã®è¡Œåˆ—ã®ä¹—ç®—ã‚’è¡Œã†ã€‚
     *
     * @param a è¡Œåˆ—a
     * @param b è¡Œåˆ—b
     *
     * @return ä¹—ç®—çµæžœã®è¡Œåˆ—
     */
    static multiply(a, b, dst) {
        const c = new Float32Array([
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0
        ]);
        const n = 4;
        for (let i = 0; i < n; ++i) {
            for (let j = 0; j < n; ++j) {
                for (let k = 0; k < n; ++k) {
                    c[j + i * 4] += a[k + i * 4] * b[j + k * 4];
                }
            }
        }
        for (let i = 0; i < 16; ++i) {
            dst[i] = c[i];
        }
    }
    /**
     * å˜ä½è¡Œåˆ—ã«åˆæœŸåŒ–ã™ã‚‹
     */
    loadIdentity() {
        const c = new Float32Array([
            1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0,
            1.0
        ]);
        this.setMatrix(c);
    }
    /**
     * è¡Œåˆ—ã‚’è¨­å®š
     *
     * @param tr 16å€‹ã®æµ®å‹•å°æ•°ç‚¹æ•°ã§è¡¨ã•ã‚Œã‚‹4x4ã®è¡Œåˆ—
     */
    setMatrix(tr) {
        for (let i = 0; i < 16; ++i) {
            this._tr[i] = tr[i];
        }
    }
    /**
     * è¡Œåˆ—ã‚’æµ®å‹•å°æ•°ç‚¹æ•°ã®é…åˆ—ã§å–å¾—
     *
     * @return 16å€‹ã®æµ®å‹•å°æ•°ç‚¹æ•°ã§è¡¨ã•ã‚Œã‚‹4x4ã®è¡Œåˆ—
     */
    getArray() {
        return this._tr;
    }
    /**
     * Xè»¸ã®æ‹¡å¤§çŽ‡ã‚’å–å¾—
     *
     * @return Xè»¸ã®æ‹¡å¤§çŽ‡
     */
    getScaleX() {
        return this._tr[0];
    }
    /**
     * Yè»¸ã®æ‹¡å¤§çŽ‡ã‚’å–å¾—ã™ã‚‹
     *
     * @return Yè»¸ã®æ‹¡å¤§çŽ‡
     */
    getScaleY() {
        return this._tr[5];
    }
    /**
     * Xè»¸ã®ç§»å‹•é‡ã‚’å–å¾—
     *
     * @return Xè»¸ã®ç§»å‹•é‡
     */
    getTranslateX() {
        return this._tr[12];
    }
    /**
     * Yè»¸ã®ç§»å‹•é‡ã‚’å–å¾—
     *
     * @return Yè»¸ã®ç§»å‹•é‡
     */
    getTranslateY() {
        return this._tr[13];
    }
    /**
     * Xè»¸ã®å€¤ã‚’ç¾åœ¨ã®è¡Œåˆ—ã§è¨ˆç®—
     *
     * @param src Xè»¸ã®å€¤
     *
     * @return ç¾åœ¨ã®è¡Œåˆ—ã§è¨ˆç®—ã•ã‚ŒãŸXè»¸ã®å€¤
     */
    transformX(src) {
        return this._tr[0] * src + this._tr[12];
    }
    /**
     * Yè»¸ã®å€¤ã‚’ç¾åœ¨ã®è¡Œåˆ—ã§è¨ˆç®—
     *
     * @param src Yè»¸ã®å€¤
     *
     * @return ç¾åœ¨ã®è¡Œåˆ—ã§è¨ˆç®—ã•ã‚ŒãŸYè»¸ã®å€¤
     */
    transformY(src) {
        return this._tr[5] * src + this._tr[13];
    }
    /**
     * Xè»¸ã®å€¤ã‚’ç¾åœ¨ã®è¡Œåˆ—ã§é€†è¨ˆç®—
     */
    invertTransformX(src) {
        return (src - this._tr[12]) / this._tr[0];
    }
    /**
     * Yè»¸ã®å€¤ã‚’ç¾åœ¨ã®è¡Œåˆ—ã§é€†è¨ˆç®—
     */
    invertTransformY(src) {
        return (src - this._tr[13]) / this._tr[5];
    }
    /**
     * ç¾åœ¨ã®è¡Œåˆ—ã®ä½ç½®ã‚’èµ·ç‚¹ã«ã—ã¦ç§»å‹•
     *
     * ç¾åœ¨ã®è¡Œåˆ—ã®ä½ç½®ã‚’èµ·ç‚¹ã«ã—ã¦ç›¸å¯¾çš„ã«ç§»å‹•ã™ã‚‹ã€‚
     *
     * @param x Xè»¸ã®ç§»å‹•é‡
     * @param y Yè»¸ã®ç§»å‹•é‡
     */
    translateRelative(x, y) {
        const tr1 = new Float32Array([
            1.0,
            0.0,
            0.0,
            0.0,
            0.0,
            1.0,
            0.0,
            0.0,
            0.0,
            0.0,
            1.0,
            0.0,
            x,
            y,
            0.0,
            1.0
        ]);
        CubismMatrix44.multiply(tr1, this._tr, this._tr);
    }
    /**
     * ç¾åœ¨ã®è¡Œåˆ—ã®ä½ç½®ã‚’ç§»å‹•
     *
     * ç¾åœ¨ã®è¡Œåˆ—ã®ä½ç½®ã‚’æŒ‡å®šã—ãŸä½ç½®ã¸ç§»å‹•ã™ã‚‹
     *
     * @param x Xè»¸ã®ç§»å‹•é‡
     * @param y yè»¸ã®ç§»å‹•é‡
     */
    translate(x, y) {
        this._tr[12] = x;
        this._tr[13] = y;
    }
    /**
     * ç¾åœ¨ã®è¡Œåˆ—ã®Xè»¸ã®ä½ç½®ã‚’æŒ‡å®šã—ãŸä½ç½®ã¸ç§»å‹•ã™ã‚‹
     *
     * @param x Xè»¸ã®ç§»å‹•é‡
     */
    translateX(x) {
        this._tr[12] = x;
    }
    /**
     * ç¾åœ¨ã®è¡Œåˆ—ã®Yè»¸ã®ä½ç½®ã‚’æŒ‡å®šã—ãŸä½ç½®ã¸ç§»å‹•ã™ã‚‹
     *
     * @param y Yè»¸ã®ç§»å‹•é‡
     */
    translateY(y) {
        this._tr[13] = y;
    }
    /**
     * ç¾åœ¨ã®è¡Œåˆ—ã®æ‹¡å¤§çŽ‡ã‚’ç›¸å¯¾çš„ã«è¨­å®šã™ã‚‹
     *
     * @param x Xè»¸ã®æ‹¡å¤§çŽ‡
     * @param y Yè»¸ã®æ‹¡å¤§çŽ‡
     */
    scaleRelative(x, y) {
        const tr1 = new Float32Array([
            x,
            0.0,
            0.0,
            0.0,
            0.0,
            y,
            0.0,
            0.0,
            0.0,
            0.0,
            1.0,
            0.0,
            0.0,
            0.0,
            0.0,
            1.0
        ]);
        CubismMatrix44.multiply(tr1, this._tr, this._tr);
    }
    /**
     * ç¾åœ¨ã®è¡Œåˆ—ã®æ‹¡å¤§çŽ‡ã‚’æŒ‡å®šã—ãŸå€çŽ‡ã«è¨­å®šã™ã‚‹
     *
     * @param x Xè»¸ã®æ‹¡å¤§çŽ‡
     * @param y Yè»¸ã®æ‹¡å¤§çŽ‡
     */
    scale(x, y) {
        this._tr[0] = x;
        this._tr[5] = y;
    }
    /**
     * å¼•æ•°ã§ä¸Žãˆã‚‰ã‚ŒãŸè¡Œåˆ—ã«ã“ã®è¡Œåˆ—ã‚’ä¹—ç®—ã™ã‚‹ã€‚
     * (å¼•æ•°ã§ä¸Žãˆã‚‰ã‚ŒãŸè¡Œåˆ—) * (ã“ã®è¡Œåˆ—)
     *
     * @note é–¢æ•°åã¨å®Ÿéš›ã®è¨ˆç®—å†…å®¹ã«ä¹–é›¢ãŒã‚ã‚‹ãŸã‚ã€ä»Šå¾Œè¨ˆç®—é †ãŒä¿®æ­£ã•ã‚Œã‚‹å¯èƒ½æ€§ãŒã‚ã‚Šã¾ã™ã€‚
     * @param m è¡Œåˆ—
     */
    multiplyByMatrix(m) {
        CubismMatrix44.multiply(m.getArray(), this._tr, this._tr);
    }
    /**
     * ç¾åœ¨ã®è¡Œåˆ—ã®é€†è¡Œåˆ—ã‚’æ±‚ã‚ã‚‹ã€‚
     *
     * @return ç¾åœ¨ã®è¡Œåˆ—ã§è¨ˆç®—ã•ã‚ŒãŸé€†è¡Œåˆ—ã®å€¤ã‚’è¿”ã™
     */
    getInvert() {
        const r00 = this._tr[0];
        const r10 = this._tr[1];
        const r20 = this._tr[2];
        const r01 = this._tr[4];
        const r11 = this._tr[5];
        const r21 = this._tr[6];
        const r02 = this._tr[8];
        const r12 = this._tr[9];
        const r22 = this._tr[10];
        const tx = this._tr[12];
        const ty = this._tr[13];
        const tz = this._tr[14];
        const det = r00 * (r11 * r22 - r12 * r21) -
            r01 * (r10 * r22 - r12 * r20) +
            r02 * (r10 * r21 - r11 * r20);
        const dst = new CubismMatrix44();
        if (CubismMath.abs(det) < CubismMath.Epsilon) {
            dst.loadIdentity();
            return dst;
        }
        const invDet = 1.0 / det;
        const inv00 = (r11 * r22 - r12 * r21) * invDet;
        const inv01 = -(r01 * r22 - r02 * r21) * invDet;
        const inv02 = (r01 * r12 - r02 * r11) * invDet;
        const inv10 = -(r10 * r22 - r12 * r20) * invDet;
        const inv11 = (r00 * r22 - r02 * r20) * invDet;
        const inv12 = -(r00 * r12 - r02 * r10) * invDet;
        const inv20 = (r10 * r21 - r11 * r20) * invDet;
        const inv21 = -(r00 * r21 - r01 * r20) * invDet;
        const inv22 = (r00 * r11 - r01 * r10) * invDet;
        dst._tr[0] = inv00;
        dst._tr[1] = inv10;
        dst._tr[2] = inv20;
        dst._tr[3] = 0.0;
        dst._tr[4] = inv01;
        dst._tr[5] = inv11;
        dst._tr[6] = inv21;
        dst._tr[7] = 0.0;
        dst._tr[8] = inv02;
        dst._tr[9] = inv12;
        dst._tr[10] = inv22;
        dst._tr[11] = 0.0;
        dst._tr[12] = -(inv00 * tx + inv01 * ty + inv02 * tz);
        dst._tr[13] = -(inv10 * tx + inv11 * ty + inv12 * tz);
        dst._tr[14] = -(inv20 * tx + inv21 * ty + inv22 * tz);
        dst._tr[15] = 1.0;
        return dst;
    }
    /**
     * ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã®ã‚³ãƒ”ãƒ¼ã‚’ç”Ÿæˆã™ã‚‹
     */
    clone() {
        const cloneMatrix = new CubismMatrix44();
        for (let i = 0; i < this._tr.length; i++) {
            cloneMatrix._tr[i] = this._tr[i];
        }
        return cloneMatrix;
    }
}
// Namespace definition for compatibility.
import * as $ from './cubismmatrix44.js';
// eslint-disable-next-line @typescript-eslint/no-namespace
export var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    Live2DCubismFramework.CubismMatrix44 = $.CubismMatrix44;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));
//# sourceMappingURL=cubismmatrix44.js.map