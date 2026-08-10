/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
import { CubismFramework } from '../live2dcubismframework.js';
import { CubismMath } from '../math/cubismmath.js';
import { CubismBlendMode, CubismTextureColor } from '../rendering/cubismrenderer.js';
import { CSM_ASSERT } from '../utils/cubismdebug.js';
import { CubismModelMultiplyAndScreenColor } from './cubismmodelmultiplyandscreencolor.js';
export const NoParentIndex = -1; // è¦ªãŒå–å¾—ã§ããªã„å ´åˆã®å€¤ã‚’è¡¨ã™å®šæ•°
export const NoOffscreenIndex = -1; // ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ãŒå–å¾—ã§ããªã„å ´åˆã®å€¤ã‚’è¡¨ã™å®šæ•°
/**
 * ã‚«ãƒ©ãƒ¼ãƒ–ãƒ¬ãƒ³ãƒ‰ã®ã‚¿ã‚¤ãƒ—
 */
export var CubismColorBlend;
(function (CubismColorBlend) {
    CubismColorBlend[CubismColorBlend["ColorBlend_None"] = -1] = "ColorBlend_None";
    CubismColorBlend[CubismColorBlend["ColorBlend_Normal"] = Live2DCubismCore.ColorBlendType_Normal] = "ColorBlend_Normal";
    CubismColorBlend[CubismColorBlend["ColorBlend_AddGlow"] = Live2DCubismCore.ColorBlendType_AddGlow] = "ColorBlend_AddGlow";
    CubismColorBlend[CubismColorBlend["ColorBlend_Add"] = Live2DCubismCore.ColorBlendType_Add] = "ColorBlend_Add";
    CubismColorBlend[CubismColorBlend["ColorBlend_Darken"] = Live2DCubismCore.ColorBlendType_Darken] = "ColorBlend_Darken";
    CubismColorBlend[CubismColorBlend["ColorBlend_Multiply"] = Live2DCubismCore.ColorBlendType_Multiply] = "ColorBlend_Multiply";
    CubismColorBlend[CubismColorBlend["ColorBlend_ColorBurn"] = Live2DCubismCore.ColorBlendType_ColorBurn] = "ColorBlend_ColorBurn";
    CubismColorBlend[CubismColorBlend["ColorBlend_LinearBurn"] = Live2DCubismCore.ColorBlendType_LinearBurn] = "ColorBlend_LinearBurn";
    CubismColorBlend[CubismColorBlend["ColorBlend_Lighten"] = Live2DCubismCore.ColorBlendType_Lighten] = "ColorBlend_Lighten";
    CubismColorBlend[CubismColorBlend["ColorBlend_Screen"] = Live2DCubismCore.ColorBlendType_Screen] = "ColorBlend_Screen";
    CubismColorBlend[CubismColorBlend["ColorBlend_ColorDodge"] = Live2DCubismCore.ColorBlendType_ColorDodge] = "ColorBlend_ColorDodge";
    CubismColorBlend[CubismColorBlend["ColorBlend_Overlay"] = Live2DCubismCore.ColorBlendType_Overlay] = "ColorBlend_Overlay";
    CubismColorBlend[CubismColorBlend["ColorBlend_SoftLight"] = Live2DCubismCore.ColorBlendType_SoftLight] = "ColorBlend_SoftLight";
    CubismColorBlend[CubismColorBlend["ColorBlend_HardLight"] = Live2DCubismCore.ColorBlendType_HardLight] = "ColorBlend_HardLight";
    CubismColorBlend[CubismColorBlend["ColorBlend_LinearLight"] = Live2DCubismCore.ColorBlendType_LinearLight] = "ColorBlend_LinearLight";
    CubismColorBlend[CubismColorBlend["ColorBlend_Hue"] = Live2DCubismCore.ColorBlendType_Hue] = "ColorBlend_Hue";
    CubismColorBlend[CubismColorBlend["ColorBlend_Color"] = Live2DCubismCore.ColorBlendType_Color] = "ColorBlend_Color";
    // Cubism 5.2ä»¥å‰
    CubismColorBlend[CubismColorBlend["ColorBlend_AddCompatible"] = Live2DCubismCore.ColorBlendType_AddCompatible] = "ColorBlend_AddCompatible";
    CubismColorBlend[CubismColorBlend["ColorBlend_MultiplyCompatible"] = Live2DCubismCore.ColorBlendType_MultiplyCompatible] = "ColorBlend_MultiplyCompatible";
})(CubismColorBlend || (CubismColorBlend = {}));
/**
 * ã‚¢ãƒ«ãƒ•ã‚¡ãƒ–ãƒ¬ãƒ³ãƒ‰ã®ã‚¿ã‚¤ãƒ—
 */
export var CubismAlphaBlend;
(function (CubismAlphaBlend) {
    CubismAlphaBlend[CubismAlphaBlend["AlphaBlend_None"] = -1] = "AlphaBlend_None";
    CubismAlphaBlend[CubismAlphaBlend["AlphaBlend_Over"] = 0] = "AlphaBlend_Over";
    CubismAlphaBlend[CubismAlphaBlend["AlphaBlend_Atop"] = 1] = "AlphaBlend_Atop";
    CubismAlphaBlend[CubismAlphaBlend["AlphaBlend_Out"] = 2] = "AlphaBlend_Out";
    CubismAlphaBlend[CubismAlphaBlend["AlphaBlend_ConjointOver"] = 3] = "AlphaBlend_ConjointOver";
    CubismAlphaBlend[CubismAlphaBlend["AlphaBlend_DisjointOver"] = 4] = "AlphaBlend_DisjointOver";
})(CubismAlphaBlend || (CubismAlphaBlend = {}));
/**
 * ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã®ã‚¿ã‚¤ãƒ—
 */
export var CubismModelObjectType;
(function (CubismModelObjectType) {
    CubismModelObjectType[CubismModelObjectType["CubismModelObjectType_Drawable"] = 0] = "CubismModelObjectType_Drawable";
    CubismModelObjectType[CubismModelObjectType["CubismModelObjectType_Parts"] = 1] = "CubismModelObjectType_Parts";
})(CubismModelObjectType || (CubismModelObjectType = {}));
/**
 * Structure for managing the override of parameter repetition settings
 */
export class ParameterRepeatData {
    /**
     * Constructor
     *
     * @param isOverridden whether to be overriden
     * @param isParameterRepeated override flag for settings
     */
    constructor(isOverridden = false, isParameterRepeated = false) {
        this.isOverridden = isOverridden;
        this.isParameterRepeated = isParameterRepeated;
    }
}
/**
 * (deprecated) ãƒ†ã‚¯ã‚¹ãƒãƒ£ã®ã‚«ãƒªãƒ³ã‚°è¨­å®šã‚’ç®¡ç†ã™ã‚‹ãŸã‚ã®æ§‹é€ ä½“
 */
export class DrawableCullingData {
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     *
     * @param isOverridden
     * @param isCulling
     */
    constructor(isOverridden = false, isCulling = false) {
        this.isOverridden = isOverridden;
        this.isCulling = isCulling;
    }
    get isOverwritten() {
        return this.isOverridden;
    }
}
/**
 * ãƒ†ã‚¯ã‚¹ãƒãƒ£ã®ã‚«ãƒªãƒ³ã‚°è¨­å®šã‚’ç®¡ç†ã™ã‚‹ãŸã‚ã®æ§‹é€ ä½“
 */
export class CullingData {
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     *
     * @param isOverridden
     * @param isCulling
     */
    constructor(isOverridden = false, isCulling = false) {
        this.isOverridden = isOverridden;
        this.isCulling = isCulling;
    }
}
/**
 * ãƒ‘ãƒ¼ãƒ„å­æç”»ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆæƒ…å ±æ§‹é€ ä½“
 */
export class PartChildDrawObjects {
    constructor(drawableIndices = new Array(), offscreenIndices = new Array()) {
        this.drawableIndices = drawableIndices;
        this.offscreenIndices = offscreenIndices;
    }
}
/**
 * ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆæƒ…å ±æ§‹é€ ä½“
 */
export class CubismModelObjectInfo {
    constructor(objectIndex, objectType) {
        this.objectIndex = objectIndex;
        this.objectType = objectType;
    }
}
/**
 * ãƒ‘ãƒ¼ãƒ„æƒ…å ±ç®¡ç†æ§‹é€ ä½“
 */
export class CubismModelPartInfo {
    constructor(objects = new Array(), childDrawObjects = new PartChildDrawObjects()) {
        this.objects = objects;
        this.childDrawObjects = childDrawObjects;
    }
    // å­ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆæ•°ã‚’è¿”ã™é–¢æ•°
    getChildObjectCount() {
        return this.objects.length;
    }
}
/**
 * ãƒ¢ãƒ‡ãƒ«
 *
 * Mocãƒ‡ãƒ¼ã‚¿ã‹ã‚‰ç”Ÿæˆã•ã‚Œã‚‹ãƒ¢ãƒ‡ãƒ«ã®ã‚¯ãƒ©ã‚¹ã€‚
 */
export class CubismModel {
    /**
     * ãƒ¢ãƒ‡ãƒ«ã®ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®æ›´æ–°
     */
    update() {
        // Update model
        this._model.update();
        this._model.drawables.resetDynamicFlags();
    }
    /**
     * PixelsPerUnitã‚’å–å¾—ã™ã‚‹
     * @return PixelsPerUnit
     */
    getPixelsPerUnit() {
        if (this._model == null) {
            return 0.0;
        }
        return this._model.canvasinfo.PixelsPerUnit;
    }
    /**
     * ã‚­ãƒ£ãƒ³ãƒã‚¹ã®å¹…ã‚’å–å¾—ã™ã‚‹
     */
    getCanvasWidth() {
        if (this._model == null) {
            return 0.0;
        }
        return (this._model.canvasinfo.CanvasWidth / this._model.canvasinfo.PixelsPerUnit);
    }
    /**
     * ã‚­ãƒ£ãƒ³ãƒã‚¹ã®é«˜ã•ã‚’å–å¾—ã™ã‚‹
     */
    getCanvasHeight() {
        if (this._model == null) {
            return 0.0;
        }
        return (this._model.canvasinfo.CanvasHeight / this._model.canvasinfo.PixelsPerUnit);
    }
    /**
     * ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã‚’ä¿å­˜ã™ã‚‹
     */
    saveParameters() {
        const parameterCount = this._model.parameters.count;
        const savedParameterCount = this._savedParameters.length;
        for (let i = 0; i < parameterCount; ++i) {
            if (i < savedParameterCount) {
                this._savedParameters[i] = this._parameterValues[i];
            }
            else {
                this._savedParameters.push(this._parameterValues[i]);
            }
        }
    }
    /**
     * ä¹—ç®—è‰²ãƒ»ã‚¹ã‚¯ãƒªãƒ¼ãƒ³è‰²ç®¡ç†ã‚¯ãƒ©ã‚¹ã‚’å–å¾—ã™ã‚‹
     *
     * @return CubismModelMultiplyAndScreenColorã®ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹
     */
    getOverrideMultiplyAndScreenColor() {
        return this._overrideMultiplyAndScreenColor;
    }
    /**
     * Checks whether parameter repetition is performed for the entire model.
     *
     * @return true if parameter repetition is performed for the entire model; otherwise returns false.
     */
    getOverrideFlagForModelParameterRepeat() {
        return this._isOverriddenParameterRepeat;
    }
    /**
     * Sets whether parameter repetition is performed for the entire model.
     * Use true to perform parameter repetition for the entire model, or false to not perform it.
     */
    setOverrideFlagForModelParameterRepeat(isRepeat) {
        this._isOverriddenParameterRepeat = isRepeat;
    }
    /**
     * Returns the flag indicating whether to override the parameter repeat.
     *
     * @param parameterIndex Parameter index
     *
     * @return true if the parameter repeat is overridden, false otherwise.
     */
    getOverrideFlagForParameterRepeat(parameterIndex) {
        return this._userParameterRepeatDataList[parameterIndex].isOverridden;
    }
    /**
     * Sets the flag indicating whether to override the parameter repeat.
     *
     * @param parameterIndex Parameter index
     * @param value true if it is to be overridden; otherwise, false.
     */
    setOverrideFlagForParameterRepeat(parameterIndex, value) {
        this._userParameterRepeatDataList[parameterIndex].isOverridden = value;
    }
    /**
     * Returns the repeat flag.
     *
     * @param parameterIndex Parameter index
     *
     * @return true if repeating, false otherwise.
     */
    getRepeatFlagForParameterRepeat(parameterIndex) {
        return this._userParameterRepeatDataList[parameterIndex]
            .isParameterRepeated;
    }
    /**
     * Sets the repeat flag.
     *
     * @param parameterIndex Parameter index
     * @param value true to enable repeating, false otherwise.
     */
    setRepeatFlagForParameterRepeat(parameterIndex, value) {
        this._userParameterRepeatDataList[parameterIndex].isParameterRepeated =
            value;
    }
    /**
     * Drawableã®ã‚«ãƒªãƒ³ã‚°æƒ…å ±ã‚’å–å¾—ã™ã‚‹ã€‚
     *
     * @param   drawableIndex   Drawableã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     *
     * @return  Drawableã®ã‚«ãƒªãƒ³ã‚°æƒ…å ±
     */
    getDrawableCulling(drawableIndex) {
        if (this.getOverrideFlagForModelCullings() ||
            this.getOverrideFlagForDrawableCullings(drawableIndex)) {
            return this._userDrawableCullings[drawableIndex].isCulling;
        }
        const constantFlags = this._model.drawables.constantFlags;
        return !Live2DCubismCore.Utils.hasIsDoubleSidedBit(constantFlags[drawableIndex]);
    }
    /**
     * Drawableã®ã‚«ãƒªãƒ³ã‚°æƒ…å ±ã‚’è¨­å®šã™ã‚‹ã€‚
     *
     * @param drawableIndex Drawableã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @param isCulling ã‚«ãƒªãƒ³ã‚°æƒ…å ±
     */
    setDrawableCulling(drawableIndex, isCulling) {
        this._userDrawableCullings[drawableIndex].isCulling = isCulling;
    }
    /**
     * Offscreenã®ã‚«ãƒªãƒ³ã‚°æƒ…å ±ã‚’å–å¾—ã™ã‚‹ã€‚
     *
     * @param   offscreenIndex   Offscreenã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     *
     * @return  Offscreenã®ã‚«ãƒªãƒ³ã‚°æƒ…å ±
     */
    getOffscreenCulling(offscreenIndex) {
        if (this.getOverrideFlagForModelCullings() ||
            this.getOverrideFlagForOffscreenCullings(offscreenIndex)) {
            return this._userOffscreenCullings[offscreenIndex].isCulling;
        }
        const constantFlags = this._model.offscreens.constantFlags;
        return !Live2DCubismCore.Utils.hasIsDoubleSidedBit(constantFlags[offscreenIndex]);
    }
    /**
     * Offscreenã®ã‚«ãƒªãƒ³ã‚°è¨­å®šã‚’è¨­å®šã™ã‚‹ã€‚
     *
     * @param offscreenIndex Offscreenã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @param isCulling ã‚«ãƒªãƒ³ã‚°æƒ…å ±
     */
    setOffscreenCulling(offscreenIndex, isCulling) {
        this._userOffscreenCullings[offscreenIndex].isCulling = isCulling;
    }
    /**
     * SDKã‹ã‚‰ãƒ¢ãƒ‡ãƒ«å…¨ä½“ã®ã‚«ãƒªãƒ³ã‚°è¨­å®šã‚’ä¸Šæ›¸ãã™ã‚‹ã‹ã€‚
     *
     * @return  true    ->  SDKä¸Šã®ã‚«ãƒªãƒ³ã‚°è¨­å®šã‚’ä½¿ç”¨
     *          false   ->  ãƒ¢ãƒ‡ãƒ«ã®ã‚«ãƒªãƒ³ã‚°è¨­å®šã‚’ä½¿ç”¨
     */
    getOverrideFlagForModelCullings() {
        return this._isOverriddenCullings;
    }
    /**
     * SDKã‹ã‚‰ãƒ¢ãƒ‡ãƒ«å…¨ä½“ã®ã‚«ãƒªãƒ³ã‚°è¨­å®šã‚’ä¸Šæ›¸ãã™ã‚‹ã‹ã‚’è¨­å®šã™ã‚‹ã€‚
     *
     * @param isOverriddenCullings SDKä¸Šã®ã‚«ãƒªãƒ³ã‚°è¨­å®šã‚’ä½¿ã†ãªã‚‰trueã€ãƒ¢ãƒ‡ãƒ«ã®ã‚«ãƒªãƒ³ã‚°è¨­å®šã‚’ä½¿ã†ãªã‚‰false
     */
    setOverrideFlagForModelCullings(isOverriddenCullings) {
        this._isOverriddenCullings = isOverriddenCullings;
    }
    /**
     *
     * @param drawableIndex Drawableã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return  true    ->  SDKä¸Šã®ã‚«ãƒªãƒ³ã‚°è¨­å®šã‚’ä½¿ç”¨
     *          false   ->  ãƒ¢ãƒ‡ãƒ«ã®ã‚«ãƒªãƒ³ã‚°è¨­å®šã‚’ä½¿ç”¨
     */
    getOverrideFlagForDrawableCullings(drawableIndex) {
        return this._userDrawableCullings[drawableIndex].isOverridden;
    }
    /**
     * @param offscreenIndex Offscreenã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return  true    ->  SDKä¸Šã®ã‚«ãƒªãƒ³ã‚°è¨­å®šã‚’ä½¿ç”¨
     *          false   ->  ãƒ¢ãƒ‡ãƒ«ã®ã‚«ãƒªãƒ³ã‚°è¨­å®šã‚’ä½¿ç”¨
     */
    getOverrideFlagForOffscreenCullings(offscreenIndex) {
        return this._userOffscreenCullings[offscreenIndex].isOverridden;
    }
    /**
     *
     * @param drawableIndex Drawableã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @param isOverriddenCullings SDKä¸Šã®ã‚«ãƒªãƒ³ã‚°è¨­å®šã‚’ä½¿ã†ãªã‚‰trueã€ãƒ¢ãƒ‡ãƒ«ã®ã‚«ãƒªãƒ³ã‚°è¨­å®šã‚’ä½¿ã†ãªã‚‰false
     */
    setOverrideFlagForDrawableCullings(drawableIndex, isOverriddenCullings) {
        this._userDrawableCullings[drawableIndex].isOverridden =
            isOverriddenCullings;
    }
    /**
     * ãƒ¢ãƒ‡ãƒ«ã®ä¸é€æ˜Žåº¦ã‚’å–å¾—ã™ã‚‹
     *
     * @return ä¸é€æ˜Žåº¦ã®å€¤
     */
    getModelOapcity() {
        return this._modelOpacity;
    }
    /**
     * ãƒ¢ãƒ‡ãƒ«ã®ä¸é€æ˜Žåº¦ã‚’è¨­å®šã™ã‚‹
     *
     * @param value ä¸é€æ˜Žåº¦ã®å€¤
     */
    setModelOapcity(value) {
        this._modelOpacity = value;
    }
    /**
     * ãƒ¢ãƒ‡ãƒ«ã‚’å–å¾—
     */
    getModel() {
        return this._model;
    }
    /**
     * ãƒ‘ãƒ¼ãƒ„ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ã‚’å–å¾—
     * @param partId ãƒ‘ãƒ¼ãƒ„ã®ID
     * @return ãƒ‘ãƒ¼ãƒ„ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     */
    getPartIndex(partId) {
        let partIndex;
        const partCount = this._model.parts.count;
        for (partIndex = 0; partIndex < partCount; ++partIndex) {
            if (partId == this._partIds[partIndex]) {
                return partIndex;
            }
        }
        // ãƒ¢ãƒ‡ãƒ«ã«å­˜åœ¨ã—ã¦ã„ãªã„å ´åˆã€éžå­˜åœ¨ãƒ‘ãƒ¼ãƒ„IDãƒªã‚¹ãƒˆå†…ã«ã‚ã‚‹ã‹ã‚’æ¤œç´¢ã—ã€ãã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ã‚’è¿”ã™
        if (this._notExistPartId.has(partId)) {
            return this._notExistPartId.get(partId);
        }
        // éžå­˜åœ¨ãƒ‘ãƒ¼ãƒ„IDãƒªã‚¹ãƒˆã«ãªã„å ´åˆã€æ–°ã—ãè¦ç´ ã‚’è¿½åŠ ã™ã‚‹
        partIndex = partCount + this._notExistPartId.size;
        this._notExistPartId.set(partId, partIndex);
        this._notExistPartOpacities.set(partIndex, null);
        return partIndex;
    }
    /**
     * ãƒ‘ãƒ¼ãƒ„ã®IDã‚’å–å¾—ã™ã‚‹ã€‚
     *
     * @param partIndex å–å¾—ã™ã‚‹ãƒ‘ãƒ¼ãƒ„ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return ãƒ‘ãƒ¼ãƒ„ã®ID
     */
    getPartId(partIndex) {
        const partId = this._model.parts.ids[partIndex];
        return CubismFramework.getIdManager().getId(partId);
    }
    /**
     * ãƒ‘ãƒ¼ãƒ„ã®å€‹æ•°ã®å–å¾—
     * @return ãƒ‘ãƒ¼ãƒ„ã®å€‹æ•°
     */
    getPartCount() {
        const partCount = this._model.parts.count;
        return partCount;
    }
    /**
     * ãƒ‘ãƒ¼ãƒ„ã®ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ã®å–å¾—
     * @param partIndex ãƒ‘ãƒ¼ãƒ„ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ã®ãƒªã‚¹ãƒˆ
     */
    getPartOffscreenIndices() {
        const offscreenIndices = this._model.parts.offscreenIndices;
        return offscreenIndices;
    }
    /**
     * ãƒ‘ãƒ¼ãƒ„ã®è¦ªãƒ‘ãƒ¼ãƒ„ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ã®ãƒªã‚¹ãƒˆã‚’å–å¾—
     *
     * @return ãƒ‘ãƒ¼ãƒ„ã®è¦ªãƒ‘ãƒ¼ãƒ„ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ã®ãƒªã‚¹ãƒˆ
     */
    getPartParentPartIndices() {
        const parentIndices = this._model.parts.parentIndices;
        return parentIndices;
    }
    /**
     * ãƒ‘ãƒ¼ãƒ„ã®ä¸é€æ˜Žåº¦ã®è¨­å®š(Index)
     * @param partIndex ãƒ‘ãƒ¼ãƒ„ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @param opacity ä¸é€æ˜Žåº¦
     */
    setPartOpacityByIndex(partIndex, opacity) {
        if (this._notExistPartOpacities.has(partIndex)) {
            this._notExistPartOpacities.set(partIndex, opacity);
            return;
        }
        // ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ã®ç¯„å›²å†…æ¤œçŸ¥
        CSM_ASSERT(0 <= partIndex && partIndex < this.getPartCount());
        this._partOpacities[partIndex] = opacity;
    }
    /**
     * ãƒ‘ãƒ¼ãƒ„ã®ä¸é€æ˜Žåº¦ã®è¨­å®š(Id)
     * @param partId ãƒ‘ãƒ¼ãƒ„ã®ID
     * @param opacity ãƒ‘ãƒ¼ãƒ„ã®ä¸é€æ˜Žåº¦
     */
    setPartOpacityById(partId, opacity) {
        // é«˜é€ŸåŒ–ã®ãŸã‚ã«PartIndexã‚’å–å¾—ã§ãã‚‹æ©Ÿæ§‹ã«ãªã£ã¦ã„ã‚‹ãŒã€å¤–éƒ¨ã‹ã‚‰ã®è¨­å®šã®æ™‚ã¯å‘¼ã³å‡ºã—é »åº¦ãŒä½Žã„ãŸã‚ä¸è¦
        const index = this.getPartIndex(partId);
        if (index < 0) {
            return; // ãƒ‘ãƒ¼ãƒ„ãŒãªã„ã®ã§ã‚¹ã‚­ãƒƒãƒ—
        }
        this.setPartOpacityByIndex(index, opacity);
    }
    /**
     * ãƒ‘ãƒ¼ãƒ„ã®ä¸é€æ˜Žåº¦ã®å–å¾—(index)
     * @param partIndex ãƒ‘ãƒ¼ãƒ„ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return ãƒ‘ãƒ¼ãƒ„ã®ä¸é€æ˜Žåº¦
     */
    getPartOpacityByIndex(partIndex) {
        if (this._notExistPartOpacities.has(partIndex)) {
            // ãƒ¢ãƒ‡ãƒ«ã«å­˜åœ¨ã—ãªã„ãƒ‘ãƒ¼ãƒ„IDã®å ´åˆã€éžå­˜åœ¨ãƒ‘ãƒ¼ãƒ„ãƒªã‚¹ãƒˆã‹ã‚‰ä¸é€æ˜Žåº¦ã‚’è¿”ã™ã€‚
            return this._notExistPartOpacities.get(partIndex);
        }
        // ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ã®ç¯„å›²å†…æ¤œçŸ¥
        CSM_ASSERT(0 <= partIndex && partIndex < this.getPartCount());
        return this._partOpacities[partIndex];
    }
    /**
     * ãƒ‘ãƒ¼ãƒ„ã®ä¸é€æ˜Žåº¦ã®å–å¾—(id)
     * @param partId ãƒ‘ãƒ¼ãƒ„ã®ï¼©ï½„
     * @return ãƒ‘ãƒ¼ãƒ„ã®ä¸é€æ˜Žåº¦
     */
    getPartOpacityById(partId) {
        // é«˜é€ŸåŒ–ã®ãŸã‚ã«PartIndexã‚’å–å¾—ã§ãã‚‹æ©Ÿæ§‹ã«ãªã£ã¦ã„ã‚‹ãŒã€å¤–éƒ¨ã‹ã‚‰ã®è¨­å®šã®æ™‚ã¯å‘¼ã³å‡ºã—é »åº¦ãŒä½Žã„ãŸã‚ä¸è¦
        const index = this.getPartIndex(partId);
        if (index < 0) {
            return 0; // ãƒ‘ãƒ¼ãƒ„ãŒç„¡ã„ã®ã§ã‚¹ã‚­ãƒƒãƒ—
        }
        return this.getPartOpacityByIndex(index);
    }
    /**
     * ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ã®å–å¾—
     * @param ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ID
     * @return ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     */
    getParameterIndex(parameterId) {
        let parameterIndex;
        const idCount = this._model.parameters.count;
        for (parameterIndex = 0; parameterIndex < idCount; ++parameterIndex) {
            if (parameterId != this._parameterIds[parameterIndex]) {
                continue;
            }
            return parameterIndex;
        }
        // ãƒ¢ãƒ‡ãƒ«ã«å­˜åœ¨ã—ã¦ã„ãªã„å ´åˆã€éžå­˜åœ¨ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿IDãƒªã‚¹ãƒˆå†…ã‚’æ¤œç´¢ã—ã€ãã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ã‚’è¿”ã™
        if (this._notExistParameterId.has(parameterId)) {
            return this._notExistParameterId.get(parameterId);
        }
        // éžå­˜åœ¨ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿IDãƒªã‚¹ãƒˆã«ãªã„å ´åˆæ–°ã—ãè¦ç´ ã‚’è¿½åŠ ã™ã‚‹
        parameterIndex =
            this._model.parameters.count + this._notExistParameterId.size;
        this._notExistParameterId.set(parameterId, parameterIndex);
        this._notExistParameterValues.set(parameterIndex, null);
        return parameterIndex;
    }
    /**
     * ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®å€‹æ•°ã®å–å¾—
     * @return ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®å€‹æ•°
     */
    getParameterCount() {
        return this._model.parameters.count;
    }
    /**
     * ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®ç¨®é¡žã®å–å¾—
     * @param parameterIndex ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return csmParameterType_Normal -> é€šå¸¸ã®ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿
     *          csmParameterType_BlendShape -> ãƒ–ãƒ¬ãƒ³ãƒ‰ã‚·ã‚§ã‚¤ãƒ—ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿
     */
    getParameterType(parameterIndex) {
        return this._model.parameters.types[parameterIndex];
    }
    /**
     * ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®æœ€å¤§å€¤ã®å–å¾—
     * @param parameterIndex ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®æœ€å¤§å€¤
     */
    getParameterMaximumValue(parameterIndex) {
        return this._model.parameters.maximumValues[parameterIndex];
    }
    /**
     * ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®æœ€å°å€¤ã®å–å¾—
     * @param parameterIndex ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®æœ€å°å€¤
     */
    getParameterMinimumValue(parameterIndex) {
        return this._model.parameters.minimumValues[parameterIndex];
    }
    /**
     * ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®ãƒ‡ãƒ•ã‚©ãƒ«ãƒˆå€¤ã®å–å¾—
     * @param parameterIndex ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®ãƒ‡ãƒ•ã‚©ãƒ«ãƒˆå€¤
     */
    getParameterDefaultValue(parameterIndex) {
        return this._model.parameters.defaultValues[parameterIndex];
    }
    /**
     * æŒ‡å®šã—ãŸãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿indexã®IDã‚’å–å¾—
     *
     * @param parameterIndex ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ID
     */
    getParameterId(parameterIndex) {
        return CubismFramework.getIdManager().getId(this._model.parameters.ids[parameterIndex]);
    }
    /**
     * ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®å€¤ã®å–å¾—
     * @param parameterIndex    ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®å€¤
     */
    getParameterValueByIndex(parameterIndex) {
        if (this._notExistParameterValues.has(parameterIndex)) {
            return this._notExistParameterValues.get(parameterIndex);
        }
        // ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ã®ç¯„å›²å†…æ¤œçŸ¥
        CSM_ASSERT(0 <= parameterIndex && parameterIndex < this.getParameterCount());
        return this._parameterValues[parameterIndex];
    }
    /**
     * ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®å€¤ã®å–å¾—
     * @param parameterId    ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®ID
     * @return ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®å€¤
     */
    getParameterValueById(parameterId) {
        // é«˜é€ŸåŒ–ã®ãŸã‚ã«parameterIndexã‚’å–å¾—ã§ãã‚‹æ©Ÿæ§‹ã«ãªã£ã¦ã„ã‚‹ãŒã€å¤–éƒ¨ã‹ã‚‰ã®è¨­å®šã®æ™‚ã¯å‘¼ã³å‡ºã—é »åº¦ãŒä½Žã„ãŸã‚ä¸è¦
        const parameterIndex = this.getParameterIndex(parameterId);
        return this.getParameterValueByIndex(parameterIndex);
    }
    /**
     * ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®å€¤ã®è¨­å®š
     * @param parameterIndex ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @param value ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®å€¤
     * @param weight é‡ã¿
     */
    setParameterValueByIndex(parameterIndex, value, weight = 1.0) {
        if (this._notExistParameterValues.has(parameterIndex)) {
            this._notExistParameterValues.set(parameterIndex, weight == 1
                ? value
                : this._notExistParameterValues.get(parameterIndex) * (1 - weight) +
                    value * weight);
            return;
        }
        // ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ã®ç¯„å›²å†…æ¤œçŸ¥
        CSM_ASSERT(0 <= parameterIndex && parameterIndex < this.getParameterCount());
        if (this.isRepeat(parameterIndex)) {
            value = this.getParameterRepeatValue(parameterIndex, value);
        }
        else {
            value = this.getParameterClampValue(parameterIndex, value);
        }
        this._parameterValues[parameterIndex] =
            weight == 1
                ? value
                : (this._parameterValues[parameterIndex] =
                    this._parameterValues[parameterIndex] * (1 - weight) +
                        value * weight);
    }
    /**
     * ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®å€¤ã®è¨­å®š
     * @param parameterId ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®ID
     * @param value ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®å€¤
     * @param weight é‡ã¿
     */
    setParameterValueById(parameterId, value, weight = 1.0) {
        const index = this.getParameterIndex(parameterId);
        this.setParameterValueByIndex(index, value, weight);
    }
    /**
     * ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®å€¤ã®åŠ ç®—(index)
     * @param parameterIndex ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @param value åŠ ç®—ã™ã‚‹å€¤
     * @param weight é‡ã¿
     */
    addParameterValueByIndex(parameterIndex, value, weight = 1.0) {
        this.setParameterValueByIndex(parameterIndex, this.getParameterValueByIndex(parameterIndex) + value * weight);
    }
    /**
     * ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®å€¤ã®åŠ ç®—(id)
     * @param parameterId ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ï¼©ï¼¤
     * @param value åŠ ç®—ã™ã‚‹å€¤
     * @param weight é‡ã¿
     */
    addParameterValueById(parameterId, value, weight = 1.0) {
        const index = this.getParameterIndex(parameterId);
        this.addParameterValueByIndex(index, value, weight);
    }
    /**
     * Gets whether the parameter has the repeat setting.
     *
     * @param parameterIndex Parameter index
     *
     * @return true if it is set, otherwise returns false.
     */
    isRepeat(parameterIndex) {
        if (this._notExistParameterValues.has(parameterIndex)) {
            return false;
        }
        // In-index range detection
        CSM_ASSERT(0 <= parameterIndex && parameterIndex < this.getParameterCount());
        let isRepeat;
        // Determines whether to perform parameter repeat processing
        if (this._isOverriddenParameterRepeat ||
            this._userParameterRepeatDataList[parameterIndex].isOverridden) {
            // Use repeat information set on the SDK side
            isRepeat =
                this._userParameterRepeatDataList[parameterIndex].isParameterRepeated;
        }
        else {
            // Use repeat information set in Editor
            isRepeat = this._model.parameters.repeats[parameterIndex] != 0;
        }
        return isRepeat;
    }
    /**
     * Returns the calculated result ensuring the value falls within the parameter's range.
     *
     * @param parameterIndex Parameter index
     * @param value Parameter value
     *
     * @return a value that falls within the parameterâ€™s range. If the parameter does not exist, returns it as is.
     */
    getParameterRepeatValue(parameterIndex, value) {
        if (this._notExistParameterValues.has(parameterIndex)) {
            return value;
        }
        // In-index range detection
        CSM_ASSERT(0 <= parameterIndex && parameterIndex < this.getParameterCount());
        const maxValue = this._model.parameters.maximumValues[parameterIndex];
        const minValue = this._model.parameters.minimumValues[parameterIndex];
        const valueSize = maxValue - minValue;
        if (maxValue < value) {
            const overValue = CubismMath.mod(value - maxValue, valueSize);
            if (!Number.isNaN(overValue)) {
                value = minValue + overValue;
            }
            else {
                value = maxValue;
            }
        }
        if (value < minValue) {
            const overValue = CubismMath.mod(minValue - value, valueSize);
            if (!Number.isNaN(overValue)) {
                value = maxValue - overValue;
            }
            else {
                value = minValue;
            }
        }
        return value;
    }
    /**
     * Returns the result of clamping the value to ensure it falls within the parameter's range.
     *
     * @param parameterIndex Parameter index
     * @param value Parameter value
     *
     * @return the clamped value. If the parameter does not exist, returns it as is.
     */
    getParameterClampValue(parameterIndex, value) {
        if (this._notExistParameterValues.has(parameterIndex)) {
            return value;
        }
        // In-index range detection
        CSM_ASSERT(0 <= parameterIndex && parameterIndex < this.getParameterCount());
        const maxValue = this._model.parameters.maximumValues[parameterIndex];
        const minValue = this._model.parameters.minimumValues[parameterIndex];
        return CubismMath.clamp(value, minValue, maxValue);
    }
    /**
     * Returns the repeat of the parameter.
     *
     * @param parameterIndex Parameter index
     *
     * @return the raw data parameter repeat from the Cubism Core.
     */
    getParameterRepeats(parameterIndex) {
        return this._model.parameters.repeats[parameterIndex] != 0;
    }
    /**
     * ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®å€¤ã®ä¹—ç®—
     * @param parameterId ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®ID
     * @param value ä¹—ç®—ã™ã‚‹å€¤
     * @param weight é‡ã¿
     */
    multiplyParameterValueById(parameterId, value, weight = 1.0) {
        const index = this.getParameterIndex(parameterId);
        this.multiplyParameterValueByIndex(index, value, weight);
    }
    /**
     * ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®å€¤ã®ä¹—ç®—
     * @param parameterIndex ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @param value ä¹—ç®—ã™ã‚‹å€¤
     * @param weight é‡ã¿
     */
    multiplyParameterValueByIndex(parameterIndex, value, weight = 1.0) {
        this.setParameterValueByIndex(parameterIndex, this.getParameterValueByIndex(parameterIndex) *
            (1.0 + (value - 1.0) * weight));
    }
    /**
     * Drawableã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ã®å–å¾—
     * @param drawableId Drawableã®ID
     * @return Drawableã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     */
    getDrawableIndex(drawableId) {
        const drawableCount = this._model.drawables.count;
        for (let drawableIndex = 0; drawableIndex < drawableCount; ++drawableIndex) {
            if (this._drawableIds[drawableIndex] == drawableId) {
                return drawableIndex;
            }
        }
        return -1;
    }
    /**
     * Drawableã®å€‹æ•°ã®å–å¾—
     * @return drawableã®å€‹æ•°
     */
    getDrawableCount() {
        const drawableCount = this._model.drawables.count;
        return drawableCount;
    }
    /**
     * Drawableã®IDã‚’å–å¾—ã™ã‚‹
     * @param drawableIndex Drawableã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return drawableã®ID
     */
    getDrawableId(drawableIndex) {
        const parameterIds = this._model.drawables.ids;
        return CubismFramework.getIdManager().getId(parameterIds[drawableIndex]);
    }
    /**
     * Drawableã®æç”»é †ãƒªã‚¹ãƒˆã®å–å¾—
     * @return Drawableã®æç”»é †ãƒªã‚¹ãƒˆ
     */
    getRenderOrders() {
        const renderOrders = this._model.getRenderOrders();
        return renderOrders;
    }
    /**
     * Drawableã®ãƒ†ã‚¯ã‚¹ãƒãƒ£ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ã®å–å¾—
     * @param drawableIndex Drawableã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return drawableã®ãƒ†ã‚¯ã‚¹ãƒãƒ£ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     */
    getDrawableTextureIndex(drawableIndex) {
        const textureIndices = this._model.drawables.textureIndices;
        return textureIndices[drawableIndex];
    }
    /**
     * Drawableã®VertexPositionsã®å¤‰åŒ–æƒ…å ±ã®å–å¾—
     *
     * ç›´è¿‘ã®CubismModel.updateé–¢æ•°ã§Drawableã®é ‚ç‚¹æƒ…å ±ãŒå¤‰åŒ–ã—ãŸã‹ã‚’å–å¾—ã™ã‚‹ã€‚
     *
     * @param   drawableIndex   Drawableã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return  true    Drawableã®é ‚ç‚¹æƒ…å ±ãŒç›´è¿‘ã®CubismModel.updateé–¢æ•°ã§å¤‰åŒ–ã—ãŸ
     *          false   Drawableã®é ‚ç‚¹æƒ…å ±ãŒç›´è¿‘ã®CubismModel.updateé–¢æ•°ã§å¤‰åŒ–ã—ã¦ã„ãªã„
     */
    getDrawableDynamicFlagVertexPositionsDidChange(drawableIndex) {
        const dynamicFlags = this._model.drawables.dynamicFlags;
        return Live2DCubismCore.Utils.hasVertexPositionsDidChangeBit(dynamicFlags[drawableIndex]);
    }
    /**
     * Drawableã®é ‚ç‚¹ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ã®å€‹æ•°ã®å–å¾—
     * @param drawableIndex Drawableã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return drawableã®é ‚ç‚¹ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ã®å€‹æ•°
     */
    getDrawableVertexIndexCount(drawableIndex) {
        const indexCounts = this._model.drawables.indexCounts;
        return indexCounts[drawableIndex];
    }
    /**
     * Drawableã®é ‚ç‚¹ã®å€‹æ•°ã®å–å¾—
     * @param drawableIndex Drawableã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return drawableã®é ‚ç‚¹ã®å€‹æ•°
     */
    getDrawableVertexCount(drawableIndex) {
        const vertexCounts = this._model.drawables.vertexCounts;
        return vertexCounts[drawableIndex];
    }
    /**
     * Drawableã®é ‚ç‚¹ãƒªã‚¹ãƒˆã®å–å¾—
     * @param drawableIndex drawableã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return drawableã®é ‚ç‚¹ãƒªã‚¹ãƒˆ
     */
    getDrawableVertices(drawableIndex) {
        return this.getDrawableVertexPositions(drawableIndex);
    }
    /**
     * Drawableã®é ‚ç‚¹ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ãƒªã‚¹ãƒˆã®å–å¾—
     * @param drawableIndex Drawableã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return drawableã®é ‚ç‚¹ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ãƒªã‚¹ãƒˆ
     */
    getDrawableVertexIndices(drawableIndex) {
        const indicesArray = this._model.drawables.indices;
        return indicesArray[drawableIndex];
    }
    /**
     * Drawableã®é ‚ç‚¹ãƒªã‚¹ãƒˆã®å–å¾—
     * @param drawableIndex Drawableã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return drawableã®é ‚ç‚¹ãƒªã‚¹ãƒˆ
     */
    getDrawableVertexPositions(drawableIndex) {
        const verticesArray = this._model.drawables.vertexPositions;
        return verticesArray[drawableIndex];
    }
    /**
     * Drawableã®é ‚ç‚¹ã®UVãƒªã‚¹ãƒˆã®å–å¾—
     * @param drawableIndex Drawableã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return drawableã®é ‚ç‚¹UVãƒªã‚¹ãƒˆ
     */
    getDrawableVertexUvs(drawableIndex) {
        const uvsArray = this._model.drawables.vertexUvs;
        return uvsArray[drawableIndex];
    }
    /**
     * Drawableã®ä¸é€æ˜Žåº¦ã®å–å¾—
     * @param drawableIndex Drawableã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return drawableã®ä¸é€æ˜Žåº¦
     */
    getDrawableOpacity(drawableIndex) {
        const opacities = this._model.drawables.opacities;
        return opacities[drawableIndex];
    }
    /**
     * Drawableã®ä¹—ç®—è‰²ã®å–å¾—
     * @param drawableIndex Drawableã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return drawableã®ä¹—ç®—è‰²(RGBA)
     * ã‚¹ã‚¯ãƒªãƒ¼ãƒ³è‰²ã¯RGBAã§å–å¾—ã•ã‚Œã‚‹ãŒã€Aã¯å¿…ãš0
     */
    getDrawableMultiplyColor(drawableIndex) {
        if (this._drawableMultiplyColors == null) {
            this._drawableMultiplyColors = new Array(this._model.drawables.count);
            this._drawableMultiplyColors.fill(new CubismTextureColor());
        }
        const multiplyColors = this._model.drawables.multiplyColors;
        const index = drawableIndex * 4;
        this._drawableMultiplyColors[drawableIndex].r = multiplyColors[index];
        this._drawableMultiplyColors[drawableIndex].g = multiplyColors[index + 1];
        this._drawableMultiplyColors[drawableIndex].b = multiplyColors[index + 2];
        this._drawableMultiplyColors[drawableIndex].a = multiplyColors[index + 3];
        return this._drawableMultiplyColors[drawableIndex];
    }
    /**
     * Drawableã®ã‚¹ã‚¯ãƒªãƒ¼ãƒ³è‰²ã®å–å¾—
     * @param drawableIndex Drawableã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return drawableã®ã‚¹ã‚¯ãƒªãƒ¼ãƒ³è‰²(RGBA)
     * ã‚¹ã‚¯ãƒªãƒ¼ãƒ³è‰²ã¯RGBAã§å–å¾—ã•ã‚Œã‚‹ãŒã€Aã¯å¿…ãš0
     */
    getDrawableScreenColor(drawableIndex) {
        if (this._drawableScreenColors == null) {
            this._drawableScreenColors = new Array(this._model.drawables.count);
            this._drawableScreenColors.fill(new CubismTextureColor());
        }
        const screenColors = this._model.drawables.screenColors;
        const index = drawableIndex * 4;
        this._drawableScreenColors[drawableIndex].r = screenColors[index];
        this._drawableScreenColors[drawableIndex].g = screenColors[index + 1];
        this._drawableScreenColors[drawableIndex].b = screenColors[index + 2];
        this._drawableScreenColors[drawableIndex].a = screenColors[index + 3];
        return this._drawableScreenColors[drawableIndex];
    }
    /**
     * Offscreenã®ä¹—ç®—è‰²ã®å–å¾—
     * @param offscreenIndex Offscreenã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return Offscreenã®ä¹—ç®—è‰²(RGBA)
     * ã‚¹ã‚¯ãƒªãƒ¼ãƒ³è‰²ã¯RGBAã§å–å¾—ã•ã‚Œã‚‹ãŒã€Aã¯å¿…ãš0
     */
    getOffscreenMultiplyColor(offscreenIndex) {
        if (this._offscreenMultiplyColors == null) {
            this._offscreenMultiplyColors = new Array(this._model.offscreens.count);
            this._offscreenMultiplyColors.fill(new CubismTextureColor());
        }
        const multiplyColors = this._model.offscreens.multiplyColors;
        const index = offscreenIndex * 4;
        this._offscreenMultiplyColors[offscreenIndex].r = multiplyColors[index];
        this._offscreenMultiplyColors[offscreenIndex].g = multiplyColors[index + 1];
        this._offscreenMultiplyColors[offscreenIndex].b = multiplyColors[index + 2];
        this._offscreenMultiplyColors[offscreenIndex].a = multiplyColors[index + 3];
        return this._offscreenMultiplyColors[offscreenIndex];
    }
    /**
     * Offscreenã®ã‚¹ã‚¯ãƒªãƒ¼ãƒ³è‰²ã®å–å¾—
     * @param offscreenIndex Offscreenã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return Offscreenã®ã‚¹ã‚¯ãƒªãƒ¼ãƒ³è‰²(RGBA)
     * ã‚¹ã‚¯ãƒªãƒ¼ãƒ³è‰²ã¯RGBAã§å–å¾—ã•ã‚Œã‚‹ãŒã€Aã¯å¿…ãš0
     */
    getOffscreenScreenColor(offscreenIndex) {
        if (this._offscreenScreenColors == null) {
            this._offscreenScreenColors = new Array(this._model.offscreens.count);
            this._offscreenScreenColors.fill(new CubismTextureColor());
        }
        const screenColors = this._model.offscreens.screenColors;
        const index = offscreenIndex * 4;
        this._offscreenScreenColors[offscreenIndex].r = screenColors[index];
        this._offscreenScreenColors[offscreenIndex].g = screenColors[index + 1];
        this._offscreenScreenColors[offscreenIndex].b = screenColors[index + 2];
        this._offscreenScreenColors[offscreenIndex].a = screenColors[index + 3];
        return this._offscreenScreenColors[offscreenIndex];
    }
    /**
     * Drawableã®è¦ªãƒ‘ãƒ¼ãƒ„ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ã®å–å¾—
     * @param drawableIndex Drawableã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return drawableã®è¦ªãƒ‘ãƒ¼ãƒ„ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     */
    getDrawableParentPartIndex(drawableIndex) {
        return this._model.drawables.parentPartIndices[drawableIndex];
    }
    /**
     * Drawableã®ãƒ–ãƒ¬ãƒ³ãƒ‰ãƒ¢ãƒ¼ãƒ‰ã‚’å–å¾—
     * @param drawableIndex Drawableã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return drawableã®ãƒ–ãƒ¬ãƒ³ãƒ‰ãƒ¢ãƒ¼ãƒ‰
     */
    getDrawableBlendMode(drawableIndex) {
        const constantFlags = this._model.drawables.constantFlags;
        return Live2DCubismCore.Utils.hasBlendAdditiveBit(constantFlags[drawableIndex])
            ? CubismBlendMode.CubismBlendMode_Additive
            : Live2DCubismCore.Utils.hasBlendMultiplicativeBit(constantFlags[drawableIndex])
                ? CubismBlendMode.CubismBlendMode_Multiplicative
                : CubismBlendMode.CubismBlendMode_Normal;
    }
    /**
     * Drawableã®ã‚«ãƒ©ãƒ¼ãƒ–ãƒ¬ãƒ³ãƒ‰ã®å–å¾—(Cubism 5.3 ä»¥é™)
     *
     * @param drawableIndex Drawableã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return Drawableã®ã‚«ãƒ©ãƒ¼ãƒ–ãƒ¬ãƒ³ãƒ‰
     */
    getDrawableColorBlend(drawableIndex) {
        // ã‚­ãƒ£ãƒƒã‚·ãƒ¥
        if (this._drawableColorBlends[drawableIndex] ==
            CubismColorBlend.ColorBlend_None) {
            this._drawableColorBlends[drawableIndex] =
                this._model.drawables.blendModes[drawableIndex] & 0xff;
        }
        return this._drawableColorBlends[drawableIndex];
    }
    /**
     * Drawableã®ã‚¢ãƒ«ãƒ•ã‚¡ãƒ–ãƒ¬ãƒ³ãƒ‰ã®å–å¾—(Cubism 5.3 ä»¥é™)
     *
     * @param drawableIndex Drawableã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return Drawableã®ã‚¢ãƒ«ãƒ•ã‚¡ãƒ–ãƒ¬ãƒ³ãƒ‰
     */
    getDrawableAlphaBlend(drawableIndex) {
        // ã‚­ãƒ£ãƒƒã‚·ãƒ¥
        if (this._drawableAlphaBlends[drawableIndex] ==
            CubismAlphaBlend.AlphaBlend_None) {
            this._drawableAlphaBlends[drawableIndex] =
                (this._model.drawables.blendModes[drawableIndex] >> 8) & 0xff;
        }
        return this._drawableAlphaBlends[drawableIndex];
    }
    /**
     * Drawableã®ãƒžã‚¹ã‚¯ã®åè»¢ä½¿ç”¨ã®å–å¾—
     *
     * Drawableã®ãƒžã‚¹ã‚¯ä½¿ç”¨æ™‚ã®åè»¢è¨­å®šã‚’å–å¾—ã™ã‚‹ã€‚
     * ãƒžã‚¹ã‚¯ã‚’ä½¿ç”¨ã—ãªã„å ´åˆã¯ç„¡è¦–ã•ã‚Œã‚‹ã€‚
     *
     * @param drawableIndex Drawableã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return Drawableã®åè»¢è¨­å®š
     */
    getDrawableInvertedMaskBit(drawableIndex) {
        const constantFlags = this._model.drawables.constantFlags;
        return Live2DCubismCore.Utils.hasIsInvertedMaskBit(constantFlags[drawableIndex]);
    }
    /**
     * Drawableã®ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ãƒªã‚¹ãƒˆã®å–å¾—
     * @return Drawableã®ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ãƒªã‚¹ãƒˆ
     */
    getDrawableMasks() {
        const masks = this._model.drawables.masks;
        return masks;
    }
    /**
     * Drawableã®ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ã®å€‹æ•°ãƒªã‚¹ãƒˆã®å–å¾—
     * @return Drawableã®ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ã®å€‹æ•°ãƒªã‚¹ãƒˆ
     */
    getDrawableMaskCounts() {
        const maskCounts = this._model.drawables.maskCounts;
        return maskCounts;
    }
    /**
     * ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ã®ä½¿ç”¨çŠ¶æ…‹
     *
     * @return true ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ã‚’ä½¿ç”¨ã—ã¦ã„ã‚‹
     * @return false ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ã‚’ä½¿ç”¨ã—ã¦ã„ãªã„
     */
    isUsingMasking() {
        for (let d = 0; d < this._model.drawables.count; ++d) {
            if (this._model.drawables.maskCounts[d] <= 0) {
                continue;
            }
            return true;
        }
        return false;
    }
    /**
     * Offscreenã§ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ã‚’ä½¿ç”¨ã—ã¦ã„ã‚‹ã‹ã©ã†ã‹ã‚’å–å¾—
     *
     * @return true ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ã‚’ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã§ä½¿ç”¨ã—ã¦ã„ã‚‹
     */
    isUsingMaskingForOffscreen() {
        for (let d = 0; d < this.getOffscreenCount(); ++d) {
            if (this._model.offscreens.maskCounts[d] <= 0) {
                continue;
            }
            return true;
        }
        return false;
    }
    /**
     * Drawableã®è¡¨ç¤ºæƒ…å ±ã‚’å–å¾—ã™ã‚‹
     *
     * @param drawableIndex Drawableã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return true DrawableãŒè¡¨ç¤º
     * @return false DrawableãŒéžè¡¨ç¤º
     */
    getDrawableDynamicFlagIsVisible(drawableIndex) {
        const dynamicFlags = this._model.drawables.dynamicFlags;
        return Live2DCubismCore.Utils.hasIsVisibleBit(dynamicFlags[drawableIndex]);
    }
    /**
     * Drawableã®DrawOrderã®å¤‰åŒ–æƒ…å ±ã®å–å¾—
     *
     * ç›´è¿‘ã®CubismModel.updateé–¢æ•°ã§drawableã®drawOrderãŒå¤‰åŒ–ã—ãŸã‹ã‚’å–å¾—ã™ã‚‹ã€‚
     * drawOrderã¯artMeshä¸Šã§æŒ‡å®šã™ã‚‹0ã‹ã‚‰1000ã®æƒ…å ±
     * @param drawableIndex drawableã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return true drawableã®ä¸é€æ˜Žåº¦ãŒç›´è¿‘ã®CubismModel.updateé–¢æ•°ã§å¤‰åŒ–ã—ãŸ
     * @return false drawableã®ä¸é€æ˜Žåº¦ãŒç›´è¿‘ã®CubismModel.updateé–¢æ•°ã§å¤‰åŒ–ã—ã¦ã„ã‚‹
     */
    getDrawableDynamicFlagVisibilityDidChange(drawableIndex) {
        const dynamicFlags = this._model.drawables.dynamicFlags;
        return Live2DCubismCore.Utils.hasVisibilityDidChangeBit(dynamicFlags[drawableIndex]);
    }
    /**
     * Drawableã®ä¸é€æ˜Žåº¦ã®å¤‰åŒ–æƒ…å ±ã®å–å¾—
     *
     * ç›´è¿‘ã®CubismModel.updateé–¢æ•°ã§drawableã®ä¸é€æ˜Žåº¦ãŒå¤‰åŒ–ã—ãŸã‹ã‚’å–å¾—ã™ã‚‹ã€‚
     *
     * @param drawableIndex drawableã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return true Drawableã®ä¸é€æ˜Žåº¦ãŒç›´è¿‘ã®CubismModel.updateé–¢æ•°ã§å¤‰åŒ–ã—ãŸ
     * @return false Drawableã®ä¸é€æ˜Žåº¦ãŒç›´è¿‘ã®CubismModel.updateé–¢æ•°ã§å¤‰åŒ–ã—ã¦ãªã„
     */
    getDrawableDynamicFlagOpacityDidChange(drawableIndex) {
        const dynamicFlags = this._model.drawables.dynamicFlags;
        return Live2DCubismCore.Utils.hasOpacityDidChangeBit(dynamicFlags[drawableIndex]);
    }
    /**
     * Drawableã®æç”»é †åºã®å¤‰åŒ–æƒ…å ±ã®å–å¾—
     *
     * ç›´è¿‘ã®CubismModel.updateé–¢æ•°ã§Drawableã®æç”»ã®é †åºãŒå¤‰åŒ–ã—ãŸã‹ã‚’å–å¾—ã™ã‚‹ã€‚
     *
     * @param drawableIndex Drawableã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return true Drawableã®æç”»ã®é †åºãŒç›´è¿‘ã®CubismModel.updateé–¢æ•°ã§å¤‰åŒ–ã—ãŸ
     * @return false Drawableã®æç”»ã®é †åºãŒç›´è¿‘ã®CubismModel.updateé–¢æ•°ã§å¤‰åŒ–ã—ã¦ãªã„
     */
    getDrawableDynamicFlagRenderOrderDidChange(drawableIndex) {
        const dynamicFlags = this._model.drawables.dynamicFlags;
        return Live2DCubismCore.Utils.hasRenderOrderDidChangeBit(dynamicFlags[drawableIndex]);
    }
    /**
     * Drawableã®ä¹—ç®—è‰²ãƒ»ã‚¹ã‚¯ãƒªãƒ¼ãƒ³è‰²ã®å¤‰åŒ–æƒ…å ±ã®å–å¾—
     *
     * ç›´è¿‘ã®CubismModel.updateé–¢æ•°ã§Drawableã®ä¹—ç®—è‰²ãƒ»ã‚¹ã‚¯ãƒªãƒ¼ãƒ³è‰²ãŒå¤‰åŒ–ã—ãŸã‹ã‚’å–å¾—ã™ã‚‹ã€‚
     *
     * @param drawableIndex Drawableã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return true Drawableã®ä¹—ç®—è‰²ãƒ»ã‚¹ã‚¯ãƒªãƒ¼ãƒ³è‰²ãŒç›´è¿‘ã®CubismModel.updateé–¢æ•°ã§å¤‰åŒ–ã—ãŸ
     * @return false Drawableã®ä¹—ç®—è‰²ãƒ»ã‚¹ã‚¯ãƒªãƒ¼ãƒ³è‰²ãŒç›´è¿‘ã®CubismModel.updateé–¢æ•°ã§å¤‰åŒ–ã—ã¦ãªã„
     */
    getDrawableDynamicFlagBlendColorDidChange(drawableIndex) {
        const dynamicFlags = this._model.drawables.dynamicFlags;
        return Live2DCubismCore.Utils.hasBlendColorDidChangeBit(dynamicFlags[drawableIndex]);
    }
    /**
     * ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã®å€‹æ•°ã‚’å–å¾—ã™ã‚‹
     * @return ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã®å€‹æ•°
     */
    getOffscreenCount() {
        return this._model.offscreens.count;
    }
    /**
     * Offscreenã®ã‚«ãƒ©ãƒ¼ãƒ–ãƒ¬ãƒ³ãƒ‰ã®å–å¾—(Cubism 5.3 ä»¥é™)
     *
     * @param offscreenIndex Offscreenã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return Offscreenã®ã‚«ãƒ©ãƒ¼ãƒ–ãƒ¬ãƒ³ãƒ‰
     */
    getOffscreenColorBlend(offscreenIndex) {
        // ã‚­ãƒ£ãƒƒã‚·ãƒ¥
        if (this._offscreenColorBlends[offscreenIndex] ==
            CubismColorBlend.ColorBlend_None) {
            this._offscreenColorBlends[offscreenIndex] =
                this._model.offscreens.blendModes[offscreenIndex] & 0xff;
        }
        return this._offscreenColorBlends[offscreenIndex];
    }
    /**
     * Offscreenã®ã‚¢ãƒ«ãƒ•ã‚¡ãƒ–ãƒ¬ãƒ³ãƒ‰ã®å–å¾—(Cubism 5.3 ä»¥é™)
     *
     * @param offscreenIndex Offscreenã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return Offscreenã®ã‚¢ãƒ«ãƒ•ã‚¡ãƒ–ãƒ¬ãƒ³ãƒ‰
     */
    getOffscreenAlphaBlend(offscreenIndex) {
        // ã‚­ãƒ£ãƒƒã‚·ãƒ¥
        if (this._offscreenAlphaBlends[offscreenIndex] ==
            CubismAlphaBlend.AlphaBlend_None) {
            this._offscreenAlphaBlends[offscreenIndex] =
                (this._model.offscreens.blendModes[offscreenIndex] >> 8) & 0xff;
        }
        return this._offscreenAlphaBlends[offscreenIndex];
    }
    /**
     * ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã®ã‚ªãƒ¼ãƒŠãƒ¼ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹é…åˆ—ã‚’å–å¾—ã™ã‚‹
     * @return ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã®ã‚ªãƒ¼ãƒŠãƒ¼ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹é…åˆ—
     */
    getOffscreenOwnerIndices() {
        return this._model.offscreens.ownerIndices;
    }
    /**
     * ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã®ä¸é€æ˜Žåº¦ã‚’å–å¾—
     * @param offscreenIndex ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return ä¸é€æ˜Žåº¦
     */
    getOffscreenOpacity(offscreenIndex) {
        if (offscreenIndex < 0 || offscreenIndex >= this._model.offscreens.count) {
            return 1.0; // ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ãŒç„¡ã„ã®ã§ã‚¹ã‚­ãƒƒãƒ—
        }
        return this._model.offscreens.opacities[offscreenIndex];
    }
    /**
     * ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã®ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ãƒªã‚¹ãƒˆã®å–å¾—
     * @return ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã®ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ãƒªã‚¹ãƒˆ
     */
    getOffscreenMasks() {
        return this._model.offscreens.masks;
    }
    /**
     * ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã®ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ã®å€‹æ•°ãƒªã‚¹ãƒˆã®å–å¾—
     * @return ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã®ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ã®å€‹æ•°ãƒªã‚¹ãƒˆ
     */
    getOffscreenMaskCounts() {
        return this._model.offscreens.maskCounts;
    }
    /**
     * ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã®ãƒžã‚¹ã‚¯åè»¢è¨­å®šã‚’å–å¾—ã™ã‚‹
     * @param offscreenIndex ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã®ãƒžã‚¹ã‚¯åè»¢è¨­å®š
     */
    getOffscreenInvertedMask(offscreenIndex) {
        const constantFlags = this._model.offscreens.constantFlags;
        // Live2DCubismCore.Utils.hasIsInvertedMaskBit ã‚’åˆ©ç”¨
        return Live2DCubismCore.Utils.hasIsInvertedMaskBit(constantFlags[offscreenIndex]);
    }
    /**
     * ãƒ–ãƒ¬ãƒ³ãƒ‰ãƒ¢ãƒ¼ãƒ‰ä½¿ç”¨åˆ¤å®š
     * @return ãƒ–ãƒ¬ãƒ³ãƒ‰ãƒ¢ãƒ¼ãƒ‰ã‚’ä½¿ç”¨ã—ã¦ã„ã‚‹ã‹
     */
    isBlendModeEnabled() {
        return this._isBlendModeEnabled;
    }
    /**
     * ä¿å­˜ã•ã‚ŒãŸãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®èª­ã¿è¾¼ã¿
     */
    loadParameters() {
        let parameterCount = this._model.parameters.count;
        const savedParameterCount = this._savedParameters.length;
        if (parameterCount > savedParameterCount) {
            parameterCount = savedParameterCount;
        }
        for (let i = 0; i < parameterCount; ++i) {
            this._parameterValues[i] = this._savedParameters[i];
        }
    }
    /**
     * åˆæœŸåŒ–ã™ã‚‹
     */
    initialize() {
        CSM_ASSERT(this._model);
        this._parameterValues = this._model.parameters.values;
        this._partOpacities = this._model.parts.opacities;
        this._offscreenOpacities = this._model.offscreens.opacities;
        this._parameterMaximumValues = this._model.parameters.maximumValues;
        this._parameterMinimumValues = this._model.parameters.minimumValues;
        {
            const parameterIds = this._model.parameters.ids;
            const parameterCount = this._model.parameters.count;
            this._parameterIds.length = parameterCount;
            this._userParameterRepeatDataList.length = parameterCount;
            for (let i = 0; i < parameterCount; ++i) {
                this._parameterIds[i] = CubismFramework.getIdManager().getId(parameterIds[i]);
                this._userParameterRepeatDataList[i] = new ParameterRepeatData(false, false);
            }
        }
        const partCount = this._model.parts.count;
        {
            const partIds = this._model.parts.ids;
            this._partIds.length = partCount;
            for (let i = 0; i < partCount; ++i) {
                this._partIds[i] = CubismFramework.getIdManager().getId(partIds[i]);
            }
        }
        {
            const drawableIds = this._model.drawables.ids;
            const drawableCount = this._model.drawables.count;
            // Drawableã‚«ãƒªãƒ³ã‚°è¨­å®š
            this._userDrawableCullings.length = drawableCount;
            const userCulling = new CullingData(false, false);
            // Offscreenã‚«ãƒªãƒ³ã‚°è¨­å®š
            this._userOffscreenCullings.length = this._model.offscreens.count;
            const userOffscreenCulling = new CullingData(false, false);
            // Drawables
            {
                for (let i = 0; i < drawableCount; ++i) {
                    this._drawableIds.push(CubismFramework.getIdManager().getId(drawableIds[i]));
                    this._userDrawableCullings[i] = userCulling;
                }
            }
            // Offscreens
            {
                for (let i = 0; i < this._model.offscreens.count; ++i) {
                    this._userOffscreenCullings[i] = userOffscreenCulling;
                }
            }
            // blendMode
            // ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ãŒå­˜åœ¨ã™ã‚‹ã‹ã€Drawableã®ãƒ–ãƒ¬ãƒ³ãƒ‰ãƒ¢ãƒ¼ãƒ‰ã§ColorBlendã€AlphaBlendã‚’ä½¿ç”¨ã™ã‚‹ã®ã§ã‚ã‚Œã°ãƒ–ãƒ¬ãƒ³ãƒ‰ãƒ¢ãƒ¼ãƒ‰ã‚’æœ‰åŠ¹ã«ã™ã‚‹ã€‚
            if (this.getOffscreenCount() > 0) {
                this._isBlendModeEnabled = true;
            }
            else {
                const blendModes = this._model.drawables.blendModes;
                for (let i = 0; i < drawableCount; ++i) {
                    const colorBlendType = this.getDrawableColorBlend(i);
                    const alphaBlendType = this.getDrawableAlphaBlend(i);
                    // NormalOverã€AddCompatibleã€MultiplyCompatibleä»¥å¤–ã§ã‚ã‚Œã°ãƒ–ãƒ¬ãƒ³ãƒ‰ãƒ¢ãƒ¼ãƒ‰ã‚’æœ‰åŠ¹ã«ã™ã‚‹ã€‚
                    if (!(colorBlendType == CubismColorBlend.ColorBlend_Normal &&
                        alphaBlendType == CubismAlphaBlend.AlphaBlend_Over) &&
                        colorBlendType != CubismColorBlend.ColorBlend_AddCompatible &&
                        colorBlendType != CubismColorBlend.ColorBlend_MultiplyCompatible) {
                        this._isBlendModeEnabled = true;
                        break;
                    }
                }
            }
            this.setupPartsHierarchy();
            // CubismModelMultiplyAndScreenColorã®åˆæœŸåŒ–
            const offscreenCount = this.getOffscreenCount();
            this._overrideMultiplyAndScreenColor.initialize(partCount, drawableCount, offscreenCount);
        }
    }
    /**
     * ãƒ‘ãƒ¼ãƒ„éšŽå±¤æ§‹é€ ã‚’å–å¾—ã™ã‚‹
     * @return ãƒ‘ãƒ¼ãƒ„éšŽå±¤æ§‹é€ ã®é…åˆ—
     */
    getPartsHierarchy() {
        return this._partsHierarchy;
    }
    /**
     * ãƒ‘ãƒ¼ãƒ„éšŽå±¤æ§‹é€ ã‚’ã‚»ãƒƒãƒˆã‚¢ãƒƒãƒ—ã™ã‚‹
     */
    setupPartsHierarchy() {
        this._partsHierarchy.length = 0;
        // ã™ã¹ã¦ã®ãƒ‘ãƒ¼ãƒ„ã®ãƒ‘ãƒ¼ãƒ„æƒ…å ±ç®¡ç†æ§‹é€ ä½“ã‚’ä½œæˆ
        const partCount = this.getPartCount();
        this._partsHierarchy.length = partCount;
        for (let i = 0; i < partCount; ++i) {
            const partInfo = new CubismModelPartInfo();
            this._partsHierarchy[i] = partInfo;
        }
        // Partã”ã¨ã«è¦ªãƒ‘ãƒ¼ãƒ„ã‚’å–å¾—ã—ã€è¦ªãƒ‘ãƒ¼ãƒ„ã®å­objectãƒªã‚¹ãƒˆã«è¿½åŠ ã™ã‚‹
        for (let i = 0; i < partCount; ++i) {
            const parentPartIndex = this.getPartParentPartIndices()[i];
            if (parentPartIndex === NoParentIndex) {
                continue;
            }
            for (let partIndex = 0; partIndex < this._partsHierarchy.length; ++partIndex) {
                if (partIndex === parentPartIndex) {
                    const objectInfo = new CubismModelObjectInfo(i, CubismModelObjectType.CubismModelObjectType_Parts);
                    this._partsHierarchy[partIndex].objects.push(objectInfo);
                    break;
                }
            }
        }
        // Drawableã”ã¨ã«è¦ªãƒ‘ãƒ¼ãƒ„ã‚’å–å¾—ã—ã€è¦ªãƒ‘ãƒ¼ãƒ„ã®å­objectãƒªã‚¹ãƒˆã«è¿½åŠ ã™ã‚‹
        const drawableCount = this.getDrawableCount();
        for (let i = 0; i < drawableCount; ++i) {
            const parentPartIndex = this.getDrawableParentPartIndex(i);
            if (parentPartIndex === NoParentIndex) {
                continue;
            }
            for (let partIndex = 0; partIndex < this._partsHierarchy.length; ++partIndex) {
                if (partIndex === parentPartIndex) {
                    const objectInfo = new CubismModelObjectInfo(i, CubismModelObjectType.CubismModelObjectType_Drawable);
                    this._partsHierarchy[partIndex].objects.push(objectInfo);
                    break;
                }
            }
        }
        // ãƒ‘ãƒ¼ãƒ„å­æç”»ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆæƒ…å ±æ§‹é€ ä½“ã‚’ä½œæˆã—ã¦ã„ã
        for (let i = 0; i < this._partsHierarchy.length; ++i) {
            // ãƒ‘ãƒ¼ãƒ„ç®¡ç†æ§‹é€ ä½“ã‚’å–å¾—
            this.getPartChildDrawObjects(i);
        }
    }
    /**
     * æŒ‡å®šã—ãŸãƒ‘ãƒ¼ãƒ„ã®å­æç”»ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆæƒ…å ±ã‚’å–å¾—ãƒ»æ§‹ç¯‰ã™ã‚‹
     * @param partInfoIndex ãƒ‘ãƒ¼ãƒ„æƒ…å ±ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return PartChildDrawObjects
     */
    getPartChildDrawObjects(partInfoIndex) {
        if (this._partsHierarchy[partInfoIndex].getChildObjectCount() < 1) {
            // å­ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆãŒãªã„å ´åˆ
            return this._partsHierarchy[partInfoIndex].childDrawObjects;
        }
        const childDrawObjects = this._partsHierarchy[partInfoIndex].childDrawObjects;
        // æ—¢ã«childDrawObjectsãŒå‡¦ç†ã•ã‚Œã¦ã„ã‚‹å ´åˆã¯ã‚¹ã‚­ãƒƒãƒ—
        if (childDrawObjects.drawableIndices.length !== 0 ||
            childDrawObjects.offscreenIndices.length !== 0) {
            return childDrawObjects;
        }
        const objects = this._partsHierarchy[partInfoIndex].objects;
        for (let i = 0; i < objects.length; ++i) {
            const obj = objects[i];
            if (obj.objectType === CubismModelObjectType.CubismModelObjectType_Parts) {
                // å­ã®ãƒ‘ãƒ¼ãƒ„ã®å ´åˆã€å†å¸°çš„ã«å­objectsã‚’å–å¾—
                this.getPartChildDrawObjects(obj.objectIndex);
                // å­ãƒ‘ãƒ¼ãƒ„ã®å­Drawableã€Offscreenã‚’å–å¾—
                const childToChildDrawObjects = this._partsHierarchy[obj.objectIndex].childDrawObjects;
                childDrawObjects.drawableIndices.push(...childToChildDrawObjects.drawableIndices);
                childDrawObjects.offscreenIndices.push(...childToChildDrawObjects.offscreenIndices);
                // Offscreenã®ç¢ºèª
                const offscreenIndices = this.getOffscreenIndices();
                const offscreenIndex = offscreenIndices
                    ? offscreenIndices[obj.objectIndex]
                    : NoOffscreenIndex;
                if (offscreenIndex !== NoOffscreenIndex) {
                    childDrawObjects.offscreenIndices.push(offscreenIndex);
                }
            }
            else if (obj.objectType === CubismModelObjectType.CubismModelObjectType_Drawable) {
                // Drawableã®å ´åˆã€ãƒ‘ãƒ¼ãƒ„ã®å­Drawableã«è¿½åŠ 
                childDrawObjects.drawableIndices.push(obj.objectIndex);
            }
        }
        return childDrawObjects;
    }
    /**
     * ãƒ‘ãƒ¼ãƒ„ã®ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹é…åˆ—ã‚’å–å¾—
     * @return Int32Array offscreenIndices
     */
    getOffscreenIndices() {
        // _model.parts.offscreenIndices ãŒå­˜åœ¨ã™ã‚‹å ´åˆã®ã¿è¿”ã™
        return this._model.parts.offscreenIndices;
    }
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     * @param model ãƒ¢ãƒ‡ãƒ«
     */
    constructor(model) {
        this._model = model;
        this._parameterValues = null;
        this._parameterMaximumValues = null;
        this._parameterMinimumValues = null;
        this._partOpacities = null;
        this._offscreenOpacities = null;
        this._savedParameters = new Array();
        this._parameterIds = new Array();
        this._drawableIds = new Array();
        this._partIds = new Array();
        this._isOverriddenParameterRepeat = true;
        this._isOverriddenCullings = false;
        this._modelOpacity = 1.0;
        // CubismModelMultiplyAndScreenColorã®ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹ã‚’ä½œæˆ
        this._overrideMultiplyAndScreenColor =
            new CubismModelMultiplyAndScreenColor(this);
        this._isBlendModeEnabled = false;
        this._drawableColorBlends = null;
        this._drawableAlphaBlends = null;
        this._offscreenColorBlends = null;
        this._offscreenAlphaBlends = null;
        this._drawableMultiplyColors = null;
        this._drawableScreenColors = null;
        this._offscreenMultiplyColors = null;
        this._offscreenScreenColors = null;
        this._userParameterRepeatDataList = new Array();
        this._userDrawableCullings = new Array();
        this._userOffscreenCullings = new Array();
        this._partsHierarchy = new Array();
        this._notExistPartId = new Map();
        this._notExistParameterId = new Map();
        this._notExistParameterValues = new Map();
        this._notExistPartOpacities = new Map();
        // Drawableã®ã‚«ãƒ©ãƒ¼ãƒ–ãƒ¬ãƒ³ãƒ‰ã¨ã‚¢ãƒ«ãƒ•ã‚¡ãƒ–ãƒ¬ãƒ³ãƒ‰ã®åˆæœŸåŒ–
        this._drawableColorBlends = new Array(model.drawables.count).fill(CubismColorBlend.ColorBlend_None);
        this._drawableAlphaBlends = new Array(model.drawables.count).fill(CubismAlphaBlend.AlphaBlend_None);
        // Offscreenã®ã‚«ãƒ©ãƒ¼ãƒ–ãƒ¬ãƒ³ãƒ‰ã¨ã‚¢ãƒ«ãƒ•ã‚¡ãƒ–ãƒ¬ãƒ³ãƒ‰ã®åˆæœŸåŒ–
        this._offscreenColorBlends = new Array(model.offscreens.count).fill(CubismColorBlend.ColorBlend_None);
        this._offscreenAlphaBlends = new Array(model.offscreens.count).fill(CubismAlphaBlend.AlphaBlend_None);
    }
    /**
     * ãƒ‡ã‚¹ãƒˆãƒ©ã‚¯ã‚¿ç›¸å½“ã®å‡¦ç†
     */
    release() {
        this._model.release();
        this._model = null;
        this._drawableColorBlends = null;
        this._drawableAlphaBlends = null;
        this._offscreenColorBlends = null;
        this._offscreenAlphaBlends = null;
        this._drawableMultiplyColors = null;
        this._drawableScreenColors = null;
        this._offscreenMultiplyColors = null;
        this._offscreenScreenColors = null;
    }
}
// Namespace definition for compatibility.
import * as $ from './cubismmodel.js';
// eslint-disable-next-line @typescript-eslint/no-namespace
export var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    Live2DCubismFramework.CubismModel = $.CubismModel;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));
//# sourceMappingURL=cubismmodel.js.map