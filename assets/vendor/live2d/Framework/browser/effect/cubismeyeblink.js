/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
/**
 * è‡ªå‹•ã¾ã°ãŸãæ©Ÿèƒ½
 *
 * è‡ªå‹•ã¾ã°ãŸãæ©Ÿèƒ½ã‚’æä¾›ã™ã‚‹ã€‚
 */
export class CubismEyeBlink {
    /**
     * ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹ã‚’ä½œæˆã™ã‚‹
     * @param modelSetting ãƒ¢ãƒ‡ãƒ«ã®è¨­å®šæƒ…å ±
     * @return ä½œæˆã•ã‚ŒãŸã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹
     * @note å¼•æ•°ãŒNULLã®å ´åˆã€ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿IDãŒè¨­å®šã•ã‚Œã¦ã„ãªã„ç©ºã®ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹ã‚’ä½œæˆã™ã‚‹ã€‚
     */
    static create(modelSetting = null) {
        return new CubismEyeBlink(modelSetting);
    }
    /**
     * ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹ã®ç ´æ£„
     * @param eyeBlink å¯¾è±¡ã®CubismEyeBlink
     */
    static delete(eyeBlink) {
        if (eyeBlink != null) {
            eyeBlink = null;
        }
    }
    /**
     * ã¾ã°ãŸãã®é–“éš”ã®è¨­å®š
     * @param blinkingInterval ã¾ã°ãŸãã®é–“éš”ã®æ™‚é–“[ç§’]
     */
    setBlinkingInterval(blinkingInterval) {
        this._blinkingIntervalSeconds = blinkingInterval;
    }
    /**
     * ã¾ã°ãŸãã®ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®è©³ç´°è¨­å®š
     * @param closing   ã¾ã¶ãŸã‚’é–‰ã˜ã‚‹å‹•ä½œã®æ‰€è¦æ™‚é–“[ç§’]
     * @param closed    ã¾ã¶ãŸã‚’é–‰ã˜ã¦ã„ã‚‹å‹•ä½œã®æ‰€è¦æ™‚é–“[ç§’]
     * @param opening   ã¾ã¶ãŸã‚’é–‹ãå‹•ä½œã®æ‰€è¦æ™‚é–“[ç§’]
     */
    setBlinkingSetting(closing, closed, opening) {
        this._closingSeconds = closing;
        this._closedSeconds = closed;
        this._openingSeconds = opening;
    }
    /**
     * ã¾ã°ãŸãã•ã›ã‚‹ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿IDã®ãƒªã‚¹ãƒˆã®è¨­å®š
     * @param parameterIds ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®IDã®ãƒªã‚¹ãƒˆ
     */
    setParameterIds(parameterIds) {
        this._parameterIds = parameterIds;
    }
    /**
     * ã¾ã°ãŸãã•ã›ã‚‹ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿IDã®ãƒªã‚¹ãƒˆã®å–å¾—
     * @return ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿IDã®ãƒªã‚¹ãƒˆ
     */
    getParameterIds() {
        return this._parameterIds;
    }
    /**
     * ãƒ¢ãƒ‡ãƒ«ã®ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®æ›´æ–°
     * @param model å¯¾è±¡ã®ãƒ¢ãƒ‡ãƒ«
     * @param deltaTimeSeconds ãƒ‡ãƒ«ã‚¿æ™‚é–“[ç§’]
     */
    updateParameters(model, deltaTimeSeconds) {
        this._userTimeSeconds += deltaTimeSeconds;
        let parameterValue;
        let t = 0.0;
        const blinkingState = this._blinkingState;
        switch (blinkingState) {
            case EyeState.EyeState_Closing:
                t =
                    (this._userTimeSeconds - this._stateStartTimeSeconds) /
                        this._closingSeconds;
                if (t >= 1.0) {
                    t = 1.0;
                    this._blinkingState = EyeState.EyeState_Closed;
                    this._stateStartTimeSeconds = this._userTimeSeconds;
                }
                parameterValue = 1.0 - t;
                break;
            case EyeState.EyeState_Closed:
                t =
                    (this._userTimeSeconds - this._stateStartTimeSeconds) /
                        this._closedSeconds;
                if (t >= 1.0) {
                    this._blinkingState = EyeState.EyeState_Opening;
                    this._stateStartTimeSeconds = this._userTimeSeconds;
                }
                parameterValue = 0.0;
                break;
            case EyeState.EyeState_Opening:
                t =
                    (this._userTimeSeconds - this._stateStartTimeSeconds) /
                        this._openingSeconds;
                if (t >= 1.0) {
                    t = 1.0;
                    this._blinkingState = EyeState.EyeState_Interval;
                    this._nextBlinkingTime = this.determinNextBlinkingTiming();
                }
                parameterValue = t;
                break;
            case EyeState.EyeState_Interval:
                if (this._nextBlinkingTime < this._userTimeSeconds) {
                    this._blinkingState = EyeState.EyeState_Closing;
                    this._stateStartTimeSeconds = this._userTimeSeconds;
                }
                parameterValue = 1.0;
                break;
            case EyeState.EyeState_First:
            default:
                this._blinkingState = EyeState.EyeState_Interval;
                this._nextBlinkingTime = this.determinNextBlinkingTiming();
                parameterValue = 1.0;
                break;
        }
        if (!CubismEyeBlink.CloseIfZero) {
            parameterValue = -parameterValue;
        }
        for (let i = 0; i < this._parameterIds.length; ++i) {
            model.setParameterValueById(this._parameterIds[i], parameterValue);
        }
    }
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     * @param modelSetting ãƒ¢ãƒ‡ãƒ«ã®è¨­å®šæƒ…å ±
     */
    constructor(modelSetting) {
        this._blinkingState = EyeState.EyeState_First;
        this._nextBlinkingTime = 0.0;
        this._stateStartTimeSeconds = 0.0;
        this._blinkingIntervalSeconds = 4.0;
        this._closingSeconds = 0.1;
        this._closedSeconds = 0.05;
        this._openingSeconds = 0.15;
        this._userTimeSeconds = 0.0;
        this._parameterIds = new Array();
        if (modelSetting == null) {
            return;
        }
        this._parameterIds.length = modelSetting.getEyeBlinkParameterCount();
        for (let i = 0; i < modelSetting.getEyeBlinkParameterCount(); ++i) {
            this._parameterIds[i] = modelSetting.getEyeBlinkParameterId(i);
        }
    }
    /**
     * æ¬¡ã®çž¬ãã®ã‚¿ã‚¤ãƒŸãƒ³ã‚°ã®æ±ºå®š
     *
     * @return æ¬¡ã®ã¾ã°ãŸãã‚’è¡Œã†æ™‚åˆ»[ç§’]
     */
    determinNextBlinkingTiming() {
        const r = Math.random();
        return (this._userTimeSeconds + r * (2.0 * this._blinkingIntervalSeconds - 1.0));
    }
}
/**
 * IDã§æŒ‡å®šã•ã‚ŒãŸç›®ã®ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ãŒã€0ã®ã¨ãã«é–‰ã˜ã‚‹ãªã‚‰ true ã€1ã®æ™‚ã«é–‰ã˜ã‚‹ãªã‚‰ false ã€‚
 */
CubismEyeBlink.CloseIfZero = true;
/**
 * ã¾ã°ãŸãã®çŠ¶æ…‹
 *
 * ã¾ã°ãŸãã®çŠ¶æ…‹ã‚’è¡¨ã™åˆ—æŒ™åž‹
 */
export var EyeState;
(function (EyeState) {
    EyeState[EyeState["EyeState_First"] = 0] = "EyeState_First";
    EyeState[EyeState["EyeState_Interval"] = 1] = "EyeState_Interval";
    EyeState[EyeState["EyeState_Closing"] = 2] = "EyeState_Closing";
    EyeState[EyeState["EyeState_Closed"] = 3] = "EyeState_Closed";
    EyeState[EyeState["EyeState_Opening"] = 4] = "EyeState_Opening"; // ã¾ã¶ãŸãŒé–‹ã„ã¦ã„ãé€”ä¸­ã®çŠ¶æ…‹
})(EyeState || (EyeState = {}));
// Namespace definition for compatibility.
import * as $ from './cubismeyeblink.js';
// eslint-disable-next-line @typescript-eslint/no-namespace
export var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    Live2DCubismFramework.CubismEyeBlink = $.CubismEyeBlink;
    Live2DCubismFramework.EyeState = $.EyeState;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));
//# sourceMappingURL=cubismeyeblink.js.map