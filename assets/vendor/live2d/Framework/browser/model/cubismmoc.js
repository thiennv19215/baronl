/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
import { CSM_ASSERT, CubismLogError } from '../utils/cubismdebug.js';
import { CubismModel } from './cubismmodel.js';
/**
 * Mocãƒ‡ãƒ¼ã‚¿ã®ç®¡ç†
 *
 * Mocãƒ‡ãƒ¼ã‚¿ã®ç®¡ç†ã‚’è¡Œã†ã‚¯ãƒ©ã‚¹ã€‚
 */
export class CubismMoc {
    /**
     * Mocãƒ‡ãƒ¼ã‚¿ã®ä½œæˆ
     */
    static create(mocBytes, shouldCheckMocConsistency) {
        let cubismMoc = null;
        if (shouldCheckMocConsistency) {
            // .moc3ã®æ•´åˆæ€§ã‚’ç¢ºèª
            const consistency = this.hasMocConsistency(mocBytes);
            if (!consistency) {
                // æ•´åˆæ€§ãŒç¢ºèªã§ããªã‘ã‚Œã°å‡¦ç†ã—ãªã„
                CubismLogError(`Inconsistent MOC3.`);
                return cubismMoc;
            }
        }
        const moc = Live2DCubismCore.Moc.fromArrayBuffer(mocBytes);
        if (moc) {
            cubismMoc = new CubismMoc(moc);
            cubismMoc._mocVersion =
                Live2DCubismCore.Version.csmGetMocVersion(mocBytes);
        }
        return cubismMoc;
    }
    /**
     * Mocãƒ‡ãƒ¼ã‚¿ã‚’å‰Šé™¤
     *
     * Mocãƒ‡ãƒ¼ã‚¿ã‚’å‰Šé™¤ã™ã‚‹
     */
    static delete(moc) {
        moc._moc._release();
        moc._moc = null;
        moc = null;
    }
    /**
     * ãƒ¢ãƒ‡ãƒ«ã‚’ä½œæˆã™ã‚‹
     *
     * @return Mocãƒ‡ãƒ¼ã‚¿ã‹ã‚‰ä½œæˆã•ã‚ŒãŸãƒ¢ãƒ‡ãƒ«
     */
    createModel() {
        let cubismModel = null;
        const model = Live2DCubismCore.Model.fromMoc(this._moc);
        if (model) {
            cubismModel = new CubismModel(model);
            cubismModel.initialize();
            ++this._modelCount;
        }
        return cubismModel;
    }
    /**
     * ãƒ¢ãƒ‡ãƒ«ã‚’å‰Šé™¤ã™ã‚‹
     */
    deleteModel(model) {
        if (model != null) {
            model.release();
            model = null;
            --this._modelCount;
        }
    }
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    constructor(moc) {
        this._moc = moc;
        this._modelCount = 0;
        this._mocVersion = 0;
    }
    /**
     * ãƒ‡ã‚¹ãƒˆãƒ©ã‚¯ã‚¿ç›¸å½“ã®å‡¦ç†
     */
    release() {
        CSM_ASSERT(this._modelCount == 0);
        this._moc._release();
        this._moc = null;
    }
    /**
     * æœ€æ–°ã®.moc3 Versionã‚’å–å¾—
     */
    getLatestMocVersion() {
        return Live2DCubismCore.Version.csmGetLatestMocVersion();
    }
    /**
     * èª­ã¿è¾¼ã‚“ã ãƒ¢ãƒ‡ãƒ«ã®.moc3 Versionã‚’å–å¾—
     */
    getMocVersion() {
        return this._mocVersion;
    }
    /**
     * Mocãƒ•ã‚¡ã‚¤ãƒ«ã®bufferã‹ã‚‰.moc3 Versionã‚’å–å¾—
     * @param mocBytes Mocãƒ•ã‚¡ã‚¤ãƒ«ã®ãƒã‚¤ãƒˆé…åˆ—
     * @returns .moc3 Versionç•ªå·
     */
    static getMocVersionFromBuffer(mocBytes) {
        return Live2DCubismCore.Version.csmGetMocVersion(mocBytes);
    }
    /**
     * .moc3 ã®æ•´åˆæ€§ã‚’æ¤œè¨¼ã™ã‚‹
     */
    static hasMocConsistency(mocBytes) {
        const isConsistent = Live2DCubismCore.Moc.prototype.hasMocConsistency(mocBytes);
        return isConsistent === 1 ? true : false;
    }
}
// Namespace definition for compatibility.
import * as $ from './cubismmoc.js';
// eslint-disable-next-line @typescript-eslint/no-namespace
export var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    Live2DCubismFramework.CubismMoc = $.CubismMoc;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));
//# sourceMappingURL=cubismmoc.js.map