/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
/**
 * å‘¼å¸æ©Ÿèƒ½
 *
 * å‘¼å¸æ©Ÿèƒ½ã‚’æä¾›ã™ã‚‹ã€‚
 */
export class CubismBreath {
    /**
     * ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹ã®ä½œæˆ
     */
    static create() {
        return new CubismBreath();
    }
    /**
     * ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹ã®ç ´æ£„
     * @param instance å¯¾è±¡ã®CubismBreath
     */
    static delete(instance) {
        if (instance != null) {
            instance = null;
        }
    }
    /**
     * å‘¼å¸ã®ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®ç´ã¥ã‘
     * @param breathParameters å‘¼å¸ã‚’ç´ã¥ã‘ãŸã„ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®ãƒªã‚¹ãƒˆ
     */
    setParameters(breathParameters) {
        this._breathParameters = breathParameters;
    }
    /**
     * å‘¼å¸ã«ç´ã¥ã„ã¦ã„ã‚‹ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®å–å¾—
     * @return å‘¼å¸ã«ç´ã¥ã„ã¦ã„ã‚‹ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®ãƒªã‚¹ãƒˆ
     */
    getParameters() {
        return this._breathParameters;
    }
    /**
     * ãƒ¢ãƒ‡ãƒ«ã®ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®æ›´æ–°
     * @param model å¯¾è±¡ã®ãƒ¢ãƒ‡ãƒ«
     * @param deltaTimeSeconds ãƒ‡ãƒ«ã‚¿æ™‚é–“[ç§’]
     */
    updateParameters(model, deltaTimeSeconds) {
        this._currentTime += deltaTimeSeconds;
        const t = this._currentTime * 2.0 * Math.PI;
        for (let i = 0; i < this._breathParameters.length; ++i) {
            const data = this._breathParameters[i];
            model.addParameterValueById(data.parameterId, data.offset + data.peak * Math.sin(t / data.cycle), data.weight);
        }
    }
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    constructor() {
        this._currentTime = 0.0;
    }
}
/**
 * å‘¼å¸ã®ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿æƒ…å ±
 */
export class BreathParameterData {
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     * @param parameterId   å‘¼å¸ã‚’ã²ã‚‚ã¥ã‘ã‚‹ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ID
     * @param offset        å‘¼å¸ã‚’æ­£å¼¦æ³¢ã¨ã—ãŸã¨ãã®ã€æ³¢ã®ã‚ªãƒ•ã‚»ãƒƒãƒˆ
     * @param peak          å‘¼å¸ã‚’æ­£å¼¦æ³¢ã¨ã—ãŸã¨ãã®ã€æ³¢ã®é«˜ã•
     * @param cycle         å‘¼å¸ã‚’æ­£å¼¦æ³¢ã¨ã—ãŸã¨ãã®ã€æ³¢ã®å‘¨æœŸ
     * @param weight        ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã¸ã®é‡ã¿
     */
    constructor(parameterId, offset, peak, cycle, weight) {
        this.parameterId = parameterId == undefined ? null : parameterId;
        this.offset = offset == undefined ? 0.0 : offset;
        this.peak = peak == undefined ? 0.0 : peak;
        this.cycle = cycle == undefined ? 0.0 : cycle;
        this.weight = weight == undefined ? 0.0 : weight;
    }
}
// Namespace definition for compatibility.
import * as $ from './cubismbreath.js';
// eslint-disable-next-line @typescript-eslint/no-namespace
export var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    Live2DCubismFramework.BreathParameterData = $.BreathParameterData;
    Live2DCubismFramework.CubismBreath = $.CubismBreath;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));
//# sourceMappingURL=cubismbreath.js.map