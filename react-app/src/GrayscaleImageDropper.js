import React, { useRef, useEffect } from "react";
import p5 from "p5";

export default function GrayscaleImageDropper() {
  const sketchRef = useRef();

  useEffect(() => {
    let myP5;
    const sketch = (p) => {
      let img;

      p.setup = () => {
        const canvas = p.createCanvas(600, 400);
        canvas.drop(handleFile); // 注册 drop 事件
        p.background(240);
        p.textAlign(p.CENTER, p.CENTER);
        p.text("拖拽图片到此处", p.width / 2, p.height / 2);
      };

      function handleFile(file) {
        if (file.type === "image") {
          img = p.loadImage(file.data, () => {
            img.filter(p.GRAY);
            p.redraw();
          });
        } else {
          console.log("不是图片文件");
        }
      }

      p.draw = () => {
        if (img) {
          p.image(img, 0, 0, p.width, p.height);
        }
      };
    };

    myP5 = new p5(sketch, sketchRef.current);

    return () => {
      myP5.remove();
    };
  }, []);

  return <div ref={sketchRef}></div>;
}
