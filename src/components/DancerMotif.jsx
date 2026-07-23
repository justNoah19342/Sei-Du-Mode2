import styles from "./DancerMotif.module.css";

/*
  Signature element: an abstract, hand-drawn silhouette echoing the leap in the
  brand mark's dancer figure — not a trace of the logo artwork itself, just the
  gesture. Used once per view, very low opacity, bleeding off an edge.
*/
export default function DancerMotif({ className = "" }) {
  return (
    <svg
      className={`${styles.motif} ${className}`}
      viewBox="0 0 200 260"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M100 10
           C 112 10 122 20 122 34
           C 122 45 116 52 108 56
           C 118 62 132 68 148 62
           C 158 58 166 48 172 38
           C 176 44 176 54 170 64
           C 160 80 140 88 122 84
           C 128 96 132 112 128 130
           C 124 150 108 162 118 182
           C 126 198 148 202 160 218
           C 168 228 168 240 158 248
           C 148 240 140 226 126 216
           C 112 206 96 202 88 186
           C 80 170 86 152 82 134
           C 78 118 64 108 58 92
           C 48 98 34 108 30 124
           C 26 138 32 150 24 160
           C 18 152 16 138 20 124
           C 26 104 44 92 60 82
           C 52 74 46 62 48 48
           C 50 32 64 18 82 12
           C 88 10 94 10 100 10 Z"
      />
    </svg>
  );
}
