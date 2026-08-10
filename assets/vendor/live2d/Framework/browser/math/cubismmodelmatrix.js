/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
import { CubismMatrix44 } from './cubismmatrix44.js';
/**
 * ãƒ¢ãƒ‡ãƒ«åº§æ¨™è¨­å®šç”¨ã®4x4è¡Œåˆ—
 *
 * ãƒ¢ãƒ‡ãƒ«åº§æ¨™è¨­å®šç”¨ã®4x4è¡Œåˆ—ã‚¯ãƒ©ã‚¹
 */
export class CubismModelMatrix extends CubismMatrix44 {
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     *
     * @param w æ¨ªå¹…
     * @param h ç¸¦å¹…
     */
    constructor(w, h) {
        super();
        this._width = w !== undefined ? w : 0.0;
        this._height = h !== undefined ? h : 0.0;
        this.setHeight(2.0);
    }
    /**
     * æ¨ªå¹…ã‚’è¨­å®š
     *
     * @param w æ¨ªå¹…
     */
    setWidth(w) {
        const scaleX = w / this._width;
        const scaleY = scaleX;
        this.scale(scaleX, scaleY);
    }
    /**
     * ç¸¦å¹…ã‚’è¨­å®š
     * @param h ç¸¦å¹…
     */
    setHeight(h) {
        const scaleX = h / this._height;
        const scaleY = scaleX;
        this.scale(scaleX, scaleY);
    }
    /**
     * ä½ç½®ã‚’è¨­å®š
     *
     * @param x Xè»¸ã®ä½ç½®
     * @param y Yè»¸ã®ä½ç½®
     */
    setPosition(x, y) {
        this.translate(x, y);
    }
    /**
     * ä¸­å¿ƒä½ç½®ã‚’è¨­å®š
     *
     * @param x Xè»¸ã®ä¸­å¿ƒä½ç½®
     * @param y Yè»¸ã®ä¸­å¿ƒä½ç½®
     *
     * @note widthã‹heightã‚’è¨­å®šã—ãŸã‚ã¨ã§ãªã„ã¨ã€æ‹¡å¤§çŽ‡ãŒæ­£ã—ãå–å¾—ã§ããªã„ãŸã‚ãšã‚Œã‚‹ã€‚
     */
    setCenterPosition(x, y) {
        this.centerX(x);
        this.centerY(y);
    }
    /**
     * ä¸Šè¾ºã®ä½ç½®ã‚’è¨­å®šã™ã‚‹
     *
     * @param y ä¸Šè¾ºã®Yè»¸ä½ç½®
     */
    top(y) {
        this.setY(y);
    }
    /**
     * ä¸‹è¾ºã®ä½ç½®ã‚’è¨­å®šã™ã‚‹
     *
     * @param y ä¸‹è¾ºã®Yè»¸ä½ç½®
     */
    bottom(y) {
        const h = this._height * this.getScaleY();
        this.translateY(y - h);
    }
    /**
     * å·¦è¾ºã®ä½ç½®ã‚’è¨­å®š
     *
     * @param x å·¦è¾ºã®Xè»¸ä½ç½®
     */
    left(x) {
        this.setX(x);
    }
    /**
     * å³è¾ºã®ä½ç½®ã‚’è¨­å®š
     *
     * @param x å³è¾ºã®Xè»¸ä½ç½®
     */
    right(x) {
        const w = this._width * this.getScaleX();
        this.translateX(x - w);
    }
    /**
     * Xè»¸ã®ä¸­å¿ƒä½ç½®ã‚’è¨­å®š
     *
     * @param x Xè»¸ã®ä¸­å¿ƒä½ç½®
     */
    centerX(x) {
        const w = this._width * this.getScaleX();
        this.translateX(x - w / 2.0);
    }
    /**
     * Xè»¸ã®ä½ç½®ã‚’è¨­å®š
     *
     * @param x Xè»¸ã®ä½ç½®
     */
    setX(x) {
        this.translateX(x);
    }
    /**
     * Yè»¸ã®ä¸­å¿ƒä½ç½®ã‚’è¨­å®š
     *
     * @param y Yè»¸ã®ä¸­å¿ƒä½ç½®
     */
    centerY(y) {
        const h = this._height * this.getScaleY();
        this.translateY(y - h / 2.0);
    }
    /**
     * Yè»¸ã®ä½ç½®ã‚’è¨­å®šã™ã‚‹
     *
     * @param y Yè»¸ã®ä½ç½®
     */
    setY(y) {
        this.translateY(y);
    }
    /**
     * ãƒ¬ã‚¤ã‚¢ã‚¦ãƒˆæƒ…å ±ã‹ã‚‰ä½ç½®ã‚’è¨­å®š
     *
     * @param layout ãƒ¬ã‚¤ã‚¢ã‚¦ãƒˆæƒ…å ±
     */
    setupFromLayout(layout) {
        const keyWidth = 'width';
        const keyHeight = 'height';
        const keyX = 'x';
        const keyY = 'y';
        const keyCenterX = 'center_x';
        const keyCenterY = 'center_y';
        const keyTop = 'top';
        const keyBottom = 'bottom';
        const keyLeft = 'left';
        const keyRight = 'right';
        for (const item of layout) {
            const key = item[0];
            const value = item[1];
            if (key == keyWidth) {
                this.setWidth(value);
            }
            else if (key == keyHeight) {
                this.setHeight(value);
            }
        }
        for (const item of layout) {
            const key = item[0];
            const value = item[1];
            if (key == keyX) {
                this.setX(value);
            }
            else if (key == keyY) {
                this.setY(value);
            }
            else if (key == keyCenterX) {
                this.centerX(value);
            }
            else if (key == keyCenterY) {
                this.centerY(value);
            }
            else if (key == keyTop) {
                this.top(value);
            }
            else if (key == keyBottom) {
                this.bottom(value);
            }
            else if (key == keyLeft) {
                this.left(value);
            }
            else if (key == keyRight) {
                this.right(value);
            }
        }
    }
}
// Namespace definition for compatibility.
import * as $ from './cubismmodelmatrix.js';
// eslint-disable-next-line @typescript-eslint/no-namespace
export var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    Live2DCubismFramework.CubismModelMatrix = $.CubismModelMatrix;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));
//# sourceMappingURL=cubismmodelmatrix.js.map