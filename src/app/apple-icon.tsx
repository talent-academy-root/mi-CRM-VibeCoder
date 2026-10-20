import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#16A34A",
          color: "#FFFFFF",
          fontSize: 100,
          fontWeight: 600,
          fontFamily: "sans-serif",
        }}
      >
        V
      </div>
    ),
    { ...size },
  );
}
