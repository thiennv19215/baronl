/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
import { Constant } from '../live2dcubismframework.js';
import { csmRect } from '../type/csmrectf.js';
import { CubismMatrix44 } from '../math/cubismmatrix44.js';
import { CubismTextureColor } from './cubismrenderer.js';
import { CubismLogError, CubismLogWarning } from '../utils/cubismdebug.js';
const ColorChannelCount = 4; // å®Ÿé¨“æ™‚ã«1ãƒãƒ£ãƒ³ãƒãƒ«ã®å ´åˆã¯1ã€RGBã ã‘ã®å ´åˆã¯3ã€ã‚¢ãƒ«ãƒ•ã‚¡ã‚‚å«ã‚ã‚‹å ´åˆã¯4
const ClippingMaskMaxCountOnDefault = 36; // é€šå¸¸ã®ãƒ•ãƒ¬ãƒ¼ãƒ ãƒãƒƒãƒ•ã‚¡ä¸€æžšã‚ãŸã‚Šã®ãƒžã‚¹ã‚¯æœ€å¤§æ•°
const ClippingMaskMaxCountOnMultiRenderTexture = 32; // ãƒ•ãƒ¬ãƒ¼ãƒ ãƒãƒƒãƒ•ã‚¡ãŒ2æžšä»¥ä¸Šã‚ã‚‹å ´åˆã®ãƒ•ãƒ¬ãƒ¼ãƒ ãƒãƒƒãƒ•ã‚¡ä¸€æžšã‚ãŸã‚Šã®ãƒžã‚¹ã‚¯æœ€å¤§æ•°
export class CubismClippingManager {
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    constructor(clippingContextFactory) {
        this._renderTextureCount = 0;
        this._clippingMaskBufferSize = 256;
        this._clippingContextListForMask = new Array();
        this._clippingContextListForDraw = new Array();
        this._clippingContextListForOffscreen = new Array();
        this._tmpBoundsOnModel = new csmRect();
        this._tmpMatrix = new CubismMatrix44();
        this._tmpMatrixForMask = new CubismMatrix44();
        this._tmpMatrixForDraw = new CubismMatrix44();
        this._clearedMaskBufferFlags = new Array();
        this._clippingContexttConstructor = clippingContextFactory;
        this._channelColors = [
            new CubismTextureColor(1.0, 0.0, 0.0, 0.0),
            new CubismTextureColor(0.0, 1.0, 0.0, 0.0),
            new CubismTextureColor(0.0, 0.0, 1.0, 0.0),
            new CubismTextureColor(0.0, 0.0, 0.0, 1.0)
        ];
    }
    /**
     * ãƒ‡ã‚¹ãƒˆãƒ©ã‚¯ã‚¿ç›¸å½“ã®å‡¦ç†
     */
    release() {
        for (let i = 0; i < this._clippingContextListForMask.length; i++) {
            if (this._clippingContextListForMask[i]) {
                this._clippingContextListForMask[i].release();
                this._clippingContextListForMask[i] = void 0;
            }
            this._clippingContextListForMask[i] = null;
        }
        this._clippingContextListForMask = null;
        // _clippingContextListForDrawã¯_clippingContextListForMaskã«ã‚ã‚‹ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹ã‚’æŒ‡ã—ã¦ã„ã‚‹ã€‚ä¸Šè¨˜ã®å‡¦ç†ã«ã‚ˆã‚Šè¦ç´ ã”ã¨ã®DELETEã¯ä¸è¦ã€‚
        for (let i = 0; i < this._clippingContextListForDraw.length; i++) {
            this._clippingContextListForDraw[i] = null;
        }
        this._clippingContextListForDraw = null;
        for (let i = 0; i < this._channelColors.length; i++) {
            this._channelColors[i] = null;
        }
        this._channelColors = null;
        if (this._clearedMaskBufferFlags != null) {
            this._clearedMaskBufferFlags.length = 0;
        }
        this._clearedMaskBufferFlags = null;
    }
    /**
     * ãƒžãƒãƒ¼ã‚¸ãƒ£ã®åˆæœŸåŒ–å‡¦ç†
     * ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ã‚’ä½¿ã†æç”»ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã®ç™»éŒ²ã‚’è¡Œã†
     * @param model ãƒ¢ãƒ‡ãƒ«ã®ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹
     * @param renderTextureCount ãƒãƒƒãƒ•ã‚¡ã®ç”Ÿæˆæ•°
     */
    initializeForDrawable(model, renderTextureCount) {
        // ãƒ¬ãƒ³ãƒ€ãƒ¼ãƒ†ã‚¯ã‚¹ãƒãƒ£ã®åˆè¨ˆæžšæ•°ã®è¨­å®š
        // 1ä»¥ä¸Šã®æ•´æ•°ã§ãªã„å ´åˆã¯ãã‚Œãžã‚Œè­¦å‘Šã‚’å‡ºã™
        if (renderTextureCount % 1 != 0) {
            CubismLogWarning('The number of render textures must be specified as an integer. The decimal point is rounded down and corrected to an integer.');
            // å°æ•°ç‚¹ä»¥ä¸‹ã‚’é™¤åŽ»
            renderTextureCount = ~~renderTextureCount;
        }
        if (renderTextureCount < 1) {
            CubismLogWarning('The number of render textures must be an integer greater than or equal to 1. Set the number of render textures to 1.');
        }
        // è² ã®å€¤ãŒä½¿ã‚ã‚Œã¦ã„ã‚‹å ´åˆã¯å¼·åˆ¶çš„ã«1æžšã¨è¨­å®šã™ã‚‹
        this._renderTextureCount = renderTextureCount < 1 ? 1 : renderTextureCount;
        this._clearedMaskBufferFlags = new Array(this._renderTextureCount);
        // ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ã‚’ä½¿ã†æç”»ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã‚’ã™ã¹ã¦ç™»éŒ²ã™ã‚‹
        // ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ã¯ã€é€šå¸¸æ•°å€‹ç¨‹åº¦ã«é™å®šã—ã¦ä½¿ã†ã‚‚ã®ã¨ã™ã‚‹
        this._clippingContextListForDraw.length = model.getDrawableCount();
        for (let i = 0; i < model.getDrawableCount(); i++) {
            if (model.getDrawableMaskCounts()[i] <= 0) {
                // ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ãŒä½¿ç”¨ã•ã‚Œã¦ã„ãªã„ã‚¢ãƒ¼ãƒˆãƒ¡ãƒƒã‚·ãƒ¥ï¼ˆå¤šãã®å ´åˆä½¿ç”¨ã—ãªã„ï¼‰
                this._clippingContextListForDraw[i] = null;
                continue;
            }
            // æ—¢ã«ã‚ã‚‹ClipContextã¨åŒã˜ã‹ãƒã‚§ãƒƒã‚¯ã™ã‚‹
            let clippingContext = this.findSameClip(model.getDrawableMasks()[i], model.getDrawableMaskCounts()[i]);
            if (clippingContext == null) {
                // åŒä¸€ã®ãƒžã‚¹ã‚¯ãŒå­˜åœ¨ã—ã¦ã„ãªã„å ´åˆã¯ç”Ÿæˆã™ã‚‹
                clippingContext = new this._clippingContexttConstructor(this, model.getDrawableMasks()[i], model.getDrawableMaskCounts()[i]);
                this._clippingContextListForMask.push(clippingContext);
            }
            clippingContext.addClippedDrawable(i);
            this._clippingContextListForDraw[i] = clippingContext;
        }
    }
    /**
     * ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ç”¨ã®åˆæœŸåŒ–å‡¦ç†
     *
     * @param model ãƒ¢ãƒ‡ãƒ«ã®ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹
     * @param maskBufferCount ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ç”¨ã®ãƒžã‚¹ã‚¯ãƒãƒƒãƒ•ã‚¡ã®æ•°
     */
    initializeForOffscreen(model, maskBufferCount) {
        this._renderTextureCount = maskBufferCount;
        // ãƒ¬ãƒ³ãƒ€ãƒ¼ãƒ†ã‚¯ã‚¹ãƒãƒ£ã®ã‚¯ãƒªã‚¢ãƒ•ãƒ©ã‚°ã®è¨­å®š
        this._clearedMaskBufferFlags.length = this._renderTextureCount;
        for (let i = 0; i < this._renderTextureCount; ++i) {
            this._clearedMaskBufferFlags[i] = false;
        }
        //ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ã‚’ä½¿ã†æç”»ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã‚’å…¨ã¦ç™»éŒ²ã™ã‚‹
        //ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ã¯ã€é€šå¸¸æ•°å€‹ç¨‹åº¦ã«é™å®šã—ã¦ä½¿ã†ã‚‚ã®ã¨ã™ã‚‹
        this._clippingContextListForOffscreen.length = model.getOffscreenCount();
        for (let i = 0; i < model.getOffscreenCount(); ++i) {
            if (model.getOffscreenMaskCounts()[i] <= 0) {
                //ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ãŒä½¿ç”¨ã•ã‚Œã¦ã„ãªã„ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ï¼ˆå¤šãã®å ´åˆä½¿ç”¨ã—ãªã„ï¼‰
                this._clippingContextListForOffscreen.push(null);
                continue;
            }
            // æ—¢ã«ã‚ã‚‹ClipContextã¨åŒã˜ã‹ãƒã‚§ãƒƒã‚¯ã™ã‚‹
            let cc = this.findSameClip(model.getOffscreenMasks()[i], model.getOffscreenMaskCounts()[i]);
            if (cc == null) {
                // åŒä¸€ã®ãƒžã‚¹ã‚¯ãŒå­˜åœ¨ã—ã¦ã„ãªã„å ´åˆã¯ç”Ÿæˆã™ã‚‹
                cc = new this._clippingContexttConstructor(this, model.getOffscreenMasks()[i], model.getOffscreenMaskCounts()[i]);
                this._clippingContextListForMask.push(cc);
            }
            cc.addClippedOffscreen(i);
            this._clippingContextListForOffscreen[i] = cc;
        }
    }
    /**
     * æ—¢ã«ãƒžã‚¹ã‚¯ã‚’ä½œã£ã¦ã„ã‚‹ã‹ã‚’ç¢ºèª
     * ä½œã£ã¦ã„ã‚‹æ§˜ã§ã‚ã‚Œã°è©²å½“ã™ã‚‹ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ã®ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹ã‚’è¿”ã™
     * ä½œã£ã¦ã„ãªã‘ã‚Œã°NULLã‚’è¿”ã™
     * @param drawableMasks æç”»ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã‚’ãƒžã‚¹ã‚¯ã™ã‚‹æç”»ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã®ãƒªã‚¹ãƒˆ
     * @param drawableMaskCounts æç”»ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã‚’ãƒžã‚¹ã‚¯ã™ã‚‹æç”»ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã®æ•°
     * @return è©²å½“ã™ã‚‹ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ãŒå­˜åœ¨ã™ã‚Œã°ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹ã‚’è¿”ã—ã€ãªã‘ã‚Œã°NULLã‚’è¿”ã™
     */
    findSameClip(drawableMasks, drawableMaskCounts) {
        // ä½œæˆæ¸ˆã¿ClippingContextã¨ä¸€è‡´ã™ã‚‹ã‹ç¢ºèª
        for (let i = 0; i < this._clippingContextListForMask.length; i++) {
            const clippingContext = this._clippingContextListForMask[i];
            const count = clippingContext._clippingIdCount;
            // å€‹æ•°ãŒé•ã†å ´åˆã¯åˆ¥ç‰©
            if (count != drawableMaskCounts) {
                continue;
            }
            let sameCount = 0;
            // åŒã˜IDã‚’æŒã¤ã‹ç¢ºèªã€‚é…åˆ—ã®æ•°ãŒåŒã˜ãªã®ã§ã€ä¸€è‡´ã—ãŸå€‹æ•°ãŒåŒã˜ãªã‚‰åŒã˜ç‰©ã‚’æŒã¤ã¨ã™ã‚‹
            for (let j = 0; j < count; j++) {
                const clipId = clippingContext._clippingIdList[j];
                for (let k = 0; k < count; k++) {
                    if (drawableMasks[k] == clipId) {
                        sameCount++;
                        break;
                    }
                }
            }
            if (sameCount == count) {
                return clippingContext;
            }
        }
        return null; // è¦‹ã¤ã‹ã‚‰ãªã‹ã£ãŸ
    }
    /**
     * é«˜ç²¾ç´°ãƒžã‚¹ã‚¯å‡¦ç†ç”¨ã®è¡Œåˆ—ã‚’è¨ˆç®—ã™ã‚‹
     * @param model ãƒ¢ãƒ‡ãƒ«ã®ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹
     * @param isRightHanded å‡¦ç†ãŒå³æ‰‹ç³»ã§ã‚ã‚‹ã‹
     */
    setupMatrixForHighPrecision(model, isRightHanded) {
        // å…¨ã¦ã®ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ã‚’ç”¨æ„ã™ã‚‹
        // åŒã˜ã‚¯ãƒªãƒƒãƒ—ï¼ˆè¤‡æ•°ã®å ´åˆã¯ã¾ã¨ã‚ã¦ä¸€ã¤ã®ã‚¯ãƒªãƒƒãƒ—ï¼‰ã‚’ä½¿ã†å ´åˆã¯1åº¦ã ã‘è¨­å®šã™ã‚‹
        let usingClipCount = 0;
        for (let clipIndex = 0; clipIndex < this._clippingContextListForMask.length; clipIndex++) {
            // ï¼‘ã¤ã®ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ã«é–¢ã—ã¦
            const cc = this._clippingContextListForMask[clipIndex];
            // ã“ã®ã‚¯ãƒªãƒƒãƒ—ã‚’åˆ©ç”¨ã™ã‚‹æç”»ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆç¾¤å…¨ä½“ã‚’å›²ã‚€çŸ©å½¢ã‚’è¨ˆç®—
            this.calcClippedDrawableTotalBounds(model, cc);
            if (cc._isUsing) {
                usingClipCount++; // ä½¿ç”¨ä¸­ã¨ã—ã¦ã‚«ã‚¦ãƒ³ãƒˆ
            }
        }
        // ãƒžã‚¹ã‚¯è¡Œåˆ—ä½œæˆå‡¦ç†
        if (usingClipCount > 0) {
            this.setupLayoutBounds(0);
            // ã‚µã‚¤ã‚ºãŒãƒ¬ãƒ³ãƒ€ãƒ¼ãƒ†ã‚¯ã‚¹ãƒãƒ£ã®æžšæ•°ã¨åˆã‚ãªã„å ´åˆã¯åˆã‚ã›ã‚‹
            if (this._clearedMaskBufferFlags.length != this._renderTextureCount) {
                this._clearedMaskBufferFlags.length = this._renderTextureCount;
                for (let i = 0; i < this._renderTextureCount; i++) {
                    this._clearedMaskBufferFlags[i] = false;
                }
            }
            else {
                // ãƒžã‚¹ã‚¯ã®ã‚¯ãƒªã‚¢ãƒ•ãƒ©ã‚°ã‚’æ¯Žãƒ•ãƒ¬ãƒ¼ãƒ é–‹å§‹æ™‚ã«åˆæœŸåŒ–
                for (let i = 0; i < this._renderTextureCount; i++) {
                    this._clearedMaskBufferFlags[i] = false;
                }
            }
            // å®Ÿéš›ã«ãƒžã‚¹ã‚¯ã‚’ç”Ÿæˆã™ã‚‹
            // å…¨ã¦ã®ãƒžã‚¹ã‚¯ã‚’ã©ã®æ§˜ã«ãƒ¬ã‚¤ã‚¢ã‚¦ãƒˆã—ã¦æãã‹ã‚’æ±ºå®šã—ã€ClipContext , ClippedDrawContext ã«è¨˜æ†¶ã™ã‚‹
            for (let clipIndex = 0; clipIndex < this._clippingContextListForMask.length; clipIndex++) {
                // --- å®Ÿéš›ã«ï¼‘ã¤ã®ãƒžã‚¹ã‚¯ã‚’æã ---
                const clipContext = this._clippingContextListForMask[clipIndex];
                const allClippedDrawRect = clipContext._allClippedDrawRect; //ã“ã®ãƒžã‚¹ã‚¯ã‚’ä½¿ã†ã€å…¨ã¦ã®æç”»ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã®è«–ç†åº§æ¨™ä¸Šã®å›²ã¿çŸ©å½¢
                const layoutBoundsOnTex01 = clipContext._layoutBounds; //ã“ã®ä¸­ã«ãƒžã‚¹ã‚¯ã‚’åŽã‚ã‚‹
                const margin = 0.05;
                let scaleX = 0.0;
                let scaleY = 0.0;
                const ppu = model.getPixelsPerUnit();
                const maskPixelSize = clipContext
                    .getClippingManager()
                    .getClippingMaskBufferSize();
                const physicalMaskWidth = layoutBoundsOnTex01.width * maskPixelSize;
                const physicalMaskHeight = layoutBoundsOnTex01.height * maskPixelSize;
                this._tmpBoundsOnModel.setRect(allClippedDrawRect);
                if (this._tmpBoundsOnModel.width * ppu > physicalMaskWidth) {
                    this._tmpBoundsOnModel.expand(allClippedDrawRect.width * margin, 0.0);
                    scaleX = layoutBoundsOnTex01.width / this._tmpBoundsOnModel.width;
                }
                else {
                    scaleX = ppu / physicalMaskWidth;
                }
                if (this._tmpBoundsOnModel.height * ppu > physicalMaskHeight) {
                    this._tmpBoundsOnModel.expand(0.0, allClippedDrawRect.height * margin);
                    scaleY = layoutBoundsOnTex01.height / this._tmpBoundsOnModel.height;
                }
                else {
                    scaleY = ppu / physicalMaskHeight;
                }
                // ãƒžã‚¹ã‚¯ç”Ÿæˆæ™‚ã«ä½¿ã†è¡Œåˆ—ã‚’æ±‚ã‚ã‚‹
                this.createMatrixForMask(isRightHanded, layoutBoundsOnTex01, scaleX, scaleY);
                clipContext._matrixForMask.setMatrix(this._tmpMatrixForMask.getArray());
                clipContext._matrixForDraw.setMatrix(this._tmpMatrixForDraw.getArray());
            }
        }
    }
    /**
     * ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã®é«˜ç²¾ç´°ãƒžã‚¹ã‚¯å‡¦ç†ç”¨ã®è¡Œåˆ—ã‚’è¨ˆç®—ã™ã‚‹
     *
     * @param model ãƒ¢ãƒ‡ãƒ«ã®ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹
     * @param isRightHanded å‡¦ç†ãŒå³æ‰‹ç³»ã§ã‚ã‚‹ã‹
     * @param mvp ãƒ¢ãƒ‡ãƒ«ãƒ“ãƒ¥ãƒ¼æŠ•å½±è¡Œåˆ—
     */
    setupMatrixForOffscreenHighPrecision(model, isRightHanded, mvp) {
        // å…¨ã¦ã®ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ã‚’ç”¨æ„ã™ã‚‹
        // åŒã˜ã‚¯ãƒªãƒƒãƒ—ï¼ˆè¤‡æ•°ã®å ´åˆã¯ã¾ã¨ã‚ã¦ï¼‘ã¤ã®ã‚¯ãƒªãƒƒãƒ—ï¼‰ã‚’ä½¿ã†å ´åˆã¯ï¼‘åº¦ã ã‘è¨­å®šã™ã‚‹
        let usingClipCount = 0;
        for (let clipIndex = 0; clipIndex < this._clippingContextListForMask.length; clipIndex++) {
            // ï¼‘ã¤ã®ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ã«é–¢ã—ã¦
            const cc = this._clippingContextListForMask[clipIndex];
            // ã“ã®ã‚¯ãƒªãƒƒãƒ—ã‚’åˆ©ç”¨ã™ã‚‹æç”»ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆç¾¤å…¨ä½“ã‚’å›²ã‚€çŸ©å½¢ã‚’è¨ˆç®—
            this.calcClippedOffscreenTotalBounds(model, cc);
            if (cc._isUsing) {
                usingClipCount++; //ä½¿ç”¨ä¸­ã¨ã—ã¦ã‚«ã‚¦ãƒ³ãƒˆ
            }
        }
        if (usingClipCount <= 0) {
            return;
        }
        // ãƒžã‚¹ã‚¯è¡Œåˆ—ä½œæˆå‡¦ç†
        this.setupLayoutBounds(0);
        // ã‚µã‚¤ã‚ºãŒãƒ¬ãƒ³ãƒ€ãƒ¼ãƒ†ã‚¯ã‚¹ãƒãƒ£ã®æžšæ•°ã¨åˆã‚ãªã„å ´åˆã¯åˆã‚ã›ã‚‹
        if (this._clearedMaskBufferFlags.length != this._renderTextureCount) {
            this._clearedMaskBufferFlags.length = this._renderTextureCount;
            for (let i = 0; i < this._renderTextureCount; ++i) {
                this._clearedMaskBufferFlags[i] = false;
            }
        }
        else {
            // ãƒžã‚¹ã‚¯ã®ã‚¯ãƒªã‚¢ãƒ•ãƒ©ã‚°ã‚’æ¯Žãƒ•ãƒ¬ãƒ¼ãƒ é–‹å§‹æ™‚ã«åˆæœŸåŒ–
            for (let i = 0; i < this._renderTextureCount; ++i) {
                this._clearedMaskBufferFlags[i] = false;
            }
        }
        // å®Ÿéš›ã«ãƒžã‚¹ã‚¯ã‚’ç”Ÿæˆã™ã‚‹
        // å…¨ã¦ã®ãƒžã‚¹ã‚¯ã‚’ã©ã®æ§˜ã«ãƒ¬ã‚¤ã‚¢ã‚¦ãƒˆã—ã¦æãã‹ã‚’æ±ºå®šã—ã€ClipContext , ClippedDrawContext ã«è¨˜æ†¶ã™ã‚‹
        for (let clipIndex = 0; clipIndex < this._clippingContextListForMask.length; clipIndex++) {
            // --- å®Ÿéš›ã«ï¼‘ã¤ã®ãƒžã‚¹ã‚¯ã‚’æã ---
            const clipContext = this._clippingContextListForMask[clipIndex];
            const allClippedDrawRect = clipContext._allClippedDrawRect; //ã“ã®ãƒžã‚¹ã‚¯ã‚’ä½¿ã†ã€å…¨ã¦ã®æç”»ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã®è«–ç†åº§æ¨™ä¸Šã®å›²ã¿çŸ©å½¢
            const layoutBoundsOnTex01 = clipContext._layoutBounds; //ã“ã®ä¸­ã«ãƒžã‚¹ã‚¯ã‚’åŽã‚ã‚‹
            const margin = 0.05;
            let scaleX = 0.0;
            let scaleY = 0.0;
            const ppu = model.getPixelsPerUnit();
            const maskPixel = clipContext
                .getClippingManager()
                .getClippingMaskBufferSize();
            const physicalMaskWidth = layoutBoundsOnTex01.width * maskPixel;
            const physicalMaskHeight = layoutBoundsOnTex01.height * maskPixel;
            this._tmpBoundsOnModel.setRect(allClippedDrawRect);
            if (this._tmpBoundsOnModel.width * ppu > physicalMaskWidth) {
                this._tmpBoundsOnModel.expand(allClippedDrawRect.width * margin, 0.0);
                scaleX = layoutBoundsOnTex01.width / this._tmpBoundsOnModel.width;
            }
            else {
                scaleX = ppu / physicalMaskWidth;
            }
            if (this._tmpBoundsOnModel.height * ppu > physicalMaskHeight) {
                this._tmpBoundsOnModel.expand(0.0, allClippedDrawRect.height * margin);
                scaleY = layoutBoundsOnTex01.height / this._tmpBoundsOnModel.height;
            }
            else {
                scaleY = ppu / physicalMaskHeight;
            }
            // ãƒžã‚¹ã‚¯ç”Ÿæˆæ™‚ã«ä½¿ã†è¡Œåˆ—ã‚’æ±‚ã‚ã‚‹
            this.createMatrixForMask(isRightHanded, layoutBoundsOnTex01, scaleX, scaleY);
            clipContext._matrixForMask.setMatrix(this._tmpMatrixForMask.getArray());
            clipContext._matrixForDraw.setMatrix(this._tmpMatrixForDraw.getArray());
            // clipContext * mvp^-1
            const invertMvp = mvp.getInvert();
            clipContext._matrixForDraw.multiplyByMatrix(invertMvp);
        }
    }
    /**
     * ãƒžã‚¹ã‚¯ã‚’ä½¿ã†æç”»ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã®å…¨ä½“ã®çŸ©å½¢ã‚’è¨ˆç®—ã™ã‚‹ã€‚
     *
     * @param model ãƒ¢ãƒ‡ãƒ«ã®ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹
     * @param clippingContext ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ã‚³ãƒ³ãƒ†ã‚­ã‚¹ãƒˆ
     */
    calcClippedOffscreenTotalBounds(model, clippingContext) {
        // è¢«ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ï¼ˆãƒžã‚¹ã‚¯ã•ã‚Œã‚‹æç”»ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆï¼‰ã®å…¨ä½“ã®çŸ©å½¢
        let clippedDrawTotalMinX = Number.MAX_VALUE, clippedDrawTotalMinY = Number.MAX_VALUE;
        let clippedDrawTotalMaxX = -Number.MAX_VALUE, clippedDrawTotalMaxY = -Number.MAX_VALUE;
        // ã“ã®ãƒžã‚¹ã‚¯ãŒå®Ÿéš›ã«å¿…è¦ã‹åˆ¤å®šã™ã‚‹
        // ã“ã®ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ã‚’åˆ©ç”¨ã™ã‚‹ã€Œæç”»ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã€ãŒã²ã¨ã¤ã§ã‚‚ä½¿ç”¨å¯èƒ½ã§ã‚ã‚Œã°ãƒžã‚¹ã‚¯ã‚’ç”Ÿæˆã™ã‚‹å¿…è¦ãŒã‚ã‚‹
        const clippedOffscreenCount = clippingContext._clippedOffscreenIndexList.length;
        const clippedOffscreenChildDrawableIndexList = new Array();
        for (let clippedOffscreenIndex = 0; clippedOffscreenIndex < clippedOffscreenCount; clippedOffscreenIndex++) {
            // ãƒžã‚¹ã‚¯ã‚’ä½¿ç”¨ã™ã‚‹æç”»ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã®æç”»ã•ã‚Œã‚‹çŸ©å½¢ã‚’æ±‚ã‚ã‚‹
            const offscreenIndex = clippingContext._clippedOffscreenIndexList[clippedOffscreenIndex];
            this.getOffscreenChildDrawableIndexList(model, offscreenIndex, clippedOffscreenChildDrawableIndexList);
        }
        const childDrawableCount = clippedOffscreenChildDrawableIndexList.length;
        for (let childDrawableIndex = 0; childDrawableIndex < childDrawableCount; childDrawableIndex++) {
            const drawableVertexCount = model.getDrawableVertexCount(clippedOffscreenChildDrawableIndexList[childDrawableIndex]);
            const drawableVertexes = model.getDrawableVertices(clippedOffscreenChildDrawableIndexList[childDrawableIndex]);
            let minX = Number.MAX_VALUE, minY = Number.MAX_VALUE;
            let maxX = -Number.MAX_VALUE, maxY = -Number.MAX_VALUE;
            const loop = drawableVertexCount * Constant.vertexStep;
            for (let pi = Constant.vertexOffset; pi < loop; pi += Constant.vertexStep) {
                const x = drawableVertexes[pi];
                const y = drawableVertexes[pi + 1];
                if (x < minX)
                    minX = x;
                if (x > maxX)
                    maxX = x;
                if (y < minY)
                    minY = y;
                if (y > maxY)
                    maxY = y;
            }
            if (minX == Number.MAX_VALUE)
                continue; //æœ‰åŠ¹ãªç‚¹ãŒã²ã¨ã¤ã‚‚å–ã‚Œãªã‹ã£ãŸã®ã§ã‚¹ã‚­ãƒƒãƒ—ã™ã‚‹
            // å…¨ä½“ã®çŸ©å½¢ã«åæ˜ 
            if (minX < clippedDrawTotalMinX)
                clippedDrawTotalMinX = minX;
            if (minY < clippedDrawTotalMinY)
                clippedDrawTotalMinY = minY;
            if (maxX > clippedDrawTotalMaxX)
                clippedDrawTotalMaxX = maxX;
            if (maxY > clippedDrawTotalMaxY)
                clippedDrawTotalMaxY = maxY;
        }
        if (clippedDrawTotalMinX == Number.MAX_VALUE) {
            clippingContext._allClippedDrawRect.x = 0.0;
            clippingContext._allClippedDrawRect.y = 0.0;
            clippingContext._allClippedDrawRect.width = 0.0;
            clippingContext._allClippedDrawRect.height = 0.0;
            clippingContext._isUsing = false;
        }
        else {
            clippingContext._isUsing = true;
            const w = clippedDrawTotalMaxX - clippedDrawTotalMinX;
            const h = clippedDrawTotalMaxY - clippedDrawTotalMinY;
            clippingContext._allClippedDrawRect.x = clippedDrawTotalMinX;
            clippingContext._allClippedDrawRect.y = clippedDrawTotalMinY;
            clippingContext._allClippedDrawRect.width = w;
            clippingContext._allClippedDrawRect.height = h;
        }
    }
    /**
     * ãƒžã‚¹ã‚¯ã‚’ä½¿ã†æç”»ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã®å…¨ä½“ã®çŸ©å½¢ã‚’è¨ˆç®—ã™ã‚‹ã€‚
     *
     * @param model ãƒ¢ãƒ‡ãƒ«ã®ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹
     * @param offscreenIndex ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @param childDrawableIndexList ã‚ªãƒ•ã‚¹ã‚¯ãƒªãƒ¼ãƒ³ã®å­Drawableã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ãƒªã‚¹ãƒˆ
     */
    getOffscreenChildDrawableIndexList(model, offscreenIndex, childDrawableIndexList) {
        // è¦ªã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã‚’å–å¾—
        const ownerIndex = model.getOffscreenOwnerIndices()[offscreenIndex];
        // ãƒ‘ãƒ¼ãƒ„ã®ã¿
        this.getPartChildDrawableIndexList(model, ownerIndex, childDrawableIndexList);
    }
    /**
     * ãƒ‘ãƒ¼ãƒ„ã®å­Drawableã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ãƒªã‚¹ãƒˆã‚’å–å¾—ã™ã‚‹ã€‚
     *
     * @param model ãƒ¢ãƒ‡ãƒ«ã®ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹
     * @param partIndex ãƒ‘ãƒ¼ãƒ„ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @param childDrawableIndexList ãƒ‘ãƒ¼ãƒ„ã®å­Drawableã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ãƒªã‚¹ãƒˆ
     */
    getPartChildDrawableIndexList(model, partIndex, childDrawableIndexList) {
        const childDrawObjects = model.getPartsHierarchy()[partIndex].childDrawObjects;
        childDrawableIndexList.push(...childDrawObjects.drawableIndices);
        for (let i = 0; i < childDrawObjects.offscreenIndices.length; ++i) {
            this.getOffscreenChildDrawableIndexList(model, childDrawObjects.offscreenIndices[i], childDrawableIndexList);
        }
    }
    /**
     * ãƒžã‚¹ã‚¯ä½œæˆãƒ»æç”»ç”¨ã®è¡Œåˆ—ã‚’ä½œæˆã™ã‚‹ã€‚
     * @param isRightHanded åº§æ¨™ã‚’å³æ‰‹ç³»ã¨ã—ã¦æ‰±ã†ã‹ã‚’æŒ‡å®š
     * @param layoutBoundsOnTex01 ãƒžã‚¹ã‚¯ã‚’åŽã‚ã‚‹é ˜åŸŸ
     * @param scaleX æç”»ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã®ä¼¸ç¸®çŽ‡
     * @param scaleY æç”»ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã®ä¼¸ç¸®çŽ‡
     */
    createMatrixForMask(isRightHanded, layoutBoundsOnTex01, scaleX, scaleY) {
        this._tmpMatrix.loadIdentity();
        {
            // Layout0..1 ã‚’ -1..1ã«å¤‰æ›
            this._tmpMatrix.translateRelative(-1.0, -1.0);
            this._tmpMatrix.scaleRelative(2.0, 2.0);
        }
        {
            // view to Layout0..1
            this._tmpMatrix.translateRelative(layoutBoundsOnTex01.x, layoutBoundsOnTex01.y); //new = [translate]
            this._tmpMatrix.scaleRelative(scaleX, scaleY); //new = [translate][scale]
            this._tmpMatrix.translateRelative(-this._tmpBoundsOnModel.x, -this._tmpBoundsOnModel.y); //new = [translate][scale][translate]
        }
        // tmpMatrixForMask ãŒè¨ˆç®—çµæžœ
        this._tmpMatrixForMask.setMatrix(this._tmpMatrix.getArray());
        this._tmpMatrix.loadIdentity();
        {
            this._tmpMatrix.translateRelative(layoutBoundsOnTex01.x, layoutBoundsOnTex01.y * (isRightHanded ? -1.0 : 1.0)); //new = [translate]
            this._tmpMatrix.scaleRelative(scaleX, scaleY * (isRightHanded ? -1.0 : 1.0)); //new = [translate][scale]
            this._tmpMatrix.translateRelative(-this._tmpBoundsOnModel.x, -this._tmpBoundsOnModel.y); //new = [translate][scale][translate]
        }
        this._tmpMatrixForDraw.setMatrix(this._tmpMatrix.getArray());
    }
    /**
     * ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ã‚³ãƒ³ãƒ†ã‚­ã‚¹ãƒˆã‚’é…ç½®ã™ã‚‹ãƒ¬ã‚¤ã‚¢ã‚¦ãƒˆ
     * æŒ‡å®šã•ã‚ŒãŸæ•°ã®ãƒ¬ãƒ³ãƒ€ãƒ¼ãƒ†ã‚¯ã‚¹ãƒãƒ£ã‚’æ¥µåŠ›ã„ã£ã±ã„ã«ä½¿ã£ã¦ãƒžã‚¹ã‚¯ã‚’ãƒ¬ã‚¤ã‚¢ã‚¦ãƒˆã™ã‚‹
     * ãƒžã‚¹ã‚¯ã‚°ãƒ«ãƒ¼ãƒ—ã®æ•°ãŒ4ä»¥ä¸‹ãªã‚‰RGBAå„ãƒãƒ£ãƒ³ãƒãƒ«ã«ä¸€ã¤ãšã¤ãƒžã‚¹ã‚¯ã‚’é…ç½®ã—ã€5ä»¥ä¸Š6ä»¥ä¸‹ãªã‚‰RGBAã‚’2,2,1,1ã¨é…ç½®ã™ã‚‹ã€‚
     *
     * @param usingClipCount é…ç½®ã™ã‚‹ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ã‚³ãƒ³ãƒ†ã‚­ã‚¹ãƒˆã®æ•°
     */
    setupLayoutBounds(usingClipCount) {
        const useClippingMaskMaxCount = this._renderTextureCount <= 1
            ? ClippingMaskMaxCountOnDefault
            : ClippingMaskMaxCountOnMultiRenderTexture * this._renderTextureCount;
        if (usingClipCount <= 0 || usingClipCount > useClippingMaskMaxCount) {
            if (usingClipCount > useClippingMaskMaxCount) {
                // ãƒžã‚¹ã‚¯ã®åˆ¶é™æ•°ã®è­¦å‘Šã‚’å‡ºã™
                CubismLogError('not supported mask count : {0}\n[Details] render texture count : {1}, mask count : {2}', usingClipCount - useClippingMaskMaxCount, this._renderTextureCount, usingClipCount);
            }
            // ã“ã®å ´åˆã¯ä¸€ã¤ã®ãƒžã‚¹ã‚¯ã‚¿ãƒ¼ã‚²ãƒƒãƒˆã‚’æ¯Žå›žã‚¯ãƒªã‚¢ã—ã¦ä½¿ç”¨ã™ã‚‹
            for (let index = 0; index < this._clippingContextListForMask.length; index++) {
                const clipContext = this._clippingContextListForMask[index];
                clipContext._layoutChannelIndex = 0; // ã©ã†ã›æ¯Žå›žæ¶ˆã™ã®ã§å›ºå®š
                clipContext._layoutBounds.x = 0.0;
                clipContext._layoutBounds.y = 0.0;
                clipContext._layoutBounds.width = 1.0;
                clipContext._layoutBounds.height = 1.0;
                clipContext._bufferIndex = 0;
            }
            return;
        }
        // ãƒ¬ãƒ³ãƒ€ãƒ¼ãƒ†ã‚¯ã‚¹ãƒãƒ£ãŒ1æžšãªã‚‰9åˆ†å‰²ã™ã‚‹ï¼ˆæœ€å¤§36æžšï¼‰
        const layoutCountMaxValue = this._renderTextureCount <= 1 ? 9 : 8;
        // æŒ‡å®šã•ã‚ŒãŸæ•°ã®ãƒ¬ãƒ³ãƒ€ãƒ¼ãƒ†ã‚¯ã‚¹ãƒãƒ£ã‚’æ¥µåŠ›ã„ã£ã±ã„ã«ä½¿ã£ã¦ãƒžã‚¹ã‚¯ã‚’ãƒ¬ã‚¤ã‚¢ã‚¦ãƒˆã™ã‚‹ï¼ˆãƒ‡ãƒ•ã‚©ãƒ«ãƒˆãªã‚‰1ï¼‰ã€‚
        // ãƒžã‚¹ã‚¯ã‚°ãƒ«ãƒ¼ãƒ—ã®æ•°ãŒ4ä»¥ä¸‹ãªã‚‰RGBAå„ãƒãƒ£ãƒ³ãƒãƒ«ã«1ã¤ãšã¤ãƒžã‚¹ã‚¯ã‚’é…ç½®ã—ã€5ä»¥ä¸Š6ä»¥ä¸‹ãªã‚‰RGBAã‚’2,2,1,1ã¨é…ç½®ã™ã‚‹ã€‚
        let countPerSheetDiv = usingClipCount / this._renderTextureCount; // ãƒ¬ãƒ³ãƒ€ãƒ¼ãƒ†ã‚¯ã‚¹ãƒãƒ£1æžšã‚ãŸã‚Šä½•æžšå‰²ã‚Šå½“ã¦ã‚‹ã‹ã€‚
        const reduceLayoutTextureCount = usingClipCount % this._renderTextureCount; // ãƒ¬ã‚¤ã‚¢ã‚¦ãƒˆã®æ•°ã‚’1æžšæ¸›ã‚‰ã™ãƒ¬ãƒ³ãƒ€ãƒ¼ãƒ†ã‚¯ã‚¹ãƒãƒ£ã®æ•°ï¼ˆã“ã®æ•°ã ã‘ã®ãƒ¬ãƒ³ãƒ€ãƒ¼ãƒ†ã‚¯ã‚¹ãƒãƒ£ãŒå¯¾è±¡ï¼‰ã€‚
        // 1æžšã«å‰²ã‚Šå½“ã¦ã‚‹ãƒžã‚¹ã‚¯ã®åˆ†å‰²æ•°ã‚’å–ã‚ŠãŸã„ãŸã‚ã€å°æ•°ç‚¹ã¯åˆ‡ã‚Šä¸Šã’ã‚‹
        countPerSheetDiv = Math.ceil(countPerSheetDiv);
        // RGBAã‚’é †ç•ªã«ä½¿ã£ã¦ã„ã
        let divCount = countPerSheetDiv / ColorChannelCount; // 1ãƒãƒ£ãƒ³ãƒãƒ«ã«é…ç½®ã™ã‚‹åŸºæœ¬ã®ãƒžã‚¹ã‚¯
        const modCount = countPerSheetDiv % ColorChannelCount; // ä½™ã‚Šã€ã“ã®ç•ªå·ã®ãƒãƒ£ãƒ³ãƒãƒ«ã¾ã§ã«ä¸€ã¤ãšã¤é…åˆ†ã™ã‚‹ï¼ˆã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ã§ã¯ãªã„ï¼‰
        // å°æ•°ç‚¹ã¯åˆ‡ã‚Šæ¨ã¦ã‚‹
        divCount = ~~divCount;
        // RGBAãã‚Œãžã‚Œã®ãƒãƒ£ãƒ³ãƒãƒ«ã‚’ç”¨æ„ã—ã¦ã„ãï¼ˆ0:R, 1:G, 2:B, 3:Aï¼‰
        let curClipIndex = 0; // é †ç•ªã«è¨­å®šã—ã¦ã„ã
        for (let renderTextureIndex = 0; renderTextureIndex < this._renderTextureCount; renderTextureIndex++) {
            for (let channelIndex = 0; channelIndex < ColorChannelCount; channelIndex++) {
                // ã“ã®ãƒãƒ£ãƒ³ãƒãƒ«ã«ãƒ¬ã‚¤ã‚¢ã‚¦ãƒˆã™ã‚‹æ•°
                // NOTE: ãƒ¬ã‚¤ã‚¢ã‚¦ãƒˆæ•° = 1ãƒãƒ£ãƒ³ãƒãƒ«ã«é…ç½®ã™ã‚‹åŸºæœ¬ã®ãƒžã‚¹ã‚¯ + ä½™ã‚Šã®ãƒžã‚¹ã‚¯ã‚’ç½®ããƒãƒ£ãƒ³ãƒãƒ«ãªã‚‰1ã¤è¿½åŠ 
                let layoutCount = divCount + (channelIndex < modCount ? 1 : 0);
                // ãƒ¬ã‚¤ã‚¢ã‚¦ãƒˆã®æ•°ã‚’1æžšæ¸›ã‚‰ã™å ´åˆã«ãã‚Œã‚’è¡Œã†ãƒãƒ£ãƒ³ãƒãƒ«ã‚’æ±ºå®š
                // divãŒ0ã®æ™‚ã¯æ­£å¸¸ãªã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ã®ç¯„å›²å†…ã«ãªã‚‹ã‚ˆã†ã«èª¿æ•´
                const checkChannelIndex = modCount + (divCount < 1 ? -1 : 0);
                // ä»Šå›žãŒå¯¾è±¡ã®ãƒãƒ£ãƒ³ãƒãƒ«ã‹ã¤ã€ãƒ¬ã‚¤ã‚¢ã‚¦ãƒˆã®æ•°ã‚’1æžšæ¸›ã‚‰ã™ãƒ¬ãƒ³ãƒ€ãƒ¼ãƒ†ã‚¯ã‚¹ãƒãƒ£ãŒå­˜åœ¨ã™ã‚‹å ´åˆ
                if (channelIndex == checkChannelIndex && reduceLayoutTextureCount > 0) {
                    // ç¾åœ¨ã®ãƒ¬ãƒ³ãƒ€ãƒ¼ãƒ†ã‚¯ã‚¹ãƒãƒ£ãŒã€å¯¾è±¡ã®ãƒ¬ãƒ³ãƒ€ãƒ¼ãƒ†ã‚¯ã‚¹ãƒãƒ£ã§ã‚ã‚Œã°ãƒ¬ã‚¤ã‚¢ã‚¦ãƒˆã®æ•°ã‚’1æžšæ¸›ã‚‰ã™ã€‚
                    layoutCount -= !(renderTextureIndex < reduceLayoutTextureCount)
                        ? 1
                        : 0;
                }
                // åˆ†å‰²æ–¹æ³•ã‚’æ±ºå®šã™ã‚‹
                if (layoutCount == 0) {
                    // ä½•ã‚‚ã—ãªã„
                }
                else if (layoutCount == 1) {
                    // å…¨ã¦ã‚’ãã®ã¾ã¾ä½¿ã†
                    const clipContext = this._clippingContextListForMask[curClipIndex++];
                    clipContext._layoutChannelIndex = channelIndex;
                    clipContext._layoutBounds.x = 0.0;
                    clipContext._layoutBounds.y = 0.0;
                    clipContext._layoutBounds.width = 1.0;
                    clipContext._layoutBounds.height = 1.0;
                    clipContext._bufferIndex = renderTextureIndex;
                }
                else if (layoutCount == 2) {
                    for (let i = 0; i < layoutCount; i++) {
                        let xpos = i % 2;
                        // å°æ•°ç‚¹ã¯åˆ‡ã‚Šæ¨ã¦ã‚‹
                        xpos = ~~xpos;
                        const cc = this._clippingContextListForMask[curClipIndex++];
                        cc._layoutChannelIndex = channelIndex;
                        // UVã‚’2ã¤ã«åˆ†è§£ã—ã¦ä½¿ã†
                        cc._layoutBounds.x = xpos * 0.5;
                        cc._layoutBounds.y = 0.0;
                        cc._layoutBounds.width = 0.5;
                        cc._layoutBounds.height = 1.0;
                        cc._bufferIndex = renderTextureIndex;
                    }
                }
                else if (layoutCount <= 4) {
                    // 4åˆ†å‰²ã—ã¦ä½¿ã†
                    for (let i = 0; i < layoutCount; i++) {
                        let xpos = i % 2;
                        let ypos = i / 2;
                        // å°æ•°ç‚¹ã¯åˆ‡ã‚Šæ¨ã¦ã‚‹
                        xpos = ~~xpos;
                        ypos = ~~ypos;
                        const cc = this._clippingContextListForMask[curClipIndex++];
                        cc._layoutChannelIndex = channelIndex;
                        cc._layoutBounds.x = xpos * 0.5;
                        cc._layoutBounds.y = ypos * 0.5;
                        cc._layoutBounds.width = 0.5;
                        cc._layoutBounds.height = 0.5;
                        cc._bufferIndex = renderTextureIndex;
                    }
                }
                else if (layoutCount <= layoutCountMaxValue) {
                    // 9åˆ†å‰²ã—ã¦ä½¿ã†
                    for (let i = 0; i < layoutCount; i++) {
                        let xpos = i % 3;
                        let ypos = i / 3;
                        // å°æ•°ç‚¹ã¯åˆ‡ã‚Šæ¨ã¦ã‚‹
                        xpos = ~~xpos;
                        ypos = ~~ypos;
                        const cc = this._clippingContextListForMask[curClipIndex++];
                        cc._layoutChannelIndex = channelIndex;
                        cc._layoutBounds.x = xpos / 3.0;
                        cc._layoutBounds.y = ypos / 3.0;
                        cc._layoutBounds.width = 1.0 / 3.0;
                        cc._layoutBounds.height = 1.0 / 3.0;
                        cc._bufferIndex = renderTextureIndex;
                    }
                }
                else {
                    // ãƒžã‚¹ã‚¯ã®åˆ¶é™æžšæ•°ã‚’è¶…ãˆãŸå ´åˆã®å‡¦ç†
                    CubismLogError('not supported mask count : {0}\n[Details] render texture count : {1}, mask count : {2}', usingClipCount - useClippingMaskMaxCount, this._renderTextureCount, usingClipCount);
                    // SetupShaderProgramã§ã‚ªãƒ¼ãƒãƒ¼ã‚¢ã‚¯ã‚»ã‚¹ãŒç™ºç”Ÿã™ã‚‹ã®ã§ä»®ã§æ•°å€¤ã‚’å…¥ã‚Œã‚‹
                    // ã‚‚ã¡ã‚ã‚“æç”»çµæžœã¯æ­£ã—ã„ã‚‚ã®ã§ã¯ãªããªã‚‹
                    for (let index = 0; index < layoutCount; index++) {
                        const cc = this._clippingContextListForMask[curClipIndex++];
                        cc._layoutChannelIndex = 0;
                        cc._layoutBounds.x = 0.0;
                        cc._layoutBounds.y = 0.0;
                        cc._layoutBounds.width = 1.0;
                        cc._layoutBounds.height = 1.0;
                        cc._bufferIndex = 0;
                    }
                }
            }
        }
    }
    /**
     * ãƒžã‚¹ã‚¯ã•ã‚Œã‚‹æç”»ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆç¾¤å…¨ä½“ã‚’å›²ã‚€çŸ©å½¢ï¼ˆãƒ¢ãƒ‡ãƒ«åº§æ¨™ç³»ï¼‰ã‚’è¨ˆç®—ã™ã‚‹
     * @param model ãƒ¢ãƒ‡ãƒ«ã®ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹
     * @param clippingContext ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ã®ã‚³ãƒ³ãƒ†ã‚­ã‚¹ãƒˆ
     */
    calcClippedDrawableTotalBounds(model, clippingContext) {
        // è¢«ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ï¼ˆãƒžã‚¹ã‚¯ã•ã‚Œã‚‹æç”»ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆï¼‰ã®å…¨ä½“ã®çŸ©å½¢
        let clippedDrawTotalMinX = Number.MAX_VALUE;
        let clippedDrawTotalMinY = Number.MAX_VALUE;
        let clippedDrawTotalMaxX = Number.MIN_VALUE;
        let clippedDrawTotalMaxY = Number.MIN_VALUE;
        // ã“ã®ãƒžã‚¹ã‚¯ãŒå®Ÿéš›ã«å¿…è¦ã‹åˆ¤å®šã™ã‚‹
        // ã“ã®ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ã‚’åˆ©ç”¨ã™ã‚‹ã€Œæç”»ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã€ãŒã²ã¨ã¤ã§ã‚‚ä½¿ç”¨å¯èƒ½ã§ã‚ã‚Œã°ãƒžã‚¹ã‚¯ã‚’ç”Ÿæˆã™ã‚‹å¿…è¦ãŒã‚ã‚‹
        const clippedDrawCount = clippingContext._clippedDrawableIndexList.length;
        for (let clippedDrawableIndex = 0; clippedDrawableIndex < clippedDrawCount; clippedDrawableIndex++) {
            // ãƒžã‚¹ã‚¯ã‚’ä½¿ç”¨ã™ã‚‹æç”»ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã®æç”»ã•ã‚Œã‚‹çŸ©å½¢ã‚’æ±‚ã‚ã‚‹
            const drawableIndex = clippingContext._clippedDrawableIndexList[clippedDrawableIndex];
            const drawableVertexCount = model.getDrawableVertexCount(drawableIndex);
            const drawableVertexes = model.getDrawableVertices(drawableIndex);
            let minX = Number.MAX_VALUE;
            let minY = Number.MAX_VALUE;
            let maxX = -Number.MAX_VALUE;
            let maxY = -Number.MAX_VALUE;
            const loop = drawableVertexCount * Constant.vertexStep;
            for (let pi = Constant.vertexOffset; pi < loop; pi += Constant.vertexStep) {
                const x = drawableVertexes[pi];
                const y = drawableVertexes[pi + 1];
                if (x < minX) {
                    minX = x;
                }
                if (x > maxX) {
                    maxX = x;
                }
                if (y < minY) {
                    minY = y;
                }
                if (y > maxY) {
                    maxY = y;
                }
            }
            // æœ‰åŠ¹ãªç‚¹ãŒä¸€ã¤ã‚‚å–ã‚Œãªã‹ã£ãŸã®ã§ã‚¹ã‚­ãƒƒãƒ—
            if (minX == Number.MAX_VALUE) {
                continue;
            }
            // å…¨ä½“ã®çŸ©å½¢ã«åæ˜ 
            if (minX < clippedDrawTotalMinX) {
                clippedDrawTotalMinX = minX;
            }
            if (minY < clippedDrawTotalMinY) {
                clippedDrawTotalMinY = minY;
            }
            if (maxX > clippedDrawTotalMaxX) {
                clippedDrawTotalMaxX = maxX;
            }
            if (maxY > clippedDrawTotalMaxY) {
                clippedDrawTotalMaxY = maxY;
            }
            if (clippedDrawTotalMinX == Number.MAX_VALUE) {
                clippingContext._allClippedDrawRect.x = 0.0;
                clippingContext._allClippedDrawRect.y = 0.0;
                clippingContext._allClippedDrawRect.width = 0.0;
                clippingContext._allClippedDrawRect.height = 0.0;
                clippingContext._isUsing = false;
            }
            else {
                clippingContext._isUsing = true;
                const w = clippedDrawTotalMaxX - clippedDrawTotalMinX;
                const h = clippedDrawTotalMaxY - clippedDrawTotalMinY;
                clippingContext._allClippedDrawRect.x = clippedDrawTotalMinX;
                clippingContext._allClippedDrawRect.y = clippedDrawTotalMinY;
                clippingContext._allClippedDrawRect.width = w;
                clippingContext._allClippedDrawRect.height = h;
            }
        }
    }
    /**
     * ç”»é¢æç”»ã«ä½¿ç”¨ã™ã‚‹ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ã®ãƒªã‚¹ãƒˆã‚’å–å¾—ã™ã‚‹
     * @return ç”»é¢æç”»ã«ä½¿ç”¨ã™ã‚‹ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ã®ãƒªã‚¹ãƒˆ
     */
    getClippingContextListForDraw() {
        return this._clippingContextListForDraw;
    }
    getClippingContextListForOffscreen() {
        return this._clippingContextListForOffscreen;
    }
    /**
     * ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ãƒãƒƒãƒ•ã‚¡ã®ã‚µã‚¤ã‚ºã‚’å–å¾—ã™ã‚‹
     * @return ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ãƒãƒƒãƒ•ã‚¡ã®ã‚µã‚¤ã‚º
     */
    getClippingMaskBufferSize() {
        return this._clippingMaskBufferSize;
    }
    /**
     * ã“ã®ãƒãƒƒãƒ•ã‚¡ã®ãƒ¬ãƒ³ãƒ€ãƒ¼ãƒ†ã‚¯ã‚¹ãƒãƒ£ã®æžšæ•°ã‚’å–å¾—ã™ã‚‹
     * @return ã“ã®ãƒãƒƒãƒ•ã‚¡ã®ãƒ¬ãƒ³ãƒ€ãƒ¼ãƒ†ã‚¯ã‚¹ãƒãƒ£ã®æžšæ•°
     */
    getRenderTextureCount() {
        return this._renderTextureCount;
    }
    /**
     * ã‚«ãƒ©ãƒ¼ãƒãƒ£ãƒ³ãƒãƒ«ï¼ˆRGBAï¼‰ã®ãƒ•ãƒ©ã‚°ã‚’å–å¾—ã™ã‚‹
     * @param channelNo ã‚«ãƒ©ãƒ¼ãƒãƒ£ãƒ³ãƒãƒ«ï¼ˆRGBAï¼‰ã®ç•ªå·ï¼ˆ0:R, 1:G, 2:B, 3:Aï¼‰
     */
    getChannelFlagAsColor(channelNo) {
        return this._channelColors[channelNo];
    }
    /**
     * ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ãƒãƒƒãƒ•ã‚¡ã®ã‚µã‚¤ã‚ºã‚’è¨­å®šã™ã‚‹
     * @param size ã‚¯ãƒªãƒƒãƒ”ãƒ³ã‚°ãƒžã‚¹ã‚¯ãƒãƒƒãƒ•ã‚¡ã®ã‚µã‚¤ã‚º
     */
    setClippingMaskBufferSize(size) {
        this._clippingMaskBufferSize = size;
    }
}
//# sourceMappingURL=cubismclippingmanager.js.map