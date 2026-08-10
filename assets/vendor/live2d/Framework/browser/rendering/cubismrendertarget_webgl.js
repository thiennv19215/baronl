/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
import { CubismLogError } from '../utils/cubismdebug.js';
/**
 * WebGLç”¨ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã‚µãƒ¼ãƒ•ã‚§ã‚¹
 * ãƒžã‚¹ã‚¯ã®æç”»ã«å¿…è¦ãªãƒ•ãƒ¬ãƒ¼ãƒ ãƒãƒƒãƒ•ã‚¡ãªã©ã‚’ç®¡ç†ã™ã‚‹ã€‚
 */
export class CubismRenderTarget_WebGL {
    /**
     * WebGL2RenderingContext.blitFramebuffer() ã§ãƒãƒƒãƒ•ã‚¡ã®ã‚³ãƒ”ãƒ¼ã‚’è¡Œã†ã€‚
     *
     * @param src ã‚³ãƒ”ãƒ¼å…ƒã®ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã‚µãƒ¼ãƒ•ã‚§ã‚¹
     * @param dst ã‚³ãƒ”ãƒ¼å…ˆã®ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã‚µãƒ¼ãƒ•ã‚§ã‚¹
     */
    static copyBuffer(gl, src, dst) {
        if (src == null || dst == null) {
            return;
        }
        if (!(gl instanceof WebGL2RenderingContext)) {
            throw new Error('WebGL2RenderingContext is required for buffer copy.');
        }
        const previousFramebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
        // å„ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã‚µãƒ¼ãƒ•ã‚§ã‚¹ã®ãƒ¬ãƒ³ãƒ€ãƒ¼ãƒ†ã‚¯ã‚¹ãƒãƒ£ã‚’ãƒã‚¤ãƒ³ãƒ‰
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, src.getRenderTexture());
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, dst.getRenderTexture());
        // ãƒãƒƒãƒ•ã‚¡ã®ã‚³ãƒ”ãƒ¼ã‚’å®Ÿè¡Œ
        gl.blitFramebuffer(0, 0, src.getBufferWidth(), src.getBufferHeight(), 0, 0, dst.getBufferWidth(), dst.getBufferHeight(), gl.COLOR_BUFFER_BIT, gl.NEAREST);
        // ã‚³ãƒ”ãƒ¼å¾Œã€å…ƒã®ãƒ•ãƒ¬ãƒ¼ãƒ ãƒãƒƒãƒ•ã‚¡ã‚’å¾©å…ƒ
        gl.bindFramebuffer(gl.FRAMEBUFFER, previousFramebuffer);
    }
    /**
     * æç”»ã‚’é–‹å§‹ã™ã‚‹ã€‚
     *
     * @param restoreFbo EndDrawæ™‚ã«å¾©å…ƒã™ã‚‹FBOã‚’æŒ‡å®šã™ã‚‹ã€‚nullã‚’æŒ‡å®šã™ã‚‹ã¨ã€beginDrawæ™‚ã«ç¾åœ¨ã®FBOã‚’è¨˜æ†¶ã—ã¦ãŠãã€‚
     */
    beginDraw(restoreFbo = null) {
        if (this._renderTexture == null) {
            console.error('_renderTexture is null');
            return;
        }
        // ãƒãƒƒã‚¯ãƒãƒƒãƒ•ã‚¡ã®ã‚µãƒ¼ãƒ•ã‚§ã‚¤ã‚¹ã‚’è¨˜æ†¶ã—ã¦ãŠãã€‚
        if (restoreFbo == null) {
            this._oldFbo = this._gl.getParameter(this._gl.FRAMEBUFFER_BINDING);
        }
        else {
            this._oldFbo = restoreFbo;
        }
        // RenderTextureã‚’activeã«ã‚»ãƒƒãƒˆ
        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this._renderTexture);
    }
    /**
     * æç”»ã‚’çµ‚äº†ã—ã€ãƒãƒƒã‚¯ãƒãƒƒãƒ•ã‚¡ã®ã‚µãƒ¼ãƒ•ã‚§ã‚¤ã‚¹ã‚’å¾©å…ƒã™ã‚‹ã€‚
     */
    endDraw() {
        // ãƒãƒƒã‚¯ãƒãƒƒãƒ•ã‚¡ã®ã‚µãƒ¼ãƒ•ã‚§ã‚¤ã‚¹ã‚’å¾©å…ƒ
        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this._oldFbo);
    }
    /**
     * ãƒã‚¤ãƒ³ãƒ‰ã•ã‚Œã¦ã„ã‚‹ã‚«ãƒ©ãƒ¼ãƒãƒƒãƒ•ã‚¡ã®ã‚¯ãƒªã‚¢ã‚’è¡Œã†ã€‚
     *
     * @param r èµ¤ã®æˆåˆ† (0.0 - 1.0)
     * @param g ç·‘ã®æˆåˆ† (0.0 - 1.0)
     * @param b é’ã®æˆåˆ† (0.0 - 1.0)
     * @param a ã‚¢ãƒ«ãƒ•ã‚¡ã®æˆåˆ† (0.0 - 1.0)
     */
    clear(r, g, b, a) {
        // ã‚¯ãƒªã‚¢å‡¦ç†
        this._gl.clearColor(r, g, b, a);
        this._gl.clear(this._gl.COLOR_BUFFER_BIT);
    }
    /**
     * ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã‚µãƒ¼ãƒ•ã‚§ã‚¹ã‚’ä½œæˆã™ã‚‹ã€‚
     *
     * @param gl WebGLRenderingContextã¾ãŸã¯WebGL2RenderingContext
     *          NOTE: Cubism 5.3ä»¥é™ã®ãƒ¢ãƒ‡ãƒ«ãŒä½¿ç”¨ã•ã‚Œã‚‹å ´åˆã¯WebGL2RenderingContextã‚’ä½¿ç”¨ã™ã‚‹ã“ã¨ã€‚
     * @param displayBufferWidth ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã‚µãƒ¼ãƒ•ã‚§ã‚¹ã®å¹…
     * @param displayBufferHeight ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã‚µãƒ¼ãƒ•ã‚§ã‚¹ã®é«˜ã•
     * @param previousFramebuffer å‰ã®ãƒ•ãƒ¬ãƒ¼ãƒ ãƒãƒƒãƒ•ã‚¡
     *
     * @return æˆåŠŸã—ãŸå ´åˆã¯trueã€å¤±æ•—ã—ãŸå ´åˆã¯false
     */
    createRenderTarget(gl, displayBufferWidth, displayBufferHeight, previousFramebuffer) {
        this.destroyRenderTarget();
        this._colorBuffer = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this._colorBuffer);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, displayBufferWidth, displayBufferHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.bindTexture(gl.TEXTURE_2D, null);
        // ãƒ•ãƒ¬ãƒ¼ãƒ ãƒãƒƒãƒ•ã‚¡ã‚’ä½œæˆ
        const ret = gl.createFramebuffer();
        if (ret == null) {
            CubismLogError('Failed to create framebuffer');
            return false;
        }
        // ä½œæˆã—ãŸãƒ•ãƒ¬ãƒ¼ãƒ ãƒãƒƒãƒ•ã‚¡ã‚’ãƒã‚¤ãƒ³ãƒ‰
        gl.bindFramebuffer(gl.FRAMEBUFFER, ret);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._colorBuffer, 0);
        // çŠ¶æ…‹ã‚’ãƒã‚§ãƒƒã‚¯
        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        // ãƒ•ãƒ¬ãƒ¼ãƒ ãƒãƒƒãƒ•ã‚¡ãŒå®Œå…¨ã§ãªã„å ´åˆã¯ã‚¨ãƒ©ãƒ¼ã‚’å‡ºåŠ›ã—ã¦ä»¥å‰ã®ãƒ•ãƒ¬ãƒ¼ãƒ ãƒãƒƒãƒ•ã‚¡ã‚’å¾©å…ƒ
        if (status !== gl.FRAMEBUFFER_COMPLETE) {
            CubismLogError('Framebuffer is not complete');
            gl.bindFramebuffer(gl.FRAMEBUFFER, previousFramebuffer);
            gl.deleteFramebuffer(ret);
            this.destroyRenderTarget();
            return false;
        }
        this._renderTexture = ret;
        this._bufferWidth = displayBufferWidth;
        this._bufferHeight = displayBufferHeight;
        this._gl = gl;
        return true;
    }
    /**
     * ãƒ¬ãƒ³ãƒ€ãƒ¼ã‚¿ãƒ¼ã‚²ãƒƒãƒˆã‚’ç ´æ£„ã™ã‚‹ã€‚
     */
    destroyRenderTarget() {
        if (this._colorBuffer) {
            this._gl.bindTexture(this._gl.TEXTURE_2D, null);
            this._gl.deleteTexture(this._colorBuffer);
            this._colorBuffer = null;
        }
        if (this._renderTexture) {
            this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
            this._gl.deleteFramebuffer(this._renderTexture);
            this._renderTexture = null;
        }
    }
    /**
     * WebGLã®ã‚³ãƒ³ãƒ†ã‚­ã‚¹ãƒˆã‚’å–å¾—ã™ã‚‹ã€‚
     *
     * @return WebGLRenderingContextã¾ãŸã¯WebGL2RenderingContext
     */
    getGL() {
        return this._gl;
    }
    /**
     * ãƒ¬ãƒ³ãƒ€ãƒ¼ãƒ†ã‚¯ã‚¹ãƒãƒ£ã‚’å–å¾—ã™ã‚‹ã€‚
     *
     * @return WebGLFramebuffer
     */
    getRenderTexture() {
        return this._renderTexture;
    }
    /**
     * ã‚«ãƒ©ãƒ¼ãƒãƒƒãƒ•ã‚¡ã‚’å–å¾—ã™ã‚‹ã€‚
     *
     * @return WebGLTexture
     */
    getColorBuffer() {
        return this._colorBuffer;
    }
    /**
     * ã‚«ãƒ©ãƒ¼ãƒãƒƒãƒ•ã‚¡ã®å¹…ã‚’å–å¾—ã™ã‚‹ã€‚
     *
     * @return ã‚«ãƒ©ãƒ¼ãƒãƒƒãƒ•ã‚¡ã®å¹…
     */
    getBufferWidth() {
        return this._bufferWidth;
    }
    /**
     * ã‚«ãƒ©ãƒ¼ãƒãƒƒãƒ•ã‚¡ã®é«˜ã•ã‚’å–å¾—ã™ã‚‹ã€‚
     *
     * @return ã‚«ãƒ©ãƒ¼ãƒãƒƒãƒ•ã‚¡ã®é«˜ã•
     */
    getBufferHeight() {
        return this._bufferHeight;
    }
    /**
     * ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã‚µãƒ¼ãƒ•ã‚§ã‚¹ãŒæœ‰åŠ¹ã‹ã©ã†ã‹ã‚’ç¢ºèªã™ã‚‹ã€‚
     *
     * @return æœ‰åŠ¹ãªå ´åˆã¯trueã€ç„¡åŠ¹ãªå ´åˆã¯false
     */
    isValid() {
        return this._renderTexture != null;
    }
    /**
     * ä»¥å‰ã®ãƒ•ãƒ¬ãƒ¼ãƒ ãƒãƒƒãƒ•ã‚¡ã‚’å–å¾—ã™ã‚‹ã€‚
     *
     * @return ä»¥å‰ã®ãƒ•ãƒ¬ãƒ¼ãƒ ãƒãƒƒãƒ•ã‚¡
     */
    getOldFBO() {
        return this._oldFbo;
    }
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    constructor() {
        this._gl = null;
        this._colorBuffer = null;
        this._renderTexture = null;
        this._bufferWidth = 0;
        this._bufferHeight = 0;
        this._oldFbo = null;
    }
}
// Namespace definition for compatibility.
import * as $ from './cubismrendertarget_webgl.js';
// eslint-disable-next-line @typescript-eslint/no-namespace
export var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    Live2DCubismFramework.CubismOffscreenSurface_WebGL = $.CubismRenderTarget_WebGL;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));
//# sourceMappingURL=cubismrendertarget_webgl.js.map