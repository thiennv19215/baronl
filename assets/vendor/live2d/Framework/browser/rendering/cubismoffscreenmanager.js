/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
import { updateSize } from '../utils/cubismarrayutils.js';
import { CubismLogError } from '../utils/cubismdebug.js';
import { CubismRenderTarget_WebGL } from './cubismrendertarget_webgl.js';
/**
 * ãƒ•ãƒ¬ãƒ¼ãƒ ãƒãƒƒãƒ•ã‚¡ãªã©ã®ã‚³ãƒ³ãƒ†ãƒŠã®ã‚¯ãƒ©ã‚¹
 */
class CubismRenderTargetContainer {
    /**
     * Constructor
     *
     * @param colorBuffer ã‚«ãƒ©ãƒ¼ãƒãƒƒãƒ•ã‚¡
     * @param renderTexture ãƒ¬ãƒ³ãƒ€ãƒ¼ãƒ†ã‚¯ã‚¹ãƒãƒ£
     * @param inUse ä½¿ç”¨ä¸­ã‹ã©ã†ã‹
     */
    constructor(colorBuffer = null, renderTexture = null, inUse = false) {
        this.colorBuffer = colorBuffer;
        this.renderTexture = renderTexture;
        this.inUse = inUse;
    }
    clear() {
        this.colorBuffer = null;
        this.renderTexture = null;
        this.inUse = false;
    }
    /**
     * ã‚«ãƒ©ãƒ¼ãƒãƒƒãƒ•ã‚¡ã‚’å–å¾—
     *
     * @returns ã‚«ãƒ©ãƒ¼ãƒãƒƒãƒ•ã‚¡
     */
    getColorBuffer() {
        return this.colorBuffer;
    }
    /**
     * ãƒ¬ãƒ³ãƒ€ãƒ¼ãƒ†ã‚¯ã‚¹ãƒãƒ£ã‚’å–å¾—
     *
     * @returns ãƒ¬ãƒ³ãƒ€ãƒ¼ãƒ†ã‚¯ã‚¹ãƒãƒ£
     */
    getRenderTexture() {
        return this.renderTexture;
    }
}
/**
 * WebGLContextã”ã¨ã®ãƒªã‚½ãƒ¼ã‚¹ç®¡ç†ã‚’è¡Œã†å†…éƒ¨ã‚¯ãƒ©ã‚¹
 */
class CubismWebGLContextManager {
    constructor(gl) {
        this.gl = gl;
        this.offscreenRenderTargetContainers =
            new Array();
        this.previousActiveRenderTextureMaxCount = 0;
        this.currentActiveRenderTextureCount = 0;
        this.hasResetThisFrame = false;
        this.width = 0;
        this.height = 0;
    }
    release() {
        if (this.offscreenRenderTargetContainers != null) {
            for (let index = 0; index < this.offscreenRenderTargetContainers.length; ++index) {
                const container = this.offscreenRenderTargetContainers[index];
                this.gl.deleteTexture(container.colorBuffer);
                this.gl.deleteFramebuffer(container.renderTexture);
            }
            this.offscreenRenderTargetContainers.length = 0;
            this.offscreenRenderTargetContainers = null;
        }
    }
}
/**
 * WebGLç”¨ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³æç”»æ©Ÿèƒ½ã‚’ç®¡ç†ã™ã‚‹ãƒžãƒãƒ¼ã‚¸ãƒ£
 * ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³æç”»æ©Ÿèƒ½ã«å¿…è¦ãªãƒ•ãƒ¬ãƒ¼ãƒ ãƒãƒƒãƒ•ã‚¡ãªã©ã‚’å«ã‚€ã‚³ãƒ³ãƒ†ãƒŠã‚’ç®¡ç†ã™ã‚‹ã€‚
 * è¤‡æ•°ã®WebGLContextã«å¯¾å¿œã€‚
 */
export class CubismWebGLOffscreenManager {
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    constructor() {
        this._contextManagers = new Map();
    }
    /**
     * ãƒ‡ã‚¹ãƒˆãƒ©ã‚¯ã‚¿ç›¸å½“ã®å‡¦ç†
     */
    release() {
        if (this._contextManagers != null) {
            for (const manager of this._contextManagers.values()) {
                manager.release();
            }
            this._contextManagers.clear();
            this._contextManagers = null;
        }
        CubismWebGLOffscreenManager._instance = null;
    }
    /**
     * ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹ã®å–å¾—
     *
     * @return ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹
     */
    static getInstance() {
        if (this._instance == null) {
            this._instance = new CubismWebGLOffscreenManager();
        }
        return this._instance;
    }
    /**
     * WebGLContextã«å¯¾å¿œã™ã‚‹ãƒžãƒãƒ¼ã‚¸ãƒ£ãƒ¼ã‚’å–å¾—ã¾ãŸã¯ä½œæˆ
     *
     * @param gl WebGLRenderingContextã¾ãŸã¯WebGL2RenderingContext
     * @return WebGLContextManager
     */
    getContextManager(gl) {
        if (!this._contextManagers.has(gl)) {
            this._contextManagers.set(gl, new CubismWebGLContextManager(gl));
        }
        return this._contextManagers.get(gl);
    }
    /**
     * æŒ‡å®šã•ã‚ŒãŸWebGLContextã®ãƒžãƒãƒ¼ã‚¸ãƒ£ãƒ¼ã‚’å‰Šé™¤
     *
     * @param gl WebGLRenderingContextã¾ãŸã¯WebGL2RenderingContext
     */
    removeContext(gl) {
        if (this._contextManagers.has(gl)) {
            const manager = this._contextManagers.get(gl);
            manager.release();
            this._contextManagers.delete(gl);
        }
    }
    /**
     * åˆæœŸåŒ–å‡¦ç†
     *
     * @param gl WebGLRenderingContextã¾ãŸã¯WebGL2RenderingContext
     * @param width å¹…
     * @param height é«˜ã•
     */
    initialize(gl, width, height) {
        const contextManager = this.getContextManager(gl);
        // initialize offscreenRenderTargetContainers
        if (contextManager.offscreenRenderTargetContainers != null) {
            for (let index = 0; index < contextManager.offscreenRenderTargetContainers.length; ++index) {
                const container = contextManager.offscreenRenderTargetContainers[index];
                contextManager.gl.deleteTexture(container.colorBuffer);
                contextManager.gl.deleteFramebuffer(container.renderTexture);
                container.clear();
            }
            contextManager.offscreenRenderTargetContainers.length = 0;
        }
        else {
            contextManager.offscreenRenderTargetContainers =
                new Array();
        }
        contextManager.width = width;
        contextManager.height = height;
        contextManager.previousActiveRenderTextureMaxCount = 0;
        contextManager.currentActiveRenderTextureCount = 0;
        contextManager.hasResetThisFrame = false;
    }
    /**
     * ãƒ¢ãƒ‡ãƒ«ã‚’æç”»ã™ã‚‹å‰ã«å‘¼ã³å‡ºã™ãƒ•ãƒ¬ãƒ¼ãƒ é–‹å§‹æ™‚ã®å‡¦ç†ã‚’è¡Œã†
     *
     * @param gl WebGLRenderingContextã¾ãŸã¯WebGL2RenderingContext
     */
    beginFrameProcess(gl) {
        const contextManager = this.getContextManager(gl);
        if (contextManager.hasResetThisFrame) {
            return;
        }
        contextManager.previousActiveRenderTextureMaxCount = 0;
        contextManager.hasResetThisFrame = true;
    }
    /**
     * ãƒ¢ãƒ‡ãƒ«ã®æç”»ãŒçµ‚ã‚ã£ãŸå¾Œã«å‘¼ã³å‡ºã™ãƒ•ãƒ¬ãƒ¼ãƒ çµ‚äº†æ™‚ã®å‡¦ç†
     *
     * @param gl WebGLRenderingContextã¾ãŸã¯WebGL2RenderingContext
     */
    endFrameProcess(gl) {
        const contextManager = this.getContextManager(gl);
        contextManager.hasResetThisFrame = false;
    }
    /**
     * ã‚³ãƒ³ãƒ†ãƒŠã‚µã‚¤ã‚ºã®å–å¾—
     *
     * @param gl WebGLRenderingContextã¾ãŸã¯WebGL2RenderingContext
     */
    getContainerSize(gl) {
        const contextManager = this.getContextManager(gl);
        if (contextManager.offscreenRenderTargetContainers == null) {
            return 0;
        }
        return contextManager.offscreenRenderTargetContainers.length;
    }
    /**
     * ä½¿ç”¨å¯èƒ½ãªãƒªã‚½ãƒ¼ã‚¹ã‚³ãƒ³ãƒ†ãƒŠã®å–å¾—
     *
     * @param gl WebGLRenderingContextã¾ãŸã¯WebGL2RenderingContext
     * @param width å¹…
     * @param height é«˜ã•
     * @param previousFramebuffer å‰ã®ãƒ•ãƒ¬ãƒ¼ãƒ ãƒãƒƒãƒ•ã‚¡
     * @return ä½¿ç”¨å¯èƒ½ãªãƒªã‚½ãƒ¼ã‚¹ã‚³ãƒ³ãƒ†ãƒŠ
     */
    getOffscreenRenderTargetContainers(gl, width, height, previousFramebuffer) {
        const contextManager = this.getContextManager(gl);
        // ã‚³ãƒ³ãƒ†ãƒŠãŒåˆæœŸåŒ–ã•ã‚Œã¦ã„ãªã„ã‹ã€ã‚µã‚¤ã‚ºãŒå¤‰ã‚ã£ãŸã‚‰åˆæœŸåŒ–ã—ç›´ã™
        if (contextManager.width != width ||
            contextManager.height != height ||
            contextManager.offscreenRenderTargetContainers == null) {
            this.initialize(gl, width, height);
        }
        // ä½¿ç”¨æ•°ã‚’æ›´æ–°
        this.updateRenderTargetContainerCount(gl);
        // ä½¿ã‚ã‚Œã¦ã„ãªã„ãƒªã‚½ãƒ¼ã‚¹ã‚³ãƒ³ãƒ†ãƒŠãŒã‚ã‚Œã°ãã‚Œã‚’è¿”ã™
        const container = this.getUnusedOffscreenRenderTargetContainer(gl);
        if (container != null) {
            return container;
        }
        // ä½¿ã‚ã‚Œã¦ã„ãªã„ãƒªã‚½ãƒ¼ã‚¹ã‚³ãƒ³ãƒ†ãƒŠãŒãªã‘ã‚Œã°æ–°ãŸã«ä½œæˆã™ã‚‹
        const offscreenRenderTextureContainer = this.createOffscreenRenderTargetContainer(gl, width, height, previousFramebuffer);
        return offscreenRenderTextureContainer;
    }
    /**
     * ãƒªã‚½ãƒ¼ã‚¹ã‚³ãƒ³ãƒ†ãƒŠã®ä½¿ç”¨çŠ¶æ…‹ã‚’å–å¾—
     *
     * @param gl WebGLRenderingContextã¾ãŸã¯WebGL2RenderingContext
     * @param renderTexture WebGLFramebuffer
     * @return ä½¿ç”¨ä¸­ã¯trueã€æœªä½¿ç”¨ã®å ´åˆã¯false
     */
    getUsingRenderTextureState(gl, renderTexture) {
        const contextManager = this.getContextManager(gl);
        for (let index = 0; index < contextManager.offscreenRenderTargetContainers.length; ++index) {
            if (contextManager.offscreenRenderTargetContainers[index].renderTexture ==
                renderTexture) {
                return contextManager.offscreenRenderTargetContainers[index].inUse;
            }
        }
        return true;
    }
    /**
     * ãƒªã‚½ãƒ¼ã‚¹ã‚³ãƒ³ãƒ†ãƒŠã®ä½¿ç”¨ã‚’é–‹å§‹ã™ã‚‹ã€‚
     *
     * @param gl WebGLRenderingContextã¾ãŸã¯WebGL2RenderingContext
     * @param renderTexture WebGLFramebuffer
     */
    startUsingRenderTexture(gl, renderTexture) {
        const contextManager = this.getContextManager(gl);
        for (let index = 0; index < contextManager.offscreenRenderTargetContainers.length; ++index) {
            if (contextManager.offscreenRenderTargetContainers[index].renderTexture !=
                renderTexture) {
                continue;
            }
            contextManager.offscreenRenderTargetContainers[index].inUse = true;
            this.updateRenderTargetContainerCount(gl);
            break;
        }
    }
    /**
     * ãƒªã‚½ãƒ¼ã‚¹ã‚³ãƒ³ãƒ†ãƒŠã®ä½¿ç”¨ã‚’çµ‚äº†ã™ã‚‹ã€‚
     *
     * @param gl WebGLRenderingContextã¾ãŸã¯WebGL2RenderingContext
     * @param renderTexture WebGLFramebuffer
     */
    stopUsingRenderTexture(gl, renderTexture) {
        const contextManager = this.getContextManager(gl);
        for (let index = 0; index < contextManager.offscreenRenderTargetContainers.length; ++index) {
            if (contextManager.offscreenRenderTargetContainers[index].renderTexture !=
                renderTexture) {
                continue;
            }
            contextManager.offscreenRenderTargetContainers[index].inUse = false;
            contextManager.currentActiveRenderTextureCount--;
            if (contextManager.currentActiveRenderTextureCount < 0) {
                contextManager.currentActiveRenderTextureCount = 0;
            }
            break;
        }
    }
    /**
     * ãƒªã‚½ãƒ¼ã‚¹ã‚³ãƒ³ãƒ†ãƒŠã®ä½¿ç”¨ã‚’å…¨ã¦çµ‚äº†ã™ã‚‹ã€‚
     *
     * @param gl WebGLRenderingContextã¾ãŸã¯WebGL2RenderingContext
     */
    stopUsingAllRenderTextures(gl) {
        const contextManager = this.getContextManager(gl);
        for (let index = 0; index < contextManager.offscreenRenderTargetContainers.length; ++index) {
            contextManager.offscreenRenderTargetContainers[index].inUse = false;
        }
        contextManager.currentActiveRenderTextureCount = 0;
    }
    /**
     * ä½¿ç”¨ã•ã‚Œã¦ã„ãªã„ãƒªã‚½ãƒ¼ã‚¹ã‚³ãƒ³ãƒ†ãƒŠã‚’è§£æ”¾ã™ã‚‹ã€‚
     *
     * @param gl WebGLRenderingContextã¾ãŸã¯WebGL2RenderingContext
     */
    releaseStaleRenderTextures(gl) {
        const contextManager = this.getContextManager(gl);
        const listSize = contextManager.offscreenRenderTargetContainers.length;
        if (contextManager.hasResetThisFrame || listSize === 0) {
            // ä½¿ç”¨ã™ã‚‹é‡ãŒå¤‰åŒ–ã™ã‚‹å ´åˆã¯é–‹æ”¾ã—ãªã„
            return;
        }
        // æœªä½¿ç”¨ãªå ´æ‰€ã‚’é–‹æ”¾ã—ã¦ç›´å‰ã®æœ€å¤§æ•°ã¾ã§ãƒªã‚µã‚¤ã‚ºã™ã‚‹
        let findPos = 0;
        let resize = contextManager.previousActiveRenderTextureMaxCount;
        for (let i = listSize; contextManager.previousActiveRenderTextureMaxCount < i; --i) {
            const index = i - 1;
            if (contextManager.offscreenRenderTargetContainers[index].inUse) {
                // ç©ºã„ã¦ã„ã‚‹å ´æ‰€æŽ¢ã—ã¦ç§»å‹•ã•ã›ã‚‹
                let isFind = false;
                for (; findPos < contextManager.previousActiveRenderTextureMaxCount; ++findPos) {
                    if (!contextManager.offscreenRenderTargetContainers[findPos].inUse) {
                        const tempContainer = contextManager.offscreenRenderTargetContainers[findPos];
                        contextManager.offscreenRenderTargetContainers[findPos] =
                            contextManager.offscreenRenderTargetContainers[index];
                        contextManager.offscreenRenderTargetContainers[findPos].inUse =
                            true;
                        contextManager.offscreenRenderTargetContainers[index] =
                            tempContainer;
                        contextManager.offscreenRenderTargetContainers[index].inUse = false;
                        isFind = true;
                        break;
                    }
                }
                if (!isFind) {
                    // ç©ºã„ã¦ã„ã‚‹å ´æ‰€ãŒè¦‹ã¤ã‹ã‚‰ãªã‹ã£ãŸã‚‰ç¾çŠ¶ã®ã‚µã‚¤ã‚ºã§ãƒªã‚µã‚¤ã‚ºã™ã‚‹
                    resize = i;
                    break;
                }
            }
            const container = contextManager.offscreenRenderTargetContainers[index];
            contextManager.gl.bindTexture(contextManager.gl.TEXTURE_2D, null);
            contextManager.gl.deleteTexture(container.colorBuffer);
            contextManager.gl.bindFramebuffer(contextManager.gl.FRAMEBUFFER, null);
            contextManager.gl.deleteFramebuffer(container.renderTexture);
            container.clear();
        }
        updateSize(contextManager.offscreenRenderTargetContainers, resize);
    }
    /**
     * ç›´å‰ã®ã‚¢ã‚¯ãƒ†ã‚£ãƒ–ãªãƒ¬ãƒ³ãƒ€ãƒ¼ã‚¿ãƒ¼ã‚²ãƒƒãƒˆã®æœ€å¤§æ•°ã‚’å–å¾—
     *
     * @param gl WebGLRenderingContextã¾ãŸã¯WebGL2RenderingContext
     * @returns ç›´å‰ã®ã‚¢ã‚¯ãƒ†ã‚£ãƒ–ãªãƒ¬ãƒ³ãƒ€ãƒ¼ã‚¿ãƒ¼ã‚²ãƒƒãƒˆã®æœ€å¤§æ•°
     */
    getPreviousActiveRenderTextureCount(gl) {
        const contextManager = this.getContextManager(gl);
        return contextManager.previousActiveRenderTextureMaxCount;
    }
    /**
     * ç¾åœ¨ã®ã‚¢ã‚¯ãƒ†ã‚£ãƒ–ãªãƒ¬ãƒ³ãƒ€ãƒ¼ã‚¿ãƒ¼ã‚²ãƒƒãƒˆã®æ•°ã‚’å–å¾—
     *
     * @param gl WebGLRenderingContextã¾ãŸã¯WebGL2RenderingContext
     * @returns ç¾åœ¨ã®ã‚¢ã‚¯ãƒ†ã‚£ãƒ–ãªãƒ¬ãƒ³ãƒ€ãƒ¼ã‚¿ãƒ¼ã‚²ãƒƒãƒˆã®æ•°
     */
    getCurrentActiveRenderTextureCount(gl) {
        const contextManager = this.getContextManager(gl);
        return contextManager.currentActiveRenderTextureCount;
    }
    /**
     * ç¾åœ¨ã®ã‚¢ã‚¯ãƒ†ã‚£ãƒ–ãªãƒ¬ãƒ³ãƒ€ãƒ¼ã‚¿ãƒ¼ã‚²ãƒƒãƒˆã®æ•°ã‚’æ›´æ–°
     *
     * @param gl WebGLRenderingContextã¾ãŸã¯WebGL2RenderingContext
     */
    updateRenderTargetContainerCount(gl) {
        const contextManager = this.getContextManager(gl);
        ++contextManager.currentActiveRenderTextureCount;
        // æœ€å¤§æ•°æ›´æ–°
        contextManager.previousActiveRenderTextureMaxCount =
            contextManager.currentActiveRenderTextureCount >
                contextManager.previousActiveRenderTextureMaxCount
                ? contextManager.currentActiveRenderTextureCount
                : contextManager.previousActiveRenderTextureMaxCount;
    }
    /**
     * ä½¿ç”¨ã•ã‚Œã¦ã„ãªã„ãƒªã‚½ãƒ¼ã‚¹ã‚³ãƒ³ãƒ†ãƒŠã®å–å¾—
     *
     * @param gl WebGLRenderingContextã¾ãŸã¯WebGL2RenderingContext
     * @return ä½¿ç”¨ã•ã‚Œã¦ã„ãªã„ãƒªã‚½ãƒ¼ã‚¹ã‚³ãƒ³ãƒ†ãƒŠ
     */
    getUnusedOffscreenRenderTargetContainer(gl) {
        const contextManager = this.getContextManager(gl);
        // ä½¿ã‚ã‚Œã¦ã„ãªã„ãƒªã‚½ãƒ¼ã‚¹ã‚³ãƒ³ãƒ†ãƒŠãŒã‚ã‚Œã°ãã‚Œã‚’è¿”ã™
        for (let index = 0; index < contextManager.offscreenRenderTargetContainers.length; ++index) {
            const container = contextManager.offscreenRenderTargetContainers[index];
            if (container.inUse == false) {
                container.inUse = true;
                return container;
            }
        }
        return null;
    }
    /**
     * æ–°ãŸã«ãƒªã‚½ãƒ¼ã‚¹ã‚³ãƒ³ãƒ†ãƒŠã‚’ä½œæˆã™ã‚‹ã€‚
     *
     * @param gl WebGLRenderingContextã¾ãŸã¯WebGL2RenderingContext
     * @param width å¹…
     * @param height é«˜ã•
     * @param previousFramebuffer å‰ã®ãƒ•ãƒ¬ãƒ¼ãƒ ãƒãƒƒãƒ•ã‚¡
     * @return ä½œæˆã•ã‚ŒãŸãƒªã‚½ãƒ¼ã‚¹ã‚³ãƒ³ãƒ†ãƒŠ
     */
    createOffscreenRenderTargetContainer(gl, width, height, previousFramebuffer) {
        const renderTarget = new CubismRenderTarget_WebGL();
        if (!renderTarget.createRenderTarget(gl, width, height, previousFramebuffer)) {
            CubismLogError('Failed to create offscreen render texture.');
            return null;
        }
        const offscreenRenderTextureContainer = new CubismRenderTargetContainer(renderTarget.getColorBuffer(), renderTarget.getRenderTexture(), true);
        const contextManager = this.getContextManager(gl);
        contextManager.offscreenRenderTargetContainers.push(offscreenRenderTextureContainer);
        return offscreenRenderTextureContainer;
    }
}
//# sourceMappingURL=cubismoffscreenmanager.js.map