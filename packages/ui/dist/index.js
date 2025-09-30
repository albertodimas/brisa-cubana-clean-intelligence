// src/badge.tsx
import { jsx } from "react/jsx-runtime";
var toneTokens = {
  teal: "border-teal-300/40 bg-teal-400/15 text-teal-100",
  sunset: "border-rose-400/50 bg-rose-500/15 text-rose-100",
  neutral: "border-white/20 bg-white/10 text-white"
};
function Badge({ tone = "teal", className = "", children }) {
  return /* @__PURE__ */ jsx(
    "span",
    {
      className: `inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] ${toneTokens[tone]} ${className}`,
      children
    }
  );
}

// src/button.tsx
import { jsx as jsx2 } from "react/jsx-runtime";
function Button(props) {
  const { children, intent = "primary", className = "" } = props;
  const base = "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
  const palettes = {
    primary: "bg-gradient-to-r from-teal-400 via-emerald-400 to-emerald-300 text-white shadow-lg shadow-teal-500/30 hover:shadow-teal-400/40 hover:from-teal-300 hover:to-emerald-200 focus-visible:outline-emerald-300",
    secondary: "bg-white/10 text-white border border-white/20 hover:bg-white/20 focus-visible:outline-white",
    ghost: "bg-transparent text-neutral-100 hover:bg-white/10 focus-visible:outline-neutral-200"
  };
  if (props.as === "a") {
    const { as: anchorTag, ...rest2 } = props;
    void anchorTag;
    return /* @__PURE__ */ jsx2("a", { className: `${base} ${palettes[intent]} ${className}`, ...rest2, children });
  }
  const { as: buttonTag, ...rest } = props;
  void buttonTag;
  return /* @__PURE__ */ jsx2("button", { className: `${base} ${palettes[intent]} ${className}`, ...rest, children });
}
var tokens = {
  brand: "#00857A",
  accent: "#FF5A7B"
};

// src/card.tsx
import { jsx as jsx3, jsxs } from "react/jsx-runtime";
function Card({
  title,
  description,
  icon,
  bleed = false,
  className = "",
  children
}) {
  return /* @__PURE__ */ jsxs(
    "article",
    {
      className: `group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-lg shadow-black/30 backdrop-blur transition hover:border-white/20 hover:bg-white/[0.07] ${className}`,
      children: [
        /* @__PURE__ */ jsx3(
          "div",
          {
            className: `absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 transition group-hover:opacity-100 ${bleed ? "" : "pointer-events-none"}`
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "relative flex flex-col gap-3", children: [
          icon ? /* @__PURE__ */ jsx3("div", { className: "text-2xl text-teal-200", children: icon }) : null,
          title ? /* @__PURE__ */ jsx3("h3", { className: "text-lg font-semibold text-white", children: title }) : null,
          description ? /* @__PURE__ */ jsx3("p", { className: "text-sm text-neutral-300", children: description }) : null,
          children
        ] })
      ]
    }
  );
}

// src/metric.tsx
import { jsx as jsx4, jsxs as jsxs2 } from "react/jsx-runtime";
function Metric({ value, label, helper }) {
  return /* @__PURE__ */ jsxs2("div", { className: "rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 shadow-inner shadow-black/40", children: [
    /* @__PURE__ */ jsx4("div", { className: "text-3xl font-semibold text-white sm:text-4xl", children: value }),
    /* @__PURE__ */ jsx4("p", { className: "text-sm text-neutral-300", children: label }),
    helper ? /* @__PURE__ */ jsx4("p", { className: "mt-1 text-xs text-neutral-400", children: helper }) : null
  ] });
}

// src/section.tsx
import { jsx as jsx5, jsxs as jsxs3 } from "react/jsx-runtime";
function Section({
  id,
  eyebrow,
  title,
  description,
  align = "left",
  className = "",
  children
}) {
  const alignment = align === "center" ? "items-center text-center" : "items-start text-left";
  return /* @__PURE__ */ jsxs3("section", { id, className: `flex w-full flex-col gap-8 ${className}`, children: [
    /* @__PURE__ */ jsxs3("header", { className: `flex flex-col gap-3 ${alignment}`, children: [
      eyebrow ? /* @__PURE__ */ jsx5("span", { className: "uppercase tracking-[0.25em] text-xs font-semibold text-teal-200", children: eyebrow }) : null,
      /* @__PURE__ */ jsx5("h2", { className: "text-3xl font-semibold text-white sm:text-4xl", children: title }),
      description ? /* @__PURE__ */ jsx5("p", { className: "max-w-2xl text-base text-neutral-300", children: description }) : null
    ] }),
    children
  ] });
}
export {
  Badge,
  Button,
  Card,
  Metric,
  Section,
  tokens
};
