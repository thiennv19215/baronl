/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
import { CubismBreath } from '../effect/cubismbreath.js';
import { CubismEyeBlink } from '../effect/cubismeyeblink.js';
import { CubismPose } from '../effect/cubismpose.js';
import { Constant } from '../live2dcubismframework.js';
import { CubismModelMatrix } from '../math/cubismmodelmatrix.js';
import { CubismTargetPoint } from '../math/cubismtargetpoint.js';
import { CubismExpressionMotion } from '../motion/cubismexpressionmotion.js';
import { CubismExpressionMotionManager } from '../motion/cubismexpressionmotionmanager.js';
import { CubismMotion } from '../motion/cubismmotion.js';
import { CubismMotionManager } from '../motion/cubismmotionmanager.js';
import { CubismPhysics } from '../physics/cubismphysics.js';
import { CubismRenderer_WebGL } from '../rendering/cubismrenderer_webgl.js';
import { CubismLogError, CubismLogInfo } from '../utils/cubismdebug.js';
import { CubismMoc } from './cubismmoc.js';
import { CubismModelUserData } from './cubismmodeluserdata.js';
/**
 * ãƒ¦ãƒ¼ã‚¶ãƒ¼ãŒå®Ÿéš›ã«ä½¿ç”¨ã™ã‚‹ãƒ¢ãƒ‡ãƒ«
 *
 * ãƒ¦ãƒ¼ã‚¶ãƒ¼ãŒå®Ÿéš›ã«ä½¿ç”¨ã™ã‚‹ãƒ¢ãƒ‡ãƒ«ã®åŸºåº•ã‚¯ãƒ©ã‚¹ã€‚ã“ã‚Œã‚’ç¶™æ‰¿ã—ã¦ãƒ¦ãƒ¼ã‚¶ãƒ¼ãŒå®Ÿè£…ã™ã‚‹ã€‚
 */
export class CubismUserModel {
    /**
     * åˆæœŸåŒ–çŠ¶æ…‹ã®å–å¾—
     *
     * åˆæœŸåŒ–ã•ã‚Œã¦ã„ã‚‹çŠ¶æ…‹ã‹ï¼Ÿ
     *
     * @return true     åˆæœŸåŒ–ã•ã‚Œã¦ã„ã‚‹
     * @return false    åˆæœŸåŒ–ã•ã‚Œã¦ã„ãªã„
     */
    isInitialized() {
        return this._initialized;
    }
    /**
     * åˆæœŸåŒ–çŠ¶æ…‹ã®è¨­å®š
     *
     * åˆæœŸåŒ–çŠ¶æ…‹ã‚’è¨­å®šã™ã‚‹ã€‚
     *
     * @param v åˆæœŸåŒ–çŠ¶æ…‹
     */
    setInitialized(v) {
        this._initialized = v;
    }
    /**
     * æ›´æ–°çŠ¶æ…‹ã®å–å¾—
     *
     * æ›´æ–°ã•ã‚Œã¦ã„ã‚‹çŠ¶æ…‹ã‹ï¼Ÿ
     *
     * @return true     æ›´æ–°ã•ã‚Œã¦ã„ã‚‹
     * @return false    æ›´æ–°ã•ã‚Œã¦ã„ãªã„
     */
    isUpdating() {
        return this._updating;
    }
    /**
     * æ›´æ–°çŠ¶æ…‹ã®è¨­å®š
     *
     * æ›´æ–°çŠ¶æ…‹ã‚’è¨­å®šã™ã‚‹
     *
     * @param v æ›´æ–°çŠ¶æ…‹
     */
    setUpdating(v) {
        this._updating = v;
    }
    /**
     * ãƒžã‚¦ã‚¹ãƒ‰ãƒ©ãƒƒã‚°æƒ…å ±ã®è¨­å®š
     *
     * @param ãƒ‰ãƒ©ãƒƒã‚°ã—ã¦ã„ã‚‹ã‚«ãƒ¼ã‚½ãƒ«ã®Xä½ç½®
     * @param ãƒ‰ãƒ©ãƒƒã‚°ã—ã¦ã„ã‚‹ã‚«ãƒ¼ã‚½ãƒ«ã®Yä½ç½®
     */
    setDragging(x, y) {
        this._dragManager.set(x, y);
    }
    /**
     * ãƒ¢ãƒ‡ãƒ«è¡Œåˆ—ã‚’å–å¾—ã™ã‚‹
     * @return ãƒ¢ãƒ‡ãƒ«è¡Œåˆ—
     */
    getModelMatrix() {
        return this._modelMatrix;
    }
    /**
     * ãƒ¢ãƒ‡ãƒ«ã‚’æç”»ã—ãŸãƒãƒƒãƒ•ã‚¡ã‚’è¨­å®šã™ã‚‹
     *
     * @param width ãƒ¢ãƒ‡ãƒ«ã‚’æç”»ã—ãŸãƒãƒƒãƒ•ã‚¡ã®å¹…
     * @param height ãƒ¢ãƒ‡ãƒ«ã‚’æç”»ã—ãŸãƒãƒƒãƒ•ã‚¡ã®é«˜ã•
     */
    setRenderTargetSize(width, height) {
        if (this._renderer) {
            this._renderer.setRenderTargetSize(width, height);
        }
    }
    /**
     * ä¸é€æ˜Žåº¦ã®è¨­å®š
     *
     * @param a ä¸é€æ˜Žåº¦
     */
    setOpacity(a) {
        this._opacity = a;
    }
    /**
     * ä¸é€æ˜Žåº¦ã®å–å¾—
     *
     * @return ä¸é€æ˜Žåº¦
     */
    getOpacity() {
        return this._opacity;
    }
    /**
     * ãƒ¢ãƒ‡ãƒ«ãƒ‡ãƒ¼ã‚¿ã‚’èª­ã¿è¾¼ã‚€
     *
     * @param buffer    moc3ãƒ•ã‚¡ã‚¤ãƒ«ãŒèª­ã¿è¾¼ã¾ã‚Œã¦ã„ã‚‹ãƒãƒƒãƒ•ã‚¡
     */
    loadModel(buffer, shouldCheckMocConsistency = false) {
        this._moc = CubismMoc.create(buffer, shouldCheckMocConsistency);
        if (this._moc == null) {
            CubismLogError('Failed to CubismMoc.create().');
            return;
        }
        this._model = this._moc.createModel();
        if (this._model == null) {
            CubismLogError('Failed to CreateModel().');
            return;
        }
        this._model.saveParameters();
        this._modelMatrix = new CubismModelMatrix(this._model.getCanvasWidth(), this._model.getCanvasHeight());
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ãƒ‡ãƒ¼ã‚¿ã‚’èª­ã¿è¾¼ã‚€
     * @param buffer motion3.jsonãƒ•ã‚¡ã‚¤ãƒ«ãŒèª­ã¿è¾¼ã¾ã‚Œã¦ã„ã‚‹ãƒãƒƒãƒ•ã‚¡
     * @param size ãƒãƒƒãƒ•ã‚¡ã®ã‚µã‚¤ã‚º
     * @param name ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®åå‰
     * @param onFinishedMotionHandler ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³å†ç”Ÿçµ‚äº†æ™‚ã«å‘¼ã³å‡ºã•ã‚Œã‚‹ã‚³ãƒ¼ãƒ«ãƒãƒƒã‚¯é–¢æ•°
     * @param onBeganMotionHandler ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³å†ç”Ÿé–‹å§‹æ™‚ã«å‘¼ã³å‡ºã•ã‚Œã‚‹ã‚³ãƒ¼ãƒ«ãƒãƒƒã‚¯é–¢æ•°
     * @param modelSetting ãƒ¢ãƒ‡ãƒ«è¨­å®š
     * @param group ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã‚°ãƒ«ãƒ¼ãƒ—å
     * @param index ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @param shouldCheckMotionConsistency motion3.jsonæ•´åˆæ€§ãƒã‚§ãƒƒã‚¯ã™ã‚‹ã‹ã©ã†ã‹
     * @return ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã‚¯ãƒ©ã‚¹
     */
    loadMotion(buffer, size, name, onFinishedMotionHandler, onBeganMotionHandler, modelSetting, group, index, shouldCheckMotionConsistency = false) {
        if (buffer == null || size == 0) {
            CubismLogError('Failed to loadMotion().');
            return null;
        }
        const motion = CubismMotion.create(buffer, size, onFinishedMotionHandler, onBeganMotionHandler, shouldCheckMotionConsistency);
        if (motion == null) {
            CubismLogError(`Failed to create motion from buffer in LoadMotion()`);
            return null;
        }
        // å¿…è¦ã§ã‚ã‚Œã°ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ãƒ•ã‚§ãƒ¼ãƒ‰å€¤ã‚’ä¸Šæ›¸ã
        if (modelSetting) {
            const fadeInTime = modelSetting.getMotionFadeInTimeValue(group, index);
            if (fadeInTime >= 0.0) {
                motion.setFadeInTime(fadeInTime);
            }
            const fadeOutTime = modelSetting.getMotionFadeOutTimeValue(group, index);
            if (fadeOutTime >= 0.0) {
                motion.setFadeOutTime(fadeOutTime);
            }
        }
        return motion;
    }
    /**
     * è¡¨æƒ…ãƒ‡ãƒ¼ã‚¿ã®èª­ã¿è¾¼ã¿
     * @param buffer expãƒ•ã‚¡ã‚¤ãƒ«ãŒèª­ã¿è¾¼ã¾ã‚Œã¦ã„ã‚‹ãƒãƒƒãƒ•ã‚¡
     * @param size ãƒãƒƒãƒ•ã‚¡ã®ã‚µã‚¤ã‚º
     * @param name è¡¨æƒ…ã®åå‰
     */
    loadExpression(buffer, size, name) {
        if (buffer == null || size == 0) {
            CubismLogError('Failed to loadExpression().');
            return null;
        }
        return CubismExpressionMotion.create(buffer, size);
    }
    /**
     * ãƒãƒ¼ã‚ºãƒ‡ãƒ¼ã‚¿ã®èª­ã¿è¾¼ã¿
     * @param buffer pose3.jsonãŒèª­ã¿è¾¼ã¾ã‚Œã¦ã„ã‚‹ãƒãƒƒãƒ•ã‚¡
     * @param size ãƒãƒƒãƒ•ã‚¡ã®ã‚µã‚¤ã‚º
     */
    loadPose(buffer, size) {
        if (buffer == null || size == 0) {
            CubismLogError('Failed to loadPose().');
            return;
        }
        this._pose = CubismPose.create(buffer, size);
    }
    /**
     * ãƒ¢ãƒ‡ãƒ«ã«ä»˜å±žã™ã‚‹ãƒ¦ãƒ¼ã‚¶ãƒ¼ãƒ‡ãƒ¼ã‚¿ã‚’èª­ã¿è¾¼ã‚€
     * @param buffer userdata3.jsonãŒèª­ã¿è¾¼ã¾ã‚Œã¦ã„ã‚‹ãƒãƒƒãƒ•ã‚¡
     * @param size ãƒãƒƒãƒ•ã‚¡ã®ã‚µã‚¤ã‚º
     */
    loadUserData(buffer, size) {
        if (buffer == null || size == 0) {
            CubismLogError('Failed to loadUserData().');
            return;
        }
        this._modelUserData = CubismModelUserData.create(buffer, size);
    }
    /**
     * ç‰©ç†æ¼”ç®—ãƒ‡ãƒ¼ã‚¿ã®èª­ã¿è¾¼ã¿
     * @param buffer  physics3.jsonãŒèª­ã¿è¾¼ã¾ã‚Œã¦ã„ã‚‹ãƒãƒƒãƒ•ã‚¡
     * @param size    ãƒãƒƒãƒ•ã‚¡ã®ã‚µã‚¤ã‚º
     */
    loadPhysics(buffer, size) {
        if (buffer == null || size == 0) {
            CubismLogError('Failed to loadPhysics().');
            return;
        }
        this._physics = CubismPhysics.create(buffer, size);
    }
    /**
     * å½“ãŸã‚Šåˆ¤å®šã®å–å¾—
     * @param drawableId æ¤œè¨¼ã—ãŸã„Drawableã®ID
     * @param pointX Xä½ç½®
     * @param pointY Yä½ç½®
     * @return true ãƒ’ãƒƒãƒˆã—ã¦ã„ã‚‹
     * @return false ãƒ’ãƒƒãƒˆã—ã¦ã„ãªã„
     */
    isHit(drawableId, pointX, pointY) {
        const drawIndex = this._model.getDrawableIndex(drawableId);
        if (drawIndex < 0) {
            return false; // å­˜åœ¨ã—ãªã„å ´åˆã¯false
        }
        const count = this._model.getDrawableVertexCount(drawIndex);
        const vertices = this._model.getDrawableVertices(drawIndex);
        let left = vertices[0];
        let right = vertices[0];
        let top = vertices[1];
        let bottom = vertices[1];
        for (let j = 1; j < count; ++j) {
            const x = vertices[Constant.vertexOffset + j * Constant.vertexStep];
            const y = vertices[Constant.vertexOffset + j * Constant.vertexStep + 1];
            if (x < left) {
                left = x; // Min x
            }
            if (x > right) {
                right = x; // Max x
            }
            if (y < top) {
                top = y; // Min y
            }
            if (y > bottom) {
                bottom = y; // Max y
            }
        }
        const tx = this._modelMatrix.invertTransformX(pointX);
        const ty = this._modelMatrix.invertTransformY(pointY);
        return left <= tx && tx <= right && top <= ty && ty <= bottom;
    }
    /**
     * ãƒ¢ãƒ‡ãƒ«ã®å–å¾—
     * @return ãƒ¢ãƒ‡ãƒ«
     */
    getModel() {
        return this._model;
    }
    /**
     * èª­ã¿è¾¼ã‚ãªã„Mocãƒ•ã‚¡ã‚¤ãƒ«ã®.moc3 Versionã‚’å–å¾—
     * @param mocBytes èª­ã¿è¾¼ã‚ãªã„Mocãƒ•ã‚¡ã‚¤ãƒ«ã®ãƒã‚¤ãƒˆé…åˆ—
     * @returns .moc3 Versionç•ªå·
     */
    getMocVersionFromBuffer(mocBytes) {
        return CubismMoc.getMocVersionFromBuffer(mocBytes);
    }
    /**
     * ãƒ¬ãƒ³ãƒ€ãƒ©ã®å–å¾—
     * @return ãƒ¬ãƒ³ãƒ€ãƒ©
     */
    getRenderer() {
        return this._renderer;
    }
    /**
     * ãƒ¬ãƒ³ãƒ€ãƒ©ã‚’ä½œæˆã—ã¦åˆæœŸåŒ–ã‚’å®Ÿè¡Œã™ã‚‹
     * @param width ãƒ¬ãƒ³ãƒ€ãƒªãƒ³ã‚°ã™ã‚‹å¹…
     * @param height ãƒ¬ãƒ³ãƒ€ãƒªãƒ³ã‚°ã™ã‚‹é«˜ã•
     * @param maskBufferCount ãƒãƒƒãƒ•ã‚¡ã®ç”Ÿæˆæ•°
     */
    createRenderer(width, height, maskBufferCount = 1) {
        if (this._renderer) {
            this.deleteRenderer();
        }
        this._renderer = new CubismRenderer_WebGL(width, height);
        this._renderer.initialize(this._model, maskBufferCount);
    }
    /**
     * ãƒ¬ãƒ³ãƒ€ãƒ©ã®è§£æ”¾
     */
    deleteRenderer() {
        if (this._renderer != null) {
            this._renderer.release();
            this._renderer = null;
        }
    }
    /**
     * ã‚¤ãƒ™ãƒ³ãƒˆç™ºç«æ™‚ã®æ¨™æº–å‡¦ç†
     *
     * EventãŒå†ç”Ÿå‡¦ç†æ™‚ã«ã‚ã£ãŸå ´åˆã®å‡¦ç†ã‚’ã™ã‚‹ã€‚
     * ç¶™æ‰¿ã§ä¸Šæ›¸ãã™ã‚‹ã“ã¨ã‚’æƒ³å®šã—ã¦ã„ã‚‹ã€‚
     * ä¸Šæ›¸ãã—ãªã„å ´åˆã¯ãƒ­ã‚°å‡ºåŠ›ã‚’ã™ã‚‹ã€‚
     *
     * @param eventValue ç™ºç«ã—ãŸã‚¤ãƒ™ãƒ³ãƒˆã®æ–‡å­—åˆ—ãƒ‡ãƒ¼ã‚¿
     */
    motionEventFired(eventValue) {
        CubismLogInfo('{0}', eventValue);
    }
    /**
     * ã‚¤ãƒ™ãƒ³ãƒˆç”¨ã®ã‚³ãƒ¼ãƒ«ãƒãƒƒã‚¯
     *
     * CubismMotionQueueManagerã«ã‚¤ãƒ™ãƒ³ãƒˆç”¨ã«ç™»éŒ²ã™ã‚‹ãŸã‚ã®Callbackã€‚
     * CubismUserModelã®ç¶™æ‰¿å…ˆã®EventFiredã‚’å‘¼ã¶ã€‚
     *
     * @param caller ç™ºç«ã—ãŸã‚¤ãƒ™ãƒ³ãƒˆã‚’ç®¡ç†ã—ã¦ã„ãŸãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ãƒžãƒãƒ¼ã‚¸ãƒ£ãƒ¼ã€æ¯”è¼ƒç”¨
     * @param eventValue ç™ºç«ã—ãŸã‚¤ãƒ™ãƒ³ãƒˆã®æ–‡å­—åˆ—ãƒ‡ãƒ¼ã‚¿
     * @param customData CubismUserModelã‚’ç¶™æ‰¿ã—ãŸã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹ã‚’æƒ³å®š
     */
    static cubismDefaultMotionEventCallback(caller, eventValue, customData) {
        const model = customData;
        if (model != null) {
            model.motionEventFired(eventValue);
        }
    }
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    constructor() {
        // å„å¤‰æ•°åˆæœŸåŒ–
        this._moc = null;
        this._model = null;
        this._motionManager = null;
        this._expressionManager = null;
        this._eyeBlink = null;
        this._breath = null;
        this._modelMatrix = null;
        this._pose = null;
        this._dragManager = null;
        this._physics = null;
        this._modelUserData = null;
        this._initialized = false;
        this._updating = false;
        this._opacity = 1.0;
        this._mocConsistency = false;
        this._debugMode = false;
        this._renderer = null;
        // ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ãƒžãƒãƒ¼ã‚¸ãƒ£ãƒ¼ã‚’ä½œæˆ
        this._motionManager = new CubismMotionManager();
        this._motionManager.setEventCallback(CubismUserModel.cubismDefaultMotionEventCallback, this);
        // è¡¨æƒ…ãƒžãƒãƒ¼ã‚¸ãƒ£ãƒ¼ã‚’ä½œæˆ
        this._expressionManager = new CubismExpressionMotionManager();
        // ãƒ‰ãƒ©ãƒƒã‚°ã«ã‚ˆã‚‹ã‚¢ãƒ‹ãƒ¡ãƒ¼ã‚·ãƒ§ãƒ³
        this._dragManager = new CubismTargetPoint();
    }
    /**
     * ãƒ‡ã‚¹ãƒˆãƒ©ã‚¯ã‚¿ã«ç›¸å½“ã™ã‚‹å‡¦ç†
     */
    release() {
        if (this._motionManager != null) {
            this._motionManager.release();
            this._motionManager = null;
        }
        if (this._expressionManager != null) {
            this._expressionManager.release();
            this._expressionManager = null;
        }
        if (this._moc != null) {
            this._moc.deleteModel(this._model);
            this._moc.release();
            this._moc = null;
        }
        this._modelMatrix = null;
        CubismPose.delete(this._pose);
        CubismEyeBlink.delete(this._eyeBlink);
        CubismBreath.delete(this._breath);
        this._dragManager = null;
        CubismPhysics.delete(this._physics);
        CubismModelUserData.delete(this._modelUserData);
        this.deleteRenderer();
    }
}
// Namespace definition for compatibility.
import * as $ from './cubismusermodel.js';
// eslint-disable-next-line @typescript-eslint/no-namespace
export var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    Live2DCubismFramework.CubismUserModel = $.CubismUserModel;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));
//# sourceMappingURL=cubismusermodel.js.map