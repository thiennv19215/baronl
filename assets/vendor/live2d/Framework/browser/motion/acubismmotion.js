/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
import { CubismMath } from '../math/cubismmath.js';
import { CSM_ASSERT, CubismDebug } from '../utils/cubismdebug.js';
/**
 * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®æŠ½è±¡åŸºåº•ã‚¯ãƒ©ã‚¹
 *
 * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®æŠ½è±¡åŸºåº•ã‚¯ãƒ©ã‚¹ã€‚MotionQueueManagerã«ã‚ˆã£ã¦ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®å†ç”Ÿã‚’ç®¡ç†ã™ã‚‹ã€‚
 */
export class ACubismMotion {
    /**
     * ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹ã®ç ´æ£„
     */
    static delete(motion) {
        motion.release();
        motion = null;
    }
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    constructor() {
        /**
         * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³å†ç”Ÿé–‹å§‹ã‚³ãƒ¼ãƒ«ãƒãƒƒã‚¯ã®ç™»éŒ²
         *
         * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³å†ç”Ÿé–‹å§‹ã‚³ãƒ¼ãƒ«ãƒãƒƒã‚¯ã‚’ç™»éŒ²ã™ã‚‹ã€‚
         * ä»¥ä¸‹ã®çŠ¶æ…‹ã®éš›ã«ã¯å‘¼ã³å‡ºã•ã‚Œãªã„:
         *   1. å†ç”Ÿä¸­ã®ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ãŒã€Œãƒ«ãƒ¼ãƒ—ã€ã¨ã—ã¦è¨­å®šã•ã‚Œã¦ã„ã‚‹ã¨ã
         *   2. ã‚³ãƒ¼ãƒ«ãƒãƒƒã‚¯ãŒç™»éŒ²ã•ã‚Œã¦ã„ãªã„æ™‚
         *
         * @param onBeganMotionHandler ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³å†ç”Ÿé–‹å§‹ã‚³ãƒ¼ãƒ«ãƒãƒƒã‚¯é–¢æ•°
         */
        this.setBeganMotionHandler = (onBeganMotionHandler) => (this._onBeganMotion = onBeganMotionHandler);
        /**
         * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³å†ç”Ÿé–‹å§‹ã‚³ãƒ¼ãƒ«ãƒãƒƒã‚¯ã®å–å¾—
         *
         * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³å†ç”Ÿé–‹å§‹ã‚³ãƒ¼ãƒ«ãƒãƒƒã‚¯ã‚’å–å¾—ã™ã‚‹ã€‚
         *
         * @return ç™»éŒ²ã•ã‚Œã¦ã„ã‚‹ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³å†ç”Ÿé–‹å§‹ã‚³ãƒ¼ãƒ«ãƒãƒƒã‚¯é–¢æ•°
         */
        this.getBeganMotionHandler = () => this._onBeganMotion;
        /**
         * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³å†ç”Ÿçµ‚äº†ã‚³ãƒ¼ãƒ«ãƒãƒƒã‚¯ã®ç™»éŒ²
         *
         * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³å†ç”Ÿçµ‚äº†ã‚³ãƒ¼ãƒ«ãƒãƒƒã‚¯ã‚’ç™»éŒ²ã™ã‚‹ã€‚
         * isFinishedãƒ•ãƒ©ã‚°ã‚’è¨­å®šã™ã‚‹ã‚¿ã‚¤ãƒŸãƒ³ã‚°ã§å‘¼ã³å‡ºã•ã‚Œã‚‹ã€‚
         * ä»¥ä¸‹ã®çŠ¶æ…‹ã®éš›ã«ã¯å‘¼ã³å‡ºã•ã‚Œãªã„:
         *   1. å†ç”Ÿä¸­ã®ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ãŒã€Œãƒ«ãƒ¼ãƒ—ã€ã¨ã—ã¦è¨­å®šã•ã‚Œã¦ã„ã‚‹ã¨ã
         *   2. ã‚³ãƒ¼ãƒ«ãƒãƒƒã‚¯ãŒç™»éŒ²ã•ã‚Œã¦ã„ãªã„æ™‚
         *
         * @param onFinishedMotionHandler ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³å†ç”Ÿçµ‚äº†ã‚³ãƒ¼ãƒ«ãƒãƒƒã‚¯é–¢æ•°
         */
        this.setFinishedMotionHandler = (onFinishedMotionHandler) => (this._onFinishedMotion = onFinishedMotionHandler);
        /**
         * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³å†ç”Ÿçµ‚äº†ã‚³ãƒ¼ãƒ«ãƒãƒƒã‚¯ã®å–å¾—
         *
         * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³å†ç”Ÿçµ‚äº†ã‚³ãƒ¼ãƒ«ãƒãƒƒã‚¯ã‚’å–å¾—ã™ã‚‹ã€‚
         *
         * @return ç™»éŒ²ã•ã‚Œã¦ã„ã‚‹ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³å†ç”Ÿçµ‚äº†ã‚³ãƒ¼ãƒ«ãƒãƒƒã‚¯é–¢æ•°
         */
        this.getFinishedMotionHandler = () => this._onFinishedMotion;
        this._fadeInSeconds = -1.0;
        this._fadeOutSeconds = -1.0;
        this._weight = 1.0;
        this._offsetSeconds = 0.0; // å†ç”Ÿã®é–‹å§‹æ™‚åˆ»
        this._isLoop = false; // ãƒ«ãƒ¼ãƒ—ã™ã‚‹ã‹
        this._isLoopFadeIn = true; // ãƒ«ãƒ¼ãƒ—æ™‚ã«ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¤ãƒ³ãŒæœ‰åŠ¹ã‹ã©ã†ã‹ã®ãƒ•ãƒ©ã‚°ã€‚åˆæœŸå€¤ã§ã¯æœ‰åŠ¹ã€‚
        this._previousLoopState = this._isLoop;
        this._firedEventValues = new Array();
    }
    /**
     * ãƒ‡ã‚¹ãƒˆãƒ©ã‚¯ã‚¿ç›¸å½“ã®å‡¦ç†
     */
    release() {
        this._weight = 0.0;
    }
    /**
     * ãƒ¢ãƒ‡ãƒ«ã®ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿
     * @param model å¯¾è±¡ã®ãƒ¢ãƒ‡ãƒ«
     * @param motionQueueEntry CubismMotionQueueManagerã§ç®¡ç†ã•ã‚Œã¦ã„ã‚‹ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³
     * @param userTimeSeconds ãƒ‡ãƒ«ã‚¿æ™‚é–“ã®ç©ç®—å€¤[ç§’]
     */
    updateParameters(model, motionQueueEntry, userTimeSeconds) {
        if (!motionQueueEntry.isAvailable() || motionQueueEntry.isFinished()) {
            return;
        }
        this.setupMotionQueueEntry(motionQueueEntry, userTimeSeconds);
        const fadeWeight = this.updateFadeWeight(motionQueueEntry, userTimeSeconds);
        //---- å…¨ã¦ã®ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿IDã‚’ãƒ«ãƒ¼ãƒ—ã™ã‚‹ ----
        this.doUpdateParameters(model, userTimeSeconds, fadeWeight, motionQueueEntry);
        // å¾Œå‡¦ç†
        // çµ‚äº†æ™‚åˆ»ã‚’éŽãŽãŸã‚‰çµ‚äº†ãƒ•ãƒ©ã‚°ã‚’ç«‹ã¦ã‚‹(CubismMotionQueueManager)
        if (motionQueueEntry.getEndTime() > 0 &&
            motionQueueEntry.getEndTime() < userTimeSeconds) {
            motionQueueEntry.setIsFinished(true); // çµ‚äº†
        }
    }
    /**
     * @brief ãƒ¢ãƒ‡ãƒ«ã®å†ç”Ÿé–‹å§‹å‡¦ç†
     *
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®å†ç”Ÿã‚’é–‹å§‹ã™ã‚‹ãŸã‚ã®ã‚»ãƒƒãƒˆã‚¢ãƒƒãƒ—ã‚’è¡Œã†ã€‚
     *
     * @param[in]   motionQueueEntry    CubismMotionQueueManagerã§ç®¡ç†ã•ã‚Œã¦ã„ã‚‹ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³
     * @param[in]   userTimeSeconds     ãƒ‡ãƒ«ã‚¿æ™‚é–“ã®ç©ç®—å€¤[ç§’]
     */
    setupMotionQueueEntry(motionQueueEntry, userTimeSeconds) {
        if (motionQueueEntry == null || motionQueueEntry.isStarted()) {
            return;
        }
        if (!motionQueueEntry.isAvailable()) {
            return;
        }
        motionQueueEntry.setIsStarted(true);
        motionQueueEntry.setStartTime(userTimeSeconds - this._offsetSeconds); // ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®é–‹å§‹æ™‚åˆ»ã‚’è¨˜éŒ²
        motionQueueEntry.setFadeInStartTime(userTimeSeconds); // ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¤ãƒ³ã®é–‹å§‹æ™‚åˆ»
        if (motionQueueEntry.getEndTime() < 0.0) {
            // é–‹å§‹ã—ã¦ã„ãªã„ã†ã¡ã«çµ‚äº†è¨­å®šã—ã¦ã„ã‚‹å ´åˆãŒã‚ã‚‹
            this.adjustEndTime(motionQueueEntry);
        }
        // å†ç”Ÿé–‹å§‹ã‚³ãƒ¼ãƒ«ãƒãƒƒã‚¯
        if (motionQueueEntry._motion._onBeganMotion) {
            motionQueueEntry._motion._onBeganMotion(motionQueueEntry._motion);
        }
    }
    /**
     * @brief ãƒ¢ãƒ‡ãƒ«ã®ã‚¦ã‚§ã‚¤ãƒˆæ›´æ–°
     *
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®ã‚¦ã‚§ã‚¤ãƒˆã‚’æ›´æ–°ã™ã‚‹ã€‚
     *
     * @param[in]   motionQueueEntry    CubismMotionQueueManagerã§ç®¡ç†ã•ã‚Œã¦ã„ã‚‹ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³
     * @param[in]   userTimeSeconds     ãƒ‡ãƒ«ã‚¿æ™‚é–“ã®ç©ç®—å€¤[ç§’]
     */
    updateFadeWeight(motionQueueEntry, userTimeSeconds) {
        if (motionQueueEntry == null) {
            CubismDebug.print(LogLevel.LogLevel_Error, 'motionQueueEntry is null.');
        }
        let fadeWeight = this._weight; // ç¾åœ¨ã®å€¤ã¨æŽ›ã‘åˆã‚ã›ã‚‹å‰²åˆ
        //---- ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¤ãƒ³ãƒ»ã‚¢ã‚¦ãƒˆã®å‡¦ç† ----
        // å˜ç´”ãªã‚µã‚¤ãƒ³é–¢æ•°ã§ã‚¤ãƒ¼ã‚¸ãƒ³ã‚°ã™ã‚‹
        const fadeIn = this._fadeInSeconds == 0.0
            ? 1.0
            : CubismMath.getEasingSine((userTimeSeconds - motionQueueEntry.getFadeInStartTime()) /
                this._fadeInSeconds);
        const fadeOut = this._fadeOutSeconds == 0.0 || motionQueueEntry.getEndTime() < 0.0
            ? 1.0
            : CubismMath.getEasingSine((motionQueueEntry.getEndTime() - userTimeSeconds) /
                this._fadeOutSeconds);
        fadeWeight = fadeWeight * fadeIn * fadeOut;
        motionQueueEntry.setState(userTimeSeconds, fadeWeight);
        CSM_ASSERT(0.0 <= fadeWeight && fadeWeight <= 1.0);
        return fadeWeight;
    }
    /**
     * ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¤ãƒ³ã®æ™‚é–“ã‚’è¨­å®šã™ã‚‹
     * @param fadeInSeconds ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¤ãƒ³ã«ã‹ã‹ã‚‹æ™‚é–“[ç§’]
     */
    setFadeInTime(fadeInSeconds) {
        this._fadeInSeconds = fadeInSeconds;
    }
    /**
     * ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¢ã‚¦ãƒˆã®æ™‚é–“ã‚’è¨­å®šã™ã‚‹
     * @param fadeOutSeconds ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¢ã‚¦ãƒˆã«ã‹ã‹ã‚‹æ™‚é–“[ç§’]
     */
    setFadeOutTime(fadeOutSeconds) {
        this._fadeOutSeconds = fadeOutSeconds;
    }
    /**
     * ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¢ã‚¦ãƒˆã«ã‹ã‹ã‚‹æ™‚é–“ã®å–å¾—
     * @return ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¢ã‚¦ãƒˆã«ã‹ã‹ã‚‹æ™‚é–“[ç§’]
     */
    getFadeOutTime() {
        return this._fadeOutSeconds;
    }
    /**
     * ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¤ãƒ³ã«ã‹ã‹ã‚‹æ™‚é–“ã®å–å¾—
     * @return ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¤ãƒ³ã«ã‹ã‹ã‚‹æ™‚é–“[ç§’]
     */
    getFadeInTime() {
        return this._fadeInSeconds;
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³é©ç”¨ã®é‡ã¿ã®è¨­å®š
     * @param weight é‡ã¿ï¼ˆ0.0 - 1.0ï¼‰
     */
    setWeight(weight) {
        this._weight = weight;
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³é©ç”¨ã®é‡ã¿ã®å–å¾—
     * @return é‡ã¿ï¼ˆ0.0 - 1.0ï¼‰
     */
    getWeight() {
        return this._weight;
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®é•·ã•ã®å–å¾—
     * @return ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®é•·ã•[ç§’]
     *
     * @note ãƒ«ãƒ¼ãƒ—ã®æ™‚ã¯ã€Œ-1ã€ã€‚
     *       ãƒ«ãƒ¼ãƒ—ã§ãªã„å ´åˆã¯ã€ã‚ªãƒ¼ãƒãƒ¼ãƒ©ã‚¤ãƒ‰ã™ã‚‹ã€‚
     *       æ­£ã®å€¤ã®æ™‚ã¯å–å¾—ã•ã‚Œã‚‹æ™‚é–“ã§çµ‚äº†ã™ã‚‹ã€‚
     *       ã€Œ-1ã€ã®æ™‚ã¯å¤–éƒ¨ã‹ã‚‰åœæ­¢å‘½ä»¤ãŒãªã„é™ã‚Šçµ‚ã‚ã‚‰ãªã„å‡¦ç†ã¨ãªã‚‹ã€‚
     */
    getDuration() {
        return -1.0;
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®ãƒ«ãƒ¼ãƒ—1å›žåˆ†ã®é•·ã•ã®å–å¾—
     * @return ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®ãƒ«ãƒ¼ãƒ—ä¸€å›žåˆ†ã®é•·ã•[ç§’]
     *
     * @note ãƒ«ãƒ¼ãƒ—ã—ãªã„å ´åˆã¯ã€getDuration()ã¨åŒã˜å€¤ã‚’è¿”ã™
     *       ãƒ«ãƒ¼ãƒ—ä¸€å›žåˆ†ã®é•·ã•ãŒå®šç¾©ã§ããªã„å ´åˆ(ãƒ—ãƒ­ã‚°ãƒ©ãƒ çš„ã«å‹•ãç¶šã‘ã‚‹ã‚µãƒ–ã‚¯ãƒ©ã‚¹ãªã©)ã®å ´åˆã¯ã€Œ-1ã€ã‚’è¿”ã™
     */
    getLoopDuration() {
        return -1.0;
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³å†ç”Ÿã®é–‹å§‹æ™‚åˆ»ã®è¨­å®š
     * @param offsetSeconds ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³å†ç”Ÿã®é–‹å§‹æ™‚åˆ»[ç§’]
     */
    setOffsetTime(offsetSeconds) {
        this._offsetSeconds = offsetSeconds;
    }
    /**
     * ãƒ«ãƒ¼ãƒ—æƒ…å ±ã®è¨­å®š
     * @param loop ãƒ«ãƒ¼ãƒ—æƒ…å ±
     */
    setLoop(loop) {
        this._isLoop = loop;
    }
    /**
     * ãƒ«ãƒ¼ãƒ—æƒ…å ±ã®å–å¾—
     * @return true ãƒ«ãƒ¼ãƒ—ã™ã‚‹
     * @return false ãƒ«ãƒ¼ãƒ—ã—ãªã„
     */
    getLoop() {
        return this._isLoop;
    }
    /**
     * ãƒ«ãƒ¼ãƒ—æ™‚ã®ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¤ãƒ³æƒ…å ±ã®è¨­å®š
     * @param loopFadeIn  ãƒ«ãƒ¼ãƒ—æ™‚ã®ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¤ãƒ³æƒ…å ±
     */
    setLoopFadeIn(loopFadeIn) {
        this._isLoopFadeIn = loopFadeIn;
    }
    /**
     * ãƒ«ãƒ¼ãƒ—æ™‚ã®ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¤ãƒ³æƒ…å ±ã®å–å¾—
     *
     * @return  true    ã™ã‚‹
     * @return  false   ã—ãªã„
     */
    getLoopFadeIn() {
        return this._isLoopFadeIn;
    }
    /**
     * ãƒ¢ãƒ‡ãƒ«ã®ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿æ›´æ–°
     *
     * ã‚¤ãƒ™ãƒ³ãƒˆç™ºç«ã®ãƒã‚§ãƒƒã‚¯ã€‚
     * å…¥åŠ›ã™ã‚‹æ™‚é–“ã¯å‘¼ã°ã‚Œã‚‹ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã‚¿ã‚¤ãƒŸãƒ³ã‚°ã‚’ï¼ã¨ã—ãŸç§’æ•°ã§è¡Œã†ã€‚
     *
     * @param beforeCheckTimeSeconds å‰å›žã®ã‚¤ãƒ™ãƒ³ãƒˆãƒã‚§ãƒƒã‚¯æ™‚é–“[ç§’]
     * @param motionTimeSeconds ä»Šå›žã®å†ç”Ÿæ™‚é–“[ç§’]
     */
    getFiredEvent(beforeCheckTimeSeconds, motionTimeSeconds) {
        return this._firedEventValues;
    }
    /**
     * é€æ˜Žåº¦ã®ã‚«ãƒ¼ãƒ–ãŒå­˜åœ¨ã™ã‚‹ã‹ã©ã†ã‹ã‚’ç¢ºèªã™ã‚‹
     *
     * @return true  -> ã‚­ãƒ¼ãŒå­˜åœ¨ã™ã‚‹
     *          false -> ã‚­ãƒ¼ãŒå­˜åœ¨ã—ãªã„
     */
    isExistModelOpacity() {
        return false;
    }
    /**
     * é€æ˜Žåº¦ã®ã‚«ãƒ¼ãƒ–ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ã‚’è¿”ã™
     *
     * @return success:é€æ˜Žåº¦ã®ã‚«ãƒ¼ãƒ–ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     */
    getModelOpacityIndex() {
        return -1;
    }
    /**
     * é€æ˜Žåº¦ã®Idã‚’è¿”ã™
     *
     * @param index ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã‚«ãƒ¼ãƒ–ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return success:é€æ˜Žåº¦ã®Id
     */
    getModelOpacityId(index) {
        return null;
    }
    /**
     * æŒ‡å®šæ™‚é–“ã®é€æ˜Žåº¦ã®å€¤ã‚’è¿”ã™
     *
     * @return success:ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®ç¾åœ¨æ™‚é–“ã«ãŠã‘ã‚‹Opacityã®å€¤
     *
     * @note  æ›´æ–°å¾Œã®å€¤ã‚’å–ã‚‹ã«ã¯UpdateParameters() ã®å¾Œã«å‘¼ã³å‡ºã™ã€‚
     */
    getModelOpacityValue() {
        return 1.0;
    }
    /**
     * çµ‚äº†æ™‚åˆ»ã®èª¿æ•´
     * @param motionQueueEntry CubismMotionQueueManagerã§ç®¡ç†ã•ã‚Œã¦ã„ã‚‹ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³
     */
    adjustEndTime(motionQueueEntry) {
        const duration = this.getDuration();
        // duration == -1 ã®å ´åˆã¯ãƒ«ãƒ¼ãƒ—ã™ã‚‹
        const endTime = duration <= 0.0 ? -1 : motionQueueEntry.getStartTime() + duration;
        motionQueueEntry.setEndTime(endTime);
    }
}
// Namespace definition for compatibility.
import * as $ from './acubismmotion.js';
import { LogLevel } from '../live2dcubismframework.js';
// eslint-disable-next-line @typescript-eslint/no-namespace
export var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    Live2DCubismFramework.ACubismMotion = $.ACubismMotion;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));
//# sourceMappingURL=acubismmotion.js.map