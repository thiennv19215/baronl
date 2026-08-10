/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
import { CSM_LOG_LEVEL, CSM_LOG_LEVEL_DEBUG, CSM_LOG_LEVEL_ERROR, CSM_LOG_LEVEL_INFO, CSM_LOG_LEVEL_VERBOSE, CSM_LOG_LEVEL_WARNING } from '../cubismframeworkconfig.js';
import { CubismFramework, LogLevel } from '../live2dcubismframework.js';
export const CubismLogPrint = (level, fmt, args) => {
    CubismDebug.print(level, '[CSM]' + fmt, args);
};
export const CubismLogPrintIn = (level, fmt, args) => {
    CubismLogPrint(level, fmt + '\n', args);
};
export const CSM_ASSERT = (expr) => {
    console.assert(expr);
};
export let CubismLogVerbose;
export let CubismLogDebug;
export let CubismLogInfo;
export let CubismLogWarning;
export let CubismLogError;
if (CSM_LOG_LEVEL <= CSM_LOG_LEVEL_VERBOSE) {
    CubismLogVerbose = (fmt, ...args) => {
        CubismLogPrintIn(LogLevel.LogLevel_Verbose, '[V]' + fmt, args);
    };
    CubismLogDebug = (fmt, ...args) => {
        CubismLogPrintIn(LogLevel.LogLevel_Debug, '[D]' + fmt, args);
    };
    CubismLogInfo = (fmt, ...args) => {
        CubismLogPrintIn(LogLevel.LogLevel_Info, '[I]' + fmt, args);
    };
    CubismLogWarning = (fmt, ...args) => {
        CubismLogPrintIn(LogLevel.LogLevel_Warning, '[W]' + fmt, args);
    };
    CubismLogError = (fmt, ...args) => {
        CubismLogPrintIn(LogLevel.LogLevel_Error, '[E]' + fmt, args);
    };
}
else if (CSM_LOG_LEVEL == CSM_LOG_LEVEL_DEBUG) {
    CubismLogDebug = (fmt, ...args) => {
        CubismLogPrintIn(LogLevel.LogLevel_Debug, '[D]' + fmt, args);
    };
    CubismLogInfo = (fmt, ...args) => {
        CubismLogPrintIn(LogLevel.LogLevel_Info, '[I]' + fmt, args);
    };
    CubismLogWarning = (fmt, ...args) => {
        CubismLogPrintIn(LogLevel.LogLevel_Warning, '[W]' + fmt, args);
    };
    CubismLogError = (fmt, ...args) => {
        CubismLogPrintIn(LogLevel.LogLevel_Error, '[E]' + fmt, args);
    };
}
else if (CSM_LOG_LEVEL == CSM_LOG_LEVEL_INFO) {
    CubismLogInfo = (fmt, ...args) => {
        CubismLogPrintIn(LogLevel.LogLevel_Info, '[I]' + fmt, args);
    };
    CubismLogWarning = (fmt, ...args) => {
        CubismLogPrintIn(LogLevel.LogLevel_Warning, '[W]' + fmt, args);
    };
    CubismLogError = (fmt, ...args) => {
        CubismLogPrintIn(LogLevel.LogLevel_Error, '[E]' + fmt, args);
    };
}
else if (CSM_LOG_LEVEL == CSM_LOG_LEVEL_WARNING) {
    CubismLogWarning = (fmt, ...args) => {
        CubismLogPrintIn(LogLevel.LogLevel_Warning, '[W]' + fmt, args);
    };
    CubismLogError = (fmt, ...args) => {
        CubismLogPrintIn(LogLevel.LogLevel_Error, '[E]' + fmt, args);
    };
}
else if (CSM_LOG_LEVEL == CSM_LOG_LEVEL_ERROR) {
    CubismLogError = (fmt, ...args) => {
        CubismLogPrintIn(LogLevel.LogLevel_Error, '[E]' + fmt, args);
    };
}
/**
 * ãƒ‡ãƒãƒƒã‚°ç”¨ã®ãƒ¦ãƒ¼ãƒ†ã‚£ãƒªãƒ†ã‚£ã‚¯ãƒ©ã‚¹ã€‚
 * ãƒ­ã‚°ã®å‡ºåŠ›ã€ãƒã‚¤ãƒˆã®ãƒ€ãƒ³ãƒ—ãªã©
 */
export class CubismDebug {
    /**
     * ãƒ­ã‚°ã‚’å‡ºåŠ›ã™ã‚‹ã€‚ç¬¬ä¸€å¼•æ•°ã«ãƒ­ã‚°ãƒ¬ãƒ™ãƒ«ã‚’è¨­å®šã™ã‚‹ã€‚
     * CubismFramework.initialize()æ™‚ã«ã‚ªãƒ—ã‚·ãƒ§ãƒ³ã§è¨­å®šã•ã‚ŒãŸãƒ­ã‚°å‡ºåŠ›ãƒ¬ãƒ™ãƒ«ã‚’ä¸‹å›žã‚‹å ´åˆã¯ãƒ­ã‚°ã«å‡ºã•ãªã„ã€‚
     *
     * @param logLevel ãƒ­ã‚°ãƒ¬ãƒ™ãƒ«ã®è¨­å®š
     * @param format æ›¸å¼ä»˜ãæ–‡å­—åˆ—
     * @param args å¯å¤‰é•·å¼•æ•°
     */
    static print(logLevel, format, args) {
        // ã‚ªãƒ—ã‚·ãƒ§ãƒ³ã§è¨­å®šã•ã‚ŒãŸãƒ­ã‚°å‡ºåŠ›ãƒ¬ãƒ™ãƒ«ã‚’ä¸‹å›žã‚‹å ´åˆã¯ãƒ­ã‚°ã«å‡ºã•ãªã„
        if (logLevel < CubismFramework.getLoggingLevel()) {
            return;
        }
        const logPrint = CubismFramework.coreLogFunction;
        if (!logPrint)
            return;
        const buffer = format.replace(/\{(\d+)\}/g, (m, k) => {
            return args[k];
        });
        logPrint(buffer);
    }
    /**
     * ãƒ‡ãƒ¼ã‚¿ã‹ã‚‰æŒ‡å®šã—ãŸé•·ã•ã ã‘ãƒ€ãƒ³ãƒ—å‡ºåŠ›ã™ã‚‹ã€‚
     * CubismFramework.initialize()æ™‚ã«ã‚ªãƒ—ã‚·ãƒ§ãƒ³ã§è¨­å®šã•ã‚ŒãŸãƒ­ã‚°å‡ºåŠ›ãƒ¬ãƒ™ãƒ«ã‚’ä¸‹å›žã‚‹å ´åˆã¯ãƒ­ã‚°ã«å‡ºã•ãªã„ã€‚
     *
     * @param logLevel ãƒ­ã‚°ãƒ¬ãƒ™ãƒ«ã®è¨­å®š
     * @param data ãƒ€ãƒ³ãƒ—ã™ã‚‹ãƒ‡ãƒ¼ã‚¿
     * @param length ãƒ€ãƒ³ãƒ—ã™ã‚‹é•·ã•
     */
    static dumpBytes(logLevel, data, length) {
        for (let i = 0; i < length; i++) {
            if (i % 16 == 0 && i > 0)
                this.print(logLevel, '\n');
            else if (i % 8 == 0 && i > 0)
                this.print(logLevel, '  ');
            this.print(logLevel, '{0} ', [data[i] & 0xff]);
        }
        this.print(logLevel, '\n');
    }
    /**
     * private ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    constructor() { }
}
// Namespace definition for compatibility.
import * as $ from './cubismdebug.js';
// eslint-disable-next-line @typescript-eslint/no-namespace
export var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    Live2DCubismFramework.CubismDebug = $.CubismDebug;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));
//# sourceMappingURL=cubismdebug.js.map