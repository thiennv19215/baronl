/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
import { CubismMath } from '../math/cubismmath.js';
import { CubismMatrix44 } from '../math/cubismmatrix44.js';
import { csmRect } from '../type/csmrectf.js';
import { CubismLogInfo } from '../utils/cubismdebug.js';
/**
 * ãƒ¢ãƒ‡ãƒ«æç”»ã‚’å‡¦ç†ã™ã‚‹ãƒ¬ãƒ³ãƒ€ãƒ©
 *
 * ã‚µãƒ–ã‚¯ãƒ©ã‚¹ã«ç’°å¢ƒä¾å­˜ã®æç”»å‘½ä»¤ã‚’è¨˜è¿°ã™ã‚‹ã€‚
 */
export class CubismRenderer {
    /**
     * ãƒ¬ãƒ³ãƒ€ãƒ©ã®ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹ã‚’ç”Ÿæˆã—ã¦å–å¾—ã™ã‚‹
     *
     * @return ãƒ¬ãƒ³ãƒ€ãƒ©ã®ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹
     */
    static create() {
        return null;
    }
    /**
     * ãƒ¬ãƒ³ãƒ€ãƒ©ã®ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹ã‚’è§£æ”¾ã™ã‚‹
     */
    static delete(renderer) {
        renderer = null;
    }
    /**
     * ãƒ¬ãƒ³ãƒ€ãƒ©ã®åˆæœŸåŒ–å‡¦ç†ã‚’å®Ÿè¡Œã™ã‚‹
     * å¼•æ•°ã«æ¸¡ã—ãŸãƒ¢ãƒ‡ãƒ«ã‹ã‚‰ãƒ¬ãƒ³ãƒ€ãƒ©ã®åˆæœŸåŒ–å‡¦ç†ã«å¿…è¦ãªæƒ…å ±ã‚’å–ã‚Šå‡ºã™ã“ã¨ãŒã§ãã‚‹
     *
     * @param model ãƒ¢ãƒ‡ãƒ«ã®ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹
     */
    initialize(model) {
        this._model = model;
        // ãƒ–ãƒ¬ãƒ³ãƒ‰ãƒ¢ãƒ¼ãƒ‰ä½¿ç”¨æ™‚ã¯å¿…ãšé«˜ç²¾ç´°ã«ã™ã‚‹
        if (model.isBlendModeEnabled()) {
            this.useHighPrecisionMask(true);
            CubismLogInfo('This model uses a high-resolution mask because it operates in blend mode.');
        }
    }
    /**
     * ãƒ¢ãƒ‡ãƒ«ã‚’æç”»ã™ã‚‹
     * @param shaderPath ãƒ–ãƒ¬ãƒ³ãƒ‰ãƒ¢ãƒ¼ãƒ‰ç”¨ã‚·ã‚§ãƒ¼ãƒ€ã®ãƒ‘ã‚¹
     */
    drawModel(shaderPath = null) {
        if (this.getModel() == null)
            return;
        // NOTE: WebGLæœ€é©åŒ–ã®ãŸã‚ã€ãƒ‡ãƒ•ã‚©ãƒ«ãƒˆã§ã¯ã‚³ãƒ¡ãƒ³ãƒˆã‚¢ã‚¦ãƒˆ
        //this.saveProfile();
        this.doDrawModel(shaderPath);
        // NOTE: WebGLæœ€é©åŒ–ã®ãŸã‚ã€ãƒ‡ãƒ•ã‚©ãƒ«ãƒˆã§ã¯ã‚³ãƒ¡ãƒ³ãƒˆã‚¢ã‚¦ãƒˆ
        //this.restoreProfile();
    }
    /**
     * Model-View-Projection è¡Œåˆ—ã‚’ã‚»ãƒƒãƒˆã™ã‚‹
     * é…åˆ—ã¯è¤‡è£½ã•ã‚Œã‚‹ã®ã§ã€å…ƒã®é…åˆ—ã¯å¤–ã§ç ´æ£„ã—ã¦è‰¯ã„
     *
     * @param matrix44 Model-View-Projection è¡Œåˆ—
     */
    setMvpMatrix(matrix44) {
        this._mvpMatrix4x4.setMatrix(matrix44.getArray());
    }
    /**
     * Model-View-Projection è¡Œåˆ—ã‚’å–å¾—ã™ã‚‹
     *
     * @return Model-View-Projection è¡Œåˆ—
     */
    getMvpMatrix() {
        return this._mvpMatrix4x4;
    }
    /**
     * ãƒ¢ãƒ‡ãƒ«ã®è‰²ã‚’ã‚»ãƒƒãƒˆã™ã‚‹
     * å„è‰²0.0~1.0ã®é–“ã§æŒ‡å®šã™ã‚‹ï¼ˆ1.0ãŒæ¨™æº–ã®çŠ¶æ…‹ï¼‰
     *
     * @param red èµ¤ãƒãƒ£ãƒ³ãƒãƒ«ã®å€¤
     * @param green ç·‘ãƒãƒ£ãƒ³ãƒãƒ«ã®å€¤
     * @param blue é’ãƒãƒ£ãƒ³ãƒãƒ«ã®å€¤
     * @param alpha Î±ãƒãƒ£ãƒ³ãƒãƒ«ã®å€¤
     */
    setModelColor(red, green, blue, alpha) {
        this._modelColor.r = CubismMath.clamp(red, 0.0, 1.0);
        this._modelColor.g = CubismMath.clamp(green, 0.0, 1.0);
        this._modelColor.b = CubismMath.clamp(blue, 0.0, 1.0);
        this._modelColor.a = CubismMath.clamp(alpha, 0.0, 1.0);
    }
    /**
     * ãƒ¢ãƒ‡ãƒ«ã®è‰²ã‚’å–å¾—ã™ã‚‹
     * å„è‰²0.0~1.0ã®é–“ã§æŒ‡å®šã™ã‚‹(1.0ãŒæ¨™æº–ã®çŠ¶æ…‹)
     *
     * @return RGBAã®ã‚«ãƒ©ãƒ¼æƒ…å ±
     */
    getModelColor() {
        return JSON.parse(JSON.stringify(this._modelColor));
    }
    /**
     * é€æ˜Žåº¦ã‚’è€ƒæ…®ã—ãŸãƒ¢ãƒ‡ãƒ«ã®è‰²ã‚’è¨ˆç®—ã™ã‚‹ã€‚
     *
     * @param opacity é€æ˜Žåº¦
     *
     * @return RGBAã®ã‚«ãƒ©ãƒ¼æƒ…å ±
     */
    getModelColorWithOpacity(opacity) {
        const modelColorRGBA = this.getModelColor();
        modelColorRGBA.a *= opacity;
        if (this.isPremultipliedAlpha()) {
            modelColorRGBA.r *= modelColorRGBA.a;
            modelColorRGBA.g *= modelColorRGBA.a;
            modelColorRGBA.b *= modelColorRGBA.a;
        }
        return modelColorRGBA;
    }
    /**
     * ä¹—ç®—æ¸ˆã¿Î±ã®æœ‰åŠ¹ãƒ»ç„¡åŠ¹ã‚’ã‚»ãƒƒãƒˆã™ã‚‹
     * æœ‰åŠ¹ã«ã™ã‚‹ãªã‚‰trueã€ç„¡åŠ¹ã«ã™ã‚‹ãªã‚‰falseã‚’ã‚»ãƒƒãƒˆã™ã‚‹
     */
    setIsPremultipliedAlpha(enable) {
        this._isPremultipliedAlpha = enable;
    }
    /**
     * ä¹—ç®—æ¸ˆã¿Î±ã®æœ‰åŠ¹ãƒ»ç„¡åŠ¹ã‚’å–å¾—ã™ã‚‹
     * @return true ä¹—ç®—æ¸ˆã¿ã®Î±æœ‰åŠ¹
     *         false ä¹—ç®—æ¸ˆã¿ã®Î±ç„¡åŠ¹
     */
    isPremultipliedAlpha() {
        return this._isPremultipliedAlpha;
    }
    /**
     * ã‚«ãƒªãƒ³ã‚°ï¼ˆç‰‡é¢æç”»ï¼‰ã®æœ‰åŠ¹ãƒ»ç„¡åŠ¹ã‚’ã‚»ãƒƒãƒˆã™ã‚‹ã€‚
     * æœ‰åŠ¹ã«ã™ã‚‹ãªã‚‰trueã€ç„¡åŠ¹ã«ã™ã‚‹ãªã‚‰falseã‚’ã‚»ãƒƒãƒˆã™ã‚‹
     */
    setIsCulling(culling) {
        this._isCulling = culling;
    }
    /**
     * ã‚«ãƒªãƒ³ã‚°ï¼ˆç‰‡é¢æç”»ï¼‰ã®æœ‰åŠ¹ãƒ»ç„¡åŠ¹ã‚’å–å¾—ã™ã‚‹ã€‚
     *
     * @return true ã‚«ãƒªãƒ³ã‚°æœ‰åŠ¹
     *         false ã‚«ãƒªãƒ³ã‚°ç„¡åŠ¹
     */
    isCulling() {
        return this._isCulling;
    }
    /**
     * ãƒ†ã‚¯ã‚¹ãƒãƒ£ã®ç•°æ–¹æ€§ãƒ•ã‚£ãƒ«ã‚¿ãƒªãƒ³ã‚°ã®ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã‚’ã‚»ãƒƒãƒˆã™ã‚‹
     * ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿å€¤ã®å½±éŸ¿åº¦ã¯ãƒ¬ãƒ³ãƒ€ãƒ©ã®å®Ÿè£…ã«ä¾å­˜ã™ã‚‹
     *
     * @param n ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®å€¤
     */
    setAnisotropy(n) {
        this._anisotropy = n;
    }
    /**
     * ãƒ†ã‚¯ã‚¹ãƒãƒ£ã®ç•°æ–¹æ€§ãƒ•ã‚£ãƒ«ã‚¿ãƒªãƒ³ã‚°ã®ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã‚’ã‚»ãƒƒãƒˆã™ã‚‹
     *
     * @return ç•°æ–¹æ€§ãƒ•ã‚£ãƒ«ã‚¿ãƒªãƒ³ã‚°ã®ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿
     */
    getAnisotropy() {
        return this._anisotropy;
    }
    /**
     * ãƒ¬ãƒ³ãƒ€ãƒªãƒ³ã‚°ã™ã‚‹ãƒ¢ãƒ‡ãƒ«ã‚’å–å¾—ã™ã‚‹
     *
     * @return ãƒ¬ãƒ³ãƒ€ãƒªãƒ³ã‚°ã™ã‚‹ãƒ¢ãƒ‡ãƒ«
     */
    getModel() {
        return this._model;
    }
    /**
     * ãƒžã‚¹ã‚¯æç”»ã®æ–¹å¼ã‚’å¤‰æ›´ã™ã‚‹ã€‚
     * falseã®å ´åˆã€ãƒžã‚¹ã‚¯ã‚’1æžšã®ãƒ†ã‚¯ã‚¹ãƒãƒ£ã«åˆ†å‰²ã—ã¦ãƒ¬ãƒ³ãƒ€ãƒªãƒ³ã‚°ã™ã‚‹ï¼ˆãƒ‡ãƒ•ã‚©ãƒ«ãƒˆï¼‰
     * é«˜é€Ÿã ãŒã€ãƒžã‚¹ã‚¯å€‹æ•°ã®ä¸Šé™ãŒ36ã«é™å®šã•ã‚Œã€è³ªã‚‚è’ããªã‚‹
     * trueã®å ´åˆã€ãƒ‘ãƒ¼ãƒ„æç”»ã®å‰ã«ãã®éƒ½åº¦å¿…è¦ãªãƒžã‚¹ã‚¯ã‚’æãç›´ã™
     * ãƒ¬ãƒ³ãƒ€ãƒªãƒ³ã‚°å“è³ªã¯é«˜ã„ãŒæç”»å‡¦ç†è² è·ã¯å¢—ã™
     *
     * @param high é«˜ç²¾ç´°ãƒžã‚¹ã‚¯ã«åˆ‡ã‚Šæ›¿ãˆã‚‹ã‹ï¼Ÿ
     */
    useHighPrecisionMask(high) {
        this._useHighPrecisionMask = high;
    }
    /**
     * ãƒžã‚¹ã‚¯ã®æç”»æ–¹å¼ã‚’å–å¾—ã™ã‚‹
     *
     * @return true é«˜ç²¾ç´°æ–¹å¼
     *         false ãƒ‡ãƒ•ã‚©ãƒ«ãƒˆ
     */
    isUsingHighPrecisionMask() {
        return this._useHighPrecisionMask;
    }
    /**
     * ãƒ¢ãƒ‡ãƒ«ã‚’æç”»ã—ãŸãƒãƒƒãƒ•ã‚¡ã®ã‚µã‚¤ã‚ºã‚’è¨­å®š
     *
     * @param[in]   width  -> ãƒ¢ãƒ‡ãƒ«ã‚’æç”»ã—ãŸãƒãƒƒãƒ•ã‚¡ã®å¹…
     * @param[in]   height -> ãƒ¢ãƒ‡ãƒ«ã‚’æç”»ã—ãŸãƒãƒƒãƒ•ã‚¡ã®é«˜ã•
     */
    setRenderTargetSize(width, height) {
        this._modelRenderTargetWidth = width;
        this._modelRenderTargetHeight = height;
    }
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    constructor(width, height) {
        this._modelRenderTargetWidth = width;
        this._modelRenderTargetHeight = height;
        this._isCulling = false;
        this._isPremultipliedAlpha = false;
        this._anisotropy = 0.0;
        this._model = null;
        this._modelColor = new CubismTextureColor();
        this._useHighPrecisionMask = false;
        // å˜ä½è¡Œåˆ—ã«åˆæœŸåŒ–
        this._mvpMatrix4x4 = new CubismMatrix44();
        this._mvpMatrix4x4.loadIdentity();
    }
}
export var CubismBlendMode;
(function (CubismBlendMode) {
    CubismBlendMode[CubismBlendMode["CubismBlendMode_Normal"] = 0] = "CubismBlendMode_Normal";
    CubismBlendMode[CubismBlendMode["CubismBlendMode_Additive"] = 1] = "CubismBlendMode_Additive";
    CubismBlendMode[CubismBlendMode["CubismBlendMode_Multiplicative"] = 2] = "CubismBlendMode_Multiplicative"; // ä¹—ç®—
})(CubismBlendMode || (CubismBlendMode = {}));
/**
 * ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã®ã‚¿ã‚¤ãƒ—
 */
export var DrawableObjectType;
(function (DrawableObjectType) {
    DrawableObjectType[DrawableObjectType["DrawableObjectType_Drawable"] = 0] = "DrawableObjectType_Drawable";
    DrawableObjectType[DrawableObjectType["DrawableObjectType_Offscreen"] = 1] = "DrawableObjectType_Offscreen";
})(DrawableObjectType || (DrawableObjectType = {}));
/**
 * ãƒ†ã‚¯ã‚¹ãƒãƒ£ã®è‰²ã‚’RGBAã§æ‰±ã†ãŸã‚ã®ã‚¯ãƒ©ã‚¹
 */
export class CubismTextureColor {
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    constructor(r = 1.0, g = 1.0, b = 1.0, a = 1.0) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
}
/**
 * ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ã®ã‚³ãƒ³ãƒ†ã‚­ã‚¹ãƒˆ
 */
export class CubismClippingContext {
    /**
     * å¼•æ•°ä»˜ãã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    constructor(clippingDrawableIndices, clipCount) {
        // ã‚¯ãƒªãƒƒãƒ—ã—ã¦ã„ã‚‹ï¼ˆï¼ãƒžã‚¹ã‚¯ç”¨ã®ï¼‰Drawableã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ãƒªã‚¹ãƒˆ
        this._clippingIdList = clippingDrawableIndices;
        // ãƒžã‚¹ã‚¯ã®æ•°
        this._clippingIdCount = clipCount;
        this._allClippedDrawRect = new csmRect();
        this._layoutBounds = new csmRect();
        this._clippedDrawableIndexList = [];
        this._clippedOffscreenIndexList = [];
        this._matrixForMask = new CubismMatrix44();
        this._matrixForDraw = new CubismMatrix44();
        this._bufferIndex = 0;
        this._layoutChannelIndex = 0;
    }
    /**
     * ãƒ‡ã‚¹ãƒˆãƒ©ã‚¯ã‚¿ç›¸å½“ã®å‡¦ç†
     */
    release() {
        if (this._layoutBounds != null) {
            this._layoutBounds = null;
        }
        if (this._allClippedDrawRect != null) {
            this._allClippedDrawRect = null;
        }
        if (this._clippedDrawableIndexList != null) {
            this._clippedDrawableIndexList = null;
        }
        if (this._clippedOffscreenIndexList != null) {
            this._clippedOffscreenIndexList = null;
        }
    }
    /**
     * ã“ã®ãƒžã‚¹ã‚¯ã«ã‚¯ãƒªãƒƒãƒ—ã•ã‚Œã‚‹æç”»ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã‚’è¿½åŠ ã™ã‚‹
     *
     * @param drawableIndex ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°å¯¾è±¡ã«è¿½åŠ ã™ã‚‹æç”»ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     */
    addClippedDrawable(drawableIndex) {
        this._clippedDrawableIndexList.push(drawableIndex);
    }
    /**
     * ã“ã®ãƒžã‚¹ã‚¯ã«ã‚¯ãƒªãƒƒãƒ—ã•ã‚Œã‚‹ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã‚’è¿½åŠ ã™ã‚‹
     *
     * @param offscreenIndex ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°å¯¾è±¡ã«è¿½åŠ ã™ã‚‹ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     */
    addClippedOffscreen(offscreenIndex) {
        this._clippedOffscreenIndexList.push(offscreenIndex);
    }
}
// Namespace definition for compatibility.
import * as $ from './cubismrenderer.js';
// eslint-disable-next-line @typescript-eslint/no-namespace
export var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    Live2DCubismFramework.CubismBlendMode = $.CubismBlendMode;
    Live2DCubismFramework.CubismRenderer = $.CubismRenderer;
    Live2DCubismFramework.CubismTextureColor = $.CubismTextureColor;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));
//# sourceMappingURL=cubismrenderer.js.map