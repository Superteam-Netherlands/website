// Shared style atoms ported from the design, on the operator type scale
// (13->16, 14->17, 15->18, 16->19, 17->20, 18->21, 20->24, 21->26, 24->28,
// 34->40, 38->44) with every control at least 44px tall and cards at 24px
// padding, 28px above. Screens compose these and add screen-specific inline
// styles; when in doubt the design's exact inline style wins over reuse.
//
// Stateful shared pieces (useSavedFlash, useConfirmDelete, CopyButton) live
// in ui-client.tsx: server components import this file's plain atoms, and a
// module reachable from a Server Component may not import React hooks.
import type { CSSProperties } from "react";

/* ── Auth card (login / change password) ─────────────────────────── */

export const authCard: CSSProperties = {
  width: 360,
  maxWidth: "100%",
  background: "var(--card)",
  borderRadius: 0,
  boxShadow: "var(--shadow-2)",
  padding: "28px 26px",
  boxSizing: "border-box",
};

export const authLabel: CSSProperties = {
  fontSize: 14,
  color: "var(--label-3)",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

export const authField: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  border: "1px solid var(--sep)",
  borderRadius: 0,
  background: "transparent",
  color: "var(--label-1)",
  fontSize: 18,
  minHeight: 44,
};

export const authSubmit: CSSProperties = {
  width: "100%",
  marginTop: 16,
  padding: 11,
  border: "none",
  borderRadius: 0,
  background: "var(--label-1)",
  color: "var(--bg)",
  fontSize: 18,
  fontWeight: 600,
  cursor: "pointer",
  minHeight: 44,
};

/* ── Page scaffolding ────────────────────────────────────────────── */

export const card: CSSProperties = {
  background: "var(--card)",
  borderRadius: 0,
  boxShadow: "var(--shadow-1)",
  padding: 24,
  marginTop: 28,
};

export const pageTitle: CSSProperties = {
  fontFamily: "var(--serif)",
  fontSize: 44,
  fontWeight: 400,
  letterSpacing: "-0.01em",
  margin: 0,
};

export const cardTitle: CSSProperties = {
  fontFamily: "var(--serif)",
  fontSize: 26,
  fontWeight: 400,
};

/* ── Form controls (the design's default input/select/button) ────── */

export const input: CSSProperties = {
  boxSizing: "border-box",
  minHeight: 44,
  padding: "8px 10px",
  border: "1px solid var(--sep)",
  borderRadius: 0,
  background: "transparent",
  color: "var(--label-1)",
  fontSize: 17,
};

export const smallInput: CSSProperties = {
  boxSizing: "border-box",
  minHeight: 44,
  padding: "7px 10px",
  border: "1px solid var(--sep)",
  borderRadius: 0,
  background: "transparent",
  color: "var(--label-1)",
  fontSize: 16,
};

/** Inline-edit inputs sit on the tinted row, so they get a card background. */
export const editInput: CSSProperties = {
  boxSizing: "border-box",
  minHeight: 44,
  padding: "7px 9px",
  border: "1px solid var(--sep)",
  borderRadius: 0,
  background: "var(--card)",
  color: "var(--label-1)",
  fontSize: 16,
  minWidth: 0,
};

export const primaryBtn: CSSProperties = {
  border: "none",
  cursor: "pointer",
  minHeight: 44,
  padding: "7px 14px",
  borderRadius: 0,
  fontSize: 17,
  fontWeight: 600,
  background: "var(--label-1)",
  color: "var(--bg)",
};

export const accentBtn: CSSProperties = {
  border: "none",
  cursor: "pointer",
  minHeight: 44,
  padding: "7px 12px",
  borderRadius: 0,
  fontSize: 16,
  fontWeight: 600,
  background: "var(--fill-2)",
  color: "var(--accent)",
};

/** Label-above-input column used by every inline create form. */
export function FormField({
  label,
  hint,
  flex,
  minWidth,
  width,
  children,
}: {
  label: string;
  /** Explains what the field controls, on a marker beside the label. */
  hint?: string;
  flex?: number;
  minWidth?: number;
  width?: number;
  children: React.ReactNode;
}) {
  return (
    <label
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        fontSize: 14,
        color: "var(--label-2)",
        flex,
        minWidth,
        width,
      }}
    >
      {hint ? (
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          {label}
          <span
            title={hint}
            style={{
              flex: "none",
              width: 13,
              height: 13,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "help",
              boxShadow: "0 0 0 1px var(--sep)",
              color: "var(--label-3)",
              fontSize: 11,
              fontWeight: 600,
              lineHeight: 1,
            }}
          >
            ?
          </span>
        </span>
      ) : (
        label
      )}
      {children}
    </label>
  );
}

/** Status/role badge chip, colors given as design-token keys. */
export function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span
      style={{
        fontSize: 13,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        padding: "3px 8px",
        borderRadius: 2,
        color: `var(--${color})`,
        background: `var(--${bg})`,
      }}
    >
      {label}
    </span>
  );
}

