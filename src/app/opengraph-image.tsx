import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${SITE_NAME} — Deadlock Scrims, PUGs, LFT & Tournaments`;

// Site-wide fallback OG card — shown when a page (or a share target that
// doesn't understand per-route images) doesn't provide its own. Kept as
// plain flexbox/text: Satori (what ImageResponse renders through) only
// supports a CSS subset, so this deliberately skips the site's custom SVG
// sigil mark in favor of something guaranteed to render everywhere.
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#14100e",
          backgroundImage:
            "radial-gradient(circle at 50% 35%, rgba(201,163,92,0.16), rgba(20,16,14,0) 60%)",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              transform: "rotate(45deg)",
              background: "#3a8c7e",
            }}
          />
          <div
            style={{
              fontSize: 96,
              fontWeight: 700,
              letterSpacing: 4,
              color: "#e8dcc4",
            }}
          >
            SCRIMLOCK
          </div>
          <div
            style={{
              width: 14,
              height: 14,
              transform: "rotate(45deg)",
              background: "#3a8c7e",
            }}
          />
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 32,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#c9a35c",
          }}
        >
          Deadlock Scrims · PUGs · LFT · Tournaments
        </div>
        <div
          style={{
            marginTop: 44,
            width: 560,
            height: 1,
            background: "#97753a",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
