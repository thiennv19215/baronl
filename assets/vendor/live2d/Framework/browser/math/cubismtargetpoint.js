/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
import { CubismMath } from './cubismmath.js';
const FrameRate = 30;
const Epsilon = 0.01;
/**
 * é¡”ã®å‘ãã®åˆ¶å¾¡æ©Ÿèƒ½
 *
 * é¡”ã®å‘ãã®åˆ¶å¾¡æ©Ÿèƒ½ã‚’æä¾›ã™ã‚‹ã‚¯ãƒ©ã‚¹ã€‚
 */
export class CubismTargetPoint {
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    constructor() {
        this._faceTargetX = 0.0;
        this._faceTargetY = 0.0;
        this._faceX = 0.0;
        this._faceY = 0.0;
        this._faceVX = 0.0;
        this._faceVY = 0.0;
        this._lastTimeSeconds = 0.0;
        this._userTimeSeconds = 0.0;
    }
    /**
     * æ›´æ–°å‡¦ç†
     */
    update(deltaTimeSeconds) {
        // ãƒ‡ãƒ«ã‚¿æ™‚é–“ã‚’åŠ ç®—ã™ã‚‹
        this._userTimeSeconds += deltaTimeSeconds;
        // é¦–ã‚’ä¸­å¤®ã‹ã‚‰å·¦å³ã«æŒ¯ã‚‹ã¨ãã®å¹³å‡çš„ãªé€Ÿã•ã¯ ç§’é€Ÿåº¦ã€‚åŠ é€Ÿãƒ»æ¸›é€Ÿã‚’è€ƒæ…®ã—ã¦ã€ãã®ï¼’å€ã‚’æœ€é«˜é€Ÿåº¦ã¨ã™ã‚‹
        // é¡”ã®æŒ¯ã‚Šå…·åˆã‚’ã€ä¸­å¤®ï¼ˆ0.0ï¼‰ã‹ã‚‰ã€å·¦å³ã¯ï¼ˆ+-1.0ï¼‰ã¨ã™ã‚‹
        const faceParamMaxV = 40.0 / 10.0; // 7.5ç§’é–“ã«40åˆ†ç§»å‹•(5.3/sc)
        const maxV = (faceParamMaxV * 1.0) / FrameRate; // 1frameã‚ãŸã‚Šã«å¤‰åŒ–ã§ãã‚‹é€Ÿåº¦ã®ä¸Šé™
        if (this._lastTimeSeconds == 0.0) {
            this._lastTimeSeconds = this._userTimeSeconds;
            return;
        }
        const deltaTimeWeight = (this._userTimeSeconds - this._lastTimeSeconds) * FrameRate;
        this._lastTimeSeconds = this._userTimeSeconds;
        // æœ€é«˜é€Ÿåº¦ã«ãªã‚‹ã¾ã§ã®æ™‚é–“ã‚’
        const timeToMaxSpeed = 0.15;
        const frameToMaxSpeed = timeToMaxSpeed * FrameRate; // sec * frame/sec
        const maxA = (deltaTimeWeight * maxV) / frameToMaxSpeed; // 1frameã‚ãŸã‚Šã®åŠ é€Ÿåº¦
        // ç›®æŒ‡ã™å‘ãã¯ã€ï¼ˆdx, dyï¼‰æ–¹å‘ã®ãƒ™ã‚¯ãƒˆãƒ«ã¨ãªã‚‹
        const dx = this._faceTargetX - this._faceX;
        const dy = this._faceTargetY - this._faceY;
        if (CubismMath.abs(dx) <= Epsilon && CubismMath.abs(dy) <= Epsilon) {
            return; // å¤‰åŒ–ãªã—
        }
        // é€Ÿåº¦ã®æœ€å¤§ã‚ˆã‚Šã‚‚å¤§ãã„å ´åˆã¯ã€é€Ÿåº¦ã‚’è½ã¨ã™
        const d = CubismMath.sqrt(dx * dx + dy * dy);
        // é€²è¡Œæ–¹å‘ã®æœ€å¤§é€Ÿåº¦ãƒ™ã‚¯ãƒˆãƒ«
        const vx = (maxV * dx) / d;
        const vy = (maxV * dy) / d;
        // ç¾åœ¨ã®é€Ÿåº¦ã‹ã‚‰ã€æ–°è¦é€Ÿåº¦ã¸ã®å¤‰åŒ–ï¼ˆåŠ é€Ÿåº¦ï¼‰ã‚’æ±‚ã‚ã‚‹
        let ax = vx - this._faceVX;
        let ay = vy - this._faceVY;
        const a = CubismMath.sqrt(ax * ax + ay * ay);
        // åŠ é€Ÿã®ã¨ã
        if (a < -maxA || a > maxA) {
            ax *= maxA / a;
            ay *= maxA / a;
        }
        // åŠ é€Ÿåº¦ã‚’å…ƒã®é€Ÿåº¦ã«è¶³ã—ã¦ã€æ–°é€Ÿåº¦ã¨ã™ã‚‹
        this._faceVX += ax;
        this._faceVY += ay;
        // ç›®çš„ã®æ–¹å‘ã«è¿‘ã¥ã„ãŸã¨ãã€æ»‘ã‚‰ã‹ã«æ¸›é€Ÿã™ã‚‹ãŸã‚ã®å‡¦ç†
        // è¨­å®šã•ã‚ŒãŸåŠ é€Ÿåº¦ã§æ­¢ã¾ã‚‹äº‹ã®å‡ºæ¥ã‚‹è·é›¢ã¨é€Ÿåº¦ã®é–¢ä¿‚ã‹ã‚‰
        // ç¾åœ¨ã¨ã‚Šã†ã‚‹æœ€é«˜é€Ÿåº¦ã‚’è¨ˆç®—ã—ã€ãã‚Œä»¥ä¸Šã®æ™‚ã¯é€Ÿåº¦ã‚’è½ã¨ã™
        // â€»æœ¬æ¥ã€äººé–“ã¯ç­‹åŠ›ã§åŠ›ï¼ˆåŠ é€Ÿåº¦ï¼‰ã‚’èª¿æ•´ã§ãã‚‹ãŸã‚ã€ã‚ˆã‚Šè‡ªç”±åº¦ãŒé«˜ã„ãŒã€ç°¡å˜ãªå‡¦ç†ã§æ¸ˆã¾ã›ã¦ã„ã‚‹
        {
            // åŠ é€Ÿåº¦ã€é€Ÿåº¦ã€è·é›¢ã®é–¢ä¿‚å¼ã€‚
            //            2  6           2               3
            //      sqrt(a  t  + 16 a h t  - 8 a h) - a t
            // v = --------------------------------------
            //                    2
            //                 4 t  - 2
            // (t=1)
            // 	æ™‚åˆ»tã¯ã€ã‚ã‚‰ã‹ã˜ã‚åŠ é€Ÿåº¦ã€é€Ÿåº¦ã‚’1/60(ãƒ•ãƒ¬ãƒ¼ãƒ ãƒ¬ãƒ¼ãƒˆã€å˜ä½ãªã—)ã§
            // 	è€ƒãˆã¦ã„ã‚‹ã®ã§ã€tï¼ï¼‘ã¨ã—ã¦æ¶ˆã—ã¦ã‚ˆã„ï¼ˆâ€»æœªæ¤œè¨¼ï¼‰
            const maxV = 0.5 *
                (CubismMath.sqrt(maxA * maxA + 16.0 * maxA * d - 8.0 * maxA * d) -
                    maxA);
            const curV = CubismMath.sqrt(this._faceVX * this._faceVX + this._faceVY * this._faceVY);
            if (curV > maxV) {
                // ç¾åœ¨ã®é€Ÿåº¦ > æœ€é«˜é€Ÿåº¦ã®ã¨ãã€æœ€é«˜é€Ÿåº¦ã¾ã§æ¸›é€Ÿ
                this._faceVX *= maxV / curV;
                this._faceVY *= maxV / curV;
            }
        }
        this._faceX += this._faceVX;
        this._faceY += this._faceVY;
    }
    /**
     * Xè»¸ã®é¡”ã®å‘ãã®å€¤ã‚’å–å¾—
     *
     * @return Xè»¸ã®é¡”ã®å‘ãã®å€¤ï¼ˆ-1.0 ~ 1.0ï¼‰
     */
    getX() {
        return this._faceX;
    }
    /**
     * Yè»¸ã®é¡”ã®å‘ãã®å€¤ã‚’å–å¾—
     *
     * @return Yè»¸ã®é¡”ã®å‘ãã®å€¤ï¼ˆ-1.0 ~ 1.0ï¼‰
     */
    getY() {
        return this._faceY;
    }
    /**
     * é¡”ã®å‘ãã®ç›®æ¨™å€¤ã‚’è¨­å®š
     *
     * @param x Xè»¸ã®é¡”ã®å‘ãã®å€¤ï¼ˆ-1.0 ~ 1.0ï¼‰
     * @param y Yè»¸ã®é¡”ã®å‘ãã®å€¤ï¼ˆ-1.0 ~ 1.0ï¼‰
     */
    set(x, y) {
        this._faceTargetX = x;
        this._faceTargetY = y;
    }
}
// Namespace definition for compatibility.
import * as $ from './cubismtargetpoint.js';
// eslint-disable-next-line @typescript-eslint/no-namespace
export var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    Live2DCubismFramework.CubismTargetPoint = $.CubismTargetPoint;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));
//# sourceMappingURL=cubismtargetpoint.js.map