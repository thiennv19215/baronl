/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
import { ICubismModelSetting } from './icubismmodelsetting.js';
import { CubismFramework } from './live2dcubismframework.js';
import { CubismJson } from './utils/cubismjson.js';
export var FrequestNode;
(function (FrequestNode) {
    FrequestNode[FrequestNode["FrequestNode_Groups"] = 0] = "FrequestNode_Groups";
    FrequestNode[FrequestNode["FrequestNode_Moc"] = 1] = "FrequestNode_Moc";
    FrequestNode[FrequestNode["FrequestNode_Motions"] = 2] = "FrequestNode_Motions";
    FrequestNode[FrequestNode["FrequestNode_Expressions"] = 3] = "FrequestNode_Expressions";
    FrequestNode[FrequestNode["FrequestNode_Textures"] = 4] = "FrequestNode_Textures";
    FrequestNode[FrequestNode["FrequestNode_Physics"] = 5] = "FrequestNode_Physics";
    FrequestNode[FrequestNode["FrequestNode_Pose"] = 6] = "FrequestNode_Pose";
    FrequestNode[FrequestNode["FrequestNode_HitAreas"] = 7] = "FrequestNode_HitAreas"; // getRoot().getValueByString(HitAreas)
})(FrequestNode || (FrequestNode = {}));
/**
 * Model3Jsonãƒ‘ãƒ¼ã‚µãƒ¼
 *
 * model3.jsonãƒ•ã‚¡ã‚¤ãƒ«ã‚’ãƒ‘ãƒ¼ã‚¹ã—ã¦å€¤ã‚’å–å¾—ã™ã‚‹
 */
export class CubismModelSettingJson extends ICubismModelSetting {
    /**
     * å¼•æ•°ä»˜ãã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     *
     * @param buffer    Model3Jsonã‚’ãƒã‚¤ãƒˆé…åˆ—ã¨ã—ã¦èª­ã¿è¾¼ã‚“ã ãƒ‡ãƒ¼ã‚¿ãƒãƒƒãƒ•ã‚¡
     * @param size      Model3Jsonã®ãƒ‡ãƒ¼ã‚¿ã‚µã‚¤ã‚º
     */
    constructor(buffer, size) {
        super();
        /**
         * Model3Jsonã®ã‚­ãƒ¼æ–‡å­—åˆ—
         */
        this.version = 'Version';
        this.fileReferences = 'FileReferences';
        this.groups = 'Groups';
        this.layout = 'Layout';
        this.hitAreas = 'HitAreas';
        this.moc = 'Moc';
        this.textures = 'Textures';
        this.physics = 'Physics';
        this.pose = 'Pose';
        this.expressions = 'Expressions';
        this.motions = 'Motions';
        this.userData = 'UserData';
        this.name = 'Name';
        this.filePath = 'File';
        this.id = 'Id';
        this.ids = 'Ids';
        this.target = 'Target';
        // Motions
        this.idle = 'Idle';
        this.tapBody = 'TapBody';
        this.pinchIn = 'PinchIn';
        this.pinchOut = 'PinchOut';
        this.shake = 'Shake';
        this.flickHead = 'FlickHead';
        this.parameter = 'Parameter';
        this.soundPath = 'Sound';
        this.fadeInTime = 'FadeInTime';
        this.fadeOutTime = 'FadeOutTime';
        // Layout
        this.centerX = 'CenterX';
        this.centerY = 'CenterY';
        this.x = 'X';
        this.y = 'Y';
        this.width = 'Width';
        this.height = 'Height';
        this.lipSync = 'LipSync';
        this.eyeBlink = 'EyeBlink';
        this.initParameter = 'init_param';
        this.initPartsVisible = 'init_parts_visible';
        this.val = 'val';
        this._json = CubismJson.create(buffer, size);
        if (this.getJson()) {
            this._jsonValue = [
                // é †ç•ªã¯enum FrequestNodeã¨ä¸€è‡´ã•ã›ã‚‹
                this.getJson().getRoot().getValueByString(this.groups),
                this.getJson()
                    .getRoot()
                    .getValueByString(this.fileReferences)
                    .getValueByString(this.moc),
                this.getJson()
                    .getRoot()
                    .getValueByString(this.fileReferences)
                    .getValueByString(this.motions),
                this.getJson()
                    .getRoot()
                    .getValueByString(this.fileReferences)
                    .getValueByString(this.expressions),
                this.getJson()
                    .getRoot()
                    .getValueByString(this.fileReferences)
                    .getValueByString(this.textures),
                this.getJson()
                    .getRoot()
                    .getValueByString(this.fileReferences)
                    .getValueByString(this.physics),
                this.getJson()
                    .getRoot()
                    .getValueByString(this.fileReferences)
                    .getValueByString(this.pose),
                this.getJson().getRoot().getValueByString(this.hitAreas)
            ];
        }
    }
    /**
     * ãƒ‡ã‚¹ãƒˆãƒ©ã‚¯ã‚¿ç›¸å½“ã®å‡¦ç†
     */
    release() {
        CubismJson.delete(this._json);
        this._jsonValue = null;
    }
    /**
     * CubismJsonã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã‚’å–å¾—ã™ã‚‹
     *
     * @return CubismJson
     */
    getJson() {
        return this._json;
    }
    /**
     * Mocãƒ•ã‚¡ã‚¤ãƒ«ã®åå‰ã‚’å–å¾—ã™ã‚‹
     * @return Mocãƒ•ã‚¡ã‚¤ãƒ«ã®åå‰
     */
    getModelFileName() {
        if (!this.isExistModelFile()) {
            return '';
        }
        return this._jsonValue[FrequestNode.FrequestNode_Moc].getRawString();
    }
    /**
     * ãƒ¢ãƒ‡ãƒ«ãŒä½¿ç”¨ã™ã‚‹ãƒ†ã‚¯ã‚¹ãƒãƒ£ã®æ•°ã‚’å–å¾—ã™ã‚‹
     * ãƒ†ã‚¯ã‚¹ãƒãƒ£ã®æ•°
     */
    getTextureCount() {
        if (!this.isExistTextureFiles()) {
            return 0;
        }
        return this._jsonValue[FrequestNode.FrequestNode_Textures].getSize();
    }
    /**
     * ãƒ†ã‚¯ã‚¹ãƒãƒ£ãŒé…ç½®ã•ã‚ŒãŸãƒ‡ã‚£ãƒ¬ã‚¯ãƒˆãƒªã®åå‰ã‚’å–å¾—ã™ã‚‹
     * @return ãƒ†ã‚¯ã‚¹ãƒãƒ£ãŒé…ç½®ã•ã‚ŒãŸãƒ‡ã‚£ãƒ¬ã‚¯ãƒˆãƒªã®åå‰
     */
    getTextureDirectory() {
        const texturePath = this._jsonValue[FrequestNode.FrequestNode_Textures]
            .getValueByIndex(0)
            .getRawString();
        const pathArray = texturePath.split('/');
        // æœ€å¾Œã®è¦ç´ ã¯ãƒ†ã‚¯ã‚¹ãƒãƒ£åãªã®ã§ä¸è¦
        const arrayLength = pathArray.length - 1;
        let textureDirectoryStr = '';
        // åˆ†å‰²ã—ãŸãƒ‘ã‚¹ã‚’çµåˆ
        for (let i = 0; i < arrayLength; i++) {
            textureDirectoryStr += pathArray[i];
            if (i < arrayLength - 1) {
                textureDirectoryStr += '/';
            }
        }
        return textureDirectoryStr;
    }
    /**
     * ãƒ¢ãƒ‡ãƒ«ãŒä½¿ç”¨ã™ã‚‹ãƒ†ã‚¯ã‚¹ãƒãƒ£ã®åå‰ã‚’å–å¾—ã™ã‚‹
     * @param index é…åˆ—ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹å€¤
     * @return ãƒ†ã‚¯ã‚¹ãƒãƒ£ã®åå‰
     */
    getTextureFileName(index) {
        return this._jsonValue[FrequestNode.FrequestNode_Textures]
            .getValueByIndex(index)
            .getRawString();
    }
    /**
     * ãƒ¢ãƒ‡ãƒ«ã«è¨­å®šã•ã‚ŒãŸå½“ãŸã‚Šåˆ¤å®šã®æ•°ã‚’å–å¾—ã™ã‚‹
     * @return ãƒ¢ãƒ‡ãƒ«ã«è¨­å®šã•ã‚ŒãŸå½“ãŸã‚Šåˆ¤å®šã®æ•°
     */
    getHitAreasCount() {
        if (!this.isExistHitAreas()) {
            return 0;
        }
        return this._jsonValue[FrequestNode.FrequestNode_HitAreas].getSize();
    }
    /**
     * å½“ãŸã‚Šåˆ¤å®šã«è¨­å®šã•ã‚ŒãŸIDã‚’å–å¾—ã™ã‚‹
     *
     * @param index é…åˆ—ã®index
     * @return å½“ãŸã‚Šåˆ¤å®šã«è¨­å®šã•ã‚ŒãŸID
     */
    getHitAreaId(index) {
        return CubismFramework.getIdManager().getId(this._jsonValue[FrequestNode.FrequestNode_HitAreas]
            .getValueByIndex(index)
            .getValueByString(this.id)
            .getRawString());
    }
    /**
     * å½“ãŸã‚Šåˆ¤å®šã«è¨­å®šã•ã‚ŒãŸåå‰ã‚’å–å¾—ã™ã‚‹
     * @param index é…åˆ—ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹å€¤
     * @return å½“ãŸã‚Šåˆ¤å®šã«è¨­å®šã•ã‚ŒãŸåå‰
     */
    getHitAreaName(index) {
        return this._jsonValue[FrequestNode.FrequestNode_HitAreas]
            .getValueByIndex(index)
            .getValueByString(this.name)
            .getRawString();
    }
    /**
     * ç‰©ç†æ¼”ç®—è¨­å®šãƒ•ã‚¡ã‚¤ãƒ«ã®åå‰ã‚’å–å¾—ã™ã‚‹
     * @return ç‰©ç†æ¼”ç®—è¨­å®šãƒ•ã‚¡ã‚¤ãƒ«ã®åå‰
     */
    getPhysicsFileName() {
        if (!this.isExistPhysicsFile()) {
            return '';
        }
        return this._jsonValue[FrequestNode.FrequestNode_Physics].getRawString();
    }
    /**
     * ãƒ‘ãƒ¼ãƒ„åˆ‡ã‚Šæ›¿ãˆè¨­å®šãƒ•ã‚¡ã‚¤ãƒ«ã®åå‰ã‚’å–å¾—ã™ã‚‹
     * @return ãƒ‘ãƒ¼ãƒ„åˆ‡ã‚Šæ›¿ãˆè¨­å®šãƒ•ã‚¡ã‚¤ãƒ«ã®åå‰
     */
    getPoseFileName() {
        if (!this.isExistPoseFile()) {
            return '';
        }
        return this._jsonValue[FrequestNode.FrequestNode_Pose].getRawString();
    }
    /**
     * è¡¨æƒ…è¨­å®šãƒ•ã‚¡ã‚¤ãƒ«ã®æ•°ã‚’å–å¾—ã™ã‚‹
     * @return è¡¨æƒ…è¨­å®šãƒ•ã‚¡ã‚¤ãƒ«ã®æ•°
     */
    getExpressionCount() {
        if (!this.isExistExpressionFile()) {
            return 0;
        }
        return this._jsonValue[FrequestNode.FrequestNode_Expressions].getSize();
    }
    /**
     * è¡¨æƒ…è¨­å®šãƒ•ã‚¡ã‚¤ãƒ«ã‚’è­˜åˆ¥ã™ã‚‹åå‰ï¼ˆåˆ¥åï¼‰ã‚’å–å¾—ã™ã‚‹
     * @param index é…åˆ—ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹å€¤
     * @return è¡¨æƒ…ã®åå‰
     */
    getExpressionName(index) {
        return this._jsonValue[FrequestNode.FrequestNode_Expressions]
            .getValueByIndex(index)
            .getValueByString(this.name)
            .getRawString();
    }
    /**
     * è¡¨æƒ…è¨­å®šãƒ•ã‚¡ã‚¤ãƒ«ã®åå‰ã‚’å–å¾—ã™ã‚‹
     * @param index é…åˆ—ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹å€¤
     * @return è¡¨æƒ…è¨­å®šãƒ•ã‚¡ã‚¤ãƒ«ã®åå‰
     */
    getExpressionFileName(index) {
        return this._jsonValue[FrequestNode.FrequestNode_Expressions]
            .getValueByIndex(index)
            .getValueByString(this.filePath)
            .getRawString();
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã‚°ãƒ«ãƒ¼ãƒ—ã®æ•°ã‚’å–å¾—ã™ã‚‹
     * @return ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã‚°ãƒ«ãƒ¼ãƒ—ã®æ•°
     */
    getMotionGroupCount() {
        if (!this.isExistMotionGroups()) {
            return 0;
        }
        return this._jsonValue[FrequestNode.FrequestNode_Motions].getKeys().length;
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã‚°ãƒ«ãƒ¼ãƒ—ã®åå‰ã‚’å–å¾—ã™ã‚‹
     * @param index é…åˆ—ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹å€¤
     * @return ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã‚°ãƒ«ãƒ¼ãƒ—ã®åå‰
     */
    getMotionGroupName(index) {
        if (!this.isExistMotionGroups()) {
            return null;
        }
        return this._jsonValue[FrequestNode.FrequestNode_Motions].getKeys()[index];
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã‚°ãƒ«ãƒ¼ãƒ—ã«å«ã¾ã‚Œã‚‹ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®æ•°ã‚’å–å¾—ã™ã‚‹
     * @param groupName ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã‚°ãƒ«ãƒ¼ãƒ—ã®åå‰
     * @return ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã‚°ãƒ«ãƒ¼ãƒ—ã®æ•°
     */
    getMotionCount(groupName) {
        if (!this.isExistMotionGroupName(groupName)) {
            return 0;
        }
        return this._jsonValue[FrequestNode.FrequestNode_Motions]
            .getValueByString(groupName)
            .getSize();
    }
    /**
     * ã‚°ãƒ«ãƒ¼ãƒ—åã¨ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹å€¤ã‹ã‚‰ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ãƒ•ã‚¡ã‚¤ãƒ«åã‚’å–å¾—ã™ã‚‹
     * @param groupName ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã‚°ãƒ«ãƒ¼ãƒ—ã®åå‰
     * @param index     é…åˆ—ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹å€¤
     * @return ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ãƒ•ã‚¡ã‚¤ãƒ«ã®åå‰
     */
    getMotionFileName(groupName, index) {
        if (!this.isExistMotionGroupName(groupName)) {
            return '';
        }
        return this._jsonValue[FrequestNode.FrequestNode_Motions]
            .getValueByString(groupName)
            .getValueByIndex(index)
            .getValueByString(this.filePath)
            .getRawString();
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã«å¯¾å¿œã™ã‚‹ã‚µã‚¦ãƒ³ãƒ‰ãƒ•ã‚¡ã‚¤ãƒ«ã®åå‰ã‚’å–å¾—ã™ã‚‹
     * @param groupName ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã‚°ãƒ«ãƒ¼ãƒ—ã®åå‰
     * @param index é…åˆ—ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹å€¤
     * @return ã‚µã‚¦ãƒ³ãƒ‰ãƒ•ã‚¡ã‚¤ãƒ«ã®åå‰
     */
    getMotionSoundFileName(groupName, index) {
        if (!this.isExistMotionSoundFile(groupName, index)) {
            return '';
        }
        return this._jsonValue[FrequestNode.FrequestNode_Motions]
            .getValueByString(groupName)
            .getValueByIndex(index)
            .getValueByString(this.soundPath)
            .getRawString();
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³é–‹å§‹æ™‚ã®ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¤ãƒ³å‡¦ç†æ™‚é–“ã‚’å–å¾—ã™ã‚‹
     * @param groupName ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã‚°ãƒ«ãƒ¼ãƒ—ã®åå‰
     * @param index é…åˆ—ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹å€¤
     * @return ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¤ãƒ³å‡¦ç†æ™‚é–“[ç§’]
     */
    getMotionFadeInTimeValue(groupName, index) {
        if (!this.isExistMotionFadeIn(groupName, index)) {
            return -1.0;
        }
        return this._jsonValue[FrequestNode.FrequestNode_Motions]
            .getValueByString(groupName)
            .getValueByIndex(index)
            .getValueByString(this.fadeInTime)
            .toFloat();
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³çµ‚äº†æ™‚ã®ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¢ã‚¦ãƒˆå‡¦ç†æ™‚é–“ã‚’å–å¾—ã™ã‚‹
     * @param groupName ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã‚°ãƒ«ãƒ¼ãƒ—ã®åå‰
     * @param index é…åˆ—ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹å€¤
     * @return ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¢ã‚¦ãƒˆå‡¦ç†æ™‚é–“[ç§’]
     */
    getMotionFadeOutTimeValue(groupName, index) {
        if (!this.isExistMotionFadeOut(groupName, index)) {
            return -1.0;
        }
        return this._jsonValue[FrequestNode.FrequestNode_Motions]
            .getValueByString(groupName)
            .getValueByIndex(index)
            .getValueByString(this.fadeOutTime)
            .toFloat();
    }
    /**
     * ãƒ¦ãƒ¼ã‚¶ãƒ¼ãƒ‡ãƒ¼ã‚¿ã®ãƒ•ã‚¡ã‚¤ãƒ«åã‚’å–å¾—ã™ã‚‹
     * @return ãƒ¦ãƒ¼ã‚¶ãƒ¼ãƒ‡ãƒ¼ã‚¿ã®ãƒ•ã‚¡ã‚¤ãƒ«å
     */
    getUserDataFile() {
        if (!this.isExistUserDataFile()) {
            return '';
        }
        return this.getJson()
            .getRoot()
            .getValueByString(this.fileReferences)
            .getValueByString(this.userData)
            .getRawString();
    }
    /**
     * ãƒ¬ã‚¤ã‚¢ã‚¦ãƒˆæƒ…å ±ã‚’å–å¾—ã™ã‚‹
     * @param outLayoutMap Mapã‚¯ãƒ©ã‚¹ã®ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹
     * @return true ãƒ¬ã‚¤ã‚¢ã‚¦ãƒˆæƒ…å ±ãŒå­˜åœ¨ã™ã‚‹
     * @return false ãƒ¬ã‚¤ã‚¢ã‚¦ãƒˆæƒ…å ±ãŒå­˜åœ¨ã—ãªã„
     */
    getLayoutMap(outLayoutMap) {
        // å­˜åœ¨ã—ãªã„è¦ç´ ã«ã‚¢ã‚¯ã‚»ã‚¹ã™ã‚‹ã¨ã‚¨ãƒ©ãƒ¼ã«ãªã‚‹ãŸã‚ValueãŒnullã®å ´åˆã¯nullã‚’ä»£å…¥ã™ã‚‹
        const map = this.getJson()
            .getRoot()
            .getValueByString(this.layout)
            .getMap();
        if (map == null) {
            return false;
        }
        let ret = false;
        for (const element of map) {
            outLayoutMap.set(element[0], element[1].toFloat());
            ret = true;
        }
        return ret;
    }
    /**
     * ç›®ãƒ‘ãƒã«é–¢é€£ä»˜ã‘ã‚‰ã‚ŒãŸãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®æ•°ã‚’å–å¾—ã™ã‚‹
     * @return ç›®ãƒ‘ãƒã«é–¢é€£ä»˜ã‘ã‚‰ã‚ŒãŸãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®æ•°
     */
    getEyeBlinkParameterCount() {
        if (!this.isExistEyeBlinkParameters()) {
            return 0;
        }
        let num = 0;
        for (let i = 0; i < this._jsonValue[FrequestNode.FrequestNode_Groups].getSize(); i++) {
            const refI = this._jsonValue[FrequestNode.FrequestNode_Groups].getValueByIndex(i);
            if (refI.isNull() || refI.isError()) {
                continue;
            }
            if (refI.getValueByString(this.name).getRawString() == this.eyeBlink) {
                num = refI.getValueByString(this.ids).getVector().length;
                break;
            }
        }
        return num;
    }
    /**
     * ç›®ãƒ‘ãƒã«é–¢é€£ä»˜ã‘ã‚‰ã‚ŒãŸãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®IDã‚’å–å¾—ã™ã‚‹
     * @param index é…åˆ—ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹å€¤
     * @return ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ID
     */
    getEyeBlinkParameterId(index) {
        if (!this.isExistEyeBlinkParameters()) {
            return null;
        }
        for (let i = 0; i < this._jsonValue[FrequestNode.FrequestNode_Groups].getSize(); i++) {
            const refI = this._jsonValue[FrequestNode.FrequestNode_Groups].getValueByIndex(i);
            if (refI.isNull() || refI.isError()) {
                continue;
            }
            if (refI.getValueByString(this.name).getRawString() == this.eyeBlink) {
                return CubismFramework.getIdManager().getId(refI.getValueByString(this.ids).getValueByIndex(index).getRawString());
            }
        }
        return null;
    }
    /**
     * ãƒªãƒƒãƒ—ã‚·ãƒ³ã‚¯ã«é–¢é€£ä»˜ã‘ã‚‰ã‚ŒãŸãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®æ•°ã‚’å–å¾—ã™ã‚‹
     * @return ãƒªãƒƒãƒ—ã‚·ãƒ³ã‚¯ã«é–¢é€£ä»˜ã‘ã‚‰ã‚ŒãŸãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®æ•°
     */
    getLipSyncParameterCount() {
        if (!this.isExistLipSyncParameters()) {
            return 0;
        }
        let num = 0;
        for (let i = 0; i < this._jsonValue[FrequestNode.FrequestNode_Groups].getSize(); i++) {
            const refI = this._jsonValue[FrequestNode.FrequestNode_Groups].getValueByIndex(i);
            if (refI.isNull() || refI.isError()) {
                continue;
            }
            if (refI.getValueByString(this.name).getRawString() == this.lipSync) {
                num = refI.getValueByString(this.ids).getVector().length;
                break;
            }
        }
        return num;
    }
    /**
     * ãƒªãƒƒãƒ—ã‚·ãƒ³ã‚¯ã«é–¢é€£ä»˜ã‘ã‚‰ã‚ŒãŸãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã®æ•°ã‚’å–å¾—ã™ã‚‹
     * @param index é…åˆ—ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹å€¤
     * @return ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ID
     */
    getLipSyncParameterId(index) {
        if (!this.isExistLipSyncParameters()) {
            return null;
        }
        for (let i = 0; i < this._jsonValue[FrequestNode.FrequestNode_Groups].getSize(); i++) {
            const refI = this._jsonValue[FrequestNode.FrequestNode_Groups].getValueByIndex(i);
            if (refI.isNull() || refI.isError()) {
                continue;
            }
            if (refI.getValueByString(this.name).getRawString() == this.lipSync) {
                return CubismFramework.getIdManager().getId(refI.getValueByString(this.ids).getValueByIndex(index).getRawString());
            }
        }
        return null;
    }
    /**
     * ãƒ¢ãƒ‡ãƒ«ãƒ•ã‚¡ã‚¤ãƒ«ã®ã‚­ãƒ¼ãŒå­˜åœ¨ã™ã‚‹ã‹ã©ã†ã‹ã‚’ç¢ºèªã™ã‚‹
     * @return true ã‚­ãƒ¼ãŒå­˜åœ¨ã™ã‚‹
     * @return false ã‚­ãƒ¼ãŒå­˜åœ¨ã—ãªã„
     */
    isExistModelFile() {
        const node = this._jsonValue[FrequestNode.FrequestNode_Moc];
        return !node.isNull() && !node.isError();
    }
    /**
     * ãƒ†ã‚¯ã‚¹ãƒãƒ£ãƒ•ã‚¡ã‚¤ãƒ«ã®ã‚­ãƒ¼ãŒå­˜åœ¨ã™ã‚‹ã‹ã©ã†ã‹ã‚’ç¢ºèªã™ã‚‹
     * @return true ã‚­ãƒ¼ãŒå­˜åœ¨ã™ã‚‹
     * @return false ã‚­ãƒ¼ãŒå­˜åœ¨ã—ãªã„
     */
    isExistTextureFiles() {
        const node = this._jsonValue[FrequestNode.FrequestNode_Textures];
        return !node.isNull() && !node.isError();
    }
    /**
     * å½“ãŸã‚Šåˆ¤å®šã®ã‚­ãƒ¼ãŒå­˜åœ¨ã™ã‚‹ã‹ã©ã†ã‹ã‚’ç¢ºèªã™ã‚‹
     * @return true ã‚­ãƒ¼ãŒå­˜åœ¨ã™ã‚‹
     * @return false ã‚­ãƒ¼ãŒå­˜åœ¨ã—ãªã„
     */
    isExistHitAreas() {
        const node = this._jsonValue[FrequestNode.FrequestNode_HitAreas];
        return !node.isNull() && !node.isError();
    }
    /**
     * ç‰©ç†æ¼”ç®—ãƒ•ã‚¡ã‚¤ãƒ«ã®ã‚­ãƒ¼ãŒå­˜åœ¨ã™ã‚‹ã‹ã©ã†ã‹ã‚’ç¢ºèªã™ã‚‹
     * @return true ã‚­ãƒ¼ãŒå­˜åœ¨ã™ã‚‹
     * @return false ã‚­ãƒ¼ãŒå­˜åœ¨ã—ãªã„
     */
    isExistPhysicsFile() {
        const node = this._jsonValue[FrequestNode.FrequestNode_Physics];
        return !node.isNull() && !node.isError();
    }
    /**
     * ãƒãƒ¼ã‚ºè¨­å®šãƒ•ã‚¡ã‚¤ãƒ«ã®ã‚­ãƒ¼ãŒå­˜åœ¨ã™ã‚‹ã‹ã©ã†ã‹ã‚’ç¢ºèªã™ã‚‹
     * @return true ã‚­ãƒ¼ãŒå­˜åœ¨ã™ã‚‹
     * @return false ã‚­ãƒ¼ãŒå­˜åœ¨ã—ãªã„
     */
    isExistPoseFile() {
        const node = this._jsonValue[FrequestNode.FrequestNode_Pose];
        return !node.isNull() && !node.isError();
    }
    /**
     * è¡¨æƒ…è¨­å®šãƒ•ã‚¡ã‚¤ãƒ«ã®ã‚­ãƒ¼ãŒå­˜åœ¨ã™ã‚‹ã‹ã©ã†ã‹ã‚’ç¢ºèªã™ã‚‹
     * @return true ã‚­ãƒ¼ãŒå­˜åœ¨ã™ã‚‹
     * @return false ã‚­ãƒ¼ãŒå­˜åœ¨ã—ãªã„
     */
    isExistExpressionFile() {
        const node = this._jsonValue[FrequestNode.FrequestNode_Expressions];
        return !node.isNull() && !node.isError();
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã‚°ãƒ«ãƒ¼ãƒ—ã®ã‚­ãƒ¼ãŒå­˜åœ¨ã™ã‚‹ã‹ã©ã†ã‹ã‚’ç¢ºèªã™ã‚‹
     * @return true ã‚­ãƒ¼ãŒå­˜åœ¨ã™ã‚‹
     * @return false ã‚­ãƒ¼ãŒå­˜åœ¨ã—ãªã„
     */
    isExistMotionGroups() {
        const node = this._jsonValue[FrequestNode.FrequestNode_Motions];
        return !node.isNull() && !node.isError();
    }
    /**
     * å¼•æ•°ã§æŒ‡å®šã—ãŸãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã‚°ãƒ«ãƒ¼ãƒ—ã®ã‚­ãƒ¼ãŒå­˜åœ¨ã™ã‚‹ã‹ã©ã†ã‹ã‚’ç¢ºèªã™ã‚‹
     * @param groupName  ã‚°ãƒ«ãƒ¼ãƒ—å
     * @return true ã‚­ãƒ¼ãŒå­˜åœ¨ã™ã‚‹
     * @return false ã‚­ãƒ¼ãŒå­˜åœ¨ã—ãªã„
     */
    isExistMotionGroupName(groupName) {
        const node = this._jsonValue[FrequestNode.FrequestNode_Motions].getValueByString(groupName);
        return !node.isNull() && !node.isError();
    }
    /**
     * å¼•æ•°ã§æŒ‡å®šã—ãŸãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã«å¯¾å¿œã™ã‚‹ã‚µã‚¦ãƒ³ãƒ‰ãƒ•ã‚¡ã‚¤ãƒ«ã®ã‚­ãƒ¼ãŒå­˜åœ¨ã™ã‚‹ã‹ã©ã†ã‹ã‚’ç¢ºèªã™ã‚‹
     * @param groupName  ã‚°ãƒ«ãƒ¼ãƒ—å
     * @param index é…åˆ—ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹å€¤
     * @return true ã‚­ãƒ¼ãŒå­˜åœ¨ã™ã‚‹
     * @return false ã‚­ãƒ¼ãŒå­˜åœ¨ã—ãªã„
     */
    isExistMotionSoundFile(groupName, index) {
        const node = this._jsonValue[FrequestNode.FrequestNode_Motions]
            .getValueByString(groupName)
            .getValueByIndex(index)
            .getValueByString(this.soundPath);
        return !node.isNull() && !node.isError();
    }
    /**
     * å¼•æ•°ã§æŒ‡å®šã—ãŸãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã«å¯¾å¿œã™ã‚‹ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¤ãƒ³æ™‚é–“ã®ã‚­ãƒ¼ãŒå­˜åœ¨ã™ã‚‹ã‹ã©ã†ã‹ã‚’ç¢ºèªã™ã‚‹
     * @param groupName  ã‚°ãƒ«ãƒ¼ãƒ—å
     * @param index é…åˆ—ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹å€¤
     * @return true ã‚­ãƒ¼ãŒå­˜åœ¨ã™ã‚‹
     * @return false ã‚­ãƒ¼ãŒå­˜åœ¨ã—ãªã„
     */
    isExistMotionFadeIn(groupName, index) {
        const node = this._jsonValue[FrequestNode.FrequestNode_Motions]
            .getValueByString(groupName)
            .getValueByIndex(index)
            .getValueByString(this.fadeInTime);
        return !node.isNull() && !node.isError();
    }
    /**
     * å¼•æ•°ã§æŒ‡å®šã—ãŸãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã«å¯¾å¿œã™ã‚‹ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¢ã‚¦ãƒˆæ™‚é–“ã®ã‚­ãƒ¼ãŒå­˜åœ¨ã™ã‚‹ã‹ã©ã†ã‹ã‚’ç¢ºèªã™ã‚‹
     * @param groupName  ã‚°ãƒ«ãƒ¼ãƒ—å
     * @param index é…åˆ—ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹å€¤
     * @return true ã‚­ãƒ¼ãŒå­˜åœ¨ã™ã‚‹
     * @return false ã‚­ãƒ¼ãŒå­˜åœ¨ã—ãªã„
     */
    isExistMotionFadeOut(groupName, index) {
        const node = this._jsonValue[FrequestNode.FrequestNode_Motions]
            .getValueByString(groupName)
            .getValueByIndex(index)
            .getValueByString(this.fadeOutTime);
        return !node.isNull() && !node.isError();
    }
    /**
     * UserDataã®ãƒ•ã‚¡ã‚¤ãƒ«åãŒå­˜åœ¨ã™ã‚‹ã‹ã©ã†ã‹ã‚’ç¢ºèªã™ã‚‹
     * @return true ã‚­ãƒ¼ãŒå­˜åœ¨ã™ã‚‹
     * @return false ã‚­ãƒ¼ãŒå­˜åœ¨ã—ãªã„
     */
    isExistUserDataFile() {
        const node = this.getJson()
            .getRoot()
            .getValueByString(this.fileReferences)
            .getValueByString(this.userData);
        return !node.isNull() && !node.isError();
    }
    /**
     * ç›®ã±ã¡ã«å¯¾å¿œä»˜ã‘ã‚‰ã‚ŒãŸãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ãŒå­˜åœ¨ã™ã‚‹ã‹ã©ã†ã‹ã‚’ç¢ºèªã™ã‚‹
     * @return true ã‚­ãƒ¼ãŒå­˜åœ¨ã™ã‚‹
     * @return false ã‚­ãƒ¼ãŒå­˜åœ¨ã—ãªã„
     */
    isExistEyeBlinkParameters() {
        if (this._jsonValue[FrequestNode.FrequestNode_Groups].isNull() ||
            this._jsonValue[FrequestNode.FrequestNode_Groups].isError()) {
            return false;
        }
        for (let i = 0; i < this._jsonValue[FrequestNode.FrequestNode_Groups].getSize(); ++i) {
            if (this._jsonValue[FrequestNode.FrequestNode_Groups]
                .getValueByIndex(i)
                .getValueByString(this.name)
                .getRawString() == this.eyeBlink) {
                return true;
            }
        }
        return false;
    }
    /**
     * ãƒªãƒƒãƒ—ã‚·ãƒ³ã‚¯ã«å¯¾å¿œä»˜ã‘ã‚‰ã‚ŒãŸãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ãŒå­˜åœ¨ã™ã‚‹ã‹ã©ã†ã‹ã‚’ç¢ºèªã™ã‚‹
     * @return true ã‚­ãƒ¼ãŒå­˜åœ¨ã™ã‚‹
     * @return false ã‚­ãƒ¼ãŒå­˜åœ¨ã—ãªã„
     */
    isExistLipSyncParameters() {
        if (this._jsonValue[FrequestNode.FrequestNode_Groups].isNull() ||
            this._jsonValue[FrequestNode.FrequestNode_Groups].isError()) {
            return false;
        }
        for (let i = 0; i < this._jsonValue[FrequestNode.FrequestNode_Groups].getSize(); ++i) {
            if (this._jsonValue[FrequestNode.FrequestNode_Groups]
                .getValueByIndex(i)
                .getValueByString(this.name)
                .getRawString() == this.lipSync) {
                return true;
            }
        }
        return false;
    }
}
// Namespace definition for compatibility.
import * as $ from './cubismmodelsettingjson.js';
// eslint-disable-next-line @typescript-eslint/no-namespace
export var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    Live2DCubismFramework.CubismModelSettingJson = $.CubismModelSettingJson;
    Live2DCubismFramework.FrequestNode = $.FrequestNode;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));
//# sourceMappingURL=cubismmodelsettingjson.js.map