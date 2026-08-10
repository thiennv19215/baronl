/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
/**
 * çŸ©å½¢å½¢çŠ¶ï¼ˆåº§æ¨™ãƒ»é•·ã•ã¯floatå€¤ï¼‰ã‚’å®šç¾©ã™ã‚‹ã‚¯ãƒ©ã‚¹
 */
export class csmRect {
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     * @param x å·¦ç«¯Xåº§æ¨™
     * @param y ä¸Šç«¯Yåº§æ¨™
     * @param w å¹…
     * @param h é«˜ã•
     */
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
    }
    /**
     * çŸ©å½¢ä¸­å¤®ã®Xåº§æ¨™ã‚’å–å¾—ã™ã‚‹
     */
    getCenterX() {
        return this.x + 0.5 * this.width;
    }
    /**
     * çŸ©å½¢ä¸­å¤®ã®Yåº§æ¨™ã‚’å–å¾—ã™ã‚‹
     */
    getCenterY() {
        return this.y + 0.5 * this.height;
    }
    /**
     * å³å´ã®Xåº§æ¨™ã‚’å–å¾—ã™ã‚‹
     */
    getRight() {
        return this.x + this.width;
    }
    /**
     * ä¸‹ç«¯ã®Yåº§æ¨™ã‚’å–å¾—ã™ã‚‹
     */
    getBottom() {
        return this.y + this.height;
    }
    /**
     * çŸ©å½¢ã«å€¤ã‚’ã‚»ãƒƒãƒˆã™ã‚‹
     * @param r çŸ©å½¢ã®ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹
     */
    setRect(r) {
        this.x = r.x;
        this.y = r.y;
        this.width = r.width;
        this.height = r.height;
    }
    /**
     * çŸ©å½¢ä¸­å¤®ã‚’è»¸ã«ã—ã¦ç¸¦æ¨ªã‚’æ‹¡ç¸®ã™ã‚‹
     * @param w å¹…æ–¹å‘ã«æ‹¡ç¸®ã™ã‚‹é‡
     * @param h é«˜ã•æ–¹å‘ã«æ‹¡ç¸®ã™ã‚‹é‡
     */
    expand(w, h) {
        this.x -= w;
        this.y -= h;
        this.width += w * 2.0;
        this.height += h * 2.0;
    }
}
// Namespace definition for compatibility.
import * as $ from './csmrectf.js';
// eslint-disable-next-line @typescript-eslint/no-namespace
export var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    Live2DCubismFramework.csmRect = $.csmRect;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));
//# sourceMappingURL=csmrectf.js.map