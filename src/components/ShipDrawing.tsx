import type { ShipId } from "../types";
export default function ShipDrawing({
  id,
  color = "#e39a65",
}: {
  id: ShipId;
  color?: string;
}) {
  if (id === "speedboat") return (
    <svg className="ship-drawing" viewBox="0 0 320 130" aria-hidden="true">
      <defs>
        <linearGradient id="vector-hull" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#159bc4" />
          <stop offset="1" stopColor="#103957" />
        </linearGradient>
      </defs>
      <path d="M12 110 Q58 103 100 110 T200 110 T309 110" fill="none" stroke="#9bb7bd" opacity=".5" />
      <path d="M17 78 Q89 82 147 77 L264 81 L277 90 L257 105 H82 Q45 99 17 78Z" fill="url(#vector-hull)" stroke="#315b70" strokeWidth="1.3" />
      <path d="M20 79 L144 77 L157 83 L50 88Z" fill="#eef4f1" />
      <path d="M24 80 L142 79 L148 82 L41 84Z" fill="#ef7d32" />
      <path d="M159 81 L175 57 L209 56 L237 80Z" fill="#14384c" stroke="#528197" strokeWidth="1.2" />
      <path d="M162 78 L177 59 L189 58 L189 78Z" fill="#69bfce" opacity=".6" />
      <path d="M190 57 L190 79 M175 58 L170 79" stroke="#b1c8ca" strokeWidth="1.1" />
      <path d="M203 80 L205 68 Q206 63 212 64 L219 66 L219 81 M231 82 L231 70 Q232 65 238 66 L244 69 L244 84" fill="#e9eeeb" stroke="#8ba3a7" />
      <path d="M208 69 L216 70 L216 77 L207 77 M234 71 L240 72 L241 79 L233 79" fill="#1a3a4f" />
      <path d="M228 84 H277 L287 91 H261" fill="#edf1ed" stroke="#71949c" />
      <path d="M41 89 Q151 92 267 89 L263 94 Q144 97 57 92Z" fill={color} />
      <path d="M61 98 H252" stroke="#e9f3f2" strokeWidth="1.2" opacity=".6" />
      <g fill="#19303e" stroke="#617d8a" strokeWidth="1.1">
        <path d="M269 76 Q280 72 289 78 L290 96 L286 108 L279 108 L279 96 L270 91Z" />
        <path d="M283 72 Q294 69 302 75 L304 94 L299 109 L293 109 L293 95 L284 91Z" />
      </g>
      <path d="M271 81 L287 84 M286 77 L301 80" stroke={color} strokeWidth="2.4" />
      <path d="M281 109 L289 109 M294 110 L302 110" stroke="#b9cdce" strokeWidth="2" />
      <text x="181" y="103" fontSize="7" fontWeight="700" letterSpacing="1.2" textAnchor="middle" fill="#e8f3f2">VECTOR 38</text>
    </svg>
  );
  if (id === "spirit") return (
    <svg className="ship-drawing" viewBox="0 0 320 130" aria-hidden="true">
      <defs>
        <linearGradient id="spirit-shell" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#b9c8d0" />
        </linearGradient>
      </defs>
      <path d="M12 108 Q67 102 116 108 T224 108 T307 108" fill="none" stroke="#9bb7bd" opacity=".5" />
      <path d="M14 99 L69 84 L131 78 L277 78 L290 88 L283 100 Z" fill="url(#spirit-shell)" stroke="#829b9e" />
      <path d="M43 99 L81 83 L153 85 L169 97 L149 105 L42 105 Z" fill="#e9eff0" stroke="#829b9e" />
      <path d="M127 80 Q136 59 161 60 L260 64 Q286 65 288 82 Z" fill="url(#spirit-shell)" stroke="#829b9e" />
      <path d="M235 66 L251 31 L275 31 L272 67 Z" fill="#f2f3ee" stroke="#829b9e" />
      <path d="M221 32 Q216 26 225 25 L296 25 Q305 28 296 32 Z" fill="#edf1ef" stroke="#829b9e" />
      <path d="M256 40 l2 5 5 1 -4 3 1 5 -4 -3 -5 2 2 -5 -3 -4 5 1 Z" fill="#cb3544" />
      <path d="M90 81 L107 66 L124 66 L132 80 Z" fill="#0e344b" />
      <path d="M91 81 L106 65 L113 65 L110 80 Z" fill="#acdce8" opacity=".8" />
      <path d="M115 79 L115 65 L123 65 L127 79" fill="#186aba" />
      <ellipse cx="137" cy="74" rx="7" ry="13" fill="#243640" stroke="#eaf0ee" strokeWidth="4" />
      <ellipse cx="286" cy="79" rx="5" ry="9" fill="#17262f" stroke="#a8b7bf" strokeWidth="2" />
      <text x="198" y="94" fontSize="7" fontWeight="700" textAnchor="middle" fill="#263c47">SPIRIT OF AUSTRALIA</text>
      <text x="68" y="99" fontSize="6" fontWeight="800" fill="#19394f">KW21</text>
      <path d="M31 101 H137" stroke={color} strokeWidth="2" />
    </svg>
  );
  return (
    <svg className="ship-drawing" viewBox="0 0 320 130" aria-hidden="true">
      <defs>
        <linearGradient id={`hull-${id}`} x2="0" y2="1">
          <stop stopColor="#f6f4ea" />
          <stop offset="1" stopColor="#c6d6d5" />
        </linearGradient>
      </defs>
      <path
        d="M15 111 Q55 104 94 111 T180 111 T302 111"
        fill="none"
        stroke="#9bb7bd"
        opacity=".5"
      />
      <path
        d="M34 83 L275 83 L247 105 L60 105 Z"
        fill={`url(#hull-${id})`}
        stroke="#829b9e"
        strokeWidth="1.5"
      />
      <path d="M37 89 L267 89 L259 94 L45 94 Z" fill={color} />
      {id === "launch" ? (
        <>
          <path d="M94 80 L125 55 L157 55 L181 80" fill="#2c4a55" />
          <path
            d="M60 83 L71 71 L102 71 L96 83 M181 83 L196 71 L234 74 L250 83"
            fill="#ecded0"
          />
        </>
      ) : id === "cargo" ? (
        <>
          <path d="M52 81 V43 H95 V81" fill="#e8e9e2" />
          <path d="M61 48 H91 V58 H61" fill="#365864" />
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <rect
                x={108 + i * 33}
                y="59"
                width="30"
                height="23"
                fill={i % 2 ? "#bc775b" : "#668985"}
                stroke="#304b56"
              />
              <path
                d={`M${113 + i * 33} 60v21m7-21v21m7-21v21`}
                stroke="#ffffff30"
              />
            </g>
          ))}
          <path d="M108 57 V35 H169 V57 M177 57 V35 H239 V57" fill="#899b85" />
        </>
      ) : id === "tug" ? (
        <>
          <path d="M100 83 V43 H174 V83 M109 43 V30 H164 V43" fill="#e8d9b8" />
          <path d="M108 50 H167 V64 H108" fill="#345966" />
          <path d="M193 78 V45 H207 V78" fill={color} />
          {[65, 89, 205, 231].map((x) => (
            <circle
              key={x}
              cx={x}
              cy="89"
              r="7"
              fill="#253c43"
              stroke="#617980"
            />
          ))}
        </>
      ) : id === "fishing" ? (
        <>
          <path d="M138 83 V44 H202 V83" fill="#e9e8db" />
          <path d="M146 49 H196 V62 H146" fill="#345966" />
          <path
            d="M104 82 V23 L68 74 M105 36 H231 L241 78"
            fill="none"
            stroke="#bcc5bb"
            strokeWidth="4"
          />
          <path d="M217 42 L232 71 L215 76" fill="none" stroke="#829b9e" />
          <rect x="65" y="70" width="57" height="12" fill={color} />
        </>
      ) : (
        <>
          <path d="M89 82 L112 55 H192 L214 82 Z" fill="#f6f3e9" />
          <path d="M112 62 H187 L201 75 H103 Z" fill="#2f505e" />
          <path d="M123 55 L135 40 H172 L185 55" fill="#f7f5ea" />
          <path
            d="M145 41 V22 L172 40"
            fill="none"
            stroke="#e4e6dd"
            strokeWidth="3"
          />
        </>
      )}
      <path
        d="M50 78 H262 M56 78 V69 M86 78 V69 M230 78 V69 M256 78 V69"
        fill="none"
        stroke="#bdd0cf"
        strokeWidth="1.5"
      />
      <path d="M281 70 V39 M281 40 l18 8 -18 8" fill={color} stroke={color} />
    </svg>
  );
}
