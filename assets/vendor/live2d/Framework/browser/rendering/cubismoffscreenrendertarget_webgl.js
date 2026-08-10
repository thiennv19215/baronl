/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
import { CubismRenderTarget_WebGL } from './cubismrendertarget_webgl.js';
import { CubismWebGLOffscreenManager } from './cubismoffscreenmanager.js';
import { CubismLogError } from '../utils/cubismdebug.js';
/**
 * WebGLç”¨ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã‚µãƒ¼ãƒ•ã‚§ã‚¹
 * ãƒžã‚¹ã‚¯ã®æç”»åŠã³ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³æ©Ÿèƒ½ã«å¿…è¦ãªãƒ•ãƒ¬ãƒ¼ãƒ ãƒãƒƒãƒ•ã‚¡ãªã©ã‚’ç®¡ç†ã™ã‚‹ã€‚
 */
export class CubismOffscreenRenderTarget_WebGL extends CubismRenderTarget_WebGL {
    /**
     * ãƒªã‚½ãƒ¼ã‚¹ã‚³ãƒ³ãƒ†ãƒŠãƒžãƒãƒ¼ã‚¸ãƒ£ã‚’åˆæœŸåŒ–ã™ã‚‹ã€‚
     *
     * @param displayBufferWidth ãƒ¬ãƒ³ãƒ€ãƒ¼ã‚¿ãƒ¼ã‚²ãƒƒãƒˆã®å¹…
     * @param displayBufferHeight ãƒ¬ãƒ³ãƒ€ãƒ¼ã‚¿ãƒ¼ã‚²ãƒƒãƒˆã®é«˜ã•
     */
    initializeOffscreenManager(gl, displayBufferWidth, displayBufferHeight) {
        this._gl = gl;
        this._webGLOffscreenManager = CubismWebGLOffscreenManager.getInstance();
        if (this._webGLOffscreenManager.getContainerSize(gl) === 0) {
            this._webGLOffscreenManager.initialize(gl, displayBufferWidth, displayBufferHeight);
        }
    }
    /**
     * ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³æç”»ç”¨ãƒ¬ãƒ³ãƒ€ãƒ¼ã‚¿ãƒ¼ã‚²ãƒƒãƒˆã‚’ã‚»ãƒƒãƒˆã™ã‚‹ã€‚
     *
     * @param gl WebGLRenderingContextã¾ãŸã¯WebGL2RenderingContext
     *          NOTE: Cubism 5.3ä»¥é™ã®ãƒ¢ãƒ‡ãƒ«ãŒä½¿ç”¨ã•ã‚Œã‚‹å ´åˆã¯WebGL2RenderingContextã‚’ä½¿ç”¨ã™ã‚‹ã“ã¨ã€‚
     * @param displayBufferWidth ãƒ¬ãƒ³ãƒ€ãƒ¼ã‚¿ãƒ¼ã‚²ãƒƒãƒˆã®å¹…
     * @param displayBufferHeight ãƒ¬ãƒ³ãƒ€ãƒ¼ã‚¿ãƒ¼ã‚²ãƒƒãƒˆã®é«˜ã•
     * @param previousFramebuffer å‰ã®ãƒ•ãƒ¬ãƒ¼ãƒ ãƒãƒƒãƒ•ã‚¡
     */
    setOffscreenRenderTarget(gl, displayBufferWidth, displayBufferHeight, previousFramebuffer) {
        // ãƒžãƒãƒ¼ã‚¸ãƒ£ãŒãªã‘ã‚Œã°åˆæœŸåŒ–
        if (this._webGLOffscreenManager == null) {
            this.initializeOffscreenManager(gl, displayBufferWidth, displayBufferHeight);
        }
        // ä½¿ç”¨å¯èƒ½ãªãƒªã‚½ãƒ¼ã‚¹ã‚³ãƒ³ãƒ†ãƒŠã‚’å–å¾—ã™ã‚‹
        const offscreenRenderTargetContainer = this._webGLOffscreenManager.getOffscreenRenderTargetContainers(gl, displayBufferWidth, displayBufferHeight, previousFramebuffer);
        if (offscreenRenderTargetContainer == null) {
            CubismLogError('Failed to acquire offscreen render texture container.');
            return;
        }
        this._colorBuffer = offscreenRenderTargetContainer.getColorBuffer();
        this._renderTexture = offscreenRenderTargetContainer.getRenderTexture();
        this._bufferWidth = displayBufferWidth;
        this._bufferHeight = displayBufferHeight;
        this._gl = gl;
        if (this._renderTexture == null) {
            this._renderTexture = previousFramebuffer;
            CubismLogError('Failed to create offscreen render texture.');
        }
        return;
    }
    /**
     * ãƒªã‚½ãƒ¼ã‚¹ã‚³ãƒ³ãƒ†ãƒŠã®ä½¿ç”¨çŠ¶æ…‹ã‚’å–å¾—
     *
     * @return ä½¿ç”¨ä¸­ã¯trueã€æœªä½¿ç”¨ã®å ´åˆã¯false
     */
    getUsingRenderTextureState() {
        if (this._webGLOffscreenManager == null || this._gl == null) {
            return true;
        }
        return this._webGLOffscreenManager.getUsingRenderTextureState(this._gl, this._renderTexture);
    }
    /**
     * ãƒªã‚½ãƒ¼ã‚¹ã‚³ãƒ³ãƒ†ãƒŠã®ä½¿ç”¨ã‚’é–‹å§‹ã™ã‚‹ã€‚
     */
    startUsingRenderTexture() {
        if (this._webGLOffscreenManager == null || this._gl == null) {
            return;
        }
        this._webGLOffscreenManager.startUsingRenderTexture(this._gl, this._renderTexture);
    }
    /**
     * ãƒªã‚½ãƒ¼ã‚¹ã‚³ãƒ³ãƒ†ãƒŠã®ä½¿ç”¨ã‚’çµ‚äº†ã™ã‚‹ã€‚
     */
    stopUsingRenderTexture() {
        if (this._webGLOffscreenManager == null || this._gl == null) {
            return;
        }
        this._webGLOffscreenManager.stopUsingRenderTexture(this._gl, this._renderTexture);
    }
    /**
     * ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ã‚’è¨­å®šã™ã‚‹ã€‚
     *
     * @param offscreenIndex ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     */
    setOffscreenIndex(offscreenIndex) {
        this._offscreenIndex = offscreenIndex;
    }
    /**
     * ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ã‚’å–å¾—ã™ã‚‹ã€‚
     *
     * @return ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     */
    getOffscreenIndex() {
        return this._offscreenIndex;
    }
    /**
     * ä»¥å‰ã®ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³æç”»ç”¨ãƒ¬ãƒ³ãƒ€ãƒ¼ã‚¿ãƒ¼ã‚²ãƒƒãƒˆã‚’è¨­å®šã™ã‚‹ã€‚
     *
     * @param oldOffscreen ä»¥å‰ã®ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³æç”»ç”¨ãƒ¬ãƒ³ãƒ€ãƒ¼ã‚¿ãƒ¼ã‚²ãƒƒãƒˆ
     */
    setOldOffscreen(oldOffscreen) {
        this._oldOffscreen = oldOffscreen;
    }
    /**
     * ä»¥å‰ã®ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³æç”»ç”¨ãƒ¬ãƒ³ãƒ€ãƒ¼ã‚¿ãƒ¼ã‚²ãƒƒãƒˆã‚’å–å¾—ã™ã‚‹ã€‚
     *
     * @return ä»¥å‰ã®ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³æç”»ç”¨ãƒ¬ãƒ³ãƒ€ãƒ¼ã‚¿ãƒ¼ã‚²ãƒƒãƒˆ
     */
    getOldOffscreen() {
        return this._oldOffscreen;
    }
    /**
     * è¦ªã®ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³æç”»ç”¨ãƒ¬ãƒ³ãƒ€ãƒ¼ã‚¿ãƒ¼ã‚²ãƒƒãƒˆã‚’è¨­å®šã™ã‚‹ã€‚
     *
     * @param parentOffscreenRenderTarget è¦ªã®ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³æç”»ç”¨ãƒ¬ãƒ³ãƒ€ãƒ¼ã‚¿ãƒ¼ã‚²ãƒƒãƒˆ
     */
    setParentPartOffscreen(parentOffscreenRenderTarget) {
        this._parentOffscreenRenderTarget = parentOffscreenRenderTarget;
    }
    /**
     * è¦ªã®ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³æç”»ç”¨ãƒ¬ãƒ³ãƒ€ãƒ¼ã‚¿ãƒ¼ã‚²ãƒƒãƒˆã‚’å–å¾—ã™ã‚‹ã€‚
     *
     * @return è¦ªã®ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³æç”»ç”¨ãƒ¬ãƒ³ãƒ€ãƒ¼ã‚¿ãƒ¼ã‚²ãƒƒãƒˆ
     */
    getParentPartOffscreen() {
        return this._parentOffscreenRenderTarget;
    }
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    constructor() {
        super();
        this._offscreenIndex = -1;
        this._parentOffscreenRenderTarget = null;
        this._oldOffscreen = null;
        this._webGLOffscreenManager = null;
    }
    release() {
        if (this._webGLOffscreenManager != null &&
            this._gl != null &&
            this._renderTexture != null) {
            this._webGLOffscreenManager.stopUsingRenderTexture(this._gl, this._renderTexture);
        }
        if (this._colorBuffer && this._gl) {
            this._gl.deleteTexture(this._colorBuffer);
            this._colorBuffer = null;
        }
        if (this._renderTexture && this._gl) {
            this._gl.deleteFramebuffer(this._renderTexture);
            this._renderTexture = null;
        }
        if (this._webGLOffscreenManager != null) {
            this._webGLOffscreenManager = null;
        }
        this._oldOffscreen = null;
        this._parentOffscreenRenderTarget = null;
    }
}
//# sourceMappingURL=cubismoffscreenrendertarget_webgl.js.map