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
    [192, 64]
  ],
  "4x4": [
    [15, 135, 45, 165],
    [195, 75, 225, 105],
    [60, 180, 30, 150],
    [240, 120, 210, 90]
  ],
  "8x8": [
    [0,  48, 12, 60, 3, 51, 15, 63],
    [32, 16, 44, 28, 35, 19, 47, 31],
    [8,  56, 4,  52, 11, 59, 7,  55],
    [40, 24, 36, 20, 43, 27, 39, 23],
    [2,  50, 14, 62, 1,  49, 13, 61],
    [34, 18, 46, 30, 33, 17, 45, 29],
    [10, 58, 6,  54, 9,  57, 5,  53],
    [42, 26, 38, 22, 41, 25, 37, 21]
  ]
};

function setup() {
  textSize(12);
  textAlign(LEFT, CENTER);
  textSize(12);
  textAlign(LEFT, CENTER);
  createCanvas(800, 600);

  pixelScaleSlider = createSlider(1, 10, 1, 1);
  pixelScaleSlider.position(10, height + 10);
  pixelScaleSlider.input(applyOrderedDithering);

  thresholdSlider = createSlider(0.1, 3.0, 1.0, 0.1);
  thresholdSlider.position(160, height + 10);
  thresholdSlider.input(applyOrderedDithering);

  matrixSelector = createSelect();
  matrixSelector.position(310, height + 10);
  matrixSelector.option("2x2");
  matrixSelector.option("4x4");
  matrixSelector.option("8x8");
  matrixSelector.selected("4x4");
  matrixSelector.changed(applyOrderedDithering);

  darkColorPicker = createColorPicker('#000000');
  darkColorPicker.position(460, height + 10);
  darkColorPicker.input(() => {
    let c = darkColorPicker.color();
    colorDark = [red(c), green(c), blue(c)];
    applyOrderedDithering();
  });

  lightColorPicker = createColorPicker('#ffffff');
  lightColorPicker.position(520, height + 10);
  lightColorPicker.input(() => {
    let c = lightColorPicker.color();
    colorLight = [red(c), green(c), blue(c)];
    applyOrderedDithering();
  });

  let gameboyBtn = createButton("🎮 Gameboy 绿");
  gameboyBtn.position(600, height + 10);
  gameboyBtn.mousePressed(() => {
    darkColorPicker.value('#0f380f');
    lightColorPicker.value('#9bbc0f');
    colorDark = [15, 56, 15];
    colorLight = [155, 188, 15];
    applyOrderedDithering();
  });

  let redBlueBtn = createButton("🔴🔵 红蓝风");
  redBlueBtn.position(600, height + 40);
  redBlueBtn.mousePressed(() => {
    darkColorPicker.value('#ff0000');
    lightColorPicker.value('#0000ff');
    colorDark = [255, 0, 0];
    colorLight = [0, 0, 255];
    applyOrderedDithering();
  });

  let purpleOrangeBtn = createButton("🟣🟠 紫橙风");
  purpleOrangeBtn.position(600, height + 70);
  purpleOrangeBtn.mousePressed(() => {
    darkColorPicker.value('#5e2ca5');
    lightColorPicker.value('#ff6f00');
    colorDark = [94, 44, 165];
    colorLight = [255, 111, 0];
    applyOrderedDithering();
  });

  let canvasElt = document.querySelector("canvas");
  canvasElt.addEventListener("dragover", e => e.preventDefault());
  canvasElt.addEventListener("drop", gotFile);
}

function draw() {
  fill(0);
  noStroke();
  
  background(220);
  noSmooth();

  pixelScale = pixelScaleSlider.value();
  thresholdMultiplier = thresholdSlider.value();
  bayerMatrix = bayerMatrices[matrixSelector.value()];

  if (ditheredImg) {
    image(ditheredImg, 0, 0, width, height);
  }
}

function gotFile(e) {
  e.preventDefault();
  let file = e.dataTransfer.files[0];
  if (file.type.startsWith("image")) {
    loadImage(URL.createObjectURL(file), img => {
      originalImg = img;

      let maxSize = 800;
      let aspect = img.width / img.height;
      if (aspect >= 1) {
        resizeCanvas(maxSize, int(maxSize / aspect));
      } else {
        resizeCanvas(int(maxSize * aspect), maxSize);
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

  let w = floor(originalImg.width / pixelScale);
  let h = floor(originalImg.height / pixelScale);

  ditheredImg = createImage(w, h);
  ditheredImg.loadPixels();

  originalImg.loadPixels();
  let matrixSize = bayerMatrix.length;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let srcX = floor(x * pixelScale);
      let srcY = floor(y * pixelScale);
      let i = 4 * (srcY * originalImg.width + srcX);
      let r = originalImg.pixels[i];
      let g = originalImg.pixels[i + 1];
      let b = originalImg.pixels[i + 2];
      let gray = 0.299 * r + 0.587 * g + 0.114 * b;

      let threshold = bayerMatrix[y % matrixSize][x % matrixSize] * thresholdMultiplier;
      let useColor = gray > threshold ? colorLight : colorDark;

      let j = 4 * (y * w + x);
      ditheredImg.pixels[j] = useColor[0];
      ditheredImg.pixels[j + 1] = useColor[1];
      ditheredImg.pixels[j + 2] = useColor[2];
      ditheredImg.pixels[j + 3] = 255;
    }
  }

  ditheredImg.updatePixels();
}
