import GradientBackground from './GradientBackground';

export default function Bubble({ color = '#EF9F27', size = 260, style = {} }) {
  return (
    <>
      <style>{`
        @keyframes bubble-float {
          0% {
            border-radius: 42% 58% 65% 35% / 45% 45% 55% 55%;
            transform: translate(0, 0) scale(1);
          }
          33% {
            border-radius: 60% 40% 30% 70% / 55% 60% 40% 45%;
            transform: translate(20px, -30px) scale(1.06);
          }
          66% {
            border-radius: 35% 65% 55% 45% / 40% 55% 45% 60%;
            transform: translate(-18px, 22px) scale(0.96);
          }
          100% {
            border-radius: 42% 58% 65% 35% / 45% 45% 55% 55%;
            transform: translate(0, 0) scale(1);
          }
        }
      `}</style>
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          width: size,
          height: size,
          background: color,
          animation: 'bubble-float 7s ease-in-out infinite',
          ...style,
        }}
      >
        <GradientBackground
          style={{ position: 'absolute', inset: 0, mixBlendMode: 'soft-light', opacity: 0.7 }}
        />
      </div>
    </>
  );
}
