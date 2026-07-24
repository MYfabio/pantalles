"use client";
import { useEffect, useState } from "react";

const SCREEN_WIDTH = 1080;
const SCREEN_HEIGHT = 1920;

export default function GeneratedScreenFrame({ html }: { html: string }) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      setScale(
        Math.min(window.innerWidth / SCREEN_WIDTH, window.innerHeight / SCREEN_HEIGHT)
      );
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-black overflow-hidden">
      <iframe
        srcDoc={html}
        title="Contingut generat"
        sandbox=""
        style={{
          width: SCREEN_WIDTH,
          height: SCREEN_HEIGHT,
          border: "none",
          transform: `scale(${scale})`,
        }}
      />
    </div>
  );
}
