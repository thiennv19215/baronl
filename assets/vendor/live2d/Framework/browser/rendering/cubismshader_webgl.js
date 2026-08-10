/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { CubismMatrix44 } from '../math/cubismmatrix44.js';
import { CubismColorBlend, CubismAlphaBlend } from '../model/cubismmodel.js';
import { CubismLogError, CubismLogWarning } from '../utils/cubismdebug.js';
import { CubismRenderTarget_WebGL } from './cubismrendertarget_webgl.js';
import { CubismBlendMode, CubismTextureColor } from './cubismrenderer.js';
// Shader
const VertShaderSrcPath = 'vertshadersrc.vert';
const VertShaderSrcMaskedPath = 'vertshadersrcmasked.vert';
const VertShaderSrcSetupMaskPath = 'vertshadersrcsetupmask.vert';
const FragShaderSrcSetupMaskPath = 'fragshadersrcsetupmask.frag';
const FragShaderSrcPremultipliedAlphaPath = 'fragshadersrcpremultipliedalpha.frag';
const FragShaderSrcMaskPremultipliedAlphaPath = 'fragshadersrcmaskpremultipliedalpha.frag';
const FragShaderSrcMaskInvertedPremultipliedAlphaPath = 'fragshadersrcmaskinvertedpremultipliedalpha.frag';
// Copy & Blend Shader
const VertShaderSrcCopyPath = 'vertshadersrccopy.vert';
const FragShaderSrcCopyPath = 'fragshadersrccopy.frag';
const FragShaderSrcColorBlendPath = 'fragshadersrccolorblend.frag';
const FragShaderSrcAlphaBlendPath = 'fragshadersrcalphablend.frag';
const VertShaderSrcBlendPath = 'vertshadersrcblend.vert';
const FragShaderSrcBlendPath = 'fragshadersrcpremultipliedalphablend.frag';
// Blend mode Prefix
const ColorBlendPrefix = 'ColorBlend_';
const AlphaBlendPrefix = 'AlphaBlend_';
let s_instance; // ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹ï¼ˆã‚·ãƒ³ã‚°ãƒ«ãƒˆãƒ³ï¼‰
const s_renderTargetVertexArray = new Float32Array([
    -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0
]);
const s_renderTargetUvArray = new Float32Array([
    0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0
]);
const s_renderTargetReverseUvArray = new Float32Array([
    0.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0
]);
/**
 * WebGLç”¨ã®ã‚·ã‚§ãƒ¼ãƒ€ãƒ¼ãƒ—ãƒ­ã‚°ãƒ©ãƒ ã‚’ç”Ÿæˆãƒ»ç ´æ£„ã™ã‚‹ã‚¯ãƒ©ã‚¹
 */
export class CubismShader_WebGL {
    /**
     * éžåŒæœŸã§ã‚·ã‚§ãƒ¼ãƒ€ãƒ¼ã‚’ãƒ‘ã‚¹ã‹ã‚‰èª­ã¿è¾¼ã‚€
     *
     * @param url ã‚·ã‚§ãƒ¼ãƒ€ãƒ¼ã®URL
     *
     * @return ã‚·ã‚§ãƒ¼ãƒ€ãƒ¼ã®ã‚½ãƒ¼ã‚¹ã‚³ãƒ¼ãƒ‰
     */
    loadShader(url) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(url);
            return yield response.text();
        });
    }
    /**
     * ãƒ–ãƒ¬ãƒ³ãƒ‰ãƒ¢ãƒ¼ãƒ‰ç”¨ã®ã‚·ã‚§ãƒ¼ãƒ€ãƒ¼ã‚’èª­ã¿è¾¼ã‚€
     */
    loadShaders() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            // _shaderPathãŒnullã¾ãŸã¯undefinedã®å ´åˆã¯ãƒ‡ãƒ•ã‚©ãƒ«ãƒˆãƒ‘ã‚¹ã‚’ä½¿ç”¨
            const shaderDir = (_a = this._shaderPath) !== null && _a !== void 0 ? _a : this._defaultShaderPath;
            // ã‚·ã‚§ãƒ¼ãƒ€ãƒ¼ãƒ•ã‚¡ã‚¤ãƒ«ã®ãƒ‘ã‚¹ã¨ãƒ—ãƒ­ãƒ‘ãƒ†ã‚£ã®å¯¾å¿œ
            // NOTE: prop ã¯ CubismShader_WebGL ã«è¨­å®šã•ã‚ŒãŸå¤‰æ•°å
            const shaderFiles = [
                { path: shaderDir + VertShaderSrcPath, prop: '_vertShaderSrc' },
                {
                    path: shaderDir + VertShaderSrcMaskedPath,
                    prop: '_vertShaderSrcMasked'
                },
                {
                    path: shaderDir + VertShaderSrcSetupMaskPath,
                    prop: '_vertShaderSrcSetupMask'
                },
                {
                    path: shaderDir + FragShaderSrcSetupMaskPath,
                    prop: '_fragShaderSrcSetupMask'
                },
                {
                    path: shaderDir + FragShaderSrcPremultipliedAlphaPath,
                    prop: '_fragShaderSrcPremultipliedAlpha'
                },
                {
                    path: shaderDir + FragShaderSrcMaskPremultipliedAlphaPath,
                    prop: '_fragShaderSrcMaskPremultipliedAlpha'
                },
                {
                    path: shaderDir + FragShaderSrcMaskInvertedPremultipliedAlphaPath,
                    prop: '_fragShaderSrcMaskInvertedPremultipliedAlpha'
                },
                { path: shaderDir + VertShaderSrcCopyPath, prop: '_vertShaderSrcCopy' },
                { path: shaderDir + FragShaderSrcCopyPath, prop: '_fragShaderSrcCopy' },
                {
                    path: shaderDir + FragShaderSrcColorBlendPath,
                    prop: '_fragShaderSrcColorBlend'
                },
                {
                    path: shaderDir + FragShaderSrcAlphaBlendPath,
                    prop: '_fragShaderSrcAlphaBlend'
                },
                { path: shaderDir + VertShaderSrcBlendPath, prop: '_vertShaderSrcBlend' },
                { path: shaderDir + FragShaderSrcBlendPath, prop: '_fragShaderSrcBlend' }
            ];
            // ã‚·ã‚§ãƒ¼ãƒ€ãƒ¼ãƒ•ã‚¡ã‚¤ãƒ«ã‚’éžåŒæœŸã§èª­ã¿è¾¼ã¿ã€çµæžœã‚’ãƒ—ãƒ­ãƒ‘ãƒ†ã‚£ã«è¨­å®š
            const results = yield Promise.all(shaderFiles.map(file => this.loadShader(file.path)
                .then(data => ({ prop: file.prop, data }))
                .catch(error => {
                console.error(`Error loading ${file.path} shader:`, error);
                return { prop: file.prop, data: '' };
            })));
            // å¤‰æ•°ã«å†…å®¹ã‚’ç™»éŒ²
            results.forEach(result => {
                this[result.prop] = result.data;
            });
        });
    }
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    constructor() {
        this._shaderSets = new Array();
        this._isShaderLoading = false;
        this._isShaderLoaded = false;
        // ã‚«ãƒ©ãƒ¼ãƒ–ãƒ¬ãƒ³ãƒ‰ç”¨ã®ãƒžãƒƒãƒ—
        this._colorBlendMap = new Map();
        this._colorBlendValues = new Array();
        const colorBlendKeys = Object.keys(CubismColorBlend);
        // Object.values() ã®ãƒãƒªãƒ•ã‚£ãƒ«
        const colorBlendRawValues = Object.keys(CubismColorBlend).map(k => CubismColorBlend[k]);
        for (let i = 0; i < colorBlendKeys.length; i++) {
            const colorBlendKey = colorBlendKeys[i];
            if (colorBlendKey.includes(ColorBlendPrefix)) {
                const blendModeName = colorBlendKey.slice(ColorBlendPrefix.length);
                const colorBlendNumber = parseInt(colorBlendRawValues[i].toString());
                this._colorBlendMap.set(colorBlendNumber, blendModeName);
                this._colorBlendValues.push(colorBlendNumber);
            }
        }
        // ã‚¢ãƒ«ãƒ•ã‚¡ãƒ–ãƒ¬ãƒ³ãƒ‰ç”¨ã®ãƒžãƒƒãƒ—
        this._alphaBlendMap = new Map();
        this._alphaBlendValues = new Array();
        const alphaBlendKeys = Object.keys(CubismAlphaBlend);
        // Object.values() ã®ãƒãƒªãƒ•ã‚£ãƒ«
        const alphaBlendRawValues = Object.keys(CubismAlphaBlend).map(k => CubismAlphaBlend[k]);
        for (let i = 0; i < alphaBlendKeys.length; i++) {
            const alphaBlendKey = alphaBlendKeys[i];
            if (alphaBlendKey.includes(AlphaBlendPrefix)) {
                const blendModeName = alphaBlendKey.slice(AlphaBlendPrefix.length);
                const alphaBlendNumber = parseInt(alphaBlendRawValues[i].toString());
                this._alphaBlendMap.set(alphaBlendNumber, blendModeName);
                this._alphaBlendValues.push(alphaBlendNumber);
            }
        }
        this._blendShaderSetMap = new Map();
        this._shaderCount =
            ShaderNames.ShaderNames_ShaderCount +
                1 +
                (this._colorBlendValues.length - 3) *
                    (this._alphaBlendValues.length - 1) *
                    3;
        // ã‚·ã‚§ãƒ¼ãƒ€ãƒ¼ã®æ•° =
        // (ãƒžã‚¹ã‚¯ç”Ÿæˆç”¨ + (é€šå¸¸ç”¨ + åŠ ç®— + ä¹—ç®—) * (ãƒžã‚¹ã‚¯ç„¡ã®ä¹—ç®—æ¸ˆã‚¢ãƒ«ãƒ•ã‚¡å¯¾å¿œç‰ˆ + ãƒžã‚¹ã‚¯æœ‰ã®ä¹—ç®—æ¸ˆã‚¢ãƒ«ãƒ•ã‚¡å¯¾å¿œç‰ˆ + ãƒžã‚¹ã‚¯æœ‰åè»¢ã®ä¹—ç®—æ¸ˆã‚¢ãƒ«ãƒ•ã‚¡å¯¾å¿œç‰ˆ))
        // + 1ï¼ˆã‚³ãƒ”ãƒ¼ç”¨ã®ã‚·ã‚§ãƒ¼ãƒ€ãƒ¼ï¼‰
        // + ã‚«ãƒ©ãƒ¼ãƒ–ãƒ¬ãƒ³ãƒ‰ã®æ•°ï¼ˆå¾Œæ–¹äº’æ›ã¨Noneé™¤ãï¼‰ * ã‚¢ãƒ«ãƒ•ã‚¡ãƒ–ãƒ¬ãƒ³ãƒ‰ã®æ•°ï¼ˆNoneé™¤ãï¼‰ * ï¼ˆé€šå¸¸ + ãƒžã‚¹ã‚¯ + åè»¢ãƒžã‚¹ã‚¯ï¼‰
        this._defaultShaderPath = '../../Framework/Shaders/WebGL/';
        this._shaderPath = this._defaultShaderPath;
    }
    /**
     * ãƒ‡ã‚¹ãƒˆãƒ©ã‚¯ã‚¿ç›¸å½“ã®å‡¦ç†
     */
    release() {
        this.releaseShaderProgram();
    }
    /**
     * æç”»ç”¨ã®ã‚·ã‚§ãƒ¼ãƒ€ãƒ—ãƒ­ã‚°ãƒ©ãƒ ã®ä¸€é€£ã®ã‚»ãƒƒãƒˆã‚¢ãƒƒãƒ—ã‚’å®Ÿè¡Œã™ã‚‹
     *
     * @param renderer ãƒ¬ãƒ³ãƒ€ãƒ©ãƒ¼
     * @param model æç”»å¯¾è±¡ã®ãƒ¢ãƒ‡ãƒ«
     * @param index æç”»å¯¾è±¡ã®ãƒ¡ãƒƒã‚·ãƒ¥ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     */
    setupShaderProgramForDrawable(renderer, model, index) {
        if (!renderer.isPremultipliedAlpha()) {
            CubismLogError('NoPremultipliedAlpha is not allowed');
        }
        if (this._shaderSets.length == 0) {
            this.generateShaders();
        }
        if (this._isShaderLoaded == false) {
            CubismLogWarning('Shader program is not initialized.');
            return;
        }
        // Blending
        let srcColor;
        let dstColor;
        let srcAlpha;
        let dstAlpha;
        // _shaderSetsç”¨ã®ã‚ªãƒ•ã‚»ãƒƒãƒˆè¨ˆç®—
        const masked = renderer.getClippingContextBufferForDrawable() != null; // ã“ã®æç”»ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã¯ãƒžã‚¹ã‚¯å¯¾è±¡ã‹
        const invertedMask = model.getDrawableInvertedMaskBit(index);
        const offset = masked ? (invertedMask ? 2 : 1) : 0;
        let shaderSet;
        // Cubism 5.2ä»¥å‰ã®ã‚·ã‚§ãƒ¼ãƒ€ã‚’ä½¿ç”¨ã™ã‚‹å ´åˆã¯true
        let isUsingCompatible = true;
        if (model.isBlendModeEnabled()) {
            const colorBlendMode = model.getDrawableColorBlend(index);
            const alphaBlendMode = model.getDrawableAlphaBlend(index);
            if (colorBlendMode == CubismColorBlend.ColorBlend_None ||
                alphaBlendMode == CubismAlphaBlend.AlphaBlend_None ||
                (colorBlendMode == CubismColorBlend.ColorBlend_Normal &&
                    alphaBlendMode == CubismAlphaBlend.AlphaBlend_Over)) {
                // Cubism 5.2ä»¥å‰ã®ã‚·ã‚§ãƒ¼ãƒ€ã‚’ä½¿ç”¨ã™ã‚‹ã€‚
                shaderSet =
                    this._shaderSets[ShaderNames.ShaderNames_NormalPremultipliedAlpha + offset];
                srcColor = this.gl.ONE;
                dstColor = this.gl.ONE_MINUS_SRC_ALPHA;
                srcAlpha = this.gl.ONE;
                dstAlpha = this.gl.ONE_MINUS_SRC_ALPHA;
            }
            else {
                switch (colorBlendMode) {
                    // Cubism 5.2ä»¥å‰ã®ã‚·ã‚§ãƒ¼ãƒ€ã‚’ä½¿ç”¨ã™ã‚‹ã€‚
                    case CubismColorBlend.ColorBlend_AddCompatible:
                        shaderSet =
                            this._shaderSets[ShaderNames.ShaderNames_AddPremultipliedAlpha + offset];
                        srcColor = this.gl.ONE;
                        dstColor = this.gl.ONE;
                        srcAlpha = this.gl.ZERO;
                        dstAlpha = this.gl.ONE;
                        break;
                    // Cubism 5.2ä»¥å‰ã®ã‚·ã‚§ãƒ¼ãƒ€ã‚’ä½¿ç”¨ã™ã‚‹ã€‚
                    case CubismColorBlend.ColorBlend_MultiplyCompatible:
                        shaderSet =
                            this._shaderSets[ShaderNames.ShaderNames_MultPremultipliedAlpha + offset];
                        srcColor = this.gl.DST_COLOR;
                        dstColor = this.gl.ONE_MINUS_SRC_ALPHA;
                        srcAlpha = this.gl.ZERO;
                        dstAlpha = this.gl.ONE;
                        break;
                    // ãƒ–ãƒ¬ãƒ³ãƒ‰ãƒ¢ãƒ¼ãƒ‰ã®çµ„ã¿åˆã‚ã›ã§ã‚·ã‚§ãƒ¼ãƒ€ãƒ¼ã‚’æ±ºå®š
                    default:
                        {
                            const srcBuffer = renderer._currentOffscreen != null
                                ? renderer._currentOffscreen
                                : renderer.getModelRenderTarget(0);
                            // å…ˆã«ã‚³ãƒ”ãƒ¼ã‚’è¡Œã†
                            CubismRenderTarget_WebGL.copyBuffer(this.gl, srcBuffer, renderer.getModelRenderTarget(1));
                            const baseShaderSetIndex = this._blendShaderSetMap.get(this._colorBlendMap.get(colorBlendMode) +
                                this._alphaBlendMap.get(alphaBlendMode));
                            shaderSet = this._shaderSets[baseShaderSetIndex + offset];
                            srcColor = this.gl.ONE;
                            dstColor = this.gl.ZERO;
                            srcAlpha = this.gl.ONE;
                            dstAlpha = this.gl.ZERO;
                            isUsingCompatible = false;
                        }
                        break;
                }
            }
        }
        else {
            // Cubism 5.2ä»¥å‰ã®ã‚·ã‚§ãƒ¼ãƒ€ã‚’ä½¿ç”¨ã™ã‚‹ã€‚
            switch (model.getDrawableBlendMode(index)) {
                case CubismBlendMode.CubismBlendMode_Normal:
                default:
                    shaderSet =
                        this._shaderSets[ShaderNames.ShaderNames_NormalPremultipliedAlpha + offset];
                    srcColor = this.gl.ONE;
                    dstColor = this.gl.ONE_MINUS_SRC_ALPHA;
                    srcAlpha = this.gl.ONE;
                    dstAlpha = this.gl.ONE_MINUS_SRC_ALPHA;
                    break;
                case CubismBlendMode.CubismBlendMode_Additive:
                    shaderSet =
                        this._shaderSets[ShaderNames.ShaderNames_AddPremultipliedAlpha + offset];
                    srcColor = this.gl.ONE;
                    dstColor = this.gl.ONE;
                    srcAlpha = this.gl.ZERO;
                    dstAlpha = this.gl.ONE;
                    break;
                case CubismBlendMode.CubismBlendMode_Multiplicative:
                    shaderSet =
                        this._shaderSets[ShaderNames.ShaderNames_MultPremultipliedAlpha + offset];
                    srcColor = this.gl.DST_COLOR;
                    dstColor = this.gl.ONE_MINUS_SRC_ALPHA;
                    srcAlpha = this.gl.ZERO;
                    dstAlpha = this.gl.ONE;
                    break;
            }
        }
        this.gl.useProgram(shaderSet.shaderProgram);
        // é ‚ç‚¹é…åˆ—ã®è¨­å®š
        if (renderer._bufferData.vertex == null) {
            renderer._bufferData.vertex = this.gl.createBuffer();
        }
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, renderer._bufferData.vertex);
        // é ‚ç‚¹é…åˆ—ã®è¨­å®š
        const vertexArray = model.getDrawableVertices(index);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertexArray, this.gl.DYNAMIC_DRAW);
        this.gl.enableVertexAttribArray(shaderSet.attributePositionLocation);
        this.gl.vertexAttribPointer(shaderSet.attributePositionLocation, 2, this.gl.FLOAT, false, 0, 0);
        // ãƒ†ã‚¯ã‚¹ãƒãƒ£é ‚ç‚¹ã®è¨­å®š
        if (renderer._bufferData.uv == null) {
            renderer._bufferData.uv = this.gl.createBuffer();
        }
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, renderer._bufferData.uv);
        const uvArray = model.getDrawableVertexUvs(index);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, uvArray, this.gl.DYNAMIC_DRAW);
        this.gl.enableVertexAttribArray(shaderSet.attributeTexCoordLocation);
        this.gl.vertexAttribPointer(shaderSet.attributeTexCoordLocation, 2, this.gl.FLOAT, false, 0, 0);
        if (masked) {
            this.gl.activeTexture(this.gl.TEXTURE1);
            // frameBufferã«æ›¸ã‹ã‚ŒãŸãƒ†ã‚¯ã‚¹ãƒãƒ£
            const tex = renderer
                .getDrawableMaskBuffer(renderer.getClippingContextBufferForDrawable()._bufferIndex)
                .getColorBuffer();
            this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
            this.gl.uniform1i(shaderSet.samplerTexture1Location, 1);
            // viewåº§æ¨™ã‚’ClippingContextã®åº§æ¨™ã«å¤‰æ›ã™ã‚‹ãŸã‚ã®è¡Œåˆ—ã‚’è¨­å®š
            this.gl.uniformMatrix4fv(shaderSet.uniformClipMatrixLocation, false, renderer.getClippingContextBufferForDrawable()._matrixForDraw.getArray());
            // ä½¿ç”¨ã™ã‚‹ã‚«ãƒ©ãƒ¼ãƒãƒ£ãƒ³ãƒãƒ«ã‚’è¨­å®š
            const channelIndex = renderer.getClippingContextBufferForDrawable()._layoutChannelIndex;
            const colorChannel = renderer
                .getClippingContextBufferForDrawable()
                .getClippingManager()
                .getChannelFlagAsColor(channelIndex);
            this.gl.uniform4f(shaderSet.uniformChannelFlagLocation, colorChannel.r, colorChannel.g, colorChannel.b, colorChannel.a);
            if (model.isBlendModeEnabled()) {
                this.gl.uniform1f(shaderSet.uniformInvertMaskFlagLocation, invertedMask ? 1.0 : 0.0);
            }
        }
        // ãƒ†ã‚¯ã‚¹ãƒãƒ£è¨­å®š
        const textureNo = model.getDrawableTextureIndex(index);
        const textureId = renderer.getBindedTextures().get(textureNo);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, textureId);
        this.gl.uniform1i(shaderSet.samplerTexture0Location, 0);
        //åº§æ¨™å¤‰æ›
        const matrix4x4 = renderer.getMvpMatrix();
        this.gl.uniformMatrix4fv(shaderSet.uniformMatrixLocation, false, matrix4x4.getArray());
        //ãƒ™ãƒ¼ã‚¹è‰²ã®å–å¾—
        let baseColor = null;
        if (model.isBlendModeEnabled()) {
            // ãƒ–ãƒ¬ãƒ³ãƒ‰ãƒ¢ãƒ¼ãƒ‰ã§ã¯ãƒ¢ãƒ‡ãƒ«ã‚«ãƒ©ãƒ¼ã¯æœ€å¾Œã«å‡¦ç†ã™ã‚‹ãŸã‚ä¸é€æ˜Žåº¦ã®ã¿å¯¾å¿œã•ã›ã‚‹
            const drawableOpacity = model.getDrawableOpacity(index);
            baseColor = new CubismTextureColor(drawableOpacity, drawableOpacity, drawableOpacity, drawableOpacity);
        }
        else {
            baseColor = renderer.getModelColorWithOpacity(model.getDrawableOpacity(index));
        }
        const multiplyAndScreenColor = model.getOverrideMultiplyAndScreenColor();
        const multiplyColor = multiplyAndScreenColor.getDrawableMultiplyColor(index);
        const screenColor = multiplyAndScreenColor.getDrawableScreenColor(index);
        this.gl.uniform4f(shaderSet.uniformBaseColorLocation, baseColor.r, baseColor.g, baseColor.b, baseColor.a);
        this.gl.uniform4f(shaderSet.uniformMultiplyColorLocation, multiplyColor.r, multiplyColor.g, multiplyColor.b, multiplyColor.a);
        this.gl.uniform4f(shaderSet.uniformScreenColorLocation, screenColor.r, screenColor.g, screenColor.b, screenColor.a);
        // Cubism 5.3ä»¥é™ã®ã‚·ã‚§ãƒ¼ãƒ€ã‚’ä½¿ç”¨ã™ã‚‹å ´åˆ
        if (model.isBlendModeEnabled()) {
            this.gl.activeTexture(this.gl.TEXTURE2);
            // Cubism 5.2ä»¥å‰ã®ã‚·ã‚§ãƒ¼ãƒ€ã‚’ä½¿ç”¨ã™ã‚‹å ´åˆã¯ä¸è¦ãªã®ã§ã“ã®å‡¦ç†ã‚’ã‚¹ã‚­ãƒƒãƒ—
            if (!isUsingCompatible) {
                const tex = renderer
                    .getModelRenderTarget(1)
                    .getColorBuffer();
                this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
                this.gl.uniform1i(shaderSet.samplerFrameBufferTextureLocation, 2);
            }
        }
        // IBOã‚’ä½œæˆã—ã€ãƒ‡ãƒ¼ã‚¿ã‚’è»¢é€
        if (renderer._bufferData.index == null) {
            renderer._bufferData.index = this.gl.createBuffer();
        }
        const indexArray = model.getDrawableVertexIndices(index);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, renderer._bufferData.index);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, indexArray, this.gl.DYNAMIC_DRAW);
        this.gl.blendFuncSeparate(srcColor, dstColor, srcAlpha, dstAlpha);
    }
    /**
     * ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ç”¨ã®ã‚·ã‚§ãƒ¼ãƒ€ãƒ—ãƒ­ã‚°ãƒ©ãƒ ã®ä¸€é€£ã®ã‚»ãƒƒãƒˆã‚¢ãƒƒãƒ—ã‚’å®Ÿè¡Œã™ã‚‹
     *
     * @param renderer ãƒ¬ãƒ³ãƒ€ãƒ©ãƒ¼
     * @param model æç”»å¯¾è±¡ã®ãƒ¢ãƒ‡ãƒ«
     * @param offscreen æç”»å¯¾è±¡ã®ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³
     */
    setupShaderProgramForOffscreen(renderer, model, offscreen) {
        if (!renderer.isPremultipliedAlpha()) {
            CubismLogError('NoPremultipliedAlpha is not allowed');
        }
        if (this._shaderSets.length == 0) {
            this.generateShaders();
        }
        if (this._isShaderLoaded == false) {
            CubismLogWarning('Shader program is not initialized.');
            return;
        }
        // Blending
        let srcColor;
        let dstColor;
        let srcAlpha;
        let dstAlpha;
        const offscreenIndex = offscreen.getOffscreenIndex();
        // _shaderSetsç”¨ã®ã‚ªãƒ•ã‚»ãƒƒãƒˆè¨ˆç®—
        const masked = renderer.getClippingContextBufferForOffscreen() != null; // ã“ã®æç”»ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã¯ãƒžã‚¹ã‚¯å¯¾è±¡ã‹
        const invertedMask = model.getOffscreenInvertedMask(offscreenIndex);
        const offset = masked ? (invertedMask ? 2 : 1) : 0;
        let shaderSet;
        // Cubism 5.2ä»¥å‰ã®ã‚·ã‚§ãƒ¼ãƒ€ã‚’ä½¿ç”¨ã™ã‚‹å ´åˆã¯true
        let isUsingCompatible = true;
        const colorBlendMode = model.getOffscreenColorBlend(offscreenIndex);
        const alphaBlendMode = model.getOffscreenAlphaBlend(offscreenIndex);
        if (colorBlendMode == CubismColorBlend.ColorBlend_None ||
            alphaBlendMode == CubismAlphaBlend.AlphaBlend_None ||
            (colorBlendMode == CubismColorBlend.ColorBlend_Normal &&
                alphaBlendMode == CubismAlphaBlend.AlphaBlend_Over)) {
            // Cubism 5.2ä»¥å‰ã®ã‚·ã‚§ãƒ¼ãƒ€ã‚’ä½¿ç”¨ã™ã‚‹ã€‚
            shaderSet =
                this._shaderSets[ShaderNames.ShaderNames_NormalPremultipliedAlpha + offset];
            srcColor = this.gl.ONE;
            dstColor = this.gl.ONE_MINUS_SRC_ALPHA;
            srcAlpha = this.gl.ONE;
            dstAlpha = this.gl.ONE_MINUS_SRC_ALPHA;
        }
        else {
            switch (colorBlendMode) {
                // Cubism 5.2ä»¥å‰ã®ã‚·ã‚§ãƒ¼ãƒ€ã‚’ä½¿ç”¨ã™ã‚‹ã€‚
                case CubismColorBlend.ColorBlend_AddCompatible:
                    shaderSet =
                        this._shaderSets[ShaderNames.ShaderNames_AddPremultipliedAlpha + offset];
                    srcColor = this.gl.ONE;
                    dstColor = this.gl.ONE;
                    srcAlpha = this.gl.ZERO;
                    dstAlpha = this.gl.ONE;
                    break;
                case CubismColorBlend.ColorBlend_MultiplyCompatible:
                    shaderSet =
                        this._shaderSets[ShaderNames.ShaderNames_MultPremultipliedAlpha + offset];
                    srcColor = this.gl.DST_COLOR;
                    dstColor = this.gl.ONE_MINUS_SRC_ALPHA;
                    srcAlpha = this.gl.ZERO;
                    dstAlpha = this.gl.ONE;
                    break;
                default:
                    {
                        const srcBuffer = offscreen.getOldOffscreen() != null
                            ? offscreen.getOldOffscreen()
                            : renderer.getModelRenderTarget(0);
                        // å…ˆã«ã‚³ãƒ”ãƒ¼ã‚’è¡Œã†
                        CubismRenderTarget_WebGL.copyBuffer(this.gl, srcBuffer, renderer.getModelRenderTarget(1));
                        const baseShaderSetIndex = this._blendShaderSetMap.get(this._colorBlendMap.get(colorBlendMode) +
                            this._alphaBlendMap.get(alphaBlendMode));
                        shaderSet = this._shaderSets[baseShaderSetIndex + offset];
                        srcColor = this.gl.ONE;
                        dstColor = this.gl.ZERO;
                        srcAlpha = this.gl.ONE;
                        dstAlpha = this.gl.ZERO;
                        isUsingCompatible = false;
                    }
                    break;
            }
        }
        this.gl.useProgram(shaderSet.shaderProgram);
        // é ‚ç‚¹é…åˆ—ã®è¨­å®š
        CubismRenderTarget_WebGL.copyBuffer(this.gl, offscreen, renderer.getModelRenderTarget(2));
        this.gl.activeTexture(this.gl.TEXTURE0);
        const tex0 = renderer.getModelRenderTarget(2).getColorBuffer();
        this.gl.bindTexture(this.gl.TEXTURE_2D, tex0);
        this.gl.uniform1i(shaderSet.samplerTexture0Location, 0);
        //åº§æ¨™å¤‰æ›
        const matrix4x4 = new CubismMatrix44();
        matrix4x4.loadIdentity();
        this.gl.uniformMatrix4fv(shaderSet.uniformMatrixLocation, false, matrix4x4.getArray());
        // ãƒ™ãƒ¼ã‚¹è‰²ã®å–å¾—
        const offscreenOpacity = model.getOffscreenOpacity(offscreenIndex);
        // ä¹—ç®—æ¸ˆã¿ã‚¢ãƒ«ãƒ•ã‚¡ã‚’ä½¿ç”¨ã™ã‚‹ã®ã§ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã®é€æ˜Žåº¦ã‚’ 1.0 ã«ä¹—ç®—ã—ãŸçŠ¶æ…‹
        const baseColor = new CubismTextureColor(offscreenOpacity, offscreenOpacity, offscreenOpacity, offscreenOpacity);
        const multiplyAndScreenColor = model.getOverrideMultiplyAndScreenColor();
        const multiplyColor = multiplyAndScreenColor.getOffscreenMultiplyColor(offscreenIndex);
        const screenColor = multiplyAndScreenColor.getOffscreenScreenColor(offscreenIndex);
        this.gl.uniform4f(shaderSet.uniformBaseColorLocation, baseColor.r, baseColor.g, baseColor.b, baseColor.a);
        this.gl.uniform4f(shaderSet.uniformMultiplyColorLocation, multiplyColor.r, multiplyColor.g, multiplyColor.b, multiplyColor.a);
        this.gl.uniform4f(shaderSet.uniformScreenColorLocation, screenColor.r, screenColor.g, screenColor.b, screenColor.a);
        this.gl.activeTexture(this.gl.TEXTURE2);
        // Cubism 5.2ä»¥å‰ã®ã‚·ã‚§ãƒ¼ãƒ€ã‚’ä½¿ç”¨ã™ã‚‹å ´åˆã¯ä¸è¦ãªã®ã§ã“ã®å‡¦ç†ã‚’ã‚¹ã‚­ãƒƒãƒ—
        if (!isUsingCompatible) {
            const tex1 = renderer
                .getModelRenderTarget(1)
                .getColorBuffer();
            this.gl.bindTexture(this.gl.TEXTURE_2D, tex1);
            this.gl.uniform1i(shaderSet.samplerFrameBufferTextureLocation, 2);
        }
        if (masked) {
            this.gl.activeTexture(this.gl.TEXTURE1);
            // frameBufferã«æ›¸ã‹ã‚ŒãŸãƒ†ã‚¯ã‚¹ãƒãƒ£
            const tex2 = renderer
                .getOffscreenMaskBuffer(renderer.getClippingContextBufferForOffscreen()._bufferIndex)
                .getColorBuffer();
            this.gl.bindTexture(this.gl.TEXTURE_2D, tex2);
            this.gl.uniform1i(shaderSet.samplerTexture1Location, 1);
            // viewåº§æ¨™ã‚’ClippingContextã®åº§æ¨™ã«å¤‰æ›ã™ã‚‹ãŸã‚ã®è¡Œåˆ—ã‚’è¨­å®š
            this.gl.uniformMatrix4fv(shaderSet.uniformClipMatrixLocation, false, renderer
                .getClippingContextBufferForOffscreen()
                ._matrixForDraw.getArray());
            // ä½¿ç”¨ã™ã‚‹ã‚«ãƒ©ãƒ¼ãƒãƒ£ãƒ³ãƒãƒ«ã‚’è¨­å®š
            const channelIndex = renderer.getClippingContextBufferForOffscreen()._layoutChannelIndex;
            const colorChannel = renderer
                .getClippingContextBufferForOffscreen()
                .getClippingManager()
                .getChannelFlagAsColor(channelIndex);
            this.gl.uniform4f(shaderSet.uniformChannelFlagLocation, colorChannel.r, colorChannel.g, colorChannel.b, colorChannel.a);
            if (model.isBlendModeEnabled()) {
                this.gl.uniform1f(shaderSet.uniformInvertMaskFlagLocation, invertedMask ? 1.0 : 0.0);
            }
        }
        // é ‚ç‚¹ä½ç½®å±žæ€§ã®è¨­å®š
        if (!renderer._bufferData.vertex) {
            renderer._bufferData.vertex = this.gl.createBuffer();
        }
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, renderer._bufferData.vertex);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, s_renderTargetVertexArray, this.gl.STATIC_DRAW);
        this.gl.enableVertexAttribArray(shaderSet.attributePositionLocation);
        this.gl.vertexAttribPointer(shaderSet.attributePositionLocation, 2, this.gl.FLOAT, false, Float32Array.BYTES_PER_ELEMENT * 2, 0);
        // ãƒ†ã‚¯ã‚¹ãƒãƒ£åº§æ¨™å±žæ€§ã®è¨­å®š
        if (!renderer._bufferData.uv) {
            renderer._bufferData.uv = this.gl.createBuffer();
        }
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, renderer._bufferData.uv);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, s_renderTargetReverseUvArray, this.gl.STATIC_DRAW);
        this.gl.enableVertexAttribArray(shaderSet.attributeTexCoordLocation);
        this.gl.vertexAttribPointer(shaderSet.attributeTexCoordLocation, 2, this.gl.FLOAT, false, Float32Array.BYTES_PER_ELEMENT * 2, 0);
        this.gl.blendFuncSeparate(srcColor, dstColor, srcAlpha, dstAlpha);
    }
    /**
     * ãƒžã‚¹ã‚¯ç”¨ã®ã‚·ã‚§ãƒ¼ãƒ€ãƒ—ãƒ­ã‚°ãƒ©ãƒ ã®ä¸€é€£ã®ã‚»ãƒƒãƒˆã‚¢ãƒƒãƒ—ã‚’å®Ÿè¡Œã™ã‚‹
     *
     * @param renderer ãƒ¬ãƒ³ãƒ€ãƒ©ãƒ¼
     * @param model æç”»å¯¾è±¡ã®ãƒ¢ãƒ‡ãƒ«
     * @param index æç”»å¯¾è±¡ã®ãƒ¡ãƒƒã‚·ãƒ¥ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     */
    setupShaderProgramForMask(renderer, model, index) {
        if (!renderer.isPremultipliedAlpha()) {
            CubismLogError('NoPremultipliedAlpha is not allowed');
        }
        if (this._shaderSets.length == 0) {
            this.generateShaders();
        }
        if (this._isShaderLoaded == false) {
            CubismLogWarning('Shader program is not initialized.');
            return;
        }
        const shaderSet = this._shaderSets[ShaderNames.ShaderNames_SetupMask];
        this.gl.useProgram(shaderSet.shaderProgram);
        // é ‚ç‚¹é…åˆ—ã®è¨­å®š
        if (renderer._bufferData.vertex == null) {
            renderer._bufferData.vertex = this.gl.createBuffer();
        }
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, renderer._bufferData.vertex);
        const vertexArray = model.getDrawableVertices(index);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertexArray, this.gl.DYNAMIC_DRAW);
        this.gl.enableVertexAttribArray(shaderSet.attributePositionLocation);
        this.gl.vertexAttribPointer(shaderSet.attributePositionLocation, 2, this.gl.FLOAT, false, 0, 0);
        //ãƒ†ã‚¯ã‚¹ãƒãƒ£è¨­å®š
        if (renderer._bufferData.uv == null) {
            renderer._bufferData.uv = this.gl.createBuffer();
        }
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, renderer._bufferData.uv);
        const textureNo = model.getDrawableTextureIndex(index);
        const textureId = renderer.getBindedTextures().get(textureNo);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, textureId);
        this.gl.uniform1i(shaderSet.samplerTexture0Location, 0);
        // ãƒ†ã‚¯ã‚¹ãƒãƒ£é ‚ç‚¹ã®è¨­å®š
        if (renderer._bufferData.uv == null) {
            renderer._bufferData.uv = this.gl.createBuffer();
        }
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, renderer._bufferData.uv);
        const uvArray = model.getDrawableVertexUvs(index);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, uvArray, this.gl.DYNAMIC_DRAW);
        this.gl.enableVertexAttribArray(shaderSet.attributeTexCoordLocation);
        this.gl.vertexAttribPointer(shaderSet.attributeTexCoordLocation, 2, this.gl.FLOAT, false, 0, 0);
        // ãƒãƒ£ãƒ³ãƒãƒ«
        const channelIndex = renderer.getClippingContextBufferForMask()._layoutChannelIndex;
        const colorChannel = renderer
            .getClippingContextBufferForMask()
            .getClippingManager()
            .getChannelFlagAsColor(channelIndex);
        this.gl.uniform4f(shaderSet.uniformChannelFlagLocation, colorChannel.r, colorChannel.g, colorChannel.b, colorChannel.a);
        this.gl.uniformMatrix4fv(shaderSet.uniformClipMatrixLocation, false, renderer.getClippingContextBufferForMask()._matrixForMask.getArray());
        const rect = renderer.getClippingContextBufferForMask()._layoutBounds;
        this.gl.uniform4f(shaderSet.uniformBaseColorLocation, rect.x * 2.0 - 1.0, rect.y * 2.0 - 1.0, rect.getRight() * 2.0 - 1.0, rect.getBottom() * 2.0 - 1.0);
        // Blending
        const srcColor = this.gl.ZERO;
        const dstColor = this.gl.ONE_MINUS_SRC_COLOR;
        const srcAlpha = this.gl.ZERO;
        const dstAlpha = this.gl.ONE_MINUS_SRC_ALPHA;
        // IBOã‚’ä½œæˆã—ã€ãƒ‡ãƒ¼ã‚¿ã‚’è»¢é€
        if (renderer._bufferData.index == null) {
            renderer._bufferData.index = this.gl.createBuffer();
        }
        const indexArray = model.getDrawableVertexIndices(index);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, renderer._bufferData.index);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, indexArray, this.gl.DYNAMIC_DRAW);
        this.gl.blendFuncSeparate(srcColor, dstColor, srcAlpha, dstAlpha);
    }
    /**
     * ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã®ãƒ¬ãƒ³ãƒ€ãƒªãƒ³ã‚°ã‚¿ãƒ¼ã‚²ãƒƒãƒˆç”¨ã®ã‚·ã‚§ãƒ¼ãƒ€ãƒ¼ãƒ—ãƒ­ã‚°ãƒ©ãƒ ã‚’è¨­å®šã™ã‚‹
     *
     * @param renderer ãƒ¬ãƒ³ãƒ€ãƒ©ãƒ¼
     */
    setupShaderProgramForOffscreenRenderTarget(renderer) {
        if (this._shaderSets.length == 0) {
            this.generateShaders();
        }
        if (this._isShaderLoaded == false) {
            CubismLogWarning('Shader program is not initialized.');
            return;
        }
        // ã“ã®æ™‚ç‚¹ã®ãƒ†ã‚¯ã‚¹ãƒãƒ£ã¯PMAã«ãªã£ã¦ã„ã‚‹ã¯ãšãªã®ã§è¨ˆç®—ã‚’è¡Œã†
        const baseColor = renderer.getModelColor();
        baseColor.r *= baseColor.a;
        baseColor.g *= baseColor.a;
        baseColor.b *= baseColor.a;
        this.copyTexture(renderer, baseColor);
    }
    /**
     * ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã®ãƒ¬ãƒ³ãƒ€ãƒªãƒ³ã‚°ã‚¿ãƒ¼ã‚²ãƒƒãƒˆã®å†…å®¹ã‚’ã‚³ãƒ”ãƒ¼ã™ã‚‹
     *
     * @param renderer ãƒ¬ãƒ³ãƒ€ãƒ©ãƒ¼
     * @param baseColor ãƒ™ãƒ¼ã‚¹ã‚«ãƒ©ãƒ¼
     */
    copyTexture(renderer, baseColor) {
        // Blending
        const srcColor = this.gl.ONE;
        const dstColor = this.gl.ONE_MINUS_SRC_ALPHA;
        const srcAlpha = this.gl.ONE;
        const dstAlpha = this.gl.ONE_MINUS_SRC_ALPHA;
        const shaderSet = this._shaderSets[10]; // ShaderNames_Copy = 10
        this.gl.useProgram(shaderSet.shaderProgram);
        this.gl.uniform4f(shaderSet.uniformBaseColorLocation, baseColor.r, baseColor.g, baseColor.b, baseColor.a);
        // ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã®å†…å®¹ã‚’è¨­å®š
        this.gl.activeTexture(this.gl.TEXTURE0);
        const tex = renderer.getModelRenderTarget(0).getColorBuffer();
        this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
        this.gl.uniform1i(shaderSet.samplerTexture0Location, 0);
        // é ‚ç‚¹ä½ç½®å±žæ€§ã®è¨­å®š
        if (!renderer._bufferData.vertex) {
            renderer._bufferData.vertex = this.gl.createBuffer();
        }
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, renderer._bufferData.vertex);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, s_renderTargetVertexArray, this.gl.STATIC_DRAW);
        this.gl.enableVertexAttribArray(shaderSet.attributePositionLocation);
        this.gl.vertexAttribPointer(shaderSet.attributePositionLocation, 2, this.gl.FLOAT, false, Float32Array.BYTES_PER_ELEMENT * 2, 0);
        // ãƒ†ã‚¯ã‚¹ãƒãƒ£åº§æ¨™å±žæ€§ã®è¨­å®š
        if (!renderer._bufferData.uv) {
            renderer._bufferData.uv = this.gl.createBuffer();
        }
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, renderer._bufferData.uv);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, s_renderTargetUvArray, this.gl.STATIC_DRAW);
        this.gl.enableVertexAttribArray(shaderSet.attributeTexCoordLocation);
        this.gl.vertexAttribPointer(shaderSet.attributeTexCoordLocation, 2, this.gl.FLOAT, false, Float32Array.BYTES_PER_ELEMENT * 2, 0);
        this.gl.blendFuncSeparate(srcColor, dstColor, srcAlpha, dstAlpha);
    }
    /**
     * ã‚·ã‚§ãƒ¼ãƒ€ãƒ¼ãƒ—ãƒ­ã‚°ãƒ©ãƒ ã‚’è§£æ”¾ã™ã‚‹
     */
    releaseShaderProgram() {
        for (let i = 0; i < this._shaderSets.length; i++) {
            this.gl.deleteProgram(this._shaderSets[i].shaderProgram);
            this._shaderSets[i].shaderProgram = 0;
            this._shaderSets[i] = void 0;
            this._shaderSets[i] = null;
        }
    }
    /**
     * ã‚·ã‚§ãƒ¼ãƒ€ãƒ¼ãƒ—ãƒ­ã‚°ãƒ©ãƒ ã‚’åˆæœŸåŒ–ã™ã‚‹
     *
     * @param vertShaderSrc é ‚ç‚¹ã‚·ã‚§ãƒ¼ãƒ€ã®ã‚½ãƒ¼ã‚¹
     * @param fragShaderSrc ãƒ•ãƒ©ã‚°ãƒ¡ãƒ³ãƒˆã‚·ã‚§ãƒ¼ãƒ€ã®ã‚½ãƒ¼ã‚¹
     */
    generateShaders() {
        if (this._isShaderLoading) {
            return;
        }
        this._isShaderLoading = true;
        this._isShaderLoaded = false;
        this._shaderSets.length = this._shaderCount;
        for (let i = 0; i < this._shaderCount; i++) {
            this._shaderSets[i] = new CubismShaderSet();
        }
        // ã‚·ã‚§ãƒ¼ãƒ€ãƒ¼ã®ã‚½ãƒ¼ã‚¹ã®èª­ã¿è¾¼ã¿
        this.loadShaders()
            .then(() => {
            // NOTE: ãƒ•ã‚¡ã‚¤ãƒ«ã®èª­ã¿è¾¼ã¿ã‚’å¾…ã¤å¿…è¦ãŒã‚ã‚‹ãŸã‚ã“ã®ã‚ˆã†ã«ã™ã‚‹
            this.registerShader(); // é€šå¸¸ã‚·ã‚§ãƒ¼ãƒ€ãƒ¼ã®ç™»éŒ²
            this.registerBlendShader(); // ãƒ–ãƒ¬ãƒ³ãƒ‰ãƒ¢ãƒ¼ãƒ‰ã‚·ã‚§ãƒ¼ãƒ€ãƒ¼ã®ç™»éŒ²
            this._isShaderLoading = false;
            this._isShaderLoaded = true;
        })
            .catch(error => {
            this._isShaderLoading = false;
            console.error('Failed to load shaders:', error);
        });
    }
    /**
     * ã‚·ã‚§ãƒ¼ãƒ€ãƒ¼ãƒ—ãƒ­ã‚°ãƒ©ãƒ ã‚’ç™»éŒ²ã™ã‚‹
     */
    registerShader() {
        const vertexShaderSrc = this._vertShaderSrc;
        const vertexShaderSrcMasked = this._vertShaderSrcMasked;
        const vertexShaderSrcSetupMask = this._vertShaderSrcSetupMask;
        const fragmentShaderSrcSetupMask = this._fragShaderSrcSetupMask;
        const fragmentShaderSrcPremultipliedAlpha = this._fragShaderSrcPremultipliedAlpha;
        const fragmentShaderSrcMaskPremultipliedAlpha = this._fragShaderSrcMaskPremultipliedAlpha;
        const fragmentShaderSrcMaskInvertedPremultipliedAlpha = this._fragShaderSrcMaskInvertedPremultipliedAlpha;
        this._shaderSets[0].shaderProgram = this.loadShaderProgram(vertexShaderSrcSetupMask, fragmentShaderSrcSetupMask);
        this._shaderSets[1].shaderProgram = this.loadShaderProgram(vertexShaderSrc, fragmentShaderSrcPremultipliedAlpha);
        this._shaderSets[2].shaderProgram = this.loadShaderProgram(vertexShaderSrcMasked, fragmentShaderSrcMaskPremultipliedAlpha);
        this._shaderSets[3].shaderProgram = this.loadShaderProgram(vertexShaderSrcMasked, fragmentShaderSrcMaskInvertedPremultipliedAlpha);
        // åŠ ç®—ã‚‚é€šå¸¸ã¨åŒã˜ã‚·ã‚§ãƒ¼ãƒ€ãƒ¼ã‚’åˆ©ç”¨ã™ã‚‹
        this._shaderSets[4].shaderProgram = this._shaderSets[1].shaderProgram;
        this._shaderSets[5].shaderProgram = this._shaderSets[2].shaderProgram;
        this._shaderSets[6].shaderProgram = this._shaderSets[3].shaderProgram;
        // ä¹—ç®—ã‚‚é€šå¸¸ã¨åŒã˜ã‚·ã‚§ãƒ¼ãƒ€ãƒ¼ã‚’åˆ©ç”¨ã™ã‚‹
        this._shaderSets[7].shaderProgram = this._shaderSets[1].shaderProgram;
        this._shaderSets[8].shaderProgram = this._shaderSets[2].shaderProgram;
        this._shaderSets[9].shaderProgram = this._shaderSets[3].shaderProgram;
        // SetupMask
        this._shaderSets[0].attributePositionLocation = this.gl.getAttribLocation(this._shaderSets[0].shaderProgram, 'a_position');
        this._shaderSets[0].attributeTexCoordLocation = this.gl.getAttribLocation(this._shaderSets[0].shaderProgram, 'a_texCoord');
        this._shaderSets[0].samplerTexture0Location = this.gl.getUniformLocation(this._shaderSets[0].shaderProgram, 's_texture0');
        this._shaderSets[0].uniformClipMatrixLocation = this.gl.getUniformLocation(this._shaderSets[0].shaderProgram, 'u_clipMatrix');
        this._shaderSets[0].uniformChannelFlagLocation = this.gl.getUniformLocation(this._shaderSets[0].shaderProgram, 'u_channelFlag');
        this._shaderSets[0].uniformBaseColorLocation = this.gl.getUniformLocation(this._shaderSets[0].shaderProgram, 'u_baseColor');
        // é€šå¸¸ï¼ˆPremultipliedAlphaï¼‰
        this._shaderSets[1].attributePositionLocation = this.gl.getAttribLocation(this._shaderSets[1].shaderProgram, 'a_position');
        this._shaderSets[1].attributeTexCoordLocation = this.gl.getAttribLocation(this._shaderSets[1].shaderProgram, 'a_texCoord');
        this._shaderSets[1].samplerTexture0Location = this.gl.getUniformLocation(this._shaderSets[1].shaderProgram, 's_texture0');
        this._shaderSets[1].uniformMatrixLocation = this.gl.getUniformLocation(this._shaderSets[1].shaderProgram, 'u_matrix');
        this._shaderSets[1].uniformBaseColorLocation = this.gl.getUniformLocation(this._shaderSets[1].shaderProgram, 'u_baseColor');
        this._shaderSets[1].uniformMultiplyColorLocation =
            this.gl.getUniformLocation(this._shaderSets[1].shaderProgram, 'u_multiplyColor');
        this._shaderSets[1].uniformScreenColorLocation = this.gl.getUniformLocation(this._shaderSets[1].shaderProgram, 'u_screenColor');
        // é€šå¸¸ï¼ˆã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ã€PremultipliedAlphaï¼‰
        this._shaderSets[2].attributePositionLocation = this.gl.getAttribLocation(this._shaderSets[2].shaderProgram, 'a_position');
        this._shaderSets[2].attributeTexCoordLocation = this.gl.getAttribLocation(this._shaderSets[2].shaderProgram, 'a_texCoord');
        this._shaderSets[2].samplerTexture0Location = this.gl.getUniformLocation(this._shaderSets[2].shaderProgram, 's_texture0');
        this._shaderSets[2].samplerTexture1Location = this.gl.getUniformLocation(this._shaderSets[2].shaderProgram, 's_texture1');
        this._shaderSets[2].uniformMatrixLocation = this.gl.getUniformLocation(this._shaderSets[2].shaderProgram, 'u_matrix');
        this._shaderSets[2].uniformClipMatrixLocation = this.gl.getUniformLocation(this._shaderSets[2].shaderProgram, 'u_clipMatrix');
        this._shaderSets[2].uniformChannelFlagLocation = this.gl.getUniformLocation(this._shaderSets[2].shaderProgram, 'u_channelFlag');
        this._shaderSets[2].uniformBaseColorLocation = this.gl.getUniformLocation(this._shaderSets[2].shaderProgram, 'u_baseColor');
        this._shaderSets[2].uniformMultiplyColorLocation =
            this.gl.getUniformLocation(this._shaderSets[2].shaderProgram, 'u_multiplyColor');
        this._shaderSets[2].uniformScreenColorLocation = this.gl.getUniformLocation(this._shaderSets[2].shaderProgram, 'u_screenColor');
        // é€šå¸¸ï¼ˆã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒ»åè»¢, PremultipliedAlphaï¼‰
        this._shaderSets[3].attributePositionLocation = this.gl.getAttribLocation(this._shaderSets[3].shaderProgram, 'a_position');
        this._shaderSets[3].attributeTexCoordLocation = this.gl.getAttribLocation(this._shaderSets[3].shaderProgram, 'a_texCoord');
        this._shaderSets[3].samplerTexture0Location = this.gl.getUniformLocation(this._shaderSets[3].shaderProgram, 's_texture0');
        this._shaderSets[3].samplerTexture1Location = this.gl.getUniformLocation(this._shaderSets[3].shaderProgram, 's_texture1');
        this._shaderSets[3].uniformMatrixLocation = this.gl.getUniformLocation(this._shaderSets[3].shaderProgram, 'u_matrix');
        this._shaderSets[3].uniformClipMatrixLocation = this.gl.getUniformLocation(this._shaderSets[3].shaderProgram, 'u_clipMatrix');
        this._shaderSets[3].uniformChannelFlagLocation = this.gl.getUniformLocation(this._shaderSets[3].shaderProgram, 'u_channelFlag');
        this._shaderSets[3].uniformBaseColorLocation = this.gl.getUniformLocation(this._shaderSets[3].shaderProgram, 'u_baseColor');
        this._shaderSets[3].uniformMultiplyColorLocation =
            this.gl.getUniformLocation(this._shaderSets[3].shaderProgram, 'u_multiplyColor');
        this._shaderSets[3].uniformScreenColorLocation = this.gl.getUniformLocation(this._shaderSets[3].shaderProgram, 'u_screenColor');
        // åŠ ç®—ï¼ˆPremultipliedAlphaï¼‰
        this._shaderSets[4].attributePositionLocation = this.gl.getAttribLocation(this._shaderSets[4].shaderProgram, 'a_position');
        this._shaderSets[4].attributeTexCoordLocation = this.gl.getAttribLocation(this._shaderSets[4].shaderProgram, 'a_texCoord');
        this._shaderSets[4].samplerTexture0Location = this.gl.getUniformLocation(this._shaderSets[4].shaderProgram, 's_texture0');
        this._shaderSets[4].uniformMatrixLocation = this.gl.getUniformLocation(this._shaderSets[4].shaderProgram, 'u_matrix');
        this._shaderSets[4].uniformBaseColorLocation = this.gl.getUniformLocation(this._shaderSets[4].shaderProgram, 'u_baseColor');
        this._shaderSets[4].uniformMultiplyColorLocation =
            this.gl.getUniformLocation(this._shaderSets[4].shaderProgram, 'u_multiplyColor');
        this._shaderSets[4].uniformScreenColorLocation = this.gl.getUniformLocation(this._shaderSets[4].shaderProgram, 'u_screenColor');
        // åŠ ç®—ï¼ˆã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ã€PremultipliedAlphaï¼‰
        this._shaderSets[5].attributePositionLocation = this.gl.getAttribLocation(this._shaderSets[5].shaderProgram, 'a_position');
        this._shaderSets[5].attributeTexCoordLocation = this.gl.getAttribLocation(this._shaderSets[5].shaderProgram, 'a_texCoord');
        this._shaderSets[5].samplerTexture0Location = this.gl.getUniformLocation(this._shaderSets[5].shaderProgram, 's_texture0');
        this._shaderSets[5].samplerTexture1Location = this.gl.getUniformLocation(this._shaderSets[5].shaderProgram, 's_texture1');
        this._shaderSets[5].uniformMatrixLocation = this.gl.getUniformLocation(this._shaderSets[5].shaderProgram, 'u_matrix');
        this._shaderSets[5].uniformClipMatrixLocation = this.gl.getUniformLocation(this._shaderSets[5].shaderProgram, 'u_clipMatrix');
        this._shaderSets[5].uniformChannelFlagLocation = this.gl.getUniformLocation(this._shaderSets[5].shaderProgram, 'u_channelFlag');
        this._shaderSets[5].uniformBaseColorLocation = this.gl.getUniformLocation(this._shaderSets[5].shaderProgram, 'u_baseColor');
        this._shaderSets[5].uniformMultiplyColorLocation =
            this.gl.getUniformLocation(this._shaderSets[5].shaderProgram, 'u_multiplyColor');
        this._shaderSets[5].uniformScreenColorLocation = this.gl.getUniformLocation(this._shaderSets[5].shaderProgram, 'u_screenColor');
        // åŠ ç®—ï¼ˆã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒ»åè»¢ã€PremultipliedAlphaï¼‰
        this._shaderSets[6].attributePositionLocation = this.gl.getAttribLocation(this._shaderSets[6].shaderProgram, 'a_position');
        this._shaderSets[6].attributeTexCoordLocation = this.gl.getAttribLocation(this._shaderSets[6].shaderProgram, 'a_texCoord');
        this._shaderSets[6].samplerTexture0Location = this.gl.getUniformLocation(this._shaderSets[6].shaderProgram, 's_texture0');
        this._shaderSets[6].samplerTexture1Location = this.gl.getUniformLocation(this._shaderSets[6].shaderProgram, 's_texture1');
        this._shaderSets[6].uniformMatrixLocation = this.gl.getUniformLocation(this._shaderSets[6].shaderProgram, 'u_matrix');
        this._shaderSets[6].uniformClipMatrixLocation = this.gl.getUniformLocation(this._shaderSets[6].shaderProgram, 'u_clipMatrix');
        this._shaderSets[6].uniformChannelFlagLocation = this.gl.getUniformLocation(this._shaderSets[6].shaderProgram, 'u_channelFlag');
        this._shaderSets[6].uniformBaseColorLocation = this.gl.getUniformLocation(this._shaderSets[6].shaderProgram, 'u_baseColor');
        this._shaderSets[6].uniformMultiplyColorLocation =
            this.gl.getUniformLocation(this._shaderSets[6].shaderProgram, 'u_multiplyColor');
        this._shaderSets[6].uniformScreenColorLocation = this.gl.getUniformLocation(this._shaderSets[6].shaderProgram, 'u_screenColor');
        // ä¹—ç®—ï¼ˆPremultipliedAlphaï¼‰
        this._shaderSets[7].attributePositionLocation = this.gl.getAttribLocation(this._shaderSets[7].shaderProgram, 'a_position');
        this._shaderSets[7].attributeTexCoordLocation = this.gl.getAttribLocation(this._shaderSets[7].shaderProgram, 'a_texCoord');
        this._shaderSets[7].samplerTexture0Location = this.gl.getUniformLocation(this._shaderSets[7].shaderProgram, 's_texture0');
        this._shaderSets[7].uniformMatrixLocation = this.gl.getUniformLocation(this._shaderSets[7].shaderProgram, 'u_matrix');
        this._shaderSets[7].uniformBaseColorLocation = this.gl.getUniformLocation(this._shaderSets[7].shaderProgram, 'u_baseColor');
        this._shaderSets[7].uniformMultiplyColorLocation =
            this.gl.getUniformLocation(this._shaderSets[7].shaderProgram, 'u_multiplyColor');
        this._shaderSets[7].uniformScreenColorLocation = this.gl.getUniformLocation(this._shaderSets[7].shaderProgram, 'u_screenColor');
        // ä¹—ç®—ï¼ˆã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ã€PremultipliedAlphaï¼‰
        this._shaderSets[8].attributePositionLocation = this.gl.getAttribLocation(this._shaderSets[8].shaderProgram, 'a_position');
        this._shaderSets[8].attributeTexCoordLocation = this.gl.getAttribLocation(this._shaderSets[8].shaderProgram, 'a_texCoord');
        this._shaderSets[8].samplerTexture0Location = this.gl.getUniformLocation(this._shaderSets[8].shaderProgram, 's_texture0');
        this._shaderSets[8].samplerTexture1Location = this.gl.getUniformLocation(this._shaderSets[8].shaderProgram, 's_texture1');
        this._shaderSets[8].uniformMatrixLocation = this.gl.getUniformLocation(this._shaderSets[8].shaderProgram, 'u_matrix');
        this._shaderSets[8].uniformClipMatrixLocation = this.gl.getUniformLocation(this._shaderSets[8].shaderProgram, 'u_clipMatrix');
        this._shaderSets[8].uniformChannelFlagLocation = this.gl.getUniformLocation(this._shaderSets[8].shaderProgram, 'u_channelFlag');
        this._shaderSets[8].uniformBaseColorLocation = this.gl.getUniformLocation(this._shaderSets[8].shaderProgram, 'u_baseColor');
        this._shaderSets[8].uniformMultiplyColorLocation =
            this.gl.getUniformLocation(this._shaderSets[8].shaderProgram, 'u_multiplyColor');
        this._shaderSets[8].uniformScreenColorLocation = this.gl.getUniformLocation(this._shaderSets[8].shaderProgram, 'u_screenColor');
        // ä¹—ç®—ï¼ˆã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒ»åè»¢ã€PremultipliedAlphaï¼‰
        this._shaderSets[9].attributePositionLocation = this.gl.getAttribLocation(this._shaderSets[9].shaderProgram, 'a_position');
        this._shaderSets[9].attributeTexCoordLocation = this.gl.getAttribLocation(this._shaderSets[9].shaderProgram, 'a_texCoord');
        this._shaderSets[9].samplerTexture0Location = this.gl.getUniformLocation(this._shaderSets[9].shaderProgram, 's_texture0');
        this._shaderSets[9].samplerTexture1Location = this.gl.getUniformLocation(this._shaderSets[9].shaderProgram, 's_texture1');
        this._shaderSets[9].uniformMatrixLocation = this.gl.getUniformLocation(this._shaderSets[9].shaderProgram, 'u_matrix');
        this._shaderSets[9].uniformClipMatrixLocation = this.gl.getUniformLocation(this._shaderSets[9].shaderProgram, 'u_clipMatrix');
        this._shaderSets[9].uniformChannelFlagLocation = this.gl.getUniformLocation(this._shaderSets[9].shaderProgram, 'u_channelFlag');
        this._shaderSets[9].uniformBaseColorLocation = this.gl.getUniformLocation(this._shaderSets[9].shaderProgram, 'u_baseColor');
        this._shaderSets[9].uniformMultiplyColorLocation =
            this.gl.getUniformLocation(this._shaderSets[9].shaderProgram, 'u_multiplyColor');
        this._shaderSets[9].uniformScreenColorLocation = this.gl.getUniformLocation(this._shaderSets[9].shaderProgram, 'u_screenColor');
    }
    /**
     * ãƒ–ãƒ¬ãƒ³ãƒ‰ãƒ¢ãƒ¼ãƒ‰ç”¨ã®ã‚·ã‚§ãƒ¼ãƒ€ãƒ¼ãƒ—ãƒ­ã‚°ãƒ©ãƒ ã‚’ç™»éŒ²ã™ã‚‹
     */
    registerBlendShader() {
        // ã‚³ãƒ”ãƒ¼ç”¨ã‚·ã‚§ãƒ¼ãƒ€ãƒ¼ã®è¨­å®š
        const vertShaderSrcCopy = this._vertShaderSrcCopy;
        const fragShaderSrcCopy = this._fragShaderSrcCopy;
        const copyShaderSet = this._shaderSets[10]; // ShaderNames.Copy = 10
        copyShaderSet.shaderProgram = this.loadShaderProgram(vertShaderSrcCopy, fragShaderSrcCopy);
        copyShaderSet.attributeTexCoordLocation = this.gl.getAttribLocation(copyShaderSet.shaderProgram, 'a_texCoord');
        copyShaderSet.attributePositionLocation = this.gl.getAttribLocation(copyShaderSet.shaderProgram, 'a_position');
        copyShaderSet.uniformBaseColorLocation = this.gl.getUniformLocation(copyShaderSet.shaderProgram, 'u_baseColor');
        let shaderSetIndex = 11;
        // ãƒ–ãƒ¬ãƒ³ãƒ‰ãƒ¢ãƒ¼ãƒ‰ç”¨ã‚·ã‚§ãƒ¼ãƒ€ãƒ¼ã®è¨­å®š
        for (let colorBlendIndex = 0; colorBlendIndex < this._colorBlendValues.length; colorBlendIndex++) {
            // NONEã¨å¾Œæ–¹äº’æ›ã¯ã‚¹ã‚­ãƒƒãƒ—
            if (this._colorBlendValues[colorBlendIndex] ==
                CubismColorBlend.ColorBlend_None ||
                this._colorBlendValues[colorBlendIndex] ==
                    CubismColorBlend.ColorBlend_AddCompatible ||
                this._colorBlendValues[colorBlendIndex] ==
                    CubismColorBlend.ColorBlend_MultiplyCompatible) {
                continue;
            }
            // ã‚«ãƒ©ãƒ¼ãƒ–ãƒ¬ãƒ³ãƒ‰ç”¨ã®ãƒžã‚¯ãƒ­
            const colorBlendValue = this._colorBlendValues[colorBlendIndex];
            const colorBlendName = this._colorBlendMap
                .get(colorBlendValue)
                .toUpperCase();
            const colorBlendMacro = `#define COLOR_BLEND_${colorBlendName}\n`;
            for (let alphablendIndex = 0; alphablendIndex < this._alphaBlendValues.length; alphablendIndex++) {
                // NONEã¨ã€ã‚«ãƒ©ãƒ¼ãƒ–ãƒ¬ãƒ³ãƒ‰ã€ŒNormalã€ã‹ã¤ã‚¢ãƒ«ãƒ•ã‚¡ãƒ–ãƒ¬ãƒ³ãƒ‰ã€ŒOverã€ã¯ã‚¹ã‚­ãƒƒãƒ—
                if (this._alphaBlendValues[alphablendIndex] ==
                    CubismAlphaBlend.AlphaBlend_None ||
                    (this._colorBlendValues[colorBlendIndex] ==
                        CubismColorBlend.ColorBlend_Normal &&
                        this._alphaBlendValues[alphablendIndex] ==
                            CubismAlphaBlend.AlphaBlend_Over)) {
                    continue;
                }
                // ã‚¢ãƒ«ãƒ•ã‚¡ãƒ–ãƒ¬ãƒ³ãƒ‰ç”¨ã®ãƒžã‚¯ãƒ­
                const alphaBlendValue = this._alphaBlendValues[alphablendIndex];
                const alphaBlendName = this._alphaBlendMap
                    .get(alphaBlendValue)
                    .toUpperCase();
                const alphaBlendMacro = `#define ALPHA_BLEND_${alphaBlendName}\n`;
                // ã‚·ã‚§ãƒ¼ãƒ€ãƒ¼ã®ã‚½ãƒ¼ã‚¹ã‚’ç”Ÿæˆ
                this.generateBlendShader(colorBlendMacro, alphaBlendMacro, shaderSetIndex);
                this._blendShaderSetMap.set(this._colorBlendMap.get(this._colorBlendValues[colorBlendIndex]) +
                    this._alphaBlendMap.get(this._alphaBlendValues[alphablendIndex]), shaderSetIndex);
                // 1ã¤ã®çµ„ã¿åˆã‚ã›ãŒçµ‚ã‚ã‚‹ã“ã®ã‚¿ã‚¤ãƒŸãƒ³ã‚°ã§ã‚·ã‚§ãƒ¼ãƒ€ãƒ¼ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ã‚’æ›´æ–°
                shaderSetIndex += ShaderType.ShaderType_Count;
            }
        }
    }
    /**
     * ãƒ–ãƒ¬ãƒ³ãƒ‰ãƒ¢ãƒ¼ãƒ‰ç”¨ã®ã‚·ã‚§ãƒ¼ãƒ€ãƒ¼ãƒ—ãƒ­ã‚°ãƒ©ãƒ ã‚’ç”Ÿæˆã™ã‚‹
     *
     * @param colorBlendMacro ã‚«ãƒ©ãƒ¼ãƒ–ãƒ¬ãƒ³ãƒ‰ç”¨ã®ãƒžã‚¯ãƒ­
     * @param alphaBlendMacro ã‚¢ãƒ«ãƒ•ã‚¡ãƒ–ãƒ¬ãƒ³ãƒ‰ç”¨ã®ãƒžã‚¯ãƒ­
     * @param shaderSetBaseIndex _shaderSets ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     */
    generateBlendShader(colorBlendMacro, alphaBlendMacro, shaderSetBaseIndex) {
        for (let shaderTypeIndex = 0; shaderTypeIndex < ShaderType.ShaderType_Count; shaderTypeIndex++) {
            // ãƒ«ãƒ¼ãƒ—ã”ã¨ã«ã‚·ã‚§ãƒ¼ãƒ€ãƒ¼ã®ã‚½ãƒ¼ã‚¹ã‚’åˆæœŸåŒ–
            let vertexShaderSrc = '';
            let fragmentShaderStr = 'precision mediump float;\n';
            // ã‚·ã‚§ãƒ¼ãƒ€ã®ç¨®é¡žãŒå¤‰ã‚ã‚‹ãŸã³ã«ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ã‚’å¤‰æ›´
            const shaderSetIndex = shaderSetBaseIndex + shaderTypeIndex;
            // ãƒžã‚¯ãƒ­ã®å®šç¾©
            fragmentShaderStr += colorBlendMacro;
            fragmentShaderStr += alphaBlendMacro;
            // ãƒ–ãƒ¬ãƒ³ãƒ‰ãƒ¢ãƒ¼ãƒ‰ã®ç¨®é¡žã«å¿œã˜ãŸãƒžã‚¯ãƒ­ã®å®šç¾©
            fragmentShaderStr += this._fragShaderSrcColorBlend;
            fragmentShaderStr += this._fragShaderSrcAlphaBlend;
            // ã‚·ã‚§ãƒ¼ãƒ€ã®ç¨®é¡žã«å¿œã˜ãŸãƒžã‚¯ãƒ­ã®å®šç¾©
            if (shaderTypeIndex == ShaderType.ShaderType_Masked ||
                shaderTypeIndex == ShaderType.ShaderType_MaskedInverted) {
                const clippingMaskMacro = '#define CLIPPING_MASK\n';
                vertexShaderSrc += clippingMaskMacro;
                fragmentShaderStr += clippingMaskMacro;
            }
            // ã‚·ã‚§ãƒ¼ãƒ€ã®æœ¬ä½“ã®ã‚½ãƒ¼ã‚¹ã‚’ãƒ•ã‚¡ã‚¤ãƒ«ã‹ã‚‰èª­ã¿è¾¼ã¿
            vertexShaderSrc += this._vertShaderSrcBlend;
            fragmentShaderStr += this._fragShaderSrcBlend;
            // ã‚·ã‚§ãƒ¼ãƒ€ãƒ¼ãƒ—ãƒ­ã‚°ãƒ©ãƒ ã®ç”Ÿæˆ
            this._shaderSets[shaderSetIndex].shaderProgram = this.loadShaderProgram(vertexShaderSrc, fragmentShaderStr);
            // ã‚·ã‚§ãƒ¼ãƒ€ãƒ¼ãƒ—ãƒ­ã‚°ãƒ©ãƒ ã¸ã®å¤‰æ•°ã®ãƒªãƒ³ã‚¯
            this._shaderSets[shaderSetIndex].attributePositionLocation =
                this.gl.getAttribLocation(this._shaderSets[shaderSetIndex].shaderProgram, 'a_position');
            this._shaderSets[shaderSetIndex].attributeTexCoordLocation =
                this.gl.getAttribLocation(this._shaderSets[shaderSetIndex].shaderProgram, 'a_texCoord');
            this._shaderSets[shaderSetIndex].samplerTexture0Location =
                this.gl.getUniformLocation(this._shaderSets[shaderSetIndex].shaderProgram, 's_texture0');
            this._shaderSets[shaderSetIndex].uniformMatrixLocation =
                this.gl.getUniformLocation(this._shaderSets[shaderSetIndex].shaderProgram, 'u_matrix');
            this._shaderSets[shaderSetIndex].uniformBaseColorLocation =
                this.gl.getUniformLocation(this._shaderSets[shaderSetIndex].shaderProgram, 'u_baseColor');
            this._shaderSets[shaderSetIndex].uniformMultiplyColorLocation =
                this.gl.getUniformLocation(this._shaderSets[shaderSetIndex].shaderProgram, 'u_multiplyColor');
            this._shaderSets[shaderSetIndex].uniformScreenColorLocation =
                this.gl.getUniformLocation(this._shaderSets[shaderSetIndex].shaderProgram, 'u_screenColor');
            // ãƒ–ãƒ¬ãƒ³ãƒ‰ãƒ¢ãƒ¼ãƒ‰ç”¨ã®ãƒ†ã‚¯ã‚¹ãƒãƒ£
            this._shaderSets[shaderSetIndex].samplerFrameBufferTextureLocation =
                this.gl.getUniformLocation(this._shaderSets[shaderSetIndex].shaderProgram, 's_blendTexture');
            // ã‚¯ãƒªãƒƒãƒ—å¯¾è±¡ã®å ´åˆ
            if (shaderTypeIndex == ShaderType.ShaderType_Masked ||
                shaderTypeIndex == ShaderType.ShaderType_MaskedInverted) {
                // ãƒžã‚¹ã‚¯ç”¨ãƒ†ã‚¯ã‚¹ãƒãƒ£
                this._shaderSets[shaderSetIndex].samplerTexture1Location =
                    this.gl.getUniformLocation(this._shaderSets[shaderSetIndex].shaderProgram, 's_texture1');
                // ã‚¯ãƒªãƒƒãƒ—ç”¨ã®è¡Œåˆ—
                this._shaderSets[shaderSetIndex].uniformClipMatrixLocation =
                    this.gl.getUniformLocation(this._shaderSets[shaderSetIndex].shaderProgram, 'u_clipMatrix');
                // ãƒãƒ£ãƒ³ãƒãƒ«ãƒ•ãƒ©ã‚°
                this._shaderSets[shaderSetIndex].uniformChannelFlagLocation =
                    this.gl.getUniformLocation(this._shaderSets[shaderSetIndex].shaderProgram, 'u_channelFlag');
                // åè»¢ãƒžã‚¹ã‚¯ç”¨ã®å€¤ï¼ˆåè»¢ãªã‚‰ 1.0 ãŒä»£å…¥ã•ã‚Œã‚‹ï¼‰
                this._shaderSets[shaderSetIndex].uniformInvertMaskFlagLocation =
                    this.gl.getUniformLocation(this._shaderSets[shaderSetIndex].shaderProgram, 'u_invertClippingMask');
            }
        }
    }
    /**
     * ã‚·ã‚§ãƒ¼ãƒ€ãƒ—ãƒ­ã‚°ãƒ©ãƒ ã‚’ãƒ­ãƒ¼ãƒ‰ã—ã¦ã‚¢ãƒ‰ãƒ¬ã‚¹ã‚’è¿”ã™
     *
     * @param vertexShaderSource    é ‚ç‚¹ã‚·ã‚§ãƒ¼ãƒ€ã®ã‚½ãƒ¼ã‚¹
     * @param fragmentShaderSource  ãƒ•ãƒ©ã‚°ãƒ¡ãƒ³ãƒˆã‚·ã‚§ãƒ¼ãƒ€ã®ã‚½ãƒ¼ã‚¹
     *
     * @return ã‚·ã‚§ãƒ¼ãƒ€ãƒ—ãƒ­ã‚°ãƒ©ãƒ ã®ã‚¢ãƒ‰ãƒ¬ã‚¹
     */
    loadShaderProgram(vertexShaderSource, fragmentShaderSource) {
        // Create Shader Program
        let shaderProgram = this.gl.createProgram();
        let vertShader = this.compileShaderSource(this.gl.VERTEX_SHADER, vertexShaderSource);
        if (!vertShader) {
            CubismLogError('Vertex shader compile error!');
            return 0;
        }
        let fragShader = this.compileShaderSource(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
        if (!fragShader) {
            CubismLogError('Fragment shader compile error!');
            return 0;
        }
        // Attach vertex shader to program
        this.gl.attachShader(shaderProgram, vertShader);
        // Attach fragment shader to program
        this.gl.attachShader(shaderProgram, fragShader);
        // link program
        this.gl.linkProgram(shaderProgram);
        const linkStatus = this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS);
        // ãƒªãƒ³ã‚¯ã«å¤±æ•—ã—ãŸã‚‰ã‚·ã‚§ãƒ¼ãƒ€ãƒ¼ã‚’å‰Šé™¤
        if (!linkStatus) {
            CubismLogError('Failed to link program: {0}', shaderProgram);
            this.gl.deleteShader(vertShader);
            vertShader = 0;
            this.gl.deleteShader(fragShader);
            fragShader = 0;
            if (shaderProgram) {
                this.gl.deleteProgram(shaderProgram);
                shaderProgram = 0;
            }
            return 0;
        }
        // Release vertex and fragment shaders.
        this.gl.deleteShader(vertShader);
        this.gl.deleteShader(fragShader);
        return shaderProgram;
    }
    /**
     * ã‚·ã‚§ãƒ¼ãƒ€ãƒ¼ãƒ—ãƒ­ã‚°ãƒ©ãƒ ã‚’ã‚³ãƒ³ãƒ‘ã‚¤ãƒ«ã™ã‚‹
     *
     * @param shaderType ã‚·ã‚§ãƒ¼ãƒ€ã‚¿ã‚¤ãƒ—(Vertex/Fragment)
     * @param shaderSource ã‚·ã‚§ãƒ¼ãƒ€ã‚½ãƒ¼ã‚¹ã‚³ãƒ¼ãƒ‰
     *
     * @return ã‚³ãƒ³ãƒ‘ã‚¤ãƒ«ã•ã‚ŒãŸã‚·ã‚§ãƒ¼ãƒ€ãƒ¼ãƒ—ãƒ­ã‚°ãƒ©ãƒ 
     */
    compileShaderSource(shaderType, shaderSource) {
        const source = shaderSource;
        const shader = this.gl.createShader(shaderType);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!shader) {
            const log = this.gl.getShaderInfoLog(shader);
            CubismLogError('Shader compile log: {0} ', log);
        }
        const status = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
        if (!status) {
            const log = this.gl.getShaderInfoLog(shader);
            CubismLogError('Shader compile log: {0} ', log);
            this.gl.deleteShader(shader);
            return null;
        }
        return shader;
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
     * ãƒ–ãƒ¬ãƒ³ãƒ‰ãƒ¢ãƒ¼ãƒ‰ç”¨ã®ã‚·ã‚§ãƒ¼ãƒ€ãƒ¼ãƒ‘ã‚¹ã‚’è¨­å®šã™ã‚‹
     *
     * @param shaderPath ã‚·ã‚§ãƒ¼ãƒ€ãƒ¼ãƒ‘ã‚¹
     */
    setShaderPath(shaderPath) {
        this._shaderPath = shaderPath;
    }
    /**
     * ã‚·ã‚§ãƒ¼ãƒ€ãƒ¼ãƒ‘ã‚¹ã‚’å–å¾—ã™ã‚‹
     *
     * @return ã‚·ã‚§ãƒ¼ãƒ€ãƒ¼ãƒ‘ã‚¹
     */
    getShaderPath() {
        return this._shaderPath;
    }
}
/**
 * GLContextã”ã¨ã«CubismShader_WebGLã‚’ç¢ºä¿ã™ã‚‹ãŸã‚ã®ã‚¯ãƒ©ã‚¹
 * ã‚·ãƒ³ã‚°ãƒ«ãƒˆãƒ³ãªã‚¯ãƒ©ã‚¹ã§ã‚ã‚Šã€CubismShaderManager_WebGL.getInstanceã‹ã‚‰ã‚¢ã‚¯ã‚»ã‚¹ã™ã‚‹ã€‚
 */
export class CubismShaderManager_WebGL {
    /**
     * ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹ã‚’å–å¾—ã™ã‚‹ï¼ˆã‚·ãƒ³ã‚°ãƒ«ãƒˆãƒ³ï¼‰
     *
     * @return ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹
     */
    static getInstance() {
        if (s_instance == null) {
            s_instance = new CubismShaderManager_WebGL();
        }
        return s_instance;
    }
    /**
     * ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹ã‚’é–‹æ”¾ã™ã‚‹ï¼ˆã‚·ãƒ³ã‚°ãƒ«ãƒˆãƒ³ï¼‰
     */
    static deleteInstance() {
        if (s_instance) {
            s_instance.release();
            s_instance = null;
        }
    }
    /**
     * Privateãªã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    constructor() {
        this._shaderMap = new Map();
    }
    /**
     * ãƒ‡ã‚¹ãƒˆãƒ©ã‚¯ã‚¿ç›¸å½“ã®å‡¦ç†
     */
    release() {
        for (const item of this._shaderMap) {
            item[1].release();
        }
        this._shaderMap.clear();
    }
    /**
     * GLContextã‚’ã‚­ãƒ¼ã«Shaderã‚’å–å¾—ã™ã‚‹
     *
     * @param gl glã‚³ãƒ³ãƒ†ã‚­ã‚¹ãƒˆ
     *
     * @return shaderã‚’è¿”ã™
     */
    getShader(gl) {
        return this._shaderMap.get(gl);
    }
    /**
     * GLContextã‚’ç™»éŒ²ã™ã‚‹
     *
     * @param gl glã‚³ãƒ³ãƒ†ã‚­ã‚¹ãƒˆ
     */
    setGlContext(gl) {
        if (!this._shaderMap.has(gl)) {
            const instance = new CubismShader_WebGL();
            instance.setGl(gl);
            this._shaderMap.set(gl, instance);
        }
    }
}
/**
 * CubismShader_WebGLã®ã‚¤ãƒ³ãƒŠãƒ¼ã‚¯ãƒ©ã‚¹
 */
export class CubismShaderSet {
}
/**
 * ã‚·ã‚§ãƒ¼ãƒ€ãƒ¼ã®åå‰ã‚’å®šç¾©ã™ã‚‹åˆ—æŒ™åž‹
 */
export var ShaderNames;
(function (ShaderNames) {
    // SetupMask
    ShaderNames[ShaderNames["ShaderNames_SetupMask"] = 0] = "ShaderNames_SetupMask";
    // Normal
    ShaderNames[ShaderNames["ShaderNames_NormalPremultipliedAlpha"] = 1] = "ShaderNames_NormalPremultipliedAlpha";
    ShaderNames[ShaderNames["ShaderNames_NormalMaskedPremultipliedAlpha"] = 2] = "ShaderNames_NormalMaskedPremultipliedAlpha";
    ShaderNames[ShaderNames["ShaderNames_NomralMaskedInvertedPremultipliedAlpha"] = 3] = "ShaderNames_NomralMaskedInvertedPremultipliedAlpha";
    // Add
    ShaderNames[ShaderNames["ShaderNames_AddPremultipliedAlpha"] = 4] = "ShaderNames_AddPremultipliedAlpha";
    ShaderNames[ShaderNames["ShaderNames_AddMaskedPremultipliedAlpha"] = 5] = "ShaderNames_AddMaskedPremultipliedAlpha";
    ShaderNames[ShaderNames["ShaderNames_AddMaskedPremultipliedAlphaInverted"] = 6] = "ShaderNames_AddMaskedPremultipliedAlphaInverted";
    // Mult
    ShaderNames[ShaderNames["ShaderNames_MultPremultipliedAlpha"] = 7] = "ShaderNames_MultPremultipliedAlpha";
    ShaderNames[ShaderNames["ShaderNames_MultMaskedPremultipliedAlpha"] = 8] = "ShaderNames_MultMaskedPremultipliedAlpha";
    ShaderNames[ShaderNames["ShaderNames_MultMaskedPremultipliedAlphaInverted"] = 9] = "ShaderNames_MultMaskedPremultipliedAlphaInverted";
    // ShaderCount
    ShaderNames[ShaderNames["ShaderNames_ShaderCount"] = 10] = "ShaderNames_ShaderCount";
})(ShaderNames || (ShaderNames = {}));
/**
 * ã‚·ã‚§ãƒ¼ãƒ€ãƒ¼ã®ç¨®é¡žã‚’å®šç¾©ã™ã‚‹åˆ—æŒ™åž‹
 */
export var ShaderType;
(function (ShaderType) {
    ShaderType[ShaderType["ShaderType_Normal"] = 0] = "ShaderType_Normal";
    ShaderType[ShaderType["ShaderType_Masked"] = 1] = "ShaderType_Masked";
    ShaderType[ShaderType["ShaderType_MaskedInverted"] = 2] = "ShaderType_MaskedInverted";
    ShaderType[ShaderType["ShaderType_Count"] = 3] = "ShaderType_Count";
})(ShaderType || (ShaderType = {}));
// Namespace definition for compatibility.
import * as $ from './cubismshader_webgl.js';
// eslint-disable-next-line @typescript-eslint/no-namespace
export var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    Live2DCubismFramework.CubismShaderSet = $.CubismShaderSet;
    Live2DCubismFramework.CubismShader_WebGL = $.CubismShader_WebGL;
    Live2DCubismFramework.CubismShaderManager_WebGL = $.CubismShaderManager_WebGL;
    Live2DCubismFramework.ShaderNames = $.ShaderNames;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));
//# sourceMappingURL=cubismshader_webgl.js.map