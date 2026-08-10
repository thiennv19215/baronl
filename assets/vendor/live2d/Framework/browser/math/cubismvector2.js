/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
/**
 * 2æ¬¡å…ƒãƒ™ã‚¯ãƒˆãƒ«åž‹
 *
 * 2æ¬¡å…ƒãƒ™ã‚¯ãƒˆãƒ«åž‹ã®æ©Ÿèƒ½ã‚’æä¾›ã™ã‚‹ã€‚
 */
export class CubismVector2 {
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.x = x == undefined ? 0.0 : x;
        this.y = y == undefined ? 0.0 : y;
    }
    /**
     * ãƒ™ã‚¯ãƒˆãƒ«ã®åŠ ç®—
     *
     * @param vector2 åŠ ç®—ã™ã‚‹ãƒ™ã‚¯ãƒˆãƒ«å€¤
     * @return åŠ ç®—çµæžœ ãƒ™ã‚¯ãƒˆãƒ«å€¤
     */
    add(vector2) {
        const ret = new CubismVector2(0.0, 0.0);
        ret.x = this.x + vector2.x;
        ret.y = this.y + vector2.y;
        return ret;
    }
    /**
     * ãƒ™ã‚¯ãƒˆãƒ«ã®æ¸›ç®—
     *
     * @param vector2 æ¸›ç®—ã™ã‚‹ãƒ™ã‚¯ãƒˆãƒ«å€¤
     * @return æ¸›ç®—çµæžœ ãƒ™ã‚¯ãƒˆãƒ«å€¤
     */
    substract(vector2) {
        const ret = new CubismVector2(0.0, 0.0);
        ret.x = this.x - vector2.x;
        ret.y = this.y - vector2.y;
        return ret;
    }
    /**
     * ãƒ™ã‚¯ãƒˆãƒ«ã®ä¹—ç®—
     *
     * @param vector2 ä¹—ç®—ã™ã‚‹ãƒ™ã‚¯ãƒˆãƒ«å€¤
     * @return ä¹—ç®—çµæžœ ãƒ™ã‚¯ãƒˆãƒ«å€¤
     */
    multiply(vector2) {
        const ret = new CubismVector2(0.0, 0.0);
        ret.x = this.x * vector2.x;
        ret.y = this.y * vector2.y;
        return ret;
    }
    /**
     * ãƒ™ã‚¯ãƒˆãƒ«ã®ä¹—ç®—(ã‚¹ã‚«ãƒ©ãƒ¼)
     *
     * @param scalar ä¹—ç®—ã™ã‚‹ã‚¹ã‚«ãƒ©ãƒ¼å€¤
     * @return ä¹—ç®—çµæžœ ãƒ™ã‚¯ãƒˆãƒ«å€¤
     */
    multiplyByScaler(scalar) {
        return this.multiply(new CubismVector2(scalar, scalar));
    }
    /**
     * ãƒ™ã‚¯ãƒˆãƒ«ã®é™¤ç®—
     *
     * @param vector2 é™¤ç®—ã™ã‚‹ãƒ™ã‚¯ãƒˆãƒ«å€¤
     * @return é™¤ç®—çµæžœ ãƒ™ã‚¯ãƒˆãƒ«å€¤
     */
    division(vector2) {
        const ret = new CubismVector2(0.0, 0.0);
        ret.x = this.x / vector2.x;
        ret.y = this.y / vector2.y;
        return ret;
    }
    /**
     * ãƒ™ã‚¯ãƒˆãƒ«ã®é™¤ç®—(ã‚¹ã‚«ãƒ©ãƒ¼)
     *
     * @param scalar é™¤ç®—ã™ã‚‹ã‚¹ã‚«ãƒ©ãƒ¼å€¤
     * @return é™¤ç®—çµæžœ ãƒ™ã‚¯ãƒˆãƒ«å€¤
     */
    divisionByScalar(scalar) {
        return this.division(new CubismVector2(scalar, scalar));
    }
    /**
     * ãƒ™ã‚¯ãƒˆãƒ«ã®é•·ã•ã‚’å–å¾—ã™ã‚‹
     *
     * @return ãƒ™ã‚¯ãƒˆãƒ«ã®é•·ã•
     */
    getLength() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    /**
     * ãƒ™ã‚¯ãƒˆãƒ«ã®è·é›¢ã®å–å¾—
     *
     * @param a ç‚¹
     * @return ãƒ™ã‚¯ãƒˆãƒ«ã®è·é›¢
     */
    getDistanceWith(a) {
        return Math.sqrt((this.x - a.x) * (this.x - a.x) + (this.y - a.y) * (this.y - a.y));
    }
    /**
     * ãƒ‰ãƒƒãƒˆç©ã®è¨ˆç®—
     *
     * @param a å€¤
     * @return çµæžœ
     */
    dot(a) {
        return this.x * a.x + this.y * a.y;
    }
    /**
     * æ­£è¦åŒ–ã®é©ç”¨
     */
    normalize() {
        const length = Math.pow(this.x * this.x + this.y * this.y, 0.5);
        this.x = this.x / length;
        this.y = this.y / length;
    }
    /**
     * ç­‰ã—ã•ã®ç¢ºèªï¼ˆç­‰ã—ã„ã‹ï¼Ÿï¼‰
     *
     * å€¤ãŒç­‰ã—ã„ã‹ï¼Ÿ
     *
     * @param rhs ç¢ºèªã™ã‚‹å€¤
     * @return true å€¤ã¯ç­‰ã—ã„
     * @return false å€¤ã¯ç­‰ã—ããªã„
     */
    isEqual(rhs) {
        return this.x == rhs.x && this.y == rhs.y;
    }
    /**
     * ç­‰ã—ã•ã®ç¢ºèªï¼ˆç­‰ã—ããªã„ã‹ï¼Ÿï¼‰
     *
     * å€¤ãŒç­‰ã—ããªã„ã‹ï¼Ÿ
     *
     * @param rhs ç¢ºèªã™ã‚‹å€¤
     * @return true å€¤ã¯ç­‰ã—ããªã„
     * @return false å€¤ã¯ç­‰ã—ã„
     */
    isNotEqual(rhs) {
        return !this.isEqual(rhs);
    }
}
// Namespace definition for compatibility.
import * as $ from './cubismvector2.js';
// eslint-disable-next-line @typescript-eslint/no-namespace
export var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    Live2DCubismFramework.CubismVector2 = $.CubismVector2;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));
//# sourceMappingURL=cubismvector2.js.map