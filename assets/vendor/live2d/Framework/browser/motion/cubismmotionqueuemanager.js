/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
import { CubismMotionQueueEntry } from './cubismmotionqueueentry.js';
/**
 * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³å†ç”Ÿã®ç®¡ç†
 *
 * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³å†ç”Ÿã®ç®¡ç†ç”¨ã‚¯ãƒ©ã‚¹ã€‚CubismMotionãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ãªã©ACubismMotionã®ã‚µãƒ–ã‚¯ãƒ©ã‚¹ã‚’å†ç”Ÿã™ã‚‹ãŸã‚ã«ä½¿ç”¨ã™ã‚‹ã€‚
 *
 * @note å†ç”Ÿä¸­ã«åˆ¥ã®ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ãŒ StartMotion()ã•ã‚ŒãŸå ´åˆã¯ã€æ–°ã—ã„ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã«æ»‘ã‚‰ã‹ã«å¤‰åŒ–ã—æ—§ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã¯ä¸­æ–­ã™ã‚‹ã€‚
 *       è¡¨æƒ…ç”¨ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã€ä½“ç”¨ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ãªã©ã‚’åˆ†ã‘ã¦ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³åŒ–ã—ãŸå ´åˆãªã©ã€
 *       è¤‡æ•°ã®ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã‚’åŒæ™‚ã«å†ç”Ÿã•ã›ã‚‹å ´åˆã¯ã€è¤‡æ•°ã®CubismMotionQueueManagerã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹ã‚’ä½¿ç”¨ã™ã‚‹ã€‚
 */
export class CubismMotionQueueManager {
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    constructor() {
        this._userTimeSeconds = 0.0;
        this._eventCallBack = null;
        this._eventCustomData = null;
        this._motions = new Array();
    }
    /**
     * ãƒ‡ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    release() {
        for (let i = 0; i < this._motions.length; ++i) {
            if (this._motions[i]) {
                this._motions[i].release();
                this._motions[i] = null;
            }
        }
        this._motions = null;
    }
    /**
     * æŒ‡å®šã—ãŸãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®é–‹å§‹
     *
     * æŒ‡å®šã—ãŸãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã‚’é–‹å§‹ã™ã‚‹ã€‚åŒã˜ã‚¿ã‚¤ãƒ—ã®ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ãŒæ—¢ã«ã‚ã‚‹å ´åˆã¯ã€æ—¢å­˜ã®ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã«çµ‚äº†ãƒ•ãƒ©ã‚°ã‚’ç«‹ã¦ã€ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¢ã‚¦ãƒˆã‚’é–‹å§‹ã•ã›ã‚‹ã€‚
     *
     * @param   motion          é–‹å§‹ã™ã‚‹ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³
     * @param   autoDelete      å†ç”ŸãŒçµ‚äº†ã—ãŸãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹ã‚’å‰Šé™¤ã™ã‚‹ãªã‚‰ true
     * @param   userTimeSeconds Deprecated: ãƒ‡ãƒ«ã‚¿æ™‚é–“ã®ç©ç®—å€¤[ç§’] é–¢æ•°å†…ã§å‚ç…§ã—ã¦ã„ãªã„ãŸã‚ä½¿ç”¨ã¯éžæŽ¨å¥¨ã€‚
     * @return                      é–‹å§‹ã—ãŸãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®è­˜åˆ¥ç•ªå·ã‚’è¿”ã™ã€‚å€‹åˆ¥ã®ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ãŒçµ‚äº†ã—ãŸã‹å¦ã‹ã‚’åˆ¤å®šã™ã‚‹IsFinished()ã®å¼•æ•°ã§ä½¿ç”¨ã™ã‚‹ã€‚é–‹å§‹ã§ããªã„æ™‚ã¯ã€Œ-1ã€
     */
    startMotion(motion, autoDelete, userTimeSeconds) {
        if (motion == null) {
            return InvalidMotionQueueEntryHandleValue;
        }
        let motionQueueEntry = null;
        // æ—¢ã«ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ãŒã‚ã‚Œã°çµ‚äº†ãƒ•ãƒ©ã‚°ã‚’ç«‹ã¦ã‚‹
        for (let i = 0; i < this._motions.length; ++i) {
            motionQueueEntry = this._motions[i];
            if (motionQueueEntry == null) {
                continue;
            }
            motionQueueEntry.setFadeOut(motionQueueEntry._motion.getFadeOutTime()); // ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¢ã‚¦ãƒˆè¨­å®š
        }
        motionQueueEntry = new CubismMotionQueueEntry(); // çµ‚äº†æ™‚ã«ç ´æ£„ã™ã‚‹
        motionQueueEntry._autoDelete = autoDelete;
        motionQueueEntry._motion = motion;
        this._motions.push(motionQueueEntry);
        return motionQueueEntry._motionQueueEntryHandle;
    }
    /**
     * å…¨ã¦ã®ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®çµ‚äº†ã®ç¢ºèª
     * @return true å…¨ã¦çµ‚äº†ã—ã¦ã„ã‚‹
     * @return false çµ‚äº†ã—ã¦ã„ãªã„
     */
    isFinished() {
        // ------- å‡¦ç†ã‚’è¡Œã† -------
        // æ—¢ã«ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ãŒã‚ã‚Œã°çµ‚äº†ãƒ•ãƒ©ã‚°ã‚’ç«‹ã¦ã‚‹
        for (let i = 0; i < this._motions.length;) {
            let motionQueueEntry = this._motions[i];
            if (motionQueueEntry == null) {
                this._motions.splice(i, 1); // å‰Šé™¤
                continue;
            }
            const motion = motionQueueEntry._motion;
            if (motion == null) {
                motionQueueEntry.release();
                motionQueueEntry = null;
                this._motions.splice(i, 1); // å‰Šé™¤
                continue;
            }
            // ----- çµ‚äº†æ¸ˆã¿ã®å‡¦ç†ãŒã‚ã‚Œã°å‰Šé™¤ã™ã‚‹ ------
            if (!motionQueueEntry.isFinished()) {
                return false;
            }
            else {
                i++;
            }
        }
        return true;
    }
    /**
     * æŒ‡å®šã—ãŸãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®çµ‚äº†ã®ç¢ºèª
     * @param motionQueueEntryNumber ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®è­˜åˆ¥ç•ªå·
     * @return true å…¨ã¦çµ‚äº†ã—ã¦ã„ã‚‹
     * @return false çµ‚äº†ã—ã¦ã„ãªã„
     */
    isFinishedByHandle(motionQueueEntryNumber) {
        for (let i = 0; i < this._motions.length; i++) {
            const motionQueueEntry = this._motions[i];
            if (motionQueueEntry == null) {
                continue;
            }
            if (motionQueueEntry._motionQueueEntryHandle == motionQueueEntryNumber &&
                !motionQueueEntry.isFinished()) {
                return false;
            }
        }
        return true;
    }
    /**
     * å…¨ã¦ã®ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã‚’åœæ­¢ã™ã‚‹
     */
    stopAllMotions() {
        // ------- å‡¦ç†ã‚’è¡Œã† -------
        // æ—¢ã«ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ãŒã‚ã‚Œã°çµ‚äº†ãƒ•ãƒ©ã‚°ã‚’ç«‹ã¦ã‚‹
        for (let i = 0; i < this._motions.length; i++) {
            const motionQueueEntry = this._motions[i];
            if (motionQueueEntry == null) {
                this._motions.splice(i, 1); // å‰Šé™¤
                continue;
            }
            // ----- çµ‚äº†æ¸ˆã¿ã®å‡¦ç†ãŒã‚ã‚Œã°å‰Šé™¤ã™ã‚‹ ------
            motionQueueEntry.release();
            this._motions.splice(i, 1); // å‰Šé™¤
            continue;
        }
    }
    /**
     * @brief CubismMotionQueueEntryã®é…åˆ—ã®å–å¾—
     *
     * CubismMotionQueueEntryã®é…åˆ—ã‚’å–å¾—ã™ã‚‹ã€‚
     *
     * @return  CubismMotionQueueEntryã®é…åˆ—ã¸ã®ãƒã‚¤ãƒ³ã‚¿
     *          NULL   è¦‹ã¤ã‹ã‚‰ãªã‹ã£ãŸ
     */
    getCubismMotionQueueEntries() {
        return this._motions;
    }
    /**
     * æŒ‡å®šã—ãŸCubismMotionQueueEntryã®å–å¾—
  
     * @param   motionQueueEntryNumber  ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®è­˜åˆ¥ç•ªå·
     * @return  æŒ‡å®šã—ãŸCubismMotionQueueEntry
     * @return  null   è¦‹ã¤ã‹ã‚‰ãªã‹ã£ãŸ
     */
    getCubismMotionQueueEntry(motionQueueEntryNumber) {
        //------- å‡¦ç†ã‚’è¡Œã† -------
        for (let i = 0; i < this._motions.length; i++) {
            const motionQueueEntry = this._motions[i];
            if (motionQueueEntry == null) {
                continue;
            }
            if (motionQueueEntry._motionQueueEntryHandle == motionQueueEntryNumber) {
                return motionQueueEntry;
            }
        }
        return null;
    }
    /**
     * ã‚¤ãƒ™ãƒ³ãƒˆã‚’å—ã‘å–ã‚‹Callbackã®ç™»éŒ²
     *
     * @param callback ã‚³ãƒ¼ãƒ«ãƒãƒƒã‚¯é–¢æ•°
     * @param customData ã‚³ãƒ¼ãƒ«ãƒãƒƒã‚¯ã«è¿”ã•ã‚Œã‚‹ãƒ‡ãƒ¼ã‚¿
     */
    setEventCallback(callback, customData = null) {
        this._eventCallBack = callback;
        this._eventCustomData = customData;
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã‚’æ›´æ–°ã—ã¦ã€ãƒ¢ãƒ‡ãƒ«ã«ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿å€¤ã‚’åæ˜ ã™ã‚‹ã€‚
     *
     * @param   model   å¯¾è±¡ã®ãƒ¢ãƒ‡ãƒ«
     * @param   userTimeSeconds   ãƒ‡ãƒ«ã‚¿æ™‚é–“ã®ç©ç®—å€¤[ç§’]
     * @return  true    ãƒ¢ãƒ‡ãƒ«ã¸ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿å€¤ã®åæ˜ ã‚ã‚Š
     * @return  false   ãƒ¢ãƒ‡ãƒ«ã¸ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿å€¤ã®åæ˜ ãªã—(ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®å¤‰åŒ–ãªã—)
     */
    doUpdateMotion(model, userTimeSeconds) {
        let updated = false;
        // ------- å‡¦ç†ã‚’è¡Œã† --------
        // æ—¢ã«ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ãŒã‚ã‚Œã°çµ‚äº†ãƒ•ãƒ©ã‚°ã‚’ç«‹ã¦ã‚‹
        for (let i = 0; i < this._motions.length;) {
            let motionQueueEntry = this._motions[i];
            if (motionQueueEntry == null) {
                this._motions.splice(i, 1); // å‰Šé™¤
                continue;
            }
            const motion = motionQueueEntry._motion;
            if (motion == null) {
                motionQueueEntry.release();
                motionQueueEntry = null;
                this._motions.splice(i, 1); // å‰Šé™¤
                continue;
            }
            // ------ å€¤ã‚’åæ˜ ã™ã‚‹ ------
            motion.updateParameters(model, motionQueueEntry, userTimeSeconds);
            updated = true;
            // ------ ãƒ¦ãƒ¼ã‚¶ãƒˆãƒªã‚¬ãƒ¼ã‚¤ãƒ™ãƒ³ãƒˆã‚’æ¤œæŸ»ã™ã‚‹ ----
            const firedList = motion.getFiredEvent(motionQueueEntry.getLastCheckEventSeconds() -
                motionQueueEntry.getStartTime(), userTimeSeconds - motionQueueEntry.getStartTime());
            for (let i = 0; i < firedList.length; ++i) {
                this._eventCallBack(this, firedList[i], this._eventCustomData);
            }
            motionQueueEntry.setLastCheckEventSeconds(userTimeSeconds);
            // ------ çµ‚äº†æ¸ˆã¿ã®å‡¦ç†ãŒã‚ã‚Œã°å‰Šé™¤ã™ã‚‹ ------
            if (motionQueueEntry.isFinished()) {
                motionQueueEntry.release();
                motionQueueEntry = null;
                this._motions.splice(i, 1); // å‰Šé™¤
            }
            else {
                if (motionQueueEntry.isTriggeredFadeOut()) {
                    motionQueueEntry.startFadeOut(motionQueueEntry.getFadeOutSeconds(), userTimeSeconds);
                }
                i++;
            }
        }
        return updated;
    }
}
export const InvalidMotionQueueEntryHandleValue = -1;
// Namespace definition for compatibility.
import * as $ from './cubismmotionqueuemanager.js';
// eslint-disable-next-line @typescript-eslint/no-namespace
export var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    Live2DCubismFramework.CubismMotionQueueManager = $.CubismMotionQueueManager;
    Live2DCubismFramework.InvalidMotionQueueEntryHandleValue = $.InvalidMotionQueueEntryHandleValue;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));
//# sourceMappingURL=cubismmotionqueuemanager.js.map