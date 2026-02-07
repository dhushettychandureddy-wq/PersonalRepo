import { useState, useEffect, useCallback, useRef } from "react";
import image1 from "./assets/image@.png";
import image2 from "./assets/image@@.png";

function App() {
  const [noButtonPosition, setNoButtonPosition] = useState({ x: 0, y: 0 });
  const [showSuccess, setShowSuccess] = useState(false);
  const [hearts, setHearts] = useState<
    Array<{ id: number; left: number; delay: number; duration: number }>
  >([]);
  const [noAttempts, setNoAttempts] = useState(0);
  const [currentMessage, setCurrentMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [noButtonAnimation, setNoButtonAnimation] = useState("");
  const [isMoving, setIsMoving] = useState(false);
  const [showFirstImage, setShowFirstImage] = useState(false);
  const pointerRef = useRef({ x: 0, y: 0 });

  const getSafePadding = useCallback(() => {
    const styles = getComputedStyle(document.documentElement);
    const safeTop = parseFloat(styles.getPropertyValue("--safe-top")) || 0;
    const safeRight = parseFloat(styles.getPropertyValue("--safe-right")) || 0;
    const safeBottom =
      parseFloat(styles.getPropertyValue("--safe-bottom")) || 0;
    const safeLeft = parseFloat(styles.getPropertyValue("--safe-left")) || 0;

    const dynamicX = Math.min(28, Math.max(12, window.innerWidth * 0.04));
    const dynamicY = Math.min(28, Math.max(12, window.innerHeight * 0.04));

    const padX = Math.max(dynamicX, safeLeft, safeRight);
    const padY = Math.max(dynamicY, safeTop, safeBottom);

    return { padX, padY };
  }, []);

  const messages = [
    "This shy guy is asking... please don't say no 🥺",
    "He's looking at you—give love a chance ❤️",
    "He looks so nervous... are you really sure? 💔",
    "His heart might break if you say no 😢",
    "He promises he'll make you smile 😊",
    "You're too special to lose 💕",
    "He's blushing—just click YES already 😍",
    "Think of all the fun you'll have together! 🎉",
  ];

  useEffect(() => {
    const newHearts = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 2,
    }));
    setHearts(newHearts);
  }, []);

  const moveNoButton = useCallback(() => {
    if (isMoving) return;

    setIsMoving(true);
    const newAttempts = noAttempts + 1;
    setNoAttempts(newAttempts);
    setShowFirstImage(true);

    // Show random message
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    setCurrentMessage(randomMessage);
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 2000);

    // Add random animation
    const animations = ["rotate-shake", "bounce-crazy", "shrink-grow"];
    const randomAnimation =
      animations[Math.floor(Math.random() * animations.length)];
    setNoButtonAnimation(randomAnimation);
    setTimeout(() => setNoButtonAnimation(""), 500);

    // Move button to random position within viewport bounds and away from pointer
    const buttonElement = document.getElementById("no-button");
    const rect = buttonElement?.getBoundingClientRect();
    const buttonWidth = rect?.width ?? 180;
    const buttonHeight = rect?.height ?? 60;
    const { padX, padY } = getSafePadding();

    // Use visualViewport for better mobile support, fallback to window dimensions
    const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;

    // Add extra padding to ensure button stays well within bounds
    const extraPadding = 20;
    const minX = padX + extraPadding;
    const minY = padY + extraPadding;
    // Limit maxX to 600px to keep button on left side of screen
    const maxX = Math.min(600, Math.max(minX, viewportWidth - buttonWidth - padX - extraPadding));
    const maxY = Math.max(minY, viewportHeight - buttonHeight - padY - extraPadding);

    const distanceFromPointer = (x: number, y: number) => {
      const { x: px, y: py } = pointerRef.current;
      const cx = x + buttonWidth / 2;
      const cy = y + buttonHeight / 2;
      return Math.hypot(cx - px, cy - py);
    };

    const targetDistance = 140; // keep away from pointer/finger
    let newX = minX + Math.random() * Math.max(1, maxX - minX);
    let newY = minY + Math.random() * Math.max(1, maxY - minY);

    // Retry a few times to avoid landing under the pointer/finger
    let attempts = 0;
    while (distanceFromPointer(newX, newY) < targetDistance && attempts < 8) {
      newX = minX + Math.random() * Math.max(1, maxX - minX);
      newY = minY + Math.random() * Math.max(1, maxY - minY);
      attempts += 1;
    }

    // Final clamp to ensure button never goes outside viewport
    newX = Math.max(minX, Math.min(newX, maxX));
    newY = Math.max(minY, Math.min(newY, maxY));

    setNoButtonPosition({ x: newX, y: newY });

    // Allow next move after animation completes
    setTimeout(() => setIsMoving(false), 400);
  }, [getSafePadding, isMoving, noAttempts, messages]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      pointerRef.current = { x: e.clientX, y: e.clientY };
      if (showSuccess || isMoving) return;

      const buttonElement = document.getElementById("no-button");
      if (!buttonElement) return;

      const rect = buttonElement.getBoundingClientRect();
      const buttonCenterX = rect.left + rect.width / 2;
      const buttonCenterY = rect.top + rect.height / 2;

      const distance = Math.hypot(
        e.clientX - buttonCenterX,
        e.clientY - buttonCenterY,
      );

      if (distance < 150) {
        moveNoButton();
      }
    };

    if (!showSuccess) {
      window.addEventListener("mousemove", handleMouseMove);
    }

    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [showSuccess, isMoving, moveNoButton]);

  // Track touch proximity and avoid jumping directly under the finger (mobile)
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (!e.touches?.length) return;
      const { clientX, clientY } = e.touches[0];
      pointerRef.current = { x: clientX, y: clientY };

      if (showSuccess || isMoving) return;

      const buttonElement = document.getElementById("no-button");
      if (!buttonElement) return;

      const rect = buttonElement.getBoundingClientRect();
      const buttonCenterX = rect.left + rect.width / 2;
      const buttonCenterY = rect.top + rect.height / 2;

      const distance = Math.hypot(
        clientX - buttonCenterX,
        clientY - buttonCenterY,
      );

      // For touch, use a slightly larger buffer to avoid moving under the finger
      if (distance < 180) {
        moveNoButton();
      }
    };

    if (!showSuccess) {
      window.addEventListener("touchstart", handleTouchStart, {
        passive: true,
      });
    }

    return () =>
      window.removeEventListener(
        "touchstart",
        handleTouchStart as EventListener,
      );
  }, [showSuccess, isMoving, moveNoButton]);

  const handleYesClick = () => {
    setShowSuccess(true);
  };

  return (
    <div className="min-h-screen max-h-screen bg-gradient-to-br from-pink-100 via-red-50 to-rose-100 flex items-center justify-center overflow-hidden relative px-3 sm:px-6 py-6 sm:py-10 fixed inset-0">
      {hearts.map((heart) => (
        <div
          key={heart.id}
          className="absolute text-pink-300 opacity-40 animate-float pointer-events-none"
          style={{
            left: `${heart.left}%`,
            animationDelay: `${heart.delay}s`,
            animationDuration: `${heart.duration}s`,
            fontSize: "24px",
          }}
        >
          ❤️
        </div>
      ))}

      <div className="text-center z-10 px-3 sm:px-4 w-full max-w-3xl">
        {!showSuccess ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-6 sm:p-8 md:p-12 max-w-lg w-full mx-auto animate-fade-in">
            {showFirstImage && (
              <div className="mb-6">
                <img
                  src={image1}
                  alt="Shy character"
                  className="w-44 h-44 sm:w-56 sm:h-56 md:w-64 md:h-64 mx-auto object-contain animate-pulse"
                />
              </div>
            )}

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-red-600 mb-4">
              Happy Valentine's Day Abhi❤️
            </h1>

            <p className="text-xl sm:text-2xl md:text-3xl text-rose-700 font-semibold mb-8">
              Will you be my Valentine?
            </p>

            {showMessage && (
              <div className="mb-4 animate-fade-in">
                <p className="text-lg sm:text-2xl font-bold text-rose-600 animate-bounce">
                  {currentMessage}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center relative">
              <button
                onClick={handleYesClick}
                className={`min-w-[140px] sm:min-w-[160px] max-w-[240px] bg-gradient-to-r from-pink-500 to-red-500 text-white font-bold rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-500 flex items-center justify-center gap-2 ${
                  noAttempts >= 5
                    ? "px-10 sm:px-12 py-5 sm:py-6 text-2xl sm:text-3xl animate-pulse"
                    : "px-6 sm:px-8 py-3.5 sm:py-4 text-lg sm:text-xl"
                }`}
                style={{
                  transform: noAttempts >= 5 ? "scale(1.2)" : "scale(1)",
                  transition: "all 0.5s ease-in-out",
                }}
              >
                ✅ Yes ❤️
              </button>

              <button
                id="no-button"
                onMouseEnter={moveNoButton}
                onTouchStart={moveNoButton}
                onClick={moveNoButton}
                className={`min-w-[140px] sm:min-w-[160px] max-w-[240px] px-6 sm:px-8 py-3.5 sm:py-4 bg-gray-200 text-gray-700 text-lg sm:text-xl font-bold rounded-full shadow-lg transition-all flex items-center justify-center gap-2 ${noButtonAnimation}`}
                style={{
                  position: noButtonPosition.x === 0 ? "relative" : "fixed",
                  left:
                    noButtonPosition.x === 0
                      ? "auto"
                      : `${noButtonPosition.x}px`,
                  top:
                    noButtonPosition.x === 0
                      ? "auto"
                      : `${noButtonPosition.y}px`,
                  transition:
                    noAttempts >= 5
                      ? "all 0.65s ease-out"
                      : "all 0.45s ease-out",
                  zIndex: 50,
                  pointerEvents: "auto",
                }}
              >
                ❌ No 💔
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-6 sm:p-8 md:p-12 max-w-lg w-full mx-auto animate-scale-in">
            <div className="mb-6">
              <img
                src={image2}
                alt="Happy couple"
                className="w-44 h-44 sm:w-56 sm:h-56 md:w-64 md:h-64 mx-auto object-contain animate-bounce"
              />
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-red-600 mt-6 mb-4">
              Yay! You made my day ❤️
            </h2>

            <p className="text-lg sm:text-xl text-rose-600 font-medium">
              I'm so happy you said yes Abhi❤️!
            </p>

            <div className="mt-8 flex justify-center gap-4 animate-bounce-in">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className="text-4xl animate-spin-slow"
                  style={{ animationDelay: `${i * 0.2}s` }}
                >
                  💖
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
