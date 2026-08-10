/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
export class CubismString {
    /**
     * æ¨™æº–å‡ºåŠ›ã®æ›¸å¼ã‚’é©ç”¨ã—ãŸæ–‡å­—åˆ—ã‚’å–å¾—ã™ã‚‹ã€‚
     * @param format    æ¨™æº–å‡ºåŠ›ã®æ›¸å¼æŒ‡å®šæ–‡å­—åˆ—
     * @param ...args   æ›¸å¼æŒ‡å®šæ–‡å­—åˆ—ã«æ¸¡ã™æ–‡å­—åˆ—
     * @return æ›¸å¼ã‚’é©ç”¨ã—ãŸæ–‡å­—åˆ—
     */
    static getFormatedString(format, ...args) {
        const ret = format;
        return ret.replace(/\{(\d+)\}/g, (m, k // m="{0}", k="0"
        ) => {
            return args[k];
        });
    }
    /**
     * textãŒstartWordã§å§‹ã¾ã£ã¦ã„ã‚‹ã‹ã©ã†ã‹ã‚’è¿”ã™
     * @param test æ¤œæŸ»å¯¾è±¡ã®æ–‡å­—åˆ—
     * @param startWord æ¯”è¼ƒå¯¾è±¡ã®æ–‡å­—åˆ—
     * @return true textãŒstartWordã§å§‹ã¾ã£ã¦ã„ã‚‹
     * @return false textãŒstartWordã§å§‹ã¾ã£ã¦ã„ãªã„
     */
    static isStartWith(text, startWord) {
        let textIndex = 0;
        let startWordIndex = 0;
        while (startWord[startWordIndex] != '\0') {
            if (text[textIndex] == '\0' ||
                text[textIndex++] != startWord[startWordIndex++]) {
                return false;
            }
        }
        return false;
    }
    /**
     * positionä½ç½®ã®æ–‡å­—ã‹ã‚‰æ•°å­—ã‚’è§£æžã™ã‚‹ã€‚
     *
     * @param string æ–‡å­—åˆ—
     * @param length æ–‡å­—åˆ—ã®é•·ã•
     * @param position è§£æžã—ãŸã„æ–‡å­—ã®ä½ç½®
     * @param outEndPos ä¸€æ–‡å­—ã‚‚èª­ã¿è¾¼ã¾ãªã‹ã£ãŸå ´åˆã¯ã‚¨ãƒ©ãƒ¼å€¤(-1)ãŒå…¥ã‚‹
     * @return è§£æžçµæžœã®æ•°å€¤
     */
    static stringToFloat(string, length, position, outEndPos) {
        let i = position;
        let minus = false; // ãƒžã‚¤ãƒŠã‚¹ãƒ•ãƒ©ã‚°
        let period = false;
        let v1 = 0;
        //è² å·ã®ç¢ºèª
        let c = parseInt(string[i]);
        if (c < 0) {
            minus = true;
            i++;
        }
        //æ•´æ•°éƒ¨ã®ç¢ºèª
        for (; i < length; i++) {
            const c = string[i];
            if (0 <= parseInt(c) && parseInt(c) <= 9) {
                v1 = v1 * 10 + (parseInt(c) - 0);
            }
            else if (c == '.') {
                period = true;
                i++;
                break;
            }
            else {
                break;
            }
        }
        //å°æ•°éƒ¨ã®ç¢ºèª
        if (period) {
            let mul = 0.1;
            for (; i < length; i++) {
                c = parseFloat(string[i]) & 0xff;
                if (0 <= c && c <= 9) {
                    v1 += mul * (c - 0);
                }
                else {
                    break;
                }
                mul *= 0.1; //ä¸€æ¡ä¸‹ã’ã‚‹
                if (!c)
                    break;
            }
        }
        if (i == position) {
            //ä¸€æ–‡å­—ã‚‚èª­ã¿è¾¼ã¾ãªã‹ã£ãŸå ´åˆ
            outEndPos[0] = -1; //ã‚¨ãƒ©ãƒ¼å€¤ãŒå…¥ã‚‹ã®ã§å‘¼ã³å‡ºã—å…ƒã§é©åˆ‡ãªå‡¦ç†ã‚’è¡Œã†
            return 0;
        }
        if (minus)
            v1 = -v1;
        outEndPos[0] = i;
        return v1;
    }
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿å‘¼ã³å‡ºã—ä¸å¯ãªé™çš„ã‚¯ãƒ©ã‚¹ã«ã™ã‚‹ã€‚
     */
    constructor() { }
}
// Namespace definition for compatibility.
import * as $ from './cubismstring.js';
// eslint-disable-next-line @typescript-eslint/no-namespace
export var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    Live2DCubismFramework.CubismString = $.CubismString;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));
//# sourceMappingURL=cubismstring.js.map