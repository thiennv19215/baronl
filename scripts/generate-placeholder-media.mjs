#!/usr/bin/env node

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');
const force = process.argv.includes('--force');

function writeWav(target, durationSeconds, sampleAt) {
  if (existsSync(target) && !force) {
    process.stdout.write(`skip existing ${target}\n`);
    return;
  }

  const sampleRate = 48_000;
  const channels = 1;
  const bitsPerSample = 16;
  const sampleCount = Math.round(durationSeconds * sampleRate);
  const dataBytes = sampleCount * channels * (bitsPerSample / 8);
  const output = Buffer.alloc(44 + dataBytes);

  output.write('RIFF', 0, 'ascii');
  output.writeUInt32LE(36 + dataBytes, 4);
  output.write('WAVE', 8, 'ascii');
  output.write('fmt ', 12, 'ascii');
  output.writeUInt32LE(16, 16);
  output.writeUInt16LE(1, 20);
  output.writeUInt16LE(channels, 22);
  output.writeUInt32LE(sampleRate, 24);
  output.writeUInt32LE(sampleRate * channels * (bitsPerSample / 8), 28);
  output.writeUInt16LE(channels * (bitsPerSample / 8), 32);
  output.writeUInt16LE(bitsPerSample, 34);
  output.write('data', 36, 'ascii');
  output.writeUInt32LE(dataBytes, 40);

  for (let i = 0; i < sampleCount; i += 1) {
    const t = i / sampleRate;
    const value = Math.max(-1, Math.min(1, sampleAt(t, durationSeconds)));
    output.writeInt16LE(Math.round(value * 32767), 44 + i * 2);
  }

  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, output);
  process.stdout.write(`generated ${target}\n`);
}

function envelope(t, duration) {
  const fade = 0.025;
  return Math.min(1, t / fade, (duration - t) / fade);
}

const chimePath = resolve(repoRoot, 'assets/audio/placeholder-chime.wav');
writeWav(chimePath, 1, (t, duration) => {
  const notes = [523.251, 659.255, 783.991];
  const slot = Math.min(notes.length - 1, Math.floor(t / (duration / notes.length)));
  const localT = t - slot * (duration / notes.length);
  const localDuration = duration / notes.length;
  const localEnvelope = envelope(localT, localDuration);
  return 0.12 * localEnvelope * Math.sin(2 * Math.PI * notes[slot] * t);
});

const musicPath = resolve(repoRoot, 'assets/music/placeholder-loop.wav');
writeWav(musicPath, 4, (t, duration) => {
  const notes = [261.626, 329.628, 391.995, 523.251];
  const slot = Math.min(notes.length - 1, Math.floor(t));
  const localT = t - Math.floor(t);
  const localEnvelope = envelope(localT, 1);
  const base = Math.sin(2 * Math.PI * notes[slot] * t);
  const harmonic = 0.25 * Math.sin(2 * Math.PI * notes[slot] * 2 * t);
  const loopFade = Math.min(1, t / 0.02, (duration - t) / 0.02);
  return 0.08 * localEnvelope * loopFade * (base + harmonic);
});

const videoPath = resolve(repoRoot, 'assets/video/stage-placeholder.webm');
if (existsSync(videoPath) && !force) {
  process.stdout.write(`skip existing ${videoPath}\n`);
} else {
  mkdirSync(dirname(videoPath), { recursive: true });
  const filter = [
    'drawgrid=width=60:height=60:thickness=2:color=0x22d3ee@0.20',
    'drawbox=x=60+20*sin(2*PI*t/3):y=210:w=420:h=320:color=0x8b5cf6@0.45:t=fill',
    'drawbox=x=90:y=650+20*cos(2*PI*t/3):w=360:h=110:color=0x090b14@0.86:t=fill',
    "drawtext=fontfile='C\\:/Windows/Fonts/segoeui.ttf':text='ORBITSTAGE PLACEHOLDER':fontcolor=white:fontsize=28:x=(w-text_w)/2:y=682",
    "drawtext=fontfile='C\\:/Windows/Fonts/segoeui.ttf':text='LICENSED TEST MEDIA':fontcolor=0x22d3ee:fontsize=18:x=(w-text_w)/2:y=724",
    'format=yuv420p'
  ].join(',');
  const result = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'lavfi', '-i', 'color=c=0x090b14:s=540x960:r=24:d=3',
    '-vf', filter,
    '-an', '-map_metadata', '-1',
    '-c:v', 'libvpx-vp9', '-deadline', 'good', '-cpu-used', '2', '-b:v', '500k',
    videoPath
  ], { stdio: 'inherit' });

  if (result.error?.code === 'ENOENT') {
    process.stderr.write('ffmpeg was not found; WAV files were generated but WebM was not. Install FFmpeg or keep the checked-in WebM.\n');
    process.exitCode = 2;
  } else if (result.status !== 0) {
    process.stderr.write(`ffmpeg failed with exit code ${result.status}.\n`);
    process.exitCode = result.status ?? 1;
  } else {
    process.stdout.write(`generated ${videoPath}\n`);
  }
}

function generateWindowsIcon(target) {
  if (existsSync(target) && !force) {
    process.stdout.write(`skip existing ${target}\n`);
    return;
  }

  const width = 256;
  const height = 256;
  const rgba = new Uint8Array(width * height * 4);

  function blendPixel(x, y, color, alpha = 1) {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const offset = (y * width + x) * 4;
    const sourceAlpha = Math.max(0, Math.min(1, alpha));
    const destinationAlpha = rgba[offset + 3] / 255;
    const outputAlpha = sourceAlpha + destinationAlpha * (1 - sourceAlpha);
    if (outputAlpha === 0) return;
    for (let channel = 0; channel < 3; channel += 1) {
      rgba[offset + channel] = Math.round((color[channel] * sourceAlpha + rgba[offset + channel] * destinationAlpha * (1 - sourceAlpha)) / outputAlpha);
    }
    rgba[offset + 3] = Math.round(outputAlpha * 255);
  }

  function insideRoundedSquare(x, y, radius) {
    const cx = Math.max(radius, Math.min(width - radius, x));
    const cy = Math.max(radius, Math.min(height - radius, y));
    return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;
  }

  function ellipseDistance(x, y, centerX, centerY, radiusX, radiusY, angle) {
    const dx = x - centerX;
    const dy = y - centerY;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const rotatedX = dx * cos + dy * sin;
    const rotatedY = -dx * sin + dy * cos;
    return Math.sqrt((rotatedX / radiusX) ** 2 + (rotatedY / radiusY) ** 2);
  }

  function insideTriangle(x, y, a, b, c) {
    const sign = (p1, p2, p3) => (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1]);
    const point = [x, y];
    const d1 = sign(point, a, b);
    const d2 = sign(point, b, c);
    const d3 = sign(point, c, a);
    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
  }

  const navy = [9, 11, 20];
  const panel = [16, 21, 38];
  const violet = [139, 92, 246];
  const cyan = [34, 211, 238];
  const lime = [163, 230, 53];
  const white = [248, 250, 252];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (insideRoundedSquare(x + 0.5, y + 0.5, 56)) blendPixel(x, y, navy);
    }
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const primaryOrbit = ellipseDistance(x, y, 128, 128, 89, 52, -28 * Math.PI / 180);
      if (Math.abs(primaryOrbit - 1) < 0.075) {
        const mix = Math.max(0, Math.min(1, (x + y) / (width + height)));
        const first = mix < 0.55 ? cyan : violet;
        const second = mix < 0.55 ? violet : lime;
        const localMix = mix < 0.55 ? mix / 0.55 : (mix - 0.55) / 0.45;
        blendPixel(x, y, first.map((value, index) => Math.round(value + (second[index] - value) * localMix)));
      }
      const secondaryOrbit = ellipseDistance(x, y, 128, 128, 89, 52, 54 * Math.PI / 180);
      if (Math.abs(secondaryOrbit - 1) < 0.035) blendPixel(x, y, violet, 0.48);
      const centerRadius = Math.hypot(x - 128, y - 117);
      if (centerRadius < 45) blendPixel(x, y, panel);
      if (centerRadius >= 36 && centerRadius < 45) blendPixel(x, y, centerRadius < 40.5 ? cyan : violet);
      if (insideTriangle(x, y, [119, 97], [150, 117], [119, 137])) blendPixel(x, y, white);
      if (Math.hypot(x - 205, y - 61) < 9) blendPixel(x, y, lime);
    }
  }

  const maskRowBytes = Math.ceil(width / 32) * 4;
  const bitmapBytes = width * height * 4;
  const maskBytes = maskRowBytes * height;
  const imageBytes = 40 + bitmapBytes + maskBytes;
  const output = Buffer.alloc(6 + 16 + imageBytes);
  output.writeUInt16LE(0, 0);
  output.writeUInt16LE(1, 2);
  output.writeUInt16LE(1, 4);
  output.writeUInt8(0, 6);
  output.writeUInt8(0, 7);
  output.writeUInt8(0, 8);
  output.writeUInt8(0, 9);
  output.writeUInt16LE(1, 10);
  output.writeUInt16LE(32, 12);
  output.writeUInt32LE(imageBytes, 14);
  output.writeUInt32LE(22, 18);
  output.writeUInt32LE(40, 22);
  output.writeInt32LE(width, 26);
  output.writeInt32LE(height * 2, 30);
  output.writeUInt16LE(1, 34);
  output.writeUInt16LE(32, 36);
  output.writeUInt32LE(0, 38);
  output.writeUInt32LE(bitmapBytes, 42);

  const pixelOffset = 62;
  for (let y = 0; y < height; y += 1) {
    const sourceY = height - 1 - y;
    for (let x = 0; x < width; x += 1) {
      const source = (sourceY * width + x) * 4;
      const destination = pixelOffset + (y * width + x) * 4;
      output[destination] = rgba[source + 2];
      output[destination + 1] = rgba[source + 1];
      output[destination + 2] = rgba[source];
      output[destination + 3] = rgba[source + 3];
    }
  }

  const maskOffset = pixelOffset + bitmapBytes;
  for (let y = 0; y < height; y += 1) {
    const sourceY = height - 1 - y;
    for (let x = 0; x < width; x += 1) {
      if (rgba[(sourceY * width + x) * 4 + 3] === 0) {
        output[maskOffset + y * maskRowBytes + Math.floor(x / 8)] |= 0x80 >> (x % 8);
      }
    }
  }

  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, output);
  process.stdout.write(`generated ${target}\n`);
}

generateWindowsIcon(resolve(repoRoot, 'assets/branding/icon.ico'));
