"use client";

export const USER_CARD_SANDBOX_SOURCE = `
function Generated(props) {
  var statusLabel =
    props.status === "online"
      ? "在线"
      : props.status === "offline"
        ? "离线"
        : "离开";
  return React.createElement(
    "div",
    {
      style: {
        padding: "16px",
        borderRadius: "8px",
        border: "1px solid #e2e8f0",
        maxWidth: "360px",
        background: "#fafafa",
      },
    },
    React.createElement(
      "div",
      { style: { display: "flex", gap: "12px", alignItems: "flex-start" } },
      React.createElement("img", {
        src: props.avatar,
        alt: "",
        width: 56,
        height: 56,
        style: { borderRadius: "9999px", objectFit: "cover" },
      }),
      React.createElement(
        "div",
        { style: { flex: 1, minWidth: 0 } },
        React.createElement(
          "div",
          { style: { fontWeight: 700, fontSize: "16px" } },
          props.username,
        ),
        React.createElement(
          "div",
          { style: { fontSize: "12px", color: "#64748b", marginTop: "4px" } },
          "状态：" + statusLabel,
        ),
        React.createElement(
          "div",
          { style: { fontSize: "13px", marginTop: "10px", lineHeight: 1.5 } },
          props.bio,
        ),
      ),
    ),
  );
}
`.trim();
