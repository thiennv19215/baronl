/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
import { CubismIdManager } from './id/cubismidmanager.js';
import { CubismRenderer } from './rendering/cubismrenderer.js';
import { CSM_ASSERT, CubismLogInfo, CubismLogWarning } from './utils/cubismdebug.js';
import { Value } from './utils/cubismjson.js';
export function strtod(s, endPtr) {
    let index = 0;
    for (let i = 1;; i++) {
        const testC = s.slice(i - 1, i);
        // æŒ‡æ•°ãƒ»ãƒžã‚¤ãƒŠã‚¹ã®å¯èƒ½æ€§ãŒã‚ã‚‹ã®ã§ã‚¹ã‚­ãƒƒãƒ—ã™ã‚‹
        if (testC == 'e' || testC == '-' || testC == 'E') {
            continue;
        } // æ–‡å­—åˆ—ã®ç¯„å›²ã‚’åºƒã’ã¦ã„ã
        const test = s.substring(0, i);
        const number = Number(test);
        if (isNaN(number)) {
            // æ•°å€¤ã¨ã—ã¦èªè­˜ã§ããªããªã£ãŸã®ã§çµ‚äº†
            break;
        } // æœ€å¾Œã«æ•°å€¤ã¨ã—ã¦ã§ããŸindexã‚’æ ¼ç´ã—ã¦ãŠã
        index = i;
    }
    let d = parseFloat(s); // ãƒ‘ãƒ¼ã‚¹ã—ãŸæ•°å€¤
    if (isNaN(d)) {
        // æ•°å€¤ã¨ã—ã¦èªè­˜ã§ããªããªã£ãŸã®ã§çµ‚äº†
        d = NaN;
    }
    endPtr[0] = s.slice(index); // å¾Œç¶šã®æ–‡å­—åˆ—
    return d;
}
// ãƒ•ã‚¡ã‚¤ãƒ«ã‚¹ã‚³ãƒ¼ãƒ—ã®å¤‰æ•°ã‚’åˆæœŸåŒ–
let s_isStarted = false;
let s_isInitialized = false;
let s_option = null;
let s_cubismIdManager = null;
/**
 * Frameworkå†…ã§ä½¿ã†å®šæ•°ã®å®£è¨€
 */
export const Constant = Object.freeze({
    vertexOffset: 0, // ãƒ¡ãƒƒã‚·ãƒ¥é ‚ç‚¹ã®ã‚ªãƒ•ã‚»ãƒƒãƒˆå€¤
    vertexStep: 2 // ãƒ¡ãƒƒã‚·ãƒ¥é ‚ç‚¹ã®ã‚¹ãƒ†ãƒƒãƒ—å€¤
});
export function csmDelete(address) {
    if (!address) {
        return;
    }
    address = void 0;
}
/**
 * Live2D Cubism SDK Original Workflow SDKã®ã‚¨ãƒ³ãƒˆãƒªãƒã‚¤ãƒ³ãƒˆ
 * åˆ©ç”¨é–‹å§‹æ™‚ã¯CubismFramework.initialize()ã‚’å‘¼ã³ã€CubismFramework.dispose()ã§çµ‚äº†ã™ã‚‹ã€‚
 */
export class CubismFramework {
    /**
     * Cubism Frameworkã®APIã‚’ä½¿ç”¨å¯èƒ½ã«ã™ã‚‹ã€‚
     *  APIã‚’å®Ÿè¡Œã™ã‚‹å‰ã«å¿…ãšã“ã®é–¢æ•°ã‚’å®Ÿè¡Œã™ã‚‹ã“ã¨ã€‚
     *  ä¸€åº¦æº–å‚™ãŒå®Œäº†ã—ã¦ä»¥é™ã¯ã€å†ã³å®Ÿè¡Œã—ã¦ã‚‚å†…éƒ¨å‡¦ç†ãŒã‚¹ã‚­ãƒƒãƒ—ã•ã‚Œã¾ã™ã€‚
     *
     * @param    option      Optionã‚¯ãƒ©ã‚¹ã®ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹
     *
     * @return   æº–å‚™å‡¦ç†ãŒå®Œäº†ã—ãŸã‚‰trueãŒè¿”ã‚Šã¾ã™ã€‚
     */
    static startUp(option = null) {
        if (s_isStarted) {
            CubismLogInfo('CubismFramework.startUp() is already done.');
            return s_isStarted;
        }
        s_option = option;
        if (s_option != null) {
            Live2DCubismCore.Logging.csmSetLogFunction(s_option.logFunction);
        }
        s_isStarted = true;
        // Live2D Cubism Coreãƒãƒ¼ã‚¸ãƒ§ãƒ³æƒ…å ±ã‚’è¡¨ç¤º
        if (s_isStarted) {
            const version = Live2DCubismCore.Version.csmGetVersion();
            const major = (version & 0xff000000) >> 24;
            const minor = (version & 0x00ff0000) >> 16;
            const patch = version & 0x0000ffff;
            const versionNumber = version;
            CubismLogInfo(`Live2D Cubism Core version: {0}.{1}.{2} ({3})`, ('00' + major).slice(-2), ('00' + minor).slice(-2), ('0000' + patch).slice(-4), versionNumber);
        }
        CubismLogInfo('CubismFramework.startUp() is complete.');
        return s_isStarted;
    }
    /**
     * StartUp()ã§åˆæœŸåŒ–ã—ãŸCubismFrameworkã®å„ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã‚’ã‚¯ãƒªã‚¢ã—ã¾ã™ã€‚
     * Dispose()ã—ãŸCubismFrameworkã‚’å†åˆ©ç”¨ã™ã‚‹éš›ã«åˆ©ç”¨ã—ã¦ãã ã•ã„ã€‚
     */
    static cleanUp() {
        s_isStarted = false;
        s_isInitialized = false;
        s_option = null;
        s_cubismIdManager = null;
    }
    /**
     * Cubism Frameworkå†…ã®ãƒªã‚½ãƒ¼ã‚¹ã‚’åˆæœŸåŒ–ã—ã¦ãƒ¢ãƒ‡ãƒ«ã‚’è¡¨ç¤ºå¯èƒ½ãªçŠ¶æ…‹ã«ã—ã¾ã™ã€‚<br>
     *     å†åº¦Initialize()ã™ã‚‹ã«ã¯å…ˆã«Dispose()ã‚’å®Ÿè¡Œã™ã‚‹å¿…è¦ãŒã‚ã‚Šã¾ã™ã€‚
     *
     * @param memorySize åˆæœŸåŒ–æ™‚ãƒ¡ãƒ¢ãƒªé‡ [byte(s)]
     *    è¤‡æ•°ãƒ¢ãƒ‡ãƒ«è¡¨ç¤ºæ™‚ãªã©ã«ãƒ¢ãƒ‡ãƒ«ãŒæ›´æ–°ã•ã‚Œãªã„éš›ã«ä½¿ç”¨ã—ã¦ãã ã•ã„ã€‚
     *    æŒ‡å®šã™ã‚‹éš›ã¯å¿…ãš1024*1024*16 byte(16MB)ä»¥ä¸Šã®å€¤ã‚’æŒ‡å®šã—ã¦ãã ã•ã„ã€‚
     *    ãã‚Œä»¥å¤–ã¯ã™ã¹ã¦1024*1024*16 byteã«ä¸¸ã‚ã¾ã™ã€‚
     */
    static initialize(memorySize = 0) {
        CSM_ASSERT(s_isStarted);
        if (!s_isStarted) {
            CubismLogWarning('CubismFramework is not started.');
            return;
        }
        // --- s_isInitializedã«ã‚ˆã‚‹é€£ç¶šåˆæœŸåŒ–ã‚¬ãƒ¼ãƒ‰ ---
        // é€£ç¶šã—ã¦ãƒªã‚½ãƒ¼ã‚¹ç¢ºä¿ãŒè¡Œã‚ã‚Œãªã„ã‚ˆã†ã«ã™ã‚‹ã€‚
        // å†åº¦Initialize()ã™ã‚‹ã«ã¯å…ˆã«Dispose()ã‚’å®Ÿè¡Œã™ã‚‹å¿…è¦ãŒã‚ã‚‹ã€‚
        if (s_isInitialized) {
            CubismLogWarning('CubismFramework.initialize() skipped, already initialized.');
            return;
        }
        //---- static åˆæœŸåŒ– ----
        Value.staticInitializeNotForClientCall();
        s_cubismIdManager = new CubismIdManager();
        // --- HACK: åˆæœŸåŒ–æ™‚ãƒ¡ãƒ¢ãƒªé‡ã®æ‹¡å¼µ(å˜ä½byte) ---
        // è¤‡æ•°ãƒ¢ãƒ‡ãƒ«è¡¨ç¤ºæ™‚ãªã©ã«ãƒ¢ãƒ‡ãƒ«ãŒæ›´æ–°ã•ã‚Œãªã„éš›ã«ä½¿ç”¨ã—ã¦ãã ã•ã„ã€‚
        // æŒ‡å®šã™ã‚‹éš›ã¯å¿…ãš1024*1024*16 byte(16MB)ä»¥ä¸Šã®å€¤ã‚’æŒ‡å®šã—ã¦ãã ã•ã„ã€‚
        // ãã‚Œä»¥å¤–ã¯ã™ã¹ã¦1024*1024*16 byteã«ä¸¸ã‚ã¾ã™ã€‚
        Live2DCubismCore.Memory.initializeAmountOfMemory(memorySize);
        s_isInitialized = true;
        CubismLogInfo('CubismFramework.initialize() is complete.');
    }
    /**
     * Cubism Frameworkå†…ã®å…¨ã¦ã®ãƒªã‚½ãƒ¼ã‚¹ã‚’è§£æ”¾ã—ã¾ã™ã€‚
     *      ãŸã ã—ã€å¤–éƒ¨ã§ç¢ºä¿ã•ã‚ŒãŸãƒªã‚½ãƒ¼ã‚¹ã«ã¤ã„ã¦ã¯è§£æ”¾ã—ã¾ã›ã‚“ã€‚
     *      å¤–éƒ¨ã§é©åˆ‡ã«ç ´æ£„ã™ã‚‹å¿…è¦ãŒã‚ã‚Šã¾ã™ã€‚
     */
    static dispose() {
        CSM_ASSERT(s_isStarted);
        if (!s_isStarted) {
            CubismLogWarning('CubismFramework is not started.');
            return;
        }
        // --- s_isInitializedã«ã‚ˆã‚‹æœªåˆæœŸåŒ–è§£æ”¾ã‚¬ãƒ¼ãƒ‰ ---
        // dispose()ã™ã‚‹ã«ã¯å…ˆã«initialize()ã‚’å®Ÿè¡Œã™ã‚‹å¿…è¦ãŒã‚ã‚‹ã€‚
        if (!s_isInitialized) {
            // false...ãƒªã‚½ãƒ¼ã‚¹æœªç¢ºä¿ã®å ´åˆ
            CubismLogWarning('CubismFramework.dispose() skipped, not initialized.');
            return;
        }
        Value.staticReleaseNotForClientCall();
        s_cubismIdManager.release();
        s_cubismIdManager = null;
        // ãƒ¬ãƒ³ãƒ€ãƒ©ã®é™çš„ãƒªã‚½ãƒ¼ã‚¹ï¼ˆã‚·ã‚§ãƒ¼ãƒ€ãƒ—ãƒ­ã‚°ãƒ©ãƒ ä»–ï¼‰ã‚’è§£æ”¾ã™ã‚‹
        CubismRenderer.staticRelease();
        s_isInitialized = false;
        CubismLogInfo('CubismFramework.dispose() is complete.');
    }
    /**
     * Cubism Frameworkã®APIã‚’ä½¿ç”¨ã™ã‚‹æº–å‚™ãŒå®Œäº†ã—ãŸã‹ã©ã†ã‹
     * @return APIã‚’ä½¿ç”¨ã™ã‚‹æº–å‚™ãŒå®Œäº†ã—ã¦ã„ã‚Œã°trueãŒè¿”ã‚Šã¾ã™ã€‚
     */
    static isStarted() {
        return s_isStarted;
    }
    /**
     * Cubism Frameworkã®ãƒªã‚½ãƒ¼ã‚¹åˆæœŸåŒ–ãŒã™ã§ã«è¡Œã‚ã‚Œã¦ã„ã‚‹ã‹ã©ã†ã‹
     * @return ãƒªã‚½ãƒ¼ã‚¹ç¢ºä¿ãŒå®Œäº†ã—ã¦ã„ã‚Œã°trueãŒè¿”ã‚Šã¾ã™
     */
    static isInitialized() {
        return s_isInitialized;
    }
    /**
     * Core APIã«ãƒã‚¤ãƒ³ãƒ‰ã—ãŸãƒ­ã‚°é–¢æ•°ã‚’å®Ÿè¡Œã™ã‚‹
     *
     * @praram message ãƒ­ã‚°ãƒ¡ãƒƒã‚»ãƒ¼ã‚¸
     */
    static coreLogFunction(message) {
        // Return if logging not possible.
        if (!Live2DCubismCore.Logging.csmGetLogFunction()) {
            return;
        }
        Live2DCubismCore.Logging.csmGetLogFunction()(message);
    }
    /**
     * ç¾åœ¨ã®ãƒ­ã‚°å‡ºåŠ›ãƒ¬ãƒ™ãƒ«è¨­å®šã®å€¤ã‚’è¿”ã™ã€‚
     *
     * @return  ç¾åœ¨ã®ãƒ­ã‚°å‡ºåŠ›ãƒ¬ãƒ™ãƒ«è¨­å®šã®å€¤
     */
    static getLoggingLevel() {
        if (s_option != null) {
            return s_option.loggingLevel;
        }
        return LogLevel.LogLevel_Off;
    }
    /**
     * IDãƒžãƒãƒ¼ã‚¸ãƒ£ã®ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹ã‚’å–å¾—ã™ã‚‹
     * @return CubismManagerã‚¯ãƒ©ã‚¹ã®ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹
     */
    static getIdManager() {
        return s_cubismIdManager;
    }
    /**
     * é™çš„ã‚¯ãƒ©ã‚¹ã¨ã—ã¦ä½¿ç”¨ã™ã‚‹
     * ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹åŒ–ã•ã›ãªã„
     */
    constructor() { }
}
export class Option {
}
/**
 * ãƒ­ã‚°å‡ºåŠ›ã®ãƒ¬ãƒ™ãƒ«
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["LogLevel_Verbose"] = 0] = "LogLevel_Verbose";
    LogLevel[LogLevel["LogLevel_Debug"] = 1] = "LogLevel_Debug";
    LogLevel[LogLevel["LogLevel_Info"] = 2] = "LogLevel_Info";
    LogLevel[LogLevel["LogLevel_Warning"] = 3] = "LogLevel_Warning";
    LogLevel[LogLevel["LogLevel_Error"] = 4] = "LogLevel_Error";
    LogLevel[LogLevel["LogLevel_Off"] = 5] = "LogLevel_Off"; // ãƒ­ã‚°å‡ºåŠ›ç„¡åŠ¹
})(LogLevel || (LogLevel = {}));
// Namespace definition for compatibility.
import * as $ from './live2dcubismframework.js';
// eslint-disable-next-line @typescript-eslint/no-namespace
export var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    Live2DCubismFramework.Constant = $.Constant;
    Live2DCubismFramework.csmDelete = $.csmDelete;
    Live2DCubismFramework.CubismFramework = $.CubismFramework;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));
//# sourceMappingURL=live2dcubismframework.js.map