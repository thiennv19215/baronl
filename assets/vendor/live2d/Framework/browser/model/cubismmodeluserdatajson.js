/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
import { CubismFramework } from '../live2dcubismframework.js';
import { CubismJson } from '../utils/cubismjson.js';
const Meta = 'Meta';
const UserDataCount = 'UserDataCount';
const TotalUserDataSize = 'TotalUserDataSize';
const UserData = 'UserData';
const Target = 'Target';
const Id = 'Id';
const Value = 'Value';
export class CubismModelUserDataJson {
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     * @param buffer    userdata3.jsonãŒèª­ã¿è¾¼ã¾ã‚Œã¦ã„ã‚‹ãƒãƒƒãƒ•ã‚¡
     * @param size      ãƒãƒƒãƒ•ã‚¡ã®ã‚µã‚¤ã‚º
     */
    constructor(buffer, size) {
        this._json = CubismJson.create(buffer, size);
    }
    /**
     * ãƒ‡ã‚¹ãƒˆãƒ©ã‚¯ã‚¿ç›¸å½“ã®å‡¦ç†
     */
    release() {
        CubismJson.delete(this._json);
    }
    /**
     * ãƒ¦ãƒ¼ã‚¶ãƒ¼ãƒ‡ãƒ¼ã‚¿å€‹æ•°ã®å–å¾—
     * @return ãƒ¦ãƒ¼ã‚¶ãƒ¼ãƒ‡ãƒ¼ã‚¿ã®å€‹æ•°
     */
    getUserDataCount() {
        return this._json
            .getRoot()
            .getValueByString(Meta)
            .getValueByString(UserDataCount)
            .toInt();
    }
    /**
     * ãƒ¦ãƒ¼ã‚¶ãƒ¼ãƒ‡ãƒ¼ã‚¿ç·æ–‡å­—åˆ—æ•°ã®å–å¾—
     *
     * @return ãƒ¦ãƒ¼ã‚¶ãƒ¼ãƒ‡ãƒ¼ã‚¿ç·æ–‡å­—åˆ—æ•°
     */
    getTotalUserDataSize() {
        return this._json
            .getRoot()
            .getValueByString(Meta)
            .getValueByString(TotalUserDataSize)
            .toInt();
    }
    /**
     * ãƒ¦ãƒ¼ã‚¶ãƒ¼ãƒ‡ãƒ¼ã‚¿ã®ã‚¿ã‚¤ãƒ—ã®å–å¾—
     *
     * @return ãƒ¦ãƒ¼ã‚¶ãƒ¼ãƒ‡ãƒ¼ã‚¿ã®ã‚¿ã‚¤ãƒ—
     */
    getUserDataTargetType(i) {
        return this._json
            .getRoot()
            .getValueByString(UserData)
            .getValueByIndex(i)
            .getValueByString(Target)
            .getRawString();
    }
    /**
     * ãƒ¦ãƒ¼ã‚¶ãƒ¼ãƒ‡ãƒ¼ã‚¿ã®ã‚¿ãƒ¼ã‚²ãƒƒãƒˆIDã®å–å¾—
     *
     * @param i ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return ãƒ¦ãƒ¼ã‚¶ãƒ¼ãƒ‡ãƒ¼ã‚¿ã‚¿ãƒ¼ã‚²ãƒƒãƒˆID
     */
    getUserDataId(i) {
        return CubismFramework.getIdManager().getId(this._json
            .getRoot()
            .getValueByString(UserData)
            .getValueByIndex(i)
            .getValueByString(Id)
            .getRawString());
    }
    /**
     * ãƒ¦ãƒ¼ã‚¶ãƒ¼ãƒ‡ãƒ¼ã‚¿ã®æ–‡å­—åˆ—ã®å–å¾—
     *
     * @param i ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return ãƒ¦ãƒ¼ã‚¶ãƒ¼ãƒ‡ãƒ¼ã‚¿
     */
    getUserDataValue(i) {
        return this._json
            .getRoot()
            .getValueByString(UserData)
            .getValueByIndex(i)
            .getValueByString(Value)
            .getRawString();
    }
}
// Namespace definition for compatibility.
import * as $ from './cubismmodeluserdatajson.js';
// eslint-disable-next-line @typescript-eslint/no-namespace
export var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    Live2DCubismFramework.CubismModelUserDataJson = $.CubismModelUserDataJson;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));
//# sourceMappingURL=cubismmodeluserdatajson.js.map