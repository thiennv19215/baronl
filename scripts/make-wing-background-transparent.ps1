param()

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$wingDirectory = Join-Path $projectRoot 'assets\fx\dance'

Add-Type -AssemblyName System.Drawing
$drawingAssembly = [System.Drawing.Bitmap].Assembly.Location
Add-Type -ReferencedAssemblies $drawingAssembly -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class WingTransparency
{
    public static void Convert(string sourcePath, string outputPath)
    {
        using (var source = new Bitmap(sourcePath))
        using (var output = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb))
        {
            using (var graphics = Graphics.FromImage(output))
            {
                graphics.DrawImageUnscaled(source, 0, 0);
            }

            var bounds = new Rectangle(0, 0, output.Width, output.Height);
            var data = output.LockBits(bounds, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
            var bytes = Math.Abs(data.Stride) * output.Height;
            var pixels = new byte[bytes];
            Marshal.Copy(data.Scan0, pixels, 0, bytes);

            for (var y = 0; y < output.Height; y++)
            {
                var row = y * Math.Abs(data.Stride);
                for (var x = 0; x < output.Width; x++)
                {
                    var index = row + x * 4;
                    var blue = pixels[index];
                    var green = pixels[index + 1];
                    var red = pixels[index + 2];
                    var alpha = Math.Max(red, Math.Max(green, blue));
                    pixels[index + 3] = (byte)alpha;
                    if (alpha == 0) continue;
                    pixels[index] = (byte)Math.Min(255, blue * 255 / alpha);
                    pixels[index + 1] = (byte)Math.Min(255, green * 255 / alpha);
                    pixels[index + 2] = (byte)Math.Min(255, red * 255 / alpha);
                }
            }

            Marshal.Copy(pixels, 0, data.Scan0, bytes);
            output.UnlockBits(data);
            output.Save(outputPath, ImageFormat.Png);
        }
    }
}
'@

foreach ($name in @('top1.png', 'top2.png', 'top3.png', 'canh3.png')) {
    $sourcePath = Join-Path $wingDirectory $name
    $temporaryPath = Join-Path $wingDirectory "$name.transparent.tmp.png"
    [WingTransparency]::Convert($sourcePath, $temporaryPath)
    Move-Item -LiteralPath $temporaryPath -Destination $sourcePath -Force
}
