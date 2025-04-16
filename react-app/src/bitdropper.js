import React, { useRef, useEffect } from "react";
import p5 from "p5";

export default function BitDropper() {
  const sketchRef = useRef();

  useEffect(() => {
    let myP5;

    const sketch = (p) => {
      let originalImg, ditheredImg;
      let bayerMatrix;
      let thresholdMultiplier = 1.0;
      let pixelScaleSlider, thresholdSlider, matrixSelector;
      let colorDark = [0, 0, 0];
      let colorLight = [255, 255, 255];
      let darkColorPicker, lightColorPicker;
      let pixelScale = 1;

      const bayerMatrices = {
        "2x2": [
          [0, 128],
          [192, 64],
        ],
        "4x4": [
          [15, 135, 45, 165],
          [195, 75, 225, 105],
          [60, 180, 30, 150],
          [240, 120, 210, 90],
        ],
        "8x8": [
          [0, 48, 12, 60, 3, 51, 15, 63],
          [32, 16, 44, 28, 35, 19, 47, 31],
          [8, 56, 4, 52, 11, 59, 7, 55],
          [40, 24, 36, 20, 43, 27, 39, 23],
          [2, 50, 14, 62, 1, 49, 13, 61],
          [34, 18, 46, 30, 33, 17, 45, 29],
          [10, 58, 6, 54, 9, 57, 5, 53],
          [42, 26, 38, 22, 41, 25, 37, 21],
        ],
      };

      p.setup = () => {
        p.textSize(12);
        p.textAlign(p.LEFT, p.CENTER);
        p.createCanvas(800, 600);

        pixelScaleSlider = p.createSlider(1, 10, 1, 1);
        pixelScaleSlider.position(10, p.height + 10);
        pixelScaleSlider.input(applyOrderedDithering);

        thresholdSlider = p.createSlider(0.1, 3.0, 1.0, 0.1);
        thresholdSlider.position(160, p.height + 10);
        thresholdSlider.input(applyOrderedDithering);

        matrixSelector = p.createSelect();
        matrixSelector.position(310, p.height + 10);
        matrixSelector.option("2x2");
        matrixSelector.option("4x4");
        matrixSelector.option("8x8");
        matrixSelector.selected("4x4");
        matrixSelector.changed(applyOrderedDithering);

        darkColorPicker = p.createColorPicker("#000000");
        darkColorPicker.position(460, p.height + 10);
        darkColorPicker.input(() => {
          let c = darkColorPicker.color();
          colorDark = [p.red(c), p.green(c), p.blue(c)];
          applyOrderedDithering();
        });

        lightColorPicker = p.createColorPicker("#ffffff");
        lightColorPicker.position(520, p.height + 10);
        lightColorPicker.input(() => {
          let c = lightColorPicker.color();
          colorLight = [p.red(c), p.green(c), p.blue(c)];
          applyOrderedDithering();
        });

        const paletteBtns = [
          {
            label: "🎮 Gameboy 绿",
            x: 600,
            y: p.height + 10,
            dark: [15, 56, 15],
            light: [155, 188, 15],
            darkHex: "#0f380f",
            lightHex: "#9bbc0f",
          },
          {
            label: "🔴🔵 红蓝风",
            x: 600,
            y: p.height + 40,
            dark: [255, 0, 0],
            light: [0, 0, 255],
            darkHex: "#ff0000",
            lightHex: "#0000ff",
          },
          {
            label: "🟣🟠 紫橙风",
            x: 600,
            y: p.height + 70,
            dark: [94, 44, 165],
            light: [255, 111, 0],
            darkHex: "#5e2ca5",
            lightHex: "#ff6f00",
          },
        ];

        for (const btn of paletteBtns) {
          let b = p.createButton(btn.label);
          b.position(btn.x, btn.y);
          b.mousePressed(() => {
            darkColorPicker.value(btn.darkHex);
            lightColorPicker.value(btn.lightHex);
            colorDark = btn.dark;
            colorLight = btn.light;
            applyOrderedDithering();
          });
        }

        const canvasElt = document.querySelector("canvas");
        canvasElt.addEventListener("dragover", (e) => e.preventDefault());
        canvasElt.addEventListener("drop", gotFile);
      };

      p.draw = () => {
        p.fill(0);
        p.noStroke();
        p.background(220);
        p.noSmooth();

        pixelScale = pixelScaleSlider.value();
        thresholdMultiplier = thresholdSlider.value();
        bayerMatrix = bayerMatrices[matrixSelector.value()];

        if (ditheredImg) {
          p.image(ditheredImg, 0, 0, p.width, p.height);
        }
      };

      function gotFile(e) {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith("image")) {
          p.loadImage(URL.createObjectURL(file), (img) => {
            originalImg = img;

            const maxSize = 800;
            const aspect = img.width / img.height;
            if (aspect >= 1) {
              p.resizeCanvas(maxSize, p.int(maxSize / aspect));
            } else {
              p.resizeCanvas(p.int(maxSize * aspect), maxSize);
            }

            applyOrderedDithering();
          });
        }
      }

      function applyOrderedDithering() {
        if (!originalImg) return;

        pixelScale = pixelScaleSlider.value();
        bayerMatrix = bayerMatrices[matrixSelector.value()];
        thresholdMultiplier = thresholdSlider.value();

        const w = p.floor(originalImg.width / pixelScale);
        const h = p.floor(originalImg.height / pixelScale);

        ditheredImg = p.createImage(w, h);
        ditheredImg.loadPixels();
        originalImg.loadPixels();

        const matrixSize = bayerMatrix.length;

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const srcX = p.floor(x * pixelScale);
            const srcY = p.floor(y * pixelScale);
            const i = 4 * (srcY * originalImg.width + srcX);
            const r = originalImg.pixels[i];
            const g = originalImg.pixels[i + 1];
            const b = originalImg.pixels[i + 2];
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;

            const threshold = bayerMatrix[y % matrixSize][x % matrixSize] * thresholdMultiplier;
            const useColor = gray > threshold ? colorLight : colorDark;

            const j = 4 * (y * w + x);
            ditheredImg.pixels[j] = useColor[0];
            ditheredImg.pixels[j + 1] = useColor[1];
            ditheredImg.pixels[j + 2] = useColor[2];
            ditheredImg.pixels[j + 3] = 255;
          }
        }

        ditheredImg.updatePixels();
      }
    };

    myP5 = new p5(sketch, sketchRef.current);
    return () => myP5.remove();
  }, []);

  return <div ref={sketchRef}></div>;
}