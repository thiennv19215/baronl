/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
import { CubismVector2 } from '../math/cubismvector2.js';
/**
 * ç‰©ç†æ¼”ç®—ã®é©ç”¨å…ˆã®ç¨®é¡ž
 */
export var CubismPhysicsTargetType;
(function (CubismPhysicsTargetType) {
    CubismPhysicsTargetType[CubismPhysicsTargetType["CubismPhysicsTargetType_Parameter"] = 0] = "CubismPhysicsTargetType_Parameter"; // ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿ã«å¯¾ã—ã¦é©ç”¨
})(CubismPhysicsTargetType || (CubismPhysicsTargetType = {}));
/**
 * ç‰©ç†æ¼”ç®—ã®å…¥åŠ›ã®ç¨®é¡ž
 */
export var CubismPhysicsSource;
(function (CubismPhysicsSource) {
    CubismPhysicsSource[CubismPhysicsSource["CubismPhysicsSource_X"] = 0] = "CubismPhysicsSource_X";
    CubismPhysicsSource[CubismPhysicsSource["CubismPhysicsSource_Y"] = 1] = "CubismPhysicsSource_Y";
    CubismPhysicsSource[CubismPhysicsSource["CubismPhysicsSource_Angle"] = 2] = "CubismPhysicsSource_Angle"; // è§’åº¦ã‹ã‚‰
})(CubismPhysicsSource || (CubismPhysicsSource = {}));
/**
 * @brief ç‰©ç†æ¼”ç®—ã§ä½¿ç”¨ã™ã‚‹å¤–éƒ¨ã®åŠ›
 *
 * ç‰©ç†æ¼”ç®—ã§ä½¿ç”¨ã™ã‚‹å¤–éƒ¨ã®åŠ›ã€‚
 */
export class PhysicsJsonEffectiveForces {
    constructor() {
        this.gravity = new CubismVector2(0, 0);
        this.wind = new CubismVector2(0, 0);
    }
}
/**
 * ç‰©ç†æ¼”ç®—ã®ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿æƒ…å ±
 */
export class CubismPhysicsParameter {
}
/**
 * ç‰©ç†æ¼”ç®—ã®æ­£è¦åŒ–æƒ…å ±
 */
export class CubismPhysicsNormalization {
}
/**
 * ç‰©ç†æ¼”ç®—ã®æ¼”ç®—å§”ä½¿ç”¨ã™ã‚‹ç‰©ç†ç‚¹ã®æƒ…å ±
 */
export class CubismPhysicsParticle {
    constructor() {
        this.initialPosition = new CubismVector2(0, 0);
        this.position = new CubismVector2(0, 0);
        this.lastPosition = new CubismVector2(0, 0);
        this.lastGravity = new CubismVector2(0, 0);
        this.force = new CubismVector2(0, 0);
        this.velocity = new CubismVector2(0, 0);
    }
}
/**
 * ç‰©ç†æ¼”ç®—ã®ç‰©ç†ç‚¹ã®ç®¡ç†
 */
export class CubismPhysicsSubRig {
    constructor() {
        this.normalizationPosition = new CubismPhysicsNormalization();
        this.normalizationAngle = new CubismPhysicsNormalization();
    }
}
/**
 * ç‰©ç†æ¼”ç®—ã®å…¥åŠ›æƒ…å ±
 */
export class CubismPhysicsInput {
    constructor() {
        this.source = new CubismPhysicsParameter();
    }
}
/**
 * @brief ç‰©ç†æ¼”ç®—ã®å‡ºåŠ›æƒ…å ±
 *
 * ç‰©ç†æ¼”ç®—ã®å‡ºåŠ›æƒ…å ±ã€‚
 */
export class CubismPhysicsOutput {
    constructor() {
        this.destination = new CubismPhysicsParameter();
        this.translationScale = new CubismVector2(0, 0);
    }
}
/**
 * @brief ç‰©ç†æ¼”ç®—ã®ãƒ‡ãƒ¼ã‚¿
 *
 * ç‰©ç†æ¼”ç®—ã®ãƒ‡ãƒ¼ã‚¿ã€‚
 */
export class CubismPhysicsRig {
    constructor() {
        this.settings = new Array();
        this.inputs = new Array();
        this.outputs = new Array();
        this.particles = new Array();
        this.gravity = new CubismVector2(0, 0);
        this.wind = new CubismVector2(0, 0);
        this.fps = 0.0;
    }
}
// Namespace definition for compatibility.
import * as $ from './cubismphysicsinternal.js';
// eslint-disable-next-line @typescript-eslint/no-namespace
export var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    Live2DCubismFramework.CubismPhysicsInput = $.CubismPhysicsInput;
    Live2DCubismFramework.CubismPhysicsNormalization = $.CubismPhysicsNormalization;
    Live2DCubismFramework.CubismPhysicsOutput = $.CubismPhysicsOutput;
    Live2DCubismFramework.CubismPhysicsParameter = $.CubismPhysicsParameter;
    Live2DCubismFramework.CubismPhysicsParticle = $.CubismPhysicsParticle;
    Live2DCubismFramework.CubismPhysicsRig = $.CubismPhysicsRig;
    Live2DCubismFramework.CubismPhysicsSource = $.CubismPhysicsSource;
    Live2DCubismFramework.CubismPhysicsSubRig = $.CubismPhysicsSubRig;
    Live2DCubismFramework.CubismPhysicsTargetType = $.CubismPhysicsTargetType;
    Live2DCubismFramework.PhysicsJsonEffectiveForces = $.PhysicsJsonEffectiveForces;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));
//# sourceMappingURL=cubismphysicsinternal.js.map