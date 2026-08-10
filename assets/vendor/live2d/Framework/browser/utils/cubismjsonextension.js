/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
import { JsonArray, JsonBoolean, JsonFloat, JsonMap, JsonNullvalue, JsonString } from './cubismjson.js';
/**
 * CubismJsonã§å®Ÿè£…ã•ã‚Œã¦ã„ã‚‹Jsonãƒ‘ãƒ¼ã‚µã‚’ä½¿ç”¨ã›ãšã€
 * TypeScriptæ¨™æº–ã®Jsonãƒ‘ãƒ¼ã‚µãªã©ã‚’ä½¿ç”¨ã—å‡ºåŠ›ã•ã‚ŒãŸçµæžœã‚’
 * Cubism SDKã§å®šç¾©ã•ã‚Œã¦ã„ã‚‹JSONã‚¨ãƒ¬ãƒ¡ãƒ³ãƒˆã®è¦ç´ ã«
 * ç½®ãæ›ãˆã‚‹å‡¦ç†ã‚’ã™ã‚‹ã‚¯ãƒ©ã‚¹ã€‚
 */
export class CubismJsonExtension {
    static parseJsonObject(obj, map) {
        Object.keys(obj).forEach(key => {
            if (typeof obj[key] == 'boolean') {
                const convValue = Boolean(obj[key]);
                map.put(key, new JsonBoolean(convValue));
            }
            else if (typeof obj[key] == 'string') {
                const convValue = String(obj[key]);
                map.put(key, new JsonString(convValue));
            }
            else if (typeof obj[key] == 'number') {
                const convValue = Number(obj[key]);
                map.put(key, new JsonFloat(convValue));
            }
            else if (obj[key] instanceof Array) {
                // HACK: Array å˜ä½“ã§å¤‰æ›ã§ããªã„ã®ã§ unknown ã«å¤‰æ›´ã—ã¦ã‹ã‚‰ Value ã«ã—ã¦ã„ã‚‹
                map.put(key, CubismJsonExtension.parseJsonArray(obj[key]));
            }
            else if (obj[key] instanceof Object) {
                map.put(key, CubismJsonExtension.parseJsonObject(obj[key], new JsonMap()));
            }
            else if (obj[key] == null) {
                map.put(key, new JsonNullvalue());
            }
            else {
                // ã©ã‚Œã«ã‚‚å½“ã¦ã¯ã¾ã‚‰ãªã„å ´åˆã§ã‚‚å‡¦ç†ã™ã‚‹
                map.put(key, obj[key]);
            }
        });
        return map;
    }
    static parseJsonArray(obj) {
        const arr = new JsonArray();
        Object.keys(obj).forEach(key => {
            const convKey = Number(key);
            if (typeof convKey == 'number') {
                if (typeof obj[key] == 'boolean') {
                    const convValue = Boolean(obj[key]);
                    arr.add(new JsonBoolean(convValue));
                }
                else if (typeof obj[key] == 'string') {
                    const convValue = String(obj[key]);
                    arr.add(new JsonString(convValue));
                }
                else if (typeof obj[key] == 'number') {
                    const convValue = Number(obj[key]);
                    arr.add(new JsonFloat(convValue));
                }
                else if (obj[key] instanceof Array) {
                    // HACK: Array å˜ä½“ã§å¤‰æ›ã§ããªã„ã®ã§ unknown ã«å¤‰æ›´ã—ã¦ã‹ã‚‰ Value ã«ã—ã¦ã„ã‚‹
                    arr.add(this.parseJsonArray(obj[key]));
                }
                else if (obj[key] instanceof Object) {
                    arr.add(this.parseJsonObject(obj[key], new JsonMap()));
                }
                else if (obj[key] == null) {
                    arr.add(new JsonNullvalue());
                }
                else {
                    // ã©ã‚Œã«ã‚‚å½“ã¦ã¯ã¾ã‚‰ãªã„å ´åˆã§ã‚‚å‡¦ç†ã™ã‚‹
                    arr.add(obj[key]);
                }
            }
            else if (obj[key] instanceof Array) {
                // HACK: Array å˜ä½“ã§å¤‰æ›ã§ããªã„ã®ã§ unknown ã«å¤‰æ›´ã—ã¦ã‹ã‚‰ Value ã«ã—ã¦ã„ã‚‹
                arr.add(this.parseJsonArray(obj[key]));
            }
            else if (obj[key] instanceof Object) {
                arr.add(this.parseJsonObject(obj[key], new JsonMap()));
            }
            else if (obj[key] == null) {
                arr.add(new JsonNullvalue());
            }
            else {
                const convValue = Array(obj[key]);
                // é…åˆ—ã¨ã‚‚Objectã¨ã‚‚åˆ¤å®šã§ããªã‹ã£ãŸå ´åˆã§ã‚‚å‡¦ç†ã™ã‚‹
                for (let i = 0; i < convValue.length; i++) {
                    arr.add(convValue[i]);
                }
            }
        });
        return arr;
    }
}
//# sourceMappingURL=cubismjsonextension.js.map