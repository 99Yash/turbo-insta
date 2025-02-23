import { ImageResponse } from "next/og";

// Image metadata
export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "black",
          borderRadius: "4px",
          fontFamily: "Inter",
        }}
      >
        <div
          style={{
            fontSize: "20px",
            fontWeight: "900",
            background: "linear-gradient(to bottom right, #a78bfa, #818cf8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          SQL
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
