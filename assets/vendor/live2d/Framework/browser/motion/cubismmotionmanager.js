/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
import { CubismMotionQueueManager } from './cubismmotionqueuemanager.js';
/**
 * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®ç®¡ç†
 *
 * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®ç®¡ç†ã‚’è¡Œã†ã‚¯ãƒ©ã‚¹
 */
export class CubismMotionManager extends CubismMotionQueueManager {
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    constructor() {
        super();
        this._currentPriority = 0;
        this._reservePriority = 0;
    }
    /**
     * å†ç”Ÿä¸­ã®ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®å„ªå…ˆåº¦ã®å–å¾—
     * @return  ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®å„ªå…ˆåº¦
     */
    getCurrentPriority() {
        return this._currentPriority;
    }
    /**
     * äºˆç´„ä¸­ã®ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®å„ªå…ˆåº¦ã‚’å–å¾—ã™ã‚‹ã€‚
     * @return  ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®å„ªå…ˆåº¦
     */
    getReservePriority() {
        return this._reservePriority;
    }
    /**
     * äºˆç´„ä¸­ã®ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®å„ªå…ˆåº¦ã‚’è¨­å®šã™ã‚‹ã€‚
     * @param   val     å„ªå…ˆåº¦
     */
    setReservePriority(val) {
        this._reservePriority = val;
    }
    /**
     * å„ªå…ˆåº¦ã‚’è¨­å®šã—ã¦ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã‚’é–‹å§‹ã™ã‚‹ã€‚
     *
     * @param motion          ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³
     * @param autoDelete      å†ç”ŸãŒç‹©çŒŸã—ãŸãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹ã‚’å‰Šé™¤ã™ã‚‹ãªã‚‰true
     * @param priority        å„ªå…ˆåº¦
     * @return                é–‹å§‹ã—ãŸãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®è­˜åˆ¥ç•ªå·ã‚’è¿”ã™ã€‚å€‹åˆ¥ã®ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ãŒçµ‚äº†ã—ãŸã‹å¦ã‹ã‚’åˆ¤å®šã™ã‚‹IsFinished()ã®å¼•æ•°ã§ä½¿ç”¨ã™ã‚‹ã€‚é–‹å§‹ã§ããªã„æ™‚ã¯ã€Œ-1ã€
     */
    startMotionPriority(motion, autoDelete, priority) {
        if (priority == this._reservePriority) {
            this._reservePriority = 0; // äºˆç´„ã‚’è§£é™¤
        }
        this._currentPriority = priority; // å†ç”Ÿä¸­ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®å„ªå…ˆåº¦ã‚’è¨­å®š
        return super.startMotion(motion, autoDelete);
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã‚’æ›´æ–°ã—ã¦ã€ãƒ¢ãƒ‡ãƒ«ã«ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿å€¤ã‚’åæ˜ ã™ã‚‹ã€‚
     *
     * @param model   å¯¾è±¡ã®ãƒ¢ãƒ‡ãƒ«
     * @param deltaTimeSeconds    ãƒ‡ãƒ«ã‚¿æ™‚é–“[ç§’]
     * @return  true    æ›´æ–°ã•ã‚Œã¦ã„ã‚‹
     * @return  false   æ›´æ–°ã•ã‚Œã¦ã„ãªã„
     */
    updateMotion(model, deltaTimeSeconds) {
        this._userTimeSeconds += deltaTimeSeconds;
        const updated = super.doUpdateMotion(model, this._userTimeSeconds);
        if (this.isFinished()) {
            this._currentPriority = 0; // å†ç”Ÿä¸­ã®ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®å„ªå…ˆåº¦ã‚’è§£é™¤
        }
        return updated;
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã‚’äºˆç´„ã™ã‚‹ã€‚
     *
     * @param   priority    å„ªå…ˆåº¦
     * @return  true    äºˆç´„ã§ããŸ
     * @return  false   äºˆç´„ã§ããªã‹ã£ãŸ
     */
    reserveMotion(priority) {
        if (priority <= this._reservePriority ||
            priority <= this._currentPriority) {
            return false;
        }
        this._reservePriority = priority;
        return true;
    }
}
// Namespace definition for compatibility.
import * as $ from './cubismmotionmanager.js';
// eslint-disable-next-line @typescript-eslint/no-namespace
export var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    Live2DCubismFramework.CubismMotionManager = $.CubismMotionManager;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));
//# sourceMappingURL=cubismmotionmanager.js.map