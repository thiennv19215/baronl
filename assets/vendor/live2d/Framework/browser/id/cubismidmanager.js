/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
import { CubismId } from './cubismid.js';
/**
 * IDåã®ç®¡ç†
 *
 * IDåã‚’ç®¡ç†ã™ã‚‹ã€‚
 */
export class CubismIdManager {
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    constructor() {
        this._ids = new Array();
    }
    /**
     * ãƒ‡ã‚¹ãƒˆãƒ©ã‚¯ã‚¿ç›¸å½“ã®å‡¦ç†
     */
    release() {
        for (let i = 0; i < this._ids.length; ++i) {
            this._ids[i] = void 0;
        }
        this._ids = null;
    }
    /**
     * IDåã‚’ãƒªã‚¹ãƒˆã‹ã‚‰ç™»éŒ²
     *
     * @param ids IDåãƒªã‚¹ãƒˆ
     * @param count IDã®å€‹æ•°
     */
    registerIds(ids) {
        for (let i = 0; i < ids.length; i++) {
            this.registerId(ids[i]);
        }
    }
    /**
     * IDåã‚’ç™»éŒ²
     *
     * @param id IDå
     */
    registerId(id) {
        let result = null;
        if ('string' == typeof id) {
            if ((result = this.findId(id)) != null) {
                return result;
            }
            result = CubismId.createIdInternal(id);
            this._ids.push(result);
        }
        else {
            return this.registerId(id);
        }
        return result;
    }
    /**
     * IDåã‹ã‚‰IDã‚’å–å¾—ã™ã‚‹
     *
     * @param id IDå
     */
    getId(id) {
        return this.registerId(id);
    }
    /**
     * IDåã‹ã‚‰IDã®ç¢ºèª
     *
     * @return true å­˜åœ¨ã™ã‚‹
     * @return false å­˜åœ¨ã—ãªã„
     */
    isExist(id) {
        if ('string' == typeof id) {
            return this.findId(id) != null;
        }
        return this.isExist(id);
    }
    /**
     * IDåã‹ã‚‰IDã‚’æ¤œç´¢ã™ã‚‹ã€‚
     *
     * @param id IDå
     * @return ç™»éŒ²ã•ã‚Œã¦ã„ã‚‹IDã€‚ãªã‘ã‚Œã°NULLã€‚
     */
    findId(id) {
        for (let i = 0; i < this._ids.length; ++i) {
            if (this._ids[i].getString() == id) {
                return this._ids[i];
            }
        }
        return null;
    }
}
// Namespace definition for compatibility.
import * as $ from './cubismidmanager.js';
// eslint-disable-next-line @typescript-eslint/no-namespace
export var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    Live2DCubismFramework.CubismIdManager = $.CubismIdManager;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));
//# sourceMappingURL=cubismidmanager.js.map