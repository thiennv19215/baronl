/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
import { ACubismMotion } from './acubismmotion.js';
/**
 * CubismMotionQueueManagerã§å†ç”Ÿã—ã¦ã„ã‚‹å„ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®ç®¡ç†ã‚¯ãƒ©ã‚¹ã€‚
 */
export class CubismMotionQueueEntry {
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    constructor() {
        this._autoDelete = false;
        this._motion = null;
        this._available = true;
        this._finished = false;
        this._started = false;
        this._startTimeSeconds = -1.0;
        this._fadeInStartTimeSeconds = 0.0;
        this._endTimeSeconds = -1.0;
        this._stateTimeSeconds = 0.0;
        this._stateWeight = 0.0;
        this._lastEventCheckSeconds = 0.0;
        this._motionQueueEntryHandle = this;
        this._fadeOutSeconds = 0.0;
        this._isTriggeredFadeOut = false;
    }
    /**
     * ãƒ‡ã‚¹ãƒˆãƒ©ã‚¯ã‚¿ç›¸å½“ã®å‡¦ç†
     */
    release() {
        if (this._autoDelete && this._motion) {
            ACubismMotion.delete(this._motion); //
        }
    }
    /**
     * ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¢ã‚¦ãƒˆæ™‚é–“ã¨é–‹å§‹åˆ¤å®šã®è¨­å®š
     * @param fadeOutSeconds ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¢ã‚¦ãƒˆã«ã‹ã‹ã‚‹æ™‚é–“[ç§’]
     */
    setFadeOut(fadeOutSeconds) {
        this._fadeOutSeconds = fadeOutSeconds;
        this._isTriggeredFadeOut = true;
    }
    /**
     * ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¢ã‚¦ãƒˆã®é–‹å§‹
     * @param fadeOutSeconds ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¢ã‚¦ãƒˆã«ã‹ã‹ã‚‹æ™‚é–“[ç§’]
     * @param userTimeSeconds ãƒ‡ãƒ«ã‚¿æ™‚é–“ã®ç©ç®—å€¤[ç§’]
     */
    startFadeOut(fadeOutSeconds, userTimeSeconds) {
        const newEndTimeSeconds = userTimeSeconds + fadeOutSeconds;
        this._isTriggeredFadeOut = true;
        if (this._endTimeSeconds < 0.0 ||
            newEndTimeSeconds < this._endTimeSeconds) {
            this._endTimeSeconds = newEndTimeSeconds;
        }
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®çµ‚äº†ã®ç¢ºèª
     *
     * @return true ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ãŒçµ‚äº†ã—ãŸ
     * @return false çµ‚äº†ã—ã¦ã„ãªã„
     */
    isFinished() {
        return this._finished;
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®é–‹å§‹ã®ç¢ºèª
     * @return true ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ãŒé–‹å§‹ã—ãŸ
     * @return false é–‹å§‹ã—ã¦ã„ãªã„
     */
    isStarted() {
        return this._started;
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®é–‹å§‹æ™‚åˆ»ã®å–å¾—
     * @return ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®é–‹å§‹æ™‚åˆ»[ç§’]
     */
    getStartTime() {
        return this._startTimeSeconds;
    }
    /**
     * ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¤ãƒ³ã®é–‹å§‹æ™‚åˆ»ã®å–å¾—
     * @return ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¤ãƒ³ã®é–‹å§‹æ™‚åˆ»[ç§’]
     */
    getFadeInStartTime() {
        return this._fadeInStartTimeSeconds;
    }
    /**
     * ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¤ãƒ³ã®çµ‚äº†æ™‚åˆ»ã®å–å¾—
     * @return ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¤ãƒ³ã®çµ‚äº†æ™‚åˆ»ã®å–å¾—
     */
    getEndTime() {
        return this._endTimeSeconds;
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®é–‹å§‹æ™‚åˆ»ã®è¨­å®š
     * @param startTime ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®é–‹å§‹æ™‚åˆ»
     */
    setStartTime(startTime) {
        this._startTimeSeconds = startTime;
    }
    /**
     * ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¤ãƒ³ã®é–‹å§‹æ™‚åˆ»ã®è¨­å®š
     * @param startTime ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¤ãƒ³ã®é–‹å§‹æ™‚åˆ»[ç§’]
     */
    setFadeInStartTime(startTime) {
        this._fadeInStartTimeSeconds = startTime;
    }
    /**
     * ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¤ãƒ³ã®çµ‚äº†æ™‚åˆ»ã®è¨­å®š
     * @param endTime ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¤ãƒ³ã®çµ‚äº†æ™‚åˆ»[ç§’]
     */
    setEndTime(endTime) {
        this._endTimeSeconds = endTime;
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®çµ‚äº†ã®è¨­å®š
     * @param f trueãªã‚‰ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®çµ‚äº†
     */
    setIsFinished(f) {
        this._finished = f;
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³é–‹å§‹ã®è¨­å®š
     * @param f trueãªã‚‰ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®é–‹å§‹
     */
    setIsStarted(f) {
        this._started = f;
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®æœ‰åŠ¹æ€§ã®ç¢ºèª
     * @return true ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã¯æœ‰åŠ¹
     * @return false ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã¯ç„¡åŠ¹
     */
    isAvailable() {
        return this._available;
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®æœ‰åŠ¹æ€§ã®è¨­å®š
     * @param v trueãªã‚‰ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã¯æœ‰åŠ¹
     */
    setIsAvailable(v) {
        this._available = v;
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®çŠ¶æ…‹ã®è¨­å®š
     * @param timeSeconds ç¾åœ¨æ™‚åˆ»[ç§’]
     * @param weight ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³å°¾é‡ã¿
     */
    setState(timeSeconds, weight) {
        this._stateTimeSeconds = timeSeconds;
        this._stateWeight = weight;
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®ç¾åœ¨æ™‚åˆ»ã®å–å¾—
     * @return ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®ç¾åœ¨æ™‚åˆ»[ç§’]
     */
    getStateTime() {
        return this._stateTimeSeconds;
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®é‡ã¿ã®å–å¾—
     * @return ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®é‡ã¿
     */
    getStateWeight() {
        return this._stateWeight;
    }
    /**
     * æœ€å¾Œã«ã‚¤ãƒ™ãƒ³ãƒˆã®ç™ºç«ã‚’ãƒã‚§ãƒƒã‚¯ã—ãŸæ™‚é–“ã‚’å–å¾—
     *
     * @return æœ€å¾Œã«ã‚¤ãƒ™ãƒ³ãƒˆã®ç™ºç«ã‚’ãƒã‚§ãƒƒã‚¯ã—ãŸæ™‚é–“[ç§’]
     */
    getLastCheckEventSeconds() {
        return this._lastEventCheckSeconds;
    }
    /**
     * æœ€å¾Œã«ã‚¤ãƒ™ãƒ³ãƒˆã‚’ãƒã‚§ãƒƒã‚¯ã—ãŸæ™‚é–“ã‚’è¨­å®š
     * @param checkSeconds æœ€å¾Œã«ã‚¤ãƒ™ãƒ³ãƒˆã‚’ãƒã‚§ãƒƒã‚¯ã—ãŸæ™‚é–“[ç§’]
     */
    setLastCheckEventSeconds(checkSeconds) {
        this._lastEventCheckSeconds = checkSeconds;
    }
    /**
     * ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¢ã‚¦ãƒˆé–‹å§‹åˆ¤å®šã®å–å¾—
     * @return ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¢ã‚¦ãƒˆé–‹å§‹ã™ã‚‹ã‹ã©ã†ã‹
     */
    isTriggeredFadeOut() {
        return this._isTriggeredFadeOut;
    }
    /**
     * ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¢ã‚¦ãƒˆæ™‚é–“ã®å–å¾—
     * @return ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¢ã‚¦ãƒˆæ™‚é–“[ç§’]
     */
    getFadeOutSeconds() {
        return this._fadeOutSeconds;
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®å–å¾—
     *
     * @return ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³
     */
    getCubismMotion() {
        return this._motion;
    }
}
// Namespace definition for compatibility.
import * as $ from './cubismmotionqueueentry.js';
// eslint-disable-next-line @typescript-eslint/no-namespace
export var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    Live2DCubismFramework.CubismMotionQueueEntry = $.CubismMotionQueueEntry;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));
//# sourceMappingURL=cubismmotionqueueentry.js.map