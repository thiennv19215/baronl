/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
import { csmDelete } from '../live2dcubismframework.js';
import { CubismExpressionMotion } from './cubismexpressionmotion.js';
import { CubismMotionQueueManager } from './cubismmotionqueuemanager.js';
/**
 * @brief ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã«é©ç”¨ã™ã‚‹è¡¨æƒ…ã®å€¤ã‚’æŒãŸã›ã‚‹æ§‹é€ ä½“
 */
export class ExpressionParameterValue {
}
/**
 * @brief è¡¨æƒ…ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®ç®¡ç†
 *
 * è¡¨æƒ…ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®ç®¡ç†ã‚’ãŠã“ãªã†ã‚¯ãƒ©ã‚¹ã€‚
 */
export class CubismExpressionMotionManager extends CubismMotionQueueManager {
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    constructor() {
        super();
        this._expressionParameterValues = new Array();
        this._fadeWeights = new Array();
    }
    /**
     * ãƒ‡ã‚¹ãƒˆãƒ©ã‚¯ã‚¿ç›¸å½“ã®å‡¦ç†
     */
    release() {
        if (this._expressionParameterValues) {
            csmDelete(this._expressionParameterValues);
            this._expressionParameterValues = null;
        }
        if (this._fadeWeights) {
            csmDelete(this._fadeWeights);
            this._fadeWeights = null;
        }
    }
    /**
     * @brief å†ç”Ÿä¸­ã®ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®ã‚¦ã‚§ã‚¤ãƒˆã‚’å–å¾—ã™ã‚‹ã€‚
     *
     * @param[in]    index    è¡¨æƒ…ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return               è¡¨æƒ…ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®ã‚¦ã‚§ã‚¤ãƒˆ
     */
    getFadeWeight(index) {
        if (index < 0 ||
            this._fadeWeights.length < 1 ||
            index >= this._fadeWeights.length) {
            console.warn('Failed to get the fade weight value. The element at that index does not exist.');
            return -1;
        }
        return this._fadeWeights[index];
    }
    /**
     * @brief ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®ã‚¦ã‚§ã‚¤ãƒˆã®è¨­å®šã€‚
     *
     * @param[in]    index    è¡¨æƒ…ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @param[in]    index    è¡¨æƒ…ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®ã‚¦ã‚§ã‚¤ãƒˆ
     */
    setFadeWeight(index, expressionFadeWeight) {
        if (index < 0 ||
            this._fadeWeights.length < 1 ||
            this._fadeWeights.length <= index) {
            console.warn('Failed to set the fade weight value. The element at that index does not exist.');
            return;
        }
        this._fadeWeights[index] = expressionFadeWeight;
    }
    /**
     * @brief ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®æ›´æ–°
     *
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã‚’æ›´æ–°ã—ã¦ã€ãƒ¢ãƒ‡ãƒ«ã«ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿å€¤ã‚’åæ˜ ã™ã‚‹ã€‚
     *
     * @param[in]   model   å¯¾è±¡ã®ãƒ¢ãƒ‡ãƒ«
     * @param[in]   deltaTimeSeconds    ãƒ‡ãƒ«ã‚¿æ™‚é–“[ç§’]
     * @return  true    æ›´æ–°ã•ã‚Œã¦ã„ã‚‹
     *          false   æ›´æ–°ã•ã‚Œã¦ã„ãªã„
     */
    updateMotion(model, deltaTimeSeconds) {
        this._userTimeSeconds += deltaTimeSeconds;
        let updated = false;
        const motions = this.getCubismMotionQueueEntries();
        let expressionWeight = 0.0;
        let expressionIndex = 0;
        if (this._fadeWeights.length !== motions.length) {
            const difference = motions.length - this._fadeWeights.length;
            let dstIndex = this._fadeWeights.length;
            this._fadeWeights.length += difference;
            // TODO:
            // https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/fill
            // this._fadeWeights.fill(0.0, dstIndex, this._fadeWeights.length)
            for (let i = 0; i < difference; i++) {
                this._fadeWeights[dstIndex++] = 0.0;
            }
        }
        // ------- å‡¦ç†ã‚’è¡Œã† --------
        // æ—¢ã«ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ãŒã‚ã‚Œã°çµ‚äº†ãƒ•ãƒ©ã‚°ã‚’ç«‹ã¦ã‚‹
        for (let i = 0; i < this._motions.length;) {
            const motionQueueEntry = this._motions[i];
            if (motionQueueEntry == null) {
                motions.splice(i, 1); //å‰Šé™¤
                continue;
            }
            const expressionMotion = (motionQueueEntry.getCubismMotion());
            if (expressionMotion == null) {
                csmDelete(motionQueueEntry);
                motions.splice(i, 1); //å‰Šé™¤
                continue;
            }
            const expressionParameters = expressionMotion.getExpressionParameters();
            if (motionQueueEntry.isAvailable()) {
                // å†ç”Ÿä¸­ã®ExpressionãŒå‚ç…§ã—ã¦ã„ã‚‹ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã‚’ã™ã¹ã¦ãƒªã‚¹ãƒˆã‚¢ãƒƒãƒ—
                for (let i = 0; i < expressionParameters.length; ++i) {
                    if (expressionParameters[i].parameterId == null) {
                        continue;
                    }
                    let index = -1;
                    // ãƒªã‚¹ãƒˆã«ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿IDãŒå­˜åœ¨ã™ã‚‹ã‹æ¤œç´¢
                    for (let j = 0; j < this._expressionParameterValues.length; ++j) {
                        if (this._expressionParameterValues[j].parameterId !=
                            expressionParameters[i].parameterId) {
                            continue;
                        }
                        index = j;
                        break;
                    }
                    if (index >= 0) {
                        continue;
                    }
                    // ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ãŒãƒªã‚¹ãƒˆã«å­˜åœ¨ã—ãªã„ãªã‚‰æ–°è¦è¿½åŠ 
                    const item = new ExpressionParameterValue();
                    item.parameterId = expressionParameters[i].parameterId;
                    item.additiveValue = CubismExpressionMotion.DefaultAdditiveValue;
                    item.multiplyValue = CubismExpressionMotion.DefaultMultiplyValue;
                    item.overwriteValue = model.getParameterValueById(item.parameterId);
                    this._expressionParameterValues.push(item);
                }
            }
            // ------ å€¤ã‚’è¨ˆç®—ã™ã‚‹ ------
            expressionMotion.setupMotionQueueEntry(motionQueueEntry, this._userTimeSeconds);
            this.setFadeWeight(expressionIndex, expressionMotion.updateFadeWeight(motionQueueEntry, this._userTimeSeconds));
            expressionMotion.calculateExpressionParameters(model, this._userTimeSeconds, motionQueueEntry, this._expressionParameterValues, expressionIndex, this.getFadeWeight(expressionIndex));
            expressionWeight +=
                expressionMotion.getFadeInTime() == 0.0
                    ? 1.0
                    : CubismMath.getEasingSine((this._userTimeSeconds - motionQueueEntry.getFadeInStartTime()) /
                        expressionMotion.getFadeInTime());
            updated = true;
            if (motionQueueEntry.isTriggeredFadeOut()) {
                // ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¢ã‚¦ãƒˆé–‹å§‹
                motionQueueEntry.startFadeOut(motionQueueEntry.getFadeOutSeconds(), this._userTimeSeconds);
            }
            ++i;
            ++expressionIndex;
        }
        // ----- æœ€æ–°ã®Expressionã®ãƒ•ã‚§ãƒ¼ãƒ‰ãŒå®Œäº†ã—ã¦ã„ã‚Œã°ãã‚Œä»¥å‰ã‚’å‰Šé™¤ã™ã‚‹ ------
        if (motions.length > 1) {
            const latestFadeWeight = this.getFadeWeight(this._fadeWeights.length - 1);
            if (latestFadeWeight >= 1.0) {
                // é…åˆ—ã®æœ€å¾Œã®è¦ç´ ã¯å‰Šé™¤ã—ãªã„
                for (let i = motions.length - 2; i >= 0; --i) {
                    const motionQueueEntry = motions[i];
                    csmDelete(motionQueueEntry);
                    motions.splice(i, 1);
                    this._fadeWeights.splice(i, 1);
                }
            }
        }
        if (expressionWeight > 1.0) {
            expressionWeight = 1.0;
        }
        // ãƒ¢ãƒ‡ãƒ«ã«å„å€¤ã‚’é©ç”¨
        for (let i = 0; i < this._expressionParameterValues.length; ++i) {
            const expressionParameterValue = this._expressionParameterValues[i];
            model.setParameterValueById(expressionParameterValue.parameterId, (expressionParameterValue.overwriteValue +
                expressionParameterValue.additiveValue) *
                expressionParameterValue.multiplyValue, expressionWeight);
            expressionParameterValue.additiveValue =
                CubismExpressionMotion.DefaultAdditiveValue;
            expressionParameterValue.multiplyValue =
                CubismExpressionMotion.DefaultMultiplyValue;
        }
        return updated;
    }
}
// Namespace definition for compatibility.
import * as $ from './cubismexpressionmotionmanager.js';
import { CubismMath } from '../math/cubismmath.js';
// eslint-disable-next-line @typescript-eslint/no-namespace
export var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    Live2DCubismFramework.CubismExpressionMotionManager = $.CubismExpressionMotionManager;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));
//# sourceMappingURL=cubismexpressionmotionmanager.js.map