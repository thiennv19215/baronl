/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
import { CubismFramework } from '../live2dcubismframework.js';
import { CSM_ASSERT, CubismLogWarning } from '../utils/cubismdebug.js';
import { CubismJson } from '../utils/cubismjson.js';
import { CubismMotionSegmentType } from './cubismmotioninternal.js';
// JSON keys
const Meta = 'Meta';
const Duration = 'Duration';
const Loop = 'Loop';
const AreBeziersRestricted = 'AreBeziersRestricted';
const CurveCount = 'CurveCount';
const Fps = 'Fps';
const TotalSegmentCount = 'TotalSegmentCount';
const TotalPointCount = 'TotalPointCount';
const Curves = 'Curves';
const Target = 'Target';
const Id = 'Id';
const FadeInTime = 'FadeInTime';
const FadeOutTime = 'FadeOutTime';
const Segments = 'Segments';
const UserData = 'UserData';
const UserDataCount = 'UserDataCount';
const TotalUserDataSize = 'TotalUserDataSize';
const Time = 'Time';
const Value = 'Value';
/**
 * motion3.jsonã®ã‚³ãƒ³ãƒ†ãƒŠã€‚
 */
export class CubismMotionJson {
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     * @param buffer motion3.jsonãŒèª­ã¿è¾¼ã¾ã‚Œã¦ã„ã‚‹ãƒãƒƒãƒ•ã‚¡
     * @param size ãƒãƒƒãƒ•ã‚¡ã®ã‚µã‚¤ã‚º
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
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®é•·ã•ã‚’å–å¾—ã™ã‚‹
     * @return ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®é•·ã•[ç§’]
     */
    getMotionDuration() {
        return this._json
            .getRoot()
            .getValueByString(Meta)
            .getValueByString(Duration)
            .toFloat();
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®ãƒ«ãƒ¼ãƒ—æƒ…å ±ã®å–å¾—
     * @return true ãƒ«ãƒ¼ãƒ—ã™ã‚‹
     * @return false ãƒ«ãƒ¼ãƒ—ã—ãªã„
     */
    isMotionLoop() {
        return this._json
            .getRoot()
            .getValueByString(Meta)
            .getValueByString(Loop)
            .toBoolean();
    }
    /**
     *  motion3.jsonãƒ•ã‚¡ã‚¤ãƒ«ã®æ•´åˆæ€§ãƒã‚§ãƒƒã‚¯
     *
     * @return æ­£å¸¸ãªãƒ•ã‚¡ã‚¤ãƒ«ã®å ´åˆã¯trueã‚’è¿”ã™ã€‚
     */
    hasConsistency() {
        let result = true;
        if (!this._json || !this._json.getRoot()) {
            return false;
        }
        const actualCurveListSize = this._json
            .getRoot()
            .getValueByString(Curves)
            .getVector().length;
        let actualTotalSegmentCount = 0;
        let actualTotalPointCount = 0;
        // ã‚«ã‚¦ãƒ³ãƒˆå‡¦ç†
        for (let curvePosition = 0; curvePosition < actualCurveListSize; ++curvePosition) {
            for (let segmentPosition = 0; segmentPosition < this.getMotionCurveSegmentCount(curvePosition);) {
                if (segmentPosition == 0) {
                    actualTotalPointCount += 1;
                    segmentPosition += 2;
                }
                const segment = this.getMotionCurveSegment(curvePosition, segmentPosition);
                switch (segment) {
                    case CubismMotionSegmentType.CubismMotionSegmentType_Linear:
                        actualTotalPointCount += 1;
                        segmentPosition += 3;
                        break;
                    case CubismMotionSegmentType.CubismMotionSegmentType_Bezier:
                        actualTotalPointCount += 3;
                        segmentPosition += 7;
                        break;
                    case CubismMotionSegmentType.CubismMotionSegmentType_Stepped:
                        actualTotalPointCount += 1;
                        segmentPosition += 3;
                        break;
                    case CubismMotionSegmentType.CubismMotionSegmentType_InverseStepped:
                        actualTotalPointCount += 1;
                        segmentPosition += 3;
                        break;
                    default:
                        CSM_ASSERT(0);
                        break;
                }
                ++actualTotalSegmentCount;
            }
        }
        // å€‹æ•°ãƒã‚§ãƒƒã‚¯
        if (actualCurveListSize != this.getMotionCurveCount()) {
            CubismLogWarning('The number of curves does not match the metadata.');
            result = false;
        }
        if (actualTotalSegmentCount != this.getMotionTotalSegmentCount()) {
            CubismLogWarning('The number of segment does not match the metadata.');
            result = false;
        }
        if (actualTotalPointCount != this.getMotionTotalPointCount()) {
            CubismLogWarning('The number of point does not match the metadata.');
            result = false;
        }
        return result;
    }
    getEvaluationOptionFlag(flagType) {
        if (EvaluationOptionFlag.EvaluationOptionFlag_AreBeziersRistricted == flagType) {
            return this._json
                .getRoot()
                .getValueByString(Meta)
                .getValueByString(AreBeziersRestricted)
                .toBoolean();
        }
        return false;
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã‚«ãƒ¼ãƒ–ã®å€‹æ•°ã®å–å¾—
     * @return ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã‚«ãƒ¼ãƒ–ã®å€‹æ•°
     */
    getMotionCurveCount() {
        return this._json
            .getRoot()
            .getValueByString(Meta)
            .getValueByString(CurveCount)
            .toInt();
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®ãƒ•ãƒ¬ãƒ¼ãƒ ãƒ¬ãƒ¼ãƒˆã®å–å¾—
     * @return ãƒ•ãƒ¬ãƒ¼ãƒ ãƒ¬ãƒ¼ãƒˆ[FPS]
     */
    getMotionFps() {
        return this._json
            .getRoot()
            .getValueByString(Meta)
            .getValueByString(Fps)
            .toFloat();
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®ã‚»ã‚°ãƒ¡ãƒ³ãƒˆã®ç·åˆè¨ˆã®å–å¾—
     * @return ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®ã‚»ã‚°ãƒ¡ãƒ³ãƒˆã®å–å¾—
     */
    getMotionTotalSegmentCount() {
        return this._json
            .getRoot()
            .getValueByString(Meta)
            .getValueByString(TotalSegmentCount)
            .toInt();
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®ã‚«ãƒ¼ãƒ–ã®åˆ¶å¾¡åº—ã®ç·åˆè¨ˆã®å–å¾—
     * @return ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®ã‚«ãƒ¼ãƒ–ã®åˆ¶å¾¡ç‚¹ã®ç·åˆè¨ˆ
     */
    getMotionTotalPointCount() {
        return this._json
            .getRoot()
            .getValueByString(Meta)
            .getValueByString(TotalPointCount)
            .toInt();
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¤ãƒ³æ™‚é–“ã®å­˜åœ¨
     * @return true å­˜åœ¨ã™ã‚‹
     * @return false å­˜åœ¨ã—ãªã„
     */
    isExistMotionFadeInTime() {
        return !this._json
            .getRoot()
            .getValueByString(Meta)
            .getValueByString(FadeInTime)
            .isNull();
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¢ã‚¦ãƒˆæ™‚é–“ã®å­˜åœ¨
     * @return true å­˜åœ¨ã™ã‚‹
     * @return false å­˜åœ¨ã—ãªã„
     */
    isExistMotionFadeOutTime() {
        return !this._json
            .getRoot()
            .getValueByString(Meta)
            .getValueByString(FadeOutTime)
            .isNull();
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¤ãƒ³æ™‚é–“ã®å–å¾—
     * @return ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¤ãƒ³æ™‚é–“[ç§’]
     */
    getMotionFadeInTime() {
        return this._json
            .getRoot()
            .getValueByString(Meta)
            .getValueByString(FadeInTime)
            .toFloat();
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¢ã‚¦ãƒˆæ™‚é–“ã®å–å¾—
     * @return ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¢ã‚¦ãƒˆæ™‚é–“[ç§’]
     */
    getMotionFadeOutTime() {
        return this._json
            .getRoot()
            .getValueByString(Meta)
            .getValueByString(FadeOutTime)
            .toFloat();
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®ã‚«ãƒ¼ãƒ–ã®ç¨®é¡žã®å–å¾—
     * @param curveIndex ã‚«ãƒ¼ãƒ–ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return ã‚«ãƒ¼ãƒ–ã®ç¨®é¡ž
     */
    getMotionCurveTarget(curveIndex) {
        return this._json
            .getRoot()
            .getValueByString(Curves)
            .getValueByIndex(curveIndex)
            .getValueByString(Target)
            .getRawString();
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®ã‚«ãƒ¼ãƒ–ã®IDã®å–å¾—
     * @param curveIndex ã‚«ãƒ¼ãƒ–ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return ã‚«ãƒ¼ãƒ–ã®ID
     */
    getMotionCurveId(curveIndex) {
        return CubismFramework.getIdManager().getId(this._json
            .getRoot()
            .getValueByString(Curves)
            .getValueByIndex(curveIndex)
            .getValueByString(Id)
            .getRawString());
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®ã‚«ãƒ¼ãƒ–ã®ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¤ãƒ³æ™‚é–“ã®å­˜åœ¨
     * @param curveIndex ã‚«ãƒ¼ãƒ–ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return true å­˜åœ¨ã™ã‚‹
     * @return false å­˜åœ¨ã—ãªã„
     */
    isExistMotionCurveFadeInTime(curveIndex) {
        return !this._json
            .getRoot()
            .getValueByString(Curves)
            .getValueByIndex(curveIndex)
            .getValueByString(FadeInTime)
            .isNull();
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®ã‚«ãƒ¼ãƒ–ã®ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¢ã‚¦ãƒˆæ™‚é–“ã®å­˜åœ¨
     * @param curveIndex ã‚«ãƒ¼ãƒ–ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return true å­˜åœ¨ã™ã‚‹
     * @return false å­˜åœ¨ã—ãªã„
     */
    isExistMotionCurveFadeOutTime(curveIndex) {
        return !this._json
            .getRoot()
            .getValueByString(Curves)
            .getValueByIndex(curveIndex)
            .getValueByString(FadeOutTime)
            .isNull();
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®ã‚«ãƒ¼ãƒ–ã®ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¤ãƒ³æ™‚é–“ã®å–å¾—
     * @param curveIndex ã‚«ãƒ¼ãƒ–ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¤ãƒ³æ™‚é–“[ç§’]
     */
    getMotionCurveFadeInTime(curveIndex) {
        return this._json
            .getRoot()
            .getValueByString(Curves)
            .getValueByIndex(curveIndex)
            .getValueByString(FadeInTime)
            .toFloat();
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®ã‚«ãƒ¼ãƒ–ã®ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¢ã‚¦ãƒˆæ™‚é–“ã®å–å¾—
     * @param curveIndex ã‚«ãƒ¼ãƒ–ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¢ã‚¦ãƒˆæ™‚é–“[ç§’]
     */
    getMotionCurveFadeOutTime(curveIndex) {
        return this._json
            .getRoot()
            .getValueByString(Curves)
            .getValueByIndex(curveIndex)
            .getValueByString(FadeOutTime)
            .toFloat();
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®ã‚«ãƒ¼ãƒ–ã®ã‚»ã‚°ãƒ¡ãƒ³ãƒˆã®å€‹æ•°ã‚’å–å¾—ã™ã‚‹
     * @param curveIndex ã‚«ãƒ¼ãƒ–ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®ã‚«ãƒ¼ãƒ–ã®ã‚»ã‚°ãƒ¡ãƒ³ãƒˆã®å€‹æ•°
     */
    getMotionCurveSegmentCount(curveIndex) {
        return this._json
            .getRoot()
            .getValueByString(Curves)
            .getValueByIndex(curveIndex)
            .getValueByString(Segments)
            .getVector().length;
    }
    /**
     * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã®ã‚«ãƒ¼ãƒ–ã®ã‚»ã‚°ãƒ¡ãƒ³ãƒˆã®å€¤ã®å–å¾—
     * @param curveIndex ã‚«ãƒ¼ãƒ–ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @param segmentIndex ã‚»ã‚°ãƒ¡ãƒ³ãƒˆã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return ã‚»ã‚°ãƒ¡ãƒ³ãƒˆã®å€¤
     */
    getMotionCurveSegment(curveIndex, segmentIndex) {
        return this._json
            .getRoot()
            .getValueByString(Curves)
            .getValueByIndex(curveIndex)
            .getValueByString(Segments)
            .getValueByIndex(segmentIndex)
            .toFloat();
    }
    /**
     * ã‚¤ãƒ™ãƒ³ãƒˆã®å€‹æ•°ã®å–å¾—
     * @return ã‚¤ãƒ™ãƒ³ãƒˆã®å€‹æ•°
     */
    getEventCount() {
        return this._json
            .getRoot()
            .getValueByString(Meta)
            .getValueByString(UserDataCount)
            .toInt();
    }
    /**
     *  ã‚¤ãƒ™ãƒ³ãƒˆã®ç·æ–‡å­—æ•°ã®å–å¾—
     * @return ã‚¤ãƒ™ãƒ³ãƒˆã®ç·æ–‡å­—æ•°
     */
    getTotalEventValueSize() {
        return this._json
            .getRoot()
            .getValueByString(Meta)
            .getValueByString(TotalUserDataSize)
            .toInt();
    }
    /**
     * ã‚¤ãƒ™ãƒ³ãƒˆã®æ™‚é–“ã®å–å¾—
     * @param userDataIndex ã‚¤ãƒ™ãƒ³ãƒˆã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return ã‚¤ãƒ™ãƒ³ãƒˆã®æ™‚é–“[ç§’]
     */
    getEventTime(userDataIndex) {
        return this._json
            .getRoot()
            .getValueByString(UserData)
            .getValueByIndex(userDataIndex)
            .getValueByString(Time)
            .toFloat();
    }
    /**
     * ã‚¤ãƒ™ãƒ³ãƒˆã®å–å¾—
     * @param userDataIndex ã‚¤ãƒ™ãƒ³ãƒˆã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return ã‚¤ãƒ™ãƒ³ãƒˆã®æ–‡å­—åˆ—
     */
    getEventValue(userDataIndex) {
        return this._json
            .getRoot()
            .getValueByString(UserData)
            .getValueByIndex(userDataIndex)
            .getValueByString(Value)
            .getRawString();
    }
}
/**
 * @brief ãƒ™ã‚¸ã‚§ã‚«ãƒ¼ãƒ–ã®è§£é‡ˆæ–¹æ³•ã®ãƒ•ãƒ©ã‚°ã‚¿ã‚¤ãƒ—
 */
export var EvaluationOptionFlag;
(function (EvaluationOptionFlag) {
    EvaluationOptionFlag[EvaluationOptionFlag["EvaluationOptionFlag_AreBeziersRistricted"] = 0] = "EvaluationOptionFlag_AreBeziersRistricted"; ///< ãƒ™ã‚¸ã‚§ãƒãƒ³ãƒ‰ãƒ«ã®è¦åˆ¶çŠ¶æ…‹
})(EvaluationOptionFlag || (EvaluationOptionFlag = {}));
// Namespace definition for compatibility.
import * as $ from './cubismmotionjson.js';
// eslint-disable-next-line @typescript-eslint/no-namespace
export var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    Live2DCubismFramework.CubismMotionJson = $.CubismMotionJson;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));
//# sourceMappingURL=cubismmotionjson.js.map