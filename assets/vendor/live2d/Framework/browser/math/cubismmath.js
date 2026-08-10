/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
import { CubismVector2 } from './cubismvector2.js';
/**
 * æ•°å€¤è¨ˆç®—ãªã©ã«ä½¿ç”¨ã™ã‚‹ãƒ¦ãƒ¼ãƒ†ã‚£ãƒªãƒ†ã‚£ã‚¯ãƒ©ã‚¹
 */
export class CubismMath {
    /**
     * ç¬¬ä¸€å¼•æ•°ã®å€¤ã‚’æœ€å°å€¤ã¨æœ€å¤§å€¤ã®ç¯„å›²ã«åŽã‚ãŸå€¤ã‚’è¿”ã™
     *
     * @param value åŽã‚ã‚‰ã‚Œã‚‹å€¤
     * @param min   ç¯„å›²ã®æœ€å°å€¤
     * @param max   ç¯„å›²ã®æœ€å¤§å€¤
     * @return æœ€å°å€¤ã¨æœ€å¤§å€¤ã®ç¯„å›²ã«åŽã‚ãŸå€¤
     */
    static range(value, min, max) {
        if (value < min) {
            value = min;
        }
        else if (value > max) {
            value = max;
        }
        return value;
    }
    /**
     * ã‚µã‚¤ãƒ³é–¢æ•°ã®å€¤ã‚’æ±‚ã‚ã‚‹
     *
     * @param x è§’åº¦å€¤ï¼ˆãƒ©ã‚¸ã‚¢ãƒ³ï¼‰
     * @return ã‚µã‚¤ãƒ³é–¢æ•°sin(x)ã®å€¤
     */
    static sin(x) {
        return Math.sin(x);
    }
    /**
     * ã‚³ã‚µã‚¤ãƒ³é–¢æ•°ã®å€¤ã‚’æ±‚ã‚ã‚‹
     *
     * @param x è§’åº¦å€¤(ãƒ©ã‚¸ã‚¢ãƒ³)
     * @return ã‚³ã‚µã‚¤ãƒ³é–¢æ•°cos(x)ã®å€¤
     */
    static cos(x) {
        return Math.cos(x);
    }
    /**
     * å€¤ã®çµ¶å¯¾å€¤ã‚’æ±‚ã‚ã‚‹
     *
     * @param x çµ¶å¯¾å€¤ã‚’æ±‚ã‚ã‚‹å€¤
     * @return å€¤ã®çµ¶å¯¾å€¤
     */
    static abs(x) {
        return Math.abs(x);
    }
    /**
     * å¹³æ–¹æ ¹(ãƒ«ãƒ¼ãƒˆ)ã‚’æ±‚ã‚ã‚‹
     * @param x -> å¹³æ–¹æ ¹ã‚’æ±‚ã‚ã‚‹å€¤
     * @return å€¤ã®å¹³æ–¹æ ¹
     */
    static sqrt(x) {
        return Math.sqrt(x);
    }
    /**
     * ç«‹æ–¹æ ¹ã‚’æ±‚ã‚ã‚‹
     * @param x -> ç«‹æ–¹æ ¹ã‚’æ±‚ã‚ã‚‹å€¤
     * @return å€¤ã®ç«‹æ–¹æ ¹
     */
    static cbrt(x) {
        if (x === 0) {
            return x;
        }
        let cx = x;
        const isNegativeNumber = cx < 0;
        if (isNegativeNumber) {
            cx = -cx;
        }
        let ret;
        if (cx === Infinity) {
            ret = Infinity;
        }
        else {
            ret = Math.exp(Math.log(cx) / 3);
            ret = (cx / (ret * ret) + 2 * ret) / 3;
        }
        return isNegativeNumber ? -ret : ret;
    }
    /**
     * ã‚¤ãƒ¼ã‚¸ãƒ³ã‚°å‡¦ç†ã•ã‚ŒãŸã‚µã‚¤ãƒ³ã‚’æ±‚ã‚ã‚‹
     * ãƒ•ã‚§ãƒ¼ãƒ‰ã‚¤ãƒ³ãƒ»ã‚¢ã‚¦ãƒˆæ™‚ã®ã‚¤ãƒ¼ã‚¸ãƒ³ã‚°ã«åˆ©ç”¨ã§ãã‚‹
     *
     * @param value ã‚¤ãƒ¼ã‚¸ãƒ³ã‚°ã‚’è¡Œã†å€¤
     * @return ã‚¤ãƒ¼ã‚¸ãƒ³ã‚°å‡¦ç†ã•ã‚ŒãŸã‚µã‚¤ãƒ³å€¤
     */
    static getEasingSine(value) {
        if (value < 0.0) {
            return 0.0;
        }
        else if (value > 1.0) {
            return 1.0;
        }
        return 0.5 - 0.5 * this.cos(value * Math.PI);
    }
    /**
     * å¤§ãã„æ–¹ã®å€¤ã‚’è¿”ã™
     *
     * @param left å·¦è¾ºã®å€¤
     * @param right å³è¾ºã®å€¤
     * @return å¤§ãã„æ–¹ã®å€¤
     */
    static max(left, right) {
        return left > right ? left : right;
    }
    /**
     * å°ã•ã„æ–¹ã®å€¤ã‚’è¿”ã™
     *
     * @param left  å·¦è¾ºã®å€¤
     * @param right å³è¾ºã®å€¤
     * @return å°ã•ã„æ–¹ã®å€¤
     */
    static min(left, right) {
        return left > right ? right : left;
    }
    static clamp(val, min, max) {
        if (val < min) {
            return min;
        }
        else if (max < val) {
            return max;
        }
        return val;
    }
    /**
     * è§’åº¦å€¤ã‚’ãƒ©ã‚¸ã‚¢ãƒ³å€¤ã«å¤‰æ›ã™ã‚‹
     *
     * @param degrees   è§’åº¦å€¤
     * @return è§’åº¦å€¤ã‹ã‚‰å¤‰æ›ã—ãŸãƒ©ã‚¸ã‚¢ãƒ³å€¤
     */
    static degreesToRadian(degrees) {
        return (degrees / 180.0) * Math.PI;
    }
    /**
     * ãƒ©ã‚¸ã‚¢ãƒ³å€¤ã‚’è§’åº¦å€¤ã«å¤‰æ›ã™ã‚‹
     *
     * @param radian    ãƒ©ã‚¸ã‚¢ãƒ³å€¤
     * @return ãƒ©ã‚¸ã‚¢ãƒ³å€¤ã‹ã‚‰å¤‰æ›ã—ãŸè§’åº¦å€¤
     */
    static radianToDegrees(radian) {
        return (radian * 180.0) / Math.PI;
    }
    /**
     * ï¼’ã¤ã®ãƒ™ã‚¯ãƒˆãƒ«ã‹ã‚‰ãƒ©ã‚¸ã‚¢ãƒ³å€¤ã‚’æ±‚ã‚ã‚‹
     *
     * @param from  å§‹ç‚¹ãƒ™ã‚¯ãƒˆãƒ«
     * @param to    çµ‚ç‚¹ãƒ™ã‚¯ãƒˆãƒ«
     * @return ãƒ©ã‚¸ã‚¢ãƒ³å€¤ã‹ã‚‰æ±‚ã‚ãŸæ–¹å‘ãƒ™ã‚¯ãƒˆãƒ«
     */
    static directionToRadian(from, to) {
        const q1 = Math.atan2(to.y, to.x);
        const q2 = Math.atan2(from.y, from.x);
        let ret = q1 - q2;
        while (ret < -Math.PI) {
            ret += Math.PI * 2.0;
        }
        while (ret > Math.PI) {
            ret -= Math.PI * 2.0;
        }
        return ret;
    }
    /**
     * ï¼’ã¤ã®ãƒ™ã‚¯ãƒˆãƒ«ã‹ã‚‰è§’åº¦å€¤ã‚’æ±‚ã‚ã‚‹
     *
     * @param from  å§‹ç‚¹ãƒ™ã‚¯ãƒˆãƒ«
     * @param to    çµ‚ç‚¹ãƒ™ã‚¯ãƒˆãƒ«
     * @return è§’åº¦å€¤ã‹ã‚‰æ±‚ã‚ãŸæ–¹å‘ãƒ™ã‚¯ãƒˆãƒ«
     */
    static directionToDegrees(from, to) {
        const radian = this.directionToRadian(from, to);
        let degree = this.radianToDegrees(radian);
        if (to.x - from.x > 0.0) {
            degree = -degree;
        }
        return degree;
    }
    /**
     * ãƒ©ã‚¸ã‚¢ãƒ³å€¤ã‚’æ–¹å‘ãƒ™ã‚¯ãƒˆãƒ«ã«å¤‰æ›ã™ã‚‹ã€‚
     *
     * @param totalAngle    ãƒ©ã‚¸ã‚¢ãƒ³å€¤
     * @return ãƒ©ã‚¸ã‚¢ãƒ³å€¤ã‹ã‚‰å¤‰æ›ã—ãŸæ–¹å‘ãƒ™ã‚¯ãƒˆãƒ«
     */
    static radianToDirection(totalAngle) {
        const ret = new CubismVector2();
        ret.x = this.sin(totalAngle);
        ret.y = this.cos(totalAngle);
        return ret;
    }
    /**
     * ä¸‰æ¬¡æ–¹ç¨‹å¼ã®ä¸‰æ¬¡é …ã®ä¿‚æ•°ãŒ0ã«ãªã£ãŸã¨ãã«è£œæ¬ çš„ã«äºŒæ¬¡æ–¹ç¨‹å¼ã®è§£ã‚’ã‚‚ã¨ã‚ã‚‹ã€‚
     * a * x^2 + b * x + c = 0
     *
     * @param   a -> äºŒæ¬¡é …ã®ä¿‚æ•°å€¤
     * @param   b -> ä¸€æ¬¡é …ã®ä¿‚æ•°å€¤
     * @param   c -> å®šæ•°é …ã®å€¤
     * @return  äºŒæ¬¡æ–¹ç¨‹å¼ã®è§£
     */
    static quadraticEquation(a, b, c) {
        if (this.abs(a) < CubismMath.Epsilon) {
            if (this.abs(b) < CubismMath.Epsilon) {
                return -c;
            }
            return -c / b;
        }
        return -(b + this.sqrt(b * b - 4.0 * a * c)) / (2.0 * a);
    }
    /**
     * ã‚«ãƒ«ãƒ€ãƒŽã®å…¬å¼ã«ã‚ˆã£ã¦ãƒ™ã‚¸ã‚§ã®tå€¤ã«è©²å½“ã™ã‚‹ï¼“æ¬¡æ–¹ç¨‹å¼ã®è§£ã‚’æ±‚ã‚ã‚‹ã€‚
     * é‡è§£ã«ãªã£ãŸã¨ãã«ã¯0.0ï½ž1.0ã®å€¤ã«ãªã‚‹è§£ã‚’è¿”ã™ã€‚
     *
     * a * x^3 + b * x^2 + c * x + d = 0
     *
     * @param   a -> ä¸‰æ¬¡é …ã®ä¿‚æ•°å€¤
     * @param   b -> äºŒæ¬¡é …ã®ä¿‚æ•°å€¤
     * @param   c -> ä¸€æ¬¡é …ã®ä¿‚æ•°å€¤
     * @param   d -> å®šæ•°é …ã®å€¤
     * @return  0.0ï½ž1.0ã®é–“ã«ã‚ã‚‹è§£
     */
    static cardanoAlgorithmForBezier(a, b, c, d) {
        if (this.abs(a) < CubismMath.Epsilon) {
            return this.range(this.quadraticEquation(b, c, d), 0.0, 1.0);
        }
        const ba = b / a;
        const ca = c / a;
        const da = d / a;
        const p = (3.0 * ca - ba * ba) / 3.0;
        const p3 = p / 3.0;
        const q = (2.0 * ba * ba * ba - 9.0 * ba * ca + 27.0 * da) / 27.0;
        const q2 = q / 2.0;
        const discriminant = q2 * q2 + p3 * p3 * p3;
        const center = 0.5;
        const threshold = center + 0.01;
        if (discriminant < 0.0) {
            const mp3 = -p / 3.0;
            const mp33 = mp3 * mp3 * mp3;
            const r = this.sqrt(mp33);
            const t = -q / (2.0 * r);
            const cosphi = this.range(t, -1.0, 1.0);
            const phi = Math.acos(cosphi);
            const crtr = this.cbrt(r);
            const t1 = 2.0 * crtr;
            const root1 = t1 * this.cos(phi / 3.0) - ba / 3.0;
            if (this.abs(root1 - center) < threshold) {
                return this.range(root1, 0.0, 1.0);
            }
            const root2 = t1 * this.cos((phi + 2.0 * Math.PI) / 3.0) - ba / 3.0;
            if (this.abs(root2 - center) < threshold) {
                return this.range(root2, 0.0, 1.0);
            }
            const root3 = t1 * this.cos((phi + 4.0 * Math.PI) / 3.0) - ba / 3.0;
            return this.range(root3, 0.0, 1.0);
        }
        if (discriminant == 0.0) {
            let u1;
            if (q2 < 0.0) {
                u1 = this.cbrt(-q2);
            }
            else {
                u1 = -this.cbrt(q2);
            }
            const root1 = 2.0 * u1 - ba / 3.0;
            if (this.abs(root1 - center) < threshold) {
                return this.range(root1, 0.0, 1.0);
            }
            const root2 = -u1 - ba / 3.0;
            return this.range(root2, 0.0, 1.0);
        }
        const sd = this.sqrt(discriminant);
        const u1 = this.cbrt(sd - q2);
        const v1 = this.cbrt(sd + q2);
        const root1 = u1 - v1 - ba / 3.0;
        return this.range(root1, 0.0, 1.0);
    }
    /**
     * æµ®å‹•å°æ•°ç‚¹ã®ä½™ã‚Šã‚’æ±‚ã‚ã‚‹ã€‚
     *
     * @param dividend è¢«é™¤æ•°ï¼ˆå‰²ã‚‰ã‚Œã‚‹å€¤ï¼‰
     * @param divisor é™¤æ•°ï¼ˆå‰²ã‚‹å€¤ï¼‰
     * @return ä½™ã‚Š
     */
    static mod(dividend, divisor) {
        if (!isFinite(dividend) ||
            divisor === 0 ||
            isNaN(dividend) ||
            isNaN(divisor)) {
            console.warn(`divided: ${dividend}, divisor: ${divisor} mod() returns 'NaN'.`);
            return NaN;
        }
        // çµ¶å¯¾å€¤ã«å¤‰æ›ã™ã‚‹ã€‚
        const absDividend = Math.abs(dividend);
        const absDivisor = Math.abs(divisor);
        // çµ¶å¯¾å€¤ã§å‰²ã‚Šç®—ã™ã‚‹ã€‚
        let result = absDividend - Math.floor(absDividend / absDivisor) * absDivisor;
        // ç¬¦å·ã‚’è¢«é™¤æ•°ã®ã‚‚ã®ã«æŒ‡å®šã™ã‚‹ã€‚
        result *= Math.sign(dividend);
        return result;
    }
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    constructor() { }
}
CubismMath.Epsilon = 0.00001;
// Namespace definition for compatibility.
import * as $ from './cubismmath.js';
// eslint-disable-next-line @typescript-eslint/no-namespace
export var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    Live2DCubismFramework.CubismMath = $.CubismMath;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));
//# sourceMappingURL=cubismmath.js.map