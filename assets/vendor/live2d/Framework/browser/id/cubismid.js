/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
/**
 * ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿åãƒ»ãƒ‘ãƒ¼ãƒ„åãƒ»Drawableåã‚’ä¿æŒ
 *
 * ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿åãƒ»ãƒ‘ãƒ¼ãƒ„åãƒ»Drawableåã‚’ä¿æŒã™ã‚‹ã‚¯ãƒ©ã‚¹ã€‚
 *
 * @note æŒ‡å®šã—ãŸIDæ–‡å­—åˆ—ã‹ã‚‰CubismIdã‚’å–å¾—ã™ã‚‹éš›ã¯ã“ã®ã‚¯ãƒ©ã‚¹ã®ç”Ÿæˆãƒ¡ã‚½ãƒƒãƒ‰ã‚’å‘¼ã°ãšã€
 *       CubismIdManager().getId(id)ã‚’ä½¿ç”¨ã—ã¦ãã ã•ã„
 */
export class CubismId {
    /**
     * å†…éƒ¨ã§ä½¿ç”¨ã™ã‚‹CubismIdã‚¯ãƒ©ã‚¹ç”Ÿæˆãƒ¡ã‚½ãƒƒãƒ‰
     *
     * @param id IDæ–‡å­—åˆ—
     * @return CubismId
     * @note æŒ‡å®šã—ãŸIDæ–‡å­—åˆ—ã‹ã‚‰CubismIdã‚’å–å¾—ã™ã‚‹éš›ã¯
     *       CubismIdManager().getId(id)ã‚’ä½¿ç”¨ã—ã¦ãã ã•ã„
     */
    static createIdInternal(id) {
        return new CubismId(id);
    }
    /**
     * IDåã‚’å–å¾—ã™ã‚‹
     */
    getString() {
        return this._id;
    }
    /**
     * idã‚’æ¯”è¼ƒ
     * @param c æ¯”è¼ƒã™ã‚‹id
     * @return åŒã˜ãªã‚‰ã°true,ç•°ãªã£ã¦ã„ã‚Œã°falseã‚’è¿”ã™
     */
    isEqual(c) {
        if (typeof c === 'string') {
            return this._id == c;
        }
        else if (c instanceof CubismId) {
            return this._id == c._id;
        }
        return false;
    }
    /**
     * idã‚’æ¯”è¼ƒ
     * @param c æ¯”è¼ƒã™ã‚‹id
     * @return åŒã˜ãªã‚‰ã°true,ç•°ãªã£ã¦ã„ã‚Œã°falseã‚’è¿”ã™
     */
    isNotEqual(c) {
        if (typeof c == 'string') {
            return !(this._id == c);
        }
        else if (c instanceof CubismId) {
            return !(this._id == c._id);
        }
        return false;
    }
    /**
     * ãƒ—ãƒ©ã‚¤ãƒ™ãƒ¼ãƒˆã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     *
     * @note ãƒ¦ãƒ¼ã‚¶ãƒ¼ã«ã‚ˆã‚‹ç”Ÿæˆã¯è¨±å¯ã—ã¾ã›ã‚“
     */
    constructor(id) {
        this._id = id;
    }
}
// Namespace definition for compatibility.
import * as $ from './cubismid.js';
// eslint-disable-next-line @typescript-eslint/no-namespace
export var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    Live2DCubismFramework.CubismId = $.CubismId;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));
//# sourceMappingURL=cubismid.js.map