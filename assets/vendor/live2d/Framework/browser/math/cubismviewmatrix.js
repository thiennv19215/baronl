/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
import { CubismMatrix44 } from './cubismmatrix44.js';
/**
 * ã‚«ãƒ¡ãƒ©ã®ä½ç½®å¤‰æ›´ã«ä½¿ã†ã¨ä¾¿åˆ©ãª4x4è¡Œåˆ—
 *
 * ã‚«ãƒ¡ãƒ©ã®ä½ç½®å¤‰æ›´ã«ä½¿ã†ã¨ä¾¿åˆ©ãª4x4è¡Œåˆ—ã®ã‚¯ãƒ©ã‚¹ã€‚
 */
export class CubismViewMatrix extends CubismMatrix44 {
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    constructor() {
        super();
        this._screenLeft = 0.0;
        this._screenRight = 0.0;
        this._screenTop = 0.0;
        this._screenBottom = 0.0;
        this._maxLeft = 0.0;
        this._maxRight = 0.0;
        this._maxTop = 0.0;
        this._maxBottom = 0.0;
        this._maxScale = 0.0;
        this._minScale = 0.0;
    }
    /**
     * ç§»å‹•ã‚’èª¿æ•´
     *
     * @param x Xè»¸ã®ç§»å‹•é‡
     * @param y Yè»¸ã®ç§»å‹•é‡
     */
    adjustTranslate(x, y) {
        if (this._tr[0] * this._maxLeft + (this._tr[12] + x) > this._screenLeft) {
            x = this._screenLeft - this._tr[0] * this._maxLeft - this._tr[12];
        }
        if (this._tr[0] * this._maxRight + (this._tr[12] + x) < this._screenRight) {
            x = this._screenRight - this._tr[0] * this._maxRight - this._tr[12];
        }
        if (this._tr[5] * this._maxTop + (this._tr[13] + y) < this._screenTop) {
            y = this._screenTop - this._tr[5] * this._maxTop - this._tr[13];
        }
        if (this._tr[5] * this._maxBottom + (this._tr[13] + y) >
            this._screenBottom) {
            y = this._screenBottom - this._tr[5] * this._maxBottom - this._tr[13];
        }
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
     * æ‹¡å¤§çŽ‡ã‚’èª¿æ•´
     *
     * @param cx æ‹¡å¤§ã‚’è¡Œã†Xè»¸ã®ä¸­å¿ƒä½ç½®
     * @param cy æ‹¡å¤§ã‚’è¡Œã†Yè»¸ã®ä¸­å¿ƒä½ç½®
     * @param scale æ‹¡å¤§çŽ‡
     */
    adjustScale(cx, cy, scale) {
        const maxScale = this.getMaxScale();
        const minScale = this.getMinScale();
        const targetScale = scale * this._tr[0];
        if (targetScale < minScale) {
            if (this._tr[0] > 0.0) {
                scale = minScale / this._tr[0];
            }
        }
        else if (targetScale > maxScale) {
            if (this._tr[0] > 0.0) {
                scale = maxScale / this._tr[0];
            }
        }
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
            cx,
            cy,
            0.0,
            1.0
        ]);
        const tr2 = new Float32Array([
            scale,
            0.0,
            0.0,
            0.0,
            0.0,
            scale,
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
        const tr3 = new Float32Array([
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
            -cx,
            -cy,
            0.0,
            1.0
        ]);
        CubismMatrix44.multiply(tr3, this._tr, this._tr);
        CubismMatrix44.multiply(tr2, this._tr, this._tr);
        CubismMatrix44.multiply(tr1, this._tr, this._tr);
    }
    /**
     * ãƒ‡ãƒã‚¤ã‚¹ã«å¯¾å¿œã™ã‚‹è«–ç†åº§é¤Šç”Ÿã®ç¯„å›²ã®è¨­å®š
     *
     * @param left      å·¦è¾ºã®Xè»¸ã®ä½ç½®
     * @param right     å³è¾ºã®Xè»¸ã®ä½ç½®
     * @param bottom    ä¸‹è¾ºã®Yè»¸ã®ä½ç½®
     * @param top       ä¸Šè¾ºã®Yè»¸ã®ä½ç½®
     */
    setScreenRect(left, right, bottom, top) {
        this._screenLeft = left;
        this._screenRight = right;
        this._screenBottom = bottom;
        this._screenTop = top;
    }
    /**
     * ãƒ‡ãƒã‚¤ã‚¹ã«å¯¾å¿œã™ã‚‹è«–ç†åº§æ¨™ä¸Šã®ç§»å‹•å¯èƒ½ç¯„å›²ã®è¨­å®š
     * @param left      å·¦è¾ºã®Xè»¸ã®ä½ç½®
     * @param right     å³è¾ºã®Xè»¸ã®ä½ç½®
     * @param bottom    ä¸‹è¾ºã®Yè»¸ã®ä½ç½®
     * @param top       ä¸Šè¾ºã®Yè»¸ã®ä½ç½®
     */
    setMaxScreenRect(left, right, bottom, top) {
        this._maxLeft = left;
        this._maxRight = right;
        this._maxTop = top;
        this._maxBottom = bottom;
    }
    /**
     * æœ€å¤§æ‹¡å¤§çŽ‡ã®è¨­å®š
     * @param maxScale æœ€å¤§æ‹¡å¤§çŽ‡
     */
    setMaxScale(maxScale) {
        this._maxScale = maxScale;
    }
    /**
     * æœ€å°æ‹¡å¤§çŽ‡ã®è¨­å®š
     * @param minScale æœ€å°æ‹¡å¤§çŽ‡
     */
    setMinScale(minScale) {
        this._minScale = minScale;
    }
    /**
     * æœ€å¤§æ‹¡å¤§çŽ‡ã®å–å¾—
     * @return æœ€å¤§æ‹¡å¤§çŽ‡
     */
    getMaxScale() {
        return this._maxScale;
    }
    /**
     * æœ€å°æ‹¡å¤§çŽ‡ã®å–å¾—
     * @return æœ€å°æ‹¡å¤§çŽ‡
     */
    getMinScale() {
        return this._minScale;
    }
    /**
     * æ‹¡å¤§çŽ‡ãŒæœ€å¤§ã«ãªã£ã¦ã„ã‚‹ã‹ã‚’ç¢ºèªã™ã‚‹
     *
     * @return true æ‹¡å¤§çŽ‡ã¯æœ€å¤§
     * @return false æ‹¡å¤§çŽ‡ã¯æœ€å¤§ã§ã¯ãªã„
     */
    isMaxScale() {
        return this.getScaleX() >= this._maxScale;
    }
    /**
     * æ‹¡å¤§çŽ‡ãŒæœ€å°ã«ãªã£ã¦ã„ã‚‹ã‹ã‚’ç¢ºèªã™ã‚‹
     *
     * @return true æ‹¡å¤§çŽ‡ã¯æœ€å°
     * @return false æ‹¡å¤§çŽ‡ã¯æœ€å°ã§ã¯ãªã„
     */
    isMinScale() {
        return this.getScaleX() <= this._minScale;
    }
    /**
     * ãƒ‡ãƒã‚¤ã‚¹ã«å¯¾å¿œã™ã‚‹è«–ç†åº§æ¨™ã®å·¦è¾ºã®ï¼¸è»¸ä½ç½®ã‚’å–å¾—ã™ã‚‹
     * @return ãƒ‡ãƒã‚¤ã‚¹ã«å¯¾å¿œã™ã‚‹è«–ç†åº§æ¨™ã®å·¦è¾ºã®Xè»¸ä½ç½®
     */
    getScreenLeft() {
        return this._screenLeft;
    }
    /**
     * ãƒ‡ãƒã‚¤ã‚¹ã«å¯¾å¿œã™ã‚‹è«–ç†åº§æ¨™ã®å³è¾ºã®ï¼¸è»¸ä½ç½®ã‚’å–å¾—ã™ã‚‹
     * @return ãƒ‡ãƒã‚¤ã‚¹ã«å¯¾å¿œã™ã‚‹è«–ç†åº§æ¨™ã®å³è¾ºã®Xè»¸ä½ç½®
     */
    getScreenRight() {
        return this._screenRight;
    }
    /**
     * ãƒ‡ãƒã‚¤ã‚¹ã«å¯¾å¿œã™ã‚‹è«–ç†åº§æ¨™ã®ä¸‹è¾ºã®Yè»¸ä½ç½®ã‚’å–å¾—ã™ã‚‹
     * @return ãƒ‡ãƒã‚¤ã‚¹ã«å¯¾å¿œã™ã‚‹è«–ç†åº§æ¨™ã®ä¸‹è¾ºã®Yè»¸ä½ç½®
     */
    getScreenBottom() {
        return this._screenBottom;
    }
    /**
     * ãƒ‡ãƒã‚¤ã‚¹ã«å¯¾å¿œã™ã‚‹è«–ç†åº§æ¨™ã®ä¸Šè¾ºã®Yè»¸ä½ç½®ã‚’å–å¾—ã™ã‚‹
     * @return ãƒ‡ãƒã‚¤ã‚¹ã«å¯¾å¿œã™ã‚‹è«–ç†åº§æ¨™ã®ä¸Šè¾ºã®Yè»¸ä½ç½®
     */
    getScreenTop() {
        return this._screenTop;
    }
    /**
     * å·¦è¾ºã®Xè»¸ä½ç½®ã®æœ€å¤§å€¤ã®å–å¾—
     * @return å·¦è¾ºã®Xè»¸ä½ç½®ã®æœ€å¤§å€¤
     */
    getMaxLeft() {
        return this._maxLeft;
    }
    /**
     * å³è¾ºã®Xè»¸ä½ç½®ã®æœ€å¤§å€¤ã®å–å¾—
     * @return å³è¾ºã®Xè»¸ä½ç½®ã®æœ€å¤§å€¤
     */
    getMaxRight() {
        return this._maxRight;
    }
    /**
     * ä¸‹è¾ºã®Yè»¸ä½ç½®ã®æœ€å¤§å€¤ã®å–å¾—
     * @return ä¸‹è¾ºã®Yè»¸ä½ç½®ã®æœ€å¤§å€¤
     */
    getMaxBottom() {
        return this._maxBottom;
    }
    /**
     * ä¸Šè¾ºã®Yè»¸ä½ç½®ã®æœ€å¤§å€¤ã®å–å¾—
     * @return ä¸Šè¾ºã®Yè»¸ä½ç½®ã®æœ€å¤§å€¤
     */
    getMaxTop() {
        return this._maxTop;
    }
}
// Namespace definition for compatibility.
import * as $ from './cubismviewmatrix.js';
// eslint-disable-next-line @typescript-eslint/no-namespace
export var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    Live2DCubismFramework.CubismViewMatrix = $.CubismViewMatrix;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));
//# sourceMappingURL=cubismviewmatrix.js.map