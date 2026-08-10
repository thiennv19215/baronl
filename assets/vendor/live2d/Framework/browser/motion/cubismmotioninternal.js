/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
/**
 * @brief ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã‚«ãƒ¼ãƒ–ã®ç¨®é¡ž
 *
 * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã‚«ãƒ¼ãƒ–ã®ç¨®é¡žã€‚
 */
export var CubismMotionCurveTarget;
(function (CubismMotionCurveTarget) {
    CubismMotionCurveTarget[CubismMotionCurveTarget["CubismMotionCurveTarget_Model"] = 0] = "CubismMotionCurveTarget_Model";
    CubismMotionCurveTarget[CubismMotionCurveTarget["CubismMotionCurveTarget_Parameter"] = 1] = "CubismMotionCurveTarget_Parameter";
    CubismMotionCurveTarget[CubismMotionCurveTarget["CubismMotionCurveTarget_PartOpacity"] = 2] = "CubismMotionCurveTarget_PartOpacity"; // ãƒ‘ãƒ¼ãƒ„ã®ä¸é€æ˜Žåº¦ã«å¯¾ã—ã¦
})(CubismMotionCurveTarget || (CubismMotionCurveTarget = {}));
/**
 * @brief ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã‚«ãƒ¼ãƒ–ã®ã‚»ã‚°ãƒ¡ãƒ³ãƒˆã®ç¨®é¡ž
 *
 * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã‚«ãƒ¼ãƒ–ã®ã‚»ã‚°ãƒ¡ãƒ³ãƒˆã®ç¨®é¡žã€‚
 */
export var CubismMotionSegmentType;
(function (CubismMotionSegmentType) {
    CubismMotionSegmentType[CubismMotionSegmentType["CubismMotionSegmentType_Linear"] = 0] = "CubismMotionSegmentType_Linear";
    CubismMotionSegmentType[CubismMotionSegmentType["CubismMotionSegmentType_Bezier"] = 1] = "CubismMotionSegmentType_Bezier";
    CubismMotionSegmentType[CubismMotionSegmentType["CubismMotionSegmentType_Stepped"] = 2] = "CubismMotionSegmentType_Stepped";
    CubismMotionSegmentType[CubismMotionSegmentType["CubismMotionSegmentType_InverseStepped"] = 3] = "CubismMotionSegmentType_InverseStepped"; // ã‚¤ãƒ³ãƒãƒ¼ã‚¹ã‚¹ãƒ†ãƒƒãƒ—
})(CubismMotionSegmentType || (CubismMotionSegmentType = {}));
/**
 * @brief ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã‚«ãƒ¼ãƒ–ã®åˆ¶å¾¡ç‚¹
 *
 * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã‚«ãƒ¼ãƒ–ã®åˆ¶å¾¡ç‚¹ã€‚
 */
export class CubismMotionPoint {
    constructor() {
        this.time = 0.0; // æ™‚é–“[ç§’]
        this.value = 0.0; // å€¤
    }
}
/**
 * @brief ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã‚«ãƒ¼ãƒ–ã®ã‚»ã‚°ãƒ¡ãƒ³ãƒˆ
 *
 * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã‚«ãƒ¼ãƒ–ã®ã‚»ã‚°ãƒ¡ãƒ³ãƒˆã€‚
 */
export class CubismMotionSegment {
    /**
     * @brief ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     *
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿ã€‚
     */
    constructor() {
        this.evaluate = null;
        this.basePointIndex = 0;
        this.segmentType = 0;
    }
}
/**
 * @brief ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã‚«ãƒ¼ãƒ–
 *
 * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã‚«ãƒ¼ãƒ–ã€‚
 */
export class CubismMotionCurve {
    constructor() {
        this.type = CubismMotionCurveTarget.CubismMotionCurveTarget_Model;
        this.segmentCount = 0;
        this.baseSegmentIndex = 0;
        this.fadeInTime = 0.0;
        this.fadeOutTime = 0.0;
    }
}
/**
 * ã‚¤ãƒ™ãƒ³ãƒˆã€‚
 */
export class CubismMotionEvent {
    constructor() {
        this.fireTime = 0.0;
    }
}
/**
 * @brief ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ãƒ‡ãƒ¼ã‚¿
 *
 * ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ãƒ‡ãƒ¼ã‚¿ã€‚
 */
export class CubismMotionData {
    constructor() {
        this.duration = 0.0;
        this.loop = false;
        this.curveCount = 0;
        this.eventCount = 0;
        this.fps = 0.0;
        this.curves = new Array();
        this.segments = new Array();
        this.points = new Array();
        this.events = new Array();
    }
}
// Namespace definition for compatibility.
import * as $ from './cubismmotioninternal.js';
// eslint-disable-next-line @typescript-eslint/no-namespace
export var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    Live2DCubismFramework.CubismMotionCurve = $.CubismMotionCurve;
    Live2DCubismFramework.CubismMotionCurveTarget = $.CubismMotionCurveTarget;
    Live2DCubismFramework.CubismMotionData = $.CubismMotionData;
    Live2DCubismFramework.CubismMotionEvent = $.CubismMotionEvent;
    Live2DCubismFramework.CubismMotionPoint = $.CubismMotionPoint;
    Live2DCubismFramework.CubismMotionSegment = $.CubismMotionSegment;
    Live2DCubismFramework.CubismMotionSegmentType = $.CubismMotionSegmentType;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));
//# sourceMappingURL=cubismmotioninternal.js.map