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
          background: "white",
          borderRadius: "4px",
        }}
      >
        <div
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            background: "linear-gradient(to bottom right, #7c3aed, #4f46e5)",
            backgroundClip: "text",
            color: "transparent",
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
