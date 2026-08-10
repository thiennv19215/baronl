/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
import { CubismFramework } from '../live2dcubismframework.js';
import { CubismJson } from '../utils/cubismjson.js';
const Epsilon = 0.001;
const DefaultFadeInSeconds = 0.5;
// Pose.jsonã®ã‚¿ã‚°
const FadeIn = 'FadeInTime';
const Link = 'Link';
const Groups = 'Groups';
const Id = 'Id';
/**
 * ãƒ‘ãƒ¼ãƒ„ã®ä¸é€æ˜Žåº¦ã®è¨­å®š
 *
 * ãƒ‘ãƒ¼ãƒ„ã®ä¸é€æ˜Žåº¦ã®ç®¡ç†ã¨è¨­å®šã‚’è¡Œã†ã€‚
 */
export class CubismPose {
    /**
     * ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹ã®ä½œæˆ
     * @param pose3json pose3.jsonã®ãƒ‡ãƒ¼ã‚¿
     * @param size pose3.jsonã®ãƒ‡ãƒ¼ã‚¿ã®ã‚µã‚¤ã‚º[byte]
     * @return ä½œæˆã•ã‚ŒãŸã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹
     */
    static create(pose3json, size) {
        const json = CubismJson.create(pose3json, size);
        if (!json) {
            return null;
        }
        const ret = new CubismPose();
        const root = json.getRoot();
        // ãƒ•ã‚§ãƒ¼ãƒ‰æ™‚é–“ã®æŒ‡å®š
        if (!root.getValueByString(FadeIn).isNull()) {
            ret._fadeTimeSeconds = root
                .getValueByString(FadeIn)
                .toFloat(DefaultFadeInSeconds);
            if (ret._fadeTimeSeconds < 0.0) {
                ret._fadeTimeSeconds = DefaultFadeInSeconds;
            }
        }
        // ãƒ‘ãƒ¼ãƒ„ã‚°ãƒ«ãƒ¼ãƒ—
        const poseListInfo = root.getValueByString(Groups);
        const poseCount = poseListInfo.getSize();
        ret._partGroupCounts.length = poseCount;
        for (let poseIndex = 0; poseIndex < poseCount; ++poseIndex) {
            const idListInfo = poseListInfo.getValueByIndex(poseIndex);
            const idCount = idListInfo.getSize();
            let groupCount = 0;
            for (let groupIndex = 0; groupIndex < idCount; ++groupIndex) {
                const partInfo = idListInfo.getValueByIndex(groupIndex);
                const partData = new PartData();
                const parameterId = CubismFramework.getIdManager().getId(partInfo.getValueByString(Id).getRawString());
                partData.partId = parameterId;
                // ãƒªãƒ³ã‚¯ã™ã‚‹ãƒ‘ãƒ¼ãƒ„ã®è¨­å®š
                if (!partInfo.getValueByString(Link).isNull()) {
                    const linkListInfo = partInfo.getValueByString(Link);
                    const linkCount = linkListInfo.getSize();
                    for (let linkIndex = 0; linkIndex < linkCount; ++linkIndex) {
                        const linkPart = new PartData();
                        const linkId = CubismFramework.getIdManager().getId(linkListInfo.getValueByIndex(linkIndex).getString());
                        linkPart.partId = linkId;
                        partData.link.push(linkPart);
                    }
                }
                ret._partGroups.push(partData.clone());
                ++groupCount;
            }
            ret._partGroupCounts[poseIndex] = groupCount;
        }
        CubismJson.delete(json);
        return ret;
    }
    /**
     * ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹ã‚’ç ´æ£„ã™ã‚‹
     * @param pose å¯¾è±¡ã®CubismPose
     */
    static delete(pose) {
        if (pose != null) {
            pose = null;
        }
    }
    /**
     * ãƒ¢ãƒ‡ãƒ«ã®ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®æ›´æ–°
     * @param model å¯¾è±¡ã®ãƒ¢ãƒ‡ãƒ«
     * @param deltaTimeSeconds ãƒ‡ãƒ«ã‚¿æ™‚é–“[ç§’]
     */
    updateParameters(model, deltaTimeSeconds) {
        // å‰å›žã®ãƒ¢ãƒ‡ãƒ«ã¨åŒã˜ã§ãªã„å ´åˆã¯åˆæœŸåŒ–ãŒå¿…è¦
        if (model != this._lastModel) {
            // ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ã®åˆæœŸåŒ–
            this.reset(model);
        }
        this._lastModel = model;
        // è¨­å®šã‹ã‚‰æ™‚é–“ã‚’å¤‰æ›´ã™ã‚‹ã¨ã€çµŒéŽæ™‚é–“ãŒãƒžã‚¤ãƒŠã‚¹ã«ãªã‚‹äº‹ãŒã‚ã‚‹ã®ã§ã€çµŒéŽæ™‚é–“0ã¨ã—ã¦å¯¾å¿œ
        if (deltaTimeSeconds < 0.0) {
            deltaTimeSeconds = 0.0;
        }
        let beginIndex = 0;
        for (let i = 0; i < this._partGroupCounts.length; i++) {
            const partGroupCount = this._partGroupCounts[i];
            this.doFade(model, deltaTimeSeconds, beginIndex, partGroupCount);
            beginIndex += partGroupCount;
        }
        this.copyPartOpacities(model);
    }
    /**
     * è¡¨ç¤ºã‚’åˆæœŸåŒ–
     * @param model å¯¾è±¡ã®ãƒ¢ãƒ‡ãƒ«
     * @note ä¸é€æ˜Žåº¦ã®åˆæœŸå€¤ãŒ0ã§ãªã„ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã¯ã€ä¸é€æ˜Žåº¦ã‚’ï¼‘ã«è¨­å®šã™ã‚‹
     */
    reset(model) {
        let beginIndex = 0;
        for (let i = 0; i < this._partGroupCounts.length; ++i) {
            const groupCount = this._partGroupCounts[i];
            for (let j = beginIndex; j < beginIndex + groupCount; ++j) {
                this._partGroups[j].initialize(model);
                const partsIndex = this._partGroups[j].partIndex;
                const paramIndex = this._partGroups[j].parameterIndex;
                if (partsIndex < 0) {
                    continue;
                }
                model.setPartOpacityByIndex(partsIndex, j == beginIndex ? 1.0 : 0.0);
                model.setParameterValueByIndex(paramIndex, j == beginIndex ? 1.0 : 0.0);
                for (let k = 0; k < this._partGroups[j].link.length; ++k) {
                    this._partGroups[j].link[k].initialize(model);
                }
            }
            beginIndex += groupCount;
        }
    }
    /**
     * ãƒ‘ãƒ¼ãƒ„ã®ä¸é€æ˜Žåº¦ã‚’ã‚³ãƒ”ãƒ¼
     *
     * @param model å¯¾è±¡ã®ãƒ¢ãƒ‡ãƒ«
     */
    copyPartOpacities(model) {
        for (let groupIndex = 0; groupIndex < this._partGroups.length; ++groupIndex) {
            const partData = this._partGroups[groupIndex];
            if (partData.link.length == 0) {
                continue; // é€£å‹•ã™ã‚‹ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã¯ãªã„
            }
            const partIndex = this._partGroups[groupIndex].partIndex;
            const opacity = model.getPartOpacityByIndex(partIndex);
            for (let linkIndex = 0; linkIndex < partData.link.length; ++linkIndex) {
                const linkPart = partData.link[linkIndex];
                const linkPartIndex = linkPart.partIndex;
                if (linkPartIndex < 0) {
                    continue;
                }
                model.setPartOpacityByIndex(linkPartIndex, opacity);
            }
        }
    }
    /**
     * ãƒ‘ãƒ¼ãƒ„ã®ãƒ•ã‚§ãƒ¼ãƒ‰æ“ä½œã‚’è¡Œã†ã€‚
     * @param model å¯¾è±¡ã®ãƒ¢ãƒ‡ãƒ«
     * @param deltaTimeSeconds ãƒ‡ãƒ«ã‚¿æ™‚é–“[ç§’]
     * @param beginIndex ãƒ•ã‚§ãƒ¼ãƒ‰æ“ä½œã‚’è¡Œã†ãƒ‘ãƒ¼ãƒ„ã‚°ãƒ«ãƒ¼ãƒ—ã®å…ˆé ­ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @param partGroupCount ãƒ•ã‚§ãƒ¼ãƒ‰æ“ä½œã‚’è¡Œã†ãƒ‘ãƒ¼ãƒ„ã‚°ãƒ«ãƒ¼ãƒ—ã®å€‹æ•°
     */
    doFade(model, deltaTimeSeconds, beginIndex, partGroupCount) {
        let visiblePartIndex = -1;
        let newOpacity = 1.0;
        const phi = 0.5;
        const backOpacityThreshold = 0.15;
        // ç¾åœ¨ã€è¡¨ç¤ºçŠ¶æ…‹ã«ãªã£ã¦ã„ã‚‹ãƒ‘ãƒ¼ãƒ„ã‚’å–å¾—
        for (let i = beginIndex; i < beginIndex + partGroupCount; ++i) {
            const partIndex = this._partGroups[i].partIndex;
            const paramIndex = this._partGroups[i].parameterIndex;
            if (model.getParameterValueByIndex(paramIndex) > Epsilon) {
                if (visiblePartIndex >= 0) {
                    break;
                }
                visiblePartIndex = i;
                // ã‚¼ãƒ­é™¤ç®—ã®å›žé¿
                if (this._fadeTimeSeconds == 0) {
                    newOpacity = 1.0;
                    continue;
                }
                newOpacity = model.getPartOpacityByIndex(partIndex);
                // æ–°ã—ã„ä¸é€æ˜Žåº¦ã‚’è¨ˆç®—
                newOpacity += deltaTimeSeconds / this._fadeTimeSeconds;
                if (newOpacity > 1.0) {
                    newOpacity = 1.0;
                }
            }
        }
        if (visiblePartIndex < 0) {
            visiblePartIndex = 0;
            newOpacity = 1.0;
        }
        // è¡¨ç¤ºãƒ‘ãƒ¼ãƒ„ã€éžè¡¨ç¤ºãƒ‘ãƒ¼ãƒ„ã®ä¸é€æ˜Žåº¦ã‚’è¨­å®šã™ã‚‹
        for (let i = beginIndex; i < beginIndex + partGroupCount; ++i) {
            const partsIndex = this._partGroups[i].partIndex;
            // è¡¨ç¤ºãƒ‘ãƒ¼ãƒ„ã®è¨­å®š
            if (visiblePartIndex == i) {
                model.setPartOpacityByIndex(partsIndex, newOpacity); // å…ˆã«è¨­å®š
            }
            // éžè¡¨ç¤ºãƒ‘ãƒ¼ãƒ„ã®è¨­å®š
            else {
                let opacity = model.getPartOpacityByIndex(partsIndex);
                let a1; // è¨ˆç®—ã«ã‚ˆã£ã¦æ±‚ã‚ã‚‰ã‚Œã‚‹ä¸é€æ˜Žåº¦
                if (newOpacity < phi) {
                    a1 = (newOpacity * (phi - 1)) / phi + 1.0; // (0,1),(phi,phi)ã‚’é€šã‚‹ç›´ç·šå¼
                }
                else {
                    a1 = ((1 - newOpacity) * phi) / (1.0 - phi); // (1,0),(phi,phi)ã‚’é€šã‚‹ç›´ç·šå¼
                }
                // èƒŒæ™¯ã®è¦‹ãˆã‚‹å‰²åˆã‚’åˆ¶é™ã™ã‚‹å ´åˆ
                const backOpacity = (1.0 - a1) * (1.0 - newOpacity);
                if (backOpacity > backOpacityThreshold) {
                    a1 = 1.0 - backOpacityThreshold / (1.0 - newOpacity);
                }
                if (opacity > a1) {
                    opacity = a1; // è¨ˆç®—ã®ä¸é€æ˜Žåº¦ã‚ˆã‚Šã‚‚å¤§ãã‘ã‚Œã°ï¼ˆæ¿ƒã‘ã‚Œã°ï¼‰ä¸é€æ˜Žåº¦ã‚’ä¸Šã’ã‚‹
                }
                model.setPartOpacityByIndex(partsIndex, opacity);
            }
        }
    }
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    constructor() {
        this._fadeTimeSeconds = DefaultFadeInSeconds;
        this._lastModel = null;
        this._partGroups = new Array();
        this._partGroupCounts = new Array();
    }
}
/**
 * ãƒ‘ãƒ¼ãƒ„ã«ã¾ã¤ã‚ã‚‹ãƒ‡ãƒ¼ã‚¿ã‚’ç®¡ç†
 */
export class PartData {
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    constructor(v) {
        this.parameterIndex = 0;
        this.partIndex = 0;
        this.link = new Array();
        if (v != undefined) {
            this.partId = v.partId;
            this.link.length = v.link.length;
            for (let i = 0; i < v.link.length; i++) {
                this.link[i] = v.link[i].clone();
            }
        }
    }
    /**
     * =æ¼”ç®—å­ã®ã‚ªãƒ¼ãƒãƒ¼ãƒ­ãƒ¼ãƒ‰
     */
    assignment(v) {
        this.partId = v.partId;
        let dstIndex = this.link.length;
        this.link.length += v.link.length;
        for (const partData of v.link) {
            this.link[dstIndex++] = partData.clone();
        }
        return this;
    }
    /**
     * åˆæœŸåŒ–
     * @param model åˆæœŸåŒ–ã«ä½¿ç”¨ã™ã‚‹ãƒ¢ãƒ‡ãƒ«
     */
    initialize(model) {
        this.parameterIndex = model.getParameterIndex(this.partId);
        this.partIndex = model.getPartIndex(this.partId);
        model.setParameterValueByIndex(this.parameterIndex, 1);
    }
    /**
     * ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã®ã‚³ãƒ”ãƒ¼ã‚’ç”Ÿæˆã™ã‚‹
     */
    clone() {
        const clonePartData = new PartData();
        clonePartData.partId = this.partId;
        clonePartData.parameterIndex = this.parameterIndex;
        clonePartData.partIndex = this.partIndex;
        clonePartData.link = new Array();
        clonePartData.link.length = this.link.length;
        for (let i = 0; i < this.link.length; i++) {
            clonePartData.link[i] = this.link[i].clone();
        }
        return clonePartData;
    }
}
// Namespace definition for compatibility.
import * as $ from './cubismpose.js';
// eslint-disable-next-line @typescript-eslint/no-namespace
export var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    Live2DCubismFramework.CubismPose = $.CubismPose;
    Live2DCubismFramework.PartData = $.PartData;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));
//# sourceMappingURL=cubismpose.js.map