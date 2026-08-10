/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
import { strtod } from '../live2dcubismframework.js';
import { CubismLogInfo } from './cubismdebug.js';
// StaticInitializeNotForClientCall()ã§åˆæœŸåŒ–ã™ã‚‹
const CSM_JSON_ERROR_TYPE_MISMATCH = 'Error: type mismatch';
const CSM_JSON_ERROR_INDEX_OF_BOUNDS = 'Error: index out of bounds';
/**
 * ãƒ‘ãƒ¼ã‚¹ã—ãŸJSONã‚¨ãƒ¬ãƒ¡ãƒ³ãƒˆã®è¦ç´ ã®åŸºåº•ã‚¯ãƒ©ã‚¹ã€‚
 */
export class Value {
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    constructor() { }
    /**
     * è¦ç´ ã‚’æ–‡å­—åˆ—åž‹ã§è¿”ã™(string)
     */
    getRawString(defaultValue, indent) {
        return this.getString(defaultValue, indent);
    }
    /**
     * è¦ç´ ã‚’æ•°å€¤åž‹ã§è¿”ã™(number)
     */
    toInt(defaultValue = 0) {
        return defaultValue;
    }
    /**
     * è¦ç´ ã‚’æ•°å€¤åž‹ã§è¿”ã™(number)
     */
    toFloat(defaultValue = 0) {
        return defaultValue;
    }
    /**
     * è¦ç´ ã‚’çœŸå½å€¤ã§è¿”ã™(boolean)
     */
    toBoolean(defaultValue = false) {
        return defaultValue;
    }
    /**
     * ã‚µã‚¤ã‚ºã‚’è¿”ã™
     */
    getSize() {
        return 0;
    }
    /**
     * è¦ç´ ã‚’é…åˆ—ã§è¿”ã™(Value[])
     */
    getArray(defaultValue = null) {
        return defaultValue;
    }
    /**
     * è¦ç´ ã‚’ã‚³ãƒ³ãƒ†ãƒŠã§è¿”ã™(array)
     */
    getVector(defaultValue = new Array()) {
        return defaultValue;
    }
    /**
     * è¦ç´ ã‚’ãƒžãƒƒãƒ—ã§è¿”ã™(Map<String, Value>)
     */
    getMap(defaultValue) {
        return defaultValue;
    }
    /**
     * æ·»å­—æ¼”ç®—å­[index]
     */
    getValueByIndex(index) {
        return Value.errorValue.setErrorNotForClientCall(CSM_JSON_ERROR_TYPE_MISMATCH);
    }
    /**
     * æ·»å­—æ¼”ç®—å­[string]
     */
    getValueByString(s) {
        return Value.nullValue.setErrorNotForClientCall(CSM_JSON_ERROR_TYPE_MISMATCH);
    }
    /**
     * ãƒžãƒƒãƒ—ã®ã‚­ãƒ¼ä¸€è¦§ã‚’ã‚³ãƒ³ãƒ†ãƒŠã§è¿”ã™
     *
     * @return ãƒžãƒƒãƒ—ã®ã‚­ãƒ¼ã®ä¸€è¦§
     */
    getKeys() {
        return Value.dummyKeys;
    }
    /**
     * Valueã®ç¨®é¡žãŒã‚¨ãƒ©ãƒ¼å€¤ãªã‚‰true
     */
    isError() {
        return false;
    }
    /**
     * Valueã®ç¨®é¡žãŒnullãªã‚‰true
     */
    isNull() {
        return false;
    }
    /**
     * Valueã®ç¨®é¡žãŒçœŸå½å€¤ãªã‚‰true
     */
    isBool() {
        return false;
    }
    /**
     * Valueã®ç¨®é¡žãŒæ•°å€¤åž‹ãªã‚‰true
     */
    isFloat() {
        return false;
    }
    /**
     * Valueã®ç¨®é¡žãŒæ–‡å­—åˆ—ãªã‚‰true
     */
    isString() {
        return false;
    }
    /**
     * Valueã®ç¨®é¡žãŒé…åˆ—ãªã‚‰true
     */
    isArray() {
        return false;
    }
    /**
     * Valueã®ç¨®é¡žãŒãƒžãƒƒãƒ—åž‹ãªã‚‰true
     */
    isMap() {
        return false;
    }
    equals(value) {
        return false;
    }
    /**
     * Valueã®å€¤ãŒé™çš„ãªã‚‰trueã€é™çš„ãªã‚‰è§£æ”¾ã—ãªã„
     */
    isStatic() {
        return false;
    }
    /**
     * Valueã«ã‚¨ãƒ©ãƒ¼å€¤ã‚’ã‚»ãƒƒãƒˆã™ã‚‹
     */
    setErrorNotForClientCall(errorStr) {
        return JsonError.errorValue;
    }
    /**
     * åˆæœŸåŒ–ç”¨ãƒ¡ã‚½ãƒƒãƒ‰
     */
    static staticInitializeNotForClientCall() {
        JsonBoolean.trueValue = new JsonBoolean(true);
        JsonBoolean.falseValue = new JsonBoolean(false);
        Value.errorValue = new JsonError('ERROR', true);
        Value.nullValue = new JsonNullvalue();
        Value.dummyKeys = new Array();
    }
    /**
     * ãƒªãƒªãƒ¼ã‚¹ç”¨ãƒ¡ã‚½ãƒƒãƒ‰
     */
    static staticReleaseNotForClientCall() {
        JsonBoolean.trueValue = null;
        JsonBoolean.falseValue = null;
        Value.errorValue = null;
        Value.nullValue = null;
        Value.dummyKeys = null;
    }
}
/**
 * Asciiæ–‡å­—ã®ã¿å¯¾å¿œã—ãŸæœ€å°é™ã®è»½é‡JSONãƒ‘ãƒ¼ã‚µã€‚
 * ä»•æ§˜ã¯JSONã®ã‚µãƒ–ã‚»ãƒƒãƒˆã¨ãªã‚‹ã€‚
 * è¨­å®šãƒ•ã‚¡ã‚¤ãƒ«(model3.json)ãªã©ã®ãƒ­ãƒ¼ãƒ‰ç”¨
 *
 * [æœªå¯¾å¿œé …ç›®]
 * ãƒ»æ—¥æœ¬èªžãªã©ã®éžASCIIæ–‡å­—
 * ãƒ»eã«ã‚ˆã‚‹æŒ‡æ•°è¡¨ç¾
 */
export class CubismJson {
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    constructor(buffer, length) {
        this._parseCallback = CubismJsonExtension.parseJsonObject; // ãƒ‘ãƒ¼ã‚¹æ™‚ã«ä½¿ã†å‡¦ç†ã®ã‚³ãƒ¼ãƒ«ãƒãƒƒã‚¯é–¢æ•°
        this._error = null;
        this._lineCount = 0;
        this._root = null;
        if (buffer != undefined) {
            this.parseBytes(buffer, length, this._parseCallback);
        }
    }
    /**
     * ãƒã‚¤ãƒˆãƒ‡ãƒ¼ã‚¿ã‹ã‚‰ç›´æŽ¥ãƒ­ãƒ¼ãƒ‰ã—ã¦ãƒ‘ãƒ¼ã‚¹ã™ã‚‹
     *
     * @param buffer ãƒãƒƒãƒ•ã‚¡
     * @param size ãƒãƒƒãƒ•ã‚¡ã‚µã‚¤ã‚º
     * @return CubismJsonã‚¯ãƒ©ã‚¹ã®ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹ã€‚å¤±æ•—ã—ãŸã‚‰NULL
     */
    static create(buffer, size) {
        const json = new CubismJson();
        const succeeded = json.parseBytes(buffer, size, json._parseCallback);
        if (!succeeded) {
            CubismJson.delete(json);
            return null;
        }
        else {
            return json;
        }
    }
    /**
     * ãƒ‘ãƒ¼ã‚¹ã—ãŸJSONã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã®è§£æ”¾å‡¦ç†
     *
     * @param instance CubismJsonã‚¯ãƒ©ã‚¹ã®ã‚¤ãƒ³ã‚¹ã‚¿ãƒ³ã‚¹
     */
    static delete(instance) {
        instance = null;
    }
    /**
     * ãƒ‘ãƒ¼ã‚¹ã—ãŸJSONã®ãƒ«ãƒ¼ãƒˆè¦ç´ ã‚’è¿”ã™
     */
    getRoot() {
        return this._root;
    }
    /**
     *  Unicodeã®ãƒã‚¤ãƒŠãƒªã‚’Stringã«å¤‰æ›
     *
     * @param buffer å¤‰æ›ã™ã‚‹ãƒã‚¤ãƒŠãƒªãƒ‡ãƒ¼ã‚¿
     * @return å¤‰æ›å¾Œã®æ–‡å­—åˆ—
     */
    static arrayBufferToString(buffer) {
        const uint8Array = new Uint8Array(buffer);
        let str = '';
        for (let i = 0, len = uint8Array.length; i < len; ++i) {
            str += '%' + this.pad(uint8Array[i].toString(16));
        }
        str = decodeURIComponent(str);
        return str;
    }
    /**
     * ã‚¨ãƒ³ã‚³ãƒ¼ãƒ‰ã€ãƒ‘ãƒ‡ã‚£ãƒ³ã‚°
     */
    static pad(n) {
        return n.length < 2 ? '0' + n : n;
    }
    /**
     * JSONã®ãƒ‘ãƒ¼ã‚¹ã‚’å®Ÿè¡Œã™ã‚‹
     * @param buffer    ãƒ‘ãƒ¼ã‚¹å¯¾è±¡ã®ãƒ‡ãƒ¼ã‚¿ãƒã‚¤ãƒˆ
     * @param size      ãƒ‡ãƒ¼ã‚¿ãƒã‚¤ãƒˆã®ã‚µã‚¤ã‚º
     * return true : æˆåŠŸ
     * return false: å¤±æ•—
     */
    parseBytes(buffer, size, parseCallback) {
        const endPos = new Array(1); // å‚ç…§æ¸¡ã—ã«ã™ã‚‹ãŸã‚é…åˆ—
        const decodeBuffer = CubismJson.arrayBufferToString(buffer);
        if (parseCallback == undefined) {
            this._root = this.parseValue(decodeBuffer, size, 0, endPos);
        }
        else {
            // TypeScriptæ¨™æº–ã®JSONãƒ‘ãƒ¼ã‚µã‚’ä½¿ã†
            this._root = parseCallback(JSON.parse(decodeBuffer), new JsonMap());
        }
        if (this._error) {
            let strbuf = '\0';
            strbuf = 'Json parse error : @line ' + (this._lineCount + 1) + '\n';
            this._root = new JsonString(strbuf);
            CubismLogInfo('{0}', this._root.getRawString());
            return false;
        }
        else if (this._root == null) {
            this._root = new JsonError(this._error, false); // rootã¯è§£æ”¾ã•ã‚Œã‚‹ã®ã§ã‚¨ãƒ©ãƒ¼ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã‚’åˆ¥é€”ä½œæˆã™ã‚‹
            return false;
        }
        return true;
    }
    /**
     * ãƒ‘ãƒ¼ã‚¹æ™‚ã®ã‚¨ãƒ©ãƒ¼å€¤ã‚’è¿”ã™
     */
    getParseError() {
        return this._error;
    }
    /**
     * ãƒ«ãƒ¼ãƒˆè¦ç´ ã®æ¬¡ã®è¦ç´ ãŒãƒ•ã‚¡ã‚¤ãƒ«ã®çµ‚ç«¯ã ã£ãŸã‚‰trueã‚’è¿”ã™
     */
    checkEndOfFile() {
        return this._root.getArray()[1].equals('EOF');
    }
    /**
     * JSONã‚¨ãƒ¬ãƒ¡ãƒ³ãƒˆã‹ã‚‰Value(float,String,Value*,Array,null,true,false)ã‚’ãƒ‘ãƒ¼ã‚¹ã™ã‚‹
     * ã‚¨ãƒ¬ãƒ¡ãƒ³ãƒˆã®æ›¸å¼ã«å¿œã˜ã¦å†…éƒ¨ã§ParseString(), ParseObject(), ParseArray()ã‚’å‘¼ã¶
     *
     * @param   buffer      JSONã‚¨ãƒ¬ãƒ¡ãƒ³ãƒˆã®ãƒãƒƒãƒ•ã‚¡
     * @param   length      ãƒ‘ãƒ¼ã‚¹ã™ã‚‹é•·ã•
     * @param   begin       ãƒ‘ãƒ¼ã‚¹ã‚’é–‹å§‹ã™ã‚‹ä½ç½®
     * @param   outEndPos   ãƒ‘ãƒ¼ã‚¹çµ‚äº†æ™‚ã®ä½ç½®
     * @return      ãƒ‘ãƒ¼ã‚¹ã‹ã‚‰å–å¾—ã—ãŸValueã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆ
     */
    parseValue(buffer, length, begin, outEndPos) {
        if (this._error)
            return null;
        let o = null;
        let i = begin;
        let f;
        for (; i < length; i++) {
            const c = buffer[i];
            switch (c) {
                case '-':
                case '.':
                case '0':
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                case '6':
                case '7':
                case '8':
                case '9': {
                    const afterString = new Array(1); // å‚ç…§æ¸¡ã—ã«ã™ã‚‹ãŸã‚
                    f = strtod(buffer.slice(i), afterString);
                    outEndPos[0] = buffer.indexOf(afterString[0]);
                    return new JsonFloat(f);
                }
                case '"':
                    return new JsonString(this.parseString(buffer, length, i + 1, outEndPos)); // \"ã®æ¬¡ã®æ–‡å­—ã‹ã‚‰
                case '[':
                    o = this.parseArray(buffer, length, i + 1, outEndPos);
                    return o;
                case '{':
                    o = this.parseObject(buffer, length, i + 1, outEndPos);
                    return o;
                case 'n': // nullä»¥å¤–ã«ãªã„
                    if (i + 3 < length) {
                        o = new JsonNullvalue(); // è§£æ”¾ã§ãã‚‹ã‚ˆã†ã«ã™ã‚‹
                        outEndPos[0] = i + 4;
                    }
                    else {
                        this._error = 'parse null';
                    }
                    return o;
                case 't': // trueä»¥å¤–ã«ãªã„
                    if (i + 3 < length) {
                        o = JsonBoolean.trueValue;
                        outEndPos[0] = i + 4;
                    }
                    else {
                        this._error = 'parse true';
                    }
                    return o;
                case 'f': // falseä»¥å¤–ã«ãªã„
                    if (i + 4 < length) {
                        o = JsonBoolean.falseValue;
                        outEndPos[0] = i + 5;
                    }
                    else {
                        this._error = "illegal ',' position";
                    }
                    return o;
                case ',': // Array separator
                    this._error = "illegal ',' position";
                    return null;
                case ']': // ä¸æ­£ãªï½ã ãŒã‚¹ã‚­ãƒƒãƒ—ã™ã‚‹ã€‚é…åˆ—ã®æœ€å¾Œã«ä¸è¦ãª , ãŒã‚ã‚‹ã¨æ€ã‚ã‚Œã‚‹
                    outEndPos[0] = i; // åŒã˜æ–‡å­—ã‚’å†å‡¦ç†
                    return null;
                case '\n':
                    this._lineCount++;
                // falls through
                case ' ':
                case '\t':
                case '\r':
                default:
                    // ã‚¹ã‚­ãƒƒãƒ—
                    break;
            }
        }
        this._error = 'illegal end of value';
        return null;
    }
    /**
     * æ¬¡ã®ã€Œ"ã€ã¾ã§ã®æ–‡å­—åˆ—ã‚’ãƒ‘ãƒ¼ã‚¹ã™ã‚‹ã€‚
     *
     * @param   string  ->  ãƒ‘ãƒ¼ã‚¹å¯¾è±¡ã®æ–‡å­—åˆ—
     * @param   length  ->  ãƒ‘ãƒ¼ã‚¹ã™ã‚‹é•·ã•
     * @param   begin   ->  ãƒ‘ãƒ¼ã‚¹ã‚’é–‹å§‹ã™ã‚‹ä½ç½®
     * @param  outEndPos   ->  ãƒ‘ãƒ¼ã‚¹çµ‚äº†æ™‚ã®ä½ç½®
     * @return      ãƒ‘ãƒ¼ã‚¹ã—ãŸæ–‡Få­—åˆ—è¦ç´ 
     */
    parseString(string, length, begin, outEndPos) {
        if (this._error) {
            return null;
        }
        if (!string) {
            this._error = 'string is null';
            return null;
        }
        let i = begin;
        let c, c2;
        let ret = '';
        let bufStart = begin; // sbufã«ç™»éŒ²ã•ã‚Œã¦ã„ãªã„æ–‡å­—ã®é–‹å§‹ä½ç½®
        for (; i < length; i++) {
            c = string[i];
            switch (c) {
                case '"': {
                    // çµ‚ç«¯ã®â€ã€ã‚¨ã‚¹ã‚±ãƒ¼ãƒ—æ–‡å­—ã¯åˆ¥ã«å‡¦ç†ã•ã‚Œã‚‹ã®ã§ã“ã“ã«æ¥ãªã„
                    outEndPos[0] = i + 1; // â€ã®æ¬¡ã®æ–‡å­—
                    ret += string.substr(bufStart, i - bufStart); // å‰ã®æ–‡å­—ã¾ã§ã‚’ç™»éŒ²ã™ã‚‹
                    return ret;
                }
                // falls through
                case '//': {
                    // ã‚¨ã‚¹ã‚±ãƒ¼ãƒ—ã®å ´åˆ
                    i++; // ï¼’æ–‡å­—ã‚’ã‚»ãƒƒãƒˆã§æ‰±ã†
                    if (i - 1 > bufStart) {
                        ret += string.substr(bufStart, i - bufStart); // å‰ã®æ–‡å­—ã¾ã§ã‚’ç™»éŒ²ã™ã‚‹
                    }
                    bufStart = i + 1; // ã‚¨ã‚¹ã‚±ãƒ¼ãƒ—ï¼ˆï¼’æ–‡å­—)ã®æ¬¡ã®æ–‡å­—ã‹ã‚‰
                    if (i < length) {
                        c2 = string[i];
                        switch (c2) {
                            case '\\':
                                ret += '\\';
                                break;
                            case '"':
                                ret += '"';
                                break;
                            case '/':
                                ret += '/';
                                break;
                            case 'b':
                                ret += '\b';
                                break;
                            case 'f':
                                ret += '\f';
                                break;
                            case 'n':
                                ret += '\n';
                                break;
                            case 'r':
                                ret += '\r';
                                break;
                            case 't':
                                ret += '\t';
                                break;
                            case 'u':
                                this._error = 'parse string/unicord escape not supported';
                                break;
                            default:
                                break;
                        }
                    }
                    else {
                        this._error = 'parse string/escape error';
                    }
                }
                // falls through
                default: {
                    break;
                }
            }
        }
        this._error = 'parse string/illegal end';
        return null;
    }
    /**
     * JSONã®ã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã‚¨ãƒ¬ãƒ¡ãƒ³ãƒˆã‚’ãƒ‘ãƒ¼ã‚¹ã—ã¦Valueã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆã‚’è¿”ã™
     *
     * @param buffer    JSONã‚¨ãƒ¬ãƒ¡ãƒ³ãƒˆã®ãƒãƒƒãƒ•ã‚¡
     * @param length    ãƒ‘ãƒ¼ã‚¹ã™ã‚‹é•·ã•
     * @param begin     ãƒ‘ãƒ¼ã‚¹ã‚’é–‹å§‹ã™ã‚‹ä½ç½®
     * @param outEndPos ãƒ‘ãƒ¼ã‚¹çµ‚äº†æ™‚ã®ä½ç½®
     * @return ãƒ‘ãƒ¼ã‚¹ã‹ã‚‰å–å¾—ã—ãŸValueã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆ
     */
    parseObject(buffer, length, begin, outEndPos) {
        if (this._error) {
            return null;
        }
        if (!buffer) {
            this._error = 'buffer is null';
            return null;
        }
        const ret = new JsonMap();
        // Key: Value
        let key = '';
        let i = begin;
        let c = '';
        const localRetEndPos2 = Array(1);
        let ok = false;
        // , ãŒç¶šãé™ã‚Šãƒ«ãƒ¼ãƒ—
        for (; i < length; i++) {
            FOR_LOOP: for (; i < length; i++) {
                c = buffer[i];
                switch (c) {
                    case '"':
                        key = this.parseString(buffer, length, i + 1, localRetEndPos2);
                        if (this._error) {
                            return null;
                        }
                        i = localRetEndPos2[0];
                        ok = true;
                        break FOR_LOOP; //-- loopã‹ã‚‰å‡ºã‚‹
                    case '}': // é–‰ã˜ã‚«ãƒƒã‚³
                        outEndPos[0] = i + 1;
                        return ret; // ç©º
                    case ':':
                        this._error = "illegal ':' position";
                        break;
                    case '\n':
                        this._lineCount++;
                    // falls through
                    default:
                        break; // ã‚¹ã‚­ãƒƒãƒ—ã™ã‚‹æ–‡å­—
                }
            }
            if (!ok) {
                this._error = 'key not found';
                return null;
            }
            ok = false;
            // : ã‚’ãƒã‚§ãƒƒã‚¯
            FOR_LOOP2: for (; i < length; i++) {
                c = buffer[i];
                switch (c) {
                    case ':':
                        ok = true;
                        i++;
                        break FOR_LOOP2;
                    case '}':
                        this._error = "illegal '}' position";
                        break;
                    // falls through
                    case '\n':
                        this._lineCount++;
                    // case ' ': case '\t' : case '\r':
                    // falls through
                    default:
                        break; // ã‚¹ã‚­ãƒƒãƒ—ã™ã‚‹æ–‡å­—
                }
            }
            if (!ok) {
                this._error = "':' not found";
                return null;
            }
            // å€¤ã‚’ãƒã‚§ãƒƒã‚¯
            const value = this.parseValue(buffer, length, i, localRetEndPos2);
            if (this._error) {
                return null;
            }
            i = localRetEndPos2[0];
            // ret.put(key, value);
            ret.put(key, value);
            FOR_LOOP3: for (; i < length; i++) {
                c = buffer[i];
                switch (c) {
                    case ',':
                        break FOR_LOOP3;
                    case '}':
                        outEndPos[0] = i + 1;
                        return ret; // æ­£å¸¸çµ‚äº†
                    case '\n':
                        this._lineCount++;
                    // falls through
                    default:
                        break; // ã‚¹ã‚­ãƒƒãƒ—
                }
            }
        }
        this._error = 'illegal end of perseObject';
        return null;
    }
    /**
     * æ¬¡ã®ã€Œ"ã€ã¾ã§ã®æ–‡å­—åˆ—ã‚’ãƒ‘ãƒ¼ã‚¹ã™ã‚‹ã€‚
     * @param buffer    JSONã‚¨ãƒ¬ãƒ¡ãƒ³ãƒˆã®ãƒãƒƒãƒ•ã‚¡
     * @param length    ãƒ‘ãƒ¼ã‚¹ã™ã‚‹é•·ã•
     * @param begin     ãƒ‘ãƒ¼ã‚¹ã‚’é–‹å§‹ã™ã‚‹ä½ç½®
     * @param outEndPos ãƒ‘ãƒ¼ã‚¹çµ‚äº†æ™‚ã®ä½ç½®
     * @return ãƒ‘ãƒ¼ã‚¹ã‹ã‚‰å–å¾—ã—ãŸValueã‚ªãƒ–ã‚¸ã‚§ã‚¯ãƒˆ
     */
    parseArray(buffer, length, begin, outEndPos) {
        if (this._error) {
            return null;
        }
        if (!buffer) {
            this._error = 'buffer is null';
            return null;
        }
        let ret = new JsonArray();
        // key : value
        let i = begin;
        let c;
        const localRetEndpos2 = new Array(1);
        // , ãŒç¶šãé™ã‚Šãƒ«ãƒ¼ãƒ—
        for (; i < length; i++) {
            // : ã‚’ãƒã‚§ãƒƒã‚¯
            const value = this.parseValue(buffer, length, i, localRetEndpos2);
            if (this._error) {
                return null;
            }
            i = localRetEndpos2[0];
            if (value) {
                ret.add(value);
            }
            // FOR_LOOP3:
            // boolean breakflag = false;
            FOR_LOOP: for (; i < length; i++) {
                c = buffer[i];
                switch (c) {
                    case ',':
                        // breakflag = true;
                        // break; // æ¬¡ã®KEY, VAlUEã¸
                        break FOR_LOOP;
                    case ']':
                        outEndPos[0] = i + 1;
                        return ret; // çµ‚äº†
                    case '\n':
                        ++this._lineCount;
                    //case ' ': case '\t': case '\r':
                    // falls through
                    default:
                        break; // ã‚¹ã‚­ãƒƒãƒ—
                }
            }
        }
        ret = void 0;
        this._error = 'illegal end of parseObject';
        return null;
    }
}
/**
 * ãƒ‘ãƒ¼ã‚¹ã—ãŸJSONã®è¦ç´ ã‚’floatå€¤ã¨ã—ã¦æ‰±ã†
 */
export class JsonFloat extends Value {
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    constructor(v) {
        super();
        this._value = v;
    }
    /**
     * Valueã®ç¨®é¡žãŒæ•°å€¤åž‹ãªã‚‰true
     */
    isFloat() {
        return true;
    }
    /**
     * è¦ç´ ã‚’æ–‡å­—åˆ—ã§è¿”ã™(stringåž‹)
     */
    getString(defaultValue, indent) {
        const strbuf = '\0';
        this._value = parseFloat(strbuf);
        this._stringBuffer = strbuf;
        return this._stringBuffer;
    }
    /**
     * è¦ç´ ã‚’æ•°å€¤åž‹ã§è¿”ã™(number)
     */
    toInt(defaultValue = 0) {
        return parseInt(this._value.toString());
    }
    /**
     * è¦ç´ ã‚’æ•°å€¤åž‹ã§è¿”ã™(number)
     */
    toFloat(defaultValue = 0.0) {
        return this._value;
    }
    equals(value) {
        if ('number' === typeof value) {
            // int
            if (Math.round(value)) {
                return false;
            }
            // float
            else {
                return value == this._value;
            }
        }
        return false;
    }
}
/**
 * ãƒ‘ãƒ¼ã‚¹ã—ãŸJSONã®è¦ç´ ã‚’çœŸå½å€¤ã¨ã—ã¦æ‰±ã†
 */
export class JsonBoolean extends Value {
    /**
     * Valueã®ç¨®é¡žãŒçœŸå½å€¤ãªã‚‰true
     */
    isBool() {
        return true;
    }
    /**
     * è¦ç´ ã‚’çœŸå½å€¤ã§è¿”ã™(boolean)
     */
    toBoolean(defaultValue = false) {
        return this._boolValue;
    }
    /**
     * è¦ç´ ã‚’æ–‡å­—åˆ—ã§è¿”ã™(stringåž‹)
     */
    getString(defaultValue, indent) {
        this._stringBuffer = this._boolValue ? 'true' : 'false';
        return this._stringBuffer;
    }
    equals(value) {
        if ('boolean' === typeof value) {
            return value == this._boolValue;
        }
        return false;
    }
    /**
     * Valueã®å€¤ãŒé™çš„ãªã‚‰true, é™çš„ãªã‚‰è§£æ”¾ã—ãªã„
     */
    isStatic() {
        return true;
    }
    /**
     * å¼•æ•°ä»˜ãã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    constructor(v) {
        super();
        this._boolValue = v;
    }
}
/**
 * ãƒ‘ãƒ¼ã‚¹ã—ãŸJSONã®è¦ç´ ã‚’æ–‡å­—åˆ—ã¨ã—ã¦æ‰±ã†
 */
export class JsonString extends Value {
    /**
     * å¼•æ•°ä»˜ãã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    constructor(s) {
        super();
        this._stringBuffer = s;
    }
    /**
     * Valueã®ç¨®é¡žãŒæ–‡å­—åˆ—ãªã‚‰true
     */
    isString() {
        return true;
    }
    /**
     * è¦ç´ ã‚’æ–‡å­—åˆ—ã§è¿”ã™(stringåž‹)
     */
    getString(defaultValue, indent) {
        return this._stringBuffer;
    }
    equals(value) {
        if ('string' === typeof value) {
            return this._stringBuffer == value;
        }
        return false;
    }
}
/**
 * JSONãƒ‘ãƒ¼ã‚¹æ™‚ã®ã‚¨ãƒ©ãƒ¼çµæžœã€‚æ–‡å­—åˆ—åž‹ã®ã‚ˆã†ã«ãµã‚‹ã¾ã†
 */
export class JsonError extends JsonString {
    /**
     * Valueã®å€¤ãŒé™çš„ãªã‚‰trueã€é™çš„ãªã‚‰è§£æ”¾ã—ãªã„
     */
    isStatic() {
        return this._isStatic;
    }
    /**
     * ã‚¨ãƒ©ãƒ¼æƒ…å ±ã‚’ã‚»ãƒƒãƒˆã™ã‚‹
     */
    setErrorNotForClientCall(s) {
        this._stringBuffer = s;
        return this;
    }
    /**
     * å¼•æ•°ä»˜ãã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    constructor(s, isStatic) {
        if ('string' === typeof s) {
            super(s);
        }
        else {
            super(s);
        }
        this._isStatic = isStatic;
    }
    /**
     * Valueã®ç¨®é¡žãŒã‚¨ãƒ©ãƒ¼å€¤ãªã‚‰true
     */
    isError() {
        return true;
    }
}
/**
 * ãƒ‘ãƒ¼ã‚¹ã—ãŸJSONã®è¦ç´ ã‚’NULLå€¤ã¨ã—ã¦æŒã¤
 */
export class JsonNullvalue extends Value {
    /**
     * Valueã®ç¨®é¡žãŒNULLå€¤ãªã‚‰true
     */
    isNull() {
        return true;
    }
    /**
     * è¦ç´ ã‚’æ–‡å­—åˆ—ã§è¿”ã™(stringåž‹)
     */
    getString(defaultValue, indent) {
        return this._stringBuffer;
    }
    /**
     * Valueã®å€¤ãŒé™çš„ãªã‚‰true, é™çš„ãªã‚‰è§£æ”¾ã—ãªã„
     */
    isStatic() {
        return true;
    }
    /**
     * Valueã«ã‚¨ãƒ©ãƒ¼å€¤ã‚’ã‚»ãƒƒãƒˆã™ã‚‹
     */
    setErrorNotForClientCall(s) {
        this._stringBuffer = s;
        return JsonError.nullValue;
    }
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    constructor() {
        super();
        this._stringBuffer = 'NullValue';
    }
}
/**
 * ãƒ‘ãƒ¼ã‚¹ã—ãŸJSONã®è¦ç´ ã‚’é…åˆ—ã¨ã—ã¦æŒã¤
 */
export class JsonArray extends Value {
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    constructor() {
        super();
        this._array = new Array();
    }
    /**
     * ãƒ‡ã‚¹ãƒˆãƒ©ã‚¯ã‚¿ç›¸å½“ã®å‡¦ç†
     */
    release() {
        for (let i = 0; i < this._array.length; i++) {
            let v = this._array[i];
            if (v && !v.isStatic()) {
                v = void 0;
                v = null;
            }
        }
    }
    /**
     * Valueã®ç¨®é¡žãŒé…åˆ—ãªã‚‰true
     */
    isArray() {
        return true;
    }
    /**
     * æ·»å­—æ¼”ç®—å­[index]
     */
    getValueByIndex(index) {
        if (index < 0 || this._array.length <= index) {
            return Value.errorValue.setErrorNotForClientCall(CSM_JSON_ERROR_INDEX_OF_BOUNDS);
        }
        const v = this._array[index];
        if (v == null) {
            return Value.nullValue;
        }
        return v;
    }
    /**
     * æ·»å­—æ¼”ç®—å­[string]
     */
    getValueByString(s) {
        return Value.errorValue.setErrorNotForClientCall(CSM_JSON_ERROR_TYPE_MISMATCH);
    }
    /**
     * è¦ç´ ã‚’æ–‡å­—åˆ—ã§è¿”ã™(stringåž‹)
     */
    getString(defaultValue, indent) {
        const stringBuffer = indent + '[\n';
        for (let i = 0; i < this._array.length; i++) {
            const v = this._array[i];
            this._stringBuffer += indent + '' + v.getString(indent + ' ') + '\n';
        }
        this._stringBuffer = stringBuffer + indent + ']\n';
        return this._stringBuffer;
    }
    /**
     * é…åˆ—è¦ç´ ã‚’è¿½åŠ ã™ã‚‹
     * @param v è¿½åŠ ã™ã‚‹è¦ç´ 
     */
    add(v) {
        this._array.push(v);
    }
    /**
     * è¦ç´ ã‚’ã‚³ãƒ³ãƒ†ãƒŠã§è¿”ã™(Array<Value>)
     */
    getVector(defaultValue = null) {
        return this._array;
    }
    /**
     * è¦ç´ ã®æ•°ã‚’è¿”ã™
     */
    getSize() {
        return this._array.length;
    }
}
/**
 * ãƒ‘ãƒ¼ã‚¹ã—ãŸJSONã®è¦ç´ ã‚’ãƒžãƒƒãƒ—ã¨ã—ã¦æŒã¤
 */
export class JsonMap extends Value {
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     */
    constructor() {
        super();
        this._map = new Map();
    }
    /**
     * ãƒ‡ã‚¹ãƒˆãƒ©ã‚¯ã‚¿ç›¸å½“ã®å‡¦ç†
     */
    release() {
        this._map.clear();
    }
    /**
     * Valueã®å€¤ãŒMapåž‹ãªã‚‰true
     */
    isMap() {
        return true;
    }
    /**
     * æ·»å­—æ¼”ç®—å­[string]
     */
    getValueByString(s) {
        const ret = this._map.get(s);
        if (ret != undefined) {
            return ret;
        }
        return Value.nullValue;
    }
    /**
     * æ·»å­—æ¼”ç®—å­[index]
     */
    getValueByIndex(index) {
        return Value.errorValue.setErrorNotForClientCall(CSM_JSON_ERROR_TYPE_MISMATCH);
    }
    /**
     * è¦ç´ ã‚’æ–‡å­—åˆ—ã§è¿”ã™(stringåž‹)
     */
    getString(defaultValue, indent) {
        this._stringBuffer = indent + '{\n';
        for (const element of this._map) {
            const key = element[0];
            const v = element[1];
            this._stringBuffer +=
                indent + ' ' + key + ' : ' + v.getString(indent + '   ') + ' \n';
        }
        this._stringBuffer += indent + '}\n';
        return this._stringBuffer;
    }
    /**
     * è¦ç´ ã‚’Mapåž‹ã§è¿”ã™
     */
    getMap(defaultValue) {
        return this._map;
    }
    /**
     * Mapã«è¦ç´ ã‚’è¿½åŠ ã™ã‚‹
     */
    put(key, v) {
        this._map.set(key, v);
    }
    /**
     * Mapã‹ã‚‰ã‚­ãƒ¼ã®ãƒªã‚¹ãƒˆã‚’å–å¾—ã™ã‚‹
     */
    getKeys() {
        if (!this._keys) {
            this._keys = [...this._map.keys()];
        }
        return this._keys;
    }
    /**
     * Mapã®è¦ç´ æ•°ã‚’å–å¾—ã™ã‚‹
     */
    getSize() {
        return this._keys.length;
    }
}
// Namespace definition for compatibility.
import * as $ from './cubismjson.js';
import { CubismJsonExtension } from './cubismjsonextension.js';
// eslint-disable-next-line @typescript-eslint/no-namespace
export var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    Live2DCubismFramework.CubismJson = $.CubismJson;
    Live2DCubismFramework.JsonArray = $.JsonArray;
    Live2DCubismFramework.JsonBoolean = $.JsonBoolean;
    Live2DCubismFramework.JsonError = $.JsonError;
    Live2DCubismFramework.JsonFloat = $.JsonFloat;
    Live2DCubismFramework.JsonMap = $.JsonMap;
    Live2DCubismFramework.JsonNullvalue = $.JsonNullvalue;
    Live2DCubismFramework.JsonString = $.JsonString;
    Live2DCubismFramework.Value = $.Value;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));
//# sourceMappingURL=cubismjson.js.map