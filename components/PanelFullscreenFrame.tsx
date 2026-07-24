"use client";
import { useEffect, useState } from "react";
import PanelDisplay, { PanelBlockData, PanelSettingsData } from "@/components/PanelDisplay";

const SCREEN_WIDTH = 1080;
const SCREEN_HEIGHT = 1920;

export default function PanelFullscreenFrame({
  blocks,
  settings,
}: {
  blocks: PanelBlockData[];
  settings: PanelSettingsData;
}) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      setScale(Math.min(window.innerWidth / SCREEN_WIDTH, window.innerHeight / SCREEN_HEIGHT));
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-black overflow-hidden">
      <div style={{ transform: `scale(${scale})` }}>
        <PanelDisplay blocks={blocks} settings={settings} />
      </div>
    </div>
  );
}
