/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */
import { CubismFramework } from '../live2dcubismframework.js';
import { CubismVector2 } from '../math/cubismvector2.js';
import { CubismJson } from '../utils/cubismjson.js';
// JSON keys
const Position = 'Position';
const X = 'X';
const Y = 'Y';
const Angle = 'Angle';
const Type = 'Type';
const Id = 'Id';
// Meta
const Meta = 'Meta';
const EffectiveForces = 'EffectiveForces';
const TotalInputCount = 'TotalInputCount';
const TotalOutputCount = 'TotalOutputCount';
const PhysicsSettingCount = 'PhysicsSettingCount';
const Gravity = 'Gravity';
const Wind = 'Wind';
const VertexCount = 'VertexCount';
const Fps = 'Fps';
// PhysicsSettings
const PhysicsSettings = 'PhysicsSettings';
const Normalization = 'Normalization';
const Minimum = 'Minimum';
const Maximum = 'Maximum';
const Default = 'Default';
const Reflect = 'Reflect';
const Weight = 'Weight';
// Input
const Input = 'Input';
const Source = 'Source';
// Output
const Output = 'Output';
const Scale = 'Scale';
const VertexIndex = 'VertexIndex';
const Destination = 'Destination';
// Particle
const Vertices = 'Vertices';
const Mobility = 'Mobility';
const Delay = 'Delay';
const Radius = 'Radius';
const Acceleration = 'Acceleration';
/**
 * physics3.jsonã®ã‚³ãƒ³ãƒ†ãƒŠã€‚
 */
export class CubismPhysicsJson {
    /**
     * ã‚³ãƒ³ã‚¹ãƒˆãƒ©ã‚¯ã‚¿
     * @param buffer physics3.jsonãŒèª­ã¿è¾¼ã¾ã‚Œã¦ã„ã‚‹ãƒãƒƒãƒ•ã‚¡
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
     * é‡åŠ›ã®å–å¾—
     * @return é‡åŠ›
     */
    getGravity() {
        const ret = new CubismVector2(0, 0);
        ret.x = this._json
            .getRoot()
            .getValueByString(Meta)
            .getValueByString(EffectiveForces)
            .getValueByString(Gravity)
            .getValueByString(X)
            .toFloat();
        ret.y = this._json
            .getRoot()
            .getValueByString(Meta)
            .getValueByString(EffectiveForces)
            .getValueByString(Gravity)
            .getValueByString(Y)
            .toFloat();
        return ret;
    }
    /**
     * é¢¨ã®å–å¾—
     * @return é¢¨
     */
    getWind() {
        const ret = new CubismVector2(0, 0);
        ret.x = this._json
            .getRoot()
            .getValueByString(Meta)
            .getValueByString(EffectiveForces)
            .getValueByString(Wind)
            .getValueByString(X)
            .toFloat();
        ret.y = this._json
            .getRoot()
            .getValueByString(Meta)
            .getValueByString(EffectiveForces)
            .getValueByString(Wind)
            .getValueByString(Y)
            .toFloat();
        return ret;
    }
    /**
     * ç‰©ç†æ¼”ç®—è¨­å®šFPSã®å–å¾—
     * @return ç‰©ç†æ¼”ç®—è¨­å®šFPS
     */
    getFps() {
        return this._json
            .getRoot()
            .getValueByString(Meta)
            .getValueByString(Fps)
            .toFloat(0.0);
    }
    /**
     * ç‰©ç†åº—ã®ç®¡ç†ã®å€‹æ•°ã®å–å¾—
     * @return ç‰©ç†åº—ã®ç®¡ç†ã®å€‹æ•°
     */
    getSubRigCount() {
        return this._json
            .getRoot()
            .getValueByString(Meta)
            .getValueByString(PhysicsSettingCount)
            .toInt();
    }
    /**
     * å…¥åŠ›ã®ç·åˆè¨ˆã®å–å¾—
     * @return å…¥åŠ›ã®ç·åˆè¨ˆ
     */
    getTotalInputCount() {
        return this._json
            .getRoot()
            .getValueByString(Meta)
            .getValueByString(TotalInputCount)
            .toInt();
    }
    /**
     * å‡ºåŠ›ã®ç·åˆè¨ˆã®å–å¾—
     * @return å‡ºåŠ›ã®ç·åˆè¨ˆ
     */
    getTotalOutputCount() {
        return this._json
            .getRoot()
            .getValueByString(Meta)
            .getValueByString(TotalOutputCount)
            .toInt();
    }
    /**
     * ç‰©ç†ç‚¹ã®å€‹æ•°ã®å–å¾—
     * @return ç‰©ç†ç‚¹ã®å€‹æ•°
     */
    getVertexCount() {
        return this._json
            .getRoot()
            .getValueByString(Meta)
            .getValueByString(VertexCount)
            .toInt();
    }
    /**
     * æ­£è¦åŒ–ã•ã‚ŒãŸä½ç½®ã®æœ€å°å€¤ã®å–å¾—
     * @param physicsSettingIndex ç‰©ç†æ¼”ç®—ã®è¨­å®šã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return æ­£è¦åŒ–ã•ã‚ŒãŸä½ç½®ã®æœ€å°å€¤
     */
    getNormalizationPositionMinimumValue(physicsSettingIndex) {
        return this._json
            .getRoot()
            .getValueByString(PhysicsSettings)
            .getValueByIndex(physicsSettingIndex)
            .getValueByString(Normalization)
            .getValueByString(Position)
            .getValueByString(Minimum)
            .toFloat();
    }
    /**
     * æ­£è¦åŒ–ã•ã‚ŒãŸä½ç½®ã®æœ€å¤§å€¤ã®å–å¾—
     * @param physicsSettingIndex ç‰©ç†æ¼”ç®—ã®è¨­å®šã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return æ­£è¦åŒ–ã•ã‚ŒãŸä½ç½®ã®æœ€å¤§å€¤
     */
    getNormalizationPositionMaximumValue(physicsSettingIndex) {
        return this._json
            .getRoot()
            .getValueByString(PhysicsSettings)
            .getValueByIndex(physicsSettingIndex)
            .getValueByString(Normalization)
            .getValueByString(Position)
            .getValueByString(Maximum)
            .toFloat();
    }
    /**
     * æ­£è¦åŒ–ã•ã‚ŒãŸä½ç½®ã®ãƒ‡ãƒ•ã‚©ãƒ«ãƒˆå€¤ã®å–å¾—
     * @param physicsSettingIndex ç‰©ç†æ¼”ç®—ã®è¨­å®šã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return æ­£è¦åŒ–ã•ã‚ŒãŸä½ç½®ã®ãƒ‡ãƒ•ã‚©ãƒ«ãƒˆå€¤
     */
    getNormalizationPositionDefaultValue(physicsSettingIndex) {
        return this._json
            .getRoot()
            .getValueByString(PhysicsSettings)
            .getValueByIndex(physicsSettingIndex)
            .getValueByString(Normalization)
            .getValueByString(Position)
            .getValueByString(Default)
            .toFloat();
    }
    /**
     * æ­£è¦åŒ–ã•ã‚ŒãŸè§’åº¦ã®æœ€å°å€¤ã®å–å¾—
     * @param physicsSettingIndex ç‰©ç†æ¼”ç®—ã®è¨­å®šã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return æ­£è¦åŒ–ã•ã‚ŒãŸè§’åº¦ã®æœ€å°å€¤
     */
    getNormalizationAngleMinimumValue(physicsSettingIndex) {
        return this._json
            .getRoot()
            .getValueByString(PhysicsSettings)
            .getValueByIndex(physicsSettingIndex)
            .getValueByString(Normalization)
            .getValueByString(Angle)
            .getValueByString(Minimum)
            .toFloat();
    }
    /**
     * æ­£è¦åŒ–ã•ã‚ŒãŸè§’åº¦ã®æœ€å¤§å€¤ã®å–å¾—
     * @param physicsSettingIndex
     * @return æ­£è¦åŒ–ã•ã‚ŒãŸè§’åº¦ã®æœ€å¤§å€¤
     */
    getNormalizationAngleMaximumValue(physicsSettingIndex) {
        return this._json
            .getRoot()
            .getValueByString(PhysicsSettings)
            .getValueByIndex(physicsSettingIndex)
            .getValueByString(Normalization)
            .getValueByString(Angle)
            .getValueByString(Maximum)
            .toFloat();
    }
    /**
     * æ­£è¦åŒ–ã•ã‚ŒãŸè§’åº¦ã®ãƒ‡ãƒ•ã‚©ãƒ«ãƒˆå€¤ã®å–å¾—
     * @param physicsSettingIndex ç‰©ç†æ¼”ç®—ã®è¨­å®šã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return æ­£è¦åŒ–ã•ã‚ŒãŸè§’åº¦ã®ãƒ‡ãƒ•ã‚©ãƒ«ãƒˆå€¤
     */
    getNormalizationAngleDefaultValue(physicsSettingIndex) {
        return this._json
            .getRoot()
            .getValueByString(PhysicsSettings)
            .getValueByIndex(physicsSettingIndex)
            .getValueByString(Normalization)
            .getValueByString(Angle)
            .getValueByString(Default)
            .toFloat();
    }
    /**
     * å…¥åŠ›ã®å€‹æ•°ã®å–å¾—
     * @param physicsSettingIndex ç‰©ç†æ¼”ç®—ã®è¨­å®šã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return å…¥åŠ›ã®å€‹æ•°
     */
    getInputCount(physicsSettingIndex) {
        return this._json
            .getRoot()
            .getValueByString(PhysicsSettings)
            .getValueByIndex(physicsSettingIndex)
            .getValueByString(Input)
            .getVector().length;
    }
    /**
     * å…¥åŠ›ã®é‡ã¿ã®å–å¾—
     * @param physicsSettingIndex ç‰©ç†æ¼”ç®—ã®è¨­å®šã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @param inputIndex å…¥åŠ›ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return å…¥åŠ›ã®é‡ã¿
     */
    getInputWeight(physicsSettingIndex, inputIndex) {
        return this._json
            .getRoot()
            .getValueByString(PhysicsSettings)
            .getValueByIndex(physicsSettingIndex)
            .getValueByString(Input)
            .getValueByIndex(inputIndex)
            .getValueByString(Weight)
            .toFloat();
    }
    /**
     * å…¥åŠ›ã®åè»¢ã®å–å¾—
     * @param physicsSettingIndex ç‰©ç†æ¼”ç®—ã®è¨­å®šã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @param inputIndex å…¥åŠ›ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return å…¥åŠ›ã®åè»¢
     */
    getInputReflect(physicsSettingIndex, inputIndex) {
        return this._json
            .getRoot()
            .getValueByString(PhysicsSettings)
            .getValueByIndex(physicsSettingIndex)
            .getValueByString(Input)
            .getValueByIndex(inputIndex)
            .getValueByString(Reflect)
            .toBoolean();
    }
    /**
     * å…¥åŠ›ã®ç¨®é¡žã®å–å¾—
     * @param physicsSettingIndex ç‰©ç†æ¼”ç®—ã®è¨­å®šã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @param inputIndex å…¥åŠ›ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return å…¥åŠ›ã®ç¨®é¡ž
     */
    getInputType(physicsSettingIndex, inputIndex) {
        return this._json
            .getRoot()
            .getValueByString(PhysicsSettings)
            .getValueByIndex(physicsSettingIndex)
            .getValueByString(Input)
            .getValueByIndex(inputIndex)
            .getValueByString(Type)
            .getRawString();
    }
    /**
     * å…¥åŠ›å…ƒã®IDã®å–å¾—
     * @param physicsSettingIndex ç‰©ç†æ¼”ç®—ã®è¨­å®šã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @param inputIndex å…¥åŠ›ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return å…¥åŠ›å…ƒã®ID
     */
    getInputSourceId(physicsSettingIndex, inputIndex) {
        return CubismFramework.getIdManager().getId(this._json
            .getRoot()
            .getValueByString(PhysicsSettings)
            .getValueByIndex(physicsSettingIndex)
            .getValueByString(Input)
            .getValueByIndex(inputIndex)
            .getValueByString(Source)
            .getValueByString(Id)
            .getRawString());
    }
    /**
     * å‡ºåŠ›ã®å€‹æ•°ã®å–å¾—
     * @param physicsSettingIndex ç‰©ç†æ¼”ç®—ã®è¨­å®šã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return å‡ºåŠ›ã®å€‹æ•°
     */
    getOutputCount(physicsSettingIndex) {
        return this._json
            .getRoot()
            .getValueByString(PhysicsSettings)
            .getValueByIndex(physicsSettingIndex)
            .getValueByString(Output)
            .getVector().length;
    }
    /**
     * å‡ºåŠ›ã®ç‰©ç†ç‚¹ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ã®å–å¾—
     * @param physicsSettingIndex ç‰©ç†æ¼”ç®—ã®è¨­å®šã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @param outputIndex å‡ºåŠ›ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return å‡ºåŠ›ã®ç‰©ç†ç‚¹ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     */
    getOutputVertexIndex(physicsSettingIndex, outputIndex) {
        return this._json
            .getRoot()
            .getValueByString(PhysicsSettings)
            .getValueByIndex(physicsSettingIndex)
            .getValueByString(Output)
            .getValueByIndex(outputIndex)
            .getValueByString(VertexIndex)
            .toInt();
    }
    /**
     * å‡ºåŠ›ã®è§’åº¦ã®ã‚¹ã‚±ãƒ¼ãƒ«ã‚’å–å¾—ã™ã‚‹
     * @param physicsSettingIndex ç‰©ç†æ¼”ç®—ã®è¨­å®šã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @param outputIndex å‡ºåŠ›ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return å‡ºåŠ›ã®è§’åº¦ã®ã‚¹ã‚±ãƒ¼ãƒ«
     */
    getOutputAngleScale(physicsSettingIndex, outputIndex) {
        return this._json
            .getRoot()
            .getValueByString(PhysicsSettings)
            .getValueByIndex(physicsSettingIndex)
            .getValueByString(Output)
            .getValueByIndex(outputIndex)
            .getValueByString(Scale)
            .toFloat();
    }
    /**
     * å‡ºåŠ›ã®é‡ã¿ã®å–å¾—
     * @param physicsSettingIndex ç‰©ç†æ¼”ç®—ã®è¨­å®šã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @param outputIndex å‡ºåŠ›ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return å‡ºåŠ›ã®é‡ã¿
     */
    getOutputWeight(physicsSettingIndex, outputIndex) {
        return this._json
            .getRoot()
            .getValueByString(PhysicsSettings)
            .getValueByIndex(physicsSettingIndex)
            .getValueByString(Output)
            .getValueByIndex(outputIndex)
            .getValueByString(Weight)
            .toFloat();
    }
    /**
     * å‡ºåŠ›å…ˆã®IDã®å–å¾—
     * @param physicsSettingIndex ç‰©ç†æ¼”ç®—ã®è¨­å®šã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @param outputIndex å‡ºåŠ›ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return å‡ºåŠ›å…ˆã®ID
     */
    getOutputDestinationId(physicsSettingIndex, outputIndex) {
        return CubismFramework.getIdManager().getId(this._json
            .getRoot()
            .getValueByString(PhysicsSettings)
            .getValueByIndex(physicsSettingIndex)
            .getValueByString(Output)
            .getValueByIndex(outputIndex)
            .getValueByString(Destination)
            .getValueByString(Id)
            .getRawString());
    }
    /**
     * å‡ºåŠ›ã®ç¨®é¡žã®å–å¾—
     * @param physicsSettingIndex ç‰©ç†æ¼”ç®—ã®è¨­å®šã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @param outputIndex å‡ºåŠ›ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return å‡ºåŠ›ã®ç¨®é¡ž
     */
    getOutputType(physicsSettingIndex, outputIndex) {
        return this._json
            .getRoot()
            .getValueByString(PhysicsSettings)
            .getValueByIndex(physicsSettingIndex)
            .getValueByString(Output)
            .getValueByIndex(outputIndex)
            .getValueByString(Type)
            .getRawString();
    }
    /**
     * å‡ºåŠ›ã®åè»¢ã®å–å¾—
     * @param physicsSettingIndex ç‰©ç†æ¼”ç®—ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @param outputIndex å‡ºåŠ›ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return å‡ºåŠ›ã®åè»¢
     */
    getOutputReflect(physicsSettingIndex, outputIndex) {
        return this._json
            .getRoot()
            .getValueByString(PhysicsSettings)
            .getValueByIndex(physicsSettingIndex)
            .getValueByString(Output)
            .getValueByIndex(outputIndex)
            .getValueByString(Reflect)
            .toBoolean();
    }
    /**
     * ç‰©ç†ç‚¹ã®å€‹æ•°ã®å–å¾—
     * @param physicsSettingIndex ç‰©ç†æ¼”ç®—ç”·è¨­å®šã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return ç‰©ç†ç‚¹ã®å€‹æ•°
     */
    getParticleCount(physicsSettingIndex) {
        return this._json
            .getRoot()
            .getValueByString(PhysicsSettings)
            .getValueByIndex(physicsSettingIndex)
            .getValueByString(Vertices)
            .getVector().length;
    }
    /**
     * ç‰©ç†ç‚¹ã®å‹•ãã‚„ã™ã•ã®å–å¾—
     * @param physicsSettingIndex ç‰©ç†æ¼”ç®—ã®è¨­å®šã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @param vertexIndex ç‰©ç†ç‚¹ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return ç‰©ç†ç‚¹ã®å‹•ãã‚„ã™ã•
     */
    getParticleMobility(physicsSettingIndex, vertexIndex) {
        return this._json
            .getRoot()
            .getValueByString(PhysicsSettings)
            .getValueByIndex(physicsSettingIndex)
            .getValueByString(Vertices)
            .getValueByIndex(vertexIndex)
            .getValueByString(Mobility)
            .toFloat();
    }
    /**
     * ç‰©ç†ç‚¹ã®é…ã‚Œã®å–å¾—
     * @param physicsSettingIndex ç‰©ç†æ¼”ç®—ã®è¨­å®šã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @param vertexIndex ç‰©ç†ç‚¹ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return ç‰©ç†ç‚¹ã®é…ã‚Œ
     */
    getParticleDelay(physicsSettingIndex, vertexIndex) {
        return this._json
            .getRoot()
            .getValueByString(PhysicsSettings)
            .getValueByIndex(physicsSettingIndex)
            .getValueByString(Vertices)
            .getValueByIndex(vertexIndex)
            .getValueByString(Delay)
            .toFloat();
    }
    /**
     * ç‰©ç†ç‚¹ã®åŠ é€Ÿåº¦ã®å–å¾—
     * @param physicsSettingIndex ç‰©ç†æ¼”ç®—ã®è¨­å®š
     * @param vertexIndex ç‰©ç†ç‚¹ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return ç‰©ç†ç‚¹ã®åŠ é€Ÿåº¦
     */
    getParticleAcceleration(physicsSettingIndex, vertexIndex) {
        return this._json
            .getRoot()
            .getValueByString(PhysicsSettings)
            .getValueByIndex(physicsSettingIndex)
            .getValueByString(Vertices)
            .getValueByIndex(vertexIndex)
            .getValueByString(Acceleration)
            .toFloat();
    }
    /**
     * ç‰©ç†ç‚¹ã®è·é›¢ã®å–å¾—
     * @param physicsSettingIndex ç‰©ç†æ¼”ç®—ã®è¨­å®šã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @param vertexIndex ç‰©ç†ç‚¹ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return ç‰©ç†ç‚¹ã®è·é›¢
     */
    getParticleRadius(physicsSettingIndex, vertexIndex) {
        return this._json
            .getRoot()
            .getValueByString(PhysicsSettings)
            .getValueByIndex(physicsSettingIndex)
            .getValueByString(Vertices)
            .getValueByIndex(vertexIndex)
            .getValueByString(Radius)
            .toFloat();
    }
    /**
     * ç‰©ç†ç‚¹ã®ä½ç½®ã®å–å¾—
     * @param physicsSettingIndex ç‰©ç†æ¼”ç®—ã®è¨­å®šã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @param vertexInde ç‰©ç†ç‚¹ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹
     * @return ç‰©ç†ç‚¹ã®ä½ç½®
     */
    getParticlePosition(physicsSettingIndex, vertexIndex) {
        const ret = new CubismVector2(0, 0);
        ret.x = this._json
            .getRoot()
            .getValueByString(PhysicsSettings)
            .getValueByIndex(physicsSettingIndex)
            .getValueByString(Vertices)
            .getValueByIndex(vertexIndex)
            .getValueByString(Position)
            .getValueByString(X)
            .toFloat();
        ret.y = this._json
            .getRoot()
            .getValueByString(PhysicsSettings)
            .getValueByIndex(physicsSettingIndex)
            .getValueByString(Vertices)
            .getValueByIndex(vertexIndex)
            .getValueByString(Position)
            .getValueByString(Y)
            .toFloat();
        return ret;
    }
}
// Namespace definition for compatibility.
import * as $ from './cubismphysicsjson.js';
// eslint-disable-next-line @typescript-eslint/no-namespace
export var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    Live2DCubismFramework.CubismPhysicsJson = $.CubismPhysicsJson;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));
//# sourceMappingURL=cubismphysicsjson.js.map