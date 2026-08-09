import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
  staticFile,
  Img,
  Sequence,
} from "remotion";
import { z } from "zod";

export const heroSchema = z.object({
  accentColor: z.string(),
  baseDelay: z.number(),
});

type HeroProps = z.infer<typeof heroSchema>;

// 8 个技能标签 — 与作品集当前一致
const SKILL_TAGS = [
  { icon: "📷", label: "摄影摄像", angle: -90 },     // top
  { icon: "▲", label: "海报设计", angle: -45 },      // top-right
  { icon: "▶", label: "视频脚本", angle: 0 },         // right
  { icon: "✨", label: "AI 创作", angle: 45 },        // bottom-right
  { icon: "★", label: "PS · AE", angle: 90 },        // bottom
  { icon: "♦", label: "数据复盘", angle: 135 },      // bottom-left
  { icon: "#", label: "TikTok", angle: 180 },        // left
  { icon: "✎", label: "创意脚本", angle: -135 },     // top-left
];

// 缓动函数
const easeOutCubic = Easing.bezier(0.16, 1, 0.3, 1);
const easeOutBack = Easing.bezier(0.34, 1.56, 0.64, 1);

// 单个技能标签
const SkillTag: React.FC<{
  tag: { icon: string; label: string; angle: number };
  index: number;
  accentColor: string;
  delay: number;
  radius: number;
}> = ({ tag, index, accentColor, delay, radius }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 入场动画：每 5 帧一个标签，依次飞入
  const myStart = delay + index * 5;
  const localFrame = Math.max(0, frame - myStart);
  const enterP = spring({
    frame: localFrame,
    fps,
    config: { damping: 14, stiffness: 90, mass: 0.6 },
  });
  const enter = frame < myStart ? 0 : enterP;

  // 最终位置（极坐标）
  const rad = (tag.angle * Math.PI) / 180;
  const finalX = Math.cos(rad) * radius;
  const finalY = Math.sin(rad) * radius;

  // 入场：从中心向外飞出，初始略偏移 + 旋转
  const fromRadius = radius * 0.05;
  const startX = Math.cos(rad) * fromRadius;
  const startY = Math.sin(rad) * fromRadius;
  const x = interpolate(enter, [0, 1], [startX, finalX]);
  const y = interpolate(enter, [0, 1], [startY, finalY]);
  const scale = interpolate(enter, [0, 0.5, 1], [0.4, 1.08, 1]);
  const rotate = interpolate(enter, [0, 1], [tag.angle * 0.3, 0]);
  const opacity = interpolate(enter, [0, 0.4], [0, 1]);

  return (
    <div
      style={{
        position: "absolute",
        left: `calc(50% + ${x}px - 60px)`,
        top: `calc(50% + ${y}px - 24px)`,
        width: 120,
        height: 48,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "0 16px",
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: `1.5px solid ${accentColor}`,
        borderRadius: 999,
        boxShadow: `0 6px 20px ${accentColor}33`,
        fontSize: 18,
        fontWeight: 600,
        color: "#1a1a1a",
        opacity,
        transform: `scale(${scale}) rotate(${rotate}deg)`,
        fontFamily:
          '"Inter", "PingFang SC", "Microsoft YaHei", sans-serif',
        letterSpacing: 0.5,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ fontSize: 16, color: accentColor }}>{tag.icon}</span>
      <span>{tag.label}</span>
    </div>
  );
};

// 中心装饰圈
const CenterOrbit: React.FC<{
  accentColor: string;
  enterFrame: number;
  radius: number;
}> = ({ accentColor, enterFrame, radius }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = Math.max(0, frame - enterFrame);
  const enter = spring({
    frame: localFrame,
    fps,
    config: { damping: 18, stiffness: 80, mass: 0.8 },
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const dashOffset = interpolate(enter, [0, 1], [400, 0]);
  const slowRotation = interpolate(frame, [0, 360], [0, 360]);

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: radius * 2,
        height: radius * 2,
        transform: `translate(-50%, -50%) rotate(${slowRotation * 0.3}deg)`,
        opacity,
      }}
    >
      <svg width={radius * 2} height={radius * 2} viewBox="0 0 1000 1000">
        <circle
          cx="500"
          cy="500"
          r="498"
          stroke={accentColor}
          strokeWidth="1"
          fill="none"
          strokeDasharray="6 8"
          strokeDashoffset={dashOffset}
          opacity="0.55"
        />
        <circle
          cx="500"
          cy="500"
          r="498"
          stroke={accentColor}
          strokeWidth="0.5"
          fill="none"
          opacity="0.25"
        />
      </svg>
    </div>
  );
};

// 标题文字揭示
const TitleReveal: React.FC<{
  text: string;
  frame: number;
  startFrame: number;
  duration: number;
  size: number;
  italic?: boolean;
  color?: string;
  family?: string;
}> = ({ text, frame, startFrame, duration, size, italic, color = "#1a1a1a", family }) => {
  const localFrame = Math.max(0, frame - startFrame);
  if (frame < startFrame) {
    return <span style={{ opacity: 0 }}>{text}</span>;
  }
  const charCount = text.length;
  const charsPerFrame = duration / charCount;
  const revealedChars = Math.min(
    charCount,
    Math.floor(localFrame / charsPerFrame),
  );
  const lastCharP = Math.max(
    0,
    Math.min(1, (localFrame - revealedChars * charsPerFrame) / charsPerFrame),
  );

  // 整体位移
  const rise = interpolate(localFrame, [0, duration], [20, 0], {
    extrapolateRight: "clamp",
    easing: easeOutCubic,
  });
  const opacity = interpolate(localFrame, [0, 12, duration], [0, 1, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "relative",
        fontSize: size,
        fontWeight: 900,
        fontStyle: italic ? "italic" : "normal",
        letterSpacing: -0.02 * size,
        lineHeight: 1,
        fontFamily: family,
        transform: `translateY(${rise}px)`,
        opacity,
        color,
      }}
    >
      {text.split("").map((c, i) => {
        const isRevealed = i < revealedChars;
        const isLastChar = i === revealedChars;
        const charOpacity = isRevealed
          ? 1
          : isLastChar
          ? lastCharP
          : 0;
        const charY = isRevealed
          ? 0
          : isLastChar
          ? (1 - lastCharP) * 24
          : 24;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: charOpacity,
              transform: `translateY(${charY}px)`,
              transition: "none",
            }}
          >
            {c}
          </span>
        );
      })}
    </div>
  );
};

// 网格背景
const GridBackground: React.FC<{ accentColor: string }> = ({
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 360], [0, -40]);
  const enter = interpolate(frame, [0, 50], [0, 1], {
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: enter * 0.5,
        backgroundImage: `linear-gradient(${accentColor}33 1px, transparent 1px), linear-gradient(90deg, ${accentColor}33 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
        transform: `translate(${drift}px, ${drift}px)`,
        maskImage:
          "radial-gradient(ellipse 80% 60% at 50% 50%, black 0%, transparent 80%)",
        WebkitMaskImage:
          "radial-gradient(ellipse 80% 60% at 50% 50%, black 0%, transparent 80%)",
      }}
    />
  );
};

// 背景装饰光斑
const GlowOrbs: React.FC<{ accentColor: string; enterFrame: number }> = ({
  accentColor,
  enterFrame,
}) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 60], [0, 1], {
    extrapolateRight: "clamp",
  });
  const orb1X = interpolate(frame, [0, 360], [0, 40], { extrapolateRight: "clamp" });
  const orb1Y = interpolate(frame, [0, 360], [0, -30], { extrapolateRight: "clamp" });
  const orb2X = interpolate(frame, [0, 360], [0, -30], { extrapolateRight: "clamp" });
  const orb2Y = interpolate(frame, [0, 360], [0, 40], { extrapolateRight: "clamp" });
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 120,
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accentColor}25 0%, transparent 70%)`,
          filter: "blur(40px)",
          opacity: enter,
          transform: `translate(${orb1X}px, ${orb1Y}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 60,
          bottom: 60,
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accentColor}1c 0%, transparent 70%)`,
          filter: "blur(40px)",
          opacity: enter,
          transform: `translate(${orb2X}px, ${orb2Y}px)`,
        }}
      />
    </>
  );
};

// IP 角色剪影装饰
const IPSilhouette: React.FC<{
  enterFrame: number;
  accentColor: string;
}> = ({ enterFrame, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = Math.max(0, frame - enterFrame);
  const enter = spring({
    frame: localFrame,
    fps,
    config: { damping: 18, stiffness: 70, mass: 0.9 },
  });
  const opacity = interpolate(enter, [0, 1], [0, 0.18]);
  const rise = interpolate(enter, [0, 1], [40, 0]);
  // 微动呼吸
  const breath = Math.sin(localFrame * 0.06) * 4;
  if (frame < enterFrame) {
    return null;
  }
  return (
    <div
      style={{
        position: "absolute",
        right: 80,
        top: "50%",
        width: 240,
        height: 240,
        transform: `translateY(calc(-50% + ${rise + breath}px))`,
        opacity,
        pointerEvents: "none",
      }}
    >
      <Img
        src={staticFile("ip-silhouette.png")}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
      {/* 角色底座发光圆 */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 200,
          height: 200,
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          border: `1.5px solid ${accentColor}`,
          opacity: 0.3,
          boxShadow: `0 0 40px ${accentColor}55`,
        }}
      />
    </div>
  );
};

// 主组件
export const HeroAnimation: React.FC<HeroProps> = ({
  accentColor,
  baseDelay,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const orbitRadius = Math.min(width, height) * 0.34;

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #fafafa 0%, #f0f0f0 100%)",
        fontFamily:
          '"Inter", "PingFang SC", "Microsoft YaHei", sans-serif',
        overflow: "hidden",
      }}
    >
      {/* 顶部装饰 — "PORTFOLIO · 2026" */}
      <div
        style={{
          position: "absolute",
          left: 60,
          top: 40,
          opacity: interpolate(frame, [0, 30], [0, 1], {
            extrapolateRight: "clamp",
          }),
          transform: `translateX(${interpolate(frame, [0, 30], [-12, 0], {
            extrapolateRight: "clamp",
          })}px)`,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 50,
            height: 1.5,
            background: accentColor,
          }}
        />
        <span
          style={{
            fontSize: 13,
            letterSpacing: 4,
            color: "#666",
            fontWeight: 600,
          }}
        >
          PORTFOLIO · 2026
        </span>
      </div>

      {/* 网格背景 */}
      <GridBackground accentColor={accentColor} />

      {/* 光斑 */}
      <GlowOrbs accentColor={accentColor} enterFrame={10} />

      {/* 中心轨道 */}
      <CenterOrbit accentColor={accentColor} enterFrame={45} radius={orbitRadius} />

      {/* 标题：罗子欣 */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "26%",
          transform: "translate(-50%, 0)",
          textAlign: "center",
        }}
      >
        <TitleReveal
          text="罗子欣"
          frame={frame}
          startFrame={20}
          duration={50}
          size={Math.min(150, width * 0.13)}
          italic={false}
          color="#111"
        />
      </div>

      {/* 副标题：创意内容创作者 */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "47%",
          transform: "translate(-50%, 0)",
          textAlign: "center",
          display: "flex",
          alignItems: "baseline",
          gap: 16,
        }}
      >
        <span
          style={{
            fontSize: 56,
            fontWeight: 800,
            fontStyle: "italic",
            background: `linear-gradient(135deg, ${accentColor} 0%, #ff8a5c 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            opacity: interpolate(frame, [50, 90], [0, 1], {
              extrapolateRight: "clamp",
              extrapolateLeft: "clamp",
            }),
            transform: `translateX(${interpolate(frame, [50, 90], [-30, 0], {
              extrapolateRight: "clamp",
              extrapolateLeft: "clamp",
            })}px)`,
          }}
        >
          创意
        </span>
        <span
          style={{
            fontSize: 56,
            fontWeight: 900,
            color: "#1a1a1a",
            letterSpacing: -1.5,
            opacity: interpolate(frame, [60, 100], [0, 1], {
              extrapolateRight: "clamp",
              extrapolateLeft: "clamp",
            }),
            transform: `translateX(${interpolate(frame, [60, 100], [30, 0], {
              extrapolateRight: "clamp",
              extrapolateLeft: "clamp",
            })}px)`,
          }}
        >
          内容创作者
        </span>
      </div>

      {/* IP 角色剪影 */}
      <IPSilhouette enterFrame={90} accentColor={accentColor} />

      {/* 技能标签 */}
      {SKILL_TAGS.map((tag, i) => (
        <SkillTag
          key={i}
          tag={tag}
          index={i}
          accentColor={accentColor}
          delay={120}
          radius={orbitRadius + 40}
        />
      ))}

      {/* 底部信息 */}
      <div
        style={{
          position: "absolute",
          left: 60,
          bottom: 36,
          opacity: interpolate(frame, [180, 220], [0, 1], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
          }),
          transform: `translateX(${interpolate(frame, [180, 220], [-12, 0], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
          })}px)`,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: "#999",
            letterSpacing: 3,
            fontWeight: 600,
          }}
        >
          CREATIVE PORTFOLIO
        </span>
        <span style={{ fontSize: 22, fontWeight: 700, color: "#222" }}>
          罗子欣 · 创意宇宙
        </span>
      </div>

      {/* 右下：LZX logo 收尾 */}
      <div
        style={{
          position: "absolute",
          right: 50,
          bottom: 36,
          opacity: interpolate(frame, [240, 280], [0, 1], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
          }),
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: accentColor,
            boxShadow: `0 0 12px ${accentColor}`,
          }}
        />
        <span
          style={{
            fontSize: 13,
            color: "#666",
            letterSpacing: 6,
            fontWeight: 700,
          }}
        >
          L · Z · X
        </span>
      </div>

      {/* 顶部中央时间码 - 动漫片头风格 */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 8,
          transform: "translateX(-50%)",
          fontSize: 10,
          color: "#bbb",
          letterSpacing: 4,
          fontFamily: "monospace",
          opacity: interpolate(frame, [0, 360], [0.4, 1]),
        }}
      >
        EP / 01    {`PORTFOLIO.LZX.2026`}    {`RUNTIME 12:00`}
      </div>
    </AbsoluteFill>
  );
};
