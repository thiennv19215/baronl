/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
import { CubismFramework } from '../live2dcubismframework.js';
import { CubismModelUserDataJson } from './cubismmodeluserdatajson.js';
const ArtMesh = 'ArtMesh';
/**
 * ãƒ¦ãƒ¼ã‚¶ãƒ¼ãƒ‡ãƒ¼ã‚¿ã‚¤ãƒ³ã‚¿ãƒ¼ãƒ•ã‚§ãƒ¼ã‚¹
 *
 * Jsonã‹ã‚‰èª­ã¿è¾¼ã‚“ã ãƒ¦ãƒ¼ã‚¶ãƒ¼ãƒ‡ãƒ¼ã‚¿ã‚’è¨˜éŒ²ã—ã¦ãŠããŸã‚ã®æ§‹é€ ä½“
 */
export class CubismModelUserDataNode {
}
/**
 * ãƒ¦ãƒ¼ã‚¶ãƒ‡ãƒ¼ã‚¿ã®ç®¡ç†ã‚¯ãƒ©ã‚¹
 *
 * ãƒ¦ãƒ¼ã‚¶ãƒ‡ãƒ¼ã‚¿ã‚’ãƒ­ãƒ¼ãƒ‰ã€ç®¡ç†ã€æ¤œç´¢ã‚¤ãƒ³ã‚¿ãƒ¼ãƒ•ã‚§ã‚¤ã‚¹ã€è§£æ”¾ã¾ã§ã‚’è¡Œã†ã€‚
 */
export class CubismModelUserData {
    /**
     * ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹ã®ä½œæˆ
     *
     * @param buffer    userdata3.jsonãŒèª­ã¿è¾¼ã¾ã‚Œã¦ã„ã‚‹ãƒãƒƒãƒ•ã‚¡
     * @param size      ãƒãƒƒãƒ•ã‚¡ã®ã‚µã‚¤ã‚º
     * @return ä½œæˆã•ã‚ŒãŸã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹
     */
    static create(buffer, size) {
        const ret = new CubismModelUserData();
        ret.parseUserData(buffer, size);
        return ret;
    }
    /**
     * ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹ã‚’ç ´æ£„ã™ã‚‹
     *
     * @param modelUserData ç ´æ£„ã™ã‚‹ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹
     */
    static delete(modelUserData) {
        if (modelUserData != null) {
            modelUserData.release();
            modelUserData = null;
        }
    }
    /**
     * ArtMeshã®ãƒ¦ãƒ¼ã‚¶ãƒ¼ãƒ‡ãƒ¼ã‚¿ã®ãƒªã‚¹ãƒˆã®å–å¾—
     *
     * @return ãƒ¦ãƒ¼ã‚¶ãƒ¼ãƒ‡ãƒ¼ã‚¿ãƒªã‚¹ãƒˆ
     */
    getArtMeshUserDatas() {
        return this._artMeshUserDataNode;
    }
    /**
     * userdata3.jsonã®ãƒ‘ãƒ¼ã‚¹
     *
     * @param buffer    userdata3.jsonãŒèª­ã¿è¾¼ã¾ã‚Œã¦ã„ã‚‹ãƒãƒƒãƒ•ã‚¡
     * @param size      ãƒãƒƒãƒ•ã‚¡ã®ã‚µã‚¤ã‚º
     */
    parseUserData(buffer, size) {
        let json = new CubismModelUserDataJson(buffer, size);
        if (!json) {
            json.release();
            json = void 0;
            return;
        }
        const typeOfArtMesh = CubismFramework.getIdManager().getId(ArtMesh);
        const nodeCount = json.getUserDataCount();
        let dstIndex = this._userDataNodes.length;
        this._userDataNodes.length = nodeCount;
        for (let i = 0; i < nodeCount; i++) {
            const addNode = new CubismModelUserDataNode();
            addNode.targetId = json.getUserDataId(i);
            addNode.targetType = CubismFramework.getIdManager().getId(json.getUserDataTargetType(i));
            addNode.value = json.getUserDataValue(i);
            this._userDataNodes[dstIndex++] = addNode;
            if (addNode.targetType == typeOfArtMesh) {
                this._artMeshUserDataNode.push(addNode);
            }
        }
        json.release();
        json = void 0;
    }
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    constructor() {
        this._userDataNodes = new Array();
        this._artMeshUserDataNode = new Array();
    }
    /**
     * ãƒ‡ã‚¹ãƒˆãƒ©ã‚¯ã‚¿ç›¸å½“ã®å‡¦ç†
     *
     * ãƒ¦ãƒ¼ã‚¶ãƒ¼ãƒ‡ãƒ¼ã‚¿æ§‹é€ ä½“é…åˆ—ã‚’è§£æ”¾ã™ã‚‹
     */
    release() {
        for (let i = 0; i < this._userDataNodes.length; ++i) {
            this._userDataNodes[i] = null;
        }
        this._userDataNodes = null;
    }
}
// Namespace definition for compatibility.
import * as $ from './cubismmodeluserdata.js';
// eslint-disable-next-line @typescript-eslint/no-namespace
export var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    Live2DCubismFramework.CubismModelUserData = $.CubismModelUserData;
    Live2DCubismFramework.CubismModelUserDataNode = $.CubismModelUserDataNode;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));
//# sourceMappingURL=cubismmodeluserdata.js.map