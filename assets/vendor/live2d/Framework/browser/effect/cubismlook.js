/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
/**
 * ã‚¿ãƒ¼ã‚²ãƒƒãƒˆã«ã‚ˆã‚‹ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿è¿½å¾“æ©Ÿèƒ½
 *
 * ãƒ‰ãƒ©ãƒƒã‚°å…¥åŠ›ã«å¯¾ã™ã‚‹ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿è¿½å¾“æ©Ÿèƒ½ã‚’æä¾›ã™ã‚‹ã€‚
 */
export class CubismLook {
    /**
     * ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹ã®ä½œæˆ
     */
    static create() {
        return new CubismLook();
    }
    /**
     * ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹ã®ç ´æ£„
     * @param instance å¯¾è±¡ã®CubismDrag
     */
    static delete(instance) {
        if (instance != null) {
            instance = null;
        }
    }
    /**
     * ã‚¿ãƒ¼ã‚²ãƒƒãƒˆè¿½å¾“ã®ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®ç´ã¥ã‘
     * @param lookParameters ã‚¿ãƒ¼ã‚²ãƒƒãƒˆè¿½å¾“ã‚’ç´ã¥ã‘ãŸã„ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®ãƒªã‚¹ãƒˆ
     */
    setParameters(lookParameters) {
        this._lookParameters = lookParameters;
    }
    /**
     * ã‚¿ãƒ¼ã‚²ãƒƒãƒˆè¿½å¾“ã«ç´ã¥ã„ã¦ã„ã‚‹ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®å–å¾—
     * @return ã‚¿ãƒ¼ã‚²ãƒƒãƒˆè¿½å¾“ã«ç´ã¥ã„ã¦ã„ã‚‹ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®ãƒªã‚¹ãƒˆ
     */
    getParameters() {
        return this._lookParameters;
    }
    /**
     * ãƒ¢ãƒ‡ãƒ«ã®ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®æ›´æ–°
     * @param model å¯¾è±¡ã®ãƒ¢ãƒ‡ãƒ«
     * @param dragX ã‚¿ãƒ¼ã‚²ãƒƒãƒˆã®Xåº§æ¨™
     * @param dragY ã‚¿ãƒ¼ã‚²ãƒƒãƒˆã®Yåº§æ¨™
     */
    updateParameters(model, dragX, dragY) {
        for (let i = 0; i < this._lookParameters.length; ++i) {
            const data = this._lookParameters[i];
            model.addParameterValueById(data.parameterId, data.factorX * dragX +
                data.factorY * dragY +
                data.factorXY * dragX * dragY);
        }
    }
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    constructor() {
        this._lookParameters = new Array();
    }
}
/**
 * ã‚¿ãƒ¼ã‚²ãƒƒãƒˆè¿½å¾“ã®ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿æƒ…å ±
 */
export class LookParameterData {
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     * @param parameterId   ã‚¿ãƒ¼ã‚²ãƒƒãƒˆè¿½å¾“ã‚’ç´ã¥ã‘ã‚‹ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ID
     * @param factorX       Xæ–¹å‘ãƒ‰ãƒ©ãƒƒã‚°å…¥åŠ›ã«å¯¾ã™ã‚‹ä¿‚æ•°
     * @param factorY       Yæ–¹å‘ãƒ‰ãƒ©ãƒƒã‚°å…¥åŠ›ã«å¯¾ã™ã‚‹ä¿‚æ•°
     * @param factorXY      XYç©ãƒ‰ãƒ©ãƒƒã‚°å…¥åŠ›ã«å¯¾ã™ã‚‹ä¿‚æ•°
     */
    constructor(parameterId, factorX, factorY, factorXY) {
        this.parameterId = parameterId == undefined ? null : parameterId;
        this.factorX = factorX == undefined ? 0.0 : factorX;
        this.factorY = factorY == undefined ? 0.0 : factorY;
        this.factorXY = factorXY == undefined ? 0.0 : factorXY;
    }
}
// Namespace definition for compatibility.
import * as $ from './cubismlook.js';
// eslint-disable-next-line @typescript-eslint/no-namespace
export var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    Live2DCubismFramework.LookParameterData = $.LookParameterData;
    Live2DCubismFramework.CubismLook = $.CubismLook;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));
//# sourceMappingURL=cubismlook.js.map