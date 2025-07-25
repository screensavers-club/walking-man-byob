import {
  SupportedModels,
  createDetector,
  type MediaPipeHandsMediaPipeModelConfig,
  type HandDetector,
} from "@tensorflow-models/hand-pose-detection";
import { useEffect, useRef, useState } from "react";

/* CONFIG */

const STEP_THRESHOLD = 20;

/* CONFIG */
declare global {
  interface WindowEventMap {
    "finger-step": CustomEvent<{ stepDiff: number }>;
  }
}

const model = SupportedModels.MediaPipeHands;

const detectorConfig: MediaPipeHandsMediaPipeModelConfig = {
  runtime: "mediapipe",
  solutionPath: "/hands",
  modelType: "full",
};

export const HandPoseDetection = () => {
  const handCamRef = useRef<HTMLVideoElement>(null);
  const detectorRef = useRef<HandDetector>(null);
  const [init, setInit] = useState(false);

  useEffect(() => {
    if (!init) {
      setInit(() => true);
      return;
    }
    const handCamVideo = handCamRef.current!;

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((mediastream) => {
        handCamVideo.srcObject = mediastream;
      })
      .then(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(null);
          }, 1000);
        });
      })
      .then(() => {
        createDetector(model, detectorConfig).then((detector) => {
          detectorRef.current = detector;
        });
      });
  }, [init]);

  useEffect(function loop() {
    let rafId: number;

    const frame = () => {
      if (detectorRef.current !== null) {
        detectorRef.current.estimateHands(handCamRef.current!).then((hands) => {
          const hand = hands.at(0);
          if (hand === undefined) {
            //
          } else {
            const fingerIndex = hand.keypoints.find(
              (a) => a.name === "index_finger_tip"
            );
            const fingerMiddle = hand.keypoints.find(
              (a) => a.name === "middle_finger_tip"
            );

            if (fingerIndex === undefined || fingerMiddle === undefined) {
              //
            } else {
              const dYFingers = fingerIndex.y - fingerMiddle.y;

              if (Math.abs(dYFingers) < STEP_THRESHOLD) {
                // neutral
              } else {
                window.dispatchEvent(
                  new CustomEvent("finger-step", {
                    detail: { stepDiff: dYFingers },
                  })
                );
              }
            }
          }
          rafId = requestAnimationFrame(frame);
        });
      } else {
        rafId = requestAnimationFrame(frame);
      }
    };

    frame();

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      style={{
        width: "140px",
        aspectRatio: "1",
        position: "fixed",
        top: "8px",
        right: "8px",
        objectFit: "cover",
        overflow: "hidden",
        borderRadius: "100%",
        zIndex: 450,
      }}
    >
      <video
        id="hand_camera"
        ref={handCamRef}
        autoPlay
        style={{
          aspectRatio: "4 / 3",
          height: "100%",
          display: "block",
          position: "absolute",
          left: "50%",
          transform: "translate(-50%, 0)",
        }}
      />
    </div>
  );
};
