import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
  forwardRef,
  useMemo,
  Suspense,
  type JSX,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  useGLTF,
  useAnimations,
  PerspectiveCamera,
  useMatcapTexture,
} from "@react-three/drei";
import * as THREE from "three";
import { Effect } from "postprocessing";
import { EffectComposer } from "@react-three/postprocessing";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";

const fragmentShader = `
uniform sampler2D colorRamp;

vec3 greyscale(vec3 color, float strength) {
    float g = dot(color, vec3(0.299, 0.587, 0.114));
    return mix(color, vec3(g), strength);
}

vec3 greyscale(vec3 color) {
    return greyscale(color, 1.0);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
	vec4 c = texture2D(inputBuffer, uv);
	vec4 targetC = texture2D(colorRamp, vec2(c.r, max(c.b, c.g)));
	outputColor = mix(targetC, c, c.r);
}`;

// Effect implementation
class MyCustomEffectImpl extends Effect {
  constructor() {
    super("MyCustomEffect", fragmentShader, {
      uniforms: new Map<string, THREE.Uniform>([
        ["param", new THREE.Uniform(0.1)],
        ["colorRamp", new THREE.Uniform(new THREE.Texture())],
      ]),
    });

    this.uniforms.get("colorRamp")!.value = new THREE.TextureLoader().load(
      "/ramp.jpg"
    );
  }

  update() {
    //this.uniforms.get("param")!.value = _uParam;
  }
}

// Effect component
export const MyCustomEffect = forwardRef<unknown, { x: number }>(({}, ref) => {
  const effect = useMemo(() => new MyCustomEffectImpl(), []);
  return <primitive ref={ref} object={effect} dispose={null} />;
});

export const Scene: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [things, setThings] = useState<JSX.Element[]>([]);
  const { nodes, materials } = useGLTF("/things.glb");

  useEffect(() => {
    const pool = [
      { name: "brinjal" },
      { name: "beer" },
      { name: "milo" },
      { name: "maling" },
      { name: "pokka1", material: "pokka_bottle" },
      { name: "pokka2", material: "pokka_bottle" },
      { name: "pokka3", material: "pokka_bottle" },
      { name: "pokka4", material: "pokka_bottle" },
      { name: "pokka5", material: "pokka_bottle" },
      { name: "shin" },
      { name: "apple", collider: "ball" as const },
      { name: "calbee" },
      { name: "cup_noodles", material: "cup_noodles" },
      { name: "kranch_1", material: "kranch" },
      { name: "wiper_sheet", material: "wipe" },
      { name: "oatside-1", material: "oatside" },
      { name: "genmaicha", material: "genmaicha" },
      { name: "yoghurt" },
    ].map((item) => (
      <RigidBody
        position={[progress + 5.2, 5, 0]}
        key={Math.floor(Math.random() * 2000)}
        name={`thing_${Math.floor(Math.random() * 2000)}`}
        colliders={item?.collider}
      >
        <mesh
          // @ts-ignore
          geometry={nodes[item.name].geometry}
          material={materials[item.material ?? item.name]}
        />
      </RigidBody>
    ));

    if (Math.random() > 0.98 && things.length < 20) {
      const r = Math.floor(pool.length * Math.random());
      const newThing = { ...pool[r] };

      setThings((a) => [...a, newThing]);
    }
  }, [progress, things]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "fixed",
        zIndex: "3",
        top: 0,
        left: 0,
      }}
    >
      <Canvas
        onCreated={(state) => {
          const renderer = state.gl;
          renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
        }}
      >
        <Suspense>
          <Physics gravity={[0, -5, 0]}>
            <PerspectiveCamera
              makeDefault
              position={[progress, 0, 8]}
              lookAt={[progress, 2, 0]}
            />
            <EffectComposer>
              <MyCustomEffect x={3} />
            </EffectComposer>
            <ambientLight color="#fff" intensity={1.5} />
            <pointLight
              color="#fff"
              power={100}
              position={[progress, 3, 2]}
              castShadow
            />

            <pointLight
              color="#fff"
              power={100}
              position={[progress - 5, 3, 2]}
              castShadow
            />
            <pointLight
              color="#fff"
              power={100}
              position={[progress + 5, 3, 2]}
              castShadow
            />
            <HandModel setProgress={setProgress} progress={progress} />
            <CuboidCollider
              position={[progress - 0.2, 0.75, 0]}
              rotation={[0, 0.3, 0]}
              args={[0.5, 1, 0.5]}
            />

            <mesh position={[progress, 0, 0]} rotation={[Math.PI / -2, 0, 0]}>
              <planeGeometry args={[10, 5]} />
              <meshBasicMaterial color="#000" />
            </mesh>
            <CuboidCollider
              position={[progress, 1.25, -2.8]}
              rotation={[Math.PI / -2, 0, 0]}
              args={[5, 0.1, 2.5]}
            />

            <mesh position={[progress, 2.5, -2.5]} rotation={[0, 0, 0]}>
              <planeGeometry args={[15, 5]} />
              <meshBasicMaterial color="#000" />
            </mesh>

            <CuboidCollider
              position={[progress, -0.1, 0]}
              args={[7.5, 0.1, 2.5]}
            />

            <CuboidCollider
              name="floor"
              position={[progress, -4, 0]}
              args={[30, 0.5, 20]}
              sensor={true}
              onIntersectionEnter={(a) => {
                const name = a.other.rigidBodyObject?.name;

                setThings((a) =>
                  a.filter((thing) => thing.props.name !== name)
                );
              }}
            ></CuboidCollider>

            {things}
          </Physics>
        </Suspense>
      </Canvas>
      <div
        style={{
          background: "#000",
          color: "#fff",
          position: "fixed",
          fontSize: "28px",
          top: "8px",
          left: "16px",
        }}
        className="score"
      >
        {Math.floor(progress * 100) / 1000}m
      </div>
    </div>
  );
};

const HandModel = (props: {
  progress: number;
  setProgress: Dispatch<SetStateAction<number>>;
}) => {
  const { progress, setProgress } = props;

  const [targetProgress, setTargetProgress] = useState(0);

  const group = useRef(null);
  const { nodes, animations } = useGLTF("/hand.glb");
  const { actions } = useAnimations(animations, group);
  const [handProg, setHandProg] = useState(0);
  const [tex] = useMatcapTexture("926B48_4C2D0D_5F3913_AA8874");

  const [nextStep, setNextStep] = useState<"flip" | "flop">("flip");
  const [stepDiff, setStepDiff] = useState(0);

  useEffect(() => {
    if (nextStep === "flip") {
      if (stepDiff > 0) {
        setTargetProgress((a) => a + 1);
        setNextStep(() => "flop");
      }
    } else {
      if (stepDiff < 0) {
        setTargetProgress((a) => a + 1);
        setNextStep(() => "flip");
      }
    }
  }, [stepDiff, nextStep]);

  useEffect(() => {
    const handler = (e: CustomEvent<{ stepDiff: number }>) => {
      setStepDiff(() => e.detail.stepDiff);
    };

    window.addEventListener("finger-step", handler);
    return () => {
      window.removeEventListener("finger-step", handler);
    };
  }, []);

  useFrame(() => {
    setProgress((a) => a + Math.floor(100 * ((targetProgress - a) / 20)) / 100);

    const dProg = Math.abs(handProg - progress);
    if (handProg < progress && dProg > 0.5) {
      actions?.["rig.001"]?.play();
      actions["rig.001"]!.paused = false;

      const speed = Math.max(1, dProg / 2);
      actions?.["rig.001"]?.setEffectiveTimeScale(speed * 2);
      setHandProg((a) => a + 0.1 * speed);
    } else {
      actions["rig.001"]!.paused = true;
    }
  });

  useEffect(() => {
    if (actions === null) {
      return;
    }
    actions?.["rig.001"]?.play();
  }, [actions]);

  return (
    <group ref={group} position={[progress, 0, 0]} dispose={null}>
      <group name="Scene">
        <group
          name="rig"
          position={[0, 0, 0]}
          rotation={[0, Math.PI / 2.5, 0]}
          scale={1}
        >
          <skinnedMesh
            name="mesh-ori"
            // @ts-expect-error -- hahha
            geometry={nodes["mesh-ori"].geometry}
            // @ts-expect-error -- hahha
            skeleton={nodes["mesh-ori"].skeleton}
          >
            {/*	<meshBasicMaterial color="#ff0" />*/}
            <meshMatcapMaterial matcap={tex} />
          </skinnedMesh>
          <primitive object={nodes.root} />
          <primitive object={nodes["MCH-torsoparent"]} />
          <primitive object={nodes["MCH-hand_ikparentL"]} />
          <primitive object={nodes["MCH-upper_arm_ik_targetparentL"]} />
          <primitive object={nodes["MCH-hand_ikparentR"]} />
          <primitive object={nodes["MCH-upper_arm_ik_targetparentR"]} />
          <primitive object={nodes["MCH-foot_ikparentL"]} />
          <primitive object={nodes["MCH-thigh_ik_targetparentL"]} />
          <primitive object={nodes["MCH-foot_ikparentR"]} />
          <primitive object={nodes["MCH-thigh_ik_targetparentR"]} />
        </group>
      </group>
    </group>
  );
};

useGLTF.preload("/The Walking Hand.glb");
