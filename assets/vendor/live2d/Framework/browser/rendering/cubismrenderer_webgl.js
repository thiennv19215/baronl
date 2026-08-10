/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
import { NoParentIndex } from '../model/cubismmodel.js';
import { CubismLogError } from '../utils/cubismdebug.js';
import { updateSize } from '../utils/cubismarrayutils.js';
import { CubismClippingManager } from './cubismclippingmanager.js';
import { CubismClippingContext, CubismRenderer, DrawableObjectType } from './cubismrenderer.js';
import { CubismShaderManager_WebGL } from './cubismshader_webgl.js';
const s_invalidValue = -1; // ç„¡åŠ¹ãªå€¤ã‚’è¡¨ã™å®šæ•°
/*
 * ã‚·ã‚§ãƒ¼ãƒ€ã‚’ã‚³ãƒ”ãƒ¼ã™ã‚‹éš›ã«è¡£è£…ã™ã‚‹é ‚ç‚¹ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
 */
const s_renderTargetIndexArray = new Uint16Array([
    0, 1, 2, 2, 1, 3
]);
/**
 * ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ã®å‡¦ç†ã‚’å®Ÿè¡Œã™ã‚‹ã‚¯ãƒ©ã‚¹
 */
export class CubismClippingManager_WebGL extends CubismClippingManager {
    /**
     * WebGLãƒ¬ãƒ³ãƒ€ãƒªãƒ³ã‚°ã‚³ãƒ³ãƒ†ã‚­ã‚¹ãƒˆã‚’è¨­å®šã™ã‚‹
     *
     * @param gl WebGLãƒ¬ãƒ³ãƒ€ãƒªãƒ³ã‚°ã‚³ãƒ³ãƒ†ã‚­ã‚¹ãƒˆ
     */
    setGL(gl) {
        this.gl = gl;
    }
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    constructor() {
        super(CubismClippingContext_WebGL);
    }
    /**
     * ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ã‚³ãƒ³ãƒ†ã‚­ã‚¹ãƒˆã‚’ä½œæˆã™ã‚‹ã€‚ãƒ¢ãƒ‡ãƒ«æç”»æ™‚ã«å®Ÿè¡Œã™ã‚‹ã€‚
     *
     * @param model ãƒ¢ãƒ‡ãƒ«ã®ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹
     * @param renderer ãƒ¬ãƒ³ãƒ€ãƒ©ã®ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹
     * @param lastFbo ãƒ•ãƒ¬ãƒ¼ãƒ ãƒãƒƒãƒ•ã‚¡
     * @param lastViewport ãƒ“ãƒ¥ãƒ¼ãƒãƒ¼ãƒˆ
     * @param drawObjectType æç”»ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã®ã‚¿ã‚¤ãƒ—
     */
    setupClippingContext(model, renderer, lastFbo, lastViewport, drawObjectType) {
        // å…¨ã¦ã®ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ã‚’ç”¨æ„ã™ã‚‹
        // åŒã˜ã‚¯ãƒªãƒƒãƒ—ï¼ˆè¤‡æ•°ã®å ´åˆã¯ã¾ã¨ã‚ã¦ä¸€ã¤ã®ã‚¯ãƒªãƒƒãƒ—ï¼‰ã‚’ä½¿ã†å ´åˆã¯1åº¦ã ã‘è¨­å®šã™ã‚‹
        let usingClipCount = 0;
        for (let clipIndex = 0; clipIndex < this._clippingContextListForMask.length; clipIndex++) {
            // 1ã¤ã®ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ã«é–¢ã—ã¦
            const cc = this._clippingContextListForMask[clipIndex];
            // ã“ã®ã‚¯ãƒªãƒƒãƒ—ã‚’åˆ©ç”¨ã™ã‚‹æç”»ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆç¾¤å…¨ä½“ã‚’å›²ã‚€çŸ©å½¢ã‚’è¨ˆç®—
            switch (drawObjectType) {
                case DrawableObjectType.DrawableObjectType_Drawable:
                default:
                    this.calcClippedDrawableTotalBounds(model, cc);
                    break;
                case DrawableObjectType.DrawableObjectType_Offscreen:
                    this.calcClippedOffscreenTotalBounds(model, cc);
                    break;
            }
            if (cc._isUsing) {
                usingClipCount++; // ä½¿ç”¨ä¸­ã¨ã—ã¦ã‚«ã‚¦ãƒ³ãƒˆ
            }
        }
        if (usingClipCount <= 0) {
            return;
        }
        // ç”Ÿæˆã—ãŸFrameBufferã¨åŒã˜ã‚µã‚¤ã‚ºã§ãƒ“ãƒ¥ãƒ¼ãƒãƒ¼ãƒˆã‚’è¨­å®š
        this.gl.viewport(0, 0, this._clippingMaskBufferSize, this._clippingMaskBufferSize);
        // å¾Œã®è¨ˆç®—ã®ãŸã‚ã«ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ã®æœ€åˆã‚’ã‚»ãƒƒãƒˆ
        switch (drawObjectType) {
            case DrawableObjectType.DrawableObjectType_Drawable:
            default:
                this._currentMaskBuffer = renderer.getDrawableMaskBuffer(0);
                break;
            case DrawableObjectType.DrawableObjectType_Offscreen:
                this._currentMaskBuffer = renderer.getOffscreenMaskBuffer(0);
                break;
        }
        // ---------- ãƒžã‚¹ã‚¯æç”»å‡¦ç† ----------
        this._currentMaskBuffer.beginDraw(lastFbo);
        renderer.preDraw(); // ãƒãƒƒãƒ•ã‚¡ã‚’ã‚¯ãƒªã‚¢ã™ã‚‹
        this.setupLayoutBounds(usingClipCount);
        // ã‚µã‚¤ã‚ºãŒãƒ¬ãƒ³ãƒ€ãƒ¼ãƒ†ã‚¯ã‚¹ãƒãƒ£ã®æžšæ•°ã¨åˆã‚ãªã„å ´åˆã¯åˆã‚ã›ã‚‹
        if (this._clearedMaskBufferFlags.length != this._renderTextureCount) {
            this._clearedMaskBufferFlags.length = 0;
            this._clearedMaskBufferFlags = new Array(this._renderTextureCount);
            for (let i = 0; i < this._clearedMaskBufferFlags.length; i++) {
                this._clearedMaskBufferFlags[i] = false;
            }
        }
        // ãƒžã‚¹ã‚¯ã®ã‚¯ãƒªã‚¢ãƒ•ãƒ©ã‚°ã‚’æ¯Žãƒ•ãƒ¬ãƒ¼ãƒ é–‹å§‹æ™‚ã«åˆæœŸåŒ–
        for (let index = 0; index < this._clearedMaskBufferFlags.length; index++) {
            this._clearedMaskBufferFlags[index] = false;
        }
        // å®Ÿéš›ã«ãƒžã‚¹ã‚¯ã‚’ç”Ÿæˆã™ã‚‹
        // å…¨ã¦ã®ãƒžã‚¹ã‚¯ã‚’ã©ã®ã‚ˆã†ã«ãƒ¬ã‚¤ã‚¢ã‚¦ãƒˆã—ã¦æãã‹ã‚’æ±ºå®šã—ã€ClipContext, ClippedDrawContextã«è¨˜æ†¶ã™ã‚‹
        for (let clipIndex = 0; clipIndex < this._clippingContextListForMask.length; clipIndex++) {
            // --- å®Ÿéš›ã«1ã¤ã®ãƒžã‚¹ã‚¯ã‚’æã ---
            const clipContext = this._clippingContextListForMask[clipIndex];
            const allClipedDrawRect = clipContext._allClippedDrawRect; // ã“ã®ãƒžã‚¹ã‚¯ã‚’ä½¿ã†ã€ã™ã¹ã¦ã®æç”»ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã®è«–ç†åº§æ¨™ä¸Šã®å›²ã¿çŸ©å½¢
            const layoutBoundsOnTex01 = clipContext._layoutBounds; // ã“ã®ä¸­ã«ãƒžã‚¹ã‚¯ã‚’åŽã‚ã‚‹
            const margin = 0.05; // ãƒ¢ãƒ‡ãƒ«åº§æ¨™ä¸Šã®çŸ©å½¢ã‚’ã€é©å®œãƒžãƒ¼ã‚¸ãƒ³ã‚’ä»˜ã‘ã¦ä½¿ã†
            let scaleX = 0;
            let scaleY = 0;
            // clipContextã«è¨­å®šã—ãŸãƒ¬ãƒ³ãƒ€ãƒ¼ãƒ†ã‚¯ã‚¹ãƒãƒ£ã‚’ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ã§å–å¾—
            let maskBuffer;
            switch (drawObjectType) {
                case DrawableObjectType.DrawableObjectType_Drawable:
                default:
                    maskBuffer = renderer.getDrawableMaskBuffer(clipContext._bufferIndex);
                    break;
                case DrawableObjectType.DrawableObjectType_Offscreen:
                    maskBuffer = renderer.getOffscreenMaskBuffer(clipContext._bufferIndex);
                    break;
            }
            // ç¾åœ¨ã®ãƒ¬ãƒ³ãƒ€ãƒ¼ãƒ†ã‚¯ã‚¹ãƒãƒ£ãŒclipContextã®ã‚‚ã®ã¨ç•°ãªã‚‹å ´åˆ
            if (this._currentMaskBuffer != maskBuffer) {
                this._currentMaskBuffer.endDraw(); // å‰ã®ãƒ¬ãƒ³ãƒ€ãƒ¼ãƒ†ã‚¯ã‚¹ãƒãƒ£ã®æç”»ã‚’çµ‚äº†
                this._currentMaskBuffer = maskBuffer;
                this._currentMaskBuffer.beginDraw(lastFbo); // æ–°ã—ã„ãƒ¬ãƒ³ãƒ€ãƒ¼ãƒ†ã‚¯ã‚¹ãƒãƒ£ã®æç”»ã‚’é–‹å§‹
                renderer.preDraw(); // ãƒãƒƒãƒ•ã‚¡ã‚’ã‚¯ãƒªã‚¢ã™ã‚‹
            }
            this._tmpBoundsOnModel.setRect(allClipedDrawRect);
            this._tmpBoundsOnModel.expand(allClipedDrawRect.width * margin, allClipedDrawRect.height * margin);
            //########## æœ¬æ¥ã¯å‰²ã‚Šå½“ã¦ã‚‰ã‚ŒãŸé ˜åŸŸã®å…¨ä½“ã‚’ä½¿ã‚ãšå¿…è¦æœ€ä½Žé™ã®ã‚µã‚¤ã‚ºãŒã‚ˆã„
            // ã‚·ã‚§ãƒ¼ãƒ€ç”¨ã®è¨ˆç®—å¼ã‚’æ±‚ã‚ã‚‹ã€‚å›žè»¢ã‚’è€ƒæ…®ã—ãªã„å ´åˆã¯ä»¥ä¸‹ã®ã¨ãŠã‚Š
            // movePeriod' = movePeriod * scaleX + offX		  [[ movePeriod' = (movePeriod - tmpBoundsOnModel.movePeriod)*scale + layoutBoundsOnTex01.movePeriod ]]
            scaleX = layoutBoundsOnTex01.width / this._tmpBoundsOnModel.width;
            scaleY = layoutBoundsOnTex01.height / this._tmpBoundsOnModel.height;
            //--------- drawæ™‚ã® mask å‚ç…§ç”¨è¡Œåˆ—ã‚’è¨ˆç®—---------
            this.createMatrixForMask(false, layoutBoundsOnTex01, scaleX, scaleY);
            clipContext._matrixForMask.setMatrix(this._tmpMatrixForMask.getArray());
            clipContext._matrixForDraw.setMatrix(this._tmpMatrixForDraw.getArray());
            if (drawObjectType == DrawableObjectType.DrawableObjectType_Offscreen) {
                // clipContext * mvp^-1
                const invertMvp = renderer.getMvpMatrix().getInvert();
                clipContext._matrixForDraw.multiplyByMatrix(invertMvp);
            }
            const clipDrawCount = clipContext._clippingIdCount;
            for (let i = 0; i < clipDrawCount; i++) {
                const clipDrawIndex = clipContext._clippingIdList[i];
                // é ‚ç‚¹æƒ…å ±ãŒæ›´æ–°ã•ã‚Œã¦ãŠã‚‰ãšã€ä¿¡é ¼æ€§ãŒãªã„å ´åˆã¯æç”»ã‚’ãƒ‘ã‚¹ã™ã‚‹
                if (!model.getDrawableDynamicFlagVertexPositionsDidChange(clipDrawIndex)) {
                    continue;
                }
                renderer.setIsCulling(model.getDrawableCulling(clipDrawIndex) != false);
                // ãƒžã‚¹ã‚¯ãŒã‚¯ãƒªã‚¢ã•ã‚Œã¦ã„ãªã„ãªã‚‰å‡¦ç†ã™ã‚‹
                if (!this._clearedMaskBufferFlags[clipContext._bufferIndex]) {
                    // ãƒžã‚¹ã‚¯ã‚’ã‚¯ãƒªã‚¢ã™ã‚‹
                    // (ä»®ä»•æ§˜) 1ãŒç„¡åŠ¹ï¼ˆæã‹ã‚Œãªã„ï¼‰é ˜åŸŸã€0ãŒæœ‰åŠ¹ï¼ˆæã‹ã‚Œã‚‹ï¼‰é ˜åŸŸã€‚ï¼ˆã‚·ã‚§ãƒ¼ãƒ€ãƒ¼Cd*Csã§0ã«è¿‘ã„å€¤ã‚’ã‹ã‘ã¦ãƒžã‚¹ã‚¯ã‚’ä½œã‚‹ã€‚1ã‚’ã‹ã‘ã‚‹ã¨ä½•ã‚‚èµ·ã“ã‚‰ãªã„ï¼‰
                    this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
                    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
                    this._clearedMaskBufferFlags[clipContext._bufferIndex] = true;
                }
                // ä»Šå›žå°‚ç”¨ã®å¤‰æ›ã‚’é©ç”¨ã—ã¦æã
                // ãƒãƒ£ãƒ³ãƒãƒ«ã‚‚åˆ‡ã‚Šæ›¿ãˆã‚‹å¿…è¦ãŒã‚ã‚‹(A,R,G,B)
                renderer.setClippingContextBufferForMask(clipContext);
                renderer.drawMeshWebGL(model, clipDrawIndex);
            }
        }
        // --- å¾Œå‡¦ç† ---
        this._currentMaskBuffer.endDraw(); // ãƒžã‚¹ã‚¯ã®æç”»ã‚’çµ‚äº†
        renderer.setClippingContextBufferForMask(null);
        this.gl.viewport(lastViewport[0], lastViewport[1], lastViewport[2], lastViewport[3]);
    }
    /**
     * ãƒžã‚¹ã‚¯ã®åˆè¨ˆæ•°ã‚’ã‚«ã‚¦ãƒ³ãƒˆ
     *
     * @return ãƒžã‚¹ã‚¯ã®åˆè¨ˆæ•°ã‚’è¿”ã™
     */
    getClippingMaskCount() {
        return this._clippingContextListForMask.length;
    }
}
/**
 * ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ã®ã‚³ãƒ³ãƒ†ã‚­ã‚¹ãƒˆ
 */
export class CubismClippingContext_WebGL extends CubismClippingContext {
    /**
     * å¼•æ•°ä»˜ãã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     *
     * @param manager ãƒžã‚¹ã‚¯ã‚’ç®¡ç†ã—ã¦ã„ã‚‹ãƒžãƒãƒ¼ã‚¸ãƒ£ã®ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹
     * @param clippingDrawableIndices ã‚¯ãƒªãƒƒãƒ—ã—ã¦ã„ã‚‹Drawableã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ãƒªã‚¹ãƒˆ
     * @param clipCount ã‚¯ãƒªãƒƒãƒ—ã—ã¦ã„ã‚‹Drawableã®å€‹æ•°
     */
    constructor(manager, clippingDrawableIndices, clipCount) {
        super(clippingDrawableIndices, clipCount);
        this._owner = manager;
    }
    /**
     * ã“ã®ãƒžã‚¹ã‚¯ã‚’ç®¡ç†ã™ã‚‹ãƒžãƒãƒ¼ã‚¸ãƒ£ã®ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹ã‚’å–å¾—ã™ã‚‹
     *
     * @return ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžãƒãƒ¼ã‚¸ãƒ£ã®ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹
     */
    getClippingManager() {
        return this._owner;
    }
    /**
     * WebGLãƒ¬ãƒ³ãƒ€ãƒªãƒ³ã‚°ã‚³ãƒ³ãƒ†ã‚­ã‚¹ãƒˆã‚’è¨­å®šã™ã‚‹
     *
     * @param gl WebGLãƒ¬ãƒ³ãƒ€ãƒªãƒ³ã‚°ã‚³ãƒ³ãƒ†ã‚­ã‚¹ãƒˆ
     */
    setGl(gl) {
        this._owner.setGL(gl);
    }
}
/**
 * Cubismãƒ¢ãƒ‡ãƒ«ã‚’æç”»ã™ã‚‹ç›´å‰ã®WebGLã®ã‚¹ãƒ†ãƒ¼ãƒˆã‚’ä¿æŒãƒ»å¾©å¸°ã•ã›ã‚‹ã‚¯ãƒ©ã‚¹
 */
export class CubismRendererProfile_WebGL {
    /**
     * WebGLã®æœ‰åŠ¹ãƒ»ç„¡åŠ¹ã‚’ã‚»ãƒƒãƒˆã™ã‚‹
     *
     * @param index æœ‰åŠ¹ãƒ»ç„¡åŠ¹ã«ã™ã‚‹æ©Ÿèƒ½
     * @param enabled trueãªã‚‰æœ‰åŠ¹ã«ã™ã‚‹
     */
    setGlEnable(index, enabled) {
        if (enabled)
            this.gl.enable(index);
        else
            this.gl.disable(index);
    }
    /**
     * WebGLã®Vertex Attribute Arrayæ©Ÿèƒ½ã®æœ‰åŠ¹ãƒ»ç„¡åŠ¹ã‚’ã‚»ãƒƒãƒˆã™ã‚‹
     *
     * @param   index   æœ‰åŠ¹ãƒ»ç„¡åŠ¹ã«ã™ã‚‹æ©Ÿèƒ½
     * @param   enabled trueãªã‚‰æœ‰åŠ¹ã«ã™ã‚‹
     */
    setGlEnableVertexAttribArray(index, enabled) {
        if (enabled)
            this.gl.enableVertexAttribArray(index);
        else
            this.gl.disableVertexAttribArray(index);
    }
    /**
     * WebGLã®ã‚¹ãƒ†ãƒ¼ãƒˆã‚’ä¿æŒã™ã‚‹
     */
    save() {
        if (this.gl == null) {
            CubismLogError("'gl' is null. WebGLRenderingContext is required.\nPlease call 'CubimRenderer_WebGL.startUp' function.");
            return;
        }
        //-- push state --
        this._lastArrayBufferBinding = this.gl.getParameter(this.gl.ARRAY_BUFFER_BINDING);
        this._lastElementArrayBufferBinding = this.gl.getParameter(this.gl.ELEMENT_ARRAY_BUFFER_BINDING);
        this._lastProgram = this.gl.getParameter(this.gl.CURRENT_PROGRAM);
        this._lastActiveTexture = this.gl.getParameter(this.gl.ACTIVE_TEXTURE);
        this.gl.activeTexture(this.gl.TEXTURE1); //ãƒ†ã‚¯ã‚¹ãƒãƒ£ãƒ¦ãƒ‹ãƒƒãƒˆ1ã‚’ã‚¢ã‚¯ãƒ†ã‚£ãƒ–ã«ï¼ˆä»¥å¾Œã®è¨­å®šå¯¾è±¡ã¨ã™ã‚‹ï¼‰
        this._lastTexture1Binding2D = this.gl.getParameter(this.gl.TEXTURE_BINDING_2D);
        this.gl.activeTexture(this.gl.TEXTURE0); //ãƒ†ã‚¯ã‚¹ãƒãƒ£ãƒ¦ãƒ‹ãƒƒãƒˆ0ã‚’ã‚¢ã‚¯ãƒ†ã‚£ãƒ–ã«ï¼ˆä»¥å¾Œã®è¨­å®šå¯¾è±¡ã¨ã™ã‚‹ï¼‰
        this._lastTexture0Binding2D = this.gl.getParameter(this.gl.TEXTURE_BINDING_2D);
        this._lastVertexAttribArrayEnabled[0] = this.gl.getVertexAttrib(0, this.gl.VERTEX_ATTRIB_ARRAY_ENABLED);
        this._lastVertexAttribArrayEnabled[1] = this.gl.getVertexAttrib(1, this.gl.VERTEX_ATTRIB_ARRAY_ENABLED);
        this._lastVertexAttribArrayEnabled[2] = this.gl.getVertexAttrib(2, this.gl.VERTEX_ATTRIB_ARRAY_ENABLED);
        this._lastVertexAttribArrayEnabled[3] = this.gl.getVertexAttrib(3, this.gl.VERTEX_ATTRIB_ARRAY_ENABLED);
        this._lastScissorTest = this.gl.isEnabled(this.gl.SCISSOR_TEST);
        this._lastStencilTest = this.gl.isEnabled(this.gl.STENCIL_TEST);
        this._lastDepthTest = this.gl.isEnabled(this.gl.DEPTH_TEST);
        this._lastCullFace = this.gl.isEnabled(this.gl.CULL_FACE);
        this._lastBlend = this.gl.isEnabled(this.gl.BLEND);
        this._lastFrontFace = this.gl.getParameter(this.gl.FRONT_FACE);
        this._lastColorMask = this.gl.getParameter(this.gl.COLOR_WRITEMASK);
        // backup blending
        this._lastBlending[0] = this.gl.getParameter(this.gl.BLEND_SRC_RGB);
        this._lastBlending[1] = this.gl.getParameter(this.gl.BLEND_DST_RGB);
        this._lastBlending[2] = this.gl.getParameter(this.gl.BLEND_SRC_ALPHA);
        this._lastBlending[3] = this.gl.getParameter(this.gl.BLEND_DST_ALPHA);
    }
    /**
     * ä¿æŒã—ãŸWebGLã®ã‚¹ãƒ†ãƒ¼ãƒˆã‚’å¾©å¸°ã•ã›ã‚‹
     */
    restore() {
        if (this.gl == null) {
            CubismLogError("'gl' is null. WebGLRenderingContext is required.\nPlease call 'CubimRenderer_WebGL.startUp' function.");
            return;
        }
        this.gl.useProgram(this._lastProgram);
        this.setGlEnableVertexAttribArray(0, this._lastVertexAttribArrayEnabled[0]);
        this.setGlEnableVertexAttribArray(1, this._lastVertexAttribArrayEnabled[1]);
        this.setGlEnableVertexAttribArray(2, this._lastVertexAttribArrayEnabled[2]);
        this.setGlEnableVertexAttribArray(3, this._lastVertexAttribArrayEnabled[3]);
        this.setGlEnable(this.gl.SCISSOR_TEST, this._lastScissorTest);
        this.setGlEnable(this.gl.STENCIL_TEST, this._lastStencilTest);
        this.setGlEnable(this.gl.DEPTH_TEST, this._lastDepthTest);
        this.setGlEnable(this.gl.CULL_FACE, this._lastCullFace);
        this.setGlEnable(this.gl.BLEND, this._lastBlend);
        this.gl.frontFace(this._lastFrontFace);
        this.gl.colorMask(this._lastColorMask[0], this._lastColorMask[1], this._lastColorMask[2], this._lastColorMask[3]);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this._lastArrayBufferBinding); //å‰ã«ãƒãƒƒãƒ•ã‚¡ãŒãƒã‚¤ãƒ³ãƒ‰ã•ã‚Œã¦ã„ãŸã‚‰ç ´æ£„ã™ã‚‹å¿…è¦ãŒã‚ã‚‹
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this._lastElementArrayBufferBinding);
        this.gl.activeTexture(this.gl.TEXTURE1); //ãƒ†ã‚¯ã‚¹ãƒãƒ£ãƒ¦ãƒ‹ãƒƒãƒˆ1ã‚’å¾©å…ƒ
        this.gl.bindTexture(this.gl.TEXTURE_2D, this._lastTexture1Binding2D);
        this.gl.activeTexture(this.gl.TEXTURE0); //ãƒ†ã‚¯ã‚¹ãƒãƒ£ãƒ¦ãƒ‹ãƒƒãƒˆ0ã‚’å¾©å…ƒ
        this.gl.bindTexture(this.gl.TEXTURE_2D, this._lastTexture0Binding2D);
        this.gl.activeTexture(this._lastActiveTexture);
        this.gl.blendFuncSeparate(this._lastBlending[0], this._lastBlending[1], this._lastBlending[2], this._lastBlending[3]);
    }
    /**
     * WebGLãƒ¬ãƒ³ãƒ€ãƒªãƒ³ã‚°ã‚³ãƒ³ãƒ†ã‚­ã‚¹ãƒˆã‚’è¨­å®šã™ã‚‹
     *
     * @param gl WebGLãƒ¬ãƒ³ãƒ€ãƒªãƒ³ã‚°ã‚³ãƒ³ãƒ†ã‚­ã‚¹ãƒˆ
     */
    setGl(gl) {
        this.gl = gl;
    }
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    constructor() {
        this._lastVertexAttribArrayEnabled = new Array(4);
        this._lastColorMask = new Array(4);
        this._lastBlending = new Array(4);
    }
}
/**
 * WebGLç”¨ã®æç”»å‘½ä»¤ã‚’å®Ÿè£…ã—ãŸã‚¯ãƒ©ã‚¹
 */
export class CubismRenderer_WebGL extends CubismRenderer {
    /**
     * ãƒ¬ãƒ³ãƒ€ãƒ©ã®åˆæœŸåŒ–å‡¦ç†ã‚’å®Ÿè¡Œã™ã‚‹
     * å¼•æ•°ã«æ¸¡ã—ãŸãƒ¢ãƒ‡ãƒ«ã‹ã‚‰ãƒ¬ãƒ³ãƒ€ãƒ©ã®åˆæœŸåŒ–å‡¦ç†ã«å¿…è¦ãªæƒ…å ±ã‚’å–ã‚Šå‡ºã™ã“ã¨ãŒã§ãã‚‹
     * NOTE: WebGLã‚³ãƒ³ãƒ†ã‚­ã‚¹ãƒˆãŒåˆæœŸåŒ–ã•ã‚Œã¦ã„ãªã„å¯èƒ½æ€§ãŒã‚ã‚‹ãŸã‚ã€ã“ã“ã§ã¯WebGLã‚³ãƒ³ãƒ†ã‚­ã‚¹ãƒˆã‚’ä½¿ã†åˆæœŸåŒ–ã¯è¡Œã‚ãªã„ã€‚
     *
     * @param model ãƒ¢ãƒ‡ãƒ«ã®ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹
     * @param maskBufferCount ãƒãƒƒãƒ•ã‚¡ã®ç”Ÿæˆæ•°
     */
    initialize(model, maskBufferCount = 1) {
        if (model.isUsingMasking()) {
            this._drawableClippingManager = new CubismClippingManager_WebGL(); // ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ãƒ»ãƒãƒƒãƒ•ã‚¡å‰å‡¦ç†æ–¹å¼ã‚’åˆæœŸåŒ–
            this._drawableClippingManager.initializeForDrawable(model, maskBufferCount);
        }
        if (model.isUsingMaskingForOffscreen()) {
            this._offscreenClippingManager = new CubismClippingManager_WebGL(); //ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ãƒ»ãƒãƒƒãƒ•ã‚¡å‰å‡¦ç†æ–¹å¼ã‚’åˆæœŸåŒ–
            this._offscreenClippingManager.initializeForOffscreen(model, maskBufferCount);
        }
        // IndexList ã¨ TypeListã®ã‚µã‚¤ã‚ºã‚’ãƒ¢ãƒ‡ãƒ«ã®æç”»ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆæ•°ã«åˆã‚ã›ã‚‹
        updateSize(this._sortedObjectsIndexList, model.getDrawableCount() +
            (model.getOffscreenCount ? model.getOffscreenCount() : 0), 0, true);
        updateSize(this._sortedObjectsTypeList, model.getDrawableCount() +
            (model.getOffscreenCount ? model.getOffscreenCount() : 0), 0, true);
        super.initialize(model); // è¦ªã‚¯ãƒ©ã‚¹ã®å‡¦ç†ã‚’å‘¼ã¶
    }
    /**
     * ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã®è¦ªã‚’æŽ¢ã—ã¦è¨­å®šã™ã‚‹
     *
     * @param model ãƒ¢ãƒ‡ãƒ«ã®ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹
     * @param offscreenCount ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã®æ•°
     */
    setupParentOffscreens(model, offscreenCount) {
        let parentOffscreen;
        for (let offscreenIndex = 0; offscreenIndex < offscreenCount; ++offscreenIndex) {
            parentOffscreen = null;
            const ownerIndex = model.getOffscreenOwnerIndices()[offscreenIndex];
            let parentIndex = model.getPartParentPartIndices()[ownerIndex];
            // è¦ªã®ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã‚’æŽ¢ã™
            while (parentIndex != NoParentIndex) {
                for (let i = 0; i < offscreenCount; ++i) {
                    const ownerIndex = model.getOffscreenOwnerIndices()[this._offscreenList[i].getOffscreenIndex()];
                    if (ownerIndex != parentIndex) {
                        continue; //ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã®æ‰€æœ‰è€…ãŒãƒ‘ãƒ¼ãƒ„ã§ã¯ãªã„å ´åˆã¯ã‚¹ã‚­ãƒƒãƒ—
                    }
                    parentOffscreen = this._offscreenList[i];
                    break;
                }
                if (parentOffscreen != null) {
                    break; // è¦ªã®ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ãŒè¦‹ã¤ã‹ã£ãŸå ´åˆã¯ãƒ«ãƒ¼ãƒ—ã‚’æŠœã‘ã‚‹
                }
                parentIndex = model.getPartParentPartIndices()[parentIndex];
            }
            // è¦ªã®ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã‚’è¨­å®š
            this._offscreenList[offscreenIndex].setParentPartOffscreen(parentOffscreen);
        }
    }
    /**
     * WebGLãƒ†ã‚¯ã‚¹ãƒãƒ£ã®ãƒã‚¤ãƒ³ãƒ‰å‡¦ç†
     * CubismRendererã«ãƒ†ã‚¯ã‚¹ãƒãƒ£ã‚’è¨­å®šã—ã€CubismRendererå†…ã§ãã®ç”»åƒã‚’å‚ç…§ã™ã‚‹ãŸã‚ã®Indexå€¤ã‚’æˆ»ã‚Šå€¤ã¨ã™ã‚‹
     *
     * @param modelTextureNo ã‚»ãƒƒãƒˆã™ã‚‹ãƒ¢ãƒ‡ãƒ«ãƒ†ã‚¯ã‚¹ãƒãƒ£ã®ç•ªå·
     * @param glTextureNo WebGLãƒ†ã‚¯ã‚¹ãƒãƒ£ã®ç•ªå·
     */
    bindTexture(modelTextureNo, glTexture) {
        this._textures.set(modelTextureNo, glTexture);
    }
    /**
     * WebGLã«ãƒã‚¤ãƒ³ãƒ‰ã•ã‚ŒãŸãƒ†ã‚¯ã‚¹ãƒãƒ£ã®ãƒªã‚¹ãƒˆã‚’å–å¾—ã™ã‚‹
     *
     * @return ãƒ†ã‚¯ã‚¹ãƒãƒ£ã®ãƒªã‚¹ãƒˆ
     */
    getBindedTextures() {
        return this._textures;
    }
    /**
     * ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ãƒãƒƒãƒ•ã‚¡ã®ã‚µã‚¤ã‚ºã‚’è¨­å®šã™ã‚‹
     * ãƒžã‚¹ã‚¯ç”¨ã®FrameBufferã‚’ç ´æ£„ã€å†ä½œæˆã™ã‚‹ç‚ºå‡¦ç†ã‚³ã‚¹ãƒˆã¯é«˜ã„
     *
     * @param size ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ãƒãƒƒãƒ•ã‚¡ã®ã‚µã‚¤ã‚º
     */
    setClippingMaskBufferSize(size) {
        // ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ã‚’åˆ©ç”¨ã—ãªã„å ´åˆã¯æ—©æœŸãƒªã‚¿ãƒ¼ãƒ³
        if (!this._model.isUsingMasking()) {
            return;
        }
        // ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹ç ´æ£„å‰ã«ãƒ¬ãƒ³ãƒ€ãƒ¼ãƒ†ã‚¯ã‚¹ãƒãƒ£ã®æ•°ã‚’ä¿å­˜
        const renderTextureCount = this._drawableClippingManager.getRenderTextureCount();
        // FrameBufferã®ã‚µã‚¤ã‚ºã‚’å¤‰æ›´ã™ã‚‹ãŸã‚ã«ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹ã‚’ç ´æ£„ãƒ»å†ä½œæˆã™ã‚‹
        this._drawableClippingManager.release();
        this._drawableClippingManager = void 0;
        this._drawableClippingManager = null;
        this._drawableClippingManager = new CubismClippingManager_WebGL();
        this._drawableClippingManager.setClippingMaskBufferSize(size);
        this._drawableClippingManager.initializeForDrawable(this.getModel(), renderTextureCount // ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹ç ´æ£„å‰ã«ä¿å­˜ã—ãŸãƒ¬ãƒ³ãƒ€ãƒ¼ãƒ†ã‚¯ã‚¹ãƒãƒ£ã®æ•°
        );
    }
    /**
     * ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ãƒãƒƒãƒ•ã‚¡ã®ã‚µã‚¤ã‚ºã‚’å–å¾—ã™ã‚‹
     *
     * @return ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ãƒãƒƒãƒ•ã‚¡ã®ã‚µã‚¤ã‚º
     */
    getClippingMaskBufferSize() {
        return this._model.isUsingMasking()
            ? this._drawableClippingManager.getClippingMaskBufferSize()
            : s_invalidValue;
    }
    /**
     * ãƒ–ãƒ¬ãƒ³ãƒ‰ãƒ¢ãƒ¼ãƒ‰ç”¨ã®ãƒ•ãƒ¬ãƒ¼ãƒ ãƒãƒƒãƒ•ã‚¡ã‚’å–å¾—ã™ã‚‹
     *
     * @return ãƒ–ãƒ¬ãƒ³ãƒ‰ãƒ¢ãƒ¼ãƒ‰ç”¨ã®ãƒ•ãƒ¬ãƒ¼ãƒ ãƒãƒƒãƒ•ã‚¡
     */
    getModelRenderTarget(index) {
        return this._modelRenderTargets[index];
    }
    /**
     * ãƒ¬ãƒ³ãƒ€ãƒ¼ãƒ†ã‚¯ã‚¹ãƒãƒ£ã®æžšæ•°ã‚’å–å¾—ã™ã‚‹
     * @return ãƒ¬ãƒ³ãƒ€ãƒ¼ãƒ†ã‚¯ã‚¹ãƒãƒ£ã®æžšæ•°
     */
    getRenderTextureCount() {
        return this._model.isUsingMasking()
            ? this._drawableClippingManager.getRenderTextureCount()
            : s_invalidValue;
    }
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    constructor(width, height) {
        super(width, height);
        this._clippingContextBufferForMask = null;
        this._clippingContextBufferForDraw = null;
        this._rendererProfile = new CubismRendererProfile_WebGL();
        this._textures = new Map();
        this._sortedObjectsIndexList = new Array();
        this._sortedObjectsTypeList = new Array();
        this._bufferData = {
            vertex: (WebGLBuffer = null),
            uv: (WebGLBuffer = null),
            index: (WebGLBuffer = null)
        };
        this._modelRenderTargets = new Array();
        this._drawableMasks = new Array();
        this._currentFbo = null;
        this._drawableClippingManager = null;
        this._offscreenClippingManager = null;
        this._offscreenMasks = new Array();
        this._offscreenList = new Array();
        // ãƒ†ã‚¯ã‚¹ãƒãƒ£å¯¾å¿œãƒžãƒƒãƒ—ã®å®¹é‡ã‚’ç¢ºä¿ã—ã¦ãŠã
        // this._textures.prepareCapacity(32, true);
    }
    /**
     * ãƒ‡ã‚¹ãƒˆãƒ©ã‚¯ã‚¿ç›¸å½“ã®å‡¦ç†
     */
    release() {
        if (this._drawableClippingManager) {
            this._drawableClippingManager.release();
            this._drawableClippingManager = void 0;
            this._drawableClippingManager = null;
        }
        if (this.gl == null) {
            return;
        }
        this.gl.deleteBuffer(this._bufferData.vertex);
        this._bufferData.vertex = null;
        this.gl.deleteBuffer(this._bufferData.uv);
        this._bufferData.uv = null;
        this.gl.deleteBuffer(this._bufferData.index);
        this._bufferData.index = null;
        this._bufferData = null;
        this._textures = null;
        for (let i = 0; i < this._modelRenderTargets.length; i++) {
            if (this._modelRenderTargets[i] != null &&
                this._modelRenderTargets[i].isValid()) {
                this._modelRenderTargets[i].destroyRenderTarget();
            }
        }
        this._modelRenderTargets.length = 0;
        this._modelRenderTargets = null;
        for (let i = 0; i < this._drawableMasks.length; i++) {
            if (this._drawableMasks[i] != null && this._drawableMasks[i].isValid()) {
                this._drawableMasks[i].destroyRenderTarget();
            }
        }
        this._drawableMasks.length = 0;
        this._drawableMasks = null;
        for (let i = 0; i < this._offscreenMasks.length; i++) {
            if (this._offscreenMasks[i] != null &&
                this._offscreenMasks[i].isValid()) {
                this._offscreenMasks[i].destroyRenderTarget();
            }
        }
        this._offscreenMasks.length = 0;
        this._offscreenMasks = null;
        for (let i = 0; i < this._offscreenList.length; i++) {
            if (this._offscreenList[i] != null && this._offscreenList[i].isValid()) {
                this._offscreenList[i].destroyRenderTarget();
            }
        }
        this._offscreenList.length = 0;
        this._offscreenList = null;
        this._offscreenClippingManager = null;
        this._drawableClippingManager = null;
        this._clippingContextBufferForMask = null;
        this._clippingContextBufferForDraw = null;
        this._rendererProfile = null;
        this._sortedObjectsIndexList = null;
        this._sortedObjectsTypeList = null;
        this._currentFbo = null;
        this._model = null;
        this.gl = null;
    }
    /**
     * Shaderã®èª­ã¿è¾¼ã¿ã‚’è¡Œã†
     * @param shaderPath ã‚·ã‚§ãƒ¼ãƒ€ã®ãƒ‘ã‚¹
     */
    loadShaders(shaderPath = null) {
        if (this.gl == null) {
            CubismLogError("'gl' is null. WebGLRenderingContext is required.\nPlease call 'CubimRenderer_WebGL.startUp' function.");
            return;
        }
        if (CubismShaderManager_WebGL.getInstance().getShader(this.gl)._shaderSets
            .length == 0 ||
            !CubismShaderManager_WebGL.getInstance().getShader(this.gl)
                ._isShaderLoaded) {
            const shader = CubismShaderManager_WebGL.getInstance().getShader(this.gl);
            if (shaderPath != null) {
                shader.setShaderPath(shaderPath);
            }
            shader.generateShaders();
        }
    }
    /**
     * ãƒ¢ãƒ‡ãƒ«ã‚’æç”»ã™ã‚‹å®Ÿéš›ã®å‡¦ç†
     * @param shaderPath ã‚·ã‚§ãƒ¼ãƒ€ã®ãƒ‘ã‚¹
     */
    doDrawModel(shaderPath = null) {
        this.loadShaders(shaderPath);
        this.beforeDrawModelRenderTarget();
        const lastFbo = this.gl.getParameter(this.gl.FRAMEBUFFER_BINDING);
        const lastViewport = this.gl.getParameter(this.gl.VIEWPORT);
        // //------------ ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ãƒ»ãƒãƒƒãƒ•ã‚¡å‰å‡¦ç†æ–¹å¼ã®å ´åˆ ------------
        if (this._drawableClippingManager != null) {
            this.preDraw();
            for (let i = 0; i < this._drawableClippingManager.getRenderTextureCount(); ++i) {
                if (this._drawableMasks[i].getBufferWidth() !=
                    this._drawableClippingManager.getClippingMaskBufferSize() ||
                    this._drawableMasks[i].getBufferHeight() !=
                        this._drawableClippingManager.getClippingMaskBufferSize()) {
                    // ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ã®ã‚µã‚¤ã‚ºãŒå¤‰æ›´ã•ã‚ŒãŸå ´åˆã¯ã€ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã‚µãƒ¼ãƒ•ã‚§ã‚¹ã‚’å†ä½œæˆã™ã‚‹
                    this._drawableMasks[i].createRenderTarget(this.gl, this._drawableClippingManager.getClippingMaskBufferSize(), this._drawableClippingManager.getClippingMaskBufferSize(), lastFbo);
                }
            }
            if (this.isUsingHighPrecisionMask()) {
                this._drawableClippingManager.setupMatrixForHighPrecision(this.getModel(), false);
            }
            else {
                this._drawableClippingManager.setupClippingContext(this.getModel(), this, lastFbo, lastViewport, DrawableObjectType.DrawableObjectType_Drawable);
            }
        }
        if (this._offscreenClippingManager != null) {
            this.preDraw();
            // ã‚µã‚¤ã‚ºãŒé•ã†å ´åˆã¯ã“ã“ã§ä½œæˆã—ãªãŠã—
            for (let i = 0; i < this._offscreenClippingManager.getRenderTextureCount(); ++i) {
                if (this._offscreenMasks[i].getBufferWidth() !=
                    this._offscreenClippingManager.getClippingMaskBufferSize() ||
                    this._offscreenMasks[i].getBufferHeight() !=
                        this._offscreenClippingManager.getClippingMaskBufferSize()) {
                    this._offscreenMasks[i].createRenderTarget(this.gl, this._offscreenClippingManager.getClippingMaskBufferSize(), this._offscreenClippingManager.getClippingMaskBufferSize(), lastFbo);
                }
            }
            if (this.isUsingHighPrecisionMask()) {
                this._offscreenClippingManager.setupMatrixForOffscreenHighPrecision(this.getModel(), false, this.getMvpMatrix());
            }
            else {
                this._offscreenClippingManager.setupClippingContext(this.getModel(), this, lastFbo, lastViewport, DrawableObjectType.DrawableObjectType_Offscreen);
            }
        }
        // ä¸Šè¨˜ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°å‡¦ç†å†…ã§ã‚‚ä¸€åº¦PreDrawã‚’å‘¼ã¶ã®ã§æ³¨æ„!!
        this.preDraw();
        this.drawObjectLoop(lastFbo);
        this.afterDrawModelRenderTarget();
    }
    /**
     * æç”»ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã®ãƒ«ãƒ¼ãƒ—å‡¦ç†ã‚’è¡Œã†ã€‚
     *
     * @param lastFbo å‰å›žã®ãƒ•ãƒ¬ãƒ¼ãƒ ãƒãƒƒãƒ•ã‚¡
     */
    drawObjectLoop(lastFbo) {
        const model = this.getModel();
        const drawableCount = model.getDrawableCount();
        const offscreenCount = model.getOffscreenCount();
        const totalCount = drawableCount + offscreenCount;
        const renderOrder = model.getRenderOrders();
        this._currentOffscreen = null; // ç¾åœ¨ã®ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã‚’åˆæœŸåŒ–
        this._currentFbo = lastFbo;
        this._modelRootFbo = lastFbo;
        // ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ã‚’æç”»é †ã§ã‚½ãƒ¼ãƒˆ
        for (let i = 0; i < totalCount; ++i) {
            const order = renderOrder[i];
            if (i < drawableCount) {
                this._sortedObjectsIndexList[order] = i;
                this._sortedObjectsTypeList[order] =
                    DrawableObjectType.DrawableObjectType_Drawable;
            }
            else if (i < totalCount) {
                this._sortedObjectsIndexList[order] = i - drawableCount;
                this._sortedObjectsTypeList[order] =
                    DrawableObjectType.DrawableObjectType_Offscreen;
            }
        }
        // æç”»
        for (let i = 0; i < totalCount; ++i) {
            const objectIndex = this._sortedObjectsIndexList[i];
            const objectType = this._sortedObjectsTypeList[i];
            this.renderObject(objectIndex, objectType);
        }
        while (this._currentOffscreen != null) {
            // ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ãŒæ®‹ã£ã¦ã„ã‚‹å ´åˆã¯è¦ªã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã¸ã®ä¼æ¬ã‚’è¡Œã†
            this.submitDrawToParentOffscreen(this._currentOffscreen.getOffscreenIndex(), DrawableObjectType.DrawableObjectType_Offscreen);
        }
    }
    /**
     * æç”»ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã‚’æç”»ã™ã‚‹ã€‚
     *
     * @param objectIndex æç”»å¯¾è±¡ã®ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @param objectType æç”»å¯¾è±¡ã®ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã®ã‚¿ã‚¤ãƒ—
     * @param lastFbo å‰å›žã®ãƒ•ãƒ¬ãƒ¼ãƒ ãƒãƒƒãƒ•ã‚¡
     * @param lastViewport å‰å›žã®ãƒ“ãƒ¥ãƒ¼ãƒãƒ¼ãƒˆ
     */
    renderObject(objectIndex, objectType) {
        switch (objectType) {
            case DrawableObjectType.DrawableObjectType_Drawable:
                this.drawDrawable(objectIndex, this._modelRootFbo);
                break;
            case DrawableObjectType.DrawableObjectType_Offscreen:
                this.addOffscreen(objectIndex);
                break;
            default:
                CubismLogError('Unknown object type: ' + objectType);
                break;
        }
    }
    /**
     * æç”»ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆï¼ˆã‚¢ãƒ¼ãƒˆãƒ¡ãƒƒã‚·ãƒ¥ï¼‰ã‚’æç”»ã™ã‚‹ã€‚
     *
     * @param model æç”»å¯¾è±¡ã®ãƒ¢ãƒ‡ãƒ«
     * @param index æç”»å¯¾è±¡ã®ãƒ¡ãƒƒã‚·ãƒ¥ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     */
    drawDrawable(drawableIndex, rootFbo) {
        // DrawableãŒè¡¨ç¤ºçŠ¶æ…‹ã§ãªã‘ã‚Œã°å‡¦ç†ã‚’ãƒ‘ã‚¹ã™ã‚‹
        if (!this.getModel().getDrawableDynamicFlagIsVisible(drawableIndex)) {
            return;
        }
        this.submitDrawToParentOffscreen(drawableIndex, DrawableObjectType.DrawableObjectType_Drawable);
        const clipContext = this._drawableClippingManager != null
            ? this._drawableClippingManager.getClippingContextListForDraw()[drawableIndex]
            : null;
        if (clipContext != null && this.isUsingHighPrecisionMask()) {
            // æãã“ã¨ã«ãªã£ã¦ã„ãŸ
            if (clipContext._isUsing) {
                // ç”Ÿæˆã—ãŸFrameBufferã¨åŒã˜ã‚µã‚¤ã‚ºã§ãƒ“ãƒ¥ãƒ¼ãƒãƒ¼ãƒˆã‚’è¨­å®š
                this.gl.viewport(0, 0, this._drawableClippingManager.getClippingMaskBufferSize(), this._drawableClippingManager.getClippingMaskBufferSize());
                this.preDraw(); // ãƒãƒƒãƒ•ã‚¡ã‚’ã‚¯ãƒªã‚¢ã™ã‚‹
                // ---------- ãƒžã‚¹ã‚¯æç”»å‡¦ç† ----------
                // ãƒžã‚¹ã‚¯ç”¨RenderTextureã‚’activeã«ã‚»ãƒƒãƒˆ
                this.getDrawableMaskBuffer(clipContext._bufferIndex).beginDraw(this._currentFbo);
                // ãƒžã‚¹ã‚¯ã‚’ã‚¯ãƒªã‚¢ã™ã‚‹
                // (ä»®ä»•æ§˜) 1ãŒç„¡åŠ¹ï¼ˆæã‹ã‚Œãªã„ï¼‰é ˜åŸŸã€0ãŒæœ‰åŠ¹ï¼ˆæã‹ã‚Œã‚‹ï¼‰é ˜åŸŸã€‚ï¼ˆã‚·ã‚§ãƒ¼ãƒ€ãƒ¼Cd*Csã§0ã«è¿‘ã„å€¤ã‚’ã‹ã‘ã¦ãƒžã‚¹ã‚¯ã‚’ä½œã‚‹ã€‚1ã‚’ã‹ã‘ã‚‹ã¨ä½•ã‚‚èµ·ã“ã‚‰ãªã„ï¼‰
                this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
                this.gl.clear(this.gl.COLOR_BUFFER_BIT);
            }
            {
                const clipDrawCount = clipContext._clippingIdCount;
                for (let index = 0; index < clipDrawCount; index++) {
                    const clipDrawIndex = clipContext._clippingIdList[index];
                    // é ‚ç‚¹æƒ…å ±ãŒæ›´æ–°ã•ã‚Œã¦ãŠã‚‰ãšã€ä¿¡é ¼æ€§ãŒãªã„å ´åˆã¯æç”»ã‚’ãƒ‘ã‚¹ã™ã‚‹
                    if (!this._model.getDrawableDynamicFlagVertexPositionsDidChange(clipDrawIndex)) {
                        continue;
                    }
                    this.setIsCulling(this._model.getDrawableCulling(clipDrawIndex) != false);
                    // ä»Šå›žå°‚ç”¨ã®å¤‰æ›ã‚’é©ç”¨ã—ã¦æã
                    // ãƒãƒ£ãƒ³ãƒãƒ«ã‚‚åˆ‡ã‚Šæ›¿ãˆã‚‹å¿…è¦ãŒã‚ã‚‹(A,R,G,B)
                    this.setClippingContextBufferForMask(clipContext);
                    this.drawMeshWebGL(this._model, clipDrawIndex);
                }
                // --- å¾Œå‡¦ç† ---
                this.getDrawableMaskBuffer(clipContext._bufferIndex).endDraw();
                this.setClippingContextBufferForMask(null);
                this.gl.viewport(0, 0, this._modelRenderTargetWidth, this._modelRenderTargetHeight);
                this.preDraw(); // ãƒãƒƒãƒ•ã‚¡ã‚’ã‚¯ãƒªã‚¢ã™ã‚‹
            }
        }
        // ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ã‚’ã‚»ãƒƒãƒˆã™ã‚‹
        this.setClippingContextBufferForDrawable(clipContext);
        this.setIsCulling(this.getModel().getDrawableCulling(drawableIndex));
        this.drawMeshWebGL(this._model, drawableIndex);
    }
    /**
     * æç”»ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆï¼ˆã‚¢ãƒ¼ãƒˆãƒ¡ãƒƒã‚·ãƒ¥ï¼‰ã‚’æç”»ã™ã‚‹ã€‚
     *
     * @param model æç”»å¯¾è±¡ã®ãƒ¢ãƒ‡ãƒ«
     * @param index æç”»å¯¾è±¡ã®ãƒ¡ãƒƒã‚·ãƒ¥ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     */
    drawMeshWebGL(model, index) {
        // è£é¢æç”»ã®æœ‰åŠ¹ãƒ»ç„¡åŠ¹
        if (this.isCulling()) {
            this.gl.enable(this.gl.CULL_FACE);
        }
        else {
            this.gl.disable(this.gl.CULL_FACE);
        }
        this.gl.frontFace(this.gl.CCW); // Cubism SDK OpenGLã¯ãƒžã‚¹ã‚¯ãƒ»ã‚¢ãƒ¼ãƒˆãƒ¡ãƒƒã‚·ãƒ¥å…±ã«CCWãŒè¡¨é¢
        if (this.isGeneratingMask()) {
            CubismShaderManager_WebGL.getInstance()
                .getShader(this.gl)
                .setupShaderProgramForMask(this, model, index);
        }
        else {
            CubismShaderManager_WebGL.getInstance()
                .getShader(this.gl)
                .setupShaderProgramForDrawable(this, model, index);
        }
        if (!CubismShaderManager_WebGL.getInstance().getShader(this.gl)
            ._isShaderLoaded) {
            // ã‚·ã‚§ãƒ¼ãƒ€ãƒ¼ãŒãƒ­ãƒ¼ãƒ‰ã•ã‚Œã¦ã„ãªã„å ´åˆã¯æç”»ã‚’è¡Œã‚ãªã„
            // NOTE: Cubism 5.2 ä»¥å‰ã®ãƒ¢ãƒ‡ãƒ«æç”»æ™‚ã«ã®ã¿ã€ãƒžã‚¹ã‚¯ç„¡ã—ã®ãƒ¢ãƒ‡ãƒ«ãŒæç”»ã•ã‚Œã¦ã—ã¾ã†ãŸã‚ã“ã“ã§æ—©æœŸãƒªã‚¿ãƒ¼ãƒ³
            return;
        }
        {
            const indexCount = model.getDrawableVertexIndexCount(index);
            this.gl.drawElements(this.gl.TRIANGLES, indexCount, this.gl.UNSIGNED_SHORT, 0);
        }
        // å¾Œå‡¦ç†
        this.gl.useProgram(null);
        this.setClippingContextBufferForDrawable(null);
        this.setClippingContextBufferForMask(null);
    }
    /**
     * ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã‚’è¦ªã®ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã«ã‚³ãƒ”ãƒ¼ã™ã‚‹ã€‚
     *
     * @param objectIndex ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @param objectType  ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã®ç¨®é¡ž
     */
    submitDrawToParentOffscreen(objectIndex, objectType) {
        if (this._currentOffscreen == null || objectIndex == s_invalidValue) {
            return;
        }
        const currentOwnerIndex = this.getModel().getOffscreenOwnerIndices()[this._currentOffscreen.getOffscreenIndex()];
        // ã‚ªãƒ¼ãƒŠãƒ¼ãŒä¸æ˜Žãªå ´åˆã¯å‡¦ç†ã‚’çµ‚äº†
        if (currentOwnerIndex == s_invalidValue) {
            return;
        }
        let targetParentIndex = NoParentIndex;
        switch (objectType) {
            case DrawableObjectType.DrawableObjectType_Drawable:
                targetParentIndex =
                    this.getModel().getDrawableParentPartIndex(objectIndex);
                break;
            case DrawableObjectType.DrawableObjectType_Offscreen:
                targetParentIndex =
                    this.getModel().getPartParentPartIndices()[this.getModel().getOffscreenOwnerIndices()[objectIndex]];
                break;
            default:
                // ä¸æ˜Žãªã‚¿ã‚¤ãƒ—ã ã£ãŸå ´åˆã¯å‡¦ç†ã‚’çµ‚äº†
                return;
        }
        while (targetParentIndex != NoParentIndex) {
            // ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã®è¦ªãŒç¾åœ¨ã®ã‚ªãƒ¼ãƒŠãƒ¼ã¨åŒã˜å ´åˆã¯å‡¦ç†ã‚’çµ‚äº†
            if (targetParentIndex == currentOwnerIndex) {
                return;
            }
            targetParentIndex =
                this.getModel().getPartParentPartIndices()[targetParentIndex];
        }
        // æç”»
        this.drawOffscreen(this._currentOffscreen);
        // ã•ã‚‰ã«è¦ªã®ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã«ä¼æ¬å¯èƒ½ãªã‚‰ä¼æ¬ã™ã‚‹
        this.submitDrawToParentOffscreen(objectIndex, objectType);
    }
    /**
     * æç”»ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆï¼ˆã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ï¼‰ã‚’è¿½åŠ ã™ã‚‹ã€‚
     *
     * @param offscreenIndex ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     */
    addOffscreen(offscreenIndex) {
        // ä»¥å‰ã®ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ãƒ¬ãƒ³ãƒ€ãƒªãƒ³ã‚°ã‚¿ãƒ¼ã‚²ãƒƒãƒˆã‚’è¦ªã«ä¼æ¬ã™ã‚‹å‡¦ç†ã‚’è¿½åŠ ã™ã‚‹
        if (this._currentOffscreen != null &&
            this._currentOffscreen.getOffscreenIndex() != offscreenIndex) {
            let isParent = false;
            const ownerIndex = this.getModel().getOffscreenOwnerIndices()[offscreenIndex];
            let parentIndex = this.getModel().getPartParentPartIndices()[ownerIndex];
            const currentOffscreenIndex = this._currentOffscreen.getOffscreenIndex();
            const currentOffscreenOwnerIndex = this.getModel().getOffscreenOwnerIndices()[currentOffscreenIndex];
            while (parentIndex != NoParentIndex) {
                if (parentIndex == currentOffscreenOwnerIndex) {
                    isParent = true;
                    break;
                }
                parentIndex = this.getModel().getPartParentPartIndices()[parentIndex];
            }
            if (!isParent) {
                // ç¾åœ¨ã®ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ãƒ¬ãƒ³ãƒ€ãƒªãƒ³ã‚°ã‚¿ãƒ¼ã‚²ãƒƒãƒˆãŒã‚ã‚‹ãªã‚‰ã€è¦ªã«ä¼æ¬ã™ã‚‹
                this.submitDrawToParentOffscreen(offscreenIndex, DrawableObjectType.DrawableObjectType_Offscreen);
            }
        }
        const offscreen = this._offscreenList[offscreenIndex];
        // ãƒ¬ãƒ³ãƒ€ãƒ¼ã‚¿ãƒ¼ã‚²ãƒƒãƒˆãŒæœªç”Ÿæˆã€ãƒ¬ãƒ³ãƒ€ãƒ¼ãƒ†ã‚¯ã‚¹ãƒãƒ£ä½¿ç”¨ä¸­ã€ã‚‚ã—ãã¯ã‚µã‚¤ã‚ºãŒç•°ãªã‚‹ãªã‚‰æ–°ã—ã„ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ãƒ¬ãƒ³ãƒ€ãƒªãƒ³ã‚°ã‚¿ãƒ¼ã‚²ãƒƒãƒˆã‚’ä½œæˆ
        if (offscreen.getRenderTexture() == null ||
            offscreen.getBufferWidth() != this._modelRenderTargetWidth ||
            offscreen.getBufferHeight() != this._modelRenderTargetHeight ||
            offscreen.getUsingRenderTextureState()) {
            offscreen.setOffscreenRenderTarget(this.gl, this._modelRenderTargetWidth, this._modelRenderTargetHeight, this._currentFbo);
        }
        else {
            // æ—¢å­˜ã®RenderTextureã‚’ä½¿ç”¨ã™ã‚‹ã®ã§ä½¿ç”¨ãƒ•ãƒ©ã‚°ã‚’ç«‹ã¦ã‚‹ã€‚
            offscreen.startUsingRenderTexture();
        }
        // ä»¥å‰ã®ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ãƒ¬ãƒ³ãƒ€ãƒªãƒ³ã‚°ã‚¿ãƒ¼ã‚²ãƒƒãƒˆã‚’å–å¾—
        const oldOffscreen = offscreen.getParentPartOffscreen();
        offscreen.setOldOffscreen(oldOffscreen);
        let oldFBO = null;
        if (oldOffscreen != null) {
            oldFBO = oldOffscreen.getRenderTexture();
        }
        if (oldFBO == null) {
            oldFBO = this._modelRootFbo; // ãƒ«ãƒ¼ãƒˆã®FBOã‚’ä½¿ç”¨
        }
        // åˆ¥ãƒãƒƒãƒ•ã‚¡ã«æç”»ã‚’é–‹å§‹
        offscreen.beginDraw(oldFBO);
        this.gl.viewport(0, 0, this._modelRenderTargetWidth, this._modelRenderTargetHeight);
        offscreen.clear(0.0, 0.0, 0.0, 0.0);
        // ç¾åœ¨ã®ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ãƒ¬ãƒ³ãƒ€ãƒªãƒ³ã‚°ã‚¿ãƒ¼ã‚²ãƒƒãƒˆã‚’è¨­å®š
        this._currentOffscreen = offscreen;
        this._currentFbo = offscreen.getRenderTexture();
    }
    /**
     * ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³æç”»ã‚’è¡Œã†ã€‚
     *
     * @param offscreen ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ãƒ¬ãƒ³ãƒ€ãƒªãƒ³ã‚°ã‚¿ãƒ¼ã‚²ãƒƒãƒˆ
     */
    drawOffscreen(offscreen) {
        const offscreenIndex = offscreen.getOffscreenIndex();
        // ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯
        const clipContext = this._offscreenClippingManager != null
            ? this._offscreenClippingManager.getClippingContextListForOffscreen()[offscreenIndex]
            : null;
        if (clipContext != null && this.isUsingHighPrecisionMask()) {
            // ãƒžã‚¹ã‚¯ã‚’æ›¸ãå¿…è¦ãŒã‚ã‚‹
            if (clipContext._isUsing) {
                // æ›¸ãã“ã¨ã«ãªã£ã¦ã„ãŸ
                // ç”Ÿæˆã—ãŸRenderTargetã¨åŒã˜ã‚µã‚¤ã‚ºã§ãƒ“ãƒ¥ãƒ¼ãƒãƒ¼ãƒˆã‚’è¨­å®š
                this.gl.viewport(0, 0, this._offscreenClippingManager.getClippingMaskBufferSize(), this._offscreenClippingManager.getClippingMaskBufferSize());
                this.preDraw(); // ãƒãƒƒãƒ•ã‚¡ã‚’ã‚¯ãƒªã‚¢ã™ã‚‹
                // ---------- ãƒžã‚¹ã‚¯æç”»å‡¦ç† ----------
                // ãƒžã‚¹ã‚¯ç”¨RenderTextureã‚’activeã«ã‚»ãƒƒãƒˆ
                this.getOffscreenMaskBuffer(clipContext._bufferIndex).beginDraw(this._currentFbo);
                // ãƒžã‚¹ã‚¯ã‚’ã‚¯ãƒªã‚¢ã™ã‚‹
                // 1ãŒç„¡åŠ¹ï¼ˆæã‹ã‚Œãªã„ï¼‰é ˜åŸŸã€0ãŒæœ‰åŠ¹ï¼ˆæã‹ã‚Œã‚‹ï¼‰é ˜åŸŸã€‚ï¼ˆã‚·ã‚§ãƒ¼ãƒ€ã§ Cd*Csã§0ã«è¿‘ã„å€¤ã‚’ã‹ã‘ã¦ãƒžã‚¹ã‚¯ã‚’ä½œã‚‹ã€‚1ã‚’ã‹ã‘ã‚‹ã¨ä½•ã‚‚èµ·ã“ã‚‰ãªã„ï¼‰
                this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
                this.gl.clear(this.gl.COLOR_BUFFER_BIT);
            }
            {
                const clipDrawCount = clipContext._clippingIdCount;
                for (let index = 0; index < clipDrawCount; index++) {
                    const clipDrawIndex = clipContext._clippingIdList[index];
                    // é ‚ç‚¹æƒ…å ±ãŒæ›´æ–°ã•ã‚Œã¦ãŠã‚‰ãšã€ä¿¡é ¼æ€§ãŒãªã„å ´åˆã¯æç”»ã‚’ãƒ‘ã‚¹ã™ã‚‹
                    if (!this.getModel().getDrawableDynamicFlagVertexPositionsDidChange(clipDrawIndex)) {
                        continue;
                    }
                    this.setIsCulling(this.getModel().getDrawableCulling(clipDrawIndex) != false);
                    // ä»Šå›žå°‚ç”¨ã®å¤‰æ›ã‚’é©ç”¨ã—ã¦æã
                    // ãƒãƒ£ãƒ³ãƒãƒ«ã‚‚åˆ‡ã‚Šæ›¿ãˆã‚‹å¿…è¦ãŒã‚ã‚‹(A,R,G,B)
                    this.setClippingContextBufferForMask(clipContext);
                    this.drawMeshWebGL(this.getModel(), clipDrawIndex);
                }
            }
            {
                // --- å¾Œå‡¦ç† ---
                this.getOffscreenMaskBuffer(clipContext._bufferIndex).endDraw();
                this.setClippingContextBufferForMask(null);
                this.gl.viewport(0, 0, this._modelRenderTargetWidth, this._modelRenderTargetHeight);
                this.preDraw(); // ãƒãƒƒãƒ•ã‚¡ã‚’ã‚¯ãƒªã‚¢ã™ã‚‹
            }
        }
        // ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ã‚’ã‚»ãƒƒãƒˆã™ã‚‹
        this.setClippingContextBufferForOffscreen(clipContext);
        this.setIsCulling(this._model.getOffscreenCulling(offscreenIndex) != false);
        this.drawOffscreenWebGL(this.getModel(), offscreen);
    }
    /**
     * ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³æç”»ã®WebGLå®Ÿè£…
     *
     * @param model ãƒ¢ãƒ‡ãƒ«
     * @param index ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     */
    drawOffscreenWebGL(model, offscreen) {
        // è£é¢æç”»ã®æœ‰åŠ¹ãƒ»ç„¡åŠ¹
        if (this.isCulling()) {
            this.gl.enable(this.gl.CULL_FACE);
        }
        else {
            this.gl.disable(this.gl.CULL_FACE);
        }
        this.gl.frontFace(this.gl.CCW); // Cubism SDK OpenGLã¯ãƒžã‚¹ã‚¯ãƒ»ã‚¢ãƒ¼ãƒˆãƒ¡ãƒƒã‚·ãƒ¥å…±ã«CCWãŒè¡¨é¢
        CubismShaderManager_WebGL.getInstance()
            .getShader(this.gl)
            .setupShaderProgramForOffscreen(this, model, offscreen);
        offscreen.endDraw();
        this._currentOffscreen = this._currentOffscreen.getOldOffscreen();
        this._currentFbo = offscreen.getOldFBO();
        if (this._currentFbo == null) {
            this._currentOffscreen = this._modelRenderTargets[0];
            this._currentFbo = this._modelRenderTargets[0].getRenderTexture();
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this._currentFbo);
        }
        // ãƒãƒªã‚´ãƒ³ãƒ¡ãƒƒã‚·ãƒ¥ã‚’æç”»ã™ã‚‹
        {
            // ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ãƒãƒƒãƒ•ã‚¡ã®ä½œæˆã¨ãƒã‚¤ãƒ³ãƒ‰
            const indexBuffer = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, s_renderTargetIndexArray, this.gl.STATIC_DRAW);
            // æç”»
            this.gl.drawElements(this.gl.TRIANGLES, s_renderTargetIndexArray.length, this.gl.UNSIGNED_SHORT, 0);
            this.gl.deleteBuffer(indexBuffer);
        }
        // å¾Œå‡¦ç†
        offscreen.stopUsingRenderTexture();
        this.gl.useProgram(null);
        this.setClippingContextBufferForMask(null);
        this.setClippingContextBufferForOffscreen(null);
    }
    /**
     * ãƒ¢ãƒ‡ãƒ«æç”»ç›´å‰ã®ãƒ¬ãƒ³ãƒ€ãƒ©ã®ã‚¹ãƒ†ãƒ¼ãƒˆã‚’ä¿æŒã™ã‚‹
     */
    saveProfile() {
        this._rendererProfile.save();
    }
    /**
     * ãƒ¢ãƒ‡ãƒ«æç”»ç›´å‰ã®ãƒ¬ãƒ³ãƒ€ãƒ©ã®ã‚¹ãƒ†ãƒ¼ãƒˆã‚’å¾©å¸°ã•ã›ã‚‹
     */
    restoreProfile() {
        this._rendererProfile.restore();
    }
    /**
     * ãƒ¢ãƒ‡ãƒ«æç”»ç›´å‰ã®ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³è¨­å®šã‚’è¡Œã†
     */
    beforeDrawModelRenderTarget() {
        if (this._modelRenderTargets.length == 0) {
            return;
        }
        // ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã®ãƒãƒƒãƒ•ã‚¡ã®ã‚µã‚¤ã‚ºãŒé•ã†å ´åˆã¯ä½œã‚Šç›´ã—
        for (let i = 0; i < this._modelRenderTargets.length; ++i) {
            if (this._modelRenderTargets[i].getBufferWidth() !=
                this._modelRenderTargetWidth ||
                this._modelRenderTargets[i].getBufferHeight() !=
                    this._modelRenderTargetHeight) {
                this._modelRenderTargets[i].createRenderTarget(this.gl, this._modelRenderTargetWidth, this._modelRenderTargetHeight, this._currentFbo);
            }
        }
        // åˆ¥ãƒãƒƒãƒ•ã‚¡ã«æç”»ã‚’é–‹å§‹
        this._modelRenderTargets[0].beginDraw();
        this._modelRenderTargets[0].clear(0.0, 0.0, 0.0, 0.0);
    }
    /**
     * ãƒ¢ãƒ‡ãƒ«æç”»å¾Œã®ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³è¨­å®šã‚’è¡Œã†
     */
    afterDrawModelRenderTarget() {
        if (this._modelRenderTargets.length == 0) {
            return;
        }
        // å…ƒã®ãƒãƒƒãƒ•ã‚¡ã«æç”»ã™ã‚‹
        this._modelRenderTargets[0].endDraw();
        CubismShaderManager_WebGL.getInstance()
            .getShader(this.gl)
            .setupShaderProgramForOffscreenRenderTarget(this);
        if (CubismShaderManager_WebGL.getInstance().getShader(this.gl)._isShaderLoaded) {
            // ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ãƒãƒƒãƒ•ã‚¡ã®ä½œæˆã¨ãƒã‚¤ãƒ³ãƒ‰
            const indexBuffer = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, s_renderTargetIndexArray, this.gl.STATIC_DRAW);
            // æç”»
            this.gl.drawElements(this.gl.TRIANGLES, s_renderTargetIndexArray.length, this.gl.UNSIGNED_SHORT, 0);
            this.gl.deleteBuffer(indexBuffer);
        }
        this.gl.useProgram(null);
    }
    /**
     * ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã®ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ã®ãƒãƒƒãƒ•ã‚¡ã‚’å–å¾—ã™ã‚‹
     *
     * @param index ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã®ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ã®ãƒãƒƒãƒ•ã‚¡ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     *
     * @return ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã®ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ã®ãƒãƒƒãƒ•ã‚¡ã¸ã®ãƒã‚¤ãƒ³ã‚¿
     */
    getOffscreenMaskBuffer(index) {
        return this._offscreenMasks[index];
    }
    /**
     * ãƒ¬ãƒ³ãƒ€ãƒ©ãŒä¿æŒã™ã‚‹é™çš„ãªãƒªã‚½ãƒ¼ã‚¹ã‚’è§£æ”¾ã™ã‚‹
     * WebGLã®é™çš„ãªã‚·ã‚§ãƒ¼ãƒ€ãƒ¼ãƒ—ãƒ­ã‚°ãƒ©ãƒ ã‚’è§£æ”¾ã™ã‚‹
     */
    static doStaticRelease() {
        CubismShaderManager_WebGL.deleteInstance();
    }
    /**
     * ãƒ¬ãƒ³ãƒ€ãƒ¼ã‚¹ãƒ†ãƒ¼ãƒˆã‚’è¨­å®šã™ã‚‹
     *
     * @param fbo ã‚¢ãƒ—ãƒªã‚±ãƒ¼ã‚·ãƒ§ãƒ³å´ã§æŒ‡å®šã—ã¦ã„ã‚‹ãƒ•ãƒ¬ãƒ¼ãƒ ãƒãƒƒãƒ•ã‚¡
     * @param viewport ãƒ“ãƒ¥ãƒ¼ãƒãƒ¼ãƒˆ
     */
    setRenderState(fbo, viewport) {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo);
        this.gl.viewport(viewport[0], viewport[1], viewport[2], viewport[3]);
        if (this._modelRenderTargetWidth != viewport[2] ||
            this._modelRenderTargetHeight != viewport[3]) {
            this._modelRenderTargetWidth = viewport[2];
            this._modelRenderTargetHeight = viewport[3];
        }
    }
    /**
     * æç”»é–‹å§‹æ™‚ã®è¿½åŠ å‡¦ç†
     * ãƒ¢ãƒ‡ãƒ«ã‚’æç”»ã™ã‚‹å‰ã«ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ã«å¿…è¦ãªå‡¦ç†ã‚’å®Ÿè£…ã—ã¦ã„ã‚‹
     */
    preDraw() {
        this.gl.disable(this.gl.SCISSOR_TEST);
        this.gl.disable(this.gl.STENCIL_TEST);
        this.gl.disable(this.gl.DEPTH_TEST);
        // ã‚«ãƒªãƒ³ã‚°ï¼ˆ1.0beta3ï¼‰
        this.gl.frontFace(this.gl.CW);
        this.gl.enable(this.gl.BLEND);
        this.gl.colorMask(true, true, true, true);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null); // å‰ã«ãƒãƒƒãƒ•ã‚¡ãŒãƒã‚¤ãƒ³ãƒ‰ã•ã‚Œã¦ã„ãŸã‚‰ç ´æ£„ã™ã‚‹å¿…è¦ãŒã‚ã‚‹
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
        // ç•°æ–¹æ€§ãƒ•ã‚£ãƒ«ã‚¿ãƒªãƒ³ã‚°ã‚’é©ç”¨ã™ã‚‹
        if (this.getAnisotropy() > 0.0 && this._extension) {
            for (let i = 0; i < this._textures.size; ++i) {
                this.gl.bindTexture(this.gl.TEXTURE_2D, this._textures.get(i));
                this.gl.texParameterf(this.gl.TEXTURE_2D, this._extension.TEXTURE_MAX_ANISOTROPY_EXT, this.getAnisotropy());
            }
        }
    }
    /**
     * Drawableã®ãƒžã‚¹ã‚¯ç”¨ã®ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã‚µãƒ¼ãƒ•ã‚§ãƒ¼ã‚¹ã‚’å–å¾—ã™ã‚‹
     *
     * @param index ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã‚µãƒ¼ãƒ•ã‚§ãƒ¼ã‚¹ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     *
     * @return ãƒžã‚¹ã‚¯ç”¨ã®ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã‚µãƒ¼ãƒ•ã‚§ãƒ¼ã‚¹
     */
    getDrawableMaskBuffer(index) {
        return this._drawableMasks[index];
    }
    /**
     * ãƒžã‚¹ã‚¯ãƒ†ã‚¯ã‚¹ãƒãƒ£ã«æç”»ã™ã‚‹ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ã‚³ãƒ³ãƒ†ã‚­ã‚¹ãƒˆã‚’ã‚»ãƒƒãƒˆã™ã‚‹
     */
    setClippingContextBufferForMask(clip) {
        this._clippingContextBufferForMask = clip;
    }
    /**
     * ãƒžã‚¹ã‚¯ãƒ†ã‚¯ã‚¹ãƒãƒ£ã«æç”»ã™ã‚‹ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ã‚³ãƒ³ãƒ†ã‚­ã‚¹ãƒˆã‚’å–å¾—ã™ã‚‹
     *
     * @return ãƒžã‚¹ã‚¯ãƒ†ã‚¯ã‚¹ãƒãƒ£ã«æç”»ã™ã‚‹ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ã‚³ãƒ³ãƒ†ã‚­ã‚¹ãƒˆ
     */
    getClippingContextBufferForMask() {
        return this._clippingContextBufferForMask;
    }
    /**
     * Drawableã®ç”»é¢ä¸Šã«æç”»ã™ã‚‹ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ã‚³ãƒ³ãƒ†ã‚­ã‚¹ãƒˆã‚’ã‚»ãƒƒãƒˆã™ã‚‹
     *
     * @param clip drawableã§ç”»é¢ä¸Šã«æç”»ã™ã‚‹ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ã‚³ãƒ³ãƒ†ã‚­ã‚¹ãƒˆ
     */
    setClippingContextBufferForDrawable(clip) {
        this._clippingContextBufferForDraw = clip;
    }
    /**
     * Drawableã®ç”»é¢ä¸Šã«æç”»ã™ã‚‹ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ã‚³ãƒ³ãƒ†ã‚­ã‚¹ãƒˆã‚’å–å¾—ã™ã‚‹
     *
     * @return Drawableã®ç”»é¢ä¸Šã«æç”»ã™ã‚‹ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ã‚³ãƒ³ãƒ†ã‚­ã‚¹ãƒˆ
     */
    getClippingContextBufferForDrawable() {
        return this._clippingContextBufferForDraw;
    }
    /**
     * offscreenã§ç”»é¢ä¸Šã«æç”»ã™ã‚‹ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ã‚³ãƒ³ãƒ†ã‚­ã‚¹ãƒˆã‚’ã‚»ãƒƒãƒˆã™ã‚‹ã€‚
     *
     * @param clip offscreenã§ç”»é¢ä¸Šã«æç”»ã™ã‚‹ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ã‚³ãƒ³ãƒ†ã‚­ã‚¹ãƒˆ
     */
    setClippingContextBufferForOffscreen(clip) {
        this._clippingContextBufferForOffscreen = clip;
    }
    /**
     * offscreenã§ç”»é¢ä¸Šã«æç”»ã™ã‚‹ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ã‚³ãƒ³ãƒ†ã‚­ã‚¹ãƒˆã‚’å–å¾—ã™ã‚‹ã€‚
     *
     * @return offscreenã§ç”»é¢ä¸Šã«æç”»ã™ã‚‹ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ã‚³ãƒ³ãƒ†ã‚­ã‚¹ãƒˆ
     */
    getClippingContextBufferForOffscreen() {
        return this._clippingContextBufferForOffscreen;
    }
    /**
     * ãƒžã‚¹ã‚¯ç”Ÿæˆæ™‚ã‹ã‚’åˆ¤å®šã™ã‚‹
     *
     * @return åˆ¤å®šå€¤
     */
    isGeneratingMask() {
        return this.getClippingContextBufferForMask() != null;
    }
    /**
     * glã®è¨­å®š
     */
    startUp(gl) {
        this.gl = gl;
        if (this._drawableClippingManager) {
            this._drawableClippingManager.setGL(gl);
        }
        if (this._offscreenClippingManager) {
            this._offscreenClippingManager.setGL(gl);
        }
        CubismShaderManager_WebGL.getInstance().setGlContext(gl);
        this._rendererProfile.setGl(gl);
        // ç•°æ–¹æ€§ãƒ•ã‚£ãƒ«ã‚¿ãƒªãƒ³ã‚°ãŒä½¿ç”¨ã§ãã‚‹ã‹ãƒã‚§ãƒƒã‚¯
        this._extension =
            this.gl.getExtension('EXT_texture_filter_anisotropic') ||
                this.gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic') ||
                this.gl.getExtension('MOZ_EXT_texture_filter_anisotropic');
        if (this._model.isUsingMasking()) {
            this._drawableMasks.length =
                this._drawableClippingManager.getRenderTextureCount();
            for (let i = 0; i < this._drawableMasks.length; ++i) {
                const renderTarget = new CubismRenderTarget_WebGL();
                renderTarget.createRenderTarget(this.gl, this._drawableClippingManager.getClippingMaskBufferSize(), this._drawableClippingManager.getClippingMaskBufferSize(), this._currentFbo);
                this._drawableMasks[i] = renderTarget;
            }
        }
        if (this._model.isBlendModeEnabled()) {
            // ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã®ä½œæˆ
            this._modelRenderTargets.length = 0;
            // TextureBarrierã®ä»£æ›¿ç”¨ã«ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã‚’2ã¤ä½œæˆã™ã‚‹
            const createSize = 3;
            this._modelRenderTargets.length = createSize;
            for (let i = 0; i < createSize; ++i) {
                const offscreenRenderTarget = new CubismOffscreenRenderTarget_WebGL();
                offscreenRenderTarget.createRenderTarget(this.gl, this._modelRenderTargetWidth, this._modelRenderTargetHeight, this._currentFbo);
                this._modelRenderTargets[i] = offscreenRenderTarget;
            }
            if (this._model.isUsingMaskingForOffscreen()) {
                this._offscreenMasks.length =
                    this._offscreenClippingManager.getRenderTextureCount();
                for (let i = 0; i < this._offscreenMasks.length; ++i) {
                    const offscreenMask = new CubismRenderTarget_WebGL();
                    offscreenMask.createRenderTarget(this.gl, this._offscreenClippingManager.getClippingMaskBufferSize(), this._offscreenClippingManager.getClippingMaskBufferSize(), this._currentFbo);
                    this._offscreenMasks[i] = offscreenMask;
                }
            }
            const offscreenCount = this._model.getOffscreenCount();
            // ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã®æ•°ãŒ0ã®å ´åˆã¯ä½•ã‚‚ã—ãªã„
            if (offscreenCount > 0) {
                this._offscreenList = new Array(offscreenCount);
                for (let offscreenIndex = 0; offscreenIndex < offscreenCount; ++offscreenIndex) {
                    const offscreenRenderTarget = new CubismOffscreenRenderTarget_WebGL();
                    offscreenRenderTarget.setOffscreenIndex(offscreenIndex);
                    this._offscreenList[offscreenIndex] = offscreenRenderTarget;
                }
                // å…¨ã¦ã®ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã‚’ç™»éŒ²ã—çµ‚ã‚ã£ã¦ã‹ã‚‰è¡Œã†
                this.setupParentOffscreens(this._model, offscreenCount);
            }
        }
        // æç”»å¯¾è±¡ã‚’åˆæœŸçŠ¶æ…‹ã«æˆ»ã™
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this._currentFbo);
    }
}
/**
 * ãƒ¬ãƒ³ãƒ€ãƒ©ãŒä¿æŒã™ã‚‹é™çš„ãªãƒªã‚½ãƒ¼ã‚¹ã‚’é–‹æ”¾ã™ã‚‹
 */
CubismRenderer.staticRelease = () => {
    CubismRenderer_WebGL.doStaticRelease();
};
// Namespace definition for compatibility.
import * as $ from './cubismrenderer_webgl.js';
import { CubismRenderTarget_WebGL as CubismRenderTarget_WebGL } from './cubismrendertarget_webgl.js';
import { CubismOffscreenRenderTarget_WebGL as CubismOffscreenRenderTarget_WebGL } from './cubismoffscreenrendertarget_webgl.js';
// eslint-disable-next-line @typescript-eslint/no-namespace
export var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    Live2DCubismFramework.CubismClippingContext = $.CubismClippingContext_WebGL;
    Live2DCubismFramework.CubismClippingManager_WebGL = $.CubismClippingManager_WebGL;
    Live2DCubismFramework.CubismRenderer_WebGL = $.CubismRenderer_WebGL;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));
//# sourceMappingURL=cubismrenderer_webgl.js.map