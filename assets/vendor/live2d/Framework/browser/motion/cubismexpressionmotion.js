/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
import { CubismFramework } from '../live2dcubismframework.js';
import { CubismJson } from '../utils/cubismjson.js';
import { ACubismMotion } from './acubismmotion.js';
// exp3.jsonã®ã‚­ãƒ¼ã¨ãƒ‡ãƒ•ã‚©ãƒ«ãƒˆ
const ExpressionKeyFadeIn = 'FadeInTime';
const ExpressionKeyFadeOut = 'FadeOutTime';
const ExpressionKeyParameters = 'Parameters';
const ExpressionKeyId = 'Id';
const ExpressionKeyValue = 'Value';
const ExpressionKeyBlend = 'Blend';
const BlendValueAdd = 'Add';
const BlendValueMultiply = 'Multiply';
const BlendValueOverwrite = 'Overwrite';
const DefaultFadeTime = 1.0;
/**
 * è¡¨æƒ…ã®ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³
 *
 * è¡¨æƒ…ã®ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã‚¯ãƒ©ã‚¹ã€‚
 */
export class CubismExpressionMotion extends ACubismMotion {
    /**
     * ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹ã‚’ä½œæˆã™ã‚‹ã€‚
     * @param buffer expãƒ•ã‚¡ã‚¤ãƒ«ãŒèª­ã¿è¾¼ã¾ã‚Œã¦ã„ã‚‹ãƒãƒƒãƒ•ã‚¡
     * @param size ãƒãƒƒãƒ•ã‚¡ã®ã‚µã‚¤ã‚º
     * @return ä½œæˆã•ã‚ŒãŸã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹
     */
    static create(buffer, size) {
        const expression = new CubismExpressionMotion();
        expression.parse(buffer, size);
        return expression;
    }
    /**
     * ãƒ¢ãƒ‡ãƒ«ã®ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®æ›´æ–°ã®å®Ÿè¡Œ
     * @param model å¯¾è±¡ã®ãƒ¢ãƒ‡ãƒ«
     * @param userTimeSeconds ãƒ‡ãƒ«ã‚¿æ™‚é–“ã®ç©ç®—å€¤[ç§’]
     * @param weight ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®é‡ã¿
     * @param motionQueueEntry CubismMotionQueueManagerã§ç®¡ç†ã•ã‚Œã¦ã„ã‚‹ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³
     */
    doUpdateParameters(model, userTimeSeconds, weight, motionQueueEntry) {
        for (let i = 0; i < this._parameters.length; ++i) {
            const parameter = this._parameters[i];
            switch (parameter.blendType) {
                case ExpressionBlendType.Additive: {
                    model.addParameterValueById(parameter.parameterId, parameter.value, weight);
                    break;
                }
                case ExpressionBlendType.Multiply: {
                    model.multiplyParameterValueById(parameter.parameterId, parameter.value, weight);
                    break;
                }
                case ExpressionBlendType.Overwrite: {
                    model.setParameterValueById(parameter.parameterId, parameter.value, weight);
                    break;
                }
                default:
                    // ä»•æ§˜ã«ãªã„å€¤ã‚’è¨­å®šã—ãŸæ™‚ã¯ã™ã§ã«åŠ ç®—ãƒ¢ãƒ¼ãƒ‰ã«ãªã£ã¦ã„ã‚‹
                    break;
            }
        }
    }
    /**
     * @brief è¡¨æƒ…ã«ã‚ˆã‚‹ãƒ¢ãƒ‡ãƒ«ã®ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®è¨ˆç®—
     *
     * ãƒ¢ãƒ‡ãƒ«ã®è¡¨æƒ…ã«é–¢ã™ã‚‹ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã‚’è¨ˆç®—ã™ã‚‹ã€‚
     *
     * @param[in]   model                        å¯¾è±¡ã®ãƒ¢ãƒ‡ãƒ«
     * @param[in]   userTimeSeconds              ãƒ‡ãƒ«ã‚¿æ™‚é–“ã®ç©ç®—å€¤[ç§’]
     * @param[in]   motionQueueEntry             CubismMotionQueueManagerã§ç®¡ç†ã•ã‚Œã¦ã„ã‚‹ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³
     * @param[in]   expressionParameterValues    ãƒ¢ãƒ‡ãƒ«ã«é©ç”¨ã™ã‚‹å„ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®å€¤
     * @param[in]   expressionIndex              è¡¨æƒ…ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @param[in]   fadeWeight                   è¡¨æƒ…ã®ã‚¦ã‚§ã‚¤ãƒˆ
     */
    calculateExpressionParameters(model, userTimeSeconds, motionQueueEntry, expressionParameterValues, expressionIndex, fadeWeight) {
        if (motionQueueEntry == null || expressionParameterValues == null) {
            return;
        }
        if (!motionQueueEntry.isAvailable()) {
            return;
        }
        // ãƒ¢ãƒ‡ãƒ«ã«é©ç”¨ã™ã‚‹å€¤ã‚’è¨ˆç®—
        for (let i = 0; i < expressionParameterValues.length; ++i) {
            const expressionParameterValue = expressionParameterValues[i];
            if (expressionParameterValue.parameterId == null) {
                continue;
            }
            const currentParameterValue = (expressionParameterValue.overwriteValue =
                model.getParameterValueById(expressionParameterValue.parameterId));
            const expressionParameters = this.getExpressionParameters();
            let parameterIndex = -1;
            for (let j = 0; j < expressionParameters.length; ++j) {
                if (expressionParameterValue.parameterId !=
                    expressionParameters[j].parameterId) {
                    continue;
                }
                parameterIndex = j;
                break;
            }
            // å†ç”Ÿä¸­ã®ExpressionãŒå‚ç…§ã—ã¦ã„ãªã„ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã¯åˆæœŸå€¤ã‚’é©ç”¨
            if (parameterIndex < 0) {
                if (expressionIndex == 0) {
                    expressionParameterValue.additiveValue =
                        CubismExpressionMotion.DefaultAdditiveValue;
                    expressionParameterValue.multiplyValue =
                        CubismExpressionMotion.DefaultMultiplyValue;
                    expressionParameterValue.overwriteValue = currentParameterValue;
                }
                else {
                    expressionParameterValue.additiveValue = this.calculateValue(expressionParameterValue.additiveValue, CubismExpressionMotion.DefaultAdditiveValue, fadeWeight);
                    expressionParameterValue.multiplyValue = this.calculateValue(expressionParameterValue.multiplyValue, CubismExpressionMotion.DefaultMultiplyValue, fadeWeight);
                    expressionParameterValue.overwriteValue = this.calculateValue(expressionParameterValue.overwriteValue, currentParameterValue, fadeWeight);
                }
                continue;
            }
            // å€¤ã‚’è¨ˆç®—
            const value = expressionParameters[parameterIndex].value;
            let newAdditiveValue, newMultiplyValue, newOverwriteValue;
            switch (expressionParameters[parameterIndex].blendType) {
                case ExpressionBlendType.Additive:
                    newAdditiveValue = value;
                    newMultiplyValue = CubismExpressionMotion.DefaultMultiplyValue;
                    newOverwriteValue = currentParameterValue;
                    break;
                case ExpressionBlendType.Multiply:
                    newAdditiveValue = CubismExpressionMotion.DefaultAdditiveValue;
                    newMultiplyValue = value;
                    newOverwriteValue = currentParameterValue;
                    break;
                case ExpressionBlendType.Overwrite:
                    newAdditiveValue = CubismExpressionMotion.DefaultAdditiveValue;
                    newMultiplyValue = CubismExpressionMotion.DefaultMultiplyValue;
                    newOverwriteValue = value;
                    break;
                default:
                    return;
            }
            if (expressionIndex == 0) {
                expressionParameterValue.additiveValue = newAdditiveValue;
                expressionParameterValue.multiplyValue = newMultiplyValue;
                expressionParameterValue.overwriteValue = newOverwriteValue;
            }
            else {
                expressionParameterValue.additiveValue =
                    expressionParameterValue.additiveValue * (1.0 - fadeWeight) +
                        newAdditiveValue * fadeWeight;
                expressionParameterValue.multiplyValue =
                    expressionParameterValue.multiplyValue * (1.0 - fadeWeight) +
                        newMultiplyValue * fadeWeight;
                expressionParameterValue.overwriteValue =
                    expressionParameterValue.overwriteValue * (1.0 - fadeWeight) +
                        newOverwriteValue * fadeWeight;
            }
        }
    }
    /**
     * @brief è¡¨æƒ…ãŒå‚ç…§ã—ã¦ã„ã‚‹ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã‚’å–å¾—
     *
     * è¡¨æƒ…ãŒå‚ç…§ã—ã¦ã„ã‚‹ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã‚’å–å¾—ã™ã‚‹
     *
     * @return è¡¨æƒ…ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿
     */
    getExpressionParameters() {
        return this._parameters;
    }
    parse(buffer, size) {
        const json = CubismJson.create(buffer, size);
        if (!json) {
            return;
        }
        const root = json.getRoot();
        this.setFadeInTime(root.getValueByString(ExpressionKeyFadeIn).toFloat(DefaultFadeTime)); // ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¤ãƒ³
        this.setFadeOutTime(root.getValueByString(ExpressionKeyFadeOut).toFloat(DefaultFadeTime)); // ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¢ã‚¦ãƒˆ
        // å„ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã«ã¤ã„ã¦
        const parameterCount = root
            .getValueByString(ExpressionKeyParameters)
            .getSize();
        let dstIndex = this._parameters.length;
        this._parameters.length += parameterCount;
        for (let i = 0; i < parameterCount; ++i) {
            const param = root
                .getValueByString(ExpressionKeyParameters)
                .getValueByIndex(i);
            const parameterId = CubismFramework.getIdManager().getId(param.getValueByString(ExpressionKeyId).getRawString()); // ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ID
            const value = param
                .getValueByString(ExpressionKeyValue)
                .toFloat(); // å€¤
            // è¨ˆç®—æ–¹æ³•ã®è¨­å®š
            let blendType;
            if (param.getValueByString(ExpressionKeyBlend).isNull() ||
                param.getValueByString(ExpressionKeyBlend).getString() == BlendValueAdd) {
                blendType = ExpressionBlendType.Additive;
            }
            else if (param.getValueByString(ExpressionKeyBlend).getString() ==
                BlendValueMultiply) {
                blendType = ExpressionBlendType.Multiply;
            }
            else if (param.getValueByString(ExpressionKeyBlend).getString() ==
                BlendValueOverwrite) {
                blendType = ExpressionBlendType.Overwrite;
            }
            else {
                // ãã®ä»– ä»•æ§˜ã«ãªã„å€¤ã‚’è¨­å®šã—ãŸæ™‚ã¯åŠ ç®—ãƒ¢ãƒ¼ãƒ‰ã«ã™ã‚‹ã“ã¨ã§å¾©æ—§
                blendType = ExpressionBlendType.Additive;
            }
            // è¨­å®šã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã‚’ä½œæˆã—ã¦ãƒªã‚¹ãƒˆã«è¿½åŠ ã™ã‚‹
            const item = new ExpressionParameter();
            item.parameterId = parameterId;
            item.blendType = blendType;
            item.value = value;
            this._parameters[dstIndex++] = item;
        }
        CubismJson.delete(json); // JSONãƒ‡ãƒ¼ã‚¿ã¯ä¸è¦ã«ãªã£ãŸã‚‰å‰Šé™¤ã™ã‚‹
    }
    /**
     * @brief ãƒ–ãƒ¬ãƒ³ãƒ‰è¨ˆç®—
     *
     * å…¥åŠ›ã•ã‚ŒãŸå€¤ã§ãƒ–ãƒ¬ãƒ³ãƒ‰è¨ˆç®—ã‚’ã™ã‚‹ã€‚
     *
     * @param source ç¾åœ¨ã®å€¤
     * @param destination é©ç”¨ã™ã‚‹å€¤
     * @param weight ã‚¦ã‚§ã‚¤ãƒˆ
     * @return è¨ˆç®—çµæžœ
     */
    calculateValue(source, destination, fadeWeight) {
        return source * (1.0 - fadeWeight) + destination * fadeWeight;
    }
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    constructor() {
        super();
        this._parameters = new Array();
    }
}
CubismExpressionMotion.DefaultAdditiveValue = 0.0; // åŠ ç®—é©ç”¨ã®åˆæœŸå€¤
CubismExpressionMotion.DefaultMultiplyValue = 1.0; // ä¹—ç®—é©ç”¨ã®åˆæœŸå€¤
/**
 * è¡¨æƒ…ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿å€¤ã®è¨ˆç®—æ–¹å¼
 */
export var ExpressionBlendType;
(function (ExpressionBlendType) {
    ExpressionBlendType[ExpressionBlendType["Additive"] = 0] = "Additive";
    ExpressionBlendType[ExpressionBlendType["Multiply"] = 1] = "Multiply";
    ExpressionBlendType[ExpressionBlendType["Overwrite"] = 2] = "Overwrite"; // ä¸Šæ›¸ã
})(ExpressionBlendType || (ExpressionBlendType = {}));
/**
 * è¡¨æƒ…ã®ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿æƒ…å ±
 */
export class ExpressionParameter {
}
// Namespace definition for compatibility.
import * as $ from './cubismexpressionmotion.js';
// eslint-disable-next-line @typescript-eslint/no-namespace
export var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    Live2DCubismFramework.CubismExpressionMotion = $.CubismExpressionMotion;
    Live2DCubismFramework.ExpressionBlendType = $.ExpressionBlendType;
    Live2DCubismFramework.ExpressionParameter = $.ExpressionParameter;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));
//# sourceMappingURL=cubismexpressionmotion.js.map